/**
 * CurveWatchV0 - CEO Designer Edition v6
 * Premium Financial Terminal UI/UX + Admin Panel
 * 
 */

const { useState, useEffect, useCallback, useMemo, useRef } = React;

// 
// ADMIN CONFIGURATION - Default visibility settings
// 
const DEFAULT_ADMIN_CONFIG = {
    // Header elements
    header: {
        enabled: true,
        countrySelector: true,
        interpolationSelector: true,
        dateSelector: true,
        refreshButton: true,
        brandLabel: true,
    },
    // Floating navigation
    floatingNav: {
        enabled: true,
    },
    // Sidebar
    sidebar: {
        enabled: true,
        controlsPanel: true,
        maturitySelector: true,
    },
    // Sections
    sections: {
        hero: { enabled: true, title: true, subtitle: true, exportButtons: true },
        kpiSummary: { enabled: true },
        yieldCurves: { enabled: true },
        comparisonGrid: { enabled: true },
        spreads: { enabled: true, spreadChart: true, spreadAnalysis: true },
        analytics: { enabled: true, forwardRates: true, butterflies: true, curveMetrics: true },
        historical: { enabled: true, spreadHistory: true, spreadHistoryChart: true, rateDecisions: true },
    },
    // Footer
    footer: {
        enabled: true,
    },
    // UI Options
    ui: {
        animations: true,
        glowEffects: true,
        glassmorphism: true,
    }
};

const STORAGE_KEY = 'curvewatch_admin_config';

// 
// ADMIN HOOKS - Persistence & State Management
// 
const useAdminConfig = () => {
    const [config, setConfig] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Merge with defaults to handle new options
                return deepMerge(DEFAULT_ADMIN_CONFIG, parsed);
            }
        } catch (e) {
            console.warn('Failed to load admin config:', e);
        }
        return DEFAULT_ADMIN_CONFIG;
    });

    const updateConfig = useCallback((path, value) => {
        setConfig(prev => {
            const newConfig = setDeepValue({ ...prev }, path, value);
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
            } catch (e) {
                console.warn('Failed to save admin config:', e);
            }
            return newConfig;
        });
    }, []);

    const resetConfig = useCallback(() => {
        setConfig(DEFAULT_ADMIN_CONFIG);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {}
    }, []);

    return { config, updateConfig, resetConfig };
};

// Deep merge utility
const deepMerge = (target, source) => {
    const output = { ...target };
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            output[key] = deepMerge(target[key] || {}, source[key]);
        } else {
            output[key] = source[key];
        }
    }
    return output;
};

// Set deep value utility
const setDeepValue = (obj, path, value) => {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    return obj;
};

// Get deep value utility
const getDeepValue = (obj, path) => {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
};

// 
// ADMIN PANEL COMPONENT
// 
const AdminPanel = ({ isOpen, onClose, config, updateConfig, resetConfig }) => {
    const [activeTab, setActiveTab] = useState('sections');
    
    if (!isOpen) return null;

    const Toggle = ({ label, path, description }) => {
        const value = getDeepValue(config, path);
        return (
            <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <div className="flex-1">
                    <span className="text-sm font-medium text-white">{label}</span>
                    {description && <p className="text-[11px] text-zinc-500 mt-0.5">{description}</p>}
                </div>
                <button
                    onClick={() => updateConfig(path, !value)}
                    className={`relative w-11 h-6 rounded-full transition-all ${
                        value 
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' 
                            : 'bg-zinc-700'
                    }`}
                >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg transition-all ${
                        value ? 'left-6' : 'left-1'
                    }`} />
                </button>
            </div>
        );
    };

    const SectionGroup = ({ title, children }) => (
        <div className="mb-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3">{title}</h4>
            <div className="bg-zinc-900/50 rounded-xl border border-white/5 p-4">
                {children}
            </div>
        </div>
    );

    const tabs = [
        { id: 'sections', label: 'Sections', icon: '' },
        { id: 'header', label: 'Header', icon: '' },
        { id: 'sidebar', label: 'Sidebar', icon: '' },
        { id: 'ui', label: 'Interface', icon: '' },
    ];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Panel */}
            <div className="relative w-full max-w-2xl max-h-[85vh] bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-scale">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-lg">
                            
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Panneau Admin</h2>
                            <p className="text-[11px] text-zinc-500">Configuration de l'interface CurveWatch</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
                    >
                        
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-2 border-b border-white/5 bg-zinc-900/50">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                activeTab === tab.id
                                    ? 'bg-violet-500/20 text-violet-300'
                                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                            }`}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(85vh-200px)]">
                    {activeTab === 'sections' && (
                        <>
                            <SectionGroup title="Sections Principales">
                                <Toggle label="Section Hero" path="sections.hero.enabled" description="Titre principal et sous-titre" />
                                <Toggle label="Titre du Hero" path="sections.hero.title" />
                                <Toggle label="Sous-titre" path="sections.hero.subtitle" />
                                <Toggle label="Boutons Export" path="sections.hero.exportButtons" />
                            </SectionGroup>
                            
                            <SectionGroup title="KPIs & Donnees">
                                <Toggle label="Resume KPIs" path="sections.kpiSummary.enabled" description="Cartes FED Rate, BOC Rate, Pentes" />
                                <Toggle label="Courbes de Rendement" path="sections.yieldCurves.enabled" description="Graphique principal des courbes" />
                                <Toggle label="Grille de Comparaison" path="sections.comparisonGrid.enabled" description="Matrice des rendements par maturite" />
                            </SectionGroup>

                            <SectionGroup title="Analyse des Spreads">
                                <Toggle label="Section Spreads" path="sections.spreads.enabled" />
                                <Toggle label="Graphique Spread US-CA" path="sections.spreads.spreadChart" />
                                <Toggle label="Analyse des Spreads" path="sections.spreads.spreadAnalysis" />
                            </SectionGroup>

                            <SectionGroup title="Metriques Avancees">
                                <Toggle label="Section Analytics" path="sections.analytics.enabled" />
                                <Toggle label="Taux Forward" path="sections.analytics.forwardRates" />
                                <Toggle label="Spreads Papillon" path="sections.analytics.butterflies" />
                                <Toggle label="Metriques de Courbe" path="sections.analytics.curveMetrics" />
                            </SectionGroup>

                            <SectionGroup title="Historique">
                                <Toggle label="Section Historique" path="sections.historical.enabled" />
                                <Toggle label="Spread Historique par Maturite" path="sections.historical.spreadHistory" />
                                <Toggle label="Graphique Spread Historique" path="sections.historical.spreadHistoryChart" />
                                <Toggle label="Historique Decisions de Taux" path="sections.historical.rateDecisions" />
                            </SectionGroup>
                        </>
                    )}

                    {activeTab === 'header' && (
                        <>
                            <SectionGroup title="Barre de Header">
                                <Toggle label="Header complet" path="header.enabled" description="Afficher/masquer tout le header" />
                                <Toggle label="Selecteur de Pays" path="header.countrySelector" description="Drapeaux US/Canada" />
                                <Toggle label="Selecteur d'Interpolation" path="header.interpolationSelector" description="Moteur de calcul" />
                                <Toggle label="Selecteur de Date" path="header.dateSelector" />
                                <Toggle label="Bouton Actualiser" path="header.refreshButton" />
                                <Toggle label="Label JLab Terminal" path="header.brandLabel" />
                            </SectionGroup>

                            <SectionGroup title="Navigation">
                                <Toggle label="Navigation Flottante" path="floatingNav.enabled" description="Barre laterale avec icones" />
                                <Toggle label="Footer" path="footer.enabled" />
                            </SectionGroup>
                        </>
                    )}

                    {activeTab === 'sidebar' && (
                        <>
                            <SectionGroup title="Panneau Lateral">
                                <Toggle label="Sidebar complete" path="sidebar.enabled" description="Afficher/masquer la sidebar" />
                                <Toggle label="Panneau de Controles" path="sidebar.controlsPanel" description="Pays, interpolation, date" />
                                <Toggle label="Selecteur de Maturites" path="sidebar.maturitySelector" description="Boutons 3M, 6M, 1Y..." />
                            </SectionGroup>
                        </>
                    )}

                    {activeTab === 'ui' && (
                        <>
                            <SectionGroup title="Effets Visuels">
                                <Toggle label="Animations" path="ui.animations" description="Transitions et animations d'entree" />
                                <Toggle label="Effets Glow" path="ui.glowEffects" description="Lueurs sur les badges et boutons" />
                                <Toggle label="Glassmorphism" path="ui.glassmorphism" description="Effet verre depoli sur les cartes" />
                            </SectionGroup>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-white/5 bg-zinc-900/50">
                    <button 
                        onClick={resetConfig}
                        className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                         Reinitialiser
                    </button>
                    <div className="flex gap-2">
                        <button 
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                        >
                            Fermer
                        </button>
                        <button 
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 rounded-lg transition-all shadow-lg shadow-violet-500/20"
                        >
                             Appliquer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 
// DESIGN SYSTEM - Premium CSS Variables & Animations
// 
const CSS_PREMIUM = `
    :root {
        /* Core Palette */
        --bg-primary: #09090b;
        --bg-secondary: #0f0f11;
        --bg-tertiary: #18181b;
        --bg-elevated: #1f1f23;
        
        --text-primary: #fafafa;
        --text-secondary: #a1a1aa;
        --text-muted: #71717a;
        
        --accent-blue: #3b82f6;
        --accent-blue-light: #60a5fa;
        --accent-indigo: #6366f1;
        --accent-emerald: #10b981;
        --accent-amber: #f59e0b;
        --accent-rose: #f43f5e;
        --accent-red: #ef4444;
        
        --border-subtle: rgba(255, 255, 255, 0.06);
        --border-default: rgba(255, 255, 255, 0.1);
        --border-accent: rgba(59, 130, 246, 0.3);
        
        /* Gradients */
        --gradient-blue: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        --gradient-premium: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.1) 50%, rgba(236, 72, 153, 0.05) 100%);
        --gradient-card: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%);
        
        /* Shadows */
        --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
        --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3);
        --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.4);
        --shadow-glow-blue: 0 0 30px rgba(59, 130, 246, 0.2);
        --shadow-glow-emerald: 0 0 30px rgba(16, 185, 129, 0.15);
        
        --radius-sm: 6px;
        --radius-md: 10px;
        --radius-lg: 16px;
        --radius-xl: 24px;
    }

    @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeInScale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.15); } 50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.25); } }
    @keyframes gradient-shift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
    @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }

    .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
    .animate-fade-in-scale { animation: fadeInScale 0.4s ease-out forwards; }
    .animate-shimmer { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent); background-size: 200% 100%; animation: shimmer 2s infinite; }
    .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
    .animate-gradient { background-size: 200% 200%; animation: gradient-shift 8s ease infinite; }
    .animate-float { animation: float 3s ease-in-out infinite; }

    .stagger-1 { animation-delay: 0.05s; }
    .stagger-2 { animation-delay: 0.1s; }
    .stagger-3 { animation-delay: 0.15s; }
    .stagger-4 { animation-delay: 0.2s; }
    .stagger-5 { animation-delay: 0.25s; }
    .stagger-6 { animation-delay: 0.3s; }

    .glass-card { background: linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); backdrop-filter: blur(20px); box-shadow: var(--shadow-md); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .glass-card:hover { border-color: var(--border-default); box-shadow: var(--shadow-lg); transform: translateY(-2px); }

    .section-card { background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); overflow: hidden; position: relative; }
    .section-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); }

    .fed-card { background: linear-gradient(135deg, rgba(30, 58, 138, 0.2) 0%, rgba(30, 64, 175, 0.05) 100%); border: 1px solid rgba(59, 130, 246, 0.2); border-left: 3px solid var(--accent-blue); border-radius: var(--radius-lg); }
    .canada-card { background: linear-gradient(135deg, rgba(153, 27, 27, 0.2) 0%, rgba(185, 28, 28, 0.05) 100%); border: 1px solid rgba(239, 68, 68, 0.2); border-left: 3px solid var(--accent-red); border-radius: var(--radius-lg); }

    .header-bar { background: rgba(9, 9, 11, 0.8); backdrop-filter: blur(20px) saturate(180%); border-bottom: 1px solid var(--border-subtle); box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3); }
    .floating-nav { background: rgba(15, 15, 17, 0.95); backdrop-filter: blur(20px); border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); box-shadow: var(--shadow-lg), var(--shadow-glow-blue); }

    .btn-premium { background: var(--gradient-blue); color: white; font-weight: 600; padding: 10px 20px; border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 2px 10px rgba(59, 130, 246, 0.3); }
    .btn-premium:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4); }

    .btn-ghost { background: rgba(255, 255, 255, 0.03); color: var(--text-secondary); border: 1px solid var(--border-subtle); padding: 8px 16px; border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease; }
    .btn-ghost:hover { background: rgba(255, 255, 255, 0.06); color: var(--text-primary); border-color: var(--border-default); }

    .section-badge { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 10px; font-size: 12px; font-weight: 700; transition: all 0.3s ease; }
    .section-badge.blue { background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%); border: 1px solid rgba(59, 130, 246, 0.3); color: var(--accent-blue-light); box-shadow: 0 0 20px rgba(59, 130, 246, 0.2); }
    .section-badge.indigo { background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%); border: 1px solid rgba(99, 102, 241, 0.3); color: #a5b4fc; }
    .section-badge.emerald { background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%); border: 1px solid rgba(16, 185, 129, 0.3); color: #6ee7b7; }
    .section-badge.amber { background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%); border: 1px solid rgba(245, 158, 11, 0.3); color: #fcd34d; }
    .section-badge.rose { background: linear-gradient(135deg, rgba(244, 63, 94, 0.2) 0%, rgba(244, 63, 94, 0.1) 100%); border: 1px solid rgba(244, 63, 94, 0.3); color: #fda4af; }
    .section-badge.purple { background: linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(168, 85, 247, 0.1) 100%); border: 1px solid rgba(168, 85, 247, 0.3); color: #d8b4fe; }

    .chart-container { background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 24px; position: relative; overflow: hidden; }
    .chart-container::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 200px; background: linear-gradient(180deg, rgba(59, 130, 246, 0.03) 0%, transparent 100%); pointer-events: none; }
    
    /* Full-width charts */
    .chart-fullwidth { width: 100%; }
    .chart-fullwidth .recharts-wrapper, .chart-fullwidth .recharts-surface { width: 100% !important; }
    .chart-fullwidth .recharts-responsive-container { width: 100% !important; min-height: 400px; }
    
    /* Main chart - taller */
    #section-comparison .chart-container { min-height: 500px; }
    #section-comparison .recharts-responsive-container { min-height: 450px !important; }
    
    /* Historical chart - prominent */
    #section-historical .chart-fullwidth .recharts-responsive-container { min-height: 350px !important; }

    .input-premium { background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 10px 14px; color: var(--text-primary); font-size: 13px; transition: all 0.2s ease; }
    .input-premium:focus { outline: none; border-color: var(--accent-blue); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }

    .country-pill { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; font-size: 20px; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); border: 2px solid transparent; }
    .country-pill:hover { transform: scale(1.08); filter: brightness(1.1); }
    .country-pill:active { transform: scale(0.95); }
    .country-pill.selected { background: rgba(59, 130, 246, 0.15); border-color: rgba(59, 130, 246, 0.4); box-shadow: 0 0 20px rgba(59, 130, 246, 0.2); }
    .country-pill:not(.selected) { opacity: 0.4; filter: grayscale(0.5); }
    .country-pill:not(.selected):hover { opacity: 0.7; filter: grayscale(0.2); }

    /* Navigation & Period Buttons */
    .nav-btn { display: inline-flex; align-items: center; justify-content: center; padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; color: var(--text-secondary); background: rgba(255, 255, 255, 0.03); border: 1px solid transparent; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); user-select: none; }
    .nav-btn:hover { color: var(--text-primary); background: rgba(255, 255, 255, 0.08); border-color: var(--border-default); transform: translateY(-1px); }
    .nav-btn:active { transform: translateY(0) scale(0.97); }
    .nav-btn:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--bg-primary), 0 0 0 4px var(--accent-blue); }
    .nav-btn.active { color: white; background: var(--gradient-blue); border-color: transparent; box-shadow: 0 2px 10px rgba(59, 130, 246, 0.3); }
    .nav-btn.active:hover { box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4); }

    /* Period selector buttons (1J, 1W, etc.) */
    .period-btn { display: inline-flex; align-items: center; justify-content: center; min-width: 44px; height: 36px; padding: 0 12px; border-radius: 8px; font-size: 11px; font-weight: 700; letter-spacing: 0.02em; color: var(--text-muted); background: transparent; border: 1px solid var(--border-subtle); cursor: pointer; transition: all 0.15s ease; }
    .period-btn:hover { color: var(--text-primary); background: rgba(255, 255, 255, 0.05); border-color: var(--border-default); }
    .period-btn:active { transform: scale(0.95); }
    .period-btn.selected { color: white; background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(99, 102, 241, 0.15) 100%); border-color: rgba(59, 130, 246, 0.4); box-shadow: 0 0 15px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255,255,255,0.1); }

    /* Action buttons */
    .action-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 600; color: var(--text-secondary); background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-subtle); cursor: pointer; transition: all 0.2s ease; }
    .action-btn:hover { color: var(--text-primary); background: rgba(255, 255, 255, 0.06); border-color: var(--border-default); transform: translateY(-1px); box-shadow: var(--shadow-md); }
    .action-btn:active { transform: translateY(0) scale(0.98); }
    .action-btn.primary { color: white; background: var(--gradient-blue); border-color: transparent; box-shadow: 0 2px 10px rgba(59, 130, 246, 0.25); }
    .action-btn.primary:hover { box-shadow: 0 4px 15px rgba(59, 130, 246, 0.35); }
    .action-btn.danger { color: #fca5a5; background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2); }
    .action-btn.danger:hover { color: #fecaca; background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.3); }

    /* Maturity selector buttons */
    .maturity-btn { display: inline-flex; align-items: center; justify-content: center; padding: 6px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; color: var(--text-muted); background: transparent; border: 1px solid var(--border-subtle); cursor: pointer; transition: all 0.15s ease; }
    .maturity-btn:hover { color: var(--text-secondary); background: rgba(255, 255, 255, 0.04); border-color: var(--border-default); }
    .maturity-btn:active { transform: scale(0.93); }
    .maturity-btn.selected { color: var(--accent-blue-light); background: rgba(59, 130, 246, 0.1); border-color: rgba(59, 130, 246, 0.3); }

    /* Link styles */
    .nav-link { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 500; color: var(--text-secondary); text-decoration: none; cursor: pointer; transition: all 0.2s ease; }
    .nav-link:hover { color: var(--text-primary); background: rgba(255, 255, 255, 0.05); }
    .nav-link:active { transform: scale(0.97); }

    /* Floating nav buttons */
    .float-nav-btn { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 8px; font-size: 14px; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); color: var(--text-muted); background: transparent; border: none; }
    .float-nav-btn:hover { color: var(--text-primary); background: rgba(255, 255, 255, 0.08); transform: scale(1.05); }
    .float-nav-btn:active { transform: scale(0.92); }
    .float-nav-btn.active { color: white; background: rgba(59, 130, 246, 0.2); box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }

    /* Tab buttons */
    .tab-btn { display: inline-flex; align-items: center; justify-content: center; padding: 10px 16px; border-radius: 8px; font-size: 12px; font-weight: 600; color: var(--text-muted); background: transparent; border: none; cursor: pointer; transition: all 0.2s ease; position: relative; }
    .tab-btn:hover { color: var(--text-secondary); background: rgba(255, 255, 255, 0.03); }
    .tab-btn:active { transform: scale(0.97); }
    .tab-btn.active { color: white; background: rgba(59, 130, 246, 0.15); }
    .tab-btn.active::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 20px; height: 2px; background: var(--accent-blue); border-radius: 1px; }

    .scroll-mt-20 { scroll-margin-top: 6rem; }
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: var(--bg-primary); }
    ::-webkit-scrollbar-thumb { background: var(--bg-elevated); border-radius: 4px; transition: background 0.2s; }
    ::-webkit-scrollbar-thumb:hover { background: var(--bg-tertiary); }
    ::selection { background: rgba(59, 130, 246, 0.3); }

    /* Focus visible for accessibility */
    *:focus-visible { outline: 2px solid var(--accent-blue); outline-offset: 2px; }
    button:focus:not(:focus-visible), a:focus:not(:focus-visible) { outline: none; }

    /* Admin button styles */
    .admin-trigger { position: fixed; bottom: 4px; left: 4px; width: 32px; height: 32px; border-radius: 8px; background: transparent; border: none; cursor: pointer; opacity: 0; transition: opacity 0.3s; z-index: 100; }
    .admin-trigger:hover { opacity: 0.5; background: rgba(139, 92, 246, 0.1); }

    /* Ripple effect for buttons */
    @keyframes ripple { to { transform: scale(2); opacity: 0; } }
    .ripple { position: relative; overflow: hidden; }
    .ripple::after { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at center, rgba(255,255,255,0.15), transparent 60%); transform: scale(0); opacity: 1; transition: none; }
    .ripple:active::after { animation: ripple 0.4s ease-out; }

    /* 
       RESPONSIVE DESIGN - Mobile, Tablet, Desktop
        */
    
    /* Mobile First - Base styles for small screens */
    @media (max-width: 640px) {
        /* Prevent horizontal scroll */
        body, html, .min-h-screen { overflow-x: hidden !important; max-width: 100vw !important; }
        
        /* Header adjustments */
        .header-bar { padding: 8px 8px !important; max-width: 100vw !important; }
        .header-bar > div { flex-wrap: wrap; gap: 6px; max-width: 100%; }
        
        /* Hide non-essential header items on mobile */
        .header-bar .hidden-mobile { display: none !important; }
        
        /* Country pills smaller on mobile */
        .country-pill { width: 36px; height: 36px; font-size: 18px; border-radius: 10px; }
        
        /* Hero title smaller */
        .hero-title { font-size: 2.5rem !important; }
        
        /* Floating nav - bottom bar on mobile */
        .floating-nav { 
            position: fixed !important; 
            right: 12px !important; 
            left: auto !important;
            top: 50% !important; 
            bottom: auto !important; 
            transform: translateY(-50%) !important;
            flex-direction: column !important;
            padding: 6px !important;
            border-radius: 12px !important;
        }
        .floating-nav .h-px { width: 24px; height: 1px; margin: 4px 0; }
        .float-nav-btn { width: 32px; height: 32px; font-size: 12px; }
        
        /* Cards stack on mobile */
        .grid { grid-template-columns: 1fr !important; }
        
        /* KPI cards smaller */
        .fed-card, .canada-card { padding: 16px !important; }
        
        /* Main content padding - reduce right padding for floating nav */
        main { padding-left: 12px !important; padding-right: 48px !important; }
        
        /* Chart container */
        .chart-container { padding: 12px !important; border-radius: 12px !important; }
        #section-comparison .chart-container { min-height: 350px; }
        #section-comparison .recharts-responsive-container { min-height: 300px !important; }
        
        /* Controls bar - stack vertically */
        .controls-bar { flex-direction: column !important; }
        .controls-bar > div { min-width: 100% !important; }
        
        /* Section badges smaller */
        .section-badge { width: 28px; height: 28px; font-size: 11px; }
        
        /* Footer compact */
        footer { padding: 16px !important; }
        footer > div { flex-direction: column !important; gap: 16px !important; text-align: center; }
    }
    
    /* Tablet - Medium screens */
    @media (min-width: 641px) and (max-width: 1024px) {
        /* Header */
        .header-bar { padding: 12px 20px !important; }
        
        /* Grid 2 columns max */
        .grid-cols-3 { grid-template-columns: repeat(2, 1fr) !important; }
        
        /* Floating nav smaller */
        .floating-nav { right: 12px !important; }
        .float-nav-btn { width: 38px; height: 38px; }
        
        /* Chart container */
        #section-comparison .chart-container { min-height: 400px; }
        #section-comparison .recharts-responsive-container { min-height: 350px !important; }
        
        /* Main content padding */
        main { padding-left: 16px !important; padding-right: 60px !important; }
    }
    
    /* Desktop - Large screens */
    @media (min-width: 1025px) {
        /* Full features visible */
        .floating-nav { right: 24px !important; }
    }
    
    /* Extra large screens */
    @media (min-width: 1440px) {
        main { max-width: 1800px; }
    }
    
    /* Print styles */
    @media print {
        .floating-nav, .header-bar, .admin-trigger { display: none !important; }
        main { padding: 0 !important; }
        .chart-container { break-inside: avoid; }
    }
`;

// 
// COMPOSANTS UTILITAIRES PREMIUM
// 

const SectionHeader = ({ number, color, title, subtitle, visible = true }) => {
    if (!visible) return null;
    return (
        <div className="flex items-center gap-4 mb-8">
            <div className={`section-badge ${color}`}>{number}</div>
            <div>
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">{title}</h2>
                {subtitle && <p className="text-[10px] text-zinc-600 mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );
};

const FloatingNav = ({ currentSection, visible = true }) => {
    if (!visible) return null;
    
    const sections = [
        { id: 'overview', label: 'Apercu', icon: '' },
        { id: 'comparison', label: 'Courbes', icon: '' },
        { id: 'analytics', label: 'Analytique', icon: '' },
        { id: 'historical', label: 'Historique', icon: '' },
    ];
    
    return (
        <div className="fixed right-6 top-[55%] -translate-y-1/2 z-40 floating-nav p-1.5 flex flex-col gap-0.5">
            <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="float-nav-btn ripple"
                title="Haut de page"
                aria-label="Aller en haut de page"
            ></button>
            <div className="h-px bg-white/5" />
            {sections.map(s => (
                <button
                    key={s.id}
                    onClick={() => document.getElementById(`section-${s.id}`)?.scrollIntoView({ behavior: 'smooth' })}
                    className={`float-nav-btn ripple ${currentSection === s.id ? 'active' : ''}`}
                    title={s.label}
                    aria-label={`Aller a la section ${s.label}`}
                    aria-current={currentSection === s.id ? 'true' : undefined}
                >{s.icon}</button>
            ))}
            <div className="h-px bg-white/5" />
            <button 
                onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                className="float-nav-btn ripple"
                title="Bas de page"
                aria-label="Aller en bas de page"
            ></button>
        </div>
    );
};

const PremiumLoader = () => (
    <div className="flex flex-col items-center justify-center h-screen bg-[#09090b]">
        <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-500/20 rounded-full" />
            <div className="w-20 h-20 border-4 border-transparent border-t-blue-500 rounded-full absolute inset-0 animate-spin" />
            <div className="w-12 h-12 border-4 border-transparent border-t-indigo-500 rounded-full absolute inset-0 m-auto animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
        </div>
        <div className="mt-8 text-center">
            <h1 className="text-2xl font-black tracking-tighter italic bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent animate-gradient">JLab Terminal</h1>
            <p className="text-[10px] text-zinc-600 uppercase tracking-[0.3em] mt-2 animate-pulse">Initialisation du moteur CurveWatch...</p>
        </div>
    </div>
);

// 
// CHARGEMENT DES COMPOSANTS V0
// 
const useV0Components = () => {
    const [ready, setReady] = useState(false);
    
    useEffect(() => {
        const loadAll = async () => {
            if (!window.V0Integration) return;
            try {
                const components = [
                    ['/yieldcurveanalytics/components/chart-controls.tsx', 'ChartControls'],
                    ['/yieldcurveanalytics/components/key-rates-summary.tsx', 'KeyRatesSummary'],
                    ['/yieldcurveanalytics/components/enhanced-controls-panel.tsx', 'EnhancedControlsPanel'],
                    ['/yieldcurveanalytics/components/maturity-selector.tsx', 'MaturitySelector'],
                    ['/yieldcurveanalytics/components/historical-curve-picker.tsx', 'HistoricalCurvePicker'],
                    ['/yieldcurveanalytics/components/expandable-card.tsx', 'ExpandableCard'],
                    ['/yieldcurveanalytics/components/curve-comparison-grid.tsx', 'CurveComparisonGrid'],
                    ['/yieldcurveanalytics/components/country-spread-chart.tsx', 'CountrySpreadChart'],
                    ['/yieldcurveanalytics/components/spread-analysis.tsx', 'SpreadAnalysisCard'],
                    ['/yieldcurveanalytics/components/country-spread-history.tsx', 'CountrySpreadHistory'],
                    ['/yieldcurveanalytics/components/spread-history-chart.tsx', 'SpreadHistoryChart'],
                    ['/yieldcurveanalytics/components/graph-filters.tsx', 'GraphFilters'],
                    ['/yieldcurveanalytics/components/yield-curve-chart.tsx', 'YieldCurveChart'],
                    ['/yieldcurveanalytics/components/forward-rates-chart.tsx', 'ForwardRatesChart'],
                    ['/yieldcurveanalytics/components/curve-metrics.tsx', 'CurveMetricsCard'],
                    ['/yieldcurveanalytics/components/butterfly-spreads.tsx', 'ButterflySpreadsCard'],
                    ['/yieldcurveanalytics/components/rate-decisions-history.tsx', 'RateDecisionsHistory'],
                ];
                for (const [path, name] of components) {
                    await window.V0Integration.loadV0Component(path, name);
                }
                const styleEl = document.createElement('style');
                styleEl.id = 'curvewatch-premium-css';
                styleEl.textContent = CSS_PREMIUM;
                if (!document.getElementById('curvewatch-premium-css')) {
                    document.head.appendChild(styleEl);
                }
                setReady(true);
            } catch (err) {
                console.error("CurveWatch: Component loading error", err);
            }
        };
        loadAll();
    }, []);
    
    return ready;
};

// 
// COMPOSANT PRINCIPAL - CEO Designer Edition v6 + Admin Panel
// 
export const CurveWatchV0 = () => {
    const componentsReady = useV0Components();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentSection, setCurrentSection] = useState('overview');
    
    // Admin Panel State
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const { config, updateConfig, resetConfig } = useAdminConfig();
    const adminClickRef = useRef({ count: 0, timer: null });

    // Etats de la page
    const [selectedCountries, setSelectedCountries] = useState(["US", "CA"]);
    const [interpolationMethod, setInterpolationMethod] = useState("cubic-spline");
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
    const [selectedMaturities, setSelectedMaturities] = useState(["1M", "3M", "6M", "1Y", "2Y", "3Y", "5Y", "7Y", "10Y", "20Y", "30Y"]);
    const [graphFilters, setGraphFilters] = useState({ showObserved: true, showInterpolated: true, scaleType: "linear", minMaturity: "1M", maxMaturity: "30Y", opacity: 1 });
    
    // Historical curves state
    const [historicalCurves, setHistoricalCurves] = useState([]);

    // Admin access via triple-click on logo or Ctrl+Shift+A
    const handleAdminAccess = useCallback(() => {
        adminClickRef.current.count++;
        if (adminClickRef.current.timer) clearTimeout(adminClickRef.current.timer);
        adminClickRef.current.timer = setTimeout(() => { adminClickRef.current.count = 0; }, 500);
        if (adminClickRef.current.count >= 3) {
            setShowAdminPanel(true);
            adminClickRef.current.count = 0;
        }
    }, []);

    // Keyboard shortcut for admin panel
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'A') {
                e.preventDefault();
                setShowAdminPanel(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Intersection Observer
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) setCurrentSection(entry.target.id.replace('section-', ''));
            });
        }, { threshold: 0.3 });
        ['overview', 'comparison', 'analytics', 'historical'].forEach(id => {
            const el = document.getElementById(`section-${id}`);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, [componentsReady]);

    const loadData = useCallback(async () => {
        let fetchFn = window.fetchYieldCurveWithCache || (async (country, date = null) => {
            const url = date 
                ? `/api/yield-curve?country=${country}&date=${date}`
                : `/api/yield-curve?country=${country}`;
            const res = await fetch(url);
            return await res.json();
        });
        try {
            setLoading(true);
            const res = await fetchFn("both");
            if (res && res.data) {
                const mapPoints = (rates) => (rates || []).map(r => ({ maturity: r.maturity, yield: r.rate, days: r.months * 30 }));
                setData({
                    "US": { points: mapPoints(res.data.us?.rates), policyRate: res.data.us?.policyRate || 4.33 },
                    "CA": { points: mapPoints(res.data.canada?.rates), policyRate: res.data.canada?.policyRate || 3.25 }
                });
            }
        } catch (e) {
            console.error("CurveWatch: Data loading error", e);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load historical curve data
    const loadHistoricalCurve = useCallback(async (date, country) => {
        try {
            const url = `/api/yield-curve?country=${country}&date=${date}`;
            const res = await fetch(url);
            const json = await res.json();
            
            if (json && json.data) {
                const countryKey = country === 'us' ? 'us' : 'canada';
                const rates = json.data[countryKey]?.rates || [];
                return {
                    rates: rates.map(r => ({ maturity: r.maturity, yield: r.rate, days: r.months * 30 })),
                    date: json.data[countryKey]?.date || date,
                    source: json.data[countryKey]?.source
                };
            }
            return null;
        } catch (e) {
            console.error("CurveWatch: Historical data loading error", e);
            return null;
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    if (!componentsReady || loading) return <PremiumLoader />;

    const usData = data?.["US"]?.points || [];
    const caData = data?.["CA"]?.points || [];
    const filteredUsData = usData.filter(p => selectedMaturities.includes(p.maturity));
    const filteredCaData = caData.filter(p => selectedMaturities.includes(p.maturity));

    // Build curves array with current + historical
    const curves = [];
    
    // Current curves (solid lines)
    if (selectedCountries.includes("US")) {
        curves.push({ 
            country: "US", 
            label: "US (Actuel)",
            observedPoints: filteredUsData, 
            interpolatedPoints: window.interpolateYieldCurve?.(filteredUsData, interpolationMethod) || [], 
            color: "#3b82f6", 
            isCurrent: true,
            strokeStyle: "solid"
        });
    }
    if (selectedCountries.includes("CA")) {
        curves.push({ 
            country: "CA", 
            label: "CA (Actuel)",
            observedPoints: filteredCaData, 
            interpolatedPoints: window.interpolateYieldCurve?.(filteredCaData, interpolationMethod) || [], 
            color: "#ef4444", 
            isCurrent: true,
            strokeStyle: "solid"
        });
    }
    
    // Historical curves (dashed lines)
    historicalCurves.forEach(hCurve => {
        if (hCurve.data && hCurve.data.rates) {
            const filteredHistorical = hCurve.data.rates.filter(p => selectedMaturities.includes(p.maturity));
            curves.push({
                country: hCurve.country,
                label: `${hCurve.country} (${hCurve.date})`,
                observedPoints: filteredHistorical,
                interpolatedPoints: window.interpolateYieldCurve?.(filteredHistorical, interpolationMethod) || [],
                color: hCurve.color,
                isCurrent: false,
                isHistorical: true,
                strokeStyle: "dashed",
                date: hCurve.date
            });
        }
    });

    const toggleCountry = (c) => setSelectedCountries(s => s.includes(c) ? (s.length > 1 ? s.filter(x => x !== c) : s) : [...s, c]);
    const anim = config.ui.animations ? 'animate-fade-in-up' : '';

    return (
        <div className="min-h-screen bg-[#09090b] text-white selection:bg-blue-500/30">
            
            {/* Admin Panel */}
            <AdminPanel 
                isOpen={showAdminPanel} 
                onClose={() => setShowAdminPanel(false)} 
                config={config} 
                updateConfig={updateConfig}
                resetConfig={resetConfig}
            />

            {/* Hidden Admin Trigger */}
            <button className="admin-trigger" onClick={handleAdminAccess} title="Triple-clic ou Ctrl+Shift+A pour Admin" />

            {/* HEADER - Responsive */}
            {config.header.enabled && (
                <header className="header-bar sticky top-0 z-50">
                    <div className="max-w-[1800px] mx-auto px-3 sm:px-6 py-3 sm:py-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-6">
                            {/* Left section - Country & Engine */}
                            <div className="flex items-center gap-3 sm:gap-8">
                                {config.header.countrySelector && (
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <span className="hidden sm:block text-[10px] font-black text-zinc-600 uppercase tracking-widest">Pays</span>
                                        <div className="flex gap-1 sm:gap-2">
                                            {[{ code: "US", flag: "", label: "Etats-Unis" }, { code: "CA", flag: "", label: "Canada" }].map(c => (
                                                <button key={c.code} onClick={() => toggleCountry(c.code)} className={`country-pill ${selectedCountries.includes(c.code) ? 'selected' : ''}`} title={c.label}>{c.flag}</button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {config.header.interpolationSelector && (
                                    <>
                                        <div className="h-8 w-px bg-white/10 hidden lg:block" />
                                        <div className="hidden md:flex items-center gap-3">
                                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Moteur</span>
                                            <window.Select value={interpolationMethod} onValueChange={setInterpolationMethod}>
                                                <window.SelectTrigger className="input-premium h-9 sm:h-10 w-36 sm:w-44 text-[11px] sm:text-[12px]"><window.SelectValue /></window.SelectTrigger>
                                                <window.SelectContent>
                                                    <window.SelectItem value="linear">Lineaire</window.SelectItem>
                                                    <window.SelectItem value="cubic-spline">Spline Cubique</window.SelectItem>
                                                    <window.SelectItem value="nelson-siegel">Nelson-Siegel</window.SelectItem>
                                                    <window.SelectItem value="monotone-cubic">Monotone Cubique</window.SelectItem>
                                                </window.SelectContent>
                                            </window.Select>
                                        </div>
                                    </>
                                )}
                            </div>
                            
                            {/* Center - Brand (hidden on small screens) */}
                            {config.header.brandLabel && (
                                <div className="hidden xl:flex flex-col items-center cursor-pointer group" onClick={handleAdminAccess}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                            <span className="text-[10px] font-black text-white">J</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-zinc-300 uppercase tracking-wider group-hover:text-white transition-colors">JLab Terminal</span>
                                            <span className="text-[9px] text-zinc-600 tracking-wide">by JSLAI</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Right section - Date & Refresh */}
                            <div className="flex items-center gap-2 sm:gap-4">
                                {config.header.dateSelector && (
                                    <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="input-premium h-9 sm:h-10 w-32 sm:w-40 text-[11px] sm:text-[12px]" />
                                )}
                                {config.header.refreshButton && (
                                    <button onClick={loadData} className="btn-premium text-[10px] sm:text-[11px] font-bold tracking-wide px-3 sm:px-5 py-2 sm:py-2.5">
                                        <span className="hidden sm:inline">Actualiser</span>
                                        <span className="sm:hidden"></span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </header>
            )}

            {/* Floating Navigation */}
            <FloatingNav currentSection={currentSection} visible={config.floatingNav.enabled} />

            {/* MAIN CONTENT - Full width for charts, responsive padding */}
            <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12 pr-4 sm:pr-16 lg:pr-20">
                
                {/* SECTION 1: HERO + KPIs */}
                {config.sections.hero.enabled && (
                    <section id="section-overview" className="scroll-mt-20 mb-12 sm:mb-20">
                        <div className={`relative mb-8 sm:mb-12 ${anim}`}>
                            <div className="absolute -left-2 sm:-left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-500 rounded-full" />
                            <div className="pl-4 sm:pl-8">
                                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                                    <div className={`section-badge blue ${config.ui.glowEffects ? 'animate-pulse-glow' : ''}`}>1</div>
                                    <span className="text-[9px] sm:text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] sm:tracking-[0.3em]">Dashboard Principal</span>
                                </div>
                                {config.sections.hero.title && (
                                    <div className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-4">
                                        <h1 className="hero-title text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter italic">
                                            <span className="bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent">CurveWatch</span>
                                        </h1>
                                        <div className="mb-0 sm:mb-3 flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 w-fit">
                                            <div className="w-3 sm:w-4 h-3 sm:h-4 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                                <span className="text-[7px] sm:text-[8px] font-black text-white">J</span>
                                            </div>
                                            <span className="text-[9px] sm:text-[10px] font-semibold text-blue-400">Propulse par <span className="text-white">JLab Terminal</span></span>
                                        </div>
                                    </div>
                                )}
                                {config.sections.hero.subtitle && (
                                    <p className="text-xs sm:text-sm text-zinc-600 mt-2 sm:mt-3 font-semibold tracking-wide">Intelligence Obligataire en Temps Reel - Tresor US & Canada - <span className="text-zinc-500">Une solution JSLAI</span></p>
                                )}
                                {/* Export buttons - mobile below, desktop right */}
                                {config.sections.hero.exportButtons && (
                                    <div className="flex gap-2 sm:gap-3 mt-4 lg:hidden export-buttons">
                                        <button className="btn-ghost text-[10px] sm:text-[11px] font-semibold px-3 py-2"> CSV</button>
                                        <button className="btn-ghost text-[10px] sm:text-[11px] font-semibold px-3 py-2"> PDF</button>
                                    </div>
                                )}
                            </div>
                            {config.sections.hero.exportButtons && (
                                <div className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 gap-3 export-buttons">
                                    <button className="btn-ghost text-[11px] font-semibold"> Exporter CSV</button>
                                    <button className="btn-ghost text-[11px] font-semibold"> Rapport PDF</button>
                                </div>
                            )}
                        </div>
                        {config.sections.kpiSummary.enabled && window.KeyRatesSummary && (
                            <div className={`${anim} stagger-2`}>
                                <window.KeyRatesSummary usData={usData} caData={caData} usPolicyRate={data?.["US"]?.policyRate || 4.33} caPolicyRate={data?.["CA"]?.policyRate || 3.25} />
                            </div>
                        )}
                    </section>
                )}

                {/* CONTROLS BAR - Horizontal layout, stacks on mobile */}
                {config.sidebar.enabled && (
                    <div className={`mb-8 sm:mb-12 ${anim} stagger-1`}>
                        <div className={`${config.ui.glassmorphism ? 'glass-card' : 'section-card'} p-4 sm:p-6`}>
                            <div className="controls-bar flex flex-wrap items-start gap-4 sm:gap-8">
                                {/* Controls Panel - Compact */}
                                {config.sidebar.controlsPanel && window.EnhancedControlsPanel && (
                                    <div className="flex-1 min-w-full sm:min-w-[300px]">
                                        <window.EnhancedControlsPanel method={interpolationMethod} onMethodChange={setInterpolationMethod} date={selectedDate} onDateChange={setSelectedDate} selectedCountries={selectedCountries} onCountriesChange={setSelectedCountries} />
                                    </div>
                                )}
                                {/* Maturity Selector - Compact */}
                                {config.sidebar.maturitySelector && window.MaturitySelector && (
                                    <div className="flex-1 min-w-full sm:min-w-[300px]">
                                        <window.MaturitySelector selectedMaturities={selectedMaturities} onMaturitiesChange={setSelectedMaturities} />
                                    </div>
                                )}
                                {/* Historical Curve Picker */}
                                {window.HistoricalCurvePicker && (
                                    <div className="flex-1 min-w-full sm:min-w-[320px] lg:min-w-[350px]">
                                        <window.HistoricalCurvePicker 
                                            selectedCurves={historicalCurves}
                                            onCurvesChange={setHistoricalCurves}
                                            onLoadCurve={loadHistoricalCurve}
                                            maxCurves={5}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* FULL-WIDTH SECTIONS */}
                <div className="space-y-16">
                    
                    {/* SECTION 2: YIELD CURVES - FULL WIDTH */}
                    {config.sections.yieldCurves.enabled && (
                        <section id="section-comparison" className={`scroll-mt-20 ${anim} stagger-2`}>
                            <SectionHeader number="2" color="indigo" title="Analyse des Courbes" subtitle="Visualisation comparative US vs Canada" />
                            <div className="chart-container chart-fullwidth">
                                {window.YieldCurveChart && <window.YieldCurveChart curves={curves} graphFilters={graphFilters} />}
                            </div>
                        </section>
                    )}

                    {/* SECTION 3: COMPARISON GRID - FULL WIDTH */}
                    {config.sections.comparisonGrid.enabled && (
                        <section className={`${anim} stagger-3`}>
                            <SectionHeader number="3" color="emerald" title="Matrice des Rendements" subtitle="Comparaison par maturite" />
                            <div className="section-card p-6">
                                {window.CurveComparisonGrid && <window.CurveComparisonGrid usData={filteredUsData} caData={filteredCaData} />}
                            </div>
                        </section>
                    )}

                    {/* SECTION 4: SPREADS - FULL WIDTH */}
                    {config.sections.spreads.enabled && (
                        <section className={`${anim} stagger-4`}>
                            <SectionHeader number="4" color="purple" title="Ecarts de Rendement" subtitle="Analyse des spreads et risques" />
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {config.sections.spreads.spreadChart && window.CountrySpreadChart && (
                                    <div className="section-card p-6 chart-fullwidth"><window.CountrySpreadChart usData={filteredUsData} caData={filteredCaData} /></div>
                                )}
                                {config.sections.spreads.spreadAnalysis && window.SpreadAnalysisCard && window.calculateSpreads && (
                                    <div className="section-card p-6"><window.SpreadAnalysisCard spreads={window.calculateSpreads(usData)} /></div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* SECTION 5: ANALYTICS - FULL WIDTH */}
                    {config.sections.analytics.enabled && (
                        <section id="section-analytics" className={`scroll-mt-20 ${anim} stagger-5`}>
                            <SectionHeader number="5" color="amber" title="Metriques Avancees" subtitle="Forward rates, butterflies et metriques de courbe" />
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {config.sections.analytics.forwardRates && window.ForwardRatesChart && window.calculateForwardRates && (
                                    <div className="section-card p-6 lg:col-span-2 chart-fullwidth"><window.ForwardRatesChart forwards={window.calculateForwardRates(usData)} spotRate={usData.find(p => p.maturity === "10Y")?.yield} /></div>
                                )}
                                {config.sections.analytics.butterflies && window.ButterflySpreadsCard && window.calculateButterflySpreads && (
                                    <div className="section-card p-6"><window.ButterflySpreadsCard spreads={window.calculateButterflySpreads(usData)} /></div>
                                )}
                            </div>
                            {config.sections.analytics.curveMetrics && window.CurveMetricsCard && window.calculateEnhancedCurveMetrics && (
                                <div className="section-card p-6 mt-6"><window.CurveMetricsCard metrics={window.calculateEnhancedCurveMetrics(usData)} /></div>
                            )}
                        </section>
                    )}

                    {/* SECTION 6: HISTORICAL - FULL WIDTH */}
                    {config.sections.historical.enabled && (
                        <section id="section-historical" className="scroll-mt-20 pb-20">
                            <SectionHeader number="6" color="rose" title="Contexte Historique" subtitle="Evolution temporelle et decisions de taux" />
                            {/* Full-width spread history chart */}
                            {config.sections.historical.spreadHistoryChart && window.SpreadHistoryChart && (
                                <div className="section-card p-6 mb-6 chart-fullwidth"><window.SpreadHistoryChart /></div>
                            )}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                {config.sections.historical.spreadHistory && window.CountrySpreadHistory && (
                                    <div className="section-card p-6"><window.CountrySpreadHistory /></div>
                                )}
                                {config.sections.historical.rateDecisions && window.RateDecisionsHistory && (
                                    <div className="section-card p-6"><window.RateDecisionsHistory /></div>
                                )}
                            </div>
                        </section>
                    )}
                </div>
            </main>

            {/* FOOTER */}
            {config.footer.enabled && (
                <footer className="border-t border-white/5 py-10 mt-16 bg-gradient-to-t from-black/40 to-transparent">
                    <div className="max-w-[1600px] mx-auto px-6">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            {/* Branding Principal */}
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-blue-500/30">
                                        <span className="text-lg font-black text-white">J</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-white tracking-wide">CurveWatch</span>
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Propulse par <span className="text-blue-400 font-semibold">JLab Terminal</span></span>
                                    </div>
                                </div>
                                <div className="h-8 w-px bg-white/10 hidden md:block" />
                                <div className="hidden md:flex flex-col">
                                    <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Une solution</span>
                                    <span className="text-xs font-bold text-zinc-400">JSLAI</span>
                                </div>
                            </div>
                            
                            {/* Centre - Version */}
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/50 border border-zinc-800">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[11px] text-zinc-400">v7.0</span>
                                <span className="text-[10px] text-zinc-600">-</span>
                                <span className="text-[10px] text-zinc-500">Intelligence Obligataire</span>
                            </div>
                            
                            {/* Droite - Sources & Date */}
                            <div className="flex flex-col items-end gap-1 text-[11px]">
                                <div className="flex items-center gap-2 text-zinc-500">
                                    <span>Sources:</span>
                                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-medium">FRED</span>
                                    <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px] font-medium">BOC</span>
                                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-medium">FMP</span>
                                </div>
                                <span className="text-zinc-600">Mise a jour: {new Date().toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                        </div>
                        
                        {/* Copyright */}
                        <div className="mt-6 pt-6 border-t border-white/5 text-center">
                            <p className="text-[10px] text-zinc-700">
                                 {new Date().getFullYear()} JSLAI Inc. Tous droits reserves. JLab TerminalTM est une marque de JSLAI.
                            </p>
                        </div>
                    </div>
                </footer>
            )}
        </div>
    );
};

// Export global
if (typeof window !== 'undefined') {
    window.CurveWatchV0 = CurveWatchV0;
    console.log(' CurveWatchV0 v7.0 - Courbes Historiques + Propulse par JLab Terminal de JSLAI');
}
