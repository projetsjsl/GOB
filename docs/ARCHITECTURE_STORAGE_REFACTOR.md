# Refactorisation Architecture Storage - 3P1

## 🎯 Problème Actuel

### Architecture actuelle (problématique)
```
┌─────────────────┐
│   Supabase      │ ← Source de vérité pour:
│                 │   - Liste des tickers (source, isWatchlist)
│                 │   - Métriques ValueLine
│                 │   - Snapshots (historique)
└─────────────────┘
         ↓
┌─────────────────┐
│  localStorage   │ ← Cache local (problème !)
│  / IndexedDB    │   - Profils complets (données FMP)
│                 │   - Assumptions
│                 │   - Notes utilisateur
│                 │   - isWatchlist (peut être obsolète)
└─────────────────┘
```

**Problèmes :**
1. ❌ **Incohérence multi-utilisateurs** : Chaque utilisateur a ses propres données dans localStorage
2. ❌ **Données obsolètes** : localStorage peut contenir des données anciennes
3. ❌ **Migration complexe** : Nécessite de forcer la mise à jour depuis Supabase
4. ❌ **16 étoiles au lieu de 25** : Certains tickers ne sont pas chargés dans localStorage

## ✅ Solution Proposée

### Architecture refactorisée
```
┌─────────────────┐
│   Supabase      │ ← Source de vérité UNIQUE pour TOUT:
│                 │   - Liste des tickers (source, isWatchlist)
│                 │   - Métriques ValueLine
│                 │   - Profils complets (snapshots)
│                 │   - Assumptions (dans snapshots)
│                 │   - Notes utilisateur (dans snapshots)
└─────────────────┘
         ↓
┌─────────────────┐
│  localStorage   │ ← Cache TEMPORAIRE uniquement:
│  / IndexedDB    │   - Amélioration performance (offline)
│                 │   - Réduction latence réseau
│                 │   - Invalidation automatique si obsolète
└─────────────────┘
```

## 🔄 Nouveau Flux de Données

### 1. Chargement Initial
```
1. Vérifier cache localStorage (avec timestamp)
2. Si cache < 5 min → Utiliser cache
3. Sinon → Charger depuis Supabase
4. Mettre à jour cache avec timestamp
```

### 2. Synchronisation Temps Réel
```
1. useRealtimeSync écoute Supabase
2. INSERT/DELETE/UPDATE → Invalider cache
3. Recharger depuis Supabase
4. Mettre à jour cache
```

### 3. Sauvegarde
```
1. Sauvegarder dans Supabase (snapshot)
2. Mettre à jour cache localStorage
3. Invalider cache si autre utilisateur modifie
```

## 📋 Plan de Migration

### Phase 1 : Utiliser Supabase comme source de vérité pour isWatchlist
- ✅ Déjà fait : `mapSourceToIsWatchlist` utilise Supabase
- ✅ Déjà fait : Migration force mise à jour depuis Supabase
- ⚠️ À améliorer : Invalider cache si données obsolètes

### Phase 2 : Sauvegarder profils complets dans Supabase
- Créer table `profiles` dans Supabase
- Sauvegarder assumptions, notes, données historiques
- Utiliser localStorage comme cache uniquement

### Phase 3 : Invalidation automatique du cache
- Ajouter timestamp à chaque entrée cache
- Vérifier timestamp au chargement
- Recharger depuis Supabase si cache > 5 min

## 🎯 Bénéfices

1. ✅ **Cohérence multi-utilisateurs** : Tous voient les mêmes données
2. ✅ **Temps réel garanti** : Supabase est la source de vérité
3. ✅ **Performance** : Cache localStorage pour offline/rapidité
4. ✅ **Simplicité** : Plus besoin de migration complexe
5. ✅ **Fiabilité** : Données toujours à jour

## ⚠️ Considérations

### Performance
- Cache localStorage réduit les appels réseau
- Invalidation intelligente (seulement si nécessaire)
- Chargement progressif (squelettes d'abord, données complètes après)

### Coût Supabase
- Plus d'écritures dans Supabase (snapshots)
- Optimiser avec batch writes
- Utiliser cache pour réduire lectures

### Migration
- Migration progressive possible
- Garder localStorage comme fallback temporaire
- Migrer profils existants vers Supabase

