/**
 * Market Data Fetcher
 *
 * Récupère données de marché: indices, secteurs, sentiment
 * Sources: FMP API + Perplexity (fallback)
 */

const fetch = require('node-fetch');

const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';
const FMP_API_KEY = process.env.FMP_API_KEY;

/**
 * Récupère aperçu des marchés (indices principaux)
 * @returns {Promise<Object>} { indices, sentiment, source }
 */
async function getMarketOverview() {
  try {
    // FMP: Indices principaux (S&P, Nasdaq, Dow)
    const symbols = ['^GSPC', '^IXIC', '^DJI', '^FTSE', '^N225']; // S&P, Nasdaq, Dow, FTSE, Nikkei
    const quotes = await fetchMultipleQuotes(symbols);

    const indices = quotes.map(q => ({
      symbol: q.symbol,
      name: getIndexName(q.symbol),
      price: q.price,
      change: q.change,
      changePercent: q.changesPercentage,
    }));

    // Calculer sentiment global (simpliste)
    const positive = quotes.filter(q => q.change > 0).length;
    const sentiment = positive >= quotes.length / 2 ? 'Positif' : 'Négatif';

    return {
      indices,
      sentiment,
      source: 'FMP',
    };
  } catch (err) {
    console.error('[Market Data Fetcher] Error:', err.message);

    // Fallback: Perplexity
    try {
      const { searchPerplexity } = require('./perplexity-fetcher.cjs');
      const result = await searchPerplexity('Indices boursiers actuels (S&P 500, Nasdaq, Dow Jones). Prix et variations en 1 phrase.', {
        maxTokens: 300,
      });

      return {
        indices: [],
        summary: result.summary,
        sentiment: 'Inconnu',
        source: 'Perplexity',
      };
    } catch (fallbackErr) {
      throw new Error(`Market overview failed: ${err.message}`);
    }
  }
}

/**
 * Récupère performance d'un secteur
 * @param {string} sector - Secteur (tech, finance, healthcare, etc.)
 * @returns {Promise<Object>} { sector, performance, leaders, source }
 */
async function getSectorPerformance(sector) {
  try {
    // FMP: Secteur ETFs comme proxy
    const sectorETFs = {
      'tech': 'XLK',
      'technologie': 'XLK',
      'finance': 'XLF',
      'financier': 'XLF',
      'santé': 'XLV',
      'sante': 'XLV',
      'healthcare': 'XLV',
      'énergie': 'XLE',
      'energie': 'XLE',
      'energy': 'XLE',
      'consommation': 'XLY',
      'consumer': 'XLY',
    };

    const etfSymbol = sectorETFs[sector.toLowerCase()] || 'XLK';
    const quote = await fetchQuote(etfSymbol);

    return {
      sector,
      etfSymbol,
      price: quote.price,
      changePercent: quote.changesPercentage,
      performance: quote.changesPercentage > 0 ? 'Positive' : 'Négative',
      source: 'FMP',
    };
  } catch (err) {
    console.error('[Market Data Fetcher] Sector error:', err.message);

    // Fallback: Perplexity
    try {
      const { searchPerplexity } = require('./perplexity-fetcher.cjs');
      const result = await searchPerplexity(`Performance du secteur ${sector} aujourd'hui. 1 phrase avec variation %.`, {
        maxTokens: 200,
      });

      return {
        sector,
        summary: result.summary,
        source: 'Perplexity',
      };
    } catch (fallbackErr) {
      throw new Error(`Sector performance failed: ${err.message}`);
    }
  }
}

/**
 * Fetch quote FMP
 */
async function fetchQuote(symbol) {
  if (!FMP_API_KEY) {
    throw new Error('FMP_API_KEY non configurée');
  }

  const url = `${FMP_BASE_URL}/quote/${symbol}?apikey=${FMP_API_KEY}`;
  const response = await fetch(url, { timeout: 5000 });

  if (!response.ok) {
    throw new Error(`FMP HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!data || data.length === 0) {
    throw new Error('FMP: Aucune donnée');
  }

  return data[0];
}

/**
 * Fetch multiple quotes FMP
 */
async function fetchMultipleQuotes(symbols) {
  const symbolsStr = symbols.join(',');
  const url = `${FMP_BASE_URL}/quote/${symbolsStr}?apikey=${FMP_API_KEY}`;
  const response = await fetch(url, { timeout: 5000 });

  if (!response.ok) {
    throw new Error(`FMP HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Nom lisible des indices
 */
function getIndexName(symbol) {
  const names = {
    '^GSPC': 'S&P 500',
    '^IXIC': 'Nasdaq',
    '^DJI': 'Dow Jones',
    '^FTSE': 'FTSE 100',
    '^N225': 'Nikkei 225',
  };
  return names[symbol] || symbol;
}

module.exports = {
  getMarketOverview,
  getSectorPerformance,
};
