/**
 * Script pour trouver les nodes dupliqués qui causent des workflows séparés
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔍 Recherche de nodes dupliqués...\n');

// Compter les occurrences de chaque nom de node
const nodeNameCounts = {};
workflow.nodes.forEach(node => {
  const name = node.name;
  if (!nodeNameCounts[name]) {
    nodeNameCounts[name] = [];
  }
  }
  nodeNameCounts[name] = nodeNameCounts[name] || [];
  nodeNameCounts[name].push(node);
});

// Trouver les noms dupliqués
const duplicates = Object.entries(nodeNameCounts).filter(([name, nodes]) => nodes.length > 1);

if (duplicates.length > 0) {
  console.log('❌ Nodes dupliqués trouvés:');
  duplicates.forEach(([name, nodes]) => {
    console.log(`\n   "${name}": ${nodes.length} occurrences`);
    nodes.forEach((node, index) => {
      console.log(`      ${index + 1}. ID: ${node.id}, Type: ${node.type}, Position: [${node.position?.[0] || 'N/A'}, ${node.position?.[1] || 'N/A'}]`);
    });
  });
} else {
  console.log('✅ Aucun node dupliqué trouvé');
}

// Vérifier aussi les connexions multiples qui pourraient créer des branches
console.log('\n🔗 Vérification des connexions multiples...\n');

const nodesWithMultipleOutputs = {};
Object.keys(workflow.connections || {}).forEach(sourceNode => {
  const connections = workflow.connections[sourceNode];
  if (connections.main) {
    connections.main.forEach((outputs, outputIndex) => {
      if (outputs && outputs.length > 1) {
        if (!nodesWithMultipleOutputs[sourceNode]) {
          nodesWithMultipleOutputs[sourceNode] = [];
        }
        nodesWithMultipleOutputs[sourceNode].push({
          outputIndex,
          targets: outputs.map(c => c.node)
        });
      }
    });
  }
});

if (Object.keys(nodesWithMultipleOutputs).length > 0) {
  console.log('⚠️  Nodes avec plusieurs connexions sortantes:');
  Object.entries(nodesWithMultipleOutputs).forEach(([nodeName, outputs]) => {
    console.log(`\n   "${nodeName}":`);
    outputs.forEach((output, index) => {
      console.log(`      Output ${output.outputIndex}: ${output.targets.length} connexion(s) → ${output.targets.join(', ')}`);
    });
  });
} else {
  console.log('✅ Aucun node avec connexions multiples suspectes');
}

// Vérifier les nodes isolés (sans connexions entrantes ni sortantes)
console.log('\n📦 Vérification des nodes isolés...\n');

const nodeNames = new Set(workflow.nodes.map(n => n.name));
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

const triggerTypes = ['n8n-nodes-base.scheduleTrigger', 'n8n-nodes-base.webhook', 'n8n-nodes-base.manualTrigger', 'n8n-nodes-base.gmailTrigger', 'n8n-nodes-base.telegramTrigger'];
const isolatedNodes = workflow.nodes.filter(n => 
  !triggerTypes.includes(n.type) && 
  !nodesWithIncoming.has(n.name) &&
  !nodesWithOutgoing.has(n.name)
);

if (isolatedNodes.length > 0) {
  console.log('⚠️  Nodes isolés (sans connexions):');
  isolatedNodes.forEach(node => {
    console.log(`   - ${node.name} (${node.type})`);
  });
} else {
  console.log('✅ Aucun node isolé');
}

// Vérifier spécifiquement les nodes qui pourraient causer des branches séparées
console.log('\n🔀 Vérification des branches séparées potentielles...\n');

// Chercher les nodes qui ont des connexions vers "Determine Time-Based Prompt" ou d'autres nodes critiques
const criticalNodes = ['Determine Time-Based Prompt', 'Fetch Prompts from API', 'Get Active Tickers'];
const nodesConnectingToCritical = {};

criticalNodes.forEach(criticalNode => {
  Object.keys(workflow.connections || {}).forEach(sourceNode => {
    workflow.connections[sourceNode].main?.forEach(outputs => {
      outputs?.forEach(conn => {
        if (conn.node === criticalNode) {
          if (!nodesConnectingToCritical[criticalNode]) {
            nodesConnectingToCritical[criticalNode] = [];
          }
          nodesConnectingToCritical[criticalNode].push(sourceNode);
        }
      });
    });
  });
});

Object.entries(nodesConnectingToCritical).forEach(([criticalNode, sources]) => {
  if (sources.length > 1) {
    console.log(`⚠️  "${criticalNode}" reçoit des connexions de ${sources.length} sources:`);
    sources.forEach(source => console.log(`      - ${source}`));
  }
});

console.log('\n✅ Analyse terminée');

