# 📋 Plan de Prompts pour Développement Complet - GOB Dashboard

**Date**: 11 janvier 2026  
**Objectif**: Guide structuré pour développeurs et autres personnages pour créer des spécifications complètes de Backend à Frontend

---

## 🎭 Personas et Rôles

### 1. **Architecte Technique** (Tech Lead)
- **Rôle**: Définit l'architecture globale, les patterns, les standards
- **Responsabilités**: Architecture système, choix technologiques, sécurité

### 2. **Développeur Backend** (API Developer)
- **Rôle**: Développe les APIs, la logique métier, les intégrations
- **Responsabilités**: Endpoints API, base de données, services externes

### 3. **Développeur Frontend** (UI/UX Developer)
- **Rôle**: Développe l'interface utilisateur, les composants React
- **Responsabilités**: Composants, état, performance, accessibilité

### 4. **DevOps Engineer**
- **Rôle**: Infrastructure, déploiement, CI/CD
- **Responsabilités**: Vercel, Supabase, monitoring, logs

### 5. **Product Manager** (PM)
- **Rôle**: Définit les fonctionnalités, priorités, roadmap
- **Responsabilités**: User stories, acceptance criteria, backlog

### 6. **QA/Testeur** (Quality Assurance)
- **Rôle**: Tests, validation, documentation des bugs
- **Responsabilités**: Tests E2E, régression, performance

### 7. **Designer UI/UX**
- **Rôle**: Design system, wireframes, prototypes
- **Responsabilités**: Design tokens, composants UI, expérience utilisateur

---

## 📐 Structure du Plan de Développement

### Phase 1: Analyse et Spécifications (Backend → Frontend)
### Phase 2: Architecture et Design
### Phase 3: Développement Backend
### Phase 4: Développement Frontend
### Phase 5: Intégration et Tests
### Phase 6: Déploiement et Monitoring

---

## 🔵 PHASE 1: ANALYSE ET SPÉCIFICATIONS

### Prompt pour Product Manager

```
En tant que Product Manager pour le GOB Dashboard, je dois créer des spécifications complètes pour [FONCTIONNALITÉ].

Contexte du projet:
- Dashboard financier avec React/TypeScript frontend
- API Node.js/Vercel avec Supabase comme base de données
- Intégrations: TradingView, Finnhub, FMP, Ground News
- Architecture: Monorepo avec séparation backend/frontend

Tâches:
1. Créer une User Story complète avec:
   - Persona utilisateur cible
   - Problème à résoudre
   - Solution proposée
   - Valeur business

2. Définir les Acceptance Criteria:
   - Critères fonctionnels (que doit faire la fonctionnalité)
   - Critères non-fonctionnels (performance, sécurité, UX)
   - Critères de succès mesurables

3. Identifier les dépendances:
   - APIs externes nécessaires
   - Données requises
   - Composants frontend existants à réutiliser
   - Modifications backend nécessaires

4. Créer un diagramme de flux utilisateur (texte/mermaid)

5. Définir les cas limites et edge cases

Format de sortie: Markdown avec sections structurées
```

### Prompt pour Architecte Technique

```
En tant qu'Architecte Technique pour le GOB Dashboard, je dois analyser la fonctionnalité [FONCTIONNALITÉ] et définir l'architecture technique.

Contexte technique actuel:
- Frontend: React 18, TypeScript, Vite, Tailwind CSS
- Backend: Node.js, Vercel Serverless Functions
- Database: Supabase (PostgreSQL)
- State Management: React hooks, Context API
- Build: Babel pour app-inline.js, Vite pour src/
- Déploiement: Vercel (automatic)

Tâches:
1. Analyser les besoins techniques de [FONCTIONNALITÉ]:
   - Quelles APIs doivent être créées/modifiées?
   - Quelles tables Supabase sont nécessaires?
   - Quels services externes doivent être intégrés?
   - Quels composants frontend doivent être créés?

2. Définir l'architecture de données:
   - Schéma de base de données (tables, relations, index)
   - Structure des données API (request/response)
   - Modèles TypeScript pour le frontend

3. Définir l'architecture API:
   - Endpoints nécessaires (GET, POST, PUT, DELETE)
   - Authentification/autorisation requise
   - Rate limiting et caching
   - Gestion d'erreurs

4. Définir l'architecture Frontend:
   - Structure des composants (atoms, molecules, organisms)
   - Gestion d'état (local, context, props)
   - Routing et navigation
   - Performance optimizations

5. Identifier les risques techniques et solutions:
   - Points de défaillance potentiels
   - Stratégies de fallback
   - Optimisations nécessaires

6. Créer un diagramme d'architecture (mermaid)

Format de sortie: Document technique avec diagrammes
```

---

## 🟢 PHASE 2: ARCHITECTURE ET DESIGN

### Prompt pour Designer UI/UX

```
En tant que Designer UI/UX pour le GOB Dashboard, je dois créer le design de [FONCTIONNALITÉ].

Contexte design actuel:
- Design System: GOBThemes avec dark/light mode
- Composants: Tailwind CSS + composants React custom
- Icônes: Iconoir (remplace Lucide)
- Couleurs: Système de thème avec variables CSS
- Typographie: Système de tailles cohérent
- Espacements: Scale Tailwind (4px base)

Tâches:
1. Analyser les besoins UX:
   - Parcours utilisateur complet
   - Points de friction potentiels
   - Opportunités d'amélioration UX

2. Créer les wireframes:
   - Layout desktop (1920px+)
   - Layout tablet (768px-1919px)
   - Layout mobile (<768px)
   - États: loading, empty, error, success

3. Définir les composants UI nécessaires:
   - Nouveaux composants à créer
   - Composants existants à réutiliser
   - Variantes et états de chaque composant

4. Spécifier le design system:
   - Couleurs utilisées (avec variables CSS)
   - Typographie (tailles, weights)
   - Espacements et grilles
   - Animations et transitions
   - États interactifs (hover, active, disabled)

5. Créer un prototype interactif (description textuelle ou Figma)

6. Définir les guidelines d'accessibilité:
   - Contraste des couleurs (WCAG AA)
   - Navigation au clavier
   - Screen readers
   - Focus states

Format de sortie: Design specs avec références au design system
```

### Prompt pour Architecte Technique (Design Technique)

```
En tant qu'Architecte Technique, je dois valider et affiner l'architecture technique pour [FONCTIONNALITÉ] basée sur les spécifications du PM et le design.

Tâches:
1. Valider la faisabilité technique:
   - Les APIs proposées sont-elles réalisables?
   - Les performances sont-elles acceptables?
   - Les intégrations externes sont-elles fiables?

2. Définir les contrats d'interface:
   - Types TypeScript pour toutes les interfaces
   - Schémas de validation (Zod/Yup si nécessaire)
   - Documentation OpenAPI/Swagger

3. Définir les patterns de code:
   - Structure des fichiers backend (api/[endpoint].js)
   - Structure des fichiers frontend (src/components/tabs/)
   - Naming conventions
   - Code organization

4. Définir les stratégies de performance:
   - Caching (Supabase cache, localStorage, sessionStorage)
   - Lazy loading (composants, données)
   - Pagination et virtualisation
   - Debouncing et throttling

5. Définir la gestion d'erreurs:
   - Types d'erreurs possibles
   - Messages d'erreur utilisateur
   - Logging et monitoring
   - Retry strategies

6. Créer la checklist technique:
   - Prérequis techniques
   - Dépendances à installer
   - Configurations nécessaires
   - Tests à écrire

Format de sortie: Document technique détaillé avec exemples de code
```

---

## 🔴 PHASE 3: DÉVELOPPEMENT BACKEND

### Prompt pour Développeur Backend

```
En tant que Développeur Backend pour le GOB Dashboard, je dois implémenter [FONCTIONNALITÉ] côté API.

Spécifications reçues:
- [Lien vers specs PM]
- [Lien vers architecture technique]
- [Lien vers design]

Contexte technique:
- Framework: Vercel Serverless Functions (api/[endpoint].js)
- Database: Supabase (PostgreSQL)
- Authentification: Supabase Auth + sessionStorage
- APIs externes: Finnhub, FMP, TradingView, Ground News
- Rate limiting: Implémenté via Supabase cache
- Error handling: Try/catch avec logging

Tâches:
1. Créer/mettre à jour les tables Supabase:
   - Migration SQL avec nom descriptif
   - Index pour performance
   - RLS (Row Level Security) policies
   - Documentation du schéma

2. Créer les endpoints API:
   - GET /api/[endpoint] - Récupération de données
   - POST /api/[endpoint] - Création/modification
   - Gestion des paramètres de requête
   - Validation des inputs
   - Gestion d'erreurs complète

3. Implémenter la logique métier:
   - Appels aux APIs externes avec retry
   - Traitement et transformation des données
   - Cache Supabase pour performance
   - Déduplication si nécessaire

4. Ajouter la sécurité:
   - Vérification d'authentification
   - Validation des permissions (RolesPermissions)
   - Sanitization des inputs
   - Rate limiting

5. Implémenter les tests:
   - Tests unitaires pour la logique
   - Tests d'intégration pour les APIs
   - Tests de performance (timeout, load)

6. Documenter l'API:
   - Commentaires JSDoc
   - Exemples de requêtes/réponses
   - Codes d'erreur possibles

Format de sortie: Code avec tests et documentation
```

### Checklist Backend

```markdown
- [ ] Migration Supabase créée et testée
- [ ] RLS policies configurées et testées
- [ ] Endpoint API créé dans api/[endpoint].js
- [ ] Validation des inputs implémentée
- [ ] Gestion d'erreurs complète (try/catch, logging)
- [ ] Authentification/autorisation vérifiée
- [ ] Cache Supabase implémenté si applicable
- [ ] Rate limiting configuré
- [ ] Tests unitaires écrits et passent
- [ ] Tests d'intégration écrits et passent
- [ ] Documentation API complète
- [ ] Performance validée (<2s response time)
- [ ] Code review effectué
```

---

## 🟡 PHASE 4: DÉVELOPPEMENT FRONTEND

### Prompt pour Développeur Frontend

```
En tant que Développeur Frontend pour le GOB Dashboard, je dois implémenter [FONCTIONNALITÉ] côté interface utilisateur.

Spécifications reçues:
- [Lien vers specs PM]
- [Lien vers architecture technique]
- [Lien vers design UI/UX]
- [Lien vers API documentation]

Contexte technique:
- Framework: React 18 avec TypeScript
- Build: Vite pour src/, Babel pour app-inline.js
- Styling: Tailwind CSS + design system GOBThemes
- State: React hooks (useState, useEffect, useMemo, useCallback)
- Icons: Iconoir (window.IconoirIcon)
- Performance: Lazy loading, pagination, memoization

Règles critiques (docs/REPERTOIRE_COMPLET_ERREURS.md):
- Variables définies AVANT useState si utilisées dans initializer
- Composants exposés globalement: window.ComponentName = ComponentName
- Références protégées: typeof variable !== 'undefined'
- Z-index: modals (10000+) > dropdowns (9999) > content (1-100)
- Pas de déclarations dupliquées
- useMemo pour calculs coûteux (filtrage, mapping)
- Dépendances useEffect optimisées (length au lieu d'array)

Tâches:
1. Créer la structure des composants:
   - Composant principal dans src/components/tabs/[TabName].tsx
   - Sous-composants si nécessaire
   - Types TypeScript dans src/types.ts
   - Props interface complète

2. Implémenter la logique de données:
   - Appels API avec fetchNews, fetchStockData, etc.
   - Gestion d'état (loading, error, data)
   - Cache local (sessionStorage/localStorage) si applicable
   - Auto-loading avec useEffect optimisé

3. Implémenter l'UI:
   - Suivre le design system GOBThemes
   - Dark/light mode support
   - Responsive design (mobile, tablet, desktop)
   - États: loading, empty, error, success
   - Animations et transitions

4. Optimiser les performances:
   - useMemo pour filtrage/calculs coûteux
   - useCallback pour fonctions passées en props
   - Pagination/lazy loading pour listes longues
   - Debouncing pour inputs de recherche
   - Intersection Observer pour infinite scroll

5. Gérer les erreurs:
   - Messages d'erreur utilisateur-friendly
   - Retry buttons
   - Fallbacks gracieux
   - Logging console pour debug

6. Ajouter l'accessibilité:
   - ARIA labels
   - Navigation clavier
   - Focus states
   - Contraste des couleurs

7. Synchroniser avec app-inline.js:
   - Si composant utilisé dans app-inline.js, s'assurer compatibilité
   - Exposer globalement si nécessaire: window.ComponentName

8. Tests:
   - Tests de rendu (si setup disponible)
   - Tests manuels de tous les cas d'usage
   - Tests de performance (pas de freeze)

Format de sortie: Code TypeScript/React avec commentaires
```

### Checklist Frontend

```markdown
- [ ] Composant créé dans src/components/tabs/[TabName].tsx
- [ ] Types TypeScript définis dans src/types.ts
- [ ] Props interface complète avec TabProps
- [ ] Appels API implémentés avec gestion d'erreurs
- [ ] États loading/error/empty/success gérés
- [ ] Design system GOBThemes utilisé
- [ ] Dark/light mode supporté
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] useMemo pour calculs coûteux
- [ ] useCallback pour fonctions en props
- [ ] Pagination/lazy loading si liste longue
- [ ] Dépendances useEffect optimisées (length, pas array)
- [ ] Composant exposé globalement si nécessaire
- [ ] Références protégées (typeof checks)
- [ ] Z-index correct (modals > dropdowns > content)
- [ ] Accessibilité (ARIA, keyboard, focus)
- [ ] Tests manuels effectués
- [ ] Pas de freeze détecté
- [ ] Code review effectué
```

---

## 🟣 PHASE 5: INTÉGRATION ET TESTS

### Prompt pour QA/Testeur

```
En tant que QA/Testeur pour le GOB Dashboard, je dois tester [FONCTIONNALITÉ] de manière exhaustive.

Spécifications:
- [Lien vers specs PM]
- [Lien vers API docs]
- [Lien vers design]

Environnements de test:
- Local: http://localhost:5173
- Staging: https://gobapps.com/beta-combined-dashboard.html
- Production: https://gobapps.com/beta-combined-dashboard.html

Tâches:
1. Tests fonctionnels:
   - Tous les cas d'usage définis dans les specs
   - Tous les edge cases identifiés
   - Tous les états (loading, empty, error, success)
   - Navigation entre onglets/sous-onglets

2. Tests de régression:
   - Vérifier que les fonctionnalités existantes fonctionnent toujours
   - Pas de régression visuelle
   - Pas de régression de performance

3. Tests de performance:
   - Temps de chargement initial (<3s)
   - Pas de freeze lors de la navigation
   - Pas de freeze lors du scroll
   - Performance avec grandes quantités de données (100+ items)

4. Tests de compatibilité:
   - Chrome/Edge (dernière version)
   - Firefox (dernière version)
   - Safari (dernière version)
   - Mobile (iOS Safari, Chrome Android)

5. Tests d'accessibilité:
   - Navigation clavier complète
   - Screen reader (si disponible)
   - Contraste des couleurs (outil de vérification)
   - Focus states visibles

6. Tests de sécurité:
   - Authentification requise si applicable
   - Permissions respectées
   - Pas de données sensibles exposées
   - Validation des inputs

7. Créer un rapport de test:
   - Résultats de tous les tests
   - Bugs trouvés avec reproduction steps
   - Screenshots/videos si nécessaire
   - Recommandations d'amélioration

Format de sortie: Rapport de test structuré
```

### Checklist QA

```markdown
- [ ] Tous les cas d'usage testés et passent
- [ ] Edge cases testés
- [ ] Tests de régression effectués (pas de régression)
- [ ] Performance validée (pas de freeze, <3s load)
- [ ] Compatibilité navigateurs vérifiée
- [ ] Accessibilité validée
- [ ] Sécurité vérifiée
- [ ] Rapport de test créé
- [ ] Bugs documentés avec reproduction steps
```

---

## 🔵 PHASE 6: DÉPLOIEMENT ET MONITORING

### Prompt pour DevOps Engineer

```
En tant que DevOps Engineer pour le GOB Dashboard, je dois déployer [FONCTIONNALITÉ] et configurer le monitoring.

Contexte déploiement:
- Platform: Vercel (automatic deployment from main branch)
- Database: Supabase (migrations manuelles)
- Monitoring: Vercel Analytics + console logs
- CI/CD: Git push → Vercel build → Deploy

Tâches:
1. Préparer le déploiement:
   - Vérifier que toutes les migrations Supabase sont prêtes
   - Vérifier les variables d'environnement nécessaires
   - Vérifier que le build passe localement (npm run build)

2. Déployer les migrations Supabase:
   - Appliquer les migrations dans l'ordre
   - Vérifier que les RLS policies sont actives
   - Tester les requêtes après migration

3. Déployer le code:
   - Push vers main branch (déclenche Vercel)
   - Surveiller le build Vercel
   - Vérifier que le déploiement réussit

4. Configurer le monitoring:
   - Vérifier les logs Vercel
   - Configurer les alertes si nécessaire
   - Documenter les métriques à surveiller

5. Tests post-déploiement:
   - Vérifier que la fonctionnalité fonctionne en production
   - Vérifier les performances
   - Vérifier qu'il n'y a pas d'erreurs dans les logs

6. Documentation:
   - Documenter les changements de déploiement
   - Mettre à jour les runbooks si nécessaire
   - Communiquer les changements à l'équipe

Format de sortie: Checklist de déploiement avec résultats
```

### Checklist DevOps

```markdown
- [ ] Migrations Supabase préparées et testées
- [ ] Variables d'environnement vérifiées
- [ ] Build local réussi (npm run build)
- [ ] Migrations Supabase appliquées en production
- [ ] Code pushé vers main (déclenche Vercel)
- [ ] Build Vercel réussi
- [ ] Déploiement Vercel réussi
- [ ] Tests post-déploiement effectués
- [ ] Monitoring configuré
- [ ] Documentation mise à jour
```

---

## 📝 TEMPLATE DE SPÉCIFICATION COMPLÈTE

### Structure Standard pour Toute Fonctionnalité

```markdown
# [NOM DE LA FONCTIONNALITÉ]

## 1. Vue d'ensemble
- **Objectif**: [Pourquoi cette fonctionnalité existe]
- **Persona cible**: [Qui l'utilisera]
- **Valeur business**: [Quel problème résout-elle]

## 2. User Story
**En tant que** [persona],  
**Je veux** [action],  
**Afin de** [bénéfice].

## 3. Acceptance Criteria
### Fonctionnels
- [ ] Critère 1
- [ ] Critère 2

### Non-fonctionnels
- [ ] Performance: <2s load time
- [ ] Sécurité: Authentification requise
- [ ] UX: Responsive design

## 4. Architecture Technique

### Backend
- **APIs nécessaires**: 
  - GET /api/[endpoint]
  - POST /api/[endpoint]
- **Database**: 
  - Tables: [liste]
  - Relations: [schéma]
- **Services externes**: [liste]

### Frontend
- **Composants**: 
  - [TabName].tsx (principal)
  - [SubComponent].tsx (sous-composants)
- **State management**: [useState, Context, etc.]
- **APIs utilisées**: [liste]

## 5. Design
- **Wireframes**: [lien ou description]
- **Design system**: [références]
- **Responsive**: [breakpoints]

## 6. Flow Utilisateur
1. [Étape 1]
2. [Étape 2]
3. [Étape 3]

## 7. Cas Limites
- [Cas limite 1]
- [Cas limite 2]

## 8. Tests
- [Test 1]
- [Test 2]

## 9. Déploiement
- [Étape déploiement 1]
- [Étape déploiement 2]
```

---

## 🎯 WORKFLOW RECOMMANDÉ

### Ordre d'exécution des prompts:

1. **Product Manager** → Crée les specs initiales
2. **Architecte Technique** → Valide et définit l'architecture
3. **Designer UI/UX** → Crée le design
4. **Architecte Technique** → Affine l'architecture basée sur le design
5. **Développeur Backend** → Implémente les APIs
6. **Développeur Frontend** → Implémente l'UI
7. **QA/Testeur** → Teste exhaustivement
8. **DevOps** → Déploie et configure le monitoring

### Points de synchronisation:

- **Après Phase 1**: Review des specs par toute l'équipe
- **Après Phase 2**: Review de l'architecture et design
- **Après Phase 3**: Review du code backend
- **Après Phase 4**: Review du code frontend
- **Après Phase 5**: Review des tests et validation finale
- **Après Phase 6**: Post-mortem et documentation finale

---

## 📚 RESSOURCES DE RÉFÉRENCE

### Documentation Projet
- `docs/REPERTOIRE_COMPLET_ERREURS.md` - Erreurs communes à éviter
- `docs/ANTI-FREEZE-OPTIMIZATIONS.md` - Optimisations performance
- `docs/NAVIGATION_COMPLETE_3P1.md` - Système de navigation
- `docs/api/DOCUMENTATION_APIs.md` - Documentation APIs

### Standards de Code
- `.cursorrules` - Règles de développement
- `tsconfig.json` - Configuration TypeScript
- `src/types.ts` - Types partagés

### Architecture
- `src/components/BetaCombinedDashboard.tsx` - Dashboard principal
- `api/` - Endpoints API
- `supabase/migrations/` - Migrations base de données

---

## ✅ CHECKLIST GLOBALE DE VALIDATION

Avant de considérer une fonctionnalité comme complète:

- [ ] Specs PM complètes et approuvées
- [ ] Architecture technique validée
- [ ] Design UI/UX approuvé
- [ ] Backend implémenté et testé
- [ ] Frontend implémenté et testé
- [ ] Tests QA passés
- [ ] Code review effectué
- [ ] Documentation mise à jour
- [ ] Déployé en production
- [ ] Monitoring configuré
- [ ] Post-mortem effectué

---

**Note**: Ce plan est un guide. Adaptez-le selon les besoins spécifiques de chaque fonctionnalité et les contraintes du projet.
