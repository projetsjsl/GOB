/**
 * SMS Intent Detector
 *
 * Détection STRICTE d'intention basée sur mots-clés et regex.
 * Évite l'utilisation du LLM pour la détection (performances et coût).
 *
 * Intents supportés:
 * - ANALYSE: "Analyse AAPL", "Analyse courte BTC"
 * - DONNEES: "Prix AAPL", "Taux Fed", "Inflation US"
 * - RESUME: "Résumé Perplexity: dette Canada"
 * - CALCUL: "Calcul prêt 300k 25 ans 4.9%"
 * - SOURCES: "Source ?", "Sources?"
 * - AIDE: "Aide", "Menu", "Commandes"
 */

// Expressions régulières pour chaque intent
const INTENT_PATTERNS = {
  // Intent: ANALYSE
  // Exemples: "Analyse AAPL", "Analyser BTC", "Analyse courte TSLA"
  ANALYSE: {
    patterns: [
      /^(analyse|analyser|analysis)\s+(?<modifier>court|courte|rapide|complète?|détaillée?)?\s*(?<ticker>[A-Z]{1,5})/i,
      /^(?<ticker>[A-Z]{1,5})\s+(analyse|analysis)/i,
      /^(que penses-tu|opinion|avis)\s+(de\s+|sur\s+)?(?<ticker>[A-Z]{1,5})/i,
    ],
    extractors: {
      ticker: (match) => match.groups?.ticker?.toUpperCase() || null,
      modifier: (match) => match.groups?.modifier?.toLowerCase() || 'complete',
    },
  },

  // Intent: DONNEES
  // Exemples: "Prix AAPL", "Taux Fed", "Inflation US", "Volume BTC"
  DONNEES: {
    patterns: [
      /^(prix|price|cours)\s+(?<ticker>[A-Z]{1,5})/i,
      /^(?<ticker>[A-Z]{1,5})\s+(prix|price)/i,
      /^(taux|rate|rates)\s+(?<type>fed|boc|ecb|inflation|chômage|unemployment)/i,
      /^(inflation|unemployment|gdp|pib)\s*(?<region>us|usa|ca|canada|eu|europe)?/i,
      /^(volume|volatilité|volatility)\s+(?<ticker>[A-Z]{1,5})/i,
    ],
    extractors: {
      ticker: (match) => match.groups?.ticker?.toUpperCase() || null,
      dataType: (match) => {
        const text = match[0].toLowerCase();
        if (text.includes('prix') || text.includes('price')) return 'price';
        if (text.includes('taux') || text.includes('rate')) return 'rate';
        if (text.includes('inflation')) return 'inflation';
        if (text.includes('chômage') || text.includes('unemployment')) return 'unemployment';
        if (text.includes('volume')) return 'volume';
        if (text.includes('volatilité') || text.includes('volatility')) return 'volatility';
        return 'unknown';
      },
      type: (match) => match.groups?.type || null,
      region: (match) => match.groups?.region?.toUpperCase() || 'US',
    },
  },

  // Intent: RESUME
  // Exemples: "Résumé Perplexity: dette Canada", "Résumé: impact IA"
  RESUME: {
    patterns: [
      /^(résumé|resume|summary|recherche)\s*:?\s*(?<query>.+)/i,
      /^(perplexity|search|rechercher)\s*:?\s*(?<query>.+)/i,
      /^(explique|explain|c'est quoi)\s+(?<query>.+)/i,
    ],
    extractors: {
      query: (match) => match.groups?.query?.trim() || null,
    },
  },

  // Intent: CALCUL
  // Exemples: "Calcul prêt 300k 25 ans 4.9%", "Variation % 120 145"
  CALCUL: {
    patterns: [
      /^(calcul|calculate)\s+(prêt|pret|loan|mortgage)\s+(?<amount>[\d.]+)\s*k?\s+(?<years>\d+)\s*(ans|years?)\s+(?<rate>[\d.]+)\s*%?/i,
      /^(variation|change)\s*%?\s+(?<from>[\d.]+)\s+(?<to>[\d.]+)/i,
      /^(ratio|pe|p\/e)\s+(?<price>[\d.]+)\s+(?<earnings>[\d.]+)/i,
    ],
    extractors: {
      calculationType: (match) => {
        const text = match[0].toLowerCase();
        if (text.includes('prêt') || text.includes('pret') || text.includes('loan')) return 'loan';
        if (text.includes('variation') || text.includes('change')) return 'variation';
        if (text.includes('ratio') || text.includes('p/e')) return 'ratio';
        return 'unknown';
      },
      amount: (match) => {
        const amount = match.groups?.amount;
        return amount ? parseFloat(amount) * 1000 : null; // k = 1000
      },
      years: (match) => match.groups?.years ? parseInt(match.groups.years) : null,
      rate: (match) => match.groups?.rate ? parseFloat(match.groups.rate) : null,
      from: (match) => match.groups?.from ? parseFloat(match.groups.from) : null,
      to: (match) => match.groups?.to ? parseFloat(match.groups.to) : null,
      price: (match) => match.groups?.price ? parseFloat(match.groups.price) : null,
      earnings: (match) => match.groups?.earnings ? parseFloat(match.groups.earnings) : null,
    },
  },

  // Intent: SOURCES
  // Exemples: "Source ?", "Sources?", "D'où viennent ces données?"
  SOURCES: {
    patterns: [
      /^(source|sources)\s*\??$/i,
      /^(d'où|d ou|provenance|origine)\s+(viennent?|vient)\s+/i,
      /^(quelle|quelles)\s+(est la |sont les )?source/i,
    ],
    extractors: {},
  },

  // Intent: AIDE
  // Exemples: "Aide", "Menu", "Commandes", "Help", "?"
  AIDE: {
    patterns: [
      /^(aide|help|menu|commandes?|commands?)\s*\??$/i,
      /^\?+$/,
      /^(comment|how)\s+(ça marche|does it work)/i,
    ],
    extractors: {},
  },
};

// Messages de clarification par intent
const CLARIFICATION_MESSAGES = {
  ANALYSE: {
    missingTicker: "Quel ticker voulez-vous analyser ? (ex: Analyse AAPL)",
    invalidTicker: (ticker) => `Ticker "${ticker}" invalide. Format: 1-5 lettres majuscules (ex: AAPL, BTC).`,
  },
  DONNEES: {
    missingTicker: "Quel ticker ? (ex: Prix AAPL)",
    missingType: "Quel type de donnée ? (ex: Prix, Taux, Inflation)",
  },
  RESUME: {
    missingQuery: "Que voulez-vous rechercher ? (ex: Résumé: dette Canada)",
  },
  CALCUL: {
    missingParams: "Paramètres manquants. Exemples:\n- Prêt: Calcul prêt 300k 25 ans 4.9%\n- Variation: Variation % 120 145",
  },
};

/**
 * Détecte l'intention d'un message SMS
 * @param {string} message - Message SMS brut
 * @param {Object} context - Contexte conversation (optionnel)
 * @returns {Object} { intent, entities, confidence, needsClarification }
 */
function detectIntent(message, context = {}) {
  // Normaliser le message
  const normalized = message.trim();

  if (!normalized) {
    return {
      intent: 'UNKNOWN',
      entities: {},
      confidence: 0,
      needsClarification: true,
      clarification: "Message vide. Envoyez 'Aide' pour voir les commandes.",
    };
  }

  // Tester chaque intent dans l'ordre de priorité
  const intentKeys = Object.keys(INTENT_PATTERNS);

  for (const intentKey of intentKeys) {
    const { patterns, extractors } = INTENT_PATTERNS[intentKey];

    for (const pattern of patterns) {
      const match = normalized.match(pattern);

      if (match) {
        // Intent trouvé ! Extraire les entités
        const entities = {};
        let confidence = 1.0;

        for (const [key, extractor] of Object.entries(extractors)) {
          try {
            entities[key] = extractor(match);
          } catch (err) {
            console.warn(`[Intent Detector] Extraction error for ${key}:`, err.message);
            entities[key] = null;
          }
        }

        // Valider les entités requises
        const validation = validateEntities(intentKey, entities);

        if (!validation.valid) {
          return {
            intent: intentKey,
            entities,
            confidence: 0.5, // Confiance réduite si entités manquantes
            needsClarification: true,
            clarification: validation.message,
          };
        }

        return {
          intent: intentKey,
          entities,
          confidence,
          needsClarification: false,
          clarification: null,
        };
      }
    }
  }

  // Aucun intent détecté
  return {
    intent: 'UNKNOWN',
    entities: {},
    confidence: 0,
    needsClarification: true,
    clarification: buildHelpMessage(),
  };
}

/**
 * Valide les entités extraites pour un intent
 * @param {string} intent - Intent détecté
 * @param {Object} entities - Entités extraites
 * @returns {Object} { valid, message }
 */
function validateEntities(intent, entities) {
  switch (intent) {
    case 'ANALYSE':
      if (!entities.ticker) {
        return { valid: false, message: CLARIFICATION_MESSAGES.ANALYSE.missingTicker };
      }
      if (!isValidTicker(entities.ticker)) {
        return { valid: false, message: CLARIFICATION_MESSAGES.ANALYSE.invalidTicker(entities.ticker) };
      }
      return { valid: true };

    case 'DONNEES':
      if (!entities.ticker && !entities.type) {
        return { valid: false, message: CLARIFICATION_MESSAGES.DONNEES.missingTicker };
      }
      if (entities.ticker && !isValidTicker(entities.ticker)) {
        return { valid: false, message: CLARIFICATION_MESSAGES.ANALYSE.invalidTicker(entities.ticker) };
      }
      return { valid: true };

    case 'RESUME':
      if (!entities.query || entities.query.length < 3) {
        return { valid: false, message: CLARIFICATION_MESSAGES.RESUME.missingQuery };
      }
      return { valid: true };

    case 'CALCUL':
      // Validation spécifique selon le type de calcul
      const type = entities.calculationType;
      if (type === 'loan' && (!entities.amount || !entities.years || !entities.rate)) {
        return { valid: false, message: CLARIFICATION_MESSAGES.CALCUL.missingParams };
      }
      if (type === 'variation' && (!entities.from || !entities.to)) {
        return { valid: false, message: CLARIFICATION_MESSAGES.CALCUL.missingParams };
      }
      return { valid: true };

    case 'SOURCES':
    case 'AIDE':
      return { valid: true };

    default:
      return { valid: false, message: "Intent inconnu." };
  }
}

/**
 * Valide un ticker (1-5 lettres majuscules)
 * @param {string} ticker
 * @returns {boolean}
 */
function isValidTicker(ticker) {
  return /^[A-Z]{1,5}$/.test(ticker);
}

/**
 * Construit le message d'aide
 * @returns {string}
 */
function buildHelpMessage() {
  return `Formats supportés:
• Analyse X (ex: Analyse AAPL)
• Prix X (ex: Prix BTC)
• Résumé: sujet (ex: Résumé: IA)
• Calcul prêt A B C (ex: Calcul prêt 300k 25 ans 4.9%)
• Source ?
• Aide`;
}

/**
 * Teste le détecteur d'intent avec des exemples
 */
function runTests() {
  const tests = [
    { input: "Analyse AAPL", expected: "ANALYSE" },
    { input: "analyse courte BTC", expected: "ANALYSE" },
    { input: "Prix TSLA", expected: "DONNEES" },
    { input: "Taux Fed", expected: "DONNEES" },
    { input: "Résumé: dette Canada", expected: "RESUME" },
    { input: "Calcul prêt 300k 25 ans 4.9%", expected: "CALCUL" },
    { input: "Variation % 120 145", expected: "CALCUL" },
    { input: "Source ?", expected: "SOURCES" },
    { input: "Aide", expected: "AIDE" },
    { input: "?", expected: "AIDE" },
    { input: "blabla random", expected: "UNKNOWN" },
  ];

  console.log("\n=== SMS Intent Detector Tests ===\n");

  let passed = 0;
  let failed = 0;

  tests.forEach(({ input, expected }) => {
    const result = detectIntent(input);
    const status = result.intent === expected ? '✅' : '❌';

    if (result.intent === expected) {
      passed++;
    } else {
      failed++;
    }

    console.log(`${status} "${input}" → ${result.intent} (expected: ${expected})`);
    if (result.entities && Object.keys(result.entities).length > 0) {
      console.log(`   Entities:`, result.entities);
    }
    if (result.needsClarification) {
      console.log(`   Clarification: ${result.clarification}`);
    }
  });

  console.log(`\n✅ Passed: ${passed}/${tests.length}`);
  console.log(`❌ Failed: ${failed}/${tests.length}\n`);
}

module.exports = {
  detectIntent,
  validateEntities,
  isValidTicker,
  buildHelpMessage,
  runTests,
  INTENT_PATTERNS, // Export pour tests
};

// Exécuter tests si lancé directement
if (require.main === module) {
  runTests();
}
