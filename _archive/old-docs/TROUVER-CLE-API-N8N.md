# 🔑 Comment trouver la clé API n8n

## 📍 Emplacement dans l'interface n8n

### Étape 1 : Se connecter à n8n
1. Allez sur **https://projetsjsl.app.n8n.cloud**
2. Connectez-vous avec vos identifiants

### Étape 2 : Accéder aux paramètres
1. En haut à droite, cliquez sur votre **avatar/profil** (icône utilisateur)
2. Dans le menu déroulant, cliquez sur **"Settings"** (Paramètres)
   - Ou utilisez le raccourci : cliquez sur l'icône **⚙️** (engrenage) en haut à droite

### Étape 3 : Section API
1. Dans le menu de gauche des Settings, cherchez **"API"**
2. Cliquez sur **"API"**

### Étape 4 : Créer ou voir votre clé API
Vous verrez deux options :

#### Option A : Si vous avez déjà une clé API
- Vous verrez une liste de vos clés API existantes
- Chaque clé affiche :
  - Le nom de la clé
  - La date de création
  - Un bouton pour **copier** ou **voir** la clé
- ⚠️ **Important** : Si vous n'avez jamais vu la clé, vous ne pourrez peut-être pas la revoir (pour des raisons de sécurité)
- Dans ce cas, vous devrez **créer une nouvelle clé**

#### Option B : Créer une nouvelle clé API
1. Cliquez sur le bouton **"Create API Key"** ou **"Add API Key"**
2. Donnez un nom à votre clé (ex: "GOB Integration" ou "Vercel API")
3. Cliquez sur **"Create"** ou **"Save"**
4. **⚠️ IMPORTANT** : La clé s'affichera **UNE SEULE FOIS**
5. **Copiez-la immédiatement** et sauvegardez-la dans un endroit sûr
6. Cliquez sur **"Copy"** ou sélectionnez tout le texte et copiez-le

## 📋 Chemin complet dans l'interface

```
https://projetsjsl.app.n8n.cloud
  → Cliquez sur votre avatar (en haut à droite)
  → Settings (⚙️)
  → Menu gauche : "API"
  → Section "API Keys"
  → "Create API Key" (si nouvelle)
  → OU copiez une clé existante
```

## 🔐 Format de la clé API

La clé API n8n ressemble généralement à :
- `n8n_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- Ou un format similaire avec des caractères aléatoires

## 💾 Une fois la clé obtenue

### Option 1 : L'ajouter à Vercel
1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet GOB
3. **Settings** → **Environment Variables**
4. Cliquez sur **"Add New"**
5. Nom : `N8N_API_KEY`
6. Valeur : Collez votre clé
7. Sélectionnez les environnements (Production, Preview, Development)
8. Cliquez sur **"Save"**

### Option 2 : L'utiliser localement
```bash
# Créer un fichier .env.local
echo "N8N_API_KEY=votre_cle_ici" > .env.local

# Ou l'exporter
export N8N_API_KEY="votre_cle_ici"

# Puis tester la connexion
node connect-n8n-with-vercel.js
```

## 🎯 Utilisation de la clé

Une fois la clé configurée, vous pouvez :

```bash
# Tester la connexion
node connect-n8n-with-vercel.js

# Ou avec le script de test
node test-n8n-workflow.js
```

## ⚠️ Sécurité

- **Ne partagez JAMAIS** votre clé API
- **Ne commitez JAMAIS** la clé dans Git
- Ajoutez `.env.local` à votre `.gitignore`
- Si vous pensez que la clé a été compromise, **révoquez-la** dans n8n et créez-en une nouvelle

## 🔄 Si vous avez perdu la clé

Si vous ne pouvez plus voir votre clé API :
1. Allez dans Settings → API
2. **Supprimez** l'ancienne clé (si elle existe)
3. **Créez une nouvelle clé**
4. **Copiez-la immédiatement**
5. Mettez à jour la clé dans Vercel

## 📸 Aperçu de l'interface (description textuelle)

```
┌─────────────────────────────────────────┐
│  n8n                    [Avatar] ⚙️     │
├─────────────────────────────────────────┤
│                                         │
│  Settings                               │
│  ├─ Profile                             │
│  ├─ API          ← Cliquez ici          │
│  ├─ Security                            │
│  └─ ...                                 │
│                                         │
│  API Keys                               │
│  ┌───────────────────────────────────┐ │
│  │ [Create API Key]                  │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Existing API Keys:                     │
│  ┌───────────────────────────────────┐ │
│  │ Name: GOB Integration             │ │
│  │ Created: 2025-01-XX               │ │
│  │ [Copy] [Revoke]                   │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## 🆘 Besoin d'aide ?

Si vous ne trouvez pas la section API :
1. Vérifiez que vous êtes bien connecté
2. Vérifiez que vous avez les permissions administrateur
3. La section API peut être dans "Advanced Settings" selon la version de n8n
4. Cherchez aussi dans "Integrations" ou "External API"

