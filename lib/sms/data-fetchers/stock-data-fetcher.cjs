/**
 * Stock Data Fetcher
 *
 * Module qui OBTIENT les données boursières depuis les APIs financières.
 * Ce module est une SOURCE DE VÉRITÉ (pas le LLM !).
 *
 * Fallback chain: FMP → Polygon → Alpha Vantage → Yahoo Finance
 */

const fetch = require('node-fetch');

// Configuration des endpoints
const DATA_SOURCES = {
  FMP: {
    name: 'FMP',
    baseUrl: 'https://financialmodelingprep.com/api/v3',
    apiKey: process.env.FMP_API_KEY,
  },
  ALPHA_VANTAGE: {
    name: 'Alpha Vantage',
    baseUrl: 'https://www.alphavantage.co',
    apiKey: process.env.ALPHA_VANTAGE_API_KEY,
  },
  TWELVE_DATA: {
    name: 'Twelve Data',
    baseUrl: 'https://api.twelvedata.com',
    apiKey: process.env.TWELVE_DATA_API_KEY,
  },
};

/**
 * Récupère le prix actuel d'un ticker
 * @param {string} ticker - Symbole boursier (ex: AAPL)
 * @returns {Promise<Object>} { price, change, changePercent, volume, source }
 */
async function getStockPrice(ticker) {
  const errors = [];

  // Tenter FMP en premier
  try {
    const data = await fetchFromFMP(ticker);
    if (data) return { ...data, source: 'FMP' };
  } catch (err) {
    errors.push({ source: 'FMP', error: err.message });
  }

  // Fallback: Alpha Vantage
  try {
    const data = await fetchFromAlphaVantage(ticker);
    if (data) return { ...data, source: 'Alpha Vantage' };
  } catch (err) {
    errors.push({ source: 'Alpha Vantage', error: err.message });
  }

  // Fallback: Twelve Data
  try {
    const data = await fetchFromTwelveData(ticker);
    if (data) return { ...data, source: 'Twelve Data' };
  } catch (err) {
    errors.push({ source: 'Twelve Data', error: err.message });
  }

  // Toutes les sources ont échoué
  throw new Error(`Impossible de récupérer le prix pour ${ticker}. Erreurs: ${JSON.stringify(errors)}`);
}

/**
 * Récupère les données complètes pour une analyse
 * @param {string} ticker - Symbole boursier
 * @param {string} modifier - Type d'analyse ('complete', 'courte', etc.)
 * @returns {Promise<Object>} Données complètes pour analyse
 */
async function getStockAnalysisData(ticker, modifier = 'complete') {
  const errors = [];

  try {
    // FMP: Données les plus complètes
    const [quote, profile, ratios, income] = await Promise.allSettled([
      fetchFromFMP(ticker, 'quote'),
      fetchFromFMP(ticker, 'profile'),
      fetchFromFMP(ticker, 'ratios'),
      modifier === 'complete' ? fetchFromFMP(ticker, 'income') : Promise.resolve(null),
    ]);

    const data = {
      quote: quote.status === 'fulfilled' ? quote.value : null,
      profile: profile.status === 'fulfilled' ? profile.value : null,
      ratios: ratios.status === 'fulfilled' ? ratios.value : null,
      income: income.status === 'fulfilled' ? income.value : null,
      source: 'FMP',
    };

    // Vérifier que nous avons au moins les données de base
    if (data.quote) {
      return data;
    }
  } catch (err) {
    errors.push({ source: 'FMP', error: err.message });
  }

  // Fallback: Alpha Vantage (données plus limitées)
  try {
    const quote = await fetchFromAlphaVantage(ticker);
    return {
      quote,
      profile: null,
      ratios: null,
      income: null,
      source: 'Alpha Vantage',
    };
  } catch (err) {
    errors.push({ source: 'Alpha Vantage', error: err.message });
  }

  throw new Error(`Impossible de récupérer les données d'analyse pour ${ticker}. Erreurs: ${JSON.stringify(errors)}`);
}

/**
 * Fetch depuis FMP
 */
async function fetchFromFMP(ticker, endpoint = 'quote') {
  const { baseUrl, apiKey } = DATA_SOURCES.FMP;

  if (!apiKey) {
    throw new Error('FMP_API_KEY non configurée');
  }

  let url;
  switch (endpoint) {
    case 'quote':
      url = `${baseUrl}/quote/${ticker}?apikey=${apiKey}`;
      break;
    case 'profile':
      url = `${baseUrl}/profile/${ticker}?apikey=${apiKey}`;
      break;
    case 'ratios':
      url = `${baseUrl}/ratios/${ticker}?apikey=${apiKey}`;
      break;
    case 'income':
      url = `${baseUrl}/income-statement/${ticker}?limit=1&apikey=${apiKey}`;
      break;
    default:
      throw new Error(`Endpoint FMP inconnu: ${endpoint}`);
  }

  const response = await fetch(url, { timeout: 5000 });

  if (!response.ok) {
    throw new Error(`FMP HTTP ${response.status}`);
  }

  const data = await response.json();

  if (!data || (Array.isArray(data) && data.length === 0)) {
    throw new Error('FMP: Aucune donnée retournée');
  }

  // FMP retourne souvent des arrays
  return Array.isArray(data) ? data[0] : data;
}

/**
 * Fetch depuis Alpha Vantage
 */
async function fetchFromAlphaVantage(ticker) {
  const { baseUrl, apiKey } = DATA_SOURCES.ALPHA_VANTAGE;

  if (!apiKey) {
    throw new Error('ALPHA_VANTAGE_API_KEY non configurée');
  }

  const url = `${baseUrl}/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`;
  const response = await fetch(url, { timeout: 5000 });

  if (!response.ok) {
    throw new Error(`Alpha Vantage HTTP ${response.status}`);
  }

  const data = await response.json();

  if (!data['Global Quote']) {
    throw new Error('Alpha Vantage: Format de données invalide');
  }

  const quote = data['Global Quote'];

  return {
    price: parseFloat(quote['05. price']),
    change: parseFloat(quote['09. change']),
    changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
    volume: parseInt(quote['06. volume']),
    previousClose: parseFloat(quote['08. previous close']),
  };
}

/**
 * Fetch depuis Twelve Data
 */
async function fetchFromTwelveData(ticker) {
  const { baseUrl, apiKey } = DATA_SOURCES.TWELVE_DATA;

  if (!apiKey) {
    throw new Error('TWELVE_DATA_API_KEY non configurée');
  }

  const url = `${baseUrl}/quote?symbol=${ticker}&apikey=${apiKey}`;
  const response = await fetch(url, { timeout: 5000 });

  if (!response.ok) {
    throw new Error(`Twelve Data HTTP ${response.status}`);
  }

  const data = await response.json();

  if (!data || data.status === 'error') {
    throw new Error(`Twelve Data: ${data.message || 'Erreur inconnue'}`);
  }

  return {
    price: parseFloat(data.close),
    change: parseFloat(data.change),
    changePercent: parseFloat(data.percent_change),
    volume: parseInt(data.volume),
    previousClose: parseFloat(data.previous_close),
  };
}

/**
 * Récupère les nouvelles d'un ticker
 * @param {string} ticker - Symbole boursier
 * @param {number} limit - Nombre de nouvelles (défaut: 3)
 * @returns {Promise<Object>}
 */
async function getStockNews(ticker, limit = 3) {
  const { baseUrl, apiKey } = DATA_SOURCES.FMP;

  if (!apiKey) {
    throw new Error('FMP_API_KEY non configurée');
  }

  try {
    const url = `${baseUrl}/stock_news?tickers=${ticker}&limit=${limit}&apikey=${apiKey}`;
    const response = await fetch(url, { timeout: 5000 });

    if (!response.ok) {
      throw new Error(`FMP HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      throw new Error('FMP: Aucune nouvelle');
    }

    return {
      news: data.map(article => ({
        title: article.title,
        publishedDate: article.publishedDate,
        site: article.site,
        url: article.url,
      })),
      source: 'FMP',
    };
  } catch (err) {
    // Fallback: Perplexity
    try {
      const { searchFinancialContext } = require('./perplexity-fetcher.cjs');
      const result = await searchFinancialContext(ticker, 'news');
      return {
        summary: result.summary,
        sources: result.sources,
        source: 'Perplexity',
      };
    } catch (fallbackErr) {
      throw new Error(`Stock news failed: ${err.message}`);
    }
  }
}

/**
 * Récupère les résultats financiers (earnings)
 * @param {string} ticker - Symbole boursier
 * @returns {Promise<Object>}
 */
async function getEarnings(ticker) {
  const { baseUrl, apiKey } = DATA_SOURCES.FMP;

  if (!apiKey) {
    throw new Error('FMP_API_KEY non configurée');
  }

  try {
    const url = `${baseUrl}/earnings-surprises/${ticker}?apikey=${apiKey}`;
    const response = await fetch(url, { timeout: 5000 });

    if (!response.ok) {
      throw new Error(`FMP HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      throw new Error('FMP: Aucun résultat');
    }

    const latest = data[0];

    return {
      date: latest.date,
      actual: latest.actualEarningResult,
      estimated: latest.estimatedEarning,
      surprise: ((latest.actualEarningResult - latest.estimatedEarning) / latest.estimatedEarning * 100).toFixed(2),
      source: 'FMP',
    };
  } catch (err) {
    throw new Error(`Earnings failed: ${err.message}`);
  }
}

/**
 * Récupère recommandations analystes
 * @param {string} ticker - Symbole boursier
 * @returns {Promise<Object>}
 */
async function getRecommendations(ticker) {
  const { baseUrl, apiKey } = DATA_SOURCES.FMP;

  if (!apiKey) {
    throw new Error('FMP_API_KEY non configurée');
  }

  try {
    const url = `${baseUrl}/rating/${ticker}?apikey=${apiKey}`;
    const response = await fetch(url, { timeout: 5000 });

    if (!response.ok) {
      throw new Error(`FMP HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      throw new Error('FMP: Aucune recommandation');
    }

    const latest = data[0];

    return {
      rating: latest.rating,
      targetPrice: latest.ratingDetailsDCFScore,
      recommendation: latest.ratingRecommendation,
      source: 'FMP',
    };
  } catch (err) {
    throw new Error(`Recommendations failed: ${err.message}`);
  }
}

module.exports = {
  getStockPrice,
  getStockAnalysisData,
  getStockNews,
  getEarnings,
  getRecommendations,
};
