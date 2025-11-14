/**
 * HYBRID INTENT ANALYZER
 * Optimise la compréhension d'intention avec approche hybride:
 * - 70% des requêtes: Analyse locale (rapide, 0 coût)
 * - 30% des requêtes: LLM Gemini gratuit (précis pour cas ambigus)
 *
 * Performances:
 * - Requête claire: ~50ms (local)
 * - Requête ambiguë: ~800ms (Gemini)
 * - Moyenne: ~300ms (vs 1.5s avec Perplexity systématique)
 */

import { TickerExtractor } from './utils/ticker-extractor.js';
import { geminiFetchWithRetry } from './utils/gemini-retry.js';

export class HybridIntentAnalyzer {
    constructor() {
        // NOTE: companyToTicker mapping now centralized in TickerExtractor utility
        // Keeping reference for backward compatibility
        this.companyToTicker = {
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
            'coca-cola': 'KO',
            'coca cola': 'KO',
            'mcdonalds': 'MCD',
            "mcdonald's": 'MCD',
            'nike': 'NKE',
            'visa': 'V',
            'walmart': 'WMT',
            'boeing': 'BA',
            'jpmorgan': 'JPM',
            'johnson': 'JNJ',
            'procter': 'PG',
            'bank of america': 'BAC',
            // Compagnies technologiques et services
            'accenture': 'ACN',
            'ibm': 'IBM',
            'oracle': 'ORCL',
            'salesforce': 'CRM',
            'adobe': 'ADBE',
            'cisco': 'CSCO',
            'qualcomm': 'QCOM',
            // Finance
            'goldman sachs': 'GS',
            'morgan stanley': 'MS',
            'wells fargo': 'WFC',
            'citigroup': 'C',
            'american express': 'AXP',
            'mastercard': 'MA',
            'paypal': 'PYPL',
            // Industrie et énergie
            'exxon': 'XOM',
            'chevron': 'CVX',
            'general electric': 'GE',
            'caterpillar': 'CAT',
            '3m': 'MMM',
            // Santé et pharma
            'pfizer': 'PFE',
            'merck': 'MRK',
            'abbvie': 'ABBV',
            'bristol myers': 'BMY',
            'eli lilly': 'LLY',
            'unitedhealth': 'UNH',
            // Commerce et consommation
            'costco': 'COST',
            'home depot': 'HD',
            'target': 'TGT',
            'starbucks': 'SBUX',
            'pepsi': 'PEP',
            'pepsico': 'PEP',
            'mondelez': 'MDLZ'
        };

        // Patterns d'intention avec keywords (ENRICHISSEMENT MASSIF)
        this.intentPatterns = {
            greeting: {
                keywords: ['bonjour', 'salut', 'hello', 'hi', 'bonsoir', 'hey', 'coucou', 'good morning', 'bonne journée', 'ça va'],
                confidence: 0.99
            },
            help: {
                keywords: ['aide', 'help', 'comment', 'peux-tu', 'capable', 'fonctionnalités', 'fonctionnalites', 'que peux-tu faire', 'à quoi sers-tu', 'guide', 'tutoriel', 'documentation', 'explique-moi', 'skills', 'capacités', 'capacites', 'fonctions'],
                confidence: 0.95
            },
            stock_price: {
                keywords: ['prix', 'cours', 'cotation', 'valeur', 'combien', 'coûte', 'coute', 'quote', 'trading at', 'se négocie', 'cote', 'valorisation actuelle', 'prix du marché', 'market price', 'current price'],
                confidence: 0.95
            },
            fundamentals: {
                keywords: ['fondamentaux', 'pe ratio', 'p/e', 'revenus', 'bénéfices', 'marges', 'eps', 'croissance', 'roe', 'roa', 'ratio', 'financials', 'chiffre d\'affaires', 'cash flow', 'flux de trésorerie', 'bilans', 'santé financière', 'profitabilité', 'rentabilité', 'dette', 'endettement', 'actifs', 'passifs', 'capitaux propres', 'ebitda', 'bpa', 'dividendes', 'rendement'],
                confidence: 0.9
            },
            technical_analysis: {
                keywords: ['technique', 'rsi', 'macd', 'support', 'résistance', 'resistance', 'moyennes mobiles', 'sma', 'ema', 'tendance', 'trend', 'bollinger', 'stochastic', 'fibonacci', 'volume', 'momentum', 'oscillateur', 'graphique', 'chart', 'candlestick', 'chandeliers', 'breakout', 'cassure', 'setup', 'pattern', 'triangle', 'tête et épaules'],
                confidence: 0.9
            },
            news: {
                keywords: ['actualités', 'actualites', 'nouvelles', 'news ', ' news', "qu'est-ce qui se passe", 'quoi de neuf', 'dernières infos', 'événements', 'evenements', 'breaking', 'annonces', 'communiqué', 'presse', 'médias', 'headlines', 'titres', 'flash info', 'update', 'dernières nouvelles', 'infos récentes'],
                confidence: 0.95
            },
            comprehensive_analysis: {
                keywords: ['analyse complète', 'analyse complete', 'analyse', 'évaluation', 'evaluation', 'rapport', 'due diligence', 'deep dive', 'étude approfondie', 'assessment', 'overview', 'vue d\'ensemble', 'complet', 'détaillé', 'exhaustif', 'panorama'],
                confidence: 0.9
            },
            comparative_analysis: {
                keywords: ['vs', 'versus', 'comparer', 'comparaison', 'mieux', 'différence', 'difference', 'ou', 'plutôt', 'meilleur', 'benchmark', 'face à', 'par rapport à', 'comparativement', 'versus', 'contre'],
                confidence: 0.85
            },
            earnings: {
                keywords: ['résultats', 'resultats', 'earnings', 'trimestriels', 'annuels', 'rapport financier', 'quarterly', 'q1', 'q2', 'q3', 'q4', 'publication', 'release', 'guidance', 'prévisions', 'outlook', 'earning call', 'conference', 'conférence résultats'],
                confidence: 0.9
            },
            portfolio: {
                keywords: ['portefeuille', 'portfolio', 'watchlist', 'positions', 'titres', 'mes tickers', 'mes titres', 'ma watchlist', 'ma liste', 'mes actions', 'quels tickers', 'quels titres', 'liste de mes', 'show my', 'liste mes', 'affiche mes', 'quelles actions', 'tickers que je suis', 'mes valeurs', 'mes investissements', 'holdings', 'positions ouvertes', 'diversification', 'exposition'],
                confidence: 0.95
            },
            market_overview: {
                keywords: ['marché', 'marche', 'indices', 'secteurs', 'vue globale', 'situation', 'état du marché', 'market sentiment', 'sentiment', 'tendances macro', 'bourses', 'wall street', 'dow jones', 'nasdaq', 'sp500', 's&p 500', 'tsx', 'cac40', 'secteur technologie', 'rotation sectorielle', 'market breadth'],
                confidence: 0.75
            },
            recommendation: {
                keywords: ['recommandation', 'acheter', 'vendre', 'conserver', 'avis', 'suggestion', 'conseil', 'buy', 'sell', 'hold', 'rating', 'opinion', 'dois-je acheter', 'est-ce un bon moment', 'opportunité', 'attractive', 'fair value', 'juste valeur', 'surévalué', 'sous-évalué', 'undervalued', 'overvalued'],
                confidence: 0.8
            },
            // NOUVEAUX INTENTS: Analyse économique
            economic_analysis: {
                keywords: ['économie', 'economie', 'économique', 'pib', 'gdp', 'inflation', 'taux directeur', 'fed', 'banque centrale', 'politique monétaire', 'monetaire', 'taux d\'intérêt', 'interet', 'chômage', 'chomage', 'emploi', 'récession', 'recession', 'croissance économique', 'indicateurs macro', 'cycle économique', 'expansion', 'contraction', 'stagflation', 'déficit', 'dette publique', 'budget', 'fiscal', 'treasury', 'bonds', 'obligations', 'yield curve', 'courbe des taux', 'taux fed', 'taux inflation', 'taux interet', 'taux banque centrale', 'taux', 'les taux', 'quels taux', 'taux actuels'],
                confidence: 0.95
            },
            // NOUVEAUX INTENTS: Analyse politique/géopolitique
            political_analysis: {
                keywords: ['politique', 'géopolitique', 'geopolitique', 'élections', 'elections', 'gouvernement', 'président', 'president', 'congrès', 'congres', 'sénat', 'senat', 'législation', 'legislation', 'régulation', 'regulation', 'sanctions', 'guerre commerciale', 'trade war', 'tarifs', 'douanes', 'protectionnisme', 'relations internationales', 'tensions', 'conflit', 'stabilité politique', 'politique énergétique', 'opec', 'climat politique', 'réformes', 'reformes'],
                confidence: 0.8
            },
            // NOUVEAUX INTENTS: Stratégie d'investissement
            investment_strategy: {
                keywords: ['stratégie', 'strategie', 'investir', 'placement', 'allocation', 'asset allocation', 'long terme', 'court terme', 'value investing', 'growth investing', 'dividend investing', 'revenus', 'momentum', 'contrarian', 'arbitrage', 'hedging', 'couverture', 'protection', 'risk management', 'gestion des risques', 'rebalancing', 'rééquilibrage', 'reequilibrage', 'dollar cost averaging', 'lump sum', 'strategie ', ' strategie', 'allocation ', ' allocation'],
                confidence: 0.85
            },
            // NOUVEAUX INTENTS: Risk/Volatility
            risk_volatility: {
                keywords: ['risque', 'volatilité', 'volatilite', 'beta', 'alpha', 'sharpe ratio', 'var', 'value at risk', 'drawdown', 'perte maximale', 'écart type', 'standard deviation', 'corrélation', 'correlation', 'diversification', 'exposition', 'concentration', 'hedge', 'protection contre', 'safe haven', 'valeur refuge', 'defensive', 'cyclique'],
                confidence: 0.85
            },
            // NOUVEAUX INTENTS: Secteur/Industrie
            sector_industry: {
                keywords: ['secteur', 'industrie', 'technology', 'tech', 'technologie', 'finance', 'financier', 'énergie', 'energie', 'santé', 'sante', 'healthcare', 'pharma', 'pharmaceutique', 'consommation', 'consumer', 'utilities', 'services publics', 'immobilier', 'real estate', 'telecom', 'télécommunications', 'industriel', 'materials', 'matériaux', 'mining', 'minier', 'automobile', 'retail', 'commerce'],
                confidence: 0.8
            },
            // NOUVEAUX INTENTS: Valuation
            valuation: {
                keywords: ['valorisation', 'valuation', 'fair value', 'juste valeur', 'intrinsic value', 'valeur intrinsèque', 'dcf', 'discounted cash flow', 'multiples', 'peer comparison', 'comparable', 'premium', 'discount', 'décote', 'prime', 'cheap', 'expensive', 'cher', 'bon marché', 'raisonnable', 'attractive', 'target price', 'prix cible', 'objectif'],
                confidence: 0.85
            },
            // NOUVEAUX INTENTS: Stock Screening/Search
            stock_screening: {
                keywords: ['trouve', 'cherche', 'recherche', 'liste', 'suggère', 'suggere', 'recommande', 'identifie', 'screening', 'screener', 'filtre', 'sélection', 'selection', 'top', 'meilleurs', 'meilleures', 'sous-évalué', 'sous-évaluées', 'sous-evaluees', 'surévalué', 'surévaluées', 'undervalued', 'overvalued', 'large cap', 'mid cap', 'small cap', 'dividende', 'croissance', 'value', 'growth', 'momentum'],
                confidence: 0.9
            },
            // NOUVEAUX INTENTS: Forex/Devises
            forex_analysis: {
                keywords: ['forex', 'fx', 'devise', 'devises', 'taux de change', 'exchange rate', 'currency', 'currencies', 'parité', 'cours des devises', 'currency pair', 'usd', 'eur', 'gbp', 'jpy', 'cad', 'chf', 'aud', 'nzd', 'cny', 'dollar', 'euro', 'livre', 'yen', 'franc suisse', 'currency market', 'marché des changes', 'carry trade', 'currency hedging', 'couverture de change', 'currency risk', 'risque de change'],
                confidence: 0.85
            },
            // NOUVEAUX INTENTS: Obligations/Bonds
            bond_analysis: {
                keywords: ['obligations', 'bonds', 'obligation', 'bond', 'corporate bonds', 'government bonds', 'treasury bonds', 'municipal bonds', 'high yield', 'junk bonds', 'investment grade', 'credit rating', 'notation crédit', 'yield', 'rendement obligataire', 'coupon', 'duration', 'convexity', 'yield to maturity', 'ytm', 'fixed income', 'revenu fixe', 'bond market', 'marché obligataire', 'bond index', 'sovereign bonds'],
                confidence: 0.85
            },
            // NOUVEAUX INTENTS: Immobilier/Real Estate
            real_estate: {
                keywords: ['immobilier', 'real estate', 'reit', 'reits', 'fiducie immobilière', 'property', 'commercial real estate', 'residential real estate', 'real estate market', 'marché immobilier', 'cap rate', 'taux de capitalisation', 'noi', 'net operating income', 'real estate investment', 'investissement immobilier', 'real estate portfolio', 'portefeuille immobilier'],
                confidence: 0.8
            },
            // NOUVEAUX INTENTS: Private Equity/VC
            private_equity: {
                keywords: ['private equity', 'capital-investissement', 'venture capital', 'vc', 'capital de risque', 'startup', 'startups', 'unicorn', 'licorne', 'series a', 'series b', 'series c', 'funding round', 'tour de table', 'levée de fonds', 'fundraising', 'valuation startup', 'lbo', 'leveraged buyout', 'mbo', 'management buyout'],
                confidence: 0.8
            },
            // NOUVEAUX INTENTS: Calculs/Simulations
            financial_calculation: {
                keywords: ['calculer', 'calcul', 'simulation', 'simuler', 'scénario', 'scenario', 'projection', 'prévision', 'dcf', 'discounted cash flow', 'van', 'npv', 'irr', 'wacc', 'terminal value', 'sensitivity analysis', 'analyse de sensibilité', 'monte carlo', 'backtesting', 'stress test', 'test de résistance'],
                confidence: 0.85
            },
            // NOUVEAUX INTENTS: Réglementation/Compliance
            regulatory: {
                keywords: ['réglementation', 'regulation', 'compliance', 'conformité', 'sec', 'amf', 'autorité des marchés financiers', 'réglementation financière', 'financial regulation', 'insider trading', 'délit d\'initié', 'market manipulation', 'disclosure', 'divulgation', 'gaap', 'ifrs', 'normes comptables', 'accounting standards'],
                confidence: 0.8
            },
            // NOUVEAUX INTENTS: ESG/Durabilité
            esg: {
                keywords: ['esg', 'environmental social governance', 'durabilité', 'sustainability', 'responsabilité sociale', 'csr', 'rse', 'green bonds', 'obligations vertes', 'sustainable investing', 'investissement durable', 'impact investing', 'climate risk', 'risque climatique', 'transition énergétique', 'renewable energy', 'esg rating', 'notation esg', 'esg score'],
                confidence: 0.85
            },
            // NOUVEAUX INTENTS: Arbitrage/Stratégies Avancées
            arbitrage: {
                keywords: ['arbitrage', 'arbitrage opportunity', 'pairs trading', 'statistical arbitrage', 'market neutral', 'long short', 'hedge fund strategy', 'relative value', 'spread trading', 'mean reversion', 'quantitative strategy', 'algorithmic trading', 'high frequency trading', 'hft'],
                confidence: 0.75
            },
            // NOUVEAUX INTENTS: Méthodologies d'Analyse
            valuation_methodology: {
                keywords: ['méthodologie', 'methodology', 'dcf', 'multiples', 'valuation multiples', 'comparable companies', 'comps', 'peer group', 'precedent transactions', 'sum of parts', 'lbo model', 'financial modeling', 'pro forma', 'sensitivity table', 'valuation methodology', 'asset based valuation', 'income approach', 'market approach'],
                confidence: 0.8
            },
            // NOUVEAUX INTENTS: M&A
            mergers_acquisitions: {
                keywords: ['fusion', 'acquisition', 'm&a', 'merger', 'takeover', 'rachat', 'hostile takeover', 'opa', 'offre publique d\'achat', 'ope', 'merger arbitrage', 'due diligence', 'synergy', 'synergie', 'deal valuation', 'acquisition premium', 'prime d\'acquisition'],
                confidence: 0.85
            },
            // NOUVEAUX INTENTS: IPO
            ipo: {
                keywords: ['ipo', 'introduction en bourse', 'public offering', 'going public', 'entrée en bourse', 'listing', 'cotation', 'ipo pricing', 'ipo valuation', 'underpricing', 'ipo performance', 'lock up period', 'période de blocage', 'roadshow', 'book building'],
                confidence: 0.85
            },
            // NOUVEAUX INTENTS: Gestion de Risque
            risk_management: {
                keywords: ['gestion de risque', 'risk management', 'var', 'value at risk', 'cvar', 'stress testing', 'scenario analysis', 'sensitivity analysis', 'monte carlo', 'risk metrics', 'risk adjusted return', 'sharpe ratio', 'sortino ratio', 'max drawdown', 'tracking error', 'portfolio risk', 'systematic risk', 'tail risk', 'black swan'],
                confidence: 0.85
            },
            // NOUVEAUX INTENTS: Behavioral Finance
            behavioral_finance: {
                keywords: ['behavioral finance', 'finance comportementale', 'psychologie des marchés', 'market psychology', 'investor behavior', 'cognitive bias', 'biais cognitif', 'confirmation bias', 'anchoring', 'overconfidence', 'herd behavior', 'fomo', 'fear of missing out', 'sentiment', 'market sentiment', 'behavioral economics'],
                confidence: 0.75
            },
            // NOUVEAUX INTENTS: Produits Structurés
            structured_products: {
                keywords: ['structured products', 'produits structurés', 'structured note', 'note structurée', 'principal protected', 'capital protégé', 'autocallable', 'autocall', 'barrier option', 'knock in', 'knock out', 'market linked', 'equity linked', 'hybrid product'],
                confidence: 0.75
            },
            // NOUVEAUX INTENTS: Warrants/Convertibles
            warrants_convertibles: {
                keywords: ['warrant', 'warrants', 'certificat', 'certificats', 'call warrant', 'put warrant', 'warrant premium', 'convertible', 'convertibles', 'convertible bond', 'obligation convertible', 'conversion ratio', 'conversion price', 'conversion premium'],
                confidence: 0.75
            }
        };

        // Outils par intention (mapping intelligent)
        this.toolsByIntent = {
            greeting: [], // Pas d'outils nécessaires
            help: [], // Pas d'outils nécessaires
            general_conversation: [], // Pas d'outils nécessaires
            stock_price: ['polygon-stock-price', 'finnhub-news'],
            fundamentals: ['fmp-fundamentals', 'alpha-vantage-ratios', 'polygon-stock-price'],
            technical_analysis: ['twelve-data-technical', 'polygon-stock-price'],
            news: ['finnhub-news', 'polygon-stock-price'],
            comprehensive_analysis: ['fmp-fundamentals', 'polygon-stock-price', 'finnhub-news', 'twelve-data-technical', 'analyst-recommendations'],
            comparative_analysis: ['fmp-fundamentals', 'polygon-stock-price', 'finnhub-news'],
            earnings: ['earnings-calendar', 'fmp-fundamentals', 'finnhub-news'],
            portfolio: ['supabase-watchlist', 'polygon-stock-price'],
            market_overview: ['polygon-stock-price', 'finnhub-news', 'economic-calendar'],
            recommendation: ['fmp-fundamentals', 'analyst-recommendations', 'polygon-stock-price', 'finnhub-news'],
            // Nouveaux intents
            economic_analysis: ['economic-calendar', 'finnhub-news', 'polygon-stock-price'],
            political_analysis: ['finnhub-news', 'polygon-stock-price'],
            investment_strategy: ['fmp-fundamentals', 'analyst-recommendations', 'polygon-stock-price', 'finnhub-news'],
            risk_volatility: ['fmp-fundamentals', 'twelve-data-technical', 'polygon-stock-price'],
            sector_industry: ['fmp-fundamentals', 'polygon-stock-price', 'finnhub-news'],
            valuation: ['fmp-fundamentals', 'analyst-recommendations', 'polygon-stock-price'],
            stock_screening: ['stock-screener'] // Recherche intelligente avec Perplexity + validation FMP
        };
    }

    /**
     * Point d'entrée principal - Analyse hybride
     */
    async analyze(userMessage, context = {}) {
        const startTime = Date.now();

        // 0. DÉTECTION PRÉCOCE: Expressions émotionnelles et informations (pas d'analyse financière)
        const preFilterResult = this._preFilterNonFinancial(userMessage, context);
        if (preFilterResult) {
            console.log(`🎭 Pre-filter détecté: ${preFilterResult.intent}`);
            preFilterResult.execution_time_ms = Date.now() - startTime;
            preFilterResult.analysis_method = 'pre_filter';
            return preFilterResult;
        }

        // 1. Évaluer la clarté de la requête
        const clarityScore = this._assessClarity(userMessage, context);

        console.log(`🧠 Clarity score: ${clarityScore.toFixed(2)}/10`);

        // 2. EXCEPTION SPÉCIALE: Forcer analyse locale pour requêtes de portfolio/watchlist
        // Ces requêtes sont toujours simples et directes, pas besoin de LLM
        const messageLower = userMessage.toLowerCase();
        const portfolioKeywords = ['liste mes', 'mes tickers', 'ma watchlist', 'mes titres', 'ma liste', 'watchlist', 'portefeuille', 'quels tickers'];
        const isPortfolioRequest = portfolioKeywords.some(kw => messageLower.includes(kw));

        if (isPortfolioRequest) {
            console.log('📊 Portfolio request detected - forcing LOCAL analysis (no LLM needed)');
            let intentData = this._analyzeLocal(userMessage, context);
            intentData.execution_time_ms = Date.now() - startTime;
            intentData.analysis_method = 'local_forced';
            return intentData;
        }

        // 3. Route selon clarité pour autres requêtes
        let intentData;

        if (clarityScore >= 9) {
            // Analyse locale SEULEMENT si TRÈS clair (20% des cas)
            console.log('⚡ Using LOCAL intent analysis (crystal clear query)');
            intentData = this._analyzeLocal(userMessage, context);
        } else {
            // LLM par défaut (80% des cas) - Meilleure précision et rigueur
            console.log('🤖 Using LLM intent analysis (rigorous analysis)');
            intentData = await this._analyzeWithLLM(userMessage, context);
        }

        const executionTime = Date.now() - startTime;
        console.log(`✅ Intent analyzed in ${executionTime}ms`);

        intentData.execution_time_ms = executionTime;
        intentData.analysis_method = clarityScore >= 9 ? 'local' : 'llm';

        return intentData;
    }

    /**
     * Filtre précoce pour détecter les messages non-financiers
     * Évite d'analyser des expressions émotionnelles, emails, etc. comme des symboles boursiers
     */
    _preFilterNonFinancial(userMessage, context) {
        const messageTrimmed = userMessage.trim();
        const messageLower = messageTrimmed.toLowerCase();
        const wordCount = messageTrimmed.split(/\s+/).length;

        // 1. DÉTECTION: Expressions émotionnelles simples (1-3 mots)
        // "Wow", "Super", "Incroyable", "Merci", etc.
        const emotionalExpressions = [
            'wow', 'super', 'incroyable', 'génial', 'genial', 'fantastique', 'excellent',
            'merci', 'thanks', 'thank you', 'ok', 'okay', 'd\'accord', 'daccord',
            'parfait', 'cool', 'nice', 'great', 'awesome', 'amazing', 'bravo',
            'félicitations', 'felicitations', 'congratulations', 'bien', 'bon',
            'oui', 'non', 'yes', 'no', 'si', 'peut-être', 'peut etre', 'maybe',
            'ah', 'oh', 'eh', 'haha', 'lol', 'mdr', 'hihi', 'héhé', 'hehe',
            'salut', 'hello', 'hi', 'hey', 'coucou', 'bonjour', 'bonsoir'
        ];

        // Si le message est juste une expression émotionnelle (1-3 mots)
        if (wordCount <= 3) {
            const isEmotional = emotionalExpressions.some(expr => {
                // Correspondance exacte ou avec ponctuation
                const regex = new RegExp(`^${expr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[!?.]*$`, 'i');
                return regex.test(messageTrimmed);
            });

            if (isEmotional) {
                console.log(`🎭 Expression émotionnelle détectée: "${messageTrimmed}"`);
                return {
                    intent: 'general_conversation',
                    tickers: [],
                    confidence: 0.95,
                    needs_clarification: false,
                    response_type: 'conversational',
                    message: messageTrimmed,
                    // Indiquer qu'Emma doit répondre de manière conversationnelle, pas analyser
                    skip_financial_analysis: true
                };
            }
        }

        // 2. DÉTECTION: Emails (format email@domain.com)
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
        if (emailPattern.test(messageTrimmed)) {
            console.log(`📧 Email détecté: "${messageTrimmed}"`);
            return {
                intent: 'information_provided',
                tickers: [],
                confidence: 0.99,
                needs_clarification: false,
                response_type: 'acknowledgment',
                message: messageTrimmed,
                information_type: 'email',
                // Indiquer qu'Emma doit confirmer la réception, pas analyser
                skip_financial_analysis: true
            };
        }

        // 3. DÉTECTION: Messages très courts sans contexte financier
        // Si message < 5 mots ET pas de ticker ET pas de mot-clé financier
        if (wordCount < 5) {
            const extractedTickers = this._extractTickers(userMessage);
            const hasFinancialKeywords = Object.values(this.intentPatterns).some(config => 
                config.keywords.some(kw => messageLower.includes(kw))
            );

            // Si pas de ticker ET pas de mot-clé financier → probablement conversationnel
            if (extractedTickers.length === 0 && !hasFinancialKeywords) {
                // Vérifier si c'est une question simple ou une affirmation
                const isSimpleQuestion = /^(qui|quoi|quand|où|comment|pourquoi|combien|est-ce|es-tu|peux-tu|peut-on)/i.test(messageTrimmed);
                const isSimpleStatement = !/[?]/.test(messageTrimmed) && wordCount <= 3;

                if (isSimpleQuestion || isSimpleStatement) {
                    console.log(`💬 Message conversationnel court détecté: "${messageTrimmed}"`);
                    return {
                        intent: 'general_conversation',
                        tickers: [],
                        confidence: 0.85,
                        needs_clarification: false,
                        response_type: 'conversational',
                        message: messageTrimmed,
                        skip_financial_analysis: true
                    };
                }
            }
        }

        // 4. DÉTECTION: Noms propres (pas des tickers)
        // Si le message contient un nom qui ressemble à un ticker mais est clairement un nom
        // Ex: "Wow" pourrait être confondu avec un ticker, mais c'est une expression
        const commonNames = ['wow', 'super', 'nice', 'cool', 'great', 'ok', 'okay'];
        if (wordCount === 1 && commonNames.includes(messageLower)) {
            console.log(`👤 Nom commun détecté (pas un ticker): "${messageTrimmed}"`);
            return {
                intent: 'general_conversation',
                tickers: [],
                confidence: 0.9,
                needs_clarification: false,
                response_type: 'conversational',
                message: messageTrimmed,
                skip_financial_analysis: true
            };
        }

        // Aucun filtre activé → continuer l'analyse normale
        return null;
    }

    /**
     * Évalue la clarté de la requête (0-10)
     * ≥9: Analyse locale suffisante (très clair)
     * <9: Nécessite LLM (meilleure précision)
     * 
     * ✅ AMÉLIORATION: Détection précoce des cas non-financiers
     */
    _assessClarity(userMessage, context) {
        let score = 5; // Base neutre
        const messageLower = userMessage.toLowerCase();
        const messageTrimmed = userMessage.trim();
        const wordCount = messageTrimmed.split(/\s+/).length;

        // ✅ BOOST +5: Cas très clairs (expressions émotionnelles, emails) → Score 10
        // Ces cas sont déjà gérés par pre-filter, mais on boost le score pour éviter LLM
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
        if (emailPattern.test(messageTrimmed)) {
            return 10; // Email → très clair, pas besoin LLM
        }

        const emotionalExpressions = ['wow', 'super', 'merci', 'thanks', 'ok', 'okay', 'parfait', 'cool', 'nice', 'great'];
        if (wordCount <= 3 && emotionalExpressions.some(expr => {
            const regex = new RegExp(`^${expr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[!?.]*$`, 'i');
            return regex.test(messageTrimmed);
        })) {
            return 10; // Expression émotionnelle → très clair, pas besoin LLM
        }

        // BOOST +2: Tickers explicites
        if (this._extractTickers(userMessage).length > 0) {
            score += 2;
        }

        // BOOST +2: Intention claire (keywords directs)
        let intentMatched = false;
        for (const [intent, config] of Object.entries(this.intentPatterns)) {
            if (config.keywords.some(kw => messageLower.includes(kw))) {
                score += 2;
                intentMatched = true;
                break;
            }
        }

        // BOOST +1: Contexte disponible
        if (context.tickers && context.tickers.length > 0) {
            score += 1;
        }

        // MALUS -3: Question vague
        const vaguePatterns = [
            /qu'est-ce que/,
            /pourquoi/,
            /comment ça/,
            /explique/,
            /c'est quoi/,
            /ça veut dire quoi/
        ];
        if (vaguePatterns.some(pattern => pattern.test(messageLower))) {
            score -= 3;
        }

        // MALUS -2: Trop court (<5 mots) ET pas de ticker ET pas d'intent clair
        if (wordCount < 5 && this._extractTickers(userMessage).length === 0 && !intentMatched) {
            score -= 2;
        }

        // MALUS -1: Trop long (>20 mots) sans structure claire
        if (wordCount > 20 && !intentMatched) {
            score -= 1;
        }

        // Clamp entre 0-10
        return Math.max(0, Math.min(10, score));
    }

    /**
     * Analyse LOCALE (rapide, 20% des cas)
     */
    _analyzeLocal(userMessage, context) {
        const messageLower = userMessage.toLowerCase();

        // 🎯 NOUVEAU: Détection commande avec slash (/)
        // Si message commence par "/", c'est une COMMANDE → retirer le slash pour analyse
        const isCommand = userMessage.trim().startsWith('/');
        const cleanMessage = isCommand ? userMessage.trim().substring(1) : userMessage;
        const cleanMessageLower = cleanMessage.toLowerCase().trim();

        if (isCommand) {
            console.log(`🎯 Commande détectée: /${cleanMessage}`);
        }

        // 🎯 DÉTECTION SPÉCIALE: Commandes simples (avec ou sans slash)
        // Si 1 seul mot correspondant à un intent, forcer l'intent
        if (!cleanMessage.includes(' ')) {
            const singleWordIntents = {
                'news': 'news',
                'actualites': 'news',
                'taux': 'economic_analysis',
                'fed': 'economic_analysis',
                'indices': 'market_overview',
                'marche': 'market_overview',
                'help': 'help',
                'aide': 'help',
                'skills': 'help'
            };
            
            if (singleWordIntents[cleanMessageLower]) {
                console.log(`🎯 Commande simple détectée: ${isCommand ? '/' : ''}${cleanMessageLower} → ${singleWordIntents[cleanMessageLower]}`);
                const intent = singleWordIntents[cleanMessageLower];
                return {
                    intent: intent,
                    confidence: 0.99,
                    tickers: [],
                    suggested_tools: [],
                    parameters: {},
                    needs_clarification: false,
                    clarification_questions: [],
                    user_intent_summary: `L'utilisateur utilise la commande ${isCommand ? '/' : ''}${cleanMessageLower}`,
                    recency_filter: 'day',
                    execution_time_ms: 0,
                    analysis_method: 'single_word_command'
                };
            }
        }

        // 1. PRIORISER: Détecter l'intention AVANT d'extraire les tickers
        let detectedIntent = 'general_conversation'; // Default: conversation générale
        let maxScore = 0;

        for (const [intent, config] of Object.entries(this.intentPatterns)) {
            const matchCount = config.keywords.filter(kw => cleanMessageLower.includes(kw)).length;
            if (matchCount > maxScore) {
                maxScore = matchCount;
                detectedIntent = intent;
            }
        }

        // 2. Extraire les tickers APRÈS avoir détecté l'intent
        // ✅ Extraire tickers du message NETTOYÉ (sans slash)
        let tickers = this._extractTickers(cleanMessage);

        // 🛡️ PROTECTION: Si intent détecté avec high confidence, filtrer les faux tickers
        const intentKeywords = this.intentPatterns[detectedIntent]?.keywords || [];
        tickers = tickers.filter(ticker => {
            const tickerLower = ticker.toLowerCase();
            // Ne pas garder un "ticker" qui est en fait un mot-clé d'intent
            return !intentKeywords.some(kw => kw.trim().toLowerCase() === tickerLower);
        });

        // ✅ FIX BUG 4: Si aucun ticker dans message actuel, chercher dans l'historique récent
        // 🛡️ PROTECTION: Ne pas chercher dans l'historique si intent ne nécessite PAS de ticker
        const intentsWithoutTickers = ['greeting', 'help', 'general_conversation', 'market_overview', 'economic_analysis', 'political_analysis', 'investment_strategy', 'portfolio', 'stock_screening'];
        const shouldCheckHistory = !intentsWithoutTickers.includes(detectedIntent);
        
        if (tickers.length === 0 && shouldCheckHistory && context.conversationHistory && context.conversationHistory.length > 0) {
            console.log('🔍 No tickers in current message, checking conversation history...');
            // Chercher dans les 3 derniers messages utilisateur
            const recentUserMessages = context.conversationHistory
                .filter(msg => msg.role === 'user')
                .slice(-3); // 3 derniers messages utilisateur

            for (const msg of recentUserMessages) {
                const historyTickers = this._extractTickers(msg.content);
                if (historyTickers.length > 0) {
                    tickers = historyTickers;
                    console.log(`✅ Found tickers in history: ${tickers.join(', ')}`);
                    break; // Utiliser les tickers du message le plus récent qui en contient
                }
            }
        } else if (tickers.length === 0 && !shouldCheckHistory) {
            console.log(`🛡️ Intent "${detectedIntent}" ne nécessite pas de ticker - pas de recherche historique`);
        }

        // ✅ DÉTECTION SPÉCIALE: Requêtes de screening/recherche
        // Si keywords de screening MAIS pas de tickers spécifiques → stock_screening
        const screeningKeywords = ['trouve', 'cherche', 'recherche', 'liste', 'suggère', 'suggere', 'recommande', 'identifie', 'screening', 'screener', 'top', 'meilleurs', 'meilleures'];
        const hasScreeningKeyword = screeningKeywords.some(kw => messageLower.includes(kw));
        
        if (hasScreeningKeyword && tickers.length === 0) {
            console.log('🔍 Stock screening request detected (no specific tickers)');
            detectedIntent = 'stock_screening';
            maxScore = 10; // Force high score
        }

        // Ajustements spéciaux
        // Si on a des tickers MAIS aucun intent détecté, alors stock_price
        if (tickers.length > 0 && maxScore === 0) {
            detectedIntent = 'stock_price';
        }
        // Si plusieurs tickers, c'est probablement une comparaison
        if (tickers.length > 1 && detectedIntent !== 'stock_screening') {
            detectedIntent = 'comparative_analysis';
        }

        // 3. Suggérer les outils
        const suggestedTools = this.toolsByIntent[detectedIntent] || ['polygon-stock-price'];

        // 4. Construire le résultat
        const financialIntents = ['stock_price', 'fundamentals', 'technical_analysis', 'news',
                                 'comprehensive_analysis', 'comparative_analysis', 'earnings', 'recommendation'];
        const needsTicker = financialIntents.includes(detectedIntent) && tickers.length === 0;

        const confidence = this.intentPatterns[detectedIntent]?.confidence || 0.7;

        // ✅ CLARIFICATIONS ACTIVÉES - Demander des précisions si confidence < 0.5
        const needsClarification = confidence < 0.5;
        const clarificationQuestions = needsClarification ? this._generateClarificationQuestions(detectedIntent, userMessage, tickers) : [];

        const intentData = {
            intent: detectedIntent,
            confidence: confidence,
            tickers: tickers,
            suggested_tools: suggestedTools,
            parameters: this._extractParameters(userMessage, detectedIntent),
            needs_clarification: needsClarification,
            clarification_questions: clarificationQuestions,
            user_intent_summary: this._summarizeIntent(detectedIntent, tickers),
            recency_filter: this._getRecencyFilter(detectedIntent)
        };

        return intentData;
    }

    /**
     * Analyse avec LLM (Gemini gratuit) pour cas ambigus (80% des cas)
     */
    async _analyzeWithLLM(userMessage, context) {
        try {
            const prompt = this._buildLLMPrompt(userMessage, context);

            // Appel Gemini gratuit (pas Perplexity pour économiser)
            const response = await this._callGemini(prompt);

            // Parser la réponse JSON avec validation robuste
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.warn('⚠️ LLM analysis failed to return JSON, falling back to local');
                return this._analyzeLocal(userMessage, context);
            }

            let intentData;
            try {
                intentData = JSON.parse(jsonMatch[0]);
            } catch (parseError) {
                console.warn('⚠️ LLM analysis returned invalid JSON, falling back to local:', parseError.message);
                return this._analyzeLocal(userMessage, context);
            }

            // ✅ VALIDATION: S'assurer que les champs essentiels existent
            if (!intentData.intent) {
                console.warn('⚠️ LLM analysis missing intent field, falling back to local');
                return this._analyzeLocal(userMessage, context);
            }

            // Normaliser les champs optionnels
            intentData.tickers = intentData.tickers || [];
            intentData.confidence = intentData.confidence || 0.7;
            intentData.needs_clarification = intentData.needs_clarification || false;
            intentData.suggested_tools = intentData.suggested_tools || [];
            intentData.parameters = intentData.parameters || {};
            intentData.skip_financial_analysis = intentData.skip_financial_analysis || false;

            // ✅ SEUILS DE CONFIANCE DYNAMIQUES (amélioration Phase 1)
            const dynamicThresholds = {
                general_conversation: 0.7,      // Plus permissif pour conversation
                information_provided: 0.9,      // Très strict pour emails/infos
                greeting: 0.8,                  // Strict pour salutations
                help: 0.8,                      // Strict pour aide
                stock_price: 0.8,               // Strict pour actions financières
                fundamentals: 0.85,             // Très strict pour analyses
                technical_analysis: 0.85,       // Très strict pour analyses
                comprehensive_analysis: 0.85,   // Très strict pour analyses complexes
                news: 0.8,                      // Strict pour actualités
                comparative_analysis: 0.85,     // Très strict pour comparaisons
                earnings: 0.8,                  // Strict pour résultats
                portfolio: 0.9,                 // Très strict pour portfolio
                market_overview: 0.75,          // Permissif pour vue marché
                recommendation: 0.85,           // Très strict pour recommandations
                stock_screening: 0.8            // Strict pour screening
            };

            // Ajuster needs_clarification selon seuil dynamique
            const threshold = dynamicThresholds[intentData.intent] || 0.8;
            if (intentData.confidence < threshold) {
                // Seulement demander clarification si vraiment nécessaire
                const financialIntents = ['stock_price', 'fundamentals', 'technical_analysis', 'news',
                                         'comprehensive_analysis', 'comparative_analysis', 'earnings', 'recommendation'];
                if (financialIntents.includes(intentData.intent) && (!intentData.tickers || intentData.tickers.length === 0)) {
                    intentData.needs_clarification = true;
                    console.log(`⚠️ Confidence ${intentData.confidence} < seuil ${threshold} pour intent ${intentData.intent} - clarification nécessaire`);
                }
            }

            // Ajouter recency_filter
            intentData.recency_filter = this._getRecencyFilter(intentData.intent);

            return intentData;

        } catch (error) {
            console.error('❌ LLM intent analysis failed:', error.message);
            // Fallback gracieux vers analyse locale
            return this._analyzeLocal(userMessage, context);
        }
    }

    /**
     * Extraction intelligente de tickers
     */
    _extractTickers(userMessage) {
        // Delegate to centralized TickerExtractor utility
        return TickerExtractor.extract(userMessage, {
            includeCompanyNames: true,
            filterCommonWords: true
        });
    }

    /**
     * Extraction de paramètres supplémentaires
     */
    _extractParameters(userMessage, intent) {
        const params = {};
        const messageLower = userMessage.toLowerCase();

        // Timeframe pour analyse technique
        if (intent === 'technical_analysis') {
            if (messageLower.includes('journalier') || messageLower.includes('jour')) {
                params.timeframe = 'daily';
            } else if (messageLower.includes('hebdo') || messageLower.includes('semaine')) {
                params.timeframe = 'weekly';
            } else if (messageLower.includes('heure')) {
                params.timeframe = 'hourly';
            } else {
                params.timeframe = 'daily'; // Default
            }
        }

        // Période pour earnings/résultats
        if (intent === 'earnings') {
            if (messageLower.includes('q1')) params.quarter = 'Q1';
            else if (messageLower.includes('q2')) params.quarter = 'Q2';
            else if (messageLower.includes('q3')) params.quarter = 'Q3';
            else if (messageLower.includes('q4')) params.quarter = 'Q4';

            const yearMatch = messageLower.match(/20\d{2}/);
            if (yearMatch) params.year = parseInt(yearMatch[0]);
        }

        // Type d'analyse
        params.analysis_type = intent === 'comprehensive_analysis' ? 'comprehensive' : 'quick';

        return params;
    }

    /**
     * Résumé de l'intention en français
     */
    _summarizeIntent(intent, tickers) {
        const tickerStr = tickers.length > 0 ? tickers.join(', ') : 'non spécifié';

        const summaries = {
            greeting: `L'utilisateur salue Emma`,
            help: `L'utilisateur demande de l'aide ou des informations sur les capacités`,
            general_conversation: `L'utilisateur engage une conversation générale`,
            stock_price: `L'utilisateur veut le prix actuel de ${tickerStr}`,
            fundamentals: `L'utilisateur veut les données fondamentales de ${tickerStr}`,
            technical_analysis: `L'utilisateur veut une analyse technique de ${tickerStr}`,
            news: `L'utilisateur veut les actualités récentes de ${tickerStr}`,
            comprehensive_analysis: `L'utilisateur veut une analyse complète de ${tickerStr}`,
            comparative_analysis: `L'utilisateur veut comparer ${tickerStr}`,
            earnings: `L'utilisateur veut les résultats financiers de ${tickerStr}`,
            portfolio: `L'utilisateur veut voir son portefeuille`,
            market_overview: `L'utilisateur veut un aperçu général du marché`,
            recommendation: `L'utilisateur veut une recommandation pour ${tickerStr}`,
            stock_screening: `L'utilisateur cherche des actions selon des critères spécifiques`
        };

        return summaries[intent] || `Conversation générale`;
    }

    /**
     * Filtre de recency intelligent par type d'intention
     */
    _getRecencyFilter(intent) {
        const recencyMap = {
            greeting: 'none',              // Pas de recency
            help: 'none',                  // Pas de recency
            general_conversation: 'none',  // Pas de recency
            stock_price: 'hour',           // Prix: dernière heure
            news: 'day',                   // News: dernier jour
            earnings: 'month',             // Earnings: dernier mois
            market_overview: 'day',        // Marché: dernier jour
            fundamentals: 'month',         // Fondamentaux: dernier mois
            technical_analysis: 'week',    // Technique: dernière semaine
            comprehensive_analysis: 'month', // Complet: dernier mois
            comparative_analysis: 'month', // Comparaison: dernier mois
            portfolio: 'day',              // Portfolio: dernier jour
            recommendation: 'month',       // Recommandation: dernier mois
            stock_screening: 'week'        // Screening: dernière semaine
        };

        return recencyMap[intent] || 'month'; // Default: month
    }

    /**
     * Construction du prompt pour Gemini (LLM gratuit)
     */
    _buildLLMPrompt(userMessage, context) {
        // Construire contexte conversationnel enrichi (5-10 derniers messages)
        const conversationHistory = context.conversationHistory || [];
        const recentContext = conversationHistory
            .slice(-10)
            .map(msg => `${msg.role === 'user' ? 'Utilisateur' : 'Emma'}: ${msg.content}`)
            .join('\n');

        // Few-shot examples pour améliorer la compréhension
        const fewShotExamples = `
═══════════════════════════════════════════════════════════════
EXEMPLES DE DÉTECTION D'INTENTION (Few-Shot Learning)
═══════════════════════════════════════════════════════════════

Exemple 1:
Message: "Wow"
Raisonnement:
  Étape 1: Expression émotionnelle détectée ("Wow")
  Étape 2: Pas de mots-clés financiers
  Étape 3: Pas de tickers
  Étape 4: Intent = general_conversation, skip_financial_analysis = true
Résultat: {
  "intent": "general_conversation",
  "tickers": [],
  "confidence": 0.95,
  "needs_clarification": false,
  "skip_financial_analysis": true,
  "reasoning": "Expression émotionnelle, pas de demande financière"
}

Exemple 2:
Message: "marie.dubois@email.com"
Raisonnement:
  Étape 1: Format email détecté (email@domain.com)
  Étape 2: Pas un symbole boursier
  Étape 3: Intent = information_provided
Résultat: {
  "intent": "information_provided",
  "tickers": [],
  "confidence": 0.99,
  "needs_clarification": false,
  "skip_financial_analysis": true,
  "information_type": "email",
  "reasoning": "Email fourni, pas un symbole boursier"
}

Exemple 3:
Message: "Analyse Apple"
Raisonnement:
  Étape 1: Mot-clé "Analyse" détecté → comprehensive_analysis
  Étape 2: "Apple" → mapping vers AAPL
  Étape 3: Intent clair avec ticker
Résultat: {
  "intent": "comprehensive_analysis",
  "tickers": ["AAPL"],
  "confidence": 0.95,
  "needs_clarification": false,
  "suggested_tools": ["fmp-fundamentals", "polygon-stock-price", "finnhub-news"],
  "reasoning": "Demande d'analyse complète avec nom de compagnie identifié"
}

Exemple 4:
Message: "Analyse TITRE"
Raisonnement:
  Étape 1: Mot-clé "Analyse" détecté → comprehensive_analysis
  Étape 2: "TITRE" en majuscules → possible ticker (4 lettres)
  Étape 3: Vérifier si TITRE est un ticker valide (pas dans liste exclusion)
  Étape 4: TITRE pourrait être un ticker réel → garder comme ticker
Résultat: {
  "intent": "comprehensive_analysis",
  "tickers": ["TITRE"],
  "confidence": 0.9,
  "needs_clarification": false,
  "suggested_tools": ["fmp-fundamentals", "polygon-stock-price", "finnhub-news"],
  "reasoning": "Demande d'analyse avec ticker TITRE (4 lettres, format valide)"
}

Exemple 5:
Message: "Prix Tesla"
Raisonnement:
  Étape 1: Mot-clé "Prix" détecté → stock_price
  Étape 2: "Tesla" → mapping vers TSLA
  Étape 3: Intent clair avec ticker
Résultat: {
  "intent": "stock_price",
  "tickers": ["TSLA"],
  "confidence": 0.95,
  "needs_clarification": false,
  "suggested_tools": ["polygon-stock-price"],
  "reasoning": "Demande de prix avec nom de compagnie identifié"
}

Exemple 6:
Message: "et MSFT?"
Raisonnement:
  Étape 1: Référence contextuelle ("et") → probablement suite de conversation
  Étape 2: Ticker MSFT explicite
  Étape 3: Utiliser même intent que message précédent (comprehensive_analysis probable)
Résultat: {
  "intent": "comprehensive_analysis",
  "tickers": ["MSFT"],
  "confidence": 0.85,
  "needs_clarification": false,
  "suggested_tools": ["fmp-fundamentals", "polygon-stock-price", "finnhub-news"],
  "reasoning": "Référence contextuelle avec ticker explicite"
}
`;

        // 🎯 AMÉLIORATION: Patterns additionnels pour messages ambigus
        const ambiguityHandlingExamples = `
═══════════════════════════════════════════════════════════════
GESTION DE L'AMBIGUÏTÉ ET DES CAS COMPLEXES
═══════════════════════════════════════════════════════════════

Exemple 1 - Référence contextuelle:
Message actuel: "et MSFT?"
Historique récent: "Analyse AAPL" → comprehensive_analysis de AAPL
Raisonnement:
  Étape 1: "et" indique une référence au message précédent
  Étape 2: "MSFT" est un ticker explicite
  Étape 3: Utiliser la même intention que le message précédent
  Étape 4: Intent = comprehensive_analysis avec ticker MSFT
Résultat: {
  "intent": "comprehensive_analysis",
  "tickers": ["MSFT"],
  "confidence": 0.85,
  "reasoning": "Référence contextuelle - même intent que message précédent"
}

Exemple 2 - Message incomplet avec contexte:
Message actuel: "et le prix?"
Historique récent: "Analyse NVDA"
Raisonnement:
  Étape 1: "le prix" indique stock_price
  Étape 2: Pas de ticker dans le message actuel
  Étape 3: Chercher ticker dans l'historique → NVDA trouvé
  Étape 4: Intent = stock_price avec ticker NVDA (inféré)
Résultat: {
  "intent": "stock_price",
  "tickers": ["NVDA"],
  "confidence": 0.75,
  "reasoning": "Ticker inféré depuis l'historique conversationnel"
}

Exemple 3 - Pronoms et références:
Message actuel: "c'est quoi son P/E?"
Historique récent: "Analyse Tesla"
Raisonnement:
  Étape 1: "son P/E" → référence pronominale "son"
  Étape 2: Chercher antécédent dans historique → Tesla (TSLA)
  Étape 3: "P/E" → fundamentals
  Étape 4: Intent = fundamentals avec ticker TSLA
Résultat: {
  "intent": "fundamentals",
  "tickers": ["TSLA"],
  "confidence": 0.80,
  "reasoning": "Pronom 'son' résolu vers TSLA via historique"
}

Exemple 4 - Questions de suivi:
Message actuel: "pourquoi il monte?"
Historique récent: "Prix GOOGL"
Raisonnement:
  Étape 1: "il" = référence à l'action précédente (GOOGL)
  Étape 2: "monte" = variation de prix → news ou market_overview
  Étape 3: "pourquoi" = demande d'explication → news
  Étape 4: Intent = news avec ticker GOOGL
Résultat: {
  "intent": "news",
  "tickers": ["GOOGL"],
  "confidence": 0.85,
  "reasoning": "Question causale sur variation de prix"
}

Exemple 5 - Multiple intentions:
Message actuel: "compare AAPL et MSFT puis donne-moi les news"
Raisonnement:
  Étape 1: "compare" + 2 tickers → comparative_analysis (intention principale)
  Étape 2: "news" = intention secondaire
  Étape 3: Prioriser l'intention principale (première demande)
  Étape 4: Intent = comparative_analysis
Résultat: {
  "intent": "comparative_analysis",
  "tickers": ["AAPL", "MSFT"],
  "confidence": 0.95,
  "reasoning": "Intention principale: comparaison (news ignorée comme intention secondaire)"
}

Exemple 6 - Message émotionnel vs ticker:
Message actuel: "WOW"
Raisonnement:
  Étape 1: "WOW" pourrait être ticker WOW (Wideopenwest) ou expression émotionnelle
  Étape 2: Pas de contexte financier dans le message
  Étape 3: Pas d'historique récent sur WOW
  Étape 4: "WOW" seul = expression émotionnelle
Résultat: {
  "intent": "general_conversation",
  "tickers": [],
  "confidence": 0.95,
  "skip_financial_analysis": true,
  "reasoning": "Expression émotionnelle, pas un ticker"
}

Exemple 7 - Ambiguïté temporelle résolue:
Message actuel: "résultats aujourd'hui"
Raisonnement:
  Étape 1: "résultats" → earnings
  Étape 2: "aujourd'hui" → timeframe précis
  Étape 3: Pas de ticker spécifié
  Étape 4: Intent = earnings (calendar général pour aujourd'hui)
Résultat: {
  "intent": "earnings",
  "tickers": [],
  "confidence": 0.90,
  "parameters": {"timeframe": "today"},
  "reasoning": "Demande de résultats du jour (calendrier earnings)"
}
`;

        return `Analyse cette demande utilisateur étape par étape (Chain-of-Thought) et extrais les informations en JSON strict:

${fewShotExamples}

${ambiguityHandlingExamples}

═══════════════════════════════════════════════════════════════
DEMANDE ACTUELLE À ANALYSER
═══════════════════════════════════════════════════════════════

Message: "${userMessage}"

${recentContext ? `CONTEXTE CONVERSATIONNEL RÉCENT (5-10 derniers messages):
${recentContext}

` : ''}CONTEXTE DISPONIBLE:
- Tickers disponibles: ${context.tickers?.join(', ') || 'aucun'}

COMPANY NAME TO TICKER MAPPING:
Apple → AAPL
Microsoft → MSFT
Google/Alphabet → GOOGL
Amazon → AMZN
Tesla → TSLA
Meta/Facebook → META
Nvidia → NVDA
AMD → AMD
Intel → INTC
Netflix → NFLX

INTENTIONS POSSIBLES:
**Générales:**
- greeting: Salutations, bonjour, hello
- help: Demande d'aide, questions sur les capacités
- general_conversation: Conversation générale non financière
- information_provided: Email, nom, ou autre information fournie

**Financières:**
- stock_price: Prix actions
- fundamentals: Données fondamentales
- technical_analysis: Analyse technique
- news: Actualités
- comprehensive_analysis: Analyse complète
- comparative_analysis: Comparaison
- earnings: Résultats financiers
- portfolio: Portefeuille
- market_overview: Vue marché
- recommendation: Recommandation
- stock_screening: Recherche/screening d'actions selon critères

OUTILS DISPONIBLES:
polygon-stock-price, fmp-fundamentals, finnhub-news, twelve-data-technical,
alpha-vantage-ratios, supabase-watchlist, earnings-calendar, analyst-recommendations

═══════════════════════════════════════════════════════════════
INSTRUCTIONS (SUIVRE LES EXEMPLES CI-DESSUS)
═══════════════════════════════════════════════════════════════

1. RAISONNEMENT ÉTAPE PAR ÉTAPE (Chain-of-Thought):
   - Étape 1: Le message contient-il une expression émotionnelle? (Wow, Super, Merci, etc.)
   - Étape 2: Le message contient-il un email? (format email@domain.com)
   - Étape 3: Le message contient-il des mots-clés financiers? (prix, analyse, actualités, etc.)
   - Étape 4: Le message contient-il des tickers ou noms de compagnies?
   - Étape 5: Le message fait-il référence au contexte conversationnel? (et, aussi, etc.)

2. DÉTERMINE l'INTENTION principale en suivant les exemples
   - Prioriser intentions générales si pas de contexte financier
   - Si "Analyse TITRE" → comprehensive_analysis avec ticker TITRE (préserver fonctionnement actuel)

3. EXTRAIS les TICKERS (utilise le mapping)
   - Vide [] si intention non-financière
   - Si ticker en majuscules (ex: TITRE, AAPL) → garder comme ticker valide

4. SUGGÈRE 2-5 OUTILS pertinents
   - Vide [] si intention non-financière

5. CLARIFICATION seulement si vraiment ambigu (confidence < 0.3 ET intention financière sans ticker)

6. IMPORTANT: Préserver le fonctionnement actuel
   - "Analyse TITRE" → comprehensive_analysis avec ticker ["TITRE"]
   - Les réponses doivent rester de même qualité

RETOURNE UNIQUEMENT LE JSON (pas d'explication avant/après, pas de markdown):
{
  "intent": "...",
  "tickers": [...],
  "confidence": 0.0-1.0,
  "needs_clarification": true/false,
  "clarification_questions": [...],
  "suggested_tools": [...],
  "parameters": {...},
  "user_intent_summary": "...",
  "reasoning": "...",
  "skip_financial_analysis": true/false (si applicable)
}`;
    }

    /**
     * Appel à Gemini (gratuit) via REST API avec retry automatique
     */
    async _callGemini(prompt) {
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY not configured');
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

        // ✅ Utiliser geminiFetchWithRetry pour gestion automatique du rate limiting
        const response = await geminiFetchWithRetry(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.1, // Très déterministe pour JSON
                    maxOutputTokens: 500,
                    candidateCount: 1
                }
            })
        }, {
            maxRetries: 4,
            baseDelay: 1000,
            logRetries: true
        });

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    /**
     * Génère des questions de clarification contextuelles
     */
    _generateClarificationQuestions(intent, userMessage, tickers) {
        const questions = [];

        // Si aucun ticker détecté et intent nécessite un ticker
        const financialIntents = ['stock_price', 'fundamentals', 'technical_analysis', 'news', 'comprehensive_analysis', 'comparative_analysis', 'earnings', 'recommendation'];
        if (financialIntents.includes(intent) && tickers.length === 0) {
            questions.push("De quelle(s) action(s) souhaitez-vous que je parle ? (ex: AAPL, MSFT, TSLA)");
        }

        // Questions spécifiques par intent
        switch (intent) {
            case 'comparative_analysis':
                if (tickers.length === 1) {
                    questions.push("À quelle autre action voulez-vous comparer " + tickers[0] + " ?");
                }
                break;

            case 'investment_strategy':
                questions.push("Quel est votre horizon de placement ? (court terme / moyen terme / long terme)");
                questions.push("Quel niveau de risque acceptez-vous ? (conservateur / modéré / agressif)");
                break;

            case 'technical_analysis':
                questions.push("Quelle période souhaitez-vous analyser ? (intraday / court terme / moyen terme)");
                break;

            case 'news':
                questions.push("Quel type de nouvelles recherchez-vous ? (actualités récentes / résultats trimestriels / acquisitions)");
                break;
        }

        // Si la requête est vraiment trop vague (< 5 mots)
        const wordCount = userMessage.trim().split(/\s+/).length;
        if (wordCount < 5 && questions.length === 0) {
            questions.push("Pouvez-vous préciser votre demande ? Par exemple : quel ticker, quelle période, quel type d'analyse ?");
        }

        return questions;
    }
}

// Export par défaut
export default HybridIntentAnalyzer;
