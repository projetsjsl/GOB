/**
 * Restaurer le nœud "Test Email Prep" et ses connexions
 * D'après la documentation, il devrait être entre Basic LLM Chain et Generate HTML Newsletter
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const N8N_URL = process.env.N8N_URL || 'https://projetsjsl.app.n8n.cloud';
const N8N_API_KEY = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjZjBjNGVjMS1kMjQ3LTRiMTItYmM4My0wNGE1YzIzNjQ5ZmIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYwOTc5NTkwfQ.QVXxfNeYOT2UcUTXiSvsavKF6xugvza61fOZpQZzOYA';
const WORKFLOW_ID = '03lgcA4e9uRTtli1';

async function restoreTestEmailPrep() {
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

    const generateHtmlNode = workflow.nodes.find(n => 
      n.name === 'Generate HTML Newsletter' || 
      n.id === '9f33f73d-349d-48b3-8d6a-a49184737384'
    );

    const testEmailPrepNode = workflow.nodes.find(n => 
      n.name === 'Test Email Prep' || 
      n.name === 'Test Formated HTML Email to projetsjsl@gmail.com' ||
      n.name?.includes('Test Email')
    );

    console.log('📊 Nœuds trouvés:');
    console.log(`   Basic LLM Chain: ${basicLLMChainNode ? '✅' : '❌'}`);
    console.log(`   Generate HTML Newsletter: ${generateHtmlNode ? '✅' : '❌'}`);
    console.log(`   Test Email Prep: ${testEmailPrepNode ? '✅' : '❌'}\n`);

    // Lire le code du nœud Test Email Prep
    const prepNodeCode = readFileSync(join(__dirname, 'n8n-test-prep-node.js'), 'utf-8');

    // Si le nœud n'existe pas, le créer
    if (!testEmailPrepNode) {
      console.log('➕ Création du nœud "Test Email Prep"...');
      
      // Trouver la position entre Basic LLM Chain et Generate HTML Newsletter
      const llmPosition = basicLLMChainNode?.position || [20608, 7008];
      const htmlPosition = generateHtmlNode?.position || [23872, 6400];
      
      const newTestEmailPrepNode = {
        id: 'test-email-prep-node',
        name: 'Test Email Prep',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [
          llmPosition[0] + 160,
          llmPosition[1]
        ],
        parameters: {
          jsCode: prepNodeCode
        }
      };

      workflow.nodes.push(newTestEmailPrepNode);
      console.log('   ✅ Nœud créé');
    } else {
      console.log('✅ Nœud "Test Email Prep" existe déjà, mise à jour du code...');
      testEmailPrepNode.parameters.jsCode = prepNodeCode;
    }

    // Mettre à jour les connexions
    console.log('\n🔗 Mise à jour des connexions...');
    
    if (!workflow.connections) {
      workflow.connections = {};
    }

    // Basic LLM Chain → Test Email Prep
    workflow.connections['Basic LLM Chain'] = {
      main: [[
        {
          node: 'Test Email Prep',
          type: 'main',
          index: 0
        }
      ]]
    };
    console.log('   ✅ Basic LLM Chain → Test Email Prep');

    // Test Email Prep → Generate HTML Newsletter
    workflow.connections['Test Email Prep'] = {
      main: [[
        {
          node: 'Generate HTML Newsletter',
          type: 'main',
          index: 0
        }
      ]]
    };
    console.log('   ✅ Test Email Prep → Generate HTML Newsletter');

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

    console.log('\n📋 Flux restauré:');
    console.log('   When chat message received');
    console.log('   → Basic LLM Chain');
    console.log('   → Test Email Prep');
    console.log('   → Generate HTML Newsletter');
    console.log('   → Fetch Email Recipients');
    console.log('   → Process Recipients');
    console.log('   → Send Email via Resend');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

restoreTestEmailPrep();

