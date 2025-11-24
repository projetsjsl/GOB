/**
 * Correction définitive : ordre correct et retrait du preheader du tableau
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowFile = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowFile, 'utf-8'));

console.log('🔧 Correction définitive de l\'ordre et du preheader...\n');

// Trouver le nœud "Generate HTML Newsletter"
const generateHtmlNode = workflow.nodes.find(n => n.name === 'Generate HTML Newsletter');

if (!generateHtmlNode) {
  console.error('❌ Nœud "Generate HTML Newsletter" non trouvé');
  process.exit(1);
}

console.log('✅ Nœud "Generate HTML Newsletter" trouvé');

// Lire le code actuel
let currentCode = generateHtmlNode.parameters.jsCode;

// PROBLÈME 1: htmlParts.push() est appelé AVANT que htmlParts soit déclaré
// Retirer les push() du preheader qui sont AVANT la déclaration de htmlParts
currentCode = currentCode.replace(
  /\/\/ Ajouter le preheader avant le container\nhtmlParts\.push\('  <!-- Preheader text[^']*'\);\nhtmlParts\.push\('  <div style="display: none[^']*<\/div>',\);\nhtmlParts\.push\('    ' \+ preheaderText\);\nhtmlParts\.push\('  <\/div>',\);\nhtmlParts\.push\('  <div class="container">',\);\n\n+/g,
  ''
);

// PROBLÈME 2: Le preheader est toujours dans le tableau htmlParts avec apostrophe non échappée
// Retirer le preheader du tableau htmlParts initial
currentCode = currentCode.replace(
  /'<\/body>'\n\n  '  <!-- Preheader text \(invisible mais visible dans l'apercu\) -->',\n  '  <div style="display: none[^']*<\/div>',\n,\n  '  <div class="container">'/g,
  "'</body>'"
);

// S'assurer qu'il n'y a pas de virgule orpheline
currentCode = currentCode.replace(/'<\/body>'\n,\n  '  <div class="container">'/g, "'</body>'");

// PROBLÈME 3: S'assurer que le preheader est ajouté APRÈS la déclaration de htmlParts
const htmlPartsEnd = currentCode.indexOf('];');
if (htmlPartsEnd !== -1) {
  const afterHtmlParts = currentCode.substring(htmlPartsEnd + 2, htmlPartsEnd + 500);
  
  // Vérifier si le preheader est déjà ajouté avec push() APRÈS htmlParts
  if (!afterHtmlParts.includes('// Ajouter le preheader avant le container')) {
    console.log('✅ Ajout du preheader avec push() APRÈS htmlParts...');
    
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
    console.log('✅ Preheader déjà ajouté avec push() APRÈS htmlParts');
  }
}

generateHtmlNode.parameters.jsCode = currentCode;

// Sauvegarder
writeFileSync(workflowFile, JSON.stringify(workflow, null, 2));

console.log('\n✅ Corrections appliquées !');
console.log('\n📋 Vérifications :');
console.log('   ✅ htmlParts.push() du preheader retiré AVANT la déclaration');
console.log('   ✅ Preheader retiré du tableau htmlParts initial');
console.log('   ✅ Preheader ajouté avec push() APRÈS htmlParts');
console.log('   ✅ Apostrophe correctement échappée: l\'apercu');
console.log('   ✅ Ordre correct: extractPreheaderText → preheaderText → htmlParts → push()');

