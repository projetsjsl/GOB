#!/usr/bin/env node
/**
 * Test automatique de tous les SKILLS Emma
 * 
 * Vérifie que chaque commande SKILLS retourne bien une réponse
 * et que l'intent est correctement détecté.
 */

import { HybridIntentAnalyzer } from './lib/intent-analyzer.js';

const analyzer = new HybridIntentAnalyzer();

// Liste des 15 SKILLS avec commandes de test
const SKILLS_TESTS = [
  {
    id: 1,
    name: 'ANALYSE COMPLETE',
    command: 'Analyse AAPL',
    expectedIntent: 'comprehensive_analysis',
    expectedTickers: ['AAPL'],
    minTools: 5
  },
  {
    id: 2,
    name: 'PRIX ACTUEL',
    command: 'Prix MSFT',
    expectedIntent: 'stock_price',
    expectedTickers: ['MSFT'],
    minTools: 1
  },
  {
    id: 3,
    name: 'ACTUALITES',
    command: 'News GOOGL',
    expectedIntent: 'news',
    expectedTickers: ['GOOGL'],
    minTools: 1
  },
  {
    id: 4,
    name: 'COMPARAISON',
    command: 'Compare AAPL MSFT',
    expectedIntent: 'comparative_analysis',
    expectedTickers: ['AAPL', 'MSFT'],
    minTools: 2
  },
  {
    id: 5,
    name: 'INDICES/MARCHE',
    command: 'Indices',
    expectedIntent: 'market_overview',
    expectedTickers: [],
    minTools: 1
  },
  {
    id: 6,
    name: 'ECONOMIE/TAUX',
    command: 'Taux',
    expectedIntent: 'economic_analysis',
    expectedTickers: [],
    minTools: 1
  },
  {
    id: 7,
    name: 'RESULTATS',
    command: 'Earnings TSLA',
    expectedIntent: 'earnings',
    expectedTickers: ['TSLA'],
    minTools: 2
  },
  {
    id: 8,
    name: 'FONDAMENTAUX',
    command: 'Fondamentaux AAPL',
    expectedIntent: 'fundamentals',
    expectedTickers: ['AAPL'],
    minTools: 2
  },
  {
    id: 9,
    name: 'TECHNIQUE',
    command: 'RSI AAPL',
    expectedIntent: 'technical_analysis',
    expectedTickers: ['AAPL'],
    minTools: 1
  },
  {
    id: 10,
    name: 'PORTFOLIO',
    command: 'Ma watchlist',
    expectedIntent: 'portfolio',
    expectedTickers: [],
    minTools: 1
  },
  {
    id: 11,
    name: 'RECOMMANDATION',
    command: 'Recommandation AAPL',
    expectedIntent: 'recommendation',
    expectedTickers: ['AAPL'],
    minTools: 2
  },
  {
    id: 12,
    name: 'RISQUE',
    command: 'Risque NVDA',
    expectedIntent: 'risk_volatility',
    expectedTickers: ['NVDA'],
    minTools: 2
  },
  {
    id: 13,
    name: 'SECTEUR',
    command: 'Secteur tech',
    expectedIntent: 'sector_industry',
    expectedTickers: [],
    minTools: 2
  },
  {
    id: 14,
    name: 'VALORISATION',
    command: 'Valorisation AAPL',
    expectedIntent: 'valuation',
    expectedTickers: ['AAPL'],
    minTools: 2
  },
  {
    id: 15,
    name: 'SCREENING',
    command: 'Screening tech',
    expectedIntent: 'stock_screening',
    expectedTickers: [],
    minTools: 1
  }
];

async function testSkill(skill) {
  try {
    console.log(`\n🧪 Test ${skill.id}: ${skill.name}`);
    console.log(`   Commande: "${skill.command}"`);
    
    // Analyser l'intent
    const result = await analyzer.analyze(skill.command, {});
    
    // Vérifications
    const checks = {
      intent: result.intent === skill.expectedIntent,
      confidence: result.confidence >= 0.7,
      tickers: JSON.stringify(result.tickers) === JSON.stringify(skill.expectedTickers),
      tools: result.suggested_tools && result.suggested_tools.length >= skill.minTools
    };
    
    const allPassed = Object.values(checks).every(v => v);
    
    if (allPassed) {
      console.log(`   ✅ PASS`);
      console.log(`      Intent: ${result.intent} (confidence: ${result.confidence})`);
      console.log(`      Tickers: ${result.tickers.join(', ') || 'aucun'}`);
      console.log(`      Tools: ${result.suggested_tools.length} outils`);
    } else {
      console.log(`   ❌ FAIL`);
      if (!checks.intent) {
        console.log(`      ❌ Intent: attendu "${skill.expectedIntent}", reçu "${result.intent}"`);
      }
      if (!checks.confidence) {
        console.log(`      ❌ Confidence: ${result.confidence} (< 0.7)`);
      }
      if (!checks.tickers) {
        console.log(`      ❌ Tickers: attendu ${JSON.stringify(skill.expectedTickers)}, reçu ${JSON.stringify(result.tickers)}`);
      }
      if (!checks.tools) {
        console.log(`      ❌ Tools: ${result.suggested_tools?.length || 0} outils (min: ${skill.minTools})`);
      }
    }
    
    return allPassed;
    
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║        🧪 TEST AUTOMATIQUE DE TOUS LES SKILLS EMMA            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  
  const results = [];
  
  for (const skill of SKILLS_TESTS) {
    const passed = await testSkill(skill);
    results.push({ skill: skill.name, passed });
  }
  
  // Résumé
  console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                        📊 RÉSUMÉ                               ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);
  
  console.log(`✅ Tests réussis: ${passed}/${total} (${percentage}%)`);
  console.log(`❌ Tests échoués: ${failed}/${total}`);
  
  if (failed > 0) {
    console.log('\n❌ Skills échoués:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.skill}`);
    });
  }
  
  console.log('\n');
  
  if (percentage === 100) {
    console.log('🎉 TOUS LES SKILLS FONCTIONNENT ! 🎉\n');
    process.exit(0);
  } else {
    console.log('⚠️  Certains skills nécessitent des corrections.\n');
    process.exit(1);
  }
}

// Exécuter les tests
runAllTests();

