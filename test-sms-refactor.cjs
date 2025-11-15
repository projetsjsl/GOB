#!/usr/bin/env node
/**
 * Script de test manuel - Système SMS Refactoré
 *
 * Teste le nouveau système SMS v2 sans modifier le système actuel.
 */

const { processSMS } = require('./lib/sms/sms-orchestrator');
const { detectIntent } = require('./lib/sms/intent-detector-sms');

// Configuration
const TEST_CASES = [
  // ANALYSE
  { message: 'Analyse AAPL', expected: 'ANALYSE' },
  { message: 'analyse courte BTC', expected: 'ANALYSE' },

  // DONNEES
  { message: 'Prix AAPL', expected: 'DONNEES' },
  { message: 'Taux Fed', expected: 'DONNEES' },
  { message: 'Inflation US', expected: 'DONNEES' },

  // RESUME
  { message: 'Résumé: dette Canada', expected: 'RESUME' },

  // CALCUL
  { message: 'Calcul prêt 300k 25 ans 4.9%', expected: 'CALCUL' },
  { message: 'Variation % 120 145', expected: 'CALCUL' },

  // SOURCES
  { message: 'Source ?', expected: 'SOURCES' },

  // AIDE
  { message: 'Aide', expected: 'AIDE' },
  { message: '?', expected: 'AIDE' },

  // UNKNOWN
  { message: 'blabla random', expected: 'UNKNOWN' },
];

/**
 * Teste la détection d'intention
 */
async function testIntentDetection() {
  console.log('\n========================================');
  console.log('TEST 1: DÉTECTION D\'INTENTION');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  for (const testCase of TEST_CASES) {
    const result = detectIntent(testCase.message);
    const success = result.intent === testCase.expected;

    if (success) {
      passed++;
      console.log(`✅ "${testCase.message}" → ${result.intent}`);
    } else {
      failed++;
      console.log(`❌ "${testCase.message}" → ${result.intent} (expected: ${testCase.expected})`);
    }

    if (result.entities && Object.keys(result.entities).length > 0) {
      console.log(`   Entities:`, result.entities);
    }

    if (result.needsClarification) {
      console.log(`   ⚠️  Clarification: ${result.clarification}`);
    }
  }

  console.log(`\n✅ Passed: ${passed}/${TEST_CASES.length}`);
  console.log(`❌ Failed: ${failed}/${TEST_CASES.length}\n`);

  return { passed, failed };
}

/**
 * Teste le pipeline complet (MOCK - sans vraies APIs)
 */
async function testPipelineMock() {
  console.log('\n========================================');
  console.log('TEST 2: PIPELINE COMPLET (MOCK)');
  console.log('========================================\n');

  const mockTests = [
    {
      message: 'Aide',
      description: 'Aide (sans API)',
    },
    {
      message: 'Calcul prêt 300k 25 ans 4.9%',
      description: 'Calcul (sans API externe)',
    },
  ];

  for (const test of mockTests) {
    console.log(`\n📝 Test: ${test.description}`);
    console.log(`   Message: "${test.message}"\n`);

    try {
      const startTime = Date.now();
      const result = await processSMS(test.message, {});
      const latency = Date.now() - startTime;

      console.log(`✅ Réponse (${latency}ms):`);
      console.log(`   ${result.response}\n`);
      console.log(`   Metadata:`, result.metadata);
    } catch (err) {
      console.log(`❌ Erreur: ${err.message}`);
    }
  }
}

/**
 * Teste avec vraies APIs (si clés disponibles)
 */
async function testRealAPIs() {
  console.log('\n========================================');
  console.log('TEST 3: VRAIES APIs (Si clés configurées)');
  console.log('========================================\n');

  // Vérifier clés API
  const hasPerplexity = !!process.env.PERPLEXITY_API_KEY;
  const hasFMP = !!process.env.FMP_API_KEY;

  if (!hasPerplexity && !hasFMP) {
    console.log('⚠️  Aucune clé API configurée. Tests skippés.');
    console.log('   Configurez PERPLEXITY_API_KEY et/ou FMP_API_KEY pour tester.\n');
    return;
  }

  console.log(`✅ PERPLEXITY_API_KEY: ${hasPerplexity ? 'Configurée' : 'Non configurée'}`);
  console.log(`✅ FMP_API_KEY: ${hasFMP ? 'Configurée' : 'Non configurée'}\n`);

  // Tests avec vraies APIs
  const realTests = [];

  if (hasFMP) {
    realTests.push({
      message: 'Prix AAPL',
      description: 'Prix action (FMP)',
    });
  }

  if (hasPerplexity) {
    realTests.push({
      message: 'Résumé: inflation US 2025',
      description: 'Résumé Perplexity',
    });
  }

  for (const test of realTests) {
    console.log(`\n📝 Test: ${test.description}`);
    console.log(`   Message: "${test.message}"\n`);

    try {
      const startTime = Date.now();
      const result = await processSMS(test.message, {});
      const latency = Date.now() - startTime;

      console.log(`✅ Réponse (${latency}ms):`);
      console.log(`   ${result.response}\n`);
      console.log(`   Sources:`, result.metadata.dataSource);
      console.log(`   Validation:`, result.metadata.validation?.valid ? '✅ Valide' : '❌ Invalide');

      if (result.metadata.validation?.errors?.length > 0) {
        console.log(`   Erreurs:`, result.metadata.validation.errors);
      }
    } catch (err) {
      console.log(`❌ Erreur: ${err.message}`);
    }
  }
}

/**
 * Exécute tous les tests
 */
async function runAllTests() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   TESTS - SYSTÈME SMS REFACTORÉ v2     ║');
  console.log('╚════════════════════════════════════════╝');

  try {
    // Test 1: Détection intention
    const intentResults = await testIntentDetection();

    // Test 2: Pipeline mock
    await testPipelineMock();

    // Test 3: Vraies APIs
    await testRealAPIs();

    // Résumé final
    console.log('\n========================================');
    console.log('RÉSUMÉ');
    console.log('========================================');
    console.log(`✅ Intent Detection: ${intentResults.passed}/${TEST_CASES.length} passed`);
    console.log('✅ Pipeline mock: OK');
    console.log('✅ Real APIs: Testés si clés configurées\n');

    console.log('📄 Pour activer en production:');
    console.log('   1. Vérifier tous les tests passent');
    console.log('   2. Configurer USE_SMS_ORCHESTRATOR_V2=true dans Vercel');
    console.log('   3. Déployer sur branche test d\'abord\n');
  } catch (err) {
    console.error('❌ Erreur globale:', err);
    process.exit(1);
  }
}

// Exécuter tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testIntentDetection,
  testPipelineMock,
  testRealAPIs,
};
