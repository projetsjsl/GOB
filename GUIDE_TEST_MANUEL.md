# 🧪 Guide de Test Manuel du Dashboard Modulaire

## Prérequis

1. **Serveur démarré** : `node server.js` (doit écouter sur le port 10000)
2. **Navigateur** : Chrome, Firefox, ou Safari (de préférence en mode navigation privée pour éviter le cache)
3. **Identifiants** : gob / gob

## Étapes de Test

### 1. 🔐 Authentification

1. Ouvrir `http://localhost:10000/login.html`
2. Vérifier que la page de login s'affiche correctement
3. Saisir les identifiants :
   - **Nom d'utilisateur** : `gob`
   - **Mot de passe** : `gob`
4. Cliquer sur "Se connecter"
5. **Vérifier** : Redirection automatique vers `/beta-combined-dashboard.html`

### 2. 🎨 Interface Visuelle

Vérifier que les éléments suivants sont visibles :

- [ ] **Header** : "TERMINAL FINANCIER Emma IABÊTA" en haut de la page
- [ ] **TradingView Ticker Tape** : Bandeau de tickers en dessous du header
- [ ] **Sidebar de navigation** : Menu latéral avec tous les onglets
- [ ] **Contenu principal** : Zone centrale avec le contenu de l'onglet actif
- [ ] **Avatar Emma** : Icône flottante en bas à droite
- [ ] **Bouton thème** : Bouton ☀️ pour changer le thème dark/light
- [ ] **Bouton déconnexion** : Visible dans le header

### 3. 📑 Navigation entre Onglets

Tester chaque onglet en cliquant dessus et vérifier :

#### 3.1 Marchés & Économie
- [ ] L'onglet s'affiche sans erreur
- [ ] Les widgets TradingView sont visibles (Market Overview, Heatmap, Screener)
- [ ] Pas d'erreurs dans la console

#### 3.2 JLab™
- [ ] L'onglet s'affiche sans erreur
- [ ] Les sous-onglets sont visibles : "Titres en portefeuille", "Dan's watchlist", "3pour1"
- [ ] Cliquer sur chaque sous-onglet et vérifier le contenu
- [ ] Pas d'erreurs dans la console

#### 3.3 Emma IA™
- [ ] L'onglet s'affiche sans erreur
- [ ] L'interface de chat est visible
- [ ] Tester l'envoi d'un message
- [ ] Pas d'erreurs dans la console

#### 3.4 Plus
- [ ] L'onglet s'affiche sans erreur
- [ ] Les paramètres sont visibles
- [ ] Tester le bouton de déconnexion
- [ ] Pas d'erreurs dans la console

#### 3.5 Admin JSLAI
- [ ] L'onglet s'affiche sans erreur
- [ ] Le panneau de contrôle est visible
- [ ] Pas d'erreurs dans la console

#### 3.6 Seeking Alpha
- [ ] L'onglet s'affiche sans erreur
- [ ] Le contenu est visible
- [ ] Pas d'erreurs dans la console

#### 3.7 Stocks News
- [ ] L'onglet s'affiche sans erreur
- [ ] Les tickers sont listés (devrait afficher 25 tickers)
- [ ] Les actualités sont visibles
- [ ] Tester le bouton "Actualiser"
- [ ] Tester le changement de vue (Liste/Cartes/Tableau)
- [ ] Pas d'erreurs dans la console

#### 3.8 Emma En Direct
- [ ] L'onglet s'affiche sans erreur
- [ ] Le contenu est visible
- [ ] Pas d'erreurs dans la console

#### 3.9 TESTS JS
- [ ] L'onglet s'affiche sans erreur
- [ ] Le contenu est visible
- [ ] Pas d'erreurs dans la console

### 4. 🔍 Console du Navigateur

Ouvrir la console (F12) et vérifier :

#### Messages de Debug Attendus
- [ ] `🔧 [DEBUG] MODULAR DASHBOARD VERSION LOADED`
- [ ] `📦 [DEBUG] Loading script: /js/dashboard/...` (pour chaque module)
- [ ] `✅ [DEBUG] Script executed: ...` (pour chaque module)
- [ ] `✅ [DEBUG] All scripts loaded. BetaCombinedDashboard: function`
- [ ] `📢 [DEBUG] modules-loaded event fired`
- [ ] `✅ Rendering BetaCombinedDashboard...`
- [ ] `✅ Dashboard rendered successfully!`

#### Erreurs à Vérifier
- [ ] **Aucune erreur rouge** dans la console
- [ ] Pas d'erreurs `ReferenceError: X is not defined`
- [ ] Pas d'erreurs `TypeError: Cannot read property 'X' of undefined`
- [ ] Pas d'erreurs `useState is not defined`
- [ ] Pas d'erreurs `tickers is not defined`

#### Erreurs Normales (à ignorer)
- ⚠️ `cdn.tailwindcss.com should not be used in production` (normal pour développement)
- ⚠️ `You are using the in-browser Babel transformer` (normal pour version modulaire)
- ⚠️ `Failed to load resource: the server responded with a status of 500/503` (normal si services non configurés)

### 5. ⚙️ Fonctionnalités Principales

#### 5.1 Chargement des Données
- [ ] Les tickers se chargent (devrait afficher 25 tickers)
- [ ] Les données de stocks se chargent (peut prendre quelques secondes)
- [ ] Les actualités se chargent (peut prendre quelques secondes)
- [ ] Les messages de chargement s'affichent correctement

#### 5.2 Interactions
- [ ] Le bouton "Actualiser" dans Stocks News fonctionne
- [ ] Le changement de vue (Liste/Cartes/Tableau) fonctionne
- [ ] Le bouton de thème (☀️) change le thème dark/light
- [ ] Les filtres fonctionnent (si présents)

#### 5.3 Onglets Spécifiques
- [ ] **JLab™ → Portefeuille** : Affiche les titres en portefeuille
- [ ] **JLab™ → Watchlist** : Affiche la watchlist de Dan
- [ ] **JLab™ → 3pour1** : Charge l'application FinancePro
- [ ] **Markets & Economy** : Les widgets TradingView sont interactifs
- [ ] **Economic Calendar** : Le calendrier s'affiche
- [ ] **Yield Curve** : Le graphique s'affiche

### 6. 🐛 Vérification des Erreurs

#### Erreurs Critiques (doivent être corrigées)
- [ ] Aucune erreur `ReferenceError`
- [ ] Aucune erreur `TypeError`
- [ ] Aucune erreur `SyntaxError`
- [ ] Aucune erreur `Cannot read property`

#### Erreurs Non-Critiques (peuvent être ignorées)
- ⚠️ Erreurs API 500/503 (services non configurés)
- ⚠️ Avertissements Tailwind/Babel (normaux pour développement)
- ⚠️ Erreurs de réseau pour services externes non configurés

## Checklist de Validation

### ✅ Tests Automatisés
- [x] Tous les fichiers présents
- [x] Structure HTML correcte
- [x] Tous les modules présents et exposés
- [x] React correctement importé
- [x] Props correctement passées
- [x] Syntaxe valide

### ⏳ Tests Manuels (à compléter)
- [ ] Authentification fonctionne
- [ ] Interface visuelle identique
- [ ] Navigation entre onglets fonctionne
- [ ] Console sans erreurs critiques
- [ ] Fonctionnalités principales fonctionnent
- [ ] Onglets spécifiques fonctionnent

## Résultat Attendu

Si tous les tests passent, le dashboard modulaire est **fonctionnellement équivalent** à la version monolithique et peut être utilisé en production.

## Rapport de Test

Après avoir complété tous les tests, documenter les résultats dans `docs/RAPPORT_TEST_MANUEL.md` avec :
- Date du test
- Navigateur utilisé
- Résultats de chaque test
- Erreurs rencontrées (le cas échéant)
- Observations générales

