-- ═══════════════════════════════════════════════════════════════
-- EMMA CONFIG - Tables Supabase pour persistance
-- Exécuter dans Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Table principale pour toutes les configs Emma
CREATE TABLE IF NOT EXISTS emma_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT DEFAULT 'system'
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_emma_config_updated ON emma_config(updated_at DESC);

-- Insérer les configs par défaut
INSERT INTO emma_config (key, value, description) VALUES
('email_design', '{
  "branding": {
    "avatar": {"url": "", "alt": "Emma IA", "size": 64},
    "logo": {"url": "", "alt": "JSLai", "width": 150},
    "companyName": "GOB Apps",
    "tagline": "Intelligence Financière Propulsée par Emma IA"
  },
  "colors": {
    "primary": "#6366f1",
    "primaryDark": "#4f46e5",
    "primaryLight": "#8b5cf6",
    "textDark": "#1f2937",
    "textMuted": "#6b7280"
  },
  "header": {
    "showAvatar": true,
    "showDate": true,
    "showEdition": true
  },
  "footer": {
    "showLogo": true,
    "showDisclaimer": true,
    "disclaimerText": "Ce briefing est généré automatiquement par Emma IA à des fins informatives uniquement.",
    "copyrightText": "© 2025 GOB Apps - Tous droits réservés"
  },
  "sms": {
    "maxSegments": 10,
    "warningThreshold": 5,
    "signature": "- Emma IA",
    "keepSectionEmojis": true,
    "showSegmentWarning": true
  }
}'::jsonb, 'Configuration design des emails et SMS')
ON CONFLICT (key) DO NOTHING;

-- Fonction pour mettre à jour le timestamp automatiquement
CREATE OR REPLACE FUNCTION update_emma_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour auto-update timestamp
DROP TRIGGER IF EXISTS emma_config_timestamp ON emma_config;
CREATE TRIGGER emma_config_timestamp
  BEFORE UPDATE ON emma_config
  FOR EACH ROW
  EXECUTE FUNCTION update_emma_config_timestamp();

-- Vérification
SELECT key, description, updated_at FROM emma_config;
