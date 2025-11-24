/**
 * Script pour corriger les connexions dupliquées vers "Choose AI Model (IF)"
 * Il reçoit de "Debug Before Switch" et "🔍 Debug Before Switch" - doit être une seule source
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Correction des connexions dupliquées vers Choose AI Model (IF)...\n');

// Trouver tous les nodes Debug
const debugNodes = workflow.nodes.filter(n => 
  n.name === '🔍 Debug Before Switch' || 
  n.name === 'Debug Before Switch' ||
  (n.name.includes('Debug') && n.name.includes('Switch'))
);

console.log(`📋 Nodes Debug trouvés: ${debugNodes.length}`);
debugNodes.forEach((node, index) => {
  console.log(`   ${index + 1}. ${node.name} (ID: ${node.id}, Position: [${node.position?.[0]}, ${node.position?.[1]}])`);
});

// Identifier lequel est pour AI Model (avant le IF) et lequel est pour Preview (après Parse API Response)
const aiModelDebug = debugNodes.find(n => 
  n.position && n.position[0] < 20000 // Position X < 20000 = côté gauche (AI Model)
);

const previewDebug = debugNodes.find(n => 
  n.position && n.position[0] > 20000 // Position X > 20000 = côté droit (Preview)
);

console.log('\n🔍 Identification:');
if (aiModelDebug) {
  console.log(`   AI Model Debug: ${aiModelDebug.name} (Position: [${aiModelDebug.position?.[0]}, ${aiModelDebug.position?.[1]}])`);
}
if (previewDebug) {
  console.log(`   Preview Debug: ${previewDebug.name} (Position: [${previewDebug.position?.[0]}, ${previewDebug.position?.[1]}])`);
}

// Trouver "Choose AI Model (IF)"
const chooseAiModelIf = workflow.nodes.find(n => n.name === 'Choose AI Model (IF)');

if (chooseAiModelIf && aiModelDebug) {
  // "Choose AI Model (IF)" doit recevoir uniquement de "🔍 Debug Before Switch" (celui pour AI Model)
  // Supprimer toutes les autres connexions vers ce node
  
  // Parcourir toutes les connexions et corriger celles qui pointent vers "Choose AI Model (IF)"
  Object.keys(workflow.connections || {}).forEach(sourceNode => {
    workflow.connections[sourceNode].main?.forEach((outputs, outputIndex) => {
      outputs?.forEach((conn, connIndex) => {
        if (conn.node === 'Choose AI Model (IF)') {
          // Vérifier si la source est le bon Debug node
          if (sourceNode !== aiModelDebug.name) {
            console.log(`⚠️  Connexion incorrecte trouvée: ${sourceNode} → Choose AI Model (IF)`);
            // Supprimer cette connexion
            workflow.connections[sourceNode].main[outputIndex].splice(connIndex, 1);
            console.log(`   ✅ Connexion supprimée`);
          }
        }
      });
    });
  });
  
  // S'assurer que le bon Debug node se connecte au IF
  if (!workflow.connections[aiModelDebug.name]) {
    workflow.connections[aiModelDebug.name] = {};
  }
  if (!workflow.connections[aiModelDebug.name].main) {
    workflow.connections[aiModelDebug.name].main = [];
  }
  if (!workflow.connections[aiModelDebug.name].main[0]) {
    workflow.connections[aiModelDebug.name].main[0] = [];
  }
  
  // Vérifier si la connexion existe déjà
  const existingConnection = workflow.connections[aiModelDebug.name].main[0].find(
    c => c.node === 'Choose AI Model (IF)'
  );
  
  if (!existingConnection) {
    workflow.connections[aiModelDebug.name].main[0].push({
      node: 'Choose AI Model (IF)',
      type: 'main',
      index: 0
    });
    console.log(`✅ Connexion ajoutée: ${aiModelDebug.name} → Choose AI Model (IF)`);
  } else {
    console.log(`✅ Connexion correcte déjà présente: ${aiModelDebug.name} → Choose AI Model (IF)`);
  }
}

// Corriger aussi "Parse API Response" pour qu'il se connecte au bon Debug (celui pour Preview)
const parseApiResponseNode = workflow.nodes.find(n => n.name === 'Parse API Response');

if (parseApiResponseNode && previewDebug) {
  if (!workflow.connections['Parse API Response']) {
    workflow.connections['Parse API Response'] = {};
  }
  workflow.connections['Parse API Response'].main = [[{
    node: previewDebug.name,
    type: 'main',
    index: 0
  }]];
  console.log(`✅ Connexion corrigée: Parse API Response → ${previewDebug.name}`);
}

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Toutes les connexions dupliquées corrigées !');

