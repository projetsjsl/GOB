/**
 * Emma Agent - Systeme de Function Calling Intelligent avec Cognitive Scaffolding
 *
 * Architecture:
 * - COGNITIVE SCAFFOLDING LAYER: Analyse d'intention avec Perplexity
 * - ReAct REASONING LAYER: Selection intelligente d'outils
 * - TOOL USE LAYER: Execution parallele avec fallbacks
 * - SYNTHESIS LAYER: Generation de reponse finale
 */

import { HybridIntentAnalyzer } from '../lib/intent-analyzer.js';
import { createSupabaseClient } from '../lib/supabase-config.js';
import { TickerExtractor } from '../lib/utils/ticker-extractor.js';
// import { CFA_SYSTEM_PROMPT } from '../config/emma-cfa-prompt.js'; // REMOVED: Now using ConfigManager
// import { getIntentPrompt, hasCustomPrompt } from '../config/intent-prompts.js'; // REMOVED: Now using ConfigManager
import { PERPLEXITY_SYSTEM_PROMPT } from '../config/perplexity-prompt.js';
import { INTENT_PROMPTS } from '../config/intent-prompts.js';
import { configManager } from '../lib/config-manager.js'; // NEW: Config Manager
import { getAllModels } from '../lib/llm-registry.js';
import { geminiFetchWithRetry } from '../lib/utils/gemini-retry.js';
import { ContextMemory } from '../lib/context-memory.js';
import { ResponseValidator } from '../lib/response-validator.js';
import { DynamicPromptsSystem } from '../lib/dynamic-prompts.js';
import { normalizeTickerWithClarification, normalizeTicker, extractGeographicContext, saveTickerPreference } from '../lib/utils/ticker-normalizer.js';
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

        //  NOUVEAU: Systemes cognitifs avances pour ergonomie conversationnelle
        this.contextMemory = new ContextMemory();
        this.responseValidator = new ResponseValidator();
        this.promptSystem = new DynamicPromptsSystem();

        // Initialize Config Manager (async, but we start it here)
        configManager.initialize().catch(err => console.error(' ConfigManager init failed:', err));

        console.log(' Advanced cognitive systems initialized (Context Memory, Response Validator, Dynamic Prompts, ConfigManager)');
    }

    /**
     * Point d'entree principal pour Emma
     */
    async processRequest(userMessage, context = {}) {
        try {
            console.log(' Emma Agent: Processing request:', userMessage.substring(0, 100) + '...');

            // Load usage stats from Supabase if not already loaded (non-blocking)
            if (!this.usageStatsLoaded) {
                await this._loadUsageStats().catch(err => {
                    console.warn(' Could not load usage stats, continuing with empty stats:', err.message);
                });
            }

            // Load conversation history from context if provided
            if (context.conversationHistory && Array.isArray(context.conversationHistory)) {
                //  FIX: Normaliser le format de l'historique (formatHistoryForEmma utilise parts: [{ text }])
                this.conversationHistory = context.conversationHistory.map(msg => {
                    // Si format parts: [{ text }], extraire le texte
                    if (msg.parts && Array.isArray(msg.parts) && msg.parts[0]?.text) {
                        return {
                            role: msg.role,
                            content: msg.parts[0].text,
                            timestamp: msg.timestamp || new Date().toISOString()
                        };
                    }
                    // Si format content direct, utiliser tel quel
                    if (msg.content) {
                        return {
                            role: msg.role,
                            content: msg.content,
                            timestamp: msg.timestamp || new Date().toISOString()
                        };
                    }
                    // Format inconnu, ignorer
                    return null;
                }).filter(msg => msg !== null);
                console.log(` Loaded conversation history: ${this.conversationHistory.length} messages`);
            }

            //  AUTO-CORRECTION DES TICKERS (avant analyse d'intent)
            userMessage = this._autoCorrectTickers(userMessage);


            // 0. COGNITIVE SCAFFOLDING: Analyse d'intention avec Perplexity (ou forced intent)
            let intentData = context.forced_intent;
            
            if (!intentData) {
                intentData = await this._analyzeIntent(userMessage, context);
            } else {
                console.log(` Using forced intent from context: ${intentData.intent} (${intentData.method || 'manual'})`);
                // Assurer que parameters existe
                if (!intentData.parameters) intentData.parameters = {};
            }
            
            console.log(' Intent analysis:', intentData ? intentData.intent : 'fallback to keyword scoring');

            //  NOUVEAU: Mise a jour de la memoire contextuelle
            const enrichedContext = this.contextMemory.updateContext(userMessage, intentData);
            console.log(` Context Memory updated:`, enrichedContext.context_summary);
            console.log(` Primary entity:`, enrichedContext.primary_entity);
            console.log(` Topic changed:`, enrichedContext.topic_changed);

            //  NOUVEAU: Inferer informations manquantes si besoin (tickers depuis contexte)
            if (intentData && (!intentData.tickers || intentData.tickers.length === 0) &&
                enrichedContext.resolved_references && Object.keys(enrichedContext.resolved_references).length > 0) {
                const inferred = this.contextMemory.inferMissingContext(userMessage, intentData);
                if (inferred.tickers && inferred.tickers.length > 0) {
                    console.log(` Tickers inferred from context:`, inferred.tickers);
                    intentData.tickers = [...(intentData.tickers || []), ...inferred.tickers];
                    intentData.confidence = Math.min(intentData.confidence || 0.7, inferred.confidence);
                    console.log(` Intent data enriched with context: ${inferred.tickers.join(', ')} (confidence: ${inferred.confidence})`);
                }
            }

            // Enrichir le contexte passe aux etapes suivantes
            context.enriched_context = enrichedContext;

            //  NOUVELLE FEATURE: Detection de tickers ambigus (POW Canada vs POW US)
            // Verifier si les tickers detectes sont ambigus et necessitent une clarification
            if (intentData && intentData.tickers && intentData.tickers.length > 0) {
                const sessionMemory = {
                    userName: context.user_name || '',
                    tickerPreferences: context.enriched_context?.tickerPreferences || {}
                };

                for (const ticker of intentData.tickers) {
                    const normalizationResult = normalizeTickerWithClarification(ticker, userMessage, sessionMemory);

                    if (normalizationResult.needsClarification) {
                        console.log(` Ticker ambigu detecte: ${ticker} - demande de clarification`);
                        return {
                            success: true,
                            response: normalizationResult.clarificationQuestion,
                            needs_clarification: true,
                            clarification_type: 'ambiguous_ticker',
                            ticker: ticker,
                            options: normalizationResult.options,
                            intent: intentData.intent,
                            confidence: 0.9,
                            tools_used: [],
                            is_reliable: true
                        };
                    }

                    // Si un ticker a ete normalise, mettre a jour la liste
                    if (normalizationResult.normalized && normalizationResult.normalized !== ticker) {
                        console.log(` Ticker normalise: ${ticker} -> ${normalizationResult.normalized}`);
                        const index = intentData.tickers.indexOf(ticker);
                        intentData.tickers[index] = normalizationResult.normalized;

                        // Sauvegarder la preference en memoire de session
                        if (normalizationResult.source === 'geographic_context' || normalizationResult.source === 'session_memory') {
                            saveTickerPreference(sessionMemory, ticker, normalizationResult.normalized);
                            context.enriched_context.tickerPreferences = sessionMemory.tickerPreferences;
                        }
                    }
                }
            }

            //  CLARIFICATIONS ACTIVEES - Emma peut poser des questions de suivi quand necessaire
            // Si l'intention n'est pas claire (confidence < 0.5), Emma demande des precisions
            if (intentData && intentData.needs_clarification && intentData.clarification_questions && intentData.clarification_questions.length > 0) {
                console.log(' Intent unclear - asking follow-up questions');
                return this._handleClarification(intentData, userMessage);
            }

            //  GESTION DIRECTE: Messages non-financiers (expressions emotionnelles, emails, etc.)
            if (intentData && intentData.skip_financial_analysis) {
                console.log(' Non-financial message detected - generating conversational response');
                return this._handleConversationalMessage(intentData, userMessage, context);
            }

            // GESTION DIRECTE: Demande de watchlist/portfolio (reponse immediate sans outils)
            if (intentData && intentData.intent === 'portfolio') {
                console.log(' Portfolio/Watchlist request detected - responding directly');
                return this._handlePortfolioRequest(userMessage, context);
            }

            // Enrichir le contexte avec les donnees d'intention
            if (intentData) {
                context.intent_data = intentData;
                context.extracted_tickers = intentData.tickers || [];
                context.suggested_tools = intentData.suggested_tools || [];
            }

            // 1. Planification avec scoring (enrichi par l'intent)
            let selectedTools = await this._plan_with_scoring(userMessage, context);
            console.log(' Selected tools:', selectedTools.map(t => t.id));

            // 
            // BRIEFINGS: FORCER L'UTILISATION DES OUTILS DE DONNEES REELLES
            // Fix: Emma inventait des donnees car aucun outil n'etait appele
            // 
            if (context.output_mode === 'briefing' && context.tickers && context.tickers.length > 0) {
                console.log(' BRIEFING MODE: Forcing market data tools for tickers:', context.tickers);

                // Outils essentiels pour un briefing avec vraies donnees
                const essentialBriefingTools = [
                    'fmp-quote',           // Prix en temps reel
                    'fmp-fundamentals',    // Donnees fondamentales
                    'fmp-key-metrics',     // Metriques cles
                    'finnhub-news'         // News recentes
                ];

                // Ajouter les outils manquants
                const toolIds = selectedTools.map(t => t.id);
                const missingTools = essentialBriefingTools
                    .filter(toolId => !toolIds.includes(toolId))
                    .map(toolId => this.toolsConfig.tools.find(t => t.id === toolId && t.enabled))
                    .filter(tool => tool !== undefined);

                if (missingTools.length > 0) {
                    console.log(' Adding missing essential tools:', missingTools.map(t => t.id));
                    selectedTools = [...missingTools, ...selectedTools];
                }
            }

            // 2. Execution des outils
            const toolResults = await this._execute_all(selectedTools, userMessage, context);
            console.log(' Tool execution completed');

            // 3. Generation de la reponse finale
            const responseData = await this._generate_response(userMessage, toolResults, context, intentData);
            console.log(' Final response generated');

            // Extraire reponse, validation et modele si objet retourne
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

            // 4. Mise a jour de l'historique
            this._updateConversationHistory(userMessage, finalResponse, toolResults);

            // Note: Statistiques sauvegardees automatiquement en temps reel dans Supabase via _updateToolStats

            // Identifier les outils qui ont echoue ou retourne des donnees non fiables
            const failedToolsData = toolResults
                .filter(r => !r.success || !r.is_reliable)
                .map(r => ({
                    id: r.tool_id,
                    error: r.error || 'Donnees non fiables'
                }));

            const failedTools = failedToolsData.map(t => t.id);

            // Mapping des IDs techniques vers des noms lisibles
            const nameMapping = {
                'fmp-quote': 'Prix actions (FMP)',
                'polygon-stock-price': 'Prix actions (Polygon)',
                'fmp-fundamentals': 'Donnees fondamentales (FMP)',
                'fmp-ratios': 'Ratios financiers (FMP)',
                'fmp-key-metrics': 'Metriques cles (FMP)',
                'fmp-ratings': 'Ratings entreprises (FMP)',
                'fmp-ticker-news': 'Actualites ticker (FMP)',
                'finnhub-news': 'Actualites (Finnhub)',
                'twelve-data-technical': 'Indicateurs techniques',
                'alpha-vantage-ratios': 'Ratios financiers (Alpha Vantage)',
                'yahoo-finance': 'Yahoo Finance',
                'supabase-watchlist': 'Watchlist',
                'team-tickers': 'Tickers equipe',
                'economic-calendar': 'Calendrier economique (FMP)',
                'earnings-calendar': 'Calendrier resultats (FMP)',
                'analyst-recommendations': 'Recommandations analystes (FMP)',
                'calculator': 'Calculatrice financiere'
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
                model: modelUsed || 'unknown',
                model_reason: modelReason || 'Unknown reason'
            };

        } catch (error) {
            console.error(' Emma Agent Error:', error);
            return {
                success: false,
                error: error.message,
                response: "Desole, j'ai rencontre une erreur technique. Veuillez reessayer.",
                is_reliable: false
            };
        }
    }

    /**
     * COGNITIVE SCAFFOLDING LAYER
     * Analyse d'intention HYBRIDE (local + LLM) pour optimiser performances et couts
     */
    async _analyzeIntent(userMessage, context) {
        try {
            console.log(' Starting HYBRID intent analysis...');

            // Utiliser le HybridIntentAnalyzer
            const intentData = await this.intentAnalyzer.analyze(userMessage, context);

            console.log(' Intent analyzed:', intentData);
            console.log(` Method: ${intentData.analysis_method}, Time: ${intentData.execution_time_ms}ms`);

            return intentData;

        } catch (error) {
            console.error(' Intent analysis failed:', error.message);
            // Retombe gracieusement sur le scoring par mots-cles
            return null;
        }
    }


    /**
     * Gere les clarifications quand l'intention est ambigue
     */
    _handleClarification(intentData, userMessage) {
        console.log(' Clarification needed, returning questions');

        let clarificationResponse = `Pour vous fournir une reponse precise, j'ai besoin de quelques precisions :\n\n`;

        // Ajouter les questions de clarification
        intentData.clarification_questions.forEach((question, index) => {
            clarificationResponse += `${index + 1}. ${question}\n`;
        });

        // Ajouter des exemples si disponibles
        if (intentData.user_intent_summary) {
            clarificationResponse += `\n **Contexte detecte:** ${intentData.user_intent_summary}\n`;
        }

        // Suggestions basees sur l'intent detecte
        if (intentData.intent === 'stock_analysis' && !intentData.tickers.length) {
            clarificationResponse += `\n**Exemples:**\n`;
            clarificationResponse += `- "Analyse technique de AAPL"\n`;
            clarificationResponse += `- "Fondamentaux de Tesla"\n`;
            clarificationResponse += `- "Actualites Microsoft"\n`;
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
        console.log(' Handling portfolio/watchlist request directly');

        const userWatchlist = context.user_watchlist || [];
        const teamTickers = context.team_tickers || [];
        const userName = context.user_name || 'Utilisateur';

        let response = ` **Emma a acces a MILLIERS de tickers mondiaux !**\n`;
        response += `NYSE - NASDAQ - TSX - LSE - Euronext - etc.\n\n`;

        response += ` **VOS LISTES FAVORITES (raccourcis)**\n\n`;

        // LISTE 1: Watchlist personnelle
        response += `**1 Votre Watchlist**\n`;
        if (userWatchlist.length > 0) {
            response += `${userWatchlist.join(', ')}\n\n`;
        } else {
            response += `Vide - Ajoutez vos favoris\n\n`;
        }

        // LISTE 2: Team tickers
        response += `**2 Tickers Equipe**\n`;
        if (teamTickers.length > 0) {
            response += `${teamTickers.join(', ')}\n\n`;
        } else {
            response += `Aucun ticker d'equipe\n\n`;
        }

        response += `---\n\n`;
        response += ` **Demandez N'IMPORTE QUEL ticker !**\n\n`;
        response += `Exemples:\n`;
        response += `- "Tesla analyse" (TSLA)\n`;
        response += `- "Accenture actualites" (ACN)\n`;
        response += `- "Nestle Europe" (NSRGY)\n`;
        response += `- "Air Canada" (AC.TO)\n`;
        response += `- "Performance watchlist"\n`;
        response += `- "Secteur bancaire canadien"\n`;

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
     * Repond de maniere naturelle aux expressions emotionnelles, emails, etc.
     */
    _handleConversationalMessage(intentData, userMessage, context) {
        console.log(' Handling conversational message:', intentData.intent);

        const userName = context.user_name || 'Utilisateur';
        const messageLower = userMessage.toLowerCase().trim();
        let response = '';

        //  FIX: Uniquement pour expressions purement conversationnelles (sans questions reelles)
        // Les questions generales reelles sont gerees par _shouldUsePerplexityOnly() + Perplexity

        // 1. EXPRESSIONS EMOTIONNELLES COURTES (sans question)
        if (intentData.intent === 'general_conversation' && intentData.response_type === 'conversational') {
            // Reponses appropriees selon l'expression - SANS forcer contexte financier
            if (['wow', 'super', 'incroyable', 'genial', 'genial', 'fantastique', 'excellent', 'parfait', 'cool', 'nice', 'great', 'awesome', 'amazing', 'bravo'].some(expr => messageLower.includes(expr))) {
                response = `Merci !  Je suis contente que ca te plaise !\n\nComment puis-je t'aider aujourd'hui ?`;
            } else if (['merci', 'thanks', 'thank you'].some(expr => messageLower.includes(expr))) {
                response = `De rien ${userName} ! \n\nN'hesite pas si tu as d'autres questions. Je suis la pour t'aider !`;
            } else if (['ok', 'okay', 'd\'accord', 'daccord', 'parfait', 'bien', 'bon'].some(expr => messageLower.includes(expr))) {
                response = `Parfait ! \n\nQue veux-tu faire maintenant ?`;
            } else if (['oui', 'yes', 'si'].some(expr => messageLower === expr)) {
                response = `Super ! \n\nSur quoi veux-tu que je t'aide ?`;
            } else if (['non', 'no'].some(expr => messageLower === expr)) {
                response = `D'accord, pas de probleme ! \n\nSi tu changes d'avis, je suis la pour t'aider.`;
            } else {
                // Reponse generique pour autres expressions conversationnelles
                response = `Merci pour ton message ! \n\nJe suis Emma, ton assistante IA. Je peux t'aider avec des questions financieres, generales, et bien plus !\n\nComment puis-je t'aider aujourd'hui ?`;
            }
        }

        // 2. EMAILS FOURNIS
        else if (intentData.intent === 'information_provided' && intentData.information_type === 'email') {
            response = `Merci ${userName} ! \n\nJ'ai bien note ton email : ${userMessage}\n\nComment puis-je t'aider aujourd'hui ?`;
        }

        // 3. FALLBACK: Reponse conversationnelle generique (sans forcer finance)
        else {
            response = `Merci pour ton message ! \n\nJe suis Emma, ton assistante IA. Je peux t'aider avec des questions financieres, generales, et bien plus !\n\nQue veux-tu savoir ?`;
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
     * SMART ROUTER - Selectionne le meilleur modele selon le type de requete
     *
     * Strategie optimisee cout/performance:
     * - Perplexity (80%): Donnees factuelles avec sources (stock prices, news, fundamentals)
     * - Gemini (15%): Questions conceptuelles/educatives (gratuit)
     * - Claude (5%): Redaction premium (briefings, lettres clients)
     */
    async _selectModel(intentData, outputMode, toolsData, userMessage = '') {
        console.log(' SmartRouter: Selecting optimal model...');

        // Fetch models from registry
        const allModels = await getAllModels();
        const perplexityModels = allModels.filter(m => m.provider === 'perplexity' && m.enabled !== false);
        const geminiModels = allModels.filter(m => m.provider === 'google' && m.enabled !== false);
        
        // Helper to get best model (first available or dummy)
        const getModel = (list, fallbackId) => list.length > 0 ? list[0] : { model_id: fallbackId, max_tokens: 4000 };

        const perplexityConfig = getModel(perplexityModels, 'sonar-reasoning');
        const geminiConfig = getModel(geminiModels, 'gemini-2.0-flash-exp');

        // BRIEFING MODE: Perplexity Sonar pour donnees en temps reel
        if (outputMode === 'briefing') {
            console.log(' Briefing detected -> Using PERPLEXITY SONAR (real-time data + sources)');
            return {
                model: 'perplexity',
                modelConfig: perplexityConfig,
                reason: 'Briefing requires real-time market data with sources',
                recency: 'day' // Donnees les plus recentes pour briefings financiers
            };
        }

        // TICKER_NOTE MODE: Perplexity pour notes professionnelles avec sources
        if (outputMode === 'ticker_note') {
            console.log(' Ticker note detected -> Using PERPLEXITY (professional note with sources)');
            return {
                model: 'perplexity',
                modelConfig: perplexityConfig,
                reason: 'Professional ticker note requires real-time data and sources',
                recency: 'day' // Donnees les plus recentes pour notes professionnelles
            };
        }

        // DATA MODE: Perplexity pour extraire donnees structurees
        if (outputMode === 'data') {
            console.log(' Data extraction -> Using PERPLEXITY (structured data)');
            return {
                model: 'perplexity',
                modelConfig: perplexityConfig,
                reason: 'Data extraction requires factual accuracy',
                recency: intentData?.recency_filter || 'month'
            };
        }

        // CHAT MODE: Router intelligemment selon l'intention
        const intent = intentData?.intent || 'unknown';
        const hasTickers = intentData?.tickers && intentData.tickers.length > 0;
        const hasToolData = toolsData && toolsData.length > 0;

        // PERPLEXITY: Requetes factuelles avec sources (RIGUEUR MAXIMALE)
        const factualIntents = [
            'stock_price',
            'fundamentals',
            'news',
            'comprehensive_analysis',
            'comparative_analysis',
            'earnings',
            'market_overview',
            'recommendation',
            // Nouveaux intents financiers avances
            'economic_analysis',
            'political_analysis',
            'investment_strategy',
            'risk_volatility',
            'sector_industry',
            'valuation',
            'technical_analysis' // Toujours factuel avec donnees
        ];

        if (factualIntents.includes(intent) || hasTickers || hasToolData) {
            console.log(` Factual query (${intent}) -> Using PERPLEXITY (with sources)`);

            //  DETECTION PRIORITAIRE: Si l'utilisateur demande des donnees "aujourd'hui", "fin de journee", "apres cloture"
            const userMessageLower = (userMessage || '').toLowerCase();
            const todayKeywords = ['aujourd\'hui', 'aujourd hui', 'today', 'fin de journee', 'fin de journee', 'apres cloture', 'apres cloture', 'after close', 'end of day', 'apres la cloture', 'apres la cloture'];
            const isTodayRequest = todayKeywords.some(keyword => userMessageLower.includes(keyword));

            // Pour earnings, si demande "aujourd'hui", forcer recency: 'hour' (donnees les plus recentes)
            let recencyValue = intentData?.recency_filter;
            if (intent === 'earnings' && isTodayRequest) {
                recencyValue = 'hour'; // Donnees de la derniere heure (apres cloture)
                console.log(` Earnings + "aujourd'hui" detecte -> Forcing recency: hour (donnees apres cloture)`);
            } else if (isTodayRequest) {
                recencyValue = 'day'; // Donnees du jour
                console.log(` "Aujourd'hui" detecte -> Forcing recency: day`);
            } else if (!recencyValue || recencyValue === 'none') {
                // Par defaut pour earnings, utiliser 'day' pour donnees recentes
                recencyValue = (intent === 'earnings') ? 'day' : 'day';
            }

            const validRecency = (recencyValue && recencyValue !== 'none') ? recencyValue : 'day';
            return {
                model: 'perplexity',
                modelConfig: perplexityConfig,
                reason: `Factual data required for ${intent}${isTodayRequest ? ' (today requested)' : ''}`,
                recency: validRecency
            };
        }

        // GEMINI: Questions conceptuelles/educatives (gratuit)
        const conceptualIntents = [
            'portfolio',
            'technical_analysis' // Si pas de ticker specifique = explication theorique
        ];

        if (conceptualIntents.includes(intent) && !hasTickers) {
            console.log(` Conceptual query (${intent}) -> Using GEMINI (free, educational)`);
            return {
                model: 'gemini',
                modelConfig: geminiConfig,
                reason: `Educational/conceptual question about ${intent}`,
                recency: null // Pas de recency pour conceptuel
            };
        }

        // DEFAULT: Perplexity pour securite
        console.log(' Default fallback -> Using PERPLEXITY');
        return {
            model: 'perplexity',
            modelConfig: perplexityConfig,
            reason: 'Default fallback for reliability',
            recency: 'month'
        };
    }

    /**
     * Detecte si Perplexity seul est suffisant pour repondre
     *  CRITIQUE: Determine quand utiliser Perplexity vs APIs complementaires
     * 
     * Perplexity est suffisant pour:
     * - Questions generales/conceptuelles (fonds, economie, explications)
     * - Analyses qualitatives (comparaisons, strategies)
     * - Actualites/resumes (Perplexity a acces a sources recentes)
     * - Questions macro-economiques
     * 
     * APIs sont necessaires pour:
     * - Prix en temps reel precis (exact, pas approximatif)
     * - Ratios financiers exacts (P/E, ROE, etc. - donnees structurees)
     * - Donnees fondamentales precises (revenus, benefices, etc.)
     * - Indicateurs techniques (RSI, MACD - calculs precis)
     * - Calendriers (earnings, economic - donnees structurees)
     * - Watchlist/portfolio (donnees utilisateur)
     */
    _shouldUsePerplexityOnly(userMessage, context, intentData) {
        const message = userMessage.toLowerCase();
        const intent = intentData?.intent || context.intent_data?.intent || 'unknown';
        const extractedTickers = context.extracted_tickers || context.tickers || [];

        //  SKIP OUTILS pour greetings et questions simples
        const noToolsIntents = ['greeting', 'help', 'capabilities', 'general_conversation'];
        if (noToolsIntents.includes(intent)) {
            return { usePerplexityOnly: true, reason: `Intent "${intent}" ne necessite pas de donnees` };
        }

        //  DEFINIR TOUS LES KEYWORDS EN PREMIER (FIX: Ordre d'evaluation)
        //  PERPLEXITY SEUL: Questions sur fonds/ETF/portefeuille
        const fundKeywords = [
            'fonds', 'fond', 'mutual fund', 'fonds mutuels', 'fonds d\'investissement',
            'quartile', 'quartiles', 'rendement', 'rendements', 'performance des fonds',
            'categorie de fonds', 'categorie de fonds', 'fonds equilibres', 'fonds equilibres',
            'etf', 'etfs', 'fonds indiciels', 'fonds actifs', 'fonds passifs',
            'fonds canadiens', 'fonds americains', 'fonds internationaux', 'fonds europeens',
            'fonds obligataires', 'fonds actions', 'fonds diversifies', 'fonds sectoriels',
            'fonds de croissance', 'fonds de valeur', 'fonds de dividendes', 'fonds de revenu',
            'fonds indexes', 'fonds indiciels', 'fonds a capital garanti', 'fonds alternatifs',
            'fonds de couverture', 'hedge fund', 'fonds de private equity', 'fonds immobiliers',
            'reit', 'reits', 'fiducie de placement', 'fiducie immobiliere',
            'frais de gestion', 'frais de fonds', 'mer', 'ter', 'expense ratio',
            'rating morningstar', 'etoiles morningstar', 'star rating', 'quartile morningstar'
        ];
        if (fundKeywords.some(kw => message.includes(kw)) && extractedTickers.length === 0) {
            return { usePerplexityOnly: true, reason: 'Question sur fonds - Perplexity a acces aux donnees Morningstar/Fundata' };
        }

        //  PERPLEXITY SEUL: Questions macro-economiques generales
        const macroKeywords = [
            'inflation', 'taux directeur', 'fed', 'banque centrale', 'pib', 'gdp',
            'chomage', 'chomage', 'emploi', 'recession', 'recession', 'croissance economique',
            'politique monetaire', 'monetaire', 'taux d\'interet', 'interet', 'taux',
            'courbe des taux', 'yield curve', 'spread', 'obligations', 'treasury',
            'banque du canada', 'boc', 'ecb', 'banque centrale europeenne', 'boj', 'banque du japon',
            'politique budgetaire', 'fiscal', 'deficit', 'deficit', 'dette publique', 'dette souveraine',
            'indicateurs economiques', 'indicateur macro', 'indicateurs macroeconomiques',
            'consommation', 'production industrielle', 'pmi', 'ism', 'indice manufacturier',
            'commerce exterieur', 'balance commerciale', 'exportations', 'importations',
            'devise', 'devises', 'taux de change', 'forex', 'fx', 'parite', 'cours des devises',
            'marche obligataire', 'marche obligataire', 'bonds', 'obligations d\'etat',
            'taux reel', 'taux nominal', 'prime de risque', 'risk premium', 'spread de credit'
        ];
        if (macroKeywords.some(kw => message.includes(kw)) && extractedTickers.length === 0) {
            // Exception: Si demande specifique de courbe des taux -> API necessaire
            if (message.includes('courbe des taux') || message.includes('yield curve') || message.includes('treasury')) {
                return { usePerplexityOnly: false, reason: 'Courbe des taux necessite donnees structurees precises' };
            }
            return { usePerplexityOnly: true, reason: 'Question macro-economique - Perplexity a acces aux donnees recentes' };
        }

        //  PERPLEXITY SEUL: Questions sur strategies d'investissement
        const strategyKeywords = [
            'strategie', 'strategie', 'strategie d\'investissement', 'strategie d\'investissement',
            'allocation d\'actifs', 'asset allocation', 'diversification', 'reequilibrage', 'reequilibrage',
            'value investing', 'growth investing', 'dividend investing', 'momentum investing',
            'contrarian', 'contrarian investing', 'dollar cost averaging', 'dca',
            'lump sum', 'investissement regulier', 'investissement systematique',
            'buy and hold', 'trading actif', 'day trading', 'swing trading', 'position trading',
            'hedging', 'couverture', 'protection de portefeuille', 'risk management',
            'gestion des risques', 'stop loss', 'take profit', 'position sizing',
            'pyramiding', 'averaging down', 'averaging up', 'scaling in', 'scaling out',
            'sector rotation', 'rotation sectorielle', 'style rotation', 'rotation de style',
            'market timing', 'timing de marche', 'tactical allocation', 'allocation tactique'
        ];
        if (strategyKeywords.some(kw => message.includes(kw)) && extractedTickers.length === 0) {
            return { usePerplexityOnly: true, reason: 'Question sur strategie - Perplexity peut expliquer les concepts' };
        }

        //  PERPLEXITY SEUL: Questions sur secteurs/industries
        const sectorKeywords = [
            'secteur', 'industrie', 'secteurs performants', 'secteurs en hausse', 'secteurs en baisse',
            'secteur technologique', 'secteur techno', 'tech sector', 'secteur financier',
            'secteur sante', 'healthcare sector', 'secteur energetique', 'energy sector',
            'secteur consommation', 'consumer sector', 'secteur industriel', 'industrial sector',
            'secteur materiaux', 'materials sector', 'secteur immobilier', 'real estate sector',
            'secteur utilities', 'secteur services publics', 'secteur telecom', 'telecom sector',
            'secteur defensif', 'defensive sector', 'secteur cyclique', 'cyclical sector',
            'analyse sectorielle', 'sector analysis', 'performance sectorielle', 'sector performance',
            'rotation sectorielle', 'sector rotation', 'poids sectoriel', 'sector weight'
        ];
        if (sectorKeywords.some(kw => message.includes(kw)) && extractedTickers.length === 0) {
            return { usePerplexityOnly: true, reason: 'Question sur secteurs - Perplexity a acces aux analyses sectorielles' };
        }

        //  PERPLEXITY SEUL: Questions sur crypto/blockchain
        const cryptoKeywords = [
            'crypto', 'cryptomonnaie', 'cryptomonnaies', 'bitcoin', 'btc', 'ethereum', 'eth',
            'blockchain', 'defi', 'nft', 'altcoin', 'altcoins', 'stablecoin', 'stablecoins',
            'mining', 'minage', 'staking', 'yield farming', 'liquidity pool', 'pool de liquidite',
            'exchange', 'bourse crypto', 'wallet', 'portefeuille crypto', 'cold storage',
            'halving', 'fork', 'hard fork', 'soft fork', 'consensus', 'proof of stake', 'pos',
            'proof of work', 'pow', 'gas fee', 'frais de transaction', 'transaction fee'
        ];
        if (cryptoKeywords.some(kw => message.includes(kw)) && extractedTickers.length === 0) {
            return { usePerplexityOnly: true, reason: 'Question sur crypto - Perplexity a acces aux donnees crypto recentes' };
        }

        //  PERPLEXITY SEUL: Questions sur commodities/matieres premieres
        const commodityKeywords = [
            'commodities', 'commodity', 'matieres premieres', 'matiere premiere',
            'or', 'argent', 'petrole', 'petrole', 'oil', 'gaz naturel', 'natural gas',
            'ble', 'mais', 'soja', 'cafe', 'cacao', 'sucre', 'cotton', 'coton',
            'cuivre', 'nickel', 'zinc', 'aluminium', 'fer', 'acier', 'steel',
            'prix des matieres premieres', 'commodity prices', 'futures', 'contrats a terme',
            'contango', 'backwardation', 'spread de commodities', 'commodity spread',
            'crude oil', 'wti', 'brent', 'gold', 'silver', 'platinum', 'palladium',
            'wheat', 'corn', 'soybean', 'coffee', 'cocoa', 'sugar', 'cotton',
            'copper', 'nickel', 'zinc', 'aluminum', 'iron ore', 'steel',
            'commodity index', 'indice matieres premieres', 'gci', 'goldman sachs commodity index'
        ];
        if (commodityKeywords.some(kw => message.includes(kw)) && extractedTickers.length === 0) {
            return { usePerplexityOnly: true, reason: 'Question sur commodities - Perplexity a acces aux donnees de marche' };
        }

        //  PERPLEXITY SEUL: Questions sur Forex/Devises
        const forexKeywords = [
            'forex', 'fx', 'devise', 'devises', 'taux de change', 'exchange rate',
            'currency', 'currencies', 'parite', 'cours des devises', 'currency pair',
            'usd', 'eur', 'gbp', 'jpy', 'cad', 'chf', 'aud', 'nzd', 'cny',
            'dollar', 'euro', 'livre', 'yen', 'franc suisse', 'dollar australien',
            'dollar canadien', 'yuan', 'renminbi', 'currency market', 'marche des changes',
            'carry trade', 'currency hedging', 'couverture de change', 'currency risk',
            'currency exposure', 'exposition aux devises', 'fx risk', 'risque de change',
            'currency correlation', 'correlation devises', 'currency volatility', 'volatilite devises'
        ];
        if (forexKeywords.some(kw => message.includes(kw)) && extractedTickers.length === 0) {
            return { usePerplexityOnly: true, reason: 'Question sur forex - Perplexity a acces aux donnees de change' };
        }

        //  PERPLEXITY SEUL: Questions sur Obligations/Bonds detaillees
        const bondKeywords = [
            'obligations', 'bonds', 'obligation', 'bond', 'corporate bonds', 'obligations corporatives',
            'government bonds', 'obligations d\'etat', 'treasury bonds', 'obligations du tresor',
            'municipal bonds', 'obligations municipales', 'high yield', 'junk bonds',
            'investment grade', 'obligations investment grade', 'credit rating', 'notation credit',
            'yield', 'rendement obligataire', 'coupon', 'coupon rate', 'taux de coupon',
            'duration', 'duree', 'convexity', 'convexite', 'spread', 'credit spread',
            'yield to maturity', 'ytm', 'rendement a l\'echeance', 'yield curve', 'courbe des taux',
            'bond ladder', 'echelle d\'obligations', 'bond portfolio', 'portefeuille obligataire',
            'fixed income', 'revenu fixe', 'fixed income securities', 'titres a revenu fixe',
            'bond market', 'marche obligataire', 'bond index', 'indice obligataire',
            'sovereign bonds', 'obligations souveraines', 'emerging market bonds', 'obligations marches emergents'
        ];
        if (bondKeywords.some(kw => message.includes(kw)) && extractedTickers.length === 0) {
            // Exception: Si demande specifique de courbe des taux -> API necessaire
            if (message.includes('courbe des taux') || message.includes('yield curve') || message.includes('treasury rates')) {
                return { usePerplexityOnly: false, reason: 'Courbe des taux necessite donnees structurees precises' };
            }
            return { usePerplexityOnly: true, reason: 'Question sur obligations - Perplexity a acces aux donnees obligataires' };
        }

        //  PERPLEXITY SEUL: Questions sur Immobilier/Real Estate
        const realEstateKeywords = [
            'immobilier', 'real estate', 'reit', 'reits', 'fiducie immobiliere',
            'fiducie de placement', 'real estate investment trust',
            'propriete', 'propriete', 'property', 'commercial real estate', 'immobilier commercial',
            'residential real estate', 'immobilier residentiel', 'real estate market', 'marche immobilier',
            'cap rate', 'taux de capitalisation', 'cap rate', 'noi', 'net operating income',
            'revenu net d\'exploitation', 'real estate valuation', 'valorisation immobiliere',
            'real estate cycle', 'cycle immobilier', 'property management', 'gestion immobiliere',
            'real estate investment', 'investissement immobilier', 'real estate portfolio',
            'portefeuille immobilier', 'real estate trends', 'tendances immobilieres'
        ];
        if (realEstateKeywords.some(kw => message.includes(kw)) && extractedTickers.length === 0) {
            return { usePerplexityOnly: true, reason: 'Question sur immobilier - Perplexity a acces aux donnees immobilieres' };
        }

        //  PERPLEXITY SEUL: Questions sur Private Equity/Venture Capital
        const privateEquityKeywords = [
            'private equity', 'capital-investissement', 'capital investissement',
            'venture capital', 'vc', 'capital de risque', 'startup', 'startups',
            'unicorn', 'licorne', 'series a', 'series b', 'series c', 'funding round',
            'tour de table', 'levee de fonds', 'fundraising', 'valuation startup',
            'valorisation startup', 'exit', 'sortie', 'ipo', 'acquisition',
            'private equity fund', 'fonds de private equity', 'pe fund',
            'venture capital fund', 'fonds de capital de risque', 'vc fund',
            'lbo', 'leveraged buyout', 'rachat par effet de levier', 'mbo', 'management buyout'
        ];
        if (privateEquityKeywords.some(kw => message.includes(kw)) && extractedTickers.length === 0) {
            return { usePerplexityOnly: true, reason: 'Question sur private equity - Perplexity a acces aux donnees PE/VC' };
        }

        //  PERPLEXITY SEUL: Questions sur Warrants/Convertibles
        const warrantKeywords = [
            'warrant', 'warrants', 'certificat', 'certificats', 'warrant d\'achat',
            'warrant de vente', 'call warrant', 'put warrant', 'warrant call',
            'warrant put', 'warrant price', 'prix warrant', 'warrant premium',
            'prime warrant', 'warrant leverage', 'effet de levier warrant',
            'convertible', 'convertibles', 'convertible bond', 'obligation convertible',
            'convertible preferred', 'actions privilegiees convertibles',
            'conversion ratio', 'ratio de conversion', 'conversion price', 'prix de conversion',
            'conversion premium', 'prime de conversion', 'forced conversion', 'conversion forcee'
        ];
        if (warrantKeywords.some(kw => message.includes(kw)) && extractedTickers.length === 0) {
            return { usePerplexityOnly: true, reason: 'Question sur warrants/convertibles - Perplexity peut expliquer les concepts' };
        }

        //  PERPLEXITY SEUL: Questions sur Calculs/Simulations
        const calculationKeywords = [
            'calculer', 'calcul', 'simulation', 'simuler', 'scenario', 'scenario',
            'projection', 'prevision', 'prevision', 'forecast', 'estimation',
            'dcf', 'discounted cash flow', 'actualisation des flux', 'valeur actuelle nete',
            'van', 'npv', 'net present value', 'irr', 'taux de rendement interne',
            'taux de rendement', 'payback period', 'periode de recuperation',
            'wacc', 'cout moyen pondere du capital', 'weighted average cost of capital',
            'terminal value', 'valeur terminale', 'perpetuity', 'perpetuite',
            'sensitivity analysis', 'analyse de sensibilite', 'scenario analysis',
            'analyse de scenarios', 'monte carlo', 'monte carlo simulation',
            'backtesting', 'backtest', 'test historique', 'simulation historique',
            'stress test', 'test de resistance', 'stress testing'
        ];
        if (calculationKeywords.some(kw => message.includes(kw)) && extractedTickers.length === 0) {
            return { usePerplexityOnly: true, reason: 'Question sur calculs/simulations - Perplexity peut expliquer les methodologies' };
        }

        //  PERPLEXITY SEUL: Questions sur Reglementation/Compliance
        const regulatoryKeywords = [
            'reglementation', 'regulation', 'compliance', 'conformite', 'regulateur',
            'regulateur', 'sec', 'securities and exchange commission', 'amf',
            'autorite des marches financiers', 'cvmf', 'cvm', 'osfi', 'cdic',
            'fdic', 'federal deposit insurance', 'assurance depots',
            'reglementation financiere', 'financial regulation', 'regles boursieres',
            'stock exchange rules', 'regles de bourse', 'market regulation',
            'regulation des marches', 'insider trading', 'delit d\'initie',
            'market manipulation', 'manipulation de marche', 'disclosure', 'divulgation',
            'financial reporting', 'rapports financiers', 'gaap', 'ifrs',
            'normes comptables', 'accounting standards', 'audit', 'verification',
            'kpi', 'key performance indicators', 'indicateurs de performance cles'
        ];
        if (regulatoryKeywords.some(kw => message.includes(kw)) && extractedTickers.length === 0) {
            return { usePerplexityOnly: true, reason: 'Question reglementaire - Perplexity a acces aux regles et regulations' };
        }

        //  PERPLEXITY SEUL: Questions sur ESG/Durabilite
        const esgKeywords = [
            'esg', 'environmental social governance', 'environnemental social gouvernance',
            'durabilite', 'durabilite', 'sustainability', 'responsabilite sociale',
            'responsabilite sociale', 'corporate social responsibility', 'csr',
            'rse', 'responsabilite sociale d\'entreprise', 'carbon footprint',
            'empreinte carbone', 'green bonds', 'obligations vertes', 'sustainable investing',
            'investissement durable', 'impact investing', 'investissement a impact',
            'climate risk', 'risque climatique', 'transition energetique', 'energy transition',
            'renewable energy', 'energie renouvelable', 'clean energy', 'energie propre',
            'esg rating', 'notation esg', 'esg score', 'score esg', 'esg factors',
            'facteurs esg', 'esg integration', 'integration esg', 'esg disclosure',
            'divulgation esg', 'climate change', 'changement climatique', 'net zero',
            'carboneutralite', 'carbon neutral', 'paris agreement', 'accord de paris'
        ];
        if (esgKeywords.some(kw => message.includes(kw)) && extractedTickers.length === 0) {
            return { usePerplexityOnly: true, reason: 'Question ESG - Perplexity a acces aux donnees ESG recentes' };
        }

        //  PERPLEXITY SEUL: Questions sur Arbitrage/Pairs Trading
        const arbitrageKeywords = [
            'arbitrage', 'arbitrage opportunity', 'opportunite d\'arbitrage',
            'pairs trading', 'trading de paires', 'statistical arbitrage', 'arbitrage statistique',
            'market neutral', 'neutre marche', 'long short', 'long/short',
            'hedge fund strategy', 'strategie hedge fund', 'relative value',
            'valeur relative', 'spread trading', 'trading de spread', 'convergence',
            'divergence', 'mean reversion', 'retour a la moyenne', 'momentum',
            'momentum trading', 'contrarian strategy', 'strategie contrarian',
            'quantitative strategy', 'strategie quantitative', 'quant trading',
            'algorithmic trading', 'trading algorithmique', 'high frequency trading', 'hft'
        ];
        if (arbitrageKeywords.some(kw => message.includes(kw)) && extractedTickers.length === 0) {
            return { usePerplexityOnly: true, reason: 'Question sur arbitrage - Perplexity peut expliquer les strategies' };
        }

        //  PERPLEXITY SEUL: Questions sur Methodologies d'Analyse
        const methodologyKeywords = [
            'methodologie', 'methodologie', 'methodology', 'approche', 'approach',
            'dcf', 'discounted cash flow', 'actualisation des flux de tresorerie',
            'multiples', 'valuation multiples', 'multiples de valorisation',
            'comparable companies', 'entreprises comparables', 'comps', 'peer group',
            'groupe de pairs', 'precedent transactions', 'transactions precedentes',
            'sum of parts', 'somme des parties', 'sotp', 'sum of the parts',
            'lbo model', 'modele lbo', 'acquisition model', 'modele d\'acquisition',
            'three statement model', 'modele trois etats financiers', 'integrated model',
            'modele integre', 'financial modeling', 'modelisation financiere',
            'pro forma', 'proforma', 'pro forma analysis', 'analyse pro forma',
            'sensitivity table', 'tableau de sensibilite', 'data table', 'table de donnees',
            'valuation methodology', 'methodologie de valorisation', 'valuation approach',
            'approche de valorisation', 'asset based valuation', 'valorisation basee actifs',
            'income approach', 'approche revenus', 'market approach', 'approche marche'
        ];
        if (methodologyKeywords.some(kw => message.includes(kw)) && extractedTickers.length === 0) {
            return { usePerplexityOnly: true, reason: 'Question methodologique - Perplexity peut expliquer les approches' };
        }

        //  PERPLEXITY SEUL: Questions sur Structured Products
        const structuredProductsKeywords = [
            'structured products', 'produits structures', 'structured note',
            'note structuree', 'principal protected', 'capital protege',
            'participation note', 'note de participation', 'reverse convertible',
            'obligation convertible inversee', 'autocallable', 'autocall',
            'barrier option', 'option barriere', 'knock in', 'knock out',
            'structured deposit', 'depot structure', 'market linked', 'lie au marche',
            'equity linked', 'lie aux actions', 'commodity linked', 'lie aux matieres premieres',
            'currency linked', 'lie aux devises', 'hybrid product', 'produit hybride'
        ];
        if (structuredProductsKeywords.some(kw => message.includes(kw)) && extractedTickers.length === 0) {
            return { usePerplexityOnly: true, reason: 'Question sur produits structures - Perplexity peut expliquer les concepts' };
        }

        //  PERPLEXITY SEUL: Questions sur Gestion de Risque Avancee
        const riskManagementKeywords = [
            'gestion de risque', 'risk management', 'gestion des risques',
            'var', 'value at risk', 'valeur a risque', 'cvar', 'conditional var',
            'var conditionnelle', 'stress testing', 'test de resistance',
            'scenario analysis', 'analyse de scenarios', 'sensitivity analysis',
            'analyse de sensibilite', 'monte carlo', 'simulation monte carlo',
            'risk metrics', 'metriques de risque', 'risk adjusted return',
            'rendement ajuste au risque', 'sharpe ratio', 'sortino ratio',
            'information ratio', 'calmar ratio', 'max drawdown', 'perte maximale',
            'downside deviation', 'deviation negative', 'upside capture',
            'capture haussiere', 'downside capture', 'capture baissiere',
            'tracking error', 'erreur de suivi', 'beta', 'alpha', 'correlation',
            'correlation', 'diversification', 'diversification ratio', 'ratio de diversification',
            'portfolio risk', 'risque portefeuille', 'systematic risk', 'risque systematique',
            'idiosyncratic risk', 'risque idiosyncratique', 'tail risk', 'risque de queue',
            'black swan', 'cygne noir', 'fat tail', 'queue epaisse'
        ];
        if (riskManagementKeywords.some(kw => message.includes(kw)) && extractedTickers.length === 0) {
            return { usePerplexityOnly: true, reason: 'Question sur gestion de risque - Perplexity peut expliquer les concepts' };
        }

        //  PERPLEXITY SEUL: Questions sur Behavioral Finance
        const behavioralKeywords = [
            'behavioral finance', 'finance comportementale', 'psychologie des marches',
            'market psychology', 'psychologie de marche', 'investor behavior',
            'comportement investisseur', 'cognitive bias', 'biais cognitif',
            'confirmation bias', 'biais de confirmation', 'anchoring', 'ancrage',
            'overconfidence', 'surappreciation', 'herd behavior', 'comportement gregaire',
            'fomo', 'fear of missing out', 'peur de rater', 'fear and greed index',
            'indice peur et cupidite', 'sentiment', 'sentiment de marche',
            'market sentiment', 'investor sentiment', 'sentiment investisseur',
            'contrarian investing', 'investissement contrarian', 'value investing',
            'investissement value', 'growth investing', 'investissement croissance',
            'momentum investing', 'investissement momentum', 'behavioral economics',
            'economie comportementale'
        ];
        if (behavioralKeywords.some(kw => message.includes(kw)) && extractedTickers.length === 0) {
            return { usePerplexityOnly: true, reason: 'Question sur finance comportementale - Perplexity peut expliquer les concepts' };
        }

        //  PERPLEXITY SEUL: Questions sur M&A/Fusions-Acquisitions
        const maKeywords = [
            'fusion', 'acquisition', 'm&a', 'merger', 'mergers and acquisitions',
            'fusions acquisitions', 'takeover', 'rachat', 'hostile takeover',
            'opa', 'offre publique d\'achat', 'ope', 'offre publique d\'echange',
            'tender offer', 'offre publique', 'merger arbitrage', 'arbitrage de fusion',
            'deal structure', 'structure transaction', 'synergy', 'synergie',
            'due diligence', 'diligence raisonnable', 'integration', 'integration',
            'post merger integration', 'integration post fusion', 'deal valuation',
            'valorisation transaction', 'acquisition premium', 'prime d\'acquisition',
            'deal multiples', 'multiples transaction', 'transaction multiples'
        ];
        if (maKeywords.some(kw => message.includes(kw)) && extractedTickers.length === 0) {
            return { usePerplexityOnly: true, reason: 'Question sur M&A - Perplexity a acces aux donnees de transactions' };
        }

        //  PERPLEXITY SEUL: Questions sur IPO/Introduction en Bourse
        const ipoKeywords = [
            'ipo', 'introduction en bourse', 'public offering', 'offre publique',
            'initial public offering', 'premiere introduction', 'going public',
            'entree en bourse', 'listing', 'cotation', 'debut trading',
            'premiere cotation', 'ipo pricing', 'prix ipo', 'ipo valuation',
            'valorisation ipo', 'underpricing', 'sous-evaluation', 'ipo performance',
            'performance ipo', 'aftermarket performance', 'performance apres introduction',
            'lock up period', 'periode de blocage', 'insider lockup', 'blocage inities',
            'ipo process', 'processus ipo', 'roadshow', 'roadshow ipo',
            'book building', 'construction du carnet', 'ipo allocation', 'allocation ipo'
        ];
        if (ipoKeywords.some(kw => message.includes(kw)) && extractedTickers.length === 0) {
            return { usePerplexityOnly: true, reason: 'Question sur IPO - Perplexity a acces aux donnees d\'introductions' };
        }

        //  PERPLEXITY SEUL: Questions geopolitiques/evenements
        const geopoliticalKeywords = [
            'geopolitique', 'geopolitique', 'geopolitique', 'guerre', 'conflit', 'sanctions',
            'elections', 'elections', 'politique', 'gouvernement', 'regulation', 'regulation',
            'trade war', 'guerre commerciale', 'tarifs', 'douanes', 'protectionnisme',
            'brexit', 'union europeenne', 'ue', 'eu', 'otan', 'nato',
            'relations internationales', 'tensions', 'diplomatie', 'alliances',
            'impact geopolitique', 'geopolitical impact', 'risque geopolitique', 'geopolitical risk'
        ];
        if (geopoliticalKeywords.some(kw => message.includes(kw)) && extractedTickers.length === 0) {
            return { usePerplexityOnly: true, reason: 'Question geopolitique - Perplexity a acces aux analyses recentes' };
        }

        //  PERPLEXITY SEUL: Questions sur options/derives
        const optionsKeywords = [
            'options', 'option', 'call', 'put', 'strike', 'prix d\'exercice',
            'prime', 'option premium', 'delta', 'gamma', 'theta', 'vega', 'greeks',
            'covered call', 'protective put', 'collar', 'strangle', 'straddle',
            'spread', 'bull spread', 'bear spread', 'butterfly', 'iron condor',
            'derives', 'derives', 'derivatives', 'warrants', 'certificats',
            'leverage', 'effet de levier', 'marge', 'margin', 'futures', 'contrats a terme'
        ];
        if (optionsKeywords.some(kw => message.includes(kw)) && extractedTickers.length === 0) {
            return { usePerplexityOnly: true, reason: 'Question sur options - Perplexity peut expliquer les concepts' };
        }

        //  PERPLEXITY SEUL: Questions sur taxes/fiscalite
        const taxKeywords = [
            'impot', 'impot', 'taxe', 'fiscalite', 'fiscalite', 'fiscal',
            'tfsa', 'celi', 'reer', 'rrsp', 'regime enregistre', 'regime enregistre',
            'gain en capital', 'capital gain', 'dividende', 'dividend', 'revenu d\'interet',
            'deduction', 'deduction', 'credit d\'impot', 'credit d\'impot', 'exemption',
            'planification fiscale', 'tax planning', 'optimisation fiscale', 'tax optimization',
            'retraite', 'retirement', 'epargne retraite', 'epargne retraite', 'pension'
        ];
        if (taxKeywords.some(kw => message.includes(kw)) && extractedTickers.length === 0) {
            return { usePerplexityOnly: true, reason: 'Question fiscale - Perplexity peut expliquer les regles' };
        }

        //  PERPLEXITY SEUL: Questions generales/non-financieres (DETECTION APRES TOUS LES KEYWORDS FINANCIERS)
        //  Permet a Emma de sortir du cadre strictement financier
        // FIX: Retirer keywords ambigus qui peuvent etre financiers (startup, marketing, management, news avec ticker)
        const generalNonFinancialKeywords = [
            // Questions generales de connaissance
            'qu\'est-ce que', 'quest-ce que', 'c\'est quoi', 'cest quoi', 'definition', 'definition',
            'explique', 'explique-moi', 'explique moi', 'comment fonctionne', 'comment ca marche',
            'pourquoi', 'comment', 'quand', 'ou', 'qui', 'quelle est la difference', 'difference entre',
            // Questions scientifiques/techniques
            'physique', 'chimie', 'biologie', 'mathematiques', 'math', 'science', 'sciences',
            'technologie', 'tech', 'informatique', 'programmation', 'code', 'coding',
            'histoire', 'geographie', 'culture', 'art', 'litterature', 'philosophie',
            // Questions pratiques/vie quotidienne
            'cuisine', 'recette', 'voyage', 'sante', 'sante', 'sport', 'fitness', 'medical', 'medical',
            'education', 'education', 'apprendre', 'formation', 'tutoriel', 'guide',
            'meteo', 'meteo', 'climat', 'environnement', 'ecologie', 'ecologie',
            // Questions personnelles/conversationnelles
            'bonjour', 'salut', 'hello', 'hi', 'comment vas-tu', 'ca va', 'cava',
            'merci', 'de rien', 'au revoir', 'bye', 'bonne journee', 'bonne soiree',
            'aide', 'help', 'peux-tu', 'peux tu', 'capable de', 'fonctionnalites',
            // Questions culturelles/divertissement (sans actualites financieres)
            'culture', 'societe', 'societe', 'politique generale', 'divertissement',
            'cinema', 'cinema', 'musique', 'livre', 'livres', 'film', 'films',
            // Questions educatives generales
            'apprendre', 'comprendre', 'expliquer', 'enseigner', 'cours', 'lecon', 'lecon',
            'tutoriel', 'guide', 'methode', 'methode', 'technique', 'astuce', 'conseil',
            // Questions de comparaison generale (sans contexte financier)
            'meilleur', 'meilleure', 'meilleurs', 'meilleures', 'best', 'top', 'comparer',
            'vs', 'versus', 'difference', 'difference', 'avantages', 'inconvenients', 'inconvenients',
            // Questions de recommandation generale
            'recommandation', 'recommandations', 'conseil', 'conseils', 'suggestion', 'suggestions',
            'avis', 'opinion', 'que penses-tu', 'penses-tu que', 'crois-tu que'
        ];

        // Detection: Si aucun ticker ET aucun mot financier specifique -> probablement question generale
        const hasFinancialKeyword = [
            fundKeywords, macroKeywords, strategyKeywords, sectorKeywords,
            cryptoKeywords, commodityKeywords, forexKeywords, bondKeywords,
            realEstateKeywords, privateEquityKeywords, warrantKeywords,
            calculationKeywords, regulatoryKeywords, esgKeywords, arbitrageKeywords,
            methodologyKeywords, structuredProductsKeywords, riskManagementKeywords,
            behavioralKeywords, maKeywords, ipoKeywords, geopoliticalKeywords, taxKeywords
        ].some(keywords => keywords.some(kw => message.includes(kw)));

        const hasGeneralKeyword = generalNonFinancialKeywords.some(kw => message.includes(kw));

        // Si question generale ET pas de mots financiers ET pas de tickers -> Perplexity seul
        // FIX: Verifier aussi si 'news'/'actualites' sans ticker (pour eviter conflit avec intent news)
        const isNewsGeneral = (message.includes('actualites') || message.includes('actualites') || message.includes('news') || message.includes('nouvelles')) && extractedTickers.length === 0;

        if (hasGeneralKeyword && !hasFinancialKeyword && extractedTickers.length === 0) {
            return { usePerplexityOnly: true, reason: 'Question generale/non-financiere - Perplexity peut repondre naturellement' };
        }

        //  FIX: Code redondant supprime - deja gere par generalNonFinancialKeywords ci-dessus

        //  PERPLEXITY SEUL: Questions historiques/comparaisons temporelles
        const historicalKeywords = [
            'historique', 'histoire', 'evolution', 'evolution', 'tendance historique',
            'performance historique', 'historical performance', 'crise', 'crash', 'bulle',
            'krach', 'crise financiere', 'financial crisis', 'recession', 'recession',
            'depression', 'depression', 'boom', 'expansion', 'cycle economique', 'economic cycle',
            'crise de 2008', 'dot-com', 'tech bubble', 'bulle technologique', 'black monday',
            'flash crash', 'correction', 'bear market', 'marche baissier', 'bull market', 'marche haussier'
        ];
        if (historicalKeywords.some(kw => message.includes(kw)) && extractedTickers.length === 0) {
            return { usePerplexityOnly: true, reason: 'Question historique - Perplexity a acces aux donnees historiques' };
        }

        //  APIs NECESSAIRES: Prix en temps reel precis
        const priceKeywords = [
            'prix', 'cours', 'cotation', 'quote', 'se negocie', 'trading at', 'valeur actuelle',
            'prix actuel', 'cours actuel', 'dernier prix', 'last price', 'prix de cloture',
            'closing price', 'prix d\'ouverture', 'opening price', 'prix haut', 'high',
            'prix bas', 'low', 'prix moyen', 'average price', 'vwap', 'volume weighted',
            'market cap', 'capitalisation', 'market capitalization', 'valorisation boursiere'
        ];
        if (priceKeywords.some(kw => message.includes(kw)) && extractedTickers.length > 0) {
            return { usePerplexityOnly: false, reason: 'Prix temps reel necessite donnees precises (FMP/Polygon)' };
        }

        //  APIs NECESSAIRES: Ratios financiers exacts
        const ratioKeywords = [
            'pe ratio', 'p/e', 'p/b', 'p/s', 'p/fcf', 'peg', 'ev/ebitda', 'ev/sales',
            'roe', 'roa', 'roic', 'roce', 'debt/equity', 'debt to equity', 'current ratio',
            'quick ratio', 'cash ratio', 'debt ratio', 'equity ratio', 'ratio',
            'marges', 'margins', 'gross margin', 'operating margin', 'net margin',
            'profit margin', 'marge brute', 'marge operationnelle', 'marge nette',
            'turnover', 'rotation', 'asset turnover', 'inventory turnover', 'receivables turnover',
            'days sales outstanding', 'dso', 'days payables outstanding', 'dpo',
            'cash conversion cycle', 'ccc', 'working capital', 'fonds de roulement'
        ];
        if (ratioKeywords.some(kw => message.includes(kw)) && extractedTickers.length > 0) {
            return { usePerplexityOnly: false, reason: 'Ratios financiers necessitent donnees structurees precises (FMP)' };
        }

        //  APIs NECESSAIRES: Indicateurs techniques
        const technicalKeywords = [
            'rsi', 'macd', 'sma', 'ema', 'wma', 'vwap', 'atr', 'adx', 'obv', 'mfi',
            'moyennes mobiles', 'moving averages', 'support', 'resistance', 'resistance',
            'bollinger', 'bollinger bands', 'stochastic', 'williams %r', 'cci',
            'momentum', 'rate of change', 'roc', 'parabolic sar', 'sar',
            'fibonacci', 'fibonacci retracement', 'fibonacci extension',
            'ichimoku', 'ichimoku cloud', 'pivot point', 'pivot points',
            'volume', 'volume profile', 'on balance volume', 'accumulation distribution',
            'chaikin oscillator', 'money flow index', 'relative strength', 'relative strength index'
        ];
        if (technicalKeywords.some(kw => message.includes(kw)) && extractedTickers.length > 0) {
            return { usePerplexityOnly: false, reason: 'Indicateurs techniques necessitent calculs precis (Twelve Data)' };
        }

        //  APIs NECESSAIRES: Dividendes
        const dividendKeywords = [
            'dividende', 'dividend', 'dividend yield', 'rendement', 'yield',
            'payout ratio', 'taux de distribution', 'dividend per share', 'dps',
            'dividend history', 'historique des dividendes', 'ex-dividend date',
            'date ex-dividende', 'payment date', 'date de paiement', 'dividend growth',
            'croissance des dividendes', 'dividend aristocrat', 'dividend king'
        ];
        if (dividendKeywords.some(kw => message.includes(kw)) && extractedTickers.length > 0) {
            return { usePerplexityOnly: false, reason: 'Dividendes necessitent donnees precises (FMP)' };
        }

        //  APIs NECESSAIRES: Calendriers
        const calendarKeywords = [
            'calendrier', 'calendar', 'resultats', 'resultats', 'earnings',
            'prochains resultats', 'next earnings', 'earnings date', 'date de resultats',
            'earnings call', 'conference resultats', 'guidance', 'previsions', 'previsions',
            'forecast', 'outlook', 'perspectives', 'expectations', 'attentes',
            'economic calendar', 'calendrier economique', 'evenements economiques',
            'evenements economiques', 'economic events', 'fed meeting', 'reunion fed',
            'cpi', 'inflation data', 'donnees inflation', 'employment report', 'rapport emploi',
            'gdp release', 'publication pib', 'retail sales', 'ventes au detail'
        ];
        if (calendarKeywords.some(kw => message.includes(kw))) {
            return { usePerplexityOnly: false, reason: 'Calendriers necessitent donnees structurees (FMP)' };
        }

        //  APIs NECESSAIRES: Watchlist/Portfolio
        const portfolioKeywords = [
            'watchlist', 'portefeuille', 'portfolio', 'mes actions', 'mes titres',
            'mes tickers', 'ma liste', 'liste de suivi', 'positions', 'holdings',
            'diversification', 'allocation', 'poids', 'weight', 'exposition', 'exposure',
            'performance portefeuille', 'portfolio performance', 'rendement portefeuille',
            'portfolio return', 'beta portefeuille', 'portfolio beta', 'correlation', 'correlation'
        ];
        if (portfolioKeywords.some(kw => message.includes(kw))) {
            return { usePerplexityOnly: false, reason: 'Watchlist necessite donnees utilisateur (Supabase)' };
        }

        //  APIs NECESSAIRES: Analyse complete avec ticker specifique
        const analysisKeywords = [
            'analyse complete', 'comprehensive analysis', 'analyse approfondie', 'deep dive',
            'due diligence', 'evaluation complete', 'evaluation complete', 'full analysis',
            'analyse detaillee', 'detailed analysis', 'rapport complet', 'full report',
            'analyse fondamentale complete', 'complete fundamental analysis'
        ];
        if (extractedTickers.length > 0 && analysisKeywords.some(kw => message.includes(kw))) {
            return { usePerplexityOnly: false, reason: 'Analyse complete necessite toutes les metriques precises (FMP)' };
        }

        //  APIs NECESSAIRES: Donnees fondamentales precises
        const fundamentalsKeywords = [
            'fondamentaux', 'fundamentals', 'revenus', 'revenue', 'sales', 'ventes',
            'benefices', 'benefices', 'earnings', 'profit', 'net income', 'revenu net',
            'eps', 'earnings per share', 'bpa', 'benefice par action', 'benefice par action',
            'cash flow', 'flux de tresorerie', 'free cash flow', 'fcf', 'flux de tresorerie libre',
            'operating cash flow', 'ocf', 'cash from operations', 'cash from investing',
            'cash from financing', 'ebitda', 'ebit', 'operating income', 'revenu operationnel',
            'gross profit', 'profit brut', 'operating profit', 'profit operationnel',
            'net profit', 'profit net', 'margins', 'marges', 'balance sheet', 'bilan',
            'income statement', 'compte de resultat', 'cash flow statement', 'tableau des flux',
            'assets', 'actifs', 'liabilities', 'passifs', 'equity', 'capitaux propres',
            'book value', 'valeur comptable', 'tangible book value', 'valeur comptable tangible',
            'debt', 'dette', 'long term debt', 'dette long terme', 'short term debt', 'dette court terme',
            'working capital', 'fonds de roulement', 'current assets', 'actifs courants',
            'current liabilities', 'passifs courants', 'inventory', 'inventaire', 'receivables', 'creances'
        ];
        if (fundamentalsKeywords.some(kw => message.includes(kw)) && extractedTickers.length > 0) {
            return { usePerplexityOnly: false, reason: 'Donnees fondamentales necessitent precision (FMP)' };
        }

        //  APIs NECESSAIRES: Recommandations analystes
        const analystKeywords = [
            'recommandation', 'recommendation', 'rating', 'note', 'consensus',
            'analystes', 'analysts', 'consensus analystes', 'analyst consensus',
            'price target', 'objectif de prix', 'target price', 'prix cible',
            'buy', 'sell', 'hold', 'strong buy', 'strong sell', 'outperform', 'underperform',
            'upgrade', 'downgrade', 'mise a niveau', 'retrogradation', 'coverage', 'couverture'
        ];
        if (analystKeywords.some(kw => message.includes(kw)) && extractedTickers.length > 0) {
            return { usePerplexityOnly: false, reason: 'Recommandations analystes necessitent donnees structurees (FMP)' };
        }

        //  APIs NECESSAIRES: Options/Derives avec ticker
        const optionsTickerKeywords = [
            'options', 'option', 'call', 'put', 'strike', 'prix d\'exercice',
            'prime', 'option premium', 'delta', 'gamma', 'theta', 'vega', 'greeks',
            'implied volatility', 'volatilite implicite', 'iv', 'open interest',
            'volume options', 'volume d\'options', 'options chain', 'chaine d\'options',
            'covered call', 'protective put', 'collar', 'strangle', 'straddle'
        ];
        if (optionsTickerKeywords.some(kw => message.includes(kw)) && extractedTickers.length > 0) {
            return { usePerplexityOnly: false, reason: 'Options necessitent donnees de marche precises' };
        }

        //  APIs NECESSAIRES: Performance historique precise
        const performanceKeywords = [
            'performance', 'rendement', 'return', 'ytd', 'year to date', 'annee en cours',
            '1 an', '1 year', '3 ans', '3 years', '5 ans', '5 years', '10 ans', '10 years',
            '52 semaines', '52 weeks', '52w high', '52w low', '52 semaines haut', '52 semaines bas',
            'all time high', 'ath', 'sommet historique', 'all time low', 'atl', 'creux historique',
            'volatilite', 'volatility', 'beta', 'alpha', 'sharpe ratio', 'sortino ratio',
            'max drawdown', 'perte maximale', 'downside deviation', 'upside capture',
            'downside capture', 'tracking error', 'information ratio'
        ];
        if (performanceKeywords.some(kw => message.includes(kw)) && extractedTickers.length > 0) {
            return { usePerplexityOnly: false, reason: 'Performance historique necessite donnees precises (FMP)' };
        }

        //  PERPLEXITY SEUL par defaut pour questions generales sans ticker
        if (extractedTickers.length === 0) {
            return { usePerplexityOnly: true, reason: 'Question generale sans ticker specifique - Perplexity suffisant' };
        }

        //  APIs NECESSAIRES par defaut si ticker present
        return { usePerplexityOnly: false, reason: 'Ticker specifique detecte - APIs necessaires pour donnees precises' };
    }

    /**
     * Selection intelligente des outils basee sur scoring
     * (Enrichi par l'analyse d'intention si disponible)
     *  AMELIORATION: Decision intelligente Perplexity vs APIs
     */
    async _plan_with_scoring(userMessage, context) {
        const message = userMessage.toLowerCase();
        const availableTools = this.toolsConfig.tools.filter(tool => tool.enabled);
        const intentData = context.intent_data || {};

        //  NOUVEAU: Decision intelligente Perplexity vs APIs
        const perplexityDecision = this._shouldUsePerplexityOnly(userMessage, context, intentData);

        if (perplexityDecision.usePerplexityOnly) {
            console.log(` PERPLEXITY ONLY: ${perplexityDecision.reason}`);
            console.log(`   -> Pas d'outils necessaires, Perplexity repondra directement`);

            //  Marquer le contexte pour adaptation du prompt
            context.perplexity_only_reason = perplexityDecision.reason;

            if (perplexityDecision.reason.includes('generale/non-financiere')) {
                context.is_general_question = true;
                console.log(`   -> Question generale/non-financiere detectee - prompt adapte`);
            }

            if (perplexityDecision.reason.includes('fonds')) {
                console.log(`   -> Question sur fonds detectee - prompt specialise sera utilise`);
            }

            return []; // Retourner liste vide - Emma utilisera Perplexity seul
        } else {
            console.log(` APIs NECESSAIRES: ${perplexityDecision.reason}`);
            console.log(`   -> Selection des outils appropries...`);
        }

        //  FIX: Verification deja faite dans _shouldUsePerplexityOnly() - pas besoin de repeter
        // Si on arrive ici, c'est que des outils sont necessaires

        // Si intent analysis a suggere des outils, leur donner la priorite
        const suggestedTools = context.suggested_tools || [];
        const extractedTickers = context.extracted_tickers || context.tickers || [];

        // Scoring des outils
        const scoredTools = availableTools.map(tool => {
            let score = 0;

            // Score de base (priorite inversee - plus bas = mieux)
            score += (tool.priority * 10);

            // COGNITIVE SCAFFOLDING BOOST: Si l'outil est suggere par intent analysis
            if (suggestedTools.includes(tool.id)) {
                const suggestionIndex = suggestedTools.indexOf(tool.id);
                // Plus l'outil est tot dans la liste, plus le boost est fort
                const intentBoost = 100 - (suggestionIndex * 10); // 100, 90, 80, 70, 60
                score -= intentBoost;
                console.log(` Intent boost for ${tool.id}: -${intentBoost} points`);
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

            // Bonus pour outils recemment utilises avec succes
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

        //  ANALYSE COMPLETE DE TICKER: Force les outils essentiels pour obtenir TOUTES les metriques
        const isTickerAnalysis = extractedTickers.length > 0 || context.tickers?.length > 0;
        const isComprehensiveAnalysis = context.intent === 'comprehensive_analysis' ||
            message.includes('analyse') ||
            message.includes('analyser');

        let selectedTools = [];

        if (isTickerAnalysis && isComprehensiveAnalysis) {
            // Pour une analyse complete, forcer les outils essentiels
            const essentialToolIds = [
                'fmp-quote',              // Prix actuel
                'fmp-fundamentals',       // Profil entreprise
                'fmp-ratios',             // P/E, P/B, ROE, Debt/Equity
                'fmp-key-metrics',        // EPS, Free Cash Flow, Market Cap
                'fmp-ticker-news',        // Nouvelles recentes
                'fmp-ratings',            // Consensus analystes
                'earnings-calendar'       // Prochains resultats
            ];

            // Ajouter les outils essentiels en priorite
            const essentialTools = scoredTools.filter(t => essentialToolIds.includes(t.id));
            const remainingTools = scoredTools.filter(t => !essentialToolIds.includes(t.id));

            selectedTools = [...essentialTools, ...remainingTools];

            console.log(` ANALYSE COMPLETE activee: ${essentialTools.length} outils essentiels forces`);
        } else {
            // Selection normale basee sur le scoring
            selectedTools = scoredTools;
        }

        //  OPTIMISATION SMS: Skip outils "nice-to-have" non essentiels
        if (context.user_channel === 'sms') {
            const message = userMessage.toLowerCase();

            // Outils optionnels (skip sauf si explicitement demandes)
            const optionalTools = ['earnings-calendar', 'analyst-recommendations', 'economic-calendar'];

            const isExplicitlyRequested = (toolId) => {
                const toolKeywords = {
                    'earnings-calendar': ['resultats', 'earnings', 'resultat', 'publication'],
                    'analyst-recommendations': ['analyste', 'recommandation', 'consensus', 'rating'],
                    'economic-calendar': ['calendrier', 'economique', 'evenement', 'macro']
                };

                const keywords = toolKeywords[toolId] || [];
                return keywords.some(kw => message.includes(kw));
            };

            selectedTools = selectedTools.filter(tool => {
                if (optionalTools.includes(tool.id)) {
                    const keep = isExplicitlyRequested(tool.id);
                    if (!keep) {
                        console.log(` SMS optimization: Skipping ${tool.id} (not explicitly requested)`);
                    }
                    return keep;
                }
                return true;
            });

            console.log(` SMS mode: ${selectedTools.length} tools selected (optimized)`);
        }

        // Limitation au nombre max d'outils concurrents
        const maxTools = Math.min(this.toolsConfig.config.max_concurrent_tools, selectedTools.length);
        const finalSelection = selectedTools.slice(0, maxTools);

        console.log(' Tool scoring results:', finalSelection.map(t => ({
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

        // Mots-cles dans le message
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

        // Contexte specifique (tickers, etc.)
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

        // Score base sur le taux de succes
        const successRate = stats.success_rate;
        return Math.round(successRate * 30); // Max 30 points
    }

    /**
     * Bonus pour utilisation recente
     */
    _calculateRecencyBonus(toolId) {
        const stats = this.usageStats[toolId];
        if (!stats || !stats.last_used) {
            return 0;
        }

        const hoursSinceLastUse = (Date.now() - new Date(stats.last_used).getTime()) / (1000 * 60 * 60);

        // Bonus decroissant sur 24h
        if (hoursSinceLastUse < 1) return 15;
        if (hoursSinceLastUse < 6) return 10;
        if (hoursSinceLastUse < 24) return 5;
        return 0;
    }

    /**
     * Execution parallele des outils selectionnes
     */
    async _execute_all(selectedTools, userMessage, context) {
        const executionPromises = selectedTools.map(async (tool) => {
            const startTime = Date.now();

            try {
                console.log(` Executing tool: ${tool.id}`);

                // Import dynamique de l'outil
                const toolModule = await import(`../lib/tools/${tool.implementation.file}`);
                const toolInstance = new toolModule.default();

                // Preparation des parametres
                const params = this._prepareToolParameters(tool, userMessage, context);

                // Si params est null, skip cet outil (pas de parametres valides)
                if (params === null) {
                    console.log(` Skipping tool ${tool.id} - no valid parameters`);
                    return {
                        tool_id: tool.id,
                        success: false,
                        error: 'Skipped - no valid parameters',
                        skipped: true,
                        execution_time_ms: 0,
                        is_reliable: false
                    };
                }

                // Execution avec timeout
                const result = await Promise.race([
                    toolInstance.execute(params, context),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Tool timeout')), this.toolsConfig.config.timeout_ms)
                    )
                ]);

                const executionTime = Date.now() - startTime;

                // Mise a jour des statistiques
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
                console.error(` Tool ${tool.id} failed:`, error.message);

                // Mise a jour des statistiques d'erreur
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
     * Tentative de fallback en cas d'echec d'outil
     */
    async _tryFallback(failedTool, userMessage, context) {
        if (!failedTool.fallback_tools || failedTool.fallback_tools.length === 0) {
            return null;
        }

        for (const fallbackId of failedTool.fallback_tools) {
            try {
                const fallbackTool = this.toolsConfig.tools.find(t => t.id === fallbackId);
                if (!fallbackTool || !fallbackTool.enabled) continue;

                console.log(` Trying fallback: ${fallbackId}`);

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
                console.error(` Fallback ${fallbackId} also failed:`, error.message);
                continue;
            }
        }

        return null;
    }

    /**
     * Preparation des parametres pour l'outil
     */
    _prepareToolParameters(tool, userMessage, context) {
        const params = {};

        // Extraction des tickers depuis le contexte et le message
        const extractedTickers = this._extractAllTickers(userMessage, context);

        // Pour les outils qui necessitent un ticker
        if (tool.parameters.ticker) {
            if (extractedTickers && extractedTickers.length > 0) {
                // Si l'outil peut gerer plusieurs tickers, passer tous
                // Sinon, prendre le premier (pour compatibilite)
                params.ticker = extractedTickers[0];

                // Ajouter tous les tickers au contexte pour que l'outil puisse les utiliser
                params.all_tickers = extractedTickers;
            } else {
                // Pas de ticker trouve - l'outil echouera probablement
                console.warn(` Tool ${tool.id} requires ticker but none found`);
                return null; // Retourner null pour skip cet outil
            }
        }

        // Pour calculator: NE PAS l'utiliser si pas de donnees pour calculer
        if (tool.id === 'calculator') {
            // Calculator necessite 'operation' ET 'values'
            // Si on n'a pas de donnees a calculer, skip
            const hasCalculationRequest = userMessage.toLowerCase().match(/calcul|ratio|pe|dividend|market cap|croissance/);

            if (!hasCalculationRequest) {
                console.log(' Skipping calculator - no calculation requested');
                return null; // Skip calculator
            }

            // Si calcul demande, essayer d'extraire les parametres
            if (userMessage.toLowerCase().includes('pe') || userMessage.toLowerCase().includes('p/e')) {
                params.operation = 'pe_ratio';
            } else if (userMessage.toLowerCase().includes('dividend')) {
                params.operation = 'dividend_yield';
            } else if (userMessage.toLowerCase().includes('market cap')) {
                params.operation = 'market_cap';
            } else {
                params.operation = 'pe_ratio'; // Defaut
            }

            // Pour values, on ne peut pas les deviner - skip si pas de donnees
            if (!context.stockData || !context.stockData[extractedTickers[0]]) {
                console.log(' Skipping calculator - no stock data available for calculation');
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
                // Pas assez de donnees pour calculator
                console.log(' Skipping calculator - insufficient data for calculation');
                return null;
            }
        }

        // Pour les outils qui necessitent une date
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

        // 1. Tickers depuis le contexte (priorite)
        if (context.extracted_tickers && context.extracted_tickers.length > 0) {
            // Depuis l'analyse d'intention
            context.extracted_tickers.forEach(t => tickers.add(t.toUpperCase()));
        } else if (context.tickers && context.tickers.length > 0) {
            // Depuis le contexte fourni par le frontend
            context.tickers.forEach(t => tickers.add(t.toUpperCase()));
        }

        // 2. Extract tickers from message using centralized TickerExtractor utility
        //  Mode strict active pour eviter faux positifs (TU, ME, AU, etc.)
        const extractedTickers = TickerExtractor.extract(userMessage, {
            includeCompanyNames: true,
            filterCommonWords: true,
            strictContext: false // Flexibilite pour garder compatibilite
        });

        extractedTickers.forEach(ticker => tickers.add(ticker));

        return Array.from(tickers);
    }

    /**
     * Generation de la reponse finale avec SMART ROUTING (Perplexity/Gemini/Claude)
     */
    async _generate_response(userMessage, toolResults, context, intentData = null) {
        // Declarer outputMode avant le try pour qu'il soit accessible dans le catch
        const outputMode = context.output_mode || 'chat';

        try {
            console.log(` Generating response for mode: ${outputMode}`);

            // Preparation du contexte
            // IMPORTANT: Inclure TOUS les outils qui ont retourne des donnees, meme si is_reliable: false
            // Emma doit voir les donnees pour pouvoir les analyser et en parler
            const toolsData = toolResults
                .filter(r => r.data && !r.skipped) // Inclure tous les outils avec donnees (meme is_reliable: false)
                .map(r => ({
                    tool: r.tool_id,
                    data: r.data,
                    is_reliable: r.is_reliable,
                    success: r.success
                }));

            //  FIX: Utiliser les 10 derniers messages pour meilleur contexte (au lieu de 5)
            const conversationContext = this.conversationHistory.slice(-10); // 10 derniers echanges
            console.log(` Conversation context: ${conversationContext.length} messages`);

            //  SMART ROUTER: Selectionner le meilleur modele
            const modelSelection = await this._selectModel(intentData, outputMode, toolsData, userMessage);
            console.log(` Selected model: ${modelSelection.model} (${modelSelection.reason})`);

            // Construire le prompt approprie
            // Construire le prompt approprie
            const prompt = await this._buildPerplexityPrompt(
                userMessage,
                toolsData,
                conversationContext,
                context,
                intentData
            );

            let response;
            let citations = []; //  Citations extraites de Perplexity

            // Router vers le bon modele
            if (modelSelection.model === 'claude') {
                // CLAUDE: Briefings premium
                response = await this._call_claude(
                    prompt, 
                    outputMode, 
                    userMessage, 
                    intentData, 
                    toolResults, 
                    context, 
                    modelSelection.modelConfig
                );
            } else if (modelSelection.model === 'gemini') {
                // GEMINI: Questions conceptuelles (gratuit)
                response = await this._call_gemini(
                    prompt, 
                    outputMode, 
                    context, 
                    modelSelection.modelConfig
                );
            } else {
                // PERPLEXITY: Donnees factuelles avec sources (default)
                console.log(` [Perplexity] Debut appel Perplexity pour intent: ${intentData?.intent || 'unknown'}`);
                const perplexityResult = await this._call_perplexity(
                    prompt, 
                    outputMode, 
                    modelSelection.recency, 
                    userMessage, 
                    intentData, 
                    toolResults, 
                    context, 
                    modelSelection.modelConfig
                );
                console.log(` [Perplexity] Appel termine, reponse recue (${typeof perplexityResult === 'object' ? perplexityResult.content?.length || 0 : perplexityResult?.length || 0} caracteres)`);

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
                // Nettoyer le Markdown (enlever eventuels artifacts)
                response = this._cleanMarkdown(response);
            } else if (outputMode === 'chat') {
                //  Nettoyer tout JSON brut qui pourrait avoir ete inclus dans la reponse conversationnelle
                response = this._sanitizeJsonInResponse(response);
            }

            //  TRONCATURE DE SECURITE FINALE POUR SMS
            // Limite absolue: 6000 caracteres (Max 4 SMS de 1500 chars)
            if (context.user_channel === 'sms' && response.length > 6000) {
                console.warn(` SMS response too long (${response.length} chars), truncating to 6000 (Max 4 SMS)...`);

                // Tronquer intelligemment au dernier point ou saut de ligne avant 5800 chars
                const truncated = response.substring(0, 5800);
                const lastPeriod = Math.max(truncated.lastIndexOf('.'), truncated.lastIndexOf('\n'));

                if (lastPeriod > 5000) {
                    // Tronquer au dernier point/saut de ligne
                    response = truncated.substring(0, lastPeriod + 1) + '\n\n Suite sur gobapps.com (Limite 4 SMS)';
                } else {
                    // Tronquer brutalement si pas de point trouve
                    response = truncated + '...\n\n Suite sur gobapps.com (Limite 4 SMS)';
                }

                console.log(` SMS truncated to ${response.length} chars (Target: 4 segments)`);
            }

            //  FRESH DATA GUARD: Valider que les donnees factuelles ont des sources
            let validation = null;
            if (outputMode === 'chat' && modelSelection.model === 'perplexity') {
                validation = this._validateFreshData(response, intentData);
                console.log(` FreshDataGuard: Confidence ${(validation.confidence * 100).toFixed(0)}%, Sources: ${validation.source_types_found}`);

                if (!validation.passed) {
                    console.warn(' FreshDataGuard: Response lacks sources, retrying...');
                    // Retry avec prompt renforce
                    const reinforcedPrompt = `${prompt}\n\n CRITICAL: You MUST include sources for all factual claims. Do not provide generic answers without sources.`;
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
                    console.log(` FreshDataGuard (retry): Confidence ${(validation.confidence * 100).toFixed(0)}%, Sources: ${validation.source_types_found}`);
                }
            }

            // Retourner reponse avec validation, modele utilise, et citations
            return {
                response,
                citations,  //  Ajouter les citations pour formatage amical ulterieur
                validation,
                model: modelSelection.model,  // Ajout du modele pour affichage dans l'UI
                model_reason: modelSelection.reason
            };

        } catch (error) {
            console.error(' Response generation failed:', error);

            // Reponse de fallback basee sur les donnees des outils (utilise Gemini pour generer une vraie reponse)
            const fallbackResponse = await this._generateFallbackResponse(userMessage, toolResults, outputMode, context);
            return {
                response: fallbackResponse,
                validation: { passed: false, confidence: 0.3, reason: 'Fallback response' }
            };
        }
    }

    /**
     *  FRESH DATA GUARD - Valide la presence de sources pour donnees factuelles
     * Garantit la fiabilite et la transparence des reponses d'Emma
     */
    _validateFreshData(response, intentData) {
        // Intents qui NECESSITENT des sources
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

        // Si intent ne necessite pas de sources, passer
        if (!needsSourcesIntents.includes(intent)) {
            return {
                passed: true,
                confidence: 0.7,
                reason: 'Intent does not require sources'
            };
        }

        // Verifier la presence de sources dans la reponse (patterns plus flexibles)
        const hasSourcePatterns = [
            /\[SOURCE:/i,
            /\[CHART:/i,
            /\[TABLE:/i,
            /\(https?:\/\//i, // URLs
            /https?:\/\//i, // URLs n'importe ou
            /Bloomberg|Reuters|La Presse|BNN|CNBC|Financial Times|Wall Street Journal|Morningstar|Fundata|FMP|Polygon|Yahoo Finance/i,
            /Donnees de marche:|Sources:|Source:/i,
            /selon|d'apres|selon les donnees|donnees de|source|sources/i, // Sources implicites
            /FMP|Perplexity|Bloomberg|FactSet|Seeking Alpha/i, // Noms de sources
            /\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}/i // Dates recentes = source recente implicite
        ];

        const hasSources = hasSourcePatterns.some(pattern => pattern.test(response));

        //  ASSOUPLISSEMENT: Accepter aussi donnees chiffrees recentes comme source implicite
        const hasRecentData = /\d{4}|202[4-5]|janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre/i.test(response);
        const hasNumericData = /\$\d+\.?\d*|\d+%|\d+\.\d+x|\d+\.\d+%/.test(response); // Prix, %, ratios

        // Si donnees chiffrees recentes presentes -> considerer comme source implicite
        if (!hasSources && hasRecentData && hasNumericData) {
            console.log(' FreshDataGuard: Donnees chiffrees recentes detectees (source implicite)');
        }

        // Calculer score de confiance
        let confidence = 0.5; // Base

        if (hasSources) {
            confidence = 0.9; // Haute confiance si sources presentes

            // Bonus: Plusieurs types de sources
            const sourceTypeCount = hasSourcePatterns.filter(pattern => pattern.test(response)).length;
            if (sourceTypeCount >= 3) confidence = 0.95;
            if (sourceTypeCount >= 5) confidence = 0.98;
        }

        // Verifier dates recentes (bonus confiance)
        const hasRecentDate = /202[4-5]|janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre/i.test(response);
        if (hasRecentDate) confidence += 0.02;

        //  ASSOUPLISSEMENT: Accepter donnees chiffrees recentes comme source implicite
        const finalHasSources = hasSources || (hasRecentData && hasNumericData);
        const finalConfidence = finalHasSources ? Math.max(confidence, 0.75) : confidence; // Minimum 0.75 si donnees recentes

        return {
            passed: finalHasSources,
            confidence: Math.min(1.0, finalConfidence),
            reason: finalHasSources
                ? (hasSources ? 'Sources verified' : 'Recent numeric data detected (implicit source)')
                : 'Missing sources for factual data',
            source_types_found: hasSourcePatterns.filter(pattern => pattern.test(response)).length
        };
    }

    /**
     * Validation et parsing JSON (MODE DATA)
     */
    _validateAndParseJSON(response) {
        try {
            console.log(' Validating JSON response...');

            // Extraire JSON si du texte avant/apres
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.error(' No JSON found in response');
                return '{}'; // Fallback: objet vide
            }

            // Parser pour valider
            const parsed = JSON.parse(jsonMatch[0]);

            // Retourner JSON stringifie proprement
            console.log(' JSON validated successfully');
            return JSON.stringify(parsed, null, 2);

        } catch (error) {
            console.error(' JSON validation failed:', error.message);
            console.error('Response was:', response.substring(0, 200));
            return '{}'; // Fallback: objet vide
        }
    }

    /**
     * Nettoyage Markdown (MODE BRIEFING)
     */
    _cleanMarkdown(markdown) {
        // Enlever eventuels code blocks markdown si presents
        let cleaned = markdown.replace(/^```markdown\n/, '').replace(/\n```$/, '');

        // Nettoyer espaces multiples
        cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

        return cleaned.trim();
    }

    /**
     *  Detecte et nettoie le JSON brut dans les reponses conversationnelles
     * Protection contre les reponses qui contiennent du JSON au lieu de texte naturel
     *
     *  AMELIORE: Detection plus agressive et conversion recursive en texte lisible
     */
    _sanitizeJsonInResponse(response) {
        try {
            //  DETECTION RENFORCEE: Detecter TOUT JSON, pas seulement >100 chars
            const jsonPatterns = [
                /\{[\s\S]{20,}\}/g,           // Objets JSON (>20 chars pour eviter faux positifs)
                /\[[\s\S]{20,}\]/g,           // Arrays JSON (>20 chars)
                /"[a-zA-Z_]+"\s*:\s*[{\["]/g, // Pattern cle:valeur JSON
                /\{\s*"[^"]+"\s*:/g,          // Debut d'objet JSON avec cle
                /:\s*\{[^}]+\}/g,             // Valeur objet JSON imbrique
                /\[\s*\{[^}]+\}\s*\]/g        // Array d'objets JSON
            ];

            let hasJsonDump = false;
            for (const pattern of jsonPatterns) {
                if (pattern.test(response)) {
                    hasJsonDump = true;
                    break;
                }
            }

            // Si pas de JSON dump detecte, retourner tel quel
            if (!hasJsonDump) {
                return response;
            }

            console.warn(' JSON dump detected in response, attempting aggressive cleanup...');
            let cleaned = response;

            //  HELPER: Convertir recursivement JSON en texte lisible
            const jsonToText = (obj, indent = 0) => {
                const prefix = '  '.repeat(indent);
                const lines = [];

                if (Array.isArray(obj)) {
                    // Arrays: afficher comme liste
                    obj.forEach((item, idx) => {
                        if (typeof item === 'object' && item !== null) {
                            lines.push(`${prefix}${idx + 1}. ${jsonToText(item, indent + 1).trim()}`);
                        } else {
                            lines.push(`${prefix}${idx + 1}. ${item}`);
                        }
                    });
                } else if (typeof obj === 'object' && obj !== null) {
                    // Objects: afficher comme cle: valeur
                    for (const [key, value] of Object.entries(obj)) {
                        // Formater les cles en francais (camelCase -> Texte lisible)
                        const readableKey = key
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/^./, str => str.toUpperCase())
                            .trim();

                        if (typeof value === 'object' && value !== null) {
                            lines.push(`${prefix}${readableKey}:`);
                            lines.push(jsonToText(value, indent + 1));
                        } else {
                            lines.push(`${prefix}${readableKey}: ${value}`);
                        }
                    }
                } else {
                    return String(obj);
                }

                return lines.join('\n');
            };

            //  ETAPE 1: Nettoyer code blocks JSON (```json ... ```)
            cleaned = cleaned.replace(/```json\s*([\s\S]*?)\s*```/g, (match, content) => {
                try {
                    const parsed = JSON.parse(content);
                    return '\n' + jsonToText(parsed) + '\n';
                } catch (e) {
                    console.warn(' Could not parse JSON code block, keeping original text');
                    return match; // Conserver si non parseable (bug 5 fix)
                }
            });

            //  ETAPE 2: Nettoyer objets JSON autonomes (gros blocs >20 chars)
            // Traiter les plus gros blocs d'abord (eviter remplacements en cascade)
            const jsonObjectRegex = /\{[\s\S]{20,}\}/g;
            const matches = [...cleaned.matchAll(jsonObjectRegex)].sort((a, b) => b[0].length - a[0].length);

            for (const match of matches) {
                try {
                    // Tenter de parser le JSON
                    const parsed = JSON.parse(match[0]);
                    const textVersion = jsonToText(parsed);
                    cleaned = cleaned.replace(match[0], '\n' + textVersion + '\n');
                } catch (e) {
                    // SI LE PARSING ECHOUE: Conserver le texte original! 
                    // Il s'agit probablement de texte entre accolades et non d'un dump JSON.
                    console.log('i Text looks like JSON but is not parseable, keeping as original text.');
                    // On ne fait rien, cleaned reste inchange pour ce match
                }
            }

            //  ETAPE 3: Nettoyer arrays JSON autonomes
            const jsonArrayRegex = /\[[\s\S]{20,}\]/g;
            const arrayMatches = [...cleaned.matchAll(jsonArrayRegex)].sort((a, b) => b[0].length - a[0].length);

            for (const match of arrayMatches) {
                try {
                    const parsed = JSON.parse(match[0]);
                    const textVersion = jsonToText(parsed);
                    cleaned = cleaned.replace(match[0], '\n' + textVersion + '\n');
                } catch (e) {
                    // SI LE PARSING ECHOUE: Conserver le texte original!
                    console.log('i Array-like text is not parseable JSON, keeping as original text.');
                    // On ne fait rien
                }
            }

            //  ETAPE 4: Supprimer les petits fragments JSON restants (<20 chars mais suspects)
            cleaned = cleaned.replace(/\{[^}]{1,20}\}/g, (match) => {
                // Garder seulement si ce n'est pas du JSON (ex: emojis, texte entre accolades)
                if (match.includes(':') || match.includes('"')) {
                    return ''; // C'est probablement du JSON, supprimer
                }
                return match; // Garder (ex: {nom})
            });

            //  ETAPE 5: Supprimer tous les code blocks restants (```, ~~, etc.)
            cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
            cleaned = cleaned.replace(/`[^`]+`/g, ''); // Inline code

            //  ETAPE 6: Nettoyer les artifacts de formatage JSON
            cleaned = cleaned.replace(/^[\s\n]*[\{\[][\s\S]*?[\}\]][\s\n]*$/gm, ''); // Lignes avec juste {} ou []
            cleaned = cleaned.replace(/",\s*"/g, ', '); // "value1", "value2" -> value1, value2
            cleaned = cleaned.replace(/"([^"]+)"\s*:\s*/g, '$1: '); // "key": -> key:

            //  ETAPE 7: Validation finale - Verifier qu'il ne reste plus de JSON structure
            const finalJsonCheck = /\{[\s\S]{10,}\}/g.test(cleaned) || /\[[\s\S]{10,}\]/g.test(cleaned);
            if (finalJsonCheck) {
                console.error(' JSON still present after cleanup, applying fallback');
                // Supprimer agressivement tout ce qui ressemble a du JSON
                cleaned = cleaned.replace(/\{[\s\S]*?\}/g, '');
                cleaned = cleaned.replace(/\[[\s\S]*?\]/g, '');
            }

            //  ETAPE 8: Si la reponse nettoyee est trop courte, retourner message d'erreur
            if (cleaned.trim().length < 50) {
                console.error(' Response was mostly JSON, returning fallback message');
                return "Je dispose de nombreuses donnees financieres pour repondre a votre question, mais je rencontre un probleme technique pour les presenter clairement. Pourriez-vous reformuler votre question de maniere plus specifique ? Par exemple : 'Quel est le prix actuel de [TICKER] ?' ou 'Quelles sont les dernieres nouvelles sur [TICKER] ?'";
            }

            //  ETAPE 9: Nettoyer les espaces multiples et newlines excessifs
            cleaned = cleaned.replace(/\n{3,}/g, '\n\n'); // Max 2 newlines
            cleaned = cleaned.replace(/ {2,}/g, ' ');     // Max 1 espace
            cleaned = cleaned.trim();

            console.log(' JSON dump aggressively cleaned from response (converted to readable text)');
            console.log(`   - Original length: ${response.length} chars`);
            console.log(`   - Cleaned length: ${cleaned.length} chars`);
            console.log(`   - Reduction: ${((1 - cleaned.length / response.length) * 100).toFixed(1)}%`);

            return cleaned;

        } catch (error) {
            console.error(' Error sanitizing JSON in response:', error);
            // En cas d'erreur, au moins essayer de supprimer les gros blocs JSON
            try {
                let fallback = response;
                fallback = fallback.replace(/\{[\s\S]{50,}\}/g, '');
                fallback = fallback.replace(/\[[\s\S]{50,}\]/g, '');
                return fallback.trim() || response; // Retourner fallback ou original si vide
            } catch (e) {
                return response; // Dernier recours: retourner original
            }
        }
    }

    /**
     * Construction du prompt pour Perplexity (ROUTER - 4 MODES)
     */
    async _buildPerplexityPrompt(userMessage, toolsData, conversationContext, context, intentData = null) {
        const outputMode = context.output_mode || 'chat'; // Default: chat
        console.log(` Building prompt for mode: ${outputMode}`);

        switch (outputMode) {
            case 'chat':
                return await this._buildChatPrompt(userMessage, toolsData, conversationContext, context, intentData);

            case 'data':
                return this._buildDataPrompt(userMessage, toolsData, context);

            case 'briefing':
                return this._buildBriefingPrompt(userMessage, toolsData, context, intentData);

            case 'ticker_note':
                return this._buildTickerNotePrompt(userMessage, toolsData, context, intentData);

            default:
                console.warn(` Unknown output_mode: ${outputMode}, fallback to chat`);
                return await this._buildChatPrompt(userMessage, toolsData, conversationContext, context, intentData);
        }
    }

    /**
     *  Resume intelligemment les donnees d'un outil pour eviter de dumper du JSON massif
     * Limite la taille et structure les donnees de maniere plus lisible pour l'AI
     */
    _summarizeToolData(toolId, data) {
        try {
            // Limite de taille pour eviter les dumps JSON massifs
            const MAX_ITEMS = 5;  // Max 5 items par array
            const MAX_CHARS = 1000;  // Max 1000 chars par outil

            // Cas speciaux selon le type d'outil
            if (toolId.includes('news')) {
                // Pour les news, limiter a 5 articles max avec resume
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
                // CFA-Level: Extraire TOUS les ratios pertinents (39 ratios au lieu de 10)
                const cfaMetrics = {};

                // Definition complete des ratios CFA par categorie
                const cfa_ratios = [
                    // Valorisation (9 ratios)
                    'pe', 'pb', 'ps', 'pfcf', 'pegRatio', 'evToSales', 'evToEbitda',
                    'priceToFreeCashFlowsRatio', 'enterpriseValueMultiple', 'priceToOperatingCashFlowsRatio',

                    // Prix et Capitalisation
                    'price', 'marketCap', 'enterpriseValue',

                    // Revenus et Croissance
                    'revenue', 'revenueGrowth', 'revenuePerShare', 'netIncome', 'eps', 'epsgrowth',

                    // Rentabilite (8 ratios)
                    'roe', 'roa', 'roic', 'grossProfitMargin', 'operatingProfitMargin',
                    'netProfitMargin', 'returnOnTangibleAssets', 'effectiveTaxRate',

                    // Liquidite & Solvabilite (6 ratios)
                    'currentRatio', 'quickRatio', 'cashRatio', 'debtToEquity',
                    'debtToAssets', 'interestCoverage', 'longTermDebtToCapitalization',

                    // Efficacite (5 ratios)
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

                // Si aucun ratio CFA trouve, prendre toutes les cles disponibles (fallback)
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

            // Pour les arrays generiques, limiter le nombre d'elements
            if (Array.isArray(data)) {
                const limited = data.slice(0, MAX_ITEMS);
                return JSON.stringify(limited, null, 2);
            }

            // Pour les objets, convertir en JSON et tronquer si trop long
            let jsonStr = JSON.stringify(data, null, 2);
            if (jsonStr.length > MAX_CHARS) {
                jsonStr = jsonStr.substring(0, MAX_CHARS) + '\n... (donnees tronquees pour lisibilite)';
            }

            return jsonStr;

        } catch (error) {
            console.error(`Error summarizing data for ${toolId}:`, error);
            return JSON.stringify(data, null, 2).substring(0, 500);
        }
    }

    /**
     * MODE CHAT: Reponse conversationnelle naturelle
     */
    async _buildChatPrompt(userMessage, toolsData, conversationContext, context, intentData) {
        const currentDate = new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const currentDateTime = new Date().toISOString();

        let intentContext = '';
        if (intentData) {
            intentContext = `\nINTENTION DETECTEE:
- Type: ${intentData.intent}
- Confiance: ${(intentData.confidence * 100).toFixed(0)}%
- Resume: ${intentData.user_intent_summary || 'Non specifie'}
- Tickers identifies: ${intentData.tickers?.join(', ') || 'aucun'}\n`;
        }

        // Information sur l'utilisateur
        const userName = context.user_name || null;
        const userContext = userName
            ? `\n UTILISATEUR: Tu parles avec ${userName}. Personnalise tes salutations et reponses en utilisant son nom quand approprie.

 FOCUS GEOGRAPHIQUE DES MARCHES (ADAPTATIF):
- PRIORITE PAR DEFAUT: Marches americains (NYSE, NASDAQ) 
- SECONDAIRE: Marches canadiens (TSX) 
- TERTIAIRE: Apercu marches mondiaux (Europe, Asie)
-  Si question explicite sur autre marche -> Repondre completement
-  Si contexte international dans question -> Inclure perspective globale
- L'utilisateur est un gestionnaire de portefeuille quebecois/canadien, mais peut avoir besoin d'infos sur autres marches.\n`
            : `\n FOCUS GEOGRAPHIQUE DES MARCHES (ADAPTATIF):
- PRIORITE PAR DEFAUT: Marches americains (NYSE, NASDAQ) 
- SECONDAIRE: Marches canadiens (TSX) 
- TERTIAIRE: Apercu marches mondiaux (Europe, Asie)
-  Si question explicite sur autre marche -> Repondre completement
-  Si contexte international dans question -> Inclure perspective globale\n`;

        // Si Emma doit se presenter (premier message ou "Test Emma")
        const shouldIntroduce = context.should_introduce || false;
        const userChannel = context.user_channel || 'chat';

        // Instructions differentes selon canal
        const introContext = shouldIntroduce ? (userChannel === 'sms' ?
            `\n   PRESENTATION EMMA REQUISE - PRIORITE ABSOLUE   

Tu dois te presenter IMMEDIATEMENT car c'est un premier contact ou un message de salutation.

STRUCTURE OBLIGATOIRE (4-5 SMS):
1 "Salut ${userName || 'JS'} "
2 "Je suis Emma, ton assistante IA financiere propulsee par JSLAI "
3 "Je peux t'aider avec :  Analyses de marches et actions,  Donnees financieres temps reel,  Nouvelles economiques,  Conseils et insights"
4 " Tape SKILLS pour voir mes capacites avancees (calendriers, courbes, briefings, etc.)"
5 "Ecris-moi au 1-438-544-EMMA "

 CETTE PRESENTATION EST OBLIGATOIRE - NE LA RACCOURCIS PAS.\n` :
            `\n   PRESENTATION EMMA REQUISE - PRIORITE ABSOLUE   

C'est un premier contact ou message "Test Emma". Tu DOIS te presenter completement.

STRUCTURE OBLIGATOIRE:
- Salutation personnalisee avec le nom
- "Je suis Emma, assistante IA financiere propulsee par JSLAI "
- Tes capacites principales (analyses marches, donnees temps reel, nouvelles, conseils)
- "Ecris SKILLS pour decouvrir mes capacites avancees "
- Contact: "Ecris-moi au 1-438-544-EMMA "

 NE RACCOURCIS PAS CETTE PRESENTATION.\n`
        ) : '';

        // Instruction pour emojis SMS (desactivee lors des presentations)
        const emojiInstructions = userChannel === 'sms' ? (shouldIntroduce
            ? `\n STYLE SMS: Utilise des emojis pour rendre ta presentation vivante (      ). Pour cette presentation, utilise 4-5 SMS pour etre complete.\n`
            : `\n STYLE SMS: Tu communiques par SMS. Utilise des emojis pour rendre tes reponses vivantes et engageantes (        etc.). Reste concise mais complete. Pour analyses financieres, donne les infos cles sans sacrifier la qualite. Limite-toi a 2-3 phrases maximum pour rester lisible.\n`
        ) : '';

        //  Detection si question generale/non-financiere
        const isGeneralNonFinancial = context.is_general_question ||
            (intentData && ['general_conversation', 'help', 'capabilities'].includes(intentData.intent)) ||
            (context.perplexity_only_reason && context.perplexity_only_reason.includes('generale/non-financiere'));

        // Extract product type information from tools data
        let productTypeContext = '';
        const fundamentalsTools = toolsData.filter(t => t.tool.includes('fundamentals'));
        if (fundamentalsTools.length > 0) {
            const productTypes = fundamentalsTools
                .map(t => {
                    if (t.data && t.data.product_type) {
                        return `- ${t.data.ticker || 'Ticker'}: ${t.data.product_type} (${t.data.product_category || 'N/A'})`;
                    }
                    return null;
                })
                .filter(p => p !== null);

            if (productTypes.length > 0) {
                productTypeContext = `\n TYPES DE PRODUITS DETECTES:
${productTypes.join('\n')}

 IMPORTANT: Adapte ton analyse selon le type de produit (voir section "ADAPTATION PAR TYPE DE PRODUIT FINANCIER" ci-dessous).\n`;
            }
        }

        // CFA-Level Identity Integration (uniquement pour questions financieres)
        let cfaIdentity = '';
        if (!isGeneralNonFinancial && intentData && ['comprehensive_analysis', 'fundamentals', 'comparative_analysis', 'earnings', 'recommendation'].includes(intentData.intent)) {
            const cfaIdentityText = await configManager.get('prompts', 'cfa_identity', '');
            const cfaProductGuidance = await configManager.get('prompts', 'cfa_product_guidance', '');
            const cfaSmsFormat = await configManager.get('prompts', 'cfa_sms_format', '');

            cfaIdentity = `${cfaIdentityText}

${cfaProductGuidance}

${userChannel === 'sms' ? cfaSmsFormat.split('\n\n')[0] : ''}`;
        } else if (isGeneralNonFinancial) {
            cfaIdentity = userChannel === 'sms'
                ? `Tu es Emma, une ANALYSTE INTELLIGENTE polyvalente qui utilise Perplexity pour chercher activement des informations REELLES et RECENTES sur le web.

 TON ROLE(SMS):
        - Tu es une ANALYSTE qui RECHERCHE et SYNTHETISE des informations, pas une assistante qui donne des reponses generiques
            - Tu DOIS utiliser Perplexity pour chercher des donnees factuelles et a jour
                - Tu reponds a des questions sur de nombreux sujets(meteo, actualites, sciences, culture, etc.)
                    - Tu es agile et adaptative: si une question sort du domaine financier, tu cherches activement la reponse

 TON COMPORTEMENT(SMS):
        - RECHERCHE ACTIVE: Pour toute question demandant une information specifique(meteo, actualites, donnees), tu DOIS chercher cette information REELLE via Perplexity
            - REPONSES DIRECTES: Reponds DIRECTEMENT a la question posee, pas de "Je peux t'aider avec..." ou "Que veux-tu savoir?"
                - FORMAT SMS: Reponse concise(2 - 3 SMS max), donnees cles, sources courtes, emojis pour lisibilite
                    - DONNEES REELLES: Fournis des donnees concretes, chiffres, dates, sources - pas de generalites
                        - TON: Naturel, accessible, engageant, mais TOUJOURS avec des informations REELLES et UTILES`
                : `Tu es Emma, une ANALYSTE INTELLIGENTE polyvalente qui utilise Perplexity pour chercher activement des informations REELLES et RECENTES sur le web.

 TON ROLE(WEB / EMAIL):
        - Tu es une ANALYSTE qui RECHERCHE et SYNTHETISE des informations, pas une assistante qui donne des reponses generiques
            - Tu DOIS utiliser Perplexity pour chercher des donnees factuelles et a jour
                - Tu reponds a des questions sur de nombreux sujets(meteo, actualites, sciences, culture, etc.)
                    - Tu es agile et adaptative: si une question sort du domaine financier, tu cherches activement la reponse

 TON COMPORTEMENT(WEB / EMAIL):
        - RECHERCHE ACTIVE: Pour toute question demandant une information specifique(meteo, actualites, donnees), tu DOIS chercher cette information REELLE via Perplexity
            - REPONSES DIRECTES: Reponds DIRECTEMENT a la question posee, pas de "Je peux t'aider avec..." ou "Que veux-tu savoir?"
                - FORMAT WEB / EMAIL: Reponse detaillee et complete, sources avec liens, structure claire(paragraphes, bullet points)
                    - DONNEES REELLES: Fournis des donnees concretes, chiffres, dates, sources - pas de generalites
                        - TON: Naturel, accessible, engageant, mais TOUJOURS avec des informations REELLES et UTILES`;
        } else {
            cfaIdentity = `Tu es Emma, l'assistante financiere intelligente. Reponds en francais de maniere professionnelle et accessible.`;
        }

        //  Instructions adaptees selon type de question ET canal
        const generalInstructions = isGeneralNonFinancial ? (userChannel === 'sms' ? `
 INSTRUCTIONS POUR QUESTION GENERALE (HORS FINANCE) - MODE SMS:
-  CRITIQUE ABSOLUE: Tu es une ANALYSTE INTELLIGENTE qui DOIT chercher des informations REELLES et RECENTES
-  INTERDIT: Repondre de maniere generique sans chercher d'informations reelles
-  OBLIGATOIRE: Utilise Perplexity pour RECHERCHER activement des donnees factuelles et a jour sur le web
-  Exemples de questions qui necessitent recherche active:
  - "Meteo a Rimouski" -> Cherche temperature actuelle, conditions, previsions meteo Rimouski
  - "Actualites du jour" -> Cherche les actualites recentes (pas de generalites)
  - "Qu'est-ce que X" -> Cherche definition recente et precise de X
  - "Comment fonctionne Y" -> Cherche explication detaillee et a jour de Y
-  REGLE D'OR: Si la question demande une information specifique (meteo, actualites, donnees), tu DOIS chercher cette information REELLE via Perplexity
-  FORMAT SMS: Reponse concise (2-3 SMS max), donnees cles, sources courtes, emojis pour lisibilite
-  NE PAS: Repondre "Je peux t'aider avec..." ou "Que veux-tu savoir?" - reponds DIRECTEMENT a la question
-  TON: Naturel, accessible, engageant, mais TOUJOURS avec des informations REELLES
` : `
 INSTRUCTIONS POUR QUESTION GENERALE (HORS FINANCE) - MODE WEB/EMAIL:
-  CRITIQUE ABSOLUE: Tu es une ANALYSTE INTELLIGENTE qui DOIT chercher des informations REELLES et RECENTES
-  INTERDIT: Repondre de maniere generique sans chercher d'informations reelles
-  OBLIGATOIRE: Utilise Perplexity pour RECHERCHER activement des donnees factuelles et a jour sur le web
-  Exemples de questions qui necessitent recherche active:
  - "Meteo a Rimouski" -> Cherche temperature actuelle, conditions, previsions meteo Rimouski
  - "Actualites du jour" -> Cherche les actualites recentes (pas de generalites)
  - "Qu'est-ce que X" -> Cherche definition recente et precise de X
  - "Comment fonctionne Y" -> Cherche explication detaillee et a jour de Y
-  REGLE D'OR: Si la question demande une information specifique (meteo, actualites, donnees), tu DOIS chercher cette information REELLE via Perplexity
-  FORMAT WEB/EMAIL: Reponse detaillee et complete, sources avec liens, structure claire (paragraphes, bullet points)
-  NE PAS: Repondre "Je peux t'aider avec..." ou "Que veux-tu savoir?" - reponds DIRECTEMENT a la question
-  TON: Naturel, accessible, engageant, mais TOUJOURS avec des informations REELLES
`) : '';

        return `${cfaIdentity}${userContext}${introContext}${emojiInstructions}
${isGeneralNonFinancial ? '' : ` DATE ACTUELLE: ${currentDate} (${currentDateTime})
 CRITIQUE: Toutes les donnees doivent refleter les informations les plus recentes. Si une donnee est datee (ex: "au 8 aout"), precise clairement que c'est une donnee ancienne et cherche des informations plus recentes si disponibles.

${productTypeContext}`}CONTEXTE DE LA CONVERSATION:
${conversationContext.map(c => `- ${c.role}: ${c.content}`).join('\n')}
${intentContext}
${isGeneralNonFinancial ? '' : `DONNEES DISPONIBLES DES OUTILS (resumees pour eviter surcharge):
${toolsData.map(t => {
            const reliabilityNote = t.is_reliable === false ? ' [ SOURCE PARTIELLE - Utiliser avec prudence]' : '';
            return `- ${t.tool}${reliabilityNote}: ${this._summarizeToolData(t.tool, t.data)}`;
        }).join('\n')}

`}QUESTION DE L'UTILISATEUR: ${userMessage}

${isGeneralNonFinancial ? generalInstructions : `INSTRUCTIONS CRITIQUES:
1.    ABSOLUMENT INTERDIT DE COPIER DU JSON/CODE DANS TA REPONSE   
   - Les donnees JSON ci-dessus sont pour TON ANALYSE INTERNE SEULEMENT
   - Tu dois TOUJOURS transformer ces donnees en TEXTE NATUREL EN FRANCAIS
   -  INTERDIT: Afficher "{\\"price\\": 245.67}" ou tout autre JSON/code
   -  INTERDIT: Afficher des listes JSON comme "[{...}, {...}]"
   -  INTERDIT: Copier-coller des structures de donnees brutes
   -  CORRECT: "Le prix actuel est de 245,67$, en hausse de 2,3%"
   -  CORRECT: "Voici les 3 dernieres actualites : 1) [titre], 2) [titre], 3) [titre]"

2.  TU ES UNE ANALYSTE FINANCIERE HUMAINE, PAS UN TERMINAL DE DONNEES
   - INTERPRETE et SYNTHETISE les chiffres de maniere conversationnelle
   - EXPLIQUE le contexte et la signification des donnees
   - RACONTE l'histoire derriere les chiffres, ne les liste pas
   - Utilise des PHRASES COMPLETES et des PARAGRAPHES lisibles

3.  REGLE ABSOLUE: REPONDRE UNIQUEMENT A LA DEMANDE DE L'UTILISATEUR 
   -  INTERDIT ABSOLU: Donner des informations sur une entreprise/ticker DIFFERENT de celui demande
   -  INTERDIT: Si l'utilisateur demande "Amaxx", NE PAS donner d'informations sur "RE" ou autre entreprise
   -  SI le ticker/entreprise demande n'est PAS dans les donnees des outils:
     -> TU DOIS utiliser Perplexity (qui est deja integre) pour chercher des informations sur CETTE entreprise specifique
     -> Perplexity a acces a des millions de sources et peut trouver des informations sur n'importe quelle entreprise
     -> Ne JAMAIS dire "aucune donnee disponible" sans avoir cherche via Perplexity
   -  FONDS COMMUNS ET ETFs:
     -> Si le ticker se termine par X, XX, IX (ex: AMAXX, VFIAX): c'est probablement un FONDS COMMUN
     -> Les fonds communs ne sont souvent PAS dans FMP/API standards
     -> TU DOIS chercher via Perplexity avec requete specifique: "mutual fund [ticker] performance expense ratio holdings"
     -> Adapte l'analyse: Focus sur expense ratio, performance vs benchmark, manager, Morningstar rating
     -> Sources utiles: Morningstar, Fundata, site web du fonds
   -  SI tu ne trouves vraiment aucune information apres recherche Perplexity:
     -> Dis clairement que tu n'as pas trouve d'informations sur cette entreprise specifique
     -> Suggere de verifier le nom/ticker exact
     -> NE DONNE PAS d'informations sur d'autres entreprises a la place

4.  TOUJOURS fournir une reponse COMPLETE et UTILE basee sur les donnees disponibles
5.  Utilise TOUTES les donnees fournies par les outils, MEME si marquees "[ SOURCE PARTIELLE]"
   - Les donnees partielles sont MEILLEURES que pas de donnees du tout
   - Analyse ce qui est disponible et fournis des insights bases sur ces donnees
6.  Si un outil a retourne des donnees pour PLUSIEURS tickers (news_by_ticker, fundamentals_by_ticker):
   - Analyse CHAQUE ticker individuellement
   - Fournis un resume pour CHAQUE compagnie mentionnee
   - N'ignore PAS les tickers - ils sont tous importants
7.  Transparence sur disponibilite des donnees:
   - Si donnees completes disponibles -> Analyser normalement
   - Si donnees partielles -> Mentionner "donnees partielles, analyse basee sur..."
   - Si AUCUNE donnee apres recherche Perplexity -> Dire clairement "Je n'ai pas trouve de donnees recentes sur [X]. Verifiez le ticker/nom exact."
   - Toujours etre transparent sur les limites
8.  Clarifications intelligentes (quand necessaire):
   - Si question ambigue (ex: "Apple" peut etre AAPL ou REIT) -> Demander clarification
   - Si ticker invalide/inexistant -> Suggerer corrections possibles
   - Si demande trop vague -> Proposer options specifiques
   - Pour questions claires -> Repondre directement
9.  IMPORTANT: Verifie les dates des donnees - signale si anciennes (> 1 mois) et mentionne la date actuelle: ${currentDate}
10. Cite tes sources (outils utilises) en fin de reponse
11. Ton: professionnel mais accessible, comme une vraie analyste financiere
${intentData ? '12. L\'intention detectee: ' + intentData.intent + ' - ' + (intentData.intent === 'comprehensive_analysis' ? 'fournis une analyse COMPLETE pour chaque ticker avec prix, fondamentaux, et actualites' : 'reponds en analysant tous les tickers pertinents') : ''}
`}

 GRAPHIQUES ET VISUALISATIONS - ANALYSE CONTEXTUALISEE:

** GRAPHIQUES DE RATIOS HISTORIQUES (RECOMMANDES):**
Quand tu analyses des ratios financiers (P/E, P/B, ROE, etc.), tu DOIS comparer avec l'historique et le secteur:

**Tags disponibles:**
- [RATIO_CHART:TICKER:PE] -> Evolution P/E Ratio (5 ans)
- [RATIO_CHART:TICKER:PB] -> Evolution Price-to-Book
- [RATIO_CHART:TICKER:ROE] -> Evolution Return on Equity
- [RATIO_CHART:TICKER:PROFIT_MARGIN] -> Evolution Marge beneficiaire
- [RATIO_CHART:TICKER:DEBT_EQUITY] -> Evolution Ratio d'endettement

** UTILISATION RECOMMANDEE:**
Lors d'une analyse complete, integre 1-2 graphiques de ratios pertinents:

Exemple CORRECT:
"Microsoft affiche un P/E de 32,5x, superieur a sa moyenne historique de 28x et au secteur (28x). Cette expansion de multiple reflete les attentes de croissance IA.

[RATIO_CHART:MSFT:PE]

La marge beneficiaire de 34% se maintient au-dessus de 30% depuis 5 ans, temoignant de la qualite du business model.

[RATIO_CHART:MSFT:PROFIT_MARGIN]"

** AUTRES GRAPHIQUES (Si demande explicitement):**
- [CHART:FINVIZ:TICKER] -> Graphique technique
- [CHART:TRADINGVIEW:EXCHANGE:TICKER] -> TradingView interactif
- [STOCKCARD:TICKER] -> Carte boursiere Perplexity-style

**Regles d'utilisation:**
 Analyses completes: Ajouter 1-2 graphiques ratios pertinents
 Comparer ratio actuel vs historique (graphique le montre)
 Mentionner contexte secteur dans analyse
 SMS: Pas de graphiques ratios (trop lourds), juste mention verbale
 Web/Email: Inclure graphiques ratios systematiquement

**Exemple d'integration (si demande):**
"Voici l'analyse de Apple (AAPL) :

Le titre se negocie actuellement a 245,67$ (+2,34%). P/E de 28,5x vs secteur 22,3x.

Voulez-vous que je vous montre le graphique TradingView pour une analyse technique?"

EXEMPLE DE BONNE REPONSE (si demande sur plusieurs tickers):
"Voici une analyse des initiatives IA recentes pour les compagnies de l'equipe:

**GOOGL (Alphabet/Google)**
- Initiative IA: [analyse basee sur les news recuperees]
- Source: [details de la news avec date]

**T (AT&T)**
- Initiative IA: [analyse basee sur les donnees disponibles]
...

[Continue pour TOUS les tickers dans les donnees]"

REPONSE:`;
    }

    /**
     * MODE DATA: JSON structure SEULEMENT
     */
    _buildDataPrompt(userMessage, toolsData, context) {
        const tickers = context.tickers || context.key_tickers || [];
        const fieldsRequested = context.fields_requested || [];

        return `Tu es Emma Data Extractor. Extrait et structure les donnees demandees en JSON STRICT.

DONNEES DISPONIBLES DES OUTILS:
${toolsData.map(t => `- ${t.tool}: ${JSON.stringify(t.data, null, 2)}`).join('\n')}

DEMANDE: ${userMessage}

TICKERS DEMANDES: ${tickers.join(', ') || 'tous disponibles'}
CHAMPS DEMANDES: ${fieldsRequested.join(', ') || 'tous pertinents'}

INSTRUCTIONS CRITIQUES:
1. RETOURNER UNIQUEMENT DU JSON VALIDE - PAS DE TEXTE AVANT OU APRES
2. Structure: { "TICKER": { "field": value, ... } }
3. Inclure SEULEMENT les champs demandes ou pertinents au contexte
4. Valeurs numeriques en NUMBER, pas en STRING
5. Si donnee manquante: utiliser null
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

REPONSE JSON:`;
    }

    /**
     * MODE BRIEFING: Analyse detaillee pour email
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

        return `Tu es Emma Financial Analyst. Redige une analyse approfondie MULTIMEDIA pour un briefing ${briefingType}.

 DATE ACTUELLE: ${currentDate} (${currentDateTime})
 CRITIQUE: Ce briefing doit refleter les donnees du ${currentDate}. Toutes les dates mentionnees doivent etre verifiees et corrigees si anciennes.

DONNEES DISPONIBLES DES OUTILS:
${toolsData.map(t => `- ${t.tool}: ${JSON.stringify(t.data, null, 2)}`).join('\n')}

CONTEXTE: ${userMessage}

INTENT DETECTE:
- Type: ${intentData?.intent || 'market_overview'}
- Importance: ${importanceLevel}/10
- Trending Topics: ${trendingTopics.join(', ') || 'N/A'}

TYPE DE BRIEFING: ${briefingType}

INSTRUCTIONS PRINCIPALES:
1. Redige une analyse DETAILLEE et PROFESSIONNELLE (1000-1500 mots recommande, adapte selon complexite)
2. Structure OBLIGATOIRE avec sections claires (##, ###)
3. Inclure des DONNEES CHIFFREES precises (prix, %, volumes, etc.)
4. Ton: Professionnel institutionnel
5. Focus sur l'ACTIONNABLE et les INSIGHTS
6. Format MARKDOWN avec emojis appropries (, , , etc.)
7. Si importance >= 8: commencer par une section BREAKING avec les evenements majeurs

 INSTRUCTIONS MULTIMEDIAS (CRITIQUE):

A) SOURCES WEB CREDIBLES - Cherche et inclus des liens vers:
   - Bloomberg: https://www.bloomberg.com/quote/[TICKER]
   - La Presse (Canada): https://www.lapresse.ca/affaires/
   - Financial Times: https://www.ft.com/markets
   - Reuters: https://www.reuters.com/markets/
   - Wall Street Journal: https://www.wsj.com/market-data
   - CNBC: https://www.cnbc.com/quotes/[TICKER]
   - BNN Bloomberg (Canada): https://www.bnnbloomberg.ca/

B) GRAPHIQUES ET CHARTS - Inclus SEULEMENT si explicitement demande:
    TradingView: [CHART:TRADINGVIEW:NASDAQ:TICKER]
    Finviz: [CHART:FINVIZ:TICKER]
    Heatmap sectorielle: [CHART:FINVIZ:SECTORS]

B-BIS) CARTES BOURSIERES ET RATIOS HISTORIQUES (NOUVEAU):
    Carte boursiere Perplexity-style: [STOCKCARD:TICKER]
      -> Affiche prix, variation, metriques cles (P/E, Market Cap, Volume, 52W Range), mini-chart
      -> Utilise pour presenter les performances d'une action de maniere professionnelle
      -> Exemple: "Voici la performance actuelle de MGA: [STOCKCARD:MGA]"

    Graphique de ratios historiques Macrotrends-style: [RATIO_CHART:TICKER:METRIC]
      -> Affiche l'evolution historique (5 ans) d'un ratio ou metrique fondamentale
      -> Metriques disponibles: PE, PB, PS, PROFIT_MARGIN, ROE, ROA, DEBT_EQUITY, CURRENT_RATIO, REVENUE_GROWTH, EARNINGS_GROWTH
      -> Exemple: "Evolution du P/E Ratio d'Apple: [RATIO_CHART:AAPL:PE]"
      -> Exemple: "Marge beneficiaire de Microsoft: [RATIO_CHART:MSFT:PROFIT_MARGIN]"

    QUAND UTILISER CES NOUVEAUX TAGS:
   - [STOCKCARD:TICKER]: Pour repondre a "Quelle est la performance de [TICKER]?" ou analyses d'actions individuelles
   - [RATIO_CHART:TICKER:METRIC]: Pour analyses fondamentales, comparaisons historiques, evaluations de valorisation

C) TABLEAUX DE DONNEES - Cree des tableaux HTML pour:
   - Performance tickers (Prix, Var %, Volume, MarketCap)
   - Resultats vs attentes (Actuel, Consensus, Surprise %)
   - Niveaux techniques (Support, Resistance, RSI, MACD)

   Format: [TABLE:NOM_TABLE|Col1,Col2,Col3|Val1,Val2,Val3|Val4,Val5,Val6]

D) IMAGES ET VISUELS:
   - Logos entreprises: [LOGO:TICKER]
   - Screenshots charts: [SCREENSHOT:TICKER:TIMEFRAME]
   - Timeline evenements: [TIMELINE:EVENTS]

E) LIENS SOURCES - Pour CHAQUE donnee/affirmation, fournis URL complete
   Format: [SOURCE:NOM_SOURCE|URL_COMPLETE]

STRUCTURE ATTENDUE:

##  [Titre Principal Contextualise]

**Resume Executif:** [2-3 phrases capturant l'essentiel de l'analyse]

[TABLE:PERFORMANCE_INDICES|Indice,Valeur,Variation %|S&P 500,5825.23,+0.45|NASDAQ,18456.32,+0.82]

###  Performance du Jour
[Analyse detaillee des mouvements de prix, volumes, catalyseurs du jour]

**Indices majeurs:**
- S&P 500: [donnees] ([SOURCE:Bloomberg|https://www.bloomberg.com/quote/SPX:IND])
- NASDAQ: [donnees] ([SOURCE:CNBC|https://www.cnbc.com/quotes/.IXIC])
- DOW: [donnees]

**Actions cles:**
[TABLE:TOP_MOVERS|Ticker,Prix,Var %,Volume|AAPL,247.25,-0.84%,58.2M|TSLA,245.67,+2.34%,125.3M]

###  Analyse Fondamentale
[Metriques cles avec tableaux comparatifs]

[TABLE:FUNDAMENTALS|Ticker,PE,EPS,Revenue Growth|AAPL,32.4,7.58,+8.5%|MSFT,38.1,11.24,+12.3%]

[SOURCE:Financial Times|https://www.ft.com/content/...]

###  Analyse Technique
[Indicateurs techniques et niveaux cles]

[CHART:TRADINGVIEW:NASDAQ:AAPL]

[TABLE:TECHNICAL_LEVELS|Ticker,RSI,MACD,Support,Resistance|AAPL,58.2,Positif,240,255]

###  Actualites et Catalyseurs
[News importantes avec impact marche]

**Principales actualites:**
1. [Titre] ([SOURCE:La Presse|https://www.lapresse.ca/affaires/...])
2. [Titre] ([SOURCE:Reuters|https://www.reuters.com/markets/...])
3. [Titre] ([SOURCE:BNN Bloomberg|https://www.bnnbloomberg.ca/...])

[TIMELINE:EVENTS]

###  Recommandations et Points de Surveillance
[Insights actionnables avec niveaux precis]

[TABLE:RECOMMENDATIONS|Action,Entry,Stop Loss,Target,Ratio R/R|AAPL,245-248,240,265,1:3.4]

---
**Sources Completes:**
- Donnees de marche: Polygon.io, FMP, Finnhub
- Actualites: [SOURCE:Bloomberg|URL], [SOURCE:Reuters|URL], [SOURCE:La Presse|URL]
- Charts: TradingView, Finviz
- Analyses: Emma Agent + Perplexity AI

REPONSE MARKDOWN ENRICHIE:`;
    }

    /**
     * MODE TICKER_NOTE: Note professionnelle complete pour un ticker specifique
     * Format email-ready avec graphiques, tableaux, carte boursiere et sources
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

        return `Tu es Emma Financial Analyst. Genere une note professionnelle complete pour le ticker **${ticker}** selon les instructions ci-dessous.

 DATE ACTUELLE: ${currentDate} (${currentDateTime})
 CRITIQUE: Utilise UNIQUEMENT des donnees reelles les plus recentes du ${currentDate}. JAMAIS de donnees simulees.

DONNEES DISPONIBLES DES OUTILS:
${toolsData.map(t => `- ${t.tool}: ${JSON.stringify(t.data, null, 2)}`).join('\n')}

CONTEXTE: ${userMessage}

TICKER: **${ticker}**


INSTRUCTIONS DETAILLEES POUR LA NOTE PROFESSIONNELLE


##  STRUCTURE OBLIGATOIRE

### 1. EN-TETE
**[${ticker}] - Analyse Professionnelle**
Date: ${currentDate}

### 2. SYNTHESE EXECUTIVE
Redige une synthese structuree et concise en francais, adaptee a un email professionnel.
- Utilise des bullet points pour les points cles
- Mets en evidence les elements importants
- Ton professionnel mais accessible

### 3. COMPARAISON AVEC CONSENSUS ANALYSTES
 CRITIQUE: Compare SYSTEMATIQUEMENT chaque chiffre-cle avec le consensus:
- Resultat net (vs. consensus)
- BPA - Benefice Par Action (vs. consensus)
- Chiffre d'affaires (vs. consensus)
- Indique EXPLICITEMENT les ecarts en % et en valeur absolue

### 4. TABLEAU RECAPITULATIF OBLIGATOIRE
Cree un tableau avec cette structure:

[TABLE:RESULTATS_VS_CONSENSUS|Metrique,Resultat Actuel,Consensus,Ecart,Source|
Resultat Net,[valeur],[consensus],[ecart %],[source]|
BPA,[valeur],[consensus],[ecart %],[source]|
Chiffre d'affaires,[valeur],[consensus],[ecart %],[source]]

### 5. CARTE BOURSIERE PERPLEXITY-STYLE
Integre la carte boursiere pour ce ticker:
[STOCKCARD:${ticker}]

Cette carte affiche automatiquement:
- Prix en temps reel
- Variation % du jour
- Metriques cles (P/E, Market Cap, Volume)
- 52-Week Range
- Mini-graphique d'evolution

### 6. GRAPHIQUES DE RATIOS HISTORIQUES (5 ANS)
Ajoute des graphiques d'evolution des ratios cles:
[RATIO_CHART:${ticker}:PE] -> Evolution du P/E Ratio
[RATIO_CHART:${ticker}:PROFIT_MARGIN] -> Marge beneficiaire
[RATIO_CHART:${ticker}:ROE] -> Return on Equity

Autres ratios disponibles si pertinents:
- PB (Price-to-Book)
- PS (Price-to-Sales)
- ROA (Return on Assets)
- DEBT_EQUITY (Ratio dette/equite)
- CURRENT_RATIO (Ratio de liquidite)
- REVENUE_GROWTH (Croissance revenus)
- EARNINGS_GROWTH (Croissance benefices)

### 7. GRAPHIQUE BOURSIER DU MOIS
Genere un graphique technique detaille:
### 8. GRAPHIQUE CHIFFRE (EVOLUTION TRIMESTRIELLE - Optionnel)
Si l'utilisateur demande un graphique, utilise:
[CHART:TRADINGVIEW:NASDAQ:${ticker}]

Ou cree un tableau d'evolution trimestrielle:
[TABLE:EVOLUTION_TRIMESTRIELLE|Trimestre,Resultat Net,CA,BPA|
Q1 2024,[valeur],[valeur],[valeur]|
Q2 2024,[valeur],[valeur],[valeur]|
Q3 2024,[valeur],[valeur],[valeur]|
Q4 2024,[valeur],[valeur],[valeur]]

### 9. ACTUALITES ET CATALYSEURS
Liste les actualites recentes pertinentes avec dates et sources:

**Actualites recentes:**
1. [Titre de l'actualite] - [Date] ([SOURCE:Nom|URL])
2. [Titre de l'actualite] - [Date] ([SOURCE:Nom|URL])
3. [Titre de l'actualite] - [Date] ([SOURCE:Nom|URL])

### 10. SIGNATURE ET SOURCES
Termine par:

---
** Analyse generee par Emma IATM**
Propulsee par JSL AI 

**Sources consultees:**
- Donnees de marche: [SOURCE:FMP|URL], [SOURCE:Polygon|URL]
- Actualites: [SOURCE:Bloomberg|URL], [SOURCE:Reuters|URL]
- Analyses: [SOURCE:Perplexity|URL]
- Consensus analystes: [SOURCE:Source|URL]
- Date de generation: ${currentDate}


REGLES CRITIQUES A RESPECTER


 OBLIGATIONS:
1. Utiliser UNIQUEMENT des donnees reelles les plus recentes
2. Comparer TOUS les chiffres-cles avec le consensus des analystes
3. Indiquer EXPLICITEMENT les sources pour chaque donnee
4. Inclure AU MINIMUM 2 graphiques (carte boursiere + 1 ratio historique)
5. Format pret a l'export email (HTML responsive ou Markdown propre)
6. Tableaux structures avec format [TABLE:...]
7. Tous les montants en format professionnel (ex: 2,45M$, 1,23B$)

 INTERDICTIONS:
1. JAMAIS de donnees simulees ou inventees
2. JAMAIS de "donnees non disponibles" sans avoir verifie toutes les sources
3. JAMAIS omettre les sources
4. JAMAIS de donnees anciennes (> 1 mois) sans mentionner leur date
5. JAMAIS de format incompatible email (JavaScript, CSS externe)

 TAGS MULTIMEDIAS DISPONIBLES:
- [STOCKCARD:TICKER] -> Carte boursiere complete
- [RATIO_CHART:TICKER:METRIC] -> Graphique ratio historique 5 ans
- [CHART:FINVIZ:TICKER] -> Graphique technique Finviz
- [CHART:TRADINGVIEW:EXCHANGE:TICKER] -> Graphique TradingView
- [TABLE:NOM|Col1,Col2|Val1,Val2] -> Tableau structure
- [LOGO:TICKER] -> Logo entreprise
- [SOURCE:NOM|URL] -> Citation de source

 FORMAT EMAIL-READY:
- Utiliser Markdown standard (##, ###, **bold**, *italic*)
- Tableaux en format [TABLE:...] (conversion automatique en HTML)
- Graphiques via tags (affichage automatique)
- Pas de code HTML complexe (gere automatiquement)
- Responsive design automatique

REPONSE (NOTE PROFESSIONNELLE POUR ${ticker}):`;
    }

    /**
     * Appel a l'API Perplexity (avec recency filter)
     */
    /**
     *  Detecte la complexite d'une question pour ajuster automatiquement les tokens
     * Simple: 800 tokens, Moyenne: 2000-4000, Complexe: 6000-8000
     */
    _detectComplexity(userMessage, intentData, toolResults) {
        let complexityScore = 0;

        // 1. Nombre de tickers mentionnes (multi-ticker = plus complexe)
        const tickers = intentData?.tickers || [];
        if (tickers.length >= 5) complexityScore += 3;
        else if (tickers.length >= 3) complexityScore += 2;
        else if (tickers.length >= 2) complexityScore += 1;

        // 2. Mots-cles de complexite dans la question
        const complexKeywords = [
            'analyse approfondie', 'detaillee', 'complete', 'comparaison', 'compare',
            'fondamentaux', 'technique', 'actualites', 'earnings', 'rapports',
            'tous', 'plusieurs', 'et', 'ainsi que', 'egalement',
            'pourquoi', 'comment', 'expliquer', 'analyser'
        ];
        const matchedKeywords = complexKeywords.filter(kw =>
            userMessage.toLowerCase().includes(kw)
        );
        complexityScore += matchedKeywords.length;

        // 3. Type d'intent (certains intents necessitent plus de details)
        const complexIntents = [
            'comprehensive_analysis', 'comparative_analysis',
            'earnings', 'recommendation', 'fundamental_analysis'
        ];
        if (intentData && complexIntents.includes(intentData.intent)) {
            complexityScore += 2;
        }

        // 4. Nombre d'outils utilises (plus d'outils = plus de donnees a synthetiser)
        const toolCount = toolResults?.length || 0;
        if (toolCount >= 5) complexityScore += 2;
        else if (toolCount >= 3) complexityScore += 1;

        // 5. Longueur de la question (questions longues = reponse detaillee attendue)
        if (userMessage.length > 200) complexityScore += 2;
        else if (userMessage.length > 100) complexityScore += 1;

        // Determiner le niveau de complexite et les tokens appropries
        //  TOKENS AUGMENTES ENCORE PLUS pour analyses LONGUES et COMPLETES (Bug 5 fix)
        // User feedback: "jaimais beaucoup avoir une longue analyse et maintenant c'est tellement court"
        if (complexityScore <= 2) {
            return { level: 'simple', tokens: 8000, description: 'Question simple - reponse complete ultra-detaillee (2000-3000 mots)' };
        } else if (complexityScore <= 5) {
            return { level: 'moyenne', tokens: 12000, description: 'Question moderement complexe - analyse approfondie (3000-4000 mots)' };
        } else if (complexityScore <= 8) {
            return { level: 'complexe', tokens: 24000, description: 'Analyse experte multi-dimensionnelle (6000-8000 mots)' };
        } else {
            return { level: 'tres_complexe', tokens: 32000, description: 'Analyse exhaustive totale (10000+ mots)' };
        }
    }

    /**
     * Extrait l'entite (ticker/entreprise) demandee par l'utilisateur
     */
    _extractRequestedEntity(userMessage, intentData) {
        // 1. Verifier les tickers dans intentData
        if (intentData?.tickers && intentData.tickers.length > 0) {
            return intentData.tickers[0];
        }

        // 2. Extraire tickers du message (mode strict pour eviter faux positifs)
        const tickers = TickerExtractor.extract(userMessage, {
            includeCompanyNames: true,
            filterCommonWords: true,
            strictContext: false // Pas trop strict pour garder flexibilite
        });
        if (tickers.length > 0) {
            return tickers[0];
        }

        // 3. Chercher des noms d'entreprises dans le message (mots capitalises qui ne sont pas des mots communs)
        const words = userMessage.split(/\s+/);
        for (const word of words) {
            const cleanWord = word.replace(/[.,!?;:()]/g, '').trim();
            if (cleanWord.length >= 3 && /^[A-Z][a-z]+/.test(cleanWord)) {
                // Mot capitalise qui pourrait etre un nom d'entreprise
                const lowerWord = cleanWord.toLowerCase();
                if (!TickerExtractor.COMMON_WORDS.includes(cleanWord.toUpperCase())) {
                    return cleanWord;
                }
            }
        }

        return null;
    }

    /**
     * Verifie si une entite est presente dans les resultats des outils
     */
    _checkIfEntityInToolResults(entity, toolResults) {
        if (!entity || !toolResults || toolResults.length === 0) {
            return false;
        }

        const entityUpper = entity.toUpperCase();

        // Verifier dans chaque resultat d'outil
        for (const result of toolResults) {
            if (!result.data) continue;

            const dataStr = JSON.stringify(result.data).toUpperCase();

            // Chercher le ticker/entite dans les donnees
            if (dataStr.includes(entityUpper)) {
                return true;
            }

            // Verifier aussi les cles de donnees (ex: "AAPL": {...})
            if (result.data[entityUpper] || result.data[entity]) {
                return true;
            }
        }

        return false;
    }

    /**
     * Extrait les citations d'une reponse Perplexity
     */
    _extractCitations(content) {
        const citations = [];

        // Pattern pour URLs dans le texte
        const urlRegex = /https?:\/\/[^\s\)]+/g;
        const urls = content.match(urlRegex) || [];

        urls.forEach(url => {
            citations.push({
                url: url,
                title: url.split('/').pop() || url
            });
        });

        return citations;
    }

    async _call_perplexity(prompt, outputMode = 'chat', recency = 'month', userMessage = '', intentData = null, toolResults = [], context = {}, modelConfig = null) {
        //  Variables pour gestion de timeout (declarees avant try pour etre accessibles dans catch)
        let timeout = null;
        let timeoutDuration = 60000;  // Valeur par defaut

        try {
            //  REPONSES ULTRA-LONGUES PAR DEFAUT (MAXIMUM DETAIL)
            // REGLE: Plus c'est long, mieux c'est!
            let maxTokens = modelConfig?.max_tokens || 8000;  //  DEFAULT ULTRA-AUGMENTE: 8000 tokens (~5600 mots = REPONSES TRES LONGUES)
            let complexityInfo = null;

            //  SMS: Limite strictement pour respecter la regle des 4 SMS (max 6000 chars)
            if (context.user_channel === 'sms') {
                maxTokens = 3000;  //  SMS: 3000 tokens (~2200 mots) - large pour 6000 chars mais evite timeout
                console.log(' SMS mode: 3000 tokens (calcule pour max 4 SMS/6000 chars)');
            } else if (outputMode === 'briefing') {
                maxTokens = 20000;  //  Briefing MAXIMUM (AUGMENTE 10000 -> 20000)
                console.log(' Briefing mode: 20000 tokens (MAXIMUM EXHAUSTIF)');
            } else if (outputMode === 'ticker_note') {
                maxTokens = 15000;  //  Note professionnelle MAXIMUM (AUGMENTE 10000 -> 15000)
                console.log(' Ticker note mode: 15000 tokens (note professionnelle MAXIMUM)');
            } else if (outputMode === 'data') {
                maxTokens = 500;  // JSON structure: court
            } else if (outputMode === 'chat') {
                //  Detection automatique de complexite pour ajustement intelligent
                complexityInfo = this._detectComplexity(userMessage, intentData, toolResults);

                //  FIX: Forcer 20000 tokens pour comprehensive_analysis (12 sections obligatoires) sur WEB
                const isComprehensiveAnalysis = intentData?.intent === 'comprehensive_analysis';
                if (isComprehensiveAnalysis && context.user_channel !== 'sms') {
                    maxTokens = 20000;  //  FORCE: 20000 tokens pour analyses completes (12 sections)
                    console.log(` Comprehensive Analysis detecte -> FORCE a 20000 tokens (12 sections obligatoires)`);
                } else if (isComprehensiveAnalysis && context.user_channel === 'sms') {
                    maxTokens = 3000; // Limite SMS respectee
                } else {
                    //  MULTIPLIER par 3 les tokens pour reponses ULTRA-LONGUES (uniquement pour WEB)
                    const multiplier = context.user_channel === 'sms' ? 1 : 3;
                    maxTokens = complexityInfo.tokens * multiplier;
                    console.log(` Complexite detectee: ${complexityInfo.level} -> ${maxTokens} tokens (Channel: ${context.user_channel || 'web'}) (${complexityInfo.description})`);
                }
            }

            //  NOUVEAU: Utiliser prompt specifique par intent si disponible
            let systemPrompt = null;

            //  INSTRUCTION DE LONGUEUR CRITIQUE POUR WEB 
            if (context.user_channel !== 'sms' && outputMode === 'chat') {
                systemPrompt = ` REGLE D'OR: REPONSE ULTRA-LONGUE ET EXHAUSTIVE OBLIGATOIRE 
- L'utilisateur a demande une analyse "ULTRA DETAILLEE" (Niveau Expert CFA).
- Ta reponse doit etre EXTREMEMENT LONGUE (vise 3000-5000 mots si possible).
- Developpe chaque point avec AU MOINS 2-3 paragraphes complets.
- Ne fais JAMAIS de resumes courts ou de listes a puces simples sans explication profonde.
- Analyse chaque donnee de maniere narrative et comparative.
- Si plusieurs tickers sont mentionnes, l'analyse pour CHAQUE ticker doit etre aussi longue qu'un rapport complet.
- Utilise des titres ## et du gras ** pour une structure claire.
- RECHERCHE ET CITE un maximum de sources recentes via Perplexity.
- TON: Institutionnel, profond, analytique.

`;
            }

            // Verifier si un prompt custom existe pour cet intent
            if (intentData && intentData.intent) {
                // Utiliser le prompt du fichier comme fallback si non trouve en DB
                const defaultPrompt = INTENT_PROMPTS[intentData.intent] || null;
                const customPrompt = await configManager.get('prompts', `intent_${intentData.intent}`, defaultPrompt);
                
                if (customPrompt) {
                    systemPrompt = (systemPrompt || '') + customPrompt;

                    //  Pour earnings, injecter la date actuelle dans le prompt
                    if (intentData.intent === 'earnings') {
                        const currentDate = new Date().toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });
                        systemPrompt = systemPrompt.replace('(date actuelle)', `(${currentDate})`);
                    }

                    //  ADAPTATION FORMAT SELON CANAL pour comprehensive_analysis
                    if (intentData.intent === 'comprehensive_analysis') {
                        const channel = context.user_channel || 'web';

                        if (channel === 'sms') {
                            //  FORMAT SMS: Concis, max 3500 chars, pas de markdown
                            systemPrompt += `

 FORMAT SMS OBLIGATOIRE:
- MAX 3500 caracteres total (environ 6-8 SMS)
- Paragraphes TRES courts (2-3 lignes max)
- PAS de markdown (pas de ** ou ##)
- Utilise emojis pour separer sections
- Chiffres concis: "P/E: 32x (5Y: 28x, sect: 28x)"
- Chaque section = 2-4 lignes maximum
- Style telegraphique, pas de phrases longues

EXEMPLE FORMAT SMS:
" MSFT - Microsoft
Prix: 478$ | Cap: 2.8T$ | YTD: -13%

 Valorisation
P/E: 34x (5Y: 32x, sect: 28x)
P/FCF: 28x | EV/EBITDA: 22x

 Fondamentaux
ROE: 35% (5Y: 33%) | Marge: 36%
D/E: 0.4 (tres sain)

 Croissance
Rev CAGR: +12% | EPS: +15%

 Moat: Large (cloud, Office)

 DCF: 520$ -> marge secu 9%

 Q3: Beat +3% rev, +5% EPS

 Macro: Fed neutre

 Div: 0.8% | Payout 25%

 Risques: Antitrust, AI costs

 Catalysts: Copilot, Azure growth

 CONSERVER 478$
Cible: 520$ (+9%)

 Questions:
1. Impact Copilot sur marges?
2. Concurrence cloud?"`;
                            console.log(` comprehensive_analysis: Format SMS applique (max 3500 chars)`);
                        } else {
                            //  FORMAT WEB/EMAIL: Detaille, markdown, 1500+ mots
                            systemPrompt += `

 FORMAT WEB/EMAIL OBLIGATOIRE:
- MINIMUM 3000 mots (analyse detaillee exhaustive - reponses TRES LONGUES encouragees)
- Markdown active (** pour gras, ## pour titres)
- Chaque section = 1-2 paragraphes complets
- Explications narratives professionnelles
- Comparaisons historiques et sectorielles explicites
- Style rapport CFA institutionnel

 REGLE ABSOLUE - 12 SECTIONS OBLIGATOIRES DANS L'ORDRE :
Tu DOIS inclure TOUTES les 12 sections suivantes DANS L'ORDRE. AUCUNE EXCEPTION. Si une section manque, la reponse est INCOMPLETE.

1.  VUE D'ENSEMBLE (OBLIGATOIRE)
2.  VALORISATION (OBLIGATOIRE)
3.  FONDAMENTAUX (OBLIGATOIRE)
4.  CROISSANCE (OBLIGATOIRE)
5.  MOAT ANALYSIS (OBLIGATOIRE)
6.  VALEUR INTRINSEQUE (OBLIGATOIRE)
7.  RESULTATS RECENTS (OBLIGATOIRE)
8.  CONTEXTE MACRO (OBLIGATOIRE)
9.  DIVIDENDE (OBLIGATOIRE - ou "N/A" si non applicable)
10.  RISQUES (OBLIGATOIRE)
11.  NEWS + CATALYSTS (OBLIGATOIRE)
12.  RECOMMANDATION + QUESTIONS (OBLIGATOIRE)

 VERIFICATION AVANT D'ENVOYER:
 Section 1 presente?  Section 2 presente?  Section 3 presente?  Section 4 presente?
 Section 5 presente?  Section 6 presente?  Section 7 presente?  Section 8 presente?
 Section 9 presente?  Section 10 presente?  Section 11 presente?  Section 12 presente?

Si UNE SEULE section manque = REPONSE INCOMPLETE = CONTINUER JUSQU'A CE QUE TOUTES LES 12 SECTIONS SOIENT PRESENTES.`;
                            console.log(` comprehensive_analysis: Format Web/Email applique (2000+ mots, 12 sections obligatoires)`);
                        }
                    }

                    console.log(` Using custom prompt for intent: ${intentData.intent}, channel: ${context.user_channel || 'web'}`);
                }
            }

            //  DETECTION PRIORITAIRE: Questions sur fonds/quartiles/rendements
            //  CRITIQUE: Detecter AVANT l'extraction de tickers pour eviter faux positifs (TU, ME, AU, etc.)
            const userMessageLower = (userMessage || '').toLowerCase();
            const isFundQuestion = userMessageLower.includes('fonds') ||
                userMessageLower.includes('quartile') ||
                userMessageLower.includes('quartiles') ||
                userMessageLower.includes('rendement') ||
                userMessageLower.includes('rendements') ||
                userMessageLower.includes('equilibre') ||
                userMessageLower.includes('equilibre') ||
                userMessageLower.includes('mutual fund') ||
                userMessageLower.includes('fonds mutuels') ||
                userMessageLower.includes('fonds d\'investissement') ||
                userMessageLower.includes('performance des fonds') ||
                userMessageLower.includes('categorie de fonds') ||
                userMessageLower.includes('categorie de fonds');

            //  Si question sur fonds -> Utiliser directement la question originale sans extraction d'entite
            if (isFundQuestion && outputMode === 'chat') {
                console.log(` Question sur fonds detectee -> Recherche Perplexity directe (sans extraction tickers)`);

                // Construire un prompt specialise pour les questions sur fonds
                const searchPrompt = `${userMessage}

Fournis une analyse financiere complete et structuree selon ce format:

1. RESUME EN TETE: Commence par un resume concis (2-3 phrases) qui repond directement a la question avec les chiffres cles.

2. SECTIONS DETAILLEES avec exemples concrets:
- Pour chaque categorie/quartile, donne des exemples de fonds specifiques avec leurs codes/tickers
- Inclus les rendements exacts (1 an, 3 ans, 5 ans, 10 ans si disponibles)
- Mentionne le quartile Morningstar de chaque fonds
- Compare les performances entre differents fonds

3. TABLEAU COMPARATIF SYNTHETIQUE:
Cree un tableau clair avec colonnes: Fonds | Rendement 5 ans (%) | Quartile Morningstar | Notes
Inclus les principaux fonds de la categorie demandee.

4. INFORMATIONS CONTEXTUELLES:
- Explications sur la methodologie de classement (quartiles, etoiles Morningstar)
- Utilite des quartiles pour la selection de fonds
- Variations selon strategie, frais, gestion active/passive

5. SOURCES COMPLETES:
Cite toutes tes sources avec liens vers documents officiels (Morningstar, Fundata, sites des manufacturiers)

Structure ta reponse de maniere professionnelle et facile a lire. Sois exhaustif, precis et cite toutes tes sources avec numerotation [1][2][3] etc.`;

                // Appel Perplexity direct avec prompt specialise
                const searchRequestBody = {
                    model: 'sonar-pro',
                    messages: [
                        {
                            role: 'system',
                            content: `Tu es Emma, analyste financiere CFA experte en fonds d'investissement.

 REGLE ABSOLUE: ZERO MENTION DE LIMITATIONS
 STRICTEMENT INTERDIT: "Je dois vous informer...", "Les resultats ne contiennent pas...", "Je n'ai pas acces...", "donnees limitees...", etc.
 OBLIGATOIRE: Commence IMMEDIATEMENT par l'analyse avec TOUTES les donnees disponibles, meme partielles.
 MAXIMISE la valeur de chaque donnee disponible - analyse experte basee sur ce qui EST disponible.
 Fournis des analyses completes et detaillees avec sources officielles (Morningstar, Fundata, etc.).
 Si donnees partielles -> Analyse professionnelle complete basee sur ces donnees + contexte sectoriel.`
                        },
                        {
                            role: 'user',
                            content: searchPrompt
                        }
                    ],
                    max_tokens: maxTokens,
                    temperature: 0.1,
                    search_recency_filter: recency
                };

                const searchResponse = await fetch('https://api.perplexity.ai/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${perplexityApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(searchRequestBody),
                    signal: AbortSignal.timeout(timeoutDuration)
                });

                if (searchResponse.ok) {
                    let searchData; try { searchData = JSON.parse(await searchResponse.text()); } catch(e) { throw new Error('Search API Invalid JSON'); }
                    const searchContent = searchData.choices?.[0]?.message?.content || '';
                    const searchCitations = searchData.citations || this._extractCitations(searchContent);

                    console.log(` Recherche Perplexity reussie pour question sur fonds (${searchContent.length} caracteres)`);

                    return {
                        content: searchContent,
                        citations: searchCitations,
                        model: 'perplexity',
                        recency: recency,
                        searched_entity: 'fonds_investissement'
                    };
                } else {
                    const errorText = await searchResponse.text().catch(() => 'Unknown error');
                    console.warn(` Recherche Perplexity echouee pour question sur fonds (${searchResponse.status}): ${errorText.substring(0, 200)}`);
                    // Continuer avec le prompt normal
                }
            }

            //  DETECTION: Si l'utilisateur demande une entreprise/ticker qui n'est PAS dans les donnees des outils
            // -> Forcer une recherche Perplexity specifique pour cette entreprise
            const requestedEntity = this._extractRequestedEntity(userMessage, intentData);
            const hasDataForRequestedEntity = this._checkIfEntityInToolResults(requestedEntity, toolResults);

            // Si l'utilisateur demande une entreprise specifique mais qu'on n'a pas de donnees pour elle
            if (requestedEntity && !hasDataForRequestedEntity && outputMode === 'chat') {
                console.log(` Entite demandee "${requestedEntity}" non trouvee dans les donnees des outils -> Forcer recherche Perplexity`);

                // Construire un prompt naturel et ouvert pour Perplexity (comme une requete directe)
                // Note: Les questions sur fonds sont deja gerees en priorite ci-dessus
                const searchPrompt = `${userMessage}

Fournis une analyse financiere complete et detaillee incluant:
- Nature de l'entreprise/fonds (type, secteur, description)
- Ticker exact et bourse de cotation
- Prix actuel et performance (1 an, 3 ans, 5 ans, 10 ans si disponible)
- Ratios financiers pertinents (P/E, rendement, frais, etc.)
- Composition du portefeuille si applicable
- Profil de risque
- Actualites recentes
- Recommandations d'analyse

Sois exhaustif et cite tes sources.`;

                // Utiliser ce prompt specialise au lieu du prompt normal
                // Prompt minimal pour laisser Perplexity faire son travail naturellement
                const searchRequestBody = {
                    model: modelConfig?.model_id || 'sonar-pro',
                    messages: [
                        {
                            role: 'system',
                            content: `Tu es Emma, analyste financiere CFA experte.

 REGLE ABSOLUE: ZERO MENTION DE LIMITATIONS
 STRICTEMENT INTERDIT: "Je dois vous informer...", "Les resultats ne contiennent pas...", "Je n'ai pas acces...", "donnees limitees...", etc.
 OBLIGATOIRE: Commence IMMEDIATEMENT par l'analyse avec TOUTES les donnees disponibles, meme partielles.
 MAXIMISE la valeur de chaque donnee disponible - analyse experte basee sur ce qui EST disponible.
 Fournis des analyses completes et detaillees avec sources.
 Si donnees partielles -> Analyse professionnelle complete basee sur ces donnees + contexte sectoriel.`
                        },
                        {
                            role: 'user',
                            content: searchPrompt
                        }
                    ],
                    max_tokens: maxTokens,
                    temperature: 0.1,
                    search_recency_filter: recency
                    // Pas de search_domain_filter pour laisser Perplexity chercher dans toutes ses sources
                };

                // Appel Perplexity avec prompt specialise
                const searchResponse = await fetch('https://api.perplexity.ai/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${perplexityApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(searchRequestBody),
                    signal: AbortSignal.timeout(timeoutDuration)
                });

                if (searchResponse.ok) {
                    let searchData; try { searchData = JSON.parse(await searchResponse.text()); } catch(e) { throw new Error('Search API Invalid JSON'); }
                    const searchContent = searchData.choices?.[0]?.message?.content || '';
                    const searchCitations = searchData.citations || this._extractCitations(searchContent);

                    console.log(` Recherche Perplexity reussie pour "${requestedEntity}" (${searchContent.length} caracteres)`);

                    // Post-traitement: s'assurer que la reponse concerne bien l'entite demandee
                    const contentUpper = searchContent.toUpperCase();
                    const entityUpper = requestedEntity.toUpperCase();

                    // Si la reponse ne mentionne pas l'entite demandee, ajouter un avertissement
                    if (!contentUpper.includes(entityUpper) && !contentUpper.includes(entityUpper.replace('X', 'XX'))) {
                        console.warn(` La reponse Perplexity ne mentionne pas clairement "${requestedEntity}"`);
                    }

                    return {
                        content: searchContent,
                        citations: searchCitations,
                        model: 'perplexity',
                        recency: recency,
                        searched_entity: requestedEntity
                    };
                } else {
                    const errorText = await searchResponse.text().catch(() => 'Unknown error');
                    console.warn(` Recherche Perplexity echouee pour "${requestedEntity}" (${searchResponse.status}): ${errorText.substring(0, 200)}`);
                    // Continuer avec le prompt normal
                }
            }

            // Fetch default system prompt dynamically
            const defaultPerplexityPrompt = await configManager.get('prompts', 'perplexity_system_prompt', PERPLEXITY_SYSTEM_PROMPT);

            const requestBody = {
                model: modelConfig?.model_id || 'sonar-pro',  // Modele premium Perplexity (Jan 2025) - Meilleure qualite, plus de citations, recherche approfondie
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt || (outputMode === 'data'
                            ? 'Tu es Emma Data Extractor. Retourne UNIQUEMENT du JSON valide, pas de texte explicatif.'
                            : context.user_channel === 'sms'
                                ? `Tu es Emma, analyste financiere CFA inspiree par Warren Buffett, Peter Lynch et Benjamin Graham.

 FORMAT SMS:
- Paragraphes courts (2-3 lignes)
- PAS d'asterisques ** ou markdown
- Chiffres: "P/E: 32x (vs 5 ans: 28x, secteur: 28x)"
- Sections: " Valorisation:", " Macro:", " Questions:"

 CONTENU REQUIS (12 sections):
1. Vue d'ensemble + prix
2. Valorisation + ratios historiques (vs 5 ans, vs secteur)
3. Performance YTD
4. Contexte macro (Fed, inflation si pertinent)
5. Fondamentaux (ROE, marges vs historique)
6. Moat analysis (avantages competitifs)
7. Valeur intrinseque (DCF, marge securite)
8. Resultats recents
9. Catalysts
10. Risques principaux
11. Recommandation value
12. 2-3 questions suggerees

 RATIOS: Toujours vs historique + secteur
 MACRO: Fed, inflation (si impact ticker)
 MOAT: Type + durabilite
 DCF: Valeur vs prix, marge securite
 QUESTIONS: 2-3 pertinentes, pas redondantes

EXEMPLE:
" MSFT - Analyse

Prix: 380$ (+1,2%)
Cap: 2,85T$

 Valorisation
P/E: 32x (5 ans: 28x, secteur: 28x)
-> +14% au-dessus historique

 Macro
Fed 5,25% (high 22 ans)
Inflation 3,2% -> pression valorisations

 Fondamentaux
ROE: 31% (5 ans: 28%)
Marges: 36% (secteur: 24%)

 Moat
Network effects Office (400M users)
Switching costs eleves
Durabilite: 20+ ans

 Valeur
DCF: 425$ vs prix 380$
Marge securite: 11% (ideal: 30%)

 Risques
Antitrust US/EU
Concurrence cloud

 Reco
HOLD 380$
ACHETER < 340$ (marge 25%+)

 Questions:
1. Comparaison vs GOOGL/AMZN?
2. Impact recession 2024?
3. Strategie DCA?"

 PAS d'asterisques **gras**`
                                : defaultPerplexityPrompt)
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: maxTokens,
                temperature: outputMode === 'briefing' ? 0.5 : 0.7  // Plus deterministe pour briefings
            };

            // Ajouter recency filter si disponible (seulement les valeurs valides)
            const validRecencyValues = ['hour', 'day', 'week', 'month', 'year'];
            if (recency && validRecencyValues.includes(recency)) {
                requestBody.search_recency_filter = recency;
                console.log(` Using recency filter: ${recency}`);
            } else if (recency) {
                console.warn(` Invalid recency value "${recency}", omitting recency filter`);
            }

            // Verifier que la cle API est definie (avec fallback)
            const perplexityApiKey = process.env.PERPLEXITY_API_KEY || process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;
            if (!perplexityApiKey) {
                console.error('\n' + '='.repeat(60));
                console.error(' PERPLEXITY_API_KEY NOT CONFIGURED');
                console.error('='.repeat(60));
                console.error(' La cle API Perplexity n\'est pas configuree dans les variables d\'environnement');
                console.error('   -> Solution: Ajouter PERPLEXITY_API_KEY dans Vercel Environment Variables');
                console.error('   -> Format attendu: pplx-...');
                console.error('   -> Verifiez: Vercel Dashboard -> Settings -> Environment Variables');
                console.error('   -> Available env vars:', Object.keys(process.env).filter(k => k.includes('PERPLEXITY') || k.includes('API_KEY')).slice(0, 10));
                console.error('='.repeat(60) + '\n');
                console.log(' Falling back to Gemini...');
                throw new Error('PERPLEXITY_API_KEY not configured');
            }

            //  Timeout flexible selon le mode et l'intent
            // PRIORITE: Intent > Canal
            // - Comprehensive Analysis: 90s (analyses longues avec 12 sections) - PRIORITAIRE meme pour SMS
            // - SMS (non-comprehensive): 30s (optimise pour vitesse)
            // - Autres: 60s (standard)
            const isComprehensiveAnalysis = intentData?.intent === 'comprehensive_analysis';

            //  FIX: Prioriser l'intent sur le canal pour comprehensive_analysis
            if (isComprehensiveAnalysis) {
                timeoutDuration = 90000;  // Comprehensive: 90s (12 sections + macro + moat + DCF) - PRIORITAIRE
                console.log(` Comprehensive Analysis detecte -> timeout: 90s (prioritaire sur canal)`);
            } else if (context.user_channel === 'sms') {
                timeoutDuration = 30000;  // SMS: 30s (sauf comprehensive_analysis)
            } else {
                timeoutDuration = 60000;  // Autres: 60s (standard)
            }

            //  NOUVEAU: Utiliser le systeme de fallback intelligent Perplexity
            // Essaie plusieurs modeles Perplexity en cascade (sonar-pro -> sonar -> sonar-reasoning)
            const { callPerplexityWithFallback } = await import('../lib/utils/perplexity-fallback.js');

            console.log(' [Perplexity] Appel avec systeme de fallback intelligent (3 modeles)');

            try {
                const result = await callPerplexityWithFallback(requestBody, {
                    apiKey: perplexityApiKey,
                    maxRetries: 1, // Perplexity stable, 1 retry suffit
                    logAttempts: true,
                    timeoutMs: timeoutDuration
                });

                console.log(` [Perplexity] Succes avec ${result.modelName} (tentative ${result.attemptNumber}/${result.totalAttempts})`);

                //  Extraire les citations/sources de Perplexity pour partage amical
                const citations = result.citations || [];

                //  Logging detaille pour diagnostic
                const wordCount = result.content.split(/\s+/).length;
                const charCount = result.content.length;
                const tokensUsed = result.data.usage?.total_tokens || 'unknown';
                const tokensRequested = maxTokens;

                console.log(` [Perplexity Response Stats]`);
                console.log(`   - Modele: ${result.modelName}`);
                console.log(`   - Words: ${wordCount}`);
                console.log(`   - Characters: ${charCount}`);
                console.log(`   - Tokens used: ${tokensUsed}/${tokensRequested}`);
                console.log(`   - Intent: ${intentData?.intent || 'unknown'}`);
                console.log(`   - Output mode: ${outputMode}`);
                console.log(`   - User channel: ${context.user_channel}`);
                console.log(`   - Citations: ${citations.length}`);

                // Verifier si reponse semble tronquee
                const seemsTruncated = !result.content.trim().endsWith('.') &&
                    !result.content.trim().endsWith('?') &&
                    !result.content.trim().endsWith('!');

                if (seemsTruncated) {
                    console.warn(` [Perplexity] Reponse semble tronquee (pas de ponctuation finale)`);
                }

                if (wordCount < 500 && intentData?.intent === 'comprehensive_analysis') {
                    console.warn(` [Perplexity] Reponse tres courte pour comprehensive_analysis: ${wordCount} mots (attendu: 2000+ mots)`);
                }

                //  VERIFICATION POST-REPONSE: S'assurer que les 12 sections sont presentes pour comprehensive_analysis
                if (intentData?.intent === 'comprehensive_analysis') {
                    const requiredSections = [
                        'VUE D\'ENSEMBLE', 'OVERVIEW', 'APERCU',
                        'VALORISATION',
                        'FONDAMENTAUX',
                        'CROISSANCE',
                        'MOAT',
                        'VALEUR INTRINSEQUE', 'DCF', 'FAIR VALUE',
                        'RESULTATS', 'EARNINGS', 'Q1', 'Q2', 'Q3', 'Q4',
                        'MACRO', 'FED', 'INFLATION', 'TAUX',
                        'DIVIDENDE',
                        'RISQUES',
                        'NEWS', 'CATALYSTS', 'ACTUALITES',
                        'RECOMMANDATION', 'RECO', 'AVIS'
                    ];
                    
                    const responseUpper = result.content.toUpperCase();
                    const foundSections = requiredSections.filter(section => 
                        responseUpper.includes(section.toUpperCase())
                    );
                    
                    // Verifier presence des sections cles (au moins 10/12)
                    const sectionGroups = [
                        ['VUE D\'ENSEMBLE', 'OVERVIEW', 'APERCU'], // Section 1
                        ['VALORISATION'], // Section 2
                        ['FONDAMENTAUX'], // Section 3
                        ['CROISSANCE'], // Section 4
                        ['MOAT'], // Section 5
                        ['VALEUR INTRINSEQUE', 'DCF', 'FAIR VALUE'], // Section 6
                        ['RESULTATS', 'EARNINGS', 'Q1', 'Q2', 'Q3', 'Q4'], // Section 7
                        ['MACRO', 'FED', 'INFLATION', 'TAUX'], // Section 8
                        ['DIVIDENDE'], // Section 9
                        ['RISQUES'], // Section 10
                        ['NEWS', 'CATALYSTS', 'ACTUALITES'], // Section 11
                        ['RECOMMANDATION', 'RECO', 'AVIS'] // Section 12
                    ];
                    
                    const sectionsFound = sectionGroups.filter(group => 
                        group.some(section => responseUpper.includes(section.toUpperCase()))
                    ).length;
                    
                    if (sectionsFound < 10) {
                        console.error(` [Perplexity] Reponse INCOMPLETE pour comprehensive_analysis: ${sectionsFound}/12 sections trouvees`);
                        console.error(`   -> Sections manquantes probables: ${12 - sectionsFound}`);
                        console.error(`   -> Longueur reponse: ${wordCount} mots, ${charCount} caracteres`);
                        console.error(`   -> Tokens utilises: ${tokensUsed}/${tokensRequested}`);
                    } else if (sectionsFound < 12) {
                        console.warn(` [Perplexity] Reponse partiellement complete: ${sectionsFound}/12 sections trouvees`);
                    } else {
                        console.log(` [Perplexity] Reponse COMPLETE: ${sectionsFound}/12 sections trouvees`);
                    }
                }

                // Retourner contenu + citations pour formatage ulterieur
                return {
                    content: result.content,
                    citations: citations,
                    model: result.model,
                    modelUsed: result.modelName
                };

            } catch (perplexityError) {
                // Tous les modeles Perplexity ont echoue
                console.error(' [Perplexity] Tous les fallbacks Perplexity ont echoue:', perplexityError.message);
                // Re-throw pour que le catch externe puisse fallback vers Gemini
                throw perplexityError;
            }

        } catch (error) {
            //  Nettoyer le timeout si pas deja fait (securite)
            if (timeout !== null) {
                clearTimeout(timeout);
            }

            //  DIAGNOSTIC DETAILLE des erreurs Perplexity
            console.error('\n' + '='.repeat(60));
            console.error(' ERREUR PERPLEXITY - DIAGNOSTIC');
            console.error('='.repeat(60));
            console.error(`Type d'erreur: ${error.name || 'Unknown'}`);
            console.error(`Message: ${error.message || 'No message'}`);
            console.error(`Intent: ${intentData?.intent || 'unknown'}`);
            console.error(`Canal: ${context.user_channel || 'web'}`);
            console.error(`Timeout configure: ${timeoutDuration / 1000}s`);

            // Gestion specifique des erreurs de timeout
            if (error.name === 'AbortError' || error.message?.includes('aborted')) {
                console.error(`  TIMEOUT: Perplexity n'a pas repondu dans les ${timeoutDuration / 1000}s`);
                console.error('   -> L\'API est trop lente ou surchargee');
                console.error('   -> Solution: Augmenter le timeout ou simplifier la requete');
                console.log(' Falling back to Gemini due to timeout...');
            } else if (error.message?.includes('PERPLEXITY_API_KEY')) {
                console.error(' CLE API MANQUANTE: PERPLEXITY_API_KEY non configuree');
                console.error('   -> Solution: Ajouter PERPLEXITY_API_KEY dans Vercel Environment Variables');
                console.error('   -> Format attendu: pplx-...');
            } else if (error.message?.includes('401')) {
                console.error(' AUTHENTIFICATION ECHOUEE: Cle API invalide ou expiree');
                console.error('   -> Solution: Verifier/regenerer la cle dans Perplexity Dashboard');
            } else if (error.message?.includes('429')) {
                console.error('  QUOTA DEPASSE: Trop de requetes envoyees');
                console.error('   -> Solution: Attendre quelques minutes ou upgrade plan Perplexity');
            } else if (error.message?.includes('400')) {
                console.error(' REQUETE INVALIDE: Format de requete incorrect');
                console.error('   -> Solution: Verifier le modele (sonar-pro) et le format des messages');
            } else if (error.message?.includes('503')) {
                console.error(' SERVICE INDISPONIBLE: API Perplexity temporairement down');
                console.error('   -> Solution: Reessayer dans quelques instants');
            } else {
                console.error(' ERREUR INCONNUE:', error);
                if (error.stack) {
                    console.error('Stack:', error.stack.substring(0, 500));
                }
            }
            console.error('='.repeat(60) + '\n');

            //  VRAI FALLBACK: Appeler Gemini au lieu de throw
            console.log(' Calling Gemini as fallback...');
            return await this._call_gemini(prompt, outputMode, context);
        }
    }

    /**
     * Gestion du streaming Perplexity pour SMS avec envoi progressif
     * DESACTIVE - Causait corruption de texte (tokens coupes)
     */
    async _handleStreamingSMS(response, context) {
        // STREAMING DESACTIVE - Retour au mode classique
        console.log(' Streaming desactive, utilisation mode classique');

        try {
            let data; try { data = JSON.parse(await response.text()); } catch(e) { throw new Error('LLM API Invalid JSON'); }
            const content = data.choices[0].message.content;
            const citations = data.citations || [];

            console.log(` Perplexity responded (non-streaming): ${content.length} chars`);

            return {
                content: content,
                citations: citations,
                streaming: false
            };
        } catch (error) {
            console.error(' Error parsing Perplexity response:', error);
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

        // Decouper intelligemment par phrases si possible
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
            // Import dynamique pour eviter circular dependencies
            const smsModule = await import('./adapters/sms.js');
            const totalChunks = Math.ceil(fullContent.length / CHUNK_SIZE);
            const prefix = totalChunks > 1 ? `[${chunkIndex + 1}/${totalChunks}] ` : '';

            await smsModule.sendSMS(
                context.userId,
                prefix + finalChunk,
                false // pas de simulation
            );

            console.log(` SMS chunk ${chunkIndex + 1}/${totalChunks} sent (${finalChunk.length} chars)`);

            // Delai entre chunks pour garantir l'ordre
            if (!isFinal) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } catch (error) {
            console.error(` Failed to send SMS chunk ${chunkIndex + 1}:`, error);
        }
    }

    /**
     * Appel a Gemini (gratuit) pour questions conceptuelles
     * Utilise un systeme de fallback intelligent pour maximiser la disponibilite
     */
    async _call_gemini(prompt, outputMode = 'chat', context = {}, modelConfig = null) {
        try {
            if (!process.env.GEMINI_API_KEY) {
                throw new Error('GEMINI_API_KEY not configured');
            }

            //  REPONSES ULTRA-LONGUES PAR DEFAUT
            let maxTokens = modelConfig?.max_tokens || 8000;  //  DEFAULT ULTRA-AUGMENTE: 8000 tokens (~5600 mots)
            if (context.user_channel === 'sms') {
                maxTokens = 2000;  //  SMS: MAX 2000 tokens (4-5 SMS)
                console.log(' Gemini SMS mode: FORCED 2000 tokens max (4-5 SMS detailles)');
            } else if (outputMode === 'briefing') {
                maxTokens = 10000;  //  Briefing MAXIMUM (AUGMENTE 8000 -> 10000)
                console.log(' Gemini Briefing mode: 10000 tokens (MAXIMUM EXHAUSTIF)');
            } else if (outputMode === 'data') {
                maxTokens = 500;
            } else {
                console.log(' Gemini Chat mode: 4000 tokens (reponses ULTRA-LONGUES par defaut)');
            }

            // Ajouter instructions systeme pour mode conversationnel
            const systemInstructions = outputMode === 'data'
                ? 'Tu es Emma Data Extractor. Retourne UNIQUEMENT du JSON valide.'
                : `Tu es Emma, analyste financiere experte.

REGLES CRITIQUES:
-  NE JAMAIS retourner du JSON brut ou du code
-  TOUJOURS etre conversationnelle et analyser les donnees
-  Tu es une ANALYSTE qui INTERPRETE, pas un robot qui affiche des donnees
-  Reponds en francais professionnel et accessible

 METRIQUES OBLIGATOIRES pour analyse de ticker:
- VALORISATION: Prix, P/E, P/FCF, P/B, Market Cap
- RENTABILITE: EPS, Dividende & rendement, ROE, Marges
- PERFORMANCE: YTD %, 52w high/low, 5y high/low
- RESULTATS: Dernier rapport, prochains resultats, nouvelles recentes
- CONSENSUS: Analystes (Buy/Hold/Sell), price target, attentes vs reel
- SANTE: Debt/Equity, Current Ratio, Free Cash Flow

 TAGS MULTIMEDIAS DISPONIBLES:
- [STOCKCARD:TICKER] -> Carte boursiere professionnelle (prix, metriques, mini-chart)
- [RATIO_CHART:TICKER:METRIC] -> Evolution historique de ratios (PE, ROE, PROFIT_MARGIN, etc.)
- [CHART:FINVIZ:TICKER] -> Graphique technique Finviz
- [CHART:TRADINGVIEW:EXCHANGE:TICKER] -> Graphique TradingView
- [LOGO:TICKER] -> Logo de l'entreprise

`;

            const fullPrompt = systemInstructions + prompt;

            //  NOUVEAU: Utiliser le systeme de fallback intelligent
            // Essaie plusieurs modeles Gemini en cascade pour maximiser la disponibilite
            const { callGeminiWithFallback } = await import('../lib/utils/gemini-fallback.js');

            console.log(' [Gemini] Appel avec systeme de fallback intelligent (3 modeles)');

            const result = await callGeminiWithFallback({
                contents: [{
                    parts: [{ text: fullPrompt }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: maxTokens,
                    candidateCount: 1
                }
            }, {
                apiKey: process.env.GEMINI_API_KEY,
                maxRetries: 2, // 2 retries par modele
                preferredModels: modelConfig?.model_id ? [modelConfig.model_id] : null,
                logAttempts: true
            });

            console.log(` [Gemini] Succes avec ${result.modelName} (tentative ${result.attemptNumber}/${result.totalAttempts})`);

            return result.text;

        } catch (error) {
            console.error(' Gemini API error (tous les fallbacks ont echoue):', error);
            throw new Error(`Erreur de communication avec Gemini: ${error.message}`);
        }
    }

    /**
 * Appel a Claude (premium) pour briefings et redaction
 */
async _call_claude(prompt, outputMode = 'briefing', userMessage = '', intentData = null, toolResults = [], context = {}, modelConfig = null) {
    try {
        if (!process.env.ANTHROPIC_API_KEY) {
            throw new Error('ANTHROPIC_API_KEY not configured');
        }

        //  Configuration des tokens
        // Priorite: Config DB > Logique adaptative > Defaut hardcode
        let maxTokens = modelConfig?.max_tokens || 4000;

        // Adaptations specifiques selon le contexte (override si necessaire pour contraintes physiques)
        if (context.user_channel === 'sms') {
            //  SMS: Contrainte stricte pour eviter cout/spam
            const smsLimit = 2000;
            if (maxTokens > smsLimit) {
                maxTokens = smsLimit;
                console.log(` Claude SMS: Limiting tokens to ${maxTokens} (channel constraint)`);
            }
        } else if (outputMode === 'briefing' && !modelConfig) {
            //  Briefing sans config specifique: on booste par defaut
            maxTokens = 10000;
            console.log(' Claude Briefing (default boost): 10000 tokens');
        } else if (outputMode === 'chat' && !modelConfig) {
            //  Chat sans config: on adapte a la complexite
            const complexityInfo = this._detectComplexity(userMessage, intentData, toolResults);
            maxTokens = complexityInfo.tokens * 3;
            console.log(` Claude Auto-Complexity: ${maxTokens} tokens`);
        }

        // Configuration Modele & Temperature
        const modelId = modelConfig?.model_id || 'claude-3-5-sonnet-20240620';
        const temperature = modelConfig?.temperature ?? 0.5; // 0.5 par defaut (equilibre)

        // System prompt pour Claude
        const systemPrompt = outputMode === 'data'
            ? 'Tu es Emma Data Extractor. Retourne UNIQUEMENT du JSON valide, pas de texte explicatif.'
            : `Tu es Emma, analyste financiere experte et redactrice professionnelle.

REGLES CRITIQUES:
-  NE JAMAIS retourner du JSON brut ou du code dans tes reponses
-  TOUJOURS analyser et interpreter les donnees de maniere conversationnelle
-  TU ES UNE ANALYSTE qui REDIGE des briefings professionnels, pas un robot
-  Utilise un ton institutionnel, professionnel et accessible
-  Structure avec Markdown (##, ###, bullet points, tableaux)
-  Inclus des donnees chiffrees precises et contextualisees
-  Fournis des insights actionnables et des recommandations

 METRIQUES OBLIGATOIRES pour chaque ticker analyse:
- VALORISATION: Prix, P/E, P/FCF, P/B, Market Cap
- RENTABILITE: EPS, Dividende & rendement, ROE, Marges
- PERFORMANCE: YTD %, 52w high/low, 5y high/low
- RESULTATS: Dernier rapport, prochains resultats, nouvelles recentes
- CONSENSUS: Analystes (Buy/Hold/Sell), price target, attentes vs reel
- SANTE: Debt/Equity, Current Ratio, Free Cash Flow

 TAGS MULTIMEDIAS DISPONIBLES:
Enrichis tes reponses et briefings avec:
- [STOCKCARD:TICKER] -> Carte boursiere professionnelle (prix, metriques cles, mini-chart)
- [RATIO_CHART:TICKER:METRIC] -> Evolution historique de ratios (PE, ROE, PROFIT_MARGIN, DEBT_EQUITY, etc.)
- [CHART:FINVIZ:TICKER] -> Graphique technique Finviz (si demande)
- [CHART:TRADINGVIEW:EXCHANGE:TICKER] -> Graphique TradingView (si demande)
- [LOGO:TICKER] -> Logo de l'entreprise

Exemples (utiliser avec parcimonie):
- "Performance de MGA: [STOCKCARD:MGA]" (si demande un resume visuel)
- "Historique P/E d'Apple: [RATIO_CHART:AAPL:PE]" (si demande evolution historique)
- "Analyse technique Tesla: [CHART:FINVIZ:TSLA]" (si demande graphique technique)

Tu es utilisee principalement pour rediger des briefings quotidiens de haute qualite.`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: modelId,
                max_tokens: maxTokens,
                temperature: temperature,
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

            let data; try { data = JSON.parse(await response.text()); } catch(e) { throw new Error('LLM API Invalid JSON'); }
            return data.content[0].text;

        } catch (error) {
            console.error(' Claude API error:', error);
            throw new Error(`Erreur de communication avec Claude: ${error.message}`);
        }
    }

    /**
     * Reponse de fallback si Perplexity echoue (adapte selon mode)
     * Utilise Gemini pour generer une vraie reponse en francais au lieu d'afficher du JSON brut
     */
    async _generateFallbackResponse(userMessage, toolResults, outputMode = 'chat', context = {}) {
        const successfulResults = toolResults.filter(r => r.success && r.data);

        if (successfulResults.length === 0) {
            if (outputMode === 'data') {
                return '{}';
            }
            //  SMS: Message d'erreur court si aucune donnee disponible
            if (context.user_channel === 'sms') {
                return " Service temporairement indisponible. Emma reviendra dans quelques instants. Pour une reponse immediate, visitez gobapps.com";
            }
            return "Desole, je n'ai pas pu recuperer de donnees fiables pour repondre a votre question. Veuillez reessayer.";
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

        // Mode CHAT ou BRIEFING: Utiliser Gemini pour generer une vraie reponse en francais
        try {
            // Construire un prompt avec les donnees disponibles
            const toolsDataSummary = successfulResults.map(result => {
                const summary = this._summarizeToolData(result.tool_id, result.data);
                return `**${result.tool_id}**: ${summary}`;
            }).join('\n\n');

            const fallbackPrompt = `Tu es Emma, analyste financiere experte. L'utilisateur a pose cette question: "${userMessage}"

J'ai recupere les donnees suivantes depuis plusieurs sources:

${toolsDataSummary}

INSTRUCTIONS CRITIQUES:
-  NE JAMAIS afficher du JSON brut ou du code dans ta reponse
-  INTERPRETE et SYNTHETISE les donnees en francais naturel
-  Sois conversationnelle et professionnelle
-  Explique les chiffres de maniere claire et accessible
-  Si tu vois des donnees de prix, ratios, ou actualites, analyse-les et explique-les
-  Reponds directement a la question de l'utilisateur en utilisant ces donnees

${context.user_channel === 'sms' ? ' Mode SMS: Reponse courte et concise (max 400 caracteres)' : ' Mode Web: Reponse detaillee et complete'}

Genere une reponse professionnelle en francais basee sur ces donnees:`;

            // Utiliser Gemini pour generer la reponse
            const geminiResponse = await this._call_gemini(fallbackPrompt, outputMode, context);

            // Nettoyer le JSON si present
            const cleanedResponse = this._sanitizeJsonInResponse(geminiResponse);

            return cleanedResponse;

        } catch (error) {
            console.error(' Erreur generation fallback avec Gemini:', error);

            // Fallback ultime: reponse basique sans JSON
            if (context.user_channel === 'sms') {
                // Pour SMS, reponse tres courte
                const firstResult = successfulResults[0];
                if (firstResult.tool_id.includes('price') || firstResult.tool_id.includes('quote')) {
                    const price = firstResult.data?.price || firstResult.data?.data?.price;
                    const ticker = firstResult.data?.ticker || firstResult.data?.data?.ticker || 'l\'action';
                    if (price) {
                        return ` ${ticker} se negocie a ${price}$. Donnees disponibles. Pour + de details: gobapps.com`;
                    }
                }
                return " Donnees disponibles. Pour une analyse complete, visite gobapps.com";
            }

            // Pour Web, message informatif sans JSON
            return `J'ai recupere des donnees depuis ${successfulResults.length} source(s), mais je n'ai pas pu generer une analyse complete. Les donnees incluent: ${successfulResults.map(r => r.tool_id).join(', ')}.\n\nVeuillez reformuler votre question ou visitez gobapps.com pour plus d'informations.`;
        }
    }

    /**
     * Mise a jour de l'historique de conversation
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

        // Limiter l'historique a 20 echanges (10 questions/reponses)
        if (this.conversationHistory.length > 20) {
            this.conversationHistory = this.conversationHistory.slice(-20);
        }
    }

    /**
     * Mise a jour des statistiques d'outil (sauvegarde dans Supabase)
     */
    async _updateToolStats(toolId, success, executionTime, errorMessage = null) {
        // Mise a jour en memoire pour utilisation immediate
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
                // Garder seulement les 10 dernieres erreurs
                if (stats.error_history.length > 10) {
                    stats.error_history = stats.error_history.slice(-10);
                }
            }
        }

        // Calcul du taux de succes
        stats.success_rate = stats.total_calls > 0 ? (stats.successful_calls / stats.total_calls) * 100 : 0;

        // Mise a jour du temps de reponse moyen
        if (executionTime > 0) {
            const totalTime = stats.average_response_time_ms * (stats.total_calls - 1) + executionTime;
            stats.average_response_time_ms = Math.round(totalTime / stats.total_calls);
        }

        // Sauvegarde asynchrone dans Supabase (non-bloquante)
        // Si ca echoue, ce n'est pas grave - on a deja les stats en memoire
        try {
            const supabase = this._initSupabase();
            if (supabase) {
                // Appel non-bloquant a la fonction Supabase
                supabase.rpc('update_tool_stats', {
                    p_tool_id: toolId,
                    p_success: success,
                    p_execution_time: executionTime,
                    p_error_message: errorMessage
                }).then(({ error }) => {
                    if (error) {
                        console.warn(` Failed to save stats for ${toolId} to Supabase:`, error.message);
                    }
                }).catch(err => {
                    console.warn(` Error saving stats for ${toolId}:`, err.message);
                });
            }
        } catch (error) {
            // Silently fail - stats en memoire sont suffisantes pour cette execution
            console.warn(` Could not save stats for ${toolId}:`, error.message);
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
                console.error(' Failed to initialize Supabase client:', error);
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
            console.error(' Failed to load tools config:', error);
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
                console.warn(' Supabase not available, using empty stats');
                this.usageStatsLoaded = true;
                return {};
            }

            const { data, error } = await supabase.rpc('get_all_tool_stats');

            if (error) {
                console.error(' Failed to load usage stats from Supabase:', error);
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
            console.log(` Loaded usage stats for ${Object.keys(stats).length} tools from Supabase`);
            return stats;

        } catch (error) {
            console.error(' Failed to load usage stats:', error);
            this.usageStatsLoaded = true;
            return {};
        }
    }

    /**
     * Sauvegarde des statistiques d'utilisation dans Supabase (non-bloquante)
     * Note: Cette methode n'est plus necessaire car les stats sont maintenant
     * sauvegardees directement dans _updateToolStats via Supabase RPC
     */
    async _saveUsageStats() {
        // Cette methode est maintenant un no-op
        // Les statistiques sont sauvegardees en temps reel via _updateToolStats
        // qui appelle la fonction Supabase update_tool_stats
        return;
    }

    /**
     *  AUTO-CORRECTION DES TICKERS
     * Corrige les erreurs courantes de tickers (ex: SONOCO -> SON, GOOGL -> GOOGL, etc.)
     */
    _autoCorrectTickers(message) {
        // Dictionnaire des corrections courantes (nom complet -> ticker correct)
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
            // Canadiennes (noms complets -> tickers de base, normalises apres)
            'ROYAL BANK': 'RY',
            'TD BANK': 'TD',
            'TORONTO DOMINION': 'TD',
            'BANK OF NOVA SCOTIA': 'BNS',
            'SCOTIABANK': 'BNS',
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
            'CP RAIL': 'CP',
            'CANADIAN PACIFIC': 'CP',
            'SHOPIFY': 'SHOP',
            'BELL': 'BCE',
            'ROGERS': 'RCI.B',
            'POWER CORP': 'POW',
            'POWER CORPORATION': 'POW'
        };

        // Normaliser les tickers canadiens avec le contexte geographique
        const geoContext = extractGeographicContext(message);

        let correctedMessage = message;
        let corrections = [];

        // Chercher et corriger les tickers dans le message
        for (const [wrong, correct] of Object.entries(tickerCorrections)) {
            // Regex pour matcher le mot entier (insensible a la casse)
            const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
            if (regex.test(correctedMessage)) {
                correctedMessage = correctedMessage.replace(regex, correct);
                corrections.push(`${wrong} -> ${correct}`);
            }
        }

        // Normaliser les tickers canadiens detectes (ajouter .TO)
        // Pattern: detecte les tickers en majuscules de 2-5 lettres
        const tickerPattern = /\b([A-Z]{2,5})\b/g;
        correctedMessage = correctedMessage.replace(tickerPattern, (match) => {
            const normalized = normalizeTicker(match, geoContext);
            if (normalized !== match.toUpperCase()) {
                corrections.push(`${match} -> ${normalized} (normalized)`);
            }
            return normalized;
        });

        if (corrections.length > 0) {
            console.log(` Auto-correction + normalisation tickers: ${corrections.join(', ')}`);
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

    // Verifier que PERPLEXITY_API_KEY est configuree (avec fallback)
    const perplexityKey = process.env.PERPLEXITY_API_KEY || process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;
    if (!perplexityKey) {
        console.error(' PERPLEXITY_API_KEY is not configured!');
        console.error('Available env vars:', {
            hasPerplexityKey: !!process.env.PERPLEXITY_API_KEY,
            hasNextPublicPerplexityKey: !!process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY,
            envKeys: Object.keys(process.env).filter(k => k.includes('PERPLEXITY') || k.includes('API_KEY')).slice(0, 10)
        });
        return res.status(503).json({
            success: false,
            error: 'Perplexity API key not configured (PERPLEXITY_API_KEY)',
            response: ' Configuration manquante: La cle API Perplexity n\'est pas configuree dans Vercel. Veuillez ajouter PERPLEXITY_API_KEY dans les variables d\'environnement Vercel.',
            is_reliable: false
        });
    }

    try {
        // Initialisation de l'agent si necessaire
        if (!emmaAgent) {
            emmaAgent = new SmartAgent();
        }

        const { message, context = {} } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Ajout du timestamp de debut
        context.start_time = Date.now();

        // Traitement de la requete
        const result = await emmaAgent.processRequest(message, context);

        return res.status(200).json(result);

    } catch (error) {
        console.error(' Emma Agent API Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
            response: "Erreur interne du serveur. Veuillez reessayer."
        });
    }
}
