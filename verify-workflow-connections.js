/**
 * Vérifier toutes les connexions du workflow
 */

import { readFileSync } from 'fs';

const workflowFile = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowFile, 'utf-8'));

console.log('🔍 Vérification des connexions du workflow...\n');

const nodeNames = workflow.nodes.map(n => n.name);
const connectionNodes = Object.keys(workflow.connections);

console.log(`📊 Statistiques:`);
console.log(`   Nodes: ${nodeNames.length}`);
console.log(`   Connexions définies: ${connectionNodes.length}\n`);

// Vérifier que toutes les connexions pointent vers des nœuds existants
let errors = [];
let warnings = [];

Object.entries(workflow.connections).forEach(([fromNode, connections]) => {
  if (!nodeNames.includes(fromNode)) {
    errors.push(`❌ Node "${fromNode}" dans connections mais n'existe pas dans nodes`);
  }
  
  if (connections.main) {
    connections.main.forEach((outputArray, outputIndex) => {
      outputArray.forEach(conn => {
        if (!nodeNames.includes(conn.node)) {
          errors.push(`❌ Connection de "${fromNode}" vers "${conn.node}" - node inexistant`);
        }
      });
    });
  }
});

// Vérifier les nœuds critiques
const criticalNodes = [
  'Merge Triggers',
  'Workflow Configuration',
  'Get Active Tickers',
  'Determine Time-Based Prompt',
  'Prepare API Request',
  'Call /api/emma-n8n (Briefing)',
  'Parse API Response',
  'Generate HTML Newsletter',
  'Send Email via Resend'
];

console.log('🔍 Vérification des nœuds critiques:');
criticalNodes.forEach(nodeName => {
  const exists = nodeNames.includes(nodeName);
  const hasConnections = connectionNodes.includes(nodeName);
  
  if (exists && hasConnections) {
    console.log(`   ✅ ${nodeName}`);
  } else if (exists && !hasConnections) {
    console.log(`   ⚠️  ${nodeName} (existe mais pas de connexions)`);
    warnings.push(`${nodeName} n'a pas de connexions définies`);
  } else {
    console.log(`   ❌ ${nodeName} (MANQUANT)`);
    errors.push(`Node critique manquant: ${nodeName}`);
  }
});

// Vérifier le flux principal
console.log('\n📋 Flux principal attendu:');
const flow = [
  'Merge Triggers',
  'Workflow Configuration',
  'Get Active Tickers',
  'Determine Time-Based Prompt',
  'Prepare API Request',
  'Call /api/emma-n8n (Briefing)',
  'Parse API Response',
  'Generate HTML Newsletter',
  'Send Email via Resend'
];

flow.forEach((nodeName, index) => {
  const exists = nodeNames.includes(nodeName);
  const nextNode = flow[index + 1];
  
  if (exists) {
    if (nextNode) {
      const hasConnection = workflow.connections[nodeName]?.main?.[0]?.some(
        conn => conn.node === nextNode
      );
      if (hasConnection) {
        console.log(`   ✅ ${nodeName} → ${nextNode}`);
      } else {
        console.log(`   ⚠️  ${nodeName} → ${nextNode} (connexion manquante)`);
        warnings.push(`Connexion manquante: ${nodeName} → ${nextNode}`);
      }
    } else {
      console.log(`   ✅ ${nodeName} (fin du flux)`);
    }
  } else {
    console.log(`   ❌ ${nodeName} (MANQUANT)`);
  }
});

// Résumé
console.log('\n📊 Résumé:');
if (errors.length === 0 && warnings.length === 0) {
  console.log('   ✅ Toutes les connexions sont correctes!');
} else {
  if (errors.length > 0) {
    console.log(`\n❌ Erreurs (${errors.length}):`);
    errors.forEach(e => console.log(`   ${e}`));
  }
  if (warnings.length > 0) {
    console.log(`\n⚠️  Avertissements (${warnings.length}):`);
    warnings.forEach(w => console.log(`   ${w}`));
  }
}

process.exit(errors.length > 0 ? 1 : 0);
