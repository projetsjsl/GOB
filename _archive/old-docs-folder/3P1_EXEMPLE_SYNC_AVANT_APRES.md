# 📊 Exemple Concret : Synchronisation d'un Ticker (AVANT / APRÈS)

## 🎯 Scénario : Synchronisation de AAPL (Apple Inc.)

Cet exemple montre **exactement** ce qui se passe lors d'une synchronisation, champ par champ.

---

## 📋 ÉTAT AVANT LA SYNCHRONISATION

### 📊 Données Historiques (`data`)

```json
[
  {
    "year": 2020,
    "priceHigh": 145.09,
    "priceLow": 53.15,
    "earningsPerShare": 3.28,
    "cashFlowPerShare": 4.45,
    "bookValuePerShare": 22.16,
    "dividendPerShare": 0.82,
    "autoFetched": true  // ✅ Récupéré depuis FMP précédemment
  },
  {
    "year": 2021,
    "priceHigh": 182.94,
    "priceLow": 116.21,
    "earningsPerShare": 5.61,
    "cashFlowPerShare": 6.11,
    "bookValuePerShare": 24.31,
    "dividendPerShare": 0.88,
    "autoFetched": true
  },
  {
    "year": 2022,
    "priceHigh": 179.61,
    "priceLow": 124.17,
    "earningsPerShare": 6.11,
    "cashFlowPerShare": 6.55,
    "bookValuePerShare": 25.83,
    "dividendPerShare": 0.92,
    "autoFetched": true
  },
  {
    "year": 2023,
    "priceHigh": 198.23,
    "priceLow": 124.17,
    "earningsPerShare": 6.42,  // ⚠️ MODIFIÉ MANUELLEMENT (était 6.35)
    "cashFlowPerShare": 6.89,  // ⚠️ MODIFIÉ MANUELLEMENT (était 6.75)
    "bookValuePerShare": 26.45,
    "dividendPerShare": 0.96,
    "autoFetched": false  // 🔴 DONNÉE MANUELLE - SERA PRÉSERVÉE
  },
  {
    "year": 2024,
    "priceHigh": 220.00,  // ⚠️ MODIFIÉ MANUELLEMENT (était 215.00)
    "priceLow": 164.08,
    "earningsPerShare": 6.75,
    "cashFlowPerShare": 7.25,
    "bookValuePerShare": 27.50,
    "dividendPerShare": 1.00,
    "autoFetched": false  // 🔴 DONNÉE MANUELLE - SERA PRÉSERVÉE
  }
]
```

### 📈 Assumptions (Hypothèses)

```json
{
  "currentPrice": 195.50,  // Prix actuel du marché
  "currentDividend": 1.00,
  "baseYear": 2024,
  
  // Taux de croissance (calculés précédemment)
  "growthRateEPS": 8.5,      // CAGR historique EPS
  "growthRateSales": 7.2,
  "growthRateCF": 8.1,
  "growthRateBV": 5.5,
  "growthRateDiv": 4.2,
  
  // Ratios cibles (moyennes historiques)
  "targetPE": 28.5,          // P/E moyen historique
  "targetPCF": 26.2,
  "targetPBV": 7.8,
  "targetYield": 0.52,
  
  // Exclusions (choix utilisateur)
  "excludeEPS": false,
  "excludeCF": false,
  "excludeBV": false,
  "excludeDIV": false,
  
  // Autres
  "requiredReturn": 10.0,
  "dividendPayoutRatio": 14.8
}
```

### 🏢 Company Info

```json
{
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "sector": "Technology",
  "marketCap": "$3.0T",
  "beta": 1.25,
  
  // Métriques ValueLine (depuis Supabase/Excel)
  "securityRank": "A++",              // ✅ PRÉSERVÉ (FMP ne fournit pas)
  "earningsPredictability": 95,        // ✅ PRÉSERVÉ
  "priceGrowthPersistence": "A+",      // ✅ PRÉSERVÉ
  "priceStability": 90                 // ✅ PRÉSERVÉ
}
```

---

## 🔄 DONNÉES FMP RÉCUPÉRÉES (Nouvelles)

### 📊 Données Historiques FMP

```json
[
  {
    "year": 2020,
    "priceHigh": 145.09,
    "priceLow": 53.15,
    "earningsPerShare": 3.28,
    "cashFlowPerShare": 4.45,
    "bookValuePerShare": 22.16,
    "dividendPerShare": 0.82
  },
  {
    "year": 2021,
    "priceHigh": 182.94,
    "priceLow": 116.21,
    "earningsPerShare": 5.61,
    "cashFlowPerShare": 6.11,
    "bookValuePerShare": 24.31,
    "dividendPerShare": 0.88
  },
  {
    "year": 2022,
    "priceHigh": 179.61,
    "priceLow": 124.17,
    "earningsPerShare": 6.11,
    "cashFlowPerShare": 6.55,
    "bookValuePerShare": 25.83,
    "dividendPerShare": 0.92
  },
  {
    "year": 2023,
    "priceHigh": 198.23,
    "priceLow": 124.17,
    "earningsPerShare": 6.35,  // ⚠️ FMP retourne 6.35 (différent de notre 6.42)
    "cashFlowPerShare": 6.75,  // ⚠️ FMP retourne 6.75 (différent de notre 6.89)
    "bookValuePerShare": 26.45,
    "dividendPerShare": 0.96
  },
  {
    "year": 2024,
    "priceHigh": 215.00,  // ⚠️ FMP retourne 215.00 (différent de notre 220.00)
    "priceLow": 164.08,
    "earningsPerShare": 6.75,
    "cashFlowPerShare": 7.25,
    "bookValuePerShare": 27.50,
    "dividendPerShare": 1.00
  },
  {
    "year": 2025,  // 🆕 NOUVELLE ANNÉE depuis FMP
    "priceHigh": 225.00,
    "priceLow": 180.00,
    "earningsPerShare": 7.10,
    "cashFlowPerShare": 7.65,
    "bookValuePerShare": 28.20,
    "dividendPerShare": 1.05
  }
]
```

### 🏢 Info FMP

```json
{
  "symbol": "AAPL",
  "name": "Apple Inc.",  // ✅ Même nom
  "sector": "Technology",
  "marketCap": "$3.1T",  // ⚠️ Mis à jour (était $3.0T)
  "beta": 1.28,          // ⚠️ Mis à jour (était 1.25)
  
  // ⚠️ FMP ne fournit PAS les métriques ValueLine
  // Elles seront préservées depuis l'état existant
}
```

### 💰 Prix Actuel FMP

```json
{
  "currentPrice": 196.75  // ⚠️ Mis à jour (était 195.50)
}
```

---

## ✅ ÉTAT APRÈS LA SYNCHRONISATION

### 📊 Données Historiques Mergées (`data`)

```json
[
  {
    "year": 2020,
    "priceHigh": 145.09,  // ✅ Mis à jour depuis FMP (autoFetched: true)
    "priceLow": 53.15,
    "earningsPerShare": 3.28,
    "cashFlowPerShare": 4.45,
    "bookValuePerShare": 22.16,
    "dividendPerShare": 0.82,
    "autoFetched": true  // ✅ Mis à jour depuis FMP
  },
  {
    "year": 2021,
    "priceHigh": 182.94,  // ✅ Mis à jour depuis FMP
    "priceLow": 116.21,
    "earningsPerShare": 5.61,
    "cashFlowPerShare": 6.11,
    "bookValuePerShare": 24.31,
    "dividendPerShare": 0.88,
    "autoFetched": true
  },
  {
    "year": 2022,
    "priceHigh": 179.61,  // ✅ Mis à jour depuis FMP
    "priceLow": 124.17,
    "earningsPerShare": 6.11,
    "cashFlowPerShare": 6.55,
    "bookValuePerShare": 25.83,
    "dividendPerShare": 0.92,
    "autoFetched": true
  },
  {
    "year": 2023,
    "priceHigh": 198.23,
    "priceLow": 124.17,
    "earningsPerShare": 6.42,  // ✅ PRÉSERVÉ (donnée manuelle)
    "cashFlowPerShare": 6.89,  // ✅ PRÉSERVÉ (donnée manuelle)
    "bookValuePerShare": 26.45,
    "dividendPerShare": 0.96,
    "autoFetched": false  // 🔴 PRÉSERVÉ - Donnée manuelle non écrasée
  },
  {
    "year": 2024,
    "priceHigh": 220.00,  // ✅ PRÉSERVÉ (donnée manuelle)
    "priceLow": 164.08,
    "earningsPerShare": 6.75,
    "cashFlowPerShare": 7.25,
    "bookValuePerShare": 27.50,
    "dividendPerShare": 1.00,
    "autoFetched": false  // 🔴 PRÉSERVÉ - Donnée manuelle non écrasée
  },
  {
    "year": 2025,  // 🆕 AJOUTÉ depuis FMP
    "priceHigh": 225.00,
    "priceLow": 180.00,
    "earningsPerShare": 7.10,
    "cashFlowPerShare": 7.65,
    "bookValuePerShare": 28.20,
    "dividendPerShare": 1.05,
    "autoFetched": true  // ✅ Nouvelle année depuis FMP
  }
]
```

**🔍 Analyse du Merge :**
- ✅ **2020-2022** : `autoFetched: true` → **Mis à jour** depuis FMP
- 🔴 **2023** : `autoFetched: false` → **PRÉSERVÉ** (données manuelles 6.42 et 6.89)
- 🔴 **2024** : `autoFetched: false` → **PRÉSERVÉ** (priceHigh manuel 220.00)
- 🆕 **2025** : **AJOUTÉ** depuis FMP (nouvelle année)

### 📈 Assumptions Recalculées

```json
{
  "currentPrice": 196.75,  // ✅ Mis à jour depuis FMP (était 195.50)
  "currentDividend": 1.05,  // ✅ Mis à jour depuis FMP (dernière année)
  "baseYear": 2024,
  
  // 🔄 RECALCULÉS avec autoFillAssumptionsFromFMPData()
  // Utilise les données MERGÉES (incluant les données manuelles préservées)
  "growthRateEPS": 8.7,      // ⚠️ Recalculé (était 8.5) - basé sur données mergées
  "growthRateSales": 7.4,    // ⚠️ Recalculé (était 7.2)
  "growthRateCF": 8.3,       // ⚠️ Recalculé (était 8.1)
  "growthRateBV": 5.6,       // ⚠️ Recalculé (était 5.5)
  "growthRateDiv": 4.3,      // ⚠️ Recalculé (était 4.2)
  
  // 🔄 RECALCULÉS (moyennes historiques depuis données mergées)
  "targetPE": 28.8,          // ⚠️ Recalculé (était 28.5)
  "targetPCF": 26.5,         // ⚠️ Recalculé (était 26.2)
  "targetPBV": 7.9,          // ⚠️ Recalculé (était 7.8)
  "targetYield": 0.54,       // ⚠️ Recalculé (était 0.52)
  
  // ✅ PRÉSERVÉS (choix utilisateur)
  "excludeEPS": false,       // ✅ Préservé
  "excludeCF": false,        // ✅ Préservé
  "excludeBV": false,        // ✅ Préservé
  "excludeDIV": false,       // ✅ Préservé
  
  // ✅ PRÉSERVÉS (si définis manuellement)
  "requiredReturn": 10.0,    // ✅ Préservé
  "dividendPayoutRatio": 14.8  // ✅ Préservé
}
```

**🔍 Analyse des Assumptions :**
- ✅ **currentPrice** : Mis à jour depuis FMP
- ✅ **currentDividend** : Mis à jour depuis la dernière année FMP
- 🔄 **Growth rates** : Recalculés avec `autoFillAssumptionsFromFMPData()` basé sur les données mergées
- 🔄 **Target ratios** : Recalculés (moyennes historiques depuis données mergées)
- ✅ **Exclusions** : Préservées (choix utilisateur)
- ✅ **requiredReturn, dividendPayoutRatio** : Préservés si définis manuellement

### 🏢 Company Info Mergée

```json
{
  "symbol": "AAPL",
  "name": "Apple Inc.",  // ✅ Préservé (même nom)
  "sector": "Technology",  // ✅ Préservé
  "marketCap": "$3.1T",  // ✅ Mis à jour depuis FMP (était $3.0T)
  "beta": 1.28,          // ✅ Mis à jour depuis FMP (était 1.25)
  
  // ✅ PRÉSERVÉES depuis l'état existant (FMP ne les fournit pas)
  "securityRank": "A++",              // ✅ PRÉSERVÉ
  "earningsPredictability": 95,        // ✅ PRÉSERVÉ
  "priceGrowthPersistence": "A+",      // ✅ PRÉSERVÉ
  "priceStability": 90                 // ✅ PRÉSERVÉ
}
```

**🔍 Analyse de l'Info :**
- ✅ **marketCap, beta** : Mis à jour depuis FMP
- ✅ **Métriques ValueLine** : Préservées (FMP ne les fournit pas)

---

## 📝 RÉSUMÉ DES CHANGEMENTS

### ✅ Ce qui a été MIS À JOUR

| Champ | Avant | Après | Source |
|-------|-------|-------|--------|
| **Données 2020-2022** | Anciennes valeurs | Nouvelles valeurs FMP | FMP API |
| **currentPrice** | 195.50 | 196.75 | FMP API |
| **currentDividend** | 1.00 | 1.05 | FMP API (dernière année) |
| **marketCap** | $3.0T | $3.1T | FMP API |
| **beta** | 1.25 | 1.28 | FMP API |
| **growthRateEPS** | 8.5% | 8.7% | Recalculé (données mergées) |
| **targetPE** | 28.5 | 28.8 | Recalculé (moyennes historiques) |
| **Année 2025** | N'existait pas | Ajoutée | FMP API (nouvelle année) |

### 🔴 Ce qui a été PRÉSERVÉ

| Champ | Valeur | Raison |
|-------|--------|--------|
| **2023: earningsPerShare** | 6.42 (manuel) | `autoFetched: false` |
| **2023: cashFlowPerShare** | 6.89 (manuel) | `autoFetched: false` |
| **2024: priceHigh** | 220.00 (manuel) | `autoFetched: false` |
| **securityRank** | "A++" | ValueLine (FMP ne fournit pas) |
| **earningsPredictability** | 95 | ValueLine (FMP ne fournit pas) |
| **priceGrowthPersistence** | "A+" | ValueLine (FMP ne fournit pas) |
| **priceStability** | 90 | ValueLine (FMP ne fournit pas) |
| **excludeEPS, excludeCF, etc.** | false | Choix utilisateur |
| **requiredReturn** | 10.0% | Hypothèse personnalisée |

---

## 🎯 Points Clés à Retenir

1. **Données manuelles préservées** : Toutes les lignes avec `autoFetched: false` ou `undefined` sont **toujours préservées**, même si FMP retourne des valeurs différentes.

2. **Données auto-fetchées mises à jour** : Toutes les lignes avec `autoFetched: true` sont **mises à jour** avec les nouvelles valeurs FMP.

3. **Nouvelles années ajoutées** : Les années présentes dans FMP mais absentes localement sont **ajoutées** avec `autoFetched: true`.

4. **Métriques ValueLine préservées** : Elles ne sont **jamais écrasées** car FMP ne les fournit pas.

5. **Assumptions recalculées** : Les growth rates et target ratios sont **recalculés** avec `autoFillAssumptionsFromFMPData()` basé sur les **données mergées** (incluant les données manuelles préservées).

6. **Exclusions préservées** : Les flags `excludeEPS`, `excludeCF`, etc. sont **toujours préservés**.

7. **Prix et dividendes mis à jour** : `currentPrice` et `currentDividend` sont **toujours mis à jour** depuis FMP.

---

## 🔄 Snapshot Créé

Après la synchronisation, un snapshot est automatiquement créé :

```json
{
  "ticker": "AAPL",
  "snapshot_date": "2025-12-04T12:30:00Z",
  "version": 15,
  "is_current": true,
  "auto_fetched": true,
  "note": "API sync - 4 déc 2025 12:30",
  "annual_data": [/* Données mergées ci-dessus */],
  "assumptions": {/* Assumptions recalculées ci-dessus */},
  "company_info": {/* Info mergée ci-dessus */}
}
```

---

## ✅ Conclusion

La synchronisation :
- ✅ **Préserve** vos modifications manuelles
- ✅ **Met à jour** les données auto-fetchées
- ✅ **Ajoute** les nouvelles années
- ✅ **Préserve** les métriques ValueLine
- ✅ **Recalcule** les assumptions basées sur les données mergées
- ✅ **Crée** un snapshot pour traçabilité

**Résultat** : Vous avez les données les plus récentes de FMP, tout en conservant vos ajustements manuels et vos métriques ValueLine.

