/**
 * Logique pour l'onglet Emma IA (Configuration des modèles Chat)
 */
import { showStatus } from './ui-helpers.js';

const MODES = ['researcher', 'writer', 'critic', 'technical'];

// Configuration par défaut (sera écrasée par l'API)
const DEFAULTS = {
    researcher: { modelId: 'sonar-pro', googleSearch: true, max_tokens: 2000, temperature: 0.2 },
    writer: { modelId: 'gpt-4o', googleSearch: false, max_tokens: 2500, temperature: 0.7 },
    critic: { modelId: 'claude-3-5-sonnet', googleSearch: true, max_tokens: 1500, temperature: 0.3 },
    technical: { modelId: 'gemini-2.0-flash', googleSearch: false, max_tokens: 3000, temperature: 0.1 }
};

/**
 * Charge les configurations depuis l'API (Supabase)
 */
export async function loadEmmaIAConfigs() {
    console.log('🔄 Chargement des configs Emma IA depuis API...');
    
    let apiConfigs = {};
    try {
        const response = await fetch('/api/admin/emma-config?section=ai_roles');
        if (response.ok) {
            const data = await response.json();
            // L'API peut retourner { config: { researcher: {...}, writer: {...} } }
            // ou directement l'objet si on a demandé la section
            if (data.config) {
                apiConfigs = data.config;
            } else {
                apiConfigs = data;
            }
            console.log('✅ Configs chargées:', apiConfigs);
        } else {
            console.warn('Erreur API:', response.status);
            showStatus('Mode hors-ligne (Défauts chargés)', 'warning');
        }
    } catch (e) {
        console.error('Erreur chargement configs:', e);
        showStatus('Erreur connexion API', 'error');
    }

    // Appliquer aux 4 modes
    MODES.forEach(mode => {
        // Combiner défauts + API (priorité à l'API)
        // Note: L'API retourne { value: {...}, type: 'json' } pour chaque clé
        let modeConfig = { ...DEFAULTS[mode] };
        
        if (apiConfigs[mode]) {
            // Si structure API { value: {...} }
            if (apiConfigs[mode].value) {
                 modeConfig = { ...modeConfig, ...apiConfigs[mode].value };
            } else {
                 // Si structure directe
                 modeConfig = { ...modeConfig, ...apiConfigs[mode] };
            }
        }
        
        // Settings UI Elements
        const modelSelect = document.getElementById(`emmaia${capitalize(mode)}Model`);
        const searchCheck = document.getElementById(`emmaia${capitalize(mode)}GoogleSearch`);
        const tokensInput = document.getElementById(`emmaia${capitalize(mode)}Tokens`);
        const tempInput = document.getElementById(`emmaia${capitalize(mode)}Temp`);

        if (modelSelect) modelSelect.value = modeConfig.modelId;
        if (searchCheck) searchCheck.checked = modeConfig.googleSearch;
        if (tokensInput) tokensInput.value = modeConfig.max_tokens || DEFAULTS[mode].max_tokens;
        if (tempInput) tempInput.value = modeConfig.temperature !== undefined ? modeConfig.temperature : DEFAULTS[mode].temperature;
    });

    showStatus('Configurations synchronisées', 'success');
}

/**
 * Sauvegarde les configurations via l'API
 */
export async function saveEmmaIAConfigs() {
    const promises = [];

    MODES.forEach(mode => {
        const modelSelect = document.getElementById(`emmaia${capitalize(mode)}Model`);
        const searchCheck = document.getElementById(`emmaia${capitalize(mode)}GoogleSearch`);
        const tokensInput = document.getElementById(`emmaia${capitalize(mode)}Tokens`);
        const tempInput = document.getElementById(`emmaia${capitalize(mode)}Temp`);

        if (modelSelect && searchCheck) {
            const currentConfig = {
                modelId: modelSelect.value,
                googleSearch: searchCheck.checked,
                max_tokens: tokensInput ? parseInt(tokensInput.value) : DEFAULTS[mode].max_tokens,
                temperature: tempInput ? parseFloat(tempInput.value) : DEFAULTS[mode].temperature
            };

            // Appel API pour chaque clé
            const p = fetch('/api/admin/emma-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: 'ai_roles',
                    key: mode,
                    value: currentConfig,
                    action: 'set'
                })
            });
            promises.push(p);
        }
    });

    try {
        await Promise.all(promises);
        showStatus('Configurations sauvegardées dans le Cloud!', 'success');
        
        // Petit effet visuel
        const btn = document.querySelector('button[onclick="saveEmmaIAConfigs()"]');
        if (btn) {
            const originalText = btn.textContent;
            btn.textContent = '✅ Sauvegardé & Sync!';
            setTimeout(() => btn.textContent = originalText, 2000);
        }

    } catch (e) {
        console.error('Erreur sauvegarde:', e);
        showStatus('Erreur lors de la sauvegarde', 'error');
    }
}

/**
 * Réinitialise aux valeurs par défaut
 */
export async function resetEmmaIAConfigs() {
    if (!confirm('Voulez-vous vraiment réinitialiser toutes les configurations aux valeurs par défaut ?')) {
        return;
    }

    try {
        // En théorie on devrait DELETE les clés API, mais on va plutôt re-setter les DEFAULTS
        const promises = MODES.map(mode => {
            return fetch('/api/admin/emma-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: 'ai_roles',
                    key: mode,
                    value: DEFAULTS[mode], // Force les valeurs par défaut
                    action: 'set'
                })
            });
        });
        
        await Promise.all(promises);
        await loadEmmaIAConfigs(); // Recharger UI
        showStatus('Configurations réinitialisées', 'info');
    } catch (e) {
        console.error('Erreur reset:', e);
    }
}

// Helper
function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// Exposer globalement pour les onclick HTML
window.loadEmmaIAConfigs = loadEmmaIAConfigs;
window.saveEmmaIAConfigs = saveEmmaIAConfigs;
window.resetEmmaIAConfigs = resetEmmaIAConfigs;
