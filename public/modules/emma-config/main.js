// ═══════════════════════════════════════════════════════════════
// MAIN - Initialisation et coordination de l'application
// ═══════════════════════════════════════════════════════════════

import { switchMainTab, clearFilters } from './ui-helpers.js';
import './emmaia-logic.js'; // Import for side-effects (window exposure)
import { updatePreview, updateChannelBadges } from './preview-manager.js';
import { loadDesignConfig, updateDesignPreview, saveDesign, cancelDesignChanges, resetDesignToDefaults } from './design-manager.js';
import { saveSms, cancelSmsChanges } from './sms-manager.js';
import { showAddRecipientForm, hideAddRecipientForm, addRecipient, removeRecipient, toggleRecipientActive, saveDeliveryConfig, sendBriefingNow } from './delivery-manager.js';
import { loadConfigs, renderConfigList, saveConfig, deleteConfig, createNewConfig, getCurrentConfig, selectConfig, getConfig } from './prompts-manager.js';
import { loadDashboard, filterDashboard, editPromptFromDashboard, filterByRelatedPrompts, clearRelationshipFilter, reloadDashboard } from './dashboard-manager.js';
import { initChatAssistant } from './chat-assistant.js';
import { initBuilder } from './builder.js';

/**
 * Fonction d'initialisation principale
 */
export async function init() {
    // ═══════════════════════════════════════════════════════════
    // EXPOSE FUNCTIONS TO GLOBAL SCOPE (pour onclick HTML)
    // ═══════════════════════════════════════════════════════════
    window.switchMainTab = switchMainTab;
    window.selectConfig = selectConfig;
    window.getConfig = getConfig;
    window.updatePreview = updatePreview;
    window.saveDesignConfig = saveDesign;
    window.cancelDesignChanges = cancelDesignChanges;
    window.resetDesignToDefaults = resetDesignToDefaults;
    window.saveSmsConfig = saveSms;
    window.cancelSmsChanges = cancelSmsChanges;
    window.showAddRecipientForm = showAddRecipientForm;
    window.hideAddRecipientForm = hideAddRecipientForm;
    window.addRecipient = addRecipient;
    window.removeRecipient = removeRecipient;
    window.toggleRecipientActive = toggleRecipientActive;
    window.saveDeliveryConfig = () => saveDeliveryConfig(getCurrentConfig());
    window.sendBriefingNow = () => sendBriefingNow(getCurrentConfig());
    window.loadDashboard = loadDashboard;
    window.reloadDashboard = reloadDashboard;
    window.filterDashboard = filterDashboard;
    window.editPromptFromDashboard = editPromptFromDashboard;
    window.filterByRelatedPrompts = filterByRelatedPrompts;
    window.clearRelationshipFilter = clearRelationshipFilter;

    // ═══════════════════════════════════════════════════════════
    // EVENT LISTENERS
    // ═══════════════════════════════════════════════════════════

    // Boutons principaux
    document.getElementById('refreshBtn').addEventListener('click', loadConfigs);
    document.getElementById('saveBtn').addEventListener('click', saveConfig);
    document.getElementById('deleteBtn').addEventListener('click', deleteConfig);
    document.getElementById('addBtn').addEventListener('click', createNewConfig);

    // Preview events
    document.getElementById('editValue').addEventListener('input', () => {
        updatePreview();
        const config = getCurrentConfig();
        if (config) updateChannelBadges(config.key);
    });
    document.getElementById('previewMode').addEventListener('change', updatePreview);

    // Design field listeners - update preview when design changes
    const designFields = [
        // Colors (basic + advanced)
        'promptDesignColorPrimary', 'promptDesignColorPrimaryDark', 'promptDesignColorPrimaryLight',
        'promptDesignColorTextDark', 'promptDesignColorTextMuted',
        'promptDesignColorBackground', 'promptDesignColorBorder', 'promptDesignColorLink',
        'promptDesignColorButton', 'promptDesignColorSuccess', 'promptDesignColorWarning',
        // Branding
        'promptDesignBrandingCompanyName', 'promptDesignBrandingTagline',
        'promptDesignBrandingAvatarUrl', 'promptDesignBrandingLogoUrl',
        // Header & Footer
        'promptDesignHeaderShowAvatar', 'promptDesignHeaderShowDate', 'promptDesignHeaderShowEdition',
        'promptDesignFooterShowLogo', 'promptDesignFooterShowDisclaimer', 'promptDesignFooterCopyright',
        // SMS
        'promptDesignSmsMaxSegments', 'promptDesignSmsSignature', 'promptDesignSmsAlertThreshold',
        // Typography
        'promptDesignTypoFontFamily', 'promptDesignTypoFontSize', 'promptDesignTypoLineHeight',
        // Layout
        'promptDesignLayoutBorderRadius', 'promptDesignLayoutContainerWidth',
        'promptDesignLayoutPadding', 'promptDesignLayoutShadow',
        // Sections
        'promptDesignSectionsShowCallout', 'promptDesignSectionsShowSidebar',
        'promptDesignSectionsShowBadges', 'promptDesignSectionsShowDividers',
        'promptDesignSectionsCalloutBg', 'promptDesignSectionsCalloutBorder',
        // Emojis
        'promptDesignEmojiHeader', 'promptDesignEmojiSuccess', 'promptDesignEmojiAlert'
    ];

    designFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            const eventType = field.type === 'checkbox' ? 'change' : 'input';
            field.addEventListener(eventType, updatePreview);
        }
    });

    // Sync color pickers with text inputs (Design tab)
    ['Primary', 'PrimaryDark', 'PrimaryLight', 'Text'].forEach(name => {
        const picker = document.getElementById('designColor' + name);
        const text = document.getElementById('designColor' + name + (name === 'Text' ? 'Value' : 'Text'));
        if (picker && text) {
            picker.addEventListener('input', () => { text.value = picker.value; updateDesignPreview(); });
            text.addEventListener('input', () => { picker.value = text.value; updateDesignPreview(); });
        }
    });

    // Update design preview on any input change
    document.querySelectorAll('#designTabContent input, #designTabContent textarea').forEach(el => {
        el.addEventListener('change', updateDesignPreview);
    });

    // Filter events
    document.getElementById('searchFilter').addEventListener('input', renderConfigList);
    document.getElementById('sectionFilter').addEventListener('change', renderConfigList);
    document.getElementById('channelFilter').addEventListener('change', renderConfigList);
    document.getElementById('sortFilter').addEventListener('change', renderConfigList);

    // Clear filters button
    document.getElementById('clearFilters').addEventListener('click', () => {
        clearFilters();
        renderConfigList();
    });

    // Event listener pour la fréquence (afficher/masquer jours)
    document.getElementById('deliveryFrequency')?.addEventListener('change', (e) => {
        const freq = e.target.value;
        const showDays = freq === 'daily' || freq === 'weekly';
        document.getElementById('deliveryDaysSection').classList.toggle('hidden', !showDays);
    });

    // Raccourcis clavier
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveConfig();
        }
    });

    // ═══════════════════════════════════════════════════════════
    // INITIALISATION
    // ═══════════════════════════════════════════════════════════

    console.log('🚀 Initialisation Emma Config...');

    // Charger les prompts d'abord (nécessaire pour le dashboard)
    await loadConfigs();
    console.log('✅ Prompts chargés');

    // Initialiser le chatbot
    initChatAssistant();

    // Charger le dashboard si c'est l'onglet actif par défaut
    // Utiliser setTimeout pour s'assurer que le DOM est prêt
    setTimeout(() => {
        const dashboardTab = document.getElementById('tabDashboard');
        if (dashboardTab && dashboardTab.classList.contains('bg-white')) {
            console.log('📊 Onglet dashboard actif, chargement...');
            loadDashboard();
        }
    }, 100);

    // Initialiser le Visual Builder
    initBuilder();
}
