# 📊 Résumé: Données Manquantes dans Supabase

**Date:** 2026-01-11

---

## ⚠️ Données Manquantes Identifiées

### 📊 Vue d'Ensemble

| Champ | Tickers Manquants | Pourcentage | Priorité |
|-------|-------------------|-------------|----------|
| **Secteur** | 3 | 0.3% | ⚠️ Faible |
| **Security Rank** | 292 | 28.4% | 🔴 Élevée |
| **Earnings Predictability** | 292 | 28.4% | 🔴 Élevée |
| **Price Growth Persistence** | 292 | 28.4% | 🔴 Élevée |
| **Price Stability** | 292 | 28.4% | 🔴 Élevée |
| **Beta** | 90 | 8.8% | 🟡 Moyenne |

**Total tickers analysés:** 1028

---

## 🔴 Métriques ValueLine Manquantes

### Statistiques Globales

- **Tickers avec au moins une métrique ValueLine manquante:** 292 (28.4%)
- **Tickers avec toutes les métriques ValueLine:** 736 (71.6%)

### Répartition par Source

| Source | Tickers avec métriques manquantes | Total | Pourcentage |
|--------|-----------------------------------|-------|-------------|
| **manual** | 10 | 10 | **100.0%** 🔴 |
| **TSX** | 111 | 146 | **76.0%** 🔴 |
| **NASDAQ100** | 8 | 13 | **61.5%** 🟡 |
| **both** | 2 | 3 | **66.7%** 🔴 |
| **SP500,NASDAQ100** | 28 | 79 | **35.4%** 🟡 |
| **SP500** | 107 | 387 | **27.6%** 🟢 |
| **team** | 6 | 22 | **27.3%** 🟢 |
| **SP500,DOWJONES** | 1 | 18 | **5.6%** 🟢 |
| **watchlist** | 19 | 344 | **5.5%** 🟢 |
| **SP500,NASDAQ100,DOWJONES** | 0 | 6 | **0.0%** ✅ |

### Observations

1. **Sources avec le plus de données manquantes:**
   - `manual` (100%) - Tous les tickers manuels manquent de métriques ValueLine
   - `TSX` (76%) - La majorité des tickers canadiens manquent de métriques ValueLine
   - `both` (66.7%) - 2 sur 3 tickers manquent de métriques

2. **Sources avec le moins de données manquantes:**
   - `SP500,NASDAQ100,DOWJONES` (0%) - Tous complets ✅
   - `watchlist` (5.5%) - Très peu de données manquantes
   - `SP500,DOWJONES` (5.6%) - Très peu de données manquantes

---

## 🟡 Beta Manquant

- **90 tickers** (8.8%) manquent de beta
- Le beta est récupéré depuis l'API FMP, donc peut être complété automatiquement

---

## ⚠️ Secteur Manquant

- **3 tickers** (0.3%) manquent de secteur
- Impact minimal, mais peut être complété depuis FMP

---

## 📋 Recommandations

### 1. Métriques ValueLine (Priorité 🔴)

**Problème:** 292 tickers (28.4%) manquent de métriques ValueLine

**Solutions:**
- **Pour les tickers `manual`:** Ajouter manuellement les métriques ValueLine si disponibles
- **Pour les tickers `TSX`:** Vérifier si les métriques ValueLine sont disponibles pour les entreprises canadiennes
- **Pour les autres sources:** Compléter les métriques manquantes depuis ValueLine ou autres sources

**Impact:** Les métriques ValueLine sont utilisées dans l'interface pour l'analyse et les recommandations.

### 2. Beta (Priorité 🟡)

**Problème:** 90 tickers (8.8%) manquent de beta

**Solution:** Récupérer automatiquement depuis l'API FMP lors de la synchronisation

**Impact:** Le beta est affiché dans l'interface mais n'est pas critique pour l'analyse.

### 3. Secteur (Priorité ⚠️)

**Problème:** 3 tickers (0.3%) manquent de secteur

**Solution:** Compléter depuis l'API FMP

**Impact:** Minimal, utilisé principalement pour le filtrage.

---

## ✅ Actions Suggérées

1. **Compléter les métriques ValueLine pour les tickers `team` et `watchlist`** (priorité haute)
2. **Vérifier la disponibilité des métriques ValueLine pour les tickers `TSX`**
3. **Récupérer automatiquement le beta depuis FMP pour les 90 tickers manquants**
4. **Compléter les secteurs manquants pour les 3 tickers**

---

## 📄 Fichiers Générés

- ✅ `docs/ANALYSE_DONNEES_MANQUANTES.json` - Rapport détaillé JSON
- ✅ `docs/ANALYSE_DONNEES_MANQUANTES.md` - Rapport Markdown détaillé
- ✅ `docs/RESUME_DONNEES_MANQUANTES.md` - Ce document
