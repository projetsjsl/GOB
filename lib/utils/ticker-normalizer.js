/**
 * Ticker Normalizer - Normalisation des tickers internationaux
 *
 * Convertit les tickers selon les conventions de chaque bourse:
 * - TSX (Canada): POW → POW.TO, TD → TD.TO
 * - LSE (London): HSBA → HSBA.L
 * - Euronext: AI → AI.PA (Paris), ASML → ASML.AS (Amsterdam)
 * - Tokyo: 7203 → 7203.T
 *
 * Crucial pour obtenir des données en temps réel correctes de FMP/Polygon/Yahoo
 */

/**
 * Liste exhaustive des actions canadiennes majeures (TSX)
 * Source: TSX Composite Index constituents + banques/télécoms/ressources
 */
const CANADIAN_TICKERS = new Set([
  // Banques canadiennes (Big 6)
  'RY', 'TD', 'BNS', 'BMO', 'CM', 'NA',

  // Télécoms
  'BCE', 'T', 'TCOM', 'RCI.A', 'RCI.B', 'QBR.A', 'QBR.B',

  // Énergie & Ressources
  'CNQ', 'SU', 'IMO', 'CVE', 'TRP', 'ENB', 'PPL', 'AQN', 'FTS',
  'ABX', 'GOLD', 'K', 'FM', 'NTR', 'POT', 'CCL.B', 'WPM', 'FNV',

  // Services publics
  'EMA', 'FTS', 'H', 'CU',

  // Industriels & Transport
  'CNR', 'CP', 'CAR', 'AC', 'WJA', 'TFII', 'GIL', 'STC.A',

  // Finance & Assurance
  'MFC', 'SLF', 'GWO', 'IFC', 'POW', 'PWF', 'FFH', 'BN', 'ONEX',

  // Immobilier (REITs)
  'REI.UN', 'AP.UN', 'HR.UN', 'BEI.UN', 'CAR.UN', 'SRU.UN', 'CHP.UN',

  // Technologie
  'SHOP', 'BB', 'OTC', 'LSPD', 'DOO', 'CGI', 'CSU', 'OTEX', 'KXS',

  // Consommation & Détail
  'L', 'ATD', 'MGA', 'QSR', 'DOL', 'EMP.A', 'CTC.A', 'FOOD',

  // Cannabis (secteur unique au Canada)
  'WEED', 'ACB', 'TLRY', 'CRON', 'OGI', 'HEXO',

  // Santé & Pharma
  'GSY', 'CXR', 'MT', 'WELL',

  // Matériaux
  'WFG', 'IFP', 'CFP', 'WEF',

  // Autres constituants TSX Composite
  'AEM', 'APHA', 'AQN', 'ATA', 'AW.UN', 'AX.UN', 'BAM.A', 'BHC',
  'BIP.UN', 'BPY.UN', 'CCO', 'CFX', 'CGX', 'CJT', 'CNQ', 'CPX',
  'CRT.UN', 'CU', 'CWB', 'DGC', 'DSG', 'EIF', 'ERF', 'EXE', 'FEC',
  'FRU', 'FSZ', 'FTT', 'GC', 'GEI', 'GSC', 'HSE', 'IVN', 'KEY',
  'LIF', 'LNR', 'LUN', 'MAG', 'MRE', 'MRU', 'NFI', 'NPI', 'NWC',
  'NXE', 'OSB', 'PBH', 'PD', 'PKI', 'PSI', 'PSK', 'RBA', 'SGY',
  'SJ', 'SMF', 'SMU.UN', 'SPB', 'STN', 'TCL.A', 'TCN', 'TIH',
  'TOY', 'TVE', 'VET', 'VII', 'WCP', 'WN', 'WPK', 'WSP', 'X'
]);

/**
 * Tickers britanniques majeurs (LSE - London Stock Exchange)
 */
const UK_TICKERS = new Set([
  'HSBA', 'BATS', 'DGE', 'ULVR', 'AZN', 'GSK', 'SHEL', 'BP',
  'RIO', 'AAL', 'GLEN', 'LSEG', 'VOD', 'BT.A', 'BARC', 'LLOY',
  'RBS', 'PRU', 'AVST', 'REL', 'NG', 'SSE', 'CPG', 'CRH'
]);

/**
 * Tickers français majeurs (Euronext Paris)
 */
const FRENCH_TICKERS = new Set([
  'AI', 'OR', 'SAN', 'MC', 'BNP', 'TTE', 'ENGI', 'ORA', 'DG',
  'SU', 'CAP', 'SAF', 'CA', 'ACA', 'CS', 'BN', 'DSY', 'STLA',
  'RNO', 'VIV', 'VIE', 'WLN', 'ML', 'KER', 'RMS', 'EL', 'URW'
]);

/**
 * Normalise un ticker pour une requête API (FMP, Polygon, Yahoo)
 *
 * @param {string} ticker - Ticker brut (ex: 'POW', 'TD', 'HSBA')
 * @param {string} [context] - Contexte optionnel ('canada', 'toronto', 'uk', 'france')
 * @returns {string} Ticker normalisé (ex: 'POW.TO', 'TD.TO', 'HSBA.L')
 */
export function normalizeTicker(ticker, context = '') {
  if (!ticker || typeof ticker !== 'string') {
    return ticker;
  }

  const upperTicker = ticker.trim().toUpperCase();
  const contextLower = (context || '').toLowerCase();

  // Si le ticker a déjà un suffixe de bourse, le retourner tel quel
  if (upperTicker.includes('.')) {
    return upperTicker;
  }

  // 1. CONTEXTE EXPLICITE: L'utilisateur mentionne "canada", "toronto", "tsx"
  if (contextLower.includes('canada') ||
      contextLower.includes('toronto') ||
      contextLower.includes('tsx') ||
      contextLower.includes('québec') ||
      contextLower.includes('quebec') ||
      contextLower.includes('montréal') ||
      contextLower.includes('montreal')) {
    console.log(`🍁 [Normalizer] Contexte canadien détecté pour ${upperTicker} → ${upperTicker}.TO`);
    return `${upperTicker}.TO`;
  }

  // 2. DÉTECTION AUTOMATIQUE: Ticker dans la liste des actions canadiennes connues
  if (CANADIAN_TICKERS.has(upperTicker)) {
    console.log(`🍁 [Normalizer] Ticker canadien détecté: ${upperTicker} → ${upperTicker}.TO`);
    return `${upperTicker}.TO`;
  }

  // 3. UK CONTEXT: Ticker britannique
  if (contextLower.includes('uk') ||
      contextLower.includes('london') ||
      contextLower.includes('lse') ||
      UK_TICKERS.has(upperTicker)) {
    console.log(`🇬🇧 [Normalizer] Ticker britannique détecté: ${upperTicker} → ${upperTicker}.L`);
    return `${upperTicker}.L`;
  }

  // 4. FRANCE CONTEXT: Ticker français
  if (contextLower.includes('france') ||
      contextLower.includes('paris') ||
      contextLower.includes('euronext') ||
      FRENCH_TICKERS.has(upperTicker)) {
    console.log(`🇫🇷 [Normalizer] Ticker français détecté: ${upperTicker} → ${upperTicker}.PA`);
    return `${upperTicker}.PA`;
  }

  // 5. DEFAULT: Retourner le ticker tel quel (probablement US)
  return upperTicker;
}

/**
 * Normalise plusieurs tickers en une seule passe
 *
 * @param {string[]} tickers - Liste de tickers
 * @param {string} [context] - Contexte optionnel
 * @returns {string[]} Tickers normalisés
 */
export function normalizeMultipleTickers(tickers, context = '') {
  if (!Array.isArray(tickers)) {
    return tickers;
  }

  return tickers.map(ticker => normalizeTicker(ticker, context));
}

/**
 * Extrait le contexte géographique d'un message utilisateur
 *
 * @param {string} message - Message de l'utilisateur
 * @returns {string} Contexte géographique détecté ('canada', 'uk', 'france', '')
 */
export function extractGeographicContext(message) {
  if (!message || typeof message !== 'string') {
    return '';
  }

  const messageLower = message.toLowerCase();

  // Mots-clés canadiens
  const canadaKeywords = [
    'canada', 'canadian', 'canadien', 'canadienne',
    'toronto', 'tsx', 'montréal', 'montreal', 'québec', 'quebec',
    'vancouver', 'calgary', 'ottawa', 'banque du canada', 'boc'
  ];

  // Mots-clés britanniques
  const ukKeywords = [
    'uk', 'united kingdom', 'royaume-uni', 'london', 'londres',
    'lse', 'ftse', 'british', 'britannique', 'england', 'angleterre'
  ];

  // Mots-clés français
  const franceKeywords = [
    'france', 'français', 'francais', 'french', 'paris',
    'euronext', 'cac 40', 'cac40'
  ];

  if (canadaKeywords.some(kw => messageLower.includes(kw))) {
    return 'canada';
  }

  if (ukKeywords.some(kw => messageLower.includes(kw))) {
    return 'uk';
  }

  if (franceKeywords.some(kw => messageLower.includes(kw))) {
    return 'france';
  }

  return '';
}

/**
 * Vérifie si un ticker est canadien
 *
 * @param {string} ticker - Ticker à vérifier
 * @returns {boolean} true si canadien, false sinon
 */
export function isCanadianTicker(ticker) {
  if (!ticker || typeof ticker !== 'string') {
    return false;
  }

  const upperTicker = ticker.trim().toUpperCase().replace('.TO', '');
  return CANADIAN_TICKERS.has(upperTicker);
}

/**
 * Obtient la bourse d'un ticker normalisé
 *
 * @param {string} ticker - Ticker normalisé (ex: 'POW.TO', 'AAPL', 'HSBA.L')
 * @returns {string} Code de la bourse ('TSX', 'NYSE', 'NASDAQ', 'LSE', 'EPA', 'UNKNOWN')
 */
export function getExchange(ticker) {
  if (!ticker || typeof ticker !== 'string') {
    return 'UNKNOWN';
  }

  const upperTicker = ticker.trim().toUpperCase();

  if (upperTicker.endsWith('.TO')) return 'TSX';
  if (upperTicker.endsWith('.L')) return 'LSE';
  if (upperTicker.endsWith('.PA')) return 'EPA'; // Euronext Paris
  if (upperTicker.endsWith('.AS')) return 'AMS'; // Amsterdam
  if (upperTicker.endsWith('.MI')) return 'MIL'; // Milan
  if (upperTicker.endsWith('.T')) return 'TYO'; // Tokyo

  // US par défaut (NYSE, NASDAQ, etc.)
  return 'US';
}

/**
 * Tickers ambigus qui existent dans plusieurs bourses
 * Format: { ticker: [{exchange, company, country}, ...] }
 */
const AMBIGUOUS_TICKERS = {
  'POW': [
    { exchange: 'TSX', company: 'Power Corporation of Canada', country: 'Canada', normalized: 'POW.TO' },
    { exchange: 'NYSE', company: 'Power REIT', country: 'USA', normalized: 'POW' }
  ],
  'T': [
    { exchange: 'TSX', company: 'TELUS Corporation', country: 'Canada', normalized: 'T.TO' },
    { exchange: 'NYSE', company: 'AT&T Inc.', country: 'USA', normalized: 'T' }
  ],
  'RY': [
    { exchange: 'TSX', company: 'Royal Bank of Canada', country: 'Canada', normalized: 'RY.TO' },
    { exchange: 'NYSE', company: 'Royal Bank of Canada (ADR)', country: 'USA', normalized: 'RY' }
  ],
  'TD': [
    { exchange: 'TSX', company: 'Toronto-Dominion Bank', country: 'Canada', normalized: 'TD.TO' },
    { exchange: 'NYSE', company: 'Toronto-Dominion Bank (ADR)', country: 'USA', normalized: 'TD' }
  ],
  'CM': [
    { exchange: 'TSX', company: 'Canadian Imperial Bank of Commerce', country: 'Canada', normalized: 'CM.TO' },
    { exchange: 'NYSE', company: 'Canadian Imperial Bank of Commerce (ADR)', country: 'USA', normalized: 'CM' }
  ],
  'BNS': [
    { exchange: 'TSX', company: 'Bank of Nova Scotia', country: 'Canada', normalized: 'BNS.TO' },
    { exchange: 'NYSE', company: 'Bank of Nova Scotia (ADR)', country: 'USA', normalized: 'BNS' }
  ],
  'BMO': [
    { exchange: 'TSX', company: 'Bank of Montreal', country: 'Canada', normalized: 'BMO.TO' },
    { exchange: 'NYSE', company: 'Bank of Montreal (ADR)', country: 'USA', normalized: 'BMO' }
  ],
  'MFC': [
    { exchange: 'TSX', company: 'Manulife Financial Corporation', country: 'Canada', normalized: 'MFC.TO' },
    { exchange: 'NYSE', company: 'Manulife Financial Corporation (ADR)', country: 'USA', normalized: 'MFC' }
  ],
  'SLF': [
    { exchange: 'TSX', company: 'Sun Life Financial Inc.', country: 'Canada', normalized: 'SLF.TO' },
    { exchange: 'NYSE', company: 'Sun Life Financial Inc. (ADR)', country: 'USA', normalized: 'SLF' }
  ],
  'ENB': [
    { exchange: 'TSX', company: 'Enbridge Inc.', country: 'Canada', normalized: 'ENB.TO' },
    { exchange: 'NYSE', company: 'Enbridge Inc. (ADR)', country: 'USA', normalized: 'ENB' }
  ],
  'TRP': [
    { exchange: 'TSX', company: 'TC Energy Corporation', country: 'Canada', normalized: 'TRP.TO' },
    { exchange: 'NYSE', company: 'TC Energy Corporation (ADR)', country: 'USA', normalized: 'TRP' }
  ]
};

/**
 * Détecte si un ticker est ambigu (existe dans plusieurs bourses)
 *
 * @param {string} ticker - Ticker à vérifier
 * @returns {Object|null} { isAmbiguous: true, options: [...] } ou null si non ambigu
 */
export function detectAmbiguousTicker(ticker) {
  if (!ticker || typeof ticker !== 'string') {
    return null;
  }

  const upperTicker = ticker.trim().toUpperCase();

  // Si le ticker a déjà un suffixe, il n'est pas ambigu
  if (upperTicker.includes('.')) {
    return null;
  }

  if (AMBIGUOUS_TICKERS[upperTicker]) {
    return {
      isAmbiguous: true,
      ticker: upperTicker,
      options: AMBIGUOUS_TICKERS[upperTicker]
    };
  }

  return null;
}

/**
 * Génère une question de clarification pour un ticker ambigu
 *
 * @param {string} ticker - Ticker ambigu
 * @param {string} userName - Nom de l'utilisateur (optionnel)
 * @returns {string} Question de clarification formatée
 */
export function generateClarificationQuestion(ticker, userName = '') {
  const ambiguity = detectAmbiguousTicker(ticker);

  if (!ambiguity) {
    return null;
  }

  const greeting = userName ? `${userName}, ` : '';
  let question = `${greeting}J'ai trouvé plusieurs entreprises avec le ticker "${ticker}":\n\n`;

  ambiguity.options.forEach((option, index) => {
    question += `${index + 1}. **${option.company}** (${option.country}) - ${option.exchange}\n`;
    question += `   Ticker: ${option.normalized}\n\n`;
  });

  question += `Laquelle souhaitez-vous analyser ?\n\n`;
  question += `💡 Astuce: Vous pouvez préciser directement "${ambiguity.options[0].normalized}" ou "${ambiguity.options[1].normalized}" pour éviter cette question.`;

  return question;
}

/**
 * Utilise FMP API pour valider et résoudre les ambiguïtés de tickers dynamiquement
 * 
 * @param {string} ticker - Ticker ambigu
 * @param {string} userMessage - Message complet de l'utilisateur
 * @param {Array} options - Options de tickers possibles
 * @returns {Promise<Object|null>} { normalized: string, confidence: number } ou null si échec
 */
async function resolveAmbiguityWithFMP(ticker, userMessage, options) {
  try {
    const FMP_API_KEY = process.env.FMP_API_KEY;
    if (!FMP_API_KEY) {
      console.log('⚠️ [Normalizer] FMP_API_KEY non configuré, skip résolution FMP');
      return null;
    }

    // Récupérer les profils des options possibles depuis FMP en parallèle
    const tickersToFetch = options.map(opt => opt.normalized);
    const symbolString = tickersToFetch.join(',');
    
    console.log(`📊 [Normalizer] Validation FMP pour ${ticker}: ${tickersToFetch.join(', ')}`);
    
    const url = `https://financialmodelingprep.com/api/v3/profile/${symbolString}?apikey=${FMP_API_KEY}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      console.warn(`⚠️ [Normalizer] FMP API error: ${response.status}`);
      return null;
    }

    const profiles = await response.json();
    
    if (!Array.isArray(profiles) || profiles.length === 0) {
      console.warn('⚠️ [Normalizer] FMP n\'a retourné aucun profil');
      return null;
    }

    // Normaliser le message utilisateur pour comparaison
    const messageLower = userMessage.toLowerCase();
    const messageWords = messageLower.split(/\s+/).filter(w => w.length >= 3);
    
    // Pour chaque profil, calculer un score de correspondance
    let bestMatch = null;
    let bestScore = 0;
    
    for (const profile of profiles) {
      const companyName = (profile.companyName || '').toLowerCase();
      const symbol = profile.symbol || '';
      const country = (profile.country || '').toLowerCase();
      const exchange = (profile.exchangeShortName || '').toLowerCase();
      
      let score = 0;
      
      // Score 1: Nom d'entreprise dans le message
      const companyWords = companyName.split(/\s+/).filter(w => w.length >= 3);
      for (const word of companyWords) {
        if (messageWords.includes(word) || messageLower.includes(word)) {
          score += 10; // Forte correspondance
        }
      }
      
      // Score 2: Nom complet de l'entreprise dans le message
      if (messageLower.includes(companyName)) {
        score += 50; // Correspondance exacte
      }
      
      // Score 3: Pays mentionné dans le message
      if (country && messageLower.includes(country)) {
        score += 5;
      }
      
      // Score 4: Bourse mentionnée (TSX, NYSE, etc.)
      if (exchange && messageLower.includes(exchange)) {
        score += 5;
      }
      
      // Score 5: Mots-clés géographiques
      if (country === 'canada' || country === 'canadian') {
        if (messageLower.includes('canada') || messageLower.includes('canadian') || 
            messageLower.includes('toronto') || messageLower.includes('tsx')) {
          score += 10;
        }
      } else if (country === 'united states' || country === 'usa') {
        if (messageLower.includes('usa') || messageLower.includes('united states') ||
            messageLower.includes('nyse') || messageLower.includes('nasdaq')) {
          score += 10;
        }
      }
      
      console.log(`   ${symbol}: score=${score} (${companyName})`);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = {
          normalized: symbol,
          companyName: profile.companyName,
          country: profile.country,
          exchange: profile.exchangeShortName,
          score: score
        };
      }
    }
    
    // Seuil de confiance: au moins 10 points pour accepter
    if (bestMatch && bestScore >= 10) {
      const confidence = Math.min(0.95, 0.7 + (bestScore / 100));
      console.log(`✅ [Normalizer] FMP a résolu l'ambiguïté: ${ticker} → ${bestMatch.normalized} (score: ${bestScore}, confiance: ${confidence.toFixed(2)})`);
      return {
        normalized: bestMatch.normalized,
        confidence: confidence,
        reasoning: `Correspondance avec "${bestMatch.companyName}" (${bestMatch.country}) détectée dans le message`,
        source: 'fmp_validation'
      };
    } else {
      console.log(`⚠️ [Normalizer] FMP: score trop faible (${bestScore}) pour résoudre l'ambiguïté`);
      return null;
    }

  } catch (error) {
    console.error('❌ [Normalizer] Erreur lors de la validation FMP:', error.message);
    return null;
  }
}

/**
 * Utilise Gemini LLM pour résoudre automatiquement les ambiguïtés de tickers
 * 
 * @param {string} ticker - Ticker ambigu
 * @param {string} userMessage - Message complet de l'utilisateur
 * @param {Array} options - Options de tickers possibles
 * @returns {Promise<Object|null>} { normalized: string, confidence: number } ou null si échec
 */
async function resolveAmbiguityWithGemini(ticker, userMessage, options) {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      console.log('⚠️ [Normalizer] GEMINI_API_KEY non configuré, skip résolution LLM');
      return null;
    }

    // Construire le prompt pour Gemini
    const optionsText = options.map((opt, idx) => 
      `${idx + 1}. ${opt.company} (${opt.country}) - ${opt.exchange} → ${opt.normalized}`
    ).join('\n');

    const prompt = `Tu es un assistant financier expert. Analyse ce message utilisateur et détermine quel ticker l'utilisateur mentionne.

MESSAGE UTILISATEUR: "${userMessage}"

TICKER AMBIGU: "${ticker}"

OPTIONS POSSIBLES:
${optionsText}

EXEMPLES DE RÉSOLUTION:

Exemple 1:
Message: "L'action de Telus baisse de 4% aujourd'hui"
Ticker ambigu: "T"
Options: 
  1. TELUS Corporation (Canada) - TSX → T.TO
  2. AT&T Inc. (USA) - NYSE → T
Raisonnement: Le message mentionne explicitement "Telus", qui est une entreprise canadienne de télécommunications. Le ticker T.TO correspond à TELUS Corporation.
Réponse: {"normalized": "T.TO", "confidence": 0.95, "reasoning": "Le message mentionne explicitement 'Telus', entreprise canadienne"}

Exemple 2:
Message: "Analyse AT&T"
Ticker ambigu: "T"
Options:
  1. TELUS Corporation (Canada) - TSX → T.TO
  2. AT&T Inc. (USA) - NYSE → T
Raisonnement: Le message mentionne explicitement "AT&T", qui est une entreprise américaine de télécommunications. Le ticker T correspond à AT&T Inc.
Réponse: {"normalized": "T", "confidence": 0.95, "reasoning": "Le message mentionne explicitement 'AT&T', entreprise américaine"}

Exemple 3:
Message: "Prix de TD"
Ticker ambigu: "TD"
Options:
  1. Toronto-Dominion Bank (Canada) - TSX → TD.TO
  2. Toronto-Dominion Bank (ADR) (USA) - NYSE → TD
Raisonnement: Sans contexte géographique explicite, mais "TD" seul fait généralement référence à la banque canadienne. Cependant, si le message mentionne "Canada", "Toronto", "TSX", ou des indices canadiens, choisir TD.TO. Sinon, par défaut TD (NYSE) car plus liquide.
Réponse: {"normalized": "TD", "confidence": 0.70, "reasoning": "Pas de contexte géographique clair, choix par défaut NYSE"}

INSTRUCTIONS:
1. Analyse le message utilisateur pour trouver des indices (noms d'entreprises, pays, bourses mentionnées)
2. Compare avec les options disponibles
3. Retourne UNIQUEMENT un JSON valide avec:
   - "normalized": le ticker normalisé choisi (ex: "T.TO" ou "T")
   - "confidence": un score de confiance entre 0.0 et 1.0
   - "reasoning": une brève explication (1 phrase)

RETOURNE UNIQUEMENT LE JSON, SANS TEXTE AVANT/APRÈS:`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.1, // Très déterministe
          maxOutputTokens: 200,
          candidateCount: 1
        }
      })
    });

    if (!response.ok) {
      console.warn(`⚠️ [Normalizer] Gemini API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Extraire JSON de la réponse
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('⚠️ [Normalizer] Gemini n\'a pas retourné de JSON valide');
      return null;
    }

    const result = JSON.parse(jsonMatch[0]);
    
    // Valider que le ticker normalisé est dans les options
    const isValidOption = options.some(opt => opt.normalized === result.normalized);
    if (!isValidOption) {
      console.warn(`⚠️ [Normalizer] Ticker normalisé "${result.normalized}" n'est pas dans les options`);
      return null;
    }

    console.log(`🤖 [Normalizer] Gemini a résolu l'ambiguïté: ${ticker} → ${result.normalized} (confiance: ${result.confidence})`);
    return {
      normalized: result.normalized,
      confidence: result.confidence || 0.7,
      reasoning: result.reasoning || 'Résolu par Gemini'
    };

  } catch (error) {
    console.error('❌ [Normalizer] Erreur lors de la résolution Gemini:', error.message);
    return null;
  }
}

/**
 * Normalise un ticker avec détection d'ambiguïté
 * Retourne soit le ticker normalisé, soit une question de clarification
 *
 * @param {string} ticker - Ticker brut
 * @param {string} context - Contexte (message de l'utilisateur)
 * @param {Object} sessionMemory - Mémoire de session (pour se souvenir des choix précédents)
 * @returns {Object} { normalized: string, needsClarification: boolean, clarificationQuestion: string|null }
 * 
 * NOTE: Version synchrone pour éviter de perturber le flux existant d'Emma.
 * La résolution Gemini est disponible mais désactivée par défaut (voir resolveAmbiguityWithGemini).
 */
export function normalizeTickerWithClarification(ticker, context = '', sessionMemory = {}) {
  if (!ticker || typeof ticker !== 'string') {
    return { normalized: ticker, needsClarification: false, clarificationQuestion: null };
  }

  const upperTicker = ticker.trim().toUpperCase();

  // 1. Vérifier si l'utilisateur a déjà clarifié ce ticker dans la session
  if (sessionMemory.tickerPreferences && sessionMemory.tickerPreferences[upperTicker]) {
    const preferredTicker = sessionMemory.tickerPreferences[upperTicker];
    console.log(`🧠 [Normalizer] Ticker preference from session: ${upperTicker} → ${preferredTicker}`);
    return {
      normalized: preferredTicker,
      needsClarification: false,
      clarificationQuestion: null,
      source: 'session_memory'
    };
  }

  // 2. Détecter ambiguïté
  const ambiguity = detectAmbiguousTicker(upperTicker);

  if (ambiguity) {
    // 3. Extraire contexte géographique du message
    const geoContext = extractGeographicContext(context);

    // Si le contexte géographique est clair, utiliser la bonne version
    if (geoContext) {
      const matchingOption = ambiguity.options.find(opt =>
        (geoContext === 'canada' && opt.exchange === 'TSX') ||
        (geoContext === 'uk' && opt.exchange === 'LSE') ||
        (geoContext === 'france' && opt.exchange === 'EPA')
      );

      if (matchingOption) {
        console.log(`🌍 [Normalizer] Contexte géographique clair: ${upperTicker} → ${matchingOption.normalized}`);
        return {
          normalized: matchingOption.normalized,
          needsClarification: false,
          clarificationQuestion: null,
          source: 'geographic_context'
        };
      }
    }

    // 3.5. ✅ NOUVEAU: Détecter noms d'entreprises dans le contexte pour résoudre ambiguïté
    const contextLower = (context || '').toLowerCase();
    
    // Mapping noms d'entreprises → tickers normalisés
    const companyNameHints = {
      // TELUS Corporation
      'telus': 'T.TO',
      'telus corporation': 'T.TO',
      
      // AT&T
      'att': 'T',
      'at&t': 'T',
      'at and t': 'T',
      'american telephone': 'T',
      'american telephone and telegraph': 'T',
      
      // Power Corporation (Canada)
      'power corporation': 'POW.TO',
      'power corp': 'POW.TO',
      'power corporation of canada': 'POW.TO',
      
      // Power REIT (USA)
      'power reit': 'POW',
      'power real estate investment trust': 'POW',
      
      // Royal Bank of Canada
      'royal bank': 'RY.TO',
      'royal bank of canada': 'RY.TO',
      'rbc': 'RY.TO',
      
      // TD Bank
      'td bank': 'TD.TO',
      'toronto-dominion': 'TD.TO',
      'toronto dominion': 'TD.TO',
      
      // Bank of Nova Scotia
      'scotiabank': 'BNS.TO',
      'bank of nova scotia': 'BNS.TO',
      'scotia': 'BNS.TO',
      
      // Bank of Montreal
      'bmo': 'BMO.TO',
      'bank of montreal': 'BMO.TO',
      
      // CIBC
      'cibc': 'CM.TO',
      'canadian imperial bank': 'CM.TO',
      'canadian imperial bank of commerce': 'CM.TO',
      
      // Manulife
      'manulife': 'MFC.TO',
      'manulife financial': 'MFC.TO',
      
      // Sun Life
      'sun life': 'SLF.TO',
      'sun life financial': 'SLF.TO',
      
      // Enbridge
      'enbridge': 'ENB.TO',
      
      // TC Energy
      'tc energy': 'TRP.TO',
      'transcanada': 'TRP.TO',
      'trans canada': 'TRP.TO'
    };
    
    // Chercher des indices de noms d'entreprises dans le contexte
    for (const [companyName, normalizedTicker] of Object.entries(companyNameHints)) {
      if (contextLower.includes(companyName)) {
        // Vérifier que le ticker normalisé correspond à une des options ambiguës
        const matchingOption = ambiguity.options.find(opt => opt.normalized === normalizedTicker);
        if (matchingOption) {
          console.log(`🏢 [Normalizer] Nom d'entreprise détecté dans contexte: "${companyName}" → ${normalizedTicker}`);
          return {
            normalized: normalizedTicker,
            needsClarification: false,
            clarificationQuestion: null,
            source: 'company_name_context'
          };
        }
      }
    }

    // 4. ✅ NOUVEAU: Utiliser FMP pour valider dynamiquement et résoudre l'ambiguïté
    // Cette approche est préférée car:
    // - Plus rapide que Gemini (~200ms vs ~500ms)
    // - Données toujours à jour (pas de base statique)
    // - Résout selon le contexte réel du message
    // NOTE: Cette fonction est async mais appelée de manière synchrone dans le flux
    // Pour l'activer, il faudra rendre normalizeTickerWithClarification async
    // Pour l'instant, on la garde en commentaire pour évaluation
    /*
    console.log(`📊 [Normalizer] Ticker ambigu détecté: ${upperTicker} - validation FMP...`);
    const fmpResolution = await resolveAmbiguityWithFMP(upperTicker, context, ambiguity.options);
    
    if (fmpResolution && fmpResolution.confidence >= 0.7) {
      console.log(`✅ [Normalizer] Ambiguïté résolue par FMP: ${upperTicker} → ${fmpResolution.normalized}`);
      return {
        normalized: fmpResolution.normalized,
        needsClarification: false,
        clarificationQuestion: null,
        source: 'fmp_validation',
        confidence: fmpResolution.confidence,
        reasoning: fmpResolution.reasoning
      };
    }
    */

    // 5. Pas de contexte clair → demander clarification à l'utilisateur
    console.log(`❓ [Normalizer] Ticker ambigu détecté: ${upperTicker} - clarification requise`);
    return {
      normalized: null,
      needsClarification: true,
      clarificationQuestion: generateClarificationQuestion(upperTicker, sessionMemory.userName),
      options: ambiguity.options
    };
  }

  // 5. Ticker non ambigu → normaliser normalement
  const normalized = normalizeTicker(upperTicker, context);
  return {
    normalized: normalized,
    needsClarification: false,
    clarificationQuestion: null,
    source: 'auto_normalized'
  };
}

/**
 * Sauvegarde le choix de l'utilisateur pour un ticker ambigu dans la mémoire de session
 *
 * @param {Object} sessionMemory - Mémoire de session
 * @param {string} ticker - Ticker ambigu (ex: 'POW')
 * @param {string} chosenTicker - Ticker choisi (ex: 'POW.TO')
 */
export function saveTickerPreference(sessionMemory, ticker, chosenTicker) {
  if (!sessionMemory.tickerPreferences) {
    sessionMemory.tickerPreferences = {};
  }

  sessionMemory.tickerPreferences[ticker.toUpperCase()] = chosenTicker.toUpperCase();
  console.log(`💾 [Normalizer] Ticker preference saved: ${ticker} → ${chosenTicker}`);
}

// Export des fonctions helper pour tests
export { resolveAmbiguityWithFMP, resolveAmbiguityWithGemini };

export default {
  normalizeTicker,
  normalizeMultipleTickers,
  extractGeographicContext,
  isCanadianTicker,
  getExchange,
  detectAmbiguousTicker,
  generateClarificationQuestion,
  normalizeTickerWithClarification,
  saveTickerPreference,
  CANADIAN_TICKERS,
  UK_TICKERS,
  FRENCH_TICKERS,
  AMBIGUOUS_TICKERS
};
