/**
 * FullModularDashboard.js
 * Le "God Mode" du layout : Tout est un widget modifiable.
 * Transforme l'intégralité du viewport en une grille RGL.
 */

(function() {
    'use strict';

    const { useState, useEffect, useMemo } = React;

    // ===================================
    // CONFIGURATION GLOBALE
    // ===================================
    const STORAGE_KEY = 'gob_full_modular_v1';
    const ROW_HEIGHT = 40; // Hauteur plus fine pour précision

    // Layout par défaut : "Classique" mais déstructuré
    const DEFAULT_LAYOUT = [
        // 1. La Barre du Haut (Header)
        { i: 'header-bar', x: 0, y: 0, w: 12, h: 2, static: false }, 
        
        // 2. La Navigation (Menu) - Par défaut à gauche (Sidebar style)
        { i: 'nav-bar', x: 0, y: 2, w: 2, h: 14, minW: 1, minH: 4 },
        
        // 3. Le Contenu Principal (La "Page")
        { i: 'main-viewport', x: 2, y: 2, w: 8, h: 14, minW: 4, minH: 6 },
        
        // 4. Widget Assistant (Emma)
        { i: 'emma-widget', x: 10, y: 2, w: 2, h: 8, minW: 2, minH: 3 },
        
        // 5. Widget "Quick Actions" (Boutons rapides)
        { i: 'quick-actions', x: 10, y: 10, w: 2, h: 6, minW: 1, minH: 2 }
    ];

    // ===================================
    // COMPOSANTS "ATOMIC" (Briques de base)
    // ===================================

    const HeaderWidget = ({ isDarkMode }) => (
        <div className={`h-full w-full flex items-center justify-between px-6 shadow-md ${isDarkMode ? 'bg-neutral-900/90 backdrop-blur border-b border-neutral-700' : 'bg-white/90 backdrop-blur border-b border-gray-200'} rounded-xl`}>
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">G</div>
                <h1 className={`font-bold text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>GOB Terminal</h1>
            </div>
            <div className={`text-xs px-2 py-1 rounded bg-red-500/20 text-red-500 border border-red-500/30`}>
                🔴 MODE CANVAS (EXPERIMENTAL)
            </div>
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200/20"></div> {/* Avatar Placeholder */}
            </div>
        </div>
    );

    const NavBarWidget = ({ isDarkMode, activeTab, onTabChange }) => {
        const tabs = [
            { id: 'home', icon: 'Home', label: 'Accueil' },
            { id: 'markets', icon: 'Globe', label: 'Marchés' },
            { id: 'portfolio', icon: 'Wallet', label: 'Portfolio' },
            { id: 'terminal', icon: 'Monitor', label: 'JLab' },
            { id: 'ai', icon: 'Brain', label: 'Emma IA' },
            { id: 'settings', icon: 'Settings', label: 'Réglages' }
        ];

        return (
            <div className={`h-full w-full flex flex-col p-2 gap-2 overflow-y-auto rounded-xl shadow-inner ${isDarkMode ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                {tabs.map(t => (
                    <button 
                        key={t.id}
                        onClick={() => onTabChange(t.id)}
                        className={`flex items-center p-3 rounded-lg transition-all ${
                            activeTab === t.id 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                            : isDarkMode ? 'text-gray-400 hover:bg-neutral-700 hover:text-white' : 'text-gray-600 hover:bg-white hover:text-gray-900'
                        }`}
                    >
                         <window.LucideIcon name={t.icon} className="w-5 h-5" />
                         <span className="ml-3 font-medium hidden md:block">{t.label}</span>
                    </button>
                ))}
            </div>
        );
    };

    const MainViewportWidget = ({ isDarkMode, activeTab }) => (
        <div className={`h-full w-full rounded-xl p-6 shadow-xl overflow-hidden relative ${isDarkMode ? 'bg-neutral-900 border border-neutral-700' : 'bg-white border border-gray-200'}`}>
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
             
             {/* HEADER INTERNE */}
             <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2 capitalize">{activeTab} View</h2>
                <p className="opacity-60">Ceci est votre espace de travail principal. Redimensionnez-moi !</p>
             </div>

             {/* CONTENU SIMULÉ */}
             <div className={`w-full h-[300px] rounded-lg border-2 border-dashed flex items-center justify-center ${isDarkMode ? 'border-neutral-700 bg-neutral-800/50' : 'border-gray-200 bg-gray-50'}`}>
                <span className="opacity-50">Le contenu de l'onglet "{activeTab}" s'affichera ici</span>
             </div>
        </div>
    );

    const EmmaWidget = ({ isDarkMode }) => (
        <div className={`h-full w-full rounded-xl p-4 flex flex-col shadow-lg border ${isDarkMode ? 'bg-indigo-900/20 border-indigo-500/30 backdrop-blur' : 'bg-indigo-50 border-indigo-200'}`}>
            <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="font-bold text-indigo-400">Emma AI</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3">
                <div className={`p-2 rounded-lg text-xs ${isDarkMode ? 'bg-neutral-800' : 'bg-white'}`}>
                    Bonjour ! Je suis détachée dans mon propre widget flottant maintenant ! 🚀
                </div>
            </div>
            <div className="mt-2">
                <input type="text" placeholder="Posez une question..." className="w-full text-xs p-2 rounded bg-transparent border border-indigo-500/30" />
            </div>
        </div>
    );

    // ===================================
    // MAIN COMPONENT
    // ===================================
    const FullModularDashboard = () => {
        const [isDarkMode, setIsDarkMode] = useState(true);
        const [showGrid, setShowGrid] = useState(true); // Grille visible pour aider au placement
        const [layouts, setLayouts] = useState(() => {
            try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || DEFAULT_LAYOUT; } 
            catch { return DEFAULT_LAYOUT; }
        });
        const [activeTab, setActiveTab] = useState('home');

        // Initialisation RGL
        const RGL = window.ReactGridLayout;
        const ResponsiveGridLayout = useMemo(() => RGL && RGL.WidthProvider && RGL.Responsive ? RGL.WidthProvider(RGL.Responsive) : null, [RGL]);

        const onLayoutChange = (layout) => {
            setLayouts(layout);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
        };

        const resetLayout = () => {
            if(confirm('Réinitialiser le bureau ?')) {
                setLayouts(DEFAULT_LAYOUT);
                localStorage.removeItem(STORAGE_KEY);
            }
        };

        if(!ResponsiveGridLayout) return <div>Chargement du Core...</div>;

        return (
            <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-black text-white' : 'bg-slate-50 text-gray-900'}`}>
                
                {/* GLOBAL TOOLBAR (The only fixed thing, initially) */}
                <div className="fixed bottom-4 right-4 z-50 flex gap-2">
                    <button onClick={resetLayout} className="p-3 rounded-full bg-red-500 text-white shadow-lg hover:scale-110 transition-transform">
                        <window.LucideIcon name="RefreshCw" className="w-5 h-5" />
                    </button>
                    <button onClick={() => setShowGrid(!showGrid)} className="p-3 rounded-full bg-blue-500 text-white shadow-lg hover:scale-110 transition-transform">
                         <window.LucideIcon name="Grid" className="w-5 h-5" />
                    </button>
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 rounded-full bg-neutral-700 text-white shadow-lg hover:scale-110 transition-transform">
                         <window.LucideIcon name={isDarkMode ? 'Sun' : 'Moon'} className="w-5 h-5" />
                    </button>
                </div>

                {/* THE CANVAS */}
                <ResponsiveGridLayout
                    className={`layout ${showGrid ? 'show-grid-lines' : ''}`}
                    layouts={{ lg: layouts }}
                    breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                    cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                    rowHeight={ROW_HEIGHT}
                    onLayoutChange={(l) => onLayoutChange(l)}
                    isDraggable={true} // TOUT EST DRAGGABLE PAR DÉFAUT
                    isResizable={true} // TOUT EST RESIZABLE
                    margin={[10, 10]}
                >
                    {/* 1. Header Widget */}
                    <div key="header-bar" className="cursor-move">
                        <HeaderWidget isDarkMode={isDarkMode} />
                    </div>

                    {/* 2. Nav Widget */}
                    <div key="nav-bar">
                        <NavBarWidget isDarkMode={isDarkMode} activeTab={activeTab} onTabChange={setActiveTab} />
                    </div>

                    {/* 3. Main Viewport */}
                    <div key="main-viewport">
                        <MainViewportWidget isDarkMode={isDarkMode} activeTab={activeTab} />
                    </div>

                    {/* 4. Emma AI */}
                    <div key="emma-widget">
                        <EmmaWidget isDarkMode={isDarkMode} />
                    </div>

                    {/* 5. Quick Actions */}
                    <div key="quick-actions" className={`rounded-xl p-4 flex flex-col gap-2 ${isDarkMode ? 'bg-neutral-800' : 'bg-white'} shadow-md border border-dashed border-gray-500/30`}>
                        <h4 className="font-bold text-xs uppercase opacity-50 mb-2">Raccourcis</h4>
                        <button className="bg-emerald-500/20 text-emerald-500 p-2 rounded text-xs font-bold hover:bg-emerald-500/30">Achats Rapides</button>
                        <button className="bg-blue-500/20 text-blue-500 p-2 rounded text-xs font-bold hover:bg-blue-500/30">Scanner Marché</button>
                        <button className="bg-purple-500/20 text-purple-500 p-2 rounded text-xs font-bold hover:bg-purple-500/30">Nouveau Rapport</button>
                    </div>

                </ResponsiveGridLayout>

                <style>{`
                    .show-grid-lines {
                        background-size: 40px 40px;
                        background-image: linear-gradient(to right, ${isDarkMode ? '#333' : '#e5e5e5'} 1px, transparent 1px),
                                          linear-gradient(to bottom, ${isDarkMode ? '#333' : '#e5e5e5'} 1px, transparent 1px);
                    }
                    .react-grid-placeholder {
                        background: ${isDarkMode ? 'rgba(255,255,255,0.1) !important' : 'rgba(0,0,0,0.1) !important'};
                        border-radius: 12px;
                    }
                `}</style>
            </div>
        );
    };

    window.FullModularDashboard = FullModularDashboard;
})();
