-- ============================================
-- FIX: conversation_history Foreign Key
-- ============================================
--
-- Problème: conversation_history.user_id pointe vers 'users'
-- mais le système multicanal utilise 'user_profiles'
--
-- Solution: Modifier la foreign key pour pointer vers user_profiles
--
-- IMPORTANT: Exécuter ce script dans le SQL Editor de Supabase
--
-- ============================================

-- Étape 1: Supprimer l'ancienne contrainte foreign key (si elle existe)
DO $$
BEGIN
  -- Vérifier et supprimer conversation_history_user_id_fkey
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'conversation_history_user_id_fkey'
    AND table_name = 'conversation_history'
  ) THEN
    ALTER TABLE conversation_history
    DROP CONSTRAINT conversation_history_user_id_fkey;

    RAISE NOTICE 'Contrainte conversation_history_user_id_fkey supprimée';
  ELSE
    RAISE NOTICE 'Contrainte conversation_history_user_id_fkey n''existe pas';
  END IF;
END $$;

-- Étape 2: Modifier le type de la colonne user_id en UUID (si nécessaire)
DO $$
BEGIN
  -- Vérifier le type actuel de user_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversation_history'
    AND column_name = 'user_id'
    AND data_type = 'text'
  ) THEN
    -- Convertir TEXT vers UUID
    -- ATTENTION: Cela échouera s'il y a des données non-UUID dans user_id
    -- Dans ce cas, il faut d'abord nettoyer les données
    ALTER TABLE conversation_history
    ALTER COLUMN user_id TYPE UUID USING user_id::uuid;

    RAISE NOTICE 'Colonne user_id convertie en UUID';
  ELSE
    RAISE NOTICE 'Colonne user_id est déjà UUID ou n''existe pas';
  END IF;
END $$;

-- Étape 3: Ajouter la nouvelle contrainte foreign key vers user_profiles
DO $$
BEGIN
  -- Vérifier que la table user_profiles existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'user_profiles'
  ) THEN
    -- Ajouter la contrainte
    ALTER TABLE conversation_history
    ADD CONSTRAINT conversation_history_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES user_profiles(id)
    ON DELETE CASCADE;

    RAISE NOTICE 'Nouvelle contrainte ajoutée: user_id -> user_profiles(id)';
  ELSE
    RAISE EXCEPTION 'Table user_profiles n''existe pas. Exécuter d''abord supabase-multichannel-setup.sql';
  END IF;
END $$;

-- Étape 4: Vérifier que la contrainte est correcte
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'conversation_history'
  AND kcu.column_name = 'user_id';

-- ============================================
-- RÉSULTAT ATTENDU:
-- ============================================
--
-- conversation_history_user_id_fkey | conversation_history | user_id | user_profiles | id
--
-- ✅ Si vous voyez cette ligne, la contrainte est correcte!
-- ❌ Si vous voyez "users" dans foreign_table_name, réexécutez le script
--
-- ============================================

-- NOTE IMPORTANTE:
-- Si vous avez des conversations existantes avec des user_id TEXT
-- qui ne sont pas des UUID, vous devez d'abord les nettoyer:
--
-- DELETE FROM conversation_history WHERE user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
--
-- Ou convertir les anciens user_id en cherchant le user_profile correspondant
