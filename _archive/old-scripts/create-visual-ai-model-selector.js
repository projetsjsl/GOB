/**
 * Script pour créer un sélecteur visuel avec un node Code clair
 * 
 * Puisque n8n ne supporte pas les menus déroulants dans Set,
 * on crée un node Code avec une variable très claire à modifier
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Création d\'un sélecteur visuel avec node Code...\n');

// Trouver le node actuel
const currentSelector = workflow.nodes.find(n => 
  n.name === '⚙️ Choose AI Model (Edit Here)' || 
  n.name === '⚙️ AI Model: emma ou gemini'
);

if (!currentSelector) {
  console.error('❌ Node sélecteur non trouvé');
  process.exit(1);
}

// Créer un node Code avec une interface très claire
const visualSelectorCode = {
  parameters: {
    jsCode: `// ═══════════════════════════════════════════════════════════
// 🤖 SÉLECTEUR DE MODÈLE IA - MODIFIEZ ICI ⚙️
// ═══════════════════════════════════════════════════════════
//
// 👇 MODIFIEZ LA VALEUR CI-DESSOUS 👇
//
const AI_MODEL = 'emma';
//
// Options disponibles:
//   - 'emma'    → Utilise Emma (Perplexity) via /api/chat
//   - 'gemini'  → Utilise Gemini directement
//
// ═══════════════════════════════════════════════════════════

const items = $input.all();

return items.map(item => ({
  json: {
    ...item.json,
    ai_model: AI_MODEL,
    _model_info: AI_MODEL === 'emma' 
      ? '🤖 Emma (Perplexity) - Recherche web en temps réel' 
      : '✨ Gemini Direct - Réponse rapide'
  }
}));`
  },
  id: currentSelector.id,
  name: '⚙️ AI Model Selector (Change AI_MODEL)',
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: currentSelector.position
};

// Remplacer le node
const index = workflow.nodes.findIndex(n => n.id === currentSelector.id);
workflow.nodes[index] = visualSelectorCode;

// Mettre à jour les connexions
if (workflow.connections['⚙️ Choose AI Model (Edit Here)']) {
  workflow.connections['⚙️ AI Model Selector (Change AI_MODEL)'] = workflow.connections['⚙️ Choose AI Model (Edit Here)'];
  delete workflow.connections['⚙️ Choose AI Model (Edit Here)'];
}

if (workflow.connections['⚙️ AI Model: emma ou gemini']) {
  workflow.connections['⚙️ AI Model Selector (Change AI_MODEL)'] = workflow.connections['⚙️ AI Model: emma ou gemini'];
  delete workflow.connections['⚙️ AI Model: emma ou gemini'];
}

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('✅ Sélecteur visuel créé !');
console.log('\n📋 Comment utiliser:');
console.log('   1. Ouvrez le node "⚙️ AI Model Selector (Change AI_MODEL)"');
console.log('   2. Dans le code, trouvez la ligne: const AI_MODEL = \'emma\';');
console.log('   3. Modifiez \'emma\' à \'gemini\' (ou vice versa)');
console.log('   4. Sauvegardez');
console.log('\n💡 Le code est très clair avec des commentaires et des emojis !');
console.log('   Vous verrez exactement où modifier la valeur.');

