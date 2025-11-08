/**
 * Script de test de connexion à n8n
 * 
 * Ce script permet de :
 * 1. Tester la connexion à votre instance n8n
 * 2. Lister les workflows disponibles
 * 3. Tester l'exécution d'un workflow
 */

import https from 'https';
import http from 'http';

// Configuration
const N8N_URL = process.env.N8N_WEBHOOK_BASE_URL || process.env.N8N_URL || 'http://localhost:5678';
const N8N_API_KEY = process.env.N8N_API_KEY;
const N8N_USERNAME = process.env.N8N_USERNAME;
const N8N_PASSWORD = process.env.N8N_PASSWORD;

// Couleurs pour la console
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

/**
 * Faire une requête HTTP/HTTPS
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
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
      }
    };

    // Ajouter authentification si disponible
    if (N8N_API_KEY) {
      requestOptions.headers['X-N8N-API-KEY'] = N8N_API_KEY;
    } else if (N8N_USERNAME && N8N_PASSWORD) {
      const auth = Buffer.from(`${N8N_USERNAME}:${N8N_PASSWORD}`).toString('base64');
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

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * Test 1: Vérifier la connexion de base
 */
async function testConnection() {
  log('\n📡 Test 1: Connexion de base à n8n', 'cyan');
  log(`URL: ${N8N_URL}`, 'blue');

  try {
    const response = await makeRequest(`${N8N_URL}/healthz`);
    
    if (response.statusCode === 200) {
      log('✅ Connexion réussie!', 'green');
      return true;
    } else {
      log(`⚠️  Réponse inattendue: ${response.statusCode}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ Erreur de connexion: ${error.message}`, 'red');
    log(`   Vérifiez que n8n est démarré et accessible à ${N8N_URL}`, 'yellow');
    return false;
  }
}

/**
 * Test 2: Vérifier l'authentification
 */
async function testAuthentication() {
  log('\n🔐 Test 2: Authentification', 'cyan');

  if (!N8N_API_KEY && !N8N_USERNAME) {
    log('⚠️  Aucune clé d\'authentification trouvée', 'yellow');
    log('   Définissez N8N_API_KEY ou N8N_USERNAME/N8N_PASSWORD', 'yellow');
    return false;
  }

  try {
    // Essayer d'accéder à l'API REST de n8n
    const response = await makeRequest(`${N8N_URL}/api/v1/workflows`);

    if (response.statusCode === 200) {
      log('✅ Authentification réussie!', 'green');
      log(`   ${response.data?.length || 0} workflow(s) trouvé(s)`, 'blue');
      return true;
    } else if (response.statusCode === 401) {
      log('❌ Authentification échouée (401)', 'red');
      log('   Vérifiez vos credentials', 'yellow');
      return false;
    } else {
      log(`⚠️  Réponse: ${response.statusCode}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Test 3: Lister les workflows
 */
async function listWorkflows() {
  log('\n📋 Test 3: Liste des workflows', 'cyan');

  try {
    const response = await makeRequest(`${N8N_URL}/api/v1/workflows`);

    if (response.statusCode === 200 && Array.isArray(response.data)) {
      log(`✅ ${response.data.length} workflow(s) trouvé(s):`, 'green');
      
      response.data.forEach((workflow, index) => {
        const status = workflow.active ? '🟢 Actif' : '⚪ Inactif';
        log(`   ${index + 1}. ${workflow.name} (ID: ${workflow.id}) - ${status}`, 'blue');
      });

      return response.data;
    } else {
      log('⚠️  Impossible de récupérer les workflows', 'yellow');
      return [];
    }
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    return [];
  }
}

/**
 * Test 4: Tester un webhook spécifique
 */
async function testWebhook(webhookPath) {
  log(`\n🔗 Test 4: Test du webhook ${webhookPath}`, 'cyan');

  try {
    const testData = {
      test: true,
      timestamp: new Date().toISOString(),
      message: 'Test de connexion depuis le script'
    };

    const response = await makeRequest(`${N8N_URL}/webhook/${webhookPath}`, {
      method: 'POST',
      body: testData
    });

    log(`   Status: ${response.statusCode}`, response.statusCode === 200 ? 'green' : 'yellow');
    
    if (response.data) {
      log(`   Réponse: ${JSON.stringify(response.data).substring(0, 200)}`, 'blue');
    }

    return response.statusCode === 200;
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Test 5: Tester l'API Emma via n8n
 */
async function testEmmaAPI() {
  log('\n🤖 Test 5: API Emma via n8n', 'cyan');

  const vercelUrl = process.env.VERCEL_URL || 'https://gob-beta.vercel.app';
  const emmaApiUrl = `${vercelUrl}/api/emma-n8n`;

  if (!N8N_API_KEY) {
    log('⚠️  N8N_API_KEY non configurée - test ignoré', 'yellow');
    return false;
  }

  try {
    const response = await makeRequest(`${emmaApiUrl}?action=question`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${N8N_API_KEY}`
      },
      body: {
        question: 'Test de connexion n8n'
      }
    });

    log(`   Status: ${response.statusCode}`, response.statusCode === 200 ? 'green' : 'yellow');
    
    if (response.data) {
      log(`   Réponse: ${JSON.stringify(response.data).substring(0, 200)}`, 'blue');
    }

    return response.statusCode === 200;
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Fonction principale
 */
async function main() {
  log('🚀 Test de connexion à n8n', 'cyan');
  log('='.repeat(50), 'cyan');

  // Test 1: Connexion de base
  const connected = await testConnection();
  if (!connected) {
    log('\n❌ Impossible de se connecter à n8n', 'red');
    log('\n💡 Solutions:', 'yellow');
    log('   1. Vérifiez que n8n est démarré', 'yellow');
    log('   2. Définissez N8N_URL ou N8N_WEBHOOK_BASE_URL', 'yellow');
    log('   3. Vérifiez votre firewall/proxy', 'yellow');
    process.exit(1);
  }

  // Test 2: Authentification
  const authenticated = await testAuthentication();
  if (!authenticated) {
    log('\n⚠️  Authentification non configurée - certains tests seront ignorés', 'yellow');
  }

  // Test 3: Lister les workflows
  if (authenticated) {
    const workflows = await listWorkflows();
    
    // Test 4: Tester les webhooks connus
    if (workflows.length > 0) {
      log('\n🔗 Test des webhooks connus:', 'cyan');
      
      // Webhooks GOB
      await testWebhook('gob-sms-webhook');
      await testWebhook('gob-email-webhook');
      await testWebhook('gob-messenger-webhook');
    }
  }

  // Test 5: API Emma
  await testEmmaAPI();

  log('\n' + '='.repeat(50), 'cyan');
  log('✅ Tests terminés!', 'green');
}

// Exécuter les tests
main().catch((error) => {
  log(`\n❌ Erreur fatale: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

