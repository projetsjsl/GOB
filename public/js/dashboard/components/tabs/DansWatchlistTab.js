// Auto-converted from monolithic dashboard file
// Component: DansWatchlistTab

const { useState, useEffect } = React;

const DansWatchlistTab = (props = {}) => {
    const dashboard = typeof window !== 'undefined' ? window.BetaCombinedDashboard || {} : {};
    const isDarkMode = props.isDarkMode ?? dashboard.isDarkMode ?? true;
    const initialTickers = Array.isArray(props.watchlistTickers) && props.watchlistTickers.length > 0
        ? props.watchlistTickers
        : (dashboard.watchlistTickers || []);
    const fetchStockData = typeof props.fetchStockData === 'function'
        ? props.fetchStockData
        : (dashboard.fetchStockData || (async () => null));
    const showMessage = typeof props.showMessage === 'function'
        ? props.showMessage
        : (dashboard.showMessage || ((msg) => console.log(msg)));
    const emmaPopulateWatchlist = typeof props.emmaPopulateWatchlist === 'function'
        ? props.emmaPopulateWatchlist
        : (dashboard.emmaPopulateWatchlist || (async () => {}));
    const getCompanyLogo = props.getCompanyLogo
        || (typeof window !== 'undefined' ? window.BetaCombinedDashboardData?.getCompanyLogo : undefined)
        || dashboard.getCompanyLogo
        || ((ticker) => `https://financialmodelingprep.com/image-stock/${ticker}.png`);
    const API_BASE_URL = props.API_BASE_URL || dashboard.API_BASE_URL || '';
    const [watchlistTickers, setWatchlistTickers] = useState(initialTickers);
    const [newTicker, setNewTicker] = useState('');
    const [watchlistStockData, setWatchlistStockData] = useState({});
    const [watchlistLoading, setWatchlistLoading] = useState(false);
    const [showScreener, setShowScreener] = useState(false);
    const [loadingScreener, setLoadingScreener] = useState(false);
    const [screenerResults, setScreenerResults] = useState([]);
    const [screenerFilters, setScreenerFilters] = useState({
        minMarketCap: 0,
        maxPE: 50,
        minROE: 0,
        maxDebtEquity: 2.0,
        sector: 'all'
    });
    const WATCHLIST_FILE = '/dans-watchlist.json'; // servi depuis /public
    
    // Fonction pour exécuter le screener sur la watchlist
    const runWatchlistScreener = async () => {
        // Convertir les tickers en format attendu par le screener
        const watchlistStocks = watchlistTickers.map(ticker => ({
            symbol: ticker,
            name: ticker // Le nom sera récupéré par l'API
        }));
        
        setLoadingScreener(true);
        try {
            const results = [];
            
            for (const stock of watchlistStocks) {
                try {
                    const [quoteRes, profileRes, ratiosRes] = await Promise.allSettled([
                        fetch(`${API_BASE_URL}/api/marketdata?endpoint=quote&symbol=${stock.symbol}&source=auto`),
                        fetch(`${API_BASE_URL}/api/fmp?endpoint=profile&symbol=${stock.symbol}`),
                        fetch(`${API_BASE_URL}/api/fmp?endpoint=ratios&symbol=${stock.symbol}`)
                    ]);
                    
                    const quote = quoteRes.status === 'fulfilled' && quoteRes.value.ok 
                        ? await quoteRes.value.json() : null;
                    const profile = profileRes.status === 'fulfilled' && profileRes.value.ok 
                        ? await profileRes.value.json() : null;
                    const ratios = ratiosRes.status === 'fulfilled' && ratiosRes.value.ok 
                        ? await ratiosRes.value.json() : null;
                    
                    const stockData = {
                        symbol: stock.symbol,
                        name: profile?.data?.[0]?.companyName || profile?.companyName || stock.symbol,
                        price: quote?.c || 0,
                        change: quote?.dp || 0,
                        marketCap: profile?.data?.[0]?.mktCap || profile?.mktCap || 0,
                        pe: ratios?.data?.[0]?.peRatioTTM || ratios?.peRatioTTM || null,
                        roe: ratios?.data?.[0]?.returnOnEquityTTM || ratios?.returnOnEquityTTM || null,
                        debtEquity: ratios?.data?.[0]?.debtEquityRatioTTM || ratios?.debtEquityRatioTTM || null,
                        sector: profile?.data?.[0]?.sector || profile?.sector || 'Unknown'
                    };
                    
                    // Appliquer les filtres
                    if (stockData.marketCap >= screenerFilters.minMarketCap &&
                        (!stockData.pe || stockData.pe <= screenerFilters.maxPE) &&
                        (!stockData.roe || (stockData.roe * 100) >= screenerFilters.minROE) &&
                        (!stockData.debtEquity || stockData.debtEquity <= screenerFilters.maxDebtEquity) &&
                        (screenerFilters.sector === 'all' || stockData.sector === screenerFilters.sector)) {
                        results.push(stockData);
                    }
                } catch (error) {
                    console.error(`Erreur pour ${stock.symbol}:`, error);
                }
            }
            
            setScreenerResults(results);
            void(`✅ Screener Watchlist: ${results.length} résultats trouvés sur ${watchlistStocks.length} titres`);
        } catch (error) {
            console.error('Erreur screener:', error);
        } finally {
            setLoadingScreener(false);
        }
    };
    
    // Fonctions utilitaires
    const getMetricColor = (metric, value) => {
        if (value == null || value === 'N/A') return 'text-gray-400';
        const v = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(v)) return 'text-gray-400';
        
        switch(metric) {
            case 'PE':
                if (v < 0) return 'text-red-500';
                if (v < 15) return 'text-emerald-500';
                if (v < 25) return 'text-blue-500';
                if (v < 35) return 'text-yellow-500';
                return 'text-red-500';
            case 'ROE':
                if (v < 0) return 'text-red-500';
                if (v < 10) return 'text-green-500';
                if (v < 15) return 'text-yellow-500';
                if (v < 20) return 'text-blue-500';
                return 'text-emerald-500';
            case 'DE':
                if (v < 0.3) return 'text-emerald-500';
                if (v < 0.7) return 'text-blue-500';
                if (v < 1.5) return 'text-yellow-500';
                if (v < 2.5) return 'text-green-500';
                return 'text-red-500';
            default:
                return 'text-gray-400';
        }
    };
    
    const formatNumber = (num, prefix = '', suffix = '') => {
        if (!num && num !== 0) return 'N/A';
        const n = parseFloat(num);
        if (isNaN(n)) return 'N/A';
        if (n >= 1e12) return `${prefix}${(n / 1e12).toFixed(2)}T${suffix}`;
        if (n >= 1e9) return `${prefix}${(n / 1e9).toFixed(2)}B${suffix}`;
        if (n >= 1e6) return `${prefix}${(n / 1e6).toFixed(2)}M${suffix}`;
        if (n >= 1e3) return `${prefix}${(n / 1e3).toFixed(2)}K${suffix}`;
        return `${prefix}${n.toFixed(2)}${suffix}`;
    };

    // État pour éviter le rechargement de la watchlist
    const [watchlistLoaded, setWatchlistLoaded] = useState(false);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // Charger la watchlist UNE SEULE FOIS au démarrage
    useEffect(() => {
        if (watchlistLoaded) return; // Éviter les rechargements
        
        const loadInitialWatchlist = async () => {
            let tickers = [];
            try {
                // Essayer de charger depuis Supabase d'abord
                const res = await fetch('/api/supabase-watchlist');
                if (res.ok) {
                    const json = await res.json();
                    tickers = Array.isArray(json.tickers) ? json.tickers : [];
                    void('✅ Watchlist chargée depuis Supabase:', tickers);
                }
            } catch (e) {
                void('⚠️ Supabase non disponible, utilisation du localStorage');
            }
            
            if (!tickers.length) {
                // Fallback: charger depuis localStorage
                const savedWatchlist = localStorage.getItem('dans-watchlist');
                if (savedWatchlist) {
                    tickers = JSON.parse(savedWatchlist);
                    void('📦 Watchlist chargée depuis localStorage:', tickers);
                }
            }

            if (tickers.length) {
                setWatchlistTickers(tickers);
                localStorage.setItem('dans-watchlist', JSON.stringify(tickers));
                await loadWatchlistData(tickers);
            }

            setWatchlistLoaded(true);
            setInitialLoadComplete(true);
        };
        
        loadInitialWatchlist();
    }, []); // Dépendance vide = une seule fois au montage

    // Fallback: Individual ticker loading (used when batch fails)
    const loadWatchlistDataIndividual = async (tickers, dataObject) => {
        for (const ticker of tickers) {
            try {
                const data = await fetchStockData(ticker);
                if (data && !data.message) {
                    dataObject[ticker] = {
                        ...data,
                        timestamp: new Date().toISOString()
                    };
                }
            } catch (error) {
                console.error(`Erreur pour ${ticker}:`, error?.message || String(error));
            }
        }
    };

    // Charger les données pour les tickers de la watchlist (OPTIMIZED WITH BATCHING)
    const loadWatchlistData = async (tickers, appendMode = false) => {
        if (tickers.length === 0) return;

        setWatchlistLoading(true);
        const newData = {};

        try {
            // BATCH OPTIMIZATION: Use batch endpoint for multiple tickers
            if (tickers.length > 1) {
                void(`🚀 Batch loading ${tickers.length} tickers...`);
                const symbolsQuery = tickers.join(',');
                const batchResponse = await fetch(`${API_BASE_URL}/api/marketdata/batch?symbols=${symbolsQuery}&endpoints=quote,fundamentals`);

                if (batchResponse.ok) {
                    const batchData = await batchResponse.json();
                    void(`✅ Batch loaded: ${batchData.metadata?.total_data_points || 'N/A'} data points`);
                    void(`💰 API Calls Saved: ${batchData.metadata?.api_calls_saved || 'N/A'}`);

                    // Process batch results
                    if (batchData.success && batchData.data) {
                        const quotes = batchData.data.quote || {};
                        const fundamentals = batchData.data.fundamentals || {};

                        tickers.forEach(ticker => {
                            const tickerUpper = ticker.toUpperCase();
                            const quote = quotes[tickerUpper];
                            const fundamental = fundamentals[tickerUpper];

                            if (quote || fundamental) {
                                newData[ticker] = {
                                    symbol: tickerUpper,
                                    price: quote?.c || fundamental?.quote?.price || 0,
                                    change: quote?.d || fundamental?.quote?.change || 0,
                                    changePercent: quote?.dp || fundamental?.quote?.changesPercentage || 0,
                                    profile: fundamental?.profile || null,
                                    ratios: fundamental?.ratios || null,
                                    source: quote?.source || fundamental?.source || 'batch',
                                    timestamp: new Date().toISOString()
                                };
                            }
                        });
                    }
                } else {
                    console.warn('⚠️ Batch endpoint failed, falling back to individual requests');
                    // Fallback to individual requests
                    await loadWatchlistDataIndividual(tickers, newData);
                }
            } else {
                // Single ticker - use regular fetch
                await loadWatchlistDataIndividual(tickers, newData);
            }
        } catch (error) {
            console.error('❌ Batch loading error:', error);
            // Fallback to individual requests on error
            await loadWatchlistDataIndividual(tickers, newData);
        }

        // Si appendMode, ajouter aux données existantes au lieu de remplacer
        if (appendMode) {
            setWatchlistStockData(prev => ({ ...prev, ...newData }));
        } else {
            setWatchlistStockData(newData);
        }
        setWatchlistLoading(false);
    };

    // Ajouter un ticker à la watchlist
    const addTickerToWatchlist = async () => {
        if (!newTicker.trim()) return;
        
        const ticker = newTicker.trim().toUpperCase();
        if (watchlistTickers.includes(ticker)) {
            showMessage('Ce ticker est déjà dans la watchlist', 'warning');
            return;
        }
        
        // 1. AFFICHAGE IMMÉDIAT : Ajouter le ticker à la liste TOUT DE SUITE
        const updatedTickers = [...watchlistTickers, ticker];
        setWatchlistTickers(updatedTickers);
        localStorage.setItem('dans-watchlist', JSON.stringify(updatedTickers));
        setNewTicker('');
        // Message discret pour l'ajout
        void(`✅ ${ticker} ajouté à la watchlist`);
        
        // 2. Ajouter un placeholder avec état "loading" pour affichage immédiat
        setWatchlistStockData(prev => ({
            ...prev,
            [ticker]: {
                symbol: ticker,
                loading: true,
                timestamp: new Date().toISOString()
            }
        }));
        
        // 3. ARRIÈRE-PLAN : Charger les vraies données (sans bloquer l'UI)
        loadWatchlistData([ticker], true).catch(err => {
            console.error('Erreur chargement:', err);
        });
        
        // 4. ARRIÈRE-PLAN : Sauvegarder sur Supabase (sans bloquer l'UI)
        saveWatchlistToSupabaseAuto(ticker, 'add').catch(err => {
            console.error('Erreur sauvegarde Supabase:', err);
        });
    };

    // Supprimer un ticker de la watchlist
    const removeTickerFromWatchlist = async (ticker) => {
        // 1. SUPPRESSION IMMÉDIATE : Retirer de la liste TOUT DE SUITE
        const updatedTickers = watchlistTickers.filter(t => t !== ticker);
        setWatchlistTickers(updatedTickers);
        localStorage.setItem('dans-watchlist', JSON.stringify(updatedTickers));
        
        // 2. Supprimer les données du ticker immédiatement
        setWatchlistStockData(prev => {
            const newData = { ...prev };
            delete newData[ticker];
            return newData;
        });
        
        // Message discret pour la suppression
        void(`✅ ${ticker} supprimé de la watchlist`);
        
        // 3. ARRIÈRE-PLAN : Sauvegarder sur Supabase (sans bloquer l'UI)
        saveWatchlistToSupabaseAuto(ticker, 'remove').catch(err => {
            console.error('Erreur sauvegarde Supabase:', err);
        });
    };

    // Actualiser les données de la watchlist (silencieux)
    const refreshWatchlist = async () => {
        await loadWatchlistData(watchlistTickers);
        void('✅ Watchlist actualisée silencieusement');
    };

    // Timer pour debounce de la sauvegarde Supabase
    let saveSupabaseTimer = null;
    
    // Sauvegarder automatiquement la watchlist sur Supabase (silencieux avec debounce)
    const saveWatchlistToSupabaseAuto = async (ticker, action) => {
        // Annuler la sauvegarde précédente si elle est en attente
        if (saveSupabaseTimer) {
            clearTimeout(saveSupabaseTimer);
        }
        
        // Attendre 500ms avant de sauvegarder sur Supabase (debounce plus court)
        saveSupabaseTimer = setTimeout(async () => {
            try {
                const response = await fetch('/api/supabase-watchlist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: action,
                        ticker: ticker
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                
                const result = await response.json();
                void(`✅ Supabase: ${result.message}`);
            } catch (e) {
                console.error('⚠️ Erreur sauvegarde Supabase:', e);
                // Silencieux pour ne pas perturber l'UX
            }
        }, 500); // Debounce de 500ms (plus rapide que GitHub)
    };

    // Sauvegarder manuellement la watchlist dans Supabase (avec confirmation)
    const saveWatchlistToSupabase = async () => {
        try {
            const response = await fetch('/api/supabase-watchlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save',
                    tickers: watchlistTickers
                })
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const result = await response.json();
            void('✅ Watchlist sauvegardée sur Supabase');
        } catch (e) {
            console.error('Erreur sauvegarde Supabase watchlist:', e);
            showMessage('Erreur sauvegarde Supabase', 'error');
        }
    };

    // Charger la watchlist depuis Supabase
    const loadWatchlistFromSupabase = async () => {
        try {
            const res = await fetch('/api/supabase-watchlist');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            const tickers = Array.isArray(json.tickers) ? json.tickers : [];
            setWatchlistTickers(tickers);
            localStorage.setItem('dans-watchlist', JSON.stringify(tickers));
            await loadWatchlistData(tickers);
            void('✅ Watchlist chargée depuis Supabase');
        } catch (e) {
            console.error('Erreur chargement Supabase watchlist:', e);
            showMessage('Erreur chargement Supabase', 'error');
        }
    };

    // Effet pour initialiser le TradingView TickerBanner avec les tickers de la watchlist
    useEffect(() => {
        const widgetContainer = document.getElementById('tradingview-ticker-dan-watchlist');

        if (watchlistTickers.length > 0 && widgetContainer) {
            // Supprimer le contenu existant
            widgetContainer.innerHTML = '';

            // Créer les symboles formatés pour TradingView (EXCHANGE:TICKER)
            // Par défaut, on assume que les tickers US sont sur NASDAQ ou NYSE
            const tvSymbols = watchlistTickers.map(ticker => {
                // Détecter les tickers canadiens (qui se terminent souvent par .TO, .V, etc.)
                if (ticker.includes('.TO') || ticker.includes('.V')) {
                    return { "proName": `TSX:${ticker.replace(/\.(TO|V)/, '')}`, "title": ticker };
                }
                // Par défaut, utiliser NASDAQ pour les tickers US
                return { "proName": `NASDAQ:${ticker}`, "title": ticker };
            });

            // Créer le script TradingView
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
            script.async = true;
            script.innerHTML = JSON.stringify({
                "symbols": tvSymbols.slice(0, 20), // Limiter à 20 symboles pour performance
                "showSymbolLogo": true,
                "isTransparent": isDarkMode,
                "displayMode": "adaptive",
                "colorTheme": isDarkMode ? "dark" : "light",
                "locale": "fr"
            });

            widgetContainer.appendChild(script);
        }

        // Cleanup function to prevent memory leaks
        return () => {
            if (widgetContainer) {
                widgetContainer.innerHTML = '';
            }
        };
    }, [watchlistTickers, isDarkMode]);

    return (
        <div className="space-y-6">



            {/* TradingView TickerBanner - VAGUE 2: Quick Wins */}
            {watchlistTickers.length > 0 && (
                <div className={`rounded-lg overflow-hidden border transition-colors duration-300 ${
                    isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
                }`}>
                    <div className="tradingview-widget-container" style={{ height: '62px' }}>
                        <div id="tradingview-ticker-dan-watchlist" style={{ height: '100%' }}></div>
                    </div>
                </div>
            )}

            {/* Screener pour Dan's Watchlist - Identique à celui d'JLab */}
            {showScreener && (
                <div className={`border rounded-lg p-3 transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">🔍</span>
                            <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Screener - Dan's Watchlist
                            </h3>
                            <span className="text-xs text-gray-500">({watchlistTickers.length} titres)</span>
                        </div>
                        <button
                            onClick={() => setShowScreener(false)}
                            className={`p-1 rounded ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                        >
                            <span className="text-gray-500">✕</span>
                        </button>
                    </div>
                    
                    {/* Filtres - Mêmes que JLab */}
                    <div className="grid grid-cols-5 gap-2 mb-3">
                        <div>
                            <label className="text-[9px] text-gray-500 mb-1 block">Market Cap Min (B$)</label>
                            <input
                                type="number"
                                value={screenerFilters.minMarketCap / 1e9}
                                onChange={(e) => setScreenerFilters({...screenerFilters, minMarketCap: parseFloat(e.target.value || 0) * 1e9})}
                                className={`w-full px-2 py-1 text-xs rounded border ${
                                    isDarkMode 
                                        ? 'bg-gray-800 border-gray-700 text-white' 
                                        : 'bg-white border-gray-300 text-gray-900'
                                }`}
                            />
                        </div>
                        <div>
                            <label className="text-[9px] text-gray-500 mb-1 block">P/E Max</label>
                            <input
                                type="number"
                                value={screenerFilters.maxPE}
                                onChange={(e) => setScreenerFilters({...screenerFilters, maxPE: parseFloat(e.target.value || 50)})}
                                className={`w-full px-2 py-1 text-xs rounded border ${
                                    isDarkMode 
                                        ? 'bg-gray-800 border-gray-700 text-white' 
                                        : 'bg-white border-gray-300 text-gray-900'
                                }`}
                            />
                        </div>
                        <div>
                            <label className="text-[9px] text-gray-500 mb-1 block">ROE Min (%)</label>
                            <input
                                type="number"
                                value={screenerFilters.minROE}
                                onChange={(e) => setScreenerFilters({...screenerFilters, minROE: parseFloat(e.target.value || 0)})}
                                className={`w-full px-2 py-1 text-xs rounded border ${
                                    isDarkMode 
                                        ? 'bg-gray-800 border-gray-700 text-white' 
                                        : 'bg-white border-gray-300 text-gray-900'
                                }`}
                            />
                        </div>
                        <div>
                            <label className="text-[9px] text-gray-500 mb-1 block">D/E Max</label>
                            <input
                                type="number"
                                step="0.1"
                                value={screenerFilters.maxDebtEquity}
                                onChange={(e) => setScreenerFilters({...screenerFilters, maxDebtEquity: parseFloat(e.target.value || 2)})}
                                className={`w-full px-2 py-1 text-xs rounded border ${
                                    isDarkMode 
                                        ? 'bg-gray-800 border-gray-700 text-white' 
                                        : 'bg-white border-gray-300 text-gray-900'
                                }`}
                            />
                        </div>
                        <div>
                            <label className="text-[9px] text-gray-500 mb-1 block">Secteur</label>
                            <select
                                value={screenerFilters.sector}
                                onChange={(e) => setScreenerFilters({...screenerFilters, sector: e.target.value})}
                                className={`w-full px-2 py-1 text-xs rounded border ${
                                    isDarkMode 
                                        ? 'bg-gray-800 border-gray-700 text-white' 
                                        : 'bg-white border-gray-300 text-gray-900'
                                }`}
                            >
                                <option value="all">Tous</option>
                                <option value="Technology">Technologie</option>
                                <option value="Consumer Cyclical">Consommation</option>
                                <option value="Healthcare">Santé</option>
                                <option value="Financial">Finance</option>
                            </select>
                        </div>
                    </div>
                    
                    <button
                        onClick={runWatchlistScreener}
                        disabled={loadingScreener || watchlistTickers.length === 0}
                        className={`w-full py-2 rounded text-sm font-semibold transition-colors ${
                            loadingScreener
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gray-800 hover:bg-gray-700 text-white'
                        }`}
                    >
                        {loadingScreener ? '⏳ Analyse en cours...' : `🔍 Analyser ma Watchlist (${watchlistTickers.length} titres)`}
                    </button>
                    
                    {/* Résultats */}
                    {screenerResults.length > 0 && (
                        <div className="mt-3">
                            <div className="text-xs text-gray-500 mb-2">
                                {screenerResults.length} titre(s) correspondant aux critères
                            </div>
                            <div className={`max-h-64 overflow-y-auto border rounded ${
                                isDarkMode ? 'border-gray-700' : 'border-gray-300'
                            }`}>
                                <table className="w-full text-xs">
                                    <thead className={`sticky top-0 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                        <tr>
                                            <th className="text-left p-2 text-gray-500">Symbole</th>
                                            <th className="text-right p-2 text-gray-500">Prix</th>
                                            <th className="text-right p-2 text-gray-500">Var %</th>
                                            <th className="text-right p-2 text-gray-500">Cap.</th>
                                            <th className="text-right p-2 text-gray-500">P/E</th>
                                            <th className="text-right p-2 text-gray-500">ROE</th>
                                            <th className="text-right p-2 text-gray-500">D/E</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {screenerResults.map((stock) => (
                                            <tr key={stock.symbol} className={`border-t ${
                                                isDarkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'
                                            }`}>
                                                <td className="p-2">
                                                    <div className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stock.symbol}</div>
                                                    <div className="text-[9px] text-gray-500">{stock.name}</div>
                                                </td>
                                                <td className={`text-right p-2 font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    ${stock.price.toFixed(2)}
                                                </td>
                                                <td className={`text-right p-2 font-semibold ${
                                                    stock.change >= 0 ? 'text-emerald-500' : 'text-red-500'
                                                }`}>
                                                    {(() => {
                                                        const change = stock.change;
                                                        if (!change) return '0.00%';
                                                        const value = typeof change === 'number' ? change : 
                                                                     typeof change === 'object' ? (change.raw || change.fmt || 0) : 
                                                                     parseFloat(change) || 0;
                                                        return (value >= 0 ? '+' : '') + value.toFixed(2) + '%';
                                                    })()}
                                                </td>
                                                <td className="text-right p-2 text-gray-400">
                                                    {formatNumber(stock.marketCap)}
                                                </td>
                                                <td className={`text-right p-2 font-semibold ${getMetricColor('PE', stock.pe)}`}>
                                                    {stock.pe ? stock.pe.toFixed(1) : 'N/A'}
                                                </td>
                                                <td className={`text-right p-2 font-semibold ${getMetricColor('ROE', stock.roe ? stock.roe * 100 : null)}`}>
                                                    {stock.roe ? (stock.roe * 100).toFixed(1) + '%' : 'N/A'}
                                                </td>
                                                <td className={`text-right p-2 font-semibold ${getMetricColor('DE', stock.debtEquity)}`}>
                                                    {stock.debtEquity ? stock.debtEquity.toFixed(2) : 'N/A'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            <div className="flex justify-between items-center">
                <h2 className={`text-2xl font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>👀 Dan's Watchlist</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowScreener(!showScreener)}
                        className={`px-4 py-2 rounded transition-colors ${
                            showScreener
                                ? 'bg-gray-800 text-white'
                                : (isDarkMode 
                                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900')
                        }`}
                    >
                        {showScreener ? '✕ Fermer Screener' : '🔍 Ouvrir Screener'}
                    </button>
                    <button
                        onClick={refreshWatchlist}
                        disabled={watchlistLoading || watchlistTickers.length === 0}
                        className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                        {watchlistLoading ? 'Actualisation...' : '🔄 Actualiser'}
                    </button>
                    <button
                        onClick={emmaPopulateWatchlist}
                        disabled={watchlistLoading}
                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        <span>🤖</span>
                        Emma Populate
                    </button>
                    <div className={`text-sm px-4 py-2 rounded ${
                        isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                    }`}>
                        {!initialLoadComplete ? '⏳ Chargement initial...' : '🚀 Supabase + Arrière-plan silencieux'}
                    </div>
                </div>
            </div>

            {/* Section d'ajout de ticker */}
            <div className={`backdrop-blur-sm rounded-lg p-6 border transition-colors duration-300 ${
                isDarkMode 
                    ? 'bg-gray-900 border-gray-700' 
                    : 'bg-gray-50 border-gray-200'
            }`}>
                <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>➕ Ajouter un Ticker</h3>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newTicker}
                        onChange={(e) => setNewTicker(e.target.value)}
                        placeholder="Ex: AAPL, TSLA, GOOGL..."
                        className={`flex-1 px-3 py-2 rounded-lg border transition-colors duration-300 ${
                            isDarkMode 
                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                        onKeyPress={(e) => e.key === 'Enter' && addTickerToWatchlist()}
                    />
                    <button
                        onClick={addTickerToWatchlist}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                        ➕ Ajouter
                    </button>
                </div>
                <p className={`text-sm mt-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                    💡 Ces tickers ne seront visibles que dans cette watchlist personnalisée
                </p>
            </div>

            {/* Liste des tickers de la watchlist */}
            {watchlistTickers.length > 0 ? (
                <div className={`backdrop-blur-sm rounded-lg p-6 border transition-colors duration-300 ${
                    isDarkMode 
                        ? 'bg-gray-900 border-gray-700' 
                        : 'bg-gray-50 border-gray-200'
                }`}>
                    <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                        📊 Tickers de la Watchlist ({watchlistTickers.length})
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {watchlistTickers.map(ticker => {
                            const data = watchlistStockData[ticker];
                            const change = data?.dp ? (data.dp >= 0 ? '+' : '') + data.dp.toFixed(2) + '%' : 'N/A';
                            const changeColor = data?.dp >= 0 ? 'text-green-400' : 'text-red-400';
                            const changeBgColor = data?.dp >= 0 ? 'bg-green-500' : 'bg-red-500';
                            
                            return (
                                <div key={ticker} className={`rounded-lg p-4 border transition-colors duration-300 ${
                                    isDarkMode 
                                        ? 'bg-gray-800 border-gray-600 hover:border-blue-400/50' 
                                        : 'bg-white border-gray-300 hover:border-blue-300'
                                }`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <img 
                                                src={getCompanyLogo(ticker)} 
                                                alt={`${ticker} logo`}
                                                className="w-8 h-8 rounded"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                            <h4 className={`font-bold text-lg transition-colors duration-300 ${
                                                isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>{ticker}</h4>
                                        </div>
                                        <button
                                            onClick={() => removeTickerFromWatchlist(ticker)}
                                            className={`p-1 rounded transition-colors duration-300 ${
                                                isDarkMode 
                                                    ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/20' 
                                                    : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                                            }`}
                                            title="Supprimer de la watchlist"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    
                                    {data ? (
                                        <>
                                            <div className={`rounded-lg p-3 mb-3 transition-colors duration-300 ${
                                                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                                            }`}>
                                                <div className={`text-2xl font-bold mb-1 transition-colors duration-300 ${
                                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                                }`}>
                                                    ${data.c?.toFixed(2) || 'N/A'}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-3 h-3 ${changeBgColor} rounded`}></div>
                                                    <span className={`text-sm font-medium ${changeColor}`}>
                                                        {change}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className={`transition-colors duration-300 ${
                                                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                    }`}>Volume:</span>
                                                    <span className={`transition-colors duration-300 ${
                                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                                    }`}>{data.v?.toLocaleString() || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className={`transition-colors duration-300 ${
                                                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                    }`}>High:</span>
                                                    <span className={`transition-colors duration-300 ${
                                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                                    }`}>${data.h?.toFixed(2) || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className={`transition-colors duration-300 ${
                                                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                    }`}>Low:</span>
                                                    <span className={`transition-colors duration-300 ${
                                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                                    }`}>${data.l?.toFixed(2) || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className={`text-center py-4 transition-colors duration-300 ${
                                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                        }`}>
                                            <div className="animate-spin w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                                            <span className="text-sm">Chargement...</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className={`backdrop-blur-sm rounded-lg p-8 border transition-colors duration-300 ${
                    isDarkMode 
                        ? 'bg-gray-900 border-gray-700' 
                        : 'bg-gray-50 border-gray-200'
                } text-center`}>
                    <div className="text-6xl mb-4">👀</div>
                    <h3 className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Watchlist Vide</h3>
                    <p className={`transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                        Ajoutez des tickers pour commencer à suivre vos investissements personnalisés
                    </p>
                </div>
            )}
        </div>
    );
};

window.DansWatchlistTab = DansWatchlistTab;
