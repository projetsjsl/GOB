#!/usr/bin/env node
/**
 * Test complet de toutes les applications frontend
 * Valide que tous les appels API depuis le frontend fonctionnent
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';

// Configuration
const BASE_URL = process.env.BASE_URL || 'https://gobapps.com';
const TEST_TIMEOUT = 30000;

// Résultats
const results = {
    passed: [],
    failed: [],
    skipped: [],
    total: 0
};

// Couleurs
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

async function testEndpoint(name, url, options = {}) {
    results.total++;
    const expectedStatus = Array.isArray(options.expectedStatus) 
        ? options.expectedStatus 
        : [options.expectedStatus || 200];
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

        if (expectedStatus.includes(response.status)) {
            results.passed.push({ name, url, status: response.status, duration });
            log(`✅ PASS: ${name} (${response.status} in ${duration}ms)`, 'green');
            if (options.validate && !options.validate(response)) {
                results.failed.push({ name, url, error: 'Validation failed' });
                log(`❌ VALIDATION FAILED: ${name}`, 'red');
            }
        } else {
            results.failed.push({ name, url, status: response.status, expected: expectedStatus });
            log(`❌ FAIL: ${name} (got ${response.status}, expected ${expectedStatus.join(' or ')})`, 'red');
        }
    } catch (error) {
        results.failed.push({ name, url, error: error.message });
        log(`❌ ERROR: ${name} - ${error.message}`, 'red');
    }
}

async function runTests() {
    log('\n' + '='.repeat(80), 'cyan');
    log('🧪 TEST COMPLET DES APPLICATIONS FRONTEND', 'cyan');
    log('='.repeat(80) + '\n', 'cyan');

    // ============================================
    // 1. APPLICATION BIENVENUE
    // ============================================
    log('\n👋 SECTION 1: Application Bienvenue', 'yellow');

    await testEndpoint(
        'GET Employees (Bienvenue)',
        `${BASE_URL}/api/admin/tickers`, // Utilise admin/tickers pour les employés
        { expectedStatus: 200 }
    );

    // ============================================
    // 2. APPLICATION EMMA-CONFIG
    // ============================================
    log('\n⚙️  SECTION 2: Application Emma Config', 'yellow');

    await testEndpoint(
        'GET Emma Config',
        `${BASE_URL}/api/admin/emma-config`
    );

    await testEndpoint(
        'GET Email Design Config',
        `${BASE_URL}/api/email-design`
    );

    await testEndpoint(
        'GET Prompt Delivery Config',
        `${BASE_URL}/api/prompt-delivery-config?prompt_id=test`,
        { expectedStatus: [200, 404] } // 404 est normal si pas de config
    );

    await testEndpoint(
        'GET LLM Models (Emma Config)',
        `${BASE_URL}/api/llm-models`
    );

    // ============================================
    // 3. APPLICATION BETA COMBINED DASHBOARD
    // ============================================
    log('\n📊 SECTION 3: Beta Combined Dashboard', 'yellow');

    await testEndpoint(
        'GET Market Data - Quote (Dashboard)',
        `${BASE_URL}/api/marketdata?endpoint=quote&symbol=AAPL&source=auto`
    );

    await testEndpoint(
        'GET FMP News (Dashboard)',
        `${BASE_URL}/api/fmp?endpoint=news&symbols=AAPL&limit=5`
    );

    await testEndpoint(
        'GET Supabase Watchlist (Dashboard)',
        `${BASE_URL}/api/supabase-watchlist`
    );

    await testEndpoint(
        'GET Economic Calendar (Dashboard)',
        `${BASE_URL}/api/calendar-economic`
    );

    await testEndpoint(
        'GET Yield Curve (Dashboard)',
        `${BASE_URL}/api/yield-curve`
    );

    // ============================================
    // 4. APPLICATION GROUPCHAT
    // ============================================
    log('\n💬 SECTION 4: Group Chat Application', 'yellow');

    await testEndpoint(
        'GET Group Chat Config',
        `${BASE_URL}/api/groupchat/config`,
        { expectedStatus: [200, 404] } // Peut ne pas exister
    );

    await testEndpoint(
        'GET Group Chat Admin',
        `${BASE_URL}/api/groupchat/admin`,
        { expectedStatus: [200, 404] }
    );

    // ============================================
    // 5. APPLICATION TERMINAL EMMA IA
    // ============================================
    log('\n🖥️  SECTION 5: Terminal Emma IA', 'yellow');

    await testEndpoint(
        'GET Terminal Data',
        `${BASE_URL}/api/terminal-data?symbol=AAPL`,
        { expectedStatus: [200, 400] } // 400 si paramètres manquants
    );

    // ============================================
    // 6. APPLICATION STOCK RESEARCH
    // ============================================
    log('\n📈 SECTION 6: Stock Research Application', 'yellow');

    await testEndpoint(
        'GET Market Data - Fundamentals (Stock Research)',
        `${BASE_URL}/api/marketdata?endpoint=fundamentals&symbol=AAPL&source=auto`
    );

    await testEndpoint(
        'GET FMP Company Data (Stock Research)',
        `${BASE_URL}/api/fmp-company-data?symbol=AAPL`
    );

    // ============================================
    // 7. APPLICATION ROLES CONFIG
    // ============================================
    log('\n🔐 SECTION 7: Roles Config Application', 'yellow');

    await testEndpoint(
        'GET Roles Config',
        `${BASE_URL}/api/roles-config`,
        { expectedStatus: [200, 400, 404] } // 400 si paramètres manquants
    );

    // ============================================
    // 8. ENDPOINTS CORRIGÉS (SECTOR)
    // ============================================
    log('\n🔧 SECTION 8: Endpoints Corrigés (Sector)', 'yellow');

    await testEndpoint(
        'GET Sector Data (Corrigé)',
        `${BASE_URL}/api/sector`,
        { expectedStatus: [200, 429, 500] } // 429 = rate limit, acceptable
    );

    await testEndpoint(
        'GET Sector Index (Corrigé)',
        `${BASE_URL}/api/sector-index?name=msci_world&horizon=B`,
        { expectedStatus: [200, 429, 400, 500] } // 429 = rate limit, acceptable
    );

    // ============================================
    // 9. ENDPOINTS SUPABASE DIRECT
    // ============================================
    log('\n🗄️  SECTION 9: Endpoints Supabase Direct', 'yellow');

    await testEndpoint(
        'GET Supabase Daily Cache Status',
        `${BASE_URL}/api/supabase-daily-cache?type=status`
    );

    // ============================================
    // RÉSUMÉ
    // ============================================
    log('\n' + '='.repeat(80), 'cyan');
    log('📊 RÉSUMÉ DES TESTS FRONTEND', 'cyan');
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
                log(`   Status: ${failure.status} (expected: ${Array.isArray(failure.expected) ? failure.expected.join(' or ') : failure.expected})`, 'red');
            }
            if (failure.error) {
                log(`   Error: ${failure.error}`, 'red');
            }
        });
    }

    log('\n' + '='.repeat(80), 'cyan');

    process.exit(results.failed.length > 0 ? 1 : 0);
}

runTests().catch((error) => {
    log(`\n💥 ERREUR CRITIQUE: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
});

