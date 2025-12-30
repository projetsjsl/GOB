// Auto-converted from monolithic dashboard file
// Component: MarketsEconomyTab
// Now uses centralized TradingViewWidgets.js
// Uses theme system - no isDarkMode prop needed

const { useState, useEffect, useRef, useCallback } = React;

// Ensure LucideIcon is available with fallback
const LucideIcon = window.LucideIcon ||
    (typeof window !== 'undefined' ? window.DASHBOARD_UTILS?.LucideIcon : undefined) ||
    (({ name, className = '' }) => React.createElement('span', { className: `icon-${name} ${className}` }));

// Theme helper - uses GOBThemes system
const isLightTheme = () => {
    if (window.GOBThemes && typeof window.GOBThemes.isLightTheme === 'function') {
        return window.GOBThemes.isLightTheme();
    }
    return false;
};

// =====================================================
// MAIN COMPONENT
// =====================================================

const MarketsEconomyTab = ({
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
    const [selectedSource, setSelectedSource] = useState('all');
    const [selectedMarket, setSelectedMarket] = useState('all');
    const [selectedTheme, setSelectedTheme] = useState('all');
    const [activeSection, setActiveSection] = useState('overview'); // 'overview', 'forex', 'calendar', 'canada', 'news'

    const sources = ['Bloomberg', 'Reuters', 'WSJ', 'CNBC', 'MarketWatch', 'La Presse', 'Les Affaires'];
    const markets = ['US', 'Canada', 'Europe', 'Asie'];
    const themes = ['Tech', 'Finance', 'Énergie', 'Santé', 'Crypto', 'IA'];

    // Get shared TradingView widgets
    const TVWidgets = window.TradingViewWidgets || {};
    const {
        LazyTVWidget,
        resetWidgetQueue,
        MarketOverviewWidget,
        HeatmapWidget,
        MarketQuotesWidget,
        ForexHeatMapWidget,
        ForexCrossRatesWidget,
        EconomicEventsWidget
    } = TVWidgets;

    // Fallback components if TradingViewWidgets not loaded
    const SafeLazyTVWidget = LazyTVWidget || (({ children }) => children);
    const SafeMarketOverviewWidget = MarketOverviewWidget || (() => <div>Loading Market Overview...</div>);
    const SafeHeatmapWidget = HeatmapWidget || (() => <div>Loading Heatmap...</div>);
    const SafeMarketQuotesWidget = MarketQuotesWidget || (() => <div>Loading Market Quotes...</div>);
    const SafeForexHeatMapWidget = ForexHeatMapWidget || (() => <div>Loading Forex Heat Map...</div>);
    const SafeForexCrossRatesWidget = ForexCrossRatesWidget || (() => <div>Loading Forex Cross Rates...</div>);
    const SafeEconomicEventsWidget = EconomicEventsWidget || (() => <div>Loading Economic Events...</div>);

    // Reset widget queue on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            if (resetWidgetQueue) resetWidgetQueue();
        };
    }, []);

    const matchesSource = (articleSource, selectedSource) => {
        if (!articleSource || !selectedSource) return false;
        const source = articleSource.toLowerCase();
        const selected = selectedSource.toLowerCase();

        const sourceVariations = {
            'bloomberg': ['bloomberg', 'bloomberg.com', 'bloomberg news'],
            'reuters': ['reuters', 'reuters.com', 'thomson reuters'],
            'wsj': ['wsj', 'wall street journal', 'the wall street journal', 'wsj.com'],
            'cnbc': ['cnbc', 'cnbc.com'],
            'marketwatch': ['marketwatch', 'marketwatch.com', 'market watch'],
            'la presse': ['la presse', 'lapresse', 'lapresse.ca', 'presse'],
            'les affaires': ['les affaires', 'lesaffaires', 'lesaffaires.com', 'affaires']
        };

        if (source.includes(selected) || selected.includes(source)) return true;

        const variations = sourceVariations[selected];
        if (variations) {
            return variations.some(variation => source.includes(variation));
        }

        return false;
    };

    // MEMOIZED FILTERING LOGIC
    const { filteredNews: localFilteredNews, isApproximateMatch } = React.useMemo(() => {
        let filtered = newsData || [];
        let hasExactMatches = true;

        if (localFrenchOnly) {
            filtered = filtered.filter(article => isFrenchArticle(article));
        }

        if (selectedSource !== 'all') {
            const beforeFilter = filtered.length;
            filtered = filtered.filter(article =>
                matchesSource(article.source?.name, selectedSource)
            );
            if (filtered.length === 0 && beforeFilter > 0) {
                filtered = (newsData || []).filter(article => {
                    const sourceName = (article.source?.name || '').toLowerCase();
                    const selected = selectedSource.toLowerCase();
                    return sourceName.includes(selected) || selected.includes(sourceName);
                });
                hasExactMatches = false;
            }
        }

        if (selectedMarket !== 'all') {
            const marketKeywords = {
                'US': ['u.s.', 'united states', 'american', 'wall street', 'nasdaq', 'dow', 's&p', 'federal reserve', 'fed'],
                'Canada': ['canada', 'canadian', 'toronto', 'tsx', 'bank of canada'],
                'Europe': ['europe', 'european', 'eu', 'ecb', 'london', 'frankfurt', 'paris'],
                'Asie': ['asia', 'asian', 'china', 'japan', 'tokyo', 'shanghai', 'nikkei']
            };
            const beforeFilter = filtered.length;
            filtered = filtered.filter(article => {
                const text = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
                return marketKeywords[selectedMarket]?.some(keyword => text.includes(keyword));
            });
            if (filtered.length === 0 && beforeFilter > 0) {
                hasExactMatches = false;
            }
        }

        if (selectedTheme !== 'all') {
            const themeKeywords = {
                'Tech': ['tech', 'technology', 'software', 'apple', 'google', 'microsoft', 'nvidia'],
                'Finance': ['bank', 'finance', 'financial', 'trading', 'investment'],
                'Énergie': ['energy', 'oil', 'gas', 'renewable', 'solar'],
                'Santé': ['health', 'healthcare', 'pharma', 'medical'],
                'Crypto': ['crypto', 'bitcoin', 'ethereum', 'blockchain'],
                'IA': ['ai', 'artificial intelligence', 'machine learning', 'chatgpt']
            };
            filtered = filtered.filter(article => {
                const text = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
                return themeKeywords[selectedTheme]?.some(keyword => text.includes(keyword));
            });
        }

        if (filtered.length === 0 && (newsData || []).length > 0) {
            filtered = (newsData || []).slice(0, 20);
            hasExactMatches = false;
        }

        return {
            filteredNews: filtered,
            isApproximateMatch: !hasExactMatches
        };
    }, [newsData, localFrenchOnly, selectedSource, selectedMarket, selectedTheme]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className={`p-4 md:p-6 rounded-xl transition-colors duration-300 ${
                isLightTheme() ? 'bg-gradient-to-r from-blue-100 to-purple-100' : 'bg-gradient-to-r from-blue-900 to-purple-900'
            }`}>
                <h2 className={`text-2xl md:text-3xl font-bold mb-2 transition-colors duration-300 ${
                    isLightTheme() ? 'text-gray-900' : 'text-white'
                }`}>📊 Marchés & Économie</h2>
                <p className={`text-sm transition-colors duration-300 ${
                    isLightTheme() ? 'text-blue-800' : 'text-blue-200'
                }`}>
                    Vue complète des marchés, devises, calendriers économiques et actualités
                </p>
            </div>

            {/* Navigation Sections */}
            <div className="flex flex-wrap gap-2">
                {[
                    { id: 'overview', label: '📊 Vue Globale', icon: 'BarChart3' },
                    { id: 'forex', label: '💱 Forex', icon: 'DollarSign' },
                    { id: 'calendar', label: '📅 Calendrier', icon: 'Calendar' },
                    { id: 'canada', label: '🇨🇦 Canada', icon: 'Flag' },
                    { id: 'news', label: '📰 Actualités', icon: 'Newspaper' }
                ].map(section => (
                    <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                            activeSection === section.id
                                ? 'bg-blue-600 text-white shadow-lg'
                                : (isLightTheme() ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' : 'bg-gray-800 hover:bg-gray-700 text-gray-300')
                        }`}
                    >
                        {section.label}
                    </button>
                ))}
            </div>

            {/* ===== SECTION: VUE GLOBALE ===== */}
            {activeSection === 'overview' && (
                <div className="space-y-6">
                    {/* Market Overview Widget */}
                    <div className={`rounded-xl overflow-hidden border-2 transition-colors duration-300 ${
                        isLightTheme() ? 'bg-white border-blue-400/40' : 'bg-gray-800/50 border-blue-500/30'
                    }`}>
                        <div className={`p-4 border-b ${isLightTheme() ? 'border-gray-200' : 'border-gray-700'}`}>
                            <h3 className={`text-lg font-bold ${isLightTheme() ? 'text-gray-900' : 'text-white'}`}>
                                📊 Vue d'ensemble des Marchés
                            </h3>
                            <p className={`text-sm ${isLightTheme() ? 'text-gray-600' : 'text-gray-400'}`}>
                                Indices majeurs, Forex, Crypto - Données en direct
                            </p>
                        </div>
                        <div style={{height: '450px'}}>
                            <SafeLazyTVWidget name="Market Overview" height={450} >
                                <SafeMarketOverviewWidget  height={450} />
                            </SafeLazyTVWidget>
                        </div>
                    </div>

                    {/* Heatmaps Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* US Heatmap */}
                        <div className={`rounded-xl overflow-hidden border-2 transition-colors duration-300 ${
                            isLightTheme() ? 'bg-white border-green-400/40' : 'bg-gray-800/50 border-green-500/30'
                        }`}>
                            <div className={`p-4 border-b ${isLightTheme() ? 'border-gray-200' : 'border-gray-700'}`}>
                                <h3 className={`text-lg font-bold ${isLightTheme() ? 'text-gray-900' : 'text-white'}`}>
                                    🇺🇸 Heatmap S&P 500
                                </h3>
                            </div>
                            <div style={{height: '500px'}}>
                                <SafeLazyTVWidget name="S&P 500 Heatmap" height={500} >
                                    <SafeHeatmapWidget  dataSource="SPX500" height={500} />
                                </SafeLazyTVWidget>
                            </div>
                        </div>

                        {/* TSX Heatmap */}
                        <div className={`rounded-xl overflow-hidden border-2 transition-colors duration-300 ${
                            isLightTheme() ? 'bg-white border-red-400/40' : 'bg-gray-800/50 border-red-500/30'
                        }`}>
                            <div className={`p-4 border-b ${isLightTheme() ? 'border-gray-200' : 'border-gray-700'}`}>
                                <h3 className={`text-lg font-bold ${isLightTheme() ? 'text-gray-900' : 'text-white'}`}>
                                    🇨🇦 Heatmap TSX
                                </h3>
                            </div>
                            <div style={{height: '500px'}}>
                                <SafeLazyTVWidget name="TSX Heatmap" height={500} >
                                    <SafeHeatmapWidget  dataSource="TSX" height={500} />
                                </SafeLazyTVWidget>
                            </div>
                        </div>
                    </div>

                    {/* Market Quotes */}
                    <div className={`rounded-xl overflow-hidden border-2 transition-colors duration-300 ${
                        isLightTheme() ? 'bg-white border-purple-400/40' : 'bg-gray-800/50 border-purple-500/30'
                    }`}>
                        <div className={`p-4 border-b ${isLightTheme() ? 'border-gray-200' : 'border-gray-700'}`}>
                            <h3 className={`text-lg font-bold ${isLightTheme() ? 'text-gray-900' : 'text-white'}`}>
                                📊 Cotations - Indices, Bonds, Forex
                            </h3>
                            <p className={`text-sm ${isLightTheme() ? 'text-gray-600' : 'text-gray-400'}`}>
                                Rendements obligataires US/CAN et taux de change
                            </p>
                        </div>
                        <div style={{height: '700px'}}>
                            <SafeLazyTVWidget name="Market Quotes" height={700} >
                                <SafeMarketQuotesWidget  height={700} />
                            </SafeLazyTVWidget>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== SECTION: FOREX ===== */}
            {activeSection === 'forex' && (
                <div className="space-y-6">
                    {/* Forex Heat Map */}
                    <div className={`rounded-xl overflow-hidden border-2 transition-colors duration-300 ${
                        isLightTheme() ? 'bg-white border-green-400/40' : 'bg-gray-800/50 border-green-500/30'
                    }`}>
                        <div className={`p-4 border-b ${isLightTheme() ? 'border-gray-200' : 'border-gray-700'}`}>
                            <h3 className={`text-lg font-bold ${isLightTheme() ? 'text-gray-900' : 'text-white'}`}>
                                💱 Forex Heat Map
                            </h3>
                            <p className={`text-sm ${isLightTheme() ? 'text-gray-600' : 'text-gray-400'}`}>
                                Carte de chaleur des devises (EUR, USD, JPY, GBP, CHF, AUD, CAD, CNY)
                            </p>
                        </div>
                        <div style={{height: '450px'}}>
                            <SafeLazyTVWidget name="Forex Heat Map" height={450} >
                                <SafeForexHeatMapWidget  height={450} />
                            </SafeLazyTVWidget>
                        </div>
                    </div>

                    {/* Forex Cross Rates */}
                    <div className={`rounded-xl overflow-hidden border-2 transition-colors duration-300 ${
                        isLightTheme() ? 'bg-white border-blue-400/40' : 'bg-gray-800/50 border-blue-500/30'
                    }`}>
                        <div className={`p-4 border-b ${isLightTheme() ? 'border-gray-200' : 'border-gray-700'}`}>
                            <h3 className={`text-lg font-bold ${isLightTheme() ? 'text-gray-900' : 'text-white'}`}>
                                💱 Taux de Change Croisés
                            </h3>
                            <p className={`text-sm ${isLightTheme() ? 'text-gray-600' : 'text-gray-400'}`}>
                                9 devises majeures (EUR, USD, JPY, GBP, CHF, AUD, CAD, NZD, CNY)
                            </p>
                        </div>
                        <div style={{height: '450px'}}>
                            <SafeLazyTVWidget name="Forex Cross Rates" height={450} >
                                <SafeForexCrossRatesWidget  height={450} />
                            </SafeLazyTVWidget>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== SECTION: CALENDRIER ===== */}
            {activeSection === 'calendar' && (
                <div className="space-y-6">
                    {/* Investing.com Calendar */}
                    <div className={`rounded-xl overflow-hidden border-2 transition-colors duration-300 ${
                        isLightTheme() ? 'bg-white border-blue-400/40' : 'bg-gray-800/50 border-blue-500/30'
                    }`}>
                        <div className={`p-4 border-b ${isLightTheme() ? 'border-gray-200' : 'border-gray-700'}`}>
                            <h3 className={`text-lg font-bold ${isLightTheme() ? 'text-gray-900' : 'text-white'}`}>
                                📅 Calendrier Économique
                            </h3>
                            <p className={`text-sm ${isLightTheme() ? 'text-gray-600' : 'text-gray-400'}`}>
                                Événements majeurs et données en temps réel
                            </p>
                        </div>
                        <div className="relative" style={{height: '500px'}}>
                            <div
                                className={`absolute top-0 left-0 z-10 ${isLightTheme() ? 'bg-white' : 'bg-gray-800'}`}
                                style={{ width: '100%', height: '40px' }}
                            />
                            <iframe
                                src="https://sslecal2.investing.com?columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&category=_employment,_economicActivity,_inflation,_credit,_centralBanks,_confidenceIndex,_balance,_Bonds&importance=1,2,3&features=datepicker,timezone,timeselector,filters&countries=6,5&calType=day&timeZone=8&lang=5&transparentBackground=1"
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                allowTransparency="true"
                                sandbox="allow-scripts allow-same-origin allow-forms"
                                style={{ minWidth: '100%', background: 'transparent' }}
                            />
                        </div>
                    </div>

                    {/* TradingView Events */}
                    <div className={`rounded-xl overflow-hidden border-2 transition-colors duration-300 ${
                        isLightTheme() ? 'bg-white border-purple-400/40' : 'bg-gray-800/50 border-purple-500/30'
                    }`}>
                        <div className={`p-4 border-b ${isLightTheme() ? 'border-gray-200' : 'border-gray-700'}`}>
                            <h3 className={`text-lg font-bold ${isLightTheme() ? 'text-gray-900' : 'text-white'}`}>
                                📅 Événements Économiques TradingView
                            </h3>
                        </div>
                        <div style={{height: '550px'}}>
                            <SafeLazyTVWidget name="Economic Events" height={550} >
                                <SafeEconomicEventsWidget  height={550} />
                            </SafeLazyTVWidget>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== SECTION: CANADA ===== */}
            {activeSection === 'canada' && (
                <div className="space-y-6">
                    {/* TSX Heatmap */}
                    <div className={`rounded-xl overflow-hidden border-2 transition-colors duration-300 ${
                        isLightTheme() ? 'bg-white border-red-400/40' : 'bg-gray-800/50 border-red-500/30'
                    }`}>
                        <div className={`p-4 border-b ${isLightTheme() ? 'border-gray-200' : 'border-gray-700'}`}>
                            <h3 className={`text-lg font-bold ${isLightTheme() ? 'text-gray-900' : 'text-white'}`}>
                                🇨🇦 Heatmap TSX
                            </h3>
                            <p className={`text-sm ${isLightTheme() ? 'text-gray-600' : 'text-gray-400'}`}>
                                Toronto Stock Exchange - Performance par secteur
                            </p>
                        </div>
                        <div style={{height: '700px'}}>
                            <SafeLazyTVWidget name="TSX Heatmap Canada" height={700} >
                                <SafeHeatmapWidget  dataSource="TSX" height={700} />
                            </SafeLazyTVWidget>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== SECTION: ACTUALITÉS ===== */}
            {activeSection === 'news' && (
                <div className="space-y-6">
                    {/* Header Actions */}
                    <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setLocalFrenchOnly(!localFrenchOnly)}
                                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                                    localFrenchOnly
                                        ? 'bg-blue-600 text-white'
                                        : (isLightTheme() ? 'bg-gray-200 hover:bg-gray-300 text-gray-900' : 'bg-gray-800 hover:bg-gray-700 text-white')
                                }`}
                            >
                                🇫🇷 Français {localFrenchOnly && '✓'}
                            </button>
                            <button
                                onClick={fetchNews}
                                disabled={loading}
                                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 ${
                                    isLightTheme() ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'
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

                    {/* Statistiques */}
                    <div className={`p-4 rounded-xl transition-colors duration-300 ${
                        isLightTheme() ? 'bg-gradient-to-br from-white to-gray-50 border border-gray-200' : 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700'
                    }`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className={`text-3xl font-bold ${isLightTheme() ? 'text-gray-900' : 'text-white'}`}>
                                    {localFilteredNews.length}
                                </div>
                                <div className={`text-sm ${isLightTheme() ? 'text-gray-600' : 'text-gray-400'}`}>
                                    Articles filtrés
                                </div>
                            </div>
                            <LucideIcon name="Newspaper" className={`w-12 h-12 ${isLightTheme() ? 'text-gray-300' : 'text-gray-600'}`} />
                        </div>
                    </div>

                    {/* Filtres */}
                    <div className={`p-6 rounded-xl transition-colors duration-300 ${
                        isLightTheme() ? 'bg-gradient-to-br from-white to-gray-50 border border-gray-200' : 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700'
                    }`}>
                        <h3 className={`text-lg font-bold mb-4 ${isLightTheme() ? 'text-gray-900' : 'text-white'}`}>🔍 Filtres</h3>

                        {/* Source Filter */}
                        <div className="mb-4">
                            <label className={`text-sm font-semibold mb-2 block ${isLightTheme() ? 'text-gray-700' : 'text-gray-300'}`}>📰 Source</label>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => setSelectedSource('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedSource === 'all' ? 'bg-blue-600 text-white' : (isLightTheme() ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-gray-700 text-gray-300 hover:bg-gray-600')}`}>Toutes</button>
                                {sources.map(source => (
                                    <button key={source} onClick={() => setSelectedSource(source)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedSource === source ? 'bg-blue-600 text-white' : (isLightTheme() ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-gray-700 text-gray-300 hover:bg-gray-600')}`}>{source}</button>
                                ))}
                            </div>
                        </div>

                        {/* Market Filter */}
                        <div className="mb-4">
                            <label className={`text-sm font-semibold mb-2 block ${isLightTheme() ? 'text-gray-700' : 'text-gray-300'}`}>🌍 Marché</label>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => setSelectedMarket('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedMarket === 'all' ? 'bg-green-600 text-white' : (isLightTheme() ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-gray-700 text-gray-300 hover:bg-gray-600')}`}>Tous</button>
                                {markets.map(market => (
                                    <button key={market} onClick={() => setSelectedMarket(market)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedMarket === market ? 'bg-green-600 text-white' : (isLightTheme() ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-gray-700 text-gray-300 hover:bg-gray-600')}`}>{market}</button>
                                ))}
                            </div>
                        </div>

                        {/* Theme Filter */}
                        <div>
                            <label className={`text-sm font-semibold mb-2 block ${isLightTheme() ? 'text-gray-700' : 'text-gray-300'}`}>🏷️ Thématique</label>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => setSelectedTheme('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedTheme === 'all' ? 'bg-purple-600 text-white' : (isLightTheme() ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-gray-700 text-gray-300 hover:bg-gray-600')}`}>Toutes</button>
                                {themes.map(theme => (
                                    <button key={theme} onClick={() => setSelectedTheme(theme)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedTheme === theme ? 'bg-purple-600 text-white' : (isLightTheme() ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-gray-700 text-gray-300 hover:bg-gray-600')}`}>{theme}</button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* News List */}
                    <div className="space-y-4">
                        {localFilteredNews.length === 0 ? (
                            <div className={`text-center py-12 ${isLightTheme() ? 'text-gray-600' : 'text-gray-400'}`}>
                                <LucideIcon name="AlertCircle" className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-semibold mb-2">Aucune nouvelle disponible</p>
                                <p className="text-sm">Cliquez sur Actualiser pour charger les dernières nouvelles</p>
                            </div>
                        ) : (
                            localFilteredNews.slice(0, 20).map((article, index) => {
                                const newsIconData = getNewsIcon(article.title, article.description, article.sentiment);
                                const credibility = getSourceCredibility(article.source?.name);

                                return (
                                    <div key={index} className={`p-6 rounded-xl transition-all duration-300 hover:scale-[1.01] ${
                                        isLightTheme() ? 'bg-gradient-to-br from-white to-gray-50 border border-gray-200 hover:border-gray-300' : 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 hover:border-gray-600'
                                    }`}>
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-full ${isLightTheme() ? 'bg-gray-200/60' : 'bg-gray-700/50'}`}>
                                                <LucideIcon name={newsIconData.icon} className={`w-6 h-6 ${newsIconData.color}`} />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className={`font-bold text-lg mb-2 ${isLightTheme() ? 'text-gray-900' : 'text-white'}`}>
                                                    {article.url ? (
                                                        <a href={article.url} target="_blank" rel="noopener noreferrer" className={`hover:underline ${isLightTheme() ? 'text-blue-600 hover:text-blue-700' : 'text-blue-300 hover:text-blue-200'}`}>
                                                            {cleanText(article.title)}
                                                        </a>
                                                    ) : cleanText(article.title)}
                                                </h3>
                                                <p className={`text-base mb-4 ${isLightTheme() ? 'text-gray-600' : 'text-gray-300'}`}>
                                                    {cleanText(article.description)}
                                                </p>
                                                <div className="flex items-center gap-4 flex-wrap">
                                                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                                                        credibility >= 85 ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30' : (isLightTheme() ? 'bg-gray-200 text-gray-700' : 'bg-gray-800 text-gray-300')
                                                    }`}>
                                                        <span className="text-xs font-semibold">{article.source?.name || 'Source inconnue'}</span>
                                                    </div>
                                                    <span className={`text-xs ${isLightTheme() ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        {new Date(article.publishedAt || article.publishedDate).toLocaleString('fr-FR')}
                                                    </span>
                                                    {isFrenchArticle(article) && (
                                                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-500 border border-blue-500/30">🇫🇷 FR</span>
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
            )}
        </div>
    );
};

MarketsEconomyTab.displayName = 'MarketsEconomyTab';

// Export with React.memo for performance stabilization
window.MarketsEconomyTab = React.memo(MarketsEconomyTab);
