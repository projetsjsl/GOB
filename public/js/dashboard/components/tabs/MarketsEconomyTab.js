// Auto-converted from monolithic dashboard file
// Component: MarketsEconomyTab
// Merged with InvestingCalendarTab widgets (Forex, Calendar, TSX, Bonds)

const { useState, useEffect, useRef } = React;
// Use LazyWidgetWrapper from window (loaded globally, don't redeclare with const)
// Create a function that returns the component to avoid redeclaration conflicts
const getLazyWrapper = () => (window.LazyWidgetWrapper || (({ children }) => children));
// Ensure LucideIcon is available with fallback
const LucideIcon = window.LucideIcon ||
    (typeof window !== 'undefined' ? window.DASHBOARD_UTILS?.LucideIcon : undefined) ||
    (({ name, className = '' }) => React.createElement('span', { className: `icon-${name} ${className}` }));

// =====================================================
// WIDGET COMPONENTS
// =====================================================

const MarketOverviewWidget = ({ isDarkMode }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const config = {
            "colorTheme": isDarkMode ? "dark" : "light",
            "dateRange": "1D",
            "showChart": true,
            "locale": "fr",
            "width": "100%",
            "height": "100%",
            "largeChartUrl": "",
            "isTransparent": false,
            "showSymbolLogo": true,
            "showFloatingTooltip": true,
            "tabs": [
                {
                    "title": "Indices",
                    "symbols": [
                        {"s": "FOREXCOM:SPXUSD", "d": "S&P 500"},
                        {"s": "FOREXCOM:NSXUSD", "d": "US 100"},
                        {"s": "FOREXCOM:DJI", "d": "Dow 30"},
                        {"s": "INDEX:NKY", "d": "Nikkei 225"},
                        {"s": "INDEX:DEU40", "d": "DAX Index"},
                        {"s": "FOREXCOM:UKXGBP", "d": "UK 100"}
                    ]
                },
                {
                    "title": "Forex",
                    "symbols": [
                        {"s": "FX:EURUSD", "d": "EUR/USD"},
                        {"s": "FX:GBPUSD", "d": "GBP/USD"},
                        {"s": "FX:USDJPY", "d": "USD/JPY"},
                        {"s": "FX:USDCAD", "d": "USD/CAD"}
                    ]
                },
                {
                    "title": "Crypto",
                    "symbols": [
                        {"s": "BINANCE:BTCUSDT", "d": "Bitcoin"},
                        {"s": "BINANCE:ETHUSDT", "d": "Ethereum"},
                        {"s": "BINANCE:BNBUSDT", "d": "BNB"},
                        {"s": "BINANCE:SOLUSDT", "d": "Solana"}
                    ]
                }
            ]
        };

        const loader = window.optimizedWidgetLoader;
        let fallbackScript;

        if (loader) {
            loader.releaseWidget(container);
            loader.loadWidget(container, 'market-overview', config, false);
        } else {
            container.innerHTML = '';
            fallbackScript = document.createElement('script');
            fallbackScript.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js';
            fallbackScript.async = true;
            fallbackScript.innerHTML = JSON.stringify(config);
            container.appendChild(fallbackScript);
        }

        return () => {
            if (loader) {
                loader.releaseWidget(container);
            }
            container.innerHTML = '';
            if (fallbackScript) {
                fallbackScript.remove();
            }
        };
    }, [isDarkMode]);

    return React.createElement('div', { ref: containerRef, style: { height: '100%', width: '100%' } });
};

const HeatmapWidget = ({ isDarkMode, dataSource = "SPX500" }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const config = {
            "exchanges": [],
            "dataSource": dataSource,
            "grouping": "sector",
            "blockSize": "market_cap_basic",
            "blockColor": "change",
            "locale": "fr",
            "symbolUrl": "",
            "colorTheme": isDarkMode ? "dark" : "light",
            "hasTopBar": true,
            "isDataSetEnabled": true,
            "isZoomEnabled": true,
            "hasSymbolTooltip": true,
            "width": "100%",
            "height": "100%"
        };

        const loader = window.optimizedWidgetLoader;
        let fallbackScript;

        if (loader) {
            loader.releaseWidget(container);
            loader.loadWidget(container, 'stock-heatmap', config, false);
        } else {
            container.innerHTML = '';
            fallbackScript = document.createElement('script');
            fallbackScript.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
            fallbackScript.async = true;
            fallbackScript.innerHTML = JSON.stringify(config);
            container.appendChild(fallbackScript);
        }

        return () => {
            if (loader) {
                loader.releaseWidget(container);
            }
            container.innerHTML = '';
            if (fallbackScript) {
                fallbackScript.remove();
            }
        };
    }, [isDarkMode, dataSource]);

    return React.createElement('div', { ref: containerRef, style: { height: '100%', width: '100%' } });
};

const ForexHeatMapWidget = ({ isDarkMode }) => {
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
            colorTheme: isDarkMode ? 'dark' : 'light',
            isTransparent: true,
            locale: 'fr',
            currencies: ['EUR', 'USD', 'JPY', 'GBP', 'CHF', 'AUD', 'CAD', 'CNY'],
            width: '100%',
            height: 400
        });

        container.appendChild(script);

        return () => {
            if (container) container.innerHTML = '';
        };
    }, [isDarkMode]);

    return React.createElement('div', { ref: containerRef, style: { height: '100%', width: '100%' } });
};

const ForexCrossRatesWidget = ({ isDarkMode }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
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
            if (container) container.innerHTML = '';
        };
    }, [isDarkMode]);

    return React.createElement('div', { ref: containerRef, style: { height: '100%', width: '100%' } });
};

const EconomicEventsWidget = ({ isDarkMode }) => {
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
            colorTheme: isDarkMode ? 'dark' : 'light',
            isTransparent: false,
            locale: 'en',
            countryFilter: 'ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,tr,gb,us,eu',
            importanceFilter: '-1,0,1',
            width: '100%',
            height: 550
        });

        container.appendChild(script);

        return () => {
            if (container) container.innerHTML = '';
        };
    }, [isDarkMode]);

    return React.createElement('div', { ref: containerRef, style: { height: '100%', width: '100%' } });
};

const MarketQuotesWidget = ({ isDarkMode }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
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
            width: '100%',
            height: 700,
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
                        { name: 'CMCMARKETS:GOLD', displayName: 'Gold' },
                        { name: 'PYTH:WTI3!', displayName: 'WTI Crude Oil' }
                    ]
                },
                {
                    name: 'Bonds US',
                    symbols: [
                        { name: 'TVC:US02Y', displayName: 'US 2Y' },
                        { name: 'TVC:US05Y', displayName: 'US 5Y' },
                        { name: 'TVC:US10Y', displayName: 'US 10Y' },
                        { name: 'TVC:US30Y', displayName: 'US 30Y' }
                    ]
                },
                {
                    name: 'Bonds CAN',
                    symbols: [
                        { name: 'TVC:CA02Y', displayName: 'CAN 2Y' },
                        { name: 'TVC:CA05Y', displayName: 'CAN 5Y' },
                        { name: 'TVC:CA10Y', displayName: 'CAN 10Y' }
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

        return () => {
            if (container) container.innerHTML = '';
        };
    }, [isDarkMode]);

    return React.createElement('div', { ref: containerRef, style: { height: '100%', width: '100%' } });
};

// =====================================================
// MAIN COMPONENT
// =====================================================

const MarketsEconomyTab = ({
    isDarkMode = false,
    newsData = [],
    loading = false,
    lastUpdate = null,
    fetchNews = () => {},
    summarizeWithEmma = () => {},
    isFrenchArticle = () => false,
    getNewsIcon = () => ({ icon: 'Newspaper', color: 'text-gray-500' }),
    getSourceCredibility = () => 50,
    cleanText = (text) => text
}) => {
    const [localFrenchOnly, setLocalFrenchOnly] = useState(false);
    const [selectedSource, setSelectedSource] = useState('all');
    const [selectedMarket, setSelectedMarket] = useState('all');
    const [selectedTheme, setSelectedTheme] = useState('all');
    const [activeSection, setActiveSection] = useState('overview'); // 'overview', 'forex', 'calendar', 'canada', 'news'

    const sources = ['Bloomberg', 'Reuters', 'WSJ', 'CNBC', 'MarketWatch', 'La Presse', 'Les Affaires'];
    const markets = ['US', 'Canada', 'Europe', 'Asie'];
    const themes = ['Tech', 'Finance', 'Énergie', 'Santé', 'Crypto', 'IA'];

    // Get LazyWidgetWrapper safely
    const LazyWidgetWrapper = getLazyWrapper();

    const matchesSource = (articleSource, selectedSource) => {
        if (!articleSource || !selectedSource) return false;
        const source = articleSource.toLowerCase();
        const selected = selectedSource.toLowerCase();
        
        const sourceVariations = {
            'bloomberg': ['bloomberg', 'bloomberg.com', 'bloomberg news'],
            'reuters': ['reuters', 'reuters.com', 'thomson reuters'],
            'wsj': ['wsj', 'wall street journal', 'the wall street journal', 'wsj.com'],
            'cnbc': ['cnbc', 'cnbc.com'],
            'marketwatch': ['marketwatch', 'marketwatch.com', 'market watch'],
            'la presse': ['la presse', 'lapresse', 'lapresse.ca', 'presse'],
            'les affaires': ['les affaires', 'lesaffaires', 'lesaffaires.com', 'affaires']
        };
        
        if (source.includes(selected) || selected.includes(source)) return true;
        
        const variations = sourceVariations[selected];
        if (variations) {
            return variations.some(variation => source.includes(variation));
        }
        
        return false;
    };

    // MEMOIZED FILTERING LOGIC
    // Replaces useEffect/useState to avoid infinite render loops
    const { filteredNews: localFilteredNews, isApproximateMatch } = React.useMemo(() => {
        let filtered = newsData || [];
        let hasExactMatches = true;

        if (localFrenchOnly) {
            filtered = filtered.filter(article => isFrenchArticle(article));
        }

        if (selectedSource !== 'all') {
            const beforeFilter = filtered.length;
            filtered = filtered.filter(article =>
                matchesSource(article.source?.name, selectedSource)
            );
            if (filtered.length === 0 && beforeFilter > 0) {
                // Fallback: less strict search
                filtered = (newsData || []).filter(article => {
                    const sourceName = (article.source?.name || '').toLowerCase();
                    const selected = selectedSource.toLowerCase();
                    return sourceName.includes(selected) || selected.includes(sourceName);
                });
                hasExactMatches = false;
            }
        }

        if (selectedMarket !== 'all') {
            const marketKeywords = {
                'US': ['u.s.', 'united states', 'american', 'wall street', 'nasdaq', 'dow', 's&p', 'federal reserve', 'fed'],
                'Canada': ['canada', 'canadian', 'toronto', 'tsx', 'bank of canada'],
                'Europe': ['europe', 'european', 'eu', 'ecb', 'london', 'frankfurt', 'paris'],
                'Asie': ['asia', 'asian', 'china', 'japan', 'tokyo', 'shanghai', 'nikkei']
            };
            const beforeFilter = filtered.length;
            filtered = filtered.filter(article => {
                const text = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
                return marketKeywords[selectedMarket]?.some(keyword => text.includes(keyword));
            });
            if (filtered.length === 0 && beforeFilter > 0) {
                hasExactMatches = false;
            }
        }

        if (selectedTheme !== 'all') {
            const themeKeywords = {
                'Tech': ['tech', 'technology', 'software', 'apple', 'google', 'microsoft', 'nvidia'],
                'Finance': ['bank', 'finance', 'financial', 'trading', 'investment'],
                'Énergie': ['energy', 'oil', 'gas', 'renewable', 'solar'],
                'Santé': ['health', 'healthcare', 'pharma', 'medical'],
                'Crypto': ['crypto', 'bitcoin', 'ethereum', 'blockchain'],
                'IA': ['ai', 'artificial intelligence', 'machine learning', 'chatgpt']
            };
            filtered = filtered.filter(article => {
                const text = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
                return themeKeywords[selectedTheme]?.some(keyword => text.includes(keyword));
            });
        }

        if (filtered.length === 0 && (newsData || []).length > 0) {
            filtered = (newsData || []).slice(0, 20);
            hasExactMatches = false;
        }

        return { 
            filteredNews: filtered, 
            isApproximateMatch: !hasExactMatches 
        };
    }, [newsData, localFrenchOnly, selectedSource, selectedMarket, selectedTheme]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className={`p-4 md:p-6 rounded-xl transition-colors duration-300 ${
                isDarkMode ? 'bg-gradient-to-r from-blue-900 to-purple-900' : 'bg-gradient-to-r from-blue-100 to-purple-100'
            }`}>
                <h2 className={`text-2xl md:text-3xl font-bold mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>📊 Marchés & Économie</h2>
                <p className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-blue-200' : 'text-blue-800'
                }`}>
                    Vue complète des marchés, devises, calendriers économiques et actualités
                </p>
            </div>

            {/* Navigation Sections */}
            <div className="flex flex-wrap gap-2">
                {[
                    { id: 'overview', label: '📊 Vue Globale', icon: 'BarChart3' },
                    { id: 'forex', label: '💱 Forex', icon: 'DollarSign' },
                    { id: 'calendar', label: '📅 Calendrier', icon: 'Calendar' },
                    { id: 'canada', label: '🇨🇦 Canada', icon: 'Flag' },
                    { id: 'news', label: '📰 Actualités', icon: 'Newspaper' }
                ].map(section => (
                    <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                            activeSection === section.id
                                ? 'bg-blue-600 text-white shadow-lg'
                                : (isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700')
                        }`}
                    >
                        {section.label}
                    </button>
                ))}
            </div>

            {/* ===== SECTION: VUE GLOBALE ===== */}
            {activeSection === 'overview' && (
                <div className="space-y-6">
                    {/* Market Overview Widget */}
                    <div className={`rounded-xl overflow-hidden border-2 transition-colors duration-300 ${
                        isDarkMode ? 'bg-gray-800/50 border-blue-500/30' : 'bg-white border-blue-400/40'
                    }`}>
                        <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                📊 Vue d'ensemble des Marchés
                            </h3>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Indices majeurs, Forex, Crypto - Données en direct
                            </p>
                        </div>
                        <div style={{height: '450px'}}>
                            <LazyWidgetWrapper height={450}>
                                <MarketOverviewWidget isDarkMode={isDarkMode} />
                            </LazyWidgetWrapper>
                        </div>
                    </div>

                    {/* Heatmaps Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* US Heatmap */}
                        <div className={`rounded-xl overflow-hidden border-2 transition-colors duration-300 ${
                            isDarkMode ? 'bg-gray-800/50 border-green-500/30' : 'bg-white border-green-400/40'
                        }`}>
                            <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    🇺🇸 Heatmap S&P 500
                                </h3>
                            </div>
                            <div style={{height: '500px'}}>
                                <LazyWidgetWrapper height={500}>
                                    <HeatmapWidget isDarkMode={isDarkMode} dataSource="SPX500" />
                                </LazyWidgetWrapper>
                            </div>
                        </div>

                        {/* TSX Heatmap */}
                        <div className={`rounded-xl overflow-hidden border-2 transition-colors duration-300 ${
                            isDarkMode ? 'bg-gray-800/50 border-red-500/30' : 'bg-white border-red-400/40'
                        }`}>
                            <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    🇨🇦 Heatmap TSX
                                </h3>
                            </div>
                            <div style={{height: '500px'}}>
                                <LazyWidgetWrapper height={500}>
                                    <HeatmapWidget isDarkMode={isDarkMode} dataSource="TSX" />
                                </LazyWidgetWrapper>
                            </div>
                        </div>
                    </div>

                    {/* Market Quotes */}
                    <div className={`rounded-xl overflow-hidden border-2 transition-colors duration-300 ${
                        isDarkMode ? 'bg-gray-800/50 border-purple-500/30' : 'bg-white border-purple-400/40'
                    }`}>
                        <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                📊 Cotations - Indices, Bonds, Forex
                            </h3>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Rendements obligataires US/CAN et taux de change
                            </p>
                        </div>
                        <div style={{height: '700px'}}>
                            <LazyWidgetWrapper height={700}>
                                <MarketQuotesWidget isDarkMode={isDarkMode} />
                            </LazyWidgetWrapper>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== SECTION: FOREX ===== */}
            {activeSection === 'forex' && (
                <div className="space-y-6">
                    {/* Forex Heat Map */}
                    <div className={`rounded-xl overflow-hidden border-2 transition-colors duration-300 ${
                        isDarkMode ? 'bg-gray-800/50 border-green-500/30' : 'bg-white border-green-400/40'
                    }`}>
                        <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                💱 Forex Heat Map
                            </h3>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Carte de chaleur des devises (EUR, USD, JPY, GBP, CHF, AUD, CAD, CNY)
                            </p>
                        </div>
                        <div style={{height: '450px'}}>
                            <LazyWidgetWrapper height={450}>
                                <ForexHeatMapWidget isDarkMode={isDarkMode} />
                            </LazyWidgetWrapper>
                        </div>
                    </div>

                    {/* Forex Cross Rates */}
                    <div className={`rounded-xl overflow-hidden border-2 transition-colors duration-300 ${
                        isDarkMode ? 'bg-gray-800/50 border-blue-500/30' : 'bg-white border-blue-400/40'
                    }`}>
                        <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                💱 Taux de Change Croisés
                            </h3>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                9 devises majeures (EUR, USD, JPY, GBP, CHF, AUD, CAD, NZD, CNY)
                            </p>
                        </div>
                        <div style={{height: '450px'}}>
                            <LazyWidgetWrapper height={450}>
                                <ForexCrossRatesWidget isDarkMode={isDarkMode} />
                            </LazyWidgetWrapper>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== SECTION: CALENDRIER ===== */}
            {activeSection === 'calendar' && (
                <div className="space-y-6">
                    {/* Investing.com Calendar */}
                    <div className={`rounded-xl overflow-hidden border-2 transition-colors duration-300 ${
                        isDarkMode ? 'bg-gray-800/50 border-blue-500/30' : 'bg-white border-blue-400/40'
                    }`}>
                        <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                📅 Calendrier Économique
                            </h3>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Événements majeurs et données en temps réel
                            </p>
                        </div>
                        <div className="relative" style={{height: '500px'}}>
                            <div
                                className={`absolute top-0 left-0 z-10 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
                                style={{ width: '100%', height: '40px' }}
                            />
                            <iframe
                                src="https://sslecal2.investing.com?columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&category=_employment,_economicActivity,_inflation,_credit,_centralBanks,_confidenceIndex,_balance,_Bonds&importance=1,2,3&features=datepicker,timezone,timeselector,filters&countries=6,5&calType=day&timeZone=8&lang=5&transparentBackground=1"
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                allowTransparency="true"
                                sandbox="allow-scripts allow-same-origin allow-forms"
                                style={{ minWidth: '100%', background: 'transparent' }}
                            />
                        </div>
                    </div>

                    {/* TradingView Events */}
                    <div className={`rounded-xl overflow-hidden border-2 transition-colors duration-300 ${
                        isDarkMode ? 'bg-gray-800/50 border-purple-500/30' : 'bg-white border-purple-400/40'
                    }`}>
                        <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                📅 Événements Économiques TradingView
                            </h3>
                        </div>
                        <div style={{height: '550px'}}>
                            <LazyWidgetWrapper height={550}>
                                <EconomicEventsWidget isDarkMode={isDarkMode} />
                            </LazyWidgetWrapper>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== SECTION: CANADA ===== */}
            {activeSection === 'canada' && (
                <div className="space-y-6">
                    {/* TSX Heatmap */}
                    <div className={`rounded-xl overflow-hidden border-2 transition-colors duration-300 ${
                        isDarkMode ? 'bg-gray-800/50 border-red-500/30' : 'bg-white border-red-400/40'
                    }`}>
                        <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                🇨🇦 Heatmap TSX
                            </h3>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Toronto Stock Exchange - Performance par secteur
                            </p>
                        </div>
                        <div style={{height: '700px'}}>
                            <LazyWidgetWrapper height={700}>
                                <HeatmapWidget isDarkMode={isDarkMode} dataSource="TSX" />
                            </LazyWidgetWrapper>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== SECTION: ACTUALITÉS ===== */}
            {activeSection === 'news' && (
                <div className="space-y-6">
                    {/* Header Actions */}
                    <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setLocalFrenchOnly(!localFrenchOnly)}
                                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                                    localFrenchOnly
                                        ? 'bg-blue-600 text-white'
                                        : (isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900')
                                }`}
                            >
                                🇫🇷 Français {localFrenchOnly && '✓'}
                            </button>
                            <button
                                onClick={fetchNews}
                                disabled={loading}
                                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 ${
                                    isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                                }`}
                            >
                                {loading ? '⏳ Actualisation...' : '🔄 Actualiser'}
                            </button>
                        </div>
                    </div>

                    {lastUpdate && (
                        <p className="text-gray-400 text-sm">
                            Dernière mise à jour: {new Date(lastUpdate).toLocaleString('fr-FR')}
                        </p>
                    )}

                    {/* Statistiques */}
                    <div className={`p-4 rounded-xl transition-colors duration-300 ${
                        isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
                    }`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {localFilteredNews.length}
                                </div>
                                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Articles filtrés
                                </div>
                            </div>
                            <LucideIcon name="Newspaper" className={`w-12 h-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                        </div>
                    </div>

                    {/* Filtres */}
                    <div className={`p-6 rounded-xl transition-colors duration-300 ${
                        isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
                    }`}>
                        <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>🔍 Filtres</h3>

                        {/* Source Filter */}
                        <div className="mb-4">
                            <label className={`text-sm font-semibold mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>📰 Source</label>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => setSelectedSource('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedSource === 'all' ? 'bg-blue-600 text-white' : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}`}>Toutes</button>
                                {sources.map(source => (
                                    <button key={source} onClick={() => setSelectedSource(source)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedSource === source ? 'bg-blue-600 text-white' : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}`}>{source}</button>
                                ))}
                            </div>
                        </div>

                        {/* Market Filter */}
                        <div className="mb-4">
                            <label className={`text-sm font-semibold mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>🌍 Marché</label>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => setSelectedMarket('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedMarket === 'all' ? 'bg-green-600 text-white' : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}`}>Tous</button>
                                {markets.map(market => (
                                    <button key={market} onClick={() => setSelectedMarket(market)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedMarket === market ? 'bg-green-600 text-white' : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}`}>{market}</button>
                                ))}
                            </div>
                        </div>

                        {/* Theme Filter */}
                        <div>
                            <label className={`text-sm font-semibold mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>🏷️ Thématique</label>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => setSelectedTheme('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedTheme === 'all' ? 'bg-purple-600 text-white' : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}`}>Toutes</button>
                                {themes.map(theme => (
                                    <button key={theme} onClick={() => setSelectedTheme(theme)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedTheme === theme ? 'bg-purple-600 text-white' : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}`}>{theme}</button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* News List */}
                    <div className="space-y-4">
                        {localFilteredNews.length === 0 ? (
                            <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <LucideIcon name="AlertCircle" className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-semibold mb-2">Aucune nouvelle disponible</p>
                                <p className="text-sm">Cliquez sur Actualiser pour charger les dernières nouvelles</p>
                            </div>
                        ) : (
                            localFilteredNews.slice(0, 20).map((article, index) => {
                                const newsIconData = getNewsIcon(article.title, article.description, article.sentiment);
                                const credibility = getSourceCredibility(article.source?.name);

                                return (
                                    <div key={index} className={`p-6 rounded-xl transition-all duration-300 hover:scale-[1.01] ${
                                        isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 hover:border-gray-600' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200 hover:border-gray-300'
                                    }`}>
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-full ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-200/60'}`}>
                                                <LucideIcon name={newsIconData.icon} className={`w-6 h-6 ${newsIconData.color}`} />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className={`font-bold text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    {article.url ? (
                                                        <a href={article.url} target="_blank" rel="noopener noreferrer" className={`hover:underline ${isDarkMode ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-700'}`}>
                                                            {cleanText(article.title)}
                                                        </a>
                                                    ) : cleanText(article.title)}
                                                </h3>
                                                <p className={`text-base mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                    {cleanText(article.description)}
                                                </p>
                                                <div className="flex items-center gap-4 flex-wrap">
                                                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                                                        credibility >= 85 ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30' : (isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700')
                                                    }`}>
                                                        <span className="text-xs font-semibold">{article.source?.name || 'Source inconnue'}</span>
                                                    </div>
                                                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        {new Date(article.publishedAt || article.publishedDate).toLocaleString('fr-FR')}
                                                    </span>
                                                    {isFrenchArticle(article) && (
                                                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-500 border border-blue-500/30">🇫🇷 FR</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

MarketsEconomyTab.displayName = 'MarketsEconomyTab';

// Export with React.memo for performance stabilization
window.MarketsEconomyTab = React.memo(MarketsEconomyTab);
