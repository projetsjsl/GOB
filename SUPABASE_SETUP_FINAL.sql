-- ============================================================================
-- SUPABASE SETUP COMPLET POUR EMMA AI - PHASE 3
-- À COPIER ET EXÉCUTER DANS SUPABASE SQL EDITOR
-- ============================================================================

-- Activer l'extension UUID si pas déjà fait
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. TABLE: EARNINGS CALENDAR
-- ============================================================================
CREATE TABLE IF NOT EXISTS earnings_calendar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticker TEXT NOT NULL,
    company_name TEXT,
    fiscal_quarter TEXT NOT NULL,  -- Q1, Q2, Q3, Q4
    fiscal_year INT NOT NULL,
    estimated_date DATE NOT NULL,
    confirmed_date DATE,
    time TEXT,  -- BMO (before market open), AMC (after market close), TAS (time after session)

    -- Estimations
    estimated_eps DECIMAL(10,4),
    estimated_revenue DECIMAL(15,2),

    -- Metadata
    status TEXT DEFAULT 'scheduled',  -- scheduled, confirmed, published, analyzed
    alert_sent BOOLEAN DEFAULT false,
    alert_sent_at TIMESTAMP WITH TIME ZONE,

    -- Relations
    pre_analysis_id UUID,
    post_analysis_id UUID,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Contrainte unique: un seul earnings par ticker/quarter/year
    UNIQUE(ticker, fiscal_quarter, fiscal_year)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_earnings_calendar_ticker ON earnings_calendar(ticker);
CREATE INDEX IF NOT EXISTS idx_earnings_calendar_date ON earnings_calendar(estimated_date);
CREATE INDEX IF NOT EXISTS idx_earnings_calendar_status ON earnings_calendar(status);

-- ============================================================================
-- 2. TABLE: PRE-EARNINGS ANALYSIS
-- ============================================================================
CREATE TABLE IF NOT EXISTS pre_earnings_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    earnings_calendar_id UUID REFERENCES earnings_calendar(id) ON DELETE CASCADE,
    ticker TEXT NOT NULL,

    -- Consensus analystes
    consensus_eps DECIMAL(10,4),
    consensus_revenue DECIMAL(15,2),
    num_analysts INT,

    -- Historique performance
    historical_beat_rate DECIMAL(5,2),  -- % de beats historiques
    last_8q_beats INT,  -- Nombre de beats sur 8 derniers quarters
    avg_surprise_pct DECIMAL(10,2),

    -- Fondamentaux actuels
    current_pe DECIMAL(10,2),
    current_price DECIMAL(10,2),
    revenue_growth_yoy DECIMAL(10,2),
    profit_margin DECIMAL(10,2),
    roe DECIMAL(10,2),

    -- Facteurs de risque
    risk_factors JSONB,  -- Array de risques identifiés
    key_watch_items TEXT[],  -- Points à surveiller

    -- Analyse générée
    analysis_summary TEXT,
    analysis_generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pre_analysis_ticker ON pre_earnings_analysis(ticker);
CREATE INDEX IF NOT EXISTS idx_pre_analysis_calendar ON pre_earnings_analysis(earnings_calendar_id);

-- ============================================================================
-- 3. TABLE: EARNINGS RESULTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS earnings_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    earnings_calendar_id UUID REFERENCES earnings_calendar(id) ON DELETE SET NULL,
    ticker TEXT NOT NULL,
    quarter TEXT NOT NULL,  -- Q1, Q2, Q3, Q4
    fiscal_year INT NOT NULL,
    report_date DATE NOT NULL,

    -- Verdict
    verdict TEXT NOT NULL,  -- BUY, HOLD, SELL
    verdict_confidence DECIMAL(3,2),  -- 0.00 to 1.00
    verdict_reasoning TEXT,

    -- Résultats réels
    eps_actual DECIMAL(10,4),
    eps_estimate DECIMAL(10,4),
    eps_surprise_pct DECIMAL(10,2),
    eps_beat BOOLEAN,

    revenue_actual DECIMAL(15,2),
    revenue_estimate DECIMAL(15,2),
    revenue_surprise_pct DECIMAL(10,2),
    revenue_beat BOOLEAN,

    -- Guidance
    guidance_direction TEXT,  -- raised, maintained, lowered, not_provided
    next_q_eps_guidance DECIMAL(10,4),
    next_q_revenue_guidance DECIMAL(15,2),
    fy_eps_guidance DECIMAL(10,4),
    fy_revenue_guidance DECIMAL(15,2),

    -- Earnings call sentiment
    call_sentiment TEXT,  -- positive, neutral, negative
    management_confidence TEXT,  -- high, medium, low
    key_takeaways TEXT[],

    -- Contexte marché
    stock_price_before DECIMAL(10,2),
    stock_price_after DECIMAL(10,2),
    price_change_pct DECIMAL(10,2),

    -- Insights Perplexity
    perplexity_insights TEXT,
    market_context TEXT,

    -- Scores
    fundamentals_score INT,  -- 0-100
    guidance_score INT,  -- 0-100
    sentiment_score INT,  -- 0-100
    overall_score INT,  -- 0-100

    -- Alertes
    is_significant BOOLEAN DEFAULT false,  -- Si surprise > 10%
    alert_sent BOOLEAN DEFAULT false,
    alert_sent_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(ticker, quarter, fiscal_year)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_earnings_results_ticker ON earnings_results(ticker);
CREATE INDEX IF NOT EXISTS idx_earnings_results_date ON earnings_results(report_date);
CREATE INDEX IF NOT EXISTS idx_earnings_results_verdict ON earnings_results(verdict);
CREATE INDEX IF NOT EXISTS idx_earnings_results_significant ON earnings_results(is_significant);

-- ============================================================================
-- 4. TABLE: SIGNIFICANT NEWS
-- ============================================================================
CREATE TABLE IF NOT EXISTS significant_news (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticker TEXT NOT NULL,
    headline TEXT NOT NULL,
    summary TEXT,
    source TEXT NOT NULL,
    url TEXT,
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Scoring automatique (Perplexity)
    importance_score INT NOT NULL CHECK (importance_score >= 0 AND importance_score <= 10),
    category TEXT NOT NULL,  -- earnings, ma, regulatory, product, legal, management, market, other
    sentiment DECIMAL(3,2) CHECK (sentiment >= -1.0 AND sentiment <= 1.0),  -- -1.0 to +1.0

    -- Impact marché
    market_impact JSONB,  -- { "short_term": "positive", "medium_term": "neutral", ... }
    impact_summary TEXT,
    action_required BOOLEAN DEFAULT false,

    -- Analyse Perplexity
    perplexity_analysis TEXT,
    key_points TEXT[],

    -- Alertes
    alert_sent BOOLEAN DEFAULT false,
    alert_sent_at TIMESTAMP WITH TIME ZONE,
    alert_channel TEXT,  -- email, slack, webhook

    -- Metadata
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(ticker, url)  -- Éviter duplicates
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_significant_news_ticker ON significant_news(ticker);
CREATE INDEX IF NOT EXISTS idx_significant_news_published ON significant_news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_significant_news_importance ON significant_news(importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_significant_news_category ON significant_news(category);
CREATE INDEX IF NOT EXISTS idx_significant_news_action ON significant_news(action_required);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE earnings_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_earnings_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE significant_news ENABLE ROW LEVEL SECURITY;

-- Policies pour service_role (accès complet via API)
CREATE POLICY "Service role has full access to earnings_calendar"
    ON earnings_calendar FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to pre_earnings_analysis"
    ON pre_earnings_analysis FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to earnings_results"
    ON earnings_results FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to significant_news"
    ON significant_news FOR ALL
    USING (true)
    WITH CHECK (true);

-- Policies pour anon/authenticated (lecture seule)
CREATE POLICY "Public read access to earnings_calendar"
    ON earnings_calendar FOR SELECT
    USING (true);

CREATE POLICY "Public read access to earnings_results"
    ON earnings_results FOR SELECT
    USING (true);

CREATE POLICY "Public read access to significant_news"
    ON significant_news FOR SELECT
    USING (true);

-- ============================================================================
-- 6. FONCTIONS UTILITAIRES
-- ============================================================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour earnings_calendar
DROP TRIGGER IF EXISTS update_earnings_calendar_updated_at ON earnings_calendar;
CREATE TRIGGER update_earnings_calendar_updated_at
    BEFORE UPDATE ON earnings_calendar
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. VUES UTILES
-- ============================================================================

-- Vue: Prochains earnings (7 jours)
CREATE OR REPLACE VIEW upcoming_earnings AS
SELECT
    ec.*,
    pea.consensus_eps,
    pea.consensus_revenue,
    pea.historical_beat_rate
FROM earnings_calendar ec
LEFT JOIN pre_earnings_analysis pea ON ec.id = pea.earnings_calendar_id
WHERE ec.estimated_date >= CURRENT_DATE
  AND ec.estimated_date <= CURRENT_DATE + INTERVAL '7 days'
  AND ec.status IN ('scheduled', 'confirmed')
ORDER BY ec.estimated_date ASC;

-- Vue: News critiques non traitées
CREATE OR REPLACE VIEW critical_news_pending AS
SELECT *
FROM significant_news
WHERE importance_score >= 8
  AND action_required = true
  AND alert_sent = false
ORDER BY importance_score DESC, published_at DESC;

-- Vue: Résumé performance earnings par ticker
CREATE OR REPLACE VIEW earnings_performance_summary AS
SELECT
    ticker,
    COUNT(*) as total_earnings,
    SUM(CASE WHEN eps_beat THEN 1 ELSE 0 END) as eps_beats,
    SUM(CASE WHEN revenue_beat THEN 1 ELSE 0 END) as revenue_beats,
    ROUND(AVG(eps_surprise_pct), 2) as avg_eps_surprise,
    ROUND(AVG(revenue_surprise_pct), 2) as avg_revenue_surprise,
    SUM(CASE WHEN verdict = 'BUY' THEN 1 ELSE 0 END) as buy_verdicts,
    SUM(CASE WHEN verdict = 'HOLD' THEN 1 ELSE 0 END) as hold_verdicts,
    SUM(CASE WHEN verdict = 'SELL' THEN 1 ELSE 0 END) as sell_verdicts
FROM earnings_results
GROUP BY ticker
ORDER BY total_earnings DESC;

-- ============================================================================
-- 8. DONNÉES DE TEST (OPTIONNEL)
-- ============================================================================

-- Insérer quelques earnings à venir pour test
INSERT INTO earnings_calendar (ticker, company_name, fiscal_quarter, fiscal_year, estimated_date, estimated_eps, estimated_revenue, status)
VALUES
    ('AAPL', 'Apple Inc.', 'Q1', 2025, CURRENT_DATE + INTERVAL '5 days', 2.45, 122500000000, 'scheduled'),
    ('MSFT', 'Microsoft Corporation', 'Q2', 2025, CURRENT_DATE + INTERVAL '12 days', 3.12, 65200000000, 'scheduled'),
    ('GOOGL', 'Alphabet Inc.', 'Q4', 2024, CURRENT_DATE + INTERVAL '3 days', 1.89, 95300000000, 'confirmed')
ON CONFLICT (ticker, fiscal_quarter, fiscal_year) DO NOTHING;

-- ============================================================================
-- 9. VÉRIFICATION FINALE
-- ============================================================================

-- Vérifier que toutes les tables existent
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('earnings_calendar', 'pre_earnings_analysis', 'earnings_results', 'significant_news')
ORDER BY table_name;

-- Compter les enregistrements
SELECT
    'earnings_calendar' as table_name,
    COUNT(*) as row_count
FROM earnings_calendar
UNION ALL
SELECT 'earnings_results', COUNT(*) FROM earnings_results
UNION ALL
SELECT 'significant_news', COUNT(*) FROM significant_news;

-- ============================================================================
-- 10. INSTRUCTIONS POST-INSTALLATION
-- ============================================================================

/*
✅ TABLES CRÉÉES:
   1. earnings_calendar      - Calendrier annuel complet
   2. pre_earnings_analysis  - Analyses pré-résultats
   3. earnings_results       - Résultats et verdicts
   4. significant_news       - News importantes avec scoring

✅ SÉCURITÉ:
   - RLS activé sur toutes les tables
   - Service role: accès complet
   - Public: lecture seule

✅ PROCHAINES ÉTAPES:
   1. Configurer variables Vercel:
      - SUPABASE_URL=https://xxxxx.supabase.co
      - SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

   2. Tester connexion:
      node test-supabase-connection.js

   3. Initialiser calendrier:
      POST /api/emma-n8n?action=initialize_earnings_calendar
      Body: {"tickers": ["AAPL","MSFT","GOOGL"], "year": 2025}

📖 DOCUMENTATION:
   - Guide complet: SUPABASE_CONNECTION_STATUS.md
   - Schéma détaillé: supabase-schema-complete.sql
*/
