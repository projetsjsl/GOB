/**
 * Script pour remplacer le Switch par un node IF plus simple
 * 
 * Si le Switch continue de freezer, on remplace par un IF qui est plus stable
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Remplacement du Switch par un node IF...\n');

// Trouver le node Switch
const chooseAiModelSwitch = workflow.nodes.find(n => n.name === '🤖 Choose AI Model');

if (!chooseAiModelSwitch) {
  console.error('❌ Node Switch non trouvé');
  process.exit(1);
}

// Remplacer par un node IF
chooseAiModelSwitch.name = 'Choose AI Model (IF)';
chooseAiModelSwitch.type = 'n8n-nodes-base.if';
chooseAiModelSwitch.typeVersion = 2;

// Configuration IF simple
chooseAiModelSwitch.parameters = {
  conditions: {
    string: [
      {
        value1: "={{ $json.ai_model }}",
        operation: 'equals',
        value2: 'emma'
      }
    ]
  },
  options: {}
};

console.log('✅ Switch remplacé par un node IF');
console.log('   Condition: ai_model === "emma"');
console.log('   TRUE → Emma (Prepare API Request)');
console.log('   FALSE → Gemini (Call Gemini API)');

// Mettre à jour les connexions
// IF: TRUE (index 0) → Emma, FALSE (index 1) → Gemini
const prepareApiRequestNode = workflow.nodes.find(n => n.name === 'Prepare API Request');
const callGeminiNode = workflow.nodes.find(n => n.name === 'Call Gemini API');

if (prepareApiRequestNode && callGeminiNode) {
  workflow.connections['Choose AI Model (IF)'] = {
    main: [
      // TRUE (index 0) → Emma
      [
        {
          node: 'Prepare API Request',
          type: 'main',
          index: 0
        }
      ],
      // FALSE (index 1) → Gemini
      [
        {
          node: 'Call Gemini API',
          type: 'main',
          index: 0
        }
      ]
    ]
  };
  console.log('✅ Connexions mises à jour');
}

// Supprimer l'ancienne connexion du Switch
if (workflow.connections['🤖 Choose AI Model']) {
  delete workflow.connections['🤖 Choose AI Model'];
}

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Switch remplacé par IF !');
console.log('\n📋 Nouveau flux:');
console.log('   ⚙️ AI Model Selector');
console.log('   → 🔍 Debug Before Switch');
console.log('   → Choose AI Model (IF)');
console.log('      TRUE (ai_model === "emma") → Prepare API Request → Call /api/chat (Emma)');
console.log('      FALSE (ai_model === "gemini") → Call Gemini API');
console.log('\n💡 Le node IF est plus stable et ne devrait pas freezer');

