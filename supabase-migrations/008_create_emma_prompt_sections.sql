-- Migration: Create emma_prompt_sections table
-- Description: Table pour gérer dynamiquement les sections de prompt dans l'onglet "Ask Emma"
-- Date: 2025-01-XX

-- Créer la table emma_prompt_sections
CREATE TABLE IF NOT EXISTS emma_prompt_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT, -- Optional: for multi-user support
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📝',
  placeholder TEXT,
  button_color TEXT DEFAULT 'bg-blue-600',
  button_hover_color TEXT DEFAULT 'hover:bg-blue-700',
  prompt_type TEXT CHECK (prompt_type IN ('existing', 'custom')),
  prompt_key TEXT, -- e.g., 'prompts.expertSystem'
  custom_prompt TEXT,
  inputs JSONB DEFAULT '[]'::jsonb, -- Array of input configs
  order_index INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_sections_order ON emma_prompt_sections(order_index);
CREATE INDEX IF NOT EXISTS idx_sections_user ON emma_prompt_sections(user_id);
CREATE INDEX IF NOT EXISTS idx_sections_active ON emma_prompt_sections(is_active);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_emma_prompt_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER trigger_update_emma_prompt_sections_updated_at
  BEFORE UPDATE ON emma_prompt_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_emma_prompt_sections_updated_at();

-- Commentaires sur la table et les colonnes
COMMENT ON TABLE emma_prompt_sections IS 'Sections de prompt dynamiques pour l''interface Emma';
COMMENT ON COLUMN emma_prompt_sections.user_id IS 'ID utilisateur (optionnel pour support multi-utilisateurs)';
COMMENT ON COLUMN emma_prompt_sections.name IS 'Nom de la section affiché dans l''UI';
COMMENT ON COLUMN emma_prompt_sections.icon IS 'Icône emoji pour la section';
COMMENT ON COLUMN emma_prompt_sections.placeholder IS 'Texte placeholder pour les inputs';
COMMENT ON COLUMN emma_prompt_sections.button_color IS 'Classe Tailwind pour la couleur du bouton';
COMMENT ON COLUMN emma_prompt_sections.button_hover_color IS 'Classe Tailwind pour la couleur hover du bouton';
COMMENT ON COLUMN emma_prompt_sections.prompt_type IS 'Type: existing (depuis emma-config) ou custom (prompt personnalisé)';
COMMENT ON COLUMN emma_prompt_sections.prompt_key IS 'Clé du prompt dans emma-config (ex: prompts.expertSystem)';
COMMENT ON COLUMN emma_prompt_sections.custom_prompt IS 'Prompt personnalisé si prompt_type = custom';
COMMENT ON COLUMN emma_prompt_sections.inputs IS 'Configuration JSONB des champs input (array)';
COMMENT ON COLUMN emma_prompt_sections.order_index IS 'Index pour l''ordre d''affichage';
COMMENT ON COLUMN emma_prompt_sections.is_active IS 'Si false, la section est masquée (soft delete)';

