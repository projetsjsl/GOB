-- ═══════════════════════════════════════════════════════════
-- SUPABASE: Configurations d'envoi par prompt (FIXED VERSION)
-- ═══════════════════════════════════════════════════════════
-- Version corrigée sans dépendance à la colonne 'section'
-- Table emma_config n'a que 'key', pas 'section'
-- ═══════════════════════════════════════════════════════════

-- 1. Ajouter colonnes si elles n'existent pas
ALTER TABLE emma_config ADD COLUMN IF NOT EXISTS prompt_id TEXT UNIQUE;
ALTER TABLE emma_config ADD COLUMN IF NOT EXISTS prompt_number INTEGER;
ALTER TABLE emma_config ADD COLUMN IF NOT EXISTS email_recipients JSONB DEFAULT '[]'::jsonb;
ALTER TABLE emma_config ADD COLUMN IF NOT EXISTS delivery_enabled BOOLEAN DEFAULT false;
ALTER TABLE emma_config ADD COLUMN IF NOT EXISTS delivery_schedule JSONB DEFAULT '{}'::jsonb;

-- 2. Créer index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_emma_config_prompt_id ON emma_config(prompt_id);
CREATE INDEX IF NOT EXISTS idx_emma_config_delivery_enabled ON emma_config(delivery_enabled) WHERE delivery_enabled = true;

-- 3. Mettre à jour les prompts existants avec prompt_id = key
UPDATE emma_config
SET prompt_id = key
WHERE prompt_id IS NULL;

-- 4. Créer une vue pour les prompts actifs (SANS colonne section)
CREATE OR REPLACE VIEW prompt_delivery_configs AS
SELECT
    key,
    prompt_id,
    prompt_number,
    value as config,
    email_recipients,
    delivery_enabled,
    delivery_schedule,
    description,
    updated_at,
    updated_by
FROM emma_config
WHERE delivery_enabled = true
ORDER BY prompt_number;

-- 5. Grant permissions
GRANT SELECT ON prompt_delivery_configs TO anon, authenticated;

-- 6. Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS get_prompt_delivery_config(TEXT);

-- 7. Fonction RPC corrigée (SANS colonne section)
CREATE OR REPLACE FUNCTION get_prompt_delivery_config(p_prompt_id TEXT)
RETURNS TABLE (
    key TEXT,
    prompt_id TEXT,
    prompt_number INTEGER,
    config JSONB,
    email_recipients JSONB,
    delivery_enabled BOOLEAN,
    delivery_schedule JSONB,
    description TEXT,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ec.key,
        ec.prompt_id,
        ec.prompt_number,
        ec.value as config,
        ec.email_recipients,
        ec.delivery_enabled,
        ec.delivery_schedule,
        ec.description,
        ec.updated_at
    FROM emma_config ec
    WHERE ec.prompt_id = p_prompt_id
    OR ec.key = p_prompt_id;
END;
$$ LANGUAGE plpgsql;

-- 8. Test de la fonction
-- SELECT * FROM get_prompt_delivery_config('briefing_evening');

-- 9. Vérifier les prompts actifs
-- SELECT * FROM prompt_delivery_configs;
