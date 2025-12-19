/**
 * Test bulk snapshot saving to simulate real sync scenario
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const API_BASE_URL = process.env.API_BASE_URL || 'https://gobapps.com';
const API_URL = `${API_BASE_URL}/api/finance-snapshots`;

// Generate realistic annual data (10 years)
function generateAnnualData(years = 10) {
    const data = [];
    const currentYear = new Date().getFullYear();
    
    for (let i = 0; i < years; i++) {
        const year = currentYear - i;
        data.push({
            year,
            priceHigh: 100 + Math.random() * 50,
            priceLow: 80 + Math.random() * 30,
            cashFlowPerShare: 5 + Math.random() * 3,
            dividendPerShare: 2 + Math.random() * 1,
            bookValuePerShare: 50 + Math.random() * 20,
            earningsPerShare: 3 + Math.random() * 2,
            dataSource: i < 3 ? 'fmp-verified' : (i < 6 ? 'fmp-adjusted' : 'manual'),
            isEstimate: i === 0
        });
    }
    
    return data;
}

// Generate realistic assumptions
function generateAssumptions() {
    return {
        growth: {
            shortTerm: 0.05,
            longTerm: 0.03
        },
        multiples: {
            pe: 15,
            pcf: 12,
            pbv: 2.5
        },
        requiredReturn: 0.10,
        dividendPayoutRatio: 0.4
    };
}

// Generate realistic company info
function generateCompanyInfo(ticker) {
    return {
        name: `Test Company ${ticker}`,
        sector: 'Technology',
        industry: 'Software',
        marketCap: 1000000000,
        employees: 5000
    };
}

// Generate realistic sync_metadata
function generateSyncMetadata(ticker) {
    return {
        timestamp: new Date().toISOString(),
        source: 'fmp',
        dataRetrieved: {
            annual_data: 10,
            key_metrics: true,
            company_profile: true
        },
        outliers: [],
        orangeData: {
            count: 2,
            years: [2023, 2022]
        },
        options: {
            replaceOrangeData: true,
            includeKeyMetrics: true,
            includeCompanyProfile: true
        },
        duration: 1234,
        success: true,
        ticker
    };
}

async function testBulkSnapshot(ticker, concurrent = false) {
    const snapshotData = {
        ticker,
        annual_data: generateAnnualData(10),
        assumptions: generateAssumptions(),
        company_info: generateCompanyInfo(ticker),
        sync_metadata: generateSyncMetadata(ticker),
        is_current: true,
        auto_fetched: true
    };
    
    const dataSize = JSON.stringify(snapshotData).length;
    console.log(`\n📦 Testing snapshot for ${ticker}`);
    console.log(`   Data size: ${(dataSize / 1024).toFixed(2)}KB`);
    console.log(`   Annual data years: ${snapshotData.annual_data.length}`);
    
    try {
        const startTime = Date.now();
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(snapshotData)
        });
        
        const duration = Date.now() - startTime;
        const responseText = await response.text();
        
        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (e) {
            responseData = { raw: responseText.substring(0, 500) };
        }
        
        if (response.ok) {
            console.log(`   ✅ SUCCESS (${response.status}) - ${duration}ms`);
            console.log(`   📝 Snapshot ID: ${responseData.id}`);
            console.log(`   📊 Version: ${responseData.version}`);
            return { success: true, ticker, duration, dataSize };
        } else {
            console.log(`   ❌ FAILED (${response.status}) - ${duration}ms`);
            console.log(`   Error:`, JSON.stringify(responseData).substring(0, 300));
            return { success: false, ticker, error: responseData, status: response.status };
        }
    } catch (error) {
        console.log(`   ❌ EXCEPTION: ${error.message}`);
        return { success: false, ticker, error: error.message };
    }
}

async function testConcurrentSnapshots(tickers, concurrent = false) {
    console.log(`\n🚀 Testing ${concurrent ? 'CONCURRENT' : 'SEQUENTIAL'} snapshot saves`);
    console.log(`   Tickers: ${tickers.join(', ')}`);
    console.log('='.repeat(60));
    
    const results = [];
    
    if (concurrent) {
        // Test concurrent saves (simulating bulk sync)
        const promises = tickers.map(ticker => testBulkSnapshot(ticker, true));
        const concurrentResults = await Promise.all(promises);
        results.push(...concurrentResults);
    } else {
        // Test sequential saves
        for (const ticker of tickers) {
            const result = await testBulkSnapshot(ticker, false);
            results.push(result);
            // Small delay between sequential saves
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }
    
    // Summary
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 BULK TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${passed}/${tickers.length}`);
    console.log(`❌ Failed: ${failed}/${tickers.length}`);
    
    if (failed > 0) {
        console.log('\n❌ Failed Tickers:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`   - ${r.ticker}: ${r.error?.error || r.error}`);
        });
    }
    
    if (passed > 0) {
        const avgDuration = results
            .filter(r => r.success && r.duration)
            .reduce((sum, r) => sum + r.duration, 0) / passed;
        console.log(`\n⏱️  Average duration: ${avgDuration.toFixed(0)}ms`);
    }
    
    return results;
}

async function runTests() {
    console.log('🧪 Finance Snapshots Bulk Save Tests');
    console.log(`📍 API URL: ${API_URL}`);
    
    // Test 1: Sequential saves (simulating normal sync)
    const sequentialTickers = ['BULK1', 'BULK2', 'BULK3', 'BULK4', 'BULK5'];
    await testConcurrentSnapshots(sequentialTickers, false);
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Concurrent saves (simulating bulk sync with multiple workers)
    const concurrentTickers = ['CONC1', 'CONC2', 'CONC3'];
    await testConcurrentSnapshots(concurrentTickers, true);
    
    // Test 3: Test with problematic tickers from real sync
    const problematicTickers = ['GOOGL', '0NHS.L', 'GIB-A.TO'];
    await testConcurrentSnapshots(problematicTickers, false);
}

runTests()
    .then(() => {
        console.log('\n✅ All tests completed');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Test error:', error);
        process.exit(1);
    });

