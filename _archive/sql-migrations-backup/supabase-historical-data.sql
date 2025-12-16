-- ========================================
-- SUPABASE HISTORICAL DATA SETUP
-- Base de données historique complète pour JLab™
-- ========================================

-- Table principale des titres
CREATE TABLE IF NOT EXISTS stocks (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  name TEXT,
  sector TEXT,
  industry TEXT,
  country TEXT,
  exchange TEXT,
  market_cap BIGINT,
  shares_outstanding BIGINT,
  website TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des prix quotidiens
CREATE TABLE IF NOT EXISTS daily_prices (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  date DATE NOT NULL,
  open DECIMAL(10,2),
  high DECIMAL(10,2),
  low DECIMAL(10,2),
  close DECIMAL(10,2),
  volume BIGINT,
  adjusted_close DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(symbol, date)
);

-- Table des prix intraday (pour 1D)
CREATE TABLE IF NOT EXISTS intraday_prices (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  datetime TIMESTAMPTZ NOT NULL,
  open DECIMAL(10,2),
  high DECIMAL(10,2),
  low DECIMAL(10,2),
  close DECIMAL(10,2),
  volume BIGINT,
  timeframe TEXT NOT NULL, -- '1min', '5min', '15min', '1hour'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(symbol, datetime, timeframe)
);

-- Table des ratios financiers
CREATE TABLE IF NOT EXISTS financial_ratios (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  date DATE NOT NULL,
  -- Ratios de valorisation
  pe_ratio DECIMAL(8,2),
  pb_ratio DECIMAL(8,2),
  ps_ratio DECIMAL(8,2),
  peg_ratio DECIMAL(8,2),
  price_to_cash_flow DECIMAL(8,2),
  price_to_free_cash_flow DECIMAL(8,2),
  enterprise_value_multiple DECIMAL(8,2),
  -- Ratios de rentabilité
  return_on_equity DECIMAL(8,2),
  return_on_assets DECIMAL(8,2),
  return_on_capital_employed DECIMAL(8,2),
  gross_profit_margin DECIMAL(8,2),
  operating_profit_margin DECIMAL(8,2),
  net_profit_margin DECIMAL(8,2),
  -- Ratios de liquidité
  current_ratio DECIMAL(8,2),
  quick_ratio DECIMAL(8,2),
  cash_ratio DECIMAL(8,2),
  -- Ratios d'endettement
  debt_equity_ratio DECIMAL(8,2),
  debt_ratio DECIMAL(8,2),
  interest_coverage DECIMAL(8,2),
  -- Autres
  dividend_yield DECIMAL(8,2),
  payout_ratio DECIMAL(8,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(symbol, date)
);

-- Table des recommandations d'analystes
CREATE TABLE IF NOT EXISTS analyst_recommendations (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  date DATE NOT NULL,
  consensus_rating TEXT, -- 'Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell'
  target_price DECIMAL(10,2),
  upside_percentage DECIMAL(8,2),
  analyst_count INTEGER,
  strong_buy INTEGER DEFAULT 0,
  buy INTEGER DEFAULT 0,
  hold INTEGER DEFAULT 0,
  sell INTEGER DEFAULT 0,
  strong_sell INTEGER DEFAULT 0,
  price_target_high DECIMAL(10,2),
  price_target_low DECIMAL(10,2),
  price_target_median DECIMAL(10,2),
  price_target_average DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(symbol, date)
);

-- Table du calendrier des résultats
CREATE TABLE IF NOT EXISTS earnings_calendar (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  date DATE NOT NULL,
  period TEXT, -- 'Q1', 'Q2', 'Q3', 'Q4', 'FY'
  year INTEGER,
  eps_actual DECIMAL(8,2),
  eps_estimated DECIMAL(8,2),
  eps_surprise DECIMAL(8,2),
  revenue_actual BIGINT,
  revenue_estimated BIGINT,
  revenue_surprise DECIMAL(8,2),
  is_upcoming BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(symbol, date, period)
);

-- Table des actualités
CREATE TABLE IF NOT EXISTS news_articles (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT,
  title TEXT NOT NULL,
  content TEXT,
  url TEXT UNIQUE,
  source TEXT,
  published_at TIMESTAMPTZ,
  sentiment TEXT, -- 'positive', 'negative', 'neutral'
  sentiment_score DECIMAL(3,2), -- -1.0 to 1.0
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des métriques de validation
CREATE TABLE IF NOT EXISTS data_validation (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  data_type TEXT NOT NULL, -- 'quote', 'profile', 'ratios', 'analyst', 'earnings'
  date DATE NOT NULL,
  confidence_score DECIMAL(3,2), -- 0.0 to 1.0
  validation_status TEXT, -- 'validated', 'single_source', 'error'
  sources TEXT[], -- ['FMP', 'Yahoo', 'Finnhub']
  discrepancies TEXT[],
  data_quality TEXT, -- 'A', 'B', 'C', 'D', 'F'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(symbol, data_type, date)
);

-- Table de synchronisation
CREATE TABLE IF NOT EXISTS sync_log (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  data_type TEXT NOT NULL,
  sync_type TEXT NOT NULL, -- 'full', 'incremental', 'validation'
  status TEXT NOT NULL, -- 'success', 'error', 'partial'
  records_processed INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER
);

-- ========================================
-- INDEXES POUR PERFORMANCE
-- ========================================

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_stocks_symbol ON stocks(symbol);
CREATE INDEX IF NOT EXISTS idx_daily_prices_symbol_date ON daily_prices(symbol, date DESC);
CREATE INDEX IF NOT EXISTS idx_intraday_prices_symbol_datetime ON intraday_prices(symbol, datetime DESC);
CREATE INDEX IF NOT EXISTS idx_financial_ratios_symbol_date ON financial_ratios(symbol, date DESC);
CREATE INDEX IF NOT EXISTS idx_analyst_recommendations_symbol_date ON analyst_recommendations(symbol, date DESC);
CREATE INDEX IF NOT EXISTS idx_earnings_calendar_symbol_date ON earnings_calendar(symbol, date DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_symbol_published ON news_articles(symbol, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_validation_symbol_type_date ON data_validation(symbol, data_type, date DESC);
CREATE INDEX IF NOT EXISTS idx_sync_log_symbol_type ON sync_log(symbol, data_type, started_at DESC);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_daily_prices_date ON daily_prices(date DESC);
CREATE INDEX IF NOT EXISTS idx_earnings_upcoming ON earnings_calendar(is_upcoming, date) WHERE is_upcoming = true;
CREATE INDEX IF NOT EXISTS idx_news_published ON news_articles(published_at DESC);

-- ========================================
-- TRIGGERS POUR MISE À JOUR AUTOMATIQUE
-- ========================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_stocks_updated_at 
    BEFORE UPDATE ON stocks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- FONCTIONS UTILITAIRES
-- ========================================

-- Fonction pour nettoyer les anciennes données
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Supprimer les prix intraday de plus de 30 jours
    DELETE FROM intraday_prices 
    WHERE datetime < NOW() - INTERVAL '30 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Supprimer les actualités de plus de 90 jours
    DELETE FROM news_articles 
    WHERE published_at < NOW() - INTERVAL '90 days';
    
    -- Supprimer les logs de sync de plus de 30 jours
    DELETE FROM sync_log 
    WHERE started_at < NOW() - INTERVAL '30 days';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les données complètes d'un titre
CREATE OR REPLACE FUNCTION get_stock_complete_data(symbol_param TEXT, date_param DATE DEFAULT CURRENT_DATE)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'stock', (SELECT row_to_json(s) FROM stocks s WHERE s.symbol = symbol_param),
        'latest_price', (SELECT row_to_json(p) FROM daily_prices p WHERE p.symbol = symbol_param ORDER BY p.date DESC LIMIT 1),
        'latest_ratios', (SELECT row_to_json(r) FROM financial_ratios r WHERE r.symbol = symbol_param ORDER BY r.date DESC LIMIT 1),
        'latest_analyst', (SELECT row_to_json(a) FROM analyst_recommendations a WHERE a.symbol = symbol_param ORDER BY a.date DESC LIMIT 1),
        'next_earnings', (SELECT row_to_json(e) FROM earnings_calendar e WHERE e.symbol = symbol_param AND e.is_upcoming = true ORDER BY e.date ASC LIMIT 1),
        'recent_news', (SELECT json_agg(row_to_json(n)) FROM news_articles n WHERE n.symbol = symbol_param ORDER BY n.published_at DESC LIMIT 5)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- DONNÉES DE TEST
-- ========================================

-- Insérer quelques titres de test
INSERT INTO stocks (symbol, name, sector, industry, country, exchange) 
VALUES 
    ('AAPL', 'Apple Inc.', 'Technology', 'Consumer Electronics', 'US', 'NASDAQ'),
    ('MSFT', 'Microsoft Corporation', 'Technology', 'Software', 'US', 'NASDAQ'),
    ('GOOGL', 'Alphabet Inc.', 'Technology', 'Internet Content & Information', 'US', 'NASDAQ'),
    ('TSLA', 'Tesla Inc.', 'Consumer Discretionary', 'Auto Manufacturers', 'US', 'NASDAQ'),
    ('NVDA', 'NVIDIA Corporation', 'Technology', 'Semiconductors', 'US', 'NASDAQ')
ON CONFLICT (symbol) DO NOTHING;

-- ========================================
-- VÉRIFICATION
-- ========================================

-- Vérifier la création des tables
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('stocks', 'daily_prices', 'intraday_prices', 'financial_ratios', 'analyst_recommendations', 'earnings_calendar', 'news_articles', 'data_validation', 'sync_log')
ORDER BY tablename;

-- Vérifier les indexes
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('stocks', 'daily_prices', 'intraday_prices', 'financial_ratios', 'analyst_recommendations', 'earnings_calendar', 'news_articles', 'data_validation', 'sync_log')
ORDER BY tablename, indexname;
