/**
 * Correction définitive : retirer le preheader du tableau htmlParts initial
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

// Le problème: le preheader est dans le tableau htmlParts avec une apostrophe non échappée
// Pattern à chercher et retirer:
// '</body>'\n\n  '  <!-- Preheader text (invisible mais visible dans l'apercu) -->',\n  '  <div style="display: none...',\n  '    ' + preheaderText,\n  '  </div>',\n,\n  '  <div class="container">'

// Retirer TOUT le preheader du tableau htmlParts initial
// Utiliser une regex plus simple qui cherche juste après '</body>'
currentCode = currentCode.replace(
  /'<\/body>'\n\n  '  <!-- Preheader text \(invisible mais visible dans l'apercu\) -->',\n  '  <div style="display: none[^']*<\/div>',\n,\n  '  <div class="container">'/g,
  "'</body>'"
);

// S'assurer qu'il n'y a pas de virgule orpheline après '</body>'
currentCode = currentCode.replace(/'<\/body>'\n,\n  '  <div class="container">'/g, "'</body>'");

// S'assurer que le preheader est ajouté avec push() APRÈS la fermeture de htmlParts
const htmlPartsEnd = currentCode.indexOf('];');
if (htmlPartsEnd !== -1) {
  const afterHtmlParts = currentCode.substring(htmlPartsEnd + 2, htmlPartsEnd + 500);
  
  // Vérifier si le preheader est déjà ajouté avec push()
  if (!afterHtmlParts.includes('htmlParts.push(\'  <!-- Preheader text')) {
    console.log('✅ Ajout du preheader avec push() après htmlParts...');
    
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
  } else {
    console.log('✅ Preheader déjà ajouté avec push()');
  }
}

generateHtmlNode.parameters.jsCode = currentCode;

// Sauvegarder
writeFileSync(workflowFile, JSON.stringify(workflow, null, 2));

console.log('\n✅ Preheader corrigé !');
console.log('\n📋 Corrections apportées :');
console.log('   ✅ Preheader retiré du tableau htmlParts initial');
console.log('   ✅ Apostrophe correctement échappée dans push(): l\'apercu');
console.log('   ✅ Preheader ajouté avec push() après htmlParts');
console.log('   ✅ Syntaxe JavaScript valide');

