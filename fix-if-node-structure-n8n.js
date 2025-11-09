/**
 * Script pour forcer une structure différente du node IF
 * qui s'affiche mieux dans l'interface n8n
 * 
 * Essaie plusieurs formats de configuration pour trouver celui
 * que n8n affiche correctement
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Test de différentes structures pour le node IF...\n');

// Trouver le node IF
const chooseAiModelIf = workflow.nodes.find(n => 
  n.name === 'Choose AI Model (IF)' || n.name === '🤖 Choose AI Model'
);

if (!chooseAiModelIf) {
  console.error('❌ Node IF non trouvé');
  process.exit(1);
}

console.log(`✅ Node trouvé: ${chooseAiModelIf.name}`);

// Structure alternative 1: Format simplifié sans options imbriquées
// Cette structure est souvent mieux reconnue par n8n
chooseAiModelIf.type = 'n8n-nodes-base.if';
chooseAiModelIf.typeVersion = 2;
chooseAiModelIf.name = 'Choose AI Model (IF)';

// Format le plus simple et direct que n8n reconnaît généralement
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
  options: {
    caseSensitive: true,
    leftValue: '',
    typeValidation: 'strict'
  }
};

console.log('✅ Structure simplifiée appliquée');
console.log('   Format: conditions.string[0] avec options au même niveau');
console.log('   value1: ={{ $json.ai_model }}');
console.log('   value2: emma');

// Alternative: Si ça ne fonctionne toujours pas, on peut essayer
// avec un format encore plus basique (sans options)
const useMinimalFormat = false; // Changez à true si le format ci-dessus ne fonctionne pas

if (useMinimalFormat) {
  console.log('\n⚠️  Utilisation du format minimal (sans options)...');
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
}

// Vérifier que le node a bien un ID unique
if (!chooseAiModelIf.id) {
  chooseAiModelIf.id = 'ai-model-selector-if';
}

// S'assurer que la position est définie
if (!chooseAiModelIf.position || chooseAiModelIf.position.length !== 2) {
  // Position par défaut (sera ajustée dans n8n)
  chooseAiModelIf.position = [19264, 4536];
}

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Structure corrigée !');
console.log('\n📋 Configuration finale:');
console.log('   Type: IF (n8n-nodes-base.if)');
console.log('   TypeVersion: 2');
console.log('   Condition: ai_model === "emma"');
console.log('\n💡 Instructions pour n8n:');
console.log('   1. Importez le workflow mis à jour');
console.log('   2. Ouvrez le node "Choose AI Model (IF)"');
console.log('   3. Si les valeurs ne s\'affichent pas:');
console.log('      a. Cliquez sur "Add Condition"');
console.log('      b. Value 1: ={{ $json.ai_model }}');
console.log('      c. Operation: equals');
console.log('      d. Value 2: emma');
console.log('   4. Vérifiez les connexions:');
console.log('      - TRUE → Prepare API Request (Emma)');
console.log('      - FALSE → Call Gemini API (Gemini)');

