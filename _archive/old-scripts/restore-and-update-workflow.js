/**
 * Restaurer le workflow original et faire des modifications ciblées
 */

const N8N_URL = 'https://projetsjsl.app.n8n.cloud';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjZjBjNGVjMS1kMjQ3LTRiMTItYmM4My0wNGE1YzIzNjQ5ZmIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYwOTc5NTkwfQ.QVXxfNeYOT2UcUTXiSvsavKF6xugvza61fOZpQZzOYA';
const WORKFLOW_ID = '03lgcA4e9uRTtli1';

async function restoreAndUpdate() {
  try {
    console.log('📥 Récupération du workflow original depuis le fichier local...\n');

    // 1. Lire le workflow original depuis le fichier
    const { readFileSync } = await import('fs');
    const { fileURLToPath } = await import('url');
    const { dirname, join } = await import('path');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    
    const originalWorkflowPath = join(__dirname, 'n8n-workflow-03lgcA4e9uRTtli1.json');
    const originalWorkflow = JSON.parse(readFileSync(originalWorkflowPath, 'utf-8'));

    console.log(`✅ Workflow original lu: ${originalWorkflow.name}`);
    console.log(`   Nodes: ${originalWorkflow.nodes.length}`);

    // 2. Modifications ciblées:
    // - Remplacer les appels Perplexity/Gemini par un appel à /api/briefing
    // - Ajouter un node de confirmation email après l'envoi
    
    // Trouver les nodes à modifier
    const perplexityNode = originalWorkflow.nodes.find(n => n.name === 'Call Perplexity API');
    const geminiNode = originalWorkflow.nodes.find(n => n.name === 'Call Gemini API');
    const routeNode = originalWorkflow.nodes.find(n => n.name === 'Route by API');
    const sendEmailNode = originalWorkflow.nodes.find(n => n.name === 'Send Email via Resend');
    const parseNode = originalWorkflow.nodes.find(n => n.name === 'Parse API Response');
    const htmlNode = originalWorkflow.nodes.find(n => n.name === 'Generate HTML Newsletter');

    console.log('\n🔍 Nodes trouvés:');
    console.log(`   Perplexity: ${perplexityNode ? '✅' : '❌'}`);
    console.log(`   Gemini: ${geminiNode ? '✅' : '❌'}`);
    console.log(`   Route: ${routeNode ? '✅' : '❌'}`);
    console.log(`   Send Email: ${sendEmailNode ? '✅' : '❌'}`);

    // 3. Créer un nouveau node pour appeler /api/briefing
    const callBriefingNode = {
      "parameters": {
        "method": "GET",
        "url": "={{ 'https://gob.vercel.app/api/briefing?type=' + $('Determine Time-Based Prompt').item.json.prompt_type }}",
        "options": {
          "response": {
            "response": {
              "responseFormat": "json"
            }
          }
        }
      },
      "id": "call-briefing-api-new",
      "name": "Call /api/briefing",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [19776, 4536] // Même position que Perplexity
    };

    // 4. Créer un node de confirmation email
    const confirmationNode = {
      "parameters": {
        "method": "POST",
        "url": "https://api.resend.com/emails",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Content-Type",
              "value": "application/json"
            },
            {
              "name": "Authorization",
              "value": "Bearer {{ $env.RESEND_API_KEY }}"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ { \"from\": \"Emma En Direct <noreply@gobapps.com>\", \"to\": $env.ADMIN_EMAIL || 'projetsjsl@gmail.com', \"subject\": '✅ Briefing ' + $('Determine Time-Based Prompt').item.json.prompt_type + ' envoyé avec succès', \"html\": '<h2>✅ Confirmation d\\'envoi</h2><p>Le briefing <strong>' + $('Determine Time-Based Prompt').item.json.prompt_type + '</strong> a été envoyé avec succès.</p><p><strong>Sujet:</strong> ' + $('Call /api/briefing').item.json.subject + '</p><p><strong>Destinataires:</strong> ' + ($env.BRIEFING_RECIPIENTS || 'projetsjsl@gmail.com') + '</p><p><strong>Message ID:</strong> ' + $('Send Email via Resend').item.json.id + '</p><p><strong>Envoyé à:</strong> ' + new Date().toLocaleString('fr-FR') + '</p>' } }}",
        "options": {
          "response": {
            "response": {
              "responseFormat": "json"
            }
          }
        }
      },
      "id": "send-confirmation-new",
      "name": "Send Confirmation Email",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [20672, 4536] // Après Send Email
    };

    // 5. Modifier les connections pour utiliser le nouveau node
    // Au lieu de Route by API → Perplexity/Gemini → Parse
    // On fait: Determine Time-Based Prompt → Call /api/briefing → (skip Parse et HTML) → Send Email
    
    // Modifier les nodes existants pour adapter
    // On garde tout mais on remplace juste la partie API
    
    // Pour l'instant, restaurons d'abord le workflow original
    console.log('\n📤 Restauration du workflow original...');

    const restoreResponse = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY
      },
      body: JSON.stringify({
        name: originalWorkflow.name,
        nodes: originalWorkflow.nodes,
        connections: originalWorkflow.connections,
        settings: originalWorkflow.settings || { executionOrder: 'v1' }
      })
    });

    if (!restoreResponse.ok) {
      const errorText = await restoreResponse.text();
      throw new Error(`Failed to restore: ${restoreResponse.status} - ${errorText}`);
    }

    console.log('✅ Workflow original restauré!\n');
    console.log('📝 Prochaine étape: Modifications ciblées à faire manuellement dans n8n:');
    console.log('   1. Remplacer "Call Perplexity API" et "Call Gemini API" par un seul node "Call /api/briefing"');
    console.log('   2. Modifier "Parse API Response" pour utiliser la réponse de /api/briefing');
    console.log('   3. Modifier "Generate HTML Newsletter" pour utiliser html_content de /api/briefing');
    console.log('   4. Ajouter "Send Confirmation Email" après "Send Email via Resend"');
    console.log('\n   Ou je peux faire ces modifications automatiquement si vous voulez.');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

restoreAndUpdate();

