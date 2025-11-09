/**
 * Script pour corriger la connexion orpheline
 * Debug Before Switch → 🤖 Choose AI Model (n'existe plus)
 * Doit pointer vers: Choose AI Model (IF)
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Correction de la connexion orpheline...\n');

// Trouver le node Debug
const debugNode = workflow.nodes.find(n => 
  n.name === '🔍 Debug Before Switch' ||
  n.name.includes('Debug Before Switch')
);

// Trouver le node IF (le bon nom)
const ifNode = workflow.nodes.find(n => 
  n.name === 'Choose AI Model (IF)'
);

if (!debugNode) {
  console.error('❌ Node Debug non trouvé');
  process.exit(1);
}

if (!ifNode) {
  console.error('❌ Node IF non trouvé');
  process.exit(1);
}

console.log(`✅ Node Debug trouvé: ${debugNode.name}`);
console.log(`✅ Node IF trouvé: ${ifNode.name}`);

// Corriger la connexion
if (!workflow.connections) {
  workflow.connections = {};
}

if (!workflow.connections[debugNode.name]) {
  workflow.connections[debugNode.name] = {};
}

if (!workflow.connections[debugNode.name].main) {
  workflow.connections[debugNode.name].main = [];
}

if (!workflow.connections[debugNode.name].main[0]) {
  workflow.connections[debugNode.name].main[0] = [];
}

// Remplacer la connexion vers le mauvais nom par le bon nom
workflow.connections[debugNode.name].main[0] = [
  {
    node: ifNode.name, // "Choose AI Model (IF)"
    type: 'main',
    index: 0
  }
];

console.log(`✅ Connexion corrigée: ${debugNode.name} → ${ifNode.name}`);

// Vérifier aussi que le node "⚙️ AI Model Selector" se connecte bien au Debug
const aiModelSelectorNode = workflow.nodes.find(n => 
  n.name === '⚙️ AI Model Selector (Change AI_MODEL)'
);

if (aiModelSelectorNode) {
  if (!workflow.connections[aiModelSelectorNode.name]) {
    workflow.connections[aiModelSelectorNode.name] = {};
  }
  if (!workflow.connections[aiModelSelectorNode.name].main) {
    workflow.connections[aiModelSelectorNode.name].main = [];
  }
  if (!workflow.connections[aiModelSelectorNode.name].main[0]) {
    workflow.connections[aiModelSelectorNode.name].main[0] = [];
  }
  
  // Vérifier si la connexion existe déjà
  const existingConnection = workflow.connections[aiModelSelectorNode.name].main[0].find(
    c => c.node === debugNode.name
  );
  
  if (!existingConnection) {
    workflow.connections[aiModelSelectorNode.name].main[0].push({
      node: debugNode.name,
      type: 'main',
      index: 0
    });
    console.log(`✅ Connexion ajoutée: ${aiModelSelectorNode.name} → ${debugNode.name}`);
  }
}

// Vérifier que "Determine Time-Based Prompt" se connecte bien à "⚙️ AI Model Selector"
const determinePromptNode = workflow.nodes.find(n => 
  n.name === 'Determine Time-Based Prompt'
);

if (determinePromptNode && aiModelSelectorNode) {
  if (!workflow.connections[determinePromptNode.name]) {
    workflow.connections[determinePromptNode.name] = {};
  }
  if (!workflow.connections[determinePromptNode.name].main) {
    workflow.connections[determinePromptNode.name].main = [];
  }
  if (!workflow.connections[determinePromptNode.name].main[0]) {
    workflow.connections[determinePromptNode.name].main[0] = [];
  }
  
  // Vérifier si la connexion existe déjà
  const existingConnection = workflow.connections[determinePromptNode.name].main[0].find(
    c => c.node === aiModelSelectorNode.name
  );
  
  if (!existingConnection) {
    workflow.connections[determinePromptNode.name].main[0].push({
      node: aiModelSelectorNode.name,
      type: 'main',
      index: 0
    });
    console.log(`✅ Connexion ajoutée: ${determinePromptNode.name} → ${aiModelSelectorNode.name}`);
  }
}

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Connexion orpheline corrigée !');
console.log('\n📋 Flux corrigé:');
console.log('   Determine Time-Based Prompt');
console.log('   → ⚙️ AI Model Selector');
console.log('   → 🔍 Debug Before Switch');
console.log('   → Choose AI Model (IF)');

