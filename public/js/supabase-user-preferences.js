/**
 * Service centralise pour gerer les preferences utilisateur dans Supabase
 * Version navigateur (compatible avec Babel/UMD)
 * 
 * Usage:
 *   const prefs = await UserPreferencesService.loadUserPreferences('dashboard', userId);
 *   await UserPreferencesService.saveUserPreferences('dashboard', userId, { layouts: {...} });
 */

(function() {
    'use strict';

    // Applications supportees
    const USER_PREFERENCES_APPS = {
        DASHBOARD: 'dashboard',
        CURVEWATCH: 'curvewatch',
        THEME: 'theme',
        WATCHLIST: 'watchlist',
        EMMA: 'emma',
        FASTGRAPHS: 'fastgraphs',
        ECONOMIC_CALENDAR: 'economic_calendar'
    };

    /**
     * Obtient le client Supabase (cote client)
     */
    function getSupabaseClient() {
        // Cote client (window.supabase)
        if (typeof window !== 'undefined' && window.supabase) {
            return window.supabase;
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
     * Charge les preferences utilisateur depuis Supabase
     */
    async function loadUserPreferences(appName, userId = null) {
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
     * Sauvegarde les preferences utilisateur dans Supabase
     */
    async function saveUserPreferences(appName, preferences, userId = null) {
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
     * Charge depuis localStorage (fallback pour utilisateurs non authentifies)
     */
    function loadFromLocalStorage(storageKey) {
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
     * Sauvegarde dans localStorage (fallback pour utilisateurs non authentifies)
     */
    function saveToLocalStorage(storageKey, data) {
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
     * Synchronise localStorage -> Supabase (appele au login)
     */
    async function syncLocalStorageToSupabase(appName, storageKey, userId = null) {
        // Charger depuis localStorage
        const localData = loadFromLocalStorage(storageKey);
        if (!localData) return false;
        
        // Charger depuis Supabase
        const supabaseData = await loadUserPreferences(appName, userId);
        
        // Merger: Supabase a priorite, mais localStorage peut avoir des champs nouveaux
        const merged = supabaseData 
            ? { ...supabaseData, ...localData } // Supabase prioritaire, localStorage pour nouveaux champs
            : localData; // Si pas de Supabase, utiliser localStorage
        
        // Sauvegarder dans Supabase
        const saved = await saveUserPreferences(appName, merged, userId);
        
        if (saved) {
            console.log(` Synced ${appName} preferences: localStorage -> Supabase`);
        }
        
        return saved;
    }

    /**
     * Charge les preferences avec fallback automatique
     */
    async function loadPreferencesWithFallback(appName, storageKey, defaultPreferences = {}, userId = null) {
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
     * Sauvegarde les preferences avec fallback automatique
     */
    async function savePreferencesWithFallback(appName, storageKey, preferences, userId = null) {
        // Essayer Supabase d'abord
        const saved = await saveUserPreferences(appName, preferences, userId);
        if (saved) {
            return true;
        }
        
        // Fallback: localStorage
        return saveToLocalStorage(storageKey, preferences);
    }

    // Export pour utilisation dans le navigateur
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

    console.log(' UserPreferencesService charge');
})();
