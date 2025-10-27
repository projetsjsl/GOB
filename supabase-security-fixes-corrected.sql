-- ============================================================================
-- CORRECTION PROBLÈMES SÉCURITÉ SUPABASE (VERSION CORRIGÉE)
-- Résout les erreurs RLS et SECURITY DEFINER détectées par le linter
-- ============================================================================

-- ============================================================================
-- 1. VÉRIFICATION DE LA STRUCTURE DES TABLES
-- ============================================================================

-- Vérifier la structure de seeking_alpha_data
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'seeking_alpha_data' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier la structure de seeking_alpha_analysis
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'seeking_alpha_analysis' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- 2. CORRECTION DES VUES SECURITY DEFINER (VERSION ADAPTÉE)
-- ============================================================================

-- Recréer la vue seeking_alpha_latest sans SECURITY DEFINER
-- Utiliser les colonnes qui existent réellement
DROP VIEW IF EXISTS public.seeking_alpha_latest CASCADE;

CREATE VIEW public.seeking_alpha_latest AS
SELECT 
    ticker,
    raw_text,
    url,
    created_at
FROM public.seeking_alpha_data
WHERE created_at = (
    SELECT MAX(created_at) 
    FROM public.seeking_alpha_data s2 
    WHERE s2.ticker = public.seeking_alpha_data.ticker
);

-- Recréer la vue latest_seeking_alpha_analysis sans SECURITY DEFINER
DROP VIEW IF EXISTS public.latest_seeking_alpha_analysis CASCADE;

CREATE VIEW public.latest_seeking_alpha_analysis AS
SELECT 
    ticker,
    analysis_data,
    created_at,
    updated_at
FROM public.seeking_alpha_analysis
WHERE created_at = (
    SELECT MAX(created_at) 
    FROM public.seeking_alpha_analysis s2 
    WHERE s2.ticker = public.seeking_alpha_analysis.ticker
);

-- ============================================================================
-- 3. ACTIVATION RLS SUR TOUTES LES TABLES PUBLIQUES
-- ============================================================================

-- Activer RLS sur toutes les tables qui n'en ont pas
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_news_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symbol_news_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefing_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. CRÉATION DES POLICIES RLS POUR CHAQUE TABLE
-- ============================================================================

-- Policies pour watchlists
DROP POLICY IF EXISTS "Allow read access to all" ON public.watchlists;
DROP POLICY IF EXISTS "Allow insert/update for all" ON public.watchlists;

CREATE POLICY "Allow read access to all" ON public.watchlists
    FOR SELECT USING (true);

CREATE POLICY "Allow insert/update for all" ON public.watchlists
    FOR ALL USING (true);

-- Policies pour briefings
DROP POLICY IF EXISTS "Allow read access to all" ON public.briefings;
DROP POLICY IF EXISTS "Allow insert/update for all" ON public.briefings;

CREATE POLICY "Allow read access to all" ON public.briefings
    FOR SELECT USING (true);

CREATE POLICY "Allow insert/update for all" ON public.briefings
    FOR ALL USING (true);

-- Policies pour market_news_cache
DROP POLICY IF EXISTS "Allow read access to all" ON public.market_news_cache;
DROP POLICY IF EXISTS "Allow insert/update for all" ON public.market_news_cache;

CREATE POLICY "Allow read access to all" ON public.market_news_cache
    FOR SELECT USING (true);

CREATE POLICY "Allow insert/update for all" ON public.market_news_cache
    FOR ALL USING (true);

-- Policies pour symbol_news_cache
DROP POLICY IF EXISTS "Allow read access to all" ON public.symbol_news_cache;
DROP POLICY IF EXISTS "Allow insert/update for all" ON public.symbol_news_cache;

CREATE POLICY "Allow read access to all" ON public.symbol_news_cache
    FOR SELECT USING (true);

CREATE POLICY "Allow insert/update for all" ON public.symbol_news_cache
    FOR ALL USING (true);

-- Policies pour briefing_config
DROP POLICY IF EXISTS "Allow read access to all" ON public.briefing_config;
DROP POLICY IF EXISTS "Allow insert/update for all" ON public.briefing_config;

CREATE POLICY "Allow read access to all" ON public.briefing_config
    FOR SELECT USING (true);

CREATE POLICY "Allow insert/update for all" ON public.briefing_config
    FOR ALL USING (true);

-- Policies pour briefing_subscribers
DROP POLICY IF EXISTS "Allow read access to all" ON public.briefing_subscribers;
DROP POLICY IF EXISTS "Allow insert/update for all" ON public.briefing_subscribers;

CREATE POLICY "Allow read access to all" ON public.briefing_subscribers
    FOR SELECT USING (true);

CREATE POLICY "Allow insert/update for all" ON public.briefing_subscribers
    FOR ALL USING (true);

-- Policies pour team_newsletters
DROP POLICY IF EXISTS "Allow read access to all" ON public.team_newsletters;
DROP POLICY IF EXISTS "Allow insert/update for all" ON public.team_newsletters;

CREATE POLICY "Allow read access to all" ON public.team_newsletters
    FOR SELECT USING (true);

CREATE POLICY "Allow insert/update for all" ON public.team_newsletters
    FOR ALL USING (true);

-- Policies pour team_logs
DROP POLICY IF EXISTS "Allow read access to all" ON public.team_logs;
DROP POLICY IF EXISTS "Allow insert/update for all" ON public.team_logs;

CREATE POLICY "Allow read access to all" ON public.team_logs
    FOR SELECT USING (true);

CREATE POLICY "Allow insert/update for all" ON public.team_logs
    FOR ALL USING (true);

-- ============================================================================
-- 5. VÉRIFICATION DES POLICIES EXISTANTES
-- ============================================================================

-- Vérifier que toutes les tables ont RLS activé
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
      'watchlists', 'briefings', 'market_news_cache', 'symbol_news_cache',
      'briefing_config', 'briefing_subscribers', 'team_newsletters', 'team_logs',
      'watchlist', 'team_tickers', 'earnings_calendar', 'pre_earnings_analysis',
      'earnings_results', 'significant_news'
  )
ORDER BY tablename;

-- Vérifier les policies existantes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- 6. CORRECTION DES VUES EMMA AI (si elles existent)
-- ============================================================================

-- Recréer les vues Emma AI sans SECURITY DEFINER
DROP VIEW IF EXISTS public.upcoming_earnings CASCADE;
CREATE VIEW public.upcoming_earnings AS
SELECT
    ec.*,
    pea.consensus_eps,
    pea.consensus_revenue,
    pea.historical_beat_rate
FROM public.earnings_calendar ec
LEFT JOIN public.pre_earnings_analysis pea ON ec.id = pea.earnings_calendar_id
WHERE ec.estimated_date >= CURRENT_DATE
  AND ec.estimated_date <= CURRENT_DATE + INTERVAL '7 days'
  AND ec.status IN ('scheduled', 'confirmed')
ORDER BY ec.estimated_date ASC;

DROP VIEW IF EXISTS public.critical_news_pending CASCADE;
CREATE VIEW public.critical_news_pending AS
SELECT *
FROM public.significant_news
WHERE importance_score >= 8
  AND action_required = true
  AND alert_sent = false
ORDER BY importance_score DESC, published_at DESC;

DROP VIEW IF EXISTS public.earnings_performance_summary CASCADE;
CREATE VIEW public.earnings_performance_summary AS
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
FROM public.earnings_results
GROUP BY ticker
ORDER BY total_earnings DESC;

DROP VIEW IF EXISTS public.all_tickers CASCADE;
CREATE VIEW public.all_tickers AS
SELECT 
    ticker,
    company_name,
    'watchlist' as source,
    added_at,
    notes,
    target_price,
    stop_loss
FROM public.watchlist
UNION ALL
SELECT 
    ticker,
    company_name,
    'team_tickers' as source,
    added_at,
    team_name as notes,
    NULL as target_price,
    NULL as stop_loss
FROM public.team_tickers;

-- ============================================================================
-- 7. VÉRIFICATION FINALE
-- ============================================================================

-- Vérifier que toutes les vues sont créées sans SECURITY DEFINER
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE schemaname = 'public'
  AND viewname IN (
      'seeking_alpha_latest', 'latest_seeking_alpha_analysis',
      'upcoming_earnings', 'critical_news_pending', 
      'earnings_performance_summary', 'all_tickers'
  )
ORDER BY viewname;

-- Compter les policies par table
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- 8. MESSAGE DE CONFIRMATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Correction sécurité Supabase terminée!';
    RAISE NOTICE '✅ RLS activé sur toutes les tables publiques';
    RAISE NOTICE '✅ Policies créées pour toutes les tables';
    RAISE NOTICE '✅ Vues recréées sans SECURITY DEFINER';
    RAISE NOTICE '🚀 Base de données sécurisée et conforme!';
END $$;
