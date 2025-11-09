/**
 * Script pour corriger le problème de freeze du Switch
 * 
 * Problème: Le Switch freeze quand on essaie de modifier ai_model
 * Solution: Simplifier la configuration et utiliser une syntaxe plus robuste
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Correction du problème de freeze du Switch...\n');

// Trouver le node Switch
const chooseAiModelSwitch = workflow.nodes.find(n => n.name === '🤖 Choose AI Model');

if (!chooseAiModelSwitch) {
  console.error('❌ Node Switch non trouvé');
  process.exit(1);
}

console.log('✅ Node Switch trouvé');

// Configuration simplifiée et robuste pour éviter les freezes
// Utiliser une syntaxe plus simple et directe
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
        outputKey: 'Emma'
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
        outputKey: 'Gemini'
      }
    ]
  },
  options: {}
};

// S'assurer que le typeVersion est correct
chooseAiModelSwitch.typeVersion = 3;

// Vérifier que le type est correct
if (chooseAiModelSwitch.type !== 'n8n-nodes-base.switch') {
  chooseAiModelSwitch.type = 'n8n-nodes-base.switch';
}

console.log('✅ Configuration simplifiée');
console.log('   Route 1: ai_model === "emma" → Emma');
console.log('   Route 2: ai_model === "gemini" → Gemini');
console.log('   Output Keys simplifiés (sans emojis pour éviter les problèmes)');

// Alternative: Si le problème persiste, on peut utiliser un IF au lieu d'un Switch
// Mais essayons d'abord avec cette configuration simplifiée

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Configuration corrigée !');
console.log('\n💡 Si le problème persiste:');
console.log('   1. Essayez de supprimer et recréer le node Switch dans n8n');
console.log('   2. Ou utilisez un node IF au lieu d\'un Switch');
console.log('   3. Les Output Keys sont maintenant simplifiés (sans emojis)');

