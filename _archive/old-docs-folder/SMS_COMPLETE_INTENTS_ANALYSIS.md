# ANALYSE COMPLÈTE - 36 INTENTIONS EMMA POUR SMS

**Date**: 2025-11-15
**Objectif**: Évaluer et adapter les 36 intentions existantes d'Emma pour le canal SMS

---

## 📊 LISTE COMPLÈTE DES 36 INTENTS

### ✅ INTENTS SMS-COMPATIBLES (26/36)

Ces intents peuvent être adaptés pour SMS (réponse ≤ 320 caractères):

#### 1. **CATÉGORIE: BASE** (4/4 compatibles)

| Intent | Keywords | Réponse SMS Type | Priorité |
|--------|----------|------------------|----------|
| `greeting` | bonjour, salut, hello, hi | "Bonjour! Emma IA à votre service. Demandez 'Aide' pour voir les commandes." | ⭐⭐⭐ |
| `help` | aide, help, comment, fonctionnalités | Liste des commandes principales (condensée) | ⭐⭐⭐ |
| `portfolio` | portefeuille, watchlist, positions | Liste des tickers + performance globale | ⭐⭐⭐ |
| `general_conversation` | merci, ça va, etc. | Réponse conversationnelle courte | ⭐⭐ |

#### 2. **CATÉGORIE: ACTIONS** (8/8 compatibles)

| Intent | Keywords | Réponse SMS Type | Priorité |
|--------|----------|------------------|----------|
| `stock_price` | prix, cours, cotation, combien | "AAPL: 150.25$ (+2.3%). Volume: 45M. Source: FMP" | ⭐⭐⭐ |
| `fundamentals` | fondamentaux, pe, revenus, eps | "AAPL: P/E 28.5, ROE 45%, Marges 25%. Santé: Excellente. Source: FMP" | ⭐⭐⭐ |
| `technical_analysis` | technique, rsi, macd, tendance | "AAPL: RSI 65 (neutre), MACD haussier, Support 145$. Tendance: haussière. Source: TwelveData" | ⭐⭐⭐ |
| `news` | actualités, nouvelles, news | "AAPL: Résultats Q4 dépassent attentes (+12% revenus). Action +5% après-bourse. Source: Perplexity" | ⭐⭐⭐ |
| `comprehensive_analysis` | analyse complète, rapport | Version courte: Prix + P/E + Momentum + Avis (280 chars) | ⭐⭐⭐ |
| `comparative_analysis` | vs, comparer, mieux | "AAPL vs MSFT: AAPL P/E 28 (cher), MSFT P/E 32 (+ cher). Croissance: AAPL 8%, MSFT 12%. Préférence: MSFT. Source: FMP" | ⭐⭐ |
| `earnings` | résultats, earnings, q1, q2 | "AAPL Q4: Rev 89.5B (+12%), EPS 1.42$ (+8%). Guidance Q1: 95-100B. Action: +5%. Source: FMP" | ⭐⭐⭐ |
| `recommendation` | recommandation, acheter, vendre | "AAPL: Achat. P/E 28 raisonnable, croissance solide, momentum positif. Cible: 165$. Source: Analyse Emma" | ⭐⭐ |

#### 3. **CATÉGORIE: MARCHÉS** (2/2 compatibles)

| Intent | Keywords | Réponse SMS Type | Priorité |
|--------|----------|------------------|----------|
| `market_overview` | marché, indices, secteurs | "Marchés: S&P +0.5%, Nasdaq +1.2%, Dow -0.2%. Secteur tech surperforme. Sentiment: Positif. Source: FMP" | ⭐⭐⭐ |
| `sector_industry` | secteur, industrie, tech, finance | "Secteur Tech: +12% YTD. Leaders: NVDA (+45%), AAPL (+15%). Valorisation: Élevée (P/E 35). Source: FMP" | ⭐⭐ |

#### 4. **CATÉGORIE: ÉCONOMIE & POLITIQUE** (2/2 compatibles)

| Intent | Keywords | Réponse SMS Type | Priorité |
|--------|----------|------------------|----------|
| `economic_analysis` | économie, pib, inflation, taux fed | "Inflation US: 2.9% (déc 2024), Taux Fed: 5.25%, PIB: +2.5%. Tendance: Désinflation. Source: Perplexity" | ⭐⭐⭐ |
| `political_analysis` | politique, élections, régulation | Résumé court impact politique sur marchés | ⭐ |

#### 5. **CATÉGORIE: STRATÉGIE** (3/3 compatibles)

| Intent | Keywords | Réponse SMS Type | Priorité |
|--------|----------|------------------|----------|
| `investment_strategy` | stratégie, investir, allocation | "Allocation conseillée: 60% actions (tech, santé), 30% obligations, 10% cash. Horizon: 5+ ans. Source: Analyse" | ⭐⭐ |
| `risk_volatility` | risque, volatilité, beta | "AAPL: Beta 1.2 (risque modéré), Volatilité 25%, Drawdown max -20%. Profil: Modéré. Source: Calc" | ⭐⭐ |
| `risk_management` | gestion risque, var, sharpe | "Portefeuille: Sharpe 1.5, VaR 5%, Diversification: Bonne (12 tickers). Risque: Contrôlé. Source: Calc" | ⭐ |

#### 6. **CATÉGORIE: VALORISATION** (3/3 compatibles)

| Intent | Keywords | Réponse SMS Type | Priorité |
|--------|----------|------------------|----------|
| `valuation` | valorisation, fair value, dcf | "AAPL: Fair value 155$. Prix actuel 150$ → Sous-évalué 3%. Potentiel: Modéré. Source: DCF Emma" | ⭐⭐ |
| `stock_screening` | trouve, cherche, meilleurs | "Top 3 croissance: NVDA (+45%), META (+38%), TSLA (+25%). P/E < 30. Source: Screening Emma" | ⭐⭐⭐ |
| `valuation_methodology` | méthodologie, dcf, multiples | Explication courte méthodologie | ⭐ |

#### 7. **CATÉGORIE: CALCULS** (1/1 compatible)

| Intent | Keywords | Réponse SMS Type | Priorité |
|--------|----------|------------------|----------|
| `financial_calculation` | calcul, simulation, projection | Déjà implémenté dans SMS v1 (prêt, variation, etc.) | ⭐⭐⭐ |

#### 8. **CATÉGORIE: ASSETS ALTERNATIFS** (2/4 compatibles)

| Intent | Keywords | Réponse SMS Type | Priorité |
|--------|----------|------------------|----------|
| `forex_analysis` | forex, devise, taux change | "USD/EUR: 1.08 (+0.5%). Tendance: USD fort. Driver: Taux Fed élevés. Source: Perplexity" | ⭐⭐ |
| `bond_analysis` | obligations, bonds, yield | "US 10Y: 4.2% (+0.1%). Tendance: Hausse. Impact actions: Négatif. Source: Perplexity" | ⭐ |
| `real_estate` | immobilier, reit | ❌ **NON COMPATIBLE** (trop complexe pour SMS) | - |
| `private_equity` | private equity, vc, startup | ❌ **NON COMPATIBLE** (peu pertinent pour SMS) | - |

#### 9. **CATÉGORIE: RÉGLEMENTATION** (1/2 compatible)

| Intent | Keywords | Réponse SMS Type | Priorité |
|--------|----------|------------------|----------|
| `esg` | esg, durabilité, climat | "AAPL: Score ESG A+ (MSCI). Engagement carbone neutre 2030. Leader tech durable. Source: Perplexity" | ⭐ |
| `regulatory` | réglementation, sec, compliance | ❌ **NON COMPATIBLE** (trop technique) | - |

---

### ❌ INTENTS NON-COMPATIBLES SMS (10/36)

Ces intents nécessitent des réponses **trop longues/complexes** pour SMS:

| Intent | Raison Incompatibilité |
|--------|------------------------|
| `private_equity` | Données non publiques, analyses complexes |
| `real_estate` | Analyses multi-critères, trop de détails |
| `regulatory` | Textes légaux, trop technique |
| `arbitrage` | Stratégies complexes, formules mathématiques |
| `behavioral_finance` | Explications psychologiques longues |
| `structured_products` | Produits complexes, documentation requise |
| `warrants_convertibles` | Pricing complexe, formules |
| `mergers_acquisitions` | Analyses M&A multi-pages |
| `ipo` | Prospectus, analyses longues |
| `valuation_methodology` | Explications méthodologiques détaillées |

**Recommandation**: Répondre avec message de redirection vers Web/Email pour ces intents.

---

## 🎯 SYSTÈME SMS v2 FINAL

### Intents Supportés: **26/36** (72% compatibilité)

### Catégorisation par Priorité

#### ⭐⭐⭐ PRIORITÉ HAUTE (17 intents)
- Base: greeting, help, portfolio
- Actions: stock_price, fundamentals, technical_analysis, news, comprehensive_analysis, earnings
- Marchés: market_overview
- Économie: economic_analysis
- Valorisation: stock_screening
- Calculs: financial_calculation

#### ⭐⭐ PRIORITÉ MOYENNE (7 intents)
- Base: general_conversation
- Actions: comparative_analysis, recommendation
- Marchés: sector_industry
- Stratégie: investment_strategy, risk_volatility
- Valorisation: valuation
- Assets: forex_analysis

#### ⭐ PRIORITÉ BASSE (2 intents)
- Politique: political_analysis
- Assets: bond_analysis
- ESG: esg
- Risk: risk_management

---

## 📋 ADAPTATION INTENT DETECTOR SMS

### Modifications Nécessaires

1. **Étendre `INTENT_PATTERNS`** de 6 → 26 intents
2. **Ajouter patterns SMS-optimisés** pour chaque intent
3. **Gérer redirections** pour 10 intents non-compatibles
4. **Prioriser intents** selon clarté du message

### Exemple: Intent `fundamentals`

```javascript
FUNDAMENTALS: {
  patterns: [
    /^(fondamentaux|fundamentals|financials)\s+(?<ticker>[A-Z]{1,5})/i,
    /^(?<ticker>[A-Z]{1,5})\s+(fondamentaux|financials)/i,
    /^(pe|p\/e|roe|eps|marges?)\s+(?<ticker>[A-Z]{1,5})/i,
    /^(santé financière|profitabilité)\s+(?<ticker>[A-Z]{1,5})/i,
  ],
  extractors: {
    ticker: (match) => match.groups?.ticker?.toUpperCase() || null,
  },
  priority: 3, // Haute priorité
},
```

---

## 🔧 ADAPTATION DATA FETCHERS

### Nouveaux Fetchers Requis

1. **market-data-fetcher.cjs** (indices, secteurs)
2. **forex-fetcher.cjs** (devises)
3. **bond-fetcher.cjs** (obligations)
4. **esg-fetcher.cjs** (scores ESG)

### Fetchers Existants à Étendre

1. **stock-data-fetcher.cjs**
   - Ajouter: `getMarketOverview()`, `getSectorPerformance()`

2. **perplexity-fetcher.cjs**
   - Ajouter: `searchEconomicData()`, `searchForexData()`, `searchBondData()`

3. **financial-calculator.cjs**
   - Ajouter: `calculateRiskMetrics()`, `calculateValuation()`

---

## 📊 MESSAGES DE REDIRECTION

Pour les 10 intents non-compatibles SMS:

```javascript
const REDIRECT_MESSAGES = {
  real_estate: "Analyse immobilière trop complexe pour SMS. Consultez Emma Web: gobapps.com",
  private_equity: "Données Private Equity non disponibles par SMS. Contactez-nous: emma@gobapps.com",
  regulatory: "Infos réglementaires détaillées sur Emma Web: gobapps.com",
  arbitrage: "Stratégies d'arbitrage complexes. Détails sur Emma Web.",
  // ... etc
};
```

---

## ✅ PROCHAINES ÉTAPES

1. **Mettre à jour intent-detector-sms.cjs** (6 → 26 intents)
2. **Créer nouveaux data-fetchers** (market, forex, bond, esg)
3. **Étendre orchestrator** pour router 26 intents
4. **Tester 26 scénarios** (1 par intent)
5. **Documenter exemples SMS** pour chaque intent

---

## 📈 IMPACT ATTENDU

| Métrique | Avant (6 intents) | Après (26 intents) |
|----------|-------------------|---------------------|
| Couverture intentions | 17% | 72% |
| Cas d'usage SMS | Basique | Complet |
| Redirections nécessaires | Fréquentes | Rares (28%) |
| Satisfaction utilisateur | Moyenne | Élevée |

---

**Conclusion**: Le système SMS v2 doit supporter **26 intentions** (pas seulement 6) pour offrir une expérience comparable aux canaux Web/Email.
