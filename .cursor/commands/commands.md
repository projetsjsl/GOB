# Commandes personnalisées

## `/p` - Push
Commande pour pousser les changements vers le dépôt Git.

**Action**: `git add . && git commit -m "Auto-commit" && git push`

## `/st` - Script Test jusqu'à réussite
Commande pour exécuter les scripts de test jusqu'à ce qu'ils réussissent.

**Action**: Exécuter `scripts/test-batch-optimization.js` ou autres scripts de test jusqu'à ce qu'ils retournent un code de sortie 0.

## `//` - Script Test puis Push
Commande pour exécuter les scripts de test jusqu'à réussite, puis pousser les changements.

**Action**: 
1. Exécuter les scripts de test jusqu'à réussite
2. `git add . && git commit -m "Auto-commit" && git push`

