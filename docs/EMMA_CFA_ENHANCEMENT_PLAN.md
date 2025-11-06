# 🎓 Emma CFA® Enhancement Plan - Transformation en Analyste Institutionnel

**Date de création**: 5 novembre 2025
**Statut**: Phase 1 complétée (30%) - Phases 2-3 en cours
**Objectif**: Transformer Emma en analyste financière de niveau CFA® Institute avec standards institutionnels

---

## 📊 Vue d'ensemble du Projet

### **Vision**
Emma doit devenir l'équivalent d'un **Senior Portfolio Manager CFA®** avec 15+ ans d'expérience en gestion institutionnelle, capable de produire des analyses comparables à:
- Bloomberg Terminal
- Seeking Alpha Quant
- Value Line Investment Survey
- BCA Research
- FactSet / Morningstar / S&P Capital IQ

### **Piliers du Système**
1. **Qualité+++**: Analyses approfondies avec 8-12 ratios minimum
2. **Rigueur quantitative**: Données temps réel, comparaisons sectorielles
3. **Profondeur d'analyse**: 800-1200 mots pour analyses complètes
4. **Sources fiables**: FMP, Perplexity, Bloomberg-style formatting
5. **Priorité Perplexity**: Confiance élevée, workflow Perplexity-first
6. **Multifonctionnel**: Adaptation SMS/Email/Web/Briefing
7. **Fluidité utilisateur**: Réponses rapides, bien structurées

---

## ✅ Phase 1: Fondations (COMPLÉTÉ - 5 nov 2025)

### **1.1 Refactorisation Code (Zone 1 - Critical)**
**Statut**: ✅ Complété et déployé

**Réalisations**:
- Création de `lib/utils/ticker-extractor.js` (348 lignes)
  - Single Source of Truth pour extraction de tickers
  - 80+ compagnies mappées
  - 70+ mots communs filtrés
  - 5 méthodes d'extraction unifiées
- Élimination de ~180 lignes de code dupliqué
- Intégration dans 3 fichiers: `api/chat.js`, `lib/intent-analyzer.js`, `api/emma-agent.js`

**Impact**:
- 🔧 Maintenance simplifiée (1 seul fichier à modifier)
- ✅ Cohérence garantie entre extracteurs
- 🧪 Tests unitaires facilités
- 📉 Réduction 9% du code dupliqué

**Commit**: `17ceab4` - ♻️ REFACTOR: Phase 1 - TickerExtractor centralisé

---

### **1.2 Configuration CFA®-Level Prompt**
**Statut**: ✅ Complété et déployé

**Nouveau fichier**: `config/emma-cfa-prompt.js` (350+ lignes)

**Contenu**:
```javascript
export const CFA_SYSTEM_PROMPT = {
    identity: "Emma, CFA® - Analyste Senior",
    standards: "8 standards d'excellence CFA Institute",
    outputFormat: "Format Bloomberg Terminal",
    perplexityPriority: "Workflow Perplexity-first",
    smsFormat: "Version adaptée mobile",
    qualityChecklist: "14 points de vérification"
}
```

**Standards CFA® Codifiés**:
1. ✅ Rigueur quantitative (8-12 ratios minimum)
2. ✅ Analyse fondamentale approfondie (7 catégories)
3. ✅ Contexte macroéconomique obligatoire
4. ✅ Analyse qualitative (moats, management, ESG)
5. ✅ Longueur recommandée (800-1200 mots analyses complètes)
6. ✅ Formatage Bloomberg Terminal (sections, tableaux)
7. ✅ Priorité Perplexity (source primaire actualités)
8. ✅ Quality checklist (14 points vérification)

**Format Output Bloomberg-Style**:
```
═══════════════════════════════════════
📊 [TICKER] - [NOM COMPAGNIE]
═══════════════════════════════════════

🎯 EXECUTIVE SUMMARY
───────────────────────────────────────
[Synthèse 2-3 phrases]

📈 PERFORMANCE ET VALORISATION
───────────────────────────────────────
┌─────────────┬─────────┬──────────┬─────────┐
│ Ratio       │ Actuel  │ Secteur  │ Hist 5Y │
├─────────────┼─────────┼──────────┼─────────┤
│ P/E (TTM)   │ XX.Xx   │ XX.Xx    │ XX.Xx   │
│ P/B         │ X.Xx    │ X.Xx     │ X.Xx    │
└─────────────┴─────────┴──────────┴─────────┘

💰 FONDAMENTAUX FINANCIERS
───────────────────────────────────────
• Revenus TTM: $XX.XB (±X.X% YoY)
• Marge nette: XX.X%
• ROE: XX.X% (vs XX.X% secteur)
[...]

🎓 RECOMMANDATION CFA®
───────────────────────────────────────
NOTATION: [Strong Buy / Buy / Hold]
HORIZON: [Court / Moyen / Long terme]
PROFIL RISQUE: [Conservateur / Modéré / Agressif]
```

**Commit**: `775c56b` - 🚀 ENHANCE: Déploiement + Emma CFA-Level Analyst Prompt

---

### **1.3 Fix Déploiement Vercel**
**Statut**: ✅ Complété et déployé

**Problème identifié**:
- `beta-combined-dashboard.html` retournait 404 sur production
- Fichier présent dans `dist/` (1.2MB) mais Vercel ne l'utilisait pas

**Solution** (`vercel.json`):
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",         // ← Ajouté
  "installCommand": "npm install",   // ← Ajouté
  "functions": { ... }
}
```

**Résultat**:
- ✅ Dashboard accessible via `/` (redirect)
- ✅ Accessible directement via `/beta-combined-dashboard.html`
- ✅ Toutes les ressources `public/` correctement déployées

**Commit**: `775c56b` (même commit que CFA prompt)

---

## 🚧 Phase 2: Intégration CFA Prompt (EN COURS - 30%)

### **2.1 Intégration dans `_buildChatPrompt()`**
**Statut**: 🔄 En cours

**Tâches**:
- [ ] Remplacer prompt actuel par `CFA_SYSTEM_PROMPT.identity`
- [ ] Injecter `CFA_SYSTEM_PROMPT.standards` après contexte utilisateur
- [ ] Ajouter `CFA_SYSTEM_PROMPT.outputFormat` selon intent
- [ ] Intégrer `CFA_SYSTEM_PROMPT.perplexityPriority` workflow
- [ ] Adapter `CFA_SYSTEM_PROMPT.smsFormat` si `user_channel === 'sms'`
- [ ] Ajouter `CFA_SYSTEM_PROMPT.qualityChecklist` en fin de prompt

**Code à modifier** (`api/emma-agent.js` lignes 1192-1350):
```javascript
_buildChatPrompt(userMessage, toolsData, conversationContext, context, intentData) {
    // ACTUEL: Prompt basique "Emma, assistante financière"
    // À REMPLACER PAR:

    const basePrompt = CFA_SYSTEM_PROMPT.identity;
    const standards = CFA_SYSTEM_PROMPT.standards;
    const outputFormat = context.user_channel === 'sms'
        ? CFA_SYSTEM_PROMPT.smsFormat
        : CFA_SYSTEM_PROMPT.outputFormat;

    return `${basePrompt}

${standards}

${outputFormat}

[... reste du prompt avec données tools, contexte, etc.]

${CFA_SYSTEM_PROMPT.qualityChecklist}
`;
}
```

**Estimation**: 2-3 heures
**Priority**: 🔴 P0 (Critical)

---

### **2.2 Enrichir `_summarizeToolData()` pour Plus de Ratios**
**Statut**: ⏸️ À faire

**Objectif**: Exposer TOUS les ratios disponibles dans fondamentaux, pas juste 10 clés

**Code actuel** (`api/emma-agent.js` lignes 1147-1166):
```javascript
if (toolId.includes('fundamentals') || toolId.includes('ratios') || toolId.includes('metrics')) {
    const keyMetrics = {};
    const importantKeys = ['price', 'pe', 'eps', 'marketCap', 'revenue',
                           'netIncome', 'debtToEquity', 'currentRatio', 'roe', 'dividendYield'];
    // Ne retourne QUE 10 clés ❌
}
```

**Solution proposée**:
```javascript
if (toolId.includes('fundamentals') || toolId.includes('ratios') || toolId.includes('metrics')) {
    // CFA®-Level: Retourner TOUS les ratios disponibles
    const cfa_ratios = [
        // Valorisation (9 ratios)
        'pe', 'pb', 'ps', 'pfcf', 'pegRatio', 'evToSales', 'evToEbitda',
        'priceToFreeCashFlowsRatio', 'enterpriseValueMultiple',

        // Rentabilité (8 ratios)
        'roe', 'roa', 'roic', 'grossProfitMargin', 'operatingProfitMargin',
        'netProfitMargin', 'returnOnTangibleAssets', 'effectiveTaxRate',

        // Liquidité & Solvabilité (6 ratios)
        'currentRatio', 'quickRatio', 'cashRatio', 'debtToEquity',
        'debtToAssets', 'interestCoverage',

        // Efficacité (5 ratios)
        'assetTurnover', 'inventoryTurnover', 'receivablesTurnover',
        'daysSalesOutstanding', 'daysPayablesOutstanding',

        // Cash Flow (4 ratios)
        'freeCashFlowPerShare', 'freeCashFlowYield', 'operatingCashFlowPerShare',
        'cashPerShare',

        // Dividendes (3 ratios)
        'dividendYield', 'payoutRatio', 'dividendPerShare',

        // Croissance (4 ratios)
        'revenueGrowth', 'epsgrowth', 'freeCashFlowGrowth', 'bookValuePerShareGrowth'
    ];

    const cfaMetrics = {};
    for (const key of cfa_ratios) {
        if (data[key] !== undefined && data[key] !== null) {
            cfaMetrics[key] = data[key];
        }
    }

    return JSON.stringify(cfaMetrics, null, 2);
}
```

**Impact**: Emma aura accès à 39+ ratios au lieu de 10 (4x amélioration)

**Estimation**: 1 heure
**Priority**: 🟠 P1 (High)

---

### **2.3 Optimiser Sélection Perplexity (_selectModel)**
**Statut**: ⏸️ À faire

**Objectif**: Prioriser Perplexity pour analyses financières (confiance élevée)

**Code actuel** (`api/emma-agent.js` lignes ~840-900):
```javascript
_selectModel(intentData, outputMode, toolsData) {
    // Logique actuelle: Gemini par défaut, Perplexity si complexe
    // À MODIFIER pour Perplexity-first sur intents financiers
}
```

**Nouvelle logique proposée**:
```javascript
_selectModel(intentData, outputMode, toolsData) {
    // CFA®-Level: Perplexity FIRST pour analyses financières

    const financialIntents = [
        'comprehensive_analysis', 'fundamentals', 'stock_price',
        'technical_analysis', 'comparative_analysis', 'earnings',
        'recommendation', 'market_overview', 'economic_analysis'
    ];

    // PRIORITÉ PERPLEXITY pour intents financiers
    if (financialIntents.includes(intentData?.intent)) {
        return {
            model: 'perplexity',
            reason: 'CFA®-Level financial analysis - Perplexity prioritized'
        };
    }

    // Gemini seulement pour salutations, help, portfolio management
    if (['greeting', 'help', 'portfolio'].includes(intentData?.intent)) {
        return {
            model: 'gemini',
            reason: 'Simple conversational response'
        };
    }

    // Fallback: Perplexity par défaut (changement vs Gemini actuel)
    return {
        model: 'perplexity',
        reason: 'Default to Perplexity for institutional-grade analysis'
    };
}
```

**Impact**:
- ✅ Toutes analyses financières utilisent Perplexity (qualité++)
- ✅ Latence réduite (Perplexity plus rapide que Claude pour synthèse)
- ✅ Confiance élevée (aligné avec priorités utilisateur)

**Estimation**: 45 minutes
**Priority**: 🟠 P1 (High)

---

### **2.4 Adapter Réponses selon User Channel**
**Statut**: ⏸️ À faire

**Objectif**: Formatage optimal SMS vs Email vs Web

**Code à modifier** (`lib/channel-adapter.js`):
- SMS: Utiliser `CFA_SYSTEM_PROMPT.smsFormat` (250-350 mots, emojis, concis)
- Email/Web: Utiliser `CFA_SYSTEM_PROMPT.outputFormat` (800-1200 mots, tableaux)

**Logique**:
```javascript
export function adaptForChannel(response, channel, context) {
    if (channel === 'sms') {
        // CFA® SMS Format:
        // - 250-350 mots
        // - Ratios clés uniquement (top 5)
        // - 1 graphique TradingView
        // - Recommandation 2-3 phrases

        return formatCFAforSMS(response);
    } else {
        // CFA® Full Format (Email/Web):
        // - 800-1200 mots
        // - Tous ratios (8-12 minimum)
        // - Multiples graphiques
        // - Executive summary + deep dive

        return formatCFAforWeb(response);
    }
}
```

**Estimation**: 2 heures
**Priority**: 🟡 P2 (Medium)

---

## 📋 Phase 3: Tests & Optimisations (À VENIR - 0%)

### **3.1 Tests Complets Emma CFA®**
**Tâches**:
- [ ] Test intent `comprehensive_analysis` sur AAPL, MSFT, TSLA
- [ ] Validation 8-12 ratios présents dans réponse
- [ ] Vérification comparaisons sectorielles
- [ ] Test formatage Bloomberg-style (sections, tableaux)
- [ ] Validation longueur réponses (800-1200 mots analyses complètes)
- [ ] Test SMS vs Email/Web formatting
- [ ] Validation qualité checklist (14 points)

**Estimation**: 4 heures
**Priority**: 🟠 P1 (High)

---

### **3.2 Vérification Supabase Intégration**
**Objectif**: Assurer fonctionnement complet watchlist, team tickers, conversations

**Connexions à tester**:
1. **Watchlist personnelle** (`api/supabase-watchlist.js`)
   - GET watchlist utilisateur
   - POST add ticker
   - POST remove ticker
   - Validation tickers invalides

2. **Team tickers** (`lib/tools/team-tickers-tool.js`)
   - GET tickers équipe
   - Comparaison watchlist perso vs équipe

3. **Conversations** (`lib/conversation-manager.js`)
   - Sauvegarde historique
   - Récupération contexte 5 derniers messages
   - Formatage pour Emma Agent

4. **User profiles** (`lib/user-manager.js`)
   - Création profil nouveau user
   - Update préférences (briefing_time, frequency)
   - Récupération nom utilisateur

**Tests à créer** (`test-supabase-integration.js`):
```javascript
// Test 1: Watchlist CRUD
async function testWatchlistCRUD() {
    // Add ticker
    const addResult = await fetch('/api/supabase-watchlist', {
        method: 'POST',
        body: JSON.stringify({ user_id: 'test', action: 'add', ticker: 'AAPL' })
    });

    // Get watchlist
    // Remove ticker
    // Validate
}

// Test 2: Team tickers
// Test 3: Conversations
// Test 4: User profiles
```

**Estimation**: 3 heures
**Priority**: 🟠 P1 (High)

---

### **3.3 Optimisations Latence**
**Objectifs**:
- Réduire latence totale Emma Agent de 10-13s → 6-8s
- Paralléliser calls FMP + Perplexity
- Cache intelligent pour tickers fréquents

**Optimisations proposées**:

1. **Parallélisation Tools + Perplexity**:
```javascript
// ACTUEL: Séquentiel (tools → Perplexity)
const toolResults = await this._executeTool(tools);
const response = await this._generate_response(toolResults);

// OPTIMISÉ: Parallèle si Perplexity peut travailler sans outils
Promise.all([
    this._executeTool(tools),
    this._preloadPerplexityContext(userMessage)
]);
```

2. **Cache Redis/Supabase** pour données fréquentes:
```javascript
// Cache 5 minutes pour quotes
const cacheKey = `quote_${ticker}_${Math.floor(Date.now() / 300000)}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);
```

3. **Batch API calls** FMP:
```javascript
// Au lieu de 5 calls séparés pour 5 tickers:
const tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
const batch = await fmpBatchQuote(tickers); // 1 call
```

**Estimation**: 4 heures
**Priority**: 🟡 P2 (Medium)

---

## 📊 Métriques de Succès

### **Qualité des Réponses**
- ✅ Minimum 8 ratios financiers par analyse complète
- ✅ Comparaisons sectorielles présentes
- ✅ Historique 5 ans mentionné
- ✅ Sources citées (FMP, Perplexity, Bloomberg)
- ✅ Longueur: 800-1200 mots (analyses complètes)
- ✅ Formatage Bloomberg-style

### **Performance Technique**
- Latence totale: **< 8s** (objectif vs 10-13s actuel)
- Taux succès tools: **> 95%** (avec fallbacks)
- Utilisation Perplexity: **> 80%** des analyses financières
- Code dupliqué: **< 5%** (vs 20% initial)

### **Satisfaction Utilisateur**
- Niveau d'analyse: **CFA® Level III** équivalent
- Complétude: **90%+ des ratios pertinents**
- Fraîcheur données: **< 24h** (100% des analyses)
- Formatage mobile: **250-350 mots SMS** (concis mais complet)

---

## 🗂️ Fichiers Modifiés / Créés

### **✅ Phase 1 (Complétée)**
- ✅ `lib/utils/ticker-extractor.js` (NOUVEAU - 348 lignes)
- ✅ `config/emma-cfa-prompt.js` (NOUVEAU - 350+ lignes)
- ✅ `api/chat.js` (modifié - import TickerExtractor)
- ✅ `lib/intent-analyzer.js` (modifié - import TickerExtractor)
- ✅ `api/emma-agent.js` (modifié - import TickerExtractor + CFA_SYSTEM_PROMPT)
- ✅ `vercel.json` (modifié - buildCommand, outputDirectory)
- ✅ `docs/CODE_DUPLICATION_ANALYSIS.md` (NOUVEAU - analyse complète)

### **🚧 Phase 2 (En cours)**
- 🔄 `api/emma-agent.js` → _buildChatPrompt() (intégration CFA prompt)
- 🔄 `api/emma-agent.js` → _summarizeToolData() (enrichir ratios)
- 🔄 `api/emma-agent.js` → _selectModel() (Perplexity priority)
- ⏸️ `lib/channel-adapter.js` → adaptForChannel() (SMS vs Web)

### **📋 Phase 3 (À venir)**
- ⏸️ `test-emma-cfa-responses.js` (NOUVEAU - tests qualité)
- ⏸️ `test-supabase-integration.js` (NOUVEAU - tests Supabase)
- ⏸️ `lib/emma-cache-manager.js` (NOUVEAU - optimisation latence)

---

## 🎯 Roadmap Détaillée

### **Semaine 1 (5-12 nov 2025)**
- [x] Refactoring TickerExtractor (Zone 1)
- [x] Création CFA_SYSTEM_PROMPT
- [x] Fix déploiement Vercel
- [ ] Intégration CFA prompt dans _buildChatPrompt()
- [ ] Enrichir _summarizeToolData() (39 ratios)
- [ ] Optimiser _selectModel() (Perplexity priority)

### **Semaine 2 (13-19 nov 2025)**
- [ ] Tests complets Emma CFA® responses
- [ ] Validation 8-12 ratios par analyse
- [ ] Test formatage Bloomberg-style
- [ ] Vérification Supabase intégration complète
- [ ] Tests watchlist, team tickers, conversations

### **Semaine 3 (20-26 nov 2025)**
- [ ] Optimisations latence (parallélisation, cache)
- [ ] Adapter channel-adapter.js (SMS vs Web)
- [ ] Tests finaux multi-canaux
- [ ] Documentation utilisateur Emma CFA®
- [ ] Déploiement production final

---

## 📚 Références & Inspirations

### **Standards Professionnels**
- **CFA Institute**: Code of Ethics, Standards of Professional Conduct
- **Bloomberg Terminal**: UI/UX, formatage données, profondeur analyse
- **Seeking Alpha Quant**: Ratings, scores quantitatifs, backtesting
- **Value Line**: Investment Survey format, timeliness/safety ratings

### **Sources de Données**
- **Primary**: FMP (Financial Modeling Prep), Perplexity Labs
- **Secondary**: Finnhub, Alpha Vantage, Twelve Data
- **Reference**: Bloomberg, FactSet, S&P Capital IQ, Morningstar

### **Formatage & Présentation**
- **Tables**: ASCII tables pour ratios (┌─┬─┐ style)
- **Sections**: Unicode box-drawing (═══ ───)
- **Graphs**: TradingView embed tags `[CHART:TICKER]`
- **Emphasis**: Emojis contextuels (📊 📈 💰 ⚠️ ✅)

---

## 💡 Notes Implémentation

### **Priorité Perplexity - Workflow**
```
1. User Query → Intent Detection
2. Intent Financier? → Sélectionner Perplexity
3. Exécuter Tools FMP (quantitatif)
4. Exécuter Perplexity (qualitatif + news)
5. Synthèse Emma:
   - FMP → Ratios, métriques, fondamentaux
   - Perplexity → Contexte, actualités, analyse
   - Emma CFA® → Combinaison + recommandation
```

### **Gestion Longueur Réponses**
- **Analyses complètes**: 800-1200 mots (APPRÉCIÉE)
- **Analyses ciblées**: 400-600 mots
- **SMS**: 250-350 mots (concis mais complet)
- **Briefings**: 600-800 mots

### **Qualité > Vitesse**
Budget moins un enjeu → Prioriser qualité analyses vs latence
- OK: 10-13s pour analyse complète de haute qualité
- Target: 6-8s avec optimisations (Phase 3)
- Never: Sacrifier qualité pour gagner 2s

---

**Dernière mise à jour**: 5 novembre 2025 - 20h05 EST
**Auteur**: Claude Code
**Version**: 1.0 (Phase 1 complétée)
