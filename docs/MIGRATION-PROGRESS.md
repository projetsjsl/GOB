# 📋 Progression de la Migration Design System

**Date:** 2026-01-11  
**Statut:** 🟡 En cours

---

## ✅ Phase 1: Fondation (Terminée)

### Créé
- [x] `src/design-system/tokens.ts` - Source unique de vérité
- [x] `src/styles/main.css` - Point d'entrée CSS unifié
- [x] `src/styles/tokens.css` - Variables CSS
- [x] `src/styles/spacing.css` - Standardisation espacements
- [x] `src/styles/accessibility.css` - Accessibilité WCAG
- [x] `src/styles/components.css` - Styles composants globaux
- [x] `src/design-system/components/Button.tsx` - Composant Button
- [x] `src/design-system/components/Card.tsx` - Composant Card
- [x] `tailwind.config.ts` - Mis à jour avec tokens

### Tests
- [x] `src/design-system/__tests__/tokens.test.ts` - Tests tokens
- [x] `src/design-system/__tests__/components.test.tsx` - Tests composants
- [x] `src/design-system/__tests__/theme-adapter.test.ts` - Tests adapter
- [x] Vitest configuré avec @testing-library/react

---

## 🟡 Phase 2: Migration (En cours)

### Nettoyage CSS
- [x] `public/css/spacing-standardization.css` - Supprimé (migré)
- [x] `public/css/wcag-accessibility-fixes.css` - Supprimé (migré)
- [x] `public/css/themes.css` - Conservé (toujours utilisé)
- [x] `public/css/retirement-calculator-fix.css` - Conservé (spécifique)

### Migration Thèmes
- [ ] Migrer `theme-system.js` pour utiliser `tokens.ts`
- [ ] Créer `theme-adapter.ts` pour bridge (✅ créé)
- [ ] Mettre à jour `applyTheme` pour utiliser adapter

### Migration Styles Inline
- [ ] Identifier tous les styles inline (script créé)
- [ ] Remplacer par classes Tailwind dans composants clés
- [ ] Mettre à jour composants pour utiliser Button/Card

### Fichiers à Migrer
- [ ] `config/theme-colors.json` → Utiliser `tokens.ts`
- [ ] `lib/theme-colors.js` → Utiliser `tokens.ts`
- [ ] `public/js/dashboard/v0-bootstrap.js` → Utiliser `tokens.ts`

---

## 📊 Métriques

| Métrique | Avant | Actuel | Cible | Progression |
|----------|-------|--------|-------|-------------|
| Fichiers CSS | 22 | 7 | 5 | 68% |
| Sources couleurs | 4 | 2 | 1 | 50% |
| Styles inline | 2033 | 2033 | 0 | 0% |
| Tests | 0 | 3 | 10+ | 30% |

---

## 🎯 Prochaines Étapes

1. **Migrer theme-system.js** (Priorité Haute)
   - Utiliser `tokens.ts` comme fallback
   - Adapter via `theme-adapter.ts`

2. **Remplacer styles inline** (Priorité Moyenne)
   - Commencer par composants les plus utilisés
   - Utiliser classes Tailwind `gob-*` et `theme-*`

3. **Mettre à jour composants** (Priorité Moyenne)
   - Utiliser Button/Card du design system
   - Supprimer duplications

4. **Nettoyer code obsolète** (Priorité Basse)
   - Supprimer `config/theme-colors.json` après migration
   - Supprimer `lib/theme-colors.js` après migration
   - Supprimer tokens dupliqués dans `v0-bootstrap.js`

---

## 📝 Notes

- `themes.css` conservé pour compatibilité avec thèmes dynamiques
- Migration progressive pour éviter breaking changes
- Tests ajoutés pour garantir cohérence
