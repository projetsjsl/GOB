-- ============================================================================
-- AJOUT DU CORRIDOR VALUELINE À LA TABLE `tickers`
-- ============================================================================
-- Ce script ajoute les champs nécessaires pour Phase 3 (Validation Corridor)
-- - valueline_proj_low_return (Proj Low TTL Return)
-- - valueline_proj_high_return (Proj High TTL Return)
-- - valueline_proj_low_price_gain (Proj Price Low Gain) - Optionnel
-- - valueline_proj_high_price_gain (Proj Price High Gain) - Optionnel
-- ============================================================================

-- Ajouter les colonnes si elles n'existent pas
DO $$
BEGIN
    -- Proj Low Total Return (Critique pour Phase 3)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickers' AND column_name = 'valueline_proj_low_return') THEN
        ALTER TABLE tickers ADD COLUMN valueline_proj_low_return DECIMAL(5,2);
    END IF;
    
    -- Proj High Total Return (Critique pour Phase 3)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickers' AND column_name = 'valueline_proj_high_return') THEN
        ALTER TABLE tickers ADD COLUMN valueline_proj_high_return DECIMAL(5,2);
    END IF;
    
    -- Proj Low Price Gain (Optionnel)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickers' AND column_name = 'valueline_proj_low_price_gain') THEN
        ALTER TABLE tickers ADD COLUMN valueline_proj_low_price_gain DECIMAL(5,2);
    END IF;
    
    -- Proj High Price Gain (Optionnel)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickers' AND column_name = 'valueline_proj_high_price_gain') THEN
        ALTER TABLE tickers ADD COLUMN valueline_proj_high_price_gain DECIMAL(5,2);
    END IF;
END $$;

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_tickers_valueline_corridor ON tickers(valueline_proj_low_return, valueline_proj_high_return) 
    WHERE valueline_proj_low_return IS NOT NULL AND valueline_proj_high_return IS NOT NULL;

-- Commentaires sur les colonnes
COMMENT ON COLUMN tickers.valueline_proj_low_return IS 'Proj Low TTL Return (ValueLine) - Corridor bas pour Phase 3 validation';
COMMENT ON COLUMN tickers.valueline_proj_high_return IS 'Proj High TTL Return (ValueLine) - Corridor haut pour Phase 3 validation';
COMMENT ON COLUMN tickers.valueline_proj_low_price_gain IS 'Proj Price Low Gain (ValueLine) - Gain prix bas (optionnel)';
COMMENT ON COLUMN tickers.valueline_proj_high_price_gain IS 'Proj Price High Gain (ValueLine) - Gain prix haut (optionnel)';

-- Afficher un résumé
SELECT 
    '✅ Colonnes corridor ValueLine ajoutées' as status,
    COUNT(*) FILTER (WHERE valueline_proj_low_return IS NOT NULL) as tickers_with_low_return,
    COUNT(*) FILTER (WHERE valueline_proj_high_return IS NOT NULL) as tickers_with_high_return,
    COUNT(*) FILTER (WHERE valueline_proj_low_return IS NOT NULL AND valueline_proj_high_return IS NOT NULL) as tickers_with_full_corridor
FROM tickers;

