
// AdvancedAnalysisTab.js
// A clean, standalone component for the new advanced financial tools

const { useState, useEffect } = React;
const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, AreaChart, Area } = window.Recharts || {};

const AdvancedAnalysisTab = () => {
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
                console.log('📥 Loading watchlist from Supabase...');
                const res = await fetch('/api/supabase-watchlist');
                if (res.ok) {
                    const json = await res.json();
                    const tickers = Array.isArray(json.tickers) ? json.tickers : [];
                    console.log('✅ Watchlist loaded from Supabase:', tickers);

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
                console.log('⚠️ Supabase not available, using default tickers');
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
            console.log(`📦 Cache hit: ${key}`);
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

            console.log('✅ Comprehensive data loaded for', symbol);

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

    const isDarkMode = true; // Force dark mode for now or get from context

    return (
        <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-neutral-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>

            {/* Header */}
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                        <Icon name="stats-report" className="w-8 h-8 inline mr-2 text-blue-400" /> Analyse Financière Pro
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Outils avancés pour l'investisseur intelligent
                    </p>
                </div>

                {/* Stock Selector Dropdown */}
                <div className="flex items-center gap-4">
                    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                        <select
                            value={selectedStock}
                            onChange={(e) => setSelectedStock(e.target.value)}
                            className="bg-gray-800 text-white font-bold px-4 py-2 outline-none cursor-pointer hover:bg-gray-700 transition-colors"
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

                    {loading ? (
                        <div className="text-gray-400 text-sm"><Icon name="refresh" className="w-4 h-4 inline animate-spin" /> Chargement...</div>
                    ) : stockData ? (
                        <div className="text-right">
                            <div className="text-xl font-bold">${stockData.price?.toFixed(2) || '0.00'}</div>
                            <div className={`text-sm ${stockData.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {stockData.changePercent >= 0 ? '+' : ''}{stockData.changePercent?.toFixed(2) || '0.00'}%
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-500 text-sm">Sélectionnez un titre</div>
                    )}
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* 1. Analyse Approfondie (Main Card) */}
                <div
                    onClick={() => setShowAnalysisModal(true)}
                    className="col-span-1 md:col-span-2 lg:col-span-3 bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-500/30 rounded-xl p-6 cursor-pointer hover:border-blue-400 transition-all hover:shadow-lg hover:shadow-blue-500/10 group"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Icon name="stats-report" className="text-blue-400 w-8 h-8" />
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
                            Ouvrir <Icon name="arrow-right" className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* 2. Comparaison Multi-Titres */}
                <div
                    onClick={() => setShowPeerComparison(true)}
                    className="bg-gradient-to-br from-emerald-900/20 to-teal-900/20 border border-emerald-700/30 rounded-xl p-6 cursor-pointer hover:border-emerald-500 transition-all hover:shadow-lg hover:shadow-emerald-500/10 group"
                >
                    <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Icon name="group" className="text-emerald-400 w-6 h-6" />
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
                        <Icon name="graph-up" className="text-purple-400 w-6 h-6" />
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
                        <Icon name="filter" className="text-orange-400 w-6 h-6" />
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
                        <Icon name="brain" className="text-violet-400 w-6 h-6" />
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
                        <Icon name="newspaper" className="text-amber-400 w-6 h-6" />
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
                        <Icon name="community" className="text-lime-400 w-6 h-6" />
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
                        <Icon name="calendar" className="text-rose-400 w-6 h-6" />
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
                        <Icon name="globe" className="text-sky-400 w-6 h-6" />
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
                        <Icon name="search" className="text-teal-400 w-6 h-6" />
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
                            alert('Données non disponibles pour l\'export. Veuillez d\'abord charger les données du titre.');
                        }
                    }}
                    className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-700/30 rounded-xl p-6 cursor-pointer hover:border-cyan-500 transition-all hover:shadow-lg hover:shadow-cyan-500/10 group"
                >
                    <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Icon name="page" className="text-cyan-400 w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Export Rapport PDF</h3>
                    <p className="text-gray-400 text-sm">
                        Générez un rapport professionnel complet prêt à être partagé ou imprimé.
                    </p>
                </div>

            </div>

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
