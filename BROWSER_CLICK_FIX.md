# 🔧 CORRECTION: Utilisation de browser_click

## ❌ Problème
`browser_click` a échoué car il a été utilisé incorrectement.

## ✅ Solution

### Workflow CORRECT (4 étapes obligatoires):

```javascript
// 1️⃣ Naviguer vers la page
browser_navigate({ url: "https://example.com" })

// 2️⃣ Attendre le chargement
browser_wait_for({ time: 2 })

// 3️⃣ Prendre un snapshot (OBLIGATOIRE!)
const snapshot = browser_snapshot()
// Retourne: { nodes: [{ ref: "button#id", name: "Nom du bouton" }] }

// 4️⃣ Cliquer avec les paramètres corrects
browser_click({
  element: "Description lisible de l'élément",  // REQUIS
  ref: "button#id.class"  // REQUIS - Copier depuis le snapshot
})
```

## 📋 Paramètres REQUIS pour browser_click

| Paramètre | Type | Description | Exemple |
|-----------|------|-------------|---------|
| `element` | string | Description lisible de l'élément | "Bouton de connexion" |
| `ref` | string | Référence exacte du snapshot | "button#login-btn.login-button" |

## ❌ Erreurs communes

1. **Cliquer sans snapshot préalable**
   ```javascript
   // ❌ MAUVAIS
   browser_navigate({ url: "..." })
   browser_click({ element: "Bouton", ref: "button#id" }) // Ref peut être incorrecte!
   
   // ✅ BON
   browser_navigate({ url: "..." })
   browser_wait_for({ time: 2 })
   const snapshot = browser_snapshot() // OBLIGATOIRE!
   browser_click({ element: "Bouton", ref: snapshot.nodes[0].ref })
   ```

2. **Paramètres manquants**
   ```javascript
   // ❌ MAUVAIS - Manque "element"
   browser_click({ ref: "button#id" })
   
   // ❌ MAUVAIS - Manque "ref"
   browser_click({ element: "Bouton" })
   
   // ✅ BON - Les deux paramètres
   browser_click({ 
     element: "Bouton de connexion",
     ref: "button#login-btn"
   })
   ```

3. **Réutiliser une ref expirée**
   ```javascript
   // ❌ MAUVAIS - Ref d'un snapshot précédent
   const oldRef = "button#id" // D'un snapshot précédent
   browser_navigate({ url: "nouvelle-page.com" })
   browser_click({ element: "Bouton", ref: oldRef }) // ❌ Ref n'existe plus!
   
   // ✅ BON - Nouveau snapshot pour chaque page
   browser_navigate({ url: "nouvelle-page.com" })
   browser_wait_for({ time: 2 })
   const newSnapshot = browser_snapshot() // Nouveau snapshot!
   browser_click({ element: "Bouton", ref: newSnapshot.nodes[0].ref })
   ```

## 🎯 Solution immédiate

Si `browser_click` a échoué, suivez ces étapes:

1. ✅ Prenez un **nouveau snapshot** de la page actuelle
2. ✅ Identifiez l'élément dans le snapshot (cherchez par texte, type, etc.)
3. ✅ **Copiez la ref EXACTE** depuis le snapshot (ne l'inventez pas!)
4. ✅ Fournissez une **description claire** dans `element`
5. ✅ Réessayez `browser_click` avec ces paramètres

## 📚 Référence rapide

| Fonction | Usage | Retourne |
|----------|-------|----------|
| `browser_navigate({ url })` | Naviguer vers une URL | - |
| `browser_wait_for({ time: n })` | Attendre n secondes | - |
| `browser_snapshot()` | Obtenir tous les éléments | `{ nodes: [{ ref, name, role }] }` |
| `browser_click({ element, ref })` | Cliquer sur un élément | - |

## 💡 Exemple complet

```javascript
// Exemple: Cliquer sur un bouton de connexion

// 1. Naviguer
browser_navigate({ url: "https://example.com/login" })

// 2. Attendre
browser_wait_for({ time: 2 })

// 3. Snapshot (OBLIGATOIRE!)
const snapshot = browser_snapshot()
// Retourne quelque chose comme:
// {
//   nodes: [
//     { ref: "button#login-btn", name: "Se connecter", role: "button" },
//     { ref: "input#email", name: "Email", role: "textbox" },
//     ...
//   ]
// }

// 4. Trouver l'élément dans le snapshot
const loginButton = snapshot.nodes.find(node => 
  node.name === "Se connecter" || node.ref.includes("login-btn")
)

// 5. Cliquer avec la ref exacte
browser_click({
  element: "Bouton de connexion",
  ref: loginButton.ref  // Utiliser la ref du snapshot!
})
```

## ⚠️ Notes importantes

- **Les refs sont dynamiques**: Si la page change, prenez un nouveau snapshot
- **Toujours attendre**: Utilisez `browser_wait_for` après navigation
- **Snapshot obligatoire**: Ne jamais cliquer sans snapshot préalable
- **Refs exactes**: Copiez la ref depuis le snapshot, ne l'inventez pas

