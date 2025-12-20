# Accès au Dashboard Modulaire sur gobapps.com

## 📍 URLs d'accès

### Dashboard Modulaire (Nouveau - GOD MODE)
- **URL directe**: `https://gobapps.com/modular-dashboard-beta.html`
- **Description**: Dashboard modulaire avec système de grille React Grid Layout
- **Fonctionnalités**: 
  - Widgets redimensionnables et déplaçables
  - Système "Infinite Canvas OS"
  - Compatible avec tous les composants existants

### Dashboard Beta (Principal)
- **URL directe**: `https://gobapps.com/beta-combined-dashboard.html`
- **URL raccourcie**: `https://gobapps.com/jlab` (redirige vers beta-combined-dashboard.html)
- **Description**: Dashboard principal avec système d'onglets

### Dashboard Principal (React/TypeScript)
- **URL**: `https://gobapps.com/` (page d'accueil)
- **Description**: Version React/TypeScript du dashboard

## 🔗 Intégration dans le Dashboard Beta

Le dashboard modulaire est accessible depuis le dashboard beta principal via :

1. **Onglet "Tests"** → **"Modulaire (Bêta)"**
   - Dans `beta-combined-dashboard.html`, section "Tests"
   - Redirige vers `/modular-dashboard-beta.html`

2. **Code de référence** (dans `app-inline.js` ligne 576):
   ```javascript
   { id: 'tests-canvas', label: 'Modulaire (Bêta)', icon: 'Move', component: 'redirect:modular-dashboard-beta.html' }
   ```

## 🎯 Différences entre les dashboards

### Dashboard Modulaire (`modular-dashboard-beta.html`)
- ✅ Système de grille React Grid Layout
- ✅ Widgets redimensionnables et déplaçables
- ✅ Layout persistant (localStorage)
- ✅ Mode "GOD MODE" avec canvas infini
- ✅ Compatible avec tous les composants existants
- ✅ Exposition de `window.BetaCombinedDashboard` pour compatibilité

### Dashboard Beta (`beta-combined-dashboard.html`)
- ✅ Système d'onglets classique
- ✅ Navigation par onglets
- ✅ Tous les composants intégrés
- ✅ Version stable et complète

### Dashboard Principal (`/` - React/TypeScript)
- ✅ Version moderne avec React + TypeScript
- ✅ Build avec Vite
- ✅ Composants TypeScript

## 🚀 Comment tester le Dashboard Modulaire

1. **Accès direct**:
   ```
   https://gobapps.com/modular-dashboard-beta.html
   ```

2. **Depuis le Dashboard Beta**:
   - Ouvrir `https://gobapps.com/jlab`
   - Aller dans l'onglet "Tests"
   - Cliquer sur "Modulaire (Bêta)"

3. **Fonctionnalités à tester**:
   - ✅ Ajouter des widgets via le Dock (barre en bas)
   - ✅ Redimensionner les widgets
   - ✅ Déplacer les widgets
   - ✅ Fermer les widgets
   - ✅ Changer le thème (bouton en haut à droite)
   - ✅ Reset du layout (bouton "Reset OS")

## 📋 Widgets disponibles

- **Marchés** (`MarketsEconomyTabRGL`) - Vue d'ensemble des marchés
- **Portfolio** (`TitresTabRGL`) - Gestion du portfolio
- **Terminal JLab** (`JLabTab`) - Terminal avancé
- **Emma AI** (`AskEmmaTab`) - Assistant IA
- **Notes Rapides** (`NotesWidget`) - Notes personnelles

## 🔧 Configuration Vercel

Le fichier `vercel.json` configure les redirections :
- `/jlab` → `/beta-combined-dashboard.html`
- `/jlab/` → `/beta-combined-dashboard.html`

Le dashboard modulaire est accessible directement via `/modular-dashboard-beta.html` sans redirection.

## ✅ Compatibilité

Le dashboard modulaire expose les mêmes objets globaux que le dashboard beta :
- `window.BetaCombinedDashboard` - Données et fonctions partagées
- `window.BetaCombinedDashboardData` - Fonctions utilitaires
- Tous les composants sont compatibles avec les deux systèmes

## 🐛 Dépannage

Si le dashboard modulaire ne se charge pas :

1. Vérifier la console du navigateur pour les erreurs
2. Vérifier que tous les scripts sont chargés :
   - React, ReactDOM
   - Babel Standalone
   - React Grid Layout
   - Recharts
   - Supabase (optionnel)

3. Vérifier que les composants sont exposés :
   ```javascript
   console.log(window.FullModularDashboard);
   console.log(window.BetaCombinedDashboard);
   console.log(window.JLabTab);
   console.log(window.AskEmmaTab);
   ```

4. Tester avec le script de test :
   ```bash
   node scripts/test-modular-dashboard-simple.js
   ```
