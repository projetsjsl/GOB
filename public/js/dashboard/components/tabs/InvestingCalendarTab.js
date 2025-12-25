// Auto-converted from monolithic dashboard file
// Component: InvestingCalendarTab
// Cleaned version - removed duplicate TradingView widgets (they exist in AdvancedAnalysisTab)

const InvestingCalendarTab = ({ isDarkMode }) => {
    // Refs pour les widgets TradingView (uniquement ceux uniques à cet onglet)
    const tradingViewForexRef = useRef(null);
    const tradingViewEventsRef = useRef(null);
    const tradingViewCrossRatesRef = useRef(null);
    const tradingViewHeatmapTSXRef = useRef(null);
    const tradingViewMarketQuotesRef = useRef(null);

    // Charger le script TradingView Forex Heat Map
    useEffect(() => {
        const container = tradingViewForexRef.current;
        if (!container) return;

        container.innerHTML = '';

        const widgetDiv = document.createElement('div');
        widgetDiv.className = 'tradingview-widget-container__widget';
        container.appendChild(widgetDiv);

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-forex-heat-map.js';
        script.async = true;
        script.innerHTML = JSON.stringify({
            colorTheme: isDarkMode ? 'dark' : 'light',
            isTransparent: true,
            locale: 'fr',
            currencies: ['EUR', 'USD', 'JPY', 'GBP', 'CHF', 'AUD', 'CAD', 'CNY'],
            width: '100%',
            height: 400
        });

        container.appendChild(script);

        return () => {
            if (container) {
                container.innerHTML = '';
            }
        };
    }, [isDarkMode]);

    // Charger le script TradingView Events (Economic Calendar)
    useEffect(() => {
        const container = tradingViewEventsRef.current;
        if (!container) return;

        container.innerHTML = '';

        const widgetDiv = document.createElement('div');
        widgetDiv.className = 'tradingview-widget-container__widget';
        container.appendChild(widgetDiv);

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
        script.async = true;
        script.innerHTML = JSON.stringify({
            colorTheme: isDarkMode ? 'dark' : 'light',
            isTransparent: false,
            locale: 'en',
            countryFilter: 'ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,tr,gb,us,eu',
            importanceFilter: '-1,0,1',
            width: 400,
            height: 550
        });

        container.appendChild(script);

        return () => {
            if (container) {
                container.innerHTML = '';
            }
        };
    }, [isDarkMode]);

    // Charger le script TradingView Forex Cross Rates
    useEffect(() => {
        const container = tradingViewCrossRatesRef.current;
        if (!container) return;

        container.innerHTML = '';

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-forex-cross-rates.js';
        script.type = 'text/javascript';
        script.async = true;
        script.innerHTML = JSON.stringify({
            colorTheme: isDarkMode ? 'dark' : 'light',
            isTransparent: false,
            locale: 'fr',
            currencies: ['EUR', 'USD', 'JPY', 'GBP', 'CHF', 'AUD', 'CAD', 'NZD', 'CNY'],
            backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
            width: '100%',
            height: 400
        });

        container.appendChild(script);

        return () => {
            if (container) {
                container.innerHTML = '';
            }
        };
    }, [isDarkMode]);

    // Charger le script TradingView Stock Heatmap TSX (unique à cet onglet)
    useEffect(() => {
        const container = tradingViewHeatmapTSXRef.current;
        if (!container) return;

        container.innerHTML = '';

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
        script.type = 'text/javascript';
        script.async = true;
        script.innerHTML = JSON.stringify({
            dataSource: 'TSX',
            blockSize: 'market_cap_basic',
            blockColor: 'change',
            grouping: 'sector',
            locale: 'fr',
            symbolUrl: '',
            colorTheme: isDarkMode ? 'dark' : 'light',
            exchanges: [],
            hasTopBar: true,
            isDataSetEnabled: true,
            isZoomEnabled: true,
            hasSymbolTooltip: true,
            isMonoSize: false,
            width: '100%',
            height: '100%'
        });

        container.appendChild(script);

        return () => {
            if (container) {
                container.innerHTML = '';
            }
        };
    }, [isDarkMode]);

    // Charger le script TradingView Market Quotes (config unique avec bonds)
    useEffect(() => {
        const container = tradingViewMarketQuotesRef.current;
        if (!container) return;

        container.innerHTML = '';

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js';
        script.type = 'text/javascript';
        script.async = true;
        script.innerHTML = JSON.stringify({
            colorTheme: isDarkMode ? 'dark' : 'light',
            locale: 'fr',
            largeChartUrl: '',
            isTransparent: false,
            showSymbolLogo: true,
            backgroundColor: isDarkMode ? '#0F0F0F' : '#ffffff',
            support_host: 'https://www.tradingview.com',
            width: 600,
            height: 800,
            symbolsGroups: [
                {
                    name: 'Indices',
                    symbols: [
                        { name: 'FOREXCOM:SPXUSD', displayName: 'S&P 500 Index' },
                        { name: 'FOREXCOM:NSXUSD', displayName: 'US 100 Cash CFD' },
                        { name: 'FOREXCOM:DJI', displayName: 'Dow Jones Industrial Average Index' },
                        { name: 'TSX:TSX', displayName: 'TSX' },
                        { name: 'XETR:DAX', displayName: 'DAX' },
                        { name: 'GOMARKETS:FTSE100', displayName: 'FTSE100' },
                        { name: 'INDEX:NKY', displayName: 'Nikkei 225' }
                    ]
                },
                {
                    name: 'Futures',
                    symbols: [
                        { name: 'BMFBOVESPA:ISP1!', displayName: 'S&P 500' },
                        { name: 'CMCMARKETS:GOLD', displayName: 'Gold' },
                        { name: 'PYTH:WTI3!', displayName: 'WTI Crude Oil' }
                    ]
                },
                {
                    name: 'Bonds',
                    symbols: [
                        { name: 'TVC:US03MY', displayName: 'US yield 3 mois' },
                        { name: 'TVC:US02Y', displayName: 'US yield 2 ans' },
                        { name: 'TVC:US05Y', displayName: 'US yield 5 ans' },
                        { name: 'TVC:US10Y', displayName: 'US yield 10 ans' },
                        { name: 'TVC:US30Y', displayName: 'US yield 30 ans' },
                        { name: 'TVC:CA03MY', displayName: 'CAN yield 3 mois' },
                        { name: 'TVC:CA01Y', displayName: 'CAN yield 1 an' },
                        { name: 'TVC:CA05Y', displayName: 'CAN yield 5 ans' },
                        { name: 'TVC:CA10Y', displayName: 'CAN yield 10 ans' },
                        { name: 'TVC:CA30Y', displayName: 'CAN yield 30 ans' }
                    ]
                },
                {
                    name: 'Forex',
                    symbols: [
                        { name: 'FX:USDCAD', displayName: 'USD to CAD' },
                        { name: 'FX_IDC:CADUSD', displayName: 'CAD to USD' },
                        { name: 'FX:EURCAD', displayName: 'EUR to CAD' },
                        { name: 'SAXO:CADEUR', displayName: 'CAD to EUR' }
                    ]
                }
            ]
        });

        container.appendChild(script);

        return () => {
            if (container) {
                container.innerHTML = '';
            }
        };
    }, [isDarkMode]);

    return (
        <div className="space-y-3 md:space-y-6">

            {/* En-tête principal */}
            <div className={`p-3 md:p-6 rounded-lg transition-colors duration-300 ${
                isDarkMode ? 'bg-gradient-to-r from-blue-900 to-purple-900' : 'bg-gradient-to-r from-blue-100 to-purple-100'
            }`}>
                <div className="mb-2">
                    <h2 className={`text-xl md:text-2xl lg:text-3xl font-bold mb-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                        📅 Calendrier & Forex
                    </h2>
                    <p className={`text-xs md:text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-blue-200' : 'text-blue-800'
                    }`}>
                        Calendriers économiques, devises et marchés canadiens en temps réel
                    </p>
                </div>
            </div>

            {/* ========================================== */}
            {/* SECTION 1: 📅 CALENDRIERS & ÉVÉNEMENTS    */}
            {/* ========================================== */}
            <div className="mb-2 md:mb-4">
                <div className={`flex items-center gap-2 md:gap-3 mb-2 md:mb-4 pb-2 border-b-2 ${
                    isDarkMode ? 'border-blue-500' : 'border-blue-600'
                }`}>
                    <h3 className={`text-base md:text-lg lg:text-xl font-bold transition-colors duration-300 ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                        📅 Calendriers & Événements Économiques
                    </h3>
                </div>
            </div>

            {/* Calendrier Économique Investing.com */}
            <div className={`p-3 md:p-6 rounded-lg transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
                <div className="mb-3 md:mb-6">
                    <h2 className={`text-lg md:text-xl lg:text-2xl font-bold mb-1 md:mb-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                        📊 Calendrier Économique
                    </h2>
                    <p className={`text-xs md:text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                        Calendrier économique complet avec événements majeurs et données en temps réel
                    </p>
                </div>

                <div className="rounded-lg overflow-hidden relative h-[400px] md:h-[450px] lg:h-[500px]" style={{ background: 'transparent' }}>
                    <div
                        className={`absolute top-0 left-0 z-10 ${
                            isDarkMode ? 'bg-gray-800' : 'bg-white'
                        }`}
                        style={{ width: '100%', height: '40px' }}
                    />
                    <iframe
                        src="https://sslecal2.investing.com?columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&category=_employment,_economicActivity,_inflation,_credit,_centralBanks,_confidenceIndex,_balance,_Bonds&importance=1,2,3&features=datepicker,timezone,timeselector,filters&countries=6,5&calType=day&timeZone=8&lang=5&transparentBackground=1"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        allowTransparency="true"
                        marginWidth="0"
                        marginHeight="0"
                        sandbox="allow-scripts allow-same-origin allow-forms"
                        className="relative z-0"
                        style={{ minWidth: '100%', background: 'transparent' }}
                    />
                </div>
            </div>

            {/* Widget TradingView Economic Calendar Events */}
            <div className={`p-3 md:p-6 rounded-lg transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
                <div className="mb-3 md:mb-6">
                    <h2 className={`text-lg md:text-xl lg:text-2xl font-bold mb-1 md:mb-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                        📅 Economic Calendar Events
                    </h2>
                    <p className={`text-xs md:text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                        Événements économiques mondiaux par TradingView
                    </p>
                </div>

                <div className="h-[400px] md:h-[500px] lg:h-[600px]">
                    <div className="tradingview-widget-container h-full" ref={tradingViewEventsRef}>
                    </div>
                </div>
            </div>

            {/* ========================================== */}
            {/* SECTION 2: 💱 MARCHÉS FOREX                */}
            {/* ========================================== */}
            <div className="mb-4">
                <div className={`flex items-center gap-3 mb-4 pb-2 border-b-2 ${
                    isDarkMode ? 'border-green-500' : 'border-green-600'
                }`}>
                    <h3 className={`text-xl font-bold transition-colors duration-300 ${
                        isDarkMode ? 'text-green-400' : 'text-green-600'
                    }`}>
                        💱 Marchés Forex
                    </h3>
                </div>
            </div>

            {/* Widget TradingView Forex Heat Map */}
            <div className={`p-3 md:p-6 rounded-lg transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
                <div className="mb-3 md:mb-6">
                    <h2 className={`text-lg md:text-xl lg:text-2xl font-bold mb-1 md:mb-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                        💱 Forex Heat Map
                    </h2>
                    <p className={`text-xs md:text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                        Carte de chaleur des devises en temps réel (EUR, USD, JPY, GBP, CHF, AUD, CAD, CNY)
                    </p>
                </div>

                <div className="h-[350px] md:h-[400px] lg:h-[450px]">
                    <div className="tradingview-widget-container h-full" ref={tradingViewForexRef}>
                    </div>
                </div>
            </div>

            {/* Widget TradingView Forex Cross Rates */}
            <div className={`p-3 md:p-6 rounded-lg transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
                <div className="mb-3 md:mb-6">
                    <h2 className={`text-lg md:text-xl lg:text-2xl font-bold mb-1 md:mb-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                        💱 Forex Cross Rates
                    </h2>
                    <p className={`text-xs md:text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                        Taux de change croisés pour 9 devises majeures (EUR, USD, JPY, GBP, CHF, AUD, CAD, NZD, CNY)
                    </p>
                </div>

                <div className="h-[350px] md:h-[400px] lg:h-[450px]">
                    <div className="tradingview-widget-container h-full" ref={tradingViewCrossRatesRef}>
                    </div>
                </div>
            </div>

            {/* ========================================== */}
            {/* SECTION 3: 📊 MARCHÉS CANADIENS           */}
            {/* ========================================== */}
            <div className="mb-2 md:mb-4">
                <div className={`flex items-center gap-2 md:gap-3 mb-2 md:mb-4 pb-2 border-b-2 ${
                    isDarkMode ? 'border-red-500' : 'border-red-600'
                }`}>
                    <h3 className={`text-base md:text-lg lg:text-xl font-bold transition-colors duration-300 ${
                        isDarkMode ? 'text-red-400' : 'text-red-600'
                    }`}>
                        🇨🇦 Marchés Canadiens
                    </h3>
                </div>
            </div>

            {/* Widget TradingView Stock Heatmap TSX */}
            <div className={`p-3 md:p-6 rounded-lg transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
                <div className="mb-3 md:mb-6">
                    <h2 className={`text-lg md:text-xl lg:text-2xl font-bold mb-1 md:mb-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                        🇨🇦 Stock Heatmap TSX
                    </h2>
                    <p className={`text-xs md:text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                        Carte thermique du Toronto Stock Exchange (TSX) - Performance par secteur et capitalisation
                    </p>
                </div>

                <div className="h-[500px] md:h-[700px] lg:h-[900px]">
                    <div className="tradingview-widget-container h-full" ref={tradingViewHeatmapTSXRef}>
                        <div className="tradingview-widget-container__widget"></div>
                        <div className={`tradingview-widget-copyright text-center text-xs mt-2 transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                            <a
                                href="https://fr.tradingview.com/heatmap/stock/"
                                rel="noopener nofollow"
                                target="_blank"
                                className={`underline transition-colors duration-300 ${
                                    isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                                }`}
                            >
                                <span className="blue-text">Suivez tous les marchés sur TradingView</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Widget TradingView Market Quotes */}
            <div className={`p-3 md:p-6 rounded-lg transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
                <div className="mb-3 md:mb-6">
                    <h2 className={`text-lg md:text-xl lg:text-2xl font-bold mb-1 md:mb-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                        📊 Market Quotes - Indices, Futures, Bonds, Forex
                    </h2>
                    <p className={`text-xs md:text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                        Cotations en temps réel organisées par catégories (Indices, Futures, Obligations US/CAN, Forex CAD)
                    </p>
                </div>

                <div className="h-[600px] md:h-[700px] lg:h-[850px]">
                    <div className="tradingview-widget-container h-full" ref={tradingViewMarketQuotesRef}>
                        <div className="tradingview-widget-container__widget"></div>
                        <div className={`tradingview-widget-copyright text-center text-xs mt-2 transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                            <a
                                href="https://fr.tradingview.com/markets/"
                                rel="noopener nofollow"
                                target="_blank"
                                className={`underline transition-colors duration-300 ${
                                    isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                                }`}
                            >
                                <span className="blue-text">Suivez tous les marchés sur TradingView</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Note informative */}
            <div className={`p-4 rounded-lg border-2 transition-colors duration-300 ${
                isDarkMode 
                    ? 'bg-gray-800/50 border-gray-700 text-gray-400' 
                    : 'bg-gray-50 border-gray-200 text-gray-600'
            }`}>
                <p className="text-sm text-center">
                    💡 <strong>Conseil:</strong> Pour l'analyse technique avancée (graphiques, états financiers, profil entreprise), 
                    consultez l'onglet <strong>"Analyse Avancée"</strong> dans le menu.
                </p>
            </div>

        </div>
    );
};

window.InvestingCalendarTab = InvestingCalendarTab;
