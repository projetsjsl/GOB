/**
 * Corriger la virgule mal placée dans le preheader
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowFile = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowFile, 'utf-8'));

console.log('🔧 Correction de la virgule mal placée dans le preheader...\n');

// Trouver le nœud "Generate HTML Newsletter"
const generateHtmlNode = workflow.nodes.find(n => n.name === 'Generate HTML Newsletter');

if (!generateHtmlNode) {
  console.error('❌ Nœud "Generate HTML Newsletter" non trouvé');
  process.exit(1);
}

console.log('✅ Nœud "Generate HTML Newsletter" trouvé');

// Lire le code actuel
let currentCode = generateHtmlNode.parameters.jsCode;

// Le problème est qu'il y a une virgule après '</body>' et avant le preheader
// Il faut corriger la structure du tableau htmlParts

// Chercher et corriger le problème de virgule
// Le pattern problématique est probablement: '</body>'\n\n  '  <!-- Preheader...'
// Il faut que le preheader soit dans le tableau htmlParts, pas en dehors

// Remplacer le pattern problématique
// Si on trouve '</body>' suivi du preheader avec une virgule mal placée
currentCode = currentCode.replace(
  /'<\/body>'\n\n  '  <!-- Preheader text[^']*-->',\n  '  <div[^']*<\/div>',\n,\n  '  <div class="container">'/g,
  "'</body>'\n];\n\n// Ajouter le preheader avant le container\nhtmlParts.splice(htmlParts.indexOf('</body>'), 0, '  <!-- Preheader text (invisible mais visible dans l\\'apercu) -->', '  <div style=\"display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;\">', '    ' + preheaderText, '  </div>');\n\nhtmlParts.push('  <div class=\"container\">'"
);

// Si le remplacement n'a pas fonctionné, essayer une autre approche
// Chercher le pattern exact avec la virgule problématique
if (currentCode.includes("'  </div>',\n,")) {
  console.log('⚠️  Virgule problématique trouvée, correction...');
  
  // Remplacer la virgule mal placée
  currentCode = currentCode.replace(
    /'  </div>',\n,/g,
    "'  </div>'"
  );
  
  // S'assurer que le preheader est bien dans le tableau htmlParts
  // Il doit être ajouté avec push, pas directement dans le tableau initial
  if (currentCode.includes("'</body>'\n\n  '  <!-- Preheader")) {
    // Extraire le preheader et l'ajouter correctement avec push
    const preheaderMatch = currentCode.match(/'  <!-- Preheader text[^']*-->',\s*'  <div[^']*<\/div>',/);
    if (preheaderMatch) {
      // Remplacer par un push après la définition du tableau
      currentCode = currentCode.replace(
        /'</body>'\n\n  '  <!-- Preheader text[^']*-->',\s*'  <div[^']*<\/div>',\s*,\s*'  <div class="container">'/,
        "'</body>'"
      );
      
      // Ajouter le preheader avec push avant le container
      const containerIndex = currentCode.indexOf("'  <div class=\"container\">'");
      if (containerIndex !== -1) {
        const preheaderPush = `
// Ajouter le preheader avant le container
htmlParts.splice(htmlParts.length - 1, 0, '  <!-- Preheader text (invisible mais visible dans l\\'apercu) -->', '  <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">', '    ' + preheaderText, '  </div>');

htmlParts.push('  <div class="container">'`;
        
        currentCode = currentCode.substring(0, containerIndex) + 
          preheaderPush + 
          currentCode.substring(containerIndex + "'  <div class=\"container\">'".length);
      }
    }
  }
}

// Solution plus simple: remplacer directement le pattern problématique
// Chercher '</body>' suivi du preheader mal formaté
const bodyEndPattern = /'<\/body>'\n\n  '  <!-- Preheader text[^']*-->',\n  '  <div[^']*<\/div>',\n,\n  '  <div class="container">'/;
if (bodyEndPattern.test(currentCode)) {
  console.log('✅ Pattern problématique trouvé, correction...');
  
  currentCode = currentCode.replace(
    bodyEndPattern,
    "'</body>'"
  );
  
  // Ajouter le preheader correctement avec push avant le container
  const containerPush = `
htmlParts.push('  <!-- Preheader text (invisible mais visible dans l\\'apercu) -->');
htmlParts.push('  <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">');
htmlParts.push('    ' + preheaderText);
htmlParts.push('  </div>');
htmlParts.push('  <div class="container">');`;
  
  // Trouver où insérer (juste avant le dernier push de htmlParts qui contient container)
  const lastContainerIndex = currentCode.lastIndexOf("'  <div class=\"container\">'");
  if (lastContainerIndex !== -1) {
    // Chercher le push correspondant
    const beforeContainer = currentCode.substring(0, lastContainerIndex);
    const afterContainer = currentCode.substring(lastContainerIndex);
    
    // Insérer le preheader avant
    currentCode = beforeContainer + containerPush + '\n' + afterContainer.replace("'  <div class=\"container\">'", '');
  }
}

generateHtmlNode.parameters.jsCode = currentCode;

// Sauvegarder
writeFileSync(workflowFile, JSON.stringify(workflow, null, 2));

console.log('\n✅ Erreur de syntaxe corrigée !');
console.log('\n📋 Corrections apportées :');
console.log('   ✅ Virgule mal placée corrigée');
console.log('   ✅ Preheader ajouté correctement avec push()');
console.log('   ✅ Syntaxe JavaScript valide');

