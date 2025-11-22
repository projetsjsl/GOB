// ═══════════════════════════════════════════════════════════════
// API CLIENT - Centralise tous les appels API
// ═══════════════════════════════════════════════════════════════

export const API_BASE = '/api/admin/emma-config';
export const DESIGN_API = '/api/email-design';

/**
 * Charge toutes les configurations depuis l'API
 */
export async function loadAllConfigs() {
    const response = await fetch(API_BASE);
    const data = await response.json();

    if (!data.config) {
        throw new Error('Pas de données de configuration');
    }

    return data.config;
}

/**
 * Sauvegarde une configuration
 */
export async function saveCurrentConfig(section, key, value, description, category, priority, metadata) {
    const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'set',
            section,
            key,
            value,
            description,
            category,
            priority,
            metadata
        })
    });

    return response.ok;
}

/**
 * Supprime une configuration
 */
export async function deleteCurrentConfig(section, key) {
    const response = await fetch(API_BASE, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, key })
    });

    return response.ok;
}

/**
 * Charge la configuration du design email
 */
export async function loadDesignConfig() {
    const response = await fetch(DESIGN_API);
    return await response.json();
}

/**
 * Sauvegarde la configuration du design
 */
export async function saveDesignConfig(config) {
    const response = await fetch(DESIGN_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
    });

    return await response.json();
}

/**
 * Sauvegarde la configuration SMS (fait partie du design)
 */
export async function saveSmsConfig(config) {
    return await saveDesignConfig(config);
}

/**
 * Charge la configuration de delivery pour un prompt
 */
export async function loadDeliveryConfig(section, key) {
    const promptId = key;
    const response = await fetch(`/api/prompt-delivery-config?prompt_id=${promptId}`);

    if (!response.ok) {
        return null;
    }

    const data = await response.json();
    return data.success && data.config ? data.config : null;
}

/**
 * Sauvegarde la configuration de delivery
 */
export async function saveDeliveryConfig(deliveryConfig) {
    const response = await fetch('/api/prompt-delivery-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deliveryConfig)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Unknown error');
    }

    return true;
}

/**
 * Appelle l'API de formatage preview
 */
export async function fetchFormattedPreview(text, channel, briefingType = 'morning', customDesign = null) {
    try {
        const body = { text, channel, briefingType };

        if (customDesign) {
            body.customDesign = customDesign;
        }

        const response = await fetch('/api/format-preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) throw new Error('API error');
        return await response.json();
    } catch (error) {
        console.warn('[Preview] API error, using fallback:', error);
        return null;
    }
}

/**
 * Envoie un briefing immédiatement
 */
export async function sendBriefingNow(promptId, recipients, customPrompt) {
    const response = await fetch('/api/send-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            prompt_id: promptId,
            recipients,
            custom_prompt: customPrompt
        })
    });

    return await response.json();
}
