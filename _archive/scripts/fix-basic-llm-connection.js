/**
 * Connecter Basic LLM Chain à Generate HTML Newsletter
 * Soit via un nœud existant, soit en créant un adaptateur
 */

const N8N_URL = process.env.N8N_URL || 'https://projetsjsl.app.n8n.cloud';
const N8N_API_KEY = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjZjBjNGVjMS1kMjQ3LTRiMTItYmM4My0wNGE1YzIzNjQ5ZmIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYwOTc5NTkwfQ.QVXxfNeYOT2UcUTXiSvsavKF6xugvza61fOZpQZzOYA';
const WORKFLOW_ID = '03lgcA4e9uRTtli1';

async function fixBasicLLMConnection() {
  try {
    console.log('🔍 Récupération du workflow...\n');

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

    // Chercher les nœuds
    const basicLLMChainNode = workflow.nodes.find(n => 
      n.name === 'Basic LLM Chain' || 
      n.id === '90188c41-16ed-4cc6-bf45-b473e44872ee'
    );

    const parseApiResponseNode = workflow.nodes.find(n => 
      n.name === 'Parse API Response' || 
      n.id === '40676021-3728-41a7-a961-9ec5a4f31b19'
    );

    const testEmailPrepNode = workflow.nodes.find(n => 
      n.name === 'Test Email Prep' || 
      n.name === 'Test Formated HTML Email to projetsjsl@gmail.com' ||
      n.name?.includes('Test Email')
    );

    console.log('📊 Nœuds trouvés:');
    console.log(`   Basic LLM Chain: ${basicLLMChainNode ? '✅' : '❌'}`);
    console.log(`   Parse API Response: ${parseApiResponseNode ? '✅' : '❌'}`);
    console.log(`   Test Email Prep: ${testEmailPrepNode ? '✅' : '❌'}\n`);

    // Option 1: Si Test Email Prep existe, connecter Basic LLM Chain → Test Email Prep → Parse API Response
    // Option 2: Sinon, connecter directement Basic LLM Chain → Parse API Response

    if (testEmailPrepNode) {
      console.log('✅ Nœud Test Email Prep trouvé, connexion via ce nœud...');
      
      // Basic LLM Chain → Test Email Prep
      if (!workflow.connections) workflow.connections = {};
      workflow.connections['Basic LLM Chain'] = {
        main: [[
          {
            node: testEmailPrepNode.name,
            type: 'main',
            index: 0
          }
        ]]
      };
      console.log(`   ✅ Basic LLM Chain → ${testEmailPrepNode.name}`);

      // Vérifier si Test Email Prep est déjà connecté
      const testPrepConnections = workflow.connections[testEmailPrepNode.name];
      if (!testPrepConnections || !testPrepConnections.main?.[0]?.some(out => out.node === 'Parse API Response')) {
        workflow.connections[testEmailPrepNode.name] = {
          main: [[
            {
              node: 'Parse API Response',
              type: 'main',
              index: 0
            }
          ]]
        };
        console.log(`   ✅ ${testEmailPrepNode.name} → Parse API Response`);
      }

    } else if (parseApiResponseNode) {
      console.log('⚠️  Nœud Test Email Prep non trouvé, connexion directe...');
      console.log('   Basic LLM Chain → Parse API Response');
      
      // Basic LLM Chain → Parse API Response (direct)
      if (!workflow.connections) workflow.connections = {};
      workflow.connections['Basic LLM Chain'] = {
        main: [[
          {
            node: 'Parse API Response',
            type: 'main',
            index: 0
          }
        ]]
      };
      console.log('   ✅ Connexion créée');
    } else {
      throw new Error('Parse API Response node not found');
    }

    // Mettre à jour le workflow
    console.log('\n🔄 Mise à jour du workflow...');
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
        settings: workflow.settings,
        staticData: workflow.staticData
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error(`❌ Erreur: ${updateResponse.status}`);
      console.error(errorText);
      throw new Error(`Failed to update workflow: ${updateResponse.status}`);
    }

    const result = await updateResponse.json();
    console.log('\n✅ Workflow mis à jour avec succès!');
    console.log(`   ID: ${result.id}`);
    console.log(`   URL: ${N8N_URL}/workflow/${result.id}`);

    console.log('\n📋 Connexions créées:');
    if (testEmailPrepNode) {
      console.log('   Basic LLM Chain → Test Email Prep → Parse API Response → ... → Generate HTML Newsletter');
    } else {
      console.log('   Basic LLM Chain → Parse API Response → ... → Generate HTML Newsletter');
    }

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

fixBasicLLMConnection();

