// Auto-converted from monolithic dashboard file
// Component: JLabUnifiedTab

const { useState } = React;

const JLabUnifiedTab = ({ isDarkMode, tickers = [], stockData = {}, newsData = [], loading = false, lastUpdate = null, loadTickersFromSupabase, fetchNews, refreshAllStocks, fetchLatestNewsForTickers }) => {
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
                    tickerSource: 'portfolio', 
                    isDarkMode,
                    tickers,
                    stockData,
                    newsData,
                    loading,
                    lastUpdate,
                    loadTickersFromSupabase,
                    fetchNews,
                    refreshAllStocks,
                    fetchLatestNewsForTickers
                })}
                {jlabView === 'watchlist' && window.StocksNewsTab && React.createElement(window.StocksNewsTab, { 
                    tickerSource: 'watchlist', 
                    isDarkMode,
                    tickers,
                    stockData,
                    newsData,
                    loading,
                    lastUpdate,
                    loadTickersFromSupabase,
                    fetchNews,
                    refreshAllStocks,
                    fetchLatestNewsForTickers
                })}
                {jlabView === '3pour1' && window.FinanceProTab && React.createElement(window.FinanceProTab, { isDarkMode })}
            </div>
        </div>
    );
};

// Exposition globale pour Babel standalone
window.JLabUnifiedTab = JLabUnifiedTab;

