const BetaCombinedDashboard = () => {
const MarketsEconomyTab = () => {
        const [secondaryNavConfig, setSecondaryNavConfig] = useState(() => {
            if (typeof window !== 'undefined') {
                try {
                    const saved = localStorage.getItem('gob-secondary-nav-config');
                    return saved ? JSON.parse(saved) : DEFAULT_NAV_CONFIG;
                } catch (e) {
                    console.error('Error loading nav config:', e);
                    return DEFAULT_NAV_CONFIG;
                }
            }
            return DEFAULT_NAV_CONFIG;
        });

        // Persist nav config changes
        useEffect(() => {
            if (typeof window !== 'undefined') {
                localStorage.setItem('gob-secondary-nav-config', JSON.stringify(secondaryNavConfig));
            }
        }, [secondaryNavConfig]);

        // State for Primary Navigation Visibility Configuration
        // This controls which tabs are VISIBLE in the bottom navigation bar
        const [primaryNavConfig, setPrimaryNavConfig] = useState(() => {
            if (typeof window !== 'undefined') {
                try {
                    const saved = localStorage.getItem('gob-primary-nav-config');
                    return saved ? JSON.parse(saved) : {}; // Empty = all visible (default)
                } catch (e) {
                    console.error('Error loading primary nav config:', e);
                    return {};
                }
            }
            return {};
        });

        // Persist primary nav config changes
        useEffect(() => {
            if (typeof window !== 'undefined') {
                localStorage.setItem('gob-primary-nav-config', JSON.stringify(primaryNavConfig));
            }
        }, [primaryNavConfig]);

        // ☁️ Load Nav Configuration from Supabase (Sync)
        useEffect(() => {
            const loadSupabaseConfig = async () => {
                try {
                    // Fetch Primary Nav Config
                    const resPrimary = await fetch('/api/admin/emma-config?section=ui&key=primary_nav_config');
                    const dataPrimary = await resPrimary.json();
                    if (dataPrimary && dataPrimary.config && dataPrimary.config.value) {
                        console.log('☁️ Primary Nav Config loaded from Supabase');
                        setPrimaryNavConfig(dataPrimary.config.value);
                    }

                    // Fetch Secondary Nav Config
                    const resSecondary = await fetch('/api/admin/emma-config?section=ui&key=secondary_nav_config');
                    const dataSecondary = await resSecondary.json();
                    if (dataSecondary && dataSecondary.config && dataSecondary.config.value) {
                        console.log('☁️ Secondary Nav Config loaded from Supabase');
                        setSecondaryNavConfig(dataSecondary.config.value);
                    }
                } catch (error) {
                    console.error('❌ Error loading nav config from Supabase:', error);
                }
            };

            loadSupabaseConfig();
        }, []);


        // État pour le thème actuel
        const [currentThemeId, setCurrentThemeId] = useState(() => {
            if (window.GOBThemes) {
                return window.GOBThemes.getCurrentTheme();
            }
            return 'darkmode';
        });
        
        // Initialiser le thème au chargement
        React.useEffect(() => {
            if (window.GOBThemes) {
                window.GOBThemes.initTheme();
                setCurrentThemeId(window.GOBThemes.getCurrentTheme());
            }
            
            // Écouter les changements de thème
            const handleThemeChange = (event) => {
                if (!event || !event.detail || !event.detail.themeId) {
                    console.warn('Événement themeChanged invalide:', event);
                    return;
                }
                
                const themeId = event.detail.themeId;
                console.log('Thème changé:', themeId);
                setCurrentThemeId(themeId);
                
                // Déterminer isDarkMode en fonction du thème
                // Thèmes light: seeking-alpha, bloomberg-nostalgie, desjardins, light
                // Thèmes dark: default, marketq, marketq-dark, bloomberg-terminal, bloomberg-mobile, darkmode, terminal, ia
                const lightThemes = ['seeking-alpha', 'bloomberg-nostalgie', 'desjardins', 'light'];
                const isLight = lightThemes.includes(themeId);
                setIsDarkMode(!isLight);
                
                // Sauvegarder dans localStorage pour compatibilité
                try {
                    localStorage.setItem('theme', isLight ? 'light' : 'dark');
                } catch (error) {
                    console.warn('Impossible de sauvegarder le thème dans localStorage:', error);
                }
            };
            
            window.addEventListener('themeChanged', handleThemeChange);
            return () => window.removeEventListener('themeChanged', handleThemeChange);
        }, []);
        
        // États principaux
        const [activeTab, setActiveTab] = useState(() => {
            if (typeof window !== 'undefined') {
                const params = new URLSearchParams(window.location.search);
                const tab = params.get('tab');
                if (tab) return tab;
            }
            return 'intellistocks';
        }); // Onglet par défaut: JLab™ (contient Titres & Nouvelles et Finance Pro)
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


        // États pour  l'interface Seeking Alpha
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

        // État pour le thème (déterminé par le thème actuel)
        const [isDarkMode, setIsDarkMode] = useState(() => {
            try {
                // Vérifier d'abord le thème GOB
                if (window.GOBThemes) {
                    const currentThemeId = window.GOBThemes.getCurrentTheme();
                    const lightThemes = ['seeking-alpha', 'bloomberg-nostalgie', 'desjardins', 'light'];
                    if (lightThemes.includes(currentThemeId)) {
                        return false; // Light theme
                    }
                    return true; // Dark theme par défaut
                }
                // Fallback: vérifier localStorage legacy
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
            return window.ProfessionalModeSystem.isEnabled();
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
        const clickSoundRef = useRef(null);
        const tabSoundRef = useRef(null);
        const audioCtxRef = useRef(null);
        const tickerTapeRef = useRef(null);

        // Fonction utilitaire pour obtenir les styles basés sur le thème
        const getThemeStyles = () => {
            return {
                // Backgrounds
                bg: { backgroundColor: 'var(--theme-bg)' },
                surface: { backgroundColor: 'var(--theme-surface)' },
                surfaceLight: { backgroundColor: 'var(--theme-surface-light)' },
                // Text
                text: { color: 'var(--theme-text)' },
                textSecondary: { color: 'var(--theme-text-secondary)' },
                // Borders
                border: { borderColor: 'var(--theme-border)' },
                // Buttons
                buttonPrimary: {
                    backgroundColor: 'var(--theme-primary)',
                    color: 'var(--theme-text)',
                },
                buttonSecondary: {
                    backgroundColor: 'var(--theme-secondary)',
                    color: 'var(--theme-text)',
                },
                buttonSurface: {
                    backgroundColor: 'var(--theme-surface-light)',
                    color: 'var(--theme-text)',
                },
                // Cards
                card: {
                    backgroundColor: 'var(--theme-surface)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text)',
                },
            };
        };

        // Fonction pour obtenir les classes CSS basées sur le thème (alternative)
        const getThemeClasses = (type) => {
            // Utiliser des classes avec variables CSS via style inline
            const baseClasses = {
                bg: 'transition-colors duration-300',
                surface: 'transition-colors duration-300',
                text: 'transition-colors duration-300',
                border: 'transition-colors duration-300',
                button: 'transition-all duration-300',
                card: 'transition-colors duration-300',
            };
            return baseClasses[type] || '';
        };
        const stocksLoadingRef = useRef(false); // Pour éviter les chargements multiples
        const batchLoadedRef = useRef(false); // Pour suivre si le batch a déjà chargé les données
        
        // États pour le composant expandable du ticker tape
        const [tickerExpandableOpen, setTickerExpandableOpen] = useState(false);
        const [tickerExpandableUrl, setTickerExpandableUrl] = useState('');
        const [tickerExpandableTitle, setTickerExpandableTitle] = useState('');

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

        // Configuration API
        const API_BASE_URL = (window.location && window.location.origin) ? window.location.origin : '';
        const globalUtils = (typeof window !== 'undefined' && window.DASHBOARD_UTILS) ? window.DASHBOARD_UTILS : {};

        // Configuration GitHub
        const GITHUB_REPO = 'projetsjsl/GOB';
        const GITHUB_BRANCH = 'main';

        // Fonction pour nettoyer l'encodage des caractères
        const cleanText = globalUtils.cleanText || ((text) => {
            if (!text) return '';
            return text
                .replace(/Ã©/g, 'é')
                .replace(/Ã¨/g, 'è')
                .replace(/Ã /g, 'à')
                .replace(/Ã§/g, 'ç')
                .replace(/Ã´/g, 'ô')
                .replace(/Ã¢/g, 'â')
                .replace(/Ã®/g, 'î')
                .replace(/Ã¯/g, 'ï')
                .replace(/Ã¹/g, 'ù')
                .replace(/Ã»/g, 'û')
                .replace(/Ã«/g, 'ë')
                .replace(/Ã¤/g, 'ä')
                .replace(/Ã¶/g, 'ö')
                .replace(/Ã¼/g, 'ü')
                .replace(/â€™/g, "'")
                .replace(/â€œ/g, '"')
                .replace(/â€/g, '"')
                .replace(/â€"/g, '–')
                .replace(/â€"/g, '—');
        });

        // Fonction pour déterminer l'icône et la couleur d'une nouvelle
        const getNewsIcon = (title, description, sentiment) => {
            const text = ((title || '') + ' ' + (description || '')).toLowerCase();

            // Catégories avec mots-clés (français et anglais)
            const categories = {
                earnings: {
                    keywords: ['earnings', 'résultats', 'profit', 'bénéfice', 'trimestre', 'quarterly', 'revenue', 'chiffre d\'affaires'],
                    icon: 'DollarSign',
                    color: 'text-green-500'
                },
                merger: {
                    keywords: ['merger', 'acquisition', 'fusionner', 'racheter', 'acquérir', 'deal', 'accord'],
                    icon: 'Briefcase',
                    color: 'text-purple-500'
                },
                growth: {
                    keywords: ['croissance', 'expansion', 'growth', 'augmente', 'monte', 'hausse', 'rally', 'surge', 'gain'],
                    icon: 'TrendingUp',
                    color: 'text-green-500'
                },
                decline: {
                    keywords: ['baisse', 'chute', 'decline', 'drop', 'fall', 'perte', 'loss', 'diminue'],
                    icon: 'TrendingDown',
                    color: 'text-red-500'
                },
                regulation: {
                    keywords: ['régulation', 'regulation', 'law', 'loi', 'sec', 'fda', 'gouvernement', 'government'],
                    icon: 'Shield',
                    color: 'text-blue-500'
                },
                target: {
                    keywords: ['target', 'objectif', 'forecast', 'prévision', 'outlook', 'guidance'],
                    icon: 'Target',
                    color: 'text-indigo-500'
                },
                market: {
                    keywords: ['market', 'marché', 'index', 'indice', 's&p', 'dow', 'nasdaq', 'bourse'],
                    icon: 'BarChart3',
                    color: 'text-blue-500'
                }
            };

            // Vérifier chaque catégorie
            for (const [key, category] of Object.entries(categories)) {
                if (category.keywords.some(keyword => text.includes(keyword))) {
                    return { icon: category.icon, color: category.color };
                }
            }

            // Par défaut: icône basée sur le sentiment
            if (sentiment === 'positive' || text.includes('positif') || text.includes('success') || text.includes('succès')) {
                return { icon: 'TrendingUp', color: 'text-green-500' };
            }
            if (sentiment === 'negative' || text.includes('négatif') || text.includes('risk') || text.includes('risque')) {
                return { icon: 'TrendingDown', color: 'text-red-500' };
            }

            // Fallback: icône de journal
            return { icon: 'Newspaper', color: 'text-gray-500' };
        };

        // Fonction pour évaluer la crédibilité d'une source de nouvelles
        const getSourceCredibility = globalUtils.getSourceCredibility || ((sourceName) => {
            if (!sourceName) return 0;

            const source = sourceName.toLowerCase();

            // Tier 1: Sources premium (100-90)
            const tier1 = ['bloomberg', 'reuters', 'wall street journal', 'wsj', 'financial times', 'ft'];
            if (tier1.some(s => source.includes(s))) return 100;

            // Tier 2: Sources institutionnelles (89-80)
            const tier2 = ['cnbc', 'marketwatch', 'barron', 'forbes', 'economist', 'la presse', 'les affaires'];
            if (tier2.some(s => source.includes(s))) return 85;

            // Tier 3: Sources établies (79-70)
            const tier3 = ['yahoo finance', 'seeking alpha', 'business insider', 'benzinga', 'investopedia'];
            if (tier3.some(s => source.includes(s))) return 75;

            // Tier 4: Agrégateurs et PR (69-60)
            const tier4 = ['pr newswire', 'business wire', 'globe newswire', 'accesswire', 'fmp', 'finnhub'];
            if (tier4.some(s => source.includes(s))) return 65;

            // Tier 5: Sources inconnues (50)
            return 50;
        });

        // Fonction pour trier les nouvelles par crédibilité puis par date
        const sortNewsByCredibility = (newsArray) => {
            return [...newsArray].sort((a, b) => {
                // 1. Trier par crédibilité de la source
                const credibilityA = getSourceCredibility(a.source?.name);
                const credibilityB = getSourceCredibility(b.source?.name);

                if (credibilityB !== credibilityA) {
                    return credibilityB - credibilityA; // Descendant (plus crédible en premier)
                }

                // 2. Si même crédibilité, trier par date (plus récent en premier)
                const dateA = new Date(a.publishedAt || a.publishedDate || 0);
                const dateB = new Date(b.publishedAt || b.publishedDate || 0);
                return dateB - dateA;
            });
        };

        // Fonction pour détecter si un article est en français
        const isFrenchArticle = globalUtils.isFrenchArticle || ((article) => {
            if (!article) return false;

            const text = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
            const sourceName = (article.source?.name || '').toLowerCase();

            // Sources françaises connues
            const frenchSources = ['la presse', 'les affaires', 'radio-canada', 'ici', 'le devoir', 'le journal', 'reuters fr', 'bloomberg fr'];
            if (frenchSources.some(source => sourceName.includes(source))) {
                return true;
            }

            // Mots-clés français communs dans les articles financiers
            const frenchKeywords = [
                'à', 'de', 'et', 'pour', 'dans', 'avec', 'sur', 'plus', 'après', 'annonce',
                'hausse', 'baisse', 'résultats', 'bourse', 'marché', 'économie', 'entreprise',
                'société', 'actionnaire', 'bénéfice', 'chiffre', 'trimestre', 'milliards', 'millions'
            ];

            // Compter combien de mots-clés français sont présents
            const frenchWordCount = frenchKeywords.filter(keyword => text.includes(keyword)).length;

            // Si 3+ mots-clés français, considérer comme article français
            return frenchWordCount >= 3;
        });

        // Fonction pour résumer un article avec Emma IA
        const summarizeWithEmma = (articleUrl, articleTitle) => {
            const prompt = `📰 Résume cet article et donne-moi les points clés:\n\nTitre: ${articleTitle}\nURL: ${articleUrl}\n\nMerci de fournir:\n1. Résumé en 3-4 points\n2. Impact potentiel sur les marchés\n3. Éléments à surveiller`;

            console.log('📝 Redirecting to Emma with article:', articleTitle);
            setEmmaPrefillMessage(prompt);
            setEmmaAutoSend(true);
            setActiveTab('ask-emma');
        };

        // Fonction pour extraire le logo depuis les données de scraping
        const getCompanyLogo = (ticker) => {
            try {
                // Chercher dans les  données de scraping
                const seekingAlphaItem = seekingAlphaData.stocks?.find(s => s.ticker === ticker);
                if (seekingAlphaItem?.raw_text) {
                    // Extraire le logo depuis le JSON dans raw_text
                    const logoMatch = seekingAlphaItem.raw_text.match(/"logo":"([^"]+)"/);
                    if (logoMatch && logoMatch[1]) {
                        return logoMatch[1];
                    }
                }

                // Fallback vers des logos par défaut
                const defaultLogos = {
                    // Tickers US
                    'GOOGL': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/GOOGL.svg',
                    'T': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/T.svg',
                    'CSCO': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/CSCO.svg',
                    'CVS': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/CVS.svg',
                    'DEO': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/DEO.svg',
                    'MDT': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/MDT.svg',
                    'JNJ': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/JNJ.svg',
                    'JPM': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/JPM.svg',
                    'LVMHF': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/LVMHF.svg',
                    'MU': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/MU.svg',
                    'NSRGY': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/NSRGY.svg',
                    'NKE': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/NKE.svg',
                    'PFE': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/PFE.svg',
                    'UNH': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/UNH.svg',
                    'UL': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/UL.svg',
                    'VZ': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/VZ.svg',
                    'WFC': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/WFC.svg',

                    // Tickers TSX (Canada)
                    'BNS': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/BNS.svg',
                    'TD': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/TD.svg',
                    'BCE': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/BCE.svg',
                    'CNR': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/CNR.svg',
                    'MG': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/MG.svg',
                    'MFC': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/MFC.svg',
                    'NTR': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/NTR.svg',
                    'TRP': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/TRP.svg',

                    // Autres tickers populaires
                    'AAPL': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/AAPL.svg',
                    'MSFT': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/MSFT.svg',
                    'AMZN': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/AMZN.svg',
                    'TSLA': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/TSLA.svg',
                    'NVDA': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/NVDA.svg',
                    'META': 'https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/META.svg'
                };

                // Strip suffix for Seeking Alpha logos (e.g. MFC.TO -> MFC)
                const cleanTicker = ticker.split('.')[0];
                return defaultLogos[ticker] || `https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/${cleanTicker}.svg`;
            } catch (error) {
                console.error(`Erreur extraction logo pour ${ticker}:`, error?.message || String(error));
                return `https://static.seekingalpha.com/cdn/s3/company_logos/mark_vector_light/${ticker}.svg`;
            }
        };

        // Fonction helper pour l'erreur de chargement d'image
        const handleImageError = (e) => {
            e.target.onerror = null; // Prevent loop
            e.target.style.display = 'none';
            // Optional: set fallback
            // e.target.src = 'path/to/fallback.png';
        };

        // Système de logs pour Admin JSLAI
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

        // Fonction pour basculer le thème
        const toggleTheme = () => {
            const next = !isDarkMode;
            setIsDarkMode(next);
            try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch (_) { }
        };


        // Fonction pour gérer le changement d'onglet avec animations d'intro
        const handleTabChange = (tabId) => {
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

        // Fonction pour charger les données du ticker (sans auto-refresh)
        const fetchTickerData = async () => {
            try {
                // Vérifier d'abord les données préchargées depuis la page de login
                const preloadedDataStr = sessionStorage.getItem('preloaded-dashboard-data');
                if (preloadedDataStr) {
                    try {
                        const preloadedData = JSON.parse(preloadedDataStr);
                        const dataAge = Date.now() - (preloadedData.timestamp || 0);
                        const MAX_AGE = 5 * 60 * 1000; // 5 minutes

                        if (preloadedData.tickerData && dataAge < MAX_AGE) {
                            console.log('⚡ Utilisation des données préchargées pour les tickers');
                            setTickerData(preloadedData.tickerData);
                            addLog(`✅ Ticker chargé depuis préchargement: ${preloadedData.tickerData.length} instruments`, 'success');
                            return;
                        }
                    } catch (e) {
                        console.warn('⚠️ Erreur lecture données préchargées:', e);
                    }
                }

                // Sinon, charger normalement depuis l'API
                const symbols = [
                    // Indices US
                    { symbol: '^GSPC', name: 'S&P 500', type: 'index' },
                    { symbol: '^DJI', name: 'DOW', type: 'index' },
                    { symbol: '^IXIC', name: 'NASDAQ', type: 'index' },
                    { symbol: '^RUT', name: 'Russell 2000', type: 'index' },
                    // Indices Canada
                    { symbol: '^GSPTSE', name: 'TSX', type: 'index' },
                    // Indices Europe
                    { symbol: '^FCHI', name: 'CAC 40', type: 'index' },
                    { symbol: '^GDAXI', name: 'DAX', type: 'index' },
                    { symbol: '^FTSE', name: 'FTSE 100', type: 'index' },
                    { symbol: '^IBEX', name: 'IBEX 35', type: 'index' },
                    { symbol: '^FTSEMIB', name: 'FTSE MIB', type: 'index' },
                    { symbol: '^AEX', name: 'AEX', type: 'index' },
                    { symbol: '^SSMI', name: 'SMI', type: 'index' },
                    // Devises
                    { symbol: 'CADUSD=X', name: 'CAD/USD', type: 'forex' },
                    { symbol: 'EURUSD=X', name: 'EUR/USD', type: 'forex' },
                    { symbol: 'GBPUSD=X', name: 'GBP/USD', type: 'forex' },
                    // Obligations (approximation)
                    { symbol: '^TNX', name: 'US 10Y', type: 'bond' },
                    { symbol: '^FVX', name: 'US 5Y', type: 'bond' }
                ];

                // OPTIMISATION: Chargement parallèle au lieu de séquentiel
                const symbolSymbols = symbols.map(s => s.symbol);
                const tickerPromises = symbolSymbols.map(async (symbol, index) => {
                    try {
                        const response = await fetch(`${API_BASE_URL}/api/marketdata?endpoint=quote&symbol=${encodeURIComponent(symbol)}&source=auto`);
                        if (response.ok) {
                            const data = await response.json();
                            if (data && data.c !== undefined) {
                                const item = symbols[index];
                                return {
                                    symbol: item.symbol,
                                    name: item.name,
                                    type: item.type,
                                    price: data.c || data.price || 0,
                                    change: data.d || data.change || 0,
                                    changePercent: data.dp || data.changePercent || 0
                                };
                            }
                        }
                    } catch (err) {
                        console.error(`Erreur chargement ${symbol}:`, err);
                    }
                    return null;
                });

                // Attendre tous les appels en parallèle
                const tickerResults = (await Promise.all(tickerPromises)).filter(Boolean);
                setTickerData(tickerResults);
                addLog(`✅ Ticker chargé: ${tickerResults.length} instruments`, 'success');
            } catch (error) {
                console.error('Erreur fetchTickerData:', error);
                addLog(`❌ Erreur ticker: ${error.message}`, 'error');
            }
        };

        // Données Market Data (Finnhub + Alpha Vantage + Yahoo Finance)
        const fetchStockData = async (ticker) => {
            try {
                // Essayer d'abord la nouvelle API unifiée avec Yahoo Finance (gratuit)
                const response = await fetch(`${API_BASE_URL}/api/marketdata?endpoint=quote&symbol=${ticker}&source=auto`);
                if (!response.ok) throw new Error(`API error: ${response.status}`);
                return await response.json();
            } catch (error) {
                console.error('Erreur fetch stock data (marketdata):', error?.message || String(error));
                // Rester sur marketdata; l’API gère déjà ses fallbacks internes
                return null;
            }
        };

        // Fonction pour charger les dernières nouvelles Finviz pour tous les tickers
        const fetchFinvizNews = async () => {
            console.log('📰 Chargement des dernières nouvelles Finviz...');

            const newsPromises = tickers.map(async (ticker) => {
                try {
                    const response = await fetch(`${API_BASE_URL}/api/finviz-news?ticker=${ticker}`);
                    const data = await response.json();

                    if (data.success && data.latestNews) {
                        return { ticker, news: data.latestNews };
                    }
                    return { ticker, news: null };
                } catch (error) {
                    console.error(`Error fetching Finviz news for ${ticker}:`, error);
                    return { ticker, news: null };
                }
            });

            const results = await Promise.all(newsPromises);

            const newsMap = {};
            results.forEach(({ ticker, news }) => {
                newsMap[ticker] = news;
            });

            setFinvizNews(newsMap);
            console.log(`✅ Finviz news loaded for ${Object.keys(newsMap).length} tickers`);
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
                    // DÉSACTIVÉ: Finviz "Why Is It Moving?" cause des timeouts (504)
                    // L'API /finviz-why-moving prend trop de temps et timeout constamment
                    // On utilise maintenant uniquement l'API unifiée (FMP + Finnhub)
                    /*
                    try {
                        const whyMovingResponse = await fetch(`${API_BASE_URL}/api/finviz-why-moving?ticker=${ticker}`);
                        if (whyMovingResponse.ok) {
                            const whyMovingData = await whyMovingResponse.json();
                            if (whyMovingData.success && whyMovingData.explanation) {
                                moveReasonsMap[ticker] = {
                                    explanation: whyMovingData.explanation,
                                    explanation_enriched: whyMovingData.explanation_enriched,
                                    date: whyMovingData.date,
                                    source: whyMovingData.source || 'Finviz AI',
                                    type: whyMovingData.type || 'general',
                                    timestamp: whyMovingData.timestamp
                                };
                                
                                // Utiliser aussi comme news principale
                                newsMap[ticker] = {
                                    title: whyMovingData.explanation,
                                    source: whyMovingData.source || 'Finviz AI',
                                    date: whyMovingData.date,
                                    url: '#',
                                    type: whyMovingData.type,
                                    isWhyMoving: true
                                };
                                console.log(`✅ "Why Is It Moving?" trouvé pour ${ticker}`);
                                return;
                            }
                        }
                    } catch (whyMovingError) {
                        console.warn(`⚠️ Finviz Why Moving non disponible pour ${ticker}:`, whyMovingError.message);
                    }
                    */

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

        // Fonction helper pour extraire raison de mouvement depuis une news
        const extractMoveReasonFromNews = (newsTitle) => {
            if (!newsTitle) return null;

            // Si la news contient déjà une explication claire, l'utiliser
            const title = newsTitle.toLowerCase();

            // Mots-clés indicateurs d'explication
            const explanationKeywords = ['because', 'due to', 'after', 'following', 'amid', 'on', 'as', 'car', 'suite à', 'après', 'en raison de'];
            const hasExplanation = explanationKeywords.some(kw => title.includes(kw));

            if (hasExplanation || title.length > 50) {
                // Prendre les premiers 100 caractères comme explication
                return newsTitle.length > 100 ? newsTitle.substring(0, 100) + '...' : newsTitle;
            }

            return null;
        };

        // Fonction pour extraire la raison du mouvement depuis les news
        // AMÉLIORÉ pour utiliser "Why Is It Moving?" de Finviz en priorité
        const extractMoveReason = (ticker, changePercent) => {
            // PRIORITÉ 1: Utiliser l'explication "Why Is It Moving?" de Finviz si disponible
            const whyMoving = tickerMoveReasons[ticker];
            if (whyMoving && whyMoving.explanation) {
                // Utiliser l'explication enrichie par AI si disponible, sinon l'explication originale
                const explanation = whyMoving.explanation_enriched || whyMoving.explanation;
                // Limiter à 120 caractères pour l'affichage
                return explanation.length > 120 ? explanation.substring(0, 120) + '...' : explanation;
            }

            // PRIORITÉ 2: Utiliser la news récente depuis tickerLatestNews
            let news = tickerLatestNews[ticker];

            // Si on a une news dans tickerLatestNews, l'utiliser directement (déjà filtrée par l'API)
            if (news && news.title) {
                // Afficher le titre complet ou tronqué
                return news.title.length > 120 ? news.title.substring(0, 120) + '...' : news.title;
            }

            // PRIORITÉ 3: DÉSACTIVÉE - Trop d'erreurs de matching (ex: "T" matche "The")
            // On fait confiance uniquement à l'API serveur /api/news qui filtre strictement
            /*
            if (!news && newsData && newsData.length > 0) {
                 // ... code removed to prevent false positives ...
            }
            */

            // FALLBACK: Message générique seulement si vraiment aucune news trouvée
            const directionLabel = changePercent > 0 ? 'hausse' : 'baisse';
            return `Variation en ${directionLabel} de ${Math.abs(changePercent).toFixed(2)}% sans actualité confirmée.`;
        };

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

        // Actualités via endpoint unifié (FMP, Finnhub, Finviz, RSS) - AMÉLIORÉ avec sources québécoises
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

        // Fonction pour récupérer les nouvelles des Top Movers
        const fetchNewsForTopMovers = async (topMoversData) => {
            if (!topMoversData || !topMoversData.data) {
                console.warn('⚠️ Pas de données top movers pour récupérer les nouvelles');
                return {};
            }

            try {
                // 1. Vérifier le cache Supabase d'abord
                const cacheResponse = await fetch(
                    `${API_BASE_URL}/api/supabase-daily-cache?type=top_movers_news&date=${new Date().toISOString().split('T')[0]}&maxAgeHours=${cacheSettings.maxAgeHours || 4}`
                );

                if (cacheResponse.ok) {
                    const cacheResult = await cacheResponse.json();
                    if (cacheResult.success && cacheResult.cached && !cacheResult.expired) {
                        console.log('✅ Nouvelles Top Movers depuis cache Supabase');
                        return cacheResult.data || {};
                    }
                }

                // 2. Récupérer les symboles des gainers et losers
                const gainers = topMoversData.data?.gainers || [];
                const losers = topMoversData.data?.losers || [];
                const allSymbols = [...gainers, ...losers].map(stock => stock.symbol).filter(Boolean);

                if (allSymbols.length === 0) {
                    console.warn('⚠️ Aucun symbole trouvé dans les top movers');
                    return {};
                }

                console.log(`📰 Récupération nouvelles pour ${allSymbols.length} top movers: ${allSymbols.join(', ')}`);

                // 3. Récupérer les nouvelles pour chaque symbole (limite à 3 par symbole)
                const newsMap = {};
                const newsPromises = allSymbols.slice(0, 6).map(async (symbol) => {
                    try {
                        const response = await fetch(
                            `${API_BASE_URL}/api/news?q=${encodeURIComponent(symbol)}&limit=3&context=top_movers`
                        );
                        if (response.ok) {
                            const data = await response.json();
                            if (data.success && data.articles && data.articles.length > 0) {
                                newsMap[symbol] = data.articles.slice(0, 3).map(article => ({
                                    title: article.title || article.headline,
                                    description: article.summary || '',
                                    url: article.url,
                                    publishedAt: article.published_at || article.datetime || article.date,
                                    source: {
                                        name: article.source_original || article.source || article.source_provider || 'Unknown',
                                        provider: article.source_provider
                                    }
                                }));
                            }
                        }
                    } catch (error) {
                        console.warn(`⚠️ Erreur récupération news pour ${symbol}:`, error.message);
                    }
                });

                await Promise.all(newsPromises);

                // 4. Sauvegarder dans le cache Supabase (write-through)
                if (Object.keys(newsMap).length > 0) {
                    try {
                        await fetch(`${API_BASE_URL}/api/supabase-daily-cache`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                type: 'top_movers_news',
                                date: new Date().toISOString().split('T')[0],
                                data: newsMap
                            })
                        });
                        console.log('✅ Nouvelles Top Movers sauvegardées dans cache Supabase');
                    } catch (error) {
                        console.warn('⚠️ Erreur sauvegarde cache (non bloquant):', error.message);
                    }
                }

                console.log(`✅ Nouvelles récupérées pour ${Object.keys(newsMap).length} top movers`);
                return newsMap;
            } catch (error) {
                console.error('❌ Erreur fetchNewsForTopMovers:', error);
                return {};
            }
        };

        // Fonction Emma Populate pour Stocks & News
        const emmaPopulateStocksNews = async () => {
            console.log('🤖 Emma Populate Stocks & News...');

            // 1. Vérifier le cache Supabase Gemini d'abord
            try {
                const cacheResponse = await fetch(
                    `${API_BASE_URL}/api/supabase-daily-cache?type=gemini_analysis&date=${new Date().toISOString().split('T')[0]}&maxAgeHours=${cacheSettings.maxAgeHours || 4}`
                );

                if (cacheResponse.ok) {
                    const cacheResult = await cacheResponse.json();
                    if (cacheResult.success && cacheResult.cached && !cacheResult.expired) {
                        const ageHours = parseFloat(cacheResult.age_hours || 0);
                        const maxAge = cacheResult.max_age_hours || cacheSettings.maxAgeHours || 4;
                        if (ageHours < maxAge) {
                            console.log(`✅ Analyse Gemini depuis cache Supabase (${ageHours.toFixed(1)}h / ${maxAge}h)`);
                            showMessage(`Analyse chargée depuis le cache (${ageHours.toFixed(1)}h)`, 'success');
                            return; // Utiliser le cache, pas besoin d'appeler Gemini
                        }
                    }
                }
            } catch (error) {
                console.warn('⚠️ Erreur récupération cache Gemini (non bloquant):', error.message);
            }

            setLoading(true);

            try {
                const response = await fetch('/api/emma-agent', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: "Récupérer les données de prix, news, et recommandations pour tous les tickers d'équipe. Analyse les performances, actualités récentes, et fournis des insights sur chaque action.",
                        context: {
                            tickers: teamTickers,
                            news_requested: true,
                            analysis_type: 'stocks_news_population'
                        }
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();

                if (result.success) {
                    // Sauvegarder dans le cache Supabase (write-through)
                    try {
                        await fetch(`${API_BASE_URL}/api/supabase-daily-cache`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                type: 'gemini_analysis',
                                date: new Date().toISOString().split('T')[0],
                                data: {
                                    tickers: teamTickers,
                                    result: result,
                                    timestamp: new Date().toISOString()
                                }
                            })
                        });
                        console.log('✅ Analyse Gemini sauvegardée dans cache Supabase');
                    } catch (error) {
                        console.warn('⚠️ Erreur sauvegarde cache Gemini (non bloquant):', error.message);
                    }

                    // Sauvegarder la configuration utilisée
                    await savePopulateConfig('stocks-news', {
                        tools_used: result.tools_used,
                        execution_time: result.execution_time_ms,
                        is_reliable: result.is_reliable,
                        timestamp: new Date().toISOString()
                    });

                    showMessage(`Emma a analysé ${teamTickers.length} tickers avec ${result.tools_used?.length || 0} outils`, 'success');
                    console.log('✅ Emma Populate Stocks & News completed:', result);
                } else {
                    throw new Error(result.error || 'Emma analysis failed');
                }
            } catch (error) {
                console.error('❌ Emma Populate Stocks & News error:', error);
                showMessage(`Erreur Emma: ${error.message}`, 'error');
            } finally {
                setLoading(false);
            }
        };

        // Fonction pour sauvegarder la configuration de population
        const savePopulateConfig = async (tabName, config) => {
            try {
                const bodyData = {
                    message: `Sauvegarder la configuration de population pour l'onglet ${tabName}`,
                    context: {
                        action: 'save_config',
                        tab_name: tabName,
                        config: config
                    }
                };

                const response = await fetch('/api/emma-agent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bodyData)
                });

                if (response.ok) {
                    console.log(`✅ Configuration sauvegardée pour ${tabName}`);
                }
            } catch (error) {
                console.error('❌ Erreur sauvegarde config:', error);
            }
        };

        // Fonction Emma Populate pour Dan's Watchlist
        const emmaPopulateWatchlist = async () => {
            console.log('🤖 Emma Populate Dan\'s Watchlist...');
            setLoading(true);

            try {
                const response = await fetch('/api/emma-agent', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: "Analyser en détail tous les tickers de la watchlist Dan. Récupérer les données fondamentales, techniques, actualités et recommandations d'analystes. Fournir une analyse complète de chaque action avec insights et recommandations.",
                        context: {
                            tickers: watchlistTickers,
                            analysis_type: 'watchlist_detailed_analysis',
                            include_fundamentals: true,
                            include_technical: true,
                            include_news: true,
                            include_analyst_recommendations: true
                        }
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();

                if (result.success) {
                    // Sauvegarder la configuration utilisée
                    await savePopulateConfig('watchlist', {
                        tools_used: result.tools_used,
                        execution_time: result.execution_time_ms,
                        is_reliable: result.is_reliable,
                        tickers_analyzed: watchlistTickers.length,
                        timestamp: new Date().toISOString()
                    });

                    showMessage(`Emma a analysé en détail ${watchlistTickers.length} tickers de la watchlist avec ${result.tools_used?.length || 0} outils`, 'success');
                    console.log('✅ Emma Populate Watchlist completed:', result);
                } else {
                    throw new Error(result.error || 'Emma analysis failed');
                }
            } catch (error) {
                console.error('❌ Emma Populate Watchlist error:', error);
                showMessage(`Erreur Emma: ${error.message}`, 'error');
            } finally {
                setLoading(false);
            }
        };

        // Fonction Emma Populate pour JLab (IntelliStocks)
        const emmaPopulateJLab = window.emmaPopulateJLab = async () => {
            console.log('🤖 Emma Populate JLab (IntelliStocks)...');
            setLoading(true);

            try {
                const response = await fetch('/api/emma-agent', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: "Peupler l'onglet JLab (IntelliStocks) avec des analyses avancées. Calculer les scores JSLAI™, analyser les ratios financiers, évaluer la valorisation, et fournir des recommandations d'investissement basées sur l'analyse quantitative et qualitative.",
                        context: {
                            tickers: teamTickers,
                            analysis_type: 'jlab_intellistocks_population',
                            include_jsla_score: true,
                            include_valuation_analysis: true,
                            include_risk_assessment: true,
                            include_sector_analysis: true,
                            include_technical_indicators: true
                        }
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();

                if (result.success) {
                    // Sauvegarder la configuration utilisée
                    await savePopulateConfig('jlab', {
                        tools_used: result.tools_used,
                        execution_time: result.execution_time_ms,
                        is_reliable: result.is_reliable,
                        tickers_analyzed: teamTickers.length,
                        jsla_scores_calculated: true,
                        timestamp: new Date().toISOString()
                    });

                    showMessage(`Emma a peuplé JLab avec ${teamTickers.length} tickers et calculé les scores JSLAI™ avec ${result.tools_used?.length || 0} outils`, 'success');
                    console.log('✅ Emma Populate JLab completed:', result);
                } else {
                    throw new Error(result.error || 'Emma analysis failed');
                }
            } catch (error) {
                console.error('❌ Emma Populate JLab error:', error);
                showMessage(`Erreur Emma: ${error.message}`, 'error');
            } finally {
                setLoading(false);
            }
        };

        // 🔄 FONCTION BATCH REFRESH - Actualiser tous les onglets via Emma Agent
        const batchRefreshAllTabs = async () => {
            console.log('🔄 Emma Agent Batch Refresh - START');
            const startTime = Date.now();
            setLoading(true);

            try {
                // Préparer les contextes pour chaque onglet avec Cognitive Scaffolding
                const contexts = {
                    jlab: {
                        tickers: teamTickers,
                        analysis_type: 'jlab_intellistocks_population',
                        include_jsla_score: true,
                        include_valuation_analysis: true,
                        include_risk_assessment: true,
                        include_sector_analysis: true,
                        include_technical_indicators: true
                    },
                    watchlist: {
                        tickers: watchlistTickers,
                        analysis_type: 'watchlist_detailed_analysis',
                        include_fundamentals: true,
                        include_technical: true,
                        include_news: true,
                        include_analyst_recommendations: true,
                        news_limit: 3
                    },
                    stocks_news: {
                        tickers: teamTickers,
                        analysis_type: 'stocks_news_population',
                        news_requested: true,
                        news_limit: 50,
                        include_market_indices: true,
                        include_top_movers: true,
                        include_economic_calendar: true,
                        include_earnings_calendar: true
                    }
                };

                console.log('📊 Batch Refresh Contexts:', contexts);

                // Appels parallèles pour les 3 onglets via Emma Agent (MODE DATA pour JSON structuré)
                const [jlabResult, watchlistResult, newsResult] = await Promise.allSettled([
                    fetch('/api/emma-agent', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message: "Récupérer prix, PE, volume, marketCap, EPS, ROE, revenueGrowth, debtToEquity pour tous les tickers",
                            context: {
                                ...contexts.jlab,
                                output_mode: 'data',  // ← MODE DATA pour JSON structuré
                                fields_requested: ['price', 'pe', 'volume', 'marketCap', 'eps', 'roe', 'revenueGrowth', 'debtToEquity']
                            }
                        })
                    }).then(r => r.json()),

                    fetch('/api/emma-agent', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message: "Récupérer prix, variation, volume, RSI, MACD, SMA50, SMA200 pour tous les tickers watchlist",
                            context: {
                                ...contexts.watchlist,
                                output_mode: 'data',  // ← MODE DATA pour JSON structuré
                                fields_requested: ['price', 'change', 'changePercent', 'volume', 'rsi', 'macd', 'sma50', 'sma200']
                            }
                        })
                    }).then(r => r.json()),

                    fetch('/api/emma-agent', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message: "Récupérer prix, news (top 10), analyst_recommendations, marketCap pour tous les tickers",
                            context: {
                                ...contexts.stocks_news,
                                output_mode: 'data',  // ← MODE DATA pour JSON structuré
                                fields_requested: ['price', 'news', 'analyst_recommendations', 'marketCap']
                            }
                        })
                    }).then(r => r.json())
                ]);

                // Parser les résultats
                const jlab = jlabResult.status === 'fulfilled' ? jlabResult.value : null;
                const watchlist = watchlistResult.status === 'fulfilled' ? watchlistResult.value : null;
                const news = newsResult.status === 'fulfilled' ? newsResult.value : null;

                const executionTime = Date.now() - startTime;

                // Log des résultats
                console.log('✅ Emma Agent Batch Refresh - COMPLETED:', {
                    jlab: {
                        success: jlab?.success,
                        tools_used: jlab?.tools_used,
                        intent: jlab?.intent,
                        confidence: jlab?.confidence,
                        is_reliable: jlab?.is_reliable
                    },
                    watchlist: {
                        success: watchlist?.success,
                        tools_used: watchlist?.tools_used,
                        intent: watchlist?.intent,
                        confidence: watchlist?.confidence,
                        is_reliable: watchlist?.is_reliable
                    },
                    news: {
                        success: news?.success,
                        tools_used: news?.tools_used,
                        intent: news?.intent,
                        confidence: news?.confidence,
                        is_reliable: news?.is_reliable
                    },
                    execution_time_ms: executionTime
                });

                // Afficher les résultats
                const successCount = [jlab?.success, watchlist?.success, news?.success].filter(Boolean).length;

                if (successCount === 3) {
                    showMessage(`✅ Tous les onglets actualisés avec succès (${(executionTime / 1000).toFixed(1)}s)`, 'success');
                } else if (successCount > 0) {
                    showMessage(`⚠️ ${successCount}/3 onglets actualisés (${(executionTime / 1000).toFixed(1)}s)`, 'warning');
                } else {
                    showMessage(`❌ Échec de l'actualisation des onglets`, 'error');
                }

                // Sauvegarder les statistiques de batch refresh
                await savePopulateConfig('batch-refresh', {
                    jlab_success: jlab?.success,
                    jlab_tools: jlab?.tools_used,
                    jlab_reliable: jlab?.is_reliable,
                    watchlist_success: watchlist?.success,
                    watchlist_tools: watchlist?.tools_used,
                    watchlist_reliable: watchlist?.is_reliable,
                    news_success: news?.success,
                    news_tools: news?.tools_used,
                    news_reliable: news?.is_reliable,
                    execution_time_ms: executionTime,
                    timestamp: new Date().toISOString()
                });

                return {
                    success: successCount > 0,
                    jlab: jlab?.success,
                    watchlist: watchlist?.success,
                    news: news?.success,
                    execution_time_ms: executionTime
                };

            } catch (error) {
                console.error('❌ Emma Agent Batch Refresh - ERROR:', error);
                showMessage(`Erreur batch refresh: ${error.message}`, 'error');
                return {
                    success: false,
                    error: error.message
                };
            } finally {
                setLoading(false);
            }
        };

        // Fonction pour récupérer les nouvelles d'un symbole spécifique depuis le cache
        const fetchSymbolNews = async (symbol) => {
            console.log(`📰 Récupération des nouvelles pour ${symbol} depuis le cache...`);
            try {
                // Cache non disponible - passer directement à l'API
                const cacheResponse = { ok: false };
                console.log(`📡 Réponse Cache Symbol: ${cacheResponse.status}`);

                if (cacheResponse.ok) {
                    const cacheData = await cacheResponse.json();
                    console.log(`📊 Données cache symbol reçues pour ${symbol}:`, cacheData);

                    if (cacheData.cached && cacheData.data && cacheData.data.length > 0) {
                        // Convertir le format du cache vers le format attendu
                        const articles = cacheData.data.map(item => ({
                            title: item.title,
                            description: item.description,
                            url: item.url,
                            publishedAt: item.published_at,
                            source: { name: item.source },
                            sentiment: item.sentiment,
                            category: item.category
                        }));

                        const sources = cacheData.sources ? cacheData.sources.join(', ') : 'Cache';
                        console.log(`${articles.length} nouvelles pour ${symbol} depuis le cache (${sources})`);
                        return articles;
                    }
                }

                // Si cache vide, retourner un tableau vide
                console.log(`⚠️ Pas de nouvelles en cache pour ${symbol}`);
                return [];

            } catch (error) {
                console.error(`❌ Erreur fetch symbol news pour ${symbol}:`, error?.message || String(error));
                return [];
            }
        };

        // Fonction pour changer le contexte des news (général, québécois, etc.)
        const changeNewsContext = async (newContext) => {
            setNewsContext(newContext);
            // Recharger les news avec le nouveau contexte
            await fetchNews();
        };

        // Fonction pour filtrer les actualités
        const filterNews = (filterValue) => {
            setNewsFilter(filterValue);
            let filtered = newsData;

            // Appliquer le filtre de recherche
            if (filterValue !== 'all') {
                filtered = filtered.filter(article => {
                    const text = (article.title + ' ' + article.description).toLowerCase();
                    return text.includes(filterValue.toLowerCase());
                });
            }

            // Appliquer le filtre français si activé
            if (frenchOnly) {
                filtered = filtered.filter(article => isFrenchArticle(article));
            }

            // Maintenir le tri par crédibilité après filtrage
            setFilteredNews(sortNewsByCredibility(filtered));
        };

        // Fonction pour obtenir la couleur des grades Quant
        const getGradeColor = globalUtils.getGradeColor || ((grade) => {
            if (!grade) return 'bg-gray-100 text-gray-600';
            // Convertir en chaîne si ce n'est pas déjà le cas
            const gradeStr = String(grade);
            if (!gradeStr || gradeStr.length === 0) return 'bg-gray-100 text-gray-600';
            const letter = gradeStr.charAt(0).toUpperCase();
            if (letter === 'A') return 'bg-green-100 text-green-700';
            if (letter === 'B') return 'bg-gray-100 text-gray-700';
            if (letter === 'C') return 'bg-yellow-100 text-yellow-700';
            if (letter === 'D') return 'bg-green-100 text-green-700';
            if (letter === 'F') return 'bg-red-100 text-red-700';
            return 'bg-gray-100 text-gray-600';
        });

        // Parser les données brutes de Seeking Alpha
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

        // Données Seeking Alpha (RAW DATA from Supabase)
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

        // Données Seeking Alpha ANALYZED (Gemini AI results from Supabase)
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

        // Fonction pour récupérer les données de comparaison de peers
        const fetchPeersComparisonData = async (ticker) => {
            setLoadingPeers(true);
            try {
                console.log(`📊 Chargement des données de comparaison de peers pour ${ticker}...`);

                // Essayer d'abord de récupérer depuis Supabase
                const response = await fetch(`${API_BASE_URL}/api/seeking-alpha-scraping?type=peers&ticker=${ticker}&latest=true`);

                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data && result.data.length > 0) {
                        // Trouver les données les plus récentes pour ce ticker
                        const latestData = result.data
                            .filter(item => item.ticker === ticker)
                            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

                        if (latestData && latestData.peers_data) {
                            setPeersData({
                                ticker: ticker,
                                data: latestData.peers_data,
                                timestamp: latestData.created_at,
                                url: `https://seekingalpha.com/symbol/${ticker}/peers/comparison`
                            });
                            console.log(`✅ Données de peers chargées pour ${ticker}`);
                            return;
                        }
                    }
                }

                // Fallback: créer des données de démonstration basées sur les données existantes
                console.log(`⚠️ Aucune donnée de peers trouvée pour ${ticker}, génération de données de démonstration...`);

                const mockPeersData = {
                    ticker: ticker,
                    data: {
                        peers: [
                            { symbol: 'AAPL', name: 'Apple Inc.', price: 175.43, change: 2.15, marketCap: '2.8T', pe: 28.5, sector: 'Technology' },
                            { symbol: 'MSFT', name: 'Microsoft Corporation', price: 378.85, change: -1.23, marketCap: '2.8T', pe: 32.1, sector: 'Technology' },
                            { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.56, change: 0.89, marketCap: '1.8T', pe: 25.3, sector: 'Technology' },
                            { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 155.12, change: -0.45, marketCap: '1.6T', pe: 45.2, sector: 'Consumer Discretionary' },
                            { symbol: 'META', name: 'Meta Platforms Inc.', price: 485.67, change: 3.21, marketCap: '1.2T', pe: 22.8, sector: 'Technology' }
                        ],
                        metrics: {
                            averagePE: 30.8,
                            averageMarketCap: '1.8T',
                            sectorDistribution: {
                                'Technology': 4,
                                'Consumer Discretionary': 1
                            }
                        },
                        analysis: `Analyse comparative des peers pour ${ticker}. Les métriques montrent une performance relative dans le secteur.`
                    },
                    timestamp: new Date().toISOString(),
                    url: `https://seekingalpha.com/symbol/${ticker}/peers/comparison`
                };

                setPeersData(mockPeersData);
                console.log(`✅ Données de démonstration générées pour ${ticker}`);

            } catch (error) {
                console.error(`❌ Erreur lors du chargement des données de peers pour ${ticker}:`, error);
                setPeersData(null);
            } finally {
                setLoadingPeers(false);
            }
        };

        // Fonction pour ouvrir la modal de comparaison de peers
        const openPeersComparison = async (ticker) => {
            setSelectedTickerForPeers(ticker);
            setShowPeersModal(true);
            await fetchPeersComparisonData(ticker);
        };

        // Monitoring Admin
        const checkApiStatus = async () => {
            const status = {
                finnhub: { status: 'checking', responseTime: 0, error: null },
                newsapi: { status: 'checking', responseTime: 0, error: null },
                seekingAlpha: { status: 'checking', responseTime: 0, error: null },
                claude: { status: 'checking', responseTime: 0, error: null },
                vercel: { status: 'checking', responseTime: 0, error: null },
                gemini: { status: 'checking', responseTime: 0, error: null },
                github: { status: 'checking', responseTime: 0, error: null },
                fmp: { status: 'checking', responseTime: 0, error: null },
                polygon: { status: 'checking', responseTime: 0, error: null },
                twelveData: { status: 'checking', responseTime: 0, error: null },
                supabase: { status: 'checking', responseTime: 0, error: null },
                fred: { status: 'checking', responseTime: 0, error: null },
                emmaAgent: { status: 'checking', responseTime: 0, error: null },
                resend: { status: 'checking', responseTime: 0, error: null },
                twilio: { status: 'checking', responseTime: 0, error: null }
            };

            // Test Market Data API (nouvelle API unifiée)
            try {
                const startTime = Date.now();
                const response = await fetch(`${API_BASE_URL}/api/marketdata?endpoint=quote&symbol=AAPL&source=auto`);
                const responseTime = Date.now() - startTime;

                if (response.ok) {
                    const data = await response.json();
                    status.finnhub = {
                        status: data.message ? 'warning' : 'success',
                        responseTime,
                        error: data.message || null,
                        source: data.source || 'unknown'
                    };
                } else {
                    status.finnhub = { status: 'error', responseTime, error: `HTTP ${response.status}` };
                }
            } catch (error) {
                status.finnhub = { status: 'error', responseTime: 0, error: error.message };
            }

            // Test NewsAPI
            try {
                const startTime = Date.now();
                const response = await fetch(`${API_BASE_URL}/api/ai-services`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        service: 'perplexity',
                        prompt: 'Actualités financières générales',
                        recency: 'day'
                    })
                });
                const responseTime = Date.now() - startTime;

                if (response.ok) {
                    status.newsapi = { status: 'success', responseTime, error: null };
                } else {
                    status.newsapi = { status: 'error', responseTime, error: `HTTP ${response.status} - Service temporairement indisponible` };
                }
            } catch (error) {
                status.newsapi = { status: 'error', responseTime: 0, error: 'Service indisponible - Vérifiez la configuration' };
            }

            // Test Seeking Alpha
            try {
                const startTime = Date.now();
                const response = await fetch('/stock_analysis.json');
                const responseTime = Date.now() - startTime;

                if (response.ok) {
                    status.seekingAlpha = { status: 'success', responseTime, error: null };
                } else {
                    status.seekingAlpha = { status: 'error', responseTime, error: `HTTP ${response.status}` };
                }
            } catch (error) {
                status.seekingAlpha = { status: 'error', responseTime: 0, error: error.message };
            }

            // Test Gemini API
            try {
                const startTime = Date.now();
                const response = await fetch('/api/gemini-key');
                const responseTime = Date.now() - startTime;

                if (response.ok) {
                    const data = await response.json();
                    status.gemini = {
                        status: data.apiKey ? 'success' : 'warning',
                        responseTime,
                        error: data.apiKey ? null : 'Clé API non configurée'
                    };
                } else {
                    status.gemini = { status: 'error', responseTime, error: `HTTP ${response.status}` };
                }
            } catch (error) {
                status.gemini = { status: 'error', responseTime: 0, error: error.message };
            }

            // Test GitHub API (si token configuré)
            if (githubToken) {
                try {
                    const startTime = Date.now();
                    const response = await fetch('https://api.github.com/user', {
                        headers: {
                            'Authorization': `token ${githubToken}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    });
                    const responseTime = Date.now() - startTime;

                    if (response.ok) {
                        const userData = await response.json();
                        setGithubUser(userData);
                        status.github = { status: 'success', responseTime, error: null };
                    } else {
                        status.github = { status: 'error', responseTime, error: `HTTP ${response.status}` };
                    }
                } catch (error) {
                    status.github = { status: 'error', responseTime: 0, error: error.message };
                }
            } else {
                status.github = { status: 'warning', responseTime: 0, error: 'Token GitHub non configuré' };
            }

            // Test Claude API (si configuré)
            try {
                const startTime = Date.now();
                const response = await fetch(`${API_BASE_URL}/api/ai-services`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        service: 'perplexity',
                        prompt: 'Test de connexion API',
                        marketData: {},
                        news: 'Test'
                    })
                });
                const responseTime = Date.now() - startTime;

                if (response.ok) {
                    status.claude = { status: 'success', responseTime, error: null };
                } else {
                    status.claude = { status: 'error', responseTime, error: `HTTP ${response.status} - Service Claude indisponible` };
                }
            } catch (error) {
                status.claude = { status: 'error', responseTime: 0, error: 'Service Claude non configuré ou indisponible' };
            }

            // Test Vercel API Routes
            try {
                const startTime = Date.now();
                const response = await fetch('/api/test-gemini');
                const responseTime = Date.now() - startTime;

                if (response.ok) {
                    const data = await response.json();
                    status.vercel = {
                        status: data.status === 'success' ? 'success' : 'warning',
                        responseTime,
                        error: data.status === 'success' ? null : data.message
                    };
                } else {
                    status.vercel = { status: 'error', responseTime, error: `HTTP ${response.status} - Route API Vercel non trouvée` };
                }
            } catch (error) {
                status.vercel = { status: 'error', responseTime: 0, error: 'Route API Vercel non disponible - Déploiement requis' };
            }

            // Test FMP API (Financial Modeling Prep)
            try {
                const startTime = Date.now();
                const response = await fetch(`${API_BASE_URL}/api/marketdata?endpoint=fundamentals&symbol=AAPL&source=auto`);
                const responseTime = Date.now() - startTime;

                if (response.ok) {
                    const data = await response.json();
                    status.fmp = {
                        status: data && data.profile ? 'success' : 'warning',
                        responseTime,
                        error: data && data.profile ? null : 'Données incomplètes',
                        source: data.source || 'unknown'
                    };
                } else {
                    status.fmp = { status: 'error', responseTime, error: `HTTP ${response.status}` };
                }
            } catch (error) {
                status.fmp = { status: 'error', responseTime: 0, error: error.message };
            }

            // Test Polygon.io (via marketdata quote)
            try {
                const startTime = Date.now();
                const response = await fetch(`${API_BASE_URL}/api/marketdata?endpoint=quote&symbol=AAPL&source=auto`);
                const responseTime = Date.now() - startTime;

                if (response.ok) {
                    const data = await response.json();
                    status.polygon = {
                        status: data && data.source === 'polygon.io' ? 'success' : 'warning',
                        responseTime,
                        error: data && data.source === 'polygon.io' ? null : 'Utilise un fallback',
                        source: data.source || 'unknown'
                    };
                } else {
                    status.polygon = { status: 'error', responseTime, error: `HTTP ${response.status}` };
                }
            } catch (error) {
                status.polygon = { status: 'error', responseTime: 0, error: error.message };
            }

            // Test Twelve Data (via marketdata quote)
            try {
                const startTime = Date.now();
                const response = await fetch(`${API_BASE_URL}/api/marketdata?endpoint=intraday&symbol=AAPL&interval=5min&outputsize=10`);
                const responseTime = Date.now() - startTime;

                if (response.ok) {
                    const data = await response.json();
                    status.twelveData = {
                        status: data && data.values ? 'success' : 'warning',
                        responseTime,
                        error: data && data.values ? null : 'Données incomplètes',
                        source: data.source || 'unknown'
                    };
                } else {
                    status.twelveData = { status: 'error', responseTime, error: `HTTP ${response.status}` };
                }
            } catch (error) {
                status.twelveData = { status: 'error', responseTime: 0, error: error.message };
            }

            // Test Supabase (via watchlist API)
            try {
                const startTime = Date.now();
                const response = await fetch('/api/supabase-watchlist');
                const responseTime = Date.now() - startTime;

                if (response.ok) {
                    const data = await response.json();
                    status.supabase = {
                        status: data.tickers !== undefined ? 'success' : 'warning',
                        responseTime,
                        error: data.tickers !== undefined ? null : 'Réponse inattendue'
                    };
                } else {
                    status.supabase = { status: 'error', responseTime, error: `HTTP ${response.status}` };
                }
            } catch (error) {
                status.supabase = { status: 'error', responseTime: 0, error: error.message };
            }

            // Test FRED API (via yield-curve)
            try {
                const startTime = Date.now();
                const response = await fetch('/api/yield-curve?country=us');
                const responseTime = Date.now() - startTime;

                if (response.ok) {
                    const data = await response.json();
                    status.fred = {
                        status: data && data.data && data.data.us ? 'success' : 'warning',
                        responseTime,
                        error: data && data.data && data.data.us ? null : 'Données incomplètes',
                        source: data.data?.us?.source || 'unknown'
                    };
                } else {
                    status.fred = { status: 'error', responseTime, error: `HTTP ${response.status}` };
                }
            } catch (error) {
                status.fred = { status: 'error', responseTime: 0, error: error.message };
            }

            // Test Emma Agent API
            try {
                const startTime = Date.now();
                const response = await fetch('/api/emma-agent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: 'Test de connexion',
                        context: { test: true }
                    })
                });
                const responseTime = Date.now() - startTime;

                if (response.ok) {
                    const data = await response.json();
                    status.emmaAgent = {
                        status: data.success !== false ? 'success' : 'warning',
                        responseTime,
                        error: data.success !== false ? null : data.error || 'Réponse d\'erreur'
                    };
                } else {
                    status.emmaAgent = { status: 'error', responseTime, error: `HTTP ${response.status}` };
                }
            } catch (error) {
                status.emmaAgent = { status: 'error', responseTime: 0, error: error.message };
            }

            // Test Resend API (Email) - vérification via endpoint de test
            try {
                const startTime = Date.now();
                // Test via l'endpoint email-briefings qui utilise Resend
                const response = await fetch('/api/emma-briefing?type=morning');
                const responseTime = Date.now() - startTime;

                if (response.ok || response.status === 400) {
                    // 400 peut signifier que l'API fonctionne mais qu'il manque des paramètres
                    status.resend = {
                        status: response.ok ? 'success' : 'warning',
                        responseTime,
                        error: response.ok ? null : 'Configuration incomplète'
                    };
                } else {
                    status.resend = { status: 'error', responseTime, error: `HTTP ${response.status}` };
                }
            } catch (error) {
                status.resend = { status: 'error', responseTime: 0, error: error.message };
            }

            // Test Twilio API (SMS) - vérification via endpoint SMS
            try {
                const startTime = Date.now();
                // Test via l'endpoint SMS adapter
                const response = await fetch('/api/adapters/sms', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ test: true })
                });
                const responseTime = Date.now() - startTime;

                if (response.ok || response.status === 400 || response.status === 405) {
                    // 400/405 peut signifier que l'API fonctionne mais qu'il manque des paramètres
                    status.twilio = {
                        status: response.ok ? 'success' : 'warning',
                        responseTime,
                        error: response.ok ? null : 'Configuration incomplète ou méthode non supportée'
                    };
                } else {
                    status.twilio = { status: 'error', responseTime, error: `HTTP ${response.status}` };
                }
            } catch (error) {
                status.twilio = { status: 'error', responseTime: 0, error: error.message };
            }

            setApiStatus(status);
        };

        // État de chargement initial pour éviter les réactualisations
        const [initialLoadComplete, setInitialLoadComplete] = useState(false);
        const [showLoadingScreen, setShowLoadingScreen] = useState(true);

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

        // Pré-chargement de la watchlist pour Dan's Watchlist
        const preloadWatchlist = async () => {
            console.log('📊 Pré-chargement de Dan\'s Watchlist...');
            try {
                const res = await fetch('/api/supabase-watchlist');
                if (!res.ok) {
                    console.warn(`⚠️ Watchlist API error: ${res.status}`);
                    return;
                }
                const json = await res.json();
                const tickers = Array.isArray(json.tickers) ? json.tickers : [];

                // Cache dans localStorage pour accès rapide par DansWatchlistTab
                localStorage.setItem('dans-watchlist', JSON.stringify(tickers));
                console.log(`✅ ${tickers.length} tickers de watchlist pré-chargés`);
            } catch (error) {
                console.error('❌ Erreur pré-chargement watchlist:', error);
            }
        };

        // Chargement initial UNE SEULE FOIS au démarrage avec écran de chargement
        // Charger les informations utilisateur GitHub
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

        // Charger les news par ticker quand les tickers changent ET que les news générales sont disponibles
        useEffect(() => {
            if (tickers.length > 0 && Object.keys(stockData).length > 0 && newsData.length > 0) {
                console.log('📰 Chargement des news pour les tickers disponibles (news générales prêtes)...');
                fetchLatestNewsForTickers().catch(err => {
                    console.error('Erreur chargement news par ticker:', err);
                });
            }
        }, [tickers.length, newsData.length]); // Se déclenche quand le nombre de tickers change OU quand les news générales sont chargées

        // Charger automatiquement les données de stocks dès que les tickers sont disponibles
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

        // Intro Emma: première visite de session (séparé du chargement)
        useEffect(() => {
            if (activeTab === 'ask-emma' && !sessionStorage.getItem('emma-intro-shown')) {
                setShowEmmaIntro(true);
                sessionStorage.setItem('emma-intro-shown', '1');
                setTimeout(() => setShowEmmaIntro(false), 3000);
            }
        }, [activeTab]); // Se déclenche seulement au changement d'onglet

        // Chargement automatique des tickers et nouvelles (en arrière-plan, même si l'onglet n'est pas actif)
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

        // Rafraîchir les données tickers lors de la navigation si elles sont anciennes
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

        // Charger les données de stocks une fois que les tickers sont disponibles (méthode batch optimisée)
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

        // Chargement automatique du calendrier économique à l'ouverture de l'onglet
        // OBSOLÈTE: EconomicCalendarTab gère maintenant son propre chargement de données
        // useEffect(() => {
        //     if (activeTab === 'economic-calendar' && economicCalendarData.length === 0) {
        //         fetchEconomicCalendar();
        //     }
        // }, [activeTab]);

        // (Code Emma supprimé - déjà géré plus haut)

        // Effet ripple générique pour les boutons
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
        // Utilisation d'icônes Iconoir vérifiées et disponibles
        const getTabIcon = (tabId) => {
            const iconMap = {
                'stocks-news': 'iconoir-briefcase', // Portefeuille pour Titres & Nouvelles
                'intellistocks': 'iconoir-flask', // Laboratoire pour JLab™
                'ask-emma': 'iconoir-chat-bubble', // ✅ Icône valide
                'finance-pro': 'iconoir-calculator', // Calculatrice pour Finance Pro
                'plus': 'iconoir-menu', // Menu pour Plus
                'admin-jsla': 'iconoir-settings', // ✅ Icône valide
                'dans-watchlist': 'iconoir-star', // ✅ Icône valide
                'scrapping-sa': 'iconoir-search', // ✅ Icône valide
                'seeking-alpha': 'iconoir-graph-up', // ✅ Icône valide
                'email-briefings': 'iconoir-antenna-signal', // ✅ Icône valide
                'economic-calendar': 'iconoir-calendar', // ✅ Icône valide
                'investing-calendar': 'iconoir-calendar', // Calendrier pour Investing Calendar
                'yield-curve': 'iconoir-graph-up', // Graphique pour Yield Curve
                'markets-economy': 'iconoir-globe', // ✅ Icône valide
                'emma-config': 'iconoir-settings' // Page de configuration Emma
            };
}}