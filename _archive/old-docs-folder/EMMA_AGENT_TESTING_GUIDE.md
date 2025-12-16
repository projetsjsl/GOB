# 🧪 Guide de Test - Emma Agent 3 Modes

**Date:** 2025-10-16
**Objectif:** Valider que les 3 modes Emma Agent fonctionnent correctement

---

## 📋 TESTS À EFFECTUER

### ✅ Pré-requis
- [ ] Dashboard chargé sur https://gobapps.com (ou localhost)
- [ ] Console du navigateur ouverte (F12 → Console)
- [ ] Onglet Network ouvert pour voir les requêtes API

---

## 🧪 TEST 1: MODE CHAT (Ask Emma Chatbot)

### Objectif
Vérifier que Ask Emma retourne des réponses **conversationnelles naturelles**

### Étapes

1. **Aller sur l'onglet "Ask Emma"**

2. **Test 1.1: Question Simple sur Prix**
   ```
   Taper: "Quel est le prix d'Apple?"
   ```

   **Résultat Attendu:**
   ```
   Emma: "Le prix actuel d'Apple (AAPL) est de $245.67, en hausse de
   +2.34% (+$5.67) aujourd'hui. Le titre a ouvert à $240.00 et a atteint
   un maximum de $246.50..."

   **Sources:** Polygon Stock Price API
   ```

   **Vérifications:**
   - [ ] Réponse conversationnelle (pas de JSON brut)
   - [ ] Sources citées en bas
   - [ ] Données chiffrées présentes
   - [ ] Ton professionnel mais accessible

3. **Test 1.2: Question Analyse Complexe**
   ```
   Taper: "Analyse Apple en détail avec fondamentaux et technique"
   ```

   **Résultat Attendu:**
   - Réponse structurée avec sections
   - Données fondamentales (PE, EPS, ROE)
   - Analyse technique (RSI, MACD)
   - Recommandations
   - Sources citées

   **Vérifications:**
   - [ ] Réponse >= 500 mots
   - [ ] Sections claires (markdown)
   - [ ] Données réelles (pas inventées)
   - [ ] Outils Emma listés en sources

4. **Vérifier Console:**
   ```javascript
   // Devrait voir:
   🎯 Building prompt for mode: chat
   🤖 Emma Agent: Processing request: Quel est le prix d'Apple?
   🧠 Intent analysis: stock_price
   ✅ Intent analyzed: {intent: "stock_price", confidence: 0.95, ...}
   📋 Selected tools: ["polygon-stock-price"]
   ```

5. **Vérifier Network Tab:**
   ```
   POST /api/emma-agent
   Request Payload:
   {
     "message": "Quel est le prix d'Apple?",
     "context": {
       "output_mode": "chat"  // ← Devrait être "chat" par défaut
     }
   }

   Response:
   {
     "success": true,
     "response": "Le prix actuel d'Apple (AAPL) est de...",  // Texte conversationnel
     "output_mode": "chat",
     "tools_used": ["polygon-stock-price"]
   }
   ```

---

## 🧪 TEST 2: MODE DATA (Populate UI)

### Objectif
Vérifier que batch refresh retourne du **JSON structuré** au lieu de texte conversationnel

### Étapes

1. **Identifier le bouton "Emma Populate"**
   - Devrait être sur l'onglet JLab ou Watchlist
   - Ou utiliser la fonction `batchRefreshAllTabs()` dans la console

2. **Test 2.1: Batch Refresh Tous les Onglets**

   **Ouvrir Console et taper:**
   ```javascript
   // Appel direct de la fonction
   batchRefreshAllTabs()
   ```

   **Vérifications Console:**
   ```javascript
   🔄 Emma Agent Batch Refresh - START
   📊 Batch Refresh Contexts: {...}
   🎯 Building prompt for mode: data  // ← IMPORTANT: doit être "data"
   🔍 Validating JSON response...
   ✅ JSON validated successfully
   ✅ Emma Agent Batch Refresh - COMPLETED
   ```

3. **Test 2.2: Vérifier Payload Network**

   **Network Tab → POST /api/emma-agent:**
   ```json
   Request (JLab):
   {
     "message": "Récupérer prix, PE, volume, marketCap, EPS, ROE...",
     "context": {
       "output_mode": "data",  // ← CRITIQUE: doit être "data"
       "tickers": ["AAPL", "MSFT", "GOOGL"],
       "fields_requested": ["price", "pe", "volume", "marketCap"]
     }
   }

   Response:
   {
     "success": true,
     "response": {  // ← DOIT ÊTRE UN OBJET JSON, PAS UNE STRING
       "AAPL": {
         "price": 245.67,
         "pe": 32.4,
         "volume": 58234567,
         "marketCap": 3850000000000
       },
       "MSFT": {
         "price": 428.32,
         "pe": 38.1,
         "volume": 24567890,
         "marketCap": 3200000000000
       }
     },
     "output_mode": "data",
     "tools_used": ["polygon-stock-price", "fmp-fundamentals"]
   }
   ```

4. **Test 2.3: Vérifier Format JSON**

   **❌ MAUVAIS (conversationnel):**
   ```
   "response": "Voici les données pour Apple: le prix est de $245.67..."
   ```

   **✅ BON (JSON structuré):**
   ```json
   "response": {
     "AAPL": {
       "price": 245.67,
       "pe": 32.4
     }
   }
   ```

5. **Test 2.4: Valider Types de Données**
   ```javascript
   // Dans Console, après batch refresh:
   console.log(typeof jlab.response);  // Devrait être "object" ou "string" contenant JSON

   // Si c'est une string, parser:
   const data = JSON.parse(jlab.response);
   console.log(data.AAPL.price);  // Devrait être NUMBER: 245.67
   console.log(typeof data.AAPL.price);  // Devrait être "number"
   ```

---

## 🧪 TEST 3: MODE BRIEFING (Emma En Direct)

### Objectif
Vérifier que les briefings retournent des **analyses détaillées** (1500-2000 mots) au lieu de réponses courtes

### Étapes

1. **Aller sur l'onglet "Emma En Direct"**

2. **Test 3.1: Générer Briefing du Soir**

   **Cliquer sur:** 🌙 Rapport de Clôture

   **Observer le Spinner avec Étapes:**
   ```
   [Spinner] ÉTAPE 0/4: Analyse de l'Intent
             Emma analyse l'actualité du jour et détecte les sujets importants...

   [Spinner] ÉTAPE 0/4: Analyse de l'Intent
             Intent détecté: market_overview (Confiance: 85%, Importance: 6/10)

   [Spinner] ÉTAPE 1/4: Collecte de Données
             Emma récupère les données avec les outils recommandés:
             polygon-stock-price, finnhub-news...

   [Spinner] ÉTAPE 1/4: Collecte de Données
             Données collectées avec 2 outils: polygon-stock-price, finnhub-news

   [Spinner] ÉTAPE 2/4: Sélection du Contenu
             Emma décide quelles sections inclure dans le briefing...

   [Spinner] ÉTAPE 2/4: Sélection du Contenu
             4 sections sélectionnées pour l'email

   [Spinner] ÉTAPE 3/4: Génération Adaptative
             Perplexity rédige le briefing avec le prompt adapté au contexte...

   [Spinner] ÉTAPE 4/4: Création du Preview
             Génération du HTML et préparation de l'aperçu...

   ✅ Briefing généré avec succès!
      Analyse cognitive complétée en 45s
   ```

3. **Test 3.2: Vérifier Metadata Cognitive**

   **Devrait Voir:**
   ```
   ┌────────────────────────────────────────────────────────┐
   │ 🧠 Analyse Cognitive Emma                              │
   │                                                         │
   │ [Intent: market_overview] [Confiance: 85%]            │
   │ [Importance: 6/10] [Style: casual]                     │
   │                                                         │
   │ 🔥 Sujets du moment:                                    │
   │ • Indices stables après séance mixte                    │
   │ • Dollar légèrement en hausse                           │
   │                                                         │
   │ 🔧 Outils Emma Agent utilisés:                          │
   │ polygon-stock-price  finnhub-news                       │
   │                                                         │
   │ 💡 Journée calme sans événements majeurs               │
   └────────────────────────────────────────────────────────┘
   ```

4. **Test 3.3: Vérifier Contenu Email**

   **Dans l'iframe preview, vérifier:**
   - [ ] Longueur >= 1500 mots
   - [ ] Structure Markdown avec titres (##, ###)
   - [ ] Sections:
     - [ ] Résumé Exécutif
     - [ ] Performance du Jour
     - [ ] Analyse Fondamentale
     - [ ] Analyse Technique
     - [ ] Actualités et Catalyseurs
     - [ ] Recommandations
   - [ ] Données chiffrées (prix, %, volumes)
   - [ ] Émojis appropriés (📊, 📈, ⚠️)
   - [ ] Sources citées en bas

5. **Test 3.4: Vérifier Logs Console**
   ```javascript
   🧠 COGNITIVE BRIEFING START: {type: "evening", loading: false}
   🧠 ÉTAPE 0: Intent Analysis START
   ✅ Intent Analysis: {intent: "market_overview", confidence: 0.85, ...}
   📊 ÉTAPE 1: Smart Data Gathering START
   🎯 Building prompt for mode: data  // ← Pour collecte données
   ✅ Smart Data gathered: ["polygon-stock-price", "finnhub-news"]
   🎯 ÉTAPE 2: Content Selection START
   ✅ Sections sélectionnées: 4
   ✍️ ÉTAPE 3: Build Adaptive Prompt START
   🎯 Building prompt for mode: briefing  // ← CRITIQUE: devrait être "briefing" ici
   ✅ Adaptive Prompt built: 2847 chars
   ✅ Perplexity Analysis complétée
   ✅ COGNITIVE BRIEFING COMPLETE
   ```

6. **Test 3.5: Vérifier Network - Appel Perplexity**

   **Network Tab → POST /api/ai-services:**
   ```json
   Request:
   {
     "service": "perplexity",
     "prompt": "Tu es Emma Financial Analyst. Rédige une analyse approfondie...",
     "section": "cognitive-analysis",
     "model": "sonar-reasoning-pro",
     "max_tokens": 3000
   }

   Response:
   {
     "success": true,
     "content": "## 📊 Rapport de Clôture - 16 octobre 2025\n\n**Résumé Exécutif:**...",
     "model": "sonar-reasoning-pro"
   }
   ```

---

## 🐛 TESTS D'ERREUR

### Test Erreur 1: Mode DATA Retourne Conversationnel

**Symptôme:**
```json
{
  "response": "Voici le prix d'Apple: $245.67, Microsoft: $428.32..."  // ❌ String conversationnelle
}
```

**Cause:** Prompt mode DATA pas utilisé ou Perplexity ignore instructions

**Fix:**
1. Vérifier que `context.output_mode === 'data'` dans request
2. Vérifier console: `🎯 Building prompt for mode: data`
3. Si pas "data", vérifier code dashboard (ligne 860)

### Test Erreur 2: Mode BRIEFING Trop Court

**Symptôme:**
- Email < 500 mots
- Pas de structure Markdown
- Réponse conversationnelle courte

**Cause:** Prompt mode BRIEFING pas utilisé

**Fix:**
1. Vérifier que `adaptivePrompt` utilise bien `buildBriefingPrompt()`
2. Vérifier console: `🎯 Building prompt for mode: briefing`
3. Vérifier que `service: 'perplexity'` (pas Emma Agent) pour génération finale

### Test Erreur 3: Intent Analysis Échoue

**Symptôme:**
```javascript
❌ Intent Analysis error: ...
```

**Cause:** Perplexity API key manquante ou erreur réseau

**Fix:**
1. Vérifier `.env`: `PERPLEXITY_API_KEY=pplx-...`
2. Vérifier logs Vercel si déployé
3. Fallback devrait activer: `intent: 'market_overview', confidence: 0.5`

---

## 📊 CHECKLIST VALIDATION FINALE

### Mode CHAT ✅
- [ ] Réponse conversationnelle naturelle
- [ ] Sources citées
- [ ] Pas de JSON brut visible
- [ ] Console montre: `mode: chat`

### Mode DATA ✅
- [ ] Réponse JSON structuré
- [ ] Format: `{"TICKER": {"field": value}}`
- [ ] Valeurs numériques en NUMBER (pas STRING)
- [ ] Console montre: `mode: data`
- [ ] Aucun texte conversationnel

### Mode BRIEFING ✅
- [ ] Analyse >= 1500 mots
- [ ] Structure Markdown claire
- [ ] 5+ sections avec titres
- [ ] Données chiffrées présentes
- [ ] Sources citées en bas
- [ ] Metadata cognitive affichée
- [ ] Console montre: `mode: briefing` (pour prompt final)

---

## 🚀 APRÈS LES TESTS

### Si tous les tests passent ✅
1. Créer onglet Earnings Calendar avancé
2. Vérifier onglet Calendrier existant
3. Planifier refactoring dashboard

### Si des tests échouent ❌
1. Noter exactement quel test échoue
2. Copier logs console complets
3. Copier request/response Network
4. Partager pour debug

---

## 📝 TEMPLATE RAPPORT DE TEST

```markdown
## Test Mode CHAT
- [ ] Test 1.1: Prix simple - ✅ PASS / ❌ FAIL
  - Détails si FAIL: _____

- [ ] Test 1.2: Analyse complexe - ✅ PASS / ❌ FAIL
  - Détails si FAIL: _____

## Test Mode DATA
- [ ] Test 2.1: Batch refresh - ✅ PASS / ❌ FAIL
  - Détails si FAIL: _____

- [ ] Test 2.2: Format JSON - ✅ PASS / ❌ FAIL
  - Détails si FAIL: _____

## Test Mode BRIEFING
- [ ] Test 3.1: Génération - ✅ PASS / ❌ FAIL
  - Détails si FAIL: _____

- [ ] Test 3.2: Metadata - ✅ PASS / ❌ FAIL
  - Détails si FAIL: _____

- [ ] Test 3.3: Contenu >= 1500 mots - ✅ PASS / ❌ FAIL
  - Détails si FAIL: _____

## Logs Console (copier ici)
```

---

**Auteur:** Claude Code
**Date:** 2025-10-16
**Version:** 1.0
