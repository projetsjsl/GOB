/**
 * Script pour trouver TOUTES les connexions multiples qui créent des branches séparées
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔍 Recherche de TOUTES les connexions multiples...\n');

// Trouver tous les nodes avec plusieurs connexions sortantes dans le même output
const nodesWithMultipleConnections = {};

Object.keys(workflow.connections || {}).forEach(sourceNode => {
  const connections = workflow.connections[sourceNode];
  if (connections.main) {
    connections.main.forEach((outputs, outputIndex) => {
      if (outputs && outputs.length > 1) {
        if (!nodesWithMultipleConnections[sourceNode]) {
          nodesWithMultipleConnections[sourceNode] = [];
        }
        nodesWithMultipleConnections[sourceNode].push({
          outputIndex,
          count: outputs.length,
          targets: outputs.map(c => c.node)
        });
      }
    });
  }
});

if (Object.keys(nodesWithMultipleConnections).length > 0) {
  console.log('❌ Nodes avec connexions multiples trouvés:');
  Object.entries(nodesWithMultipleConnections).forEach(([nodeName, outputs]) => {
    console.log(`\n   "${nodeName}":`);
    outputs.forEach((output, index) => {
      console.log(`      Output ${output.outputIndex}: ${output.count} connexion(s) → ${output.targets.join(', ')}`);
    });
  });
} else {
  console.log('✅ Aucun node avec connexions multiples');
}

// Trouver aussi les nodes qui ont plusieurs outputs (comme les IF/Switch)
const nodesWithMultipleOutputs = {};

Object.keys(workflow.connections || {}).forEach(sourceNode => {
  const connections = workflow.connections[sourceNode];
  if (connections.main && connections.main.length > 1) {
    nodesWithMultipleOutputs[sourceNode] = connections.main.map((outputs, index) => ({
      outputIndex: index,
      count: outputs?.length || 0,
      targets: outputs?.map(c => c.node) || []
    }));
  }
});

if (Object.keys(nodesWithMultipleOutputs).length > 0) {
  console.log('\n📊 Nodes avec plusieurs outputs (IF/Switch - normal):');
  Object.entries(nodesWithMultipleOutputs).forEach(([nodeName, outputs]) => {
    console.log(`   "${nodeName}": ${outputs.length} output(s)`);
    outputs.forEach((output, index) => {
      console.log(`      Output ${output.outputIndex}: ${output.count} connexion(s) → ${output.targets.join(', ') || 'AUCUNE'}`);
    });
  });
}

// Vérifier les nodes qui reçoivent des connexions de plusieurs sources
const nodesReceivingFromMultiple = {};
const nodeNames = new Set(workflow.nodes.map(n => n.name));

Object.keys(workflow.connections || {}).forEach(sourceNode => {
  workflow.connections[sourceNode].main?.forEach(outputs => {
    outputs?.forEach(conn => {
      if (nodeNames.has(conn.node)) {
        if (!nodesReceivingFromMultiple[conn.node]) {
          nodesReceivingFromMultiple[conn.node] = [];
        }
        nodesReceivingFromMultiple[conn.node].push(sourceNode);
      }
    });
  });
});

const nodesWithMultipleSources = Object.entries(nodesReceivingFromMultiple)
  .filter(([node, sources]) => sources.length > 1);

if (nodesWithMultipleSources.length > 0) {
  console.log('\n⚠️  Nodes recevant des connexions de plusieurs sources:');
  nodesWithMultipleSources.forEach(([nodeName, sources]) => {
    console.log(`   "${nodeName}" reçoit de: ${sources.join(', ')}`);
  });
} else {
  console.log('\n✅ Aucun node ne reçoit de connexions de plusieurs sources');
}

// Vérifier les nodes isolés (sans connexions entrantes ni sortantes)
const nodesWithIncoming = new Set();
const nodesWithOutgoing = new Set();

Object.keys(workflow.connections || {}).forEach(sourceNode => {
  nodesWithOutgoing.add(sourceNode);
  workflow.connections[sourceNode].main?.forEach(outputs => {
    outputs?.forEach(conn => {
      nodesWithIncoming.add(conn.node);
    });
  });
});

const triggerTypes = [
  'n8n-nodes-base.scheduleTrigger',
  'n8n-nodes-base.webhook',
  'n8n-nodes-base.manualTrigger',
  'n8n-nodes-base.gmailTrigger',
  'n8n-nodes-base.telegramTrigger',
  'n8n-nodes-base.chatTrigger'
];

const isolatedNodes = workflow.nodes.filter(n => 
  !triggerTypes.includes(n.type) && 
  !nodesWithIncoming.has(n.name) &&
  !nodesWithOutgoing.has(n.name)
);

if (isolatedNodes.length > 0) {
  console.log('\n🔴 Nodes isolés (créent des workflows séparés):');
  isolatedNodes.forEach(node => {
    console.log(`   - ${node.name} (${node.type})`);
  });
} else {
  console.log('\n✅ Aucun node isolé');
}

console.log('\n✅ Analyse terminée');

