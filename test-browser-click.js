/**
 * Script de test pour l'utilisation correcte de browser_click via MCP
 * 
 * Ce script démontre la bonne utilisation de browser_click:
 * 1. Prendre un snapshot de la page d'abord
 * 2. Identifier l'élément à cliquer
 * 3. Utiliser browser_click avec les bons paramètres
 */

import { readFileSync } from 'fs';

console.log('🔍 Test de browser_click - Guide d\'utilisation correcte\n');

console.log('📋 ÉTAPES POUR UTILISER browser_click CORRECTEMENT:\n');

console.log('1️⃣  D\'ABORD: Prendre un snapshot de la page');
console.log('   → Utiliser: mcp_cursor-browser-extension_browser_snapshot');
console.log('   → Cela retourne une structure avec tous les éléments et leurs refs\n');

console.log('2️⃣  ENSUITE: Identifier l\'élément dans le snapshot');
console.log('   → Chercher l\'élément par son texte, type, ou description');
console.log('   → Noter la valeur "ref" de l\'élément\n');

console.log('3️⃣  ENFIN: Utiliser browser_click avec les paramètres corrects');
console.log('   → element: Description lisible de l\'élément (ex: "Bouton de connexion")');
console.log('   → ref: La référence exacte du snapshot (ex: "button#login-btn")\n');

console.log('❌ ERREURS COMMUNES:\n');
console.log('   ❌ Appeler browser_click sans snapshot préalable');
console.log('   ❌ Utiliser une ref incorrecte ou expirée');
console.log('   ❌ Oublier le paramètre "element" (requis)');
console.log('   ❌ Oublier le paramètre "ref" (requis)\n');

console.log('✅ EXEMPLE D\'UTILISATION CORRECTE:\n');

const exampleCode = `
// Étape 1: Prendre un snapshot
const snapshot = await mcp_cursor-browser-extension_browser_snapshot();

// Étape 2: Trouver l'élément dans le snapshot
// Le snapshot contient une structure avec tous les éléments
// Exemple de structure retournée:
// {
//   nodes: [
//     {
//       role: "button",
//       name: "Se connecter",
//       ref: "button#login-btn.login-button"
//     }
//   ]
// }

// Étape 3: Cliquer sur l'élément
await mcp_cursor-browser-extension_browser_click({
  element: "Bouton de connexion",  // Description lisible
  ref: "button#login-btn.login-button"  // Ref exacte du snapshot
});
`;

console.log(exampleCode);

console.log('\n🔧 SOLUTION POUR CORRIGER LE PROBLÈME:\n');
console.log('Si browser_click a échoué, vérifiez:\n');
console.log('1. ✅ Avez-vous pris un snapshot AVANT de cliquer?');
console.log('2. ✅ La ref utilisée correspond-elle exactement à celle du snapshot?');
console.log('3. ✅ L\'élément existe-t-il toujours sur la page?');
console.log('4. ✅ Les deux paramètres (element et ref) sont-ils fournis?\n');

console.log('💡 ASTUCE:');
console.log('   Si l\'élément a changé ou n\'existe plus,');
console.log('   prenez un nouveau snapshot et utilisez la nouvelle ref.\n');

console.log('📝 NOTE IMPORTANTE:');
console.log('   Les refs sont dynamiques et peuvent changer si la page se recharge');
console.log('   ou si le DOM est modifié. Toujours prendre un snapshot frais\n');

