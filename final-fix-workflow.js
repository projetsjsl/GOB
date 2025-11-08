/**
 * Correction finale du workflow - Nettoyer toutes les références orphelines
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowFile = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowFile, 'utf-8'));

console.log('🔧 Nettoyage final du workflow...\n');

// 1. Liste des noms de nœuds valides
const validNodeNames = workflow.nodes.map(n => n.name);
console.log(`✅ ${validNodeNames.length} nœuds valides`);

// 2. Nettoyer les connexions - supprimer les références à des nœuds inexistants
let cleanedConnections = {};
let errors = [];

Object.entries(workflow.connections).forEach(([nodeName, connections]) => {
  // Vérifier que le nœud source existe
  if (!validNodeNames.includes(nodeName)) {
    console.log(`⚠️  Connexion orpheline supprimée: ${nodeName}`);
    return; // Ignorer cette connexion
  }
  
  // Nettoyer les connexions de sortie
  if (connections.main) {
    const cleanedMain = connections.main.map((outputArray, outputIndex) => {
      return outputArray.filter(conn => {
        if (!validNodeNames.includes(conn.node)) {
          console.log(`⚠️  Référence invalide supprimée: ${nodeName} → ${conn.node}`);
          errors.push(`${nodeName} → ${conn.node} (nœud inexistant)`);
          return false;
        }
        return true;
      });
    }).filter(arr => arr.length > 0); // Supprimer les tableaux vides
    
    if (cleanedMain.length > 0) {
      cleanedConnections[nodeName] = {
        main: cleanedMain
      };
    }
  }
});

workflow.connections = cleanedConnections;

// 3. Vérifier que tous les nœuds critiques ont des connexions
const criticalNodes = [
  'Prepare API Request',
  'Call /api/chat (Emma)',
  'Parse API Response'
];

criticalNodes.forEach(nodeName => {
  if (!workflow.connections[nodeName]) {
    console.log(`⚠️  ${nodeName} n'a pas de connexions`);
  }
});

// 4. Vérifier le flux principal
const flow = [
  'Prepare API Request',
  'Call /api/chat (Emma)',
  'Parse API Response'
];

let flowOk = true;
for (let i = 0; i < flow.length - 1; i++) {
  const from = flow[i];
  const to = flow[i + 1];
  
  const hasConnection = workflow.connections[from]?.main?.[0]?.some(
    conn => conn.node === to
  );
  
  if (!hasConnection) {
    console.log(`❌ Connexion manquante: ${from} → ${to}`);
    flowOk = false;
    
    // Créer la connexion manquante
    if (!workflow.connections[from]) {
      workflow.connections[from] = { main: [[]] };
    }
    if (!workflow.connections[from].main[0]) {
      workflow.connections[from].main[0] = [];
    }
    workflow.connections[from].main[0].push({
      node: to,
      type: 'main',
      index: 0
    });
    console.log(`✅ Connexion créée: ${from} → ${to}`);
  }
}

// 5. Sauvegarder
writeFileSync(workflowFile, JSON.stringify(workflow, null, 2));

console.log('\n✅ Workflow nettoyé!');
if (errors.length > 0) {
  console.log(`\n⚠️  ${errors.length} erreur(s) corrigée(s):`);
  errors.forEach(e => console.log(`   - ${e}`));
} else {
  console.log('\n✅ Aucune erreur trouvée');
}

