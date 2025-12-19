# Commande `//` - Script Test puis Push

Quand l'utilisateur écrit `//`, exécuter les tests puis push, en tenant compte du contexte de la conversation.

**Séquence complète**:
1. **Analyser le contexte** pour identifier les scripts de test pertinents
2. **Exécuter les scripts de test** jusqu'à réussite (comme `/st` mais avec contexte)
3. **Créer un message de commit** basé sur les modifications discutées dans la conversation
4. **Push** avec le message de commit contextuel (comme `/p` mais avec contexte)

**Exemple** : 
- Si conversation sur correction batch endpoint → tester `scripts/test-batch-optimization.js`, puis commit "Fix: Correction batch endpoint..."
- Si conversation sur nouvelle feature → tester scripts pertinents, puis commit "Feature: Ajout de..."

