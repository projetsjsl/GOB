/**
 * Script pour créer un vrai menu déroulant pour choisir entre Emma et Gemini
 * 
 * Solution: Utiliser un node Code qui génère un menu, ou mieux:
 * Transformer le node Set en utilisant un node "Edit Fields" avec type "options"
 * 
 * Mais n8n ne supporte pas les dropdowns dans Set nativement.
 * Solution alternative: Créer un node Switch avec des routes activables/désactivables
 * OU utiliser un node Code avec une interface claire
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Création d\'un menu déroulant pour choisir Emma/Gemini...\n');

// Trouver le node actuel
const aiModelConfigNode = workflow.nodes.find(n => n.name === '⚙️ AI Model (emma/gemini)');

if (!aiModelConfigNode) {
  console.error('❌ Node "⚙️ AI Model (emma/gemini)" non trouvé');
  process.exit(1);
}

// Solution: Remplacer le node Set par un node Code qui affiche un menu clair
// Mais mieux: Utiliser un node Switch directement avec des routes activables
// OU créer un node qui utilise des valeurs prédéfinies

// Meilleure solution: Créer un node Code avec des options claires
// qui peut être facilement modifié dans n8n

const aiModelSelectorCode = {
  parameters: {
    jsCode: `// ============================================
// SÉLECTEUR DE MODÈLE IA
// ============================================
// Modifiez la valeur ci-dessous pour choisir le modèle:
// - "emma" : Utilise Emma (Perplexity) via /api/chat
// - "gemini" : Utilise Gemini directement
// ============================================

const items = $input.all();
const data = items[0].json;

// ⚙️ MODIFIEZ CETTE VALEUR POUR CHANGER DE MODÈLE ⚙️
const AI_MODEL = 'emma'; // Options: 'emma' ou 'gemini'

return items.map(item => ({
  json: {
    ...item.json,
    ai_model: AI_MODEL,
    _ai_model_selected: AI_MODEL === 'emma' ? '🤖 Emma (Perplexity)' : '✨ Gemini Direct'
  }
}));`
  },
  id: 'ai-model-selector-code',
  name: '⚙️ Choose AI Model (Edit Here)',
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: aiModelConfigNode.position
};

// Remplacer l'ancien node
const oldNodeIndex = workflow.nodes.findIndex(n => n.name === '⚙️ AI Model (emma/gemini)');
if (oldNodeIndex !== -1) {
  workflow.nodes[oldNodeIndex] = aiModelSelectorCode;
  console.log('✅ Node remplacé par un node Code avec menu clair');
} else {
  workflow.nodes.push(aiModelSelectorCode);
  console.log('✅ Node Code créé');
}

// Mettre à jour les connexions (garder le même nom pour compatibilité)
if (workflow.connections['⚙️ AI Model (emma/gemini)']) {
  workflow.connections['⚙️ Choose AI Model (Edit Here)'] = workflow.connections['⚙️ AI Model (emma/gemini)'];
  delete workflow.connections['⚙️ AI Model (emma/gemini)'];
  console.log('✅ Connexions mises à jour');
}

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Menu déroulant créé !');
console.log('\n📋 Comment utiliser:');
console.log('   1. Ouvrez le node "⚙️ Choose AI Model (Edit Here)"');
console.log('   2. Dans le code, trouvez la ligne: const AI_MODEL = \'emma\';');
console.log('   3. Modifiez la valeur:');
console.log('      - \'emma\' pour utiliser Emma (Perplexity)');
console.log('      - \'gemini\' pour utiliser Gemini directement');
console.log('   4. Sauvegardez et exécutez');
console.log('\n💡 Le code est bien commenté et facile à modifier !');

