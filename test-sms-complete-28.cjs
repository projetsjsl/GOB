#!/usr/bin/env node
/**
 * Tests Complets SMS v2 - 28 Intents
 */

const { detectIntent } = require('./lib/sms/intent-detector-sms-complete.cjs');
const { processSMS } = require('./lib/sms/sms-orchestrator-complete.cjs');

const TEST_CASES_INTENT = [
  // BASE
  { input: "Bonjour", expected: "GREETING" },
  { input: "Aide", expected: "HELP" },
  { input: "Portefeuille", expected: "PORTFOLIO" },
  { input: "Merci", expected: "GENERAL_CONVERSATION" },

  // ACTIONS
  { input: "Prix AAPL", expected: "STOCK_PRICE" },
  { input: "Fondamentaux AAPL", expected: "FUNDAMENTALS" },
  { input: "RSI AAPL", expected: "TECHNICAL_ANALYSIS" },
  { input: "News AAPL", expected: "NEWS" },
  { input: "Analyse complète AAPL", expected: "COMPREHENSIVE_ANALYSIS" },
  { input: "AAPL vs MSFT", expected: "COMPARATIVE_ANALYSIS" },
  { input: "Résultats AAPL", expected: "EARNINGS" },
  { input: "Recommandation AAPL", expected: "RECOMMENDATION" },

  // MARCHÉS
  { input: "Marchés", expected: "MARKET_OVERVIEW" },
  { input: "Secteur tech", expected: "SECTOR_INDUSTRY" },

  // ÉCONOMIE
  { input: "Inflation US", expected: "ECONOMIC_ANALYSIS" },
  { input: "Politique Fed", expected: "POLITICAL_ANALYSIS" },

  // STRATÉGIE
  { input: "Stratégie investissement", expected: "INVESTMENT_STRATEGY" },
  { input: "Risque AAPL", expected: "RISK_VOLATILITY" },
  { input: "Gestion risque", expected: "RISK_MANAGEMENT" },

  // VALORISATION
  { input: "Valorisation AAPL", expected: "VALUATION" },
  { input: "Top croissance", expected: "STOCK_SCREENING" },
  { input: "Méthodologie DCF", expected: "VALUATION_METHODOLOGY" },

  // CALCULS
  { input: "Calcul prêt 300k 25 ans 4.9%", expected: "FINANCIAL_CALCULATION" },

  // ASSETS
  { input: "USD/EUR", expected: "FOREX_ANALYSIS" },
  { input: "Obligations US", expected: "BOND_ANALYSIS" },

  // ESG
  { input: "ESG AAPL", expected: "ESG" },

  // LEGACY
  { input: "Source ?", expected: "SOURCES" },
];

async function testIntentDetection() {
  console.log('\n===== TEST 1: INTENT DETECTION (28 INTENTS) =====\n');

  let passed = 0;
  let failed = 0;

  for (const test of TEST_CASES_INTENT) {
    const result = detectIntent(test.input);
    const success = result.intent === test.expected;

    if (success) {
      passed++;
      console.log(`✅ "${test.input}" → ${result.intent}`);
    } else {
      failed++;
      console.log(`❌ "${test.input}" → ${result.intent} (expected: ${test.expected})`);
    }
  }

  console.log(`\n✅ Passed: ${passed}/${TEST_CASES_INTENT.length}`);
  console.log(`❌ Failed: ${failed}/${TEST_CASES_INTENT.length}\n`);

  return { passed, failed, total: TEST_CASES_INTENT.length };
}

async function testPipelineMock() {
  console.log('\n===== TEST 2: PIPELINE MOCK (Sans APIs) =====\n');

  const mockTests = [
    { message: "Bonjour", description: "Greeting" },
    { message: "Aide", description: "Help" },
    { message: "Calcul prêt 300k 25 ans 4.9%", description: "Financial Calculation" },
  ];

  for (const test of mockTests) {
    console.log(`📝 Test: ${test.description}`);
    console.log(`   Input: "${test.message}"\n`);

    try {
      const startTime = Date.now();
      const result = await processSMS(test.message, {});
      const latency = Date.now() - startTime;

      console.log(`✅ Response (${latency}ms):`);
      console.log(`   ${result.response.substring(0, 200)}...\n`);
    } catch (err) {
      console.log(`❌ Error: ${err.message}\n`);
    }
  }
}

async function runAllTests() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   TESTS COMPLETS - SMS v2 (28 INTENTS) ║');
  console.log('╚════════════════════════════════════════╝');

  const intentResults = await testIntentDetection();
  await testPipelineMock();

  console.log('\n========================================');
  console.log('RÉSUMÉ FINAL');
  console.log('========================================');
  console.log(`✅ Intent Detection: ${intentResults.passed}/${intentResults.total} passed`);
  console.log(`📊 Coverage: ${Math.round(intentResults.passed / intentResults.total * 100)}%`);
  console.log(`✅ Pipeline: Tests exécutés\n`);

  console.log('🚀 SYSTÈME SMS v2 (28 INTENTS) PRÊT!\n');

  process.exit(intentResults.failed > 0 ? 1 : 0);
}

if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { testIntentDetection, testPipelineMock };
