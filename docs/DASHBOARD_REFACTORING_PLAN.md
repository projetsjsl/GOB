# 🏗️ Dashboard Refactoring Plan - GOB Beta Combined Dashboard

**Date:** 2025-10-16
**Fichier Actuel:** `public/beta-combined-dashboard.html` (14,244 lignes)
**Objectif:** Découper en modules réutilisables selon bonnes pratiques React

---

## 📊 ÉTAT ACTUEL

### Statistiques
- **Lignes Total:** 14,244
- **Fonctions:** ~494
- **Onglets:** 12 (JLab, Ask Emma, Emma En Direct, Stocks & News, Economic Calendar, Earnings Calendar, Watchlist, Screener, Portfolio, Settings, Alerts, Help)
- **Format:** Mono-fichier HTML avec React via Babel

### Structure Actuelle
```
beta-combined-dashboard.html
├── <!DOCTYPE html>
├── <head> (CDN React, Babel, Recharts, etc.)
├── <body>
│   └── <div id="root"></div>
│   └── <script type="text/babel">
│       ├── React Components (inline)
│       ├── State Management (useState hooks)
│       ├── API Calls (fetch)
│       ├── Utility Functions
│       └── Render Logic
└── </body>
```

### Problèmes Identifiés
1. **Maintenabilité:** Impossible de trouver rapidement une fonction
2. **Performance:** 14K lignes chargées même si 1 seul onglet utilisé
3. **Duplication:** Code répété entre onglets (ex: fetch patterns)
4. **Testabilité:** Pas de tests unitaires possibles
5. **Collaboration:** Conflits git sur gros fichier monolithique

---

## 🎯 ARCHITECTURE CIBLE

### Structure Modulaire Proposée
```
/src
├── /components
│   ├── /tabs
│   │   ├── JLabTab.jsx
│   │   ├── AskEmmaTab.jsx
│   │   ├── EmmaEnDirectTab.jsx
│   │   ├── StocksNewsTab.jsx
│   │   ├── EconomicCalendarTab.jsx
│   │   ├── EarningsCalendarTab.jsx
│   │   ├── WatchlistTab.jsx
│   │   ├── ScreenerTab.jsx
│   │   ├── PortfolioTab.jsx
│   │   ├── SettingsTab.jsx
│   │   ├── AlertsTab.jsx
│   │   └── HelpTab.jsx
│   ├── /shared
│   │   ├── Header.jsx
│   │   ├── Sidebar.jsx
│   │   ├── TabBar.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── MessageBanner.jsx
│   │   └── DataTable.jsx
│   └── /charts
│       ├── LineChart.jsx
│       ├── BarChart.jsx
│       ├── PieChart.jsx
│       └── CandlestickChart.jsx
├── /hooks
│   ├── useEmmaAgent.js
│   ├── useMarketData.js
│   ├── useWatchlist.js
│   ├── useLocalStorage.js
│   └── useSupabase.js
├── /utils
│   ├── api.js               // Fetch wrappers
│   ├── formatting.js        // Number/date formatting
│   ├── calculations.js      // Financial calculations
│   ├── constants.js         // Constants (tickers, colors, etc.)
│   └── validation.js        // Input validation
├── /services
│   ├── emmaAgent.service.js
│   ├── supabase.service.js
│   ├── polygon.service.js
│   └── fmp.service.js
├── /context
│   ├── AppContext.jsx       // Global state
│   ├── ThemeContext.jsx     // Dark mode
│   └── UserContext.jsx      // User preferences
├── /styles
│   ├── tailwind.config.js
│   ├── globals.css
│   └── components.css
└── App.jsx                   // Main app component
```

---

## 📋 ÉTAPES DE REFACTORING (PAR PRIORITÉ)

### **PHASE 1: PRÉPARATION** (Estimation: 2-3 heures)

#### Étape 1.1: Setup Build Tools
- [ ] Installer Vite ou Create React App
- [ ] Configurer Tailwind CSS
- [ ] Setup ESLint + Prettier
- [ ] Configurer Babel pour JSX

**Commandes:**
```bash
npm create vite@latest gob-dashboard -- --template react
cd gob-dashboard
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install recharts axios react-router-dom
```

#### Étape 1.2: Analyser et Documenter Fonctions
- [ ] Créer inventaire de toutes les fonctions (494 fonctions)
- [ ] Catégoriser par type: API calls, UI updates, calculations, etc.
- [ ] Identifier dépendances entre fonctions
- [ ] Marquer fonctions réutilisables vs spécifiques à un onglet

**Output:** `FUNCTION_INVENTORY.md`

#### Étape 1.3: Identifier State Global
- [ ] Lister tous les `useState` hooks
- [ ] Identifier state partagé vs local
- [ ] Planifier Context API structure

---

### **PHASE 2: EXTRACTION UTILS & SERVICES** (Estimation: 4-6 heures)

#### Étape 2.1: Créer `/utils`
Extraire fonctions utilitaires pures (pas de state, pas de side effects):

**Fichiers à Créer:**

**`/src/utils/formatting.js`**
```javascript
export const formatCurrency = (value, decimals = 2) => {
    return new Intl.NumberFormat('fr-CA', {
        style: 'currency',
        currency: 'CAD',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
};

export const formatPercent = (value, decimals = 2) => {
    return `${(value * 100).toFixed(decimals)}%`;
};

export const formatNumber = (value, decimals = 0) => {
    return new Intl.NumberFormat('fr-CA', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
};

export const formatDate = (date, format = 'short') => {
    return new Intl.DateTimeFormat('fr-CA', {
        dateStyle: format
    }).format(new Date(date));
};
```

**`/src/utils/calculations.js`**
```javascript
export const calculatePE = (price, eps) => {
    if (!eps || eps === 0) return null;
    return price / eps;
};

export const calculateROE = (netIncome, shareholderEquity) => {
    if (!shareholderEquity || shareholderEquity === 0) return null;
    return (netIncome / shareholderEquity) * 100;
};

export const calculateJSLAI = (components) => {
    const {
        valuation = 0,
        profitability = 0,
        growth = 0,
        financialHealth = 0,
        momentum = 0,
        moat = 0,
        sectorPosition = 0
    } = components;

    return (
        valuation * 0.20 +
        profitability * 0.20 +
        growth * 0.15 +
        financialHealth * 0.20 +
        momentum * 0.10 +
        moat * 0.10 +
        sectorPosition * 0.05
    );
};
```

**`/src/utils/constants.js`**
```javascript
export const TEAM_TICKERS = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA',
    'META', 'NVDA', 'JPM', 'BAC', 'V'
];

export const COLORS = {
    positive: '#10b981',
    negative: '#ef4444',
    neutral: '#6b7280',
    primary: '#3b82f6',
    secondary: '#8b5cf6'
};

export const OUTPUT_MODES = {
    CHAT: 'chat',
    DATA: 'data',
    BRIEFING: 'briefing'
};
```

#### Étape 2.2: Créer `/services`
Extraire appels API et logique métier:

**`/src/services/emmaAgent.service.js`**
```javascript
const EMMA_AGENT_URL = '/api/emma-agent';

export const emmaAgentService = {
    async processRequest(message, context = {}) {
        const response = await fetch(EMMA_AGENT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, context })
        });

        if (!response.ok) {
            throw new Error(`Emma Agent error: ${response.status}`);
        }

        return response.json();
    },

    async batchRefresh(contexts) {
        const promises = Object.entries(contexts).map(([key, context]) =>
            this.processRequest(`Récupérer données pour ${key}`, context)
        );

        return Promise.allSettled(promises);
    },

    async generateCognitiveBriefing(type, intentData) {
        return this.processRequest(
            `Générer briefing ${type}`,
            {
                output_mode: 'briefing',
                briefing_type: type,
                intent_data: intentData
            }
        );
    }
};
```

**`/src/services/supabase.service.js`**
```javascript
export const supabaseService = {
    async getWatchlist(userId) {
        // ... Supabase logic
    },

    async saveWatchlist(userId, tickers) {
        // ... Supabase logic
    },

    async getEmmaConfig(contextName) {
        // ... Fetch emma_context_configs
    },

    async saveEmmaConfig(contextName, config) {
        // ... Save emma_context_configs
    }
};
```

---

### **PHASE 3: EXTRACTION HOOKS** (Estimation: 3-4 heures)

#### Étape 3.1: Créer Custom Hooks
Extraire logique state et side effects:

**`/src/hooks/useEmmaAgent.js`**
```javascript
import { useState, useCallback } from 'react';
import { emmaAgentService } from '../services/emmaAgent.service';

export const useEmmaAgent = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);

    const processRequest = useCallback(async (message, context = {}) => {
        setLoading(true);
        setError(null);

        try {
            const data = await emmaAgentService.processRequest(message, context);
            setResult(data);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setResult(null);
        setError(null);
    }, []);

    return { loading, error, result, processRequest, reset };
};
```

**`/src/hooks/useLocalStorage.js`**
```javascript
import { useState, useEffect } from 'react';

export const useLocalStorage = (key, initialValue) => {
    const [value, setValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error loading ${key} from localStorage:`, error);
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Error saving ${key} to localStorage:`, error);
        }
    }, [key, value]);

    return [value, setValue];
};
```

**`/src/hooks/useMarketData.js`**
```javascript
import { useState, useEffect } from 'react';
import { useEmmaAgent } from './useEmmaAgent';

export const useMarketData = (tickers, fields = []) => {
    const { processRequest, loading, error } = useEmmaAgent();
    const [data, setData] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            const result = await processRequest(
                `Récupérer ${fields.join(', ')} pour ${tickers.join(', ')}`,
                {
                    output_mode: 'data',
                    tickers,
                    fields_requested: fields
                }
            );

            if (result.success) {
                try {
                    setData(JSON.parse(result.response));
                } catch (err) {
                    console.error('Error parsing market data:', err);
                }
            }
        };

        if (tickers.length > 0) {
            fetchData();
        }
    }, [tickers, fields]);

    return { data, loading, error };
};
```

---

### **PHASE 4: EXTRACTION COMPONENTS** (Estimation: 6-8 heures)

#### Étape 4.1: Components Partagés
Créer composants réutilisables:

**`/src/components/shared/LoadingSpinner.jsx`**
```javascript
export const LoadingSpinner = ({ size = 'md', text = null }) => {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12'
    };

    return (
        <div className="flex items-center justify-center space-x-2">
            <div className={`animate-spin rounded-full border-b-2 border-blue-500 ${sizeClasses[size]}`}></div>
            {text && <span className="text-gray-600">{text}</span>}
        </div>
    );
};
```

**`/src/components/shared/MessageBanner.jsx`**
```javascript
export const MessageBanner = ({ type, message, onClose }) => {
    const typeStyles = {
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800'
    };

    return (
        <div className={`border rounded-lg p-4 ${typeStyles[type]}`}>
            <div className="flex justify-between items-start">
                <p>{message}</p>
                {onClose && (
                    <button onClick={onClose} className="ml-4 text-gray-500 hover:text-gray-700">
                        ×
                    </button>
                )}
            </div>
        </div>
    );
};
```

#### Étape 4.2: Tab Components
Un composant par onglet:

**`/src/components/tabs/JLabTab.jsx`**
```javascript
import React from 'react';
import { useMarketData } from '../../hooks/useMarketData';
import { TEAM_TICKERS } from '../../utils/constants';
import { formatCurrency, formatPercent } from '../../utils/formatting';
import { calculateJSLAI } from '../../utils/calculations';
import { LoadingSpinner } from '../shared/LoadingSpinner';

export const JLabTab = () => {
    const fields = ['price', 'pe', 'volume', 'marketCap', 'eps', 'roe'];
    const { data, loading, error } = useMarketData(TEAM_TICKERS, fields);

    if (loading) return <LoadingSpinner text="Chargement JLab..." />;
    if (error) return <MessageBanner type="error" message={error} />;

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">JLab - IntelliStocks™</h2>

            <table className="w-full">
                <thead>
                    <tr>
                        <th>Ticker</th>
                        <th>Prix</th>
                        <th>P/E</th>
                        <th>ROE</th>
                        <th>JSLAI™</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(data).map(([ticker, stockData]) => (
                        <tr key={ticker}>
                            <td>{ticker}</td>
                            <td>{formatCurrency(stockData.price)}</td>
                            <td>{stockData.pe?.toFixed(2)}</td>
                            <td>{formatPercent(stockData.roe / 100)}</td>
                            <td>{calculateJSLAI(stockData)?.toFixed(1)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
```

---

### **PHASE 5: CONTEXT API** (Estimation: 2-3 heures)

#### Étape 5.1: Global State Management

**`/src/context/AppContext.jsx`**
```javascript
import React, { createContext, useContext, useState } from 'react';
import { TEAM_TICKERS } from '../utils/constants';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [teamTickers, setTeamTickers] = useState(TEAM_TICKERS);
    const [activeTab, setActiveTab] = useState('jlab');
    const [loading, setLoading] = useState(false);

    const value = {
        teamTickers,
        setTeamTickers,
        activeTab,
        setActiveTab,
        loading,
        setLoading
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
};
```

---

### **PHASE 6: MIGRATION & TESTING** (Estimation: 4-6 heures)

#### Étape 6.1: Migration Progressive
1. [ ] Créer `index.html` minimal
2. [ ] Migrer `App.jsx` avec routing
3. [ ] Migrer 1 onglet à la fois (commencer par JLabTab)
4. [ ] Tester chaque onglet avant de passer au suivant

#### Étape 6.2: Tests
1. [ ] Tests unitaires pour utils (`formatCurrency`, `calculateJSLAI`, etc.)
2. [ ] Tests pour hooks (`useEmmaAgent`, `useMarketData`)
3. [ ] Tests d'intégration pour components

---

## 📊 COMPARAISON AVANT/APRÈS

| Aspect | AVANT | APRÈS |
|--------|-------|-------|
| **Fichiers** | 1 fichier (14K lignes) | ~50 fichiers modulaires |
| **Maintenabilité** | ❌ Difficile | ✅ Facile |
| **Performance** | ❌ Tout chargé | ✅ Code splitting |
| **Réutilisabilité** | ❌ Code dupliqué | ✅ Components partagés |
| **Testabilité** | ❌ Impossible | ✅ Tests unitaires |
| **Collaboration** | ❌ Conflits git | ✅ Fichiers séparés |
| **Build Time** | ✅ Aucun | ⚠️ ~5-10s |
| **Type Safety** | ❌ Aucune | ✅ Option TypeScript |

---

## ⚠️ RISQUES & MITIGATION

### Risque 1: Breaking Changes
**Mitigation:** Migration progressive, garder ancien fichier jusqu'à validation complète

### Risque 2: Perte de Fonctionnalités
**Mitigation:** Tests exhaustifs avant migration de chaque onglet

### Risque 3: Performance Regression
**Mitigation:** Profiling avant/après, code splitting optimal

---

## 🚀 TIMELINE ESTIMÉE

| Phase | Durée Estimée | Dépendances |
|-------|---------------|-------------|
| Phase 1: Préparation | 2-3 heures | Aucune |
| Phase 2: Utils & Services | 4-6 heures | Phase 1 |
| Phase 3: Hooks | 3-4 heures | Phase 2 |
| Phase 4: Components | 6-8 heures | Phase 3 |
| Phase 5: Context API | 2-3 heures | Phase 3 |
| Phase 6: Migration & Testing | 4-6 heures | Phases 2-5 |
| **TOTAL** | **21-30 heures** | |

---

## ✅ CHECKLIST DE MIGRATION

### Préparation
- [ ] Setup projet Vite/React
- [ ] Configurer Tailwind CSS
- [ ] Setup ESLint + Prettier
- [ ] Créer structure de dossiers

### Utils & Services
- [ ] `formatting.js` extrait et testé
- [ ] `calculations.js` extrait et testé
- [ ] `constants.js` créé
- [ ] `emmaAgent.service.js` créé
- [ ] `supabase.service.js` créé

### Hooks
- [ ] `useEmmaAgent` créé et testé
- [ ] `useLocalStorage` créé et testé
- [ ] `useMarketData` créé et testé
- [ ] `useWatchlist` créé et testé

### Components Shared
- [ ] `LoadingSpinner` créé
- [ ] `MessageBanner` créé
- [ ] `Header` créé
- [ ] `TabBar` créé

### Components Tabs
- [ ] `JLabTab` migré et testé
- [ ] `AskEmmaTab` migré et testé
- [ ] `EmmaEnDirectTab` migré et testé
- [ ] `StocksNewsTab` migré et testé
- [ ] `EconomicCalendarTab` migré et testé
- [ ] `EarningsCalendarTab` migré et testé
- [ ] `WatchlistTab` migré et testé
- [ ] `ScreenerTab` migré et testé
- [ ] `PortfolioTab` migré et testé
- [ ] `SettingsTab` migré et testé
- [ ] `AlertsTab` migré et testé
- [ ] `HelpTab` migré et testé

### Context & State
- [ ] `AppContext` créé
- [ ] `ThemeContext` créé
- [ ] State global migré

### Testing & Validation
- [ ] Tests unitaires utils (100%)
- [ ] Tests hooks (80%+)
- [ ] Tests components critiques
- [ ] Tests end-to-end (smoke tests)

### Deployment
- [ ] Build optimisé vérifié
- [ ] Performance profiling
- [ ] Migration complète validée
- [ ] Documentation mise à jour

---

## 📝 NOTES

### Points d'Attention
1. **Babel Standalone:** L'actuel utilise Babel in-browser. Nouveau build utilisera Vite (plus rapide)
2. **CDN Dependencies:** Migrer vers npm packages (recharts, etc.)
3. **Global State:** Évaluer si Context API suffit ou si Redux/Zustand nécessaire
4. **TypeScript:** Considérer migration vers TS pour type safety

### Alternatives Considérées
- **Next.js:** Overkill pour SPA, mais bon pour SEO
- **Remix:** Moderne, mais courbe d'apprentissage
- **Vite + React:** ✅ **CHOISI** - Simple, rapide, communauté active

---

**Auteur:** Claude Code
**Date:** 2025-10-16
**Version:** 1.0
