# Évaluation : Migration localStorage → Supabase

## 📊 État Actuel

### Utilisation de localStorage (60+ fichiers)

#### 🔴 **CRITIQUE - Doit migrer vers Supabase**

1. **Dashboard Grid Layout** (`DashboardGridWrapper.js`)
   - Layouts personnalisés par utilisateur
   - Widgets cachés/visibles
   - Préférences de scope (primary/secondary/global)
   - **Impact**: Chaque utilisateur a ses propres layouts
   - **Clés**: `gob_dashboard_grid_layout_v1:${scopeId}`, `gob_dashboard_hidden_widgets_v1`, `gob_dashboard_show_all_widgets_v1`

2. **CurveWatch Preferences** (`curve-watch-compatible.tsx`)
   - Configuration admin complète (100+ paramètres)
   - Préférences d'affichage, graphiques, couleurs, IA
   - **Impact**: Préférences utilisateur personnalisées
   - **Clé**: `curvewatch_admin_config`
   - **✅ DÉJÀ PARTIELLEMENT MIGRÉ** vers `user_preferences` table

3. **Theme System** (`theme-system.js`)
   - Thème dark/light
   - Préférences de couleurs
   - **Impact**: Préférences visuelles par utilisateur
   - **Clés**: `gob_theme`, `gob_theme_preferences`

4. **Watchlist & Portfolio** (`DansWatchlistTab.js`)
   - Tickers favoris
   - Préférences d'affichage
   - **Impact**: Données utilisateur importantes
   - **Clés**: `watchlist_tickers`, `portfolio_preferences`

#### 🟡 **MOYEN - Devrait migrer**

5. **Emma Chat Preferences** (`AskEmmaTab.js`)
   - Historique de conversation
   - Préférences de température, longueur
   - **Impact**: Expérience utilisateur personnalisée
   - **Clés**: `emma_chat_history`, `emma_preferences`

6. **FastGraphs Preferences** (`FastGraphsTab.js`)
   - Graphiques sauvegardés
   - Préférences d'affichage
   - **Impact**: Configurations utilisateur
   - **Clés**: `fastgraphs_saved`, `fastgraphs_preferences`

7. **Economic Calendar** (`EconomicCalendarTab.js`)
   - Filtres sauvegardés
   - Préférences d'affichage
   - **Impact**: Préférences utilisateur
   - **Clés**: `economic_calendar_filters`

#### 🟢 **FAIBLE - Peut rester localStorage**

8. **Cache temporaire** (`cache-manager.js`, `api-cache-manager.js`)
   - Cache API avec TTL
   - **Impact**: Performance, pas de données utilisateur
   - **Action**: Garder localStorage (cache temporaire)

9. **Logs de debug** (`logger.js`)
   - Logs de développement
   - **Impact**: Debug uniquement
   - **Action**: Garder localStorage ou supprimer

10. **Credentials temporaires** (`credentials-manager.js`)
    - Tokens temporaires
    - **Impact**: Sécurité, doit être sécurisé
    - **Action**: Évaluer migration vers Supabase avec encryption

---

## 🎯 Plan de Migration

### Phase 1: Extension de la table `user_preferences`

**Migration SQL à créer**:

```sql
-- Migration: Extend user_preferences for all apps
-- Description: Support multiple apps in user_preferences
-- Date: 2026-01-10

-- La table existe déjà avec app_name, mais on doit s'assurer qu'elle supporte:
-- - dashboard (grid layouts, widgets)
-- - theme (theme preferences)
-- - watchlist (tickers, portfolio)
-- - emma (chat preferences)
-- - fastgraphs (saved graphs)
-- - economic_calendar (filters)

-- Structure actuelle est OK, juste besoin d'utiliser différents app_name
```

### Phase 2: Création d'un service de synchronisation

**Fichier à créer**: `lib/supabase-user-preferences.js`

```javascript
/**
 * Service centralisé pour gérer les préférences utilisateur dans Supabase
 * Remplace localStorage pour les données utilisateur authentifiées
 */

const USER_PREFERENCES_APPS = {
    DASHBOARD: 'dashboard',
    CURVEWATCH: 'curvewatch',
    THEME: 'theme',
    WATCHLIST: 'watchlist',
    EMMA: 'emma',
    FASTGRAPHS: 'fastgraphs',
    ECONOMIC_CALENDAR: 'economic_calendar'
};

// Fonctions:
// - loadUserPreferences(appName, userId)
// - saveUserPreferences(appName, userId, preferences)
// - mergeWithLocalStorage(appName, preferences) // Fallback si pas authentifié
// - syncPreferences(appName, userId) // Sync localStorage → Supabase
```

### Phase 3: Migration par composant

#### 3.1 Dashboard Grid Layout (PRIORITÉ 1)
- **Fichier**: `DashboardGridWrapper.js`
- **Données à migrer**:
  - Layouts par scope: `gob_dashboard_grid_layout_v1:${scopeId}`
  - Widgets cachés: `gob_dashboard_hidden_widgets_v1`
  - Show all widgets: `gob_dashboard_show_all_widgets_v1`
- **App name**: `dashboard`
- **Structure JSON**:
```json
{
  "layouts": {
    "titres": [...],
    "marches": [...],
    "jlab": [...]
  },
  "hiddenWidgets": [...],
  "showAllWidgetsInDock": true,
  "scopeMode": "primary"
}
```

#### 3.2 Theme System (PRIORITÉ 2)
- **Fichier**: `theme-system.js`
- **Données à migrer**:
  - Thème actuel: `gob_theme`
  - Préférences: `gob_theme_preferences`
- **App name**: `theme`
- **Structure JSON**:
```json
{
  "currentTheme": "dark",
  "preferences": {
    "accentColor": "#6366f1",
    "fontSize": "medium"
  }
}
```

#### 3.3 Watchlist (PRIORITÉ 2)
- **Fichier**: `DansWatchlistTab.js`
- **Données à migrer**:
  - Tickers: `watchlist_tickers`
  - Préférences: `portfolio_preferences`
- **App name**: `watchlist`
- **Structure JSON**:
```json
{
  "tickers": ["AAPL", "MSFT", ...],
  "preferences": {
    "sortBy": "marketCap",
    "viewMode": "grid"
  }
}
```

#### 3.4 CurveWatch (DÉJÀ PARTIELLEMENT FAIT)
- **Fichier**: `curve-watch-compatible.tsx`
- **Statut**: ✅ Déjà migré vers `user_preferences` avec `app_name='curvewatch'`
- **Action**: Compléter la migration (actuellement hybride localStorage + Supabase)

---

## 🔄 Stratégie de Migration

### Approche Progressive

1. **Créer le service centralisé** (`lib/supabase-user-preferences.js`)
   - Fonctions réutilisables pour tous les composants
   - Gestion automatique localStorage fallback
   - Sync intelligent localStorage ↔ Supabase

2. **Migration composant par composant**
   - Commencer par Dashboard Grid (le plus utilisé)
   - Tester avec utilisateur authentifié
   - Garder localStorage comme fallback pour utilisateurs non authentifiés

3. **Synchronisation hybride**
   - **Utilisateur authentifié**: Supabase (source de vérité)
   - **Utilisateur non authentifié**: localStorage (fallback)
   - **Sync**: Au login, merger localStorage → Supabase

### Fonctionnement

```javascript
// Exemple d'utilisation
const { preferences, savePreferences } = useUserPreferences('dashboard');

// Charge depuis Supabase si authentifié, sinon localStorage
// Sauvegarde dans Supabase si authentifié, sinon localStorage
// Sync automatique au login
```

---

## 📈 Bénéfices de la Migration

### ✅ Avantages

1. **Multi-appareil**: Préférences synchronisées entre devices
2. **Persistance**: Données sauvegardées même si localStorage est vidé
3. **Sécurité**: RLS (Row Level Security) dans Supabase
4. **Backup**: Données dans la base de données, pas seulement navigateur
5. **Analytics**: Possibilité d'analyser les préférences utilisateur
6. **Partage**: Possibilité de partager des layouts/presets entre utilisateurs (futur)

### ⚠️ Considérations

1. **Performance**: Requêtes réseau vs localStorage (mais avec cache)
2. **Coût**: Utilisation de Supabase (mais minimal pour préférences)
3. **Complexité**: Gestion de sync localStorage ↔ Supabase
4. **Fallback**: Doit fonctionner pour utilisateurs non authentifiés

---

## 🚀 Plan d'Implémentation

### Étape 1: Service Centralisé (2-3h)
- [ ] Créer `lib/supabase-user-preferences.js`
- [ ] Implémenter load/save avec fallback localStorage
- [ ] Implémenter sync au login
- [ ] Tests unitaires

### Étape 2: Dashboard Grid Layout (3-4h)
- [ ] Migrer `DashboardGridWrapper.js`
- [ ] Tester avec utilisateur authentifié
- [ ] Tester avec utilisateur non authentifié
- [ ] Migration des données existantes (localStorage → Supabase)

### Étape 3: Theme System (1-2h)
- [ ] Migrer `theme-system.js`
- [ ] Tests

### Étape 4: Watchlist (2-3h)
- [ ] Migrer `DansWatchlistTab.js`
- [ ] Tests

### Étape 5: Autres composants (selon priorité)
- [ ] Emma Chat
- [ ] FastGraphs
- [ ] Economic Calendar

### Étape 6: Documentation & Cleanup
- [ ] Documenter l'API
- [ ] Supprimer anciens usages localStorage (garder seulement cache)
- [ ] Migration guide pour futurs composants

---

## 📝 Notes Techniques

### Structure de la table `user_preferences`

```sql
user_preferences (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  app_name TEXT, -- 'dashboard', 'curvewatch', 'theme', etc.
  preferences JSONB, -- Données spécifiques à l'app
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id, app_name)
)
```

### Exemple de données

```json
// app_name = 'dashboard'
{
  "layouts": {
    "titres": [{ "i": "titres-portfolio", "x": 0, "y": 0, "w": 12, "h": 12 }],
    "marches": [{ "i": "marches-global", "x": 0, "y": 0, "w": 6, "h": 10 }]
  },
  "hiddenWidgets": ["admin-config"],
  "showAllWidgetsInDock": false,
  "scopeMode": "primary"
}

// app_name = 'theme'
{
  "currentTheme": "dark",
  "preferences": {
    "accentColor": "#6366f1",
    "fontSize": "medium",
    "compactMode": false
  }
}
```

---

## ✅ Conclusion

**Recommandation**: Migrer progressivement vers Supabase pour:
- ✅ Meilleure expérience multi-appareil
- ✅ Persistance des données
- ✅ Sécurité améliorée
- ✅ Possibilité d'analytics et partage futur

**Approche**: Migration progressive composant par composant, avec fallback localStorage pour utilisateurs non authentifiés.
