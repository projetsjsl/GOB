# 🎯 Optimisation Egress Supabase - Version Révisée

## ✅ Changement d'Approche

**Problème initial** : Synchronisation de TOUT (prix + ratios + métriques) toutes les 5 minutes

**Solution révisée** : Synchroniser **UNIQUEMENT LES PRIX** quand nécessaire

---

## 📊 Architecture Révisée

### 1. Table `ticker_price_cache` (PRIX UNIQUEMENT)

**Structure simplifiée** :
```sql
CREATE TABLE ticker_price_cache (
    ticker TEXT PRIMARY KEY,
    current_price DECIMAL(12,2),
    change_percent DECIMAL(8,4),
    change_amount DECIMAL(12,2),
    volume BIGINT,
    market_cap BIGINT,
    updated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);
```

**Pas de ratios/métriques** → Réduction massive de l'egress

---

### 2. Synchronisation des Prix

**Quand synchroniser** :
- ✅ **beta-dashboard** : Quand l'utilisateur est sur le site (à la demande ou cron léger)
- ✅ **3p1** : Uniquement les prix des tickers (pas les données fondamentales)

**Fréquence** :
- **Option 1 (Recommandée)** : Appel manuel depuis le frontend quand nécessaire
- **Option 2** : Cron toutes les 15 min (si beta-dashboard toujours ouvert)

**Ce qui est synchronisé** :
- ✅ Prix actuel
- ✅ Variation %
- ✅ Volume
- ✅ Market Cap
- ❌ **PAS** de ratios (P/E, P/CF, P/BV, Yield)
- ❌ **PAS** de métriques (EPS, Revenue, Net Income)

---

### 3. Données Fondamentales (3p1)

**Récupération à la demande** :
- Quand l'utilisateur ouvre un ticker dans 3p1
- Via `/api/fmp-company-data` (comme avant)
- **Pas de cache** pour les données fondamentales (changent rarement)

**Avantages** :
- ✅ Pas de synchronisation inutile
- ✅ Données toujours à jour quand nécessaire
- ✅ Réduction massive de l'egress

---

## 🔄 Flux Révisé

### Beta-Dashboard
```
1. Utilisateur ouvre beta-dashboard
2. Frontend appelle /api/market-data-batch?tickers=...
3. Si cache expiré → déclencher /api/fmp-batch-sync (prix uniquement)
4. Afficher les prix depuis le cache
```

### 3p1 - Prix des Tickers
```
1. Utilisateur ouvre 3p1
2. Frontend appelle /api/market-data-batch?tickers=... (prix uniquement)
3. Afficher les prix depuis le cache
```

### 3p1 - Données Fondamentales
```
1. Utilisateur ouvre un ticker spécifique
2. Frontend appelle /api/fmp-company-data?symbol=AAPL
3. Récupère TOUTES les données (ratios, métriques, historique)
4. Pas de cache - récupération à la demande
```

---

## 📈 Résultats Attendus

### Avant
- **Requêtes/jour** : 1,162,979
- **Egress/jour** : 3 Go
- **Données synchronisées** : Prix + Ratios + Métriques

### Après (Révisé)
- **Requêtes/jour** : ~5,000-10,000 (prix uniquement)
- **Egress/jour** : ~50-100 MB (prix uniquement)
- **Données synchronisées** : **PRIX UNIQUEMENT**

**Réduction** : **30-60x** 🎯

---

## 🚀 Déploiement

### 1. Créer la Table (Prix Uniquement)

```sql
-- Exécuter supabase-ticker-market-cache.sql (version révisée)
-- La table s'appelle maintenant ticker_price_cache
```

### 2. Modifier le Cron (Optionnel)

**Si vous voulez un cron automatique** :
```json
{
  "crons": [{
    "path": "/api/cron/fmp-batch-sync",
    "schedule": "*/15 * * * *"  // Toutes les 15 min (au lieu de 5)
  }]
}
```

**Recommandation** : Appel manuel depuis le frontend quand nécessaire

### 3. Frontend - Appel à la Demande

**Beta-Dashboard** :
```javascript
// Quand l'utilisateur ouvre le dashboard
async function refreshPrices() {
  const tickers = getVisibleTickers(); // Tickers visibles sur la page
  await fetch('/api/market-data-batch?tickers=' + tickers.join(','));
  
  // Si cache expiré, déclencher sync
  if (needsRefresh) {
    await fetch('/api/fmp-batch-sync', { method: 'POST' });
  }
}
```

---

## ✅ Avantages de l'Approche Révisée

1. **Réduction Massive** : Prix uniquement = 10x moins de données
2. **À la Demande** : Synchronisation seulement quand nécessaire
3. **Données Fondamentales Fraîches** : Récupérées à la demande dans 3p1
4. **Flexibilité** : Pas de cron obligatoire
5. **Performance** : Cache léger, requêtes rapides

---

## 📝 Fichiers Modifiés

- ✅ `supabase-ticker-market-cache.sql` → `ticker_price_cache` (prix uniquement)
- ✅ `api/fmp-batch-sync.js` → Synchronise prix uniquement
- ✅ `api/market-data-batch.js` → Retourne prix uniquement
- ✅ `vercel.json` → Cron optionnel (15 min au lieu de 5)

---

**Confiance** : Élevée - Approche beaucoup plus ciblée et efficace

