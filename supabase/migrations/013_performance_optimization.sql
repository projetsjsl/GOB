-- Migration 013: Performance Optimization Based on Supabase Advisors
-- Optimizes database performance based on Supabase performance advisors recommendations

-- ============================================
-- 1. ADD MISSING INDEXES ON FOREIGN KEYS
-- ============================================
-- These indexes improve join performance and foreign key constraint checks

-- channel_logs.conversation_id
CREATE INDEX IF NOT EXISTS idx_channel_logs_conversation_id 
ON public.channel_logs(conversation_id);

-- earnings_results.earnings_calendar_id
CREATE INDEX IF NOT EXISTS idx_earnings_results_calendar_id 
ON public.earnings_results(earnings_calendar_id);

-- kpi_definitions.created_by
CREATE INDEX IF NOT EXISTS idx_kpi_definitions_created_by 
ON public.kpi_definitions(created_by);

-- pre_earnings_analysis.earnings_calendar_id
CREATE INDEX IF NOT EXISTS idx_pre_earnings_analysis_calendar_id 
ON public.pre_earnings_analysis(earnings_calendar_id);

-- user_role_mapping.role_id
CREATE INDEX IF NOT EXISTS idx_user_role_mapping_role_id 
ON public.user_role_mapping(role_id);

-- ============================================
-- 2. OPTIMIZE RLS POLICIES - Use (select auth.uid()) pattern
-- ============================================
-- This prevents re-evaluation of auth functions for each row, improving performance at scale

-- instruments table
DROP POLICY IF EXISTS "Instruments are insertable by authenticated users" ON public.instruments;
CREATE POLICY "Instruments are insertable by authenticated users" ON public.instruments
    FOR INSERT
    WITH CHECK ((select auth.uid()) IS NOT NULL);

-- seeking_alpha_analysis table
DROP POLICY IF EXISTS "Allow authenticated insert to analysis" ON public.seeking_alpha_analysis;
CREATE POLICY "Allow authenticated insert to analysis" ON public.seeking_alpha_analysis
    FOR INSERT
    WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated update to analysis" ON public.seeking_alpha_analysis;
CREATE POLICY "Allow authenticated update to analysis" ON public.seeking_alpha_analysis
    FOR UPDATE
    USING ((select auth.uid()) IS NOT NULL)
    WITH CHECK ((select auth.uid()) IS NOT NULL);

-- kpi_definitions table
DROP POLICY IF EXISTS "Public KPIs are viewable by everyone" ON public.kpi_definitions;
CREATE POLICY "Public KPIs are viewable by everyone" ON public.kpi_definitions
    FOR SELECT
    USING (is_public = true OR (select auth.uid()) = created_by);

DROP POLICY IF EXISTS "KPIs are insertable by authenticated users" ON public.kpi_definitions;
CREATE POLICY "KPIs are insertable by authenticated users" ON public.kpi_definitions
    FOR INSERT
    WITH CHECK ((select auth.uid()) IS NOT NULL);

-- watchlists table
DROP POLICY IF EXISTS "Users can view their own watchlists" ON public.watchlists;
CREATE POLICY "Users can view their own watchlists" ON public.watchlists
    FOR SELECT
    USING (user_id = (select auth.uid())::text);

DROP POLICY IF EXISTS "Users can insert their own watchlists" ON public.watchlists;
CREATE POLICY "Users can insert their own watchlists" ON public.watchlists
    FOR INSERT
    WITH CHECK (user_id = (select auth.uid())::text);

DROP POLICY IF EXISTS "Users can update their own watchlists" ON public.watchlists;
CREATE POLICY "Users can update their own watchlists" ON public.watchlists
    FOR UPDATE
    USING (user_id = (select auth.uid())::text)
    WITH CHECK (user_id = (select auth.uid())::text);

DROP POLICY IF EXISTS "Users can delete their own watchlists" ON public.watchlists;
CREATE POLICY "Users can delete their own watchlists" ON public.watchlists
    FOR DELETE
    USING (user_id = (select auth.uid())::text);

-- watchlist_instruments table
DROP POLICY IF EXISTS "Users can view instruments in their watchlists" ON public.watchlist_instruments;
CREATE POLICY "Users can view instruments in their watchlists" ON public.watchlist_instruments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.watchlists w
            WHERE w.id = watchlist_instruments.watchlist_id
            AND w.user_id = (select auth.uid())::text
        )
    );

DROP POLICY IF EXISTS "Users can manage instruments in their watchlists" ON public.watchlist_instruments;
CREATE POLICY "Users can manage instruments in their watchlists" ON public.watchlist_instruments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.watchlists w
            WHERE w.id = watchlist_instruments.watchlist_id
            AND w.user_id = (select auth.uid())::text
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.watchlists w
            WHERE w.id = watchlist_instruments.watchlist_id
            AND w.user_id = (select auth.uid())::text
        )
    );

-- sms_invitations table
DROP POLICY IF EXISTS "Allow users to view their own invitations" ON public.sms_invitations;
CREATE POLICY "Allow users to view their own invitations" ON public.sms_invitations
    FOR SELECT
    USING (sent_by = (select auth.uid())::text OR (select auth.role()) = 'service_role');

-- ============================================
-- 3. CONSOLIDATE MULTIPLE PERMISSIVE POLICIES
-- ============================================
-- Combine multiple permissive policies into single policies where possible
-- This reduces policy evaluation overhead

-- Note: Some tables have multiple policies that serve different purposes.
-- We'll consolidate only where it makes sense without changing functionality.

-- For tables with "Allow API upsert" and "Allow public read access" policies,
-- we'll keep them separate as they serve different purposes (API vs public access)

-- ============================================
-- 4. REMOVE UNUSED INDEXES (Optional - commented out for safety)
-- ============================================
-- Supabase advisors identified many unused indexes, but we'll be conservative
-- and only remove indexes that are clearly redundant or have been replaced

-- Example: If we have a composite index that covers a single-column index, we can drop the single one
-- But we'll do this carefully after verifying query patterns

-- For now, we'll keep all indexes but add comments for future cleanup
-- Note: COMMENT ON INDEX doesn't support IF EXISTS, so we'll skip these comments
-- These indexes are potentially unused but we'll monitor their usage before removing them

-- ============================================
-- 5. ADD STATISTICS FOR QUERY OPTIMIZATION
-- ============================================
-- Update table statistics to help PostgreSQL choose better query plans

ANALYZE public.channel_logs;
ANALYZE public.earnings_results;
ANALYZE public.kpi_definitions;
ANALYZE public.pre_earnings_analysis;
ANALYZE public.user_role_mapping;
ANALYZE public.watchlists;
ANALYZE public.watchlist_instruments;
ANALYZE public.instruments;
ANALYZE public.seeking_alpha_analysis;
ANALYZE public.sms_invitations;

-- ============================================
-- 6. VACUUM AND REINDEX (Maintenance)
-- ============================================
-- These commands help maintain database performance over time
-- Note: VACUUM can be run manually, but we'll add it as a comment for reference

-- VACUUM ANALYZE public.channel_logs;
-- VACUUM ANALYZE public.earnings_results;
-- VACUUM ANALYZE public.kpi_definitions;

-- ============================================
-- 7. ADD COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON INDEX idx_channel_logs_conversation_id IS 'Performance optimization: Index on foreign key for faster joins';
COMMENT ON INDEX idx_earnings_results_calendar_id IS 'Performance optimization: Index on foreign key for faster joins';
COMMENT ON INDEX idx_kpi_definitions_created_by IS 'Performance optimization: Index on foreign key for faster joins';
COMMENT ON INDEX idx_pre_earnings_analysis_calendar_id IS 'Performance optimization: Index on foreign key for faster joins';
COMMENT ON INDEX idx_user_role_mapping_role_id IS 'Performance optimization: Index on foreign key for faster joins';

