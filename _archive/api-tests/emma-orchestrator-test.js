/**
 * Emma Orchestrator Test Endpoint
 *
 * Endpoint de test POC pour tester le nouveau système d'orchestration avec Perplexity
 *
 * Usage:
 * POST /api/emma-orchestrator-test
 * {
 *   "message": "Analyse AAPL",
 *   "channel": "web",
 *   "comprehensive": true
 * }
 */

import { EmmaOrchestrator } from '../lib/emma-orchestrator.js';

export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Seul POST est accepté
    if (req.method !== 'POST') {
        return res.status(405).json({
            error: 'Method not allowed',
            message: 'Use POST method with JSON body: { "message": "...", "channel": "web" }'
        });
    }

    try {
        const { message, channel = 'web', comprehensive = false } = req.body;

        if (!message) {
            return res.status(400).json({
                error: 'Missing message',
                message: 'Request body must include "message" field'
            });
        }

        console.log('🧪 [ORCHESTRATOR TEST] Processing:', message);

        // Créer instance d'orchestrateur
        const orchestrator = new EmmaOrchestrator();

        // Traiter la requête
        const startTime = Date.now();
        const result = await orchestrator.process(message, {
            channel,
            comprehensive
        });
        const totalLatency = Date.now() - startTime;

        console.log('✅ [ORCHESTRATOR TEST] Completed:', {
            success: result.success,
            cost: result.cost?.total || 0,
            latency: totalLatency,
            toolsUsed: result.toolsUsed?.length || 0
        });

        // Retourner résultat avec métriques
        return res.status(200).json({
            success: true,
            response: result.response,
            metadata: {
                citations: result.citations || [],
                cost: result.cost || { total: 0 },
                latency: totalLatency,
                toolsUsed: result.toolsUsed || [],
                model: result.model || 'perplexity-sonar-pro',
                conversational: result.conversational || false
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ [ORCHESTRATOR TEST] Error:', error);

        return res.status(500).json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * Tests de smoke à exécuter:
 *
 * 1. Politesse simple (réponse directe, pas de LLM):
 *    POST { "message": "merci" }
 *    Attendu: Réponse directe, cost = 0
 *
 * 2. Demande d'aide:
 *    POST { "message": "skills" }
 *    Attendu: Liste des capacités, cost = 0
 *
 * 3. Salutation:
 *    POST { "message": "Bonjour Emma" }
 *    Attendu: Intro personnalisée via Perplexity
 *
 * 4. Analyse simple:
 *    POST { "message": "Analyse AAPL" }
 *    Attendu: 3-5 outils, réponse complète
 *
 * 5. Analyse complète:
 *    POST { "message": "Analyse complète MSFT", "comprehensive": true }
 *    Attendu: 7 outils essentiels, toutes les métriques
 *
 * 6. Questions multiples:
 *    POST { "message": "Nouvelles récentes sur TSLA" }
 *    Attendu: Outils news, réponse focused
 *
 * 7. Coréférence (nécessite historique):
 *    POST { "message": "et son dividende?" }
 *    Attendu: Utilise lastTickers de l'historique
 */
