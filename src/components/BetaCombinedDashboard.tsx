import React, { useState, useEffect } from 'react';

// Import des tabs
import AdminJSLaiTab from './tabs/AdminJSLaiTab';
import PlusTab from './tabs/PlusTab';
import DansWatchlistTab from './tabs/DansWatchlistTab';
import StocksNewsTab from './tabs/StocksNewsTab';
import IntelliStocksTab from './tabs/IntelliStocksTab';
import EconomicCalendarTab from './tabs/EconomicCalendarTab';
import type { TabName, StockData, NewsArticle, SeekingAlphaData } from '../types';

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

    // Configuration API
    const API_BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';

    // Fonction utilitaire: fetch stock data
    const fetchStockData = async (ticker: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/marketdata?endpoint=quote&symbol=${ticker}&source=auto`);
            if (!response.ok) throw new Error(`API error: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`Erreur fetch ${ticker}:`, error);
            return null;
        }
    };

    // Fonction utilitaire: afficher message toast
    const showMessage = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        console.log(`[${type.toUpperCase()}] ${message}`);
        // TODO: Implémenter un vrai système de toast notifications
    };

    // Fonction utilitaire: obtenir logo company
    const getCompanyLogo = (ticker: string) => {
        return `https://financialmodelingprep.com/image-stock/${ticker}.png`;
    };

    // Fonction utilitaire: Emma populate watchlist (placeholder)
    const emmaPopulateWatchlist = async () => {
        console.log('Emma populate watchlist appelé');
        // TODO: Implémenter logique Emma
    };

    // Fonction: charger les news générales
    const fetchNews = async (context: string = 'general', limit: number = 20) => {
        try {
            console.log(`📰 Chargement des news (context: ${context}, limit: ${limit})...`);
            const response = await fetch(`${API_BASE_URL}/api/news?context=${context}&limit=${limit}`);

            if (!response.ok) {
                throw new Error(`News API error: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.articles) {
                setNewsData(data.articles);
                console.log(`✅ ${data.articles.length} news chargées depuis ${data.sources?.join(', ') || 'API'}`);
                return data.articles;
            } else {
                console.warn('⚠️ Aucune news disponible');
                return [];
            }
        } catch (error) {
            console.error('❌ Erreur chargement news:', error);
            return [];
        }
    };

    const extractMoveReason = (articles: NewsArticle[]) => {
        if (!articles || articles.length === 0) return '';
        const primary = articles[0];
        return primary?.title || primary?.text || primary?.url || '';
    };

    // Fonction: charger les news spécifiques pour chaque ticker
    const fetchLatestNewsForTickers = async () => {
        if (tickers.length === 0) {
            console.log('⚠️ Aucun ticker pour charger les news');
            return;
        }

        try {
            console.log(`📰 Chargement des news pour ${tickers.length} tickers...`);
            const scopedTickers = tickers.slice(0, 10);
            const newsPromises = scopedTickers.map(async (ticker) => {
                try {
                    const response = await fetch(`${API_BASE_URL}/api/news?ticker=${ticker}&limit=5`);
                    const data = await response.json();
                    const articles = data.success ? data.articles : [];
                    return { ticker, articles };
                } catch (error) {
                    console.error(`❌ Erreur news ${ticker}:`, error);
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
                // Merge avec les news générales et dédupliquer par URL
                const allNews = [...newsData, ...tickerNewsList];
                const uniqueNews = Array.from(
                    new Map(allNews.map(article => [article.url, article])).values()
                );
                setNewsData(uniqueNews);
                console.log(`✅ ${tickerNewsList.length} news spécifiques aux tickers chargées`);
            }
        } catch (error) {
            console.error('❌ Erreur chargement news tickers:', error);
        }
    };

    // Fonction: charger tous les tickers depuis Supabase
    const loadTickersFromSupabase = async () => {
        try {
            console.log('📊 Rechargement watchlist depuis Supabase...');
            const response = await fetch('/api/supabase-watchlist');

            if (response.ok) {
                const watchlistData = await response.json();
                const tickersFromSupabase = watchlistData.data?.map((item: any) => item.symbol) || [];

                if (tickersFromSupabase.length > 0) {
                    setTickers(tickersFromSupabase);
                    console.log(`✅ ${tickersFromSupabase.length} tickers rechargés`);
                    return tickersFromSupabase;
                }
            }
            return [];
        } catch (error) {
            console.error('❌ Erreur rechargement watchlist:', error);
            return [];
        }
    };

    // Fonction: rafraîchir tous les stocks
    const refreshAllStocks = async () => {
        if (tickers.length === 0) {
            console.log('⚠️ Aucun ticker à rafraîchir');
            return;
        }

        setLoading(true);
        try {
            console.log(`🔄 Rafraîchissement de ${tickers.length} stocks...`);
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
            console.log(`✅ ${Object.keys(newStockData).length} stocks rafraîchis`);
        } catch (error) {
            console.error('❌ Erreur rafraîchissement stocks:', error);
        } finally {
            setLoading(false);
        }
    };

    // Effet: charger watchlist depuis Supabase puis les données
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                // 1. Charger watchlist depuis Supabase
                console.log('📊 Chargement watchlist depuis Supabase...');
                const watchlistRes = await fetch('/api/supabase-watchlist');

                if (watchlistRes.ok) {
                    const watchlistData = await watchlistRes.json();
                    const tickersFromSupabase = watchlistData.data?.map((item: any) => item.symbol) || [];

                    if (tickersFromSupabase.length > 0) {
                        console.log(`✅ ${tickersFromSupabase.length} tickers chargés depuis Supabase:`, tickersFromSupabase);
                        setTickers(tickersFromSupabase);

                        // 2. Charger données pour ces tickers
                        const promises = tickersFromSupabase.map((ticker: string) => fetchStockData(ticker));
                        const results = await Promise.all(promises);

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

                        // 4. Charger les news spécifiques aux tickers (après avoir les news générales)
                        // On attend un peu pour ne pas surcharger l'API
                        setTimeout(() => {
                            fetchLatestNewsForTickers();
                        }, 1000);
                    } else {
                        console.log('ℹ️ Watchlist vide dans Supabase - aucun ticker chargé');
                    }
                } else {
                    console.warn('⚠️ Impossible de charger watchlist depuis Supabase, utilisation locale');
                    // Fallback: tickers par défaut si Supabase échoue
                    const defaultTickers = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'];
                    setTickers(defaultTickers);
                }

                setInitialLoadComplete(true);
            } catch (error) {
                console.error('❌ Erreur chargement initial:', error);
                // Fallback en cas d'erreur
                setTickers(['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA']);
                setInitialLoadComplete(true);
            } finally {
                setLoading(false);
            }
        };

        if (!initialLoadComplete) {
            loadInitialData();
        }
    }, []);

    // Effet: charger les news spécifiques aux tickers quand la liste change
    useEffect(() => {
        if (initialLoadComplete && tickers.length > 0 && newsData.length > 0) {
            console.log('📰 Tickers mis à jour, rechargement des news spécifiques...');
            fetchLatestNewsForTickers();
        }
    }, [tickers.length, initialLoadComplete]);

    // Props complètes pour les tabs
    const tabProps = {
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
        selectedStock
    };

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        window.BetaCombinedDashboard = {
            ...(window.BetaCombinedDashboard || {}),
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
            ...(window.BetaCombinedDashboardData || {}),
            getCompanyLogo,
            emmaPopulateWatchlist
        };
    }, [
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
        seekingAlphaStockData
    ]);

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'stocks-news': return <StocksNewsTab {...tabProps} />;
            case 'intellistocks': return <IntelliStocksTab {...tabProps} />;
            case 'admin-jslai': return <AdminJSLaiTab {...tabProps} />;
            case 'plus': return <PlusTab {...tabProps} />;
            case 'watchlist': return <DansWatchlistTab {...tabProps} />;
            case 'economic-calendar': return <EconomicCalendarTab {...tabProps} />;
            default: return <StocksNewsTab {...tabProps} />;
        }
    };

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
                        { id: 'intellistocks' as TabName, label: '🧠 IntelliStocks' },
                        { id: 'watchlist' as TabName, label: '⭐ Watchlist' },
                        { id: 'economic-calendar' as TabName, label: '📅 Calendar' },
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

            {/* Content */}
            <main className="p-6">
                {renderActiveTab()}
            </main>
        </div>
    );
};

export default BetaCombinedDashboard;
