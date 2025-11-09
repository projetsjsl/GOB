/**
 * Script pour supprimer le node isolé "AI Agent (Emma)"
 * qui crée un workflow séparé
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Suppression du node isolé "AI Agent (Emma)"...\n');

// Trouver le node isolé
const aiAgentNode = workflow.nodes.find(n => n.name === 'AI Agent (Emma)');

if (aiAgentNode) {
  // Vérifier qu'il n'a pas de connexions
  const hasIncoming = Object.values(workflow.connections || {}).some(conn => 
    conn.main?.some(outputs => 
      outputs?.some(c => c.node === 'AI Agent (Emma)')
    )
  );
  
  const hasOutgoing = workflow.connections?.['AI Agent (Emma)'];
  
  if (!hasIncoming && !hasOutgoing) {
    // Supprimer le node
    const index = workflow.nodes.findIndex(n => n.id === aiAgentNode.id);
    if (index !== -1) {
      workflow.nodes.splice(index, 1);
      console.log(`✅ Node isolé supprimé: ${aiAgentNode.name} (ID: ${aiAgentNode.id})`);
    }
  } else {
    console.log(`⚠️  Node "AI Agent (Emma)" a des connexions, ne sera pas supprimé`);
    if (hasIncoming) console.log('   - A des connexions entrantes');
    if (hasOutgoing) console.log('   - A des connexions sortantes');
  }
} else {
  console.log('✅ Node "AI Agent (Emma)" n\'existe pas ou a déjà été supprimé');
}

// Vérifier aussi s'il y a des connexions orphelines vers ce node
if (workflow.connections && workflow.connections['AI Agent (Emma)']) {
  delete workflow.connections['AI Agent (Emma)'];
  console.log('✅ Connexions orphelines supprimées');
}

// Vérifier s'il y a encore des nodes "Debug Before Switch" dupliqués
const debugNodes = workflow.nodes.filter(n => 
  n.name === '🔍 Debug Before Switch' || 
  n.name === 'Debug Before Switch' ||
  (n.name.includes('Debug') && n.name.includes('Switch'))
);

if (debugNodes.length > 1) {
  console.log(`\n⚠️  ${debugNodes.length} nodes Debug trouvés:`);
  debugNodes.forEach((node, index) => {
    console.log(`   ${index + 1}. ${node.name} (ID: ${node.id}, Position: [${node.position?.[0]}, ${node.position?.[1]}])`);
  });
  
  // Garder seulement celui qui est dans le flux AI Model (position X < 20000)
  const aiModelDebug = debugNodes.find(n => 
    n.position && n.position[0] < 20000
  );
  
  const previewDebug = debugNodes.find(n => 
    n.position && n.position[0] > 20000
  );
  
  if (aiModelDebug && previewDebug) {
    console.log(`\n✅ Deux nodes Debug trouvés (normal):`);
    console.log(`   - ${aiModelDebug.name} (pour AI Model)`);
    console.log(`   - ${previewDebug.name} (pour Preview)`);
  } else {
    // Supprimer les duplicatas
    const toKeep = debugNodes[0];
    const toRemove = debugNodes.slice(1);
    
    toRemove.forEach(node => {
      const index = workflow.nodes.findIndex(n => n.id === node.id);
      if (index !== -1) {
        workflow.nodes.splice(index, 1);
        console.log(`   Supprimé: ${node.name} (ID: ${node.id})`);
      }
    });
  }
}

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Nettoyage terminé !');

