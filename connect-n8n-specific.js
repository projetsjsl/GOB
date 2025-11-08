#!/usr/bin/env node
/**
 * Connexion à l'instance n8n spécifique
 * URL: https://projetsjsl.app.n8n.cloud
 */

import https from 'https';
import http from 'http';
import readline from 'readline';

const N8N_BASE_URL = 'https://projetsjsl.app.n8n.cloud';
const WORKFLOW_ID = '03lgcA4e9uRTtli1';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;

      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers
        },
        timeout: 15000
      };

      // Authentification
      if (options.apiKey) {
        requestOptions.headers['X-N8N-API-KEY'] = options.apiKey;
      } else if (options.username && options.password) {
        const auth = Buffer.from(`${options.username}:${options.password}`).toString('base64');
        requestOptions.headers['Authorization'] = `Basic ${auth}`;
      }

      const req = client.request(requestOptions, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const jsonData = data ? JSON.parse(data) : null;
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: jsonData || data
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: data
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout après 15 secondes'));
      });

      if (options.body) {
        req.write(JSON.stringify(options.body));
      }

      req.end();
    } catch (error) {
      reject(error);
    }
  });
}

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testConnection(url) {
  try {
    log(`\n🔍 Test de connexion à ${url}...`, 'cyan');
    
    // Essayer /healthz ou /health
    let response;
    try {
      response = await makeRequest(`${url}/healthz`);
    } catch (e) {
      try {
        response = await makeRequest(`${url}/health`);
      } catch (e2) {
        // Essayer juste la racine
        response = await makeRequest(`${url}/`);
      }
    }
    
    if (response.statusCode === 200 || response.statusCode === 401) {
      log('✅ Serveur accessible!', 'green');
      return true;
    }
    return false;
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    return false;
  }
}

async function getWorkflow(url, workflowId, apiKey) {
  try {
    log(`\n📋 Récupération du workflow ${workflowId}...`, 'cyan');
    
    // Essayer l'API REST
    const apiUrl = `${url}/api/v1/workflows/${workflowId}`;
    const response = await makeRequest(apiUrl, { apiKey });
    
    if (response.statusCode === 200) {
      return response.data;
    } else if (response.statusCode === 401) {
      log('⚠️  Authentification requise', 'yellow');
      return null;
    } else {
      log(`⚠️  Status: ${response.statusCode}`, 'yellow');
      log(`   Réponse: ${JSON.stringify(response.data).substring(0, 200)}`, 'gray');
      return null;
    }
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    return null;
  }
}

async function listWorkflows(url, apiKey) {
  try {
    log(`\n📋 Liste de tous les workflows...`, 'cyan');
    const response = await makeRequest(`${url}/api/v1/workflows`, { apiKey });
    
    if (response.statusCode === 200 && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    return [];
  }
}

async function getWebhookUrl(workflow) {
  if (!workflow || !workflow.nodes) return null;
  
  for (const node of workflow.nodes) {
    if (node.type === 'n8n-nodes-base.webhook') {
      const path = node.parameters?.path || node.parameters?.path || 'webhook';
      const method = node.parameters?.httpMethod || 'POST';
      const webhookId = node.webhookId || node.id;
      
      // Construire l'URL du webhook
      // Format n8n cloud: https://[instance].app.n8n.cloud/webhook/[webhook-id]
      // ou: https://[instance].app.n8n.cloud/webhook/[path]
      return {
        method,
        path,
        webhookId,
        url: `${N8N_BASE_URL}/webhook/${webhookId || path}`
      };
    }
  }
  return null;
}

function displayWorkflow(workflow) {
  log('\n' + '='.repeat(70), 'cyan');
  log('📊 INFORMATIONS DU WORKFLOW', 'cyan');
  log('='.repeat(70), 'cyan');
  
  log(`\n📝 Nom: ${workflow.name}`, 'blue');
  log(`   ID: ${workflow.id}`, 'gray');
  log(`   Statut: ${workflow.active ? '🟢 Actif' : '⚪ Inactif'}`, workflow.active ? 'green' : 'yellow');
  
  if (workflow.tags && workflow.tags.length > 0) {
    const tags = workflow.tags.map(t => t.name || t).join(', ');
    log(`   Tags: ${tags}`, 'magenta');
  }
  
  if (workflow.createdAt) {
    log(`   Créé: ${new Date(workflow.createdAt).toLocaleString('fr-FR')}`, 'gray');
  }
  
  if (workflow.updatedAt) {
    log(`   Modifié: ${new Date(workflow.updatedAt).toLocaleString('fr-FR')}`, 'gray');
  }
  
  // Analyser les nodes
  if (workflow.nodes && workflow.nodes.length > 0) {
    log(`\n🔧 Nodes (${workflow.nodes.length}):`, 'cyan');
    
    workflow.nodes.forEach((node, index) => {
      const type = node.type || 'unknown';
      const name = node.name || `Node ${index + 1}`;
      log(`   ${index + 1}. ${name}`, 'blue');
      log(`      Type: ${type}`, 'gray');
      
      // Informations spécifiques selon le type
      if (type === 'n8n-nodes-base.webhook') {
        const path = node.parameters?.path || 'non défini';
        const method = node.parameters?.httpMethod || 'GET';
        log(`      Webhook: ${method} /webhook/${path}`, 'magenta');
      } else if (type === 'n8n-nodes-base.cron') {
        const cron = node.parameters?.rule?.cronExpression || 'non défini';
        log(`      Cron: ${cron}`, 'magenta');
      } else if (type === 'n8n-nodes-base.httpRequest') {
        const url = node.parameters?.url || 'non défini';
        log(`      URL: ${url}`, 'magenta');
      }
    });
  }
  
  // Webhook URL
  const webhook = getWebhookUrl(workflow);
  if (webhook) {
    log(`\n🔗 Webhook disponible:`, 'cyan');
    log(`   Méthode: ${webhook.method}`, 'blue');
    log(`   URL: ${webhook.url}`, 'green');
    log(`   Path: ${webhook.path}`, 'gray');
  }
  
  log('\n' + '='.repeat(70), 'cyan');
}

async function main() {
  log('\n🚀 Connexion à n8n Cloud', 'cyan');
  log(`URL: ${N8N_BASE_URL}`, 'blue');
  log(`Workflow ID: ${WORKFLOW_ID}`, 'blue');
  
  // Parser les arguments
  const args = process.argv.slice(2);
  let apiKey = process.env.N8N_API_KEY;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--api-key' && args[i + 1]) {
      apiKey = args[i + 1];
      i++;
    }
  }
  
  // Test de connexion
  const connected = await testConnection(N8N_BASE_URL);
  
  if (!connected) {
    log('\n❌ Impossible de se connecter au serveur', 'red');
    rl.close();
    process.exit(1);
  }
  
  // Demander l'API key si nécessaire (seulement si stdin est un TTY)
  if (!apiKey && process.stdin.isTTY) {
    log('\n🔐 Authentification requise', 'yellow');
    log('   Vous pouvez obtenir votre API key dans:', 'yellow');
    log('   n8n → Settings → API', 'yellow');
    log('   Ou utilisez: node connect-n8n-specific.js --api-key VOTRE_CLE', 'yellow');
    try {
      apiKey = await question('API Key (ou appuyez sur Entrée pour continuer sans auth): ');
      if (!apiKey || apiKey.trim() === '') {
        apiKey = null;
        log('⚠️  Continuation sans authentification (accès limité)', 'yellow');
      }
    } catch (e) {
      apiKey = null;
      log('⚠️  Continuation sans authentification (mode non-interactif)', 'yellow');
    }
  } else if (!apiKey) {
    log('\n⚠️  Pas d\'API key fournie - accès limité', 'yellow');
    log('   Utilisez: export N8N_API_KEY=votre_cle', 'yellow');
    log('   Ou: node connect-n8n-specific.js --api-key votre_cle', 'yellow');
  }
  
  // Récupérer le workflow spécifique
  const workflow = await getWorkflow(N8N_BASE_URL, WORKFLOW_ID, apiKey);
  
  if (workflow) {
    displayWorkflow(workflow);
    
    // Sauvegarder le workflow dans un fichier
    const fs = await import('fs');
    const filename = `n8n-workflow-${WORKFLOW_ID}.json`;
    fs.writeFileSync(filename, JSON.stringify(workflow, null, 2));
    log(`\n💾 Workflow sauvegardé dans: ${filename}`, 'green');
  } else {
    log('\n⚠️  Impossible de récupérer le workflow spécifique', 'yellow');
    log('   Cela peut être dû à:', 'yellow');
    log('   - Authentification requise', 'yellow');
    log('   - Workflow inexistant ou non accessible', 'yellow');
    log('   - Permissions insuffisantes', 'yellow');
  }
  
  // Lister tous les workflows si authentifié
  if (apiKey) {
    const workflows = await listWorkflows(N8N_BASE_URL, apiKey);
    if (workflows.length > 0) {
      log(`\n📚 Tous les workflows (${workflows.length}):`, 'cyan');
      workflows.forEach((w, index) => {
        const status = w.active ? '🟢' : '⚪';
        log(`   ${index + 1}. ${status} ${w.name} (${w.id})`, 'blue');
      });
    }
  }
  
  log('\n✅ Terminé!', 'green');
  rl.close();
}

main().catch((error) => {
  log(`\n❌ Erreur: ${error.message}`, 'red');
  console.error(error);
  rl.close();
  process.exit(1);
});

