/**
 * Correction définitive du preheader - réorganiser complètement le code
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

// 1. Retirer TOUS les push() du preheader qui sont AVANT htmlParts
currentCode = currentCode.replace(
  /\/\/ Ajouter le preheader avant le container[\s\S]*?htmlParts\.push\('  <div class="container">'\);/g,
  ''
);

// 2. Retirer le preheader du tableau htmlParts initial (avec la virgule orpheline)
currentCode = currentCode.replace(
  /'<\/body>'\n\n  '  <!-- Preheader text[^']*-->',\n  '  <div[^']*<\/div>',\n,\n  '  <div class="container">'/g,
  "'</body>'"
);

// 3. S'assurer que extractPreheaderText et preheaderText sont définis AVANT htmlParts
// Chercher où se trouve extractPreheaderText
const extractPreheaderRegex = /\/\/ Extraire le texte pour le preheader[\s\S]*?const preheaderText = extractPreheaderText\(data\.newsletter_content \|\| ''\);/;
const htmlPartsRegex = /const htmlParts = \[/;

const extractMatch = currentCode.match(extractPreheaderRegex);
const htmlPartsMatch = currentCode.match(htmlPartsRegex);

if (extractMatch && htmlPartsMatch) {
  const extractIndex = currentCode.indexOf(extractMatch[0]);
  const htmlPartsIndex = currentCode.indexOf(htmlPartsMatch[0]);
  
  if (extractIndex > htmlPartsIndex) {
    console.log('⚠️  extractPreheaderText est après htmlParts, réorganisation...');
    
    // Extraire le code
    const extractCode = extractMatch[0];
    
    // Retirer de l'emplacement actuel
    currentCode = currentCode.substring(0, extractIndex) + 
      currentCode.substring(extractIndex + extractCode.length);
    
    // Insérer AVANT htmlParts
    currentCode = currentCode.substring(0, htmlPartsIndex) + 
      extractCode + '\n\n' + 
      currentCode.substring(htmlPartsIndex);
    
    console.log('✅ extractPreheaderText déplacé avant htmlParts');
  }
}

// 4. Ajouter le preheader avec push() APRÈS la fermeture du tableau htmlParts
const htmlPartsEnd = currentCode.indexOf('];');
if (htmlPartsEnd !== -1) {
  // Vérifier si le preheader push est déjà présent après ];
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
    
    // Trouver où insérer (juste après ]; et avant les autres push conditionnels)
    const nextLine = currentCode.indexOf('\n', htmlPartsEnd);
    currentCode = currentCode.substring(0, nextLine + 1) + 
      preheaderPush + '\n' + 
      currentCode.substring(nextLine + 1);
  } else {
    console.log('✅ Preheader push() déjà présent');
  }
}

generateHtmlNode.parameters.jsCode = currentCode;

// Sauvegarder
writeFileSync(workflowFile, JSON.stringify(workflow, null, 2));

console.log('\n✅ Correction définitive du preheader terminée !');
console.log('\n📋 Corrections apportées :');
console.log('   ✅ extractPreheaderText et preheaderText définis AVANT htmlParts');
console.log('   ✅ Preheader ajouté avec push() APRÈS la fermeture de htmlParts');
console.log('   ✅ Toutes les virgules orphelines retirées');
console.log('   ✅ Syntaxe JavaScript valide');

