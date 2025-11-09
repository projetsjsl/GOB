/**
 * Script pour ajouter un node de debug avant le Switch
 * 
 * Ce node affichera exactement ce que le Switch reçoit,
 * pour vérifier que ai_model est bien présent
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Ajout d\'un node de debug avant le Switch...\n');

// Trouver les nodes
const aiModelSelector = workflow.nodes.find(n => n.name === '⚙️ AI Model Selector (Change AI_MODEL)');
const chooseAiModelSwitch = workflow.nodes.find(n => n.name === '🤖 Choose AI Model');

if (!aiModelSelector || !chooseAiModelSwitch) {
  console.error('❌ Nodes requis non trouvés');
  process.exit(1);
}

// Créer un node de debug
const debugNode = {
  parameters: {
    jsCode: `const items = $input.all();
const data = items[0].json;

console.log('🔍 DEBUG - Données reçues par le Switch:');
console.log('   ai_model:', data.ai_model, '(type:', typeof data.ai_model, ')');
console.log('   ai_model === "emma":', data.ai_model === 'emma');
console.log('   ai_model === "gemini":', data.ai_model === 'gemini');
console.log('   Toutes les clés:', Object.keys(data));

// Afficher aussi dans les données de sortie pour voir dans n8n
return items.map(item => ({
  json: {
    ...item.json,
    _debug_ai_model: item.json.ai_model,
    _debug_ai_model_type: typeof item.json.ai_model,
    _debug_ai_model_equals_emma: item.json.ai_model === 'emma',
    _debug_ai_model_equals_gemini: item.json.ai_model === 'gemini',
    _debug_all_keys: Object.keys(item.json).join(', ')
  }
}));`
  },
  id: 'debug-before-ai-model-switch',
  name: '🔍 Debug Before Switch',
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [
    chooseAiModelSwitch.position[0] - 160,
    chooseAiModelSwitch.position[1]
  ]
};

// Vérifier si le node existe déjà
const existingDebug = workflow.nodes.find(n => n.name === '🔍 Debug Before Switch');
if (!existingDebug) {
  workflow.nodes.push(debugNode);
  console.log('✅ Node de debug créé');
} else {
  console.log('✅ Node de debug existe déjà');
}

// Mettre à jour les connexions
// AI Model Selector → Debug Before Switch → Choose AI Model

// Vérifier la connexion actuelle
if (workflow.connections['⚙️ AI Model Selector (Change AI_MODEL)']) {
  const currentConnections = workflow.connections['⚙️ AI Model Selector (Change AI_MODEL)'].main[0];
  const goesToDebug = currentConnections && currentConnections.find(c => c.node === '🔍 Debug Before Switch');
  const goesToSwitch = currentConnections && currentConnections.find(c => c.node === '🤖 Choose AI Model');
  
  if (!goesToDebug && !goesToSwitch) {
    // Pas de connexion, créer
    workflow.connections['⚙️ AI Model Selector (Change AI_MODEL)'] = {
      main: [
        [
          {
            node: '🔍 Debug Before Switch',
            type: 'main',
            index: 0
          }
        ]
      ]
    };
    console.log('✅ Connexion: AI Model Selector → Debug Before Switch');
  } else if (goesToSwitch && !goesToDebug) {
    // Va directement au Switch, insérer le debug
    workflow.connections['⚙️ AI Model Selector (Change AI_MODEL)'] = {
      main: [
        [
          {
            node: '🔍 Debug Before Switch',
            type: 'main',
            index: 0
          }
        ]
      ]
    };
    console.log('✅ Connexion: AI Model Selector → Debug Before Switch (inséré)');
  } else {
    console.log('✅ Connexion: AI Model Selector → Debug Before Switch (déjà correcte)');
  }
} else {
  workflow.connections['⚙️ AI Model Selector (Change AI_MODEL)'] = {
    main: [
      [
        {
          node: '🔍 Debug Before Switch',
          type: 'main',
          index: 0
        }
      ]
    ]
  };
  console.log('✅ Connexion: AI Model Selector → Debug Before Switch (créée)');
}

// Debug Before Switch → Choose AI Model
if (!workflow.connections['🔍 Debug Before Switch']) {
  workflow.connections['🔍 Debug Before Switch'] = {
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
  console.log('✅ Connexion: Debug Before Switch → Choose AI Model');
} else {
  const currentConnections = workflow.connections['🔍 Debug Before Switch'].main[0];
  if (!currentConnections || !currentConnections.find(c => c.node === '🤖 Choose AI Model')) {
    workflow.connections['🔍 Debug Before Switch'] = {
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
    console.log('✅ Connexion: Debug Before Switch → Choose AI Model (corrigée)');
  } else {
    console.log('✅ Connexion: Debug Before Switch → Choose AI Model (déjà correcte)');
  }
}

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Node de debug ajouté !');
console.log('\n📋 Nouveau flux:');
console.log('   ⚙️ AI Model Selector (Change AI_MODEL)');
console.log('   → 🔍 Debug Before Switch (affiche ai_model)');
console.log('   → 🤖 Choose AI Model (Switch)');
console.log('\n💡 Pour vérifier:');
console.log('   1. Exécutez le workflow');
console.log('   2. Ouvrez "🔍 Debug Before Switch"');
console.log('   3. Regardez les logs et les données de sortie');
console.log('   4. Vous verrez exactement ce que le Switch reçoit');

