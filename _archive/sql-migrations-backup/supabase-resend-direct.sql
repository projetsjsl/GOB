-- ============================================================================
-- Supabase + Resend Direct - Version Simplifiée
-- Automatisation des briefings Emma En Direct avec Resend
-- ============================================================================

-- ============================================================================
-- 1. FONCTION PRINCIPALE AVEC RESEND DIRECT
-- ============================================================================

CREATE OR REPLACE FUNCTION send_emma_briefing_direct(
  briefing_type TEXT,
  target_email TEXT,
  resend_api_key TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  briefing_content TEXT;
  email_response JSON;
  briefing_id UUID;
BEGIN
  -- Log du début
  RAISE LOG 'Starting direct Emma briefing: % to %', briefing_type, target_email;
  
  -- 1. Générer le contenu du briefing via notre API
  SELECT content INTO briefing_content
  FROM http((
    'POST',
    'https://your-vercel-app.vercel.app/api/ai-services',
    ARRAY[
      http_header('Content-Type', 'application/json'),
      http_header('Authorization', 'Bearer ' || resend_api_key)
    ],
    'application/json',
    json_build_object(
      'service', 'openai',
      'type', briefing_type,
      'message', 'Generate ' || briefing_type || ' briefing for email'
    )::text
  ));
  
  -- 2. Sauvegarder le briefing
  INSERT INTO briefings (
    type,
    content,
    status,
    generated_at,
    target_email
  ) VALUES (
    briefing_type,
    briefing_content,
    'generated',
    NOW(),
    target_email
  ) RETURNING id INTO briefing_id;
  
  -- 3. Envoyer directement via Resend
  SELECT content INTO email_response
  FROM http((
    'POST',
    'https://api.resend.com/emails',
    ARRAY[
      http_header('Content-Type', 'application/json'),
      http_header('Authorization', 'Bearer ' || resend_api_key)
    ],
    'application/json',
    json_build_object(
      'from', 'Emma En Direct <noreply@yourdomain.com>',
      'to', ARRAY[target_email],
      'subject', 'Emma En Direct · ' || INITCAP(briefing_type) || ' - ' || TO_CHAR(NOW(), 'DD/MM/YYYY'),
      'html', briefing_content,
      'tags', ARRAY[
        json_build_object('name', 'type', 'value', briefing_type),
        json_build_object('name', 'briefing_id', 'value', briefing_id::text)
      ]
    )::text
  ));
  
  -- 4. Mettre à jour le statut
  UPDATE briefings 
  SET status = 'sent', 
      sent_at = NOW(),
      email_response = email_response
  WHERE id = briefing_id;
  
  -- 5. Retourner le résultat
  SELECT json_build_object(
    'success', true,
    'briefing_id', briefing_id,
    'type', briefing_type,
    'email', target_email,
    'sent_at', NOW(),
    'resend_response', email_response
  ) INTO result;
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  -- Log de l'erreur
  RAISE LOG 'Error sending direct briefing: %', SQLERRM;
  
  -- Mettre à jour le statut en cas d'erreur
  IF briefing_id IS NOT NULL THEN
    UPDATE briefings 
    SET status = 'failed', 
        error_message = SQLERRM
    WHERE id = briefing_id;
  END IF;
  
  -- Retourner l'erreur
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'type', briefing_type,
    'email', target_email,
    'timestamp', NOW()
  );
END;
$$;

-- ============================================================================
-- 2. FONCTIONS SPÉCIALISÉES AVEC CONFIGURATION
-- ============================================================================

-- Configuration des emails et clés API
CREATE TABLE IF NOT EXISTS briefing_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insérer la configuration par défaut
INSERT INTO briefing_config (config_key, config_value, description) VALUES
('resend_api_key', 'your-resend-api-key', 'Clé API Resend pour l''envoi d''emails'),
('from_email', 'Emma En Direct <noreply@yourdomain.com>', 'Email expéditeur'),
('default_recipient', 'your-email@example.com', 'Destinataire par défaut'),
('vercel_api_url', 'https://your-vercel-app.vercel.app', 'URL de l''API Vercel')
ON CONFLICT (config_key) DO NOTHING;

-- Fonction pour récupérer une configuration
CREATE OR REPLACE FUNCTION get_config(key TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT config_value FROM briefing_config WHERE config_key = key;
$$;

-- Briefing matinal avec configuration
CREATE OR REPLACE FUNCTION send_morning_briefing_direct()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  api_key TEXT;
  recipient TEXT;
BEGIN
  SELECT get_config('resend_api_key') INTO api_key;
  SELECT get_config('default_recipient') INTO recipient;
  
  RETURN send_emma_briefing_direct('morning', recipient, api_key);
END;
$$;

-- Briefing de midi avec configuration
CREATE OR REPLACE FUNCTION send_noon_briefing_direct()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  api_key TEXT;
  recipient TEXT;
BEGIN
  SELECT get_config('resend_api_key') INTO api_key;
  SELECT get_config('default_recipient') INTO recipient;
  
  RETURN send_emma_briefing_direct('noon', recipient, api_key);
END;
$$;

-- Briefing de clôture avec configuration
CREATE OR REPLACE FUNCTION send_close_briefing_direct()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  api_key TEXT;
  recipient TEXT;
BEGIN
  SELECT get_config('resend_api_key') INTO api_key;
  SELECT get_config('default_recipient') INTO recipient;
  
  RETURN send_emma_briefing_direct('close', recipient, api_key);
END;
$$;

-- ============================================================================
-- 3. CRON JOBS SIMPLIFIÉS
-- ============================================================================

-- Désactiver les anciens cron jobs
SELECT cron.unschedule('emma-morning-briefing');
SELECT cron.unschedule('emma-noon-briefing');
SELECT cron.unschedule('emma-close-briefing');

-- Nouveaux cron jobs avec Resend direct
SELECT cron.schedule(
  'emma-morning-direct',
  '0 13 * * 1-5', -- 8h00 EST
  'SELECT send_morning_briefing_direct();'
);

SELECT cron.schedule(
  'emma-noon-direct',
  '0 17 * * 1-5', -- 12h00 EST
  'SELECT send_noon_briefing_direct();'
);

SELECT cron.schedule(
  'emma-close-direct',
  '30 21 * * 1-5', -- 16h30 EST
  'SELECT send_close_briefing_direct();'
);

-- ============================================================================
-- 4. FONCTION DE GESTION DES ABONNÉS AVEC RESEND
-- ============================================================================

-- Fonction pour envoyer à tous les abonnés avec Resend
CREATE OR REPLACE FUNCTION send_briefing_to_all_subscribers(briefing_type TEXT)
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
  api_key TEXT;
BEGIN
  -- Récupérer la clé API
  SELECT get_config('resend_api_key') INTO api_key;
  
  -- Récupérer tous les abonnés actifs
  FOR subscriber IN 
    SELECT email, name, preferences
    FROM briefing_subscribers 
    WHERE active = true 
    AND (preferences->briefing_type)::boolean = true
  LOOP
    -- Envoyer le briefing
    SELECT send_emma_briefing_direct(briefing_type, subscriber.email, api_key) INTO result;
    
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
-- 5. FONCTIONS DE TEST ET MONITORING
-- ============================================================================

-- Test complet du système
CREATE OR REPLACE FUNCTION test_resend_system()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  test_result JSON;
  config_check JSON;
BEGIN
  -- Vérifier la configuration
  SELECT json_build_object(
    'resend_api_key', CASE WHEN get_config('resend_api_key') IS NOT NULL THEN 'configured' ELSE 'missing' END,
    'from_email', get_config('from_email'),
    'default_recipient', get_config('default_recipient'),
    'vercel_api_url', get_config('vercel_api_url')
  ) INTO config_check;
  
  -- Tester l'envoi d'un briefing
  SELECT send_morning_briefing_direct() INTO test_result;
  
  RETURN json_build_object(
    'config_check', config_check,
    'test_result', test_result,
    'system_status', 'operational',
    'timestamp', NOW()
  );
END;
$$;

-- Monitoring des envois
CREATE OR REPLACE FUNCTION get_briefing_stats(days INTEGER DEFAULT 7)
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'total_briefings', COUNT(*),
    'successful_sends', COUNT(*) FILTER (WHERE status = 'sent'),
    'failed_sends', COUNT(*) FILTER (WHERE status = 'failed'),
    'pending_sends', COUNT(*) FILTER (WHERE status = 'generated'),
    'by_type', json_object_agg(type, type_count),
    'last_7_days', COUNT(*) FILTER (WHERE generated_at >= NOW() - INTERVAL '7 days')
  )
  FROM (
    SELECT 
      type,
      status,
      generated_at,
      COUNT(*) as type_count
    FROM briefings 
    WHERE generated_at >= NOW() - (days || ' days')::INTERVAL
    GROUP BY type, status, generated_at
  ) stats;
$$;

-- ============================================================================
-- 6. PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION send_emma_briefing_direct(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION send_morning_briefing_direct() TO authenticated;
GRANT EXECUTE ON FUNCTION send_noon_briefing_direct() TO authenticated;
GRANT EXECUTE ON FUNCTION send_close_briefing_direct() TO authenticated;
GRANT EXECUTE ON FUNCTION send_briefing_to_all_subscribers(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION test_resend_system() TO authenticated;
GRANT EXECUTE ON FUNCTION get_briefing_stats(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_config(TEXT) TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON briefing_config TO authenticated;

-- ============================================================================
-- 7. INSTRUCTIONS D'UTILISATION
-- ============================================================================

/*
INSTRUCTIONS D'UTILISATION - VERSION RESEND DIRECT :

1. CONFIGURATION :
   UPDATE briefing_config SET config_value = 'your-resend-api-key' WHERE config_key = 'resend_api_key';
   UPDATE briefing_config SET config_value = 'your-email@example.com' WHERE config_key = 'default_recipient';
   UPDATE briefing_config SET config_value = 'https://your-vercel-app.vercel.app' WHERE config_key = 'vercel_api_url';

2. TEST DU SYSTÈME :
   SELECT test_resend_system();

3. ENVOI MANUEL :
   SELECT send_morning_briefing_direct();
   SELECT send_noon_briefing_direct();
   SELECT send_close_briefing_direct();

4. ENVOI À TOUS LES ABONNÉS :
   SELECT send_briefing_to_all_subscribers('morning');

5. MONITORING :
   SELECT get_briefing_stats(7);
   SELECT * FROM briefings ORDER BY generated_at DESC LIMIT 10;

6. GESTION DES ABONNÉS :
   INSERT INTO briefing_subscribers (email, name) VALUES ('user@example.com', 'John Doe');
   SELECT * FROM briefing_subscribers;

AVANTAGES DE CETTE VERSION :
- Plus simple et direct
- Moins de dépendances
- Meilleur contrôle sur Resend
- Monitoring intégré
- Configuration centralisée
*/
