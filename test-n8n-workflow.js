#!/usr/bin/env node
/**
 * Test d'accès au workflow n8n via différentes méthodes
 */

import https from 'https';
import http from 'http';

const WORKFLOW_URL = 'https://projetsjsl.app.n8n.cloud/workflow/03lgcA4e9uRTtli1';
const N8N_BASE = 'https://projetsjsl.app.n8n.cloud';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
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
          'User-Agent': 'Mozilla/5.0 (compatible; n8n-connector/1.0)',
          'Accept': 'application/json, text/html, */*',
          ...options.headers
        },
        timeout: 10000
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
              data: jsonData || data,
              contentType: res.headers['content-type']
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: data,
              contentType: res.headers['content-type']
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

async function testWorkflowUrl() {
  log('\n🔍 Test 1: Accès direct à l\'URL du workflow', 'cyan');
  log(`URL: ${WORKFLOW_URL}`, 'blue');
  
  try {
    const response = await makeRequest(WORKFLOW_URL);
    log(`Status: ${response.statusCode}`, response.statusCode === 200 ? 'green' : 'yellow');
    log(`Content-Type: ${response.contentType}`, 'gray');
    
    if (response.statusCode === 200) {
      if (typeof response.data === 'object') {
        log('✅ Données JSON reçues!', 'green');
        log(`\nWorkflow:`, 'cyan');
        console.log(JSON.stringify(response.data, null, 2).substring(0, 1000));
      } else {
        log('⚠️  Réponse HTML (interface web)', 'yellow');
        log('   L\'URL pointe vers l\'interface web, pas l\'API', 'yellow');
      }
    }
    
    return response;
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    return null;
  }
}

async function testApiEndpoint(apiKey) {
  log('\n🔍 Test 2: Accès via API REST', 'cyan');
  log(`URL: ${N8N_BASE}/api/v1/workflows/03lgcA4e9uRTtli1`, 'blue');
  
  try {
    const response = await makeRequest(`${N8N_BASE}/api/v1/workflows/03lgcA4e9uRTtli1`, {
      apiKey
    });
    
    log(`Status: ${response.statusCode}`, response.statusCode === 200 ? 'green' : 'yellow');
    
    if (response.statusCode === 200 && typeof response.data === 'object') {
      log('✅ Workflow récupéré via API!', 'green');
      return response.data;
    } else if (response.statusCode === 401) {
      log('⚠️  Authentification requise (401)', 'yellow');
    } else {
      log(`Réponse: ${JSON.stringify(response.data).substring(0, 200)}`, 'gray');
    }
    
    return null;
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    return null;
  }
}

async function testWebhookEndpoints() {
  log('\n🔍 Test 3: Recherche de webhooks publics', 'cyan');
  
  // Webhooks connus du projet GOB
  const webhooks = [
    'gob-sms-webhook',
    'gob-email-webhook',
    'gob-messenger-webhook',
    'webhook',
    '03lgcA4e9uRTtli1' // ID du workflow comme webhook
  ];
  
  for (const webhook of webhooks) {
    try {
      const url = `${N8N_BASE}/webhook/${webhook}`;
      log(`   Test: ${url}`, 'blue');
      
      const response = await makeRequest(url, {
        method: 'POST',
        body: { test: true }
      });
      
      if (response.statusCode === 200 || response.statusCode === 404) {
        log(`      Status: ${response.statusCode}`, response.statusCode === 200 ? 'green' : 'gray');
      }
    } catch (error) {
      // Ignorer les erreurs de webhook
    }
  }
}

async function testHealth() {
  log('\n🔍 Test 4: Vérification de santé', 'cyan');
  
  const endpoints = ['/healthz', '/health', '/'];
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${N8N_BASE}${endpoint}`);
      log(`   ${endpoint}: ${response.statusCode}`, response.statusCode === 200 ? 'green' : 'yellow');
    } catch (error) {
      log(`   ${endpoint}: ❌ ${error.message}`, 'red');
    }
  }
}

async function main() {
  log('\n🚀 Test de connexion au workflow n8n', 'cyan');
  log('='.repeat(70), 'cyan');
  
  // Test 1: URL directe
  await testWorkflowUrl();
  
  // Test 2: API avec clé si disponible
  const apiKey = process.env.N8N_API_KEY;
  if (apiKey) {
    log('\n🔑 API Key détectée, test de l\'API...', 'cyan');
    await testApiEndpoint(apiKey);
  } else {
    log('\n⚠️  Pas d\'API key - test API ignoré', 'yellow');
    log('   Définissez N8N_API_KEY pour tester l\'API', 'yellow');
  }
  
  // Test 3: Webhooks
  await testWebhookEndpoints();
  
  // Test 4: Health
  await testHealth();
  
  log('\n' + '='.repeat(70), 'cyan');
  log('\n💡 Pour obtenir votre API key:', 'yellow');
  log('   1. Connectez-vous à https://projetsjsl.app.n8n.cloud', 'yellow');
  log('   2. Allez dans Settings → API', 'yellow');
  log('   3. Créez une nouvelle API key', 'yellow');
  log('   4. Utilisez: export N8N_API_KEY=votre_cle', 'yellow');
  log('\n✅ Tests terminés!', 'green');
}

main().catch((error) => {
  log(`\n❌ Erreur: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

