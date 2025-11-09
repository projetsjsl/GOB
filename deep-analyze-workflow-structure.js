/**
 * Analyse approfondie de la structure du workflow
 * pour identifier ce qui crée des branches séparées
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔍 Analyse approfondie de la structure du workflow...\n');

// 1. Trouver tous les triggers (points d'entrée)
const triggerTypes = [
  'n8n-nodes-base.scheduleTrigger',
  'n8n-nodes-base.webhook',
  'n8n-nodes-base.manualTrigger',
  'n8n-nodes-base.gmailTrigger',
  'n8n-nodes-base.telegramTrigger',
  'n8n-nodes-base.chatTrigger'
];

const triggers = workflow.nodes.filter(n => triggerTypes.includes(n.type));
console.log(`📌 Triggers trouvés: ${triggers.length}`);
triggers.forEach(t => console.log(`   - ${t.name} (${t.type})`));

// 2. Construire le graphe de connexions
const nodeNames = new Set(workflow.nodes.map(n => n.name));
const incomingConnections = new Map();
const outgoingConnections = new Map();

// Initialiser les maps
workflow.nodes.forEach(node => {
  incomingConnections.set(node.name, []);
  outgoingConnections.set(node.name, []);
});

// Construire le graphe
Object.keys(workflow.connections || {}).forEach(sourceNode => {
  if (!nodeNames.has(sourceNode)) {
    console.log(`⚠️  Node source n'existe pas: ${sourceNode}`);
    return;
  }
  
  workflow.connections[sourceNode].main?.forEach((outputs, outputIndex) => {
    outputs?.forEach(conn => {
      if (nodeNames.has(conn.node)) {
        outgoingConnections.get(sourceNode).push({
          target: conn.node,
          outputIndex
        });
        incomingConnections.get(conn.node).push({
          source: sourceNode,
          outputIndex
        });
      } else {
        console.log(`⚠️  Node cible n'existe pas: ${sourceNode} → ${conn.node}`);
      }
    });
  });
});

// 3. Trouver les composantes connexes (workflows séparés)
const visited = new Set();
const components = [];

function dfs(nodeName, component) {
  if (visited.has(nodeName)) return;
  visited.add(nodeName);
  component.add(nodeName);
  
  // Visiter les nodes sortants
  outgoingConnections.get(nodeName).forEach(conn => {
    dfs(conn.target, component);
  });
  
  // Visiter les nodes entrants
  incomingConnections.get(nodeName).forEach(conn => {
    dfs(conn.source, component);
  });
}

workflow.nodes.forEach(node => {
  if (!visited.has(node.name)) {
    const component = new Set();
    dfs(node.name, component);
    if (component.size > 0) {
      components.push(component);
    }
  }
});

console.log(`\n📊 Composantes connexes trouvées: ${components.length}`);
components.forEach((component, index) => {
  console.log(`\n   Composante ${index + 1} (${component.size} nodes):`);
  const componentArray = Array.from(component);
  componentArray.slice(0, 10).forEach(nodeName => {
    const node = workflow.nodes.find(n => n.name === nodeName);
    const isTrigger = triggerTypes.includes(node?.type);
    const incoming = incomingConnections.get(nodeName).length;
    const outgoing = outgoingConnections.get(nodeName).length;
    console.log(`      - ${nodeName}${isTrigger ? ' [TRIGGER]' : ''} (in: ${incoming}, out: ${outgoing})`);
  });
  if (componentArray.length > 10) {
    console.log(`      ... et ${componentArray.length - 10} autres nodes`);
  }
});

// 4. Identifier les nodes isolés ou dans des composantes séparées
if (components.length > 1) {
  console.log(`\n❌ PROBLÈME: ${components.length} workflows séparés détectés !`);
  
  // Trouver la composante principale (celle avec le plus de nodes)
  const mainComponent = components.reduce((max, comp) => 
    comp.size > max.size ? comp : max
  );
  
  console.log(`\n   Composante principale: ${mainComponent.size} nodes`);
  
  // Trouver les autres composantes (workflows séparés)
  const otherComponents = components.filter(comp => comp !== mainComponent);
  otherComponents.forEach((component, index) => {
    console.log(`\n   Workflow séparé ${index + 1} (${component.size} nodes):`);
    Array.from(component).forEach(nodeName => {
      const node = workflow.nodes.find(n => n.name === nodeName);
      console.log(`      - ${nodeName} (${node?.type})`);
    });
  });
} else {
  console.log(`\n✅ Un seul workflow unifié détecté !`);
}

// 5. Vérifier les nodes sans connexions
const isolatedNodes = workflow.nodes.filter(n => {
  const incoming = incomingConnections.get(n.name).length;
  const outgoing = outgoingConnections.get(n.name).length;
  return incoming === 0 && outgoing === 0 && !triggerTypes.includes(n.type);
});

if (isolatedNodes.length > 0) {
  console.log(`\n🔴 Nodes isolés (${isolatedNodes.length}):`);
  isolatedNodes.forEach(node => {
    console.log(`   - ${node.name} (${node.type})`);
  });
}

console.log('\n✅ Analyse terminée');

