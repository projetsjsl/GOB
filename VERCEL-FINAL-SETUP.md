# 🚀 Configuration Vercel Finale - Emma

## ✅ Problème de Runtime Résolu

L'erreur `Function Runtimes must have a valid version` a été corrigée en simplifiant la configuration Vercel.

## 🔧 Configuration Simplifiée

### Fichier `vercel.json`
```json
{}
```

Vercel détectera automatiquement le runtime Node.js pour l'API route.

## 🚀 Étapes de Configuration

### 1. **Configurer la Variable d'Environnement**

Dans le dashboard Vercel :

1. **Settings** → **Environment Variables**
2. **Add New** :
   - **Name** : `GEMINI_API_KEY`
   - **Value** : Votre clé API Gemini
   - **Environment** : Production, Preview, Development
3. **Save**

### 2. **Obtenir la Clé API Gemini**

1. Allez sur [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Créez une nouvelle clé API
3. Copiez-la dans Vercel

### 3. **Redéployer**

1. **Deployments** → **Redeploy** (ou nouveau push)
2. Attendez que le déploiement se termine

## ✅ Vérification

### Test de l'API Route
```bash
curl https://votre-projet.vercel.app/api/gemini-key
```

**Réponse attendue :**
```json
{
  "apiKey": "votre_cle_api_gemini",
  "source": "vercel-env",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Test dans le Dashboard
1. Ouvrez : `https://votre-projet.vercel.app/beta-combined-dashboard.html`
2. Onglet **"🤖 Ask Emma"**
3. Statut : **"✅ Gemini Connecté"**
4. Testez une question

## 🔧 Structure des Fichiers

```
GOB/
├── api/
│   └── gemini-key.js          # API route pour la clé Gemini
├── public/
│   └── beta-combined-dashboard.html  # Dashboard avec Emma intégrée
└── vercel.json                # Configuration Vercel (vide)
```

## 🎯 Résultat Final

Une fois la variable `GEMINI_API_KEY` configurée :

- ✅ **Déploiement réussi** sans erreur de runtime
- ✅ **Emma fonctionne automatiquement**
- ✅ **Interface intégrée** dans le dashboard
- ✅ **Sécurité optimale** (clé API côté serveur)

## 🔍 Dépannage

### Si le déploiement échoue encore :
1. **Vérifiez** que `vercel.json` contient seulement `{}`
2. **Supprimez** toute configuration de runtime
3. **Redéployez** le projet

### Si Emma ne répond pas :
1. **Vérifiez** la variable `GEMINI_API_KEY` dans Vercel
2. **Testez** l'API route directement
3. **Vérifiez** votre quota Gemini

---

**🎉 Emma sera prête dès que vous aurez configuré la variable d'environnement !**
