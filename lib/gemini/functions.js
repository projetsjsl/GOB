// ========================================
// GEMINI FUNCTION CALLING - Déclarations & Exécution
// ========================================

export const functionDeclarations = [
  {
    name: 'getStockPrice',
    description: 'Obtenir le prix actuel et métriques d'un titre boursier (source: marketdata unifiée).',
    parameters: {
      type: 'OBJECT',
      properties: {
        symbol: { type: 'STRING', description: 'Symbole boursier, ex: AAPL, MSFT, GOOGL' }
      },
      required: ['symbol']
    }
  },
  {
    name: 'getNews',
    description: 'Récupérer des actualités récentes liées à un titre ou un thème.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: 'Mot-clé ou symbole, ex: AAPL, GOOGL, "banques canadiennes"' },
        limit: { type: 'NUMBER', description: 'Nombre maximum d'articles (défaut 5)' }
      },
      required: ['query']
    }
  },
  {
    name: 'compareTickers',
    description: 'Comparer rapidement plusieurs tickers sur prix et variation.',
    parameters: {
      type: 'OBJECT',
      properties: {
        symbols: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Liste de symboles, ex: ["AAPL", "MSFT"]' }
      },
      required: ['symbols']
    }
  },
  {
    name: 'getFundamentals',
    description: 'Récupérer des fondamentaux (P/E, EV/EBITDA, ROE, marges, dividende, etc.).',
    parameters: {
      type: 'OBJECT',
      properties: {
        symbol: { type: 'STRING', description: 'Symbole boursier, ex: AAPL, MSFT, GOOGL' }
      },
      required: ['symbol']
    }
  },
  {
    name: 'getCompanyProfile',
    description: 'Obtenir le profil complet d\'une entreprise (nom, secteur, industrie, CEO, employés, description, site web, etc.) via FMP.',
    parameters: {
      type: 'OBJECT',
      properties: {
        symbol: { type: 'STRING', description: 'Symbole boursier, ex: AAPL, MSFT, GOOGL' }
      },
      required: ['symbol']
    }
  },
  {
    name: 'getFinancialStatements',
    description: 'Obtenir les états financiers complets (Income Statement, Balance Sheet, Cash Flow) via FMP.',
    parameters: {
      type: 'OBJECT',
      properties: {
        symbol: { type: 'STRING', description: 'Symbole boursier, ex: AAPL, MSFT, GOOGL' },
        period: { type: 'STRING', description: 'Période: "quarter" ou "annual" (défaut: quarter)' },
        limit: { type: 'NUMBER', description: 'Nombre de périodes à récupérer (défaut: 4)' }
      },
      required: ['symbol']
    }
  },
  {
    name: 'getFinancialRatios',
    description: 'Obtenir les ratios financiers TTM (P/E, P/B, ROE, ROA, Debt/Equity, Current Ratio, etc.) via FMP.',
    parameters: {
      type: 'OBJECT',
      properties: {
        symbol: { type: 'STRING', description: 'Symbole boursier, ex: AAPL, MSFT, GOOGL' }
      },
      required: ['symbol']
    }
  },
  {
    name: 'getDCFValuation',
    description: 'Obtenir la valorisation DCF (Discounted Cash Flow) et déterminer si le titre est sur/sous-évalué via FMP.',
    parameters: {
      type: 'OBJECT',
      properties: {
        symbol: { type: 'STRING', description: 'Symbole boursier, ex: AAPL, MSFT, GOOGL' }
      },
      required: ['symbol']
    }
  },
  {
    name: 'getAnalystRatings',
    description: 'Obtenir les recommandations d\'analystes, price targets, upgrades/downgrades via FMP.',
    parameters: {
      type: 'OBJECT',
      properties: {
        symbol: { type: 'STRING', description: 'Symbole boursier, ex: AAPL, MSFT, GOOGL' }
      },
      required: ['symbol']
    }
  },
  {
    name: 'getEarningsData',
    description: 'Obtenir les données de résultats trimestriels (Earnings Surprises, Historical Earnings) via FMP.',
    parameters: {
      type: 'OBJECT',
      properties: {
        symbol: { type: 'STRING', description: 'Symbole boursier, ex: AAPL, MSFT, GOOGL' }
      },
      required: ['symbol']
    }
  },
  {
    name: 'getInsiderTrading',
    description: 'Obtenir les transactions d\'initiés (Insider Trading) pour détecter les signaux de confiance/méfiance via FMP.',
    parameters: {
      type: 'OBJECT',
      properties: {
        symbol: { type: 'STRING', description: 'Symbole boursier, ex: AAPL, MSFT, GOOGL' },
        limit: { type: 'NUMBER', description: 'Nombre de transactions à récupérer (défaut: 20)' }
      },
      required: ['symbol']
    }
  },
  {
    name: 'getCompleteAnalysis',
    description: 'Obtenir une analyse complète combinant profil, quote, ratios, DCF, rating, price targets, news, earnings et insider trading via FMP.',
    parameters: {
      type: 'OBJECT',
      properties: {
        symbol: { type: 'STRING', description: 'Symbole boursier, ex: AAPL, MSFT, GOOGL' }
      },
      required: ['symbol']
    }
  },
  {
    name: 'getMarketauxNews',
    description: 'Obtenir des actualités financières en temps réel avec analyse de sentiment via Marketaux.',
    parameters: {
      type: 'OBJECT',
      properties: {
        symbol: { type: 'STRING', description: 'Symbole boursier, ex: AAPL, MSFT, GOOGL' },
        limit: { type: 'NUMBER', description: 'Nombre d\'articles à récupérer (défaut: 50)' },
        timeframe: { type: 'NUMBER', description: 'Nombre de jours à couvrir (défaut: 7)' }
      },
      required: ['symbol']
    }
  },
  {
    name: 'getMarketSentiment',
    description: 'Obtenir l\'analyse de sentiment du marché pour un ticker via Marketaux.',
    parameters: {
      type: 'OBJECT',
      properties: {
        symbol: { type: 'STRING', description: 'Symbole boursier, ex: AAPL, MSFT, GOOGL' },
        limit: { type: 'NUMBER', description: 'Nombre d\'articles à analyser (défaut: 100)' }
      },
      required: ['symbol']
    }
  },
  {
    name: 'getTrendingNews',
    description: 'Obtenir les actualités financières tendances du moment via Marketaux.',
    parameters: {
      type: 'OBJECT',
      properties: {
        limit: { type: 'NUMBER', description: 'Nombre d\'articles à récupérer (défaut: 20)' }
      }
    }
  },
  {
    name: 'getMarketOverview',
    description: 'Obtenir un aperçu général du marché avec actualités par secteur via Marketaux.',
    parameters: {
      type: 'OBJECT',
      properties: {
        industries: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Liste des industries à couvrir' },
        limit: { type: 'NUMBER', description: 'Nombre d\'articles par secteur (défaut: 30)' }
      }
    }
  }
];

const getBaseUrl = () => {
  return process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
};

// ========================================
// UTILITAIRES DE RETRY
// ========================================
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;
const REQUEST_TIMEOUT_MS = 10000;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch avec timeout
async function fetchWithTimeout(url, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error(`Timeout: ${url}`);
    }
    throw error;
  }
}

// Fetch avec retry automatique
async function fetchWithRetry(url, retries = MAX_RETRIES) {
  let lastError = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Fetching ${url} - Attempt ${attempt}/${retries}`);
      const response = await fetchWithTimeout(url);
      
      if (response.ok) {
        return response;
      }
      
      // Si c'est une erreur 4xx (client), pas de retry
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Erreur ${response.status}: ${url}`);
      }
      
      lastError = new Error(`HTTP ${response.status}`);
      
    } catch (error) {
      lastError = error;
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
    }
    
    if (attempt < retries) {
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      console.log(`⏳ Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
  
  throw new Error(`Failed after ${retries} attempts: ${lastError?.message || 'Unknown error'}`);
}

export async function executeFunction(name, args = {}) {
  switch (name) {
    case 'getStockPrice': {
      const symbol = String(args.symbol || '').trim().toUpperCase();
      if (!symbol) throw new Error('Paramètre symbol requis');
      const url = `${getBaseUrl()}/api/marketdata?endpoint=quote&symbol=${encodeURIComponent(symbol)}&source=auto`;
      const r = await fetchWithRetry(url);
      const d = await r.json();
      return {
        symbol,
        price: d.c ?? null,
        change: d.d ?? null,
        changePercent: d.dp ?? null,
        high: d.h ?? null,
        low: d.l ?? null,
        open: d.o ?? null,
        previousClose: d.pc ?? null,
        sources: [
          {
            name: 'Yahoo Finance',
            url: `https://finance.yahoo.com/quote/${symbol}`,
            description: 'Données de prix et métriques de marché'
          },
          {
            name: 'Market Data API',
            url: `${getBaseUrl()}/api/marketdata?endpoint=quote&symbol=${symbol}`,
            description: 'API unifiée de données de marché'
          }
        ]
      };
    }
    case 'getNews': {
      const query = String(args.query || '').trim();
      const limit = Number(args.limit || 5);
      if (!query) throw new Error('Paramètre query requis');
      const url = `${getBaseUrl()}/api/news?q=${encodeURIComponent(query)}&limit=${limit}&strict=true`;
      const r = await fetchWithRetry(url);
      const d = await r.json();
      return { 
        query, 
        items: d?.articles || d?.items || d || [],
        sources: [
          {
            name: 'NewsAPI.ai',
            url: 'https://newsapi.ai/',
            description: 'Actualités financières récentes'
          },
          {
            name: 'Alpha Vantage News',
            url: 'https://www.alphavantage.co/documentation/#news-sentiment',
            description: 'API d\'actualités financières'
          },
          {
            name: 'Finnhub News',
            url: 'https://finnhub.io/docs/api/company-news',
            description: 'Actualités d\'entreprise'
          }
        ]
      };
    }
    case 'compareTickers': {
      const symbols = Array.isArray(args.symbols) ? args.symbols : [];
      if (!symbols.length) throw new Error('Paramètre symbols requis (array)');
      const results = [];
      for (const s of symbols) {
        try {
          const one = await executeFunction('getStockPrice', { symbol: s });
          results.push(one);
        } catch (e) {
          results.push({ symbol: s, error: String(e?.message || e) });
        }
      }
      return { 
        results,
        sources: [
          {
            name: 'Yahoo Finance',
            url: 'https://finance.yahoo.com/',
            description: 'Comparaison de prix et métriques'
          },
          {
            name: 'Market Data API',
            url: `${getBaseUrl()}/api/marketdata`,
            description: 'API unifiée pour comparaisons'
          }
        ]
      };
    }
    case 'getFundamentals': {
      const symbol = String(args.symbol || '').trim().toUpperCase();
      if (!symbol) throw new Error('Paramètre symbol requis');
      const url = `${getBaseUrl()}/api/marketdata?endpoint=fundamentals&symbol=${encodeURIComponent(symbol)}&source=auto`;
      const r = await fetchWithRetry(url);
      const d = await r.json();
      return {
        ...d,
        sources: [
          {
            name: 'Alpha Vantage',
            url: 'https://www.alphavantage.co/documentation/#fundamentals',
            description: 'Données fondamentales d\'entreprise'
          },
          {
            name: 'Finnhub',
            url: 'https://finnhub.io/docs/api/company-profile2',
            description: 'Profils et fondamentaux d\'entreprise'
          },
          {
            name: 'Market Data API',
            url: `${getBaseUrl()}/api/marketdata?endpoint=fundamentals&symbol=${symbol}`,
            description: 'API unifiée de fondamentaux'
          }
        ]
      };
    }
    case 'getCompanyProfile': {
      const symbol = String(args.symbol || '').trim().toUpperCase();
      if (!symbol) throw new Error('Paramètre symbol requis');
      const url = `${getBaseUrl()}/api/fmp?endpoint=profile&symbol=${encodeURIComponent(symbol)}`;
      const r = await fetchWithRetry(url);
      const d = await r.json();
      return {
        ...d,
        sources: [
          {
            name: 'Financial Modeling Prep',
            url: `https://financialmodelingprep.com/financial-summary/${symbol}`,
            description: 'Profil complet de l\'entreprise'
          }
        ]
      };
    }
    case 'getFinancialStatements': {
      const symbol = String(args.symbol || '').trim().toUpperCase();
      const period = String(args.period || 'quarter');
      const limit = Number(args.limit || 4);
      if (!symbol) throw new Error('Paramètre symbol requis');
      const url = `${getBaseUrl()}/api/fmp?endpoint=financials&symbol=${encodeURIComponent(symbol)}&period=${period}&limit=${limit}`;
      const r = await fetchWithRetry(url);
      const d = await r.json();
      return {
        ...d,
        sources: [
          {
            name: 'Financial Modeling Prep - Financial Statements',
            url: `https://financialmodelingprep.com/financial-summary/${symbol}`,
            description: 'États financiers complets (Income, Balance, Cash Flow)'
          },
          {
            name: 'SEC EDGAR',
            url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${symbol}&type=10-Q&dateb=&owner=exclude&count=40`,
            description: 'Dépôts SEC officiels (10-K, 10-Q)'
          }
        ]
      };
    }
    case 'getFinancialRatios': {
      const symbol = String(args.symbol || '').trim().toUpperCase();
      if (!symbol) throw new Error('Paramètre symbol requis');
      const url = `${getBaseUrl()}/api/fmp?endpoint=ratios&symbol=${encodeURIComponent(symbol)}`;
      const r = await fetchWithRetry(url);
      const d = await r.json();
      return {
        ...d,
        sources: [
          {
            name: 'Financial Modeling Prep - Financial Ratios',
            url: `https://financialmodelingprep.com/financial-summary/${symbol}`,
            description: 'Ratios financiers TTM (P/E, P/B, ROE, ROA, Debt/Equity, etc.)'
          }
        ]
      };
    }
    case 'getDCFValuation': {
      const symbol = String(args.symbol || '').trim().toUpperCase();
      if (!symbol) throw new Error('Paramètre symbol requis');
      const url = `${getBaseUrl()}/api/fmp?endpoint=dcf&symbol=${encodeURIComponent(symbol)}`;
      const r = await fetchWithRetry(url);
      const d = await r.json();
      return {
        ...d,
        sources: [
          {
            name: 'Financial Modeling Prep - DCF Valuation',
            url: `https://financialmodelingprep.com/financial-summary/${symbol}`,
            description: 'Valorisation DCF (Discounted Cash Flow)'
          }
        ]
      };
    }
    case 'getAnalystRatings': {
      const symbol = String(args.symbol || '').trim().toUpperCase();
      if (!symbol) throw new Error('Paramètre symbol requis');
      const url = `${getBaseUrl()}/api/fmp?endpoint=analyst&symbol=${encodeURIComponent(symbol)}`;
      const r = await fetchWithRetry(url);
      const d = await r.json();
      return {
        ...d,
        sources: [
          {
            name: 'Financial Modeling Prep - Analyst Ratings',
            url: `https://financialmodelingprep.com/financial-summary/${symbol}`,
            description: 'Recommandations d\'analystes et price targets'
          },
          {
            name: 'Yahoo Finance - Analysts',
            url: `https://finance.yahoo.com/quote/${symbol}/analysis`,
            description: 'Consensus et prévisions d\'analystes'
          }
        ]
      };
    }
    case 'getEarningsData': {
      const symbol = String(args.symbol || '').trim().toUpperCase();
      if (!symbol) throw new Error('Paramètre symbol requis');
      const url = `${getBaseUrl()}/api/fmp?endpoint=earnings&symbol=${encodeURIComponent(symbol)}`;
      const r = await fetchWithRetry(url);
      const d = await r.json();
      return {
        ...d,
        sources: [
          {
            name: 'Financial Modeling Prep - Earnings',
            url: `https://financialmodelingprep.com/financial-summary/${symbol}`,
            description: 'Résultats trimestriels et earnings surprises'
          },
          {
            name: 'Earnings Whispers',
            url: `https://www.earningswhispers.com/stocks/${symbol}`,
            description: 'Calendrier et prévisions earnings'
          }
        ]
      };
    }
    case 'getInsiderTrading': {
      const symbol = String(args.symbol || '').trim().toUpperCase();
      const limit = Number(args.limit || 20);
      if (!symbol) throw new Error('Paramètre symbol requis');
      const url = `${getBaseUrl()}/api/fmp?endpoint=insider&symbol=${encodeURIComponent(symbol)}&limit=${limit}`;
      const r = await fetchWithRetry(url);
      const d = await r.json();
      return {
        ...d,
        sources: [
          {
            name: 'Financial Modeling Prep - Insider Trading',
            url: `https://financialmodelingprep.com/financial-summary/${symbol}`,
            description: 'Transactions d\'initiés'
          },
          {
            name: 'SEC Form 4 Filings',
            url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${symbol}&type=4&dateb=&owner=include&count=40`,
            description: 'Dépôts SEC Form 4 (transactions d\'initiés)'
          }
        ]
      };
    }
    case 'getCompleteAnalysis': {
      const symbol = String(args.symbol || '').trim().toUpperCase();
      if (!symbol) throw new Error('Paramètre symbol requis');
      const url = `${getBaseUrl()}/api/fmp?endpoint=complete&symbol=${encodeURIComponent(symbol)}`;
      const r = await fetchWithRetry(url);
      const d = await r.json();
      return {
        ...d,
        sources: [
          {
            name: 'Financial Modeling Prep - Complete Analysis',
            url: `https://financialmodelingprep.com/financial-summary/${symbol}`,
            description: 'Analyse complète (profil, quote, ratios, DCF, rating, news, earnings, insider)'
          },
          {
            name: 'Yahoo Finance',
            url: `https://finance.yahoo.com/quote/${symbol}`,
            description: 'Vue d\'ensemble du titre'
          },
          {
            name: 'Seeking Alpha',
            url: `https://seekingalpha.com/symbol/${symbol}`,
            description: 'Analyses et actualités'
          }
        ]
      };
    }
    case 'getMarketauxNews': {
      const symbol = String(args.symbol || '').trim().toUpperCase();
      const limit = Number(args.limit || 50);
      const timeframe = Number(args.timeframe || 7);
      if (!symbol) throw new Error('Paramètre symbol requis');
      const url = `${getBaseUrl()}/api/marketaux?endpoint=complete&symbol=${encodeURIComponent(symbol)}&limit=${limit}&timeframe=${timeframe}`;
      const r = await fetchWithRetry(url);
      const data = await r.json();
      return {
        ...data,
        sources: [
          {
            name: 'Marketaux',
            url: `https://www.marketaux.com/`,
            description: 'Actualités financières en temps réel avec analyse de sentiment'
          }
        ]
      };
    }
    case 'getMarketSentiment': {
      const symbol = String(args.symbol || '').trim().toUpperCase();
      const limit = Number(args.limit || 100);
      if (!symbol) throw new Error('Paramètre symbol requis');
      const url = `${getBaseUrl()}/api/marketaux?endpoint=ticker-sentiment&symbol=${encodeURIComponent(symbol)}&limit=${limit}`;
      const r = await fetchWithRetry(url);
      const data = await r.json();
      return {
        ...data,
        sources: [
          {
            name: 'Marketaux - Sentiment Analysis',
            url: `https://www.marketaux.com/`,
            description: 'Analyse de sentiment basée sur les actualités récentes'
          }
        ]
      };
    }
    case 'getTrendingNews': {
      const limit = Number(args.limit || 20);
      const url = `${getBaseUrl()}/api/marketaux?endpoint=trending&limit=${limit}`;
      const r = await fetchWithRetry(url);
      const data = await r.json();
      return {
        ...data,
        sources: [
          {
            name: 'Marketaux - Trending News',
            url: `https://www.marketaux.com/`,
            description: 'Actualités financières les plus populaires'
          }
        ]
      };
    }
    case 'getMarketOverview': {
      const industries = Array.isArray(args.industries) ? args.industries : ['Technology', 'Finance', 'Healthcare', 'Energy'];
      const limit = Number(args.limit || 30);
      const url = `${getBaseUrl()}/api/marketaux?endpoint=market-overview&industries=${industries.join(',')}&limit=${limit}`;
      const r = await fetchWithRetry(url);
      const data = await r.json();
      return {
        ...data,
        sources: [
          {
            name: 'Marketaux - Market Overview',
            url: `https://www.marketaux.com/`,
            description: 'Aperçu du marché par secteur avec sentiment'
          }
        ]
      };
    }
    default:
      throw new Error(`Fonction inconnue: ${name}`);
  }
}
