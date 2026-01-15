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
    
    // PERF #17 FIX: Memoriser les symboles finaux pour eviter recalculs
    const finalSymbols = React.useMemo(() => {
        // Obtenir tous les indices disponibles
        const allIndices = window.getAllAvailableIndices ? window.getAllAvailableIndices() : {};
        const flatIndices = Object.values(allIndices).flat();
        
        // Filtrer les indices selectionnes
        const symbolsToDisplay = flatIndices.filter(idx => 
            selectedIndices && selectedIndices.includes(idx.proName)
        );

        // Si aucun indice selectionne, utiliser les indices par defaut
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

        // Creer le script
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
        script.type = 'text/javascript';
        script.async = true;
        // BUG #4 FIX: Ameliorer configuration pour E-Mini futures et autres symboles
        // PERF #17 FIX: Utiliser finalSymbols memorise
        script.textContent = JSON.stringify({
            symbols: finalSymbols,
            colorTheme: isDarkMode ? 'dark' : 'light',
            locale: 'fr',
            largeChartUrl: '',
            isTransparent: false,
            showSymbolLogo: true,
            displayMode: 'adaptive',
            // Options supplementaires pour meilleur affichage des futures
            hideDateRanges: false,
            showVolume: false
        });

        // Ajouter le script a son conteneur
        container.appendChild(script);

        // Store cleanup references
        let checkForIframeInterval = null;
        let iframeTimeoutId = null;
        let messageHandler = null;
        let clickHandler = null;
        let overlay = null;

        // Intercepter les clics et navigations depuis le TickerBanner
        const setupTickerInterception = () => {
            // Attendre que l'iframe soit cree
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
                        // Verifier si le clic est sur un element cliquable du ticker
                        const clickableElement = e.target.closest('a, button, [role="button"], [onclick]');
                        
                        if (clickableElement || e.target.closest('.tradingview-widget-container__widget')) {
                            // Empecher la navigation par defaut
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
                    
                    // Positionner le conteneur en relative si necessaire
                    if (getComputedStyle(widgetContainer).position === 'static') {
                        widgetContainer.style.position = 'relative';
                    }
                    
                    widgetContainer.appendChild(overlay);
                }
            }, 100);
            
            // Timeout de securite - clear interval after 10 seconds
            iframeTimeoutId = setTimeout(() => {
                if (checkForIframeInterval) {
                    clearInterval(checkForIframeInterval);
                    checkForIframeInterval = null;
                }
            }, 10000);
        };
        
        setupTickerInterception();

        //  CRITICAL: Proper cleanup function
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

    // BUG #4 FIX: Detecter les erreurs dans le widget TradingView et afficher des tooltips
    React.useEffect(() => {
        if (!containerRef.current) return;

        const checkForErrors = () => {
            const iframe = containerRef.current?.querySelector('iframe');
            if (!iframe) return;

            // Ecouter les messages d'erreur de TradingView
            const messageHandler = (event) => {
                if (event.data && typeof event.data === 'object') {
                    // Detecter les erreurs de chargement de symboles
                    if (event.data.type === 'error' || event.data.error) {
                        console.warn('TradingView widget error detected:', event.data);
                        // Afficher un tooltip d'erreur si disponible
                        const errorSymbols = event.data.symbols || [];
                        errorSymbols.forEach(symbol => {
                            const element = containerRef.current?.querySelector(`[data-symbol="${symbol}"]`);
                            if (element) {
                                element.setAttribute('title', `Erreur de chargement pour ${symbol}. Donnees temporairement indisponibles.`);
                                element.style.opacity = '0.6';
                            }
                        });
                    }
                }
            };

            window.addEventListener('message', messageHandler);
            return () => window.removeEventListener('message', messageHandler);
        };

        // Verifier periodiquement pour les erreurs (TradingView peut mettre du temps a charger)
        const interval = setInterval(checkForErrors, 2000);
        const cleanup = checkForErrors();

        return () => {
            clearInterval(interval);
            if (cleanup) cleanup();
        };
    }, [finalSymbols]);

    return (
        <div className="tradingview-widget-container" ref={containerRef}>
            <div className="tradingview-widget-container__widget"></div>
            {/* BUG #4 FIX: Tooltip d'aide pour les symboles en erreur */}
            <div 
                className="absolute bottom-0 right-0 text-xs opacity-50 hover:opacity-100 transition-opacity"
                style={{ 
                    pointerEvents: 'none',
                    fontSize: '10px',
                    color: isDarkMode ? '#9ca3af' : '#6b7280'
                }}
                title="Les indicateurs avec  peuvent avoir des donnees temporairement indisponibles. Survolez pour plus d'infos."
            >
                i
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // PERF #17 FIX: Comparaison personnalisee pour eviter re-renders inutiles
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
