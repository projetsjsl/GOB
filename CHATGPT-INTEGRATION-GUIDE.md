# Guide d'Intégration ChatGPT SDK

## Vue d'ensemble

Ce guide explique comment utiliser l'intégration ChatGPT SDK dans le projet GOB Financial Dashboard. L'intégration fournit un système de fallback intelligent entre Gemini, ChatGPT et Perplexity.

## 🚀 Nouveaux Endpoints

### 1. ChatGPT Chat Simple
**Endpoint:** `/api/chatgpt/chat.js`
**Méthode:** POST
**Description:** Chat simple avec ChatGPT sans function calling

```javascript
const response = await fetch('/api/chatgpt/chat.js', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Bonjour Emma, peux-tu m\'expliquer le P/E ratio?',
    temperature: 0.7,
    maxTokens: 4096
  })
});
```

### 2. ChatGPT avec Function Calling
**Endpoint:** `/api/chatgpt/tools.js`
**Méthode:** POST
**Description:** Chat avec ChatGPT et function calling pour les données financières

```javascript
const response = await fetch('/api/chatgpt/tools.js', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Donne-moi le prix d\'Apple et calcule son P/E ratio' }
    ],
    temperature: 0.3,
    maxTokens: 4096
  })
});
```

### 3. Service IA Unifié (Recommandé)
**Endpoint:** `/api/ai-services.js`
**Méthode:** POST
**Description:** Service unifié avec fallback automatique entre tous les fournisseurs IA

```javascript
const response = await fetch('/api/ai-services.js', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Analyse la performance de Microsoft',
    preferred_provider: 'chatgpt', // 'chatgpt', 'gemini', 'perplexity', 'auto'
    use_functions: true,
    max_retries: 3
  })
});
```

## 🔧 Configuration

### Variables d'Environnement Requises

```bash
# ChatGPT (Nouveau)
OPENAI_API_KEY=sk-...

# Gemini (Existant)
GEMINI_API_KEY=AI...

# Perplexity (Existant)
PERPLEXITY_API_KEY=pplx-...
```

### Configuration Vercel

Les endpoints sont automatiquement configurés dans `vercel.json` :

```json
{
  "functions": {
    "api/chatgpt/chat.js": {
      "maxDuration": 30
    },
    "api/chatgpt/tools.js": {
      "maxDuration": 60
    },
    "api/ai-services.js": {
      "maxDuration": 120
    }
  }
}
```

## 🛠️ Fonctionnalités

### Function Calling ChatGPT

Le système supporte les fonctions suivantes :

1. **get_stock_price(ticker)** - Prix d'action
2. **get_financial_data(ticker, data_type)** - Données financières
3. **get_news(ticker, limit)** - Actualités financières
4. **calculate_financial_ratio(calculation_type, values)** - Calculs financiers
5. **get_market_overview(indices)** - Aperçu du marché

### Système de Fallback

L'ordre de priorité par défaut :
1. **Gemini** (si disponible)
2. **ChatGPT** (si disponible)
3. **Perplexity** (si disponible)

### Modes d'Utilisation

#### Mode Auto (Recommandé)
```javascript
{
  "message": "Analyse Microsoft",
  "preferred_provider": "auto",
  "use_functions": true
}
```

#### Mode Spécifique
```javascript
{
  "message": "Analyse Microsoft",
  "preferred_provider": "chatgpt",
  "use_functions": true
}
```

## 🧪 Tests

### Script de Test Automatique

```bash
node test-chatgpt-integration.js
```

Ce script teste :
- ChatGPT Chat Simple
- ChatGPT avec Function Calling
- AI Services avec ChatGPT prioritaire
- AI Services avec fallback automatique

### Test Manuel

```bash
# Test ChatGPT simple
curl -X POST https://votre-app.vercel.app/api/chatgpt/chat.js \
  -H "Content-Type: application/json" \
  -d '{"message": "Bonjour Emma!"}'

# Test AI Services avec fallback
curl -X POST https://votre-app.vercel.app/api/ai-services.js \
  -H "Content-Type: application/json" \
  -d '{"message": "Analyse AAPL", "preferred_provider": "auto"}'
```

## 📊 Intégration avec Emma Agent

L'Emma Agent peut maintenant utiliser ChatGPT via le service unifié :

```javascript
// Dans emma-agent.js
const aiResponse = await callInternalAPI('/api/ai-services.js', {
  message: userMessage,
  context: context,
  preferred_provider: 'chatgpt',
  use_functions: true
});
```

## 🔄 Migration depuis Perplexity

Pour migrer progressivement vers ChatGPT :

1. **Phase 1** : Utiliser `preferred_provider: 'auto'` (fallback automatique)
2. **Phase 2** : Utiliser `preferred_provider: 'chatgpt'` (ChatGPT prioritaire)
3. **Phase 3** : Remplacer complètement Perplexity par ChatGPT

## 🚨 Dépannage

### Erreurs Communes

#### 1. "OPENAI_API_KEY manquante"
```bash
# Vérifier la configuration Vercel
vercel env ls
# Ajouter la clé si manquante
vercel env add OPENAI_API_KEY
```

#### 2. "Tous les services IA sont indisponibles"
- Vérifier que toutes les clés API sont configurées
- Vérifier les quotas API
- Vérifier la connectivité réseau

#### 3. "Function calling ne fonctionne pas"
- Utiliser `/api/chatgpt/tools.js` au lieu de `/api/chatgpt/chat.js`
- Vérifier que `use_functions: true` est défini

### Logs de Debug

```javascript
// Activer les logs détaillés
console.log('🤖 AI Services: Processing request');
console.log('📋 Provider priority:', providers);
console.log('🔄 Tentative X avec provider');
```

## 📈 Performance

### Temps de Réponse Typiques

- **ChatGPT Chat Simple** : 2-5 secondes
- **ChatGPT avec Functions** : 5-10 secondes
- **AI Services (fallback)** : 3-8 secondes

### Optimisations

1. **Cache des réponses** : Implémenter un cache Redis
2. **Requêtes parallèles** : Utiliser Promise.all() quand possible
3. **Timeout adaptatif** : Ajuster selon le fournisseur

## 🔐 Sécurité

### Bonnes Pratiques

1. **Ne jamais exposer les clés API** côté client
2. **Valider les entrées utilisateur** avant envoi
3. **Limiter les requêtes** par utilisateur
4. **Logger les erreurs** sans exposer les détails sensibles

### Rate Limiting

```javascript
// Exemple de rate limiting
const rateLimiter = new Map();
const MAX_REQUESTS = 10;
const WINDOW_MS = 60000; // 1 minute
```

## 📚 Ressources

- [Documentation OpenAI](https://platform.openai.com/docs)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [Vercel Functions](https://vercel.com/docs/functions)
- [Guide de déploiement](./DEPLOYMENT.md)

## 🤝 Support

Pour toute question ou problème :

1. Consulter les logs Vercel
2. Exécuter le script de test
3. Vérifier la configuration des clés API
4. Consulter la documentation OpenAI

---

**Note** : Cette intégration est conçue pour être rétrocompatible avec l'architecture existante. Tous les endpoints existants continuent de fonctionner normalement.