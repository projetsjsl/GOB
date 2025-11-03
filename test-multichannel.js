#!/usr/bin/env node
/**
 * Test Multicanal Emma IA
 *
 * Ce script teste tous les canaux de communication :
 * - Web (API /api/chat direct)
 * - SMS (Twilio webhook simulation)
 * - Email (Resend API)
 * - Messenger (Facebook webhook simulation)
 *
 * Usage:
 *   node test-multichannel.js              # Test tous les canaux
 *   node test-multichannel.js web          # Test canal web uniquement
 *   node test-multichannel.js sms          # Test canal SMS uniquement
 *   node test-multichannel.js email        # Test canal email uniquement
 *   node test-multichannel.js messenger    # Test canal messenger uniquement
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Configuration des tests
const TEST_CONFIG = {
  web: {
    enabled: true,
    endpoint: `${BASE_URL}/api/chat`,
    userId: 'test-web-user',
    message: 'Analyse rapide de AAPL'
  },
  sms: {
    enabled: true,
    endpoint: `${BASE_URL}/api/adapters/sms`,
    phoneNumber: '+14385443662',
    message: 'Test Emma SMS'
  },
  email: {
    enabled: true,
    endpoint: `${BASE_URL}/api/adapters/email`,
    emailFrom: 'test@example.com',
    subject: 'Test Emma Email',
    message: 'Analyse TSLA'
  },
  messenger: {
    enabled: true,
    endpoint: `${BASE_URL}/api/adapters/messenger`,
    senderId: 'test-messenger-12345',
    message: 'Bonjour Emma'
  }
};

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

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

/**
 * Test 1: Canal Web (API /api/chat direct)
 */
async function testWeb() {
  log('\n=== TEST CANAL WEB ===', 'bright');

  try {
    const payload = {
      message: TEST_CONFIG.web.message,
      userId: TEST_CONFIG.web.userId,
      channel: 'web',
      metadata: {
        userAgent: 'test-script',
        source: 'test-multichannel.js'
      }
    };

    logInfo(`Envoi de requête à ${TEST_CONFIG.web.endpoint}`);
    logInfo(`Message: "${payload.message}"`);

    const response = await fetch(TEST_CONFIG.web.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (response.ok && data.success) {
      logSuccess('Réponse reçue avec succès');
      logInfo(`Réponse: ${data.response?.substring(0, 100)}...`);
      logInfo(`Conversation ID: ${data.conversationId}`);
      logInfo(`Temps d'exécution: ${data.metadata?.executionTimeMs}ms`);

      if (data.metadata?.toolsUsed) {
        logInfo(`Outils utilisés: ${data.metadata.toolsUsed.join(', ')}`);
      }

      return { success: true, data };
    } else {
      logError(`Échec: ${data.error || 'Erreur inconnue'}`);
      return { success: false, error: data };
    }
  } catch (error) {
    logError(`Exception: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test 2: Canal SMS (Twilio webhook simulation)
 */
async function testSMS() {
  log('\n=== TEST CANAL SMS (Twilio) ===', 'bright');

  try {
    // Simulation du webhook Twilio
    const payload = new URLSearchParams({
      From: TEST_CONFIG.sms.phoneNumber,
      To: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
      Body: TEST_CONFIG.sms.message,
      MessageSid: 'SM' + Math.random().toString(36).substring(2, 15)
    });

    logInfo(`Envoi de requête à ${TEST_CONFIG.sms.endpoint}`);
    logInfo(`De: ${TEST_CONFIG.sms.phoneNumber}`);
    logInfo(`Message: "${TEST_CONFIG.sms.message}"`);

    const response = await fetch(TEST_CONFIG.sms.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: payload.toString()
    });

    const text = await response.text();

    if (response.ok) {
      logSuccess('SMS traité avec succès');
      logInfo(`Réponse Twilio: ${text.substring(0, 100)}...`);
      return { success: true, data: text };
    } else {
      logError(`Échec: ${text}`);
      return { success: false, error: text };
    }
  } catch (error) {
    logError(`Exception: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test 3: Canal Email (Resend)
 */
async function testEmail() {
  log('\n=== TEST CANAL EMAIL (Resend) ===', 'bright');

  try {
    // Simulation d'un email entrant traité par n8n
    const payload = {
      from: TEST_CONFIG.email.emailFrom,
      to: process.env.EMAIL_FROM || 'emma@gobapps.com',
      subject: TEST_CONFIG.email.subject,
      text: TEST_CONFIG.email.message,
      messageId: '<test-' + Date.now() + '@example.com>'
    };

    logInfo(`Envoi de requête à ${TEST_CONFIG.email.endpoint}`);
    logInfo(`De: ${payload.from}`);
    logInfo(`Sujet: ${payload.subject}`);
    logInfo(`Message: "${payload.text}"`);

    const response = await fetch(TEST_CONFIG.email.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (response.ok && data.success) {
      logSuccess('Email traité avec succès');
      logInfo(`Email envoyé à: ${data.emailSentTo}`);
      logInfo(`Réponse: ${data.response?.substring(0, 100)}...`);
      return { success: true, data };
    } else {
      logError(`Échec: ${data.error || 'Erreur inconnue'}`);
      return { success: false, error: data };
    }
  } catch (error) {
    logError(`Exception: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test 4: Canal Messenger (Facebook webhook simulation)
 */
async function testMessenger() {
  log('\n=== TEST CANAL MESSENGER (Facebook) ===', 'bright');

  try {
    // Simulation du webhook Facebook Messenger
    const payload = {
      object: 'page',
      entry: [{
        id: '123456789',
        time: Date.now(),
        messaging: [{
          sender: { id: TEST_CONFIG.messenger.senderId },
          recipient: { id: '987654321' },
          timestamp: Date.now(),
          message: {
            mid: 'mid.' + Math.random().toString(36).substring(2, 15),
            text: TEST_CONFIG.messenger.message
          }
        }]
      }]
    };

    logInfo(`Envoi de requête à ${TEST_CONFIG.messenger.endpoint}`);
    logInfo(`Sender ID: ${TEST_CONFIG.messenger.senderId}`);
    logInfo(`Message: "${TEST_CONFIG.messenger.message}"`);

    const response = await fetch(TEST_CONFIG.messenger.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();

    if (response.ok) {
      logSuccess('Message Messenger traité avec succès');
      logInfo(`Réponse: ${text.substring(0, 100)}...`);
      return { success: true, data: text };
    } else {
      logError(`Échec: ${text}`);
      return { success: false, error: text };
    }
  } catch (error) {
    logError(`Exception: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test 5: Vérification de la base de données Supabase
 */
async function testSupabaseConnection() {
  log('\n=== TEST CONNEXION SUPABASE ===', 'bright');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    logWarning('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY non configurés');
    return { success: false, error: 'Configuration manquante' };
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    logInfo('Vérification des tables...');

    // Vérifier les tables principales
    const tables = [
      'user_profiles',
      'conversation_history',
      'channel_logs',
      'channel_preferences'
    ];

    const results = {};

    for (const tableName of tables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (error) {
          logError(`Table ${tableName}: ${error.message}`);
          results[tableName] = false;
        } else {
          logSuccess(`Table ${tableName}: OK (${count} enregistrements)`);
          results[tableName] = true;
        }
      } catch (err) {
        logError(`Table ${tableName}: ${err.message}`);
        results[tableName] = false;
      }
    }

    const allTablesExist = Object.values(results).every(v => v);

    if (allTablesExist) {
      logSuccess('Toutes les tables Supabase sont OK');
      return { success: true, data: results };
    } else {
      logWarning('Certaines tables Supabase sont manquantes');
      logInfo('Exécutez supabase-multichannel-setup.sql dans votre console Supabase');
      return { success: false, error: 'Tables manquantes', data: results };
    }
  } catch (error) {
    logError(`Exception: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Fonction principale
 */
async function main() {
  const args = process.argv.slice(2);
  const testToRun = args[0]?.toLowerCase();

  log('\n╔═══════════════════════════════════════════════════════╗', 'bright');
  log('║   TEST MULTICANAL EMMA IA - GOB FINANCIAL DASHBOARD  ║', 'bright');
  log('╚═══════════════════════════════════════════════════════╝', 'bright');

  logInfo(`Base URL: ${BASE_URL}`);
  logInfo(`Date: ${new Date().toISOString()}`);

  // Vérifier la connexion Supabase en premier
  const supabaseResult = await testSupabaseConnection();

  const results = {
    supabase: supabaseResult
  };

  // Exécuter les tests demandés
  if (!testToRun || testToRun === 'all') {
    // Tous les tests
    results.web = await testWeb();
    results.sms = await testSMS();
    results.email = await testEmail();
    results.messenger = await testMessenger();
  } else {
    // Test spécifique
    switch (testToRun) {
      case 'web':
        results.web = await testWeb();
        break;
      case 'sms':
        results.sms = await testSMS();
        break;
      case 'email':
        results.email = await testEmail();
        break;
      case 'messenger':
        results.messenger = await testMessenger();
        break;
      default:
        logError(`Canal inconnu: ${testToRun}`);
        logInfo('Canaux disponibles: web, sms, email, messenger, all');
        process.exit(1);
    }
  }

  // Résumé des résultats
  log('\n=== RÉSUMÉ DES TESTS ===', 'bright');

  let successCount = 0;
  let totalCount = 0;

  Object.entries(results).forEach(([channel, result]) => {
    totalCount++;
    if (result.success) {
      successCount++;
      logSuccess(`${channel.toUpperCase()}: SUCCÈS`);
    } else {
      logError(`${channel.toUpperCase()}: ÉCHEC`);
    }
  });

  log(`\nRésultat global: ${successCount}/${totalCount} tests réussis`,
      successCount === totalCount ? 'green' : 'yellow');

  if (successCount === totalCount) {
    log('\n✓ Tous les tests ont réussi! 🎉', 'green');
    process.exit(0);
  } else {
    log('\n⚠ Certains tests ont échoué', 'yellow');
    process.exit(1);
  }
}

// Exécuter les tests
main().catch(error => {
  logError(`Erreur fatale: ${error.message}`);
  console.error(error);
  process.exit(1);
});
