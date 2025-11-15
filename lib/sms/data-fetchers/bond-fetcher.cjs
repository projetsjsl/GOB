/**
 * Bond Fetcher
 *
 * Récupère données obligations (treasury bonds, yields)
 * Sources: Perplexity (FMP ne fournit pas directement yields)
 */

/**
 * Récupère yield des obligations US
 * @param {string} maturity - Maturité ('2Y', '10Y', '30Y')
 * @returns {Promise<Object>} { maturity, yield, change, source }
 */
async function getTreasuryYield(maturity = '10Y') {
  try {
    const { searchPerplexity } = require('./perplexity-fetcher.cjs');

    const query = `Rendement actuel des obligations US Treasury ${maturity}. Taux + variation récente en 1 phrase.`;
    const result = await searchPerplexity(query, {
      maxTokens: 150,
    });

    return {
      maturity,
      summary: result.summary,
      sources: result.sources,
      source: 'Perplexity',
    };
  } catch (err) {
    console.error('[Bond Fetcher] Error:', err.message);
    throw new Error(`Treasury yield failed: ${err.message}`);
  }
}

/**
 * Récupère spread obligations (ex: 10Y-2Y)
 * @returns {Promise<Object>}
 */
async function getYieldSpread() {
  try {
    const { searchPerplexity } = require('./perplexity-fetcher.cjs');

    const query = 'Spread yield curve US Treasury (10Y - 2Y). Valeur actuelle en 1 phrase.';
    const result = await searchPerplexity(query, {
      maxTokens: 120,
    });

    return {
      type: 'yield_spread',
      summary: result.summary,
      sources: result.sources,
      source: 'Perplexity',
    };
  } catch (err) {
    throw new Error(`Yield spread failed: ${err.message}`);
  }
}

module.exports = {
  getTreasuryYield,
  getYieldSpread,
};
