# Architecture et Documentation - 3P1 Application

##  Vue d'ensemble

Application d'analyse fondamentale pour la gestion de portefeuille avec synchronisation temps reel via Supabase.

##  Structure des fichiers principaux

### `App.tsx` - Composant principal
**Responsabilites :**
- Gestion de l'etat global (library, activeId, etc.)
- Synchronisation avec Supabase (temps reel + periodique)
- Chargement et sauvegarde des profils
- Gestion des snapshots et historique
- Orchestration des composants enfants

**Sections critiques :**
1. **Synchronisation Supabase** (`handleSyncFromSupabase`)
   - Charge les tickers depuis Supabase
   - Filtre par capitalisation minimale (2B USD)
   - Cree des profils "squelettes" pour affichage immediat
   - Charge les donnees FMP en arriere-plan
   - Gere les erreurs par batch avec resume

2. **Synchronisation en masse** (`handleBulkSyncAllTickers`)
   - Traite tous les tickers par batch (5 par batch)
   - Gere pause/stop via `abortSync` ref
   - Affiche une barre de progression
   - Collecte les erreurs pour resume final

3. **Synchronisation temps reel** (`useRealtimeSync`)
   - Ecoute les changements Supabase (INSERT/UPDATE/DELETE)
   - Force rechargement complet sur INSERT/DELETE
   - Met a jour les metriques ValueLine sur UPDATE
   - Synchronisation periodique toutes les 2 minutes (fallback)

4. **Mapping source -> isWatchlist**
   - `source='team'` -> `isWatchlist=false` ->  Portefeuille
   - `source='watchlist'` ou `'both'` -> `isWatchlist=true` ->  Watchlist
   - `source='manual'` ou `null/undefined` -> `isWatchlist=null` -> Pas d'icone (tickers normaux)

### `components/Sidebar.tsx` - Barre laterale
**Responsabilites :**
- Affichage de la liste des tickers
- Filtrage et tri
- Gestion des actions (ajout, suppression, duplication)
- Toggle watchlist/portefeuille

**Fonctionnalites cles :**
- **Filtres avances** : Pays, Bourse, Capitalisation
- **Tri** : Alphabetique, Date, Recommandation, Secteur
- **Cache de recommandations** : Optimise les recalculs couteux
- **Collapse/Expand** : Section filtres collapsible
- **Double-clic logo** : Toggle mode admin (fonction cachee)

### `services/tickersApi.ts` - API Tickers
**Responsabilites :**
- Chargement des tickers depuis Supabase
- Fallback sur plusieurs APIs si admin echoue
- Normalisation du champ `source`
- Mapping `source` -> `isWatchlist`

**Strategie de fallback :**
1. `/api/admin/tickers` (priorite)
2. `/api/team-tickers` (fallback 1)
3. `/api/tickers-config` (fallback 2)

### `services/financeApi.ts` - API Finance
**Responsabilites :**
- Proxy vers FMP API
- Gestion des erreurs 404
- Parsing et normalisation des donnees

##  Flux de donnees

### Chargement initial
```
1. App.tsx charge depuis localStorage
2. Si vide -> loadTickersFromSupabase()
3. Creation de profils "squelettes" (affichage immediat)
4. Chargement FMP en arriere-plan (batch)
5. Mise a jour des profils avec donnees completes
```

### Synchronisation temps reel
```
1. useRealtimeSync ecoute Supabase
2. INSERT/DELETE -> Force rechargement complet
3. UPDATE -> Met a jour metriques ValueLine
4. Synchronisation periodique (2 min) comme fallback
```

### Mapping source -> isWatchlist
```
Supabase (source) -> mapSourceToIsWatchlist() -> isWatchlist
- 'team' -> false ->  Portefeuille
- 'watchlist'/'both' -> true ->  Watchlist
- 'manual'/null -> null -> Pas d'icone
```

##  Points d'attention

### 1. Ordre de declaration
**Probleme :** Variables utilisees dans `useState` initializers avant definition
**Solution :** Toujours definir les constantes AVANT `useState`

### 2. References globales
**Probleme :** Composants non exposes globalement pour Babel inline
**Solution :** `window.ComponentName = ComponentName`

### 3. Z-index hierarchy
- Modals : 10000+
- Dropdowns : 9999
- Content : 1-100
- Background : 0

### 4. Environment variables
**Probleme :** `import.meta.env` non disponible en Babel inline
**Solution :** Fallback multi-methode (window.importMetaEnv -> meta tag -> API)

### 5. Gestion des erreurs batch
**Probleme :** Trop de logs individuels polluent la console
**Solution :** Collecte des erreurs par type + resume groupe

##  Fonctions cachees

### Toggle Admin (Double-clic logo)
- **Localisation :** `components/Sidebar.tsx` ligne 70-90
- **Action :** Double-clic sur ChartBarIcon
- **Effet :** Toggle `isAdmin` + localStorage `3p1-admin`
- **Indicateur :** Logo jaune + ShieldCheck icon

##  Performance

### Optimisations
1. **Lazy loading** : KPIDashboard, AdminDashboard
2. **Cache recommandations** : Map avec limite 1000 entrees
3. **Batch processing** : 5 tickers par batch (FMP sync)
4. **Skeleton profiles** : Affichage immediat sans attendre FMP
5. **useMemo** : Filtrage et tri optimises

### Limitations
- Batch size FMP : 5 tickers (eviter timeouts)
- Cache recommandations : Max 1000 entrees
- Synchronisation periodique : 2 minutes

##  Securite

### Mode Admin
- Activation : Double-clic logo OU URL `?admin=true` OU localStorage
- Persistance : localStorage `3p1-admin`
- Verification : sessionStorage `gob-user` (role admin)

##  Notes importantes

### isWatchlist
- Type : `boolean | null | undefined`
- `false` = Portefeuille ()
- `true` = Watchlist ()
- `null/undefined` = Normal (pas d'icone)

### source (Supabase)
- `'team'` = Team tickers (25 environ)
- `'watchlist'` = Watchlist
- `'both'` = Team + Watchlist
- `'manual'` = Tickers normaux

### Capitalisation minimale
- Filtre : 2 milliards USD minimum
- Applique lors de `handleSyncFromSupabase`
- Verifie aussi depuis FMP data

##  Debugging

### Console logs importants
- ` 3p1 App v2.1.0` : Version de l'app
- ` [tickers] Subscription status` : Statut realtime
- ` X tickers charges` : Chargement reussi
- ` Resume synchronisation` : Resume erreurs batch

### Verifications courantes
1. `localStorage.getItem('3p1-admin')` : Mode admin actif ?
2. `sessionStorage.getItem('gob-user')` : Utilisateur connecte ?
3. `supabaseTickersCacheRef.current` : Cache valide ?
4. `hasLoadedTickersRef.current` : Tickers charges ?

##  References

- `docs/REPERTOIRE_COMPLET_ERREURS.md` : Erreurs documentees (32+)
- `docs/INDEX.md` : Index documentation
- `docs/api/DOCUMENTATION_APIs.md` : Documentation APIs
- `CLAUDE.md` : Guide principal projet












