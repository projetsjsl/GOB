# 📊 JLab™ (IntelliStocks) - Analyse Méticuleuse des Données

## 🎯 Objectif

Analyser **chaque donnée** affichée dans JLab™, déterminer son **utilité**, sa **fonction**, la **meilleure source**, et garantir une **mise à jour automatique** à chaque ouverture.

---

## 📋 Table des Matières

1. [Quote Data (Prix en Temps Réel)](#1-quote-data)
2. [Intraday Chart (Graphique Intrajournalier)](#2-intraday-chart)
3. [Metrics de Valorisation](#3-metrics-de-valorisation)
4. [Ratios Financiers](#4-ratios-financiers)
5. [Profile Company](#5-profile-company)
6. [News](#6-news)
7. [Sentiment Analysis](#7-sentiment-analysis)
8. [Insights (Catalysts, Risks, Consensus)](#8-insights)
9. [Score JSLAI™](#9-score-jslai)
10. [Analyst Recommendations](#10-analyst-recommendations)
11. [Earnings Calendar](#11-earnings-calendar)
12. [Screener Results](#12-screener-results)

---

## 1. Quote Data (Prix en Temps Réel)

### 📊 Données Affichées

```javascript
quote: {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 183.45,              // Prix actuel
    change: -2.15,              // Variation $ depuis fermeture précédente
    changesPercentage: -1.16,   // Variation % depuis fermeture précédente
    volume: 45789123,           // Volume de transactions
    marketCap: 2850000000000,   // Capitalisation boursière
    avgVolume: 52341678         // Volume moyen
}
```

### 🎯 Utilité & Fonction

| Donnée | Utilité | Fonction dans l'UI |
|--------|---------|-------------------|
| **symbol** | Ticker du titre | Affichage en haut du dashboard |
| **name** | Nom de l'entreprise | Titre principal, contexte |
| **price** | Prix en temps réel | Affichage principal (gros chiffre) |
| **change** | Variation $ | Indicateur de performance journalière |
| **changesPercentage** | Variation % | Code couleur (vert/rouge), prise de décision rapide |
| **volume** | Volume actuel | Liquidité, niveau d'activité |
| **marketCap** | Capitalisation | Taille de l'entreprise, classification |
| **avgVolume** | Volume moyen | Comparaison avec volume actuel → détection anomalies |

### 📡 Source Optimale

**Source Principale**: `Polygon.io` via `/api/marketdata?endpoint=quote`

```javascript
const fetchQuoteData = async (symbol) => {
  const response = await fetch(`/api/marketdata?endpoint=quote&symbol=${symbol}&source=auto`);
  const data = await response.json();

  return {
    symbol: data.symbol,
    name: data.name || await fetchCompanyName(symbol),
    price: data.c,                    // Close price
    change: data.d,                   // Change $
    changesPercentage: data.dp,       // Change %
    volume: data.v,                   // Volume
    marketCap: data.marketCap,        // From FMP if available
    avgVolume: data.avgVolume         // From FMP if available
  };
};
```

**Fallback**: `Twelve Data` (déjà implémenté dans marketdata.js)

### 🔄 Fréquence de Mise à Jour

- **Initial Load**: Immédiat au chargement du composant
- **Auto-Refresh**: Toutes les 5 minutes (cache TTL)
- **Manual Refresh**: Bouton "Actualiser"
- **On Symbol Change**: Immédiat lors du changement de ticker

### ✅ Implémentation Actuelle

```javascript
// Ligne 198 de beta-combined-dashboard.html
case 'quote':
    apiUrl = `/api/marketdata?endpoint=quote&symbol=${symbol}&source=auto`;
    break;
```

**Status**: ✅ **IMPLÉMENTÉ** via `fetchHybridData`

**Amélioration Nécessaire**: Ajouter `marketCap` et `avgVolume` (nécessite FMP fundamentals)

---

## 2. Intraday Chart (Graphique Intrajournalier)

### 📊 Données Affichées

```javascript
intraday: [
    {
        date: '9:30',           // Timestamp
        open: 182.50,           // Prix ouverture période
        high: 183.75,           // Plus haut période
        low: 182.10,            // Plus bas période
        close: 183.45,          // Prix clôture période
        volume: 3250000         // Volume période
    },
    // ... 78 bars (1 journée de trading avec intervalle 5min)
]
```

### 🎯 Utilité & Fonction

| Donnée | Utilité | Fonction dans l'UI |
|--------|---------|-------------------|
| **date** | Timestamp | Axe X du graphique |
| **open** | Prix ouverture | Candlestick body |
| **high** | Plus haut | Candlestick wick (haut) |
| **low** | Plus bas | Candlestick wick (bas) |
| **close** | Prix clôture | Candlestick body, ligne principale |
| **volume** | Volume période | Histogramme sous le graphique |

### 📊 Visualisation

- **Type**: Candlestick chart (Recharts)
- **Axe X**: Time (HH:MM)
- **Axe Y**: Price ($)
- **Axe Y secondaire**: Volume
- **Interactivité**: Tooltip au survol, zoom

### 📡 Source Optimale

**Source Principale**: `Twelve Data` via `/api/marketdata?endpoint=intraday`

```javascript
const fetchIntradayData = async (symbol, interval = '5min') => {
  const response = await fetch(
    `/api/marketdata?endpoint=intraday&symbol=${symbol}&interval=${interval}&outputsize=78`
  );
  const data = await response.json();

  // Transformer au format attendu
  return data.values.map(bar => ({
    date: bar.datetime.split(' ')[1].substring(0, 5), // "HH:MM"
    open: parseFloat(bar.open),
    high: parseFloat(bar.high),
    low: parseFloat(bar.low),
    close: parseFloat(bar.close),
    volume: parseInt(bar.volume)
  }));
};
```

### 🔄 Fréquence de Mise à Jour

- **Initial Load**: Immédiat au chargement
- **Auto-Refresh**: Toutes les 5 minutes (heures de marché)
- **Timeframe Change**: Immédiat lors du changement (1D, 1W, 1M, etc.)

### 📅 Timeframes Disponibles

| Timeframe | Interval | Outputsize | Période Couverte |
|-----------|----------|----------|-----------------|
| **1D** | 5min | 78 | 1 journée (6.5h) |
| **1W** | 1hour | 24 | 1 semaine (3 jours) |
| **1M** | 1day | 30 | 1 mois |
| **3M** | 1day | 90 | 3 mois |
| **6M** | 1day | 180 | 6 mois |
| **1A** | 1day | 365 | 1 an |
| **YTD** | 1day | Dynamic | Depuis début année |

### ✅ Implémentation Actuelle

```javascript
// Ligne 212 de beta-combined-dashboard.html
case 'prices':
    apiUrl = `/api/marketdata?endpoint=quote&symbol=${symbol}&source=auto`;
    break;
```

**Status**: ⚠️ **PARTIELLEMENT IMPLÉMENTÉ**

**Problème**: Utilise `endpoint=quote` au lieu de `endpoint=intraday`

**Correction Nécessaire**:
```javascript
case 'prices':
    apiUrl = `/api/marketdata?endpoint=intraday&symbol=${symbol}&interval=5min&outputsize=78`;
    break;
```

---

## 3. Metrics de Valorisation

### 📊 Données Affichées

```javascript
metrics: {
    peRatioTTM: 28.5,           // P/E Ratio (Price/Earnings)
    pegRatioTTM: 1.85,          // PEG Ratio (P/E to Growth)
    priceToSalesRatioTTM: 7.2,  // P/S Ratio (Price/Sales)
    dividendYieldTTM: 0.0052    // Rendement dividende (0.52%)
}
```

### 🎯 Utilité & Fonction

| Métrique | Utilité | Interprétation | Affichage UI |
|----------|---------|----------------|--------------|
| **P/E Ratio** | Valorisation relative | < 15: Sous-évalué<br>15-25: Normal<br>> 25: Sur-évalué | Badge avec couleur (vert/jaune/rouge) |
| **PEG Ratio** | Valorisation ajustée croissance | < 1: Sous-évalué<br>1-2: Normal<br>> 2: Sur-évalué | Score avec indicateur |
| **P/S Ratio** | Valorisation vs revenus | < 2: Bon<br>2-5: Moyen<br>> 5: Élevé | Gauge circulaire |
| **Dividend Yield** | Rendement dividende | > 3%: Bon pour revenus<br>< 1%: Croissance | % avec badge |

### 🧮 Calculs Dérivés

```javascript
// Utilisés dans le Score JSLAI™
const valuationScore = calculateValuationScore({
  peRatio: metrics.peRatioTTM,
  pegRatio: metrics.pegRatioTTM,
  psRatio: metrics.priceToSalesRatioTTM,
  sectorAvgPE: getSectorAverage(profile.sector, 'pe')
});

// Formule Score Valuation (sur 100)
function calculateValuationScore(metrics) {
  let score = 50; // Base

  // P/E Ratio (-20 à +20)
  if (metrics.peRatio < 15) score += 20;
  else if (metrics.peRatio > 30) score -= 20;

  // PEG Ratio (-15 à +15)
  if (metrics.pegRatio < 1) score += 15;
  else if (metrics.pegRatio > 2) score -= 15;

  // P/S Ratio (-15 à +15)
  if (metrics.psRatio < 2) score += 15;
  else if (metrics.psRatio > 8) score -= 15;

  return Math.max(0, Math.min(100, score));
}
```

### 📡 Source Optimale

**Source Principale**: `FMP` via `/api/marketdata?endpoint=fundamentals`

```javascript
const fetchMetrics = async (symbol) => {
  const response = await fetch(`/api/marketdata?endpoint=fundamentals&symbol=${symbol}`);
  const data = await response.json();

  return {
    peRatioTTM: data.ratios?.peRatioTTM,
    pegRatioTTM: data.ratios?.pegRatioTTM,
    priceToSalesRatioTTM: data.ratios?.priceToSalesRatioTTM,
    dividendYieldTTM: data.ratios?.dividendYieldTTM
  };
};
```

### 🔄 Fréquence de Mise à Jour

- **Initial Load**: Immédiat
- **Auto-Refresh**: Toutes les 1 heure (cache TTL - données fondamentales changent rarement)
- **Cache**: Recommandé 1h car données mises à jour trimestriellement

### ✅ Implémentation Actuelle

```javascript
// Ligne 204-206 de beta-combined-dashboard.html
case 'ratios':
    apiUrl = `/api/marketdata?endpoint=fundamentals&symbol=${symbol}&source=auto`;
    break;
```

**Status**: ✅ **IMPLÉMENTÉ**

**Note**: Récupère les ratios depuis FMP fundamentals

---

## 4. Ratios Financiers

### 📊 Données Affichées

```javascript
ratios: {
    debtEquityRatio: 1.85,          // Ratio Dette/Capitaux propres
    returnOnEquityTTM: 0.425,       // ROE - Rendement capitaux propres (42.5%)
    returnOnAssetsTTM: 0.185,       // ROA - Rendement actifs (18.5%)
    netProfitMarginTTM: 0.265       // Marge bénéficiaire nette (26.5%)
}
```

### 🎯 Utilité & Fonction

| Ratio | Utilité | Interprétation | Fonction Score JSLAI™ |
|-------|---------|----------------|----------------------|
| **Debt/Equity** | Santé financière, risque | < 0.5: Très solide<br>0.5-1.5: Normal<br>> 2: Risqué | **Financial Health** (20%) |
| **ROE** | Rentabilité capitaux | > 20%: Excellent<br>15-20%: Bon<br>< 10%: Faible | **Profitability** (20%) |
| **ROA** | Rentabilité actifs | > 15%: Excellent<br>10-15%: Bon<br>< 5%: Faible | **Profitability** (20%) |
| **Net Margin** | Marge bénéficiaire | > 20%: Excellent<br>10-20%: Bon<br>< 5%: Faible | **Profitability** (20%) |

### 🧮 Utilisation dans Score JSLAI™

```javascript
// Composante Profitability du Score JSLAI™ (20% du score total)
function calculateProfitabilityScore(ratios) {
  let score = 0;

  // ROE (40% de profitability)
  if (ratios.returnOnEquityTTM > 0.20) score += 40;
  else if (ratios.returnOnEquityTTM > 0.15) score += 30;
  else if (ratios.returnOnEquityTTM > 0.10) score += 20;
  else score += 10;

  // ROA (30% de profitability)
  if (ratios.returnOnAssetsTTM > 0.15) score += 30;
  else if (ratios.returnOnAssetsTTM > 0.10) score += 20;
  else score += 10;

  // Net Margin (30% de profitability)
  if (ratios.netProfitMarginTTM > 0.20) score += 30;
  else if (ratios.netProfitMarginTTM > 0.10) score += 20;
  else score += 10;

  return score; // Sur 100
}

// Composante Financial Health du Score JSLAI™ (20% du score total)
function calculateFinancialHealthScore(ratios) {
  let score = 100; // Commencer à 100

  // Debt/Equity (pénalité si trop élevé)
  if (ratios.debtEquityRatio > 2.5) score -= 50;
  else if (ratios.debtEquityRatio > 1.5) score -= 30;
  else if (ratios.debtEquityRatio > 0.7) score -= 10;
  else if (ratios.debtEquityRatio < 0.3) score += 0; // Pas de bonus, déjà à 100

  return Math.max(0, score); // Sur 100
}
```

### 📡 Source Optimale

**Source Principale**: `FMP` via `/api/marketdata?endpoint=fundamentals`

```javascript
const fetchRatios = async (symbol) => {
  const response = await fetch(`/api/marketdata?endpoint=fundamentals&symbol=${symbol}`);
  const data = await response.json();

  return {
    debtEquityRatio: data.ratios?.debtEquityRatioTTM,
    returnOnEquityTTM: data.ratios?.returnOnEquityTTM,
    returnOnAssetsTTM: data.ratios?.returnOnAssetsTTM,
    netProfitMarginTTM: data.ratios?.netProfitMarginTTM
  };
};
```

### 🔄 Fréquence de Mise à Jour

- **Initial Load**: Immédiat
- **Auto-Refresh**: Toutes les 1 heure (cache TTL)
- **Justification**: Données trimestrielles, pas besoin de refresh fréquent

### ✅ Implémentation Actuelle

**Status**: ✅ **IMPLÉMENTÉ** (même endpoint que metrics)

---

## 5. Profile Company

### 📊 Données Affichées

```javascript
profile: {
    companyName: 'Apple Inc.',
    price: 183.45,
    beta: 1.24,                 // Volatilité relative au marché
    sector: 'Technology',
    industry: 'Consumer Electronics',
    description: 'Apple Inc. designs, manufactures...',
    website: 'https://www.apple.com',
    ceo: 'Tim Cook',
    employees: 164000,
    country: 'US',
    exchange: 'NASDAQ',
    currency: 'USD'
}
```

### 🎯 Utilité & Fonction

| Donnée | Utilité | Affichage UI |
|--------|---------|--------------|
| **companyName** | Identification | Titre principal |
| **beta** | Risque/Volatilité | Badge avec code couleur<br>< 1: Moins volatile<br>> 1: Plus volatile |
| **sector** | Classification | Tag, filtrage screener |
| **industry** | Spécialisation | Tag, comparaison pairs |
| **description** | Contexte | Section "À propos" |
| **website** | Lien externe | Bouton "Visiter site" |
| **ceo** | Leadership | Info additionnelle |
| **employees** | Taille | Indicateur taille entreprise |

### 🧮 Utilisation dans Score JSLAI™

```javascript
// Composante Moat (10% du score total)
function calculateMoatScore(profile) {
  let score = 50; // Base

  // Secteur (certains secteurs ont des moats naturels)
  const highMoatSectors = ['Technology', 'Healthcare', 'Financial Services'];
  if (highMoatSectors.includes(profile.sector)) score += 20;

  // Taille (grandes entreprises = moat par échelle)
  if (profile.employees > 100000) score += 15;
  else if (profile.employees > 50000) score += 10;
  else if (profile.employees > 10000) score += 5;

  // Beta (stabilité = moat défensif)
  if (profile.beta < 0.8) score += 15; // Défensif
  else if (profile.beta > 1.5) score -= 10; // Trop volatile

  return Math.max(0, Math.min(100, score));
}
```

### 📡 Source Optimale

**Source Principale**: `FMP` via `/api/marketdata?endpoint=fundamentals`

```javascript
const fetchProfile = async (symbol) => {
  const response = await fetch(`/api/marketdata?endpoint=fundamentals&symbol=${symbol}`);
  const data = await response.json();

  return {
    companyName: data.profile?.companyName,
    price: data.profile?.price,
    beta: data.profile?.beta,
    sector: data.profile?.sector,
    industry: data.profile?.industry,
    description: data.profile?.description,
    website: data.profile?.website,
    ceo: data.profile?.ceo,
    employees: data.profile?.fullTimeEmployees,
    country: data.profile?.country,
    exchange: data.profile?.exchangeShortName,
    currency: data.profile?.currency
  };
};
```

### 🔄 Fréquence de Mise à Jour

- **Initial Load**: Immédiat
- **Auto-Refresh**: Toutes les 24 heures (données statiques)
- **Cache**: Recommandé localStorage 24h

### ✅ Implémentation Actuelle

```javascript
// Ligne 200-202 de beta-combined-dashboard.html
case 'profile':
    apiUrl = `/api/marketdata?endpoint=fundamentals&symbol=${symbol}&source=auto`;
    break;
```

**Status**: ✅ **IMPLÉMENTÉ**

---

## 6. News

### 📊 Données Affichées

```javascript
news: [
    {
        title: 'Apple annonce résultats trimestriels record',
        publishedDate: '2025-01-15T14:30:00Z',
        site: 'Reuters',
        url: 'https://reuters.com/...',
        text: 'Apple Inc. a annoncé aujourd\'hui...',
        image: 'https://...'
    },
    // ... 10-20 articles
]
```

### 🎯 Utilité & Fonction

| Donnée | Utilité | Affichage UI |
|--------|---------|--------------|
| **title** | Headline | Titre cliquable |
| **publishedDate** | Fraîcheur | Timestamp relatif ("il y a 2h") |
| **site** | Source | Badge source |
| **url** | Lien article | Ouvre dans nouvel onglet |
| **text** | Contexte | Résumé (150 char) |
| **image** | Visuel | Thumbnail |

### 🧮 Utilisation dans Sentiment Analysis

```javascript
// Analyse sentiment via Perplexity AI
const analyzeSentiment = async (news) => {
  const titles = news.map(n => n.title).join('\n');

  const prompt = `Analyse le sentiment des news suivantes pour ${symbol}:
${titles}

Retourne un JSON avec:
- overall: score 0-100 (0=très négatif, 100=très positif)
- summary: résumé sentiment en français`;

  const response = await fetch('/api/ai-services', {
    method: 'POST',
    body: JSON.stringify({
      service: 'perplexity',
      prompt
    })
  });

  return response.json();
};
```

### 📡 Source Optimale

**Source Principale**: `Finnhub` via Emma Agent

```javascript
const fetchNews = async (symbol) => {
  // Via Emma Agent (déjà implémenté)
  const response = await fetch('/api/emma-agent', {
    method: 'POST',
    body: JSON.stringify({
      message: `Get latest news for ${symbol}`,
      context: {
        tools: ['finnhub-news']
      }
    })
  });

  const data = await response.json();
  return data.news.slice(0, 20); // Top 20 articles
};
```

**Alternative**: Perplexity AI Sonar (déjà implémenté ligne 229)

### 🔄 Fréquence de Mise à Jour

- **Initial Load**: Immédiat
- **Auto-Refresh**: Toutes les 15 minutes
- **Manual Refresh**: Bouton "Actualiser news"

### ✅ Implémentation Actuelle

```javascript
// Ligne 208-252 de beta-combined-dashboard.html
case 'news':
    apiUrl = `/api/ai-services`;
    // POST avec service: 'tickers-news'
    break;
```

**Status**: ✅ **IMPLÉMENTÉ** via Perplexity AI

---

## 7. Sentiment Analysis

### 📊 Données Affichées

```javascript
sentiment: {
    overall: 75,            // Score global 0-100
    news: 72,               // Sentiment news
    social: 68,             // Sentiment réseaux sociaux
    institutional: 65,      // Sentiment institutionnels
    retail: 82,             // Sentiment retail
    summary: 'Sentiment globalement positif avec optimisme modéré'
}
```

### 🎯 Utilité & Fonction

| Métrique | Utilité | Visualisation | Interprétation |
|----------|---------|---------------|----------------|
| **overall** | Score global | Gauge circulaire | < 40: Négatif<br>40-60: Neutre<br>> 60: Positif |
| **news** | Sentiment articles | Barre horizontale | Reflète actualités récentes |
| **social** | Sentiment Twitter/Reddit | Barre horizontale | Tendance communauté |
| **institutional** | Sentiment fonds | Barre horizontale | Vision professionnels |
| **retail** | Sentiment particuliers | Barre horizontale | Tendance investisseurs retail |
| **summary** | Résumé textuel | Texte descriptif | Contexte en français |

### 🧮 Calcul du Score

```javascript
const calculateSentiment = async (symbol, news) => {
  // Analyse via Perplexity AI
  const prompt = `Analyse le sentiment pour ${symbol} basé sur:

1. News récentes (${news.length} articles)
2. Tendance prix (variation 7 jours)
3. Volume relatif

Retourne JSON:
{
  "overall": 0-100,
  "news": 0-100,
  "social": 0-100,
  "institutional": 0-100,
  "retail": 0-100,
  "summary": "résumé français"
}`;

  const response = await fetch('/api/ai-services', {
    method: 'POST',
    body: JSON.stringify({
      service: 'perplexity',
      model: 'sonar-pro',
      prompt,
      context: { news, symbol }
    })
  });

  return response.json();
};
```

### 📡 Source Optimale

**Source Principale**: `Perplexity AI Sonar Pro`

**Inputs**:
- News récentes (Finnhub)
- Variation prix 7 jours (Polygon)
- Volume relatif (Polygon)

**Output**: Scores sentiment + résumé

### 🔄 Fréquence de Mise à Jour

- **Initial Load**: Immédiat
- **Auto-Refresh**: Toutes les 30 minutes
- **Trigger**: Après refresh news

### ✅ Implémentation Actuelle

**Status**: ⚠️ **PARTIELLEMENT IMPLÉMENTÉ**

**Actuellement**: Données MOCK (ligne 11562-11569)

**À Faire**: Créer fonction `fetchSentiment` avec Perplexity AI

---

## 8. Insights (Catalysts, Risks, Consensus)

### 📊 Données Affichées

```javascript
insights: {
    catalysts: [
        'Résultats trimestriels supérieurs aux attentes',
        'Innovation produit majeure annoncée',
        'Expansion internationale réussie'
    ],
    risks: [
        'Concurrence accrue dans le secteur',
        'Incertitudes macroéconomiques',
        'Volatilité des marchés'
    ],
    consensus: 'bullish',  // 'bullish', 'neutral', 'bearish'
    reasoning: 'Les fondamentaux solides et la croissance continue justifient un sentiment positif'
}
```

### 🎯 Utilité & Fonction

| Donnée | Utilité | Visualisation |
|--------|---------|---------------|
| **catalysts** | Facteurs positifs | Liste à puces avec 🚀 |
| **risks** | Facteurs de risque | Liste à puces avec ⚠️ |
| **consensus** | Direction recommandée | Badge (vert/jaune/rouge) |
| **reasoning** | Justification | Texte explicatif |

### 🧮 Génération via IA

```javascript
const generateInsights = async (symbol, stockData) => {
  const prompt = `Analyse ${symbol} et fournis:

**Données disponibles**:
- Prix: $${stockData.quote.price}
- P/E: ${stockData.metrics.peRatioTTM}
- ROE: ${stockData.ratios.returnOnEquityTTM * 100}%
- Debt/Equity: ${stockData.ratios.debtEquityRatio}
- News: ${stockData.news.map(n => n.title).join(', ')}

**Format JSON requis**:
{
  "catalysts": ["3 facteurs positifs"],
  "risks": ["3 risques principaux"],
  "consensus": "bullish|neutral|bearish",
  "reasoning": "justification 100 mots"
}`;

  const response = await fetch('/api/ai-services', {
    method: 'POST',
    body: JSON.stringify({
      service: 'perplexity',
      model: 'sonar-pro',
      prompt
    })
  });

  return response.json();
};
```

### 📡 Source Optimale

**Source Principale**: `Perplexity AI Sonar Pro`

**Inputs**:
- Quote data
- Metrics
- Ratios
- News
- Sentiment

**Output**: Insights structurés

### 🔄 Fréquence de Mise à Jour

- **Initial Load**: Immédiat
- **Auto-Refresh**: Toutes les 1 heure
- **Trigger**: Après MAJ des autres données

### ✅ Implémentation Actuelle

**Status**: ❌ **NON IMPLÉMENTÉ**

**Actuellement**: Données MOCK (ligne 11570-11583)

**À Faire**: Créer fonction `generateInsights` avec Perplexity AI

---

## 9. Score JSLAI™

### 📊 Données Affichées

```javascript
jslaiScore: {
    overall: 78,            // Score global 0-100
    components: {
        valuation: 72,      // 20% du score
        profitability: 85,  // 20% du score
        growth: 68,         // 15% du score
        financialHealth: 90,// 20% du score
        momentum: 65,       // 10% du score
        moat: 80,           // 10% du score
        sectorPosition: 75  // 5% du score
    },
    grade: 'B+',            // A+, A, B+, B, C+, C, D
    recommendation: 'BUY'   // STRONG BUY, BUY, HOLD, SELL, STRONG SELL
}
```

### 🎯 Utilité & Fonction

**C'est LA métrique propriétaire de JLab™** - Score composite qui évalue un titre sur 7 dimensions.

### 🧮 Formule de Calcul

```javascript
const calculateJSLAIScore = (stockData, config) => {
  // 1. VALUATION (20%)
  const valuationScore = calculateValuationScore({
    peRatio: stockData.metrics.peRatioTTM,
    pegRatio: stockData.metrics.pegRatioTTM,
    psRatio: stockData.metrics.priceToSalesRatioTTM
  });

  // 2. PROFITABILITY (20%)
  const profitabilityScore = calculateProfitabilityScore({
    roe: stockData.ratios.returnOnEquityTTM,
    roa: stockData.ratios.returnOnAssetsTTM,
    netMargin: stockData.ratios.netProfitMarginTTM
  });

  // 3. GROWTH (15%)
  const growthScore = calculateGrowthScore({
    revenueGrowth: stockData.financials?.revenueGrowthYoY,
    epsGrowth: stockData.financials?.epsGrowthYoY
  });

  // 4. FINANCIAL HEALTH (20%)
  const financialHealthScore = calculateFinancialHealthScore({
    debtEquity: stockData.ratios.debtEquityRatio,
    currentRatio: stockData.ratios.currentRatio,
    quickRatio: stockData.ratios.quickRatio
  });

  // 5. MOMENTUM (10%)
  const momentumScore = calculateMomentumScore({
    rsi: stockData.technical?.rsi,
    sma50: stockData.technical?.sma50,
    sma200: stockData.technical?.sma200
  });

  // 6. MOAT (10%)
  const moatScore = calculateMoatScore({
    sector: stockData.profile.sector,
    employees: stockData.profile.employees,
    beta: stockData.profile.beta
  });

  // 7. SECTOR POSITION (5%)
  const sectorPositionScore = calculateSectorPositionScore({
    peVsSector: stockData.quote.price / getSectorAvgPE(stockData.profile.sector),
    marketShare: estimateMarketShare(stockData.profile.marketCap, stockData.profile.sector)
  });

  // Score pondéré
  const overallScore =
    (valuationScore * config.valuation / 100) +
    (profitabilityScore * config.profitability / 100) +
    (growthScore * config.growth / 100) +
    (financialHealthScore * config.financialHealth / 100) +
    (momentumScore * config.momentum / 100) +
    (moatScore * config.moat / 100) +
    (sectorPositionScore * config.sectorPosition / 100);

  // Grade
  const grade = overallScore >= 90 ? 'A+' :
                overallScore >= 80 ? 'A' :
                overallScore >= 75 ? 'B+' :
                overallScore >= 70 ? 'B' :
                overallScore >= 65 ? 'C+' :
                overallScore >= 60 ? 'C' : 'D';

  // Recommendation
  const recommendation = overallScore >= 85 ? 'STRONG BUY' :
                        overallScore >= 70 ? 'BUY' :
                        overallScore >= 50 ? 'HOLD' :
                        overallScore >= 35 ? 'SELL' : 'STRONG SELL';

  return {
    overall: Math.round(overallScore),
    components: {
      valuation: Math.round(valuationScore),
      profitability: Math.round(profitabilityScore),
      growth: Math.round(growthScore),
      financialHealth: Math.round(financialHealthScore),
      momentum: Math.round(momentumScore),
      moat: Math.round(moatScore),
      sectorPosition: Math.round(sectorPositionScore)
    },
    grade,
    recommendation
  };
};
```

### 📡 Sources Requises

| Composante | Source | Endpoint |
|------------|--------|----------|
| Valuation | FMP | `/api/marketdata?endpoint=fundamentals` |
| Profitability | FMP | `/api/marketdata?endpoint=fundamentals` |
| Growth | FMP | Nouveaux endpoints nécessaires |
| Financial Health | FMP | `/api/marketdata?endpoint=fundamentals` |
| Momentum | Twelve Data | Nouveaux endpoints nécessaires |
| Moat | FMP | `/api/marketdata?endpoint=fundamentals` |
| Sector Position | FMP | Nouveaux endpoints nécessaires |

### 🔄 Fréquence de Mise à Jour

- **Initial Load**: Immédiat
- **Auto-Refresh**: Toutes les 1 heure
- **Recalcul**: À chaque changement de configuration pondération

### ✅ Implémentation Actuelle

**Status**: ⚠️ **CONFIGURATION EXISTANTE, CALCUL À IMPLÉMENTER**

**Configuration** (ligne 11477-11487): ✅ Pondérations configurables

**Calcul**: ❌ À implémenter complètement

---

## 10. Analyst Recommendations

### 📊 Données Affichées

```javascript
analyst: {
    consensusRating: 'Buy',     // Strong Buy, Buy, Hold, Sell, Strong Sell
    targetPrice: 195.50,        // Prix cible moyen
    numberOfAnalysts: 42,       // Nombre d'analystes
    breakdown: {
        strongBuy: 15,
        buy: 18,
        hold: 7,
        sell: 2,
        strongSell: 0
    },
    priceTargets: {
        high: 220.00,
        average: 195.50,
        low: 170.00
    }
}
```

### 🎯 Utilité & Fonction

| Donnée | Utilité | Visualisation |
|--------|---------|---------------|
| **consensusRating** | Recommandation moyenne | Badge coloré |
| **targetPrice** | Prix cible moyen | Comparaison vs prix actuel |
| **numberOfAnalysts** | Confiance consensus | Texte "Basé sur X analystes" |
| **breakdown** | Distribution opinions | Graphique barres horizontales |
| **priceTargets** | Fourchette prix | Range avec indicateur prix actuel |

### 🧮 Calcul Upside Potential

```javascript
const calculateUpside = (currentPrice, targetPrice) => {
  const upside = ((targetPrice - currentPrice) / currentPrice) * 100;
  return {
    percentage: upside.toFixed(2),
    label: upside > 20 ? 'Fort potentiel' :
           upside > 10 ? 'Potentiel modéré' :
           upside > 0 ? 'Potentiel limité' : 'Surévalué',
    color: upside > 20 ? 'green' :
           upside > 10 ? 'blue' :
           upside > 0 ? 'yellow' : 'red'
  };
};
```

### 📡 Source Optimale

**Source Principale**: `FMP` - Analyst Recommendations

```javascript
const fetchAnalystData = async (symbol) => {
  const response = await fetch(
    `https://financialmodelingprep.com/api/v3/analyst-stock-recommendations/${symbol}?apikey=${FMP_API_KEY}`
  );

  const data = await response.json();

  // Agréger les recommandations
  const latest = data[0]; // Plus récent

  return {
    consensusRating: latest.consensusRating,
    targetPrice: latest.priceTarget,
    numberOfAnalysts: latest.analystCount,
    breakdown: {
      strongBuy: latest.strongBuy,
      buy: latest.buy,
      hold: latest.hold,
      sell: latest.sell,
      strongSell: latest.strongSell
    },
    priceTargets: {
      high: latest.priceTargetHigh,
      average: latest.priceTarget,
      low: latest.priceTargetLow
    }
  };
};
```

### 🔄 Fréquence de Mise à Jour

- **Initial Load**: Immédiat
- **Auto-Refresh**: Toutes les 24 heures
- **Cache**: Recommandé 24h (change rarement)

### ✅ Implémentation Actuelle

```javascript
// Ligne 216-218 de beta-combined-dashboard.html
case 'analyst':
    throw new Error(`Données analyst non disponibles. API analyst non configurée.`);
```

**Status**: ❌ **NON IMPLÉMENTÉ**

**À Faire**:
1. Ajouter endpoint à `/api/marketdata.js`
2. Modifier `fetchHybridData` pour supporter `analyst`
3. Implémenter UI pour afficher recommandations

---

## 11. Earnings Calendar

### 📊 Données Affichées

```javascript
earnings: {
    nextEarningsDate: '2025-01-30',
    estimatedEPS: 2.10,
    actualEPS: null,          // Après publication
    surprise: null,           // % surprise vs estimate
    history: [
        {
            date: '2024-10-31',
            estimatedEPS: 1.98,
            actualEPS: 2.05,
            surprise: 3.54        // (actual - estimated) / estimated * 100
        }
        // ... 4 derniers quarters
    ]
}
```

### 🎯 Utilité & Fonction

| Donnée | Utilité | Visualisation |
|--------|---------|---------------|
| **nextEarningsDate** | Anticipation événement | Compte à rebours "dans X jours" |
| **estimatedEPS** | Attentes marché | Comparaison avec historique |
| **actualEPS** | Performance réelle | Comparaison vs estimé (après publication) |
| **surprise** | Beat/Miss | % avec code couleur (vert/rouge) |
| **history** | Tendance surprises | Graphique ligne EPS |

### 🧮 Impact sur Score JSLAI™

```javascript
// Si earnings dans < 7 jours, ajuster score Momentum
const adjustMomentumForEarnings = (momentumScore, earnings) => {
  const daysUntilEarnings = daysBetween(new Date(), earnings.nextEarningsDate);

  if (daysUntilEarnings <= 7) {
    // Analyser historique surprises
    const avgSurprise = earnings.history.reduce((sum, e) => sum + e.surprise, 0) / earnings.history.length;

    if (avgSurprise > 5) {
      // Historique de beats = boost momentum
      return Math.min(100, momentumScore + 10);
    } else if (avgSurprise < -5) {
      // Historique de misses = pénalité
      return Math.max(0, momentumScore - 10);
    }
  }

  return momentumScore;
};
```

### 📡 Source Optimale

**Source Principale**: `FMP` - Earnings Calendar

```javascript
const fetchEarningsData = async (symbol) => {
  // Prochain earnings
  const calendarRes = await fetch(
    `https://financialmodelingprep.com/api/v3/earnings-calendar?symbol=${symbol}&apikey=${FMP_API_KEY}`
  );
  const calendar = await calendarRes.json();

  // Historique earnings
  const historyRes = await fetch(
    `https://financialmodelingprep.com/api/v3/historical/earning_calendar/${symbol}?apikey=${FMP_API_KEY}`
  );
  const history = await historyRes.json();

  return {
    nextEarningsDate: calendar[0]?.date,
    estimatedEPS: calendar[0]?.epsEstimated,
    actualEPS: calendar[0]?.eps,
    surprise: calendar[0]?.epsEstimated && calendar[0]?.eps
      ? ((calendar[0].eps - calendar[0].epsEstimated) / calendar[0].epsEstimated) * 100
      : null,
    history: history.slice(0, 4).map(e => ({
      date: e.date,
      estimatedEPS: e.epsEstimated,
      actualEPS: e.eps,
      surprise: e.epsEstimated && e.eps
        ? ((e.eps - e.epsEstimated) / e.epsEstimated) * 100
        : null
    }))
  };
};
```

### 🔄 Fréquence de Mise à Jour

- **Initial Load**: Immédiat
- **Auto-Refresh**: Toutes les 24 heures
- **High Priority Refresh**: Si earnings dans < 7 jours → refresh toutes les 1h

### ✅ Implémentation Actuelle

```javascript
// Ligne 219-221 de beta-combined-dashboard.html
case 'earnings':
    throw new Error(`Données earnings non disponibles. API earnings non configurée.`);
```

**Status**: ❌ **NON IMPLÉMENTÉ**

**À Faire**:
1. Ajouter endpoint à `/api/marketdata.js`
2. Modifier `fetchHybridData` pour supporter `earnings`
3. Implémenter UI pour afficher calendrier

---

## 12. Screener Results

### 📊 Données Affichées

Le screener filtre les tickers de l'équipe selon des critères configurables.

```javascript
screenerFilters: {
    minMarketCap: 1000000000,     // 1B minimum
    maxPE: 30,                    // P/E max
    minROE: 15,                   // 15% minimum
    maxDebtEquity: 1.5,           // 1.5x max
    sector: 'Technology',         // Ou 'all'
    minJSLAIScore: 70             // Score minimum
}
```

### 🎯 Utilité & Fonction

**Permet de filtrer rapidement les meilleurs titres** selon des critères quantitatifs.

### 🧮 Logique de Filtrage

```javascript
const runScreener = async (filters, teamTickers) => {
  const results = [];

  for (const ticker of teamTickers) {
    // Fetch toutes les données nécessaires
    const [quote, fundamentals] = await Promise.all([
      fetchQuoteData(ticker),
      fetchFundamentalsData(ticker)
    ]);

    // Calculer Score JSLAI™
    const jslaiScore = calculateJSLAIScore({
      quote,
      metrics: fundamentals.ratios,
      ratios: fundamentals.ratios,
      profile: fundamentals.profile
    }, jslaiConfig);

    // Appliquer filtres
    const passes =
      quote.marketCap >= filters.minMarketCap &&
      fundamentals.ratios.peRatioTTM <= filters.maxPE &&
      fundamentals.ratios.returnOnEquityTTM * 100 >= filters.minROE &&
      fundamentals.ratios.debtEquityRatio <= filters.maxDebtEquity &&
      (filters.sector === 'all' || fundamentals.profile.sector === filters.sector) &&
      jslaiScore.overall >= filters.minJSLAIScore;

    if (passes) {
      results.push({
        symbol: ticker,
        name: fundamentals.profile.companyName,
        price: quote.price,
        marketCap: quote.marketCap,
        pe: fundamentals.ratios.peRatioTTM,
        roe: fundamentals.ratios.returnOnEquityTTM * 100,
        debtEquity: fundamentals.ratios.debtEquityRatio,
        jslaiScore: jslaiScore.overall,
        sector: fundamentals.profile.sector
      });
    }
  }

  // Trier par Score JSLAI™ descendant
  return results.sort((a, b) => b.jslaiScore - a.jslaiScore);
};
```

### 📡 Sources Requises

- Quote: `/api/marketdata?endpoint=quote`
- Fundamentals: `/api/marketdata?endpoint=fundamentals`
- Score JSLAI™: Calcul local

### 🔄 Fréquence de Mise à Jour

- **Manual Trigger**: Bouton "Exécuter Screener"
- **Cache**: Utilise cache existant (pas de refresh forcé)

### ✅ Implémentation Actuelle

**Status**: ✅ **IMPLÉMENTÉ** (existe déjà dans le code)

---

## 🔄 Plan de Mise à Jour Automatique

### Stratégie Global

```javascript
// Au chargement du composant IntelliStocksTab
useEffect(() => {
  const initializeData = async () => {
    setLoading(true);

    try {
      // 1. Charger données initiales
      const stockData = await fetchAllStockData(selectedStock);
      setStockDataIntelli(stockData);

      // 2. Setup auto-refresh
      setupAutoRefresh(selectedStock);

      // 3. Marquer comme connecté
      setConnected(true);
      setLastUpdateIntelli(new Date());

    } catch (error) {
      console.error('Erreur chargement initial:', error);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  initializeData();

  // Cleanup au démontage
  return () => {
    clearAutoRefresh();
  };
}, [selectedStock]);

// Fonction centrale de fetch
const fetchAllStockData = async (symbol) => {
  const [quote, fundamentals, intraday, news] = await Promise.all([
    fetchQuoteData(symbol),
    fetchFundamentalsData(symbol),
    fetchIntradayData(symbol),
    fetchNewsData(symbol)
  ]);

  // Calculer données dérivées
  const jslaiScore = calculateJSLAIScore({ quote, ...fundamentals }, jslaiConfig);
  const sentiment = await calculateSentiment(symbol, news);
  const insights = await generateInsights(symbol, { quote, ...fundamentals, news });

  return {
    quote,
    intraday,
    metrics: fundamentals.ratios,
    ratios: fundamentals.ratios,
    profile: fundamentals.profile,
    news,
    sentiment,
    insights,
    jslaiScore
  };
};

// Setup auto-refresh avec intervalles différents
const setupAutoRefresh = (symbol) => {
  // Quote: 5 minutes
  const quoteInterval = setInterval(async () => {
    const quote = await fetchQuoteData(symbol);
    setStockDataIntelli(prev => ({ ...prev, quote }));
  }, 5 * 60 * 1000);

  // News + Sentiment: 15 minutes
  const newsInterval = setInterval(async () => {
    const news = await fetchNewsData(symbol);
    const sentiment = await calculateSentiment(symbol, news);
    setStockDataIntelli(prev => ({ ...prev, news, sentiment }));
  }, 15 * 60 * 1000);

  // Fundamentals: 1 heure
  const fundamentalsInterval = setInterval(async () => {
    const fundamentals = await fetchFundamentalsData(symbol);
    const jslaiScore = calculateJSLAIScore({
      quote: stockDataIntelli.quote,
      ...fundamentals
    }, jslaiConfig);
    setStockDataIntelli(prev => ({
      ...prev,
      metrics: fundamentals.ratios,
      ratios: fundamentals.ratios,
      profile: fundamentals.profile,
      jslaiScore
    }));
  }, 60 * 60 * 1000);

  // Stocker les intervals pour cleanup
  window.jlabIntervals = { quoteInterval, newsInterval, fundamentalsInterval };
};

const clearAutoRefresh = () => {
  if (window.jlabIntervals) {
    Object.values(window.jlabIntervals).forEach(interval => clearInterval(interval));
    delete window.jlabIntervals;
  }
};
```

---

## ✅ Checklist Implémentation

### 🟢 Déjà Implémenté

- [x] Quote Data (via `/api/marketdata?endpoint=quote`)
- [x] Fundamentals (Metrics + Ratios + Profile via FMP)
- [x] News (via Perplexity AI)
- [x] Configuration Score JSLAI™ (pondérations)
- [x] Screener (logique existante)

### 🟡 Partiellement Implémenté

- [ ] Intraday Chart (endpoint existe mais mal utilisé)
  - **Action**: Changer `case 'prices'` pour utiliser `endpoint=intraday`

- [ ] Score JSLAI™ (config existe mais calcul incomplet)
  - **Action**: Implémenter toutes les fonctions de calcul des composantes
  - **Action**: Ajouter endpoints manquants (growth, momentum, sector avg)

### 🔴 Non Implémenté

- [ ] Sentiment Analysis
  - **Action**: Créer fonction `calculateSentiment` avec Perplexity AI

- [ ] Insights (Catalysts, Risks, Consensus)
  - **Action**: Créer fonction `generateInsights` avec Perplexity AI

- [ ] Analyst Recommendations
  - **Action**: Ajouter endpoint FMP analyst recommendations à `/api/marketdata.js`
  - **Action**: Modifier `fetchHybridData` case 'analyst'

- [ ] Earnings Calendar
  - **Action**: Ajouter endpoint FMP earnings calendar à `/api/marketdata.js`
  - **Action**: Modifier `fetchHybridData` case 'earnings'

---

## 🚀 Prochaines Étapes Recommandées

### Phase 1: Corrections Critiques (1-2h)

1. **Fixer Intraday Data**
   ```javascript
   case 'prices':
       apiUrl = `/api/marketdata?endpoint=intraday&symbol=${symbol}&interval=5min&outputsize=78`;
       break;
   ```

2. **Ajouter Analyst & Earnings à marketdata.js**
   - Créer endpoints pour analyst recommendations
   - Créer endpoints pour earnings calendar

### Phase 2: Sentiment & Insights (2-3h)

3. **Implémenter Sentiment Analysis**
   - Créer fonction avec Perplexity AI
   - Afficher scores dans UI

4. **Implémenter Insights**
   - Générer catalysts, risks, consensus via IA
   - Afficher dans section dédiée

### Phase 3: Score JSLAI™ Complet (3-4h)

5. **Compléter Score JSLAI™**
   - Implémenter toutes les fonctions de calcul
   - Ajouter données manquantes (growth, momentum)
   - Afficher graphique radar des composantes

### Phase 4: Auto-Refresh (1h)

6. **Implémenter Auto-Refresh**
   - Setup intervalles différenciés
   - Optimiser avec cache existant
   - Ajouter indicateur "Dernière mise à jour"

---

**Document créé le**: 2025-01-16
**Version**: 1.0
**Prochaine révision**: Après implémentation Phase 1
