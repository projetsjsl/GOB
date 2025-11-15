/**
 * SMS Intent Detector - VERSION COMPLÈTE (26 Intents)
 *
 * Détection STRICTE d'intention basée sur mots-clés et regex.
 * Évite l'utilisation du LLM pour la détection (performances et coût).
 *
 * INTENTS SUPPORTÉS (26):
 *
 * BASE (4): GREETING, HELP, PORTFOLIO, GENERAL_CONVERSATION
 * ACTIONS (8): STOCK_PRICE, FUNDAMENTALS, TECHNICAL_ANALYSIS, NEWS,
 *              COMPREHENSIVE_ANALYSIS, COMPARATIVE_ANALYSIS, EARNINGS, RECOMMENDATION
 * MARCHÉS (2): MARKET_OVERVIEW, SECTOR_INDUSTRY
 * ÉCONOMIE (1): ECONOMIC_ANALYSIS
 * STRATÉGIE (3): INVESTMENT_STRATEGY, RISK_VOLATILITY, RISK_MANAGEMENT
 * VALORISATION (3): VALUATION, STOCK_SCREENING, VALUATION_METHODOLOGY
 * CALCULS (1): FINANCIAL_CALCULATION
 * ASSETS (2): FOREX_ANALYSIS, BOND_ANALYSIS
 * ESG (1): ESG
 * POLITIQUE (1): POLITICAL_ANALYSIS
 * UTILS (2): SOURCES, AIDE (legacy)
 */

// Priorités d'intent (pour disambiguation)
const INTENT_PRIORITY = {
  // Priorité HAUTE (3)
  GREETING: 3,
  HELP: 3,
  SKILLS_LIST: 3,
  PORTFOLIO: 3,
  STOCK_PRICE: 3,
  FUNDAMENTALS: 3,
  TECHNICAL_ANALYSIS: 3,
  NEWS: 3,
  COMPREHENSIVE_ANALYSIS: 3,
  EARNINGS: 3,
  MARKET_OVERVIEW: 3,
  ECONOMIC_ANALYSIS: 3,
  STOCK_SCREENING: 3,
  FINANCIAL_CALCULATION: 3,
  SOURCES: 3,
  AIDE: 3,

  // Priorité MOYENNE (2)
  GENERAL_CONVERSATION: 2,
  COMPARATIVE_ANALYSIS: 2,
  RECOMMENDATION: 2,
  SECTOR_INDUSTRY: 2,
  INVESTMENT_STRATEGY: 2,
  RISK_VOLATILITY: 2,
  VALUATION: 2,
  FOREX_ANALYSIS: 2,

  // Priorité BASSE (1)
  POLITICAL_ANALYSIS: 1,
  BOND_ANALYSIS: 1,
  ESG: 1,
  RISK_MANAGEMENT: 1,
  VALUATION_METHODOLOGY: 1,
};

// Expressions régulières pour chaque intent
const INTENT_PATTERNS = {
  // ========================================
  // CATÉGORIE: BASE (4 intents)
  // ========================================

  GREETING: {
    patterns: [
      /^(bonjour|salut|hello|hi|hey|bonsoir|coucou|good morning)/i,
      /^(ça va|comment ça va|how are you)/i,
    ],
    extractors: {},
    priority: 3,
  },

  HELP: {
    patterns: [
      /^(aide|help|commandes?|menu|fonctionnalités?)/i,
      /^(que peux-tu faire|à quoi sers-tu|capabilities|skills)/i,
      /^\?+$/,
    ],
    extractors: {},
    priority: 3,
  },

  SKILLS_LIST: {
    patterns: [
      /^(liste|exemples|examples|tutorial)/i,
      /^(liste (des )?(commandes|compétences|skills))/i,
      /^(affiche|montre|show) (exemples|examples)/i,
    ],
    extractors: {},
    priority: 3,
  },

  PORTFOLIO: {
    patterns: [
      /^(portefeuille|portfolio|watchlist|positions)/i,
      /^(mes (tickers|titres|actions|valeurs|investissements))/i,
      /^(liste mes|affiche mes|show my) (tickers|positions)/i,
      /^(quels? (tickers|titres|actions))/i,
    ],
    extractors: {},
    priority: 3,
  },

  GENERAL_CONVERSATION: {
    patterns: [
      /^(merci|thanks|thx)/i,
      /^(d'accord|ok|okay|got it)/i,
      /^(au revoir|bye|goodbye)/i,
    ],
    extractors: {},
    priority: 2,
  },

  // ========================================
  // CATÉGORIE: ACTIONS (8 intents)
  // ========================================

  STOCK_PRICE: {
    patterns: [
      /^(prix|cours|cotation|quote)\s+(?<ticker>[A-Z]{1,5})$/i,
      /^(?<ticker>[A-Z]{1,5})\s+(prix|cours|quote)$/i,
      /^(combien vaut|combien coûte)\s+(?<ticker>[A-Z]{1,5})/i,
    ],
    extractors: {
      ticker: (match) => match.groups?.ticker?.toUpperCase() || null,
    },
    priority: 3,
  },

  FUNDAMENTALS: {
    patterns: [
      /^(fondamentaux|financials|fundamentals)\s+(?<ticker>[A-Z]{1,5})/i,
      /^(?<ticker>[A-Z]{1,5})\s+(fondamentaux|financials)/i,
      /^(pe|p\/e|roe|eps|marges?|revenus|bénéfices)\s+(?<ticker>[A-Z]{1,5})/i,
      /^(santé financière|profitabilité|rentabilité)\s+(?<ticker>[A-Z]{1,5})/i,
    ],
    extractors: {
      ticker: (match) => match.groups?.ticker?.toUpperCase() || null,
    },
    priority: 3,
  },

  TECHNICAL_ANALYSIS: {
    patterns: [
      /^(technique|technical|rsi|macd|support|résistance)\s+(?<ticker>[A-Z]{1,5})/i,
      /^(?<ticker>[A-Z]{1,5})\s+(technique|rsi|macd)/i,
      /^(moyennes mobiles|sma|ema|bollinger)\s+(?<ticker>[A-Z]{1,5})/i,
      /^(tendance|trend|momentum)\s+(?<ticker>[A-Z]{1,5})/i,
    ],
    extractors: {
      ticker: (match) => match.groups?.ticker?.toUpperCase() || null,
    },
    priority: 3,
  },

  NEWS: {
    patterns: [
      /^(news|nouvelles|actualités?|infos?)\s+(?<ticker>[A-Z]{1,5})/i,
      /^(?<ticker>[A-Z]{1,5})\s+(news|nouvelles|actualités)/i,
      /^(quoi de neuf|dernières? infos?|breaking)\s+(sur\s+)?(?<ticker>[A-Z]{1,5})/i,
    ],
    extractors: {
      ticker: (match) => match.groups?.ticker?.toUpperCase() || null,
    },
    priority: 3,
  },

  COMPREHENSIVE_ANALYSIS: {
    patterns: [
      /^(analyse complète?|analyse détaillée|rapport)\s+(?<ticker>[A-Z]{1,5})/i,
      /^(évaluation|assessment|overview)\s+(?<ticker>[A-Z]{1,5})/i,
      /^(due diligence|deep dive)\s+(?<ticker>[A-Z]{1,5})/i,
    ],
    extractors: {
      ticker: (match) => match.groups?.ticker?.toUpperCase() || null,
    },
    priority: 3,
  },

  COMPARATIVE_ANALYSIS: {
    patterns: [
      /^(comparer|comparaison|compare)\s+(?<ticker1>[A-Z]{1,5})\s+(vs|versus|et|and)\s+(?<ticker2>[A-Z]{1,5})/i,
      /^(?<ticker1>[A-Z]{1,5})\s+(vs|versus)\s+(?<ticker2>[A-Z]{1,5})/i,
      /^(mieux|meilleur|plutôt)\s+(?<ticker1>[A-Z]{1,5})\s+ou\s+(?<ticker2>[A-Z]{1,5})/i,
    ],
    extractors: {
      ticker1: (match) => match.groups?.ticker1?.toUpperCase() || null,
      ticker2: (match) => match.groups?.ticker2?.toUpperCase() || null,
    },
    priority: 2,
  },

  EARNINGS: {
    patterns: [
      /^(résultats?|earnings|trimestriels?)\s+(?<ticker>[A-Z]{1,5})/i,
      /^(?<ticker>[A-Z]{1,5})\s+(résultats?|earnings|q[1-4])/i,
      /^(earnings call|publication)\s+(?<ticker>[A-Z]{1,5})/i,
    ],
    extractors: {
      ticker: (match) => match.groups?.ticker?.toUpperCase() || null,
    },
    priority: 3,
  },

  RECOMMENDATION: {
    patterns: [
      /^(recommandation|avis|conseil)\s+(sur\s+)?(?<ticker>[A-Z]{1,5})/i,
      /^(acheter|vendre|conserver)\s+(?<ticker>[A-Z]{1,5})/i,
      /^(dois-je acheter|est-ce un bon moment)\s+(?<ticker>[A-Z]{1,5})/i,
    ],
    extractors: {
      ticker: (match) => match.groups?.ticker?.toUpperCase() || null,
    },
    priority: 2,
  },

  // ========================================
  // CATÉGORIE: MARCHÉS (2 intents)
  // ========================================

  MARKET_OVERVIEW: {
    patterns: [
      /^(marché|marchés|market|indices|secteurs)/i,
      /^(wall street|dow jones|nasdaq|sp500|s&p|tsx)/i,
      /^(sentiment marché|état du marché|vue globale)/i,
    ],
    extractors: {},
    priority: 3,
  },

  SECTOR_INDUSTRY: {
    patterns: [
      /^(secteur|industrie|sector)\s+(?<sector>tech|technologie|finance|énergie|santé|healthcare)/i,
      /^(performance secteur|secteur\s+\w+)/i,
    ],
    extractors: {
      sector: (match) => match.groups?.sector?.toLowerCase() || null,
    },
    priority: 2,
  },

  // ========================================
  // CATÉGORIE: ÉCONOMIE & POLITIQUE (2 intents)
  // ========================================

  ECONOMIC_ANALYSIS: {
    patterns: [
      /^(économie|economie|pib|gdp|inflation|récession)/i,
      /^(taux\s+(fed|directeur|intérêt|banque centrale))/i,
      /^(chômage|chomage|emploi|croissance économique)/i,
      /^(politique monétaire|fiscal|déficit)/i,
    ],
    extractors: {
      topic: (match) => {
        const text = match[0].toLowerCase();
        if (text.includes('inflation')) return 'inflation';
        if (text.includes('taux')) return 'interest_rates';
        if (text.includes('pib') || text.includes('gdp')) return 'gdp';
        if (text.includes('chômage') || text.includes('emploi')) return 'employment';
        return 'general';
      },
    },
    priority: 3,
  },

  POLITICAL_ANALYSIS: {
    patterns: [
      /^(politique|géopolitique|élections|gouvernement)/i,
      /^(tensions|sanctions|guerre commerciale)/i,
    ],
    extractors: {},
    priority: 1,
  },

  // ========================================
  // CATÉGORIE: STRATÉGIE (3 intents)
  // ========================================

  INVESTMENT_STRATEGY: {
    patterns: [
      /^(stratégie|investir|allocation|placement)/i,
      /^(long terme|court terme|value|growth|dividend)/i,
      /^(comment investir|où investir)/i,
    ],
    extractors: {},
    priority: 2,
  },

  RISK_VOLATILITY: {
    patterns: [
      /^(risque|volatilité|beta|drawdown)\s+(?<ticker>[A-Z]{1,5})/i,
      /^(?<ticker>[A-Z]{1,5})\s+(risque|volatilité|beta)/i,
    ],
    extractors: {
      ticker: (match) => match.groups?.ticker?.toUpperCase() || null,
    },
    priority: 2,
  },

  RISK_MANAGEMENT: {
    patterns: [
      /^(gestion (de )?risque|risk management|var|sharpe)/i,
      /^(protection|couverture|hedging)/i,
    ],
    extractors: {},
    priority: 1,
  },

  // ========================================
  // CATÉGORIE: VALORISATION (3 intents)
  // ========================================

  VALUATION: {
    patterns: [
      /^(valorisation|valuation|fair value|juste valeur)\s+(?<ticker>[A-Z]{1,5})/i,
      /^(?<ticker>[A-Z]{1,5})\s+(valorisation|dcf|valuation)/i,
      /^(sous-évalué|surévalué|undervalued|overvalued)\s+(?<ticker>[A-Z]{1,5})/i,
    ],
    extractors: {
      ticker: (match) => match.groups?.ticker?.toUpperCase() || null,
    },
    priority: 2,
  },

  STOCK_SCREENING: {
    patterns: [
      /^(trouve|cherche|recherche|suggère|recommande)\s+(?<criteria>.*)/i,
      /^(top|meilleurs?|meilleures?)\s+(?<criteria>dividende|croissance|value|momentum)/i,
      /^(screening|screener|filtre|sélection)/i,
    ],
    extractors: {
      criteria: (match) => match.groups?.criteria || 'general',
    },
    priority: 3,
  },

  VALUATION_METHODOLOGY: {
    patterns: [
      /^(méthodologie|methodology|dcf|multiples)/i,
      /^(comment valoriser|comment calculer)/i,
    ],
    extractors: {},
    priority: 1,
  },

  // ========================================
  // CATÉGORIE: CALCULS (1 intent)
  // ========================================

  FINANCIAL_CALCULATION: {
    patterns: [
      /^(calcul|calculate)\s+(prêt|pret|loan|mortgage)\s+(?<amount>[\d.]+)\s*k?\s+(?<years>\d+)\s*(ans|years?)\s+(?<rate>[\d.]+)\s*%?/i,
      /^(variation|change)\s*%?\s+(?<from>[\d.]+)\s+(?<to>[\d.]+)/i,
      /^(ratio|pe|p\/e)\s+(?<price>[\d.]+)\s+(?<earnings>[\d.]+)/i,
      /^(simulation|projection|scénario)/i,
    ],
    extractors: {
      calculationType: (match) => {
        const text = match[0].toLowerCase();
        if (text.includes('prêt') || text.includes('pret') || text.includes('loan')) return 'loan';
        if (text.includes('variation') || text.includes('change')) return 'variation';
        if (text.includes('ratio') || text.includes('p/e')) return 'ratio';
        return 'general';
      },
      amount: (match) => {
        const amount = match.groups?.amount;
        return amount ? parseFloat(amount) * 1000 : null;
      },
      years: (match) => match.groups?.years ? parseInt(match.groups.years) : null,
      rate: (match) => match.groups?.rate ? parseFloat(match.groups.rate) : null,
      from: (match) => match.groups?.from ? parseFloat(match.groups.from) : null,
      to: (match) => match.groups?.to ? parseFloat(match.groups.to) : null,
      price: (match) => match.groups?.price ? parseFloat(match.groups.price) : null,
      earnings: (match) => match.groups?.earnings ? parseFloat(match.groups.earnings) : null,
    },
    priority: 3,
  },

  // ========================================
  // CATÉGORIE: ASSETS ALTERNATIFS (2 intents)
  // ========================================

  FOREX_ANALYSIS: {
    patterns: [
      /^(forex|fx|devise|devises|taux de change)/i,
      /^(usd|eur|gbp|jpy|cad|chf)\s*\/?\s*(usd|eur|gbp|jpy|cad|chf)/i,
      /^(dollar|euro|livre|yen|franc)/i,
    ],
    extractors: {
      pair: (match) => {
        const text = match[0].toUpperCase();
        const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'CHF'];
        const found = currencies.filter(cur => text.includes(cur));
        return found.length === 2 ? `${found[0]}/${found[1]}` : null;
      },
    },
    priority: 2,
  },

  BOND_ANALYSIS: {
    patterns: [
      /^(obligations?|bonds?|treasury|yield)/i,
      /^(taux obligataire|rendement obligataire)/i,
      /^(us 10y|us 2y|bund)/i,
    ],
    extractors: {},
    priority: 1,
  },

  // ========================================
  // CATÉGORIE: ESG (1 intent)
  // ========================================

  ESG: {
    patterns: [
      /^(esg|durabilité|sustainability|responsabilité sociale)/i,
      /^(climat|carbon|green|vert|environnement)\s+(?<ticker>[A-Z]{1,5})/i,
      /^(?<ticker>[A-Z]{1,5})\s+(esg|durabilité|climat)/i,
    ],
    extractors: {
      ticker: (match) => match.groups?.ticker?.toUpperCase() || null,
    },
    priority: 1,
  },

  // ========================================
  // CATÉGORIE: LEGACY (2 intents - pour compatibilité)
  // ========================================

  SOURCES: {
    patterns: [
      /^(source|sources)\s*\??$/i,
      /^(d'où|d ou|provenance|origine)\s+(viennent?|vient)\s+/i,
      /^(quelle|quelles)\s+(est la |sont les )?source/i,
    ],
    extractors: {},
    priority: 3,
  },

  AIDE: {
    patterns: [
      /^(aide|help|menu|commandes?)\s*\??$/i,
      /^\?+$/,
    ],
    extractors: {},
    priority: 3,
  },
};

// Messages de clarification par intent
const CLARIFICATION_MESSAGES = {
  STOCK_PRICE: {
    missingTicker: "Quel ticker ? (ex: Prix AAPL)",
  },
  FUNDAMENTALS: {
    missingTicker: "Fondamentaux de quel ticker ? (ex: Fondamentaux AAPL)",
  },
  TECHNICAL_ANALYSIS: {
    missingTicker: "Analyse technique de quel ticker ? (ex: RSI AAPL)",
  },
  NEWS: {
    missingTicker: "Nouvelles de quel ticker ? (ex: News AAPL)",
  },
  COMPREHENSIVE_ANALYSIS: {
    missingTicker: "Analyse complète de quel ticker ? (ex: Analyse complète AAPL)",
  },
  COMPARATIVE_ANALYSIS: {
    missingTickers: "Comparer quels tickers ? (ex: AAPL vs MSFT)",
  },
  EARNINGS: {
    missingTicker: "Résultats de quel ticker ? (ex: Résultats AAPL)",
  },
  RECOMMENDATION: {
    missingTicker: "Recommandation pour quel ticker ? (ex: Acheter AAPL ?)",
  },
  RISK_VOLATILITY: {
    missingTicker: "Risque de quel ticker ? (ex: Risque AAPL)",
  },
  VALUATION: {
    missingTicker: "Valorisation de quel ticker ? (ex: Fair value AAPL)",
  },
  STOCK_SCREENING: {
    missingCriteria: "Quels critères ? (ex: Top croissance, Meilleurs dividendes)",
  },
  FOREX_ANALYSIS: {
    missingPair: "Quelle paire de devises ? (ex: USD/EUR)",
  },
  ESG: {
    missingTicker: "ESG de quel ticker ? (ex: ESG AAPL)",
  },
  FINANCIAL_CALCULATION: {
    missingParams: "Paramètres manquants. Exemples:\n- Prêt: Calcul prêt 300k 25 ans 4.9%\n- Variation: Variation % 120 145",
  },
};

/**
 * Détecte l'intention d'un message SMS (26 intents)
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

  // Tester chaque intent par ordre de priorité (3 → 2 → 1)
  const intentKeys = Object.keys(INTENT_PATTERNS).sort((a, b) => {
    const priorityA = INTENT_PRIORITY[a] || 0;
    const priorityB = INTENT_PRIORITY[b] || 0;
    return priorityB - priorityA; // Ordre décroissant
  });

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
          priority: INTENT_PRIORITY[intentKey] || 1,
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
 */
function validateEntities(intent, entities) {
  const tickerIntents = [
    'STOCK_PRICE', 'FUNDAMENTALS', 'TECHNICAL_ANALYSIS', 'NEWS',
    'COMPREHENSIVE_ANALYSIS', 'EARNINGS', 'RECOMMENDATION',
    'RISK_VOLATILITY', 'VALUATION', 'ESG'
  ];

  if (tickerIntents.includes(intent)) {
    if (!entities.ticker) {
      const clarificationKey = intent.toLowerCase().replace(/_/g, '');
      const message = CLARIFICATION_MESSAGES[intent]?.missingTicker || `Ticker manquant pour ${intent}`;
      return { valid: false, message };
    }
    if (!isValidTicker(entities.ticker)) {
      return { valid: false, message: `Ticker "${entities.ticker}" invalide. Format: 1-5 lettres majuscules.` };
    }
  }

  if (intent === 'COMPARATIVE_ANALYSIS') {
    if (!entities.ticker1 || !entities.ticker2) {
      return { valid: false, message: CLARIFICATION_MESSAGES.COMPARATIVE_ANALYSIS.missingTickers };
    }
  }

  if (intent === 'STOCK_SCREENING' && !entities.criteria) {
    return { valid: false, message: CLARIFICATION_MESSAGES.STOCK_SCREENING.missingCriteria };
  }

  if (intent === 'FINANCIAL_CALCULATION') {
    const type = entities.calculationType;
    if (type === 'loan' && (!entities.amount || !entities.years || !entities.rate)) {
      return { valid: false, message: CLARIFICATION_MESSAGES.FINANCIAL_CALCULATION.missingParams };
    }
    if (type === 'variation' && (!entities.from || !entities.to)) {
      return { valid: false, message: CLARIFICATION_MESSAGES.FINANCIAL_CALCULATION.missingParams };
    }
  }

  return { valid: true };
}

/**
 * Valide un ticker (1-5 lettres majuscules)
 */
function isValidTicker(ticker) {
  return /^[A-Z]{1,5}$/.test(ticker);
}

/**
 * Construit le message d'aide (version condensée pour SMS)
 */
function buildHelpMessage() {
  return `Commandes Emma SMS:
• Prix X (ex: Prix AAPL)
• Analyse X (ex: Analyse AAPL)
• Fondamentaux X
• News X
• Marchés / Indices
• Portefeuille
• Aide détaillée`;
}

module.exports = {
  detectIntent,
  validateEntities,
  isValidTicker,
  buildHelpMessage,
  INTENT_PATTERNS,
  INTENT_PRIORITY,
};

// Test si lancé directement
if (require.main === module) {
  console.log('\n=== SMS Intent Detector - 26 Intents ===\n');
  console.log(`Total intents supportés: ${Object.keys(INTENT_PATTERNS).length}`);
  console.log(`Priorité haute: ${Object.values(INTENT_PRIORITY).filter(p => p === 3).length}`);
  console.log(`Priorité moyenne: ${Object.values(INTENT_PRIORITY).filter(p => p === 2).length}`);
  console.log(`Priorité basse: ${Object.values(INTENT_PRIORITY).filter(p => p === 1).length}\n`);
}
