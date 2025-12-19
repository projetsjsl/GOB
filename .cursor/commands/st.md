# Commande `/st` - Script Test jusqu'à réussite

Quand l'utilisateur écrit `/st`, exécuter les tests pertinents intelligemment jusqu'à réussite.

**Processus optimisé**:
1. **Analyser le contexte** : Identifier fichiers/modules modifiés dans la conversation
2. **Sélectionner les tests pertinents** (patterns appris) :
   - Batch endpoint → `scripts/test-batch-optimization.js`
   - Sync/3p1 → `scripts/test-sync-*.js`, `scripts/test-batch-endpoint-debug.js`
   - API FMP → `scripts/test-fmp-*.js`
   - Supabase → `scripts/test-supabase-*.js`
3. **Vérifier les erreurs communes** : Consulter `docs/REPERTOIRE_COMPLET_ERREURS.md` si erreurs
4. **Exécuter les tests** : Continuer jusqu'à code de sortie 0
5. **Apprendre des échecs** : Si erreur récurrente, documenter la solution pour futures exécutions

**Bonnes pratiques apprises**:
- Tester d'abord les endpoints critiques (batch, sync)
- Attendre quelques secondes après déploiement Vercel avant de tester
- Vérifier les logs serveur si erreurs 500
- Utiliser les scripts de test existants plutôt que créer de nouveaux

