/**
 * EMMA N8N INTEGRATION API
 *
 * Endpoint unifié pour automation n8n.
 * Permet d'appeler tous les agents Emma via workflows n8n.
 *
 * Sécurité: Bearer token authentication (N8N_API_KEY)
 *
 * Actions disponibles:
 * 1. briefing - Générer briefing quotidien
 * 2. question - Poser une question à Emma
 * 3. portfolio - Analyser portefeuille
 * 4. initialize_earnings_calendar - Initialiser calendrier annuel
 * 5. daily_earnings_check - Vérification quotidienne earnings
 * 6. pre_earnings_analysis - Analyse pré-earnings
 * 7. poll_earnings_results - Polling résultats (15min)
 * 8. analyze_earnings_results - Analyser résultats spécifiques
 * 9. monitor_news - Surveiller actualités (15min)
 * 10. weekly_news_digest - Digest hebdomadaire
 *
 * Usage n8n:
 * POST /api/emma-n8n?action=<action>
 * Headers: Authorization: Bearer <N8N_API_KEY>
 * Body: JSON parameters specific to action
 */

import EarningsCalendarAgent from '../lib/agents/earnings-calendar-agent.js';
import EarningsResultsAgent from '../lib/agents/earnings-results-agent.js';
import NewsMonitoringAgent from '../lib/agents/news-monitoring-agent.js';

// Instances globales des agents
let earningsCalendarAgent = null;
let earningsResultsAgent = null;
let newsMonitoringAgent = null;

/**
 * Handler principal n8n
 */
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Vérifier authentification
    const authHeader = req.headers.authorization;
    const N8N_API_KEY = process.env.N8N_API_KEY;

    if (!N8N_API_KEY) {
        return res.status(503).json({
            success: false,
            error: 'N8N_API_KEY not configured in Vercel'
        });
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'Missing or invalid Authorization header'
        });
    }

    const token = authHeader.replace('Bearer ', '');

    if (token !== N8N_API_KEY) {
        return res.status(403).json({
            success: false,
            error: 'Invalid API key'
        });
    }

    // Initialiser agents si nécessaire
    if (!earningsCalendarAgent) {
        earningsCalendarAgent = new EarningsCalendarAgent();
        earningsResultsAgent = new EarningsResultsAgent();
        newsMonitoringAgent = new NewsMonitoringAgent();
    }

    // Router vers l'action demandée
    const action = req.query.action;

    if (!action) {
        return res.status(400).json({
            success: false,
            error: 'Missing action parameter'
        });
    }

    console.log(`📞 n8n API call: ${action}`);

    try {
        let result;

        switch (action) {
            // ========================================================================
            // ACTION 1: BRIEFING
            // ========================================================================
            case 'briefing':
                result = await handleBriefing(req.body);
                break;

            // ========================================================================
            // ACTION 2: QUESTION
            // ========================================================================
            case 'question':
                result = await handleQuestion(req.body);
                break;

            // ========================================================================
            // ACTION 3: PORTFOLIO
            // ========================================================================
            case 'portfolio':
                result = await handlePortfolio(req.body);
                break;

            // ========================================================================
            // ACTION 4: INITIALIZE EARNINGS CALENDAR
            // ========================================================================
            case 'initialize_earnings_calendar':
                result = await earningsCalendarAgent.initializeYearlyCalendar(
                    req.body.tickers,
                    req.body.year || new Date().getFullYear()
                );
                break;

            // ========================================================================
            // ACTION 5: DAILY EARNINGS CHECK
            // ========================================================================
            case 'daily_earnings_check':
                result = await earningsCalendarAgent.dailyEarningsCheck(
                    req.body.days_ahead || 7
                );
                break;

            // ========================================================================
            // ACTION 6: PRE-EARNINGS ANALYSIS
            // ========================================================================
            case 'pre_earnings_analysis':
                if (!req.body.ticker || !req.body.earnings_date) {
                    return res.status(400).json({
                        success: false,
                        error: 'Missing ticker or earnings_date'
                    });
                }

                result = await earningsCalendarAgent.preparePreEarningsAnalysis(
                    req.body.ticker,
                    req.body.earnings_date
                );
                break;

            // ========================================================================
            // ACTION 7: POLL EARNINGS RESULTS
            // ========================================================================
            case 'poll_earnings_results':
                result = await earningsResultsAgent.pollEarningsPublications(
                    req.body.tickers
                );
                break;

            // ========================================================================
            // ACTION 8: ANALYZE EARNINGS RESULTS
            // ========================================================================
            case 'analyze_earnings_results':
                if (!req.body.ticker || !req.body.earnings_data) {
                    return res.status(400).json({
                        success: false,
                        error: 'Missing ticker or earnings_data'
                    });
                }

                result = await earningsResultsAgent.analyzeEarningsResults(
                    req.body.ticker,
                    req.body.earnings_data
                );
                break;

            // ========================================================================
            // ACTION 9: MONITOR NEWS
            // ========================================================================
            case 'monitor_news':
                result = await newsMonitoringAgent.monitorNews(
                    req.body.tickers,
                    req.body.lookback_minutes || 15
                );
                break;

            // ========================================================================
            // ACTION 10: WEEKLY NEWS DIGEST
            // ========================================================================
            case 'weekly_news_digest':
                result = await newsMonitoringAgent.generateWeeklyDigest(
                    req.body.tickers
                );
                break;

            // ========================================================================
            // ACTION INCONNUE
            // ========================================================================
            default:
                return res.status(400).json({
                    success: false,
                    error: `Unknown action: ${action}`,
                    available_actions: [
                        'briefing',
                        'question',
                        'portfolio',
                        'initialize_earnings_calendar',
                        'daily_earnings_check',
                        'pre_earnings_analysis',
                        'poll_earnings_results',
                        'analyze_earnings_results',
                        'monitor_news',
                        'weekly_news_digest'
                    ]
                });
        }

        // Retourner résultat
        return res.status(200).json({
            success: true,
            action,
            timestamp: new Date().toISOString(),
            result
        });

    } catch (error) {
        console.error(`❌ n8n API error (${action}):`, error);
        return res.status(500).json({
            success: false,
            action,
            error: error.message
        });
    }
}

/**
 * Handle briefing generation
 * Utilise maintenant config/briefing-prompts.json comme /api/briefing
 */
async function handleBriefing(params) {
    const { readFileSync } = await import('fs');
    const { join, dirname } = await import('path');
    const { fileURLToPath } = await import('url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    // Charger la configuration depuis config/briefing-prompts.json
    let briefingType = params.type || 'morning';
    if (briefingType === 'noon') {
        briefingType = 'midday';
    }

    const validTypes = ['morning', 'midday', 'evening'];
    if (!validTypes.includes(briefingType)) {
        throw new Error(`Invalid briefing type: ${briefingType}. Must be one of: ${validTypes.join(', ')}`);
    }

    // Charger config
    const configPath = join(__dirname, '..', 'config', 'briefing-prompts.json');
    const configContent = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    const promptConfig = config[briefingType];

    if (!promptConfig) {
        throw new Error(`Configuration not found for type: ${briefingType}`);
    }

    // Utiliser le prompt depuis la config
    const prompt = promptConfig.prompt;
    const fullPrompt = params.tickers && params.tickers.length > 0
        ? `${prompt}\n\nFocus sur ces tickers: ${params.tickers.join(', ')}`
        : prompt;

    // Utiliser emma-agent existant pour briefings
    const { SmartAgent } = await import('./emma-agent.js');
    const agent = new SmartAgent();

    const context = {
        output_mode: 'briefing',
        briefing_type: briefingType,
        tickers: params.tickers || [],
        tools_priority: promptConfig.tools_priority || []
    };

    const result = await agent.processRequest(fullPrompt, context);

    return {
        briefing: result.response,
        tools_used: result.tools_used,
        execution_time_ms: result.execution_time_ms,
        type: briefingType,
        prompt_config: {
            name: promptConfig.name,
            tone: promptConfig.tone,
            length: promptConfig.length
        }
    };
}

/**
 * Handle question to Emma
 */
async function handleQuestion(params) {
    if (!params.question) {
        throw new Error('Missing question parameter');
    }

    const { SmartAgent } = await import('./emma-agent.js');
    const agent = new SmartAgent();

    const context = {
        output_mode: params.output_mode || 'chat',
        tickers: params.tickers || []
    };

    const result = await agent.processRequest(params.question, context);

    return {
        answer: result.response,
        intent: result.intent,
        confidence: result.confidence,
        tools_used: result.tools_used,
        execution_time_ms: result.execution_time_ms
    };
}

/**
 * Handle portfolio analysis
 */
async function handlePortfolio(params) {
    if (!params.tickers || params.tickers.length === 0) {
        throw new Error('Missing tickers parameter');
    }

    const { SmartAgent } = await import('./emma-agent.js');
    const agent = new SmartAgent();

    const message = `Analyse complète du portefeuille contenant: ${params.tickers.join(', ')}. Inclus performance, risques, diversification et recommandations.`;

    const context = {
        output_mode: 'chat',
        tickers: params.tickers
    };

    const result = await agent.processRequest(message, context);

    return {
        analysis: result.response,
        tickers_analyzed: params.tickers,
        tools_used: result.tools_used,
        execution_time_ms: result.execution_time_ms
    };
}
