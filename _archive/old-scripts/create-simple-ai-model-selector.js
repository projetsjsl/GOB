/**
 * Script pour créer un sélecteur simple et visuel pour choisir entre Emma et Gemini
 * 
 * Solution: Utiliser un node Switch avec des routes nommées claires
 * "🤖 Emma (Perplexity)" et "✨ Gemini Direct"
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Création d\'un sélecteur visuel simple pour Emma/Gemini...\n');

// Trouver les nodes existants
const determinePromptNode = workflow.nodes.find(n => n.name === 'Determine Time-Based Prompt');
const aiModelConfigNode = workflow.nodes.find(n => n.name === 'AI Model Config');
const prepareApiRequestNode = workflow.nodes.find(n => n.name === 'Prepare API Request');
const callEmmaNode = workflow.nodes.find(n => n.name === 'Call /api/chat (Emma)');
const callGeminiNode = workflow.nodes.find(n => n.name === 'Call Gemini API');

if (!determinePromptNode || !prepareApiRequestNode || !callEmmaNode || !callGeminiNode) {
  console.error('❌ Nodes requis non trouvés');
  process.exit(1);
}

// Solution simple: Remplacer le node "AI Model Config" + "Choose AI Model?" par un seul Switch avec routes nommées
// Le Switch sera directement après "Determine Time-Based Prompt"

// Créer un node Switch simple avec deux routes nommées
const aiModelSwitchNode = {
  parameters: {
    mode: 'rules',
    rules: {
      values: [
        {
          conditions: {
            string: [
              {
                value1: "={{ $json.ai_model || 'emma' }}",
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
                value1: "={{ $json.ai_model || 'emma' }}",
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
  },
  id: 'ai-model-selector-switch',
  name: '🤖 Choose AI Model',
  type: 'n8n-nodes-base.switch',
  typeVersion: 3,
  position: [
    determinePromptNode.position[0] + 160,
    determinePromptNode.position[1]
  ]
};

// Vérifier si le node existe déjà
const existingSwitch = workflow.nodes.find(n => n.name === '🤖 Choose AI Model');
if (!existingSwitch) {
  workflow.nodes.push(aiModelSwitchNode);
  console.log('✅ Node "🤖 Choose AI Model" créé avec routes nommées');
} else {
  console.log('✅ Node "🤖 Choose AI Model" existe déjà');
}

// Créer un node Set simple pour définir ai_model (avec valeur par défaut)
// Ce node sera optionnel - l'utilisateur peut le modifier facilement
const simpleAiModelConfig = {
  parameters: {
    assignments: {
      assignments: [
        {
          id: 'ai-model-simple',
          name: 'ai_model',
          value: 'emma', // Valeur par défaut: Emma
          type: 'string'
        }
      ]
    },
    includeOtherFields: true,
    options: {}
  },
  id: 'ai-model-config-simple',
  name: '⚙️ AI Model (emma/gemini)',
  type: 'n8n-nodes-base.set',
  typeVersion: 3.4,
  position: [
    determinePromptNode.position[0],
    determinePromptNode.position[1]
  ]
};

// Vérifier si le node existe déjà (remplacer l'ancien si nécessaire)
const existingConfig = workflow.nodes.find(n => n.name === '⚙️ AI Model (emma/gemini)');
if (!existingConfig) {
  // Supprimer l'ancien "AI Model Config" s'il existe
  const oldConfigIndex = workflow.nodes.findIndex(n => n.name === 'AI Model Config');
  if (oldConfigIndex !== -1) {
    workflow.nodes.splice(oldConfigIndex, 1);
    console.log('✅ Ancien "AI Model Config" supprimé');
  }
  workflow.nodes.push(simpleAiModelConfig);
  console.log('✅ Node "⚙️ AI Model (emma/gemini)" créé');
} else {
  console.log('✅ Node "⚙️ AI Model (emma/gemini)" existe déjà');
}

// Mettre à jour les connexions
// Determine Time-Based Prompt → ⚙️ AI Model (emma/gemini)
if (workflow.connections['Determine Time-Based Prompt']) {
  workflow.connections['Determine Time-Based Prompt'] = {
    main: [
      [
        {
          node: '⚙️ AI Model (emma/gemini)',
          type: 'main',
          index: 0
        }
      ]
    ]
  };
  console.log('✅ Connexion: Determine Time-Based Prompt → ⚙️ AI Model');
} else {
  workflow.connections['Determine Time-Based Prompt'] = {
    main: [
      [
        {
          node: '⚙️ AI Model (emma/gemini)',
          type: 'main',
          index: 0
        }
      ]
    ]
  };
}

// ⚙️ AI Model (emma/gemini) → 🤖 Choose AI Model
if (!workflow.connections['⚙️ AI Model (emma/gemini)']) {
  workflow.connections['⚙️ AI Model (emma/gemini)'] = {
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
  console.log('✅ Connexion: ⚙️ AI Model → 🤖 Choose AI Model');
}

// 🤖 Choose AI Model → Routes vers Emma et Gemini
workflow.connections['🤖 Choose AI Model'] = {
  main: [
    // Route "🤖 Emma (Perplexity)" → Prepare API Request → Call /api/chat (Emma)
    [
      {
        node: 'Prepare API Request',
        type: 'main',
        index: 0
      }
    ],
    // Route "✨ Gemini Direct" → Call Gemini API
    [
      {
        node: 'Call Gemini API',
        type: 'main',
        index: 0
      }
    ]
  ]
};
console.log('✅ Connexions: 🤖 Choose AI Model → Emma/Gemini');

// Prepare API Request → Call /api/chat (Emma) (direct, plus besoin de IF)
if (workflow.connections['Prepare API Request']) {
  workflow.connections['Prepare API Request'] = {
    main: [
      [
        {
          node: 'Call /api/chat (Emma)',
          type: 'main',
          index: 0
        }
      ]
    ]
  };
  console.log('✅ Connexion: Prepare API Request → Call /api/chat (Emma)');
}

// Supprimer l'ancien node "Choose AI Model?" (IF) s'il n'est plus utilisé
const oldChooseIf = workflow.nodes.find(n => n.name === 'Choose AI Model?');
if (oldChooseIf) {
  const oldChooseIfIndex = workflow.nodes.findIndex(n => n.name === 'Choose AI Model?');
  if (oldChooseIfIndex !== -1) {
    workflow.nodes.splice(oldChooseIfIndex, 1);
    console.log('✅ Ancien node "Choose AI Model?" (IF) supprimé');
  }
  // Supprimer aussi ses connexions
  if (workflow.connections['Choose AI Model?']) {
    delete workflow.connections['Choose AI Model?'];
  }
}

// Supprimer aussi "Choose AI Model (Visual)" s'il existe
const oldVisualSwitch = workflow.nodes.find(n => n.name === 'Choose AI Model (Visual)');
if (oldVisualSwitch) {
  const oldVisualSwitchIndex = workflow.nodes.findIndex(n => n.name === 'Choose AI Model (Visual)');
  if (oldVisualSwitchIndex !== -1) {
    workflow.nodes.splice(oldVisualSwitchIndex, 1);
    console.log('✅ Ancien node "Choose AI Model (Visual)" supprimé');
  }
  if (workflow.connections['Choose AI Model (Visual)']) {
    delete workflow.connections['Choose AI Model (Visual)'];
  }
}

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Sélecteur visuel créé !');
console.log('\n📋 Nouvelle structure simple:');
console.log('   Determine Time-Based Prompt');
console.log('   → ⚙️ AI Model (emma/gemini) [Modifiez "ai_model" ici: "emma" ou "gemini"]');
console.log('   → 🤖 Choose AI Model (Switch avec routes nommées)');
console.log('      - Route "🤖 Emma (Perplexity)" → Prepare API Request → Call /api/chat (Emma)');
console.log('      - Route "✨ Gemini Direct" → Call Gemini API');
console.log('\n💡 Comment utiliser:');
console.log('   1. Ouvrez le node "⚙️ AI Model (emma/gemini)"');
console.log('   2. Modifiez la valeur de "ai_model":');
console.log('      - Tapez "emma" pour utiliser Emma (Perplexity)');
console.log('      - Tapez "gemini" pour utiliser Gemini directement');
console.log('   3. Le Switch "🤖 Choose AI Model" route automatiquement');
console.log('   4. Vous verrez clairement quelle route est prise (Emma ou Gemini)');

