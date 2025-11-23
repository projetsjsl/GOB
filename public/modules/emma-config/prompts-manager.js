// ═══════════════════════════════════════════════════════════════
// PROMPTS MANAGER - Gestion des prompts et configurations
// ═══════════════════════════════════════════════════════════════

import { loadAllConfigs as apiLoadAll, saveCurrentConfig as apiSave, deleteCurrentConfig as apiDelete } from './api-client.js';
import { showStatus, getSectionEmoji, getChannelBadge, getChannelEmoji } from './ui-helpers.js';
import { updatePreview, updateChannelBadges } from './preview-manager.js';
import { loadDeliveryConfig } from './delivery-manager.js';
import { invalidateDashboardCache } from './dashboard-manager.js';

let allConfigs = {};
let currentConfig = null;

/**
 * Obtient une config par catégorie et key
 */
export function getConfig(category, key) {
    return allConfigs[category]?.[key] || null;
}

/**
 * Obtient toutes les configs
 */
export function getAllConfigs() {
    return allConfigs;
}

/**
 * Charge toutes les configurations
 */
export async function loadConfigs() {
    try {
        showStatus('Chargement...', 'info');
        allConfigs = await apiLoadAll();
        renderConfigList();
        updateStats();
        showStatus('✅ Chargé', 'success');

        // Invalider le cache du dashboard
        invalidateDashboardCache();
    } catch (error) {
        console.error('Erreur chargement:', error);
        showStatus('❌ ' + error.message, 'error');
    }
}

/**
 * Affiche la liste des configs
 */
export function renderConfigList() {
    const container = document.getElementById('configList');
    container.innerHTML = '';

    const searchTerm = document.getElementById('searchFilter').value.toLowerCase();
    const sectionFilter = document.getElementById('sectionFilter').value;
    const channelFilter = document.getElementById('channelFilter').value;
    const sortBy = document.getElementById('sortFilter').value;

    const sections = sectionFilter ? [sectionFilter] : ['prompts', 'variables', 'directives', 'routing'];
    let totalFiltered = 0;

    sections.forEach(section => {
        if (!allConfigs[section]) return;

        // Items filtrés
        let items = Object.entries(allConfigs[section]).filter(([key, config]) => {
            // Filtre recherche
            if (searchTerm) {
                const searchIn = `${key} ${config.description || ''}`.toLowerCase();
                if (!searchIn.includes(searchTerm)) return false;
            }

            // Filtre canal
            if (channelFilter) {
                const configChannel = config.metadata?.channel || '';
                if (configChannel !== channelFilter) return false;
            }

            return true;
        });

        // Tri
        items.sort(([keyA, configA], [keyB, configB]) => {
            switch(sortBy) {
                case 'name':
                    return keyA.localeCompare(keyB);
                case 'name-desc':
                    return keyB.localeCompare(keyA);
                case 'date':
                    return new Date(configB.updated_at || 0) - new Date(configA.updated_at || 0);
                case 'date-asc':
                    return new Date(configA.updated_at || 0) - new Date(configB.updated_at || 0);
                case 'priority':
                    return (configB.priority || 0) - (configA.priority || 0);
                default:
                    return 0;
            }
        });

        if (items.length === 0) return;

        totalFiltered += items.length;

        // Header section
        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'px-4 py-2 bg-gray-100 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase flex justify-between items-center';
        sectionHeader.innerHTML = `
            <span>${getSectionEmoji(section)} ${section}</span>
            <span class="text-gray-400">${items.length}</span>
        `;
        container.appendChild(sectionHeader);

        // Items
        items.forEach(([key, config]) => {
            const item = document.createElement('div');
            item.className = 'config-item px-4 py-3 border-b border-gray-100 cursor-pointer';
            item.onclick = () => selectConfig(section, key, config);

            const isEmpty = !config.value || config.value === '';
            const isOverride = config.is_override || false;
            const channel = config.metadata?.channel || '';
            const channelBadge = getChannelBadge(channel);

            // Highlight search term
            let displayKey = key;
            if (searchTerm) {
                const regex = new RegExp(`(${searchTerm})`, 'gi');
                displayKey = key.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
            }

            item.innerHTML = `
                <div class="flex items-start justify-between">
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-800">${displayKey}</p>
                        <p class="text-xs text-gray-500 truncate mt-1">${config.description || 'Pas de description'}</p>
                    </div>
                    <div class="flex flex-col gap-1 ml-2 flex-shrink-0">
                        ${channelBadge ? `<span class="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 whitespace-nowrap">${channelBadge}</span>` : ''}
                        ${isEmpty ? '<span class="empty-badge text-xs px-2 py-0.5 rounded whitespace-nowrap">Vide</span>' : ''}
                        ${isOverride ? '<span class="override-badge text-xs px-2 py-0.5 rounded whitespace-nowrap">Override</span>' : ''}
                    </div>
                </div>
            `;

            container.appendChild(item);
        });
    });

    if (container.children.length === 0) {
        container.innerHTML = '<div class="p-4 text-center text-gray-400 text-sm">Aucun résultat</div>';
    }

    // Update stats
    document.getElementById('activeCount').textContent = totalFiltered;
}

/**
 * Sélectionne une config pour édition
 */
export function selectConfig(section, key, config) {
    currentConfig = { section, key, ...config };

    // Highlight
    document.querySelectorAll('.config-item').forEach(el => el.classList.remove('active'));
    if (typeof event !== 'undefined' && event.currentTarget) {
        event.currentTarget.classList.add('active');
    } else {
        // Programmatic selection - find and highlight the item
        const items = document.querySelectorAll('.config-item');
        for (const item of items) {
            if (item.dataset.key === key) {
                item.classList.add('active');
                item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                break;
            }
        }
    }

    // Afficher éditeur
    document.getElementById('editorEmpty').classList.add('hidden');
    document.getElementById('editorContent').classList.remove('hidden');
    document.getElementById('saveBtn').classList.remove('hidden');
    document.getElementById('deleteBtn').classList.remove('hidden');

    // Remplir
    document.getElementById('editorTitle').textContent = key;
    const channelEmoji = getChannelEmoji(config.metadata?.channel || '');
    document.getElementById('editorSubtitle').textContent = `${section} • ${config.type || 'string'} ${channelEmoji}`;
    document.getElementById('editSection').value = section;
    document.getElementById('editKey').value = key;
    document.getElementById('editDescription').value = config.description || '';
    document.getElementById('editType').value = config.type || 'string';
    document.getElementById('editCategory').value = config.category || '';
    document.getElementById('editChannel').value = config.metadata?.channel || '';
    document.getElementById('editPriority').value = config.priority || 0;

    // Valeur
    let displayValue = config.value;
    if (config.type === 'json' && typeof config.value === 'object') {
        displayValue = JSON.stringify(config.value, null, 2);
    }
    document.getElementById('editValue').value = displayValue || '';

    // Metadata
    document.getElementById('editUpdatedAt').textContent = config.updated_at ? new Date(config.updated_at).toLocaleString() : '-';
    document.getElementById('editUpdatedBy').textContent = config.updated_by || '-';
    document.getElementById('editVersion').textContent = config.version || '1';
    document.getElementById('editIsOverride').textContent = config.is_override ? 'Oui' : 'Non';

    // Header - Mettre à jour l'indicateur du prompt actuel
    const channelLabel = {
        'web': '💬 Web',
        'sms': '📱 SMS',
        'email': '📧 Email',
        'messenger': '💬 Messenger',
        'multicanal': '🌐 Multicanal'
    }[config.metadata?.channel || ''] || '📝 Tous canaux';

    document.getElementById('currentPromptTitle').textContent = key || 'Sans titre';
    document.getElementById('currentPromptSection').textContent = section || 'Section';
    document.getElementById('currentPromptKey').textContent = key || 'Clé';
    document.getElementById('currentPromptChannel').textContent = channelLabel;
    document.getElementById('currentPromptUpdated').textContent = config.updated_at
        ? new Date(config.updated_at).toLocaleString('fr-FR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        })
        : '-';

    // Mettre à jour le preview et les badges de canaux
    updatePreview();
    updateChannelBadges(key);

    // Charger la configuration de delivery email
    loadDeliveryConfig(section, key);
}

/**
 * Sauvegarde la config actuelle
 */
export async function saveConfig() {
    if (!currentConfig) return;

    try {
        const type = document.getElementById('editType').value;
        let value = document.getElementById('editValue').value;

        // Parse selon type
        if (type === 'json') {
            value = JSON.parse(value);
        } else if (type === 'number') {
            value = parseFloat(value);
        } else if (type === 'boolean') {
            value = value === 'true' || value === true;
        }

        // Metadata avec canal
        const metadata = {
            channel: document.getElementById('editChannel').value || null
        };

        const success = await apiSave(
            currentConfig.section,
            currentConfig.key,
            value,
            document.getElementById('editDescription').value,
            document.getElementById('editCategory').value,
            parseInt(document.getElementById('editPriority').value),
            metadata
        );

        if (success) {
            showStatus('✅ Sauvegardé', 'success');
            await loadConfigs();
            // loadConfigs() invalide déjà le cache, pas besoin de le faire ici
        } else {
            showStatus('❌ Erreur sauvegarde', 'error');
        }
    } catch (error) {
        showStatus('❌ ' + error.message, 'error');
    }
}

/**
 * Supprime la config actuelle
 */
export async function deleteConfig() {
    if (!currentConfig) return;
    if (!confirm(`Supprimer ${currentConfig.section}.${currentConfig.key} ?`)) return;

    try {
        const success = await apiDelete(currentConfig.section, currentConfig.key);

        if (success) {
            showStatus('✅ Supprimé', 'success');
            document.getElementById('editorContent').classList.add('hidden');
            document.getElementById('editorEmpty').classList.remove('hidden');
            await loadConfigs();
            // loadConfigs() invalide déjà le cache, pas besoin de le faire ici
        } else {
            showStatus('❌ Erreur suppression', 'error');
        }
    } catch (error) {
        showStatus('❌ ' + error.message, 'error');
    }
}

/**
 * Crée une nouvelle config
 */
export function createNewConfig() {
    const section = prompt('Section (prompts, variables, directives, routing):');
    if (!section) return;
    const key = prompt('Clé (nom unique):');
    if (!key) return;

    currentConfig = { section, key, value: '', type: 'string', description: '', category: '', priority: 0 };

    selectConfig(section, key, currentConfig);
}

/**
 * Met à jour les stats
 */
function updateStats() {
    let total = 0;
    let active = 0;

    Object.values(allConfigs).forEach(section => {
        Object.values(section).forEach(config => {
            total++;
            if (config.enabled !== false && config.value) active++;
        });
    });

    document.getElementById('totalCount').textContent = total;
    document.getElementById('activeCount').textContent = active;
}

/**
 * Retourne la config actuelle (pour export)
 */
export function getCurrentConfig() {
    return currentConfig;
}
