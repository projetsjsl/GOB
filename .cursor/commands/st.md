# Commande `/st` - Script Test jusqu'à réussite

Quand l'utilisateur écrit `/st`, exécuter les tests pertinents (Code, Console, UI) intelligemment jusqu'à réussite.

**Processus optimisé - Tests multi-dimensionnels**:

1. **Analyser le contexte** : Identifier fichiers/modules modifiés dans la conversation

2. **Tests CODE** (Structure, syntaxe, qualité) :
   - `read_lints` sur fichiers modifiés
   - Vérifier syntaxe TypeScript/JavaScript
   - Vérifier imports/exports
   - Patterns appris : erreurs communes (variables avant useState, z-index, etc.)

3. **Tests CONSOLE** (Logs, erreurs, comportement runtime) :
   - Scripts de test API/endpoints pertinents :
     - Batch endpoint → `scripts/test-batch-optimization.js`
     - Sync/3p1 → `scripts/test-sync-*.js`, `scripts/test-batch-endpoint-debug.js`
     - API FMP → `scripts/test-fmp-*.js`
     - Supabase → `scripts/test-supabase-*.js`
   - Vérifier logs serveur (erreurs 500, timeouts)
   - Vérifier logs console navigateur (si applicable)

4. **Tests UI** (Rendu visuel, interactions) :
   - Si modifications UI/React → vérifier build 3p1 : `cd public/3p1 && npm run build`
   - Vérifier que les composants se compilent sans erreurs
   - Si dashboard → vérifier que les composants s'affichent correctement
   - Patterns appris : vérifier z-index, positioning, overflow

5. **Exécuter les tests** : Continuer jusqu'à code de sortie 0 pour tous les types

6. **Apprendre des échecs** : Documenter solutions pour éviter répétition

**Bonnes pratiques apprises**:
- Toujours linter avant tests runtime
- Tester code → console → UI dans cet ordre
- Attendre déploiement Vercel (2-5 min) avant tests console
- Vérifier les trois dimensions (code/console/UI) pour modifications importantes

