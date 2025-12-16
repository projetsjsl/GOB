# 🔄 Flux de Données Optimisé - Finance Pro 3p1

## 📊 Vue d'Ensemble

Le flux de données suit cette logique optimisée pour éviter les redondances :

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUX DE DONNÉES                           │
└─────────────────────────────────────────────────────────────┘

1. OUVERTURE DE L'APPLICATION
   ├─ Charger tickers depuis Supabase (tickers) ✅
   ├─ Créer profils squelettes (affichage instantané) ✅
   └─ Charger données depuis Supabase (snapshots) ✅
       ├─ Si snapshot existe → Utiliser snapshot + prix cache
       └─ Si snapshot manquant → Fallback FMP (optionnel)

2. SYNCHRONISATION (Manuelle)
   ├─ Sauvegarder snapshot "Avant" dans Supabase ✅
   ├─ Charger nouvelles données depuis FMP ✅
   ├─ Merge intelligent (préserver données manuelles) ✅
   └─ Sauvegarder snapshot "Après" dans Supabase ✅

3. MISE À JOUR PRIX (Automatique)
   └─ Charger uniquement le prix depuis ticker_price_cache ✅
```

---

## 🎯 Détails du Flux

### 1. **À l'Ouverture** (Chargement Initial)

**Objectif** : Afficher rapidement tous les tickers avec leurs données

**Étapes** :
1. ✅ Charger liste des tickers depuis `tickers` (Supabase)
2. ✅ Créer profils "squelettes" immédiatement (nom, secteur, métriques ValueLine)
3. ✅ Charger snapshots depuis `finance_pro_snapshots` (Supabase) en batch
4. ✅ Charger prix depuis `ticker_price_cache` (Supabase) en batch
5. ⚠️ **Fallback FMP** : Seulement si snapshot manquant

**Résultat** :
- ✅ Affichage instantané de tous les tickers
- ✅ Données complètes chargées depuis Supabase (rapide)
- ✅ Prix à jour depuis le cache
- ⚠️ FMP appelé seulement si snapshot manquant

---

### 2. **Synchronisation** (Action Utilisateur)

**Objectif** : Mettre à jour les données avec les dernières informations FMP

**Étapes** :
1. ✅ Sauvegarder snapshot "Avant" dans Supabase (backup)
2. ✅ Charger nouvelles données depuis FMP
3. ✅ Merge intelligent :
   - Préserver données manuelles (autoFetched: false)
   - Remplacer données auto-fetchées (autoFetched: true)
   - Ajouter nouvelles années
4. ✅ Recalculer assumptions (cases orange)
5. ✅ Sauvegarder snapshot "Après" dans Supabase (is_current: true)

**Résultat** :
- ✅ Version précédente sauvegardée (historique)
- ✅ Nouvelles données FMP intégrées
- ✅ Données manuelles préservées
- ✅ Nouveau snapshot créé dans Supabase

---

### 3. **Mise à Jour Prix** (Automatique)

**Objectif** : Avoir les prix à jour sans recharger toutes les données

**Étapes** :
1. ✅ Charger prix depuis `ticker_price_cache` (Supabase)
2. ✅ Mettre à jour `assumptions.currentPrice` dans le profil

**Résultat** :
- ✅ Prix à jour (mise à jour toutes les 5 minutes via cron)
- ✅ Pas besoin de recharger toutes les données FMP

---

## 🔍 Logique de Décision

### Quand charger depuis FMP ?

**✅ OUI - Charger depuis FMP si** :
- Snapshot Supabase manquant (première fois)
- Utilisateur clique "Synchroniser" (action explicite)
- Utilisateur clique "Synchroniser tous les tickers"
- Utilisateur clique "Synchroniser N/A"

**❌ NON - Ne PAS charger depuis FMP si** :
- Snapshot Supabase existe et est récent
- On charge juste pour afficher la liste
- On met à jour uniquement le prix

---

## 📋 Tableau Récapitulatif

| Action | Source Données | Destination | Quand |
|--------|---------------|-------------|-------|
| **Ouverture** | Supabase (snapshots) | LocalStorage | Automatique |
| **Ouverture (fallback)** | FMP | Supabase + LocalStorage | Si snapshot manquant |
| **Synchronisation** | FMP | Supabase + LocalStorage | Action utilisateur |
| **Mise à jour prix** | Supabase (cache) | LocalStorage | Automatique (5 min) |

---

## 🎯 Optimisations Appliquées

### ✅ Avant (Problématique)
```
Ouverture → FMP (800 appels) → Supabase → LocalStorage
❌ Lent (1-2 minutes)
❌ Beaucoup d'appels API
❌ Ignore les données déjà dans Supabase
```

### ✅ Après (Optimisé)
```
Ouverture → Supabase (snapshots) → LocalStorage
✅ Rapide (2-5 secondes)
✅ Moins d'appels API
✅ Utilise les données existantes
✅ FMP seulement si nécessaire
```

---

## 🔄 Cycle de Vie des Données

```
1. PREMIÈRE FOIS
   FMP → Supabase (snapshot) → LocalStorage → Affichage

2. OUVERTURES SUIVANTES
   Supabase (snapshot) → LocalStorage → Affichage
   (Pas de FMP nécessaire)

3. SYNCHRONISATION
   Supabase (backup) → FMP → Merge → Supabase (nouveau snapshot) → LocalStorage

4. MISE À JOUR PRIX
   Supabase (cache prix) → LocalStorage (currentPrice)
```

---

## 💡 Avantages

1. **Performance** : Chargement 10-20x plus rapide
2. **Coûts** : Moins d'appels FMP (réduction API costs)
3. **Egress** : Moins de données transférées depuis Supabase
4. **UX** : Affichage instantané, mise à jour progressive
5. **Fiabilité** : Données préservées même si FMP échoue

---

## ⚠️ Points d'Attention

1. **Snapshots obsolètes** : Si snapshot > 30 jours, considérer comme stale
2. **Prix à jour** : Le cache prix est mis à jour toutes les 5 minutes
3. **Données manuelles** : Toujours préservées lors du merge
4. **Fallback FMP** : Seulement si snapshot manquant (pas de rechargement systématique)


