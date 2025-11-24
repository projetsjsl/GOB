/**
 * Système de fallback intelligent Perplexity avec cascade de modèles
 * 
 * Essaie plusieurs modèles Perplexity dans l'ordre jusqu'à ce qu'un fonctionne
 * Ordre : Plus récent/détaillé → Plus rapide/économique
 * 
 * Modèles Perplexity disponibles (Jan 2025) :
 * 1. sonar-pro (premium, recherche approfondie, citations multiples)
 * 2. sonar (standard, rapide, citations basiques)
 * 3. sonar-reasoning (raisonnement approfondi, analyses complexes)
 */

// Configuration des modèles Perplexity en ordre de priorité
const PERPLEXITY_FALLBACK_MODELS = [
    {
        id: 'sonar-pro',
        name: 'Sonar Pro',
        description: 'Premium - Recherche approfondie avec citations multiples',
        quota: 'medium',
        quality: 'highest',
        priority: 1
    },
    {
        id: 'sonar',
        name: 'Sonar',
        description: 'Standard - Rapide avec citations basiques',
        quota: 'high',
        quality: 'high',
        priority: 2
    },
    {
        id: 'sonar-reasoning',
        name: 'Sonar Reasoning',
        description: 'Raisonnement approfondi pour analyses complexes',
        quota: 'medium',
        quality: 'highest',
        priority: 3
    }
];

/**
 * Appelle Perplexity avec fallback automatique sur plusieurs modèles
 * 
 * @param {Object} requestBody - Corps de la requête Perplexity (messages, etc.)
 * @param {Object} options - Options
 * @param {string} options.apiKey - Clé API Perplexity (required)
 * @param {number} options.maxRetries - Nombre de retries par modèle (défaut: 1)
 * @param {boolean} options.logAttempts - Logger les tentatives (défaut: true)
 * @param {number} options.timeoutMs - Timeout par modèle en ms (défaut: 60000)
 * @param {string[]} options.preferredModels - Ordre personnalisé des modèles (optionnel)
 * @returns {Promise<Object>} Réponse Perplexity avec metadata
 */
export async function callPerplexityWithFallback(requestBody, options = {}) {
    const {
        apiKey,
        maxRetries = 1, // Perplexity plus stable, moins de retries nécessaires
        logAttempts = true,
        timeoutMs = 60000,
        preferredModels = null
    } = options;

    if (!apiKey) {
        throw new Error('PERPLEXITY_API_KEY is required');
    }

    // Utiliser l'ordre personnalisé ou l'ordre par défaut
    const modelsToTry = preferredModels
        ? preferredModels.map(id => PERPLEXITY_FALLBACK_MODELS.find(m => m.id === id)).filter(Boolean)
        : PERPLEXITY_FALLBACK_MODELS;

    const errors = [];
    let attemptNumber = 0;

    // Essayer chaque modèle dans l'ordre
    for (const model of modelsToTry) {
        attemptNumber++;

        try {
            if (logAttempts) {
                console.log(`🔄 [Perplexity Fallback] Tentative ${attemptNumber}/${modelsToTry.length}: ${model.name} (${model.id})`);
            }

            // Créer une copie du requestBody avec le modèle actuel
            const requestWithModel = {
                ...requestBody,
                model: model.id
            };

            // Appeler Perplexity avec timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            try {
                const response = await fetch('https://api.perplexity.ai/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestWithModel),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`Perplexity API error ${response.status}: ${errorData.error?.message || response.statusText}`);
                }

                const data = await response.json();

                // Vérifier que la réponse contient bien du texte
                const content = data.choices?.[0]?.message?.content;
                if (!content) {
                    throw new Error('Empty response from Perplexity');
                }

                const citations = data.citations || [];

                if (logAttempts) {
                    console.log(`✅ [Perplexity Fallback] Succès avec ${model.name} (tentative ${attemptNumber}/${modelsToTry.length})`);
                    console.log(`   → ${content.length} chars, ${citations.length} citations`);
                }

                // Retourner avec metadata
                return {
                    success: true,
                    data: data,
                    content: content,
                    citations: citations,
                    model: model.id,
                    modelName: model.name,
                    attemptNumber: attemptNumber,
                    totalAttempts: modelsToTry.length
                };

            } finally {
                clearTimeout(timeoutId);
            }

        } catch (error) {
            const errorMessage = error.message || String(error);

            // Vérifier le type d'erreur
            const isQuotaError = errorMessage.includes('429') ||
                errorMessage.includes('quota') ||
                errorMessage.includes('rate limit');

            const isTimeoutError = errorMessage.includes('timeout') ||
                errorMessage.includes('aborted') ||
                error.name === 'AbortError';

            const isAuthError = errorMessage.includes('401') ||
                errorMessage.includes('unauthorized') ||
                errorMessage.includes('invalid api key');

            if (logAttempts) {
                if (isQuotaError) {
                    console.warn(`⚠️ [Perplexity Fallback] ${model.name}: Quota exceeded (429)`);
                } else if (isTimeoutError) {
                    console.warn(`⚠️ [Perplexity Fallback] ${model.name}: Timeout (${timeoutMs}ms)`);
                } else if (isAuthError) {
                    console.warn(`⚠️ [Perplexity Fallback] ${model.name}: Auth error (401)`);
                } else {
                    console.warn(`⚠️ [Perplexity Fallback] ${model.name}: ${errorMessage.substring(0, 100)}`);
                }
            }

            // Stocker l'erreur
            errors.push({
                model: model.id,
                modelName: model.name,
                error: errorMessage,
                attempt: attemptNumber
            });

            // Si c'est une erreur d'auth, inutile d'essayer les autres modèles
            if (isAuthError) {
                console.error('❌ [Perplexity Fallback] Erreur d\'authentification - abandon');
                break;
            }

            // Si ce n'est pas le dernier modèle, continuer
            if (attemptNumber < modelsToTry.length) {
                if (logAttempts) {
                    console.log(`🔄 [Perplexity Fallback] Essai du modèle suivant...`);
                }
                continue;
            }

            // C'était le dernier modèle
            break;
        }
    }

    // Tous les modèles ont échoué
    console.error('❌ [Perplexity Fallback] Tous les modèles Perplexity ont échoué');
    console.error('📋 [Perplexity Fallback] Erreurs détaillées:', JSON.stringify(errors, null, 2));

    throw new Error(`All Perplexity models failed (${errors.length} attempts). Last error: ${errors[errors.length - 1]?.error}`);
}

/**
 * Helper pour obtenir la liste des modèles Perplexity disponibles
 */
export function getAvailablePerplexityModels() {
    return PERPLEXITY_FALLBACK_MODELS.map(m => ({
        id: m.id,
        name: m.name,
        description: m.description,
        quality: m.quality
    }));
}

export default callPerplexityWithFallback;
