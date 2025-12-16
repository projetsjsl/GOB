# Emma IA™ - Analyse des Systèmes de Function Calling et Chat Avancé

**Date:** 2025-11-05
**Objectif:** Améliorer les interactions Emma-utilisateur pour une assistante financière de niveau expert

---

## 📊 Architecture Actuelle

### 1. **Cognitive Scaffolding Layer** (Analyse d'intention)
- **Hybrid Intent Analyzer** (`lib/intent-analyzer.js`)
  - 19 intents financiers (stock_price, fundamentals, news, economic_analysis, etc.)
  - 450+ keywords en français/anglais
  - Clarity scoring (0-10) pour router local vs LLM
  - Extraction automatique de tickers (65+ companies mappées)
  - Support multi-ticker dans une seule requête

**Seuil actuel:** Clarity ≥9 → Local (20%), sinon LLM (80%)

### 2. **ReAct Reasoning Layer** (Sélection d'outils)
- **Smart Agent** (`api/emma-agent.js`)
  - Tool scoring avec 4 dimensions:
    - Priority score (configuration statique)
    - Relevance score (keywords + context)
    - Performance score (historique d'utilisation)
    - Recency bonus (outils récents réussis)
  - Intent boosting: +100 points si outil suggéré par intent analyzer
  - Max 5 outils en parallèle
  - Fallback automatique si échec

### 3. **Tool Use Layer** (Exécution)
- **17+ outils financiers** (`config/tools_config.json`)
  - FMP (Financial Modeling Prep): quote, fundamentals, ratios, ratings, news, calendrier
  - Polygon: stock price (fallback)
  - Alpha Vantage: ratios avancés (fallback)
  - Twelve Data: indicateurs techniques (RSI, MACD, SMA)
  - Finnhub: news (fallback)
  - Supabase: watchlists, team tickers
  - Calculator: ratios financiers
  - Yahoo Finance: fallback général

**Stratégie de fallback:** Primary → Fallback 1 → Fallback 2 → Error

### 4. **Synthesis Layer** (Génération de réponse)
- **LLM Router** avec 3 modèles:
  - **Perplexity Sonar Pro (80%)**: Requêtes factuelles avec sources
    - Factures intents: stock_price, fundamentals, news, comparative_analysis, economic_analysis, political_analysis, investment_strategy, risk_volatility, sector_industry, valuation, technical_analysis
    - Recency filters: day/week/month
  - **Gemini 2.0 Flash (15%)**: Questions conceptuelles/éducatives (gratuit)
    - Conceptual intents: portfolio (sans ticker), technical_analysis (théorique)
  - **Claude 3.5 Sonnet (5%)**: Premium writing (briefings uniquement)

### 5. **Conversation Memory**
- **Supabase Integration** (`lib/conversation-manager.js`)
  - Table `conversation_history`: messages par canal (web, SMS, email, messenger)
  - Table `user_profiles`: profils unifiés cross-canal
  - Formatage pour Emma: `{role: 'user'|'assistant', parts: [{text: '...'}]}`
  - Limite: 10 derniers messages chargés

---

## 🔍 Forces Actuelles

### ✅ Architecture Sophistiquée
1. **Cognitive Scaffolding**: L'intent analyzer enrichit le contexte avant sélection d'outils (meilleur que random tool selection)
2. **Multi-source Reliability**: Fallback chains garantissent disponibilité des données
3. **Smart Scoring**: Performance historique améliore sélection future
4. **Cross-channel Memory**: Conversations persistantes sur tous les canaux
5. **Real-time Data**: FMP (300 calls/min), Polygon, Yahoo Finance
6. **Source Attribution**: Toutes les fonctions Gemini retournent sources avec URLs

### ✅ Expert Financial Capabilities
1. **Comprehensive Analysis**: 17+ outils couvrent analyse fondamentale, technique, sentiment, news
2. **Financial Calculations**: Calculator tool pour ratios personnalisés
3. **Analyst Data**: Ratings, price targets, upgrades/downgrades
4. **Insider Trading**: Détection de signaux de confiance/méfiance
5. **DCF Valuation**: Détection de sous/sur-évaluation
6. **Economic Calendar**: Événements macro (GDP, CPI, Fed meetings)
7. **Earnings Calendar**: Résultats trimestriels à venir

---

## 🚀 Améliorations Recommandées

### 1. **Function Calling Natif (Gemini/Claude)**

**Problème:** Actuellement, Emma utilise un système custom de tool selection. Gemini 2.0 Flash et Claude 3.5 Sonnet supportent function calling natif (plus rapide, plus précis).

**Solution:**
```javascript
// AVANT (system custom)
const selectedTools = await this._plan_with_scoring(userMessage, context);
const toolResults = await this._execute_all(selectedTools, userMessage, context);

// APRÈS (Gemini function calling natif)
const response = await gemini.generateContent({
  contents: [{role: 'user', parts: [{text: userMessage}]}],
  tools: [{functionDeclarations: geminiTools}], // 20+ functions déjà définies
  toolConfig: {
    functionCallingConfig: {
      mode: 'AUTO', // Gemini choisit automatiquement
      allowedFunctionNames: ['getStockPrice', 'getFundamentals', ...]
    }
  }
});

// Gemini retourne function_call → Emma exécute → Gemini synthétise
if (response.functionCalls) {
  const results = await Promise.all(
    response.functionCalls.map(fc => executeFunction(fc.name, fc.args))
  );
  // Renvoyer résultats à Gemini pour synthèse finale
}
```

**Avantages:**
- ⚡ **Plus rapide**: 1 appel LLM au lieu de 2 (intent analysis + synthesis)
- 🎯 **Plus précis**: Gemini comprend mieux quels outils utiliser
- 🔄 **Multi-turn**: Gemini peut appeler plusieurs fonctions en série
- 💰 **Moins cher**: Moins d'appels API

**Fichiers à modifier:**
- `api/emma-agent.js` - Activer Gemini function calling
- `lib/gemini/functions.js` - Déjà 20+ fonctions définies ✅
- `api/gemini/chat.js` - Router vers emma-agent pour function calling

**Implémentation:** Ajouter mode `FUNCTION_CALLING` dans emma-agent avec toggle entre custom scoring et native calling.

---

### 2. **Streaming Responses (UX Améliorée)**

**Problème:** Actuellement, Emma répond en bloc après exécution complète. Pour analyses longues, l'utilisateur attend 10-30 secondes sans feedback.

**Solution:**
```javascript
// Streaming avec Server-Sent Events (SSE)
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Stream 1: Intent analysis
  res.write(`data: ${JSON.stringify({type: 'intent', data: intentData})}\n\n`);

  // Stream 2: Tool execution (parallèle)
  for (const tool of selectedTools) {
    const result = await executeTool(tool);
    res.write(`data: ${JSON.stringify({type: 'tool', data: result})}\n\n`);
  }

  // Stream 3: LLM response (token by token)
  const stream = await perplexity.generateContentStream(prompt);
  for await (const chunk of stream) {
    res.write(`data: ${JSON.stringify({type: 'text', data: chunk.text})}\n\n`);
  }

  res.write('data: [DONE]\n\n');
  res.end();
}
```

**Avantages:**
- ⚡ Feedback immédiat ("Analyzing AAPL...", "Fetching fundamentals...")
- 📊 Progressive rendering (affiche prix pendant que ratios se chargent)
- 🎯 Meilleure UX mobile (surtout SMS - utilisateur voit réponse arriver)

**Fichiers à modifier:**
- `api/chat.js` - Ajouter mode streaming
- `api/emma-agent.js` - Emit events pendant exécution
- `lib/channel-adapter.js` - SMS: accumuler stream → envoyer complet

---

### 3. **RAG (Retrieval Augmented Generation) pour Recherche Financière**

**Problème:** Emma ne peut pas répondre à des questions de recherche approfondie ("Quels sont les meilleurs secteurs pour 2025 selon les analystes?") sans données structurées.

**Solution:**
```javascript
// Vector database pour research papers + analyst reports
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { OpenAIEmbeddings } from '@langchain/openai';

// 1. Ingestion (batch script)
await vectorStore.addDocuments([
  {pageContent: "Goldman Sachs Q1 2025 outlook: Tech sector...", metadata: {source: "GS", date: "2025-01-15"}},
  {pageContent: "Morgan Stanley: Energy sector undervalued...", metadata: {source: "MS", date: "2025-01-10"}},
  // ... 1000s de documents
]);

// 2. Retrieval (dans emma-agent.js)
const relevantDocs = await vectorStore.similaritySearch(userMessage, 5);

// 3. Augmentation du prompt
const augmentedPrompt = `
Context (analyst research):
${relevantDocs.map(d => d.pageContent).join('\n\n')}

User question: ${userMessage}
`;
```

**Sources de données:**
- Analyst reports (Goldman, Morgan Stanley, JP Morgan)
- Research papers (Seeking Alpha, Morningstar)
- SEC filings (10-K, 10-Q summaries)
- Financial blogs (Ben Graham, Joel Greenblatt)

**Avantages:**
- 🧠 **Expert knowledge**: Emma cite recherches professionnelles
- 📚 **Historical context**: Comparaisons multi-années
- 🎯 **Precise sourcing**: "Selon Goldman Sachs (Jan 2025)..."

**Fichiers à créer:**
- `lib/rag/vector-store.js` - Supabase pgvector integration
- `lib/rag/ingestion.js` - Batch script pour charger documents
- `api/emma-agent.js` - Ajouter retrieval avant LLM call

---

### 4. **Multi-Step Planning avec Tool Chaining**

**Problème:** Emma exécute outils en parallèle mais ne peut pas faire "Si P/E > 30, alors chercher alternatives dans même secteur avec P/E < 20".

**Solution:**
```javascript
// ReAct Loop avec conditional execution
class MultiStepPlanner {
  async executePlan(userMessage, context) {
    const plan = await this.generatePlan(userMessage); // LLM génère plan
    // Plan: [
    //   {step: 1, action: 'getFundamentals', params: {symbol: 'AAPL'}, condition: null},
    //   {step: 2, action: 'checkValuation', params: {}, condition: 'if pe > 30'},
    //   {step: 3, action: 'findAlternatives', params: {sector: 'Technology'}, condition: 'if overvalued'}
    // ]

    const results = [];
    for (const step of plan) {
      // Évaluer condition
      if (step.condition && !this.evaluateCondition(step.condition, results)) {
        console.log(`Skipping step ${step.step}: condition not met`);
        continue;
      }

      // Exécuter action
      const result = await this.executeAction(step.action, step.params, results);
      results.push({step: step.step, action: step.action, result});

      // Early exit si goal atteint
      if (this.goalAchieved(results)) break;
    }

    return results;
  }
}
```

**Exemples d'usage:**
- "Compare AAPL vs MSFT, et si AAPL est plus cher, trouve moi 3 alternatives tech moins chères"
- "Analyse TSLA, et si P/E > 50, explique pourquoi (growth story, brand moat, etc.)"
- "Trouve les 5 titres les plus sous-évalués dans le S&P 500 (P/E < 15, ROE > 15%)"

**Fichiers à créer:**
- `lib/planning/multi-step-planner.js` - ReAct loop with conditions
- `lib/planning/goal-evaluator.js` - Check if goal achieved
- `api/emma-agent.js` - Use planner for complex queries

---

### 5. **Context Window Management (Long Conversations)**

**Problème:** Après 50+ messages, historique dépasse context window (128k tokens). Emma perd mémoire des discussions anciennes.

**Solution:**
```javascript
// Compression intelligente de l'historique
class ConversationCompressor {
  async compressHistory(messages, maxTokens = 100000) {
    // 1. Garder messages récents (dernier 10)
    const recentMessages = messages.slice(-10);

    // 2. Extraire insights des messages anciens (summarization)
    const oldMessages = messages.slice(0, -10);
    const summary = await this.summarizeOldMessages(oldMessages);
    // Summary: "L'utilisateur a demandé analyses de AAPL (3x), MSFT (2x), GOOGL (1x).
    //           Préoccupations: valorisation tech, impact taux Fed, secteur IA.
    //           Watchlist: AAPL, MSFT, NVDA, TSM."

    // 3. Combiner
    return [
      {role: 'system', content: `Conversation summary: ${summary}`},
      ...recentMessages
    ];
  }

  async summarizeOldMessages(messages) {
    const grouped = this.groupByTopic(messages); // Groupe par ticker/topic
    const summaries = await Promise.all(
      grouped.map(group => this.summarizeGroup(group))
    );
    return summaries.join('\n');
  }
}
```

**Avantages:**
- 📚 **Infinite memory**: Emma se souvient de conversations de plusieurs mois
- 🎯 **Context relevance**: Garde insights importants (watchlist, préférences)
- 💰 **Cost optimization**: Moins de tokens envoyés à LLM

**Fichiers à créer:**
- `lib/conversation/compressor.js` - Summarization + extraction
- `lib/conversation-manager.js` - Intégrer compression automatique

---

### 6. **Financial Calculation Tools (Portfolio Optimization)**

**Problème:** Emma ne peut pas faire de calculs financiers avancés (optimisation Markowitz, Value at Risk, Sharpe ratio).

**Solution:**
```javascript
// Nouveaux outils financiers
const advancedFinancialTools = [
  {
    id: 'portfolio-optimizer',
    name: 'Portfolio Optimizer',
    description: 'Optimisation de portefeuille (Markowitz, Black-Litterman)',
    parameters: {
      tickers: {type: 'array', required: true},
      targetReturn: {type: 'number', required: false},
      riskFreeRate: {type: 'number', required: false, default: 0.03}
    },
    implementation: async (params) => {
      // 1. Récupérer historical prices (1 an)
      const prices = await fetchHistoricalPrices(params.tickers);

      // 2. Calculer returns, covariance matrix
      const returns = calculateReturns(prices);
      const covMatrix = calculateCovariance(returns);

      // 3. Optimisation (maximize Sharpe ratio)
      const weights = optimizePortfolio(returns, covMatrix, params.targetReturn);

      return {
        weights: weights, // {AAPL: 0.3, MSFT: 0.25, GOOGL: 0.2, ...}
        expectedReturn: 0.15,
        volatility: 0.18,
        sharpeRatio: 0.67
      };
    }
  },
  {
    id: 'value-at-risk',
    name: 'Value at Risk (VaR)',
    description: 'Calcul du risque de perte maximale (95%, 99% confidence)',
    implementation: async (params) => {
      const prices = await fetchHistoricalPrices(params.tickers);
      const returns = calculateReturns(prices);

      // Historical VaR (percentile method)
      const var95 = percentile(returns, 0.05);
      const var99 = percentile(returns, 0.01);

      return {
        var95: var95, // -5.2% (perte max 95% du temps)
        var99: var99, // -8.7% (perte max 99% du temps)
        cvar95: calculateCVaR(returns, 0.05) // Expected Shortfall
      };
    }
  },
  {
    id: 'beta-calculator',
    name: 'Beta Calculator',
    description: 'Calcul du beta (volatilité relative au marché)',
    implementation: async (params) => {
      const stockPrices = await fetchHistoricalPrices([params.ticker]);
      const marketPrices = await fetchHistoricalPrices(['SPY']); // S&P 500

      const beta = calculateBeta(stockPrices, marketPrices);

      return {
        beta: beta, // 1.2 = 20% plus volatil que marché
        interpretation: beta > 1 ? 'More volatile than market' : 'Less volatile than market'
      };
    }
  },
  {
    id: 'dividend-discount-model',
    name: 'Dividend Discount Model (DDM)',
    description: 'Valorisation par dividendes (Gordon Growth Model)',
    implementation: async (params) => {
      const fundamentals = await fetchFundamentals(params.ticker);
      const dividend = fundamentals.dividendPerShare;
      const growthRate = params.growthRate || 0.05;
      const discountRate = params.discountRate || 0.10;

      // Gordon Growth: P = D1 / (r - g)
      const intrinsicValue = (dividend * (1 + growthRate)) / (discountRate - growthRate);
      const currentPrice = fundamentals.price;

      return {
        intrinsicValue: intrinsicValue,
        currentPrice: currentPrice,
        upside: ((intrinsicValue - currentPrice) / currentPrice) * 100, // %
        rating: intrinsicValue > currentPrice ? 'Undervalued' : 'Overvalued'
      };
    }
  }
];
```

**Avantages:**
- 📊 **Professional analysis**: Outils utilisés par gestionnaires de fonds
- 🎯 **Personalized advice**: "Votre portefeuille a un Sharpe ratio de 0.5, voici comment l'améliorer"
- 🧠 **Risk management**: VaR, CVaR, stress testing

**Fichiers à créer:**
- `lib/finance/portfolio-optimizer.js` - Markowitz optimization
- `lib/finance/risk-calculator.js` - VaR, CVaR, beta
- `lib/finance/valuation-models.js` - DDM, DCF, P/E multiples
- `config/tools_config.json` - Ajouter 10+ nouveaux outils

---

### 7. **Caching Layer (Performance + Cost)**

**Problème:** Emma refetch les mêmes données plusieurs fois (ex: "Analyze AAPL" → fetch fundamentals, puis "Compare AAPL vs MSFT" → refetch AAPL).

**Solution:**
```javascript
// Redis-like caching avec Supabase
class DataCache {
  constructor() {
    this.cache = new Map(); // In-memory cache (ephemeral)
    this.supabase = createSupabaseClient(); // Persistent cache
  }

  async get(key, ttlMinutes = 5) {
    // 1. Check in-memory
    if (this.cache.has(key)) {
      const {data, timestamp} = this.cache.get(key);
      if (Date.now() - timestamp < ttlMinutes * 60 * 1000) {
        console.log(`✅ Cache HIT (memory): ${key}`);
        return data;
      }
    }

    // 2. Check Supabase
    const {data: cached} = await this.supabase
      .from('api_cache')
      .select('data, created_at')
      .eq('key', key)
      .gte('created_at', new Date(Date.now() - ttlMinutes * 60 * 1000).toISOString())
      .single();

    if (cached) {
      console.log(`✅ Cache HIT (Supabase): ${key}`);
      this.cache.set(key, {data: cached.data, timestamp: Date.now()});
      return cached.data;
    }

    console.log(`❌ Cache MISS: ${key}`);
    return null;
  }

  async set(key, data, ttlMinutes = 5) {
    // 1. Save to memory
    this.cache.set(key, {data, timestamp: Date.now()});

    // 2. Save to Supabase (persistent)
    await this.supabase
      .from('api_cache')
      .upsert({
        key: key,
        data: data,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString()
      });
  }
}

// Usage dans emma-agent.js
const cacheKey = `fmp-fundamentals:${ticker}`;
let fundamentals = await cache.get(cacheKey, 5); // 5 min TTL
if (!fundamentals) {
  fundamentals = await fetchFundamentals(ticker);
  await cache.set(cacheKey, fundamentals, 5);
}
```

**Stratégies de TTL:**
- **Stock prices**: 1 minute (real-time)
- **Fundamentals**: 1 heure (change rarement)
- **News**: 5 minutes (balance freshness vs cost)
- **Analyst ratings**: 24 heures (change peu)
- **Historical data**: 1 semaine (ne change jamais)

**Avantages:**
- ⚡ **10x faster**: Pas d'appel API si cached
- 💰 **90% cheaper**: FMP limite 300 calls/min
- 📊 **Better UX**: Réponses instantanées

**Fichiers à créer:**
- `lib/cache/data-cache.js` - Caching layer
- `supabase-cache-setup.sql` - Table api_cache
- `api/emma-agent.js` - Intégrer cache dans tool execution

---

### 8. **Sentiment Analysis Tools (News + Social)**

**Problème:** Emma cite news mais ne peut pas extraire sentiment global ("Les news sur AAPL sont-elles positives ou négatives cette semaine?").

**Solution:**
```javascript
// Sentiment aggregation avec FinBERT (Hugging Face)
const sentimentTools = [
  {
    id: 'news-sentiment-aggregator',
    name: 'News Sentiment Aggregator',
    description: 'Analyse sentiment agrégé sur 7 jours (FinBERT)',
    implementation: async (params) => {
      const news = await fetchNews(params.ticker, 7); // 7 jours

      // Analyse sentiment avec FinBERT (financial-specific BERT)
      const sentiments = await Promise.all(
        news.map(article => analyzeSentiment(article.title + ' ' + article.summary))
      );

      // Agrégation
      const positive = sentiments.filter(s => s.label === 'positive').length;
      const negative = sentiments.filter(s => s.label === 'negative').length;
      const neutral = sentiments.filter(s => s.label === 'neutral').length;

      const score = (positive - negative) / sentiments.length; // -1 to +1

      return {
        ticker: params.ticker,
        timeframe: '7 days',
        totalArticles: sentiments.length,
        positive: positive,
        negative: negative,
        neutral: neutral,
        sentimentScore: score, // -0.3 = bearish, +0.5 = bullish
        interpretation: score > 0.2 ? 'Bullish' : score < -0.2 ? 'Bearish' : 'Neutral',
        topPositiveNews: news.filter((n, i) => sentiments[i].label === 'positive').slice(0, 3),
        topNegativeNews: news.filter((n, i) => sentiments[i].label === 'negative').slice(0, 3)
      };
    }
  },
  {
    id: 'reddit-sentiment',
    name: 'Reddit WallStreetBets Sentiment',
    description: 'Sentiment social sur Reddit (WSB, stocks, investing)',
    implementation: async (params) => {
      // Reddit API (PRAW) - scrape r/wallstreetbets, r/stocks
      const posts = await fetchRedditPosts(params.ticker, 'wallstreetbets', 100);
      const comments = await fetchRedditComments(posts);

      // Analyse sentiment
      const sentiments = await analyzeSentiments([...posts, ...comments]);

      return {
        ticker: params.ticker,
        source: 'Reddit (WSB)',
        mentions: posts.length,
        sentimentScore: calculateAverageSentiment(sentiments),
        trending: posts.filter(p => p.upvotes > 1000).length > 5 // High activity
      };
    }
  },
  {
    id: 'twitter-sentiment',
    name: 'Twitter/X Financial Sentiment',
    description: 'Sentiment Twitter de comptes financiers vérifiés',
    implementation: async (params) => {
      // Twitter API v2 - filtre: verified accounts + finance keywords
      const tweets = await fetchTweets(`$${params.ticker}`, {
        verified: true,
        minFollowers: 10000 // Influenceurs financiers
      });

      const sentiments = await analyzeSentiments(tweets);

      return {
        ticker: params.ticker,
        source: 'Twitter (verified accounts)',
        tweets: tweets.length,
        sentimentScore: calculateAverageSentiment(sentiments),
        topBullishTweets: tweets.filter((t, i) => sentiments[i].label === 'positive').slice(0, 3),
        topBearishTweets: tweets.filter((t, i) => sentiments[i].label === 'negative').slice(0, 3)
      };
    }
  }
];
```

**Avantages:**
- 🎯 **Signal detection**: Détecter retournements avant le marché
- 📊 **Social proof**: "Reddit WSB est très bullish sur TSLA (score +0.8)"
- 🧠 **Contrarian indicator**: Si WSB trop bullish → potentiel top

**Fichiers à créer:**
- `lib/sentiment/finbert-analyzer.js` - Hugging Face FinBERT API
- `lib/sentiment/reddit-scraper.js` - Reddit API integration
- `lib/sentiment/twitter-scraper.js` - Twitter API v2
- `config/tools_config.json` - Ajouter sentiment tools

---

### 9. **Technical Indicators Calculator (Avancé)**

**Problème:** Emma peut fetcher Twelve Data pour RSI/MACD, mais ne peut pas faire calculs custom ("Moyenne mobile 50 jours vs 200 jours - Golden Cross?").

**Solution:**
```javascript
// Local calculation (évite API calls)
import { SMA, EMA, RSI, MACD, BollingerBands, Stochastic } from 'technicalindicators';

const technicalTools = [
  {
    id: 'golden-cross-detector',
    name: 'Golden Cross / Death Cross Detector',
    description: 'Détecte croisements SMA 50/200 (signaux buy/sell)',
    implementation: async (params) => {
      const prices = await fetchHistoricalPrices(params.ticker, 250); // 1 an

      const sma50 = SMA.calculate({period: 50, values: prices});
      const sma200 = SMA.calculate({period: 200, values: prices});

      // Détection croisement
      const lastSma50 = sma50[sma50.length - 1];
      const lastSma200 = sma200[sma200.length - 1];
      const prevSma50 = sma50[sma50.length - 2];
      const prevSma200 = sma200[sma200.length - 2];

      let signal = 'neutral';
      if (prevSma50 < prevSma200 && lastSma50 > lastSma200) {
        signal = 'golden_cross'; // Bullish
      } else if (prevSma50 > prevSma200 && lastSma50 < lastSma200) {
        signal = 'death_cross'; // Bearish
      }

      return {
        ticker: params.ticker,
        sma50: lastSma50,
        sma200: lastSma200,
        signal: signal,
        interpretation: signal === 'golden_cross'
          ? 'BULLISH: Golden Cross detected (buy signal)'
          : signal === 'death_cross'
          ? 'BEARISH: Death Cross detected (sell signal)'
          : `Neutral (SMA50: ${lastSma50.toFixed(2)}, SMA200: ${lastSma200.toFixed(2)})`
      };
    }
  },
  {
    id: 'rsi-overbought-oversold',
    name: 'RSI Overbought/Oversold Detector',
    description: 'Détecte conditions RSI extrêmes (>70 overbought, <30 oversold)',
    implementation: async (params) => {
      const prices = await fetchHistoricalPrices(params.ticker, 50);
      const rsi = RSI.calculate({period: 14, values: prices});
      const currentRsi = rsi[rsi.length - 1];

      let signal = 'neutral';
      if (currentRsi > 70) signal = 'overbought';
      else if (currentRsi < 30) signal = 'oversold';

      return {
        ticker: params.ticker,
        rsi: currentRsi,
        signal: signal,
        interpretation: signal === 'overbought'
          ? 'OVERBOUGHT: Potential pullback (sell signal)'
          : signal === 'oversold'
          ? 'OVERSOLD: Potential bounce (buy signal)'
          : 'Neutral momentum'
      };
    }
  },
  {
    id: 'bollinger-squeeze',
    name: 'Bollinger Bands Squeeze',
    description: 'Détecte consolidation (précède breakout)',
    implementation: async (params) => {
      const prices = await fetchHistoricalPrices(params.ticker, 50);
      const bb = BollingerBands.calculate({period: 20, values: prices, stdDev: 2});

      const lastBB = bb[bb.length - 1];
      const bandwidth = (lastBB.upper - lastBB.lower) / lastBB.middle;

      // Squeeze = bandwidth < 0.1 (bandes très serrées)
      const squeeze = bandwidth < 0.1;

      return {
        ticker: params.ticker,
        upper: lastBB.upper,
        middle: lastBB.middle,
        lower: lastBB.lower,
        bandwidth: bandwidth,
        squeeze: squeeze,
        interpretation: squeeze
          ? 'SQUEEZE: Low volatility, breakout imminent (watch for direction)'
          : 'Normal volatility'
      };
    }
  }
];
```

**Avantages:**
- ⚡ **Local calculation**: Pas d'API rate limits
- 🎯 **Custom strategies**: Combiner plusieurs indicateurs
- 📊 **Backtesting**: Tester stratégies sur historical data

**Fichiers à créer:**
- `lib/technical/indicators.js` - Wrapper around technicalindicators
- `lib/technical/signal-detector.js` - Combine indicators
- `config/tools_config.json` - Ajouter technical tools

---

### 10. **Price Alerts & Monitoring**

**Problème:** Emma répond ponctuellement mais ne peut pas "surveiller AAPL et m'alerter si prix < $150".

**Solution:**
```javascript
// Background monitoring avec cron jobs
class PriceAlertManager {
  async createAlert(userId, ticker, condition, notificationChannel) {
    // Sauvegarder dans Supabase
    await this.supabase.from('price_alerts').insert({
      user_id: userId,
      ticker: ticker,
      condition: condition, // {type: 'price_below', value: 150}
      notification_channel: notificationChannel, // 'sms', 'email', 'web'
      status: 'active'
    });
  }

  async checkAlerts() {
    // Cron job (toutes les 5 minutes)
    const alerts = await this.supabase
      .from('price_alerts')
      .select('*')
      .eq('status', 'active');

    for (const alert of alerts) {
      const price = await fetchCurrentPrice(alert.ticker);

      if (this.conditionMet(alert.condition, price)) {
        // Envoyer notification
        await this.sendNotification(alert.user_id, alert.notification_channel, {
          ticker: alert.ticker,
          price: price,
          condition: alert.condition,
          message: `🚨 ALERT: ${alert.ticker} price is now $${price} (condition: ${alert.condition.type})`
        });

        // Marquer comme triggered
        await this.supabase
          .from('price_alerts')
          .update({status: 'triggered', triggered_at: new Date().toISOString()})
          .eq('id', alert.id);
      }
    }
  }

  conditionMet(condition, price) {
    switch (condition.type) {
      case 'price_above': return price > condition.value;
      case 'price_below': return price < condition.value;
      case 'change_percent_above': return calculateChange(price) > condition.value;
      case 'change_percent_below': return calculateChange(price) < condition.value;
      default: return false;
    }
  }
}

// Nouveaux intents pour alerts
// "Alerte moi si AAPL tombe sous 150$"
// "Surveille TSLA et dis moi si +5% en une journée"
```

**Configuration cron** (`vercel.json`):
```json
{
  "crons": [
    {
      "path": "/api/alerts-cron",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Avantages:**
- 🚨 **Proactive**: Emma alerte au lieu de attendre questions
- 📱 **Multi-channel**: SMS, email, web push
- 🎯 **Customizable**: Conditions complexes (RSI, volume, news sentiment)

**Fichiers à créer:**
- `lib/alerts/alert-manager.js` - Alert creation + checking
- `api/alerts-cron.js` - Cron job handler
- `supabase-alerts-setup.sql` - Table price_alerts
- `lib/intent-analyzer.js` - Ajouter intent 'create_alert'

---

## 🎯 Priorités Recommandées

### Phase 1: Quick Wins (1-2 semaines)
1. ✅ **Caching Layer** - Réduction immédiate coûts + latence
2. ✅ **Streaming Responses** - Meilleure UX mobile/SMS
3. ✅ **Technical Indicators** - Outils demandés fréquemment

### Phase 2: Core Improvements (2-4 semaines)
4. ✅ **Function Calling Natif** - Gemini/Claude native tools
5. ✅ **Context Window Management** - Long conversations
6. ✅ **Sentiment Analysis** - News + social signals

### Phase 3: Advanced Features (1-2 mois)
7. ✅ **RAG System** - Analyst research integration
8. ✅ **Multi-Step Planning** - Complex queries with conditions
9. ✅ **Financial Calculators** - Portfolio optimization, VaR

### Phase 4: Proactive Features (2-3 mois)
10. ✅ **Price Alerts** - Background monitoring + notifications

---

## 📦 Nouvelles Dépendances Requises

```json
{
  "dependencies": {
    "technicalindicators": "^3.1.0",
    "ioredis": "^5.3.2",
    "@langchain/community": "^0.0.20",
    "@langchain/openai": "^0.0.14",
    "@huggingface/inference": "^2.6.4",
    "praw": "^1.0.0",
    "twitter-api-v2": "^1.15.0",
    "mathjs": "^12.2.0"
  }
}
```

---

## 🎓 Conclusion

Emma possède déjà une architecture sophistiquée de niveau **expert**:
- ✅ Cognitive scaffolding avec intent analysis
- ✅ ReAct reasoning avec tool scoring
- ✅ Multi-source reliability avec fallbacks
- ✅ LLM routing intelligent (Perplexity/Gemini/Claude)
- ✅ Cross-channel conversation memory

Les 10 améliorations proposées la transformeront en **assistante financière de niveau institutionnel**:
- 🚀 Function calling natif (vitesse + précision)
- ⚡ Streaming pour UX temps réel
- 🧠 RAG pour recherche professionnelle
- 📊 Calculateurs financiers avancés (VaR, portfolio optimization)
- 🎯 Sentiment analysis (news + social)
- 💰 Caching pour performance + économies
- 🚨 Alerts proactives

**Prochaine étape:** Quelle phase veux-tu prioriser? Je recommande Phase 1 (caching + streaming) pour impact immédiat.
