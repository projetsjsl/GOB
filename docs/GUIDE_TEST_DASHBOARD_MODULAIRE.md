# Guide de Test - Dashboard Modulaire

## 🧪 Tests Automatisés

### Script de Test Automatique

Un script de test automatisé est disponible pour valider la structure et la configuration :

```bash
node scripts/test-dashboard-modular.cjs
```

**Ce script vérifie:**
- ✅ Présence de tous les fichiers nécessaires
- ✅ Structure HTML correcte
- ✅ Tous les modules présents et chargés
- ✅ Dépendances présentes
- ✅ Exposition globale des composants
- ✅ Configuration de l'authentification
- ✅ Syntaxe des modules critiques

## 🔍 Tests Manuels Recommandés

### 1. Test d'Authentification

#### 1.1 Connexion
1. Ouvrir `http://localhost:3000/login.html` (ou votre URL)
2. Saisir les identifiants
3. Cliquer sur "Se connecter"
4. **Vérifier:** Redirection vers `beta-combined-dashboard.html`
5. **Vérifier:** Dashboard s'affiche correctement

#### 1.2 Protection des Routes
1. Ouvrir directement `http://localhost:3000/beta-combined-dashboard.html` sans être connecté
2. **Vérifier:** Redirection automatique vers `login.html`
3. **Vérifier:** Message d'erreur si sessionStorage est vide

#### 1.3 Persistance de Session
1. Se connecter
2. Rafraîchir la page (F5)
3. **Vérifier:** Reste connecté (pas de redirection vers login)
4. **Vérifier:** Données utilisateur préservées

### 2. Test de Navigation

#### 2.1 Navigation Desktop
1. Ouvrir le dashboard
2. Cliquer sur chaque onglet dans la sidebar gauche
3. **Vérifier:** Chaque onglet se charge correctement
4. **Vérifier:** Pas d'erreurs dans la console
5. **Vérifier:** Contenu affiché correctement

#### 2.2 Navigation Mobile
1. Ouvrir le dashboard sur mobile (ou mode responsive)
2. Utiliser la barre de navigation en bas
3. **Vérifier:** Navigation fluide
4. **Vérifier:** Tous les onglets accessibles

#### 2.3 Onglets à Tester
- ✅ **JLab™ (IntelliStocks)** - Onglet par défaut
- ✅ **Titres & Nouvelles (StocksNews)**
- ✅ **Dans Watchlist (DansWatchlist)**
- ✅ **Ask Emma (AskEmma)**
- ✅ **Calendrier Économique (EconomicCalendar)**
- ✅ **Calendrier Investing (InvestingCalendar)**
- ✅ **Marchés & Économie (MarketsEconomy)**
- ✅ **Courbe des Rendements (YieldCurve)**
- ✅ **Seeking Alpha (SeekingAlpha)**
- ✅ **Scraping SA (ScrappingSA)**
- ✅ **Briefings Email (EmailBriefings)**
- ✅ **Admin JSLAI (AdminJSLai)**
- ✅ **Plus (Plus)** - Déconnexion

### 3. Test des Fonctionnalités Principales

#### 3.1 Chargement des Données
1. Ouvrir l'onglet "Titres & Nouvelles"
2. **Vérifier:** Données de stocks chargées
3. **Vérifier:** Nouvelles affichées
4. **Vérifier:** Pas d'erreurs API dans la console

#### 3.2 Gestion de la Watchlist
1. Ouvrir l'onglet "Dans Watchlist"
2. Ajouter un ticker
3. **Vérifier:** Ticker ajouté à la liste
4. Supprimer un ticker
5. **Vérifier:** Ticker retiré de la liste

#### 3.3 Ask Emma
1. Ouvrir l'onglet "Ask Emma"
2. Poser une question
3. **Vérifier:** Réponse d'Emma affichée
4. **Vérifier:** Pas d'erreurs dans la console

#### 3.4 Thème Dark/Light
1. Basculer entre le thème dark et light
2. **Vérifier:** Changement appliqué immédiatement
3. **Vérifier:** Préférence sauvegardée (rafraîchir la page)
4. **Vérifier:** Tous les onglets respectent le thème

### 4. Test de Performance

#### 4.1 Temps de Chargement
1. Ouvrir les DevTools (F12)
2. Aller dans l'onglet "Network"
3. Recharger la page (Ctrl+R ou Cmd+R)
4. **Vérifier:** Temps de chargement < 5 secondes
5. **Vérifier:** Tous les modules chargés

#### 4.2 Console Browser
1. Ouvrir la console (F12)
2. Recharger la page
3. **Vérifier:** Pas d'erreurs JavaScript
4. **Vérifier:** Messages de succès pour le chargement des modules
5. **Vérifier:** "✅ Dashboard rendered successfully!"

#### 4.3 Mémoire
1. Ouvrir les DevTools
2. Aller dans l'onglet "Performance" ou "Memory"
3. Naviguer entre plusieurs onglets
4. **Vérifier:** Pas de fuites mémoire importantes
5. **Vérifier:** Mémoire stable après navigation

### 5. Test de Compatibilité

#### 5.1 Navigateurs
Tester sur:
- ✅ Chrome/Edge (dernière version)
- ✅ Firefox (dernière version)
- ✅ Safari (si disponible)
- ✅ Mobile (Chrome/Safari)

#### 5.2 Responsive Design
1. Tester différentes tailles d'écran:
   - Mobile (375px)
   - Tablet (768px)
   - Desktop (1920px)
2. **Vérifier:** Interface adaptée à chaque taille
3. **Vérifier:** Navigation mobile fonctionnelle

### 6. Test des Intégrations

#### 6.1 APIs
1. Vérifier que les appels API fonctionnent:
   - `/api/marketdata`
   - `/api/news`
   - `/api/gemini/chat`
   - `/api/emma-agent`
2. **Vérifier:** Réponses correctes
3. **Vérifier:** Gestion des erreurs

#### 6.2 TradingView Widgets
1. Ouvrir l'onglet "Marchés & Économie"
2. **Vérifier:** Widgets TradingView chargés
3. **Vérifier:** Pas d'erreurs dans la console

#### 6.3 Chart.js
1. Ouvrir l'onglet "Courbe des Rendements"
2. **Vérifier:** Graphique affiché
3. **Vérifier:** Données correctes

### 7. Test de Robustesse

#### 7.1 Gestion des Erreurs
1. Simuler une erreur réseau (désactiver le réseau)
2. **Vérifier:** Messages d'erreur appropriés
3. **Vérifier:** Interface ne plante pas

#### 7.2 Données Manquantes
1. Tester avec des tickers inexistants
2. **Vérifier:** Gestion gracieuse des erreurs
3. **Vérifier:** Messages informatifs

## 📋 Checklist de Test Complète

### Phase 1: Structure et Configuration
- [ ] Script de test automatisé passe
- [ ] Tous les modules chargés
- [ ] Aucune erreur dans la console au chargement
- [ ] Dashboard s'affiche correctement

### Phase 2: Authentification
- [ ] Connexion fonctionne
- [ ] Redirection après login correcte
- [ ] Protection des routes active
- [ ] Persistance de session

### Phase 3: Navigation
- [ ] Tous les onglets accessibles
- [ ] Navigation desktop fonctionnelle
- [ ] Navigation mobile fonctionnelle
- [ ] Pas d'erreurs lors du changement d'onglet

### Phase 4: Fonctionnalités
- [ ] Chargement des données
- [ ] Gestion de la watchlist
- [ ] Ask Emma fonctionne
- [ ] Thème dark/light
- [ ] Toutes les fonctionnalités principales

### Phase 5: Performance
- [ ] Temps de chargement acceptable
- [ ] Pas de fuites mémoire
- [ ] Interface fluide

### Phase 6: Compatibilité
- [ ] Fonctionne sur Chrome
- [ ] Fonctionne sur Firefox
- [ ] Responsive design correct
- [ ] Mobile fonctionnel

## 🐛 Dépannage

### Problème: Dashboard ne se charge pas

**Vérifications:**
1. Ouvrir la console (F12)
2. Vérifier les erreurs JavaScript
3. Vérifier que tous les modules sont chargés:
   ```javascript
   console.log(window.BetaCombinedDashboard);
   console.log(window.PlusTab);
   // etc.
   ```
4. Vérifier que `dashboard-main.js` est chargé

### Problème: Onglet ne s'affiche pas

**Vérifications:**
1. Vérifier que le module est chargé:
   ```javascript
   console.log(window.NomDuTab);
   ```
2. Vérifier la console pour les erreurs
3. Vérifier que le module est référencé dans le HTML

### Problème: Erreurs d'authentification

**Vérifications:**
1. Vérifier que `auth-guard.js` est chargé
2. Vérifier `sessionStorage`:
   ```javascript
   console.log(sessionStorage.getItem('gob-user'));
   ```
3. Vérifier les redirections dans `login.html`

## 📊 Résultats Attendus

### Console Browser (Succès)

```
✅ Rendering BetaCombinedDashboard...
✅ Dashboard rendered successfully!
📚 Vérification des bibliothèques:
Recharts disponible: true
Iconoir disponible: true
```

### Console Browser (Erreurs à Vérifier)

Si vous voyez:
- ❌ `BetaCombinedDashboard not found` → Vérifier `dashboard-main.js`
- ❌ `Root element not found` → Vérifier `<div id="root"></div>`
- ❌ `Module not found` → Vérifier que le module est présent et chargé

## ✅ Critères de Succès

Le dashboard modulaire est considéré comme fonctionnel si:

1. ✅ Tous les tests automatisés passent
2. ✅ Authentification fonctionne
3. ✅ Tous les onglets se chargent
4. ✅ Aucune erreur JavaScript critique
5. ✅ Interface identique à l'originale
6. ✅ Performance acceptable
7. ✅ Compatible avec les navigateurs principaux

## 🎯 Prochaines Étapes Après Tests

Une fois tous les tests passés:

1. ✅ Déployer en production
2. ✅ Monitorer les erreurs
3. ✅ Collecter les retours utilisateurs
4. ✅ Optimiser si nécessaire

