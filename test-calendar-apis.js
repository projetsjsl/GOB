/**
 * Local Test Script for Calendar APIs
 * Tests the logic without requiring Vercel deployment
 */

import https from 'https';

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

function log(color, symbol, message) {
    console.log(`${color}${symbol} ${message}${colors.reset}`);
}

async function testCalendarAPI(endpoint, name) {
    log(colors.cyan, '🧪', `Testing ${name}...`);

    return new Promise((resolve) => {
        const options = {
            hostname: 'gobapps.com',
            path: `/api/${endpoint}`,
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                const result = {
                    name,
                    endpoint,
                    status: res.statusCode,
                    success: res.statusCode === 200
                };

                if (res.statusCode === 200) {
                    try {
                        const json = JSON.parse(data);
                        result.data = json;
                        result.source = json.source;
                        result.dataLength = json.data ? json.data.length : 0;
                        result.fallbackTried = json.fallback_tried || [];
                    } catch (e) {
                        result.parseError = e.message;
                    }
                } else {
                    result.error = data.substring(0, 200);
                }

                resolve(result);
            });
        });

        req.on('error', (error) => {
            resolve({
                name,
                endpoint,
                status: 0,
                success: false,
                error: error.message
            });
        });

        req.setTimeout(10000, () => {
            req.destroy();
            resolve({
                name,
                endpoint,
                status: 0,
                success: false,
                error: 'Request timeout'
            });
        });

        req.end();
    });
}

async function runTests() {
    console.log('\n' + '='.repeat(70));
    log(colors.bright + colors.blue, '📅', 'CALENDAR APIs TEST SUITE');
    console.log('='.repeat(70) + '\n');

    const tests = [
        { endpoint: 'calendar-economic', name: 'Economic Calendar' },
        { endpoint: 'calendar-earnings', name: 'Earnings Calendar' },
        { endpoint: 'calendar-dividends', name: 'Dividends Calendar' }
    ];

    const results = [];

    // Run tests sequentially to avoid overwhelming the server
    for (const test of tests) {
        const result = await testCalendarAPI(test.endpoint, test.name);
        results.push(result);

        // Wait 500ms between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Print results
    console.log('\n' + '='.repeat(70));
    log(colors.bright + colors.blue, '📊', 'TEST RESULTS');
    console.log('='.repeat(70) + '\n');

    results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.name}`);
        console.log(`   Endpoint: /api/${result.endpoint}`);

        if (result.success) {
            log(colors.green, '✅', `Status: ${result.status} OK`);
            log(colors.green, '📦', `Data Source: ${result.source}`);
            log(colors.green, '📊', `Days of Data: ${result.dataLength}`);

            if (result.fallbackTried && result.fallbackTried.length > 0) {
                log(colors.yellow, '⚠️', `Fallbacks Tried: ${result.fallbackTried.join(', ')}`);
            }

            if (result.data && result.data.data && result.data.data.length > 0) {
                console.log(`   Sample Event: ${result.data.data[0].date}`);
                if (result.data.data[0].events && result.data.data[0].events.length > 0) {
                    console.log(`   - ${result.data.data[0].events[0].event}`);
                }
            }
        } else {
            log(colors.red, '❌', `Status: ${result.status || 'FAILED'}`);
            if (result.error) {
                log(colors.red, '⚠️', `Error: ${result.error.substring(0, 100)}`);
            }
        }
        console.log('');
    });

    // Summary
    console.log('='.repeat(70));
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    if (passed === results.length) {
        log(colors.green + colors.bright, '✅', `ALL TESTS PASSED (${passed}/${results.length})`);
    } else {
        log(colors.yellow + colors.bright, '⚠️', `TESTS: ${passed} passed, ${failed} failed`);
    }
    console.log('='.repeat(70) + '\n');

    // Diagnosis
    if (failed > 0) {
        console.log('🔍 DIAGNOSIS:\n');

        if (results.every(r => r.status === 404)) {
            log(colors.yellow, '⚠️', 'All endpoints returning 404 - Vercel deployment issue');
            console.log('\n   Possible causes:');
            console.log('   1. Serverless functions not deployed to Vercel');
            console.log('   2. Vercel build configuration issue');
            console.log('   3. Functions not recognized during deployment\n');

            console.log('   Recommended actions:');
            console.log('   1. Check Vercel deployment logs');
            console.log('   2. Verify vercel.json configuration');
            console.log('   3. Trigger manual redeploy: vercel --prod');
            console.log('   4. Check Vercel project settings in dashboard\n');
        } else if (results.some(r => r.status === 500)) {
            log(colors.red, '⚠️', 'Server errors detected - API configuration issue');
        } else if (results.some(r => r.status === 0)) {
            log(colors.red, '⚠️', 'Connection failures - Network or DNS issue');
        }
    }
}

// Run the tests
runTests().catch(error => {
    log(colors.red, '❌', `Test suite failed: ${error.message}`);
    process.exit(1);
});
