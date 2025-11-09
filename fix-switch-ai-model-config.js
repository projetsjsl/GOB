/**
 * Script pour corriger la configuration du Switch "🤖 Choose AI Model"
 * 
 * Le problème: Les conditions du Switch ne détectent pas correctement ai_model
 * Solution: Simplifier et corriger les conditions
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Correction de la configuration du Switch "🤖 Choose AI Model"...\n');

// Trouver le node Switch
const chooseAiModelSwitch = workflow.nodes.find(n => n.name === '🤖 Choose AI Model');

if (!chooseAiModelSwitch) {
  console.error('❌ Node "🤖 Choose AI Model" non trouvé');
  process.exit(1);
}

console.log('✅ Node Switch trouvé');

// Corriger la configuration du Switch
// Mode "rules" avec conditions string simples
chooseAiModelSwitch.parameters = {
  mode: 'rules',
  rules: {
    values: [
      {
        conditions: {
          string: [
            {
              value1: "={{ $json.ai_model }}",
              operation: 'equals',
              value2: 'emma'
            }
          ]
        },
        renameOutput: true,
        outputKey: '🤖 Emma (Perplexity)'
      },
      {
        conditions: {
          string: [
            {
              value1: "={{ $json.ai_model }}",
              operation: 'equals',
              value2: 'gemini'
            }
          ]
        },
        renameOutput: true,
        outputKey: '✨ Gemini Direct'
      }
    ]
  },
  options: {}
};

console.log('✅ Configuration du Switch corrigée');
console.log('   Route 1: ai_model === "emma" → 🤖 Emma (Perplexity)');
console.log('   Route 2: ai_model === "gemini" → ✨ Gemini Direct');

// Vérifier aussi que le node AI Model Selector génère bien ai_model
const aiModelSelector = workflow.nodes.find(n => n.name === '⚙️ AI Model Selector (Change AI_MODEL)');

if (aiModelSelector && aiModelSelector.parameters.jsCode) {
  // Vérifier que le code génère bien ai_model
  if (!aiModelSelector.parameters.jsCode.includes('ai_model: AI_MODEL')) {
    console.log('⚠️  Le code du sélecteur ne génère pas ai_model correctement');
    // Le code devrait déjà être correct, mais on vérifie
  } else {
    console.log('✅ Le sélecteur génère bien ai_model');
  }
}

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Configuration corrigée !');
console.log('\n📋 Test:');
console.log('   1. Ouvrez "⚙️ AI Model Selector (Change AI_MODEL)"');
console.log('   2. Modifiez AI_MODEL à "emma" ou "gemini"');
console.log('   3. Exécutez le workflow');
console.log('   4. Vérifiez dans "🤖 Choose AI Model" quelle route est prise');
console.log('\n💡 Le Switch devrait maintenant détecter correctement ai_model');

