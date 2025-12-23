/**
 * PERSONA MANAGER
 * 
 * Manages all Emma personalities with their:
 * - System prompts (loaded from emma-config/Supabase)
 * - Preferred models
 * - Communication styles
 * - Capabilities
 * 
 * Personas:
 * - finance: Emma IA • BOURSE - Stock analyst
 * - critic: Emma IA • AVOCAT DU DIABLE - Contrarian
 * - researcher: Dr. Emma • RECHERCHE - Academic
 * - writer: Emma IA • RÉDACTION - Writer
 * - geek: Emma IA • GEEK - Technical analyst
 * - ceo: CEO Mode - Executive simulation
 * - macro: Emma IA • MACRO - Macroeconomic analyst
 * - politics: Emma IA • POLITIQUE - Political analyst
 */

import { configManager } from '../config-manager.js';

// Default prompts (fallbacks if not in Supabase)
const DEFAULT_PROMPTS = {
    finance: `Tu es Emma IA • BOURSE, une analyste boursière experte de niveau CFA.
Tu fournis des analyses financières rigoureuses avec données chiffrées et sources.
Style: Professionnel, précis, factuel. Toujours citer les sources.`,

    critic: `Tu es Emma IA • AVOCAT DU DIABLE, experte en analyse contrariante.
Ton rôle est de trouver les failles, risques et contre-arguments.
Style: Critique constructive, sceptique mais argumentée. Toujours questionner le consensus.`,

    researcher: `Tu es Dr. Emma • RECHERCHE, une chercheuse académique en finance.
Tu fournis des analyses approfondies avec citations et méthodologie rigoureuse.
Style: Académique, sourcé, approfondi. Toujours expliquer la méthodologie.`,

    writer: `Tu es Emma IA • RÉDACTION, une rédactrice professionnelle.
Tu rédiges des briefings, lettres aux actionnaires et rapports de qualité.
Style: Éloquent, structuré, professionnel. Adapter le ton au destinataire.`,

    geek: `Tu es Emma IA • GEEK, une analyste technique experte en patterns et indicateurs.
Tu analyses RSI, MACD, Bollinger, supports/résistances, et patterns chartistes.
Style: Technique, précis avec les chiffres. Toujours mentionner les niveaux clés.`,

    ceo: `MODE CEO: Tu incarnes le CEO d'une entreprise.
Réponds aux questions comme si tu étais le dirigeant.
Style: Visionnaire, stratégique, confiant. Parler de "notre entreprise", "notre vision".`,

    macro: `Tu es Emma IA • MACRO, une analyste macroéconomique.
Tu analyses les taux, l'inflation, les politiques des banques centrales, et les cycles.
Style: Vue d'ensemble, interconnexions, tendances long terme.`,

    politics: `Tu es Emma IA • POLITIQUE, une analyste géopolitique.
Tu analyses les risques politiques, élections, et impacts sur les marchés.
Style: Nuancé, multicausiste, neutre politiquement.`
};

export class PersonaManager {
    constructor() {
        this.personas = {
            finance: {
                id: 'finance',
                name: 'Emma IA • BOURSE',
                role: 'Analyste Boursier & Financier',
                model: 'sonar-pro',
                provider: 'perplexity',
                promptKey: 'prompts.finance_identity',
                defaultPrompt: DEFAULT_PROMPTS.finance,
                style: 'analytical',
                avatar: '/public/images/ia.png',
                capabilities: ['stock_analysis', 'technical', 'fundamentals', 'valuation']
            },
            critic: {
                id: 'critic',
                name: 'Emma IA • AVOCAT DU DIABLE',
                role: 'Analyste Contrarian',
                model: 'claude-3-5-sonnet-20241022',
                provider: 'anthropic',
                promptKey: 'prompts.critic_identity',
                defaultPrompt: DEFAULT_PROMPTS.critic,
                style: 'contrarian',
                avatar: '/public/images/avocat.png',
                capabilities: ['risk_analysis', 'counter_arguments', 'skeptical_review']
            },
            researcher: {
                id: 'researcher',
                name: 'Dr. Emma • RECHERCHE',
                role: 'Chercheuse Académique',
                model: 'sonar-reasoning-pro',
                provider: 'perplexity',
                promptKey: 'prompts.researcher_identity',
                defaultPrompt: DEFAULT_PROMPTS.researcher,
                style: 'academic',
                avatar: '/public/images/chercheur.png',
                capabilities: ['deep_research', 'citations', 'methodology', 'data_analysis']
            },
            writer: {
                id: 'writer',
                name: 'Emma IA • RÉDACTION',
                role: 'Rédactrice Professionnelle',
                model: 'claude-3-5-sonnet-20241022',
                provider: 'anthropic',
                promptKey: 'prompts.writer_identity',
                defaultPrompt: DEFAULT_PROMPTS.writer,
                style: 'eloquent',
                avatar: '/public/images/ecrivain_auteur.png',
                capabilities: ['briefings', 'letters', 'reports', 'emails']
            },
            geek: {
                id: 'geek',
                name: 'Emma IA • GEEK',
                role: 'Analyste Technique',
                model: 'gemini-3-flash-preview',
                provider: 'google',
                promptKey: 'prompts.technical_identity',
                defaultPrompt: DEFAULT_PROMPTS.geek,
                style: 'technical',
                avatar: '/public/images/data.png',
                capabilities: ['charts', 'patterns', 'indicators', 'support_resistance']
            },
            ceo: {
                id: 'ceo',
                name: 'CEO Mode',
                role: 'Simulation CEO',
                model: 'claude-3-opus-20240229',
                provider: 'anthropic',
                promptKey: 'prompts.ceo_template',
                defaultPrompt: DEFAULT_PROMPTS.ceo,
                style: 'executive',
                avatar: '/public/images/entrepreneur.png',
                capabilities: ['strategy', 'vision', 'leadership', 'investor_relations']
            },
            macro: {
                id: 'macro',
                name: 'Emma IA • MACRO',
                role: 'Analyste Macroéconomique',
                model: 'sonar-pro',
                provider: 'perplexity',
                promptKey: 'prompts.macro_identity',
                defaultPrompt: DEFAULT_PROMPTS.macro,
                style: 'macroeconomic',
                avatar: '/public/images/analyste_financier.png',
                capabilities: ['yield_curves', 'fed_analysis', 'inflation', 'economic_cycles']
            },
            politics: {
                id: 'politics',
                name: 'Emma IA • POLITIQUE',
                role: 'Analyste Géopolitique',
                model: 'sonar-pro',
                provider: 'perplexity',
                promptKey: 'prompts.politics_identity',
                defaultPrompt: DEFAULT_PROMPTS.politics,
                style: 'geopolitical',
                avatar: '/public/images/analyste_financier.png',
                capabilities: ['elections', 'policy_analysis', 'geopolitical_risk', 'trade']
            }
        };

        this.currentPersona = 'finance';
        this.promptCache = new Map();
    }

    /**
     * Get all available personas
     */
    getAllPersonas() {
        return Object.values(this.personas).map(p => ({
            id: p.id,
            name: p.name,
            role: p.role,
            style: p.style,
            avatar: p.avatar,
            capabilities: p.capabilities
        }));
    }

    /**
     * Get a specific persona by ID
     */
    getPersona(personaId) {
        return this.personas[personaId] || this.personas.finance;
    }

    /**
     * Select persona based on context
     * @param {Object} context - Includes intent, explicit persona request, etc.
     */
    async select(context = {}) {
        // Explicit persona request takes priority
        if (context.persona && this.personas[context.persona]) {
            this.currentPersona = context.persona;
            return this.getPersonaWithPrompt(context.persona);
        }

        // Auto-select based on intent
        const intent = context.intent || context.intent_data?.intent;
        
        const intentToPersona = {
            // Research intents
            'research': 'researcher',
            'news': 'researcher',
            'deep_dive': 'researcher',
            
            // Analysis intents
            'stock_analysis': 'finance',
            'fundamentals': 'finance',
            'valuation': 'finance',
            
            // Technical intents
            'technical_analysis': 'geek',
            'chart_analysis': 'geek',
            'patterns': 'geek',
            
            // Risk intents
            'risk_analysis': 'critic',
            'counter_argument': 'critic',
            'bear_case': 'critic',
            
            // Writing intents
            'briefing': 'writer',
            'email': 'writer',
            'report': 'writer',
            
            // Macro intents
            'macro': 'macro',
            'yield_curve': 'macro',
            'fed': 'macro',
            'inflation': 'macro',
            
            // Political intents
            'geopolitics': 'politics',
            'election': 'politics',
            'policy': 'politics'
        };

        const selectedId = intentToPersona[intent] || 'finance';
        this.currentPersona = selectedId;

        return this.getPersonaWithPrompt(selectedId);
    }

    /**
     * Get persona with its system prompt loaded
     */
    async getPersonaWithPrompt(personaId) {
        const persona = this.getPersona(personaId);
        
        // Try to load prompt from Supabase cache
        if (this.promptCache.has(personaId)) {
            const cached = this.promptCache.get(personaId);
            if (Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 min cache
                return { ...persona, systemPrompt: cached.prompt };
            }
        }

        // Load from configManager
        try {
            const section = persona.promptKey.split('.')[0];
            const key = persona.promptKey.split('.')[1];
            const prompt = await configManager.get(section, key, persona.defaultPrompt);
            
            this.promptCache.set(personaId, {
                prompt,
                timestamp: Date.now()
            });

            return { ...persona, systemPrompt: prompt };
        } catch (error) {
            console.warn(`⚠️ [PersonaManager] Failed to load prompt for ${personaId}, using default`);
            return { ...persona, systemPrompt: persona.defaultPrompt };
        }
    }

    /**
     * Set current persona
     */
    setPersona(personaId) {
        if (this.personas[personaId]) {
            this.currentPersona = personaId;
            return true;
        }
        return false;
    }

    /**
     * Get current persona
     */
    getCurrentPersona() {
        return this.getPersona(this.currentPersona);
    }

    /**
     * Check if persona can handle a capability
     */
    canHandle(personaId, capability) {
        const persona = this.getPersona(personaId);
        return persona.capabilities.includes(capability);
    }

    /**
     * Clear prompt cache (force reload)
     */
    clearCache() {
        this.promptCache.clear();
    }
}

// Singleton instance
export const personaManager = new PersonaManager();

export default PersonaManager;
