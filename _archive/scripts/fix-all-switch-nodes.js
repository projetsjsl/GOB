/**
 * Script pour supprimer TOUS les nœuds Switch et corriger les connexions
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowFile = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowFile, 'utf-8'));

console.log('🔍 Recherche de tous les nœuds Switch...\n');

// 1. Trouver tous les nœuds Switch
const switchNodes = workflow.nodes.filter(n => 
  n.type === 'n8n-nodes-base.switch' || n.name === 'Switch' || n.name === 'Route by API'
);

console.log(`✅ Trouvé ${switchNodes.length} nœud(s) Switch:`);
switchNodes.forEach(node => {
  console.log(`   - ${node.name} (ID: ${node.id})`);
});

if (switchNodes.length === 0) {
  console.log('\n✅ Aucun nœud Switch trouvé. Le workflow est déjà propre.');
  process.exit(0);
}

// 2. Trouver les nœuds connectés aux Switch
const switchIds = switchNodes.map(n => n.id);
const switchNames = switchNodes.map(n => n.name);

// Trouver les nœuds qui se connectent AUX Switch (entrées)
const nodesConnectingToSwitch = [];
Object.entries(workflow.connections).forEach(([nodeName, connections]) => {
  if (connections.main) {
    connections.main.forEach((outputArray, outputIndex) => {
      outputArray.forEach(connection => {
        if (switchNames.includes(connection.node)) {
          nodesConnectingToSwitch.push({
            from: nodeName,
            to: connection.node,
            outputIndex
          });
        }
      });
    });
  }
});

// Trouver les nœuds qui sortent DES Switch (sorties)
const nodesFromSwitch = [];
switchNames.forEach(switchName => {
  if (workflow.connections[switchName]) {
    workflow.connections[switchName].main.forEach((outputArray, outputIndex) => {
      outputArray.forEach(connection => {
        nodesFromSwitch.push({
          from: switchName,
          to: connection.node,
          outputIndex
        });
      });
    });
  }
});

console.log('\n📊 Connexions trouvées:');
console.log(`   Entrées vers Switch: ${nodesConnectingToSwitch.length}`);
console.log(`   Sorties depuis Switch: ${nodesFromSwitch.length}`);

// 3. Supprimer les nœuds Switch
workflow.nodes = workflow.nodes.filter(n => !switchIds.includes(n.id));

// 4. Supprimer les connexions des Switch
switchNames.forEach(switchName => {
  delete workflow.connections[switchName];
});

// 5. Reconnecter directement les nœuds
// Pour chaque nœud qui se connectait à un Switch, le connecter directement au nœud suivant
nodesConnectingToSwitch.forEach(({ from, to: switchName }) => {
  // Trouver le premier nœud de sortie du Switch (généralement output 0)
  const switchOutputs = nodesFromSwitch.filter(n => n.from === switchName);
  
  if (switchOutputs.length > 0) {
    // Prendre la première sortie (output 0)
    const firstOutput = switchOutputs.find(n => n.outputIndex === 0) || switchOutputs[0];
    const targetNode = firstOutput.to;
    
    // Mettre à jour la connexion
    if (workflow.connections[from]) {
      workflow.connections[from].main = workflow.connections[from].main.map(outputArray => {
        return outputArray.map(conn => {
          if (conn.node === switchName) {
            return {
              ...conn,
              node: targetNode
            };
          }
          return conn;
        });
      });
    }
  }
});

// 6. Trouver "Merge Triggers" et voir où il se connecte
const mergeTriggersNode = workflow.nodes.find(n => n.name === 'Merge Triggers');
const workflowConfigNode = workflow.nodes.find(n => n.name === 'Workflow Configuration');

if (mergeTriggersNode && workflowConfigNode) {
  // Si Merge Triggers se connecte à Switch, le connecter directement à Workflow Configuration
  if (workflow.connections['Merge Triggers']) {
    workflow.connections['Merge Triggers'].main = workflow.connections['Merge Triggers'].main.map(outputArray => {
      return outputArray.map(conn => {
        if (switchNames.includes(conn.node)) {
          return {
            ...conn,
            node: 'Workflow Configuration'
          };
        }
        return conn;
      });
    });
  }
}

// 7. Vérifier que "Get Active Tickers" se connecte bien à "Determine Time-Based Prompt"
const getTickersNode = workflow.nodes.find(n => n.name === 'Get Active Tickers');
const determinePromptNode = workflow.nodes.find(n => n.name === 'Determine Time-Based Prompt');

if (getTickersNode && determinePromptNode) {
  // S'assurer que Get Active Tickers se connecte à Determine Time-Based Prompt
  if (!workflow.connections['Get Active Tickers']) {
    workflow.connections['Get Active Tickers'] = {
      main: [[
        {
          node: 'Determine Time-Based Prompt',
          type: 'main',
          index: 0
        }
      ]]
    };
  }
}

// 8. Vérifier que "Prepare API Request" se connecte bien à "Call /api/emma-n8n (Briefing)"
const prepareApiNode = workflow.nodes.find(n => n.name === 'Prepare API Request');
const emmaN8nNode = workflow.nodes.find(n => n.name === 'Call /api/emma-n8n (Briefing)');

if (prepareApiNode && emmaN8nNode) {
  if (!workflow.connections['Prepare API Request']) {
    workflow.connections['Prepare API Request'] = {
      main: [[
        {
          node: 'Call /api/emma-n8n (Briefing)',
          type: 'main',
          index: 0
        }
      ]]
    };
  } else {
    // Mettre à jour la connexion existante
    workflow.connections['Prepare API Request'].main = [[
      {
        node: 'Call /api/emma-n8n (Briefing)',
        type: 'main',
        index: 0
      }
    ]];
  }
}

// 9. Sauvegarder
writeFileSync(workflowFile, JSON.stringify(workflow, null, 2));

console.log('\n✅ Workflow corrigé!');
console.log(`   - ${switchNodes.length} nœud(s) Switch supprimé(s)`);
console.log(`   - Connexions corrigées`);
console.log(`   - Workflow sauvegardé dans ${workflowFile}`);

// 10. Vérifier qu'il n'y a plus de Switch
const remainingSwitches = workflow.nodes.filter(n => 
  n.type === 'n8n-nodes-base.switch' || n.name === 'Switch' || n.name === 'Route by API'
);

if (remainingSwitches.length > 0) {
  console.log(`\n⚠️  ATTENTION: ${remainingSwitches.length} nœud(s) Switch restant(s)!`);
  remainingSwitches.forEach(n => console.log(`   - ${n.name} (ID: ${n.id})`));
} else {
  console.log('\n✅ Aucun nœud Switch restant. Le workflow est propre!');
}

