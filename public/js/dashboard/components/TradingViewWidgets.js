/**
 * TradingViewWidgets.js
 *
 * Centralized TradingView widget components for the GOB Dashboard.
 * Single source of truth for all 15 TradingView widgets used across the application.
 *
 * Usage: const { MarketOverviewWidget, HeatmapWidget } = window.TradingViewWidgets;
 *
 * NOTE: Components use theme system (GOBThemes) - no isDarkMode prop needed.
 * TradingView colorTheme is derived from current theme automatically.
 */

(function() {
    'use strict';

    const { useEffect, useRef, useState } = React;

    // =====================================================
    // THEME HELPER
    // =====================================================
    // Get TradingView colorTheme from GOBThemes (returns 'dark' or 'light')
    const getTVColorTheme = () => {
        if (window.GOBThemes && typeof window.GOBThemes.getTradingViewTheme === 'function') {
            return window.GOBThemes.getTradingViewTheme();
        }
        return 'dark'; // Default fallback
    };

    // Check if theme is light (for conditional styling)
    const isLightTheme = () => {
        if (window.GOBThemes && typeof window.GOBThemes.isLightTheme === 'function') {
            return window.GOBThemes.isLightTheme();
        }
        return false; // Default to dark
    };

    // =====================================================
    // LAZY LOADING QUEUE SYSTEM
    // =====================================================
    // Prevents Chrome crash by loading widgets one at a time
    let _tvWidgetQueue = [];
    let _tvWidgetLoading = false;
    let _tvLoadedCount = 0;
    const MAX_AUTO_LOAD_WIDGETS = 2; // Only auto-load first 2 widgets, rest require click

    const processWidgetQueue = () => {
        if (_tvWidgetLoading || _tvWidgetQueue.length === 0) return;
        const next = _tvWidgetQueue.shift();
        if (next) {
            _tvWidgetLoading = true;
            _tvLoadedCount++;
            console.log(` Loading TradingView widget #${_tvLoadedCount}: ${next.name}`);
            next.callback();
            setTimeout(() => {
                _tvWidgetLoading = false;
                processWidgetQueue();
            }, 3000); // 3 second delay between widgets to prevent Chrome freeze
        }
    };

    const queueWidgetLoad = (name, callback) => {
        _tvWidgetQueue.push({ name, callback });
        processWidgetQueue();
    };

    const resetWidgetQueue = () => {
        _tvWidgetQueue = [];
        _tvWidgetLoading = false;
        _tvLoadedCount = 0;
    };

    // =====================================================
    // LAZY WIDGET WRAPPER
    // =====================================================
    // NOTE: No longer accepts isDarkMode prop - uses theme system
    // TECH #1 FIX: Wrapper avec ErrorBoundary pour proteger contre les erreurs
    // Get ErrorBoundary from window (loaded from ErrorBoundary.js) - declare une seule fois
    const WidgetErrorBoundary = window.WidgetErrorBoundary || (({ children }) => children);
    
    const LazyTVWidget = ({ children, name, height = 400 }) => {
        const [shouldLoad, setShouldLoad] = useState(false);
        const [isVisible, setIsVisible] = useState(false);
        const [isQueued, setIsQueued] = useState(false);
        const [requiresClick, setRequiresClick] = useState(false);
        const containerRef = useRef(null);
        const light = isLightTheme();

        useEffect(() => {
            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting && !isVisible) {
                        setIsVisible(true);
                    }
                },
                { rootMargin: '200px', threshold: 0.1 }
            );

            if (containerRef.current) {
                observer.observe(containerRef.current);
            }

            return () => observer.disconnect();
        }, [isVisible]);

        useEffect(() => {
            if (isVisible && !isQueued && !shouldLoad && !requiresClick) {
                // Check if we've exceeded max auto-load limit
                if (_tvLoadedCount >= MAX_AUTO_LOAD_WIDGETS) {
                    setRequiresClick(true);
                    console.log(` Widget "${name}" requires click to load (limit reached)`);
                } else {
                    setIsQueued(true);
                    queueWidgetLoad(name, () => {
                        setShouldLoad(true);
                    });
                }
            }
        }, [isVisible, isQueued, shouldLoad, name, requiresClick]);

        const handleManualLoad = () => {
            setRequiresClick(false);
            setIsQueued(true);
            queueWidgetLoad(name, () => {
                setShouldLoad(true);
            });
        };

        // TECH #1 FIX: Wrapper avec ErrorBoundary (WidgetErrorBoundary deja declare en haut du composant)
        return (
            <WidgetErrorBoundary widgetName={name} isDarkMode={!light}>
                <div ref={containerRef} style={{ height: height, width: '100%' }}>
                    {shouldLoad ? children : (
                        <div className={`h-full w-full flex items-center justify-center rounded-lg ${light ? 'bg-gray-100' : 'bg-neutral-800'}`}>
                            <div className="text-center p-4">
                                <div className="animate-pulse mb-2">
                                    <div className={`w-12 h-12 mx-auto rounded-lg ${light ? 'bg-gray-200' : 'bg-neutral-700'}`}></div>
                                </div>
                                <p className={`text-sm ${light ? 'text-gray-600' : 'text-gray-400'}`}>
                                    {isQueued ? ' Chargement...' : requiresClick ? ' Widget disponible' : ' Widget TradingView'}
                                </p>
                                <p className={`text-xs mt-1 ${light ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {name}
                                </p>
                                {requiresClick && (
                                    <button
                                        onClick={handleManualLoad}
                                        className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors"
                                    >
                                        Charger le widget
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </WidgetErrorBoundary>
        );
    };

    // =====================================================
    // 1. MARKET OVERVIEW WIDGET
    // =====================================================
    // TECH #1 FIX: Wrapper avec ErrorBoundary (WidgetErrorBoundary deja declare plus haut)
    const MarketOverviewWidget = ({ height = 450 }) => {
        const containerRef = useRef(null);

        useEffect(() => {
            const container = containerRef.current;
            if (!container) return;

            container.innerHTML = '';
            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js';
            script.async = true;
            script.innerHTML = JSON.stringify({
                colorTheme: getTVColorTheme(),
                dateRange: '1D',
                showChart: true,
                locale: 'fr',
                width: '100%',
                height: '100%',
                largeChartUrl: '',
                isTransparent: false,
                showSymbolLogo: true,
                showFloatingTooltip: true,
                tabs: [
                    {
                        title: 'Indices',
                        symbols: [
                            { s: 'FOREXCOM:SPXUSD', d: 'S&P 500' },
                            { s: 'FOREXCOM:NSXUSD', d: 'US 100' },
                            { s: 'FOREXCOM:DJI', d: 'Dow 30' },
                            { s: 'INDEX:NKY', d: 'Nikkei 225' },
                            { s: 'INDEX:DEU40', d: 'DAX Index' },
                            { s: 'FOREXCOM:UKXGBP', d: 'UK 100' }
                        ]
                    },
                    {
                        title: 'Forex',
                        symbols: [
                            { s: 'FX:EURUSD', d: 'EUR/USD' },
                            { s: 'FX:GBPUSD', d: 'GBP/USD' },
                            { s: 'FX:USDJPY', d: 'USD/JPY' },
                            { s: 'FX:USDCAD', d: 'USD/CAD' }
                        ]
                    },
                    {
                        title: 'Crypto',
                        symbols: [
                            { s: 'BINANCE:BTCUSDT', d: 'Bitcoin' },
                            { s: 'BINANCE:ETHUSDT', d: 'Ethereum' },
                            { s: 'BINANCE:BNBUSDT', d: 'BNB' },
                            { s: 'BINANCE:SOLUSDT', d: 'Solana' }
                        ]
                    }
                ]
            });
            container.appendChild(script);

            return () => { container.innerHTML = ''; };
        }, []);

        // TECH #1 FIX: Wrapper avec ErrorBoundary
        return (
            <WidgetErrorBoundary widgetName="Market Overview" isDarkMode={!isLightTheme()}>
                <div ref={containerRef} style={{ height: height, width: '100%' }} />
            </WidgetErrorBoundary>
        );
    };

    // =====================================================
    // 2. STOCK HEATMAP WIDGET
    // =====================================================
    const HeatmapWidget = ({ dataSource = 'SPX500', height = 500 }) => {
        const containerRef = useRef(null);

        useEffect(() => {
            const container = containerRef.current;
            if (!container) return;

            container.innerHTML = '';
            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
            script.async = true;
            script.innerHTML = JSON.stringify({
                exchanges: [],
                dataSource: dataSource,
                grouping: 'sector',
                blockSize: 'market_cap_basic',
                blockColor: 'change',
                locale: 'fr',
                symbolUrl: '',
                colorTheme: getTVColorTheme(),
                hasTopBar: true,
                isDataSetEnabled: true,
                isZoomEnabled: true,
                hasSymbolTooltip: true,
                width: '100%',
                height: '100%'
            });
            container.appendChild(script);

            return () => { container.innerHTML = ''; };
        }, [dataSource]);

        return <div ref={containerRef} style={{ height: height, width: '100%' }} />;
    };

    // =====================================================
    // 3. SCREENER WIDGET
    // =====================================================
    const ScreenerWidget = ({ market = 'america', height = 500 }) => {
        const containerRef = useRef(null);

        useEffect(() => {
            const container = containerRef.current;
            if (!container) return;

            container.innerHTML = '';
            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-screener.js';
            script.async = true;
            script.innerHTML = JSON.stringify({
                width: '100%',
                height: '100%',
                defaultColumn: 'overview',
                defaultScreen: 'most_capitalized',
                market: market,
                showToolbar: true,
                colorTheme: getTVColorTheme(),
                locale: 'fr'
            });
            container.appendChild(script);

            return () => { container.innerHTML = ''; };
        }, [market]);

        return <div ref={containerRef} style={{ height: height, width: '100%' }} />;
    };

    // =====================================================
    // 4. FOREX HEAT MAP WIDGET
    // =====================================================
    const ForexHeatMapWidget = ({ height = 400 }) => {
        const containerRef = useRef(null);

        useEffect(() => {
            const container = containerRef.current;
            if (!container) return;

            container.innerHTML = '';
            const widgetDiv = document.createElement('div');
            widgetDiv.className = 'tradingview-widget-container__widget';
            container.appendChild(widgetDiv);

            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-forex-heat-map.js';
            script.async = true;
            script.innerHTML = JSON.stringify({
                colorTheme: getTVColorTheme(),
                isTransparent: true,
                locale: 'fr',
                currencies: ['EUR', 'USD', 'JPY', 'GBP', 'CHF', 'AUD', 'CAD', 'CNY'],
                width: '100%',
                height: height
            });
            container.appendChild(script);

            return () => { container.innerHTML = ''; };
        }, [height]);

        return <div ref={containerRef} style={{ height: height, width: '100%' }} />;
    };

    // =====================================================
    // 5. ECONOMIC EVENTS WIDGET
    // =====================================================
    const EconomicEventsWidget = ({ height = 550 }) => {
        const containerRef = useRef(null);

        useEffect(() => {
            const container = containerRef.current;
            if (!container) return;

            container.innerHTML = '';
            const widgetDiv = document.createElement('div');
            widgetDiv.className = 'tradingview-widget-container__widget';
            container.appendChild(widgetDiv);

            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
            script.async = true;
            script.innerHTML = JSON.stringify({
                colorTheme: getTVColorTheme(),
                isTransparent: false,
                locale: 'en',
                countryFilter: 'ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,tr,gb,us,eu',
                importanceFilter: '-1,0,1',
                width: '100%',
                height: height
            });
            container.appendChild(script);

            return () => { container.innerHTML = ''; };
        }, [height]);

        return <div ref={containerRef} style={{ height: height, width: '100%' }} />;
    };

    // =====================================================
    // 6. TICKER TAPE WIDGET
    // =====================================================
    const TickerTapeWidget = ({ symbols = null, height = 46 }) => {
        const containerRef = useRef(null);

        useEffect(() => {
            const container = containerRef.current;
            if (!container) return;

            container.innerHTML = '';
            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
            script.async = true;

            const defaultSymbols = [
                { proName: 'FOREXCOM:SPXUSD', title: 'S&P 500' },
                { proName: 'FOREXCOM:NSXUSD', title: 'US 100' },
                { proName: 'FX_IDC:EURUSD', title: 'EUR/USD' },
                { proName: 'BITSTAMP:BTCUSD', title: 'Bitcoin' },
                { proName: 'BITSTAMP:ETHUSD', title: 'Ethereum' }
            ];

            script.innerHTML = JSON.stringify({
                symbols: symbols || defaultSymbols,
                showSymbolLogo: true,
                colorTheme: getTVColorTheme(),
                isTransparent: false,
                displayMode: 'adaptive',
                locale: 'fr'
            });
            container.appendChild(script);

            return () => { container.innerHTML = ''; };
        }, [symbols]);

        return <div ref={containerRef} style={{ height: height, width: '100%' }} />;
    };

    // =====================================================
    // 7. MINI SYMBOL OVERVIEW WIDGET
    // =====================================================
    const MiniSymbolOverviewWidget = ({ symbol = 'NASDAQ:AAPL', height = 350 }) => {
        const containerRef = useRef(null);

        useEffect(() => {
            const container = containerRef.current;
            if (!container) return;

            container.innerHTML = '';
            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
            script.async = true;
            script.innerHTML = JSON.stringify({
                symbol: symbol,
                width: '100%',
                height: height,
                locale: 'fr',
                dateRange: '12M',
                colorTheme: getTVColorTheme(),
                isTransparent: false,
                autosize: true,
                largeChartUrl: ''
            });
            container.appendChild(script);

            return () => { container.innerHTML = ''; };
        }, [symbol, height]);

        return <div ref={containerRef} style={{ height: height, width: '100%' }} />;
    };

    // =====================================================
    // 8. FOREX CROSS RATES WIDGET
    // =====================================================
    const ForexCrossRatesWidget = ({ height = 400 }) => {
        const containerRef = useRef(null);

        useEffect(() => {
            const container = containerRef.current;
            if (!container) return;

            container.innerHTML = '';
            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-forex-cross-rates.js';
            script.async = true;
            script.innerHTML = JSON.stringify({
                colorTheme: getTVColorTheme(),
                isTransparent: false,
                locale: 'fr',
                currencies: ['EUR', 'USD', 'JPY', 'GBP', 'CHF', 'AUD', 'CAD', 'NZD', 'CNY'],
                backgroundColor: isLightTheme() ? '#ffffff' : '#1f2937',
                width: '100%',
                height: height
            });
            container.appendChild(script);

            return () => { container.innerHTML = ''; };
        }, [height]);

        return <div ref={containerRef} style={{ height: height, width: '100%' }} />;
    };

    // =====================================================
    // 9. ADVANCED CHART WIDGET
    // =====================================================
    const AdvancedChartWidget = ({ symbol = 'AMEX:SPY', height = 500 }) => {
        const containerRef = useRef(null);

        useEffect(() => {
            const container = containerRef.current;
            if (!container) return;

            container.innerHTML = '';
            container.classList.add('tradingview-widget-container');
            const widgetDiv = document.createElement('div');
            widgetDiv.className = 'tradingview-widget-container__widget';
            widgetDiv.style.width = '100%';
            widgetDiv.style.height = '100%';
            container.appendChild(widgetDiv);
            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
            script.async = true;
            script.innerHTML = JSON.stringify({
                autosize: true,
                symbol: symbol,
                interval: 'D',
                timezone: 'America/New_York',
                theme: getTVColorTheme(),
                style: '1',
                locale: 'fr',
                allow_symbol_change: true,
                calendar: false,
                support_host: 'https://www.tradingview.com'
            });
            container.appendChild(script);

            return () => { container.innerHTML = ''; };
        }, [symbol, height]);

        return <div ref={containerRef} style={{ height: height, width: '100%' }} />;
    };

    // =====================================================
    // 10. MARKET QUOTES WIDGET
    // =====================================================
    const MarketQuotesWidget = ({ height = 700 }) => {
        const containerRef = useRef(null);

        useEffect(() => {
            const container = containerRef.current;
            if (!container) return;

            container.innerHTML = '';
            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js';
            script.async = true;
            script.innerHTML = JSON.stringify({
                colorTheme: getTVColorTheme(),
                locale: 'fr',
                largeChartUrl: '',
                isTransparent: false,
                showSymbolLogo: true,
                backgroundColor: isLightTheme() ? '#ffffff' : '#0F0F0F',
                width: '100%',
                height: height,
                symbolsGroups: [
                    {
                        name: 'Indices',
                        symbols: [
                            { name: 'FOREXCOM:SPXUSD', displayName: 'S&P 500 Index' },
                            { name: 'FOREXCOM:NSXUSD', displayName: 'US 100 Cash CFD' },
                            { name: 'FOREXCOM:DJI', displayName: 'Dow Jones' },
                            { name: 'TSX:TSX', displayName: 'TSX' },
                            { name: 'XETR:DAX', displayName: 'DAX' },
                            { name: 'INDEX:NKY', displayName: 'Nikkei 225' }
                        ]
                    },
                    {
                        name: 'Futures',
                        symbols: [
                            { name: 'CMCMARKETS:GOLD', displayName: 'Gold' }
                        ]
                    },
                    {
                        name: 'Forex CAD',
                        symbols: [
                            { name: 'FX:USDCAD', displayName: 'USD/CAD' },
                            { name: 'FX:EURCAD', displayName: 'EUR/CAD' }
                        ]
                    }
                ]
            });
            container.appendChild(script);

            return () => { container.innerHTML = ''; };
        }, [height]);

        return <div ref={containerRef} style={{ height: height, width: '100%' }} />;
    };

    // =====================================================
    // 11. SYMBOL INFO WIDGET
    // =====================================================
    const SymbolInfoWidget = ({ symbol = 'NASDAQ:AAPL', height = 200 }) => {
        const containerRef = useRef(null);

        useEffect(() => {
            const container = containerRef.current;
            if (!container) return;

            container.innerHTML = '';
            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js';
            script.async = true;
            script.innerHTML = JSON.stringify({
                symbol: symbol,
                width: '100%',
                locale: 'fr',
                colorTheme: getTVColorTheme(),
                isTransparent: false
            });
            container.appendChild(script);

            return () => { container.innerHTML = ''; };
        }, [symbol]);

        return <div ref={containerRef} style={{ height: height, width: '100%' }} />;
    };

    // =====================================================
    // 12. TIMELINE WIDGET
    // =====================================================
    const TimelineWidget = ({ symbol = 'BITSTAMP:BTCUSD', height = 400 }) => {
        const containerRef = useRef(null);

        useEffect(() => {
            const container = containerRef.current;
            if (!container) return;

            container.innerHTML = '';
            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-timeline.js';
            script.async = true;
            script.innerHTML = JSON.stringify({
                feedMode: 'symbol',
                symbol: symbol,
                colorTheme: getTVColorTheme(),
                isTransparent: false,
                displayMode: 'regular',
                width: '100%',
                height: height,
                locale: 'fr'
            });
            container.appendChild(script);

            return () => { container.innerHTML = ''; };
        }, [symbol, height]);

        return <div ref={containerRef} style={{ height: height, width: '100%' }} />;
    };

    // =====================================================
    // 13. SYMBOL PROFILE WIDGET
    // =====================================================
    const SymbolProfileWidget = ({ symbol = 'NASDAQ:AAPL', height = 400 }) => {
        const containerRef = useRef(null);

        useEffect(() => {
            const container = containerRef.current;
            if (!container) return;

            container.innerHTML = '';
            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js';
            script.async = true;
            script.innerHTML = JSON.stringify({
                symbol: symbol,
                width: '100%',
                height: height,
                colorTheme: getTVColorTheme(),
                isTransparent: false,
                locale: 'fr'
            });
            container.appendChild(script);

            return () => { container.innerHTML = ''; };
        }, [symbol, height]);

        return <div ref={containerRef} style={{ height: height, width: '100%' }} />;
    };

    // =====================================================
    // 14. FINANCIALS WIDGET
    // =====================================================
    const FinancialsWidget = ({ symbol = 'NASDAQ:AAPL', height = 400 }) => {
        const containerRef = useRef(null);

        useEffect(() => {
            const container = containerRef.current;
            if (!container) return;

            container.innerHTML = '';
            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-financials.js';
            script.async = true;
            script.innerHTML = JSON.stringify({
                symbol: symbol,
                colorTheme: getTVColorTheme(),
                isTransparent: false,
                largeChartUrl: '',
                displayMode: 'regular',
                width: '100%',
                height: height,
                locale: 'fr'
            });
            container.appendChild(script);

            return () => { container.innerHTML = ''; };
        }, [symbol, height]);

        return <div ref={containerRef} style={{ height: height, width: '100%' }} />;
    };

    // =====================================================
    // 15. TECHNICAL ANALYSIS WIDGET
    // =====================================================
    const TechnicalAnalysisWidget = ({ symbol = 'NASDAQ:AAPL', height = 400 }) => {
        const containerRef = useRef(null);

        useEffect(() => {
            const container = containerRef.current;
            if (!container) return;

            container.innerHTML = '';
            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js';
            script.async = true;
            script.innerHTML = JSON.stringify({
                interval: '1D',
                width: '100%',
                isTransparent: false,
                height: height,
                symbol: symbol,
                showIntervalTabs: true,
                displayMode: 'single',
                locale: 'fr',
                colorTheme: getTVColorTheme()
            });
            container.appendChild(script);

            return () => { container.innerHTML = ''; };
        }, [symbol, height]);

        return <div ref={containerRef} style={{ height: height, width: '100%' }} />;
    };

    // =====================================================
    // EXPORT ALL WIDGETS - Organized by Category
    // =====================================================
    window.TradingViewWidgets = {
        // ===== UTILITY COMPONENTS =====
        LazyTVWidget,
        resetWidgetQueue,
        queueWidgetLoad,

        // ===== MARCHES (Global Market Perspective) =====
        // Use these in MarketsEconomyTab for global market views
        MarketOverviewWidget,      // Indices, Forex, Crypto overview with tabs
        MarketQuotesWidget,        // Multi-group quotes (indices, bonds, forex)
        HeatmapWidget,             // Stock heatmap (SPX500, TSX, AllUSA, etc.)
        ForexHeatMapWidget,        // Forex currency heat map
        ForexCrossRatesWidget,     // Forex cross rates table
        EconomicEventsWidget,      // Economic calendar events

        // ===== TITRES (Individual Stocks) =====
        // Use these in AdvancedAnalysisTab/StocksNewsTab for stock analysis
        ScreenerWidget,            // Stock screener with filters
        MiniSymbolOverviewWidget,  // Mini chart for single symbol
        AdvancedChartWidget,       // Full advanced chart with tools
        SymbolInfoWidget,          // Symbol info card (price, change)
        TimelineWidget,            // News timeline for a symbol
        SymbolProfileWidget,       // Company profile & description
        FinancialsWidget,          // Financial statements
        TechnicalAnalysisWidget,   // Technical analysis indicators

        // ===== TICKER (Global - stays in TradingViewTicker.js) =====
        TickerTapeWidget           // Scrolling ticker tape (reference only)
    };

    // Export category helpers for easy access
    window.TradingViewWidgets.MARCHES_WIDGETS = [
        'MarketOverviewWidget',
        'MarketQuotesWidget',
        'HeatmapWidget',
        'ForexHeatMapWidget',
        'ForexCrossRatesWidget',
        'EconomicEventsWidget'
    ];

    window.TradingViewWidgets.TITRES_WIDGETS = [
        'ScreenerWidget',
        'MiniSymbolOverviewWidget',
        'AdvancedChartWidget',
        'SymbolInfoWidget',
        'TimelineWidget',
        'SymbolProfileWidget',
        'FinancialsWidget',
        'TechnicalAnalysisWidget'
    ];

    console.log(' TradingViewWidgets.js loaded - 15 widgets (6 Marches + 8 Titres + 1 Ticker)');
})();
