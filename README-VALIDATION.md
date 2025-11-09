# 🔍 Validation Automatique du Workflow n8n

## Protection contre les erreurs courantes

Un script de validation automatique a été créé pour éviter les erreurs de syntaxe récurrentes dans le workflow n8n.

## Utilisation

### Validation manuelle
```bash
node validate-n8n-workflow.js
```

### Validation automatique avant import
Le script `import-workflow-header-black-white.js` exécute automatiquement la validation avant chaque import dans n8n.

## Erreurs détectées

Le script vérifie automatiquement :

1. **Erreurs de syntaxe courantes**
   - `cconst` au lieu de `const`
   - `onst` au lieu de `const`
   - Duplications de déclarations (`const htmlParts = [const htmlParts = [`)

2. **Ordre des déclarations**
   - `extractPreheaderText` doit être défini avant `preheaderText`
   - `preheaderText` doit être défini avant `htmlParts`
   - `htmlParts` doit être déclaré avant d'être utilisé

3. **Preheader dans le tableau**
   - Vérifie que le preheader n'est PAS dans le tableau `htmlParts`
   - Vérifie que l'apostrophe est correctement échappée (`l\'apercu`)

4. **Ajout du preheader**
   - Vérifie que le preheader est ajouté avec `push()` APRÈS la fermeture de `htmlParts`

5. **Virgules orphelines**
   - Détecte les doubles virgules (`,,`)

6. **Utilisation des variables**
   - Vérifie que les variables sont utilisées après leur déclaration

## Exemple de sortie

### ✅ Succès
```
🔍 Validation du workflow n8n...

1. Vérification des erreurs de syntaxe...
2. Vérification de l'ordre des déclarations...
3. Vérification du preheader dans le tableau...
4. Vérification de l'ajout du preheader...
5. Vérification des virgules orphelines...
6. Vérification de l'utilisation des variables...

============================================================
✅ Aucune erreur trouvée ! Le workflow est valide.
```

### ❌ Erreurs détectées
```
============================================================

❌ 2 erreur(s) trouvée(s):

   1. ❌ Preheader trouvé dans le tableau htmlParts (doit être ajouté avec push() après)
   2. ❌ Apostrophe non échappée dans le tableau htmlParts (l'apercu)

============================================================

❌ Le workflow contient des erreurs. Corrigez-les avant l'import.
```

## Intégration dans le workflow

Le script de validation est automatiquement exécuté avant chaque import dans n8n via `import-workflow-header-black-white.js`. Si des erreurs sont détectées, l'import est bloqué.

## Bonnes pratiques

1. **Toujours valider avant d'importer**
   ```bash
   node validate-n8n-workflow.js
   ```

2. **Vérifier les erreurs dans n8n**
   - Si une erreur apparaît dans n8n, exécutez la validation
   - Corrigez les erreurs détectées
   - Ré-exécutez la validation pour confirmer

3. **Structure recommandée**
   ```javascript
   // 1. Définir extractPreheaderText
   function extractPreheaderText(content) { ... }
   
   // 2. Définir preheaderText
   const preheaderText = extractPreheaderText(...);
   
   // 3. Déclarer htmlParts
   const htmlParts = [ ... ];
   
   // 4. Ajouter le preheader avec push() APRÈS htmlParts
   htmlParts.push('  <!-- Preheader text (invisible mais visible dans l\\'apercu) -->');
   ```

## Support

Si vous rencontrez des problèmes, vérifiez :
1. Que le fichier `n8n-workflow-03lgcA4e9uRTtli1.json` existe
2. Que le nœud "Generate HTML Newsletter" existe dans le workflow
3. Que le code JavaScript est valide

