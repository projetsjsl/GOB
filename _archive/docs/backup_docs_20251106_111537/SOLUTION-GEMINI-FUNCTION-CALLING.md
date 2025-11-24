# 🔧 Solution pour Function Calling Gemini sur Vercel

## ❌ **PROBLÈME IDENTIFIÉ**

**Erreur** : `FUNCTION_INVOCATION_FAILED`  
**Cause** : Les imports ESM relatifs (`import ... from '../../lib/...'`) ne fonctionnent pas correctement dans les Serverless Functions Vercel.

## ✅ **SOLUTIONS POSSIBLES**

### **Solution 1 : Intégrer les fonctions dans le même fichier (RECOMMANDÉ)**

**Avantages** :
- Pas de problème d'import
- Fonctionne immédiatement sur Vercel
- Plus simple à debugger

**Inconvénients** :
- Fichier plus volumineux
- Moins modulaire

**Implémentation** :
1. Copier tout le contenu de `lib/gemini/functions.js` dans `api/gemini/chat.js`
2. Supprimer les exports/imports
3. Déployer

### **Solution 2 : Utiliser une API intermédiaire**

**Avantages** :
- Garde le code modulaire
- Utilise des appels HTTP standard

**Inconvénients** :
- Plus lent (appel HTTP supplémentaire)
- Plus complexe

**Implémentation** :
1. Créer `/api/gemini/execute-function.js` qui importe et exécute les fonctions
2. Appeler cette API depuis `chat.js`

### **Solution 3 : Utiliser un package npm**

**Avantages** :
- Code très propre
- Réutilisable

**Inconvénients** :
- Nécessite de publier un package
- Plus complexe

**Implémentation** :
1. Créer un package npm local ou publié
2. L'installer dans le projet
3. L'importer normalement

## 🎯 **SOLUTION RECOMMANDÉE POUR L'INSTANT**

**Mode hybride** :
1. **Sans Function Calling** : Utiliser le mode simple pour le chatbot de base (actuellement actif)
2. **Avec Function Calling** : Utiliser le mode validé avec appels API directs

**Pour intégrer Perplexity et Yahoo Finance dans Emma** :
- Modifier le prompt système d'Emma pour lui dire qu'elle peut appeler des APIs
- Utiliser des appels API directs dans le code au lieu de Function Calling Gemini
- Emma guide l'utilisateur mais n'appelle pas les fonctions automatiquement

## 📋 **EXEMPLE D'INTÉGRATION SANS FUNCTION CALLING**

```javascript
// Dans le prompt système d'Emma
const emmaSystemPrompt = `
Tu es Emma, assistante financière experte.

RESSOURCES DISPONIBLES :
- Perplexity AI : Pour les actualités en temps réel
- Yahoo Finance : Pour les données de marché
- Market Data API : Pour les prix et métriques

Quand l'utilisateur demande des données :
1. Indique que tu peux obtenir ces données
2. Demande confirmation
3. Une fois confirmé, les données seront affichées
`;

// Détecter les intentions de l'utilisateur
if (userMessage.includes('actualités') || userMessage.includes('news')) {
  // Suggérer d'utiliser Perplexity
  response += "\n\n💡 Je peux rechercher les dernières actualités via Perplexity AI. Voulez-vous que je fasse cette recherche ?";
}
```

## 🚀 **PROCHAINES ÉTAPES**

1. **Court terme** : Garder le chatbot simple sans Function Calling
2. **Moyen terme** : Implémenter la Solution 2 (API intermédiaire)
3. **Long terme** : Migrer vers la Solution 1 ou 3

## 📝 **NOTES IMPORTANTES**

- Le Function Calling Gemini fonctionne parfaitement en local
- Le problème est spécifique au déploiement Vercel
- Les fonctions sont prêtes et testées dans `lib/gemini/functions.js`
- Elles peuvent être utilisées par d'autres parties de l'application
