# 🚀 Guide de Déploiement - JSLAI RobotWeb Ultimate v5.0

Ce guide explique comment déployer le projet **JSLAI RobotWeb Ultimate** (dans `public/groupchat`) sur Vercel.

## 📍 Option 1: Déploiement en tant que Projet Vercel Séparé (Recommandé)

### Étape 1: Créer un Nouveau Projet Vercel

1. Allez sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Cliquez sur **"Add New"** → **"Project"**
3. Importez votre repository GitHub `projetsjsl/GOB`
4. **IMPORTANT**: Dans les paramètres du projet, configurez:
   - **Root Directory**: `public/groupchat`
   - **Framework Preset**: `Next.js`
   - **Build Command**: `npm run build` (ou laisser vide pour auto-détection)
   - **Output Directory**: `.next` (ou laisser vide pour auto-détection)
   - **Install Command**: `npm install` (ou laisser vide pour auto-détection)

### Étape 2: Configurer les Variables d'Environnement (Optionnel)

Dans **Settings** → **Environment Variables**, ajoutez:

```env
# Pour planning intelligent (optionnel)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Pour vrai navigateur (choisir un)
BROWSERBASE_API_KEY=bb_live_...
BROWSERBASE_PROJECT_ID=proj_...

# OU
BROWSERLESS_API_KEY=...

# OU
STEEL_API_KEY=...
```

**Note**: Sans variables d'environnement, l'application fonctionne en mode **Simulation** uniquement (100% fonctionnel!).

### Étape 3: Déployer

Vercel déploiera automatiquement le projet. L'URL sera:
- **Production**: `https://votre-projet.vercel.app`
- **Prévisualisation**: `https://votre-projet-git-branch.vercel.app`

---

## 📍 Option 2: Déploiement via Sous-domaine sur gobapps.com

### Configuration Vercel

1. Créez un nouveau projet Vercel comme dans l'Option 1
2. Dans **Settings** → **Domains**, ajoutez:
   - **Domain**: `groupchat.gobapps.com` (ou `robotweb.gobapps.com`)
3. Configurez le DNS dans votre fournisseur de domaine:
   - **Type**: `CNAME`
   - **Name**: `groupchat` (ou `robotweb`)
   - **Value**: `cname.vercel-dns.com`

### URL Finale

Une fois configuré, l'application sera accessible à:
- **https://groupchat.gobapps.com** (ou le sous-domaine que vous avez choisi)

---

## 📍 Option 3: Intégration dans le Projet Principal (Avancé)

Si vous voulez intégrer le projet dans le site principal `gobapps.com`, vous pouvez:

1. Créer une route proxy dans le projet principal qui redirige vers le projet Next.js
2. Ou utiliser un reverse proxy (nginx, Cloudflare Workers, etc.)

**Exemple avec Vercel Rewrite** (dans `vercel.json` du projet principal):

```json
{
  "rewrites": [
    {
      "source": "/robotweb/:path*",
      "destination": "https://votre-projet-groupchat.vercel.app/:path*"
    }
  ]
}
```

Puis accéder via: `https://gobapps.com/robotweb`

---

## 🧪 Test Local

Avant de déployer, testez localement:

```bash
cd public/groupchat
npm install
npm run dev
# Ouvrir http://localhost:3000
```

---

## ✅ Vérification après Déploiement

1. Ouvrez l'URL de déploiement
2. Allez dans **Admin** → **Test** → **"Test All"**
3. Vérifiez que le mode Simulation fonctionne
4. Si vous avez configuré des providers, testez-les

---

## 📝 Notes Importantes

- Le projet Next.js est dans `public/groupchat/`
- Il nécessite Node.js 20.x ou supérieur
- Le mode Simulation fonctionne sans aucune configuration
- Pour le vrai navigateur, configurez au moins un provider (Browserbase, Browserless, ou Steel)

---

## 🔗 Liens Utiles

- **Documentation Next.js**: https://nextjs.org/docs
- **Documentation Vercel**: https://vercel.com/docs
- **Browserbase**: https://browserbase.com
- **Browserless**: https://browserless.io
- **Steel**: https://steel.dev

---

**JSLAI RobotWeb Ultimate v5.0** 🤖
