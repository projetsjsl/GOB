/**
 * Adapter le workflow existant pour utiliser Emma Agent et ajouter confirmations
 * SANS supprimer les fonctionnalités existantes
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const N8N_URL = 'https://projetsjsl.app.n8n.cloud';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjZjBjNGVjMS1kMjQ3LTRiMTItYmM4My0wNGE1YzIzNjQ5ZmIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYwOTc5NTkwfQ.QVXxfNeYOT2UcUTXiSvsavKF6xugvza61fOZpQZzOYA';
const WORKFLOW_ID = '03lgcA4e9uRTtli1';

async function adaptWorkflow() {
  try {
    console.log('🔧 Adaptation du workflow pour utiliser Emma Agent...\n');

    // 1. Lire le workflow original
    const workflowPath = join(__dirname, 'n8n-workflow-03lgcA4e9uRTtli1.json');
    const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

    console.log(`✅ Workflow lu: ${workflow.name} (${workflow.nodes.length} nodes)`);

    // 2. Trouver les nodes à modifier
    const routeNode = workflow.nodes.find(n => n.name === 'Route by API');
    const perplexityNode = workflow.nodes.find(n => n.name === 'Call Perplexity API');
    const geminiNode = workflow.nodes.find(n => n.name === 'Call Gemini API');
    const parseNode = workflow.nodes.find(n => n.name === 'Parse API Response');
    const htmlNode = workflow.nodes.find(n => n.name === 'Generate HTML Newsletter');
    const sendEmailNode = workflow.nodes.find(n => n.name === 'Send Email via Resend');
    const determinePromptNode = workflow.nodes.find(n => n.name === 'Determine Time-Based Prompt');

    console.log('\n🔍 Nodes identifiés:');
    console.log(`   Route by API: ${routeNode ? '✅' : '❌'}`);
    console.log(`   Perplexity: ${perplexityNode ? '✅' : '❌'}`);
    console.log(`   Gemini: ${geminiNode ? '✅' : '❌'}`);
    console.log(`   Parse: ${parseNode ? '✅' : '❌'}`);
    console.log(`   HTML: ${htmlNode ? '✅' : '❌'}`);
    console.log(`   Send Email: ${sendEmailNode ? '✅' : '❌'}`);

    // 3. MODIFICATION 1: Remplacer Perplexity/Gemini par un appel à /api/briefing
    // On garde le node Route mais on le modifie pour appeler /api/briefing au lieu de router
    
    // Créer un nouveau node pour appeler /api/briefing
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
      "id": "call-briefing-emma",
      "name": "Call /api/briefing (Emma)",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": perplexityNode ? perplexityNode.position : [19776, 4512]
    };

    // 4. MODIFICATION 2: Adapter Parse API Response pour utiliser la réponse de /api/briefing
    if (parseNode) {
      parseNode.parameters.jsCode = `const items = $input.all();
const data = items[0].json;

// La réponse de /api/briefing contient déjà content et html_content
const content = data.content || data.response || 'No content received';
const htmlContent = data.html_content || '';

return [{
  json: {
    ...data,
    newsletter_content: content,
    html_content: htmlContent,
    generated_at: new Date().toISOString()
  }
}];`;
    }

    // 5. MODIFICATION 3: Adapter Generate HTML Newsletter pour utiliser html_content
    if (htmlNode) {
      htmlNode.parameters.jsCode = `const items = $input.all();
const data = items[0].json;

// Si html_content existe déjà (depuis /api/briefing), l'utiliser directement
if (data.html_content) {
  return [{
    json: {
      ...data,
      html_content: data.html_content,
      subject: data.subject || \`Newsletter Emma - \${data.prompt_type || 'Briefing'}\`
    }
  }];
}

// Sinon, générer le HTML comme avant (fallback)
const promptTypeFrench = {
  'morning': 'MATIN',
  'noon': 'MIDI',
  'evening': 'SOIR',
  'custom': 'PERSONNALISÉE'
};

const editionType = promptTypeFrench[data.prompt_type] || (data.prompt_type ? data.prompt_type.toUpperCase() : 'PERSONNALISÉE');

const html = \`
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Newsletter Financière Emma</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      background-color: #f4f4f4;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      padding: 40px 30px; 
      text-align: center;
    }
    .header h1 { 
      margin: 0; 
      font-size: 32px; 
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .subtitle { 
      margin-top: 12px; 
      opacity: 0.95; 
      font-size: 14px;
      font-weight: 500;
      letter-spacing: 0.5px;
    }
    .content { 
      background: #ffffff; 
      padding: 35px 30px;
    }
    .analysis { 
      background: #f9fafb; 
      padding: 25px; 
      border-radius: 10px; 
      margin-bottom: 25px; 
      border-left: 5px solid #667eea;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    .analysis p {
      margin-bottom: 12px;
    }
    .ticker-box {
      margin-top: 25px; 
      padding: 20px; 
      background: linear-gradient(135deg, #e8f4f8 0%, #d4e9f7 100%);
      border-radius: 10px;
      border: 1px solid #b8dff0;
    }
    .ticker-box strong {
      color: #2c5282;
      font-size: 15px;
      display: block;
      margin-bottom: 8px;
    }
    .ticker-list {
      color: #1a365d;
      font-weight: 500;
      font-size: 14px;
    }
    .footer { 
      text-align: center; 
      padding: 25px 30px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 8px 0;
      font-size: 13px;
      color: #6b7280;
    }
    .footer .powered-by {
      font-weight: 600;
      color: #4b5563;
    }
    .timestamp {
      font-size: 12px;
      color: #9ca3af;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Newsletter Financière Emma</h1>
      <div class="subtitle">ÉDITION DU \${editionType} | \${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>
    <div class="content">
      <div class="analysis">
        \${(data.newsletter_content || '').replace(/\\n/g, '<br>')}
      </div>
      \${data.tickers ? \`
      <div class="ticker-box">
        <strong>📈 Tickers suivis :</strong>
        <div class="ticker-list">\${data.tickers}</div>
      </div>
      \` : ''}
    </div>
    <div class="footer">
      <p class="powered-by">Généré par Emma IA | Propulsé par Emma Agent</p>
      <p class="timestamp">Généré le \${new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</p>
      <p>Ceci est une newsletter automatisée. Merci de ne pas répondre à cet email.</p>
    </div>
  </div>
</body>
</html>
\`;

const subjectMap = {
  'morning': 'Matin',
  'noon': 'Midi',
  'evening': 'Soir',
  'custom': 'Personnalisée'
};

const subjectType = subjectMap[data.prompt_type] || data.prompt_type;

return [{
  json: {
    ...data,
    html_content: html,
    subject: data.subject || \`Newsletter Emma - Mise à jour du \${subjectType}\`
  }
}];`;
    }

    // 6. MODIFICATION 4: Ajouter un node de confirmation email après Send Email
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
        "jsonBody": "={{ { \"from\": \"Emma En Direct <noreply@gobapps.com>\", \"to\": $env.ADMIN_EMAIL || 'projetsjsl@gmail.com', \"subject\": '✅ Briefing ' + $('Determine Time-Based Prompt').item.json.prompt_type + ' envoyé avec succès', \"html\": '<h2>✅ Confirmation d\\'envoi</h2><p>Le briefing <strong>' + $('Determine Time-Based Prompt').item.json.prompt_type + '</strong> a été envoyé avec succès.</p><p><strong>Sujet:</strong> ' + $('Generate HTML Newsletter').item.json.subject + '</p><p><strong>Destinataires:</strong> ' + ($env.BRIEFING_RECIPIENTS || 'projetsjsl@gmail.com') + '</p><p><strong>Message ID:</strong> ' + $('Send Email via Resend').item.json.id + '</p><p><strong>Envoyé à:</strong> ' + new Date().toLocaleString('fr-FR') + '</p>' } }}",
        "options": {
          "response": {
            "response": {
              "responseFormat": "json"
            }
          }
        }
      },
      "id": "send-confirmation-emma",
      "name": "Send Confirmation Email",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": sendEmailNode ? [sendEmailNode.position[0] + 200, sendEmailNode.position[1]] : [20672, 4536]
    };

    // 7. Modifier les connections:
    // - Route by API → Call /api/briefing (au lieu de Perplexity/Gemini)
    // - Call /api/briefing → Parse API Response
    // - Send Email → Send Confirmation Email (en parallèle avec Log)

    // Remplacer les nodes Perplexity et Gemini par le nouveau node
    const perplexityIndex = workflow.nodes.findIndex(n => n.id === perplexityNode?.id);
    const geminiIndex = workflow.nodes.findIndex(n => n.id === geminiNode?.id);

    if (perplexityIndex !== -1) {
      workflow.nodes[perplexityIndex] = callBriefingNode;
    }
    if (geminiIndex !== -1) {
      // Supprimer Gemini node (on n'en a plus besoin)
      workflow.nodes.splice(geminiIndex, 1);
    }

    // Ajouter le node de confirmation
    workflow.nodes.push(confirmationNode);

    // 8. Modifier les connections
    if (workflow.connections) {
      // Modifier Route by API pour pointer vers Call /api/briefing
      if (workflow.connections["Route by API"]) {
        // Remplacer les deux routes (perplexity et gemini) par une seule vers /api/briefing
        workflow.connections["Route by API"] = {
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

      // Modifier Call /api/briefing pour pointer vers Parse
      workflow.connections["Call /api/briefing (Emma)"] = {
        "main": [
          [
            {
              "node": "Parse API Response",
              "type": "main",
              "index": 0
            }
          ]
        ]
      };

      // Modifier Send Email pour pointer vers Confirmation ET Log (en parallèle)
      if (workflow.connections["Send Email via Resend"]) {
        const currentConnections = workflow.connections["Send Email via Resend"].main[0] || [];
        workflow.connections["Send Email via Resend"] = {
          "main": [
            [
              ...currentConnections,
              {
                "node": "Send Confirmation Email",
                "type": "main",
                "index": 0
              }
            ]
          ]
        };
      }
    }

    // 9. Sauvegarder le workflow modifié
    const outputPath = join(__dirname, 'n8n-workflow-adapted.json');
    writeFileSync(outputPath, JSON.stringify(workflow, null, 2));
    console.log(`\n✅ Workflow adapté sauvegardé: ${outputPath}`);

    // 10. Mettre à jour sur n8n
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
    console.log(`\n✅ Workflow mis à jour avec succès!`);
    console.log(`   ID: ${result.id}`);
    console.log(`   Nom: ${result.name}`);
    console.log(`   URL: ${N8N_URL}/workflow/${result.id}\n`);

    console.log('📋 Modifications appliquées:');
    console.log('   ✅ Remplacement Perplexity/Gemini par Call /api/briefing (Emma)');
    console.log('   ✅ Adaptation Parse API Response pour /api/briefing');
    console.log('   ✅ Adaptation Generate HTML Newsletter (utilise html_content si disponible)');
    console.log('   ✅ Ajout Send Confirmation Email après Send Email\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

adaptWorkflow();

