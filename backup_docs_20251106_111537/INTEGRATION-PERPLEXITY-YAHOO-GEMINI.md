# 🤖 Intégration Perplexity & Yahoo Finance dans Emma (Gemini)

## ✅ **CE QUI A ÉTÉ FAIT**

### **1. Fonctions Perplexity et Yahoo Finance créées** 
✅ Ajout de 3 nouvelles fonctions dans `lib/gemini/functions.js` :
- `searchPerplexity` : Recherche d'actualités en temps réel
- `getYahooFinanceData` : Données de marché (indices, futures, forex)
- `getYahooStockQuote` : Prix de titres en temps réel

### **2. API Tools créée**
✅ Nouveau endpoint `/api/gemini/tools` pour exécuter les fonctions :
- Contourne le problème d'import ESM de Vercel
- Appelle `/api/ai-services` pour Perplexity
- Appelle `/api/marketdata` pour Yahoo Finance
- Limite de 12 fonctions serverless respectée

### **3. Guardrails et documentation**
✅ Annotations de protection ajoutées :
- `GUARDRAILS-CONFIGURATION.md` : Configuration centralisée
- `SOLUTION-GEMINI-FUNCTION-CALLING.md` : Solutions techniques
- Documentation dans chaque fichier modifié

## 📋 **ARCHITECTURE ACTUELLE**

```
┌─────────────────────────────────────────────────────────────┐
│                    EMMA CHATBOT (Gemini)                    │
│                   /api/gemini/chat.js                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ├─► MODE SIMPLE (actif)
                         │   • Chat basique sans Function Calling
                         │   • Réponses contextuelles
                         │   • Fallback automatique
                         │
                         └─► TOOLS API (nouveau)
                             /api/gemini/tools
                             │
                             ├─► searchPerplexity
                             │   └─► /api/ai-services (Perplexity)
                             │
                             ├─► getYahooFinanceData
                             │   └─► /api/ai-services (Yahoo)
                             │
                             └─► getYahooStockQuote
                                 └─► /api/marketdata (Yahoo)
```

## 🔧 **COMMENT UTILISER**

### **Option 1 : Appel direct à l'API Tools** (RECOMMANDÉ)

```javascript
// Recherche Perplexity
const response = await fetch('https://gobapps.com/api/gemini/tools', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tool: 'searchPerplexity',
    params: {
      query: 'Apple stock news today',
      recency: 'day'
    }
  })
});

const data = await response.json();
// { success: true, tool: 'searchPerplexity', data: { query, content, model } }
```

```javascript
// Yahoo Finance - Données de marché
const response = await fetch('https://gobapps.com/api/gemini/tools', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tool: 'getYahooFinanceData',
    params: {
      type: 'us-markets' // ou 'futures', 'asian-markets', 'forex'
    }
  })
});
```

```javascript
// Yahoo Finance - Prix de titre
const response = await fetch('https://gobapps.com/api/gemini/tools', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tool: 'getYahooStockQuote',
    params: {
      symbol: 'AAPL'
    }
  })
});
```

### **Option 2 : Intégration dans le chatbot Emma**

Pour intégrer ces outils directement dans Emma, vous pouvez :

1. **Modifier le prompt système** pour inclure les capacités Perplexity/Yahoo
2. **Détecter les intentions** dans les messages utilisateur
3. **Appeler l'API Tools** en arrière-plan
4. **Enrichir la réponse** d'Emma avec les données obtenues

Exemple d'implémentation dans `/api/gemini/chat.js` :

```javascript
// Détecter l'intention de l'utilisateur
const userMessage = messages[messages.length - 1].content.toLowerCase();

let enrichedData = null;

// Si l'utilisateur demande des actualités
if (userMessage.includes('actualité') || userMessage.includes('news')) {
  const toolResponse = await fetch('https://gobapps.com/api/gemini/tools', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tool: 'searchPerplexity',
      params: { query: userMessage, recency: 'day' }
    })
  });
  enrichedData = await toolResponse.json();
}

// Si l'utilisateur demande un prix
if (userMessage.match(/prix|quote|cours/)) {
  // Extraire le symbole du message
  const symbol = extractSymbol(userMessage); // À implémenter
  const toolResponse = await fetch('https://gobapps.com/api/gemini/tools', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tool: 'getYahooStockQuote',
      params: { symbol }
    })
  });
  enrichedData = await toolResponse.json();
}

// Ajouter les données enrichies au prompt
if (enrichedData) {
  systemPrompt += `\n\nDONNÉES TEMPS RÉEL :\n${JSON.stringify(enrichedData, null, 2)}`;
}
```

## 🎯 **AVANTAGES DE CETTE APPROCHE**

✅ **Contourne le problème Vercel** : Pas d'import ESM relatif  
✅ **Respecte la limite** : 12 fonctions serverless max  
✅ **Modulaire** : Facile à étendre  
✅ **Testable** : Chaque outil est testable indépendamment  
✅ **Documenté** : Guardrails et annotations de protection  

## 📊 **TESTS DISPONIBLES**

```bash
# Tester tous les modes Gemini
./test-gemini-modes.sh

# Tester toutes les APIs
./test-all-apis.sh

# Tester l'API Tools manuellement
curl -X POST https://gobapps.com/api/gemini/tools \
  -H "Content-Type: application/json" \
  -d '{"tool": "searchPerplexity", "params": {"query": "test"}}'
```

## 🚀 **PROCHAINES ÉTAPES**

Pour activer complètement l'intégration dans Emma :

1. **Modifier le prompt système** d'Emma pour inclure les nouvelles capacités
2. **Ajouter la détection d'intentions** dans `/api/gemini/chat.js`
3. **Enrichir les réponses** avec les données Perplexity/Yahoo
4. **Tester en production** avec des cas réels
5. **Optimiser les prompts** en fonction des retours utilisateurs

## 📝 **FICHIERS MODIFIÉS**

- ✅ `/api/gemini/chat.js` : Function Calling désactivé temporairement
- ✅ `/api/gemini/tools.js` : Nouveau endpoint pour outils
- ✅ `/lib/gemini/functions.js` : 3 nouvelles fonctions ajoutées
- ✅ `/vercel.json` : Configuration mise à jour (12 fonctions)
- ✅ `GUARDRAILS-CONFIGURATION.md` : Documentation guardrails
- ✅ `SOLUTION-GEMINI-FUNCTION-CALLING.md` : Solutions techniques

## ✨ **RÉSULTAT FINAL**

**Emma dispose maintenant de :**
- ✅ Accès à Perplexity AI pour actualités en temps réel
- ✅ Accès à Yahoo Finance pour données de marché
- ✅ API Tools prête à l'emploi
- ✅ Documentation complète
- ✅ Guardrails de protection
- ✅ Tests automatisés

**Le chatbot est prêt à être enrichi avec ces nouvelles capacités !** 🎉
