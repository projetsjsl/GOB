# Analyse Complète du Flux de Données - Finance Pro 3p1

## 📊 Vue d'Ensemble

L'application Finance Pro 3p1 gère deux types de stockage :
1. **LocalStorage** (navigateur) : Profils actifs en cours de travail
2. **Supabase** (base de données) : 
   - Table `tickers` : Liste des tickers avec métriques ValueLine
   - Table `finance_pro_snapshots` : Versions historiques sauvegardées

---

## 🔄 SOURCES DE DONNÉES

### 1. **FMP (Financial Modeling Prep)** - Source Principale
- **Endpoint** : `/api/fmp-company-data?symbol=XXX`
- **Données récupérées** :
  - `annual_data` : Données historiques annuelles (EPS, CF, BV, DIV, prix High/Low)
  - `currentPrice` : Prix actuel de l'action
  - `info` : Informations entreprise (nom, secteur, logo, beta, etc.)
- **Quand** : 
  - ✅ À l'ouverture (pour nouveaux tickers depuis Supabase)
  - ✅ Bouton "Synchroniser" (manuel)
  - ✅ Bouton "Synchroniser tous les tickers" (bulk)
  - ✅ Ajout manuel d'un nouveau ticker

### 2. **Supabase - Table `tickers`**
- **Endpoint** : `/api/admin/tickers?is_active=true&limit=1000`
- **Données récupérées** :
  - Liste des tickers actifs
  - Métriques ValueLine : `security_rank`, `earnings_predictability`, `price_growth_persistence`, `price_stability`
  - `beta` (peut venir de Supabase ou FMP)
  - `source` : 'team' | 'watchlist' | 'both' | 'manual' (pour déterminer isWatchlist)
- **Quand** :
  - ✅ **AUTOMATIQUE** à l'ouverture de l'application (après chargement LocalStorage)
  - ✅ Bouton "Synchroniser depuis Supabase" (manuel)

### 3. **Supabase - Table `finance_pro_snapshots`**
- **Endpoint** : `/api/finance-snapshots`
- **Données stockées** :
  - `annual_data` : Données historiques complètes
  - `assumptions` : Toutes les hypothèses (croissance, ratios cibles, etc.)
  - `company_info` : Informations entreprise
  - `notes` : Notes utilisateur
  - `is_current` : Version actuelle (true) ou historique (false)
  - `auto_fetched` : Indique si la version vient d'une sync API (true) ou manuelle (false)
  - `version` : Numéro de version auto-incrémenté
- **Quand** :
  - ✅ Après chaque synchronisation FMP réussie (auto-save)
  - ✅ Sauvegarde manuelle (bouton "Sauvegarder")
  - ✅ Avant synchronisation globale (backup)
  - ✅ Après synchronisation globale (nouvelle version actuelle)

---

## 🚀 COMPORTEMENT À L'OUVERTURE

### Séquence d'Initialisation

1. **Chargement LocalStorage** (ligne 111-135)
   - Charge tous les profils sauvegardés localement
   - Si vide, crée un profil par défaut (ACN)
   - Active le premier profil trouvé

2. **Chargement Supabase Tickers** (ligne 141-348) - **AUTOMATIQUE**
   - Appelle `loadAllTickersFromSupabase()`
   - Pour chaque nouveau ticker (pas dans LocalStorage) :
     - ✅ **Tente de charger FMP immédiatement** (batch de 5, délai 500ms)
     - ✅ **Crée le profil UNIQUEMENT si FMP réussit** (validation stricte)
     - ✅ **Préserve les métriques ValueLine** de Supabase
   - Met à jour `isWatchlist` pour les profils existants

3. **Chargement Profil Actif** (ligne 358-374)
   - Charge les données du profil actif dans l'état local
   - `data`, `assumptions`, `info`, `notes`, `isWatchlist`

4. **Auto-Save LocalStorage** (ligne 377-404)
   - Sauvegarde automatique après 500ms de délai
   - Se déclenche à chaque modification de `data`, `assumptions`, `info`, `notes`, `isWatchlist`

---

## 🔘 BOUTONS DE SYNCHRONISATION

### 1. **"Synchroniser" (Header)** - `handleFetchData` → `performSync`

**Comportement** :
- Vérifie s'il y a des modifications manuelles (`hasManualEdits`)
- Si oui : Affiche un dialogue de confirmation
  - Option 1 : Sauvegarder la version actuelle AVANT sync
  - Option 2 : Synchroniser directement (écrase les modifications)
- Si non : Synchronise directement

**Actions** :
1. (Optionnel) Sauvegarde snapshot "Before API sync" si demandé
2. Appelle `fetchCompanyData(activeId)` → FMP
3. Met à jour `data` avec nouvelles données FMP
4. Met à jour `info` (logo, beta) **MAIS préserve métriques ValueLine**
5. Met à jour `assumptions.currentPrice` uniquement
6. **Auto-save snapshot** "API sync" avec `is_current=true`, `auto_fetched=true`
7. Notification de succès

**⚠️ IMPORTANT** : Les hypothèses (growthRateEPS, targetPE, etc.) **NE SONT PAS modifiées** sauf `currentPrice`

---

### 2. **"Synchroniser depuis Supabase" (Sidebar)** - `handleSyncFromSupabase`

**Comportement** :
- Charge la liste des tickers depuis Supabase
- Pour chaque nouveau ticker (pas dans library) :
  - ✅ Tente de charger FMP
  - ✅ Crée le profil UNIQUEMENT si FMP réussit
- Met à jour `isWatchlist` pour les profils existants

**Actions** :
1. Appelle `loadAllTickersFromSupabase()`
2. Identifie les nouveaux tickers
3. Charge FMP pour chaque nouveau (batch de 5, délai 500ms)
4. Crée les profils avec validation stricte
5. Met à jour LocalStorage
6. Notification avec nombre de nouveaux tickers

**⚠️ IMPORTANT** : Ne modifie PAS les profils existants, seulement ajoute les nouveaux

---

### 3. **"Synchroniser tous les tickers" (Sidebar)** - `handleBulkSyncAllTickers`

**Comportement** :
- Synchronise TOUS les tickers de la library
- Préserve les données manuelles (orange)
- Préserve les hypothèses (orange)

**Actions** (pour chaque ticker) :
1. **Sauvegarde snapshot "Avant synchronisation globale"** avec `is_current=false`, `auto_fetched=false`
2. Appelle `fetchCompanyData(tickerSymbol)` → FMP
3. **Merge intelligent** :
   - Si donnée existante est manuelle (`autoFetched=false`) → **GARDE l'existante**
   - Si donnée existante est auto-fetchée → **REMPLACE par nouvelle**
   - Ajoute les nouvelles années qui n'existent pas
4. Met à jour `assumptions.currentPrice` uniquement
5. Met à jour `info` (nom, secteur, logo) **MAIS préserve métriques ValueLine**
6. **Sauvegarde snapshot "Synchronisation globale"** avec `is_current=true`, `auto_fetched=true`
7. Met à jour LocalStorage

**⚠️ IMPORTANT** : 
- Les hypothèses (growthRateEPS, targetPE, etc.) **NE SONT PAS modifiées** sauf `currentPrice`
- Les données manuelles (orange) sont **TOUJOURS préservées**

---

## 💾 STOCKAGE DANS SUPABASE

### Table `tickers`
**Stocke** :
- Liste des tickers actifs
- Métriques ValueLine (importées depuis Excel)
- `source` : 'team' | 'watchlist' | 'both' | 'manual'
- `beta` (peut venir de FMP ou être manuel)

**⚠️ NE stocke PAS** :
- Les données historiques annuelles
- Les hypothèses (growthRateEPS, targetPE, etc.)
- Les notes utilisateur
- Les versions/snapshots

**Utilisation** :
- Source de vérité pour la liste des tickers
- Source des métriques ValueLine (ne viennent PAS de FMP)
- Détermine `isWatchlist` via `mapSourceToIsWatchlist()`

---

### Table `finance_pro_snapshots`
**Stocke** :
- `annual_data` : Données historiques complètes (JSONB)
- `assumptions` : Toutes les hypothèses (JSONB)
- `company_info` : Informations entreprise (JSONB)
- `notes` : Notes utilisateur
- `is_current` : true = version actuelle, false = historique
- `auto_fetched` : true = sync API, false = manuelle
- `version` : Numéro auto-incrémenté
- `snapshot_date` : Date de création
- `ticker` : Symbole du ticker

**Utilisation** :
- Historique des versions pour chaque ticker
- Permet de charger une version antérieure
- Permet de comparer différentes versions
- Backup avant modifications importantes

---

## 📝 CRÉATION DE NOUVEAUX TICKERS

### Scénario 1 : Ajout Manuel (Bouton "+" dans Sidebar)

**Flux** :
1. Utilisateur clique sur "+"
2. Ouvre `TickerSearch` modal
3. Utilisateur sélectionne un ticker
4. Appelle `handleSelectTicker(symbol)`

**Actions** :
1. Vérifie si le profil existe déjà dans `library`
2. Si oui : Charge le profil existant
3. Si non :
   - ✅ Appelle `fetchCompanyData(symbol)` → FMP
   - ✅ **Validation stricte** : données non vides, prix > 0, données financières valides
   - ✅ Si validation échoue : **Aucun profil créé**, notification d'erreur
   - ✅ Si validation réussit :
     - Calcule auto-fill assumptions (CAGR, ratios moyens)
     - Crée le profil avec données FMP
     - Sauvegarde dans LocalStorage
     - Active le profil

**⚠️ IMPORTANT** : Aucun snapshot n'est créé automatiquement lors de l'ajout manuel

---

### Scénario 2 : Chargement depuis Supabase (Automatique ou Manuel)

**Flux** :
1. Appelle `loadAllTickersFromSupabase()`
2. Identifie les nouveaux tickers (pas dans `library`)
3. Pour chaque nouveau ticker :
   - ✅ Appelle `fetchCompanyData(symbol)` → FMP
   - ✅ **Validation stricte**
   - ✅ Si validation réussit : Crée le profil avec données FMP + métriques ValueLine de Supabase

**⚠️ IMPORTANT** : Aucun snapshot n'est créé automatiquement lors du chargement depuis Supabase

---

## 📜 SYSTÈME DE SNAPSHOTS / VERSIONS

### Quand un Snapshot est Créé

#### 1. **Auto-Save après Synchronisation FMP** (ligne 587-595)
- **Quand** : Après `performSync()` réussie
- **Notes** : `"API sync - ${date}"`
- **is_current** : `true`
- **auto_fetched** : `true`

#### 2. **Sauvegarde Manuelle** (ligne 715-745)
- **Quand** : Utilisateur clique sur "Sauvegarder" (ou Ctrl+S)
- **Notes** : Prompt utilisateur (optionnel)
- **is_current** : `true`
- **auto_fetched** : `false`

#### 3. **Avant Synchronisation Globale** (ligne 1005-1013)
- **Quand** : Avant chaque sync dans `handleBulkSyncAllTickers`
- **Notes** : `"Avant synchronisation globale - ${date}"`
- **is_current** : `false` (on va le remplacer)
- **auto_fetched** : `false`

#### 4. **Après Synchronisation Globale** (ligne 1091-1105)
- **Quand** : Après chaque sync réussie dans `handleBulkSyncAllTickers`
- **Notes** : `"Synchronisation globale - ${date}"`
- **is_current** : `true`
- **auto_fetched** : `true`

#### 5. **Avant Synchronisation avec Sauvegarde** (ligne 473-481)
- **Quand** : Si utilisateur choisit "Sauvegarder avant sync" dans le dialogue
- **Notes** : `"Before API sync - ${date}"`
- **is_current** : `false` (on va le remplacer)
- **auto_fetched** : `false`

#### 6. **Sauvegarde depuis Version Historique** (ligne 756-777)
- **Quand** : Utilisateur déverrouille une version historique et sauvegarde
- **Notes** : Prompt utilisateur ou `"Copie de v${version} - ${date}"`
- **is_current** : `true`
- **auto_fetched** : `false`

---

### Chargement d'un Snapshot Historique

**Flux** (`handleLoadSnapshot`) :
1. Appelle `loadSnapshot(snapshotId)` → Supabase
2. Charge les données du snapshot
3. Active le mode "read-only" si `is_current=false`
4. Affiche le banner "Version Historique"
5. Met à jour `data`, `assumptions`, `info` avec les données du snapshot

**⚠️ IMPORTANT** : 
- Les modifications en mode read-only ne sont PAS sauvegardées automatiquement
- L'utilisateur doit déverrouiller puis sauvegarder manuellement pour créer une nouvelle version

---

## 🔍 AFFICHAGE DES DONNÉES

### LocalStorage (Profils Actifs)
- **Affichage** : Sidebar gauche (liste des tickers)
- **Source** : `library` state (synchronisé avec LocalStorage)
- **Mise à jour** : Automatique après 500ms de délai

### Supabase Snapshots (Versions Historiques)
- **Affichage** : Sidebar droite (RightSidebar)
- **Source** : `listSnapshots(ticker)` → Supabase
- **Mise à jour** : Seulement lors du clic sur un ticker (pas automatique)

### Données FMP
- **Affichage** : Tableau historique, graphiques, métriques
- **Source** : `data` state (vient du profil actif ou snapshot)
- **Mise à jour** : Seulement lors de synchronisation manuelle

---

## ⚠️ PROBLÈMES IDENTIFIÉS ET INCOHÉRENCES

### 1. **Auto-Save Snapshot après Sync**
**Problème** : Un snapshot est créé automatiquement après chaque `performSync()`, même si l'utilisateur n'a pas demandé de sauvegarde.

**Impact** : 
- Crée beaucoup de snapshots "API sync" dans Supabase
- Peut encombrer la base de données
- L'utilisateur n'a pas le contrôle

**Recommandation** :
- ✅ Option 1 : Supprimer l'auto-save après sync (seulement sauvegarder si utilisateur demande)
- ✅ Option 2 : Ajouter un paramètre utilisateur "Auto-save après sync" (désactivé par défaut)
- ✅ Option 3 : Limiter à 1 snapshot auto-save par jour par ticker

---

### 2. **Métriques ValueLine Préservées mais Pas Synchronisées**
**Problème** : Les métriques ValueLine viennent de Supabase et sont préservées lors des syncs FMP, mais elles ne sont jamais mises à jour depuis Supabase après l'import initial.

**Impact** :
- Si les métriques ValueLine changent dans Supabase, elles ne sont pas reflétées dans les profils existants
- L'utilisateur doit recharger depuis Supabase pour voir les changements

**Recommandation** :
- ✅ Option 1 : Mettre à jour les métriques ValueLine lors de `handleSyncFromSupabase` pour les profils existants
- ✅ Option 2 : Ajouter un bouton "Mettre à jour métriques ValueLine" séparé
- ✅ Option 3 : Vérifier périodiquement (ex: une fois par jour) si les métriques ont changé

---

### 3. **Pas de Synchronisation Automatique du Prix Actuel**
**Problème** : Le `currentPrice` n'est mis à jour que lors d'une synchronisation manuelle. Si l'utilisateur ne synchronise pas, le prix peut devenir obsolète.

**Impact** :
- Les calculs de rendement peuvent être basés sur un prix obsolète
- L'utilisateur doit se souvenir de synchroniser régulièrement

**Recommandation** :
- ✅ Option 1 : Ajouter une option "Auto-sync prix actuel toutes les X heures" (désactivé par défaut)
- ✅ Option 2 : Afficher un indicateur "Prix obsolète" si le prix n'a pas été mis à jour depuis > 24h
- ✅ Option 3 : Proposer une sync automatique du prix uniquement (sans toucher aux données historiques)

---

### 4. **Snapshots Créés Avant Sync Globale**
**Problème** : Un snapshot "Avant synchronisation globale" est créé pour CHAQUE ticker, même si la sync échoue.

**Impact** :
- Crée beaucoup de snapshots inutiles si la sync échoue
- Encombre la base de données

**Recommandation** :
- ✅ Option 1 : Ne créer le snapshot "avant" que si la sync réussit
- ✅ Option 2 : Supprimer le snapshot "avant" si la sync échoue
- ✅ Option 3 : Créer un seul snapshot "backup global" au lieu d'un par ticker

---

### 5. **Pas de Gestion des Conflits**
**Problème** : Si deux utilisateurs modifient le même ticker en même temps, il n'y a pas de gestion de conflit.

**Impact** :
- Les modifications peuvent être écrasées sans avertissement
- Pas de système de verrouillage

**Recommandation** :
- ✅ Option 1 : Ajouter un système de verrouillage (lock) pour les tickers en cours de modification
- ✅ Option 2 : Détecter les conflits et proposer un merge
- ✅ Option 3 : Ajouter un timestamp "dernière modification" et avertir si modifié depuis le chargement

---

### 6. **LocalStorage Peut Devenir Très Lourd**
**Problème** : Tous les profils sont stockés dans LocalStorage, qui a une limite de ~5-10MB.

**Impact** :
- Si l'utilisateur a beaucoup de tickers avec beaucoup de données historiques, LocalStorage peut être saturé
- Pas de système de pagination ou de nettoyage

**Recommandation** :
- ✅ Option 1 : Limiter le nombre de profils dans LocalStorage (ex: 50 max)
- ✅ Option 2 : Stocker seulement les profils récemment utilisés dans LocalStorage
- ✅ Option 3 : Ajouter un système de compression des données

---

### 7. **Pas de Synchronisation Bidirectionnelle**
**Problème** : Les modifications dans l'application ne sont pas synchronisées avec Supabase `tickers` (ex: changement de `isWatchlist`).

**Impact** :
- Si l'utilisateur change `isWatchlist` dans l'app, ce changement n'est pas reflété dans Supabase
- La prochaine fois qu'il charge depuis Supabase, le changement est perdu

**Recommandation** :
- ✅ Option 1 : Synchroniser `isWatchlist` avec Supabase lors du changement
- ✅ Option 2 : Ajouter un endpoint pour mettre à jour `tickers` depuis l'app
- ✅ Option 3 : Afficher un avertissement si `isWatchlist` diffère entre app et Supabase

---

## ✅ AMÉLIORATIONS PROPOSÉES

### Priorité 1 : Critiques

1. **Limiter les Auto-Saves**
   - Supprimer l'auto-save après `performSync()` (seulement si utilisateur demande)
   - Ajouter un paramètre utilisateur "Auto-save après sync" (désactivé par défaut)

2. **Mettre à Jour les Métriques ValueLine**
   - Lors de `handleSyncFromSupabase`, mettre à jour les métriques ValueLine pour les profils existants
   - Afficher un indicateur si les métriques ont changé

3. **Gestion des Erreurs FMP**
   - Si FMP échoue, proposer de réessayer avec un format différent (ex: BRK-B au lieu de BRK.B)
   - Afficher une liste des formats essayés dans le message d'erreur

---

### Priorité 2 : Importantes

4. **Synchronisation Intelligente du Prix**
   - Ajouter une option "Auto-sync prix actuel toutes les X heures" (désactivé par défaut)
   - Afficher un indicateur "Prix obsolète" si > 24h

5. **Optimisation des Snapshots**
   - Ne créer le snapshot "avant sync globale" que si la sync réussit
   - Limiter le nombre de snapshots auto-save par jour (ex: 1 max)

6. **Gestion de LocalStorage**
   - Limiter le nombre de profils dans LocalStorage (ex: 50 max)
   - Stocker seulement les profils récemment utilisés

---

### Priorité 3 : Améliorations UX

7. **Synchronisation Bidirectionnelle**
   - Synchroniser `isWatchlist` avec Supabase lors du changement
   - Afficher un avertissement si divergence détectée

8. **Gestion des Conflits**
   - Ajouter un timestamp "dernière modification" dans les snapshots
   - Afficher un avertissement si le snapshot a été modifié depuis le chargement

9. **Indicateurs Visuels**
   - Afficher un badge "Données à jour" / "Données obsolètes" sur chaque ticker
   - Afficher la date de dernière synchronisation dans la sidebar

10. **Performance**
    - Lazy loading des snapshots (charger seulement quand sidebar droite est ouverte)
    - Pagination pour les snapshots (limiter à 20 par page)

---

## 📋 RÉSUMÉ DES FLUX

### Flux 1 : Ouverture de l'Application
```
1. Charger LocalStorage → library
2. Charger Supabase tickers → nouveaux tickers
3. Pour chaque nouveau ticker :
   - Charger FMP → validation → créer profil
4. Activer premier profil
5. Auto-save LocalStorage (délai 500ms)
```

### Flux 2 : Synchronisation Manuelle (Bouton "Synchroniser")
```
1. Vérifier modifications manuelles
2. (Optionnel) Sauvegarder snapshot "Before API sync"
3. Charger FMP → nouvelles données
4. Mettre à jour data, info, assumptions.currentPrice
5. Préserver métriques ValueLine
6. Auto-save snapshot "API sync"
7. Notification succès
```

### Flux 3 : Synchronisation Globale
```
Pour chaque ticker :
1. Sauvegarder snapshot "Avant sync globale"
2. Charger FMP → nouvelles données
3. Merge intelligent (préserver données manuelles)
4. Mettre à jour data, info, assumptions.currentPrice
5. Sauvegarder snapshot "Sync globale"
6. Notification résultats
```

### Flux 4 : Ajout Nouveau Ticker
```
1. Utilisateur sélectionne ticker
2. Charger FMP → validation
3. Si validation réussit :
   - Créer profil avec données FMP
   - Auto-fill assumptions
   - Sauvegarder LocalStorage
   - Activer profil
4. Si validation échoue :
   - Afficher erreur
   - Aucun profil créé
```

### Flux 5 : Chargement Snapshot Historique
```
1. Charger snapshot depuis Supabase
2. Activer mode read-only si is_current=false
3. Afficher banner "Version Historique"
4. Charger data, assumptions, info du snapshot
5. (Optionnel) Utilisateur déverrouille → modifications possibles
6. (Optionnel) Sauvegarder → nouvelle version
```

---

## 🎯 CONCLUSION

Le système actuel est **globalement cohérent** mais présente quelques **opportunités d'amélioration** :

✅ **Points Forts** :
- Validation stricte (pas de placeholders)
- Préservation des données manuelles
- Préservation des métriques ValueLine
- Merge intelligent lors des syncs

⚠️ **Points à Améliorer** :
- Trop de snapshots auto-save
- Métriques ValueLine pas synchronisées
- Pas de sync automatique du prix
- LocalStorage peut devenir lourd

Les améliorations proposées permettraient d'optimiser l'utilisation de Supabase, améliorer l'UX, et réduire les risques de perte de données.

