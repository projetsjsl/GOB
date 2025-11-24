/**
 * Ajouter un preheader text pour améliorer l'aperçu dans la boîte de réception
 * Le preheader est un texte invisible qui apparaît dans l'aperçu des emails
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowFile = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowFile, 'utf-8'));

console.log('📧 Ajout du preheader text pour améliorer l\'aperçu email...\n');

// Trouver le nœud "Generate HTML Newsletter"
const generateHtmlNode = workflow.nodes.find(n => n.name === 'Generate HTML Newsletter');

if (!generateHtmlNode) {
  console.error('❌ Nœud "Generate HTML Newsletter" non trouvé');
  process.exit(1);
}

console.log('✅ Nœud "Generate HTML Newsletter" trouvé');

// Lire le code actuel
const currentCode = generateHtmlNode.parameters.jsCode;

// Extraire le début du contenu textuel pour le preheader
// On va créer une fonction pour extraire le texte du contenu markdown
const preheaderExtractionCode = `
// Extraire le texte pour le preheader (aperçu dans la boîte de réception)
function extractPreheaderText(content) {
  if (!content) return 'Newsletter Financière Emma - Analyse de marché';
  
  // Enlever le markdown et extraire le premier paragraphe
  let text = content
    .replace(/^#+\\s+/gm, '') // Enlever les titres
    .replace(/\\*\\*([^*]+)\\*\\*/g, '$1') // Enlever le gras
    .replace(/\\*([^*]+)\\*/g, '$1') // Enlever l'italique
    .replace(/\\|/g, ' ') // Enlever les tableaux
    .replace(/\\n+/g, ' ') // Remplacer les sauts de ligne
    .trim();
  
  // Prendre les 120 premiers caractères
  if (text.length > 120) {
    text = text.substring(0, 120).trim() + '...';
  }
  
  return text || 'Newsletter Financière Emma - Analyse de marché';
}

const preheaderText = extractPreheaderText(data.newsletter_content || '');
`;

// Trouver où insérer le preheader extraction (juste avant la construction du HTML)
const htmlPartsStart = currentCode.indexOf('const htmlParts = [');
if (htmlPartsStart === -1) {
  console.error('❌ Impossible de trouver où insérer le preheader');
  process.exit(1);
}

// Insérer le code d'extraction du preheader
let updatedCode = currentCode.substring(0, htmlPartsStart) + 
  preheaderExtractionCode + '\n' + 
  currentCode.substring(htmlPartsStart);

// Ajouter le preheader dans le HTML (juste après <body>)
// Le preheader doit être invisible mais lisible par les clients email
const preheaderHtml = `
  '  <!-- Preheader text (invisible mais visible dans l\\'aperçu) -->',
  '  <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">',
  '    ' + preheaderText,
  '  </div>',
`;

// Trouver où insérer le preheader dans le HTML (après <body>)
const bodyTagIndex = updatedCode.indexOf("'<body>'");
if (bodyTagIndex !== -1) {
  // Trouver la ligne suivante après <body>
  const afterBodyIndex = updatedCode.indexOf("'  <div class=\\\"container\\\">'", bodyTagIndex);
  if (afterBodyIndex !== -1) {
    updatedCode = updatedCode.substring(0, afterBodyIndex) + 
      preheaderHtml + 
      updatedCode.substring(afterBodyIndex);
    console.log('✅ Preheader HTML ajouté dans le body');
  } else {
    // Si on ne trouve pas, insérer juste après <body>
    const insertIndex = updatedCode.indexOf("'<body>'", bodyTagIndex) + "'<body>'".length;
    updatedCode = updatedCode.substring(0, insertIndex) + 
      '\n' + preheaderHtml + 
      updatedCode.substring(insertIndex);
    console.log('✅ Preheader HTML ajouté après <body>');
  }
} else {
  console.warn('⚠️  Impossible de trouver <body>, ajout du preheader à la fin');
  // Ajouter à la fin du body si on ne trouve pas
  const bodyEndIndex = updatedCode.lastIndexOf("'</body>'");
  if (bodyEndIndex !== -1) {
    updatedCode = updatedCode.substring(0, bodyEndIndex) + 
      preheaderHtml + '\n' + 
      updatedCode.substring(bodyEndIndex);
  }
}

generateHtmlNode.parameters.jsCode = updatedCode;

// Sauvegarder
writeFileSync(workflowFile, JSON.stringify(workflow, null, 2));

console.log('\n✅ Workflow corrigé et sauvegardé !');
console.log('\n📋 Modifications apportées :');
console.log('   ✅ Fonction extractPreheaderText ajoutée');
console.log('   ✅ Preheader text extrait du contenu de la newsletter');
console.log('   ✅ Preheader HTML invisible ajouté dans le body');
console.log('   ✅ L\'aperçu dans la boîte de réception affichera maintenant le début du contenu');
console.log('\n💡 Le preheader est un texte invisible qui apparaît dans l\'aperçu des emails');
console.log('   Il permet d\'afficher un résumé du contenu sans ouvrir l\'email');

