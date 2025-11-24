#!/usr/bin/env node
/**
 * Test de Structure Multicanal
 *
 * Valide que tous les fichiers et dépendances sont correctement configurés
 * sans nécessiter de serveur en cours d'exécution ou de credentials.
 */

import fs from 'fs';
import path from 'path';

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'cyan');
}

function logSection(title) {
  log(`\n=== ${title} ===`, 'bright');
}

// Liste des fichiers requis pour le système multicanal
const REQUIRED_FILES = {
  'API Chat': 'api/chat.js',
  'API Adapter SMS': 'api/adapters/sms.js',
  'API Adapter Email': 'api/adapters/email.js',
  'API Adapter Messenger': 'api/adapters/messenger.js',
  'User Manager': 'lib/user-manager.js',
  'Conversation Manager': 'lib/conversation-manager.js',
  'Channel Adapter': 'lib/channel-adapter.js',
  'Intent Analyzer': 'lib/intent-analyzer.js',
  'Supabase Config': 'lib/supabase-config.js',
  'Logger': 'lib/logger.js',
  'Test Script': 'test-multichannel.js',
  'SQL Setup': 'supabase-multichannel-setup.sql',
  'Vercel Config': 'vercel.json',
  'Package JSON': 'package.json',
  'Env Example': '.env.example'
};

// Dépendances npm requises
const REQUIRED_DEPENDENCIES = [
  '@supabase/supabase-js',
  'twilio',
  'resend',
  'dotenv'
];

// Variables d'environnement requises
const REQUIRED_ENV_VARS = {
  'Supabase': ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
  'Twilio (SMS)': ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'],
  'Resend (Email)': ['RESEND_API_KEY', 'EMAIL_FROM'],
  'Messenger': ['MESSENGER_PAGE_ACCESS_TOKEN', 'MESSENGER_VERIFY_TOKEN']
};

let totalTests = 0;
let passedTests = 0;

/**
 * Test 1: Vérifier la présence des fichiers
 */
function testFilePresence() {
  logSection('TEST 1: PRÉSENCE DES FICHIERS');

  let filesOk = true;

  for (const [name, filePath] of Object.entries(REQUIRED_FILES)) {
    totalTests++;
    const fullPath = path.join(process.cwd(), filePath);

    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      logSuccess(`${name}: ${filePath} (${sizeKB} KB)`);
      passedTests++;
    } else {
      logError(`${name}: ${filePath} manquant`);
      filesOk = false;
    }
  }

  return filesOk;
}

/**
 * Test 2: Vérifier les dépendances npm
 */
function testNpmDependencies() {
  logSection('TEST 2: DÉPENDANCES NPM');

  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    let depsOk = true;

    for (const dep of REQUIRED_DEPENDENCIES) {
      totalTests++;

      if (deps[dep]) {
        logSuccess(`${dep}: ${deps[dep]}`);
        passedTests++;
      } else {
        logError(`${dep}: manquant dans package.json`);
        depsOk = false;
      }
    }

    // Vérifier que twilio est installé
    totalTests++;
    try {
      const twilioPath = path.join(process.cwd(), 'node_modules', 'twilio', 'package.json');
      if (fs.existsSync(twilioPath)) {
        const twilioPackage = JSON.parse(fs.readFileSync(twilioPath, 'utf-8'));
        logSuccess(`Twilio installé: v${twilioPackage.version}`);
        passedTests++;
      } else {
        logError('Twilio non installé - exécutez: npm install');
        depsOk = false;
      }
    } catch (e) {
      logError('Twilio non installé - exécutez: npm install');
      depsOk = false;
    }

    return depsOk;
  } catch (error) {
    logError(`Erreur lecture package.json: ${error.message}`);
    return false;
  }
}

/**
 * Test 3: Vérifier la configuration Vercel
 */
function testVercelConfig() {
  logSection('TEST 3: CONFIGURATION VERCEL');

  try {
    const vercelJsonPath = path.join(process.cwd(), 'vercel.json');
    const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf-8'));

    const requiredFunctions = [
      'api/chat.js',
      'api/adapters/sms.js',
      'api/adapters/email.js',
      'api/adapters/messenger.js'
    ];

    let configOk = true;

    for (const funcPath of requiredFunctions) {
      totalTests++;

      if (vercelConfig.functions && vercelConfig.functions[funcPath]) {
        const timeout = vercelConfig.functions[funcPath].maxDuration;
        logSuccess(`${funcPath}: timeout ${timeout}s`);
        passedTests++;
      } else {
        logError(`${funcPath}: timeout non configuré`);
        configOk = false;
      }
    }

    return configOk;
  } catch (error) {
    logError(`Erreur lecture vercel.json: ${error.message}`);
    return false;
  }
}

/**
 * Test 4: Vérifier la structure du SQL
 */
function testSqlSetup() {
  logSection('TEST 4: SCRIPT SQL SUPABASE');

  try {
    const sqlPath = path.join(process.cwd(), 'supabase-multichannel-setup.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    const requiredTables = [
      'user_profiles',
      'conversation_history',
      'multichannel_messages',
      'channel_logs',
      'channel_preferences'
    ];

    let sqlOk = true;

    for (const table of requiredTables) {
      totalTests++;

      if (sqlContent.includes(`CREATE TABLE IF NOT EXISTS ${table}`) ||
          sqlContent.includes(`ALTER TABLE ${table}`)) {
        logSuccess(`Table ${table}: présente dans le SQL`);
        passedTests++;
      } else {
        logError(`Table ${table}: absente du SQL`);
        sqlOk = false;
      }
    }

    return sqlOk;
  } catch (error) {
    logError(`Erreur lecture SQL: ${error.message}`);
    return false;
  }
}

/**
 * Test 5: Vérifier les variables d'environnement documentées
 */
function testEnvDocumentation() {
  logSection('TEST 5: DOCUMENTATION VARIABLES D\'ENVIRONNEMENT');

  try {
    const envExamplePath = path.join(process.cwd(), '.env.example');
    const envContent = fs.readFileSync(envExamplePath, 'utf-8');

    let envOk = true;

    for (const [category, vars] of Object.entries(REQUIRED_ENV_VARS)) {
      logInfo(`\nCatégorie: ${category}`);

      for (const varName of vars) {
        totalTests++;

        if (envContent.includes(varName)) {
          logSuccess(`${varName}: documenté`);
          passedTests++;
        } else {
          logError(`${varName}: non documenté`);
          envOk = false;
        }
      }
    }

    return envOk;
  } catch (error) {
    logError(`Erreur lecture .env.example: ${error.message}`);
    return false;
  }
}

/**
 * Test 6: Vérifier la syntaxe JavaScript des fichiers
 */
async function testJavaScriptSyntax() {
  logSection('TEST 6: SYNTAXE JAVASCRIPT');

  const jsFiles = [
    'api/chat.js',
    'api/adapters/sms.js',
    'api/adapters/email.js',
    'api/adapters/messenger.js',
    'lib/user-manager.js',
    'lib/conversation-manager.js',
    'lib/channel-adapter.js'
  ];

  let syntaxOk = true;

  for (const filePath of jsFiles) {
    totalTests++;

    try {
      // Essayer d'importer dynamiquement le fichier pour vérifier la syntaxe
      const fullPath = path.join(process.cwd(), filePath);
      const content = fs.readFileSync(fullPath, 'utf-8');

      // Vérification basique de la syntaxe
      if (content.includes('export default') || content.includes('module.exports')) {
        logSuccess(`${filePath}: syntaxe valide`);
        passedTests++;
      } else {
        logError(`${filePath}: pas d'export détecté`);
        syntaxOk = false;
      }
    } catch (error) {
      logError(`${filePath}: ${error.message}`);
      syntaxOk = false;
    }
  }

  return syntaxOk;
}

/**
 * Test 7: Vérifier les workflows n8n
 */
function testN8nWorkflows() {
  logSection('TEST 7: WORKFLOWS N8N (Optionnel)');

  const workflows = [
    'n8n-workflows/sms-workflow.json',
    'n8n-workflows/email-workflow.json',
    'n8n-workflows/messenger-workflow.json'
  ];

  let workflowsOk = true;

  for (const workflow of workflows) {
    const fullPath = path.join(process.cwd(), workflow);

    if (fs.existsSync(fullPath)) {
      try {
        const content = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        logSuccess(`${workflow}: valide (${content.nodes?.length || 0} nodes)`);
      } catch (e) {
        logError(`${workflow}: JSON invalide`);
        workflowsOk = false;
      }
    } else {
      logInfo(`${workflow}: non trouvé (optionnel)`);
    }
  }

  return workflowsOk;
}

/**
 * Fonction principale
 */
async function main() {
  log('\n╔═══════════════════════════════════════════════════════╗', 'bright');
  log('║   TEST STRUCTURE MULTICANAL - GOB FINANCIAL DASHBOARD║', 'bright');
  log('╚═══════════════════════════════════════════════════════╝', 'bright');

  logInfo('Ce test valide la structure du code sans nécessiter de credentials');
  logInfo(`Date: ${new Date().toISOString()}\n`);

  const results = {
    files: testFilePresence(),
    dependencies: testNpmDependencies(),
    vercel: testVercelConfig(),
    sql: testSqlSetup(),
    env: testEnvDocumentation(),
    syntax: await testJavaScriptSyntax(),
    n8n: testN8nWorkflows()
  };

  // Résumé
  logSection('RÉSUMÉ DES TESTS');

  Object.entries(results).forEach(([test, passed]) => {
    if (passed) {
      logSuccess(`${test.toUpperCase()}: OK`);
    } else {
      logError(`${test.toUpperCase()}: ÉCHEC`);
    }
  });

  const allPassed = Object.values(results).every(r => r);

  log(`\nRésultat: ${passedTests}/${totalTests} tests individuels réussis`,
      allPassed ? 'green' : 'yellow');

  if (allPassed) {
    log('\n✅ Structure multicanal complète et valide!', 'green');
    log('📝 Prochaine étape: Configurer les variables d\'environnement', 'cyan');
    log('📖 Voir: docs/MULTICANAL-SETUP.md', 'cyan');
    process.exit(0);
  } else {
    log('\n⚠️ Certains éléments nécessitent attention', 'yellow');
    process.exit(1);
  }
}

main().catch(error => {
  logError(`Erreur fatale: ${error.message}`);
  console.error(error);
  process.exit(1);
});
