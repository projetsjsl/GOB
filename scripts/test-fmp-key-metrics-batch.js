/**
 * Test pour vérifier si FMP supporte les batch requests pour key-metrics
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const FMP_KEY = process.env.FMP_API_KEY || process.env.FMP_KEY;
const FMP_BASE = 'https://financialmodelingprep.com/api/v3';

async function testKeyMetricsBatch() {
    console.log('🧪 Test des batch requests FMP pour key-metrics\n');

    if (!FMP_KEY) {
        console.error('❌ FMP_API_KEY non configurée');
        process.exit(1);
    }

    const testSymbols = ['AAPL', 'MSFT', 'GOOGL'];

    // Test 1: Batch request (plusieurs symboles séparés par virgule)
    console.log('📦 Test 1: Batch request (AAPL,MSFT,GOOGL)');
    try {
        const batchUrl = `${FMP_BASE}/key-metrics/${testSymbols.join(',')}?period=annual&limit=30&apikey=${FMP_KEY}`;
        console.log(`   URL: ${batchUrl.substring(0, 100)}...`);
        
        const batchRes = await fetch(batchUrl);
        console.log(`   Status: ${batchRes.status} ${batchRes.statusText}`);
        
        if (batchRes.ok) {
            const batchData = await batchRes.json();
            console.log(`   Type de réponse: ${Array.isArray(batchData) ? 'Array' : typeof batchData}`);
            if (Array.isArray(batchData)) {
                console.log(`   Nombre de métriques: ${batchData.length}`);
                if (batchData.length > 0) {
                    console.log(`   Premier élément:`, {
                        symbol: batchData[0].symbol,
                        date: batchData[0].date,
                        hasEarningsPerShare: !!batchData[0].earningsPerShare
                    });
                    
                    // Grouper par symbole
                    const bySymbol = {};
                    batchData.forEach(m => {
                        if (m.symbol) {
                            if (!bySymbol[m.symbol]) bySymbol[m.symbol] = [];
                            bySymbol[m.symbol].push(m);
                        }
                    });
                    console.log(`   Symboles trouvés: ${Object.keys(bySymbol).join(', ')}`);
                    Object.keys(bySymbol).forEach(symbol => {
                        console.log(`     - ${symbol}: ${bySymbol[symbol].length} métriques`);
                    });
                }
            } else {
                console.log(`   Réponse:`, JSON.stringify(batchData).substring(0, 200));
            }
        } else {
            const errorText = await batchRes.text();
            console.log(`   Erreur: ${errorText.substring(0, 200)}`);
        }
    } catch (error) {
        console.error(`   ❌ Erreur: ${error.message}`);
    }

    console.log('\n');

    // Test 2: Appel individuel pour comparaison
    console.log('📦 Test 2: Appel individuel (AAPL)');
    try {
        const individualUrl = `${FMP_BASE}/key-metrics/AAPL?period=annual&limit=30&apikey=${FMP_KEY}`;
        console.log(`   URL: ${individualUrl.substring(0, 100)}...`);
        
        const individualRes = await fetch(individualUrl);
        console.log(`   Status: ${individualRes.status} ${individualRes.statusText}`);
        
        if (individualRes.ok) {
            const individualData = await individualRes.json();
            console.log(`   Type de réponse: ${Array.isArray(individualData) ? 'Array' : typeof individualData}`);
            if (Array.isArray(individualData)) {
                console.log(`   Nombre de métriques: ${individualData.length}`);
                if (individualData.length > 0) {
                    console.log(`   Première métrique:`, {
                        symbol: individualData[0].symbol,
                        date: individualData[0].date,
                        earningsPerShare: individualData[0].earningsPerShare,
                        bookValuePerShare: individualData[0].bookValuePerShare
                    });
                }
            }
        } else {
            const errorText = await individualRes.text();
            console.log(`   Erreur: ${errorText.substring(0, 200)}`);
        }
    } catch (error) {
        console.error(`   ❌ Erreur: ${error.message}`);
    }
}

testKeyMetricsBatch().then(() => {
    console.log('\n✅ Test terminé');
    process.exit(0);
}).catch(error => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
});

