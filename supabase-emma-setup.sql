-- ============================================================================
-- Configuration Supabase pour Emma Function Calling System
-- ============================================================================
-- Ce script crée toutes les tables nécessaires pour le système Emma
-- Exécuter dans l'éditeur SQL de Supabase
-- ============================================================================

-- Table 1: Team Tickers (Tickers d'équipe)
-- ============================================================================
CREATE TABLE IF NOT EXISTS team_tickers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticker VARCHAR(10) NOT NULL UNIQUE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    priority INTEGER DEFAULT 1,
    notes TEXT
);

-- Policies pour team_tickers (SANS IF NOT EXISTS)
CREATE POLICY "Allow read access to all" ON team_tickers FOR SELECT USING (true);
CREATE POLICY "Allow insert for authenticated users" ON team_tickers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for authenticated users" ON team_tickers FOR UPDATE USING (true);
CREATE POLICY "Allow delete for authenticated users" ON team_tickers FOR DELETE USING (true);

-- Enable RLS
ALTER TABLE team_tickers ENABLE ROW LEVEL SECURITY;

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_team_tickers_ticker ON team_tickers(ticker);
CREATE INDEX IF NOT EXISTS idx_team_tickers_priority ON team_tickers(priority DESC);

-- Table 2: Seeking Alpha Data (Données scrapées)
-- ============================================================================
CREATE TABLE IF NOT EXISTS seeking_alpha_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticker VARCHAR(10) NOT NULL,
    raw_text TEXT NOT NULL,
    url TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ticker, timestamp)
);

-- Policies pour seeking_alpha_data
CREATE POLICY "Allow read access to all" ON seeking_alpha_data FOR SELECT USING (true);
CREATE POLICY "Allow insert for authenticated users" ON seeking_alpha_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for authenticated users" ON seeking_alpha_data FOR UPDATE USING (true);

-- Enable RLS
ALTER TABLE seeking_alpha_data ENABLE ROW LEVEL SECURITY;

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_seeking_alpha_ticker ON seeking_alpha_data(ticker);
CREATE INDEX IF NOT EXISTS idx_seeking_alpha_timestamp ON seeking_alpha_data(timestamp DESC);

-- Table 3: Briefings History (Historique des emails Emma En Direct)
-- ============================================================================
CREATE TABLE IF NOT EXISTS briefings_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('morning', 'midday', 'evening')),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    content TEXT NOT NULL,
    sent_status VARCHAR(20) DEFAULT 'pending' CHECK (sent_status IN ('pending', 'success', 'error')),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    tools_used JSONB,
    execution_time_ms INTEGER
);

-- Policies pour briefings_history
CREATE POLICY "Allow read access to all" ON briefings_history FOR SELECT USING (true);
CREATE POLICY "Allow insert for authenticated users" ON briefings_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for authenticated users" ON briefings_history FOR UPDATE USING (true);

-- Enable RLS
ALTER TABLE briefings_history ENABLE ROW LEVEL SECURITY;

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_briefings_type ON briefings_history(type);
CREATE INDEX IF NOT EXISTS idx_briefings_generated_at ON briefings_history(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_briefings_sent_status ON briefings_history(sent_status);

-- Table 4: Populate Configs (Configurations pour population des onglets)
-- ============================================================================
CREATE TABLE IF NOT EXISTS populate_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tab_name VARCHAR(50) NOT NULL UNIQUE CHECK (tab_name IN ('stocks-news', 'jlab', 'watchlist')),
    config_json JSONB NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0
);

-- Policies pour populate_configs
CREATE POLICY "Allow read access to all" ON populate_configs FOR SELECT USING (true);
CREATE POLICY "Allow insert for authenticated users" ON populate_configs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for authenticated users" ON populate_configs FOR UPDATE USING (true);

-- Enable RLS
ALTER TABLE populate_configs ENABLE ROW LEVEL SECURITY;

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_populate_configs_tab_name ON populate_configs(tab_name);
CREATE INDEX IF NOT EXISTS idx_populate_configs_last_updated ON populate_configs(last_updated DESC);

-- ============================================================================
-- Vues utiles pour analyses
-- ============================================================================

-- Vue: Dernières données Seeking Alpha par ticker
CREATE OR REPLACE VIEW latest_seeking_alpha AS
SELECT DISTINCT ON (ticker) 
    id, ticker, raw_text, url, timestamp
FROM seeking_alpha_data
ORDER BY ticker, timestamp DESC;

-- Vue: Statistiques des briefings
CREATE OR REPLACE VIEW briefings_stats AS
SELECT 
    type,
    COUNT(*) as total_count,
    COUNT(CASE WHEN sent_status = 'success' THEN 1 END) as success_count,
    COUNT(CASE WHEN sent_status = 'error' THEN 1 END) as error_count,
    AVG(execution_time_ms) as avg_execution_time_ms,
    MAX(generated_at) as last_generated_at
FROM briefings_history
GROUP BY type;

-- ============================================================================
-- Fonction: Obtenir les tickers actifs avec priorité
-- ============================================================================
CREATE OR REPLACE FUNCTION get_active_team_tickers()
RETURNS TABLE (ticker VARCHAR, priority INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT t.ticker, t.priority
    FROM team_tickers t
    ORDER BY t.priority DESC, t.ticker ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Fonction: Nettoyer les anciennes données Seeking Alpha (garde les 30 derniers jours)
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_old_seeking_alpha_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM seeking_alpha_data
    WHERE timestamp < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Fonction: Nettoyer les anciens briefings (garde les 90 derniers jours)
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_old_briefings()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM briefings_history
    WHERE generated_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Fin du script de configuration
-- ============================================================================

-- Afficher un message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Configuration Supabase Emma completed successfully!';
    RAISE NOTICE 'Tables created: team_tickers, seeking_alpha_data, briefings_history, populate_configs';
    RAISE NOTICE 'Views created: latest_seeking_alpha, briefings_stats';
    RAISE NOTICE 'Functions created: get_active_team_tickers(), cleanup_old_seeking_alpha_data(), cleanup_old_briefings()';
END $$;

