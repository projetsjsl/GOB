-- ============================================================
-- SUPABASE GROUP CHAT SETUP - Chat Intégré avec Historique
-- À exécuter dans le SQL Editor de Supabase
-- ============================================================

-- Table des salons de chat intégrés
CREATE TABLE IF NOT EXISTS group_chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_name TEXT NOT NULL,
  room_code TEXT UNIQUE NOT NULL, -- Code unique pour rejoindre (ex: "GOB-TEAM-2025")
  admin_user_id TEXT NOT NULL,
  admin_display_name TEXT NOT NULL,
  system_prompt TEXT,
  welcome_message TEXT,
  temperature NUMERIC DEFAULT 0.7,
  max_messages INTEGER DEFAULT 500,
  allow_guests BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des messages du chat intégré
CREATE TABLE IF NOT EXISTS group_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES group_chat_rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_display_name TEXT NOT NULL,
  user_icon TEXT DEFAULT '🧠',
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}', -- Pour stocker usage tokens, model, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des participants actifs (pour voir qui est en ligne)
CREATE TABLE IF NOT EXISTS group_chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES group_chat_rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_display_name TEXT NOT NULL,
  user_icon TEXT DEFAULT '🧠',
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  is_online BOOLEAN DEFAULT true,
  UNIQUE(room_id, user_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_group_chat_messages_room ON group_chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_chat_messages_user ON group_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_group_chat_participants_room ON group_chat_participants(room_id, is_online);
CREATE INDEX IF NOT EXISTS idx_group_chat_rooms_code ON group_chat_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_group_chat_rooms_active ON group_chat_rooms(is_active, created_at DESC);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_group_chat_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour group_chat_rooms
DROP TRIGGER IF EXISTS update_group_chat_rooms_updated_at ON group_chat_rooms;
CREATE TRIGGER update_group_chat_rooms_updated_at
BEFORE UPDATE ON group_chat_rooms
FOR EACH ROW
EXECUTE FUNCTION update_group_chat_updated_at();

-- Fonction pour mettre à jour last_seen automatiquement
CREATE OR REPLACE FUNCTION update_participant_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour group_chat_participants
DROP TRIGGER IF EXISTS update_group_chat_participants_last_seen ON group_chat_participants;
CREATE TRIGGER update_group_chat_participants_last_seen
BEFORE UPDATE ON group_chat_participants
FOR EACH ROW
EXECUTE FUNCTION update_participant_last_seen();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Activer RLS sur les tables
ALTER TABLE group_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chat_participants ENABLE ROW LEVEL SECURITY;

-- Politique: Tous peuvent lire les salons actifs
CREATE POLICY "Anyone can read active rooms"
  ON group_chat_rooms FOR SELECT
  USING (is_active = true);

-- Politique: Tous peuvent lire les messages des salons actifs
CREATE POLICY "Anyone can read messages from active rooms"
  ON group_chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_chat_rooms
      WHERE group_chat_rooms.id = group_chat_messages.room_id
      AND group_chat_rooms.is_active = true
    )
  );

-- Politique: Tous peuvent insérer des messages dans les salons actifs
CREATE POLICY "Anyone can insert messages to active rooms"
  ON group_chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_chat_rooms
      WHERE group_chat_rooms.id = group_chat_messages.room_id
      AND group_chat_rooms.is_active = true
    )
  );

-- Politique: Tous peuvent gérer leur présence
CREATE POLICY "Anyone can manage their presence"
  ON group_chat_participants FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- FONCTIONS UTILES
-- ============================================================

-- Fonction pour générer un code de salon unique
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Générer un code: GOB-XXXX-YYYY (4 lettres + 4 chiffres)
    code := 'GOB-' || 
            upper(substring(md5(random()::text) from 1 for 4)) || '-' ||
            lpad(floor(random() * 10000)::text, 4, '0');
    
    -- Vérifier si le code existe déjà
    SELECT EXISTS(SELECT 1 FROM group_chat_rooms WHERE room_code = code) INTO exists_check;
    
    -- Si le code n'existe pas, on peut l'utiliser
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- COMMENTAIRES
-- ============================================================

COMMENT ON TABLE group_chat_rooms IS 'Salons de chat intégrés avec configuration';
COMMENT ON TABLE group_chat_messages IS 'Messages des chats intégrés avec historique complet';
COMMENT ON TABLE group_chat_participants IS 'Participants actifs pour voir qui est en ligne';

COMMENT ON COLUMN group_chat_rooms.room_code IS 'Code unique pour rejoindre le salon (ex: GOB-TEAM-2025)';
COMMENT ON COLUMN group_chat_messages.metadata IS 'Métadonnées JSON (usage tokens, model utilisé, etc.)';
COMMENT ON COLUMN group_chat_participants.last_seen IS 'Dernière activité du participant';

