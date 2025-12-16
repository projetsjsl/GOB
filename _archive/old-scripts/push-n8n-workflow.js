/**
 * Script pour pousser le workflow n8n mis à jour dans n8n
 * Support français (matin/midi/soir) + sélection manuelle des briefings
 */

import { readFileSync } from 'fs';
import https from 'https';

const N8N_URL = process.env.N8N_URL || 'https://projetsjsl.app.n8n.cloud';
const N8N_API_KEY = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjZjBjNGVjMS1kMjQ3LTRiMTItYmM4My0wNGE1YzIzNjQ5ZmIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYwOTc5NTkwfQ.QVXxfNeYOT2UcUTXiSvsavKF6xugvza61fOZpQZzOYA';
const WORKFLOW_ID = '03lgcA4e9uRTtli1';
const WORKFLOW_FILE = 'n8n-workflow-03lgcA4e9uRTtli1.json';

function log(message, color = 'white') {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY,
        ...options.headers,
      },
    };

    const req = https.request(urlObj, requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => reject(error));

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function updateWorkflow() {
  try {
    log('\n📥 Chargement du workflow local...', 'cyan');
    
    const workflow = JSON.parse(readFileSync(WORKFLOW_FILE, 'utf-8'));

    log('✅ Workflow chargé', 'green');
    log(`   Nom: ${workflow.name}`, 'blue');
    log(`   Nodes: ${workflow.nodes.length}`, 'blue');

    // Nettoyer le workflow pour l'API (garder toutes les propriétés importantes)
    // Note: 'active' est en lecture seule et ne peut pas être modifié via l'API
    const cleanWorkflow = {
      name: workflow.name,
      nodes: workflow.nodes.map(node => {
        const cleanNode = {
          id: node.id,
          name: node.name,
          type: node.type,
          typeVersion: node.typeVersion,
          position: node.position,
          parameters: node.parameters
        };
        if (node.credentials) cleanNode.credentials = node.credentials;
        if (node.webhookId) cleanNode.webhookId = node.webhookId;
        return cleanNode;
      }),
      connections: workflow.connections,
      settings: workflow.settings || { executionOrder: 'v1' },
      staticData: workflow.staticData || null
    };

    log('\n🔄 Mise à jour du workflow dans n8n...', 'cyan');
    const apiUrl = `${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`;
    const response = await makeRequest(apiUrl, {
      method: 'PUT',
      body: cleanWorkflow
    });

    if (response.statusCode === 200) {
      log('\n✅ Workflow mis à jour avec succès!', 'green');
      log(`   ID: ${WORKFLOW_ID}`, 'blue');
      log(`   Nom: ${workflow.name}`, 'blue');
      log(`   Nodes: ${workflow.nodes.length}`, 'blue');
      log(`\n🔗 URL: ${N8N_URL}/workflow/${WORKFLOW_ID}`, 'cyan');
      log('\n📋 Modifications appliquées :', 'yellow');
      log('   ✅ Support français: "matin", "midi", "soir" acceptés', 'green');
      log('   ✅ Conversion automatique FR → EN pour compatibilité API', 'green');
      log('   ✅ Nœud "🎯 Manual Briefing Selector" pour tester chaque briefing', 'green');
      log('   ✅ Prompts récupérés depuis GitHub via /api/briefing-prompts', 'green');
      log('   ✅ Sélection manuelle du type de briefing (matin/midi/soir)', 'green');
      log('\n💡 Pour tester:', 'cyan');
      log('   1. Ouvrez le nœud "🎯 Manual Briefing Selector (MODIFIEZ ICI)"', 'blue');
      log('   2. Modifiez briefing_type: "matin", "midi", ou "soir"', 'blue');
      log('   3. Exécutez depuis "Manual Trigger (Custom Prompt)"', 'blue');
    } else {
      log(`\n❌ Erreur lors de la mise à jour: ${response.statusCode}`, 'red');
      if (response.data && typeof response.data === 'object') {
        log(`   Détails: ${JSON.stringify(response.data, null, 2)}`, 'yellow');
      } else {
        log(`   Détails: ${response.data}`, 'yellow');
      }
      process.exit(1);
    }
  } catch (error) {
    log(`\n❌ Erreur: ${error.message}`, 'red');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

updateWorkflow();

