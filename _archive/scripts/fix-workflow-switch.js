/**
 * Corriger le workflow en supprimant le node Switch (Route by API)
 * et en connectant directement Prepare API Request → Call /api/briefing
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const N8N_URL = 'https://projetsjsl.app.n8n.cloud';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjZjBjNGVjMS1kMjQ3LTRiMTItYmM4My0wNGE1YzIzNjQ5ZmIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYwOTc5NTkwfQ.QVXxfNeYOT2UcUTXiSvsavKF6xugvza61fOZpQZzOYA';
const WORKFLOW_ID = '03lgcA4e9uRTtli1';

async function fixWorkflow() {
  try {
    console.log('🔧 Correction du workflow - Suppression du node Switch...\n');

    // 1. Récupérer le workflow actuel depuis n8n
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

    // 2. Trouver les nodes
    const prepareNode = workflow.nodes.find(n => n.name === 'Prepare API Request');
    const routeNode = workflow.nodes.find(n => n.name === 'Route by API');
    const callBriefingNode = workflow.nodes.find(n => n.name === 'Call /api/briefing (Emma)');
    const perplexityNode = workflow.nodes.find(n => n.name === 'Call Perplexity API');
    const geminiNode = workflow.nodes.find(n => n.name === 'Call Gemini API');

    console.log('\n🔍 Nodes trouvés:');
    console.log(`   Prepare API Request: ${prepareNode ? '✅' : '❌'}`);
    console.log(`   Route by API: ${routeNode ? '✅' : '❌'}`);
    console.log(`   Call /api/briefing: ${callBriefingNode ? '✅' : '❌'}`);

    // 3. Modifier "Prepare API Request" pour qu'il prépare directement l'appel à /api/briefing
    // Au lieu de préparer un request_body pour Perplexity/Gemini
    if (prepareNode) {
      prepareNode.parameters.jsCode = `const items = $input.all();
const data = items[0].json;

// Extraire ticker symbols depuis input 1 (tickers data)
const tickers = items.filter(item => item.json.ticker).map(item => item.json.ticker);
const tickerList = tickers.join(', ');

// Déterminer le type de briefing
const promptType = data.prompt_type || 'morning';

// Préparer l'URL pour /api/briefing
const briefingUrl = \`https://gob.vercel.app/api/briefing?type=\${promptType}\`;

return [{
  json: {
    ...data,
    tickers: tickerList,
    briefing_type: promptType,
    briefing_url: briefingUrl
  }
}];`;
    }

    // 4. Modifier "Call /api/briefing" pour utiliser l'URL préparée
    if (callBriefingNode) {
      callBriefingNode.parameters.url = "={{ $json.briefing_url || 'https://gob.vercel.app/api/briefing?type=' + $json.prompt_type }}";
    }

    // 5. Supprimer les nodes inutiles (Route, Perplexity, Gemini)
    workflow.nodes = workflow.nodes.filter(n => 
      n.id !== routeNode?.id && 
      n.id !== perplexityNode?.id && 
      n.id !== geminiNode?.id
    );

    console.log(`\n✅ Nodes supprimés: Route by API, Call Perplexity API, Call Gemini API`);

    // 6. Modifier les connections
    // Prepare API Request → Call /api/briefing (directement, sans Route)
    if (workflow.connections) {
      // Supprimer les connections vers Route
      delete workflow.connections["Route by API"];
      delete workflow.connections["Call Perplexity API"];
      delete workflow.connections["Call Gemini API"];

      // Ajouter connection directe Prepare → Call /api/briefing
      if (prepareNode && callBriefingNode) {
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

    // 7. Sauvegarder localement
    const outputPath = join(__dirname, 'n8n-workflow-fixed.json');
    writeFileSync(outputPath, JSON.stringify(workflow, null, 2));
    console.log(`\n✅ Workflow corrigé sauvegardé: ${outputPath}`);

    // 8. Mettre à jour sur n8n
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
    console.log('   ✅ Node "Route by API" supprimé');
    console.log('   ✅ Nodes "Call Perplexity API" et "Call Gemini API" supprimés');
    console.log('   ✅ Connection directe: Prepare API Request → Call /api/briefing');
    console.log('   ✅ "Prepare API Request" adapté pour /api/briefing\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

fixWorkflow();

