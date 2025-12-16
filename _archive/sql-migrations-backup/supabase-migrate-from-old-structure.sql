-- ============================================================================
-- MIGRATION : Adapter les colonnes existantes (anciennes versions)
-- ============================================================================
-- Date: 2025-12-03
-- 
-- Situation actuelle (après exécution des anciennes versions):
-- - price_growth existe mais est toujours NULL (inutile)
-- - persistence existe et contient les données "Price Growth Persistence"
-- 
-- Objectif:
-- 1. Renommer "persistence" → "price_growth_persistence" (plus explicite)
-- 2. Supprimer "price_growth" (toujours NULL, inutile)
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
    RAISE NOTICE '📊 État actuel:';
    RAISE NOTICE '   - price_growth existe: %', has_price_growth;
    RAISE NOTICE '   - persistence existe: %', has_persistence;
    RAISE NOTICE '   - price_growth_persistence existe: %', has_price_growth_persistence;
    RAISE NOTICE '   - Données dans price_growth: %', count_price_growth_data;
    RAISE NOTICE '   - Données dans persistence: %', count_persistence_data;
END $$;

-- ============================================================================
-- ÉTAPE 2: Renommer persistence → price_growth_persistence
-- ============================================================================
DO $$
BEGIN
    -- Vérifier si persistence existe et price_growth_persistence n'existe pas
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tickers' AND column_name = 'persistence')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'tickers' AND column_name = 'price_growth_persistence') THEN
        
        -- Renommer la colonne
        ALTER TABLE tickers RENAME COLUMN persistence TO price_growth_persistence;
        RAISE NOTICE '✅ Colonne "persistence" renommée en "price_growth_persistence"';
        
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'tickers' AND column_name = 'price_growth_persistence') THEN
        RAISE NOTICE 'ℹ️ La colonne "price_growth_persistence" existe déjà, pas de renommage nécessaire';
        
    ELSE
        RAISE NOTICE '⚠️ La colonne "persistence" n''existe pas, pas de renommage nécessaire';
    END IF;
END $$;

-- ============================================================================
-- ÉTAPE 3: Supprimer price_growth (toujours NULL)
-- ============================================================================
DO $$
DECLARE
    count_price_growth_data INTEGER;
BEGIN
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
            RAISE WARNING '⚠️ La colonne "price_growth" contient % données, suppression ignorée pour sécurité', count_price_growth_data;
            RAISE WARNING '⚠️ Si vous êtes sûr de vouloir supprimer, exécutez manuellement: ALTER TABLE tickers DROP COLUMN price_growth;';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ La colonne "price_growth" n''existe pas, pas de suppression nécessaire';
    END IF;
END $$;

-- ============================================================================
-- ÉTAPE 4: Mettre à jour les commentaires
-- ============================================================================
COMMENT ON COLUMN tickers.price_growth_persistence IS 'Price Growth Persistence (ValueLine) - Note numérique 5-100 mesurant la croissance persistante du prix sur 10 ans. Source: ValueLine au 3 décembre 2025';

-- ============================================================================
-- ÉTAPE 5: Mettre à jour les index
-- ============================================================================
-- Supprimer l'ancien index si existe
DROP INDEX IF EXISTS idx_tickers_persistence;

-- Créer le nouvel index
CREATE INDEX IF NOT EXISTS idx_tickers_price_growth_persistence ON tickers(price_growth_persistence) 
    WHERE price_growth_persistence IS NOT NULL;

-- ============================================================================
-- ÉTAPE 6: Vérification finale
-- ============================================================================
SELECT 
    '✅ Migration terminée' as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'tickers' AND column_name = 'price_growth_persistence') 
        THEN '✅ price_growth_persistence existe'
        ELSE '❌ price_growth_persistence manquant'
    END as price_growth_persistence_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'tickers' AND column_name = 'price_growth') 
        THEN '⚠️ price_growth existe encore (à supprimer manuellement si nécessaire)'
        ELSE '✅ price_growth supprimé'
    END as price_growth_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'tickers' AND column_name = 'persistence') 
        THEN '⚠️ persistence existe encore (devrait être renommé)'
        ELSE '✅ persistence renommé'
    END as persistence_status,
    COUNT(*) FILTER (WHERE price_growth_persistence IS NOT NULL) as tickers_with_price_growth_persistence
FROM tickers;

-- ============================================================================
-- RÉSUMÉ DES COLONNES FINALES
-- ============================================================================
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'tickers' 
  AND column_name IN ('security_rank', 'earnings_predictability', 'price_growth_persistence', 'price_stability', 'beta', 'valueline_updated_at')
ORDER BY column_name;

