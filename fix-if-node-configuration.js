/**
 * Script pour vérifier et corriger la configuration du node IF
 * "Choose AI Model (IF)" doit avoir une condition pour router entre Emma et Gemini
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Vérification et correction du node IF...\n');

// Trouver le node IF
const chooseAiModelIf = workflow.nodes.find(n => n.name === 'Choose AI Model (IF)');

if (!chooseAiModelIf) {
  console.error('❌ Node IF non trouvé');
  process.exit(1);
}

console.log(`✅ Node IF trouvé: ${chooseAiModelIf.name}`);
console.log(`   Type: ${chooseAiModelIf.type}`);
console.log(`   TypeVersion: ${chooseAiModelIf.typeVersion}`);

// Vérifier la configuration actuelle
const currentParams = chooseAiModelIf.parameters;
console.log('\n📋 Configuration actuelle:');
console.log(JSON.stringify(currentParams, null, 2));

// Configuration correcte pour le node IF
chooseAiModelIf.parameters = {
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

console.log('\n✅ Configuration corrigée:');
console.log('   Condition: ai_model === "emma"');
console.log('   TRUE → Prepare API Request (Emma)');
console.log('   FALSE → Call Gemini API (Gemini)');

// Vérifier que le type est correct
chooseAiModelIf.type = 'n8n-nodes-base.if';
chooseAiModelIf.typeVersion = 2;

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Node IF corrigé !');
console.log('\n💡 Dans n8n, vous devriez maintenant voir:');
console.log('   Value 1: ={{ $json.ai_model }}');
console.log('   Operation: equals');
console.log('   Value 2: emma');

