/**
 * Test Reliable Product Type Detection
 * Tests multi-source detection strategy (FMP ETF endpoint + Yahoo Finance quoteType)
 */

import ProductTypeDetector from './lib/tools/product-type-detector.js';

const testCases = [
    { ticker: 'AAPL', expected: 'Common Stock' },
    { ticker: 'SPY', expected: 'ETF' },
    { ticker: 'QQQ', expected: 'ETF' },
    { ticker: 'AMAXX', expected: 'Mutual Fund' },
    { ticker: 'VFIAX', expected: 'Mutual Fund' },
    { ticker: 'VNQ', expected: 'ETF' },  // Vanguard Real Estate ETF
    { ticker: 'GOOGL', expected: 'Common Stock' },
    { ticker: '^GSPC', expected: 'Index' },  // S&P 500 Index
    { ticker: 'BTC-USD', expected: 'Cryptocurrency' },
];

async function testReliableProductDetection() {
    console.log('🧪 Testing Reliable Product Type Detection (Multi-Source Strategy)\n');
    console.log('═'.repeat(80));
    console.log('Sources: 1) FMP ETF endpoint, 2) Yahoo Finance quoteType, 3) Fallback');
    console.log('═'.repeat(80));

    const detector = new ProductTypeDetector();
    let successCount = 0;
    let failCount = 0;

    for (const testCase of testCases) {
        console.log(`\n📊 Testing: ${testCase.ticker}`);
        console.log('─'.repeat(80));

        try {
            const result = await detector.execute({ ticker: testCase.ticker });

            if (result.success && result.data) {
                const productType = result.data.product_type;
                const category = result.data.category;
                const confidence = result.data.confidence || result.metadata?.confidence || 'unknown';
                const source = result.metadata?.source || 'unknown';

                console.log(`✅ Success!`);
                console.log(`   Type détecté: ${productType}`);
                console.log(`   Catégorie: ${category}`);
                console.log(`   Confiance: ${confidence}`);
                console.log(`   Source: ${source}`);
                console.log(`   Attendu: ${testCase.expected}`);

                if (productType === testCase.expected || productType.includes(testCase.expected)) {
                    console.log(`   ✅ PASS - Type détecté correctement`);
                    successCount++;
                } else {
                    console.log(`   ⚠️ MISMATCH - Attendu: ${testCase.expected}, Reçu: ${productType}`);
                    failCount++;
                }

                // Display metadata if available
                if (result.data.metadata) {
                    console.log(`   Metadata:`, JSON.stringify(result.data.metadata, null, 2));
                }
            } else {
                console.log(`❌ Failed to detect type for ${testCase.ticker}`);
                console.log(`   Error: ${result.error || 'Unknown error'}`);
                failCount++;
            }
        } catch (error) {
            console.log(`❌ Error testing ${testCase.ticker}: ${error.message}`);
            failCount++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n' + '═'.repeat(80));
    console.log('📊 Test Results Summary');
    console.log('═'.repeat(80));
    console.log(`✅ Passed: ${successCount}/${testCases.length}`);
    console.log(`❌ Failed: ${failCount}/${testCases.length}`);
    console.log(`📈 Success Rate: ${((successCount / testCases.length) * 100).toFixed(1)}%`);
    console.log('\n');
}

// Run tests
testReliableProductDetection().catch(console.error);
