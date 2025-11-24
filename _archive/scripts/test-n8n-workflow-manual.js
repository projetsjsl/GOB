/**
 * Script pour tester le workflow n8n manuellement
 * Simule un appel au webhook ou déclenche le workflow
 */

const N8N_URL = 'https://projetsjsl.app.n8n.cloud';
const N8N_API_KEY = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjZjBjNGVjMS1kMjQ3LTRiMTItYmM4My0wNGE1YzIzNjQ5ZmIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYwOTc5NTkwfQ.QVXxfNeYOT2UcUTXiSvsavKF6xugvza61fOZpQZzOYA';
const WORKFLOW_ID = '03lgcA4e9uRTtli1';

async function testWorkflow() {
  try {
    console.log('🧪 Test du workflow n8n...\n');
    console.log(`   Workflow ID: ${WORKFLOW_ID}`);
    console.log(`   URL: ${N8N_URL}/workflow/${WORKFLOW_ID}\n`);

    // Option 1: Déclencher le workflow via API
    console.log('📤 Déclenchement du workflow via API...\n');
    
    const response = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY
      },
      body: JSON.stringify({
        data: {
          prompt_type: 'morning',
          custom_prompt: null
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erreur HTTP ${response.status}:`);
      console.error(errorText);
      
      if (response.status === 404) {
        console.log('\n💡 Alternative: Tester via le webhook');
        console.log(`   curl -X POST ${N8N_URL}/webhook/emma-newsletter/send \\`);
        console.log(`     -H "Content-Type: application/json" \\`);
        console.log(`     -d '{"prompt_type": "morning"}'`);
      }
      
      throw new Error(`Failed to execute workflow: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Workflow déclenché avec succès!');
    console.log(`   Execution ID: ${result.executionId || 'N/A'}`);
    console.log(`\n📋 Vérifier l'exécution sur n8n:`);
    console.log(`   ${N8N_URL}/workflow/${WORKFLOW_ID}/executions`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    
    console.log('\n💡 Alternatives de test:');
    console.log('   1. Tester directement /api/briefing:');
    console.log('      node test-briefing-endpoint.js morning');
    console.log('\n   2. Tester via le webhook n8n:');
    console.log(`      curl -X POST ${N8N_URL}/webhook/emma-newsletter/send \\`);
    console.log(`        -H "Content-Type: application/json" \\`);
    console.log(`        -d '{"prompt_type": "morning"}'`);
    console.log('\n   3. Tester manuellement dans n8n:');
    console.log(`      - Aller sur ${N8N_URL}/workflow/${WORKFLOW_ID}`);
    console.log('      - Cliquer sur "Manual Trigger"');
    console.log('      - Cliquer sur "Execute Node"');
    
    process.exit(1);
  }
}

testWorkflow();

