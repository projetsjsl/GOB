/**
 * Script pour corriger complètement la configuration du Switch
 * 
 * Vérifie et corrige toutes les propriétés du Switch pour qu'il fonctionne correctement
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Correction complète de la configuration du Switch...\n');

// Trouver le node Switch
const chooseAiModelSwitch = workflow.nodes.find(n => n.name === '🤖 Choose AI Model');

if (!chooseAiModelSwitch) {
  console.error('❌ Node "🤖 Choose AI Model" non trouvé');
  process.exit(1);
}

console.log('✅ Node Switch trouvé');
console.log('   Type:', chooseAiModelSwitch.type);
console.log('   TypeVersion:', chooseAiModelSwitch.typeVersion);

// Configuration complète et correcte du Switch
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

// S'assurer que le typeVersion est correct pour Switch
if (chooseAiModelSwitch.typeVersion !== 3) {
  chooseAiModelSwitch.typeVersion = 3;
  console.log('✅ TypeVersion corrigé à 3');
}

console.log('✅ Configuration du Switch mise à jour');
console.log('\n📋 Configuration:');
console.log('   Mode: rules');
console.log('   Route 1: ai_model === "emma" → 🤖 Emma (Perplexity)');
console.log('   Route 2: ai_model === "gemini" → ✨ Gemini Direct');

// Vérifier que les connexions sont correctes
if (!workflow.connections['🤖 Choose AI Model']) {
  console.log('⚠️  Pas de connexions trouvées pour le Switch');
} else {
  const switchConnections = workflow.connections['🤖 Choose AI Model'].main;
  if (switchConnections && switchConnections.length >= 2) {
    console.log('✅ Le Switch a 2 routes configurées');
    console.log('   Route 0:', switchConnections[0]?.[0]?.node || 'Non définie');
    console.log('   Route 1:', switchConnections[1]?.[0]?.node || 'Non définie');
  } else {
    console.log('⚠️  Le Switch n\'a pas 2 routes configurées');
    // Corriger les connexions
    const prepareApiRequestNode = workflow.nodes.find(n => n.name === 'Prepare API Request');
    const callGeminiNode = workflow.nodes.find(n => n.name === 'Call Gemini API');
    
    if (prepareApiRequestNode && callGeminiNode) {
      workflow.connections['🤖 Choose AI Model'] = {
        main: [
          [
            {
              node: 'Prepare API Request',
              type: 'main',
              index: 0
            }
          ],
          [
            {
              node: 'Call Gemini API',
              type: 'main',
              index: 0
            }
          ]
        ]
      };
      console.log('✅ Connexions du Switch corrigées');
    }
  }
}

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Configuration complète corrigée !');
console.log('\n💡 Pour tester:');
console.log('   1. Exécutez le workflow');
console.log('   2. Ouvrez "🤖 Choose AI Model"');
console.log('   3. Vérifiez dans "Execution Data" quelle route a reçu des données');
console.log('   4. Si aucune route n\'a de données, vérifiez que ai_model est bien défini dans le node précédent');

