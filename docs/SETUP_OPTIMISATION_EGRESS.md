# 🚀 Guide de Déploiement - Optimisation Egress Supabase

## 📋 Étapes de Déploiement

### 1. Créer la Table `ticker_market_cache` dans Supabase

**Exécuter dans Supabase SQL Editor** :
```sql
-- Copier-coller le contenu de supabase-ticker-market-cache.sql
```

**Vérification** :
```sql
SELECT * FROM ticker_market_cache LIMIT 5;
```

---

### 2. Tester le Job Batch Manuellement

**Avant de configurer le cron, tester manuellement** :
```bash
curl -X POST https://gobapps.com/api/fmp-batch-sync
```

**Résultat attendu** :
```json
{
  "success": true,
  "tickersProcessed": 800,
  "executionTimeMs": 45000,
  "timestamp": "2025-12-06T..."
}
```

---

### 3. Configurer le Cron Vercel

**Le cron est déjà configuré dans `vercel.json`** :
```json
{
  "crons": [{
    "path": "/api/cron/fmp-batch-sync",
    "schedule": "*/5 * * * *"
  }]
}
```

**Fréquence** : Toutes les 5 minutes

**Pour ajuster** :
- **Toutes les 5 min** : `*/5 * * * *` ✅ (recommandé)
- **Toutes les 15 min** : `*/15 * * * *`
- **Toutes les heures** : `0 * * * *`

**Note** : Vercel Pro permet des crons toutes les minutes. Pour Hobby, utiliser `0 */15 * * * *` (toutes les 15 min).

---

### 4. Vérifier les Optimisations

**Requêtes Supabase optimisées** :
- ✅ `api/admin/tickers.js` : Colonnes spécifiques au lieu de `*`
- ✅ `api/terminal-data.js` : Colonnes spécifiques
- ✅ `api/kpi-engine.js` : Colonnes spécifiques

**Nouveaux endpoints** :
- ✅ `/api/fmp-batch-sync` : Job batch (manuel ou cron)
- ✅ `/api/market-data-batch` : Récupération optimisée

---

### 5. Monitoring Post-Déploiement

**Dans Supabase Dashboard** :

1. **Logs** → Filtrer par :
   - Type: `http`
   - Endpoint: `/rest/v1/ticker_market_cache`
   - Vérifier la fréquence (devrait être ~288/jour au lieu de 1,162,979)

2. **Database** → `ticker_market_cache` :
   - Vérifier que les données sont mises à jour toutes les 5 min
   - Vérifier `expires_at` (devrait être NOW() + 15 min)

3. **Usage** → Egress :
   - Surveiller la courbe (devrait s'écraser à ~100-300 MB/jour)

---

## 📊 Résultats Attendus

### Avant
- **Requêtes/jour** : 1,162,979
- **Egress/jour** : ~3 Go
- **Pattern** : 1 requête/ticker/minute

### Après
- **Requêtes/jour** : ~10,000-20,000
- **Egress/jour** : ~100-300 MB
- **Pattern** : 1 batch toutes les 5 min + cache

**Réduction** : **10-30x** 🎯

---

## ⚠️ Points d'Attention

1. **FMP Rate Limits** :
   - Vérifier votre plan FMP (300 req/min pour free tier)
   - Le batch fait ~20 req/min max (safe)

2. **Cache Expiration** :
   - Par défaut : 15 minutes
   - Si données stale → fallback FMP direct

3. **Migration Progressive** :
   - Le frontend continue d'utiliser `fetchCompanyData` (compatible)
   - Le cache est utilisé en arrière-plan
   - Pas de breaking changes

---

## 🔧 Dépannage

### Le cron ne s'exécute pas
- Vérifier `vercel.json` → section `crons`
- Vérifier les logs Vercel → Cron Jobs
- Tester manuellement : `curl -X POST /api/cron/fmp-batch-sync`

### Les données ne se mettent pas à jour
- Vérifier que la table `ticker_market_cache` existe
- Vérifier que la fonction `upsert_ticker_market_cache_batch` existe
- Vérifier les logs du cron dans Vercel

### L'egress ne diminue pas
- Vérifier que les requêtes utilisent bien les colonnes spécifiques
- Vérifier que le frontend n'a pas de polling agressif
- Vérifier les logs Supabase pour identifier les endpoints les plus fréquents

---

## ✅ Checklist de Déploiement

- [ ] Table `ticker_market_cache` créée dans Supabase
- [ ] Fonction `upsert_ticker_market_cache_batch` créée
- [ ] Test manuel `/api/fmp-batch-sync` réussi
- [ ] Cron configuré dans `vercel.json`
- [ ] Déploiement Vercel réussi
- [ ] Vérification logs Supabase (fréquence réduite)
- [ ] Vérification egress (courbe qui s'écrase)
- [ ] Monitoring 24h pour confirmer la réduction

---

**Confiance** : Élevée sur la cause (polling par ticker) et sur les solutions architecturales.


