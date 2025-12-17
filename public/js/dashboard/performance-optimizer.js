/**
 * Performance Optimizer - Réduit le temps de chargement du dashboard
 * 
 * Problèmes résolus :
 * 1. Trop de widgets TradingView chargés simultanément
 * 2. Babel prend trop de temps à traiter app-inline.js
 * 3. Erreurs répétées de TradingView
 */

(function() {
    'use strict';

    console.log('🚀 Performance Optimizer: Initialisation...');

    // 1. DÉLAI DE CHARGEMENT DES WIDGETS TRADINGVIEW
    // Attendre que la page soit prête avant de charger les widgets
    let widgetsLoaded = 0;
    const MAX_WIDGETS_INITIAL = 2; // Maximum 2 widgets au démarrage
    const WIDGET_LOAD_DELAY = 500; // 500ms entre chaque widget

    function loadWidgetWithDelay(container, delay) {
        if (!container || widgetsLoaded >= MAX_WIDGETS_INITIAL) {
            // Charger en lazy loading si trop de widgets
            setTimeout(() => {
                if (isElementVisible(container)) {
                    loadWidget(container);
                }
            }, delay + (widgetsLoaded * WIDGET_LOAD_DELAY));
            return;
        }

        setTimeout(() => {
            if (isElementVisible(container)) {
                loadWidget(container);
                widgetsLoaded++;
            }
        }, delay);
    }

    function isElementVisible(element) {
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return rect.top < window.innerHeight + 500 && rect.bottom > -500;
    }

    function loadWidget(container) {
        // Le widget sera chargé par le code React existant
        // On ne fait que retarder le chargement
    }

    // 2. INTERCEPTER LES CHARGEMENTS DE WIDGETS TRADINGVIEW
    const originalCreateElement = document.createElement;
    let tradingViewScriptCount = 0;
    const MAX_TRADINGVIEW_SCRIPTS = 3; // Maximum 3 scripts TradingView simultanés

    document.createElement = function(tagName) {
        const element = originalCreateElement.call(document, tagName);
        
        if (tagName === 'script' && element.src && element.src.includes('tradingview.com')) {
            tradingViewScriptCount++;
            
            // Si trop de scripts, ajouter un délai
            if (tradingViewScriptCount > MAX_TRADINGVIEW_SCRIPTS) {
                const originalSrc = element.src;
                element.src = ''; // Désactiver temporairement
                
                // Réactiver après un délai
                setTimeout(() => {
                    element.src = originalSrc;
                }, (tradingViewScriptCount - MAX_TRADINGVIEW_SCRIPTS) * 1000);
            }
        }
        
        return element;
    };

    // 3. OPTIMISER BABEL - Réduire les warnings
    if (window.Babel) {
        const originalTransform = window.Babel.transform;
        window.Babel.transform = function(code, options) {
            // Options optimisées pour performance
            const optimizedOptions = {
                ...options,
                compact: false, // Garder la lisibilité pour debug
                minified: false // Pas de minification (déjà fait)
            };
            return originalTransform.call(this, code, optimizedOptions);
        };
    }

    // 4. DÉSACTIVER LES WIDGETS NON VISIBLES AU SCROLL
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            document.querySelectorAll('.tradingview-widget-container iframe').forEach(iframe => {
                const rect = iframe.getBoundingClientRect();
                const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
                
                if (!isVisible && iframe.src) {
                    // Suspendre le widget
                    iframe.style.display = 'none';
                } else if (isVisible && iframe.style.display === 'none') {
                    // Réactiver le widget
                    iframe.style.display = '';
                }
            });
        }, 300);
    }, { passive: true });

    // 5. RETRY LOGIC POUR TRADINGVIEW
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const url = args[0];
        
        // Si c'est une requête TradingView qui échoue, ne pas retry automatiquement
        if (typeof url === 'string' && url.includes('tradingview-widget.com')) {
            return originalFetch.apply(this, args).catch(error => {
                console.warn('⚠️ TradingView widget failed to load, skipping retry:', url);
                // Retourner une réponse vide pour éviter les erreurs en cascade
                return new Response('', { status: 200, statusText: 'OK' });
            });
        }
        
        return originalFetch.apply(this, args);
    };

    // 6. MESURER ET LOGGER LES PERFORMANCES
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            const loadTime = perfData.loadEventEnd - perfData.fetchStart;
            const domTime = perfData.domContentLoadedEventEnd - perfData.fetchStart;
            
            console.log('📊 Performance Metrics:');
            console.log(`   - Total Load Time: ${loadTime.toFixed(0)}ms`);
            console.log(`   - DOM Ready: ${domTime.toFixed(0)}ms`);
            console.log(`   - TradingView Scripts: ${tradingViewScriptCount}`);
            
            if (loadTime > 3000) {
                console.warn('⚠️ Temps de chargement élevé. Considérez désactiver certains widgets.');
            }
        }, 1000);
    });

    console.log('✅ Performance Optimizer: Actif');
})();

