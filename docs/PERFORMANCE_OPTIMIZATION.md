# ⚡ Optimisation Performance Emma SMS

## 📊 Délai Actuel: ~13-14 secondes

### Breakdown détaillé:
```
1. Webhook Twilio                        ~100ms   (0,8%)
2. User/Conversation Manager             ~350ms   (2,7%)
3. Watchlist + Team tickers              ~200ms   (1,5%)
   ├─ Sous-total pré-Emma:               ~650ms   (5%)
4. Intent Analysis (Perplexity)          ~1200ms  (9%)
5. Tool Execution (8 outils)             ~2500ms  (19%)
6. Perplexity Response Generation        ~8000ms  (62%) ⚠️ BOTTLENECK
7. Channel Adapter                       ~100ms   (0,8%)
8. SMS Send (Twilio)                     ~400ms   (3%)
   └─ TOTAL:                             ~13.0s
```

---

## 🎯 Stratégies d'Optimisation

### **PRIORITÉ 1: Réduire Perplexity (8s → 4-5s) = -3-4s**

#### **Option 1A: Réduire max_tokens (FACILE)**
**Actuel:**
- Mode chat: 1000-2000 tokens selon complexité
- Génération: ~8s

**Optimisé:**
```javascript
// Pour SMS uniquement
if (context.user_channel === 'sms') {
  maxTokens = 800;  // -25% tokens = -25% temps
  // Passage de ~8s à ~6s (-2s)
}
```

**Gain:** **-2 secondes** (25% réduction)

**Trade-off:** Réponses légèrement plus courtes (OK pour SMS)

---

#### **Option 1B: Streaming Response (MOYEN)**
**Concept:** Envoyer SMS dès que premiers 1000 chars générés

**Implémentation:**
```javascript
// Perplexity supporte streaming
const response = await fetch('https://api.perplexity.ai/chat/completions', {
  body: JSON.stringify({
    ...requestBody,
    stream: true  // Activer streaming
  })
});

let buffer = '';
let firstSmsSent = false;

for await (const chunk of response.body) {
  buffer += chunk;

  // Dès que 1500 chars disponibles, envoyer premier SMS
  if (!firstSmsSent && buffer.length >= 1500) {
    await sendSMS(userPhone, buffer);
    firstSmsSent = true;
  }
}

// Envoyer suite si > 1500 chars
if (buffer.length > 1500) {
  await sendSMS(userPhone, buffer.slice(1500));
}
```

**Gain:** **-3-4 secondes** perçues (utilisateur reçoit 1er SMS plus vite)

**Trade-off:** Complexité code, découpage moins optimal

---

#### **Option 1C: Cache intelligent (DIFFICILE)**
**Concept:** Cache réponses Perplexity pour questions similaires

**Implémentation:**
```javascript
// Cache key: ticker + intent + date
const cacheKey = `perplexity:${ticker}:${intent}:${today}`;

// Check cache Redis/Supabase
const cached = await getCache(cacheKey);
if (cached && cached.timestamp > Date.now() - 3600000) { // 1h
  return cached.response; // Instantané!
}

// Sinon, appel Perplexity normal
const response = await callPerplexity(...);

// Save cache (1h TTL)
await setCache(cacheKey, response, 3600);
```

**Gain:** **-8 secondes** pour requêtes en cache (instantané)

**Trade-off:**
- Infrastructure Redis nécessaire
- Freshness des données (1h cache)
- Coût infrastructure

---

### **PRIORITÉ 2: Optimiser Tool Execution (2,5s → 1,5s) = -1s**

#### **Option 2A: Réduire nombre d'outils (FACILE)**
**Actuel:** 8 outils systématiques pour analyse complète

**Optimisé:**
```javascript
// SMS mode: 5 outils essentiels seulement
if (context.user_channel === 'sms') {
  essentialTools = [
    'fmp-quote',         // Prix (300ms)
    'fmp-fundamentals',  // Profil (400ms)
    'fmp-ratios',        // Ratios (350ms)
    'fmp-ticker-news',   // News (450ms)
    'fmp-ratings'        // Consensus (350ms)
  ];
  // Total: ~1850ms vs 2500ms
}
```

**Gain:** **-650ms** (26% réduction)

**Trade-off:** Moins de données (OK pour SMS court)

---

#### **Option 2B: Batch API calls (MOYEN)**
**Concept:** Regrouper appels FMP en 1 requête

**Implémentation:**
```javascript
// Au lieu de 5 appels séparés:
// /quote, /profile, /ratios, /news, /rating

// Utiliser endpoint batch FMP (si existe):
const response = await fetch(`/api/fmp?batch=quote,profile,ratios,news,rating&symbol=${ticker}`);

// Ou créer notre propre batch endpoint:
// /api/marketdata/batch?symbol=MSFT&endpoints=all
```

**Gain:** **-500ms** (latence réseau réduite)

**Trade-off:** Complexité backend

---

### **PRIORITÉ 3: Intent Analysis (1,2s → 0,5s) = -700ms**

#### **Option 3A: Intent local regex (FACILE)**
**Concept:** Détecter intents simples sans LLM

**Implémentation:**
```javascript
// Détection rapide locale (50ms au lieu de 1200ms)
function quickIntentDetection(message) {
  const msgLower = message.toLowerCase();

  // Patterns simples
  if (/analyse|analysis/.test(msgLower)) {
    return { intent: 'comprehensive_analysis', confidence: 0.9 };
  }
  if (/prix|price|cours/.test(msgLower)) {
    return { intent: 'price_check', confidence: 0.95 };
  }
  if (/news|actualit|nouvelles/.test(msgLower)) {
    return { intent: 'news', confidence: 0.9 };
  }

  // Fallback: Intent analysis Perplexity
  return await analyzeIntentWithLLM(message);
}
```

**Gain:** **-1150ms** pour 70% des requêtes simples

**Trade-off:** Moins précis pour queries complexes

---

#### **Option 3B: Désactiver intent analysis (SMS) (TRÈS FACILE)**
**Concept:** Pour SMS, assumer toujours "comprehensive_analysis"

**Implémentation:**
```javascript
if (context.user_channel === 'sms') {
  // Skip intent analysis, assume comprehensive
  intentData = {
    intent: 'comprehensive_analysis',
    confidence: 1.0,
    tickers: extractTickersRegex(message)
  };
}
```

**Gain:** **-1200ms** (100% des requêtes SMS)

**Trade-off:** Perte de granularité (acceptable pour SMS)

---

### **PRIORITÉ 4: Database queries (350ms → 150ms) = -200ms**

#### **Option 4A: Cache user/conversation (FACILE)**
**Implémentation:**
```javascript
// Cache in-memory (30 min TTL)
const userCache = new Map();

async function getUser(phone) {
  const cached = userCache.get(phone);
  if (cached && cached.timestamp > Date.now() - 1800000) {
    return cached.data;
  }

  const user = await fetchUserFromSupabase(phone);
  userCache.set(phone, { data: user, timestamp: Date.now() });
  return user;
}
```

**Gain:** **-200ms** pour utilisateurs actifs

**Trade-off:** Mémoire serveur

---

## 📊 Résumé des Gains Cumulatifs

### **Quick Wins (Facile, 1-2h implémentation):**
| Optimisation | Gain | Difficulté | Priorité |
|--------------|------|------------|----------|
| Réduire max_tokens SMS | **-2s** | ⭐ Facile | 🔴 Haute |
| Réduire outils SMS (8→5) | **-650ms** | ⭐ Facile | 🔴 Haute |
| Intent local SMS | **-1200ms** | ⭐ Facile | 🔴 Haute |
| **TOTAL QUICK WINS** | **-3,85s** | 1-2h | **29% amélioration** |

**Résultat:** **13s → 9,15s** ✅

---

### **Medium Wins (Moyen, 1 jour):**
| Optimisation | Gain | Difficulté | Priorité |
|--------------|------|------------|----------|
| Batch FMP API calls | **-500ms** | ⭐⭐ Moyen | 🟡 Moyenne |
| User/Conversation cache | **-200ms** | ⭐⭐ Moyen | 🟡 Moyenne |
| **TOTAL MEDIUM WINS** | **-700ms** | 1 jour | **5% amélioration** |

**Résultat cumulé:** **13s → 8,45s** ✅

---

### **Advanced Wins (Difficile, 1 semaine):**
| Optimisation | Gain | Difficulté | Priorité |
|--------------|------|------------|----------|
| Streaming response | **-3-4s** perçu | ⭐⭐⭐ Difficile | 🔵 Basse |
| Cache Perplexity (Redis) | **-8s** (cache hit) | ⭐⭐⭐ Difficile | 🔵 Basse |

---

## 🚀 Plan d'Implémentation Recommandé

### **Phase 1: Quick Wins (Aujourd'hui, 1-2h)**
1. ✅ Réduire max_tokens pour SMS (800 au lieu de 1000-2000)
2. ✅ Réduire outils à 5 essentiels pour SMS
3. ✅ Désactiver intent analysis LLM pour SMS (assume comprehensive)

**Impact:** **13s → 9,15s (-30%)**

### **Phase 2: Medium Wins (Cette semaine)**
4. Créer endpoint `/api/marketdata/batch`
5. Implémenter cache user/conversation (in-memory)

**Impact:** **9,15s → 8,45s (-35% total)**

### **Phase 3: Advanced Wins (Plus tard si nécessaire)**
6. Streaming response Perplexity
7. Cache Redis pour réponses Perplexity

**Impact:** **8,45s → 4-5s (-60% total)** ou instantané si cache

---

## 💻 Code Changes (Phase 1 - Quick Wins)

### **1. Réduire max_tokens SMS**

**Fichier:** `api/emma-agent.js` (ligne ~1590-1608)

```javascript
// AVANT:
if (outputMode === 'chat') {
  complexityInfo = this._detectComplexity(userMessage, intentData, toolResults);
  maxTokens = complexityInfo.tokens; // 1000-2000
}

// APRÈS:
if (outputMode === 'chat') {
  if (context.user_channel === 'sms') {
    maxTokens = 800; // ⚡ SMS: réponse plus courte OK
    console.log('📱 SMS mode: 800 tokens (optimized for speed)');
  } else {
    complexityInfo = this._detectComplexity(userMessage, intentData, toolResults);
    maxTokens = complexityInfo.tokens;
  }
}
```

---

### **2. Réduire outils pour SMS**

**Fichier:** `api/emma-agent.js` (ligne ~200-234)

```javascript
// APRÈS la détection d'intention, avant sélection outils:

// ⚡ SMS MODE: 5 outils essentiels uniquement (optimisation performance)
if (context.user_channel === 'sms' && tickers.length > 0) {
  console.log('📱 SMS mode: Using 5 essential tools (optimized)');

  const SMS_ESSENTIAL_TOOLS = [
    'fmp-quote',         // Prix temps réel
    'fmp-fundamentals',  // Profil compagnie
    'fmp-ratios',        // Ratios financiers
    'fmp-ticker-news',   // Actualités
    'fmp-ratings'        // Consensus analystes
  ];

  selectedTools = SMS_ESSENTIAL_TOOLS
    .map(id => this.toolsConfig.tools.find(t => t.id === id))
    .filter(t => t && t.enabled);

  console.log(`⚡ Selected ${selectedTools.length} tools for SMS (fast mode)`);
} else {
  // Logic existante (8 outils pour web/email)
  selectedTools = this.selectTools(extracted, intentData, context);
}
```

---

### **3. Intent local pour SMS**

**Fichier:** `api/emma-agent.js` (ligne ~70-100)

```javascript
// AVANT l'appel HybridIntentAnalyzer:

// ⚡ SMS MODE: Intent detection ultra-rapide (regex local)
if (context.user_channel === 'sms') {
  console.log('📱 SMS mode: Using fast local intent detection');

  const extracted = this.extractLocalInfo(userMessage);

  // Assume toujours comprehensive_analysis pour SMS
  intentData = {
    intent: 'comprehensive_analysis',
    confidence: 1.0,
    tickers: extracted.tickers,
    suggested_tools: [],
    user_intent_summary: `Analyse complète de ${extracted.tickers.join(', ')}`,
    recency_filter: 'week',
    execution_time_ms: 10, // Ultra-rapide!
    analysis_method: 'local_regex'
  };

  console.log(`⚡ Local intent: ${intentData.tickers.length} tickers (10ms)`);
} else {
  // Logic existante (HybridIntentAnalyzer pour web)
  intentData = await this.intentAnalyzer.analyze(userMessage, context);
}
```

---

## 📈 Résultats Attendus

### **Avant optimisation:**
```
SMS: "Analyse MSFT"
  ⏱️ Délai: ~13 secondes
  💰 Coût: 8 API calls FMP + 2 Perplexity
```

### **Après Phase 1 (Quick Wins):**
```
SMS: "Analyse MSFT"
  ⏱️ Délai: ~9 secondes (-30%) ⚡
  💰 Coût: 5 API calls FMP + 1 Perplexity (-40% coût)
```

### **Après Phase 2 (Medium Wins):**
```
SMS: "Analyse MSFT"
  ⏱️ Délai: ~8,5 secondes (-35%) ⚡⚡
  💰 Coût: 1 batch FMP + 1 Perplexity (-60% coût)
```

---

## ⚠️ Trade-offs à Considérer

### **✅ Acceptable pour SMS:**
- Réponses légèrement plus courtes (800 tokens vs 2000)
- 5 outils au lieu de 8 (données essentielles couvertes)
- Intent analysis simplifié (comprehensive par défaut)

### **❌ Impact sur Web/Email:**
- Aucun! Optimisations SMS uniquement
- Web/Email gardent la qualité maximale (8 outils, 2000 tokens)

---

## 🎯 Recommandation Finale

**Implémenter Phase 1 (Quick Wins) AUJOURD'HUI:**
- 1-2h de travail
- **-30% latence** (13s → 9s)
- **-40% coût API**
- Aucun trade-off significatif
- Utilisateur satisfait (9s reste acceptable, et grosse amélioration vs 13s)

**Phase 2 si besoin d'aller plus loin:**
- Batch API + cache
- **-35% latence total** (13s → 8,5s)

---

**Auteur:** Claude Code
**Date:** 5 novembre 2025
**Version:** 1.0
