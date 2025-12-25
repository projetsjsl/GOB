
// AdvancedAnalysisTab.js
// A clean, standalone component for the new advanced financial tools

const { useState, useEffect } = React;
const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, AreaChart, Area } = window.Recharts || {};

const AdvancedAnalysisTab = ({ isDarkMode }) => {
    // Lazy Loader Fallback
    const LazyWidgetWrapper = window.LazyWidgetWrapper || (({ children }) => <>{children}</>);

    // Watchlist / Team tickers (loaded from Supabase)
    const [watchlistTickers, setWatchlistTickers] = useState([]);
    const [watchlistLoaded, setWatchlistLoaded] = useState(false);

    // Selected stock and data
    const [selectedStock, setSelectedStock] = useState('AAPL');
    const [stockData, setStockData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Modal States
    const [showPeerComparison, setShowPeerComparison] = useState(false);
    const [showScenarioAnalysis, setShowScenarioAnalysis] = useState(false);
    const [showAdvancedScreener, setShowAdvancedScreener] = useState(false);
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);

    // New Modal States for enhanced features
    const [showAIAnalysisModal, setShowAIAnalysisModal] = useState(false);
    const [showNewsModal, setShowNewsModal] = useState(false);
    const [showAnalystModal, setShowAnalystModal] = useState(false);
    const [showEarningsModal, setShowEarningsModal] = useState(false);
    const [showEconomicModal, setShowEconomicModal] = useState(false);
    const [showWatchlistScreenerModal, setShowWatchlistScreenerModal] = useState(false);

    // NEW: Enhanced Data States (Restoring missing state)
    const [aiAnalysis, setAIAnalysis] = useState(null);
    const [newsData, setNewsData] = useState([]);
    const [earningsData, setEarningsData] = useState(null);
    const [analystData, setAnalystData] = useState(null);
    const [loadingAI, setLoadingAI] = useState(false);
    const [loadingNews, setLoadingNews] = useState(false);

    // Caching System
    const cacheRef = React.useRef(new Map());
    const CACHE_TTL = {
        quote: 5 * 60 * 1000,
        fundamentals: 60 * 60 * 1000,
        news: 10 * 60 * 1000,
        ai: 30 * 60 * 1000
    };

    // Load watchlist from Supabase on mount
    useEffect(() => {
        if (watchlistLoaded) return;

        const loadWatchlistFromSupabase = async () => {
            try {
                void('📥 Loading watchlist from Supabase...');
                const res = await fetch('/api/supabase-watchlist');
                if (res.ok) {
                    const json = await res.json();
                    const tickers = Array.isArray(json.tickers) ? json.tickers : [];
                    void('✅ Watchlist loaded from Supabase:', tickers);

                    const merged = Array.isArray(json.teamTickers) && json.teamTickers.length > 0
                        ? Array.from(new Set([...tickers, ...json.teamTickers]))
                        : tickers;

                    setWatchlistTickers(merged);

                    // Set first ticker as selected if available
                    if (merged.length > 0 && !selectedStock) {
                        setSelectedStock(merged[0]);
                    }

                    setWatchlistLoaded(true);
                    return;
                }
            } catch (e) {
                void('⚠️ Supabase not available, using default tickers');
            }

            // Fallback to default tickers if Supabase fails
            const defaultTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META'];
            setWatchlistTickers(defaultTickers);
            setSelectedStock(defaultTickers[0]);
            setWatchlistLoaded(true);
        };

        loadWatchlistFromSupabase();
    }, []);

    // Load stock data when selected stock changes
    useEffect(() => {
        if (selectedStock) {
            fetchData(selectedStock);
        }
    }, [selectedStock]);

    // Cache helper functions
    const getFromCache = (key, ttl) => {
        const cached = cacheRef.current.get(key);
        if (cached && (Date.now() - cached.timestamp) < ttl) {
            void(`📦 Cache hit: ${key}`);
            return cached.data;
        }
        return null;
    };

    const setCache = (key, data, ttl) => {
        cacheRef.current.set(key, { data, timestamp: Date.now() });
    };

    // Comprehensive data fetching
    const fetchData = async (symbol) => {
        setLoading(true);
        const API_BASE_URL = window.location.origin || '';
        
        try {
            // Check cache first
            const cacheKey = `comprehensive_${symbol}`;
            const cached = getFromCache(cacheKey, CACHE_TTL.quote);
            if (cached) {
                setStockData(cached.stockData);
                setNewsData(cached.newsData || []);
                setEarningsData(cached.earningsData);
                setAnalystData(cached.analystData);
                setLoading(false);
                return;
            }

            // Fetch comprehensive data in parallel
            const [quoteRes, fundamentalsRes, newsRes, earningsRes, analystRes] = await Promise.allSettled([
                fetch(`${API_BASE_URL}/api/marketdata?endpoint=quote&symbol=${symbol}&source=auto`),
                fetch(`${API_BASE_URL}/api/marketdata?endpoint=fundamentals&symbol=${symbol}&source=auto`),
                fetch(`${API_BASE_URL}/api/fmp?endpoint=ticker-news&symbol=${symbol}`),
                fetch(`${API_BASE_URL}/api/fmp?endpoint=earnings-calendar&symbol=${symbol}`),
                fetch(`${API_BASE_URL}/api/marketdata?endpoint=analyst&symbol=${symbol}`)
            ]);

            const quoteData = quoteRes.status === 'fulfilled' && quoteRes.value.ok ? await quoteRes.value.json() : null;
            const fundamentalsData = fundamentalsRes.status === 'fulfilled' && fundamentalsRes.value.ok ? await fundamentalsRes.value.json() : null;
            const newsResponse = newsRes.status === 'fulfilled' && newsRes.value.ok ? await newsRes.value.json() : null;
            const earningsResponse = earningsRes.status === 'fulfilled' && earningsRes.value.ok ? await earningsRes.value.json() : null;
            const analystResponse = analystRes.status === 'fulfilled' && analystRes.value.ok ? await analystRes.value.json() : null;

            void('✅ Comprehensive data loaded for', symbol);

            const newStockData = {
                symbol: symbol,
                price: quoteData?.c || fundamentalsData?.quote?.price || 0,
                change: quoteData?.d || fundamentalsData?.quote?.change || 0,
                changePercent: quoteData?.dp || fundamentalsData?.quote?.changesPercentage || 0,
                high: quoteData?.h || 0,
                low: quoteData?.l || 0,
                open: quoteData?.o || 0,
                previousClose: quoteData?.pc || 0,
                profile: fundamentalsData?.profile || null,
                ratios: fundamentalsData?.ratios || null,
                metrics: fundamentalsData?.metrics || null,
                quote: {
                    price: quoteData?.c || fundamentalsData?.quote?.price || 0,
                    change: quoteData?.d || fundamentalsData?.quote?.change || 0,
                    changesPercentage: quoteData?.dp || fundamentalsData?.quote?.changesPercentage || 0
                },
                source: quoteData?.source || 'api',
                timestamp: new Date().toISOString()
            };

            const newNewsData = newsResponse?.data || newsResponse?.news || [];
            const newEarningsData = earningsResponse?.data || earningsResponse;
            const newAnalystData = analystResponse?.data || analystResponse;

            setStockData(newStockData);
            setNewsData(newNewsData.slice(0, 10)); // Top 10 news
            setEarningsData(newEarningsData);
            setAnalystData(newAnalystData);

            // Cache the results
            setCache(cacheKey, {
                stockData: newStockData,
                newsData: newNewsData.slice(0, 10),
                earningsData: newEarningsData,
                analystData: newAnalystData
            }, CACHE_TTL.quote);

        } catch (error) {
            console.error('❌ Error fetching data for', symbol, error);
            setStockData({
                symbol: symbol,
                price: 0,
                change: 0,
                changePercent: 0,
                quote: { price: 0, change: 0, changesPercentage: 0 }
            });
        } finally {
            setLoading(false);
        }
    };

    // AI Analysis function
    const fetchAIAnalysis = async (symbol) => {
        const API_BASE_URL = window.location.origin || '';
        const cacheKey = `ai_${symbol}`;
        
        // Check cache
        const cached = getFromCache(cacheKey, CACHE_TTL.ai);
        if (cached) {
            setAIAnalysis(cached);
            return;
        }

        setLoadingAI(true);
        try {
            const prompt = `Analyze ${symbol} stock. Provide:
            1. Investment Thesis (2-3 sentences)
            2. Key Risks (3 bullet points)
            3. Price Target Range (low-high)
            4. Recommendation (Buy/Hold/Sell)
            
            Stock Data: Price $${stockData?.price || 'N/A'}, P/E ${stockData?.ratios?.peRatioTTM || 'N/A'}, 
            Sector: ${stockData?.profile?.sector || 'N/A'}
            
            Format as JSON: {thesis, risks:[], targetLow, targetHigh, recommendation, confidence}`;

            const response = await fetch(`${API_BASE_URL}/api/ai-services`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service: 'perplexity',
                    prompt,
                    section: 'analysis',
                    recency: 'day'
                })
            });

            if (response.ok) {
                const data = await response.json();
                const analysis = {
                    content: data.content,
                    model: data.model,
                    timestamp: new Date().toISOString()
                };
                setAIAnalysis(analysis);
                setCache(cacheKey, analysis, CACHE_TTL.ai);
            }
        } catch (error) {
            console.error('❌ AI Analysis error:', error);
        } finally {
            setLoadingAI(false);
        }
    };

    // ----------------------------------------------------------------------
    // WIDGET INTEGRATION
    // ----------------------------------------------------------------------
    const chartContainerRef = React.useRef(null);
    const financialsContainerRef = React.useRef(null);
    const techAnalysisContainerRef = React.useRef(null);
    const timelineContainerRef = React.useRef(null);
    const profileContainerRef = React.useRef(null);

    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'chart', 'financials', 'analysis', 'timeline'

    // 1. Advanced Chart Widget
    useEffect(() => {
        if (activeTab !== 'chart' || !chartContainerRef.current) return;
        const container = chartContainerRef.current;
        container.innerHTML = '';
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
        script.type = 'text/javascript';
        script.async = true;
        script.innerHTML = JSON.stringify({
            allow_symbol_change: true,
            calendar: false,
            details: true,
            hide_side_toolbar: false,
            hide_top_toolbar: false,
            hide_legend: false,
            hide_volume: false,
            hotlist: false,
            interval: 'D',
            locale: 'fr',
            save_image: true,
            style: '3',
            symbol: selectedStock,
            theme: isDarkMode ? 'dark' : 'light',
            timezone: 'America/Toronto',
            backgroundColor: isDarkMode ? '#0F0F0F' : '#FFFFFF',
            gridColor: 'rgba(242, 242, 242, 0.06)',
            watchlist: [
                'FOREXCOM:SPXUSD',
                'FOREXCOM:NSXUSD',
                'FOREXCOM:DJI',
                'NASDAQ:AAPL',
                'NASDAQ:MSFT',
                'NASDAQ:GOOGL',
                'NASDAQ:AMZN',
                'NASDAQ:NVDA',
                'NASDAQ:TSLA',
                'NASDAQ:META',
                'BITSTAMP:BTCUSD',
                'BITSTAMP:ETHUSD',
                'NYSE:JPM',
                'NYSE:BAC',
                'NYSE:GS'
            ],
            withdateranges: true,
            range: 'YTD',
            compareSymbols: [],
            show_popup_button: true,
            popup_height: '800',
            popup_width: '1200',
            studies: [
                'STD;Smoothed%1Moving%1Average',
                'STD;RSI'
            ],
            width: '100%',
            height: 800
        });
        container.appendChild(script);
        return () => { if (container) container.innerHTML = ''; };
    }, [activeTab, selectedStock, isDarkMode]);

    // 2. Financials & Profile Widgets
    useEffect(() => {
        if (activeTab !== 'financials') return;
        
        // Financials
        if (financialsContainerRef.current) {
            const container = financialsContainerRef.current;
            container.innerHTML = '';
            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-financials.js';
            script.type = 'text/javascript';
            script.async = true;
            script.innerHTML = JSON.stringify({
                symbol: selectedStock,
                colorTheme: isDarkMode ? 'dark' : 'light',
                isTransparent: false,
                displayMode: 'regular',
                locale: 'fr',
                width: '100%',
                height: 500
            });
            container.appendChild(script);
        }

        // Profile
        if (profileContainerRef.current) {
            const container = profileContainerRef.current;
            container.innerHTML = '';
            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js';
            script.type = 'text/javascript';
            script.async = true;
            script.innerHTML = JSON.stringify({
                symbol: selectedStock,
                colorTheme: isDarkMode ? 'dark' : 'light',
                isTransparent: false,
                locale: 'fr',
                width: '100%',
                height: 400
            });
            container.appendChild(script);
        }

        
        return () => {
            if (financialsContainerRef.current) financialsContainerRef.current.innerHTML = '';
            if (profileContainerRef.current) profileContainerRef.current.innerHTML = '';
        };
    }, [activeTab, selectedStock, isDarkMode]);

    // 3. Technical Analysis Widget
    useEffect(() => {
        if (activeTab !== 'analysis' || !techAnalysisContainerRef.current) return;
        const container = techAnalysisContainerRef.current;
        container.innerHTML = '';
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js';
        script.type = 'text/javascript';
        script.async = true;
        script.innerHTML = JSON.stringify({
            symbol: selectedStock,
            colorTheme: isDarkMode ? 'dark' : 'light',
            isTransparent: false,
            locale: 'fr',
            interval: '1D',
            width: '100%',
            height: 500
        });
        container.appendChild(script);
        return () => { if (container) container.innerHTML = ''; };
    }, [activeTab, selectedStock, isDarkMode]);

    // 4. Timeline Widget
    useEffect(() => {
        if (activeTab !== 'timeline' || !timelineContainerRef.current) return;
        
        const container = timelineContainerRef.current;
        container.innerHTML = '';
        
        // Construct fully qualified symbol if possible to resolve "No data here yet"
        let widgetSymbol = selectedStock;
        if (stockData && stockData.profile && stockData.profile.exchangeShortName) {
            // Map FMP exchange names to TradingView if necessary
            let exchange = stockData.profile.exchangeShortName;
            if (exchange === 'NAS') exchange = 'NASDAQ';
            if (exchange === 'NYS') exchange = 'NYSE';
            
            widgetSymbol = `${exchange}:${selectedStock}`;
        } else if (['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'NFLX'].includes(selectedStock)) {
            // Fallback for common tech stocks if profile not yet loaded
             widgetSymbol = `NASDAQ:${selectedStock}`;
        }

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-timeline.js';
        script.type = 'text/javascript';
        script.async = true;
        script.innerHTML = JSON.stringify({
            feedMode: 'symbol',
            symbol: widgetSymbol,
            colorTheme: isDarkMode ? 'dark' : 'light',
            isTransparent: false,
            displayMode: 'regular',
            locale: 'fr',
            width: '100%',
            height: 600
        });
        container.appendChild(script);
        return () => { if (container) container.innerHTML = ''; };
    }, [activeTab, selectedStock, isDarkMode, stockData?.profile?.exchangeShortName]);

    return (
        <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-neutral-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>




            {/* Header */}
            <div className="mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                        Analyse Financière Pro 🚀
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Plateforme unifiée d'analyse technique et fondamentale
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
                    {/* Navigation Tabs */}
                    <div className="flex bg-gray-800 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
                        {[
                            { id: 'dashboard', label: 'Dashboard', icon: 'iconoir-view-grid' },
                            { id: 'chart', label: 'Graphique', icon: 'iconoir-candlestick-chart' },
                            { id: 'financials', label: 'Finances', icon: 'iconoir-reports' },
                            { id: 'analysis', label: 'Technique', icon: 'iconoir-stats-report' },
                            { id: 'timeline', label: 'Timeline', icon: 'iconoir-calendar' }
                        ].map(tab => (
                            <button title="Action"
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                                    activeTab === tab.id
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                }`}
                            >
                                <i className={`${tab.icon} text-lg`}></i>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Stock Selector */}
                    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden min-w-[150px]">
                        <select
                            value={selectedStock}
                            onChange={(e) => setSelectedStock(e.target.value)}
                            className="bg-gray-800 text-white font-bold px-4 py-2 outline-none cursor-pointer hover:bg-gray-700 transition-colors w-full"
                            disabled={loading}
                        >
                            {watchlistTickers.length > 0 ? (
                                watchlistTickers.map(ticker => (
                                    <option key={ticker} value={ticker}>{ticker}</option>
                                ))
                            ) : (
                                <option value="AAPL">AAPL</option>
                            )}
                        </select>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            {activeTab === 'dashboard' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                    {/* 1. Analyse Approfondie (Main Card) */}
                    <div
                        onClick={() => setShowAnalysisModal(true)}
                        className="col-span-1 md:col-span-2 lg:col-span-3 bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-500/30 rounded-xl p-6 cursor-pointer hover:border-blue-400 transition-all hover:shadow-lg hover:shadow-blue-500/10 group"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <i className="iconoir-stats-report text-blue-400 text-3xl"></i>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1">Analyse Approfondie Complète</h3>
                                    <p className="text-gray-400 text-sm max-w-xl">
                                        Accédez au rapport complet : DCF, États Financiers, Ratios, et Analyse IA.
                                        Le centre de commande pour vos décisions d'investissement.
                                    </p>
                                </div>
                            </div>
                            <div className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2">
                                Ouvrir <i className="iconoir-arrow-right"></i>
                            </div>
                        </div>
                    </div>

                    {/* 2. Comparaison Multi-Titres */}
                    <div
                        onClick={() => setShowPeerComparison(true)}
                        className="bg-gradient-to-br from-emerald-900/20 to-teal-900/20 border border-emerald-700/30 rounded-xl p-6 cursor-pointer hover:border-emerald-500 transition-all hover:shadow-lg hover:shadow-emerald-500/10 group"
                    >
                        <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <i className="iconoir-group text-emerald-400 text-2xl"></i>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Comparaison Pairs</h3>
                        <p className="text-gray-400 text-sm">
                            Comparez {selectedStock} avec ses concurrents directs sur plus de 10 métriques clés.
                        </p>
                    </div>

                    {/* 3. Analyse de Scénarios */}
                    <div
                        onClick={() => setShowScenarioAnalysis(true)}
                        className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-700/30 rounded-xl p-6 cursor-pointer hover:border-purple-500 transition-all hover:shadow-lg hover:shadow-purple-500/10 group"
                    >
                        <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <i className="iconoir-graph-up text-purple-400 text-2xl"></i>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Simulateur de Scénarios</h3>
                        <p className="text-gray-400 text-sm">
                            Modélisation DCF interactive. Testez vos hypothèses (Optimiste, Base, Pessimiste).
                        </p>
                    </div>

                    {/* 4. Screener Avancé */}
                    <div
                        onClick={() => setShowAdvancedScreener(true)}
                        className="bg-gradient-to-br from-orange-900/20 to-red-900/20 border border-orange-700/30 rounded-xl p-6 cursor-pointer hover:border-orange-500 transition-all hover:shadow-lg hover:shadow-orange-500/10 group"
                    >
                        <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <i className="iconoir-filter text-orange-400 text-2xl"></i>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Screener Avancé</h3>
                        <p className="text-gray-400 text-sm">
                            Trouvez les pépites du marché avec des filtres personnalisés et des préréglages.
                        </p>
                    </div>

                    {/* 5. AI Stock Analysis */}
                    <div
                        onClick={() => setShowAIAnalysisModal(true)}
                        className="bg-gradient-to-br from-violet-900/20 to-fuchsia-900/20 border border-violet-700/30 rounded-xl p-6 cursor-pointer hover:border-violet-500 transition-all hover:shadow-lg hover:shadow-violet-500/10 group"
                    >
                        <div className="w-12 h-12 rounded-lg bg-violet-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <i className="iconoir-brain text-violet-400 text-2xl"></i>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">AI Stock Analysis</h3>
                        <p className="text-gray-400 text-sm">
                            Analyse pilotée par IA : thèse d'investissement, risques, valorisation et recommandation.
                        </p>
                    </div>

                    {/* 6. News & Sentiment */}
                    <div
                        onClick={() => setShowNewsModal(true)}
                        className="bg-gradient-to-br from-amber-900/20 to-yellow-900/20 border border-amber-700/30 rounded-xl p-6 cursor-pointer hover:border-amber-500 transition-all hover:shadow-lg hover:shadow-amber-500/10 group"
                    >
                        <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <i className="iconoir-newspaper text-amber-400 text-2xl"></i>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">News & Sentiment</h3>
                        <p className="text-gray-400 text-sm">
                            Actualités en temps réel avec analyse de sentiment IA et impact sur le cours.
                        </p>
                    </div>

                    {/* 7. Analyst Consensus */}
                    <div
                        onClick={() => setShowAnalystModal(true)}
                        className="bg-gradient-to-br from-lime-900/20 to-green-900/20 border border-lime-700/30 rounded-xl p-6 cursor-pointer hover:border-lime-500 transition-all hover:shadow-lg hover:shadow-lime-500/10 group"
                    >
                        <div className="w-12 h-12 rounded-lg bg-lime-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <i className="iconoir-community text-lime-400 text-2xl"></i>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Analyst Consensus</h3>
                        <p className="text-gray-400 text-sm">
                            Consensus des analystes : EPS, revenus, recommandations Buy/Hold/Sell.
                        </p>
                    </div>

                    {/* 8. Earnings Calendar */}
                    <div
                        onClick={() => setShowEarningsModal(true)}
                        className="bg-gradient-to-br from-rose-900/20 to-pink-900/20 border border-rose-700/30 rounded-xl p-6 cursor-pointer hover:border-rose-500 transition-all hover:shadow-lg hover:shadow-rose-500/10 group"
                    >
                        <div className="w-12 h-12 rounded-lg bg-rose-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <i className="iconoir-calendar text-rose-400 text-2xl"></i>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Earnings Calendar</h3>
                        <p className="text-gray-400 text-sm">
                            Prochaine date d'earnings, estimations et historique des surprises.
                        </p>
                    </div>

                    {/* 9. Economic Events */}
                    <div
                        onClick={() => setShowEconomicModal(true)}
                        className="bg-gradient-to-br from-sky-900/20 to-indigo-900/20 border border-sky-700/30 rounded-xl p-6 cursor-pointer hover:border-sky-500 transition-all hover:shadow-lg hover:shadow-sky-500/10 group"
                    >
                        <div className="w-12 h-12 rounded-lg bg-sky-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <i className="iconoir-globe text-sky-400 text-2xl"></i>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Economic Events</h3>
                        <p className="text-gray-400 text-sm">
                            Calendrier économique (7j) avec analyse d'impact sur vos titres.
                        </p>
                    </div>

                    {/* 10. Watchlist Screener */}
                    <div
                        onClick={() => setShowWatchlistScreenerModal(true)}
                        className="bg-gradient-to-br from-teal-900/20 to-cyan-900/20 border border-teal-700/30 rounded-xl p-6 cursor-pointer hover:border-teal-500 transition-all hover:shadow-lg hover:shadow-teal-500/10 group"
                    >
                        <div className="w-12 h-12 rounded-lg bg-teal-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <i className="iconoir-search text-teal-400 text-2xl"></i>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Watchlist Screener</h3>
                        <p className="text-gray-400 text-sm">
                            Classement IA de votre watchlist avec scores de buy et opportunités.
                        </p>
                    </div>

                    {/* 11. Export PDF */}
                    <div
                        onClick={async () => {
                            if (stockData && window.PDFExporter) {
                                await window.PDFExporter.generateAnalysisReport(selectedStock, {
                                    currentPrice: stockData.price || 0,
                                    fairValue: stockData.metrics?.dcf || stockData.metrics?.enterpriseValue || 0,
                                    upside: stockData.metrics?.dcf ? ((stockData.metrics.dcf - stockData.price) / stockData.price * 100) : 0,
                                    recommendation: 'BUY', // Could be calculated based on upside
                                    metrics: stockData.metrics || {},
                                    ratios: stockData.ratios || {},
                                    profile: stockData.profile || {},
                                    aiInsights: {
                                        strengths: ['Strong Revenue Growth', 'High ROE'],
                                        weaknesses: ['High Valuation']
                                    }
                                });
                            } else {
                                console.log('Alert suppressed:', 'Données non disponibles pour l\'export. Veuillez d\'abord charger les données du titre.');
                            }
                        }}
                        className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-700/30 rounded-xl p-6 cursor-pointer hover:border-cyan-500 transition-all hover:shadow-lg hover:shadow-cyan-500/10 group"
                    >
                        <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <i className="iconoir-page text-cyan-400 text-2xl"></i>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Export Rapport PDF</h3>
                        <p className="text-gray-400 text-sm">
                            Générez un rapport professionnel complet prêt à être partagé ou imprimé.
                        </p>
                    </div>
                </div>
            )}

            {/* Chart View */}
            {activeTab === 'chart' && (
                <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 animate-fade-in">
                    <LazyWidgetWrapper threshold={0.5} height={700}>
                        <div className="tradingview-widget-container h-[700px]" ref={chartContainerRef}></div>
                    </LazyWidgetWrapper>
                </div>
            )}

            {/* Financials View */}
            {activeTab === 'financials' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-gray-800 rounded-xl overflow-hidden border border-gray-700 h-[500px]">
                            <div className="p-4 border-b border-gray-700 font-bold">États Financiers</div>
                            <LazyWidgetWrapper threshold={0.5} height={440}>
                                <div className="tradingview-widget-container h-full" ref={financialsContainerRef}></div>
                            </LazyWidgetWrapper>
                        </div>
                        <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 h-[500px]">
                            <div className="p-4 border-b border-gray-700 font-bold">Profil Société</div>
                            <LazyWidgetWrapper threshold={0.5} height={440}>
                                <div className="tradingview-widget-container h-full" ref={profileContainerRef}></div>
                            </LazyWidgetWrapper>
                        </div>
                    </div>
                </div>
            )}

            {/* Technical Analysis View */}
            {activeTab === 'analysis' && (
                <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 animate-fade-in h-[600px]">
                     <LazyWidgetWrapper threshold={0.5} height={600}>
                        <div className="tradingview-widget-container h-full" ref={techAnalysisContainerRef}></div>
                     </LazyWidgetWrapper>
                </div>
            )}

            {/* Timeline View */}
            {activeTab === 'timeline' && (
                <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 animate-fade-in h-[700px]">
                     <LazyWidgetWrapper threshold={0.5} height={700}>
                        <div className="tradingview-widget-container h-full" ref={timelineContainerRef}></div>
                     </LazyWidgetWrapper>
                </div>
            )}

            {/* Modals Rendering */}
            {showPeerComparison && window.PeerComparisonModal && (
                <window.PeerComparisonModal
                    symbols={[selectedStock, ...watchlistTickers.filter(t => t !== selectedStock).slice(0, 4)]}
                    onClose={() => setShowPeerComparison(false)}
                />
            )}

            {showScenarioAnalysis && window.ScenarioAnalysisModal && (
                <window.ScenarioAnalysisModal
                    symbol={selectedStock}
                    currentPrice={stockData?.price || 0}
                    baselineData={{
                        latestFCF: stockData?.metrics?.fcf || 10000000000,
                        netDebt: stockData?.metrics?.netDebt || 5000000000,
                        sharesOutstanding: stockData?.metrics?.sharesOutstanding || stockData?.profile?.sharesOutstanding || 1000000000,
                        avgGrowth: 15
                    }}
                    onClose={() => setShowScenarioAnalysis(false)}
                />
            )}

            {showAdvancedScreener && window.AdvancedScreenerModal && (
                <window.AdvancedScreenerModal
                    onClose={() => setShowAdvancedScreener(false)}
                    onSelectStock={(symbol) => {
                        setSelectedStock(symbol);
                        setShowAdvancedScreener(false);
                    }}
                />
            )}

            {showAnalysisModal && window.StockAnalysisModal && (
                <window.StockAnalysisModal
                    symbol={selectedStock}
                    currentPrice={stockData?.price || 0}
                    onClose={() => setShowAnalysisModal(false)}
                />
            )}

            {/* New Enhanced Modals */}
            {showAIAnalysisModal && window.AIStockAnalysisModal && (
                <window.AIStockAnalysisModal
                    symbol={selectedStock}
                    stockData={stockData}
                    aiAnalysis={aiAnalysis}
                    onClose={() => setShowAIAnalysisModal(false)}
                />
            )}

            {showNewsModal && window.NewsAndSentimentModal && (
                <window.NewsAndSentimentModal
                    symbol={selectedStock}
                    stockData={stockData}
                    newsData={newsData}
                    onClose={() => setShowNewsModal(false)}
                />
            )}

            {showAnalystModal && window.AnalystConsensusModal && (
                <window.AnalystConsensusModal
                    symbol={selectedStock}
                    stockData={stockData}
                    analystData={analystData}
                    onClose={() => setShowAnalystModal(false)}
                />
            )}

            {showEarningsModal && window.EarningsCalendarModal && (
                <window.EarningsCalendarModal
                    symbol={selectedStock}
                    stockData={stockData}
                    earningsData={earningsData}
                    onClose={() => setShowEarningsModal(false)}
                />
            )}

            {showEconomicModal && window.EconomicEventsModal && (
                <window.EconomicEventsModal
                    symbol={selectedStock}
                    stockData={stockData}
                    watchlist={watchlistTickers}
                    onClose={() => setShowEconomicModal(false)}
                />
            )}

            {showWatchlistScreenerModal && window.WatchlistScreenerModal && (
                <window.WatchlistScreenerModal
                    watchlist={watchlistTickers}
                    onClose={() => setShowWatchlistScreenerModal(false)}
                    onSelectStock={(symbol) => {
                        setSelectedStock(symbol);
                        setShowWatchlistScreenerModal(false);
                    }}
                />
            )}

        </div>
    );
};

window.AdvancedAnalysisTab = AdvancedAnalysisTab;
