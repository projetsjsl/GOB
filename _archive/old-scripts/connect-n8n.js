#!/usr/bin/env node
/**
 * Script interactif pour se connecter à n8n
 * 
 * Usage:
 *   node connect-n8n.js
 *   node connect-n8n.js --url https://n8n.votredomaine.com
 *   node connect-n8n.js --url http://localhost:5678 --api-key votre-cle
 */

import readline from 'readline';
import https from 'https';
import http from 'http';

// Configuration depuis les arguments ou variables d'environnement
const args = process.argv.slice(2);
let n8nUrl = process.env.N8N_URL || process.env.N8N_WEBHOOK_BASE_URL;
let n8nApiKey = process.env.N8N_API_KEY;
let n8nUsername = process.env.N8N_USERNAME;
let n8nPassword = process.env.N8N_PASSWORD;

// Parser les arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--url' && args[i + 1]) {
    n8nUrl = args[i + 1];
    i++;
  } else if (args[i] === '--api-key' && args[i + 1]) {
    n8nApiKey = args[i + 1];
    i++;
  } else if (args[i] === '--username' && args[i + 1]) {
    n8nUsername = args[i + 1];
    i++;
  } else if (args[i] === '--password' && args[i + 1]) {
    n8nPassword = args[i + 1];
    i++;
  }
}

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
          ...options.headers
        },
        timeout: 10000
      };

      // Authentification
      if (n8nApiKey) {
        requestOptions.headers['X-N8N-API-KEY'] = n8nApiKey;
      } else if (n8nUsername && n8nPassword) {
        const auth = Buffer.from(`${n8nUsername}:${n8nPassword}`).toString('base64');
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

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testConnection(url) {
  try {
    log(`\n🔍 Test de connexion à ${url}...`, 'cyan');
    const response = await makeRequest(`${url}/healthz`);
    
    if (response.statusCode === 200) {
      log('✅ Connexion réussie!', 'green');
      return true;
    }
    return false;
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    return false;
  }
}

async function getWorkflows(url) {
  try {
    const response = await makeRequest(`${url}/api/v1/workflows`);
    
    if (response.statusCode === 200 && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  } catch (error) {
    log(`❌ Erreur lors de la récupération des workflows: ${error.message}`, 'red');
    return [];
  }
}

async function main() {
  log('\n🚀 Connexion à n8n', 'cyan');
  log('='.repeat(60), 'cyan');

  // Demander l'URL si non fournie
  if (!n8nUrl) {
    log('\n📝 Configuration requise:', 'yellow');
    n8nUrl = await question('URL de votre instance n8n (ex: https://n8n.votredomaine.com ou http://localhost:5678): ');
    
    if (!n8nUrl) {
      log('❌ URL requise', 'red');
      rl.close();
      process.exit(1);
    }
  }

  // Nettoyer l'URL
  n8nUrl = n8nUrl.trim().replace(/\/$/, '');

  // Demander les credentials si nécessaire
  if (!n8nApiKey && !n8nUsername) {
    log('\n🔐 Authentification:', 'yellow');
    const authType = await question('Type d\'auth (1=API Key, 2=Username/Password, 3=Skip): ');
    
    if (authType === '1') {
      n8nApiKey = await question('API Key: ');
    } else if (authType === '2') {
      n8nUsername = await question('Username: ');
      n8nPassword = await question('Password: ');
    }
  }

  // Test de connexion
  const connected = await testConnection(n8nUrl);
  
  if (!connected) {
    log('\n❌ Impossible de se connecter', 'red');
    log('\n💡 Vérifiez:', 'yellow');
    log('   - Que n8n est démarré', 'yellow');
    log('   - Que l\'URL est correcte', 'yellow');
    log('   - Votre firewall/proxy', 'yellow');
    rl.close();
    process.exit(1);
  }

  // Récupérer les workflows
  log('\n📋 Récupération des workflows...', 'cyan');
  const workflows = await getWorkflows(n8nUrl);

  if (workflows.length > 0) {
    log(`\n✅ ${workflows.length} workflow(s) trouvé(s):\n`, 'green');
    
    workflows.forEach((workflow, index) => {
      const status = workflow.active ? '🟢 Actif' : '⚪ Inactif';
      const tags = workflow.tags?.map(t => t.name).join(', ') || 'Aucun tag';
      log(`   ${index + 1}. ${workflow.name}`, 'blue');
      log(`      ID: ${workflow.id} | ${status} | Tags: ${tags}`, 'cyan');
    });

    // Afficher les webhooks
    log('\n🔗 Webhooks disponibles:', 'cyan');
    workflows.forEach(workflow => {
      if (workflow.nodes) {
        workflow.nodes.forEach(node => {
          if (node.type === 'n8n-nodes-base.webhook') {
            const path = node.parameters?.path || 'non défini';
            const method = node.parameters?.httpMethod || 'GET';
            log(`   - ${workflow.name}: ${method} /webhook/${path}`, 'magenta');
          }
        });
      }
    });
  } else {
    log('\n⚠️  Aucun workflow trouvé', 'yellow');
  }

  log('\n' + '='.repeat(60), 'cyan');
  log('✅ Connexion terminée!', 'green');
  log(`\n💡 Pour utiliser cette URL dans vos scripts:`, 'yellow');
  log(`   export N8N_URL="${n8nUrl}"`, 'blue');
  if (n8nApiKey) {
    log(`   export N8N_API_KEY="${n8nApiKey}"`, 'blue');
  }

  rl.close();
}

main().catch((error) => {
  log(`\n❌ Erreur: ${error.message}`, 'red');
  console.error(error);
  rl.close();
  process.exit(1);
});

