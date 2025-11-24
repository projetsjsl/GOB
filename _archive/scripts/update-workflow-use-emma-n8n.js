/**
 * Modifier le workflow n8n pour utiliser /api/emma-n8n?action=briefing
 * en attendant que /api/briefing fonctionne
 */

const N8N_URL = 'https://projetsjsl.app.n8n.cloud';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjZjBjNGVjMS1kMjQ3LTRiMTItYmM4My0wNGE1YzIzNjQ5ZmIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYwOTc5NTkwfQ.QVXxfNeYOT2UcUTXiSvsavKF6xugvza61fOZpQZzOYA';
const WORKFLOW_ID = '03lgcA4e9uRTtli1';

async function updateWorkflowToUseEmmaN8n() {
  try {
    console.log('🔧 Modification du workflow pour utiliser /api/emma-n8n...\n');

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

    // Trouver le node Call /api/briefing
    const callBriefingNode = workflow.nodes.find(n => 
      n.name === 'Call /api/briefing (Emma)' || 
      n.name?.includes('briefing')
    );

    if (!callBriefingNode) {
      throw new Error('Node Call /api/briefing not found');
    }

    console.log(`✅ Node trouvé: ${callBriefingNode.name}`);

    // Modifier pour utiliser /api/emma-n8n?action=briefing
    callBriefingNode.name = 'Call /api/emma-n8n (Briefing)';
    callBriefingNode.parameters.method = 'POST';
    callBriefingNode.parameters.url = "={{ 'https://gob.vercel.app/api/emma-n8n?action=briefing' }}";
    
    // Ajouter les headers d'authentification
    if (!callBriefingNode.parameters.headerParameters) {
      callBriefingNode.parameters.headerParameters = { parameters: [] };
    }
    
    // Ajouter Authorization header
    const hasAuth = callBriefingNode.parameters.headerParameters.parameters?.some(
      p => p.name === 'Authorization'
    );
    
    if (!hasAuth) {
      callBriefingNode.parameters.headerParameters.parameters.push({
        name: 'Authorization',
        value: 'Bearer {{ $env.N8N_API_KEY }}'
      });
    }

    // Modifier le body pour envoyer type et tickers
    callBriefingNode.parameters.sendBody = true;
    callBriefingNode.parameters.specifyBody = 'json';
    callBriefingNode.parameters.jsonBody = "={{ { \"type\": $('Determine Time-Based Prompt').item.json.prompt_type || 'morning', \"tickers\": $('Prepare API Request').item.json.tickers ? $('Prepare API Request').item.json.tickers.split(', ') : [] } }}";

    console.log(`   ✅ Modifié pour utiliser /api/emma-n8n?action=briefing`);

    // Modifier Parse API Response pour adapter la réponse de emma-n8n
    const parseNode = workflow.nodes.find(n => n.name === 'Parse API Response');
    if (parseNode) {
      parseNode.parameters.jsCode = `const items = $input.all();
const data = items[0].json;

// La réponse de /api/emma-n8n?action=briefing contient briefing, type, etc.
const content = data.briefing || data.response || 'No content received';

return [{
  json: {
    ...data,
    newsletter_content: content,
    content: content,
    prompt_type: data.type || 'morning',
    generated_at: new Date().toISOString()
  }
}];`;
      console.log(`   ✅ Parse API Response adapté pour emma-n8n`);
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

    console.log(`\n✅ Workflow mis à jour!`);
    console.log(`   Utilise maintenant: POST /api/emma-n8n?action=briefing`);
    console.log(`   URL: ${N8N_URL}/workflow/${WORKFLOW_ID}\n`);

    console.log('📋 Note:');
    console.log('   - Le workflow utilise maintenant /api/emma-n8n qui existe déjà');
    console.log('   - Une fois /api/briefing déployé, on pourra revenir à /api/briefing');
    console.log('   - N\'oubliez pas de configurer N8N_API_KEY dans les variables n8n\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

updateWorkflowToUseEmmaN8n();

