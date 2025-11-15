/**
 * SMS Orchestrator
 *
 * LOGIQUE CENTRALE du système SMS v2.
 *
 * Pipeline: SMS → Intent → Data Fetching → LLM Formatter → Validation → SMS
 *
 * Ce module orchestre tous les autres modules:
 * - intent-detector-sms.js (détection intention)
 * - data-fetchers/* (récupération données)
 * - llm-formatter.js (formatage Perplexity)
 * - sms-validator.js (validation finale)
 */

const { detectIntent } = require('./intent-detector-sms.cjs');
const { getStockPrice, getStockAnalysisData } = require('./data-fetchers/stock-data-fetcher.cjs');
const { searchPerplexity, searchFinancialContext } = require('./data-fetchers/perplexity-fetcher.cjs');
const { calculateLoan, calculateVariation, calculatePE } = require('./data-fetchers/financial-calculator.cjs');
const { formatForSMS } = require('./llm-formatter.cjs');
const { validateSMS, autoFixSMS } = require('./sms-validator.cjs');

/**
 * Traite un message SMS de bout en bout
 * @param {string} message - Message SMS reçu
 * @param {Object} context - Contexte conversation
 * @returns {Promise<Object>} { response, metadata }
 */
async function processSMS(message, context = {}) {
  const startTime = Date.now();
  const metadata = {
    pipeline: [],
  };

  try {
    // ÉTAPE 1: Détection d'intention
    metadata.pipeline.push({ step: 'intent_detection', timestamp: Date.now() });

    const intentResult = detectIntent(message, context);

    if (intentResult.needsClarification) {
      // Besoin de clarification → réponse immédiate
      return {
        response: intentResult.clarification,
        metadata: {
          ...metadata,
          intent: intentResult.intent,
          needsClarification: true,
          latency: Date.now() - startTime,
        },
      };
    }

    const { intent, entities } = intentResult;
    metadata.intent = intent;
    metadata.entities = entities;

    // ÉTAPE 2: Data Fetching (selon l'intent)
    metadata.pipeline.push({ step: 'data_fetching', timestamp: Date.now() });

    const sourceData = await fetchDataForIntent(intent, entities, context);
    metadata.dataSource = sourceData.source;

    // ÉTAPE 3: LLM Formatting
    metadata.pipeline.push({ step: 'llm_formatting', timestamp: Date.now() });

    const formatted = await formatForSMS(sourceData, intent, {
      previousMessages: context.previousMessages,
    });

    // ÉTAPE 4: Validation SMS
    metadata.pipeline.push({ step: 'validation', timestamp: Date.now() });

    const validation = validateSMS(formatted.text);

    if (!validation.valid) {
      // Auto-fix si validation échoue
      console.warn('[SMS Orchestrator] Validation failed, auto-fixing:', validation.errors);
      const fixed = autoFixSMS(formatted.text, {
        defaultSource: sourceData.source,
      });

      metadata.autoFixed = true;
      metadata.corrections = fixed.corrections;

      return {
        response: fixed.text,
        metadata: {
          ...metadata,
          validation,
          latency: Date.now() - startTime,
        },
      };
    }

    // ÉTAPE 5: Réponse finale
    metadata.pipeline.push({ step: 'complete', timestamp: Date.now() });

    return {
      response: formatted.text,
      metadata: {
        ...metadata,
        validation,
        truncated: formatted.truncated,
        model: formatted.metadata?.model,
        latency: Date.now() - startTime,
      },
    };
  } catch (err) {
    console.error('[SMS Orchestrator] Erreur:', err);

    // Gérer erreurs gracieusement
    return {
      response: buildErrorResponse(err, intent),
      metadata: {
        ...metadata,
        error: err.message,
        latency: Date.now() - startTime,
      },
    };
  }
}

/**
 * Récupère les données selon l'intent
 * @param {string} intent - Intent détecté
 * @param {Object} entities - Entités extraites
 * @param {Object} context - Contexte
 * @returns {Promise<Object>} Source data
 */
async function fetchDataForIntent(intent, entities, context) {
  switch (intent) {
    case 'ANALYSE':
      return fetchAnalysisData(entities);

    case 'DONNEES':
      return fetchSpecificData(entities);

    case 'RESUME':
      return fetchResumeData(entities);

    case 'CALCUL':
      return fetchCalculationData(entities);

    case 'SOURCES':
      return fetchSourcesData(context);

    case 'AIDE':
      return { intent: 'AIDE' };

    default:
      throw new Error(`Intent non supporté: ${intent}`);
  }
}

/**
 * Récupère données pour ANALYSE
 */
async function fetchAnalysisData(entities) {
  const { ticker, modifier } = entities;

  try {
    // Récupérer données boursières complètes
    const stockData = await getStockAnalysisData(ticker, modifier);

    // Optionnel: Ajouter contexte Perplexity (news récentes)
    let perplexityContext = null;
    if (modifier === 'complete') {
      try {
        perplexityContext = await searchFinancialContext(ticker, 'news');
      } catch (err) {
        console.warn('[Analysis] Perplexity context failed:', err.message);
      }
    }

    return {
      ...stockData,
      perplexityContext,
      ticker,
      modifier,
    };
  } catch (err) {
    throw new Error(`Impossible d'analyser ${ticker}: ${err.message}`);
  }
}

/**
 * Récupère données pour DONNEES
 */
async function fetchSpecificData(entities) {
  const { ticker, dataType, type, region } = entities;

  if (ticker) {
    // Donnée boursière spécifique
    try {
      const data = await getStockPrice(ticker);

      return {
        dataType,
        ticker,
        value: data.price,
        change: data.change,
        changePercent: data.changePercent,
        volume: data.volume,
        source: data.source,
      };
    } catch (err) {
      throw new Error(`Impossible de récupérer ${dataType} pour ${ticker}: ${err.message}`);
    }
  }

  if (type) {
    // Donnée économique (taux, inflation, etc.)
    try {
      const query = buildEconomicQuery(type, region);
      const result = await searchPerplexity(query);

      return {
        dataType: type,
        region,
        summary: result.summary,
        sources: result.sources,
        source: 'Perplexity',
      };
    } catch (err) {
      throw new Error(`Impossible de récupérer ${type}: ${err.message}`);
    }
  }

  throw new Error('Données insuffisantes pour DONNEES intent');
}

/**
 * Construit requête économique pour Perplexity
 */
function buildEconomicQuery(type, region) {
  const regionName = region === 'US' ? 'États-Unis' : region === 'CA' ? 'Canada' : 'Europe';

  const queries = {
    fed: `Taux directeur actuel de la Fed (Federal Reserve). Valeur en %, date de dernière modification.`,
    boc: `Taux directeur actuel de la Banque du Canada. Valeur en %, date.`,
    inflation: `Taux d'inflation actuel ${regionName}. Valeur en %, date des données.`,
    unemployment: `Taux de chômage actuel ${regionName}. Valeur en %, date.`,
  };

  return queries[type] || `Donnée économique: ${type} pour ${regionName}`;
}

/**
 * Récupère données pour RESUME
 */
async function fetchResumeData(entities) {
  const { query } = entities;

  try {
    const result = await searchPerplexity(query, {
      maxTokens: 500, // Un peu plus pour résumé
    });

    return {
      query,
      summary: result.summary,
      sources: result.sources,
      citations: result.citations,
      source: 'Perplexity',
    };
  } catch (err) {
    throw new Error(`Recherche Perplexity échouée: ${err.message}`);
  }
}

/**
 * Récupère données pour CALCUL
 */
async function fetchCalculationData(entities) {
  const { calculationType } = entities;

  try {
    let result;

    if (calculationType === 'loan') {
      const { amount, years, rate } = entities;
      result = calculateLoan(amount, rate, years);
    } else if (calculationType === 'variation') {
      const { from, to } = entities;
      result = calculateVariation(from, to);
    } else if (calculationType === 'ratio') {
      const { price, earnings } = entities;
      result = calculatePE(price, earnings);
    } else {
      throw new Error(`Type de calcul inconnu: ${calculationType}`);
    }

    return {
      calculationType,
      result,
      source: 'Calculatrice',
    };
  } catch (err) {
    throw new Error(`Calcul échoué: ${err.message}`);
  }
}

/**
 * Récupère sources du message précédent
 */
async function fetchSourcesData(context) {
  const previousSources = context.previousSources || [];

  return {
    intent: 'SOURCES',
    previousSources,
  };
}

/**
 * Construit réponse d'erreur user-friendly
 */
function buildErrorResponse(err, intent) {
  const errorMessages = {
    ANALYSE: "Désolé, impossible d'analyser ce ticker pour le moment. Réessayez plus tard.",
    DONNEES: "Désolé, données non disponibles. Réessayez plus tard.",
    RESUME: "Désolé, recherche échouée. Réessayez plus tard.",
    CALCUL: "Désolé, calcul impossible. Vérifiez vos paramètres.",
    SOURCES: "Aucune source disponible pour le message précédent.",
    AIDE: "Erreur système. Contactez support.",
  };

  // Message générique si intent inconnu
  return errorMessages[intent] || "Erreur système. Réessayez plus tard.";
}

/**
 * Récupère statistiques du système SMS
 * @returns {Object} Statistiques
 */
function getSystemStats() {
  // TODO: Implémenter compteurs persistants (Redis/Supabase)
  return {
    totalMessages: 0,
    intentDistribution: {},
    averageLatency: 0,
    errorRate: 0,
  };
}

module.exports = {
  processSMS,
  getSystemStats,
};
