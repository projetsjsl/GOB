
const http = require('http');

const BASE_URL = 'http://localhost:3000/api/fmp-company-data';
const TICKERS = [
    'KMI',        // Previous issue (Growth 0)
    'BRK.A',      // High price
    'INVALID123', // Should 404
    'NULL',       // Edge case string
    'EURUSD',     // Forex?
    'AAPL'        // Benchmark
];

function fetchTicker(symbol) {
    return new Promise((resolve) => {
        const url = `${BASE_URL}?symbol=${symbol}`;
        console.log(`Testing ${symbol}...`);
        const start = Date.now();
        
        http.get(url, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                const duration = Date.now() - start;
                try {
                    const json = JSON.parse(data);
                    resolve({ symbol, status: res.statusCode, data: json, duration });
                } catch (e) {
                    resolve({ symbol, status: res.statusCode, error: 'JSON Parse Error', body: data.substring(0, 100), duration });
                }
            });
        }).on('error', (e) => {
             resolve({ symbol, status: 0, error: e.message, duration: Date.now() - start });
        });
    });
}

async function runTests() {
    console.log('--- STARTING DATA SAFETY STRESS TEST ---');
    
    const results = [];
    for (const t of TICKERS) {
        results.push(await fetchTicker(t));
    }
    
    console.log('\n--- RESULTS ---');
    results.forEach(r => {
        const icon = r.status === 200 || r.status === 404 ? '✅' : '❌';
        console.log(`${icon} ${r.symbol}: Status ${r.status} (${r.duration}ms)`);
        if (r.error) console.log(`   Error: ${r.error}`);
        if (r.data && r.data.analysis) {
             const assumptions = r.data.analysis.assumptions || {};
             console.log(`   Assumptions: Price=${assumptions.currentPrice}, GrowthEPS=${assumptions.growthRateEPS}`);
             
             // Verify no NaNs
             const hasNaN = JSON.stringify(r.data).includes('NaN');
             if (hasNaN) console.error(`   ⚠️ WARNING: NaN detected in response!`);
        }
    });
    console.log('--- TEST COMPLETE ---');
}

runTests();
