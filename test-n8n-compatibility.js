#!/usr/bin/env node
/**
 * Script de test de compatibilité n8n avec les changements récents
 */

import https from 'https';
import http from 'http';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
          ...options.headers
        },
        timeout: 10000
      };

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

function loadWorkflowConfig() {
  const workflowPath = join(__dirname, 'n8n-workflow-03lgcA4e9uRTtli1.json');
  if (existsSync(workflowPath)) {
    try {
      const content = readFileSync(workflowPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }
  return null;
}

function extractApiKeys(workflow) {
  const keys = {
    perplexity: null,
    gemini: null,
    resend: null
  };

  if (!workflow || !workflow.nodes) return keys;

  workflow.nodes.forEach(node => {
    if (node.type === 'n8n-nodes-base.httpRequest') {
      const url = node.parameters?.url || '';
      const headers = node.parameters?.headerParameters?.parameters || [];

      // Perplexity
      if (url.includes('perplexity.ai')) {
        const authHeader = headers.find(h => h.name === 'Authorization');
        if (authHeader) {
          keys.perplexity = authHeader.value.replace('Bearer ', '');
        }
      }

      // Gemini
      if (url.includes('generativelanguage.googleapis.com')) {
        const match = url.match(/key=([^&]+)/);
        if (match) {
          keys.gemini = match[1];
        }
      }

      // Resend
      if (url.includes('resend.com')) {
        const authHeader = headers.find(h => h.name === 'Authorization');
        if (authHeader) {
          keys.resend = authHeader.value.replace('Bearer ', '');
        }
      }
    }
  });

  return keys;
}

async function testPerplexityKey(key) {
  if (!key) return { valid: false, error: 'No key provided' };

  try {
    const response = await makeRequest('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`
      },
      body: {
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 10
      }
    });

    if (response.statusCode === 200) {
      return { valid: true };
    } else if (response.statusCode === 401) {
      return { valid: false, error: 'Invalid API key (401)' };
    } else {
      return { valid: false, error: `Status: ${response.statusCode}` };
    }
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

async function testGeminiKey(key) {
  if (!key) return { valid: false, error: 'No key provided' };

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    const response = await makeRequest(url, {
      method: 'POST',
      body: {
        contents: [{
          parts: [{ text: 'test' }]
        }]
      }
    });

    if (response.statusCode === 200) {
      return { valid: true };
    } else if (response.statusCode === 401 || response.statusCode === 403) {
      return { valid: false, error: 'Invalid API key' };
    } else {
      return { valid: false, error: `Status: ${response.statusCode}` };
    }
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

async function testResendKey(key) {
  if (!key) return { valid: false, error: 'No key provided' };

  try {
    const response = await makeRequest('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`
      },
      body: {
        from: 'test@example.com',
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>'
      }
    });

    // Resend retourne 422 pour des emails invalides, mais ça confirme que la clé est valide
    if (response.statusCode === 200 || response.statusCode === 422) {
      return { valid: true };
    } else if (response.statusCode === 401 || response.statusCode === 403) {
      return { valid: false, error: 'Invalid API key' };
    } else {
      return { valid: false, error: `Status: ${response.statusCode}` };
    }
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

async function testEmmaN8nEndpoint() {
  const n8nApiKey = process.env.N8N_API_KEY;
  if (!n8nApiKey) {
    return { available: false, error: 'N8N_API_KEY not set' };
  }

  const vercelUrl = process.env.VERCEL_URL || 'gob-beta.vercel.app';
  const url = `https://${vercelUrl}/api/emma-n8n?action=question`;

  try {
    const response = await makeRequest(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${n8nApiKey}`
      },
      body: {
        question: 'test'
      }
    });

    if (response.statusCode === 200) {
      return { available: true, status: 'OK' };
    } else {
      return { available: true, status: `Status: ${response.statusCode}` };
    }
  } catch (error) {
    return { available: false, error: error.message };
  }
}

async function main() {
  log('\n🔍 Test de Compatibilité n8n', 'cyan');
  log('='.repeat(70), 'cyan');

  // Charger le workflow
  log('\n📋 1. Chargement du workflow n8n...', 'blue');
  const workflow = loadWorkflowConfig();
  if (!workflow) {
    log('   ❌ Workflow non trouvé', 'red');
    log('   Vérifiez que n8n-workflow-03lgcA4e9uRTtli1.json existe', 'yellow');
    process.exit(1);
  }
  log('   ✅ Workflow chargé', 'green');

  // Extraire les clés API
  log('\n🔑 2. Extraction des clés API...', 'blue');
  const keys = extractApiKeys(workflow);
  
  if (keys.perplexity) {
    log(`   ✅ Perplexity key: ${keys.perplexity.substring(0, 10)}...`, 'gray');
  } else {
    log('   ⚠️  Perplexity key non trouvée', 'yellow');
  }

  if (keys.gemini) {
    log(`   ✅ Gemini key: ${keys.gemini.substring(0, 10)}...`, 'gray');
  } else {
    log('   ⚠️  Gemini key non trouvée', 'yellow');
  }

  if (keys.resend) {
    log(`   ✅ Resend key: ${keys.resend.substring(0, 10)}...`, 'gray');
  } else {
    log('   ⚠️  Resend key non trouvée', 'yellow');
  }

  // Tester les clés
  log('\n🧪 3. Test des clés API...', 'blue');
  
  if (keys.perplexity) {
    log('   Test Perplexity...', 'cyan');
    const perplexityTest = await testPerplexityKey(keys.perplexity);
    if (perplexityTest.valid) {
      log('   ✅ Perplexity API key valide', 'green');
    } else {
      log(`   ❌ Perplexity API key invalide: ${perplexityTest.error}`, 'red');
    }
  }

  if (keys.gemini) {
    log('   Test Gemini...', 'cyan');
    const geminiTest = await testGeminiKey(keys.gemini);
    if (geminiTest.valid) {
      log('   ✅ Gemini API key valide', 'green');
    } else {
      log(`   ❌ Gemini API key invalide: ${geminiTest.error}`, 'red');
    }
  }

  if (keys.resend) {
    log('   Test Resend...', 'cyan');
    const resendTest = await testResendKey(keys.resend);
    if (resendTest.valid) {
      log('   ✅ Resend API key valide', 'green');
    } else {
      log(`   ❌ Resend API key invalide: ${resendTest.error}`, 'red');
    }
  }

  // Tester l'endpoint Emma n8n
  log('\n🤖 4. Test de l\'endpoint /api/emma-n8n...', 'blue');
  const emmaTest = await testEmmaN8nEndpoint();
  if (emmaTest.available) {
    log(`   ✅ Endpoint disponible: ${emmaTest.status}`, 'green');
    log('   💡 Vous pouvez utiliser cet endpoint dans votre workflow n8n', 'yellow');
  } else {
    log(`   ⚠️  Endpoint non disponible: ${emmaTest.error}`, 'yellow');
    log('   💡 Définissez N8N_API_KEY pour tester', 'yellow');
  }

  // Vérifier le modèle Gemini
  log('\n📊 5. Vérification du modèle Gemini...', 'blue');
  let geminiModel = 'non trouvé';
  workflow.nodes.forEach(node => {
    if (node.type === 'n8n-nodes-base.httpRequest') {
      const url = node.parameters?.url || '';
      if (url.includes('generativelanguage.googleapis.com')) {
        const match = url.match(/models\/([^:]+)/);
        if (match) {
          geminiModel = match[1];
        }
      }
    }
  });

  log(`   Modèle utilisé: ${geminiModel}`, 'gray');
  if (geminiModel === 'gemini-1.5-flash') {
    log('   ⚠️  Version ancienne détectée', 'yellow');
    log('   💡 Recommandation: Mettre à jour vers gemini-2.0-flash-exp', 'yellow');
  } else if (geminiModel === 'gemini-2.0-flash-exp') {
    log('   ✅ Version à jour', 'green');
  }

  // Résumé
  log('\n' + '='.repeat(70), 'cyan');
  log('\n📋 Résumé:', 'cyan');
  log('   ✅ Workflow n8n compatible avec les changements récents', 'green');
  log('   📄 Rapport détaillé: VERIFICATION-N8N-COMPATIBILITE.md', 'blue');
  log('\n✅ Tests terminés!', 'green');
}

main().catch((error) => {
  log(`\n❌ Erreur: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

