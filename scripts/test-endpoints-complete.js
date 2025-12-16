#!/usr/bin/env node

/**
 * Script de test complet de tous les endpoints et appels API
 * Génère un rapport détaillé avec catégorisation
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'https://gobapps.com';
const TIMEOUT = 60000; // 60 secondes pour les endpoints longs
const REPORT_FILE = 'test-endpoints-report.json';

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

// Statistiques
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  timeout: 0,
  errors: [],
  categories: {},
};

// Endpoints par catégorie
const endpointsByCategory = {
  'Market Data': [
    { path: '/api/marketdata/batch', method: 'GET', params: '?symbols=AAPL,MSFT', description: 'Market data batch' },
    { path: '/api/market-data-batch', method: 'GET', params: '?tickers=AAPL&checkOnly=true', description: 'Market data batch (alt)' },
  ],
  'Chat & AI': [
    { path: '/api/gemini/chat', method: 'POST', body: { message: 'test', userId: 'test' }, description: 'Gemini chat' },
    { path: '/api/chat-assistant', method: 'POST', body: { message: 'test', context: 'test' }, description: 'Chat assistant' },
    { path: '/api/chat', method: 'POST', body: { message: 'test', userId: 'test', channel: 'web' }, description: 'Chat API' },
    { path: '/api/emma-agent', method: 'POST', body: { message: 'test', channel: 'web' }, description: 'Emma Agent' },
    { path: '/api/ai-services', method: 'GET', description: 'AI Services' },
  ],
  'Emma Briefings': [
    { path: '/api/emma-briefing', method: 'GET', params: '?type=morning', description: 'Emma Briefing' },
    { path: '/api/briefing', method: 'GET', params: '?type=morning', description: 'Briefing' },
    { path: '/api/emma-n8n', method: 'POST', body: { message: 'test' }, headers: { 'Authorization': 'Bearer test' }, description: 'Emma N8N (nécessite auth)' },
  ],
  'Calendriers': [
    { path: '/api/calendar-economic', method: 'GET', description: 'Economic Calendar' },
    { path: '/api/calendar-earnings', method: 'GET', description: 'Earnings Calendar' },
    { path: '/api/calendar-dividends', method: 'GET', description: 'Dividends Calendar' },
  ],
  'FMP (Financial Modeling Prep)': [
    { path: '/api/fmp-company-data', method: 'GET', params: '?symbol=AAPL', description: 'FMP Company Data' },
    { path: '/api/fmp-search', method: 'GET', params: '?query=Apple', description: 'FMP Search' },
    { path: '/api/fmp-stock-screener', method: 'GET', params: '?marketCapMoreThan=1000000000', description: 'FMP Stock Screener' },
    { path: '/api/fmp-sector-data', method: 'GET', params: '?sector=Technology', description: 'FMP Sector Data' },
    { path: '/api/fmp-sync', method: 'POST', body: { action: 'sync-quote', tickers: ['AAPL'] }, description: 'FMP Sync' },
  ],
  'Supabase & Data': [
    { path: '/api/supabase-watchlist', method: 'GET', description: 'Supabase Watchlist' },
    { path: '/api/finance-snapshots', method: 'GET', params: '?ticker=AAPL&limit=5', description: 'Finance Snapshots' },
    { path: '/api/validation-settings', method: 'GET', params: '?key=default', description: 'Validation Settings' },
  ],
  'News & Media': [
    { path: '/api/news', method: 'GET', params: '?ticker=AAPL', description: 'News API' },
    { path: '/api/finviz-news', method: 'GET', params: '?ticker=AAPL', description: 'Finviz News' },
    { path: '/api/finviz-why-moving', method: 'GET', params: '?ticker=AAPL', description: 'Finviz Why Moving' },
  ],
  'Admin': [
    { path: '/api/admin/tickers', method: 'GET', description: 'Admin Tickers' },
    { path: '/api/admin/redirects', method: 'GET', description: 'Admin Redirects' },
    { path: '/api/admin/emma-config', method: 'GET', params: '?section=ui&key=primary_nav_config', description: 'Admin Emma Config' },
  ],
  'Adapters (SMS/Email/Messenger)': [
    { path: '/api/adapters/sms', method: 'POST', body: { message: 'test', to: '+1234567890' }, description: 'SMS Adapter' },
    { path: '/api/adapters/email', method: 'POST', body: { to: 'test@example.com', subject: 'Test', html: '<p>Test</p>' }, description: 'Email Adapter' },
    { path: '/api/adapters/messenger', method: 'POST', body: { message: 'test' }, description: 'Messenger Adapter' },
  ],
  'Financial Indicators': [
    { path: '/api/yield-curve', method: 'GET', description: 'Yield Curve' },
    { path: '/api/treasury-rates', method: 'GET', description: 'Treasury Rates' },
    { path: '/api/rsi-screener', method: 'GET', params: '?minRSI=30&maxRSI=70', description: 'RSI Screener' },
  ],
  'Sector & Market': [
    { path: '/api/sector', method: 'GET', description: 'Sector Data' },
    { path: '/api/sector-index', method: 'GET', description: 'Sector Index' },
  ],
  'Proxy & Utilities': [
    { path: '/api/jslai-proxy', method: 'GET', params: '?url=https://example.com', description: 'JSLAI Proxy' },
    { path: '/api/jslai-proxy-resource', method: 'GET', params: '?url=https://example.com', description: 'JSLAI Proxy Resource' },
    { path: '/api/kpi-engine', method: 'GET', params: '?ticker=AAPL', description: 'KPI Engine' },
    { path: '/api/terminal-data', method: 'GET', description: 'Terminal Data' },
    { path: '/api/health-check-simple', method: 'GET', description: 'Health Check' },
  ],
  '3p1 & Finance Pro': [
    { path: '/api/3p1-sync-na', method: 'POST', body: { ticker: 'AAPL' }, description: '3p1 Sync NA' },
    { path: '/api/remove-ticker', method: 'POST', body: { ticker: 'TEST' }, description: 'Remove Ticker' },
  ],
  'Groupchat': [
    { path: '/api/groupchat/simulate', method: 'POST', body: { message: 'test' }, description: 'Groupchat Simulate' },
    { path: '/api/groupchat/admin', method: 'GET', description: 'Groupchat Admin' },
    { path: '/api/groupchat/test', method: 'GET', description: 'Groupchat Test' },
  ],
  'Other': [
    { path: '/api/fastgraphs-login', method: 'POST', body: { username: 'test', password: 'test' }, description: 'FastGraphs Login' },
    { path: '/api/send-email', method: 'POST', body: { to: 'test@example.com', subject: 'Test', html: '<p>Test</p>' }, description: 'Send Email' },
    { path: '/api/format-preview', method: 'POST', body: { content: 'test', format: 'email' }, description: 'Format Preview' },
  ],
};

// Fonction pour faire une requête HTTP/HTTPS
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GOB-Endpoint-Tester/1.0',
        ...options.headers,
      },
      timeout: options.timeout || TIMEOUT,
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Tester un endpoint
async function testEndpoint(endpoint, category) {
  stats.total++;
  
  if (!stats.categories[category]) {
    stats.categories[category] = { total: 0, passed: 0, failed: 0 };
  }
  stats.categories[category].total++;
  
  const url = BASE_URL + endpoint.path + (endpoint.params || '');
  const method = endpoint.method || 'GET';
  
  const result = {
    category,
    path: endpoint.path,
    method,
    description: endpoint.description,
    status: 'unknown',
    statusCode: null,
    duration: null,
    error: null,
    responsePreview: null,
  };
  
  try {
    const startTime = Date.now();
    const response = await makeRequest(url, {
      method,
      body: endpoint.body,
      headers: endpoint.headers,
      timeout: endpoint.timeout || TIMEOUT,
    });
    const duration = Date.now() - startTime;
    result.duration = duration;
    result.statusCode = response.statusCode;

    // Vérifier le statut
    const isSuccess = response.statusCode >= 200 && response.statusCode < 400;
    
    if (isSuccess) {
      stats.passed++;
      stats.categories[category].passed++;
      result.status = 'passed';
      
      // Aperçu de la réponse
      if (response.body && response.body.length < 500) {
        try {
          const json = JSON.parse(response.body);
          result.responsePreview = JSON.stringify(json).substring(0, 200);
        } catch (e) {
          result.responsePreview = response.body.substring(0, 200);
        }
      }
    } else {
      stats.failed++;
      stats.categories[category].failed++;
      result.status = 'failed';
      result.error = `HTTP ${response.statusCode}`;
      
      if (response.body) {
        try {
          const json = JSON.parse(response.body);
          result.responsePreview = JSON.stringify(json).substring(0, 300);
        } catch (e) {
          result.responsePreview = response.body.substring(0, 300);
        }
      }
    }
  } catch (error) {
    stats.failed++;
    stats.categories[category].failed++;
    result.status = error.message.includes('timeout') ? 'timeout' : 'error';
    result.error = error.message;
    
    if (error.message.includes('timeout')) {
      stats.timeout++;
    }
  }
  
  stats.errors.push(result);
  return result;
}

// Afficher le résultat d'un test
function displayResult(result) {
  const icon = result.status === 'passed' ? '✅' : result.status === 'timeout' ? '⏱️' : '❌';
  const color = result.status === 'passed' ? colors.green : result.status === 'timeout' ? colors.yellow : colors.red;
  
  console.log(`${color}${icon}${colors.reset} ${result.method} ${result.path} - ${result.description}`);
  
  if (result.statusCode) {
    console.log(`   Status: ${result.statusCode}${result.duration ? ` (${result.duration}ms)` : ''}`);
  }
  
  if (result.error) {
    console.log(`   ${colors.red}Erreur: ${result.error}${colors.reset}`);
  }
  
  if (result.responsePreview && result.status !== 'passed') {
    console.log(`   ${colors.yellow}Response: ${result.responsePreview}...${colors.reset}`);
  }
}

// Fonction principale
async function runTests() {
  console.log(`${colors.blue}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║  GOB - Test Complet de Tous les Endpoints API            ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`\nBase URL: ${BASE_URL}`);
  
  const totalEndpoints = Object.values(endpointsByCategory).reduce((sum, endpoints) => sum + endpoints.length, 0);
  console.log(`Total endpoints à tester: ${totalEndpoints}\n`);

  const results = [];
  
  // Tester tous les endpoints par catégorie
  for (const [category, endpoints] of Object.entries(endpointsByCategory)) {
    console.log(`\n${colors.magenta}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.magenta}📁 ${category}${colors.reset} (${endpoints.length} endpoints)`);
    console.log(`${colors.magenta}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    
    for (const endpoint of endpoints) {
      const result = await testEndpoint(endpoint, category);
      results.push(result);
      displayResult(result);
      
      // Petite pause entre les requêtes
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  // Générer le rapport JSON
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    summary: {
      total: stats.total,
      passed: stats.passed,
      failed: stats.failed,
      timeout: stats.timeout,
      successRate: ((stats.passed / stats.total) * 100).toFixed(2) + '%',
    },
    categories: stats.categories,
    results: results,
  };
  
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  console.log(`\n${colors.cyan}📄 Rapport sauvegardé: ${REPORT_FILE}${colors.reset}`);

  // Afficher le résumé
  console.log(`\n${colors.blue}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║  RÉSUMÉ DES TESTS                                         ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`\nTotal: ${stats.total}`);
  console.log(`${colors.green}✅ Réussis: ${stats.passed} (${((stats.passed / stats.total) * 100).toFixed(1)}%)${colors.reset}`);
  console.log(`${colors.red}❌ Échoués: ${stats.failed} (${((stats.failed / stats.total) * 100).toFixed(1)}%)${colors.reset}`);
  if (stats.timeout > 0) {
    console.log(`${colors.yellow}⏱️  Timeouts: ${stats.timeout}${colors.reset}`);
  }

  // Résumé par catégorie
  console.log(`\n${colors.cyan}📊 RÉSUMÉ PAR CATÉGORIE:${colors.reset}`);
  for (const [category, catStats] of Object.entries(stats.categories)) {
    const successRate = ((catStats.passed / catStats.total) * 100).toFixed(1);
    const color = successRate >= 80 ? colors.green : successRate >= 50 ? colors.yellow : colors.red;
    console.log(`   ${category}: ${color}${catStats.passed}/${catStats.total} (${successRate}%)${colors.reset}`);
  }

  // Endpoints échoués
  const failedResults = results.filter(r => r.status !== 'passed');
  if (failedResults.length > 0) {
    console.log(`\n${colors.yellow}⚠️  ENDPOINTS ÉCHOUÉS (${failedResults.length}):${colors.reset}`);
    failedResults.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.method} ${result.path}`);
      console.log(`   Catégorie: ${result.category}`);
      console.log(`   Description: ${result.description}`);
      if (result.statusCode) {
        console.log(`   Status: ${result.statusCode}`);
      }
      if (result.error) {
        console.log(`   Erreur: ${result.error}`);
      }
    });
  }

  // Code de sortie
  const exitCode = stats.failed > 0 ? 1 : 0;
  console.log(`\n${exitCode === 0 ? colors.green : colors.red}Code de sortie: ${exitCode}${colors.reset}\n`);
  process.exit(exitCode);
}

// Exécuter les tests
runTests().catch((error) => {
  console.error(`${colors.red}Erreur fatale:${colors.reset}`, error);
  process.exit(1);
});

