# 👁️ RÈGLE GLOBALE - Validation par Navigation

## Principe Fondamental (TOUS PROJETS CURSOR)

**Je suis les yeux de l'utilisateur** - Je dois TOUJOURS valider les modifications en naviguant vers les pages pour confirmer que les changements ont été effectués correctement.

**Cette règle s'applique à TOUS les projets Cursor, pas seulement au projet actuel.**

## 🔄 Workflow Obligatoire (Universel)

### Après TOUTE modification de code/fichiers (dans n'importe quel projet):

1. **✅ Modifier le code/fichier**
2. **✅ Naviguer vers la page concernée** (`browser_navigate`)
3. **✅ Prendre un snapshot** (`browser_snapshot`)
4. **✅ Vérifier visuellement** que les modifications sont présentes
5. **✅ Tester l'interaction** si nécessaire (`browser_click`, `browser_type`, etc.)
6. **✅ Confirmer le succès** avant de considérer la tâche terminée

## 📋 Checklist Universelle

Avant de déclarer une tâche terminée (dans n'importe quel projet):

- [ ] Code modifié
- [ ] Navigation vers la page effectuée
- [ ] Snapshot pris et vérifié
- [ ] Modifications visibles dans le snapshot
- [ ] Interactions testées (si applicable)
- [ ] Screenshot pris (si modification visuelle)
- [ ] Succès confirmé

## ⚠️ Règles Strictes (Tous Projets)

1. **JAMAIS** considérer une modification terminée sans validation visuelle
2. **TOUJOURS** naviguer vers la page après modification
3. **TOUJOURS** prendre un snapshot pour vérifier
4. **TOUJOURS** tester les interactions si des boutons/formulaires sont modifiés
5. **TOUJOURS** confirmer le succès avant de déclarer la tâche complète

## 🎯 Application Universelle

Cette règle s'applique à:
- ✅ Tous les projets web (React, Vue, Angular, etc.)
- ✅ Tous les projets avec interface utilisateur
- ✅ Toutes les modifications de frontend
- ✅ Toutes les modifications d'API visibles
- ✅ Toutes les modifications de style/CSS
- ✅ Tous les projets déployés (Vercel, Netlify, etc.)
- ✅ Tous les projets locaux (localhost)

## 💡 Notes Importantes

- **Déploiement**: Si les modifications sont déployées, attendre que le déploiement se termine
- **Cache**: Utiliser `?v=${Date.now()}` dans l'URL pour éviter le cache si nécessaire
- **Localhost**: Si test local, utiliser l'URL locale appropriée
- **Production**: Toujours vérifier sur l'URL de production si disponible

## 🚨 Erreurs Communes à Éviter (Tous Projets)

❌ **MAUVAIS**: Modifier le code et déclarer "terminé" sans vérification
✅ **BON**: Modifier le code, naviguer, vérifier, confirmer

❌ **MAUVAIS**: Supposer que les modifications fonctionnent
✅ **BON**: Toujours vérifier visuellement avec le navigateur

❌ **MAUVAIS**: Ignorer les erreurs visuelles dans le snapshot
✅ **BON**: Vérifier chaque détail dans le snapshot

## 📝 Résumé Global

**Je suis les yeux de l'utilisateur** - Je dois TOUJOURS valider visuellement toutes les modifications en naviguant vers les pages et en vérifiant que les changements sont présents et fonctionnent correctement.

**Cette règle s'applique à TOUS les projets Cursor, sans exception.**

