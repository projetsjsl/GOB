-- ============================================================================
-- MISE À JOUR DES MÉTRIQUES VALUELINE (CORRIGÉ)
-- Généré automatiquement depuis valueline.xlsx
-- Date: 2025-12-03
-- ============================================================================
-- 
-- Ce script met à jour les métriques ValueLine pour tous les tickers
-- Source: ValueLine au 3 décembre 2025
-- 
-- IMPORTANT: 
-- 1. Exécuter d'abord supabase-add-valueline-metrics.sql si les colonnes n'existent pas
-- 2. "Price Growth Persistence" est UNE SEULE métrique → va dans "persistence"
-- 3. "price_growth" reste NULL (normal, pas de colonne séparée dans Excel)
-- ============================================================================

-- Note: Le fichier complet contient ~1009 UPDATE statements
-- Pour voir le contenu complet, utilisez: supabase-update-valueline-data.sql
-- 
-- Format de chaque UPDATE:
-- UPDATE tickers 
-- SET 
--     security_rank = '...',
--     earnings_predictability = '...',
--     persistence = '...',  -- ← Depuis "Price Growth Persistence"
--     price_stability = '...',
--     valueline_updated_at = '2025-12-03 00:00:00+00',
--     updated_at = NOW()
-- WHERE ticker = '...';

-- ============================================================================
-- VÉRIFICATION APRÈS EXÉCUTION
-- ============================================================================
SELECT 
    ticker,
    security_rank,
    earnings_predictability,
    persistence,  -- ← Contient "Price Growth Persistence"
    price_stability,
    price_growth,  -- ← Sera NULL (normal, pas de données)
    valueline_updated_at
FROM tickers
WHERE valueline_updated_at IS NOT NULL
ORDER BY ticker
LIMIT 20;  -- Afficher les 20 premiers pour vérification

-- Statistiques
SELECT 
    COUNT(*) as total_tickers,
    COUNT(security_rank) as avec_security_rank,
    COUNT(earnings_predictability) as avec_earnings_predictability,
    COUNT(persistence) as avec_persistence,
    COUNT(price_stability) as avec_price_stability,
    COUNT(price_growth) as avec_price_growth  -- Devrait être 0 (normal)
FROM tickers
WHERE valueline_updated_at IS NOT NULL;

