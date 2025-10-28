# 🔐 Système d'Authentification Multi-Utilisateurs GOB

## Vue d'Ensemble

Le système d'authentification GOB permet de gérer plusieurs utilisateurs avec différents niveaux de permissions pour Emma IA™ et le dashboard financier.

---

## 📋 Utilisateurs et Rôles

### 1. **Invité** (invite)
- **Accès:** Dashboard complet + Emma en lecture seule
- **Permissions Emma:**
  - ✅ Poser des questions
  - ❌ Pas de sauvegarde des conversations
  - ❌ Pas d'historique
- **Usage:** Démos, visiteurs temporaires

### 2. **Client** (client)
- **Accès:** Dashboard complet + Emma en lecture seule
- **Permissions Emma:**
  - ✅ Poser des questions
  - ❌ Pas de sauvegarde des conversations
  - ❌ Pas d'historique
- **Usage:** Clients externes, présentations

### 3. **Daniel** (daniel)
- **Accès:** Dashboard complet + Emma avec historique
- **Permissions Emma:**
  - ✅ Poser des questions
  - ✅ Sauvegarde automatique des conversations
  - ✅ Accès à son propre historique
  - ❌ Ne peut pas voir les historiques des autres
- **Usage:** Utilisateur principal

### 4. **GOB** (gob)
- **Accès:** Dashboard complet + Emma avec historique
- **Permissions Emma:**
  - ✅ Poser des questions
  - ✅ Sauvegarde automatique des conversations
  - ✅ Accès à son propre historique
  - ❌ Ne peut pas voir les historiques des autres
- **Usage:** Équipe GOB

### 5. **Admin** (admin)
- **Accès:** Accès total + vue globale
- **Permissions Emma:**
  - ✅ Poser des questions
  - ✅ Sauvegarde automatique des conversations
  - ✅ Accès à son propre historique
  - ✅ **Voir tous les historiques de tous les utilisateurs**
- **Usage:** Administration, audit, support

---

## 🚀 Installation

### Étape 1: Configuration Supabase

1. Ouvrez le **SQL Editor** dans votre dashboard Supabase
2. Exécutez le script `supabase-auth-setup.sql`:

```bash
# Dans votre projet GOB
cat supabase-auth-setup.sql
```

3. Copiez et exécutez le SQL dans Supabase
4. Vérifiez que les tables sont créées:
   - `users`
   - `conversation_history`

### Étape 2: Vérifier les Variables d'Environnement

Dans **Vercel**, vérifiez que ces variables existent:

```bash
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_KEY=votre-anon-key
```

### Étape 3: Déploiement

```bash
# Commit et push
git add .
git commit -m "feat: Add multi-user authentication system"
git push origin main
```

Le déploiement sur Vercel se fera automatiquement.

---

## 🔑 Connexion

### Accès à la Plateforme

1. Visitez: `https://votre-app.vercel.app/`
2. Vous serez automatiquement redirigé vers `/login.html`
3. Entrez vos credentials:

**Credentials actuels:**
- **Invité:** username: `invite` / password: `invite`
- **Client:** username: `client` / password: `client`
- **Daniel:** username: `daniel` / password: `daniel`
- **GOB:** username: `gob` / password: `gob`
- **Admin:** username: `admin` / password: `admin`

> ⚠️ **Sécurité:** Les mots de passe sont égaux aux usernames pour simplicité. Pour production, modifiez `/api/auth.js` ligne 72-76 pour implémenter des mots de passe hashés.

### Déconnexion

- Cliquez sur le bouton **"Déconnexion"** en haut à droite
- Ou fermez simplement le navigateur (session automatique)

---

## 💬 Utilisation d'Emma avec Authentification

### Pour Invité / Client (Lecture Seule)

1. Connectez-vous avec vos credentials
2. Accédez à Emma dans le dashboard
3. Posez vos questions normalement
4. ⚠️ **Vos conversations NE sont PAS sauvegardées**
5. À chaque refresh, l'historique est perdu

**Notice affichée:**
> 📝 Mode lecture seule - Vos conversations ne sont pas sauvegardées

### Pour Daniel / GOB (Avec Historique)

1. Connectez-vous avec vos credentials
2. Accédez à Emma dans le dashboard
3. Vos conversations sont **automatiquement sauvegardées**
4. En revenant plus tard, votre dernier historique se charge
5. Bouton **"Nouvelle conversation"** pour démarrer une nouvelle session
6. Bouton **"Historique"** pour voir vos conversations passées

### Pour Admin (Vue Globale)

1. Connectez-vous avec credentials admin
2. Toutes les fonctionnalités de Daniel/GOB **+**
3. Bouton spécial: **"Voir tous les historiques"**
4. Modal affichant:
   - Tous les utilisateurs
   - Leurs conversations
   - Dates et timestamps
   - Nombre de messages

**Badge affiché:**
> 🔓 Mode Admin

---

## 🏗️ Architecture Technique

### Fichiers Créés

```
GOB/
├── public/
│   ├── login.html                    # Page de connexion
│   └── js/
│       ├── auth-guard.js             # Protection du dashboard
│       └── emma-multi-user.js        # Gestion conversations Emma
├── api/
│   ├── auth.js                       # API d'authentification
│   └── supabase-conversation.js      # API conversations avec permissions
├── supabase-auth-setup.sql           # Script SQL Supabase
└── docs/
    └── AUTHENTICATION_SYSTEM.md      # Cette documentation
```

### Flow d'Authentification

```
1. Utilisateur accède à /beta-combined-dashboard.html
   ↓
2. auth-guard.js vérifie sessionStorage['gob-user']
   ↓
3. Si absent → Redirect vers /login.html
   ↓
4. Utilisateur entre credentials
   ↓
5. POST /api/auth (action: login)
   ↓
6. Validation username/password
   ↓
7. Création/Update user dans Supabase
   ↓
8. Retour des permissions
   ↓
9. Stockage dans sessionStorage
   ↓
10. Redirect vers dashboard
   ↓
11. auth-guard.js charge les permissions
   ↓
12. emma-multi-user.js s'initialise selon permissions
```

### Base de Données (Supabase)

**Table `users`:**
```sql
- id (UUID)
- username (TEXT, UNIQUE)
- display_name (TEXT)
- role (TEXT) -- invite, client, daniel, gob, admin
- created_at (TIMESTAMP)
- last_login (TIMESTAMP)
```

**Table `conversation_history`:**
```sql
- id (UUID)
- user_id (TEXT, FK → users.username)
- session_id (UUID)
- messages (JSONB)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Permissions Matrix

| Fonctionnalité | Invité | Client | Daniel | GOB | Admin |
|----------------|--------|--------|--------|-----|-------|
| Accès Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Poser questions Emma | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sauvegarder conversations | ❌ | ❌ | ✅ | ✅ | ✅ |
| Voir son historique | ❌ | ❌ | ✅ | ✅ | ✅ |
| Voir tous les historiques | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🔧 Personnalisation

### Ajouter un Nouvel Utilisateur

**Méthode 1: Auto-création au premier login**
1. Ajoutez le rôle dans `/api/auth.js` ligne 18-50:

```javascript
const USER_ROLES = {
  // ... existing roles
  nouveauuser: {
    display_name: 'Nouveau Utilisateur',
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

2. L'utilisateur sera créé automatiquement au premier login

**Méthode 2: SQL Supabase**
```sql
INSERT INTO users (username, display_name, role)
VALUES ('nouveauuser', 'Nouveau Utilisateur', 'nouveauuser');
```

### Changer les Mots de Passe

**Option 1: Mots de passe custom**

Modifiez `/api/auth.js` ligne 72-76:

```javascript
// Remplacer:
if (password.toLowerCase().trim() !== normalizedUsername) {

// Par un système de hash (exemple avec bcrypt):
const bcrypt = require('bcrypt');
const hashedPassword = await bcrypt.hash(password, 10);
// Stocker dans Supabase et comparer
```

**Option 2: Mapping manuel**

```javascript
const PASSWORD_MAP = {
  'invite': 'password123',
  'client': 'client2024',
  'daniel': 'secretDan!',
  'gob': 'GOB#2025',
  'admin': 'Admin@Secure99'
};

if (password !== PASSWORD_MAP[normalizedUsername]) {
  return res.status(401).json({ error: 'Mot de passe incorrect' });
}
```

### Modifier les Permissions d'un Rôle

Éditez `/api/auth.js` ligne 18-50:

```javascript
daniel: {
  display_name: 'Daniel',
  permissions: {
    view_dashboard: true,
    view_emma: true,
    save_conversations: true,
    view_own_history: true,
    view_all_history: false, // Changer à true pour admin rights
    export_data: true,       // Nouvelle permission custom
    manage_portfolio: true   // Nouvelle permission custom
  }
}
```

---

## 🐛 Dépannage

### Problème: Redirect Loop (login → dashboard → login)

**Cause:** sessionStorage pas sauvegardé ou auth-guard.js pas chargé

**Solution:**
```javascript
// Vérifier dans Console (F12):
console.log(sessionStorage.getItem('gob-user'));

// Si null, problème de login
// Si existe, vérifier que auth-guard.js est chargé
```

### Problème: Emma ne sauvegarde pas les conversations

**Cause:** Permissions incorrectes ou table Supabase manquante

**Solution:**
1. Vérifier dans Console:
```javascript
console.log(window.GOB_AUTH);
// Doit afficher: { permissions: { save_conversations: true } }
```

2. Vérifier Supabase:
```sql
SELECT * FROM conversation_history WHERE user_id = 'daniel';
```

### Problème: "Session invalide" après login

**Cause:** API /api/auth retourne erreur

**Solution:**
```bash
# Vérifier les logs Vercel
vercel logs --follow

# Chercher erreurs dans /api/auth
```

### Problème: Admin ne voit pas tous les historiques

**Cause:** Permissions RLS Supabase trop restrictives

**Solution:**
```sql
-- Désactiver temporairement RLS pour debug
ALTER TABLE conversation_history DISABLE ROW LEVEL SECURITY;

-- Tester
SELECT * FROM conversation_history;

-- Réactiver avec nouvelle policy
ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;
```

---

## 🔒 Sécurité

### Points de Sécurité Actuels

✅ **Implémentés:**
- Session-based auth (sessionStorage)
- Validation serveur des permissions
- RLS Supabase (Row Level Security)
- CORS configuré
- Pas de credentials en frontend

⚠️ **À Améliorer pour Production:**

1. **Mots de passe hashés:**
```bash
npm install bcrypt
```

2. **JWT Tokens:**
```javascript
// Remplacer sessionStorage par JWT
const jwt = require('jsonwebtoken');
const token = jwt.sign({ username, role }, process.env.JWT_SECRET);
```

3. **HTTPS Only:**
```javascript
// Cookies avec httpOnly flag
res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Secure; SameSite=Strict`);
```

4. **Rate Limiting:**
```javascript
// Limiter tentatives de login
const rateLimit = require('express-rate-limit');
```

5. **Audit Log:**
```sql
CREATE TABLE auth_logs (
  user_id TEXT,
  action TEXT,
  timestamp TIMESTAMPTZ,
  ip_address TEXT
);
```

---

## 📊 Monitoring

### Statistiques d'Utilisation

```sql
-- Nombre de conversations par utilisateur
SELECT
  user_id,
  COUNT(*) as total_conversations,
  MAX(updated_at) as last_activity
FROM conversation_history
GROUP BY user_id
ORDER BY total_conversations DESC;

-- Utilisateurs actifs
SELECT
  username,
  role,
  last_login
FROM users
WHERE last_login > NOW() - INTERVAL '7 days'
ORDER BY last_login DESC;

-- Messages par jour
SELECT
  DATE(created_at) as date,
  COUNT(*) as conversations,
  SUM(jsonb_array_length(messages)) as total_messages
FROM conversation_history
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 🆘 Support

Pour toute question ou problème:

1. **Vérifier les logs:**
   - Console navigateur (F12)
   - Logs Vercel: `vercel logs`
   - SQL Supabase

2. **Contacter:**
   - Email: support@gob.com
   - Slack: #gob-tech-support

3. **Documentation:**
   - Claude.md (général)
   - AUTHENTICATION_SYSTEM.md (ce fichier)
   - DOCUMENTATION_APIs.md (APIs)

---

**Dernière mise à jour:** 2025-01-28
**Version:** 1.0.0
**Auteur:** Claude Code + Daniel
