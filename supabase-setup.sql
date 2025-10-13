-- ========================================
-- SUPABASE SETUP - Table watchlists
-- ========================================

-- Créer la table watchlists
CREATE TABLE IF NOT EXISTS watchlists (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  tickers TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON watchlists(user_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_watchlists_updated_at 
    BEFORE UPDATE ON watchlists 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - Optionnel
-- ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre l'accès public (pour ce projet)
-- CREATE POLICY "Allow public access" ON watchlists
--     FOR ALL USING (true);

-- Insérer des données de test (optionnel)
INSERT INTO watchlists (user_id, tickers) 
VALUES ('default', ARRAY['ACN', 'NVDA', 'AAPL'])
ON CONFLICT (user_id) DO NOTHING;

-- Vérifier la création
SELECT * FROM watchlists;
