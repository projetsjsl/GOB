import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import type { TabName, StockData, NewsArticle, SeekingAlphaData } from '../types';

// Lazy load all tabs for code splitting - reduces initial bundle by ~21K lines
const AdminJSLaiTab = lazy(() => import('./tabs/AdminJSLaiTab'));
const PlusTab = lazy(() => import('./tabs/PlusTab'));
const DansWatchlistTab = lazy(() => import('./tabs/DansWatchlistTab'));
const StocksNewsTab = lazy(() => import('./tabs/StocksNewsTab'));
const IntelliStocksTab = lazy(() => import('./tabs/IntelliStocksTab'));
const EconomicCalendarTab = lazy(() => import('./tabs/EconomicCalendarTab'));
const EmmaConfigTab = lazy(() => import('./tabs/EmmaConfigTab'));
const AskEmmaTab = lazy(() => import('./tabs/AskEmmaTab'));
const EmailBriefingsTab = lazy(() => import('./tabs/EmailBriefingsTab'));
const TestOnlyTab = lazy(() => import('./tabs/TestOnlyTab'));
const NouvellesTab = lazy(() => import('./tabs/NouvellesTab'));
const FinanceProTab = lazy(() => import('./tabs/FinanceProTab'));
const YieldCurveTab = lazy(() => import('./tabs/YieldCurveTab'));
const AdvancedAnalysisTab = lazy(() => import('./tabs/AdvancedAnalysisTab'));
const SeekingAlphaTab = lazy(() => import('./tabs/SeekingAlphaTab'));

// New tabs
const GroundNewsTab = lazy(() => import('./tabs/GroundNewsTab'));
const ScreenerTab = lazy(() => import('./tabs/ScreenerTab'));
const OrchestratorTab = lazy(() => import('./tabs/OrchestratorTab'));

// Loading fallback component
const TabLoadingFallback = () => (
    <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
);

export const BetaCombinedDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabName>('stocks-news');
    const [isDarkMode, setIsDarkMode] = useState(true);

    // États pour les données
    const [tickers, setTickers] = useState<string[]>([]); // Vide au départ, chargé depuis Supabase
    const [stockData, setStockData] = useState<Record<string, StockData>>({});
    const [newsData, setNewsData] = useState<NewsArticle[]>([]);
    const [tickerLatestNews, setTickerLatestNews] = useState<Record<string, NewsArticle[]>>({});
    const [tickerMoveReasons, setTickerMoveReasons] = useState<Record<string, string>>({});
    const [selectedStock, setSelectedStock] = useState<string | null>(null);
    const [seekingAlphaData, setSeekingAlphaData] = useState<Record<string, SeekingAlphaData>>({});
    const [seekingAlphaStockData, setSeekingAlphaStockData] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const [teamTickers, setTeamTickers] = useState<string[]>([]);
    const [watchlistTickers, setWatchlistTickers] = useState<string[]>([]);
    const [apiStatus, setApiStatus] = useState<Record<string, any>>({});
    const [processLog, setProcessLog] = useState<any[]>([]);
    const [emmaConnected, setEmmaConnected] = useState(false);
    const [prefillMessage, setPrefillMessage] = useState('');
    const [autoSend, setAutoSend] = useState(false);
    const [showPromptEditor, setShowPromptEditor] = useState(false);
    const [showTemperatureEditor, setShowTemperatureEditor] = useState(false);
    const [showLengthEditor, setShowLengthEditor] = useState(false);

    // Configuration API
    const API_BASE_URL = useMemo(() =>
        typeof window !== 'undefined' ? window.location.origin : '',
    []);

    // Fonction utilitaire: fetch stock data - memoized to prevent re-creation
    const fetchStockData = useCallback(async (ticker: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/marketdata?endpoint=quote&symbol=${ticker}&source=auto`);
            if (!response.ok) throw new Error(`API error: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`Erreur fetch ${ticker}:`, error);
            return null;
        }
    }, [API_BASE_URL]);

    // Fonction utilitaire: afficher message toast - memoized
    const showMessage = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }, []);

    // Fonction utilitaire: obtenir logo company - memoized
    const getCompanyLogo = useCallback((ticker: string) => {
        return `https://financialmodelingprep.com/image-stock/${ticker}.png`;
    }, []);

    // Fonction utilitaire: Emma populate watchlist (placeholder) - memoized
    const emmaPopulateWatchlist = useCallback(async () => {
        if (process.env.NODE_ENV === 'development') {
            console.log('Emma populate watchlist appelé');
        }
    }, []);

    // Fonction: charger les news générales - memoized
    const fetchNews = useCallback(async (context: string = 'general', limit: number = 20) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/news?context=${context}&limit=${limit}`);

            if (!response.ok) {
                throw new Error(`News API error: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.articles) {
                setNewsData(data.articles);
                return data.articles;
            } else {
                return [];
            }
        } catch (error) {
            console.error('❌ Erreur chargement news:', error);
            return [];
        }
    }, [API_BASE_URL]);

    const extractMoveReason = useCallback((articles: NewsArticle[]) => {
        if (!articles || articles.length === 0) return '';
        const primary = articles[0];
        return primary?.title || primary?.text || primary?.url || '';
    }, []);

    // Fonction: charger les news spécifiques pour chaque ticker - memoized
    const fetchLatestNewsForTickers = useCallback(async () => {
        if (tickers.length === 0) {
            return;
        }

        try {
            const scopedTickers = tickers.slice(0, 10);
            const newsPromises = scopedTickers.map(async (ticker) => {
                try {
                    const response = await fetch(`${API_BASE_URL}/api/news?ticker=${ticker}&limit=5`);
                    const data = await response.json();
                    const articles = data.success ? data.articles : [];
                    return { ticker, articles };
                } catch (error) {
                    return { ticker, articles: [] };
                }
            });

            const results = await Promise.all(newsPromises);
            const tickerNewsList: NewsArticle[] = [];
            const latestNewsByTicker: Record<string, NewsArticle[]> = {};
            const moveReasons: Record<string, string> = {};

            results.forEach(({ ticker, articles }) => {
                if (articles && articles.length > 0) {
                    latestNewsByTicker[ticker] = articles;
                    tickerNewsList.push(...articles);
                    const reason = extractMoveReason(articles);
                    if (reason) {
                        moveReasons[ticker] = reason;
                    }
                }
            });

            if (Object.keys(latestNewsByTicker).length > 0) {
                setTickerLatestNews(prev => ({ ...prev, ...latestNewsByTicker }));
            }
            if (Object.keys(moveReasons).length > 0) {
                setTickerMoveReasons(prev => ({ ...prev, ...moveReasons }));
            }

            if (tickerNewsList.length > 0) {
                setNewsData(prev => {
                    const allNews = [...prev, ...tickerNewsList];
                    return Array.from(
                        new Map(allNews.map(article => [article.url, article])).values()
                    );
                });
            }
        } catch (error) {
            console.error('❌ Erreur chargement news tickers:', error);
        }
    }, [tickers, API_BASE_URL, extractMoveReason]);

    // Fonction: charger tous les tickers depuis Supabase - memoized
    const loadTickersFromSupabase = useCallback(async () => {
        try {
            const response = await fetch('/api/supabase-watchlist');

            if (response.ok) {
                const watchlistData = await response.json();
                const tickersFromSupabase = watchlistData.data?.map((item: any) => item.symbol) || [];

                if (tickersFromSupabase.length > 0) {
                    setTickers(tickersFromSupabase);
                    setWatchlistTickers(tickersFromSupabase);
                    if (teamTickers.length === 0) {
                        setTeamTickers(tickersFromSupabase);
                    }
                    return tickersFromSupabase;
                }
            }
            return [];
        } catch (error) {
            console.error('❌ Erreur rechargement watchlist:', error);
            return [];
        }
    }, [teamTickers.length]);

    // Fonction: rafraîchir tous les stocks - memoized
    const refreshAllStocks = useCallback(async () => {
        if (tickers.length === 0) {
            return;
        }

        setLoading(true);
        try {
            const promises = tickers.map((ticker) => fetchStockData(ticker));
            const results = await Promise.all(promises);

            const newStockData: Record<string, StockData> = {};
            results.forEach((data, index) => {
                if (data) {
                    newStockData[tickers[index]] = {
                        symbol: tickers[index],
                        price: data.c || data.price,
                        change: data.d || data.change,
                        changePercent: data.dp || data.changePercent,
                        ...data
                    };
                }
            });

            setStockData(newStockData);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('❌ Erreur rafraîchissement stocks:', error);
        } finally {
            setLoading(false);
        }
    }, [tickers, fetchStockData]);

    // Effet: charger watchlist depuis Supabase puis les données
    useEffect(() => {
        let isMounted = true;

        const loadInitialData = async () => {
            setLoading(true);
            try {
                // 1. Charger watchlist depuis Supabase
                const watchlistRes = await fetch('/api/supabase-watchlist');

                if (watchlistRes.ok && isMounted) {
                    const watchlistData = await watchlistRes.json();
                    const tickersFromSupabase = watchlistData.data?.map((item: any) => item.symbol) || [];

                    if (tickersFromSupabase.length > 0) {
                        setTickers(tickersFromSupabase);

                        // 2. Charger données pour ces tickers
                        const promises = tickersFromSupabase.map((ticker: string) => fetchStockData(ticker));
                        const results = await Promise.all(promises);

                        if (!isMounted) return;

                        const newStockData: Record<string, StockData> = {};
                        results.forEach((data, index) => {
                            if (data) {
                                newStockData[tickersFromSupabase[index]] = {
                                    symbol: tickersFromSupabase[index],
                                    price: data.c || data.price,
                                    change: data.d || data.change,
                                    changePercent: data.dp || data.changePercent,
                                    ...data
                                };
                            }
                        });

                        setStockData(newStockData);
                        setLastUpdate(new Date());

                        // 3. Charger les news générales
                        await fetchNews('general', 20);

                        // 4. Charger les news spécifiques aux tickers (use requestIdleCallback for better perf)
                        if ('requestIdleCallback' in window) {
                            requestIdleCallback(() => {
                                if (isMounted) fetchLatestNewsForTickers();
                            });
                        } else {
                            setTimeout(() => {
                                if (isMounted) fetchLatestNewsForTickers();
                            }, 500);
                        }
                    }
                } else if (isMounted) {
                    // Fallback: tickers par défaut si Supabase échoue
                    const defaultTickers = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'];
                    setTickers(defaultTickers);
                }

                if (isMounted) setInitialLoadComplete(true);
            } catch (error) {
                console.error('❌ Erreur chargement initial:', error);
                if (isMounted) {
                    setTickers(['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA']);
                    setInitialLoadComplete(true);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        if (!initialLoadComplete) {
            loadInitialData();
        }

        return () => { isMounted = false; };
    }, [fetchStockData, fetchNews, fetchLatestNewsForTickers, initialLoadComplete]);

    // Effet: charger les news spécifiques aux tickers quand la liste change (debounced)
    useEffect(() => {
        if (!initialLoadComplete || tickers.length === 0) return;

        const timeoutId = setTimeout(() => {
            fetchLatestNewsForTickers();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [tickers, initialLoadComplete, fetchLatestNewsForTickers]);

    // Memoize tabProps to prevent unnecessary re-renders of children
    const tabProps = useMemo(() => ({
        isDarkMode,
        tickers,
        setTickers,
        stockData,
        setStockData,
        newsData,
        setNewsData,
        tickerLatestNews,
        setTickerLatestNews,
        tickerMoveReasons,
        setTickerMoveReasons,
        loading,
        setLoading,
        lastUpdate,
        setLastUpdate,
        initialLoadComplete,
        API_BASE_URL,
        fetchStockData,
        showMessage,
        getCompanyLogo,
        emmaPopulateWatchlist,
        fetchNews,
        fetchLatestNewsForTickers,
        loadTickersFromSupabase,
        refreshAllStocks,
        setActiveTab,
        setSelectedStock,
        seekingAlphaData,
        setSeekingAlphaData,
        seekingAlphaStockData,
        setSeekingAlphaStockData,
        selectedStock,
        teamTickers,
        setTeamTickers,
        watchlistTickers,
        setWatchlistTickers,
        apiStatus,
        setApiStatus,
        processLog,
        setProcessLog,
        emmaConnected,
        setEmmaConnected,
        prefillMessage,
        setPrefillMessage,
        autoSend,
        setAutoSend,
        showPromptEditor,
        setShowPromptEditor,
        showTemperatureEditor,
        setShowTemperatureEditor,
        showLengthEditor,
        setShowLengthEditor
    }), [
        isDarkMode, tickers, stockData, newsData, tickerLatestNews, tickerMoveReasons,
        loading, lastUpdate, initialLoadComplete, API_BASE_URL, fetchStockData, showMessage,
        getCompanyLogo, emmaPopulateWatchlist, fetchNews, fetchLatestNewsForTickers,
        loadTickersFromSupabase, refreshAllStocks, seekingAlphaData, seekingAlphaStockData,
        selectedStock, teamTickers, watchlistTickers, apiStatus, processLog, emmaConnected,
        prefillMessage, autoSend, showPromptEditor, showTemperatureEditor, showLengthEditor
    ]);

    // Debounced window sync - only updates window object every 100ms max
    // This prevents performance issues from constant state updates triggering window syncs
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const timeoutId = setTimeout(() => {
            window.BetaCombinedDashboard = {
                isDarkMode,
                tickers,
                stockData,
                newsData,
                tickerLatestNews,
                tickerMoveReasons,
                loading,
                lastUpdate,
                selectedStock,
                seekingAlphaData,
                seekingAlphaStockData,
                teamTickers,
                watchlistTickers,
                apiStatus,
                processLog,
                prefillMessage,
                autoSend,
                showPromptEditor,
                showTemperatureEditor,
                showLengthEditor,
                emmaConnected,
                API_BASE_URL,
                setActiveTab,
                setSelectedStock,
                setTickers,
                setStockData,
                setNewsData,
                setTickerLatestNews,
                setTickerMoveReasons,
                setSeekingAlphaData,
                setSeekingAlphaStockData,
                setLoading,
                setLastUpdate,
                setTeamTickers,
                setWatchlistTickers,
                setApiStatus,
                setProcessLog,
                setPrefillMessage,
                setAutoSend,
                setShowPromptEditor,
                setShowTemperatureEditor,
                setShowLengthEditor,
                setEmmaConnected,
                fetchNews,
                fetchLatestNewsForTickers,
                loadTickersFromSupabase,
                refreshAllStocks,
                fetchStockData,
                showMessage,
                getCompanyLogo,
                emmaPopulateWatchlist
            };

            window.BetaCombinedDashboardData = {
                getCompanyLogo,
                emmaPopulateWatchlist
            };
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [
        isDarkMode, tickers, stockData, newsData, tickerLatestNews, tickerMoveReasons,
        loading, lastUpdate, selectedStock, seekingAlphaData, seekingAlphaStockData,
        teamTickers, watchlistTickers, apiStatus, processLog, prefillMessage, autoSend,
        showPromptEditor, showTemperatureEditor, showLengthEditor, emmaConnected,
        API_BASE_URL, fetchNews, fetchLatestNewsForTickers, loadTickersFromSupabase,
        refreshAllStocks, fetchStockData, showMessage, getCompanyLogo, emmaPopulateWatchlist
    ]);

    // Memoized active tab component for better performance
    const activeTabContent = useMemo(() => {
        const TabComponent = (() => {
            switch (activeTab) {
                case 'stocks-news': return StocksNewsTab;
                case 'nouvelles': return NouvellesTab;
                case 'intellistocks': return IntelliStocksTab;
                case 'titres-fastgraphs': return IntelliStocksTab;
                case 'admin-jslai': return AdminJSLaiTab;
                case 'ask-emma': return AskEmmaTab;
                case 'emma-config': return EmmaConfigTab;
                case 'testonly': return TestOnlyTab;
                case 'email-briefings': return EmailBriefingsTab;
                case 'plus': return PlusTab;
                case 'watchlist': return DansWatchlistTab;
                case 'economic-calendar': return EconomicCalendarTab;
                case 'yield-curve': return YieldCurveTab;
                case 'advanced-analysis': return AdvancedAnalysisTab;
                case 'finance-pro': return FinanceProTab;

                // New tabs
                case 'nouvelles-toutes': return NouvellesTab;
                case 'nouvelles-ground': return GroundNewsTab;
                case 'admin-orchestrator': return OrchestratorTab;
                case 'jlab-screener': return ScreenerTab;
                case 'jlab-fastgraphs': return IntelliStocksTab;
                case 'jlab-3p1': return FinanceProTab;
                case 'jlab-seeking': return SeekingAlphaTab;

                default: return StocksNewsTab;
            }
        })();
        return <TabComponent {...tabProps} />;
    }, [activeTab, tabProps]);

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <header className="bg-gray-800 border-b border-gray-700 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">GOB Dashboard</h1>
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    >
                        {isDarkMode ? '☀️ Light' : '🌙 Dark'}
                    </button>
                </div>
            </header>

            {/* Navigation Tabs */}
            <nav className="bg-gray-800 border-b border-gray-700 px-4">
                <div className="flex gap-2 overflow-x-auto">
                    {[
                        { id: 'stocks-news' as TabName, label: '📊 Stocks & News' },
                        { id: 'finance-pro' as TabName, label: '💹 Finance Pro' },
                        { id: 'nouvelles' as TabName, label: '📰 Nouvelles' },
                        { id: 'intellistocks' as TabName, label: '🧠 IntelliStocks' },
                        { id: 'email-briefings' as TabName, label: '📧 Briefings' },
                        { id: 'watchlist' as TabName, label: '⭐ Watchlist' },
                        { id: 'economic-calendar' as TabName, label: '📅 Calendar' },
                        { id: 'yield-curve' as TabName, label: '📈 Yield Curve' },
                        { id: 'advanced-analysis' as TabName, label: '🔬 Analyse Pro' },
                        { id: 'ask-emma' as TabName, label: '🤖 Emma IA™' },
                        { id: 'emma-config' as TabName, label: '🛠️ Emma Config' },
                        { id: 'testonly' as TabName, label: '🧪 Test Only' },
                        { id: 'admin-jslai' as TabName, label: '⚙️ Admin' },
                        { id: 'plus' as TabName, label: '➕ Plus' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-3 whitespace-nowrap transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-blue-600 text-white border-b-2 border-blue-400'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </nav>

            {/* Content - Wrapped in Suspense for lazy loaded tabs */}
            <main className="p-6">
                <Suspense fallback={<TabLoadingFallback />}>
                    {activeTabContent}
                </Suspense>
            </main>
        </div>
    );
};

export default BetaCombinedDashboard;
