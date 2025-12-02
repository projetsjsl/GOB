# 🔐 Guide de Configuration des Rôles et Permissions

## Vue d'ensemble

Le système de gestion des rôles permet de contrôler l'accès aux différents composants du dashboard selon le rôle de chaque utilisateur. Tous les rôles et permissions sont stockés dans Supabase.

## 📋 Étapes de Configuration

### 1. Configuration Supabase (OBLIGATOIRE)

1. **Accédez à Supabase:**
   - Allez sur https://app.supabase.com
   - Sélectionnez votre projet GOB

2. **Exécutez le script SQL:**
   - Cliquez sur **SQL Editor** dans le menu
   - Créez une nouvelle query
   - Copiez tout le contenu du fichier `supabase-roles-permissions-setup.sql`
   - Collez-le dans l'éditeur SQL
   - Cliquez sur **RUN**

3. **Vérifiez la création:**
   - Allez dans **Table Editor**
   - Vous devriez voir:
     - ✅ Table `user_roles`
     - ✅ Table `user_role_mapping`
     - ✅ Vue `user_permissions`

### 2. Configuration du Mot de Passe Admin

Le mot de passe admin par défaut est **"admin"**. Pour le changer:

1. **Option 1: Variable d'environnement (Recommandé)**
   - Allez sur Vercel: https://vercel.com/dashboard
   - Sélectionnez votre projet GOB
   - Settings → Environment Variables
   - Ajoutez: `ROLES_ADMIN_PASSWORD` = `votre_mot_de_passe_securise`

2. **Option 2: Modifier dans l'API**
   - Modifiez `api/roles-config.js`
   - Changez la ligne: `const ADMIN_PASSWORD = process.env.ROLES_ADMIN_PASSWORD || 'admin';`

### 3. Accès à la Page de Configuration

1. **Ouvrez la page de configuration:**
   - URL: `https://votre-domaine.com/roles-config.html`
   - Ou: `https://gobapps.com/roles-config.html`

2. **Connectez-vous:**
   - Entrez le mot de passe admin
   - Cliquez sur "Se connecter"

## 🎯 Utilisation de la Page de Configuration

### Gérer les Rôles

#### Créer un Nouveau Rôle

1. Cliquez sur **"Nouveau Rôle"**
2. Remplissez:
   - **Nom du rôle (ID)**: Identifiant unique (ex: `analyst`)
   - **Nom d'affichage**: Nom visible (ex: `Analyste`)
   - **Description**: Description du rôle
   - **Rôle administrateur**: Cocher si accès complet
3. **Cocher/Décocher les composants** selon les permissions souhaitées
4. Cliquez sur **"Enregistrer"**

#### Modifier un Rôle

1. Cliquez sur **"Modifier"** sur la carte du rôle
2. Modifiez les informations et permissions
3. Cliquez sur **"Enregistrer"**

#### Supprimer un Rôle

1. Cliquez sur **"Supprimer"** sur la carte du rôle
2. Confirmez la suppression

⚠️ **Note**: Le rôle `admin` ne peut pas être supprimé.

### Assigner un Rôle à un Utilisateur

1. Dans la section **"Assignation des Rôles aux Utilisateurs"**
2. Entrez le **nom d'utilisateur** (ex: `daniel`, `gob`, `client`)
3. Sélectionnez le **rôle** dans le menu déroulant
4. Cliquez sur **"Assigner le Rôle"**

## 📦 Composants Disponibles

Voici tous les composants que vous pouvez activer/désactiver:

| ID Composant | Nom | Catégorie |
|-------------|-----|-----------|
| `stocks-news` | Stocks & News | Principal |
| `ask-emma` | Ask Emma | Principal |
| `intellistocks` | JLab | Principal |
| `economic-calendar` | Calendrier Économique | Calendriers |
| `investing-calendar` | Calendrier Investissement | Calendriers |
| `yield-curve` | Courbe des Rendements | Analyse |
| `markets-economy` | Marchés & Économie | Analyse |
| `dans-watchlist` | Watchlist | Données |
| `scrapping-sa` | Scrapping SA | Données |
| `seeking-alpha` | Seeking Alpha | Données |
| `email-briefings` | Briefings Email | Communication |
| `admin-jslai` | Admin JSL AI | Admin |
| `emma-sms` | Emma SMS | Communication |
| `fastgraphs` | FastGraphs | Outils |
| `plus` | Plus | Autres |
| `news-ticker` | Bandeau Actualités | Principal |
| `theme-selector` | Sélecteur de Thème | Interface |

## 🔑 Rôles par Défaut

Le système inclut 5 rôles pré-configurés:

### 1. Admin
- **Accès complet** à tous les composants
- Peut accéder à la configuration des rôles
- Peut modifier/supprimer tous les rôles

### 2. GOB
- Accès étendu à la plupart des composants
- Pas d'accès à: Scrapping SA, Admin JSL AI, Emma SMS, Plus

### 3. Daniel
- Accès standard aux composants principaux
- Pas d'accès à: Seeking Alpha, Scrapping SA, Email Briefings, Admin JSL AI, Emma SMS, FastGraphs, Plus

### 4. Client
- Accès limité aux composants de base
- Accès uniquement à: Stocks & News, Ask Emma, JLab, News Ticker, Theme Selector

### 5. Invité
- Accès minimal
- Accès uniquement à: Stocks & News, Ask Emma, News Ticker, Theme Selector

## 🔄 Fonctionnement Automatique

Une fois configuré, le système fonctionne automatiquement:

1. **Au chargement du dashboard:**
   - Les permissions de l'utilisateur sont chargées depuis Supabase
   - Les tabs non autorisés sont masqués dans la navigation
   - Les composants non autorisés sont masqués

2. **Si l'utilisateur n'a pas de rôle assigné:**
   - Tous les composants sont visibles (fallback)
   - Aucune restriction n'est appliquée

3. **Si l'utilisateur a un rôle:**
   - Seuls les composants autorisés sont visibles
   - Les autres sont masqués automatiquement

## 🛠️ API Endpoints

L'API `/api/roles-config` expose les endpoints suivants:

### `verify_admin`
Vérifie le mot de passe admin.

**Request:**
```json
{
  "action": "verify_admin",
  "adminPassword": "votre_mot_de_passe"
}
```

### `get_roles`
Récupère tous les rôles.

**Request:**
```json
{
  "action": "get_roles",
  "adminPassword": "votre_mot_de_passe"
}
```

### `get_user_permissions`
Récupère les permissions d'un utilisateur.

**Request:**
```json
{
  "action": "get_user_permissions",
  "username": "daniel"
}
```

### `create_role`
Crée un nouveau rôle.

**Request:**
```json
{
  "action": "create_role",
  "adminPassword": "votre_mot_de_passe",
  "roleName": "analyst",
  "displayName": "Analyste",
  "description": "Rôle analyste",
  "componentPermissions": {
    "stocks-news": true,
    "ask-emma": true,
    "intellistocks": false
  }
}
```

### `update_role`
Met à jour un rôle existant.

**Request:**
```json
{
  "action": "update_role",
  "adminPassword": "votre_mot_de_passe",
  "roleId": "uuid-du-role",
  "displayName": "Nouveau nom",
  "componentPermissions": {
    "stocks-news": true,
    "ask-emma": false
  }
}
```

### `assign_role`
Assigne un rôle à un utilisateur.

**Request:**
```json
{
  "action": "assign_role",
  "adminPassword": "votre_mot_de_passe",
  "username": "daniel",
  "role_id": "uuid-du-role"
}
```

## 🔒 Sécurité

- ✅ Mot de passe admin requis pour toutes les modifications
- ✅ Permissions stockées dans Supabase (sécurisé)
- ✅ Vérification côté serveur et client
- ✅ Row Level Security (RLS) activé sur Supabase
- ⚠️ En production, changez le mot de passe admin par défaut

## 📝 Exemples d'Utilisation

### Exemple 1: Créer un Rôle "Analyste"

1. Connectez-vous à `/roles-config.html`
2. Cliquez sur "Nouveau Rôle"
3. Remplissez:
   - Nom: `analyst`
   - Nom d'affichage: `Analyste`
   - Description: `Accès aux outils d'analyse`
4. Cochez:
   - ✅ stocks-news
   - ✅ ask-emma
   - ✅ intellistocks
   - ✅ yield-curve
   - ✅ markets-economy
   - ✅ news-ticker
   - ✅ theme-selector
5. Décochez tous les autres
6. Cliquez sur "Enregistrer"

### Exemple 2: Assigner le Rôle "Analyste" à un Utilisateur

1. Dans la section "Assignation des Rôles"
2. Entrez: `analyst_user`
3. Sélectionnez: `Analyste`
4. Cliquez sur "Assigner le Rôle"

## 🐛 Dépannage

### Les permissions ne s'appliquent pas

1. Vérifiez que le script SQL a été exécuté dans Supabase
2. Vérifiez que l'utilisateur a un rôle assigné dans `user_role_mapping`
3. Ouvrez la console du navigateur (F12) et vérifiez les logs `[Roles]`

### Erreur "Mot de passe admin incorrect"

1. Vérifiez la variable d'environnement `ROLES_ADMIN_PASSWORD` dans Vercel
2. Ou modifiez le mot de passe dans `api/roles-config.js`

### Les tabs ne se masquent pas

1. Vérifiez que `roles-permissions.js` est chargé dans `beta-combined-dashboard.html`
2. Vérifiez la console pour les erreurs JavaScript
3. Vérifiez que les permissions sont correctement chargées depuis l'API

## 📚 Fichiers Créés

- `supabase-roles-permissions-setup.sql` - Script SQL pour Supabase
- `api/roles-config.js` - API de gestion des rôles
- `public/roles-config.html` - Interface de configuration
- `public/js/roles-permissions.js` - Système de permissions côté client
- `docs/ROLES_PERMISSIONS_GUIDE.md` - Ce guide

## ✅ Checklist de Déploiement

- [ ] Exécuter le script SQL dans Supabase
- [ ] Configurer la variable d'environnement `ROLES_ADMIN_PASSWORD` dans Vercel
- [ ] Tester l'accès à `/roles-config.html`
- [ ] Créer/modifier les rôles selon vos besoins
- [ ] Assigner les rôles aux utilisateurs
- [ ] Tester que les permissions s'appliquent correctement
- [ ] Vérifier que les composants non autorisés sont masqués

---

**Note**: Pour toute question ou problème, consultez les logs de la console du navigateur et les logs Vercel.

