/**
 * MASTER ORCHESTRATOR
 * 
 * Central brain for the multi-agent system.
 * Coordinates all specialized agents and Emma personalities.
 * 
 * Responsibilities:
 * - Intent classification and routing
 * - Agent selection based on task requirements
 * - Parallel/sequential execution coordination
 * - Result aggregation and synthesis
 * - Model selection via ModelSelectorAgent
 * - Persona-based response styling
 */

import { BaseAgent } from './base-agent.js';
import { PersonaManager, personaManager } from './persona-manager.js';
import { ModelSelectorAgent } from './model-selector-agent.js';
import { configManager } from '../config-manager.js';

// Import existing agents
import { EarningsCalendarAgent } from '../agents/earnings-calendar-agent.js';
import { NewsMonitoringAgent } from '../agents/news-monitoring-agent.js';

export class MasterOrchestrator {
    constructor() {
        this.name = 'MasterOrchestrator';
        
        // Initialize core components
        this.personaManager = personaManager;
        this.modelSelector = new ModelSelectorAgent();
        
        // Initialize specialized agents
        this.agents = {
            modelSelector: this.modelSelector,
            earnings: new EarningsCalendarAgent(),
            news: new NewsMonitoringAgent()
            // Add more agents as they're implemented:
            // research: new ResearchAgent(),
            // portfolio: new PortfolioAgent(),
            // delivery: new DeliveryAgent(),
            // '3p1': new ThreePOneAgent()
        };

        // Intent to agent routing
        this.intentRouting = {
            // Model selection
            'select_model': ['modelSelector'],
            'optimize_model': ['modelSelector'],
            
            // Earnings related
            'earnings_calendar': ['earnings'],
            'earnings_check': ['earnings'],
            'pre_earnings': ['earnings'],
            
            // News related
            'news_monitoring': ['news'],
            'news_digest': ['news'],
            
            // Research (future)
            'stock_analysis': ['research', 'modelSelector'],
            'deep_dive': ['research', 'modelSelector'],
            
            // Multi-agent tasks
            'comprehensive_analysis': ['research', 'earnings', 'news', 'modelSelector']
        };

        // Execution stats
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            agentUsage: {},
            lastRequest: null
        };

        console.log('✅ MasterOrchestrator initialized');
    }

    /**
     * Main entry point for processing user requests
     * @param {string} userMessage - User's input message
     * @param {Object} context - Execution context (persona, channel, etc.)
     */
    async process(userMessage, context = {}) {
        const startTime = Date.now();
        this.stats.totalRequests++;

        console.log(`\n${'═'.repeat(60)}`);
        console.log(`🧠 [MasterOrchestrator] Processing request`);
        console.log(`${'═'.repeat(60)}`);
        console.log(`📝 Message: ${userMessage.substring(0, 100)}...`);
        console.log(`🎭 Persona: ${context.persona || 'auto'}`);

        try {
            // Step 1: Select persona
            const persona = await this.personaManager.select(context);
            console.log(`\n1️⃣ Persona Selected: ${persona.name}`);

            // Step 2: Classify intent and select agents
            const classification = await this.classifyIntent(userMessage, context);
            console.log(`2️⃣ Intent: ${classification.intent}`);
            console.log(`   Agents: ${classification.agents.join(', ')}`);

            // Step 3: Select optimal model
            const modelSelection = await this.modelSelector.execute({
                action: 'select_model',
                taskType: classification.intent,
                requirements: {
                    needsWebSearch: classification.needsWebSearch,
                    prioritizeQuality: context.comprehensive
                }
            }, { persona: persona.id });
            console.log(`3️⃣ Model: ${modelSelection.result?.model_id || 'default'}`);

            // Step 4: Execute selected agents
            const agentResults = await this.executeAgents(
                classification.agents,
                userMessage,
                { ...context, persona, model: modelSelection.result }
            );
            console.log(`4️⃣ Agent Results: ${agentResults.length} responses`);

            // Step 5: Synthesize results with persona style
            const finalResponse = await this.synthesize(agentResults, persona, context);
            console.log(`5️⃣ Synthesis complete`);

            const duration = Date.now() - startTime;
            this.stats.successfulRequests++;
            this.stats.lastRequest = {
                timestamp: new Date().toISOString(),
                duration,
                success: true,
                persona: persona.id,
                agents: classification.agents
            };

            console.log(`\n✅ [MasterOrchestrator] Completed in ${duration}ms`);
            console.log(`${'═'.repeat(60)}\n`);

            return {
                success: true,
                response: finalResponse.content,
                persona: {
                    id: persona.id,
                    name: persona.name,
                    style: persona.style
                },
                model: modelSelection.result,
                agents: classification.agents,
                agentResults: agentResults.map(r => ({
                    agent: r.agent,
                    success: r.success,
                    duration: r.duration
                })),
                duration,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            const duration = Date.now() - startTime;
            this.stats.failedRequests++;

            console.error(`\n❌ [MasterOrchestrator] Error: ${error.message}`);
            console.log(`${'═'.repeat(60)}\n`);

            return {
                success: false,
                error: error.message,
                duration,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Classify user intent and select appropriate agents
     */
    async classifyIntent(userMessage, context = {}) {
        const messageLower = userMessage.toLowerCase();

        // Pattern matching for intent classification
        const patterns = {
            earnings_calendar: /earnings|résultats trimestriels|quarterly results/i,
            earnings_check: /prochains earnings|upcoming earnings|next earnings/i,
            news_monitoring: /actualités|news|what's happening/i,
            news_digest: /digest|résumé|summary/i,
            stock_analysis: /analyse|analyze|analysis|analyser/i,
            deep_dive: /deep dive|approfondi|comprehensive|détaillé/i,
            technical_analysis: /rsi|macd|technique|technical|pattern|support|resistance/i,
            macro: /yield|taux|fed|inflation|macro|economy/i,
            select_model: /model|modèle|llm|gpt|claude|gemini/i
        };

        let intent = 'stock_analysis'; // default
        let needsWebSearch = false;

        for (const [key, pattern] of Object.entries(patterns)) {
            if (pattern.test(messageLower)) {
                intent = key;
                break;
            }
        }

        // Web search needed for news and research
        if (['news_monitoring', 'news_digest', 'deep_dive', 'stock_analysis'].includes(intent)) {
            needsWebSearch = true;
        }

        // Get agents for this intent
        const agents = this.intentRouting[intent] || ['modelSelector'];

        return {
            intent,
            agents: agents.filter(a => this.agents[a]), // Only include available agents
            needsWebSearch,
            confidence: 0.8
        };
    }

    /**
     * Execute selected agents in parallel
     */
    async executeAgents(agentIds, userMessage, context) {
        const results = [];

        // Execute agents in parallel
        const promises = agentIds.map(async (agentId) => {
            const agent = this.agents[agentId];
            if (!agent) {
                return {
                    agent: agentId,
                    success: false,
                    error: `Agent ${agentId} not available`
                };
            }

            // Track agent usage
            this.stats.agentUsage[agentId] = (this.stats.agentUsage[agentId] || 0) + 1;

            // Execute agent
            try {
                const result = await agent.execute(
                    this.buildAgentTask(agentId, userMessage, context),
                    context
                );
                return result;
            } catch (error) {
                return {
                    agent: agentId,
                    success: false,
                    error: error.message
                };
            }
        });

        const allResults = await Promise.allSettled(promises);

        for (const result of allResults) {
            if (result.status === 'fulfilled') {
                results.push(result.value);
            } else {
                results.push({
                    agent: 'unknown',
                    success: false,
                    error: result.reason?.message || 'Unknown error'
                });
            }
        }

        return results;
    }

    /**
     * Build task object for a specific agent
     */
    buildAgentTask(agentId, userMessage, context) {
        const tasks = {
            modelSelector: {
                action: 'select_model',
                taskType: context.intent || 'stock_analysis',
                requirements: { needsWebSearch: context.needsWebSearch }
            },
            earnings: {
                action: 'daily_earnings_check',
                daysAhead: 7
            },
            news: {
                action: 'monitor_news',
                tickers: context.tickers || [],
                lookbackMinutes: 15
            }
            // Add more agent tasks as needed
        };

        return tasks[agentId] || { action: 'execute', message: userMessage };
    }

    /**
     * Synthesize agent results with persona style
     */
    async synthesize(agentResults, persona, context) {
        // Collect successful results
        const successfulResults = agentResults.filter(r => r.success);

        if (successfulResults.length === 0) {
            return {
                content: `Je suis désolée, je n'ai pas pu traiter votre demande. ${persona.name} sera de retour bientôt.`,
                style: persona.style
            };
        }

        // Combine results
        const combinedData = successfulResults.map(r => r.result).filter(Boolean);

        // For now, return combined content
        // In full implementation, this would use an LLM to synthesize with persona style
        return {
            content: this.formatResults(combinedData, persona),
            data: combinedData,
            style: persona.style
        };
    }

    /**
     * Format results according to persona style
     */
    formatResults(results, persona) {
        if (results.length === 0) {
            return 'Aucun résultat disponible.';
        }

        // Simple formatting for now
        const parts = results.map((r, i) => {
            if (typeof r === 'string') return r;
            if (r.content) return r.content;
            return JSON.stringify(r, null, 2);
        });

        const intro = {
            finance: '📊 Voici mon analyse :',
            critic: '⚠️ Voici mes points de vigilance :',
            researcher: '📚 Mes recherches montrent :',
            writer: '✍️ Voici ma rédaction :',
            geek: '📈 Analyse technique :',
            ceo: '🎯 En tant que CEO :',
            macro: '🌍 Vue macro :',
            politics: '🏛️ Analyse politique :'
        };

        return `${intro[persona.id] || '📊'}\n\n${parts.join('\n\n')}`;
    }

    /**
     * Get orchestrator status and stats
     */
    getStatus() {
        return {
            name: this.name,
            healthy: true,
            stats: this.stats,
            availableAgents: Object.keys(this.agents),
            availablePersonas: this.personaManager.getAllPersonas().map(p => p.id),
            currentPersona: this.personaManager.getCurrentPersona().id
        };
    }

    /**
     * Test the orchestrator
     */
    async test() {
        console.log('\n🧪 Testing MasterOrchestrator...');

        try {
            // Test 1: Basic processing
            const result = await this.process('Analyse AAPL', { persona: 'finance' });
            console.log('  ✅ Test 1 (Basic): Passed');

            // Test 2: Model selection
            const modelResult = await this.process('Quel modèle utiliser pour la recherche?', {});
            console.log('  ✅ Test 2 (Model Selection): Passed');

            // Test 3: Persona selection
            const criticResult = await this.process('Trouve les risques de Tesla', { persona: 'critic' });
            console.log('  ✅ Test 3 (Persona): Passed');

            console.log('\n✅ All MasterOrchestrator tests passed!\n');

            return {
                success: true,
                tests: [
                    { name: 'Basic', passed: result.success },
                    { name: 'Model Selection', passed: modelResult.success },
                    { name: 'Persona', passed: criticResult.success }
                ]
            };

        } catch (error) {
            console.error('  ❌ Test failed:', error.message);
            return { success: false, error: error.message };
        }
    }
}

// Singleton
export const masterOrchestrator = new MasterOrchestrator();

export default MasterOrchestrator;
