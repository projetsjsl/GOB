# 🔧 Fix SMS: Contrainte Foreign Key

## 🔍 Problème Identifié

```
insert or update on table "conversation_history" violates foreign key constraint
"conversation_history_user_id_fkey"
Key (user_id)=(cc583758-a6d2-43d3-83bc-76aa636900b3) is not present in table "users"
```

### Explication

Le système a **deux architectures qui se chevauchent** :

1. **Ancien système** (auth):
   - Table `users` avec `username TEXT`
   - `conversation_history.user_id` → `users.username`

2. **Nouveau système** (multicanal):
   - Table `user_profiles` avec `id UUID`
   - Le code crée des profils dans `user_profiles` ✅
   - MAIS `conversation_history` pointe encore vers `users` ❌

**Résultat:** Quand Emma essaie de créer une conversation, la foreign key échoue car l'utilisateur est dans `user_profiles`, pas dans `users`.

---

## ✅ Solution: Exécuter le Script SQL de Correction

### Étape 1: Accéder à Supabase SQL Editor

1. Allez sur: https://app.supabase.com
2. Sélectionnez votre projet **GOB**
3. Cliquez sur **SQL Editor** dans la barre latérale gauche

---

### Étape 2: Exécuter le Script de Correction

1. **Ouvrez le fichier** `/supabase-fix-conversation-fkey.sql` dans votre repo
2. **Copiez TOUT le contenu** (Ctrl+A, Ctrl+C)
3. **Collez** dans le SQL Editor de Supabase
4. **Cliquez sur "Run"** (ou appuyez sur Ctrl+Enter)

**Le script va automatiquement:**
- ✅ Supprimer l'ancienne contrainte vers `users`
- ✅ Convertir `user_id` en UUID (si nécessaire)
- ✅ Créer une nouvelle contrainte vers `user_profiles`
- ✅ Vérifier que tout est correct

---

### Étape 3: Vérifier le Résultat

Après l'exécution, vous devriez voir un résultat comme:

```
✅ NOTICES:
Contrainte conversation_history_user_id_fkey supprimée
Colonne user_id convertie en UUID
Nouvelle contrainte ajoutée: user_id -> user_profiles(id)

✅ RÉSULTAT QUERY:
conversation_history_user_id_fkey | conversation_history | user_id | user_profiles | id
```

**Si vous voyez "user_profiles" dans la colonne `foreign_table_name`, c'est parfait !** ✅

---

### Étape 4: Tester l'Intégration SMS

Maintenant que la contrainte est corrigée, testez immédiatement:

**Envoyez un SMS à votre numéro Twilio:**
```
Test Emma
```

**Emma devrait maintenant répondre avec un message intelligent!** 🎉

---

## 🐛 Troubleshooting

### Erreur: "cannot cast type text to uuid"

**Cause:** Il y a des données dans `conversation_history` avec des `user_id` non-UUID (format TEXT).

**Solution:**

Option A - **Nettoyer les données** (supprime les anciennes conversations):
```sql
DELETE FROM conversation_history
WHERE user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
```

Option B - **Garder les données** (créer une nouvelle colonne):
```sql
-- Renommer l'ancienne colonne
ALTER TABLE conversation_history RENAME COLUMN user_id TO old_user_id;

-- Créer nouvelle colonne UUID
ALTER TABLE conversation_history ADD COLUMN user_id UUID;

-- Ajouter la contrainte
ALTER TABLE conversation_history
ADD CONSTRAINT conversation_history_user_id_fkey
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
```

Puis réexécutez le script principal.

---

### Erreur: "table user_profiles does not exist"

**Cause:** La table `user_profiles` n'a pas été créée.

**Solution:**
1. Exécutez d'abord `/supabase-multichannel-setup.sql`
2. Puis réexécutez `/supabase-fix-conversation-fkey.sql`

---

### Erreur: "constraint already exists"

**Cause:** La contrainte a déjà été modifiée.

**Solution:** Vérifiez que la contrainte pointe bien vers `user_profiles`:

```sql
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
```

**Résultat attendu:**
```
foreign_table_name: user_profiles  ✅
```

Si vous voyez `users`, supprimez manuellement la contrainte:
```sql
ALTER TABLE conversation_history DROP CONSTRAINT conversation_history_user_id_fkey;
```

Puis réexécutez le script.

---

## 📊 Checklist de Correction

Cochez au fur et à mesure:

```
☐ 1. Accédé à Supabase SQL Editor
☐ 2. Copié le contenu de supabase-fix-conversation-fkey.sql
☐ 3. Exécuté le script (Run)
☐ 4. Vérifié le résultat (foreign_table_name = user_profiles)
☐ 5. Testé SMS: "Test Emma"
☐ 6. Emma a répondu avec succès ✅
```

---

## 🎯 Résumé des Corrections Effectuées

| Problème | Commit | Status |
|----------|--------|--------|
| 1. Webhook Twilio non configuré | Initial | ✅ Résolu |
| 2. UUID invalide (session_id) | `b39d6cc` | ✅ Résolu |
| 3. Foreign key vers mauvaise table | `44934b5` | ⏳ En cours (exécuter SQL) |

---

## 🚀 Après Cette Correction

Une fois ce script exécuté, le système SMS devrait être **100% fonctionnel** :

- ✅ Twilio webhook configuré
- ✅ UUID valides générés
- ✅ Foreign key correcte
- ✅ Emma IA répond par SMS

---

**Exécutez le script maintenant et testez !** 🎉

**Questions ?** Partagez le résultat de l'exécution du script SQL si vous rencontrez des erreurs.
