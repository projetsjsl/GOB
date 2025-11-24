/**
 * Corriger définitivement le preheader - retirer du tableau et l'ajouter avec push
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowFile = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowFile, 'utf-8'));

console.log('🔧 Correction définitive du preheader...\n');

// Trouver le nœud "Generate HTML Newsletter"
const generateHtmlNode = workflow.nodes.find(n => n.name === 'Generate HTML Newsletter');

if (!generateHtmlNode) {
  console.error('❌ Nœud "Generate HTML Newsletter" non trouvé');
  process.exit(1);
}

console.log('✅ Nœud "Generate HTML Newsletter" trouvé');

// Lire le code actuel
let currentCode = generateHtmlNode.parameters.jsCode;

// Le problème: le preheader est dans le tableau htmlParts avec une virgule mal placée
// Solution: retirer le preheader du tableau initial et l'ajouter avec push() après la définition du tableau

// Chercher le pattern problématique: '</body>'\n\n  '  <!-- Preheader...' avec une virgule après
// Remplacer par '</body>' seulement, puis ajouter le preheader avec push

// Pattern à chercher: '</body>'\n\n suivi du preheader avec virgule
const problematicPattern = /'<\/body>'\n\n  '  <!-- Preheader text[^']*-->',\n  '  <div[^']*<\/div>',\n,\n  '  <div class="container">'/;

if (problematicPattern.test(currentCode)) {
  console.log('✅ Pattern problématique trouvé, correction...');
  
  // Remplacer par '</body>' seulement
  currentCode = currentCode.replace(
    problematicPattern,
    "'</body>'"
  );
  
  // Ajouter le preheader avec push() juste après la fermeture du tableau htmlParts
  // Chercher où se termine le tableau (juste avant les push conditionnels)
  const htmlPartsEnd = currentCode.indexOf("];\n\n// Ajouter les lignes conditionnelles");
  
  if (htmlPartsEnd !== -1) {
    const preheaderPush = `
// Ajouter le preheader avant le container
htmlParts.push('  <!-- Preheader text (invisible mais visible dans l\\'apercu) -->');
htmlParts.push('  <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">');
htmlParts.push('    ' + preheaderText);
htmlParts.push('  </div>');
htmlParts.push('  <div class="container">');`;
    
    // Insérer le preheader push juste après la fermeture du tableau
    currentCode = currentCode.substring(0, htmlPartsEnd + 2) + 
      preheaderPush + 
      currentCode.substring(htmlPartsEnd + 2);
    
    console.log('✅ Preheader ajouté avec push()');
  } else {
    // Si on ne trouve pas le pattern, chercher juste après ];
    const htmlPartsEndAlt = currentCode.indexOf("];");
    if (htmlPartsEndAlt !== -1) {
      // Chercher le prochain push ou commentaire
      const nextPush = currentCode.indexOf("htmlParts.push", htmlPartsEndAlt);
      if (nextPush !== -1) {
        const preheaderPush = `
// Ajouter le preheader avant le container
htmlParts.push('  <!-- Preheader text (invisible mais visible dans l\\'apercu) -->');
htmlParts.push('  <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">');
htmlParts.push('    ' + preheaderText);
htmlParts.push('  </div>');
htmlParts.push('  <div class="container">');`;
        
        currentCode = currentCode.substring(0, nextPush) + 
          preheaderPush + '\n' + 
          currentCode.substring(nextPush);
        
        console.log('✅ Preheader ajouté avec push() (méthode alternative)');
      }
    }
  }
} else {
  // Si le pattern n'est pas trouvé, vérifier s'il y a déjà un preheader mal formaté
  if (currentCode.includes("'  </div>',\n,")) {
    console.log('⚠️  Virgule problématique trouvée, correction...');
    
    // Retirer la virgule et le preheader du tableau
    currentCode = currentCode.replace(
      /'  <!-- Preheader text[^']*-->',\n  '  <div[^']*<\/div>',\n,/g,
      ''
    );
    
    // Ajouter le preheader avec push après la fermeture du tableau
    const htmlPartsEnd = currentCode.indexOf("];");
    if (htmlPartsEnd !== -1) {
      const preheaderPush = `
// Ajouter le preheader avant le container
htmlParts.push('  <!-- Preheader text (invisible mais visible dans l\\'apercu) -->');
htmlParts.push('  <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">');
htmlParts.push('    ' + preheaderText);
htmlParts.push('  </div>');
htmlParts.push('  <div class="container">');`;
      
      const nextLine = currentCode.indexOf('\n', htmlPartsEnd);
      currentCode = currentCode.substring(0, nextLine + 1) + 
        preheaderPush + '\n' + 
        currentCode.substring(nextLine + 1);
    }
  }
}

generateHtmlNode.parameters.jsCode = currentCode;

// Sauvegarder
writeFileSync(workflowFile, JSON.stringify(workflow, null, 2));

console.log('\n✅ Erreur de syntaxe corrigée !');
console.log('\n📋 Corrections apportées :');
console.log('   ✅ Preheader retiré du tableau htmlParts initial');
console.log('   ✅ Preheader ajouté avec push() après la fermeture du tableau');
console.log('   ✅ Syntaxe JavaScript valide');

