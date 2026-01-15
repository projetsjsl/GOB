/**
 * Systeme de gestion des permissions des composants
 * Charge les permissions depuis Supabase et filtre les composants affiches
 */

// Cache des permissions
let userPermissions = null;
let userRole = null;

/**
 * Get default permissions for a role
 */
function getDefaultPermissionsForRole(role) {
    const defaults = {
        admin: {
            'stocks-news': true,
            'ask-emma': true,
            'jlab': true,
            'economic-calendar': true,
            'investing-calendar': true,
            'yield-curve': true,
            'markets-economy': true,
            'dans-watchlist': true,
            'scrapping-sa': true,
            'seeking-alpha': true,
            'email-briefings': true,
            'admin-jslai': true,
            'admin-jsla': true,
            'emma-sms': true,
            'fastgraphs': true,
            'groupchat': true,
            'emmaiai': true,
            'emma-live': true,
            'emma-finvox': true,
            'emma-group': true,
            'emma-terminal': true,
            'emma-vocal': true
        },
        analyst: {
            'stocks-news': true,
            'ask-emma': true,
            'jlab': true,
            'economic-calendar': true,
            'markets-economy': true,
            'seeking-alpha': true
        },
        viewer: {
            'stocks-news': true,
            'markets-economy': true
        }
    };
    return defaults[role] || defaults.viewer;
}

/**
 * Charger les permissions de l'utilisateur actuel
 */
async function loadUserPermissions() {
    try {
        // 1. Check if auth-guard already set the role
        if (window.__EMMA_ROLE__) {
            userRole = window.__EMMA_ROLE__;
            userPermissions = getDefaultPermissionsForRole(userRole);
            console.log('[Roles] Using role from auth-guard:', userRole);
            return userPermissions;
        }
        
        // 2. Recuperer l'utilisateur depuis sessionStorage
        let userData = null;
        try {
            userData = sessionStorage.getItem('gob-user');
        } catch (e) {
            console.warn('[Roles] Cannot access sessionStorage:', e);
        }
        
        if (!userData) {
            console.warn('[Roles] Aucun utilisateur connecte, using admin fallback');
            userRole = 'admin';
            userPermissions = getDefaultPermissionsForRole('admin');
            return userPermissions;
        }

        const user = JSON.parse(userData);
        const username = user.username || user.role;
        
        // If user already has role, use it
        if (user.role) {
            userRole = user.role;
            userPermissions = user.permissions || getDefaultPermissionsForRole(user.role);
            console.log('[Roles] Using role from session:', userRole);
            return userPermissions;
        }

        // 3. Try loading from API (optional, may fail)
        try {
            const response = await fetch('/api/roles-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'get_user_permissions',
                    username: username
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.permissions) {
                    userPermissions = data.permissions.component_permissions || {};
                    userRole = data.permissions.role_name;
                    console.log('[Roles] Permissions loaded from API:', userPermissions);
                    return userPermissions;
                }
            }
        } catch (apiError) {
            console.warn('[Roles] API call failed, using defaults:', apiError.message);
        }
        
        // 4. Fallback to default permissions
        console.warn('[Roles] Using default admin permissions');
        userRole = 'admin';
        userPermissions = getDefaultPermissionsForRole('admin');
        return userPermissions;
        
    } catch (error) {
        console.error('[Roles] Erreur chargement permissions:', error);
        userRole = 'admin';
        userPermissions = getDefaultPermissionsForRole('admin');
        return userPermissions;
    }
}

/**
 * Verifier si un composant est autorise
 */
function hasPermission(componentId) {
    // Si pas de permissions chargees, tout est autorise (fallback)
    if (!userPermissions) {
        return true;
    }

    // Si le composant n'est pas dans les permissions, autoriser par defaut
    if (!(componentId in userPermissions)) {
        return true;
    }

    // Retourner la permission
    return userPermissions[componentId] === true;
}

/**
 * Verifier si l'utilisateur est admin
 */
function isAdminUser() {
    // Verifier depuis userRole
    if (userRole === 'admin') {
        return true;
    }
    
    // Verifier depuis window global
    if (window.__EMMA_ROLE__ === 'admin') {
        return true;
    }
    
    // Verifier depuis sessionStorage directement
    try {
        const userData = sessionStorage.getItem('gob-user');
        if (userData) {
            const user = JSON.parse(userData);
            if (user.role === 'admin' || user.username === 'admin') {
                return true;
            }
        }
    } catch (e) {
        // Ignore storage errors
    }
    
    return false;
}

/**
 * Filtrer les tabs selon les permissions
 */
function filterTabsByPermissions(tabs) {
    if (!Array.isArray(tabs)) return [];
    
    const isAdmin = isAdminUser();
    
    if (!userPermissions || isAdmin) {
        return tabs; // Tout autoriser pour admin
    }

    return tabs.filter(tab => {
        if (!tab || !tab.id) return false;
        
        // Toujours autoriser certains tabs de base
        if (tab.id === 'plus' || tab.id === 'theme-selector') {
            return true;
        }

        // Verifier la permission
        return hasPermission(tab.id);
    });
}

/**
 * Masquer les composants non autorises dans le DOM
 */
function hideUnauthorizedComponents() {
    if (!userPermissions || isAdminUser()) {
        return; // Pas de masquage pour admin
    }

    const componentIds = [
        'stocks-news', 'ask-emma', 'jlab', 'economic-calendar',
        'investing-calendar', 'yield-curve', 'markets-economy',
        'dans-watchlist', 'scrapping-sa', 'seeking-alpha',
        'email-briefings', 'admin-jslai', 'admin-jsla',
        'emma-sms', 'fastgraphs', 'news-banner', 'theme-selector'
    ];

    componentIds.forEach(componentId => {
        if (!hasPermission(componentId)) {
            const tabElements = document.querySelectorAll(
                '[data-tab="' + componentId + '"], [data-component="' + componentId + '"]'
            );
            tabElements.forEach(el => { el.style.display = 'none'; });

            const tabContent = document.getElementById('tab-' + componentId);
            if (tabContent) { tabContent.style.display = 'none'; }
        }
    });
}

/**
 * Initialiser le systeme de permissions
 */
async function initRolesPermissions() {
    try {
        await loadUserPermissions();
        hideUnauthorizedComponents();
        
        // Exposer les fonctions globalement
        window.hasPermission = hasPermission;
        window.userPermissions = userPermissions;
        window.userRole = userRole;
        window.__EMMA_PERMS__ = userPermissions;
        
        console.log('[Roles] Systeme de permissions initialise');
        console.log('[Roles] Role:', userRole);
        console.log('[Roles] Permissions:', Object.keys(userPermissions || {}));
    } catch (error) {
        console.error('[Roles] Init error:', error);
        // Fallback to admin
        userRole = 'admin';
        userPermissions = getDefaultPermissionsForRole('admin');
        window.userRole = userRole;
        window.userPermissions = userPermissions;
    }
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
    initRolesPermissions,
    isAdminUser,
    getDefaultPermissionsForRole
};
