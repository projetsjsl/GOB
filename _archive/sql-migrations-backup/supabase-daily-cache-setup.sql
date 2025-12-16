-- ============================================================================
-- TABLE: daily_market_cache
-- Description: Cache quotidien pour les données de marché qui changent peu
--              pendant la journée (top movers, indices, nouvelles, etc.)
-- ============================================================================

-- Créer la table daily_market_cache
CREATE TABLE IF NOT EXISTS daily_market_cache (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    cache_type TEXT NOT NULL,
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    update_times TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contrainte unique : une seule entrée par date + cache_type
    CONSTRAINT unique_date_cache_type UNIQUE (date, cache_type)
);

-- Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_daily_market_cache_date ON daily_market_cache(date);
CREATE INDEX IF NOT EXISTS idx_daily_market_cache_type ON daily_market_cache(cache_type);
CREATE INDEX IF NOT EXISTS idx_daily_market_cache_date_type ON daily_market_cache(date, cache_type);
CREATE INDEX IF NOT EXISTS idx_daily_market_cache_updated_at ON daily_market_cache(updated_at);

-- Fonction pour nettoyer les anciens caches (> 2 jours)
CREATE OR REPLACE FUNCTION cleanup_old_daily_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM daily_market_cache
    WHERE date < CURRENT_DATE - INTERVAL '2 days';
    
    RAISE NOTICE 'Nettoyage des caches quotidiens : % lignes supprimées', ROW_COUNT;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir ou créer une entrée de cache
CREATE OR REPLACE FUNCTION get_or_create_cache(
    p_date DATE,
    p_cache_type TEXT,
    p_data JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Essayer de récupérer le cache existant
    SELECT data INTO v_result
    FROM daily_market_cache
    WHERE date = p_date AND cache_type = p_cache_type;
    
    -- Si pas de cache et données fournies, créer l'entrée
    IF v_result IS NULL AND p_data IS NOT NULL THEN
        INSERT INTO daily_market_cache (date, cache_type, data)
        VALUES (p_date, p_cache_type, p_data)
        ON CONFLICT (date, cache_type)
        DO UPDATE SET
            data = EXCLUDED.data,
            updated_at = NOW()
        RETURNING data INTO v_result;
    END IF;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour le cache
CREATE OR REPLACE FUNCTION update_daily_cache(
    p_date DATE,
    p_cache_type TEXT,
    p_data JSONB
)
RETURNS void AS $$
BEGIN
    INSERT INTO daily_market_cache (date, cache_type, data, updated_at)
    VALUES (p_date, p_cache_type, p_data, NOW())
    ON CONFLICT (date, cache_type)
    DO UPDATE SET
        data = EXCLUDED.data,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier si le cache est récent (< 2 heures)
CREATE OR REPLACE FUNCTION is_cache_recent(
    p_date DATE,
    p_cache_type TEXT,
    p_max_age_hours INTEGER DEFAULT 2
)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated_at TIMESTAMP WITH TIME ZONE;
    v_is_recent BOOLEAN;
BEGIN
    SELECT updated_at INTO v_updated_at
    FROM daily_market_cache
    WHERE date = p_date AND cache_type = p_cache_type;
    
    IF v_updated_at IS NULL THEN
        RETURN FALSE;
    END IF;
    
    v_is_recent := (NOW() - v_updated_at) < (p_max_age_hours || ' hours')::INTERVAL;
    RETURN v_is_recent;
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur la table et les colonnes
COMMENT ON TABLE daily_market_cache IS 'Cache quotidien pour les données de marché (top movers, indices, nouvelles, analyses Gemini, etc.)';
COMMENT ON COLUMN daily_market_cache.date IS 'Date du jour pour lequel le cache est valide';
COMMENT ON COLUMN daily_market_cache.cache_type IS 'Type de cache : top_movers, market_indices, sector_performance, general_news, ticker_news, stock_data, gemini_analysis, etc.';
COMMENT ON COLUMN daily_market_cache.data IS 'Données en cache au format JSONB';
COMMENT ON COLUMN daily_market_cache.updated_at IS 'Dernière mise à jour du cache';
COMMENT ON COLUMN daily_market_cache.update_times IS 'Moments de mise à jour prévus (ex: [''09:30'', ''12:00'', ''16:00''])';

-- Exemple d'utilisation :
-- SELECT * FROM daily_market_cache WHERE date = CURRENT_DATE AND cache_type = 'top_movers';
-- SELECT is_cache_recent(CURRENT_DATE, 'top_movers', 2); -- Vérifie si cache < 2h
-- SELECT get_or_create_cache(CURRENT_DATE, 'top_movers', '{"gainers": [], "losers": []}'::JSONB);
-- SELECT update_daily_cache(CURRENT_DATE, 'top_movers', '{"gainers": [...], "losers": [...]}'::JSONB);

