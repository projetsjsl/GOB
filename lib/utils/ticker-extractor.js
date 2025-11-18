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
    'shopify inc': 'SHOP',
    'brookfield': 'BAM',
    'canadian national': 'CNI',
    'enbridge': 'ENB',
    'tc energy': 'TRP',
    'royal bank': 'RY',
    'td bank': 'TD',
    'bank of nova scotia': 'BNS',
    'bce': 'BCE',
    'telus': 'T.TO',
    'telus corporation': 'T.TO',
    'att': 'T',
    'at&t': 'T',
    'at and t': 'T'
  };

  /**
   * Mots communs à exclure (faux positifs)
   * SINGLE SOURCE OF TRUTH
   * ⚠️ CRITIQUE: Cette liste doit être exhaustive pour éviter les faux positifs
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
    
    // Expressions émotionnelles (pas des tickers)
    'WOW', 'SUPER', 'NICE', 'COOL', 'GREAT', 'OK', 'OKAY', 'YES', 'NO',
    'MERCI', 'THANKS', 'THANK', 'BRAVO', 'PARFAIT', 'BIEN', 'BON',
    'GENIAL', 'FANTASTIQUE', 'EXCELLENT', 'AMAZING', 'AWESOME',
    'HAHA', 'LOL', 'MDR', 'HEHE', 'HIHI',

    // Trimestres
    'Q1', 'Q2', 'Q3', 'Q4', 'FY', 'H1', 'H2',

    // ✅ Mots français courants - ARTICLES ET PRONOMS (CRITIQUE)
    'DE', 'DES', 'LES', 'LA', 'LE', 'UN', 'UNE', 'DU', 'DE', 'AU', 'AUX',
    'QUEL', 'QUELLE', 'QUELS', 'QUELLES', 'QUOI', 'QUI', 'QUE', 'DONT', 'OÙ',
    'TU', 'ME', 'TE', 'NOUS', 'VOUS', 'IL', 'ELLE', 'ILS', 'ELLES', 'ON',
    'MON', 'MA', 'MES', 'TON', 'TA', 'TES', 'SON', 'SA', 'SES', 'NOTRE', 'VOTRE', 'LEUR', 'LEURS',
    'CE', 'CET', 'CETTE', 'CES', 'CETTE',
    
    // ✅ Mots français courants - VERBES (CRITIQUE)
    'SONT', 'EST', 'SERA', 'SERONT', 'FAIT', 'FAIRE', 'FAIS', 'FAITES',
    'ETRE', 'AVOIR', 'AVOIR', 'VEUX', 'VEUT', 'VOUS', 'NOUS',
    'PEUT', 'PEUX', 'PEUVENT', 'DOIT', 'DOIS', 'DOIVENT',
    'DIT', 'DIRE', 'DIS', 'DITES', 'DISAIT', 'DISENT',
    'AIS', 'AIT', 'ONS', 'EZ', 'ENT', // Terminaisons verbales
    
    // ✅ Mots français courants - PRÉPOSITIONS ET CONJONCTIONS (CRITIQUE)
    'POUR', 'DANS', 'AVEC', 'SANS', 'SUR', 'SOUS', 'PAR', 'PAS',
    'PLUS', 'MOINS', 'TRES', 'BIEN', 'MAL', 'BON', 'MAUVAIS',
    'COMME', 'DONC', 'MAIS', 'PUIS', 'OU', 'ET', 'NI',
    'VERS', 'CHEZ', 'ENTRE', 'PARMI', 'SELON', 'MALGRE', 'DEPUIS', 'AVANT', 'APRES',
    'PENDANT', 'DURANT', 'JUSQUE', 'JUSQU', 'ENVERS', 'CONTR', 'SAUF', 'EXCEPT',
    
    // ✅ Mots français courants - ADJECTIFS ET ADVERBES (CRITIQUE)
    'TOUS', 'TOUT', 'TOUTE', 'TOUTES', 'TOUTE',
    'LARGE', 'SMALL', 'MID', 'CAP', 'CAPS', 'VALU', 'ES', 'EES',
    'VRAI', 'VRAIE', 'VRAIS', 'VRAIES', 'FAUX', 'FAUSSE', 'FAUSSES',
    'BON', 'BONNE', 'BONS', 'BONNES', 'MAUVAIS', 'MAUVAISE', 'MAUVAISES',
    'HAUT', 'HAUTE', 'HAUTS', 'HAUTES', 'BAS', 'BASSE', 'BASSES',
    'GRAND', 'GRANDE', 'GRANDS', 'GRANDES', 'PETIT', 'PETITE', 'PETITS', 'PETITES',
    'NOUVEAU', 'NOUVELLE', 'NOUVEAUX', 'NOUVELLES',
    'PREMIER', 'PREMIERE', 'PREMIERS', 'PREMIERES',
    'DERNIER', 'DERNIERE', 'DERNIERS', 'DERNIERES',
    
    // ✅ Mots français courants - NOMS COMMUNS FINANCIERS (CRITIQUE)
    'TITRE', 'TITRES', 'ACTION', 'ACTIONS', 'STOCK', 'STOCKS',
    'FONDS', 'FOND', 'FONDE', 'FONDES', // ⚠️ CRITIQUE: "fonds" est un mot français, pas un ticker
    'PRIX', 'PRIX', 'COURS', 'COTE', 'COTATION',
    'LISTE', 'LISTES', 'APPLE', // Apple est un nom de compagnie, pas un ticker seul
    
    // ✅ Mots français courants - QUESTIONS ET INTERROGATIFS (CRITIQUE)
    'QUELS', 'QUEL', 'QUELLE', 'QUELLES', 'QUOI', 'QUI', 'QUE', 'QUAND', 'COMMENT', 'POURQUOI', 'OÙ',
    'EST', 'SONT', 'SERA', 'SERONT', 'ES', 'ETES',
    
    // ✅ Mots français courants - TEMPS ET DATES (CRITIQUE)
    'ANS', 'AN', 'ANNEE', 'ANNEES', 'JOUR', 'JOURS', 'MOIS', 'ANNEE',
    'HIER', 'AUJOURD', 'DEMAIN', 'MAINTENANT', 'MAINTENANT',
    
    // ✅ Mots français courants - PAYS ET NATIONALITÉS (CRITIQUE)
    'CANADIENS', 'CANADIEN', 'CANADIENNE', 'CANADIENNES', // ⚠️ CRITIQUE: "canadiens" est un mot français
    'FRANCAIS', 'FRANCAISE', 'FRANCAISES', 'AMERICAIN', 'AMERICAINE', 'AMERICAINS', 'AMERICAINES',
    
    // ✅ Mots français courants - AUTRES (CRITIQUE)
    'PERFORMANCE', 'PERFORMANCES', 'QUARTILE', 'QUARTILES', 'RENDEMENT', 'RENDEMENTS',
    'EQUILIBRE', 'EQUILIBRES', 'EQUILIBRE', // ⚠️ CRITIQUE: "équilibrés" → "EQUILIBRES"
    'CATEGORIE', 'CATEGORIES', 'TYPE', 'TYPES',
    'AISE', 'AISES', // Ex: "français" → "AIS"
    
    // Mots avec accents (versions uppercase)
    'ÉVALUÉ', 'ÉVALUÉE', 'ÉVALUÉS', 'ÉVALUÉES', 'EVALUEE', 'EVALUEES',
    'ÊTRE', 'TRÈS', 'APRÈS', 'MALGRÉ', 'DÉJÀ', 'VOILÀ', 'VOICI',
    'MÊME', 'MÊMES', 'PRÈS', 'AUPRÈS', 'EXPRÈS', 'SUCCÈS',
    'FRANÇAIS', 'FRANÇAISE', 'FRANÇAISES', 'AMÉRICAIN', 'AMÉRICAINE',
    'PRÉFÉRÉ', 'PRÉFÉRÉE', 'PRÉFÉRÉS', 'PRÉFÉRÉES',
    'ÉLEVÉ', 'ÉLEVÉE', 'ÉLEVÉS', 'ÉLEVÉES',
    'TROUVÉ', 'TROUVÉE', 'TROUVÉS', 'TROUVÉES',
    'ÉQUILIBRÉ', 'ÉQUILIBRÉE', 'ÉQUILIBRÉS', 'ÉQUILIBRÉES',
    'ÉQUILIBRE', 'ÉQUILIBRES'
  ];

  /**
   * Regex pour tickers (2-5 lettres MAJUSCULES ASCII uniquement)
   * Unifiée pour tout le projet
   * NOTE: Exclut les lettres accentuées (É, È, À, etc.) pour éviter faux positifs français
   */
  static TICKER_REGEX = /\b([A-Z]{2,5})(?![À-ÿ])\b/g;

  /**
   * Détecte si le message est une question non-ticker (fonds, économie, macro, etc.)
   * ⚠️ CRITIQUE: Détecter AVANT l'extraction pour éviter faux positifs
   */
  static isNonTickerQuestion(message) {
    const messageLower = message.toLowerCase();
    
    // Mots-clés indiquant questions sur fonds/ETF/portefeuille
    const fundKeywords = [
      'fonds', 'fond', 'mutual fund', 'fonds mutuels', 'fonds d\'investissement',
      'quartile', 'quartiles', 'rendement', 'rendements', 'performance des fonds',
      'catégorie de fonds', 'categorie de fonds', 'fonds équilibrés', 'fonds equilibres',
      'fonds canadiens', 'fonds américains', 'fonds internationaux', 'etf', 'etfs',
      'fonds indiciels', 'fonds actifs', 'fonds passifs', 'fonds sectoriels',
      'fonds de croissance', 'fonds de valeur', 'fonds de dividendes', 'fonds de revenu',
      'fonds indexés', 'fonds à capital garanti', 'fonds alternatifs', 'hedge fund',
      'fonds de couverture', 'fonds de private equity', 'fonds immobiliers', 'reit', 'reits',
      'fiducie de placement', 'fiducie immobilière', 'frais de gestion', 'frais de fonds',
      'mer', 'ter', 'expense ratio', 'rating morningstar', 'étoiles morningstar'
    ];
    
    // Mots-clés indiquant questions macro/économiques
    const macroKeywords = [
      'inflation', 'taux directeur', 'fed', 'banque centrale', 'pib', 'gdp',
      'chômage', 'chomage', 'emploi', 'récession', 'recession', 'croissance économique',
      'politique monétaire', 'monetaire', 'taux d\'intérêt', 'interet', 'taux',
      'banque du canada', 'boc', 'ecb', 'banque centrale européenne', 'boj', 'banque du japon',
      'politique budgétaire', 'fiscal', 'déficit', 'deficit', 'dette publique', 'dette souveraine',
      'indicateurs économiques', 'indicateur macro', 'indicateurs macroéconomiques',
      'consommation', 'production industrielle', 'pmi', 'ism', 'indice manufacturier',
      'commerce extérieur', 'balance commerciale', 'exportations', 'importations',
      'devise', 'devises', 'taux de change', 'forex', 'fx', 'parité', 'cours des devises',
      'marché obligataire', 'bonds', 'obligations d\'état', 'taux réel', 'taux nominal',
      'prime de risque', 'risk premium', 'spread de crédit', 'courbe des taux', 'yield curve'
    ];
    
    // Mots-clés indiquant questions sur stratégies
    const strategyKeywords = [
      'stratégie', 'strategie', 'stratégie d\'investissement', 'strategie d\'investissement',
      'allocation d\'actifs', 'asset allocation', 'diversification', 'rééquilibrage', 'reequilibrage',
      'value investing', 'growth investing', 'dividend investing', 'momentum investing',
      'contrarian', 'contrarian investing', 'dollar cost averaging', 'dca',
      'buy and hold', 'trading actif', 'day trading', 'swing trading', 'position trading',
      'hedging', 'couverture', 'protection de portefeuille', 'risk management',
      'gestion des risques', 'stop loss', 'take profit', 'position sizing'
    ];
    
    // Mots-clés indiquant questions sur secteurs
    const sectorKeywords = [
      'secteur', 'industrie', 'secteurs performants', 'secteurs en hausse', 'secteurs en baisse',
      'secteur technologique', 'secteur techno', 'tech sector', 'secteur financier',
      'secteur santé', 'healthcare sector', 'secteur énergétique', 'energy sector',
      'secteur consommation', 'consumer sector', 'secteur industriel', 'industrial sector',
      'secteur matériaux', 'materials sector', 'secteur immobilier', 'real estate sector',
      'secteur défensif', 'defensive sector', 'secteur cyclique', 'cyclical sector',
      'analyse sectorielle', 'sector analysis', 'performance sectorielle', 'sector performance'
    ];
    
    // Mots-clés indiquant questions sur crypto
    const cryptoKeywords = [
      'crypto', 'cryptomonnaie', 'cryptomonnaies', 'bitcoin', 'btc', 'ethereum', 'eth',
      'blockchain', 'defi', 'nft', 'altcoin', 'altcoins', 'stablecoin', 'stablecoins',
      'mining', 'minage', 'staking', 'yield farming', 'liquidity pool', 'pool de liquidité'
    ];
    
    // Mots-clés indiquant questions sur commodities
    const commodityKeywords = [
      'commodities', 'commodity', 'matières premières', 'matiere premiere',
      'or', 'argent', 'pétrole', 'petrole', 'oil', 'gaz naturel', 'natural gas',
      'blé', 'maïs', 'soja', 'café', 'cacao', 'sucre', 'cotton', 'coton',
      'cuivre', 'nickel', 'zinc', 'aluminium', 'fer', 'acier', 'steel',
      'prix des matières premières', 'commodity prices', 'futures', 'contrats à terme',
      'crude oil', 'wti', 'brent', 'gold', 'silver', 'platinum', 'palladium'
    ];
    
    // Mots-clés indiquant questions sur forex
    const forexKeywords = [
      'forex', 'fx', 'devise', 'devises', 'taux de change', 'exchange rate',
      'currency', 'currencies', 'parité', 'cours des devises', 'currency pair',
      'usd', 'eur', 'gbp', 'jpy', 'cad', 'chf', 'aud', 'nzd', 'cny',
      'dollar', 'euro', 'livre', 'yen', 'franc suisse', 'dollar australien',
      'currency market', 'marché des changes', 'carry trade', 'currency hedging'
    ];
    
    // Mots-clés indiquant questions sur obligations
    const bondKeywords = [
      'obligations', 'bonds', 'obligation', 'bond', 'corporate bonds', 'government bonds',
      'treasury bonds', 'municipal bonds', 'high yield', 'junk bonds', 'investment grade',
      'credit rating', 'yield', 'rendement obligataire', 'coupon', 'duration',
      'yield to maturity', 'ytm', 'fixed income', 'revenu fixe', 'bond market'
    ];
    
    // Mots-clés indiquant questions sur immobilier
    const realEstateKeywords = [
      'immobilier', 'real estate', 'reit', 'reits', 'fiducie immobilière',
      'property', 'commercial real estate', 'residential real estate', 'real estate market',
      'cap rate', 'taux de capitalisation', 'noi', 'real estate investment'
    ];
    
    // Mots-clés indiquant questions sur private equity
    const privateEquityKeywords = [
      'private equity', 'capital-investissement', 'venture capital', 'vc', 'capital de risque',
      'startup', 'startups', 'unicorn', 'licorne', 'series a', 'series b', 'funding round',
      'levée de fonds', 'fundraising', 'lbo', 'leveraged buyout', 'mbo'
    ];
    
    // Mots-clés indiquant questions sur calculs/simulations
    const calculationKeywords = [
      'calculer', 'calcul', 'simulation', 'simuler', 'scénario', 'scenario',
      'projection', 'prévision', 'dcf', 'discounted cash flow', 'van', 'npv', 'irr',
      'wacc', 'terminal value', 'sensitivity analysis', 'monte carlo', 'backtesting',
      'stress test', 'test de résistance'
    ];
    
    // Mots-clés indiquant questions sur réglementation
    const regulatoryKeywords = [
      'réglementation', 'regulation', 'compliance', 'conformité', 'sec', 'amf',
      'réglementation financière', 'financial regulation', 'insider trading',
      'market manipulation', 'disclosure', 'gaap', 'ifrs', 'normes comptables'
    ];
    
    // Mots-clés indiquant questions sur ESG
    const esgKeywords = [
      'esg', 'environmental social governance', 'durabilité', 'sustainability',
      'responsabilité sociale', 'csr', 'rse', 'green bonds', 'sustainable investing',
      'climate risk', 'transition énergétique', 'renewable energy', 'esg rating'
    ];
    
    // Mots-clés indiquant questions sur arbitrage
    const arbitrageKeywords = [
      'arbitrage', 'pairs trading', 'statistical arbitrage', 'market neutral',
      'long short', 'hedge fund strategy', 'relative value', 'spread trading',
      'quantitative strategy', 'algorithmic trading', 'high frequency trading', 'hft'
    ];
    
    // Mots-clés indiquant questions sur méthodologies
    const methodologyKeywords = [
      'méthodologie', 'methodology', 'dcf', 'multiples', 'comparable companies',
      'valuation methodology', 'financial modeling', 'pro forma', 'sensitivity table',
      'asset based valuation', 'income approach', 'market approach'
    ];
    
    // Mots-clés indiquant questions sur M&A
    const maKeywords = [
      'fusion', 'acquisition', 'm&a', 'merger', 'takeover', 'rachat', 'opa',
      'offre publique', 'merger arbitrage', 'due diligence', 'synergy', 'synergie'
    ];
    
    // Mots-clés indiquant questions sur IPO
    const ipoKeywords = [
      'ipo', 'introduction en bourse', 'public offering', 'going public',
      'entrée en bourse', 'listing', 'ipo pricing', 'ipo valuation', 'lock up period'
    ];
    
    // Mots-clés indiquant questions géopolitiques
    const geopoliticalKeywords = [
      'géopolitique', 'geopolitique', 'guerre', 'conflit', 'sanctions',
      'élections', 'elections', 'politique', 'gouvernement', 'régulation', 'regulation',
      'trade war', 'guerre commerciale', 'tarifs', 'douanes', 'protectionnisme',
      'brexit', 'union européenne', 'ue', 'eu', 'otan', 'nato',
      'relations internationales', 'tensions', 'diplomatie', 'alliances'
    ];
    
    // Mots-clés indiquant questions fiscales
    const taxKeywords = [
      'impôt', 'impot', 'taxe', 'fiscalité', 'fiscalite', 'fiscal',
      'tfsa', 'celi', 'reer', 'rrsp', 'régime enregistré', 'regime enregistre',
      'gain en capital', 'capital gain', 'dividende', 'dividend', 'revenu d\'intérêt',
      'déduction', 'deduction', 'crédit d\'impôt', 'credit d\'impot', 'exemption',
      'planification fiscale', 'tax planning', 'optimisation fiscale', 'tax optimization'
    ];
    
    // Mots-clés indiquant questions générales (pas de ticker spécifique)
    const generalKeywords = [
      'quels sont', 'quelle est', 'comment fonctionne', 'explique', 'c\'est quoi',
      'qu\'est-ce que', 'quest-ce que', 'définition', 'definition',
      'avantages', 'inconvénients', 'inconvenients', 'pour et contre', 'pros and cons',
      'meilleur', 'meilleure', 'meilleurs', 'meilleures', 'best', 'top',
      'recommandation', 'conseil', 'avis', 'opinion', 'suggestion',
      'différence entre', 'difference entre', 'comparer', 'comparaison'
    ];
    
    const hasFundKeyword = fundKeywords.some(kw => messageLower.includes(kw));
    const hasMacroKeyword = macroKeywords.some(kw => messageLower.includes(kw));
    const hasStrategyKeyword = strategyKeywords.some(kw => messageLower.includes(kw));
    const hasSectorKeyword = sectorKeywords.some(kw => messageLower.includes(kw));
    const hasCryptoKeyword = cryptoKeywords.some(kw => messageLower.includes(kw));
    const hasCommodityKeyword = commodityKeywords.some(kw => messageLower.includes(kw));
    const hasForexKeyword = forexKeywords.some(kw => messageLower.includes(kw));
    const hasBondKeyword = bondKeywords.some(kw => messageLower.includes(kw));
    const hasRealEstateKeyword = realEstateKeywords.some(kw => messageLower.includes(kw));
    const hasPrivateEquityKeyword = privateEquityKeywords.some(kw => messageLower.includes(kw));
    const hasCalculationKeyword = calculationKeywords.some(kw => messageLower.includes(kw));
    const hasRegulatoryKeyword = regulatoryKeywords.some(kw => messageLower.includes(kw));
    const hasEsgKeyword = esgKeywords.some(kw => messageLower.includes(kw));
    const hasArbitrageKeyword = arbitrageKeywords.some(kw => messageLower.includes(kw));
    const hasMethodologyKeyword = methodologyKeywords.some(kw => messageLower.includes(kw));
    const hasMaKeyword = maKeywords.some(kw => messageLower.includes(kw));
    const hasIpoKeyword = ipoKeywords.some(kw => messageLower.includes(kw));
    const hasGeopoliticalKeyword = geopoliticalKeywords.some(kw => messageLower.includes(kw));
    const hasTaxKeyword = taxKeywords.some(kw => messageLower.includes(kw));
    const hasGeneralKeyword = generalKeywords.some(kw => messageLower.includes(kw));
    
    // Si question sur un de ces domaines ET pas de ticker explicite → probablement non-ticker
    if ((hasFundKeyword || hasMacroKeyword || hasStrategyKeyword || hasSectorKeyword || 
         hasCryptoKeyword || hasCommodityKeyword || hasForexKeyword || hasBondKeyword ||
         hasRealEstateKeyword || hasPrivateEquityKeyword || hasCalculationKeyword ||
         hasRegulatoryKeyword || hasEsgKeyword || hasArbitrageKeyword || hasMethodologyKeyword ||
         hasMaKeyword || hasIpoKeyword || hasGeopoliticalKeyword || hasTaxKeyword || hasGeneralKeyword)) {
      // Vérifier s'il y a un ticker explicite (ex: "AAPL", "MSFT")
      const explicitTickerPattern = /\b([A-Z]{2,5})\b/g;
      const explicitMatches = message.match(explicitTickerPattern) || [];
      const hasExplicitTicker = explicitMatches.some(match => {
        const upper = match.toUpperCase();
        return !this.COMMON_WORDS.includes(upper) && 
               upper.length >= 2 && 
               upper.length <= 5 &&
               /^[A-Z]+$/.test(upper);
      });
      
      // Si pas de ticker explicite → question non-ticker
      if (!hasExplicitTicker) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Valide qu'un ticker est dans un contexte approprié
   * Un ticker valide doit être:
   * - Après une commande (ANALYSE, PRIX, etc.)
   * - Avant/après "VS", "OU", "ET"
   * - Entre guillemets
   * - Isolé (pas dans un mot français)
   */
  static isTickerInValidContext(message, ticker, tickerIndex) {
    const messageLower = message.toLowerCase();
    const tickerLower = ticker.toLowerCase();
    
    // Contextes valides pour un ticker
    const validContexts = [
      // Après commandes
      /(analyse|prix|rsi|macd|fondamentaux|technique|comparer|news|actualites)\s+[A-Z]{2,5}/i,
      // Avant/après comparaison
      /[A-Z]{2,5}\s+(vs|versus|ou|et)\s+[A-Z]{2,5}/i,
      /[A-Z]{2,5}\s+(vs|versus|ou|et)\s+[A-Z]{2,5}/i,
      // Entre guillemets
      /"[A-Z]{2,5}"/i,
      // Après deux-points
      /:\s*[A-Z]{2,5}/i,
      // En début de phrase (après majuscule)
      /^[A-Z]{2,5}\s/i
    ];
    
    // Vérifier si le ticker est dans un contexte valide
    const beforeTicker = message.substring(0, tickerIndex);
    const afterTicker = message.substring(tickerIndex + ticker.length);
    const context = beforeTicker + '[' + ticker + ']' + afterTicker;
    
    return validContexts.some(pattern => pattern.test(context));
  }

  /**
   * Extrait tickers d'un message texte
   * ⚠️ AMÉLIORATION: Validation contextuelle stricte pour éviter faux positifs
   *
   * @param {string} message - Message à analyser
   * @param {object} options - Options extraction
   * @param {boolean} options.includeCompanyNames - Chercher noms compagnies (default: true)
   * @param {boolean} options.filterCommonWords - Filtrer faux positifs (default: true)
   * @param {boolean} options.strictContext - Validation contextuelle stricte (default: false)
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
      filterCommonWords = true,
      strictContext = false
    } = options;

    // ✅ DÉTECTION PRÉALABLE: Questions non-ticker
    if (this.isNonTickerQuestion(message)) {
      console.log(`[TickerExtractor] Question non-ticker détectée, extraction limitée`);
      // Pour questions non-ticker, seulement chercher noms de compagnies explicites
      if (!includeCompanyNames) {
        return [];
      }
    }

    const tickers = new Set();
    const messageLower = message.toLowerCase();
    const messageUpper = message.toUpperCase();

    // 1. Extraction par regex (tickers explicites en MAJUSCULES)
    const matches = [...message.matchAll(this.TICKER_REGEX)] || [];

    matches.forEach(match => {
      const ticker = match[0];
      const tickerIndex = match.index;
      
      // Filtrer faux positifs (mots communs)
      if (filterCommonWords && this.COMMON_WORDS.includes(ticker)) {
        return;
      }
      
      // ✅ VALIDATION CONTEXTUELLE STRICTE (si activée)
      if (strictContext && !this.isTickerInValidContext(message, ticker, tickerIndex)) {
        console.log(`[TickerExtractor] Ticker "${ticker}" ignoré (contexte invalide)`);
        return;
      }
      
      tickers.add(ticker);
    });

    // ✅ FIX: Chercher tickers en minuscules (ex: "analyse msft")
    // Mais seulement si le message contient des commandes ou contextes appropriés
    const hasCommandContext = /(analyse|prix|rsi|macd|fondamentaux|technique|comparer|news|actualites|ticker|action|stock)/i.test(messageLower);
    
    if (hasCommandContext) {
      const lowerMatches = [...messageUpper.matchAll(this.TICKER_REGEX)] || [];
      lowerMatches.forEach(match => {
        const ticker = match[0];
        
        // Only add if not already found and not a common word
        if (!tickers.has(ticker) && (!filterCommonWords || !this.COMMON_WORDS.includes(ticker))) {
          // Validation contextuelle si activée
          if (!strictContext || this.isTickerInValidContext(message, ticker, match.index)) {
            tickers.add(ticker);
          }
        }
      });
    }

    // 2. Mapping noms compagnies → tickers (plus fiable que regex)
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
