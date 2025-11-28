// Main Dashboard Component - Refactored to use modular tab components
// Compatible with Babel standalone (no ES6 imports, uses window.* globals)

const { useState, useEffect, useRef } = React;

/**
 * Main Dashboard Component
 * Manages all state and orchestrates tab rendering
 * Extracted from beta-combined-dashboard.html
 */
const BetaCombinedDashboard = () => {
    // ============================================
    // ÉTATS PRINCIPAUX
    // ============================================
    const [activeTab, setActiveTab] = useState('intellistocks'); // Onglet par défaut: JLab™
    const [tickers, setTickers] = useState([]);
    const [teamTickers, setTeamTickers] = useState([]);
    const [watchlistTickers, setWatchlistTickers] = useState([]);
    const [stockData, setStockData] = useState({});
    const [newsData, setNewsData] = useState([]);
    const [newsContext, setNewsContext] = useState('general'); // general, quebec, french_canada, crypto, analysis
    const [githubUser, setGithubUser] = useState(null);
    const [finvizNews, setFinvizNews] = useState({}); // Dernières news Finviz par ticker
    const [tickerLatestNews, setTickerLatestNews] = useState({}); // News la plus récente par ticker
    const [tickerMoveReasons, setTickerMoveReasons] = useState({}); // Raisons de mouvement par ticker
    const [seekingAlphaData, setSeekingAlphaData] = useState({});
    const [seekingAlphaStockData, setSeekingAlphaStockData] = useState({});
    const [economicCalendarData, setEconomicCalendarData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [selectedStock, setSelectedStock] = useState(null);
    const [newTicker, setNewTicker] = useState('');
    const [showTickerManager, setShowTickerManager] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [showAdmin, setShowAdmin] = useState(false);
    const [apiStatus, setApiStatus] = useState({});
    const [viewMode, setViewMode] = useState('cards');
    const [seekingAlphaViewMode, setSeekingAlphaViewMode] = useState('list'); // list par défaut
    const [newsFilter, setNewsFilter] = useState('all'); // Filtre pour les actualités
    const [filteredNews, setFilteredNews] = useState([]); // Actualités filtrées
    const [frenchOnly, setFrenchOnly] = useState(false); // Filtre pour nouvelles en français
    
    // États pour les slash commands
    const [showSlashSuggestions, setShowSlashSuggestions] = useState(false);
    const [slashSuggestions, setSlashSuggestions] = useState([]);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const [showCommandsHelp, setShowCommandsHelp] = useState(false);

    // États pour la gestion du cache
    const [cacheSettings, setCacheSettings] = useState(() => {
        const saved = localStorage.getItem('cacheSettings');
        return saved ? JSON.parse(saved) : {
            maxAgeHours: 4,
            refreshOnNavigation: true,
            refreshIntervalMinutes: 10
        };
    });
    const [cacheStatus, setCacheStatus] = useState({});
    const [loadingCacheStatus, setLoadingCacheStatus] = useState(false);

    // États pour l'interface Seeking Alpha
    const [githubToken, setGithubToken] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    const [showScraperPopup, setShowScraperPopup] = useState(false);

    // États pour la modal de comparaison de peers
    const [showPeersModal, setShowPeersModal] = useState(false);
    const [selectedTickerForPeers, setSelectedTickerForPeers] = useState(null);
    const [peersData, setPeersData] = useState(null);
    const [loadingPeers, setLoadingPeers] = useState(false);

    // États pour le scraping
    const [scrapingStatus, setScrapingStatus] = useState('idle'); // 'idle', 'running', 'completed', 'error'
    const [scrapingProgress, setScrapingProgress] = useState(0);
    const [scrapingLogs, setScrapingLogs] = useState([]);

    // États pour les logs système (Admin JSL)
    const [systemLogs, setSystemLogs] = useState([]);

    // État pour le thème (dark par défaut, respecte localStorage)
    const [isDarkMode, setIsDarkMode] = useState(() => {
        try {
            const saved = localStorage.getItem('theme');
            if (saved === 'dark') return true;
            if (saved === 'light') return false;
        } catch (_) { }
        return true; // défaut: dark
    });

    // Récupérer le login ID de l'utilisateur connecté depuis sessionStorage
    const getUserLoginId = () => {
        try {
            const userJson = sessionStorage.getItem('gob-user');
            if (userJson) {
                const user = JSON.parse(userJson);
                return user.username || user.display_name || githubUser?.login || githubUser?.name || 'toi';
            }
        } catch (e) {
            console.warn('Erreur récupération utilisateur:', e);
        }
        return githubUser?.login || githubUser?.name || 'toi';
    };
    const userDisplayName = getUserLoginId();
    const assistantAvatar = isDarkMode ? '/emma-avatar-gob-light.jpg' : '/emma-avatar-gob-dark.jpg';
    const [showEmmaAvatar, setShowEmmaAvatar] = useState(true);
    const openAskEmma = () => {
        setActiveTab('ask-emma');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Professional Mode State
    const [isProfessionalMode, setIsProfessionalMode] = useState(() => {
        return window.ProfessionalModeSystem?.isEnabled() || false;
    });

    const [showEmmaIntro, setShowEmmaIntro] = useState(false);
    const [showDanIntro, setShowDanIntro] = useState(false);
    const [showJLabIntro, setShowJLabIntro] = useState(false);
    const [showSeekingAlphaIntro, setShowSeekingAlphaIntro] = useState(false);
    const [emmaPrefillMessage, setEmmaPrefillMessage] = useState('');
    const [emmaAutoSend, setEmmaAutoSend] = useState(false); // Auto-send prefilled message
    const [tickerData, setTickerData] = useState([]);
    const [tabsVisitedThisSession, setTabsVisitedThisSession] = useState({});
    const [showMoreTabsOverlay, setShowMoreTabsOverlay] = useState(false);
    
    // useRef hooks
    const clickSoundRef = useRef(null);
    const tabSoundRef = useRef(null);
    const audioCtxRef = useRef(null);
    const tickerTapeRef = useRef(null);
    const stocksLoadingRef = useRef(false); // Pour éviter les chargements multiples
    const batchLoadedRef = useRef(false); // Pour suivre si le batch a déjà chargé les données

    // États pour Emma (partagés entre AskEmmaTab et AdminJSLaiTab)
    const [emmaConnected, setEmmaConnected] = useState(false);
    const [showPromptEditor, setShowPromptEditor] = useState(false);
    const [showTemperatureEditor, setShowTemperatureEditor] = useState(false);
    const [showLengthEditor, setShowLengthEditor] = useState(false);

    // États pour Admin JSLAI (health check, logs, etc.)
    const [healthStatus, setHealthStatus] = useState(null);
    const [healthCheckLoading, setHealthCheckLoading] = useState(false);
    const [processLog, setProcessLog] = useState([]);
    const [showDebug, setShowDebug] = useState(false);
    const [showFullLog, setShowFullLog] = useState(false);

    // État de chargement initial pour éviter les réactualisations
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const [showLoadingScreen, setShowLoadingScreen] = useState(true);
    
    // États pour forcer le re-render lorsque les modules sont chargés
    const [modulesLoaded, setModulesLoaded] = useState(false);
    const [modulesCheckCount, setModulesCheckCount] = useState(0);

    // Configuration API
    const API_BASE_URL = (window.location && window.location.origin) ? window.location.origin : '';

    // Configuration GitHub
    const GITHUB_REPO = 'projetsjsl/GOB';
    const GITHUB_BRANCH = 'main';

    // ============================================
    // FONCTIONS UTILITAIRES
    // ============================================
    
    // Fonction helper pour logging
    const addLog = (text, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString('fr-FR');
        const logEntry = { timestamp, text, type };
        setSystemLogs(prev => [logEntry, ...prev].slice(0, 100)); // Garder max 100 logs
        console.log(`[${timestamp}] ${type.toUpperCase()}: ${text}`);
    };

    // Messages overlay (seulement pour erreurs critiques)
    const showMessage = (text, type = 'info') => {
        // Log toutes les messages dans Admin JSL
        addLog(text, type);

        // Afficher overlay seulement pour erreurs critiques
        if (type === 'error') {
            setMessage({ text, type });
            setTimeout(() => setMessage(null), 4000);
        }
    };

    // Fonction pour récupérer les données d'un ticker
    const fetchStockData = async (ticker) => {
        try {
            // Essayer d'abord la nouvelle API unifiée avec Yahoo Finance (gratuit)
            const response = await fetch(`${API_BASE_URL}/api/marketdata?endpoint=quote&symbol=${ticker}&source=auto`);
            if (!response.ok) throw new Error(`API error: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Erreur fetch stock data (marketdata):', error?.message || String(error));
            // Rester sur marketdata; l'API gère déjà ses fallbacks internes
            return null;
        }
    };

    // Fonction helper pour appels parallèles individuels (fallback)
    const refreshAllStocksParallel = async (tickersList, newStockData, counters) => {
        const promises = tickersList.map(async (ticker) => {
            try {
                const [data, fundamentalsResp] = await Promise.allSettled([
                    fetchStockData(ticker),
                    fetch(`${API_BASE_URL}/api/marketdata?endpoint=fundamentals&symbol=${ticker}&source=auto`)
                ]);

                const stockData = data.status === 'fulfilled' ? data.value : null;
                let fundamentals = null;

                if (fundamentalsResp.status === 'fulfilled' && fundamentalsResp.value.ok) {
                    fundamentals = await fundamentalsResp.value.json();
                }

                if (stockData && !stockData.message) {
                    newStockData[ticker] = {
                        ...stockData,
                        fundamentals,
                        timestamp: new Date().toISOString()
                    };
                    counters.successCount++;
                    return { ticker, success: true };
                } else {
                    counters.errorCount++;
                    return { ticker, success: false };
                }
            } catch (error) {
                console.error(`❌ ${ticker}: Erreur`, error?.message || String(error));
                counters.errorCount++;
                return { ticker, success: false };
            }
        });

        await Promise.all(promises);
        newStockData._successCount = counters.successCount;
        newStockData._errorCount = counters.errorCount;
    };

    // Fonction pour charger les tickers depuis Supabase
    const loadTickersFromSupabase = async () => {
        try {
            // Vérifier d'abord les données préchargées depuis la page de login
            const preloadedDataStr = sessionStorage.getItem('preloaded-dashboard-data');
            if (preloadedDataStr) {
                try {
                    const preloadedData = JSON.parse(preloadedDataStr);
                    const dataAge = Date.now() - (preloadedData.timestamp || 0);
                    const MAX_AGE = 5 * 60 * 1000; // 5 minutes

                    if (preloadedData.titlesTabData?.tickers && dataAge < MAX_AGE) {
                        console.log('⚡ Utilisation des tickers préchargés pour l\'onglet Titres');
                        const preloadedTickers = preloadedData.titlesTabData.tickers;
                        setTeamTickers(preloadedTickers);
                        setWatchlistTickers(preloadedTickers);
                        setTickers(preloadedTickers);
                        console.log(`✅ ${preloadedTickers.length} tickers chargés depuis préchargement`);

                        // Charger aussi les données de marché préchargées si disponibles
                        if (preloadedData.titlesTabData.stockData && Object.keys(preloadedData.titlesTabData.stockData).length > 0) {
                            console.log('⚡ Utilisation des données de marché préchargées');
                            setStockData(preloadedData.titlesTabData.stockData);
                            setLastUpdate(new Date(preloadedData.timestamp));
                        } else {
                            // Si pas de données préchargées, forcer le chargement
                            console.log('⚠️ Pas de données préchargées disponibles, chargement sera déclenché automatiquement');
                        }

                        // Charger aussi les nouvelles préchargées si disponibles
                        if (preloadedData.titlesTabData.newsData) {
                            console.log('⚡ Utilisation des nouvelles préchargées');
                            setNewsData(preloadedData.titlesTabData.newsData);
                            setFilteredNews(preloadedData.titlesTabData.newsData);
                        }

                        // Charger aussi les nouvelles par ticker préchargées si disponibles
                        if (preloadedData.titlesTabData.tickerLatestNews) {
                            console.log('⚡ Utilisation des nouvelles par ticker préchargées');
                            setTickerLatestNews(preloadedData.titlesTabData.tickerLatestNews);
                        }

                        return;
                    }
                } catch (e) {
                    console.warn('⚠️ Erreur lecture données préchargées:', e);
                }
            }

            console.log('📊 Chargement des tickers depuis Supabase...');
            const response = await fetch('/api/config/tickers');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setTeamTickers(data.team_tickers || []);
                setWatchlistTickers(data.watchlist_tickers || []);
                setTickers(data.team_tickers || []); // Utiliser team_tickers par défaut
                console.log(`✅ Tickers chargés: ${data.team_tickers?.length || 0} équipe, ${data.watchlist_tickers?.length || 0} watchlist`);
            } else {
                throw new Error(data.error || 'Failed to fetch tickers');
            }
        } catch (error) {
            console.error('❌ Erreur chargement tickers:', error.message);
            // Fallback vers liste hardcodée
            const fallbackTickers = [
                'GOOGL', 'T', 'BNS', 'TD', 'BCE', 'CNR', 'CSCO', 'CVS', 'DEO', 'MDT',
                'JNJ', 'JPM', 'LVMHF', 'MG', 'MFC', 'MU', 'NSRGY', 'NKE', 'NTR', 'PFE',
                'TRP', 'UNH', 'UL', 'VZ', 'WFC'
            ];
            setTeamTickers(fallbackTickers);
            setWatchlistTickers(fallbackTickers);
            setTickers(fallbackTickers);
            console.log('⚠️ Utilisation des tickers de fallback');
        }
    };
    
    // Actualités via endpoint unifié (FMP, Finnhub, Finviz, RSS)
    const fetchNews = async () => {
        addLog('📰 Démarrage récupération actualités via endpoint unifié...', 'info');

        // Vérifier d'abord les données préchargées depuis la page de login
        const preloadedDataStr = sessionStorage.getItem('preloaded-dashboard-data');
        if (preloadedDataStr) {
            try {
                const preloadedData = JSON.parse(preloadedDataStr);
                const dataAge = Date.now() - (preloadedData.timestamp || 0);
                const MAX_AGE = 5 * 60 * 1000; // 5 minutes

                if (preloadedData.titlesTabData?.newsData && dataAge < MAX_AGE) {
                    console.log('⚡ Utilisation des nouvelles préchargées pour l\'onglet Titres');
                    setNewsData(preloadedData.titlesTabData.newsData);
                    setFilteredNews(preloadedData.titlesTabData.newsData);
                    addLog(`✅ ${preloadedData.titlesTabData.newsData.length} nouvelles chargées depuis préchargement`, 'success');
                    return;
                }
            } catch (e) {
                console.warn('⚠️ Erreur lecture nouvelles préchargées:', e);
            }
        }

        // 1. Vérifier le cache Supabase d'abord
        try {
            const cacheResponse = await fetch(
                `${API_BASE_URL}/api/supabase-daily-cache?type=general_news&date=${new Date().toISOString().split('T')[0]}&maxAgeHours=${cacheSettings.maxAgeHours || 4}`
            );

            if (cacheResponse.ok) {
                const cacheResult = await cacheResponse.json();
                if (cacheResult.success && cacheResult.cached && !cacheResult.expired) {
                    console.log('✅ Nouvelles depuis cache Supabase');
                    const cachedArticles = cacheResult.data || [];
                    setNewsData(cachedArticles);
                    setFilteredNews(cachedArticles);
                    addLog(`✅ ${cachedArticles.length} actualités chargées depuis cache Supabase`, 'success');
                    return;
                }
            }
        } catch (error) {
            console.warn('⚠️ Erreur récupération cache (non bloquant):', error.message);
        }

        const defaultTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
        const availableTickers = tickers.length > 0 ? tickers : defaultTickers;
        const tickersQuery = availableTickers.slice(0, 5).join(' OR ');

        try {
            // Utiliser l'endpoint unifié qui agrège toutes les sources avec déduplication et scoring
            addLog(`🔍 Récupération depuis endpoint unifié (contexte: ${newsContext})...`, 'info');

            const response = await fetch(
                `${API_BASE_URL}/api/news?q=${encodeURIComponent(tickersQuery)}&limit=100&context=${newsContext}`
            );

            if (!response.ok) {
                throw new Error(`News API error: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.articles && data.articles.length > 0) {
                // Formater les articles pour compatibilité avec l'UI existante
                const formattedArticles = data.articles.map(article => ({
                    title: article.title || article.headline,
                    description: article.summary || '',
                    url: article.url,
                    publishedAt: article.published_at || article.datetime || article.date,
                    source: {
                        name: article.source_original || article.source || article.source_provider || 'Unknown',
                        provider: article.source_provider
                    },
                    relevance_score: article.relevance_score,
                    sentiment: 'neutral', // Peut être enrichi plus tard
                    category: article.category || 'general',
                    image: article.image
                }));

                // Trier par score de pertinence (déjà trié par l'API, mais on peut re-trier pour être sûr)
                const sortedNews = formattedArticles.sort((a, b) =>
                    (b.relevance_score || 0) - (a.relevance_score || 0)
                );

                setNewsData(sortedNews);
                setFilteredNews(sortedNews);
                addLog(`✅ ${sortedNews.length} actualités chargées depuis ${data.sources?.join(', ') || 'sources multiples'} (contexte: ${newsContext})`, 'success');

                // Sauvegarder dans le cache Supabase (write-through)
                try {
                    await fetch(`${API_BASE_URL}/api/supabase-daily-cache`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'general_news',
                            date: new Date().toISOString().split('T')[0],
                            data: sortedNews
                        })
                    });
                    console.log('✅ Nouvelles sauvegardées dans cache Supabase');
                } catch (error) {
                    console.warn('⚠️ Erreur sauvegarde cache (non bloquant):', error.message);
                }
            } else {
                addLog('⚠️ Aucune actualité trouvée', 'warning');
                setNewsData([]);
                setFilteredNews([]);
            }

        } catch (error) {
            addLog(`❌ ERREUR: ${error.message}`, 'error');
            addLog('💡 Vérifiez les clés API dans Admin JSLAI', 'warning');
            setNewsData([]);
            setFilteredNews([]);
        }
    };
    
    // Fonction SIMPLIFIÉE pour récupérer les news par ticker
    // Utilise l'API unifiée /api/news qui agrège déjà toutes les sources (FMP, Finnhub, Finviz, RSS)
    const fetchLatestNewsForTickers = async () => {
        console.log('📰 Chargement des news récentes et explications de mouvement pour chaque ticker...');

        // Vérifier d'abord les données préchargées depuis la page de login
        const preloadedDataStr = sessionStorage.getItem('preloaded-dashboard-data');
        if (preloadedDataStr) {
            try {
                const preloadedData = JSON.parse(preloadedDataStr);
                const dataAge = Date.now() - (preloadedData.timestamp || 0);
                const MAX_AGE = 5 * 60 * 1000; // 5 minutes

                if (preloadedData.titlesTabData?.tickerLatestNews && dataAge < MAX_AGE) {
                    console.log('⚡ Utilisation des nouvelles par ticker préchargées');
                    setTickerLatestNews(preloadedData.titlesTabData.tickerLatestNews);
                    if (preloadedData.titlesTabData.tickerMoveReasons) {
                        setTickerMoveReasons(preloadedData.titlesTabData.tickerMoveReasons);
                    }
                    console.log(`✅ Nouvelles préchargées pour ${Object.keys(preloadedData.titlesTabData.tickerLatestNews).length} tickers`);
                    return;
                }
            } catch (e) {
                console.warn('⚠️ Erreur lecture nouvelles par ticker préchargées:', e);
            }
        }

        // 1. Vérifier le cache Supabase d'abord
        try {
            const cacheResponse = await fetch(
                `${API_BASE_URL}/api/supabase-daily-cache?type=ticker_news&date=${new Date().toISOString().split('T')[0]}&maxAgeHours=${cacheSettings.maxAgeHours || 4}`
            );

            if (cacheResponse.ok) {
                const cacheResult = await cacheResponse.json();
                if (cacheResult.success && cacheResult.cached && !cacheResult.expired) {
                    console.log('✅ Nouvelles par ticker depuis cache Supabase');
                    const cachedData = cacheResult.data || {};
                    if (cachedData.newsMap) {
                        setTickerLatestNews(cachedData.newsMap);
                    }
                    if (cachedData.moveReasonsMap) {
                        setTickerMoveReasons(cachedData.moveReasonsMap);
                    }
                    return;
                }
            }
        } catch (error) {
            console.warn('⚠️ Erreur récupération cache (non bloquant):', error.message);
        }

        const newsMap = {};
        const moveReasonsMap = {};

        const newsPromises = tickers.map(async (ticker) => {
            try {
                // PRIORITÉ 2: API unifiée /api/news qui agrège FMP, Finnhub, Finviz, RSS
                // Cette API fait déjà tout le travail d'agrégation et de déduplication
                const unifiedNewsResponse = await fetch(`${API_BASE_URL}/api/news?ticker=${ticker}&limit=5`);
                if (unifiedNewsResponse.ok) {
                    const unifiedNewsData = await unifiedNewsResponse.json();
                    if (unifiedNewsData.success && unifiedNewsData.articles && unifiedNewsData.articles.length > 0) {
                        // Prendre la première news (la plus récente et pertinente, déjà triée par l'API)
                        const latestNews = unifiedNewsData.articles[0];
                        const newsTitle = latestNews.title || latestNews.headline || '';

                        if (newsTitle) {
                            newsMap[ticker] = {
                                title: newsTitle,
                                source: latestNews.source?.name || latestNews.source_original || latestNews.source || 'API Unifiée',
                                date: latestNews.published_at || latestNews.publishedAt || latestNews.date || new Date().toLocaleDateString('fr-FR'),
                                url: latestNews.url || '#'
                            };

                            // Utiliser directement le titre comme explication (déjà filtré par l'API)
                            moveReasonsMap[ticker] = {
                                explanation: newsTitle.length > 120 ? newsTitle.substring(0, 120) + '...' : newsTitle,
                                source: latestNews.source?.name || latestNews.source_original || latestNews.source || 'API Unifiée',
                                type: 'news',
                                date: latestNews.published_at || latestNews.publishedAt || latestNews.date || new Date().toLocaleDateString('fr-FR')
                            };
                            console.log(`✅ News trouvée via API unifiée pour ${ticker}: ${newsTitle.substring(0, 50)}...`);
                            return;
                        }
                    }
                } else {
                    console.warn(`⚠️ API unifiée non disponible pour ${ticker}: ${unifiedNewsResponse.status}`);
                }
            } catch (error) {
                console.error(`Erreur récupération news pour ${ticker}:`, error);
            }
        });

        await Promise.all(newsPromises);

        console.log(`📊 Résultats récupération news:`, {
            tickersDemandés: tickers.length,
            newsTrouvées: Object.keys(newsMap).length,
            explicationsTrouvées: Object.keys(moveReasonsMap).length,
            tickersAvecNews: Object.keys(newsMap),
            tickersAvecExplications: Object.keys(moveReasonsMap)
        });

        setTickerLatestNews(newsMap);
        setTickerMoveReasons(moveReasonsMap);
        
        // Fallback: garantir une explication pour chaque ticker (même sans news)
        const buildFallbackExplanation = (ticker) => {
            const dataPoint = stockData?.[ticker] || {};
            const name = dataPoint?.name || ticker;
            const changePct = typeof dataPoint?.changePercent === 'number'
                ? dataPoint.changePercent
                : typeof dataPoint?.change === 'number'
                    ? dataPoint.change
                    : null;
            const direction = (changePct || 0) >= 0 ? 'hausse' : 'baisse';
            const magnitude = changePct !== null ? Math.abs(changePct).toFixed(2) : '0.00';
            return `Aucune actualité détectée pour ${name}. Variation technique de ${direction} ${magnitude}% observée aujourd'hui (flux de marché, arbitrage ou prise de bénéfices).`;
        };

        tickers.forEach((ticker) => {
            if (!moveReasonsMap[ticker]) {
                moveReasonsMap[ticker] = {
                    explanation: buildFallbackExplanation(ticker),
                    source: 'Emma IA (fallback)',
                    type: 'fallback',
                    date: new Date().toLocaleDateString('fr-FR')
                };
            }

            if (!newsMap[ticker]) {
                newsMap[ticker] = {
                    title: moveReasonsMap[ticker].explanation,
                    source: 'Emma IA',
                    date: new Date().toLocaleDateString('fr-FR'),
                    url: '#',
                    type: 'fallback'
                };
            }
        });

        console.log(`✅ News récentes chargées pour ${Object.keys(newsMap).length} tickers`);
        console.log(`✅ Explications de mouvement pour ${Object.keys(moveReasonsMap).length} tickers`);

        // Sauvegarder dans le cache Supabase (write-through)
        if (Object.keys(newsMap).length > 0 || Object.keys(moveReasonsMap).length > 0) {
            try {
                await fetch(`${API_BASE_URL}/api/supabase-daily-cache`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'ticker_news',
                        date: new Date().toISOString().split('T')[0],
                        data: {
                            newsMap,
                            moveReasonsMap
                        }
                    })
                });
                console.log('✅ Nouvelles par ticker sauvegardées dans cache Supabase');
            } catch (error) {
                console.warn('⚠️ Erreur sauvegarde cache (non bloquant):', error.message);
            }
        }
    };
    
    // Fonction pour actualiser toutes les données de stocks
    const refreshAllStocks = async () => {
        console.log('🔄 Actualisation des données stocks...');

        // Vérifier d'abord les données préchargées depuis la page de login
        const preloadedDataStr = sessionStorage.getItem('preloaded-dashboard-data');
        if (preloadedDataStr) {
            try {
                const preloadedData = JSON.parse(preloadedDataStr);
                const dataAge = Date.now() - (preloadedData.timestamp || 0);
                const MAX_AGE = 5 * 60 * 1000; // 5 minutes

                if (preloadedData.titlesTabData?.stockData && dataAge < MAX_AGE && Object.keys(preloadedData.titlesTabData.stockData).length > 0) {
                    console.log('⚡ Utilisation des données de marché préchargées pour l\'onglet Titres');
                    setStockData(preloadedData.titlesTabData.stockData);
                    setLastUpdate(new Date(preloadedData.timestamp));
                    setLoading(false);
                    const successCount = Object.keys(preloadedData.titlesTabData.stockData).length;
                    console.log(`✅ ${successCount} données de marché chargées depuis préchargement`);
                    showMessage(`Données chargées depuis préchargement: ${successCount} titres`, 'success');

                    // Charger les news même avec données préchargées
                    if (tickers.length > 0) {
                        fetchLatestNewsForTickers().catch(err => {
                            console.error('Erreur chargement news par ticker:', err);
                        });
                    }
                    return;
                }
            } catch (e) {
                console.warn('⚠️ Erreur lecture données de marché préchargées:', e);
            }
        }

        setLoading(true);
        const newStockData = {};
        let successCount = 0;
        let errorCount = 0;

        // OPTIMISATION: Utiliser batch endpoint si plusieurs tickers, sinon appels parallèles
        if (tickers.length > 1) {
            try {
                // Utiliser le batch endpoint pour optimiser les appels API
                const symbolsQuery = tickers.join(',');
                const batchResponse = await fetch(`${API_BASE_URL}/api/marketdata/batch?symbols=${symbolsQuery}&endpoints=quote,fundamentals`);

                if (batchResponse.ok) {
                    const batchData = await batchResponse.json();
                    if (batchData.success && batchData.data) {
                        const quotes = batchData.data.quote || {};
                        const fundamentals = batchData.data.fundamentals || {};

                        tickers.forEach(ticker => {
                            const tickerUpper = ticker.toUpperCase();
                            const quote = quotes[tickerUpper];
                            const fundamental = fundamentals[tickerUpper];

                            if (quote || fundamental) {
                                // FMP quote format: { price, change, changesPercentage, dayLow, dayHigh, open, volume, etc. }
                                // Finnhub format: { c, d, dp, h, l, o, v, etc. }
                                // Mapper les deux formats
                                const price = quote?.price || quote?.c || fundamental?.quote?.price || 0;
                                const change = quote?.change || quote?.d || fundamental?.quote?.change || 0;
                                const changePercent = quote?.changesPercentage || quote?.dp || fundamental?.quote?.changesPercentage || 0;

                                newStockData[ticker] = {
                                    symbol: tickerUpper,
                                    c: price, // Prix actuel
                                    d: change, // Changement en $
                                    dp: changePercent, // Changement en %
                                    h: quote?.dayHigh || quote?.h || 0, // High du jour
                                    l: quote?.dayLow || quote?.l || 0, // Low du jour
                                    o: quote?.open || quote?.o || 0, // Prix d'ouverture
                                    v: quote?.volume || quote?.v || 0, // Volume
                                    price: price, // Alias pour compatibilité
                                    change: change, // Alias pour compatibilité
                                    changePercent: changePercent, // Alias pour compatibilité
                                    fundamentals: fundamental || null,
                                    timestamp: new Date().toISOString()
                                };
                                successCount++;
                            } else {
                                errorCount++;
                            }
                        });

                        console.log(`✅ Batch chargé: ${successCount} succès`);
                    }
                } else {
                    throw new Error('Batch endpoint failed');
                }
            } catch (batchError) {
                console.warn('⚠️ Batch endpoint failed, fallback to parallel individual requests:', batchError);
                // Fallback: appels parallèles individuels
                await refreshAllStocksParallel(tickers, newStockData, { successCount: 0, errorCount: 0 });
                successCount = newStockData._successCount || 0;
                errorCount = newStockData._errorCount || 0;
                delete newStockData._successCount;
                delete newStockData._errorCount;
            }
        } else if (tickers.length === 1) {
            // Single ticker - appel direct
            const ticker = tickers[0];
            try {
                const data = await fetchStockData(ticker);
                let fundamentals = null;
                try {
                    const fundamentalsResp = await fetch(`${API_BASE_URL}/api/marketdata?endpoint=fundamentals&symbol=${ticker}&source=auto`);
                    if (fundamentalsResp.ok) fundamentals = await fundamentalsResp.json();
                } catch (e) {
                    console.warn(`⚠️ Fundamentals non disponibles pour ${ticker}`, e?.message || e);
                }
                if (data && !data.message) {
                    newStockData[ticker] = {
                        ...data,
                        fundamentals,
                        timestamp: new Date().toISOString()
                    };
                    successCount++;
                } else {
                    errorCount++;
                }
            } catch (error) {
                console.error(`❌ ${ticker}: Erreur`, error?.message || String(error));
                errorCount++;
            }
        }

        setStockData(newStockData);
        setLastUpdate(new Date());
        setLoading(false);

        // Charger les news par ticker après le chargement des stocks
        if (successCount > 0) {
            fetchLatestNewsForTickers().catch(err => {
                console.error('Erreur chargement news par ticker:', err);
            });
        }

        const message = `Données mises à jour: ${successCount} succès, ${errorCount} erreurs`;
        console.log(message);
        showMessage(message, successCount > 0 ? 'success' : 'warning');
    };

        // ============================================
        // FONCTIONS UTILITAIRES
        // ============================================

        // Fonction pour changer le thème
        const toggleTheme = () => {
            const next = !isDarkMode;
            setIsDarkMode(next);
            try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch (_) { }
        };

        // Fonction pour gérer le changement d'onglet avec animations d'intro
        const handleTabChange = useCallback((tabId) => {
            console.log(`🔄 Changement d'onglet: ${tabId}`);
            setActiveTab(tabId);

            // Afficher intro Emma IA si c'est la première visite de cette page load
            if (tabId === 'ask-emma' && !tabsVisitedThisSession['emma']) {
                setShowEmmaIntro(true);
                setTimeout(() => setShowEmmaIntro(false), 3000);
                setTabsVisitedThisSession(prev => ({ ...prev, 'emma': true }));
            }

            // Afficher intro Dan's Watchlist si c'est la première visite de cette page load
            if (tabId === 'dans-watchlist' && !tabsVisitedThisSession['dan']) {
                setShowDanIntro(true);
                setTimeout(() => setShowDanIntro(false), 3000);
                setTabsVisitedThisSession(prev => ({ ...prev, 'dan': true }));
            }

            // Afficher intro JLab si c'est la première visite de cette page load
            if (tabId === 'intellistocks' && !tabsVisitedThisSession['jlab']) {
                setShowJLabIntro(true);
                setTimeout(() => setShowJLabIntro(false), 3000);
                setTabsVisitedThisSession(prev => ({ ...prev, 'jlab': true }));
            }

            // Afficher intro Seeking Alpha si c'est la première visite de cette page load
            if (tabId === 'scrapping-sa' || tabId === 'seeking-alpha') {
                if (!tabsVisitedThisSession['seekingalpha']) {
                    setShowSeekingAlphaIntro(true);
                    setTimeout(() => setShowSeekingAlphaIntro(false), 3000);
                    setTabsVisitedThisSession(prev => ({ ...prev, 'seekingalpha': true }));
                }
                // Charger les données Seeking Alpha
                fetchSeekingAlphaData();
                fetchSeekingAlphaStockData();
            }
        };

        // Fonction pour initialiser l'audio
        const ensureAudioReady = () => {
            // Débloquer audio sur premier geste utilisateur
            if (!audioCtxRef.current) {
                try {
                    const AudioCtx = window.AudioContext || window.webkitAudioContext;
                    if (AudioCtx) {
                        audioCtxRef.current = new AudioCtx();
                    }
                } catch (_) { }
            }
            try { tabSoundRef.current?.load(); clickSoundRef.current?.load(); } catch (_) { }
        };

        // Fonction pour effet ripple sur boutons
        const withRipple = (e) => {
            const target = e.currentTarget;
            const circle = document.createElement('span');
            const diameter = Math.max(target.clientWidth, target.clientHeight);
            const radius = diameter / 2;
            circle.style.width = circle.style.height = `${diameter}px`;
            circle.style.left = `${e.clientX - target.getBoundingClientRect().left - radius}px`;
            circle.style.top = `${e.clientY - target.getBoundingClientRect().top - radius}px`;
            circle.classList.add('ripple-circle');
            const old = target.getElementsByClassName('ripple-circle')[0];
            if (old) old.remove();
            target.appendChild(circle);
            ensureAudioReady();
        };

        // Mapping des icônes Iconoir pour chaque onglet
        const getTabIcon = (tabId) => {
            const iconMap = {
                'stocks-news': 'iconoir-briefcase',
                'intellistocks': 'iconoir-flask',
                'ask-emma': 'iconoir-chat-bubble',
                'finance-pro': 'iconoir-calculator',
                'plus': 'iconoir-menu',
                'admin-jslai': 'iconoir-settings',
                'admin-jsla': 'iconoir-settings',
                'dans-watchlist': 'iconoir-star',
                'scrapping-sa': 'iconoir-search',
                'seeking-alpha': 'iconoir-graph-up',
                'email-briefings': 'iconoir-antenna-signal',
                'economic-calendar': 'iconoir-calendar',
                'investing-calendar': 'iconoir-calendar',
                'yield-curve': 'iconoir-graph-up',
                'markets-economy': 'iconoir-globe'
            };
            return iconMap[tabId] || 'iconoir-graph-up';
        };

        // Configuration des onglets (9 onglets fonctionnels - version da3fc96)
        const tabs = [
            { id: 'markets-economy', label: 'Marchés & Économie' },
            { id: 'intellistocks', label: 'JLab™' },
            { id: 'ask-emma', label: 'Emma IA™' },
            { id: 'plus', label: 'Plus' },
            { id: 'admin-jsla', label: 'Admin JSLAI' },
            { id: 'scrapping-sa', label: 'Seeking Alpha' },
            { id: 'seeking-alpha', label: 'Stocks News' },
            { id: 'email-briefings', label: 'Emma En Direct' },
            { id: 'investing-calendar', label: 'TESTS JS' }
        ];

        // Fonction pour parser le texte brut Seeking Alpha
        const parseSeekingAlphaRawText = (rawText) => {
            if (!rawText) return null;

            try {
                // Extraire les données du texte brut
                const data = {};

                // Prix actuel
                const priceMatch = rawText.match(/\$(\d+\.\d+)/);
                if (priceMatch) data.price = priceMatch[1];

                // Variation
                const changeMatch = rawText.match(/([+-]\d+\.\d+)\s*\(([+-]\d+\.\d+)%\)/);
                if (changeMatch) {
                    data.priceChange = changeMatch[1];
                    data.priceChangePercent = changeMatch[2];
                }

                // Market Cap
                const marketCapMatch = rawText.match(/Market Cap\$?([\d.]+[KMBT])/i);
                if (marketCapMatch) data.marketCap = marketCapMatch[1];

                // P/E Ratio
                const peMatch = rawText.match(/P\/E (?:Non-GAAP )?\((?:FWD|TTM)\)([\d.]+)/i);
                if (peMatch) data.peRatio = peMatch[1];

                // Dividend Yield
                const divYieldMatch = rawText.match(/(?:Dividend )?Yield(?: \(FWD\))?([\d.]+)%/i);
                if (divYieldMatch) data.dividendYield = divYieldMatch[1] + '%';

                // Annual Payout
                const payoutMatch = rawText.match(/Annual Payout(?: \(FWD\))?\$?([\d.]+)/i);
                if (payoutMatch) data.annualPayout = '$' + payoutMatch[1];

                // Ex-Dividend Date
                const exDivMatch = rawText.match(/Ex-Dividend Date(\d{1,2}\/\d{1,2}\/\d{4})/i);
                if (exDivMatch) data.exDivDate = exDivMatch[1];

                // Frequency
                const freqMatch = rawText.match(/Frequency(Quarterly|Monthly|Annual)/i);
                if (freqMatch) data.dividendFrequency = freqMatch[1];

                // Sector
                const sectorMatch = rawText.match(/Sector([A-Za-z\s]+)Industry/i);
                if (sectorMatch) data.sector = sectorMatch[1].trim();

                // Quant Ratings
                const valuationMatch = rawText.match(/Valuation([A-F][+-]?)/i);
                if (valuationMatch) data.valuationGrade = valuationMatch[1];

                const growthMatch = rawText.match(/Growth([A-F][+-]?)/i);
                if (growthMatch) data.growthGrade = growthMatch[1];

                const profitMatch = rawText.match(/Profitability([A-F][+-]?)/i);
                if (profitMatch) data.profitabilityGrade = profitMatch[1];

                const momentumMatch = rawText.match(/Momentum([A-F][+-]?)/i);
                if (momentumMatch) data.momentumGrade = momentumMatch[1];

                // Company Description
                const descMatch = rawText.match(/Company Profile([^]+?)(?:More\.\.\.|Revenue|Earnings)/i);
                if (descMatch) data.description = descMatch[1].trim().substring(0, 500);

                // ROE
                const roeMatch = rawText.match(/Return on Equity([\d.]+)%/i);
                if (roeMatch) data.roe = roeMatch[1] + '%';

                // Profit Margin
                const marginMatch = rawText.match(/Net Income Margin([\d.]+)%/i);
                if (marginMatch) data.netMargin = marginMatch[1] + '%';

                // Debt to Equity
                const debtMatch = rawText.match(/Total Debt \/ Equity[^]+([\d.]+)%/i);
                if (debtMatch) data.debtToEquity = debtMatch[1] + '%';

                return data;
            } catch (error) {
                console.error('Erreur parsing Seeking Alpha:', error);
                return null;
            }
        };

        // Fonction pour charger les données brutes Seeking Alpha
        const fetchSeekingAlphaData = async () => {
            try {
                // Vérifier d'abord les données préchargées depuis la page de login
                const preloadedDataStr = sessionStorage.getItem('preloaded-dashboard-data');
                if (preloadedDataStr) {
                    try {
                        const preloadedData = JSON.parse(preloadedDataStr);
                        const dataAge = Date.now() - (preloadedData.timestamp || 0);
                        const MAX_AGE = 5 * 60 * 1000; // 5 minutes

                        if (preloadedData.seekingAlphaData && dataAge < MAX_AGE) {
                            console.log('⚡ Utilisation des données Seeking Alpha préchargées');
                            // Convertir au format attendu par le dashboard
                            const formattedData = {
                                stocks: preloadedData.seekingAlphaData.stocks.map(item => ({
                                    ticker: item.ticker,
                                    title: item.title,
                                    date: item.date,
                                    url: item.url,
                                    sentiment: item.sentiment,
                                    author: item.author,
                                    raw_text: '', // Pas disponible dans les données préchargées
                                    parsedData: null
                                })),
                                timestamp: preloadedData.timestamp,
                                source: 'preloaded'
                            };
                            setSeekingAlphaData(formattedData);
                            console.log(`✅ Seeking Alpha raw data chargée depuis préchargement: ${formattedData.stocks.length} stocks`);
                            return;
                        }
                    } catch (e) {
                        console.warn('⚠️ Erreur lecture données Seeking Alpha préchargées:', e);
                    }
                }

                // Sinon, charger normalement depuis l'API
                console.log('📊 Chargement des données brutes Seeking Alpha depuis Supabase...');
                const response = await fetch(`${API_BASE_URL}/api/seeking-alpha-scraping?type=raw&latest=true&limit=100`);
                if (response.ok) {
                    const result = await response.json();

                    if (result.success && result.data) {
                        // Convert Supabase data to old format for backward compatibility
                        const formattedData = {
                            stocks: result.data.map(item => ({
                                ticker: item.ticker,
                                raw_text: item.raw_text,
                                url: item.url,
                                scraped_at: item.scraped_at,
                                status: item.status,
                                parsedData: parseSeekingAlphaRawText(item.raw_text)
                            })),
                            timestamp: result.timestamp,
                            source: 'supabase'
                        };

                        setSeekingAlphaData(formattedData);
                        console.log(`✅ Seeking Alpha raw data chargée depuis Supabase: ${formattedData.stocks.length} stocks`);
                    } else {
                        console.warn('⚠️ Aucune donnée raw Seeking Alpha disponible dans Supabase');
                        setSeekingAlphaData({ stocks: [], source: 'supabase_empty' });
                    }
                } else {
                    console.warn(`⚠️ Erreur ${response.status} lors du chargement des données raw Seeking Alpha`);

                    // Fallback to old JSON file
                    console.log('🔄 Tentative de chargement depuis stock_analysis.json (fallback)...');
                    const fallbackResponse = await fetch('/stock_analysis.json');
                    if (fallbackResponse.ok) {
                        const data = await fallbackResponse.json();
                        if (data.stocks && Array.isArray(data.stocks)) {
                            data.stocks = data.stocks.map(stock => ({
                                ...stock,
                                parsedData: parseSeekingAlphaRawText(stock.raw_text)
                            }));
                        }
                        setSeekingAlphaData({ ...data, source: 'json_fallback' });
                        console.log('✅ Données chargées depuis JSON (fallback)');
                    }
                }
            } catch (error) {
                console.error('❌ Erreur fetch Seeking Alpha raw data:', error?.message || String(error));
                setSeekingAlphaData({ stocks: [], source: 'error' });
            }
        };

        // Fonction pour charger les analyses Seeking Alpha (Gemini AI results from Supabase)
        const fetchSeekingAlphaStockData = async () => {
            try {
                // Vérifier d'abord les données préchargées depuis la page de login
                const preloadedDataStr = sessionStorage.getItem('preloaded-dashboard-data');
                if (preloadedDataStr) {
                    try {
                        const preloadedData = JSON.parse(preloadedDataStr);
                        const dataAge = Date.now() - (preloadedData.timestamp || 0);
                        const MAX_AGE = 5 * 60 * 1000; // 5 minutes

                        if (preloadedData.seekingAlphaStockData && dataAge < MAX_AGE) {
                            console.log('⚡ Utilisation des données Seeking Alpha Stock préchargées');
                            // Convertir au format attendu par le dashboard
                            let stocksObject = {};
                            if (Array.isArray(preloadedData.seekingAlphaStockData)) {
                                preloadedData.seekingAlphaStockData.forEach(item => {
                                    stocksObject[item.ticker] = item;
                                });
                            } else {
                                stocksObject = preloadedData.seekingAlphaStockData;
                            }
                            setSeekingAlphaStockData(stocksObject);
                            console.log(`✅ Seeking Alpha stock data chargée depuis préchargement: ${Object.keys(stocksObject).length} stocks`);
                            return;
                        }
                    } catch (e) {
                        console.warn('⚠️ Erreur lecture données Seeking Alpha Stock préchargées:', e);
                    }
                }

                // Sinon, charger normalement depuis l'API
                console.log('📊 Chargement des analyses Gemini depuis Supabase...');
                const response = await fetch(`${API_BASE_URL}/api/seeking-alpha-scraping?type=analysis&latest=true&limit=100`);

                if (response.ok) {
                    const result = await response.json();

                    if (result.success && result.data) {
                        // Convert Supabase data to old format for backward compatibility
                        const stocksObject = {};
                        result.data.forEach(item => {
                            stocksObject[item.ticker] = {
                                ticker: item.ticker,
                                companyName: item.company_name,
                                lastUpdate: item.analyzed_at,
                                metrics: {
                                    marketCap: item.market_cap,
                                    peRatio: item.pe_ratio,
                                    sector: item.sector,
                                    dividendYield: item.dividend_yield,
                                    dividendFrequency: item.dividend_frequency,
                                    exDivDate: item.ex_dividend_date,
                                    annualPayout: item.annual_dividend,
                                    price: item.current_price,
                                    priceChange: item.price_change
                                },
                                quantRating: {
                                    valuation: item.quant_valuation,
                                    growth: item.quant_growth,
                                    profitability: item.quant_profitability,
                                    momentum: item.quant_momentum,
                                    revisions: item.quant_eps_revisions
                                },
                                strengths: item.strengths || [],
                                concerns: item.concerns || [],
                                finalConclusion: {
                                    recommendation: item.analyst_recommendation,
                                    rating: item.analyst_rating
                                },
                                companyProfile: {
                                    description: item.company_description
                                }
                            };
                        });

                        setSeekingAlphaStockData({ stocks: stocksObject, source: 'supabase' });
                        console.log(`✅ Seeking Alpha analyses chargées depuis Supabase: ${Object.keys(stocksObject).length} stocks`);
                    } else {
                        console.warn('⚠️ Aucune analyse Seeking Alpha disponible dans Supabase');
                        setSeekingAlphaStockData({ stocks: {}, source: 'supabase_empty' });
                    }
                } else {
                    console.warn(`⚠️ Erreur ${response.status} lors du chargement des analyses Seeking Alpha`);

                    // Fallback to old JSON file
                    console.log('🔄 Tentative de chargement depuis stock_data.json (fallback)...');
                    const fallbackResponse = await fetch('/stock_data.json');
                    if (fallbackResponse.ok) {
                        const data = await fallbackResponse.json();
                        setSeekingAlphaStockData({ ...data, source: 'json_fallback' });
                        console.log('✅ Données chargées depuis JSON (fallback)');
                    }
                }
            } catch (error) {
                console.error('❌ Erreur fetch Seeking Alpha analyses:', error?.message || String(error));
                setSeekingAlphaStockData({ stocks: {}, source: 'error' });
            }
        };

        // ============================================
        // EFFETS GLOBAUX (useEffect hooks)
        // ============================================

    // 0. Écouter l'événement modules-loaded et vérifier périodiquement si les modules sont disponibles
    useEffect(() => {
        // Vérifier immédiatement si les modules sont déjà chargés
        const checkModules = () => {
            const requiredModules = [
                'MarketsEconomyTab', 'JLabUnifiedTab', 'AskEmmaTab', 'PlusTab',
                'AdminJSLaiTab', 'ScrappingSATab', 'SeekingAlphaTab',
                'EmailBriefingsTab', 'InvestingCalendarTab'
            ];
            const allLoaded = requiredModules.every(module => typeof window[module] !== 'undefined');
            
            if (allLoaded && !modulesLoaded) {
                console.log('✅ Tous les modules sont chargés, forcer re-render');
                setModulesLoaded(true);
            }
            
            return allLoaded;
        };

        // Vérifier immédiatement
        if (checkModules()) {
            return; // Modules déjà chargés
        }

        // Écouter l'événement modules-loaded
        const handleModulesLoaded = () => {
            console.log('📦 Événement modules-loaded reçu');
            if (checkModules()) {
                setModulesLoaded(true);
            }
        };

        window.addEventListener('modules-loaded', handleModulesLoaded);

        // Vérifier périodiquement (toutes les 500ms, max 20 fois = 10 secondes)
        let checkCount = 0;
        const maxChecks = 20;
        const checkInterval = setInterval(() => {
            checkCount++;
            if (checkModules()) {
                clearInterval(checkInterval);
                setModulesLoaded(true);
            } else if (checkCount >= maxChecks) {
                clearInterval(checkInterval);
                console.warn('⚠️ Certains modules ne sont pas chargés après 10 secondes');
                // Forcer quand même le re-render pour afficher ce qui est disponible
                setModulesLoaded(true);
            } else {
                // Forcer un re-render pour vérifier à nouveau
                setModulesCheckCount(prev => prev + 1);
            }
        }, 500);

        return () => {
            window.removeEventListener('modules-loaded', handleModulesLoaded);
            clearInterval(checkInterval);
        };
    }, []); // Se déclenche une seule fois au montage

    // 0.1. Vérifier les modules à chaque fois que modulesCheckCount change (pour forcer re-render)
    useEffect(() => {
        if (modulesLoaded) return; // Déjà chargé, pas besoin de vérifier
        
        const requiredModules = [
            'MarketsEconomyTab', 'JLabUnifiedTab', 'AskEmmaTab', 'PlusTab',
            'AdminJSLaiTab', 'ScrappingSATab', 'SeekingAlphaTab',
            'EmailBriefingsTab', 'InvestingCalendarTab'
        ];
        const allLoaded = requiredModules.every(module => typeof window[module] !== 'undefined');
        
        if (allLoaded) {
            console.log('✅ Tous les modules sont chargés (vérification via modulesCheckCount), forcer re-render');
            setModulesLoaded(true);
        }
    }, [modulesCheckCount, modulesLoaded]); // Se déclenche à chaque fois que modulesCheckCount change

    // 1. Chargement des informations utilisateur GitHub
    useEffect(() => {
        const loadGithubUser = async () => {
            if (githubToken) {
                try {
                    const response = await fetch('https://api.github.com/user', {
                        headers: {
                            'Authorization': `token ${githubToken}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    });
                    if (response.ok) {
                        const userData = await response.json();
                        setGithubUser(userData);
                    }
                } catch (error) {
                    console.error('Erreur lors du chargement des informations GitHub:', error);
                }
            }
        };
        loadGithubUser();
    }, [githubToken]);

    // 2. Chargement initial UNE SEULE FOIS au démarrage avec écran de chargement
    useEffect(() => {
        if (initialLoadComplete) return; // Éviter les rechargements

        console.log('🚀 Initialisation du dashboard');

        // Charger les tickers et nouvelles pour l'onglet d'accueil (stocks-news)
        // car c'est l'onglet par défaut et les utilisateurs s'attendent à voir des données
        console.log('📊 Chargement initial des données pour stocks-news (onglet par défaut)...');
        loadTickersFromSupabase().then(() => {
            // Une fois les tickers chargés, charger les nouvelles
            fetchNews();
            // Le chargement des stocks sera déclenché automatiquement par le useEffect qui surveille tickers.length
            // Les news par ticker seront chargées automatiquement par le useEffect qui surveille tickers.length
        }).catch(error => {
            console.error('❌ Erreur lors du chargement initial:', error);
        });

        // Désactiver l'écran de chargement après un court délai
        setTimeout(() => {
            setShowLoadingScreen(false);
            setInitialLoadComplete(true);
            console.log('✅ Dashboard prêt');
        }, 500);

    }, []); // Dépendance vide = une seule fois au montage

    // 3. Charger les news par ticker quand les tickers changent ET que les news générales sont disponibles
    useEffect(() => {
        if (tickers.length > 0 && Object.keys(stockData).length > 0 && newsData.length > 0) {
            console.log('📰 Chargement des news pour les tickers disponibles (news générales prêtes)...');
            fetchLatestNewsForTickers().catch(err => {
                console.error('Erreur chargement news par ticker:', err);
            });
        }
    }, [tickers.length, newsData.length]); // Se déclenche quand le nombre de tickers change OU quand les news générales sont chargées

    // 4. Charger automatiquement les données de stocks dès que les tickers sont disponibles
    // Ce useEffect est un fallback si le batch ne charge pas les données
    // Il se déclenche seulement si les données ne sont pas complètes après un délai
    useEffect(() => {
        if (!initialLoadComplete) return; // Attendre que l'initialisation soit terminée
        if (tickers.length === 0) return; // Pas de tickers à charger
        if (stocksLoadingRef.current) return; // Déjà en cours de chargement
        if (batchLoadedRef.current) return; // Le batch a déjà chargé les données

        // Attendre un peu pour laisser le batch charger d'abord
        const checkAndLoad = setTimeout(() => {
            // Si le batch a déjà chargé, ne pas faire de fallback
            if (batchLoadedRef.current) {
                console.log('✅ Batch a déjà chargé les données, fallback non nécessaire');
                return;
            }

            // Vérifier si on a des données pour tous les tickers
            const tickersWithData = tickers.filter(ticker => {
                const data = stockData[ticker];
                return data && data.c !== undefined && data.c !== 0;
            });
            const hasIncompleteData = tickersWithData.length < tickers.length;

            if (hasIncompleteData || Object.keys(stockData).length === 0) {
                console.log(`💹 Fallback: Chargement automatique des données de stocks (${tickers.length} tickers, ${tickersWithData.length} avec données)...`);
                stocksLoadingRef.current = true; // Marquer comme en cours de chargement
                refreshAllStocks().then(() => {
                    stocksLoadingRef.current = false; // Réinitialiser après chargement
                }).catch(err => {
                    console.error('❌ Erreur chargement stocks:', err);
                    stocksLoadingRef.current = false; // Réinitialiser même en cas d'erreur
                });
            } else {
                console.log(`✅ Données déjà complètes pour ${tickersWithData.length}/${tickers.length} tickers (fallback non nécessaire)`);
            }
        }, 3000); // Attendre 3 secondes pour laisser le batch charger d'abord

        return () => clearTimeout(checkAndLoad);
    }, [tickers.length, initialLoadComplete]); // Se déclenche quand les tickers sont chargés

    // 5. Intro Emma: première visite de session (séparé du chargement)
    useEffect(() => {
        if (activeTab === 'ask-emma' && !sessionStorage.getItem('emma-intro-shown')) {
            setShowEmmaIntro(true);
            sessionStorage.setItem('emma-intro-shown', '1');
            setTimeout(() => setShowEmmaIntro(false), 3000);
        }
    }, [activeTab]); // Se déclenche seulement au changement d'onglet

    // 6. Chargement automatique des tickers et nouvelles (en arrière-plan, même si l'onglet n'est pas actif)
    useEffect(() => {
        if (!initialLoadComplete) return; // Attendre que l'initialisation soit terminée

        console.log('📊 Vérification des données (chargement en arrière-plan)...');
        console.log(`Tickers: ${tickers.length}, StockData: ${Object.keys(stockData).length}, News: ${newsData.length}`);

        // Toujours charger les tickers si la liste est vide (indépendamment de l'onglet actif)
        if (tickers.length === 0) {
            console.log('📊 Chargement automatique des tickers (en arrière-plan)...');
            loadTickersFromSupabase().catch(err => {
                console.error('❌ Erreur chargement tickers:', err);
            });
        }

        // Charger les nouvelles si la liste est vide (indépendamment de l'onglet actif)
        if (newsData.length === 0) {
            console.log('📰 Chargement automatique des nouvelles (en arrière-plan)...');
            fetchNews().catch(err => {
                console.error('❌ Erreur chargement nouvelles:', err);
            });
        }

        // Charger les news par ticker si les données sont disponibles (indépendamment de l'onglet actif)
        // ATTENTION: Attendre que les news générales soient chargées pour avoir un meilleur fallback
        if (tickers.length > 0 && Object.keys(stockData).length > 0 && newsData.length > 0 && Object.keys(tickerLatestNews).length === 0) {
            console.log('📰 Chargement automatique des news par ticker (en arrière-plan, news générales disponibles)...');
            fetchLatestNewsForTickers().catch(err => {
                console.error('❌ Erreur chargement news par ticker:', err);
            });
        }
    }, [initialLoadComplete, newsData.length]); // Se déclenche après l'initialisation ET quand les news générales sont chargées

    // 7. Écouter les événements tab-change depuis l'extérieur (pour navigation programmatique)
    useEffect(() => {
        const handleTabChangeEvent = (event) => {
            const tabId = event.detail?.tabId;
            if (tabId) {
                console.log(`📋 Événement tab-change reçu: ${tabId}`);
                setActiveTab(tabId);
                
                // Afficher intro Emma IA si c'est la première visite de cette page load
                if (tabId === 'ask-emma' && !tabsVisitedThisSession['emma']) {
                    setShowEmmaIntro(true);
                    setTimeout(() => setShowEmmaIntro(false), 3000);
                    setTabsVisitedThisSession(prev => ({ ...prev, 'emma': true }));
                }

                // Afficher intro Dan's Watchlist si c'est la première visite de cette page load
                if (tabId === 'dans-watchlist' && !tabsVisitedThisSession['dan']) {
                    setShowDanIntro(true);
                    setTimeout(() => setShowDanIntro(false), 3000);
                    setTabsVisitedThisSession(prev => ({ ...prev, 'dan': true }));
                }

                // Afficher intro JLab si c'est la première visite de cette page load
                if (tabId === 'intellistocks' && !tabsVisitedThisSession['jlab']) {
                    setShowJLabIntro(true);
                    setTimeout(() => setShowJLabIntro(false), 3000);
                    setTabsVisitedThisSession(prev => ({ ...prev, 'jlab': true }));
                }

                // Afficher intro Seeking Alpha si c'est la première visite de cette page load
                if (tabId === 'scrapping-sa' || tabId === 'seeking-alpha') {
                    if (!tabsVisitedThisSession['seekingalpha']) {
                        setShowSeekingAlphaIntro(true);
                        setTimeout(() => setShowSeekingAlphaIntro(false), 3000);
                        setTabsVisitedThisSession(prev => ({ ...prev, 'seekingalpha': true }));
                    }
                    // Charger les données Seeking Alpha
                    fetchSeekingAlphaData();
                    fetchSeekingAlphaStockData();
                }
            }
        };

        window.addEventListener('tab-change', handleTabChangeEvent);

        return () => {
            window.removeEventListener('tab-change', handleTabChangeEvent);
        };
    }, [tabsVisitedThisSession]); // Dépendances pour les intros

    // 8. Rafraîchir les données tickers lors de la navigation si elles sont anciennes
    // Note: Les news ne sont PAS rafraîchies automatiquement (utilisent le cache configuré)
    useEffect(() => {
        if (!initialLoadComplete) return; // Attendre que l'initialisation soit terminée
        if (tickers.length === 0) return; // Pas de tickers à rafraîchir
        if (Object.keys(stockData).length === 0) return; // Pas de données à vérifier
        if (!cacheSettings.refreshOnNavigation) return; // Rafraîchissement désactivé

        // Vérifier l'âge des données tickers uniquement (utilise l'intervalle configuré)
        // Les news utilisent le cache Supabase et ne sont pas rafraîchies automatiquement
        const MAX_DATA_AGE = (cacheSettings.refreshIntervalMinutes || 10) * 60 * 1000;
        const dataAge = lastUpdate ? (Date.now() - new Date(lastUpdate).getTime()) : Infinity;

        if (dataAge > MAX_DATA_AGE) {
            console.log(`🔄 Données tickers anciennes (${Math.round(dataAge / 60000)} min), rafraîchissement...`);
            // Rafraîchir seulement les données tickers, pas les news
            refreshAllStocks().catch(err => {
                console.error('❌ Erreur rafraîchissement données:', err);
            });
            // Les news restent dans le cache Supabase et ne sont pas rafraîchies
        }
    }, [activeTab, initialLoadComplete, cacheSettings.refreshOnNavigation, cacheSettings.refreshIntervalMinutes]); // Se déclenche lors du changement d'onglet

    // 8. Charger les données de stocks une fois que les tickers sont disponibles (méthode batch optimisée)
    // Charger TOUS les tickers pour que les sections Top Movers, Top Gainers, Top Losers et Analyses fonctionnent
    useEffect(() => {
        // Combiner tous les tickers (portefeuille + watchlist) pour charger les données
        const allTickers = [...new Set([...teamTickers, ...watchlistTickers])]; // Utiliser Set pour éviter les doublons

        // Ne charger que si on a des tickers, que l'initialisation est terminée, et qu'on n'est pas déjà en train de charger
        if (allTickers.length === 0 || !initialLoadComplete || stocksLoadingRef.current) return;

        // Vérifier si on a déjà des données complètes pour tous les tickers
        const tickersWithData = allTickers.filter(ticker => {
            const data = stockData[ticker];
            return data && data.c !== undefined && data.c !== 0;
        });

        // Si on a déjà des données pour tous les tickers, ne pas recharger
        if (tickersWithData.length === allTickers.length && allTickers.length > 0) {
            console.log(`✅ Données déjà complètes pour ${tickersWithData.length}/${allTickers.length} tickers (portefeuille + watchlist)`);
            return;
        }

        console.log(`💹 Chargement automatique des données de stocks via batch (${allTickers.length} tickers: ${teamTickers.length} portefeuille + ${watchlistTickers.length} watchlist)...`);
        stocksLoadingRef.current = true; // Marquer comme en cours de chargement

        // Charger TOUS les tickers pour que les sections Top Movers, Gainers, Losers et Analyses fonctionnent
        const initialTickers = allTickers; // Charger tous les tickers (portefeuille + watchlist)

        // Utiliser la fonction batch optimisée
        const loadInitialStocks = async () => {
            try {
                const symbolsQuery = initialTickers.join(',');
                console.log(`📡 Appel API batch pour: ${symbolsQuery}`);
                const batchResponse = await fetch(`${API_BASE_URL}/api/marketdata/batch?symbols=${symbolsQuery}&endpoints=quote,fundamentals`);

                if (batchResponse.ok) {
                    const batchData = await batchResponse.json();
                    console.log('📊 Réponse batch:', batchData);
                    if (batchData.success && batchData.data) {
                        const quotes = batchData.data.quote || {};
                        const fundamentals = batchData.data.fundamentals || {};
                        const newStockData = {};

                        initialTickers.forEach(ticker => {
                            const tickerUpper = ticker.toUpperCase();
                            const quote = quotes[tickerUpper];
                            const fundamental = fundamentals[tickerUpper];

                            if (quote || fundamental) {
                                // FMP quote format: { price, change, changesPercentage, dayLow, dayHigh, open, volume, etc. }
                                // Finnhub format: { c, d, dp, h, l, o, v, etc. }
                                // Mapper les deux formats
                                const price = quote?.price || quote?.c || fundamental?.quote?.price || 0;
                                const change = quote?.change || quote?.d || fundamental?.quote?.change || 0;
                                const changePercent = quote?.changesPercentage || quote?.dp || fundamental?.quote?.changesPercentage || 0;

                                newStockData[ticker] = {
                                    symbol: tickerUpper,
                                    c: price, // Prix actuel
                                    d: change, // Changement en $
                                    dp: changePercent, // Changement en %
                                    h: quote?.dayHigh || quote?.h || 0, // High du jour
                                    l: quote?.dayLow || quote?.l || 0, // Low du jour
                                    o: quote?.open || quote?.o || 0, // Prix d'ouverture
                                    v: quote?.volume || quote?.v || 0, // Volume
                                    price: price, // Alias pour compatibilité
                                    change: change, // Alias pour compatibilité
                                    changePercent: changePercent, // Alias pour compatibilité
                                    fundamentals: fundamental || null,
                                    recommendation: fundamental?.recommendation || null, // Inclure les recommandations d'analystes
                                    timestamp: new Date().toISOString()
                                };

                                // Log pour déboguer
                                if (price === 0) {
                                    console.warn(`⚠️ Prix à 0 pour ${ticker}:`, { quote, fundamental });
                                }
                            }
                        });

                        console.log(`✅ Données chargées pour ${Object.keys(newStockData).length} tickers`);
                        setStockData(prevData => ({ ...prevData, ...newStockData })); // Fusionner avec les données existantes
                        setLastUpdate(new Date());
                        stocksLoadingRef.current = false; // Réinitialiser après chargement
                        batchLoadedRef.current = true; // Marquer que le batch a chargé les données
                        console.log(`✅ ${Object.keys(newStockData).length} stocks chargés initialement`);
                    } else {
                        console.warn('⚠️ Réponse batch invalide:', batchData);
                        stocksLoadingRef.current = false;
                    }
                } else {
                    console.warn(`⚠️ Erreur HTTP batch: ${batchResponse.status}`);
                    stocksLoadingRef.current = false;
                }
            } catch (error) {
                console.warn('⚠️ Erreur chargement initial stocks, fallback:', error);
                stocksLoadingRef.current = false;
                // Fallback: charger tous les tickers si batch échoue
                refreshAllStocks();
            }
        };

        loadInitialStocks();
    }, [teamTickers.length, watchlistTickers.length, initialLoadComplete]); // Se déclenche quand les tickers (portefeuille ou watchlist) changent et que l'initialisation est terminée

    // 9. Volume: baisser le son général et couper le son du ripple/clic
    useEffect(() => {
        try {
            if (tabSoundRef.current) tabSoundRef.current.volume = 0.0; // aucun son d'onglet
            if (clickSoundRef.current) clickSoundRef.current.volume = 0.30; // clic/ripple 30%
        } catch (_) { }
    }, []);

    // 10. Listen for Professional Mode changes
    useEffect(() => {
        const handleModeChange = (e) => {
            setIsProfessionalMode(e.detail.enabled);
        };

        window.addEventListener('professional-mode-changed', handleModeChange);
        return () => window.removeEventListener('professional-mode-changed', handleModeChange);
    }, []);

    // 11. Mettre à jour les actualités filtrées quand les actualités changent
    useEffect(() => {
        setFilteredNews(newsData);
    }, [newsData]);

    // 12. Charger le widget TradingView Ticker Tape
    useEffect(() => {
        const container = tickerTapeRef.current;
        if (!container) return;

        container.innerHTML = '';

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
        script.type = 'text/javascript';
        script.async = true;
        script.textContent = JSON.stringify({
            symbols: [
                // Indices US
                {
                    proName: 'FOREXCOM:SPXUSD',
                    title: 'S&P 500'
                },
                {
                    proName: 'FOREXCOM:DJI',
                    title: 'Dow Jones'
                },
                {
                    proName: 'FOREXCOM:NSXUSD',
                    title: 'NASDAQ 100'
                },
                {
                    proName: 'TVC:RUT',
                    title: 'Russell 2000'
                },
                // Indices Amérique du Nord
                {
                    proName: 'TSX:OSPTX',
                    title: 'TSX (Canada)'
                },
                // Indices Europe
                {
                    proName: 'FOREXCOM:UKXGBP',
                    title: 'FTSE 100 (UK)'
                },
                {
                    proName: 'XETR:DAX',
                    title: 'DAX (Allemagne)'
                },
                {
                    proName: 'EURONEXT:FCHI',
                    title: 'CAC 40 (France)'
                },
                {
                    proName: 'BME:IBEX',
                    title: 'IBEX 35 (Espagne)'
                },
                {
                    proName: 'MIL:FTSEMIB',
                    title: 'FTSE MIB (Italie)'
                },
                {
                    proName: 'EURONEXT:AEX',
                    title: 'AEX (Pays-Bas)'
                },
                {
                    proName: 'SIX:SSMI',
                    title: 'SMI (Suisse)'
                },
                // Indices Asie-Pacifique
                {
                    proName: 'TVC:NK225',
                    title: 'Nikkei 225 (Japon)'
                },
                {
                    proName: 'HKEX:HSI',
                    title: 'Hang Seng (Hong Kong)'
                },
                {
                    proName: 'ASX:XJO',
                    title: 'ASX 200 (Australie)'
                },
                {
                    proName: 'SSE:000001',
                    title: 'SSE Composite (Chine)'
                },
                {
                    proName: 'BSE:SENSEX',
                    title: 'BSE Sensex (Inde)'
                },
                // Crypto-monnaies
                {
                    proName: 'BITSTAMP:BTCUSD',
                    title: 'Bitcoin'
                },
                {
                    proName: 'BITSTAMP:ETHUSD',
                    title: 'Ethereum'
                }
            ],
            colorTheme: isDarkMode ? 'dark' : 'light',
            locale: 'fr',
            largeChartUrl: '',
            isTransparent: false,
            showSymbolLogo: true,
            displayMode: 'adaptive'
        });

        container.appendChild(script);

        return () => {
            if (container) {
                container.innerHTML = '';
            }
        };
    }, [isDarkMode]);

    // Render
    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
            {/* Intro Emma IA - première visite de session */}
            {showEmmaIntro && activeTab === 'ask-emma' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black emma-intro-overlay">
                    <div className="text-center">
                        <div className="mb-6">
                            <img
                                src={'EMMA-JSLAI-GOB-dark.jpg'}
                                alt="Emma IA"
                                className="emma-intro-image w-72 h-72 md:w-96 md:h-96 rounded-full object-cover shadow-2xl border-4 border-emerald-500"
                            />
                        </div>
                        <h2 className="text-white text-3xl md:text-4xl font-bold mb-2">Emma IA</h2>
                        <p className="text-emerald-300 text-lg">Analyste financière virtuelle • JSL AI</p>
                    </div>
                </div>
            )}


            {/* Intro JLab - première visite de session */}
            {showJLabIntro && activeTab === 'intellistocks' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black emma-intro-overlay">
                    <div className="text-center">
                        <div className="mb-6">
                            <img
                                src={'jlab.png'}
                                alt="JLab"
                                className="emma-intro-image w-72 h-72 md:w-96 md:h-96 rounded-full object-cover shadow-2xl border-4 border-green-500"
                            />
                        </div>
                        <h2 className="text-white text-3xl md:text-4xl font-bold mb-2">JLab™</h2>
                        <p className="text-green-300 text-lg">Laboratoire d'analyse financière • JSL AI</p>
                    </div>
                </div>
            )}

            {/* Intro Seeking Alpha - première visite de session */}
            {showSeekingAlphaIntro && (activeTab === 'scrapping-sa' || activeTab === 'seeking-alpha') && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black emma-intro-overlay">
                    <div className="text-center">
                        <div className="mb-6">
                            <img
                                src={'seekingalpha.png'}
                                alt="Seeking Alpha"
                                className="emma-intro-image w-72 h-72 md:w-96 md:h-96 rounded-full object-cover shadow-2xl border-4 border-green-500"
                            />
                        </div>
                        <h2 className="text-white text-3xl md:text-4xl font-bold mb-2">Seeking Alpha</h2>
                        <p className="text-green-300 text-lg">Scraping & Analysis • JSL AI</p>
                    </div>
                </div>
            )}

            {/* Header - Bloomberg Style - Always Dark */}
            <header className="relative overflow-hidden bg-gradient-to-r from-black via-gray-900 to-black border-b border-green-500/20 md:ml-20">
                {/* Bloomberg-style animated background pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, currentColor 2px, currentColor 4px)',
                        backgroundSize: '100% 4px'
                    }}></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-4 relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                            {/* Logo avec effet Bloomberg */}
                            <div className="relative p-3 rounded-lg bg-green-500/10 border border-green-500/30 shadow-lg shadow-green-500/10">
                                <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-transparent rounded-lg"></div>
                                <img
                                    src="/logojslaidark.jpg"
                                    alt="JSL AI Logo"
                                    className="w-20 h-20 object-contain relative z-10"
                                />
                            </div>

                            <div className="border-l border-green-500/30 pl-6 flex-1">
                                <div className="flex items-center gap-4">
                                    <div>
                                        <h1 className="text-4xl font-black tracking-tight text-white" style={{ fontFamily: "'Avenir Pro 85 Heavy', 'Avenir Next', 'Avenir', 'Montserrat', 'Inter', sans-serif", fontWeight: 900, letterSpacing: '-0.02em' }}>
                                            TERMINAL FINANCIER
                                            <br />
                                            <span className="avenir-heavy text-3xl" style={{ color: '#4ade80', fontWeight: 900 }}>Emma IA</span>
                                            <span className="ml-3 text-xs font-normal px-2 py-1 rounded bg-green-500/20 text-green-300">BÊTA</span>
                                        </h1>
                                        <p className="text-xs font-medium tracking-wider mt-1 font-['Inter'] text-gray-400">
                                            Propulsé par <span className="font-bold text-green-400">JSL AI</span> - Tous droits réservés
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 ml-auto">
                            {/* Live indicator */}
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md ${isDarkMode ? 'bg-green-500/10 border border-green-500/30' : 'bg-green-50 border border-green-200'}`}>
                                <div className="relative">
                                    <div className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-green-400' : 'bg-green-500'} animate-pulse`}></div>
                                    <div className={`absolute inset-0 w-2 h-2 rounded-full ${isDarkMode ? 'bg-green-400' : 'bg-green-500'} animate-ping opacity-75`}></div>
                                </div>
                                <span className={`text-xs font-bold tracking-wide ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>LIVE</span>
                            </div>

                            {/* Theme toggle - icône seulement */}
                            <button
                                onClick={toggleTheme}
                                className={`p-1.5 rounded-md transition-all duration-300 hover:scale-105 border ${isDarkMode
                                    ? 'bg-gray-800 hover:bg-gray-700 border-green-500/30 text-green-400'
                                    : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-700'
                                    }`}
                                title={isDarkMode ? 'Mode Clair' : 'Mode Sombre'}
                            >
                                <span className="text-sm">{isDarkMode ? '☀️' : '🌙'}</span>
                            </button>

                            {/* Bouton de déconnexion - icône seulement */}
                            <button
                                onClick={() => {
                                    if (confirm('Voulez-vous vraiment vous déconnecter?')) {
                                        // Nettoyer toutes les données de session
                                        sessionStorage.clear();
                                        localStorage.clear();

                                        // Rediriger vers la page de login
                                        window.location.href = '/login.html';
                                    }
                                }}
                                className={`p-1.5 rounded-md transition-all duration-300 hover:scale-105 border ${isDarkMode
                                    ? 'bg-gray-800 hover:bg-gray-700 border-red-500/30 text-red-400'
                                    : 'bg-white hover:bg-gray-50 border-red-300 text-red-600'
                                    }`}
                                title="Déconnexion"
                            >
                                <i className="iconoir-log-out text-sm"></i>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bloomberg-style bottom accent line */}
                <div className="h-0.5 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
                </header>

            {/* TradingView Ticker Tape Widget - Bandeau de cotations */}
            <div className="tradingview-widget-container md:ml-20" ref={tickerTapeRef}>
                <div className="tradingview-widget-container__widget"></div>
            </div>

            {/* Desktop Sidebar Navigation */}
            <aside className={`hidden md:flex fixed left-0 top-0 h-full w-20 flex-col backdrop-blur-sm transition-all duration-300 z-40 ${isDarkMode
                ? 'bg-black/95 border-r border-green-500/10'
                : 'bg-white/95 border-r-2 border-gray-200'
                } ${showLoadingScreen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                {/* Logo section */}
                <div className={`flex items-center justify-center h-20 border-b ${isDarkMode ? 'border-green-500/10' : 'border-gray-200'}`}>
                    <img
                        src="/logojslaidark.jpg"
                        alt="JSL AI"
                        className="w-12 h-12 object-contain"
                    />
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 overflow-y-auto py-4">
                    {tabs.map(tab => {
                        const iconClass = getTabIcon(tab.id);
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onMouseDown={withRipple}
                                onClick={() => handleTabChange(tab.id)}
                                className={`w-full flex flex-col items-center justify-center py-4 px-2 btn-ripple relative transition-all duration-300 group ${isActive
                                    ? (isDarkMode
                                        ? 'text-green-400 bg-gradient-to-r from-gray-900/50 to-transparent'
                                        : 'text-green-600 bg-gradient-to-r from-green-50 to-transparent')
                                    : (isDarkMode
                                        ? 'text-gray-400 hover:text-green-300 hover:bg-gray-900/30'
                                        : 'text-gray-600 hover:text-green-700 hover:bg-gray-50')
                                    }`}
                                title={tab.label}
                            >
                                {/* Active indicator - left bar with glow */}
                                {isActive && (
                                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 rounded-r transition-all duration-300 ${isDarkMode
                                        ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
                                        : 'bg-green-600 shadow-[0_0_8px_rgba(22,163,74,0.4)]'
                                        }`}></div>
                                )}

                                {/* Icon Container with enhanced styling */}
                                <div className={`relative mb-2 transition-all duration-300 ${isActive
                                    ? 'scale-110'
                                    : 'scale-100 group-hover:scale-105'
                                    }`}>
                                    {/* Glow effect for active icon */}
                                    {isActive && (
                                        <div className={`absolute inset-0 rounded-full blur-md opacity-50 transition-all duration-300 ${isDarkMode ? 'bg-green-500' : 'bg-green-400'
                                            }`} style={{
                                                transform: 'scale(1.5)',
                                                filter: 'blur(8px)'
                                            }}></div>
                                    )}

                                    {/* Icon with enhanced styling */}
                                    {iconClass ? (
                                        <i className={`${iconClass} text-2xl relative z-10 transition-all duration-300 ${isActive
                                            ? (isDarkMode
                                                ? 'drop-shadow-[0_0_6px_rgba(34,197,94,0.8)]'
                                                : 'drop-shadow-[0_0_4px_rgba(22,163,74,0.6)]')
                                            : 'drop-shadow-none'
                                            }`} style={{
                                                display: 'inline-block',
                                                filter: isActive
                                                    ? (isDarkMode
                                                        ? 'drop-shadow(0 0 6px rgba(34,197,94,0.8))'
                                                        : 'drop-shadow(0 0 4px rgba(22,163,74,0.6))')
                                                    : 'none'
                                            }}></i>
                                    ) : (
                                        <span className="text-2xl">📊</span>
                                    )}
                                </div>

                                {/* Label (shown on hover) */}
                                <span className={`text-xs font-semibold text-center leading-tight transition-all duration-300 ${isActive
                                    ? 'opacity-100'
                                    : 'opacity-0 group-hover:opacity-100'
                                    }`}>
                                    {tab.label.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim()}
                                </span>

                                {/* Active dot indicator with pulse */}
                                {isActive && (
                                    <span className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full transition-all duration-300 ${isDarkMode
                                        ? 'bg-green-400 shadow-[0_0_6px_rgba(34,197,94,0.8)]'
                                        : 'bg-green-600 shadow-[0_0_4px_rgba(22,163,74,0.6)]'
                                        } animate-pulse`}></span>
                                )}
                    </button>
                        );
                    })}
                </nav>
            </aside>

            {/* Mobile Bottom Navigation Bar */}
            <nav className={`md:hidden fixed bottom-0 left-0 right-0 backdrop-blur-sm transition-all duration-300 z-40 ${isDarkMode
                ? 'bg-black/95 border-t border-green-500/10'
                : 'bg-white/95 border-t-2 border-gray-200'
                } ${showLoadingScreen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <div className="flex items-center justify-around px-2 pb-safe">
                    {tabs.slice(0, 5).map(tab => {
                        const iconClass = getTabIcon(tab.id);
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onMouseDown={withRipple}
                                onClick={() => handleTabChange(tab.id)}
                                className={`flex-1 flex flex-col items-center justify-center py-3 px-1 btn-ripple relative transition-all duration-300 group ${isActive
                                    ? (isDarkMode
                                        ? 'text-green-400'
                                        : 'text-green-600')
                                    : (isDarkMode
                                        ? 'text-gray-400'
                                        : 'text-gray-600')
                                    }`}
                            >
                                {/* Active indicator - top bar with glow */}
                                {isActive && (
                                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 rounded-b transition-all duration-300 ${isDarkMode
                                        ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
                                        : 'bg-green-600 shadow-[0_0_6px_rgba(22,163,74,0.4)]'
                                        } animate-slide-down`}></div>
                                )}

                                {/* Icon Container with enhanced styling */}
                                <div className={`relative mb-1 transition-all duration-300 ${isActive
                                    ? 'scale-110'
                                    : 'scale-100 group-hover:scale-105'
                                    }`}>
                                    {/* Glow effect for active icon */}
                                    {isActive && (
                                        <div className={`absolute inset-0 rounded-full blur-md opacity-40 transition-all duration-300 ${isDarkMode ? 'bg-green-500' : 'bg-green-400'
                                            }`} style={{
                                                transform: 'scale(1.8)',
                                                filter: 'blur(10px)'
                                            }}></div>
                                    )}

                                    {/* Icon with enhanced styling */}
                                    {iconClass ? (
                                        <i className={`${iconClass} text-2xl relative z-10 transition-all duration-300 ${isActive
                                            ? (isDarkMode
                                                ? 'drop-shadow-[0_0_8px_rgba(34,197,94,0.9)]'
                                                : 'drop-shadow-[0_0_6px_rgba(22,163,74,0.7)]')
                                            : 'drop-shadow-none'
                                            }`} style={{ display: 'inline-block' }}></i>
                                    ) : (
                                        <span className="text-2xl">📊</span>
                                    )}
                                </div>

                                {/* Label */}
                                <span className={`text-xs font-semibold text-center leading-tight transition-all duration-300 ${isActive ? 'font-bold' : ''}`}>
                                    {tab.label.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim().split(' ')[0]}
                                </span>
                    </button>
                        );
                    })}

                    {/* Menu button for additional tabs */}
                    <button
                        onClick={() => {
                            const moreTabs = tabs.slice(5);
                            if (moreTabs.length > 0) {
                                setShowMoreTabsOverlay(!showMoreTabsOverlay);
                            }
                        }}
                        className={`flex-1 flex flex-col items-center justify-center py-3 px-1 btn-ripple relative transition-all duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            } ${showMoreTabsOverlay ? 'bg-opacity-10 bg-blue-500' : ''}`}
                    >
                        <i className="iconoir-menu text-2xl mb-1"></i>
                        <span className="text-xs font-medium">Plus</span>
                    </button>
                </div>
                </nav>

            {/* Overlay pour les onglets supplémentaires */}
            {showMoreTabsOverlay && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
                        onClick={() => setShowMoreTabsOverlay(false)}
                    ></div>

                    {/* Overlay Panel */}
                    <div className={`fixed bottom-0 left-0 right-0 z-50 transform transition-transform duration-300 ease-out ${showMoreTabsOverlay ? 'translate-y-0' : 'translate-y-full'
                        }`}>
                        <div className={`rounded-t-2xl shadow-2xl max-h-[75vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            {/* Header */}
                            <div className={`sticky top-0 px-6 py-4 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                <div className="flex items-center justify-between">
                                    <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        📱 Autres onglets
                                    </h3>
                                    <button
                                        onClick={() => setShowMoreTabsOverlay(false)}
                                        className={`p-2 rounded-full transition-colors ${isDarkMode
                                            ? 'hover:bg-gray-700 text-gray-400'
                                            : 'hover:bg-gray-100 text-gray-600'
                                            }`}
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                </div>
            </div>

                            {/* Tabs List */}
                            <div className="p-4">
                                {tabs.slice(5).map((tab) => {
                                    const iconClass = getTabIcon(tab.id);
                                    const isActive = activeTab === tab.id;

                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => {
                                                handleTabChange(tab.id);
                                                setShowMoreTabsOverlay(false);
                                            }}
                                            className={`w-full flex items-center gap-4 p-4 rounded-xl mb-2 transition-all duration-300 group ${isActive
                                                ? isDarkMode
                                                    ? 'bg-gradient-to-r from-green-900/40 to-green-800/20 border-2 border-green-500 shadow-lg shadow-green-500/20'
                                                    : 'bg-gradient-to-r from-green-50 to-green-100/50 border-2 border-green-500 shadow-lg shadow-green-500/10'
                                                : isDarkMode
                                                    ? 'bg-gray-700/50 hover:bg-gray-600/70 border-2 border-transparent hover:border-gray-600'
                                                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent hover:border-gray-300'
                                                }`}
                                        >
                                            <div className={`relative flex items-center justify-center w-14 h-14 rounded-xl transition-all duration-300 ${isActive
                                                ? (isDarkMode
                                                    ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-500/40'
                                                    : 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30')
                                                : (isDarkMode
                                                    ? 'bg-gray-600/50 text-gray-300 group-hover:bg-gray-500/70'
                                                    : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300')
                                                }`}>
                                                {/* Glow effect for active icon */}
                                                {isActive && (
                                                    <div className={`absolute inset-0 rounded-xl blur-lg opacity-50 transition-all duration-300 ${isDarkMode ? 'bg-green-500' : 'bg-green-400'
                                                        }`} style={{
                                                            transform: 'scale(1.3)',
                                                            filter: 'blur(12px)'
                                                        }}></div>
                                                )}

                                                {/* Icon with enhanced styling */}
                                                <i className={`${iconClass} text-2xl relative z-10 transition-all duration-300 ${isActive
                                                    ? (isDarkMode
                                                        ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'
                                                        : 'drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]')
                                                    : 'drop-shadow-none'
                                                    } ${isActive ? 'scale-110' : 'scale-100 group-hover:scale-105'}`}></i>
                                            </div>
                                            <div className="flex-1 text-left">
                                                <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    {tab.label}
                                                </div>
                                            </div>
                                            {isActive && (
                                                <div className="flex items-center justify-center">
                                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Audio UI feedback (désactivé par défaut jusqu'au premier geste utilisateur) */}
            <audio ref={tabSoundRef} preload="auto" className="hidden">
                <source src="https://assets.mixkit.co/active_storage/sfx/2005/2005-preview.mp3" type="audio/mpeg" />
            </audio>
            <audio ref={clickSoundRef} preload="auto" className="hidden">
                <source src="https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3" type="audio/mpeg" />
            </audio>

            {/* Écran de chargement initial - Animation JLab */}
            {showLoadingScreen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black emma-intro-overlay">
                    <div className="text-center">
                        <div className="mb-6">
                            <img
                                src={'jlab.png'}
                                alt="JLab"
                                className="emma-intro-image w-72 h-72 md:w-96 md:h-96 rounded-full object-cover shadow-2xl border-4 border-green-500"
                            />
                        </div>
                        <h2 className="text-white text-3xl md:text-4xl font-bold mb-2">JLab™</h2>
                        <p className="text-green-300 text-lg">Laboratoire d'analyse financière • JSL AI</p>
                    </div>
                </div>
            )}

            {/* Contenu principal */}
            <main className={`max-w-7xl mx-auto p-6 md:ml-20 pb-24 md:pb-6 transition-opacity duration-500 ${showLoadingScreen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                {activeTab === 'markets-economy' && window.MarketsEconomyTab && React.createElement(window.MarketsEconomyTab, { 
                    isDarkMode,
                    newsData: Array.isArray(newsData) ? newsData : [],
                    loading,
                    lastUpdate,
                    fetchNews
                })}
                {activeTab === 'intellistocks' && modulesLoaded && window.JLabUnifiedTab && React.createElement(window.JLabUnifiedTab, { 
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
                {activeTab === 'ask-emma' && modulesLoaded && window.AskEmmaTab && React.createElement(window.AskEmmaTab, { 
                    isDarkMode,
                    prefillMessage: emmaPrefillMessage,
                    setPrefillMessage: setEmmaPrefillMessage,
                    autoSend: emmaAutoSend,
                    setAutoSend: setEmmaAutoSend,
                    emmaConnected,
                    setEmmaConnected,
                    showPromptEditor,
                    setShowPromptEditor,
                    showTemperatureEditor,
                    setShowTemperatureEditor,
                    showLengthEditor,
                    setShowLengthEditor
                })}
                {activeTab === 'plus' && modulesLoaded && window.PlusTab && React.createElement(window.PlusTab, { isDarkMode, isProfessionalMode })}
                {activeTab === 'admin-jsla' && modulesLoaded && window.AdminJSLaiTab && React.createElement(window.AdminJSLaiTab, {
                    isDarkMode,
                    emmaConnected,
                    setEmmaConnected,
                    showPromptEditor,
                    setShowPromptEditor,
                    showTemperatureEditor,
                    setShowTemperatureEditor,
                    showLengthEditor,
                    setShowLengthEditor,
                    tickers,
                    stockData,
                    newsData,
                    lastUpdate,
                    seekingAlphaData,
                    seekingAlphaStockData,
                    refreshAllStocks
                })}
                {activeTab === 'scrapping-sa' && modulesLoaded && window.ScrappingSATab && React.createElement(window.ScrappingSATab, { 
                    isDarkMode,
                    tickers,
                    stockData,
                    seekingAlphaData,
                    seekingAlphaStockData
                })}
                {activeTab === 'email-briefings' && modulesLoaded && window.EmailBriefingsTab && React.createElement(window.EmailBriefingsTab, { isDarkMode })}
                {activeTab === 'seeking-alpha' && modulesLoaded && window.SeekingAlphaTab && React.createElement(window.SeekingAlphaTab, { 
                    isDarkMode,
                    tickers,
                    stockData,
                    seekingAlphaData,
                    seekingAlphaStockData,
                    refreshAllStocks,
                    fetchNews,
                    loading
                })}
                {activeTab === 'investing-calendar' && modulesLoaded && window.InvestingCalendarTab && React.createElement(window.InvestingCalendarTab, { isDarkMode })}
            </main>

            {/* Messages */}
            {message && (
                <div className={`fixed top-4 right-4 p-4 rounded-lg z-50 ${message.type === 'error' ? 'bg-red-500' :
                    message.type === 'success' ? 'bg-green-500' : 'bg-gray-700'
                    } text-white`}>
                    {message.text}
                </div>
            )}

            {/* Avatar Emma flottant */}
            {showEmmaAvatar && (
                <div className="fixed bottom-10 right-6 z-50 flex flex-col items-end gap-0.5 pointer-events-none">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border pointer-events-auto ${isDarkMode ? 'bg-blue-500 text-white border-blue-300' : 'bg-blue-600 text-white border-blue-400'}`}>
                        Emma IA
                    </span>
                    <div className={`px-4 py-2 rounded-full text-sm shadow-lg border pointer-events-auto -mt-0.5 ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
                        Bonjour {userDisplayName} !
                    </div>
                    <button
                        onClick={openAskEmma}
                        className="relative focus:outline-none pointer-events-auto -mt-1"
                        aria-label="Parler à Emma"
                        style={{ transition: 'transform 0.2s ease' }}
                    >
                        <img
                            src={assistantAvatar}
                            alt="Emma avatar"
                            className="w-24 h-24 rounded-full shadow-2xl border-2 border-white object-cover"
                        />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowEmmaAvatar(false);
                            }}
                            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg border-2 border-white"
                            aria-label="Fermer Emma"
                            title="Fermer"
                        >
                            ×
                        </button>
                    </button>
                </div>
            )}
        </div>
    );
};


// Exposition globale pour Babel standalone
window.BetaCombinedDashboard = BetaCombinedDashboard;

