#!/usr/bin/env node
/**
 * Test des commandes avec slash (/)
 */

import { HybridIntentAnalyzer } from './lib/intent-analyzer.js';

const analyzer = new HybridIntentAnalyzer();

console.log('\n🧪 TEST COMMANDES SLASH (/)\n');
console.log('='.repeat(60));

const testCases = [
  // Sans slash (comportement normal)
  { message: 'taux', expectedIntent: 'economic_analysis', expectedTickers: [] },
  { message: 'indices', expectedIntent: 'market_overview', expectedTickers: [] },
  { message: 'prix AAPL', expectedIntent: 'stock_price', expectedTickers: ['AAPL'] },
  { message: 'analyse MSFT', expectedIntent: 'comprehensive_analysis', expectedTickers: ['MSFT'] },
  
  // Avec slash (commande forcée, pas de ticker)
  { message: '/taux', expectedIntent: 'economic_analysis', expectedTickers: [] },
  { message: '/indices', expectedIntent: 'market_overview', expectedTickers: [] },
  { message: '/prix', expectedIntent: 'stock_price', expectedTickers: [] },
  { message: '/news', expectedIntent: 'news', expectedTickers: [] },
  { message: '/help', expectedIntent: 'help', expectedTickers: [] },
  { message: '/skills', expectedIntent: 'help', expectedTickers: [] },
  
  // Edge cases
  { message: '/ taux', expectedIntent: 'economic_analysis', expectedTickers: [] },
  { message: '/TAUX', expectedIntent: 'economic_analysis', expectedTickers: [] },
];

async function runTests() {
  let passed = 0;
  let failed = 0;

  for (const test of testCases) {
    const result = await analyzer.analyze(test.message, {});
    
    const intentMatch = result.intent === test.expectedIntent;
    const tickersMatch = JSON.stringify(result.tickers.sort()) === JSON.stringify(test.expectedTickers.sort());
    const testPassed = intentMatch && tickersMatch;
    
    if (testPassed) {
      passed++;
      console.log(`✅ "${test.message}"`);
      console.log(`   Intent: ${result.intent} | Tickers: [${result.tickers.join(', ')}]`);
    } else {
      failed++;
      console.log(`❌ "${test.message}"`);
      console.log(`   Attendu: ${test.expectedIntent} | [${test.expectedTickers.join(', ')}]`);
      console.log(`   Reçu:    ${result.intent} | [${result.tickers.join(', ')}]`);
      
      if (!intentMatch) {
        console.log(`   ⚠️  Intent incorrect`);
      }
      if (!tickersMatch) {
        console.log(`   ⚠️  Tickers incorrects`);
      }
    }
    console.log('');
  }

  console.log('='.repeat(60));
  console.log(`\n📊 RÉSULTATS: ${passed}/${testCases.length} tests réussis`);
  
  if (failed > 0) {
    console.log(`❌ ${failed} tests échoués\n`);
    process.exit(1);
  } else {
    console.log(`🎉 TOUS LES TESTS PASSENT !\n`);
    process.exit(0);
  }
}

runTests();

