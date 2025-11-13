/**
 * CONTEXT MEMORY MANAGER
 *
 * Système de mémoire contextuelle avancé pour Emma
 * Permet de tracker les entités, références, et le flux conversationnel
 * pour une meilleure compréhension des messages qui s'enchaînent
 *
 * Fonctionnalités:
 * - Tracking des entités mentionnées (tickers, entreprises, concepts)
 * - Résolution des références anaphoriques ("il", "ça", "cette entreprise")
 * - Mémoire des sujets de conversation
 * - Détection des changements de sujet
 * - Inférence contextuelle pour messages incomplets
 */

import { TickerExtractor } from './utils/ticker-extractor.js';

export class ContextMemory {
    constructor() {
        // Entités actives dans la conversation
        this.activeEntities = {
            tickers: [],              // Tickers mentionnés récemment
            companies: [],            // Noms d'entreprises
            concepts: [],             // Concepts financiers discutés
            timeframes: [],           // Périodes temporelles ("aujourd'hui", "ce mois-ci")
            metrics: []               // Métriques financières ("P/E", "ROE")
        };

        // Dernier sujet principal de conversation
        this.currentTopic = {
            type: null,               // 'stock_analysis', 'news', 'portfolio', etc.
            primary_ticker: null,     // Ticker principal discuté
            intent: null,             // Intention actuelle
            timestamp: null           // Quand le sujet a commencé
        };

        // Historique des sujets (sliding window)
        this.topicHistory = [];
        this.maxTopicHistory = 5;

        // Compteur de mentions par entité (pour savoir ce qui est le plus important)
        this.entityMentionCount = {};
    }

    /**
     * Met à jour le contexte avec un nouveau message
     *
     * @param {string} message - Message utilisateur
     * @param {object} intentData - Données d'intention analysées
     * @returns {object} - Contexte enrichi
     */
    updateContext(message, intentData = {}) {
        const messageLower = message.toLowerCase();

        // 1. Extraire et tracker les entités
        this._extractEntities(message, intentData);

        // 2. Mettre à jour le sujet actuel
        this._updateTopic(intentData);

        // 3. Résoudre les références anaphoriques
        const resolvedReferences = this._resolveReferences(message);

        // 4. Détecter les changements de sujet
        const topicChanged = this._detectTopicChange(intentData);

        // 5. Construire le contexte enrichi
        return {
            // Entités actives
            active_tickers: this.activeEntities.tickers,
            active_companies: this.activeEntities.companies,
            active_concepts: this.activeEntities.concepts,
            active_timeframes: this.activeEntities.timeframes,
            active_metrics: this.activeEntities.metrics,

            // Sujet actuel
            current_topic: this.currentTopic,
            topic_changed: topicChanged,

            // Références résolues
            resolved_references: resolvedReferences,

            // Entité la plus importante
            primary_entity: this._getPrimaryEntity(),

            // Contexte pour LLM
            context_summary: this._generateContextSummary()
        };
    }

    /**
     * Extrait les entités du message
     */
    _extractEntities(message, intentData) {
        const messageLower = message.toLowerCase();

        // 1. TICKERS - Utiliser TickerExtractor centralisé
        const tickers = intentData.tickers || TickerExtractor.extract(message);
        if (tickers.length > 0) {
            tickers.forEach(ticker => {
                // Ajouter ou déplacer en tête de liste (MRU - Most Recently Used)
                this.activeEntities.tickers = this._addToMRU(this.activeEntities.tickers, ticker, 5);
                this._incrementMentionCount(ticker);
            });
        }

        // 2. CONCEPTS FINANCIERS
        const financialConcepts = {
            'valorisation': ['valorisation', 'valuation', 'valeur intrinsèque', 'intrinsic value', 'fair value', 'juste valeur'],
            'croissance': ['croissance', 'growth', 'expansion', 'développement'],
            'rentabilité': ['rentabilité', 'profitability', 'marges', 'margins', 'roe', 'roa'],
            'liquidité': ['liquidité', 'liquidity', 'cash', 'trésorerie', 'flux de trésorerie'],
            'dette': ['dette', 'debt', 'endettement', 'leverage', 'gearing'],
            'dividendes': ['dividendes', 'dividends', 'rendement', 'yield', 'payout'],
            'momentum': ['momentum', 'tendance', 'trend', 'élan'],
            'volatilité': ['volatilité', 'volatility', 'risque', 'risk', 'variance'],
            'analyse_technique': ['rsi', 'macd', 'moyennes mobiles', 'bollinger', 'fibonacci', 'support', 'résistance'],
            'analyse_fondamentale': ['p/e', 'pe ratio', 'p/b', 'bénéfices', 'earnings', 'revenus', 'revenue']
        };

        for (const [concept, keywords] of Object.entries(financialConcepts)) {
            if (keywords.some(kw => messageLower.includes(kw))) {
                this.activeEntities.concepts = this._addToMRU(this.activeEntities.concepts, concept, 3);
                this._incrementMentionCount(concept);
            }
        }

        // 3. TIMEFRAMES (Périodes temporelles)
        const timeframes = {
            'today': ['aujourd\'hui', 'aujourd hui', 'today', 'ce jour'],
            'this_week': ['cette semaine', 'this week', 'semaine en cours'],
            'this_month': ['ce mois', 'this month', 'mois en cours'],
            'this_quarter': ['ce trimestre', 'this quarter', 'q1', 'q2', 'q3', 'q4'],
            'this_year': ['cette année', 'this year', 'année en cours', '2025'],
            'yesterday': ['hier', 'yesterday'],
            'last_week': ['semaine dernière', 'last week'],
            'ytd': ['ytd', 'depuis début année', 'year to date']
        };

        for (const [timeframe, keywords] of Object.entries(timeframes)) {
            if (keywords.some(kw => messageLower.includes(kw))) {
                this.activeEntities.timeframes = this._addToMRU(this.activeEntities.timeframes, timeframe, 2);
            }
        }

        // 4. MÉTRIQUES FINANCIÈRES
        const metrics = [
            'p/e', 'pe ratio', 'p/b', 'pb ratio', 'roe', 'roa', 'ebitda', 'eps', 'bpa',
            'free cash flow', 'fcf', 'debt/equity', 'current ratio', 'quick ratio',
            'gross margin', 'net margin', 'operating margin', 'dividend yield',
            'market cap', 'enterprise value', 'ev/ebitda'
        ];

        metrics.forEach(metric => {
            if (messageLower.includes(metric)) {
                this.activeEntities.metrics = this._addToMRU(this.activeEntities.metrics, metric, 3);
                this._incrementMentionCount(metric);
            }
        });
    }

    /**
     * Met à jour le sujet actuel de conversation
     */
    _updateTopic(intentData) {
        const { intent, tickers = [] } = intentData;

        // Déterminer si c'est un nouveau sujet
        const isNewTopic =
            this.currentTopic.intent !== intent ||
            (tickers.length > 0 && this.currentTopic.primary_ticker !== tickers[0]);

        if (isNewTopic) {
            // Sauvegarder le sujet précédent dans l'historique
            if (this.currentTopic.intent) {
                this.topicHistory.unshift({ ...this.currentTopic });
                if (this.topicHistory.length > this.maxTopicHistory) {
                    this.topicHistory.pop();
                }
            }

            // Définir le nouveau sujet
            this.currentTopic = {
                type: this._mapIntentToTopicType(intent),
                primary_ticker: tickers.length > 0 ? tickers[0] : null,
                intent: intent,
                timestamp: Date.now()
            };
        }
    }

    /**
     * Résout les références anaphoriques (il, ça, cette entreprise, etc.)
     */
    _resolveReferences(message) {
        const messageLower = message.toLowerCase();
        const references = {};

        // Patterns de références
        const pronounPatterns = {
            'singular_it': ['il', 'elle', 'ça', 'cela', 'celui-ci', 'celle-ci', 'it', 'this'],
            'plural_they': ['ils', 'elles', 'ceux-ci', 'celles-ci', 'they', 'these'],
            'company': ['cette entreprise', 'cette société', 'cette compagnie', 'this company', 'the company', 'l\'entreprise'],
            'stock': ['cette action', 'ce titre', 'this stock', 'the stock', 'l\'action'],
            'metric': ['ce ratio', 'cet indicateur', 'cette métrique', 'this ratio', 'this metric']
        };

        // Détecter les références et les résoudre
        for (const [refType, patterns] of Object.entries(pronounPatterns)) {
            if (patterns.some(p => messageLower.includes(p))) {
                references[refType] = this._resolveReferenceType(refType);
            }
        }

        return references;
    }

    /**
     * Résout un type de référence spécifique
     */
    _resolveReferenceType(refType) {
        switch (refType) {
            case 'singular_it':
            case 'company':
            case 'stock':
                // Retourner le ticker le plus récent
                return this.activeEntities.tickers[0] || this.currentTopic.primary_ticker || null;

            case 'plural_they':
                // Retourner les 2 tickers les plus récents
                return this.activeEntities.tickers.slice(0, 2);

            case 'metric':
                // Retourner la métrique la plus récente
                return this.activeEntities.metrics[0] || null;

            default:
                return null;
        }
    }

    /**
     * Détecte les changements de sujet
     */
    _detectTopicChange(intentData) {
        const { intent, tickers = [] } = intentData;

        // Si pas de sujet actuel, c'est forcément un nouveau sujet
        if (!this.currentTopic.intent) {
            return true;
        }

        // Changement d'intention (ex: de news à analysis)
        if (this.currentTopic.intent !== intent) {
            return true;
        }

        // Changement de ticker principal
        if (tickers.length > 0 && this.currentTopic.primary_ticker &&
            this.currentTopic.primary_ticker !== tickers[0]) {
            return true;
        }

        // Délai écoulé (plus de 5 minutes = nouveau sujet)
        const timeSinceTopicStart = Date.now() - (this.currentTopic.timestamp || 0);
        if (timeSinceTopicStart > 5 * 60 * 1000) {
            return true;
        }

        return false;
    }

    /**
     * Récupère l'entité principale (la plus mentionnée récemment)
     */
    _getPrimaryEntity() {
        // Priorité: ticker le plus mentionné récemment
        if (this.activeEntities.tickers.length > 0) {
            return {
                type: 'ticker',
                value: this.activeEntities.tickers[0],
                mentions: this.entityMentionCount[this.activeEntities.tickers[0]] || 1
            };
        }

        // Fallback: concept le plus récent
        if (this.activeEntities.concepts.length > 0) {
            return {
                type: 'concept',
                value: this.activeEntities.concepts[0],
                mentions: this.entityMentionCount[this.activeEntities.concepts[0]] || 1
            };
        }

        return null;
    }

    /**
     * Génère un résumé du contexte pour le LLM
     */
    _generateContextSummary() {
        const parts = [];

        // Sujet actuel
        if (this.currentTopic.intent) {
            parts.push(`Sujet actuel: ${this.currentTopic.intent}`);
            if (this.currentTopic.primary_ticker) {
                parts.push(`Ticker principal: ${this.currentTopic.primary_ticker}`);
            }
        }

        // Entités actives
        if (this.activeEntities.tickers.length > 0) {
            parts.push(`Tickers discutés: ${this.activeEntities.tickers.slice(0, 3).join(', ')}`);
        }

        if (this.activeEntities.concepts.length > 0) {
            parts.push(`Concepts: ${this.activeEntities.concepts.slice(0, 2).join(', ')}`);
        }

        if (this.activeEntities.timeframes.length > 0) {
            parts.push(`Période: ${this.activeEntities.timeframes[0]}`);
        }

        if (this.activeEntities.metrics.length > 0) {
            parts.push(`Métriques: ${this.activeEntities.metrics.slice(0, 2).join(', ')}`);
        }

        return parts.join(' | ');
    }

    /**
     * Ajoute un élément à une liste MRU (Most Recently Used)
     */
    _addToMRU(list, item, maxSize = 5) {
        // Retirer l'élément s'il existe déjà
        const filtered = list.filter(x => x !== item);
        // Ajouter en tête
        filtered.unshift(item);
        // Limiter la taille
        return filtered.slice(0, maxSize);
    }

    /**
     * Incrémente le compteur de mentions d'une entité
     */
    _incrementMentionCount(entity) {
        this.entityMentionCount[entity] = (this.entityMentionCount[entity] || 0) + 1;
    }

    /**
     * Mappe une intention vers un type de sujet
     */
    _mapIntentToTopicType(intent) {
        const mapping = {
            'stock_price': 'price_inquiry',
            'fundamentals': 'fundamental_analysis',
            'technical_analysis': 'technical_analysis',
            'news': 'news_inquiry',
            'comprehensive_analysis': 'comprehensive_analysis',
            'comparative_analysis': 'comparison',
            'earnings': 'earnings_analysis',
            'portfolio': 'portfolio_management',
            'market_overview': 'market_overview',
            'recommendation': 'investment_recommendation',
            'economic_analysis': 'economic_analysis',
            'political_analysis': 'political_analysis',
            'investment_strategy': 'strategy_discussion',
            'risk_volatility': 'risk_analysis',
            'sector_industry': 'sector_analysis',
            'valuation': 'valuation_analysis',
            'stock_screening': 'stock_screening'
        };

        return mapping[intent] || 'general_conversation';
    }

    /**
     * Réinitialise le contexte
     */
    reset() {
        this.activeEntities = {
            tickers: [],
            companies: [],
            concepts: [],
            timeframes: [],
            metrics: []
        };

        this.currentTopic = {
            type: null,
            primary_ticker: null,
            intent: null,
            timestamp: null
        };

        this.topicHistory = [];
        this.entityMentionCount = {};
    }

    /**
     * Infère les informations manquantes d'un message incomplet
     *
     * @param {string} message - Message utilisateur
     * @param {object} intentData - Données d'intention
     * @returns {object} - Informations inférées
     */
    inferMissingContext(message, intentData) {
        const inferred = {
            tickers: [],
            concepts: [],
            intent: intentData.intent,
            confidence: 0
        };

        // Si pas de tickers dans le message mais un ticker actif dans le contexte
        if ((!intentData.tickers || intentData.tickers.length === 0) &&
            this.activeEntities.tickers.length > 0) {

            // Vérifier si le message fait référence implicite à un ticker
            const messageLower = message.toLowerCase();
            const implicitReferences = [
                'il', 'elle', 'ça', 'cela', 'cette entreprise', 'cette action',
                'ce titre', 'la société', 'it', 'this', 'the company', 'the stock'
            ];

            if (implicitReferences.some(ref => messageLower.includes(ref))) {
                inferred.tickers = [this.activeEntities.tickers[0]];
                inferred.confidence = 0.8;
                console.log(`📎 Context inference: "${message}" → Ticker inferred: ${inferred.tickers[0]}`);
            }
            // Ou si l'intention nécessite un ticker et qu'on en a un dans le contexte récent
            else if (this._intentNeedsTicker(intentData.intent) &&
                     this.currentTopic.primary_ticker) {
                inferred.tickers = [this.currentTopic.primary_ticker];
                inferred.confidence = 0.6;
                console.log(`📎 Context inference: Intent "${intentData.intent}" needs ticker → Using ${inferred.tickers[0]}`);
            }
        }

        // Inférer les concepts manquants
        if (this.activeEntities.concepts.length > 0) {
            inferred.concepts = this.activeEntities.concepts.slice(0, 2);
        }

        return inferred;
    }

    /**
     * Vérifie si une intention nécessite un ticker
     */
    _intentNeedsTicker(intent) {
        const tickerRequiredIntents = [
            'stock_price',
            'fundamentals',
            'technical_analysis',
            'news',
            'comprehensive_analysis',
            'comparative_analysis',
            'earnings',
            'recommendation',
            'valuation'
        ];

        return tickerRequiredIntents.includes(intent);
    }

    /**
     * Récupère l'état actuel du contexte
     */
    getState() {
        return {
            activeEntities: { ...this.activeEntities },
            currentTopic: { ...this.currentTopic },
            topicHistory: [...this.topicHistory],
            primaryEntity: this._getPrimaryEntity(),
            contextSummary: this._generateContextSummary()
        };
    }
}

export default ContextMemory;
