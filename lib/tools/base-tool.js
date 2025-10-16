/**
 * Classe de base pour tous les outils Emma
 */

export default class BaseTool {
    constructor() {
        this.name = 'Base Tool';
        this.description = 'Tool de base';
        this.timeout = 10000; // 10 secondes par défaut
    }

    /**
     * Méthode principale d'exécution - à implémenter par chaque outil
     */
    async execute(params, context = {}) {
        throw new Error('Execute method must be implemented by subclass');
    }

    /**
     * Validation des paramètres
     */
    validateParams(params, requiredParams = []) {
        for (const param of requiredParams) {
            if (!params[param]) {
                throw new Error(`Missing required parameter: ${param}`);
            }
        }
        return true;
    }

    /**
     * Appel API avec gestion d'erreur et timeout
     */
    async makeApiCall(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`API call failed: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * Formatage standard des résultats
     */
    formatResult(data, isReliable = true, metadata = {}) {
        return {
            data: data,
            is_reliable: isReliable,
            timestamp: new Date().toISOString(),
            tool: this.name,
            metadata: metadata
        };
    }

    /**
     * Gestion d'erreur standard
     */
    handleError(error, fallbackData = null) {
        console.error(`❌ ${this.name} error:`, error.message);
        
        return this.formatResult(fallbackData, false, {
            error: error.message,
            error_type: error.constructor.name
        });
    }
}
