/**
 * Script pour corriger les valeurs manquantes dans le node IF
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Correction des valeurs du node IF...\n');

// Trouver le node IF
const chooseAiModelIf = workflow.nodes.find(n => 
  n.name === 'Choose AI Model (IF)' || n.name === '🤖 Choose AI Model'
);

if (!chooseAiModelIf) {
  console.error('❌ Node IF non trouvé');
  process.exit(1);
}

console.log(`✅ Node trouvé: ${chooseAiModelIf.name}`);

// Configuration IF complète et correcte
chooseAiModelIf.type = 'n8n-nodes-base.if';
chooseAiModelIf.typeVersion = 2;
chooseAiModelIf.name = 'Choose AI Model (IF)';

chooseAiModelIf.parameters = {
  conditions: {
    options: {
      caseSensitive: true,
      leftValue: '',
      typeValidation: 'strict'
    },
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

console.log('✅ Configuration IF corrigée:');
console.log('   value1: ={{ $json.ai_model }}');
console.log('   operation: equals');
console.log('   value2: emma');
console.log('   TRUE → Emma (Prepare API Request)');
console.log('   FALSE → Gemini (Call Gemini API)');

// Vérifier et corriger les connexions
const prepareApiRequestNode = workflow.nodes.find(n => n.name === 'Prepare API Request');
const callGeminiNode = workflow.nodes.find(n => n.name === 'Call Gemini API');

if (prepareApiRequestNode && callGeminiNode) {
  // Connexions pour IF: main[0] = TRUE, main[1] = FALSE
  if (!workflow.connections) {
    workflow.connections = {};
  }
  
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
  
  console.log('✅ Connexions vérifiées et corrigées');
}

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Node IF corrigé !');
console.log('\n📋 Configuration finale:');
console.log('   Type: IF');
console.log('   Condition: ai_model === "emma"');
console.log('   value1: ={{ $json.ai_model }}');
console.log('   value2: emma');
console.log('\n💡 Les valeurs sont maintenant correctement définies');

