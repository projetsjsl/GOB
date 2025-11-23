// ═══════════════════════════════════════════════════════════════
// DASHBOARD MANAGER - Gestion du tableau de bord
// ═══════════════════════════════════════════════════════════════

import { loadAllConfigs } from './api-client.js';

let dashboardData = null;
let currentFilter = 'all';
let relationshipFilter = null; // Pour filtrer par relations
let promptRelationships = {}; // Map des relations entre prompts

/**
 * Charge et affiche le dashboard
 */
export async function loadDashboard() {
    try {
        const configs = await loadAllConfigs();
        dashboardData = processConfigsForDashboard(configs);

        // Build relationship map
        buildPromptRelationships(dashboardData.allPrompts);

        renderStatistics(dashboardData);
        renderArchitecture(dashboardData);
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
 * Construit la carte des relations entre prompts
 */
function buildPromptRelationships(allPrompts) {
    promptRelationships = {};

    allPrompts.forEach(prompt => {
        const key = prompt.key;
        promptRelationships[key] = {
            references: [], // Prompts référencés par celui-ci
            referencedBy: [] // Prompts qui référencent celui-ci
        };

        // Analyser le contenu pour trouver les références
        const content = typeof prompt.value === 'string'
            ? prompt.value
            : JSON.stringify(prompt.value);

        if (content) {
            // Chercher les références à d'autres prompts
            allPrompts.forEach(otherPrompt => {
                if (otherPrompt.key !== key) {
                    // Vérifier si le prompt fait référence à l'autre
                    const patterns = [
                        new RegExp(`\\b${otherPrompt.key}\\b`, 'i'),
                        new RegExp(`"${otherPrompt.key}"`, 'i'),
                        new RegExp(`'${otherPrompt.key}'`, 'i'),
                        new RegExp(`prompt_id.*${otherPrompt.prompt_id}`, 'i')
                    ];

                    const hasReference = patterns.some(pattern => pattern.test(content));
                    if (hasReference) {
                        promptRelationships[key].references.push(otherPrompt.key);
                    }
                }
            });
        }
    });

    // Construire les "referencedBy" (inverse)
    Object.keys(promptRelationships).forEach(key => {
        promptRelationships[key].references.forEach(refKey => {
            if (promptRelationships[refKey]) {
                if (!promptRelationships[refKey].referencedBy.includes(key)) {
                    promptRelationships[refKey].referencedBy.push(key);
                }
            }
        });
    });

    console.log('Relationships built:', promptRelationships);
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
 * Affiche l'architecture des prompts
 */
function renderArchitecture(data) {
    const { allPrompts } = data;
    const container = document.getElementById('promptsArchitecture');

    // Organiser les prompts par catégorie
    const system = allPrompts.filter(p => p.category === 'system' || p.key.includes('cfa_') || p.key.includes('identity'));
    const intents = allPrompts.filter(p => p.key.includes('intent_'));
    const briefings = allPrompts.filter(p => p.category === 'briefing');
    const others = allPrompts.filter(p => !system.includes(p) && !intents.includes(p) && !briefings.includes(p));

    // Structure hiérarchique
    const architecture = `
        <div class="space-y-8">
            <!-- Légende -->
            <div class="flex flex-wrap gap-4 text-xs">
                <div class="flex items-center gap-2">
                    <div class="w-4 h-4 bg-purple-500 rounded"></div>
                    <span class="text-gray-700">Système (Base)</span>
                </div>
                <div class="flex items-center gap-2">
                    <div class="w-4 h-4 bg-blue-500 rounded"></div>
                    <span class="text-gray-700">Intents (Spécialisés)</span>
                </div>
                <div class="flex items-center gap-2">
                    <div class="w-4 h-4 bg-green-500 rounded"></div>
                    <span class="text-gray-700">Briefings (Automatisés)</span>
                </div>
                <div class="flex items-center gap-2">
                    <div class="w-4 h-4 bg-gray-400 rounded"></div>
                    <span class="text-gray-700">Autres</span>
                </div>
            </div>

            <!-- Niveau 1: Prompts Système (Base) -->
            ${system.length > 0 ? `
            <div class="relative">
                <div class="text-center mb-4">
                    <h4 class="text-sm font-bold text-purple-700 bg-purple-100 inline-block px-4 py-2 rounded-full">
                        📋 Niveau 1: Prompts Système (Base)
                    </h4>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-${Math.min(system.length, 4)} gap-4">
                    ${system.map(prompt => createArchitectureNode(prompt, 'purple')).join('')}
                </div>
            </div>
            ` : ''}

            <!-- Flèche vers le bas -->
            ${system.length > 0 && intents.length > 0 ? `
            <div class="flex justify-center">
                <div class="flex flex-col items-center">
                    <div class="text-3xl text-gray-400">↓</div>
                    <div class="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">utilisés par</div>
                </div>
            </div>
            ` : ''}

            <!-- Niveau 2: Prompts d'Intent (Spécialisés) -->
            ${intents.length > 0 ? `
            <div class="relative">
                <div class="text-center mb-4">
                    <h4 class="text-sm font-bold text-blue-700 bg-blue-100 inline-block px-4 py-2 rounded-full">
                        🎯 Niveau 2: Prompts d'Intent (Analyses Spécialisées)
                    </h4>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-${Math.min(intents.length, 3)} gap-4">
                    ${intents.map(prompt => createArchitectureNode(prompt, 'blue')).join('')}
                </div>
            </div>
            ` : ''}

            <!-- Flèche vers le bas -->
            ${intents.length > 0 && briefings.length > 0 ? `
            <div class="flex justify-center">
                <div class="flex flex-col items-center">
                    <div class="text-3xl text-gray-400">↓</div>
                    <div class="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">intégrés dans</div>
                </div>
            </div>
            ` : ''}

            <!-- Niveau 3: Briefings (Automatisés) -->
            ${briefings.length > 0 ? `
            <div class="relative">
                <div class="text-center mb-4">
                    <h4 class="text-sm font-bold text-green-700 bg-green-100 inline-block px-4 py-2 rounded-full">
                        📧 Niveau 3: Briefings Automatisés (Cron)
                    </h4>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    ${briefings.map(prompt => createArchitectureNode(prompt, 'green', true)).join('')}
                </div>
            </div>
            ` : ''}

            <!-- Autres prompts -->
            ${others.length > 0 ? `
            <div class="relative mt-8 pt-6 border-t-2 border-gray-200">
                <div class="text-center mb-4">
                    <h4 class="text-sm font-bold text-gray-700 bg-gray-100 inline-block px-4 py-2 rounded-full">
                        📦 Autres Configurations
                    </h4>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                    ${others.map(prompt => createArchitectureNode(prompt, 'gray', false, true)).join('')}
                </div>
            </div>
            ` : ''}
        </div>
    `;

    container.innerHTML = architecture;
}

/**
 * Crée un noeud d'architecture
 */
function createArchitectureNode(prompt, color, isBriefing = false, isSmall = false) {
    const colors = {
        purple: { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-700', hover: 'hover:bg-purple-100' },
        blue: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-700', hover: 'hover:bg-blue-100' },
        green: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700', hover: 'hover:bg-green-100' },
        gray: { bg: 'bg-gray-50', border: 'border-gray-400', text: 'text-gray-700', hover: 'hover:bg-gray-100' }
    };

    const c = colors[color] || colors.gray;
    const valueSize = getValueSize(prompt.value);

    let title = prompt.key;
    let subtitle = prompt.description || '-';

    // Pour les briefings, extraire le nom et l'horaire
    if (isBriefing && typeof prompt.value === 'object') {
        const config = prompt.value;
        title = config.name || prompt.key;
        subtitle = config.schedule || subtitle;
    }

    const sizeClass = isSmall ? 'text-xs p-2' : 'text-sm p-3';

    return `
        <div class="relative ${c.bg} border-2 ${c.border} rounded-lg ${sizeClass} ${c.hover} cursor-pointer transition-all duration-200 transform hover:scale-105 hover:shadow-lg group">
            <div class="font-bold ${c.text} mb-1 truncate" title="${prompt.key}">
                ${title}
            </div>
            <div class="text-xs text-gray-600 mb-2 line-clamp-2" title="${subtitle}">
                ${subtitle}
            </div>
            <div class="flex items-center justify-between text-xs">
                <span class="bg-white px-2 py-0.5 rounded border ${c.border}">
                    ${prompt.type}
                </span>
                <span class="text-gray-500">${valueSize}</span>
            </div>
            ${isBriefing && prompt.delivery_enabled ? `
                <div class="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow">
                    ⏰
                </div>
            ` : ''}
            <!-- Boutons d'action au hover -->
            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <button onclick="event.stopPropagation(); window.filterByRelatedPrompts('${prompt.key}')"
                        class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg">
                    🔗 Voir relations
                </button>
                <button onclick="event.stopPropagation(); editPromptFromDashboard('${prompt.category}', '${prompt.key}')"
                        class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg">
                    ✏️ Éditer
                </button>
            </div>
        </div>
    `;
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
    let filteredPrompts = allPrompts;

    // Relationship filter takes precedence
    if (relationshipFilter) {
        const relationships = promptRelationships[relationshipFilter];
        if (relationships) {
            const relatedKeys = [
                relationshipFilter,
                ...relationships.references,
                ...relationships.referencedBy
            ];
            filteredPrompts = allPrompts.filter(p => relatedKeys.includes(p.key));
        }
    } else if (currentFilter !== 'all') {
        // Category filter
        filteredPrompts = allPrompts.filter(p => p.category === currentFilter);
    }

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
    relationshipFilter = null; // Reset relationship filter

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

    // Hide clear filter button
    hideRelationshipFilterBanner();

    // Re-render le tableau
    if (dashboardData) {
        renderTable(dashboardData);
    }
}

/**
 * Filtre par prompts reliés
 */
export function filterByRelatedPrompts(promptKey) {
    relationshipFilter = promptKey;

    // Get related prompts
    const relationships = promptRelationships[promptKey];
    if (!relationships) {
        console.warn(`No relationships found for ${promptKey}`);
        return;
    }

    const relatedKeys = [
        promptKey,
        ...relationships.references,
        ...relationships.referencedBy
    ];

    console.log(`Filtering by prompts related to ${promptKey}:`, relatedKeys);

    // Reset category filter
    currentFilter = 'all';

    // Show relationship filter banner
    showRelationshipFilterBanner(promptKey, relatedKeys.length);

    // Re-render table with relationship filter
    if (dashboardData) {
        renderTable(dashboardData);
    }

    // Scroll to table
    document.getElementById('dashboardTable')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Affiche la bannière de filtre par relations
 */
function showRelationshipFilterBanner(promptKey, count) {
    let banner = document.getElementById('relationshipFilterBanner');

    if (!banner) {
        // Créer la bannière
        const tableContainer = document.querySelector('#dashboardTable').parentElement;
        banner = document.createElement('div');
        banner.id = 'relationshipFilterBanner';
        tableContainer.insertBefore(banner, tableContainer.firstChild);
    }

    banner.className = 'mb-4 p-4 bg-blue-50 border-2 border-blue-500 rounded-lg flex items-center justify-between';
    banner.innerHTML = `
        <div class="flex items-center gap-3">
            <span class="text-2xl">🔗</span>
            <div>
                <h4 class="font-bold text-blue-900">Filtrage par relations actif</h4>
                <p class="text-sm text-blue-700">
                    Affichage de <strong>${count} prompt${count > 1 ? 's' : ''}</strong> reliés à <strong class="font-mono bg-blue-100 px-2 py-0.5 rounded">${promptKey}</strong>
                </p>
            </div>
        </div>
        <button onclick="window.clearRelationshipFilter()"
                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2">
            <span>✕</span>
            <span>Annuler le filtre</span>
        </button>
    `;
}

/**
 * Cache la bannière de filtre par relations
 */
function hideRelationshipFilterBanner() {
    const banner = document.getElementById('relationshipFilterBanner');
    if (banner) {
        banner.remove();
    }
}

/**
 * Annule le filtre par relations
 */
export function clearRelationshipFilter() {
    relationshipFilter = null;
    hideRelationshipFilterBanner();

    // Re-render table
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
