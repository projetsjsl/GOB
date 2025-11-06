/**
 * Perplexity API Client
 *
 * Client simplifié pour Perplexity Sonar Pro
 * Documentation: https://docs.perplexity.ai/
 */

export class PerplexityClient {
    constructor(apiKey = null) {
        this.apiKey = apiKey || process.env.PERPLEXITY_API_KEY;
        this.baseURL = 'https://api.perplexity.ai';
        this.defaultModel = 'sonar-pro'; // Meilleur modèle pour analyses financières

        // Note: API key validation is deferred until actual API call
        // This allows testing without API key
    }

    /**
     * Génère une réponse avec Perplexity Sonar Pro
     * @param {string} prompt - Le prompt complet (système + user)
     * @param {Object} options - Options de génération
     * @returns {Promise<Object>} Réponse avec content, citations, usage
     */
    async generate(prompt, options = {}) {
        const {
            model = this.defaultModel,
            temperature = 0.5, // OPTIMISÉ: 0.5 au lieu de 0.3 pour plus de richesse
            max_tokens = 6000, // OPTIMISÉ: 6000 au lieu de 1500 pour analyses complètes
            systemPrompt = null,
            userMessage = null
        } = options;

        // Validation API key au moment de l'appel
        if (!this.apiKey) {
            throw new Error('PERPLEXITY_API_KEY manquant - définir la variable d\'environnement ou passer apiKey au constructor');
        }

        // Si systemPrompt et userMessage fournis, construire messages séparés
        const messages = this._buildMessages(prompt, systemPrompt, userMessage);

        const requestBody = {
            model,
            messages,
            temperature,
            max_tokens,
            return_citations: true,
            return_related_questions: false,
            search_recency_filter: 'month' // Recherches récentes si nécessaire
        };

        try {
            const startTime = Date.now();

            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Perplexity API Error: ${response.status} - ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            const latency = Date.now() - startTime;

            return this._formatResponse(data, latency);
        } catch (error) {
            console.error('[PerplexityClient] Erreur:', error);
            throw error;
        }
    }

    /**
     * Construit les messages selon le format Perplexity
     */
    _buildMessages(prompt, systemPrompt, userMessage) {
        const messages = [];

        if (systemPrompt && userMessage) {
            // Format structuré (recommandé)
            messages.push({
                role: 'system',
                content: systemPrompt
            });
            messages.push({
                role: 'user',
                content: userMessage
            });
        } else {
            // Format simple (prompt unique)
            messages.push({
                role: 'user',
                content: prompt
            });
        }

        return messages;
    }

    /**
     * Formate la réponse Perplexity
     */
    _formatResponse(data, latency) {
        const choice = data.choices?.[0];
        const usage = data.usage;

        // Calcul du coût (Perplexity pricing)
        const inputCost = (usage?.prompt_tokens || 0) / 1000 * 0.005;  // $0.005/1k tokens input
        const outputCost = (usage?.completion_tokens || 0) / 1000 * 0.015; // $0.015/1k tokens output
        const totalCost = inputCost + outputCost;

        return {
            content: choice?.message?.content || '',
            citations: choice?.citations || [],
            model: data.model,
            usage: {
                prompt_tokens: usage?.prompt_tokens || 0,
                completion_tokens: usage?.completion_tokens || 0,
                total_tokens: usage?.total_tokens || 0
            },
            cost: {
                input: inputCost,
                output: outputCost,
                total: totalCost
            },
            latency,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Test de connexion Perplexity
     */
    async testConnection() {
        try {
            const response = await this.generate('Test de connexion. Réponds simplement "OK"', {
                max_tokens: 50
            });
            return {
                success: true,
                model: response.model,
                latency: response.latency,
                cost: response.cost.total
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

/**
 * Exemple d'utilisation:
 *
 * const client = new PerplexityClient();
 * const response = await client.generate('Analyse AAPL', {
 *     systemPrompt: 'Tu es Emma, analyste financière',
 *     userMessage: 'Analyse AAPL avec les données suivantes: {...}',
 *     temperature: 0.3,
 *     max_tokens: 1500
 * });
 *
 * console.log(response.content);
 * console.log('Coût:', response.cost.total);
 * console.log('Citations:', response.citations);
 */
