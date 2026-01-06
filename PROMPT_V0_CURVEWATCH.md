# 📋 Prompt v0 - CurveWatch Component pour JLab

## 🎯 Objectif
Créer un composant **CurveWatch** qui sera intégré comme sous-onglet dans **JLab** du dashboard GOB. Le composant doit visualiser les courbes de taux (yield curves) pour les États-Unis et le Canada avec des fonctionnalités avancées.

---

## 🛠️ STACK TECHNIQUE COMPLÈTE

### Frontend Core
- **React**: `19.2.1` (Hooks uniquement, composants fonctionnels)
- **TypeScript**: `5.9.3` (Strict typing préféré, mais JSX accepté pour compatibilité)
- **Tailwind CSS**: `3.4.1` (Utility-first, **PAS de styles inline**)
- **Babel Standalone**: Runtime (pour dashboard legacy - **OBLIGATOIRE**: `window.ComponentName`)

### Build Tools
- **Vite**: `7.2.2` (Dev server & build)
- **esbuild**: `0.27.2` (Bundle components)
- **Babel Standalone**: Runtime (parsing JSX inline dans navigateur)

### Bibliothèques Disponibles
- **Recharts**: `2.10.3` (Chargé via CDN: `https://unpkg.com/recharts@2.10.3/dist/Recharts.js`)
  - Accessible via `window.Recharts`
  - Composants: `LineChart`, `Line`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `ResponsiveContainer`, `BarChart`, `Bar`, `Legend`, `AreaChart`, `Area`
- **React Grid Layout**: `2.1.1` (pour layout draggable)
- **Supabase**: `2.87.1` (PostgreSQL + Auth + Realtime)

### Backend/APIs
- **Vercel Serverless**: API routes dans `/api`
- **Supabase**: Base de données PostgreSQL
- **APIs externes**: Google Gemini, Anthropic Claude, Perplexity

---

## ⚠️ CONVENTIONS CRITIQUES (À RESPECTER ABSOLUMENT)

### 1. **Ordre de Déclaration (40% des erreurs)**
```javascript
// ❌ MAUVAIS: Variable utilisée avant définition
const [config, setConfig] = useState(() => {
    barTypes.forEach(/* ... */); // ❌ barTypes n'existe pas encore !
});

const barTypes = [/* ... */]; // Défini APRÈS

// ✅ BON: Toujours définir AVANT useState
const barTypes = [/* ... */]; // Défini AVANT

const [config, setConfig] = useState(() => {
    barTypes.forEach(/* ... */); // ✅ barTypes existe maintenant
});
```

**Règle**: **TOUJOURS** définir toutes les variables/constantes **AVANT** leur utilisation dans les initialiseurs de `useState`.

### 2. **Exposition Globale pour Babel Inline (35% des erreurs)**
```javascript
// ✅ OBLIGATOIRE: Exposer le composant globalement
const CurveWatchTab = ({ isDarkMode }) => {
    // ... composant
};

// ✅ CRITIQUE: Exposer via window pour Babel inline
window.CurveWatchTab = CurveWatchTab;
```

**Règle**: Tous les composants chargés via `<script type="text/babel">` **DOIVENT** être exposés via `window.ComponentName`.

### 3. **Références Protégées**
```javascript
// ❌ MAUVAIS: Accès direct sans vérification
const value = window.SomeComponent;

// ✅ BON: Toujours vérifier avec typeof
const value = typeof window.SomeComponent !== 'undefined' 
    ? window.SomeComponent 
    : defaultValue;
```

### 4. **Z-Index Hierarchy**
- **Modals**: `z-index: 10000+`
- **Dropdowns**: `z-index: 9999`
- **Content**: `z-index: 1-100`
- **Background**: `z-index: 0`

**Pour dropdowns avec parent `overflow`**: Utiliser `position: fixed` + calcul dynamique de position.

### 5. **Variables d'Environnement**
```javascript
// ❌ MAUVAIS: import.meta.env dans Babel inline
const apiKey = import.meta.env.VITE_API_KEY;

// ✅ BON: Multi-méthode fallback
const apiKey = window.importMetaEnv?.VITE_API_KEY 
    || document.querySelector('meta[name="api-key"]')?.content
    || 'default-value';
```

### 6. **CSS - Tailwind UNIQUEMENT**
```javascript
// ❌ MAUVAIS: Styles inline
<div style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>

// ✅ BON: Classes Tailwind
<div className="bg-gray-900 text-white">
```

**Exception**: Variables CSS de thème dynamiques (voir section Thème).

---

## 🎨 DESIGN SYSTEM & THÈME

### Thème Dark/Light
Le composant **DOIT** supporter le thème dark/light via prop `isDarkMode`:

```javascript
const CurveWatchTab = ({ isDarkMode = true }) => {
    // Hook pour détecter le thème
    const useDarkMode = () => {
        const [isDark, setIsDark] = useState(() => {
            if (window.GOBThemes) {
                return window.GOBThemes.getCurrentTheme() === 'dark';
            }
            return document.documentElement.getAttribute('data-theme') === 'dark';
        });

        useEffect(() => {
            const handleThemeChange = () => {
                if (window.GOBThemes) {
                    setIsDark(window.GOBThemes.getCurrentTheme() === 'dark');
                } else {
                    setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
                }
            };
            window.addEventListener('themeChanged', handleThemeChange);
            return () => window.removeEventListener('themeChanged', handleThemeChange);
        }, []);

        return isDark;
    };

    const isDark = useDarkMode();
    
    // Couleurs de thème
    const colors = useMemo(() => ({
        background: isDark ? '#1a1a2e' : '#ffffff',
        cardBg: isDark ? '#16213e' : '#f8f9fa',
        text: isDark ? '#e0e0e0' : '#333333',
        textMuted: isDark ? '#888888' : '#666666',
        border: isDark ? '#2d3748' : '#e2e8f0',
        grid: isDark ? '#2d3748' : '#e2e8f0',
        primary: '#3b82f6',
        secondary: '#ef4444',
        success: '#22c55e',
        error: '#ef4444',
    }), [isDark]);
    
    return (
        <div className={`${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
            {/* Contenu */}
        </div>
    );
};
```

### Classes Tailwind Communes
```javascript
// Containers
className={`p-4 rounded-lg ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}

// Text
className={`${isDark ? 'text-white' : 'text-gray-900'}`}
className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}

// Buttons
className={`px-4 py-2 rounded-lg transition-colors ${
    isDark 
        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
        : 'bg-blue-500 hover:bg-blue-600 text-white'
}`}

// Cards
className={`rounded-xl p-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'} border shadow-lg`}
```

---

## 📦 STRUCTURE DU COMPOSANT

### Nom du Fichier
`public/js/dashboard/components/tabs/CurveWatchTab.js`

### Structure de Base
```javascript
/**
 * CurveWatchTab - Visualisation des courbes de taux US & Canada
 * 
 * Features:
 * - Courbes de taux en temps réel (US & Canada)
 * - Graphiques interactifs Recharts avec zoom/pan
 * - Comparaison historique
 * - Analyse des spreads (10Y-2Y)
 * - Cartes de taux en direct
 */

const { useState, useEffect, useCallback, useMemo, useRef } = React;
const { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Legend 
} = window.Recharts || {};

// Hook pour détecter le thème
const useDarkMode = () => {
    const [isDark, setIsDark] = useState(() => {
        if (window.GOBThemes) {
            return window.GOBThemes.getCurrentTheme() === 'dark';
        }
        return document.documentElement.getAttribute('data-theme') === 'dark';
    });

    useEffect(() => {
        const handleThemeChange = () => {
            if (window.GOBThemes) {
                setIsDark(window.GOBThemes.getCurrentTheme() === 'dark');
            } else {
                setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
            }
        };
        window.addEventListener('themeChanged', handleThemeChange);
        return () => window.removeEventListener('themeChanged', handleThemeChange);
    }, []);

    return isDark;
};

// Couleurs de thème
const getThemeColors = (isDark) => ({
    background: isDark ? '#1a1a2e' : '#ffffff',
    cardBg: isDark ? '#16213e' : '#f8f9fa',
    text: isDark ? '#e0e0e0' : '#333333',
    textMuted: isDark ? '#888888' : '#666666',
    border: isDark ? '#2d3748' : '#e2e8f0',
    grid: isDark ? '#2d3748' : '#e2e8f0',
    usLine: '#3b82f6',
    canadaLine: '#ef4444',
    spreadPositive: '#22c55e',
    spreadNegative: '#ef4444',
    tooltip: isDark ? '#1e293b' : '#ffffff',
});

// Composant principal
const CurveWatchTab = ({ isDarkMode = true }) => {
    const isDark = useDarkMode();
    const colors = useMemo(() => getThemeColors(isDark), [isDark]);

    // State management
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentData, setCurrentData] = useState({ us: null, canada: null });
    const [historicalData, setHistoricalData] = useState({ us: [], canada: [] });
    const [selectedPeriod, setSelectedPeriod] = useState('1m');
    const [activeView, setActiveView] = useState('curves'); // 'curves', 'spread', 'compare'
    const [showCanada, setShowCanada] = useState(true);
    const [showUS, setShowUS] = useState(true);

    // Charger Recharts si nécessaire
    useEffect(() => {
        if (window.Recharts && window.Recharts.LineChart) return;
        
        if (window.__rechartsLoading) return;
        window.__rechartsLoading = true;
        
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/recharts@2.10.3/dist/Recharts.js';
        script.async = true;
        script.onload = () => {
            window.__rechartsLoading = false;
            // Force re-render
            setLoading(prev => !prev);
        };
        document.head.appendChild(script);
    }, []);

    // Fetch data
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            // API call ici
            const response = await fetch('/api/yield-curve/current');
            const data = await response.json();
            setCurrentData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Render
    if (loading) {
        return (
            <div className={`flex items-center justify-center h-full ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Chargement des courbes de taux...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`p-4 rounded-lg ${isDark ? 'bg-red-900/20 border-red-500' : 'bg-red-50 border-red-200'} border`}>
                <p className={isDark ? 'text-red-400' : 'text-red-600'}>Erreur: {error}</p>
            </div>
        );
    }

    return (
        <div className={`h-full flex flex-col ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            {/* Header avec contrôles */}
            <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Courbes de Taux
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveView('curves')}
                            className={`px-3 py-1 rounded-lg text-sm ${
                                activeView === 'curves'
                                    ? isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                                    : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                            }`}
                        >
                            Courbes
                        </button>
                        <button
                            onClick={() => setActiveView('spread')}
                            className={`px-3 py-1 rounded-lg text-sm ${
                                activeView === 'spread'
                                    ? isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                                    : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                            }`}
                        >
                            Spread
                        </button>
                    </div>
                </div>
                
                {/* Toggles US/Canada */}
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showUS}
                            onChange={(e) => setShowUS(e.target.checked)}
                            className="w-4 h-4"
                        />
                        <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>États-Unis</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showCanada}
                            onChange={(e) => setShowCanada(e.target.checked)}
                            className="w-4 h-4"
                        />
                        <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Canada</span>
                    </label>
                </div>
            </div>

            {/* Graphique */}
            <div className="flex-1 p-4">
                {window.Recharts && window.Recharts.LineChart ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                            <XAxis dataKey="maturity" stroke={colors.textMuted} />
                            <YAxis stroke={colors.textMuted} />
                            <Tooltip 
                                contentStyle={{
                                    backgroundColor: colors.tooltip,
                                    border: `1px solid ${colors.border}`,
                                    color: colors.text
                                }}
                            />
                            <Legend />
                            {showUS && (
                                <Line 
                                    type="monotone" 
                                    dataKey="us" 
                                    stroke={colors.usLine} 
                                    strokeWidth={2}
                                    dot={false}
                                />
                            )}
                            {showCanada && (
                                <Line 
                                    type="monotone" 
                                    dataKey="canada" 
                                    stroke={colors.canadaLine} 
                                    strokeWidth={2}
                                    dot={false}
                                />
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className={`flex items-center justify-center h-full ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Chargement de Recharts...
                    </div>
                )}
            </div>
        </div>
    );
};

// ✅ CRITIQUE: Exposer globalement pour Babel inline
window.CurveWatchTab = CurveWatchTab;

console.log('CurveWatchTab loaded');
```

---

## 🔌 INTÉGRATION DANS JLAB

### 1. Ajouter dans SUB_TABS
Fichier: `public/js/dashboard/app-inline.js`

```javascript
'jlab': [
    { id: 'jlab-terminal', label: 'Terminal', icon: 'Terminal', component: 'JLabTab' },
    { id: 'jlab-advanced', label: 'Analyse Pro', icon: 'Activity', component: 'AdvancedAnalysisTab' },
    { id: 'jlab-compare', label: 'Comparaison', icon: 'GitCompare', component: 'FinanceProPanel:compare' },
    { id: 'jlab-screener', label: 'Screener', icon: 'Search', component: 'FinanceProPanel:screener' },
    { id: 'jlab-fastgraphs', label: 'FastGraphs', icon: 'BarChart3', component: 'FastGraphsTab' },
    { id: 'jlab-curvewatch', label: 'CurveWatch', icon: 'TrendingUp', component: 'CurveWatchTab' } // ✅ NOUVEAU
],
```

### 2. Ajouter dans TAB_ID_MAPPING
```javascript
'jlab-curvewatch': { main: 'jlab', sub: 'jlab-curvewatch' },
```

### 3. Ajouter dans TAB_TO_WIDGET_MAP
Fichier: `public/js/dashboard/components/grid-layout/DashboardGridWrapper.js`

```javascript
'jlab-curvewatch': { 
    component: 'CurveWatchTab', 
    label: 'CurveWatch', 
    icon: 'TrendingUp', 
    defaultSize: { w: 12, h: 12 }, 
    minSize: { w: 8, h: 8 } 
},
```

### 4. Ajouter Handler de Rendu
Fichier: `public/js/dashboard/app-inline.js`

```javascript
{activeTab === 'jlab-curvewatch' && window.CurveWatchTab && (
    <window.CurveWatchTab 
        key={`jlab-curvewatch-${tabMountKeys['jlab-curvewatch'] || 0}`} 
        isDarkMode={isDarkMode} 
    />
)}
```

### 5. Charger le Script
Fichier: `public/js/dashboard/tab-lazy-loader.js`

```javascript
'jlab-curvewatch': '/js/dashboard/components/tabs/CurveWatchTab.js',
```

---

## 📚 EXEMPLES DE COMPOSANTS SIMILAIRES

### Référence: CurveWatchContainer (existant)
- Fichier: `public/js/dashboard/components/CurveWatch/CurveWatchContainer.js`
- Utilise Recharts pour visualisation
- Supporte thème dark/light
- Gère les données US & Canada
- Inclut comparaison historique

### Référence: AdvancedAnalysisTab
- Fichier: `public/js/dashboard/components/tabs/AdvancedAnalysisTab.js`
- Structure de composant JLab
- Utilise `isDarkMode` prop
- Charge données depuis Supabase
- Gère états de chargement/erreur

### Référence: YieldCurveTab
- Fichier: `public/js/dashboard/components/tabs/YieldCurveTab.js`
- Visualisation courbes de taux
- Utilise TradingView widgets (alternative)

---

## 🎯 FONCTIONNALITÉS REQUISES

### Core Features
1. **Courbes de taux en temps réel**
   - États-Unis (US Treasury)
   - Canada (Government of Canada)
   - Maturités: 1M, 3M, 6M, 1Y, 2Y, 3Y, 5Y, 7Y, 10Y, 20Y, 30Y

2. **Graphiques interactifs**
   - Zoom/pan avec Recharts
   - Tooltips avec détails
   - Légende cliquable pour show/hide

3. **Vues multiples**
   - Vue courbes (US + Canada)
   - Vue spread (10Y-2Y)
   - Vue comparaison historique

4. **Contrôles**
   - Toggle US/Canada
   - Sélection période (1M, 3M, 6M, 1Y, 5Y)
   - Date picker pour comparaison

5. **Cartes de taux**
   - Affichage des taux clés (2Y, 5Y, 10Y, 30Y)
   - Variation vs précédent
   - Indicateurs visuels (↑↓)

### API Endpoints
- `/api/yield-curve/current` - Données actuelles
- `/api/yield-curve/historical?period=1m` - Données historiques
- `/api/yield-curve/compare?date=2024-01-01` - Comparaison date

---

## ✅ CHECKLIST DE VALIDATION

- [ ] Composant exposé via `window.CurveWatchTab`
- [ ] Support thème dark/light complet
- [ ] Utilise Tailwind CSS uniquement (pas de styles inline)
- [ ] Toutes variables définies AVANT useState
- [ ] Références protégées avec `typeof`
- [ ] Gestion d'erreurs robuste
- [ ] États de chargement affichés
- [ ] Recharts chargé dynamiquement si nécessaire
- [ ] Responsive design
- [ ] Accessible (ARIA labels, keyboard navigation)

---

## 🚀 COMMANDES UTILES

```bash
# Lancer le serveur de dev
npm run dev

# Vérifier les lints
npm run lint

# Build
npm run build
```

---

## 📝 NOTES FINALES

- Le composant sera chargé via Babel Standalone dans le navigateur
- **OBLIGATOIRE**: Exposer via `window.CurveWatchTab`
- Utiliser les hooks React (useState, useEffect, useCallback, useMemo)
- Gérer les cas où Recharts n'est pas encore chargé
- Suivre les patterns des composants existants (AdvancedAnalysisTab, YieldCurveTab)
- Tester avec thème dark ET light
- Optimiser les performances (memoization, lazy loading)

---

**Bon développement ! 🚀**
