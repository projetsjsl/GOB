-- ============================================================================
-- MIGRATION DES DONNÉES WATCHLISTS VERS WATCHLIST
-- À exécuter dans Supabase SQL Editor
-- ============================================================================

-- 1. VÉRIFIER LES DONNÉES EXISTANTES
-- ============================================================================

-- Vérifier si la table watchlists existe et contient des données
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'watchlists') 
        THEN 'Table watchlists existe'
        ELSE 'Table watchlists n''existe pas'
    END as watchlists_status;

-- Si watchlists existe, compter les enregistrements
SELECT COUNT(*) as watchlists_count FROM watchlists;

-- Vérifier la structure de watchlists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'watchlists' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier la structure de watchlist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'watchlist' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- 2. MIGRATION DES DONNÉES (si watchlists existe)
-- ============================================================================

-- Migrer les données de watchlists vers watchlist
-- Cette requête fonctionne seulement si watchlists existe
DO $$
BEGIN
    -- Vérifier si watchlists existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'watchlists') THEN
        
        -- Insérer les données migrées
        INSERT INTO watchlist (ticker, company_name, added_at, notes)
        SELECT 
            jsonb_array_elements_text(tickers) as ticker,
            NULL as company_name,
            created_at as added_at,
            'Migré depuis watchlists - user: ' || user_id as notes
        FROM watchlists
        WHERE tickers IS NOT NULL 
          AND jsonb_array_length(tickers) > 0
        ON CONFLICT (ticker) DO UPDATE SET
            notes = EXCLUDED.notes,
            updated_at = NOW();
            
        RAISE NOTICE 'Migration terminée avec succès';
        
    ELSE
        RAISE NOTICE 'Table watchlists n''existe pas - aucune migration nécessaire';
    END IF;
END $$;

-- ============================================================================
-- 3. VÉRIFICATION POST-MIGRATION
-- ============================================================================

-- Compter les enregistrements dans chaque table
SELECT 
    'watchlist' as table_name,
    COUNT(*) as row_count
FROM watchlist
UNION ALL
SELECT 
    'watchlists' as table_name,
    COUNT(*) as row_count
FROM watchlists;

-- Afficher quelques exemples de données migrées
SELECT 
    ticker,
    company_name,
    added_at,
    notes
FROM watchlist
WHERE notes LIKE '%Migré depuis watchlists%'
ORDER BY added_at DESC
LIMIT 10;

-- ============================================================================
-- 4. NETTOYAGE (OPTIONNEL)
-- ============================================================================

-- ATTENTION: Ne décommentez que si vous êtes sûr de vouloir supprimer watchlists
-- DROP TABLE IF EXISTS watchlists CASCADE;

-- ============================================================================
-- 5. VÉRIFICATION FINALE
-- ============================================================================

-- Vérifier que toutes les tables Emma AI existent
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
      'watchlist', 
      'team_tickers', 
      'earnings_calendar', 
      'pre_earnings_analysis', 
      'earnings_results', 
      'significant_news'
  )
ORDER BY table_name;

-- Compter les enregistrements dans toutes les tables principales
SELECT
    'watchlist' as table_name,
    COUNT(*) as row_count
FROM watchlist
UNION ALL
SELECT 'team_tickers', COUNT(*) FROM team_tickers
UNION ALL
SELECT 'earnings_calendar', COUNT(*) FROM earnings_calendar
UNION ALL
SELECT 'pre_earnings_analysis', COUNT(*) FROM pre_earnings_analysis
UNION ALL
SELECT 'earnings_results', COUNT(*) FROM earnings_results
UNION ALL
SELECT 'significant_news', COUNT(*) FROM significant_news;

-- ============================================================================
-- 6. TEST DE LA VUE COMBINÉE
-- ============================================================================

-- Tester la vue all_tickers (si elle existe)
SELECT * FROM all_tickers 
ORDER BY source, ticker 
LIMIT 20;
