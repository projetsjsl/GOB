/**
 * MODEL SELECTOR AGENT - Enhanced with Skepticism & Real-Time Data
 * 
 * CORE PRINCIPLES:
 * 1. SKEPTICISM: Always verify information with 2+ sources when possible
 * 2. REAL-TIME DATA: Prioritize models with web search for financial data
 * 3. CORROBORATION: Use multi-model queries for critical decisions
 * 4. FRESHNESS: Detect when real-time/intraday data is crucial
 * 
 * Models with Real-Time Capabilities:
 * - Perplexity Sonar/Sonar Pro/Sonar Reasoning Pro (web search)
 * - Gemini with Google Search (when enabled)
 * 
 * Integrates with lib/llm-registry.js for model configurations.
 */

import { BaseAgent } from './base-agent.js';

// Try to import, but fallback gracefully
let getAllModels, getModelById;
try {
    const registry = await import('../llm-registry.js');
    getAllModels = registry.getAllModels;
    getModelById = registry.getModelById;
} catch (e) {
    console.warn('⚠️ [ModelSelector] LLM Registry not available, using defaults');
}

// Fallback models when Supabase is unavailable
// NOTE: Free Gemini models are prioritized as defaults to minimize costs
const DEFAULT_MODELS = [
    // FREE Gemini models first (default choice)
    { provider: 'google', model_id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash ⭐', max_tokens: 4096, temperature: 0.7, enabled: true, googleSearch: true, cost: 'free', isDefault: true },
    { provider: 'google', model_id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', max_tokens: 4096, temperature: 0.7, enabled: true, googleSearch: true, cost: 'free' },
    { provider: 'google', model_id: 'gemini-1.5-flash-latest', name: 'Gemini 1.5 Flash', max_tokens: 4096, temperature: 0.7, enabled: true, googleSearch: true, cost: 'free' },
    // Perplexity (has costs but good for real-time)
    { provider: 'perplexity', model_id: 'sonar-pro', name: 'Sonar Pro', max_tokens: 2000, temperature: 0.1, enabled: true, realtime: true, cost: 'low' },
    { provider: 'perplexity', model_id: 'sonar-reasoning-pro', name: 'Sonar Reasoning Pro', max_tokens: 2000, temperature: 0.1, enabled: true, realtime: true, cost: 'low' },
    // Qwen models (cost-effective alternatives)
    { provider: 'alibaba', model_id: 'qwen-turbo', name: 'Qwen Turbo', max_tokens: 1000000, temperature: 0.7, enabled: true, cost: 'low', description: 'Fast and economical model ideal for simple tasks' },
    { provider: 'alibaba', model_id: 'qwen-plus', name: 'Qwen Plus', max_tokens: 131000, temperature: 0.7, enabled: true, cost: 'medium', description: 'Balanced performance for complex reasoning tasks' },
    { provider: 'alibaba', model_id: 'qwen-max', name: 'Qwen Max', max_tokens: 33000, temperature: 0.7, enabled: true, cost: 'medium', description: 'Powerful model for complex, multi-step tasks' },
    { provider: 'alibaba', model_id: 'qwen3-coder-flash', name: 'Qwen3 Coder Flash', max_tokens: 1000000, temperature: 0.7, enabled: true, cost: 'low', description: 'Optimized for code generation and programming tasks' },
    { provider: 'alibaba', model_id: 'qwen3-max', name: 'Qwen3 Max', max_tokens: 262000, temperature: 0.7, enabled: true, cost: 'medium', description: 'Latest generation with advanced reasoning capabilities' },
    // Other models (paid - user can choose if needed)
    { provider: 'openai', model_id: 'gpt-4o', name: 'GPT-4o', max_tokens: 4096, temperature: 0.7, enabled: true, cost: 'medium' },
    { provider: 'anthropic', model_id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', max_tokens: 4096, temperature: 0.7, enabled: true, cost: 'medium' }
    // NOTE: Gemini Pro models removed from defaults (expensive) - user can add via config if needed
];

// Helper to get models with fallback
async function getModelsWithFallback() {
    try {
        if (getAllModels) {
            return await getAllModels();
        }
    } catch (e) {
        console.warn('⚠️ [ModelSelector] Failed to fetch models from registry, using defaults');
    }
    return DEFAULT_MODELS;
}


export class ModelSelectorAgent extends BaseAgent {
    constructor() {
        super('ModelSelectorAgent', [
            'select_model',
            'optimize_cost',
            'check_availability',
            'get_best_model',
            'detect_realtime_need',
            'get_corroboration_models'  // NEW: Multi-source validation
        ]);

        // =========================================================
        // SKEPTICISM SETTINGS
        // =========================================================
        this.skepticismConfig = {
            // Always require 2 sources for these task types
            requireCorroboration: [
                'stock_price',
                'market_data',
                'breaking_news',
                'earnings_data',
                'financial_metrics',
                'price_target'
            ],
            // Minimum sources for critical data
            minSources: 2,
            // Prefer models that cite sources
            prefersWithCitations: true
        };

        // =========================================================
        // REAL-TIME DATA DETECTION PATTERNS
        // =========================================================
        this.realtimePatterns = {
            // Time-sensitive keywords (French + English)
            urgentKeywords: [
                // French
                'aujourd\'hui', 'maintenant', 'en cours', 'live', 'temps réel',
                'ce matin', 'cet après-midi', 'à l\'instant', 'dernière heure',
                'breaking', 'urgent', 'flash', 'alerte',
                // English
                'today', 'now', 'current', 'live', 'real-time', 'realtime',
                'this morning', 'right now', 'breaking', 'latest', 'just'
            ],
            // Financial data that's time-sensitive
            financialKeywords: [
                'price', 'prix', 'cours', 'cotation', 'quote',
                'volume', 'bid', 'ask', 'spread',
                'pre-market', 'after-hours', 'premarket',
                'futures', 'contrats à terme',
                'earnings', 'résultats', 'bénéfices',
                'dividend', 'dividende', 'ex-div',
                'fed', 'fomc', 'bce', 'ecb', 'rate decision'
            ],
            // Market hours detection (ET timezone)
            marketHours: {
                usOpen: 9.5,   // 9:30 AM
                usClose: 16,   // 4:00 PM
                premarket: 4,  // 4:00 AM
                afterhours: 20 // 8:00 PM
            }
        };

        // Model scoring weights (enhanced)
        this.weights = {
            quality: 0.30,
            speed: 0.20,
            cost: 0.15,
            realtime: 0.25,  // NEW: Real-time capability weight
            citations: 0.10  // NEW: Citation capability weight
        };

        // Task type → Preferred providers
        this.taskPreferences = {
            // =======================================================
            // REAL-TIME DATA TASKS → PERPLEXITY OR GEMINI+SEARCH
            // =======================================================
            stock_price: ['perplexity'],       // MUST have real-time
            market_data: ['perplexity'],       // MUST have real-time
            breaking_news: ['perplexity'],     // MUST have real-time
            earnings_data: ['perplexity'],     // Time-sensitive
            forex: ['perplexity'],             // Real-time rates
            crypto: ['perplexity'],            // 24/7 markets

            // Research tasks need web search + citations
            research: ['perplexity', 'alibaba'],
            news: ['perplexity', 'alibaba'],
            fundamentals: ['perplexity', 'anthropic', 'alibaba'],

            // Analysis tasks need strong reasoning
            analysis: ['anthropic', 'openai', 'google', 'alibaba'],
            technical: ['google', 'openai', 'alibaba'],

            // Writing tasks need eloquence
            writing: ['anthropic', 'google', 'alibaba'],
            briefing: ['anthropic', 'openai', 'alibaba'],
            email: ['anthropic', 'google', 'alibaba'],

            // Fast responses
            chat: ['google', 'openai', 'alibaba'],
            quick_answer: ['google', 'alibaba'],

            // Code-related tasks
            coding: ['alibaba'],               // Qwen3 Coder Flash is optimized for coding
            programming: ['alibaba'],

            // Contrarian/critical analysis
            critic: ['anthropic', 'alibaba'],
            risk_analysis: ['anthropic', 'perplexity', 'alibaba']
        };

        // Model capabilities scores (0-1) - ENHANCED
        this.modelScores = {
            // =======================================================
            // PERPLEXITY - BEST FOR REAL-TIME DATA & CITATIONS
            // =======================================================
            'sonar-pro': { 
                quality: 0.9, 
                speed: 0.7, 
                cost: 0.6, 
                realtime: 1.0,      // ★ Native web search
                citations: 1.0,     // ★ Always cites sources
                webSearch: true 
            },
            'sonar-reasoning-pro': { 
                quality: 0.95, 
                speed: 0.6, 
                cost: 0.5, 
                realtime: 1.0,
                citations: 1.0,
                webSearch: true 
            },
            'sonar': { 
                quality: 0.7, 
                speed: 0.8, 
                cost: 0.8, 
                realtime: 1.0,
                citations: 1.0,
                webSearch: true 
            },
            
            // =======================================================
            // GEMINI - FAST + CAN ACTIVATE GOOGLE SEARCH
            // Free Flash models prioritized, Pro marked as expensive
            // =======================================================
            'gemini-2.5-flash': {  // ⭐ DEFAULT - Free + Google Search
                quality: 0.90,
                speed: 0.95,
                cost: 1.0,          // Free = highest cost score
                realtime: 0.85,
                citations: 0.7,
                googleSearch: true,
                isDefault: true
            },
            'gemini-2.0-flash-exp': {
                quality: 0.85,
                speed: 0.95,
                cost: 1.0,          // Free
                realtime: 0.8,
                citations: 0.6,
                googleSearch: true
            },
            'gemini-1.5-flash-latest': {
                quality: 0.82,
                speed: 0.95,
                cost: 1.0,          // Free
                realtime: 0.75,
                citations: 0.5,
                googleSearch: true
            },
            'gemini-3-pro-preview': {  // ⚠️ EXPENSIVE - avoid by default
                quality: 0.92,
                speed: 0.8,
                cost: 0.2,          // Low score = expensive
                realtime: 0.7,
                citations: 0.5,
                googleSearch: true,
                isExpensive: true
            },
            
            // =======================================================
            // OPENAI - BALANCED BUT NO REAL-TIME BY DEFAULT
            // =======================================================
            'gpt-4o': { 
                quality: 0.9, 
                speed: 0.85, 
                cost: 0.5, 
                realtime: 0.0,      // No native web search
                citations: 0.3,
                webSearch: false 
            },
            'gpt-4-turbo': { 
                quality: 0.92, 
                speed: 0.7, 
                cost: 0.4, 
                realtime: 0.0,
                citations: 0.3,
                webSearch: false 
            },
            'o1-preview': { 
                quality: 0.98, 
                speed: 0.3, 
                cost: 0.2, 
                realtime: 0.0,
                citations: 0.2,
                webSearch: false 
            },
            
            // =======================================================
            // ANTHROPIC - BEST FOR ANALYSIS BUT NO REAL-TIME
            // =======================================================
            'claude-3-5-sonnet-20241022': { 
                quality: 0.93, 
                speed: 0.8, 
                cost: 0.5, 
                realtime: 0.0,      // No web search
                citations: 0.4,     // Can reference knowledge cutoff
                webSearch: false 
            },
            'claude-3-opus-20240229': { 
                quality: 0.97, 
                speed: 0.5, 
                cost: 0.3, 
                realtime: 0.0,
                citations: 0.4,
                webSearch: false 
            },
            'claude-3-haiku-20240307': {
                quality: 0.75,
                speed: 0.95,
                cost: 0.9,
                realtime: 0.0,
                citations: 0.2,
                webSearch: false
            },

            // =======================================================
            // QWEN - COST-EFFECTIVE ALTERNATIVES
            // =======================================================
            'qwen-turbo': {
                quality: 0.75,
                speed: 0.95,
                cost: 0.95,          // Very economical
                realtime: 0.2,       // No native web search
                citations: 0.3,
                webSearch: false
            },
            'qwen-plus': {
                quality: 0.85,
                speed: 0.8,
                cost: 0.8,           // Cost-effective
                realtime: 0.2,
                citations: 0.4,
                webSearch: false
            },
            'qwen-max': {
                quality: 0.90,
                speed: 0.6,
                cost: 0.6,           // More expensive than Plus
                realtime: 0.2,
                citations: 0.5,
                webSearch: false
            },
            'qwen3-coder-flash': {
                quality: 0.80,
                speed: 0.90,
                cost: 0.9,           // Cost-effective for coding
                realtime: 0.2,
                citations: 0.3,
                webSearch: false
            },
            'qwen3-max': {
                quality: 0.92,
                speed: 0.7,
                cost: 0.7,           // Advanced model, higher cost
                realtime: 0.2,
                citations: 0.5,
                webSearch: false
            }
        };
    }

    async _executeInternal(task, context) {
        const { action, taskType, requirements, message } = task;

        switch (action) {
            case 'select_model':
                return this.selectBestModel(taskType, requirements, context, message);
            case 'optimize_cost':
                return this.optimizeForCost(taskType, requirements);
            case 'check_availability':
                return this.checkModelAvailability(requirements?.modelId);
            case 'get_best_model':
                return this.getBestModelForTask(taskType, context);
            case 'detect_realtime_need':
                return this.detectRealtimeNeed(message || taskType);
            case 'get_corroboration_models':
                return this.getCorroborationModels(taskType, requirements);
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }

    /**
     * =========================================================
     * REAL-TIME DATA DETECTION
     * Analyzes message to determine if real-time data is needed
     * =========================================================
     */
    detectRealtimeNeed(message) {
        if (!message) return { needsRealtime: false, confidence: 0, reason: 'No message' };

        const messageLower = message.toLowerCase();
        let score = 0;
        const triggers = [];

        // Check urgent keywords
        for (const keyword of this.realtimePatterns.urgentKeywords) {
            if (messageLower.includes(keyword)) {
                score += 0.3;
                triggers.push(`urgent keyword: "${keyword}"`);
            }
        }

        // Check financial keywords
        for (const keyword of this.realtimePatterns.financialKeywords) {
            if (messageLower.includes(keyword)) {
                score += 0.25;
                triggers.push(`financial keyword: "${keyword}"`);
            }
        }

        // Check for ticker symbols (uppercase 1-5 letter words)
        const tickerRegex = /\b[A-Z]{1,5}\b/g;
        const potentialTickers = messageLower.toUpperCase().match(tickerRegex);
        if (potentialTickers && potentialTickers.length > 0) {
            score += 0.2;
            triggers.push(`potential tickers: ${potentialTickers.slice(0, 3).join(', ')}`);
        }

        // Check if during market hours (simplified check)
        const now = new Date();
        const hour = now.getHours() + now.getMinutes() / 60;
        const isMarketHours = hour >= this.realtimePatterns.marketHours.usOpen && 
                              hour <= this.realtimePatterns.marketHours.usClose;
        
        if (isMarketHours) {
            score += 0.15;
            triggers.push('within market hours');
        }

        // Cap at 1.0
        const confidence = Math.min(score, 1.0);
        const needsRealtime = confidence >= 0.3;

        console.log(`🕐 [ModelSelector] Real-time detection: ${needsRealtime ? 'NEEDED' : 'not needed'} (confidence: ${(confidence * 100).toFixed(0)}%)`);

        return {
            needsRealtime,
            confidence,
            triggers,
            reason: triggers.length > 0 
                ? `Detected: ${triggers.slice(0, 3).join(', ')}` 
                : 'No real-time indicators found'
        };
    }

    /**
     * =========================================================
     * MULTI-SOURCE CORROBORATION
     * Returns 2+ models to query for skeptical verification
     * =========================================================
     */
    async getCorroborationModels(taskType, requirements = {}) {
        console.log(`🔍 [ModelSelector] Getting corroboration models for: ${taskType}`);

        const allModels = await getModelsWithFallback();
        const enabledModels = allModels.filter(m => m.enabled !== false);

        // Always include at least one web-search model for real-time data
        const realtimeModels = enabledModels.filter(m => 
            this.modelScores[m.model_id]?.realtime >= 0.8
        );

        // Get one reasoning model for analysis
        const reasoningModels = enabledModels.filter(m =>
            this.modelScores[m.model_id]?.quality >= 0.9 &&
            !this.modelScores[m.model_id]?.realtime
        );

        // Build corroboration set
        const corroborationSet = [];

        // Primary: Best real-time model
        if (realtimeModels.length > 0) {
            corroborationSet.push({
                role: 'primary_data',
                model: realtimeModels[0],
                reason: 'Real-time web search for fresh data',
                purpose: 'fetch_current_data'
            });
        }

        // Secondary: Second real-time model (different provider if possible)
        const secondRealtime = realtimeModels.find(m => 
            m.provider !== realtimeModels[0]?.provider
        ) || realtimeModels[1];
        
        if (secondRealtime) {
            corroborationSet.push({
                role: 'verification',
                model: secondRealtime,
                reason: 'Cross-verify data from different source',
                purpose: 'verify_data'
            });
        }

        // Tertiary: Reasoning model for analysis (if needed)
        if (requirements.includeAnalysis && reasoningModels.length > 0) {
            corroborationSet.push({
                role: 'analysis',
                model: reasoningModels[0],
                reason: 'Deep analysis and interpretation',
                purpose: 'analyze_data'
            });
        }

        const result = {
            corroborationRequired: this.skepticismConfig.requireCorroboration.includes(taskType),
            minSources: this.skepticismConfig.minSources,
            models: corroborationSet,
            strategy: corroborationSet.length >= 2 
                ? 'MULTI_SOURCE_VERIFICATION' 
                : 'SINGLE_SOURCE_WITH_CAUTION',
            warning: corroborationSet.length < 2 
                ? '⚠️ Unable to provide multi-source verification' 
                : null
        };

        console.log(`✅ [ModelSelector] Corroboration strategy: ${result.strategy} (${corroborationSet.length} sources)`);
        
        return result;
    }

    /**
     * Select the best model for a given task type - ENHANCED
     */
    async selectBestModel(taskType, requirements = {}, context = {}, message = '') {
        console.log(`🎯 [ModelSelector] Selecting model for task: ${taskType}`);

        // =========================================================
        // STEP 1: Detect if real-time data is needed
        // =========================================================
        const realtimeAnalysis = this.detectRealtimeNeed(message || taskType);
        const needsRealtime = realtimeAnalysis.needsRealtime || requirements.needsRealtime;

        if (needsRealtime) {
            console.log(`⚡ [ModelSelector] Real-time data REQUIRED - prioritizing Perplexity/Gemini`);
        }

        // =========================================================
        // STEP 2: Get available models
        // =========================================================
        const allModels = await getModelsWithFallback();
        const enabledModels = allModels.filter(m => m.enabled !== false);

        // =========================================================
        // STEP 3: Filter by preferences and requirements
        // =========================================================
        const preferredProviders = needsRealtime 
            ? ['perplexity', 'google']  // Force real-time providers
            : (this.taskPreferences[taskType] || ['google', 'openai', 'anthropic', 'perplexity']);

        let candidates = enabledModels.filter(m => 
            preferredProviders.includes(m.provider)
        );

        // If real-time needed, ONLY use models with real-time capability
        if (needsRealtime) {
            candidates = candidates.filter(m => 
                this.modelScores[m.model_id]?.realtime >= 0.7
            );
        }

        // Fallback if no candidates
        if (candidates.length === 0) {
            candidates = enabledModels;
        }

        // Apply other requirements
        if (requirements.needsWebSearch) {
            candidates = candidates.filter(m => 
                this.modelScores[m.model_id]?.webSearch === true
            );
        }

        // =========================================================
        // STEP 4: Score and rank candidates
        // =========================================================
        const scored = candidates.map(model => {
            const scores = this.modelScores[model.model_id] || { 
                quality: 0.7, speed: 0.7, cost: 0.7, realtime: 0, citations: 0.3 
            };
            
            // Adjust weights based on context
            let weights = { ...this.weights };
            
            // If real-time needed, boost realtime weight significantly
            if (needsRealtime) {
                weights.realtime = 0.45;
                weights.quality = 0.25;
                weights.speed = 0.15;
                weights.cost = 0.10;
                weights.citations = 0.05;
            }

            if (requirements.prioritizeCost) weights.cost = 0.5;
            if (requirements.prioritizeQuality) weights.quality = 0.5;
            if (requirements.prioritizeSpeed) weights.speed = 0.5;

            // Normalize weights
            const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
            for (const key in weights) {
                weights[key] /= totalWeight;
            }

            const totalScore = 
                (scores.quality || 0) * weights.quality +
                (scores.speed || 0) * weights.speed +
                (scores.cost || 0) * weights.cost +
                (scores.realtime || 0) * weights.realtime +
                (scores.citations || 0) * weights.citations;

            return {
                model,
                scores,
                totalScore,
                reason: this.explainSelection(model, scores, taskType, needsRealtime)
            };
        });

        // Sort by score descending
        scored.sort((a, b) => b.totalScore - a.totalScore);

        // =========================================================
        // STEP 5: Return best model with metadata
        // =========================================================
        if (scored.length === 0) {
            console.warn('⚠️ [ModelSelector] No suitable models found, using default');
            return {
                model_id: 'sonar-pro',  // Default to Perplexity for safety
                provider: 'perplexity',
                reason: 'Default fallback - Perplexity for real-time capability',
                fallback: true,
                needsRealtime,
                realtimeAnalysis
            };
        }

        const selected = scored[0];
        console.log(`✅ [ModelSelector] Selected: ${selected.model.model_id} (score: ${selected.totalScore.toFixed(2)})`);

        // Get corroboration recommendation if needed
        let corroboration = null;
        if (this.skepticismConfig.requireCorroboration.includes(taskType)) {
            corroboration = await this.getCorroborationModels(taskType, requirements);
        }

        return {
            model_id: selected.model.model_id,
            provider: selected.model.provider,
            max_tokens: selected.model.max_tokens || 4000,
            temperature: selected.model.temperature || 0.3,
            score: selected.totalScore,
            reason: selected.reason,
            needsRealtime,
            realtimeAnalysis,
            hasWebSearch: selected.scores.webSearch || selected.scores.googleSearch || false,
            hasCitations: selected.scores.citations >= 0.8,
            corroboration,  // Multi-source verification recommendation
            alternatives: scored.slice(1, 3).map(s => ({
                model_id: s.model.model_id,
                score: s.totalScore,
                provider: s.model.provider
            })),
            skepticismNote: this.skepticismConfig.requireCorroboration.includes(taskType)
                ? '⚠️ This task type requires verification from multiple sources'
                : null
        };
    }

    /**
     * Optimize model selection for cost
     */
    async optimizeForCost(taskType, requirements = {}) {
        return this.selectBestModel(taskType, {
            ...requirements,
            prioritizeCost: true
        });
    }

    /**
     * Get best model for a task with detailed reasoning
     */
    async getBestModelForTask(taskType, context = {}) {
        // Check if there's a persona override
        if (context.persona) {
            const personaModelMap = {
                finance: 'sonar-pro',       // Real-time for finance
                critic: 'claude-3-5-sonnet-20241022',
                researcher: 'sonar-reasoning-pro',  // Real-time + reasoning
                writer: 'claude-3-5-sonnet-20241022',
                geek: 'gemini-3-flash-preview',
                ceo: 'claude-3-opus-20240229',
                macro: 'sonar-pro',          // Real-time for macro
                // Qwen-specific personas
                coder: 'qwen3-coder-flash',  // Optimized for coding tasks
                costconscious: 'qwen-turbo', // Economical option
                balanced: 'qwen-plus'        // Balanced performance
            };

            if (personaModelMap[context.persona]) {
                return {
                    model_id: personaModelMap[context.persona],
                    reason: `Persona ${context.persona} prefers this model`,
                    source: 'persona_override'
                };
            }
        }

        return this.selectBestModel(taskType, {}, context);
    }

    /**
     * Check if a specific model is available
     */
    async checkModelAvailability(modelId) {
        const allModels = await getModelsWithFallback();
        const model = allModels.find(m => m.model_id === modelId);

        return {
            available: !!model && model.enabled !== false,
            model: model || null,
            alternativeIfUnavailable: model ? null : 'sonar-pro'
        };
    }

    /**
     * Generate explanation for model selection - ENHANCED
     */
    explainSelection(model, scores, taskType, needsRealtime = false) {
        const reasons = [];

        if (needsRealtime && scores.realtime >= 0.8) {
            reasons.push('✅ REAL-TIME DATA: Native web search');
        }

        if (scores.webSearch) {
            reasons.push('web search enabled');
        }

        if (scores.googleSearch) {
            reasons.push('Google Search grounding');
        }

        if (scores.citations >= 0.8) {
            reasons.push('provides citations');
        }

        if (scores.quality >= 0.9) {
            reasons.push('high quality output');
        }

        if (scores.speed >= 0.9) {
            reasons.push('fast response');
        }

        const preferredFor = Object.entries(this.taskPreferences)
            .filter(([_, providers]) => providers.includes(model.provider))
            .map(([task, _]) => task)
            .slice(0, 2);

        if (preferredFor.length > 0) {
            reasons.push(`best for ${preferredFor.join(', ')}`);
        }

        return reasons.length > 0 
            ? reasons.join(' | ')
            : `General purpose model for ${taskType}`;
    }
}

export default ModelSelectorAgent;
