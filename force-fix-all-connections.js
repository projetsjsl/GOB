/**
 * Forcer la correction de toutes les connections
 * Supprimer toutes les références à Switch et reconnecter correctement
 */

const N8N_URL = 'https://projetsjsl.app.n8n.cloud';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjZjBjNGVjMS1kMjQ3LTRiMTItYmM4My0wNGE1YzIzNjQ5ZmIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYwOTc5NTkwfQ.QVXxfNeYOT2UcUTXiSvsavKF6xugvza61fOZpQZzOYA';
const WORKFLOW_ID = '03lgcA4e9uRTtli1';

async function forceFixConnections() {
  try {
    console.log('🔧 Correction forcée de toutes les connections...\n');

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

    // Créer un map des nodes par ID et par nom
    const nodesById = {};
    const nodesByName = {};
    workflow.nodes.forEach(node => {
      nodesById[node.id] = node;
      nodesByName[node.name] = node;
    });

    // Supprimer TOUS les nodes Switch
    workflow.nodes = workflow.nodes.filter(n => 
      n.type !== 'n8n-nodes-base.switch' && 
      n.name !== 'Switch' &&
      n.name !== 'Route by API'
    );

    // Construire les connections correctes depuis zéro
    const connections = {};

    // 1. Triggers → Configuration
    if (nodesByName["Schedule Trigger (7h/12h/16h30 EST)"]) {
      connections["Schedule Trigger (7h/12h/16h30 EST)"] = {
        "main": [[{ "node": "Prompts Configuration", "type": "main", "index": 0 }]]
      };
    }

    if (nodesByName["Webhook Trigger"]) {
      connections["Webhook Trigger"] = {
        "main": [[{ "node": "Prompts Configuration", "type": "main", "index": 0 }]]
      };
    }

    if (nodesByName["Manual Trigger (Custom Prompt)"]) {
      connections["Manual Trigger (Custom Prompt)"] = {
        "main": [[{ "node": "Custom Prompt Input", "type": "main", "index": 0 }]]
      };
    }

    if (nodesByName["Gmail Trigger (Custom Prompt)"]) {
      connections["Gmail Trigger (Custom Prompt)"] = {
        "main": [[{ "node": "Custom Workflow Configuration", "type": "main", "index": 0 }]]
      };
    }

    if (nodesByName["Telegram Trigger (Custom Prompt)"]) {
      connections["Telegram Trigger (Custom Prompt)"] = {
        "main": [[{ "node": "Custom Workflow Configuration", "type": "main", "index": 0 }]]
      };
    }

    // 2. Configuration → Merge
    if (nodesByName["Prompts Configuration"]) {
      connections["Prompts Configuration"] = {
        "main": [[{ "node": "Merge Triggers", "type": "main", "index": 1 }]]
      };
    }

    if (nodesByName["Custom Prompt Input"]) {
      connections["Custom Prompt Input"] = {
        "main": [[{ "node": "Merge Triggers", "type": "main", "index": 0 }]]
      };
    }

    // 3. Merge → Workflow Configuration
    if (nodesByName["Merge Triggers"]) {
      connections["Merge Triggers"] = {
        "main": [[{ "node": "Workflow Configuration", "type": "main", "index": 0 }]]
      };
    }

    // 4. Workflow Configuration → Get Active Tickers
    if (nodesByName["Workflow Configuration"]) {
      connections["Workflow Configuration"] = {
        "main": [[{ "node": "Get Active Tickers", "type": "main", "index": 0 }]]
      };
    }

    if (nodesByName["Custom Workflow Configuration"]) {
      connections["Custom Workflow Configuration"] = {
        "main": [[{ "node": "Get Active Tickers", "type": "main", "index": 0 }]]
      };
    }

    // 5. Get Active Tickers → Determine Time-Based Prompt
    if (nodesByName["Get Active Tickers"]) {
      connections["Get Active Tickers"] = {
        "main": [[{ "node": "Determine Time-Based Prompt", "type": "main", "index": 0 }]]
      };
    }

    // 6. Determine Time-Based Prompt → Prepare API Request
    if (nodesByName["Determine Time-Based Prompt"]) {
      connections["Determine Time-Based Prompt"] = {
        "main": [[{ "node": "Prepare API Request", "type": "main", "index": 0 }]]
      };
    }

    // 7. Prepare API Request → Call /api/briefing
    if (nodesByName["Prepare API Request"]) {
      connections["Prepare API Request"] = {
        "main": [[{ "node": "Call /api/briefing (Emma)", "type": "main", "index": 0 }]]
      };
    }

    // 8. Call /api/briefing → Parse API Response
    if (nodesByName["Call /api/briefing (Emma)"]) {
      connections["Call /api/briefing (Emma)"] = {
        "main": [[{ "node": "Parse API Response", "type": "main", "index": 0 }]]
      };
    }

    // 9. Parse API Response → Generate HTML Newsletter
    if (nodesByName["Parse API Response"]) {
      connections["Parse API Response"] = {
        "main": [[{ "node": "Generate HTML Newsletter", "type": "main", "index": 0 }]]
      };
    }

    // 10. Generate HTML Newsletter → Send Email via Resend
    if (nodesByName["Generate HTML Newsletter"]) {
      connections["Generate HTML Newsletter"] = {
        "main": [[{ "node": "Send Email via Resend", "type": "main", "index": 0 }]]
      };
    }

    // 11. Send Email via Resend → Send Confirmation Email + Log to Newsletters Table
    if (nodesByName["Send Email via Resend"]) {
      const sendEmailConnections = [];
      if (nodesByName["Send Confirmation Email"]) {
        sendEmailConnections.push({ "node": "Send Confirmation Email", "type": "main", "index": 0 });
      }
      if (nodesByName["Log to Newsletters Table"]) {
        sendEmailConnections.push({ "node": "Log to Newsletters Table", "type": "main", "index": 0 });
      }
      if (sendEmailConnections.length > 0) {
        connections["Send Email via Resend"] = {
          "main": [sendEmailConnections]
        };
      }
    }

    // 12. Send Confirmation Email → Log to Logs Table
    if (nodesByName["Send Confirmation Email"] && nodesByName["Log to Logs Table"]) {
      connections["Send Confirmation Email"] = {
        "main": [[{ "node": "Log to Logs Table", "type": "main", "index": 0 }]]
      };
    }

    // 13. Log to Newsletters Table → Log to Logs Table
    if (nodesByName["Log to Newsletters Table"] && nodesByName["Log to Logs Table"]) {
      connections["Log to Newsletters Table"] = {
        "main": [[{ "node": "Log to Logs Table", "type": "main", "index": 0 }]]
      };
    }

    console.log(`\n📋 Connections configurées: ${Object.keys(connections).length}`);
    Object.keys(connections).forEach(nodeName => {
      const conn = connections[nodeName];
      if (conn && conn.main && conn.main[0]) {
        const targets = conn.main[0].map(c => c.node).join(', ');
        console.log(`   ✅ ${nodeName} → ${targets}`);
      }
    });

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
        connections: connections,
        settings: workflow.settings || { executionOrder: 'v1' }
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Failed to update: ${updateResponse.status} - ${errorText}`);
    }

    console.log(`\n✅ Workflow corrigé avec toutes les connections!`);
    console.log(`   URL: ${N8N_URL}/workflow/${WORKFLOW_ID}\n`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

forceFixConnections();

