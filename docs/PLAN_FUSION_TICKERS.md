# 🎯 Plan de Fusion Complète des Tables de Tickers

## 📊 État Actuel

### Tables Existantes
1. **`tickers`** (832 lignes) - Table principale avec colonne `source`
   - Colonnes : id, ticker, company_name, sector, industry, country, exchange, currency, market_cap, is_active, source, priority, user_id, target_price, stop_loss, notes, added_date, last_scraped, scraping_enabled, created_at, updated_at, + métriques ValueLine
   
2. **`team_tickers`** (25 lignes) - Tickers d'équipe
   - Colonnes : id, ticker, added_at, active, company_name, team_name, priority, updated_at
   
3. **`watchlist`** (111 lignes) - Watchlist simple
   - Colonnes : id, ticker, company_name, added_at, notes, target_price, stop_loss, created_at, updated_at
   
4. **`watchlists`** (1 ligne) - Watchlists avec user_id
   - Colonnes : id, user_id, tickers (ARRAY), created_at, updated_at
   
5. **`instruments`** (832 lignes) - Table pour Terminal Emma IA
   - Colonnes : id, symbol, name, exchange, country, currency, sector, industry, market_cap, is_active, created_at, updated_at
   
6. **`watchlist_instruments`** (0 lignes) - Table de liaison
   - Colonnes : id, watchlist_id, symbol, position, added_at

---

## 🎯 Objectif Final

**Table Unifiée : `tickers`**

Avec une colonne `category` pour catégoriser :
- `'team'` : Tickers d'équipe (portefeuille)
- `'watchlist'` : Tickers de watchlist
- `'portfolio'` : Tickers de portefeuille (si différent de team)
- `'both'` : Tickers qui sont à la fois team ET watchlist
- `'manual'` : Tickers ajoutés manuellement
- `'instrument'` : Tickers du Terminal Emma IA

**Colonnes Unifiées** :
- Toutes les colonnes de `tickers` (table principale)
- Colonnes additionnelles pour supporter toutes les fonctionnalités
- Colonne `category` (TEXT) pour la catégorisation
- Colonne `categories` (TEXT[]) pour supporter plusieurs catégories si nécessaire

---

## 📋 Plan d'Exécution

### Phase 1 : Préparation du Schéma Unifié

1. **Créer colonne `category` dans `tickers`**
   - Type : TEXT
   - Valeurs possibles : 'team', 'watchlist', 'portfolio', 'both', 'manual', 'instrument'
   - Default : 'manual'

2. **Créer colonne `categories` (optionnel)**
   - Type : TEXT[]
   - Pour supporter plusieurs catégories simultanément

3. **Ajouter colonnes manquantes si nécessaire**
   - `team_name` (depuis team_tickers)
   - `watchlist_id` (pour lier aux watchlists)

### Phase 2 : Migration des Données

1. **Migrer `team_tickers` → `tickers`**
   - Pour chaque ticker dans `team_tickers` :
     - Si existe dans `tickers` : mettre à jour `category` = 'team' ou ajouter 'team' à `categories`
     - Si n'existe pas : insérer avec `category` = 'team'

2. **Migrer `watchlist` → `tickers`**
   - Pour chaque ticker dans `watchlist` :
     - Si existe dans `tickers` : mettre à jour `category` = 'watchlist' ou ajouter 'watchlist' à `categories`
     - Si n'existe pas : insérer avec `category` = 'watchlist'

3. **Migrer `watchlists.tickers` (ARRAY) → `tickers`**
   - Pour chaque ticker dans l'array :
     - Si existe dans `tickers` : mettre à jour `category` = 'watchlist' ou ajouter 'watchlist' à `categories`
     - Si n'existe pas : insérer avec `category` = 'watchlist'

4. **Migrer `instruments` → `tickers`**
   - Pour chaque instrument :
     - Si existe dans `tickers` : mettre à jour `category` = 'instrument' ou ajouter 'instrument' à `categories`
     - Si n'existe pas : insérer avec `category` = 'instrument'

5. **Gérer les doublons**
   - Si un ticker existe dans plusieurs tables, utiliser `category` = 'both' ou `categories` = ARRAY['team', 'watchlist']

### Phase 3 : Mise à Jour du Code

1. **Endpoints API** (64+ occurrences)
   - `api/chat.js`
   - `api/admin/tickers.js`
   - `api/supabase-watchlist.js`
   - `api/supabase-watchlist-fixed.js`
   - `api/briefing.js`
   - `api/config/tickers.js`
   - `api/tickers-config.js`
   - `api/seeking-alpha-tickers.js`
   - `api/team-tickers.js`
   - `api/terminal-data.js`
   - `api/fmp-sync.js`
   - `api/fmp-batch-sync.js`
   - `api/cron/fmp-batch-sync.js`
   - `api/3p1-sync-na.js`
   - `api/remove-ticker.js`

2. **Scripts** (15+ fichiers)
   - `scripts/*.js`

3. **Frontend**
   - `public/js/dashboard/app-inline.js`
   - Composants React/JSX

### Phase 4 : Nettoyage

1. **Supprimer les anciennes tables** (optionnel, après validation)
   - `team_tickers`
   - `watchlist`
   - `watchlists` (garder si nécessaire pour user_id)
   - `instruments` (garder si nécessaire pour Terminal Emma IA)
   - `watchlist_instruments`

2. **Créer des vues de compatibilité** (si nécessaire)
   - `team_tickers` → vue sur `tickers WHERE category = 'team'`
   - `watchlist` → vue sur `tickers WHERE category = 'watchlist'`

---

## ⚠️ Points d'Attention

1. **Doublons** : Gérer les tickers qui existent dans plusieurs tables
2. **Foreign Keys** : Vérifier les contraintes de clés étrangères
3. **RLS Policies** : Mettre à jour les politiques de sécurité
4. **Index** : Créer des index sur `category` pour performance
5. **Backup** : Faire un backup complet avant migration

---

## ✅ Validation

1. Vérifier que tous les tickers sont migrés
2. Vérifier que les catégories sont correctes
3. Tester tous les endpoints API
4. Tester tous les composants frontend
5. Vérifier les performances

