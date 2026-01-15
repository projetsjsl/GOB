/**
 * PERF #16 FIX: State Persistence pour eviter rechargement complet au changement d'onglet
 * 
 * Sauvegarde l'etat des onglets et des donnees pour eviter de tout recharger
 * lors du changement d'onglet.
 */

(function() {
    'use strict';

    if (window.__statePersistenceInitialized) {
        return;
    }
    window.__statePersistenceInitialized = true;

    const STORAGE_KEY = 'gob-dashboard-state';
    const STORAGE_VERSION = '1.0.0';
    const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB max

    /**
     * State Persistence Manager
     */
    class StatePersistenceManager {
        constructor() {
            this.stateCache = new Map();
            this.listeners = new Set();
        }

        /**
         * Sauvegarder l'etat d'un onglet
         */
        saveTabState(tabId, state) {
            try {
                // Limiter la taille des donnees sauvegardees
                const serialized = JSON.stringify(state);
                if (serialized.length > MAX_STORAGE_SIZE) {
                    console.warn(`[StatePersistence] Tab ${tabId} state too large, skipping save`);
                    return;
                }

                this.stateCache.set(tabId, {
                    state,
                    timestamp: Date.now(),
                    version: STORAGE_VERSION
                });

                // Sauvegarder dans localStorage (avec fallback)
                try {
                    const allStates = {};
                    this.stateCache.forEach((value, key) => {
                        allStates[key] = value;
                    });
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(allStates));
                } catch (e) {
                    // localStorage full ou non disponible
                    console.warn('[StatePersistence] localStorage full, using memory cache only');
                }

                // Notifier les listeners
                this.listeners.forEach(listener => {
                    try {
                        listener(tabId, state);
                    } catch (err) {
                        console.error('[StatePersistence] Listener error:', err);
                    }
                });
            } catch (error) {
                console.error(`[StatePersistence] Error saving state for ${tabId}:`, error);
            }
        }

        /**
         * Recuperer l'etat d'un onglet
         */
        getTabState(tabId) {
            // D'abord verifier le cache memoire
            if (this.stateCache.has(tabId)) {
                const cached = this.stateCache.get(tabId);
                // Verifier si le cache n'est pas trop vieux (1 heure max)
                const maxAge = 60 * 60 * 1000; // 1 heure
                if (Date.now() - cached.timestamp < maxAge) {
                    return cached.state;
                } else {
                    // Cache expire, le supprimer
                    this.stateCache.delete(tabId);
                }
            }

            // Essayer localStorage
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    const allStates = JSON.parse(saved);
                    if (allStates[tabId]) {
                        const cached = allStates[tabId];
                        // Verifier l'age
                        const maxAge = 60 * 60 * 1000; // 1 heure
                        if (Date.now() - cached.timestamp < maxAge) {
                            // Mettre en cache memoire
                            this.stateCache.set(tabId, cached);
                            return cached.state;
                        }
                    }
                }
            } catch (e) {
                console.warn('[StatePersistence] Error reading from localStorage:', e);
            }

            return null;
        }

        /**
         * Supprimer l'etat d'un onglet
         */
        clearTabState(tabId) {
            this.stateCache.delete(tabId);
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    const allStates = JSON.parse(saved);
                    delete allStates[tabId];
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(allStates));
                }
            } catch (e) {
                console.warn('[StatePersistence] Error clearing state:', e);
            }
        }

        /**
         * Nettoyer les etats expires
         */
        cleanup() {
            const maxAge = 60 * 60 * 1000; // 1 heure
            const now = Date.now();

            this.stateCache.forEach((value, key) => {
                if (now - value.timestamp > maxAge) {
                    this.stateCache.delete(key);
                }
            });

            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    const allStates = JSON.parse(saved);
                    let cleaned = false;
                    Object.keys(allStates).forEach(key => {
                        if (now - allStates[key].timestamp > maxAge) {
                            delete allStates[key];
                            cleaned = true;
                        }
                    });
                    if (cleaned) {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(allStates));
                    }
                }
            } catch (e) {
                console.warn('[StatePersistence] Error during cleanup:', e);
            }
        }

        /**
         * S'abonner aux changements d'etat
         */
        subscribe(listener) {
            this.listeners.add(listener);
            return () => {
                this.listeners.delete(listener);
            };
        }
    }

    // Instance globale
    const stateManager = new StatePersistenceManager();

    // Nettoyage periodique (toutes les 30 minutes)
    setInterval(() => {
        stateManager.cleanup();
    }, 30 * 60 * 1000);

    // Nettoyage initial
    stateManager.cleanup();

    // Exposer globalement
    window.StatePersistence = stateManager;

    // Helper functions pour faciliter l'utilisation
    window.saveTabState = (tabId, state) => {
        stateManager.saveTabState(tabId, state);
    };

    window.getTabState = (tabId) => {
        return stateManager.getTabState(tabId);
    };

    window.clearTabState = (tabId) => {
        stateManager.clearTabState(tabId);
    };

    console.log(' State Persistence Manager initialized');
})();
