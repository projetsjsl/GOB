import React, { useState, useEffect } from 'react';

// Import des tabs
import AdminJSLaiTab from './tabs/AdminJSLaiTab';
import PlusTab from './tabs/PlusTab';
import DansWatchlistTab from './tabs/DansWatchlistTab';
import StocksNewsTab from './tabs/StocksNewsTab';
import IntelliStocksTab from './tabs/IntelliStocksTab';
import EconomicCalendarTab from './tabs/EconomicCalendarTab';
import type { TabName, StockData, NewsArticle } from '../types';

export const BetaCombinedDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabName>('stocks-news');
    const [isDarkMode, setIsDarkMode] = useState(true);

    // États pour les données
    const [tickers, setTickers] = useState<string[]>([]); // Vide au départ, chargé depuis Supabase
    const [stockData, setStockData] = useState<Record<string, StockData>>({});
    const [newsData, setNewsData] = useState<NewsArticle[]>([]);
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

    // Props complètes pour les tabs
    const tabProps = {
        isDarkMode,
        tickers,
        setTickers,
        stockData,
        setStockData,
        newsData,
        setNewsData,
        loading,
        setLoading,
        lastUpdate,
        setLastUpdate,
        initialLoadComplete,
        API_BASE_URL,
        fetchStockData,
        showMessage,
        getCompanyLogo,
        emmaPopulateWatchlist
    };

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
