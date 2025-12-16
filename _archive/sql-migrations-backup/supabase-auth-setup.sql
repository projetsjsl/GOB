-- ============================================================
-- SUPABASE AUTH SETUP - GOB Dashboard
-- À exécuter dans le SQL Editor de Supabase
-- ============================================================

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('invite', 'client', 'daniel', 'gob', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Table de l'historique de conversations (modifiée pour auth)
CREATE TABLE IF NOT EXISTS conversation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
  session_id UUID DEFAULT gen_random_uuid(),
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_conversation_user ON conversation_history(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_session ON conversation_history(session_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour conversation_history
DROP TRIGGER IF EXISTS update_conversation_history_updated_at ON conversation_history;
CREATE TRIGGER update_conversation_history_updated_at
BEFORE UPDATE ON conversation_history
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Activer RLS sur les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid duplicates on re-run)
DROP POLICY IF EXISTS "Users can view themselves" ON users;
DROP POLICY IF EXISTS "Service role can insert users" ON users;
DROP POLICY IF EXISTS "Service role can update users" ON users;

-- Politique pour users: Tous peuvent se voir eux-mêmes
CREATE POLICY "Users can view themselves"
  ON users
  FOR SELECT
  USING (true); -- Pour l'instant, on permet à tous de voir tous les users (pour admin)

-- Politique pour users: Permettre l'insertion (via service role key)
CREATE POLICY "Service role can insert users"
  ON users
  FOR INSERT
  WITH CHECK (true); -- Le service role key bypass RLS, mais définissons la policy pour clarté

-- Politique pour users: Permettre la mise à jour (via service role key)
CREATE POLICY "Service role can update users"
  ON users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Drop existing conversation_history policies if they exist (to avoid duplicates on re-run)
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversation_history;
DROP POLICY IF EXISTS "Users can insert their own conversations" ON conversation_history;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversation_history;

-- Politique pour conversation_history: Voir ses propres conversations
CREATE POLICY "Users can view their own conversations"
  ON conversation_history
  FOR SELECT
  USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'username'
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE username = current_setting('request.jwt.claims', true)::json->>'username'
      AND role = 'admin'
    )
  );

-- Politique pour conversation_history: Insérer ses propres conversations
CREATE POLICY "Users can insert their own conversations"
  ON conversation_history
  FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'username');

-- Politique pour conversation_history: Mettre à jour ses propres conversations
CREATE POLICY "Users can update their own conversations"
  ON conversation_history
  FOR UPDATE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'username')
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'username');

-- ============================================================
-- DONNÉES INITIALES (optionnel - les users seront créés au premier login)
-- ============================================================

-- Insérer les utilisateurs si ils n'existent pas déjà
INSERT INTO users (username, display_name, role)
VALUES
  ('invite', 'Invité', 'invite'),
  ('client', 'Client', 'client'),
  ('daniel', 'Daniel', 'daniel'),
  ('gob', 'GOB', 'gob'),
  ('admin', 'Admin', 'admin')
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- VÉRIFICATION
-- ============================================================

-- Afficher tous les utilisateurs
SELECT * FROM users ORDER BY role;

-- Vérifier les politiques RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('users', 'conversation_history');

-- ============================================================
-- NETTOYAGE (si besoin de recommencer)
-- ============================================================

-- ATTENTION: Décommentez SEULEMENT si vous voulez tout supprimer

-- DROP TABLE IF EXISTS conversation_history CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
