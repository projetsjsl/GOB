/**
 * TICKER EXTRACTOR - Single Source of Truth
 *
 * Centralise toute la logique d'extraction de tickers pour éviter duplication
 * Utilisé par: chat.js, intent-analyzer.js, emma-agent.js, channel-adapter.js
 *
 * @author Claude Code
 * @date 2025-11-05
 */

export class TickerExtractor {
  /**
   * Mapping noms compagnies → tickers
   * SINGLE SOURCE OF TRUTH - Ne modifier QU'ICI
   */
  static companyToTicker = {
    // Tech Giants
    'apple': 'AAPL',
    'microsoft': 'MSFT',
    'google': 'GOOGL',
    'alphabet': 'GOOGL',
    'amazon': 'AMZN',
    'tesla': 'TSLA',
    'meta': 'META',
    'facebook': 'META',
    'nvidia': 'NVDA',
    'amd': 'AMD',
    'intel': 'INTC',
    'netflix': 'NFLX',
    'disney': 'DIS',

    // Finance
    'jpmorgan': 'JPM',
    'goldman sachs': 'GS',
    'morgan stanley': 'MS',
    'wells fargo': 'WFC',
    'citigroup': 'C',
    'bank of america': 'BAC',
    'american express': 'AXP',
    'mastercard': 'MA',
    'visa': 'V',
    'paypal': 'PYPL',

    // Consumer
    'coca-cola': 'KO',
    'coca cola': 'KO',
    'pepsi': 'PEP',
    'pepsico': 'PEP',
    'mcdonalds': 'MCD',
    "mcdonald's": 'MCD',
    'nike': 'NKE',
    'walmart': 'WMT',
    'costco': 'COST',
    'home depot': 'HD',
    'target': 'TGT',
    'starbucks': 'SBUX',

    // Industrial
    'boeing': 'BA',
    'caterpillar': 'CAT',
    '3m': 'MMM',
    'general electric': 'GE',
    'honeywell': 'HON',

    // Energy
    'exxon': 'XOM',
    'chevron': 'CVX',
    'conocophillips': 'COP',

    // Healthcare
    'johnson': 'JNJ',
    'pfizer': 'PFE',
    'merck': 'MRK',
    'abbvie': 'ABBV',
    'bristol myers': 'BMY',
    'eli lilly': 'LLY',
    'unitedhealth': 'UNH',

    // Tech Services
    'accenture': 'ACN',
    'ibm': 'IBM',
    'oracle': 'ORCL',
    'salesforce': 'CRM',
    'adobe': 'ADBE',
    'cisco': 'CSCO',
    'qualcomm': 'QCOM',

    // Canadian
    'shopify': 'SHOP',
    'brookfield': 'BAM',
    'canadian national': 'CNI',
    'enbridge': 'ENB',
    'tc energy': 'TRP',
    'royal bank': 'RY',
    'td bank': 'TD',
    'bank of nova scotia': 'BNS',
    'bce': 'BCE',
    'telus': 'T'
  };

  /**
   * Mots communs à exclure (faux positifs)
   * SINGLE SOURCE OF TRUTH
   */
  static COMMON_WORDS = [
    // Devises
    'USD', 'CAD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CNY', 'INR', 'BRL',

    // Titres/Postes
    'CEO', 'CFO', 'CTO', 'COO', 'CIO', 'VP', 'SVP', 'EVP', 'MD', 'GM',

    // Finance/Investissement
    'IPO', 'ETF', 'REIT', 'SPY', 'QQQ', 'IWM', 'EEM', 'VTI', 'VOO',
    'PE', 'PB', 'PS', 'EPS', 'ROE', 'ROA', 'EBITDA', 'FCF', 'YTD', 'YOY',
    'TTM', 'CAGR', 'NAV', 'AUM', 'EV', 'WACC', 'IRR', 'NPV',

    // Indicateurs Techniques
    'RSI', 'MACD', 'SMA', 'EMA', 'VWAP', 'ATR', 'ADX', 'OBV', 'MFI',

    // Termes généraux
    'AI', 'ML', 'API', 'SDK', 'AWS', 'GDPR', 'SEC', 'FED', 'ECB', 'BOC',

    // Noms propres projet
    'EMMA', 'SMS', 'FMP', 'GOB', 'JSLAI', 'JSL', 'JS', 'DAN',

    // Abréviations communes
    'AMC', 'BMO', 'TBA', 'EST', 'PST', 'GMT', 'UTC',
    'VS', 'OU', 'ET', 'OK', 'NO', 'YES', 'WIP', 'TBD',
    
    // Mots-clés intents (pas des tickers)
    'NEWS', 'TAUX', 'AIDE', 'HELP', 'SKILLS',
    'TRUMP', 'CHINE', 'VALUE', 'GROWTH', 'DIVIDEND', 'ALLOCATION', 'PORTEFEUILLE',

    // Trimestres
    'Q1', 'Q2', 'Q3', 'Q4', 'FY', 'H1', 'H2',

    // Mots français courants (faux positifs)
    'SOUS', 'POUR', 'DANS', 'AVEC', 'SANS', 'PLUS', 'MOINS', 'TRES', 'BIEN',
    'TOUS', 'TOUT', 'ELLE', 'ELLES', 'NOUS', 'VOUS', 'LEUR', 'LEURS',
    'CETTE', 'CETTE', 'SONT', 'FAIT', 'FAIRE', 'DIRE', 'PEUT', 'DOIT',
    'ETRE', 'AVOIR', 'VEUX', 'VEUT', 'COMME', 'DONC', 'MAIS', 'PUIS',
    'QUOI', 'QUEL', 'QUELLE', 'QUELS', 'QUELLES', 'DONT', 'VERS', 'CHEZ',
    'ENTRE', 'PARMI', 'SELON', 'MALGRE', 'DEPUIS', 'AVANT', 'APRES',
    'LARGE', 'SMALL', 'MID', 'CAP', 'CAPS', 'VALU', 'ES', 'EES',
    'TITRE', 'TITRES', 'ACTION', 'ACTIONS', 'STOCK', 'STOCKS',
    'MA', 'MON', 'MES', 'TA', 'TON', 'TES', 'SA', 'SON', 'SES',
    'VRAI', 'VRAIE', 'VRAIS', 'VRAIES', 'FAUX', 'FAUSSE', 'FAUSSES',
    'BON', 'BONNE', 'BONS', 'BONNES', 'MAUVAIS', 'MAUVAISE',
    'HAUT', 'HAUTE', 'HAUTS', 'HAUTES', 'BAS', 'BASSE', 'BASES',
    // Mots avec accents (versions uppercase)
    'ÉVALUÉ', 'ÉVALUÉE', 'ÉVALUÉS', 'ÉVALUÉES', 'EVALUEE', 'EVALUEES',
    'ÊTRE', 'TRÈS', 'APRÈS', 'MALGRÉ', 'DÉJÀ', 'VOILÀ', 'VOICI',
    'MÊME', 'MÊMES', 'PRÈS', 'AUPRÈS', 'EXPRÈS', 'SUCCÈS',
    'FRANÇAIS', 'FRANÇAISE', 'FRANÇAISES', 'AMÉRICAIN', 'AMÉRICAINE',
    'PRÉFÉRÉ', 'PRÉFÉRÉE', 'PRÉFÉRÉS', 'PRÉFÉRÉES',
    'ÉLEVÉ', 'ÉLEVÉE', 'ÉLEVÉS', 'ÉLEVÉES',
    'TROUVÉ', 'TROUVÉE', 'TROUVÉS', 'TROUVÉES',
    'PRIX', 'DE', 'DES', 'LES', 'LA', 'LE', 'UN', 'UNE',
    'LISTE', 'LISTES', 'APPLE', // Apple est un nom de compagnie, pas un ticker seul
    'AIS', 'AIT', 'ONS', 'EZ', 'ENT', // Terminaisons verbales françaises
    'AISE', 'AISES' // Ex: "français" → "AIS"
  ];

  /**
   * Regex pour tickers (2-5 lettres MAJUSCULES ASCII uniquement)
   * Unifiée pour tout le projet
   * NOTE: Exclut les lettres accentuées (É, È, À, etc.) pour éviter faux positifs français
   */
  static TICKER_REGEX = /\b([A-Z]{2,5})(?![À-ÿ])\b/g;

  /**
   * Extrait tickers d'un message texte
   *
   * @param {string} message - Message à analyser
   * @param {object} options - Options extraction
   * @param {boolean} options.includeCompanyNames - Chercher noms compagnies (default: true)
   * @param {boolean} options.filterCommonWords - Filtrer faux positifs (default: true)
   * @returns {string[]} Liste de tickers uniques validés
   *
   * @example
   * TickerExtractor.extract("Prix Apple et Microsoft")
   * // Returns: ["AAPL", "MSFT"]
   *
   * @example
   * TickerExtractor.extract("ANALYSE AAPL GOOGL")
   * // Returns: ["AAPL", "GOOGL"]
   */
  static extract(message, options = {}) {
    const {
      includeCompanyNames = true,
      filterCommonWords = true
    } = options;

    const tickers = new Set();
    const messageLower = message.toLowerCase();
    const messageUpper = message.toUpperCase();

    // 1. Extraction par regex (tickers explicites en MAJUSCULES)
    const matches = message.match(this.TICKER_REGEX) || [];

    matches.forEach(ticker => {
      // Filtrer faux positifs
      if (filterCommonWords && this.COMMON_WORDS.includes(ticker)) {
        return;
      }
      tickers.add(ticker);
    });

    // ✅ FIX BUG 4: Aussi chercher tickers en minuscules (ex: "analyse msft")
    // Check uppercase version of message for lowercase tickers
    const lowerMatches = messageUpper.match(this.TICKER_REGEX) || [];
    lowerMatches.forEach(ticker => {
      // Only add if not already found and not a common word
      if (!tickers.has(ticker) && (!filterCommonWords || !this.COMMON_WORDS.includes(ticker))) {
        tickers.add(ticker);
      }
    });

    // 2. Mapping noms compagnies → tickers
    if (includeCompanyNames) {
      for (const [company, ticker] of Object.entries(this.companyToTicker)) {
        if (messageLower.includes(company)) {
          tickers.add(ticker);
        }
      }
    }

    return Array.from(tickers);
  }

  /**
   * Extrait 2 tickers pour comparaison (T1 vs T2, T1 OU T2, etc.)
   *
   * @param {string} message - Message avec comparaison
   * @returns {string[]} [ticker1, ticker2] ou [] si pas de comparaison détectée
   *
   * @example
   * TickerExtractor.extractForComparison("COMPARER AAPL ET MSFT")
   * // Returns: ["AAPL", "MSFT"]
   *
   * @example
   * TickerExtractor.extractForComparison("NVDA VS AMD")
   * // Returns: ["NVDA", "AMD"]
   */
  static extractForComparison(message) {
    const patterns = [
      // "COMPARER AAPL ET MSFT", "COMPARER AAPL MSFT", "COMPARER AAPL VS MSFT"
      /COMPARER\s+([A-Z]{2,5})\s+(?:ET\s+|VS\s+)?([A-Z]{2,5})/i,

      // "AAPL VS MSFT"
      /([A-Z]{2,5})\s+VS\s+([A-Z]{2,5})/i,

      // "AAPL OU MSFT"
      /([A-Z]{2,5})\s+OU\s+([A-Z]{2,5})/i,

      // "AAPL versus MSFT"
      /([A-Z]{2,5})\s+VERSUS\s+([A-Z]{2,5})/i,

      // "Apple vs Microsoft"
      /COMPARER\s+(\w+)\s+(?:ET\s+|VS\s+)?(\w+)/i
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        const ticker1 = match[1].toUpperCase();
        const ticker2 = match[2].toUpperCase();

        // Convertir noms compagnies si nécessaire
        const finalTicker1 = this.companyToTicker[ticker1.toLowerCase()] || ticker1;
        const finalTicker2 = this.companyToTicker[ticker2.toLowerCase()] || ticker2;

        // Valider que ce sont des tickers valides (pas des mots communs)
        if (!this.COMMON_WORDS.includes(finalTicker1) &&
            !this.COMMON_WORDS.includes(finalTicker2)) {
          return [finalTicker1, finalTicker2];
        }
      }
    }

    return [];
  }

  /**
   * Extrait ticker après un mot-clé spécifique
   *
   * @param {string} message - Message complet
   * @param {string} keyword - Mot-clé (ex: "ANALYSE", "PRIX", "RSI")
   * @returns {string|null} Ticker extrait ou null
   *
   * @example
   * TickerExtractor.extractFromCommand("ANALYSE AAPL", "ANALYSE")
   * // Returns: "AAPL"
   *
   * @example
   * TickerExtractor.extractFromCommand("RSI Tesla", "RSI")
   * // Returns: "TSLA" (via mapping companyToTicker)
   */
  static extractFromCommand(message, keyword) {
    // Pattern: KEYWORD TICKER (ex: "ANALYSE AAPL", "PRIX MSFT")
    const regex = new RegExp(`${keyword}\\s+([A-Z]{2,5})`, 'i');
    const match = message.match(regex);

    if (match) {
      const ticker = match[1].toUpperCase();

      // Valider que ce n'est pas un faux positif
      if (!this.COMMON_WORDS.includes(ticker)) {
        return ticker;
      }
    }

    // Fallback: chercher nom compagnie après keyword
    const messageLower = message.toLowerCase();
    const keywordIndex = messageLower.indexOf(keyword.toLowerCase());

    if (keywordIndex !== -1) {
      const afterKeyword = messageLower.slice(keywordIndex + keyword.length).trim();

      for (const [company, ticker] of Object.entries(this.companyToTicker)) {
        if (afterKeyword.startsWith(company)) {
          return ticker;
        }
      }
    }

    return null;
  }

  /**
   * Valide si une string est un ticker valide
   *
   * @param {string} ticker - Ticker à valider
   * @returns {boolean} true si valide
   *
   * @example
   * TickerExtractor.isValidTicker("AAPL")  // true
   * TickerExtractor.isValidTicker("CEO")   // false (mot commun)
   * TickerExtractor.isValidTicker("A")     // false (trop court)
   */
  static isValidTicker(ticker) {
    if (!ticker || typeof ticker !== 'string') {
      return false;
    }

    const upper = ticker.toUpperCase();

    // Longueur 2-5 caractères
    if (upper.length < 2 || upper.length > 5) {
      return false;
    }

    // Seulement lettres majuscules
    if (!/^[A-Z]+$/.test(upper)) {
      return false;
    }

    // Pas un mot commun
    if (this.COMMON_WORDS.includes(upper)) {
      return false;
    }

    return true;
  }

  /**
   * Extrait tous les tickers d'un texte (incluant ceux dans URLs, etc.)
   * Version plus agressive que extract()
   *
   * @param {string} text - Texte complet
   * @returns {string[]} Liste de tous les tickers trouvés
   */
  static extractAll(text) {
    const tickers = new Set();

    // Regex plus permissive
    const allMatches = text.match(/\b[A-Z]{2,5}\b/g) || [];

    allMatches.forEach(match => {
      if (this.isValidTicker(match)) {
        tickers.add(match);
      }
    });

    return Array.from(tickers);
  }
}

export default TickerExtractor;
