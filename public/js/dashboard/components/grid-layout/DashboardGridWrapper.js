/**
 * DashboardGridWrapper.js
 * 
 * Transforme le dashboard principal en système de grid layout modulaire (God Mode)
 * Convertit tous les tabs en widgets configurables et redimensionnables
 */

(function() {
    'use strict';

    const { useState, useEffect, useMemo, useCallback, useRef } = React;

    // ===================================
    // CONSTANTES & CONFIGURATION
    // ===================================
    const STORAGE_KEY = 'gob_dashboard_grid_layout_v1';
    const ROW_HEIGHT = 50;
    const COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
    const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };

    // Mapping complet des tabs vers widgets avec tailles par défaut
    const TAB_TO_WIDGET_MAP = {
        // ADMIN
        'admin-config': { component: 'EmmaConfigTab', label: 'Config Emma', icon: 'Settings', defaultSize: { w: 12, h: 10 }, minSize: { w: 6, h: 6 } },
        'admin-settings': { component: 'PlusTab', label: 'Paramètres', icon: 'Cog', defaultSize: { w: 6, h: 8 }, minSize: { w: 4, h: 6 } },
        'admin-briefings': { component: 'EmailBriefingsTab', label: 'Briefings Email', icon: 'Mail', defaultSize: { w: 12, h: 10 }, minSize: { w: 6, h: 6 } },
        'admin-scraping': { component: 'ScrappingSATab', label: 'Scraping SA', icon: 'Scissors', defaultSize: { w: 12, h: 10 }, minSize: { w: 6, h: 6 } },
        'admin-fastgraphs': { component: 'FastGraphsTab', label: 'FastGraphs', icon: 'TrendingUp', defaultSize: { w: 12, h: 10 }, minSize: { w: 6, h: 6 } },
        'admin-jsla': { component: 'AdminJSLaiTab', label: 'Admin JSLAI', icon: 'Shield', defaultSize: { w: 12, h: 12 }, minSize: { w: 8, h: 8 } },
        
        // MARCHÉS
        'marches-global': { component: 'MarketsEconomyTab', label: 'Marchés Globaux', icon: 'Globe', defaultSize: { w: 12, h: 10 }, minSize: { w: 6, h: 6 } },
        'marches-flex': { component: 'MarketsEconomyTabRGL', label: 'Marchés Flex', icon: 'Layout', defaultSize: { w: 12, h: 10 }, minSize: { w: 6, h: 6 } },
        'marches-calendar': { component: 'EconomicCalendarTab', label: 'Calendrier Éco', icon: 'Calendar', defaultSize: { w: 12, h: 10 }, minSize: { w: 6, h: 6 } },
        'marches-yield': { component: 'YieldCurveTab', label: 'Courbe Taux', icon: 'TrendingUp', defaultSize: { w: 12, h: 10 }, minSize: { w: 6, h: 6 } },
        'marches-nouvelles': { component: 'NouvellesTab', label: 'Nouvelles', icon: 'Newspaper', defaultSize: { w: 12, h: 10 }, minSize: { w: 6, h: 6 } },
        
        // TITRES
        'titres-portfolio': { component: 'StocksNewsTab', label: 'Portfolio', icon: 'Briefcase', defaultSize: { w: 12, h: 12 }, minSize: { w: 8, h: 8 } },
        'titres-flex': { component: 'TitresTabRGL', label: 'Titres Flex', icon: 'LayoutDashboard', defaultSize: { w: 12, h: 12 }, minSize: { w: 8, h: 8 } },
        'titres-watchlist': { component: 'DansWatchlistTab', label: 'Watchlist', icon: 'Star', defaultSize: { w: 12, h: 10 }, minSize: { w: 6, h: 6 } },
        'titres-seeking': { component: 'SeekingAlphaTab', label: 'Seeking Alpha', icon: 'Search', defaultSize: { w: 12, h: 12 }, minSize: { w: 8, h: 8 } },
        'titres-3p1': { component: 'redirect', label: 'Finance Pro', icon: 'ChartBar', defaultSize: { w: 12, h: 12 }, minSize: { w: 8, h: 8 }, url: '/3p1' },
        
        // JLAB
        'jlab-terminal': { component: 'JLabUnifiedTab', label: 'Terminal JLab', icon: 'Terminal', defaultSize: { w: 12, h: 14 }, minSize: { w: 8, h: 10 } },
        'jlab-advanced': { component: 'AdvancedAnalysisTab', label: 'Analyse Avancée', icon: 'Flask', defaultSize: { w: 12, h: 12 }, minSize: { w: 8, h: 8 } },
        
        // EMMA IA
        'emma-chat': { component: 'AskEmmaTab', label: 'Chat Emma', icon: 'Brain', defaultSize: { w: 6, h: 10 }, minSize: { w: 4, h: 8 } },
        'emma-vocal': { component: 'VoiceAssistantTab', label: 'Assistant Vocal', icon: 'Mic', defaultSize: { w: 6, h: 8 }, minSize: { w: 4, h: 6 } },
        'emma-group': { component: 'GroupChatTab', label: 'Group Chat', icon: 'Users', defaultSize: { w: 12, h: 10 }, minSize: { w: 6, h: 6 } },
        'emma-terminal': { component: 'TerminalEmmaIATab', label: 'Terminal Emma', icon: 'Monitor', defaultSize: { w: 12, h: 10 }, minSize: { w: 6, h: 6 } },
        'emma-live': { component: 'EmmAIATab', label: 'EmmAIA Live', icon: 'Radio', defaultSize: { w: 12, h: 10 }, minSize: { w: 6, h: 6 } },
        'emma-finvox': { component: 'FinVoxTab', label: 'FinVox', icon: 'Headphones', defaultSize: { w: 12, h: 10 }, minSize: { w: 6, h: 6 } },
        
        // TESTS
        'tests-rgl': { component: 'RglDashboard', label: 'Layout RGL', icon: 'LayoutDashboard', defaultSize: { w: 12, h: 10 }, minSize: { w: 6, h: 6 } },
        'tests-calendar': { component: 'InvestingCalendarTab', label: 'Calendrier', icon: 'Calendar', defaultSize: { w: 12, h: 10 }, minSize: { w: 6, h: 6 } },
    };

    // Layout par défaut basé sur les tabs les plus utilisés
    const getDefaultLayout = (activeTabs = []) => {
        const defaultTabs = activeTabs.length > 0 ? activeTabs : [
            'titres-portfolio',    // Top left - Portfolio widget
            'marches-global',      // Top left below - Markets widget
            'emma-chat',           // Top right - Emma chat
            'jlab-terminal',       // Top right below - JLab Terminal
            'marches-flex',        // Bottom - Markets flexible layout
            'jlab-advanced'        // Bottom - Advanced analysis
        ];

        return [
            // Row 1: Portfolio (full width top)
            { i: 'titres-portfolio', x: 0, y: 0, w: 12, h: 12, minW: 8, minH: 8 },
            // Row 2: Markets Global (left) + Emma Chat (right)
            { i: 'marches-global', x: 0, y: 12, w: 6, h: 10, minW: 6, minH: 6 },
            { i: 'emma-chat', x: 6, y: 12, w: 6, h: 10, minW: 4, minH: 8 },
            // Row 3: JLab Terminal (left) + Markets Flex (right)
            { i: 'jlab-terminal', x: 0, y: 22, w: 6, h: 14, minW: 8, minH: 10 },
            { i: 'marches-flex', x: 6, y: 22, w: 6, h: 10, minW: 6, minH: 6 },
            // Row 4: Advanced Analysis (full width bottom)
            { i: 'jlab-advanced', x: 0, y: 36, w: 12, h: 12, minW: 8, minH: 8 }
        ].filter(item => defaultTabs.includes(item.i));
    };

    // ===================================
    // COMPOSANT PRINCIPAL
    // ===================================
    const DashboardGridWrapper = ({
        isDarkMode = true,
        isAdmin = false,
        activeTab,
        setActiveTab,
        // Tous les props nécessaires pour les composants
        tickers = [],
        stockData = {},
        newsData = [],
        loading = false,
        lastUpdate = null,
        selectedStock = null,
        setSelectedStock = () => {},
        emmaConnected = false,
        setEmmaConnected = () => {},
        emmaPrefillMessage = '',
        setEmmaPrefillMessage = () => {},
        emmaAutoSend = false,
        setEmmaAutoSend = () => {},
        showPromptEditor = false,
        setShowPromptEditor = () => {},
        showTemperatureEditor = false,
        setShowTemperatureEditor = () => {},
        showLengthEditor = false,
        setShowLengthEditor = () => {},
        secondaryNavConfig = {},
        setSecondaryNavConfig = () => {},
        primaryNavConfig = {},
        setPrimaryNavConfig = () => {},
        isProfessionalMode = false,
        // Fonctions
        loadTickersFromSupabase = () => {},
        fetchNews = () => {},
        refreshAllStocks = () => {},
        fetchLatestNewsForTickers = () => {},
        getCompanyLogo = () => '',
        runSeekingAlphaScraper = () => {},
        scrapingStatus = 'idle',
        scrapingLogs = [],
        clearScrapingLogs = () => {},
        generateScrapingScript = () => {},
        addScrapingLog = () => {},
        seekingAlphaData = {},
        seekingAlphaStockData = {},
        analyzeWithClaude = () => {},
        seekingAlphaViewMode = 'list',
        setSeekingAlphaViewMode = () => {},
        openPeersComparison = () => {},
        cleanText = (t) => t,
        getGradeColor = () => '',
        openSeekingAlpha = () => {},
        tabMountKeys = {},
        Icon = null,
        MASTER_NAV_LINKS = [],
        allTabs = []
    }) => {
        const [layout, setLayout] = useState(() => {
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    // Vérifier que le layout contient des widgets valides
                    const validLayout = parsed.filter(item => TAB_TO_WIDGET_MAP[item.i]);
                    if (validLayout.length > 0) {
                        console.log(`✅ Layout chargé depuis localStorage: ${validLayout.length} widgets`);
                        return validLayout;
                    } else {
                        console.warn('⚠️ Layout sauvegardé invalide, utilisation du layout par défaut');
                    }
                }
            } catch (e) {
                console.error('❌ Erreur chargement layout:', e);
            }
            const defaultLayout = getDefaultLayout();
            console.log(`✅ Layout par défaut créé: ${defaultLayout.length} widgets`, defaultLayout);
            // Sauvegarder le layout par défaut
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultLayout));
            } catch (e) {
                console.warn('⚠️ Impossible de sauvegarder le layout par défaut:', e);
            }
            return defaultLayout;
        });

        // S'assurer que le layout n'est jamais vide
        useEffect(() => {
            if (!layout || layout.length === 0) {
                console.warn('⚠️ Layout vide détecté, recréation du layout par défaut');
                const defaultLayout = getDefaultLayout();
                setLayout(defaultLayout);
            }
        }, []);

        const [isEditing, setIsEditing] = useState(false);
        const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');

        const RGL = window.ReactGridLayout;
        const ResponsiveGridLayout = useMemo(() => 
            RGL && RGL.WidthProvider && RGL.Responsive 
                ? RGL.WidthProvider(RGL.Responsive) 
                : null
        , [RGL]);

        // Sauvegarder le layout
        const handleLayoutChange = useCallback((newLayout) => {
            if (isEditing) {
                setLayout(newLayout);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newLayout));
            }
        }, [isEditing]);

        // Ajouter un widget
        const addWidget = useCallback((tabId) => {
            const config = TAB_TO_WIDGET_MAP[tabId];
            if (!config) return;

            // Vérifier si le widget existe déjà
            if (layout.some(item => item.i === tabId)) {
                console.log(`Widget ${tabId} existe déjà`);
                return;
            }

            const newItem = {
                i: tabId,
                x: 0,
                y: Math.max(...layout.map(item => item.y + item.h), 0),
                w: config.defaultSize.w,
                h: config.defaultSize.h,
                minW: config.minSize.w,
                minH: config.minSize.h
            };

            setLayout([...layout, newItem]);
        }, [layout]);

        // Supprimer un widget
        const removeWidget = useCallback((tabId) => {
            setLayout(layout.filter(item => item.i !== tabId));
        }, [layout]);

        // Reset layout
        const resetLayout = useCallback(() => {
            const defaultLayout = getDefaultLayout();
            setLayout(defaultLayout);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultLayout));
        }, []);

        // Rendre un widget
        const renderWidget = useCallback((item) => {
            const config = TAB_TO_WIDGET_MAP[item.i];
            if (!config) {
                return (
                    <div className={`h-full flex items-center justify-center ${isDarkMode ? 'bg-neutral-900' : 'bg-gray-100'}`}>
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Widget inconnu: {item.i}</span>
                    </div>
                );
            }

            // Gérer les redirects
            if (config.component === 'redirect') {
                return (
                    <div className={`h-full flex flex-col items-center justify-center ${isDarkMode ? 'bg-neutral-900' : 'bg-gray-100'}`}>
                        <window.LucideIcon name={config.icon} className={`w-16 h-16 mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{config.label}</h3>
                        <button
                            onClick={() => window.location.href = config.url}
                            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                                isDarkMode 
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                            }`}
                        >
                            Ouvrir {config.label}
                        </button>
                    </div>
                );
            }

            // Récupérer le composant (plusieurs tentatives)
            let Component = window[config.component];
            if (!Component) {
                // Essayer avec 'Tab' suffix
                Component = window[config.component + 'Tab'];
            }
            if (!Component && config.component === 'JLabUnifiedTab') {
                // Fallback pour JLab
                Component = window.JLabTab || window.JLabUnifiedTab;
            }
            if (!Component && config.component === 'StocksNewsTab') {
                // StocksNewsTab peut être défini différemment
                Component = window.StocksNewsTab;
            }
            if (!Component && config.component === 'MarketsEconomyTab') {
                // MarketsEconomyTab peut être défini différemment
                Component = window.MarketsEconomyTab;
            }
            
            if (!Component) {
                console.warn(`⚠️ Composant ${config.component} non trouvé. Tentatives:`, {
                    direct: typeof window[config.component],
                    withTab: typeof window[config.component + 'Tab'],
                    allWindowKeys: Object.keys(window).filter(k => k.includes(config.component.split('Tab')[0]))
                });
                return (
                    <div className={`h-full flex flex-col items-center justify-center p-4 ${isDarkMode ? 'bg-neutral-900' : 'bg-gray-100'}`}>
                        <window.LucideIcon name="AlertTriangle" className={`w-12 h-12 mb-2 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                        <span className={`text-sm text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Composant {config.component} non chargé
                        </span>
                        <span className={`text-xs mt-2 text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            Vérifiez la console pour plus de détails
                        </span>
                    </div>
                );
            }

            // Props communes pour tous les composants
            const commonProps = {
                isDarkMode,
                activeTab: item.i,
                setActiveTab
            };

            // Props spécifiques selon le composant
            const componentProps = {};
            
            if (config.component === 'AskEmmaTab') {
                Object.assign(componentProps, {
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
                });
            } else if (config.component === 'StocksNewsTab' || config.component === 'SeekingAlphaTab') {
                Object.assign(componentProps, {
                    tickers,
                    stockData,
                    newsData,
                    loading,
                    lastUpdate,
                    selectedStock,
                    setSelectedStock,
                    loadTickersFromSupabase,
                    fetchNews,
                    refreshAllStocks,
                    fetchLatestNewsForTickers,
                    getCompanyLogo
                });
            } else if (config.component === 'ScrappingSATab' || config.component === 'SeekingAlphaTab') {
                Object.assign(componentProps, {
                    isDarkMode,
                    runSeekingAlphaScraper,
                    scrapingStatus,
                    scrapingLogs,
                    clearScrapingLogs,
                    generateScrapingScript,
                    addScrapingLog,
                    tickers,
                    Icon,
                    seekingAlphaData,
                    seekingAlphaStockData: config.component === 'SeekingAlphaTab' ? seekingAlphaStockData : undefined,
                    analyzeWithClaude: config.component === 'SeekingAlphaTab' ? analyzeWithClaude : undefined,
                    openPeersComparison: config.component === 'SeekingAlphaTab' ? openPeersComparison : undefined,
                    cleanText: config.component === 'SeekingAlphaTab' ? cleanText : undefined,
                    getGradeColor: config.component === 'SeekingAlphaTab' ? getGradeColor : undefined,
                    openSeekingAlpha: config.component === 'SeekingAlphaTab' ? openSeekingAlpha : undefined,
                    seekingAlphaViewMode: config.component === 'SeekingAlphaTab' ? seekingAlphaViewMode : undefined,
                    setSeekingAlphaViewMode: config.component === 'SeekingAlphaTab' ? setSeekingAlphaViewMode : undefined
                });
            } else if (config.component === 'AdminJSLaiTab') {
                Object.assign(componentProps, {
                    emmaConnected,
                    setEmmaConnected,
                    showPromptEditor,
                    setShowPromptEditor,
                    showTemperatureEditor,
                    setShowTemperatureEditor,
                    showLengthEditor,
                    setShowLengthEditor,
                    isDarkMode,
                    setActiveTab,
                    activeTab: item.i,
                    secondaryNavConfig,
                    setSecondaryNavConfig,
                    availableNavLinks: MASTER_NAV_LINKS,
                    primaryNavConfig,
                    setPrimaryNavConfig,
                    allTabsList: allTabs.map(t => ({ id: t.id, label: t.label, icon: t.icon }))
                });
            } else if (config.component === 'PlusTab') {
                Object.assign(componentProps, {
                    setActiveTab,
                    activeTab: item.i,
                    isDarkMode,
                    isProfessionalMode
                });
            } else if (config.component === 'MarketsEconomyTabRGL' || config.component === 'TitresTabRGL') {
                Object.assign(componentProps, {
                    isDarkMode,
                    isAdmin: isEditing
                });
            } else if (config.component === 'RglDashboard') {
                Object.assign(componentProps, {
                    isDarkMode,
                    isAdmin: isEditing
                });
            } else if (config.component === 'JLabUnifiedTab' || config.component === 'JLabTab') {
                Object.assign(componentProps, {
                    isDarkMode,
                    Icon
                });
            }

            // Wrap component in a widget container with header
            return (
                <div className={`h-full flex flex-col rounded-xl overflow-hidden ${isDarkMode ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-gray-200'} shadow-lg`}>
                    {/* Widget Header */}
                    <div className={`flex items-center justify-between px-4 py-2 border-b ${isDarkMode ? 'border-neutral-800 bg-neutral-800/50' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-center gap-2">
                            <window.LucideIcon name={config.icon} className={`w-4 h-4 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                            <span className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {config.label}
                            </span>
                        </div>
                        {isEditing && (
                            <button
                                onClick={() => removeWidget(item.i)}
                                className={`p-1 rounded hover:bg-red-500/20 transition-colors`}
                                title="Retirer ce widget"
                            >
                                <window.LucideIcon name="X" className="w-4 h-4 text-red-500" />
                            </button>
                        )}
                    </div>
                    {/* Widget Content */}
                    <div className="flex-1 overflow-auto">
                        {React.createElement(Component, { ...commonProps, ...componentProps })}
                    </div>
                </div>
            );
        }, [
            isDarkMode, isEditing, activeTab, setActiveTab,
            tickers, stockData, newsData, loading, lastUpdate, selectedStock, setSelectedStock,
            emmaConnected, setEmmaConnected, emmaPrefillMessage, setEmmaPrefillMessage,
            emmaAutoSend, setEmmaAutoSend, showPromptEditor, setShowPromptEditor,
            showTemperatureEditor, setShowTemperatureEditor, showLengthEditor, setShowLengthEditor,
            secondaryNavConfig, setSecondaryNavConfig, primaryNavConfig, setPrimaryNavConfig,
            isProfessionalMode, loadTickersFromSupabase, fetchNews, refreshAllStocks,
            fetchLatestNewsForTickers, getCompanyLogo, runSeekingAlphaScraper, scrapingStatus,
            scrapingLogs, clearScrapingLogs, generateScrapingScript, addScrapingLog,
            seekingAlphaData, seekingAlphaStockData, analyzeWithClaude, seekingAlphaViewMode,
            setSeekingAlphaViewMode, openPeersComparison, cleanText, getGradeColor,
            openSeekingAlpha, Icon, MASTER_NAV_LINKS, allTabs, layout
        ]);

        if (!ResponsiveGridLayout) {
            console.error('❌ ResponsiveGridLayout non disponible');
            return (
                <div className={`p-6 ${isDarkMode ? 'bg-neutral-900' : 'bg-gray-100'}`}>
                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                        <p className="font-medium">⚠️ React-Grid-Layout en cours de chargement...</p>
                        <p className="text-sm mt-1">Vérifiez que le CDN est chargé dans beta-combined-dashboard.html</p>
                    </div>
                </div>
            );
        }

        // ⚠️ CORRECTION PERFORMANCE: Logs uniquement au montage initial
        useEffect(() => {
            console.log('🔍 DashboardGridWrapper - Montage initial:', {
                layoutLength: layout?.length || 0,
                ResponsiveGridLayoutAvailable: !!ResponsiveGridLayout
            });
        }, []); // eslint-disable-line react-hooks/exhaustive-deps

        // ⚠️ SUPPRIMÉ: console.log dans le render causait des logs excessifs

        return (
            <div className={`min-h-screen ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
                {/* Barre de contrôle */}
                <div className={`sticky top-0 z-50 flex items-center justify-between p-4 border-b ${isDarkMode ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg`}>
                                <window.LucideIcon name="Layout" className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>GOD MODE</h1>
                                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Dashboard Modulaire</span>
                            </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-neutral-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                            BP: {currentBreakpoint}
                        </span>
                        <span className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 ${isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                            <window.LucideIcon name="Grid3x3" className="w-3 h-3" />
                            {layout?.length || 0} widgets
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 shadow-sm ${
                                isEditing
                                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                    : isDarkMode
                                        ? 'bg-neutral-700 text-gray-300 hover:bg-neutral-600'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            <window.LucideIcon name={isEditing ? "Check" : "Edit3"} className="w-4 h-4" />
                            {isEditing ? 'Terminer' : 'Modifier'}
                        </button>
                        {isEditing && (
                            <button
                                onClick={resetLayout}
                                className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 shadow-sm ${
                                    isDarkMode
                                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                        : 'bg-red-100 text-red-600 hover:bg-red-200'
                                }`}
                            >
                                <window.LucideIcon name="RotateCcw" className="w-4 h-4" />
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                {/* Grille */}
                <div className="p-4">
                    {!layout || layout.length === 0 ? (
                        <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-neutral-900' : 'bg-gray-100'}`}>
                            <div className={`p-4 rounded-lg text-center ${isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                                <p className="font-medium mb-2">⏳ Initialisation du layout...</p>
                                <p className="text-sm mb-4">Création des widgets par défaut...</p>
                                <button
                                    onClick={() => {
                                        const defaultLayout = getDefaultLayout();
                                        setLayout(defaultLayout);
                                        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultLayout));
                                    }}
                                    className={`px-4 py-2 rounded-lg font-medium text-sm ${
                                        isDarkMode 
                                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                                            : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                    }`}
                                >
                                    Créer Layout par Défaut
                                </button>
                            </div>
                        </div>
                    ) : (
                        <ResponsiveGridLayout
                            className="layout"
                            layouts={{ lg: layout }}
                            breakpoints={BREAKPOINTS}
                            cols={COLS}
                            rowHeight={ROW_HEIGHT}
                            onLayoutChange={handleLayoutChange}
                            onBreakpointChange={setCurrentBreakpoint}
                            isDraggable={isEditing}
                            isResizable={isEditing}
                            compactType="vertical"
                            margin={[16, 16]}
                        >
                            {layout.map(item => {
                                const config = TAB_TO_WIDGET_MAP[item.i];
                                if (!config) {
                                    console.warn(`⚠️ Widget ${item.i} non trouvé dans TAB_TO_WIDGET_MAP`);
                                    return null;
                                }
                                return (
                                    <div 
                                        key={item.i} 
                                        className={`h-full ${isEditing ? 'cursor-move ring-2 ring-emerald-500/50' : ''}`}
                                        data-widget-id={item.i}
                                        data-widget-label={config.label}
                                    >
                                        {renderWidget(item)}
                                    </div>
                                );
                            })}
                        </ResponsiveGridLayout>
                    )}
                </div>

                {/* Dock pour ajouter des widgets (en mode édition) */}
                {isEditing && (
                    <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-2xl flex gap-4 shadow-2xl z-50 max-w-4xl overflow-x-auto ${isDarkMode ? 'bg-neutral-800/90 backdrop-blur border border-neutral-700' : 'bg-white/90 backdrop-blur border border-gray-200'}`}>
                        {Object.entries(TAB_TO_WIDGET_MAP)
                            .filter(([tabId]) => !layout.some(item => item.i === tabId))
                            .map(([tabId, config]) => (
                                <button
                                    key={tabId}
                                    onClick={() => addWidget(tabId)}
                                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isDarkMode ? 'bg-neutral-700 hover:bg-neutral-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                                    title={config.label}
                                >
                                    <window.LucideIcon name={config.icon} className="w-5 h-5" />
                                    <span className="text-xs">{config.label}</span>
                                </button>
                            ))}
                    </div>
                )}

                {/* Message mode édition */}
                {isEditing && (
                    <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full shadow-lg bg-emerald-500 text-white z-40`}>
                        <span className="text-sm font-medium">🔧 Mode édition - Glissez et redimensionnez les widgets</span>
                    </div>
                )}
            </div>
        );
    };

    window.DashboardGridWrapper = DashboardGridWrapper;
    console.log('✅ DashboardGridWrapper chargé');
    console.log('📊 Layout par défaut:', getDefaultLayout());
    console.log('🧩 Composants disponibles:', Object.keys(TAB_TO_WIDGET_MAP).slice(0, 5), '...');
})();
