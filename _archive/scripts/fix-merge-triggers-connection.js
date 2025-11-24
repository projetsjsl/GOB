/**
 * Corriger la connection Merge Triggers → Switch
 * Rediriger vers Workflow Configuration
 */

const N8N_URL = 'https://projetsjsl.app.n8n.cloud';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjZjBjNGVjMS1kMjQ3LTRiMTItYmM4My0wNGE1YzIzNjQ5ZmIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYwOTc5NTkwfQ.QVXxfNeYOT2UcUTXiSvsavKF6xugvza61fOZpQZzOYA';
const WORKFLOW_ID = '03lgcA4e9uRTtli1';

async function fixMergeTriggers() {
  try {
    console.log('🔧 Correction de la connection Merge Triggers...\n');

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

    // Trouver les nodes
    const mergeNode = workflow.nodes.find(n => n.name === 'Merge Triggers');
    const workflowConfigNode = workflow.nodes.find(n => n.name === 'Workflow Configuration');
    const switchNode = workflow.nodes.find(n => n.name === 'Switch' || n.type === 'n8n-nodes-base.switch');

    // Créer un map des nodes par ID
    const nodesById = {};
    workflow.nodes.forEach(node => {
      nodesById[node.id] = node;
    });

    // Corriger la connection Merge Triggers
    if (workflow.connections && workflow.connections["Merge Triggers"]) {
      const mergeConn = workflow.connections["Merge Triggers"];
      
      if (mergeConn.main && mergeConn.main[0]) {
        // Vérifier si une connection pointe vers Switch
        const hasSwitchConnection = mergeConn.main[0].some(conn => {
          const targetNode = nodesById[conn.node];
          return targetNode && (targetNode.name === 'Switch' || targetNode.type === 'n8n-nodes-base.switch');
        });

        if (hasSwitchConnection) {
          console.log('⚠️  Connection vers Switch détectée, redirection vers Workflow Configuration...');
          
          // Remplacer la connection vers Switch par Workflow Configuration
          mergeConn.main[0] = mergeConn.main[0].map(conn => {
            const targetNode = nodesById[conn.node];
            if (targetNode && (targetNode.name === 'Switch' || targetNode.type === 'n8n-nodes-base.switch')) {
              if (workflowConfigNode) {
                return {
                  "node": "Workflow Configuration",
                  "type": "main",
                  "index": 0
                };
              }
            }
            return conn;
          }).filter(conn => {
            // Supprimer les connections vers Switch qui n'ont pas été remplacées
            const targetNode = nodesById[conn.node];
            return !(targetNode && (targetNode.name === 'Switch' || targetNode.type === 'n8n-nodes-base.switch'));
          });

          // Si Workflow Configuration n'est pas déjà dans les connections, l'ajouter
          const hasWorkflowConfig = mergeConn.main[0].some(conn => {
            const targetNode = nodesById[conn.node];
            return targetNode && targetNode.name === 'Workflow Configuration';
          });

          if (!hasWorkflowConfig && workflowConfigNode) {
            mergeConn.main[0].push({
              "node": "Workflow Configuration",
              "type": "main",
              "index": 0
            });
          }
        }
      }
    }

    // Supprimer le node Switch s'il existe encore
    if (switchNode) {
      workflow.nodes = workflow.nodes.filter(n => n.id !== switchNode.id);
      delete workflow.connections["Switch"];
      console.log('✅ Node Switch supprimé');
    }

    // Nettoyer toutes les autres références à Switch
    if (workflow.connections) {
      Object.keys(workflow.connections).forEach(nodeName => {
        const conn = workflow.connections[nodeName];
        if (conn && conn.main) {
          conn.main.forEach((connectionArray, mainIndex) => {
            if (connectionArray) {
              workflow.connections[nodeName].main[mainIndex] = connectionArray.filter(connItem => {
                const targetNode = nodesById[connItem.node];
                return !(targetNode && (targetNode.name === 'Switch' || targetNode.type === 'n8n-nodes-base.switch'));
              });
            }
          });
        }
      });
    }

    // Mettre à jour
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
    console.log(`   Merge Triggers → Workflow Configuration`);
    console.log(`   URL: ${N8N_URL}/workflow/${WORKFLOW_ID}\n`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

fixMergeTriggers();

