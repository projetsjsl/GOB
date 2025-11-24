/**
 * Vérifier le flux complet du workflow, notamment le Basic LLM Chain
 */

const N8N_URL = process.env.N8N_URL || 'https://projetsjsl.app.n8n.cloud';
const N8N_API_KEY = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjZjBjNGVjMS1kMjQ3LTRiMTItYmM4My0wNGE1YzIzNjQ5ZmIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYwOTc5NTkwfQ.QVXxfNeYOT2UcUTXiSvsavKF6xugvza61fOZpQZzOYA';
const WORKFLOW_ID = '03lgcA4e9uRTtli1';

async function checkFullFlow() {
  try {
    console.log('🔍 Analyse complète du flux du workflow...\n');

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

    // Trouver tous les nœuds importants
    const basicLLMChainNode = workflow.nodes.find(n => 
      n.name === 'Basic LLM Chain' || 
      n.id === '90188c41-16ed-4cc6-bf45-b473e44872ee'
    );

    const whenChatMessageNode = workflow.nodes.find(n => 
      n.name === 'When chat message received' || 
      n.id === '339cad82-0be3-4fbb-a420-f8e9a9d2f805'
    );

    const parseApiResponseNode = workflow.nodes.find(n => 
      n.name === 'Parse API Response'
    );

    const generateHtmlNode = workflow.nodes.find(n => 
      n.name === 'Generate HTML Newsletter'
    );

    console.log('📊 Nœuds trouvés:');
    console.log(`   When chat message received: ${whenChatMessageNode ? '✅' : '❌'}`);
    console.log(`   Basic LLM Chain: ${basicLLMChainNode ? '✅' : '❌'}`);
    console.log(`   Parse API Response: ${parseApiResponseNode ? '✅' : '❌'}`);
    console.log(`   Generate HTML Newsletter: ${generateHtmlNode ? '✅' : '❌'}\n`);

    // Vérifier les connexions
    console.log('🔗 Connexions du flux LLM:');
    
    const chatConnections = workflow.connections['When chat message received'];
    if (chatConnections) {
      console.log('   When chat message received →');
      chatConnections.main?.forEach((outputs, idx) => {
        outputs.forEach(out => console.log(`      [${idx}] → ${out.node}`));
      });
    } else {
      console.log('   ❌ When chat message received: PAS DE CONNEXIONS');
    }

    const llmConnections = workflow.connections['Basic LLM Chain'];
    if (llmConnections) {
      console.log('   Basic LLM Chain →');
      llmConnections.main?.forEach((outputs, idx) => {
        outputs.forEach(out => console.log(`      [${idx}] → ${out.node}`));
      });
    } else {
      console.log('   ❌ Basic LLM Chain: PAS DE CONNEXIONS');
    }

    // Vérifier si Basic LLM Chain se connecte à quelque chose qui mène à Generate HTML
    console.log('\n🔍 Recherche du chemin vers Generate HTML Newsletter...');
    
    function findPathToNode(startNodeName, targetNodeName, visited = new Set()) {
      if (visited.has(startNodeName)) return null;
      visited.add(startNodeName);

      const connections = workflow.connections[startNodeName];
      if (!connections) return null;

      for (const outputs of connections.main || []) {
        for (const output of outputs) {
          if (output.node === targetNodeName) {
            return [startNodeName, targetNodeName];
          }
          const path = findPathToNode(output.node, targetNodeName, visited);
          if (path) {
            return [startNodeName, ...path];
          }
        }
      }
      return null;
    }

    // Chercher depuis Basic LLM Chain
    const pathFromLLM = findPathToNode('Basic LLM Chain', 'Generate HTML Newsletter');
    if (pathFromLLM) {
      console.log(`   ✅ Chemin trouvé: ${pathFromLLM.join(' → ')}`);
    } else {
      console.log('   ❌ AUCUN CHEMIN de Basic LLM Chain vers Generate HTML Newsletter');
    }

    // Chercher depuis Parse API Response
    const pathFromParse = findPathToNode('Parse API Response', 'Generate HTML Newsletter');
    if (pathFromParse) {
      console.log(`   ✅ Chemin trouvé: ${pathFromParse.join(' → ')}`);
    } else {
      console.log('   ❌ AUCUN CHEMIN de Parse API Response vers Generate HTML Newsletter');
    }

    // Afficher toutes les connexions pour debug
    console.log('\n📋 Toutes les connexions du workflow:');
    for (const [sourceNode, connections] of Object.entries(workflow.connections || {})) {
      if (connections.main) {
        connections.main.forEach((outputs, index) => {
          outputs.forEach(output => {
            console.log(`   ${sourceNode} [${index}] → ${output.node}`);
          });
        });
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkFullFlow();

