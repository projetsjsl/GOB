# 🛡️ GUARDRAILS DE CONFIGURATION - Emma En Direct

Ce document centralise tous les guardrails de protection pour éviter les modifications accidentelles du système de production.

## ⚠️ **ATTENTION CRITIQUE**

**Toute modification des fichiers listés ci-dessous peut casser le système de production.**
**Toujours tester en local avant de déployer.**

---

## 📁 **FICHIERS PROTÉGÉS**

### 🔧 **API Services Principaux**

#### `/api/ai-services.js`
- **Rôle** : Endpoint unifié pour toutes les APIs (OpenAI, Perplexity, Anthropic)
- **Configuration validée** :
  - OpenAI: `gpt-4o` + fetch() direct + 2000 tokens + temp 0.7
  - Perplexity: `sonar-pro` + 1500 tokens + temp 0.1 + recency filter
  - Anthropic: Claude-3-Sonnet (fallback)
  - Marketaux: **SUPPRIMÉ** (plus de fallback)
- **Variables requises** : `OPENAI_API_KEY`, `PERPLEXITY_API_KEY`, `ANTHROPIC_API_KEY`
- **Interdictions** : Modifier modèles, ajouter Marketaux, utiliser SDK OpenAI

#### `/api/gemini/chat.js`
- **Rôle** : Chatbot Emma avec Function Calling
- **Configuration validée** :
  - Modèle: `gemini-2.0-flash-exp` (PAS gemini-1.5-flash)
  - SDK: `@google/generative-ai` (PAS @google/genai)
  - Temperature: 0.7
  - Function Calling: Activé
- **Variables requises** : `GEMINI_API_KEY`
- **Interdictions** : Modifier modèle, changer SDK, désactiver Function Calling

#### `/api/gemini/chat-validated.js`
- **Rôle** : Chatbot Emma Expert avec validation avancée
- **Configuration validée** :
  - Modèle: `gemini-2.0-flash-exp`
  - Temperature: 0.3 (mode expert)
  - Max tokens: 4000
  - Validation: Messages, tokens, safety settings
- **Variables requises** : `GEMINI_API_KEY`
- **Interdictions** : Modifier paramètres de validation, changer température

#### `/lib/gemini/functions.js`
- **Rôle** : Fonctions pour Function Calling du chatbot
- **Configuration validée** :
  - Fonctions: getStockPrice, getNews, compareTickers, getMarketData
  - Timeout: 10 secondes par fonction
  - Validation: Paramètres et types stricts
- **Dépendances** : `/api/marketdata`, `/api/ai-services`
- **Interdictions** : Modifier signatures, changer types, supprimer gestion d'erreurs

---

## 🔒 **VARIABLES D'ENVIRONNEMENT CRITIQUES**

| Variable | Format | Statut | Usage |
|----------|--------|--------|-------|
| `OPENAI_API_KEY` | `sk-...` | ✅ Configurée | Analyses GPT-4O |
| `PERPLEXITY_API_KEY` | `pplx-...` | ✅ Configurée | Actualités Sonar-Pro |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | ✅ Configurée | Fallback Claude-3-Sonnet |
| `GEMINI_API_KEY` | `AI...` | ✅ Configurée | Chatbot Emma |
| `TWELVE_DATA_API_KEY` | `...` | ⚠️ Optionnel | Fallback actualités |

---

## ❌ **INTERDICTIONS ABSOLUES**

### **Modèles et SDKs**
- ❌ Modifier `gpt-4o` → `gpt-5` (n'existe pas)
- ❌ Modifier `sonar-pro` → autre modèle Perplexity
- ❌ Modifier `gemini-2.0-flash-exp` → `gemini-1.5-flash`
- ❌ Utiliser SDK OpenAI au lieu de fetch() direct
- ❌ Changer `@google/generative-ai` → `@google/genai`

### **Paramètres**
- ❌ Modifier les températures sans test
- ❌ Changer les max_tokens sans validation
- ❌ Modifier les timeouts sans test
- ❌ Supprimer la gestion d'erreurs

### **Fonctionnalités**
- ❌ Ajouter Marketaux (supprimé intentionnellement)
- ❌ Désactiver Function Calling sans test
- ❌ Modifier les safety settings sans validation
- ❌ Changer les paramètres de validation

---

## 🔧 **DÉPANNAGE RAPIDE**

### **Erreurs Communes**
- **Demo-mode** = Clé API manquante dans Vercel
- **401 Unauthorized** = Clé API invalide/expirée
- **429 Too Many Requests** = Quota dépassé
- **Timeout** = Réduire max_tokens ou augmenter timeout
- **Function not found** = Vérifier l'export dans chat.js

### **Tests de Validation**
```bash
# Tester toutes les APIs
./test-all-apis.sh

# Tester OpenAI
curl -X POST https://gobapps.com/api/ai-services \
  -H "Content-Type: application/json" \
  -d '{"service": "openai", "prompt": "Test"}'

# Tester Perplexity
curl -X POST https://gobapps.com/api/ai-services \
  -H "Content-Type: application/json" \
  -d '{"service": "perplexity", "prompt": "Test"}'

# Tester Gemini
curl -X POST https://gobapps.com/api/gemini/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Test"}]}'
```

---

## 📋 **CHECKLIST AVANT MODIFICATION**

- [ ] **Backup** : Sauvegarder le fichier original
- [ ] **Test local** : Tester en local avec `vercel dev`
- [ ] **Validation** : Vérifier que les APIs fonctionnent
- [ ] **Documentation** : Mettre à jour ce fichier si nécessaire
- [ ] **Déploiement** : Déployer en staging avant production
- [ ] **Monitoring** : Surveiller les logs après déploiement

---

## 🚨 **EN CAS DE PROBLÈME**

1. **Revert immédiat** : `git revert <commit>`
2. **Vérifier les logs** : Vercel Dashboard → Functions → Logs
3. **Tester les APIs** : Utiliser `./test-all-apis.sh`
4. **Contacter l'équipe** : Si le problème persiste

---

**Dernière mise à jour** : 15 octobre 2025  
**Version** : 1.0  
**Statut** : Production ✅
