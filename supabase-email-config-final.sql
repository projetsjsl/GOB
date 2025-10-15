-- ============================================================================
-- Configuration Email Automatisation - Emma En Direct
-- Date : 15 octobre 2025
-- ============================================================================

-- IMPORTANT : Remplacez VOTRE-EMAIL@example.com par votre vraie adresse email
-- IMPORTANT : Remplacez VOTRE-CRON-SECRET par votre secret Vercel

-- Modifier les adresses email dans les fonctions (remplacez par votre email)
CREATE OR REPLACE FUNCTION send_morning_briefing()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Appeler l'API Briefing Cron avec le secret
  SELECT content INTO result
  FROM http((
    'POST',
    'https://gobapps.com/api/briefing-cron',
    ARRAY[http_header('Content-Type', 'application/json')],
    'application/json',
    json_build_object(
      'type', 'morning',
      'secret', 'VOTRE-CRON-SECRET'
    )::text
  ));
  
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION send_noon_briefing()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Appeler l'API Briefing Cron avec le secret
  SELECT content INTO result
  FROM http((
    'POST',
    'https://gobapps.com/api/briefing-cron',
    ARRAY[http_header('Content-Type', 'application/json')],
    'application/json',
    json_build_object(
      'type', 'noon',
      'secret', 'VOTRE-CRON-SECRET'
    )::text
  ));
  
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION send_close_briefing()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Appeler l'API Briefing Cron avec le secret
  SELECT content INTO result
  FROM http((
    'POST',
    'https://gobapps.com/api/briefing-cron',
    ARRAY[http_header('Content-Type', 'application/json')],
    'application/json',
    json_build_object(
      'type', 'close',
      'secret', 'VOTRE-CRON-SECRET'
    )::text
  ));
  
  RETURN result;
END;
$$;

-- Ajouter l'utilisateur aux abonnés
INSERT INTO briefing_subscribers (email, name, preferences) 
VALUES ('VOTRE-EMAIL@example.com', 'Utilisateur Principal', '{"morning": true, "noon": true, "close": true}')
ON CONFLICT (email) DO UPDATE SET 
  preferences = '{"morning": true, "noon": true, "close": true}',
  active = true,
  updated_at = NOW();

-- Test du système
SELECT 'Configuration email terminée pour VOTRE-EMAIL@example.com' as message;
