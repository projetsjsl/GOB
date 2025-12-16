# 🚀 Configuration Vercel pour Emma

## 📋 Variable d'Environnement Requise

Pour que Emma fonctionne automatiquement avec l'API Gemini, vous devez configurer une variable d'environnement dans Vercel.

### 🔑 Nom de la Variable

**`GEMINI_API_KEY`**

## 🛠️ Configuration dans Vercel

### Méthode 1 : Via le Dashboard Vercel

1. **Connectez-vous** à votre compte Vercel
2. **Sélectionnez** votre projet GOB
3. Allez dans **Settings** → **Environment Variables**
4. **Ajoutez** une nouvelle variable :
   - **Name** : `GEMINI_API_KEY`
   - **Value** : Votre clé API Gemini
   - **Environment** : Production, Preview, Development (tous)
5. **Sauvegardez** la variable

### Méthode 2 : Via Vercel CLI

```bash
# Installer Vercel CLI si pas déjà fait
npm i -g vercel

# Se connecter à Vercel
vercel login

# Ajouter la variable d'environnement
vercel env add GEMINI_API_KEY

# Redéployer le projet
vercel --prod
```

### Méthode 3 : Via le fichier .env.local

```bash
# Créer un fichier .env.local à la racine du projet
echo "GEMINI_API_KEY=votre_cle_api_gemini_ici" > .env.local
```

## 🔐 Obtenir une Clé API Gemini

1. Allez sur [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Connectez-vous avec votre compte Google
3. Cliquez sur **"Create API Key"**
4. Copiez la clé générée
5. Collez-la dans la variable d'environnement Vercel

## ✅ Vérification

### Test de la Configuration

1. **Déployez** votre projet sur Vercel
2. **Ouvrez** votre dashboard : `https://votre-projet.vercel.app/beta-combined-dashboard.html`
3. Allez dans l'onglet **"🤖 Ask Emma"**
4. Vérifiez que le statut affiche **"✅ Gemini Connecté"**
5. **Testez** une question à Emma

### Test de l'API Route

Vous pouvez tester directement l'API route :

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

## 🔧 Dépannage

### Problème : "❌ Gemini Non Connecté"

**Solutions :**
1. Vérifiez que la variable `GEMINI_API_KEY` est bien configurée
2. Redéployez le projet après avoir ajouté la variable
3. Vérifiez que la clé API est valide
4. Consultez les logs Vercel pour les erreurs

### Problème : "Clé API Gemini non configurée"

**Solutions :**
1. Vérifiez l'orthographe : `GEMINI_API_KEY` (pas `GEMINI_API_KEY_` ou autre)
2. Assurez-vous que la variable est disponible pour tous les environnements
3. Redéployez après avoir modifié les variables

### Problème : Erreur 500 sur l'API route

**Solutions :**
1. Vérifiez les logs Vercel dans la section Functions
2. Assurez-vous que le fichier `api/gemini-key.js` est bien déployé
3. Vérifiez la syntaxe du fichier API route

## 📊 Monitoring

### Logs Vercel

Pour surveiller l'utilisation d'Emma :

1. Allez dans **Vercel Dashboard** → **Functions**
2. Cliquez sur **`api/gemini-key`**
3. Consultez les **logs** et **métriques**

### Métriques d'Utilisation

- **Appels API** : Nombre de requêtes à Gemini
- **Temps de réponse** : Performance des réponses
- **Erreurs** : Taux d'échec des appels

## 🔒 Sécurité

### Bonnes Pratiques

1. **Ne jamais** exposer la clé API côté client
2. **Utiliser** uniquement les variables d'environnement Vercel
3. **Limiter** l'accès à l'API route si nécessaire
4. **Surveiller** l'utilisation de la clé API

### Limites de l'API Gemini

- **Quota gratuit** : 15 requêtes/minute
- **Quota payant** : Selon votre plan Google Cloud
- **Coût** : ~$0.0005 par 1K tokens

## 🚀 Déploiement Automatique

### GitHub Integration

Si vous utilisez GitHub :

1. **Connectez** votre repo GitHub à Vercel
2. **Configurez** les variables d'environnement dans Vercel
3. **Chaque push** déclenchera un déploiement automatique
4. **Emma sera** automatiquement disponible avec la clé API

### Variables par Environnement

Vous pouvez configurer différentes clés pour différents environnements :

- **Development** : Clé de test
- **Preview** : Clé de staging  
- **Production** : Clé de production

## 📞 Support

### En cas de Problème

1. **Vérifiez** cette documentation
2. **Consultez** les logs Vercel
3. **Testez** l'API route directement
4. **Vérifiez** votre quota Gemini

### Ressources Utiles

- [Documentation Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Documentation Gemini API](https://ai.google.dev/docs)
- [Google AI Studio](https://makersuite.google.com/)

---

**🎯 Une fois configuré, Emma fonctionnera automatiquement sans configuration manuelle !**
