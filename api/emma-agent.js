/**
 * Emma Agent - Système de Function Calling Intelligent avec Cognitive Scaffolding
 *
 * Architecture:
 * - COGNITIVE SCAFFOLDING LAYER: Analyse d'intention avec Perplexity
 * - ReAct REASONING LAYER: Sélection intelligente d'outils
 * - TOOL USE LAYER: Exécution parallèle avec fallbacks
 * - SYNTHESIS LAYER: Génération de réponse finale
 */

import fs from 'fs';
import path from 'path';
import { HybridIntentAnalyzer } from '../lib/intent-analyzer.js';

class SmartAgent {
    constructor() {
        this.toolsConfig = this._loadToolsConfig();
        this.usageStats = this._loadUsageStats();
        this.conversationHistory = [];
        this.intentAnalyzer = new HybridIntentAnalyzer();
    }

    /**
     * Point d'entrée principal pour Emma
     */
    async processRequest(userMessage, context = {}) {
        try {
            console.log('🤖 Emma Agent: Processing request:', userMessage.substring(0, 100) + '...');

            // 0. COGNITIVE SCAFFOLDING: Analyse d'intention avec Perplexity
            const intentData = await this._analyzeIntent(userMessage, context);
            console.log('🧠 Intent analysis:', intentData ? intentData.intent : 'fallback to keyword scoring');

            // Si clarification nécessaire, retourner immédiatement
            if (intentData && intentData.needs_clarification) {
                return this._handleClarification(intentData, userMessage);
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

            // 5. Sauvegarde des statistiques
            this._saveUsageStats();

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
     * SMART ROUTER - Sélectionne le meilleur modèle selon le type de requête
     *
     * Stratégie optimisée coût/performance:
     * - Perplexity (80%): Données factuelles avec sources (stock prices, news, fundamentals)
     * - Gemini (15%): Questions conceptuelles/éducatives (gratuit)
     * - Claude (5%): Rédaction premium (briefings, lettres clients)
     */
    _selectModel(intentData, outputMode, toolsData) {
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

        // PERPLEXITY: Requêtes factuelles avec sources
        const factualIntents = [
            'stock_price',
            'fundamentals',
            'news',
            'comprehensive_analysis',
            'comparative_analysis',
            'earnings',
            'market_overview',
            'recommendation'
        ];

        if (factualIntents.includes(intent) || hasTickers || hasToolData) {
            console.log(`💎 Factual query (${intent}) → Using PERPLEXITY (with sources)`);
            return {
                model: 'perplexity',
                reason: `Factual data required for ${intent}`,
                recency: intentData?.recency_filter || 'day'
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

        // Sélection des meilleurs outils (max 5 simultanés)
        const maxTools = Math.min(this.toolsConfig.config.max_concurrent_tools, scoredTools.length);
        const selectedTools = scoredTools.slice(0, maxTools);

        console.log('🎯 Tool scoring results:', selectedTools.map(t => ({
            id: t.id,
            score: t.calculated_score,
            relevance: t.relevance_score,
            performance: t.performance_score
        })));

        return selectedTools;
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

        // 2. Tickers explicitement mentionnés dans le message
        const tickerPattern = /\b([A-Z]{1,5})\b/g;
        const matches = userMessage.match(tickerPattern);
        if (matches) {
            matches.forEach(match => {
                // Vérifier si c'est un ticker valide (2-5 lettres)
                if (match.length >= 2 && match.length <= 5) {
                    tickers.add(match);
                }
            });
        }

        // 3. Mapping de noms de compagnies vers tickers
        const companyToTicker = {
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
            'disney': 'DIS'
        };

        const messageLower = userMessage.toLowerCase();
        Object.entries(companyToTicker).forEach(([company, ticker]) => {
            if (messageLower.includes(company)) {
                tickers.add(ticker);
            }
        });

        return Array.from(tickers);
    }

    /**
     * Génération de la réponse finale avec SMART ROUTING (Perplexity/Gemini/Claude)
     */
    async _generate_response(userMessage, toolResults, context, intentData = null) {
        try {
            const outputMode = context.output_mode || 'chat';
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
            const modelSelection = this._selectModel(intentData, outputMode, toolsData);
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

            // Router vers le bon modèle
            if (modelSelection.model === 'claude') {
                // CLAUDE: Briefings premium
                response = await this._call_claude(prompt, outputMode, userMessage, intentData, toolResults);
            } else if (modelSelection.model === 'gemini') {
                // GEMINI: Questions conceptuelles (gratuit)
                response = await this._call_gemini(prompt, outputMode);
            } else {
                // PERPLEXITY: Données factuelles avec sources (default)
                response = await this._call_perplexity(prompt, outputMode, modelSelection.recency, userMessage, intentData, toolResults);
            }

            // Post-traitement selon le mode
            if (outputMode === 'data') {
                // Valider et parser le JSON
                response = this._validateAndParseJSON(response);
            } else if (outputMode === 'briefing' || outputMode === 'ticker_note') {
                // Nettoyer le Markdown (enlever éventuels artifacts)
                response = this._cleanMarkdown(response);
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
                    response = await this._call_perplexity(reinforcedPrompt, outputMode, modelSelection.recency);
                    // Re-valider
                    validation = this._validateFreshData(response, intentData);
                    console.log(`🛡️ FreshDataGuard (retry): Confidence ${(validation.confidence * 100).toFixed(0)}%, Sources: ${validation.source_types_found}`);
                }
            }

            // Retourner réponse avec validation et modèle utilisé
            return {
                response,
                validation,
                model: modelSelection.model,  // Ajout du modèle pour affichage dans l'UI
                model_reason: modelSelection.reason
            };

        } catch (error) {
            console.error('❌ Response generation failed:', error);

            // Réponse de fallback basée sur les données des outils
            const fallbackResponse = this._generateFallbackResponse(userMessage, toolResults, context.output_mode);
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
        const userContext = userName ? `\n👤 UTILISATEUR: Tu parles avec ${userName}. Personnalise tes salutations et réponses en utilisant son nom quand approprié.\n` : '';

        // Si Emma doit se présenter (premier message ou "Test Emma")
        const shouldIntroduce = context.should_introduce || false;
        const introContext = shouldIntroduce ? `\n🎯 PRÉSENTATION REQUISE: C'est le premier contact avec cet utilisateur OU ils ont écrit "Test Emma". COMMENCE ta réponse par une brève présentation de qui tu es (Emma, assistante IA financière), ce que tu peux faire (analyses de marchés, nouvelles financières, données en temps réel), et invite-les à poser leurs questions. Garde la présentation concise (2-3 phrases max).\n` : '';

        // Instruction pour emojis (canal SMS)
        const userChannel = context.user_channel || 'chat';
        const emojiInstructions = userChannel === 'sms' ? `\n😊 STYLE SMS: Tu communiques par SMS. Utilise des emojis pour rendre tes réponses plus vivantes et engageantes (📊 📈 💰 💡 ✅ ⚠️ 🎯 👋 etc.). Garde tes réponses relativement courtes et agréables à lire sur mobile.\n` : '';

        return `Tu es Emma, l'assistante financière intelligente. Réponds en français de manière professionnelle et accessible.${userContext}${introContext}${emojiInstructions}
📅 DATE ACTUELLE: ${currentDate} (${currentDateTime})
⚠️ CRITIQUE: Toutes les données doivent refléter les informations les plus récentes. Si une donnée est datée (ex: "au 8 août"), précise clairement que c'est une donnée ancienne et cherche des informations plus récentes si disponibles.

CONTEXTE DE LA CONVERSATION:
${conversationContext.map(c => `- ${c.role}: ${c.content}`).join('\n')}
${intentContext}
DONNÉES DISPONIBLES DES OUTILS:
${toolsData.map(t => {
    const reliabilityNote = t.is_reliable === false ? ' [⚠️ SOURCE PARTIELLE - Utiliser avec prudence]' : '';
    return `- ${t.tool}${reliabilityNote}: ${JSON.stringify(t.data, null, 2)}`;
}).join('\n')}

QUESTION DE L'UTILISATEUR: ${userMessage}

INSTRUCTIONS CRITIQUES:
1. ❌ ❌ ❌ NE JAMAIS COPIER DU JSON BRUT DANS TA RÉPONSE ❌ ❌ ❌
   - Les données JSON ci-dessus sont pour TON analyse SEULEMENT
   - Tu dois TOUJOURS transformer ces données en texte conversationnel français
   - Exemple INTERDIT: "{\\"price\\": 245.67}"
   - Exemple CORRECT: "Le prix actuel est de 245,67$"

2. ✅ TU ES UNE ANALYSTE, PAS UN ROBOT QUI AFFICHE DES DONNÉES
   - INTERPRÈTE les chiffres, ne les affiche pas juste
   - EXPLIQUE ce que signifient les données
   - DONNE des insights et du contexte

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

📊 GRAPHIQUES ET VISUALISATIONS - IMPORTANT:
Si l'utilisateur demande des graphiques, images, charts ou visualisations, tu DOIS inclure ces tags dans ta réponse:

**Tags disponibles:**
- [CHART:FINVIZ:TICKER] → Graphique technique Finviz (ex: [CHART:FINVIZ:AAPL])
- [CHART:TRADINGVIEW:EXCHANGE:TICKER] → Widget TradingView interactif (ex: [CHART:TRADINGVIEW:NASDAQ:MSFT])
- [CHART:FINVIZ:SECTORS] → Heatmap sectorielle de performance
- [LOGO:TICKER] → Logo de l'entreprise (ex: [LOGO:GOOGL])

**Règles d'utilisation:**
✅ TOUJOURS ajouter au moins un tag [CHART:...] si l'utilisateur mentionne "graphique", "chart", "image", "visualisation", "graphe"
✅ Placer les tags DANS le texte là où le graphique serait logique (pas seulement à la fin)
✅ Utiliser [CHART:FINVIZ:TICKER] par défaut (simple et efficace)
✅ Combiner avec du texte explicatif autour

**Exemples d'intégration:**
"Voici l'analyse de Apple (AAPL) :

Le titre se négocie actuellement à 245,67$ (+2,34%).

[CHART:FINVIZ:AAPL]

Le graphique montre une tendance haussière avec des volumes élevés..."

"Performance des secteurs aujourd'hui:

[CHART:FINVIZ:SECTORS]

Le secteur technologique domine avec +1,2%..."

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

B) GRAPHIQUES ET CHARTS - Inclus URLs de graphiques:
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

[CHART:FINVIZ:SECTORS]

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
[CHART:FINVIZ:${ticker}]

Titre: **Évolution du cours ${ticker} – ${new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}**

### 8. GRAPHIQUE CHIFFRÉ (ÉVOLUTION TRIMESTRIELLE)
Si disponible, ajoute:
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
- [CHART:FINVIZ:TICKER] → Graphique technique
- [CHART:TRADINGVIEW:EXCHANGE:TICKER] → Widget TradingView
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
        if (complexityScore <= 2) {
            return { level: 'simple', tokens: 800, description: 'Question simple et directe' };
        } else if (complexityScore <= 5) {
            return { level: 'moyenne', tokens: 2000, description: 'Question modérément complexe' };
        } else if (complexityScore <= 8) {
            return { level: 'complexe', tokens: 4000, description: 'Analyse détaillée nécessaire' };
        } else {
            return { level: 'très_complexe', tokens: 8000, description: 'Analyse exhaustive multi-dimensionnelle' };
        }
    }

    async _call_perplexity(prompt, outputMode = 'chat', recency = 'month', userMessage = '', intentData = null, toolResults = []) {
        try {
            // Ajuster max_tokens selon le mode ET la complexité
            let maxTokens = 1000;  // Default pour chat
            let complexityInfo = null;

            if (outputMode === 'briefing') {
                maxTokens = 8000;  // 🚀 Briefing TRÈS détaillé (maximum exhaustif)
                console.log('📊 Briefing mode: 8000 tokens (maximum exhaustif)');
            } else if (outputMode === 'ticker_note') {
                maxTokens = 6000;  // 📋 Note professionnelle détaillée avec graphiques et tableaux
                console.log('📋 Ticker note mode: 6000 tokens (note professionnelle complète)');
            } else if (outputMode === 'data') {
                maxTokens = 500;  // JSON structuré: court
            } else if (outputMode === 'chat') {
                // 🧠 Détection automatique de complexité pour ajustement intelligent
                complexityInfo = this._detectComplexity(userMessage, intentData, toolResults);
                maxTokens = complexityInfo.tokens;
                console.log(`🧠 Complexité détectée: ${complexityInfo.level} → ${maxTokens} tokens (${complexityInfo.description})`);
            }

            const requestBody = {
                model: 'sonar-pro',  // Modèle premium Perplexity (Jan 2025) - Meilleure qualité, plus de citations, recherche approfondie
                messages: [
                    {
                        role: 'system',
                        content: outputMode === 'data'
                            ? 'Tu es Emma Data Extractor. Retourne UNIQUEMENT du JSON valide, pas de texte explicatif.'
                            : 'Tu es Emma, une assistante financière experte et analyste professionnelle.\n\nRÈGLES CRITIQUES:\n1. ❌ NE JAMAIS retourner du JSON brut ou du code dans tes réponses\n2. ✅ TOUJOURS analyser et expliquer les données de manière conversationnelle en français\n3. ✅ TOUJOURS agir en tant qu\'analyste financière qui INTERPRÈTE les données, pas juste les affiche\n4. ✅ Ton style: professionnel, accessible, pédagogique\n5. ✅ Structure tes réponses avec des paragraphes, des bullet points, et des insights\n6. ❌ Si tu vois du JSON dans le prompt, c\'est pour TON analyse - ne le copie JAMAIS tel quel dans ta réponse\n\nExemple CORRECT: "Apple (AAPL) affiche une performance solide avec un prix de 245,67$, en hausse de 2,36% aujourd\'hui..."\n\nExemple INCORRECT: "{\\"AAPL\\": {\\"price\\": 245.67, \\"change\\": 5.67}}"\n\n🎨 TAGS MULTIMÉDIAS DISPONIBLES:\nQuand pertinent, enrichis tes réponses avec:\n- [STOCKCARD:TICKER] → Carte boursière professionnelle (prix, métriques, mini-chart)\n- [RATIO_CHART:TICKER:METRIC] → Évolution historique de ratios (PE, ROE, PROFIT_MARGIN, etc.)\n- [CHART:FINVIZ:TICKER] → Graphique technique détaillé\n- [CHART:TRADINGVIEW:EXCHANGE:TICKER] → Widget TradingView interactif\n- [LOGO:TICKER] → Logo de l\'entreprise\n\nExemples d\'usage:\n- "Voici la performance de MGA: [STOCKCARD:MGA]"\n- "Évolution du P/E d\'Apple sur 5 ans: [RATIO_CHART:AAPL:PE]"\n- "Analyse technique de Tesla: [CHART:FINVIZ:TSLA]"'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: maxTokens,
                temperature: outputMode === 'briefing' ? 0.5 : 0.7  // Plus déterministe pour briefings
            };

            // Ajouter recency filter si disponible
            if (recency) {
                requestBody.search_recency_filter = recency; // hour, day, week, month, year
                console.log(`🕐 Using recency filter: ${recency}`);
            }

            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ Perplexity API error details:', errorData);
                throw new Error(`Perplexity API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;

        } catch (error) {
            console.error('❌ Perplexity API error:', error);
            throw new Error(`Erreur de communication avec Perplexity: ${error.message}`);
        }
    }

    /**
     * Appel à Gemini (gratuit) pour questions conceptuelles
     */
    async _call_gemini(prompt, outputMode = 'chat') {
        try {
            if (!process.env.GEMINI_API_KEY) {
                throw new Error('GEMINI_API_KEY not configured');
            }

            const maxTokens = outputMode === 'data' ? 500 : 1000;
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

🎨 TAGS MULTIMÉDIAS DISPONIBLES:
- [STOCKCARD:TICKER] → Carte boursière professionnelle (prix, métriques, mini-chart)
- [RATIO_CHART:TICKER:METRIC] → Évolution historique de ratios (PE, ROE, PROFIT_MARGIN, etc.)
- [CHART:FINVIZ:TICKER] → Graphique technique
- [LOGO:TICKER] → Logo de l'entreprise

`;

            const fullPrompt = systemInstructions + prompt;

            const response = await fetch(apiUrl, {
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
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
            }

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
    async _call_claude(prompt, outputMode = 'briefing', userMessage = '', intentData = null, toolResults = []) {
        try {
            if (!process.env.ANTHROPIC_API_KEY) {
                throw new Error('ANTHROPIC_API_KEY not configured');
            }

            // Ajuster max_tokens selon le mode ET la complexité
            let maxTokens = 1000;  // Default

            if (outputMode === 'briefing') {
                maxTokens = 8000;  // 🚀 Briefing TRÈS détaillé (maximum exhaustif)
                console.log('📊 Claude Briefing mode: 8000 tokens (maximum exhaustif)');
            } else if (outputMode === 'data') {
                maxTokens = 500;
            } else if (outputMode === 'chat') {
                // 🧠 Détection automatique de complexité
                const complexityInfo = this._detectComplexity(userMessage, intentData, toolResults);
                maxTokens = complexityInfo.tokens;
                console.log(`🧠 Claude - Complexité détectée: ${complexityInfo.level} → ${maxTokens} tokens`);
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

🎨 TAGS MULTIMÉDIAS DISPONIBLES:
Enrichis tes réponses et briefings avec:
- [STOCKCARD:TICKER] → Carte boursière professionnelle (prix, métriques clés, mini-chart)
- [RATIO_CHART:TICKER:METRIC] → Évolution historique de ratios (PE, ROE, PROFIT_MARGIN, DEBT_EQUITY, etc.)
- [CHART:FINVIZ:TICKER] → Graphique technique
- [CHART:TRADINGVIEW:EXCHANGE:TICKER] → Widget TradingView interactif
- [LOGO:TICKER] → Logo de l'entreprise

Exemples:
- "Performance de MGA: [STOCKCARD:MGA]"
- "Historique P/E d'Apple: [RATIO_CHART:AAPL:PE]"
- "Marge bénéficiaire de Microsoft: [RATIO_CHART:MSFT:PROFIT_MARGIN]"

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
     */
    _generateFallbackResponse(userMessage, toolResults, outputMode = 'chat') {
        const successfulResults = toolResults.filter(r => r.success && r.data);

        if (successfulResults.length === 0) {
            if (outputMode === 'data') {
                return '{}';
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

        // Mode CHAT ou BRIEFING: retourner texte formaté
        let response = "Voici les informations que j'ai pu récupérer :\n\n";

        successfulResults.forEach(result => {
            response += `**${result.tool_id}**: ${JSON.stringify(result.data, null, 2)}\n\n`;
        });

        response += "Note: Cette réponse est basée uniquement sur les données disponibles. Pour une analyse plus approfondie, veuillez reformuler votre question.";

        return response;
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
     * Mise à jour des statistiques d'outil
     */
    _updateToolStats(toolId, success, executionTime, errorMessage = null) {
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
    }

    /**
     * Chargement de la configuration des outils
     */
    _loadToolsConfig() {
        try {
            const configPath = path.join(process.cwd(), 'config', 'tools_config.json');
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (error) {
            console.error('❌ Failed to load tools config:', error);
            return { tools: [], config: {} };
        }
    }

    /**
     * Chargement des statistiques d'utilisation
     */
    _loadUsageStats() {
        try {
            const statsPath = path.join(process.cwd(), 'config', 'usage_stats.json');
            return JSON.parse(fs.readFileSync(statsPath, 'utf8'));
        } catch (error) {
            console.error('❌ Failed to load usage stats:', error);
            return {};
        }
    }

    /**
     * Sauvegarde des statistiques d'utilisation
     */
    _saveUsageStats() {
        try {
            const statsPath = path.join(process.cwd(), 'config', 'usage_stats.json');
            fs.writeFileSync(statsPath, JSON.stringify(this.usageStats, null, 2));
        } catch (error) {
            console.error('❌ Failed to save usage stats:', error);
        }
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
