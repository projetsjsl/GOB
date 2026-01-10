// Use LazyWidgetWrapper from window without redeclaring (avoid const conflict)
const LazyWrapper = window.LazyWidgetWrapper || (({ children }) => children);

const TradingViewTickerContent = React.memo(({
    isDarkMode,
    selectedIndices,
    setTickerExpandableUrl,
    setTickerExpandableTitle,
    setTickerExpandableOpen
}) => {
    const containerRef = React.useRef(null);
    
    // PERF #17 FIX: Mémoriser les symboles finaux pour éviter recalculs
    const finalSymbols = React.useMemo(() => {
        // Obtenir tous les indices disponibles
        const allIndices = window.getAllAvailableIndices ? window.getAllAvailableIndices() : {};
        const flatIndices = Object.values(allIndices).flat();
        
        // Filtrer les indices sélectionnés
        const symbolsToDisplay = flatIndices.filter(idx => 
            selectedIndices && selectedIndices.includes(idx.proName)
        );

        // Si aucun indice sélectionné, utiliser les indices par défaut
        return symbolsToDisplay.length > 0 
            ? symbolsToDisplay 
            : [
                { proName: 'FOREXCOM:SPXUSD', title: 'S&P 500' },
                { proName: 'FOREXCOM:NSXUSD', title: 'NASDAQ 100' },
                { proName: 'FOREXCOM:DJI', title: 'Dow Jones' },
                { proName: 'OANDA:XAUUSD', title: 'Gold' },
                { proName: 'BITSTAMP:BTCUSD', title: 'Bitcoin' }
            ];
    }, [selectedIndices]);

    React.useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Nettoyer le conteneur avant d'ajouter le nouveau script
        container.innerHTML = '';
        const widgetContainer = document.createElement('div');
        widgetContainer.className = 'tradingview-widget-container__widget';
        container.appendChild(widgetContainer);

        // Créer le script
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
        script.type = 'text/javascript';
        script.async = true;
        // BUG #4 FIX: Améliorer configuration pour E-Mini futures et autres symboles
        // PERF #17 FIX: Utiliser finalSymbols mémorisé
        script.textContent = JSON.stringify({
            symbols: finalSymbols,
            colorTheme: isDarkMode ? 'dark' : 'light',
            locale: 'fr',
            largeChartUrl: '',
            isTransparent: false,
            showSymbolLogo: true,
            displayMode: 'adaptive',
            // Options supplémentaires pour meilleur affichage des futures
            hideDateRanges: false,
            showVolume: false
        });

        // Ajouter le script à son conteneur
        container.appendChild(script);

        // Store cleanup references
        let checkForIframeInterval = null;
        let iframeTimeoutId = null;
        let messageHandler = null;
        let clickHandler = null;
        let overlay = null;

        // Intercepter les clics et navigations depuis le TickerBanner
        const setupTickerInterception = () => {
            // Attendre que l'iframe soit créé
            checkForIframeInterval = setInterval(() => {
                const iframe = container.querySelector('iframe');
                
                if (iframe) {
                    clearInterval(checkForIframeInterval);
                    checkForIframeInterval = null;
                    
                    // Intercepter les messages postMessage de TradingView
                    messageHandler = (event) => {
                        // TradingView peut envoyer des messages avec des URLs
                        if (event.data && typeof event.data === 'object') {
                            if (event.data.url || event.data.href || event.data.symbol) {
                                const url = event.data.url || event.data.href;
                                const symbol = event.data.symbol;
                                const title = event.data.title || symbol || 'TradingView';
                                
                                if (url) {
                                    setTickerExpandableUrl(url);
                                    setTickerExpandableTitle(title);
                                    setTickerExpandableOpen(true);
                                } else if (symbol) {
                                    // Construire l'URL TradingView pour le symbole
                                    const tradingViewUrl = `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}`;
                                    setTickerExpandableUrl(tradingViewUrl);
                                    setTickerExpandableTitle(symbol);
                                    setTickerExpandableOpen(true);
                                }
                            }
                        }
                    };
                    
                    window.addEventListener('message', messageHandler);
                    
                    // Intercepter les clics sur le conteneur du widget
                    clickHandler = (e) => {
                        // Vérifier si le clic est sur un élément cliquable du ticker
                        const clickableElement = e.target.closest('a, button, [role="button"], [onclick]');
                        
                        if (clickableElement || e.target.closest('.tradingview-widget-container__widget')) {
                            // Empêcher la navigation par défaut
                            e.preventDefault();
                            e.stopPropagation();
                            
                            // Essayer d'extraire l'URL ou le symbole
                            const href = clickableElement?.href || clickableElement?.getAttribute('href');
                            const symbol = clickableElement?.getAttribute('data-symbol') || 
                                         clickableElement?.textContent?.trim();
                            
                            if (href && href.includes('tradingview.com')) {
                                setTickerExpandableUrl(href);
                                setTickerExpandableTitle(symbol || 'TradingView Chart');
                                setTickerExpandableOpen(true);
                            } else if (symbol) {
                                const tradingViewUrl = `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}`;
                                setTickerExpandableUrl(tradingViewUrl);
                                setTickerExpandableTitle(symbol);
                                setTickerExpandableOpen(true);
                            } else {
                                // Utiliser l'URL de base de l'iframe comme fallback
                                setTickerExpandableUrl(iframe.src);
                                setTickerExpandableTitle('TradingView Chart');
                                setTickerExpandableOpen(true);
                            }
                        }
                    };
                    
                    // Ajouter un overlay transparent pour capturer les clics
                    overlay = document.createElement('div');
                    overlay.style.cssText = `
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        z-index: 1;
                        pointer-events: auto;
                        cursor: pointer;
                        background: transparent;
                    `;
                    overlay.addEventListener('click', clickHandler, true);
                    
                    // Positionner le conteneur en relative si nécessaire
                    if (getComputedStyle(widgetContainer).position === 'static') {
                        widgetContainer.style.position = 'relative';
                    }
                    
                    widgetContainer.appendChild(overlay);
                }
            }, 100);
            
            // Timeout de sécurité - clear interval after 10 seconds
            iframeTimeoutId = setTimeout(() => {
                if (checkForIframeInterval) {
                    clearInterval(checkForIframeInterval);
                    checkForIframeInterval = null;
                }
            }, 10000);
        };
        
        setupTickerInterception();

        // ✅ CRITICAL: Proper cleanup function
        return () => {
            if (checkForIframeInterval) {
                clearInterval(checkForIframeInterval);
            }
            if (iframeTimeoutId) {
                clearTimeout(iframeTimeoutId);
            }
            if (messageHandler) {
                window.removeEventListener('message', messageHandler);
            }
            if (overlay && clickHandler) {
                overlay.removeEventListener('click', clickHandler, true);
                overlay.remove();
            }
            // Clear container
            if (container) {
                container.innerHTML = '';
            }
        };

    }, [isDarkMode, finalSymbols, setTickerExpandableUrl, setTickerExpandableTitle, setTickerExpandableOpen]);

    return (
        <div className="tradingview-widget-container" ref={containerRef}>
            <div className="tradingview-widget-container__widget"></div>
        </div>
    );
}, (prevProps, nextProps) => {
    // PERF #17 FIX: Comparaison personnalisée pour éviter re-renders inutiles
    return (
        prevProps.isDarkMode === nextProps.isDarkMode &&
        JSON.stringify(prevProps.selectedIndices) === JSON.stringify(nextProps.selectedIndices) &&
        prevProps.setTickerExpandableUrl === nextProps.setTickerExpandableUrl &&
        prevProps.setTickerExpandableTitle === nextProps.setTickerExpandableTitle &&
        prevProps.setTickerExpandableOpen === nextProps.setTickerExpandableOpen
    );
});

const TradingViewTicker = React.memo((props) => {
    return (
        <LazyWrapper height="74px" placeholderTitle="Chargement Ticker...">
            <TradingViewTickerContent {...props} />
        </LazyWrapper>
    );
});

window.TradingViewTicker = TradingViewTicker;
