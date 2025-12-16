/**
 * Supprimer la référence au node Switch dans les connections
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const N8N_URL = 'https://projetsjsl.app.n8n.cloud';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjZjBjNGVjMS1kMjQ3LTRiMTItYmM4My0wNGE1YzIzNjQ5ZmIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYwOTc5NTkwfQ.QVXxfNeYOT2UcUTXiSvsavKF6xugvza61fOZpQZzOYA';
const WORKFLOW_ID = '03lgcA4e9uRTtli1';

async function removeSwitchReference() {
  try {
    console.log('🔧 Suppression de la référence au node Switch...\n');

    // 1. Récupérer le workflow
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

    // 2. Trouver les nodes
    const mergeNode = workflow.nodes.find(n => n.name === 'Merge Triggers');
    const workflowConfigNode = workflow.nodes.find(n => n.name === 'Workflow Configuration');
    const getTickersNode = workflow.nodes.find(n => n.name === 'Get Active Tickers');
    const determinePromptNode = workflow.nodes.find(n => n.name === 'Determine Time-Based Prompt');
    const switchNode = workflow.nodes.find(n => n.name === 'Switch' || n.type === 'n8n-nodes-base.switch');

    // 3. Nettoyer les connections
    if (workflow.connections) {
      // Si Merge Triggers pointe vers Switch, le rediriger vers Workflow Configuration
      if (workflow.connections["Merge Triggers"]) {
        const mergeConn = workflow.connections["Merge Triggers"];
        if (mergeConn.main && mergeConn.main[0]) {
          mergeConn.main[0] = mergeConn.main[0].filter(conn => {
            // Vérifier si la connection pointe vers Switch
            const targetNode = workflow.nodes.find(n => n.id === conn.node);
            if (targetNode && (targetNode.name === 'Switch' || targetNode.type === 'n8n-nodes-base.switch')) {
              return false; // Supprimer cette connection
            }
            return true;
          });

          // Si Workflow Configuration existe et n'est pas déjà connecté, l'ajouter
          if (workflowConfigNode && mergeConn.main[0].length === 0) {
            mergeConn.main[0].push({
              "node": "Workflow Configuration",
              "type": "main",
              "index": 0
            });
          }
        }
      }

      // Supprimer toutes les connections vers/depuis Switch
      Object.keys(workflow.connections).forEach(nodeName => {
        if (nodeName === 'Switch') {
          delete workflow.connections[nodeName];
        } else {
          const conn = workflow.connections[nodeName];
          if (conn && conn.main) {
            conn.main.forEach((connectionArray, mainIndex) => {
              if (connectionArray) {
                workflow.connections[nodeName].main[mainIndex] = connectionArray.filter(connItem => {
                  const targetNode = workflow.nodes.find(n => n.id === connItem.node);
                  return !(targetNode && (targetNode.name === 'Switch' || targetNode.type === 'n8n-nodes-base.switch'));
                });
              }
            });
          }
        }
      });
    }

    // 4. Supprimer le node Switch s'il existe encore
    if (switchNode) {
      workflow.nodes = workflow.nodes.filter(n => n.id !== switchNode.id);
      console.log(`✅ Node Switch supprimé`);
    }

    // 5. Mettre à jour
    console.log('\n📤 Mise à jour du workflow...');
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

    console.log(`\n✅ Workflow corrigé!`);
    console.log(`   URL: ${N8N_URL}/workflow/${WORKFLOW_ID}\n`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

removeSwitchReference();

