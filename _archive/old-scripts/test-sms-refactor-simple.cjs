#!/usr/bin/env node
/**
 * Test simple - Intent Detector uniquement
 */

const { detectIntent } = require('./lib/sms/intent-detector-sms.cjs');

const tests = [
  { input: "Analyse AAPL", expected: "ANALYSE" },
  { input: "analyse courte BTC", expected: "ANALYSE" },
  { input: "Prix TSLA", expected: "DONNEES" },
  { input: "Taux Fed", expected: "DONNEES" },
  { input: "Résumé: dette Canada", expected: "RESUME" },
  { input: "Calcul prêt 300k 25 ans 4.9%", expected: "CALCUL" },
  { input: "Variation % 120 145", expected: "CALCUL" },
  { input: "Source ?", expected: "SOURCES" },
  { input: "Aide", expected: "AIDE" },
  { input: "?", expected: "AIDE" },
  { input: "blabla random", expected: "UNKNOWN" },
];

console.log("\n=== SMS Intent Detector Tests ===\n");

let passed = 0;
let failed = 0;

tests.forEach(({ input, expected }) => {
  const result = detectIntent(input);
  const status = result.intent === expected ? '✅' : '❌';

  if (result.intent === expected) {
    passed++;
  } else {
    failed++;
  }

  console.log(`${status} "${input}" → ${result.intent} (expected: ${expected})`);
  if (result.entities && Object.keys(result.entities).length > 0) {
    console.log(`   Entities:`, result.entities);
  }
  if (result.needsClarification) {
    console.log(`   ⚠️  ${result.clarification.substring(0, 60)}...`);
  }
});

console.log(`\n✅ Passed: ${passed}/${tests.length}`);
console.log(`❌ Failed: ${failed}/${tests.length}\n`);

process.exit(failed > 0 ? 1 : 0);
