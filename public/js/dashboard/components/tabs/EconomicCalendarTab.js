// Auto-converted from monolithic dashboard file
// Component: EconomicCalendarTab

const { useState, useEffect, useRef, useCallback, useMemo } = React;

const EconomicCalendarTab = () => {
    // Initialize with fallback data so component is never blank
    const [activeSubTab, setActiveSubTab] = useState('economic');
    const [calendarData, setCalendarData] = useState([{
        date: 'Mon Oct 16',
        events: [
            {
                time: '12:55 PM',
                currency: 'USD',
                impact: 2,
                event: 'Fed Paulson Speech',
                actual: 'N/A',
                forecast: 'N/A',
                previous: 'N/A'
            },
            {
                time: '08:30 AM',
                currency: 'USD',
                impact: 3,
                event: 'NY Empire State Manufacturing Index',
                actual: '10.70',
                forecast: '-1.00',
                previous: '-8.70'
            }
        ]
    }]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Finviz-style filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterImpact, setFilterImpact] = useState('all'); // all, 1, 2, 3
    const [filterCurrency, setFilterCurrency] = useState('all');
    const [filterTicker, setFilterTicker] = useState('all'); // For earnings/dividends
    const [filterTickerGroup, setFilterTickerGroup] = useState('all'); // all, team, watchlist, both
    const [dateRange, setDateRange] = useState('week'); // today, week, month
    const [filterLargeCapOnly, setFilterLargeCapOnly] = useState(true); // Par défaut activé pour earnings
    
    // Liste des tickers Large Cap (S&P 500 principaux)
    const largeCapTickers = [
        'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.B', 'UNH',
        'JNJ', 'V', 'XOM', 'WMT', 'JPM', 'MA', 'PG', 'CVX', 'HD', 'ABBV',
        'MRK', 'PEP', 'COST', 'AVGO', 'ADBE', 'TMO', 'CSCO', 'ACN', 'DHR', 'NFLX',
        'VZ', 'ABT', 'NKE', 'CMCSA', 'WFC', 'PM', 'TXN', 'LIN', 'NEE', 'DIS',
        'HON', 'QCOM', 'UPS', 'IBM', 'RTX', 'AMGN', 'T', 'SPGI', 'INTU', 'DE',
        'AMAT', 'LOW', 'SBUX', 'GS', 'CAT', 'AXP', 'BKNG', 'ADP', 'SYK', 'TJX',
        'GE', 'ISRG', 'VRTX', 'ZTS', 'MU', 'FI', 'C', 'MDT', 'GILD', 'REGN',
        'BLK', 'ETN', 'SHW', 'KLAC', 'WM', 'APH', 'LRCX', 'ADI', 'CDNS', 'SNPS'
    ];

    // Team and Watchlist tickers
    const [teamTickers, setTeamTickers] = useState([]);
    const [watchlistTickers, setWatchlistTickers] = useState([]);

    // Optimisation: useMemo pour les données de fallback (toujours la même valeur)
    const fallbackData = useMemo(() => [{
        date: 'Mon Oct 16',
        events: [
            {
                time: '12:55 PM',
                currency: 'USD',
                impact: 2,
                event: 'Fed Paulson Speech',
                actual: 'N/A',
                forecast: 'N/A',
                previous: 'N/A'
            },
            {
                time: '08:30 AM',
                currency: 'USD',
                impact: 3,
                event: 'NY Empire State Manufacturing Index',
                actual: '10.70',
                forecast: '-1.00',
                previous: '-8.70'
            }
        ]
    }], []);

    // Helper function for fallback data (wrapper pour compatibilité)
    const getFallbackData = () => fallbackData;

    // Debug: Log du chargement du composant
    console.log('📅 EconomicCalendarTab chargé');
    console.log('📊 Données init:', calendarData);
    console.log('🔧 État du composant:', { activeSubTab, loading, error });

    // Load team and watchlist tickers once on mount
    React.useEffect(() => {
        const abortController = new AbortController();
        
        const loadTickers = async () => {
            try {
                // Try to fetch from API first
                const response = await fetch('/api/tickers-config', {
                    signal: abortController.signal
                });
                const data = await response.json();

                if (data.success) {
                    setTeamTickers(data.team_tickers || []);
                    console.log(`✅ Team tickers loaded: ${data.team_tickers?.length || 0}`);
                }
            } catch (error) {
                if (error.name === 'AbortError') return; // Ignorer les erreurs d'annulation
                console.error('❌ Error loading team tickers:', error);
            }

            try {
                // Load watchlist from Supabase
                const response = await fetch('/api/supabase-watchlist', {
                    signal: abortController.signal
                });
                const data = await response.json();

                if (data.tickers && Array.isArray(data.tickers)) {
                    setWatchlistTickers(data.tickers);
                    console.log(`✅ Watchlist tickers loaded: ${data.tickers.length}`);
                }
            } catch (error) {
                if (error.name === 'AbortError') return; // Ignorer les erreurs d'annulation
                console.error('❌ Error loading watchlist tickers:', error);
                // Fallback to localStorage
                const savedWatchlist = localStorage.getItem('dans-watchlist');
                if (savedWatchlist) {
                    const tickers = JSON.parse(savedWatchlist);
                    setWatchlistTickers(tickers);
                    console.log(`📦 Watchlist loaded from localStorage: ${tickers.length}`);
                }
            }
        };

        loadTickers();
        
        return () => {
            abortController.abort();
        };
    }, []);

    // Reset ticker filters when switching tabs (séparé pour éviter stale closures)
    React.useEffect(() => {
        setFilterTicker('all');
        setFilterTickerGroup('all');
        // Activer le filtre Large Cap par défaut pour earnings uniquement
        setFilterLargeCapOnly(activeSubTab === 'earnings');
    }, [activeSubTab]);

    // Charger les données au changement d'onglet
    React.useEffect(() => {
        const abortController = new AbortController();
        let isMounted = true;
        
        const fetchData = async () => {
            if (!isMounted) return;
            
            setLoading(true);
            setError(null);

            try {
                if (activeSubTab === 'earnings') {
                    const response = await fetch('/api/calendar-earnings', {
                        signal: abortController.signal
                    });
                    const result = await response.json();

                    if (!isMounted) return;
                    
                    if (result.success && result.data) {
                        setCalendarData(result.data);
                        console.log(`✅ ${result.data.length} earnings calendar days loaded from ${result.source}`);
                    } else {
                        setError('Aucune donnée d\'earnings disponible');
                        setCalendarData(getFallbackData());
                    }
                } else if (activeSubTab === 'economic') {
                    const response = await fetch('/api/calendar-economic', {
                        signal: abortController.signal
                    });
                    const result = await response.json();

                    if (!isMounted) return;
                    
                    if (result.success && result.data) {
                        setCalendarData(result.data);
                        console.log(`✅ ${result.data.length} economic calendar days loaded from ${result.source}`);
                    } else {
                        setError('Aucune donnée économique disponible');
                        setCalendarData(getFallbackData());
                    }
                } else if (activeSubTab === 'dividends') {
                    const response = await fetch('/api/calendar-dividends', {
                        signal: abortController.signal
                    });
                    const result = await response.json();

                    if (!isMounted) return;
                    
                    if (result.success && result.data) {
                        setCalendarData(result.data);
                        console.log(`✅ ${result.data.length} dividend events loaded from ${result.source}`);
                    } else {
                        setError('Aucune donnée de dividendes disponible');
                        setCalendarData(getFallbackData());
                    }
                } else {
                    setCalendarData(getFallbackData());
                }
            } catch (err) {
                if (err.name === 'AbortError' || !isMounted) return;
                console.error('❌ Erreur fetchCalendarData:', err);
                setError(`Impossible de charger les données: ${err.message}`);
                setCalendarData(getFallbackData());
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };
        
        fetchData();
        
        return () => {
            isMounted = false;
            abortController.abort();
        };
    }, [activeSubTab]);

    // Fonction pour rafraîchir les données (utilisée par handleRefresh)
    const fetchCalendarData = async () => {
        console.log('🔄 fetchCalendarData appelé pour:', activeSubTab);
        setLoading(true);
        setError(null);

        try {
            if (activeSubTab === 'earnings') {
                const response = await fetch('/api/calendar-earnings');
                const result = await response.json();

                if (result.success && result.data) {
                    setCalendarData(result.data);
                    console.log(`✅ ${result.data.length} earnings calendar days loaded from ${result.source}`);
                } else {
                    setError('Aucune donnée d\'earnings disponible');
                    setCalendarData(getFallbackData());
                }
            } else if (activeSubTab === 'economic') {
                const response = await fetch('/api/calendar-economic');
                const result = await response.json();

                if (result.success && result.data) {
                    setCalendarData(result.data);
                    console.log(`✅ ${result.data.length} economic calendar days loaded from ${result.source}`);
                } else {
                    setError('Aucune donnée économique disponible');
                    setCalendarData(getFallbackData());
                }
            } else if (activeSubTab === 'dividends') {
                const response = await fetch('/api/calendar-dividends');
                const result = await response.json();

                if (result.success && result.data) {
                    setCalendarData(result.data);
                    console.log(`✅ ${result.data.length} dividend events loaded from ${result.source}`);
                } else {
                    setError('Aucune donnée de dividendes disponible');
                    setCalendarData(getFallbackData());
                }
            } else {
                setCalendarData(getFallbackData());
            }
        } catch (err) {
            console.error('❌ Erreur fetchCalendarData:', err);
            setError(`Impossible de charger les données: ${err.message}`);
            setCalendarData(getFallbackData());
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        console.log('🔄 Actualisation du calendrier...');
        setIsRefreshing(true);
        await fetchCalendarData();
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    const getImpactBars = (impact) => {
        const bars = [];
        const colors = ['bg-yellow-500', 'bg-green-500', 'bg-red-500'];
        for (let i = 0; i < 3; i++) {
            bars.push(
                <div
                    key={i}
                    className={`w-3 h-5 rounded-sm ${i < impact ? colors[i] : 'bg-gray-600'} ${
                        i < impact ? 'opacity-100' : 'opacity-30'
                    }`}
                />
            );
        }
        return bars;
    };

    const getValueColor = (actual, forecast) => {
        if (actual === 'N/A' || forecast === 'N/A') return 'text-gray-400';
        const actualNum = parseFloat(actual);
        const forecastNum = parseFloat(forecast);
        if (actualNum > forecastNum) return 'text-green-400';
        if (actualNum < forecastNum) return 'text-red-400';
        return 'text-gray-400';
    };

    const getCurrencyFlag = (currency) => {
        const flags = {
            'USD': '🇺🇸',
            'EUR': '🇪🇺',
            'GBP': '🇬🇧',
            'JPY': '🇯🇵',
            'CAD': '🇨🇦',
            'AUD': '🇦🇺',
            'CHF': '🇨🇭',
            'CNY': '🇨🇳',
            'NZD': '🇳🇿'
        };
        return flags[currency] || '🌍';
    };

    // Optimisation: useCallback pour la fonction utilitaire extractTicker
    const extractTicker = useCallback((eventName) => {
        // Look for ticker pattern: "AAPL Earnings" or "MSFT Dividend"
        const match = eventName.match(/^([A-Z]{1,5})\s/);
        return match ? match[1] : null;
    }, []);

    // Optimisation: useCallback pour la fonction getEventCategory
    const getEventCategory = useCallback((event) => {
        // Extract ticker if available (for earnings/dividends)
        const ticker = extractTicker(event.event);
        
        // 1. Tickers d'équipe (priorité la plus haute)
        if (ticker && teamTickers.includes(ticker)) {
            return 1; // Team tickers
        }
        
        // 2. Données Canada (CAD currency ou ticker .TO)
        if (event.currency === 'CAD' || (ticker && ticker.endsWith('.TO'))) {
            return 2; // Canada
        }
        
        // 3. Données US (USD currency et ticker US)
        if (event.currency === 'USD' && (!ticker || !ticker.endsWith('.TO'))) {
            return 3; // US
        }
        
        // 4. Autres données
        return 4; // Other
    }, [teamTickers, extractTicker]);

    // Optimisation: useCallback pour la fonction de tri sortEvents
    const sortEvents = useCallback((events) => {
        return [...events].sort((a, b) => {
            // First sort by category (team → Canada → US → other)
            const categoryA = getEventCategory(a);
            const categoryB = getEventCategory(b);
            if (categoryA !== categoryB) {
                return categoryA - categoryB;
            }
            
            // Within same category, sort by time
            const timeA = a.time || '';
            const timeB = b.time || '';
            return timeA.localeCompare(timeB);
        });
    }, [getEventCategory]);

    // Optimisation: useMemo pour filteredCalendarData (calcul coûteux)
    const filteredCalendarData = useMemo(() => {
        return (Array.isArray(calendarData) ? calendarData : []).map(day => {
        const filteredEvents = (Array.isArray(day.events) ? day.events : []).filter(event => {
            // Search query filter
            if (searchQuery && !event.event.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }

            // Impact filter
            if (filterImpact !== 'all' && event.impact !== parseInt(filterImpact)) {
                return false;
            }

            // Currency filter
            if (filterCurrency !== 'all' && event.currency !== filterCurrency) {
                return false;
            }

            // Ticker filter (for earnings/dividends only)
            if (filterTicker !== 'all' && (activeSubTab === 'earnings' || activeSubTab === 'dividends')) {
                const ticker = extractTicker(event.event);
                if (!ticker || ticker !== filterTicker) {
                    return false;
                }
            }

            // Ticker Group filter (Team/Watchlist/Both)
            if (filterTickerGroup !== 'all' && (activeSubTab === 'earnings' || activeSubTab === 'dividends')) {
                const ticker = extractTicker(event.event);
                if (!ticker) return false;

                const inTeam = teamTickers.includes(ticker);
                const inWatchlist = watchlistTickers.includes(ticker);

                if (filterTickerGroup === 'team' && !inTeam) {
                    return false;
                }
                if (filterTickerGroup === 'watchlist' && !inWatchlist) {
                    return false;
                }
                if (filterTickerGroup === 'both' && !(inTeam || inWatchlist)) {
                    return false;
                }
            }

            // Large Cap filter (for earnings only, enabled by default)
            if (filterLargeCapOnly && activeSubTab === 'earnings') {
                const ticker = extractTicker(event.event);
                if (!ticker) return false;
                if (!largeCapTickers.includes(ticker)) {
                    return false;
                }
            }

            return true;
        });

        // Sort events: Team tickers → Canada → US → Other
        const sortedEvents = sortEvents(filteredEvents);
        
        return { ...day, events: sortedEvents };
    }).filter(day => day.events.length > 0); // Remove days with no events
    }, [calendarData, searchQuery, filterImpact, filterCurrency, filterTicker, filterTickerGroup, filterLargeCapOnly, activeSubTab, teamTickers, watchlistTickers, largeCapTickers, extractTicker, sortEvents]);

    // Optimisation: useMemo pour availableCurrencies (calcul)
    const availableCurrencies = useMemo(() => [...new Set(
        (Array.isArray(calendarData) ? calendarData : []).flatMap(day =>
            (Array.isArray(day.events) ? day.events : []).map(e => e.currency || 'USD')
        )
    )].sort(), [calendarData]);

    // Optimisation: useMemo pour availableTickers (calcul conditionnel)
    const availableTickers = useMemo(() => (activeSubTab === 'earnings' || activeSubTab === 'dividends')
        ? [...new Set(
            (Array.isArray(calendarData) ? calendarData : []).flatMap(day =>
                (Array.isArray(day.events) ? day.events : []).map(e => extractTicker(e.event)).filter(t => t !== null)
            )
        )].sort()
        : [], [activeSubTab, calendarData, extractTicker]);

    return (
        <div className={`${isDarkMode ? 'bg-gray-900 text-gray-200' : 'bg-white text-gray-900'} p-6`}>
            <div className="max-w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="text-2xl">📅</div>
                        <h2 className="text-2xl font-bold">Calendrier financier</h2>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={loading || isRefreshing}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                            loading || isRefreshing
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-800 hover:bg-gray-700 text-white'
                        }`}
                    >
                        <div className={`w-4 h-4 ${loading || isRefreshing ? 'animate-spin' : ''}`}>
                            🔄
                        </div>
                        Actualiser
                    </button>
                </div>

                {/* Finviz-Style Filter Bar */}
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg p-4 mb-4`}>
                    <div className={`grid grid-cols-1 gap-3 ${
                        activeSubTab === 'earnings' || activeSubTab === 'dividends'
                            ? 'md:grid-cols-6'
                            : 'md:grid-cols-4'
                    }`}>
                        {/* Search Box */}
                        <div className="col-span-1 md:col-span-2">
                            <input
                                type="text"
                                placeholder="🔍 Rechercher un événement..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`w-full px-3 py-2 rounded-md text-sm ${
                                    isDarkMode
                                        ? 'bg-gray-700 text-white border-gray-600'
                                        : 'bg-white text-gray-900 border-gray-300'
                                } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            />
                        </div>

                        {/* Ticker Group Filter - Only for Earnings/Dividends */}
                        {(activeSubTab === 'earnings' || activeSubTab === 'dividends') && (
                            <div>
                                <select
                                    value={filterTickerGroup}
                                    onChange={(e) => {
                                        setFilterTickerGroup(e.target.value);
                                        // Reset individual ticker filter when changing group
                                        if (e.target.value !== 'all') {
                                            setFilterTicker('all');
                                        }
                                    }}
                                    className={`w-full px-3 py-2 rounded-md text-sm ${
                                        isDarkMode
                                            ? 'bg-gray-700 text-white border-gray-600'
                                            : 'bg-white text-gray-900 border-gray-300'
                                    } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                >
                                    <option value="all">Tous les titres</option>
                                    <option value="team">👥 Équipe ({teamTickers.length})</option>
                                    <option value="watchlist">⭐ Liste de suivi ({watchlistTickers.length})</option>
                                    <option value="both">🎯 Équipe + Liste ({teamTickers.length + watchlistTickers.length})</option>
                                </select>
                            </div>
                        )}

                        {/* Ticker Filter - Only for Earnings/Dividends */}
                        {(activeSubTab === 'earnings' || activeSubTab === 'dividends') && (
                            <div>
                                <select
                                    value={filterTicker}
                                    onChange={(e) => setFilterTicker(e.target.value)}
                                    disabled={filterTickerGroup !== 'all'}
                                    className={`w-full px-3 py-2 rounded-md text-sm ${
                                        isDarkMode
                                            ? 'bg-gray-700 text-white border-gray-600'
                                            : 'bg-white text-gray-900 border-gray-300'
                                    } border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        filterTickerGroup !== 'all' ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                >
                                    <option value="all">Sélectionner un ticker ({availableTickers.length})</option>
                                    {availableTickers.map(ticker => (
                                        <option key={ticker} value={ticker}>
                                            {ticker}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Impact Filter */}
                        <div>
                            <select
                                value={filterImpact}
                                onChange={(e) => setFilterImpact(e.target.value)}
                                className={`w-full px-3 py-2 rounded-md text-sm ${
                                    isDarkMode
                                        ? 'bg-gray-700 text-white border-gray-600'
                                        : 'bg-white text-gray-900 border-gray-300'
                                } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                >
                                    <option value="all">Tous les impacts</option>
                                    <option value="3">🔴 Impact élevé</option>
                                    <option value="2">🟠 Impact moyen</option>
                                    <option value="1">🟡 Impact faible</option>
                            </select>
                        </div>

                        {/* Currency Filter */}
                        <div>
                            <select
                                value={filterCurrency}
                                onChange={(e) => setFilterCurrency(e.target.value)}
                                className={`w-full px-3 py-2 rounded-md text-sm ${
                                    isDarkMode
                                        ? 'bg-gray-700 text-white border-gray-600'
                                        : 'bg-white text-gray-900 border-gray-300'
                                } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                >
                                    <option value="all">Toutes les devises</option>
                                    {availableCurrencies.map(curr => (
                                        <option key={curr} value={curr}>
                                            {getCurrencyFlag(curr)} {curr}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Large Cap Filter - Only for Earnings */}
                        {activeSubTab === 'earnings' && (
                            <div className="flex items-center">
                                <label className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer transition-colors ${
                                    isDarkMode
                                        ? filterLargeCapOnly ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        : filterLargeCapOnly ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                                } border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                                    <input
                                        type="checkbox"
                                        checked={filterLargeCapOnly}
                                        onChange={(e) => setFilterLargeCapOnly(e.target.checked)}
                                        className="w-4 h-4 cursor-pointer"
                                    />
                                    <span className="font-medium">Grandes capitalisations seulement</span>
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Active Filters Display */}
                    {(searchQuery || filterImpact !== 'all' || filterCurrency !== 'all' || filterTicker !== 'all' || filterTickerGroup !== 'all' || (activeSubTab === 'earnings' && filterLargeCapOnly)) && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            <span className="text-xs text-gray-400">Filtres actifs :</span>
                            {activeSubTab === 'earnings' && filterLargeCapOnly && (
                                <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                                    📊 Grandes capitalisations
                                </span>
                            )}
                            {searchQuery && (
                                <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-700 text-gray-200'}`}>
                                    Recherche : "{searchQuery}"
                                </span>
                            )}
                            {filterTickerGroup !== 'all' && (
                                <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-cyan-900 text-cyan-200' : 'bg-cyan-100 text-cyan-800'}`}>
                                    {filterTickerGroup === 'team' ? '👥 Tickers équipe' :
                                     filterTickerGroup === 'watchlist' ? '⭐ Tickers liste de suivi' :
                                     '🎯 Équipe + Liste de suivi'}
                                </span>
                            )}
                            {filterTicker !== 'all' && (
                                <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'}`}>
                                    Ticker : {filterTicker}
                                </span>
                            )}
                            {filterImpact !== 'all' && (
                                <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'}`}>
                                    Impact : {filterImpact === '3' ? 'Élevé' : filterImpact === '2' ? 'Moyen' : 'Faible'}
                                </span>
                            )}
                            {filterCurrency !== 'all' && (
                                <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'}`}>
                                    Devise : {filterCurrency}
                                </span>
                            )}
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setFilterImpact('all');
                                    setFilterCurrency('all');
                                    setFilterTicker('all');
                                    setFilterTickerGroup('all');
                                    setFilterLargeCapOnly(activeSubTab === 'earnings'); // Réinitialiser à la valeur par défaut selon l'onglet
                                }}
                                className="text-xs text-red-400 hover:text-red-300 underline"
                            >
                                Réinitialiser
                            </button>
                        </div>
                    )}
                </div>

                {/* Message d'erreur */}
                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4 text-sm">
                        ⚠️ {error}
                    </div>
                )}

                {/* Onglets internes */}
                <div className="flex gap-0 mb-4 border-b border-gray-700">
                    <button
                        onClick={() => setActiveSubTab('economic')}
                        className={`px-4 py-2 font-medium transition-colors text-sm ${
                            activeSubTab === 'economic'
                                ? 'bg-gray-800 text-white'
                                : `${isDarkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`
                        }`}
                    >
                        Économique
                    </button>
                    <button
                        onClick={() => setActiveSubTab('earnings')}
                        className={`px-4 py-2 font-medium transition-colors text-sm ${
                            activeSubTab === 'earnings'
                                ? 'bg-gray-800 text-white'
                                : `${isDarkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`
                        }`}
                    >
                        Earnings
                    </button>
                    <button
                        onClick={() => setActiveSubTab('dividends')}
                        className={`px-4 py-2 font-medium transition-colors text-sm ${
                            activeSubTab === 'dividends'
                                ? 'bg-gray-800 text-white'
                                : `${isDarkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`
                        }`}
                    >
                        Dividendes
                    </button>
                </div>

                {/* Contenu */}
                {loading ? (
                    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg p-8 text-center`}>
                        <div className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3">🔄</div>
                        <p className="text-gray-400 text-sm">Loading data...</p>
                    </div>
                ) : filteredCalendarData.length === 0 ? (
                    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg p-8 text-center`}>
                        <p className="text-gray-400 text-sm">
                            {calendarData.length === 0 ? 'No data available' : 'No events match your filters'}
                        </p>
                        {calendarData.length > 0 && (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setFilterImpact('all');
                                    setFilterCurrency('all');
                                }}
                                className="mt-3 text-blue-400 hover:text-blue-300 underline text-sm"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg overflow-hidden shadow-lg`}>
                        {filteredCalendarData.map((day, dayIndex) => (
                            <div key={dayIndex} className="border-b border-gray-700 last:border-b-0">
                                {/* Day Header */}
                                <div className={`${isDarkMode ? 'bg-gray-750' : 'bg-gray-200'} px-4 py-2 font-semibold text-sm`}>
                                    {day.date}
                                </div>

                                {/* Column Headers - Finviz Style */}
                                {dayIndex === 0 && (
                                    <div className={`grid grid-cols-[80px_1fr_80px_60px_90px_90px_90px] gap-3 px-4 py-3 ${
                                        isDarkMode ? 'bg-gray-900' : 'bg-gray-300'
                                    } text-xs font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} border-b-2 ${
                                        isDarkMode ? 'border-gray-600' : 'border-gray-400'
                                    }`}>
                                        <div>TIME</div>
                                        <div>EVENT</div>
                                        <div>IMPACT</div>
                                        <div>FOR</div>
                                        <div className="text-center">ACTUAL</div>
                                        <div className="text-center">FORECAST</div>
                                        <div className="text-center">PREVIOUS</div>
                                    </div>
                                )}

                                {/* Events - Finviz Style */}
                                {day.events.map((event, eventIndex) => (
                                    <div
                                        key={eventIndex}
                                        className={`grid grid-cols-[80px_1fr_80px_60px_90px_90px_90px] gap-3 px-4 py-3 ${
                                            isDarkMode ? 'hover:bg-gray-750' : 'hover:bg-gray-200'
                                        } transition-colors border-b ${
                                            isDarkMode ? 'border-gray-700' : 'border-gray-300'
                                        } last:border-b-0 items-center text-sm`}
                                    >
                                        <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} font-mono text-xs`}>
                                            {event.time}
                                        </div>
                                        <div className="font-medium flex items-center gap-2" title={event.event}>
                                            <span className="text-lg">{getCurrencyFlag(event.currency)}</span>
                                            <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-800'} truncate`}>
                                                {event.event}
                                            </span>
                                        </div>
                                        <div className="flex gap-1">{getImpactBars(event.impact)}</div>
                                        <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold text-xs`}>
                                            {event.currency}
                                        </div>
                                        <div className={`text-center font-bold ${getValueColor(event.actual, event.forecast)}`}>
                                            {event.actual}
                                        </div>
                                        <div className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {event.forecast}
                                        </div>
                                        <div className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {event.previous}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer Info - Finviz Style */}
                <div className={`mt-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg p-4`}>
                    <div className="flex flex-wrap items-center gap-4 text-xs">
                        <div className="flex items-center gap-2">
                            <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Showing {filteredCalendarData.reduce((acc, day) => acc + day.events.length, 0)} events
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}">Impact:</span>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                                <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>High</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                                <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Medium</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
                                <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Low</span>
                            </div>
                        </div>
                        <div className={`ml-auto ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} text-xs italic`}>
                            Data powered by FMP API
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

window.EconomicCalendarTab = EconomicCalendarTab;