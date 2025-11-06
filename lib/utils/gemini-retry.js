/**
 * Gemini API Retry Utility with Exponential Backoff
 *
 * Gère automatiquement les erreurs 429 (Rate Limiting) de l'API Gemini
 * avec une stratégie de retry intelligente.
 *
 * Stratégie:
 * - Retry 1: 1 seconde
 * - Retry 2: 2 secondes
 * - Retry 3: 4 secondes
 * - Retry 4: 8 secondes
 * - Max retries: 4
 */

/**
 * Wrapper de retry avec exponential backoff pour appels Gemini
 *
 * @param {Function} apiCallFn - Fonction async qui fait l'appel API Gemini
 * @param {Object} options - Options de retry
 * @param {number} options.maxRetries - Nombre max de retries (défaut: 4)
 * @param {number} options.baseDelay - Délai de base en ms (défaut: 1000)
 * @param {boolean} options.logRetries - Logger les retries (défaut: true)
 * @returns {Promise<any>} - Résultat de l'appel API
 */
export async function geminiWithRetry(apiCallFn, options = {}) {
    const {
        maxRetries = 4,
        baseDelay = 1000,
        logRetries = true
    } = options;

    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            // Tentative d'appel API
            if (logRetries && attempt > 0) {
                console.log(`🔄 Gemini retry attempt ${attempt}/${maxRetries}`);
            }

            const result = await apiCallFn();

            // Succès
            if (attempt > 0 && logRetries) {
                console.log(`✅ Gemini call succeeded after ${attempt} retries`);
            }

            return result;

        } catch (error) {
            lastError = error;

            // Vérifier si c'est une erreur 429 (Rate Limiting)
            const is429Error =
                error.message?.includes('429') ||
                error.message?.includes('Resource exhausted') ||
                error.message?.includes('RESOURCE_EXHAUSTED') ||
                error.message?.includes('quota');

            // Si ce n'est pas une erreur 429 OU si on a atteint le max de retries, re-throw
            if (!is429Error || attempt >= maxRetries) {
                if (logRetries) {
                    console.error(`❌ Gemini call failed after ${attempt} retries:`, error.message);
                }
                throw error;
            }

            // Calculer le délai avec exponential backoff
            const delay = baseDelay * Math.pow(2, attempt);

            if (logRetries) {
                console.warn(`⚠️ Gemini rate limit (429) - Retry ${attempt + 1}/${maxRetries} in ${delay}ms`);
            }

            // Attendre avant le prochain retry
            await sleep(delay);
        }
    }

    // Fallback (ne devrait jamais arriver ici)
    throw lastError;
}

/**
 * Helper pour attendre un délai
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wrapper spécifique pour fetch() avec détection automatique d'erreurs 429
 *
 * @param {string} url - URL de l'API Gemini
 * @param {Object} fetchOptions - Options pour fetch()
 * @param {Object} retryOptions - Options de retry
 * @returns {Promise<Response>} - Response de fetch
 */
export async function geminiFetchWithRetry(url, fetchOptions = {}, retryOptions = {}) {
    return geminiWithRetry(async () => {
        const response = await fetch(url, fetchOptions);

        // Si 429, throw error pour déclencher le retry
        if (response.status === 429) {
            const errorText = await response.text();
            throw new Error(`429 Resource exhausted: ${errorText}`);
        }

        // Si autre erreur HTTP, throw aussi
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API error ${response.status}: ${errorText}`);
        }

        return response;
    }, retryOptions);
}

export default geminiWithRetry;
