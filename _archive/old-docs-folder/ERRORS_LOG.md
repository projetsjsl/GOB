# Journal des Erreurs - Dashboard GOB

Ce document répertorie toutes les erreurs rencontrées et corrigées au cours du développement, organisées par catégorie pour faciliter la maintenance et éviter les régressions.

## 📋 Table des Matières
1. [Erreurs de Référence Non Définies](#erreurs-de-référence-non-définies)
2. [Erreurs de Chargement/Montage React](#erreurs-de-chargementmontage-react)
3. [Erreurs de Thème](#erreurs-de-thème)
4. [Erreurs d'Intégration](#erreurs-dintégration)
5. [Erreurs d'Affichage/UI](#erreurs-daffichageui)
6. [Erreurs de Configuration](#erreurs-de-configuration)
7. [Erreurs de Performance](#erreurs-de-performance)

---

## 🔴 Erreurs de Référence Non Définies

### 1. `handleTickerClick is not defined`
**Symptôme** : Page complètement blanche lors du changement de thème (ex: Desjardins)
**Cause** : Fonction référencée dans `removeEventListener` mais jamais définie
**Fichier** : `public/js/dashboard/app-inline.js`
**Solution** : Suppression de la ligne `container.removeEventListener('click', handleTickerClick, true);`
**Impact** : Critique - Empêchait le rendu de toute la page

### 2. `cacheStatus is not defined`
**Symptôme** : Erreur lors de l'ouverture de l'onglet AdminJSLai
**Cause** : Variable utilisée dans le JSX mais non déclarée dans les états
**Fichier** : `public/js/dashboard/components/tabs/AdminJSLaiTab.js`
**Solution** : Ajout de `const [cacheStatus, setCacheStatus] = React.useState({});`
**Impact** : Critique - Empêchait l'affichage de l'onglet

### 3. `loadingCacheStatus` déclaré en double
**Symptôme** : Erreur de syntaxe lors du chargement
**Cause** : Déclaration `useState` dupliquée (lignes 53 et 68)
**Fichier** : `public/js/dashboard/components/tabs/AdminJSLaiTab.js`
**Solution** : Suppression de la déclaration en double
**Impact** : Critique - Empêchait le chargement du composant

### 4. `addScrapingLog` déclaré en double
**Symptôme** : Erreur de linter "Cannot redeclare block-scoped variable"
**Cause** : Fonction déclarée deux fois (lignes 88 et 124)
**Fichier** : `public/js/dashboard/components/tabs/AdminJSLaiTab.js`
**Solution** : Fusion en une seule déclaration avec gestion des logs
**Impact** : Moyen - Empêchait la compilation

### 5. Variables non définies dans AdminJSLaiTab
**Symptôme** : Boucle infinie, erreurs de rendu
**Cause** : Références à des variables non passées en props ou non déclarées
**Variables concernées** :
- `tickers`, `stockData`, `newsData`, `lastUpdate`
- `seekingAlphaData`, `seekingAlphaStockData`
- `teamTickers`, `watchlistTickers`
- `showMessage`, `API_BASE_URL`
- `EmmaSmsPanel`, `Icon`
**Fichier** : `public/js/dashboard/components/tabs/AdminJSLaiTab.js`
**Solution** : Protection avec `typeof variable !== 'undefined'` ou valeurs par défaut
**Impact** : Critique - Causait des boucles infinies et des erreurs de rendu

### 6. `Icon is not defined`
**Symptôme** : Erreur dans AdminJSLaiTab lors de l'utilisation d'Icon
**Cause** : Composant `Icon` défini localement dans `app-inline.js` mais non exposé globalement
**Fichier** : `public/js/dashboard/app-inline.js`
**Solution** : Ajout de `window.Icon = Icon;` après la définition
**Impact** : Moyen - Empêchait l'affichage des icônes

### 7. `AdminJSLaiTab is not defined`
**Symptôme** : Erreur de chargement "AdminJSLaiTab is not defined"
**Cause** : Script non chargé dans `beta-combined-dashboard.html` ou composant non exposé globalement
**Fichier** : `public/beta-combined-dashboard.html`, `public/js/dashboard/components/tabs/AdminJSLaiTab.js`
**Solution** : 
- Ajout du script dans HTML : `<script type="text/babel" src="js/dashboard/components/tabs/AdminJSLaiTab.js"></script>`
- Exposition globale : `window.AdminJSLaiTab = AdminJSLaiTab;`
**Impact** : Critique - Empêchait l'ouverture de l'onglet

### 8. `PlusTab is not defined`
**Symptôme** : Erreur similaire à AdminJSLaiTab
**Cause** : Composant supprimé lors d'un refactoring
**Solution** : Création du fichier `public/js/dashboard/components/tabs/PlusTab.js` et ajout du script
**Impact** : Moyen - Empêchait l'affichage du menu Plus

---

## 🔴 Erreurs de Chargement/Montage React

### 9. Écran Noir - BetaCombinedDashboard non accessible
**Symptôme** : Page complètement noire, aucun rendu
**Cause** : `BetaCombinedDashboard` non accessible globalement après transformation Babel
**Fichier** : `public/js/dashboard/app-inline.js`
**Solution** : 
- Exposition explicite : `window.BetaCombinedDashboard = BetaCombinedDashboard;`
- Simplification de la logique de montage
- Ajout de styles de base pour `body` et `#root`
**Impact** : Critique - Empêchait tout rendu de l'application

### 10. AdminJSLaiTab ne s'ouvre plus après commit 4115e12
**Symptôme** : Onglet AdminJSLai ne fonctionne plus après l'ajout de la gestion TradingView
**Cause** : États et fonctions helper (`adminSelectedIndices`, `getAllIndices`, etc.) définis dans `app-inline.js` mais non transférés lors de la séparation du composant
**Fichier** : `public/js/dashboard/components/tabs/AdminJSLaiTab.js`
**Solution** : 
- Ajout de tous les `useState` nécessaires dans AdminJSLaiTab
- Ajout des fonctions helper (`getAllIndices`, `refreshAllStocks`, `fetchNews`)
- Ré-ajout de la section JSX TradingView
**Impact** : Critique - Empêchait l'utilisation de l'onglet

### 11. Boucle Infinie dans AdminJSLaiTab
**Symptôme** : Re-renders infinis, console saturée
**Cause** : Références à des variables non définies causant des re-renders en cascade
**Fichier** : `public/js/dashboard/components/tabs/AdminJSLaiTab.js`
**Solution** : Protection de toutes les références avec `typeof` checks et valeurs par défaut
**Impact** : Critique - Rendant l'application inutilisable

### 12. Composants non chargés correctement
**Symptôme** : Erreurs "Component is not defined"
**Cause** : Ordre de chargement des scripts ou composants non exposés globalement
**Solution** : 
- Vérification de l'ordre des scripts dans HTML
- Exposition globale de tous les composants : `window.ComponentName = ComponentName;`
- Utilisation de `React.createElement(window.ComponentName, {...})` avec vérification
**Impact** : Critique - Empêchait le rendu des composants

---

## 🎨 Erreurs de Thème

### 13. Aucun thème n'apparaît dans la liste
**Symptôme** : Liste de thèmes vide dans le sélecteur
**Cause** : 
- `window.GOBThemes` non chargé au moment de l'accès
- Ordre de définition incorrect dans `theme-system.js` (`allThemes` défini avant `defaultThemes` et `customThemes`)
- Mots-clés `export` dans un script chargé directement (pas un module ES6)
**Fichier** : `public/js/dashboard/theme-system.js`, `public/js/dashboard/components/ThemeSelector.js`
**Solution** : 
- Correction de l'ordre : `customThemes` → `defaultThemes` → `allThemes` → fonctions
- Suppression des `export`
- Exposition globale avant `initTheme`
- Fallback dans ThemeSelector si `window.GOBThemes` non disponible
**Impact** : Critique - Empêchait la sélection de thèmes

### 14. Thèmes par défaut manquants
**Symptôme** : Thèmes Terminal, IA, DarkMode, Light non affichés
**Cause** : Thèmes par défaut non séparés des thèmes personnalisés
**Fichier** : `public/js/dashboard/theme-system.js`
**Solution** : 
- Création de `defaultThemes` séparé avec `isDefault: true`
- Filtrage dans ThemeSelector pour afficher deux sections
**Impact** : Moyen - Empêchait l'accès aux thèmes par défaut

### 15. Toggle DarkMode/Light ne s'affiche pas
**Symptôme** : Pas de bouton toggle quand DarkMode ou Light est sélectionné
**Cause** : Logique de détection des thèmes dark/light manquante
**Fichier** : `public/js/dashboard/components/ThemeSelector.js`
**Solution** : 
- Ajout de `isDarkLightTheme` state
- Affichage conditionnel du toggle uniquement pour 'darkmode' ou 'light'
**Impact** : Moyen - UX dégradée

### 16. Page blanche lors du changement de thème (Desjardins)
**Symptôme** : Page complètement blanche après sélection d'un thème
**Cause** : Erreur `handleTickerClick is not defined` (voir erreur #1)
**Impact** : Critique - Empêchait l'utilisation des thèmes

### 17. Z-index modal thème insuffisant
**Symptôme** : Boutons visibles derrière la fenêtre de sélection de thème
**Cause** : `z-index` trop faible (z-50)
**Fichier** : `public/js/dashboard/components/ThemeSelector.js`, `public/css/themes.css`
**Solution** : 
- `z-index: 10000` pour overlay, `10001` pour contenu
- `position: fixed !important` dans CSS
- Classe `theme-selector-modal` avec styles forcés
**Impact** : Moyen - UX dégradée

---

## 🔗 Erreurs d'Intégration

### 18. Double export dans simulate.js
**Symptôme** : Erreur de syntaxe
**Cause** : `export default handler;` alors que `handler` est déjà exporté
**Fichier** : `api/groupchat/simulate.js`
**Solution** : Suppression de la ligne en double
**Impact** : Moyen - Empêchait le déploiement

### 19. Double export dans GroupChatTab.js
**Symptôme** : Erreur similaire
**Cause** : `export default GroupChatTab;` alors que le composant est exposé via `window.GroupChatTab`
**Fichier** : `public/js/dashboard/components/tabs/GroupChatTab.js`
**Solution** : Suppression de la ligne en double
**Impact** : Moyen - Empêchait le chargement

### 20. Conversion Next.js vers Vercel Functions
**Symptôme** : APIs non fonctionnelles
**Cause** : Routes Next.js (`route.ts`) non compatibles avec Vercel
**Fichiers** : `api/groupchat/*.js`
**Solution** : 
- Conversion de `NextResponse.json()` vers `res.json()`
- Adaptation de `ReadableStream` pour SSE
- Correction des imports et exports
**Impact** : Critique - Empêchait l'utilisation de GroupChat

---

## 🎨 Erreurs d'Affichage/UI

### 21. NewsTicker reste en avant-plan
**Symptôme** : Bandeau de nouvelles visible par-dessus les modals
**Cause** : `z-index` trop élevé (100)
**Fichier** : `public/js/dashboard/components/NewsTicker.js`
**Solution** : 
- Réduction à `z-index: 5`
- Ajout de `MutationObserver` pour détecter les modals ouvertes
- Masquage du ticker quand modal ouverte
**Impact** : Moyen - UX dégradée

### 22. Couleurs ne s'adaptent pas au thème
**Symptôme** : Couleurs bleues hardcodées restent identiques sur tout le site
**Cause** : Utilisation de classes Tailwind hardcodées au lieu de CSS variables
**Fichiers** : `public/js/dashboard/app-inline.js`, `public/js/dashboard/components/tabs/StocksNewsTab.js`
**Solution** : 
- Remplacement par `var(--theme-primary)`, `var(--theme-surface)`, etc.
- Fonctions helper `getThemeClasses()` et `getThemeStyles()`
**Impact** : Moyen - Cohérence visuelle dégradée

### 23. Polices incorrectes pour les thèmes
**Symptôme** : Polices non officielles pour Bloomberg, Desjardins, MarketQ
**Cause** : Polices génériques utilisées
**Fichier** : `public/js/dashboard/theme-system.js`
**Solution** : 
- Recherche des polices officielles/similaires
- `Courier New` pour Bloomberg Terminal
- `Arial` pour Desjardins
- `Roboto` pour MarketQ
- `Georgia` pour Bloomberg Nostalgie
**Impact** : Faible - Authenticité visuelle

### 24. Liens articles de nouvelles non cliquables
**Symptôme** : Impossible de cliquer sur les articles
**Cause** : `pointer-events: none` sur le conteneur
**Fichier** : `public/js/dashboard/components/NewsTicker.js`
**Solution** : Suppression de `pointer-events: none`
**Impact** : Moyen - Fonctionnalité manquante

---

## ⚙️ Erreurs de Configuration

### 25. Peer dependency conflicts npm
**Symptôme** : Build Vercel échoue avec ERESOLVE
**Cause** : Conflits de dépendances (zod, dotenv)
**Fichiers** : `.npmrc`, `vercel.json`
**Solution** : 
- Création de `.npmrc` avec `legacy-peer-deps=true`
- Modification de `installCommand` dans `vercel.json`
**Impact** : Critique - Empêchait le déploiement

### 26. TradingView indices invalides
**Symptôme** : Point d'exclamation au lieu des prix
**Cause** : Symboles TradingView invalides (ex: `FOREXCOM:SPXUSD`)
**Fichier** : `public/js/dashboard/app-inline.js`
**Solution** : 
- Correction des symboles (ex: `SP:SPX`)
- Liste exhaustive d'indices valides
- Section admin pour sélection
**Impact** : Moyen - Données manquantes

---

## ⚡ Erreurs de Performance

### 27. Babel deoptimise le code (>500KB)
**Symptôme** : Avertissement "[BABEL] Note: The code generator has deoptimised..."
**Cause** : Fichier `app-inline.js` trop volumineux
**Fichier** : `public/js/dashboard/app-inline.js`
**Solution** : 
- Séparation des composants dans des fichiers distincts
- Lazy loading des composants
- (À améliorer : code splitting)
**Impact** : Faible - Performance dégradée mais fonctionnel

---

## 📝 Leçons Apprises

### Patterns à Éviter
1. **Références non protégées** : Toujours vérifier avec `typeof` avant utilisation
2. **Déclarations en double** : Vérifier avant d'ajouter de nouveaux `useState` ou fonctions
3. **Exposition globale manquante** : Tous les composants chargés via `<script type="text/babel">` doivent être exposés via `window`
4. **Ordre de chargement** : S'assurer que les dépendances sont chargées avant utilisation
5. **Props non validées** : Toujours fournir des valeurs par défaut pour les props

### Patterns Recommandés
1. **Protection des variables** : `typeof variable !== 'undefined' ? variable : defaultValue`
2. **Exposition globale** : `window.ComponentName = ComponentName;` après définition
3. **Validation des props** : `prop = defaultValue` dans la signature de fonction
4. **Fonctions sécurisées** : `const safeFunction = typeof function === 'function' ? function : () => {};`
5. **Gestion d'erreurs** : Try-catch autour des opérations localStorage/JSON

### Points d'Attention
- **Commit 4115e12** : A causé la rupture d'AdminJSLaiTab - toujours vérifier les dépendances lors de la séparation de composants
- **Thèmes** : L'ordre de définition dans `theme-system.js` est critique
- **Z-index** : Toujours vérifier la hiérarchie des modals et overlays
- **Babel** : Les fichiers >500KB sont deoptimisés - préférer la séparation

---

## 🔄 Checklist de Vérification

Avant chaque commit, vérifier :
- [ ] Toutes les variables référencées sont définies ou protégées
- [ ] Aucune déclaration en double
- [ ] Tous les composants sont exposés globalement si chargés via script
- [ ] Les props ont des valeurs par défaut
- [ ] Les fonctions sont vérifiées avant appel
- [ ] Les z-index sont cohérents
- [ ] Les thèmes sont correctement définis et accessibles
- [ ] Aucune erreur de linter

---

**Dernière mise à jour** : 2025-12-03
**Nombre d'erreurs documentées** : 27

