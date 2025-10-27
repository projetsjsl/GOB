-- ============================================================================
-- CRÉATION TABLE WATCHLIST DE BASE
-- À exécuter AVANT SUPABASE_SETUP_FINAL.sql
-- ============================================================================

-- Activer l'extension UUID si pas déjà fait
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: WATCHLIST (TABLE DE BASE)
-- ============================================================================
CREATE TABLE IF NOT EXISTS watchlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticker TEXT NOT NULL UNIQUE,
    company_name TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    target_price DECIMAL(10,2),
    stop_loss DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_watchlist_ticker ON watchlist(ticker);
CREATE INDEX IF NOT EXISTS idx_watchlist_added_at ON watchlist(added_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS sur la table watchlist
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- Policy pour service_role (accès complet via API)
CREATE POLICY "Service role has full access to watchlist"
    ON watchlist FOR ALL
    USING (true)
    WITH CHECK (true);

-- Policy pour anon/authenticated (lecture seule)
CREATE POLICY "Public read access to watchlist"
    ON watchlist FOR SELECT
    USING (true);

-- ============================================================================
-- DONNÉES DE TEST
-- ============================================================================

-- Insérer quelques tickers de test
INSERT INTO watchlist (ticker, company_name, notes)
VALUES
    ('AAPL', 'Apple Inc.', 'Technologie - iPhone, Mac, Services'),
    ('MSFT', 'Microsoft Corporation', 'Technologie - Azure, Office, Windows'),
    ('GOOGL', 'Alphabet Inc.', 'Technologie - Google Search, YouTube, Cloud'),
    ('TSLA', 'Tesla Inc.', 'Automobile électrique et énergie'),
    ('NVDA', 'NVIDIA Corporation', 'Semi-conducteurs - GPU, IA')
ON CONFLICT (ticker) DO NOTHING;

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

-- Vérifier que la table existe
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'watchlist';

-- Compter les enregistrements
SELECT COUNT(*) as watchlist_count FROM watchlist;

-- Afficher les données
SELECT ticker, company_name, added_at FROM watchlist ORDER BY added_at DESC;
