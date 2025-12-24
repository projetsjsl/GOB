// Auto-converted from monolithic dashboard file
// Component: MarketsEconomyTab



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
    const [selectedSource, setSelectedSource] = useState('all'); // Filtre source
    const [selectedMarket, setSelectedMarket] = useState('all'); // Filtre marché
    const [selectedTheme, setSelectedTheme] = useState('all'); // Filtre thème
    const [localFilteredNews, setLocalFilteredNews] = useState([]);
    const [activeView, setActiveView] = useState('overview'); // 'overview' ou 'screener'

    // Refs pour les widgets TradingView
    const marketOverviewRef = useRef(null);
    const heatmapRef = useRef(null);
    const screenerRef = useRef(null);
    
    // Track which widgets are loaded (lazy loading)
    const [widgetsLoaded, setWidgetsLoaded] = useState({
        marketOverview: false,
        heatmap: false,
        screener: false
    });

    // Listes de filtres
    const sources = ['Bloomberg', 'Reuters', 'WSJ', 'CNBC', 'MarketWatch', 'La Presse', 'Les Affaires'];
    const markets = ['US', 'Canada', 'Europe', 'Asie'];
    const themes = ['Tech', 'Finance', 'Énergie', 'Santé', 'Crypto', 'IA'];

    // ⚡ LAZY LOAD: Market Overview Widget (load first, after 300ms)
    React.useEffect(() => {
        if (!marketOverviewRef.current || widgetsLoaded.marketOverview) return;
        
        const timer = setTimeout(() => {
            if (!marketOverviewRef.current) return;
            
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
            });
            marketOverviewRef.current.appendChild(script);
            setWidgetsLoaded(prev => ({ ...prev, marketOverview: true }));
        }, 300); // Load after 300ms to let React render first
        
        return () => clearTimeout(timer);
    }, [isDarkMode]);

    // ⚡ LAZY LOAD: Heatmap Widget (load second, after 800ms)
    React.useEffect(() => {
        if (!heatmapRef.current || widgetsLoaded.heatmap) return;
        
        const timer = setTimeout(() => {
            if (!heatmapRef.current) return;
            
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
                "symbolUrl": "",
                "colorTheme": isDarkMode ? "dark" : "light",
                "hasTopBar": true,
                "isDataSetEnabled": true,
                "isZoomEnabled": true,
                "hasSymbolTooltip": true,
                "width": "100%",
                "height": "100%"
            });
            heatmapRef.current.appendChild(script);
            setWidgetsLoaded(prev => ({ ...prev, heatmap: true }));
        }, 800); // Load after 800ms (give time for Market Overview)
        
        return () => clearTimeout(timer);
    }, [isDarkMode]);

    // ⚡ LAZY LOAD: Screener Widget (ONLY load when user switches to screener view)
    React.useEffect(() => {
        if (activeView !== 'screener' || !screenerRef.current || widgetsLoaded.screener) return;
        
        // Small delay to let view transition complete
        const timer = setTimeout(() => {
            if (!screenerRef.current) return;
            
            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-screener.js';
            script.async = true;
            script.innerHTML = JSON.stringify({
                "width": "100%",
                "height": "100%",
                "defaultColumn": "overview",
                "defaultScreen": "most_capitalized",
                "market": "america",
                "showToolbar": true,
                "colorTheme": isDarkMode ? "dark" : "light",
                "locale": "fr",
                "isTransparent": false
            });
            screenerRef.current.appendChild(script);
            setWidgetsLoaded(prev => ({ ...prev, screener: true }));
        }, 200);
        
        return () => clearTimeout(timer);
    }, [activeView, isDarkMode]);

    // Fonction pour détecter la source avec variations de noms
    const matchesSource = (articleSource, selectedSource) => {
        if (!articleSource || !selectedSource) return false;
        const source = articleSource.toLowerCase();
        const selected = selectedSource.toLowerCase();
        
        // Mapping des variations de noms de sources
        const sourceVariations = {
            'bloomberg': ['bloomberg', 'bloomberg.com', 'bloomberg news'],
            'reuters': ['reuters', 'reuters.com', 'thomson reuters'],
            'wsj': ['wsj', 'wall street journal', 'the wall street journal', 'wsj.com'],
            'cnbc': ['cnbc', 'cnbc.com'],
            'marketwatch': ['marketwatch', 'marketwatch.com', 'market watch'],
            'la presse': ['la presse', 'lapresse', 'lapresse.ca', 'presse'],
            'les affaires': ['les affaires', 'lesaffaires', 'lesaffaires.com', 'affaires']
        };
        
        // Vérifier correspondance exacte
        if (source.includes(selected) || selected.includes(source)) return true;
        
        // Vérifier les variations
        const variations = sourceVariations[selected];
        if (variations) {
            return variations.some(variation => source.includes(variation));
        }
        
        return false;
    };

    // État pour suivre si les résultats sont exacts ou approximatifs
    const [isApproximateMatch, setIsApproximateMatch] = useState(false);

    // Filtrer les nouvelles à l'affichage avec système de fallback intelligent
    React.useEffect(() => {
        let filtered = newsData;
        let hasExactMatches = true;

        // Appliquer le filtre français si activé
        if (localFrenchOnly) {
            filtered = filtered.filter(article => isFrenchArticle(article));
        }

        // Appliquer le filtre source avec détection flexible
        if (selectedSource !== 'all') {
            const beforeFilter = filtered.length;
            filtered = filtered.filter(article =>
                matchesSource(article.source?.name, selectedSource)
            );
            // Si aucun résultat, essayer un filtrage plus large
            if (filtered.length === 0 && beforeFilter > 0) {
                filtered = newsData.filter(article => {
                    const sourceName = (article.source?.name || '').toLowerCase();
                    const selected = selectedSource.toLowerCase();
                    // Recherche partielle plus large
                    return sourceName.includes(selected) || selected.includes(sourceName);
                });
                hasExactMatches = false;
            }
        }

        // Appliquer le filtre marché (basé sur mots-clés) avec fallback
        if (selectedMarket !== 'all') {
            const marketKeywords = {
                'US': ['u.s.', 'united states', 'american', 'wall street', 'nasdaq', 'dow', 's&p', 'sp500', 'federal reserve', 'fed', 'sec', 'new york', 'nyse', 'us market', 'us economy'],
                'Canada': ['canada', 'canadian', 'toronto', 'tsx', 'montreal', 'quebec', 'ontario', 'alberta', 'vancouver', 'canadian market', 'canadian economy', 'bank of canada', 'boc'],
                'Europe': ['europe', 'european', 'eu', 'ecb', 'london', 'frankfurt', 'paris', 'ftse', 'dax', 'cac', 'eurozone', 'euro', 'uk', 'germany', 'france', 'italy', 'spain'],
                'Asie': ['asia', 'asian', 'china', 'chinese', 'japan', 'japanese', 'tokyo', 'shanghai', 'hong kong', 'nikkei', 'south korea', 'korean', 'singapore', 'india', 'indian', 'taiwan']
            };
            const beforeFilter = filtered.length;
            filtered = filtered.filter(article => {
                const text = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
                return marketKeywords[selectedMarket]?.some(keyword => text.includes(keyword));
            });
            // Si aucun résultat, essayer avec moins de mots-clés
            if (filtered.length === 0 && beforeFilter > 0) {
                const fallbackKeywords = {
                    'US': ['us', 'usa', 'america'],
                    'Canada': ['canada'],
                    'Europe': ['europe', 'eu'],
                    'Asie': ['asia', 'china', 'japan']
                };
                filtered = newsData.filter(article => {
                    const text = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
                    return fallbackKeywords[selectedMarket]?.some(keyword => text.includes(keyword));
                });
                hasExactMatches = false;
            }
        }

        // Appliquer le filtre thème avec fallback
        if (selectedTheme !== 'all') {
            const themeKeywords = {
                'Tech': ['tech', 'technology', 'software', 'cloud', 'apple', 'google', 'microsoft', 'amazon', 'meta', 'tesla', 'nvidia', 'amd', 'intel', 'samsung', 'iphone', 'android', 'ai', 'artificial intelligence'],
                'Finance': ['bank', 'banque', 'finance', 'financial', 'trading', 'investment', 'investor', 'credit', 'loan', 'mortgage', 'interest rate', 'fed', 'central bank', 'stock market', 'equity', 'bond'],
                'Énergie': ['energy', 'oil', 'gas', 'petroleum', 'renewable', 'solar', 'wind', 'nuclear', 'exxon', 'chevron', 'bp', 'shell', 'crude', 'barrel', 'opec'],
                'Santé': ['health', 'healthcare', 'pharma', 'pharmaceutical', 'medical', 'drug', 'medicine', 'vaccine', 'hospital', 'medicare', 'pfizer', 'moderna', 'johnson & johnson'],
                'Crypto': ['crypto', 'cryptocurrency', 'bitcoin', 'btc', 'ethereum', 'eth', 'blockchain', 'coinbase', 'binance', 'crypto market', 'digital currency'],
                'IA': ['ai', 'artificial intelligence', 'machine learning', 'deep learning', 'chatgpt', 'openai', 'nvidia', 'neural network', 'llm', 'large language model']
            };
            const beforeFilter = filtered.length;
            filtered = filtered.filter(article => {
                const text = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
                return themeKeywords[selectedTheme]?.some(keyword => text.includes(keyword));
            });
            // Si aucun résultat, essayer avec mots-clés plus généraux
            if (filtered.length === 0 && beforeFilter > 0) {
                const fallbackKeywords = {
                    'Tech': ['tech', 'technology'],
                    'Finance': ['finance', 'financial', 'bank'],
                    'Énergie': ['energy', 'oil', 'gas'],
                    'Santé': ['health', 'medical'],
                    'Crypto': ['crypto', 'bitcoin'],
                    'IA': ['ai', 'artificial intelligence']
                };
                filtered = newsData.filter(article => {
                    const text = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
                    return fallbackKeywords[selectedTheme]?.some(keyword => text.includes(keyword));
                });
                hasExactMatches = false;
            }
        }

        // Si toujours aucun résultat, afficher toutes les nouvelles avec un message
        if (filtered.length === 0 && newsData.length > 0) {
            filtered = newsData.slice(0, 20); // Limiter à 20 pour éviter la surcharge
            hasExactMatches = false;
        }

        setIsApproximateMatch(!hasExactMatches);
        setLocalFilteredNews(filtered);
    }, [newsData, localFrenchOnly, selectedSource, selectedMarket, selectedTheme]);

    return (
        <div className="space-y-6">



            {/* Header */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className={`text-2xl font-bold transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>📰 Marchés & Économie</h2>
                    <div className="flex gap-2">
                        {/* Toggle Français */}
                        <button title="Action"
                            onClick={() => setLocalFrenchOnly(!localFrenchOnly)}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                                localFrenchOnly
                                    ? 'bg-blue-600 text-white'
                                    : (isDarkMode
                                        ? 'bg-gray-800 hover:bg-gray-700 text-white'
                                        : 'bg-gray-200 hover:bg-gray-300 text-gray-900')
                            }`}
                        >
                            🇫🇷 Français {localFrenchOnly && '✓'}
                        </button>
                        <button
                            onClick={fetchNews}
                            disabled={loading}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 ${
                                isDarkMode
                                    ? 'bg-gray-800 hover:bg-gray-700 text-white'
                                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                            }`}
                        >
                            {loading ? '⏳ Actualisation...' : '🔄 Actualiser'}
                        </button>
                    </div>
                </div>

                {/* Navigation entre les vues */}
                <div className={`flex gap-2 p-1 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <button
                        onClick={() => setActiveView('overview')}
                        className={`flex-1 px-4 py-2 rounded-md font-semibold transition-all duration-300 ${
                            activeView === 'overview'
                                ? isDarkMode
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'bg-blue-500 text-white shadow-md'
                                : isDarkMode
                                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                        }`}
                    >
                        📊 Vue d'ensemble
                    </button>
                    <button
                        onClick={() => setActiveView('screener')}
                        className={`flex-1 px-4 py-2 rounded-md font-semibold transition-all duration-300 ${
                            activeView === 'screener'
                                ? isDarkMode
                                    ? 'bg-purple-600 text-white shadow-lg'
                                    : 'bg-purple-500 text-white shadow-md'
                                : isDarkMode
                                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                        }`}
                    >
                        🚀 Screener - Top Gainers & Losers
                    </button>
                </div>
            </div>

            {lastUpdate && (
                <p className="text-gray-400 text-sm">
                    Dernière mise à jour: {new Date(lastUpdate).toLocaleString('fr-FR')}
                </p>
            )}

            {/* ===== WIDGETS TRADING VIEW VISUELS ===== */}
            {activeView === 'overview' ? (
                <div className="grid grid-cols-1 gap-6 mt-6">
                    {/* Market Overview Widget */}
                    <div className={`rounded-xl overflow-hidden border-2 transition-colors duration-300 ${
                        isDarkMode
                            ? 'bg-gray-800/50 border-blue-500/30'
                            : 'bg-white border-blue-400/40'
                    }`}>
                        <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <h3 className={`text-lg font-bold transition-colors duration-300 ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                                📊 Vue d'ensemble des Marchés (Temps Réel)
                            </h3>
                            <p className={`text-sm transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                                Indices majeurs, Forex, Crypto - Données en direct
                            </p>
                        </div>
                        <div ref={marketOverviewRef} style={{height: '400px'}}>
                            {/* Loading placeholder - hidden once widget loads */}
                            {!widgetsLoaded.marketOverview && (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Chargement du widget...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stock Heatmap Widget */}
                    <div className={`rounded-xl overflow-hidden border-2 transition-colors duration-300 ${
                        isDarkMode
                            ? 'bg-gray-800/50 border-green-500/30'
                            : 'bg-white border-green-400/40'
                    }`}>
                        <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <h3 className={`text-lg font-bold transition-colors duration-300 ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                                🔥 Heatmap Boursière
                            </h3>
                            <p className={`text-sm transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                                Visualisation des performances par secteur
                            </p>
                        </div>
                        <div ref={heatmapRef} style={{height: '500px'}}>
                            {!widgetsLoaded.heatmap && (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Chargement de la heatmap...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="mt-6">
                    {/* Screener Widget - Top Gainers/Losers - Vue dédiée */}
                    <div className={`rounded-xl overflow-hidden border-2 transition-colors duration-300 ${
                        isDarkMode
                            ? 'bg-gray-800/50 border-purple-500/30'
                            : 'bg-white border-purple-400/40'
                    }`}>
                        <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <h3 className={`text-lg font-bold transition-colors duration-300 ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                                🚀 Screener - Top Gainers & Losers
                            </h3>
                            <p className={`text-sm transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                                Actions les plus performantes et en baisse
                            </p>
                        </div>
                        <div ref={screenerRef} style={{height: '700px'}}>
                            {!widgetsLoaded.screener && (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Chargement du screener...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Statistiques */}
            <div className={`p-4 rounded-xl transition-colors duration-300 ${
                isDarkMode
                    ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700'
                    : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
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
                isDarkMode
                    ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700'
                    : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
            }`}>
                <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    🔍 Filtres
                </h3>

                {/* Filtre Source */}
                <div className="mb-4">
                    <label className={`text-sm font-semibold mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        📰 Source
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedSource('all')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                selectedSource === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                            }`}
                        >
                            Toutes
                        </button>
                        {sources.map(source => (
                            <button
                                key={source}
                                onClick={() => setSelectedSource(source)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                    selectedSource === source
                                        ? 'bg-blue-600 text-white'
                                        : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                                }`}
                            >
                                {source}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filtre Marché */}
                <div className="mb-4">
                    <label className={`text-sm font-semibold mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        🌍 Marché
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedMarket('all')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                selectedMarket === 'all'
                                    ? 'bg-green-600 text-white'
                                    : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                            }`}
                        >
                            Tous
                        </button>
                        {markets.map(market => (
                            <button
                                key={market}
                                onClick={() => setSelectedMarket(market)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                    selectedMarket === market
                                        ? 'bg-green-600 text-white'
                                        : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                                }`}
                            >
                                {market}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filtre Thème */}
                <div>
                    <label className={`text-sm font-semibold mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        🏷️ Thématique
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedTheme('all')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                selectedTheme === 'all'
                                    ? 'bg-purple-600 text-white'
                                    : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                            }`}
                        >
                            Toutes
                        </button>
                        {themes.map(theme => (
                            <button
                                key={theme}
                                onClick={() => setSelectedTheme(theme)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                    selectedTheme === theme
                                        ? 'bg-purple-600 text-white'
                                        : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                                }`}
                            >
                                {theme}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Message informatif pour les résultats approximatifs */}
                {isApproximateMatch && localFilteredNews.length > 0 && (
                    <div className={`mt-4 p-4 rounded-lg border-2 ${
                        isDarkMode
                            ? 'bg-yellow-900/20 border-yellow-600/50 text-yellow-200'
                            : 'bg-yellow-50 border-yellow-300 text-yellow-800'
                    }`}>
                        <div className="flex items-start gap-3">
                            <span className="text-xl">💡</span>
                            <div>
                                <p className="font-semibold mb-1">Résultats similaires affichés</p>
                                <p className="text-sm">
                                    Aucun résultat exact trouvé pour les filtres sélectionnés. Nous affichons des articles similaires qui pourraient vous intéresser.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Liste des nouvelles */}
            <div className="space-y-4">
                {localFilteredNews.length === 0 ? (
                    <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <LucideIcon name="AlertCircle" className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-semibold mb-2">
                            {localFrenchOnly ? 'Aucun article en français trouvé' : 'Aucune nouvelle disponible'}
                        </p>
                        <p className="text-sm">
                            {localFrenchOnly
                                ? 'Essayez de désactiver le filtre français ou actualisez les données'
                                : 'Cliquez sur Actualiser pour charger les dernières nouvelles'}
                        </p>
                    </div>
                ) : (
                    localFilteredNews.map((article, index) => {
                        const newsIconData = getNewsIcon(article.title, article.description, article.sentiment);
                        const credibility = getSourceCredibility(article.source?.name);

                        return (
                            <div
                                key={index}
                                className={`p-6 rounded-xl transition-all duration-300 hover:scale-[1.01] ${
                                    isDarkMode
                                        ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 hover:border-gray-600'
                                        : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Icône */}
                                    <div className={`p-3 rounded-full transition-colors duration-300 ${
                                        isDarkMode ? 'bg-gray-700/50' : 'bg-gray-200/60'
                                    }`}>
                                        <LucideIcon name={newsIconData.icon} className={`w-6 h-6 ${newsIconData.color}`} />
                                    </div>

                                    {/* Contenu */}
                                    <div className="flex-1">
                                        {/* Titre */}
                                        <h3 className={`font-bold text-lg mb-2 transition-colors duration-300 ${
                                            isDarkMode ? 'text-white' : 'text-gray-900'
                                        }`}>
                                            {article.url ? (
                                                <a
                                                    href={article.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`hover:underline transition-colors duration-300 ${
                                                        isDarkMode
                                                            ? 'text-blue-300 hover:text-blue-200'
                                                            : 'text-blue-600 hover:text-blue-700'
                                                    }`}
                                                >
                                                    {cleanText(article.title)}
                                                </a>
                                            ) : (
                                                cleanText(article.title)
                                            )}
                                        </h3>

                                        {/* Description */}
                                        <p className={`text-base mb-4 leading-relaxed transition-colors duration-300 ${
                                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                        }`}>
                                            {cleanText(article.description)}
                                        </p>

                                        {/* Métadonnées */}
                                        <div className="flex items-center gap-4 flex-wrap">
                                            {/* Source avec badge de crédibilité */}
                                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full transition-colors duration-300 ${
                                                credibility >= 100
                                                    ? 'bg-purple-500/20 text-purple-500 border border-purple-500/30'
                                                    : credibility >= 85
                                                    ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30'
                                                    : credibility >= 75
                                                    ? 'bg-green-500/20 text-green-500 border border-green-500/30'
                                                    : (isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700')
                                            }`}>
                                                {credibility >= 100 && <span className="text-xs">⭐</span>}
                                                <span className="text-xs font-semibold">{article.source?.name || 'Source inconnue'}</span>
                                            </div>

                                            {/* Date */}
                                            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {new Date(article.publishedAt || article.publishedDate).toLocaleString('fr-FR')}
                                            </span>

                                            {/* Badge français */}
                                            {isFrenchArticle(article) && (
                                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-500 border border-blue-500/30">
                                                    🇫🇷 FR
                                                </span>
                                            )}

                                            {/* Bouton Résumé avec Emma */}
                                            {article.url && (
                                                <button
                                                    onClick={() => summarizeWithEmma(article.url, article.title)}
                                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 ${
                                                        isDarkMode
                                                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white'
                                                            : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white'
                                                    }`}
                                                >
                                                    <span className="flex items-center gap-1">
                                                        <LucideIcon name="Brain" className="w-3 h-3" />
                                                        Résumé avec Emma
                                                    </span>
                                                </button>
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
    );
};

window.MarketsEconomyTab = MarketsEconomyTab;