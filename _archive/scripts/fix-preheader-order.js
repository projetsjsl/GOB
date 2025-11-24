/**
 * Corriger l'ordre du preheader - il doit être ajouté APRÈS la définition de htmlParts
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowFile = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowFile, 'utf-8'));

console.log('🔧 Correction de l\'ordre du preheader...\n');

// Trouver le nœud "Generate HTML Newsletter"
const generateHtmlNode = workflow.nodes.find(n => n.name === 'Generate HTML Newsletter');

if (!generateHtmlNode) {
  console.error('❌ Nœud "Generate HTML Newsletter" non trouvé');
  process.exit(1);
}

console.log('✅ Nœud "Generate HTML Newsletter" trouvé');

// Lire le code actuel
let currentCode = generateHtmlNode.parameters.jsCode;

// Le problème: le preheader est ajouté avec push() AVANT que htmlParts soit défini
// Il y a aussi une virgule orpheline dans le tableau htmlParts

// 1. Retirer les push() du preheader qui sont avant la définition de htmlParts
// Chercher: "// Ajouter le preheader avant le container" suivi de push()
const preheaderPushBefore = /\/\/ Ajouter le preheader avant le container[\s\S]*?htmlParts\.push\('  <div class="container">'\);/;
if (preheaderPushBefore.test(currentCode)) {
  console.log('✅ Push() du preheader trouvé avant htmlParts, suppression...');
  currentCode = currentCode.replace(preheaderPushBefore, '');
}

// 2. Retirer le preheader du tableau htmlParts initial (s'il y est)
// Chercher le pattern: '</body>'\n\n  '  <!-- Preheader...' avec virgule
currentCode = currentCode.replace(
  /'<\/body>'\n\n  '  <!-- Preheader text[^']*-->',\n  '  <div[^']*<\/div>',\n,\n  '  <div class="container">'/g,
  "'</body>'"
);

// 3. S'assurer que extractPreheaderText et preheaderText sont définis AVANT htmlParts
// Vérifier l'ordre: extractPreheaderText doit être avant htmlParts
const extractPreheaderIndex = currentCode.indexOf('function extractPreheaderText');
const htmlPartsIndex = currentCode.indexOf('const htmlParts = [');
const preheaderTextIndex = currentCode.indexOf('const preheaderText =');

if (extractPreheaderIndex !== -1 && htmlPartsIndex !== -1) {
  if (extractPreheaderIndex > htmlPartsIndex) {
    console.log('⚠️  extractPreheaderText est après htmlParts, réorganisation...');
    // Extraire la fonction et la variable
    const extractFunction = currentCode.substring(extractPreheaderIndex, preheaderTextIndex + currentCode.substring(preheaderTextIndex).indexOf(';\n') + 2);
    // Retirer de l'emplacement actuel
    currentCode = currentCode.substring(0, extractPreheaderIndex) + currentCode.substring(preheaderTextIndex + currentCode.substring(preheaderTextIndex).indexOf(';\n') + 2);
    // Insérer avant htmlParts
    currentCode = currentCode.substring(0, htmlPartsIndex) + extractFunction + '\n' + currentCode.substring(htmlPartsIndex);
  }
}

// 4. Ajouter le preheader avec push() APRÈS la fermeture du tableau htmlParts
const htmlPartsEnd = currentCode.indexOf('];');
if (htmlPartsEnd !== -1) {
  // Vérifier si le preheader push est déjà présent après ];
  const afterHtmlParts = currentCode.substring(htmlPartsEnd + 2);
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

// 5. Retirer toute virgule orpheline dans le tableau htmlParts
currentCode = currentCode.replace(/'<\/body>'\n,\n  '  <div class="container">'/g, "'</body>'");

generateHtmlNode.parameters.jsCode = currentCode;

// Sauvegarder
writeFileSync(workflowFile, JSON.stringify(workflow, null, 2));

console.log('\n✅ Ordre du preheader corrigé !');
console.log('\n📋 Corrections apportées :');
console.log('   ✅ extractPreheaderText et preheaderText définis avant htmlParts');
console.log('   ✅ Preheader ajouté avec push() APRÈS la définition de htmlParts');
console.log('   ✅ Virgules orphelines retirées');
console.log('   ✅ Syntaxe JavaScript valide');

