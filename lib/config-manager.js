import { createSupabaseClient } from './supabase-config.js';

/**
 * CONFIG MANAGER
 * 
 * Système centralisé pour la gestion de la configuration d'Emma.
 * - Charge la config depuis Supabase (table emma_system_config)
 * - Cache les résultats pour éviter la latence (TTL 5 min)
 * - Fallback sur les valeurs par défaut si DB inaccessible
 */
export class ConfigManager {
    constructor() {
        this.supabase = null;
        this.cache = new Map();
        this.cacheTTL = 5 * 60 * 1000; // 5 minutes
        this.lastFetch = 0;
        this.config = {}; // Local config store
        this.isInitialized = false;
    }

    /**
     * Initialise le client Supabase et charge la config initiale
     */
    async initialize() {
        if (this.isInitialized) return;

        try {
            this.supabase = createSupabaseClient();
            await this.refreshConfig();
            this.isInitialized = true;
            console.log('✅ ConfigManager initialized');
        } catch (error) {
            console.warn('⚠️ ConfigManager initialization failed, using defaults:', error.message);
            // On continue sans erreur bloquante, les get() utiliseront les defaults
        }
    }

    /**
     * Rafraîchit la configuration depuis Supabase
     */
    async refreshConfig() {
        if (!this.supabase) return;

        try {
            const { data, error } = await this.supabase
                .from('emma_system_config')
                .select('section, key, value, type');

            if (error) throw error;

            // Organiser la config par section.key
            const newConfig = {};

            for (const item of data) {
                if (!newConfig[item.section]) {
                    newConfig[item.section] = {};
                }

                let parsedValue = item.value;

                // Parser les types
                if (item.type === 'json' || item.type === 'array') {
                    try {
                        parsedValue = JSON.parse(item.value);
                    } catch (e) {
                        console.warn(`⚠️ Failed to parse JSON config ${item.section}.${item.key}`);
                    }
                } else if (item.type === 'number') {
                    parsedValue = Number(item.value);
                } else if (item.type === 'boolean') {
                    parsedValue = item.value === 'true';
                }

                newConfig[item.section][item.key] = parsedValue;
            }

            this.config = newConfig;
            this.lastFetch = Date.now();
            console.log(`🔄 Config refreshed (${data.length} items)`);

        } catch (error) {
            console.error('❌ Failed to refresh config:', error.message);
            // On garde l'ancienne config en cache
        }
    }

    /**
     * Récupère une valeur de configuration
     * @param {string} section - Section (ex: 'prompts', 'variables')
     * @param {string} key - Clé (ex: 'cfa_identity', 'max_tokens')
     * @param {any} defaultValue - Valeur par défaut si non trouvé
     */
    async get(section, key, defaultValue = null) {
        // Auto-refresh si cache expiré
        if (Date.now() - this.lastFetch > this.cacheTTL) {
            await this.refreshConfig();
        }

        if (this.config[section] && this.config[section][key] !== undefined) {
            return this.config[section][key];
        }

        return defaultValue;
    }

    /**
     * Récupère toute une section
     */
    async getSection(section) {
        // Auto-refresh si cache expiré
        if (Date.now() - this.lastFetch > this.cacheTTL) {
            await this.refreshConfig();
        }

        return this.config[section] || {};
    }
}

// Singleton instance
export const configManager = new ConfigManager();
