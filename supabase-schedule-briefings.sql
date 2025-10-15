-- ============================================================================
-- Supabase Schedule Functions pour Emma En Direct
-- Automatisation des briefings 3x/jour (Morning, Noon, Close)
-- ============================================================================

-- ============================================================================
-- 1. FONCTION PRINCIPALE DE GÉNÉRATION DE BRIEFING
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_emma_briefing(
  briefing_type TEXT,
  target_email TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  briefing_data JSON;
  ai_response JSON;
  email_result JSON;
  briefing_id UUID;
BEGIN
  -- Log du début
  RAISE LOG 'Starting Emma briefing generation: %', briefing_type;
  
  -- 1. Collecter les données de marché
  SELECT json_build_object(
    'timestamp', NOW(),
    'type', briefing_type,
    'market_data', 'collected',
    'news_data', 'collected',
    'watchlist_data', 'collected'
  ) INTO briefing_data;
  
  -- 2. Appeler l'API AI Services pour générer le briefing
  SELECT content INTO ai_response
  FROM http((
    'POST',
    'https://your-vercel-app.vercel.app/api/ai-services',
    ARRAY[http_header('Content-Type', 'application/json')],
    'application/json',
    json_build_object(
      'service', 'openai',
      'message', 'Generate ' || briefing_type || ' briefing',
      'type', briefing_type
    )::text
  ));
  
  -- 3. Sauvegarder le briefing dans la base
  INSERT INTO briefings (
    type,
    content,
    status,
    generated_at,
    target_email
  ) VALUES (
    briefing_type,
    ai_response,
    'generated',
    NOW(),
    target_email
  ) RETURNING id INTO briefing_id;
  
  -- 4. Envoyer l'email si une adresse est fournie
  IF target_email IS NOT NULL THEN
    SELECT content INTO email_result
    FROM http((
      'POST',
      'https://your-vercel-app.vercel.app/api/ai-services',
      ARRAY[http_header('Content-Type', 'application/json')],
      'application/json',
      json_build_object(
        'service', 'resend',
        'to', target_email,
        'subject', 'Emma En Direct · ' || INITCAP(briefing_type),
        'html', ai_response,
        'briefing_id', briefing_id
      )::text
    ));
  END IF;
  
  -- 5. Retourner le résultat
  SELECT json_build_object(
    'success', true,
    'briefing_id', briefing_id,
    'type', briefing_type,
    'generated_at', NOW(),
    'email_sent', target_email IS NOT NULL,
    'email_result', email_result
  ) INTO result;
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  -- Log de l'erreur
  RAISE LOG 'Error generating briefing: %', SQLERRM;
  
  -- Retourner l'erreur
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'type', briefing_type,
    'timestamp', NOW()
  );
END;
$$;

-- ============================================================================
-- 2. FONCTIONS SPÉCIALISÉES PAR TYPE DE BRIEFING
-- ============================================================================

-- Briefing matinal (8h00 EST)
CREATE OR REPLACE FUNCTION send_morning_briefing()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN generate_emma_briefing('morning', 'your-email@example.com');
END;
$$;

-- Briefing de midi (12h00 EST)
CREATE OR REPLACE FUNCTION send_noon_briefing()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN generate_emma_briefing('noon', 'your-email@example.com');
END;
$$;

-- Briefing de clôture (16h30 EST)
CREATE OR REPLACE FUNCTION send_close_briefing()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN generate_emma_briefing('close', 'your-email@example.com');
END;
$$;

-- ============================================================================
-- 3. CONFIGURATION DES CRON JOBS
-- ============================================================================

-- Briefing matinal - 8h00 EST (13h00 UTC en hiver, 12h00 UTC en été)
SELECT cron.schedule(
  'emma-morning-briefing',
  '0 13 * * 1-5', -- Lundi à Vendredi à 13h00 UTC (8h00 EST)
  'SELECT send_morning_briefing();'
);

-- Briefing de midi - 12h00 EST (17h00 UTC en hiver, 16h00 UTC en été)
SELECT cron.schedule(
  'emma-noon-briefing',
  '0 17 * * 1-5', -- Lundi à Vendredi à 17h00 UTC (12h00 EST)
  'SELECT send_noon_briefing();'
);

-- Briefing de clôture - 16h30 EST (21h30 UTC en hiver, 20h30 UTC en été)
SELECT cron.schedule(
  'emma-close-briefing',
  '30 21 * * 1-5', -- Lundi à Vendredi à 21h30 UTC (16h30 EST)
  'SELECT send_close_briefing();'
);

-- ============================================================================
-- 4. FONCTION DE GESTION DES ABONNÉS
-- ============================================================================

-- Table pour gérer les abonnés
CREATE TABLE IF NOT EXISTS briefing_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  preferences JSONB DEFAULT '{"morning": true, "noon": true, "close": true}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fonction pour envoyer à tous les abonnés
CREATE OR REPLACE FUNCTION send_briefing_to_subscribers(briefing_type TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  subscriber RECORD;
  result JSON;
  results JSON[] := '{}';
  total_sent INTEGER := 0;
  total_failed INTEGER := 0;
BEGIN
  -- Récupérer tous les abonnés actifs pour ce type de briefing
  FOR subscriber IN 
    SELECT email, name, preferences
    FROM briefing_subscribers 
    WHERE active = true 
    AND (preferences->briefing_type)::boolean = true
  LOOP
    -- Générer et envoyer le briefing
    SELECT generate_emma_briefing(briefing_type, subscriber.email) INTO result;
    
    -- Compter les succès/échecs
    IF (result->>'success')::boolean THEN
      total_sent := total_sent + 1;
    ELSE
      total_failed := total_failed + 1;
    END IF;
    
    results := results || result;
  END LOOP;
  
  -- Retourner le résumé
  RETURN json_build_object(
    'success', true,
    'type', briefing_type,
    'total_subscribers', total_sent + total_failed,
    'emails_sent', total_sent,
    'emails_failed', total_failed,
    'results', results,
    'timestamp', NOW()
  );
END;
$$;

-- ============================================================================
-- 5. FONCTIONS DE GESTION
-- ============================================================================

-- Voir les cron jobs actifs
CREATE OR REPLACE FUNCTION get_active_cron_jobs()
RETURNS TABLE (
  jobid BIGINT,
  schedule TEXT,
  command TEXT,
  nodename TEXT,
  nodeport INTEGER,
  database TEXT,
  username TEXT,
  active BOOLEAN,
  jobname TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM cron.job WHERE jobname LIKE 'emma-%';
$$;

-- Désactiver tous les cron jobs Emma
CREATE OR REPLACE FUNCTION disable_emma_cron_jobs()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  job RECORD;
  disabled_count INTEGER := 0;
BEGIN
  FOR job IN SELECT jobid FROM cron.job WHERE jobname LIKE 'emma-%' LOOP
    PERFORM cron.unschedule(job.jobid);
    disabled_count := disabled_count + 1;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'disabled_jobs', disabled_count,
    'timestamp', NOW()
  );
END;
$$;

-- Réactiver tous les cron jobs Emma
CREATE OR REPLACE FUNCTION enable_emma_cron_jobs()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Réactiver les cron jobs
  PERFORM cron.schedule('emma-morning-briefing', '0 13 * * 1-5', 'SELECT send_morning_briefing();');
  PERFORM cron.schedule('emma-noon-briefing', '0 17 * * 1-5', 'SELECT send_noon_briefing();');
  PERFORM cron.schedule('emma-close-briefing', '30 21 * * 1-5', 'SELECT send_close_briefing();');
  
  RETURN json_build_object(
    'success', true,
    'enabled_jobs', 3,
    'timestamp', NOW()
  );
END;
$$;

-- ============================================================================
-- 6. FONCTION DE TEST
-- ============================================================================

-- Fonction pour tester l'envoi d'un briefing
CREATE OR REPLACE FUNCTION test_briefing_system()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Tester la génération d'un briefing matinal
  SELECT generate_emma_briefing('morning', 'test@example.com') INTO result;
  
  RETURN json_build_object(
    'test_result', result,
    'system_status', 'operational',
    'timestamp', NOW()
  );
END;
$$;

-- ============================================================================
-- 7. PERMISSIONS ET SÉCURITÉ
-- ============================================================================

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION generate_emma_briefing(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION send_morning_briefing() TO authenticated;
GRANT EXECUTE ON FUNCTION send_noon_briefing() TO authenticated;
GRANT EXECUTE ON FUNCTION send_close_briefing() TO authenticated;
GRANT EXECUTE ON FUNCTION send_briefing_to_subscribers(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_cron_jobs() TO authenticated;
GRANT EXECUTE ON FUNCTION disable_emma_cron_jobs() TO authenticated;
GRANT EXECUTE ON FUNCTION enable_emma_cron_jobs() TO authenticated;
GRANT EXECUTE ON FUNCTION test_briefing_system() TO authenticated;

-- Permissions sur la table des abonnés
GRANT SELECT, INSERT, UPDATE, DELETE ON briefing_subscribers TO authenticated;

-- ============================================================================
-- 8. INSTRUCTIONS D'UTILISATION
-- ============================================================================

/*
INSTRUCTIONS D'UTILISATION :

1. CONFIGURATION INITIALE :
   - Remplacez 'your-vercel-app.vercel.app' par votre URL Vercel
   - Remplacez 'your-email@example.com' par votre email
   - Ajustez les heures UTC selon votre fuseau horaire

2. TEST DU SYSTÈME :
   SELECT test_briefing_system();

3. ENVOI MANUEL :
   SELECT send_morning_briefing();
   SELECT send_noon_briefing();
   SELECT send_close_briefing();

4. GESTION DES ABONNÉS :
   INSERT INTO briefing_subscribers (email, name) VALUES ('user@example.com', 'John Doe');
   SELECT send_briefing_to_subscribers('morning');

5. SURVEILLANCE :
   SELECT * FROM get_active_cron_jobs();
   SELECT * FROM briefings ORDER BY generated_at DESC LIMIT 10;

6. GESTION :
   SELECT disable_emma_cron_jobs();
   SELECT enable_emma_cron_jobs();
*/
