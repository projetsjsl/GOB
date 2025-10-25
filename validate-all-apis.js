#!/usr/bin/env node

/**
 * Comprehensive API Validation Script for GOB Financial Dashboard
 * Tests all critical API endpoints and reports their status
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// API endpoints to test
const API_TESTS = [
    // Core APIs
    {
        name: 'FMP Health Check',
        endpoint: '/api/fmp',
        critical: true,
        description: 'Financial Modeling Prep API status'
    },
    {
        name: 'Market Data - Auto Source',
        endpoint: '/api/marketdata?endpoint=quote&symbol=AAPL&source=auto',
        critical: true,
        description: 'Unified market data with fallback'
    },
    {
        name: 'Market Data - Batch',
        endpoint: '/api/marketdata/batch?symbols=AAPL,MSFT,GOOGL',
        critical: true,
        description: 'Batch market data fetching'
    },

    // AI Services
    {
        name: 'Gemini Chat',
        endpoint: '/api/gemini/chat',
        method: 'POST',
        body: { message: 'Test', history: [] },
        critical: true,
        description: 'Gemini AI chat endpoint'
    },
    {
        name: 'Emma Agent',
        endpoint: '/api/emma-agent',
        method: 'POST',
        body: { message: 'What is AAPL stock price?', history: [] },
        critical: true,
        description: 'Emma AI agent with function calling'
    },
    {
        name: 'Emma Briefing',
        endpoint: '/api/emma-briefing?type=morning',
        critical: false,
        description: 'AI-generated market briefing'
    },

    // Calendar APIs
    {
        name: 'Economic Calendar',
        endpoint: '/api/calendar-economic',
        critical: false,
        description: 'Economic events calendar'
    },
    {
        name: 'Earnings Calendar',
        endpoint: '/api/calendar-earnings',
        critical: false,
        description: 'Company earnings calendar'
    },
    {
        name: 'Dividends Calendar',
        endpoint: '/api/calendar-dividends',
        critical: false,
        description: 'Dividend payments calendar'
    },

    // Database/Storage
    {
        name: 'Supabase Watchlist',
        endpoint: '/api/supabase-watchlist?action=list',
        critical: false,
        description: 'User watchlist management'
    },

    // Configuration
    {
        name: 'Tickers Config',
        endpoint: '/api/tickers-config',
        critical: false,
        description: 'Ticker configuration'
    },
    {
        name: 'AI Services Info',
        endpoint: '/api/ai-services',
        critical: false,
        description: 'AI services configuration'
    }
];

let passedTests = 0;
let failedTests = 0;
let warningTests = 0;
let criticalFailures = [];

/**
 * Test a single API endpoint
 */
async function testAPI(test) {
    const startTime = Date.now();
    console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}📡 Testing: ${test.name}${colors.reset}`);
    console.log(`${colors.blue}   Endpoint: ${test.endpoint}${colors.reset}`);
    console.log(`   ${test.description}`);

    try {
        const options = {
            method: test.method || 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (test.body) {
            options.body = JSON.stringify(test.body);
        }

        const response = await fetch(`${API_BASE_URL}${test.endpoint}`, options);
        const contentType = response.headers.get('content-type');
        const duration = Date.now() - startTime;

        let data;
        try {
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                data = { rawResponse: text.substring(0, 200) };
            }
        } catch (parseError) {
            data = { error: 'Failed to parse response' };
        }

        if (response.ok) {
            console.log(`${colors.green}✅ SUCCESS${colors.reset} (${response.status}) - ${duration}ms`);

            // Show relevant data info
            if (data.source) console.log(`   Source: ${data.source}`);
            if (data.message) console.log(`   Message: ${data.message}`);
            if (data.data && Array.isArray(data.data)) {
                console.log(`   Data items: ${data.data.length}`);
            }
            if (data.error) {
                console.log(`${colors.yellow}   ⚠️  Response contains error: ${data.error}${colors.reset}`);
            }

            passedTests++;
            return { success: true, duration, status: response.status, data };
        } else {
            const statusIcon = response.status >= 500 ? '❌' : '⚠️';
            const statusColor = response.status >= 500 ? colors.red : colors.yellow;

            console.log(`${statusColor}${statusIcon} FAILED${colors.reset} (${response.status}) - ${duration}ms`);
            console.log(`   Error: ${data.error || data.message || 'Unknown error'}`);

            if (data.details) console.log(`   Details: ${data.details}`);
            if (data.missingKeys) console.log(`   Missing: ${data.missingKeys.join(', ')}`);

            if (test.critical) {
                criticalFailures.push({
                    name: test.name,
                    status: response.status,
                    error: data.error || data.message || 'Unknown error'
                });
                failedTests++;
            } else {
                warningTests++;
            }

            return { success: false, duration, status: response.status, error: data };
        }
    } catch (error) {
        const duration = Date.now() - startTime;
        console.log(`${colors.red}💥 EXCEPTION${colors.reset} - ${duration}ms`);
        console.log(`   ${error.message}`);

        if (error.cause) {
            console.log(`   Cause: ${error.cause.message}`);
        }

        if (test.critical) {
            criticalFailures.push({
                name: test.name,
                error: error.message
            });
            failedTests++;
        } else {
            warningTests++;
        }

        return { success: false, duration, error: error.message };
    }
}

/**
 * Run all API tests
 */
async function runAllTests() {
    console.log(`${colors.bright}${colors.blue}`);
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     GOB Financial Dashboard - API Validation Suite        ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(colors.reset);
    console.log(`Testing against: ${colors.bright}${API_BASE_URL}${colors.reset}`);
    console.log(`Total endpoints to test: ${API_TESTS.length}`);
    console.log(`Critical endpoints: ${API_TESTS.filter(t => t.critical).length}`);

    const results = [];

    for (const test of API_TESTS) {
        const result = await testAPI(test);
        results.push({ test, result });

        // Small delay between tests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Summary
    console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}\n📊 VALIDATION SUMMARY${colors.reset}\n`);

    const totalTests = passedTests + failedTests + warningTests;

    console.log(`${colors.green}✅ Passed: ${passedTests}/${totalTests}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${failedTests}/${totalTests}${colors.reset}`);
    console.log(`${colors.yellow}⚠️  Warnings: ${warningTests}/${totalTests}${colors.reset}`);

    if (criticalFailures.length > 0) {
        console.log(`\n${colors.red}${colors.bright}🚨 CRITICAL FAILURES:${colors.reset}`);
        criticalFailures.forEach((failure, i) => {
            console.log(`\n${i + 1}. ${colors.red}${failure.name}${colors.reset}`);
            console.log(`   Status: ${failure.status || 'N/A'}`);
            console.log(`   Error: ${failure.error}`);
        });
    }

    // Recommendations
    console.log(`\n${colors.bright}💡 RECOMMENDATIONS:${colors.reset}\n`);

    if (criticalFailures.some(f => f.error && f.error.includes('API key'))) {
        console.log('• Check environment variables in Vercel dashboard');
        console.log('  Required: GEMINI_API_KEY, FMP_API_KEY, GITHUB_TOKEN');
    }

    if (criticalFailures.some(f => f.status === 503)) {
        console.log('• Some services are unavailable - verify API key configuration');
    }

    if (criticalFailures.some(f => f.status === 500)) {
        console.log('• Internal server errors detected - check Vercel function logs');
    }

    if (failedTests === 0 && warningTests === 0) {
        console.log(`${colors.green}• All systems operational! 🎉${colors.reset}`);
    }

    // Performance stats
    const avgDuration = results.reduce((sum, r) => sum + (r.result.duration || 0), 0) / results.length;
    console.log(`\n${colors.bright}⚡ PERFORMANCE:${colors.reset}`);
    console.log(`Average response time: ${Math.round(avgDuration)}ms`);

    const slowEndpoints = results.filter(r => r.result.duration > 5000);
    if (slowEndpoints.length > 0) {
        console.log(`\n${colors.yellow}Slow endpoints (>5s):${colors.reset}`);
        slowEndpoints.forEach(r => {
            console.log(`  • ${r.test.name}: ${r.result.duration}ms`);
        });
    }

    console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    // Exit code
    process.exit(criticalFailures.length > 0 ? 1 : 0);
}

// Run tests
console.log('Starting API validation in 2 seconds...\n');
setTimeout(() => {
    runAllTests().catch(error => {
        console.error(`${colors.red}Fatal error:${colors.reset}`, error);
        process.exit(1);
    });
}, 2000);
