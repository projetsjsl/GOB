/**
 * RglDashboard.js - React-Grid-Layout Dashboard Component
 * 
 * Provides drag & drop, resize, and customizable layout for dashboard widgets.
 * Admin users can modify layouts which are persisted to localStorage (and later DB).
 * 
 * @version 1.0.0
 * @requires react-grid-layout
 */

(function() {
    'use strict';

    const { useState, useCallback, useMemo } = React;

    // ============================================================================
    // CONSTANTS & DEFAULT LAYOUTS
    // ============================================================================

    const STORAGE_KEY = 'gob_dashboard_layout';
    const COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
    const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
    const ROW_HEIGHT = 60;

    // Default layouts for each breakpoint
    const DEFAULT_LAYOUTS = {
        lg: [
            { i: 'portfolio-value', x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
            { i: 'daily-change', x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
            { i: 'market-status', x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
            { i: 'top-performer', x: 9, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
            { i: 'portfolio-chart', x: 0, y: 2, w: 8, h: 5, minW: 4, minH: 3 },
            { i: 'allocation-donut', x: 8, y: 2, w: 4, h: 5, minW: 3, minH: 3 },
            { i: 'holdings-table', x: 0, y: 7, w: 6, h: 4, minW: 4, minH: 3 },
            { i: 'news-feed', x: 6, y: 7, w: 6, h: 4, minW: 3, minH: 3 },
            { i: 'market-heatmap', x: 0, y: 11, w: 12, h: 4, minW: 6, minH: 3 }
        ],
        md: [
            { i: 'portfolio-value', x: 0, y: 0, w: 5, h: 2 },
            { i: 'daily-change', x: 5, y: 0, w: 5, h: 2 },
            { i: 'market-status', x: 0, y: 2, w: 5, h: 2 },
            { i: 'top-performer', x: 5, y: 2, w: 5, h: 2 },
            { i: 'portfolio-chart', x: 0, y: 4, w: 10, h: 5 },
            { i: 'allocation-donut', x: 0, y: 9, w: 5, h: 4 },
            { i: 'holdings-table', x: 5, y: 9, w: 5, h: 4 },
            { i: 'news-feed', x: 0, y: 13, w: 10, h: 4 },
            { i: 'market-heatmap', x: 0, y: 17, w: 10, h: 4 }
        ],
        sm: [
            { i: 'portfolio-value', x: 0, y: 0, w: 3, h: 2 },
            { i: 'daily-change', x: 3, y: 0, w: 3, h: 2 },
            { i: 'market-status', x: 0, y: 2, w: 3, h: 2 },
            { i: 'top-performer', x: 3, y: 2, w: 3, h: 2 },
            { i: 'portfolio-chart', x: 0, y: 4, w: 6, h: 4 },
            { i: 'allocation-donut', x: 0, y: 8, w: 6, h: 4 },
            { i: 'holdings-table', x: 0, y: 12, w: 6, h: 4 },
            { i: 'news-feed', x: 0, y: 16, w: 6, h: 4 },
            { i: 'market-heatmap', x: 0, y: 20, w: 6, h: 4 }
        ],
        xs: [
            { i: 'portfolio-value', x: 0, y: 0, w: 4, h: 2 },
            { i: 'daily-change', x: 0, y: 2, w: 4, h: 2 },
            { i: 'market-status', x: 0, y: 4, w: 4, h: 2 },
            { i: 'top-performer', x: 0, y: 6, w: 4, h: 2 },
            { i: 'portfolio-chart', x: 0, y: 8, w: 4, h: 4 },
            { i: 'allocation-donut', x: 0, y: 12, w: 4, h: 4 },
            { i: 'holdings-table', x: 0, y: 16, w: 4, h: 4 },
            { i: 'news-feed', x: 0, y: 20, w: 4, h: 4 },
            { i: 'market-heatmap', x: 0, y: 24, w: 4, h: 4 }
        ],
        xxs: [
            { i: 'portfolio-value', x: 0, y: 0, w: 2, h: 2 },
            { i: 'daily-change', x: 0, y: 2, w: 2, h: 2 },
            { i: 'market-status', x: 0, y: 4, w: 2, h: 2 },
            { i: 'top-performer', x: 0, y: 6, w: 2, h: 2 },
            { i: 'portfolio-chart', x: 0, y: 8, w: 2, h: 4 },
            { i: 'allocation-donut', x: 0, y: 12, w: 2, h: 4 },
            { i: 'holdings-table', x: 0, y: 16, w: 2, h: 4 },
            { i: 'news-feed', x: 0, y: 20, w: 2, h: 4 },
            { i: 'market-heatmap', x: 0, y: 24, w: 2, h: 4 }
        ]
    };

    // Widget definitions with metadata
    const WIDGET_DEFINITIONS = {
        'portfolio-value': { title: 'Valeur du Portfolio', icon: 'Wallet', type: 'kpi', color: 'emerald' },
        'daily-change': { title: 'Variation Journaliere', icon: 'TrendingUp', type: 'kpi', color: 'blue' },
        'market-status': { title: 'Etat du Marche', icon: 'Activity', type: 'kpi', color: 'amber' },
        'top-performer': { title: 'Meilleure Performance', icon: 'Star', type: 'kpi', color: 'purple' },
        'portfolio-chart': { title: 'Evolution du Portfolio', icon: 'LineChart', type: 'chart-line' },
        'allocation-donut': { title: 'Allocation', icon: 'PieChart', type: 'chart-donut' },
        'holdings-table': { title: 'Positions', icon: 'Table', type: 'table' },
        'news-feed': { title: 'Actualites', icon: 'Newspaper', type: 'news' },
        'market-heatmap': { title: 'Heatmap Secteurs', icon: 'Grid3X3', type: 'heatmap' }
    };

    // Mock data
    const MOCK_DATA = {
        portfolioValue: 1247856.32,
        dailyChange: 2.34,
        dailyChangeAmount: 28543.21,
        marketStatus: 'OPEN',
        topPerformer: { symbol: 'NVDA', change: 8.7 },
        holdings: [
            { symbol: 'AAPL', name: 'Apple', shares: 150, price: 195.23, change: 1.2, value: 29284.5 },
            { symbol: 'MSFT', name: 'Microsoft', shares: 100, price: 378.45, change: -0.5, value: 37845 },
            { symbol: 'NVDA', name: 'NVIDIA', shares: 50, price: 485.67, change: 8.7, value: 24283.5 },
            { symbol: 'GOOGL', name: 'Alphabet', shares: 75, price: 142.89, change: 0.8, value: 10716.75 }
        ],
        allocation: [
            { sector: 'Tech', value: 45, color: '#3B82F6' },
            { sector: 'Finance', value: 20, color: '#10B981' },
            { sector: 'Sante', value: 15, color: '#8B5CF6' },
            { sector: 'Energie', value: 12, color: '#F59E0B' },
            { sector: 'Autre', value: 8, color: '#6B7280' }
        ],
        chartData: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29-i) * 86400000).toLocaleDateString('fr-CA'),
            value: 1200000 + Math.random() * 100000 - 50000 + i * 2000
        })),
        news: [
            { id: 1, title: "Fed maintient les taux", source: 'Reuters', time: '2h' },
            { id: 2, title: 'NVIDIA bat les attentes', source: 'Bloomberg', time: '4h' },
            { id: 3, title: 'Apple nouveau produit', source: 'CNBC', time: '6h' }
        ]
    };

    // ============================================================================
    // WIDGET COMPONENTS
    // ============================================================================

    const KpiWidget = ({ widgetId, isDarkMode }) => {
        const def = WIDGET_DEFINITIONS[widgetId];
        const colorMap = {
            emerald: 'from-emerald-500 to-emerald-600',
            blue: 'from-blue-500 to-blue-600',
            amber: 'from-amber-500 to-amber-600',
            purple: 'from-purple-500 to-purple-600'
        };

        let value, subtitle;
        switch(widgetId) {
            case 'portfolio-value':
                value = `$${MOCK_DATA.portfolioValue.toLocaleString()}`;
                subtitle = 'Valeur totale';
                break;
            case 'daily-change':
                value = `+${MOCK_DATA.dailyChange}%`;
                subtitle = `$${MOCK_DATA.dailyChangeAmount.toLocaleString()}`;
                break;
            case 'market-status':
                value = MOCK_DATA.marketStatus;
                subtitle = 'NYSE, NASDAQ';
                break;
            case 'top-performer':
                value = MOCK_DATA.topPerformer.symbol;
                subtitle = `+${MOCK_DATA.topPerformer.change}%`;
                break;
            default:
                value = '-';
                subtitle = '';
        }

        return (
            <div className={`h-full rounded-xl p-4 flex flex-col justify-between ${isDarkMode ? 'bg-neutral-800' : 'bg-white'} shadow-lg`}>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${colorMap[def.color]} w-fit`}>
                    <window.LucideIcon name={def.icon} className="w-5 h-5 text-white" />
                </div>
                <div>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{subtitle}</p>
                </div>
            </div>
        );
    };

    const LineChartWidget = ({ isDarkMode }) => {
        const data = MOCK_DATA.chartData;
        const max = Math.max(...data.map(d => d.value));
        const min = Math.min(...data.map(d => d.value));
        const range = max - min || 1;

        return (
            <div className={`h-full rounded-xl p-4 ${isDarkMode ? 'bg-neutral-800' : 'bg-white'} shadow-lg flex flex-col`}>
                <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Evolution Portfolio</h3>
                <div className="flex-1 relative min-h-0">
                    <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10B981" stopOpacity="0.3"/>
                                <stop offset="100%" stopColor="#10B981" stopOpacity="0"/>
                            </linearGradient>
                        </defs>
                        <path d={`M0,${100-((data[0].value-min)/range)*80} ${data.map((d,i)=>`L${i/(data.length-1)*300},${100-((d.value-min)/range)*80}`).join(' ')} L300,100 L0,100 Z`} fill="url(#grad)"/>
                        <path d={`M0,${100-((data[0].value-min)/range)*80} ${data.map((d,i)=>`L${i/(data.length-1)*300},${100-((d.value-min)/range)*80}`).join(' ')}`} fill="none" stroke="#10B981" strokeWidth="2"/>
                    </svg>
                </div>
            </div>
        );
    };

    const DonutChartWidget = ({ isDarkMode }) => {
        const data = MOCK_DATA.allocation;
        let angle = 0;
        return (
            <div className={`h-full rounded-xl p-4 ${isDarkMode ? 'bg-neutral-800' : 'bg-white'} shadow-lg flex flex-col`}>
                <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Allocation</h3>
                <div className="flex-1 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-24 h-24">
                        {data.map((s, i) => {
                            const a = (s.value/100)*360;
                            const x1 = 50 + 40*Math.cos((angle-90)*Math.PI/180);
                            const y1 = 50 + 40*Math.sin((angle-90)*Math.PI/180);
                            angle += a;
                            const x2 = 50 + 40*Math.cos((angle-90)*Math.PI/180);
                            const y2 = 50 + 40*Math.sin((angle-90)*Math.PI/180);
                            return <path key={i} d={`M50,50 L${x1},${y1} A40,40 0 ${a>180?1:0},1 ${x2},${y2} Z`} fill={s.color}/>;
                        })}
                        <circle cx="50" cy="50" r="25" fill={isDarkMode ? '#262626' : '#fff'}/>
                    </svg>
                </div>
                <div className="flex flex-wrap gap-1 text-xs justify-center">
                    {data.map(s => <span key={s.sector} style={{color:s.color}}> {s.sector}</span>)}
                </div>
            </div>
        );
    };

    const TableWidget = ({ isDarkMode }) => (
        <div className={`h-full rounded-xl p-4 ${isDarkMode ? 'bg-neutral-800' : 'bg-white'} shadow-lg flex flex-col`}>
            <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Positions</h3>
            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm">
                    <thead><tr className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}><th className="text-left py-1">Sym</th><th className="text-right py-1">Prix</th><th className="text-right py-1">%</th></tr></thead>
                    <tbody>{MOCK_DATA.holdings.map(h => (
                        <tr key={h.symbol} className={`border-t ${isDarkMode ? 'border-neutral-700' : 'border-gray-100'}`}>
                            <td className={`py-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{h.symbol}</td>
                            <td className={`text-right py-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>${h.price}</td>
                            <td className={`text-right py-1 ${h.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{h.change > 0 ? '+' : ''}{h.change}%</td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        </div>
    );

    const NewsFeedWidget = ({ isDarkMode }) => (
        <div className={`h-full rounded-xl p-4 ${isDarkMode ? 'bg-neutral-800' : 'bg-white'} shadow-lg flex flex-col`}>
            <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Actualites</h3>
            <div className="flex-1 overflow-auto space-y-2">
                {MOCK_DATA.news.map(n => (
                    <div key={n.id} className={`p-2 rounded-lg ${isDarkMode ? 'bg-neutral-700/50' : 'bg-gray-50'}`}>
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{n.title}</p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{n.source} - {n.time}</p>
                    </div>
                ))}
            </div>
        </div>
    );

    const HeatmapWidget = ({ isDarkMode }) => {
        const sectors = [
            { name: 'Tech', change: 2.3 }, { name: 'Finance', change: 0.8 },
            { name: 'Sante', change: -0.5 }, { name: 'Energie', change: 1.2 },
            { name: 'Conso', change: -1.1 }, { name: 'Industrie', change: 0.4 }
        ];
        const getColor = c => c >= 1 ? 'bg-emerald-500' : c >= 0 ? 'bg-emerald-300' : c >= -1 ? 'bg-red-300' : 'bg-red-500';
        return (
            <div className={`h-full rounded-xl p-4 ${isDarkMode ? 'bg-neutral-800' : 'bg-white'} shadow-lg flex flex-col`}>
                <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Heatmap</h3>
                <div className="flex-1 grid grid-cols-3 gap-2">
                    {sectors.map(s => (
                        <div key={s.name} className={`${getColor(s.change)} rounded-lg p-2 flex flex-col items-center justify-center`}>
                            <span className="text-white text-xs">{s.name}</span>
                            <span className="text-white text-sm font-bold">{s.change > 0 ? '+' : ''}{s.change}%</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Widget Renderer
    const WidgetRenderer = ({ widgetId, isDarkMode }) => {
        const def = WIDGET_DEFINITIONS[widgetId];
        if (!def) return <div className="p-4">Widget: {widgetId}</div>;
        switch(def.type) {
            case 'kpi': return <KpiWidget widgetId={widgetId} isDarkMode={isDarkMode} />;
            case 'chart-line': return <LineChartWidget isDarkMode={isDarkMode} />;
            case 'chart-donut': return <DonutChartWidget isDarkMode={isDarkMode} />;
            case 'table': return <TableWidget isDarkMode={isDarkMode} />;
            case 'news': return <NewsFeedWidget isDarkMode={isDarkMode} />;
            case 'heatmap': return <HeatmapWidget isDarkMode={isDarkMode} />;
            default: return <div className={`h-full rounded-xl p-4 ${isDarkMode ? 'bg-neutral-800' : 'bg-white'} shadow-lg flex items-center justify-center`}><span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>{def.title}</span></div>;
        }
    };

    // ============================================================================
    // MAIN RGL DASHBOARD COMPONENT
    // ============================================================================

    const RglDashboard = ({ isDarkMode = true, isAdmin = false }) => {
        const [layouts, setLayouts] = useState(() => {
            try {
                const s = localStorage.getItem(STORAGE_KEY);
                return s ? JSON.parse(s) : DEFAULT_LAYOUTS;
            } catch (e) {
                console.error('Error loading RGL layout:', e);
                return DEFAULT_LAYOUTS;
            }
        });
        const [isEditing, setIsEditing] = useState(false);
        const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');

        const RGL = window.ReactGridLayout;
        const ResponsiveGridLayout = useMemo(() => RGL && RGL.WidthProvider && RGL.Responsive ? RGL.WidthProvider(RGL.Responsive) : null, [RGL]);

        const handleLayoutChange = useCallback((cur, all) => { if(isEditing){ setLayouts(all); localStorage.setItem(STORAGE_KEY, JSON.stringify(all)); }}, [isEditing]);
        const resetLayout = useCallback(() => { setLayouts(DEFAULT_LAYOUTS); localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LAYOUTS)); }, []);

        if (!ResponsiveGridLayout) {
            return (
                <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-neutral-900' : 'bg-gray-100'}`}>
                    <div className={`p-4 rounded-lg mb-4 ${isDarkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                        <p className="font-medium"> React-Grid-Layout loading...</p>
                        <p className="text-sm mt-1">Make sure the CDN script is loaded.</p>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        {Object.keys(WIDGET_DEFINITIONS).map(id => <div key={id} className="h-32"><WidgetRenderer widgetId={id} isDarkMode={isDarkMode}/></div>)}
                    </div>
                </div>
            );
        }

        return (
            <div className={`${isDarkMode ? 'bg-neutral-900' : 'bg-gray-100'} rounded-xl overflow-hidden`}>
                {isAdmin && (
                    <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-neutral-700' : 'border-gray-200'}`}>
                        <div className="flex items-center gap-4">
                            <h2 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Dashboard Personnalisable</h2>
                            <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-neutral-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>BP: {currentBreakpoint}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button title="Action" onClick={() => setIsEditing(!isEditing)} className={`px-4 py-2 rounded-lg font-medium text-sm ${isEditing ? 'bg-emerald-500 text-white' : isDarkMode ? 'bg-neutral-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                                {isEditing ? ' Terminer' : ' Modifier'}
                            </button>
                            {isEditing && <button onClick={resetLayout} className={`px-4 py-2 rounded-lg font-medium text-sm ${isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'}`}> Reset</button>}
                        </div>
                    </div>
                )}
                <div className="p-4">
                    <ResponsiveGridLayout className="layout" layouts={layouts} breakpoints={BREAKPOINTS} cols={COLS} rowHeight={ROW_HEIGHT}
                        onLayoutChange={handleLayoutChange} onBreakpointChange={setCurrentBreakpoint}
                        isDraggable={isEditing} isResizable={isEditing} compactType="vertical" margin={[16, 16]}
                        resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
                    >
                        {layouts.lg.map(item => (
                            <div key={item.i} className={isEditing ? 'cursor-move ring-2 ring-emerald-500/50' : ''}>
                                <WidgetRenderer widgetId={item.i} isDarkMode={isDarkMode}/>
                            </div>
                        ))}
                    </ResponsiveGridLayout>
                </div>
                {isEditing && <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full shadow-lg bg-emerald-500 text-white`}><span className="text-sm font-medium"> Mode edition - Glissez et redimensionnez</span></div>}
            </div>
        );
    };

    // Export to window
    window.RglDashboard = RglDashboard;
    window.RGL_DEFAULT_LAYOUTS = DEFAULT_LAYOUTS;
    window.RGL_WIDGET_DEFINITIONS = WIDGET_DEFINITIONS;

    console.log(' RglDashboard loaded');
})();
