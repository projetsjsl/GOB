# 📊 Emma Agent - Mapping Complet des Données

**Architecture:** Cognitive Scaffolding + ReAct Pattern + Tool Use + Synthesis

---

## 🎯 VUE D'ENSEMBLE

Ce document décrit comment Emma Agent peuple intelligemment les 3 onglets principaux avec des données en temps réel.

### **Onglets Concernés:**
1. **JLab (IntelliStocks)** - Analyses avancées avec score JSLAI™
2. **Dan's Watchlist** - Suivi détaillé de la watchlist personnelle
3. **Stocks & News** - Actualités et données de marché

---

## 📈 1. JLAB (INTELLISTOCKS) - MAPPING COMPLET

### **Objectif:**
Fournir des analyses quantitatives et qualitatives avancées avec le score propriétaire JSLAI™.

### **Données à Peupler:**

| Champ UI | Outil Emma Agent | Priorité | Source API | Notes |
|----------|------------------|----------|------------|-------|
| **quote.price** | `polygon-stock-price` | 1 | Polygon.io | Prix temps réel |
| **quote.change** | `polygon-stock-price` | 1 | Polygon.io | Variation $ |
| **quote.changesPercentage** | `polygon-stock-price` | 1 | Polygon.io | Variation % |
| **quote.volume** | `polygon-stock-price` | 1 | Polygon.io | Volume actuel |
| **quote.marketCap** | `fmp-fundamentals` | 2 | FMP | Capitalisation |
| **quote.avgVolume** | `fmp-fundamentals` | 2 | FMP | Volume moyen |
| **metrics.peRatioTTM** | `fmp-fundamentals` | 2 | FMP | P/E ratio |
| **metrics.pegRatioTTM** | `fmp-fundamentals` | 2 | FMP | PEG ratio |
| **metrics.priceToSalesRatioTTM** | `fmp-fundamentals` | 2 | FMP | P/S ratio |
| **metrics.dividendYieldTTM** | `fmp-fundamentals` | 2 | FMP | Rendement dividende |
| **ratios.debtEquityRatio** | `alpha-vantage-ratios` | 5 | Alpha Vantage | Dette/Capitaux |
| **ratios.returnOnEquityTTM** | `alpha-vantage-ratios` | 5 | Alpha Vantage | ROE |
| **ratios.returnOnAssetsTTM** | `alpha-vantage-ratios` | 5 | Alpha Vantage | ROA |
| **ratios.netProfitMarginTTM** | `alpha-vantage-ratios` | 5 | Alpha Vantage | Marge nette |
| **profile.companyName** | `fmp-fundamentals` | 2 | FMP | Nom entreprise |
| **profile.beta** | `fmp-fundamentals` | 2 | FMP | Volatilité β |
| **profile.sector** | `fmp-fundamentals` | 2 | FMP | Secteur |
| **profile.industry** | `fmp-fundamentals` | 2 | FMP | Industrie |
| **intraday[]** | `twelve-data-technical` | 4 | Twelve Data | Données intraday |
| **news[]** | `finnhub-news` | 6 | Finnhub | Actualités récentes |
| **sentiment.overall** | `calculator` | 3 | Calculé | Sentiment global |
| **sentiment.news** | `finnhub-news` | 6 | Finnhub + NLP | Sentiment news |
| **sentiment.social** | `yahoo-finance` | 12 | Yahoo | Sentiment social |
| **insights.catalysts[]** | `analyst-recommendations` | 11 | FMP | Catalyseurs |
| **insights.risks[]** | `analyst-recommendations` | 11 | FMP | Risques |
| **insights.consensus** | `analyst-recommendations` | 11 | FMP | Consensus analystes |
| **jslaiScore.total** | `calculator` | 3 | Calculé | Score JSLAI™ (0-100) |
| **jslaiScore.valuation** | `calculator` | 3 | Calculé | Sous-score valorisation |
| **jslaiScore.profitability** | `calculator` | 3 | Calculé | Sous-score profitabilité |
| **jslaiScore.growth** | `calculator` | 3 | Calculé | Sous-score croissance |
| **jslaiScore.financialHealth** | `calculator` | 3 | Calculé | Sous-score santé financière |
| **jslaiScore.momentum** | `twelve-data-technical` | 4 | Twelve Data | Sous-score momentum |
| **jslaiScore.moat** | `fmp-fundamentals` | 2 | FMP + Calculé | Sous-score avantage concurrentiel |
| **jslaiScore.sectorPosition** | `fmp-fundamentals` | 2 | FMP + Calculé | Sous-score position sectorielle |

### **Configuration Pondération JSLAI™:**
```javascript
{
  valuation: 20%,        // Multiples de valorisation
  profitability: 20%,    // Marges, ROE, ROA
  growth: 15%,           // Croissance revenus & EPS
  financialHealth: 20%,  // Bilan, dette, liquidité
  momentum: 10%,         // RSI, tendances, moyennes mobiles
  moat: 10%,             // Avantage concurrentiel
  sectorPosition: 5%     // Position dans le secteur
}
```

### **Intent Emma Agent pour JLab:**
```javascript
{
  "intent": "jlab_intellistocks_population",
  "confidence": 0.95,
  "tickers": ["AAPL", "MSFT", "GOOGL", ...],  // teamTickers
  "suggested_tools": [
    "polygon-stock-price",      // Priorité 1 - Prix temps réel
    "fmp-fundamentals",         // Priorité 2 - Fondamentaux
    "calculator",               // Priorité 3 - Score JSLAI™
    "twelve-data-technical",    // Priorité 4 - Momentum
    "alpha-vantage-ratios",     // Priorité 5 - Ratios avancés
    "finnhub-news"              // Priorité 6 - Actualités
  ],
  "parameters": {
    "include_jsla_score": true,
    "include_valuation_analysis": true,
    "include_risk_assessment": true,
    "include_sector_analysis": true,
    "include_technical_indicators": true
  }
}
```

### **Calcul du Score JSLAI™:**
```
JSLAI™ Score = (
  (Valuation Score × 20%) +
  (Profitability Score × 20%) +
  (Growth Score × 15%) +
  (Financial Health Score × 20%) +
  (Momentum Score × 10%) +
  (Moat Score × 10%) +
  (Sector Position Score × 5%)
)
```

**Exemple:**
- Valuation: 85/100 (P/E = 18)
- Profitability: 90/100 (ROE = 22%)
- Growth: 75/100 (Revenue growth = 12%)
- Financial Health: 80/100 (Debt/Equity = 0.5)
- Momentum: 70/100 (RSI = 58)
- Moat: 85/100 (Brand power)
- Sector Position: 80/100 (Top 3 in sector)

**Score JSLAI™ = 82.25/100** → **"Strong Buy"**

---

## 📋 2. DAN'S WATCHLIST - MAPPING COMPLET

### **Objectif:**
Analyser en détail les tickers de la watchlist personnelle avec fondamentaux, techniques, news et recommandations.

### **Données à Peupler:**

| Champ UI | Outil Emma Agent | Priorité | Source API | Notes |
|----------|------------------|----------|------------|-------|
| **watchlistTickers[]** | `supabase-watchlist` | 7 | Supabase | Liste tickers watchlist |
| **watchlistStockData.{ticker}.price** | `polygon-stock-price` | 1 | Polygon.io | Prix actuel |
| **watchlistStockData.{ticker}.change** | `polygon-stock-price` | 1 | Polygon.io | Variation $ |
| **watchlistStockData.{ticker}.changePct** | `polygon-stock-price` | 1 | Polygon.io | Variation % |
| **watchlistStockData.{ticker}.volume** | `polygon-stock-price` | 1 | Polygon.io | Volume |
| **watchlistStockData.{ticker}.pe** | `fmp-fundamentals` | 2 | FMP | P/E ratio |
| **watchlistStockData.{ticker}.marketCap** | `fmp-fundamentals` | 2 | FMP | Capitalisation |
| **watchlistStockData.{ticker}.roe** | `alpha-vantage-ratios` | 5 | Alpha Vantage | ROE |
| **watchlistStockData.{ticker}.rsi** | `twelve-data-technical` | 4 | Twelve Data | RSI |
| **watchlistStockData.{ticker}.macd** | `twelve-data-technical` | 4 | Twelve Data | MACD |
| **watchlistStockData.{ticker}.sma50** | `twelve-data-technical` | 4 | Twelve Data | SMA 50j |
| **watchlistStockData.{ticker}.sma200** | `twelve-data-technical` | 4 | Twelve Data | SMA 200j |
| **watchlistStockData.{ticker}.news[]** | `finnhub-news` | 6 | Finnhub | 3 dernières news |
| **watchlistStockData.{ticker}.analyst.rating** | `analyst-recommendations` | 11 | FMP | Buy/Hold/Sell |
| **watchlistStockData.{ticker}.analyst.targetPrice** | `analyst-recommendations` | 11 | FMP | Prix cible |
| **watchlistStockData.{ticker}.analyst.consensus** | `analyst-recommendations` | 11 | FMP | Consensus |

### **Intent Emma Agent pour Watchlist:**
```javascript
{
  "intent": "watchlist_detailed_analysis",
  "confidence": 0.95,
  "tickers": [...watchlistTickers],  // Depuis Supabase
  "suggested_tools": [
    "supabase-watchlist",           // Priorité 7 - Liste tickers
    "polygon-stock-price",          // Priorité 1 - Prix
    "fmp-fundamentals",             // Priorité 2 - Fondamentaux
    "twelve-data-technical",        // Priorité 4 - Indicateurs techniques
    "finnhub-news",                 // Priorité 6 - Actualités
    "analyst-recommendations"       // Priorité 11 - Recommandations
  ],
  "parameters": {
    "include_fundamentals": true,
    "include_technical": true,
    "include_news": true,
    "include_analyst_recommendations": true,
    "news_limit": 3  // 3 news par ticker
  }
}
```

### **Screener Watchlist:**
Critères de filtrage automatiques:
- **RSI > 70** → Surachat (Signal de vente)
- **RSI < 30** → Survente (Signal d'achat)
- **Prix > SMA50 > SMA200** → Tendance haussière forte
- **Prix < SMA50 < SMA200** → Tendance baissière forte
- **ROE > 15%** → Rentabilité forte
- **P/E < 20** → Valorisation attractive

---

## 📰 3. STOCKS & NEWS - MAPPING COMPLET

### **Objectif:**
Fournir un flux d'actualités en temps réel avec analyse de sentiment et contexte marché.

### **Données à Peupler:**

| Champ UI | Outil Emma Agent | Priorité | Source API | Notes |
|----------|------------------|----------|------------|-------|
| **newsData[]** | `finnhub-news` | 6 | Finnhub | Top 50 news globales |
| **newsData[].title** | `finnhub-news` | 6 | Finnhub | Titre article |
| **newsData[].description** | `finnhub-news` | 6 | Finnhub | Description |
| **newsData[].url** | `finnhub-news` | 6 | Finnhub | Lien article |
| **newsData[].publishedAt** | `finnhub-news` | 6 | Finnhub | Date publication |
| **newsData[].source.name** | `finnhub-news` | 6 | Finnhub | Source (Reuters, Bloomberg) |
| **newsData[].sentiment** | `finnhub-news` | 6 | Finnhub + NLP | Sentiment (positif/négatif) |
| **tickerNews.{ticker}[]** | `finnhub-news` | 6 | Finnhub | News par ticker |
| **marketOverview.sp500** | `polygon-stock-price` | 1 | Polygon.io | S&P 500 index |
| **marketOverview.nasdaq** | `polygon-stock-price` | 1 | Polygon.io | Nasdaq index |
| **marketOverview.dow** | `polygon-stock-price` | 1 | Polygon.io | Dow Jones index |
| **marketOverview.vix** | `polygon-stock-price` | 1 | Polygon.io | VIX (volatilité) |
| **topMovers.gainers[]** | `finnhub-news` | 6 | Finnhub | Top gainers |
| **topMovers.losers[]** | `finnhub-news` | 6 | Finnhub | Top losers |
| **economicCalendar[]** | `economic-calendar` | 9 | FMP | Événements macro |
| **earningsCalendar[]** | `earnings-calendar` | 10 | FMP | Résultats à venir |

### **Intent Emma Agent pour Stocks & News:**
```javascript
{
  "intent": "stocks_news_population",
  "confidence": 0.95,
  "tickers": [...teamTickers],
  "suggested_tools": [
    "polygon-stock-price",      // Priorité 1 - Indices marché
    "finnhub-news",             // Priorité 6 - Actualités
    "economic-calendar",        // Priorité 9 - Calendrier économique
    "earnings-calendar"         // Priorité 10 - Résultats
  ],
  "parameters": {
    "news_requested": true,
    "news_limit": 50,  // Top 50 news
    "include_market_indices": true,
    "include_top_movers": true,
    "include_economic_calendar": true,
    "include_earnings_calendar": true
  }
}
```

### **Filtres News:**
- **all** - Toutes les actualités
- **tickers** - Filtrer par ticker spécifique
- **sector** - Filtrer par secteur (Tech, Finance, Energy)
- **sentiment** - Filtrer par sentiment (positif, neutre, négatif)
- **source** - Filtrer par source (Reuters, Bloomberg, CNBC)

---

## 🔄 4. FONCTION BATCH REFRESH AUTOMATIQUE

### **Objectif:**
Rafraîchir automatiquement toutes les données à l'ouverture de la page via Emma Agent.

### **Architecture:**
```javascript
async function batchRefreshAllTabs() {
    console.log('🔄 Emma Agent Batch Refresh - START');

    // Préparer les contextes pour chaque onglet
    const contexts = {
        jlab: {
            tickers: teamTickers,
            analysis_type: 'jlab_intellistocks_population',
            include_jsla_score: true,
            include_valuation_analysis: true,
            include_risk_assessment: true,
            include_sector_analysis: true,
            include_technical_indicators: true
        },
        watchlist: {
            tickers: watchlistTickers,
            analysis_type: 'watchlist_detailed_analysis',
            include_fundamentals: true,
            include_technical: true,
            include_news: true,
            include_analyst_recommendations: true
        },
        stocks_news: {
            tickers: teamTickers,
            analysis_type: 'stocks_news_population',
            news_requested: true,
            include_market_indices: true,
            include_top_movers: true
        }
    };

    // COGNITIVE SCAFFOLDING: Emma analyse l'intent de chaque onglet
    // Puis exécute les outils en parallèle avec fallbacks
    // Enfin synthétise et retourne les données structurées

    try {
        // Appels parallèles pour les 3 onglets
        const [jlabResult, watchlistResult, newsResult] = await Promise.allSettled([
            fetch('/api/emma-agent', {
                method: 'POST',
                body: JSON.stringify({
                    message: "Peupler JLab IntelliStocks",
                    context: contexts.jlab
                })
            }),
            fetch('/api/emma-agent', {
                method: 'POST',
                body: JSON.stringify({
                    message: "Analyser Watchlist Dan",
                    context: contexts.watchlist
                })
            }),
            fetch('/api/emma-agent', {
                method: 'POST',
                body: JSON.stringify({
                    message: "Récupérer Stocks & News",
                    context: contexts.stocks_news
                })
            })
        ]);

        // Parser les résultats et mettre à jour l'UI
        // ...

        console.log('✅ Emma Agent Batch Refresh - COMPLETED');

        return {
            success: true,
            jlab: jlabResult.status === 'fulfilled',
            watchlist: watchlistResult.status === 'fulfilled',
            news: newsResult.status === 'fulfilled',
            execution_time_ms: Date.now() - startTime
        };

    } catch (error) {
        console.error('❌ Emma Agent Batch Refresh - ERROR:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
```

### **Déclencheurs de Refresh:**
1. **Au chargement de la page** (useEffect initial)
2. **Bouton manuel "🔄 Refresh All"** dans chaque onglet
3. **Timer automatique** (toutes les 5 minutes si page active)
4. **Changement de ticker** dans l'onglet actif
5. **Après ajout/suppression** dans la watchlist

---

## 📊 5. STATISTIQUES & MONITORING

### **Métriques à Tracker:**
- **Temps d'exécution** par onglet
- **Outils utilisés** par onglet
- **Taux de réussite** (is_reliable)
- **Nombre de fallbacks** par outil
- **Quota Perplexity** consommé
- **Fraîcheur des données** (timestamp)

### **Indicateurs de Qualité:**
```javascript
{
  jlab: {
    quality_percentage: 85,  // 85% données production, 15% fallback
    tools_used: ['polygon-stock-price', 'fmp-fundamentals', 'calculator'],
    execution_time_ms: 2500,
    is_reliable: true,
    timestamp: '2025-10-16T14:30:00Z'
  },
  watchlist: {
    quality_percentage: 90,
    tools_used: ['supabase-watchlist', 'polygon-stock-price', 'finnhub-news'],
    execution_time_ms: 1800,
    is_reliable: true,
    timestamp: '2025-10-16T14:30:00Z'
  },
  stocks_news: {
    quality_percentage: 95,
    tools_used: ['finnhub-news', 'polygon-stock-price'],
    execution_time_ms: 1200,
    is_reliable: true,
    timestamp: '2025-10-16T14:30:00Z'
  }
}
```

---

## 🎯 6. PRIORISATION DES OUTILS

### **Ordre d'Exécution par Onglet:**

**JLab (IntelliStocks):**
1. `polygon-stock-price` (Prix temps réel)
2. `fmp-fundamentals` (Fondamentaux)
3. `calculator` (Score JSLAI™)
4. `twelve-data-technical` (Indicateurs techniques)
5. `alpha-vantage-ratios` (Ratios avancés)

**Watchlist:**
1. `supabase-watchlist` (Liste tickers)
2. `polygon-stock-price` (Prix)
3. `fmp-fundamentals` (Fondamentaux)
4. `twelve-data-technical` (RSI, MACD, SMA)
5. `finnhub-news` (3 news par ticker)

**Stocks & News:**
1. `finnhub-news` (50 news principales)
2. `polygon-stock-price` (Indices: S&P, Nasdaq, Dow, VIX)
3. `economic-calendar` (Événements macro)
4. `earnings-calendar` (Résultats à venir)

---

## ⚡ 7. OPTIMISATIONS

### **Cache Intelligent:**
- **Cache local** (localStorage): 5 minutes
- **Cache Emma Agent** (config): 5 minutes
- **Cache Perplexity** (ai-services): 5 minutes

### **Requêtes Parallèles:**
- **Max 5 outils simultanés** (config Emma Agent)
- **Timeout 10 secondes** par outil
- **Fallbacks automatiques** si échec

### **Lazy Loading:**
- **Charger JLab** seulement si onglet actif
- **Charger Watchlist** seulement si tickers présents
- **Charger News** en background avec skeleton loaders

---

## 🚀 8. EXEMPLE D'UTILISATION

```javascript
// Au chargement de la page
useEffect(() => {
    const initializeData = async () => {
        setLoading(true);

        // Batch refresh automatique via Emma Agent
        const result = await batchRefreshAllTabs();

        if (result.success) {
            console.log('✅ Données chargées:', result);
            showMessage('Données actualisées avec succès', 'success');
        } else {
            console.error('❌ Erreur chargement:', result.error);
            showMessage('Erreur lors du chargement', 'error');
        }

        setLoading(false);
    };

    initializeData();
}, []);

// Bouton manuel
<button onClick={() => batchRefreshAllTabs()}>
    🔄 Rafraîchir toutes les données
</button>

// Timer automatique (5 minutes)
useEffect(() => {
    const interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
            batchRefreshAllTabs();
        }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
}, []);
```

---

## 📚 RÉFÉRENCES

- **Emma Agent:** `/api/emma-agent.js`
- **Tools Config:** `/config/tools_config.json`
- **Dashboard:** `/public/beta-combined-dashboard.html`
- **AI Services:** `/api/ai-services.js`

---

**Dernière mise à jour:** 2025-10-16
**Version:** 2.0 - Cognitive Scaffolding + ReAct Pattern
