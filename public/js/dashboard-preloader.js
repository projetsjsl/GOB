/**
 * Dashboard Preloader - Prechargement des donnees essentielles
 * S'execute sur la page de login pour accelerer le chargement du dashboard
 */

(function() {
    'use strict';

    if (window.__dashboardPreloaderInitialized) {
        return;
    }
    window.__dashboardPreloaderInitialized = true;

    const PRELOAD_STORAGE_KEY = 'gob-dashboard-preload';
    const PRELOAD_EXPIRY = 5 * 60 * 1000; // 5 minutes

    /**
     * Verifier si les donnees prechargees sont encore valides
     */
    function isPreloadValid() {
        try {
            const preloadData = sessionStorage.getItem(PRELOAD_STORAGE_KEY);
            if (!preloadData) return false;

            const data = JSON.parse(preloadData);
            const now = Date.now();
            
            // Verifier l'expiration
            if (data.timestamp && (now - data.timestamp) > PRELOAD_EXPIRY) {
                sessionStorage.removeItem(PRELOAD_STORAGE_KEY);
                return false;
            }

            return true;
        } catch (e) {
            console.warn('[Preloader] Erreur verification prechargement:', e);
            return false;
        }
    }

    /**
     * Sauvegarder les donnees prechargees
     */
    function savePreloadData(data) {
        try {
            const preloadData = {
                timestamp: Date.now(),
                data: data
            };
            sessionStorage.setItem(PRELOAD_STORAGE_KEY, JSON.stringify(preloadData));
            console.log('[Preloader]  Donnees prechargees sauvegardees');
        } catch (e) {
            console.warn('[Preloader]  Impossible de sauvegarder:', e);
        }
    }

    /**
     * Precharger les permissions utilisateur
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
            console.warn('[Preloader] Erreur prechargement permissions:', e);
        }
        return null;
    }

    /**
     * Precharger les donnees de l'API status
     */
    async function preloadApiStatus() {
        try {
            const response = await fetch('/api/status?test=true');
            if (response.ok) {
                const data = await response.json();
                return data;
            }
        } catch (e) {
            console.warn('[Preloader] Erreur prechargement API status:', e);
        }
        return null;
    }

    /**
     * Precharger les donnees de configuration des themes
     */
    async function preloadThemeConfig() {
        try {
            // Les themes sont deja dans theme-system.js, mais on peut precharger la config
            if (window.GOBThemes) {
                return {
                    currentTheme: window.GOBThemes.getCurrentTheme(),
                    themes: window.GOBThemes.allThemes || []
                };
            }
        } catch (e) {
            console.warn('[Preloader] Erreur prechargement themes:', e);
        }
        return null;
    }

    /**
     * Precharger les donnees GitHub (si disponibles)
     */
    async function preloadGitHubData() {
        try {
            // Precharger les tickers depuis GitHub si possible
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
     * Precharger les nouvelles Finviz (limitees)
     */
    async function preloadNews() {
        try {
            const response = await fetch('/api/finviz-news?limit=10');
            if (response.ok) {
                const data = await response.json();
                return data;
            }
        } catch (e) {
            console.warn('[Preloader] Erreur prechargement news:', e);
        }
        return null;
    }

    /**
     * Precharger les donnees de watchlist Supabase
     */
    async function preloadWatchlist() {
        try {
            const response = await fetch('/api/supabase-watchlist');
            if (response.ok) {
                const data = await response.json();
                return data;
            }
        } catch (e) {
            console.warn('[Preloader] Erreur prechargement watchlist:', e);
        }
        return null;
    }

    /**
     * Fonction principale de prechargement
     */
    async function preloadDashboardData(username) {
        console.log('[Preloader]  Demarrage du prechargement...');

        // Verifier si deja precharge et valide
        if (isPreloadValid()) {
            console.log('[Preloader]  Donnees deja prechargees et valides');
            return;
        }

        const startTime = Date.now();
        const preloadData = {};

        // Precharger en parallele toutes les donnees non-bloquantes
        const preloadPromises = [
            preloadApiStatus().then(data => { preloadData.apiStatus = data; }),
            preloadThemeConfig().then(data => { preloadData.themeConfig = data; }),
            preloadNews().then(data => { preloadData.news = data; }),
            preloadWatchlist().then(data => { preloadData.watchlist = data; }),
            preloadGitHubData().then(data => { preloadData.githubData = data; })
        ];

        // Precharger les permissions si username disponible
        if (username) {
            preloadPromises.push(
                preloadUserPermissions(username).then(data => {
                    preloadData.permissions = data;
                })
            );
        }

        // Attendre que toutes les promesses se resolvent
        await Promise.allSettled(preloadPromises);

        const duration = Date.now() - startTime;
        console.log(`[Preloader]  Prechargement termine en ${duration}ms`);

        // Sauvegarder les donnees
        savePreloadData(preloadData);

        // Afficher un indicateur visuel (optionnel)
        updatePreloadIndicator(true);
    }

    /**
     * Mettre a jour l'indicateur visuel de prechargement
     */
    function updatePreloadIndicator(completed) {
        try {
            const indicator = document.getElementById('preload-indicator');
            if (indicator) {
                if (completed) {
                    indicator.classList.add('completed');
                    indicator.textContent = ' Pret';
                } else {
                    indicator.classList.remove('completed');
                    indicator.textContent = ' Preparation...';
                }
            }
        } catch (e) {
            // Non bloquant
        }
    }

    /**
     * Recuperer les donnees prechargees
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
            console.warn('[Preloader] Erreur recuperation donnees:', e);
        }
        return null;
    }

    /**
     * Initialiser le prechargement
     */
    function initPreloader() {
        // Attendre que le DOM soit pret
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                startPreload();
            });
        } else {
            startPreload();
        }
    }

    /**
     * Demarrer le prechargement
     */
    function startPreload() {
        // Recuperer le username depuis le formulaire de login (si disponible)
        let username = null;
        try {
            const usernameInput = document.getElementById('username') || document.querySelector('input[name="username"]');
            if (usernameInput) {
                // Ecouter les changements pour precharger avec le bon username
                usernameInput.addEventListener('input', (e) => {
                    const value = e.target.value.trim().toLowerCase();
                    if (value && value.length >= 2) {
                        // Precharger avec le username saisi
                        preloadDashboardData(value);
                    }
                });

                // Precharger immediatement si username deja saisi
                if (usernameInput.value) {
                    username = usernameInput.value.trim().toLowerCase();
                }
            }
        } catch (e) {
            console.warn('[Preloader] Impossible de recuperer username:', e);
        }

        // Demarrer le prechargement (sans username d'abord, puis avec si disponible)
        preloadDashboardData(username);

        // Precharger aussi apres un delai pour recuperer le username si saisi
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

    console.log('[Preloader]  Systeme de prechargement initialise');
})();
