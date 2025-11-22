-- Supprimer le prompt de test "briefing_evening"
DELETE FROM emma_config
WHERE key = 'briefing_evening';

-- Vérifier qu'il n'y a plus de prompts avec delivery_enabled actif
SELECT key, prompt_id, delivery_enabled
FROM emma_config
WHERE delivery_enabled IS TRUE;
