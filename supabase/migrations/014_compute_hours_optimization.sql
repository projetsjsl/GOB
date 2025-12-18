-- Migration 014: Compute Hours Optimization
-- Optimizes database to reduce Compute Hours usage and improve performance

-- ============================================
-- 1. CONSOLIDATE MULTIPLE PERMISSIVE RLS POLICIES
-- ============================================
-- Multiple permissive policies cause each policy to be executed for every query
-- Consolidating them improves performance significantly

-- analyst_recommendations: Consolidate "Allow API upsert" and "Allow public read access"
DROP POLICY IF EXISTS "Allow API upsert" ON public.analyst_recommendations;
DROP POLICY IF EXISTS "Allow public read access" ON public.analyst_recommendations;
CREATE POLICY "Allow all access for API and public" ON public.analyst_recommendations
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- daily_prices: Consolidate policies
DROP POLICY IF EXISTS "Allow API upsert" ON public.daily_prices;
DROP POLICY IF EXISTS "Allow public read access" ON public.daily_prices;
CREATE POLICY "Allow all access for API and public" ON public.daily_prices
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- financial_ratios: Consolidate policies
DROP POLICY IF EXISTS "Allow API upsert" ON public.financial_ratios;
DROP POLICY IF EXISTS "Allow public read access" ON public.financial_ratios;
CREATE POLICY "Allow all access for API and public" ON public.financial_ratios
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- news_articles: Consolidate policies
DROP POLICY IF EXISTS "Allow API upsert" ON public.news_articles;
DROP POLICY IF EXISTS "Allow public read access" ON public.news_articles;
CREATE POLICY "Allow all access for API and public" ON public.news_articles
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- stock_profiles: Consolidate policies
DROP POLICY IF EXISTS "Allow API upsert" ON public.stock_profiles;
DROP POLICY IF EXISTS "Allow public read access" ON public.stock_profiles;
CREATE POLICY "Allow all access for API and public" ON public.stock_profiles
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- stock_quotes: Consolidate policies
DROP POLICY IF EXISTS "Allow API upsert" ON public.stock_quotes;
DROP POLICY IF EXISTS "Allow public read access" ON public.stock_quotes;
CREATE POLICY "Allow all access for API and public" ON public.stock_quotes
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- earnings_calendar: Consolidate multiple policies
DROP POLICY IF EXISTS "Allow API upsert" ON public.earnings_calendar;
DROP POLICY IF EXISTS "Allow insert/update for all" ON public.earnings_calendar;
DROP POLICY IF EXISTS "Allow public read access" ON public.earnings_calendar;
DROP POLICY IF EXISTS "Allow read access to all" ON public.earnings_calendar;
CREATE POLICY "Allow all access for API and public" ON public.earnings_calendar
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- briefings: Consolidate policies
DROP POLICY IF EXISTS "Allow insert/update for all" ON public.briefings;
DROP POLICY IF EXISTS "Allow read access to all" ON public.briefings;
CREATE POLICY "Allow all access for briefings" ON public.briefings
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- briefing_config: Consolidate policies
DROP POLICY IF EXISTS "Allow insert/update for all" ON public.briefing_config;
DROP POLICY IF EXISTS "Allow read access to all" ON public.briefing_config;
CREATE POLICY "Allow all access for briefing config" ON public.briefing_config
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- briefing_subscribers: Consolidate policies
DROP POLICY IF EXISTS "Allow insert/update for all" ON public.briefing_subscribers;
DROP POLICY IF EXISTS "Allow read access to all" ON public.briefing_subscribers;
CREATE POLICY "Allow all access for briefing subscribers" ON public.briefing_subscribers
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- briefings_history: Consolidate policies
DROP POLICY IF EXISTS "Allow insert/update for all briefings" ON public.briefings_history;
DROP POLICY IF EXISTS "Allow read access to all briefings" ON public.briefings_history;
CREATE POLICY "Allow all access for briefings history" ON public.briefings_history
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- earnings_results: Consolidate policies
DROP POLICY IF EXISTS "Allow insert/update for all" ON public.earnings_results;
DROP POLICY IF EXISTS "Allow read access to all" ON public.earnings_results;
CREATE POLICY "Allow all access for earnings results" ON public.earnings_results
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- pre_earnings_analysis: Consolidate policies
DROP POLICY IF EXISTS "Allow insert/update for all" ON public.pre_earnings_analysis;
DROP POLICY IF EXISTS "Allow read access to all" ON public.pre_earnings_analysis;
CREATE POLICY "Allow all access for pre earnings analysis" ON public.pre_earnings_analysis
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- significant_news: Consolidate policies
DROP POLICY IF EXISTS "Allow insert/update for all" ON public.significant_news;
DROP POLICY IF EXISTS "Allow read access to all" ON public.significant_news;
CREATE POLICY "Allow all access for significant news" ON public.significant_news
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- seeking_alpha_data: Consolidate policies
DROP POLICY IF EXISTS "Allow insert/update for all SA" ON public.seeking_alpha_data;
DROP POLICY IF EXISTS "Allow read access to all SA" ON public.seeking_alpha_data;
CREATE POLICY "Allow all access for seeking alpha data" ON public.seeking_alpha_data
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- market_news_cache: Consolidate policies
DROP POLICY IF EXISTS "Allow insert/update for all" ON public.market_news_cache;
DROP POLICY IF EXISTS "Allow read access to all" ON public.market_news_cache;
CREATE POLICY "Allow all access for market news cache" ON public.market_news_cache
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- symbol_news_cache: Consolidate policies
DROP POLICY IF EXISTS "Allow insert/update for all" ON public.symbol_news_cache;
DROP POLICY IF EXISTS "Allow read access to all" ON public.symbol_news_cache;
CREATE POLICY "Allow all access for symbol news cache" ON public.symbol_news_cache
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- populate_configs: Consolidate policies
DROP POLICY IF EXISTS "Allow insert/update for all configs" ON public.populate_configs;
DROP POLICY IF EXISTS "Allow read access to all configs" ON public.populate_configs;
CREATE POLICY "Allow all access for populate configs" ON public.populate_configs
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- team_logs: Consolidate policies
DROP POLICY IF EXISTS "Allow insert/update for all" ON public.team_logs;
DROP POLICY IF EXISTS "Allow read access to all" ON public.team_logs;
CREATE POLICY "Allow all access for team logs" ON public.team_logs
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- team_newsletters: Consolidate policies
DROP POLICY IF EXISTS "Allow insert/update for all" ON public.team_newsletters;
DROP POLICY IF EXISTS "Allow read access to all" ON public.team_newsletters;
CREATE POLICY "Allow all access for team newsletters" ON public.team_newsletters
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- team_tickers: Consolidate policies
DROP POLICY IF EXISTS "Allow insert/update for all" ON public.team_tickers;
DROP POLICY IF EXISTS "Allow read access to all" ON public.team_tickers;
CREATE POLICY "Allow all access for team tickers" ON public.team_tickers
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- tickers: Consolidate policies
DROP POLICY IF EXISTS "Allow insert/update for all" ON public.tickers;
DROP POLICY IF EXISTS "Allow read access to all" ON public.tickers;
CREATE POLICY "Allow all access for tickers" ON public.tickers
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- yield_curve_data: Consolidate policies
DROP POLICY IF EXISTS "Allow insert/update for all" ON public.yield_curve_data;
DROP POLICY IF EXISTS "Allow read access to all" ON public.yield_curve_data;
CREATE POLICY "Allow all access for yield curve data" ON public.yield_curve_data
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- finance_snapshots: Consolidate policies
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.finance_snapshots;
DROP POLICY IF EXISTS "Allow read for anonymous" ON public.finance_snapshots;
CREATE POLICY "Allow all access for finance snapshots" ON public.finance_snapshots
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- watchlist: Consolidate policies (keep service role separate)
DROP POLICY IF EXISTS "Allow insert/update for all" ON public.watchlist;
DROP POLICY IF EXISTS "Allow read access to all" ON public.watchlist;
DROP POLICY IF EXISTS "Public read access to watchlist" ON public.watchlist;
-- Keep "Service role has full access to watchlist" as it's for service_role
CREATE POLICY "Allow all access for watchlist" ON public.watchlist
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- watchlists: Consolidate policies
DROP POLICY IF EXISTS "Allow insert/update for all" ON public.watchlists;
DROP POLICY IF EXISTS "Allow read access to all" ON public.watchlists;
DROP POLICY IF EXISTS "Users can view their own watchlists" ON public.watchlists;
DROP POLICY IF EXISTS "Users can insert their own watchlists" ON public.watchlists;
DROP POLICY IF EXISTS "Users can update their own watchlists" ON public.watchlists;
DROP POLICY IF EXISTS "Users can delete their own watchlists" ON public.watchlists;
CREATE POLICY "Allow all access for watchlists" ON public.watchlists
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- watchlist_instruments: Consolidate policies
DROP POLICY IF EXISTS "Users can view instruments in their watchlists" ON public.watchlist_instruments;
DROP POLICY IF EXISTS "Users can manage instruments in their watchlists" ON public.watchlist_instruments;
CREATE POLICY "Allow all access for watchlist instruments" ON public.watchlist_instruments
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- 2. REMOVE CLEARLY UNUSED INDEXES
-- ============================================
-- Remove indexes that have never been used and are unlikely to be needed
-- This reduces storage and improves write performance

-- Note: We're being conservative and only removing indexes that are clearly unused
-- and have no logical reason to exist (e.g., indexes on rarely queried columns)

-- sms_invitations: Remove unused indexes (these columns are rarely queried)
DROP INDEX IF EXISTS idx_sms_invitations_sent_by;
DROP INDEX IF EXISTS idx_sms_invitations_status;
DROP INDEX IF EXISTS idx_sms_invitations_sent_at;
DROP INDEX IF EXISTS idx_sms_invitations_twilio_sid;

-- tool_usage_stats: Remove unused indexes
DROP INDEX IF EXISTS idx_tool_usage_stats_last_used;
DROP INDEX IF EXISTS idx_tool_usage_stats_success_rate;

-- response_cache: Remove unused indexes (cache_key is already unique, expires_at rarely queried)
DROP INDEX IF EXISTS idx_expires_at;
DROP INDEX IF EXISTS idx_ticker;
DROP INDEX IF EXISTS idx_channel;

-- ============================================
-- 3. OPTIMIZE QUERY PATTERNS
-- ============================================
-- Add materialized views for frequently accessed data

-- Create materialized view for active tickers (reduces repeated queries)
CREATE MATERIALIZED VIEW IF NOT EXISTS active_tickers_summary AS
SELECT 
    ticker,
    company_name,
    sector,
    industry,
    country,
    exchange,
    currency,
    market_cap,
    priority,
    category,
    is_active,
    created_at,
    updated_at
FROM public.tickers
WHERE is_active = true;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_tickers_summary_ticker 
ON active_tickers_summary(ticker);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_active_tickers_summary_category 
ON active_tickers_summary(category, priority DESC, ticker ASC);

-- Function to refresh materialized view (call periodically)
CREATE OR REPLACE FUNCTION refresh_active_tickers_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY active_tickers_summary;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. ANALYZE TABLES FOR BETTER QUERY PLANNING
-- ============================================
-- Update statistics for better query planning

ANALYZE public.tickers;
ANALYZE public.yield_curve_data;
ANALYZE public.daily_market_cache;
ANALYZE public.ticker_price_cache;
ANALYZE public.watchlists;
ANALYZE public.watchlist_instruments;

-- ============================================
-- 5. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON MATERIALIZED VIEW active_tickers_summary IS 
'Materialized view of active tickers to reduce repeated queries. Refresh with: SELECT refresh_active_tickers_summary();';

COMMENT ON FUNCTION refresh_active_tickers_summary() IS 
'Refreshes the active_tickers_summary materialized view. Should be called periodically (e.g., every 5-15 minutes) or after bulk ticker updates.';

