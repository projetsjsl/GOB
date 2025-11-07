-- ============================================================================
-- UNIFICATION DES TICKERS - Table unique `tickers` avec colonne `source`
-- ============================================================================
-- Ce script crée/améliore la table `tickers` pour remplacer `team_tickers` et `watchlist`
-- Utilise la colonne `source` pour distinguer: 'team', 'watchlist', 'manual'
-- ============================================================================

-- ============================================================================
-- 1. CRÉER/AMÉLIORER LA TABLE `tickers`
-- ============================================================================

CREATE TABLE IF NOT EXISTS tickers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticker VARCHAR(10) NOT NULL UNIQUE,
    company_name VARCHAR(255),
    sector VARCHAR(100),
    industry VARCHAR(100),
    country VARCHAR(100), -- Pays (ex: 'United States', 'Canada', 'United Kingdom')
    exchange VARCHAR(50), -- Bourse (ex: 'NASDAQ', 'NYSE', 'TSX', 'LSE')
    currency VARCHAR(10) DEFAULT 'USD', -- Devise (ex: 'USD', 'CAD', 'EUR', 'GBP')
    market_cap VARCHAR(50), -- Market cap (ex: '1.95T', '250.5B')
    is_active BOOLEAN DEFAULT true,
    source VARCHAR(50) DEFAULT 'manual', -- 'team', 'watchlist', 'manual', 'both'
    priority INTEGER DEFAULT 1, -- Pour trier les tickers (plus élevé = plus important)
    user_id TEXT, -- Pour les watchlists utilisateur (NULL pour team tickers)
    target_price DECIMAL(10,2),
    stop_loss DECIMAL(10,2),
    notes TEXT,
    added_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_scraped TIMESTAMP WITH TIME ZONE,
    scraping_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_tickers_ticker ON tickers(ticker);
CREATE INDEX IF NOT EXISTS idx_tickers_active ON tickers(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_tickers_source ON tickers(source);
CREATE INDEX IF NOT EXISTS idx_tickers_source_active ON tickers(source, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_tickers_priority ON tickers(priority DESC);
CREATE INDEX IF NOT EXISTS idx_tickers_user_id ON tickers(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tickers_last_scraped ON tickers(last_scraped DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_tickers_country ON tickers(country);
CREATE INDEX IF NOT EXISTS idx_tickers_exchange ON tickers(exchange);
CREATE INDEX IF NOT EXISTS idx_tickers_currency ON tickers(currency);
CREATE INDEX IF NOT EXISTS idx_tickers_sector ON tickers(sector);

-- ============================================================================
-- 2. AJOUTER LES COLONNES MANQUANTES SI LA TABLE EXISTE DÉJÀ
-- ============================================================================

DO $$
BEGIN
    -- Ajouter priority si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickers' AND column_name = 'priority') THEN
        ALTER TABLE tickers ADD COLUMN priority INTEGER DEFAULT 1;
    END IF;
    
    -- Ajouter user_id si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickers' AND column_name = 'user_id') THEN
        ALTER TABLE tickers ADD COLUMN user_id TEXT;
    END IF;
    
    -- Ajouter target_price si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickers' AND column_name = 'target_price') THEN
        ALTER TABLE tickers ADD COLUMN target_price DECIMAL(10,2);
    END IF;
    
    -- Ajouter stop_loss si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickers' AND column_name = 'stop_loss') THEN
        ALTER TABLE tickers ADD COLUMN stop_loss DECIMAL(10,2);
    END IF;
    
    -- S'assurer que source existe et a une valeur par défaut
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickers' AND column_name = 'source') THEN
        ALTER TABLE tickers ADD COLUMN source VARCHAR(50) DEFAULT 'manual';
    END IF;
    
    -- Ajouter currency si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickers' AND column_name = 'currency') THEN
        ALTER TABLE tickers ADD COLUMN currency VARCHAR(10) DEFAULT 'USD';
    END IF;
    
    -- Ajouter exchange si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickers' AND column_name = 'exchange') THEN
        ALTER TABLE tickers ADD COLUMN exchange VARCHAR(50);
    END IF;
    
    -- Ajouter country si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickers' AND column_name = 'country') THEN
        ALTER TABLE tickers ADD COLUMN country VARCHAR(100);
    END IF;
    
    -- Ajouter industry si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickers' AND column_name = 'industry') THEN
        ALTER TABLE tickers ADD COLUMN industry VARCHAR(100);
    END IF;
    
    -- Ajouter market_cap si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickers' AND column_name = 'market_cap') THEN
        ALTER TABLE tickers ADD COLUMN market_cap VARCHAR(50);
    END IF;
    
    -- Mettre à jour les valeurs NULL de source et currency
    UPDATE tickers SET source = 'manual' WHERE source IS NULL;
    UPDATE tickers SET currency = 'USD' WHERE currency IS NULL;
END $$;

-- ============================================================================
-- 3. MIGRER LES DONNÉES DE `team_tickers` VERS `tickers`
-- ============================================================================

-- Migration adaptative qui gère les colonnes qui peuvent ne pas exister
DO $$
DECLARE
    has_company_name BOOLEAN;
    has_priority BOOLEAN;
    has_active BOOLEAN;
    has_notes BOOLEAN;
    has_added_at BOOLEAN;
    has_updated_at BOOLEAN;
    sql_query TEXT;
BEGIN
    -- Vérifier quelles colonnes existent dans team_tickers
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'team_tickers' AND column_name = 'company_name'
    ) INTO has_company_name;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'team_tickers' AND column_name = 'priority'
    ) INTO has_priority;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'team_tickers' AND column_name = 'active'
    ) INTO has_active;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'team_tickers' AND column_name = 'notes'
    ) INTO has_notes;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'team_tickers' AND column_name = 'added_at'
    ) INTO has_added_at;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'team_tickers' AND column_name = 'updated_at'
    ) INTO has_updated_at;
    
    -- Construire la requête INSERT adaptative
    sql_query := 'INSERT INTO tickers (ticker, priority, is_active, source, added_date, created_at, updated_at';
    
    IF has_company_name THEN
        sql_query := sql_query || ', company_name';
    END IF;
    
    IF has_notes THEN
        sql_query := sql_query || ', notes';
    END IF;
    
    sql_query := sql_query || ') SELECT tt.ticker, ';
    
    IF has_priority THEN
        sql_query := sql_query || 'COALESCE(tt.priority, 1), ';
    ELSE
        sql_query := sql_query || '1, ';
    END IF;
    
    IF has_active THEN
        sql_query := sql_query || 'COALESCE(tt.active, true), ';
    ELSE
        sql_query := sql_query || 'true, ';
    END IF;
    
    sql_query := sql_query || '''team'', ';
    
    IF has_added_at THEN
        sql_query := sql_query || 'COALESCE(tt.added_at, NOW()), ';
    ELSE
        sql_query := sql_query || 'NOW(), ';
    END IF;
    
    IF has_added_at THEN
        sql_query := sql_query || 'COALESCE(tt.added_at, NOW()), ';
    ELSE
        sql_query := sql_query || 'NOW(), ';
    END IF;
    
    IF has_updated_at THEN
        sql_query := sql_query || 'COALESCE(tt.updated_at, NOW())';
    ELSE
        sql_query := sql_query || 'NOW()';
    END IF;
    
    IF has_company_name THEN
        sql_query := sql_query || ', tt.company_name';
    END IF;
    
    IF has_notes THEN
        sql_query := sql_query || ', tt.notes';
    END IF;
    
    sql_query := sql_query || ' FROM team_tickers tt WHERE NOT EXISTS (SELECT 1 FROM tickers t WHERE t.ticker = tt.ticker)';
    
    sql_query := sql_query || ' ON CONFLICT (ticker) DO UPDATE SET source = CASE WHEN tickers.source = ''watchlist'' THEN ''both'' ELSE ''team'' END, priority = GREATEST(tickers.priority, EXCLUDED.priority), is_active = EXCLUDED.is_active, updated_at = NOW()';
    
    IF has_company_name THEN
        sql_query := sql_query || ', company_name = COALESCE(EXCLUDED.company_name, tickers.company_name)';
    END IF;
    
    -- Exécuter la requête
    EXECUTE sql_query;
    
    RAISE NOTICE 'Migration team_tickers terminée';
END $$;

-- ============================================================================
-- 4. MIGRER LES DONNÉES DE `watchlist` VERS `tickers`
-- ============================================================================

-- Migration adaptative qui gère les colonnes qui peuvent ne pas exister
DO $$
DECLARE
    has_company_name BOOLEAN;
    has_user_id BOOLEAN;
    has_target_price BOOLEAN;
    has_stop_loss BOOLEAN;
    has_active BOOLEAN;
    has_notes BOOLEAN;
    has_added_at BOOLEAN;
    has_updated_at BOOLEAN;
    sql_query TEXT;
BEGIN
    -- Vérifier quelles colonnes existent dans watchlist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'watchlist' AND column_name = 'company_name'
    ) INTO has_company_name;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'watchlist' AND column_name = 'user_id'
    ) INTO has_user_id;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'watchlist' AND column_name = 'target_price'
    ) INTO has_target_price;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'watchlist' AND column_name = 'stop_loss'
    ) INTO has_stop_loss;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'watchlist' AND column_name = 'active'
    ) INTO has_active;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'watchlist' AND column_name = 'notes'
    ) INTO has_notes;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'watchlist' AND column_name = 'added_at'
    ) INTO has_added_at;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'watchlist' AND column_name = 'updated_at'
    ) INTO has_updated_at;
    
    -- Construire la requête INSERT adaptative
    sql_query := 'INSERT INTO tickers (ticker, is_active, source, added_date, created_at, updated_at';
    
    IF has_company_name THEN
        sql_query := sql_query || ', company_name';
    END IF;
    
    IF has_user_id THEN
        sql_query := sql_query || ', user_id';
    END IF;
    
    IF has_target_price THEN
        sql_query := sql_query || ', target_price';
    END IF;
    
    IF has_stop_loss THEN
        sql_query := sql_query || ', stop_loss';
    END IF;
    
    IF has_notes THEN
        sql_query := sql_query || ', notes';
    END IF;
    
    sql_query := sql_query || ') SELECT w.ticker, ';
    
    IF has_active THEN
        sql_query := sql_query || 'COALESCE(w.active, true), ';
    ELSE
        sql_query := sql_query || 'true, ';
    END IF;
    
    sql_query := sql_query || 'CASE WHEN EXISTS (SELECT 1 FROM tickers t WHERE t.ticker = w.ticker AND t.source IN (''team'', ''both'')) THEN ''both'' ELSE ''watchlist'' END, ';
    
    IF has_added_at THEN
        sql_query := sql_query || 'COALESCE(w.added_at, NOW()), ';
    ELSE
        sql_query := sql_query || 'NOW(), ';
    END IF;
    
    IF has_added_at THEN
        sql_query := sql_query || 'COALESCE(w.added_at, NOW()), ';
    ELSE
        sql_query := sql_query || 'NOW(), ';
    END IF;
    
    IF has_updated_at THEN
        sql_query := sql_query || 'COALESCE(w.updated_at, NOW())';
    ELSE
        sql_query := sql_query || 'NOW()';
    END IF;
    
    IF has_company_name THEN
        sql_query := sql_query || ', w.company_name';
    END IF;
    
    IF has_user_id THEN
        sql_query := sql_query || ', w.user_id';
    END IF;
    
    IF has_target_price THEN
        sql_query := sql_query || ', w.target_price';
    END IF;
    
    IF has_stop_loss THEN
        sql_query := sql_query || ', w.stop_loss';
    END IF;
    
    IF has_notes THEN
        sql_query := sql_query || ', w.notes';
    END IF;
    
    sql_query := sql_query || ' FROM watchlist w WHERE NOT EXISTS (SELECT 1 FROM tickers t WHERE t.ticker = w.ticker';
    
    IF has_user_id THEN
        sql_query := sql_query || ' AND t.user_id = w.user_id';
    END IF;
    
    sql_query := sql_query || ')';
    
    sql_query := sql_query || ' ON CONFLICT (ticker) DO UPDATE SET source = CASE WHEN tickers.source = ''team'' THEN ''both'' WHEN tickers.source = ''both'' THEN ''both'' ELSE ''watchlist'' END, is_active = EXCLUDED.is_active, updated_at = NOW()';
    
    IF has_company_name THEN
        sql_query := sql_query || ', company_name = COALESCE(EXCLUDED.company_name, tickers.company_name)';
    END IF;
    
    IF has_user_id THEN
        sql_query := sql_query || ', user_id = COALESCE(EXCLUDED.user_id, tickers.user_id)';
    END IF;
    
    IF has_target_price THEN
        sql_query := sql_query || ', target_price = COALESCE(EXCLUDED.target_price, tickers.target_price)';
    END IF;
    
    IF has_stop_loss THEN
        sql_query := sql_query || ', stop_loss = COALESCE(EXCLUDED.stop_loss, tickers.stop_loss)';
    END IF;
    
    -- Exécuter la requête
    EXECUTE sql_query;
    
    RAISE NOTICE 'Migration watchlist terminée';
END $$;

-- ============================================================================
-- 5. INSÉRER LES TICKERS PAR DÉFAUT DE L'ÉQUIPE (si aucun ticker team n'existe)
-- ============================================================================

INSERT INTO tickers (ticker, company_name, sector, industry, country, exchange, currency, priority, is_active, source)
VALUES
    ('GOOGL', 'Alphabet Inc.', 'Technology', 'Internet Content & Information', 'United States', 'NASDAQ', 'USD', 1, true, 'team'),
    ('T', 'AT&T Inc.', 'Communication Services', 'Telecom Services', 'United States', 'NYSE', 'USD', 1, true, 'team'),
    ('BNS', 'Bank of Nova Scotia', 'Financial Services', 'Banks', 'Canada', 'TSX', 'CAD', 1, true, 'team'),
    ('TD', 'Toronto-Dominion Bank', 'Financial Services', 'Banks', 'Canada', 'TSX', 'CAD', 1, true, 'team'),
    ('BCE', 'BCE Inc.', 'Communication Services', 'Telecom Services', 'Canada', 'TSX', 'CAD', 1, true, 'team'),
    ('CNR', 'Canadian National Railway', 'Industrials', 'Railroads', 'Canada', 'TSX', 'CAD', 1, true, 'team'),
    ('CSCO', 'Cisco Systems', 'Technology', 'Communication Equipment', 'United States', 'NASDAQ', 'USD', 1, true, 'team'),
    ('CVS', 'CVS Health Corporation', 'Healthcare', 'Healthcare Plans', 'United States', 'NYSE', 'USD', 1, true, 'team'),
    ('DEO', 'Diageo plc', 'Consumer Defensive', 'Beverages - Wineries & Distilleries', 'United Kingdom', 'NYSE', 'USD', 1, true, 'team'),
    ('MDT', 'Medtronic plc', 'Healthcare', 'Medical Devices', 'Ireland', 'NYSE', 'USD', 1, true, 'team'),
    ('JNJ', 'Johnson & Johnson', 'Healthcare', 'Drug Manufacturers - General', 'United States', 'NYSE', 'USD', 1, true, 'team'),
    ('JPM', 'JPMorgan Chase & Co.', 'Financial Services', 'Banks', 'United States', 'NYSE', 'USD', 1, true, 'team'),
    ('LVMHF', 'LVMH Moët Hennessy Louis Vuitton', 'Consumer Cyclical', 'Luxury Goods', 'France', 'OTC', 'EUR', 1, true, 'team'),
    ('MG', 'Mistras Group Inc.', 'Industrials', 'Security & Protection Services', 'United States', 'NYSE', 'USD', 1, true, 'team'),
    ('MFC', 'Manulife Financial Corporation', 'Financial Services', 'Insurance - Life', 'Canada', 'TSX', 'CAD', 1, true, 'team'),
    ('MU', 'Micron Technology Inc.', 'Technology', 'Semiconductors', 'United States', 'NASDAQ', 'USD', 1, true, 'team'),
    ('NSRGY', 'Nestlé S.A.', 'Consumer Defensive', 'Packaged Foods', 'Switzerland', 'OTC', 'CHF', 1, true, 'team'),
    ('NKE', 'Nike Inc.', 'Consumer Cyclical', 'Footwear & Accessories', 'United States', 'NYSE', 'USD', 1, true, 'team'),
    ('NTR', 'Nutrien Ltd.', 'Basic Materials', 'Agricultural Inputs', 'Canada', 'TSX', 'CAD', 1, true, 'team'),
    ('PFE', 'Pfizer Inc.', 'Healthcare', 'Drug Manufacturers - General', 'United States', 'NYSE', 'USD', 1, true, 'team'),
    ('TRP', 'TC Energy Corporation', 'Energy', 'Oil & Gas Midstream', 'Canada', 'TSX', 'CAD', 1, true, 'team'),
    ('UNH', 'UnitedHealth Group Inc.', 'Healthcare', 'Healthcare Plans', 'United States', 'NYSE', 'USD', 1, true, 'team'),
    ('UL', 'Unilever PLC', 'Consumer Defensive', 'Household & Personal Products', 'United Kingdom', 'NYSE', 'USD', 1, true, 'team'),
    ('VZ', 'Verizon Communications Inc.', 'Communication Services', 'Telecom Services', 'United States', 'NYSE', 'USD', 1, true, 'team'),
    ('WFC', 'Wells Fargo & Company', 'Financial Services', 'Banks', 'United States', 'NYSE', 'USD', 1, true, 'team')
ON CONFLICT (ticker) DO UPDATE SET
    source = CASE 
        WHEN tickers.source = 'watchlist' THEN 'both'
        WHEN tickers.source = 'both' THEN 'both'
        ELSE 'team'
    END,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- ============================================================================
-- 6. CONFIGURER RLS (Row Level Security)
-- ============================================================================

ALTER TABLE tickers ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Allow read access to all" ON tickers;
DROP POLICY IF EXISTS "Allow insert/update for all" ON tickers;
DROP POLICY IF EXISTS "Enable read access for all users" ON tickers;
DROP POLICY IF EXISTS "Enable insert for all users" ON tickers;
DROP POLICY IF EXISTS "Enable update for all users" ON tickers;
DROP POLICY IF EXISTS "Enable delete for all users" ON tickers;

-- Créer les nouvelles policies (lecture publique, écriture pour tous)
CREATE POLICY "Allow read access to all" ON tickers FOR SELECT USING (true);
CREATE POLICY "Allow insert/update for all" ON tickers FOR ALL USING (true);

-- ============================================================================
-- 7. CRÉER DES VUES UTILES
-- ============================================================================

-- Vue pour les tickers d'équipe uniquement
CREATE OR REPLACE VIEW team_tickers_view AS
SELECT * FROM tickers 
WHERE source IN ('team', 'both') AND is_active = true
ORDER BY priority DESC, ticker ASC;

-- Vue pour les tickers de watchlist uniquement
CREATE OR REPLACE VIEW watchlist_tickers_view AS
SELECT * FROM tickers 
WHERE source IN ('watchlist', 'both') AND is_active = true
ORDER BY ticker ASC;

-- Vue pour tous les tickers actifs
CREATE OR REPLACE VIEW active_tickers_view AS
SELECT * FROM tickers 
WHERE is_active = true
ORDER BY 
    CASE source 
        WHEN 'both' THEN 1
        WHEN 'team' THEN 2
        WHEN 'watchlist' THEN 3
        ELSE 4
    END,
    priority DESC,
    ticker ASC;

-- ============================================================================
-- 8. AFFICHER LES STATISTIQUES
-- ============================================================================

SELECT 
    source,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE is_active = true) as active,
    COUNT(*) FILTER (WHERE is_active = false) as inactive
FROM tickers
GROUP BY source
ORDER BY source;

-- Afficher un résumé
SELECT 
    '✅ Migration terminée' as status,
    COUNT(*) FILTER (WHERE source = 'team') as team_tickers,
    COUNT(*) FILTER (WHERE source = 'watchlist') as watchlist_tickers,
    COUNT(*) FILTER (WHERE source = 'both') as both_tickers,
    COUNT(*) FILTER (WHERE source = 'manual') as manual_tickers,
    COUNT(*) FILTER (WHERE is_active = true) as total_active
FROM tickers;

