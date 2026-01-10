-- Migration: User Preferences for CurveWatch
-- Description: Table pour stocker les préférences utilisateur (paramètres d'interface, couleurs, etc.)
-- Date: 2026-01-08

-- Table pour les préférences utilisateur
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    app_name TEXT NOT NULL DEFAULT 'curvewatch', -- Pour permettre plusieurs apps
    preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Un seul set de préférences par utilisateur/app
    UNIQUE(user_id, app_name)
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_app_name ON user_preferences(app_name);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_user_preferences_updated_at();

-- RLS (Row Level Security) - Les utilisateurs ne peuvent voir/modifier que leurs propres préférences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent lire leurs propres préférences
CREATE POLICY "Users can read own preferences"
    ON user_preferences
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent insérer leurs propres préférences
CREATE POLICY "Users can insert own preferences"
    ON user_preferences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent mettre à jour leurs propres préférences
CREATE POLICY "Users can update own preferences"
    ON user_preferences
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent supprimer leurs propres préférences
CREATE POLICY "Users can delete own preferences"
    ON user_preferences
    FOR DELETE
    USING (auth.uid() = user_id);

-- Commentaires
COMMENT ON TABLE user_preferences IS 'Préférences utilisateur pour CurveWatch (paramètres d''interface, couleurs, graphiques, etc.)';
COMMENT ON COLUMN user_preferences.user_id IS 'ID de l''utilisateur (auth.users)';
COMMENT ON COLUMN user_preferences.app_name IS 'Nom de l''application (pour permettre plusieurs apps)';
COMMENT ON COLUMN user_preferences.preferences IS 'JSON contenant toutes les préférences utilisateur';
