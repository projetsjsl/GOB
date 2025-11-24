/**
 * Corriger l'URL de /api/briefing dans le workflow n8n
 */

const N8N_URL = 'https://projetsjsl.app.n8n.cloud';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjZjBjNGVjMS1kMjQ3LTRiMTItYmM4My0wNGE1YzIzNjQ5ZmIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYwOTc5NTkwfQ.QVXxfNeYOT2UcUTXiSvsavKF6xugvza61fOZpQZzOYA';
const WORKFLOW_ID = '03lgcA4e9uRTtli1';

async function fixBriefingUrl() {
  try {
    console.log('🔧 Correction de l\'URL /api/briefing...\n');

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

    // Vérifier l'URL actuelle
    const currentUrl = callBriefingNode.parameters?.url || '';
    console.log(`   URL actuelle: ${currentUrl}`);

    // Corriger l'URL - utiliser l'expression n8n correcte
    // L'URL doit être construite dynamiquement avec le prompt_type
    callBriefingNode.parameters.url = "={{ 'https://gob.vercel.app/api/briefing?type=' + ($json.prompt_type || 'morning') }}";

    console.log(`   Nouvelle URL: ${callBriefingNode.parameters.url}`);

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

    console.log(`\n✅ URL corrigée!`);
    console.log(`   URL: ${N8N_URL}/workflow/${WORKFLOW_ID}\n`);

    console.log('⚠️  IMPORTANT: Le fichier api/briefing.js doit être déployé sur Vercel!');
    console.log('   - Ajouté dans vercel.json');
    console.log('   - Faire un commit et push pour déployer\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

fixBriefingUrl();

