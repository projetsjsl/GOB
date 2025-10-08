# 🔑 Configuration des Variables d'Environnement

## 📋 Variables Requises

### **GEMINI_API_KEY**
- **Description** : Clé API pour l'intégration Gemini (Emma IA)
- **Obtention** : [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Utilisation** : Chat IA, analyses financières, réponses contextuelles
- **Statut** : ✅ **Requis**

### **GITHUB_TOKEN**
- **Description** : Token d'accès personnel GitHub pour les mises à jour automatiques
- **Obtention** : [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
- **Permissions requises** :
  - `repo` (accès complet aux repositories)
  - `workflow` (mise à jour des workflows)
- **Utilisation** : Sauvegarde des analyses, mise à jour des fichiers JSON, backup automatique
- **Statut** : ⚠️ **Recommandé**

## 🚀 Configuration Vercel

### **1. Accéder au Dashboard Vercel**
1. Allez sur [vercel.com](https://vercel.com)
2. Connectez-vous à votre compte
3. Sélectionnez votre projet GOB

### **2. Ajouter les Variables d'Environnement**
1. Allez dans **Settings** → **Environment Variables**
2. Cliquez sur **Add New**
3. Ajoutez chaque variable :

```
Name: GEMINI_API_KEY
Value: votre_clé_api_gemini
Environments: Production, Preview, Development
```

```
Name: GITHUB_TOKEN
Value: votre_token_github
Environments: Production, Preview, Development
```

### **3. Redéployer l'Application**
1. Allez dans **Deployments**
2. Cliquez sur **Redeploy** sur le dernier déploiement
3. Ou poussez un nouveau commit pour déclencher un redéploiement

## 🔧 Configuration Locale (Développement)

### **Fichier .env.local**
Créez un fichier `.env.local` à la racine du projet :

```env
GEMINI_API_KEY=votre_clé_api_gemini
GITHUB_TOKEN=votre_token_github
```

### **Fichier .env.example**
```env
# Copiez ce fichier vers .env.local et remplissez les valeurs
GEMINI_API_KEY=your_gemini_api_key_here
GITHUB_TOKEN=your_github_token_here
```

## ✅ Vérification de la Configuration

### **Via l'Interface Admin**
1. Allez dans l'onglet **⚙️ Admin-JSLAI**
2. Cliquez sur **🔄 Vérifier** dans la section "État des Connexions"
3. Vérifiez les statuts :
   - 🟢 **Vert** : Variable configurée et fonctionnelle
   - 🟡 **Jaune** : Variable manquante mais non critique
   - 🔴 **Rouge** : Erreur de configuration

### **Via les API Routes**
- **Gemini** : `https://votre-app.vercel.app/api/gemini-key`
- **GitHub** : `https://votre-app.vercel.app/api/github-token`

## 🛡️ Sécurité

### **Bonnes Pratiques**
- ✅ Utilisez des tokens avec des permissions minimales
- ✅ Ne commitez jamais les clés API dans le code
- ✅ Utilisez des variables d'environnement pour tous les secrets
- ✅ Régénérez les tokens régulièrement
- ✅ Surveillez l'utilisation des API

### **Permissions GitHub Token**
```json
{
  "repo": "Accès complet aux repositories",
  "workflow": "Mise à jour des workflows",
  "user": "Accès aux informations utilisateur"
}
```

## 🚨 Dépannage

### **Erreurs Communes**

#### **"Clé API Gemini non configurée"**
- Vérifiez que `GEMINI_API_KEY` est bien définie dans Vercel
- Redéployez l'application après avoir ajouté la variable
- Vérifiez que la clé API est valide

#### **"Token GitHub invalide"**
- Vérifiez que `GITHUB_TOKEN` est bien définie dans Vercel
- Vérifiez que le token a les bonnes permissions
- Régénérez le token si nécessaire

#### **"Erreur 404 sur les API routes"**
- Vérifiez que les fichiers API sont bien déployés
- Redéployez l'application
- Vérifiez les logs Vercel pour plus de détails

### **Logs de Débogage**
1. Allez dans **Vercel Dashboard** → **Functions**
2. Consultez les logs des API routes
3. Vérifiez les erreurs de configuration

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez ce guide de configuration
2. Consultez les logs Vercel
3. Testez les API routes individuellement
4. Contactez l'équipe de développement

---

**Note** : Les variables d'environnement sont essentielles pour le bon fonctionnement de l'application. Assurez-vous de les configurer correctement avant le déploiement en production.
