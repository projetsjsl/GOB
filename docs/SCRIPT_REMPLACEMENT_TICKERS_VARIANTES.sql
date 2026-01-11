-- Script de remplacement des tickers en échec FMP par leurs variantes fonctionnelles
-- Généré le 2026-01-11
-- 
-- Ce script remplace les tickers qui ne répondent pas via FMP par leurs variantes fonctionnelles
-- ou leurs ADR disponibles

-- ============================================================================
-- REMPLACEMENTS RECOMMANDÉS
-- ============================================================================

-- 1. ATD.B → ATD.TO (Alimentation Couche-Tard)
--    Alternative: ANCTF (ADR OTC)
UPDATE tickers 
SET ticker = 'ATD.TO',
    exchange = 'TSX',
    updated_at = NOW()
WHERE ticker = 'ATD.B' AND is_active = true;

-- 2. BBD.B → BBD-B.TO (Bombardier - même classe B)
--    ⚠️ Note: BBD seul = Banco Bradesco (Brésil), utiliser BBD-B.TO pour Bombardier
--    Alternative: BOMBF (ADR OTC)
UPDATE tickers 
SET ticker = 'BBD-B.TO',
    exchange = 'TSX',
    company_name = 'Bombardier Inc. (Class B)',
    updated_at = NOW()
WHERE ticker = 'BBD.B' AND is_active = true;

-- 3. BRK.B → BRK-B (Berkshire Hathaway Class B)
--    ⚠️ ATTENTION: BRK.B était un ETF, BRK-B est Berkshire Hathaway
--    Vérifier manuellement avant d'appliquer
-- UPDATE tickers 
-- SET ticker = 'BRK-B',
--     exchange = 'NYSE',
--     company_name = 'Berkshire Hathaway Inc. (Class B)',
--     updated_at = NOW()
-- WHERE ticker = 'BRK.B' AND is_active = true;

-- 4. BFB → BF-B (Brown Forman Class B)
UPDATE tickers 
SET ticker = 'BF-B',
    exchange = 'NYSE',
    company_name = 'Brown-Forman Corporation (Class B)',
    updated_at = NOW()
WHERE ticker = 'BFB' AND is_active = true;

-- 5. MOGA → MOG-A (Moog Class A)
UPDATE tickers 
SET ticker = 'MOG-A',
    exchange = 'NYSE',
    company_name = 'Moog Inc. (Class A)',
    updated_at = NOW()
WHERE ticker = 'MOGA' AND is_active = true;

-- 6. CCLB.TO → CCLLF (ADR OTC pour CCL Industries)
UPDATE tickers 
SET ticker = 'CCLLF',
    exchange = 'OTC',
    country = 'CA',
    updated_at = NOW()
WHERE ticker = 'CCLB.TO' AND is_active = true;

-- 7. CTCA.TO → CTC.TO (Canadian Tire - ticker principal)
UPDATE tickers 
SET ticker = 'CTC.TO',
    exchange = 'TSX',
    updated_at = NOW()
WHERE ticker = 'CTCA.TO' AND is_active = true;

-- 8. EMPA.TO → ❌ SUPPRIMER (aucune alternative trouvée)
--    Note: EMP trouvé = Entergy Mississippi (obligation), pas Empire Company
UPDATE tickers 
SET is_active = false,
    updated_at = NOW()
WHERE ticker = 'EMPA.TO' AND is_active = true;

-- 9. GIBA.TO → GIB (ADR NYSE pour CGI Inc.)
UPDATE tickers 
SET ticker = 'GIB',
    exchange = 'NYSE',
    country = 'CA',
    updated_at = NOW()
WHERE ticker = 'GIBA.TO' AND is_active = true;

-- 10. RCIB.TO → RCI (ADR NYSE pour Rogers Communications)
UPDATE tickers 
SET ticker = 'RCI',
    exchange = 'NYSE',
    country = 'CA',
    updated_at = NOW()
WHERE ticker = 'RCIB.TO' AND is_active = true;

-- 11. CCA → CCA.TO (Cogeco Communications)
--     Alternative: CGEAF (ADR OTC)
UPDATE tickers 
SET ticker = 'CCA.TO',
    exchange = 'TSX',
    updated_at = NOW()
WHERE ticker = 'CCA' AND is_active = true AND country = 'CA';

-- 12. GWO → GWO.TO (Great-West Lifeco)
--     Alternative: GWLIF (ADR OTC)
UPDATE tickers 
SET ticker = 'GWO.TO',
    exchange = 'TSX',
    updated_at = NOW()
WHERE ticker = 'GWO' AND is_active = true AND country = 'CA';

-- 13. IFC → IFC.TO (Intact Financial)
--     Alternative: INTAF (ADR OTC)
UPDATE tickers 
SET ticker = 'IFC.TO',
    exchange = 'TSX',
    updated_at = NOW()
WHERE ticker = 'IFC' AND is_active = true AND country = 'CA';

-- 14. MRU → MRU.TO (Metro Inc.)
--     Alternative: MTRI (ADR OTC)
UPDATE tickers 
SET ticker = 'MRU.TO',
    exchange = 'TSX',
    updated_at = NOW()
WHERE ticker = 'MRU' AND is_active = true AND country = 'CA';

-- ============================================================================
-- VÉRIFICATION POST-REMPLACEMENT
-- ============================================================================

-- Vérifier que les nouveaux tickers n'existent pas déjà (éviter doublons)
SELECT 
    'Vérification doublons' as check_type,
    ticker,
    COUNT(*) as count
FROM tickers
WHERE ticker IN ('ATD.TO', 'BBD-B.TO', 'BF-B', 'MOG-A', 'CCLLF', 'CTC.TO', 'GIB', 'RCI', 'CCA.TO', 'GWO.TO', 'IFC.TO', 'MRU.TO')
  AND is_active = true
GROUP BY ticker
HAVING COUNT(*) > 1;

-- Afficher les tickers remplacés
SELECT 
    'Tickers remplacés' as status,
    ticker,
    company_name,
    exchange,
    country,
    is_active
FROM tickers
WHERE ticker IN ('ATD.TO', 'BBD-B.TO', 'BF-B', 'MOG-A', 'CCLLF', 'CTC.TO', 'GIB', 'RCI', 'CCA.TO', 'GWO.TO', 'IFC.TO', 'MRU.TO')
  AND is_active = true
ORDER BY ticker;
