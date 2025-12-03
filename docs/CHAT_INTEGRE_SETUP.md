# Guide de Configuration - Chat Intégré avec Historique

**Date**: 2025-01-15  
**Fonctionnalité**: Chat intégré avec historique, contexte partagé et visibilité live

---

## 🎯 Vue d'Ensemble

Le chat intégré permet de créer un salon de chat directement dans le dashboard avec :
- ✅ Historique complet sauvegardé dans Supabase
- ✅ Contexte partagé (tous les messages visibles par tous)
- ✅ Visibilité en temps réel (qui est en ligne)
- ✅ Synchronisation automatique toutes les 2 secondes
- ✅ Réponses ChatGPT via API OpenAI

---

## 📋 Prérequis

### 1. Base de Données Supabase

**Exécuter le script SQL** dans Supabase SQL Editor :

```bash
# Fichier: supabase-group-chat-setup.sql
```

Ce script crée :
- `group_chat_rooms` - Salons de chat avec configuration
- `group_chat_messages` - Historique complet des messages
- `group_chat_participants` - Participants actifs (présence live)
- Fonction `generate_room_code()` pour codes uniques
- RLS (Row Level Security) activé

### 2. Variables d'Environnement Vercel

**Obligatoires** :
```bash
# Supabase
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# OpenAI (pour réponses ChatGPT)
OPENAI_API_KEY=sk-...
```

**Configuration dans Vercel** :
1. Aller dans **Settings** → **Environment Variables**
2. Ajouter les variables ci-dessus
3. Sélectionner : Production, Preview, Development
4. Redéployer

---

## 🚀 Utilisation

### Mode Partagé (ChatGPT Group Chat)

1. **Sélectionner** "Chat Partagé" dans le sélecteur de mode
2. **Configurer** le lien ChatGPT dans les paramètres
3. **Ouvrir** le salon dans un nouvel onglet via le bouton

**Avantages** :
- ✅ Gratuit
- ✅ Accès au chat de groupe ChatGPT partagé
- ✅ Pas de configuration supplémentaire

**Limitations** :
- ❌ Pas d'historique dans le dashboard
- ❌ Pas de visibilité live des participants
- ❌ Ouvre dans un nouvel onglet (pas intégré)

### Mode Intégré (Chat avec Historique)

1. **Sélectionner** "Chat Intégré" dans le sélecteur de mode
2. **Créer** un nouveau salon (automatique au premier clic)
3. **Partager** le code du salon avec l'équipe
4. **Chatter** directement dans le dashboard

**Avantages** :
- ✅ Historique complet sauvegardé
- ✅ Visibilité live des participants
- ✅ Contexte partagé (tous voient tous les messages)
- ✅ Intégré dans le dashboard
- ✅ Synchronisation automatique

**Limitations** :
- ⚠️ Nécessite `OPENAI_API_KEY` (coûts)
- ⚠️ Nécessite Supabase configuré

---

## 🔧 Configuration du Salon

### Paramètres Configurables

**À la création** (ne peuvent pas être modifiés après) :
- **Nom du salon** : Nom affiché du salon
- **Système (prompt)** : Instructions pour ChatGPT
- **Température** : Créativité des réponses (0-1)
- **Message d'accueil** : Message affiché à la création

**Paramètres par défaut** :
- Max messages : 500
- Autoriser invités : Oui
- Auto-join : Oui

### Code du Salon

Chaque salon reçoit un **code unique** (ex: `GOB-ABCD-1234`) :
- Généré automatiquement
- Utilisé pour identifier le salon
- Partageable avec l'équipe (tous peuvent rejoindre)

---

## 💬 Utilisation du Chat Intégré

### Envoyer un Message

1. **Taper** votre message dans la zone de saisie
2. **Appuyer** sur Enter ou cliquer sur "📤 Envoyer"
3. **Attendre** la réponse de ChatGPT (automatique)

### Voir les Participants

- **Liste** des participants en ligne dans la colonne de droite
- **Icônes** personnalisables par utilisateur
- **Mise à jour** automatique toutes les 2 secondes

### Historique

- **Tous les messages** sont sauvegardés dans Supabase
- **Contexte complet** visible par tous les utilisateurs
- **Chronologie** avec timestamps

---

## 🔄 Synchronisation Live

### Comment ça fonctionne

1. **Polling automatique** toutes les 2 secondes
2. **Rechargement** des messages et participants
3. **Mise à jour** de la présence utilisateur
4. **Nettoyage** automatique à la fermeture

### Performance

- **Polling** : 2 secondes (configurable)
- **Limite messages** : 100 derniers messages chargés
- **Présence** : Considérée "en ligne" si activité < 30 secondes

---

## 📊 Structure des Données

### Table `group_chat_rooms`

```sql
- id (UUID)
- room_name (TEXT)
- room_code (TEXT UNIQUE) -- Code partageable
- admin_user_id (TEXT)
- admin_display_name (TEXT)
- system_prompt (TEXT)
- welcome_message (TEXT)
- temperature (NUMERIC)
- max_messages (INTEGER)
- allow_guests (BOOLEAN)
- is_active (BOOLEAN)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### Table `group_chat_messages`

```sql
- id (UUID)
- room_id (UUID) -- Référence group_chat_rooms
- user_id (TEXT)
- user_display_name (TEXT)
- user_icon (TEXT)
- role (TEXT) -- 'user', 'assistant', 'system'
- content (TEXT)
- metadata (JSONB) -- Usage tokens, model, etc.
- created_at (TIMESTAMPTZ)
```

### Table `group_chat_participants`

```sql
- id (UUID)
- room_id (UUID)
- user_id (TEXT)
- user_display_name (TEXT)
- user_icon (TEXT)
- last_seen (TIMESTAMPTZ)
- is_online (BOOLEAN)
```

---

## 🔐 Sécurité

### Row Level Security (RLS)

- ✅ **Lecture** : Tous peuvent lire les salons actifs
- ✅ **Écriture** : Tous peuvent envoyer des messages
- ✅ **Présence** : Tous peuvent gérer leur présence

### Recommandations

1. **Limiter l'accès** aux salons sensibles (ajouter RLS custom)
2. **Valider** les messages côté serveur (longueur, contenu)
3. **Rate limiting** sur les APIs (à implémenter)
4. **Authentification** utilisateur (à ajouter si nécessaire)

---

## 🐛 Dépannage

### Le salon ne se crée pas

**Vérifier** :
1. ✅ Supabase configuré (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
2. ✅ Script SQL exécuté (`supabase-group-chat-setup.sql`)
3. ✅ Tables créées dans Supabase
4. ✅ Console navigateur pour erreurs

### Les messages ne s'affichent pas

**Vérifier** :
1. ✅ Polling actif (vérifier console)
2. ✅ API `/api/groupchat/integrated/get-messages` fonctionne
3. ✅ `roomId` correct
4. ✅ Messages dans Supabase (vérifier directement)

### Pas de réponse ChatGPT

**Vérifier** :
1. ✅ `OPENAI_API_KEY` configurée dans Vercel
2. ✅ Clé API valide et crédits disponibles
3. ✅ Logs API pour erreurs OpenAI
4. ✅ Console navigateur pour erreurs

### Participants ne s'affichent pas

**Vérifier** :
1. ✅ Présence mise à jour (`update-presence` appelé)
2. ✅ `last_seen` < 30 secondes
3. ✅ API `/api/groupchat/integrated/get-participants` fonctionne

---

## 📈 Améliorations Futures

### Court Terme
- [ ] Réduire polling à 1 seconde pour plus de réactivité
- [ ] Ajouter indicateur "typing..." quand quelqu'un tape
- [ ] Notifications sonores pour nouveaux messages
- [ ] Scroll automatique vers dernier message

### Moyen Terme
- [ ] Supabase Realtime au lieu de polling (plus efficace)
- [ ] Authentification utilisateur
- [ ] Rate limiting sur APIs
- [ ] Export historique (JSON, CSV)

### Long Terme
- [ ] Recherche dans l'historique
- [ ] Réactions aux messages (👍, ❤️, etc.)
- [ ] Fichiers joints
- [ ] Mentions (@utilisateur)

---

## 📝 Notes Techniques

### Polling vs Realtime

**Actuel** : Polling toutes les 2 secondes
- ✅ Simple à implémenter
- ✅ Fonctionne partout
- ⚠️ Consomme plus de ressources

**Futur** : Supabase Realtime
- ✅ Plus efficace
- ✅ Instantané
- ⚠️ Nécessite WebSocket support

### Limites

- **Messages chargés** : 100 derniers (configurable)
- **Présence** : 30 secondes d'inactivité = hors ligne
- **Polling** : 2 secondes (configurable)

---

**Dernière mise à jour**: 2025-01-15  
**Version**: 1.0.0

