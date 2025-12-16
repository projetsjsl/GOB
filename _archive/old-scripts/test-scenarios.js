#!/usr/bin/env node
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config({ path: '.env.test' });
dotenv.config();

export const scenarios = [
  {
    name: 'Vue Marché globale',
    from: '+15551111111',
    body: 'MARCHE',
    expectedKeywords: ['Dow', 'S&P', 'Nasdaq']
  },
  {
    name: 'Analyse complète',
    from: '+15552222222',
    body: 'ANALYSE AAPL',
    expectedKeywords: ['Valorisation', 'Fondamentaux', 'Risques']
  },
  {
    name: 'Actualités ticker',
    from: '+15553333333',
    body: 'NEWS MSFT',
    expectedKeywords: ['News', 'Sources']
  },
  {
    name: 'Indicateur technique',
    from: '+15554444444',
    body: 'RSI NVDA',
    expectedKeywords: ['RSI', 'surachat']
  },
  {
    name: 'Calendrier résultats',
    from: '+15555555555',
    body: 'RESULTATS TSLA',
    expectedKeywords: ['earnings', 'prévision']
  },
  {
    name: 'Watchlist - Ajouter',
    from: '+15556666666',
    body: 'AJOUTER NVDA',
    expectedKeywords: ['ajouté', 'watchlist']
  },
  {
    name: 'Commande SKILLS',
    from: '+15557777777',
    body: 'SKILLS',
    expectedKeywords: ['Analyses', 'Calendriers', 'Watchlist']
  },
  {
    name: 'Top Actualités',
    from: '+33612345678',
    body: 'TOP 5 NEWS',
    expectedKeywords: ['Top 5', 'news']
  }
];

const DEFAULT_PORT = Number(process.env.PORT || process.env.TEST_SMS_PORT || 3000);
const SERVER_URL = process.env.TEST_SMS_SERVER_URL || `http://localhost:${DEFAULT_PORT}`;
const SIMULATE_ENDPOINT = `${SERVER_URL}/simulate-incoming?format=json`;

export async function runScenario(scenario) {
  const payload = new URLSearchParams({
    From: scenario.from,
    Body: scenario.body
  });

  const response = await axios.post(SIMULATE_ENDPOINT, payload.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json'
    },
    validateStatus: status => status < 400 || status === 422
  });

  const text = response.data?.response || '';
  const expected = scenario.expectedKeywords || [];
  const missing = expected.filter(keyword => !text.toLowerCase().includes(keyword.toLowerCase()));

  return {
    ...scenario,
    status: response.status,
    response: text,
    missing,
    passed: missing.length === 0
  };
}

export async function runAllScenarios({ filter } = {}) {
  const selected = filter
    ? scenarios.filter(s =>
        s.name.toLowerCase().includes(filter.toLowerCase()) ||
        s.body.toLowerCase().includes(filter.toLowerCase())
      )
    : scenarios;

  const results = [];
  for (const scenario of selected) {
    try {
      const result = await runScenario(scenario);
      results.push(result);
      logResult(result);
    } catch (error) {
      console.error(`❌ ${scenario.name}: ${error.message}`);
      results.push({ ...scenario, passed: false, error: error.message });
    }
  }

  const passedCount = results.filter(r => r.passed).length;
  console.log(`\nRésultats: ${passedCount}/${results.length} scénarios réussis`);

  return { results, passed: passedCount === results.length };
}

function logResult(result) {
  const statusIcon = result.passed ? '✅' : '⚠️';
  console.log(`\n${statusIcon} ${result.name}`);
  console.log(`   From: ${result.from}`);
  console.log(`   Body: ${result.body}`);
  if (result.response) {
    console.log(`   Réponse: ${result.response.substring(0, 180)}${result.response.length > 180 ? '…' : ''}`);
  }
  if (!result.passed && result.missing?.length) {
    console.log(`   Mots clés manquants: ${result.missing.join(', ')}`);
  }
}

async function cli() {
  const args = process.argv.slice(2);
  if (args.includes('--list')) {
    console.table(scenarios.map(s => ({ name: s.name, body: s.body })));
    process.exit(0);
  }

  const filterArg = args.find(arg => arg.startsWith('--filter='));
  const filter = filterArg ? filterArg.split('=')[1] : undefined;

  console.log(`🚀 Lancement des scénarios Emma SMS (${SERVER_URL})`);
  await runAllScenarios({ filter });
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
const currentPath = fileURLToPath(import.meta.url);
if (invokedPath && currentPath === invokedPath) {
  cli().catch(error => {
    console.error('❌ Erreur scenarios:', error.message);
    process.exit(1);
  });
}
