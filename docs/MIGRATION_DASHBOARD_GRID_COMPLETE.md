# Migration Dashboard Grid Layout → Supabase ✅

## 🎯 Objectif
Migrer les layouts de grille du dashboard de localStorage vers Supabase pour permettre la synchronisation multi-appareil.

## ✅ Modifications Effectuées

### 1. Service Centralisé Créé
- **Fichier**: `public/js/supabase-user-preferences.js`
- **Fonctionnalités**:
  - Chargement depuis Supabase avec fallback localStorage
  - Sauvegarde dans Supabase avec fallback localStorage
  - Support multi-applications

### 2. DashboardGridWrapper.js Modifié

#### Fonctions Modifiées:

**`loadLayoutFromStorage`** (ligne ~157)
- ✅ Devient async
- ✅ Essaie Supabase d'abord (si authentifié)
- ✅ Fallback localStorage si Supabase non disponible
- ✅ Structure: `{ layouts: { [scopeId]: layout } }`

**`persistLayoutForScope`** (ligne ~616)
- ✅ Devient async
- ✅ Sauvegarde dans Supabase (si authentifié) avec fallback localStorage
- ✅ Structure: `{ layouts: { [scopeId]: layout } }`
- ✅ Ne sauvegarde PAS dans config remote automatiquement (seulement via boutons explicites)

**`useEffect` de chargement initial** (ligne ~677)
- ✅ Devient async avec gestion de cleanup
- ✅ Priorité: Supabase → localStorage → config remote → default
- ✅ Sauvegarde automatique du layout par défaut dans Supabase/localStorage

**`addWidget`** (ligne ~892)
- ✅ Devient async
- ✅ Charge depuis Supabase si scope différent
- ✅ Sauvegarde dans Supabase après ajout

### 3. HTML Principal Modifié
- **Fichier**: `public/beta-combined-dashboard.html`
- ✅ Ajout du script `supabase-user-preferences.js` avant `DashboardGridWrapper.js`

## 📊 Structure des Données

### Dans Supabase (`user_preferences` table)
```json
{
  "user_id": "uuid",
  "app_name": "dashboard",
  "preferences": {
    "layouts": {
      "titres": [{ "i": "titres-portfolio", "x": 0, "y": 0, "w": 12, "h": 12 }],
      "marches": [{ "i": "marches-global", "x": 0, "y": 0, "w": 6, "h": 10 }],
      "jlab": [...],
      "emma": [...]
    }
  }
}
```

### Dans localStorage (fallback)
- **Clé**: `gob_dashboard_grid_layout_v1:${scopeId}`
- **Valeur**: Array de layout items directement (compatibilité backward)

## 🔄 Flux de Données

### Chargement
1. **Utilisateur authentifié**: Supabase → localStorage → default
2. **Utilisateur non authentifié**: localStorage → default

### Sauvegarde
1. **Utilisateur authentifié**: Supabase (avec fallback localStorage)
2. **Utilisateur non authentifié**: localStorage uniquement

### Synchronisation
- Au login: localStorage → Supabase (merge intelligent)
- À chaque changement: Supabase (si auth) ou localStorage

## ✅ Bénéfices

1. **Multi-appareil**: Layouts synchronisés entre devices
2. **Persistance**: Données dans la DB, pas seulement navigateur
3. **Sécurité**: RLS Supabase (chaque utilisateur voit seulement ses données)
4. **Fallback**: Fonctionne même sans authentification (localStorage)

## 🧪 Tests à Effectuer

### Test 1: Utilisateur Authentifié
1. Se connecter
2. Redimensionner un widget
3. Vérifier dans Supabase que les données sont sauvegardées
4. Se déconnecter et reconnecter
5. Vérifier que le layout est restauré

### Test 2: Utilisateur Non Authentifié
1. Sans se connecter
2. Redimensionner un widget
3. Vérifier dans localStorage que les données sont sauvegardées
4. Recharger la page
5. Vérifier que le layout est restauré

### Test 3: Synchronisation au Login
1. Sans se connecter, modifier le layout
2. Se connecter
3. Vérifier que le layout localStorage est sync vers Supabase
4. Sur un autre appareil, se connecter
5. Vérifier que le layout est synchronisé

## 📝 Notes Techniques

### Clés localStorage (fallback)
- `gob_dashboard_grid_layout_v1:${scopeId}` - Layout par scope
- `gob_dashboard_hidden_widgets_v1` - Widgets cachés
- `gob_dashboard_show_all_widgets_v1` - Option "show all widgets"

### App Name Supabase
- `app_name = 'dashboard'` pour toutes les préférences de grille

### Compatibilité
- ✅ Backward compatible: fonctionne avec données localStorage existantes
- ✅ Forward compatible: nouvelles données Supabase mergent avec localStorage

## 🚀 Prochaines Étapes

1. ✅ Migration Dashboard Grid Layout (FAIT)
2. ⏳ Migration Theme System
3. ⏳ Migration Watchlist
4. ⏳ Migration autres composants

## ⚠️ Points d'Attention

1. **Performance**: Requêtes réseau pour Supabase (mais avec cache)
2. **Debounce**: Les sauvegardes fréquentes sont déjà debounced (900ms)
3. **Erreurs**: Gestion d'erreur avec fallback automatique localStorage
4. **Async**: Tous les appels sont async mais ne bloquent pas l'UI

## ✅ Statut

**Migration Dashboard Grid Layout**: ✅ **COMPLÈTE**

- Service créé ✅
- DashboardGridWrapper modifié ✅
- HTML mis à jour ✅
- Fallback localStorage ✅
- Documentation complète ✅

**Prêt pour tests et déploiement** 🚀
