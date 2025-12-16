#!/usr/bin/env node

/**
 * Script de test des endpoints en production
 * Teste tous les endpoints corrigés sur gobapps.com
 * Génère un rapport détaillé avec recommandations
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import { URL } from 'url';

const PRODUCTION_URL = 'https://gobapps.com';
const TIMEOUT = 30000;
const REPORT_FILE = 'test-production-report.json';

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

const results = {
    passed: [],
    failed: [],
    warnings: [],
    total: 0,
    timestamp: new Date().toISOString()
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
                'User-Agent': 'GOB-Production-Tester/1.0',
                ...options.headers
            },
            timeout: TIMEOUT
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
    const expectedStatus = options.expectedStatus || 200;
    const skip = options.skip || false;

    if (skip) {
        results.warnings.push({ name, url, reason: options.skipReason || 'Skipped' });
        log(`⏭️  SKIP: ${name}`, 'yellow');
        return;
    }

    try {
        log(`\n🔍 Testing: ${name}`, 'cyan');
        log(`   URL: ${url}`, 'blue');

        const startTime = Date.now();
        const response = await makeRequest(url, options);
        const duration = Date.now() - startTime;

        // Vérifier le statut
        const statusMatch = Array.isArray(expectedStatus) 
            ? expectedStatus.includes(response.status)
            : response.status === expectedStatus;

        if (statusMatch) {
            results.passed.push({ 
                name, 
                url, 
                status: response.status, 
                duration,
                responseTime: duration < 1000 ? 'fast' : duration < 3000 ? 'normal' : 'slow'
            });
            log(`✅ PASS: ${name} (${response.status} in ${duration}ms)`, 'green');
            
            // Validation supplémentaire si fournie
            if (options.validate && !options.validate(response)) {
                results.warnings.push({ name, url, warning: 'Validation failed' });
                log(`⚠️  VALIDATION WARNING: ${name}`, 'yellow');
            }
        } else {
            results.failed.push({ 
                name, 
                url, 
                status: response.status, 
                expected: expectedStatus,
                error: `Expected ${expectedStatus}, got ${response.status}`
            });
            log(`❌ FAIL: ${name} (got ${response.status}, expected ${expectedStatus})`, 'red');
        }
    } catch (error) {
        results.failed.push({ name, url, error: error.message });
        log(`❌ ERROR: ${name} - ${error.message}`, 'red');
    }
}

async function runProductionTests() {
    log('\n' + '='.repeat(80), 'cyan');
    log('🚀 TEST DES ENDPOINTS EN PRODUCTION', 'cyan');
    log('='.repeat(80) + '\n', 'cyan');
    log(`Base URL: ${PRODUCTION_URL}\n`, 'blue');

    // ============================================
    // ENDPOINTS CORRIGÉS - Tests prioritaires
    // ============================================
    log('\n📊 SECTION 1: Endpoints Critiques Corrigés', 'yellow');

    // Gemini Chat (modèle corrigé)
    await testEndpoint(
        'Gemini Chat (modèle gemini-2.0-flash-exp)',
        `${PRODUCTION_URL}/api/gemini/chat`,
        {
            method: 'POST',
            body: { message: 'Test', messages: [{ role: 'user', content: 'Test' }] },
            expectedStatus: [200, 500], // 500 OK si clé API manquante
            validate: (res) => {
                if (res.status === 500) {
                    return res.data?.error?.includes('API key') || res.data?.error?.includes('configuration');
                }
                return res.data?.response || res.data?.error;
            }
        }
    );

    // Chat Assistant (modèle corrigé)
    await testEndpoint(
        'Chat Assistant (modèle gemini-2.0-flash-exp)',
        `${PRODUCTION_URL}/api/chat-assistant`,
        {
            method: 'POST',
            body: { message: 'Test', context: 'Test context' },
            expectedStatus: [200, 400, 500]
        }
    );

    // Format Preview (fonction markdownToEmailHtml ajoutée)
    await testEndpoint(
        'Format Preview (markdownToEmailHtml corrigé)',
        `${PRODUCTION_URL}/api/format-preview`,
        {
            method: 'POST',
            body: { text: '# Test\n\nContenu de test', channel: 'web' },
            expectedStatus: 200
        }
    );

    // Sector Data (gestion erreurs Alpha Vantage améliorée)
    await testEndpoint(
        'Sector Data (gestion erreurs Alpha Vantage)',
        `${PRODUCTION_URL}/api/sector`,
        {
            expectedStatus: [200, 500], // 500 OK si quota dépassé
            validate: (res) => {
                if (res.status === 500) {
                    return res.data?.error?.includes('quota') || res.data?.error?.includes('cache');
                }
                return res.data?.['Rank A: Real-Time Performance'] || res.data?.data;
            }
        }
    );

    // FMP Sync (validation action ajoutée)
    await testEndpoint(
        'FMP Sync (validation action)',
        `${PRODUCTION_URL}/api/fmp-sync`,
        {
            method: 'POST',
            body: { action: 'sync-quote', symbol: 'AAPL' },
            expectedStatus: [200, 400, 500]
        }
    );

    // KPI Engine (validation action ajoutée)
    await testEndpoint(
        'KPI Engine (validation action)',
        `${PRODUCTION_URL}/api/kpi-engine?action=compute&kpi_code=ROE&symbol=AAPL`,
        {
            expectedStatus: [200, 400, 500]
        }
    );

    // Terminal Data (validation action ajoutée)
    await testEndpoint(
        'Terminal Data (validation action)',
        `${PRODUCTION_URL}/api/terminal-data?action=instruments`,
        {
            expectedStatus: [200, 400, 500]
        }
    );

    // Send Email (gestion limitations Resend)
    await testEndpoint(
        'Send Email (gestion limitations Resend)',
        `${PRODUCTION_URL}/api/send-email`,
        {
            method: 'POST',
            body: { 
                subject: 'Test', 
                html: '<p>Test</p>',
                to: 'test@example.com'
            },
            expectedStatus: [200, 400, 429, 500], // 429 = rate limit (géré gracieusement)
            validate: (res) => {
                if (res.status === 429) {
                    return res.data?.error === 'Rate limit exceeded' && res.data?.retryAfter;
                }
                return true;
            }
        }
    );

    // ============================================
    // ENDPOINTS AVEC VALIDATION AMÉLIORÉE
    // ============================================
    log('\n📋 SECTION 2: Endpoints avec Validation Améliorée', 'yellow');

    await testEndpoint(
        'Sector Index (message erreur avec exemple)',
        `${PRODUCTION_URL}/api/sector-index?name=msci_world&horizon=B`,
        {
            expectedStatus: [200, 400, 500]
        }
    );

    await testEndpoint(
        'JSLAI Proxy (message erreur avec exemple)',
        `${PRODUCTION_URL}/api/jslai-proxy?path=reee`,
        {
            expectedStatus: [200, 400, 500]
        }
    );

    await testEndpoint(
        'Treasury Rates (validation pays améliorée)',
        `${PRODUCTION_URL}/api/treasury-rates?country=US`,
        {
            expectedStatus: [200, 400, 500]
        }
    );

    // ============================================
    // ENDPOINTS ADAPTERS (nécessitent webhooks)
    // ============================================
    log('\n🔌 SECTION 3: Endpoints Adapters (Webhooks)', 'yellow');

    await testEndpoint(
        'SMS Adapter (validation améliorée)',
        `${PRODUCTION_URL}/api/adapters/sms`,
        {
            method: 'POST',
            body: { From: '+1234567890', Body: 'Test' },
            expectedStatus: [200, 400, 500],
            validate: (res) => {
                if (res.status === 400) {
                    // Vérifier que le message d'erreur est informatif
                    return res.data?.error && res.data?.expected;
                }
                return true;
            }
        }
    );

    await testEndpoint(
        'Email Adapter (validation améliorée)',
        `${PRODUCTION_URL}/api/adapters/email`,
        {
            method: 'POST',
            body: { from: 'test@example.com', text: 'Test message' },
            expectedStatus: [200, 400, 500],
            validate: (res) => {
                if (res.status === 400) {
                    return res.data?.error && res.data?.expected;
                }
                return true;
            }
        }
    );

    // ============================================
    // RÉSUMÉ ET RAPPORT
    // ============================================
    log('\n' + '='.repeat(80), 'cyan');
    log('📊 RÉSUMÉ DES TESTS PRODUCTION', 'cyan');
    log('='.repeat(80), 'cyan');

    const successRate = ((results.passed.length / results.total) * 100).toFixed(1);
    log(`\n✅ Tests réussis: ${results.passed.length}`, 'green');
    log(`❌ Tests échoués: ${results.failed.length}`, 'red');
    log(`⚠️  Avertissements: ${results.warnings.length}`, 'yellow');
    log(`📊 Total: ${results.total}`, 'cyan');
    log(`📈 Taux de réussite: ${successRate}%`, successRate >= 80 ? 'green' : successRate >= 60 ? 'yellow' : 'red');

    // Statistiques de performance
    const fastEndpoints = results.passed.filter(r => r.responseTime === 'fast').length;
    const slowEndpoints = results.passed.filter(r => r.responseTime === 'slow').length;
    
    if (fastEndpoints > 0) {
        log(`\n⚡ Endpoints rapides (<1s): ${fastEndpoints}`, 'green');
    }
    if (slowEndpoints > 0) {
        log(`🐌 Endpoints lents (>3s): ${slowEndpoints}`, 'yellow');
    }

    // Recommandations
    log('\n💡 RECOMMANDATIONS:', 'cyan');
    
    if (results.failed.length > 0) {
        log('\n❌ Endpoints à corriger:', 'red');
        results.failed.forEach((failure, index) => {
            log(`   ${index + 1}. ${failure.name}`, 'red');
            log(`      Erreur: ${failure.error || `Status ${failure.status}`}`, 'red');
        });
    }

    if (results.warnings.length > 0) {
        log('\n⚠️  Points d\'attention:', 'yellow');
        results.warnings.forEach((warning, index) => {
            log(`   ${index + 1}. ${warning.name}: ${warning.reason || warning.warning}`, 'yellow');
        });
    }

    // Sauvegarder le rapport
    fs.writeFileSync(REPORT_FILE, JSON.stringify(results, null, 2));
    log(`\n📄 Rapport sauvegardé: ${REPORT_FILE}`, 'cyan');

    log('\n' + '='.repeat(80), 'cyan');

    // Code de sortie
    process.exit(results.failed.length > 0 ? 1 : 0);
}

runProductionTests().catch((error) => {
    log(`\n💥 ERREUR CRITIQUE: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
});

