/**
 * Service centralisé pour gérer les préférences utilisateur dans Supabase
 * Remplace localStorage pour les données utilisateur authentifiées
 * 
 * Usage:
 *   const prefs = await loadUserPreferences('dashboard', userId);
 *   await saveUserPreferences('dashboard', userId, { layouts: {...} });
 */

// Applications supportées
export const USER_PREFERENCES_APPS = {
    DASHBOARD: 'dashboard',
    CURVEWATCH: 'curvewatch',
    THEME: 'theme',
    WATCHLIST: 'watchlist',
    EMMA: 'emma',
    FASTGRAPHS: 'fastgraphs',
    ECONOMIC_CALENDAR: 'economic_calendar'
};

/**
 * Obtient le client Supabase (côté client ou serveur)
 */
function getSupabaseClient() {
    // Côté client (window.supabase)
    if (typeof window !== 'undefined' && window.supabase) {
        return window.supabase;
    }
    
    // Côté serveur (API routes)
    if (typeof process !== 'undefined' && process.env) {
        const { createSupabaseClient } = require('./supabase-config.js');
        return createSupabaseClient(false); // Use anon key for RLS
    }
    
    return null;
}

/**
 * Obtient l'ID utilisateur actuel
 */
async function getCurrentUserId() {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return user?.id || null;
    } catch (e) {
        console.warn('Error getting current user:', e);
        return null;
    }
}

/**
 * Charge les préférences utilisateur depuis Supabase
 * @param {string} appName - Nom de l'application ('dashboard', 'curvewatch', etc.)
 * @param {string|null} userId - ID utilisateur (optionnel, sera détecté automatiquement)
 * @returns {Promise<object|null>} Préférences ou null si non trouvées
 */
export async function loadUserPreferences(appName, userId = null) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        console.warn('Supabase client not available');
        return null;
    }
    
    // Obtenir userId si non fourni
    if (!userId) {
        userId = await getCurrentUserId();
    }
    
    if (!userId) {
        console.warn('No user ID available for loading preferences');
        return null;
    }
    
    try {
        const { data, error } = await supabase
            .from('user_preferences')
            .select('preferences')
            .eq('user_id', userId)
            .eq('app_name', appName)
            .single();
        
        if (error) {
            // PGRST116 = not found (normal pour nouveau utilisateur)
            if (error.code !== 'PGRST116') {
                console.warn(`Failed to load preferences for ${appName}:`, error);
            }
            return null;
        }
        
        return data?.preferences || null;
    } catch (e) {
        console.warn(`Error loading preferences for ${appName}:`, e);
        return null;
    }
}

/**
 * Sauvegarde les préférences utilisateur dans Supabase
 * @param {string} appName - Nom de l'application
 * @param {object} preferences - Objet de préférences à sauvegarder
 * @param {string|null} userId - ID utilisateur (optionnel)
 * @returns {Promise<boolean>} true si succès
 */
export async function saveUserPreferences(appName, preferences, userId = null) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        console.warn('Supabase client not available');
        return false;
    }
    
    // Obtenir userId si non fourni
    if (!userId) {
        userId = await getCurrentUserId();
    }
    
    if (!userId) {
        console.warn('No user ID available for saving preferences');
        return false;
    }
    
    try {
        const { error } = await supabase
            .from('user_preferences')
            .upsert({
                user_id: userId,
                app_name: appName,
                preferences: preferences,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,app_name'
            });
        
        if (error) {
            console.warn(`Failed to save preferences for ${appName}:`, error);
            return false;
        }
        
        return true;
    } catch (e) {
        console.warn(`Error saving preferences for ${appName}:`, e);
        return false;
    }
}

/**
 * Charge depuis localStorage (fallback pour utilisateurs non authentifiés)
 * @param {string} storageKey - Clé localStorage
 * @returns {object|null} Données ou null
 */
export function loadFromLocalStorage(storageKey) {
    if (typeof window === 'undefined') return null;
    
    try {
        const saved = localStorage.getItem(storageKey);
        if (!saved) return null;
        return JSON.parse(saved);
    } catch (e) {
        console.warn(`Error loading from localStorage (${storageKey}):`, e);
        return null;
    }
}

/**
 * Sauvegarde dans localStorage (fallback pour utilisateurs non authentifiés)
 * @param {string} storageKey - Clé localStorage
 * @param {object} data - Données à sauvegarder
 * @returns {boolean} true si succès
 */
export function saveToLocalStorage(storageKey, data) {
    if (typeof window === 'undefined') return false;
    
    try {
        localStorage.setItem(storageKey, JSON.stringify(data));
        return true;
    } catch (e) {
        console.warn(`Error saving to localStorage (${storageKey}):`, e);
        return false;
    }
}

/**
 * Synchronise localStorage → Supabase (appelé au login)
 * @param {string} appName - Nom de l'application
 * @param {string} storageKey - Clé localStorage
 * @param {string|null} userId - ID utilisateur
 * @returns {Promise<boolean>} true si sync réussie
 */
export async function syncLocalStorageToSupabase(appName, storageKey, userId = null) {
    // Charger depuis localStorage
    const localData = loadFromLocalStorage(storageKey);
    if (!localData) return false;
    
    // Charger depuis Supabase
    const supabaseData = await loadUserPreferences(appName, userId);
    
    // Merger: Supabase a priorité, mais localStorage peut avoir des champs nouveaux
    const merged = supabaseData 
        ? { ...supabaseData, ...localData } // Supabase prioritaire, localStorage pour nouveaux champs
        : localData; // Si pas de Supabase, utiliser localStorage
    
    // Sauvegarder dans Supabase
    const saved = await saveUserPreferences(appName, merged, userId);
    
    if (saved) {
        console.log(`✅ Synced ${appName} preferences: localStorage → Supabase`);
        // Optionnel: vider localStorage après sync (ou garder comme cache)
        // localStorage.removeItem(storageKey);
    }
    
    return saved;
}

/**
 * Charge les préférences avec fallback automatique
 * Essaie Supabase d'abord, puis localStorage si non authentifié
 * @param {string} appName - Nom de l'application
 * @param {string} storageKey - Clé localStorage (fallback)
 * @param {object} defaultPreferences - Préférences par défaut
 * @param {string|null} userId - ID utilisateur (optionnel)
 * @returns {Promise<object>} Préférences (Supabase > localStorage > default)
 */
export async function loadPreferencesWithFallback(appName, storageKey, defaultPreferences = {}, userId = null) {
    // Essayer Supabase d'abord
    const supabaseData = await loadUserPreferences(appName, userId);
    if (supabaseData) {
        return { ...defaultPreferences, ...supabaseData };
    }
    
    // Fallback: localStorage
    const localData = loadFromLocalStorage(storageKey);
    if (localData) {
        return { ...defaultPreferences, ...localData };
    }
    
    // Fallback: defaults
    return defaultPreferences;
}

/**
 * Sauvegarde les préférences avec fallback automatique
 * Sauvegarde dans Supabase si authentifié, sinon localStorage
 * @param {string} appName - Nom de l'application
 * @param {string} storageKey - Clé localStorage (fallback)
 * @param {object} preferences - Préférences à sauvegarder
 * @param {string|null} userId - ID utilisateur (optionnel)
 * @returns {Promise<boolean>} true si sauvegardé (Supabase ou localStorage)
 */
export async function savePreferencesWithFallback(appName, storageKey, preferences, userId = null) {
    // Essayer Supabase d'abord
    const saved = await saveUserPreferences(appName, preferences, userId);
    if (saved) {
        return true;
    }
    
    // Fallback: localStorage
    return saveToLocalStorage(storageKey, preferences);
}

// Export pour utilisation dans le navigateur
if (typeof window !== 'undefined') {
    window.UserPreferencesService = {
        loadUserPreferences,
        saveUserPreferences,
        loadFromLocalStorage,
        saveToLocalStorage,
        syncLocalStorageToSupabase,
        loadPreferencesWithFallback,
        savePreferencesWithFallback,
        USER_PREFERENCES_APPS
    };
}
