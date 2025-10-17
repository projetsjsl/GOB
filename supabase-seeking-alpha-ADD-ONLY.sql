-- ============================================================================
-- SEEKING ALPHA - ADD COMPREHENSIVE ANALYSIS TABLE
-- This schema ADDS to your existing tables, doesn't replace them
--
-- EXISTING TABLES (keeping as-is):
--   - team_tickers (4 columns)
--   - seeking_alpha_data (12 columns - raw scraped data)
--   - seeking_alpha_latest (10 columns - view)
--
-- NEW TABLE (creating):
--   - seeking_alpha_analysis (50+ columns - comprehensive Claude AI analysis)
-- ============================================================================

-- Drop if exists (safe to re-run)
DROP TABLE IF EXISTS seeking_alpha_analysis CASCADE;
DROP VIEW IF EXISTS latest_seeking_alpha_analysis CASCADE;

-- ============================================================================
-- TABLE: SEEKING_ALPHA_ANALYSIS (Claude AI Comprehensive Analysis)
-- Stores structured analysis results from Claude
-- Links to existing seeking_alpha_data via ticker
-- ============================================================================
CREATE TABLE seeking_alpha_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticker VARCHAR(10) NOT NULL,
    -- Reference to raw data (if you want to link them)
    raw_data_id UUID, -- Can reference seeking_alpha_data.id if it has one

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
    data_as_of_date DATE DEFAULT CURRENT_DATE, -- The date this data represents
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

-- ============================================================================
-- TRIGGER: AUTO-UPDATE TIMESTAMPS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_sa_analysis_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sa_analysis_timestamp
    BEFORE UPDATE ON seeking_alpha_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_sa_analysis_timestamp();

-- ============================================================================
-- FUNCTION: GET TICKERS NEEDING ANALYSIS
-- Returns tickers from team_tickers that don't have recent analysis
-- ============================================================================
CREATE OR REPLACE FUNCTION get_tickers_needing_analysis(
    max_age_hours INTEGER DEFAULT 24,
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
    ticker VARCHAR(10),
    last_analyzed TIMESTAMP WITH TIME ZONE,
    hours_since_analysis NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        tt.ticker,
        sa.analyzed_at as last_analyzed,
        EXTRACT(EPOCH FROM (NOW() - sa.analyzed_at)) / 3600 AS hours_since_analysis
    FROM team_tickers tt
    LEFT JOIN (
        SELECT DISTINCT ON (ticker)
            ticker,
            analyzed_at
        FROM seeking_alpha_analysis
        ORDER BY ticker, analyzed_at DESC
    ) sa ON tt.ticker = sa.ticker
    WHERE
        sa.analyzed_at IS NULL
        OR sa.analyzed_at < NOW() - (max_age_hours || ' hours')::INTERVAL
    ORDER BY
        sa.analyzed_at NULLS FIRST,
        tt.ticker
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE seeking_alpha_analysis ENABLE ROW LEVEL SECURITY;

-- Public READ access
CREATE POLICY "Allow public read access to analysis"
    ON seeking_alpha_analysis FOR SELECT
    USING (true);

-- Authenticated WRITE access
CREATE POLICY "Allow authenticated insert to analysis"
    ON seeking_alpha_analysis FOR INSERT
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Allow authenticated update to analysis"
    ON seeking_alpha_analysis FOR UPDATE
    USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON seeking_alpha_analysis TO anon, authenticated, service_role;
GRANT INSERT, UPDATE ON seeking_alpha_analysis TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_tickers_needing_analysis TO anon, authenticated, service_role;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check table created successfully
SELECT 'seeking_alpha_analysis table created' as status,
       COUNT(*) as row_count
FROM seeking_alpha_analysis;

-- Check view created
SELECT 'latest_seeking_alpha_analysis view created' as status,
       COUNT(*) as row_count
FROM latest_seeking_alpha_analysis;

-- Check function works
SELECT 'get_tickers_needing_analysis function works' as status,
       COUNT(*) as tickers_needing_analysis
FROM get_tickers_needing_analysis(24, 100);

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================
SELECT '✅ Schema update complete!' as message;
SELECT '📊 New table: seeking_alpha_analysis (50+ columns)' as info;
SELECT '👀 New view: latest_seeking_alpha_analysis' as info;
SELECT '🔧 New function: get_tickers_needing_analysis()' as info;
SELECT '🔒 RLS policies enabled' as info;
SELECT '' as blank;
SELECT '📝 Next steps:' as next_steps;
SELECT '1. Update API endpoints to use seeking_alpha_analysis table' as step;
SELECT '2. Test scraper saves to new table' as step;
SELECT '3. Verify frontend displays data correctly' as step;

-- ============================================================================
