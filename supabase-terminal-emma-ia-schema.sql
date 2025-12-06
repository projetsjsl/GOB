-- ============================================
-- Terminal Emma IA - Schéma Supabase
-- ============================================
-- Ce schéma définit les tables pour le module Terminal Emma IA
-- avec intégration FMP Premier → Supabase → Frontend

-- ============================================
-- 1. Table: instruments
-- ============================================
CREATE TABLE IF NOT EXISTS instruments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT NOT NULL UNIQUE,
    name TEXT,
    exchange TEXT,
    country TEXT,
    currency TEXT DEFAULT 'USD',
    sector TEXT,
    industry TEXT,
    market_cap NUMERIC,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_instruments_symbol ON instruments(symbol);
CREATE INDEX IF NOT EXISTS idx_instruments_sector ON instruments(sector);
CREATE INDEX IF NOT EXISTS idx_instruments_country ON instruments(country);

-- ============================================
-- 2. Table: fmp_raw_cache (cache brut FMP)
-- ============================================
CREATE TABLE IF NOT EXISTS fmp_raw_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT NOT NULL,
    endpoint TEXT NOT NULL, -- ex: 'key-metrics-ttm', 'ratios', 'ohlc_daily'
    payload JSONB NOT NULL,
    as_of DATE,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE(symbol, endpoint, as_of)
);

CREATE INDEX IF NOT EXISTS idx_fmp_cache_symbol_endpoint ON fmp_raw_cache(symbol, endpoint);
CREATE INDEX IF NOT EXISTS idx_fmp_cache_fetched_at ON fmp_raw_cache(fetched_at);

-- ============================================
-- 3. Table: metrics (métriques atomiques calculées)
-- ============================================
CREATE TABLE IF NOT EXISTS metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT NOT NULL REFERENCES instruments(symbol) ON DELETE CASCADE,
    metric_code TEXT NOT NULL, -- ex: 'ROIC_TTM', 'FCF_YIELD', 'RSI_14D'
    value NUMERIC,
    as_of DATE NOT NULL,
    period TEXT, -- 'TTM', 'FY2024', 'Q3-2024', etc.
    meta JSONB, -- métadonnées additionnelles
    computed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(symbol, metric_code, as_of, period)
);

CREATE INDEX IF NOT EXISTS idx_metrics_symbol_code ON metrics(symbol, metric_code);
CREATE INDEX IF NOT EXISTS idx_metrics_as_of ON metrics(as_of);
CREATE INDEX IF NOT EXISTS idx_metrics_symbol_as_of ON metrics(symbol, as_of);

-- ============================================
-- 4. Table: kpi_definitions (définitions de KPI)
-- ============================================
CREATE TABLE IF NOT EXISTS kpi_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE, -- ex: 'QUALITY_SCORE_V1'
    expression TEXT NOT NULL, -- formule de calcul
    description TEXT,
    tags TEXT[],
    category TEXT, -- 'Quality', 'Value', 'Momentum', 'ESG', etc.
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_by UUID REFERENCES auth.users(id),
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kpi_definitions_code ON kpi_definitions(code);
CREATE INDEX IF NOT EXISTS idx_kpi_definitions_category ON kpi_definitions(category);
CREATE INDEX IF NOT EXISTS idx_kpi_definitions_active ON kpi_definitions(is_active);

-- ============================================
-- 5. Table: kpi_variables (variables utilisées dans les KPI)
-- ============================================
CREATE TABLE IF NOT EXISTS kpi_variables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_id UUID NOT NULL REFERENCES kpi_definitions(id) ON DELETE CASCADE,
    variable_name TEXT NOT NULL, -- ex: 'ROIC_TTM', 'FCF_YIELD'
    metric_code TEXT NOT NULL, -- lien vers metrics.metric_code
    transform JSONB, -- instructions de transformation (ex: CAGR, moyenne)
    weight NUMERIC DEFAULT 1.0, -- poids dans le calcul
    order_index INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kpi_variables_kpi_id ON kpi_variables(kpi_id);
CREATE INDEX IF NOT EXISTS idx_kpi_variables_metric_code ON kpi_variables(metric_code);

-- ============================================
-- 6. Table: kpi_values (valeurs calculées des KPI)
-- ============================================
CREATE TABLE IF NOT EXISTS kpi_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_id UUID NOT NULL REFERENCES kpi_definitions(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL REFERENCES instruments(symbol) ON DELETE CASCADE,
    value NUMERIC,
    as_of DATE NOT NULL,
    inputs_snapshot JSONB, -- valeurs des variables au moment du calcul
    computed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(kpi_id, symbol, as_of)
);

CREATE INDEX IF NOT EXISTS idx_kpi_values_kpi_symbol ON kpi_values(kpi_id, symbol);
CREATE INDEX IF NOT EXISTS idx_kpi_values_symbol_as_of ON kpi_values(symbol, as_of);
CREATE INDEX IF NOT EXISTS idx_kpi_values_as_of ON kpi_values(as_of);

-- ============================================
-- 7. Table: watchlists
-- ============================================
CREATE TABLE IF NOT EXISTS watchlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON watchlists(user_id);

-- ============================================
-- 8. Table: watchlist_instruments
-- ============================================
CREATE TABLE IF NOT EXISTS watchlist_instruments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    watchlist_id UUID NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL REFERENCES instruments(symbol) ON DELETE CASCADE,
    position INTEGER DEFAULT 0, -- ordre d'affichage
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(watchlist_id, symbol)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_instruments_watchlist ON watchlist_instruments(watchlist_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_instruments_symbol ON watchlist_instruments(symbol);

-- ============================================
-- 9. Table: job_logs (logs d'ingestion FMP)
-- ============================================
CREATE TABLE IF NOT EXISTS job_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type TEXT NOT NULL, -- 'fmp_sync', 'kpi_compute', etc.
    status TEXT NOT NULL, -- 'success', 'error', 'running'
    symbol TEXT,
    endpoint TEXT,
    records_processed INTEGER DEFAULT 0,
    error_message TEXT,
    execution_time_ms INTEGER,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_job_logs_job_type ON job_logs(job_type);
CREATE INDEX IF NOT EXISTS idx_job_logs_status ON job_logs(status);
CREATE INDEX IF NOT EXISTS idx_job_logs_started_at ON job_logs(started_at);

-- ============================================
-- 10. Table: market_indices (indices de référence)
-- ============================================
CREATE TABLE IF NOT EXISTS market_indices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT NOT NULL UNIQUE, -- ex: 'SPY', '^GSPC', '^TSX'
    name TEXT NOT NULL,
    country TEXT,
    currency TEXT DEFAULT 'USD',
    current_value NUMERIC,
    daily_change NUMERIC,
    daily_change_pct NUMERIC,
    ytd_change_pct NUMERIC,
    as_of DATE NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(symbol, as_of)
);

CREATE INDEX IF NOT EXISTS idx_market_indices_symbol_as_of ON market_indices(symbol, as_of);

-- ============================================
-- 11. Table: price_history (historique des prix)
-- ============================================
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT NOT NULL REFERENCES instruments(symbol) ON DELETE CASCADE,
    date DATE NOT NULL,
    open NUMERIC,
    high NUMERIC,
    low NUMERIC,
    close NUMERIC,
    volume BIGINT,
    adjusted_close NUMERIC,
    UNIQUE(symbol, date)
);

CREATE INDEX IF NOT EXISTS idx_price_history_symbol_date ON price_history(symbol, date);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON price_history(date);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fmp_raw_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_indices ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour instruments (lecture publique, écriture admin)
CREATE POLICY "Instruments are viewable by everyone" ON instruments
    FOR SELECT USING (true);

CREATE POLICY "Instruments are insertable by authenticated users" ON instruments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Politiques RLS pour metrics (lecture publique)
CREATE POLICY "Metrics are viewable by everyone" ON metrics
    FOR SELECT USING (true);

CREATE POLICY "Metrics are insertable by service role" ON metrics
    FOR INSERT WITH CHECK (true);

-- Politiques RLS pour kpi_definitions (lecture publique si is_public=true)
CREATE POLICY "Public KPIs are viewable by everyone" ON kpi_definitions
    FOR SELECT USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "KPIs are insertable by authenticated users" ON kpi_definitions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Politiques RLS pour kpi_values (lecture publique)
CREATE POLICY "KPI values are viewable by everyone" ON kpi_values
    FOR SELECT USING (true);

-- Politiques RLS pour watchlists (utilisateur voit ses propres watchlists)
CREATE POLICY "Users can view their own watchlists" ON watchlists
    FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert their own watchlists" ON watchlists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watchlists" ON watchlists
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watchlists" ON watchlists
    FOR DELETE USING (auth.uid() = user_id);

-- Politiques RLS pour watchlist_instruments
CREATE POLICY "Users can view instruments in their watchlists" ON watchlist_instruments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM watchlists
            WHERE watchlists.id = watchlist_instruments.watchlist_id
            AND (watchlists.user_id = auth.uid() OR watchlists.is_public = true)
        )
    );

CREATE POLICY "Users can manage instruments in their watchlists" ON watchlist_instruments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM watchlists
            WHERE watchlists.id = watchlist_instruments.watchlist_id
            AND watchlists.user_id = auth.uid()
        )
    );

-- Politiques RLS pour market_indices et price_history (lecture publique)
CREATE POLICY "Market data is viewable by everyone" ON market_indices
    FOR SELECT USING (true);

CREATE POLICY "Market data is viewable by everyone" ON price_history
    FOR SELECT USING (true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_instruments_updated_at
    BEFORE UPDATE ON instruments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kpi_definitions_updated_at
    BEFORE UPDATE ON kpi_definitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_watchlists_updated_at
    BEFORE UPDATE ON watchlists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VUES UTILES
-- ============================================

-- Vue: instruments avec dernières métriques
CREATE OR REPLACE VIEW instruments_with_latest_metrics AS
SELECT 
    i.*,
    m.metric_code,
    m.value as metric_value,
    m.as_of as metric_as_of
FROM instruments i
LEFT JOIN LATERAL (
    SELECT DISTINCT ON (metric_code) *
    FROM metrics
    WHERE symbol = i.symbol
    ORDER BY metric_code, as_of DESC
) m ON true;

-- Vue: watchlists avec instruments
CREATE OR REPLACE VIEW watchlists_with_instruments AS
SELECT 
    w.id as watchlist_id,
    w.user_id,
    w.name as watchlist_name,
    w.description,
    wi.symbol,
    wi.position,
    i.name as instrument_name,
    i.sector,
    i.industry
FROM watchlists w
JOIN watchlist_instruments wi ON w.id = wi.watchlist_id
JOIN instruments i ON wi.symbol = i.symbol
ORDER BY w.id, wi.position;

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON TABLE instruments IS 'Instruments financiers (actions, ETFs, etc.)';
COMMENT ON TABLE fmp_raw_cache IS 'Cache brut des réponses API FMP Premier';
COMMENT ON TABLE metrics IS 'Métriques atomiques calculées à partir de FMP';
COMMENT ON TABLE kpi_definitions IS 'Définitions de KPI avec formules de calcul';
COMMENT ON TABLE kpi_variables IS 'Variables utilisées dans les formules KPI';
COMMENT ON TABLE kpi_values IS 'Valeurs calculées des KPI par symbole et date';
COMMENT ON TABLE watchlists IS 'Listes de surveillance des utilisateurs';
COMMENT ON TABLE watchlist_instruments IS 'Instruments dans les watchlists';
COMMENT ON TABLE job_logs IS 'Logs des jobs d ingestion FMP et calcul KPI';
COMMENT ON TABLE market_indices IS 'Indices de marché (S&P 500, TSX, etc.)';
COMMENT ON TABLE price_history IS 'Historique des prix OHLC par jour';

