-- Table pour stocker les configurations de l'application (remplace le hardcoding)
CREATE TABLE IF NOT EXISTS app_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key TEXT UNIQUE NOT NULL,
    config_category TEXT NOT NULL, -- 'cache', 'batch', 'sync', 'defaults', 'validation', 'ui'
    config_value JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_app_config_key ON app_config(config_key);
CREATE INDEX IF NOT EXISTS idx_app_config_category ON app_config(config_category);
CREATE INDEX IF NOT EXISTS idx_app_config_active ON app_config(is_active) WHERE is_active = true;

-- Insertion des configurations par défaut
INSERT INTO app_config (config_key, config_category, config_value, description) VALUES
-- Cache
('cache_max_age_ms', 'cache', '300000'::jsonb, 'Durée de vie du cache local en millisecondes (5 minutes)'),
('cache_storage_key', 'cache', '"finance_pro_profiles"'::jsonb, 'Clé de stockage pour le cache local'),

-- Batch sizes
('profile_batch_size', 'batch', '5'::jsonb, 'Taille du batch pour sauvegarde de profils'),
('api_batch_size', 'batch', '20'::jsonb, 'Taille du batch pour appels API FMP'),
('sync_batch_size', 'batch', '50'::jsonb, 'Taille du batch pour synchronisation'),

-- Sync delays
('delay_between_batches_ms', 'sync', '2000'::jsonb, 'Délai entre batches en millisecondes (2 secondes)'),
('max_sync_time_ms', 'sync', '1800000'::jsonb, 'Timeout global de synchronisation (30 minutes)'),
('ticker_timeout_ms', 'sync', '60000'::jsonb, 'Timeout par ticker (60 secondes)'),

-- API limits
('snapshots_limit', 'api', '2000'::jsonb, 'Limite de snapshots à charger'),
('tickers_limit', 'api', '1000'::jsonb, 'Limite de tickers à charger'),

-- Default ticker
('default_ticker', 'defaults', '"ACN"'::jsonb, 'Ticker par défaut à charger au démarrage'),

-- Market cap thresholds
('market_cap_small_min', 'ui', '300000000'::jsonb, 'Capitalisation minimale pour "small cap" (300M)'),
('market_cap_small_max', 'ui', '2000000000'::jsonb, 'Capitalisation maximale pour "small cap" (2B)'),
('market_cap_mid_min', 'ui', '2000000000'::jsonb, 'Capitalisation minimale pour "mid cap" (2B)'),
('market_cap_mid_max', 'ui', '10000000000'::jsonb, 'Capitalisation maximale pour "mid cap" (10B)'),
('market_cap_large_min', 'ui', '10000000000'::jsonb, 'Capitalisation minimale pour "large cap" (10B)'),
('market_cap_large_max', 'ui', '200000000000'::jsonb, 'Capitalisation maximale pour "large cap" (200B)'),
('market_cap_mega_min', 'ui', '200000000000'::jsonb, 'Capitalisation minimale pour "mega cap" (200B+)'),

-- Cache sizes
('recommendation_cache_max', 'cache', '1000'::jsonb, 'Taille maximale du cache de recommandations'),

-- Guardrail defaults (sera remplacé par validation_settings)
('guardrail_growth_min', 'validation', '-50'::jsonb, 'Croissance minimale par défaut'),
('guardrail_growth_max', 'validation', '50'::jsonb, 'Croissance maximale par défaut'),
('guardrail_pe_min', 'validation', '1'::jsonb, 'P/E ratio minimal par défaut'),
('guardrail_pe_max', 'validation', '100'::jsonb, 'P/E ratio maximal par défaut'),
('guardrail_pcf_min', 'validation', '1'::jsonb, 'P/CF ratio minimal par défaut'),
('guardrail_pcf_max', 'validation', '100'::jsonb, 'P/CF ratio maximal par défaut'),
('guardrail_pbv_min', 'validation', '0.5'::jsonb, 'P/BV ratio minimal par défaut'),
('guardrail_pbv_max', 'validation', '50'::jsonb, 'P/BV ratio maximal par défaut'),
('guardrail_yield_min', 'validation', '0.1'::jsonb, 'Yield minimal par défaut'),
('guardrail_yield_max', 'validation', '20'::jsonb, 'Yield maximal par défaut')
ON CONFLICT (config_key) DO NOTHING;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_app_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_app_config_updated_at
    BEFORE UPDATE ON app_config
    FOR EACH ROW
    EXECUTE FUNCTION update_app_config_updated_at();

-- RLS (Row Level Security) - permettre lecture publique, écriture admin seulement
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON app_config
    FOR SELECT
    USING (true);

CREATE POLICY "Allow admin write access" ON app_config
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );
