-- ============================================================================
-- MIGRATION : Renommer persistence → price_growth_persistence
--            Supprimer price_growth (toujours NULL, inutile)
-- ============================================================================
-- Date: 2025-12-03
-- 
-- Raison:
-- - "Price Growth Persistence" est UNE SEULE métrique ValueLine (note numérique 5-100)
-- - Le champ "price_growth" est toujours NULL (pas de colonne séparée dans Excel)
-- - Le champ "persistence" contient "Price Growth Persistence" mais le nom n'est pas clair
-- 
-- Actions:
-- 1. Renommer "persistence" → "price_growth_persistence" (plus explicite)
-- 2. Supprimer "price_growth" (toujours NULL, inutile)
-- ============================================================================

-- Étape 1: Renommer persistence → price_growth_persistence
DO $$
BEGIN
    -- Vérifier si la colonne persistence existe
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tickers' AND column_name = 'persistence') THEN
        
        -- Vérifier si price_growth_persistence n'existe pas déjà
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'tickers' AND column_name = 'price_growth_persistence') THEN
            -- Renommer la colonne
            ALTER TABLE tickers RENAME COLUMN persistence TO price_growth_persistence;
            RAISE NOTICE '✅ Colonne "persistence" renommée en "price_growth_persistence"';
        ELSE
            RAISE NOTICE '⚠️ La colonne "price_growth_persistence" existe déjà, migration ignorée';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ La colonne "persistence" n''existe pas, migration ignorée';
    END IF;
END $$;

-- Étape 2: Supprimer price_growth (toujours NULL, inutile)
DO $$
BEGIN
    -- Vérifier si la colonne price_growth existe
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tickers' AND column_name = 'price_growth') THEN
        
        -- Vérifier qu'elle est bien vide (sécurité)
        IF (SELECT COUNT(*) FROM tickers WHERE price_growth IS NOT NULL) = 0 THEN
            -- Supprimer la colonne
            ALTER TABLE tickers DROP COLUMN price_growth;
            RAISE NOTICE '✅ Colonne "price_growth" supprimée (toujours NULL)';
        ELSE
            RAISE WARNING '⚠️ La colonne "price_growth" contient des données, suppression ignorée pour sécurité';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ La colonne "price_growth" n''existe pas, migration ignorée';
    END IF;
END $$;

-- Étape 3: Mettre à jour les commentaires
COMMENT ON COLUMN tickers.price_growth_persistence IS 'Price Growth Persistence (ValueLine) - Note numérique 5-100 mesurant la croissance persistante du prix sur 10 ans. Source: ValueLine au 3 décembre 2025';

-- Étape 4: Mettre à jour l'index si nécessaire
DROP INDEX IF EXISTS idx_tickers_persistence;
CREATE INDEX IF NOT EXISTS idx_tickers_price_growth_persistence ON tickers(price_growth_persistence) 
    WHERE price_growth_persistence IS NOT NULL;

-- Étape 5: Vérification
SELECT 
    '✅ Migration terminée' as status,
    COUNT(*) FILTER (WHERE price_growth_persistence IS NOT NULL) as tickers_with_price_growth_persistence,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'tickers' AND column_name = 'price_growth') 
        THEN '⚠️ price_growth existe encore'
        ELSE '✅ price_growth supprimé'
    END as price_growth_status
FROM tickers
WHERE price_growth_persistence IS NOT NULL
LIMIT 1;

