const TradingViewTicker = React.memo(({
    isDarkMode,
    selectedIndices,
    setTickerExpandableUrl,
    setTickerExpandableTitle,
    setTickerExpandableOpen
}) => {
    const containerRef = React.useRef(null);

    React.useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Nettoyer le conteneur avant d'ajouter le nouveau script
        container.innerHTML = '';
        const widgetContainer = document.createElement('div');
        widgetContainer.className = 'tradingview-widget-container__widget';
        container.appendChild(widgetContainer);

        // Obtenir tous les indices disponibles
        // window.getAllAvailableIndices est défini dans app-inline.js
        const allIndices = window.getAllAvailableIndices ? window.getAllAvailableIndices() : {};
        const flatIndices = Object.values(allIndices).flat();
        
        // Filtrer les indices sélectionnés
        const symbolsToDisplay = flatIndices.filter(idx => 
            selectedIndices.includes(idx.proName)
        );

        // Si aucun indice sélectionné, utiliser les indices par défaut
        const finalSymbols = symbolsToDisplay.length > 0 
            ? symbolsToDisplay 
            : [
                { proName: 'FOREXCOM:SPXUSD', title: 'S&P 500' },
                { proName: 'FOREXCOM:NSXUSD', title: 'NASDAQ 100' },
                { proName: 'FOREXCOM:DJI', title: 'Dow Jones' },
                { proName: 'OANDA:XAUUSD', title: 'Gold' },
                { proName: 'BITSTAMP:BTCUSD', title: 'Bitcoin' }
            ];

        // Créer le script
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
        script.type = 'text/javascript';
        script.async = true;
        script.textContent = JSON.stringify({
            symbols: finalSymbols,
            colorTheme: isDarkMode ? 'dark' : 'light',
            locale: 'fr',
            largeChartUrl: '',
            isTransparent: false,
            showSymbolLogo: true,
            displayMode: 'adaptive'
        });

        // Ajouter le script à son conteneur
        container.appendChild(script);

        // Intercepter les clics et navigations depuis le TickerBanner
        const setupTickerInterception = () => {
            // Attendre que l'iframe soit créé
            const checkForIframe = setInterval(() => {
                const iframe = container.querySelector('iframe');
                
                if (iframe) {
                    clearInterval(checkForIframe);
                    
                    // Intercepter les messages postMessage de TradingView
                    const messageHandler = (event) => {
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
                    const clickHandler = (e) => {
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
                    const overlay = document.createElement('div');
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
                    
                    // Handler de nettoyage spécifique pour l'interval
                    return () => {
                        window.removeEventListener('message', messageHandler);
                        overlay.removeEventListener('click', clickHandler, true);
                        overlay.remove();
                    };
                }
            }, 100);
            
            // Timeout de sécurité
            setTimeout(() => clearInterval(checkForIframe), 10000);
        };
        
        setupTickerInterception();

    }, [isDarkMode, selectedIndices]); // Re-render only when theme or selection changes

    return (
        <div className="tradingview-widget-container" ref={containerRef}>
            <div className="tradingview-widget-container__widget"></div>
        </div>
    );
});

window.TradingViewTicker = TradingViewTicker;
