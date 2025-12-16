# Product Type Detection & Adaptive Analysis

## Vue d'ensemble

Emma IA peut maintenant détecter automatiquement le type de produit financier (action, ETF, fonds commun, obligation, REIT, etc.) et adapter son analyse en conséquence.

## Problème résolu

**Avant:** Emma analysait tous les produits financiers de la même manière, en utilisant des ratios d'entreprise (P/E, ROE, CEO, etc.) même pour des ETF et fonds communs, ce qui n'est pas approprié.

**Maintenant:** Emma détecte le type de produit et adapte automatiquement:
- Les ratios analysés
- Le cadre d'analyse
- Les sources de données utilisées
- Le format de présentation

## Types de produits détectés

1. **ETF (Exchange-Traded Funds)**
   - Détection: Flag `isEtf` de FMP
   - Ratios clés: Expense ratio, AUM, tracking error, bid-ask spread
   - Focus: Performance vs indice, diversification, liquidité

2. **Fonds Communs (Mutual Funds)**
   - Détection: Pattern de ticker (finit par X, XX, IX, AX, CX)
   - Ratios clés: Sharpe ratio, alpha, beta, expense ratio, turnover
   - Focus: Performance vs benchmark, historique du gestionnaire, frais

3. **Actions Ordinaires (Common Stocks)**
   - Détection: Par défaut si aucun autre type détecté
   - Ratios clés: P/E, P/B, ROE, ROIC, D/E, marges, FCF
   - Focus: Fondamentaux d'entreprise, valorisation, croissance

4. **Obligations (Bonds)**
   - Détection: Nom contient "BOND", "TREASURY", "NOTE", "DEBT"
   - Ratios clés: Yield to maturity, duration, credit rating
   - Focus: Rendement, risque de crédit, sensibilité aux taux

5. **REIT (Real Estate Investment Trusts)**
   - Détection: Industrie = "REIT" ou nom contient "REIT"
   - Ratios clés: FFO/share, AFFO/share, payout ratio, occupancy rate
   - Focus: Génération de revenus, qualité du portefeuille immobilier

6. **Actions Privilégiées (Preferred Stocks)**
   - Détection: Ticker contient "-P" ou nom contient "PREFERRED"
   - Ratios clés: Dividend yield, coverage ratio
   - Focus: Stabilité des dividendes, priorité de paiement

7. **ADR (American Depositary Receipts)**
   - Détection: Ticker finit par "ADR" ou nom contient "ADR"
   - Ratios clés: Mêmes que actions + risque de change
   - Focus: Fondamentaux + géopolitique

## Implémentation technique

### 1. Détection Multi-Sources (lib/tools/product-type-detector.js)

**Stratégie de détection fiable (3 niveaux) :**

```javascript
// Niveau 1: FMP ETF endpoint (très fiable pour ETFs)
GET https://financialmodelingprep.com/api/v3/etf-info/{ticker}
// Si succès → C'est un ETF (confiance: haute)

// Niveau 2: Yahoo Finance quoteType (fiable pour tous types)
GET https://query1.finance.yahoo.com/v7/finance/quote?symbols={ticker}
// Retourne: quoteType = "EQUITY" | "ETF" | "MUTUALFUND" | "INDEX" | etc.
// Confiance: haute

// Niveau 3: FMP Profile (fallback basique)
// Utilise isEtf flag et industry field
// Confiance: moyenne
```

**Types détectés avec sources :**
- **ETF** : FMP etf-info endpoint (primaire) ou Yahoo quoteType=ETF
- **Mutual Fund** : Yahoo quoteType=MUTUALFUND (seule source fiable)
- **Common Stock** : Yahoo quoteType=EQUITY ou FMP profile
- **REIT** : FMP industry="REIT"
- **Index, Options, Futures** : Yahoo quoteType
- **Crypto, Forex** : Yahoo quoteType

### 2. Prompt adaptatif (config/emma-cfa-prompt.js)

Nouvelle section `productTypeGuidance` qui définit:
- Focus d'analyse pour chaque type
- Ratios pertinents
- Ce qu'il NE faut PAS faire (ex: pas de P/E pour ETF)
- Métriques spécifiques (ex: FFO pour REIT)

### 3. Injection dans le contexte (api/emma-agent.js)

Le type de produit est extrait des données et injecté dans le prompt:

```javascript
🔖 TYPES DE PRODUITS DÉTECTÉS:
- AAPL: Common Stock (Equity)
- SPY: ETF (Fund)
- AMAXX: Mutual Fund (Fund)

⚠️ IMPORTANT: Adapte ton analyse selon le type de produit
```

## Gestion des fonds communs

**Problème:** Les fonds communs (ex: AMAXX) ne sont souvent PAS dans FMP.

**Solution fiable:**
1. **Détection via Yahoo Finance quoteType** : `GET /v7/finance/quote?symbols=AMAXX`
   - Retourne `quoteType: "MUTUALFUND"` si c'est un fonds
   - Source la plus fiable (pas de devinettes avec patterns)

2. **Si Yahoo Finance confirme que c'est un fonds**, Emma :
   - Cherche via Perplexity : `"mutual fund [ticker] expense ratio performance Morningstar rating"`
   - Sources: Morningstar, Fundata, site web du fonds
   - Analyse adaptée: expense ratio, performance vs benchmark, manager, rating

3. **Métriques clés pour fonds** (pas les mêmes que actions) :
   - Expense Ratio (frais de gestion)
   - Sharpe Ratio, Alpha, Beta
   - Performance vs benchmark
   - Turnover ratio
   - Manager track record
   - Morningstar rating (étoiles)

## Exemple d'analyse adaptative

### Avant (action et ETF analysés pareil):
```
📊 SPY - SPDR S&P 500 ETF Trust

💰 VALORISATION
P/E 28.5x vs secteur 22.3x
ROE: 42.1%
CEO: Ronald O'Hanley
```
❌ **Problème:** P/E, ROE et CEO n'ont aucun sens pour un ETF!

### Maintenant (analyse adaptée):
```
📊 SPY - SPDR S&P 500 ETF Trust
🔖 TYPE: ETF | Fund | NYSE

💰 CARACTÉRISTIQUES ETF
Expense Ratio: 0.09% (très compétitif)
AUM: $450B (très liquide)
Tracking Error: 0.05% (excellent)
Holdings: 503 titres (S&P 500)

📈 PERFORMANCE
YTD: +18.2% vs S&P 500: +18.3%
Volume moyen: 75M shares/jour
Bid-Ask Spread: 0.01% (excellente liquidité)
```
✅ **Correct:** Analyse appropriée pour un ETF!

## Format de sortie

Emma inclut maintenant le type de produit dans l'en-tête:

```
═══════════════════════════════════════════════════════
📊 [TICKER] - [NOM]
[TYPE PRODUIT] | [Secteur] | [Industrie] | [Bourse]
═══════════════════════════════════════════════════════

🔖 TYPE: Common Stock / ETF / Mutual Fund / Bond / REIT / Preferred Stock / ADR
```

## Tests

Un script de test est disponible:

```bash
node test-product-type-detection.js
```

Ce script teste la détection pour:
- AAPL (Common Stock)
- SPY, QQQ (ETF)
- AMAXX, VFIAX (Mutual Funds)
- VNQ (REIT)

## Impact utilisateur

### Pour les utilisateurs:
- ✅ Analyses plus pertinentes et précises
- ✅ Ratios appropriés au type de produit
- ✅ Meilleure identification des fonds communs via Perplexity
- ✅ Pas de confusion entre actions et ETF

### Pour le système:
- ✅ Détection automatique (pas de configuration)
- ✅ Fallback intelligent si type non détecté
- ✅ Compatible avec tous les canaux (SMS, Web, Email)
- ✅ Pas de breaking changes (rétrocompatible)

## Cas d'usage

### 1. Analyse d'un ETF
```
User: "Analyse SPY"
Emma: Détecte ETF → Focus sur expense ratio, tracking error, liquidité
```

### 2. Analyse d'un fonds commun
```
User: "Analyse AMAXX"
Emma: Détecte Mutual Fund → Cherche via Perplexity (Morningstar, etc.)
      → Focus sur performance, frais, manager
```

### 3. Analyse d'un REIT
```
User: "Analyse VNQ"
Emma: Détecte REIT → Focus sur FFO, AFFO, distribution yield, occupancy
```

## Prochaines améliorations possibles

1. **Sources de données spécialisées:**
   - API Morningstar pour fonds communs
   - API REIT.com pour REITs
   - API Fundata pour fonds canadiens

2. **Comparaisons sectorielles adaptées:**
   - Comparer ETF avec ETF similaires (même indice)
   - Comparer fonds avec fonds de même catégorie

3. **Détection plus fine:**
   - Classes de fonds (A, B, C, Institutional)
   - ETF Smart Beta vs Passive
   - Obligations gouvernementales vs corporatives

## Références

- FMP API: https://site.financialmodelingprep.com/developer/docs
- CFA Institute Standards
- Morningstar Fund Analysis Framework
- REIT Analysis Best Practices

## Changelog

### 2025-11-15
- ✅ Ajout détection automatique de 7 types de produits
- ✅ Prompt adaptatif selon type de produit
- ✅ Instructions spécifiques pour fonds communs via Perplexity
- ✅ Mise à jour format de sortie avec type de produit
- ✅ Ajout script de test

## Support

Pour questions ou problèmes:
- GitHub Issues: https://github.com/projetsjsl/GOB/issues
- Email: support@gobapps.com
