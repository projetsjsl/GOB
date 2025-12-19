# Architecture et Documentation - 3P1 Application

## 📋 Vue d'ensemble

Application d'analyse fondamentale pour la gestion de portefeuille avec synchronisation temps réel via Supabase.

## 🏗️ Structure des fichiers principaux

### `App.tsx` - Composant principal
**Responsabilités :**
- Gestion de l'état global (library, activeId, etc.)
- Synchronisation avec Supabase (temps réel + périodique)
- Chargement et sauvegarde des profils
- Gestion des snapshots et historique
- Orchestration des composants enfants

**Sections critiques :**
1. **Synchronisation Supabase** (`handleSyncFromSupabase`)
   - Charge les tickers depuis Supabase
   - Filtre par capitalisation minimale (2B USD)
   - Crée des profils "squelettes" pour affichage immédiat
   - Charge les données FMP en arrière-plan
   - Gère les erreurs par batch avec résumé

2. **Synchronisation en masse** (`handleBulkSyncAllTickers`)
   - Traite tous les tickers par batch (5 par batch)
   - Gère pause/stop via `abortSync` ref
   - Affiche une barre de progression
   - Collecte les erreurs pour résumé final

3. **Synchronisation temps réel** (`useRealtimeSync`)
   - Écoute les changements Supabase (INSERT/UPDATE/DELETE)
   - Force rechargement complet sur INSERT/DELETE
   - Met à jour les métriques ValueLine sur UPDATE
   - Synchronisation périodique toutes les 2 minutes (fallback)

4. **Mapping source → isWatchlist**
   - `source='team'` → `isWatchlist=false` → ⭐ Portefeuille
   - `source='watchlist'` ou `'both'` → `isWatchlist=true` → 👁️ Watchlist
   - `source='manual'` ou `null/undefined` → `isWatchlist=null` → Pas d'icône (tickers normaux)

### `components/Sidebar.tsx` - Barre latérale
**Responsabilités :**
- Affichage de la liste des tickers
- Filtrage et tri
- Gestion des actions (ajout, suppression, duplication)
- Toggle watchlist/portefeuille

**Fonctionnalités clés :**
- **Filtres avancés** : Pays, Bourse, Capitalisation
- **Tri** : Alphabétique, Date, Recommandation, Secteur
- **Cache de recommandations** : Optimise les recalculs coûteux
- **Collapse/Expand** : Section filtres collapsible
- **Double-clic logo** : Toggle mode admin (fonction cachée)

### `services/tickersApi.ts` - API Tickers
**Responsabilités :**
- Chargement des tickers depuis Supabase
- Fallback sur plusieurs APIs si admin échoue
- Normalisation du champ `source`
- Mapping `source` → `isWatchlist`

**Stratégie de fallback :**
1. `/api/admin/tickers` (priorité)
2. `/api/team-tickers` (fallback 1)
3. `/api/tickers-config` (fallback 2)

### `services/financeApi.ts` - API Finance
**Responsabilités :**
- Proxy vers FMP API
- Gestion des erreurs 404
- Parsing et normalisation des données

## 🔄 Flux de données

### Chargement initial
```
1. App.tsx charge depuis localStorage
2. Si vide → loadTickersFromSupabase()
3. Création de profils "squelettes" (affichage immédiat)
4. Chargement FMP en arrière-plan (batch)
5. Mise à jour des profils avec données complètes
```

### Synchronisation temps réel
```
1. useRealtimeSync écoute Supabase
2. INSERT/DELETE → Force rechargement complet
3. UPDATE → Met à jour métriques ValueLine
4. Synchronisation périodique (2 min) comme fallback
```

### Mapping source → isWatchlist
```
Supabase (source) → mapSourceToIsWatchlist() → isWatchlist
- 'team' → false → ⭐ Portefeuille
- 'watchlist'/'both' → true → 👁️ Watchlist
- 'manual'/null → null → Pas d'icône
```

## ⚠️ Points d'attention

### 1. Ordre de déclaration
**Problème :** Variables utilisées dans `useState` initializers avant définition
**Solution :** Toujours définir les constantes AVANT `useState`

### 2. Références globales
**Problème :** Composants non exposés globalement pour Babel inline
**Solution :** `window.ComponentName = ComponentName`

### 3. Z-index hierarchy
- Modals : 10000+
- Dropdowns : 9999
- Content : 1-100
- Background : 0

### 4. Environment variables
**Problème :** `import.meta.env` non disponible en Babel inline
**Solution :** Fallback multi-méthode (window.importMetaEnv → meta tag → API)

### 5. Gestion des erreurs batch
**Problème :** Trop de logs individuels polluent la console
**Solution :** Collecte des erreurs par type + résumé groupé

## 🎯 Fonctions cachées

### Toggle Admin (Double-clic logo)
- **Localisation :** `components/Sidebar.tsx` ligne 70-90
- **Action :** Double-clic sur ChartBarIcon
- **Effet :** Toggle `isAdmin` + localStorage `3p1-admin`
- **Indicateur :** Logo jaune + ShieldCheck icon

## 📊 Performance

### Optimisations
1. **Lazy loading** : KPIDashboard, AdminDashboard
2. **Cache recommandations** : Map avec limite 1000 entrées
3. **Batch processing** : 5 tickers par batch (FMP sync)
4. **Skeleton profiles** : Affichage immédiat sans attendre FMP
5. **useMemo** : Filtrage et tri optimisés

### Limitations
- Batch size FMP : 5 tickers (éviter timeouts)
- Cache recommandations : Max 1000 entrées
- Synchronisation périodique : 2 minutes

## 🔐 Sécurité

### Mode Admin
- Activation : Double-clic logo OU URL `?admin=true` OU localStorage
- Persistance : localStorage `3p1-admin`
- Vérification : sessionStorage `gob-user` (role admin)

## 📝 Notes importantes

### isWatchlist
- Type : `boolean | null | undefined`
- `false` = Portefeuille (⭐)
- `true` = Watchlist (👁️)
- `null/undefined` = Normal (pas d'icône)

### source (Supabase)
- `'team'` = Team tickers (25 environ)
- `'watchlist'` = Watchlist
- `'both'` = Team + Watchlist
- `'manual'` = Tickers normaux

### Capitalisation minimale
- Filtre : 2 milliards USD minimum
- Appliqué lors de `handleSyncFromSupabase`
- Vérifié aussi depuis FMP data

## 🐛 Debugging

### Console logs importants
- `🚀 3p1 App v2.1.0` : Version de l'app
- `📡 [tickers] Subscription status` : Statut realtime
- `✅ X tickers chargés` : Chargement réussi
- `📊 Résumé synchronisation` : Résumé erreurs batch

### Vérifications courantes
1. `localStorage.getItem('3p1-admin')` : Mode admin actif ?
2. `sessionStorage.getItem('gob-user')` : Utilisateur connecté ?
3. `supabaseTickersCacheRef.current` : Cache valide ?
4. `hasLoadedTickersRef.current` : Tickers chargés ?

## 📚 Références

- `docs/REPERTOIRE_COMPLET_ERREURS.md` : Erreurs documentées (32+)
- `docs/INDEX.md` : Index documentation
- `docs/api/DOCUMENTATION_APIs.md` : Documentation APIs
- `CLAUDE.md` : Guide principal projet






