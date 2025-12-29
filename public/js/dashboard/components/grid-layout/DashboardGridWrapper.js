/**
 * DashboardGridWrapper.js
 * 
 * Transforme le dashboard principal en système de grid layout modulaire (God Mode)
 * Convertit tous les tabs en widgets configurables et redimensionnables
 */

(function() {
    'use strict';

    const { useState, useEffect, useMemo, useCallback } = React;

    // ===================================
    // CONSTANTES & CONFIGURATION
    // ===================================
    const STORAGE_KEY_DEFAULT = 'gob_dashboard_layout_default_v1';
    const STORAGE_KEY_DEV = 'gob_dashboard_layout_dev_v1';
    // Fallback key for auto-save if needed, though we primarily use the above two now
    const STORAGE_KEY_CURRENT = 'gob_dashboard_grid_layout_v1'; 
    const ROW_HEIGHT = 50;

    // Cache to prevent log spam for missing components
    const _loggedMissingComponents = {};

    // Flag to prevent ResponsiveGridLayout error spam (logs only once)
    let _loggedRGLError = false;


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
        'tests-calendar': { component: 'MarketsEconomyTab', label: 'Calendrier', icon: 'Calendar', defaultSize: { w: 12, h: 10 }, minSize: { w: 6, h: 6 } },
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

    // Helper to load specialized presets
    const loadSavedPreset = (key) => {
        try {
            const saved = localStorage.getItem(key);
            if (saved) return JSON.parse(saved);
        } catch(e) { console.error('Error loading preset', key, e); }
        return null;
    };

    // Preset layout templates
    const LAYOUT_PRESETS = {
        default: loadSavedPreset(STORAGE_KEY_DEFAULT) || getDefaultLayout(),
        developer: loadSavedPreset(STORAGE_KEY_DEV) || [
            // Developer preset: admin tools and testing
            { i: 'admin-jsla', x: 0, y: 0, w: 12, h: 12, minW: 8, minH: 8 },
            { i: 'tests-rgl', x: 0, y: 12, w: 6, h: 10, minW: 6, minH: 6 },
            { i: 'emma-terminal', x: 6, y: 12, w: 6, h: 10, minW: 6, minH: 6 },
        ],
        trading: [
            // Trading preset: focus on markets and portfolio
            { i: 'titres-portfolio', x: 0, y: 0, w: 8, h: 12, minW: 6, minH: 8 },
            { i: 'marches-global', x: 8, y: 0, w: 4, h: 12, minW: 4, minH: 6 },
            { i: 'marches-yield', x: 0, y: 12, w: 6, h: 10, minW: 6, minH: 6 },
            { i: 'marches-calendar', x: 6, y: 12, w: 6, h: 10, minW: 6, minH: 6 },
        ],
        research: [
            // Research preset: news, analysis and AI
            { i: 'titres-seeking', x: 0, y: 0, w: 6, h: 12, minW: 6, minH: 8 },
            { i: 'emma-chat', x: 6, y: 0, w: 6, h: 12, minW: 4, minH: 8 },
            { i: 'jlab-terminal', x: 0, y: 12, w: 12, h: 14, minW: 8, minH: 10 },
        ],
        minimal: [
            // Minimal preset: just the essentials
            { i: 'titres-portfolio', x: 0, y: 0, w: 12, h: 14, minW: 8, minH: 8 },
            { i: 'emma-chat', x: 0, y: 14, w: 12, h: 10, minW: 4, minH: 8 },
        ]
    };

    // ===================================
    // COMPOSANT PRINCIPAL
    // ===================================
    
// Simple Error Boundary for individual widgets
class WidgetErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error("Widget Error:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="h-full flex flex-col items-center justify-center p-4 bg-red-900/10 border border-red-500/30 rounded-lg">
                    <span className="text-red-500 text-6xl mb-2">⚠️</span>
                    <h3 className="text-red-500 font-bold">Erreur Widget</h3>
                    <p className="text-xs text-red-400 text-center mt-2">{this.state.error?.message || "Erreur inconnue"}</p>
                    <button 
                        onClick={() => this.setState({ hasError: false })}
                        className="mt-4 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                    >
                        Réessayer
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

// Missing Component Card - displayed when a component is not found
const MissingComponentCard = ({ componentName, isDarkMode }) => (
    <div className={`h-full flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed ${
        isDarkMode 
            ? 'bg-neutral-900/50 border-amber-500/30 text-amber-400' 
            : 'bg-amber-50 border-amber-300 text-amber-700'
    }`}>
        <span className="text-4xl mb-3">⚠️</span>
        <h3 className="font-bold text-lg mb-2">Module non chargé</h3>
        <p className="text-sm text-center opacity-75 mb-3">{componentName || 'Composant inconnu'}</p>
        <p className="text-xs text-center opacity-50">
            Vérifiez que le script est chargé dans beta-combined-dashboard.html
        </p>
    </div>
);


const DashboardGridWrapper = ({
        mainTab = "titres",
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
        showCommandsHelp = false,
        setShowCommandsHelp = () => {},
        showSlashSuggestions = false,
        setShowSlashSuggestions = () => {},
        slashSuggestions = [],
        setSlashSuggestions = () => {},
        selectedSuggestionIndex = -1,
        setSelectedSuggestionIndex = () => {},
        secondaryNavConfig = {},
        setSecondaryNavConfig = () => {},
        primaryNavConfig = {},
        setPrimaryNavConfig = () => {},
        isProfessionalMode = false,
        apiStatus = {},
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
        summarizeWithEmma = () => {},
        isFrenchArticle = () => false,
        getNewsIcon = () => ({ icon: 'Newspaper', color: 'text-gray-500' }),
        getSourceCredibility = () => 50,
        Icon = null,
        MASTER_NAV_LINKS = [],
        allTabs = []
    }) => {
        const [layout, setLayout] = useState(() => {
            // Load current working layout or default
            try {
                const saved = localStorage.getItem(STORAGE_KEY_CURRENT);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    let validLayout = parsed.filter(item => TAB_TO_WIDGET_MAP[item.i]);
                    // Clean duplicates
                    const seen = new Set();
                    validLayout = validLayout.filter(item => {
                        if (seen.has(item.i)) return false;
                        seen.add(item.i);
                        return true;
                    });
                     if (validLayout.length > 0) return validLayout;
                }
            } catch (e) { console.error('❌ Erreur chargement layout:', e); }
            
            // Fallback to Saved Default or Hardcoded Default
            return loadSavedPreset(STORAGE_KEY_DEFAULT) || getDefaultLayout();
        });

        // S'assurer que le layout n'est jamais vide et sans doublons
        useEffect(() => {
            if (!layout || layout.length === 0) {
                console.warn('⚠️ Layout vide détecté, recréation du layout par défaut');
                const defaultLayout = loadSavedPreset(STORAGE_KEY_DEFAULT) || getDefaultLayout();
                setLayout(defaultLayout);
            } else {
                // Vérification post-render des doublons
                const seen = new Set();
                const uniqueLayout = layout.filter(item => {
                    if (seen.has(item.i)) return false;
                    seen.add(item.i);
                    return true;
                });
                
                if (uniqueLayout.length !== layout.length) {
                    console.warn(`⚠️ Doublons détectés et supprimés (${layout.length} -> ${uniqueLayout.length})`);
                    setLayout(uniqueLayout);
                    // Update storage immediately
                    localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(uniqueLayout));
                }
            }
        }, [layout]);

        // Synchroniser le layout avec mainTab : ajouter les widgets par défaut si nécessaire
        useEffect(() => {
            if (!mainTab) {
                console.log('[DashboardGridWrapper] ⏸️ Synchronisation layout/mainTab ignorée: mainTab vide');
                return;
            }
            
            // Utiliser la fonction setLayout avec une fonction pour éviter les dépendances
            setLayout(currentLayout => {
                if (!currentLayout || currentLayout.length === 0) {
                    console.log('[DashboardGridWrapper] ⏸️ Layout vide, synchronisation ignorée');
                    return currentLayout;
                }
                
                // Obtenir les IDs des widgets pour le mainTab actuel
                const prefixMap = {
                    'admin': 'admin-',
                    'marches': 'marches-',
                    'titres': 'titres-',
                    'jlab': 'jlab-',
                    'emma': 'emma-',
                    'tests': 'tests-'
                };
                const prefix = prefixMap[mainTab];
                const validIds = prefix 
                    ? Object.keys(TAB_TO_WIDGET_MAP).filter(k => k.startsWith(prefix))
                    : Object.keys(TAB_TO_WIDGET_MAP);
                
                const existingIds = currentLayout.filter(item => validIds.includes(item.i)).map(item => item.i);
                
                console.log('[DashboardGridWrapper] 🔍 Synchronisation layout/mainTab:', { 
                    mainTab, 
                    validIdsCount: validIds.length, 
                    validIds: validIds.slice(0, 3),
                    existingIdsCount: existingIds.length,
                    existingIds: existingIds.slice(0, 3),
                    currentLayoutLength: currentLayout.length
                });
                
                // Si aucun widget du mainTab n'existe dans le layout, ajouter les widgets par défaut
                if (existingIds.length === 0 && validIds.length > 0) {
                    console.log('[DashboardGridWrapper] ➕ Ajout des widgets par défaut pour mainTab:', mainTab);
                    const newItems = validIds.map((id, idx) => {
                        const config = TAB_TO_WIDGET_MAP[id] || {};
                        const defaultSize = config.defaultSize || { w: 6, h: 8 };
                        const minSize = config.minSize || { w: 4, h: 6 };
                        return {
                            i: id,
                            x: (idx % 2) * 6,
                            y: Math.floor(idx / 2) * 8,
                            w: defaultSize.w,
                            h: defaultSize.h,
                            minW: minSize.w,
                            minH: minSize.h
                        };
                    });
                    
                    // Ajouter les nouveaux widgets au layout existant (garder les autres widgets)
                    const updatedLayout = [...currentLayout, ...newItems];
                    localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(updatedLayout));
                    console.log('[DashboardGridWrapper] ✅ Layout mis à jour avec', newItems.length, 'nouveaux widgets');
                    return updatedLayout;
                }
                
                return currentLayout;
            });
        }, [mainTab]); // Ne dépendre que de mainTab pour éviter les boucles infinies

        const [isEditing, setIsEditing] = useState(false);
        const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');

        const RGL = window.ReactGridLayout;

        // Try basic ReactGridLayout first, with WidthProvider for auto-width
        const ResponsiveGridLayout = useMemo(() => {
            if (!RGL) return null;
            // Use Responsive with WidthProvider if available
            if (RGL.WidthProvider && RGL.Responsive) {
                return RGL.WidthProvider(RGL.Responsive);
            }
            // Fallback to basic GridLayout with WidthProvider
            if (RGL.WidthProvider && RGL.default) {
                return RGL.WidthProvider(RGL.default);
            }
            return null;
        }, [RGL]);

        // Sauvegarder le layout courant
        const handleLayoutChange = useCallback((newLayout) => {
            if (isEditing) {
                setLayout(newLayout);
                localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(newLayout));
            }
        }, [isEditing]);
        
        // Save current layout as a specific preset
        const saveAsPreset = useCallback((presetName) => {
             const key = presetName === 'default' ? STORAGE_KEY_DEFAULT : 
                        presetName === 'developer' ? STORAGE_KEY_DEV : null;
                        
             if (key) {
                 localStorage.setItem(key, JSON.stringify(layout));
                 if (window.showToast) window.showToast(`Layout sauvegardé comme "${presetName === 'default' ? 'Production' : 'Développeur'}"`, 'success');
                 else alert(`Layout sauvegardé comme "${presetName === 'default' ? 'Production' : 'Développeur'}"`);
             }
        }, [layout]);

        // Ajouter un widget
        const addWidget = useCallback((tabId) => {
            const config = TAB_TO_WIDGET_MAP[tabId];
            if (!config) return;

            // Vérifier si le widget existe déjà
            if (layout.some(item => item.i === tabId)) {
                return; // Widget already exists
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

        // Reset layout to Default Preset (Production)
        const resetLayout = useCallback(() => {
            const defaultLayout = loadSavedPreset(STORAGE_KEY_DEFAULT) || getDefaultLayout();
            setLayout(defaultLayout);
            localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(defaultLayout));
        }, []);

        // Load preset layout
        const loadPreset = useCallback((presetName) => {
             // Reload from storage to get latest
             let preset = null;
             if (presetName === 'default') preset = loadSavedPreset(STORAGE_KEY_DEFAULT) || getDefaultLayout();
             else if (presetName === 'developer') preset = loadSavedPreset(STORAGE_KEY_DEV) || LAYOUT_PRESETS.developer;
             else preset = LAYOUT_PRESETS[presetName];

            if (preset) {
                setLayout(preset);
                localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(preset));
            }
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

            // Fallback: essayer avec 'Tab' suffix
            if (!Component) {
                Component = window[config.component + 'Tab'];
            }

            // Fallback spécifique pour JLab
            if (!Component && config.component === 'JLabUnifiedTab') {
                Component = window.JLabTab;
            }

            // Fallback registry pour composants renommés ou fusionnés
            if (!Component) {
                const FALLBACK_REGISTRY = {
                    'EmmaConfigTab': window.AdminJSLaiTab,
                    'EmailBriefingsTab': window.AdminJSLaiTab,
                    'YieldCurveTab': window.MarketsEconomyTab,
                    'NouvellesTab': window.StocksNewsTab,
                    'DansWatchlistTab': window.StocksNewsTab,
                    'InvestingCalendarTab': window.MarketsEconomyTab,
                    'EconomicCalendarTab': window.EconomicCalendarTab,
                    'AdvancedAnalysisTab': window.JLabTab,
                    'VoiceAssistantTab': window.AskEmmaTab
                };
                Component = FALLBACK_REGISTRY[config.component];
            }

            if (!Component) {
                // Only log once per component to avoid spam
                if (!_loggedMissingComponents[config.component]) {
                    _loggedMissingComponents[config.component] = true;
                    console.warn('[MissingComponent]', { 
                        key: item.i, 
                        component: config.component,
                        availableComponents: Object.keys(window).filter(k => 
                            k.endsWith('Tab') || k.includes('Dashboard') || k.includes('Widget')
                        ).slice(0, 20)
                    });
                }
                return <MissingComponentCard componentName={config.component} isDarkMode={isDarkMode} />;
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
                    apiStatus,
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
                    setShowLengthEditor,
                    showCommandsHelp,
                    setShowCommandsHelp,
                    showSlashSuggestions,
                    setShowSlashSuggestions,
                    slashSuggestions,
                    setSlashSuggestions,
                    selectedSuggestionIndex,
                    setSelectedSuggestionIndex
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
            } else if (config.component === 'MarketsEconomyTab') {
                Object.assign(componentProps, {
                    isDarkMode,
                    newsData,
                    loading,
                    lastUpdate,
                    fetchNews,
                    summarizeWithEmma,
                    isFrenchArticle,
                    getNewsIcon,
                    getSourceCredibility,
                    cleanText
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
                        <WidgetErrorBoundary>
                            {React.createElement(Component, { ...commonProps, ...componentProps })}
                        </WidgetErrorBoundary>
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

        
    // ===================================
    // FILTERED LAYOUT BY MAIN TAB
    // ===================================
    
    // Get the relevant widget IDs for the current main tab
    const getWidgetIdsForMainTab = (tab) => {
        const prefixMap = {
            'admin': 'admin-',
            'marches': 'marches-',
            'titres': 'titres-',
            'jlab': 'jlab-',
            'emma': 'emma-',
            'tests': 'tests-'
        };
        const prefix = prefixMap[tab];
        if (!prefix) return Object.keys(TAB_TO_WIDGET_MAP);
        return Object.keys(TAB_TO_WIDGET_MAP).filter(k => k.startsWith(prefix));
    };
    
    
    // Generate responsive layouts for different screen sizes
    const generateResponsiveLayouts = (baseLayout) => {
        const layouts = {
            lg: baseLayout,
            md: baseLayout.map(item => ({ ...item, w: Math.min(item.w, 10) })),
            sm: baseLayout.map(item => ({ ...item, x: 0, w: 6 })),
            xs: baseLayout.map(item => ({ ...item, x: 0, w: 4 })),
            xxs: baseLayout.map(item => ({ ...item, x: 0, w: 2 }))
        };
        return layouts;
    };

    // Filter layout to only show widgets for current main tab
    const filteredLayout = useMemo(() => {
        const validIds = getWidgetIdsForMainTab(mainTab);
        const existing = layout.filter(item => validIds.includes(item.i));
        
        // If no widgets match, generate default grid for this tab
        if (existing.length === 0) {
            const widgets = validIds;
            return widgets.map((id, idx) => {
                const config = TAB_TO_WIDGET_MAP[id] || {};
                const defaultSize = config.defaultSize || { w: 6, h: 8 };
                const minSize = config.minSize || { w: 4, h: 6 };
                return {
                    i: id,
                    x: (idx % 2) * 6,
                    y: Math.floor(idx / 2) * 8,
                    w: defaultSize.w,
                    h: defaultSize.h,
                    minW: minSize.w,
                    minH: minSize.h
                };
            });
        }
        return existing;
    }, [layout, mainTab]);

        // ⚠️ IMPORTANT: All hooks must be called before any early returns (React Rules of Hooks)
        // Log only on initial mount for performance
        useEffect(() => {
            if (ResponsiveGridLayout) {
                console.log('🔍 DashboardGridWrapper - Montage initial:', {
                    layoutLength: layout?.length || 0,
                    ResponsiveGridLayoutAvailable: true
                });
            }
        }, []); // eslint-disable-line react-hooks/exhaustive-deps

        // Early return for loading state (after all hooks)
        if (!ResponsiveGridLayout) {
            // Only log once to prevent console spam
            if (!_loggedRGLError) {
                _loggedRGLError = true;
                console.error('❌ ResponsiveGridLayout non disponible');
            }
            return (
                <div className={`p-6 ${isDarkMode ? 'bg-neutral-900' : 'bg-gray-100'}`}>
                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                        <p className="font-medium">⚠️ React-Grid-Layout en cours de chargement...</p>
                        <p className="text-sm mt-1">Vérifiez que le CDN est chargé dans beta-combined-dashboard.html</p>
                    </div>
                </div>
            );
        }

        return (
            <div className={`min-h-screen ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
                {/* Barre de contrôle */}
                <div className={`sticky top-0 z-40 flex items-center justify-between p-4 border-b ${isDarkMode ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-gray-200'}`}>
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
                        {isAdmin && isEditing && (
                            <>
                                <div className="flex items-center gap-1 mr-2 px-2 border-r border-gray-500/30">
                                    <button
                                        onClick={() => saveAsPreset('default')}
                                        className={`px-3 py-1.5 rounded-md font-medium text-xs flex items-center gap-1.5 shadow-sm transition-all ${
                                            isDarkMode 
                                                ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                                        }`}
                                        title="Sauvegarder comme layout de Production (Par défaut)"
                                    >
                                        <window.LucideIcon name="Save" className="w-3.5 h-3.5" />
                                        Sauv. Prod
                                    </button>
                                    <button
                                        onClick={() => saveAsPreset('developer')}
                                        className={`px-3 py-1.5 rounded-md font-medium text-xs flex items-center gap-1.5 shadow-sm transition-all ${
                                            isDarkMode 
                                                ? 'bg-purple-600 hover:bg-purple-500 text-white' 
                                                : 'bg-purple-500 hover:bg-purple-600 text-white'
                                        }`}
                                        title="Sauvegarder comme layout Développeur"
                                    >
                                        <window.LucideIcon name="Code" className="w-3.5 h-3.5" />
                                        Sauv. Dev
                                    </button>
                                </div>

                                <select
                                    onChange={(e) => {
                                        if (e.target.value) loadPreset(e.target.value);
                                    }}
                                    className={`px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-2 shadow-sm ${
                                        isDarkMode
                                            ? 'bg-neutral-700 text-gray-300 border border-neutral-600'
                                            : 'bg-white text-gray-700 border border-gray-300'
                                    }`}
                                    defaultValue=""
                                >
                                    <option value="" disabled>Charger un preset...</option>
                                    <option value="default">🏠 Production (Défaut)</option>
                                    <option value="developer">👨‍💻 Développeur</option>
                                    <option value="trading">📈 Trading</option>
                                    <option value="research">🔬 Recherche</option>
                                    <option value="minimal">⚡ Minimal</option>
                                </select>
                            </>
                        )}
                        
                        {isAdmin && (
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
                        )}

                        {isAdmin && isEditing && (
                            <button
                                onClick={resetLayout}
                                className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 shadow-sm ${
                                    isDarkMode
                                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                        : 'bg-red-100 text-red-600 hover:bg-red-200'
                                }`}
                                title="Réinitialiser au layout de Production par défaut"
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
                                        localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(defaultLayout));
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
                            layouts={generateResponsiveLayouts(filteredLayout)}
                            breakpoints={BREAKPOINTS}
                            cols={COLS}
                            rowHeight={ROW_HEIGHT}
                            onLayoutChange={handleLayoutChange}
                            onBreakpointChange={setCurrentBreakpoint}
                            isDraggable={isEditing}
                            isResizable={isEditing}
                            compactType="vertical"
                            margin={[16, 16]}
                            resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
                        >
                            {filteredLayout.map(item => (
                                <div key={item.i} className={isEditing ? 'cursor-move ring-2 ring-emerald-500/50' : ''}>
                                    {renderWidget(item)}
                                </div>
                            ))}
                        </ResponsiveGridLayout>
                    )}
                </div>

                {/* Dock pour ajouter des widgets (en mode édition) */}
                {isEditing && (
                    <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-2xl flex gap-4 shadow-2xl z-50 max-w-4xl overflow-x-auto ${isDarkMode ? 'bg-neutral-800/90 backdrop-blur border border-neutral-700' : 'bg-white/90 backdrop-blur border border-gray-200'}`}>
                        {Object.entries(TAB_TO_WIDGET_MAP)
                            .filter(([tabId]) => !filteredLayout.some(item => item.i === tabId) && getWidgetIdsForMainTab(mainTab).includes(tabId))
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

    // Export component to window
    window.DashboardGridWrapper = DashboardGridWrapper;

    console.log('✅ DashboardGridWrapper chargé');
})();
