-- ============================================================================
-- TABLE: ticker_market_cache
-- Description: Cache pour les données de marché par ticker (prix, ratios, métriques)
--              Réduit l'egress Supabase en évitant les appels FMP répétés
-- ============================================================================

-- Créer la table ticker_market_cache
CREATE TABLE IF NOT EXISTS ticker_market_cache (
    ticker TEXT PRIMARY KEY,
    
    -- Données de marché (mises à jour toutes les 5-15 min)
    current_price DECIMAL(12,2),
    change_percent DECIMAL(8,4),
    change_amount DECIMAL(12,2),
    volume BIGINT,
    market_cap BIGINT,
    
    -- Ratios clés (calculés depuis FMP)
    pe_ratio DECIMAL(10,2),
    pcf_ratio DECIMAL(10,2),
    pbv_ratio DECIMAL(10,2),
    dividend_yield DECIMAL(6,4),
    
    -- Métriques additionnelles (optionnelles, pour réduire egress)
    eps DECIMAL(10,2),
    revenue BIGINT,
    net_income BIGINT,
    
    -- Métadonnées
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '15 minutes',
    source TEXT DEFAULT 'fmp',  -- 'fmp', 'finnhub', etc.
    
    -- Index pour performance
    CONSTRAINT ticker_market_cache_ticker_key UNIQUE (ticker)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_ticker_market_cache_expires ON ticker_market_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_ticker_market_cache_updated ON ticker_market_cache(updated_at DESC);

-- Fonction pour nettoyer les caches expirés (> 1 heure)
CREATE OR REPLACE FUNCTION cleanup_expired_ticker_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM ticker_market_cache
    WHERE expires_at < NOW() - INTERVAL '1 hour';
    
    RAISE NOTICE 'Nettoyage des caches expirés : % lignes supprimées', ROW_COUNT;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les données de marché (avec vérification expiration)
CREATE OR REPLACE FUNCTION get_ticker_market_data(p_ticker TEXT)
RETURNS TABLE (
    ticker TEXT,
    current_price DECIMAL,
    change_percent DECIMAL,
    volume BIGINT,
    pe_ratio DECIMAL,
    pcf_ratio DECIMAL,
    pbv_ratio DECIMAL,
    dividend_yield DECIMAL,
    is_fresh BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tmc.ticker,
        tmc.current_price,
        tmc.change_percent,
        tmc.volume,
        tmc.pe_ratio,
        tmc.pcf_ratio,
        tmc.pbv_ratio,
        tmc.dividend_yield,
        (tmc.expires_at > NOW()) as is_fresh
    FROM ticker_market_cache tmc
    WHERE tmc.ticker = UPPER(p_ticker)
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour upsert batch (utilisée par le job batch)
CREATE OR REPLACE FUNCTION upsert_ticker_market_cache_batch(p_data JSONB)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_item JSONB;
BEGIN
    -- Parcourir chaque élément du JSONB array
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_data)
    LOOP
        INSERT INTO ticker_market_cache (
            ticker,
            current_price,
            change_percent,
            change_amount,
            volume,
            market_cap,
            pe_ratio,
            pcf_ratio,
            pbv_ratio,
            dividend_yield,
            eps,
            revenue,
            net_income,
            updated_at,
            expires_at,
            source
        )
        VALUES (
            UPPER(v_item->>'symbol'),
            (v_item->>'price')::DECIMAL,
            (v_item->>'changePercent')::DECIMAL,
            (v_item->>'change')::DECIMAL,
            (v_item->>'volume')::BIGINT,
            (v_item->>'marketCap')::BIGINT,
            (v_item->>'pe')::DECIMAL,
            (v_item->>'pcf')::DECIMAL,
            (v_item->>'pbv')::DECIMAL,
            (v_item->>'dividendYield')::DECIMAL,
            (v_item->>'eps')::DECIMAL,
            (v_item->>'revenue')::BIGINT,
            (v_item->>'netIncome')::BIGINT,
            NOW(),
            NOW() + INTERVAL '15 minutes',
            'fmp'
        )
        ON CONFLICT (ticker)
        DO UPDATE SET
            current_price = EXCLUDED.current_price,
            change_percent = EXCLUDED.change_percent,
            change_amount = EXCLUDED.change_amount,
            volume = EXCLUDED.volume,
            market_cap = EXCLUDED.market_cap,
            pe_ratio = EXCLUDED.pe_ratio,
            pcf_ratio = EXCLUDED.pcf_ratio,
            pbv_ratio = EXCLUDED.pbv_ratio,
            dividend_yield = EXCLUDED.dividend_yield,
            eps = EXCLUDED.eps,
            revenue = EXCLUDED.revenue,
            net_income = EXCLUDED.net_income,
            updated_at = NOW(),
            expires_at = NOW() + INTERVAL '15 minutes',
            source = EXCLUDED.source;
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Commentaires
COMMENT ON TABLE ticker_market_cache IS 'Cache pour les données de marché par ticker (prix, ratios, métriques). Réduit l''egress Supabase en évitant les appels FMP répétés.';
COMMENT ON COLUMN ticker_market_cache.expires_at IS 'Date d''expiration du cache (15 minutes par défaut). Après expiration, les données sont considérées comme stale.';
COMMENT ON COLUMN ticker_market_cache.is_fresh IS 'Indique si les données sont encore fraîches (expires_at > NOW())';

-- Exemple d'utilisation :
-- SELECT * FROM get_ticker_market_data('AAPL');
-- SELECT upsert_ticker_market_cache_batch('[{"symbol":"AAPL","price":150.5,...}]'::JSONB);

