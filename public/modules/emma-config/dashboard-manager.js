// ═══════════════════════════════════════════════════════════════
// DASHBOARD MANAGER - Gestion du tableau de bord
// ═══════════════════════════════════════════════════════════════

import { loadAllConfigs } from './api-client.js';

let dashboardData = null;
let currentFilter = 'all';

/**
 * Charge et affiche le dashboard
 */
export async function loadDashboard() {
    try {
        const configs = await loadAllConfigs();
        dashboardData = processConfigsForDashboard(configs);

        renderStatistics(dashboardData);
        renderCharts(dashboardData);
        renderTable(dashboardData);
        renderBriefingSchedule(dashboardData);

        updateLastUpdateTime();
    } catch (error) {
        console.error('Erreur chargement dashboard:', error);
        showDashboardError();
    }
}

/**
 * Traite les configs pour le dashboard
 */
function processConfigsForDashboard(configs) {
    const allPrompts = [];
    const stats = {
        total: 0,
        byCategory: {},
        byType: {},
        lastModified: null
    };

    // Parcourir toutes les catégories
    Object.keys(configs).forEach(category => {
        Object.keys(configs[category]).forEach(key => {
            const config = configs[category][key];
            const prompt = {
                key,
                description: config.description || '-',
                type: config.type || 'string',
                category: category,
                value: config.value,
                updated_at: config.updated_at,
                prompt_id: config.prompt_id,
                prompt_number: config.prompt_number,
                delivery_enabled: config.delivery_enabled,
                email_recipients: config.email_recipients
            };

            allPrompts.push(prompt);
            stats.total++;

            // Stats par catégorie
            stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

            // Stats par type
            stats.byType[prompt.type] = (stats.byType[prompt.type] || 0) + 1;

            // Dernière modification
            if (config.updated_at) {
                const date = new Date(config.updated_at);
                if (!stats.lastModified || date > stats.lastModified) {
                    stats.lastModified = date;
                }
            }
        });
    });

    return { allPrompts, stats };
}

/**
 * Affiche les statistiques
 */
function renderStatistics(data) {
    const { allPrompts, stats } = data;

    // Total prompts
    document.getElementById('statTotalPrompts').textContent = stats.total;

    // Briefings actifs
    const briefings = allPrompts.filter(p => p.category === 'briefing');
    document.getElementById('statBriefings').textContent = briefings.length;

    // Prompts system
    const systemPrompts = allPrompts.filter(p => p.category === 'system');
    document.getElementById('statSystemPrompts').textContent = systemPrompts.length;

    // Dernière modification
    if (stats.lastModified) {
        const formatted = formatRelativeTime(stats.lastModified);
        document.getElementById('statLastModified').textContent = formatted;
    }

    // Mettre à jour les compteurs de filtres
    document.getElementById('filterCountAll').textContent = stats.total;
    document.getElementById('filterCountPrompt').textContent = stats.byCategory.prompt || 0;
    document.getElementById('filterCountBriefing').textContent = stats.byCategory.briefing || 0;
    document.getElementById('filterCountSystem').textContent = stats.byCategory.system || 0;
}

/**
 * Affiche les graphiques
 */
function renderCharts(data) {
    const { stats } = data;

    // Graphique par catégorie
    const categoryChart = document.getElementById('categoryChart');
    categoryChart.innerHTML = '';

    const categoryColors = {
        prompt: { bg: 'bg-blue-500', text: 'text-blue-700', light: 'bg-blue-100' },
        briefing: { bg: 'bg-green-500', text: 'text-green-700', light: 'bg-green-100' },
        system: { bg: 'bg-purple-500', text: 'text-purple-700', light: 'bg-purple-100' }
    };

    Object.keys(stats.byCategory).forEach(category => {
        const count = stats.byCategory[category];
        const percentage = ((count / stats.total) * 100).toFixed(1);
        const colors = categoryColors[category] || { bg: 'bg-gray-500', text: 'text-gray-700', light: 'bg-gray-100' };

        categoryChart.innerHTML += `
            <div>
                <div class="flex justify-between items-center mb-1">
                    <span class="text-sm font-medium ${colors.text}">${getCategoryLabel(category)}</span>
                    <span class="text-sm font-bold ${colors.text}">${count} (${percentage}%)</span>
                </div>
                <div class="w-full ${colors.light} rounded-full h-3">
                    <div class="${colors.bg} h-3 rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    });

    // Graphique par type
    const typeChart = document.getElementById('typeChart');
    typeChart.innerHTML = '';

    const typeColors = {
        string: { bg: 'bg-indigo-500', text: 'text-indigo-700', light: 'bg-indigo-100' },
        json: { bg: 'bg-pink-500', text: 'text-pink-700', light: 'bg-pink-100' }
    };

    Object.keys(stats.byType).forEach(type => {
        const count = stats.byType[type];
        const percentage = ((count / stats.total) * 100).toFixed(1);
        const colors = typeColors[type] || { bg: 'bg-gray-500', text: 'text-gray-700', light: 'bg-gray-100' };

        typeChart.innerHTML += `
            <div>
                <div class="flex justify-between items-center mb-1">
                    <span class="text-sm font-medium ${colors.text}">${type.toUpperCase()}</span>
                    <span class="text-sm font-bold ${colors.text}">${count} (${percentage}%)</span>
                </div>
                <div class="w-full ${colors.light} rounded-full h-3">
                    <div class="${colors.bg} h-3 rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    });
}

/**
 * Affiche le tableau
 */
function renderTable(data) {
    const { allPrompts } = data;
    const tbody = document.getElementById('dashboardTableBody');

    if (allPrompts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-4 py-8 text-center text-gray-500">
                    Aucun prompt trouvé
                </td>
            </tr>
        `;
        return;
    }

    // Filtrer selon le filtre actuel
    const filteredPrompts = currentFilter === 'all'
        ? allPrompts
        : allPrompts.filter(p => p.category === currentFilter);

    tbody.innerHTML = filteredPrompts.map(prompt => {
        const valueSize = getValueSize(prompt.value);
        const categoryBadge = getCategoryBadge(prompt.category);
        const typeBadge = getTypeBadge(prompt.type);
        const modifiedDate = prompt.updated_at ? formatDate(new Date(prompt.updated_at)) : '-';

        return `
            <tr class="hover:bg-gray-50 transition" data-category="${prompt.category}">
                <td class="px-4 py-3">
                    <div class="font-medium text-gray-900">${prompt.key}</div>
                    ${prompt.prompt_id ? `<div class="text-xs text-gray-500">ID: ${prompt.prompt_id}</div>` : ''}
                </td>
                <td class="px-4 py-3 text-gray-700 max-w-xs truncate">${prompt.description}</td>
                <td class="px-4 py-3">${typeBadge}</td>
                <td class="px-4 py-3">${categoryBadge}</td>
                <td class="px-4 py-3 text-gray-600">${valueSize}</td>
                <td class="px-4 py-3 text-gray-600 text-xs">${modifiedDate}</td>
                <td class="px-4 py-3 text-center">
                    <button onclick="editPromptFromDashboard('${prompt.category}', '${prompt.key}')"
                            class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                        ✏️ Éditer
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Affiche le planning des briefings
 */
function renderBriefingSchedule(data) {
    const { allPrompts } = data;
    const briefings = allPrompts.filter(p => p.category === 'briefing');
    const container = document.getElementById('briefingSchedule');

    if (briefings.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center col-span-3">Aucun briefing configuré</p>';
        return;
    }

    // Trier par prompt_number
    briefings.sort((a, b) => (a.prompt_number || 0) - (b.prompt_number || 0));

    container.innerHTML = briefings.map(briefing => {
        const config = typeof briefing.value === 'object' ? briefing.value : {};
        const name = config.name || briefing.key;
        const schedule = config.schedule || '-';
        const cron = config.cron_utc || '-';
        const recipients = briefing.email_recipients ? briefing.email_recipients.length : 0;
        const enabled = briefing.delivery_enabled;

        const icon = briefing.key.includes('morning') ? '🌅' :
                     briefing.key.includes('midday') ? '☀️' :
                     briefing.key.includes('evening') ? '🌙' : '📧';

        return `
            <div class="border-2 ${enabled ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'} rounded-lg p-4">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-2">
                        <span class="text-2xl">${icon}</span>
                        <div>
                            <h4 class="font-bold text-gray-800">${name}</h4>
                            <p class="text-xs text-gray-600">${briefing.key}</p>
                        </div>
                    </div>
                    <span class="px-2 py-1 rounded-full text-xs font-medium ${enabled ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}">
                        ${enabled ? '✓ Actif' : '✗ Inactif'}
                    </span>
                </div>
                <div class="space-y-1 text-sm text-gray-700">
                    <div><strong>⏰ Horaire:</strong> ${schedule}</div>
                    <div><strong>🔁 Cron:</strong> <code class="bg-white px-1 py-0.5 rounded text-xs">${cron}</code></div>
                    <div><strong>📧 Destinataires:</strong> ${recipients} personne${recipients > 1 ? 's' : ''}</div>
                </div>
                <button onclick="editPromptFromDashboard('${briefing.category}', '${briefing.key}')"
                        class="mt-3 w-full text-center px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium">
                    ⚙️ Configurer
                </button>
            </div>
        `;
    }).join('');
}

/**
 * Édite un prompt depuis le dashboard
 */
export function editPromptFromDashboard(category, key) {
    // Switch to prompts tab first
    if (window.switchMainTab) {
        window.switchMainTab('prompts');
    }

    // Wait for tab switch and sidebar to render, then select the config
    setTimeout(() => {
        // Get the config data from the prompts manager
        if (window.getConfig && window.selectConfig) {
            const config = window.getConfig(category, key);
            if (config) {
                // Call selectConfig programmatically
                window.selectConfig(category, key, config);
            } else {
                console.error(`Config not found: ${category}/${key}`);
            }
        }
    }, 300);
}

/**
 * Filtre le dashboard
 */
export function filterDashboard(category) {
    currentFilter = category;

    // Mettre à jour les boutons de filtre
    document.querySelectorAll('.dashboard-filter-btn').forEach(btn => {
        btn.classList.remove('bg-indigo-600', 'text-white', 'active');
        btn.classList.add('bg-gray-200', 'text-gray-700');
    });

    const activeBtn = event.target.closest('button');
    if (activeBtn) {
        activeBtn.classList.remove('bg-gray-200', 'text-gray-700');
        activeBtn.classList.add('bg-indigo-600', 'text-white', 'active');
    }

    // Re-render le tableau
    if (dashboardData) {
        renderTable(dashboardData);
    }
}

/**
 * Helpers
 */
function getCategoryLabel(category) {
    const labels = {
        prompt: '📝 Prompts',
        briefing: '📧 Briefings',
        system: '⚙️ System'
    };
    return labels[category] || category;
}

function getCategoryBadge(category) {
    const badges = {
        prompt: '<span class="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">📝 Prompt</span>',
        briefing: '<span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">📧 Briefing</span>',
        system: '<span class="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">⚙️ System</span>'
    };
    return badges[category] || `<span class="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">${category}</span>`;
}

function getTypeBadge(type) {
    const badges = {
        string: '<span class="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-mono">string</span>',
        json: '<span class="px-2 py-1 bg-pink-100 text-pink-700 rounded text-xs font-mono">json</span>'
    };
    return badges[type] || `<span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono">${type}</span>`;
}

function getValueSize(value) {
    if (!value) return '0 B';

    const str = typeof value === 'string' ? value : JSON.stringify(value);
    const bytes = new Blob([str]).size;

    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function formatRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}j`;
    return formatDate(date).split(' ')[0];
}

function updateLastUpdateTime() {
    const now = new Date();
    document.getElementById('dashboardLastUpdate').textContent =
        `Dernière mise à jour: ${formatDate(now)}`;
}

function showDashboardError() {
    const tbody = document.getElementById('dashboardTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="px-4 py-8 text-center text-red-500">
                <div class="flex flex-col items-center gap-2">
                    <span class="text-4xl">⚠️</span>
                    <p class="font-semibold">Erreur de chargement</p>
                    <p class="text-sm">Impossible de charger les données du dashboard</p>
                </div>
            </td>
        </tr>
    `;
}
