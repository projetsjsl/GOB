-- ============================================================================
-- AMÉLIORATION TABLES EXISTANTES SUPABASE POUR EMMA AI
-- Utilise les tables watchlist et team_tickers existantes
-- ============================================================================

-- Activer l'extension UUID si pas déjà fait
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. VÉRIFICATION ET AMÉLIORATION TABLE WATCHLIST EXISTANTE
-- ============================================================================

-- Vérifier la structure actuelle de watchlist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'watchlist' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Ajouter des colonnes manquantes si nécessaire
DO $$
BEGIN
    -- Ajouter colonne ticker si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'watchlist' AND column_name = 'ticker') THEN
        ALTER TABLE watchlist ADD COLUMN ticker TEXT;
    END IF;
    
    -- Ajouter colonne company_name si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'watchlist' AND column_name = 'company_name') THEN
        ALTER TABLE watchlist ADD COLUMN company_name TEXT;
    END IF;
    
    -- Ajouter colonne notes si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'watchlist' AND column_name = 'notes') THEN
        ALTER TABLE watchlist ADD COLUMN notes TEXT;
    END IF;
    
    -- Ajouter colonne target_price si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'watchlist' AND column_name = 'target_price') THEN
        ALTER TABLE watchlist ADD COLUMN target_price DECIMAL(10,2);
    END IF;
    
    -- Ajouter colonne stop_loss si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'watchlist' AND column_name = 'stop_loss') THEN
        ALTER TABLE watchlist ADD COLUMN stop_loss DECIMAL(10,2);
    END IF;
    
    -- Ajouter colonne added_at si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'watchlist' AND column_name = 'added_at') THEN
        ALTER TABLE watchlist ADD COLUMN added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Créer des index pour performance
CREATE INDEX IF NOT EXISTS idx_watchlist_ticker ON watchlist(ticker);
CREATE INDEX IF NOT EXISTS idx_watchlist_added_at ON watchlist(added_at);

-- ============================================================================
-- 2. AMÉLIORATION TABLE TEAM_TICKERS EXISTANTE
-- ============================================================================

-- Vérifier la structure actuelle de team_tickers
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'team_tickers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Ajouter des colonnes manquantes si nécessaire
DO $$
BEGIN
    -- Ajouter colonne team_name si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'team_tickers' AND column_name = 'team_name') THEN
        ALTER TABLE team_tickers ADD COLUMN team_name TEXT;
    END IF;
    
    -- Ajouter colonne priority si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'team_tickers' AND column_name = 'priority') THEN
        ALTER TABLE team_tickers ADD COLUMN priority INTEGER DEFAULT 1;
    END IF;
    
    -- Ajouter colonne added_at si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'team_tickers' AND column_name = 'added_at') THEN
        ALTER TABLE team_tickers ADD COLUMN added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Créer des index pour team_tickers
CREATE INDEX IF NOT EXISTS idx_team_tickers_ticker ON team_tickers(ticker);
CREATE INDEX IF NOT EXISTS idx_team_tickers_team ON team_tickers(team_name);
CREATE INDEX IF NOT EXISTS idx_team_tickers_priority ON team_tickers(priority);

-- ============================================================================
-- 3. AMÉLIORATION TABLE EARNINGS_CALENDAR EXISTANTE
-- ============================================================================

-- Vérifier la structure actuelle de earnings_calendar
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'earnings_calendar' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Ajouter des colonnes manquantes pour Emma AI
DO $$
BEGIN
    -- Ajouter colonne company_name si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'earnings_calendar' AND column_name = 'company_name') THEN
        ALTER TABLE earnings_calendar ADD COLUMN company_name TEXT;
    END IF;
    
    -- Ajouter colonne fiscal_quarter si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'earnings_calendar' AND column_name = 'fiscal_quarter') THEN
        ALTER TABLE earnings_calendar ADD COLUMN fiscal_quarter TEXT;
    END IF;
    
    -- Ajouter colonne fiscal_year si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'earnings_calendar' AND column_name = 'fiscal_year') THEN
        ALTER TABLE earnings_calendar ADD COLUMN fiscal_year INTEGER;
    END IF;
    
    -- Ajouter colonne estimated_date si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'earnings_calendar' AND column_name = 'estimated_date') THEN
        ALTER TABLE earnings_calendar ADD COLUMN estimated_date DATE;
    END IF;
    
    -- Ajouter colonne confirmed_date si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'earnings_calendar' AND column_name = 'confirmed_date') THEN
        ALTER TABLE earnings_calendar ADD COLUMN confirmed_date DATE;
    END IF;
    
    -- Ajouter colonne time si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'earnings_calendar' AND column_name = 'time') THEN
        ALTER TABLE earnings_calendar ADD COLUMN time TEXT;
    END IF;
    
    -- Ajouter colonne estimated_eps si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'earnings_calendar' AND column_name = 'estimated_eps') THEN
        ALTER TABLE earnings_calendar ADD COLUMN estimated_eps DECIMAL(10,4);
    END IF;
    
    -- Ajouter colonne estimated_revenue si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'earnings_calendar' AND column_name = 'estimated_revenue') THEN
        ALTER TABLE earnings_calendar ADD COLUMN estimated_revenue DECIMAL(15,2);
    END IF;
    
    -- Ajouter colonne status si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'earnings_calendar' AND column_name = 'status') THEN
        ALTER TABLE earnings_calendar ADD COLUMN status TEXT DEFAULT 'scheduled';
    END IF;
    
    -- Ajouter colonne alert_sent si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'earnings_calendar' AND column_name = 'alert_sent') THEN
        ALTER TABLE earnings_calendar ADD COLUMN alert_sent BOOLEAN DEFAULT false;
    END IF;
    
    -- Ajouter colonne alert_sent_at si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'earnings_calendar' AND column_name = 'alert_sent_at') THEN
        ALTER TABLE earnings_calendar ADD COLUMN alert_sent_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Créer des index pour earnings_calendar
CREATE INDEX IF NOT EXISTS idx_earnings_calendar_ticker ON earnings_calendar(ticker);
CREATE INDEX IF NOT EXISTS idx_earnings_calendar_date ON earnings_calendar(estimated_date);
CREATE INDEX IF NOT EXISTS idx_earnings_calendar_status ON earnings_calendar(status);

-- ============================================================================
-- 4. CRÉATION DES NOUVELLES TABLES EMMA AI
-- ============================================================================

-- Table: pre_earnings_analysis
CREATE TABLE IF NOT EXISTS pre_earnings_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    earnings_calendar_id UUID REFERENCES earnings_calendar(id) ON DELETE CASCADE,
    ticker TEXT NOT NULL,

    -- Consensus analystes
    consensus_eps DECIMAL(10,4),
    consensus_revenue DECIMAL(15,2),
    num_analysts INT,

    -- Historique performance
    historical_beat_rate DECIMAL(5,2),
    last_8q_beats INT,
    avg_surprise_pct DECIMAL(10,2),

    -- Fondamentaux actuels
    current_pe DECIMAL(10,2),
    current_price DECIMAL(10,2),
    revenue_growth_yoy DECIMAL(10,2),
    profit_margin DECIMAL(10,2),
    roe DECIMAL(10,2),

    -- Facteurs de risque
    risk_factors JSONB,
    key_watch_items TEXT[],

    -- Analyse générée
    analysis_summary TEXT,
    analysis_generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pre_analysis_ticker ON pre_earnings_analysis(ticker);
CREATE INDEX IF NOT EXISTS idx_pre_analysis_calendar ON pre_earnings_analysis(earnings_calendar_id);

-- Table: earnings_results
CREATE TABLE IF NOT EXISTS earnings_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    earnings_calendar_id UUID REFERENCES earnings_calendar(id) ON DELETE SET NULL,
    ticker TEXT NOT NULL,
    quarter TEXT NOT NULL,
    fiscal_year INT NOT NULL,
    report_date DATE NOT NULL,

    -- Verdict
    verdict TEXT NOT NULL,
    verdict_confidence DECIMAL(3,2),
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
    guidance_direction TEXT,
    next_q_eps_guidance DECIMAL(10,4),
    next_q_revenue_guidance DECIMAL(15,2),
    fy_eps_guidance DECIMAL(10,4),
    fy_revenue_guidance DECIMAL(15,2),

    -- Earnings call sentiment
    call_sentiment TEXT,
    management_confidence TEXT,
    key_takeaways TEXT[],

    -- Contexte marché
    stock_price_before DECIMAL(10,2),
    stock_price_after DECIMAL(10,2),
    price_change_pct DECIMAL(10,2),

    -- Insights Perplexity
    perplexity_insights TEXT,
    market_context TEXT,

    -- Scores
    fundamentals_score INT,
    guidance_score INT,
    sentiment_score INT,
    overall_score INT,

    -- Alertes
    is_significant BOOLEAN DEFAULT false,
    alert_sent BOOLEAN DEFAULT false,
    alert_sent_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(ticker, quarter, fiscal_year)
);

CREATE INDEX IF NOT EXISTS idx_earnings_results_ticker ON earnings_results(ticker);
CREATE INDEX IF NOT EXISTS idx_earnings_results_date ON earnings_results(report_date);
CREATE INDEX IF NOT EXISTS idx_earnings_results_verdict ON earnings_results(verdict);
CREATE INDEX IF NOT EXISTS idx_earnings_results_significant ON earnings_results(is_significant);

-- Table: significant_news
CREATE TABLE IF NOT EXISTS significant_news (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticker TEXT NOT NULL,
    headline TEXT NOT NULL,
    summary TEXT,
    source TEXT NOT NULL,
    url TEXT,
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Scoring automatique
    importance_score INT NOT NULL CHECK (importance_score >= 0 AND importance_score <= 10),
    category TEXT NOT NULL,
    sentiment DECIMAL(3,2) CHECK (sentiment >= -1.0 AND sentiment <= 1.0),

    -- Impact marché
    market_impact JSONB,
    impact_summary TEXT,
    action_required BOOLEAN DEFAULT false,

    -- Analyse Perplexity
    perplexity_analysis TEXT,
    key_points TEXT[],

    -- Alertes
    alert_sent BOOLEAN DEFAULT false,
    alert_sent_at TIMESTAMP WITH TIME ZONE,
    alert_channel TEXT,

    -- Metadata
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(ticker, url)
);

CREATE INDEX IF NOT EXISTS idx_significant_news_ticker ON significant_news(ticker);
CREATE INDEX IF NOT EXISTS idx_significant_news_published ON significant_news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_significant_news_importance ON significant_news(importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_significant_news_category ON significant_news(category);
CREATE INDEX IF NOT EXISTS idx_significant_news_action ON significant_news(action_required);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_tickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_earnings_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE significant_news ENABLE ROW LEVEL SECURITY;

-- Policies pour service_role (accès complet via API)
CREATE POLICY "Service role has full access to watchlist"
    ON watchlist FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to team_tickers"
    ON team_tickers FOR ALL
    USING (true)
    WITH CHECK (true);

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
CREATE POLICY "Public read access to watchlist"
    ON watchlist FOR SELECT
    USING (true);

CREATE POLICY "Public read access to team_tickers"
    ON team_tickers FOR SELECT
    USING (true);

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
-- 6. VUES UTILES
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

-- Vue: Tickers combinés (watchlist + team_tickers)
CREATE OR REPLACE VIEW all_tickers AS
SELECT 
    ticker,
    company_name,
    'watchlist' as source,
    added_at,
    notes,
    target_price,
    stop_loss
FROM watchlist
UNION ALL
SELECT 
    ticker,
    company_name,
    'team_tickers' as source,
    added_at,
    team_name as notes,
    NULL as target_price,
    NULL as stop_loss
FROM team_tickers;

-- ============================================================================
-- 7. DONNÉES DE TEST
-- ============================================================================

-- Insérer quelques earnings à venir pour test
INSERT INTO earnings_calendar (ticker, company_name, fiscal_quarter, fiscal_year, estimated_date, estimated_eps, estimated_revenue, status)
VALUES
    ('AAPL', 'Apple Inc.', 'Q1', 2025, CURRENT_DATE + INTERVAL '5 days', 2.45, 122500000000, 'scheduled'),
    ('MSFT', 'Microsoft Corporation', 'Q2', 2025, CURRENT_DATE + INTERVAL '12 days', 3.12, 65200000000, 'scheduled'),
    ('GOOGL', 'Alphabet Inc.', 'Q4', 2024, CURRENT_DATE + INTERVAL '3 days', 1.89, 95300000000, 'confirmed')
ON CONFLICT (ticker, fiscal_quarter, fiscal_year) DO NOTHING;

-- ============================================================================
-- 8. VÉRIFICATION FINALE
-- ============================================================================

-- Vérifier que toutes les tables existent
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('watchlist', 'team_tickers', 'earnings_calendar', 'pre_earnings_analysis', 'earnings_results', 'significant_news')
ORDER BY table_name;

-- Compter les enregistrements
SELECT
    'watchlist' as table_name,
    COUNT(*) as row_count
FROM watchlist
UNION ALL
SELECT 'team_tickers', COUNT(*) FROM team_tickers
UNION ALL
SELECT 'earnings_calendar', COUNT(*) FROM earnings_calendar
UNION ALL
SELECT 'earnings_results', COUNT(*) FROM earnings_results
UNION ALL
SELECT 'significant_news', COUNT(*) FROM significant_news;

-- Afficher la vue des tickers combinés
SELECT * FROM all_tickers ORDER BY source, ticker;
