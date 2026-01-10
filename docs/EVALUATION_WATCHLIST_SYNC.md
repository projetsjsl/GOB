# Évaluation : Synchronisation Watchlist & Team Tickers

## 🔴 PROBLÈME IDENTIFIÉ

### Systèmes Non Synchronisés

Il existe **TROIS systèmes différents** pour gérer les watchlists et team tickers qui **ne sont PAS synchronisés** :

#### 1. **Dashboard Watchlist** (DansWatchlistTab.js)
- **Table**: `watchlists` (legacy) OU `user_preferences` (nouveau avec `app_name='watchlist'`)
- **API**: `/api/supabase-watchlist` (legacy) OU `UserPreferencesService` (nouveau)
- **Structure**: `{ user_id, tickers: ["AAPL", "MSFT", ...] }`
- **Usage**: Dashboard principal

#### 2. **3p1 Application** (App.tsx)
- **Table**: `tickers` avec champ `source`
- **API**: `/api/admin/tickers?source=watchlist` ou `/api/tickers-config`
- **Structure**: `{ ticker: "AAPL", source: "watchlist"|"team"|"both"|"manual", ... }`
- **Usage**: Application Finance Pro (3p1)

#### 3. **Team Tickers (Portefeuille)**
- **Table**: `tickers` avec `source='team'` ou `category='team'`
- **API**: `/api/admin/tickers?source=team` ou `/api/tickers-config`
- **Structure**: `{ ticker: "GOOGL", source: "team", ... }`
- **Usage**: Portefeuille d'équipe (3p1 et dashboard)

## ⚠️ Conséquences

### Problèmes Actuels

1. **Pas de synchronisation bidirectionnelle**
   - Ajouter un ticker dans le dashboard → **N'apparaît PAS dans 3p1**
   - Ajouter un ticker dans 3p1 → **N'apparaît PAS dans le dashboard**
   - Team tickers modifiés dans 3p1 → **N'apparaissent PAS dans le dashboard**

2. **Données dupliquées**
   - Watchlist dans `user_preferences` (dashboard)
   - Watchlist dans `tickers` table avec `source='watchlist'` (3p1)
   - Pas de source unique de vérité

3. **Incohérence des données**
   - Un ticker peut être dans le dashboard mais pas dans 3p1
   - Un ticker peut être dans 3p1 mais pas dans le dashboard
   - Team tickers peuvent être différents selon l'endroit

## 🎯 Solution Proposée

### Option 1: Unifier vers table `tickers` (RECOMMANDÉ)

**Avantages**:
- ✅ Source unique de vérité
- ✅ Supporte déjà team + watchlist + both
- ✅ Métadonnées complètes (sector, priority, etc.)
- ✅ Déjà utilisé par 3p1

**Migration nécessaire**:
1. Modifier `UserPreferencesService` pour synchroniser avec table `tickers`
2. Créer une fonction de sync bidirectionnelle
3. Migrer les données `user_preferences` → `tickers` table

**Structure unifiée**:
```sql
tickers table:
- ticker (PK)
- source: 'team' | 'watchlist' | 'both' | 'manual'
- user_id (pour watchlist personnelle)
- is_active
- priority
- ... (autres métadonnées)
```

### Option 2: Unifier vers `user_preferences` (MOINS RECOMMANDÉ)

**Inconvénients**:
- ❌ Perd les métadonnées (sector, priority, etc.)
- ❌ Nécessite migration complète de 3p1
- ❌ Plus complexe pour team tickers (multi-user)

## 🔄 Plan de Synchronisation

### Phase 1: Service de Synchronisation

Créer `lib/supabase-tickers-sync.js`:

```javascript
/**
 * Service de synchronisation bidirectionnelle entre:
 * - user_preferences (dashboard) ↔ tickers table (3p1)
 * - Team tickers (portefeuille)
 */

// Fonctions:
// - syncWatchlistToTickersTable(userId, tickers) // Dashboard → tickers table
// - syncTickersTableToWatchlist(userId) // tickers table → Dashboard
// - syncTeamTickers() // Team tickers (global)
// - syncBidirectional(userId) // Sync complet bidirectionnel
```

### Phase 2: Modification Dashboard

**DansWatchlistTab.js**:
- ✅ Utilise déjà `UserPreferencesService` (fait)
- ⏳ Ajouter sync vers `tickers` table après chaque modification
- ⏳ Charger depuis `tickers` table si disponible

### Phase 3: Modification 3p1

**App.tsx**:
- ✅ Charge déjà depuis `tickers` table (fait)
- ⏳ Ajouter sync vers `user_preferences` après chaque modification
- ⏳ Écouter changements `user_preferences` (realtime)

### Phase 4: Team Tickers

**Portefeuille**:
- ⏳ Créer composant pour gérer team tickers dans dashboard
- ⏳ Synchroniser avec `tickers` table (`source='team'`)
- ⏳ Afficher dans dashboard et 3p1

## 📊 Structure de Données Unifiée

### Table `tickers` (Source de vérité)

```sql
CREATE TABLE tickers (
  id UUID PRIMARY KEY,
  ticker TEXT NOT NULL,
  source TEXT, -- 'team' | 'watchlist' | 'both' | 'manual'
  category TEXT, -- Alternative à source (nouveau schéma)
  user_id UUID, -- Pour watchlist personnelle
  is_active BOOLEAN,
  priority INTEGER,
  company_name TEXT,
  sector TEXT,
  ...
);
```

### Mapping

| Source | Dashboard | 3p1 | Description |
|--------|-----------|-----|-------------|
| `source='team'` | ⭐ Portefeuille | ⭐ Portefeuille | Tickers d'équipe (global) |
| `source='watchlist'` | 👁️ Watchlist | 👁️ Watchlist | Watchlist personnelle |
| `source='both'` | ⭐ + 👁️ | ⭐ + 👁️ | Les deux (priorité portefeuille) |
| `source='manual'` | Normal | Normal | Tickers normaux |

## 🔄 Flux de Synchronisation

### Dashboard → 3p1
```
1. Utilisateur ajoute ticker dans dashboard
2. UserPreferencesService sauvegarde dans user_preferences
3. syncWatchlistToTickersTable() ajoute dans tickers table avec source='watchlist'
4. 3p1 détecte changement (realtime) et affiche
```

### 3p1 → Dashboard
```
1. Utilisateur ajoute ticker dans 3p1 avec source='watchlist'
2. tickers table mise à jour
3. syncTickersTableToWatchlist() met à jour user_preferences
4. Dashboard détecte changement et affiche
```

### Team Tickers
```
1. Admin modifie team tickers (source='team')
2. tickers table mise à jour
3. Tous les utilisateurs voient le changement (realtime)
4. Dashboard et 3p1 synchronisés automatiquement
```

## ✅ Actions Immédiates

### 1. Créer Service de Synchronisation
- [ ] Créer `lib/supabase-tickers-sync.js`
- [ ] Implémenter sync bidirectionnelle
- [ ] Tests unitaires

### 2. Modifier Dashboard
- [ ] Ajouter sync vers `tickers` table dans `addTickerToWatchlist`
- [ ] Ajouter sync vers `tickers` table dans `removeTickerFromWatchlist`
- [ ] Charger depuis `tickers` table au démarrage (priorité)

### 3. Modifier 3p1
- [ ] Ajouter sync vers `user_preferences` lors modification watchlist
- [ ] Écouter changements `user_preferences` (realtime)

### 4. Team Tickers Dashboard
- [ ] Créer composant pour afficher team tickers
- [ ] Permettre modification (admin seulement)
- [ ] Synchroniser avec `tickers` table

## 📝 Notes Techniques

### Tables Supabase

1. **`tickers`** (source de vérité)
   - Tous les tickers (team, watchlist, manual)
   - Métadonnées complètes
   - Support multi-user (user_id pour watchlist)

2. **`user_preferences`** (cache/preferences)
   - Préférences utilisateur
   - Watchlist en cache (sync avec tickers)
   - Fallback si tickers table non disponible

3. **`watchlists`** (legacy - à déprécier)
   - Ancienne table
   - Migrer vers `tickers` table
   - Garder pour compatibilité temporaire

### APIs

1. **`/api/admin/tickers`** ✅ (utilisé par 3p1)
   - CRUD complet sur table `tickers`
   - Support source/category

2. **`/api/tickers-config`** ✅ (utilisé par 3p1)
   - Retourne team + watchlist tickers
   - Depuis table `tickers`

3. **`/api/supabase-watchlist`** ⚠️ (legacy - à déprécier)
   - Utilise table `watchlists` (legacy)
   - Migrer vers `tickers` table

## 🚀 Priorité

**CRITIQUE** - Les utilisateurs s'attendent à ce que:
- ✅ Ajouter un ticker dans le dashboard → apparaît dans 3p1
- ✅ Ajouter un ticker dans 3p1 → apparaît dans le dashboard
- ✅ Team tickers synchronisés partout

**Statut actuel**: ❌ **NON SYNCHRONISÉ**

**Action requise**: ✅ **CRÉER SERVICE DE SYNCHRONISATION BIDIRECTIONNELLE**
