# 👁️ Workflow de Validation par Navigation

## Principe Fondamental

**Je suis les yeux de l'utilisateur** - Je dois TOUJOURS valider les modifications en naviguant vers les pages pour confirmer que les changements ont été effectués correctement.

## 🔄 Workflow Obligatoire

### Après TOUTE modification de code/fichiers:

1. **✅ Modifier le code/fichier**
2. **✅ Naviguer vers la page concernée** (`browser_navigate`)
3. **✅ Prendre un snapshot** (`browser_snapshot`)
4. **✅ Vérifier visuellement** que les modifications sont présentes
5. **✅ Tester l'interaction** si nécessaire (`browser_click`, `browser_type`, etc.)
6. **✅ Confirmer le succès** avant de considérer la tâche terminée

### Cas d'Usage Spécifiques

#### Modification d'une Page HTML/Dashboard
```
1. Modifier le fichier HTML/JS
2. browser_navigate({ url: "https://app.vercel.app/page.html" })
3. browser_wait_for({ time: 3 }) // Attendre le chargement
4. browser_snapshot() // Vérifier visuellement
5. Confirmer que les changements sont visibles
```

#### Modification d'une API
```
1. Modifier le fichier API
2. browser_navigate({ url: "https://app.vercel.app/api/endpoint" })
3. browser_snapshot() // Vérifier la réponse
4. Tester avec browser_evaluate si nécessaire
```

#### Modification de Style/CSS
```
1. Modifier le CSS
2. browser_navigate({ url: "https://app.vercel.app/page" })
3. browser_wait_for({ time: 3 })
4. browser_take_screenshot() // Vérifier visuellement
5. browser_snapshot() // Vérifier les classes/styles
```

#### Ajout d'un Bouton/Élément
```
1. Ajouter l'élément dans le code
2. browser_navigate({ url: "https://app.vercel.app/page" })
3. browser_wait_for({ time: 3 })
4. browser_snapshot() // Trouver le nouvel élément
5. browser_click({ element: "Nouveau bouton", ref: "..." }) // Tester le clic
```

## ⚠️ Règles Strictes

1. **JAMAIS** considérer une modification terminée sans validation visuelle
2. **TOUJOURS** naviguer vers la page après modification
3. **TOUJOURS** prendre un snapshot pour vérifier
4. **TOUJOURS** tester les interactions si des boutons/formulaires sont modifiés
5. **TOUJOURS** confirmer le succès avant de déclarer la tâche complète

## 📋 Checklist de Validation

Avant de déclarer une tâche terminée:

- [ ] Code modifié
- [ ] Navigation vers la page effectuée
- [ ] Snapshot pris et vérifié
- [ ] Modifications visibles dans le snapshot
- [ ] Interactions testées (si applicable)
- [ ] Screenshot pris (si modification visuelle)
- [ ] Succès confirmé

## 🎯 Exemples Concrets

### Exemple 1: Ajout d'un bouton
```
1. Modifier HTML pour ajouter <button id="test-btn">Test</button>
2. browser_navigate({ url: "https://app.vercel.app/dashboard.html" })
3. browser_wait_for({ time: 3 })
4. browser_snapshot()
5. Vérifier que le bouton apparaît dans le snapshot avec ref="button#test-btn"
6. browser_click({ element: "Bouton Test", ref: "button#test-btn" })
7. Confirmer que le clic fonctionne
```

### Exemple 2: Modification de texte
```
1. Modifier le texte "Ancien texte" → "Nouveau texte"
2. browser_navigate({ url: "https://app.vercel.app/page.html" })
3. browser_wait_for({ time: 3 })
4. browser_snapshot()
5. Vérifier que "Nouveau texte" apparaît dans le snapshot
6. Confirmer le succès
```

### Exemple 3: Correction d'un bug
```
1. Corriger le bug dans le code
2. browser_navigate({ url: "https://app.vercel.app/page.html" })
3. browser_wait_for({ time: 3 })
4. browser_snapshot()
5. Vérifier que le bug n'apparaît plus
6. Tester le comportement qui causait le bug
7. Confirmer que tout fonctionne
```

## 💡 Notes Importantes

- **Déploiement**: Si les modifications sont sur Vercel, attendre quelques secondes après le push pour que le déploiement se termine
- **Cache**: Utiliser `?v=${Date.now()}` dans l'URL pour éviter le cache si nécessaire
- **Localhost**: Si test local, utiliser `http://localhost:PORT/page.html`
- **Production**: Toujours vérifier sur l'URL de production si disponible

## 🚨 Erreurs Communes à Éviter

❌ **MAUVAIS**: Modifier le code et déclarer "terminé" sans vérification
✅ **BON**: Modifier le code, naviguer, vérifier, confirmer

❌ **MAUVAIS**: Supposer que les modifications fonctionnent
✅ **BON**: Toujours vérifier visuellement avec le navigateur

❌ **MAUVAIS**: Ignorer les erreurs visuelles dans le snapshot
✅ **BON**: Vérifier chaque détail dans le snapshot

## 📝 Résumé

**Je suis les yeux de l'utilisateur** - Je dois TOUJOURS valider visuellement toutes les modifications en naviguant vers les pages et en vérifiant que les changements sont présents et fonctionnent correctement.

