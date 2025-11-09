/**
 * Script pour créer un VRAI menu déroulant dans n8n
 * 
 * Solution: Utiliser un node "Edit Fields" avec un type "select" si disponible
 * OU créer un node Switch avec des routes activables/désactivables directement
 * 
 * En fait, la meilleure solution pour n8n est d'utiliser un node Switch
 * où l'utilisateur peut activer/désactiver les routes directement dans l'interface
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Création d\'un vrai menu déroulant avec Switch activable...\n');

// Solution finale: Utiliser un node Switch où l'utilisateur peut activer/désactiver les routes
// Mais n8n ne permet pas d'activer/désactiver les routes dans le Switch...

// Meilleure solution: Créer un node Set avec une valeur par défaut claire
// ET améliorer le code pour qu'il soit plus facile à modifier

const determinePromptNode = workflow.nodes.find(n => n.name === 'Determine Time-Based Prompt');
const chooseAiModelSwitch = workflow.nodes.find(n => n.name === '🤖 Choose AI Model');

if (!determinePromptNode || !chooseAiModelSwitch) {
  console.error('❌ Nodes requis non trouvés');
  process.exit(1);
}

// Créer un node Set amélioré avec des valeurs claires et un commentaire
const improvedAiModelConfig = {
  parameters: {
    assignments: {
      assignments: [
        {
          id: 'ai-model-dropdown',
          name: 'ai_model',
          value: 'emma', // Valeur par défaut: 'emma' pour Emma (Perplexity)
          type: 'string'
        }
      ]
    },
    includeOtherFields: true,
    options: {}
  },
  id: 'ai-model-config-dropdown',
  name: '⚙️ AI Model: emma ou gemini',
  type: 'n8n-nodes-base.set',
  typeVersion: 3.4,
  position: [
    determinePromptNode.position[0] + 160,
    determinePromptNode.position[1]
  ]
};

// Trouver et remplacer le node actuel
const currentSelector = workflow.nodes.find(n => 
  n.name === '⚙️ Choose AI Model (Edit Here)' || 
  n.name === '⚙️ AI Model (emma/gemini)'
);

if (currentSelector) {
  const index = workflow.nodes.findIndex(n => n.id === currentSelector.id);
  workflow.nodes[index] = improvedAiModelConfig;
  console.log('✅ Node remplacé par un node Set amélioré');
} else {
  workflow.nodes.push(improvedAiModelConfig);
  console.log('✅ Node Set amélioré créé');
}

// Mettre à jour les connexions
if (workflow.connections['⚙️ Choose AI Model (Edit Here)']) {
  workflow.connections['⚙️ AI Model: emma ou gemini'] = workflow.connections['⚙️ Choose AI Model (Edit Here)'];
  delete workflow.connections['⚙️ Choose AI Model (Edit Here)'];
}

if (workflow.connections['⚙️ AI Model (emma/gemini)']) {
  workflow.connections['⚙️ AI Model: emma ou gemini'] = workflow.connections['⚙️ AI Model (emma/gemini)'];
  delete workflow.connections['⚙️ AI Model (emma/gemini)'];
}

if (!workflow.connections['⚙️ AI Model: emma ou gemini']) {
  workflow.connections['⚙️ AI Model: emma ou gemini'] = {
    main: [
      [
        {
          node: '🤖 Choose AI Model',
          type: 'main',
          index: 0
        }
      ]
    ]
  };
}

// Améliorer le Switch pour qu'il soit plus clair
if (chooseAiModelSwitch.parameters.rules) {
  // S'assurer que les routes sont bien nommées
  if (chooseAiModelSwitch.parameters.rules.values) {
    chooseAiModelSwitch.parameters.rules.values.forEach((rule, index) => {
      if (index === 0 && !rule.outputKey) {
        rule.outputKey = '🤖 Emma (Perplexity)';
        rule.renameOutput = true;
      }
      if (index === 1 && !rule.outputKey) {
        rule.outputKey = '✨ Gemini Direct';
        rule.renameOutput = true;
      }
    });
  }
  console.log('✅ Switch amélioré avec routes nommées');
}

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Configuration améliorée !');
console.log('\n📋 Comment utiliser (sans menu déroulant, mais simple):');
console.log('   1. Ouvrez le node "⚙️ AI Model: emma ou gemini"');
console.log('   2. Dans "Assignments", trouvez le champ "ai_model"');
console.log('   3. Cliquez sur la valeur (actuellement "emma")');
console.log('   4. Modifiez à "emma" ou "gemini"');
console.log('   5. Sauvegardez');
console.log('\n💡 Astuce: Dans n8n, vous pouvez aussi:');
console.log('   - Double-cliquer sur la valeur pour la modifier rapidement');
console.log('   - Utiliser Ctrl+C / Ctrl+V pour copier-coller');
console.log('\n⚠️  Note: n8n ne supporte pas les menus déroulants dans les nodes Set.');
console.log('   Mais le Switch "🤖 Choose AI Model" montre visuellement quelle route est prise !');

