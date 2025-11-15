/**
 * SMS Orchestrator COMPLET - 28 Intents
 *
 * Pipeline: SMS → Intent → Data Fetching → LLM Formatter → Validation → SMS
 */

const { detectIntent } = require('./intent-detector-sms-complete.cjs');
const { validateSMS, autoFixSMS } = require('./sms-validator.cjs');

/**
 * Traite un message SMS de bout en bout (28 intents)
 */
async function processSMS(message, context = {}) {
  const startTime = Date.now();
  const metadata = { pipeline: [] };

  try {
    // ÉTAPE 1: Détection d'intention
    metadata.pipeline.push({ step: 'intent_detection', timestamp: Date.now() });
    const intentResult = detectIntent(message, context);

    if (intentResult.needsClarification) {
      return {
        response: intentResult.clarification,
        metadata: { ...metadata, intent: intentResult.intent, needsClarification: true, latency: Date.now() - startTime },
      };
    }

    const { intent, entities } = intentResult;
    metadata.intent = intent;
    metadata.entities = entities;

    // ÉTAPE 2: Data Fetching
    metadata.pipeline.push({ step: 'data_fetching', timestamp: Date.now() });
    const sourceData = await fetchDataForIntent(intent, entities, context);
    metadata.dataSource = sourceData.source;

    // ÉTAPE 3: LLM Formatting
    metadata.pipeline.push({ step: 'llm_formatting', timestamp: Date.now() });
    const formatted = await formatResponse(sourceData, intent, context);

    // ÉTAPE 4: Validation SMS
    metadata.pipeline.push({ step: 'validation', timestamp: Date.now() });
    const validation = validateSMS(formatted.text);

    if (!validation.valid) {
      const fixed = autoFixSMS(formatted.text, { defaultSource: sourceData.source });
      metadata.autoFixed = true;
      metadata.corrections = fixed.corrections;
      return { response: fixed.text, metadata: { ...metadata, validation, latency: Date.now() - startTime } };
    }

    metadata.pipeline.push({ step: 'complete', timestamp: Date.now() });
    return {
      response: formatted.text,
      metadata: { ...metadata, validation, truncated: formatted.truncated, latency: Date.now() - startTime },
    };
  } catch (err) {
    console.error('[SMS Orchestrator] Erreur:', err);
    return {
      response: buildErrorResponse(err, metadata.intent),
      metadata: { ...metadata, error: err.message, latency: Date.now() - startTime },
    };
  }
}

/**
 * Récupère données selon intent (28 intents)
 */
async function fetchDataForIntent(intent, entities, context) {
  switch (intent) {
    // ========== BASE (4) ==========
    case 'GREETING':
      return { intent, response: 'Bonjour! Emma IA à votre service. Envoyez "Aide" pour voir les commandes.', source: 'System' };

    case 'HELP':
      return { intent, response: buildDetailedHelp(), source: 'System' };

    case 'PORTFOLIO':
      return await fetchPortfolioData(context);

    case 'GENERAL_CONVERSATION':
      return { intent, response: 'Merci! Comment puis-je vous aider?', source: 'System' };

    // ========== ACTIONS (8) ==========
    case 'STOCK_PRICE': {
      const { getStockPrice } = require('./data-fetchers/stock-data-fetcher.cjs');
      const data = await getStockPrice(entities.ticker);
      return { ...data, intent, ticker: entities.ticker };
    }

    case 'FUNDAMENTALS': {
      const { getStockAnalysisData } = require('./data-fetchers/stock-data-fetcher.cjs');
      const data = await getStockAnalysisData(entities.ticker, 'fundamentals');
      return { ...data, intent, ticker: entities.ticker };
    }

    case 'TECHNICAL_ANALYSIS': {
      const { searchFinancialContext } = require('./data-fetchers/perplexity-fetcher.cjs');
      const data = await searchFinancialContext(entities.ticker, 'technical');
      return { ...data, intent, ticker: entities.ticker };
    }

    case 'NEWS': {
      const { getStockNews } = require('./data-fetchers/stock-data-fetcher.cjs');
      const data = await getStockNews(entities.ticker, 2);
      return { ...data, intent, ticker: entities.ticker };
    }

    case 'COMPREHENSIVE_ANALYSIS': {
      const { getStockAnalysisData } = require('./data-fetchers/stock-data-fetcher.cjs');
      const data = await getStockAnalysisData(entities.ticker, 'complete');
      return { ...data, intent, ticker: entities.ticker };
    }

    case 'COMPARATIVE_ANALYSIS': {
      const { getStockPrice } = require('./data-fetchers/stock-data-fetcher.cjs');
      const [data1, data2] = await Promise.all([
        getStockPrice(entities.ticker1),
        getStockPrice(entities.ticker2),
      ]);
      return { ticker1: entities.ticker1, data1, ticker2: entities.ticker2, data2, intent, source: data1.source };
    }

    case 'EARNINGS': {
      const { getEarnings } = require('./data-fetchers/stock-data-fetcher.cjs');
      const data = await getEarnings(entities.ticker);
      return { ...data, intent, ticker: entities.ticker };
    }

    case 'RECOMMENDATION': {
      const { getRecommendations } = require('./data-fetchers/stock-data-fetcher.cjs');
      const data = await getRecommendations(entities.ticker);
      return { ...data, intent, ticker: entities.ticker };
    }

    // ========== MARCHÉS (2) ==========
    case 'MARKET_OVERVIEW': {
      const { getMarketOverview } = require('./data-fetchers/market-data-fetcher.cjs');
      const data = await getMarketOverview();
      return { ...data, intent };
    }

    case 'SECTOR_INDUSTRY': {
      const { getSectorPerformance } = require('./data-fetchers/market-data-fetcher.cjs');
      const data = await getSectorPerformance(entities.sector || 'tech');
      return { ...data, intent };
    }

    // ========== ÉCONOMIE (2) ==========
    case 'ECONOMIC_ANALYSIS': {
      const { searchPerplexity } = require('./data-fetchers/perplexity-fetcher.cjs');
      const query = buildEconomicQuery(entities.topic);
      const data = await searchPerplexity(query, { maxTokens: 300 });
      return { ...data, intent, topic: entities.topic };
    }

    case 'POLITICAL_ANALYSIS': {
      const { searchPoliticalImpact } = require('./data-fetchers/perplexity-fetcher.cjs');
      const data = await searchPoliticalImpact(entities.topic || 'politique actuelle');
      return { ...data, intent };
    }

    // ========== STRATÉGIE (3) ==========
    case 'INVESTMENT_STRATEGY': {
      const { searchPerplexity } = require('./data-fetchers/perplexity-fetcher.cjs');
      const data = await searchPerplexity('Stratégie investissement long terme diversifiée. 2 phrases max.', { maxTokens: 250 });
      return { ...data, intent };
    }

    case 'RISK_VOLATILITY': {
      const { searchFinancialContext } = require('./data-fetchers/perplexity-fetcher.cjs');
      const data = await searchFinancialContext(entities.ticker, 'risk');
      return { ...data, intent, ticker: entities.ticker };
    }

    case 'RISK_MANAGEMENT': {
      const { searchPerplexity } = require('./data-fetchers/perplexity-fetcher.cjs');
      const data = await searchPerplexity('Principes gestion de risque portefeuille. 2 phrases.', { maxTokens: 200 });
      return { ...data, intent };
    }

    // ========== VALORISATION (3) ==========
    case 'VALUATION': {
      const { searchFinancialContext } = require('./data-fetchers/perplexity-fetcher.cjs');
      const data = await searchFinancialContext(entities.ticker, 'valuation');
      return { ...data, intent, ticker: entities.ticker };
    }

    case 'STOCK_SCREENING': {
      const { searchPerplexity } = require('./data-fetchers/perplexity-fetcher.cjs');
      const query = `Top 3 actions ${entities.criteria}. Tickers + raisons en 3 phrases max.`;
      const data = await searchPerplexity(query, { maxTokens: 350 });
      return { ...data, intent, criteria: entities.criteria };
    }

    case 'VALUATION_METHODOLOGY': {
      const { searchPerplexity } = require('./data-fetchers/perplexity-fetcher.cjs');
      const data = await searchPerplexity('Méthodologie DCF simplifié. 2 phrases.', { maxTokens: 200 });
      return { ...data, intent };
    }

    // ========== CALCULS (1) ==========
    case 'FINANCIAL_CALCULATION': {
      const { calculateLoan, calculateVariation, calculatePE } = require('./data-fetchers/financial-calculator.cjs');
      let result;
      const type = entities.calculationType;

      if (type === 'loan') result = calculateLoan(entities.amount, entities.rate, entities.years);
      else if (type === 'variation') result = calculateVariation(entities.from, entities.to);
      else if (type === 'ratio') result = calculatePE(entities.price, entities.earnings);
      else throw new Error(`Type calcul inconnu: ${type}`);

      return { result, calculationType: type, intent, source: 'Calculatrice' };
    }

    // ========== ASSETS (2) ==========
    case 'FOREX_ANALYSIS': {
      const { getForexRate } = require('./data-fetchers/forex-fetcher.cjs');
      const data = await getForexRate(entities.pair || 'USD/EUR');
      return { ...data, intent };
    }

    case 'BOND_ANALYSIS': {
      const { getTreasuryYield } = require('./data-fetchers/bond-fetcher.cjs');
      const data = await getTreasuryYield('10Y');
      return { ...data, intent };
    }

    // ========== ESG (1) ==========
    case 'ESG': {
      const { getESGScore } = require('./data-fetchers/esg-fetcher.cjs');
      const data = await getESGScore(entities.ticker);
      return { ...data, intent, ticker: entities.ticker };
    }

    // ========== LEGACY (2) ==========
    case 'SOURCES':
      return { intent: 'SOURCES', previousSources: context.previousSources || [] };

    case 'AIDE':
      return { intent: 'AIDE', helpText: buildDetailedHelp(), source: 'System' };

    default:
      throw new Error(`Intent non supporté: ${intent}`);
  }
}

/**
 * Formate la réponse (délègue au formatter si besoin)
 */
async function formatResponse(sourceData, intent, context) {
  // Cas spéciaux: réponses prédéfinies (pas besoin de LLM)
  const directResponses = ['GREETING', 'HELP', 'GENERAL_CONVERSATION', 'SOURCES', 'AIDE'];

  if (directResponses.includes(intent)) {
    return {
      text: sourceData.response || sourceData.helpText || buildSourcesList(sourceData.previousSources),
      truncated: false,
    };
  }

  // Autres intents: utiliser LLM formatter COMPLET
  try {
    const { formatForSMS } = require('./llm-formatter-complete.cjs');
    return await formatForSMS(sourceData, intent, context);
  } catch (err) {
    console.error('[Orchestrator] Formatter error:', err);
    // Fallback: réponse simple
    return {
      text: buildFallbackResponse(sourceData, intent),
      truncated: false,
    };
  }
}

/**
 * Helpers
 */
function buildEconomicQuery(topic) {
  const queries = {
    inflation: 'Taux inflation US actuel. Valeur + tendance en 1-2 phrases.',
    interest_rates: 'Taux directeur Fed actuel. Valeur + dernière décision en 1-2 phrases.',
    gdp: 'Croissance PIB US récente. % + tendance en 1-2 phrases.',
    employment: 'Taux chômage US actuel. % + évolution en 1-2 phrases.',
    general: 'Situation économique US actuelle. Résumé en 2 phrases.',
  };
  return queries[topic] || queries.general;
}

async function fetchPortfolioData(context) {
  // TODO: Intégrer avec Supabase watchlist
  return {
    intent: 'PORTFOLIO',
    tickers: ['AAPL', 'MSFT', 'GOOGL'],
    performance: '+5.2',
    source: 'Watchlist',
  };
}

function buildDetailedHelp() {
  return `Commandes Emma SMS:

ACTIONS:
• Prix AAPL - Prix simple
• Fondamentaux AAPL - Ratios financiers
• News AAPL - Actualités
• Analyse AAPL - Analyse complète
• Résultats AAPL - Earnings

MARCHÉS:
• Marchés - Vue indices
• Portefeuille - Vos tickers

ÉCONOMIE:
• Inflation US - Données macro
• Taux Fed - Taux directeur

CALCULS:
• Calcul prêt 300k 25 ans 4.9%

Plus d'infos: gobapps.com`;
}

function buildSourcesList(sources) {
  if (!sources || sources.length === 0) {
    return "Aucune source pour le message précédent.";
  }
  return `Sources:\n${sources.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
}

function buildFallbackResponse(sourceData, intent) {
  if (sourceData.summary) {
    return `${sourceData.summary}\n\nSource: ${sourceData.source || 'API'}`;
  }
  return `Réponse pour ${intent}. Données disponibles.\n\nSource: ${sourceData.source || 'API'}`;
}

function buildErrorResponse(err, intent) {
  const errorMessages = {
    STOCK_PRICE: "Prix indisponible. Réessayez plus tard.",
    FUNDAMENTALS: "Données fondamentales indisponibles.",
    NEWS: "Actualités indisponibles.",
    MARKET_OVERVIEW: "Vue marchés indisponible.",
    ECONOMIC_ANALYSIS: "Données économiques indisponibles.",
    PORTFOLIO: "Portefeuille indisponible.",
  };
  return errorMessages[intent] || "Erreur système. Réessayez plus tard.";
}

module.exports = {
  processSMS,
};
