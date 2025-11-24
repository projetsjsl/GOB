#!/usr/bin/env node
/**
 * Test complet des 17 SKILLS avec commandes slash (/)
 */

import { HybridIntentAnalyzer } from './lib/intent-analyzer.js';
import { hasCustomPrompt } from './config/intent-prompts.js';

const analyzer = new HybridIntentAnalyzer();

console.log('\n🧪 TEST COMPLET DES 17 SKILLS EMMA\n');
console.log('='.repeat(80));

const skills = [
  {
    num: 1,
    name: 'ANALYSE COMPLETE',
    commands: ['Analyse AAPL', '/analyse AAPL'],
    expectedIntent: 'comprehensive_analysis',
    expectedTickers: ['AAPL'],
    hasPrompt: false // Utilise prompt générique
  },
  {
    num: 2,
    name: 'PRIX ACTUEL',
    commands: ['Prix MSFT', '/prix MSFT'],
    expectedIntent: 'stock_price',
    expectedTickers: ['MSFT'],
    hasPrompt: true
  },
  {
    num: 3,
    name: 'ACTUALITES (Marchés)',
    commands: ['/news', 'news'],
    expectedIntent: 'news',
    expectedTickers: [],
    hasPrompt: true
  },
  {
    num: 3.1,
    name: 'ACTUALITES (Ticker)',
    commands: ['News GOOGL', '/news GOOGL'],
    expectedIntent: 'news',
    expectedTickers: ['GOOGL'],
    hasPrompt: true
  },
  {
    num: 4,
    name: 'COMPARAISON',
    commands: ['Compare AAPL MSFT', '/compare AAPL MSFT'],
    expectedIntent: 'comparative_analysis',
    expectedTickers: ['AAPL', 'MSFT'],
    hasPrompt: true
  },
  {
    num: 5,
    name: 'INDICES/MARCHE',
    commands: ['Indices', '/indices', 'Marche', '/marche'],
    expectedIntent: 'market_overview',
    expectedTickers: [],
    hasPrompt: true
  },
  {
    num: 6,
    name: 'ECONOMIE/TAUX',
    commands: ['Taux', '/taux', 'Fed', '/fed'],
    expectedIntent: 'economic_analysis',
    expectedTickers: [],
    hasPrompt: true
  },
  {
    num: 7,
    name: 'RESULTATS',
    commands: ['Earnings TSLA', '/earnings TSLA'],
    expectedIntent: 'earnings',
    expectedTickers: ['TSLA'],
    hasPrompt: true
  },
  {
    num: 8,
    name: 'FONDAMENTAUX',
    commands: ['Fondamentaux AAPL', '/fondamentaux AAPL'],
    expectedIntent: 'fundamentals',
    expectedTickers: ['AAPL'],
    hasPrompt: true
  },
  {
    num: 9,
    name: 'TECHNIQUE',
    commands: ['RSI AAPL', '/rsi AAPL'],
    expectedIntent: 'technical_analysis',
    expectedTickers: ['AAPL'],
    hasPrompt: true
  },
  {
    num: 10,
    name: 'PORTFOLIO',
    commands: ['Ma watchlist', '/watchlist', 'Mon portfolio'],
    expectedIntent: 'portfolio',
    expectedTickers: [],
    hasPrompt: true
  },
  {
    num: 11,
    name: 'RECOMMANDATION',
    commands: ['Recommandation AAPL', '/recommandation AAPL'],
    expectedIntent: 'recommendation',
    expectedTickers: ['AAPL'],
    hasPrompt: true
  },
  {
    num: 12,
    name: 'RISQUE',
    commands: ['Risque NVDA', '/risque NVDA'],
    expectedIntent: 'risk_volatility',
    expectedTickers: ['NVDA'],
    hasPrompt: true
  },
  {
    num: 13,
    name: 'SECTEUR',
    commands: ['Secteur tech', '/secteur tech'],
    expectedIntent: 'sector_industry',
    expectedTickers: [],
    hasPrompt: true
  },
  {
    num: 14,
    name: 'VALORISATION',
    commands: ['Valorisation AAPL', '/valorisation AAPL'],
    expectedIntent: 'valuation',
    expectedTickers: ['AAPL'],
    hasPrompt: true
  },
  {
    num: 15,
    name: 'SCREENING',
    commands: ['Screening tech', '/screening tech'],
    expectedIntent: 'stock_screening',
    expectedTickers: [],
    hasPrompt: true
  },
  {
    num: 16,
    name: 'POLITIQUE/GEOPOLITIQUE',
    commands: ['Politique Trump', '/politique trump', 'Geopolitique Chine'],
    expectedIntent: 'political_analysis',
    expectedTickers: [],
    hasPrompt: true
  },
  {
    num: 17,
    name: 'STRATEGIE INVESTISSEMENT',
    commands: ['Strategie value', '/strategie value', 'Allocation portefeuille'],
    expectedIntent: 'investment_strategy',
    expectedTickers: [],
    hasPrompt: true
  }
];

async function testSkill(skill) {
  console.log(`\n${'─'.repeat(80)}`);
  console.log(`📊 SKILL #${skill.num}: ${skill.name}`);
  console.log(`${'─'.repeat(80)}`);
  
  // Vérifier prompt custom
  const promptStatus = skill.hasPrompt ? '✅ Prompt custom' : '⚠️  Prompt générique';
  const promptExists = hasCustomPrompt(skill.expectedIntent);
  console.log(`${promptExists ? '✅' : '❌'} ${promptStatus} (intent: ${skill.expectedIntent})`);
  
  let allPassed = true;
  
  for (const command of skill.commands) {
    const result = await analyzer.analyze(command, {});
    
    const intentMatch = result.intent === skill.expectedIntent;
    const tickersMatch = JSON.stringify(result.tickers.sort()) === JSON.stringify(skill.expectedTickers.sort());
    const testPassed = intentMatch && tickersMatch;
    
    if (!testPassed) allPassed = false;
    
    const icon = testPassed ? '✅' : '❌';
    console.log(`${icon} "${command}"`);
    
    if (!testPassed) {
      console.log(`   Attendu: ${skill.expectedIntent} | [${skill.expectedTickers.join(', ')}]`);
      console.log(`   Reçu:    ${result.intent} | [${result.tickers.join(', ')}]`);
    }
  }
  
  return allPassed;
}

async function runAllTests() {
  console.log('\n🎯 Test des 17 compétences Emma IA\n');
  
  let totalSkills = skills.length;
  let passedSkills = 0;
  let failedSkills = 0;
  
  for (const skill of skills) {
    const passed = await testSkill(skill);
    if (passed) {
      passedSkills++;
    } else {
      failedSkills++;
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 RÉSULTATS FINAUX\n`);
  console.log(`✅ Skills OK: ${passedSkills}/${totalSkills}`);
  console.log(`❌ Skills KO: ${failedSkills}/${totalSkills}`);
  
  if (failedSkills === 0) {
    console.log(`\n🎉 TOUS LES SKILLS FONCTIONNENT PARFAITEMENT !\n`);
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${failedSkills} skill(s) nécessitent des corrections\n`);
    process.exit(1);
  }
}

runAllTests();

