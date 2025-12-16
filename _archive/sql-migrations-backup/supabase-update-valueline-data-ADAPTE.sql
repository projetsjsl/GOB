-- ============================================================================
-- MISE À JOUR DES MÉTRIQUES VALUELINE (ADAPTÉ POUR NOUVELLE STRUCTURE)
-- Généré automatiquement depuis valueline.xlsx
-- Date: 2025-12-03
-- ============================================================================
-- 
-- IMPORTANT: 
-- 1. Exécuter d'abord supabase-migrate-from-old-structure.sql pour migrer les colonnes
-- 2. Ce script utilise "price_growth_persistence" (nouveau nom)
-- 3. "price_growth" n'est plus utilisé (supprimé)
-- ============================================================================

-- Note: Le fichier complet contient ~1009 UPDATE statements
-- Format de chaque UPDATE:
-- UPDATE tickers 
-- SET 
--     security_rank = '...',
--     earnings_predictability = '...',
--     price_growth_persistence = '...',  -- ← Nouveau nom (anciennement "persistence")
--     price_stability = '...',
--     valueline_updated_at = '2025-12-03 00:00:00+00',
--     updated_at = NOW()
-- WHERE ticker = '...';

-- ============================================================================
-- EXEMPLE DE MISE À JOUR (premiers tickers)
-- ============================================================================

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '90',
    price_growth_persistence = '85',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'A';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '5',
    price_growth_persistence = '30',
    price_stability = '10',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AA';

-- ... (continuer avec tous les autres tickers)
-- Le fichier complet supabase-update-valueline-data.sql contient tous les UPDATE

-- ============================================================================
-- VÉRIFICATION APRÈS EXÉCUTION
-- ============================================================================
SELECT 
    ticker,
    security_rank,
    earnings_predictability,
    price_growth_persistence,  -- ← Nouveau nom
    price_stability,
    valueline_updated_at
FROM tickers
WHERE valueline_updated_at IS NOT NULL
ORDER BY ticker
LIMIT 20;

-- Statistiques
SELECT 
    COUNT(*) as total_tickers,
    COUNT(security_rank) as avec_security_rank,
    COUNT(earnings_predictability) as avec_earnings_predictability,
    COUNT(price_growth_persistence) as avec_price_growth_persistence,  -- ← Nouveau nom
    COUNT(price_stability) as avec_price_stability
FROM tickers
WHERE valueline_updated_at IS NOT NULL;

