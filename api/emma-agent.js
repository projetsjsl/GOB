/**
 * Emma Agent - Système de Function Calling Intelligent avec Cognitive Scaffolding
 *
 * Architecture:
 * - COGNITIVE SCAFFOLDING LAYER: Analyse d'intention avec Perplexity
 * - ReAct REASONING LAYER: Sélection intelligente d'outils
 * - TOOL USE LAYER: Exécution parallèle avec fallbacks
 * - SYNTHESIS LAYER: Génération de réponse finale
 */

import { HybridIntentAnalyzer } from '../lib/intent-analyzer.js';
import { createSupabaseClient } from '../lib/supabase-config.js';
import { TickerExtractor } from '../lib/utils/ticker-extractor.js';
import { CFA_SYSTEM_PROMPT } from '../config/emma-cfa-prompt.js';
import { getIntentPrompt, hasCustomPrompt } from '../config/intent-prompts.js';
import { geminiFetchWithRetry } from '../lib/utils/gemini-retry.js';
import { ContextMemory } from '../lib/context-memory.js';
import { ResponseValidator } from '../lib/response-validator.js';
import { DynamicPromptsSystem } from '../lib/dynamic-prompts.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SmartAgent {
    constructor() {
        this.toolsConfig = this._loadToolsConfig();
        this.usageStats = {}; // Will be loaded from Supabase on first use
        this.conversationHistory = [];
        this.intentAnalyzer = new HybridIntentAnalyzer();
        this.supabase = null; // Lazy initialization
        this.usageStatsLoaded = false;

        // ✨ NOUVEAU: Systèmes cognitifs avancés pour ergonomie conversationnelle
        this.contextMemory = new ContextMemory();
        this.responseValidator = new ResponseValidator();
        this.promptSystem = new DynamicPromptsSystem();
        console.log('🧠 Advanced cognitive systems initialized (Context Memory, Response Validator, Dynamic Prompts)');
    }

    /**
     * Point d'entrée principal pour Emma
     */
    async processRequest(userMessage, context = {}) {
        try {
            console.log('🤖 Emma Agent: Processing request:', userMessage.substring(0, 100) + '...');

            // Load usage stats from Supabase if not already loaded (non-blocking)
            if (!this.usageStatsLoaded) {
                await this._loadUsageStats().catch(err => {
                    console.warn('⚠️ Could not load usage stats, continuing with empty stats:', err.message);
                });
            }

            // Load conversation history from context if provided
            if (context.conversationHistory && Array.isArray(context.conversationHistory)) {
                this.conversationHistory = context.conversationHistory;
                console.log(`💬 Loaded conversation history: ${this.conversationHistory.length} messages`);
            }

            // 🔧 AUTO-CORRECTION DES TICKERS (avant analyse d'intent)
            userMessage = this._autoCorrectTickers(userMessage);


            // 0. COGNITIVE SCAFFOLDING: Analyse d'intention avec Perplexity
            const intentData = await this._analyzeIntent(userMessage, context);
            console.log('🧠 Intent analysis:', intentData ? intentData.intent : 'fallback to keyword scoring');

            // ✨ NOUVEAU: Mise à jour de la mémoire contextuelle
            const enrichedContext = this.contextMemory.updateContext(userMessage, intentData);
            console.log(`📎 Context Memory updated:`, enrichedContext.context_summary);
            console.log(`📎 Primary entity:`, enrichedContext.primary_entity);
            console.log(`📎 Topic changed:`, enrichedContext.topic_changed);

            // ✨ NOUVEAU: Inférer informations manquantes si besoin (tickers depuis contexte)
            if (intentData && (!intentData.tickers || intentData.tickers.length === 0) &&
                enrichedContext.resolved_references && Object.keys(enrichedContext.resolved_references).length > 0) {
                const inferred = this.contextMemory.inferMissingContext(userMessage, intentData);
                if (inferred.tickers && inferred.tickers.length > 0) {
                    console.log(`🔮 Tickers inferred from context:`, inferred.tickers);
                    intentData.tickers = [...(intentData.tickers || []), ...inferred.tickers];
                    intentData.confidence = Math.min(intentData.confidence || 0.7, inferred.confidence);
                    console.log(`✅ Intent data enriched with context: ${inferred.tickers.join(', ')} (confidence: ${inferred.confidence})`);
                }
            }

            // Enrichir le contexte passé aux étapes suivantes
            context.enriched_context = enrichedContext;

            // ✅ CLARIFICATIONS ACTIVÉES - Emma peut poser des questions de suivi quand nécessaire
            // Si l'intention n'est pas claire (confidence < 0.5), Emma demande des précisions
            if (intentData && intentData.needs_clarification && intentData.clarification_questions && intentData.clarification_questions.length > 0) {
                console.log('💬 Intent unclear - asking follow-up questions');
                return this._handleClarification(intentData, userMessage);
            }

            // 🎭 GESTION DIRECTE: Messages non-financiers (expressions émotionnelles, emails, etc.)
            if (intentData && intentData.skip_financial_analysis) {
                console.log('🎭 Non-financial message detected - generating conversational response');
                return this._handleConversationalMessage(intentData, userMessage, context);
            }

            // GESTION DIRECTE: Demande de watchlist/portfolio (réponse immédiate sans outils)
            if (intentData && intentData.intent === 'portfolio') {
                console.log('📊 Portfolio/Watchlist request detected - responding directly');
                return this._handlePortfolioRequest(userMessage, context);
            }

            // Enrichir le contexte avec les données d'intention
            if (intentData) {
                context.intent_data = intentData;
                context.extracted_tickers = intentData.tickers || [];
                context.suggested_tools = intentData.suggested_tools || [];
            }

            // 1. Planification avec scoring (enrichi par l'intent)
            const selectedTools = await this._plan_with_scoring(userMessage, context);
            console.log('📋 Selected tools:', selectedTools.map(t => t.id));

            // 2. Exécution des outils
            const toolResults = await this._execute_all(selectedTools, userMessage, context);
            console.log('⚡ Tool execution completed');

            // 3. Génération de la réponse finale
            const responseData = await this._generate_response(userMessage, toolResults, context, intentData);
            console.log('✨ Final response generated');

            // Extraire réponse, validation et modèle si objet retourné
            let finalResponse = responseData;
            let dataValidation = null;
            let modelUsed = null;
            let modelReason = null;

            if (typeof responseData === 'object' && responseData.response) {
                finalResponse = responseData.response;
                dataValidation = responseData.validation;
                modelUsed = responseData.model;
                modelReason = responseData.model_reason;
            }

            // 4. Mise à jour de l'historique
            this._updateConversationHistory(userMessage, finalResponse, toolResults);

            // Note: Statistiques sauvegardées automatiquement en temps réel dans Supabase via _updateToolStats

            // Identifier les outils qui ont échoué ou retourné des données non fiables
            const failedToolsData = toolResults
                .filter(r => !r.success || !r.is_reliable)
                .map(r => ({
                    id: r.tool_id,
                    error: r.error || 'Données non fiables'
                }));

            const failedTools = failedToolsData.map(t => t.id);

            // Mapping des IDs techniques vers des noms lisibles
            const nameMapping = {
                'fmp-quote': 'Prix actions (FMP)',
                'polygon-stock-price': 'Prix actions (Polygon)',
                'fmp-fundamentals': 'Données fondamentales (FMP)',
                'fmp-ratios': 'Ratios financiers (FMP)',
                'fmp-key-metrics': 'Métriques clés (FMP)',
                'fmp-ratings': 'Ratings entreprises (FMP)',
                'fmp-ticker-news': 'Actualités ticker (FMP)',
                'finnhub-news': 'Actualités (Finnhub)',
                'twelve-data-technical': 'Indicateurs techniques',
                'alpha-vantage-ratios': 'Ratios financiers (Alpha Vantage)',
                'yahoo-finance': 'Yahoo Finance',
                'supabase-watchlist': 'Watchlist',
                'team-tickers': 'Tickers équipe',
                'economic-calendar': 'Calendrier économique (FMP)',
                'earnings-calendar': 'Calendrier résultats (FMP)',
                'analyst-recommendations': 'Recommandations analystes (FMP)',
                'calculator': 'Calculatrice financière'
            };

            const unavailableSources = failedToolsData.map(toolData => {
                const readableName = nameMapping[toolData.id] || toolData.id;
                return `${readableName} (${toolData.error})`;
            });

            // Calculer score de confiance global
            const intentConfidence = intentData?.confidence || 0.7;
            const dataConfidence = dataValidation?.confidence || 0.7;
            const globalConfidence = (intentConfidence + dataConfidence) / 2;

            return {
                success: true,
                response: finalResponse,
                tools_used: selectedTools.map(t => t.id),
                failed_tools: failedTools,
                unavailable_sources: unavailableSources,
                intent: intentData ? intentData.intent : 'unknown',
                confidence: globalConfidence, // Score de confiance global (0-1)
                intent_confidence: intentConfidence,
                data_confidence: dataConfidence,
                has_sources: dataValidation?.passed || false,
                source_types: dataValidation?.source_types_found || 0,
                output_mode: context.output_mode || 'chat',
                execution_time_ms: Date.now() - (context.start_time || Date.now()),
                conversation_length: this.conversationHistory.length,
                is_reliable: toolResults.every(r => r.is_reliable) && (dataValidation?.passed !== false),
                model: modelUsed || 'unknown',  // Modèle utilisé pour générer la réponse
                model_reason: modelReason || 'Unknown reason'  // Raison du choix du modèle
            };

        } catch (error) {
            console.error('❌ Emma Agent Error:', error);
            return {
                success: false,
                error: error.message,
                response: "Désolé, j'ai rencontré une erreur technique. Veuillez réessayer.",
                is_reliable: false
            };
        }
    }

    /**
     * COGNITIVE SCAFFOLDING LAYER
     * Analyse d'intention HYBRIDE (local + LLM) pour optimiser performances et coûts
     */
    async _analyzeIntent(userMessage, context) {
        try {
            console.log('🧠 Starting HYBRID intent analysis...');

            // Utiliser le HybridIntentAnalyzer
            const intentData = await this.intentAnalyzer.analyze(userMessage, context);

            console.log('✅ Intent analyzed:', intentData);
            console.log(`⚡ Method: ${intentData.analysis_method}, Time: ${intentData.execution_time_ms}ms`);

            return intentData;

        } catch (error) {
            console.error('❌ Intent analysis failed:', error.message);
            // Retombe gracieusement sur le scoring par mots-clés
            return null;
        }
    }


    /**
     * Gère les clarifications quand l'intention est ambiguë
     */
    _handleClarification(intentData, userMessage) {
        console.log('💬 Clarification needed, returning questions');

        let clarificationResponse = `Pour vous fournir une réponse précise, j'ai besoin de quelques précisions :\n\n`;

        // Ajouter les questions de clarification
        intentData.clarification_questions.forEach((question, index) => {
            clarificationResponse += `${index + 1}. ${question}\n`;
        });

        // Ajouter des exemples si disponibles
        if (intentData.user_intent_summary) {
            clarificationResponse += `\n💡 **Contexte détecté:** ${intentData.user_intent_summary}\n`;
        }

        // Suggestions basées sur l'intent détecté
        if (intentData.intent === 'stock_analysis' && !intentData.tickers.length) {
            clarificationResponse += `\n**Exemples:**\n`;
            clarificationResponse += `- "Analyse technique de AAPL"\n`;
            clarificationResponse += `- "Fondamentaux de Tesla"\n`;
            clarificationResponse += `- "Actualités Microsoft"\n`;
        }

        return {
            success: true,
            response: clarificationResponse,
            needs_clarification: true,
            intent: intentData.intent,
            confidence: intentData.confidence,
            tools_used: [],
            is_reliable: true
        };
    }

    /**
     * Gestion directe des demandes de watchlist/portfolio
     */
    _handlePortfolioRequest(userMessage, context) {
        console.log('📊 Handling portfolio/watchlist request directly');

        const userWatchlist = context.user_watchlist || [];
        const teamTickers = context.team_tickers || [];
        const userName = context.user_name || 'Utilisateur';

        let response = `🌍 **Emma a accès à MILLIERS de tickers mondiaux !**\n`;
        response += `NYSE • NASDAQ • TSX • LSE • Euronext • etc.\n\n`;

        response += `📊 **VOS LISTES FAVORITES (raccourcis)**\n\n`;

        // LISTE 1: Watchlist personnelle
        response += `**1️⃣ Votre Watchlist**\n`;
        if (userWatchlist.length > 0) {
            response += `${userWatchlist.join(', ')}\n\n`;
        } else {
            response += `Vide - Ajoutez vos favoris\n\n`;
        }

        // LISTE 2: Team tickers
        response += `**2️⃣ Tickers Équipe**\n`;
        if (teamTickers.length > 0) {
            response += `${teamTickers.join(', ')}\n\n`;
        } else {
            response += `Aucun ticker d'équipe\n\n`;
        }

        response += `---\n\n`;
        response += `✨ **Demandez N'IMPORTE QUEL ticker !**\n\n`;
        response += `Exemples:\n`;
        response += `• "Tesla analyse" (TSLA)\n`;
        response += `• "Accenture actualités" (ACN)\n`;
        response += `• "Nestlé Europe" (NSRGY)\n`;
        response += `• "Air Canada" (AC.TO)\n`;
        response += `• "Performance watchlist"\n`;
        response += `• "Secteur bancaire canadien"\n`;

        return {
            success: true,
            response: response,
            intent: 'portfolio',
            confidence: 0.99,
            tools_used: [],
            model: 'direct',
            execution_time_ms: 10,
            is_reliable: true
        };
    }

    /**
     * Gestion des messages conversationnels non-financiers
     * Répond de manière naturelle aux expressions émotionnelles, emails, etc.
     */
    _handleConversationalMessage(intentData, userMessage, context) {
        console.log('🎭 Handling conversational message:', intentData.intent);

        const userName = context.user_name || 'Utilisateur';
        const messageLower = userMessage.toLowerCase().trim();
        let response = '';

        // 1. EXPRESSIONS ÉMOTIONNELLES
        if (intentData.intent === 'general_conversation' && intentData.response_type === 'conversational') {
            // Réponses appropriées selon l'expression
            if (['wow', 'super', 'incroyable', 'génial', 'genial', 'fantastique', 'excellent', 'parfait', 'cool', 'nice', 'great', 'awesome', 'amazing', 'bravo'].some(expr => messageLower.includes(expr))) {
                response = `Merci ! 😊 Je suis contente que ça te plaise !\n\nComment puis-je t'aider avec tes analyses financières aujourd'hui ? 📊`;
            } else if (['merci', 'thanks', 'thank you'].some(expr => messageLower.includes(expr))) {
                response = `De rien ${userName} ! 😊\n\nN'hésite pas si tu as d'autres questions sur les marchés financiers. Je suis là pour t'aider ! 📈`;
            } else if (['ok', 'okay', 'd\'accord', 'daccord', 'parfait', 'bien', 'bon'].some(expr => messageLower.includes(expr))) {
                response = `Parfait ! 👍\n\nQue veux-tu analyser aujourd'hui ? Je peux t'aider avec des analyses d'actions, des actualités, des indicateurs techniques, etc. 📊`;
            } else if (['oui', 'yes', 'si'].some(expr => messageLower === expr)) {
                response = `Super ! 😊\n\nSur quoi veux-tu que je t'aide ? Tu peux me demander une analyse, des actualités, ou toute autre question financière. 📈`;
            } else if (['non', 'no'].some(expr => messageLower === expr)) {
                response = `D'accord, pas de problème ! 😊\n\nSi tu changes d'avis, je suis là pour t'aider avec tes analyses financières. 📊`;
            } else {
                // Réponse générique pour autres expressions conversationnelles
                response = `Merci pour ton message ! 😊\n\nJe suis Emma, ton assistante IA financière. Je peux t'aider avec :\n📊 Analyses d'actions\n📈 Données financières\n📰 Actualités de marché\n💡 Conseils et insights\n\nComment puis-je t'aider aujourd'hui ?`;
            }
        }

        // 2. EMAILS FOURNIS
        else if (intentData.intent === 'information_provided' && intentData.information_type === 'email') {
            response = `Merci ${userName} ! 📧\n\nJ'ai bien noté ton email : ${userMessage}\n\nComment puis-je t'aider avec tes analyses financières aujourd'hui ? 📊`;
        }

        // 3. FALLBACK: Réponse conversationnelle générique
        else {
            response = `Merci pour ton message ! 😊\n\nJe suis Emma, ton assistante IA financière. Je peux t'aider avec des analyses d'actions, des actualités de marché, des indicateurs techniques, et bien plus !\n\nQue veux-tu analyser aujourd'hui ? 📈`;
        }

        return {
            success: true,
            response: response,
            intent: intentData.intent,
            confidence: intentData.confidence || 0.95,
            tools_used: [],
            model: 'conversational',
            execution_time_ms: 5,
            is_reliable: true,
            skip_financial_analysis: true
        };
    }

    /**
     * SMART ROUTER - Sélectionne le meilleur modèle selon le type de requête
     *
     * Stratégie optimisée coût/performance:
     * - Perplexity (80%): Données factuelles avec sources (stock prices, news, fundamentals)
     * - Gemini (15%): Questions conceptuelles/éducatives (gratuit)
     * - Claude (5%): Rédaction premium (briefings, lettres clients)
     */
    _selectModel(intentData, outputMode, toolsData, userMessage = '') {
        console.log('🎯 SmartRouter: Selecting optimal model...');

        // BRIEFING MODE: Toujours Claude pour qualité premium
        if (outputMode === 'briefing') {
            console.log('📝 Briefing detected → Using CLAUDE (premium writing)');
            return {
                model: 'claude',
                reason: 'Briefing requires premium writing quality',
                recency: intentData?.recency_filter || 'month'
            };
        }

        // TICKER_NOTE MODE: Perplexity pour notes professionnelles avec sources
        if (outputMode === 'ticker_note') {
            console.log('📋 Ticker note detected → Using PERPLEXITY (professional note with sources)');
            return {
                model: 'perplexity',
                reason: 'Professional ticker note requires real-time data and sources',
                recency: 'day' // Données les plus récentes pour notes professionnelles
            };
        }

        // DATA MODE: Perplexity pour extraire données structurées
        if (outputMode === 'data') {
            console.log('📊 Data extraction → Using PERPLEXITY (structured data)');
            return {
                model: 'perplexity',
                reason: 'Data extraction requires factual accuracy',
                recency: intentData?.recency_filter || 'month'
            };
        }

        // CHAT MODE: Router intelligemment selon l'intention
        const intent = intentData?.intent || 'unknown';
        const hasTickers = intentData?.tickers && intentData.tickers.length > 0;
        const hasToolData = toolsData && toolsData.length > 0;

        // PERPLEXITY: Requêtes factuelles avec sources (RIGUEUR MAXIMALE)
        const factualIntents = [
            'stock_price',
            'fundamentals',
            'news',
            'comprehensive_analysis',
            'comparative_analysis',
            'earnings',
            'market_overview',
            'recommendation',
            // Nouveaux intents financiers avancés
            'economic_analysis',
            'political_analysis',
            'investment_strategy',
            'risk_volatility',
            'sector_industry',
            'valuation',
            'technical_analysis' // Toujours factuel avec données
        ];

        if (factualIntents.includes(intent) || hasTickers || hasToolData) {
            console.log(`💎 Factual query (${intent}) → Using PERPLEXITY (with sources)`);
            
            // 🚀 DÉTECTION PRIORITAIRE: Si l'utilisateur demande des données "aujourd'hui", "fin de journée", "après clôture"
            const userMessageLower = (userMessage || '').toLowerCase();
            const todayKeywords = ['aujourd\'hui', 'aujourd hui', 'today', 'fin de journée', 'fin de journee', 'après clôture', 'apres cloture', 'after close', 'end of day', 'après la clôture', 'apres la cloture'];
            const isTodayRequest = todayKeywords.some(keyword => userMessageLower.includes(keyword));
            
            // Pour earnings, si demande "aujourd'hui", forcer recency: 'hour' (données les plus récentes)
            let recencyValue = intentData?.recency_filter;
            if (intent === 'earnings' && isTodayRequest) {
                recencyValue = 'hour'; // Données de la dernière heure (après clôture)
                console.log(`🕐 Earnings + "aujourd'hui" détecté → Forcing recency: hour (données après clôture)`);
            } else if (isTodayRequest) {
                recencyValue = 'day'; // Données du jour
                console.log(`🕐 "Aujourd'hui" détecté → Forcing recency: day`);
            } else if (!recencyValue || recencyValue === 'none') {
                // Par défaut pour earnings, utiliser 'day' pour données récentes
                recencyValue = (intent === 'earnings') ? 'day' : 'day';
            }
            
            const validRecency = (recencyValue && recencyValue !== 'none') ? recencyValue : 'day';
            return {
                model: 'perplexity',
                reason: `Factual data required for ${intent}${isTodayRequest ? ' (today requested)' : ''}`,
                recency: validRecency
            };
        }

        // GEMINI: Questions conceptuelles/éducatives (gratuit)
        const conceptualIntents = [
            'portfolio',
            'technical_analysis' // Si pas de ticker spécifique = explication théorique
        ];

        if (conceptualIntents.includes(intent) && !hasTickers) {
            console.log(`💭 Conceptual query (${intent}) → Using GEMINI (free, educational)`);
            return {
                model: 'gemini',
                reason: `Educational/conceptual question about ${intent}`,
                recency: null // Pas de recency pour conceptuel
            };
        }

        // DEFAULT: Perplexity pour sécurité
        console.log('🔄 Default fallback → Using PERPLEXITY');
        return {
            model: 'perplexity',
            reason: 'Default fallback for reliability',
            recency: 'month'
        };
    }

    /**
     * Sélection intelligente des outils basée sur scoring
     * (Enrichi par l'analyse d'intention si disponible)
     */
    async _plan_with_scoring(userMessage, context) {
        const message = userMessage.toLowerCase();
        const availableTools = this.toolsConfig.tools.filter(tool => tool.enabled);

        // 🚫 SKIP OUTILS pour greetings et questions simples qui n'ont PAS besoin de données
        const intent = context.intent_data?.intent || 'unknown';
        const noToolsIntents = ['greeting', 'help', 'capabilities'];

        if (noToolsIntents.includes(intent)) {
            console.log(`👋 Intent "${intent}" detected - NO TOOLS NEEDED (will respond directly)`);
            return []; // Retourner liste vide - Emma répondra sans données
        }

        // Si intent analysis a suggéré des outils, leur donner la priorité
        const suggestedTools = context.suggested_tools || [];
        const extractedTickers = context.extracted_tickers || context.tickers || [];

        // Scoring des outils
        const scoredTools = availableTools.map(tool => {
            let score = 0;

            // Score de base (priorité inversée - plus bas = mieux)
            score += (tool.priority * 10);

            // COGNITIVE SCAFFOLDING BOOST: Si l'outil est suggéré par intent analysis
            if (suggestedTools.includes(tool.id)) {
                const suggestionIndex = suggestedTools.indexOf(tool.id);
                // Plus l'outil est tôt dans la liste, plus le boost est fort
                const intentBoost = 100 - (suggestionIndex * 10); // 100, 90, 80, 70, 60
                score -= intentBoost;
                console.log(`🎯 Intent boost for ${tool.id}: -${intentBoost} points`);
            }

            // Score de pertinence contextuelle (enrichi par tickers extraits)
            const relevanceScore = this._calculateRelevanceScore(tool, message, {
                ...context,
                tickers: extractedTickers.length > 0 ? extractedTickers : context.tickers
            });
            score -= relevanceScore;

            // Score de performance historique
            const performanceScore = this._calculatePerformanceScore(tool.id);
            score -= performanceScore;

            // Bonus pour outils récemment utilisés avec succès
            const recencyBonus = this._calculateRecencyBonus(tool.id);
            score -= recencyBonus;

            return {
                ...tool,
                calculated_score: score,
                relevance_score: relevanceScore,
                performance_score: performanceScore,
                recency_bonus: recencyBonus,
                intent_boosted: suggestedTools.includes(tool.id)
            };
        });

        // Tri par score (plus bas = mieux)
        scoredTools.sort((a, b) => a.calculated_score - b.calculated_score);

        // 🚀 ANALYSE COMPLÈTE DE TICKER: Force les outils essentiels pour obtenir TOUTES les métriques
        const isTickerAnalysis = extractedTickers.length > 0 || context.tickers?.length > 0;
        const isComprehensiveAnalysis = context.intent === 'comprehensive_analysis' ||
                                       message.includes('analyse') ||
                                       message.includes('analyser');

        let selectedTools = [];

        if (isTickerAnalysis && isComprehensiveAnalysis) {
            // Pour une analyse complète, forcer les outils essentiels
            const essentialToolIds = [
                'fmp-quote',              // Prix actuel
                'fmp-fundamentals',       // Profil entreprise
                'fmp-ratios',             // P/E, P/B, ROE, Debt/Equity
                'fmp-key-metrics',        // EPS, Free Cash Flow, Market Cap
                'fmp-ticker-news',        // Nouvelles récentes
                'fmp-ratings',            // Consensus analystes
                'earnings-calendar'       // Prochains résultats
            ];

            // Ajouter les outils essentiels en priorité
            const essentialTools = scoredTools.filter(t => essentialToolIds.includes(t.id));
            const remainingTools = scoredTools.filter(t => !essentialToolIds.includes(t.id));

            selectedTools = [...essentialTools, ...remainingTools];

            console.log(`🎯 ANALYSE COMPLÈTE activée: ${essentialTools.length} outils essentiels forcés`);
        } else {
            // Sélection normale basée sur le scoring
            selectedTools = scoredTools;
        }

        // 🚀 OPTIMISATION SMS: Skip outils "nice-to-have" non essentiels
        if (context.user_channel === 'sms') {
            const message = userMessage.toLowerCase();
            
            // Outils optionnels (skip sauf si explicitement demandés)
            const optionalTools = ['earnings-calendar', 'analyst-recommendations', 'economic-calendar'];
            
            const isExplicitlyRequested = (toolId) => {
                const toolKeywords = {
                    'earnings-calendar': ['résultats', 'earnings', 'résultat', 'publication'],
                    'analyst-recommendations': ['analyste', 'recommandation', 'consensus', 'rating'],
                    'economic-calendar': ['calendrier', 'économique', 'événement', 'macro']
                };
                
                const keywords = toolKeywords[toolId] || [];
                return keywords.some(kw => message.includes(kw));
            };
            
            selectedTools = selectedTools.filter(tool => {
                if (optionalTools.includes(tool.id)) {
                    const keep = isExplicitlyRequested(tool.id);
                    if (!keep) {
                        console.log(`📱 SMS optimization: Skipping ${tool.id} (not explicitly requested)`);
                    }
                    return keep;
                }
                return true;
            });
            
            console.log(`📱 SMS mode: ${selectedTools.length} tools selected (optimized)`);
        }

        // Limitation au nombre max d'outils concurrents
        const maxTools = Math.min(this.toolsConfig.config.max_concurrent_tools, selectedTools.length);
        const finalSelection = selectedTools.slice(0, maxTools);

        console.log('🎯 Tool scoring results:', finalSelection.map(t => ({
            id: t.id,
            score: t.calculated_score,
            relevance: t.relevance_score,
            performance: t.performance_score,
            forced: isTickerAnalysis && isComprehensiveAnalysis ? 'essential' : 'scored'
        })));

        return finalSelection;
    }

    /**
     * Calcul du score de pertinence contextuelle
     */
    _calculateRelevanceScore(tool, message, context) {
        let score = 0;
        
        // Mots-clés dans le message
        tool.keywords.forEach(keyword => {
            if (message.includes(keyword.toLowerCase())) {
                score += 20;
            }
        });
        
        // Contexte d'utilisation
        tool.usage_context.forEach(context_word => {
            if (message.includes(context_word.toLowerCase())) {
                score += 15;
            }
        });
        
        // Contexte spécifique (tickers, etc.)
        if (context.tickers && tool.id.includes('ticker')) {
            score += 25;
        }
        
        if (context.news_requested && tool.category === 'news') {
            score += 30;
        }
        
        if (context.calculation_needed && tool.category === 'calculation') {
            score += 35;
        }
        
        return score;
    }

    /**
     * Calcul du score de performance historique
     */
    _calculatePerformanceScore(toolId) {
        const stats = this.usageStats[toolId];
        if (!stats || stats.total_calls === 0) {
            return 10; // Score neutre pour nouveaux outils
        }
        
        // Score basé sur le taux de succès
        const successRate = stats.success_rate;
        return Math.round(successRate * 30); // Max 30 points
    }

    /**
     * Bonus pour utilisation récente
     */
    _calculateRecencyBonus(toolId) {
        const stats = this.usageStats[toolId];
        if (!stats || !stats.last_used) {
            return 0;
        }
        
        const hoursSinceLastUse = (Date.now() - new Date(stats.last_used).getTime()) / (1000 * 60 * 60);
        
        // Bonus décroissant sur 24h
        if (hoursSinceLastUse < 1) return 15;
        if (hoursSinceLastUse < 6) return 10;
        if (hoursSinceLastUse < 24) return 5;
        return 0;
    }

    /**
     * Exécution parallèle des outils sélectionnés
     */
    async _execute_all(selectedTools, userMessage, context) {
        const executionPromises = selectedTools.map(async (tool) => {
            const startTime = Date.now();

            try {
                console.log(`🔧 Executing tool: ${tool.id}`);

                // Import dynamique de l'outil
                const toolModule = await import(`../lib/tools/${tool.implementation.file}`);
                const toolInstance = new toolModule.default();

                // Préparation des paramètres
                const params = this._prepareToolParameters(tool, userMessage, context);

                // Si params est null, skip cet outil (pas de paramètres valides)
                if (params === null) {
                    console.log(`⏭️ Skipping tool ${tool.id} - no valid parameters`);
                    return {
                        tool_id: tool.id,
                        success: false,
                        error: 'Skipped - no valid parameters',
                        skipped: true,
                        execution_time_ms: 0,
                        is_reliable: false
                    };
                }

                // Exécution avec timeout
                const result = await Promise.race([
                    toolInstance.execute(params, context),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Tool timeout')), this.toolsConfig.config.timeout_ms)
                    )
                ]);

                const executionTime = Date.now() - startTime;

                // Mise à jour des statistiques
                this._updateToolStats(tool.id, true, executionTime);

                return {
                    tool_id: tool.id,
                    success: true,
                    data: result,
                    execution_time_ms: executionTime,
                    is_reliable: result && result.is_reliable !== false
                };

            } catch (error) {
                const executionTime = Date.now() - startTime;
                console.error(`❌ Tool ${tool.id} failed:`, error.message);

                // Mise à jour des statistiques d'erreur
                this._updateToolStats(tool.id, false, executionTime, error.message);

                // Tentative de fallback
                const fallbackResult = await this._tryFallback(tool, userMessage, context);

                return {
                    tool_id: tool.id,
                    success: false,
                    error: error.message,
                    fallback_used: fallbackResult ? fallbackResult.tool_id : null,
                    data: fallbackResult ? fallbackResult.data : null,
                    execution_time_ms: executionTime,
                    is_reliable: fallbackResult ? fallbackResult.is_reliable : false
                };
            }
        });

        const results = await Promise.allSettled(executionPromises);
        return results.map(r => r.status === 'fulfilled' ? r.value : {
            success: false,
            error: r.reason?.message || 'Unknown error',
            is_reliable: false
        });
    }

    /**
     * Tentative de fallback en cas d'échec d'outil
     */
    async _tryFallback(failedTool, userMessage, context) {
        if (!failedTool.fallback_tools || failedTool.fallback_tools.length === 0) {
            return null;
        }
        
        for (const fallbackId of failedTool.fallback_tools) {
            try {
                const fallbackTool = this.toolsConfig.tools.find(t => t.id === fallbackId);
                if (!fallbackTool || !fallbackTool.enabled) continue;
                
                console.log(`🔄 Trying fallback: ${fallbackId}`);
                
                const toolModule = await import(`../lib/tools/${fallbackTool.implementation.file}`);
                const toolInstance = new toolModule.default();
                const params = this._prepareToolParameters(fallbackTool, userMessage, context);
                
                const result = await toolInstance.execute(params, context);
                this._updateToolStats(fallbackId, true, 0);
                
                return {
                    tool_id: fallbackId,
                    data: result,
                    is_reliable: result && result.is_reliable !== false
                };
                
            } catch (error) {
                console.error(`❌ Fallback ${fallbackId} also failed:`, error.message);
                continue;
            }
        }
        
        return null;
    }

    /**
     * Préparation des paramètres pour l'outil
     */
    _prepareToolParameters(tool, userMessage, context) {
        const params = {};

        // Extraction des tickers depuis le contexte et le message
        const extractedTickers = this._extractAllTickers(userMessage, context);

        // Pour les outils qui nécessitent un ticker
        if (tool.parameters.ticker) {
            if (extractedTickers && extractedTickers.length > 0) {
                // Si l'outil peut gérer plusieurs tickers, passer tous
                // Sinon, prendre le premier (pour compatibilité)
                params.ticker = extractedTickers[0];

                // Ajouter tous les tickers au contexte pour que l'outil puisse les utiliser
                params.all_tickers = extractedTickers;
            } else {
                // Pas de ticker trouvé - l'outil échouera probablement
                console.warn(`⚠️ Tool ${tool.id} requires ticker but none found`);
                return null; // Retourner null pour skip cet outil
            }
        }

        // Pour calculator: NE PAS l'utiliser si pas de données pour calculer
        if (tool.id === 'calculator') {
            // Calculator nécessite 'operation' ET 'values'
            // Si on n'a pas de données à calculer, skip
            const hasCalculationRequest = userMessage.toLowerCase().match(/calcul|ratio|pe|dividend|market cap|croissance/);

            if (!hasCalculationRequest) {
                console.log('⏭️ Skipping calculator - no calculation requested');
                return null; // Skip calculator
            }

            // Si calcul demandé, essayer d'extraire les paramètres
            if (userMessage.toLowerCase().includes('pe') || userMessage.toLowerCase().includes('p/e')) {
                params.operation = 'pe_ratio';
            } else if (userMessage.toLowerCase().includes('dividend')) {
                params.operation = 'dividend_yield';
            } else if (userMessage.toLowerCase().includes('market cap')) {
                params.operation = 'market_cap';
            } else {
                params.operation = 'pe_ratio'; // Défaut
            }

            // Pour values, on ne peut pas les deviner - skip si pas de données
            if (!context.stockData || !context.stockData[extractedTickers[0]]) {
                console.log('⏭️ Skipping calculator - no stock data available for calculation');
                return null;
            }

            // Essayer d'extraire les valeurs depuis stockData
            const stockInfo = context.stockData[extractedTickers[0]];
            if (params.operation === 'pe_ratio' && stockInfo.price && stockInfo.eps) {
                params.values = {
                    price: stockInfo.price,
                    earnings_per_share: stockInfo.eps
                };
            } else {
                // Pas assez de données pour calculator
                console.log('⏭️ Skipping calculator - insufficient data for calculation');
                return null;
            }
        }

        // Pour les outils qui nécessitent une date
        if (tool.parameters.date) {
            params.date = new Date().toISOString().split('T')[0];
        }

        return params;
    }

    /**
     * Extraction de TOUS les tickers pertinents depuis le message et le contexte
     */
    _extractAllTickers(userMessage, context) {
        const tickers = new Set();

        // 1. Tickers depuis le contexte (priorité)
        if (context.extracted_tickers && context.extracted_tickers.length > 0) {
            // Depuis l'analyse d'intention
            context.extracted_tickers.forEach(t => tickers.add(t.toUpperCase()));
        } else if (context.tickers && context.tickers.length > 0) {
            // Depuis le contexte fourni par le frontend
            context.tickers.forEach(t => tickers.add(t.toUpperCase()));
        }

        // 2. Extract tickers from message using centralized TickerExtractor utility
        const extractedTickers = TickerExtractor.extract(userMessage, {
            includeCompanyNames: true,
            filterCommonWords: true
        });

        extractedTickers.forEach(ticker => tickers.add(ticker));

        return Array.from(tickers);
    }

    /**
     * Génération de la réponse finale avec SMART ROUTING (Perplexity/Gemini/Claude)
     */
    async _generate_response(userMessage, toolResults, context, intentData = null) {
        // Déclarer outputMode avant le try pour qu'il soit accessible dans le catch
            const outputMode = context.output_mode || 'chat';
        
        try {
            console.log(`🎯 Generating response for mode: ${outputMode}`);

            // Préparation du contexte
            // IMPORTANT: Inclure TOUS les outils qui ont retourné des données, même si is_reliable: false
            // Emma doit voir les données pour pouvoir les analyser et en parler
            const toolsData = toolResults
                .filter(r => r.data && !r.skipped) // Inclure tous les outils avec données (même is_reliable: false)
                .map(r => ({
                    tool: r.tool_id,
                    data: r.data,
                    is_reliable: r.is_reliable,
                    success: r.success
                }));

            const conversationContext = this.conversationHistory.slice(-5); // 5 derniers échanges

            // 🎯 SMART ROUTER: Sélectionner le meilleur modèle
            const modelSelection = this._selectModel(intentData, outputMode, toolsData, userMessage);
            console.log(`🤖 Selected model: ${modelSelection.model} (${modelSelection.reason})`);

            // Construire le prompt approprié
            const prompt = this._buildPerplexityPrompt(
                userMessage,
                toolsData,
                conversationContext,
                context,
                intentData
            );

            let response;
            let citations = []; // 📰 Citations extraites de Perplexity

            // Router vers le bon modèle
            if (modelSelection.model === 'claude') {
                // CLAUDE: Briefings premium
                response = await this._call_claude(prompt, outputMode, userMessage, intentData, toolResults, context);
            } else if (modelSelection.model === 'gemini') {
                // GEMINI: Questions conceptuelles (gratuit)
                response = await this._call_gemini(prompt, outputMode, context);
            } else {
                // PERPLEXITY: Données factuelles avec sources (default)
                const perplexityResult = await this._call_perplexity(prompt, outputMode, modelSelection.recency, userMessage, intentData, toolResults, context);

                // Extraire contenu et citations
                if (typeof perplexityResult === 'object' && perplexityResult.content) {
                    response = perplexityResult.content;
                    citations = perplexityResult.citations || [];
                } else {
                    // Fallback si ancien format (string directement)
                    response = perplexityResult;
                }
            }

            // Post-traitement selon le mode
            if (outputMode === 'data') {
                // Valider et parser le JSON
                response = this._validateAndParseJSON(response);
            } else if (outputMode === 'briefing' || outputMode === 'ticker_note') {
                // Nettoyer le Markdown (enlever éventuels artifacts)
                response = this._cleanMarkdown(response);
            } else if (outputMode === 'chat') {
                // 🛡️ Nettoyer tout JSON brut qui pourrait avoir été inclus dans la réponse conversationnelle
                response = this._sanitizeJsonInResponse(response);
            }

            // 📱 TRONCATURE DE SÉCURITÉ FINALE POUR SMS
            // Limite absolue: 7500 caractères (4-5 SMS longs)
            if (context.user_channel === 'sms' && response.length > 7500) {
                console.warn(`⚠️ SMS response too long (${response.length} chars), truncating to 7500...`);

                // Tronquer intelligemment au dernier point ou saut de ligne avant 7000 chars
                const truncated = response.substring(0, 7000);
                const lastPeriod = Math.max(truncated.lastIndexOf('.'), truncated.lastIndexOf('\n'));

                if (lastPeriod > 6000) {
                    // Tronquer au dernier point/saut de ligne
                    response = truncated.substring(0, lastPeriod + 1) + '\n\n💬 Réponse tronquée. Pour + de détails, visite gobapps.com';
                } else {
                    // Tronquer brutalement si pas de point trouvé
                    response = truncated + '...\n\n💬 Réponse tronquée. Pour + de détails, visite gobapps.com';
                }

                console.log(`✅ SMS truncated to ${response.length} chars`);
            }

            // 🛡️ FRESH DATA GUARD: Valider que les données factuelles ont des sources
            let validation = null;
            if (outputMode === 'chat' && modelSelection.model === 'perplexity') {
                validation = this._validateFreshData(response, intentData);
                console.log(`🛡️ FreshDataGuard: Confidence ${(validation.confidence * 100).toFixed(0)}%, Sources: ${validation.source_types_found}`);

                if (!validation.passed) {
                    console.warn('⚠️ FreshDataGuard: Response lacks sources, retrying...');
                    // Retry avec prompt renforcé
                    const reinforcedPrompt = `${prompt}\n\n⚠️ CRITICAL: You MUST include sources for all factual claims. Do not provide generic answers without sources.`;
                    const retryResult = await this._call_perplexity(reinforcedPrompt, outputMode, modelSelection.recency, userMessage, intentData, toolResults, context);

                    // Extraire contenu et citations du retry
                    if (typeof retryResult === 'object' && retryResult.content) {
                        response = retryResult.content;
                        citations = retryResult.citations || [];
                    } else {
                        response = retryResult;
                    }

                    // Nettoyer JSON du retry aussi
                    response = this._sanitizeJsonInResponse(response);

                    // Re-valider
                    validation = this._validateFreshData(response, intentData);
                    console.log(`🛡️ FreshDataGuard (retry): Confidence ${(validation.confidence * 100).toFixed(0)}%, Sources: ${validation.source_types_found}`);
                }
            }

            // Retourner réponse avec validation, modèle utilisé, et citations
            return {
                response,
                citations,  // 📰 Ajouter les citations pour formatage amical ultérieur
                validation,
                model: modelSelection.model,  // Ajout du modèle pour affichage dans l'UI
                model_reason: modelSelection.reason
            };

        } catch (error) {
            console.error('❌ Response generation failed:', error);

            // Réponse de fallback basée sur les données des outils (utilise Gemini pour générer une vraie réponse)
            const fallbackResponse = await this._generateFallbackResponse(userMessage, toolResults, outputMode, context);
            return {
                response: fallbackResponse,
                validation: { passed: false, confidence: 0.3, reason: 'Fallback response' }
            };
        }
    }

    /**
     * 🛡️ FRESH DATA GUARD - Valide la présence de sources pour données factuelles
     * Garantit la fiabilité et la transparence des réponses d'Emma
     */
    _validateFreshData(response, intentData) {
        // Intents qui NÉCESSITENT des sources
        const needsSourcesIntents = [
            'stock_price',
            'fundamentals',
            'news',
            'comprehensive_analysis',
            'comparative_analysis',
            'earnings',
            'market_overview',
            'recommendation'
        ];

        const intent = intentData?.intent || 'unknown';

        // Si intent ne nécessite pas de sources, passer
        if (!needsSourcesIntents.includes(intent)) {
            return {
                passed: true,
                confidence: 0.7,
                reason: 'Intent does not require sources'
            };
        }

        // Vérifier la présence de sources dans la réponse
        const hasSourcePatterns = [
            /\[SOURCE:/i,
            /\[CHART:/i,
            /\[TABLE:/i,
            /\(https?:\/\//i, // URLs
            /Bloomberg|Reuters|La Presse|BNN|CNBC|Financial Times|Wall Street Journal/i,
            /Données de marché:|Sources:/i
        ];

        const hasSources = hasSourcePatterns.some(pattern => pattern.test(response));

        // Calculer score de confiance
        let confidence = 0.5; // Base

        if (hasSources) {
            confidence = 0.9; // Haute confiance si sources présentes

            // Bonus: Plusieurs types de sources
            const sourceTypeCount = hasSourcePatterns.filter(pattern => pattern.test(response)).length;
            if (sourceTypeCount >= 3) confidence = 0.95;
            if (sourceTypeCount >= 5) confidence = 0.98;
        }

        // Vérifier dates récentes (bonus confiance)
        const hasRecentDate = /202[4-5]|janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre/i.test(response);
        if (hasRecentDate) confidence += 0.02;

        return {
            passed: hasSources,
            confidence: Math.min(1.0, confidence),
            reason: hasSources ? 'Sources verified' : 'Missing sources for factual data',
            source_types_found: hasSourcePatterns.filter(pattern => pattern.test(response)).length
        };
    }

    /**
     * Validation et parsing JSON (MODE DATA)
     */
    _validateAndParseJSON(response) {
        try {
            console.log('🔍 Validating JSON response...');

            // Extraire JSON si du texte avant/après
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.error('❌ No JSON found in response');
                return '{}'; // Fallback: objet vide
            }

            // Parser pour valider
            const parsed = JSON.parse(jsonMatch[0]);

            // Retourner JSON stringifié proprement
            console.log('✅ JSON validated successfully');
            return JSON.stringify(parsed, null, 2);

        } catch (error) {
            console.error('❌ JSON validation failed:', error.message);
            console.error('Response was:', response.substring(0, 200));
            return '{}'; // Fallback: objet vide
        }
    }

    /**
     * Nettoyage Markdown (MODE BRIEFING)
     */
    _cleanMarkdown(markdown) {
        // Enlever éventuels code blocks markdown si présents
        let cleaned = markdown.replace(/^```markdown\n/, '').replace(/\n```$/, '');

        // Nettoyer espaces multiples
        cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

        return cleaned.trim();
    }

    /**
     * 🛡️ Détecte et nettoie le JSON brut dans les réponses conversationnelles
     * Protection contre les réponses qui contiennent du JSON au lieu de texte naturel
     */
    _sanitizeJsonInResponse(response) {
        try {
            // Détecter si la réponse contient beaucoup de JSON brut
            const jsonPatterns = [
                /\{[\s\S]{100,}\}/g,  // Gros objets JSON (>100 chars)
                /\[[\s\S]{100,}\]/g,  // Gros arrays JSON (>100 chars)
                /"[a-zA-Z_]+"\s*:\s*[{\["]/g  // Pattern clé:valeur JSON
            ];

            let hasJsonDump = false;
            for (const pattern of jsonPatterns) {
                if (pattern.test(response)) {
                    hasJsonDump = true;
                    break;
                }
            }

            // Si pas de JSON dump détecté, retourner tel quel
            if (!hasJsonDump) {
                return response;
            }

            console.warn('⚠️ JSON dump detected in response, attempting to clean...');

            // Extraire le texte avant et après le JSON
            let cleaned = response;

            // ✅ AMÉLIORATION: Extraire les données JSON et les convertir en texte lisible au lieu de les supprimer
            // Détecter les blocs JSON et essayer de les convertir en format texte
            const jsonBlockRegex = /\{[\s\S]{50,}\}/g;
            cleaned = cleaned.replace(jsonBlockRegex, (jsonMatch) => {
                try {
                    const parsed = JSON.parse(jsonMatch);
                    // Convertir l'objet JSON en texte lisible
                    const textLines = [];
                    for (const [key, value] of Object.entries(parsed)) {
                        if (typeof value === 'object' && value !== null) {
                            textLines.push(`${key}: ${JSON.stringify(value, null, 2)}`);
                        } else {
                            textLines.push(`${key}: ${value}`);
                        }
                    }
                    return textLines.join('\n');
                } catch (e) {
                    // Si le JSON ne peut pas être parsé, supprimer silencieusement
                    return '';
                }
            });

            // Supprimer les code blocks JSON (garder seulement le contenu si possible)
            cleaned = cleaned.replace(/```json\s*([\s\S]*?)\s*```/g, (match, content) => {
                try {
                    const parsed = JSON.parse(content);
                    // Convertir en texte lisible
                    return Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join(', ');
                } catch (e) {
                    return ''; // Supprimer si non parseable
                }
            });
            cleaned = cleaned.replace(/```[\s\S]*?```/g, ''); // Supprimer autres code blocks

            // Supprimer les tableaux JSON non parsables (>200 chars)
            cleaned = cleaned.replace(/\[[\s\S]{200,}\]/g, '');

            // Si la réponse nettoyée est trop courte (moins de 50 chars), c'était probablement que du JSON
            if (cleaned.trim().length < 50) {
                console.error('❌ Response was mostly JSON, returning fallback message');
                return "Je dispose de nombreuses données financières pour répondre à votre question, mais je rencontre un problème technique pour les présenter clairement. Pourriez-vous reformuler votre question de manière plus spécifique ? Par exemple : 'Quel est le prix actuel de [TICKER] ?' ou 'Quelles sont les dernières nouvelles sur [TICKER] ?'";
            }

            // Nettoyer les espaces multiples
            cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
            cleaned = cleaned.trim();

            console.log('✅ JSON dump cleaned from response (converted to readable text)');
            return cleaned;

        } catch (error) {
            console.error('Error sanitizing JSON in response:', error);
            return response; // Retourner original en cas d'erreur
        }
    }

    /**
     * Construction du prompt pour Perplexity (ROUTER - 4 MODES)
     */
    _buildPerplexityPrompt(userMessage, toolsData, conversationContext, context, intentData = null) {
        const outputMode = context.output_mode || 'chat'; // Default: chat
        console.log(`🎯 Building prompt for mode: ${outputMode}`);

        switch (outputMode) {
            case 'chat':
                return this._buildChatPrompt(userMessage, toolsData, conversationContext, context, intentData);

            case 'data':
                return this._buildDataPrompt(userMessage, toolsData, context);

            case 'briefing':
                return this._buildBriefingPrompt(userMessage, toolsData, context, intentData);

            case 'ticker_note':
                return this._buildTickerNotePrompt(userMessage, toolsData, context, intentData);

            default:
                console.warn(`⚠️ Unknown output_mode: ${outputMode}, fallback to chat`);
                return this._buildChatPrompt(userMessage, toolsData, conversationContext, context, intentData);
        }
    }

    /**
     * 📝 Résume intelligemment les données d'un outil pour éviter de dumper du JSON massif
     * Limite la taille et structure les données de manière plus lisible pour l'AI
     */
    _summarizeToolData(toolId, data) {
        try {
            // Limite de taille pour éviter les dumps JSON massifs
            const MAX_ITEMS = 5;  // Max 5 items par array
            const MAX_CHARS = 1000;  // Max 1000 chars par outil

            // Cas spéciaux selon le type d'outil
            if (toolId.includes('news')) {
                // Pour les news, limiter à 5 articles max avec résumé
                if (Array.isArray(data)) {
                    const limitedNews = data.slice(0, MAX_ITEMS).map(article => ({
                        title: article.title || article.headline,
                        date: article.publishedDate || article.datetime,
                        url: article.url
                    }));
                    return JSON.stringify(limitedNews, null, 2);
                }
            }

            if (toolId.includes('fundamentals') || toolId.includes('ratios') || toolId.includes('metrics')) {
                // CFA®-Level: Extraire TOUS les ratios pertinents (39 ratios au lieu de 10)
                const cfaMetrics = {};

                // Définition complète des ratios CFA® par catégorie
                const cfa_ratios = [
                    // Valorisation (9 ratios)
                    'pe', 'pb', 'ps', 'pfcf', 'pegRatio', 'evToSales', 'evToEbitda',
                    'priceToFreeCashFlowsRatio', 'enterpriseValueMultiple', 'priceToOperatingCashFlowsRatio',

                    // Prix et Capitalisation
                    'price', 'marketCap', 'enterpriseValue',

                    // Revenus et Croissance
                    'revenue', 'revenueGrowth', 'revenuePerShare', 'netIncome', 'eps', 'epsgrowth',

                    // Rentabilité (8 ratios)
                    'roe', 'roa', 'roic', 'grossProfitMargin', 'operatingProfitMargin',
                    'netProfitMargin', 'returnOnTangibleAssets', 'effectiveTaxRate',

                    // Liquidité & Solvabilité (6 ratios)
                    'currentRatio', 'quickRatio', 'cashRatio', 'debtToEquity',
                    'debtToAssets', 'interestCoverage', 'longTermDebtToCapitalization',

                    // Efficacité (5 ratios)
                    'assetTurnover', 'inventoryTurnover', 'receivablesTurnover',
                    'daysSalesOutstanding', 'daysPayablesOutstanding', 'cashConversionCycle',

                    // Cash Flow (5 ratios)
                    'freeCashFlowPerShare', 'freeCashFlowYield', 'operatingCashFlowPerShare',
                    'cashPerShare', 'freeCashFlowGrowth',

                    // Dividendes (4 ratios)
                    'dividendYield', 'payoutRatio', 'dividendPerShare', 'bookValuePerShareGrowth'
                ];

                // Extraire tous les ratios disponibles
                for (const key of cfa_ratios) {
                    if (data[key] !== undefined && data[key] !== null) {
                        cfaMetrics[key] = data[key];
                    }
                }

                // Si aucun ratio CFA trouvé, prendre toutes les clés disponibles (fallback)
                if (Object.keys(cfaMetrics).length === 0 && typeof data === 'object') {
                    const allKeys = Object.keys(data);
                    for (const key of allKeys) {
                        if (data[key] !== undefined && data[key] !== null) {
                            cfaMetrics[key] = data[key];
                        }
                    }
                }

                return JSON.stringify(cfaMetrics, null, 2);
            }

            // Pour les arrays génériques, limiter le nombre d'éléments
            if (Array.isArray(data)) {
                const limited = data.slice(0, MAX_ITEMS);
                return JSON.stringify(limited, null, 2);
            }

            // Pour les objets, convertir en JSON et tronquer si trop long
            let jsonStr = JSON.stringify(data, null, 2);
            if (jsonStr.length > MAX_CHARS) {
                jsonStr = jsonStr.substring(0, MAX_CHARS) + '\n... (données tronquées pour lisibilité)';
            }

            return jsonStr;

        } catch (error) {
            console.error(`Error summarizing data for ${toolId}:`, error);
            return JSON.stringify(data, null, 2).substring(0, 500);
        }
    }

    /**
     * MODE CHAT: Réponse conversationnelle naturelle
     */
    _buildChatPrompt(userMessage, toolsData, conversationContext, context, intentData) {
        const currentDate = new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const currentDateTime = new Date().toISOString();

        let intentContext = '';
        if (intentData) {
            intentContext = `\nINTENTION DÉTECTÉE:
- Type: ${intentData.intent}
- Confiance: ${(intentData.confidence * 100).toFixed(0)}%
- Résumé: ${intentData.user_intent_summary || 'Non spécifié'}
- Tickers identifiés: ${intentData.tickers?.join(', ') || 'aucun'}\n`;
        }

        // Information sur l'utilisateur
        const userName = context.user_name || null;
        const userContext = userName
            ? `\n👤 UTILISATEUR: Tu parles avec ${userName}. Personnalise tes salutations et réponses en utilisant son nom quand approprié.

🌍 FOCUS GÉOGRAPHIQUE DES MARCHÉS:
- PRIORITÉ: Marchés américains (NYSE, NASDAQ) 🇺🇸
- SECONDAIRE: Marchés canadiens (TSX) 🇨🇦
- TERTIAIRE: Aperçu marchés mondiaux (Europe, Asie)
- ❌ ÉVITER: Immobilier français, marchés européens de niche sauf si explicitement demandé
- L'utilisateur est un gestionnaire de portefeuille québécois/canadien axé sur les actions nord-américaines

⚠️ NE JAMAIS parler d'immobilier français ou de marchés européens de niche sauf si l'utilisateur le demande explicitement.\n`
            : `\n🌍 FOCUS GÉOGRAPHIQUE DES MARCHÉS:
- PRIORITÉ: Marchés américains (NYSE, NASDAQ) 🇺🇸
- SECONDAIRE: Marchés canadiens (TSX) 🇨🇦
- TERTIAIRE: Aperçu marchés mondiaux
- ❌ ÉVITER: Immobilier français, marchés européens de niche sauf si explicitement demandé\n`;

        // Si Emma doit se présenter (premier message ou "Test Emma")
        const shouldIntroduce = context.should_introduce || false;
        const userChannel = context.user_channel || 'chat';

        // Instructions différentes selon canal
        const introContext = shouldIntroduce ? (userChannel === 'sms' ?
            `\n🎯 🎯 🎯 PRÉSENTATION EMMA REQUISE - PRIORITÉ ABSOLUE 🎯 🎯 🎯

Tu dois te présenter IMMÉDIATEMENT car c'est un premier contact ou un message de salutation.

STRUCTURE OBLIGATOIRE (4-5 SMS):
1️⃣ "Salut ${userName || 'JS'} 👋"
2️⃣ "Je suis Emma, ton assistante IA financière propulsée par JSLAI 🚀"
3️⃣ "Je peux t'aider avec : 📊 Analyses de marchés et actions, 📈 Données financières temps réel, 📰 Nouvelles économiques, 💡 Conseils et insights"
4️⃣ "💼 Tape SKILLS pour voir mes capacités avancées (calendriers, courbes, briefings, etc.)"
5️⃣ "Écris-moi au 1-438-544-EMMA 📱"

⚠️ CETTE PRÉSENTATION EST OBLIGATOIRE - NE LA RACCOURCIS PAS.\n` :
            `\n🎯 🎯 🎯 PRÉSENTATION EMMA REQUISE - PRIORITÉ ABSOLUE 🎯 🎯 🎯

C'est un premier contact ou message "Test Emma". Tu DOIS te présenter complètement.

STRUCTURE OBLIGATOIRE:
• Salutation personnalisée avec le nom
• "Je suis Emma, assistante IA financière propulsée par JSLAI 🚀"
• Tes capacités principales (analyses marchés, données temps réel, nouvelles, conseils)
• "Écris SKILLS pour découvrir mes capacités avancées 💼"
• Contact: "Écris-moi au 1-438-544-EMMA 📱"

⚠️ NE RACCOURCIS PAS CETTE PRÉSENTATION.\n`
        ) : '';

        // Instruction pour emojis SMS (désactivée lors des présentations)
        const emojiInstructions = userChannel === 'sms' ? (shouldIntroduce
            ? `\n😊 STYLE SMS: Utilise des emojis pour rendre ta présentation vivante (📊 📈 💰 💡 ✅ 🎯 👋). Pour cette présentation, utilise 4-5 SMS pour être complète.\n`
            : `\n😊 STYLE SMS: Tu communiques par SMS. Utilise des emojis pour rendre tes réponses vivantes et engageantes (📊 📈 💰 💡 ✅ ⚠️ 🎯 👋 etc.). Reste concise mais complète. Pour analyses financières, donne les infos clés sans sacrifier la qualité. Limite-toi à 2-3 phrases maximum pour rester lisible.\n`
        ) : '';

        // CFA®-Level Identity Integration
        const cfaIdentity = intentData && ['comprehensive_analysis', 'fundamentals', 'comparative_analysis', 'earnings', 'recommendation'].includes(intentData.intent)
            ? `${CFA_SYSTEM_PROMPT.identity}

${userChannel === 'sms' ? CFA_SYSTEM_PROMPT.smsFormat.split('\n\n')[0] : ''}

🎯 MISSION: Analyse de niveau institutionnel CFA® avec:
- Minimum 8-12 ratios financiers
- Comparaisons sectorielles obligatoires
- Justifications détaillées chiffrées
- Sources fiables (FMP, Perplexity, Bloomberg)
- Formatage Bloomberg Terminal style

`
            : `Tu es Emma, l'assistante financière intelligente. Réponds en français de manière professionnelle et accessible.`;

        return `${cfaIdentity}${userContext}${introContext}${emojiInstructions}
📅 DATE ACTUELLE: ${currentDate} (${currentDateTime})
⚠️ CRITIQUE: Toutes les données doivent refléter les informations les plus récentes. Si une donnée est datée (ex: "au 8 août"), précise clairement que c'est une donnée ancienne et cherche des informations plus récentes si disponibles.

CONTEXTE DE LA CONVERSATION:
${conversationContext.map(c => `- ${c.role}: ${c.content}`).join('\n')}
${intentContext}
DONNÉES DISPONIBLES DES OUTILS (résumées pour éviter surcharge):
${toolsData.map(t => {
    const reliabilityNote = t.is_reliable === false ? ' [⚠️ SOURCE PARTIELLE - Utiliser avec prudence]' : '';
    return `- ${t.tool}${reliabilityNote}: ${this._summarizeToolData(t.tool, t.data)}`;
}).join('\n')}

QUESTION DE L'UTILISATEUR: ${userMessage}

INSTRUCTIONS CRITIQUES:
1. ❌ ❌ ❌ ABSOLUMENT INTERDIT DE COPIER DU JSON/CODE DANS TA RÉPONSE ❌ ❌ ❌
   - Les données JSON ci-dessus sont pour TON ANALYSE INTERNE SEULEMENT
   - Tu dois TOUJOURS transformer ces données en TEXTE NATUREL EN FRANÇAIS
   - ❌ INTERDIT: Afficher "{\\"price\\": 245.67}" ou tout autre JSON/code
   - ❌ INTERDIT: Afficher des listes JSON comme "[{...}, {...}]"
   - ❌ INTERDIT: Copier-coller des structures de données brutes
   - ✅ CORRECT: "Le prix actuel est de 245,67$, en hausse de 2,3%"
   - ✅ CORRECT: "Voici les 3 dernières actualités : 1) [titre], 2) [titre], 3) [titre]"

2. ✅ TU ES UNE ANALYSTE FINANCIÈRE HUMAINE, PAS UN TERMINAL DE DONNÉES
   - INTERPRÈTE et SYNTHÉTISE les chiffres de manière conversationnelle
   - EXPLIQUE le contexte et la signification des données
   - RACONTE l'histoire derrière les chiffres, ne les liste pas
   - Utilise des PHRASES COMPLÈTES et des PARAGRAPHES lisibles

3. ✅ TOUJOURS fournir une réponse COMPLÈTE et UTILE basée sur les données disponibles
4. ✅ Utilise TOUTES les données fournies par les outils, MÊME si marquées "[⚠️ SOURCE PARTIELLE]"
   - Les données partielles sont MEILLEURES que pas de données du tout
   - Analyse ce qui est disponible et fournis des insights basés sur ces données
5. ✅ Si un outil a retourné des données pour PLUSIEURS tickers (news_by_ticker, fundamentals_by_ticker):
   - Analyse CHAQUE ticker individuellement
   - Fournis un résumé pour CHAQUE compagnie mentionnée
   - N'ignore PAS les tickers - ils sont tous importants
6. ❌ NE JAMAIS dire "aucune donnée disponible" si des outils ont retourné des données (même partielles)
7. ❌ NE JAMAIS demander de clarifications - fournis directement l'analyse
8. ⚠️ IMPORTANT: Vérifie les dates des données - signale si anciennes (> 1 mois) et mentionne la date actuelle: ${currentDate}
9. Cite tes sources (outils utilisés) en fin de réponse
10. Ton: professionnel mais accessible, comme une vraie analyste financière
${intentData ? `11. L'intention détectée: ${intentData.intent} - ${intentData.intent === 'comprehensive_analysis' ? 'fournis une analyse COMPLÈTE pour chaque ticker avec prix, fondamentaux, et actualités' : 'réponds en analysant tous les tickers pertinents'}` : ''}

📊 GRAPHIQUES ET VISUALISATIONS - ANALYSE CONTEXTUALISÉE:

**🎯 GRAPHIQUES DE RATIOS HISTORIQUES (RECOMMANDÉS):**
Quand tu analyses des ratios financiers (P/E, P/B, ROE, etc.), tu DOIS comparer avec l'historique et le secteur:

**Tags disponibles:**
- [RATIO_CHART:TICKER:PE] → Évolution P/E Ratio (5 ans)
- [RATIO_CHART:TICKER:PB] → Évolution Price-to-Book
- [RATIO_CHART:TICKER:ROE] → Évolution Return on Equity
- [RATIO_CHART:TICKER:PROFIT_MARGIN] → Évolution Marge bénéficiaire
- [RATIO_CHART:TICKER:DEBT_EQUITY] → Évolution Ratio d'endettement

**✅ UTILISATION RECOMMANDÉE:**
Lors d'une analyse complète, intègre 1-2 graphiques de ratios pertinents:

Exemple CORRECT:
"Microsoft affiche un P/E de 32,5x, supérieur à sa moyenne historique de 28x et au secteur (28x). Cette expansion de multiple reflète les attentes de croissance IA.

[RATIO_CHART:MSFT:PE]

La marge bénéficiaire de 34% se maintient au-dessus de 30% depuis 5 ans, témoignant de la qualité du business model.

[RATIO_CHART:MSFT:PROFIT_MARGIN]"

**📈 AUTRES GRAPHIQUES (Si demandé explicitement):**
- [CHART:FINVIZ:TICKER] → Graphique technique
- [CHART:TRADINGVIEW:EXCHANGE:TICKER] → TradingView interactif
- [STOCKCARD:TICKER] → Carte boursière Perplexity-style

**Règles d'utilisation:**
✅ Analyses complètes: Ajouter 1-2 graphiques ratios pertinents
✅ Comparer ratio actuel vs historique (graphique le montre)
✅ Mentionner contexte secteur dans analyse
❌ SMS: Pas de graphiques ratios (trop lourds), juste mention verbale
✅ Web/Email: Inclure graphiques ratios systématiquement

**Exemple d'intégration (si demandé):**
"Voici l'analyse de Apple (AAPL) :

Le titre se négocie actuellement à 245,67$ (+2,34%). P/E de 28,5x vs secteur 22,3x.

Voulez-vous que je vous montre le graphique TradingView pour une analyse technique?"

EXEMPLE DE BONNE RÉPONSE (si demande sur plusieurs tickers):
"Voici une analyse des initiatives IA récentes pour les compagnies de l'équipe:

**GOOGL (Alphabet/Google)**
- Initiative IA: [analyse basée sur les news récupérées]
- Source: [détails de la news avec date]

**T (AT&T)**
- Initiative IA: [analyse basée sur les données disponibles]
...

[Continue pour TOUS les tickers dans les données]"

RÉPONSE:`;
    }

    /**
     * MODE DATA: JSON structuré SEULEMENT
     */
    _buildDataPrompt(userMessage, toolsData, context) {
        const tickers = context.tickers || context.key_tickers || [];
        const fieldsRequested = context.fields_requested || [];

        return `Tu es Emma Data Extractor. Extrait et structure les données demandées en JSON STRICT.

DONNÉES DISPONIBLES DES OUTILS:
${toolsData.map(t => `- ${t.tool}: ${JSON.stringify(t.data, null, 2)}`).join('\n')}

DEMANDE: ${userMessage}

TICKERS DEMANDÉS: ${tickers.join(', ') || 'tous disponibles'}
CHAMPS DEMANDÉS: ${fieldsRequested.join(', ') || 'tous pertinents'}

INSTRUCTIONS CRITIQUES:
1. RETOURNER UNIQUEMENT DU JSON VALIDE - PAS DE TEXTE AVANT OU APRÈS
2. Structure: { "TICKER": { "field": value, ... } }
3. Inclure SEULEMENT les champs demandés ou pertinents au contexte
4. Valeurs numériques en NUMBER, pas en STRING
5. Si donnée manquante: utiliser null
6. Pas de commentaires, pas d'explications, SEULEMENT JSON
7. Utiliser les noms de champs anglais standards: price, pe, volume, marketCap, eps, etc.

EXEMPLE FORMAT ATTENDU:
{
  "AAPL": {
    "price": 245.67,
    "change": 5.67,
    "changePercent": 2.34,
    "volume": 58234567,
    "marketCap": 3850000000000,
    "pe": 32.4,
    "eps": 7.58
  },
  "MSFT": {
    "price": 428.32,
    "change": 3.21,
    "changePercent": 0.75,
    "volume": 24567890,
    "marketCap": 3200000000000,
    "pe": 38.1,
    "eps": 11.24
  }
}

RÉPONSE JSON:`;
    }

    /**
     * MODE BRIEFING: Analyse détaillée pour email
     */
    _buildBriefingPrompt(userMessage, toolsData, context, intentData) {
        const currentDate = new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const currentDateTime = new Date().toISOString();
        const briefingType = context.briefing_type || context.type || 'general';
        const importanceLevel = intentData?.importance_level || context.importance_level || 5;
        const trendingTopics = intentData?.trending_topics || [];

        return `Tu es Emma Financial Analyst. Rédige une analyse approfondie MULTIMÉDIA pour un briefing ${briefingType}.

📅 DATE ACTUELLE: ${currentDate} (${currentDateTime})
⚠️ CRITIQUE: Ce briefing doit refléter les données du ${currentDate}. Toutes les dates mentionnées doivent être vérifiées et corrigées si anciennes.

DONNÉES DISPONIBLES DES OUTILS:
${toolsData.map(t => `- ${t.tool}: ${JSON.stringify(t.data, null, 2)}`).join('\n')}

CONTEXTE: ${userMessage}

INTENT DÉTECTÉ:
- Type: ${intentData?.intent || 'market_overview'}
- Importance: ${importanceLevel}/10
- Trending Topics: ${trendingTopics.join(', ') || 'N/A'}

TYPE DE BRIEFING: ${briefingType}

INSTRUCTIONS PRINCIPALES:
1. Rédige une analyse DÉTAILLÉE et PROFESSIONNELLE (1500-2000 mots minimum)
2. Structure OBLIGATOIRE avec sections claires (##, ###)
3. Inclure des DONNÉES CHIFFRÉES précises (prix, %, volumes, etc.)
4. Ton: Professionnel institutionnel
5. Focus sur l'ACTIONNABLE et les INSIGHTS
6. Format MARKDOWN avec émojis appropriés (📊, 📈, ⚠️, etc.)
7. Si importance >= 8: commencer par une section BREAKING avec les événements majeurs

🎨 INSTRUCTIONS MULTIMÉDIAS (CRITIQUE):

A) SOURCES WEB CRÉDIBLES - Cherche et inclus des liens vers:
   - Bloomberg: https://www.bloomberg.com/quote/[TICKER]
   - La Presse (Canada): https://www.lapresse.ca/affaires/
   - Financial Times: https://www.ft.com/markets
   - Reuters: https://www.reuters.com/markets/
   - Wall Street Journal: https://www.wsj.com/market-data
   - CNBC: https://www.cnbc.com/quotes/[TICKER]
   - BNN Bloomberg (Canada): https://www.bnnbloomberg.ca/

B) GRAPHIQUES ET CHARTS - Inclus SEULEMENT si explicitement demandé:
   📈 TradingView: [CHART:TRADINGVIEW:NASDAQ:TICKER]
   📊 Finviz: [CHART:FINVIZ:TICKER]
   🌡️ Heatmap sectorielle: [CHART:FINVIZ:SECTORS]

B-BIS) CARTES BOURSIÈRES ET RATIOS HISTORIQUES (NOUVEAU):
   💼 Carte boursière Perplexity-style: [STOCKCARD:TICKER]
      → Affiche prix, variation, métriques clés (P/E, Market Cap, Volume, 52W Range), mini-chart
      → Utilise pour présenter les performances d'une action de manière professionnelle
      → Exemple: "Voici la performance actuelle de MGA: [STOCKCARD:MGA]"

   📊 Graphique de ratios historiques Macrotrends-style: [RATIO_CHART:TICKER:METRIC]
      → Affiche l'évolution historique (5 ans) d'un ratio ou métrique fondamentale
      → Métriques disponibles: PE, PB, PS, PROFIT_MARGIN, ROE, ROA, DEBT_EQUITY, CURRENT_RATIO, REVENUE_GROWTH, EARNINGS_GROWTH
      → Exemple: "Évolution du P/E Ratio d'Apple: [RATIO_CHART:AAPL:PE]"
      → Exemple: "Marge bénéficiaire de Microsoft: [RATIO_CHART:MSFT:PROFIT_MARGIN]"

   💡 QUAND UTILISER CES NOUVEAUX TAGS:
   - [STOCKCARD:TICKER]: Pour répondre à "Quelle est la performance de [TICKER]?" ou analyses d'actions individuelles
   - [RATIO_CHART:TICKER:METRIC]: Pour analyses fondamentales, comparaisons historiques, évaluations de valorisation

C) TABLEAUX DE DONNÉES - Crée des tableaux HTML pour:
   - Performance tickers (Prix, Var %, Volume, MarketCap)
   - Résultats vs attentes (Actuel, Consensus, Surprise %)
   - Niveaux techniques (Support, Résistance, RSI, MACD)

   Format: [TABLE:NOM_TABLE|Col1,Col2,Col3|Val1,Val2,Val3|Val4,Val5,Val6]

D) IMAGES ET VISUELS:
   - Logos entreprises: [LOGO:TICKER]
   - Screenshots charts: [SCREENSHOT:TICKER:TIMEFRAME]
   - Timeline événements: [TIMELINE:EVENTS]

E) LIENS SOURCES - Pour CHAQUE donnée/affirmation, fournis URL complète
   Format: [SOURCE:NOM_SOURCE|URL_COMPLETE]

STRUCTURE ATTENDUE:

## 📊 [Titre Principal Contextualisé]

**Résumé Exécutif:** [2-3 phrases capturant l'essentiel de l'analyse]

[TABLE:PERFORMANCE_INDICES|Indice,Valeur,Variation %|S&P 500,5825.23,+0.45|NASDAQ,18456.32,+0.82]

### 📈 Performance du Jour
[Analyse détaillée des mouvements de prix, volumes, catalyseurs du jour]

**Indices majeurs:**
- S&P 500: [données] ([SOURCE:Bloomberg|https://www.bloomberg.com/quote/SPX:IND])
- NASDAQ: [données] ([SOURCE:CNBC|https://www.cnbc.com/quotes/.IXIC])
- DOW: [données]

**Actions clés:**
[TABLE:TOP_MOVERS|Ticker,Prix,Var %,Volume|AAPL,247.25,-0.84%,58.2M|TSLA,245.67,+2.34%,125.3M]

### 💼 Analyse Fondamentale
[Métriques clés avec tableaux comparatifs]

[TABLE:FUNDAMENTALS|Ticker,PE,EPS,Revenue Growth|AAPL,32.4,7.58,+8.5%|MSFT,38.1,11.24,+12.3%]

[SOURCE:Financial Times|https://www.ft.com/content/...]

### 📉 Analyse Technique
[Indicateurs techniques et niveaux clés]

[CHART:TRADINGVIEW:NASDAQ:AAPL]

[TABLE:TECHNICAL_LEVELS|Ticker,RSI,MACD,Support,Résistance|AAPL,58.2,Positif,240,255]

### 📰 Actualités et Catalyseurs
[News importantes avec impact marché]

**Principales actualités:**
1. [Titre] ([SOURCE:La Presse|https://www.lapresse.ca/affaires/...])
2. [Titre] ([SOURCE:Reuters|https://www.reuters.com/markets/...])
3. [Titre] ([SOURCE:BNN Bloomberg|https://www.bnnbloomberg.ca/...])

[TIMELINE:EVENTS]

### 🎯 Recommandations et Points de Surveillance
[Insights actionnables avec niveaux précis]

[TABLE:RECOMMENDATIONS|Action,Entry,Stop Loss,Target,Ratio R/R|AAPL,245-248,240,265,1:3.4]

---
**Sources Complètes:**
- Données de marché: Polygon.io, FMP, Finnhub
- Actualités: [SOURCE:Bloomberg|URL], [SOURCE:Reuters|URL], [SOURCE:La Presse|URL]
- Charts: TradingView, Finviz
- Analyses: Emma Agent + Perplexity AI

RÉPONSE MARKDOWN ENRICHIE:`;
    }

    /**
     * MODE TICKER_NOTE: Note professionnelle complète pour un ticker spécifique
     * Format email-ready avec graphiques, tableaux, carte boursière et sources
     */
    _buildTickerNotePrompt(userMessage, toolsData, context, intentData) {
        const currentDate = new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const currentDateTime = new Date().toISOString();

        // Extraire le ticker principal
        const ticker = context.ticker || intentData?.tickers?.[0] || context.extracted_tickers?.[0] || 'N/A';

        return `Tu es Emma Financial Analyst. Génère une note professionnelle complète pour le ticker **${ticker}** selon les instructions ci-dessous.

📅 DATE ACTUELLE: ${currentDate} (${currentDateTime})
⚠️ CRITIQUE: Utilise UNIQUEMENT des données réelles les plus récentes du ${currentDate}. JAMAIS de données simulées.

DONNÉES DISPONIBLES DES OUTILS:
${toolsData.map(t => `- ${t.tool}: ${JSON.stringify(t.data, null, 2)}`).join('\n')}

CONTEXTE: ${userMessage}

TICKER: **${ticker}**

═══════════════════════════════════════════════════════════
INSTRUCTIONS DÉTAILLÉES POUR LA NOTE PROFESSIONNELLE
═══════════════════════════════════════════════════════════

## 📋 STRUCTURE OBLIGATOIRE

### 1. EN-TÊTE
**[${ticker}] - Analyse Professionnelle**
Date: ${currentDate}

### 2. SYNTHÈSE EXÉCUTIVE
Rédige une synthèse structurée et concise en français, adaptée à un email professionnel.
- Utilise des bullet points pour les points clés
- Mets en évidence les éléments importants
- Ton professionnel mais accessible

### 3. COMPARAISON AVEC CONSENSUS ANALYSTES
⚠️ CRITIQUE: Compare SYSTÉMATIQUEMENT chaque chiffre-clé avec le consensus:
- Résultat net (vs. consensus)
- BPA - Bénéfice Par Action (vs. consensus)
- Chiffre d'affaires (vs. consensus)
- Indique EXPLICITEMENT les écarts en % et en valeur absolue

### 4. TABLEAU RÉCAPITULATIF OBLIGATOIRE
Crée un tableau avec cette structure:

[TABLE:RESULTATS_VS_CONSENSUS|Métrique,Résultat Actuel,Consensus,Écart,Source|
Résultat Net,[valeur],[consensus],[écart %],[source]|
BPA,[valeur],[consensus],[écart %],[source]|
Chiffre d'affaires,[valeur],[consensus],[écart %],[source]]

### 5. CARTE BOURSIÈRE PERPLEXITY-STYLE
Intègre la carte boursière pour ce ticker:
[STOCKCARD:${ticker}]

Cette carte affiche automatiquement:
- Prix en temps réel
- Variation % du jour
- Métriques clés (P/E, Market Cap, Volume)
- 52-Week Range
- Mini-graphique d'évolution

### 6. GRAPHIQUES DE RATIOS HISTORIQUES (5 ANS)
Ajoute des graphiques d'évolution des ratios clés:
[RATIO_CHART:${ticker}:PE] → Évolution du P/E Ratio
[RATIO_CHART:${ticker}:PROFIT_MARGIN] → Marge bénéficiaire
[RATIO_CHART:${ticker}:ROE] → Return on Equity

Autres ratios disponibles si pertinents:
- PB (Price-to-Book)
- PS (Price-to-Sales)
- ROA (Return on Assets)
- DEBT_EQUITY (Ratio dette/équité)
- CURRENT_RATIO (Ratio de liquidité)
- REVENUE_GROWTH (Croissance revenus)
- EARNINGS_GROWTH (Croissance bénéfices)

### 7. GRAPHIQUE BOURSIER DU MOIS
Génère un graphique technique détaillé:
### 8. GRAPHIQUE CHIFFRÉ (ÉVOLUTION TRIMESTRIELLE - Optionnel)
Si l'utilisateur demande un graphique, utilise:
[CHART:TRADINGVIEW:NASDAQ:${ticker}]

Ou crée un tableau d'évolution trimestrielle:
[TABLE:EVOLUTION_TRIMESTRIELLE|Trimestre,Résultat Net,CA,BPA|
Q1 2024,[valeur],[valeur],[valeur]|
Q2 2024,[valeur],[valeur],[valeur]|
Q3 2024,[valeur],[valeur],[valeur]|
Q4 2024,[valeur],[valeur],[valeur]]

### 9. ACTUALITÉS ET CATALYSEURS
Liste les actualités récentes pertinentes avec dates et sources:

**Actualités récentes:**
1. [Titre de l'actualité] - [Date] ([SOURCE:Nom|URL])
2. [Titre de l'actualité] - [Date] ([SOURCE:Nom|URL])
3. [Titre de l'actualité] - [Date] ([SOURCE:Nom|URL])

### 10. SIGNATURE ET SOURCES
Termine par:

---
**📊 Analyse générée par Emma IA™**
Propulsée par JSL AI 🌱

**Sources consultées:**
- Données de marché: [SOURCE:FMP|URL], [SOURCE:Polygon|URL]
- Actualités: [SOURCE:Bloomberg|URL], [SOURCE:Reuters|URL]
- Analyses: [SOURCE:Perplexity|URL]
- Consensus analystes: [SOURCE:Source|URL]
- Date de génération: ${currentDate}

═══════════════════════════════════════════════════════════
RÈGLES CRITIQUES À RESPECTER
═══════════════════════════════════════════════════════════

✅ OBLIGATIONS:
1. Utiliser UNIQUEMENT des données réelles les plus récentes
2. Comparer TOUS les chiffres-clés avec le consensus des analystes
3. Indiquer EXPLICITEMENT les sources pour chaque donnée
4. Inclure AU MINIMUM 2 graphiques (carte boursière + 1 ratio historique)
5. Format prêt à l'export email (HTML responsive ou Markdown propre)
6. Tableaux structurés avec format [TABLE:...]
7. Tous les montants en format professionnel (ex: 2,45M$, 1,23B$)

❌ INTERDICTIONS:
1. JAMAIS de données simulées ou inventées
2. JAMAIS de "données non disponibles" sans avoir vérifié toutes les sources
3. JAMAIS omettre les sources
4. JAMAIS de données anciennes (> 1 mois) sans mentionner leur date
5. JAMAIS de format incompatible email (JavaScript, CSS externe)

🎨 TAGS MULTIMÉDIAS DISPONIBLES:
- [STOCKCARD:TICKER] → Carte boursière complète
- [RATIO_CHART:TICKER:METRIC] → Graphique ratio historique 5 ans
- [CHART:FINVIZ:TICKER] → Graphique technique Finviz
- [CHART:TRADINGVIEW:EXCHANGE:TICKER] → Graphique TradingView
- [TABLE:NOM|Col1,Col2|Val1,Val2] → Tableau structuré
- [LOGO:TICKER] → Logo entreprise
- [SOURCE:NOM|URL] → Citation de source

📧 FORMAT EMAIL-READY:
- Utiliser Markdown standard (##, ###, **bold**, *italic*)
- Tableaux en format [TABLE:...] (conversion automatique en HTML)
- Graphiques via tags (affichage automatique)
- Pas de code HTML complexe (géré automatiquement)
- Responsive design automatique

RÉPONSE (NOTE PROFESSIONNELLE POUR ${ticker}):`;
    }

    /**
     * Appel à l'API Perplexity (avec recency filter)
     */
    /**
     * 🧠 Détecte la complexité d'une question pour ajuster automatiquement les tokens
     * Simple: 800 tokens, Moyenne: 2000-4000, Complexe: 6000-8000
     */
    _detectComplexity(userMessage, intentData, toolResults) {
        let complexityScore = 0;

        // 1. Nombre de tickers mentionnés (multi-ticker = plus complexe)
        const tickers = intentData?.tickers || [];
        if (tickers.length >= 5) complexityScore += 3;
        else if (tickers.length >= 3) complexityScore += 2;
        else if (tickers.length >= 2) complexityScore += 1;

        // 2. Mots-clés de complexité dans la question
        const complexKeywords = [
            'analyse approfondie', 'détaillée', 'complète', 'comparaison', 'compare',
            'fondamentaux', 'technique', 'actualités', 'earnings', 'rapports',
            'tous', 'plusieurs', 'et', 'ainsi que', 'également',
            'pourquoi', 'comment', 'expliquer', 'analyser'
        ];
        const matchedKeywords = complexKeywords.filter(kw =>
            userMessage.toLowerCase().includes(kw)
        );
        complexityScore += matchedKeywords.length;

        // 3. Type d'intent (certains intents nécessitent plus de détails)
        const complexIntents = [
            'comprehensive_analysis', 'comparative_analysis',
            'earnings', 'recommendation', 'fundamental_analysis'
        ];
        if (intentData && complexIntents.includes(intentData.intent)) {
            complexityScore += 2;
        }

        // 4. Nombre d'outils utilisés (plus d'outils = plus de données à synthétiser)
        const toolCount = toolResults?.length || 0;
        if (toolCount >= 5) complexityScore += 2;
        else if (toolCount >= 3) complexityScore += 1;

        // 5. Longueur de la question (questions longues = réponse détaillée attendue)
        if (userMessage.length > 200) complexityScore += 2;
        else if (userMessage.length > 100) complexityScore += 1;

        // Déterminer le niveau de complexité et les tokens appropriés
        // 🚀 TOKENS AUGMENTÉS ENCORE PLUS pour analyses LONGUES et COMPLÈTES (Bug 5 fix)
        // User feedback: "jaimais beaucoup avoir une longue analyse et maintenant c'est tellement court"
        if (complexityScore <= 2) {
            return { level: 'simple', tokens: 3000, description: 'Question simple - réponse complète avec chiffres (800-1000 mots)' };
        } else if (complexityScore <= 5) {
            return { level: 'moyenne', tokens: 6000, description: 'Question modérément complexe - analyse détaillée (1200-1500 mots)' };
        } else if (complexityScore <= 8) {
            return { level: 'complexe', tokens: 8000, description: 'Analyse détaillée avec données temps réel (1500-2000 mots)' };
        } else {
            return { level: 'très_complexe', tokens: 10000, description: 'Analyse exhaustive multi-dimensionnelle (2000-2500 mots)' };
        }
    }

    async _call_perplexity(prompt, outputMode = 'chat', recency = 'month', userMessage = '', intentData = null, toolResults = [], context = {}) {
        // ✅ Variables pour gestion de timeout (déclarées avant try pour être accessibles dans catch)
        let timeout = null;
        let timeoutDuration = 60000;  // Valeur par défaut
        
        try {
            // 🚀🚀🚀 RÉPONSES ULTRA-LONGUES PAR DÉFAUT (MAXIMUM DÉTAIL)
            // RÈGLE: Plus c'est long, mieux c'est!
            let maxTokens = 4000;  // 🎯 DEFAULT ULTRA-AUGMENTÉ: 4000 tokens (~3000 mots = ULTRA-DÉTAILLÉ)
            let complexityInfo = null;

            // 📱 SMS: Contenu complet mais optimisé pour éviter timeouts
            if (context.user_channel === 'sms') {
                maxTokens = 4000;  // 📱 SMS: 4000 tokens (~3000 mots, 6-8 SMS) - équilibre contenu/performance
                console.log('📱 SMS mode: 4000 tokens (contenu complet optimisé - 6-8 SMS)');
            } else if (outputMode === 'briefing') {
                maxTokens = 10000;  // 🚀 Briefing MAXIMUM (AUGMENTÉ 8000 → 10000)
                console.log('📊 Briefing mode: 10000 tokens (MAXIMUM EXHAUSTIF)');
            } else if (outputMode === 'ticker_note') {
                maxTokens = 10000;  // 📋 Note professionnelle MAXIMUM (AUGMENTÉ 8000 → 10000)
                console.log('📋 Ticker note mode: 10000 tokens (note professionnelle MAXIMUM)');
            } else if (outputMode === 'data') {
                maxTokens = 500;  // JSON structuré: court
            } else if (outputMode === 'chat') {
                // 🧠 Détection automatique de complexité pour ajustement intelligent
                complexityInfo = this._detectComplexity(userMessage, intentData, toolResults);
                
                // ✅ FIX: Forcer 15000 tokens pour comprehensive_analysis (12 sections obligatoires)
                const isComprehensiveAnalysis = intentData?.intent === 'comprehensive_analysis';
                if (isComprehensiveAnalysis) {
                    maxTokens = 15000;  // 🎯 FORCÉ: 15000 tokens pour analyses complètes (12 sections)
                    console.log(`🎯 Comprehensive Analysis détecté → FORCÉ à 15000 tokens (12 sections obligatoires)`);
                } else {
                    // 🚀🚀 MULTIPLIER par 3 les tokens pour réponses ULTRA-LONGUES
                    maxTokens = complexityInfo.tokens * 3;
                    console.log(`🧠 Complexité détectée: ${complexityInfo.level} → ${maxTokens} tokens (×3 BOOST MAXIMUM pour réponses ULTRA-LONGUES) (${complexityInfo.description})`);
                }
            }

            // 🎯 NOUVEAU: Utiliser prompt spécifique par intent si disponible
            let systemPrompt = null;
            
            // Vérifier si un prompt custom existe pour cet intent
            if (intentData && intentData.intent && hasCustomPrompt(intentData.intent)) {
                systemPrompt = getIntentPrompt(intentData.intent);
                
                // ✅ Pour earnings, injecter la date actuelle dans le prompt
                if (intentData.intent === 'earnings') {
                    const currentDate = new Date().toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    });
                    systemPrompt = systemPrompt.replace('(date actuelle)', `(${currentDate})`);
                }
                
                console.log(`🎯 Using custom prompt for intent: ${intentData.intent}`);
            }

            const requestBody = {
                model: 'sonar-pro',  // Modèle premium Perplexity (Jan 2025) - Meilleure qualité, plus de citations, recherche approfondie
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt || (outputMode === 'data'
                            ? 'Tu es Emma Data Extractor. Retourne UNIQUEMENT du JSON valide, pas de texte explicatif.'
                            : context.user_channel === 'sms'
                            ? `Tu es Emma, analyste financière CFA inspirée par Warren Buffett, Peter Lynch et Benjamin Graham.

📱 FORMAT SMS:
• Paragraphes courts (2-3 lignes)
• PAS d'astérisques ** ou markdown
• Chiffres: "P/E: 32x (vs 5 ans: 28x, secteur: 28x)"
• Sections: "📊 Valorisation:", "🌍 Macro:", "💡 Questions:"

💼 CONTENU REQUIS (12 sections):
1. Vue d'ensemble + prix
2. Valorisation + ratios historiques (vs 5 ans, vs secteur)
3. Performance YTD
4. Contexte macro (Fed, inflation si pertinent)
5. Fondamentaux (ROE, marges vs historique)
6. Moat analysis (avantages compétitifs)
7. Valeur intrinsèque (DCF, marge sécurité)
8. Résultats récents
9. Catalysts
10. Risques principaux
11. Recommandation value
12. 2-3 questions suggérées

📊 RATIOS: Toujours vs historique + secteur
🌍 MACRO: Fed, inflation (si impact ticker)
🏰 MOAT: Type + durabilité
💰 DCF: Valeur vs prix, marge sécurité
💡 QUESTIONS: 2-3 pertinentes, pas redondantes

EXEMPLE:
"📊 MSFT - Analyse

Prix: 380$ (+1,2%)
Cap: 2,85T$

💰 Valorisation
P/E: 32x (5 ans: 28x, secteur: 28x)
→ +14% au-dessus historique

🌍 Macro
Fed 5,25% (high 22 ans)
Inflation 3,2% → pression valorisations

💼 Fondamentaux
ROE: 31% (5 ans: 28%)
Marges: 36% (secteur: 24%)

🏰 Moat
Network effects Office (400M users)
Switching costs élevés
Durabilité: 20+ ans

📊 Valeur
DCF: 425$ vs prix 380$
Marge sécurité: 11% (idéal: 30%)

⚠️ Risques
Antitrust US/EU
Concurrence cloud

✅ Reco
HOLD 380$
ACHETER < 340$ (marge 25%+)

💡 Questions:
1. Comparaison vs GOOGL/AMZN?
2. Impact récession 2024?
3. Stratégie DCA?"

❌ PAS d'astérisques **gras**`
                            : `Tu es Emma, une assistante financière experte et analyste professionnelle inspirée par les principes de Warren Buffett, Charlie Munger, Peter Lynch et Benjamin Graham (value investing).

🚀🚀🚀 LONGUEUR DES RÉPONSES (RÈGLE #1 ABSOLUE - MAXIMUM DÉTAIL) 🚀🚀🚀:
• 📏 RÉPONSES ULTRA-LONGUES PAR DÉFAUT: Privilégie TOUJOURS des réponses EXTRÊMEMENT LONGUES et EXHAUSTIVES
• 📊 Analyses: 2000-3000 mots MINIMUM (3000-5000 mots pour analyses complexes)
• ✅ LONGUEUR = EXCELLENCE: Plus c'est long, plus c'est complet, mieux c'est!
• 🎯 TOUJOURS choisir "trop long" plutôt que "trop court" - pas de limite supérieure!
• ❌ JAMAIS de réponses brèves sauf questions oui/non évidentes
• 💡 DÉVELOPPE ABSOLUMENT TOUT: chaque point mérite 2-3 paragraphes détaillés
• 📖 Structure multi-sections: minimum 10-15 sections avec sous-sections
• 🔢 CHIFFRES EXHAUSTIFS: tableaux complets, historiques 5-10 ans, comparatifs multiples
• 📚 CONTEXTE HISTORIQUE: toujours ajouter perspective historique et tendances long-terme
• 🌍 COMPARAISONS SECTORIELLES: comparer avec d'autres titres UNIQUEMENT si explicitement demandé par l'utilisateur (ex: "compare avec...", "vs...", "comparaison"). Si l'utilisateur demande uniquement l'analyse d'un ticker spécifique, NE PAS inclure de comparaisons avec d'autres titres.
• 💼 SCÉNARIOS MULTIPLES: toujours 3+ scénarios (optimiste/réaliste/pessimiste) avec chiffres

🌍🏛️ CONTEXTE MACRO-ÉCONOMIQUE & GÉOPOLITIQUE (OBLIGATOIRE) 🌍🏛️:
• 🌎 ANALYSE PAR PAYS: TOUJOURS différencier les données par pays/région
  - USA vs Canada vs Europe vs Asie: ratios moyens, contexte économique, réglementation
  - Taux d'intérêt directeurs par pays (Fed, BoC, BCE, BoJ, BoE)
  - Inflation par pays (CPI, Core CPI)
  - PIB et croissance économique par région
  - Politique fiscale et budgets gouvernementaux
  - Taux de chômage et santé du marché du travail

• 🏛️ CONTEXTE POLITIQUE (si pertinent pour le ticker):
  - Élections et changements de gouvernement (impact sur régulation, taxes)
  - Politiques commerciales (tarifs, accords, tensions USA-Chine, etc.)
  - Réglementation sectorielle (tech antitrust, pharma, énergie verte)
  - Politiques monétaires (quantitative easing, tightening)
  - Subventions gouvernementales et incitations fiscales
  - Tensions géopolitiques (guerre, sanctions, embargos)

• 📰 ACTUALITÉ ÉCONOMIQUE (liens avec l'entreprise):
  - Annonces Fed/Banques Centrales → impact sur valorisations
  - Rapports économiques (emploi, inflation, retail sales) → impact consommateur
  - Crises sectorielles → exposition du ticker
  - Tendances macro (récession, expansion, stagflation)
  - Sentiment de marché (VIX, indices de confiance)

• 🌍 COMPARAISONS INTERNATIONALES:
  - Ratios sectoriels: USA vs Canada vs Europe vs Asie
  - Exemple: "P/E tech USA: 28x, Canada: 22x, Europe: 18x, Asie: 15x"
  - Rendements obligataires par pays (impact sur valorisation actions)
  - Devises et impact sur revenus internationaux
  - Différences de normes comptables (GAAP vs IFRS)

📊 VALUE INVESTING PRINCIPLES (Buffett, Munger, Lynch, Graham) 📊:
• 💰 VALEUR INTRINSÈQUE (Benjamin Graham):
  - Calculer valeur intrinsèque vs prix de marché
  - Marge de sécurité (Margin of Safety): prix doit être 30-50% sous valeur intrinsèque
  - Book Value et P/B ratio (éviter survalorisation)
  - Net-Net Working Capital (Graham's formula si applicable)

• 🏰 MOAT ANALYSIS (Warren Buffett):
  - Identifier les avantages compétitifs durables (moat)
  - Types de moat: brand power, network effects, cost advantages, switching costs, regulatory
  - Évaluer la largeur et durabilité du moat (5-10-20 ans)
  - Pricing power: l'entreprise peut-elle augmenter prix sans perdre clients?

• 📈 CROISSANCE RAISONNABLE (Peter Lynch - GARP):
  - PEG Ratio (P/E / Growth rate): idéal < 1.0
  - Croissance soutenable vs spéculative
  - "Invest in what you know" - business model simple et compréhensible
  - Éviter "diworsification" - focus sur core business

• 💼 QUALITÉ DU MANAGEMENT (Munger):
  - Intégrité et track record du CEO/management
  - Allocation de capital intelligente (rachats, dividendes, acquisitions)
  - Insider ownership (skin in the game)
  - Culture d'entreprise et rétention talents

• 📊 FREE CASH FLOW FOCUS (Buffett):
  - Priorité au Free Cash Flow sur earnings comptables
  - Owner Earnings = FCF - capex maintenance
  - Cash conversion rate élevé
  - Éviter les entreprises qui brûlent du cash

• ⏳ VISION LONG-TERME (10+ ans):
  - "Time in the market beats timing the market"
  - Où sera cette entreprise dans 10 ans?
  - Résilience aux cycles économiques
  - Capacité à traverser les crises

• 🔍 RED FLAGS À SURVEILLER:
  - Endettement excessif (Debt/Equity > 2.0 pour non-financières)
  - Marges en déclin sur plusieurs trimestres
  - Revenus qui stagnent ou décroissent
  - Changements comptables suspects
  - Dilution excessive (trop d'émissions d'actions)
  - Turnover management élevé
  - Procès en cours importants
  - Dépendance à un seul client/produit

🔢 RATIOS HISTORIQUES & BENCHMARKS (OBLIGATOIRE) 🔢:
• 📊 TOUJOURS comparer les ratios actuels vs historiques:
  - P/E actuel vs moyenne 5 ans, 10 ans, historique
  - P/E vs secteur, vs marché (S&P 500), vs pays
  - Marges actuelles vs historique (tendance amélioration/détérioration?)
  - ROE actuel vs historique (cohérence?)
  - Debt/Equity: tendance hausse/baisse sur 5-10 ans

• 📈 BENCHMARKS PAR PAYS (exemples):
  - P/E moyen S&P 500 (USA): ~18-22x historique
  - P/E moyen TSX (Canada): ~14-18x historique
  - P/E moyen Euro Stoxx 50: ~12-16x historique
  - Yields dividendes typiques par secteur/pays

• ⏱️ CONTEXTE TEMPOREL:
  - "P/E 32x est 40% au-dessus de sa moyenne 5 ans (23x)"
  - "Marges à 42% sont près du high historique (43% en 2021)"
  - "Dette a baissé de 45% depuis 5 ans (amélioration structure)"

EXEMPLE D'ANALYSE COMPLÈTE INTÉGRANT TOUT:
"Microsoft (MSFT) trade à 32,5x earnings, soit 15% au-dessus de sa moyenne 5 ans (28x) mais sous son high 2021 (38x). Comparativement, le P/E moyen tech USA est 28x vs 22x au Canada (TSX tech). 

CONTEXTE MACRO: La Fed maintient taux à 5,25-5,50%, le plus haut en 22 ans, impactant les valorisations tech. Inflation US à 3,2% (vs 2,9% Canada, 2,4% Europe) justifie ce niveau. Les élections US 2024 créent incertitude réglementaire tech (antitrust).

VALUE INVESTING: MSFT possède un moat exceptionnel (network effects Office/Azure, switching costs élevés, brand power). FCF de 65B$ (+12% YoY) vs market cap 2,85T$ = FCF yield 2,3% (attractif vs T-bills 5,3% mais justifié par croissance). Management (Satya Nadella) excellent track record allocation capital. PEG ratio 1,3x (P/E 32,5 / croissance 25%) = raisonnable pour qualité.

RISQUES POLITIQUES: Antitrust US/EU surveillance intense, potentiel démantèlement. Régulation IA émergente. Tensions USA-Chine impactent cloud Asie.

RECOMMANDATION VALUE: À 380$, MSFT trade à ~0,90x sa valeur intrinsèque estimée (425$ par DCF). Marge de sécurité faible (15% vs 30% idéal Graham). HOLD pour value investors, ACHETER si correction 340-350$ (marge 25%+)."

💡 QUESTIONS SUGGÉRÉES INTELLIGENTES (OBLIGATOIRE EN FIN DE RÉPONSE) 💡:
• 🎯 TOUJOURS terminer ta réponse par 3-5 questions suggérées PERTINENTES
• ✅ Questions doivent BONIFIER la compréhension ou OUVRIR de nouvelles perspectives
• ❌ JAMAIS de redondance - ne pas demander ce qui a déjà été couvert en détail
• 🔍 Types de questions intelligentes à suggérer:

  📊 APPROFONDISSEMENT STRATÉGIQUE:
  - "Voulez-vous une analyse détaillée du segment Azure vs AWS/Google Cloud?"
  - "Dois-je comparer MSFT avec ses concurrents directs (AAPL, GOOGL, AMZN)?"
  - "Souhaitez-vous un calcul DCF détaillé pour estimer la valeur intrinsèque?"
  
  🌍 ÉLARGISSEMENT MACRO:
  - "Voulez-vous analyser l'impact d'une récession US sur ce secteur?"
  - "Dois-je explorer les opportunités dans d'autres régions (Europe, Asie)?"
  - "Souhaitez-vous comprendre l'impact des taux Fed sur les valorisations tech?"
  
  💼 CONSTRUCTION PORTFOLIO:
  - "Voulez-vous des suggestions de diversification pour compléter cette position?"
  - "Dois-je analyser des alternatives value dans le même secteur?"
  - "Souhaitez-vous une stratégie d'entrée progressive (DCA) avec prix cibles?"
  
  📈 TIMING & TACTIQUE:
  - "Voulez-vous identifier les niveaux techniques clés pour un point d'entrée?"
  - "Dois-je analyser le calendrier des prochains catalysts (earnings, événements)?"
  - "Souhaitez-vous une stratégie options pour cette position?"
  
  🔬 ANALYSE SECTORIELLE:
  - "Voulez-vous une analyse complète du secteur tech avec tendances 2025?"
  - "Dois-je explorer les sous-secteurs émergents (IA, cloud, cybersécurité)?"
  - "Souhaitez-vous identifier les leaders et challengers du secteur?"
  
  🌐 CONTEXTE GÉOPOLITIQUE:
  - "Voulez-vous analyser l'impact des tensions USA-Chine sur cette entreprise?"
  - "Dois-je explorer les risques réglementaires (antitrust, privacy)?"
  - "Souhaitez-vous comprendre l'exposition aux marchés internationaux?"

• 📝 FORMAT DES QUESTIONS SUGGÉRÉES:
  Terminer CHAQUE réponse par:
  
  "💡 **Questions pour approfondir:**
  1. [Question stratégique pertinente]
  2. [Question macro/sectorielle]
  3. [Question portfolio/tactique]
  4. [Question timing/catalysts]
  5. [Question alternative/diversification]
  
  Quelle direction vous intéresse le plus?"

• 🎯 RÈGLES POUR CHOISIR LES BONNES QUESTIONS:
  ✅ Identifier les gaps dans l'analyse actuelle
  ✅ Proposer des angles complémentaires (pas redondants)
  ✅ Adapter au niveau de sophistication de l'utilisateur
  ✅ Prioriser l'actionnable (décisions d'investissement)
  ✅ Varier les horizons temporels (court/moyen/long terme)
  ❌ Ne PAS redemander des infos déjà fournies en détail
  ❌ Ne PAS poser de questions trop basiques si analyse avancée
  ❌ Ne PAS suggérer > 5 questions (éviter surcharge)

EXEMPLE DE QUESTIONS SUGGÉRÉES (après analyse MSFT):
"💡 **Questions pour approfondir:**
1. Voulez-vous une comparaison détaillée MSFT vs GOOGL vs AMZN sur les segments cloud?
2. Dois-je analyser l'impact d'une potentielle récession US 2024 sur les dépenses IT entreprises?
3. Souhaitez-vous une stratégie d'allocation progressive avec 3-4 points d'entrée échelonnés?
4. Voulez-vous explorer les opportunités dans les small-caps tech value (P/E < 15x, croissance > 15%)?
5. Dois-je analyser les alternatives défensives tech (dividendes > 3%) pour diversifier?

Quelle direction vous intéresse le plus?"'

RÈGLES CRITIQUES:
1. ❌ NE JAMAIS retourner du JSON brut ou du code dans tes réponses
2. ✅ TOUJOURS analyser et expliquer les données de manière conversationnelle en français
3. ✅ TOUJOURS agir en tant qu'analyste financière qui INTERPRÈTE les données, pas juste les affiche
4. ✅ Ton style: professionnel, accessible, pédagogique
5. ✅ Structure tes réponses avec des paragraphes, des bullet points, et des insights
6. ❌ Si tu vois du JSON dans le prompt, c'est pour TON analyse - ne le copie JAMAIS tel quel dans ta réponse
7. 📰 SOURCES: Quand tu utilises des données récentes, mentionne naturellement la source (ex: "Selon Bloomberg...", "Reuters rapporte que...", "D'après les dernières données de...")
8. 📊 CHIFFRES ET DONNÉES TEMPS RÉEL: Priorise TOUJOURS les données chiffrées précises et récentes de Perplexity et FMP
   - ✅ "AAPL: 245,67$ (+2,36%, +5,67$) à 15h42 EST"
   - ✅ "P/E: 28,5x vs moyenne secteur 22,3x"
   - ✅ "Volume: 52,3M vs moyenne 67,8M (-23%)"
   - ❌ "Apple performe bien" (trop vague, pas de chiffres)
9. 💼 ANALYSE FONDAMENTALE COMPLÈTE - MÉTRIQUES OBLIGATOIRES:
   Lors de l'analyse d'un ticker, tu DOIS TOUJOURS inclure ces métriques (si disponibles dans les données):
   
   📊 VALORISATION (obligatoire):
      • Prix actuel et variation ($ et %)
      • P/E Ratio (Price/Earnings) avec comparaison sectorielle
      • P/FCF Ratio (Price/Free Cash Flow) si disponible
      • P/B Ratio (Price/Book) si disponible
      • Market Cap (capitalisation boursière)
   
   💰 RENTABILITÉ & DIVIDENDES (obligatoire):
      • EPS - Bénéfice par action (actuel et historique)
      • Dividende annuel et rendement (%) si applicable
      • ROE (Return on Equity)
      • Marges bénéficiaires (profit margin)
   
   📈 PERFORMANCE & CONTEXTE (obligatoire):
      • Performance YTD (Year-to-Date en %)
      • Distance depuis 52 semaines high/low (en % et en $)
      • Distance depuis 5 ans high/low si pertinent (contexte historique)
   
   📰 RÉSULTATS & ACTUALITÉS (obligatoire):
      • Résultats récents (dernier rapport trimestriel avec date)
      • Prochains résultats attendus (date si disponible)
      • Nouvelles récentes les plus importantes (2-3 dernières)
   
   🎯 CONSENSUS & ATTENTES (obligatoire si disponible):
      • Consensus d'analystes (Buy/Hold/Sell et nombre d'analystes)
      • Objectif de prix (price target) moyen des analystes
      • Attentes vs résultats réels (beat/miss) pour dernier trimestre
   
   💡 SANTÉ FINANCIÈRE (obligatoire):
      • Ratio d'endettement (Debt/Equity)
      • Current Ratio (liquidité)
      • Free Cash Flow
   
   ⚠️ Indicateurs techniques LIMITÉS (SEULEMENT si demandés explicitement):
      • Moyennes mobiles 200 jours et 50 jours (tendance long/moyen terme)
      • RSI UNIQUEMENT si suracheté (>80) ou survendu (<20) - sinon ne pas mentionner
   
   ❌ NE JAMAIS mentionner: MACD, Bollinger Bands, Stochastic, Fibonacci, volumes (sauf si demandé)
   ❌ Si RSI entre 20-80 (zone neutre): Ne pas le mentionner du tout
10. 📈 GRAPHIQUES: Suggère des graphiques UNIQUEMENT quand explicitement pertinent, PAS systématiquement
   - ✅ "Voulez-vous que je vous montre le graphique TradingView ?" (si analyse technique demandée)
   - ❌ Ne pas ajouter [CHART:...] ou [STOCKCARD:...] automatiquement à chaque réponse

Exemple CORRECT: "Apple (AAPL) affiche une performance solide avec un prix de 245,67$, en hausse de 2,36% aujourd'hui (+5,67$). Le volume de 52,3M est 23% sous la moyenne quotidienne, suggérant une faible conviction. P/E de 28,5x reste supérieur au secteur tech (22,3x)."

Exemple INCORRECT: "{\"AAPL\": {\"price\": 245.67, \"change\": 5.67}}"

Exemple SOURCES CORRECT: "Selon Bloomberg, Tesla a annoncé aujourd'hui..."

Exemple SOURCES INCORRECT: "Tesla a annoncé [1] [2] [3]" (❌ Ne pas utiliser [1] [2] [3], mentionner naturellement)

🎨 TAGS MULTIMÉDIAS DISPONIBLES (à utiliser SEULEMENT si explicitement demandé):
- [STOCKCARD:TICKER] → Carte boursière (si demandé "montre-moi la carte", "résumé visuel")
- [RATIO_CHART:TICKER:METRIC] → Évolution ratio (si demandé "historique P/E", "évolution marges")
- [CHART:FINVIZ:TICKER] → Graphique Finviz (si demandé "graphique", "chart")
- [CHART:TRADINGVIEW:EXCHANGE:TICKER] → Graphique TradingView (si demandé)

Utilise ces tags UNIQUEMENT quand pertinent (max 1 par réponse, sauf si explicitement demandé)`)
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: maxTokens,
                temperature: outputMode === 'briefing' ? 0.5 : 0.7  // Plus déterministe pour briefings
            };

            // Ajouter recency filter si disponible (seulement les valeurs valides)
            const validRecencyValues = ['hour', 'day', 'week', 'month', 'year'];
            if (recency && validRecencyValues.includes(recency)) {
                requestBody.search_recency_filter = recency;
                console.log(`🕐 Using recency filter: ${recency}`);
            } else if (recency) {
                console.warn(`⚠️ Invalid recency value "${recency}", omitting recency filter`);
            }

            // Vérifier que la clé API est définie
            if (!process.env.PERPLEXITY_API_KEY) {
                console.error('\n' + '='.repeat(60));
                console.error('❌ PERPLEXITY_API_KEY NOT CONFIGURED');
                console.error('='.repeat(60));
                console.error('🔑 La clé API Perplexity n\'est pas configurée dans les variables d\'environnement');
                console.error('   → Solution: Ajouter PERPLEXITY_API_KEY dans Vercel Environment Variables');
                console.error('   → Format attendu: pplx-...');
                console.error('   → Vérifiez: Vercel Dashboard → Settings → Environment Variables');
                console.error('='.repeat(60) + '\n');
                console.log('🔄 Falling back to Gemini...');
                throw new Error('PERPLEXITY_API_KEY not configured');
            }

            console.log('🚀 Calling Perplexity API...');

            // ⏱️ Timeout flexible selon le mode et l'intent
            // PRIORITÉ: Intent > Canal
            // - Comprehensive Analysis: 90s (analyses longues avec 12 sections) - PRIORITAIRE même pour SMS
            // - SMS (non-comprehensive): 30s (optimisé pour vitesse)
            // - Autres: 60s (standard)
            const enableStreaming = false; // DÉSACTIVÉ - Causait corruption de texte
            const isComprehensiveAnalysis = intentData?.intent === 'comprehensive_analysis';
            
            // ✅ FIX: Prioriser l'intent sur le canal pour comprehensive_analysis
            if (isComprehensiveAnalysis) {
                timeoutDuration = 90000;  // Comprehensive: 90s (12 sections + macro + moat + DCF) - PRIORITAIRE
                console.log(`⏱️ Comprehensive Analysis détecté → timeout: 90s (prioritaire sur canal)`);
            } else if (context.user_channel === 'sms') {
                timeoutDuration = 30000;  // SMS: 30s (sauf comprehensive_analysis)
            } else {
                timeoutDuration = 60000;  // Autres: 60s (standard)
            }
            
            const controller = new AbortController();
            
            // Streaming désactivé (causait corruption)
            // if (enableStreaming) {
            //     requestBody.stream = true;
            // }

            let response;
            try {
                timeout = setTimeout(() => {
                    console.error(`⏱️ Perplexity API timeout after ${timeoutDuration/1000}s (intent: ${intentData?.intent || 'unknown'})`);
                    controller.abort();
                }, timeoutDuration);

                response = await fetch('https://api.perplexity.ai/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody),
                    signal: controller.signal
                });

                // ✅ Nettoyer le timeout après succès
                clearTimeout(timeout);
                timeout = null;
            } catch (fetchError) {
                // ✅ Nettoyer le timeout en cas d'erreur de fetch
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                }
                throw fetchError;  // Re-throw pour être géré par le catch externe
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ Perplexity API error details:', errorData);
                throw new Error(`Perplexity API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
            }

            console.log('✅ Perplexity API responded');

            // NOUVEAU: Traitement streaming pour SMS
            if (enableStreaming && requestBody.stream) {
                return await this._handleStreamingSMS(response, context);
            }

            // Fallback non-streaming pour autres canaux
            const data = await response.json();
            const content = data.choices[0].message.content;

            // 📰 Extraire les citations/sources de Perplexity pour partage amical
            const citations = data.citations || [];
            
            // ✅ NOUVEAU: Logging détaillé pour diagnostic
            const wordCount = content.split(/\s+/).length;
            const charCount = content.length;
            const tokensUsed = data.usage?.total_tokens || 'unknown';
            const tokensRequested = maxTokens;

            console.log(`📊 [Perplexity Response Stats]`);
            console.log(`   - Words: ${wordCount}`);
            console.log(`   - Characters: ${charCount}`);
            console.log(`   - Tokens used: ${tokensUsed}/${tokensRequested}`);
            console.log(`   - Intent: ${intentData?.intent || 'unknown'}`);
            console.log(`   - Output mode: ${outputMode}`);
            console.log(`   - User channel: ${context.user_channel}`);
            console.log(`   - Citations: ${citations.length}`);

            // Vérifier si réponse semble tronquée
            const seemsTruncated = !content.trim().endsWith('.') && 
                                   !content.trim().endsWith('?') && 
                                   !content.trim().endsWith('!');

            if (seemsTruncated) {
                console.warn(`⚠️ [Perplexity] Réponse semble tronquée (pas de ponctuation finale)`);
            }

            if (wordCount < 500 && intentData?.intent === 'comprehensive_analysis') {
                console.warn(`⚠️ [Perplexity] Réponse très courte pour comprehensive_analysis: ${wordCount} mots (attendu: 2000+ mots)`);
            }

            // Retourner contenu + citations pour formatage ultérieur
            return {
                content: content,
                citations: citations
            };

        } catch (error) {
            // ✅ Nettoyer le timeout si pas déjà fait (sécurité)
            if (timeout !== null) {
                clearTimeout(timeout);
            }

            // 🔍 DIAGNOSTIC DÉTAILLÉ des erreurs Perplexity
            console.error('\n' + '='.repeat(60));
            console.error('❌ ERREUR PERPLEXITY - DIAGNOSTIC');
            console.error('='.repeat(60));
            console.error(`Type d'erreur: ${error.name || 'Unknown'}`);
            console.error(`Message: ${error.message || 'No message'}`);
            console.error(`Intent: ${intentData?.intent || 'unknown'}`);
            console.error(`Canal: ${context.user_channel || 'web'}`);
            console.error(`Timeout configuré: ${timeoutDuration/1000}s`);

            // Gestion spécifique des erreurs de timeout
            if (error.name === 'AbortError' || error.message?.includes('aborted')) {
                console.error(`⏱️  TIMEOUT: Perplexity n'a pas répondu dans les ${timeoutDuration/1000}s`);
                console.error('   → L\'API est trop lente ou surchargée');
                console.error('   → Solution: Augmenter le timeout ou simplifier la requête');
                console.log('🔄 Falling back to Gemini due to timeout...');
            } else if (error.message?.includes('PERPLEXITY_API_KEY')) {
                console.error('🔑 CLÉ API MANQUANTE: PERPLEXITY_API_KEY non configurée');
                console.error('   → Solution: Ajouter PERPLEXITY_API_KEY dans Vercel Environment Variables');
                console.error('   → Format attendu: pplx-...');
            } else if (error.message?.includes('401')) {
                console.error('🔑 AUTHENTIFICATION ÉCHOUÉE: Clé API invalide ou expirée');
                console.error('   → Solution: Vérifier/regénérer la clé dans Perplexity Dashboard');
            } else if (error.message?.includes('429')) {
                console.error('⏱️  QUOTA DÉPASSÉ: Trop de requêtes envoyées');
                console.error('   → Solution: Attendre quelques minutes ou upgrade plan Perplexity');
            } else if (error.message?.includes('400')) {
                console.error('📝 REQUÊTE INVALIDE: Format de requête incorrect');
                console.error('   → Solution: Vérifier le modèle (sonar-pro) et le format des messages');
            } else if (error.message?.includes('503')) {
                console.error('🔧 SERVICE INDISPONIBLE: API Perplexity temporairement down');
                console.error('   → Solution: Réessayer dans quelques instants');
            } else {
                console.error('❌ ERREUR INCONNUE:', error);
                if (error.stack) {
                    console.error('Stack:', error.stack.substring(0, 500));
                }
            }
            console.error('='.repeat(60) + '\n');

            // ✅ VRAI FALLBACK: Appeler Gemini au lieu de throw
            console.log('🔄 Calling Gemini as fallback...');
            return await this._call_gemini(prompt, outputMode, context);
        }
    }

    /**
     * Gestion du streaming Perplexity pour SMS avec envoi progressif
     * DÉSACTIVÉ - Causait corruption de texte (tokens coupés)
     */
    async _handleStreamingSMS(response, context) {
        // STREAMING DÉSACTIVÉ - Retour au mode classique
        console.log('⚠️ Streaming désactivé, utilisation mode classique');
        
        try {
            const data = await response.json();
            const content = data.choices[0].message.content;
            const citations = data.citations || [];
            
            console.log(`✅ Perplexity responded (non-streaming): ${content.length} chars`);
            
            return {
                content: content,
                citations: citations,
                streaming: false
            };
        } catch (error) {
            console.error('❌ Error parsing Perplexity response:', error);
            throw error;
        }
    }

    /**
     * Envoi d'un chunk SMS progressif pendant le streaming
     */
    async _sendSMSChunk(fullContent, chunkIndex, context, isFinal = false) {
        const CHUNK_SIZE = 2000;
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, fullContent.length);
        const chunkContent = fullContent.substring(start, end);
        
        // Découper intelligemment par phrases si possible
        let finalChunk = chunkContent;
        if (!isFinal && end < fullContent.length) {
            const lastPeriod = chunkContent.lastIndexOf('.');
            const lastNewline = chunkContent.lastIndexOf('\n');
            const cutPoint = Math.max(lastPeriod, lastNewline);
            
            if (cutPoint > CHUNK_SIZE * 0.7) {
                finalChunk = chunkContent.substring(0, cutPoint + 1);
            }
        }
        
        // Appeler directement l'adaptateur SMS
        try {
            // Import dynamique pour éviter circular dependencies
            const smsModule = await import('./adapters/sms.js');
            const totalChunks = Math.ceil(fullContent.length / CHUNK_SIZE);
            const prefix = totalChunks > 1 ? `[${chunkIndex + 1}/${totalChunks}] ` : '';
            
            await smsModule.sendSMS(
                context.userId,
                prefix + finalChunk,
                false // pas de simulation
            );
            
            console.log(`📱 SMS chunk ${chunkIndex + 1}/${totalChunks} sent (${finalChunk.length} chars)`);
            
            // Délai entre chunks pour garantir l'ordre
            if (!isFinal) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } catch (error) {
            console.error(`❌ Failed to send SMS chunk ${chunkIndex + 1}:`, error);
        }
    }

    /**
     * Appel à Gemini (gratuit) pour questions conceptuelles
     */
    async _call_gemini(prompt, outputMode = 'chat', context = {}) {
        try {
            if (!process.env.GEMINI_API_KEY) {
                throw new Error('GEMINI_API_KEY not configured');
            }

            // 🚀🚀🚀 RÉPONSES ULTRA-LONGUES PAR DÉFAUT
            let maxTokens = 4000;  // 🎯 DEFAULT ULTRA-AUGMENTÉ: 4000 tokens (~3000 mots)
            if (context.user_channel === 'sms') {
                maxTokens = 2000;  // 📱 SMS: MAX 2000 tokens (4-5 SMS)
                console.log('📱 Gemini SMS mode: FORCED 2000 tokens max (4-5 SMS détaillés)');
            } else if (outputMode === 'briefing') {
                maxTokens = 10000;  // 🚀 Briefing MAXIMUM (AUGMENTÉ 8000 → 10000)
                console.log('📊 Gemini Briefing mode: 10000 tokens (MAXIMUM EXHAUSTIF)');
            } else if (outputMode === 'data') {
                maxTokens = 500;
            } else {
                console.log('🎯 Gemini Chat mode: 4000 tokens (réponses ULTRA-LONGUES par défaut)');
            }
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`;

            // Ajouter instructions système pour mode conversationnel
            const systemInstructions = outputMode === 'data'
                ? 'Tu es Emma Data Extractor. Retourne UNIQUEMENT du JSON valide.'
                : `Tu es Emma, analyste financière experte.

RÈGLES CRITIQUES:
- ❌ NE JAMAIS retourner du JSON brut ou du code
- ✅ TOUJOURS être conversationnelle et analyser les données
- ✅ Tu es une ANALYSTE qui INTERPRÈTE, pas un robot qui affiche des données
- ✅ Réponds en français professionnel et accessible

💼 MÉTRIQUES OBLIGATOIRES pour analyse de ticker:
• VALORISATION: Prix, P/E, P/FCF, P/B, Market Cap
• RENTABILITÉ: EPS, Dividende & rendement, ROE, Marges
• PERFORMANCE: YTD %, 52w high/low, 5y high/low
• RÉSULTATS: Dernier rapport, prochains résultats, nouvelles récentes
• CONSENSUS: Analystes (Buy/Hold/Sell), price target, attentes vs réel
• SANTÉ: Debt/Equity, Current Ratio, Free Cash Flow

🎨 TAGS MULTIMÉDIAS DISPONIBLES:
- [STOCKCARD:TICKER] → Carte boursière professionnelle (prix, métriques, mini-chart)
- [RATIO_CHART:TICKER:METRIC] → Évolution historique de ratios (PE, ROE, PROFIT_MARGIN, etc.)
- [CHART:FINVIZ:TICKER] → Graphique technique Finviz
- [CHART:TRADINGVIEW:EXCHANGE:TICKER] → Graphique TradingView
- [LOGO:TICKER] → Logo de l'entreprise

`;

            const fullPrompt = systemInstructions + prompt;

            // ✅ Utiliser geminiFetchWithRetry pour gestion automatique du rate limiting (429)
            const response = await geminiFetchWithRetry(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: fullPrompt }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: maxTokens,
                        candidateCount: 1
                    }
                })
            }, {
                maxRetries: 4,
                baseDelay: 1000,
                logRetries: true
            });

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

            if (!text) {
                throw new Error('No response from Gemini');
            }

            return text;

        } catch (error) {
            console.error('❌ Gemini API error:', error);
            throw new Error(`Erreur de communication avec Gemini: ${error.message}`);
        }
    }

    /**
     * Appel à Claude (premium) pour briefings et rédaction
     */
    async _call_claude(prompt, outputMode = 'briefing', userMessage = '', intentData = null, toolResults = [], context = {}) {
        try {
            if (!process.env.ANTHROPIC_API_KEY) {
                throw new Error('ANTHROPIC_API_KEY not configured');
            }

            // 🚀🚀🚀 RÉPONSES ULTRA-LONGUES PAR DÉFAUT
            let maxTokens = 4000;  // 🎯 DEFAULT ULTRA-AUGMENTÉ: 4000 tokens (~3000 mots)

            // 📱 SMS: 4-5 messages pour réponses détaillées
            if (context.user_channel === 'sms') {
                maxTokens = 2000;  // 📱 SMS: MAX 2000 tokens (4-5 SMS)
                console.log('📱 Claude SMS mode: FORCED 2000 tokens max (4-5 SMS détaillés)');
            } else if (outputMode === 'briefing') {
                maxTokens = 10000;  // 🚀 Briefing MAXIMUM (AUGMENTÉ 8000 → 10000)
                console.log('📊 Claude Briefing mode: 10000 tokens (MAXIMUM EXHAUSTIF)');
            } else if (outputMode === 'data') {
                maxTokens = 500;
            } else if (outputMode === 'chat') {
                // 🧠 Détection automatique de complexité
                const complexityInfo = this._detectComplexity(userMessage, intentData, toolResults);
                // 🚀🚀 MULTIPLIER par 3 pour réponses ULTRA-LONGUES
                maxTokens = complexityInfo.tokens * 3;
                console.log(`🧠 Claude - Complexité détectée: ${complexityInfo.level} → ${maxTokens} tokens (×3 BOOST MAXIMUM pour réponses ULTRA-LONGUES)`);
            }

            // System prompt pour Claude
            const systemPrompt = outputMode === 'data'
                ? 'Tu es Emma Data Extractor. Retourne UNIQUEMENT du JSON valide, pas de texte explicatif.'
                : `Tu es Emma, analyste financière experte et rédactrice professionnelle.

RÈGLES CRITIQUES:
- ❌ NE JAMAIS retourner du JSON brut ou du code dans tes réponses
- ✅ TOUJOURS analyser et interpréter les données de manière conversationnelle
- ✅ TU ES UNE ANALYSTE qui RÉDIGE des briefings professionnels, pas un robot
- ✅ Utilise un ton institutionnel, professionnel et accessible
- ✅ Structure avec Markdown (##, ###, bullet points, tableaux)
- ✅ Inclus des données chiffrées précises et contextualisées
- ✅ Fournis des insights actionnables et des recommandations

💼 MÉTRIQUES OBLIGATOIRES pour chaque ticker analysé:
• VALORISATION: Prix, P/E, P/FCF, P/B, Market Cap
• RENTABILITÉ: EPS, Dividende & rendement, ROE, Marges
• PERFORMANCE: YTD %, 52w high/low, 5y high/low
• RÉSULTATS: Dernier rapport, prochains résultats, nouvelles récentes
• CONSENSUS: Analystes (Buy/Hold/Sell), price target, attentes vs réel
• SANTÉ: Debt/Equity, Current Ratio, Free Cash Flow

🎨 TAGS MULTIMÉDIAS DISPONIBLES:
Enrichis tes réponses et briefings avec:
- [STOCKCARD:TICKER] → Carte boursière professionnelle (prix, métriques clés, mini-chart)
- [RATIO_CHART:TICKER:METRIC] → Évolution historique de ratios (PE, ROE, PROFIT_MARGIN, DEBT_EQUITY, etc.)
- [CHART:FINVIZ:TICKER] → Graphique technique Finviz (si demandé)
- [CHART:TRADINGVIEW:EXCHANGE:TICKER] → Graphique TradingView (si demandé)
- [LOGO:TICKER] → Logo de l'entreprise

Exemples (utiliser avec parcimonie):
- "Performance de MGA: [STOCKCARD:MGA]" (si demandé un résumé visuel)
- "Historique P/E d'Apple: [RATIO_CHART:AAPL:PE]" (si demandé évolution historique)
- "Analyse technique Tesla: [CHART:FINVIZ:TSLA]" (si demandé graphique technique)

Tu es utilisée principalement pour rédiger des briefings quotidiens de haute qualité.`;

            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'x-api-key': process.env.ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'claude-3-5-sonnet-20241022',
                    max_tokens: maxTokens,
                    temperature: 0.5, // Déterministe pour écriture professionnelle
                    system: systemPrompt,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ]
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Claude API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            return data.content[0].text;

        } catch (error) {
            console.error('❌ Claude API error:', error);
            throw new Error(`Erreur de communication avec Claude: ${error.message}`);
        }
    }

    /**
     * Réponse de fallback si Perplexity échoue (adapté selon mode)
     * Utilise Gemini pour générer une vraie réponse en français au lieu d'afficher du JSON brut
     */
    async _generateFallbackResponse(userMessage, toolResults, outputMode = 'chat', context = {}) {
        const successfulResults = toolResults.filter(r => r.success && r.data);

        if (successfulResults.length === 0) {
            if (outputMode === 'data') {
                return '{}';
            }
            // 📱 SMS: Message d'erreur court si aucune donnée disponible
            if (context.user_channel === 'sms') {
                return "⚠️ Service temporairement indisponible. Emma reviendra dans quelques instants. Pour une réponse immédiate, visitez gobapps.com";
            }
            return "Désolé, je n'ai pas pu récupérer de données fiables pour répondre à votre question. Veuillez réessayer.";
        }

        // Mode DATA: retourner JSON
        if (outputMode === 'data') {
            const dataObj = {};
            successfulResults.forEach(result => {
                if (result.data && typeof result.data === 'object') {
                    Object.assign(dataObj, result.data);
                }
            });
            return JSON.stringify(dataObj, null, 2);
        }

        // Mode CHAT ou BRIEFING: Utiliser Gemini pour générer une vraie réponse en français
        try {
            // Construire un prompt avec les données disponibles
            const toolsDataSummary = successfulResults.map(result => {
                const summary = this._summarizeToolData(result.tool_id, result.data);
                return `**${result.tool_id}**: ${summary}`;
            }).join('\n\n');

            const fallbackPrompt = `Tu es Emma, analyste financière experte. L'utilisateur a posé cette question: "${userMessage}"

J'ai récupéré les données suivantes depuis plusieurs sources:

${toolsDataSummary}

INSTRUCTIONS CRITIQUES:
- ❌ NE JAMAIS afficher du JSON brut ou du code dans ta réponse
- ✅ INTERPRÈTE et SYNTHÉTISE les données en français naturel
- ✅ Sois conversationnelle et professionnelle
- ✅ Explique les chiffres de manière claire et accessible
- ✅ Si tu vois des données de prix, ratios, ou actualités, analyse-les et explique-les
- ✅ Réponds directement à la question de l'utilisateur en utilisant ces données

${context.user_channel === 'sms' ? '📱 Mode SMS: Réponse courte et concise (max 400 caractères)' : '🌐 Mode Web: Réponse détaillée et complète'}

Génère une réponse professionnelle en français basée sur ces données:`;

            // Utiliser Gemini pour générer la réponse
            const geminiResponse = await this._call_gemini(fallbackPrompt, outputMode, context);
            
            // Nettoyer le JSON si présent
            const cleanedResponse = this._sanitizeJsonInResponse(geminiResponse);
            
            return cleanedResponse;

        } catch (error) {
            console.error('❌ Erreur génération fallback avec Gemini:', error);
            
            // Fallback ultime: réponse basique sans JSON
            if (context.user_channel === 'sms') {
                // Pour SMS, réponse très courte
                const firstResult = successfulResults[0];
                if (firstResult.tool_id.includes('price') || firstResult.tool_id.includes('quote')) {
                    const price = firstResult.data?.price || firstResult.data?.data?.price;
                    const ticker = firstResult.data?.ticker || firstResult.data?.data?.ticker || 'l\'action';
                    if (price) {
                        return `👩🏻 ${ticker} se négocie à ${price}$. Données disponibles. Pour + de détails: gobapps.com`;
                    }
                }
                return "👩🏻 Données disponibles. Pour une analyse complète, visite gobapps.com";
            }
            
            // Pour Web, message informatif sans JSON
            return `J'ai récupéré des données depuis ${successfulResults.length} source(s), mais je n'ai pas pu générer une analyse complète. Les données incluent: ${successfulResults.map(r => r.tool_id).join(', ')}.\n\nVeuillez reformuler votre question ou visitez gobapps.com pour plus d'informations.`;
        }
    }

    /**
     * Mise à jour de l'historique de conversation
     */
    _updateConversationHistory(userMessage, response, toolResults) {
        this.conversationHistory.push({
            role: 'user',
            content: userMessage,
            timestamp: new Date().toISOString()
        });
        
        this.conversationHistory.push({
            role: 'assistant',
            content: response,
            tools_used: toolResults.map(r => r.tool_id),
            timestamp: new Date().toISOString()
        });
        
        // Limiter l'historique à 20 échanges (10 questions/réponses)
        if (this.conversationHistory.length > 20) {
            this.conversationHistory = this.conversationHistory.slice(-20);
        }
    }

    /**
     * Mise à jour des statistiques d'outil (sauvegarde dans Supabase)
     */
    async _updateToolStats(toolId, success, executionTime, errorMessage = null) {
        // Mise à jour en mémoire pour utilisation immédiate
        if (!this.usageStats[toolId]) {
            this.usageStats[toolId] = {
                total_calls: 0,
                successful_calls: 0,
                failed_calls: 0,
                average_response_time_ms: 0,
                last_used: null,
                success_rate: 0,
                error_history: []
            };
        }

        const stats = this.usageStats[toolId];
        stats.total_calls++;
        stats.last_used = new Date().toISOString();

        if (success) {
            stats.successful_calls++;
        } else {
            stats.failed_calls++;
            if (errorMessage) {
                stats.error_history.push({
                    timestamp: new Date().toISOString(),
                    error: errorMessage
                });
                // Garder seulement les 10 dernières erreurs
                if (stats.error_history.length > 10) {
                    stats.error_history = stats.error_history.slice(-10);
                }
            }
        }

        // Calcul du taux de succès
        stats.success_rate = stats.total_calls > 0 ? (stats.successful_calls / stats.total_calls) * 100 : 0;

        // Mise à jour du temps de réponse moyen
        if (executionTime > 0) {
            const totalTime = stats.average_response_time_ms * (stats.total_calls - 1) + executionTime;
            stats.average_response_time_ms = Math.round(totalTime / stats.total_calls);
        }

        // Sauvegarde asynchrone dans Supabase (non-bloquante)
        // Si ça échoue, ce n'est pas grave - on a déjà les stats en mémoire
        try {
            const supabase = this._initSupabase();
            if (supabase) {
                // Appel non-bloquant à la fonction Supabase
                supabase.rpc('update_tool_stats', {
                    p_tool_id: toolId,
                    p_success: success,
                    p_execution_time: executionTime,
                    p_error_message: errorMessage
                }).then(({ error }) => {
                    if (error) {
                        console.warn(`⚠️ Failed to save stats for ${toolId} to Supabase:`, error.message);
                    }
                }).catch(err => {
                    console.warn(`⚠️ Error saving stats for ${toolId}:`, err.message);
                });
            }
        } catch (error) {
            // Silently fail - stats en mémoire sont suffisantes pour cette exécution
            console.warn(`⚠️ Could not save stats for ${toolId}:`, error.message);
        }
    }

    /**
     * Initialise le client Supabase (lazy loading)
     */
    _initSupabase() {
        if (!this.supabase) {
            try {
                this.supabase = createSupabaseClient(true); // Use service role for write access
            } catch (error) {
                console.error('❌ Failed to initialize Supabase client:', error);
                this.supabase = null;
            }
        }
        return this.supabase;
    }

    /**
     * Chargement de la configuration des outils
     */
    _loadToolsConfig() {
        try {
            // Read tools config from file (read-only, safe on Vercel)
            // fs and path are now imported at top of file
            const configPath = path.join(process.cwd(), 'config', 'tools_config.json');
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (error) {
            console.error('❌ Failed to load tools config:', error);
            return { tools: [], config: {} };
        }
    }

    /**
     * Chargement des statistiques d'utilisation depuis Supabase
     */
    async _loadUsageStats() {
        if (this.usageStatsLoaded) {
            return this.usageStats;
        }

        try {
            const supabase = this._initSupabase();
            if (!supabase) {
                console.warn('⚠️ Supabase not available, using empty stats');
                this.usageStatsLoaded = true;
                return {};
            }

            const { data, error } = await supabase.rpc('get_all_tool_stats');

            if (error) {
                console.error('❌ Failed to load usage stats from Supabase:', error);
                this.usageStatsLoaded = true;
                return {};
            }

            // Convert array to object indexed by tool_id
            const stats = {};
            if (data && Array.isArray(data)) {
                data.forEach(stat => {
                    stats[stat.tool_id] = {
                        total_calls: stat.total_calls,
                        successful_calls: stat.successful_calls,
                        failed_calls: stat.failed_calls,
                        average_response_time_ms: stat.average_response_time_ms,
                        last_used: stat.last_used,
                        success_rate: parseFloat(stat.success_rate) || 0,
                        error_history: stat.error_history || []
                    };
                });
            }

            this.usageStats = stats;
            this.usageStatsLoaded = true;
            console.log(`✅ Loaded usage stats for ${Object.keys(stats).length} tools from Supabase`);
            return stats;

        } catch (error) {
            console.error('❌ Failed to load usage stats:', error);
            this.usageStatsLoaded = true;
            return {};
        }
    }

    /**
     * Sauvegarde des statistiques d'utilisation dans Supabase (non-bloquante)
     * Note: Cette méthode n'est plus nécessaire car les stats sont maintenant
     * sauvegardées directement dans _updateToolStats via Supabase RPC
     */
    async _saveUsageStats() {
        // Cette méthode est maintenant un no-op
        // Les statistiques sont sauvegardées en temps réel via _updateToolStats
        // qui appelle la fonction Supabase update_tool_stats
        return;
    }

    /**
     * 🔧 AUTO-CORRECTION DES TICKERS
     * Corrige les erreurs courantes de tickers (ex: SONOCO → SON, GOOGL → GOOGL, etc.)
     */
    _autoCorrectTickers(message) {
        // Dictionnaire des corrections courantes (nom complet → ticker correct)
        const tickerCorrections = {
            // Erreurs courantes avec suffixes
            'SONOCO': 'SON',
            'SONOC': 'SON',
            'GOOGLE': 'GOOGL',
            'GOOGL': 'GOOGL',
            'GOOG': 'GOOGL',
            'ALPHABET': 'GOOGL',
            'APPLE': 'AAPL',
            'MICROSOFT': 'MSFT',
            'AMAZON': 'AMZN',
            'TESLA': 'TSLA',
            'META': 'META',
            'FACEBOOK': 'META',
            'NVIDIA': 'NVDA',
            'NETFLIX': 'NFLX',
            'DISNEY': 'DIS',
            'WALMART': 'WMT',
            'JPMORGAN': 'JPM',
            'JP MORGAN': 'JPM',
            'VISA': 'V',
            'MASTERCARD': 'MA',
            'COCA COLA': 'KO',
            'COCA-COLA': 'KO',
            'PEPSI': 'PEP',
            'PEPSICO': 'PEP',
            'MCDONALD': 'MCD',
            'MCDONALDS': 'MCD',
            'NIKE': 'NKE',
            'STARBUCKS': 'SBUX',
            'BOEING': 'BA',
            'INTEL': 'INTC',
            'AMD': 'AMD',
            'CISCO': 'CSCO',
            'ORACLE': 'ORCL',
            'SALESFORCE': 'CRM',
            'ADOBE': 'ADBE',
            'PFIZER': 'PFE',
            'JOHNSON': 'JNJ',
            'JOHNSON & JOHNSON': 'JNJ',
            'MERCK': 'MRK',
            'ABBVIE': 'ABBV',
            'EXXON': 'XOM',
            'EXXONMOBIL': 'XOM',
            'CHEVRON': 'CVX',
            'SHELL': 'SHEL',
            'BP': 'BP',
            'TOTAL': 'TTE',
            'BERKSHIRE': 'BRK.B',
            'BERKSHIRE HATHAWAY': 'BRK.B',
            // Canadiennes
            'ROYAL BANK': 'RY',
            'TD BANK': 'TD',
            'TORONTO DOMINION': 'TD',
            'BANK OF NOVA SCOTIA': 'BNS',
            'SCOTIABANK': 'BNS',
            'BMO': 'BMO',
            'BANK OF MONTREAL': 'BMO',
            'CIBC': 'CM',
            'NATIONAL BANK': 'NA',
            'BANQUE NATIONALE': 'NA',
            'MANULIFE': 'MFC',
            'SUN LIFE': 'SLF',
            'ENBRIDGE': 'ENB',
            'TC ENERGY': 'TRP',
            'TRANSCANADA': 'TRP',
            'CN RAIL': 'CNR',
            'CNR': 'CNR',
            'CP RAIL': 'CP',
            'CANADIAN PACIFIC': 'CP',
            'SHOPIFY': 'SHOP',
            'BCE': 'BCE',
            'BELL': 'BCE',
            'TELUS': 'T',
            'ROGERS': 'RCI.B'
        };

        let correctedMessage = message;
        let corrections = [];

        // Chercher et corriger les tickers dans le message
        for (const [wrong, correct] of Object.entries(tickerCorrections)) {
            // Regex pour matcher le mot entier (insensible à la casse)
            const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
            if (regex.test(correctedMessage)) {
                correctedMessage = correctedMessage.replace(regex, correct);
                corrections.push(`${wrong} → ${correct}`);
            }
        }

        if (corrections.length > 0) {
            console.log(`🔧 Auto-correction tickers: ${corrections.join(', ')}`);
        }

        return correctedMessage;
    }
}

// Instance globale de l'agent
let emmaAgent = null;

/**
 * Handler principal pour l'API Emma Agent
 */
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Vérifier que PERPLEXITY_API_KEY est configurée
    if (!process.env.PERPLEXITY_API_KEY) {
        console.error('❌ PERPLEXITY_API_KEY is not configured!');
        return res.status(503).json({
            success: false,
            error: 'PERPLEXITY_API_KEY non configurée',
            response: '⚙️ Configuration manquante: La clé API Perplexity n\'est pas configurée dans Vercel. Veuillez ajouter PERPLEXITY_API_KEY dans les variables d\'environnement Vercel.',
            is_reliable: false
        });
    }

    try {
        // Initialisation de l'agent si nécessaire
        if (!emmaAgent) {
            emmaAgent = new SmartAgent();
        }

        const { message, context = {} } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Ajout du timestamp de début
        context.start_time = Date.now();

        // Traitement de la requête
        const result = await emmaAgent.processRequest(message, context);

        return res.status(200).json(result);

    } catch (error) {
        console.error('❌ Emma Agent API Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
            response: "Erreur interne du serveur. Veuillez réessayer."
        });
    }
}
