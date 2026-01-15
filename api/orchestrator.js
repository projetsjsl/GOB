/**
 * ORCHESTRATOR API ENDPOINT - Universal AI Entry Point
 * 
 * This is THE central API for all AI/chatbot interactions in GOB.
 * All prompts, chatbots, and AI features should use this endpoint.
 * 
 * Endpoints:
 * - POST /api/orchestrator - Process any AI request
 * - GET /api/orchestrator - Get orchestrator status
 * - GET /api/orchestrator?action=personas - List available personas
 * - GET /api/orchestrator?action=models - List available models
 * - GET /api/orchestrator?action=agents - List available agents
 * 
 * Universal Usage:
 *   // From ANY chatbot/prompt in the platform:
 *   const response = await fetch('/api/orchestrator', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({
 *       message: "Your prompt here",
 *       persona: "finance",  // Optional: auto-selected if omitted
 *       agent: "data",       // Optional: specific agent
 *       action: "get_stock_quote",  // Optional: specific action
 *       context: {}          // Optional: additional context
 *     })
 *   });
 */

import { applyCors } from './_middleware/emma-cors.js';
import { MasterOrchestrator } from '../lib/orchestrator/master-orchestrator.js';
import { PersonaManager } from '../lib/orchestrator/persona-manager.js';
import { ModelSelectorAgent } from '../lib/orchestrator/model-selector-agent.js';

// Singleton instances
let orchestrator = null;
let personaManager = null;
let modelSelector = null;
let agentsRegistered = false;

// Initialize on first request
async function ensureInitialized() {
    if (!orchestrator) {
        orchestrator = new MasterOrchestrator();
        personaManager = new PersonaManager();
        modelSelector = new ModelSelectorAgent();
        console.log(' [Orchestrator API] Core initialized');
    }
    
    // Register all agents (lazy load to avoid import issues)
    if (!agentsRegistered) {
        try {
            const { registerAllAgents } = await import('../lib/orchestrator/agent-registry.js');
            registerAllAgents(orchestrator);
            console.log(' [Orchestrator API] All agents registered');
        } catch (error) {
            console.warn(' [Orchestrator API] Agent registry not available:', error.message);
        } finally {
            agentsRegistered = true;
        }
    }
}

export default async function handler(req, res) {
    const handled = applyCors(req, res);
    if (handled) return;

    await ensureInitialized();

    try {
        // =========================================================
        // GET REQUESTS - Status and metadata
        // =========================================================
        if (req.method === 'GET') {
            const { action } = req.query;

            switch (action) {
                case 'personas':
                    // List all available personas
                    return res.status(200).json({
                        success: true,
                        personas: personaManager.getAllPersonas(),
                        current: personaManager.getCurrentPersona().id,
                        usage: 'POST with { "persona": "finance" } to use a specific persona'
                    });

                case 'models':
                    // Get model selection for a task type
                    const taskType = req.query.taskType || 'stock_analysis';
                    const modelResult = await modelSelector.execute({
                        action: 'select_model',
                        taskType,
                        requirements: {}
                    }, {});
                    
                    return res.status(200).json({
                        success: true,
                        recommended: modelResult.result,
                        taskType,
                        usage: 'Model is auto-selected based on task type'
                    });

                case 'agents':
                    // List all available agents
                    const agents = Object.entries(orchestrator.agents || {}).map(([key, agent]) => ({
                        id: key,
                        name: agent.name,
                        actions: agent.supportedActions || [],
                        status: agent.getStatus?.()?.status || 'ready'
                    }));
                    
                    return res.status(200).json({
                        success: true,
                        agents,
                        count: agents.length,
                        usage: 'POST with { "agent": "data", "action": "get_stock_quote", "ticker": "AAPL" }'
                    });

                case 'status':
                default:
                    // Get orchestrator status
                    return res.status(200).json({
                        success: true,
                        status: orchestrator.getStatus(),
                        version: '2.0',
                        features: [
                            '8 Emma personas',
                            'Multi-source skepticism',
                            'Real-time data priority',
                            'Specialized agents (earnings, news, data, briefing, SMS)',
                            'Workflow automation'
                        ],
                        timestamp: new Date().toISOString()
                    });
            }
        }

        // =========================================================
        // POST REQUESTS - Universal AI Entry Point
        // =========================================================
        if (req.method === 'POST') {
            const { 
                message,           // The prompt/message
                persona,           // Emma persona (finance, critic, writer, etc.)
                agent,             // Specific agent to call (optional)
                action,            // Agent action (optional)
                options,           // Additional options
                tickers,           // Relevant tickers
                channel,           // web, sms, email
                context,           // Additional context
                ...restParams      // Any additional parameters
            } = req.body;

            // Validate: need at least a message OR an agent action
            if (!message && !agent) {
                return res.status(400).json({
                    success: false,
                    error: 'Format de requete invalide. Un "message" (pour chat) ou un "agent" (pour action directe) est requis.',
                    usage: 'Consultez la documentation ou utilisez les exemples ci-dessous.',
                    examples: {
                        chat: { message: "Analyse AAPL", persona: "finance" },
                        agent: { agent: "data", action: "get_stock_quote", ticker: "AAPL" }
                    }
                });
            }

            console.log(`\n`);
            console.log(` [Orchestrator API] Request received`);
            console.log(`   Type: ${agent ? 'Agent Call' : 'Chat'}`);
            if (message && typeof message === 'string') console.log(`   Message: ${message.substring(0, 50)}...`);
            if (agent) console.log(`   Agent: ${agent}, Action: ${action}`);
            console.log(`   Persona: ${persona || 'auto'}`);
            console.log(``);

            let result;

            // =====================================================
            // CASE 1: Direct Agent Call
            // =====================================================
            if (agent && orchestrator.agents[agent]) {
                const targetAgent = orchestrator.agents[agent];
                const task = {
                    action: action || 'execute',
                    message,
                    ...restParams
                };
                
                result = await targetAgent.execute(task, { persona, channel, ...context });
                
                return res.status(200).json({
                    success: result.success !== false,
                    type: 'agent',
                    agent: agent,
                    action: action,
                    result: result.result || result,
                    duration: result.duration,
                    timestamp: new Date().toISOString()
                });
            }

            // =====================================================
            // CASE 2: Chat/Message Processing (main use case)
            // =====================================================
            const fullContext = {
                persona: persona || null,  // Let orchestrator auto-select if not specified
                channel: channel || 'web',
                tickers: tickers || [],
                comprehensive: options?.comprehensive || false,
                ...context,
                ...options
            };

            // Process through orchestrator
            result = await orchestrator.process(message, fullContext);

            // Return response
            return res.status(200).json({
                success: result.success,
                type: 'chat',
                response: result.response,
                persona: result.persona,
                model: result.model,
                agents: result.agents,
                metadata: {
                    duration: result.duration,
                    timestamp: result.timestamp,
                    realtimeUsed: result.realtimeAnalysis?.needsRealtime || false,
                    modelReason: result.modelReason || null
                },
                error: result.error || null
            });
        }

        // Method not allowed
        return res.status(405).json({
            success: false,
            error: 'Method not allowed',
            allowed: ['GET', 'POST'],
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error(' [Orchestrator API] Error:', error);
        return res.status(500).json({
            success: false,
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * 
 * UNIVERSAL USAGE GUIDE
 * 
 * 
 * This API is designed to be THE single entry point for all AI in GOB.
 * Use it from any chatbot, prompt, or AI feature.
 * 
 * 
 * CHAT MODE (Natural language processing)
 * 
 * 
 * 1. Simple chat (auto persona):
 *    POST /api/orchestrator
 *    { "message": "Analyse AAPL" }
 * 
 * 2. Chat with specific persona:
 *    POST /api/orchestrator
 *    { "message": "Quels sont les risques de TSLA?", "persona": "critic" }
 * 
 * 3. Chat with full options:
 *    POST /api/orchestrator
 *    {
 *      "message": "Analyse complete Tesla",
 *      "persona": "finance",
 *      "tickers": ["TSLA"],
 *      "channel": "web",
 *      "options": { "comprehensive": true }
 *    }
 * 
 * 
 * AGENT MODE (Direct agent calls)
 * 
 * 
 * 1. Get stock data:
 *    POST /api/orchestrator
 *    { "agent": "data", "action": "get_stock_quote", "ticker": "AAPL" }
 * 
 * 2. Get news:
 *    POST /api/orchestrator
 *    { "agent": "news", "action": "monitor_news", "tickers": ["AAPL", "MSFT"] }
 * 
 * 3. Get earnings:
 *    POST /api/orchestrator
 *    { "agent": "earnings", "action": "daily_earnings_check", "daysAhead": 7 }
 * 
 * 4. Send briefing:
 *    POST /api/orchestrator
 *    { "agent": "briefing", "action": "generate_morning_briefing" }
 * 
 * 5. Run workflow:
 *    POST /api/orchestrator
 *    { "agent": "workflow", "action": "execute_workflow", "workflowId": "morning_briefing" }
 * 
 * 
 * AVAILABLE PERSONAS
 * 
 * - finance   : Stock analysis, portfolio, dividends
 * - critic    : Risk analysis, skepticism, contrarian views
 * - researcher: Deep research, documentation, citations
 * - writer    : Briefings, emails, professional writing
 * - geek      : Technical analysis, charts, patterns
 * - ceo       : Strategic decisions, executive summary
 * - macro     : Macroeconomics, rates, global markets
 * - politics  : Policy impact, regulations, elections
 * 
 * 
 * FRONTEND INTEGRATION
 * 
 * 
 * // Load the client:
 * <script src="/js/orchestrator-client.js"></script>
 * 
 * // Use from any JavaScript:
 * const response = await window.orchestratorClient.ask("Analyse AAPL");
 * const financeResponse = await window.orchestratorClient.askFinance("TSLA valuation");
 * const newsData = await window.orchestratorClient.agent("news", "monitor_news", { tickers: ["AAPL"] });
 * 
 * 
 */
