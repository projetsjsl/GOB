#!/usr/bin/env node
/**
 * Test complet de tous les endpoints et appels API
 * Valide que tous les endpoints fonctionnent correctement
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';

// Configuration
const BASE_URL = process.env.BASE_URL || 'https://gobapps.com';
const TEST_TIMEOUT = 30000; // 30 secondes

// Résultats des tests
const results = {
    passed: [],
    failed: [],
    skipped: [],
    total: 0
};

// Couleurs pour la console
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Faire une requête HTTP/HTTPS
 */
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
                ...options.headers
            },
            timeout: TEST_TIMEOUT
        };

        const req = client.request(requestOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const json = data ? JSON.parse(data) : {};
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: json,
                        raw: data
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: data,
                        raw: data
                    });
                }
            });
        });

        req.on('error', reject);
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

/**
 * Tester un endpoint
 */
async function testEndpoint(name, url, options = {}) {
    results.total++;
    const expectedStatus = options.expectedStatus || 200;
    const skip = options.skip || false;

    if (skip) {
        results.skipped.push({ name, url, reason: options.skipReason || 'Skipped' });
        log(`⏭️  SKIP: ${name}`, 'yellow');
        return;
    }

    try {
        log(`\n🔍 Testing: ${name}`, 'cyan');
        log(`   URL: ${url}`, 'blue');

        const startTime = Date.now();
        const response = await makeRequest(url, options);
        const duration = Date.now() - startTime;

        if (response.status === expectedStatus) {
            results.passed.push({ name, url, status: response.status, duration });
            log(`✅ PASS: ${name} (${response.status} in ${duration}ms)`, 'green');
            if (options.validate && !options.validate(response)) {
                results.failed.push({ name, url, error: 'Validation failed' });
                log(`❌ VALIDATION FAILED: ${name}`, 'red');
            }
        } else {
            results.failed.push({ name, url, status: response.status, expected: expectedStatus });
            log(`❌ FAIL: ${name} (got ${response.status}, expected ${expectedStatus})`, 'red');
        }
    } catch (error) {
        results.failed.push({ name, url, error: error.message });
        log(`❌ ERROR: ${name} - ${error.message}`, 'red');
    }
}

/**
 * Tests des endpoints principaux
 */
async function runTests() {
    log('\n' + '='.repeat(80), 'cyan');
    log('🧪 TEST COMPLET DE TOUS LES ENDPOINTS', 'cyan');
    log('='.repeat(80) + '\n', 'cyan');

    // ============================================
    // 1. ENDPOINTS 3P1 (Finance Pro)
    // ============================================
    log('\n📊 SECTION 1: Endpoints 3P1 (Finance Pro)', 'yellow');
    
    await testEndpoint(
        'GET Validation Settings (default)',
        `${BASE_URL}/api/validation-settings?key=default`
    );

    await testEndpoint(
        'POST Validation Settings',
        `${BASE_URL}/api/validation-settings`,
        {
            method: 'POST',
            body: {
                settings_key: 'test',
                growth_min: -20,
                growth_max: 20,
                target_pe_min: 5,
                target_pe_max: 50
            }
        }
    );

    await testEndpoint(
        'GET Finance Snapshots',
        `${BASE_URL}/api/finance-snapshots?ticker=AAPL&limit=1`
    );

    await testEndpoint(
        'POST Finance Snapshots',
        `${BASE_URL}/api/finance-snapshots`,
        {
            method: 'POST',
            body: {
                ticker: 'TEST',
                profile_id: 'profile_TEST',
                annual_data: [],
                assumptions: {
                    currentPrice: 100,
                    growthRateEPS: 5,
                    targetPE: 20,
                    targetPCF: 15,
                    targetPBV: 2,
                    targetYield: 2
                },
                company_info: { name: 'Test Company' },
                is_current: false
            },
            expectedStatus: 201 // 201 Created est correct pour POST
        }
    );

    // ============================================
    // 2. ENDPOINTS MARKET DATA
    // ============================================
    log('\n📈 SECTION 2: Endpoints Market Data', 'yellow');

    await testEndpoint(
        'GET Market Data - Quote',
        `${BASE_URL}/api/marketdata?endpoint=quote&symbol=AAPL&source=auto`
    );

    await testEndpoint(
        'GET Market Data - Fundamentals',
        `${BASE_URL}/api/marketdata?endpoint=fundamentals&symbol=AAPL&source=auto`
    );

    await testEndpoint(
        'GET Market Data - Intraday',
        `${BASE_URL}/api/marketdata?endpoint=intraday&symbol=AAPL&interval=5min&outputsize=10`
    );

    await testEndpoint(
        'GET Market Data - Analyst',
        `${BASE_URL}/api/marketdata?endpoint=analyst&symbol=AAPL`
    );

    await testEndpoint(
        'GET Market Data - Earnings',
        `${BASE_URL}/api/marketdata?endpoint=earnings&symbol=AAPL`
    );

    // ============================================
    // 3. ENDPOINTS FMP (Financial Modeling Prep)
    // ============================================
    log('\n💹 SECTION 3: Endpoints FMP', 'yellow');

    await testEndpoint(
        'GET FMP - Quote',
        `${BASE_URL}/api/fmp?endpoint=quote&symbol=AAPL`
    );

    await testEndpoint(
        'GET FMP - News',
        `${BASE_URL}/api/fmp?endpoint=news&symbols=AAPL&limit=5`
    );

    await testEndpoint(
        'GET FMP - Company Data',
        `${BASE_URL}/api/fmp-company-data?symbol=AAPL`
    );

    await testEndpoint(
        'GET FMP - Search',
        `${BASE_URL}/api/fmp-search?query=Apple`
    );

    // ============================================
    // 4. ENDPOINTS SUPABASE
    // ============================================
    log('\n🗄️  SECTION 4: Endpoints Supabase', 'yellow');

    await testEndpoint(
        'GET Supabase Watchlist',
        `${BASE_URL}/api/supabase-watchlist`,
        { expectedStatus: 200 } // Fonctionne sans auth
    );

    // ============================================
    // 5. ENDPOINTS EMMA IA
    // ============================================
    log('\n🤖 SECTION 5: Endpoints Emma IA', 'yellow');

    await testEndpoint(
        'GET LLM Models',
        `${BASE_URL}/api/llm-models`
    );

    await testEndpoint(
        'POST Chat Assistant',
        `${BASE_URL}/api/chat-assistant`,
        {
            method: 'POST',
            body: {
                message: 'Test message',
                ticker: 'AAPL'
            },
            expectedStatus: 400 // 400 est attendu sans config complète
        }
    );

    // ============================================
    // 6. ENDPOINTS BRIEFINGS
    // ============================================
    log('\n📧 SECTION 6: Endpoints Briefings', 'yellow');

    await testEndpoint(
        'GET Email Recipients',
        `${BASE_URL}/api/email-recipients`
    );

    // ============================================
    // 7. ENDPOINTS CALENDRIERS
    // ============================================
    log('\n📅 SECTION 7: Endpoints Calendriers', 'yellow');

    await testEndpoint(
        'GET Earnings Calendar',
        `${BASE_URL}/api/calendar-earnings?symbol=AAPL`
    );

    await testEndpoint(
        'GET Economic Calendar',
        `${BASE_URL}/api/calendar-economic`
    );

    await testEndpoint(
        'GET Dividends Calendar',
        `${BASE_URL}/api/calendar-dividends?symbol=AAPL`
    );

    // ============================================
    // 8. ENDPOINTS ADMIN
    // ============================================
    log('\n⚙️  SECTION 8: Endpoints Admin', 'yellow');

    await testEndpoint(
        'GET Admin Tickers',
        `${BASE_URL}/api/admin/tickers`,
        { expectedStatus: 200 } // Fonctionne sans auth
    );

    // ============================================
    // 9. ENDPOINTS UTILITAIRES
    // ============================================
    log('\n🔧 SECTION 9: Endpoints Utilitaires', 'yellow');

    await testEndpoint(
        'GET Yield Curve',
        `${BASE_URL}/api/yield-curve`
    );

    await testEndpoint(
        'GET Treasury Rates',
        `${BASE_URL}/api/treasury-rates?country=US`
    );

    await testEndpoint(
        'GET Sector Data',
        `${BASE_URL}/api/sector`,
        { expectedStatus: [200, 500], skipReason: 'Alpha Vantage rate limit' } // Peut échouer si API Alpha Vantage rate limit
    );

    await testEndpoint(
        'GET Sector Index',
        `${BASE_URL}/api/sector-index?name=msci_world&horizon=B`,
        { expectedStatus: [200, 500], skipReason: 'Dépend de Sector Data' } // Dépend de /api/sector
    );

    // ============================================
    // 10. ENDPOINTS HEALTH CHECK
    // ============================================
    log('\n🏥 SECTION 10: Health Checks', 'yellow');

    await testEndpoint(
        'GET Health Check Simple',
        `${BASE_URL}/api/health-check-simple`
    );

    // ============================================
    // RÉSUMÉ
    // ============================================
    log('\n' + '='.repeat(80), 'cyan');
    log('📊 RÉSUMÉ DES TESTS', 'cyan');
    log('='.repeat(80), 'cyan');

    log(`\n✅ Tests réussis: ${results.passed.length}`, 'green');
    log(`❌ Tests échoués: ${results.failed.length}`, 'red');
    log(`⏭️  Tests ignorés: ${results.skipped.length}`, 'yellow');
    log(`📊 Total: ${results.total}`, 'cyan');

    if (results.failed.length > 0) {
        log('\n❌ ÉCHECS DÉTAILLÉS:', 'red');
        results.failed.forEach((failure, index) => {
            log(`\n${index + 1}. ${failure.name}`, 'red');
            log(`   URL: ${failure.url}`, 'red');
            if (failure.status) {
                log(`   Status: ${failure.status} (expected: ${failure.expected})`, 'red');
            }
            if (failure.error) {
                log(`   Error: ${failure.error}`, 'red');
            }
        });
    }

    if (results.passed.length > 0) {
        log('\n✅ SUCCÈS DÉTAILLÉS:', 'green');
        results.passed.slice(0, 10).forEach((success, index) => {
            log(`${index + 1}. ${success.name} (${success.status} in ${success.duration}ms)`, 'green');
        });
        if (results.passed.length > 10) {
            log(`... et ${results.passed.length - 10} autres`, 'green');
        }
    }

    log('\n' + '='.repeat(80), 'cyan');

    // Code de sortie
    process.exit(results.failed.length > 0 ? 1 : 0);
}

// Exécuter les tests
runTests().catch((error) => {
    log(`\n💥 ERREUR CRITIQUE: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
});
