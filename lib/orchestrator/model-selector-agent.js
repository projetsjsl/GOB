/**
 * MODEL SELECTOR AGENT
 * 
 * Intelligent LLM model selection based on:
 * - Task type (analysis, writing, research, chat)
 * - Cost optimization (fallback to cheaper models)
 * - Latency requirements (fast vs comprehensive)
 * - Model availability and quota
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
const DEFAULT_MODELS = [
    { provider: 'perplexity', model_id: 'sonar-pro', name: 'Sonar Pro', max_tokens: 2000, temperature: 0.1, enabled: true },
    { provider: 'perplexity', model_id: 'sonar-reasoning-pro', name: 'Sonar Reasoning Pro', max_tokens: 2000, temperature: 0.1, enabled: true },
    { provider: 'google', model_id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', max_tokens: 4096, temperature: 0.7, enabled: true },
    { provider: 'google', model_id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', max_tokens: 4096, temperature: 0.7, enabled: true },
    { provider: 'openai', model_id: 'gpt-4o', name: 'GPT-4o', max_tokens: 4096, temperature: 0.7, enabled: true },
    { provider: 'anthropic', model_id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', max_tokens: 4096, temperature: 0.7, enabled: true }
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
            'get_best_model'
        ]);

        // Model scoring weights
        this.weights = {
            quality: 0.4,
            speed: 0.3,
            cost: 0.3
        };

        // Task type → Preferred providers
        this.taskPreferences = {
            // Research tasks need web search
            research: ['perplexity'],
            news: ['perplexity'],
            market_data: ['perplexity'],
            
            // Analysis tasks need strong reasoning
            analysis: ['anthropic', 'openai', 'google'],
            fundamentals: ['perplexity', 'anthropic'],
            technical: ['google', 'openai'],
            
            // Writing tasks need eloquence
            writing: ['anthropic', 'google'],
            briefing: ['anthropic', 'openai'],
            email: ['anthropic', 'google'],
            
            // Fast responses
            chat: ['google', 'openai'],
            quick_answer: ['google'],
            
            // Contrarian/critical analysis
            critic: ['anthropic'],
            risk_analysis: ['anthropic', 'perplexity']
        };

        // Model capabilities scores (0-1)
        this.modelScores = {
            // Perplexity - Best for real-time data
            'sonar-pro': { quality: 0.9, speed: 0.7, cost: 0.6, webSearch: true },
            'sonar-reasoning-pro': { quality: 0.95, speed: 0.6, cost: 0.5, webSearch: true },
            'sonar': { quality: 0.7, speed: 0.8, cost: 0.8, webSearch: true },
            
            // Google Gemini - Fast and free
            'gemini-2.0-flash-exp': { quality: 0.85, speed: 0.95, cost: 1.0, webSearch: false },
            'gemini-3-flash-preview': { quality: 0.88, speed: 0.95, cost: 1.0, webSearch: false },
            'gemini-3-pro-preview': { quality: 0.92, speed: 0.8, cost: 0.9, webSearch: false },
            
            // OpenAI - Balanced
            'gpt-4o': { quality: 0.9, speed: 0.85, cost: 0.5, webSearch: false },
            'gpt-4-turbo': { quality: 0.92, speed: 0.7, cost: 0.4, webSearch: false },
            'o1-preview': { quality: 0.98, speed: 0.3, cost: 0.2, webSearch: false },
            
            // Anthropic - Best for analysis
            'claude-3-5-sonnet-20241022': { quality: 0.93, speed: 0.8, cost: 0.5, webSearch: false },
            'claude-3-opus-20240229': { quality: 0.97, speed: 0.5, cost: 0.3, webSearch: false },
            'claude-3-haiku-20240307': { quality: 0.75, speed: 0.95, cost: 0.9, webSearch: false }
        };
    }

    async _executeInternal(task, context) {
        const { action, taskType, requirements } = task;

        switch (action) {
            case 'select_model':
                return this.selectBestModel(taskType, requirements, context);
            case 'optimize_cost':
                return this.optimizeForCost(taskType, requirements);
            case 'check_availability':
                return this.checkModelAvailability(requirements?.modelId);
            case 'get_best_model':
                return this.getBestModelForTask(taskType, context);
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }

    /**
     * Select the best model for a given task type
     * @param {string} taskType - Type of task (research, analysis, writing, etc.)
     * @param {Object} requirements - Specific requirements
     * @param {Object} context - Execution context
     * @returns {Object} - Selected model configuration
     */
    async selectBestModel(taskType, requirements = {}, context = {}) {
        console.log(`🎯 [ModelSelector] Selecting model for task: ${taskType}`);

        // Get all available models from registry
        const allModels = await getModelsWithFallback();
        const enabledModels = allModels.filter(m => m.enabled !== false);

        // Get preferred providers for this task type
        const preferredProviders = this.taskPreferences[taskType] || ['google', 'openai', 'anthropic', 'perplexity'];

        // Filter models by preferred providers
        let candidates = enabledModels.filter(m => 
            preferredProviders.includes(m.provider)
        );

        // If no candidates, use all enabled models
        if (candidates.length === 0) {
            candidates = enabledModels;
        }

        // Apply requirements filter
        if (requirements.needsWebSearch) {
            candidates = candidates.filter(m => 
                this.modelScores[m.model_id]?.webSearch === true
            );
        }

        if (requirements.maxCost) {
            candidates = candidates.filter(m => 
                (this.modelScores[m.model_id]?.cost || 0.5) >= requirements.maxCost
            );
        }

        if (requirements.minQuality) {
            candidates = candidates.filter(m => 
                (this.modelScores[m.model_id]?.quality || 0.7) >= requirements.minQuality
            );
        }

        // Score and rank candidates
        const scored = candidates.map(model => {
            const scores = this.modelScores[model.model_id] || { quality: 0.7, speed: 0.7, cost: 0.7 };
            
            // Adjust weights based on requirements
            let weights = { ...this.weights };
            if (requirements.prioritizeCost) weights.cost = 0.5;
            if (requirements.prioritizeQuality) weights.quality = 0.5;
            if (requirements.prioritizeSpeed) weights.speed = 0.5;

            // Normalize weights
            const totalWeight = weights.quality + weights.speed + weights.cost;
            weights.quality /= totalWeight;
            weights.speed /= totalWeight;
            weights.cost /= totalWeight;

            const totalScore = 
                scores.quality * weights.quality +
                scores.speed * weights.speed +
                scores.cost * weights.cost;

            return {
                model,
                scores,
                totalScore,
                reason: this.explainSelection(model, scores, taskType)
            };
        });

        // Sort by score descending
        scored.sort((a, b) => b.totalScore - a.totalScore);

        if (scored.length === 0) {
            console.warn('⚠️ [ModelSelector] No suitable models found, using default');
            return {
                model_id: 'gemini-2.0-flash-exp',
                provider: 'google',
                reason: 'Default fallback - no suitable models available',
                fallback: true
            };
        }

        const selected = scored[0];
        console.log(`✅ [ModelSelector] Selected: ${selected.model.model_id} (score: ${selected.totalScore.toFixed(2)})`);

        return {
            model_id: selected.model.model_id,
            provider: selected.model.provider,
            max_tokens: selected.model.max_tokens || 4000,
            temperature: selected.model.temperature || 0.3,
            score: selected.totalScore,
            reason: selected.reason,
            alternatives: scored.slice(1, 3).map(s => ({
                model_id: s.model.model_id,
                score: s.totalScore
            }))
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
                finance: 'sonar-pro',
                critic: 'claude-3-5-sonnet-20241022',
                researcher: 'sonar-reasoning-pro',
                writer: 'claude-3-5-sonnet-20241022',
                geek: 'gemini-3-flash-preview',
                ceo: 'claude-3-opus-20240229',
                macro: 'sonar-pro'
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
            alternativeIfUnavailable: model ? null : 'gemini-2.0-flash-exp'
        };
    }

    /**
     * Generate explanation for model selection
     */
    explainSelection(model, scores, taskType) {
        const reasons = [];

        if (scores.webSearch) {
            reasons.push('real-time web search');
        }

        if (scores.quality >= 0.9) {
            reasons.push('high quality output');
        }

        if (scores.speed >= 0.9) {
            reasons.push('fast response time');
        }

        if (scores.cost >= 0.8) {
            reasons.push('cost-effective');
        }

        const preferredFor = Object.entries(this.taskPreferences)
            .filter(([_, providers]) => providers.includes(model.provider))
            .map(([task, _]) => task)
            .slice(0, 2);

        if (preferredFor.length > 0) {
            reasons.push(`best for ${preferredFor.join(', ')}`);
        }

        return reasons.length > 0 
            ? `Selected for: ${reasons.join(', ')}`
            : `General purpose model for ${taskType}`;
    }
}

export default ModelSelectorAgent;
