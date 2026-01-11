# 🔵 Explication: Quand le Fond BLEU Apparaît

**Date:** 2026-01-11

---

## 🎯 Question

**Quand est-ce que le fond BLEU apparaît pour indiquer "Données FMP ajustées"?**

---

## ✅ Réponse Détaillée

Le fond **BLEU** (`dataSource: 'fmp-adjusted'`) apparaît dans les cas suivants:

### 1. **Merge avec Préservation de Valeurs Existantes** ⭐ (Cas Principal)

**Quand:** Lors d'une synchronisation FMP, si des valeurs existantes sont préservées au lieu d'être remplacées par les données FMP.

**Conditions exactes:**
```typescript
const hasPreservedValues = 
    (newRowTyped.earningsPerShare <= 0 && existingRow.earningsPerShare > 0) ||
    (newRowTyped.cashFlowPerShare <= 0 && existingRow.cashFlowPerShare > 0) ||
    (newRowTyped.bookValuePerShare <= 0 && existingRow.bookValuePerShare > 0) ||
    (newRowTyped.dividendPerShare <= 0 && existingRow.dividendPerShare > 0) ||
    (newRowTyped.priceHigh <= 0 && existingRow.priceHigh > 0) ||
    (newRowTyped.priceLow <= 0 && existingRow.priceLow > 0);

// Si hasPreservedValues = true → dataSource = 'fmp-adjusted'
```

**Exemple concret:**
- FMP retourne `dividendPerShare: 0` pour l'année 2023
- Vous avez déjà `dividendPerShare: 2.50` dans vos données
- Le système **préserve** votre valeur `2.50` au lieu d'utiliser `0`
- Résultat: Fond BLEU car la donnée FMP a été "ajustée" avec votre valeur existante

---

### 2. **Ajustements de Métriques Manquantes** (syncOnlyMissingMetrics)

**Quand:** Si l'option `syncOnlyMissingMetrics` est activée et que certaines métriques sont remplies depuis FMP.

**Conditions:**
```typescript
if (options.syncOnlyMissingMetrics) {
    // Si une métrique existante était à 0 et FMP fournit une valeur > 0
    if ((existingRow.earningsPerShare === 0 || existingRow.earningsPerShare === null) && 
        typedNewRow.earningsPerShare > 0) {
        updatedRow.earningsPerShare = typedNewRow.earningsPerShare;
        updatedRow.dataSource = 'fmp-adjusted' as const; // ✅ BLEU
    }
    // Même logique pour CF, BV, DIV, priceHigh, priceLow
}
```

**Exemple:**
- Vous avez `earningsPerShare: 0` pour 2022
- FMP retourne `earningsPerShare: 5.20` pour 2022
- Le système remplit le `0` avec `5.20` depuis FMP
- Résultat: Fond BLEU car c'est un ajustement (remplissage d'une valeur manquante)

---

### 3. **Nouvelles Années Ajoutées** (syncOnlyNewYears)

**Quand:** Si l'option `syncOnlyNewYears` est activée et qu'une nouvelle année est ajoutée.

**Note:** Les nouvelles années sont généralement marquées comme `'fmp-verified'` (VERT), mais peuvent être BLEU si elles sont mergées avec des données existantes.

---

## 🔍 Différence: VERT vs BLEU

### Fond VERT (`fmp-verified`)
- ✅ Données FMP **directement** utilisées, **sans modification**
- ✅ Aucune valeur existante préservée
- ✅ 100% vérifiées et officielles

**Exemple:**
```typescript
// FMP retourne: { year: 2024, earningsPerShare: 5.20, ... }
// Vous n'avez pas de données pour 2024
// Résultat: dataSource = 'fmp-verified' (VERT)
```

### Fond BLEU (`fmp-adjusted`)
- 🔵 Données FMP **mergées** avec des valeurs existantes
- 🔵 Certaines valeurs préservées au lieu d'utiliser FMP
- 🔵 **Pas 100% vérifiées** car modifiées lors du merge

**Exemple:**
```typescript
// FMP retourne: { year: 2023, earningsPerShare: 0, dividendPerShare: 0 }
// Vous avez déjà: { year: 2023, earningsPerShare: 5.20, dividendPerShare: 2.50 }
// Résultat: 
//   - earningsPerShare: 5.20 (préservé) → dataSource = 'fmp-adjusted' (BLEU)
//   - dividendPerShare: 2.50 (préservé) → dataSource = 'fmp-adjusted' (BLEU)
```

---

## 📊 Scénarios Concrets

### Scénario 1: Synchronisation avec Données Existantes

**Situation:**
- Vous avez déjà des données pour AAPL (2020-2023)
- Vous synchronisez depuis FMP
- FMP retourne certaines valeurs à 0

**Résultat:**
- ✅ Valeurs FMP > 0 → Fond VERT (remplace vos données)
- 🔵 Valeurs FMP = 0 mais vous avez une valeur > 0 → Fond BLEU (préserve votre valeur)

### Scénario 2: Remplissage de Métriques Manquantes

**Situation:**
- Vous avez `earningsPerShare: 0` pour 2022
- FMP retourne `earningsPerShare: 5.20` pour 2022
- Option `syncOnlyMissingMetrics` activée

**Résultat:**
- 🔵 Fond BLEU car c'est un ajustement (remplissage d'une valeur manquante)

### Scénario 3: Synchronisation Complète (Force Replace)

**Situation:**
- Option `forceReplace: true` activée
- Toutes les données FMP remplacent les existantes

**Résultat:**
- ✅ Fond VERT pour toutes les données (aucune préservation)

---

## 🎯 Comment Obtenir Uniquement du VERT?

Pour avoir **uniquement** du fond VERT (données 100% vérifiées):

1. **Synchroniser sans données existantes**
   - Supprimer toutes les données existantes avant la sync
   - Ou utiliser un nouveau ticker

2. **Utiliser `forceReplace: true`**
   - Force le remplacement de toutes les valeurs
   - Même les valeurs manuelles sont remplacées

3. **S'assurer que FMP retourne toutes les valeurs > 0**
   - Si FMP retourne des 0, vos valeurs existantes seront préservées → BLEU

---

## ⚠️ Pourquoi le BLEU Existe?

Le fond BLEU existe pour **protéger vos données**:

- ✅ **Évite de perdre vos valeurs** si FMP retourne des 0
- ✅ **Préserve vos modifications manuelles** lors des syncs
- ✅ **Indique visuellement** que les données ne sont pas 100% de FMP
- ✅ **Permet de distinguer** les données vérifiées (VERT) des ajustées (BLEU)

---

## 📋 Résumé

**Fond BLEU apparaît quand:**
1. ✅ FMP retourne une valeur à 0 mais vous avez une valeur > 0 (préservée)
2. ✅ Une métrique manquante (0) est remplie depuis FMP
3. ✅ Des valeurs existantes sont mergées avec des données FMP
4. ✅ Le merge combine FMP + données Supabase/manuelles

**Fond VERT apparaît quand:**
1. ✅ Données FMP utilisées directement sans modification
2. ✅ Aucune valeur existante préservée
3. ✅ Nouvelle année ajoutée depuis FMP (sans données existantes)
4. ✅ `forceReplace: true` activé

---

## 💡 Astuce

Si vous voyez beaucoup de BLEU et voulez du VERT:
- Utilisez `forceReplace: true` lors de la synchronisation
- Ou supprimez les données existantes avant de synchroniser
- Vérifiez que FMP retourne bien des valeurs > 0 (pas des 0)
