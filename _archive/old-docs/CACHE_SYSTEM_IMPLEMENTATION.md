# 🔧 IMPLÉMENTATION DU SYSTÈME DE CACHE MANQUANT

**Date:** 2025-11-18
**Priorité:** 🔴 **CRITIQUE**
**Fichiers à créer:** 1 fichier
**Fichiers à modifier:** 2 fichiers

---

## 📋 CONTEXTE

Le système de cache a été détecté dans l'ancien code (`app.jsx`) mais n'a **PAS été migré** vers la nouvelle structure Vite/TypeScript.

### Fonctionnalité du cache
- **Cache des nouvelles** (ticker_news et general_news)
- **Durée de vie configurable** (maxAgeHours)
- **Stockage:** Supabase + localStorage
- **API utilisée:** `/api/supabase-daily-cache`

### États manquants
```typescript
const [cacheSettings, setCacheSettings] = useState({
    maxAgeHours: 4,
    refreshOnNavigation: true,
    refreshIntervalMinutes: 10
});
const [cacheStatus, setCacheStatus] = useState({});
const [loadingCacheStatus, setLoadingCacheStatus] = useState(false);
```

---

## 🎯 PLAN D'IMPLÉMENTATION

### Étape 1: Créer le gestionnaire de cache TypeScript

**Fichier:** `/home/user/GOB/src/utils/cacheManager.ts`

```typescript
// ====================================================================
// CACHE MANAGER - Gestion du cache Supabase pour les données
// ====================================================================

export interface CacheSettings {
  maxAgeHours: number;
  refreshOnNavigation: boolean;
  refreshIntervalMinutes: number;
}

export interface CacheStatus {
  ticker_news?: {
    cached: boolean;
    expired: boolean;
    lastUpdate?: string;
    expiresAt?: string;
  };
  general_news?: {
    cached: boolean;
    expired: boolean;
    lastUpdate?: string;
    expiresAt?: string;
  };
}

const DEFAULT_CACHE_SETTINGS: CacheSettings = {
  maxAgeHours: 4,
  refreshOnNavigation: true,
  refreshIntervalMinutes: 10
};

// Charger les paramètres de cache depuis localStorage
export const loadCacheSettings = (): CacheSettings => {
  try {
    const saved = localStorage.getItem('cacheSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_CACHE_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.error('Erreur chargement cacheSettings:', error);
  }
  return DEFAULT_CACHE_SETTINGS;
};

// Sauvegarder les paramètres de cache dans localStorage
export const saveCacheSettings = (settings: CacheSettings): void => {
  try {
    localStorage.setItem('cacheSettings', JSON.stringify(settings));
    console.log('✅ cacheSettings sauvegardés:', settings);
  } catch (error) {
    console.error('❌ Erreur sauvegarde cacheSettings:', error);
  }
};

// Récupérer les données depuis le cache Supabase
export const fetchFromCache = async (
  type: 'ticker_news' | 'general_news',
  maxAgeHours: number = 4
): Promise<{ success: boolean; cached: boolean; expired: boolean; data?: any }> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const url = `/api/supabase-daily-cache?type=${type}&date=${today}&maxAgeHours=${maxAgeHours}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Cache API error: ${response.status}`);
    }

    const result = await response.json();

    if (result.success && result.cached && !result.expired) {
      console.log(`✅ Cache hit pour ${type} (valide jusqu'à ${result.expiresAt})`);
      return {
        success: true,
        cached: true,
        expired: false,
        data: result.data
      };
    }

    console.log(`⚠️ Cache miss ou expiré pour ${type}`);
    return {
      success: false,
      cached: false,
      expired: result.expired || false
    };
  } catch (error) {
    console.error(`❌ Erreur récupération cache ${type}:`, error);
    return {
      success: false,
      cached: false,
      expired: false
    };
  }
};

// Sauvegarder des données dans le cache Supabase
export const saveToCache = async (
  type: 'ticker_news' | 'general_news',
  data: any
): Promise<boolean> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const url = '/api/supabase-daily-cache';

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        date: today,
        data
      })
    });

    if (!response.ok) {
      throw new Error(`Cache save error: ${response.status}`);
    }

    console.log(`✅ Données sauvegardées dans cache ${type}`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur sauvegarde cache ${type}:`, error);
    return false;
  }
};

// Vérifier le statut du cache pour tous les types
export const checkCacheStatus = async (
  maxAgeHours: number = 4
): Promise<CacheStatus> => {
  const status: CacheStatus = {};

  try {
    // Vérifier cache ticker_news
    const tickerCache = await fetchFromCache('ticker_news', maxAgeHours);
    status.ticker_news = {
      cached: tickerCache.cached,
      expired: tickerCache.expired,
      lastUpdate: tickerCache.data?.timestamp,
      expiresAt: tickerCache.data?.expiresAt
    };

    // Vérifier cache general_news
    const generalCache = await fetchFromCache('general_news', maxAgeHours);
    status.general_news = {
      cached: generalCache.cached,
      expired: generalCache.expired,
      lastUpdate: generalCache.data?.timestamp,
      expiresAt: generalCache.data?.expiresAt
    };
  } catch (error) {
    console.error('❌ Erreur vérification statut cache:', error);
  }

  return status;
};

// Invalider (supprimer) le cache
export const invalidateCache = async (
  type?: 'ticker_news' | 'general_news'
): Promise<boolean> => {
  try {
    const url = type
      ? `/api/supabase-daily-cache?type=${type}&action=delete`
      : '/api/supabase-daily-cache?action=delete_all';

    const response = await fetch(url, { method: 'DELETE' });

    if (!response.ok) {
      throw new Error(`Cache invalidation error: ${response.status}`);
    }

    console.log(`✅ Cache ${type || 'all'} invalidé`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur invalidation cache:`, error);
    return false;
  }
};

export default {
  loadCacheSettings,
  saveCacheSettings,
  fetchFromCache,
  saveToCache,
  checkCacheStatus,
  invalidateCache
};
```

---

### Étape 2: Ajouter les états dans `BetaCombinedDashboard.tsx`

**Fichier:** `/home/user/GOB/src/components/BetaCombinedDashboard.tsx`

**Modifications à apporter:**

1. **Importer le gestionnaire de cache:**
```typescript
import { loadCacheSettings, saveCacheSettings, checkCacheStatus, type CacheSettings, type CacheStatus } from '../utils/cacheManager';
```

2. **Ajouter les états de cache (après ligne 22):**
```typescript
// États pour la gestion du cache
const [cacheSettings, setCacheSettings] = useState<CacheSettings>(() => loadCacheSettings());
const [cacheStatus, setCacheStatus] = useState<CacheStatus>({});
const [loadingCacheStatus, setLoadingCacheStatus] = useState(false);
```

3. **Ajouter un useEffect pour persister les cacheSettings:**
```typescript
// Sauvegarder cacheSettings dans localStorage à chaque changement
useEffect(() => {
    saveCacheSettings(cacheSettings);
}, [cacheSettings]);
```

4. **Ajouter un useEffect pour charger le statut du cache au démarrage:**
```typescript
// Charger le statut du cache au démarrage
useEffect(() => {
    const loadCacheStatusOnMount = async () => {
        setLoadingCacheStatus(true);
        const status = await checkCacheStatus(cacheSettings.maxAgeHours);
        setCacheStatus(status);
        setLoadingCacheStatus(false);
    };

    loadCacheStatusOnMount();
}, [cacheSettings.maxAgeHours]);
```

5. **Passer les props de cache aux tabs (dans tabProps, ligne 119):**
```typescript
const tabProps = {
    isDarkMode,
    tickers,
    setTickers,
    stockData,
    setStockData,
    newsData,
    setNewsData,
    loading,
    setLoading,
    lastUpdate,
    setLastUpdate,
    initialLoadComplete,
    API_BASE_URL,
    fetchStockData,
    showMessage,
    getCompanyLogo,
    emmaPopulateWatchlist,
    // NOUVEAUX props pour le cache
    cacheSettings,
    setCacheSettings,
    cacheStatus,
    setCacheStatus,
    loadingCacheStatus
};
```

---

### Étape 3: Utiliser le cache dans les tabs (StocksNewsTab, etc.)

**Fichiers à modifier:**
- `/home/user/GOB/src/components/tabs/StocksNewsTab.tsx`
- `/home/user/GOB/src/components/tabs/MarketsEconomyTab.tsx`

**Exemple d'utilisation dans une fonction de fetch (StocksNewsTab.tsx):**

```typescript
import { fetchFromCache, saveToCache } from '../../utils/cacheManager';

const fetchLatestNewsForTickers = async () => {
    try {
        // 1. VÉRIFIER LE CACHE D'ABORD
        const cacheResult = await fetchFromCache('ticker_news', cacheSettings.maxAgeHours);

        if (cacheResult.success && cacheResult.data) {
            console.log('✅ Nouvelles par ticker depuis cache Supabase');
            const cachedData = cacheResult.data;
            if (cachedData.newsMap) {
                setTickerLatestNews(cachedData.newsMap);
            }
            if (cachedData.moveReasonsMap) {
                setTickerMoveReasons(cachedData.moveReasonsMap);
            }
            return; // Utiliser le cache, ne pas faire l'appel API
        }

        // 2. CACHE MANQUANT/EXPIRÉ → APPEL API
        console.log('⚠️ Cache expiré, récupération depuis API...');
        const newsMap = {};
        const moveReasonsMap = {};

        for (const ticker of tickers) {
            const response = await fetch(`/api/fmp?endpoint=news&symbols=${ticker}&limit=3`);
            const data = await response.json();
            // ... traiter les données
            newsMap[ticker] = data.news?.[0];
            moveReasonsMap[ticker] = extractMoveReason(data.news);
        }

        setTickerLatestNews(newsMap);
        setTickerMoveReasons(moveReasonsMap);

        // 3. SAUVEGARDER DANS LE CACHE
        await saveToCache('ticker_news', {
            newsMap,
            moveReasonsMap,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erreur fetch news:', error);
    }
};
```

---

### Étape 4: Ajouter interface de gestion du cache dans AdminJSLaiTab

**Fichier:** `/home/user/GOB/src/components/tabs/AdminJSLaiTab.tsx`

**Ajouter une section pour gérer le cache:**

```typescript
// Dans AdminJSLaiTab.tsx, ajouter cette section
<div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
    <h3 className="text-xl font-bold mb-4">🗄️ Gestion du Cache</h3>

    {/* Paramètres de cache */}
    <div className="space-y-4 mb-6">
        <div>
            <label className="block text-sm font-medium mb-2">Durée de vie du cache (heures)</label>
            <input
                type="number"
                min="1"
                max="24"
                value={cacheSettings.maxAgeHours}
                onChange={(e) => setCacheSettings({
                    ...cacheSettings,
                    maxAgeHours: parseInt(e.target.value)
                })}
                className={`w-full px-3 py-2 rounded border ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
            />
        </div>

        <div className="flex items-center gap-2">
            <input
                type="checkbox"
                id="refreshOnNav"
                checked={cacheSettings.refreshOnNavigation}
                onChange={(e) => setCacheSettings({
                    ...cacheSettings,
                    refreshOnNavigation: e.target.checked
                })}
                className="w-4 h-4"
            />
            <label htmlFor="refreshOnNav" className="text-sm">
                Actualiser lors de la navigation
            </label>
        </div>

        <div>
            <label className="block text-sm font-medium mb-2">Intervalle d'actualisation (minutes)</label>
            <input
                type="number"
                min="1"
                max="60"
                value={cacheSettings.refreshIntervalMinutes}
                onChange={(e) => setCacheSettings({
                    ...cacheSettings,
                    refreshIntervalMinutes: parseInt(e.target.value)
                })}
                className={`w-full px-3 py-2 rounded border ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
            />
        </div>
    </div>

    {/* Statut du cache */}
    <div className="mb-6">
        <h4 className="font-semibold mb-3">Statut du cache</h4>
        {loadingCacheStatus ? (
            <p className="text-gray-400">Chargement...</p>
        ) : (
            <div className="space-y-2">
                <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="flex items-center justify-between">
                        <span className="font-medium">Ticker News</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                            cacheStatus.ticker_news?.cached && !cacheStatus.ticker_news?.expired
                                ? 'bg-green-500 text-white'
                                : 'bg-red-500 text-white'
                        }`}>
                            {cacheStatus.ticker_news?.cached && !cacheStatus.ticker_news?.expired ? '✅ Valide' : '❌ Expiré'}
                        </span>
                    </div>
                    {cacheStatus.ticker_news?.lastUpdate && (
                        <p className="text-xs text-gray-400 mt-1">
                            Dernière mise à jour: {new Date(cacheStatus.ticker_news.lastUpdate).toLocaleString()}
                        </p>
                    )}
                </div>

                <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="flex items-center justify-between">
                        <span className="font-medium">General News</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                            cacheStatus.general_news?.cached && !cacheStatus.general_news?.expired
                                ? 'bg-green-500 text-white'
                                : 'bg-red-500 text-white'
                        }`}>
                            {cacheStatus.general_news?.cached && !cacheStatus.general_news?.expired ? '✅ Valide' : '❌ Expiré'}
                        </span>
                    </div>
                    {cacheStatus.general_news?.lastUpdate && (
                        <p className="text-xs text-gray-400 mt-1">
                            Dernière mise à jour: {new Date(cacheStatus.general_news.lastUpdate).toLocaleString()}
                        </p>
                    )}
                </div>
            </div>
        )}
    </div>

    {/* Actions */}
    <div className="flex gap-2">
        <button
            onClick={async () => {
                setLoadingCacheStatus(true);
                const status = await checkCacheStatus(cacheSettings.maxAgeHours);
                setCacheStatus(status);
                setLoadingCacheStatus(false);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
        >
            🔄 Actualiser statut
        </button>

        <button
            onClick={async () => {
                const confirmed = confirm('Êtes-vous sûr de vouloir vider tout le cache ?');
                if (confirmed) {
                    await invalidateCache();
                    const status = await checkCacheStatus(cacheSettings.maxAgeHours);
                    setCacheStatus(status);
                }
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
        >
            🗑️ Vider le cache
        </button>
    </div>
</div>
```

---

## 📦 MISE À JOUR DES TYPES

**Fichier:** `/home/user/GOB/src/types/index.ts`

**Ajouter les types de cache dans TabProps:**

```typescript
export interface TabProps {
    isDarkMode?: boolean;
    tickers?: string[];
    setTickers?: (tickers: string[]) => void;
    stockData?: Record<string, StockData>;
    setStockData?: (data: Record<string, StockData>) => void;
    newsData?: NewsArticle[];
    setNewsData?: (news: NewsArticle[]) => void;
    loading?: boolean;
    setLoading?: (loading: boolean) => void;
    lastUpdate?: Date | null;
    setLastUpdate?: (date: Date | null) => void;
    initialLoadComplete?: boolean;
    API_BASE_URL?: string;
    fetchStockData?: (ticker: string) => Promise<any>;
    showMessage?: (message: string, type?: 'success' | 'error' | 'info') => void;
    getCompanyLogo?: (ticker: string) => string;
    emmaPopulateWatchlist?: () => Promise<void>;

    // NOUVEAUX: Props pour le cache
    cacheSettings?: CacheSettings;
    setCacheSettings?: (settings: CacheSettings) => void;
    cacheStatus?: CacheStatus;
    setCacheStatus?: (status: CacheStatus) => void;
    loadingCacheStatus?: boolean;
}
```

---

## ✅ CHECKLIST D'IMPLÉMENTATION

- [ ] 1. Créer `/src/utils/cacheManager.ts`
- [ ] 2. Ajouter imports dans `BetaCombinedDashboard.tsx`
- [ ] 3. Ajouter états de cache dans `BetaCombinedDashboard.tsx`
- [ ] 4. Ajouter useEffect pour persister cacheSettings
- [ ] 5. Ajouter useEffect pour charger statut du cache
- [ ] 6. Passer props de cache dans tabProps
- [ ] 7. Mettre à jour TabProps dans `/src/types/index.ts`
- [ ] 8. Intégrer cache dans `StocksNewsTab.tsx` (fonction fetchLatestNewsForTickers)
- [ ] 9. Intégrer cache dans `MarketsEconomyTab.tsx` (fonction fetchNews)
- [ ] 10. Ajouter interface de gestion du cache dans `AdminJSLaiTab.tsx`
- [ ] 11. Tester le cache (vérifier localStorage, Supabase, invalidation)
- [ ] 12. Vérifier performances (temps de chargement avec/sans cache)

---

## 🎯 RÉSULTAT ATTENDU

Après implémentation, le système devrait:

1. ✅ Charger les données depuis le cache si disponibles et valides
2. ✅ Faire l'appel API uniquement si cache manquant/expiré
3. ✅ Sauvegarder les nouvelles données dans le cache après fetch
4. ✅ Permettre la configuration de la durée de vie du cache
5. ✅ Afficher le statut du cache dans l'interface Admin
6. ✅ Permettre l'invalidation manuelle du cache
7. ✅ Réduire les appels API (économie de quotas)
8. ✅ Améliorer les temps de chargement

---

## 📊 IMPACT ATTENDU

**Performance:**
- Réduction de 60-80% des appels API pour les nouvelles
- Temps de chargement réduit de 50-70% avec cache valide
- Meilleure expérience utilisateur (chargement quasi-instantané)

**Économie:**
- Économie des quotas API FMP/Finnhub
- Réduction de la charge serveur Vercel
- Moins de requêtes Supabase

**Fiabilité:**
- Fallback gracieux si API en panne (utiliser cache même expiré)
- Données cohérentes sur une période donnée

---

**Date limite recommandée:** ASAP (24-48h)
**Complexité estimée:** 🟡 Moyenne (3-4h de développement)
**Tests requis:** ✅ Haute priorité

---

**Généré le:** 2025-11-18
**Par:** Claude (Plan d'Implémentation Automatisé)
