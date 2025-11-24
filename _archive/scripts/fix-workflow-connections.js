/**
 * Vérifier et corriger toutes les connections du workflow
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const N8N_URL = 'https://projetsjsl.app.n8n.cloud';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjZjBjNGVjMS1kMjQ3LTRiMTItYmM4My0wNGE1YzIzNjQ5ZmIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYwOTc5NTkwfQ.QVXxfNeYOT2UcUTXiSvsavKF6xugvza61fOZpQZzOYA';
const WORKFLOW_ID = '03lgcA4e9uRTtli1';

async function fixConnections() {
  try {
    console.log('🔧 Vérification et correction des connections...\n');

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
    console.log(`✅ Workflow récupéré: ${workflow.name} (${workflow.nodes.length} nodes)`);

    // 2. Trouver tous les nodes importants
    const nodes = {
      prepare: workflow.nodes.find(n => n.name === 'Prepare API Request'),
      callBriefing: workflow.nodes.find(n => n.name === 'Call /api/briefing (Emma)'),
      parse: workflow.nodes.find(n => n.name === 'Parse API Response'),
      html: workflow.nodes.find(n => n.name === 'Generate HTML Newsletter'),
      sendEmail: workflow.nodes.find(n => n.name === 'Send Email via Resend'),
      confirmation: workflow.nodes.find(n => n.name === 'Send Confirmation Email'),
      saveNewsletter: workflow.nodes.find(n => n.name === 'Save Newsletter to Table' || n.name === 'Log to Newsletters Table'),
      log: workflow.nodes.find(n => n.name === 'Log to Logs Table'),
      determinePrompt: workflow.nodes.find(n => n.name === 'Determine Time-Based Prompt')
    };

    console.log('\n🔍 Nodes trouvés:');
    Object.entries(nodes).forEach(([key, node]) => {
      console.log(`   ${key}: ${node ? '✅' : '❌'} ${node?.name || 'N/A'}`);
    });

    // 3. Construire les connections correctes
    const connections = {};

    // Prepare API Request → Call /api/briefing
    if (nodes.prepare && nodes.callBriefing) {
      connections["Prepare API Request"] = {
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

    // Call /api/briefing → Parse API Response
    if (nodes.callBriefing && nodes.parse) {
      connections["Call /api/briefing (Emma)"] = {
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
    }

    // Parse API Response → Generate HTML Newsletter
    if (nodes.parse && nodes.html) {
      connections["Parse API Response"] = {
        "main": [
          [
            {
              "node": "Generate HTML Newsletter",
              "type": "main",
              "index": 0
            }
          ]
        ]
      };
    }

    // Generate HTML Newsletter → Send Email via Resend
    if (nodes.html && nodes.sendEmail) {
      connections["Generate HTML Newsletter"] = {
        "main": [
          [
            {
              "node": "Send Email via Resend",
              "type": "main",
              "index": 0
            }
          ]
        ]
      };
    }

    // Send Email via Resend → Send Confirmation Email ET Save Newsletter (en parallèle)
    if (nodes.sendEmail) {
      const sendEmailConnections = [];
      
      if (nodes.confirmation) {
        sendEmailConnections.push({
          "node": "Send Confirmation Email",
          "type": "main",
          "index": 0
        });
      }
      
      if (nodes.saveNewsletter) {
        sendEmailConnections.push({
          "node": nodes.saveNewsletter.name,
          "type": "main",
          "index": 0
        });
      }
      
      if (sendEmailConnections.length > 0) {
        connections["Send Email via Resend"] = {
          "main": [sendEmailConnections]
        };
      }
    }

    // Send Confirmation Email → Log (optionnel)
    if (nodes.confirmation && nodes.log) {
      connections["Send Confirmation Email"] = {
        "main": [
          [
            {
              "node": "Log to Logs Table",
              "type": "main",
              "index": 0
            }
          ]
        ]
      };
    }

    // Save Newsletter → Log
    if (nodes.saveNewsletter && nodes.log) {
      connections[nodes.saveNewsletter.name] = {
        "main": [
          [
            {
              "node": "Log to Logs Table",
              "type": "main",
              "index": 0
            }
          ]
        ]
      };
    }

    // 4. Préserver les connections existantes pour les triggers et autres nodes
    if (workflow.connections) {
      // Garder les connections des triggers
      const triggerNodes = [
        "Schedule Trigger (7h/12h/16h30 EST)",
        "Webhook Trigger",
        "Manual Trigger (Custom Prompt)",
        "Gmail Trigger (Custom Prompt)",
        "Telegram Trigger (Custom Prompt)",
        "Prompts Configuration",
        "Custom Prompt Input",
        "Custom Workflow Configuration",
        "Workflow Configuration",
        "Merge Triggers",
        "Get Active Tickers",
        "Determine Time-Based Prompt"
      ];

      triggerNodes.forEach(nodeName => {
        if (workflow.connections[nodeName]) {
          connections[nodeName] = workflow.connections[nodeName];
        }
      });
    }

    // 5. S'assurer que Determine Time-Based Prompt → Prepare API Request
    if (nodes.determinePrompt && nodes.prepare) {
      if (!connections["Determine Time-Based Prompt"]) {
        connections["Determine Time-Based Prompt"] = {
          "main": [
            [
              {
                "node": "Prepare API Request",
                "type": "main",
                "index": 0
              }
            ]
          ]
        };
      }
    }

    // 6. S'assurer que Get Active Tickers → Determine Time-Based Prompt
    const getTickersNode = workflow.nodes.find(n => n.name === 'Get Active Tickers');
    if (getTickersNode && nodes.determinePrompt) {
      connections["Get Active Tickers"] = {
        "main": [
          [
            {
              "node": "Determine Time-Based Prompt",
              "type": "main",
              "index": 0
            }
          ]
        ]
      };
    }

    console.log('\n📋 Connections configurées:');
    Object.keys(connections).forEach(nodeName => {
      const conn = connections[nodeName];
      if (conn && conn.main && conn.main[0]) {
        const targets = conn.main[0].map(c => c.node).join(', ');
        console.log(`   ✅ ${nodeName} → ${targets}`);
      }
    });

    // 7. Mettre à jour le workflow
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
        connections: connections,
        settings: workflow.settings || { executionOrder: 'v1' }
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Failed to update: ${updateResponse.status} - ${errorText}`);
    }

    const result = await updateResponse.json();
    console.log(`\n✅ Workflow mis à jour avec toutes les connections!`);
    console.log(`   ID: ${result.id}`);
    console.log(`   URL: ${N8N_URL}/workflow/${result.id}\n`);

    console.log('📋 Flow complet:');
    console.log('   Triggers → Prompts Configuration → Merge Triggers');
    console.log('   → Workflow Configuration → Get Active Tickers');
    console.log('   → Determine Time-Based Prompt → Prepare API Request');
    console.log('   → Call /api/briefing → Parse API Response');
    console.log('   → Generate HTML Newsletter → Send Email via Resend');
    console.log('   → Send Confirmation Email + Save Newsletter');
    console.log('   → Log to Logs Table\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

fixConnections();

