/**
 * FullModularDashboard.js (GODLIKE VERSION)
 * 
 * Concept: "Infinite Canvas OS"
 * - Chaque fonctionnalité (Marchés, Portfolio, AI, Terminal) est une fenêtre indépendante.
 * - Multitasking réel : Tout voir en même temps.
 * - Persistance totale de l'état du workspace.
 */

(function() {
    'use strict';

    const { useState, useEffect, useMemo, useCallback } = React;
    const { createRoot } = ReactDOM;

    // ===================================
    // CONSTANTES & CONFIG
    // ===================================
    const STORAGE_KEY = 'gob_godlike_v1';
    const ROW_HEIGHT = 50;

    const WIDGET_TYPES = {
        MARKET: { id: 'market', label: 'Marchés', component: 'MarketsEconomyTabRGL', icon: 'Globe', minW: 4, minH: 6 },
        PORTFOLIO: { id: 'portfolio', label: 'Portfolio', component: 'TitresTabRGL', icon: 'Wallet', minW: 4, minH: 6 },
        TERMINAL: { id: 'terminal', label: 'Terminal JLab', component: 'JLabTab', icon: 'Monitor', minW: 6, minH: 8 },
        AI: { id: 'ai', label: 'Emma AI', component: 'AskEmmaTab', icon: 'Brain', minW: 3, minH: 6 },
        NOTES: { id: 'notes', label: 'Notes Rapides', component: 'NotesWidget', icon: 'FileText', minW: 2, minH: 4 },
        HEADER: { id: 'header', label: 'Barre de Contrôle', component: 'HeaderWidget', icon: 'Layout', minW: 6, minH: 2, static: false }
    };

    // Layout Initial GODLIKE
    const DEFAULT_LAYOUT = [
        { i: 'header-main', type: 'HEADER', x: 0, y: 0, w: 12, h: 2 },
        { i: 'market-1', type: 'MARKET', x: 0, y: 2, w: 6, h: 10 },
        { i: 'portfolio-1', type: 'PORTFOLIO', x: 6, y: 2, w: 6, h: 10 },
        { i: 'ai-1', type: 'AI', x: 9, y: 12, w: 3, h: 8 },
        { i: 'terminal-1', type: 'TERMINAL', x: 0, y: 12, w: 9, h: 8 }
    ];

    // ===================================
    // COMPOSANTS INTERNES
    // ===================================

    // Barre d'ajout de widgets (Dock)
    const Dock = ({ onAddWidget, isDarkMode }) => (
        <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-2xl flex gap-4 shadow-2xl z-50 transition-all hover:scale-105 ${isDarkMode ? 'bg-neutral-800/90 backdrop-blur border border-neutral-700' : 'bg-white/90 backdrop-blur border border-gray-200'}`}>
            {Object.entries(WIDGET_TYPES).filter(([k]) => k !== 'HEADER').map(([key, def]) => (
                <div key={key} className="group relative flex flex-col items-center gap-1">
                    <button 
                        onClick={() => onAddWidget(key)}
                        className={`p-3 rounded-xl transition-all ${isDarkMode ? 'bg-neutral-700 hover:bg-neutral-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                    >
                        <window.LucideIcon name={def.icon} className="w-6 h-6" />
                    </button>
                    <span className="absolute -top-8 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {def.label}
                    </span>
                </div>
            ))}
        </div>
    );

    const HeaderWidget = ({ isDarkMode }) => (
        <div className={`h-full w-full flex items-center justify-between px-6 rounded-xl shadow-lg ${isDarkMode ? 'bg-gradient-to-r from-neutral-900 to-neutral-800 border border-neutral-700' : 'bg-white border border-gray-200'}`}>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/20">
                    <window.LucideIcon name="Cpu" className="w-6 h-6" />
                </div>
                <div>
                    <h1 className={`font-bold text-xl tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>GOD MODE</h1>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className={`text-xs font-mono opacity-60 uppercase`}>System Online</span>
                    </div>
                </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold border ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}>
                WORKSPACE BETA
            </div>
        </div>
    );

    const NotesWidget = ({ isDarkMode }) => (
        <div className={`h-full w-full rounded-xl p-4 flex flex-col ${isDarkMode ? 'bg-yellow-900/10 border border-yellow-700/30' : 'bg-yellow-50 border border-yellow-200'}`}>
            <div className="flex items-center justify-between mb-2">
                <span className={`font-bold text-sm ${isDarkMode ? 'text-yellow-500' : 'text-yellow-700'}`}>Notes Rapides</span>
                <window.LucideIcon name="Save" className="w-4 h-4 opacity-50" />
            </div>
            <textarea className="flex-1 w-full bg-transparent resize-none outline-none text-sm opacity-80" placeholder="Idées de trading..."></textarea>
        </div>
    );

    // Wrapper Fenêtre ("Window Chrome")
    const WindowChrome = ({ children, title, icon, onClose, isDarkMode, isDraggable }) => (
        <div className={`h-full w-full flex flex-col rounded-xl overflow-hidden shadow-2xl transition-shadow hover:shadow-indigo-500/10 ${isDarkMode ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-gray-200'}`}>
            {/* Window Bar */}
            <div className={`h-10 px-4 flex items-center justify-between select-none ${isDraggable ? 'cursor-move' : ''} ${isDarkMode ? 'bg-neutral-800 border-b border-neutral-700' : 'bg-gray-100 border-b border-gray-200'}`}>
                <div className="flex items-center gap-2 opacity-80">
                    <window.LucideIcon name={icon || 'Box'} className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-1 rounded hover:bg-white/10 opacity-50 hover:opacity-100">
                        <window.LucideIcon name="Minus" className="w-3 h-3" />
                    </button>
                    <button className="p-1 rounded hover:bg-white/10 opacity-50 hover:opacity-100">
                        <window.LucideIcon name="Maximize2" className="w-3 h-3" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-1 rounded hover:bg-red-500 hover:text-white opacity-50 hover:opacity-100 transition-colors">
                        <window.LucideIcon name="X" className="w-3 h-3" />
                    </button>
                </div>
            </div>
            {/* Window Content */}
            <div className="flex-1 overflow-auto relative">
                {children}
            </div>
        </div>
    );

    // ===================================
    // MAIN COMPONENT
    // ===================================
    const FullModularDashboard = () => {
        const [isDarkMode, setIsDarkMode] = useState(true);
        const [layout, setLayout] = useState(() => {
            try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || DEFAULT_LAYOUT; } 
            catch (e) { return DEFAULT_LAYOUT; }
        });

        const RGL = window.ReactGridLayout;
        const ResponsiveGridLayout = useMemo(() => RGL && RGL.WidthProvider && RGL.Responsive ? RGL.WidthProvider(RGL.Responsive) : null, [RGL]);

        // Sauvegarde auto
        const onLayoutChange = (newLayout) => {
            // On doit merger les props 'type' des items originaux car RGL ne renvoie que x,y,w,h,i
            const mergedLayout = newLayout.map(item => {
                const original = layout.find(l => l.i === item.i);
                // return { ...item, type: original ? original.type : 'UNKNOWN' };
                return Object.assign({}, item, { type: original ? original.type : 'UNKNOWN' });
            });
            setLayout(mergedLayout);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedLayout));
        };

        const addWidget = (typeKey) => {
            const typeDef = WIDGET_TYPES[typeKey];
            const newId = `${typeDef.id}-${Date.now()}`;
            const newItem = {
                i: newId,
                type: typeKey,
                x: 0,
                y: Infinity, // Put at bottom
                w: typeDef.minW || 4,
                h: typeDef.minH || 6
            };
            const newLayout = [...layout, newItem];
            setLayout(newLayout);
            
            // Notification visuelle (Toast) serait cool ici
        };

        const removeWidget = (id) => {
            const newLayout = layout.filter(item => item.i !== id);
            setLayout(newLayout);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newLayout));
        };

        const renderWidgetContent = (item) => {
            if (item.type === 'HEADER') return <HeaderWidget isDarkMode={isDarkMode} />;
            if (item.type === 'NOTES') return <NotesWidget isDarkMode={isDarkMode} />;

            const def = WIDGET_TYPES[item.type];
            // Safe dynamic rendering
            const Component = window[def.component];
            
            if (!Component) {
                return (
                    <div className="h-full flex flex-col items-center justify-center opacity-50">
                        <window.LucideIcon name="AlertTriangle" className="w-8 h-8 mb-2" />
                        <span className="text-xs">Composant {def.component} non chargé</span>
                    </div>
                );
            }

            return <Component isDarkMode={isDarkMode} isAdmin={true} />;
        };

        if(!ResponsiveGridLayout) return <div>Chargement du Noyau...</div>;

        return (
            <div className={`min-h-screen relative overflow-x-hidden ${isDarkMode ? 'bg-[#0a0a0a] text-white' : 'bg-slate-100 text-gray-900'} bg-[url('https://grainy-gradients.vercel.app/noise.svg')]`}>
                
                {/* GLOBAL CONTROLS */}
                <div className="fixed top-4 right-4 z-50 flex gap-2">
                     <button onClick={() => { localStorage.removeItem(STORAGE_KEY); location.reload(); }} className="p-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-bold uppercase backdrop-blur">
                        Reset OS
                    </button>
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-lg backdrop-blur ${isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'}`}>
                        <window.LucideIcon name={isDarkMode ? 'Sun' : 'Moon'} className="w-4 h-4" />
                    </button>
                </div>

                {/* THE INFINITE CANVAS */}
                <ResponsiveGridLayout
                    className="layout"
                    layouts={{ lg: layout }}
                    breakpoints={{ lg: 1200, sm: 768, xxs: 0 }}
                    cols={{ lg: 12, sm: 6, xxs: 2 }}
                    rowHeight={ROW_HEIGHT}
                    onLayoutChange={onLayoutChange}
                    draggableHandle=".cursor-move" // IMPORTANT: Only header is draggable
                    margin={[12, 12]}
                >
                    {layout.map(item => {
                        const def = WIDGET_TYPES[item.type] || { label: 'Inconnu', icon: 'HelpCircle' };
                        return (
                            <div key={item.i}>
                                {item.type === 'HEADER' ? (
                                    <div className="h-full w-full cursor-move">
                                        <HeaderWidget isDarkMode={isDarkMode} />
                                    </div>
                                ) : (
                                    <WindowChrome 
                                        title={def.label} 
                                        icon={def.icon} 
                                        isDarkMode={isDarkMode} 
                                        onClose={() => removeWidget(item.i)}
                                        isDraggable={true}
                                    >
                                        {renderWidgetContent(item)}
                                    </WindowChrome>
                                )}
                            </div>
                        );
                    })}
                </ResponsiveGridLayout>

                {/* DOCK */}
                <Dock onAddWidget={addWidget} isDarkMode={isDarkMode} />

                {/* AMBIENT GLOW */}
                <div className="fixed -bottom-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] pointer-events-none"></div>
                <div className="fixed -top-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] pointer-events-none"></div>
            </div>
        );
    };

    window.FullModularDashboard = FullModularDashboard;
})();
