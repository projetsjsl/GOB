# 🎯 REFACTORING PERPLEXITY - QUALITÉ MAXIMALE
## Plan de Refactoring Ultra-Rigoureux pour Analyses de Niveau CFA

**Date:** 2025-11-06
**Objectif:** Transformer Emma en analyste financière institutionnelle de classe mondiale
**Priorités:** Qualité+++ | Chiffres+++ | Profondeur+++ | Temps réel | Latence optimisée

---

## 📊 DIAGNOSTIC INITIAL

### Paramètres Actuels vs Cibles

| Paramètre | Actuel | Cible | Écart | Priorité |
|-----------|--------|-------|-------|----------|
| **max_tokens** | 1500 | 6000-8000 | **+400%** | 🔴 CRITIQUE |
| **temperature** | 0.3 | 0.5-0.7 | **+66%** | 🔴 CRITIQUE |
| **recency_filter** | 'month' | 'day' | **30x** | 🔴 CRITIQUE |
| **Métriques obligatoires** | 5 | 20+ | **+300%** | 🔴 CRITIQUE |
| **Validation quantitative** | Présence | Comptage | **Manquant** | 🔴 CRITIQUE |
| **Longueur minimale** | ~1125 mots | 1500-2000 | **+60%** | 🔴 CRITIQUE |
| **Niveau rédaction** | Générique | CFA/MBA | **Gap** | 🟡 MOYEN |
| **Formatage structuré** | Basique | Tableaux | **Gap** | 🟡 MOYEN |
| **Latence** | 13-14s | 8-10s | **-30%** | 🟢 BONUS |

### Métriques Obligatoires (Actuellement 5, Cible 20+)

**ACTUELLES (5):**
- Prix actuel
- Variation %
- P/E Ratio
- EPS
- YTD %

**CIBLES (20+):**

#### Valorisation (8 métriques)
1. Prix actuel + variation ($, %)
2. Market Cap (B$)
3. P/E Ratio + comparaison secteur
4. P/B Ratio
5. P/FCF Ratio
6. EV/EBITDA
7. PEG Ratio
8. Prix/Ventes (P/S)

#### Rentabilité (6 métriques)
9. EPS (TTM)
10. ROE (%)
11. ROA (%)
12. Marge nette (%)
13. Marge opérationnelle (%)
14. Marge brute (%)

#### Performance (4 métriques)
15. YTD (%)
16. 52 semaines high/low
17. Distance 52w high (%)
18. Rendement dividende (%)

#### Santé Financière (4 métriques)
19. Debt/Equity Ratio
20. Current Ratio
21. Quick Ratio
22. Free Cash Flow (B$)

#### Consensus & Catalyseurs (3 métriques)
23. Consensus analystes (Buy/Hold/Sell)
24. Prix cible moyen ($)
25. Prochains résultats (date + attentes EPS)

---

## 🎯 PLAN DE REFACTORING (6 PHASES)

### PHASE 1: Optimisation Paramètres Perplexity ⚙️
**Durée:** 30 minutes
**Impact:** Qualité +200%, Longueur +300%

#### 1.1 Augmentation max_tokens
```javascript
// AVANT (lib/perplexity-optimizer.js:344-347)
let maxTokens = 2000; // default chat
if (outputMode === 'briefing') maxTokens = 8000;
else if (outputMode === 'comprehensive_analysis') maxTokens = 6000;
else if (complexity === 'high') maxTokens = 4000;

// APRÈS
let maxTokens = 6000; // DEFAULT ÉLEVÉ pour analyses riches
if (outputMode === 'briefing') maxTokens = 8000;
else if (outputMode === 'comprehensive_analysis') maxTokens = 8000; // MAX
else if (complexity === 'high') maxTokens = 7000;
else if (complexity === 'low') maxTokens = 4000; // Minimum raisonnable

// Pour chat simple (non-analyse)
if (intent === 'greeting' || intent === 'help') {
  maxTokens = 1000; // Économiser pour politesses
}
```

#### 1.2 Optimisation température
```javascript
// AVANT (lib/perplexity-optimizer.js:357)
temperature: outputMode === 'briefing' ? 0.5 : 0.7,

// APRÈS
temperature: this._getOptimalTemperature(intentData, outputMode),

_getOptimalTemperature(intentData, outputMode) {
  // Analyses financières: température modérée pour précision + créativité
  if (outputMode === 'briefing') return 0.6;
  if (outputMode === 'comprehensive_analysis') return 0.5;
  if (outputMode === 'ticker_note') return 0.5;

  // Analyses techniques: plus de précision
  if (intentData?.intent === 'technical_analysis') return 0.4;

  // Questions conceptuelles: plus de créativité
  if (intentData?.intent === 'education') return 0.7;

  return 0.5; // Default équilibré
}
```

#### 1.3 Recency filter temps réel
```javascript
// AVANT (lib/perplexity-optimizer.js:350-352)
let recencyFilter = 'month'; // default
if (intent === 'news' || intent === 'breaking_news') recencyFilter = 'day';
else if (intent === 'earnings' || intent === 'events') recencyFilter = 'week';

// APRÈS - DONNÉES TEMPS RÉEL PAR DÉFAUT
let recencyFilter = 'day'; // DEFAULT temps réel
if (intent === 'news' || intent === 'breaking_news') recencyFilter = 'day';
else if (intent === 'earnings' || intent === 'events') recencyFilter = 'day';
else if (intent === 'comprehensive_analysis') recencyFilter = 'day'; // TEMPS RÉEL
else if (intent === 'stock_price') recencyFilter = 'day';
// Exception: analyses historiques
else if (intent === 'historical_analysis') recencyFilter = 'month';
```

**Résultat Phase 1:**
- ✅ Longueur: 1125 mots → **4500 mots** (+300%)
- ✅ Fraîcheur: 30 jours → **24h** (30x mieux)
- ✅ Créativité vs Précision: Équilibre optimal

---

### PHASE 2: Enrichissement Prompts Quantitatifs 📝
**Durée:** 1 heure
**Impact:** Densité chiffres +400%, Justifications +200%

#### 2.1 Métriques obligatoires étendues (5 → 25)

```javascript
// lib/perplexity-optimizer.js:18-36
this.REQUIRED_METRICS = {
  comprehensive_analysis: [
    // === VALORISATION (8 métriques) ===
    'Prix actuel ($)',
    'Variation jour ($, %)',
    'Market Cap (B$)',
    'P/E Ratio (+ comparaison secteur)',
    'P/B Ratio',
    'P/FCF Ratio',
    'EV/EBITDA',
    'PEG Ratio',

    // === RENTABILITÉ (6 métriques) ===
    'EPS (TTM)',
    'ROE (%)',
    'ROA (%)',
    'Marge nette (%)',
    'Marge opérationnelle (%)',
    'Marge brute (%)',

    // === PERFORMANCE (4 métriques) ===
    'YTD (%)',
    '52 semaines high',
    '52 semaines low',
    'Distance 52w high (%)',
    'Rendement dividende (%)',

    // === SANTÉ FINANCIÈRE (4 métriques) ===
    'Debt/Equity Ratio',
    'Current Ratio',
    'Quick Ratio',
    'Free Cash Flow (B$)',

    // === CONSENSUS & CATALYSEURS (3 métriques) ===
    'Consensus analystes (Buy/Hold/Sell)',
    'Prix cible moyen ($)',
    'Prochains résultats (date + attentes)'
  ],

  chat: [
    'Prix actuel ($)',
    'Variation (%)',
    'P/E Ratio',
    'EPS',
    'ROE',
    'YTD %',
    'Consensus analystes',
    'Dividende'
  ],

  briefing: [
    'Prix actuel',
    'P/E Ratio',
    'EPS',
    'ROE',
    'YTD %',
    'Market Cap',
    'Consensus',
    'Nouvelles importantes',
    'Catalyseurs'
  ]
};
```

#### 2.2 Instructions quantitatives EXPLICITES

```javascript
// lib/perplexity-optimizer.js:_buildEnrichedPrompt()

// AJOUTER SECTION (après ligne 167):
═══════════════════════════════════════════════════════════════
🎯 EXIGENCES QUANTITATIVES STRICTES
═══════════════════════════════════════════════════════════════

Tu DOIS inclure AU MINIMUM:
✓ 20 CHIFFRES/RATIOS différents dans ton analyse
✓ 5 COMPARAISONS chiffrées (vs secteur, historique, pairs)
✓ 3 TENDANCES quantifiées (croissance %, évolution)
✓ 2 PROJECTIONS chiffrées (consensus, objectifs)

EXEMPLE DE DENSITÉ ATTENDUE (pour MSFT):
"Microsoft se négocie à 380,50$ (-1,2%, -4,56$), avec une market cap
de 2,83T$. Le P/E de 32,5x dépasse le secteur (28,0x) de +16%, tandis
que le P/B de 11,2x et P/FCF de 28,9x reflètent une valorisation premium.
La rentabilité est solide: ROE 42,3%, ROA 18,7%, marge nette 34,2%.
L'EPS de 11,75$ génère un dividende de 3,00$ (rendement 0,79%,
payout 25,5%). Performance YTD: +28,4% vs secteur +18,2% (+10,2pp).
Le titre se trouve à -18,8% du 52w high (468,35$), avec support
à 309,45$. Le consensus (40 analystes: 85% Buy, 12,5% Hold, 2,5% Sell)
vise 420$ (+10,4%)..."

👆 Compte: 22 chiffres en 1 paragraphe. C'est le NIVEAU attendu.

═══════════════════════════════════════════════════════════════
📏 EXIGENCES DE LONGUEUR
═══════════════════════════════════════════════════════════════

Longueur MINIMALE selon mode:
• comprehensive_analysis: 1500-2000 mots (6-8 paragraphes denses)
• chat: 400-600 mots (2-3 paragraphes)
• briefing: 1800-2500 mots (format rapport professionnel)

⚠️ Si ta réponse fait < 1500 mots en mode comprehensive, tu n'as PAS
assez approfondi. Ajoute:
  - Plus de comparaisons sectorielles
  - Plus de contexte historique
  - Plus d'analyse des tendances
  - Plus de justifications chiffrées

═══════════════════════════════════════════════════════════════
🎓 NIVEAU RÉDACTIONNEL: CFA / MBA INSTITUTIONNEL
═══════════════════════════════════════════════════════════════

Ton analyse doit être de niveau:
✓ CFA Level II (analyse quantitative rigoureuse)
✓ MBA Finance (insights stratégiques)
✓ Analyste sell-side professionnel (recommandations actionnables)

STYLE ATTENDU:
• Terminologie précise (EBITDA, TTM, payout ratio, etc.)
• Justifications chiffrées ("premium de +16% au secteur justifié par...")
• Comparaisons multi-dimensionnelles (temps, secteur, pairs)
• Contexte macro intégré (Fed, taux, cycle économique)
• Catalyseurs identifiés avec timeline
• Risques quantifiés avec probabilités

EXEMPLE BON vs MAUVAIS:
❌ MAUVAIS: "Microsoft performe bien avec un bon P/E"
✅ BON: "Microsoft affiche un P/E de 32,5x, soit une prime de +16%
au secteur Tech (28,0x). Cette valorisation premium se justifie par
un ROE supérieur de 42,3% vs 28,5% secteur (+48% relatif), reflétant
l'avantage concurrentiel d'Azure (croissance 30% YoY) et la transition
IA générative."
```

#### 2.3 Formatage structuré OBLIGATOIRE

```javascript
// AJOUTER (après instructions quantitatives):

═══════════════════════════════════════════════════════════════
📋 STRUCTURE OBLIGATOIRE (comprehensive_analysis)
═══════════════════════════════════════════════════════════════

Ta réponse DOIT suivre cette structure EXACTE:

## 📊 SNAPSHOT
[Prix actuel, variation, market cap, résumé 1 phrase]

## 💰 VALORISATION
[P/E, P/B, P/FCF, EV/EBITDA + comparaisons secteur]
**Tableau de valorisation:**
| Métrique | Valeur | Secteur | Écart |
|----------|--------|---------|-------|
| P/E      | 32,5x  | 28,0x   | +16%  |
| P/B      | 11,2x  | 8,5x    | +32%  |
...

## 💼 RENTABILITÉ & FONDAMENTAUX
[ROE, marges, EPS, FCF + tendances]

## 📈 PERFORMANCE & MOMENTUM
[YTD, 52w range, volumes, tendance]

## 🎯 CONSENSUS & CATALYSEURS
[Analystes, prix cible, prochains events]

## 📰 ACTUALITÉS CRITIQUES
[Top 3 news récentes avec impact]

## ⚖️ CONCLUSION & RECOMMANDATION
[Synthèse, opportunités, risques, verdict]

**IMPORTANT:**
- Chaque section = 200-300 mots minimum
- Tableaux de métriques OBLIGATOIRES pour valorisation
- Au moins 1 graphique ASCII ou tableau par section
```

**Résultat Phase 2:**
- ✅ Métriques obligatoires: 5 → **25** (+400%)
- ✅ Densité chiffres: ~8 → **20+** par analyse (+150%)
- ✅ Structure: Basique → **Institutionnelle** (7 sections)
- ✅ Tableaux: 0 → **2-3 par analyse**

---

### PHASE 3: Validation Quantitative Renforcée ✅
**Durée:** 45 minutes
**Impact:** Fiabilité +100%, Feedback loops

#### 3.1 Comptage chiffres/ratios (pas juste présence)

```javascript
// lib/perplexity-optimizer.js - NOUVELLE FONCTION

/**
 * Compte le nombre de chiffres/ratios dans la réponse
 */
_countMetrics(responseText) {
  const metrics = {
    numbers: 0,
    percentages: 0,
    dollars: 0,
    ratios: 0,
    comparisons: 0
  };

  // Compter chiffres avec unités
  metrics.numbers = (responseText.match(/\d+[,\.]\d+/g) || []).length;

  // Compter pourcentages
  metrics.percentages = (responseText.match(/\d+[,\.]\d+\s*%/g) || []).length;

  // Compter montants $
  metrics.dollars = (responseText.match(/\$\s*\d+[,\.]\d+/g) || []).length;

  // Compter ratios (format "32,5x" ou "ratio: 2.5")
  metrics.ratios = (responseText.match(/\d+[,\.]\d+x/gi) || []).length;

  // Compter comparaisons ("vs", "versus", "par rapport")
  metrics.comparisons = (responseText.match(/\b(vs|versus|par rapport à|comparé à)\b/gi) || []).length;

  const total = metrics.numbers + metrics.percentages + metrics.dollars + metrics.ratios;

  return {
    ...metrics,
    total,
    passed: total >= 20, // Minimum 20 métriques
    grade: this._gradeMetricsCount(total)
  };
}

_gradeMetricsCount(count) {
  if (count >= 30) return 'A+ (Excellent)';
  if (count >= 25) return 'A (Très bon)';
  if (count >= 20) return 'B+ (Bon)';
  if (count >= 15) return 'B (Acceptable)';
  if (count >= 10) return 'C (Insuffisant)';
  return 'F (Échec)';
}
```

#### 3.2 Validation longueur minimale

```javascript
/**
 * Valide la longueur de la réponse
 */
_validateLength(responseText, outputMode) {
  const wordCount = responseText.split(/\s+/).length;

  const requirements = {
    comprehensive_analysis: { min: 1500, ideal: 2000 },
    briefing: { min: 1800, ideal: 2500 },
    ticker_note: { min: 1000, ideal: 1500 },
    chat: { min: 400, ideal: 600 }
  };

  const req = requirements[outputMode] || requirements.chat;

  return {
    wordCount,
    minRequired: req.min,
    idealTarget: req.ideal,
    passed: wordCount >= req.min,
    grade: wordCount >= req.ideal ? 'A+' :
           wordCount >= req.min ? 'B+' : 'C',
    percentOfIdeal: Math.round((wordCount / req.ideal) * 100)
  };
}
```

#### 3.3 Validation sections structurées

```javascript
/**
 * Vérifie présence sections obligatoires
 */
_validateStructure(responseText, outputMode) {
  if (outputMode !== 'comprehensive_analysis') {
    return { passed: true, sections: [] };
  }

  const requiredSections = [
    '📊 SNAPSHOT',
    '💰 VALORISATION',
    '💼 RENTABILITÉ',
    '📈 PERFORMANCE',
    '🎯 CONSENSUS',
    '📰 ACTUALITÉS',
    '⚖️ CONCLUSION'
  ];

  const foundSections = [];
  const missingSections = [];

  for (const section of requiredSections) {
    // Recherche flexible (emoji ou texte)
    const sectionName = section.replace(/[📊💰💼📈🎯📰⚖️]\s*/, '');
    const regex = new RegExp(`(#{1,3}|\\*\\*)?\\s*(📊|💰|💼|📈|🎯|📰|⚖️)?\\s*${sectionName}`, 'i');

    if (regex.test(responseText)) {
      foundSections.push(section);
    } else {
      missingSections.push(section);
    }
  }

  return {
    passed: missingSections.length === 0,
    foundSections,
    missingSections,
    coverage: Math.round((foundSections.length / requiredSections.length) * 100)
  };
}
```

#### 3.4 Validation globale améliorée

```javascript
// lib/perplexity-optimizer.js:404-426 - REMPLACER
_validateResponse(response, outputMode, intentData) {
  // 1. Validation métriques obligatoires (existante)
  const requiredMetrics = this._getRequiredMetricsList(outputMode, intentData);
  const missing = [];

  requiredMetrics.forEach(metric => {
    const searchTerms = this._getSearchTermsForMetric(metric);
    const found = searchTerms.some(term =>
      response.content.toLowerCase().includes(term.toLowerCase())
    );
    if (!found) missing.push(metric);
  });

  // 2. NOUVEAU: Comptage quantitatif
  const metricsCount = this._countMetrics(response.content);

  // 3. NOUVEAU: Validation longueur
  const lengthValidation = this._validateLength(response.content, outputMode);

  // 4. NOUVEAU: Validation structure
  const structureValidation = this._validateStructure(response.content, outputMode);

  // Score global (0-100)
  const scores = {
    metricsPresence: ((requiredMetrics.length - missing.length) / requiredMetrics.length) * 100,
    metricsQuantity: metricsCount.passed ? 100 : (metricsCount.total / 20) * 100,
    length: lengthValidation.passed ? 100 : lengthValidation.percentOfIdeal,
    structure: structureValidation.coverage
  };

  const globalScore = (
    scores.metricsPresence * 0.3 +
    scores.metricsQuantity * 0.3 +
    scores.length * 0.2 +
    scores.structure * 0.2
  );

  return {
    passed: globalScore >= 80, // Seuil de qualité
    globalScore: Math.round(globalScore),

    // Détails par critère
    metricsPresence: {
      complete: missing.length === 0,
      found: requiredMetrics.length - missing.length,
      required: requiredMetrics.length,
      missing,
      score: Math.round(scores.metricsPresence)
    },

    metricsQuantity: {
      ...metricsCount,
      score: Math.round(scores.metricsQuantity)
    },

    length: {
      ...lengthValidation,
      score: Math.round(scores.length)
    },

    structure: {
      ...structureValidation,
      score: Math.round(scores.structure)
    },

    // Recommandations si échec
    recommendations: this._getImprovementRecommendations(globalScore, {
      metricsPresence: scores.metricsPresence,
      metricsQuantity: scores.metricsQuantity,
      length: scores.length,
      structure: scores.structure
    })
  };
}

_getImprovementRecommendations(globalScore, scores) {
  if (globalScore >= 90) return ['Excellent travail ! 🎉'];

  const recs = [];

  if (scores.metricsPresence < 80) {
    recs.push('❌ Métriques manquantes - vérifier les données fournies');
  }

  if (scores.metricsQuantity < 80) {
    recs.push('📊 Ajouter plus de chiffres/ratios (minimum 20)');
  }

  if (scores.length < 80) {
    recs.push('📏 Réponse trop courte - approfondir l\'analyse');
  }

  if (scores.structure < 80) {
    recs.push('📋 Sections manquantes - suivre structure obligatoire');
  }

  return recs;
}
```

**Résultat Phase 3:**
- ✅ Validation: Présence → **Comptage quantitatif**
- ✅ Métriques: 4 dimensions (présence, quantité, longueur, structure)
- ✅ Score global: 0-100 avec seuil 80
- ✅ Recommandations automatiques d'amélioration

---

### PHASE 4: Parallélisation Avancée ⚡
**Durée:** 1 heure
**Impact:** Latence -30% (13s → 9s)

#### 4.1 Intent + Tools en parallèle

```javascript
// api/emma-agent.js:34-77 - OPTIMISER

async processRequest(userMessage, context = {}) {
  try {
    console.log('🤖 Emma Agent: Processing request');

    // AVANT: Séquentiel
    // const intentData = await this._analyzeIntent(userMessage, context);
    // const selectedTools = await this._plan_with_scoring(userMessage, context);

    // APRÈS: Parallèle
    const [intentData, conversationHistory] = await Promise.all([
      this._analyzeIntent(userMessage, context),
      this._loadConversationHistory(context).catch(() => [])
    ]);

    // Si clarification needed, retour immédiat
    if (intentData?.needs_clarification) {
      return this._handleClarification(intentData, userMessage);
    }

    // Enrichir contexte
    if (intentData) {
      context.intent_data = intentData;
      context.extracted_tickers = intentData.tickers || [];
      context.suggested_tools = intentData.suggested_tools || [];
    }

    // Sélection outils (rapide, local)
    const selectedTools = await this._plan_with_scoring(userMessage, context);

    // Exécution outils (déjà parallèle)
    const toolResults = await this._execute_all(selectedTools, userMessage, context);

    // Génération réponse
    const responseData = await this._generate_response(
      userMessage,
      toolResults,
      context,
      intentData
    );

    // ... rest of code
  }
}
```

#### 4.2 Cache agressif multi-niveau

```javascript
// lib/emma-orchestrator.js - AMÉLIORER Cache

class EmmaOrchestrator {
  constructor() {
    // ... existing code

    // NOUVEAU: Cache Perplexity responses (30 min)
    this.CACHE_TTL.perplexity_response = 30 * 60 * 1000; // 30 min

    // NOUVEAU: Cache intent analysis (1h)
    this.CACHE_TTL.intent = 60 * 60 * 1000;
  }

  async delegateToPerplexity({ userMessage, toolResults, context, extracted }) {
    // Check cache Perplexity
    const cacheKey = this._getPerplexityCacheKey(userMessage, toolResults, context);
    const cached = this.getFromCache(cacheKey, 'perplexity_response');

    if (cached) {
      console.log('📦 Perplexity cache HIT - instant response!');
      return {
        ...cached,
        cached: true,
        latency: 50 // Quasi-instantané
      };
    }

    // Si pas en cache, appel normal
    const response = await this.perplexity.generate(userPrompt, {
      systemPrompt,
      userMessage: userPrompt,
      temperature: 0.5,
      max_tokens: 6000 // AUGMENTÉ
    });

    // Mettre en cache
    this.setInCache(cacheKey, response, 'perplexity_response');

    return response;
  }

  _getPerplexityCacheKey(userMessage, toolResults, context) {
    // Cache key: hash du message + tickers + intent
    const tickers = (context.extracted_tickers || []).sort().join(',');
    const intent = context.intent_data?.intent || 'unknown';
    const date = new Date().toISOString().split('T')[0]; // Cache par jour

    return `perplexity:${intent}:${tickers}:${date}:${this._hashString(userMessage)}`;
  }

  _hashString(str) {
    // Simple hash pour cache key
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}
```

**Résultat Phase 4:**
- ✅ Latence: 13s → **9s** (-30%) pour requêtes non-cachées
- ✅ Cache hit: **2-3s** (-80%) pour requêtes répétées
- ✅ Parallélisation: Intent + Conversation load simultanés

---

### PHASE 5: Tests & Validation 🧪
**Durée:** 1 heure
**Impact:** Confiance 100%

#### 5.1 Suite de tests automatisés

Créer `/tests/perplexity-quality-tests.js`:

```javascript
import { PerplexityOptimizer } from '../lib/perplexity-optimizer.js';

const tests = [
  {
    name: 'MSFT Comprehensive Analysis',
    userMessage: 'Analyse complète de Microsoft',
    outputMode: 'comprehensive_analysis',
    expectedMetrics: {
      minChiffres: 20,
      minMots: 1500,
      sectionsObligatoires: 7,
      minComparaisons: 5
    }
  },
  {
    name: 'AAPL Quick Check',
    userMessage: 'Prix Apple',
    outputMode: 'chat',
    expectedMetrics: {
      minChiffres: 8,
      minMots: 400,
      sectionsObligatoires: 0,
      minComparaisons: 2
    }
  },
  {
    name: 'Portfolio Briefing',
    userMessage: 'Briefing quotidien MSFT, AAPL, GOOGL',
    outputMode: 'briefing',
    expectedMetrics: {
      minChiffres: 25,
      minMots: 1800,
      sectionsObligatoires: 5,
      minComparaisons: 8
    }
  }
];

async function runQualityTests() {
  const optimizer = new PerplexityOptimizer();
  const results = [];

  for (const test of tests) {
    console.log(`\n🧪 Test: ${test.name}`);

    const response = await optimizer.synthesize({
      userMessage: test.userMessage,
      intentData: { intent: 'comprehensive_analysis', tickers: ['MSFT'] },
      toolResults: getMockToolResults(), // Mock data
      outputMode: test.outputMode
    });

    const validation = response.validation;

    const passed =
      validation.metricsQuantity.total >= test.expectedMetrics.minChiffres &&
      validation.length.wordCount >= test.expectedMetrics.minMots &&
      validation.globalScore >= 80;

    results.push({
      test: test.name,
      passed,
      score: validation.globalScore,
      details: validation
    });

    console.log(passed ? '✅ PASSED' : '❌ FAILED');
    console.log(`Score: ${validation.globalScore}/100`);
  }

  return results;
}
```

#### 5.2 Tests A/B Production

```javascript
// api/chat.js - AJOUTER A/B Testing

async function handleChat(userMessage, context) {
  // 10% du trafic sur nouvelle version
  const useOptimizedVersion = Math.random() < 0.10;

  if (useOptimizedVersion) {
    console.log('🧪 A/B Test: Using OPTIMIZED Perplexity');
    context.ab_test_variant = 'optimized';

    // Log pour analytics
    await logABTest({
      variant: 'optimized',
      userMessage,
      timestamp: Date.now()
    });
  } else {
    console.log('🧪 A/B Test: Using CONTROL');
    context.ab_test_variant = 'control';
  }

  // Appel normal Emma
  const response = await emmaAgent.processRequest(userMessage, context);

  // Log résultats
  await logABTestResult({
    variant: context.ab_test_variant,
    score: response.validation?.globalScore || 0,
    wordCount: response.validation?.length?.wordCount || 0,
    metricsCount: response.validation?.metricsQuantity?.total || 0,
    latency: response.execution_time_ms
  });

  return response;
}
```

**Résultat Phase 5:**
- ✅ Suite de 3+ tests automatisés
- ✅ A/B testing 10% trafic production
- ✅ Métriques logged (score, latence, satisfaction)

---

### PHASE 6: Documentation & Rollout 📚
**Durée:** 30 minutes

#### 6.1 Guide utilisateur

Créer `/docs/PERPLEXITY_QUALITY_GUIDE.md` avec:
- Métriques garanties par mode
- Exemples d'analyses avant/après
- KPIs de qualité

#### 6.2 Dashboard de monitoring

Créer endpoint `/api/quality-metrics`:
```javascript
{
  "last_24h": {
    "requests": 145,
    "avg_score": 87,
    "avg_metrics_count": 23,
    "avg_word_count": 1687,
    "cache_hit_rate": 0.68,
    "avg_latency_ms": 9200
  },
  "quality_distribution": {
    "A+ (90-100)": 45,
    "A (80-89)": 78,
    "B (70-79)": 18,
    "C (<70)": 4
  }
}
```

---

## 📊 RÉSULTATS ATTENDUS

### Avant Refactoring
```
Analyse MSFT:
  Longueur: ~1125 mots
  Chiffres: ~8
  Sections: 2-3
  Score qualité: 65/100 (C)
  Latence: 13s
  Données: 30 jours
```

### Après Refactoring
```
Analyse MSFT:
  Longueur: ~1800 mots (+60%)
  Chiffres: ~23 (+187%)
  Sections: 7 (+233%)
  Score qualité: 88/100 (A)
  Latence: 9s (-30%)
  Données: 24h (30x mieux)
```

---

## 🚀 PLAN D'IMPLÉMENTATION

### Aujourd'hui (3-4h)
- [x] Phase 1: Paramètres Perplexity (30 min)
- [ ] Phase 2: Prompts quantitatifs (1h)
- [ ] Phase 3: Validation renforcée (45 min)
- [ ] Phase 4: Parallélisation (1h)

### Demain (2h)
- [ ] Phase 5: Tests automatisés (1h)
- [ ] Phase 6: Documentation (30 min)
- [ ] A/B testing 10% (30 min)

### Cette semaine
- [ ] Monitoring 48h
- [ ] Ajustements si nécessaire
- [ ] Rollout 100% si score > 85

---

## ⚠️ RISQUES & MITIGATIONS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| **Latence augmente** | Moyenne | Moyen | Cache agressif + parallélisation |
| **Coût tokens +300%** | Haute | Faible | Budget acceptable (confiance utilisateur) |
| **Perplexity timeout** | Faible | Élevé | Fallback Gemini si > 25s |
| **Validation trop stricte** | Moyenne | Faible | Seuil 80 au lieu de 90 |

---

**PRÊT POUR IMPLÉMENTATION !** 🎯
