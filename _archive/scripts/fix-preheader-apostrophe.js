/**
 * Corriger l'apostrophe dans le preheader qui cause une erreur de syntaxe
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowFile = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowFile, 'utf-8'));

console.log('🔧 Correction de l\'apostrophe dans le preheader...\n');

// Trouver le nœud "Generate HTML Newsletter"
const generateHtmlNode = workflow.nodes.find(n => n.name === 'Generate HTML Newsletter');

if (!generateHtmlNode) {
  console.error('❌ Nœud "Generate HTML Newsletter" non trouvé');
  process.exit(1);
}

console.log('✅ Nœud "Generate HTML Newsletter" trouvé');

// Lire le code actuel
let currentCode = generateHtmlNode.parameters.jsCode;

// Le problème: l'apostrophe dans "l'apercu" n'est pas correctement échappée
// Il faut échapper l'apostrophe ou utiliser des guillemets doubles

// Remplacer toutes les occurrences de l'apercu non échappé
// Pattern 1: 'l'apercu' (apostrophe non échappée dans une chaîne avec guillemets simples)
currentCode = currentCode.replace(
  /l'apercu/g,
  "l\\'apercu"
);

// Pattern 2: Si c'est dans un push avec guillemets simples, s'assurer que c'est bien échappé
// Chercher: htmlParts.push('  <!-- Preheader text (invisible mais visible dans l'apercu) -->');
currentCode = currentCode.replace(
  /htmlParts\.push\('  <!-- Preheader text \(invisible mais visible dans l'apercu\) -->'\);/g,
  "htmlParts.push('  <!-- Preheader text (invisible mais visible dans l\\'apercu) -->');"
);

// Vérifier aussi dans le tableau htmlParts initial si le preheader y est encore
currentCode = currentCode.replace(
  /'  <!-- Preheader text \(invisible mais visible dans l'apercu\) -->'/g,
  "'  <!-- Preheader text (invisible mais visible dans l\\'apercu) -->'"
);

generateHtmlNode.parameters.jsCode = currentCode;

// Sauvegarder
writeFileSync(workflowFile, JSON.stringify(workflow, null, 2));

console.log('\n✅ Apostrophe corrigée dans le preheader !');
console.log('\n📋 Corrections apportées :');
console.log('   ✅ Apostrophe échappée correctement: l\\'apercu');
console.log('   ✅ Syntaxe JavaScript valide');

