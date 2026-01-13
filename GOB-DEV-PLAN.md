# Plan de Prompts pour Développement Complet - GOB Dashboard

**Date**: 11 janvier 2026
**Objectif**: Guide structuré pour développeurs et autres personnages pour créer des spécifications complètes de Backend à Frontend

---

## Personas et Rôles

### 1. Architecte Technique (Tech Lead)
- **Rôle**: Définit l'architecture globale, les patterns, les standards
- **Responsabilités**: Architecture système, choix technologiques, sécurité

### 2. Développeur Backend (API Developer)
- **Rôle**: Développe les APIs, la logique métier, les intégrations
- **Responsabilités**: Endpoints API, base de données, services externes

### 3. Développeur Frontend (UI/UX Developer)
- **Rôle**: Développe l'interface utilisateur, les composants React
- **Responsabilités**: Composants, état, performance, accessibilité

### 4. DevOps Engineer
- **Rôle**: Infrastructure, déploiement, CI/CD
- **Responsabilités**: Vercel, Supabase, monitoring, logs

### 5. Product Manager (PM)
- **Rôle**: Définit les fonctionnalités, priorités, roadmap
- **Responsabilités**: User stories, acceptance criteria, backlog

### 6. QA/Testeur (Quality Assurance)
- **Rôle**: Tests, validation, documentation des bugs
- **Responsabilités**: Tests E2E, régression, performance

### 7. Designer UI/UX
- **Rôle**: Design system, wireframes, prototypes
- **Responsabilités**: Design tokens, composants UI, expérience utilisateur

---

## Structure du Plan de Développement

- Phase 1: Analyse et Spécifications (Backend → Frontend)
- Phase 2: Architecture et Design
- Phase 3: Développement Backend
- Phase 4: Développement Frontend
- Phase 5: Intégration et Tests
- Phase 6: Déploiement et Monitoring

---

## Contexte Technique

### Frontend
- React 18, TypeScript, Vite, Tailwind CSS
- Design System: GOBThemes avec dark/light mode
- Icônes: Iconoir
- Build: Babel pour app-inline.js, Vite pour src/

### Backend
- Node.js, Vercel Serverless Functions
- Database: Supabase (PostgreSQL)
- APIs externes: Finnhub, FMP, TradingView, Ground News

### Déploiement
- Platform: Vercel (automatic)
- CI/CD: Git push → Vercel build → Deploy

---

## Règles Critiques de Développement

1. Variables définies AVANT useState si utilisées dans initializer
2. Composants exposés globalement: window.ComponentName = ComponentName
3. Références protégées: typeof variable !== 'undefined'
4. Z-index: modals (10000+) > dropdowns (9999) > content (1-100)
5. Pas de déclarations dupliquées
6. useMemo pour calculs coûteux (filtrage, mapping)
7. Dépendances useEffect optimisées (length au lieu d'array)

---

## Documentation de Référence

- docs/REPERTOIRE_COMPLET_ERREURS.md - Erreurs communes à éviter
- docs/ANTI-FREEZE-OPTIMIZATIONS.md - Optimisations performance
- docs/NAVIGATION_COMPLETE_3P1.md - Système de navigation
- docs/api/DOCUMENTATION_APIs.md - Documentation APIs

---

## Checklist Globale de Validation

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
