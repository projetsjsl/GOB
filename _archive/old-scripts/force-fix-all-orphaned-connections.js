/**
 * Script pour forcer la correction de TOUTES les connexions orphelines
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Correction forcée de toutes les connexions orphelines...\n');

// Créer un map de tous les noms de nodes
const nodeNames = new Set(workflow.nodes.map(n => n.name));
console.log(`✅ ${nodeNames.size} nodes trouvés`);

// Parcourir toutes les connexions et corriger les références orphelines
let fixedCount = 0;
const oldToNewNames = {
  '🤖 Choose AI Model': 'Choose AI Model (IF)',
  'Debug Before Switch': '🔍 Debug Before Switch'
};

Object.keys(workflow.connections || {}).forEach(sourceNode => {
  // Vérifier si le node source existe
  if (!nodeNames.has(sourceNode)) {
    console.log(`⚠️  Node source n'existe pas: ${sourceNode}`);
    return;
  }
  
  workflow.connections[sourceNode].main?.forEach((outputs, outputIndex) => {
    outputs?.forEach((conn, connIndex) => {
      // Vérifier si le node cible existe
      if (!nodeNames.has(conn.node)) {
        // Essayer de trouver un nom de remplacement
        const newName = oldToNewNames[conn.node] || 
          workflow.nodes.find(n => 
            n.name.includes(conn.node.split(' ').pop()) || 
            conn.node.includes(n.name.split(' ').pop())
          )?.name;
        
        if (newName && nodeNames.has(newName)) {
          console.log(`✅ Correction: ${sourceNode} → ${conn.node} → ${newName}`);
          workflow.connections[sourceNode].main[outputIndex][connIndex].node = newName;
          fixedCount++;
        } else {
          console.log(`❌ Impossible de corriger: ${sourceNode} → ${conn.node}`);
        }
      }
    });
  });
});

// Correction spécifique pour "🔍 Debug Before Switch"
const debugNodeName = workflow.nodes.find(n => 
  n.name === '🔍 Debug Before Switch' || n.name.includes('Debug Before Switch')
)?.name;

const ifNodeName = workflow.nodes.find(n => 
  n.name === 'Choose AI Model (IF)'
)?.name;

if (debugNodeName && ifNodeName && workflow.connections[debugNodeName]) {
  const debugConnections = workflow.connections[debugNodeName].main?.[0];
  if (debugConnections && debugConnections.length > 0) {
    debugConnections.forEach(conn => {
      if (conn.node !== ifNodeName) {
        console.log(`✅ Correction forcée: ${debugNodeName} → ${conn.node} → ${ifNodeName}`);
        conn.node = ifNodeName;
        fixedCount++;
      }
    });
  }
}

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log(`\n✅ ${fixedCount} connexion(s) corrigée(s) !`);

// Vérification finale
console.log('\n🔍 Vérification finale:');
const nodeNamesFinal = new Set(workflow.nodes.map(n => n.name));
let orphanedFinal = 0;

Object.keys(workflow.connections || {}).forEach(sourceNode => {
  workflow.connections[sourceNode].main?.forEach(outputs => {
    outputs?.forEach(conn => {
      if (!nodeNamesFinal.has(conn.node)) {
        orphanedFinal++;
        console.log(`   ❌ ${sourceNode} → ${conn.node}`);
      }
    });
  });
});

if (orphanedFinal === 0) {
  console.log('   ✅ Aucune connexion orpheline restante !');
} else {
  console.log(`   ⚠️  ${orphanedFinal} connexion(s) orpheline(s) restante(s)`);
}

