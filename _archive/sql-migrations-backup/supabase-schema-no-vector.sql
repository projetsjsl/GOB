-- ═══════════════════════════════════════════════════════
-- SCHÉMA SUPABASE COMPLET - VERSION SANS PGVECTOR
-- (Utiliser si pgvector non disponible)
-- ═══════════════════════════════════════════════════════

-- Extension UUID (normalement déjà activée)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════
-- TABLES PRINCIPALES
-- ═══════════════════════════════════════════════════════

-- 1. RECOMMANDATIONS COMITÉ DE PLACEMENT
CREATE TABLE IF NOT EXISTS committee_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticker TEXT NOT NULL,
    action TEXT NOT NULL,
    committee_date DATE NOT NULL,
    recommendation_text TEXT NOT NULL,
    rationale_data JSONB,
    status TEXT DEFAULT 'pending_approval',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by TEXT
);

-- 2. CAPSULES CONTENU
CREATE TABLE IF NOT EXISTS content_capsules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    seo_keywords TEXT[],
    status TEXT DEFAULT 'draft',
    author TEXT DEFAULT 'Emma IA',
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. LETTRES CLIENTS
CREATE TABLE IF NOT EXISTS client_letters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id TEXT NOT NULL,
    letter_type TEXT NOT NULL,
    period TEXT NOT NULL,
    letter_content TEXT NOT NULL,
    pdf_url TEXT,
    status TEXT DEFAULT 'generated',
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. PORTEFEUILLES CLIENTS
CREATE TABLE IF NOT EXISTS client_portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id TEXT NOT NULL UNIQUE,
    client_name TEXT NOT NULL,
    risk_profile TEXT,
    holdings JSONB NOT NULL,
    cash DECIMAL(15,2),
    total_value DECIMAL(15,2),
    inception_date DATE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ALERTES SURVEILLANCE PORTEFEUILLE
CREATE TABLE IF NOT EXISTS portfolio_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID REFERENCES client_portfolios(id),
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    ticker TEXT NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    action_required BOOLEAN DEFAULT false,
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 6. RAPPORTS DE RECHERCHE COMPAGNIES
CREATE TABLE IF NOT EXISTS company_research_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticker TEXT NOT NULL,
    report_type TEXT,
    analysis_data JSONB NOT NULL,
    recommendation TEXT,
    target_price DECIMAL(10,2),
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until DATE
);

-- 7. KNOWLEDGE BASE (SANS VECTOR - Version simple)
CREATE TABLE IF NOT EXISTS website_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url TEXT NOT NULL UNIQUE,
    section TEXT,
    title TEXT,
    content TEXT NOT NULL,
    keywords TEXT[], -- Pour recherche textuelle
    last_scraped TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. BRIEFINGS QUOTIDIENS
CREATE TABLE IF NOT EXISTS briefings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    html TEXT,
    sources JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. CALENDRIER EARNINGS ANNUEL
CREATE TABLE IF NOT EXISTS earnings_calendar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticker TEXT NOT NULL,
    fiscal_quarter TEXT NOT NULL,
    fiscal_year INT NOT NULL,
    estimated_date DATE NOT NULL,
    confirmed_date DATE,
    time TEXT,
    estimated_eps DECIMAL(10,4),
    estimated_revenue DECIMAL(15,2),
    status TEXT DEFAULT 'scheduled',
    alert_sent BOOLEAN DEFAULT false,
    pre_analysis_id UUID,
    post_analysis_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. ANALYSES PRÉ-EARNINGS
CREATE TABLE IF NOT EXISTS pre_earnings_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticker TEXT NOT NULL,
    earnings_date DATE NOT NULL,
    analysis_data JSONB NOT NULL,
    consensus_eps DECIMAL(10,4),
    consensus_revenue DECIMAL(15,2),
    beat_probability DECIMAL(5,2),
    our_expectation TEXT,
    trading_recommendation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. RÉSULTATS EARNINGS
CREATE TABLE IF NOT EXISTS earnings_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticker TEXT NOT NULL,
    quarter TEXT NOT NULL,
    fiscal_year INT NOT NULL,
    report_date DATE NOT NULL,
    verdict TEXT NOT NULL,
    eps_actual DECIMAL(10,4),
    eps_estimate DECIMAL(10,4),
    eps_surprise_pct DECIMAL(10,2),
    revenue_actual DECIMAL(15,2),
    revenue_estimate DECIMAL(15,2),
    revenue_surprise_pct DECIMAL(10,2),
    guidance_direction TEXT,
    next_q_eps_guidance DECIMAL(10,4),
    fy_eps_guidance DECIMAL(10,4),
    after_hours_change_pct DECIMAL(10,2),
    next_day_change_pct DECIMAL(10,2),
    analysis_data JSONB NOT NULL,
    alert_sent BOOLEAN DEFAULT false,
    alert_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. NEWS IMPORTANTES
CREATE TABLE IF NOT EXISTS significant_news (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticker TEXT NOT NULL,
    headline TEXT NOT NULL,
    summary TEXT,
    source TEXT NOT NULL,
    url TEXT,
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    importance_score INT NOT NULL,
    category TEXT NOT NULL,
    sentiment DECIMAL(3,2),
    market_impact JSONB,
    action_required BOOLEAN DEFAULT false,
    alert_sent BOOLEAN DEFAULT false,
    alert_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. DIGESTS HEBDOMADAIRES
CREATE TABLE IF NOT EXISTS weekly_news_digests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    content TEXT NOT NULL,
    html TEXT,
    news_count INT,
    tickers_covered TEXT[],
    sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. LOG ALERTES
CREATE TABLE IF NOT EXISTS alerts_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_type TEXT NOT NULL,
    ticker TEXT,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    recipients TEXT[],
    priority TEXT DEFAULT 'normal',
    sent_via TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. LOGS ACTIVITÉ EMMA
CREATE TABLE IF NOT EXISTS emma_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_type TEXT,
    action TEXT,
    input_data JSONB,
    output_data JSONB,
    models_used TEXT[],
    cost DECIMAL(10,4),
    execution_time_ms INT,
    success BOOLEAN,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. WATCHLIST
CREATE TABLE IF NOT EXISTS watchlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    ticker TEXT NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- ═══════════════════════════════════════════════════════
-- INDEX POUR PERFORMANCE
-- ═══════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_committee_reco_ticker ON committee_recommendations(ticker);
CREATE INDEX IF NOT EXISTS idx_committee_reco_date ON committee_recommendations(committee_date);
CREATE INDEX IF NOT EXISTS idx_committee_reco_status ON committee_recommendations(status);

CREATE INDEX IF NOT EXISTS idx_content_capsules_type ON content_capsules(type);
CREATE INDEX IF NOT EXISTS idx_content_capsules_status ON content_capsules(status);

CREATE INDEX IF NOT EXISTS idx_client_letters_client_id ON client_letters(client_id);
CREATE INDEX IF NOT EXISTS idx_client_letters_type ON client_letters(letter_type);

CREATE INDEX IF NOT EXISTS idx_client_portfolios_client_id ON client_portfolios(client_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_alerts_portfolio_id ON portfolio_alerts(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_alerts_ticker ON portfolio_alerts(ticker);
CREATE INDEX IF NOT EXISTS idx_portfolio_alerts_severity ON portfolio_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_portfolio_alerts_resolved ON portfolio_alerts(resolved);

CREATE INDEX IF NOT EXISTS idx_research_reports_ticker ON company_research_reports(ticker);
CREATE INDEX IF NOT EXISTS idx_research_reports_created ON company_research_reports(created_at);

CREATE INDEX IF NOT EXISTS idx_website_content_section ON website_content(section);
-- Index recherche full-text français
CREATE INDEX IF NOT EXISTS idx_website_content_search
ON website_content
USING gin(to_tsvector('french', content));

CREATE INDEX IF NOT EXISTS idx_briefings_type ON briefings(type);
CREATE INDEX IF NOT EXISTS idx_briefings_created ON briefings(created_at);

CREATE INDEX IF NOT EXISTS idx_earnings_calendar_ticker ON earnings_calendar(ticker);
CREATE INDEX IF NOT EXISTS idx_earnings_calendar_date ON earnings_calendar(estimated_date);
CREATE INDEX IF NOT EXISTS idx_earnings_calendar_status ON earnings_calendar(status);

CREATE INDEX IF NOT EXISTS idx_pre_earnings_ticker ON pre_earnings_analysis(ticker);
CREATE INDEX IF NOT EXISTS idx_pre_earnings_date ON pre_earnings_analysis(earnings_date);

CREATE INDEX IF NOT EXISTS idx_earnings_results_ticker ON earnings_results(ticker);
CREATE INDEX IF NOT EXISTS idx_earnings_results_date ON earnings_results(report_date);
CREATE INDEX IF NOT EXISTS idx_earnings_results_verdict ON earnings_results(verdict);

CREATE INDEX IF NOT EXISTS idx_significant_news_ticker ON significant_news(ticker);
CREATE INDEX IF NOT EXISTS idx_significant_news_published ON significant_news(published_at);
CREATE INDEX IF NOT EXISTS idx_significant_news_importance ON significant_news(importance_score);

CREATE INDEX IF NOT EXISTS idx_alerts_log_type ON alerts_log(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_log_sent_at ON alerts_log(sent_at);

CREATE INDEX IF NOT EXISTS idx_emma_logs_agent ON emma_activity_logs(agent_type);
CREATE INDEX IF NOT EXISTS idx_emma_logs_created ON emma_activity_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_ticker ON watchlist(ticker);

-- ═══════════════════════════════════════════════════════
-- VUES UTILES
-- ═══════════════════════════════════════════════════════

CREATE OR REPLACE VIEW upcoming_earnings AS
SELECT
    ec.*,
    pea.beat_probability,
    pea.our_expectation
FROM earnings_calendar ec
LEFT JOIN pre_earnings_analysis pea ON ec.ticker = pea.ticker AND ec.estimated_date = pea.earnings_date
WHERE ec.estimated_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
AND ec.status IN ('scheduled', 'confirmed')
ORDER BY ec.estimated_date ASC;

CREATE OR REPLACE VIEW unresolved_alerts AS
SELECT *
FROM portfolio_alerts
WHERE resolved = false
ORDER BY
    CASE severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
    END,
    created_at DESC;

CREATE OR REPLACE VIEW critical_news_24h AS
SELECT *
FROM significant_news
WHERE importance_score >= 8
AND published_at >= NOW() - INTERVAL '24 hours'
ORDER BY importance_score DESC, published_at DESC;

CREATE OR REPLACE VIEW portfolio_summary AS
SELECT
    client_id,
    client_name,
    risk_profile,
    total_value,
    cash,
    (total_value - cash) as invested_value,
    jsonb_array_length(holdings) as positions_count,
    last_updated
FROM client_portfolios
ORDER BY total_value DESC;

-- ═══════════════════════════════════════════════════════
-- FONCTIONS
-- ═══════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_earnings_calendar_modtime
BEFORE UPDATE ON earnings_calendar
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_client_portfolios_modtime
BEFORE UPDATE ON client_portfolios
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- FIN
SELECT 'Schema created successfully (no vector version)!' AS status;
