/**
 * Script de test pour diagnostiquer le batch endpoint
 * Teste l'endpoint /api/fmp-company-data-batch-sync avec des tickers réels
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'https://gobapps.com';

// Tickers de test (mélange de tickers majeurs et internationaux)
const TEST_TICKERS = [
    'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA',  // Tickers majeurs US
    'UNH', 'CSCO', 'JPM', 'JNJ', 'BAC',       // Autres tickers US
    'TD', 'BNS', 'CNR', 'MFC.TO',             // Tickers canadiens
    '0R2J.L', 'AMRQ.L', 'NSRGY',             // Tickers internationaux
    'BBDBN.MX', 'CNSWF', 'EBRZF'              // Tickers exotiques
];

async function testBatchEndpoint() {
    console.log('🧪 Test du batch endpoint /api/fmp-company-data-batch-sync\n');
    console.log(`📋 Tickers à tester: ${TEST_TICKERS.length}`);
    console.log(`   ${TEST_TICKERS.join(', ')}\n`);

    try {
        const symbolString = TEST_TICKERS.join(',');
        const url = `${API_BASE_URL}/api/fmp-company-data-batch-sync?symbols=${encodeURIComponent(symbolString)}&limit=50`;
        
        console.log(`🔍 URL: ${url.substring(0, 150)}...\n`);
        console.log('⏳ Appel en cours...\n');

        const startTime = Date.now();
        const response = await fetch(url);
        const duration = Date.now() - startTime;

        console.log(`📡 Réponse HTTP: ${response.status} ${response.statusText}`);
        console.log(`⏱️  Durée: ${duration}ms\n`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Erreur HTTP ${response.status}:`);
            console.error(errorText.substring(0, 500));
            return;
        }

        const batchData = await response.json();
        
        console.log('📦 Structure de la réponse:');
        console.log(`   - success: ${batchData.success}`);
        console.log(`   - results.length: ${batchData.results?.length || 0}`);
        console.log(`   - stats:`, batchData.stats || 'N/A');
        console.log('');

        if (batchData.success && batchData.results) {
            console.log('📊 Analyse des résultats:\n');
            
            const successCount = batchData.results.filter(r => r.success).length;
            const errorCount = batchData.results.filter(r => !r.success).length;
            const withDataCount = batchData.results.filter(r => r.success && r.data && r.data.data && r.data.data.length > 0).length;
            const withProfileOnlyCount = batchData.results.filter(r => r.success && r.data && (!r.data.data || r.data.data.length === 0)).length;

            console.log(`   ✅ Succès: ${successCount}`);
            console.log(`   ❌ Erreurs: ${errorCount}`);
            console.log(`   📈 Avec données historiques: ${withDataCount}`);
            console.log(`   📋 Profile uniquement: ${withProfileOnlyCount}\n`);

            console.log('🔍 Détails par ticker:\n');
            batchData.results.forEach((result, index) => {
                const symbol = result.symbol || 'UNKNOWN';
                const dataLength = result.data?.data?.length || 0;
                const hasInfo = !!result.data?.info;
                const currentPrice = result.data?.currentPrice || 0;
                
                if (result.success) {
                    if (dataLength > 0) {
                        console.log(`   ✅ ${symbol}: ${dataLength} années, prix: ${currentPrice.toFixed(2)}, info: ${hasInfo ? 'Oui' : 'Non'}`);
                    } else {
                        console.log(`   ⚠️  ${symbol}: Profile ${hasInfo ? 'trouvé' : 'manquant'}, ${dataLength} années, prix: ${currentPrice.toFixed(2)}`);
                    }
                } else {
                    console.log(`   ❌ ${symbol}: ${result.error || 'Erreur inconnue'}`);
                }
            });

            // Afficher un exemple de données pour le premier ticker avec données
            const firstWithData = batchData.results.find(r => r.success && r.data && r.data.data && r.data.data.length > 0);
            if (firstWithData) {
                console.log(`\n📋 Exemple de données pour ${firstWithData.symbol}:`);
                console.log(`   - Années: ${firstWithData.data.data.length}`);
                console.log(`   - Première année: ${firstWithData.data.data[0]?.year || 'N/A'}`);
                console.log(`   - Dernière année: ${firstWithData.data.data[firstWithData.data.data.length - 1]?.year || 'N/A'}`);
                console.log(`   - Info:`, {
                    name: firstWithData.data.info?.name || 'N/A',
                    sector: firstWithData.data.info?.sector || 'N/A',
                    exchange: firstWithData.data.info?.exchange || 'N/A'
                });
            }

            // Afficher un exemple de ticker sans données
            const firstWithoutData = batchData.results.find(r => r.success && r.data && (!r.data.data || r.data.data.length === 0));
            if (firstWithoutData) {
                console.log(`\n⚠️  Exemple de ticker sans données historiques (${firstWithoutData.symbol}):`);
                console.log(`   - Success: ${firstWithoutData.success}`);
                console.log(`   - Has data object: ${!!firstWithoutData.data}`);
                console.log(`   - Data array length: ${firstWithoutData.data?.data?.length || 0}`);
                console.log(`   - Has info: ${!!firstWithoutData.data?.info}`);
                if (firstWithoutData.data?.info) {
                    console.log(`   - Info:`, {
                        name: firstWithoutData.data.info.name || 'N/A',
                        sector: firstWithoutData.data.info.sector || 'N/A',
                        exchange: firstWithoutData.data.info.exchange || 'N/A',
                        type: firstWithoutData.data.info.type || 'N/A'
                    });
                }
            }
        } else {
            console.error('❌ Réponse invalide:');
            console.error(JSON.stringify(batchData, null, 2).substring(0, 1000));
        }

    } catch (error) {
        console.error('❌ Erreur lors du test:');
        console.error(error.message);
        console.error(error.stack);
    }
}

// Exécuter le test
testBatchEndpoint().then(() => {
    console.log('\n✅ Test terminé');
    process.exit(0);
}).catch(error => {
    console.error('\n❌ Erreur fatale:');
    console.error(error);
    process.exit(1);
});

