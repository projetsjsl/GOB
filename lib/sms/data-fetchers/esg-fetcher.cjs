/**
 * ESG Fetcher
 *
 * Récupère scores ESG (Environmental, Social, Governance)
 * Sources: Perplexity (FMP ne fournit pas ESG scores)
 */

/**
 * Récupère score ESG d'une entreprise
 * @param {string} ticker - Symbole boursier
 * @returns {Promise<Object>} { ticker, esgScore, summary, source }
 */
async function getESGScore(ticker) {
  try {
    const { searchPerplexity } = require('./perplexity-fetcher.cjs');

    const query = `Score ESG de ${ticker}. Notation (A/B/C) + bref résumé efforts durabilité en 2 phrases max.`;
    const result = await searchPerplexity(query, {
      maxTokens: 250,
    });

    return {
      ticker,
      summary: result.summary,
      sources: result.sources,
      source: 'Perplexity',
    };
  } catch (err) {
    console.error('[ESG Fetcher] Error:', err.message);
    throw new Error(`ESG score failed: ${err.message}`);
  }
}

/**
 * Récupère initiatives climatiques d'une entreprise
 * @param {string} ticker - Symbole boursier
 * @returns {Promise<Object>}
 */
async function getClimateInitiatives(ticker) {
  try {
    const { searchPerplexity } = require('./perplexity-fetcher.cjs');

    const query = `Initiatives climat/environnement de ${ticker}. Objectifs neutralité carbone en 1-2 phrases.`;
    const result = await searchPerplexity(query, {
      maxTokens: 200,
    });

    return {
      ticker,
      summary: result.summary,
      sources: result.sources,
      source: 'Perplexity',
    };
  } catch (err) {
    throw new Error(`Climate initiatives failed: ${err.message}`);
  }
}

module.exports = {
  getESGScore,
  getClimateInitiatives,
};
