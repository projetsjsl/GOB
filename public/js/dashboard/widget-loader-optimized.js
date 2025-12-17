/**
 * Widget Loader Optimisé - Charge les widgets TradingView en lazy loading
 * Évite de charger tous les widgets en même temps au démarrage
 */

class OptimizedWidgetLoader {
    constructor() {
        this.loadedWidgets = new Set();
        this.loadingQueue = [];
        this.isLoading = false;
        this.maxConcurrentLoads = 2; // Maximum 2 widgets en parallèle
    }

    /**
     * Charge un widget TradingView de manière optimisée
     * @param {HTMLElement} container - Container où charger le widget
     * @param {string} widgetType - Type de widget (market-overview, screener, etc.)
     * @param {Object} config - Configuration du widget
     * @param {boolean} lazy - Si true, charge seulement quand visible
     */
    async loadWidget(container, widgetType, config, lazy = true) {
        if (!container) return;

        const widgetId = `${widgetType}-${container.id || Math.random().toString(36)}`;
        
        // Éviter les chargements en double
        if (this.loadedWidgets.has(widgetId)) {
            return;
        }

        // Si lazy loading, attendre que le container soit visible
        if (lazy) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        observer.disconnect();
                        this._loadWidgetNow(container, widgetType, config, widgetId);
                    }
                });
            }, {
                rootMargin: '50px' // Commencer à charger 50px avant d'être visible
            });
            
            observer.observe(container);
        } else {
            // Chargement immédiat
            await this._loadWidgetNow(container, widgetType, config, widgetId);
        }
    }

    /**
     * Charge effectivement le widget
     */
    async _loadWidgetNow(container, widgetType, config, widgetId) {
        // Ajouter à la queue si trop de chargements en cours
        if (this.loadingQueue.length >= this.maxConcurrentLoads) {
            return new Promise((resolve) => {
                this.loadingQueue.push(() => {
                    this._executeLoad(container, widgetType, config, widgetId).then(resolve);
                });
            });
        }

        return this._executeLoad(container, widgetType, config, widgetId);
    }

    /**
     * Exécute le chargement du widget
     */
    async _executeLoad(container, widgetType, config, widgetId) {
        try {
            // Nettoyer le container
            container.innerHTML = '';

            // Créer le div du widget
            const widgetDiv = document.createElement('div');
            widgetDiv.className = 'tradingview-widget-container__widget';
            container.appendChild(widgetDiv);

            // Créer le script
            const script = document.createElement('script');
            script.src = `https://s3.tradingview.com/external-embedding/embed-widget-${widgetType}.js`;
            script.type = 'text/javascript';
            script.async = true;
            script.defer = true;
            script.innerHTML = JSON.stringify(config);

            // Attendre que le script soit chargé
            await new Promise((resolve, reject) => {
                script.onload = () => {
                    this.loadedWidgets.add(widgetId);
                    this._processQueue();
                    resolve();
                };
                script.onerror = () => {
                    console.warn(`⚠️ Échec chargement widget ${widgetType}`);
                    this._processQueue();
                    reject(new Error(`Failed to load ${widgetType}`));
                };
                container.appendChild(script);
            });
        } catch (error) {
            console.error(`❌ Erreur chargement widget ${widgetType}:`, error);
            this._processQueue();
        }
    }

    /**
     * Traite la queue de chargement
     */
    _processQueue() {
        if (this.loadingQueue.length > 0 && this.loadedWidgets.size < this.maxConcurrentLoads) {
            const next = this.loadingQueue.shift();
            if (next) next();
        }
    }

    /**
     * Désactive tous les widgets non visibles
     */
    disableHiddenWidgets() {
        document.querySelectorAll('.tradingview-widget-container').forEach(container => {
            const rect = container.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
            
            if (!isVisible) {
                // Suspendre le widget
                const iframe = container.querySelector('iframe');
                if (iframe) {
                    iframe.style.display = 'none';
                }
            }
        });
    }
}

// Instance globale
window.optimizedWidgetLoader = new OptimizedWidgetLoader();

// Désactiver les widgets cachés au scroll
let scrollTimeout;
window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        window.optimizedWidgetLoader.disableHiddenWidgets();
    }, 500);
}, { passive: true });

