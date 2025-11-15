/**
 * Perplexity Fetcher
 *
 * Module qui OBTIENT des données depuis Perplexity (recherche externe).
 * Ce module est une SOURCE DE VÉRITÉ pour les résumés/recherches.
 *
 * Utilise l'API Perplexity avec le modèle sonar-pro.
 */

const fetch = require('node-fetch');

const PERPLEXITY_CONFIG = {
  baseUrl: 'https://api.perplexity.ai',
  model: 'sonar-pro', // Modèle avec sources
  temperature: 0.3, // Faible température pour précision
  maxTokens: 500, // Limité pour SMS (vs 6000 pour web)
};

/**
 * Recherche via Perplexity et retourne un résumé avec sources
 * @param {string} query - Requête de recherche
 * @param {Object} options - Options (maxTokens, temperature)
 * @returns {Promise<Object>} { summary, sources, citations }
 */
async function searchPerplexity(query, options = {}) {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY non configurée');
  }

  const payload = {
    model: options.model || PERPLEXITY_CONFIG.model,
    messages: [
      {
        role: 'system',
        content: buildSearchSystemPrompt(),
      },
      {
        role: 'user',
        content: query,
      },
    ],
    temperature: options.temperature || PERPLEXITY_CONFIG.temperature,
    max_tokens: options.maxTokens || PERPLEXITY_CONFIG.maxTokens,
    return_citations: true, // Important: récupérer les sources
    return_images: false, // Pas d'images pour SMS
  };

  try {
    const response = await fetch(`${PERPLEXITY_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      timeout: 10000, // 10s timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('Perplexity: Aucune réponse retournée');
    }

    const choice = data.choices[0];
    const summary = choice.message.content;
    const citations = choice.citations || [];

    // Extraire les sources uniques
    const sources = extractSources(citations);

    return {
      summary,
      sources,
      citations,
      model: data.model,
      usage: data.usage, // Tokens utilisés
    };
  } catch (err) {
    console.error('[Perplexity Fetcher] Erreur:', err.message);
    throw new Error(`Erreur Perplexity: ${err.message}`);
  }
}

/**
 * Construit le prompt système pour la recherche Perplexity
 */
function buildSearchSystemPrompt() {
  return `Tu es un assistant de recherche précis et factuel.

RÈGLES ABSOLUES:
1. Réponds de manière concise et factuelle
2. Utilise UNIQUEMENT les informations trouvées dans ta recherche
3. JAMAIS inventer ou extrapoler des faits
4. Cite toujours tes sources (numéros entre crochets)
5. Si une information n'est pas trouvée, dis "Information non disponible"
6. Limite ta réponse à 300-400 caractères maximum (format SMS)
7. Utilise des phrases courtes et claires

FORMAT DE RÉPONSE:
[Réponse concise avec faits vérifiés] [1][2]

Sources:
[1] Source 1
[2] Source 2`;
}

/**
 * Extrait les sources uniques depuis les citations
 * @param {Array} citations - Citations Perplexity
 * @returns {Array<string>} Liste des URLs sources
 */
function extractSources(citations) {
  if (!citations || citations.length === 0) {
    return [];
  }

  // Dédupliquer et nettoyer les URLs
  const uniqueSources = [...new Set(citations)];

  // Limiter à 3 sources max pour SMS
  return uniqueSources.slice(0, 3).map((url) => {
    // Nettoyer l'URL (enlever query params superflus)
    try {
      const parsed = new URL(url);
      return `${parsed.hostname}${parsed.pathname}`;
    } catch {
      return url;
    }
  });
}

/**
 * Recherche spécifique pour analyse financière
 * @param {string} ticker - Symbole boursier
 * @param {string} aspect - Aspect à rechercher (news, sentiment, etc.)
 * @returns {Promise<Object>}
 */
async function searchFinancialContext(ticker, aspect = 'news') {
  let query;

  switch (aspect) {
    case 'news':
      query = `Dernières nouvelles importantes pour ${ticker} dans les 48h dernières heures. Résumé en 2-3 phrases max.`;
      break;
    case 'sentiment':
      query = `Sentiment actuel du marché pour ${ticker}. Positif, négatif ou neutre ? Pourquoi en 1-2 phrases.`;
      break;
    case 'catalysts':
      query = `Principaux catalyseurs à venir pour ${ticker} (earnings, événements). 2 phrases max.`;
      break;
    default:
      query = `Contexte actuel pour ${ticker}. 2-3 phrases max.`;
  }

  return searchPerplexity(query, {
    maxTokens: 400, // Un peu plus pour contexte financier
  });
}

module.exports = {
  searchPerplexity,
  searchFinancialContext,
  PERPLEXITY_CONFIG, // Export pour tests
};
