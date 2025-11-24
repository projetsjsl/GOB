/**
 * Script pour corriger la connexion du Debug node vers le bon nom de node IF
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Correction de la connexion Debug → IF...\n');

// Trouver les nodes
const debugNode = workflow.nodes.find(n => 
  n.name === '🔍 Debug Before Switch' ||
  n.name.includes('Debug Before Switch')
);

const ifNode = workflow.nodes.find(n => 
  n.name === 'Choose AI Model (IF)' ||
  n.name === '🤖 Choose AI Model'
);

if (!debugNode || !ifNode) {
  console.error('❌ Nodes non trouvés');
  process.exit(1);
}

console.log(`✅ Debug node trouvé: ${debugNode.name}`);
console.log(`✅ IF node trouvé: ${ifNode.name}`);

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

// Mettre à jour la connexion pour pointer vers le bon nom
workflow.connections[debugNode.name].main[0] = [
  {
    node: ifNode.name, // Utiliser le nom exact du node IF
    type: 'main',
    index: 0
  }
];

console.log(`✅ Connexion corrigée: ${debugNode.name} → ${ifNode.name}`);

// Vérifier aussi la connexion depuis Determine Time-Based Prompt
const determinePromptNode = workflow.nodes.find(n => 
  n.name === 'Determine Time-Based Prompt' ||
  n.name.includes('Determine') && n.name.includes('Prompt')
);

if (determinePromptNode) {
  const aiModelSelectorNode = workflow.nodes.find(n => 
    n.name === '⚙️ AI Model Selector (Change AI_MODEL)' ||
    n.name.includes('AI Model Selector')
  );
  
  if (aiModelSelectorNode) {
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
}

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Toutes les connexions corrigées !');

