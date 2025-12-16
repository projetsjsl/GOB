/**
 * Script pour créer une configuration alternative du node IF
 * avec une structure encore plus basique que n8n devrait reconnaître
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Création d\'une configuration alternative ultra-simplifiée...\n');

// Trouver le node IF
const chooseAiModelIf = workflow.nodes.find(n => 
  n.name === 'Choose AI Model (IF)' || n.name === '🤖 Choose AI Model'
);

if (!chooseAiModelIf) {
  console.error('❌ Node IF non trouvé');
  process.exit(1);
}

// Format ultra-minimal - structure de base que n8n reconnaît toujours
// Pas d'options, pas de nested structures complexes
chooseAiModelIf.parameters = {
  conditions: {
    string: [
      {
        value1: "={{ $json.ai_model }}",
        operation: 'equals',
        value2: 'emma'
      }
    ]
  }
};

// S'assurer que le type est correct
chooseAiModelIf.type = 'n8n-nodes-base.if';
chooseAiModelIf.typeVersion = 2;

console.log('✅ Configuration ultra-simplifiée appliquée');
console.log('   Structure minimale (pas d\'options imbriquées)');
console.log('   value1: ={{ $json.ai_model }}');
console.log('   operation: equals');
console.log('   value2: emma');

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Configuration alternative créée !');
console.log('\n📝 Cette structure devrait être mieux reconnue par n8n');
console.log('   car elle utilise le format de base sans options complexes');

