# 🔍 Analyse des Dédoublements de Code - GOB

**Date:** 5 novembre 2025
**Analyseur:** Claude Code
**Portée:** 4,330 lignes (api/ + lib/)

---

## 📊 RÉSUMÉ EXÉCUTIF

| Métrique | Valeur |
|----------|--------|
| **Code dupliqué détecté** | ~880 LOC (20% du code core) |
| **Gain potentiel refactoring** | ~610-780 LOC économisées |
| **Zones critiques** | 7 identifiées |
| **Sévérité globale** | 🟠 MOYENNE-HAUTE |
| **Action recommandée** | Démarrer Phase 1 sous 2-4 semaines |

---

## 🔴 ZONE 1: EXTRACTION DE TICKERS (CRITIQUE)

### Problème
**3 implémentations différentes** pour extraire des tickers:

**Localisation:**
- `api/chat.js` (lignes 563-583)
- `lib/intent-analyzer.js` (lignes 386-410)
- `api/emma-agent.js` (lignes 769-818)

**Différences:**
- Regex incompatibles: `{1,5}` vs `{2,5}` caractères
- Mapping `companyToTicker` dupliqué 2 fois (80+ lignes)
- Logique comparaison (VS, OU, ET) manquante dans certains

### Impact
- Maintenance 3x plus difficile
- Risque incohérence (ticker détecté par un, raté par autre)
- **180 LOC dupliquées**

### Solution Recommandée

```javascript
// lib/utils/ticker-extractor.js (NOUVEAU)
export class TickerExtractor {
  // SINGLE SOURCE OF TRUTH
  static companyToTicker = {
    'apple': 'AAPL',
    'microsoft': 'MSFT',
    'google': 'GOOGL',
    'alphabet': 'GOOGL',
    'amazon': 'AMZN',
    'tesla': 'TSLA',
    'meta': 'META',
    'facebook': 'META',
    'nvidia': 'NVDA',
    // ... 50+ mappings
  };

  static COMMON_WORDS = [
    'USD', 'CAD', 'EUR', 'GBP', 'CEO', 'CFO', 'IPO',
    'ETF', 'AI', 'PE', 'EPS', 'ROE', 'YTD', 'EMMA',
    'SMS', 'FMP', 'API', 'JS', 'DAN', 'GOB'
  ];

  /**
   * Extrait tickers d'un message (regex unifiée)
   * @param {string} message - Message à analyser
   * @param {object} options - Options extraction
   * @returns {string[]} Liste de tickers validés
   */
  static extract(message, options = {}) {
    const tickers = new Set();
    const messageLower = message.toLowerCase();

    // 1. Tickers explicites (2-5 lettres MAJUSCULES)
    const pattern = /\b([A-Z]{2,5})\b/g;
    const matches = message.match(pattern) || [];

    matches.forEach(ticker => {
      if (!this.COMMON_WORDS.includes(ticker)) {
        tickers.add(ticker);
      }
    });

    // 2. Mapping noms compagnies → tickers
    for (const [company, ticker] of Object.entries(this.companyToTicker)) {
      if (messageLower.includes(company)) {
        tickers.add(ticker);
      }
    }

    return Array.from(tickers);
  }

  /**
   * Extrait tickers pour comparaison (T1 vs T2)
   * @param {string} message - Message avec comparaison
   * @returns {string[]} [ticker1, ticker2] ou []
   */
  static extractForComparison(message) {
    const patterns = [
      /COMPARER\s+([A-Z]{2,5})\s+(?:ET\s+|VS\s+)?([A-Z]{2,5})/i,
      /([A-Z]{2,5})\s+VS\s+([A-Z]{2,5})/i,
      /([A-Z]{2,5})\s+OU\s+([A-Z]{2,5})/i
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        return [match[1].toUpperCase(), match[2].toUpperCase()];
      }
    }

    return [];
  }

  /**
   * Extrait ticker après un mot-clé spécifique
   * @param {string} message - Message complet
   * @param {string} keyword - Mot-clé (ex: "ANALYSE", "PRIX")
   * @returns {string|null} Ticker ou null
   */
  static extractFromCommand(message, keyword) {
    const regex = new RegExp(`${keyword}\\s+([A-Z]{2,5})`, 'i');
    const match = message.match(regex);
    return match ? match[1].toUpperCase() : null;
  }
}
```

### Migration

**Avant (chat.js, 20 lignes):**
```javascript
const extractTickerFromCommand = (msg, keyword) => {
  const regex = new RegExp(`${keyword}\\s+([A-Z]{1,5})`, 'i');
  const match = msg.match(regex);
  return match ? match[1].toUpperCase() : null;
};
```

**Après (1 ligne):**
```javascript
import { TickerExtractor } from '../lib/utils/ticker-extractor.js';
const ticker = TickerExtractor.extractFromCommand(message, 'ANALYSE');
```

**Gain:** ~150 LOC | **Priorité:** P0

---

## 🟠 ZONE 2: DÉTECTION D'INTENTION (MOYENNE)

### Problème
**Détection dupliquée** entre:
- `api/chat.js` (lignes 557-716): Mots-clés MAJUSCULES hardcodés
- `lib/intent-analyzer.js` (lignes 82-160): Patterns NLP

**Chevauchements:**
- Les deux détectent: PRIX, ANALYSE, FONDAMENTAUX, RSI, MACD, etc.
- chat.js = 160 lignes de if/else
- intent-analyzer.js = patterns déjà définis

### Impact
- Maintenance double (ajouter nouveau mot-clé = 2 fichiers)
- Risque incohérence
- **220 LOC dupliquées**

### Solution Recommandée

**Supprimer détection dans chat.js**, utiliser UNIQUEMENT intent-analyzer:

**Avant (chat.js, 160 lignes):**
```javascript
if (messageUpper.startsWith('ANALYSE ')) {
  forcedIntent = { intent: 'comprehensive_analysis', ... };
} else if (messageUpper.startsWith('PRIX ')) {
  forcedIntent = { intent: 'stock_price', ... };
}
// ... 25+ patterns
```

**Après (chat.js, 5 lignes):**
```javascript
// intent-analyzer.js gère DÉJÀ tout cela
const intentData = await this.intentAnalyzer.analyze(message, context);
// Pas besoin de forced_intent, intent-analyzer le fait mieux
```

**Dans intent-analyzer.js, ajouter priorité mots MAJUSCULES:**
```javascript
analyze(userMessage, context = {}) {
  // 1. Détecter mots-clés MAJUSCULES en priorité (confiance 1.0)
  const upperKeywords = this._detectUppercaseKeywords(userMessage);
  if (upperKeywords) {
    return upperKeywords; // Confiance 100%
  }

  // 2. Sinon, analyse NLP normale
  return this._analyzeWithPatterns(userMessage, context);
}
```

**Gain:** ~200 LOC | **Priorité:** P1

---

## 🟠 ZONE 3: APPELS API FMP (MOYENNE-HAUTE)

### Problème
**7 outils FMP répètent la même logique:**

Chaque outil (`fmp-quote-tool.js`, `fmp-fundamentals-tool.js`, `fmp-ratios-tool.js`, etc.) répète:

```javascript
async execute(params, context = {}) {
  // 1. Validation API key (répété 7x)
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) throw new Error('FMP_API_KEY not configured');

  // 2. Extraction tickers (répété 7x)
  const allTickers = params.all_tickers || (params.ticker ? [params.ticker] : null);
  if (!allTickers || allTickers.length === 0) {
    throw new Error('No ticker provided');
  }

  // 3. Construction URL (répété 7x)
  const tickersString = allTickers.slice(0, 5).join(',');
  const url = `https://financialmodelingprep.com/api/v3/${endpoint}/${tickersString}?apikey=${apiKey}`;

  // 4. Appel API
  const response = await this.makeApiCall(url);
  // ...
}
```

### Impact
- **160 LOC dupliquées**
- Changement API FMP = modifier 7 fichiers
- Inconsistances (certains limitent à 5 tickers, d'autres non)

### Solution Recommandée

```javascript
// lib/tools/base-fmp-tool.js (NOUVEAU)
export class BaseFMPTool extends BaseTool {
  constructor(endpoint, name) {
    super();
    this.endpoint = endpoint;
    this.name = name;
    this.apiKey = process.env.FMP_API_KEY;
  }

  validateFMPKey() {
    if (!this.apiKey) {
      throw new Error('FMP_API_KEY not configured');
    }
  }

  extractTickers(params) {
    const allTickers = params.all_tickers ||
                       (params.ticker ? [params.ticker] : null);

    if (!allTickers || allTickers.length === 0) {
      throw new Error('No ticker provided');
    }

    return allTickers.slice(0, 5); // Limite standard: 5 tickers
  }

  buildFMPUrl(tickers, additionalParams = '') {
    const tickersString = tickers.map(t => t.toUpperCase()).join(',');
    return `https://financialmodelingprep.com/api/v3/${this.endpoint}/${tickersString}?apikey=${this.apiKey}${additionalParams}`;
  }
}

// Utilisation:
export default class FMPQuoteTool extends BaseFMPTool {
  constructor() {
    super('quote', 'FMP Stock Quote');
    this.description = 'Prix temps réel';
  }

  async execute(params, context = {}) {
    this.validateFMPKey();
    const tickers = this.extractTickers(params);
    const url = this.buildFMPUrl(tickers);

    const response = await this.makeApiCall(url);

    // Logique spécifique au quote
    return this.formatResult(response, true, {
      source: 'fmp',
      data_type: 'quote'
    });
  }
}
```

**Migration:** Appliquer à 7 outils FMP
**Gain:** ~130 LOC | **Priorité:** P1

---

## 🟡 ZONE 4: WATCHLIST SUPABASE (MOYENNE)

### Problème
**3 façons différentes** de se connecter à Supabase:

```javascript
// chat.js
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// supabase-watchlist.js
supabase = createClient(SUPABASE_URL, supabaseKey);

// supabase-watchlist-tool.js
const response = await this.makeApiCall(`${supabaseUrl}/rest/v1/watchlist`, {
  headers: { 'apikey': supabaseKey }
});
```

**FALLBACK_WATCHLIST dupliquée:**
- chat.js (ligne 202)
- supabase-watchlist-tool.js (ligne 45)

### Solution Recommandée

```javascript
// lib/supabase-config.js (AMÉLIORER existant)
import { createClient } from '@supabase/supabase-js';

export function createSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(url, key);
}

export const FALLBACK_WATCHLIST = [
  'GOOGL', 'T', 'BNS', 'TD', 'BCE', 'CNR', 'CSCO', 'CVS',
  'DEO', 'MDT', 'PFE', 'BMY', 'SPGI', 'ADM', 'CL',
  'MDY', 'GDX', 'XLF', 'XLE', 'XLV'
];
```

**Utiliser partout:**
```javascript
import { createSupabaseClient, FALLBACK_WATCHLIST } from '../lib/supabase-config.js';
```

**Gain:** ~70 LOC | **Priorité:** P2

---

## 🟢 ZONES MINEURES (P3)

### Zone 5: Validation Tickers (~60 LOC dupliquées)
Regex `[A-Z]{2,5}` répétée 12+ fois
**Solution:** `lib/utils/ticker-validator.js`

### Zone 6: Error Handling (~100 LOC dupliquées)
Try/catch patterns répétés
**Solution:** `lib/utils/error-handler.js`

### Zone 7: Formatage Réponses (~40 LOC)
Déjà bien isolé dans `channel-adapter.js`
**Solution:** Extraire sous-fonctions pour lisibilité

---

## 📋 PLAN D'ACTION

### ✅ Phase 1 (PRIORITÉ P0-P1) - 2-3 semaines

**Semaine 1:**
1. Créer `lib/utils/ticker-extractor.js`
2. Migrer chat.js vers TickerExtractor
3. Migrer intent-analyzer.js vers TickerExtractor
4. Migrer emma-agent.js vers TickerExtractor
5. Tests unitaires TickerExtractor

**Semaine 2:**
6. Créer `lib/tools/base-fmp-tool.js`
7. Migrer fmp-quote-tool.js vers BaseFMPTool
8. Migrer fmp-fundamentals-tool.js
9. Migrer fmp-ratios-tool.js
10. Migrer 4 autres outils FMP
11. Tests unitaires BaseFMPTool

**Semaine 3:**
12. Supprimer détection intention de chat.js
13. Enrichir intent-analyzer.js avec priorité MAJUSCULES
14. Tests intégration intent-analyzer
15. Déploiement Phase 1

**Gain Phase 1:** ~480 LOC économisées (11% réduction code)

### 🔄 Phase 2 (PRIORITÉ P2) - 1-2 semaines

16. Centraliser Supabase config
17. Créer ticker-validator.js
18. Migration complète

**Gain Phase 2:** +120 LOC

### 🎯 Phase 3 (PRIORITÉ P3) - 1 semaine

19. error-handler.js
20. Optimiser channel-adapter.js

**Gain Phase 3:** +125 LOC

**GAIN TOTAL:** ~725 LOC économisées (16% réduction)

---

## ⚠️ RISQUES & MITIGATION

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Régression fonctionnelle | Moyenne | Élevé | Tests unitaires AVANT refactoring |
| Breaking changes APIs | Faible | Moyen | Tests intégration automatisés |
| Délais dépassés | Moyenne | Faible | Refactoring incrémental (1 zone/semaine) |
| Dépendances cachées | Faible | Moyen | Code review 2+ développeurs |

**Recommandations:**
1. ✅ Créer tests unitaires AVANT chaque refactoring (TDD)
2. ✅ Déployer progressivement (1 zone → valider → suivante)
3. ✅ Monitoring erreurs post-déploiement (Sentry, logs)
4. ✅ Rollback plan si régression détectée

---

## 📊 MÉTRIQUES SUCCÈS

### Indicateurs Phase 1:
- [ ] TickerExtractor utilisé dans 3+ fichiers
- [ ] BaseFMPTool utilisé dans 7 outils FMP
- [ ] Détection intention centralisée (intent-analyzer uniquement)
- [ ] Tests unitaires: 90%+ coverage nouvelles classes
- [ ] 0 régression fonctionnelle détectée

### Indicateurs Globaux:
- [ ] ~725 LOC économisées (16% réduction)
- [ ] Temps ajout nouveau ticker: 1 fichier au lieu de 3
- [ ] Temps ajout nouvelle intention: 1 fichier au lieu de 2
- [ ] Temps ajout nouvel outil FMP: -50% (héritage BaseFMPTool)

---

## 💡 CONCLUSION

Le projet GOB présente **~880 LOC dupliquées** (20% du code core), principalement dans extraction tickers, détection intention, et appels API FMP.

**Impact actuel:**
- ❌ Maintenance 2-3x plus difficile
- ❌ Risque incohérences entre implémentations
- ❌ Dette technique croissante

**Bénéfices refactoring:**
- ✅ **~725 LOC économisées** (code plus maintenable)
- ✅ Single source of truth (réduction bugs)
- ✅ Ajout features 50% plus rapide
- ✅ Tests plus faciles

**Recommandation:** **Démarrer Phase 1 maintenant** pour éviter accumulation dette technique. Le projet est à taille idéale pour refactoring propre avant qu'il devienne trop complexe.

---

**Auteur:** Claude Code
**Date:** 5 novembre 2025
**Version:** 1.0
**Prochaine révision:** Après Phase 1 (fin novembre 2025)
