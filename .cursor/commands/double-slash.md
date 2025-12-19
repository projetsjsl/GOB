# Commande `//` - Script Test puis Push

Quand l'utilisateur écrit `//`, exécuter tests puis push de manière optimisée et contextuelle.

**Séquence complète optimisée**:
1. **Analyser le contexte** : Identifier fichiers/modules modifiés et scripts de test pertinents
2. **Vérifier les lints** : `read_lints` sur fichiers modifiés (évite push avec erreurs)
3. **Exécuter les tests pertinents** : Utiliser patterns appris (comme `/st`)
4. **Apprendre des résultats** : Si tests échouent, corriger et réessayer (max 3 tentatives)
5. **Créer message de commit contextuel** : Format `[Type]: [Description]` basé sur modifications
6. **Push** : `git add [fichiers] && git commit -m "[message]" && git push`

**Bonnes pratiques consolidées**:
- Toujours linter avant test
- Tester avant push (évite rollback)
- Messages de commit descriptifs mais concis
- Apprendre des patterns d'erreurs pour éviter répétition
- Ne push que si tests passent

**Exemple optimisé** :
- Batch endpoint modifié → Lint → Test `test-batch-optimization.js` → Commit "Fix: Batch endpoint key metrics" → Push

