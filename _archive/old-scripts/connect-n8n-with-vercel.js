#!/usr/bin/env node
/**
 * Connexion à n8n en récupérant l'API key depuis Vercel ou .env.local
 */

import https from 'https';
import http from 'http';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const N8N_BASE_URL = 'https://projetsjsl.app.n8n.cloud';
const WORKFLOW_ID = '03lgcA4e9uRTtli1';

// Charger les variables d'environnement depuis .env.local si disponible
function loadEnvFile() {
  const envFiles = ['.env.local', '.env', '.env.production'];
  
  for (const envFile of envFiles) {
    const envPath = join(__dirname, envFile);
    if (existsSync(envPath)) {
      try {
        const content = readFileSync(envPath, 'utf-8');
        const lines = content.split('\n');
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
              const value = valueParts.join('=').replace(/^["']|["']$/g, '');
              if (!process.env[key]) {
                process.env[key] = value;
              }
            }
          }
        }
        console.log(`✅ Variables chargées depuis ${envFile}`);
        return true;
      } catch (error) {
        // Ignorer les erreurs de lecture
      }
    }
  }
  return false;
}

// Charger .env.local
loadEnvFile();

// Récupérer l'API key
let apiKey = process.env.N8N_API_KEY;

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

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(url);
      const client = https;

      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers
        },
        timeout: 15000
      };

      if (options.apiKey) {
        requestOptions.headers['X-N8N-API-KEY'] = options.apiKey;
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

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout'));
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

async function getWorkflow(url, workflowId, apiKey) {
  try {
    log(`\n📋 Récupération du workflow ${workflowId}...`, 'cyan');
    
    const apiUrl = `${url}/api/v1/workflows/${workflowId}`;
    const response = await makeRequest(apiUrl, { apiKey });
    
    if (response.statusCode === 200) {
      return response.data;
    } else if (response.statusCode === 401) {
      log('❌ Authentification échouée (401)', 'red');
      log('   Vérifiez que votre API key est correcte', 'yellow');
      return null;
    } else {
      log(`⚠️  Status: ${response.statusCode}`, 'yellow');
      if (response.data && typeof response.data === 'object') {
        log(`   Erreur: ${JSON.stringify(response.data)}`, 'gray');
      }
      return null;
    }
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    return null;
  }
}

async function listWorkflows(url, apiKey) {
  try {
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
      
      if (type === 'n8n-nodes-base.webhook') {
        const path = node.parameters?.path || 'non défini';
        const method = node.parameters?.httpMethod || 'GET';
        const webhookId = node.webhookId || node.id;
        log(`      Webhook: ${method} /webhook/${webhookId || path}`, 'magenta');
        log(`      URL: ${N8N_BASE_URL}/webhook/${webhookId || path}`, 'green');
      } else if (type === 'n8n-nodes-base.cron') {
        const cron = node.parameters?.rule?.cronExpression || 'non défini';
        log(`      Cron: ${cron}`, 'magenta');
      } else if (type === 'n8n-nodes-base.httpRequest') {
        const url = node.parameters?.url || 'non défini';
        log(`      URL: ${url}`, 'magenta');
      }
    });
  }
  
  log('\n' + '='.repeat(70), 'cyan');
}

async function main() {
  log('\n🚀 Connexion à n8n Cloud', 'cyan');
  log(`URL: ${N8N_BASE_URL}`, 'blue');
  log(`Workflow ID: ${WORKFLOW_ID}`, 'blue');
  
  // Vérifier l'API key
  if (!apiKey) {
    log('\n❌ N8N_API_KEY non trouvée', 'red');
    log('\n💡 Solutions:', 'yellow');
    log('   1. Récupérer depuis Vercel:', 'yellow');
    log('      ./get-n8n-api-key.sh', 'blue');
    log('      ou: vercel env pull .env.local', 'blue');
    log('   2. Définir manuellement:', 'yellow');
    log('      export N8N_API_KEY=votre_cle', 'blue');
    log('   3. Passer en argument:', 'yellow');
    log('      node connect-n8n-with-vercel.js --api-key votre_cle', 'blue');
    process.exit(1);
  }
  
  // Masquer partiellement la clé pour l'affichage
  const keyDisplay = apiKey.length > 8 
    ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`
    : '***';
  log(`\n🔑 API Key: ${keyDisplay}`, 'green');
  
  // Récupérer le workflow
  const workflow = await getWorkflow(N8N_BASE_URL, WORKFLOW_ID, apiKey);
  
  if (workflow) {
    displayWorkflow(workflow);
    
    // Sauvegarder le workflow
    const fs = await import('fs');
    const filename = `n8n-workflow-${WORKFLOW_ID}.json`;
    fs.writeFileSync(filename, JSON.stringify(workflow, null, 2));
    log(`\n💾 Workflow sauvegardé dans: ${filename}`, 'green');
    
    // Lister tous les workflows
    log('\n📚 Récupération de tous les workflows...', 'cyan');
    const workflows = await listWorkflows(N8N_BASE_URL, apiKey);
    if (workflows.length > 0) {
      log(`\n✅ ${workflows.length} workflow(s) trouvé(s):\n`, 'green');
      workflows.forEach((w, index) => {
        const status = w.active ? '🟢' : '⚪';
        log(`   ${index + 1}. ${status} ${w.name} (${w.id})`, 'blue');
      });
    }
  } else {
    log('\n❌ Impossible de récupérer le workflow', 'red');
    process.exit(1);
  }
  
  log('\n✅ Terminé!', 'green');
}

// Parser les arguments
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--api-key' && args[i + 1]) {
    apiKey = args[i + 1];
    i++;
  }
}

main().catch((error) => {
  log(`\n❌ Erreur: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

