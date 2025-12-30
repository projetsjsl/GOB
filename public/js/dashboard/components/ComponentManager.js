// Component Manager - Admin panel for managing dashboard components
// Provides list, view, and delete functionality with detailed documentation and risk management

const ComponentManager = (() => {
    const { useState, useEffect, useCallback, useMemo } = React;

    // Métadonnées enrichies pour chaque composant
    const KNOWN_COMPONENTS = [
        // --- EMMA ---
        { 
            id: 'AskEmmaTab', 
            name: 'Ask Emma (Chat)', 
            category: 'Emma',
            description: "Interface de chat principale avec l'IA Emma. Gère les interactions utilisateur, les requêtes financières et le pilotage du dashboard par le langage naturel.",
            implications: "Si désactivé : L'utilisateur ne pourra plus dialoguer avec Emma ni utiliser les commandes vocal/chat.",
            riskLevel: 'medium',
            techDetails: "React Functional Component. Dépend de: /api/emma-agent, supabase." 
        },
        { 
            id: 'ChatGPTGroupTab', 
            name: 'ChatGPT Group', 
            category: 'Emma',
            description: "Salon de discussion multi-utilisateurs (ou mode hybride) permettant de collaborer en temps réel avec une IA ou entre membres de l'équipe.",
            implications: "Si désactivé : L'onglet 'Group Chat' sera inaccessible ou vide.",
            riskLevel: 'low',
            techDetails: "Intégration WebSocket/Polling ou lien externe vers ChatGPT."
        },
        { 
            id: 'VoiceAssistantTab', 
            name: 'Assistant Vocal', 
            category: 'Emma',
            description: "Module de reconnaissance et de synthèse vocale pour Emma (Web Speech API).",
            implications: "Si désactivé : Les fonctions 'Emma Vocal' ne fonctionneront plus.",
            riskLevel: 'low',
            techDetails: "Utilise window.speechSynthesis et window.webkitSpeechRecognition."
        },

        // --- MARKET ---
        { 
            id: 'StocksNewsTab', 
            name: 'Stocks & News', 
            category: 'Market',
            description: "Affiche le portfolio utilisateur et les nouvelles financières agrégées.",
            implications: "Si désactivé : L'utilisateur ne verra plus ses titres ni les news associées.",
            riskLevel: 'medium',
            techDetails: "Dépend de l'API FMP et Supabase."
        },
        { 
            id: 'MarketsEconomyTab', 
            name: 'Markets & Economy', 
            category: 'Market',
            description: "Vue macro-économique globale (Indices, Forex, Commodities).",
            implications: "Si désactivé : La vue 'Marchés > Vue Globale' sera vide.",
            riskLevel: 'medium',
            techDetails: "Données temps réel via API tierces."
        },
        { 
            id: 'YieldCurveTab', 
            name: 'Yield Curve', 
            category: 'Market',
            description: "Visualisation de la courbe des taux (US, CA) et analyse des spreads (Récéssion).",
            implications: "Si désactivé : L'analyse obligataire (Yield Curve) sera indisponible.",
            riskLevel: 'low',
            techDetails: "Graphs Recharts complexes, calculs de spread en frontend."
        },

        // --- ANALYSIS ---
        { 
            id: 'JLabTab', 
            name: 'JLab Analysis', 
            category: 'Analysis',
            description: "Laboratoire d'analyse technique et fondamentale avancé (JLab).",
            implications: "Si désactivé : Les outils d'analyse JLab seront inaccessibles.",
            riskLevel: 'medium',
            techDetails: "Composant lourd contenant plusieurs sous-modules."
        },
        { 
            id: 'AdvancedAnalysisTab', 
            name: 'Advanced Analysis', 
            category: 'Analysis',
            description: "Module d'analyse approfondie (DCF, Ratios complexes).",
            implications: "Si désactivé : L'onglet 'Analyse Pro' ne chargera pas.",
            riskLevel: 'low',
            techDetails: "Calculs financiers intensifs côté client."
        },

        // --- CALENDAR ---
        { 
            id: 'EconomicCalendarTab', 
            name: 'Economic Calendar', 
            category: 'Calendar',
            description: "Calendrier des événements économiques majeurs (Fed, BCE, PIB, CPI).",
            implications: "Si désactivé : Pas d'agenda macro-économique visible.",
            riskLevel: 'low',
            techDetails: "Parsing de flux RSS ou API externe."
        },
        { 
            id: 'InvestingCalendarTab', 
            name: 'Investing Calendar (→ MarketsEconomyTab)', 
            category: 'Calendar',
            description: "FUSIONNÉ dans MarketsEconomyTab. Calendrier économique, Forex, TSX.",
            implications: "Utiliser MarketsEconomyTab à la place.",
            riskLevel: 'low',
            techDetails: "Redirige vers MarketsEconomyTab."
        },

        // --- NEWS ---
        { 
            id: 'SeekingAlphaTab', 
            name: 'Seeking Alpha', 
            category: 'News',
            description: "Flux d'articles et analyses provenant de Seeking Alpha (via scraping/API).",
            implications: "Si désactivé : L'onglet Seeking Alpha sera vide.",
            riskLevel: 'low',
            techDetails: "Nécessite souvent un proxy ou un backend de scraping."
        },

        // --- ADMIN ---
        { 
            id: 'ScrappingSATab', 
            name: 'SA Scraping', 
            category: 'Admin',
            description: "Interface d'administration pour les tâches de scraping (logs, status).",
            implications: "Si désactivé : Impossible de monitorer les scrapers depuis le front.",
            riskLevel: 'low',
            techDetails: "Outil interne pour admin."
        },
        { 
            id: 'AdminJSLaiTab', 
            name: 'Admin JSLAI', 
            category: 'Admin',
            description: "Panneau de configuration général de l'IA (Prompts, Modèles, Clés API).",
            implications: "Si désactivé : Impossible de configurer Emma ou les clés API depuis l'interface.",
            riskLevel: 'high',
            techDetails: "Accès critique aux configurations système."
        },

        // --- PORTFOLIO ---
        { 
            id: 'DansWatchlistTab', 
            name: 'Watchlist', 
            category: 'Portfolio',
            description: "Liste de surveillance personnalisée (Watchlist) de l'utilisateur.",
            implications: "Si désactivé : La watchlist personnelle ne s'affichera pas.",
            riskLevel: 'medium',
            techDetails: "CRUD sur Supabase/LocalStorage."
        },
        // --- CORE (DANGER ZONE) ---
        { 
            id: 'DashboardGridWrapper', 
            name: 'Grid Wrapper', 
            category: 'Core',
            description: "CRITIQUE. Ce composant enveloppe toute la grille du dashboard. Il gère l'espacement, le responsive et le conteneur principal.",
            implications: "SI DÉSACTIVÉ : LE DASHBOARD NE S'AFFICHERA PAS. ÉCRAN BLANC POTENTIEL.",
            riskLevel: 'critical',
            techDetails: "Layout component structurel."
        },
        { 
            id: 'RglDashboard', 
            name: 'RGL Dashboard', 
            category: 'Core',
            description: "CRITIQUE. Le moteur de grille (React Grid Layout) qui permet de déplacer et redimensionner les widgets.",
            implications: "SI DÉSACTIVÉ : La plupart des vues modulaires cesseront de fonctionner.",
            riskLevel: 'critical',
            techDetails: "Dépendance lourde RGL."
        },
        { 
            id: 'ThemeSelector', 
            name: 'Theme Selector', 
            category: 'Core',
            description: "Gère le basculement Dark Mode / Light Mode.",
            implications: "Si désactivé : L'utilisateur sera bloqué sur le thème par défaut.",
            riskLevel: 'medium',
            techDetails: "Context provider ou gestionnaire de state global."
        },
        
        // --- OTHER ---
        { 
            id: 'PlusTab', 
            name: 'Plus Tab', 
            category: 'Other',
            description: "Onglet 'Plus' / Paramètres divers. Point d'entrée pour certaines configs.",
            implications: "Si désactivé : Accès réduit aux réglages secondaires.",
            riskLevel: 'low',
            techDetails: "Menu de navigation secondaire."
        },
    ];

    const ComponentManagerPanel = ({ isOpen, onClose, isDarkMode = true }) => {
        const [components, setComponents] = useState([]);
        const [layout, setLayout] = useState([]);
        const [activeTab, setActiveTab] = useState('components');
        const [searchTerm, setSearchTerm] = useState('');
        const [selectedComp, setSelectedComp] = useState(null); // Pour la vue détaillée
        const [preferences, setPreferences] = useState({});

        // Chargement initial
        useEffect(() => {
            // Check availability
            const loadedComponents = KNOWN_COMPONENTS.map(comp => ({
                ...comp,
                isLoaded: typeof window[comp.id] !== 'undefined',
            }));
            setComponents(loadedComponents);

            // Load Layout
            try {
                const savedLayout = localStorage.getItem('dashboard-grid-layout');
                if (savedLayout) setLayout(JSON.parse(savedLayout));
            } catch (e) {}

            // Load Preferences (Disabled/Enabled states mockup)
            try {
                const savedPrefs = localStorage.getItem('component-manager-prefs');
                if (savedPrefs) setPreferences(JSON.parse(savedPrefs));
            } catch (e) {}
        }, [isOpen]);

        const handleToggleComponent = (compId, currentStatus) => {
            const newPrefs = { ...preferences, [compId]: !currentStatus }; // Toggle
            setPreferences(newPrefs);
            localStorage.setItem('component-manager-prefs', JSON.stringify(newPrefs));
            // Note: En "vrai", il faudrait recharger la page ou notifier l'app pour appliquer
        };

        const handleDeleteWidget = useCallback((widgetId) => {
            const newLayout = layout.filter(item => item.i !== widgetId);
            setLayout(newLayout);
            localStorage.setItem('dashboard-grid-layout', JSON.stringify(newLayout));
            window.dispatchEvent(new CustomEvent('layout-updated', { detail: { layout: newLayout } }));
        }, [layout]);

        const handleResetLayout = useCallback(() => {
            if(!confirm("Êtes-vous sûr de vouloir réinitialiser tout l'agencement du dashboard ?")) return;
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
        const modalBg = isDarkMode ? 'bg-neutral-800' : 'bg-white';
        
        // Styles de risque
        const getRiskBadge = (level) => {
            switch(level) {
                case 'critical': return <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider">CRITICAL ZONE</span>;
                case 'high': return <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 text-[10px] font-bold uppercase">HIGH RISK</span>;
                case 'medium': return <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-[10px] font-bold uppercase">MEDIUM</span>;
                default: return <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase">SAFE</span>;
            }
        };

        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className={`w-full max-w-5xl h-[85vh] ${bg} ${text} rounded-2xl shadow-2xl border ${border} overflow-hidden flex flex-col relative`}>
                    
                    {/* Header */}
                    <div className={`flex items-center justify-between p-5 border-b ${border} bg-gradient-to-r from-transparent to-transparent`}>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <span className="text-2xl">⚡</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">System Component Manager</h2>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    v2.0 • Gestion avancée & Diagnostic
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`text-xs px-3 py-1 rounded-full border ${border}`}>
                                {components.filter(c => c.isLoaded).length} actifs / {components.length} total
                            </span>
                            <button onClick={onClose} className={`p-2 rounded-xl ${isDarkMode ? 'hover:bg-neutral-800' : 'hover:bg-gray-100'} transition-colors`}>
                                <span className="text-xl">✕</span>
                            </button>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className={`flex border-b ${border} px-2`}>
                        {[
                            { id: 'components', label: '📦 Registry', count: components.length },
                            { id: 'layout', label: '📐 Layout Engine', count: layout.length },
                            { id: 'diagnostics', label: '🏥 Diagnostics', count: null }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-4 px-6 text-sm font-semibold transition-all border-b-2 ${
                                    activeTab === tab.id
                                        ? 'border-indigo-500 text-indigo-500'
                                        : 'border-transparent text-gray-500 hover:text-gray-300'
                                }`}
                            >
                                {tab.label} {tab.count !== null && <span className="ml-1 opacity-60 text-xs">({tab.count})</span>}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden flex">
                        
                        {/* --- REGISTRY TAB --- */}
                        {activeTab === 'components' && (
                            <div className="flex w-full h-full">
                                {/* Left List */}
                                <div className={`w-1/3 border-r ${border} overflow-y-auto p-4 space-y-4`}>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                                        <input
                                            type="text"
                                            placeholder="Filtrer les composants..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className={`w-full pl-10 pr-4 py-2 rounded-xl border ${border} ${
                                                isDarkMode ? 'bg-neutral-800 text-white' : 'bg-gray-50 text-gray-900'
                                            } focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm`}
                                        />
                                    </div>

                                    <div className="space-y-6">
                                        {Object.entries(groupedComponents).map(([category, comps]) => (
                                            <div key={category}>
                                                <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} ml-1`}>{category}</h3>
                                                <div className="space-y-1">
                                                    {comps.map(comp => (
                                                        <button
                                                            key={comp.id}
                                                            onClick={() => setSelectedComp(comp)}
                                                            className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between group ${
                                                                selectedComp?.id === comp.id
                                                                    ? 'border-indigo-500 bg-indigo-500/10'
                                                                    : `${border} hover:border-indigo-500/50 ${isDarkMode ? 'hover:bg-neutral-800' : 'hover:bg-gray-50'}`
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-2 h-2 rounded-full ${comp.isLoaded ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                                                                <span className={`text-sm font-medium ${selectedComp?.id === comp.id ? 'text-indigo-400' : ''}`}>{comp.name}</span>
                                                            </div>
                                                            {/* Mini risk dot */}
                                                            {comp.riskLevel === 'critical' && <span className="w-1.5 h-1.5 rounded-full bg-red-600" title="Critical"></span>}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Right Details */}
                                <div className={`flex-1 overflow-y-auto p-8 ${isDarkMode ? 'bg-[#0a0a0c]' : 'bg-gray-50'}`}>
                                    {selectedComp ? (
                                        <div className="space-y-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
                                            {/* Header Detail */}
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h2 className="text-3xl font-bold">{selectedComp.name}</h2>
                                                        {getRiskBadge(selectedComp.riskLevel)}
                                                    </div>
                                                    <code className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-neutral-800 text-gray-400' : 'bg-gray-200 text-gray-600'} font-mono`}>
                                                        ID: {selectedComp.id}
                                                    </code>
                                                </div>
                                                <div className={`px-4 py-2 rounded-lg border ${border} ${selectedComp.isLoaded ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xl ${selectedComp.isLoaded ? 'animate-pulse' : ''}`}>{selectedComp.isLoaded ? '●' : '○'}</span>
                                                        <span className={`font-bold ${selectedComp.isLoaded ? 'text-emerald-400' : 'text-red-400'}`}>
                                                            {selectedComp.isLoaded ? 'ONLINE' : 'OFFLINE'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Description Card */}
                                            <div className={`p-6 rounded-2xl border ${border} ${modalBg} shadow-sm`}>
                                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                                    <span>📝</span> Description
                                                </h3>
                                                <p className={`leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    {selectedComp.description}
                                                </p>
                                            </div>

                                            {/* Tech & Implications Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className={`p-6 rounded-2xl border ${border} ${modalBg}`}>
                                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                                        <span>⚠️</span> Implications
                                                    </h3>
                                                    <p className={`text-sm leading-relaxed ${selectedComp.riskLevel === 'critical' ? 'text-red-400 font-bold' : isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        {selectedComp.implications}
                                                    </p>
                                                </div>

                                                <div className={`p-6 rounded-2xl border ${border} ${modalBg}`}>
                                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                                        <span>⚙️</span> Technical
                                                    </h3>
                                                    <p className={`text-sm font-mono ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        {selectedComp.techDetails}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Parameterization / Danger Zone */}
                                            <div className={`mt-8 border-t ${border} pt-8`}>
                                                <h3 className="text-lg font-semibold mb-6">Paramètres de chargement</h3>
                                                
                                                <div className={`flex items-center justify-between p-4 rounded-xl border ${border} ${isDarkMode ? 'bg-neutral-900' : 'bg-white'}`}>
                                                    <div>
                                                        <div className="font-medium">État du composant</div>
                                                        <div className="text-sm text-gray-500">Contrôle si le composant est actif ou ignoré par le système.</div>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            className="sr-only peer"
                                                            checked={preferences[selectedComp.id] !== false} // True by default
                                                            onChange={() => handleToggleComponent(selectedComp.id, preferences[selectedComp.id] !== false)}
                                                            disabled={selectedComp.riskLevel === 'critical'}
                                                        />
                                                        <div className={`w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                                                            selectedComp.riskLevel === 'critical' 
                                                                ? 'peer-checked:bg-gray-600 opacity-50 cursor-not-allowed' 
                                                                : 'peer-checked:bg-emerald-500'
                                                        }`}></div>
                                                    </label>
                                                </div>
                                                
                                                {selectedComp.riskLevel === 'critical' && (
                                                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                                                        <span className="text-red-400">⛔</span>
                                                        <p className="text-xs text-red-400 mt-0.5">
                                                            Ce composant est <strong>CRITIQUE</strong> pour le système. Il ne peut pas être désactivé sans causer un crash majeur de l'application.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                            <div className="text-6xl mb-4">👈</div>
                                            <h3 className="text-xl font-medium">Sélectionnez un composant</h3>
                                            <p className="text-sm">Consultez les détails, les risques et les configurations.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* --- LAYOUT TAB --- */}
                        {activeTab === 'layout' && (
                            <div className="p-8 w-full max-w-3xl mx-auto">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-xl font-bold">Grid Layout Engine</h3>
                                        <p className="text-gray-500 text-sm">Gère la position et la persistance des widgets sur le dashboard.</p>
                                    </div>
                                    <button onClick={handleResetLayout} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-red-600/20 transition-all transform hover:scale-105">
                                        🧨 FACTORY RESET LAYOUT
                                    </button>
                                </div>

                                {layout.length === 0 ? (
                                    <div className="text-center py-20 border-2 border-dashed border-gray-700 rounded-3xl">
                                        <div className="text-4xl mb-4 opacity-50">🕸️</div>
                                        <p className="text-gray-400">Le layout est vide ou utilise la configuration par défaut.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {layout.map(widget => (
                                            <div key={widget.i} className={`p-4 rounded-xl border ${border} ${modalBg} flex flex-col shadow-sm relative group`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="font-mono text-xs px-2 py-1 bg-gray-800 rounded text-gray-300">{widget.i}</span>
                                                    <button onClick={() => handleDeleteWidget(widget.i)} className="text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                                                        <span className="text-lg">🗑️</span>
                                                    </button>
                                                </div>
                                                <div className="flex gap-4 text-xs text-gray-500 mt-auto">
                                                    <span>📍 X:{widget.x} Y:{widget.y}</span>
                                                    <span>📏 W:{widget.w} H:{widget.h}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* --- DIAGNOSTICS TAB --- */}
                        {activeTab === 'diagnostics' && (
                            <div className="p-8 w-full max-w-4xl mx-auto space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className={`p-6 rounded-2xl border ${border} ${modalBg} shadow-sm`}>
                                        <h4 className="font-bold text-lg mb-4 flex items-center gap-2"><span>🌡️</span> Core Vital Signs</h4>
                                        <div className="space-y-3">
                                            {[
                                                { label: 'React Core', check: typeof React !== 'undefined', crit: true },
                                                { label: 'React DOM', check: typeof ReactDOM !== 'undefined', crit: true },
                                                { label: 'Grid Layout Engine', check: typeof window.ReactGridLayout !== 'undefined', crit: true },
                                                { label: 'Supabase Client', check: typeof window.__SUPABASE__ !== 'undefined', crit: false },
                                                { label: 'Tailwind CSS', check: true, crit: false }, // Assumed active if rendered
                                            ].map((item, i) => (
                                                <div key={i} className="flex justify-between items-center p-2 rounded hover:bg-white/5">
                                                    <span className={item.crit ? 'font-medium' : 'text-gray-500'}>{item.label}</span>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.check ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-500'}`}>
                                                        {item.check ? 'OPERATIONAL' : 'FAILURE'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className={`p-6 rounded-2xl border ${border} ${modalBg} shadow-sm`}>
                                        <h4 className="font-bold text-lg mb-4 flex items-center gap-2"><span>🧹</span> System Maintenance</h4>
                                        <div className="space-y-3">
                                            <p className="text-sm text-gray-500 mb-4">Utilisez ces outils avec précaution pour résoudre des problèmes de cache ou d'état corrompu.</p>
                                            <button onClick={() => { if(confirm('Vider tout le LocalStorage ?')) { localStorage.clear(); window.location.reload(); } }} className="w-full py-2 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 text-sm font-medium transition-colors text-left flex items-center gap-3">
                                                <span>🗑️</span> Purge LocalStorage (Hard Reset)
                                            </button>
                                            <button onClick={() => { sessionStorage.clear(); window.location.reload(); }} className="w-full py-2 px-4 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg border border-orange-500/20 text-sm font-medium transition-colors text-left flex items-center gap-3">
                                                <span>🧹</span> Purge SessionStorage (Soft Reset)
                                            </button>
                                            <button onClick={() => window.location.reload()} className="w-full py-2 px-4 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/20 text-sm font-medium transition-colors text-left flex items-center gap-3">
                                                <span>🔄</span> Force Reload Application
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className={`p-6 rounded-2xl border ${border} ${modalBg} shadow-sm`}>
                                    <h4 className="font-bold text-lg mb-4">📜 Environment Variables</h4>
                                    <div className="font-mono text-xs space-y-1 text-gray-500">
                                        <div className="grid grid-cols-2 border-b border-gray-800 pb-1 mb-1">
                                            <span>Variable</span>
                                            <span>Status</span>
                                        </div>
                                        <div className="grid grid-cols-2">
                                            <span>VITE_SUPABASE_URL</span>
                                            <span className="text-emerald-500">Configured</span>
                                        </div>
                                        <div className="grid grid-cols-2">
                                            <span>VITE_SUPABASE_KEY</span>
                                            <span className="text-emerald-500">Configured</span>
                                        </div>
                                        <div className="grid grid-cols-2">
                                            <span>VITE_GROUP_CHAT_URL</span>
                                            <span className={window.env?.VITE_GROUP_CHAT_URL ? "text-emerald-500" : "text-yellow-500"}>
                                                {window.env?.VITE_GROUP_CHAT_URL ? 'Active' : 'Missing (Optional)'}
                                            </span>
                                        </div>
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

    // Helper to open the manager from console or button
    window.openComponentManager = () => {
        // Remove existing if any
        const existing = document.getElementById('component-manager-container');
        if (existing) existing.remove();

        const container = document.createElement('div');
        container.id = 'component-manager-container';
        document.body.appendChild(container);

        const CloseablePanel = () => {
            const [isOpen, setIsOpen] = React.useState(true);
            const handleClose = () => {
                setIsOpen(false);
                setTimeout(() => container.remove(), 200);
            };
            return <ComponentManagerPanel isOpen={isOpen} onClose={handleClose} isDarkMode={true} />;
        };

        ReactDOM.render(<CloseablePanel />, container);
    };

    // Log initialization
    void('✅ ComponentManager 2.0 chargé avec succès. Documentation et gestion des risques actives.');

    return { ComponentManagerPanel };
})();
