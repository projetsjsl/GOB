-- ============================================================================
-- SEEKING ALPHA REFACTORED SCHEMA FOR SUPABASE
-- This schema replaces the GitHub JSON file approach with proper database tables
-- ============================================================================

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS seeking_alpha_analysis CASCADE;
DROP TABLE IF EXISTS seeking_alpha_raw_data CASCADE;
DROP TABLE IF EXISTS tickers CASCADE;
DROP VIEW IF EXISTS latest_seeking_alpha_analysis CASCADE;

-- ============================================================================
-- TABLE 1: TICKERS (Master List)
-- Replaces: /public/tickers.json
-- ============================================================================
CREATE TABLE tickers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticker VARCHAR(10) NOT NULL UNIQUE,
    company_name VARCHAR(255),
    sector VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'team', 'watchlist', 'all'
    added_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_scraped TIMESTAMP WITH TIME ZONE,
    scraping_enabled BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_tickers_ticker ON tickers(ticker);
CREATE INDEX idx_tickers_active ON tickers(is_active) WHERE is_active = true;
CREATE INDEX idx_tickers_source ON tickers(source);
CREATE INDEX idx_tickers_last_scraped ON tickers(last_scraped DESC NULLS LAST);

-- ============================================================================
-- TABLE 2: RAW SCRAPED DATA (Historical Archive)
-- Stores the raw HTML/text scraped from Seeking Alpha
-- Replaces: /public/stock_analysis.json (raw_text field)
-- ============================================================================
CREATE TABLE seeking_alpha_raw_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticker VARCHAR(10) NOT NULL REFERENCES tickers(ticker) ON DELETE CASCADE,
    url TEXT NOT NULL,
    raw_html TEXT, -- Full HTML if available
    raw_text TEXT NOT NULL, -- Extracted text content
    scrape_method VARCHAR(50), -- 'manual', 'automated', 'api'
    scrape_duration_ms INTEGER, -- How long the scrape took
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    status VARCHAR(50) DEFAULT 'success', -- 'success', 'partial', 'failed'
    error_message TEXT,
    metadata JSONB, -- Additional scraping metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for querying
CREATE INDEX idx_sa_raw_ticker ON seeking_alpha_raw_data(ticker);
CREATE INDEX idx_sa_raw_scraped_at ON seeking_alpha_raw_data(scraped_at DESC);
CREATE INDEX idx_sa_raw_status ON seeking_alpha_raw_data(status);
CREATE INDEX idx_sa_raw_ticker_date ON seeking_alpha_raw_data(ticker, scraped_at DESC);

-- ============================================================================
-- TABLE 3: ANALYZED DATA (Claude AI Processed)
-- Stores the structured analysis from Claude
-- Replaces: /public/stock_data.json
-- ============================================================================
CREATE TABLE seeking_alpha_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticker VARCHAR(10) NOT NULL REFERENCES tickers(ticker) ON DELETE CASCADE,
    raw_data_id UUID REFERENCES seeking_alpha_raw_data(id) ON DELETE SET NULL,

    -- Basic Company Info
    company_name VARCHAR(255),
    sector VARCHAR(100),
    industry VARCHAR(100),

    -- Price & Market Data
    current_price DECIMAL(12, 2),
    price_change DECIMAL(12, 2),
    price_change_percent DECIMAL(8, 4),
    market_cap VARCHAR(50), -- Store as string (e.g., "1.95T", "250.5B")
    market_cap_numeric BIGINT, -- Numeric value for sorting/filtering

    -- Valuation Metrics
    pe_ratio DECIMAL(8, 2),
    forward_pe DECIMAL(8, 2),
    peg_ratio DECIMAL(8, 4),
    price_to_book DECIMAL(8, 4),
    price_to_sales DECIMAL(8, 4),
    ev_to_ebitda DECIMAL(8, 4),

    -- Dividend Information
    dividend_yield DECIMAL(8, 4),
    annual_dividend DECIMAL(12, 4),
    dividend_frequency VARCHAR(50),
    ex_dividend_date DATE,
    payout_ratio DECIMAL(8, 4),

    -- Growth Metrics
    revenue_growth_yoy DECIMAL(8, 4),
    earnings_growth_yoy DECIMAL(8, 4),
    revenue_growth_3y DECIMAL(8, 4),
    earnings_growth_3y DECIMAL(8, 4),

    -- Profitability
    gross_margin DECIMAL(8, 4),
    operating_margin DECIMAL(8, 4),
    net_margin DECIMAL(8, 4),
    roe DECIMAL(8, 4),
    roa DECIMAL(8, 4),
    roic DECIMAL(8, 4),

    -- Financial Health
    current_ratio DECIMAL(8, 4),
    quick_ratio DECIMAL(8, 4),
    debt_to_equity DECIMAL(8, 4),
    interest_coverage DECIMAL(8, 4),

    -- Quant Ratings (A+ to F scale)
    quant_overall VARCHAR(5),
    quant_valuation VARCHAR(5),
    quant_growth VARCHAR(5),
    quant_profitability VARCHAR(5),
    quant_momentum VARCHAR(5),
    quant_eps_revisions VARCHAR(5),

    -- AI Analysis Results
    strengths TEXT[], -- Array of strength bullet points
    concerns TEXT[], -- Array of concern bullet points
    analyst_rating VARCHAR(20), -- 'Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell'
    analyst_recommendation TEXT, -- Detailed recommendation
    risk_level VARCHAR(20), -- 'Low', 'Medium', 'High'
    investment_horizon VARCHAR(50), -- 'Short-term', 'Medium-term', 'Long-term'

    -- Company Profile
    company_description TEXT,
    employees INTEGER,
    ceo VARCHAR(255),
    headquarters VARCHAR(255),
    founded_year INTEGER,

    -- Metadata
    analysis_model VARCHAR(100), -- 'claude-3-5-sonnet', 'gpt-4', etc.
    analysis_prompt_version VARCHAR(50),
    analysis_confidence DECIMAL(4, 2), -- 0.00 to 1.00
    processing_time_ms INTEGER,
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Timestamps
    data_as_of_date DATE, -- The date this data represents (not when it was scraped)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Unique constraint: one analysis per ticker per day
    UNIQUE(ticker, data_as_of_date)
);

-- Indexes for performance
CREATE INDEX idx_sa_analysis_ticker ON seeking_alpha_analysis(ticker);
CREATE INDEX idx_sa_analysis_analyzed_at ON seeking_alpha_analysis(analyzed_at DESC);
CREATE INDEX idx_sa_analysis_ticker_date ON seeking_alpha_analysis(ticker, data_as_of_date DESC);
CREATE INDEX idx_sa_analysis_rating ON seeking_alpha_analysis(analyst_rating);
CREATE INDEX idx_sa_analysis_sector ON seeking_alpha_analysis(sector);
CREATE INDEX idx_sa_analysis_quant_overall ON seeking_alpha_analysis(quant_overall);

-- ============================================================================
-- VIEW: LATEST ANALYSIS (Most Recent Per Ticker)
-- ============================================================================
CREATE VIEW latest_seeking_alpha_analysis AS
SELECT DISTINCT ON (ticker)
    *
FROM seeking_alpha_analysis
ORDER BY ticker, data_as_of_date DESC, analyzed_at DESC;

-- Create index on the materialized view for faster queries
CREATE INDEX idx_latest_sa_analysis_ticker ON seeking_alpha_analysis(ticker, data_as_of_date DESC);

-- ============================================================================
-- TRIGGER: AUTO-UPDATE TIMESTAMPS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tickers table
CREATE TRIGGER update_tickers_updated_at
    BEFORE UPDATE ON tickers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply to analysis table
CREATE TRIGGER update_sa_analysis_updated_at
    BEFORE UPDATE ON seeking_alpha_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: CLEANUP OLD DATA (Keep last 90 days of raw data)
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_old_seeking_alpha_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete raw data older than 90 days (keep analysis forever)
    DELETE FROM seeking_alpha_raw_data
    WHERE scraped_at < NOW() - INTERVAL '90 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: GET TICKERS TO SCRAPE (Returns tickers that need updating)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_tickers_to_scrape(
    max_age_hours INTEGER DEFAULT 24,
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
    ticker VARCHAR(10),
    company_name VARCHAR(255),
    last_scraped TIMESTAMP WITH TIME ZONE,
    hours_since_last_scrape NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.ticker,
        t.company_name,
        t.last_scraped,
        EXTRACT(EPOCH FROM (NOW() - t.last_scraped)) / 3600 AS hours_since_last_scrape
    FROM tickers t
    WHERE
        t.is_active = true
        AND t.scraping_enabled = true
        AND (
            t.last_scraped IS NULL
            OR t.last_scraped < NOW() - (max_age_hours || ' hours')::INTERVAL
        )
    ORDER BY
        t.last_scraped NULLS FIRST,
        t.ticker
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE tickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE seeking_alpha_raw_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE seeking_alpha_analysis ENABLE ROW LEVEL SECURITY;

-- Policy 1: Public READ access for all tables
CREATE POLICY "Allow public read access to tickers"
    ON tickers FOR SELECT
    USING (true);

CREATE POLICY "Allow public read access to raw data"
    ON seeking_alpha_raw_data FOR SELECT
    USING (true);

CREATE POLICY "Allow public read access to analysis"
    ON seeking_alpha_analysis FOR SELECT
    USING (true);

-- Policy 2: Authenticated WRITE access
CREATE POLICY "Allow authenticated insert to tickers"
    ON tickers FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update to tickers"
    ON tickers FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert to raw data"
    ON seeking_alpha_raw_data FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert to analysis"
    ON seeking_alpha_analysis FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update to analysis"
    ON seeking_alpha_analysis FOR UPDATE
    USING (auth.role() = 'authenticated');

-- ============================================================================
-- SEED DATA: Insert existing tickers from tickers.json
-- ============================================================================
INSERT INTO tickers (ticker, company_name, source, scraping_enabled) VALUES
    ('GOOGL', 'Alphabet Inc.', 'team', true),
    ('T', 'AT&T Inc.', 'team', true),
    ('BNS', 'Bank of Nova Scotia', 'team', true),
    ('TD', 'Toronto-Dominion Bank', 'team', true),
    ('BCE', 'BCE Inc.', 'team', true),
    ('CNR', 'Canadian National Railway', 'team', true),
    ('CSCO', 'Cisco Systems', 'team', true),
    ('CVS', 'CVS Health Corporation', 'team', true),
    ('DEO', 'Diageo plc', 'team', true),
    ('MDT', 'Medtronic plc', 'team', true),
    ('JNJ', 'Johnson & Johnson', 'team', true),
    ('JPM', 'JPMorgan Chase & Co.', 'team', true),
    ('LVMHF', 'LVMH Moët Hennessy', 'team', true),
    ('MG', 'Mistras Group', 'team', true),
    ('MFC', 'Manulife Financial', 'team', true),
    ('MU', 'Micron Technology', 'team', true),
    ('NSRGY', 'Nestlé S.A.', 'team', true),
    ('NKE', 'Nike Inc.', 'team', true),
    ('NTR', 'Nutrien Ltd.', 'team', true),
    ('PFE', 'Pfizer Inc.', 'team', true),
    ('TRP', 'TC Energy Corporation', 'team', true),
    ('UNH', 'UnitedHealth Group', 'team', true),
    ('UL', 'Unilever PLC', 'team', true),
    ('VZ', 'Verizon Communications', 'team', true),
    ('WFC', 'Wells Fargo & Company', 'team', true)
ON CONFLICT (ticker) DO NOTHING;

-- ============================================================================
-- HELPFUL QUERIES FOR ADMINS
-- ============================================================================

-- Query 1: Get scraping statistics
COMMENT ON TABLE tickers IS 'Master list of tickers to scrape. Query: SELECT * FROM tickers WHERE is_active = true ORDER BY last_scraped NULLS FIRST;';

-- Query 2: Get latest analysis for all tickers
COMMENT ON VIEW latest_seeking_alpha_analysis IS 'Latest analysis per ticker. Query: SELECT ticker, analyst_rating, quant_overall, analyzed_at FROM latest_seeking_alpha_analysis ORDER BY ticker;';

-- Query 3: Find stale data
COMMENT ON FUNCTION get_tickers_to_scrape IS 'Get tickers needing refresh. Query: SELECT * FROM get_tickers_to_scrape(24, 50);';

-- ============================================================================
-- GRANT PERMISSIONS (if using service role)
-- ============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ============================================================================
-- COMPLETION SUMMARY
-- ============================================================================
-- Tables Created:
--   1. tickers (25 rows inserted)
--   2. seeking_alpha_raw_data (empty, ready for scraping)
--   3. seeking_alpha_analysis (empty, ready for AI processing)
--
-- Views Created:
--   1. latest_seeking_alpha_analysis (shows most recent data per ticker)
--
-- Functions Created:
--   1. cleanup_old_seeking_alpha_data() - Auto-cleanup
--   2. get_tickers_to_scrape() - Smart scraping queue
--   3. update_updated_at_column() - Auto-timestamp updates
--
-- Next Steps:
--   1. Run this script in Supabase SQL Editor
--   2. Update API endpoints to use these tables
--   3. Migrate existing stock_analysis.json data (use migration script)
--   4. Update frontend to fetch from Supabase instead of JSON files
-- ============================================================================
