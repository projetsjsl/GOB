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
                'polygon-stock-price': 'Prix actions (Polygon)',
                'fmp-fundamentals': 'Données fondamentales (FMP)',
                'finnhub-news': 'Actualités (Finnhub)',
                'twelve-data-technical': 'Indicateurs techniques',
                'alpha-vantage-ratios': 'Ratios financiers',
                'yahoo-finance': 'Yahoo Finance',
                'supabase-watchlist': 'Watchlist',
                'economic-calendar': 'Calendrier économique',
                'earnings-calendar': 'Calendrier résultats',
                'analyst-recommendations': 'Recommandations analystes'
            };

            const unavailableSources = failedToolsData.map(toolData => {
                const readableName = nameMapping[toolData.id] || toolData.id;
                return `${readableName} (${toolData.error})`;
            });

            return {
                success: true,
                response: finalResponse,
                tools_used: selectedTools.map(t => t.id),
                failed_tools: failedTools,
                unavailable_sources: unavailableSources,
                intent: intentData ? intentData.intent : 'unknown',
                confidence: intentData ? intentData.confidence : null,
                output_mode: context.output_mode || 'chat',
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

COMPANY NAME TO TICKER MAPPING (OBLIGATOIRE):
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
Disney → DIS
Coca-Cola → KO
McDonald's → MCD
Nike → NKE
Visa → V

⚠️ CRITIQUE: Utilise UNIQUEMENT ce mapping. Si "Apple" est mentionné, le ticker DOIT être "AAPL", jamais GOOGL!

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
1. Détermine l'INTENTION principale: stock_price, fundamentals, technical_analysis, news, portfolio_analysis, market_overview, calculation, comparative_analysis, comprehensive_analysis
2. Extrais les TICKERS mentionnés en utilisant STRICTEMENT le COMPANY NAME TO TICKER MAPPING ci-dessus
3. Détermine les OUTILS NÉCESSAIRES (1-5 outils max, par ordre de pertinence)
4. DEFAULT TO ACTION: Seulement demander clarification si VRAIMENT ambigu (confidence < 0.3 ET aucun ticker identifié)
5. Extrais PARAMÈTRES ADDITIONNELS (dates, périodes, types d'analyse)

⚠️ RÈGLE CRITIQUE - DEFAULT TO ACTION:
- "analyse [ticker]" → confidence HIGH (0.9+), intent: comprehensive_analysis, needs_clarification: false
- "prix [ticker]" → confidence HIGH (0.95+), intent: stock_price, needs_clarification: false
- "[ticker]" seul → confidence MEDIUM (0.7+), intent: stock_price + news, needs_clarification: false
- SEULEMENT clarifier si: (1) aucun ticker ET (2) intention vraiment floue ET (3) confidence < 0.3

EXEMPLES DE MAPPING CORRECT:
- "analyse msft" → tickers: ["MSFT"], intent: "comprehensive_analysis", confidence: 0.95, needs_clarification: false
- "Prix d'Apple" → tickers: ["AAPL"], intent: "stock_price", confidence: 0.95, needs_clarification: false
- "Analyse Microsoft et Google" → tickers: ["MSFT", "GOOGL"], intent: "comparative_analysis", confidence: 0.9, needs_clarification: false
- "Tesla vs Nvidia" → tickers: ["TSLA", "NVDA"], intent: "comparative_analysis", confidence: 0.9, needs_clarification: false
- "AAPL" seul → tickers: ["AAPL"], intent: "stock_price", confidence: 0.7, needs_clarification: false

RÉPONDS EN JSON UNIQUEMENT (pas de texte avant ou après):

EXEMPLE 1 - Analyse complète:
{
  "intent": "comprehensive_analysis",
  "confidence": 0.95,
  "tickers": ["MSFT"],
  "suggested_tools": ["fmp-fundamentals", "polygon-stock-price", "finnhub-news", "twelve-data-technical", "analyst-recommendations"],
  "parameters": {
    "analysis_type": "comprehensive"
  },
  "needs_clarification": false,
  "clarification_questions": [],
  "user_intent_summary": "L'utilisateur veut une analyse complète de Microsoft (fondamentaux, techniques, actualités)"
}

EXEMPLE 2 - Prix simple:
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
     * Génération de la réponse finale avec Perplexity (avec post-traitement selon mode)
     */
    async _generate_response(userMessage, toolResults, context, intentData = null) {
        try {
            const outputMode = context.output_mode || 'chat';
            console.log(`🎯 Generating response for mode: ${outputMode}`);

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
            let perplexityResponse = await this._call_perplexity(perplexityPrompt, outputMode);

            // Post-traitement selon le mode
            if (outputMode === 'data') {
                // Valider et parser le JSON
                perplexityResponse = this._validateAndParseJSON(perplexityResponse);
            } else if (outputMode === 'briefing') {
                // Nettoyer le Markdown (enlever éventuels artifacts)
                perplexityResponse = this._cleanMarkdown(perplexityResponse);
            }

            return perplexityResponse;

        } catch (error) {
            console.error('❌ Response generation failed:', error);

            // Réponse de fallback basée sur les données des outils
            return this._generateFallbackResponse(userMessage, toolResults, context.output_mode);
        }
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
     * Construction du prompt pour Perplexity (ROUTER - 3 MODES)
     */
    _buildPerplexityPrompt(userMessage, toolsData, conversationContext, context, intentData = null) {
        const outputMode = context.output_mode || 'chat'; // Default: chat
        console.log(`🎯 Building prompt for mode: ${outputMode}`);

        switch (outputMode) {
            case 'chat':
                return this._buildChatPrompt(userMessage, toolsData, conversationContext, intentData);

            case 'data':
                return this._buildDataPrompt(userMessage, toolsData, context);

            case 'briefing':
                return this._buildBriefingPrompt(userMessage, toolsData, context, intentData);

            default:
                console.warn(`⚠️ Unknown output_mode: ${outputMode}, fallback to chat`);
                return this._buildChatPrompt(userMessage, toolsData, conversationContext, intentData);
        }
    }

    /**
     * MODE CHAT: Réponse conversationnelle naturelle
     */
    _buildChatPrompt(userMessage, toolsData, conversationContext, intentData) {
        let intentContext = '';
        if (intentData) {
            intentContext = `\nINTENTION DÉTECTÉE:
- Type: ${intentData.intent}
- Confiance: ${(intentData.confidence * 100).toFixed(0)}%
- Résumé: ${intentData.user_intent_summary || 'Non spécifié'}
- Tickers identifiés: ${intentData.tickers?.join(', ') || 'aucun'}\n`;
        }

        return `Tu es Emma, l'assistante financière intelligente. Réponds en français de manière professionnelle et accessible.

CONTEXTE DE LA CONVERSATION:
${conversationContext.map(c => `- ${c.role}: ${c.content}`).join('\n')}
${intentContext}
DONNÉES DISPONIBLES DES OUTILS:
${toolsData.map(t => `- ${t.tool}: ${JSON.stringify(t.data, null, 2)}`).join('\n')}

QUESTION DE L'UTILISATEUR: ${userMessage}

INSTRUCTIONS:
1. Réponds de manière CONVERSATIONNELLE et NATURELLE - PAS de questions clarificatrices
2. Utilise UNIQUEMENT les données fournies par les outils (pas de données fictives)
3. Cite tes sources (outils utilisés) en fin de réponse
4. Sois précis mais accessible
5. Si les données sont insuffisantes, indique-le clairement
6. Adapte ton ton: professionnel mais chaleureux
${intentData ? `7. L'intention de l'utilisateur est: ${intentData.intent} - ${intentData.intent === 'comprehensive_analysis' ? 'fournis une analyse COMPLÈTE avec prix, fondamentaux, technique et actualités' : 'réponds en conséquence'}` : ''}
8. ❌ NE JAMAIS demander de clarifications supplémentaires - fournis directement l'analyse avec les données disponibles

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
        const briefingType = context.briefing_type || context.type || 'general';
        const importanceLevel = intentData?.importance_level || context.importance_level || 5;
        const trendingTopics = intentData?.trending_topics || [];

        return `Tu es Emma Financial Analyst. Rédige une analyse approfondie MULTIMÉDIA pour un briefing ${briefingType}.

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
     * Appel à l'API Perplexity
     */
    async _call_perplexity(prompt, outputMode = 'chat') {
        try {
            // Ajuster max_tokens selon le mode
            let maxTokens = 1000;  // Default pour chat
            if (outputMode === 'briefing') {
                maxTokens = 3000;  // Briefing détaillé: 1500-2000 mots nécessitent ~2500-3000 tokens
            } else if (outputMode === 'data') {
                maxTokens = 500;  // JSON structuré: court
            }

            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'sonar-pro',  // Modèle actuel Perplexity (puissant et rapide)
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
                    max_tokens: maxTokens,
                    temperature: outputMode === 'briefing' ? 0.5 : 0.7  // Plus déterministe pour briefings
                })
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
