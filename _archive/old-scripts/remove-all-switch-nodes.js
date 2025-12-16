/**
 * Supprimer TOUS les nodes Switch du workflow
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const N8N_URL = 'https://projetsjsl.app.n8n.cloud';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjZjBjNGVjMS1kMjQ3LTRiMTItYmM4My0wNGE1YzIzNjQ5ZmIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYwOTc5NTkwfQ.QVXxfNeYOT2UcUTXiSvsavKF6xugvza61fOZpQZzOYA';
const WORKFLOW_ID = '03lgcA4e9uRTtli1';

async function removeAllSwitchNodes() {
  try {
    console.log('🔧 Suppression de TOUS les nodes Switch...\n');

    // 1. Récupérer le workflow actuel
    const getResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });

    if (!getResponse.ok) {
      throw new Error(`Failed to get workflow: ${getResponse.status}`);
    }

    const workflow = await getResponse.json();
    console.log(`✅ Workflow récupéré: ${workflow.name}`);

    // 2. Trouver TOUS les nodes Switch
    const switchNodes = workflow.nodes.filter(n => 
      n.type === 'n8n-nodes-base.switch' || 
      n.name?.toLowerCase().includes('switch') ||
      n.name === 'Route by API'
    );

    console.log(`\n🔍 Nodes Switch trouvés: ${switchNodes.length}`);
    switchNodes.forEach(node => {
      console.log(`   - ${node.name} (${node.id})`);
    });

    if (switchNodes.length === 0) {
      console.log('\n✅ Aucun node Switch trouvé. Le workflow devrait fonctionner.');
      return;
    }

    // 3. Trouver les nodes qui pointent vers les Switch
    const prepareNode = workflow.nodes.find(n => n.name === 'Prepare API Request');
    const callBriefingNode = workflow.nodes.find(n => n.name === 'Call /api/briefing (Emma)');

    // 4. Supprimer tous les nodes Switch
    const switchNodeIds = switchNodes.map(n => n.id);
    workflow.nodes = workflow.nodes.filter(n => !switchNodeIds.includes(n.id));

    console.log(`\n✅ ${switchNodes.length} node(s) Switch supprimé(s)`);

    // 5. Nettoyer les connections
    if (workflow.connections) {
      // Supprimer toutes les connections vers/des Switch
      Object.keys(workflow.connections).forEach(nodeName => {
        if (switchNodeIds.some(id => {
          const switchNode = switchNodes.find(s => s.id === id);
          return switchNode?.name === nodeName;
        })) {
          delete workflow.connections[nodeName];
        }
      });

      // Modifier les connections qui pointaient vers les Switch
      // Pour pointer directement vers Call /api/briefing
      if (prepareNode && callBriefingNode) {
        // Trouver quels nodes pointaient vers les Switch
        Object.keys(workflow.connections).forEach(nodeName => {
          const connections = workflow.connections[nodeName];
          if (connections && connections.main) {
            connections.main.forEach((connectionArray, mainIndex) => {
              if (connectionArray) {
                connectionArray.forEach((connection, connIndex) => {
                  // Si la connection pointe vers un Switch, la rediriger vers Call /api/briefing
                  const targetNode = workflow.nodes.find(n => n.id === connection.node);
                  if (targetNode && switchNodeIds.includes(targetNode.id)) {
                    workflow.connections[nodeName].main[mainIndex][connIndex].node = callBriefingNode.id;
                    console.log(`   ✅ Connection ${nodeName} → Call /api/briefing`);
                  }
                });
              }
            });
          }
        });

        // S'assurer que Prepare API Request pointe vers Call /api/briefing
        if (prepareNode) {
          workflow.connections["Prepare API Request"] = {
            "main": [
              [
                {
                  "node": "Call /api/briefing (Emma)",
                  "type": "main",
                  "index": 0
                }
              ]
            ]
          };
        }
      }
    }

    // 6. Mettre à jour sur n8n
    console.log('\n📤 Mise à jour du workflow sur n8n...');
    const updateResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY
      },
      body: JSON.stringify({
        name: workflow.name,
        nodes: workflow.nodes,
        connections: workflow.connections,
        settings: workflow.settings || { executionOrder: 'v1' }
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Failed to update: ${updateResponse.status} - ${errorText}`);
    }

    const result = await updateResponse.json();
    console.log(`\n✅ Workflow corrigé et mis à jour!`);
    console.log(`   ID: ${result.id}`);
    console.log(`   URL: ${N8N_URL}/workflow/${result.id}\n`);

    console.log('📋 Corrections appliquées:');
    console.log(`   ✅ ${switchNodes.length} node(s) Switch supprimé(s)`);
    console.log('   ✅ Connections redirigées vers Call /api/briefing');
    console.log('   ✅ Workflow prêt à être testé\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

removeAllSwitchNodes();

