/**
 * Augmenter la largeur des emails pour les ordinateurs
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowFile = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowFile, 'utf-8'));

console.log('📏 Augmentation de la largeur des emails...\n');

// Trouver le nœud "Generate HTML Newsletter"
const generateHtmlNode = workflow.nodes.find(n => n.name === 'Generate HTML Newsletter');

if (!generateHtmlNode) {
  console.error('❌ Nœud "Generate HTML Newsletter" non trouvé');
  process.exit(1);
}

console.log('✅ Nœud "Generate HTML Newsletter" trouvé');

// Lire le code actuel
const currentCode = generateHtmlNode.parameters.jsCode;

// Largeur actuelle: 700px
// Nouvelle largeur: 900px (plus large pour les ordinateurs)
const oldWidth = '700px';
const newWidth = '900px';

// Remplacer toutes les occurrences de la largeur
let updatedCode = currentCode;

// Remplacer dans containerMaxWidth
updatedCode = updatedCode.replace(
  /containerMaxWidth:\s*['"]700px['"]/g,
  `containerMaxWidth: '${newWidth}'`
);

// Remplacer dans le CSS max-width
updatedCode = updatedCode.replace(
  /'      max-width: 700px;/g,
  `'      max-width: ${newWidth};`
);

// Vérifier si des remplacements ont été effectués
if (updatedCode === currentCode) {
  console.log('⚠️  Aucune modification nécessaire - la largeur est peut-être déjà à 900px');
  console.log('   Vérification de la largeur actuelle...');
  
  // Chercher la largeur actuelle
  const widthMatch = currentCode.match(/containerMaxWidth:\s*['"]([^'"]+)['"]/);
  if (widthMatch) {
    console.log(`   Largeur actuelle: ${widthMatch[1]}`);
    if (widthMatch[1] === newWidth) {
      console.log('   ✅ La largeur est déjà à ' + newWidth);
    } else {
      console.log(`   🔧 Modification de ${widthMatch[1]} vers ${newWidth}`);
      updatedCode = currentCode.replace(
        new RegExp(`containerMaxWidth:\\s*['"]${widthMatch[1]}['"]`, 'g'),
        `containerMaxWidth: '${newWidth}'`
      );
      updatedCode = updatedCode.replace(
        new RegExp(`'      max-width: ${widthMatch[1]};`, 'g'),
        `'      max-width: ${newWidth};`
      );
    }
  }
} else {
  console.log(`✅ Largeur modifiée de ${oldWidth} vers ${newWidth}`);
}

generateHtmlNode.parameters.jsCode = updatedCode;

// Sauvegarder
writeFileSync(workflowFile, JSON.stringify(workflow, null, 2));

console.log('\n✅ Workflow corrigé et sauvegardé !');
console.log('\n📋 Modifications apportées :');
console.log(`   ✅ Largeur du conteneur: ${oldWidth} → ${newWidth}`);
console.log('   ✅ Meilleure utilisation de l\'espace sur les écrans d\'ordinateur');
console.log('   ✅ Contenu plus lisible et aéré');

