# 📋 Guide: Configuration de .cursorrules pour Tous les Projets

## 🎯 Objectif

Ce guide vous explique comment appliquer la règle de validation par navigation dans **TOUS vos projets Cursor**.

## ✅ Ce qui a été fait

1. ✅ **Fichier `.cursorrules` créé** dans ce projet (GOB)
2. ✅ **Template `.cursorrules-template` créé** pour copier dans d'autres projets
3. ✅ **Documentation complète** dans `GLOBAL_WORKFLOW_VALIDATION.md`

## 📝 Comment appliquer dans d'autres projets

### Option 1: Copier le fichier (Recommandé)

```bash
# Depuis ce projet GOB
cp .cursorrules /chemin/vers/votre/autre/projet/.cursorrules
```

### Option 2: Créer manuellement

1. Ouvrir votre autre projet dans Cursor
2. Créer un fichier `.cursorrules` à la racine
3. Copier le contenu de `.cursorrules-template` ou `.cursorrules`

### Option 3: Utiliser le template

Le fichier `.cursorrules-template` est prêt à être copié dans n'importe quel projet.

## 🔍 Vérification

Pour vérifier que `.cursorrules` fonctionne dans un projet:

1. Ouvrir le projet dans Cursor
2. Faire une modification de code
3. Demander à Cursor de valider
4. Cursor devrait automatiquement naviguer vers la page et vérifier

## 📚 Fichiers créés

- **`.cursorrules`** - Règles actives pour ce projet
- **`.cursorrules-template`** - Template pour autres projets
- **`GLOBAL_WORKFLOW_VALIDATION.md`** - Documentation complète
- **`SETUP_CURSORRULES.md`** - Ce guide

## 💡 Astuce Pro

Pour appliquer rapidement dans plusieurs projets:

```bash
# Script pour copier .cursorrules dans tous vos projets
for project in /chemin/vers/projets/*/; do
  cp .cursorrules "$project/.cursorrules"
  echo "✅ Copié dans $project"
done
```

## 🎉 Résultat

Une fois `.cursorrules` présent dans un projet, Cursor appliquera automatiquement la règle de validation par navigation pour toutes les modifications.

