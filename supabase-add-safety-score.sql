-- ============================================================================
-- AJOUT DU CHAMP SAFETY_SCORE À LA TABLE `tickers`
-- ============================================================================
-- Ce script ajoute le champ safety_score (Safety™ Score ValueLine)
-- Source: valueline.xlsx - Colonne "Safety™"
-- ============================================================================

-- Ajouter la colonne si elle n'existe pas
DO $$
BEGIN
    -- Safety™ Score (1-5)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickers' AND column_name = 'safety_score') THEN
        ALTER TABLE tickers ADD COLUMN safety_score VARCHAR(10);
    END IF;
END $$;

-- Index pour les recherches (optionnel)
CREATE INDEX IF NOT EXISTS idx_tickers_safety_score ON tickers(safety_score) 
    WHERE safety_score IS NOT NULL;

-- Commentaire sur la colonne
COMMENT ON COLUMN tickers.safety_score IS 'Safety™ Score ValueLine (1-5) - Score de sécurité ValueLine';

-- Afficher un résumé
SELECT 
    '✅ Colonne safety_score ajoutée' as status,
    COUNT(*) FILTER (WHERE safety_score IS NOT NULL) as tickers_with_safety_score
FROM tickers;

