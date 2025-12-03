/**
 * Dashboard Preloader - Préchargement des données essentielles
 * S'exécute sur la page de login pour accélérer le chargement du dashboard
 */

(function() {
    'use strict';

    const PRELOAD_STORAGE_KEY = 'gob-dashboard-preload';
    const PRELOAD_EXPIRY = 5 * 60 * 1000; // 5 minutes

    /**
     * Vérifier si les données préchargées sont encore valides
     */
    function isPreloadValid() {
        try {
            const preloadData = sessionStorage.getItem(PRELOAD_STORAGE_KEY);
            if (!preloadData) return false;

            const data = JSON.parse(preloadData);
            const now = Date.now();
            
            // Vérifier l'expiration
            if (data.timestamp && (now - data.timestamp) > PRELOAD_EXPIRY) {
                sessionStorage.removeItem(PRELOAD_STORAGE_KEY);
                return false;
            }

            return true;
        } catch (e) {
            console.warn('[Preloader] Erreur vérification préchargement:', e);
            return false;
        }
    }

    /**
     * Sauvegarder les données préchargées
     */
    function savePreloadData(data) {
        try {
            const preloadData = {
                timestamp: Date.now(),
                data: data
            };
            sessionStorage.setItem(PRELOAD_STORAGE_KEY, JSON.stringify(preloadData));
            console.log('[Preloader] ✅ Données préchargées sauvegardées');
        } catch (e) {
            console.warn('[Preloader] ⚠️ Impossible de sauvegarder:', e);
        }
    }

    /**
     * Précharger les permissions utilisateur
     */
    async function preloadUserPermissions(username) {
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
                    return data.permissions;
                }
            }
        } catch (e) {
            console.warn('[Preloader] Erreur préchargement permissions:', e);
        }
        return null;
    }

    /**
     * Précharger les données de l'API status
     */
    async function preloadApiStatus() {
        try {
            const response = await fetch('/api/status?test=true');
            if (response.ok) {
                const data = await response.json();
                return data;
            }
        } catch (e) {
            console.warn('[Preloader] Erreur préchargement API status:', e);
        }
        return null;
    }

    /**
     * Précharger les données de configuration des thèmes
     */
    async function preloadThemeConfig() {
        try {
            // Les thèmes sont déjà dans theme-system.js, mais on peut précharger la config
            if (window.GOBThemes) {
                return {
                    currentTheme: window.GOBThemes.getCurrentTheme(),
                    themes: window.GOBThemes.allThemes || []
                };
            }
        } catch (e) {
            console.warn('[Preloader] Erreur préchargement thèmes:', e);
        }
        return null;
    }

    /**
     * Précharger les données GitHub (si disponibles)
     */
    async function preloadGitHubData() {
        try {
            // Précharger les tickers depuis GitHub si possible
            const response = await fetch('/api/github-tickers');
            if (response.ok) {
                const data = await response.json();
                return data;
            }
        } catch (e) {
            // Non bloquant
            console.log('[Preloader] GitHub data non disponible (non bloquant)');
        }
        return null;
    }

    /**
     * Précharger les nouvelles Finviz (limitées)
     */
    async function preloadNews() {
        try {
            const response = await fetch('/api/finviz-news?limit=10');
            if (response.ok) {
                const data = await response.json();
                return data;
            }
        } catch (e) {
            console.warn('[Preloader] Erreur préchargement news:', e);
        }
        return null;
    }

    /**
     * Précharger les données de watchlist Supabase
     */
    async function preloadWatchlist() {
        try {
            const response = await fetch('/api/supabase-watchlist');
            if (response.ok) {
                const data = await response.json();
                return data;
            }
        } catch (e) {
            console.warn('[Preloader] Erreur préchargement watchlist:', e);
        }
        return null;
    }

    /**
     * Fonction principale de préchargement
     */
    async function preloadDashboardData(username) {
        console.log('[Preloader] 🚀 Démarrage du préchargement...');

        // Vérifier si déjà préchargé et valide
        if (isPreloadValid()) {
            console.log('[Preloader] ✅ Données déjà préchargées et valides');
            return;
        }

        const startTime = Date.now();
        const preloadData = {};

        // Précharger en parallèle toutes les données non-bloquantes
        const preloadPromises = [
            preloadApiStatus().then(data => { preloadData.apiStatus = data; }),
            preloadThemeConfig().then(data => { preloadData.themeConfig = data; }),
            preloadNews().then(data => { preloadData.news = data; }),
            preloadWatchlist().then(data => { preloadData.watchlist = data; }),
            preloadGitHubData().then(data => { preloadData.githubData = data; })
        ];

        // Précharger les permissions si username disponible
        if (username) {
            preloadPromises.push(
                preloadUserPermissions(username).then(data => {
                    preloadData.permissions = data;
                })
            );
        }

        // Attendre que toutes les promesses se résolvent
        await Promise.allSettled(preloadPromises);

        const duration = Date.now() - startTime;
        console.log(`[Preloader] ✅ Préchargement terminé en ${duration}ms`);

        // Sauvegarder les données
        savePreloadData(preloadData);

        // Afficher un indicateur visuel (optionnel)
        updatePreloadIndicator(true);
    }

    /**
     * Mettre à jour l'indicateur visuel de préchargement
     */
    function updatePreloadIndicator(completed) {
        try {
            const indicator = document.getElementById('preload-indicator');
            if (indicator) {
                if (completed) {
                    indicator.classList.add('completed');
                    indicator.textContent = '✅ Prêt';
                } else {
                    indicator.classList.remove('completed');
                    indicator.textContent = '⏳ Préparation...';
                }
            }
        } catch (e) {
            // Non bloquant
        }
    }

    /**
     * Récupérer les données préchargées
     */
    function getPreloadData() {
        try {
            const preloadData = sessionStorage.getItem(PRELOAD_STORAGE_KEY);
            if (preloadData) {
                const data = JSON.parse(preloadData);
                if (isPreloadValid()) {
                    return data.data;
                }
            }
        } catch (e) {
            console.warn('[Preloader] Erreur récupération données:', e);
        }
        return null;
    }

    /**
     * Initialiser le préchargement
     */
    function initPreloader() {
        // Attendre que le DOM soit prêt
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                startPreload();
            });
        } else {
            startPreload();
        }
    }

    /**
     * Démarrer le préchargement
     */
    function startPreload() {
        // Récupérer le username depuis le formulaire de login (si disponible)
        let username = null;
        try {
            const usernameInput = document.getElementById('username') || document.querySelector('input[name="username"]');
            if (usernameInput) {
                // Écouter les changements pour précharger avec le bon username
                usernameInput.addEventListener('input', (e) => {
                    const value = e.target.value.trim().toLowerCase();
                    if (value && value.length >= 2) {
                        // Précharger avec le username saisi
                        preloadDashboardData(value);
                    }
                });

                // Précharger immédiatement si username déjà saisi
                if (usernameInput.value) {
                    username = usernameInput.value.trim().toLowerCase();
                }
            }
        } catch (e) {
            console.warn('[Preloader] Impossible de récupérer username:', e);
        }

        // Démarrer le préchargement (sans username d'abord, puis avec si disponible)
        preloadDashboardData(username);

        // Précharger aussi après un délai pour récupérer le username si saisi
        setTimeout(() => {
            try {
                const usernameInput = document.getElementById('username') || document.querySelector('input[name="username"]');
                if (usernameInput && usernameInput.value) {
                    const value = usernameInput.value.trim().toLowerCase();
                    if (value && value !== username) {
                        preloadDashboardData(value);
                    }
                }
            } catch (e) {
                // Non bloquant
            }
        }, 1000);
    }

    // Exposer les fonctions globalement
    window.DashboardPreloader = {
        preload: preloadDashboardData,
        getData: getPreloadData,
        isValid: isPreloadValid,
        init: initPreloader
    };

    // Initialiser automatiquement
    initPreloader();

    console.log('[Preloader] 📦 Système de préchargement initialisé');
})();

