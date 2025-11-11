/**
 * Vérifier l'état actuel du workflow et ses connexions
 */

const N8N_URL = process.env.N8N_URL || 'https://projetsjsl.app.n8n.cloud';
const N8N_API_KEY = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjZjBjNGVjMS1kMjQ3LTRiMTItYmM4My0wNGE1YzIzNjQ5ZmIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYwOTc5NTkwfQ.QVXxfNeYOT2UcUTXiSvsavKF6xugvza61fOZpQZzOYA';
const WORKFLOW_ID = '03lgcA4e9uRTtli1';

async function checkWorkflow() {
  try {
    console.log('🔍 Récupération du workflow actuel...\n');

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
    
    console.log(`✅ Workflow: ${workflow.name}`);
    console.log(`   Nodes: ${workflow.nodes.length}`);
    console.log(`   Connections: ${Object.keys(workflow.connections || {}).length} sources\n`);

    // Afficher les connexions
    console.log('📊 Connexions actuelles:');
    for (const [sourceNode, connections] of Object.entries(workflow.connections || {})) {
      console.log(`\n   ${sourceNode}:`);
      if (connections.main) {
        connections.main.forEach((outputs, index) => {
          outputs.forEach(output => {
            console.log(`      → ${output.node} (output ${index})`);
          });
        });
      }
    }

    // Sauvegarder le workflow actuel
    const fs = await import('fs');
    const workflowJson = JSON.stringify(workflow, null, 2);
    fs.writeFileSync('n8n-workflow-current-backup.json', workflowJson);
    console.log('\n💾 Workflow sauvegardé dans: n8n-workflow-current-backup.json');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkWorkflow();

