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

class SmartAgent {
    constructor() {
        this.toolsConfig = this._loadToolsConfig();
        this.usageStats = this._loadUsageStats();
        this.conversationHistory = [];
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
            const finalResponse = await this._generate_response(userMessage, toolResults, context, intentData);
            console.log('✨ Final response generated');

            // 4. Mise à jour de l'historique
            this._updateConversationHistory(userMessage, finalResponse, toolResults);

            // 5. Sauvegarde des statistiques
            this._saveUsageStats();

            return {
                success: true,
                response: finalResponse,
                tools_used: selectedTools.map(t => t.id),
                intent: intentData ? intentData.intent : 'unknown',
                confidence: intentData ? intentData.confidence : null,
                execution_time_ms: Date.now() - (context.start_time || Date.now()),
                conversation_length: this.conversationHistory.length,
                is_reliable: toolResults.every(r => r.is_reliable)
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
     * Analyse d'intention avec Perplexity pour comprendre la demande
     */
    async _analyzeIntent(userMessage, context) {
        try {
            console.log('🧠 Starting intent analysis...');

            // Construire le prompt d'analyse d'intention
            const intentPrompt = `Analyse cette demande utilisateur et extrais les informations suivantes en JSON strict:

DEMANDE: "${userMessage}"

CONTEXTE DISPONIBLE:
- Tickers d'équipe: ${context.tickers?.join(', ') || 'aucun'}
- Données en cache: ${Object.keys(context.stockData || {}).join(', ') || 'aucunes'}

OUTILS DISPONIBLES:
- polygon-stock-price: Prix actions temps réel
- fmp-fundamentals: Données fondamentales (PE, revenus, marges)
- calculator: Calculs financiers (ratios, moyennes)
- twelve-data-technical: Indicateurs techniques (RSI, MACD, SMA)
- alpha-vantage-ratios: Ratios financiers avancés
- finnhub-news: Actualités financières
- supabase-watchlist: Watchlist Dan
- team-tickers: Tickers de l'équipe
- economic-calendar: Calendrier économique
- earnings-calendar: Calendrier des résultats
- analyst-recommendations: Recommandations d'analystes
- yahoo-finance: Fallback général

INSTRUCTIONS:
1. Détermine l'INTENTION principale: stock_price, fundamentals, technical_analysis, news, portfolio_analysis, market_overview, calculation, comparative_analysis
2. Extrais les TICKERS mentionnés (convertis "Apple" → "AAPL", "Tesla" → "TSLA", "Microsoft" → "MSFT", "Google" → "GOOGL", etc.)
3. Détermine les OUTILS NÉCESSAIRES (1-5 outils max, par ordre de pertinence)
4. Détecte si CLARIFICATION NÉCESSAIRE (confidence < 0.5 ou paramètres manquants)
5. Extrais PARAMÈTRES ADDITIONNELS (dates, périodes, types d'analyse)

RÉPONDS EN JSON UNIQUEMENT (pas de texte avant ou après):
{
  "intent": "stock_price",
  "confidence": 0.95,
  "tickers": ["AAPL"],
  "suggested_tools": ["polygon-stock-price", "finnhub-news"],
  "parameters": {
    "timeframe": "realtime",
    "analysis_type": "quick"
  },
  "needs_clarification": false,
  "clarification_questions": [],
  "user_intent_summary": "L'utilisateur veut le prix actuel d'Apple"
}`;

            // Appel Perplexity léger (sonar - rapide et économique)
            const response = await this._call_perplexity_intent(intentPrompt);

            // Parser le JSON (extraire le JSON de la réponse)
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.warn('⚠️ Intent analysis: No JSON found in response');
                return null;
            }

            const intentData = JSON.parse(jsonMatch[0]);
            console.log('✅ Intent analyzed:', intentData);

            return intentData;

        } catch (error) {
            console.error('❌ Intent analysis failed:', error.message);
            // Retombe gracieusement sur le scoring par mots-clés
            return null;
        }
    }

    /**
     * Appel Perplexity optimisé pour l'analyse d'intention
     * Utilise le modèle "sonar" (le plus rapide et économique)
     */
    async _call_perplexity_intent(prompt) {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'sonar',  // Modèle le plus rapide (pas online search)
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 500,  // Court pour intent analysis
                temperature: 0.1  // Très déterministe pour extraire JSON
            })
        });

        if (!response.ok) {
            throw new Error(`Perplexity intent API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
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
        
        // Extraction des paramètres depuis le message et le contexte
        if (tool.parameters.ticker && context.tickers) {
            params.ticker = context.tickers[0]; // Premier ticker par défaut
        }
        
        if (tool.parameters.operation && userMessage.toLowerCase().includes('calcul')) {
            params.operation = 'pe_ratio'; // Par défaut
        }
        
        if (tool.parameters.date) {
            params.date = new Date().toISOString().split('T')[0];
        }
        
        return params;
    }

    /**
     * Génération de la réponse finale avec Perplexity
     */
    async _generate_response(userMessage, toolResults, context, intentData = null) {
        try {
            // Préparation du contexte pour Perplexity
            const toolsData = toolResults
                .filter(r => r.success && r.data)
                .map(r => ({
                    tool: r.tool_id,
                    data: r.data
                }));

            const conversationContext = this.conversationHistory.slice(-5); // 5 derniers échanges

            const perplexityPrompt = this._buildPerplexityPrompt(
                userMessage,
                toolsData,
                conversationContext,
                context,
                intentData
            );

            // Appel à Perplexity
            const perplexityResponse = await this._call_perplexity(perplexityPrompt);

            return perplexityResponse;

        } catch (error) {
            console.error('❌ Response generation failed:', error);

            // Réponse de fallback basée sur les données des outils
            return this._generateFallbackResponse(userMessage, toolResults);
        }
    }

    /**
     * Construction du prompt pour Perplexity
     */
    _buildPerplexityPrompt(userMessage, toolsData, conversationContext, context, intentData = null) {
        // Ajouter contexte d'intention si disponible
        let intentContext = '';
        if (intentData) {
            intentContext = `\nINTENTION DÉTECTÉE:
- Type: ${intentData.intent}
- Confiance: ${(intentData.confidence * 100).toFixed(0)}%
- Résumé: ${intentData.user_intent_summary || 'Non spécifié'}
- Tickers identifiés: ${intentData.tickers?.join(', ') || 'aucun'}\n`;
        }

        let prompt = `Tu es Emma, l'assistante financière intelligente. Réponds en français de manière professionnelle et accessible.

CONTEXTE DE LA CONVERSATION:
${conversationContext.map(c => `- ${c.role}: ${c.content}`).join('\n')}
${intentContext}
DONNÉES DISPONIBLES DES OUTILS:
${toolsData.map(t => `- ${t.tool}: ${JSON.stringify(t.data, null, 2)}`).join('\n')}

QUESTION DE L'UTILISATEUR: ${userMessage}

INSTRUCTIONS:
1. Utilise UNIQUEMENT les données fournies par les outils (pas de données fictives)
2. Si les données sont insuffisantes, indique-le clairement
3. Sois précis et cite tes sources (outils utilisés)
4. Adapte ton ton selon le contexte (professionnel mais accessible)
5. Si c'est une question technique, sois détaillé
6. Si c'est une question générale, sois concis
${intentData ? `7. L'intention de l'utilisateur est: ${intentData.intent} - réponds en conséquence` : ''}

RÉPONSE:`;

        return prompt;
    }

    /**
     * Appel à l'API Perplexity
     */
    async _call_perplexity(prompt) {
        try {
            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.1-sonar-small-128k-online',
                    messages: [
                        {
                            role: 'system',
                            content: 'Tu es Emma, une assistante financière experte. Réponds toujours en français de manière professionnelle et accessible.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 1000,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                throw new Error(`Perplexity API error: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;

        } catch (error) {
            console.error('❌ Perplexity API error:', error);
            throw new Error('Erreur de communication avec Perplexity');
        }
    }

    /**
     * Réponse de fallback si Perplexity échoue
     */
    _generateFallbackResponse(userMessage, toolResults) {
        const successfulResults = toolResults.filter(r => r.success && r.data);
        
        if (successfulResults.length === 0) {
            return "Désolé, je n'ai pas pu récupérer de données fiables pour répondre à votre question. Veuillez réessayer.";
        }
        
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
