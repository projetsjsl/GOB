/**
 * Script pour corriger l'utilisation de browser_click
 * 
 * Ce script montre comment utiliser correctement l'outil MCP browser_click
 * en suivant les bonnes pratiques.
 */

console.log('🔧 CORRECTION DE L\'UTILISATION DE browser_click\n');

console.log('📌 RÈGLES IMPORTANTES:\n');

console.log('1. TOUJOURS prendre un snapshot AVANT de cliquer');
console.log('   → Utiliser: browser_snapshot()');
console.log('   → Cela vous donne les refs actuelles de tous les éléments\n');

console.log('2. Les paramètres REQUIS pour browser_click:');
console.log('   → element: string (description lisible, ex: "Bouton de connexion")');
console.log('   → ref: string (référence exacte du snapshot, ex: "button#id.class")\n');

console.log('3. Les refs sont DYNAMIQUES');
console.log('   → Si la page change, prenez un nouveau snapshot');
console.log('   → Ne réutilisez pas d\'anciennes refs\n');

console.log('✅ WORKFLOW CORRECT:\n');
console.log('   Step 1: browser_navigate(url)');
console.log('   Step 2: browser_wait_for(time: 2) // Attendre le chargement');
console.log('   Step 3: browser_snapshot() // Obtenir les refs');
console.log('   Step 4: browser_click({ element: "...", ref: "..." }) // Cliquer\n');

console.log('❌ ERREURS À ÉVITER:\n');
console.log('   ❌ Cliquer sans snapshot préalable');
console.log('   ❌ Utiliser une ref qui n\'existe plus');
console.log('   ❌ Oublier le paramètre "element"');
console.log('   ❌ Oublier le paramètre "ref"');
console.log('   ❌ Utiliser une ref d\'un snapshot précédent sur une page différente\n');

console.log('💡 EXEMPLE PRATIQUE:\n');

const example = `
// ✅ BON - Workflow complet
1. browser_navigate({ url: "https://example.com" })
2. browser_wait_for({ time: 2 })
3. browser_snapshot() // Retourne: { nodes: [{ ref: "button#submit", name: "Submit" }] }
4. browser_click({ 
     element: "Bouton de soumission", 
     ref: "button#submit" 
   })

// ❌ MAUVAIS - Cliquer sans snapshot
1. browser_navigate({ url: "https://example.com" })
2. browser_click({ element: "Bouton", ref: "button#submit" }) // ❌ Ref peut être incorrecte!

// ❌ MAUVAIS - Paramètres manquants
browser_click({ ref: "button#submit" }) // ❌ Manque "element"
browser_click({ element: "Bouton" }) // ❌ Manque "ref"
`;

console.log(example);

console.log('\n🎯 SOLUTION IMMÉDIATE:\n');
console.log('Si browser_click a échoué, suivez ces étapes:\n');
console.log('1. Prenez un nouveau snapshot de la page');
console.log('2. Identifiez l\'élément que vous voulez cliquer dans le snapshot');
console.log('3. Utilisez la ref EXACTE du snapshot (copier-coller)');
console.log('4. Fournissez une description claire dans "element"');
console.log('5. Réessayez browser_click avec ces paramètres\n');

console.log('📚 RÉFÉRENCE RAPIDE:\n');
console.log('   browser_snapshot() → Retourne tous les éléments avec leurs refs');
console.log('   browser_click({ element, ref }) → Clique sur l\'élément spécifié');
console.log('   browser_wait_for({ time: n }) → Attend n secondes');
console.log('   browser_navigate({ url }) → Navigue vers une URL\n');

