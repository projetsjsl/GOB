/**
 * Corriger la connexion entre le LLM et Generate HTML Newsletter
 */

const N8N_URL = process.env.N8N_URL || 'https://projetsjsl.app.n8n.cloud';
const N8N_API_KEY = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjZjBjNGVjMS1kMjQ3LTRiMTItYmM4My0wNGE1YzIzNjQ5ZmIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYwOTc5NTkwfQ.QVXxfNeYOT2UcUTXiSvsavKF6xugvza61fOZpQZzOYA';
const WORKFLOW_ID = '03lgcA4e9uRTtli1';

async function fixLLMConnection() {
  try {
    console.log('🔍 Récupération du workflow...\n');

    // 1. Récupérer le workflow actuel
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
    console.log(`✅ Workflow récupéré: ${workflow.name}\n`);

    // 2. Trouver les nœuds importants
    const parseApiResponseNode = workflow.nodes.find(n => 
      n.name === 'Parse API Response' || 
      n.id === '40676021-3728-41a7-a961-9ec5a4f31b19'
    );

    const parseGeminiResponseNode = workflow.nodes.find(n => 
      n.name === 'Parse Gemini Response' || 
      n.id === 'parse-gemini-response'
    );

    const generateHtmlNode = workflow.nodes.find(n => 
      n.name === 'Generate HTML Newsletter' || 
      n.id === '9f33f73d-349d-48b3-8d6a-a49184737384'
    );

    const debugBeforeSwitchNode = workflow.nodes.find(n => 
      n.name === 'Debug Before Switch' || 
      n.id === 'debug-before-switch-node'
    );

    const shouldSendEmailNode = workflow.nodes.find(n => 
      n.name === 'Should Send Email?' || 
      n.id === 'preview-or-send-switch'
    );

    console.log('📊 Nœuds trouvés:');
    console.log(`   Parse API Response: ${parseApiResponseNode ? '✅' : '❌'}`);
    console.log(`   Parse Gemini Response: ${parseGeminiResponseNode ? '✅' : '❌'}`);
    console.log(`   Generate HTML Newsletter: ${generateHtmlNode ? '✅' : '❌'}`);
    console.log(`   Debug Before Switch: ${debugBeforeSwitchNode ? '✅' : '❌'}`);
    console.log(`   Should Send Email?: ${shouldSendEmailNode ? '✅' : '❌'}\n`);

    // 3. Vérifier les connexions actuelles
    console.log('🔗 Connexions actuelles:');
    const parseApiConnections = workflow.connections['Parse API Response'];
    const parseGeminiConnections = workflow.connections['Parse Gemini Response'];
    const debugConnections = workflow.connections['Debug Before Switch'];
    const shouldSendConnections = workflow.connections['Should Send Email?'];

    if (parseApiConnections) {
      console.log('   Parse API Response →');
      parseApiConnections.main?.forEach((outputs, idx) => {
        outputs.forEach(out => console.log(`      [${idx}] → ${out.node}`));
      });
    }

    if (parseGeminiConnections) {
      console.log('   Parse Gemini Response →');
      parseGeminiConnections.main?.forEach((outputs, idx) => {
        outputs.forEach(out => console.log(`      [${idx}] → ${out.node}`));
      });
    }

    if (debugConnections) {
      console.log('   Debug Before Switch →');
      debugConnections.main?.forEach((outputs, idx) => {
        outputs.forEach(out => console.log(`      [${idx}] → ${out.node}`));
      });
    }

    if (shouldSendConnections) {
      console.log('   Should Send Email? →');
      shouldSendConnections.main?.forEach((outputs, idx) => {
        outputs.forEach(out => console.log(`      [${idx}] → ${out.node}`));
      });
    }

    // 4. Vérifier si "Parse API Response" ou "Parse Gemini Response" se connecte à "Generate HTML Newsletter"
    let needsFix = false;
    
    // Vérifier le flux: Parse API Response → Debug Before Switch → Should Send Email? → Generate HTML Newsletter
    if (!parseApiConnections?.main?.[0]?.some(out => out.node === 'Debug Before Switch')) {
      console.log('\n⚠️  Parse API Response n\'est pas connecté à Debug Before Switch');
      needsFix = true;
    }

    if (!debugConnections?.main?.[0]?.some(out => out.node === 'Should Send Email?')) {
      console.log('⚠️  Debug Before Switch n\'est pas connecté à Should Send Email?');
      needsFix = true;
    }

    if (!shouldSendConnections?.main?.[0]?.some(out => out.node === 'Generate HTML Newsletter')) {
      console.log('⚠️  Should Send Email? n\'est pas connecté à Generate HTML Newsletter');
      needsFix = true;
    }

    // Vérifier aussi Parse Gemini Response → Parse API Response
    if (parseGeminiResponseNode && !parseGeminiConnections?.main?.[0]?.some(out => out.node === 'Parse API Response')) {
      console.log('⚠️  Parse Gemini Response n\'est pas connecté à Parse API Response');
      needsFix = true;
    }

    if (!needsFix) {
      console.log('\n✅ Toutes les connexions sont correctes!');
      return;
    }

    // 5. Corriger les connexions
    console.log('\n🔧 Correction des connexions...');

    // Initialiser les connexions si elles n'existent pas
    if (!workflow.connections) {
      workflow.connections = {};
    }

    // Parse API Response → Debug Before Switch
    if (parseApiResponseNode) {
      workflow.connections['Parse API Response'] = {
        main: [[
          {
            node: 'Debug Before Switch',
            type: 'main',
            index: 0
          }
        ]]
      };
      console.log('   ✅ Parse API Response → Debug Before Switch');
    }

    // Parse Gemini Response → Parse API Response
    if (parseGeminiResponseNode) {
      workflow.connections['Parse Gemini Response'] = {
        main: [[
          {
            node: 'Parse API Response',
            type: 'main',
            index: 0
          }
        ]]
      };
      console.log('   ✅ Parse Gemini Response → Parse API Response');
    }

    // Debug Before Switch → Should Send Email?
    if (debugBeforeSwitchNode) {
      workflow.connections['Debug Before Switch'] = {
        main: [[
          {
            node: 'Should Send Email?',
            type: 'main',
            index: 0
          }
        ]]
      };
      console.log('   ✅ Debug Before Switch → Should Send Email?');
    }

    // Should Send Email? → Generate HTML Newsletter (output 0 = true) et Preview Display (output 1 = false)
    if (shouldSendEmailNode) {
      workflow.connections['Should Send Email?'] = {
        main: [
          [
            {
              node: 'Generate HTML Newsletter',
              type: 'main',
              index: 0
            }
          ],
          [
            {
              node: 'Preview Display',
              type: 'main',
              index: 0
            }
          ]
        ]
      };
      console.log('   ✅ Should Send Email? → Generate HTML Newsletter (true)');
      console.log('   ✅ Should Send Email? → Preview Display (false)');
    }

    // 6. Mettre à jour le workflow
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

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

fixLLMConnection();

