/**
 * Test with very large snapshot data to identify size limits
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

// Generate very large annual data (20+ years with all fields)
function generateLargeAnnualData(years = 25) {
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
            dataSource: i < 5 ? 'fmp-verified' : (i < 10 ? 'fmp-adjusted' : 'manual'),
            isEstimate: i === 0,
            autoFetched: i < 10
        });
    }
    
    return data;
}

// Generate very large assumptions object
function generateLargeAssumptions() {
    return {
        growth: {
            shortTerm: 0.05,
            longTerm: 0.03,
            historical: [0.04, 0.05, 0.06, 0.04, 0.05],
            projected: [0.05, 0.04, 0.03, 0.03, 0.03]
        },
        multiples: {
            pe: 15,
            pcf: 12,
            pbv: 2.5,
            historical: {
                pe: [14, 15, 16, 15, 14],
                pcf: [11, 12, 13, 12, 11],
                pbv: [2.4, 2.5, 2.6, 2.5, 2.4]
            }
        },
        requiredReturn: 0.10,
        dividendPayoutRatio: 0.4,
        riskFreeRate: 0.03,
        marketRiskPremium: 0.07,
        beta: 1.2,
        notes: 'This is a test assumption object with many fields to simulate real-world complexity'
    };
}

// Generate very large company info
function generateLargeCompanyInfo(ticker) {
    return {
        name: `Test Company ${ticker} Inc.`,
        sector: 'Technology',
        industry: 'Software & Services',
        subIndustry: 'Application Software',
        marketCap: 1000000000,
        employees: 5000,
        headquarters: {
            city: 'San Francisco',
            state: 'CA',
            country: 'USA'
        },
        website: `https://www.${ticker.toLowerCase()}.com`,
        description: 'A leading technology company specializing in innovative software solutions for enterprise customers worldwide.',
        ceo: 'John Doe',
        founded: 2000,
        exchange: 'NASDAQ',
        currency: 'USD',
        tags: ['technology', 'software', 'enterprise', 'cloud', 'saas']
    };
}

// Generate very large sync_metadata
function generateLargeSyncMetadata(ticker) {
    return {
        timestamp: new Date().toISOString(),
        source: 'fmp',
        dataRetrieved: {
            annual_data: 25,
            key_metrics: true,
            company_profile: true,
            financial_statements: true,
            ratios: true
        },
        outliers: [
            { year: 2020, metric: 'earningsPerShare', value: 999, reason: 'one-time gain' },
            { year: 2018, metric: 'cashFlowPerShare', value: -50, reason: 'restructuring' }
        ],
        orangeData: {
            count: 5,
            years: [2023, 2022, 2021, 2020, 2019],
            metrics: ['earningsPerShare', 'cashFlowPerShare']
        },
        zeroData: {
            count: 2,
            years: [2015, 2014],
            reasons: ['data not available', 'company restructuring']
        },
        options: {
            replaceOrangeData: true,
            includeKeyMetrics: true,
            includeCompanyProfile: true,
            includeFinancialStatements: true,
            includeRatios: true,
            outlierDetection: true,
            dataValidation: true
        },
        duration: 2345,
        success: true,
        ticker,
        apiCalls: {
            total: 5,
            successful: 5,
            failed: 0,
            endpoints: ['key-metrics', 'company-profile', 'financial-statements', 'ratios', 'historical-data']
        },
        dataQuality: {
            completeness: 0.95,
            accuracy: 0.98,
            timeliness: 'current'
        }
    };
}

async function testLargeSnapshot(ticker) {
    const snapshotData = {
        ticker,
        annual_data: generateLargeAnnualData(25),
        assumptions: generateLargeAssumptions(),
        company_info: generateLargeCompanyInfo(ticker),
        sync_metadata: generateLargeSyncMetadata(ticker),
        is_current: true,
        auto_fetched: true
    };
    
    const dataSize = JSON.stringify(snapshotData).length;
    console.log(`\n📦 Testing LARGE snapshot for ${ticker}`);
    console.log(`   Data size: ${(dataSize / 1024).toFixed(2)}KB (${(dataSize / 1024 / 1024).toFixed(2)}MB)`);
    console.log(`   Annual data years: ${snapshotData.annual_data.length}`);
    
    try {
        const startTime = Date.now();
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(snapshotData),
            // Increase timeout for large payloads
            signal: AbortSignal.timeout(30000) // 30 seconds
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
            console.log(`   Error:`, JSON.stringify(responseData).substring(0, 500));
            return { success: false, ticker, error: responseData, status: response.status };
        }
    } catch (error) {
        console.log(`   ❌ EXCEPTION: ${error.message}`);
        if (error.name === 'AbortError') {
            console.log(`   ⏱️  Request timed out after 30 seconds`);
        }
        return { success: false, ticker, error: error.message };
    }
}

async function runTests() {
    console.log('🧪 Large Snapshot Size Tests');
    console.log(`📍 API URL: ${API_URL}`);
    console.log('='.repeat(60));
    
    const testTickers = ['LARGE1', 'LARGE2', 'LARGE3'];
    const results = [];
    
    for (const ticker of testTickers) {
        const result = await testLargeSnapshot(ticker);
        results.push(result);
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 LARGE SNAPSHOT TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${passed}/${testTickers.length}`);
    console.log(`❌ Failed: ${failed}/${testTickers.length}`);
    
    if (passed > 0) {
        const avgSize = results
            .filter(r => r.success && r.dataSize)
            .reduce((sum, r) => sum + r.dataSize, 0) / passed;
        const avgDuration = results
            .filter(r => r.success && r.duration)
            .reduce((sum, r) => sum + r.duration, 0) / passed;
        console.log(`\n📊 Average data size: ${(avgSize / 1024).toFixed(2)}KB`);
        console.log(`⏱️  Average duration: ${avgDuration.toFixed(0)}ms`);
    }
}

runTests()
    .then(() => {
        console.log('\n✅ Large snapshot tests completed');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Test error:', error);
        process.exit(1);
    });

