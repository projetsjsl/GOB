// Endpoint API unifié pour Vercel: regroupe toutes les routes en une seule

export default async function handler(req, res) {
  try {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // L'action top-level est prioritaire dans la query string pour éviter les collisions
    const action = (req.query && req.query.action) || ((req.method !== 'GET' && req.body && req.body.action) ? req.body.action : undefined) || 'health';

    switch (action) {
      case 'health':
        return res.status(200).json({ ok: true, status: 'healthy', timestamp: new Date().toISOString() });
      case 'ping':
        return res.status(200).json({ pong: true, timestamp: new Date().toISOString() });

      case 'status':
        return handleStatus(req, res);

      case 'finnhub':
        return handleFinnhub(req, res);

      case 'news':
        return handleNews(req, res);

      case 'gemini_chat':
        return handleGeminiChat(req, res);

      case 'gemini_key':
        return handleGeminiKey(req, res);

      case 'github_tickers':
        return handleGithubTickers(req, res);

      case 'github_watchlist':
        return handleGithubWatchlist(req, res);

      case 'github_token':
        return handleGithubToken(req, res);

      case 'github_update':
        return handleGithubUpdate(req, res);

      case 'save_tickers':
        return handleSaveTickers(req, res);

      case 'fallback':
        return handleFallback(req, res);

      case 'claude':
        return handleClaude(req, res);

      default:
        return res.status(400).json({ error: 'Action non supportée', action, supported: [
          'health', 'ping', 'status', 'finnhub', 'news', 'gemini_chat', 'gemini_key',
          'github_tickers', 'github_watchlist', 'github_token', 'github_update', 'save_tickers',
          'fallback', 'claude'
        ]});
    }
  } catch (error) {
    console.error('Erreur /api/unified:', error);
    return res.status(500).json({ error: 'Erreur serveur', message: error.message });
  }
}

// -----------------------------
// Implémentations des actions
// -----------------------------

async function handleStatus(req, res) {
  const { test = false } = req.method === 'GET' ? req.query : (req.body || {});

  const apis = {
    finnhub: {
      name: 'Finnhub',
      key: process.env.FINNHUB_API_KEY,
      baseUrl: 'https://finnhub.io/api/v1',
      testUrl: 'https://finnhub.io/api/v1/quote?symbol=AAPL&token=',
      status: 'unknown',
      responseTime: 0,
      error: null,
      lastCheck: null
    },
    newsapi: {
      name: 'NewsAPI.ai',
      key: process.env.NEWSAPI_KEY,
      baseUrl: 'https://newsapi.ai/api/v1',
      testUrl: 'https://newsapi.ai/api/v1/article/getArticles',
      status: 'unknown',
      responseTime: 0,
      error: null,
      lastCheck: null
    },
    alphaVantage: {
      name: 'Alpha Vantage',
      key: process.env.ALPHA_VANTAGE_API_KEY,
      baseUrl: 'https://www.alphavantage.co/query',
      testUrl: 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=',
      status: 'unknown',
      responseTime: 0,
      error: null,
      lastCheck: null
    },
    claude: {
      name: 'Claude AI',
      key: process.env.ANTHROPIC_API_KEY,
      baseUrl: 'https://api.anthropic.com',
      testUrl: 'https://api.anthropic.com/v1/messages',
      status: 'unknown',
      responseTime: 0,
      error: null,
      lastCheck: null
    },
    github: {
      name: 'GitHub API',
      key: process.env.GITHUB_TOKEN,
      baseUrl: 'https://api.github.com',
      testUrl: 'https://api.github.com/user',
      status: 'unknown',
      responseTime: 0,
      error: null,
      lastCheck: null
    }
  };

  const testApi = async (apiName, apiConfig) => {
    const startTime = Date.now();
    try {
      if (!apiConfig.key || apiConfig.key.includes('YOUR_') || apiConfig.key.includes('_KEY')) {
        return {
          status: 'not_configured',
          responseTime: 0,
          error: 'Clé API non configurée',
          lastCheck: new Date().toISOString()
        };
      }

      let response;
      switch (apiName) {
        case 'finnhub':
          response = await fetch(`${apiConfig.testUrl}${apiConfig.key}`);
          break;
        case 'newsapi':
          response = await fetch(apiConfig.testUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              apiKey: apiConfig.key,
              query: { $query: { keyword: 'finance' } },
              resultType: 'articles',
              articlesCount: 1
            })
          });
          break;
        case 'alphaVantage':
          response = await fetch(`${apiConfig.testUrl}${apiConfig.key}`);
          break;
        case 'claude':
          response = await fetch(apiConfig.testUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiConfig.key,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: 'claude-3-haiku-20240307',
              max_tokens: 10,
              messages: [{ role: 'user', content: 'test' }]
            })
          });
          break;
        case 'github':
          response = await fetch(apiConfig.testUrl, {
            headers: { 'Authorization': `token ${apiConfig.key}` }
          });
          break;
        default:
          throw new Error('API non reconnue');
      }

      const responseTime = Date.now() - startTime;
      if (response.ok) {
        return { status: 'working', responseTime, error: null, lastCheck: new Date().toISOString() };
      } else {
        return { status: 'error', responseTime, error: `HTTP ${response.status}: ${response.statusText}`, lastCheck: new Date().toISOString() };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return { status: 'error', responseTime, error: error.message, lastCheck: new Date().toISOString() };
    }
  };

  if (String(test) === 'true') {
    const testResults = {};
    for (const [apiName, apiConfig] of Object.entries(apis)) {
      const result = await testApi(apiName, apiConfig);
      testResults[apiName] = { ...apiConfig, ...result };
    }
    return res.status(200).json({
      apis: testResults,
      timestamp: new Date().toISOString(),
      testMode: true,
      summary: {
        total: Object.keys(apis).length,
        working: Object.values(testResults).filter(api => api.status === 'working').length,
        notConfigured: Object.values(testResults).filter(api => api.status === 'not_configured').length,
        errors: Object.values(testResults).filter(api => api.status === 'error').length
      }
    });
  } else {
    const statusResults = {};
    for (const [apiName, apiConfig] of Object.entries(apis)) {
      statusResults[apiName] = {
        name: apiConfig.name,
        configured: !!(apiConfig.key && !apiConfig.key.includes('YOUR_') && !apiConfig.key.includes('_KEY')),
        status: 'unknown',
        lastCheck: null
      };
    }
    return res.status(200).json({
      apis: statusResults,
      timestamp: new Date().toISOString(),
      testMode: false,
      message: 'Utilisez action=status&test=true pour tester les APIs'
    });
  }
}

async function handleFinnhub(req, res) {
  const params = req.method === 'GET' ? req.query : (req.body || {});
  const { endpoint, symbol, limit = 10 } = params;
  const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'YOUR_FINNHUB_API_KEY';

  const demoData = {
    SPX: { c: 4567.89, d: 38.75, dp: 0.85, h: 4580.12, l: 4550.23, o: 4560.45, pc: 4529.14, t: Date.now() },
    IXIC: { c: 14234.56, d: 175.23, dp: 1.23, h: 14280.45, l: 14150.67, o: 14200.12, pc: 14059.33, t: Date.now() },
    DJI: { c: 34567.89, d: -156.78, dp: -0.45, h: 34750.12, l: 34500.45, o: 34650.67, pc: 34724.67, t: Date.now() },
    TSX: { c: 20123.45, d: 134.56, dp: 0.67, h: 20180.23, l: 20050.12, o: 20100.34, pc: 19988.89, t: Date.now() },
    EURUSD: { c: 1.0845, d: 0.0013, dp: 0.12, h: 1.0856, l: 1.0823, o: 1.0834, pc: 1.0832, t: Date.now() },
    GOLD: { c: 2034.50, d: -6.89, dp: -0.34, h: 2045.67, l: 2025.34, o: 2038.45, pc: 2041.39, t: Date.now() },
    OIL: { c: 78.45, d: 1.23, dp: 1.56, h: 79.12, l: 77.89, o: 78.12, pc: 77.22, t: Date.now() },
    BTCUSD: { c: 43567.89, d: 998.45, dp: 2.34, h: 44123.45, l: 42890.12, o: 43234.56, pc: 42569.44, t: Date.now() },
  };

  if (!FINNHUB_API_KEY || FINNHUB_API_KEY === 'YOUR_FINNHUB_API_KEY') {
    let demoResult;
    switch (endpoint) {
      case 'profile':
        demoResult = {
          name: `${symbol} Corporation`,
          country: 'US',
          industry: 'Technology',
          weburl: `https://www.${(symbol || 'ticker').toLowerCase()}.com`,
          logo: `https://logo.clearbit.com/${(symbol || 'ticker').toLowerCase()}.com`,
          marketCapitalization: 100000000000,
          shareOutstanding: 1000000000,
          ticker: symbol
        };
        break;
      case 'news':
        demoResult = [
          { category: 'general', datetime: Date.now() - 3600000, headline: `${symbol} Reports Strong Quarterly Results`, id: 1, image: '', related: symbol, source: 'Demo News', summary: `Demo news article for ${symbol}`, url: `https://example.com/${(symbol || 'ticker').toLowerCase()}-news-1` },
          { category: 'general', datetime: Date.now() - 7200000, headline: `${symbol} Announces New Strategic Initiative`, id: 2, image: '', related: symbol, source: 'Demo News', summary: `Demo news article for ${symbol}`, url: `https://example.com/${(symbol || 'ticker').toLowerCase()}-news-2` }
        ];
        break;
      case 'recommendation':
        demoResult = [{ symbol, date: new Date().toISOString().split('T')[0], period: '0m', strongBuy: 5, buy: 8, hold: 3, sell: 1, strongSell: 0 }];
        break;
      default:
        demoResult = demoData[symbol] || { c: 100.0, d: 0.5, dp: 0.5, h: 101.0, l: 99.5, o: 100.5, pc: 99.5, t: Date.now() };
    }
    return res.status(200).json({ ...(Array.isArray(demoResult) ? {} : demoResult), data: Array.isArray(demoResult) ? demoResult : undefined, symbol, endpoint, timestamp: new Date().toISOString(), source: 'demo', message: 'Données de démonstration - Configurez FINNHUB_API_KEY pour des données réelles' });
  }

  try {
    let url;
    switch (endpoint) {
      case 'quote':
        url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`; break;
      case 'profile':
        url = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`; break;
      case 'news': {
        const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const to = new Date().toISOString().split('T')[0];
        url = `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;
        break;
      }
      case 'recommendation':
        url = `https://finnhub.io/api/v1/stock/recommendation?symbol=${symbol}&token=${FINNHUB_API_KEY}`; break;
      case 'peers':
        url = `https://finnhub.io/api/v1/stock/peers?symbol=${symbol}&token=${FINNHUB_API_KEY}`; break;
      case 'earnings':
        url = `https://finnhub.io/api/v1/calendar/earnings?symbol=${symbol}&token=${FINNHUB_API_KEY}`; break;
      case 'insider-transactions':
        url = `https://finnhub.io/api/v1/stock/insider-transactions?symbol=${symbol}&token=${FINNHUB_API_KEY}`; break;
      case 'financials':
        url = `https://finnhub.io/api/v1/stock/financials-reported?symbol=${symbol}&token=${FINNHUB_API_KEY}`; break;
      case 'candles': {
        const toTimestamp = Math.floor(Date.now() / 1000);
        const fromTimestamp = toTimestamp - (30 * 24 * 60 * 60);
        url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${fromTimestamp}&to=${toTimestamp}&token=${FINNHUB_API_KEY}`;
        break;
      }
      case 'search':
        url = `https://finnhub.io/api/v1/search?q=${symbol}&token=${FINNHUB_API_KEY}`; break;
      default:
        return res.status(400).json({ error: 'Endpoint non supporté', supportedEndpoints: ['quote','profile','news','recommendation','peers','earnings','insider-transactions','financials','candles','search'] });
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Finnhub API error: ${response.status}`);
    const data = await response.json();
    return res.status(200).json({ ...data, symbol, endpoint, timestamp: new Date().toISOString(), source: 'finnhub' });
  } catch (error) {
    console.error('Erreur API Finnhub:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération des données Finnhub', details: error.message });
  }
}

async function handleNews(req, res) {
  const params = req.method === 'GET' ? req.query : (req.body || {});
  const { q, limit = 20, language = 'fr' } = params; // language non utilisé mais conservé

  const NEWSAPI_KEY = process.env.NEWSAPI_KEY || 'YOUR_NEWSAPI_KEY';
  const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'YOUR_FINNHUB_API_KEY';
  const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'YOUR_ALPHA_VANTAGE_API_KEY';

  const generateDemoNews = (query) => {
    const requestedTickers = query ? query.split(' OR ').map(t => t.trim().toUpperCase()) : ['CVS', 'MSFT'];
    const base = [
      {
        title: 'Marché Boursier : Signaux Mixtes',
        description: 'Le marché boursier affiche des signaux mixtes...',
        url: 'https://example.com/market-update',
        publishedAt: new Date(Date.now() - 7200000).toISOString(),
        source: { name: 'Market Watch' },
        urlToImage: null,
        content: 'Le marché boursier affiche des signaux mixtes...',
        sectorAnalysis: "Volatilité accrue avec une divergence sectorielle."
      }
    ];
    const tickerNews = requestedTickers.map(t => ({
      title: `${t}: Dernières nouvelles`,
      description: `Résumé des actualités pour ${t}`,
      url: `https://example.com/${t.toLowerCase()}-news-${Date.now()}`,
      publishedAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      source: { name: `${t} Financial News` },
      urlToImage: null,
      content: `Contenu de démonstration pour ${t}`,
      sectorAnalysis: `Analyse sectorielle pour ${t}`
    }));
    return [...tickerNews, ...base];
  };

  const hasApiKey = (NEWSAPI_KEY && NEWSAPI_KEY !== 'YOUR_NEWSAPI_KEY') ||
                    (FINNHUB_API_KEY && FINNHUB_API_KEY !== 'YOUR_FINNHUB_API_KEY') ||
                    (ALPHA_VANTAGE_API_KEY && ALPHA_VANTAGE_API_KEY !== 'YOUR_ALPHA_VANTAGE_API_KEY');

  if (!hasApiKey) {
    const demoNews = generateDemoNews(q);
    return res.status(200).json({ articles: demoNews, totalResults: demoNews.length, query: q || 'finance', timestamp: new Date().toISOString(), source: 'demo', message: 'Données de démonstration - Configurez des clés API pour des actualités réelles' });
  }

  try {
    const requestedTickers = q ? q.split(' OR ').map(t => t.trim().toUpperCase()) : [];
    const defaultTickers = ['CVS','MSFT','AAPL','GOOGL','AMZN','TSLA','NVDA','META'];
    const tickers = requestedTickers.length > 0 ? requestedTickers : defaultTickers;

    const allNews = [];
    const sources = [];

    if (NEWSAPI_KEY && NEWSAPI_KEY !== 'YOUR_NEWSAPI_KEY') {
      try {
        const tickerQueries = tickers.map(ticker => ({ keyword: ticker }));
        const requestBody = {
          apiKey: NEWSAPI_KEY,
          query: { $query: { $and: [ { $or: [ ...tickerQueries, { conceptUri: 'http://en.wikipedia.org/wiki/Finance' }, { conceptUri: 'http://en.wikipedia.org/wiki/Stock_market' }, { conceptUri: 'http://en.wikipedia.org/wiki/Investment' }, { conceptUri: 'http://en.wikipedia.org/wiki/Economics' } ] }, { lang: ['eng','fra'] } ] } },
          resultType: 'articles',
          articlesSortBy: 'date',
          articlesCount: limit * 3,
          includeArticleImage: true,
          includeArticleLinks: true
        };
        const response = await fetch('https://newsapi.ai/api/v1/article/getArticles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
        if (!response.ok) throw new Error(`NewsAPI.ai error: ${response.status}`);
        const data = await response.json();
        const articles = data.articles?.results?.map(article => ({
          title: article.title,
          description: (article.body?.substring(0,200) || article.title) + '...',
          url: article.url,
          publishedAt: article.datePublished,
          source: { name: article.source?.title || 'Source inconnue' },
          urlToImage: article.image,
          content: article.body
        })) || [];
        allNews.push(...articles);
        sources.push('NewsAPI.ai');
      } catch (e) {
        console.error('Erreur NewsAPI.ai:', e);
      }
    }

    if (FINNHUB_API_KEY && FINNHUB_API_KEY !== 'YOUR_FINNHUB_API_KEY') {
      try {
        const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const to = new Date().toISOString().split('T')[0];
        for (const ticker of tickers.slice(0, 3)) {
          const url = `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            const tickerNews = data.slice(0, 3).map(article => ({
              title: article.headline,
              description: article.summary || article.headline,
              url: article.url,
              publishedAt: new Date(article.datetime * 1000).toISOString(),
              source: { name: 'Finnhub' },
              urlToImage: article.image,
              content: article.summary,
              ticker
            }));
            allNews.push(...tickerNews);
          }
        }
        sources.push('Finnhub');
      } catch (e) { console.error('Erreur Finnhub News:', e); }
    }

    if (ALPHA_VANTAGE_API_KEY && ALPHA_VANTAGE_API_KEY !== 'YOUR_ALPHA_VANTAGE_API_KEY') {
      try {
        for (const ticker of tickers.slice(0, 2)) {
          const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${ticker}&apikey=${ALPHA_VANTAGE_API_KEY}&limit=5`;
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            if (data.feed) {
              const tickerNews = data.feed.map(article => ({
                title: article.title,
                description: article.summary,
                url: article.url,
                publishedAt: article.time_published,
                source: { name: article.source },
                urlToImage: article.banner_image,
                content: article.summary,
                ticker,
                sentiment: article.overall_sentiment_label
              }));
              allNews.push(...tickerNews);
            }
          }
        }
        sources.push('Alpha Vantage');
      } catch (e) { console.error('Erreur Alpha Vantage News:', e); }
    }

    if (allNews.length === 0) {
      const demoNews = generateDemoNews(q);
      return res.status(200).json({ articles: demoNews, totalResults: demoNews.length, query: q || 'finance', timestamp: new Date().toISOString(), source: 'demo', message: 'Aucune source API disponible - Données de démonstration' });
    }

    const uniqueNews = [];
    const seenUrls = new Set();
    for (const article of allNews) {
      if (article.url && !seenUrls.has(article.url)) { seenUrls.add(article.url); uniqueNews.push(article); }
    }

    uniqueNews.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    const finalArticles = uniqueNews.slice(0, limit);

    return res.status(200).json({
      articles: finalArticles,
      totalResults: finalArticles.length,
      query: q || 'finance',
      timestamp: new Date().toISOString(),
      source: sources.join(', '),
      sources
    });
  } catch (error) {
    console.error('Erreur générale API News:', error);
    const demoNews = generateDemoNews(q);
    return res.status(200).json({ articles: demoNews, totalResults: demoNews.length, query: q || 'finance', timestamp: new Date().toISOString(), source: 'demo (fallback)', message: 'Erreur API - Données de démonstration utilisées' });
  }
}

async function handleGeminiChat(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée', allowed: ['POST','OPTIONS'] });
  }
  const { message, prompt } = req.body || {};
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    return res.status(500).json({ error: 'Clé API Gemini non configurée', message: "Configurez GEMINI_API_KEY" });
  }
  if (!message) {
    return res.status(400).json({ error: 'Message requis' });
  }
  const finalPrompt = prompt ? `${prompt}\n\n${message}` : message;
  const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: finalPrompt }] }] })
  });
  if (!geminiResponse.ok) {
    const errorData = await geminiResponse.json().catch(() => ({}));
    return res.status(geminiResponse.status).json({ error: 'Erreur API Gemini', message: errorData.error?.message || `HTTP ${geminiResponse.status}`, details: errorData });
  }
  const geminiData = await geminiResponse.json();
  const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Aucune réponse générée';
  return res.status(200).json({ success: true, response: responseText, timestamp: new Date().toISOString(), model: 'gemini-pro' });
}

async function handleGeminiKey(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée', allowed: ['GET','OPTIONS'] });
  }
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const debugInfo = {
    hasApiKey: !!geminiApiKey,
    apiKeyLength: geminiApiKey ? geminiApiKey.length : 0,
    availableEnvVars: Object.keys(process.env).filter(key => key.includes('GEMINI') || key.includes('API')),
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV
  };
  if (!geminiApiKey) {
    return res.status(500).json({ error: 'Clé API Gemini non configurée', message: "Configurez GEMINI_API_KEY", debug: debugInfo });
  }
  return res.status(200).json({ apiKey: geminiApiKey, source: 'vercel-env', timestamp: new Date().toISOString(), status: 'success', debug: { hasApiKey: true, apiKeyLength: geminiApiKey.length, timestamp: new Date().toISOString() } });
}

async function handleGithubTickers(req, res) {
  const githubToken = process.env.GITHUB_TOKEN;
  const repoOwner = 'projetsjsls';
  const repoName = 'GOB';
  const filePath = 'tickers.json';

  if (!githubToken) {
    return res.status(500).json({ error: 'Token GitHub non configuré', message: "Configurez GITHUB_TOKEN dans Vercel" });
  }

  if (req.method === 'GET') {
    try {
      const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`, { headers: { 'Authorization': `token ${githubToken}`, 'Accept': 'application/vnd.github.v3+json' } });
      if (response.ok) {
        const data = await response.json();
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        const tickersData = JSON.parse(content);
        return res.status(200).json({ status: 'success', tickers: tickersData.tickers || [], message: 'Tickers chargés depuis GitHub', timestamp: new Date().toISOString() });
      } else if (response.status === 404) {
        return res.status(200).json({ status: 'success', tickers: ['GOOGL','T','BNS','TD','BCE','CNR','CSCO','CVS','DEO','MDT','JNJ','JPM','LVMHF','MG','MFC','MU','NSRGY','NKE','NTR','PFE','TRP','UNH','UL','VZ','WFC'], message: 'tickers.json non trouvé, liste par défaut', timestamp: new Date().toISOString() });
      } else {
        const errorData = await response.json();
        return res.status(500).json({ error: 'Erreur lors du chargement des tickers', message: errorData.message || 'Erreur inconnue', status: response.status });
      }
    } catch (error) {
      return res.status(500).json({ error: 'Erreur lors du chargement des tickers', message: error.message });
    }
  }

  if (req.method === 'POST') {
    const { tickers } = req.body || {};
    if (!tickers || !Array.isArray(tickers)) {
      return res.status(400).json({ error: 'Données invalides', message: 'Le champ tickers doit être un tableau' });
    }
    try {
      // get SHA if exists
      let sha = null;
      try {
        const getResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`, { headers: { 'Authorization': `token ${githubToken}`, 'Accept': 'application/vnd.github.v3+json' } });
        if (getResponse.ok) { const data = await getResponse.json(); sha = data.sha; }
      } catch (_) {}
      const tickersData = { tickers };
      const content = JSON.stringify(tickersData, null, 2);
      const encodedContent = Buffer.from(content).toString('base64');
      const updateResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
        method: 'PUT', headers: { 'Authorization': `token ${githubToken}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Mise à jour des tickers - ${new Date().toISOString()}`, content: encodedContent, sha })
      });
      if (updateResponse.ok) {
        const result = await updateResponse.json();
        return res.status(200).json({ status: 'success', message: 'Tickers sauvegardés sur GitHub avec succès', tickers, commit: result.commit.sha, timestamp: new Date().toISOString() });
      } else {
        const errorData = await updateResponse.json();
        return res.status(500).json({ error: 'Erreur lors de la sauvegarde des tickers', message: errorData.message || 'Erreur inconnue', status: updateResponse.status });
      }
    } catch (error) {
      return res.status(500).json({ error: 'Erreur lors de la sauvegarde des tickers', message: error.message });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée', allowed: ['GET','POST'] });
}

async function handleGithubWatchlist(req, res) {
  const githubToken = process.env.GITHUB_TOKEN;
  const repoOwner = 'projetsjsls';
  const repoName = 'GOB';
  const filePath = 'watchlist.json';

  if (!githubToken) {
    return res.status(500).json({ error: 'Token GitHub non configuré', message: "Configurez GITHUB_TOKEN dans Vercel" });
  }

  if (req.method === 'GET') {
    try {
      const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`, { headers: { 'Authorization': `token ${githubToken}`, 'Accept': 'application/vnd.github.v3+json' } });
      if (response.ok) {
        const data = await response.json();
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        const watchlistData = JSON.parse(content);
        return res.status(200).json({ status: 'success', tickers: watchlistData.tickers || [], message: 'Watchlist chargée depuis GitHub', timestamp: new Date().toISOString() });
      } else if (response.status === 404) {
        return res.status(200).json({ status: 'success', tickers: [], message: 'watchlist.json non trouvé, watchlist vide', timestamp: new Date().toISOString() });
      } else {
        const errorData = await response.json();
        return res.status(500).json({ error: 'Erreur lors du chargement de la watchlist', message: errorData.message || 'Erreur inconnue', status: response.status });
      }
    } catch (error) {
      return res.status(500).json({ error: 'Erreur lors du chargement de la watchlist', message: error.message });
    }
  }

  if (req.method === 'POST') {
    const { tickers } = req.body || {};
    if (!tickers || !Array.isArray(tickers)) {
      return res.status(400).json({ error: 'Données invalides', message: 'Le champ tickers doit être un tableau' });
    }
    try {
      // get SHA if exists
      let sha = null;
      try {
        const getResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`, { headers: { 'Authorization': `token ${githubToken}`, 'Accept': 'application/vnd.github.v3+json' } });
        if (getResponse.ok) { const data = await getResponse.json(); sha = data.sha; }
      } catch (_) {}

      const watchlistData = { tickers, lastUpdated: new Date().toISOString(), user: 'Dan' };
      const content = JSON.stringify(watchlistData, null, 2);
      const encodedContent = Buffer.from(content).toString('base64');

      const updateResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
        method: 'PUT', headers: { 'Authorization': `token ${githubToken}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Mise à jour de la watchlist Dan - ${new Date().toISOString()}`, content: encodedContent, sha })
      });

      if (updateResponse.ok) {
        const result = await updateResponse.json();
        return res.status(200).json({ status: 'success', message: 'Watchlist sauvegardée sur GitHub avec succès', tickers, commit: result.commit.sha, timestamp: new Date().toISOString() });
      } else {
        const errorData = await updateResponse.json();
        return res.status(500).json({ error: 'Erreur lors de la sauvegarde de la watchlist', message: errorData.message || 'Erreur inconnue', status: updateResponse.status });
      }
    } catch (error) {
      return res.status(500).json({ error: 'Erreur lors de la sauvegarde de la watchlist', message: error.message });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée', allowed: ['GET','POST'] });
}

async function handleGithubToken(req, res) {
  if (req.method === 'GET') {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      return res.status(200).json({ status: 'not_configured', message: 'Token GitHub non configuré', hasToken: false });
    }
    try {
      const response = await fetch('https://api.github.com/user', { headers: { 'Authorization': `token ${githubToken}`, 'Accept': 'application/vnd.github.v3+json' } });
      if (response.ok) {
        const userData = await response.json();
        return res.status(200).json({ status: 'valid', message: 'Token GitHub valide', hasToken: true, user: { login: userData.login, name: userData.name, avatar_url: userData.avatar_url } });
      } else {
        return res.status(200).json({ status: 'invalid', message: 'Token GitHub invalide', hasToken: true, error: `HTTP ${response.status}` });
      }
    } catch (error) {
      return res.status(200).json({ status: 'error', message: 'Erreur de connexion GitHub', hasToken: true, error: error.message });
    }
  }

  if (req.method === 'POST') {
    const { actionInner, action: actionBody, file, data } = req.body || {};
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      return res.status(500).json({ error: 'Token GitHub non configuré', message: "Configurez GITHUB_TOKEN" });
    }
    // supporte soit actionInner, soit action lorsque ce n'est pas la clé top-level 'github_token'
    const subAction = actionInner || (actionBody && actionBody !== 'github_token' ? actionBody : undefined);
    switch (subAction) {
      case 'update_file':
        return updateGitHubFile(githubToken, file, data, res);
      case 'get_file':
        return getGitHubFile(githubToken, file, res);
      case 'test_connection':
        return testGitHubConnection(githubToken, res);
      default:
        return res.status(400).json({ error: 'Action non supportée', supportedActions: ['update_file','get_file','test_connection'] });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
}

async function updateGitHubFile(token, filePath, data, res) {
  try {
    const getResponse = await fetch(`https://api.github.com/repos/projetsjsl/GOB/contents/${filePath}`, { headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' } });
    let sha = null;
    if (getResponse.ok) { const fileData = await getResponse.json(); sha = fileData.sha; }
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
    const message = `Update ${filePath} - ${new Date().toISOString()}`;
    const updateResponse = await fetch(`https://api.github.com/repos/projetsjsl/GOB/contents/${filePath}`, { method: 'PUT', headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' }, body: JSON.stringify({ message, content, sha }) });
    if (updateResponse.ok) {
      const result = await updateResponse.json();
      return res.status(200).json({ status: 'success', message: 'Fichier mis à jour avec succès', commit: result.commit });
    } else {
      const error = await updateResponse.json();
      return res.status(updateResponse.status).json({ status: 'error', message: 'Erreur lors de la mise à jour', error: error.message });
    }
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Erreur serveur', error: error.message });
  }
}

async function getGitHubFile(token, filePath, res) {
  try {
    const response = await fetch(`https://api.github.com/repos/projetsjsl/GOB/contents/${filePath}`, { headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' } });
    if (response.ok) {
      const fileData = await response.json();
      const content = JSON.parse(Buffer.from(fileData.content, 'base64').toString());
      return res.status(200).json({ status: 'success', data: content, sha: fileData.sha });
    } else {
      return res.status(response.status).json({ status: 'error', message: 'Fichier non trouvé', error: `HTTP ${response.status}` });
    }
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Erreur serveur', error: error.message });
  }
}

async function testGitHubConnection(token, res) {
  try {
    const response = await fetch('https://api.github.com/user', { headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' } });
    if (response.ok) {
      const userData = await response.json();
      return res.status(200).json({ status: 'success', message: 'Connexion GitHub réussie', user: { login: userData.login, name: userData.name, avatar_url: userData.avatar_url } });
    } else {
      return res.status(response.status).json({ status: 'error', message: 'Connexion GitHub échouée', error: `HTTP ${response.status}` });
    }
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Erreur de connexion', error: error.message });
  }
}

async function handleSaveTickers(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
  try {
    const { tickers } = req.body || {};
    if (!Array.isArray(tickers)) {
      return res.status(400).json({ error: 'Les tickers doivent être un tableau' });
    }
    const validTickers = tickers.filter(t => typeof t === 'string' && /^[A-Z]{1,5}$/.test(t.toUpperCase())).map(t => t.toUpperCase());
    const tickerData = { tickers: validTickers, lastUpdated: new Date().toISOString(), count: validTickers.length };
    console.log('Tickers sauvegardés:', tickerData);
    return res.status(200).json({ success: true, message: 'Tickers sauvegardés avec succès', data: tickerData });
  } catch (error) {
    console.error('Erreur sauvegarde tickers:', error);
    return res.status(500).json({ error: 'Erreur lors de la sauvegarde des tickers', details: error.message });
  }
}

async function handleFallback(req, res) {
  const params = req.method === 'GET' ? req.query : (req.body || {});
  const { type, symbol, limit = 10 } = params;
  const fallbackData = {
    stocks: {
      CVS: { symbol: 'CVS', name: 'CVS Health Corporation', price: 78.45, change: 1.23, changePercent: 1.59, volume: 4500000, marketCap: 100000000000, pe: 12.5, sector: 'Healthcare Services', industry: 'Healthcare', description: 'CVS Health Corporation operates as a health services company in the United States.', website: 'https://www.cvshealth.com', logo: 'https://logo.clearbit.com/cvshealth.com', lastUpdate: new Date().toISOString() },
      MSFT: { symbol: 'MSFT', name: 'Microsoft Corporation', price: 378.85, change: -2.15, changePercent: -0.56, volume: 25000000, marketCap: 2800000000000, pe: 28.5, sector: 'Technology', industry: 'Software', description: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.', website: 'https://www.microsoft.com', logo: 'https://logo.clearbit.com/microsoft.com', lastUpdate: new Date().toISOString() },
      AAPL: { symbol: 'AAPL', name: 'Apple Inc.', price: 175.43, change: 0.87, changePercent: 0.50, volume: 45000000, marketCap: 2700000000000, pe: 25.8, sector: 'Technology', industry: 'Consumer Electronics', description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.', website: 'https://www.apple.com', logo: 'https://logo.clearbit.com/apple.com', lastUpdate: new Date().toISOString() },
      GOOGL: { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.50, change: 2.30, changePercent: 1.64, volume: 18000000, marketCap: 1800000000000, pe: 22.1, sector: 'Technology', industry: 'Internet', description: 'Alphabet Inc. provides online advertising services...', website: 'https://www.google.com', logo: 'https://logo.clearbit.com/google.com', lastUpdate: new Date().toISOString() },
      AMZN: { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 155.20, change: -1.80, changePercent: -1.15, volume: 32000000, marketCap: 1600000000000, pe: 45.2, sector: 'Consumer Discretionary', industry: 'E-commerce', description: 'Amazon.com Inc. engages in the retail sale of consumer products and subscriptions in North America and internationally.', website: 'https://www.amazon.com', logo: 'https://logo.clearbit.com/amazon.com', lastUpdate: new Date().toISOString() }
    },
    news: [
      { title: 'Marché Boursier : Tendances Actuelles', description: 'Le marché boursier affiche des signaux mixtes...', url: 'https://example.com/market-trends', publishedAt: new Date(Date.now() - 3600000).toISOString(), source: { name: 'Financial Times' }, urlToImage: null, content: 'Analyse complète...', sentiment: 'positive' },
      { title: 'Innovation Technologique : Nouvelles Opportunités', description: "Les entreprises technologiques continuent d'innover...", url: 'https://example.com/tech-innovation', publishedAt: new Date(Date.now() - 7200000).toISOString(), source: { name: 'TechCrunch' }, urlToImage: null, content: 'Les dernières innovations...', sentiment: 'positive' },
      { title: 'Secteur de la Santé : Défis et Opportunités', description: 'Le secteur de la santé fait face à de nouveaux défis...', url: 'https://example.com/healthcare-sector', publishedAt: new Date(Date.now() - 10800000).toISOString(), source: { name: 'Healthcare Weekly' }, urlToImage: null, content: 'Analyse approfondie...', sentiment: 'neutral' }
    ],
    market: {
      indices: [ { name: 'S&P 500', value: 4567.89, change: 12.34, changePercent: 0.27 }, { name: 'NASDAQ', value: 14234.56, change: -45.67, changePercent: -0.32 }, { name: 'DOW JONES', value: 34567.89, change: 89.12, changePercent: 0.26 } ],
      sectors: [ { name: 'Technology', performance: 2.5, trend: 'up' }, { name: 'Healthcare', performance: -0.8, trend: 'down' }, { name: 'Financials', performance: 1.2, trend: 'up' }, { name: 'Energy', performance: 3.1, trend: 'up' } ],
      lastUpdate: new Date().toISOString()
    }
  };

  try {
    let result;
    switch (type) {
      case 'stock':
        if (symbol && fallbackData.stocks[symbol]) { result = fallbackData.stocks[symbol]; }
        else { result = Object.values(fallbackData.stocks).slice(0, limit); }
        break;
      case 'news':
        result = fallbackData.news.slice(0, limit); break;
      case 'market':
        result = fallbackData.market; break;
      case 'search':
        if (symbol) {
          const searchResults = Object.values(fallbackData.stocks).filter(stock => stock.symbol.toLowerCase().includes(symbol.toLowerCase()) || stock.name.toLowerCase().includes(symbol.toLowerCase()));
          result = searchResults.slice(0, limit);
        } else { result = []; }
        break;
      default:
        return res.status(400).json({ error: 'Type non supporté', supportedTypes: ['stock','news','market','search'], usage: 'Utilisez type=stock&symbol=AAPL ou type=news&limit=5' });
    }
    return res.status(200).json({ data: result, type, symbol: symbol || 'all', timestamp: new Date().toISOString(), source: 'fallback', message: 'Données de fallback - APIs principales non disponibles' });
  } catch (error) {
    console.error('Erreur API Fallback:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération des données de fallback', details: error.message });
  }
}

async function handleClaude(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
  try {
    const { prompt, ticker } = req.body || {};
    if (!prompt) { return res.status(400).json({ error: 'Prompt is required' }); }
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ 
        error: 'Claude API key not configured',
        analysis: JSON.stringify({
          ticker: ticker,
          companyName: `${ticker} Corporation`,
          lastUpdate: new Date().toISOString()
        })
      });
    }

    const { Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({ model: 'claude-3-5-sonnet-20241022', max_tokens: 4000, messages: [{ role: 'user', content: prompt }] });
    const analysis = response.content[0].text;
    return res.status(200).json({ success: true, analysis, ticker });
  } catch (error) {
    console.error('Erreur Claude API:', error);
    return res.status(500).json({ error: "Erreur lors de l'analyse Claude", details: error.message });
  }
}

async function handleGithubUpdate(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
  try {
    const { file, ticker, data, action } = req.body || {};
    if (!file || !ticker || !data) { return res.status(400).json({ error: 'Missing required parameters' }); }
    if (!process.env.GITHUB_TOKEN) { return res.status(500).json({ error: 'GitHub token not configured', message: 'Les fichiers ne peuvent pas être mis à jour sans token GitHub' }); }

    const { Octokit } = await import('@octokit/rest');
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const REPO_OWNER = 'projetsjsl';
    const REPO_NAME = 'GOB';
    const BRANCH = 'main';

    let currentContent = '';
    let currentSha = null;
    try {
      const { data: fileData } = await octokit.repos.getContent({ owner: REPO_OWNER, repo: REPO_NAME, path: file, ref: BRANCH });
      currentContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
      currentSha = fileData.sha;
    } catch (error) {
      if (error.status !== 404) throw error;
    }

    let jsonData = {};
    if (currentContent) {
      try { jsonData = JSON.parse(currentContent); } catch (_) { jsonData = {}; }
    }

    if (action === 'update_stock') {
      if (!jsonData.stocks) jsonData.stocks = {};
      jsonData.stocks[ticker] = data;
      jsonData.lastUpdate = new Date().toISOString();
    } else if (action === 'update_analysis') {
      if (!jsonData.stocks) jsonData.stocks = [];
      const existingIndex = jsonData.stocks.findIndex(stock => stock.ticker === ticker);
      if (existingIndex >= 0) { jsonData.stocks[existingIndex] = { ...jsonData.stocks[existingIndex], ...data }; }
      else { jsonData.stocks.push(data); }
      jsonData.last_update = new Date().toISOString();
      jsonData.total_stocks = jsonData.stocks.length;
      jsonData.successful = jsonData.stocks.length;
      jsonData.failed = 0;
    }

    const updatedContent = JSON.stringify(jsonData, null, 2);
    const updateResponse = await octokit.repos.createOrUpdateFileContents({ owner: REPO_OWNER, repo: REPO_NAME, path: file, message: `Update ${ticker} data - ${action} - ${new Date().toISOString()}`, content: Buffer.from(updatedContent).toString('base64'), sha: currentSha, branch: BRANCH });

    return res.status(200).json({ success: true, message: `Fichier ${file} mis à jour avec succès pour ${ticker}`, commit: updateResponse.data.commit.sha, action });
  } catch (error) {
    console.error('Erreur GitHub API:', error);
    return res.status(500).json({ error: 'Erreur lors de la mise à jour GitHub', details: error.message });
  }
}
