/**
 * Test Product Type Detection
 * Vérifie que Emma détecte correctement les différents types de produits financiers
 */

import FMPFundamentalsTool from './lib/tools/fmp-fundamentals-tool.js';

const testCases = [
    { ticker: 'AAPL', expected: 'Common Stock' },
    { ticker: 'SPY', expected: 'ETF' },
    { ticker: 'QQQ', expected: 'ETF' },
    { ticker: 'AMAXX', expected: 'Mutual Fund' },
    { ticker: 'VFIAX', expected: 'Mutual Fund' },
    { ticker: 'VNQ', expected: 'REIT' },
    { ticker: 'GOOGL', expected: 'Common Stock' },
];

async function testProductTypeDetection() {
    console.log('🧪 Testing Product Type Detection\n');
    console.log('═'.repeat(80));

    const tool = new FMPFundamentalsTool();

    for (const testCase of testCases) {
        console.log(`\n📊 Testing: ${testCase.ticker}`);
        console.log('─'.repeat(80));

        try {
            const result = await tool.execute({ ticker: testCase.ticker });

            if (result.success && result.data) {
                const productType = result.data.product_type || 'Not Detected';
                const productCategory = result.data.product_category || 'N/A';
                const framework = result.data.analysis_framework || 'N/A';

                console.log(`✅ Success!`);
                console.log(`   Type détecté: ${productType}`);
                console.log(`   Catégorie: ${productCategory}`);
                console.log(`   Framework d'analyse: ${framework}`);
                console.log(`   Attendu: ${testCase.expected}`);

                if (productType === testCase.expected) {
                    console.log(`   ✅ PASS - Type détecté correctement`);
                } else {
                    console.log(`   ⚠️ MISMATCH - Attendu: ${testCase.expected}, Reçu: ${productType}`);
                }

                // Display additional data
                if (result.data.company_name) {
                    console.log(`   Nom: ${result.data.company_name}`);
                }
                if (result.data.is_etf !== undefined) {
                    console.log(`   is_etf flag: ${result.data.is_etf}`);
                }
            } else {
                console.log(`❌ Failed to fetch data for ${testCase.ticker}`);
                console.log(`   Error: ${result.error || 'Unknown error'}`);

                // For mutual funds, this is expected if they're not in FMP
                if (testCase.expected === 'Mutual Fund') {
                    console.log(`   ℹ️ Note: Mutual funds are often not available in FMP API`);
                    console.log(`   ℹ️ Emma should use Perplexity to search for this fund`);
                }
            }
        } catch (error) {
            console.log(`❌ Error testing ${testCase.ticker}: ${error.message}`);
        }
    }

    console.log('\n' + '═'.repeat(80));
    console.log('✅ Test suite completed\n');
}

// Run tests
testProductTypeDetection().catch(console.error);
