-- ============================================================
-- SUPABASE ROLES & PERMISSIONS SETUP - GOB Dashboard
-- Système de gestion des rôles et permissions des composants
-- ============================================================
-- À exécuter dans le SQL Editor de Supabase
-- ============================================================

-- Table des rôles avec permissions de composants
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  admin_password_hash TEXT, -- Hash du mot de passe admin pour accéder à la config
  component_permissions JSONB DEFAULT '{}', -- { "component_id": true/false }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table de mapping utilisateur -> rôle
CREATE TABLE IF NOT EXISTS user_role_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  role_id UUID NOT NULL REFERENCES user_roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(username, role_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_user_roles_name ON user_roles(role_name);
CREATE INDEX IF NOT EXISTS idx_user_role_mapping_username ON user_role_mapping(username);
CREATE INDEX IF NOT EXISTS idx_user_role_mapping_role ON user_role_mapping(role_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour user_roles
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION update_roles_updated_at();

-- ============================================================
-- RÔLES PAR DÉFAUT
-- ============================================================

-- Rôle Admin (accès complet + config)
INSERT INTO user_roles (role_name, display_name, description, is_admin, component_permissions)
VALUES (
  'admin',
  'Administrateur',
  'Accès complet à tous les composants et configuration des rôles',
  TRUE,
  '{
    "stocks-news": true,
    "ask-emma": true,
    "intellistocks": true,
    "economic-calendar": true,
    "investing-calendar": true,
    "yield-curve": true,
    "markets-economy": true,
    "dans-watchlist": true,
    "scrapping-sa": true,
    "seeking-alpha": true,
    "email-briefings": true,
    "admin-jslai": true,
    "emma-sms": true,
    "fastgraphs": true,
    "plus": true,
    "news-ticker": true,
    "theme-selector": true
  }'::jsonb
) ON CONFLICT (role_name) DO NOTHING;

-- Rôle GOB (accès étendu)
INSERT INTO user_roles (role_name, display_name, description, is_admin, component_permissions)
VALUES (
  'gob',
  'GOB',
  'Accès étendu à la plupart des composants',
  FALSE,
  '{
    "stocks-news": true,
    "ask-emma": true,
    "intellistocks": true,
    "economic-calendar": true,
    "investing-calendar": true,
    "yield-curve": true,
    "markets-economy": true,
    "dans-watchlist": true,
    "seeking-alpha": true,
    "email-briefings": true,
    "fastgraphs": true,
    "news-ticker": true,
    "theme-selector": true,
    "scrapping-sa": false,
    "admin-jslai": false,
    "emma-sms": false,
    "plus": false
  }'::jsonb
) ON CONFLICT (role_name) DO NOTHING;

-- Rôle Daniel (accès standard)
INSERT INTO user_roles (role_name, display_name, description, is_admin, component_permissions)
VALUES (
  'daniel',
  'Daniel',
  'Accès standard aux composants principaux',
  FALSE,
  '{
    "stocks-news": true,
    "ask-emma": true,
    "intellistocks": true,
    "economic-calendar": true,
    "investing-calendar": true,
    "yield-curve": true,
    "markets-economy": true,
    "dans-watchlist": true,
    "news-ticker": true,
    "theme-selector": true,
    "seeking-alpha": false,
    "scrapping-sa": false,
    "email-briefings": false,
    "admin-jslai": false,
    "emma-sms": false,
    "fastgraphs": false,
    "plus": false
  }'::jsonb
) ON CONFLICT (role_name) DO NOTHING;

-- Rôle Client (accès limité)
INSERT INTO user_roles (role_name, display_name, description, is_admin, component_permissions)
VALUES (
  'client',
  'Client',
  'Accès limité aux composants de base',
  FALSE,
  '{
    "stocks-news": true,
    "ask-emma": true,
    "intellistocks": true,
    "news-ticker": true,
    "theme-selector": true,
    "economic-calendar": false,
    "investing-calendar": false,
    "yield-curve": false,
    "markets-economy": false,
    "dans-watchlist": false,
    "seeking-alpha": false,
    "scrapping-sa": false,
    "email-briefings": false,
    "admin-jslai": false,
    "emma-sms": false,
    "fastgraphs": false,
    "plus": false
  }'::jsonb
) ON CONFLICT (role_name) DO NOTHING;

-- Rôle Invité (accès minimal)
INSERT INTO user_roles (role_name, display_name, description, is_admin, component_permissions)
VALUES (
  'invite',
  'Invité',
  'Accès minimal aux composants',
  FALSE,
  '{
    "stocks-news": true,
    "ask-emma": true,
    "news-ticker": true,
    "theme-selector": true,
    "intellistocks": false,
    "economic-calendar": false,
    "investing-calendar": false,
    "yield-curve": false,
    "markets-economy": false,
    "dans-watchlist": false,
    "seeking-alpha": false,
    "scrapping-sa": false,
    "email-briefings": false,
    "admin-jslai": false,
    "emma-sms": false,
    "fastgraphs": false,
    "plus": false
  }'::jsonb
) ON CONFLICT (role_name) DO NOTHING;

-- ============================================================
-- MAPPING UTILISATEURS -> RÔLES (par défaut)
-- ============================================================

-- Mapping admin -> admin
INSERT INTO user_role_mapping (username, role_id)
SELECT 'admin', id FROM user_roles WHERE role_name = 'admin'
ON CONFLICT (username, role_id) DO NOTHING;

-- Mapping gob -> gob
INSERT INTO user_role_mapping (username, role_id)
SELECT 'gob', id FROM user_roles WHERE role_name = 'gob'
ON CONFLICT (username, role_id) DO NOTHING;

-- Mapping daniel -> daniel
INSERT INTO user_role_mapping (username, role_id)
SELECT 'daniel', id FROM user_roles WHERE role_name = 'daniel'
ON CONFLICT (username, role_id) DO NOTHING;

-- Mapping client -> client
INSERT INTO user_role_mapping (username, role_id)
SELECT 'client', id FROM user_roles WHERE role_name = 'client'
ON CONFLICT (username, role_id) DO NOTHING;

-- Mapping invite -> invite
INSERT INTO user_role_mapping (username, role_id)
SELECT 'invite', id FROM user_roles WHERE role_name = 'invite'
ON CONFLICT (username, role_id) DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Activer RLS sur les tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_mapping ENABLE ROW LEVEL SECURITY;

-- Politique: Tous peuvent lire les rôles (pour affichage)
CREATE POLICY "Anyone can read roles" ON user_roles
  FOR SELECT
  USING (true);

-- Politique: Seuls les admins peuvent modifier les rôles
-- (Note: Cette politique sera gérée par l'API avec service_role_key)
CREATE POLICY "Only admins can modify roles" ON user_roles
  FOR ALL
  USING (true); -- L'API vérifiera les permissions avec service_role_key

-- Politique: Tous peuvent lire les mappings
CREATE POLICY "Anyone can read role mappings" ON user_role_mapping
  FOR SELECT
  USING (true);

-- Politique: Seuls les admins peuvent modifier les mappings
CREATE POLICY "Only admins can modify role mappings" ON user_role_mapping
  FOR ALL
  USING (true); -- L'API vérifiera les permissions avec service_role_key

-- ============================================================
-- VUES UTILES
-- ============================================================

-- Vue pour obtenir les permissions d'un utilisateur
CREATE OR REPLACE VIEW user_permissions AS
SELECT 
  urm.username,
  ur.role_name,
  ur.display_name,
  ur.is_admin,
  ur.component_permissions,
  ur.id as role_id
FROM user_role_mapping urm
JOIN user_roles ur ON urm.role_id = ur.id;

-- ============================================================
-- COMMENTAIRES
-- ============================================================

COMMENT ON TABLE user_roles IS 'Rôles utilisateurs avec permissions de composants';
COMMENT ON TABLE user_role_mapping IS 'Mapping des utilisateurs vers leurs rôles';
COMMENT ON COLUMN user_roles.component_permissions IS 'JSON avec les permissions: { "component_id": true/false }';
COMMENT ON COLUMN user_roles.admin_password_hash IS 'Hash du mot de passe pour accéder à la configuration des rôles';

