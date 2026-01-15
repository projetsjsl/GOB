// Auto-converted from monolithic dashboard file
// Component: EconomicCalendarTab



const EconomicCalendarTab = ({ isDarkMode }) => {
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
    const [filterLargeCapOnly, setFilterLargeCapOnly] = useState(true); // Par defaut active pour earnings
    
    // Controle du nombre d'elements affiches par section
    const [itemsPerSection, setItemsPerSection] = useState({
        economic: 25,
        earnings: 25,
        dividends: 25
    });
    
    // Options pour le nombre d'elements a afficher
    const itemsPerPageOptions = [10, 25, 50, 100, 200, 500];
    
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

    // Helper function for fallback data
    const getFallbackData = () => {
        return [{
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
        }];
    };

    // Debug: Log du chargement du composant
    // void(' EconomicCalendarTab charge'); // Disabled - too frequent
    void(' Donnees init:', calendarData);
    // void(' Etat du composant:', { activeSubTab, loading, error }); // Disabled

    // Load team and watchlist tickers once on mount
    React.useEffect(() => {
        const loadTickers = async () => {
            try {
                // Try to fetch from API first
                const response = await fetch('/api/tickers-config');
                const data = await response.json();

                if (data.success) {
                    setTeamTickers(data.team_tickers || []);
                    void(` Team tickers loaded: ${data.team_tickers?.length || 0}`);
                }
            } catch (error) {
                console.error(' Error loading team tickers:', error);
            }

            try {
                // Load watchlist from Supabase
                const response = await fetch('/api/supabase-watchlist');
                const data = await response.json();

                if (data.tickers && Array.isArray(data.tickers)) {
                    setWatchlistTickers(data.tickers);
                    void(` Watchlist tickers loaded: ${data.tickers.length}`);
                }
            } catch (error) {
                console.error(' Error loading watchlist tickers:', error);
                // Fallback to localStorage
                const savedWatchlist = localStorage.getItem('dans-watchlist');
                if (savedWatchlist) {
                    const tickers = JSON.parse(savedWatchlist);
                    setWatchlistTickers(tickers);
                    void(` Watchlist loaded from localStorage: ${tickers.length}`);
                }
            }
        };

        loadTickers();
    }, []);

    // Charger les donnees au changement d'onglet
    React.useEffect(() => {
        fetchCalendarData();
        // Reset ticker filters when switching tabs
        setFilterTicker('all');
        setFilterTickerGroup('all');
        // Activer le filtre Large Cap par defaut pour earnings uniquement
        setFilterLargeCapOnly(activeSubTab === 'earnings');
    }, [activeSubTab]);

    const fetchCalendarData = async () => {
        void(' fetchCalendarData appele pour:', activeSubTab);
        setLoading(true);
        setError(null);

        try {
            if (activeSubTab === 'earnings') {
                // Connect to dedicated Earnings Calendar API with fallback chain
                const response = await fetch('/api/calendar-earnings');
                const result = await response.json();

                if (result.success && result.data) {
                    setCalendarData(result.data);
                    void(` ${result.data.length} earnings calendar days loaded from ${result.source}`);
                    if (result.fallback_tried) {
                        void(' Fallback sources tried:', result.fallback_tried);
                    }
                } else {
                    setError('Aucune donnee d\'earnings disponible');
                    setCalendarData(getFallbackData());
                }
            } else if (activeSubTab === 'economic') {
                // Connect to dedicated Economic Calendar API with fallback chain
                const response = await fetch('/api/calendar-economic');
                const result = await response.json();

                if (result.success && result.data) {
                    setCalendarData(result.data);
                    void(` ${result.data.length} economic calendar days loaded from ${result.source}`);
                    if (result.fallback_tried) {
                        void(' Fallback sources tried:', result.fallback_tried);
                    }
                } else {
                    setError('Aucune donnee economique disponible');
                    setCalendarData(getFallbackData());
                }
            } else if (activeSubTab === 'dividends') {
                // Connect to dedicated Dividends Calendar API
                const response = await fetch('/api/calendar-dividends');
                const result = await response.json();

                if (result.success && result.data) {
                    setCalendarData(result.data);
                    void(` ${result.data.length} dividend events loaded from ${result.source}`);
                    if (result.fallback_tried) {
                        void(' Fallback sources tried:', result.fallback_tried);
                    }
                } else {
                    setError('Aucune donnee de dividendes disponible');
                    setCalendarData(getFallbackData());
                }
            } else {
                setCalendarData(getFallbackData());
            }
        } catch (err) {
            console.error(' Erreur fetchCalendarData:', err);
            setError(`Impossible de charger les donnees: ${err.message}`);
            setCalendarData(getFallbackData());
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        void(' Actualisation du calendrier...');
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
            'USD': '',
            'EUR': '',
            'GBP': '',
            'JPY': '',
            'CAD': '',
            'AUD': '',
            'CHF': '',
            'CNY': '',
            'NZD': ''
        };
        return flags[currency] || '';
    };

    // Helper: Extract ticker symbol from event name (for earnings/dividends)
    const extractTicker = (eventName) => {
        // Look for ticker pattern: "AAPL Earnings" or "MSFT Dividend"
        const match = eventName.match(/^([A-Z]{1,5})\s/);
        return match ? match[1] : null;
    };

    // Helper: Determine event category for sorting
    const getEventCategory = (event) => {
        // Extract ticker if available (for earnings/dividends)
        const ticker = extractTicker(event.event);
        
        // 1. Tickers d'equipe (priorite la plus haute)
        if (ticker && teamTickers.includes(ticker)) {
            return 1; // Team tickers
        }
        
        // 2. Donnees Canada (CAD currency ou ticker .TO)
        if (event.currency === 'CAD' || (ticker && ticker.endsWith('.TO'))) {
            return 2; // Canada
        }
        
        // 3. Donnees US (USD currency et ticker US)
        if (event.currency === 'USD' && (!ticker || !ticker.endsWith('.TO'))) {
            return 3; // US
        }
        
        // 4. Autres donnees
        return 4; // Other
    };

    // Helper: Sort events within a day
    const sortEvents = (events) => {
        return [...events].sort((a, b) => {
            // First sort by category (team -> Canada -> US -> other)
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
    };

    // Filter calendar data based on user selections (Finviz-style)
    const filteredCalendarData = (Array.isArray(calendarData) ? calendarData : []).map(day => {
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

        // Sort events: Team tickers -> Canada -> US -> Other
        const sortedEvents = sortEvents(filteredEvents);
        
        return { ...day, events: sortedEvents };
    }).filter(day => day.events.length > 0); // Remove days with no events

    // Get unique currencies from data for filter dropdown
    const availableCurrencies = [...new Set(
        (Array.isArray(calendarData) ? calendarData : []).flatMap(day =>
            (Array.isArray(day.events) ? day.events : []).map(e => e.currency || 'USD')
        )
    )].sort();

    // Get unique tickers from data for filter dropdown (earnings/dividends only)
    const availableTickers = (activeSubTab === 'earnings' || activeSubTab === 'dividends')
        ? [...new Set(
            (Array.isArray(calendarData) ? calendarData : []).flatMap(day =>
                (Array.isArray(day.events) ? day.events : []).map(e => extractTicker(e.event)).filter(t => t !== null)
            )
        )].sort()
        : [];

    return (
        <div className={`${isDarkMode ? 'bg-gray-900 text-gray-200' : 'bg-white text-gray-900'} p-6`}>



            <div className="max-w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="text-2xl"></div>
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
                                placeholder=" Rechercher un evenement..."
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
                                    <option value="team"> Equipe ({teamTickers.length})</option>
                                    <option value="watchlist"> Liste de suivi ({watchlistTickers.length})</option>
                                    <option value="both"> Equipe + Liste ({teamTickers.length + watchlistTickers.length})</option>
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
                                    <option value="all">Selectionner un ticker ({availableTickers.length})</option>
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
                                    <option value="3"> Impact eleve</option>
                                    <option value="2"> Impact moyen</option>
                                    <option value="1"> Impact faible</option>
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
                                     Grandes capitalisations
                                </span>
                            )}
                            {searchQuery && (
                                <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-700 text-gray-200'}`}>
                                    Recherche : "{searchQuery}"
                                </span>
                            )}
                            {filterTickerGroup !== 'all' && (
                                <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-cyan-900 text-cyan-200' : 'bg-cyan-100 text-cyan-800'}`}>
                                    {filterTickerGroup === 'team' ? ' Tickers equipe' :
                                     filterTickerGroup === 'watchlist' ? ' Tickers liste de suivi' :
                                     ' Equipe + Liste de suivi'}
                                </span>
                            )}
                            {filterTicker !== 'all' && (
                                <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'}`}>
                                    Ticker : {filterTicker}
                                </span>
                            )}
                            {filterImpact !== 'all' && (
                                <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'}`}>
                                    Impact : {filterImpact === '3' ? 'Eleve' : filterImpact === '2' ? 'Moyen' : 'Faible'}
                                </span>
                            )}
                            {filterCurrency !== 'all' && (
                                <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'}`}>
                                    Devise : {filterCurrency}
                                </span>
                            )}
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setFilterImpact('all');
                                    setFilterCurrency('all');
                                    setFilterTicker('all');
                                    setFilterTickerGroup('all');
                                    setFilterLargeCapOnly(activeSubTab === 'earnings'); // Reinitialiser a la valeur par defaut selon l'onglet
                                }}
                                className="text-xs text-red-400 hover:text-red-300 underline"
                            >
                                Reinitialiser
                            </button>
                        </div>
                    )}
                </div>

                {/* Message d'erreur */}
                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4 text-sm">
                         {error}
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
                        Economique
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
                        <div className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3"></div>
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
                    <div>
                        {/* Controle du nombre d'elements a afficher */}
                        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg p-4 mb-4 flex items-center justify-between flex-wrap gap-3`}>
                            <div className="flex items-center gap-3">
                                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Afficher :
                                </span>
                                <select
                                    value={itemsPerSection[activeSubTab]}
                                    onChange={(e) => {
                                        const newValue = parseInt(e.target.value, 10);
                                        setItemsPerSection(prev => ({
                                            ...prev,
                                            [activeSubTab]: newValue
                                        }));
                                    }}
                                    className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
                                        isDarkMode
                                            ? 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600'
                                            : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                                    } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                >
                                    {itemsPerPageOptions.map(option => (
                                        <option key={option} value={option}>
                                            {option === 500 ? 'Tous' : option}
                                        </option>
                                    ))}
                                </select>
                                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    elements par section
                                </span>
                            </div>
                            <div className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Total filtre : {filteredCalendarData.reduce((acc, day) => acc + day.events.length, 0)} evenements
                            </div>
                        </div>

                        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg overflow-hidden shadow-lg`}>
                            {(() => {
                                // Limiter le nombre d'evenements affiches
                                let eventCount = 0;
                                const maxEvents = itemsPerSection[activeSubTab];
                                const limitedData = [];
                                
                                for (const day of filteredCalendarData) {
                                    if (eventCount >= maxEvents) break;
                                    
                                    const remaining = maxEvents - eventCount;
                                    const limitedEvents = day.events.slice(0, remaining);
                                    eventCount += limitedEvents.length;
                                    
                                    if (limitedEvents.length > 0) {
                                        limitedData.push({ ...day, events: limitedEvents });
                                    }
                                    
                                    if (eventCount >= maxEvents) break;
                                }
                                
                                return limitedData.map((day, dayIndex) => (
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
                                ));
                            })()}
                            
                            {/* Message si des evenements sont masques */}
                            {filteredCalendarData.reduce((acc, day) => acc + day.events.length, 0) > itemsPerSection[activeSubTab] && (
                                <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-gray-200'} px-4 py-3 text-center border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {filteredCalendarData.reduce((acc, day) => acc + day.events.length, 0) - itemsPerSection[activeSubTab]} evenement(s) supplementaire(s) masque(s).
                                        <button
                                            onClick={() => {
                                                const nextOption = itemsPerPageOptions.find(opt => opt > itemsPerSection[activeSubTab]) || 500;
                                                setItemsPerSection(prev => ({
                                                    ...prev,
                                                    [activeSubTab]: nextOption
                                                }));
                                            }}
                                            className={`ml-2 px-3 py-1 rounded-md text-sm font-semibold transition-all ${
                                                isDarkMode
                                                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                                            }`}
                                        >
                                            Afficher plus
                                        </button>
                                    </p>
                                </div>
                            )}
                        </div>
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
                            <span className={`font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Impact:</span>
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