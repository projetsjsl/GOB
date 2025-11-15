/**
 * Forex Fetcher
 *
 * Récupère taux de change devises
 * Sources: FMP API + Perplexity (fallback)
 */

const fetch = require('node-fetch');

const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';
const FMP_API_KEY = process.env.FMP_API_KEY;

/**
 * Récupère taux de change pour une paire de devises
 * @param {string} pair - Paire (ex: "USD/EUR", "EURUSD")
 * @returns {Promise<Object>} { pair, rate, change, changePercent, source }
 */
async function getForexRate(pair) {
  try {
    // Normaliser la paire (enlever "/" si présent)
    const normalizedPair = pair.replace('/', '').toUpperCase();

    if (!FMP_API_KEY) {
      throw new Error('FMP_API_KEY non configurée');
    }

    // FMP: Quote forex
    const url = `${FMP_BASE_URL}/quote/${normalizedPair}?apikey=${FMP_API_KEY}`;
    const response = await fetch(url, { timeout: 5000 });

    if (!response.ok) {
      throw new Error(`FMP HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data || data.length === 0) {
      throw new Error('FMP: Aucune donnée forex');
    }

    const quote = data[0];

    return {
      pair: normalizedPair,
      rate: quote.price,
      change: quote.change,
      changePercent: quote.changesPercentage,
      bid: quote.bid,
      ask: quote.ask,
      source: 'FMP',
    };
  } catch (err) {
    console.error('[Forex Fetcher] Error:', err.message);

    // Fallback: Perplexity
    try {
      const { searchPerplexity } = require('./perplexity-fetcher.cjs');
      const result = await searchPerplexity(`Taux de change ${pair} actuel. Taux + variation % en 1 phrase.`, {
        maxTokens: 150,
      });

      return {
        pair,
        summary: result.summary,
        sources: result.sources,
        source: 'Perplexity',
      };
    } catch (fallbackErr) {
      throw new Error(`Forex rate failed: ${err.message}`);
    }
  }
}

/**
 * Récupère taux majeurs (USD/EUR, USD/GBP, etc.)
 * @returns {Promise<Array>} Liste des taux majeurs
 */
async function getMajorForexRates() {
  const majorPairs = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCAD', 'USDCHF'];

  try {
    const rates = await Promise.all(
      majorPairs.map(pair => getForexRate(pair).catch(err => null))
    );

    return rates.filter(r => r !== null);
  } catch (err) {
    throw new Error(`Major forex rates failed: ${err.message}`);
  }
}

module.exports = {
  getForexRate,
  getMajorForexRates,
};
