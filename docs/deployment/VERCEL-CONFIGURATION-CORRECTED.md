# 🔧 Configuration Vercel Corrigée pour Emma

## ❌ Problème Résolu

L'erreur `Environment Variable "GEMINI_API_KEY" references Secret "gemini-api-key", which does not exist` a été corrigée.

## ✅ Solution

### 1. **Suppression de la Configuration Incorrecte**

Le fichier `vercel.json` a été corrigé pour ne plus référencer de secret inexistant.

### 2. **Configuration Manuelle dans Vercel**

Vous devez maintenant configurer la variable d'environnement **manuellement** dans le dashboard Vercel :

## 🚀 Étapes de Configuration

### Étape 1 : Dashboard Vercel
1. Allez sur [vercel.com](https://vercel.com)
2. Connectez-vous à votre compte
3. Sélectionnez votre projet **GOB**

### Étape 2 : Variables d'Environnement
1. Cliquez sur **"Settings"** dans le menu de votre projet
2. Cliquez sur **"Environment Variables"** dans le menu latéral
3. Cliquez sur **"Add New"**

### Étape 3 : Ajouter la Variable
1. **Name** : `GEMINI_API_KEY`
2. **Value** : Votre clé API Gemini (obtenez-la sur [Google AI Studio](https://makersuite.google.com/app/apikey))
3. **Environment** : Sélectionnez **Production**, **Preview**, et **Development**
4. Cliquez sur **"Save"**

### Étape 4 : Redéploiement
1. Allez dans l'onglet **"Deployments"**
2. Cliquez sur **"Redeploy"** sur le dernier déploiement
3. Ou faites un nouveau push sur votre repository

## 🔑 Obtenir la Clé API Gemini

1. Allez sur [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Connectez-vous avec votre compte Google
3. Cliquez sur **"Create API Key"**
4. Copiez la clé générée
5. Collez-la dans la variable d'environnement Vercel

## ✅ Vérification

### Test de l'API Route
Une fois déployé, testez l'API route :

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
1. Ouvrez votre dashboard : `https://votre-projet.vercel.app/beta-combined-dashboard.html`
2. Allez dans l'onglet **"🤖 Ask Emma"**
3. Vérifiez que le statut affiche **"✅ Gemini Connecté"**
4. Testez une question à Emma

## 🔧 Dépannage

### Si l'erreur persiste :
1. **Vérifiez** que la variable `GEMINI_API_KEY` est bien créée dans Vercel
2. **Redéployez** le projet après avoir ajouté la variable
3. **Vérifiez** que la clé API Gemini est valide
4. **Consultez** les logs Vercel dans la section Functions

### Si Emma ne répond pas :
1. **Vérifiez** le statut de connexion dans l'interface
2. **Testez** l'API route directement
3. **Vérifiez** votre quota Gemini sur Google AI Studio

## 📊 Structure Finale

### Fichiers de Configuration
- ✅ `vercel.json` - Configuration Vercel (corrigée)
- ✅ `api/gemini-key.js` - API route pour la clé
- ✅ `beta-combined-dashboard.html` - Dashboard avec Emma intégrée

### Variables d'Environnement
- ✅ `GEMINI_API_KEY` - À configurer manuellement dans Vercel

## 🎯 Résultat

Une fois la variable `GEMINI_API_KEY` configurée dans Vercel :

- ✅ **Emma fonctionne automatiquement**
- ✅ **Aucune configuration côté client**
- ✅ **Sécurité optimale** (clé API côté serveur)
- ✅ **Interface intégrée** dans le dashboard

---

**🚀 Emma sera prête dès que vous aurez configuré la variable d'environnement dans Vercel !**
