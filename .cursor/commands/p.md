# Commande `/p` - Push

Quand l'utilisateur écrit `/p`, exécuter un push intelligent en tenant compte du contexte et des bonnes pratiques apprises.

**Processus optimisé**:
1. **Vérifier les linter errors** : `read_lints` sur les fichiers modifiés récemment
2. **Identifier les fichiers modifiés** : Analyser le contexte de conversation + `git status`
3. **Créer un message de commit contextuel** : 
   - Format: `[Type]: [Description concise]` (Fix/Feature/Docs/Refactor)
   - Basé sur les modifications discutées dans la conversation
   - Inclure les détails importants (ex: "Fix: Batch endpoint key metrics avec includeKeyMetrics param")
4. **Vérifier les erreurs communes** : Consulter `docs/REPERTOIRE_COMPLET_ERREURS.md` si applicable
5. **Push** : `git add [fichiers] && git commit -m "[message]" && git push`

**Bonnes pratiques apprises**:
- Toujours vérifier les lints avant push
- Messages de commit descriptifs mais concis
- Ne commit que les fichiers pertinents au contexte
- Éviter les commits génériques "Auto-commit"

