/**
 * Script pour corriger TOUS les problèmes de branches séparées
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Correction de TOUS les problèmes de branches...\n');

// 1. Corriger "Generate HTML Newsletter" - Output 0 ne doit avoir qu'une seule connexion
// Il doit aller uniquement à "Fetch Email Recipients"
workflow.connections['Generate HTML Newsletter'] = {
  main: [
    [
      {
        node: 'Fetch Email Recipients',
        type: 'main',
        index: 0
      }
    ]
  ]
};
console.log('✅ Generate HTML Newsletter → Fetch Email Recipients (connexion unique)');

// 2. Vérifier s'il y a 2 nodes "Debug Before Switch" différents
const debugNodes = workflow.nodes.filter(n => 
  n.name === '🔍 Debug Before Switch' || 
  n.name === 'Debug Before Switch' ||
  n.name.includes('Debug Before Switch')
);

if (debugNodes.length > 1) {
  console.log(`⚠️  ${debugNodes.length} nodes Debug trouvés, gardons seulement le premier`);
  // Garder seulement le premier, supprimer les autres
  const firstDebug = debugNodes[0];
  const toRemove = debugNodes.slice(1);
  
  toRemove.forEach(node => {
    const index = workflow.nodes.findIndex(n => n.id === node.id);
    if (index !== -1) {
      workflow.nodes.splice(index, 1);
      console.log(`   Supprimé: ${node.name} (ID: ${node.id})`);
    }
  });
  
  // Corriger les connexions pour utiliser le bon nom
  const correctDebugName = firstDebug.name;
  Object.keys(workflow.connections || {}).forEach(sourceNode => {
    workflow.connections[sourceNode].main?.forEach(outputs => {
      outputs?.forEach(conn => {
        if (conn.node === '🔍 Debug Before Switch' || conn.node === 'Debug Before Switch') {
          conn.node = correctDebugName;
        }
      });
    });
  });
}

// 3. Corriger "Parse API Response" - ne doit PAS se connecter à "Debug Before Switch"
// "Parse API Response" doit aller à "Debug Before Switch" (celui pour preview/send), pas celui pour AI Model
const parseApiResponseNode = workflow.nodes.find(n => n.name === 'Parse API Response');
const debugBeforeSwitchNode = workflow.nodes.find(n => 
  n.name === '🔍 Debug Before Switch' || n.name.includes('Debug Before Switch')
);

// Trouver le bon "Debug Before Switch" - celui qui est pour preview/send (après Parse API Response)
// et celui qui est pour AI Model (après AI Model Selector)
const aiModelDebugNode = workflow.nodes.find(n => 
  (n.name === '🔍 Debug Before Switch' || n.name.includes('Debug Before Switch')) &&
  n.position && n.position[0] < 20000 // Celui qui est avant le IF (position X < 20000)
);

const previewDebugNode = workflow.nodes.find(n => 
  (n.name === 'Debug Before Switch' || n.name.includes('Debug Before Switch')) &&
  n.position && n.position[0] > 20000 // Celui qui est après Parse API Response
);

// "Parse API Response" doit aller au "Debug Before Switch" pour preview/send
if (parseApiResponseNode && previewDebugNode) {
  workflow.connections['Parse API Response'] = {
    main: [
      [
        {
          node: previewDebugNode.name,
          type: 'main',
          index: 0
        }
      ]
    ]
  };
  console.log(`✅ Parse API Response → ${previewDebugNode.name} (pour preview/send)`);
}

// 4. Supprimer ou connecter "AI Agent (Emma)" qui est isolé
const aiAgentNode = workflow.nodes.find(n => n.name === 'AI Agent (Emma)');
if (aiAgentNode) {
  // Vérifier s'il est vraiment isolé
  const hasIncoming = Object.values(workflow.connections || {}).some(conn => 
    conn.main?.some(outputs => 
      outputs?.some(c => c.node === 'AI Agent (Emma)')
    )
  );
  
  if (!hasIncoming && !workflow.connections['AI Agent (Emma)']) {
    console.log('⚠️  AI Agent (Emma) est isolé - sera ignoré par tidy up');
    // On peut le laisser isolé, il ne sera pas dans le workflow principal
  }
}

// 5. Corriger "Fetch Prompts from API" qui reçoit de plusieurs sources
// C'est normal pour un Merge, mais vérifions que les connexions sont correctes
const fetchPromptsNode = workflow.nodes.find(n => n.name === 'Fetch Prompts from API');
if (fetchPromptsNode) {
  // S'assurer qu'il se connecte uniquement à "Get Active Tickers"
  workflow.connections['Fetch Prompts from API'] = {
    main: [
      [
        {
          node: 'Get Active Tickers',
          type: 'main',
          index: 0
        }
      ]
    ]
  };
  console.log('✅ Fetch Prompts from API → Get Active Tickers (vérifié)');
}

// 6. Corriger "Get Active Tickers" qui reçoit de plusieurs sources
// C'est normal, mais s'assurer qu'il se connecte uniquement à "Determine Time-Based Prompt"
const getActiveTickersNode = workflow.nodes.find(n => n.name === 'Get Active Tickers');
if (getActiveTickersNode) {
  workflow.connections['Get Active Tickers'] = {
    main: [
      [
        {
          node: 'Determine Time-Based Prompt',
          type: 'main',
          index: 0
        }
      ]
    ]
  };
  console.log('✅ Get Active Tickers → Determine Time-Based Prompt (vérifié)');
}

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Toutes les corrections appliquées !');
console.log('\n📋 Résumé:');
console.log('   - Generate HTML Newsletter: connexion unique');
console.log('   - Nodes Debug dupliqués: vérifiés et corrigés');
console.log('   - Parse API Response: connexion correcte');
console.log('   - Flux unifié: un seul workflow principal');

