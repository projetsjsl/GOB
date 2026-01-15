/**
 * Tab Lazy Loader - Load tab components only when user navigates to them
 * 
 * Benefits:
 * 1. Faster initial page load (only load essential scripts)
 * 2. Reduced memory usage (unused tabs don't consume resources)
 * 3. Better user experience (no long wait at startup)
 */

(function() {
    'use strict';

    if (window.__tabLazyLoaderInitialized) {
        return;
    }
    window.__tabLazyLoaderInitialized = true;

    console.log(' Tab Lazy Loader: Initialisation...');

    // Track which tabs have been loaded
    const loadedTabs = new Set();
    const loadingTabs = new Set();
    const tabLoadPromises = {};

    // Map tab IDs to their script paths
    const TAB_SCRIPTS = {
        // Emma AI tabs
        'ask-emma': '/js/dashboard/components/tabs/AskEmmaTab.js',
        'emma-chat': '/js/dashboard/components/tabs/AskEmmaTab.js',
        'assistant-vocal': '/js/dashboard/components/tabs/VoiceAssistantTab.js',
        'emma-vocal': '/js/dashboard/components/tabs/VoiceAssistantTab.js',
        'terminal-emmaia': '/js/dashboard/components/tabs/TerminalEmmaIATab.js',
        'emma-terminal': '/js/dashboard/components/tabs/TerminalEmmaIATab.js',
        'emmaia': '/js/dashboard/components/tabs/EmmAIATab.js',
        'emma-live': '/js/dashboard/components/tabs/EmmAIATab.js',
        'finvox': '/js/dashboard/components/tabs/FinVoxTab.js',
        'emma-finvox': '/js/dashboard/components/tabs/FinVoxTab.js',
        'groupchat': '/js/dashboard/components/tabs/ChatGPTGroupTab.js',
        'emma-group': '/js/dashboard/components/tabs/ChatGPTGroupTab.js',
        
        // Markets tabs
        'markets-economy': '/js/dashboard/components/tabs/MarketsEconomyTab.js',
        'marches-global': '/js/dashboard/components/tabs/MarketsEconomyTab.js',
        'marches-flex': '/js/dashboard/components/tabs/MarketsEconomyTabRGL.js',
        'economic-calendar': '/js/dashboard/components/tabs/EconomicCalendarTab.js',
        'marches-calendar': '/js/dashboard/components/tabs/EconomicCalendarTab.js',
        'yield-curve': '/js/dashboard/components/tabs/YieldCurveTab.js',
        'marches-yield': '/js/dashboard/components/tabs/YieldCurveTab.js',
        'marches-nouvelles': '/js/dashboard/components/tabs/StocksNewsTab.js',
        'nouvelles': '/js/dashboard/components/tabs/StocksNewsTab.js',
        'nouvelles-main': null, // NouvellesTab est deja dans app-inline.js, pas besoin de charger
        
        // Titres tabs
        'stocks-news': '/js/dashboard/components/tabs/StocksNewsTab.js',
        'titres-stocks': '/js/dashboard/components/tabs/StocksNewsTab.js',  // Alias for titres-portfolio
        'titres-portfolio': '/js/dashboard/components/tabs/StocksNewsTab.js',
        'titres-watchlist': '/js/dashboard/components/tabs/StocksNewsTab.js',  // Uses StocksNewsTab with watchlist view
        'seeking-alpha': '/js/dashboard/components/tabs/SeekingAlphaTab.js',
        'titres-seeking': '/js/dashboard/components/tabs/SeekingAlphaTab.js',
        'dans-watchlist': '/js/dashboard/components/tabs/DansWatchlistTab.js',
        
        // JLab tabs
        'jlab': '/js/dashboard/components/tabs/JLabTab.js',
        'jlab-terminal': '/js/dashboard/components/tabs/JLabTab.js',
        'advanced-analysis': '/js/dashboard/components/tabs/AdvancedAnalysisTab.js',
        'jlab-advanced': '/js/dashboard/components/tabs/AdvancedAnalysisTab.js',
        'jlab-curvewatch': '/js/dashboard/components/tabs/CurveWatchTab.js',
        
        // Admin tabs
        'fastgraphs': '/js/dashboard/components/tabs/FastGraphsTab.js',
        'admin-fastgraphs': '/js/dashboard/components/tabs/FastGraphsTab.js',
        'email-briefings': '/js/dashboard/components/tabs/EmailBriefingsTab.js',
        'admin-briefings': '/js/dashboard/components/tabs/EmailBriefingsTab.js',
        'scrapping-sa': '/js/dashboard/components/tabs/ScrappingSATab.js',
        'admin-scraping': '/js/dashboard/components/tabs/ScrappingSATab.js',
        'plus': '/js/dashboard/components/tabs/PlusTab.js',
        'admin-settings': '/js/dashboard/components/tabs/PlusTab.js',
        'admin-jsla': '/js/dashboard/components/tabs/AdminJSLaiTab.js',
        
        // Test tabs (InvestingCalendarTab fusionne dans MarketsEconomyTab)
        'investing-calendar': '/js/dashboard/components/tabs/MarketsEconomyTab.js',
        'tests-calendar': '/js/dashboard/components/tabs/MarketsEconomyTab.js',
        'tests-roboweb': '/js/dashboard/components/tabs/GroupChatTab.js'
    };

    // Scripts that should be pre-loaded (essential for initial experience)
    const PRELOAD_TABS = ['markets-economy', 'marches-global', 'ask-emma', 'admin-scraping'];

    /**
     * Load a tab's script dynamically
     * @param {string} tabId - The tab identifier
     * @returns {Promise} - Resolves when script is loaded
     */
    function loadTabScript(tabId) {
        const scriptPath = TAB_SCRIPTS[tabId];
        
        // Si scriptPath est null, le composant est deja disponible (ex: dans app-inline.js)
        if (scriptPath === null) {
            console.log(`[LazyLoader] Tab ${tabId} already available (no script needed)`);
            return Promise.resolve();
        }
        
        if (!scriptPath) {
            console.log(`[LazyLoader] No script mapping for tab: ${tabId}`);
            return Promise.resolve();
        }

        // Already loaded
        if (loadedTabs.has(scriptPath)) {
            return Promise.resolve();
        }

        // Currently loading - return existing promise
        if (loadingTabs.has(scriptPath)) {
            return tabLoadPromises[scriptPath];
        }

        // Start loading
        loadingTabs.add(scriptPath);
        console.log(`[LazyLoader]  Loading tab script: ${scriptPath}`);

        const promise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'text/babel';
            script.src = scriptPath + '?lazy=' + Date.now();
            script.async = true;
            
            script.onload = () => {
                // Wait for Babel to transpile (increased delay for complex scripts)
                setTimeout(() => {
                    // Force Babel to process if needed
                    if (window.Babel && window.Babel.transformScriptTags) {
                        window.Babel.transformScriptTags();
                    }
                    loadedTabs.add(scriptPath);
                    loadingTabs.delete(scriptPath);
                    console.log(`[LazyLoader]  Loaded: ${scriptPath}`);
                    resolve();
                }, 500); // Increased from 100ms to 500ms for better Babel processing
            };
            
            script.onerror = (error) => {
                loadingTabs.delete(scriptPath);
                console.error(`[LazyLoader]  Failed to load: ${scriptPath}`, error);
                reject(error);
            };
            
            document.body.appendChild(script);
            
            // Babel processes text/babel scripts automatically on load
            // No need to call transformScriptTags() manually - it causes duplicate processing
        });

        tabLoadPromises[scriptPath] = promise;
        return promise;
    }

    /**
     * Check if a tab is loaded
     * @param {string} tabId - The tab identifier
     * @returns {boolean}
     */
    function isTabLoaded(tabId) {
        const scriptPath = TAB_SCRIPTS[tabId];
        return !scriptPath || loadedTabs.has(scriptPath);
    }

    /**
     * Preload a tab in the background (low priority)
     * @param {string} tabId - The tab identifier
     */
    function preloadTab(tabId) {
        if (isTabLoaded(tabId)) return;
        
        // Use requestIdleCallback for background loading
        const scheduleLoad = window.requestIdleCallback || ((cb) => setTimeout(cb, 1000));
        scheduleLoad(() => {
            loadTabScript(tabId).catch(() => {
                // Silently fail for preloads
            });
        }, { timeout: 5000 });
    }

    /**
     * Get loading status for UI
     * @param {string} tabId - The tab identifier
     * @returns {string} - 'loaded', 'loading', or 'pending'
     */
    function getTabStatus(tabId) {
        const scriptPath = TAB_SCRIPTS[tabId];
        if (!scriptPath) return 'loaded';
        if (loadedTabs.has(scriptPath)) return 'loaded';
        if (loadingTabs.has(scriptPath)) return 'loading';
        return 'pending';
    }

    // Expose API globally
    window.TabLazyLoader = {
        load: loadTabScript,
        isLoaded: isTabLoaded,
        preload: preloadTab,
        getStatus: getTabStatus,
        getLoadedTabs: () => [...loadedTabs],
        TAB_SCRIPTS: TAB_SCRIPTS
    };

    // Preload essential tabs after page is interactive
    window.addEventListener('load', () => {
        console.log('[LazyLoader]  Preloading essential tabs...');
        
        // Stagger preloads to avoid blocking
        PRELOAD_TABS.forEach((tabId, index) => {
            setTimeout(() => preloadTab(tabId), index * 500);
        });
    });

    console.log(' Tab Lazy Loader: Ready');
})();
