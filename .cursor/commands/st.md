# Commande `/st` - Script Test jusqu'à réussite

Quand l'utilisateur écrit `/st`, exécuter les scripts de test pertinents selon le contexte de la conversation jusqu'à ce qu'ils réussissent.

**Processus**:
1. **Analyser le contexte** de la conversation pour identifier quel(s) script(s) de test sont pertinents
2. **Identifier les fichiers/modules modifiés** dans la conversation récente
3. **Sélectionner les scripts de test appropriés** :
   - Si travail sur batch endpoint → `scripts/test-batch-optimization.js`
   - Si travail sur sync → `scripts/test-sync-*.js`
   - Si travail sur API → scripts de test API correspondants
   - Sinon → scripts de test généraux
4. **Exécuter les tests** jusqu'à ce qu'ils retournent un code de sortie 0
5. **Corriger les erreurs** si nécessaire et réessayer

**Exemple** : Si la conversation portait sur le batch endpoint, tester `scripts/test-batch-optimization.js`

