# 💾 Sauvegarde dans Supabase - Comportement Complet

## 🎯 Vue d'Ensemble

Après une **synchronisation**, les données sont sauvegardées dans Supabase via des **snapshots**. Cependant, il y a une distinction importante entre les **snapshots** (Supabase) et les **profils** (LocalStorage).

---

## ✅ OUI : Les Snapshots sont TOUJOURS Sauvegardés dans Supabase

### 📊 Table `finance_pro_snapshots` (Supabase)

**Contenu sauvegardé** :
- ✅ `annual_data` : Toutes les données historiques (avec merge intelligent)
- ✅ `assumptions` : Toutes les hypothèses (cases orange recalculées + exclusions préservées)
- ✅ `company_info` : Informations entreprise (nom, secteur, métriques ValueLine, etc.)
- ✅ `notes` : Notes utilisateur
- ✅ `is_current` : true = version actuelle, false = historique
- ✅ `auto_fetched` : true = sync API, false = manuelle
- ✅ `version` : Numéro auto-incrémenté
- ✅ `snapshot_date` : Date de création

---

## 🔄 Comportement lors de la Synchronisation

### 1. **"Sync. Données" (Analyse - Un ticker)**

**Séquence** :
1. (Optionnel) Sauvegarde snapshot "Before API sync" si demandé
2. Récupère données FMP
3. Merge intelligent des données
4. Recalcule les assumptions (cases orange)
5. **✅ Sauvegarde automatique dans Supabase** :
   ```typescript
   await saveSnapshot(
       activeId,
       finalData,              // Données mergées
       {
           ...assumptions,
           ...autoFilledAssumptions  // Cases orange recalculées
       },
       info,
       `API sync - ${new Date().toLocaleString()}`,
       true,   // is_current = true
       true    // auto_fetched = true
   );
   ```

**Résultat** :
- ✅ Snapshot créé dans Supabase avec `is_current=true`
- ✅ Toutes les données (mergées) sont sauvegardées
- ✅ Toutes les assumptions (recalculées) sont sauvegardées
- ✅ Les exclusions (checkboxes) sont préservées et sauvegardées

---

### 2. **"Synchroniser tous les tickers" (Sidebar)**

**Séquence** (pour chaque ticker) :
1. **✅ Sauvegarde snapshot "Avant"** dans Supabase :
   ```typescript
   await saveSnapshot(
       tickerSymbol,
       profile.data,
       profile.assumptions,
       profile.info,
       `Avant synchronisation globale - ${new Date().toLocaleString()}`,
       false,  // is_current = false (backup)
       false   // auto_fetched = false
   );
   ```

2. Récupère données FMP
3. Merge intelligent
4. Recalcule les assumptions

5. **✅ Sauvegarde snapshot "Après"** dans Supabase :
   ```typescript
   await saveSnapshot(
       tickerSymbol,
       mergedData,              // Données mergées
       {
           ...profile.assumptions,
           ...autoFilledAssumptions  // Cases orange recalculées
       },
       {
           ...profile.info,
           ...result.info
       },
       `Synchronisation globale - ${new Date().toLocaleString()}`,
       true,   // is_current = true
       true    // auto_fetched = true
   );
   ```

**Résultat** :
- ✅ **2 snapshots** créés par ticker dans Supabase :
  - 1 snapshot "Avant" (backup, `is_current=false`)
  - 1 snapshot "Après" (version actuelle, `is_current=true`)
- ✅ Toutes les données et assumptions sont sauvegardées

---

## 📋 Ce qui est Sauvegardé dans Supabase

### ✅ Dans `finance_pro_snapshots` (Snapshots)

| Champ | Contenu | Exemple |
|-------|---------|---------|
| `annual_data` | Données historiques mergées | `[{year: 2020, earningsPerShare: 3.28, ...}, ...]` |
| `assumptions` | Toutes les hypothèses | `{growthRateEPS: 8.88, targetPE: 28.9, excludeEPS: false, ...}` |
| `company_info` | Infos entreprise | `{name: "Apple Inc.", sector: "Technology", securityRank: "A++", ...}` |
| `notes` | Notes utilisateur | `"API sync - 4 déc 2025 12:30"` |
| `is_current` | Version actuelle | `true` ou `false` |
| `auto_fetched` | Source des données | `true` (sync API) ou `false` (manuelle) |
| `version` | Numéro de version | `15` (auto-incrémenté) |
| `snapshot_date` | Date de création | `2025-12-04T12:30:00Z` |

### ✅ Dans `tickers` (Liste des tickers)

| Champ | Contenu | Exemple |
|-------|---------|---------|
| `ticker` | Symbole | `"AAPL"` |
| `company_name` | Nom entreprise | `"Apple Inc."` |
| `sector` | Secteur | `"Technology"` |
| `source` | Source | `"team"`, `"watchlist"`, `"both"`, `"manual"` |
| `security_rank` | ValueLine | `"A++"` |
| `earnings_predictability` | ValueLine | `95` |
| `price_growth_persistence` | ValueLine | `"A+"` |
| `price_stability` | ValueLine | `90` |
| `beta` | Beta | `1.28` |

**⚠️ NE contient PAS** :
- ❌ Les données historiques annuelles
- ❌ Les assumptions (growthRateEPS, targetPE, etc.)
- ❌ Les notes utilisateur
- ❌ Les versions/snapshots

---

## ❌ Ce qui N'EST PAS Sauvegardé dans Supabase

### 📦 LocalStorage uniquement (Profils)

Les **profils complets** (`library`) sont sauvegardés dans **LocalStorage uniquement**, pas dans Supabase :

```typescript
// Dans App.tsx
const STORAGE_KEY = 'finance-pro-profiles';

// Sauvegarde automatique dans LocalStorage
localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
```

**Contenu** :
- ✅ Tous les profils (tickers) avec leurs données
- ✅ Données historiques
- ✅ Assumptions
- ✅ Company info
- ✅ Notes
- ✅ `isWatchlist`
- ✅ `lastModified`

**Pourquoi LocalStorage et pas Supabase ?**
- ⚡ **Performance** : Accès instantané, pas de latence réseau
- 💾 **Taille** : Les profils peuvent être volumineux (plusieurs années de données)
- 🔄 **Fréquence** : Modifications fréquentes (chaque modification sauvegarde LocalStorage)
- 📊 **Usage** : Les snapshots Supabase servent d'historique, LocalStorage sert de cache actif

---

## 🔍 Flux Complet de Sauvegarde

### Scénario : Synchronisation d'AAPL

#### 1. **Avant la Sync**
- **LocalStorage** : Profil AAPL avec données et assumptions
- **Supabase** : Snapshots historiques (versions précédentes)

#### 2. **Pendant la Sync**
- Récupère données FMP
- Merge intelligent
- Recalcule assumptions

#### 3. **Après la Sync**

**LocalStorage** :
```typescript
library['AAPL'] = {
    id: 'AAPL',
    data: mergedData,              // Données mergées
    assumptions: {
        ...autoFilledAssumptions,  // Cases orange recalculées
        excludeEPS: false,          // Exclusions préservées
        excludeCF: false,
        // ...
    },
    info: updatedInfo,
    lastModified: Date.now()
};
```

**Supabase** (`finance_pro_snapshots`) :
```json
{
    "ticker": "AAPL",
    "annual_data": [/* données mergées */],
    "assumptions": {
        "growthRateEPS": 8.88,      // Recalculé
        "targetPE": 28.9,           // Recalculé
        "excludeEPS": false,         // Préservé
        "excludeCF": false,          // Préservé
        // ...
    },
    "company_info": {/* infos mergées */},
    "notes": "API sync - 4 déc 2025 12:30",
    "is_current": true,
    "auto_fetched": true,
    "version": 15
}
```

---

## 📊 Tableau Récapitulatif

| Élément | LocalStorage | Supabase `tickers` | Supabase `snapshots` |
|---------|--------------|-------------------|---------------------|
| **Liste des tickers** | ✅ | ✅ | ❌ |
| **Données historiques** | ✅ | ❌ | ✅ |
| **Assumptions (cases orange)** | ✅ | ❌ | ✅ |
| **Exclusions (checkboxes)** | ✅ | ❌ | ✅ |
| **Company info** | ✅ | ✅ (partiel) | ✅ (complet) |
| **Métriques ValueLine** | ✅ | ✅ | ✅ |
| **Notes utilisateur** | ✅ | ❌ | ✅ |
| **Versions historiques** | ❌ | ❌ | ✅ |
| **isWatchlist** | ✅ | ✅ (via `source`) | ✅ (via `is_watchlist`) |

---

## ⚠️ Points Importants

### 1. **Snapshots = Historique Complet**

Chaque snapshot dans Supabase contient **TOUT** :
- ✅ Données historiques complètes
- ✅ Assumptions complètes (cases orange recalculées + exclusions préservées)
- ✅ Company info complète
- ✅ Notes

### 2. **LocalStorage = Cache Actif**

Les profils dans LocalStorage sont :
- ✅ Mis à jour en temps réel (chaque modification)
- ✅ Utilisés pour l'affichage immédiat
- ❌ **Non synchronisés** avec Supabase automatiquement
- ✅ **Synchronisés** via snapshots lors des syncs

### 3. **Sauvegarde Automatique**

Après chaque synchronisation :
- ✅ **Snapshot créé automatiquement** dans Supabase
- ✅ **LocalStorage mis à jour** automatiquement
- ✅ **Pas d'action manuelle requise**

### 4. **Récupération des Données**

Pour récupérer les données depuis Supabase :
- ✅ **Snapshots** : Via `loadSnapshot(snapshotId)` → Charge depuis Supabase
- ✅ **Tickers** : Via `loadAllTickersFromSupabase()` → Charge la liste depuis Supabase
- ✅ **Profils** : Depuis LocalStorage (pas directement depuis Supabase)

---

## 🔄 Exemple Concret : Synchronisation d'AAPL

### État Initial

**LocalStorage** :
```json
{
  "AAPL": {
    "data": [/* données existantes */],
    "assumptions": {
      "growthRateEPS": 10.0,  // Modifié manuellement
      "targetPE": 30.0,        // Modifié manuellement
      "excludeBV": true        // BV exclu
    }
  }
}
```

**Supabase** :
- Snapshot v14 (version précédente)

### Après "Sync. Données"

**LocalStorage** :
```json
{
  "AAPL": {
    "data": [/* données mergées */],
    "assumptions": {
      "growthRateEPS": 8.88,   // 🔄 RECALCULÉ (était 10.0)
      "targetPE": 28.9,        // 🔄 RECALCULÉ (était 30.0)
      "excludeBV": true        // ✅ PRÉSERVÉ
    }
  }
}
```

**Supabase** (`finance_pro_snapshots`) :
```json
{
  "ticker": "AAPL",
  "version": 15,
  "annual_data": [/* données mergées */],
  "assumptions": {
    "growthRateEPS": 8.88,     // Sauvegardé (recalculé)
    "targetPE": 28.9,          // Sauvegardé (recalculé)
    "excludeBV": true          // Sauvegardé (préservé)
  },
  "is_current": true,
  "auto_fetched": true,
  "snapshot_date": "2025-12-04T12:30:00Z"
}
```

**Résultat** :
- ✅ **LocalStorage** : Mis à jour avec données mergées et assumptions recalculées
- ✅ **Supabase** : Nouveau snapshot v15 créé avec toutes les données
- ✅ **Récupérable** : Vous pouvez charger le snapshot v15 depuis Supabase à tout moment

---

## ✅ Checklist de Sauvegarde

Après une synchronisation :

- [ ] **Snapshot créé dans Supabase** (`finance_pro_snapshots`)
  - [ ] `annual_data` : Données mergées sauvegardées
  - [ ] `assumptions` : Cases orange recalculées + exclusions préservées sauvegardées
  - [ ] `company_info` : Infos mergées sauvegardées
  - [ ] `is_current` : `true` (version actuelle)
  - [ ] `auto_fetched` : `true` (sync API)
  - [ ] `version` : Auto-incrémenté

- [ ] **LocalStorage mis à jour**
  - [ ] Profil mis à jour avec données mergées
  - [ ] Assumptions mises à jour (recalculées)
  - [ ] `lastModified` : Timestamp mis à jour

- [ ] **Supabase `tickers`** (si nouveau ticker)
  - [ ] Nouveau ticker ajouté (si venant de Supabase)
  - [ ] Métriques ValueLine préservées

---

## 🎯 Conclusion

**OUI**, après chaque synchronisation :

1. ✅ **Un snapshot est TOUJOURS créé dans Supabase** avec :
   - Toutes les données mergées
   - Toutes les assumptions (cases orange recalculées + exclusions préservées)
   - Toutes les infos entreprise

2. ✅ **LocalStorage est mis à jour** avec les mêmes données

3. ✅ **Vous pouvez récupérer** le snapshot depuis Supabase à tout moment via `loadSnapshot()`

**Important** : Les snapshots Supabase servent d'**historique complet** et de **backup**, tandis que LocalStorage sert de **cache actif** pour des performances optimales.

