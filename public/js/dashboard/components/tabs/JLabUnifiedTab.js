// Auto-converted from monolithic dashboard file
// Component: JLabUnifiedTab

const { useState } = React;

const JLabUnifiedTab = () => {
    // Accès aux variables globales depuis le scope parent (comme dans la version monolithique)
    const isDarkMode = window.BetaCombinedDashboard?.isDarkMode ?? true;
    const tickers = window.BetaCombinedDashboard?.tickers ?? [];
    const stockData = window.BetaCombinedDashboard?.stockData ?? {};
    const newsData = window.BetaCombinedDashboard?.newsData ?? [];
    const loading = window.BetaCombinedDashboard?.loading ?? false;
    const lastUpdate = window.BetaCombinedDashboard?.lastUpdate ?? null;
    const loadTickersFromSupabase = window.BetaCombinedDashboard?.loadTickersFromSupabase;
    const fetchNews = window.BetaCombinedDashboard?.fetchNews;
    const refreshAllStocks = window.BetaCombinedDashboard?.refreshAllStocks;
    const fetchLatestNewsForTickers = window.BetaCombinedDashboard?.fetchLatestNewsForTickers;
    
    const [jlabView, setJlabView] = useState('portfolio'); // 'portfolio', 'watchlist', ou '3pour1'

    return (
        <div className="w-full h-full">
            {/* Navigation interne JLab */}
            <div className={`mb-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex gap-2">
                    <button
                        onClick={() => setJlabView('portfolio')}
                        className={`px-6 py-3 font-semibold transition-all duration-200 ${jlabView === 'portfolio'
                            ? isDarkMode
                                ? 'bg-green-600 text-white border-b-2 border-green-400'
                                : 'bg-green-100 text-green-800 border-b-2 border-green-600'
                            : isDarkMode
                                ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                    >
                        Titres en portefeuille
                    </button>
                    <button
                        onClick={() => setJlabView('watchlist')}
                        className={`px-6 py-3 font-semibold transition-all duration-200 ${jlabView === 'watchlist'
                            ? isDarkMode
                                ? 'bg-green-600 text-white border-b-2 border-green-400'
                                : 'bg-green-100 text-green-800 border-b-2 border-green-600'
                            : isDarkMode
                                ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                    >
                        Dan's watchlist
                    </button>
                    <button
                        onClick={() => setJlabView('3pour1')}
                        className={`px-6 py-3 font-semibold transition-all duration-200 ${jlabView === '3pour1'
                            ? isDarkMode
                                ? 'bg-green-600 text-white border-b-2 border-green-400'
                                : 'bg-green-100 text-green-800 border-b-2 border-green-600'
                            : isDarkMode
                                ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                    >
                        3pour1
                    </button>
                </div>
            </div>

            {/* Contenu conditionnel */}
            <div className="w-full h-full">
                {jlabView === 'portfolio' && window.StocksNewsTab && React.createElement(window.StocksNewsTab, { 
                    tickerSource: 'portfolio'
                })}
                {jlabView === 'watchlist' && window.StocksNewsTab && React.createElement(window.StocksNewsTab, { 
                    tickerSource: 'watchlist'
                })}
                {jlabView === '3pour1' && window.FinanceProTab && React.createElement(window.FinanceProTab)}
            </div>
        </div>
    );
};

// Exposition globale pour Babel standalone
window.JLabUnifiedTab = JLabUnifiedTab;

