/**
 * EMMA CONFIG LOADER - Système de Chargement avec Override
 *
 * Architecture:
 * 1. Charge configs depuis fichiers (source par défaut)
 * 2. Charge overrides depuis Supabase (si existent)
 * 3. Merge (overrides prioritaires)
 * 4. Cache (5 minutes par défaut)
 *
 * Usage:
 *   const loader = new EmmaConfigLoader();
 *   const config = await loader.loadAll();
 *   const prompts = await loader.loadSection('prompts');
 */

import { CFA_SYSTEM_PROMPT } from '../config/emma-cfa-prompt.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class EmmaConfigLoader {
    constructor(options = {}) {
        this.cache = new Map();
        this.cacheDuration = options.cacheDuration || 5 * 60 * 1000; // 5 minutes par défaut
        this.enableCache = options.enableCache !== false;
        this.supabaseUrl = options.supabaseUrl || process.env.SUPABASE_URL;
        this.enableSupabase = options.enableSupabase !== false;

        console.log('📦 EmmaConfigLoader initialized', {
            cache: this.enableCache,
            cacheDuration: this.cacheDuration / 1000 + 's',
            supabase: this.enableSupabase
        });
    }

    /**
     * Charge toute la configuration (prompts + variables + directives + routing)
     */
    async loadAll() {
        const cacheKey = 'all';

        // Vérifier le cache
        if (this.enableCache && this._isCacheValid(cacheKey)) {
            console.log('📦 Using cached config (all)');
            return this.cache.get(cacheKey).data;
        }

        console.log('🔄 Loading full Emma config...');

        // 1. Charger depuis fichiers (source par défaut)
        const fileConfig = await this._loadFromFiles();

        // 2. Charger overrides depuis Supabase (si activé)
        let overrides = {};
        if (this.enableSupabase) {
            try {
                overrides = await this._loadFromSupabase();
                console.log('✅ Supabase overrides loaded');
            } catch (error) {
                console.warn('⚠️  Supabase unavailable, using file defaults:', error.message);
            }
        }

        // 3. Merger (overrides prioritaires)
        const finalConfig = this._mergeConfigs(fileConfig, overrides);

        // 4. Mettre en cache
        if (this.enableCache) {
            this._setCache(cacheKey, finalConfig);
        }

        console.log('✅ Config loaded successfully');
        return finalConfig;
    }

    /**
     * Charge une section spécifique
     */
    async loadSection(section) {
        const cacheKey = `section_${section}`;

        if (this.enableCache && this._isCacheValid(cacheKey)) {
            console.log(`📦 Using cached config (${section})`);
            return this.cache.get(cacheKey).data;
        }

        console.log(`🔄 Loading Emma config section: ${section}`);

        const fullConfig = await this.loadAll();
        const sectionData = fullConfig[section] || {};

        if (this.enableCache) {
            this._setCache(cacheKey, sectionData);
        }

        return sectionData;
    }

    /**
     * Invalide le cache (force rechargement)
     */
    invalidateCache(section = null) {
        if (section) {
            this.cache.delete(`section_${section}`);
            console.log(`🗑️  Cache invalidated: ${section}`);
        } else {
            this.cache.clear();
            console.log('🗑️  Cache invalidated: all');
        }
    }

    /**
     * PRIVATE: Charge depuis fichiers
     */
    async _loadFromFiles() {
        console.log('📁 Loading from files...');

        // Prompts CFA
        const prompts = {
            cfa_identity: CFA_SYSTEM_PROMPT.identity,
            cfa_standards: CFA_SYSTEM_PROMPT.standards,
            cfa_output_format: CFA_SYSTEM_PROMPT.outputFormat,
            cfa_product_guidance: CFA_SYSTEM_PROMPT.productTypeGuidance,
            cfa_perplexity_priority: CFA_SYSTEM_PROMPT.perplexityPriority,
            cfa_sms_format: CFA_SYSTEM_PROMPT.smsFormat,
            cfa_quality_checklist: CFA_SYSTEM_PROMPT.qualityChecklist
        };

        // Intent Prompts
        try {
            const intentModule = await import('../config/intent-prompts.js');
            const intentPrompts = intentModule.INTENT_PROMPTS || intentModule.default || {};

            if (intentPrompts.comprehensive_analysis) {
                prompts.intent_comprehensive_analysis = intentPrompts.comprehensive_analysis;
            }
            if (intentPrompts.stock_price) {
                prompts.intent_stock_price = intentPrompts.stock_price;
            }
            if (intentPrompts.fundamentals) {
                prompts.intent_fundamentals = intentPrompts.fundamentals;
            }
            if (intentPrompts.news) {
                prompts.intent_news = intentPrompts.news;
            }
            if (intentPrompts.comparative_analysis) {
                prompts.intent_comparative_analysis = intentPrompts.comparative_analysis;
            }
        } catch (error) {
            console.warn('⚠️  Could not load intent prompts:', error.message);
        }

        // Briefing Prompts
        try {
            const briefingPath = path.join(__dirname, '../config/briefing-prompts.json');
            const briefingData = JSON.parse(fs.readFileSync(briefingPath, 'utf8'));

            prompts.briefing_morning = briefingData.morning;
            prompts.briefing_midday = briefingData.midday;
            prompts.briefing_evening = briefingData.evening;
        } catch (error) {
            console.warn('⚠️  Could not load briefing prompts:', error.message);
        }

        // Variables (valeurs par défaut hardcodées)
        const variables = {
            max_tokens_default: 4000,
            max_tokens_briefing: 10000,
            temperature: 0.1,
            recency_default: 'month',
            cache_duration_minutes: 5
        };

        // Directives (valeurs par défaut)
        const directives = {
            allow_clarifications: true,
            adaptive_length: true,
            require_sources: true,
            min_ratios_simple: 1,
            min_ratios_comprehensive: 8
        };

        // Routing (valeurs par défaut)
        const routing = {
            use_perplexity_only_keywords: ['fonds', 'quartile', 'macro', 'stratégie', 'crypto'],
            require_apis_keywords: ['prix actuel', 'ratio exact', 'rsi', 'macd'],
            intent_confidence_threshold: 0.7
        };

        return { prompts, variables, directives, routing };
    }

    /**
     * PRIVATE: Charge overrides depuis Supabase
     */
    async _loadFromSupabase() {
        if (!this.supabaseUrl) {
            throw new Error('Supabase URL not configured');
        }

        console.log('💾 Loading overrides from Supabase...');

        // Utiliser l'API admin
        const response = await fetch('/api/admin/emma-config');

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.config) {
            throw new Error('Invalid response format from API');
        }

        // Transformer le format Supabase vers format attendu
        return this._transformSupabaseConfig(data.config);
    }

    /**
     * PRIVATE: Transforme config Supabase vers format interne
     */
    _transformSupabaseConfig(supabaseConfig) {
        const transformed = {
            prompts: {},
            variables: {},
            directives: {},
            routing: {}
        };

        // Prompts
        if (supabaseConfig.prompts) {
            for (const [key, item] of Object.entries(supabaseConfig.prompts)) {
                transformed.prompts[key] = item.value;
            }
        }

        // Variables
        if (supabaseConfig.variables) {
            for (const [key, item] of Object.entries(supabaseConfig.variables)) {
                let value = item.value;
                // Parser selon type
                if (item.type === 'number') {
                    value = parseFloat(value);
                } else if (item.type === 'boolean') {
                    value = value === true || value === 'true';
                } else if (item.type === 'json') {
                    value = JSON.parse(value);
                }
                transformed.variables[key] = value;
            }
        }

        // Directives
        if (supabaseConfig.directives) {
            for (const [key, item] of Object.entries(supabaseConfig.directives)) {
                let value = item.value;
                if (item.type === 'boolean') {
                    value = value === true || value === 'true';
                } else if (item.type === 'number') {
                    value = parseFloat(value);
                }
                transformed.directives[key] = value;
            }
        }

        // Routing
        if (supabaseConfig.routing) {
            for (const [key, item] of Object.entries(supabaseConfig.routing)) {
                let value = item.value;
                if (item.type === 'json') {
                    value = JSON.parse(value);
                } else if (item.type === 'number') {
                    value = parseFloat(value);
                }
                transformed.routing[key] = value;
            }
        }

        return transformed;
    }

    /**
     * PRIVATE: Merge configs (overrides prioritaires)
     */
    _mergeConfigs(fileConfig, overrides) {
        const merged = JSON.parse(JSON.stringify(fileConfig)); // Deep clone

        // Merger chaque section
        for (const section of ['prompts', 'variables', 'directives', 'routing']) {
            if (overrides[section]) {
                for (const [key, value] of Object.entries(overrides[section])) {
                    if (value !== undefined && value !== null && value !== '') {
                        merged[section][key] = value;
                        console.log(`🔀 Override applied: ${section}.${key}`);
                    }
                }
            }
        }

        return merged;
    }

    /**
     * PRIVATE: Vérifier validité du cache
     */
    _isCacheValid(key) {
        if (!this.cache.has(key)) return false;

        const cached = this.cache.get(key);
        const age = Date.now() - cached.timestamp;

        return age < this.cacheDuration;
    }

    /**
     * PRIVATE: Mettre en cache
     */
    _setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Get config value par path (ex: 'variables.temperature')
     */
    async getValue(path) {
        const parts = path.split('.');
        const section = parts[0];
        const key = parts[1];

        if (!section || !key) {
            throw new Error('Invalid path format. Use: section.key');
        }

        const sectionData = await this.loadSection(section);
        return sectionData[key];
    }
}

export default EmmaConfigLoader;
