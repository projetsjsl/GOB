-- Création de la table watchlists pour Supabase
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Créer la table watchlists
CREATE TABLE IF NOT EXISTS watchlists (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default',
  tickers JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON watchlists(user_id);

-- 3. Créer une fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Créer le trigger pour updated_at
DROP TRIGGER IF EXISTS update_watchlists_updated_at ON watchlists;
CREATE TRIGGER update_watchlists_updated_at
    BEFORE UPDATE ON watchlists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Insérer des données de test
INSERT INTO watchlists (user_id, tickers) 
VALUES ('default', '["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN"]')
ON CONFLICT (user_id) 
DO UPDATE SET 
  tickers = EXCLUDED.tickers,
  updated_at = NOW();

-- 6. Configurer les politiques RLS (Row Level Security)
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;

-- 7. Créer une politique pour permettre la lecture à tous
CREATE POLICY "Allow read access to all users" ON watchlists
  FOR SELECT USING (true);

-- 8. Créer une politique pour permettre l'insertion/mise à jour
CREATE POLICY "Allow insert/update for all users" ON watchlists
  FOR ALL USING (true);

-- 9. Vérifier que la table a été créée
SELECT * FROM watchlists;
