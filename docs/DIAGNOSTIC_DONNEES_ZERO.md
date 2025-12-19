# 🔍 Diagnostic : Pourquoi des données à 0 dans Supabase ?

## 🎯 Problème Identifié

L'API FMP retourne bien des données (30 années pour BP), mais Supabase contient des données avec des valeurs à 0.

## 🔄 Flux de Synchronisation

### 1. **Batch Endpoint** (`api/fmp-company-data-batch-sync.js`)

Le batch endpoint récupère les données depuis FMP et les transforme :

```javascript
// Ligne 256-259
earningsPerShare: parseFloat(Number(metric.netIncomePerShare || metric.earningsPerShare || 0).toFixed(2)),
cashFlowPerShare: parseFloat(Number(metric.operatingCashFlowPerShare || 0).toFixed(2)),
bookValuePerShare: parseFloat(Number(metric.bookValuePerShare || 0).toFixed(2)),
dividendPerShare: parseFloat(Number(metric.dividendPerShare || 0).toFixed(2)),
```

**⚠️ PROBLÈME** : Si FMP ne retourne pas une valeur, elle est mise à `0` par défaut.

### 2. **Filtre des Lignes Vides** (Ligne 267)

```javascript
.filter(row => row.earningsPerShare > 0 || row.cashFlowPerShare > 0 || row.bookValuePerShare > 0);
```

Ce filtre supprime uniquement les lignes où **TOUTES** les valeurs sont à 0, mais **garde les lignes où certaines valeurs sont à 0**.

**Exemple** :
- ✅ Ligne avec EPS=0, CF=1.5, BV=2.0 → **GARDÉE** (CF > 0)
- ❌ Ligne avec EPS=0, CF=0, BV=0 → **SUPPRIMÉE** (toutes à 0)

### 3. **Sauvegarde dans Supabase** (`App.tsx` ligne 3246)

```typescript
await saveSnapshot(
    tickerSymbol,
    mergedData,  // ⚠️ Contient potentiellement des valeurs à 0
    finalAssumptions,
    updatedInfo,
    ...
);
```

Les données avec certaines valeurs à 0 sont **sauvegardées telles quelles** dans Supabase.

## 🔍 Causes Possibles

### 1. **FMP Key Metrics Incomplets**

FMP peut retourner des `key-metrics` avec certaines valeurs manquantes pour certaines années :
- `netIncomePerShare` peut être `null` ou `undefined` pour certaines années
- `operatingCashFlowPerShare` peut être `null` ou `undefined`
- Ces valeurs sont alors transformées en `0` par défaut

### 2. **Transformation Défaut à 0**

Le code utilise `|| 0` comme fallback :
```javascript
earningsPerShare: parseFloat(Number(metric.netIncomePerShare || metric.earningsPerShare || 0).toFixed(2))
```

Si `netIncomePerShare` est `null`, `undefined`, ou `0`, la valeur devient `0`.

### 3. **Pas de Vérification Avant Sauvegarde**

Le code ne vérifie pas si les données sont "corrompues" (toutes à 0) avant de sauvegarder dans Supabase.

## ✅ Solutions Proposées

### Solution 1 : Améliorer la Transformation des Données

**Avant** :
```javascript
earningsPerShare: parseFloat(Number(metric.netIncomePerShare || metric.earningsPerShare || 0).toFixed(2))
```

**Après** :
```javascript
earningsPerShare: metric.netIncomePerShare != null && metric.netIncomePerShare !== undefined
    ? parseFloat(Number(metric.netIncomePerShare).toFixed(2))
    : (metric.earningsPerShare != null && metric.earningsPerShare !== undefined
        ? parseFloat(Number(metric.earningsPerShare).toFixed(2))
        : null)  // null au lieu de 0
```

**Problème** : Cela nécessite de modifier le type `AnnualData` pour accepter `null`.

### Solution 2 : Ne Pas Sauvegarder les Lignes avec Valeurs à 0

**Avant** :
```javascript
.filter(row => row.earningsPerShare > 0 || row.cashFlowPerShare > 0 || row.bookValuePerShare > 0);
```

**Après** :
```javascript
.filter(row => {
    // Garder seulement les lignes avec au moins 2 valeurs non-nulles
    const nonZeroCount = [
        row.earningsPerShare > 0,
        row.cashFlowPerShare > 0,
        row.bookValuePerShare > 0,
        row.dividendPerShare > 0
    ].filter(Boolean).length;
    return nonZeroCount >= 2;  // Au moins 2 valeurs non-nulles
});
```

### Solution 3 : Vérifier Avant Sauvegarde (DÉJÀ IMPLÉMENTÉE)

La fonction `hasCorruptedData()` détecte maintenant les données corrompues et force une re-synchronisation.

### Solution 4 : Améliorer le Merge des Données

Lors du merge avec les données existantes, ne pas remplacer les valeurs existantes par des valeurs à 0 :

```typescript
const mergedData = existingData.map((existingRow) => {
    const newRow = newDataByYear.get(existingRow.year);
    
    if (!newRow) {
        return existingRow;  // Garder l'existant
    }
    
    // ⚠️ NOUVEAU : Ne pas remplacer par des valeurs à 0
    return {
        ...existingRow,
        earningsPerShare: (newRow.earningsPerShare > 0) ? newRow.earningsPerShare : existingRow.earningsPerShare,
        cashFlowPerShare: (newRow.cashFlowPerShare > 0) ? newRow.cashFlowPerShare : existingRow.cashFlowPerShare,
        bookValuePerShare: (newRow.bookValuePerShare > 0) ? newRow.bookValuePerShare : existingRow.bookValuePerShare,
        dividendPerShare: (newRow.dividendPerShare > 0) ? newRow.dividendPerShare : existingRow.dividendPerShare,
        priceHigh: (newRow.priceHigh > 0) ? newRow.priceHigh : existingRow.priceHigh,
        priceLow: (newRow.priceLow > 0) ? newRow.priceLow : existingRow.priceLow,
        autoFetched: true
    };
});
```

## 🎯 Recommandation

**Solution immédiate** : Utiliser la détection automatique déjà implémentée (`hasCorruptedData()`) qui force une re-synchronisation.

**Solution à long terme** : Implémenter la Solution 4 (améliorer le merge) pour éviter de sauvegarder des valeurs à 0 qui remplacent des valeurs existantes valides.

