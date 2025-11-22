-- ═══════════════════════════════════════════════════════════
-- SUPABASE: Configurations d'envoi par prompt
-- ═══════════════════════════════════════════════════════════
-- Permet de configurer les destinataires email pour chaque prompt
-- Utilisé par n8n pour router les briefings automatiques
-- ═══════════════════════════════════════════════════════════

-- 1. Ajouter un ID unique à chaque prompt dans emma_config
-- Format: section_key (ex: "briefing_morning", "custom_weekly_report")
ALTER TABLE emma_config ADD COLUMN IF NOT EXISTS prompt_id TEXT UNIQUE;
ALTER TABLE emma_config ADD COLUMN IF NOT EXISTS prompt_number INTEGER;

-- 2. Créer index pour recherche rapide par prompt_id
CREATE INDEX IF NOT EXISTS idx_emma_config_prompt_id ON emma_config(prompt_id);

-- 3. Ajouter les colonnes de configuration d'envoi
ALTER TABLE emma_config ADD COLUMN IF NOT EXISTS email_recipients JSONB DEFAULT '[]'::jsonb;
ALTER TABLE emma_config ADD COLUMN IF NOT EXISTS delivery_enabled BOOLEAN DEFAULT false;
ALTER TABLE emma_config ADD COLUMN IF NOT EXISTS delivery_schedule JSONB DEFAULT '{}'::jsonb;

-- Structure de email_recipients:
-- [
--   {
--     "email": "daniel@example.com",
--     "name": "Daniel",
--     "active": true,
--     "priority": 1
--   }
-- ]

-- Structure de delivery_schedule:
-- {
--   "frequency": "daily|weekly|monthly|manual",
--   "time": "09:00",
--   "timezone": "America/Montreal",
--   "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]
-- }

-- 4. Mettre à jour les prompts existants avec des IDs uniques
-- (À exécuter après création initiale)
UPDATE emma_config
SET
    prompt_id = section || '_' || key,
    prompt_number = ROW_NUMBER() OVER (ORDER BY section, key)
WHERE prompt_id IS NULL;

-- 5. Créer une vue pour n8n avec les prompts configurés pour envoi
CREATE OR REPLACE VIEW prompt_delivery_configs AS
SELECT
    prompt_id,
    prompt_number,
    section,
    key,
    email_recipients,
    delivery_enabled,
    delivery_schedule,
    config->>'metadata' as metadata,
    config->>'prompt' as prompt_content,
    updated_at
FROM emma_config
WHERE delivery_enabled = true
ORDER BY prompt_number;

-- 6. Grant permissions (ajuster selon vos besoins)
GRANT SELECT ON prompt_delivery_configs TO anon, authenticated;

-- 7. Fonction helper pour récupérer la config d'un prompt spécifique
CREATE OR REPLACE FUNCTION get_prompt_delivery_config(p_prompt_id TEXT)
RETURNS TABLE (
    prompt_id TEXT,
    prompt_number INTEGER,
    section TEXT,
    key TEXT,
    email_recipients JSONB,
    delivery_schedule JSONB,
    prompt_content TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ec.prompt_id,
        ec.prompt_number,
        ec.section,
        ec.key,
        ec.email_recipients,
        ec.delivery_schedule,
        ec.config->>'prompt' as prompt_content
    FROM emma_config ec
    WHERE ec.prompt_id = p_prompt_id
    AND ec.delivery_enabled = true;
END;
$$ LANGUAGE plpgsql;

-- Usage dans n8n:
-- SELECT * FROM get_prompt_delivery_config('briefing_morning');
