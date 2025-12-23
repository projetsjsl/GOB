/**
 * ORCHESTRATOR API ENDPOINT
 * 
 * REST API for the Multi-Agent Orchestrator.
 * Provides a unified interface for all AI capabilities.
 * 
 * Endpoints:
 * - POST /api/orchestrator - Process a request through orchestrator
 * - GET /api/orchestrator - Get orchestrator status
 * - GET /api/orchestrator?action=personas - List available personas
 * - GET /api/orchestrator?action=models - List available models
 * 
 * Usage from frontend:
 *   fetch('/api/orchestrator', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({
 *       message: "Analyse AAPL",
 *       persona: "finance",
 *       options: { comprehensive: true }
 *     })
 *   })
 */

import { MasterOrchestrator } from '../lib/orchestrator/master-orchestrator.js';
import { PersonaManager } from '../lib/orchestrator/persona-manager.js';
import { ModelSelectorAgent } from '../lib/orchestrator/model-selector-agent.js';

// Singleton instances
let orchestrator = null;
let personaManager = null;
let modelSelector = null;

// Initialize on first request
function ensureInitialized() {
    if (!orchestrator) {
        orchestrator = new MasterOrchestrator();
        personaManager = new PersonaManager();
        modelSelector = new ModelSelectorAgent();
        console.log('✅ Orchestrator API initialized');
    }
}

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    ensureInitialized();

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
                        current: personaManager.getCurrentPersona().id
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
                        taskType
                    });

                case 'status':
                default:
                    // Get orchestrator status
                    return res.status(200).json({
                        success: true,
                        status: orchestrator.getStatus(),
                        timestamp: new Date().toISOString()
                    });
            }
        }

        // =========================================================
        // POST REQUESTS - Process messages
        // =========================================================
        if (req.method === 'POST') {
            const { message, persona, options, tickers, channel } = req.body;

            if (!message) {
                return res.status(400).json({
                    success: false,
                    error: 'Message is required'
                });
            }

            // Build context from request
            const context = {
                persona: persona || null,  // Let orchestrator auto-select if not specified
                channel: channel || 'web',
                tickers: tickers || [],
                comprehensive: options?.comprehensive || false,
                ...options
            };

            console.log(`\n📨 [Orchestrator API] Request received`);
            console.log(`   Message: ${message.substring(0, 50)}...`);
            console.log(`   Persona: ${persona || 'auto'}`);

            // Process through orchestrator
            const result = await orchestrator.process(message, context);

            // Return response
            return res.status(200).json({
                success: result.success,
                response: result.response,
                persona: result.persona,
                model: result.model,
                agents: result.agents,
                duration: result.duration,
                timestamp: result.timestamp,
                error: result.error || null
            });
        }

        // Method not allowed
        return res.status(405).json({
            success: false,
            error: 'Method not allowed. Use GET or POST.'
        });

    } catch (error) {
        console.error('❌ [Orchestrator API] Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * USAGE EXAMPLES:
 * 
 * 1. Get orchestrator status:
 *    GET /api/orchestrator
 * 
 * 2. List available personas:
 *    GET /api/orchestrator?action=personas
 * 
 * 3. Get recommended model for a task:
 *    GET /api/orchestrator?action=models&taskType=research
 * 
 * 4. Process a message (auto persona):
 *    POST /api/orchestrator
 *    { "message": "Analyse AAPL" }
 * 
 * 5. Process with specific persona:
 *    POST /api/orchestrator
 *    { "message": "Trouve les risques", "persona": "critic" }
 * 
 * 6. Process with options:
 *    POST /api/orchestrator
 *    {
 *      "message": "Analyse complète Tesla",
 *      "persona": "finance",
 *      "options": { "comprehensive": true },
 *      "tickers": ["TSLA"],
 *      "channel": "web"
 *    }
 */
