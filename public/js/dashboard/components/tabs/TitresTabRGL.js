/**
 * TitresTabRGL.js
 * Dashboard "Titres & Portfolio" ultra-flexible avec React-Grid-Layout
 * 
 * Features:
 * - Templates de disposition (Trading, Overview, Data)
 * - Redimensionnement libre
 * - Persistance automatique
 */

(function() {
    'use strict';

    const { useState, useEffect, useCallback, useMemo, useRef } = React;

    // ===================================
    // 1. CONFIGURATION & TEMPLATES
    // ===================================
    const STORAGE_KEY = 'gob_layout_titres_v1';
    const COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
    const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
    const ROW_HEIGHT = 50;

    // Définition des layouts prédéfinis (Templates)
    const TEMPLATES = {
        'standard': {
            label: '📱 Standard',
            layout: [
                { i: 'kpi-total', x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
                { i: 'kpi-day', x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
                { i: 'kpi-cash', x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
                { i: 'kpi-alert', x: 9, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
                { i: 'main-chart', x: 0, y: 2, w: 8, h: 8, minW: 4, minH: 4 },
                { i: 'watchlist', x: 8, y: 2, w: 4, h: 8, minW: 3, minH: 4 },
                { i: 'positions', x: 0, y: 10, w: 12, h: 6, minW: 6, minH: 4 }
            ]
        },
        'trading': {
            label: '📈 Focus Trading',
            layout: [
                { i: 'main-chart', x: 0, y: 0, w: 9, h: 10, minW: 4, minH: 4 },
                { i: 'watchlist', x: 9, y: 0, w: 3, h: 10, minW: 2, minH: 4 },
                { i: 'kpi-total', x: 0, y: 10, w: 2, h: 2 },
                { i: 'kpi-day', x: 2, y: 10, w: 2, h: 2 },
                { i: 'positions', x: 4, y: 10, w: 8, h: 4 }
            ]
        },
        'data': {
            label: '🔢 Focus Données',
            layout: [
                { i: 'kpi-total', x: 0, y: 0, w: 2, h: 2 },
                { i: 'kpi-day', x: 2, y: 0, w: 2, h: 2 },
                { i: 'positions', x: 0, y: 2, w: 12, h: 8 },
                { i: 'watchlist', x: 0, y: 10, w: 6, h: 6 },
                { i: 'main-chart', x: 6, y: 10, w: 6, h: 6 }
            ]
        }
    };

    // ===================================
    // 2. COMPOSANTS WIDGETS
    // ===================================
    
    // Wrapper générique avec style
    const WidgetCard = ({ title, children, isDarkMode, className = '' }) => (
        <div className={`h-full w-full rounded-xl overflow-hidden flex flex-col shadow-lg transition-colors duration-300 ${isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-gray-100'} border ${className}`}>
            <div className={`px-4 py-2 border-b flex justify-between items-center ${isDarkMode ? 'border-neutral-700 bg-neutral-800/50' : 'border-gray-100 bg-gray-50/50'}`}>
                <h3 className={`font-semibold text-sm truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{title}</h3>
                <div className="flex gap-1">
                    <div className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-neutral-600' : 'bg-gray-300'}`}></div>
                    <div className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-neutral-600' : 'bg-gray-300'}`}></div>
                </div>
            </div>
            <div className="flex-1 overflow-auto relative min-h-0">
                {children}
            </div>
        </div>
    );

    const ChartWidget = ({ isDarkMode }) => {
        const ref = useRef(null);
        useEffect(() => {
            if (!ref.current || !window.createChart) return;
            const chart = window.createChart(ref.current, {
                layout: { background: { color: 'transparent' }, textColor: isDarkMode ? '#d1d5db' : '#374151' },
                grid: { vertLines: { color: isDarkMode ? '#404040' : '#e5e7eb' }, horzLines: { color: isDarkMode ? '#404040' : '#e5e7eb' } },
                width: ref.current.clientWidth, height: ref.current.clientHeight
            });
            const lineSeries = chart.addLineSeries({ color: '#10B981' });
            // Mock data loop
            let data = [];
            let val = 100;
            for(let i=0; i<100; i++) { val += Math.random() - 0.5; data.push({ time: new Date(Date.now() - (100-i)*86400000).toISOString().split('T')[0], value: val }); }
            lineSeries.setData(data);
            chart.timeScale().fitContent();
            
            const handleResize = () => chart.resize(ref.current.clientWidth, ref.current.clientHeight);
            window.addEventListener('resize', handleResize);
            const ro = new ResizeObserver(() => handleResize());
            ro.observe(ref.current);
            return () => { window.removeEventListener('resize', handleResize); chart.remove(); ro.disconnect(); };
        }, [isDarkMode]);
        return <div ref={ref} className="w-full h-full" />;
    };

    const KpiWidget = ({ label, value, sub, color, isDarkMode }) => (
        <div className={`h-full flex flex-col justify-center items-center p-2 text-center ${isDarkMode ? 'text-white' : 'text-gray-900'} bg-gradient-to-br ${color}`}>
            <span className="text-xs opacity-80 uppercase tracking-wider">{label}</span>
            <span className="text-2xl font-bold my-1">{value}</span>
            <span className="text-sm opacity-90 font-medium">{sub}</span>
        </div>
    );

    // ===================================
    // 3. COMPOSANT PRINCIPAL
    // ===================================
    const TitresTabRGL = ({ isDarkMode = true, isAdmin = true }) => { // isAdmin true par défaut pour démo
        const [currentLayoutName, setCurrentLayoutName] = useState('standard');
        const [layouts, setLayouts] = useState(() => {
            try { 
                const saved = localStorage.getItem(STORAGE_KEY);
                return saved ? JSON.parse(saved) : { lg: TEMPLATES['standard'].layout };
            } catch (e) { return { lg: TEMPLATES['standard'].layout }; }
        });
        const [isEditing, setIsEditing] = useState(false); // Mode édition désactivé par défaut pour éviter erreurs accidentelles
        const [compactType, setCompactType] = useState('vertical');

        const RGL = window.ReactGridLayout;
        const ResponsiveGridLayout = useMemo(() => RGL && RGL.WidthProvider && RGL.Responsive ? RGL.WidthProvider(RGL.Responsive) : null, [RGL]);

        // Changement de template
        const loadTemplate = (templateKey) => {
            const tpl = TEMPLATES[templateKey];
            if (tpl) {
                const newLayouts = { lg: tpl.layout, md: tpl.layout, sm: tpl.layout }; // Simplification pour démo
                setLayouts(newLayouts);
                setCurrentLayoutName(templateKey);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newLayouts));
            }
        };

        const onLayoutChange = (layout, allLayouts) => {
            // Sauvegarde automatique
            setLayouts(allLayouts);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(allLayouts));
        };

        if (!ResponsiveGridLayout) return <div className="p-8 text-center animate-pulse">Chargement du moteur de grille...</div>;

        return (
            <div className={`min-h-screen pb-20 ${isEditing ? 'border-2 border-emerald-500/30 border-dashed rounded-xl' : ''}`}>
                
                {/* BARRE D'OUTILS ET CONFIGURATION */}
                <div className={`mb-6 p-4 rounded-xl flex flex-wrap gap-4 items-center justify-between ${isDarkMode ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-gray-200'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                            <window.LucideIcon name="LayoutDashboard" className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Dashboard Titres</h2>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Glissez, déposez et redimensionnez vos widgets</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Sélecteur de Template */}
                        <div className="flex bg-gray-100/10 rounded-lg p-1 gap-1">
                            {Object.entries(TEMPLATES).map(([key, tpl]) => (
                                <button
                                    key={key}
                                    onClick={() => loadTemplate(key)}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                                        currentLayoutName === key
                                            ? 'bg-emerald-500 text-white shadow'
                                            : isDarkMode ? 'text-gray-400 hover:text-white hover:bg-neutral-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                                >
                                    {tpl.label}
                                </button>
                            ))}
                        </div>

                        <div className={`h-8 w-[1px] ${isDarkMode ? 'bg-neutral-700' : 'bg-gray-200'}`}></div>

                        {/* Mode Édition Toggle */}
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
                                isEditing
                                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20 scale-105'
                                    : isDarkMode ? 'bg-neutral-800 text-gray-300 hover:bg-neutral-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {isEditing ? (
                                <React.Fragment>
                                    <window.LucideIcon name="Check" className="w-4 h-4" />
                                    <span>Terminer</span>
                                </React.Fragment>
                            ) : (
                                <React.Fragment>
                                    <window.LucideIcon name="Move" className="w-4 h-4" />
                                    <span>Modifier</span>
                                </React.Fragment>
                            )}
                        </button>
                    </div>
                </div>

                {isEditing && (
                    <div className="mb-4 text-center">
                        <span className="inline-block px-4 py-1 rounded-full bg-amber-500/20 text-amber-500 text-sm font-medium animate-pulse border border-amber-500/30">
                            🚧 Mode Édition Actif : Glissez les éléments et utilisez la poignée en bas à droite pour redimensionner
                        </span>
                    </div>
                )}

                {/* GRILLE RGL */}
                <ResponsiveGridLayout
                    className="layout"
                    layouts={layouts}
                    breakpoints={BREAKPOINTS}
                    cols={COLS}
                    rowHeight={ROW_HEIGHT}
                    onLayoutChange={onLayoutChange}
                    isDraggable={isEditing}
                    isResizable={isEditing}
                    compactType={compactType}
                    margin={[16, 16]}
                    containerPadding={[0, 0]}
                    draggableHandle=".react-grid-item" // Toute la card est draggable si isEditing est true
                >
                    {/* WIDGET: Total KPI */}
                    <div key="kpi-total">
                        <WidgetCard title="Valeur" isDarkMode={isDarkMode} className="border-t-4 border-t-emerald-500">
                             <KpiWidget label="Valeur Totale" value="$1,245,392" sub="+15.4% YTD" color={isDarkMode ? 'from-emerald-900/50 to-neutral-900' : 'from-emerald-50 to-white'} isDarkMode={isDarkMode}/>
                        </WidgetCard>
                    </div>

                    {/* WIDGET: Day KPI */}
                    <div key="kpi-day">
                        <WidgetCard title="Jour" isDarkMode={isDarkMode} className="border-t-4 border-t-blue-500">
                            <KpiWidget label="Variation Jour" value="+$4,230" sub="+0.34%" color={isDarkMode ? 'from-blue-900/50 to-neutral-900' : 'from-blue-50 to-white'} isDarkMode={isDarkMode}/>
                        </WidgetCard>
                    </div>

                    {/* WIDGET: Cash KPI */}
                    <div key="kpi-cash">
                        <WidgetCard title="Cash" isDarkMode={isDarkMode} className="border-t-4 border-t-amber-500">
                            <KpiWidget label="Liquidités" value="$142,000" sub="11.4% Alloc." color={isDarkMode ? 'from-amber-900/50 to-neutral-900' : 'from-amber-50 to-white'} isDarkMode={isDarkMode}/>
                        </WidgetCard>
                    </div>

                    {/* WIDGET: Alert KPI */}
                    <div key="kpi-alert">
                         <WidgetCard title="Alertes" isDarkMode={isDarkMode} className="border-t-4 border-t-purple-500">
                            <div className="h-full flex flex-col justify-center items-center gap-2">
                                <span className="text-2xl font-bold text-purple-500">3</span>
                                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Signaux d'achat détectés</span>
                            </div>
                        </WidgetCard>
                    </div>

                    {/* WIDGET: Main Chart */}
                    <div key="main-chart">
                        <WidgetCard title="Performance Historique (Interactive)" isDarkMode={isDarkMode}>
                            <ChartWidget isDarkMode={isDarkMode} />
                        </WidgetCard>
                    </div>

                    {/* WIDGET: Watchlist */}
                    <div key="watchlist">
                        <WidgetCard title="Watchlist Prioritaire" isDarkMode={isDarkMode}>
                             <div className="p-4 space-y-2">
                                {['NVDA', 'MSFT', 'AAPL', 'TSLA', 'AMZN', 'GOOGL', 'META'].map(s => (
                                    <div key={s} className={`flex justify-between items-center p-2 rounded ${isDarkMode ? 'bg-neutral-700/50' : 'bg-gray-50'}`}>
                                        <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{s}</span>
                                        <span className="text-emerald-500">+{(Math.random()*5).toFixed(2)}%</span>
                                    </div>
                                ))}
                             </div>
                        </WidgetCard>
                    </div>

                    {/* WIDGET: Positions Table */}
                    <div key="positions">
                        <WidgetCard title="Positions Ouvertes" isDarkMode={isDarkMode}>
                            <div className="p-0 overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className={`text-xs uppercase ${isDarkMode ? 'bg-neutral-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                                        <tr><th className="px-6 py-3">Symbole</th><th className="px-6 py-3">Qté</th><th className="px-6 py-3">Prix Moyen</th><th className="px-6 py-3">Prix Actuel</th><th className="px-6 py-3">P&L</th></tr>
                                    </thead>
                                    <tbody className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                                        {[1,2,3,4,5].map(i => (
                                            <tr key={i} className={`border-b ${isDarkMode ? 'border-neutral-700 hover:bg-neutral-700/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                                                <td className="px-6 py-3 font-medium">STK-{i}</td>
                                                <td className="px-6 py-3">{100*i}</td>
                                                <td className="px-6 py-3">${(50+i*2).toFixed(2)}</td>
                                                <td className="px-6 py-3">${(55+i*5).toFixed(2)}</td>
                                                <td className="px-6 py-3 text-emerald-500">+${(500*i).toFixed(0)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </WidgetCard>
                    </div>

                </ResponsiveGridLayout>
            </div>
        );
    };

    window.TitresTabRGL = TitresTabRGL;
})();
