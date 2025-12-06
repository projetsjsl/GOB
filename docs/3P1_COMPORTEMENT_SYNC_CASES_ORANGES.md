# 🔄 Comportement des Cases Orange lors de la Synchronisation

## 🎯 Vue d'Ensemble

Les **cases orange** (Croissance % et Ratio Cible) sont des **hypothèses modifiables** que vous pouvez ajuster manuellement. Cependant, lors d'une **synchronisation**, leur comportement est spécifique.

---

## ⚠️ Comportement Important

### 🔄 **Les Cases Orange sont RECALCULÉES lors de la Synchronisation**

**Point critique** : Lorsque vous cliquez sur "Sync. Données" ou "Synchroniser tous les tickers", les valeurs des cases orange sont **recalculées automatiquement** basées sur les nouvelles données FMP, **même si vous les avez modifiées manuellement**.

### ✅ **Les Exclusions (Checkboxes) sont PRÉSERVÉES**

**Point important** : Les checkboxes d'inclusion/exclusion (☑️/☐) sont **toujours préservées** lors de la synchronisation. Si vous avez exclu une métrique, elle reste exclue après la sync.

---

## 📊 Détail Champ par Champ

### 🟠 Cases Orange (RECALCULÉES)

| Champ | Comportement lors de la Sync | Exemple |
|-------|------------------------------|---------|
| **growthRateEPS** | ✅ Recalculé depuis les données FMP | Vous aviez 10%, sync recalcule à 8.5% |
| **growthRateCF** | ✅ Recalculé depuis les données FMP | Vous aviez 9%, sync recalcule à 7.3% |
| **growthRateBV** | ✅ Recalculé depuis les données FMP | Vous aviez 12%, sync recalcule à 13.4% |
| **growthRateDiv** | ✅ Recalculé depuis les données FMP | Vous aviez 5%, sync recalcule à 4.2% |
| **targetPE** | ✅ Recalculé (moyenne historique P/E) | Vous aviez 30x, sync recalcule à 28.9x |
| **targetPCF** | ✅ Recalculé (moyenne historique P/CF) | Vous aviez 22x, sync recalcule à 20.2x |
| **targetPBV** | ✅ Recalculé (moyenne historique P/BV) | Vous aviez 7x, sync recalcule à 6x |
| **targetYield** | ✅ Recalculé (moyenne historique Yield) | Vous aviez 1.5%, sync recalcule à 1.18% |

### ☑️ Exclusions (PRÉSERVÉES)

| Champ | Comportement lors de la Sync | Exemple |
|-------|------------------------------|---------|
| **excludeEPS** | ✅ Préservé | Si vous aviez exclu BPA, il reste exclu |
| **excludeCF** | ✅ Préservé | Si vous aviez exclu CFA, il reste exclu |
| **excludeBV** | ✅ Préservé | Si vous aviez exclu BV, il reste exclu |
| **excludeDIV** | ✅ Préservé | Si vous aviez exclu DIV, il reste exclu |

### 💰 Autres Champs

| Champ | Comportement lors de la Sync | Exemple |
|-------|------------------------------|---------|
| **currentPrice** | ✅ Mis à jour depuis FMP | 195.50 → 196.75 |
| **currentDividend** | ✅ Mis à jour depuis FMP | 1.00 → 1.05 |
| **baseYear** | ✅ Préservé | 2024 reste 2024 |
| **requiredReturn** | ✅ Préservé (si défini manuellement) | 10% reste 10% |
| **dividendPayoutRatio** | ✅ Préservé (si défini manuellement) | 14.8% reste 14.8% |

---

## 🔍 Exemple Concret : Synchronisation d'AAPL

### 📋 ÉTAT AVANT LA SYNCHRONISATION

Vous avez modifié manuellement les cases orange :

```json
{
  "growthRateEPS": 10.0,      // 🟠 Vous aviez modifié à 10%
  "targetPE": 30.0,            // 🟠 Vous aviez modifié à 30x
  "growthRateCF": 9.0,         // 🟠 Vous aviez modifié à 9%
  "targetPCF": 22.0,           // 🟠 Vous aviez modifié à 22x
  "excludeEPS": false,         // ☑️ BPA inclus
  "excludeCF": false,          // ☑️ CFA inclus
  "excludeBV": true,           // ☐ BV exclu (vous l'aviez exclu)
  "excludeDIV": false          // ☑️ DIV inclus
}
```

### 🔄 SYNCHRONISATION

Vous cliquez sur "Sync. Données". Le système :

1. **Récupère les nouvelles données FMP**
2. **Recalcule les growth rates** depuis les données historiques FMP
3. **Recalcule les target ratios** depuis les moyennes historiques FMP
4. **Préserve les exclusions** (excludeBV reste `true`)

### ✅ ÉTAT APRÈS LA SYNCHRONISATION

```json
{
  "growthRateEPS": 8.88,      // 🔄 RECALCULÉ (était 10.0)
  "targetPE": 28.9,            // 🔄 RECALCULÉ (était 30.0)
  "growthRateCF": 7.30,        // 🔄 RECALCULÉ (était 9.0)
  "targetPCF": 20.2,           // 🔄 RECALCULÉ (était 22.0)
  "excludeEPS": false,         // ✅ PRÉSERVÉ (BPA reste inclus)
  "excludeCF": false,          // ✅ PRÉSERVÉ (CFA reste inclus)
  "excludeBV": true,           // ✅ PRÉSERVÉ (BV reste exclu)
  "excludeDIV": false          // ✅ PRÉSERVÉ (DIV reste inclus)
}
```

**Résultat** :
- ❌ Vos modifications manuelles des cases orange (10%, 30x, 9%, 22x) ont été **écrasées**
- ✅ Vos exclusions (BV exclu) ont été **préservées**

---

## 💡 Pourquoi ce Comportement ?

### 🎯 Raison 1 : Cohérence avec les Données

Les cases orange sont des **hypothèses basées sur les données historiques**. Si les données FMP changent (nouvelles années, corrections), il est logique de **recalculer** les hypothèses pour qu'elles soient cohérentes avec les nouvelles données.

### 🎯 Raison 2 : Bonnes Pratiques

Le système utilise `autoFillAssumptionsFromFMPData()` qui :
- Calcule les **CAGR historiques** (taux de croissance moyens)
- Calcule les **moyennes historiques** des ratios (P/E, P/CF, etc.)
- Applique des **limites de sécurité** (ex: croissance max 20%, P/E max 100x)

Cela garantit que vos hypothèses sont **réalistes** et basées sur des **données réelles**.

### 🎯 Raison 3 : Exclusions = Choix Utilisateur

Les exclusions (checkboxes) sont des **choix stratégiques** de l'utilisateur (ex: "Je ne veux pas utiliser BV pour cette analyse"). Ces choix doivent être **préservés** car ils reflètent votre méthodologie, pas les données.

---

## ⚠️ Conséquences Pratiques

### ❌ Ce qui est ÉCRASÉ lors de la Sync

Si vous avez modifié manuellement :
- `growthRateEPS` de 8.5% à 10%
- `targetPE` de 28.9x à 30x
- `targetPCF` de 20.2x à 22x

**Après la sync**, ces valeurs seront **recalculées** et vos modifications seront **perdues**.

### ✅ Ce qui est PRÉSERVÉ lors de la Sync

Si vous avez :
- Exclu BV (`excludeBV: true`)
- Exclu DIV (`excludeDIV: true`)
- Défini `requiredReturn: 12%`
- Défini `dividendPayoutRatio: 15%`

**Après la sync**, ces valeurs seront **préservées**.

---

## 🔧 Comment Préserver vos Modifications des Cases Orange ?

### Option 1 : Sauvegarder un Snapshot AVANT la Sync

1. **Modifiez** les cases orange selon vos besoins
2. **Sauvegardez** un snapshot manuel (bouton "Sauvegarder")
3. **Synchronisez** les données
4. Si vous voulez récupérer vos valeurs, **chargez** le snapshot

### Option 2 : Modifier APRÈS la Sync

1. **Synchronisez** les données (les valeurs sont recalculées)
2. **Modifiez** les cases orange selon vos besoins
3. **Sauvegardez** un snapshot pour conserver vos modifications

### Option 3 : Ne Pas Synchroniser

Si vous avez des hypothèses très spécifiques que vous ne voulez pas perdre :
- **Ne synchronisez pas** les données
- **Travaillez** avec les données existantes
- **Sauvegardez** régulièrement vos modifications

---

## 📝 Code Technique : Comment ça Fonctionne

### Fonction `autoFillAssumptionsFromFMPData()`

```typescript
export const autoFillAssumptionsFromFMPData = (
  data: AnnualData[],
  currentPrice: number,
  existingAssumptions?: Partial<Assumptions>
): Partial<Assumptions> => {
  // 1. Calcule les CAGR historiques
  const histGrowthEPS = calculateCAGR(...);
  const histGrowthCF = calculateCAGR(...);
  // etc.
  
  // 2. Calcule les moyennes historiques des ratios
  const avgPE = calculateAverage(peRatios);
  const avgPCF = calculateAverage(pcfRatios);
  // etc.
  
  // 3. Retourne les nouvelles valeurs
  return {
    growthRateEPS: Math.min(Math.max(histGrowthEPS, 0), 20),  // 🔄 RECALCULÉ
    targetPE: parseFloat(Math.max(1, Math.min(avgPE, 100)).toFixed(1)),  // 🔄 RECALCULÉ
    // ...
    
    // ✅ PRÉSERVÉS
    excludeEPS: existingAssumptions?.excludeEPS,
    excludeCF: existingAssumptions?.excludeCF,
    excludeBV: existingAssumptions?.excludeBV,
    excludeDIV: existingAssumptions?.excludeDIV
  };
};
```

### Appel dans `performSync()`

```typescript
const autoFilledAssumptions = autoFillAssumptionsFromFMPData(
    mergedDataForCalc,
    result.currentPrice,
    assumptions // ✅ Préserve les exclusions
);

setAssumptions(prev => ({
    ...prev,
    ...autoFilledAssumptions // 🔄 Écrase les growth rates et target ratios
}));
```

---

## 🎯 Résumé

| Type de Champ | Comportement lors de la Sync | Raison |
|---------------|------------------------------|--------|
| **Cases Orange** (growthRate*, target*) | 🔄 **RECALCULÉES** | Basées sur les données historiques FMP |
| **Exclusions** (exclude*) | ✅ **PRÉSERVÉES** | Choix stratégique de l'utilisateur |
| **currentPrice** | ✅ **MIS À JOUR** | Donnée en temps réel depuis FMP |
| **requiredReturn** | ✅ **PRÉSERVÉ** | Hypothèse personnalisée |
| **dividendPayoutRatio** | ✅ **PRÉSERVÉ** | Hypothèse personnalisée |

---

## 💡 Recommandations

1. **Sauvegardez avant de synchroniser** si vous avez des hypothèses spécifiques
2. **Comprenez** que les cases orange sont des **suggestions basées sur les données historiques**
3. **Ajustez après la sync** si vous avez des raisons de croire que les valeurs recalculées ne sont pas appropriées
4. **Utilisez les exclusions** pour exclure des métriques que vous ne voulez pas utiliser, plutôt que de modifier les valeurs

---

## ✅ Checklist

- [ ] Les cases orange (Croissance %, Ratio Cible) sont **recalculées** lors de la sync
- [ ] Les exclusions (checkboxes ☑️/☐) sont **préservées** lors de la sync
- [ ] `currentPrice` et `currentDividend` sont **mis à jour** depuis FMP
- [ ] `requiredReturn` et `dividendPayoutRatio` sont **préservés** s'ils sont définis
- [ ] Pour préserver vos modifications des cases orange, **sauvegardez un snapshot** avant la sync

