/**
 * Script de diagnostic complet du workflow n8n
 */

import { readFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔍 Diagnostic complet du workflow...\n');

// 1. Vérifier la structure de base
console.log('📊 Structure de base:');
console.log(`   Nodes: ${workflow.nodes.length}`);
console.log(`   Connections: ${Object.keys(workflow.connections || {}).length}`);
console.log(`   Active: ${workflow.active || false}\n`);

// 2. Vérifier les nodes cassés
console.log('🔧 Vérification des nodes:');
const brokenNodes = workflow.nodes.filter(n => !n.name || !n.type || !n.id);
if (brokenNodes.length > 0) {
  console.log(`   ❌ Nodes cassés: ${brokenNodes.length}`);
  brokenNodes.forEach(n => {
    console.log(`      - ID: ${n.id}, Name: ${n.name || 'MISSING'}, Type: ${n.type || 'MISSING'}`);
  });
} else {
  console.log('   ✅ Tous les nodes ont un nom, type et ID');
}

// 3. Vérifier les connexions orphelines
console.log('\n🔗 Vérification des connexions:');
const nodeNames = new Set(workflow.nodes.map(n => n.name));
const orphanedConnections = [];

Object.keys(workflow.connections || {}).forEach(sourceNode => {
  if (!nodeNames.has(sourceNode)) {
    orphanedConnections.push(`Source: ${sourceNode} (node n'existe pas)`);
  }
  
  workflow.connections[sourceNode].main?.forEach((outputs, index) => {
    outputs?.forEach(conn => {
      if (!nodeNames.has(conn.node)) {
        orphanedConnections.push(`${sourceNode} → ${conn.node} (node n'existe pas)`);
      }
    });
  });
});

if (orphanedConnections.length > 0) {
  console.log(`   ❌ Connexions orphelines: ${orphanedConnections.length}`);
  orphanedConnections.slice(0, 10).forEach(c => console.log(`      - ${c}`));
  if (orphanedConnections.length > 10) {
    console.log(`      ... et ${orphanedConnections.length - 10} autres`);
  }
} else {
  console.log('   ✅ Toutes les connexions pointent vers des nodes existants');
}

// 4. Vérifier les nodes sans connexions entrantes (sauf triggers)
console.log('\n📥 Nodes sans connexions entrantes:');
const nodesWithIncoming = new Set();
Object.keys(workflow.connections || {}).forEach(sourceNode => {
  workflow.connections[sourceNode].main?.forEach(outputs => {
    outputs?.forEach(conn => {
      nodesWithIncoming.add(conn.node);
    });
  });
});

const triggerTypes = ['n8n-nodes-base.scheduleTrigger', 'n8n-nodes-base.webhook', 'n8n-nodes-base.manualTrigger'];
const isolatedNodes = workflow.nodes.filter(n => 
  !triggerTypes.includes(n.type) && 
  !nodesWithIncoming.has(n.name) &&
  n.name !== 'Determine Time-Based Prompt' // Ce node peut être appelé par plusieurs triggers
);

if (isolatedNodes.length > 0) {
  console.log(`   ⚠️  Nodes isolés (sans connexions entrantes): ${isolatedNodes.length}`);
  isolatedNodes.forEach(n => console.log(`      - ${n.name} (${n.type})`));
} else {
  console.log('   ✅ Tous les nodes (sauf triggers) ont des connexions entrantes');
}

// 5. Vérifier les nodes spécifiques du flux AI Model
console.log('\n🤖 Vérification du flux AI Model:');
const aiModelNodes = [
  'Determine Time-Based Prompt',
  '⚙️ AI Model Selector (Change AI_MODEL)',
  '🔍 Debug Before Switch',
  'Choose AI Model (IF)',
  'Prepare API Request',
  'Call Gemini API',
  'Parse Gemini Response',
  'Parse API Response'
];

aiModelNodes.forEach(nodeName => {
  const node = workflow.nodes.find(n => n.name === nodeName);
  if (!node) {
    console.log(`   ❌ Node manquant: ${nodeName}`);
  } else {
    // Vérifier les connexions sortantes
    const outgoing = workflow.connections[nodeName]?.main?.[0] || [];
    if (outgoing.length === 0 && nodeName !== 'Parse API Response') {
      console.log(`   ⚠️  ${nodeName}: pas de connexions sortantes`);
    } else {
      console.log(`   ✅ ${nodeName}: ${outgoing.length} connexion(s) sortante(s)`);
    }
  }
});

// 6. Vérifier les paramètres du node IF
console.log('\n🔀 Vérification du node IF:');
const ifNode = workflow.nodes.find(n => n.name === 'Choose AI Model (IF)');
if (ifNode) {
  console.log(`   Type: ${ifNode.type}`);
  console.log(`   TypeVersion: ${ifNode.typeVersion}`);
  const conditions = ifNode.parameters?.conditions?.string?.[0];
  if (conditions) {
    console.log(`   ✅ Condition trouvée:`);
    console.log(`      value1: ${conditions.value1 || 'MISSING'}`);
    console.log(`      operation: ${conditions.operation || 'MISSING'}`);
    console.log(`      value2: ${conditions.value2 || 'MISSING'}`);
  } else {
    console.log(`   ❌ Condition manquante ou mal formée`);
  }
  
  // Vérifier les connexions
  const ifConnections = workflow.connections[ifNode.name]?.main || [];
  console.log(`   Connexions: ${ifConnections.length}`);
  if (ifConnections[0]) {
    console.log(`      TRUE: ${ifConnections[0].map(c => c.node).join(', ') || 'AUCUNE'}`);
  }
  if (ifConnections[1]) {
    console.log(`      FALSE: ${ifConnections[1].map(c => c.node).join(', ') || 'AUCUNE'}`);
  }
} else {
  console.log('   ❌ Node IF non trouvé');
}

console.log('\n✅ Diagnostic terminé');

