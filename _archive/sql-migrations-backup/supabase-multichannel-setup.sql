-- ============================================
-- GOB MULTICANAL SETUP
-- Extension des tables pour support multi-canal
-- ============================================
--
-- Ce script ajoute les tables et colonnes nécessaires pour
-- permettre les communications multi-canal (SMS, Email, Messenger, Web)
--
-- IMPORTANT: Exécuter ce script dans le SQL Editor de Supabase
--
-- ============================================

-- ============================================
-- 1. TABLE: user_profiles
-- Profils utilisateurs unifiés multi-canal
-- ============================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  messenger_id TEXT UNIQUE,
  name TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide par canal
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_user_profiles_messenger ON user_profiles(messenger_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created ON user_profiles(created_at DESC);

-- Commentaires
COMMENT ON TABLE user_profiles IS 'Profils utilisateurs unifiés pour tous les canaux de communication';
COMMENT ON COLUMN user_profiles.email IS 'Email utilisateur (canal Email et Web)';
COMMENT ON COLUMN user_profiles.phone IS 'Numéro de téléphone (canal SMS)';
COMMENT ON COLUMN user_profiles.messenger_id IS 'Facebook Messenger ID (canal Messenger)';
COMMENT ON COLUMN user_profiles.metadata IS 'Métadonnées supplémentaires (préférences, historique, etc.)';

-- ============================================
-- 2. EXTENSIONS TABLE: conversation_history
-- Ajouter support multi-canal à la table existante
-- ============================================

-- Vérifier si la table conversation_history existe
DO $$
BEGIN
  -- Ajouter colonne channel si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversation_history' AND column_name = 'channel'
  ) THEN
    ALTER TABLE conversation_history ADD COLUMN channel TEXT;
    COMMENT ON COLUMN conversation_history.channel IS 'Canal de communication: web, email, sms, messenger';
  END IF;

  -- Ajouter colonne channel_identifier si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversation_history' AND column_name = 'channel_identifier'
  ) THEN
    ALTER TABLE conversation_history ADD COLUMN channel_identifier TEXT;
    COMMENT ON COLUMN conversation_history.channel_identifier IS 'Identifiant du canal (email, phone, messenger_id)';
  END IF;

  -- Ajouter colonne status si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversation_history' AND column_name = 'status'
  ) THEN
    ALTER TABLE conversation_history ADD COLUMN status TEXT DEFAULT 'active';
    COMMENT ON COLUMN conversation_history.status IS 'Statut de la conversation: active, closed, archived';
  END IF;

END $$;

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_conversation_history_channel ON conversation_history(channel);
CREATE INDEX IF NOT EXISTS idx_conversation_history_status ON conversation_history(status);
CREATE INDEX IF NOT EXISTS idx_conversation_history_user_channel ON conversation_history(user_id, channel);

-- ============================================
-- 3. TABLE: multichannel_messages (optionnel)
-- Alternative si on veut une table séparée
-- ============================================
-- Cette table est optionnelle - utiliser si on préfère
-- séparer les messages plutôt que les stocker en JSONB

CREATE TABLE IF NOT EXISTS multichannel_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversation_history(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  channel TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_multichannel_messages_conversation ON multichannel_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_multichannel_messages_channel ON multichannel_messages(channel);
CREATE INDEX IF NOT EXISTS idx_multichannel_messages_created ON multichannel_messages(created_at DESC);

-- Commentaires
COMMENT ON TABLE multichannel_messages IS 'Messages individuels multi-canal (alternative au JSONB)';
COMMENT ON COLUMN multichannel_messages.conversation_id IS 'ID de la conversation parente';
COMMENT ON COLUMN multichannel_messages.role IS 'Rôle: user, assistant, ou system';
COMMENT ON COLUMN multichannel_messages.content IS 'Contenu du message';
COMMENT ON COLUMN multichannel_messages.channel IS 'Canal utilisé pour ce message';
COMMENT ON COLUMN multichannel_messages.metadata IS 'Métadonnées (modèle LLM, outils utilisés, etc.)';

-- ============================================
-- 4. TABLE: channel_logs
-- Logs des événements par canal (debugging)
-- ============================================

CREATE TABLE IF NOT EXISTS channel_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL,
  event_type TEXT NOT NULL,
  user_profile_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversation_history(id) ON DELETE SET NULL,
  payload JSONB DEFAULT '{}',
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_channel_logs_channel ON channel_logs(channel);
CREATE INDEX IF NOT EXISTS idx_channel_logs_event_type ON channel_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_channel_logs_created ON channel_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_channel_logs_user ON channel_logs(user_profile_id);

-- Commentaires
COMMENT ON TABLE channel_logs IS 'Logs des événements multi-canal pour debugging';
COMMENT ON COLUMN channel_logs.event_type IS 'Type: message_received, message_sent, error, etc.';
COMMENT ON COLUMN channel_logs.payload IS 'Données brutes de l événement';

-- ============================================
-- 5. TABLE: channel_preferences
-- Préférences utilisateur par canal
-- ============================================

CREATE TABLE IF NOT EXISTS channel_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_profile_id, channel)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_channel_preferences_user ON channel_preferences(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_channel_preferences_channel ON channel_preferences(channel);

-- Commentaires
COMMENT ON TABLE channel_preferences IS 'Préférences utilisateur par canal de communication';
COMMENT ON COLUMN channel_preferences.enabled IS 'Si FALSE, le canal est désactivé pour cet utilisateur';
COMMENT ON COLUMN channel_preferences.notifications_enabled IS 'Activer/désactiver les notifications push';
COMMENT ON COLUMN channel_preferences.preferences IS 'Préférences spécifiques au canal (format, fréquence, etc.)';

-- ============================================
-- 6. FUNCTION: update_updated_at_column
-- Trigger automatique pour updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Appliquer le trigger sur channel_preferences
DROP TRIGGER IF EXISTS update_channel_preferences_updated_at ON channel_preferences;
CREATE TRIGGER update_channel_preferences_updated_at
  BEFORE UPDATE ON channel_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. ROW LEVEL SECURITY (RLS)
-- Sécurité des données
-- ============================================

-- Activer RLS sur les tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE multichannel_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_preferences ENABLE ROW LEVEL SECURITY;

-- Politique: Service role a accès complet
CREATE POLICY "Service role has full access on user_profiles"
  ON user_profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access on multichannel_messages"
  ON multichannel_messages FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access on channel_logs"
  ON channel_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access on channel_preferences"
  ON channel_preferences FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 8. DONNÉES DE TEST (optionnel)
-- ============================================

-- Insérer utilisateur de test
INSERT INTO user_profiles (email, phone, messenger_id, name, metadata)
VALUES
  ('test@gob.com', '+14385443662', 'messenger_test_123', 'Test User', '{"role": "test"}'::jsonb)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 9. VUES UTILES
-- ============================================

-- Vue: Statistiques par canal
CREATE OR REPLACE VIEW channel_statistics AS
SELECT
  channel,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) as total_conversations,
  COUNT(*) FILTER (WHERE status = 'active') as active_conversations,
  COUNT(*) FILTER (WHERE status = 'closed') as closed_conversations,
  MAX(updated_at) as last_activity
FROM conversation_history
WHERE channel IS NOT NULL
GROUP BY channel;

COMMENT ON VIEW channel_statistics IS 'Statistiques d utilisation par canal';

-- Vue: Activité récente multi-canal
CREATE OR REPLACE VIEW recent_multichannel_activity AS
SELECT
  ch.id,
  ch.user_id,
  up.name as user_name,
  up.email,
  ch.channel,
  ch.channel_identifier,
  ch.status,
  jsonb_array_length(ch.messages) as message_count,
  ch.created_at,
  ch.updated_at
FROM conversation_history ch
LEFT JOIN user_profiles up ON ch.user_id = up.id::text
WHERE ch.channel IS NOT NULL
ORDER BY ch.updated_at DESC
LIMIT 100;

COMMENT ON VIEW recent_multichannel_activity IS '100 conversations multi-canal les plus récentes';

-- ============================================
-- 10. FONCTION UTILITAIRE: Nettoyage logs anciens
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_old_channel_logs(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM channel_logs
  WHERE created_at < (NOW() - INTERVAL '1 day' * days_old);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_channel_logs IS 'Supprime les logs plus anciens que X jours';

-- ============================================
-- FIN DU SCRIPT
-- ============================================

-- Vérification finale
SELECT
  'user_profiles' as table_name,
  COUNT(*) as row_count
FROM user_profiles
UNION ALL
SELECT
  'conversation_history (with channel)',
  COUNT(*)
FROM conversation_history
WHERE channel IS NOT NULL
UNION ALL
SELECT
  'multichannel_messages',
  COUNT(*)
FROM multichannel_messages
UNION ALL
SELECT
  'channel_logs',
  COUNT(*)
FROM channel_logs;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ GOB Multicanal Setup - Installation complète !';
  RAISE NOTICE '📊 Tables créées: user_profiles, multichannel_messages, channel_logs, channel_preferences';
  RAISE NOTICE '🔧 Extensions appliquées: conversation_history (colonnes channel, channel_identifier, status)';
  RAISE NOTICE '🔒 Row Level Security: Activé sur toutes les tables';
  RAISE NOTICE '📈 Vues créées: channel_statistics, recent_multichannel_activity';
  RAISE NOTICE '';
  RAISE NOTICE 'Prochaines étapes:';
  RAISE NOTICE '1. Vérifier les variables d environnement Vercel (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)';
  RAISE NOTICE '2. Déployer les adaptateurs de canaux (/api/adapters/)';
  RAISE NOTICE '3. Configurer les webhooks (Twilio, ImprovMX, Messenger)';
  RAISE NOTICE '4. Tester avec /api/chat';
END $$;
