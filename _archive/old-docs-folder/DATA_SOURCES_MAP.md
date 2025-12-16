# 📊 GOB Data Sources Map

Ce document répertorie **toutes les sources de données** utilisées dans l'application GOB pour garantir la **cohérence** et la **qualité** des informations affichées.

---

## 🎯 Objectif

- **Centraliser** : Une seule source de vérité pour chaque type de données
- **Documenter** : Savoir quelle API utiliser pour chaque information
- **Maintenir** : Faciliter les mises à jour et éviter les sources obsolètes
- **Optimiser** : Réduire les appels API redondants

---

## 📋 Sources de Données par Onglet

### 1. 📈 **JLab™ (IntelliStocksTab)**

**⚠️ État Actuel**: Données MOCK (generateMockData) - **À REMPLACER**

#### 🔹 Quote Data (Prix, Volume, Market Cap)
**Source Recommandée**: `Financial Modeling Prep (FMP)` via `/api/emma-agent` (tool: `fmp-fundamentals`)
- **Endpoint**: `GET /v3/quote/{ticker}`
- **Données**:
  - Price (dernier prix)
  - Change & Change % (variation $/%))
  - Volume (volume 24h)
  - Market Cap (capitalisation)
  - Avg Volume (volume moyen)
- **Fréquence**: Temps réel (actualisation 5 min)
- **Rate Limit**: 250 calls/day (Free), Unlimited (Pro $14/mois)

**Source Alternative**: `Polygon.io`
- **Endpoint**: `GET /v2/aggs/ticker/{ticker}/prev`
- **Avantage**: Plus rapide pour prix temps réel
- **Inconvénient**: Pas de market cap dans réponse

#### 🔹 Intraday Data (OHLCV Candlesticks)
**Source Recommandée**: `Twelve Data` via `/api/emma-agent`
- **Endpoint**: `GET /time_series`
- **Paramètres**: `interval=5min`, `outputsize=78` (1 jour de trading)
- **Données**: Open, High, Low, Close, Volume par intervalle
- **Fréquence**: Actualisation toutes les 5 min
- **Rate Limit**: 8 calls/min (Free), 800/min (Pro $8/mois)

**Source Alternative**: `Alpha Vantage`
- **Endpoint**: `GET /query?function=TIME_SERIES_INTRADAY`
- **Avantage**: Free tier généreux
- **Inconvénient**: 5 calls/min max (très lent)

#### 🔹 Metrics de Valorisation
**Source Recommandée**: `FMP` via `/api/emma-agent` (tool: `fmp-fundamentals`)
- **Endpoint**: `GET /v3/ratios-ttm/{ticker}`
- **Données**:
  - P/E Ratio TTM (Price/Earnings)
  - PEG Ratio TTM (P/E to Growth)
  - P/S Ratio TTM (Price/Sales)
  - Dividend Yield TTM (rendement dividende)
- **Fréquence**: 1x par jour (données fondamentales changent rarement)
- **Rate Limit**: 250 calls/day (Free)

**Source Alternative**: `Alpha Vantage`
- **Endpoint**: `GET /query?function=OVERVIEW`
- **Avantage**: Données complètes en 1 appel
- **Inconvénient**: 5 calls/min = très lent

#### 🔹 Ratios Financiers
**Source Recommandée**: `FMP` via `/api/emma-agent`
- **Endpoint**: `GET /v3/ratios/{ticker}?period=quarter&limit=1`
- **Données**:
  - Debt/Equity Ratio (ratio endettement)
  - ROE (Return on Equity)
  - ROA (Return on Assets)
  - Net Profit Margin
  - Current Ratio (liquidité)
  - Quick Ratio (solvabilité)
- **Fréquence**: 1x par jour
- **Rate Limit**: 250 calls/day (Free)

**Source Alternative**: `Twelve Data Fundamentals`
- **Endpoint**: `GET /fundamentals`
- **Note**: Moins complet que FMP

#### 🔹 Profile Company
**Source Recommandée**: `FMP` via `/api/emma-agent`
- **Endpoint**: `GET /v3/profile/{ticker}`
- **Données**:
  - Company Name
  - Sector (secteur)
  - Industry (industrie)
  - Beta (volatilité relative au marché)
  - Description
  - Website, CEO, Employees
- **Fréquence**: 1x par session (données statiques)
- **Cache**: Stocker en localStorage pour 24h

#### 🔹 News
**Source Recommandée**: `Finnhub` via `/api/emma-agent` (tool: `finnhub-news`)
- **Endpoint**: `GET /company-news`
- **Paramètres**: `symbol={ticker}&from={date_7_days_ago}&to={today}`
- **Données**: Title, published date, site, URL, summary
- **Fréquence**: Actualisation toutes les 15 min
- **Rate Limit**: 60 calls/min

**Source Alternative**: `FMP News`
- **Endpoint**: `GET /v3/stock_news?tickers={ticker}`
- **Avantage**: Intégré avec autres données FMP
- **Inconvénient**: Moins de sources que Finnhub

#### 🔹 Score JSLAI™ (Calcul)
**Source**: Calcul local basé sur données collectées
- **Composants du score** (pondération configurable):
  1. **Valuation** (20%): P/E, PEG, P/S vs moyennes secteur
  2. **Profitability** (20%): ROE, ROA, Net Margin
  3. **Growth** (15%): Croissance revenus, EPS YoY
  4. **Financial Health** (20%): Debt/Equity, Current Ratio, Cash
  5. **Momentum** (10%): RSI, tendances, moyennes mobiles
  6. **Moat** (10%): Analyse qualitative (via Emma Agent)
  7. **Sector Position** (5%): Comparaison avec pairs

**Données Requises**:
- Metrics: FMP ratios-ttm
- Financials: FMP income-statement, balance-sheet
- Technical: Twelve Data (RSI, SMA, MACD)
- Sector Avg: FMP sector-pe (comparaison)

**Implémentation**:
```javascript
const calculateJSLAIScore = (stockData, jslaiConfig) => {
    const scores = {
        valuation: calculateValuationScore(stockData.metrics),
        profitability: calculateProfitabilityScore(stockData.ratios),
        growth: calculateGrowthScore(stockData.financials),
        financialHealth: calculateFinancialHealthScore(stockData.ratios),
        momentum: calculateMomentumScore(stockData.technical),
        moat: calculateMoatScore(stockData.profile),
        sectorPosition: calculateSectorScore(stockData.sector_comparison)
    };

    return Object.keys(scores).reduce((total, key) => {
        return total + (scores[key] * jslaiConfig[key] / 100);
    }, 0);
};
```

#### 🔹 Screener (Filtrage)
**Source**: Calcul local sur données FMP
- **Critères de filtre**:
  - Min/Max Market Cap
  - Min/Max P/E Ratio
  - Min ROE %
  - Sector selection
  - Min Dividend Yield
  - Min JSLAI Score

**Optimisation**:
- Fetch données pour tickers équipe uniquement
- Cache résultats pendant 1h
- Actualisation incrémentale (pas full refresh)

---

### 2. 📊 **Titres & Nouvelles (StocksNewsTab)**

#### 🔹 Prix en Temps Réel
**Source Principale**: `Polygon.io` via `/api/emma-agent` (tool: `polygon-stock-price`)
- **Endpoint**: `GET /v2/aggs/ticker/{ticker}/prev`
- **Données**: Open, High, Low, Close, Volume, Variation %
- **Fréquence**: Temps réel (actualisation toutes les 5 min)
- **Rate Limit**: 5 appels/min (Free tier)

**Source Secondaire**: `Twelve Data` (fallback si Polygon indisponible)
- **Endpoint**: `GET /time_series`
- **Données**: Prix OHLCV
- **Rate Limit**: 8 appels/min (Free tier)

#### 🔹 Nouvelles (News)
**Source Principale**: `Finnhub` via `/api/emma-agent` (tool: `finnhub-news`)
- **Endpoint**: `GET /news`
- **Données**: Titre, description, source, URL, image, date
- **Fréquence**: Actualisation toutes les 15 min
- **Rate Limit**: 60 appels/min

**Source Secondaire**: `Perplexity AI Sonar` (analyse contextuelle)
- **Endpoint**: `/chat/completions` avec `sonar-pro`
- **Données**: Résumés intelligents, sentiment analysis
- **Rate Limit**: 50 requests/min

#### 🔹 Volumes & Liquidité
**Source**: `Polygon.io` (inclus dans prix temps réel)
- **Données**: Volume 24h, Average Volume, Volume Ratio

#### 🔹 Indicateurs Techniques
**Source Principale**: `Twelve Data` via `/api/emma-agent` (tool: `twelve-data-technical`)
- **Endpoint**: `GET /rsi`, `GET /macd`, `GET /sma`
- **Données**: RSI, MACD, SMA, EMA, Bollinger Bands
- **Fréquence**: 1x par session utilisateur
- **Rate Limit**: 8 appels/min

---

### 2. ⚙️ **Admin-JSLAI (AdminJSLaiTab)**

#### 🔹 Debug des Données
**Source**: `État interne React`
- **Données**: tickers chargés, stockData count, newsData count, dernière MAJ
- **Fréquence**: Temps réel (state changes)

#### 🔹 Gestion des Stocks
**Source**: `Supabase` via `/api/supabase-watchlist`
- **Table**: `team_tickers`
- **Données**: Liste des tickers suivis par l'équipe
- **Opérations**: Read, Add, Remove

#### 🔹 Diagnostic des APIs (Health Check)
**Source**: `/api/health-check-simple`
- **Données vérifiées**:
  - `perplexity_ai`: Status, response time, rate limit
  - `polygon_stock`: Status, response time, reliability
  - `finnhub_news`: Status, response time, reliability
  - `twelve_data`: Status, response time, reliability
  - `supabase`: Status, response time, tables count
  - `emma_agent`: Status, tools count
- **Fréquence**: Sur demande (bouton "Vérifier APIs")
- **Recommandations**: Générées automatiquement selon statut

#### 🔹 État des Connexions
**Source**: `checkApiStatus()` - fonction locale
- **Données**: Response time de chaque API
- **Fréquence**: Sur demande (bouton "Vérifier")

#### 🔹 Monitoring Emma AI
**Source**: Configuration statique + `/api/emma-agent` (test)
- **Données**:
  - Status Emma Agent (opérationnel/erreur)
  - Nombre d'outils disponibles (12)
  - Statut Cron Jobs (actif/inactif)
  - Statut Supabase (tables créées)

---

### 3. 📡 **Emma En Direct**

#### 🔹 SECTION 1: GÉNÉRER (Briefings)

**Pipeline de Génération**:

1. **ÉTAPE 0: Intent Analysis**
   - **Source**: `Perplexity AI Sonar Pro` (si briefing personnalisé)
   - **Données**: Intent, confidence, importance level, trending topics
   - **Note**: Skippée pour briefings prédéfinis (optimisation)

2. **ÉTAPE 1: Smart Data Gathering**
   - **Source**: `Emma Agent` + outils multiples
   - **Données collectées**:
     - Prix: `polygon-stock-price`
     - News: `finnhub-news`
     - Fundamentals: `fmp-fundamentals`
     - Earnings: `earnings-calendar`
     - Economic Events: `economic-calendar`
     - Technical: `twelve-data-technical`

3. **ÉTAPE 2: Content Selection**
   - **Source**: Logique interne (filtrage smart_data)

4. **ÉTAPE 3: Briefing Generation**
   - **Source**: `Perplexity AI Sonar Pro`
   - **Données**: Markdown formaté, analyse complète

#### 🔹 SECTION 2: AUTOMATION (Crons)
**Source**: `vercel.json` (configuration statique)
- **Données**:
  - Horaires: 7h20, 11h50, 16h20 ET
  - Timezone: Eastern Time (UTC-4/UTC-5)
  - Jours: Lundi-Vendredi
  - Destinataire: projetsjsl@gmail.com
- **Modification**: Scripts `npm run cron:edt` / `npm run cron:est`

#### 🔹 SECTION 3: PERSONNALISÉ
**Source**: Formulaire utilisateur → `Emma Agent` → `Perplexity AI`
- **Données entrées**: Prompt, tickers, sources, destinataires
- **Données générées**: Briefing sur-mesure

---

### 4. 📈 **Dan's Watchlist**

#### 🔹 Watchlist Tickers
**Source**: `Supabase` via `/api/supabase-watchlist`
- **Table**: `watchlist_tickers`
- **Données**: Liste personnelle de tickers
- **Opérations**: CRUD complet

#### 🔹 Stock Data (Watchlist)
**Source**: `Polygon.io` pour chaque ticker de la watchlist
- **Données**: Prix, variation, volume
- **Fréquence**: Refresh manuel ou auto (toutes les 5 min)

---

### 5. 🔍 **Seeking Alpha**

#### 🔹 Scraping Data
**Source**: `Seeking Alpha` (scraping manuel via F12)
- **Script**: `generateScrapingScript(ticker)`
- **Données**: Analyst ratings, price targets, news, earnings

#### 🔹 Analyse Claude
**Source**: `Anthropic Claude` via `/api/ai-services?service=claude-analyze`
- **Données**: Résumé structuré du contenu scrapé
- **Prompt**: Template d'analyse financière

---

### 6. 💬 **Claude Chat**

**Source**: `Anthropic Claude Sonnet` via `/api/gemini/chat-validated`
- **Model**: `claude-sonnet-4-20250514`
- **Données**: Réponses conversationnelles
- **Context**: Historique de conversation

---

## 🔧 **APIs Backend**

### `/api/emma-agent`
**Fournisseur**: Emma Agent (architecture cognitive)
- **Outils disponibles**:
  1. `polygon-stock-price`: Prix temps réel
  2. `fmp-fundamentals`: Données fondamentales (P/E, EPS, etc.)
  3. `finnhub-news`: Actualités financières
  4. `twelve-data-technical`: Indicateurs techniques
  5. `alpha-vantage-ratios`: Ratios financiers
  6. `team-tickers`: Liste équipe (Supabase)
  7. `earnings-calendar`: Calendrier résultats
  8. `economic-calendar`: Calendrier économique
  9. `analyst-recommendations`: Recommandations analystes
  10. `search-web`: Recherche web (Perplexity)
  11. `analyze-ticker`: Analyse complète ticker
  12. `generate-briefing`: Génération briefing

### `/api/emma-briefing`
**Fournisseur**: Pipeline de génération briefings
- **Types**: `morning`, `noon`, `evening`, `custom`
- **Output**: HTML email formaté

### `/api/cron-briefings`
**Fournisseur**: Vercel Cron Jobs
- **Schedules**:
  - `20 11 * * 1-5` (7h20 ET)
  - `50 15 * * 1-5` (11h50 ET)
  - `20 20 * * 1-5` (16h20 ET)

### `/api/health-check-simple`
**Fournisseur**: Système de diagnostic
- **Vérifie**: Toutes les APIs externes
- **Output**: Status, response time, recommandations

### `/api/supabase-watchlist`
**Fournisseur**: Supabase Database
- **Tables**:
  - `team_tickers`: Tickers équipe
  - `watchlist_tickers`: Tickers personnels
  - `briefing_history`: Historique briefings
  - `user_preferences`: Préférences utilisateur

---

## 📊 **Sources de Données Externes**

### 1. **Perplexity AI** (Intelligence)
- **URL**: `https://api.perplexity.ai`
- **Models**: `sonar-pro`, `sonar`
- **Usage**:
  - Intent Analysis
  - Briefing Generation
  - Recherche web intelligente
- **Rate Limit**: 50 requests/min
- **Cost**: Pay-per-use

### 2. **Polygon.io** (Prix Temps Réel)
- **URL**: `https://api.polygon.io`
- **Endpoints**: `/v2/aggs`, `/v2/snapshot`
- **Usage**: Prix, volumes, variations
- **Rate Limit**: 5 calls/min (Free), Unlimited (Paid)
- **Cost**: Free tier disponible

### 3. **Finnhub** (News)
- **URL**: `https://finnhub.io/api/v1`
- **Endpoints**: `/news`, `/quote`
- **Usage**: Actualités financières
- **Rate Limit**: 60 calls/min
- **Cost**: Free tier disponible

### 4. **Twelve Data** (Indicateurs Techniques)
- **URL**: `https://api.twelvedata.com`
- **Endpoints**: `/time_series`, `/rsi`, `/macd`
- **Usage**: Indicateurs techniques
- **Rate Limit**: 8 calls/min (Free)
- **Cost**: Free tier disponible

### 5. **Financial Modeling Prep (FMP)** (Fundamentaux)
- **URL**: `https://financialmodelingprep.com/api/v3`
- **Endpoints**: `/profile`, `/ratios`, `/income-statement`
- **Usage**: Données fondamentales
- **Rate Limit**: 250 calls/day (Free)
- **Cost**: Free tier disponible

### 6. **Alpha Vantage** (Ratios)
- **URL**: `https://www.alphavantage.co`
- **Endpoints**: `/query?function=OVERVIEW`
- **Usage**: Ratios financiers
- **Rate Limit**: 5 calls/min (Free)
- **Cost**: Free tier disponible

### 7. **Supabase** (Database)
- **URL**: Custom instance
- **Tables**: `team_tickers`, `watchlist_tickers`, `briefing_history`, `user_preferences`
- **Usage**: Persistence des données
- **Rate Limit**: Généreux (1M rows/mois Free)
- **Cost**: Free tier jusqu'à 500MB

### 8. **Anthropic Claude** (IA Conversationnelle)
- **URL**: `https://api.anthropic.com`
- **Models**: `claude-sonnet-4-20250514`
- **Usage**: Chat, analyse de texte
- **Rate Limit**: Par tier (varie selon plan)
- **Cost**: Pay-per-token

---

## 🔄 **Fréquences de Rafraîchissement Recommandées**

| Données | Fréquence | Trigger |
|---------|-----------|---------|
| **Prix Temps Réel** | 5 min | Auto-refresh |
| **News** | 15 min | Auto-refresh |
| **Indicateurs Techniques** | 1x par session | Manuel |
| **Fundamentaux** | 1x par jour | Manuel |
| **Health Check** | Sur demande | Bouton |
| **Briefings Crons** | Selon schedule | Vercel Cron |
| **Watchlist** | 5 min | Auto-refresh |

---

## 🎯 **Checklist de Cohérence**

Avant de modifier une source de données, vérifier:

- [ ] La source est documentée dans ce fichier
- [ ] Le rate limit est respecté
- [ ] Un fallback existe si possible
- [ ] Les logs d'erreur sont implémentés
- [ ] Le cache est utilisé pour réduire les appels
- [ ] La fréquence de refresh est optimale

---

## 📝 **Notes Importantes**

### Optimisations Actives

1. **Intent Analysis Skip** (Emma En Direct)
   - Briefings prédéfinis (morning/noon/evening) → Intent hardcodé
   - Économie: 5-15 secondes par génération

2. **Cache Smart Data** (À implémenter)
   - Stocker smart_data pendant 5 min
   - Éviter rappels API pour même ticker

3. **Batch Requests** (À implémenter)
   - Grouper les appels Polygon pour watchlist
   - 1 appel au lieu de N appels

### Sources à Éviter

- ❌ **Yahoo Finance**: Rate limits agressifs, bloque facilement
- ❌ **Google Finance**: Pas d'API publique
- ❌ **Bloomberg**: Payant, complexe
- ❌ **API gratuites non fiables**: CoinAPI, IEX Cloud Free tier (trop limité)

---

## 🔗 **Liens Utiles**

- [Polygon.io Docs](https://polygon.io/docs)
- [Finnhub Docs](https://finnhub.io/docs/api)
- [Twelve Data Docs](https://twelvedata.com/docs)
- [Perplexity AI Docs](https://docs.perplexity.ai)
- [Supabase Docs](https://supabase.com/docs)
- [Emma Agent Tools](../api/emma-agent.js) (voir ligne 150+)

---

**Dernière mise à jour**: 2025-01-16
**Mainteneur**: J. St-Louis AI via Claude Code
**Version**: 1.0.0
