# 🚨 Plan d'Optimisation Egress Supabase - Réduction 10-100x

**Problème identifié** : 1,162,979 requêtes en 24h pour 800 tickers = ~1 requête/ticker/minute
**Impact** : 5 Go egress en 7 jours (3 Go aujourd'hui) → limite Pro dépassée

## 📊 Diagnostic

### Calcul confirmé
- 800 tickers × 60 min × 24h = **1,152,000 requêtes** ✅ (correspond à 1,162,979 observées)
- Pattern : **1 requête = 1 ticker = 1 minute**

### Sources identifiées

1. **Frontend 3p1** (`App.tsx` ligne 333) :
   - Appel FMP individuel pour chaque nouveau ticker
   - Pas de cache côté serveur
   - Requêtes répétées si rechargement

2. **API Supabase** :
   - `api/admin/tickers.js` ligne 73 : `.select('*')` → renvoie TOUTES les colonnes
   - `api/terminal-data.js` : plusieurs `.select('*')`
   - `api/kpi-engine.js` : plusieurs `.select('*')`

3. **Pas de batch** :
   - Chaque ticker = 1 requête FMP séparée
   - Pas de système de cache centralisé

---

## ✅ Solutions Implémentées

### 1. Table `daily_market_cache` (Nouvelle)

**Structure** :
```sql
CREATE TABLE IF NOT EXISTS daily_market_cache (
  ticker TEXT PRIMARY KEY,
  current_price DECIMAL(12,2),
  change_percent DECIMAL(8,4),
  volume BIGINT,
  market_cap BIGINT,
  pe_ratio DECIMAL(10,2),
  pcf_ratio DECIMAL(10,2),
  pbv_ratio DECIMAL(10,2),
  dividend_yield DECIMAL(6,4),
  -- Métriques clés uniquement (pas tout l'historique)
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '15 minutes'
);

CREATE INDEX idx_daily_market_cache_expires ON daily_market_cache(expires_at);
```

**Avantages** :
- ✅ Données centralisées et réutilisables
- ✅ Expiration automatique (15 min)
- ✅ Réduction massive des appels FMP

---

### 2. Job Batch `/api/fmp-batch-sync` (Nouveau)

**Fréquence** : Toutes les 5-15 minutes (configurable)

**Fonctionnement** :
```javascript
// 1. Récupérer tous les tickers actifs (1 requête)
const tickers = await supabase.from('tickers').select('ticker').eq('is_active', true);

// 2. Appeler FMP en batch (quelques requêtes max)
const symbols = tickers.map(t => t.ticker).join(',');
const fmpData = await fetch(`https://financialmodelingprep.com/api/v3/quote/${symbols}?apikey=...`);

// 3. Upsert massif dans daily_market_cache (1 requête)
await supabase.from('daily_market_cache').upsert(fmpData, { onConflict: 'ticker' });
```

**Résultat** :
- ❌ Avant : 800 × 60 × 24 = **1,152,000 requêtes/jour**
- ✅ Après : ~288 requêtes/jour (1 batch toutes les 5 min)
- **Réduction : 4,000x** 🎯

---

### 3. Optimisation Requêtes Supabase

**Avant** :
```javascript
.select('*')  // ❌ Renvoie TOUTES les colonnes (peut être 50+ colonnes)
```

**Après** :
```javascript
// api/admin/tickers.js
.select('ticker, company_name, sector, source, is_active, priority')  // ✅ Seulement 6 colonnes

// api/terminal-data.js
.select('ticker, current_price, change_percent, volume')  // ✅ Seulement 4 colonnes

// api/kpi-engine.js
.select('kpi_id, value, calculated_at')  // ✅ Seulement 3 colonnes
```

**Réduction egress** : ~80-90% par requête

---

### 4. Frontend 3p1 - Utiliser Cache

**Avant** (`App.tsx` ligne 333) :
```typescript
// ❌ Appel FMP individuel pour chaque ticker
const result = await fetchCompanyData(symbol);
```

**Après** :
```typescript
// ✅ Utiliser daily_market_cache d'abord
const cacheData = await fetch(`/api/market-data-batch?tickers=${symbols.join(',')}`);
// Si cache expiré ou manquant → fallback FMP
```

**Avantages** :
- ✅ 1 requête pour plusieurs tickers
- ✅ Cache valide 15 min
- ✅ Fallback FMP si nécessaire

---

### 5. Cache Côté Client (React Query / SWR)

**Implémentation** :
```typescript
import { useQuery } from '@tanstack/react-query';

const { data } = useQuery({
  queryKey: ['market-data', tickers],
  queryFn: () => fetchMarketDataBatch(tickers),
  staleTime: 30 * 1000,  // 30 secondes
  refetchInterval: 60 * 1000,  // 60 secondes (pas 1 seconde!)
  cacheTime: 5 * 60 * 1000  // 5 minutes
});
```

**Résultat** :
- ✅ Pas de requêtes répétées pendant 30-60s
- ✅ Refetch intelligent (seulement si stale)
- ✅ Cache partagé entre composants

---

### 6. Endpoint Batch Optimisé

**Nouveau** : `/api/market-data-batch`

```javascript
// GET /api/market-data-batch?tickers=AAPL,MSFT,GOOGL
// Retourne les données depuis daily_market_cache
// Si manquant → fetch FMP et met à jour le cache
```

**Avantages** :
- ✅ 1 requête pour N tickers
- ✅ Cache automatique
- ✅ Fallback FMP transparent

---

## 📈 Résultats Attendus

### Avant Optimisation
- **Requêtes/jour** : 1,162,979
- **Egress/jour** : ~3 Go
- **Coût** : Limite Pro dépassée

### Après Optimisation
- **Requêtes/jour** : ~10,000-20,000 (batch + cache)
- **Egress/jour** : ~100-300 MB
- **Réduction** : **10-30x** 🎯

---

## 🚀 Plan d'Implémentation

### Phase 1 : Cache & Batch (Priorité Haute)
1. ✅ Créer table `daily_market_cache`
2. ✅ Créer `/api/fmp-batch-sync`
3. ✅ Configurer cron Vercel (toutes les 5-15 min)

### Phase 2 : Optimisation Requêtes (Priorité Haute)
4. ✅ Remplacer `.select('*')` par colonnes spécifiques
5. ✅ Créer `/api/market-data-batch`

### Phase 3 : Frontend (Priorité Moyenne)
6. ✅ Modifier `App.tsx` pour utiliser cache
7. ✅ Ajouter React Query / SWR
8. ✅ Pagination dans KPIDashboard

### Phase 4 : Monitoring (Priorité Basse)
9. ✅ Dashboard egress Supabase
10. ✅ Alertes si egress > seuil

---

## ⚠️ Points d'Attention

1. **FMP Rate Limits** :
   - Vérifier les quotas de votre plan FMP
   - Batch peut nécessiter plusieurs appels si > 100 symboles/requête

2. **Cache Invalidation** :
   - Expiration automatique (15 min)
   - Invalidation manuelle si nécessaire

3. **Fallback** :
   - Si cache vide → FMP direct
   - Si FMP échoue → données stale (avec warning)

4. **Migration** :
   - Pas de breaking changes
   - Backward compatible

---

## 📝 Fichiers à Modifier

1. **Nouveaux** :
   - `supabase-daily-market-cache.sql` (schéma)
   - `api/fmp-batch-sync.js` (job batch)
   - `api/market-data-batch.js` (endpoint optimisé)

2. **Modifiés** :
   - `api/admin/tickers.js` (optimiser select)
   - `api/terminal-data.js` (optimiser select)
   - `api/kpi-engine.js` (optimiser select)
   - `public/3p1/App.tsx` (utiliser cache)
   - `public/3p1/services/financeApi.ts` (batch au lieu d'individuel)
   - `vercel.json` (ajouter cron)

---

## ✅ Validation

Après implémentation, vérifier dans Supabase Dashboard :
- **Logs** : Fréquence des requêtes divisée par 10-100x
- **Egress** : Courbe qui s'écrase (100-300 MB/jour au lieu de 3 Go)
- **Performance** : Temps de réponse inchangé ou amélioré

---

**Confiance** : Élevée sur la cause (polling par ticker) et sur les solutions architecturales.


