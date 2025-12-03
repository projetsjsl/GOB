-- ============================================================================
-- MIGRATION COMPLÈTE : Anciennes Versions → Nouvelle Structure
-- ============================================================================
-- Date: 2025-12-03
-- 
-- Ce script fait TOUT en une seule exécution:
-- 1. Vérifie l'état actuel
-- 2. Renomme persistence → price_growth_persistence
-- 3. Supprime price_growth (toujours NULL)
-- 4. Met à jour les index et commentaires
-- 5. Vérifie le résultat final
-- 
-- Situation actuelle (après exécution des anciennes versions):
-- - price_growth existe mais est toujours NULL (inutile)
-- - persistence existe et contient les données "Price Growth Persistence"
-- 
-- Objectif final:
-- - price_growth_persistence (renommé depuis persistence)
-- - price_growth supprimé
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: Vérification de l'état actuel
-- ============================================================================
DO $$
DECLARE
    has_price_growth BOOLEAN;
    has_persistence BOOLEAN;
    has_price_growth_persistence BOOLEAN;
    count_price_growth_data INTEGER;
    count_persistence_data INTEGER;
BEGIN
    -- Vérifier quelles colonnes existent
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickers' AND column_name = 'price_growth'
    ) INTO has_price_growth;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickers' AND column_name = 'persistence'
    ) INTO has_persistence;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickers' AND column_name = 'price_growth_persistence'
    ) INTO has_price_growth_persistence;
    
    -- Compter les données
    IF has_price_growth THEN
        SELECT COUNT(*) FROM tickers WHERE price_growth IS NOT NULL INTO count_price_growth_data;
    ELSE
        count_price_growth_data := 0;
    END IF;
    
    IF has_persistence THEN
        SELECT COUNT(*) FROM tickers WHERE persistence IS NOT NULL INTO count_persistence_data;
    ELSE
        count_persistence_data := 0;
    END IF;
    
    -- Afficher l'état
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '📊 ÉTAT ACTUEL AVANT MIGRATION:';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '   - price_growth existe: %', has_price_growth;
    RAISE NOTICE '   - persistence existe: %', has_persistence;
    RAISE NOTICE '   - price_growth_persistence existe: %', has_price_growth_persistence;
    RAISE NOTICE '   - Données dans price_growth: %', count_price_growth_data;
    RAISE NOTICE '   - Données dans persistence: %', count_persistence_data;
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

-- ============================================================================
-- ÉTAPE 2: Renommer persistence → price_growth_persistence
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔄 ÉTAPE 2: Renommage persistence → price_growth_persistence';
    RAISE NOTICE '─────────────────────────────────────────────────────────────';
    
    -- Vérifier si persistence existe et price_growth_persistence n'existe pas
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tickers' AND column_name = 'persistence')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'tickers' AND column_name = 'price_growth_persistence') THEN
        
        -- Renommer la colonne
        ALTER TABLE tickers RENAME COLUMN persistence TO price_growth_persistence;
        RAISE NOTICE '✅ Colonne "persistence" renommée en "price_growth_persistence"';
        RAISE NOTICE '   → Les données ont été préservées';
        
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'tickers' AND column_name = 'price_growth_persistence') THEN
        RAISE NOTICE 'ℹ️ La colonne "price_growth_persistence" existe déjà';
        RAISE NOTICE '   → Pas de renommage nécessaire';
        
    ELSE
        RAISE NOTICE '⚠️ La colonne "persistence" n''existe pas';
        RAISE NOTICE '   → Pas de renommage nécessaire';
    END IF;
END $$;

-- ============================================================================
-- ÉTAPE 3: Supprimer price_growth (toujours NULL)
-- ============================================================================
DO $$
DECLARE
    count_price_growth_data INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🗑️  ÉTAPE 3: Suppression de price_growth';
    RAISE NOTICE '─────────────────────────────────────────────────────────────';
    
    -- Vérifier si price_growth existe
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tickers' AND column_name = 'price_growth') THEN
        
        -- Vérifier qu'elle est bien vide (sécurité)
        SELECT COUNT(*) FROM tickers WHERE price_growth IS NOT NULL INTO count_price_growth_data;
        
        IF count_price_growth_data = 0 THEN
            -- Supprimer la colonne
            ALTER TABLE tickers DROP COLUMN price_growth;
            RAISE NOTICE '✅ Colonne "price_growth" supprimée (toujours NULL)';
        ELSE
            RAISE WARNING '⚠️ La colonne "price_growth" contient % données', count_price_growth_data;
            RAISE WARNING '⚠️ Suppression ignorée pour sécurité';
            RAISE WARNING '⚠️ Si vous êtes sûr, exécutez manuellement:';
            RAISE WARNING '   ALTER TABLE tickers DROP COLUMN price_growth;';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ La colonne "price_growth" n''existe pas';
        RAISE NOTICE '   → Pas de suppression nécessaire';
    END IF;
END $$;

-- ============================================================================
-- ÉTAPE 4: Mettre à jour les commentaires
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📝 ÉTAPE 4: Mise à jour des commentaires';
    RAISE NOTICE '─────────────────────────────────────────────────────────────';
    
    COMMENT ON COLUMN tickers.price_growth_persistence IS 'Price Growth Persistence (ValueLine) - Note numérique 5-100 mesurant la croissance persistante du prix sur 10 ans. Source: ValueLine au 3 décembre 2025';
    
    RAISE NOTICE '✅ Commentaire mis à jour pour price_growth_persistence';
END $$;

-- ============================================================================
-- ÉTAPE 5: Mettre à jour les index
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 ÉTAPE 5: Mise à jour des index';
    RAISE NOTICE '─────────────────────────────────────────────────────────────';
    
    -- Supprimer l'ancien index si existe
    DROP INDEX IF EXISTS idx_tickers_persistence;
    RAISE NOTICE '   → Ancien index "idx_tickers_persistence" supprimé (si existait)';
    
    -- Créer le nouvel index
    CREATE INDEX IF NOT EXISTS idx_tickers_price_growth_persistence ON tickers(price_growth_persistence) 
        WHERE price_growth_persistence IS NOT NULL;
    RAISE NOTICE '✅ Nouvel index "idx_tickers_price_growth_persistence" créé';
END $$;

-- ============================================================================
-- ÉTAPE 6: Vérification finale
-- ============================================================================
DO $$
DECLARE
    final_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ VÉRIFICATION FINALE';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    
    -- Compter les tickers avec price_growth_persistence
    SELECT COUNT(*) INTO final_count
    FROM tickers
    WHERE price_growth_persistence IS NOT NULL;
    
    RAISE NOTICE '   - Tickers avec price_growth_persistence: %', final_count;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tickers' AND column_name = 'price_growth_persistence') THEN
        RAISE NOTICE '   - ✅ price_growth_persistence existe';
    ELSE
        RAISE WARNING '   - ❌ price_growth_persistence manquant';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tickers' AND column_name = 'price_growth') THEN
        RAISE WARNING '   - ⚠️ price_growth existe encore (à supprimer manuellement si nécessaire)';
    ELSE
        RAISE NOTICE '   - ✅ price_growth supprimé';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tickers' AND column_name = 'persistence') THEN
        RAISE WARNING '   - ⚠️ persistence existe encore (devrait être renommé)';
    ELSE
        RAISE NOTICE '   - ✅ persistence renommé';
    END IF;
    
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ MIGRATION TERMINÉE !';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

-- ============================================================================
-- RÉSUMÉ DES COLONNES FINALES
-- ============================================================================
SELECT 
    '═══════════════════════════════════════════════════════════════' as separator,
    '📋 RÉSUMÉ DES COLONNES FINALES' as title,
    '═══════════════════════════════════════════════════════════════' as separator2;

SELECT 
    column_name as "Colonne",
    data_type as "Type",
    is_nullable as "Nullable",
    CASE 
        WHEN column_name = 'price_growth_persistence' THEN '✅ Nouveau nom (renommé depuis persistence)'
        WHEN column_name = 'price_growth' THEN '❌ Devrait être supprimé'
        WHEN column_name = 'persistence' THEN '❌ Devrait être renommé'
        ELSE '✅ OK'
    END as "Statut"
FROM information_schema.columns
WHERE table_name = 'tickers' 
  AND column_name IN (
      'security_rank', 
      'earnings_predictability', 
      'price_growth_persistence',
      'price_growth',  -- Pour vérifier si supprimé
      'persistence',   -- Pour vérifier si renommé
      'price_stability', 
      'beta', 
      'valueline_updated_at'
  )
ORDER BY 
    CASE column_name
        WHEN 'price_growth_persistence' THEN 1
        WHEN 'price_growth' THEN 2
        WHEN 'persistence' THEN 3
        ELSE 4
    END,
    column_name;

-- ============================================================================
-- STATISTIQUES FINALES
-- ============================================================================
SELECT 
    '═══════════════════════════════════════════════════════════════' as separator,
    '📊 STATISTIQUES FINALES' as title,
    '═══════════════════════════════════════════════════════════════' as separator2;

SELECT 
    COUNT(*) as "Total Tickers",
    COUNT(security_rank) as "Avec Security Rank",
    COUNT(earnings_predictability) as "Avec Earnings Predictability",
    COUNT(price_growth_persistence) as "Avec Price Growth Persistence",
    COUNT(price_stability) as "Avec Price Stability",
    COUNT(beta) as "Avec Beta"
FROM tickers
WHERE valueline_updated_at IS NOT NULL OR price_growth_persistence IS NOT NULL;

-- ============================================================================
-- EXEMPLE DE DONNÉES (10 premiers tickers)
-- ============================================================================
SELECT 
    '═══════════════════════════════════════════════════════════════' as separator,
    '📋 EXEMPLE DE DONNÉES (10 premiers)' as title,
    '═══════════════════════════════════════════════════════════════' as separator2;

SELECT 
    ticker as "Ticker",
    security_rank as "Security Rank",
    earnings_predictability as "Earnings Predictability",
    price_growth_persistence as "Price Growth Persistence",
    price_stability as "Price Stability",
    beta as "Beta"
FROM tickers
WHERE price_growth_persistence IS NOT NULL
ORDER BY ticker
LIMIT 10;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
SELECT 
    '═══════════════════════════════════════════════════════════════' as separator,
    '✅ MIGRATION COMPLÈTE - TOUT EST TERMINÉ !' as final_message,
    '═══════════════════════════════════════════════════════════════' as separator2;

