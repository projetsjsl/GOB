-- Supprimer le prompt de test configuré
-- À exécuter dans Supabase SQL Editor

-- 1. Supprimer le prompt de test "briefing_evening"
DELETE FROM emma_config
WHERE key = 'briefing_evening'
AND prompt_id = 'briefing_evening';

-- 2. Vérifier qu'il n'y a plus de prompts avec delivery_enabled = true
SELECT
    key,
    prompt_id,
    delivery_enabled,
    email_recipients,
    delivery_schedule
FROM emma_config
WHERE delivery_enabled = true;

-- Résultat attendu: Aucune ligne retournée (0 rows)
