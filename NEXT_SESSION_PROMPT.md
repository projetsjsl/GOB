# Prompt Développeur - Session Audit & Améliorations gobapps.com

## Contexte
Nous venons de corriger des problèmes critiques sur gobapps.com qui empêchaient le chargement des données en mode Onglets et Grille.

## Fixes Récents Déployés (Branch: claude/fix-gobapps-nlTje)

### 1. TradingView Widgets (23 widgets corrigés)
- **Problème**: Utilisation de `innerHTML` pour injecter les scripts TradingView → widgets blancs/noirs
- **Solution**: Migration vers `script.text` + `appendChild` selon la documentation officielle TradingView
- **Fichiers modifiés**:
  - `src/components/tabs/StocksNewsTab.tsx` (3 widgets)
  - `src/components/tabs/DansWatchlistTab.tsx` (1 widget)
  - `src/components/tabs/IntelliStocksTab.tsx` (2 widgets)
  - `src/components/tabs/InvestingCalendarTab.tsx` (13 widgets)
  - `src/components/tabs/MarketsEconomyTab.tsx` (5 widgets - commit précédent)

### 2. React Grid Layout
- **Problème**: CDN v1.4.4 incompatible avec React 19
- **Solution**: Migration vers npm v2.1.1 avec legacy API
- **Fichiers modifiés**:
  - `package.json` - ajout de `react-grid-layout@2.1.1`
  - `src/react-grid-layout-bridge.js` - nouveau fichier bridge
  - `public/js/react-grid-layout-bundle.js` - bundle généré
  - `public/beta-combined-dashboard.html` - utilisation du bundle local

### 3. Build Vercel
- **Problème**: `esbuild: command not found` lors du build
- **Solution**: Déplacement de `esbuild` de `devDependencies` → `dependencies`
- **Commit**: `8a51b11`

### 4. API Endpoints
- **Problème diagnostiqué**: Variables d'environnement nécessitent redéploiement Vercel
- **APIs concernées**:
  - FMP_API_KEY (50+ fichiers)
  - FRED_API_KEY (11 fichiers)
  - FINNHUB_API_KEY (10 fichiers)
  - GEMINI_API_KEY (traductions)

## État Actuel

### Git
- Branch principale: `main`
- Branch de travail: `claude/fix-gobapps-nlTje`
- Dernier commit: `c34ae90` - "chore: trigger deployment to activate API environment variables"
- Commits récents mergés via PR #212 et #213

### Déploiement
- ⚠️ **PENDING**: Redéploiement Vercel production nécessaire pour activer les API keys
- Preview deployment devrait être en cours sur la branch `claude/fix-gobapps-nlTje`

### Documentation
- `TRADINGVIEW_AUDIT_REPORT.md` - Audit complet des 23 widgets avec before/after

## Tâches pour la Prochaine Session

### PRIORITÉ 1: Validation du Déploiement
1. **Vérifier le statut du déploiement Vercel**
   - Confirmer que le preview deployment de `claude/fix-gobapps-nlTje` est complété
   - Tester le preview URL pour valider les fixes

2. **Redéployer production SI NÉCESSAIRE**
   - Option A: Vercel Dashboard → Redeploy (manuel)
   - Option B: Merger la branch vers main si preview OK
   - Option C: Trigger via commit vide

3. **Tests de validation production**
   - [ ] Vérifier que gobapps.com charge en mode Onglets
   - [ ] Vérifier que gobapps.com charge en mode Grille
   - [ ] Confirmer que les TradingView widgets s'affichent (tous les 23)
   - [ ] Vérifier que les données réelles s'affichent (pas d'erreurs API 429/403)
   - [ ] Tester les onglets principaux: Stocks News, Dans Watchlist, IntelliStocks, Investing Calendar, Markets Economy

### PRIORITÉ 2: Audit Post-Déploiement
1. **Analyser les logs Vercel**
   - Vérifier l'absence d'erreurs API
   - Confirmer que les API keys sont chargées
   - Identifier tout rate limiting résiduel

2. **Audit performance frontend**
   - Temps de chargement des widgets TradingView
   - Performance de React Grid Layout v2.1.1
   - Console browser pour erreurs JavaScript

3. **Audit coverage TradingView**
   - Confirmer que TOUS les widgets du site utilisent le bon pattern
   - Chercher d'autres fichiers potentiels avec innerHTML + TradingView
   - Vérifier les autres dashboards (jlab, 3p1, etc.)

### PRIORITÉ 3: Améliorations Identifiées

#### A. Optimisation API (Rate Limiting)
**Contexte**: Logs Vercel montraient 429 errors (FRED, Finnhub)
- [ ] Implémenter cache pour réduire appels API
- [ ] Ajouter retry logic avec exponential backoff
- [ ] Centraliser les appels API redondants (11+ appels FRED par page)

**Fichiers à examiner**:
- `src/components/tabs/*Tab.tsx` - identifier appels API multiples
- Créer un service centralisé de cache API

#### B. Nettoyage Technique
- [ ] Supprimer anciens fichiers CDN si non utilisés
- [ ] Optimiser bundle size de react-grid-layout-bundle.js (actuellement 62.9kb)
- [ ] Audit mémoire leaks - vérifier cleanup des widgets TradingView
- [ ] Review dependency array bugs (voir BetaCombinedDashboard.tsx:317)

#### C. Documentation & Tests
- [ ] Ajouter tests unitaires pour widgets TradingView
- [ ] Documenter le pattern correct dans CONTRIBUTING.md
- [ ] Créer linter rule pour bloquer innerHTML avec TradingView

#### D. Monitoring & Observabilité
- [ ] Implémenter error tracking (Sentry?)
- [ ] Ajouter métriques de performance
- [ ] Dashboard pour monitorer API rate limits

### PRIORITÉ 4: Validation Complète Site

**Audit systématique des pages**:
- [ ] `/` - Page d'accueil
- [ ] `/jlab` ou `/beta-combined-dashboard.html` - Dashboard principal
- [ ] `/3p1` - App 3P1
- [ ] Autres dashboards identifiés dans vercel.json redirects

## Instructions de Démarrage

```bash
# 1. Vérifier le statut git
git status
git log --oneline -5

# 2. Vérifier le déploiement Vercel
# Aller sur: https://vercel.com/projetsjsl/gob/deployments

# 3. Si preview OK, merger vers main
git checkout main
git pull origin main
git merge claude/fix-gobapps-nlTje
git push origin main

# 4. Tester production
# Ouvrir: https://gobapps.com
# Tester mode Onglets et Grille
```

## Questions à Poser à l'Utilisateur

1. **Le déploiement Vercel production a-t-il été effectué manuellement?**
   - Si oui, on peut passer directement aux tests de validation
   - Si non, on doit le déclencher

2. **Y a-t-il encore des problèmes visibles sur gobapps.com?**
   - Screenshots des erreurs actuelles
   - Console browser errors

3. **Quelles améliorations prioriser?**
   - Performance (cache API)
   - Robustesse (error handling)
   - Monitoring (observabilité)
   - Autre

## Références Techniques

### Documentation TradingView
- **Widget Best Practices**: Utiliser `script.text` jamais `innerHTML`
- **Pattern officiel**: Créer wrapper div → script → appendChild

### React Grid Layout v2.1.1
- **Breaking changes**: API moderne vs legacy
- **Notre implémentation**: Legacy API pour compatibilité backward

### Vercel Deployment
- **Environment Variables**: Chargées UNIQUEMENT au déploiement
- **Force Redeploy**: Nécessaire après ajout/modification de variables

### Stack Technique
- React 19.2.1
- Vite 7.2.2
- esbuild 0.27.2
- TradingView Widgets (CDN)
- React Grid Layout 2.1.1 (npm)

## Métriques de Succès

✅ **Déploiement validé si**:
- Aucune erreur dans console browser
- Tous les widgets TradingView affichent des données
- Mode Onglets et Grille fonctionnels
- APIs retournent des données (pas de 429/403)
- Temps de chargement < 3 secondes

✅ **Audit complet si**:
- Tous les fichiers .tsx audités pour innerHTML
- Performance mesurée et documentée
- Plan d'amélioration priorisé et validé

## Commit History Récent

```
c34ae90 chore: trigger deployment to activate API environment variables
a38a327 chore: trigger Vercel redeploy to activate environment variables
bbc37eb Merge pull request #213 from projetsjsl/claude/fix-gobapps-nlTje
8a51b11 fix: move esbuild to dependencies for Vercel build compatibility
c9b59fc Merge pull request #212 from projetsjsl/claude/fix-gobapps-nlTje
a3f58d4 feat: migrate React Grid Layout from CDN v1.4.4 to npm v2.1.1
2fd111c fix: resolve TradingView widget innerHTML violations (19 widgets)
67a6726 docs: add comprehensive TradingView innerHTML audit report
aa6dc50 fix: TradingView widgets not loading in RGL - remove innerHTML injection
```

---

**Résumé**: Commencer par valider le déploiement, auditer les résultats, puis procéder aux améliorations selon les priorités définies avec l'utilisateur.
