# Commande `//` - Script Test puis Push

Quand l'utilisateur écrit `//`, exécuter tests multi-dimensionnels (Code/Console/UI) puis push de manière optimisée.

**Séquence complète optimisée**:

1. **Analyser le contexte** : Identifier fichiers/modules modifiés

2. **Tests CODE** :
   - `read_lints` sur fichiers modifiés
   - Vérifier syntaxe, imports, patterns communs
   - Corriger erreurs avant de continuer

3. **Tests CONSOLE** :
   - Scripts de test pertinents selon contexte
   - Vérifier logs serveur si erreurs
   - Continuer jusqu'à réussite

4. **Tests UI** (si modifications UI/React) :
   - Build 3p1 : `cd public/3p1 && npm run build`
   - Vérifier compilation sans erreurs
   - Si dashboard : vérifier composants

5. **Apprendre des résultats** : Si échecs, corriger et réessayer (max 3 tentatives)

6. **Créer message de commit contextuel** : Format `[Type]: [Description]` basé sur modifications

7. **Push** : `git add [fichiers] && git commit -m "[message]" && git push`

**Bonnes pratiques consolidées**:
- Ordre : Code → Console → UI → Push
- Ne push que si tous les tests passent
- Messages de commit descriptifs mais concis
- Apprendre des patterns d'erreurs pour éviter répétition

**Exemple optimisé** :
- Batch endpoint modifié → Lint (CODE) → Test API (CONSOLE) → Build 3p1 si UI (UI) → Commit "Fix: Batch endpoint key metrics" → Push

