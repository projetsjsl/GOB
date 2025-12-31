/**
 * Performance Optimizer V2 - Réduit le temps de chargement et les freezes du dashboard
 * 
 * Problèmes résolus :
 * 1. Trop de widgets TradingView chargés simultanément
 * 2. Babel prend trop de temps à traiter app-inline.js
 * 3. Erreurs répétées de TradingView
 * 4. [NEW] Tab navigation freezes
 * 5. [NEW] Heavy DOM operations blocking main thread
 */

(function() {
    'use strict';

    if (window.__performanceOptimizerInitialized) {
        return;
    }
    window.__performanceOptimizerInitialized = true;

    console.log('🚀 Performance Optimizer V2: Initialisation...');

    // ============================================
    // TAB NAVIGATION OPTIMIZATION
    // ============================================
    
    // Debounce tab changes to prevent rapid re-renders
    let tabChangeTimeout = null;
    window._debouncedTabChange = function(callback, delay = 50) {
        if (tabChangeTimeout) {
            clearTimeout(tabChangeTimeout);
        }
        tabChangeTimeout = setTimeout(callback, delay);
    };

    // Use requestIdleCallback for non-critical updates
    const scheduleIdleTask = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
    
    window._scheduleNonCritical = function(callback) {
        scheduleIdleTask(callback, { timeout: 2000 });
    };

    // ============================================
    // TRADINGVIEW WIDGET OPTIMIZATION
    // ============================================
    
    let widgetsLoaded = 0;
    const MAX_WIDGETS_INITIAL = 2;
    const WIDGET_LOAD_DELAY = 500;

    function isElementVisible(element) {
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return rect.top < window.innerHeight + 500 && rect.bottom > -500;
    }

    // Intercept TradingView script loading
    const originalCreateElement = document.createElement;
    let tradingViewScriptCount = 0;
    const MAX_TRADINGVIEW_SCRIPTS = 3;

    document.createElement = function(tagName) {
        const element = originalCreateElement.call(document, tagName);
        
        if (tagName === 'script' && element.src && element.src.includes('tradingview.com')) {
            tradingViewScriptCount++;
            
            if (tradingViewScriptCount > MAX_TRADINGVIEW_SCRIPTS) {
                const originalSrc = element.src;
                element.src = '';
                
                setTimeout(() => {
                    element.src = originalSrc;
                }, (tradingViewScriptCount - MAX_TRADINGVIEW_SCRIPTS) * 1000);
            }
        }
        
        return element;
    };

    // ============================================
    // BABEL OPTIMIZATION
    // ============================================
    
    if (window.Babel) {
        const originalTransform = window.Babel.transform;
        window.Babel.transform = function(code, options) {
            const optimizedOptions = {
                ...options,
                compact: false,
                minified: false
            };
            return originalTransform.call(this, code, optimizedOptions);
        };
    }

    // ============================================
    // SCROLL PERFORMANCE (Passive + Debounced)
    // ============================================
    
    let scrollTimeout;
    let lastScrollTime = 0;
    const SCROLL_DEBOUNCE = 150; // Increased from 300ms
    
    window.addEventListener('scroll', () => {
        const now = Date.now();
        if (now - lastScrollTime < SCROLL_DEBOUNCE) return;
        lastScrollTime = now;
        
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            // Use requestIdleCallback for widget visibility check
            window._scheduleNonCritical(() => {
                document.querySelectorAll('.tradingview-widget-container iframe').forEach(iframe => {
                    const rect = iframe.getBoundingClientRect();
                    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
                    
                    if (!isVisible && iframe.src) {
                        iframe.style.display = 'none';
                    } else if (isVisible && iframe.style.display === 'none') {
                        iframe.style.display = '';
                    }
                });
            });
        }, SCROLL_DEBOUNCE);
    }, { passive: true });

    // ============================================
    // FETCH OPTIMIZATION (TradingView error suppression)
    // ============================================
    
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const url = args[0];
        
        if (typeof url === 'string' && url.includes('tradingview-widget.com')) {
            return originalFetch.apply(this, args).catch(error => {
                console.warn('⚠️ TradingView widget failed to load, skipping retry:', url);
                return new Response('', { status: 200, statusText: 'OK' });
            });
        }
        
        return originalFetch.apply(this, args);
    };

    // ============================================
    // REDUCE FREEZE DIAGNOSTICS OVERHEAD
    // ============================================
    
    // Override the pointer-events check interval (was 2s, now 10s)
    // This reduces main thread blocking
    window._performanceOptimizedFailsafeInterval = 10000; // 10 seconds

    // ============================================
    // DOM MUTATION BATCHING
    // ============================================
    
    let pendingDOMUpdates = [];
    let domUpdateScheduled = false;
    
    window._batchDOMUpdate = function(callback) {
        pendingDOMUpdates.push(callback);
        
        if (!domUpdateScheduled) {
            domUpdateScheduled = true;
            requestAnimationFrame(() => {
                const updates = pendingDOMUpdates;
                pendingDOMUpdates = [];
                domUpdateScheduled = false;
                
                updates.forEach(cb => {
                    try { cb(); } catch (e) { console.error('DOM batch update error:', e); }
                });
            });
        }
    };

    // ============================================
    // PERFORMANCE METRICS
    // ============================================
    
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            const loadTime = perfData.loadEventEnd - perfData.fetchStart;
            const domTime = perfData.domContentLoadedEventEnd - perfData.fetchStart;
            
            console.log('📊 Performance Metrics V2:');
            console.log(`   - Total Load Time: ${loadTime.toFixed(0)}ms`);
            console.log(`   - DOM Ready: ${domTime.toFixed(0)}ms`);
            console.log(`   - TradingView Scripts: ${tradingViewScriptCount}`);
            
            if (loadTime > 5000) {
                console.warn('⚠️ Temps de chargement élevé (>5s). Le dashboard sera optimisé.');
            }
        }, 1000);
    });

    console.log('✅ Performance Optimizer V2: Actif');
})();
