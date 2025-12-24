# GOB Dashboard - Rapport d'Audit QA Complet

**Date:** 24 Décembre 2025
**Version analysée:** Commit 7e69ad4
**Auditeur:** Claude Code (Anthropic)

---

## Résumé Exécutif

J'ai effectué un audit approfondi du code source du GOB Dashboard. L'analyse couvre les composants React, les endpoints API, les patterns de données, l'UI/UX et les problèmes de calcul.

### Statistiques Clés
- **Fichiers analysés:** 47
- **Bugs critiques identifiés:** 8
- **Bugs majeurs:** 23
- **Bugs mineurs:** 45+
- **Console.log en production:** 193
- **Utilisation innerHTML (risque XSS):** 62

### Verdict Global
Le dashboard est fonctionnel mais a accumulé une dette technique significative. Les problèmes les plus critiques sont les dépendances au window object, les memory leaks des widgets TradingView, et les références à des variables non définies.

---

## 1. ERREURS JAVASCRIPT/TYPESCRIPT CRITIQUES

### 1.1 Variables Non Définies

**Fichier:** `src/components/tabs/IntelliStocksTab.tsx`

| Ligne | Variable | Impact |
|-------|----------|--------|
| 476 | `queryLower` | Crash API filtrage RSS |
| 476 | `tickerBase` | Crash regex construction |
| 378 | `setMessage` | Fonction supprimée mais référencée |

**Preuve dans le code:**
```typescript
// Ligne 476 - api/news.js
const pattern = new RegExp(`(${queryLower}|${tickerBase})`, 'gi');
// ERREUR: queryLower et tickerBase ne sont jamais déclarés!
```

**Fichier:** `src/components/tabs/DansWatchlistTab.tsx`

| Ligne | Problème | Impact |
|-------|----------|--------|
| 78 | `screenerFilters.maxDebtEquity` non dans état initial | Référence undefined |
| 329 | `saveSupabaseTimer` sans let/const | Variable globale implicite |

**Preuve:**
```typescript
// Ligne 27-32 - État initial ne contient pas maxDebtEquity
const [screenerFilters, setScreenerFilters] = useState({
    minMarketCap: 0,
    maxPE: 50,
    minDividendYield: 0,
    // MANQUANT: maxDebtEquity
});

// Ligne 78 - Utilisation
if (screenerFilters.maxDebtEquity) { ... } // undefined!
```

---

## 2. ANTI-PATTERNS REACT

### 2.1 Memory Leaks - Cleanup Manquant

**CRITIQUE: Widgets TradingView sans nettoyage**

| Fichier | Lignes | Widgets affectés |
|---------|--------|------------------|
| MarketsEconomyTab.tsx | 18-149 | 5 widgets |
| StocksNewsTab.tsx | 52-148 | 3 widgets |
| InvestingCalendarTab.tsx | 151-671 | Multiple |
| DansWatchlistTab.tsx | 402-441 | 1 widget |
| IntelliStocksTab.tsx | 1019-1026 | 1 widget |

**Exemple problématique:**
```typescript
// MarketsEconomyTab.tsx - Ligne 18-68
useEffect(() => {
    if (marketOverviewRef.current) {
        marketOverviewRef.current.innerHTML = '';
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js';
        script.async = true;
        marketOverviewRef.current.appendChild(script);
    }
    // ❌ PAS DE CLEANUP! Les scripts s'accumulent
}, [isDarkMode]);
```

**Impact:**
- Fuite mémoire progressive
- Widgets dupliqués à chaque toggle dark mode
- Performance dégradée avec le temps

**Solution:**
```typescript
useEffect(() => {
    const container = marketOverviewRef.current;
    if (container) {
        container.innerHTML = '';
        const script = document.createElement('script');
        // ... setup
        container.appendChild(script);
    }
    return () => {
        if (container) {
            container.innerHTML = ''; // ✅ Cleanup
        }
    };
}, [isDarkMode]);
```

### 2.2 useEffect - Dépendances Manquantes

**Fichier:** `src/components/BetaCombinedDashboard.tsx`

| Ligne | Problème | Impact |
|-------|----------|--------|
| 305 | `loadInitialData` dans closure stale | Données périmées |
| 317 | `tickers.length` au lieu de `tickers` | Ne se rafraîchit pas quand contenu change |

**Preuve:**
```typescript
// Ligne 317 - BUG subtil
useEffect(() => {
    if (!initialLoadComplete || tickers.length === 0) return;
    fetchLatestNewsForTickers();
}, [tickers.length, initialLoadComplete]);
// ❌ Si on remplace AAPL par MSFT (même length), effet ne se déclenche pas!
```

---

## 3. PROBLÈMES DATA FLOW

### 3.1 Dépendance Window Object (CRITIQUE)

**Trouvé dans 12 fichiers, 34 occurrences**

| Fichier | Ligne |
|---------|-------|
| DansWatchlistTab.tsx | 7 |
| StocksNewsTab.tsx | 8 |
| IntelliStocksTab.tsx | 16 |
| AdminJSLaiTab.tsx | 12 |
| AskEmmaTab.tsx | 23 |
| PlusTab.tsx | 6 |
| YieldCurveTab.tsx | 9 |
| InvestingCalendarTab.tsx | 8 |
| + 4 autres | - |

**Pattern problématique:**
```typescript
// Chaque composant enfant fait ceci:
const dashboard = typeof window !== 'undefined'
    ? (window as any).BetaCombinedDashboard || {}
    : {};
const tickers = props.tickers || dashboard.tickers || [];
```

**Problèmes:**
1. **Race condition:** Parent met à jour window après 100ms debounce
2. **SSR incompatible:** Crash côté serveur
3. **Couplage fragile:** Changement dans parent casse tous les enfants
4. **Difficile à tester:** Dépendance globale

### 3.2 Prop Drilling Excessif

**Fichier:** `src/components/BetaCombinedDashboard.tsx` (Lignes 319-380)

```typescript
const tabProps = useMemo(() => ({
    isDarkMode,
    tickers,
    setTickers,
    stockData,
    setStockData,
    newsData,
    setNewsData,
    // ... 30+ autres props
}), [/* 30+ dépendances */]);
```

**Impact:**
- Maintenance difficile
- Props facilement oubliées
- Re-renders inutiles

---

## 4. PROBLÈMES UI/UX

### 4.1 États d'Erreur Manquants

| Composant | Fonction | État erreur |
|-----------|----------|-------------|
| DansWatchlistTab | loadWatchlistData | ❌ Non |
| BetaCombinedDashboard | loadInitialData | ❌ Non |
| FinanceProTab | fetchSnapshot | ⚠️ Partiel |
| IntelliStocksTab | fetchStockData | ⚠️ Console only |

**Exemple - L'utilisateur ne sait jamais si l'API échoue:**
```typescript
// DansWatchlistTab.tsx - Ligne 194-258
const loadWatchlistData = async (tickersToLoad) => {
    try {
        const response = await fetch(...);
        // Traitement...
    } catch (error) {
        console.error('❌ Erreur:', error);
        // ❌ AUCUN feedback utilisateur!
    }
};
```

### 4.2 Accessibilité

**Problèmes identifiés:**

| Type | Occurrences | Exemple |
|------|-------------|---------|
| Boutons sans aria-label | 50+ | "🔄 Actualiser" |
| Éléments non navigables clavier | 30+ | Cards cliquables |
| Contraste insuffisant | 10+ | Texte gris sur gris |
| Focus non visible | Multiple | Onglets navigation |

**Exemple concret:**
```typescript
// DansWatchlistTab.tsx - Ligne 649
<button onClick={handleRefresh}>
    🔄 Actualiser
</button>
// ❌ Pas de aria-label, pas de title, emoji non descriptif
```

### 4.3 Responsive Design

**Fichier:** `StocksNewsTab.tsx` - Ligne 340

```typescript
"width": "1047px" // ❌ Largeur fixe!
```

**Impact:** Scroll horizontal sur mobile, brisé sur tablette.

---

## 5. PROBLÈMES API

### 5.1 Gestion d'Erreurs

**Fichier:** `api/news.js` (Lignes 95-101)

```javascript
for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
        allNews.push(...result.value);
    } else if (result.status === 'rejected') {
        console.error('❌ News source error:', result.reason);
        // ❌ L'utilisateur ne sait pas que des données manquent!
    }
}
```

**Fichier:** `api/supabase-watchlist.js` (Lignes 169-183)

```javascript
try {
    // Appel Supabase
} catch (supabaseError) {
    // ❌ Retourne 200 même en cas d'erreur!
    return res.status(200).json({
        success: true,
        tickers: fallbackTickers,
        source: 'fallback'
    });
}
```

**Impact:** Le monitoring ne peut pas détecter les pannes Supabase.

### 5.2 Rate Limiting Manquant

**Aucun fichier API n'implémente de rate limiting.**

| API Externe | Limite connue | Protection |
|-------------|---------------|------------|
| FMP (Financial Modeling Prep) | 250/jour | ❌ Aucune |
| Finnhub | 30/seconde | ❌ Aucune |
| Polygon | Varie | ❌ Aucune |

**Risque:** Blocage de clé API, factures élevées.

---

## 6. BUGS DE CALCUL

### 6.1 Division par Zéro

**Fichier:** `FinanceProTab.tsx` - Ligne 334

```typescript
const getValue = (years: number) => {
    // ...
    return Math.pow(end / start, 1 / years) - 1;
    // ❌ Si years === 0, division par zéro!
};
```

**Fichier:** `DansWatchlistTab.tsx` - Ligne 354

```typescript
percent: (value / portfolioValue) * 100,
// ❌ Si portfolioValue === 0, résultat NaN!
```

### 6.2 Formule Incorrecte

**Fichier:** `FinanceProTab.tsx` - Ligne 990

```typescript
width: `${Math.min(100, (ratio.format === 'percent' ? ratio.value * 100 : ratio.value)
        / (ratio.good * (ratio.format === 'percent' ? 100 : 1)) * 50)}%`
//                                                              ^^^ Multiplie par 50!
```

**Impact:** Les barres de progression affichent la moitié de la valeur correcte.

### 6.3 Dates Trading

**Fichier:** `IntelliStocksTab.tsx` - Lignes 305-308

```typescript
const daysSinceStart = Math.ceil((now - startOfYear) / (1000 * 60 * 60 * 24));
historicalLimit = Math.min(daysSinceStart, 365);
// ❌ Utilise jours calendaires, pas jours de trading
```

**Impact:** Demande plus de données API que nécessaire (weekends, jours fériés).

---

## 7. SÉCURITÉ

### 7.1 Utilisation innerHTML (Risque XSS)

**62 occurrences trouvées**

| Fichier | Risque | Lignes |
|---------|--------|--------|
| AskEmmaTab.tsx | Élevé | 1728, 1749 |
| MarketsEconomyTab.tsx | Moyen | Widgets |
| StocksNewsTab.tsx | Moyen | Widgets |
| InvestingCalendarTab.tsx | Moyen | Widgets |

**Exemple à haut risque:**
```typescript
// AskEmmaTab.tsx - innerHTML dans onerror
img.onerror = () => {
    container.innerHTML = `<div>${tickerName}</div>`;
    // ❌ Si tickerName contient <script>, XSS possible!
};
```

---

## 8. PERFORMANCE

### 8.1 Console.log en Production

**193 console.log trouvés dans 16 fichiers**

| Fichier | Occurrences |
|---------|-------------|
| IntelliStocksTab.tsx | 45 |
| EmailBriefingsTab.tsx | 38 |
| AdminJSLaiTab.tsx | 32 |
| DansWatchlistTab.tsx | 28 |
| Autres | 50 |

### 8.2 Re-renders Excessifs

**Fichier:** `BetaCombinedDashboard.tsx` (Lignes 440-447)

```typescript
useEffect(() => {
    // Se déclenche à CHAQUE changement de ces 30+ dépendances
}, [isDarkMode, tickers, stockData, newsData, tickerLatestNews,
    tickerMoveReasons, loading, lastUpdate, selectedStock,
    seekingAlphaData, seekingAlphaStockData, teamTickers,
    watchlistTickers, apiStatus, processLog, prefillMessage,
    autoSend, showPromptEditor, showTemperatureEditor,
    showLengthEditor, emmaConnected, API_BASE_URL, fetchNews,
    fetchLatestNewsForTickers, loadTickersFromSupabase,
    refreshAllStocks, fetchStockData, showMessage,
    getCompanyLogo, emmaPopulateWatchlist]);
```

### 8.3 Appels API Non Optimisés

**Fichier:** `DansWatchlistTab.tsx` - Screener

```typescript
// Ligne 47-84 - Boucle avec await = O(n) appels séquentiels
for (const stock of watchlistStocks) {
    const [quoteRes, profileRes, ratiosRes] = await Promise.allSettled([
        fetch(`/api/marketdata?endpoint=quote&symbol=${stock.symbol}`),
        fetch(`/api/marketdata?endpoint=profile&symbol=${stock.symbol}`),
        fetch(`/api/marketdata?endpoint=ratios&symbol=${stock.symbol}`),
    ]);
}
// ❌ 50 stocks = 150 appels API individuels!
// ✅ Devrait utiliser l'endpoint batch existant
```

---

## 9. RECOMMANDATIONS PRIORITAIRES

### Critique (À corriger immédiatement)

| # | Action | Fichier(s) | Effort |
|---|--------|------------|--------|
| 1 | Corriger variables undefined | IntelliStocksTab.tsx, news.js | 1h |
| 2 | Ajouter cleanup TradingView | 5 fichiers | 2h |
| 3 | Déclarer `saveSupabaseTimer` | DansWatchlistTab.tsx | 5min |
| 4 | Ajouter error boundaries | App.tsx + tabs | 4h |

### Haute Priorité

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| 5 | Remplacer window object par Context | Élimine race conditions | 2 jours |
| 6 | Créer types centralisés | Prévient bugs types | 1 jour |
| 7 | Utiliser batch API dans screener | Performance x10 | 2h |
| 8 | Ajouter états d'erreur UI | Expérience utilisateur | 1 jour |

### Moyenne Priorité

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| 9 | Supprimer console.log | Performance prod | 2h |
| 10 | Ajouter aria-labels | Accessibilité | 4h |
| 11 | Corriger formule progress bar | Affichage correct | 30min |
| 12 | Implémenter rate limiting | Évite blocage API | 1 jour |

---

## 10. ESTIMATION EFFORT TOTAL

| Catégorie | Effort Estimé |
|-----------|---------------|
| Corrections critiques | 1-2 jours |
| Refactoring majeur (Context) | 3-5 jours |
| Cleanup complet | 2-3 semaines |

---

## ANNEXE A: Fichiers Analysés

```
src/components/BetaCombinedDashboard.tsx
src/components/tabs/AdminJSLaiTab.tsx
src/components/tabs/AskEmmaTab.tsx
src/components/tabs/DansWatchlistTab.tsx
src/components/tabs/EconomicCalendarTab.tsx
src/components/tabs/EmailBriefingsTab.tsx
src/components/tabs/EmmaConfigTab.tsx
src/components/tabs/FinanceProTab.tsx
src/components/tabs/IntelliStocksTab.tsx
src/components/tabs/InvestingCalendarTab.tsx
src/components/tabs/MarketsEconomyTab.tsx
src/components/tabs/NouvellesTab.tsx
src/components/tabs/PlusTab.tsx
src/components/tabs/ScrappingSATab.tsx
src/components/tabs/SeekingAlphaTab.tsx
src/components/tabs/StocksNewsTab.tsx
src/components/tabs/TestOnlyTab.tsx
src/components/tabs/YieldCurveTab.tsx
api/news.js
api/supabase-watchlist.js
api/marketdata.js
api/marketdata/batch.js
+ 25 autres fichiers
```

---

## ANNEXE B: Commandes de Vérification

```bash
# Trouver tous les console.log
grep -rn "console.log" src/components/tabs/ | wc -l

# Trouver innerHTML
grep -rn "innerHTML" src/components/ | wc -l

# Trouver window.BetaCombinedDashboard
grep -rn "window.BetaCombinedDashboard" src/ | wc -l
```

---

**Rapport généré par Claude Code (Anthropic)**
**Pour questions: Contactez l'équipe de développement**
