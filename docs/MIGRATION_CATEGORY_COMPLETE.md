# ✅ Migration Complète : `source` → `category`

## 📊 État de la Migration

### ✅ Phase 1 : Base de Données - TERMINÉE
- ✅ Colonne `category` ajoutée à `tickers`
- ✅ Colonne `categories` (TEXT[]) ajoutée
- ✅ Colonnes `team_name` et `watchlist_id` ajoutées
- ✅ Données migrées :
  - `team_tickers` → `tickers` (category='team')
  - `watchlist` → `tickers` (category='watchlist')
  - `watchlists.tickers` → `tickers` (category='watchlist')
  - `instruments` → `tickers` (category='instrument')
- ✅ Statistiques : 859 tickers actifs fusionnés

### 🔄 Phase 2 : Endpoints API - EN COURS

#### ✅ Fichiers Mis à Jour
- ✅ `api/chat.js` - Utilise `category` au lieu de `source`
- ✅ `api/briefing.js` - Utilise `category` au lieu de `source`
- ✅ `api/config/tickers.js` - Utilise `category` au lieu de `source`
- ✅ `api/tickers-config.js` - Utilise `category` au lieu de `source`

#### ⏳ Fichiers à Mettre à Jour
- ⏳ `api/admin/tickers.js` - Utilise encore `source`
- ⏳ `api/seeking-alpha-tickers.js` - Utilise encore `source`
- ⏳ `api/team-tickers.js` - Utilise encore `source`
- ⏳ `api/supabase-watchlist.js` - À vérifier
- ⏳ `api/supabase-watchlist-fixed.js` - À vérifier
- ⏳ `api/remove-ticker.js` - À vérifier
- ⏳ `api/fmp-batch-sync.js` - À vérifier
- ⏳ `api/cron/fmp-batch-sync.js` - À vérifier
- ⏳ `api/3p1-sync-na.js` - À vérifier
- ⏳ `api/terminal-data.js` - Utilise `instruments`, à migrer vers `tickers`

### ⏳ Phase 3 : Scripts - EN ATTENTE
- ⏳ `scripts/*.js` (15+ fichiers)

### ⏳ Phase 4 : Frontend - EN ATTENTE
- ⏳ `public/js/dashboard/app-inline.js`
- ⏳ Composants React/JSX

---

## 🔄 Mapping `source` → `category`

| Ancien (`source`) | Nouveau (`category`) | Logique |
|-------------------|----------------------|---------|
| `'team'` | `'team'` | Tickers d'équipe |
| `'watchlist'` | `'watchlist'` | Tickers de watchlist |
| `'both'` | `'both'` | Tickers team ET watchlist |
| `'manual'` | `'manual'` | Tickers ajoutés manuellement |
| N/A | `'instrument'` | Tickers du Terminal Emma IA |

---

## 📝 Patterns de Remplacement

### Pattern 1 : Requêtes Supabase SDK
```javascript
// AVANT
.or('source.eq.team,source.eq.both')
.eq('source', 'team')

// APRÈS
.or('category.eq.team,category.eq.both')
.eq('category', 'team')
```

### Pattern 2 : Requêtes REST API
```javascript
// AVANT
`or=(source.eq.team,source.eq.both)`

// APRÈS
`or=(category.eq.team,category.eq.both)`
```

### Pattern 3 : Conditions
```javascript
// AVANT
if (ticker.source === 'both') { ... }
if (ticker.source === 'team') { ... }

// APRÈS
if (ticker.category === 'both') { ... }
if (ticker.category === 'team') { ... }
```

### Pattern 4 : Insertions
```javascript
// AVANT
{ source: 'team', ... }

// APRÈS
{ category: 'team', categories: ['team'], ... }
```

---

## ⚠️ Points d'Attention

1. **Compatibilité** : La colonne `source` existe toujours pour rétrocompatibilité
2. **Categories Array** : Utiliser `categories` pour supporter plusieurs catégories
3. **Migration Graduelle** : Mettre à jour progressivement, pas tout d'un coup
4. **Tests** : Tester chaque endpoint après modification

---

## 🎯 Prochaines Étapes

1. ✅ Terminer la mise à jour de tous les endpoints API
2. ⏳ Mettre à jour les scripts
3. ⏳ Mettre à jour le frontend
4. ⏳ Tests complets
5. ⏳ Supprimer la colonne `source` (optionnel, après validation)

