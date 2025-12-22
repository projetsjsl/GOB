/**
 * MarketsEconomyTabRGL.js
 * Version React-Grid-Layout du MarketsEconomyTab
 */

(function() {
    'use strict';

    const { useState, useEffect, useCallback, useMemo, useRef } = React;

    // ===================================
    // CONFIGURATION RGL
    // ===================================
    const STORAGE_KEY = 'gob_layout_markets';
    const COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
    const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
    const ROW_HEIGHT = 60;

    const DEFAULT_LAYOUTS = {
        lg: [
            { i: 'stats-bar', x: 0, y: 0, w: 12, h: 2, static: true }, // Toolbar/Stats fixés en haut
            { i: 'market-overview', x: 0, y: 2, w: 6, h: 8, minW: 4, minH: 6 },
            { i: 'heatmap', x: 6, y: 2, w: 6, h: 8, minW: 4, minH: 6 },
            { i: 'news-feed', x: 0, y: 10, w: 12, h: 10, minW: 6, minH: 6 }
        ]
    };

    // ===================================
    // COMPOSANT PRINCIPAL
    // ===================================
    const MarketsEconomyTabRGL = ({ isDarkMode = true, isAdmin = false }) => {
        // --- State Local (Filtres & Data) ---
        const [localFrenchOnly, setLocalFrenchOnly] = useState(false);
        const [selectedSource, setSelectedSource] = useState('all');
        const [selectedMarket, setSelectedMarket] = useState('all');
        const [selectedTheme, setSelectedTheme] = useState('all');
        const [newsData, setNewsData] = useState([]);
        const [loading, setLoading] = useState(false);
        const [lastUpdate, setLastUpdate] = useState(null);
        
        // --- State RGL ---
        const [layouts, setLayouts] = useState(() => {
            try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || DEFAULT_LAYOUTS; }
            catch (e) { return DEFAULT_LAYOUTS; }
        });
        const [isEditing, setIsEditing] = useState(false);

        // --- Refs TradingView ---
        const marketOverviewRef = useRef(null);
        const heatmapRef = useRef(null);

        // --- Fetch News Logic (Simulée pour l'instant ou importée si dispo globalement) ---
        // Idéalement on réutiliserait la logique existante. Pour la migration, je suppose que fetchNews est dispo ou je le mocke.
        const fetchNews = useCallback(async () => {
            setLoading(true);
            // Simulation
            setTimeout(() => {
                setLoading(false);
                setLastUpdate(new Date());
                // Ici on mettrait la vraie logique de fetch
            }, 1000);
        }, []);

        // --- RGL Setup ---
        const RGL = window.ReactGridLayout;
        const ResponsiveGridLayout = useMemo(() => 
            RGL && RGL.WidthProvider && RGL.Responsive ? RGL.WidthProvider(RGL.Responsive) : null, 
        [RGL]);

        const handleLayoutChange = useCallback((layout, allLayouts) => {
            if (isEditing) {
                setLayouts(allLayouts);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(allLayouts));
            }
        }, [isEditing]);

        // --- TradingView Scripts Injection ---
        useEffect(() => {
            if (marketOverviewRef.current) {
                marketOverviewRef.current.innerHTML = '';
                const script = document.createElement('script');
                script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js';
                script.async = true;
                script.innerHTML = JSON.stringify({
                    "colorTheme": isDarkMode ? "dark" : "light",
                    "dateRange": "1D",
                    "showChart": true,
                    "locale": "fr",
                    "width": "100%",
                    "height": "100%",
                    "tabs": [
                        { "title": "Indices", "symbols": [{"s": "FOREXCOM:SPXUSD", "d": "S&P 500"}, {"s": "FOREXCOM:NSXUSD", "d": "US 100"}] },
                        { "title": "Forex", "symbols": [{"s": "FX:EURUSD", "d": "EUR/USD"}] },
                        { "title": "Crypto", "symbols": [{"s": "BINANCE:BTCUSDT", "d": "Bitcoin"}] }
                    ]
                });
                marketOverviewRef.current.appendChild(script);
            }
            // Idem pour heatmap...
            if (heatmapRef.current) {
                heatmapRef.current.innerHTML = '';
                const script = document.createElement('script');
                script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
                script.async = true;
                script.innerHTML = JSON.stringify({
                    "exchanges": [],
                    "dataSource": "SPX500",
                    "grouping": "sector",
                    "blockSize": "market_cap_basic",
                    "blockColor": "change",
                    "locale": "fr",
                    "colorTheme": isDarkMode ? "dark" : "light",
                    "hasTopBar": true,
                    "isDataSetEnabled": true,
                    "width": "100%",
                    "height": "100%"
                });
                heatmapRef.current.appendChild(script);
            }
        }, [isDarkMode]);

        // --- Rendu des Widgets ---
        const renderWidget = (id) => {
            switch(id) {
                case 'stats-bar':
                    return (
                        <div className={`h-full w-full rounded-xl p-4 flex items-center justify-between ${isDarkMode ? 'bg-neutral-800' : 'bg-white'} shadow-sm`}>
                            <div className="flex items-center gap-4">
                                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>📰 Marchés Global</h2>
                                <span className={`px-2 py-1 rounded text-xs ${isDarkMode ? 'bg-neutral-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                    {lastUpdate ? `MàJ: ${lastUpdate.toLocaleTimeString()}` : 'Prêt'}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button title="Action" onClick={() => setLocalFrenchOnly(!localFrenchOnly)} className={`px-3 py-1 rounded-lg text-sm ${localFrenchOnly ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                                    🇫🇷 FR
                                </button>
                                <button onClick={fetchNews} className={`px-3 py-1 rounded-lg text-sm ${isDarkMode ? 'bg-neutral-700 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                    🔄
                                </button>
                                <button onClick={() => setIsEditing(!isEditing)} className={`px-3 py-1 rounded-lg text-sm ${isEditing ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                    {isEditing ? '✓' : '✎'}
                                </button>
                            </div>
                        </div>
                    );
                case 'market-overview':
                    return (
                        <div className={`h-full w-full rounded-xl overflow-hidden ${isDarkMode ? 'bg-neutral-800' : 'bg-white'} shadow-lg border ${isDarkMode ? 'border-neutral-700' : 'border-gray-200'}`}>
                             <div className="h-full w-full" ref={marketOverviewRef}></div>
                        </div>
                    );
                case 'heatmap':
                    return (
                         <div className={`h-full w-full rounded-xl overflow-hidden ${isDarkMode ? 'bg-neutral-800' : 'bg-white'} shadow-lg border ${isDarkMode ? 'border-neutral-700' : 'border-gray-200'}`}>
                             <div className="h-full w-full" ref={heatmapRef}></div>
                        </div>
                    );
                case 'news-feed':
                    return (
                        <div className={`h-full w-full rounded-xl p-4 overflow-auto ${isDarkMode ? 'bg-neutral-800' : 'bg-white'} shadow-lg`}>
                            <h3 className={`font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Dernières Actualités</h3>
                            <div className={`p-8 text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                (Flux d'actualités à intégrer ici)
                            </div>
                        </div>
                    );
                default: return null;
            }
        };

        if (!ResponsiveGridLayout) return <div className="p-4 text-center">Chargement de la grille...</div>;

        return (
            <div className={isEditing ? 'border-2 border-emerald-500/30 rounded-xl p-2' : ''}>
                <ResponsiveGridLayout
                    className="layout"
                    layouts={layouts}
                    breakpoints={BREAKPOINTS}
                    cols={COLS}
                    rowHeight={ROW_HEIGHT}
                    onLayoutChange={handleLayoutChange}
                    isDraggable={isEditing}
                    isResizable={isEditing}
                    draggableCancel=".no-drag"
                    margin={[16, 16]}
                >
                    {layouts.lg.map(item => (
                        <div key={item.i} className={isEditing ? 'cursor-move ring-1 ring-emerald-500/50 rounded-xl' : ''}>
                            {renderWidget(item.i)}
                        </div>
                    ))}
                </ResponsiveGridLayout>
            </div>
        );
    };

    window.MarketsEconomyTabRGL = MarketsEconomyTabRGL;
})();
