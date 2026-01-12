const { useState, useEffect, useRef, useCallback } = React;
// Use LazyWidgetWrapper from window without redeclaring (avoid const conflict)
// Create local reference with different name to avoid Babel transpilation conflicts
const LazyWrapper = window.LazyWidgetWrapper || (({ children }) => children);

// Note: MarketOverviewWidget et ScreenerWidget ont été déplacés vers MarketsEconomyTab et AdvancedAnalysisTab
// pour éviter les doublons de widgets TradingView

const StocksNewsTab = (props) => {
        // Récupère les données/handlers depuis la surface globale du dashboard avec fallback props
        const dashboard = typeof window !== 'undefined' ? window.BetaCombinedDashboard || {} : {};
        const isDarkMode = props.isDarkMode ?? dashboard.isDarkMode ?? true;
        const tickers = (props.tickers && props.tickers.length > 0 ? props.tickers : dashboard.tickers) ?? [];
        const teamTickers = (props.teamTickers && props.teamTickers.length > 0 ? props.teamTickers : dashboard.teamTickers) ?? [];
        const stockData = (props.stockData && Object.keys(props.stockData).length > 0 ? props.stockData : dashboard.stockData) ?? {};
        const stockDataCount = Object.keys(stockData || {}).length;
        const newsData = (props.newsData && props.newsData.length > 0 ? props.newsData : dashboard.newsData) ?? [];
        const tickerLatestNews = props.tickerLatestNews ?? dashboard.tickerLatestNews ?? {};
        const tickerMoveReasons = props.tickerMoveReasons ?? dashboard.tickerMoveReasons ?? {};
        const loading = props.loading ?? dashboard.loading ?? false;
        const lastUpdate = props.lastUpdate ?? dashboard.lastUpdate ?? null;
        const loadTickersFromSupabase = props.loadTickersFromSupabase || dashboard.loadTickersFromSupabase;
        const fetchNews = props.fetchNews || dashboard.fetchNews;
        const refreshAllStocks = props.refreshAllStocks || dashboard.refreshAllStocks;
        const fetchLatestNewsForTickers = props.fetchLatestNewsForTickers || dashboard.fetchLatestNewsForTickers;
        const setActiveTab = props.setActiveTab || dashboard.setActiveTab;
        const setSelectedStock = props.setSelectedStock || dashboard.setSelectedStock;
        const getCompanyLogo = props.getCompanyLogo
            || (typeof window !== 'undefined' ? window.BetaCombinedDashboardData?.getCompanyLogo : undefined)
            || dashboard.getCompanyLogo
            || ((ticker) => `https://financialmodelingprep.com/image-stock/${ticker}.png`);
        const cleanTextUtil = (typeof window !== 'undefined' ? window.DASHBOARD_UTILS?.cleanText : undefined) || ((text) => text || '');
        const getNewsIconUtil = (typeof window !== 'undefined' ? window.DASHBOARD_UTILS?.getNewsIcon : undefined) || (() => ({ icon: 'Info', color: 'text-gray-400' }));

        // Fix for undefined LucideIcon ensuring it resolves from props, window, or fallback
        const LucideIcon = props.LucideIcon || 
                          (typeof window !== 'undefined' ? window.LucideIcon : undefined) || 
                          (typeof window !== 'undefined' ? window.DASHBOARD_UTILS?.LucideIcon : undefined) || 
                          (({ name, className = '' }) => <span className={`icon-${name} ${className}`}></span>);

        // Fix for undefined IconoirIcon ensuring it resolves from props, window, or fallback
        const IconoirIcon = props.IconoirIcon || 
                           (typeof window !== 'undefined' ? window.IconoirIcon : undefined) || 
                           (typeof window !== 'undefined' ? window.DASHBOARD_UTILS?.IconoirIcon : undefined) || 
                           (({ name, className = '' }) => <i className={`iconoir-${name.toLowerCase()} ${className}`}></i>);

        // Safe async wrappers to avoid runtime errors if globals are missing
        const safeLoadTickers = typeof loadTickersFromSupabase === 'function' ? loadTickersFromSupabase : async () => {};
        const safeFetchNews = typeof fetchNews === 'function' ? fetchNews : async () => {};
        const safeRefreshAllStocks = typeof refreshAllStocks === 'function' ? refreshAllStocks : async () => {};
        const safeFetchLatestNewsForTickers = typeof fetchLatestNewsForTickers === 'function' ? fetchLatestNewsForTickers : async () => {};
        const safeSetActiveTab = typeof setActiveTab === 'function' ? setActiveTab : () => {};
        const safeSetSelectedStock = typeof setSelectedStock === 'function' ? setSelectedStock : () => {};

        // Extract tickerSource from props with fallback to 'portfolio'
        const tickerSource = props.tickerSource ?? 'portfolio';

        // Fonction pour extraire la raison du mouvement depuis les news
        const extractMoveReason = (ticker, changePercent) => {
            // PRIORITÉ 1: Utiliser l'explication "Why Is It Moving?" de Finviz si disponible
            const whyMoving = tickerMoveReasons[ticker];
            if (whyMoving && whyMoving.explanation) {
                const explanation = whyMoving.explanation_enriched || whyMoving.explanation;
                return explanation.length > 120 ? explanation.substring(0, 120) + '...' : explanation;
            }
        
            // PRIORITÉ 2: Utiliser la news récente depuis tickerLatestNews
            let news = tickerLatestNews[ticker];
            if (news && news.title) {
                return news.title.length > 120 ? news.title.substring(0, 120) + '...' : news.title;
            }
        
            // FALLBACK: Message générique
            const directionLabel = changePercent > 0 ? 'hausse' : 'baisse';
            return `Variation en ${directionLabel} de ${Math.abs(changePercent).toFixed(2)}% sans actualité confirmée.`;
        };

        const [stocksViewMode, setStocksViewMode] = useState('list'); // list par défaut (3 vues: list, cards, table)
        const [expandedStock, setExpandedStock] = useState(null);
        const [expandedArticle, setExpandedArticle] = useState(null); // Article expandu avec iframe

        // Logic moved to sub-components


        const renderMarketBadge = window.DASHBOARD_UTILS?.renderMarketBadge
            ? (type) => window.DASHBOARD_UTILS.renderMarketBadge(type, isDarkMode)
            : (type) => {
                const isBull = type === 'bull';
                return (
                    <span
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xl font-semibold shadow-inner border ${
                            isBull
                                ? isDarkMode
                                    ? 'bg-lime-900/70 border-lime-500/40 text-lime-300'
                                    : 'bg-lime-100 border-lime-400 text-lime-700'
                                : isDarkMode
                                    ? 'bg-rose-900/70 border-rose-500/40 text-rose-200'
                                    : 'bg-rose-100 border-rose-300 text-rose-700'
                        }`}
                    >
                        {isBull ? '🐂' : '🐻'}
                    </span>
                );
            };

        // Helper functions for news credibility scoring (définies dans le composant)
        const getNewsCredibilityScore = (sourceName) => {
            if (!sourceName) return 50;

            const source = sourceName.toLowerCase();

            // Premium sources (90-100)
            const premiumSources = ['bloomberg', 'reuters', 'wall street journal', 'wsj', 'financial times', 'ft'];
            if (premiumSources.some(s => source.includes(s))) return 95;

            // High credibility (75-89)
            const highSources = ['cnbc', 'marketwatch', 'barron', 'seeking alpha', 'yahoo finance', 'morningstar', 'the economist'];
            if (highSources.some(s => source.includes(s))) return 82;

            // Medium credibility (50-74)
            const mediumSources = ['forbes', 'benzinga', 'investor', 'zacks', 'motley fool', 'nasdaq', 'business insider'];
            if (mediumSources.some(s => source.includes(s))) return 65;

            // Low credibility (below 50)
            return 40;
        };

        const getCredibilityTier = (score) => {
            if (score >= 90) return 'premium';
            if (score >= 75) return 'high';
            if (score >= 50) return 'medium';
            return 'low';
        };

        const sortNewsByCredibility = (articles) => {
            if (!Array.isArray(articles)) return [];
            return [...articles].sort((a, b) => {
                const aSource = a?.source?.name || a?.source || a?.site || '';
                const bSource = b?.source?.name || b?.source || b?.site || '';
                const aScore = getNewsCredibilityScore(aSource);
                const bScore = getNewsCredibilityScore(bSource);
                return bScore - aScore;
            });
        };

        // Fonction pour formater les nombres
        const formatNumber = (num) => {
            if (!num && num !== 0) return 'N/A';
            if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
            if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
            if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
            return num.toLocaleString('fr-FR');
        };

        // Mapping des noms de compagnies pour affichage
        const companyNames = (window.DASHBOARD_CONSTANTS && window.DASHBOARD_CONSTANTS.companyNames) || {};

        return (
        <div className="space-y-6">
            {/* Message d'état si pas de données */}
            {tickers.length === 0 && stockDataCount === 0 && newsData.length === 0 && (
                <div className={`p-6 rounded-xl border-2 transition-colors duration-300 ${
                    isDarkMode
                        ? 'bg-gray-800 border-yellow-500/30'
                        : 'bg-yellow-50 border-yellow-200'
                }`}>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">⏳</span>
                        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Chargement des données...
                        </h3>
                    </div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Les titres et nouvelles sont en cours de chargement. Veuillez patienter quelques instants.
                    </p>
                    <button
                        onClick={async () => {
                            await safeLoadTickers();
                            await safeFetchNews();
                        }}
                        className={`mt-4 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                            isDarkMode
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                    >
                        🔄 Forcer le chargement
                    </button>
                </div>
            )}

            <div className="flex justify-between items-center">
                <h2 className={`text-2xl font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>📊 Titres & nouvelles</h2>
                <div className="flex gap-2">
                    {/* Toggle Vue */}
                    <div className={`flex gap-1 p-1 rounded-lg transition-colors duration-300 ${
                        isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                    }`}>
                        <button
                            onClick={() => setStocksViewMode('list')}
                            className={`px-3 py-1 rounded text-sm font-medium transition-all duration-200 ${
                                stocksViewMode === 'list'
                                    ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                                    : (isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')
                            }`}
                        >
                            📋 Liste
                        </button>
                        <button
                            onClick={() => setStocksViewMode('cards')}
                            className={`px-3 py-1 rounded text-sm font-medium transition-all duration-200 ${
                                stocksViewMode === 'cards'
                                    ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                                    : (isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')
                            }`}
                        >
                            🎴 Cartes
                        </button>
                        <button
                            onClick={() => setStocksViewMode('table')}
                            className={`px-3 py-1 rounded text-sm font-medium transition-all duration-200 ${
                                stocksViewMode === 'table'
                                    ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                                    : (isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')
                            }`}
                        >
                            📊 Tableau
                        </button>
                    </div>
                    <button
                        onClick={async () => {
                            await safeRefreshAllStocks();
                            await safeFetchNews();
                            await safeFetchLatestNewsForTickers();
                        }}
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

            {lastUpdate && (
                <p className="text-gray-400 text-sm">
                    Dernière mise à jour: {new Date(lastUpdate).toLocaleString('fr-FR')}
                </p>
            )}

            {/* TOP MOVERS - Vue rapide */}
            {tickers.length > 0 && (
                <div className={`mt-6 p-6 rounded-xl transition-colors duration-300 ${
                    isDarkMode
                        ? 'bg-gradient-to-br from-gray-800/95 to-gray-900/95 border-2 border-gray-600 shadow-xl'
                        : 'bg-gradient-to-br from-white to-gray-50 border-2 border-gray-300 shadow-xl'
                }`}>
                    <h3 className={`text-2xl font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <LucideIcon name="Fire" className="w-7 h-7" style={{ color: 'var(--theme-text)' }} />
                        Top Movers du Jour
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Top Gainers */}
                        <div className={`p-4 sm:p-5 rounded-lg relative overflow-hidden shadow-lg ${
                            isDarkMode 
                                ? 'bg-gradient-to-br from-green-900/70 via-green-800/50 to-gray-800/70 border-2 border-green-400/80' 
                                : 'bg-gradient-to-br from-green-200 via-green-100 to-white border-2 border-green-500'
                        }`}>
                            {/* Bull Image Background - More Visible */}
                            <div className="absolute top-0 right-0 w-40 h-40 opacity-20 pointer-events-none transform rotate-12">
                                <svg viewBox="0 0 200 200" className="w-full h-full">
                                    {/* Bull Head */}
                                    <ellipse cx="100" cy="80" rx="50" ry="40" fill={isDarkMode ? '#10b981' : '#059669'} />
                                    {/* Bull Horns */}
                                    <path d="M60 60 Q50 40, 40 50 Q50 60, 60 70 Z" fill={isDarkMode ? '#10b981' : '#059669'} />
                                    <path d="M140 60 Q150 40, 160 50 Q150 60, 140 70 Z" fill={isDarkMode ? '#10b981' : '#059669'} />
                                    {/* Bull Eyes */}
                                    <circle cx="85" cy="75" r="5" fill="#1f2937" />
                                    <circle cx="115" cy="75" r="5" fill="#1f2937" />
                                    {/* Bull Nose */}
                                    <ellipse cx="100" cy="90" rx="8" ry="6" fill="#1f2937" />
                                    {/* Bull Body */}
                                    <ellipse cx="100" cy="140" rx="45" ry="50" fill={isDarkMode ? '#10b981' : '#059669'} />
                                </svg>
                            </div>
                            
                            {/* Decorative gradient overlay */}
                            <div className={`absolute inset-0 bg-gradient-to-l from-transparent via-transparent ${isDarkMode ? 'to-green-500/5' : 'to-green-100/30'} pointer-events-none`}></div>
                            
                            {/* Pattern overlay for texture */}
                            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
                                backgroundImage: `radial-gradient(circle at 2px 2px, ${isDarkMode ? '#10b981' : '#059669'} 1px, transparent 0)`,
                                backgroundSize: '20px 20px'
                            }}></div>
                            
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className={`text-lg sm:text-base font-bold flex items-center gap-3 ${
                                        isDarkMode ? 'text-green-300' : 'text-green-800'
                                    }`}>
                                        <div className="relative">
                                            <LucideIcon name="TrendingUp" className="w-6 h-6" />
                                        </div>
                                        <span className="drop-shadow-sm">Top Gainers</span>
                                    </h4>
                                    {/* Bull Illustration */}
                                    <div className="flex-shrink-0 relative">
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${
                                            isDarkMode ? 'bg-green-500/30 border-2 border-green-500/50' : 'bg-green-200 border-2 border-green-300'
                                        }`}>
                                            <img src="/assets/bull-icon.svg" alt="Bull" className="w-12 h-12" />
                                        </div>
                                        {/* Glow effect */}
                                        <div className={`absolute inset-0 rounded-full blur-md opacity-30 ${
                                            isDarkMode ? 'bg-green-500' : 'bg-green-400'
                                        }`}></div>
                                    </div>
                                </div>
                            <div className="space-y-2.5 sm:space-y-2">
                                {(teamTickers.length > 0 ? teamTickers : tickers)
                                    .map(ticker => ({
                                        ticker,
                                        change: stockData[ticker]?.dp || 0,
                                        price: stockData[ticker]?.c || 0
                                    }))
                                    .filter(item => item.change > 0 && stockData[item.ticker]) // Filtrer seulement ceux avec données
                                    .sort((a, b) => b.change - a.change)
                                    .slice(0, 5)
                                    .map((item, idx) => (
                                        <div
                                            key={item.ticker}
                                            className={`flex items-start justify-between p-2 sm:p-2 rounded cursor-pointer transition-all hover:scale-[1.02] ${
                                                isDarkMode ? 'hover:bg-green-500/20' : 'hover:bg-green-100'
                                            }`}
                                            onClick={() => {
                                                safeSetSelectedStock(item.ticker);
                                                safeSetActiveTab('jlab');
                                            }}
                                        >
                                            <div className="flex-1 min-w-0 pr-2">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-md ${
                                                        isDarkMode ? 'bg-green-500/50 text-green-100 border border-green-400/50' : 'bg-green-200 text-green-800 border border-green-400'
                                                    }`}>
                                                        {idx + 1}
                                                    </div>
                                                    <img
                                                        src={getCompanyLogo(item.ticker)}
                                                        alt={item.ticker}
                                                        className="w-6 h-6 rounded flex-shrink-0 object-contain bg-gray-800/20"
                                                        onError={(e) => {
                                                            const ticker = item.ticker.split('.')[0].toUpperCase();
                                                            const currentSrc = e.target.src;
                                                            
                                                            // Essayer les fallbacks dans l'ordre
                                                            if (currentSrc.includes('image-stock')) {
                                                                // Essayer format alternatif FMP
                                                                e.target.src = `https://images.financialmodelingprep.com/symbol/${ticker}.png`;
                                                            } else if (currentSrc.includes('financialmodelingprep.com')) {
                                                                // Essayer Companies Logo
                                                                e.target.src = `https://companieslogo.com/img/orig/${ticker}.png`;
                                                            } else if (currentSrc.includes('companieslogo.com')) {
                                                                // Essayer SeekingAlpha
                                                                e.target.src = `https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/${ticker}.svg`;
                                                            } else {
                                                                // Tous les fallbacks ont échoué, masquer l'image
                                                                e.target.style.display = 'none';
                                                            }
                                                        }}
                                                    />
                                                    <span className={`font-mono font-bold text-base ${isDarkMode ? 'text-white' : 'text-gray-900'} flex-shrink-0 drop-shadow-sm`}>
                                                        {item.ticker}
                                                    </span>
                                                    <div className={`font-bold text-base ml-auto flex-shrink-0 ${
                                                        isDarkMode ? 'text-green-400' : 'text-green-600'
                                                    } drop-shadow-sm`}>
                                                        +{item.change.toFixed(2)}% ↑
                                                    </div>
                                                    <div className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} flex-shrink-0 drop-shadow-sm`}>
                                                        ${item.price.toFixed(2)}
                                                    </div>
                                                </div>
                                                
                                                {/* Espace dédié pour les news avec placeholder */}
                                                <div className={`mt-2 ml-8 min-h-[20px] ${isDarkMode ? 'bg-gray-900/40 rounded px-2 py-1' : 'bg-gray-50 rounded px-2 py-1'}`}>
                                                    {(() => {
                                                        const reason = extractMoveReason(item.ticker, item.change);
                                                        if (reason && reason !== '') {
                                                            return (
                                                                <div className={`text-sm font-medium flex items-start gap-2 leading-relaxed ${
                                                                    isDarkMode ? 'text-gray-100' : 'text-gray-900'
                                                                }`}>
                                                                    {tickerMoveReasons[item.ticker]?.source === 'Finviz AI' ? (
                                                                        <span className="inline-flex items-center gap-1.5 flex-wrap">
                                                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex-shrink-0">
                                                                                AI
                                                                            </span>
                                                                            <span className="leading-relaxed break-words">{reason}</span>
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-start gap-1.5">
                                                                            <span className="text-blue-400 flex-shrink-0 text-sm">📰</span>
                                                                            <span className="leading-relaxed break-words">{reason}</span>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        }
                                                        return (
                                                            <div className={`text-sm italic font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                Chargement des explications...
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                            </div>
                        </div>

                        {/* Top Losers */}
                        <div className={`p-4 sm:p-5 rounded-lg relative overflow-hidden shadow-lg ${
                            isDarkMode 
                                ? 'bg-gradient-to-br from-red-900/70 via-red-800/50 to-gray-800/70 border-2 border-red-400/80' 
                                : 'bg-gradient-to-br from-red-200 via-red-100 to-white border-2 border-red-500'
                        }`}>
                            {/* Bear Image Background - More Visible */}
                            <div className="absolute top-0 right-0 w-40 h-40 opacity-20 pointer-events-none transform -rotate-12">
                                <svg viewBox="0 0 200 200" className="w-full h-full">
                                    {/* Bear Head */}
                                    <circle cx="100" cy="90" r="45" fill={isDarkMode ? '#ef4444' : '#dc2626'} />
                                    {/* Bear Ears */}
                                    <circle cx="70" cy="60" r="18" fill={isDarkMode ? '#ef4444' : '#dc2626'} />
                                    <circle cx="130" cy="60" r="18" fill={isDarkMode ? '#ef4444' : '#dc2626'} />
                                    <circle cx="70" cy="60" r="10" fill="#1f2937" />
                                    <circle cx="130" cy="60" r="10" fill="#1f2937" />
                                    {/* Bear Eyes */}
                                    <circle cx="85" cy="85" r="6" fill="#1f2937" />
                                    <circle cx="115" cy="85" r="6" fill="#1f2937" />
                                    {/* Bear Nose */}
                                    <ellipse cx="100" cy="100" rx="6" ry="8" fill="#1f2937" />
                                    {/* Bear Mouth */}
                                    <path d="M100 108 Q95 115, 90 110 Q95 105, 100 108" stroke="#1f2937" strokeWidth="2" fill="none" />
                                    <path d="M100 108 Q105 115, 110 110 Q105 105, 100 108" stroke="#1f2937" strokeWidth="2" fill="none" />
                                    {/* Bear Body */}
                                    <ellipse cx="100" cy="150" rx="50" ry="55" fill={isDarkMode ? '#ef4444' : '#dc2626'} />
                                </svg>
                            </div>
                            
                            {/* Decorative gradient overlay */}
                            <div className={`absolute inset-0 bg-gradient-to-l from-transparent via-transparent ${isDarkMode ? 'to-red-500/5' : 'to-red-100/30'} pointer-events-none`}></div>
                            
                            {/* Pattern overlay for texture */}
                            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
                                backgroundImage: `radial-gradient(circle at 2px 2px, ${isDarkMode ? '#ef4444' : '#dc2626'} 1px, transparent 0)`,
                                backgroundSize: '20px 20px'
                            }}></div>
                            
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className={`text-lg sm:text-base font-bold flex items-center gap-3 ${
                                        isDarkMode ? 'text-red-300' : 'text-red-800'
                                    }`}>
                                        <div className="relative">
                                            <LucideIcon name="TrendingDown" className="w-6 h-6" />
                                        </div>
                                        <span className="drop-shadow-sm">Top Losers</span>
                                    </h4>
                                    {/* Bear Illustration */}
                                    <div className="flex-shrink-0 relative">
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${
                                            isDarkMode ? 'bg-red-500/30 border-2 border-red-500/50' : 'bg-red-200 border-2 border-red-300'
                                        }`}>
                                            <img src="/assets/bear-icon.svg" alt="Bear" className="w-12 h-12" />
                                        </div>
                                        {/* Glow effect */}
                                        <div className={`absolute inset-0 rounded-full blur-md opacity-30 ${
                                            isDarkMode ? 'bg-red-500' : 'bg-red-400'
                                        }`}></div>
                                    </div>
                                </div>
                            <div className="space-y-2">
                                {(teamTickers.length > 0 ? teamTickers : tickers)
                                    .map(ticker => ({
                                        ticker,
                                        change: stockData[ticker]?.dp || 0,
                                        price: stockData[ticker]?.c || 0
                                    }))
                                    .filter(item => item.change < 0 && stockData[item.ticker]) // Filtrer seulement ceux avec données
                                    .sort((a, b) => a.change - b.change)
                                    .slice(0, 5)
                                    .map((item, idx) => (
                                        <div
                                            key={item.ticker}
                                            className={`flex items-start justify-between p-2 rounded cursor-pointer transition-all hover:scale-[1.02] ${
                                                isDarkMode ? 'hover:bg-red-500/20' : 'hover:bg-red-100'
                                            }`}
                                            onClick={() => {
                                                safeSetSelectedStock(item.ticker);
                                                safeSetActiveTab('jlab');
                                            }}
                                        >
                                            <div className="flex-1 min-w-0 pr-2">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-md ${
                                                        isDarkMode ? 'bg-red-500/50 text-red-100 border border-red-400/50' : 'bg-red-200 text-red-800 border border-red-400'
                                                    }`}>
                                                        {idx + 1}
                                                    </div>
                                                    <img
                                                        src={getCompanyLogo(item.ticker)}
                                                        alt={item.ticker}
                                                        className="w-6 h-6 rounded flex-shrink-0 object-contain bg-gray-800/20"
                                                        onError={(e) => {
                                                            const ticker = item.ticker.split('.')[0].toUpperCase();
                                                            const currentSrc = e.target.src;
                                                            
                                                            // Essayer les fallbacks dans l'ordre
                                                            if (currentSrc.includes('image-stock')) {
                                                                // Essayer format alternatif FMP
                                                                e.target.src = `https://images.financialmodelingprep.com/symbol/${ticker}.png`;
                                                            } else if (currentSrc.includes('financialmodelingprep.com')) {
                                                                // Essayer Companies Logo
                                                                e.target.src = `https://companieslogo.com/img/orig/${ticker}.png`;
                                                            } else if (currentSrc.includes('companieslogo.com')) {
                                                                // Essayer SeekingAlpha
                                                                e.target.src = `https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/${ticker}.svg`;
                                                            } else {
                                                                // Tous les fallbacks ont échoué, masquer l'image
                                                                e.target.style.display = 'none';
                                                            }
                                                        }}
                                                    />
                                                    <span className={`font-mono font-bold text-base ${isDarkMode ? 'text-white' : 'text-gray-900'} flex-shrink-0 drop-shadow-sm`}>
                                                        {item.ticker}
                                                    </span>
                                                    <div className={`font-bold text-base ml-auto flex-shrink-0 ${
                                                        isDarkMode ? 'text-red-400' : 'text-red-600'
                                                    } drop-shadow-sm`}>
                                                        {item.change.toFixed(2)}% ↓
                                                    </div>
                                                    <div className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} flex-shrink-0 drop-shadow-sm`}>
                                                        ${item.price.toFixed(2)}
                                                    </div>
                                                </div>
                                                
                                                {/* Espace dédié pour les news avec placeholder */}
                                                <div className={`mt-2 ml-8 min-h-[20px] ${isDarkMode ? 'bg-gray-900/40 rounded px-2 py-1' : 'bg-gray-50 rounded px-2 py-1'}`}>
                                                    {(() => {
                                                        const reason = extractMoveReason(item.ticker, item.change);
                                                        if (reason && reason !== '') {
                                                            return (
                                                                <div className={`text-sm font-medium flex items-start gap-2 leading-relaxed ${
                                                                    isDarkMode ? 'text-gray-100' : 'text-gray-900'
                                                                }`}>
                                                                    {tickerMoveReasons[item.ticker]?.source === 'Finviz AI' ? (
                                                                        <span className="inline-flex items-center gap-1.5 flex-wrap">
                                                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex-shrink-0">
                                                                                AI
                                                                            </span>
                                                                            <span className="leading-relaxed break-words">{reason}</span>
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-start gap-1.5">
                                                                            <span className="text-blue-400 flex-shrink-0 text-sm">📰</span>
                                                                            <span className="leading-relaxed break-words">{reason}</span>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        }
                                                        return (
                                                            <div className={`text-xs italic ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                                Aucune explication disponible
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ANALYSES & OPINIONS D'ANALYSTES */}
            {tickers.length > 0 && Object.keys(stockData).length > 0 && (
                <div className={`mt-6 p-6 rounded-xl transition-colors duration-300 ${
                    isDarkMode
                        ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700'
                        : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
                }`}>
                    <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <LucideIcon name="Target" className="w-6 h-6 text-indigo-500" />
                        Analyses & Opinions d'Analystes
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tickers
                            .map(ticker => {
                                const finnhubData = stockData[ticker];
                                const recommendation = finnhubData?.recommendation?.[0];

                                if (!recommendation) return null;

                                const totalAnalysts = (recommendation.buy || 0) +
                                                    (recommendation.hold || 0) +
                                                    (recommendation.sell || 0) +
                                                    (recommendation.strongBuy || 0) +
                                                    (recommendation.strongSell || 0);

                                if (totalAnalysts === 0) return null;

                                const buyScore = (recommendation.strongBuy || 0) * 2 + (recommendation.buy || 0);
                                const sellScore = (recommendation.strongSell || 0) * 2 + (recommendation.sell || 0);
                                const holdScore = recommendation.hold || 0;

                                let consensus = 'Hold';
                                let consensusColor = 'yellow';
                                if (buyScore > sellScore && buyScore > holdScore) {
                                    consensus = 'Buy';
                                    consensusColor = 'green';
                                } else if (sellScore > buyScore && sellScore > holdScore) {
                                    consensus = 'Sell';
                                    consensusColor = 'red';
                                }

                                return {
                                    ticker,
                                    totalAnalysts,
                                    consensus,
                                    consensusColor,
                                    buyScore,
                                    sellScore,
                                    holdScore,
                                    recommendation
                                };
                            })
                            .filter(item => item !== null)
                            .sort((a, b) => b.totalAnalysts - a.totalAnalysts)
                            .slice(0, 6)
                            .map((item) => (
                                <div
                                    key={item.ticker}
                                    className={`p-4 rounded-lg cursor-pointer transition-all hover:scale-[1.02] ${
                                        isDarkMode
                                            ? 'bg-gray-700/50 hover:bg-gray-700/70 border border-gray-600'
                                            : 'bg-white hover:bg-gray-50 border border-gray-200'
                                    }`}
                                    onClick={() => {
                                        safeSetSelectedStock(item.ticker);
                                        safeSetActiveTab('jlab');
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={getCompanyLogo(item.ticker)}
                                                alt={item.ticker}
                                                className="w-8 h-8 rounded"
                                                onError={(e) => e.target.style.display = 'none'}
                                            />
                                            <span className={`font-mono font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {item.ticker}
                                            </span>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            item.consensusColor === 'green'
                                                ? 'bg-green-500/20 text-green-500 border border-green-500/30'
                                                : item.consensusColor === 'red'
                                                ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                                                : 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'
                                        }`}>
                                            {item.consensus === 'Buy' ? 'ACHAT' : item.consensus === 'Sell' ? 'VENTE' : 'CONSERVER'}
                                        </div>
                                    </div>

                                    <div className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        {item.totalAnalysts} analyste{item.totalAnalysts > 1 ? 's' : ''}
                                    </div>

                                    <div className="space-y-1.5">
                                        {item.recommendation.strongBuy > 0 && (
                                            <div className="flex items-center justify-between text-xs">
                                                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Strong Buy</span>
                                                <span className="font-bold text-green-500">{item.recommendation.strongBuy}</span>
                                            </div>
                                        )}
                                        {item.recommendation.buy > 0 && (
                                            <div className="flex items-center justify-between text-xs">
                                                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Buy</span>
                                                <span className="font-bold text-green-400">{item.recommendation.buy}</span>
                                            </div>
                                        )}
                                        {item.recommendation.hold > 0 && (
                                            <div className="flex items-center justify-between text-xs">
                                                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Hold</span>
                                                <span className="font-bold text-yellow-500">{item.recommendation.hold}</span>
                                            </div>
                                        )}
                                        {item.recommendation.sell > 0 && (
                                            <div className="flex items-center justify-between text-xs">
                                                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Sell</span>
                                                <span className="font-bold text-red-400">{item.recommendation.sell}</span>
                                            </div>
                                        )}
                                        {item.recommendation.strongSell > 0 && (
                                            <div className="flex items-center justify-between text-xs">
                                                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Strong Sell</span>
                                                <span className="font-bold text-red-500">{item.recommendation.strongSell}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className={`mt-3 pt-3 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                                        <div className="flex items-center gap-2">
                                            <LucideIcon name="ArrowUpRight" className="w-3 h-3 text-gray-400" />
                                            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                Cliquer pour analyse complète
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>

                    {tickers.filter(ticker => {
                        const finnhubData = stockData[ticker];
                        const recommendation = finnhubData?.recommendation?.[0];
                        return recommendation && (
                            (recommendation.buy || 0) +
                            (recommendation.hold || 0) +
                            (recommendation.sell || 0) +
                            (recommendation.strongBuy || 0) +
                            (recommendation.strongSell || 0)
                        ) > 0;
                    }).length === 0 && (
                        <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <LucideIcon name="AlertCircle" className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Aucune recommandation d'analyste disponible pour le moment</p>
                            <p className="text-sm mt-2">Les données seront chargées lors de la prochaine actualisation</p>
                        </div>
                    )}
                </div>
            )}

            {/* Debug des données déplacé vers Admin-JSLAI */}

            {/* Vue LIST - Compacte */}
            {stocksViewMode === 'list' && (
                <div className="mt-8">
                    <div className={`backdrop-blur-sm rounded-2xl p-8 border-2 shadow-2xl transition-colors duration-300 ${
                        isDarkMode
                            ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-blue-500/30 shadow-blue-500/10'
                            : 'bg-gradient-to-br from-white/95 to-gray-50/95 border-blue-400/40 shadow-blue-400/10'
                    }`}>
                        <h2 className={`text-2xl font-bold mb-6 transition-colors duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>📊 Titres - Vue Liste</h2>

                        {tickers.length === 0 ? (
                            <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <p className="text-lg font-semibold mb-2">Aucun titre disponible</p>
                                <p className="text-sm">Les données sont en cours de chargement...</p>
                            </div>
                        ) : Object.keys(stockData).length === 0 ? (
                            <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <p className="text-lg font-semibold mb-2">Chargement des données de marché...</p>
                                <p className="text-sm">Veuillez patienter quelques instants</p>
                            </div>
                        ) : (
                        <div className="space-y-3">
                            {tickers.map((ticker) => {
                                const data = stockData[ticker] || {};
                                const price = data.c || data.price || 0;
                                const change = data.d || data.change || 0;
                                const changePercent = data.dp || data.changePercent || 0;
                                const isPositive = changePercent >= 0;

                                return (
                                    <div
                                        key={ticker}
                                        className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.01] ${
                                            isDarkMode
                                                ? 'bg-gray-700/50 hover:bg-gray-700/70 border border-gray-600'
                                                : 'bg-white hover:bg-gray-50 border border-gray-200'
                                        }`}
                                        onClick={() => {
                                            safeSetSelectedStock(ticker);
                                            safeSetActiveTab('jlab');
                                        }}
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <img
                                                src={getCompanyLogo(ticker)}
                                                alt={ticker}
                                                className="w-12 h-12 rounded-lg"
                                                onError={(e) => e.target.style.display = 'none'}
                                            />
                                            <div className="flex-1">
                                                <div className={`font-mono font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    {ticker}
                                                </div>
                                                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {companyNames[ticker] || ticker}
                                                </div>
                                                
                                                {/* Espace dédié pour les news avec extractMoveReason */}
                                                <div className={`mt-2 min-h-[20px] ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {extractMoveReason(ticker, changePercent) ? (
                                                        <div className={`text-xs flex items-start gap-2 ${
                                                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                        }`}>
                                                            {tickerMoveReasons[ticker]?.source === 'Finviz AI' ? (
                                                                <span className="inline-flex items-center gap-1.5 flex-wrap">
                                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex-shrink-0">
                                                                        AI
                                                                    </span>
                                                                    <span className="leading-relaxed">{extractMoveReason(ticker, changePercent)}</span>
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-start gap-1.5">
                                                                    <span className="text-blue-400 flex-shrink-0">📰</span>
                                                                    <span className="leading-relaxed">{extractMoveReason(ticker, changePercent)}</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : tickerLatestNews[ticker] ? (
                                                        <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                                            📰 <span className="italic">{tickerLatestNews[ticker].title.length > 70 ? tickerLatestNews[ticker].title.substring(0, 70) + '...' : tickerLatestNews[ticker].title}</span>
                                                        </div>
                                                    ) : (
                                                        <div className={`text-xs italic ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                                            Chargement des explications...
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className={`font-bold text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                ${price.toFixed(2)}
                                            </div>
                                            <div className={`font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                                {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                                            </div>
                                            </div>
                                        </div>
                                    );
                            })}
                        </div>
                        )}
                    </div>
                </div>
            )}

            {/* Vue CARDS - Visuelle */}
            {stocksViewMode === 'cards' && (
                <div className="mt-8">
                    <div className={`backdrop-blur-sm rounded-2xl p-8 border-2 shadow-2xl transition-colors duration-300 ${
                        isDarkMode
                            ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-blue-500/30 shadow-blue-500/10'
                            : 'bg-gradient-to-br from-white/95 to-gray-50/95 border-blue-400/40 shadow-blue-400/10'
                    }`}>
                        <h2 className={`text-2xl font-bold mb-6 transition-colors duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>🎴 Titres - Vue Cartes</h2>

                        {tickers.length === 0 ? (
                            <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <p className="text-lg font-semibold mb-2">Aucun titre disponible</p>
                                <p className="text-sm">Les données sont en cours de chargement...</p>
                            </div>
                        ) : Object.keys(stockData).length === 0 ? (
                            <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <p className="text-lg font-semibold mb-2">Chargement des données de marché...</p>
                                <p className="text-sm">Veuillez patienter quelques instants</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {tickers.map((ticker) => {
                                const data = stockData[ticker] || {};
                                const price = data.c || data.price || 0;
                                const change = data.d || data.change || 0;
                                const changePercent = data.dp || data.changePercent || 0;
                                const high = data.h || 0;
                                const low = data.l || 0;
                                const volume = data.v || 0;
                                const isPositive = changePercent >= 0;

                                return (
                                    <div
                                        key={ticker}
                                        className={`p-6 rounded-xl cursor-pointer transition-all hover:scale-[1.02] ${
                                            isDarkMode
                                                ? 'bg-gradient-to-br from-gray-700/50 to-gray-800/50 hover:from-gray-700/70 hover:to-gray-800/70 border border-gray-600'
                                                : 'bg-gradient-to-br from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 border border-gray-200 shadow-lg'
                                        }`}
                                        onClick={() => {
                                            safeSetSelectedStock(ticker);
                                            safeSetActiveTab('jlab');
                                        }}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={getCompanyLogo(ticker)}
                                                    alt={ticker}
                                                    className="w-14 h-14 rounded-xl"
                                                    onError={(e) => e.target.style.display = 'none'}
                                                />
                                                <div className="flex-1">
                                                    <div className={`font-mono font-bold text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                        {ticker}
                                                    </div>
                                                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        {companyNames[ticker] || ticker}
                                                    </div>
                                                    
                                                    {/* Espace dédié pour les news avec extractMoveReason */}
                                                    <div className={`mt-2 min-h-[24px] ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        {extractMoveReason(ticker, changePercent) ? (
                                                            <div className={`text-xs flex items-start gap-2 ${
                                                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                            }`}>
                                                                {tickerMoveReasons[ticker]?.source === 'Finviz AI' ? (
                                                                    <span className="inline-flex items-center gap-1.5 flex-wrap">
                                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex-shrink-0">
                                                                            AI
                                                                        </span>
                                                                        <span className="leading-relaxed">{extractMoveReason(ticker, changePercent)}</span>
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-start gap-1.5">
                                                                        <span className="text-blue-400 flex-shrink-0">📰</span>
                                                                        <span className="leading-relaxed">{extractMoveReason(ticker, changePercent)}</span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : tickerLatestNews[ticker] ? (
                                                            <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                                                📰 <span className="italic">{tickerLatestNews[ticker].title.length > 60 ? tickerLatestNews[ticker].title.substring(0, 60) + '...' : tickerLatestNews[ticker].title}</span>
                                                            </div>
                                                        ) : (
                                                            <div className={`text-xs italic ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                                Aucune explication disponible
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                isPositive
                                                    ? 'bg-green-500/20 text-green-500 border border-green-500/30'
                                                    : 'bg-red-500/20 text-red-500 border border-red-500/30'
                                            }`}>
                                                {isPositive ? '▲' : '▼'}
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <div className={`text-3xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                ${price.toFixed(2)}
                                            </div>
                                            <div className={`text-lg font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                                {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
                                            </div>
                                        </div>

                                        <div className={`grid grid-cols-2 gap-2 pt-4 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                                            <div>
                                                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Haut</div>
                                                <div className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>${high.toFixed(2)}</div>
                                            </div>
                                            <div>
                                                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Bas</div>
                                                <div className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>${low.toFixed(2)}</div>
                                            </div>
                                            <div className="col-span-2">
                                                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Volume</div>
                                                <div className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatNumber(volume)}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Section Données Financières & Actualités (Finnhub) - PRINCIPALE */}
            {stocksViewMode === 'table' && (
            <div className="mt-8">
                <div className={`backdrop-blur-sm rounded-2xl p-8 border-2 shadow-2xl transition-colors duration-300 ${
                    isDarkMode 
                        ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-blue-500/30 shadow-blue-500/10' 
                        : 'bg-gradient-to-br from-white/95 to-gray-50/95 border-blue-400/40 shadow-blue-400/10'
                }`}>
                    <div className="text-center mb-6">
                        <h2 className={`text-2xl font-bold mb-3 transition-colors duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                            📊 Données Financières & Actualités
                        </h2>
                        <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${
                            isDarkMode 
                                ? 'bg-gray-600/20 text-gray-300 border border-gray-500/30' 
                                : 'bg-gray-700/80 text-gray-200 border border-gray-600/50'
                        }`}>
                            <span className="mr-2">🔗</span>
                            Source: Finnhub API
                        </div>
                        <p className={`text-sm mt-3 transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                            Données en temps réel avec 3 actualités par titre
                        </p>
                    </div>
                    <div className="overflow-x-auto max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800 relative text-sm">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className={`border-b-2 transition-colors duration-300 ${
                                    isDarkMode ? 'border-blue-500/50 bg-gray-900' : 'border-blue-400/50 bg-gray-100'
                                }`}>
                                    <th className={`text-left py-2 px-3 font-bold transition-colors duration-300 ${
                                        isDarkMode ? 'text-blue-300' : 'text-blue-700'
                                    }`}>📈 Ticker</th>
                                    <th className={`text-left py-2 px-3 font-bold transition-colors duration-300 ${
                                        isDarkMode ? 'text-blue-300' : 'text-blue-700'
                                    }`}>💰 Prix</th>
                                    <th className={`text-left py-2 px-3 font-bold transition-colors duration-300 ${
                                        isDarkMode ? 'text-blue-300' : 'text-blue-700'
                                    }`}>📊 Change</th>
                                    <th className={`text-left py-2 px-3 font-bold transition-colors duration-300 ${
                                        isDarkMode ? 'text-blue-300' : 'text-blue-700'
                                    }`}>📈 P/E</th>
                                    <th className={`text-left py-2 px-3 font-bold transition-colors duration-300 ${
                                        isDarkMode ? 'text-blue-300' : 'text-blue-700'
                                    }`}>💎 Dividende</th>
                                    <th className={`text-left py-2 px-3 font-bold transition-colors duration-300 ${
                                        isDarkMode ? 'text-blue-300' : 'text-blue-700'
                                    }`}>🏢 Secteur</th>
                                    <th className={`text-left py-2 px-3 font-bold transition-colors duration-300 ${
                                        isDarkMode ? 'text-blue-300' : 'text-blue-700'
                                    }`}>⭐ Rating</th>
                                    <th className={`text-left py-2 px-3 font-bold transition-colors duration-300 ${
                                        isDarkMode ? 'text-blue-300' : 'text-blue-700'
                                    }`}>😊 Sentiment</th>
                                    <th className={`text-left py-2 px-3 font-bold transition-colors duration-300 ${
                                        isDarkMode ? 'text-blue-300' : 'text-blue-700'
                                    }`}>⚡ Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickers.map(ticker => {
                                    // Données de Finnhub uniquement
                                    const finnhubData = stockData[ticker];
                                    const price = finnhubData?.c ? `$${finnhubData.c.toFixed(2)}` : 'N/A';
                                    const change = finnhubData?.d ? `${finnhubData.d > 0 ? '+' : ''}${finnhubData.d.toFixed(2)}` : 'N/A';
                                    const changePercent = finnhubData?.dp ? `${finnhubData.dp > 0 ? '+' : ''}${finnhubData.dp.toFixed(2)}%` : 'N/A';
                                    const changeColor = finnhubData?.d > 0 ? 'text-green-400' : finnhubData?.d < 0 ? 'text-red-400' : 'text-gray-400';
                                    
                                    // Données de profil Finnhub
                                    const profile = finnhubData?.profile;
                                    const fundamentals = finnhubData?.fundamentals;
                                    const peRatio = fundamentals?.peRatio
                                        ? (Number.isFinite(fundamentals.peRatio) ? fundamentals.peRatio.toFixed(2) : fundamentals.peRatio)
                                        : (profile?.pe ? profile.pe.toFixed(2) : 'N/A');
                                    const dividendYield = fundamentals?.dividendYield
                                        ? `${(Number(fundamentals.dividendYield) * 100).toFixed(2)}%`
                                        : (profile?.dividend ? `${(profile.dividend * 100).toFixed(2)}%` : 'N/A');
                                    const sector = fundamentals?.sector || profile?.industry || 'N/A';
                                    
                                    // Données de recommandation Finnhub
                                    const recommendation = finnhubData?.recommendation;
                                    const rating = recommendation?.length > 0 ? 
                                        (recommendation[0].buy + recommendation[0].strongBuy > recommendation[0].sell + recommendation[0].strongSell ? 'Achat' : 
                                         recommendation[0].sell + recommendation[0].strongSell > recommendation[0].buy + recommendation[0].strongBuy ? 'Vente' : 'Neutre') : 'N/A';
                                    
                                    // 2 actualités les plus crédibles pour ce ticker
                                    const tickerNews = sortNewsByCredibility(
                                        newsData.filter(article => {
                                        const text = (article.title + ' ' + article.description).toLowerCase();
                                        return text.includes(ticker.toLowerCase());
                                        })
                                    ).slice(0, 2);
                                    
                                    // Analyse du sentiment
                                    const analyzeSentiment = (title, description) => {
                                        const text = (title + ' ' + description).toLowerCase();
                                        const positiveWords = ['hausse', 'croissance', 'gain', 'profit', 'positif', 'amélioration', 'succès', 'fort', 'solide'];
                                        const negativeWords = ['baisse', 'chute', 'perte', 'négatif', 'déclin', 'faible', 'problème', 'risque', 'inquiétude'];
                                        
                                        const positiveCount = positiveWords.filter(word => text.includes(word)).length;
                                        const negativeCount = negativeWords.filter(word => text.includes(word)).length;
                                        
                                        if (positiveCount > negativeCount) return { sentiment: 'Positif', color: 'text-green-400' };
                                        if (negativeCount > positiveCount) return { sentiment: 'Négatif', color: 'text-red-400' };
                                        return { sentiment: 'Neutre', color: 'text-gray-400' };
                                    };
                                    
                                    const sentiment = tickerNews.length > 0 ? analyzeSentiment(tickerNews[0].title, tickerNews[0].description) : { sentiment: 'N/A', color: 'text-gray-400' };
                                    
                                    return (
                                        <React.Fragment key={ticker}>
                                            {/* Ligne principale - STYLE PRINCIPAL */}
                                            <tr className={`border-b-2 transition-all duration-300 hover:scale-[1.02] ${
                                                isDarkMode 
                                                    ? 'border-gray-600/50 hover:bg-gradient-to-r hover:from-gray-800/80 hover:to-gray-700/80 hover:shadow-lg hover:shadow-blue-500/10' 
                                                    : 'border-gray-300/50 hover:bg-gradient-to-r hover:from-gray-50/80 hover:to-white/80 hover:shadow-lg hover:shadow-blue-400/10'
                                            }`}>
                                                <td className="py-4 px-3">
                                                    <div className="flex items-center gap-3">
                                                        <img 
                                                            src={getCompanyLogo(ticker)} 
                                                            alt={`${ticker} logo`}
                                                            className="w-8 h-8 rounded-lg shadow-md"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                            }}
                                                        />
                                                        <span className={`font-mono font-bold text-xl transition-colors duration-300 ${
                                                            isDarkMode ? 'text-white' : 'text-gray-900'
                                                        }`}>{ticker}</span>
                                                    </div>
                                                </td>
                                                <td className={`py-2 px-3 font-bold transition-colors duration-300 ${
                                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                                }`}>{price}</td>
                                                <td className={`py-2 px-3 font-semibold transition-colors duration-300 ${changeColor}`}>
                                                    {change} ({changePercent})
                                                </td>
                                                <td className={`py-2 px-3 font-medium transition-colors duration-300 ${
                                                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                                }`}>{peRatio}</td>
                                                <td className={`py-2 px-3 font-medium transition-colors duration-300 ${
                                                    isDarkMode ? 'text-green-300' : 'text-green-600'
                                                }`}>{dividendYield}</td>
                                                <td className={`py-2 px-3 text-sm transition-colors duration-300 ${
                                                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                                }`}>{cleanTextUtil(sector)}</td>
                                                <td className="py-4 px-3">
                                                    <span className={`px-4 py-2 rounded-full text-sm font-bold transition-colors duration-300 ${
                                                        rating === 'Achat' ? 'bg-green-500 text-white' :
                                                        rating === 'Vente' ? 'bg-red-500 text-white' :
                                                        'bg-yellow-500 text-black'
                                                    }`}>
                                                        {rating}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-3">
                                                    <div className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors duration-300 ${
                                                        sentiment.sentiment === 'Positif' ? 'bg-green-100 text-green-800' :
                                                        sentiment.sentiment === 'Négatif' ? 'bg-red-100 text-red-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        <span className="text-lg">
                                                            {sentiment.sentiment === 'Positif' ? '😊' : 
                                                             sentiment.sentiment === 'Négatif' ? '😟' : '😐'}
                                                        </span>
                                                        <span className="font-semibold">{sentiment.sentiment}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-3">
                                                    <button
                                                        onClick={() => {
                                                            safeSetSelectedStock(ticker);
                                                            safeSetActiveTab('jlab');
                                                        }}
                                                        className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-300 hover:scale-[1.02] shadow ${
                                                            isDarkMode
                                                                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-blue-500/25'
                                                                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white shadow-blue-400/25'
                                                        }`}
                                                    >
                                                        📊 Voir dans JLab
                                                    </button>
                                                </td>
                                            </tr>

                                            {/* Ligne Finviz - Ce qui bouge (si disponible) */}
                                            {finvizNews[ticker] && (
                                                <tr className={`border-b-2 transition-all duration-300 ${
                                                    isDarkMode
                                                        ? 'border-purple-500/30 bg-gradient-to-r from-purple-900/20 to-indigo-900/20 hover:from-purple-900/30 hover:to-indigo-900/30'
                                                        : 'border-purple-400/30 bg-gradient-to-r from-purple-50/60 to-indigo-50/60 hover:from-purple-100/80 hover:to-indigo-100/80'
                                                }`}>
                                                    <td colSpan="9" className="py-4 px-4">
                                                        <div className="flex items-start gap-3">
                                                            {/* Icône étoile (sparkles) */}
                                                            <div className={`p-2 rounded-full ${
                                                                isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'
                                                            }`}>
                                                                <LucideIcon name="Sparkles" className="w-5 h-5 text-purple-500" />
                                                            </div>

                                                            {/* Contenu */}
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                                                        isDarkMode ? 'bg-purple-500/30 text-purple-300' : 'bg-purple-200 text-purple-700'
                                                                    }`}>
                                                                        🔥 CE QUI BOUGE
                                                                    </span>
                                                                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                        {finvizNews[ticker].date}
                                                                    </span>
                                                                </div>
                                                                <p className={`text-sm font-medium leading-relaxed ${
                                                                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                                                                }`}>
                                                                    {finvizNews[ticker].headline}
                                                                </p>
                                                                {finvizNews[ticker].link && (
                                                                    <a
                                                                        href={finvizNews[ticker].link}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className={`text-xs mt-2 inline-flex items-center gap-1 hover:underline ${
                                                                            isDarkMode ? 'text-purple-400' : 'text-purple-600'
                                                                        }`}
                                                                    >
                                                                        <LucideIcon name="ExternalLink" className="w-3 h-3" />
                                                                        Lire l'article complet
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}

                                            {/* Lignes d'actualités (3 maximum) - STYLE AMÉLIORÉ */}
                                            {tickerNews.map((news, newsIndex) => (
                                                <tr key={`${ticker}-news-${newsIndex}`} className={`border-b-2 transition-all duration-300 hover:scale-[1.01] ${
                                                    isDarkMode 
                                                        ? 'border-gray-600/30 bg-gradient-to-r from-gray-800/40 to-gray-700/40 hover:from-gray-700/60 hover:to-gray-600/60' 
                                                        : 'border-gray-300/30 bg-gradient-to-r from-gray-50/60 to-white/60 hover:from-gray-100/80 hover:to-gray-50/80'
                                                }`}>
                                                    <td colSpan="9" className="py-6 px-4">
                                                        <div className={`transition-colors duration-300 ${
                                                            isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                                        }`}>
                                                            <div className="flex items-start gap-4">
                                                                {(() => {
                                                                    const newsIconData = getNewsIconUtil(news.title, news.description, news.sentiment);
                                                                    return (
                                                                <div className={`p-3 rounded-full transition-colors duration-300 ${
                                                                            isDarkMode ? 'bg-gray-600/20' : 'bg-gray-200/60'
                                                                }`}>
                                                                            <LucideIcon name={newsIconData.icon} className={`w-6 h-6 ${newsIconData.color}`} />
                                                                </div>
                                                                    );
                                                                })()}
                                                                <div className="flex-1">
                                                                    <h5 className={`font-bold text-lg mb-3 transition-colors duration-300 ${
                                                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                                                    }`}>
                                                                        {news.url ? (
                                                                            <a 
                                                                                href={news.url} 
                                                                                target="_blank" 
                                                                                rel="noopener noreferrer"
                                                                                className={`hover:underline transition-colors duration-300 ${
                                                                                    isDarkMode 
                                                                                        ? 'text-blue-300 hover:text-blue-200' 
                                                                                        : 'text-blue-600 hover:text-blue-700'
                                                                                }`}
                                                                            >
                                                                                {cleanTextUtil(news.title)}
                                                                            </a>
                                                                        ) : (
                                                                            cleanTextUtil(news.title)
                                                                        )}
                                                                    </h5>
                                                                    <p className={`text-base mb-4 leading-relaxed transition-colors duration-300 ${
                                                                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                                                    }`}>
                                                                        {cleanTextUtil(news.description)}
                                                                    </p>
                                                                    <div className={`flex items-center gap-4 text-sm transition-colors duration-300 ${
                                                                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                                                    }`}>
                                                                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full transition-colors duration-300 ${
                                                                            isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                                                                        }`}>
                                                                            <span className="font-semibold">{news.source?.name || 'Source inconnue'}</span>
                                                                        </div>
                                                                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full transition-colors duration-300 ${
                                                                            isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                                                                        }`}>
                                                                            <span>🕒</span>
                                                                            <span>
                                                                                {news.publishedAt ? 
                                                                                    new Date(news.publishedAt).toLocaleString('fr-FR') : 
                                                                                    'Date inconnue'
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                        {news.url && (
                                                                            <a 
                                                                                href={news.url} 
                                                                                target="_blank" 
                                                                                rel="noopener noreferrer"
                                                                                className={`px-4 py-2 rounded-full font-semibold transition-all duration-300 hover:scale-105 ${
                                                                                    isDarkMode 
                                                                                        ? 'bg-gray-800 hover:bg-gray-700 text-white shadow-lg shadow-gray-500/25' 
                                                                                        : 'bg-gray-700 hover:bg-gray-600 text-white shadow-lg shadow-gray-400/25'
                                                                                }`}
                                                                            >
                                                                                📖 Lire l'article
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className={`text-center mt-8 p-6 rounded-xl transition-colors duration-300 ${
                        isDarkMode 
                            ? 'bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/20' 
                            : 'bg-gradient-to-r from-blue-100/80 to-purple-100/80 border border-blue-300/30'
                    }`}>
                        <div className={`text-lg font-semibold mb-2 transition-colors duration-300 ${
                            isDarkMode ? 'text-blue-300' : 'text-blue-700'
                        }`}>
                            📜 Section Principale - Données Financières
                        </div>
                        <div className={`text-sm transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                            Faites défiler pour voir toutes les données • Source: Finnhub API • 3 actualités par titre
                        </div>
                        <div className={`text-xs mt-2 transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                            Données mises à jour automatiquement toutes les 5 minutes
                        </div>
                    </div>
                </div>
            </div>
            )}

            {/* BUG #3 FIX: EmptyState amélioré pour Portfolio */}
            {tickers.length === 0 && (
                <div className={`flex flex-col items-center justify-center min-h-[400px] p-8 rounded-xl border-2 transition-colors duration-300 ${
                    isDarkMode
                        ? 'bg-gray-800/50 border-dashed border-gray-700'
                        : 'bg-gray-50 border-dashed border-gray-300'
                }`}>
                    <div className="text-6xl mb-4 opacity-60">📊</div>
                    <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {tickerSource === 'portfolio' 
                            ? 'Aucun titre dans votre portfolio'
                            : tickerSource === 'watchlist'
                            ? 'Aucun titre dans votre watchlist'
                            : 'Aucun ticker configuré'}
                    </h3>
                    <p className={`text-sm text-center max-w-md mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {tickerSource === 'portfolio'
                            ? 'Ajoutez des actions à votre portfolio pour commencer le suivi de vos investissements.'
                            : tickerSource === 'watchlist'
                            ? 'Ajoutez des titres à votre watchlist pour suivre leurs performances.'
                            : 'Ajoutez des tickers dans l\'onglet Seeking Alpha pour voir les données ici.'}
                    </p>
                    {tickerSource === 'portfolio' && (
                        <button
                            onClick={() => {
                                if (typeof safeSetActiveTab === 'function') {
                                    safeSetActiveTab('titres-seeking');
                                } else if (typeof setActiveTab === 'function') {
                                    setActiveTab('titres-seeking');
                                }
                            }}
                            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                                isDarkMode
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                            }`}
                        >
                            Ajouter un titre
                        </button>
                    )}
                </div>
            )}

            {/* ===== SECTION ACTUALITÉS SÉPARÉE ===== */}
            {newsData.length > 0 && (
                <div className="mt-12">
                    <div className={`backdrop-blur-md rounded-3xl p-8 md:p-10 border-2 shadow-2xl transition-all duration-300 relative overflow-hidden ${
                        isDarkMode
                            ? 'bg-gradient-to-br from-gray-800/95 via-gray-800/90 to-gray-900/95 border-purple-500/40 shadow-purple-500/20'
                            : 'bg-gradient-to-br from-white/98 via-white/95 to-gray-50/98 border-purple-400/50 shadow-purple-400/20'
                    }`}>
                        {/* Pattern de fond décoratif */}
                        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
                            backgroundImage: `radial-gradient(circle at 2px 2px, ${isDarkMode ? '#a855f7' : '#9333ea'} 1px, transparent 0)`,
                            backgroundSize: '40px 40px'
                        }}></div>
                        
                        {/* Gradient overlay */}
                        <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none ${
                            isDarkMode ? 'bg-purple-500' : 'bg-purple-300'
                        }`} style={{
                            transform: 'translate(30%, -30%)'
                        }}></div>
                        
                        <div className="relative z-10">
                            {/* Header amélioré */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl ${
                                        isDarkMode 
                                            ? 'bg-gradient-to-br from-purple-600/30 to-purple-500/20 border border-purple-500/30' 
                                            : 'bg-gradient-to-br from-purple-100 to-purple-50 border border-purple-200'
                                    }`}>
                                        <span className="text-3xl">📰</span>
                                    </div>
                                    <div>
                                        <h2 className={`text-3xl md:text-4xl font-black transition-colors duration-300 mb-1 ${
                                            isDarkMode ? 'text-white' : 'text-gray-900'
                                        }`} style={{
                                            fontFamily: "'Avenir Pro 85 Heavy', 'Avenir Next', 'Avenir', 'Montserrat', 'Inter', sans-serif",
                                            fontWeight: 900,
                                            letterSpacing: '-0.02em'
                                        }}>
                                            Actualités du Marché
                                        </h2>
                                        <p className={`text-sm transition-colors duration-300 ${
                                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                            Dernières nouvelles financières en temps réel
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 shadow-lg ${
                                        isDarkMode
                                            ? 'bg-gradient-to-r from-purple-600/40 to-purple-500/30 text-purple-200 border-2 border-purple-500/50 shadow-purple-500/20'
                                            : 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 border-2 border-purple-300 shadow-purple-200/50'
                                    }`}>
                                        <span className="text-lg mr-2">📊</span>
                                        {newsData.length} articles
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {newsData.slice(0, 12).map((article, index) => {
                                    const credibilityScore = getNewsCredibilityScore(article.source?.name || '');
                                    const credibilityTier = getCredibilityTier(credibilityScore);

                                    return (
                                        <div
                                            key={index}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => {
                                                if (article.url) {
                                                    window.open(article.url, '_blank', 'noopener,noreferrer');
                                                }
                                            }}
                                            onKeyDown={(event) => {
                                                if ((event.key === 'Enter' || event.key === ' ') && article.url) {
                                                    event.preventDefault();
                                                    window.open(article.url, '_blank', 'noopener,noreferrer');
                                                }
                                            }}
                                            className={`group relative p-6 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 overflow-hidden ${
                                                isDarkMode
                                                    ? 'bg-gradient-to-br from-gray-700/60 via-gray-800/60 to-gray-900/60 hover:from-gray-700/80 hover:via-gray-800/80 hover:to-gray-900/80 border border-gray-600/50 hover:border-purple-500/50 shadow-xl'
                                                    : 'bg-gradient-to-br from-white via-gray-50/50 to-white hover:from-gray-50 hover:via-white hover:to-gray-50 border border-gray-200/80 hover:border-purple-300/80 shadow-xl hover:shadow-2xl'
                                            }`}
                                            style={{
                                                animation: `fadeInUp 0.5s ease-out ${index * 0.05}s both`
                                            }}
                                        >
                                            {/* Effet de brillance au hover */}
                                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                                                isDarkMode 
                                                    ? 'bg-gradient-to-r from-transparent via-purple-500/10 to-transparent' 
                                                    : 'bg-gradient-to-r from-transparent via-purple-200/20 to-transparent'
                                            }`} style={{
                                                transform: 'translateX(-100%)',
                                                animation: 'shimmer 2s infinite'
                                            }}></div>
                                            
                                            {/* Indicateur de crédibilité coloré à gauche */}
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${
                                                credibilityTier === 'premium'
                                                    ? 'bg-gradient-to-b from-yellow-400 to-yellow-600'
                                                    : credibilityTier === 'high'
                                                    ? 'bg-gradient-to-b from-green-400 to-green-600'
                                                    : credibilityTier === 'medium'
                                                    ? 'bg-gradient-to-b from-blue-400 to-blue-600'
                                                    : credibilityTier === 'low'
                                                    ? 'bg-gradient-to-b from-gray-400 to-gray-600'
                                                    : 'bg-gradient-to-b from-red-400 to-red-600'
                                            }`}></div>
                                            
                                            <div className="relative z-10">
                                                {/* Source et crédibilité */}
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
                                                        credibilityTier === 'premium'
                                                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 shadow-lg shadow-yellow-500/20'
                                                            : credibilityTier === 'high'
                                                            ? 'bg-green-500/20 text-green-400 border border-green-500/40 shadow-lg shadow-green-500/20'
                                                            : credibilityTier === 'medium'
                                                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-lg shadow-blue-500/20'
                                                            : credibilityTier === 'low'
                                                            ? 'bg-gray-500/20 text-gray-400 border border-gray-500/40'
                                                            : 'bg-red-500/20 text-red-400 border border-red-500/40'
                                                    }`}>
                                                        {article.source?.name || 'Source inconnue'}
                                                    </div>
                                                    <div className={`text-xs font-medium px-2 py-1 rounded-md ${
                                                        isDarkMode 
                                                            ? 'bg-gray-700/50 text-gray-300' 
                                                            : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                        {new Date(article.publishedAt).toLocaleDateString('fr-FR', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Titre */}
                                                <h3 className={`font-bold text-lg md:text-xl mb-3 line-clamp-2 transition-colors duration-300 leading-tight group-hover:text-purple-400 ${
                                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                                }`}>
                                                    {article.title}
                                                </h3>

                                                {/* Description */}
                                                {article.description && (
                                                    <p className={`text-sm mb-5 line-clamp-3 transition-colors duration-300 leading-relaxed ${
                                                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                                    }`}>
                                                        {article.description}
                                                    </p>
                                                )}

                                                {/* Actions */}
                                                <div className="flex gap-2 mt-5">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setExpandedArticle(article);
                                                        }}
                                                        className={`flex-1 px-4 py-2.5 rounded-xl text-center text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl ${
                                                            isDarkMode
                                                                ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white'
                                                                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                                                        }`}
                                                    >
                                                        <IconoirIcon name="Expand" className="w-4 h-4 inline mr-1.5" />
                                                        Expand
                                                    </button>
                                                    <a
                                                        href={article.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className={`px-4 py-2.5 rounded-xl text-center text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl ${
                                                            isDarkMode
                                                                ? 'bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white'
                                                                : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white'
                                                        }`}
                                                        title="Ouvrir dans un nouvel onglet"
                                                    >
                                                        <IconoirIcon name="ExternalLink" className="w-4 h-4 inline" />
                                                    </a>
                                                    <button
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            summarizeWithEmma(article.url, article.title);
                                                        }}
                                                        className={`flex-1 px-4 py-2.5 rounded-xl text-center text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl ${
                                                            isDarkMode
                                                                ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white'
                                                                : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white'
                                                        }`}
                                                    >
                                                        <IconoirIcon name="Brain" className="w-4 h-4 inline mr-1.5" />
                                                        Emma
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Modal pour afficher l'article dans une iframe */}
                            {expandedArticle && (
                                <div 
                                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm"
                                    onClick={() => setExpandedArticle(null)}
                                >
                                    <div 
                                        className={`w-full h-full max-w-7xl max-h-[90vh] m-4 rounded-xl shadow-2xl overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* Header */}
                                        <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                                            <div className="flex-1 min-w-0 pr-4">
                                                <h3 className={`text-lg font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    {expandedArticle.title}
                                                </h3>
                                                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {expandedArticle.source?.name || 'Source inconnue'} • {new Date(expandedArticle.publishedAt).toLocaleDateString('fr-FR', {
                                                        month: 'long',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setExpandedArticle(null)}
                                                className={`p-2 rounded-lg transition-colors ${isDarkMode 
                                                    ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                                                    : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                                                }`}
                                                aria-label="Fermer"
                                            >
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                        
                                        {/* Iframe Content - Chargé seulement quand la modal est ouverte */}
                                        <div className="relative w-full h-[calc(90vh-80px)]">
                                            {expandedArticle.url ? (
                                                <iframe
                                                    src={expandedArticle.url}
                                                    className="w-full h-full border-0"
                                                    allow="fullscreen"
                                                    allowTransparency="true"
                                                    title={expandedArticle.title}
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className={`flex items-center justify-center h-full ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    <p>URL de l'article non disponible</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {newsData.length > 12 && (
                                <div className="text-center mt-8">
                                    <button
                                        onClick={() => safeSetActiveTab('markets-economy')}
                                        className={`px-8 py-4 rounded-xl font-bold text-base transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 ${
                                            isDarkMode
                                                ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white border-2 border-purple-400/50'
                                                : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-2 border-purple-300/50'
                                        }`}
                                    >
                                        <span className="mr-2">📰</span>
                                        Voir toutes les actualités ({newsData.length})
                                        <span className="ml-2">→</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

if (typeof window !== 'undefined') {
    window.StocksNewsTab = StocksNewsTab;
}
