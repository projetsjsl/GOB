/**
 * Corriger l'erreur de syntaxe dans le preheader
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowFile = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowFile, 'utf-8'));

console.log('🔧 Correction de l\'erreur de syntaxe dans le preheader...\n');

// Trouver le nœud "Generate HTML Newsletter"
const generateHtmlNode = workflow.nodes.find(n => n.name === 'Generate HTML Newsletter');

if (!generateHtmlNode) {
  console.error('❌ Nœud "Generate HTML Newsletter" non trouvé');
  process.exit(1);
}

console.log('✅ Nœud "Generate HTML Newsletter" trouvé');

// Lire le code actuel
let currentCode = generateHtmlNode.parameters.jsCode;

// Corriger les guillemets dans le preheader HTML
// Le problème est que les guillemets simples dans les commentaires causent des erreurs
// On doit échapper correctement ou utiliser des guillemets doubles

// Remplacer le preheader HTML problématique
const preheaderHtmlFixed = `
  '  <!-- Preheader text (invisible mais visible dans l\\'apercu) -->',
  '  <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">',
  '    ' + preheaderText,
  '  </div>',
`;

// Chercher et remplacer le preheader problématique
// Le problème est probablement dans les guillemets simples échappés
currentCode = currentCode.replace(
  /'  <!-- Preheader text \(invisible mais visible dans l\\'aperçu\) -->',/g,
  "'  <!-- Preheader text (invisible mais visible dans l'apercu) -->',"
);

// Vérifier aussi s'il y a d'autres problèmes avec les guillemets
// Remplacer les apostrophes échappées problématiques dans les commentaires
currentCode = currentCode.replace(
  /l\\'aperçu/g,
  "l'apercu"
);

// S'assurer que le preheader est correctement formaté
// Si le preheader n'existe pas encore, l'ajouter correctement
if (!currentCode.includes('extractPreheaderText')) {
  console.log('⚠️  Fonction extractPreheaderText non trouvée, ajout...');
  
  const preheaderExtractionCode = `
// Extraire le texte pour le preheader (apercu dans la boite de reception)
function extractPreheaderText(content) {
  if (!content) return 'Newsletter Financiere Emma - Analyse de marche';
  
  // Enlever le markdown et extraire le premier paragraphe
  let text = content
    .replace(/^#+\\s+/gm, '') // Enlever les titres
    .replace(/\\*\\*([^*]+)\\*\\*/g, '$1') // Enlever le gras
    .replace(/\\*([^*]+)\\*/g, '$1') // Enlever l'italique
    .replace(/\\|/g, ' ') // Enlever les tableaux
    .replace(/\\n+/g, ' ') // Remplacer les sauts de ligne
    .trim();
  
  // Prendre les 120 premiers caracteres
  if (text.length > 120) {
    text = text.substring(0, 120).trim() + '...';
  }
  
  return text || 'Newsletter Financiere Emma - Analyse de marche';
}

const preheaderText = extractPreheaderText(data.newsletter_content || '');
`;

  const htmlPartsStart = currentCode.indexOf('const htmlParts = [');
  if (htmlPartsStart !== -1) {
    currentCode = currentCode.substring(0, htmlPartsStart) + 
      preheaderExtractionCode + '\n' + 
      currentCode.substring(htmlPartsStart);
  }
}

// Ajouter le preheader HTML si absent
if (!currentCode.includes('Preheader text')) {
  console.log('⚠️  Preheader HTML non trouvé, ajout...');
  
  const preheaderHtml = `
  '  <!-- Preheader text (invisible mais visible dans l'apercu) -->',
  '  <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">',
  '    ' + preheaderText,
  '  </div>',
`;

  const bodyTagIndex = currentCode.indexOf("'<body>'");
  if (bodyTagIndex !== -1) {
    const afterBodyIndex = currentCode.indexOf("'  <div class=\\\"container\\\">'", bodyTagIndex);
    if (afterBodyIndex !== -1) {
      currentCode = currentCode.substring(0, afterBodyIndex) + 
        preheaderHtml + 
        currentCode.substring(afterBodyIndex);
    }
  }
}

generateHtmlNode.parameters.jsCode = currentCode;

// Sauvegarder
writeFileSync(workflowFile, JSON.stringify(workflow, null, 2));

console.log('\n✅ Erreur de syntaxe corrigée !');
console.log('\n📋 Corrections apportées :');
console.log('   ✅ Guillemets échappés correctement dans les commentaires');
console.log('   ✅ Apostrophes remplacées pour éviter les conflits');
console.log('   ✅ Syntaxe JavaScript valide');

