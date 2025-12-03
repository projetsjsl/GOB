/**
 * Système de gestion des permissions des composants
 * Charge les permissions depuis Supabase et filtre les composants affichés
 */

// Cache des permissions
let userPermissions = null;
let userRole = null;

/**
 * Charger les permissions de l'utilisateur actuel
 */
async function loadUserPermissions() {
    try {
        // Récupérer l'utilisateur depuis sessionStorage
        const userData = sessionStorage.getItem('gob-user');
        if (!userData) {
            console.warn('[Roles] Aucun utilisateur connecté');
            return null;
        }

        const user = JSON.parse(userData);
        const username = user.username || user.role;

        // Charger les permissions depuis l'API
        const response = await fetch('/api/roles-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get_user_permissions',
                username: username
            })
        });

        const data = await response.json();

        if (data.success && data.permissions) {
            userPermissions = data.permissions.component_permissions || {};
            userRole = data.permissions.role_name;
            console.log('[Roles] Permissions chargées:', userPermissions);
            return userPermissions;
        } else {
            console.warn('[Roles] Aucune permission trouvée pour', username);
            // Permissions par défaut (tout visible)
            userPermissions = {};
            return userPermissions;
        }
    } catch (error) {
        console.error('[Roles] Erreur chargement permissions:', error);
        // En cas d'erreur, tout est visible (fallback)
        userPermissions = {};
        return userPermissions;
    }
}

/**
 * Vérifier si un composant est autorisé
 */
function hasPermission(componentId) {
    // Si pas de permissions chargées, tout est autorisé (fallback)
    if (!userPermissions) {
        return true;
    }

    // Si le composant n'est pas dans les permissions, autoriser par défaut
    if (!(componentId in userPermissions)) {
        return true;
    }

    // Retourner la permission
    return userPermissions[componentId] === true;
}

/**
 * Filtrer les tabs selon les permissions
 */
function filterTabsByPermissions(tabs) {
    if (!userPermissions) {
        return tabs; // Pas de filtrage si pas de permissions
    }

    return tabs.filter(tab => {
        // Toujours autoriser certains tabs de base
        if (tab.id === 'plus' || tab.id === 'theme-selector') {
            return true;
        }

        // Vérifier la permission
        return hasPermission(tab.id);
    });
}

/**
 * Masquer les composants non autorisés dans le DOM
 */
function hideUnauthorizedComponents() {
    if (!userPermissions) {
        return; // Pas de masquage si pas de permissions
    }

    // Liste des IDs de composants
    const componentIds = [
        'stocks-news',
        'ask-emma',
        'intellistocks',
        'economic-calendar',
        'investing-calendar',
        'yield-curve',
        'markets-economy',
        'dans-watchlist',
        'scrapping-sa',
        'seeking-alpha',
        'email-briefings',
        'admin-jslai',
        'emma-sms',
        'fastgraphs',
        'news-ticker',
        'theme-selector'
    ];

    componentIds.forEach(componentId => {
        if (!hasPermission(componentId)) {
            // Masquer les tabs correspondants
            const tabElements = document.querySelectorAll(`[data-tab="${componentId}"], [data-component="${componentId}"]`);
            tabElements.forEach(el => {
                el.style.display = 'none';
            });

            // Masquer les contenus de tabs
            const tabContent = document.getElementById(`tab-${componentId}`);
            if (tabContent) {
                tabContent.style.display = 'none';
            }
        }
    });
}

/**
 * Initialiser le système de permissions
 */
async function initRolesPermissions() {
    await loadUserPermissions();
    hideUnauthorizedComponents();
    
    // Exposer les fonctions globalement pour utilisation dans le dashboard
    window.hasPermission = hasPermission;
    window.userPermissions = userPermissions;
    window.userRole = userRole;
    
    console.log('[Roles] Système de permissions initialisé');
    console.log('[Roles] Rôle:', userRole);
    console.log('[Roles] Permissions:', userPermissions);
}

// Initialiser au chargement
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRolesPermissions);
} else {
    initRolesPermissions();
}

// Exporter pour utilisation dans d'autres scripts
window.RolesPermissions = {
    loadUserPermissions,
    hasPermission,
    filterTabsByPermissions,
    hideUnauthorizedComponents,
    initRolesPermissions
};

