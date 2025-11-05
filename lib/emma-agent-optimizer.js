/**
 * EMMA AGENT OPTIMIZER - Integration Layer
 *
 * Intègre Smart Router + Perplexity Optimizer avec l'agent existant
 * Sans casser le code actuel - Wrapper pattern
 */

import { SmartRouter } from './smart-router.js';
import { PerplexityOptimizer } from './perplexity-optimizer.js';

export class EmmaAgentOptimizer {
    constructor() {
        this.smartRouter = new SmartRouter();
        this.perplexityOptimizer = new PerplexityOptimizer();
    }

    /**
     * Optimise le flow existant de Emma Agent
     *
     * @param {Object} emmaAgent - Instance de SmartAgent existante
     * @param {string} userMessage - Message utilisateur
     * @param {Object} context - Contexte de la requête
     * @returns {Object} Résultat optimisé
     */
    async optimize(emmaAgent, userMessage, context = {}) {
        console.log('🚀 Emma Agent Optimizer: Starting optimization...');

        try {
            // ÉTAPE 1: Smart Routing (1-call vs 2-call decision)
            const routingDecision = await this.smartRouter.route(userMessage, context);

            console.log(`📊 Routing: ${routingDecision.decision.path}`);
            console.log(`💰 Estimated cost: $${routingDecision.decision.estimatedCost}`);
            console.log(`⏱️ Estimated time: ${routingDecision.decision.estimatedTime}ms`);

            // Update context with routing decision
            context.routing_decision = routingDecision.decision;
            context.intent_data = routingDecision.intentCheck;

            // PATH A: 1-CALL (80% des cas)
            if (routingDecision.decision.path === '1-call') {
                return await this._oneCallPath(emmaAgent, userMessage, context, routingDecision.intentCheck);
            }

            // PATH B: 2-CALL (20% des cas - clarification nécessaire)
            if (routingDecision.decision.path === '2-call') {
                return await this._twoCallPath(emmaAgent, userMessage, context, routingDecision.decision);
            }

            // Fallback
            return await this._oneCallPath(emmaAgent, userMessage, context, routingDecision.intentCheck);

        } catch (error) {
            console.error('❌ Optimizer error:', error);

            // Fallback: utiliser le flow classique de l'agent
            console.log('⚠️ Falling back to classic agent flow');
            return await emmaAgent.processRequest(userMessage, context);
        }
    }

    /**
     * PATH A: 1 CALL optimisé (80% des requêtes)
     */
    async _oneCallPath(emmaAgent, userMessage, context, intentCheck) {
        console.log('✅ 1-CALL PATH: Processing...');

        // 1. Sélection d'outils (utilise la logique existante de l'agent)
        const selectedTools = await emmaAgent._plan_with_scoring(userMessage, {
            ...context,
            extracted_tickers: intentCheck.tickers,
            suggested_tools: intentCheck.suggested_tools,
            intent: intentCheck.intent
        });

        console.log(`🔧 Selected ${selectedTools.length} tools:`, selectedTools.map(t => t.id));

        // 2. Exécution des outils en parallèle
        const toolResults = await emmaAgent._execute_all(selectedTools, userMessage, context);

        console.log(`⚡ Executed tools successfully`);

        // 3. Génération réponse avec Perplexity Optimizer
        const response = await this.perplexityOptimizer.synthesize({
            userMessage,
            intentData: intentCheck,
            toolResults,
            outputMode: context.output_mode || 'chat',
            conversationHistory: emmaAgent.conversationHistory || []
        });

        console.log('✨ Response generated with Perplexity Optimizer');

        // 4. Mise à jour historique (si agent le supporte)
        if (typeof emmaAgent._updateConversationHistory === 'function') {
            emmaAgent._updateConversationHistory(userMessage, response.response, toolResults);
        }

        return {
            success: true,
            response: response.response,
            citations: response.citations,
            validation: response.validation,
            tools_used: selectedTools.map(t => t.id),
            tool_results: toolResults,
            model: response.model,
            cost: response.cost,
            path: '1-call',
            optimization: {
                router_used: true,
                perplexity_optimizer_used: true,
                estimated_savings: '$0.021 (vs $0.042 before)'
            }
        };
    }

    /**
     * PATH B: 2 CALLS avec clarification (20% des requêtes)
     */
    async _twoCallPath(emmaAgent, userMessage, context, decision) {
        console.log('⚠️ 2-CALL PATH: Clarification needed');

        // Retourner la question de clarification à l'utilisateur
        return {
            success: true,
            needs_clarification: true,
            clarification: decision.clarificationQuestion,
            message: 'Clarification requise pour traiter votre demande',
            path: '2-call-step1',
            // L'utilisateur répond, puis on reprend avec handleClarification()
        };
    }

    /**
     * Handle clarification response (Step 2 du 2-call path)
     */
    async handleClarification(emmaAgent, originalMessage, clarificationAnswer, context = {}) {
        console.log('💬 2-CALL PATH: Processing clarification response...');

        // Update message avec clarification
        const enrichedContext = await this.smartRouter.handleClarificationResponse(
            originalMessage,
            clarificationAnswer,
            context.intent_data
        );

        // Continue avec 1-call path maintenant qu'on a la clarté
        return await this._oneCallPath(
            emmaAgent,
            enrichedContext.enrichedMessage,
            { ...context, clarified: true },
            enrichedContext.intentCheck
        );
    }

    /**
     * Statistiques de l'optimizer
     */
    getStats() {
        return {
            router: this.smartRouter.getStats(),
            perplexity: {
                required_metrics_count: Object.keys(this.perplexityOptimizer.REQUIRED_METRICS).length
            }
        };
    }
}

/**
 * Helper function pour utiliser l'optimizer facilement
 */
export async function optimizeEmmaRequest(emmaAgent, userMessage, context = {}) {
    const optimizer = new EmmaAgentOptimizer();
    return await optimizer.optimize(emmaAgent, userMessage, context);
}
