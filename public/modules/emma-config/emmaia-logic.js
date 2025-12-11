/**
 * Logique pour l'onglet Emma IA (Configuration des modèles Chat)
 */
import { showStatus } from './ui-helpers.js';

const STORAGE_KEY = 'emma-mode-configs';

const MODES = ['researcher', 'writer', 'critic', 'technical'];

const DEFAULTS = {
    researcher: { modelId: 'sonar-pro', googleSearch: true },
    writer: { modelId: 'gemini-2.0-pro', googleSearch: false },
    critic: { modelId: 'claude-3-5-sonnet', googleSearch: true },
    technical: { modelId: 'gemini-2.5-flash', googleSearch: false }
};

/**
 * Charge les configurations depuis le localStorage
 */
export function loadEmmaIAConfigs() {
    console.log('🔄 Chargement des configs Emma IA...');
    
    let configs = {};
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            configs = JSON.parse(saved);
        }
    } catch (e) {
        console.error('Erreur chargement configs:', e);
        showStatus('Erreur de lecture des configs', 'error');
    }

    // Appliquer aux 4 modes
    MODES.forEach(mode => {
        // Combiner défauts + sauvegardé
        const modeConfig = { ...DEFAULTS[mode], ...(configs[mode] || {}) };
        
        // Settings UI Elements
        const modelSelect = document.getElementById(`emmaia${capitalize(mode)}Model`);
        const searchCheck = document.getElementById(`emmaia${capitalize(mode)}GoogleSearch`);

        if (modelSelect) modelSelect.value = modeConfig.modelId;
        if (searchCheck) searchCheck.checked = modeConfig.googleSearch;
    });

    showStatus('Configurations chargées', 'success');
}

/**
 * Sauvegarde les configurations dans le localStorage
 */
export function saveEmmaIAConfigs() {
    const configs = {};

    MODES.forEach(mode => {
        const modelSelect = document.getElementById(`emmaia${capitalize(mode)}Model`);
        const searchCheck = document.getElementById(`emmaia${capitalize(mode)}GoogleSearch`);

        if (modelSelect && searchCheck) {
            configs[mode] = {
                modelId: modelSelect.value,
                googleSearch: searchCheck.checked
            };
        }
    });

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
        showStatus('Configurations sauvegardées avec succès!', 'success');
        
        // Petit effet visuel
        const btn = document.querySelector('button[onclick="saveEmmaIAConfigs()"]');
        if (btn) {
            const originalText = btn.textContent;
            btn.textContent = '✅ Sauvegardé!';
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
export function resetEmmaIAConfigs() {
    if (!confirm('Voulez-vous vraiment réinitialiser toutes les configurations aux valeurs par défaut ?')) {
        return;
    }

    try {
        localStorage.removeItem(STORAGE_KEY);
        loadEmmaIAConfigs(); // Recharger (utilisera les DEFAULTS)
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
