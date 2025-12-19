/**
 * Script de test pour vérifier l'optimisation du batch endpoint
 * Teste les différents scénarios selon les options de synchronisation
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'https://gobapps.com';

// Tickers de test (quelques tickers majeurs)
const TEST_TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];

async function testBatchWithKeyMetrics() {
    console.log('🧪 Test 1: Batch AVEC key metrics (syncData=true)\n');
    console.log(`📋 Tickers: ${TEST_TICKERS.join(', ')}\n`);

    try {
        const symbolString = TEST_TICKERS.join(',');
        const url = `${API_BASE_URL}/api/fmp-company-data-batch-sync?symbols=${encodeURIComponent(symbolString)}&limit=50&includeKeyMetrics=true`;
        
        console.log(`🔍 URL: ${url.substring(0, 120)}...\n`);

        const startTime = Date.now();
        const response = await fetch(url);
        const duration = Date.now() - startTime;

        console.log(`📡 Réponse HTTP: ${response.status} ${response.statusText}`);
        console.log(`⏱️  Durée: ${duration}ms\n`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Erreur: ${errorText.substring(0, 200)}`);
            return false;
        }

        const batchData = await response.json();
        
        const withDataCount = batchData.results?.filter(r => r.success && r.data && r.data.data && r.data.data.length > 0).length || 0;
        const withProfileOnlyCount = batchData.results?.filter(r => r.success && r.data && (!r.data.data || r.data.data.length === 0)).length || 0;

        console.log(`📊 Résultats:`);
        console.log(`   ✅ Succès: ${batchData.results?.filter(r => r.success).length || 0}`);
        console.log(`   📈 Avec données historiques: ${withDataCount}`);
        console.log(`   📋 Profile uniquement: ${withProfileOnlyCount}\n`);

        // Vérifier que les key metrics sont présentes
        const hasKeyMetrics = withDataCount > 0;
        if (hasKeyMetrics) {
            console.log(`✅ SUCCÈS: Les key metrics sont récupérées (${withDataCount} tickers avec données)`);
            
            // Afficher un exemple
            const firstWithData = batchData.results.find(r => r.success && r.data && r.data.data && r.data.data.length > 0);
            if (firstWithData) {
                console.log(`\n📋 Exemple (${firstWithData.symbol}):`);
                console.log(`   - Années de données: ${firstWithData.data.data.length}`);
                console.log(`   - Première année: ${firstWithData.data.data[0]?.year}`);
                console.log(`   - EPS: ${firstWithData.data.data[0]?.earningsPerShare || 'N/A'}`);
            }
            return true;
        } else {
            console.log(`⚠️  ATTENTION: Aucune key metric récupérée (${withDataCount} tickers avec données)`);
            return false;
        }

    } catch (error) {
        console.error(`❌ Erreur: ${error.message}`);
        return false;
    }
}

async function testBatchWithoutKeyMetrics() {
    console.log('\n\n🧪 Test 2: Batch SANS key metrics (syncData=false)\n');
    console.log(`📋 Tickers: ${TEST_TICKERS.join(', ')}\n`);

    try {
        const symbolString = TEST_TICKERS.join(',');
        const url = `${API_BASE_URL}/api/fmp-company-data-batch-sync?symbols=${encodeURIComponent(symbolString)}&limit=50&includeKeyMetrics=false`;
        
        console.log(`🔍 URL: ${url.substring(0, 120)}...\n`);

        const startTime = Date.now();
        const response = await fetch(url);
        const duration = Date.now() - startTime;

        console.log(`📡 Réponse HTTP: ${response.status} ${response.statusText}`);
        console.log(`⏱️  Durée: ${duration}ms\n`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Erreur: ${errorText.substring(0, 200)}`);
            return false;
        }

        const batchData = await response.json();
        
        const withDataCount = batchData.results?.filter(r => r.success && r.data && r.data.data && r.data.data.length > 0).length || 0;
        const withProfileOnlyCount = batchData.results?.filter(r => r.success && r.data && (!r.data.data || r.data.data.length === 0)).length || 0;

        console.log(`📊 Résultats:`);
        console.log(`   ✅ Succès: ${batchData.results?.filter(r => r.success).length || 0}`);
        console.log(`   📈 Avec données historiques: ${withDataCount}`);
        console.log(`   📋 Profile uniquement: ${withProfileOnlyCount}\n`);

        // Vérifier que les key metrics ne sont PAS présentes (ou très peu)
        if (withDataCount === 0 && withProfileOnlyCount > 0) {
            console.log(`✅ SUCCÈS: Les key metrics ne sont PAS récupérées (optimisation active)`);
            console.log(`   - Profiles récupérés: ${withProfileOnlyCount}`);
            console.log(`   - Données historiques: 0 (comme attendu)\n`);
            
            // Vérifier que les infos sont présentes
            const firstResult = batchData.results.find(r => r.success && r.data);
            if (firstResult && firstResult.data.info) {
                console.log(`📋 Exemple (${firstResult.symbol}):`);
                console.log(`   - Info présente: ✅`);
                console.log(`   - Nom: ${firstResult.data.info.name || 'N/A'}`);
                console.log(`   - Secteur: ${firstResult.data.info.sector || 'N/A'}`);
                console.log(`   - Prix actuel: ${firstResult.data.currentPrice || 'N/A'}`);
            }
            return true;
        } else {
            console.log(`⚠️  ATTENTION: Des key metrics ont été récupérées alors qu'elles ne devraient pas l'être`);
            return false;
        }

    } catch (error) {
        console.error(`❌ Erreur: ${error.message}`);
        return false;
    }
}

async function comparePerformance() {
    console.log('\n\n🧪 Test 3: Comparaison de performance\n');

    const testTickers = ['AAPL', 'MSFT', 'GOOGL'];

    // Test avec key metrics
    console.log('⏳ Test avec key metrics...');
    const startWith = Date.now();
    let durationWith = 0;
    try {
        const urlWith = `${API_BASE_URL}/api/fmp-company-data-batch-sync?symbols=${testTickers.join(',')}&limit=50&includeKeyMetrics=true`;
        const resWith = await fetch(urlWith);
        durationWith = Date.now() - startWith;
        console.log(`   Durée: ${durationWith}ms`);
    } catch (error) {
        console.log(`   Erreur: ${error.message}`);
    }

    // Test sans key metrics
    console.log('⏳ Test sans key metrics...');
    const startWithout = Date.now();
    try {
        const urlWithout = `${API_BASE_URL}/api/fmp-company-data-batch-sync?symbols=${testTickers.join(',')}&limit=50&includeKeyMetrics=false`;
        const resWithout = await fetch(urlWithout);
        const durationWithout = Date.now() - startWithout;
        console.log(`   Durée: ${durationWithout}ms`);
        
        if (durationWith > 0) {
            const improvement = ((durationWith - durationWithout) / durationWith * 100).toFixed(1);
            console.log(`\n📊 Amélioration: ${improvement}% plus rapide sans key metrics`);
        }
    } catch (error) {
        console.log(`   Erreur: ${error.message}`);
    }
}

async function runAllTests() {
    console.log('🚀 Début des tests d\'optimisation du batch endpoint\n');
    console.log('='.repeat(60) + '\n');

    const results = {
        test1: false,
        test2: false,
        test3: true // Performance test doesn't return a boolean
    };

    // Test 1: Avec key metrics
    results.test1 = await testBatchWithKeyMetrics();
    
    // Test 2: Sans key metrics
    results.test2 = await testBatchWithoutKeyMetrics();
    
    // Test 3: Comparaison de performance
    await comparePerformance();

    // Résumé
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ DES TESTS\n');
    console.log(`   Test 1 (Avec key metrics): ${results.test1 ? '✅ PASSÉ' : '❌ ÉCHOUÉ'}`);
    console.log(`   Test 2 (Sans key metrics): ${results.test2 ? '✅ PASSÉ' : '❌ ÉCHOUÉ'}`);
    console.log(`   Test 3 (Performance): ✅ EXÉCUTÉ\n`);

    const allPassed = results.test1 && results.test2;
    if (allPassed) {
        console.log('✅ Tous les tests sont passés !');
    } else {
        console.log('⚠️  Certains tests ont échoué');
    }

    return allPassed;
}

// Exécuter les tests
runAllTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
});

