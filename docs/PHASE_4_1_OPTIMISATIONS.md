# Phase 4.1: Optimisations useMemo/useCallback

## 🎯 Objectif
Ajouter `useMemo` et `useCallback` dans les modules du dashboard pour améliorer les performances et éviter les re-renders inutiles.

## 📊 Modules à optimiser (11 modules)

### 1. **IntelliStocksTab.js** ⚠️ PRIORITAIRE
- **`calculateSentiment`** : Fonction de calcul coûteuse (ligne 137)
- **`generateMockData`** : Fonction de génération de données mock (ligne 42)
- **Handlers de filtres** : `setSelectedStock`, `setTimeframe`, etc.

### 2. **EconomicCalendarTab.js** ⚠️ PRIORITAIRE
- **Filtres calculés** : `filteredCalendarData` (calculé à chaque render)
- **Handlers de filtres** : `setFilterTicker`, `setFilterCurrency`, etc.
- **Fonction `getFallbackData`** : Peut être mémorisée

### 3. **DansWatchlistTab.js**
- **`loadWatchlistData`** : Fonction async qui pourrait être `useCallback`
- **Filtres de données** : Calculs de filtrage de la watchlist

### 4. **YieldCurveTab.js**
- **`formatRate`** : Fonction utilitaire (ligne 17) - peut être `useCallback`
- **`renderRateTable`** : Fonction de rendu (ligne 18) - peut être `useCallback`
- **Données filtrées** : Filtrer par pays sélectionné

### 5. **StocksNewsTab.js**
- **Filtres de nouvelles** : Filtrer par ticker, source, date
- **Handlers de recherche** : `setSearchQuery`, etc.

### 6. **EmailBriefingsTab.js**
- **Filtres de briefings** : Filtrer par date, statut
- **Calculs de formatage** : Formatage de dates, textes

### 7. **InvestingCalendarTab.js**
- **Filtres de calendrier** : Filtres complexes par date, type, ticker
- **Calculs de dates** : Formatage et calculs de dates

### 8. **MarketsEconomyTab.js**
- **Configuration TradingView** : Objets de configuration pour widgets
- **Handlers de widgets** : Gestion des widgets TradingView

### 9. **SeekingAlphaTab.js**
- **Filtres d'articles** : Filtrer par ticker, date, type
- **Parsing de données** : Parsing de données Seeking Alpha

### 10. **ScrappingSATab.js**
- **Filtres de scraping** : Filtres de résultats de scraping
- **Handlers de scraping** : Fonctions de scraping

### 11. **AdminJSLaiTab.js**
- **Configuration admin** : Objets de configuration
- **Handlers admin** : Gestion des paramètres admin

## 🔧 Stratégie d'optimisation

### Règle 1: useCallback pour les handlers
```javascript
// ❌ AVANT
const handleClick = () => { /* ... */ };

// ✅ APRÈS
const handleClick = useCallback(() => { /* ... */ }, [dependencies]);
```

### Règle 2: useMemo pour les calculs coûteux
```javascript
// ❌ AVANT
const filteredData = data.filter(item => item.value > threshold);

// ✅ APRÈS
const filteredData = useMemo(
  () => data.filter(item => item.value > threshold),
  [data, threshold]
);
```

### Règle 3: useMemo pour les objets/arrays passés en props
```javascript
// ❌ AVANT
<Component config={{ theme: 'dark', size: 'large' }} />

// ✅ APRÈS
const config = useMemo(() => ({ theme: 'dark', size: 'large' }), [theme, size]);
<Component config={config} />
```

## 📝 Checklist d'implémentation

- [ ] IntelliStocksTab.js
- [ ] EconomicCalendarTab.js
- [ ] DansWatchlistTab.js
- [ ] YieldCurveTab.js
- [ ] StocksNewsTab.js
- [ ] EmailBriefingsTab.js
- [ ] InvestingCalendarTab.js
- [ ] MarketsEconomyTab.js
- [ ] SeekingAlphaTab.js
- [ ] ScrappingSATab.js
- [ ] AdminJSLaiTab.js

## ⚠️ Notes importantes

1. **Ne pas sur-optimiser** : Seulement optimiser les calculs coûteux et les handlers passés en props
2. **Dépendances correctes** : Toujours inclure toutes les dépendances dans les arrays de dépendances
3. **Tester après chaque optimisation** : Vérifier que le comportement reste identique
4. **Mesurer l'impact** : Utiliser React DevTools Profiler pour mesurer les améliorations

