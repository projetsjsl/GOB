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
     * Évalue la clarté de la requête (0-10)
     * ≥7: Analyse locale suffisante
     * <7: Nécessite LLM
     */
    _assessClarity(userMessage, context) {
        let score = 5; // Base neutre
        const messageLower = userMessage.toLowerCase();

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

        // MALUS -2: Trop court (<5 mots) ET pas de ticker
        const wordCount = userMessage.trim().split(/\s+/).length;
        if (wordCount < 5 && this._extractTickers(userMessage).length === 0) {
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

            // Parser la réponse JSON
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.warn('⚠️ LLM analysis failed to return JSON, falling back to local');
                return this._analyzeLocal(userMessage, context);
            }

            const intentData = JSON.parse(jsonMatch[0]);

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
        return `Analyse cette demande utilisateur et extrais les informations en JSON strict:

DEMANDE: "${userMessage}"

CONTEXTE:
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
- stock_screening: Recherche/screening d'actions selon critères (ex: "trouve 10 large cap sous-évaluées")

OUTILS DISPONIBLES:
polygon-stock-price, fmp-fundamentals, finnhub-news, twelve-data-technical,
alpha-vantage-ratios, supabase-watchlist, earnings-calendar, analyst-recommendations

INSTRUCTIONS:
1. Détermine l'INTENTION principale (prioriser intentions générales si pas de contexte financier)
2. Extrais les TICKERS (utilise le mapping) - vide si intention non-financière
3. Suggère 2-5 OUTILS pertinents - vide [] si intention non-financière
4. Extrais PARAMÈTRES additionnels
5. SEULEMENT clarifier si vraiment ambigu (confidence < 0.3 ET intention financière sans ticker)
6. SI message vague comme "test", "hello", questions générales → utiliser intention générale, PAS stock_price

EXEMPLES:

Message: "Test Emma"
{
  "intent": "general_conversation",
  "confidence": 0.9,
  "tickers": [],
  "suggested_tools": [],
  "parameters": {},
  "needs_clarification": false,
  "clarification_questions": [],
  "user_intent_summary": "Message de test général"
}

Message: "Prix de Apple"
{
  "intent": "stock_price",
  "confidence": 0.95,
  "tickers": ["AAPL"],
  "suggested_tools": ["polygon-stock-price", "finnhub-news"],
  "parameters": {},
  "needs_clarification": false,
  "clarification_questions": [],
  "user_intent_summary": "L'utilisateur veut le prix d'Apple"
}

RETOURNE JSON UNIQUEMENT (pas d'explication avant/après):`;
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
