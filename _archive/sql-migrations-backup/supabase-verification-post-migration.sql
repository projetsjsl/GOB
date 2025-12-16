-- ============================================================================
-- VÉRIFICATION POST-MIGRATION
-- ============================================================================
-- Exécutez ce script pour vérifier que la migration s'est bien passée
-- ============================================================================

-- 1. Vérifier que price_growth_persistence existe
SELECT 
    '✅ Vérification 1: Colonne price_growth_persistence' as verification,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'tickers' AND column_name = 'price_growth_persistence') 
        THEN '✅ EXISTE'
        ELSE '❌ MANQUANT'
    END as resultat;

-- 2. Vérifier que price_growth a été supprimé
SELECT 
    '✅ Vérification 2: Colonne price_growth supprimée' as verification,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'tickers' AND column_name = 'price_growth') 
        THEN '⚠️ EXISTE ENCORE (à supprimer manuellement)'
        ELSE '✅ SUPPRIMÉE'
    END as resultat;

-- 3. Vérifier que persistence a été renommé
SELECT 
    '✅ Vérification 3: Colonne persistence renommée' as verification,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'tickers' AND column_name = 'persistence') 
        THEN '⚠️ EXISTE ENCORE (devrait être renommé)'
        ELSE '✅ RENOMMÉE'
    END as resultat;

-- 4. Compter les données dans price_growth_persistence
SELECT 
    '✅ Vérification 4: Données dans price_growth_persistence' as verification,
    COUNT(*) as total_tickers,
    COUNT(price_growth_persistence) as avec_donnees,
    CASE 
        WHEN COUNT(price_growth_persistence) > 0 THEN '✅ DONNÉES PRÉSENTES'
        ELSE '⚠️ AUCUNE DONNÉE'
    END as resultat
FROM tickers;

-- 5. Afficher un échantillon de données
SELECT 
    '✅ Vérification 5: Échantillon de données' as verification,
    ticker,
    security_rank,
    earnings_predictability,
    price_growth_persistence,
    price_stability,
    beta
FROM tickers
WHERE price_growth_persistence IS NOT NULL
ORDER BY ticker
LIMIT 10;

-- 6. Statistiques complètes
SELECT 
    '✅ Vérification 6: Statistiques complètes' as verification,
    COUNT(*) as total_tickers,
    COUNT(security_rank) as avec_security_rank,
    COUNT(earnings_predictability) as avec_earnings_predictability,
    COUNT(price_growth_persistence) as avec_price_growth_persistence,
    COUNT(price_stability) as avec_price_stability,
    COUNT(beta) as avec_beta
FROM tickers;

