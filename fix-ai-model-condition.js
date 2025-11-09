/**
 * Script pour corriger la condition du node IF "Choose AI Model?"
 * 
 * Condition simplifiée: TRUE si ai_model === 'emma', FALSE sinon (gemini)
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Correction de la condition du node IF "Choose AI Model?"...\n');

// Trouver le node "Choose AI Model?"
const chooseAiModelNode = workflow.nodes.find(n => n.name === 'Choose AI Model?');

if (!chooseAiModelNode) {
  console.error('❌ Node "Choose AI Model?" non trouvé');
  process.exit(1);
}

// Corriger la condition pour être plus simple et claire
chooseAiModelNode.parameters = {
  conditions: {
    boolean: [
      {
        // TRUE si ai_model === 'emma'
        value1: "={{ $json.ai_model === 'emma' }}",
        value2: true
      }
    ]
  },
  options: {}
};

console.log('✅ Condition corrigée');
console.log('   Condition: ai_model === "emma"');
console.log('   TRUE → Call /api/chat (Emma)');
console.log('   FALSE → Call Gemini API');

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Condition mise à jour !');
console.log('\n📋 Logique:');
console.log('   - Si ai_model === "emma" → TRUE → Branche Emma');
console.log('   - Si ai_model === "gemini" → FALSE → Branche Gemini');
console.log('   - Si ai_model est undefined → FALSE → Branche Gemini (par défaut)');

