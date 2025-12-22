// Component Manager - Admin panel for managing dashboard components
// Provides list, view, and delete functionality

const ComponentManager = (() => {
    const { useState, useEffect, useCallback } = React;

    const KNOWN_COMPONENTS = [
        { id: 'AskEmmaTab', name: 'Ask Emma (Chat)', category: 'Emma' },
        { id: 'StocksNewsTab', name: 'Stocks & News', category: 'Market' },
        { id: 'MarketsEconomyTab', name: 'Markets & Economy', category: 'Market' },
        { id: 'JLabTab', name: 'JLab Analysis', category: 'Analysis' },
        { id: 'EconomicCalendarTab', name: 'Economic Calendar', category: 'Calendar' },
        { id: 'InvestingCalendarTab', name: 'Investing Calendar', category: 'Calendar' },
        { id: 'SeekingAlphaTab', name: 'Seeking Alpha', category: 'News' },
        { id: 'ScrappingSATab', name: 'SA Scraping', category: 'Admin' },
        { id: 'AdminJSLaiTab', name: 'Admin JSL AI', category: 'Admin' },
        { id: 'DansWatchlistTab', name: 'Watchlist', category: 'Portfolio' },
        { id: 'YieldCurveTab', name: 'Yield Curve', category: 'Market' },
        { id: 'DashboardGridWrapper', name: 'Grid Wrapper', category: 'Core' },
        { id: 'RglDashboard', name: 'RGL Dashboard', category: 'Core' },
        { id: 'MarketsEconomyTabRGL', name: 'Markets RGL', category: 'Market' },
        { id: 'TitresTabRGL', name: 'Titres RGL', category: 'Portfolio' },
        { id: 'ChatGPTGroupTab', name: 'ChatGPT Group', category: 'Emma' },
        { id: 'PlusTab', name: 'Plus Tab', category: 'Other' },
        { id: 'ThemeSelector', name: 'Theme Selector', category: 'Core' },
    ];

    const ComponentManagerPanel = ({ isOpen, onClose, isDarkMode = true }) => {
        const [components, setComponents] = useState([]);
        const [layout, setLayout] = useState([]);
        const [activeTab, setActiveTab] = useState('components');
        const [searchTerm, setSearchTerm] = useState('');

        useEffect(() => {
            const loadedComponents = KNOWN_COMPONENTS.map(comp => ({
                ...comp,
                isLoaded: typeof window[comp.id] !== 'undefined',
            }));
            setComponents(loadedComponents);

            try {
                const savedLayout = localStorage.getItem('dashboard-grid-layout');
                if (savedLayout) setLayout(JSON.parse(savedLayout));
            } catch (e) {}
        }, [isOpen]);

        const handleDeleteWidget = useCallback((widgetId) => {
            const newLayout = layout.filter(item => item.i !== widgetId);
            setLayout(newLayout);
            localStorage.setItem('dashboard-grid-layout', JSON.stringify(newLayout));
            window.dispatchEvent(new CustomEvent('layout-updated', { detail: { layout: newLayout } }));
        }, [layout]);

        const handleResetLayout = useCallback(() => {
            localStorage.removeItem('dashboard-grid-layout');
            setLayout([]);
            window.location.reload();
        }, []);

        const filteredComponents = components.filter(comp => 
            comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            comp.id.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const groupedComponents = filteredComponents.reduce((acc, comp) => {
            if (!acc[comp.category]) acc[comp.category] = [];
            acc[comp.category].push(comp);
            return acc;
        }, {});

        if (!isOpen) return null;

        const bg = isDarkMode ? 'bg-neutral-900' : 'bg-white';
        const text = isDarkMode ? 'text-white' : 'text-gray-900';
        const border = isDarkMode ? 'border-neutral-700' : 'border-gray-200';
        const hover = isDarkMode ? 'hover:bg-neutral-800' : 'hover:bg-gray-50';

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className={`w-full max-w-4xl max-h-[90vh] ${bg} ${text} rounded-2xl shadow-2xl border ${border} overflow-hidden flex flex-col`}>
                    <div className={`flex items-center justify-between p-4 border-b ${border}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                <span className="text-xl">🧩</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Gestionnaire de Composants</h2>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {components.filter(c => c.isLoaded).length}/{components.length} composants chargés
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className={`p-2 rounded-lg ${hover} transition-colors`}>
                            <span className="text-xl">✕</span>
                        </button>
                    </div>

                    <div className={`flex border-b ${border}`}>
                        {[
                            { id: 'components', label: '📦 Composants', count: components.length },
                            { id: 'layout', label: '📐 Layout', count: layout.length },
                            { id: 'diagnostics', label: '🔍 Diagnostics', count: null }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-b-2 border-emerald-500 text-emerald-500'
                                        : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                                }`}
                            >
                                {tab.label} {tab.count !== null && `(${tab.count})`}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-auto p-4">
                        {activeTab === 'components' && (
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="🔍 Rechercher un composant..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className={`w-full px-4 py-2 rounded-lg border ${border} ${
                                        isDarkMode ? 'bg-neutral-800 text-white' : 'bg-gray-50 text-gray-900'
                                    } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                                />

                                {Object.entries(groupedComponents).map(([category, comps]) => (
                                    <div key={category} className="space-y-2">
                                        <h3 className={`text-sm font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{category}</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            {comps.map(comp => (
                                                <div key={comp.id} className={`p-3 rounded-lg border ${border} ${hover} transition-colors`}>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`w-2 h-2 rounded-full ${comp.isLoaded ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                                            <span className="font-medium text-sm">{comp.name}</span>
                                                        </div>
                                                        <span className={`text-xs px-2 py-0.5 rounded ${comp.isLoaded ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                                            {comp.isLoaded ? '✓' : '✗'}
                                                        </span>
                                                    </div>
                                                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{comp.id}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'layout' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {layout.length} widgets dans le layout actuel
                                    </p>
                                    <button onClick={handleResetLayout} className="px-3 py-1.5 text-sm bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">
                                        🔄 Réinitialiser
                                    </button>
                                </div>

                                {layout.length === 0 ? (
                                    <div className={`text-center py-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Aucun widget dans le layout</div>
                                ) : (
                                    <div className="space-y-2">
                                        {layout.map(widget => (
                                            <div key={widget.i} className={`p-3 rounded-lg border ${border} ${hover} transition-colors flex items-center justify-between`}>
                                                <div>
                                                    <p className="font-medium">{widget.i}</p>
                                                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        Position: ({widget.x}, {widget.y}) • Taille: {widget.w}×{widget.h}
                                                    </p>
                                                </div>
                                                <button onClick={() => handleDeleteWidget(widget.i)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors" title="Supprimer">
                                                    🗑️
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'diagnostics' && (
                            <div className="space-y-4">
                                <div className={`p-4 rounded-lg border ${border} ${isDarkMode ? 'bg-neutral-800' : 'bg-gray-50'}`}>
                                    <h4 className="font-semibold mb-2">📊 État du système</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>React: <span className="text-emerald-400">{typeof React !== 'undefined' ? '✓' : '✗'}</span></div>
                                        <div>ReactDOM: <span className="text-emerald-400">{typeof ReactDOM !== 'undefined' ? '✓' : '✗'}</span></div>
                                        <div>ReactGridLayout: <span className="text-emerald-400">{typeof window.ReactGridLayout !== 'undefined' ? '✓' : '✗'}</span></div>
                                        <div>Supabase: <span className="text-emerald-400">{typeof window.__SUPABASE__ !== 'undefined' ? '✓' : '✗'}</span></div>
                                        <div>Dashboard Ready: <span className="text-emerald-400">{window.__DASH_READY__ ? '✓' : '✗'}</span></div>
                                        <div>Components Ready: <span className="text-emerald-400">{window.__COMPONENTS_READY__ ? '✓' : '✗'}</span></div>
                                    </div>
                                </div>

                                <div className={`p-4 rounded-lg border ${border} ${isDarkMode ? 'bg-neutral-800' : 'bg-gray-50'}`}>
                                    <h4 className="font-semibold mb-2">🔧 Actions</h4>
                                    <div className="flex flex-wrap gap-2">
                                        <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="px-3 py-1.5 text-sm bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30">
                                            Vider localStorage
                                        </button>
                                        <button onClick={() => { sessionStorage.clear(); window.location.reload(); }} className="px-3 py-1.5 text-sm bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30">
                                            Vider sessionStorage
                                        </button>
                                        <button onClick={() => window.location.reload()} className="px-3 py-1.5 text-sm bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30">
                                            Rafraîchir
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    window.ComponentManagerPanel = ComponentManagerPanel;

    window.openComponentManager = () => {
        const container = document.createElement('div');
        container.id = 'component-manager-container';
        document.body.appendChild(container);

        const CloseablePanel = () => {
            const [isOpen, setIsOpen] = React.useState(true);
            const handleClose = () => {
                setIsOpen(false);
                setTimeout(() => container.remove(), 300);
            };
            return <ComponentManagerPanel isOpen={isOpen} onClose={handleClose} isDarkMode={true} />;
        };

        ReactDOM.render(<CloseablePanel />, container);
    };

    void('✅ ComponentManager chargé. Utilisez: openComponentManager()');
    return { ComponentManagerPanel };
})();
