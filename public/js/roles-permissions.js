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
        // 1. Check if auth-guard already set the role
        if (window.__EMMA_ROLE__) {
            userRole = window.__EMMA_ROLE__;
            userPermissions = getDefaultPermissionsForRole(userRole);
            console.log('[Roles] Using role from auth-guard:', userRole);
            return userPermissions;
        }
        
        // 2. Récupérer l'utilisateur depuis sessionStorage
        const userData = sessionStorage.getItem('gob-user');
        if (!userData) {
            console.warn('[Roles] Aucun utilisateur connecté');
            return null;
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

            const data = await response.json();

            if (data.success && data.permissions) {
                userPermissions = data.permissions.component_permissions || {};
                userRole = data.permissions.role_name;
                console.log('[Roles] Permissions loaded from API:', userPermissions);
                return userPermissions;
            }
        } catch (apiError) {
            console.warn('[Roles] API call failed, using defaults:', apiError);
        }
        
        // 4. Fallback to default permissions
        console.warn('[Roles] Using default permissions for', username);
        userPermissions = {};
        return userPermissions;
    } catch (error) {
        console.error('[Roles] Erreur chargement permissions:', error);
        userPermissions = {};
        return userPermissions;
    }
}

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
            'emmaiai': true
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
 * Vérifier si l'utilisateur est admin
 */
function isAdminUser() {
    // Vérifier depuis userRole
    if (userRole === 'admin') {
        return true;
    }
    
    // Vérifier depuis sessionStorage directement
    try {
        const userData = sessionStorage.getItem('gob-user');
        if (userData) {
            const user = JSON.parse(userData);
            if (user.role === 'admin' || user.username === 'admin') {
                return true;
            }
        }
    } catch (e) {
        console.warn('[Roles] Erreur vérification admin:', e);
    }
    
    return false;
}

/**
 * Filtrer les tabs selon les permissions
 */
function filterTabsByPermissions(tabs) {
    const isAdmin = isAdminUser();
    
    if (!userPermissions) {
        // Si pas de permissions chargées mais utilisateur admin, autoriser l'onglet admin
        if (isAdmin) {
            return tabs; // Tout autoriser pour admin si pas de permissions
        }
        return tabs; // Pas de filtrage si pas de permissions
    }

    return tabs.filter(tab => {
        // Toujours autoriser certains tabs de base
        if (tab.id === 'plus' || tab.id === 'theme-selector') {
            return true;
        }

        // Toujours autoriser l'onglet admin pour les utilisateurs admin
        if (tab.id === 'admin-jsla' && isAdmin) {
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

    const isAdmin = isAdminUser();

    // Liste des IDs de composants
    const componentIds = [
        'stocks-news',
        'ask-emma',
        'jlab',
        'economic-calendar',
        'investing-calendar',
        'yield-curve',
        'markets-economy',
        'dans-watchlist',
        'scrapping-sa',
        'seeking-alpha',
        'email-briefings',
        'admin-jslai',
        'admin-jsla', // ID alternatif
        'emma-sms',
        'fastgraphs',
        'news-banner',
        'theme-selector'
    ];

    componentIds.forEach(componentId => {
        // Ne pas masquer l'onglet admin pour les admins
        if ((componentId === 'admin-jslai' || componentId === 'admin-jsla') && isAdmin) {
            return;
        }

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
    initRolesPermissions,
    isAdminUser
};

