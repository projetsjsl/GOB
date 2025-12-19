# Commande `//` - Script Test puis Push

Quand l'utilisateur écrit `//`, exécuter:
1. Scripts de test jusqu'à réussite (comme `/st`)
2. Puis push (comme `/p`)

Séquence complète:
1. Exécuter `scripts/test-batch-optimization.js` jusqu'à réussite
2. `git add . && git commit -m "Auto-commit" && git push`

