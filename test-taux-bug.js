#!/usr/bin/env node
/**
 * Test du bug "taux" → "T" (AT&T)
 */

import { TickerExtractor } from './lib/utils/ticker-extractor.js';
import { HybridIntentAnalyzer } from './lib/intent-analyzer.js';

const analyzer = new HybridIntentAnalyzer();

console.log('\n🧪 TEST BUG "TAUX" → "T" (AT&T)\n');
console.log('='.repeat(60));

// Test 1: Extraction de tickers
console.log('\n📊 TEST 1: Extraction de tickers');
console.log('-'.repeat(60));

const testMessages = [
  'taux',
  '/taux',
  'Taux',
  'TAUX',
  'les taux',
  'taux fed',
  'quels sont les taux'
];

testMessages.forEach(msg => {
  const tickers = TickerExtractor.extract(msg);
  console.log(`Message: "${msg}"`);
  console.log(`  → Tickers extraits: [${tickers.join(', ')}]`);
  console.log(`  → ❌ BUG si "T" extrait\n`);
});

// Test 2: Intent analysis
console.log('\n🧠 TEST 2: Analyse d\'intent');
console.log('-'.repeat(60));

async function testIntent() {
  for (const msg of testMessages) {
    const result = await analyzer.analyze(msg, {});
    console.log(`Message: "${msg}"`);
    console.log(`  → Intent: ${result.intent}`);
    console.log(`  → Tickers: [${result.tickers.join(', ')}]`);
    console.log(`  → Confidence: ${result.confidence}`);
    
    if (result.intent !== 'economic_analysis') {
      console.log(`  → ❌ ERREUR: Devrait être "economic_analysis"`);
    } else {
      console.log(`  → ✅ OK`);
    }
    
    if (result.tickers.includes('T')) {
      console.log(`  → ❌ ERREUR: "T" ne devrait pas être extrait`);
    }
    console.log('');
  }
}

testIntent();

