/**
 * Test script for finance-snapshots API
 * Tests various scenarios including edge cases
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const API_BASE_URL = process.env.API_BASE_URL || 'https://gobapps.com';
const API_URL = `${API_BASE_URL}/api/finance-snapshots`;

// Test data
const testCases = [
    {
        name: 'Simple snapshot with minimal data',
        data: {
            ticker: 'TEST1',
            annual_data: [
                {
                    year: 2024,
                    priceHigh: 100,
                    priceLow: 90,
                    cashFlowPerShare: 5,
                    dividendPerShare: 2,
                    bookValuePerShare: 50,
                    earningsPerShare: 3
                }
            ],
            assumptions: {},
            company_info: {}
        }
    },
    {
        name: 'Snapshot with dataSource field',
        data: {
            ticker: 'TEST2',
            annual_data: [
                {
                    year: 2024,
                    priceHigh: 100,
                    priceLow: 90,
                    cashFlowPerShare: 5,
                    dividendPerShare: 2,
                    bookValuePerShare: 50,
                    earningsPerShare: 3,
                    dataSource: 'fmp-verified'
                }
            ],
            assumptions: { growth: 0.1 },
            company_info: { name: 'Test Company' }
        }
    },
    {
        name: 'Snapshot with ticker containing dot (0NHS.L)',
        data: {
            ticker: '0NHS.L',
            annual_data: [
                {
                    year: 2024,
                    priceHigh: 100,
                    priceLow: 90,
                    cashFlowPerShare: 5,
                    dividendPerShare: 2,
                    bookValuePerShare: 50,
                    earningsPerShare: 3
                }
            ],
            assumptions: {},
            company_info: {}
        }
    },
    {
        name: 'Snapshot with sync_metadata',
        data: {
            ticker: 'TEST3',
            annual_data: [
                {
                    year: 2024,
                    priceHigh: 100,
                    priceLow: 90,
                    cashFlowPerShare: 5,
                    dividendPerShare: 2,
                    bookValuePerShare: 50,
                    earningsPerShare: 3
                }
            ],
            assumptions: {},
            company_info: {},
            sync_metadata: {
                timestamp: new Date().toISOString(),
                source: 'fmp',
                duration: 1234,
                success: true
            }
        }
    },
    {
        name: 'Snapshot with multiple years of data',
        data: {
            ticker: 'TEST4',
            annual_data: [
                {
                    year: 2024,
                    priceHigh: 100,
                    priceLow: 90,
                    cashFlowPerShare: 5,
                    dividendPerShare: 2,
                    bookValuePerShare: 50,
                    earningsPerShare: 3,
                    dataSource: 'fmp-verified'
                },
                {
                    year: 2023,
                    priceHigh: 95,
                    priceLow: 85,
                    cashFlowPerShare: 4.5,
                    dividendPerShare: 1.8,
                    bookValuePerShare: 48,
                    earningsPerShare: 2.8,
                    dataSource: 'fmp-adjusted'
                }
            ],
            assumptions: { growth: 0.1, pe: 15 },
            company_info: { name: 'Test Company', sector: 'Tech' }
        }
    },
    {
        name: 'Snapshot with invalid numeric values (should be cleaned)',
        data: {
            ticker: 'TEST5',
            annual_data: [
                {
                    year: 2024,
                    priceHigh: NaN,
                    priceLow: Infinity,
                    cashFlowPerShare: null,
                    dividendPerShare: undefined,
                    bookValuePerShare: 'invalid',
                    earningsPerShare: -999
                }
            ],
            assumptions: {},
            company_info: {}
        }
    }
];

async function testSnapshot(testCase) {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`   Ticker: ${testCase.data.ticker}`);
    
    try {
        const startTime = Date.now();
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testCase.data)
        });
        
        const duration = Date.now() - startTime;
        const responseText = await response.text();
        
        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (e) {
            responseData = { raw: responseText };
        }
        
        if (response.ok) {
            console.log(`   ✅ SUCCESS (${response.status}) - ${duration}ms`);
            if (responseData.id) {
                console.log(`   📝 Snapshot ID: ${responseData.id}`);
                console.log(`   📊 Version: ${responseData.version}`);
            }
            return { success: true, testCase: testCase.name, data: responseData };
        } else {
            console.log(`   ❌ FAILED (${response.status}) - ${duration}ms`);
            console.log(`   Error:`, responseData);
            return { success: false, testCase: testCase.name, error: responseData, status: response.status };
        }
    } catch (error) {
        console.log(`   ❌ EXCEPTION: ${error.message}`);
        return { success: false, testCase: testCase.name, error: error.message };
    }
}

async function testGetSnapshot(ticker) {
    console.log(`\n🔍 Testing GET snapshot for ${ticker}`);
    try {
        const response = await fetch(`${API_URL}?ticker=${ticker}`);
        const data = await response.json();
        
        if (response.ok) {
            console.log(`   ✅ Found ${data.snapshots?.length || 0} snapshot(s)`);
            return { success: true, data };
        } else {
            console.log(`   ❌ Failed: ${data.error}`);
            return { success: false, error: data };
        }
    } catch (error) {
        console.log(`   ❌ Exception: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function runAllTests() {
    console.log('🚀 Starting Finance Snapshots API Tests');
    console.log(`📍 API URL: ${API_URL}`);
    console.log('='.repeat(60));
    
    const results = {
        passed: [],
        failed: []
    };
    
    // Run all test cases
    for (const testCase of testCases) {
        const result = await testSnapshot(testCase);
        if (result.success) {
            results.passed.push(result);
        } else {
            results.failed.push(result);
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Test GET for one of the successful inserts
    if (results.passed.length > 0) {
        const firstPassed = results.passed[0];
        if (firstPassed.data?.ticker) {
            await testGetSnapshot(firstPassed.data.ticker);
        }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${results.passed.length}/${testCases.length}`);
    console.log(`❌ Failed: ${results.failed.length}/${testCases.length}`);
    
    if (results.failed.length > 0) {
        console.log('\n❌ Failed Tests:');
        results.failed.forEach(f => {
            console.log(`   - ${f.testCase}`);
            if (f.error) {
                console.log(`     Error: ${JSON.stringify(f.error).substring(0, 200)}`);
            }
        });
    }
    
    return results;
}

// Run tests
runAllTests()
    .then(results => {
        process.exit(results.failed.length > 0 ? 1 : 0);
    })
    .catch(error => {
        console.error('❌ Test runner error:', error);
        process.exit(1);
    });

