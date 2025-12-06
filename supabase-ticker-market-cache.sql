-- ============================================================================
-- TABLE: ticker_price_cache
-- Description: Cache LÉGER pour les PRIX UNIQUEMENT (pas les ratios/métriques)
--              Synchronisé uniquement quand nécessaire (beta-dashboard, 3p1 prix)
--              Réduit l'egress Supabase en évitant les appels FMP répétés
-- ============================================================================

-- Créer la table ticker_price_cache (PRIX UNIQUEMENT)
CREATE TABLE IF NOT EXISTS ticker_price_cache (
    ticker TEXT PRIMARY KEY,
    
    -- PRIX UNIQUEMENT (mises à jour fréquentes si nécessaire)
    current_price DECIMAL(12,2),
    change_percent DECIMAL(8,4),
    change_amount DECIMAL(12,2),
    volume BIGINT,
    market_cap BIGINT,
    
    -- Métadonnées
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '15 minutes',
    source TEXT DEFAULT 'fmp',  -- 'fmp', 'finnhub', etc.
    
    -- Index pour performance
    CONSTRAINT ticker_price_cache_ticker_key UNIQUE (ticker)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_ticker_price_cache_expires ON ticker_price_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_ticker_price_cache_updated ON ticker_price_cache(updated_at DESC);

-- Fonction pour nettoyer les caches expirés (> 1 heure)
CREATE OR REPLACE FUNCTION cleanup_expired_ticker_price_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM ticker_price_cache
    WHERE expires_at < NOW() - INTERVAL '1 hour';
    
    RAISE NOTICE 'Nettoyage des caches prix expirés : % lignes supprimées', ROW_COUNT;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les PRIX uniquement (avec vérification expiration)
CREATE OR REPLACE FUNCTION get_ticker_price_data(p_ticker TEXT)
RETURNS TABLE (
    ticker TEXT,
    current_price DECIMAL,
    change_percent DECIMAL,
    change_amount DECIMAL,
    volume BIGINT,
    market_cap BIGINT,
    is_fresh BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tpc.ticker,
        tpc.current_price,
        tpc.change_percent,
        tpc.change_amount,
        tpc.volume,
        tpc.market_cap,
        (tpc.expires_at > NOW()) as is_fresh
    FROM ticker_price_cache tpc
    WHERE tpc.ticker = UPPER(p_ticker)
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour upsert batch PRIX UNIQUEMENT (utilisée par le job batch)
CREATE OR REPLACE FUNCTION upsert_ticker_price_cache_batch(p_data JSONB)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_item JSONB;
BEGIN
    -- Parcourir chaque élément du JSONB array
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_data)
    LOOP
        INSERT INTO ticker_price_cache (
            ticker,
            current_price,
            change_percent,
            change_amount,
            volume,
            market_cap,
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
            updated_at = NOW(),
            expires_at = NOW() + INTERVAL '15 minutes',
            source = EXCLUDED.source;
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Commentaires
COMMENT ON TABLE ticker_price_cache IS 'Cache LÉGER pour les PRIX UNIQUEMENT (pas les ratios/métriques). Synchronisé uniquement quand nécessaire (beta-dashboard, 3p1 prix). Réduit l''egress Supabase.';
COMMENT ON COLUMN ticker_price_cache.expires_at IS 'Date d''expiration du cache (15 minutes par défaut). Après expiration, les données sont considérées comme stale.';
COMMENT ON COLUMN ticker_price_cache.is_fresh IS 'Indique si les données sont encore fraîches (expires_at > NOW())';

-- Exemple d'utilisation :
-- SELECT * FROM get_ticker_price_data('AAPL');
-- SELECT upsert_ticker_price_cache_batch('[{"symbol":"AAPL","price":150.5,"changePercent":1.2,...}]'::JSONB);

