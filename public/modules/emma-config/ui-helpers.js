// ═══════════════════════════════════════════════════════════════
// UI HELPERS - Utilitaires pour l'interface
// ═══════════════════════════════════════════════════════════════

/**
 * Affiche un message de status
 */
export function showStatus(message, type) {
    const el = document.getElementById('statusSidebar');
    const text = document.getElementById('statusText');

    el.classList.remove('hidden', 'bg-green-50', 'bg-red-50', 'bg-blue-50', 'text-green-800', 'text-red-800', 'text-blue-800');

    if (type === 'success') {
        el.classList.add('bg-green-50', 'text-green-800');
    } else if (type === 'error') {
        el.classList.add('bg-red-50', 'text-red-800');
    } else {
        el.classList.add('bg-blue-50', 'text-blue-800');
    }

    text.textContent = message;

    if (type !== 'info') {
        setTimeout(() => el.classList.add('hidden'), 3000);
    }
}

/**
 * Masque le message de status
 */
export function hideStatus() {
    document.getElementById('statusSidebar').classList.add('hidden');
}

/**
 * Bascule entre les onglets principaux
 */
export function switchMainTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.main-tab').forEach(btn => {
        btn.classList.remove('bg-white', 'shadow', 'font-medium');
        btn.classList.add('text-gray-600');
    });

    const activeBtn = document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1));
    if (activeBtn) {
        activeBtn.classList.add('bg-white', 'shadow', 'font-medium');
        activeBtn.classList.remove('text-gray-600');
    }

    // Show/hide content
    document.getElementById('dashboardTabContent').classList.toggle('hidden', tab !== 'dashboard');
    document.getElementById('promptsTabContent').classList.toggle('hidden', tab !== 'prompts');
    document.getElementById('designTabContent').classList.toggle('hidden', tab !== 'design');
    document.getElementById('smsTabContent').classList.toggle('hidden', tab !== 'sms');
    document.getElementById('helpTabContent').classList.toggle('hidden', tab !== 'help');
    
    // Handle Emma IA tab if it exists
    const emmaiaContent = document.getElementById('emmaiaTabContent');
    if (emmaiaContent) {
        emmaiaContent.classList.toggle('hidden', tab !== 'emmaia');
    }

    // Update header
    const titles = {
        dashboard: '📊 Configuration',
        prompts: '📝 Gestion des Prompts',
        design: '🎨 Design des Emails',
        sms: '📱 Configuration SMS',
        help: '📖 Mode d\'Emploi',
        emmaia: '🤖 Emma IA - Modèles Chat'
    };
    document.getElementById('editorTitle').textContent = titles[tab] || 'Configuration';
    document.getElementById('editorSubtitle').textContent = '';

    // Load dashboard data if switching to dashboard
    if (tab === 'dashboard' && window.loadDashboard) {
        window.loadDashboard();
    }
    
    // Load Emma IA configs if switching to emmaia
    if (tab === 'emmaia' && window.loadEmmaIAConfigs) {
        window.loadEmmaIAConfigs();
    }

    return tab;
}

/**
 * Toggle icon (▶ / ▼)
 */
export function toggleIcon(iconId) {
    const icon = document.getElementById(iconId);
    if (icon) {
        icon.textContent = icon.textContent === '▶' ? '▼' : '▶';
    }
}

/**
 * Clear filters
 */
export function clearFilters() {
    document.getElementById('searchFilter').value = '';
    document.getElementById('sectionFilter').value = '';
    document.getElementById('channelFilter').value = '';
    document.getElementById('sortFilter').value = 'name';
}

/**
 * Get section emoji
 */
export function getSectionEmoji(section) {
    const emojis = {
        'prompts': '📝',
        'variables': '⚙️',
        'directives': '🎯',
        'routing': '🧭'
    };
    return emojis[section] || '📄';
}

/**
 * Get channel badge
 */
export function getChannelBadge(channel) {
    const badges = {
        'web': '💬 Web',
        'sms': '📱 SMS',
        'email': '📧 Email',
        'messenger': '💬 MSG',
        'multicanal': '🌐 Multi'
    };
    return badges[channel] || '';
}

/**
 * Get channel emoji
 */
export function getChannelEmoji(channel) {
    const emojis = {
        'web': '💬',
        'sms': '📱',
        'email': '📧',
        'messenger': '💬',
        'multicanal': '🌐'
    };
    return emojis[channel] ? `• ${emojis[channel]}` : '';
}
