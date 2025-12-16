/**
 * Système de fallback intelligent Gemini avec cascade de modèles
 * 
 * Essaie plusieurs modèles Gemini dans l'ordre jusqu'à ce qu'un fonctionne
 * Utile pour éviter les erreurs 429 (quota exceeded) en utilisant plusieurs modèles
 * 
 * Ordre de priorité :
 * 1. gemini-1.5-flash-latest (quota élevé, stable, gratuit)
 * 2. gemini-2.5-flash (nouveau, performant, quota différent)
 * 3. gemini-3-pro (puissant, quota séparé)
 */

import { geminiWithRetry } from './gemini-retry.js';

// Configuration des modèles en ordre de priorité
const GEMINI_FALLBACK_MODELS = [
    {
        id: 'gemini-1.5-flash-latest',
        name: 'Gemini 1.5 Flash Latest',
        quota: 'high', // 15-1000 RPM
        cost: 'free',
        priority: 1
    },
    {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        quota: 'medium', // Nouveau modèle, quota séparé
        cost: 'free',
        priority: 2
    },
    {
        id: 'gemini-3-pro',
        name: 'Gemini 3 Pro',
        quota: 'medium', // Quota séparé des flash models
        cost: 'free',
        priority: 3
    }
];

/**
 * Appelle Gemini avec fallback automatique sur plusieurs modèles
 * 
 * @param {Object} requestBody - Corps de la requête Gemini (contents, generationConfig, etc.)
 * @param {Object} options - Options
 * @param {string} options.apiKey - Clé API Gemini (required)
 * @param {number} options.maxRetries - Nombre de retries par modèle (défaut: 2)
 * @param {boolean} options.logAttempts - Logger les tentatives (défaut: true)
 * @param {string[]} options.preferredModels - Ordre personnalisé des modèles (optionnel)
 * @returns {Promise<Object>} Réponse Gemini avec metadata
 */
export async function callGeminiWithFallback(requestBody, options = {}) {
    const {
        apiKey,
        maxRetries = 2,
        logAttempts = true,
        preferredModels = null
    } = options;

    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is required');
    }

    // Utiliser l'ordre personnalisé ou l'ordre par défaut
    const modelsToTry = preferredModels
        ? preferredModels.map(id => GEMINI_FALLBACK_MODELS.find(m => m.id === id) || { id, name: id, priority: 0 }).filter(Boolean)
        : GEMINI_FALLBACK_MODELS;

    const errors = [];
    let attemptNumber = 0;

    // Essayer chaque modèle dans l'ordre
    for (const model of modelsToTry) {
        attemptNumber++;

        try {
            if (logAttempts) {
                console.log(`🔄 [Gemini Fallback] Tentative ${attemptNumber}/${modelsToTry.length}: ${model.name} (${model.id})`);
            }

            // Construire l'URL avec le modèle actuel
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model.id}:generateContent?key=${apiKey}`;

            // Appeler avec retry (gérera les erreurs temporaires 429)
            const response = await geminiWithRetry(async () => {
                const res = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });

                if (!res.ok) {
                    const errorText = await res.text();
                    throw new Error(`Gemini API error ${res.status}: ${errorText}`);
                }

                return res;
            }, {
                maxRetries: maxRetries,
                baseDelay: 1000,
                logRetries: logAttempts
            });

            const data = await response.json();

            // Vérifier que la réponse contient bien du texte
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) {
                throw new Error('Empty response from Gemini');
            }

            if (logAttempts) {
                console.log(`✅ [Gemini Fallback] Succès avec ${model.name} (tentative ${attemptNumber}/${modelsToTry.length})`);
            }

            // Retourner avec metadata
            return {
                success: true,
                data: data,
                text: text,
                model: model.id,
                modelName: model.name,
                attemptNumber: attemptNumber,
                totalAttempts: modelsToTry.length
            };

        } catch (error) {
            const errorMessage = error.message || String(error);

            // Vérifier si c'est une erreur de quota (429)
            const isQuotaError = errorMessage.includes('429') ||
                errorMessage.includes('quota') ||
                errorMessage.includes('RESOURCE_EXHAUSTED');

            // Vérifier si c'est une erreur de modèle invalide (404)
            const isModelError = errorMessage.includes('404') ||
                errorMessage.includes('not found') ||
                errorMessage.includes('invalid model');

            if (logAttempts) {
                if (isQuotaError) {
                    console.warn(`⚠️ [Gemini Fallback] ${model.name}: Quota exceeded (429)`);
                } else if (isModelError) {
                    console.warn(`⚠️ [Gemini Fallback] ${model.name}: Model not available (404)`);
                } else {
                    console.warn(`⚠️ [Gemini Fallback] ${model.name}: ${errorMessage.substring(0, 100)}`);
                }
            }

            // Stocker l'erreur pour rapport final
            errors.push({
                model: model.id,
                modelName: model.name,
                error: errorMessage,
                attempt: attemptNumber
            });

            // Si ce n'est pas le dernier modèle, continuer avec le suivant
            if (attemptNumber < modelsToTry.length) {
                if (logAttempts) {
                    console.log(`🔄 [Gemini Fallback] Essai du modèle suivant...`);
                }
                continue;
            }

            // C'était le dernier modèle, on throw
            break;
        }
    }

    // Tous les modèles ont échoué
    console.error('❌ [Gemini Fallback] Tous les modèles ont échoué');
    console.error('📋 [Gemini Fallback] Erreurs détaillées:', JSON.stringify(errors, null, 2));

    throw new Error(`All Gemini models failed (${errors.length} attempts). Last error: ${errors[errors.length - 1]?.error}`);
}

/**
 * Version simplifiée pour remplacer les appels fetch() existants
 * 
 * @param {string} prompt - Prompt à envoyer
 * @param {Object} config - Configuration (temperature, maxTokens, etc.)
 * @param {string} apiKey - Clé API Gemini
 * @returns {Promise<string>} Texte de réponse
 */
export async function callGeminiText(prompt, config = {}, apiKey = process.env.GEMINI_API_KEY) {
    const {
        temperature = 0.7,
        maxTokens = 4000,
        systemPrompt = null
    } = config;

    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

    const requestBody = {
        contents: [{
            parts: [{ text: fullPrompt }]
        }],
        generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
            candidateCount: 1
        }
    };

    const result = await callGeminiWithFallback(requestBody, {
        apiKey,
        maxRetries: 2,
        logAttempts: true
    });

    return result.text;
}

/**
 * Helper pour obtenir la liste des modèles disponibles
 */
export function getAvailableGeminiModels() {
    return GEMINI_FALLBACK_MODELS.map(m => ({
        id: m.id,
        name: m.name,
        quota: m.quota,
        cost: m.cost
    }));
}

export default callGeminiWithFallback;
