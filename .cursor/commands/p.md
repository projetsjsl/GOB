# Commande `/p` - Push

Quand l'utilisateur écrit `/p`, exécuter un push en tenant compte du contexte de la conversation :

1. **Analyser les changements récents** dans la conversation pour créer un message de commit pertinent
2. **Identifier les fichiers modifiés** selon le contexte
3. **Créer un message de commit descriptif** basé sur les modifications discutées
4. Exécuter: `git add [fichiers pertinents] && git commit -m "[message basé sur le contexte]" && git push`

**Exemple** : Si la conversation portait sur la correction du batch endpoint, le message pourrait être "Fix: Correction du batch endpoint pour les key metrics"

