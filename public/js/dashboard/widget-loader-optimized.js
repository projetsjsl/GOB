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

    _ensureWidgetId(container, widgetType) {
        if (!container) {
            return `${widgetType}-${Math.random().toString(36).slice(2)}`;
        }
        if (!container.id) {
            container.id = `tv-${widgetType}-${Math.random().toString(36).slice(2, 8)}`;
        }
        const baseId = container.dataset?.widgetLoaderKey || container.id;
        if (container.dataset) {
            container.dataset.widgetLoaderKey = baseId;
            container.dataset.widgetLoaderId = `${widgetType}-${baseId}`;
        }
        return `${widgetType}-${baseId}`;
    }

    /**
     * Charge un widget TradingView de manière optimisée
     * @param {HTMLElement} container - Container où charger le widget
     * @param {string} widgetType - Type de widget (market-overview, screener, etc.)
     * @param {Object} config - Configuration du widget
     * @param {boolean} lazy - Si true, charge seulement quand visible
     */
    async loadWidget(container, widgetType, config, lazy = true) {
        if (!container) {
            console.warn(`⚠️ Container manquant pour widget ${widgetType}`);
            return;
        }

        // S'assurer que le container est dans le DOM
        if (!container.parentNode && container !== document.body) {
            console.warn(`⚠️ Container ${widgetType} pas dans le DOM, attente...`);
            await new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    if (container.parentNode || container === document.body) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
                setTimeout(() => {
                    clearInterval(checkInterval);
                    resolve();
                }, 5000);
            });
        }

        const widgetId = this._ensureWidgetId(container, widgetType);
        
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
            // Chargement immédiat mais avec délai pour stabilité
            await new Promise(resolve => setTimeout(resolve, 50));
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
            // S'assurer que le DOM est prêt
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    if (document.readyState === 'loading') {
                        document.addEventListener('DOMContentLoaded', resolve, { once: true });
                    } else {
                        resolve();
                    }
                });
            }

            // Attendre un peu pour que le container soit stable
            await new Promise(resolve => setTimeout(resolve, 100));

            // Nettoyer le container
            container.innerHTML = '';

            // Créer le div du widget avec attributs pour améliorer la compatibilité iframe
            const widgetDiv = document.createElement('div');
            widgetDiv.className = 'tradingview-widget-container__widget';
            widgetDiv.setAttribute('data-widget-type', widgetType);
            container.appendChild(widgetDiv);

            // Créer le script
            const script = document.createElement('script');
            script.src = `https://s3.tradingview.com/external-embedding/embed-widget-${widgetType}.js`;
            script.type = 'text/javascript';
            script.async = true;
            script.defer = true;
            
            // Ajouter la configuration avec gestion d'erreur
            try {
                script.innerHTML = JSON.stringify(config);
            } catch (e) {
                console.error(`❌ Erreur sérialisation config pour ${widgetType}:`, e);
                this._processQueue();
                return;
            }

            // Attendre que le script soit chargé
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    console.warn(`⚠️ Timeout chargement widget ${widgetType}`);
                    this._processQueue();
                    resolve(); // Resolve au lieu de reject pour ne pas bloquer
                }, 10000); // 10 secondes timeout

                script.onload = () => {
                    clearTimeout(timeout);
                    // Attendre un peu pour que l'iframe soit créée
                    setTimeout(() => {
                        this.loadedWidgets.add(widgetId);
                        this._processQueue();
                        resolve();
                    }, 200);
                };
                
                script.onerror = (error) => {
                    clearTimeout(timeout);
                    console.warn(`⚠️ Échec chargement widget ${widgetType}:`, error);
                    this._processQueue();
                    resolve(); // Resolve pour ne pas bloquer les autres widgets
                };
                
                widgetDiv.appendChild(script);
            });

            // Vérifier que l'iframe est créée et gérer les erreurs de communication
            setTimeout(() => {
                const iframe = container.querySelector('iframe');
                if (iframe) {
                    // Les erreurs "contentWindow not available" sont normales pour TradingView
                    // car ils utilisent des iframes avec sandbox restrictions
                    // On peut ignorer ces erreurs car les widgets fonctionnent quand même
                    iframe.setAttribute('loading', 'lazy');
                    iframe.setAttribute('title', `TradingView ${widgetType} widget`);
                }
            }, 500);

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

    releaseWidget(container) {
        if (!container || !container.dataset) return;
        const widgetId = container.dataset.widgetLoaderId;
        if (widgetId) {
            this.loadedWidgets.delete(widgetId);
        }
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

