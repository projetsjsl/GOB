-- ============================================================================
-- AJOUT DES MÉTRIQUES VALUELINE À LA TABLE `tickers`
-- ============================================================================
-- Ce script ajoute 4 nouveaux champs pour les métriques ValueLine:
-- - earnings_predictability (Prévisibilité des bénéfices)
-- - price_growth (Croissance du prix)
-- - persistence (Persistance)
-- - price_stability (Stabilité du prix)
-- + Mise à jour de security_rank (Financial Strength / Cote de sécurité)
-- + Ajout de beta (volatilité relative)
-- ============================================================================

-- Ajouter les colonnes si elles n'existent pas
DO $$
BEGIN
    -- Financial Strength (Cote de sécurité) - peut déjà exister
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickers' AND column_name = 'security_rank') THEN
        ALTER TABLE tickers ADD COLUMN security_rank VARCHAR(10);
    END IF;
    
    -- Earnings Predictability
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickers' AND column_name = 'earnings_predictability') THEN
        ALTER TABLE tickers ADD COLUMN earnings_predictability VARCHAR(10);
    END IF;
    
    -- Price Growth
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickers' AND column_name = 'price_growth') THEN
        ALTER TABLE tickers ADD COLUMN price_growth VARCHAR(10);
    END IF;
    
    -- Persistence
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickers' AND column_name = 'persistence') THEN
        ALTER TABLE tickers ADD COLUMN persistence VARCHAR(10);
    END IF;
    
    -- Price Stability
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickers' AND column_name = 'price_stability') THEN
        ALTER TABLE tickers ADD COLUMN price_stability VARCHAR(10);
    END IF;
    
    -- Beta
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickers' AND column_name = 'beta') THEN
        ALTER TABLE tickers ADD COLUMN beta DECIMAL(5,2);
    END IF;
    
    -- Date de mise à jour ValueLine
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickers' AND column_name = 'valueline_updated_at') THEN
        ALTER TABLE tickers ADD COLUMN valueline_updated_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_tickers_security_rank ON tickers(security_rank);
CREATE INDEX IF NOT EXISTS idx_tickers_beta ON tickers(beta);

-- Commentaires sur les colonnes
COMMENT ON COLUMN tickers.security_rank IS 'Financial Strength (Cote de sécurité) - Source: ValueLine au 3 décembre 2025';
COMMENT ON COLUMN tickers.earnings_predictability IS 'Earnings Predictability - Source: ValueLine au 3 décembre 2025';
COMMENT ON COLUMN tickers.price_growth IS 'Price Growth - Source: ValueLine au 3 décembre 2025';
COMMENT ON COLUMN tickers.persistence IS 'Persistence - Source: ValueLine au 3 décembre 2025';
COMMENT ON COLUMN tickers.price_stability IS 'Price Stability - Source: ValueLine au 3 décembre 2025';
COMMENT ON COLUMN tickers.beta IS 'Beta (volatilité relative au marché) - Source: API FMP';
COMMENT ON COLUMN tickers.valueline_updated_at IS 'Date de dernière mise à jour des métriques ValueLine';

-- Afficher un résumé
SELECT 
    '✅ Colonnes ValueLine ajoutées' as status,
    COUNT(*) FILTER (WHERE security_rank IS NOT NULL) as tickers_with_security_rank,
    COUNT(*) FILTER (WHERE earnings_predictability IS NOT NULL) as tickers_with_earnings_predictability,
    COUNT(*) FILTER (WHERE price_growth IS NOT NULL) as tickers_with_price_growth,
    COUNT(*) FILTER (WHERE persistence IS NOT NULL) as tickers_with_persistence,
    COUNT(*) FILTER (WHERE price_stability IS NOT NULL) as tickers_with_price_stability,
    COUNT(*) FILTER (WHERE beta IS NOT NULL) as tickers_with_beta
FROM tickers;

