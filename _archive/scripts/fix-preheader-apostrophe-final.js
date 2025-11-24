/**
 * Correction finale de l'apostrophe dans le preheader du tableau htmlParts
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowFile = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowFile, 'utf-8'));

console.log('🔧 Correction finale de l\'apostrophe dans le preheader...\n');

// Trouver le nœud "Generate HTML Newsletter"
const generateHtmlNode = workflow.nodes.find(n => n.name === 'Generate HTML Newsletter');

if (!generateHtmlNode) {
  console.error('❌ Nœud "Generate HTML Newsletter" non trouvé');
  process.exit(1);
}

console.log('✅ Nœud "Generate HTML Newsletter" trouvé');

// Lire le code actuel
let currentCode = generateHtmlNode.parameters.jsCode;

// Le problème: l'apostrophe dans "l'apercu" n'est pas échappée dans le tableau htmlParts
// Il faut soit échapper l'apostrophe, soit retirer le preheader du tableau

// 1. Retirer le preheader du tableau htmlParts initial (s'il y est encore)
// Pattern: '</body>'\n\n  '  <!-- Preheader text (invisible mais visible dans l'apercu) -->',
currentCode = currentCode.replace(
  /'<\/body>'\n\n  '  <!-- Preheader text \(invisible mais visible dans l'apercu\) -->',\n  '  <div[^']*<\/div>',\n,\n  '  <div class="container">'/g,
  "'</body>'"
);

// 2. Corriger l'apostrophe dans les push() du preheader (si elle existe)
// Remplacer l'apostrophe non échappée par une apostrophe échappée
currentCode = currentCode.replace(
  /htmlParts\.push\('  <!-- Preheader text \(invisible mais visible dans l'apercu\) -->'\);/g,
  "htmlParts.push('  <!-- Preheader text (invisible mais visible dans l\\'apercu) -->');"
);

// 3. S'assurer que le preheader est ajouté avec push() APRÈS la fermeture de htmlParts
const htmlPartsEnd = currentCode.indexOf('];');
if (htmlPartsEnd !== -1) {
  const afterHtmlParts = currentCode.substring(htmlPartsEnd + 2, htmlPartsEnd + 300);
  if (!afterHtmlParts.includes('// Ajouter le preheader')) {
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
  }
}

generateHtmlNode.parameters.jsCode = currentCode;

// Sauvegarder
writeFileSync(workflowFile, JSON.stringify(workflow, null, 2));

console.log('\n✅ Apostrophe corrigée dans le preheader !');
console.log('\n📋 Corrections apportées :');
console.log('   ✅ Preheader retiré du tableau htmlParts initial');
console.log('   ✅ Apostrophe correctement échappée: l\'apercu');
console.log('   ✅ Preheader ajouté avec push() après htmlParts');
console.log('   ✅ Syntaxe JavaScript valide');

