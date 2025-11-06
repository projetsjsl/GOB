# 🚀 Instructions de Mise en Place - Système d'Authentification GOB

## ✅ Fichiers Créés

Voici tous les fichiers qui ont été créés pour le système d'authentification multi-utilisateurs:

### 📄 Frontend
- ✅ `public/login.html` - Page de connexion avec formulaire
- ✅ `public/js/auth-guard.js` - Protection automatique du dashboard
- ✅ `public/js/emma-multi-user.js` - Gestion des conversations Emma avec permissions

### 🔧 Backend
- ✅ `api/auth.js` - API d'authentification (login, validation)
- ✅ `api/supabase-conversation.js` - API de gestion des conversations avec permissions

### 🗄️ Base de Données
- ✅ `supabase-auth-setup.sql` - Script SQL pour créer tables et permissions

### 📚 Documentation
- ✅ `docs/AUTHENTICATION_SYSTEM.md` - Documentation complète du système

### 🔄 Modifications
- ✅ `public/beta-combined-dashboard.html` - Ajout du script auth-guard.js

---

## 🎯 Prochaines Étapes (À FAIRE)

### ÉTAPE 1: Configuration Supabase (5 min)

1. **Ouvrez Supabase:**
   - Allez sur https://supabase.com/dashboard
   - Sélectionnez votre projet GOB

2. **Exécutez le SQL:**
   ```bash
   # Dans votre terminal local
   cat supabase-auth-setup.sql
   ```

3. **Copiez et exécutez dans Supabase:**
   - Cliquez sur **SQL Editor** dans le menu
   - Créez une nouvelle query
   - Collez tout le contenu de `supabase-auth-setup.sql`
   - Cliquez **RUN**

4. **Vérifiez la création:**
   - Allez dans **Table Editor**
   - Vous devriez voir:
     - ✅ Table `users`
     - ✅ Table `conversation_history`

---

### ÉTAPE 2: Vérifier Variables Environnement (2 min)

1. **Allez sur Vercel:**
   - https://vercel.com/dashboard
   - Sélectionnez votre projet

2. **Vérifiez les variables:**
   - Settings → Environment Variables
   - Vérifiez que vous avez:
     - ✅ `SUPABASE_URL`
     - ✅ `SUPABASE_KEY`

3. **Si manquantes, ajoutez-les:**
   ```
   SUPABASE_URL=https://votre-projet.supabase.co
   SUPABASE_KEY=votre-anon-key
   ```

---

### ÉTAPE 3: Commit et Push (3 min)

```bash
# Depuis le répertoire GOB
cd /home/user/GOB

# Voir les fichiers modifiés
git status

# Ajouter tous les nouveaux fichiers
git add .

# Commit avec message descriptif
git commit -m "🔐 feat: Add multi-user authentication system with 5 roles

- Add login page (login.html) with form validation
- Add auth API (/api/auth.js) with user/password validation
- Add conversation API (/api/supabase-conversation.js) with permissions
- Add auth-guard.js for automatic dashboard protection
- Add emma-multi-user.js for Emma conversations with role-based permissions
- Add Supabase SQL setup script with users and conversation_history tables
- Modify dashboard to include auth protection

Roles: Invité, Client, Daniel, GOB, Admin
Permissions: View-only for Invité/Client, History for Daniel/GOB, Full access for Admin

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push vers GitHub (déploiement automatique Vercel)
git push origin claude/analyze-finance-chatbots-011CUYYtjF67gKbXj9qQjnvU
```

---

### ÉTAPE 4: Test du Système (10 min)

#### Test 1: Redirection Automatique
1. Attendez que Vercel déploie (1-2 min)
2. Visitez: `https://gobapps.com/beta-combined-dashboard.html`
3. ✅ Vous devez être redirigé vers `/login.html`

#### Test 2: Login Invité (Lecture Seule)
1. Sur la page de login, entrez:
   - Username: `invite`
   - Password: `invite`
2. Cliquez **Se connecter**
3. ✅ Vous devez arriver sur le dashboard
4. ✅ En haut à droite: Badge "👤 Invité"
5. Allez dans Emma:
   - ✅ Posez une question
   - ✅ Vous devez voir une notice jaune "Mode lecture seule"
   - ✅ Pas de bouton "Historique"

#### Test 3: Login Daniel (Avec Historique)
1. Cliquez **Déconnexion** (en haut à droite)
2. Reconnectez-vous:
   - Username: `daniel`
   - Password: `daniel`
3. ✅ Badge "👨‍💼 Daniel"
4. Allez dans Emma:
   - ✅ Pas de notice jaune
   - ✅ Bouton "Historique" présent
   - ✅ Posez une question
5. Rafraîchissez la page (F5)
   - ✅ Vous restez connecté
   - ✅ L'historique Emma se recharge

#### Test 4: Login Admin (Vue Globale)
1. Déconnectez-vous
2. Reconnectez-vous:
   - Username: `admin`
   - Password: `admin`
3. ✅ Badge "⚙️ Admin"
4. ✅ En bas à droite: Badge violet "🔓 Mode Admin"
5. Allez dans Emma:
   - ✅ Bouton spécial "Voir tous les historiques"
   - Cliquez dessus
   - ✅ Modal avec toutes les conversations de tous les users

#### Test 5: Persistance Session
1. Restez connecté (n'importe quel user)
2. Fermez le navigateur complètement
3. Rouvrez le navigateur
4. Visitez `https://gobapps.com/beta-combined-dashboard.html`
5. ❌ Vous êtes déconnecté (normal - sessionStorage)
6. ✅ Redirection vers login

---

## 🔧 Configuration Avancée (Optionnel)

### Modifier les Mots de Passe

Par défaut, mot de passe = username. Pour changer:

**Éditez `api/auth.js` ligne 72-76:**

```javascript
// AVANT:
if (password.toLowerCase().trim() !== normalizedUsername) {
  return res.status(401).json({ error: 'Mot de passe incorrect' });
}

// APRÈS:
const PASSWORD_MAP = {
  'invite': 'invite',
  'client': 'client',
  'daniel': 'VotreMotDePasseSecure123!',
  'gob': 'GOB#Secure2025',
  'admin': 'Admin@SuperSecret99'
};

if (password !== PASSWORD_MAP[normalizedUsername]) {
  return res.status(401).json({ error: 'Mot de passe incorrect' });
}
```

Puis commit et push.

### Ajouter un Nouvel Utilisateur

**Éditez `api/auth.js` ligne 18-50:**

```javascript
const USER_ROLES = {
  // ... existing roles
  jacques: {
    display_name: 'Jacques',
    permissions: {
      view_dashboard: true,
      view_emma: true,
      save_conversations: true,
      view_own_history: true,
      view_all_history: false
    }
  }
};
```

L'utilisateur sera créé automatiquement au premier login.

---

## 📊 Vérification Supabase

### Voir les Utilisateurs Créés

Dans Supabase SQL Editor:

```sql
SELECT username, display_name, role, last_login
FROM users
ORDER BY last_login DESC;
```

### Voir les Conversations

```sql
SELECT
  user_id,
  session_id,
  jsonb_array_length(messages) as message_count,
  created_at,
  updated_at
FROM conversation_history
ORDER BY updated_at DESC
LIMIT 10;
```

### Voir le Contenu d'une Conversation

```sql
SELECT
  user_id,
  messages
FROM conversation_history
WHERE user_id = 'daniel'
ORDER BY updated_at DESC
LIMIT 1;
```

---

## 🐛 Problèmes Courants

### Problème 1: "Configuration manquante"
**Erreur:** `GEMINI_API_KEY non configurée` ou similaire

**Solution:**
- Vérifiez les variables d'environnement Vercel
- Redéployez après avoir ajouté les variables

### Problème 2: "Session invalide"
**Erreur:** Boucle de redirection login → dashboard → login

**Solution:**
```javascript
// Ouvrez Console (F12) et vérifiez:
console.log(sessionStorage.getItem('gob-user'));

// Si null, problème de login API
// Vérifiez les logs Vercel
```

### Problème 3: Emma ne sauvegarde pas
**Erreur:** Conversations pas sauvegardées malgré login daniel/gob

**Solution:**
1. Vérifiez permissions:
```javascript
console.log(window.GOB_AUTH);
```

2. Vérifiez table Supabase:
```sql
SELECT * FROM conversation_history;
```

3. Si vide, problème API → Vérifiez logs Vercel

---

## 📚 Documentation Complète

Pour plus de détails, consultez:
- **`docs/AUTHENTICATION_SYSTEM.md`** - Documentation complète
- **`CLAUDE.md`** - Architecture globale GOB
- **`docs/api/DOCUMENTATION_APIs.md`** - APIs

---

## ✅ Checklist Finale

Avant de considérer le système comme opérationnel:

- [ ] SQL Supabase exécuté avec succès
- [ ] Variables d'environnement Vercel vérifiées
- [ ] Code committé et pushé
- [ ] Déploiement Vercel réussi
- [ ] Test login pour les 5 rôles
- [ ] Test sauvegarde conversations (daniel/gob/admin)
- [ ] Test vue admin (admin seulement)
- [ ] Test déconnexion/reconnexion
- [ ] Documentation lue et comprise

---

## 🆘 Besoin d'Aide?

Si vous rencontrez des problèmes:

1. **Vérifiez les logs:**
   ```bash
   # Logs Vercel (temps réel)
   vercel logs --follow

   # Logs Supabase
   # Dashboard → Logs → API Logs
   ```

2. **Console navigateur:**
   - F12 → Console
   - Cherchez erreurs en rouge

3. **Contactez-moi:**
   - Décrivez le problème
   - Partagez les logs
   - Screenshots si besoin

---

**Créé le:** 2025-01-28
**Par:** Claude Code
**Pour:** Daniel @ GOB

Bon déploiement! 🚀
