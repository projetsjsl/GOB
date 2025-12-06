-- ============================================================================
-- FUSION COMPLÈTE DES TABLES DE TICKERS
-- ============================================================================
-- Ce script fusionne toutes les tables de tickers en une seule table `tickers`
-- avec une colonne `category` pour catégoriser les tickers
-- ============================================================================

-- ============================================================================
-- 1. AJOUTER LA COLONNE `category` À LA TABLE `tickers`
-- ============================================================================

DO $$
BEGIN
    -- Ajouter colonne category si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'tickers' 
                   AND column_name = 'category') THEN
        ALTER TABLE tickers ADD COLUMN category TEXT DEFAULT 'manual';
        
        -- Migrer les valeurs de `source` vers `category`
        UPDATE tickers 
        SET category = CASE 
            WHEN source = 'team' THEN 'team'
            WHEN source = 'watchlist' THEN 'watchlist'
            WHEN source = 'both' THEN 'both'
            ELSE 'manual'
        END;
        
        -- Créer index sur category
        CREATE INDEX IF NOT EXISTS idx_tickers_category ON tickers(category);
        CREATE INDEX IF NOT EXISTS idx_tickers_category_active ON tickers(category, is_active) WHERE is_active = true;
    END IF;
    
    -- Ajouter colonne categories (TEXT[]) pour supporter plusieurs catégories
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'tickers' 
                   AND column_name = 'categories') THEN
        ALTER TABLE tickers ADD COLUMN categories TEXT[] DEFAULT ARRAY[]::TEXT[];
        
        -- Initialiser categories depuis category
        UPDATE tickers 
        SET categories = ARRAY[category]::TEXT[]
        WHERE categories IS NULL OR array_length(categories, 1) IS NULL;
    END IF;
    
    -- Ajouter colonne team_name si elle n'existe pas (depuis team_tickers)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'tickers' 
                   AND column_name = 'team_name') THEN
        ALTER TABLE tickers ADD COLUMN team_name TEXT;
    END IF;
    
    -- Ajouter colonne watchlist_id si elle n'existe pas (pour lier aux watchlists)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'tickers' 
                   AND column_name = 'watchlist_id') THEN
        ALTER TABLE tickers ADD COLUMN watchlist_id BIGINT;
    END IF;
END $$;

-- ============================================================================
-- 2. MIGRER LES DONNÉES DE `team_tickers` → `tickers`
-- ============================================================================

INSERT INTO tickers (
    ticker,
    company_name,
    category,
    categories,
    priority,
    team_name,
    is_active,
    added_date,
    created_at,
    updated_at
)
SELECT DISTINCT ON (t.ticker)
    UPPER(TRIM(t.ticker)) as ticker,
    COALESCE(t.company_name, NULL) as company_name,
    'team' as category,
    ARRAY['team']::TEXT[] as categories,
    COALESCE(t.priority, 1) as priority,
    t.team_name,
    COALESCE(t.active, true) as is_active,
    COALESCE(t.added_at, NOW()) as added_date,
    COALESCE(t.added_at, NOW()) as created_at,
    COALESCE(t.updated_at, NOW()) as updated_at
FROM team_tickers t
WHERE t.active = true
ON CONFLICT (ticker) DO UPDATE SET
    -- Si le ticker existe déjà, ajouter 'team' à categories
    category = CASE 
        WHEN tickers.category = 'watchlist' THEN 'both'
        WHEN tickers.category = 'both' THEN 'both'
        ELSE 'team'
    END,
    categories = CASE 
        WHEN 'team' = ANY(tickers.categories) THEN tickers.categories
        ELSE tickers.categories || ARRAY['team']::TEXT[]
    END,
    priority = GREATEST(tickers.priority, EXCLUDED.priority),
    team_name = COALESCE(EXCLUDED.team_name, tickers.team_name),
    company_name = COALESCE(EXCLUDED.company_name, tickers.company_name),
    updated_at = NOW();

-- ============================================================================
-- 3. MIGRER LES DONNÉES DE `watchlist` → `tickers`
-- ============================================================================

INSERT INTO tickers (
    ticker,
    company_name,
    category,
    categories,
    target_price,
    stop_loss,
    notes,
    added_date,
    created_at,
    updated_at
)
SELECT DISTINCT ON (w.ticker)
    UPPER(TRIM(w.ticker)) as ticker,
    w.company_name,
    'watchlist' as category,
    ARRAY['watchlist']::TEXT[] as categories,
    w.target_price,
    w.stop_loss,
    w.notes,
    COALESCE(w.added_at, NOW()) as added_date,
    COALESCE(w.created_at, NOW()) as created_at,
    COALESCE(w.updated_at, NOW()) as updated_at
FROM watchlist w
ON CONFLICT (ticker) DO UPDATE SET
    -- Si le ticker existe déjà, ajouter 'watchlist' à categories
    category = CASE 
        WHEN tickers.category = 'team' THEN 'both'
        WHEN tickers.category = 'both' THEN 'both'
        ELSE 'watchlist'
    END,
    categories = CASE 
        WHEN 'watchlist' = ANY(tickers.categories) THEN tickers.categories
        ELSE tickers.categories || ARRAY['watchlist']::TEXT[]
    END,
    target_price = COALESCE(EXCLUDED.target_price, tickers.target_price),
    stop_loss = COALESCE(EXCLUDED.stop_loss, tickers.stop_loss),
    notes = COALESCE(EXCLUDED.notes, tickers.notes),
    company_name = COALESCE(EXCLUDED.company_name, tickers.company_name),
    updated_at = NOW();

-- ============================================================================
-- 4. MIGRER LES DONNÉES DE `watchlists.tickers` (ARRAY) → `tickers`
-- ============================================================================

INSERT INTO tickers (
    ticker,
    category,
    categories,
    user_id,
    watchlist_id,
    added_date,
    created_at,
    updated_at
)
SELECT DISTINCT ON (UPPER(TRIM(unnested_ticker)))
    UPPER(TRIM(unnested_ticker)) as ticker,
    'watchlist' as category,
    ARRAY['watchlist']::TEXT[] as categories,
    w.user_id,
    w.id as watchlist_id,
    COALESCE(w.created_at, NOW()) as added_date,
    COALESCE(w.created_at, NOW()) as created_at,
    COALESCE(w.updated_at, NOW()) as updated_at
FROM watchlists w
CROSS JOIN LATERAL unnest(w.tickers) AS unnested_ticker
WHERE array_length(w.tickers, 1) > 0
ON CONFLICT (ticker) DO UPDATE SET
    -- Si le ticker existe déjà, ajouter 'watchlist' à categories
    category = CASE 
        WHEN tickers.category = 'team' THEN 'both'
        WHEN tickers.category = 'both' THEN 'both'
        ELSE 'watchlist'
    END,
    categories = CASE 
        WHEN 'watchlist' = ANY(tickers.categories) THEN tickers.categories
        ELSE tickers.categories || ARRAY['watchlist']::TEXT[]
    END,
    user_id = COALESCE(EXCLUDED.user_id, tickers.user_id),
    watchlist_id = COALESCE(EXCLUDED.watchlist_id, tickers.watchlist_id),
    updated_at = NOW();

-- ============================================================================
-- 5. MIGRER LES DONNÉES DE `instruments` → `tickers`
-- ============================================================================

INSERT INTO tickers (
    ticker,
    company_name,
    category,
    categories,
    sector,
    industry,
    country,
    exchange,
    currency,
    market_cap,
    is_active,
    created_at,
    updated_at
)
SELECT DISTINCT ON (i.symbol)
    UPPER(TRIM(i.symbol)) as ticker,
    i.name as company_name,
    'instrument' as category,
    ARRAY['instrument']::TEXT[] as categories,
    i.sector,
    i.industry,
    i.country,
    i.exchange,
    COALESCE(i.currency, 'USD') as currency,
    i.market_cap,
    COALESCE(i.is_active, true) as is_active,
    COALESCE(i.created_at, NOW()) as created_at,
    COALESCE(i.updated_at, NOW()) as updated_at
FROM instruments i
WHERE i.is_active = true
ON CONFLICT (ticker) DO UPDATE SET
    -- Si le ticker existe déjà, ajouter 'instrument' à categories
    category = CASE 
        WHEN tickers.category IN ('team', 'watchlist', 'both') THEN tickers.category
        ELSE 'instrument'
    END,
    categories = CASE 
        WHEN 'instrument' = ANY(tickers.categories) THEN tickers.categories
        ELSE tickers.categories || ARRAY['instrument']::TEXT[]
    END,
    sector = COALESCE(EXCLUDED.sector, tickers.sector),
    industry = COALESCE(EXCLUDED.industry, tickers.industry),
    country = COALESCE(EXCLUDED.country, tickers.country),
    exchange = COALESCE(EXCLUDED.exchange, tickers.exchange),
    currency = COALESCE(EXCLUDED.currency, tickers.currency),
    market_cap = COALESCE(EXCLUDED.market_cap, tickers.market_cap),
    company_name = COALESCE(EXCLUDED.company_name, tickers.company_name),
    updated_at = NOW();

-- ============================================================================
-- 6. NETTOYER ET VALIDER LES CATÉGORIES
-- ============================================================================

-- Mettre à jour category pour refléter categories
UPDATE tickers
SET category = CASE
    WHEN 'team' = ANY(categories) AND 'watchlist' = ANY(categories) THEN 'both'
    WHEN 'team' = ANY(categories) THEN 'team'
    WHEN 'watchlist' = ANY(categories) THEN 'watchlist'
    WHEN 'instrument' = ANY(categories) THEN 'instrument'
    ELSE 'manual'
END
WHERE category IS NULL OR category = '';

-- S'assurer que categories contient au moins category
UPDATE tickers
SET categories = ARRAY[category]::TEXT[]
WHERE categories IS NULL OR array_length(categories, 1) IS NULL;

-- ============================================================================
-- 7. CRÉER DES VUES DE COMPATIBILITÉ (OPTIONNEL - POUR RÉTROCOMPATIBILITÉ)
-- ============================================================================

-- Vue pour team_tickers
CREATE OR REPLACE VIEW team_tickers_view AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY ticker)::INTEGER as id,
    ticker,
    added_date as added_at,
    is_active as active,
    company_name,
    team_name,
    priority,
    updated_at
FROM tickers
WHERE 'team' = ANY(categories) OR category IN ('team', 'both')
AND is_active = true;

-- Vue pour watchlist
CREATE OR REPLACE VIEW watchlist_view AS
SELECT 
    id,
    ticker,
    company_name,
    added_date as added_at,
    notes,
    target_price,
    stop_loss,
    created_at,
    updated_at
FROM tickers
WHERE 'watchlist' = ANY(categories) OR category IN ('watchlist', 'both');

-- ============================================================================
-- 8. STATISTIQUES DE MIGRATION
-- ============================================================================

DO $$
DECLARE
    v_total_tickers INTEGER;
    v_team_count INTEGER;
    v_watchlist_count INTEGER;
    v_both_count INTEGER;
    v_instrument_count INTEGER;
    v_manual_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_tickers FROM tickers WHERE is_active = true;
    SELECT COUNT(*) INTO v_team_count FROM tickers WHERE 'team' = ANY(categories) AND is_active = true;
    SELECT COUNT(*) INTO v_watchlist_count FROM tickers WHERE 'watchlist' = ANY(categories) AND is_active = true;
    SELECT COUNT(*) INTO v_both_count FROM tickers WHERE category = 'both' AND is_active = true;
    SELECT COUNT(*) INTO v_instrument_count FROM tickers WHERE 'instrument' = ANY(categories) AND is_active = true;
    SELECT COUNT(*) INTO v_manual_count FROM tickers WHERE category = 'manual' AND is_active = true;
    
    RAISE NOTICE '✅ Migration terminée :';
    RAISE NOTICE '   Total tickers actifs : %', v_total_tickers;
    RAISE NOTICE '   Team : %', v_team_count;
    RAISE NOTICE '   Watchlist : %', v_watchlist_count;
    RAISE NOTICE '   Both (team + watchlist) : %', v_both_count;
    RAISE NOTICE '   Instrument : %', v_instrument_count;
    RAISE NOTICE '   Manual : %', v_manual_count;
END $$;

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================

