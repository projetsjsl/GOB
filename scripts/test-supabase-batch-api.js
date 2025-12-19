/**
 * Test de charge Supabase via l'API pour batch synchronization
 * Teste si Supabase peut gérer les écritures en batch via l'endpoint API
 */

const API_BASE_URL = process.env.API_BASE_URL || 'https://gobapps.com';

// Données de test simulées
function generateTestSnapshot(ticker, index) {
    const now = new Date();
    return {
        ticker: ticker.toUpperCase(),
        profile_id: ticker.toUpperCase(),
        annual_data: Array.from({ length: 25 }, (_, i) => ({
            year: 2025 - i,
            earningsPerShare: Math.random() * 10 + 1,
            cashFlowPerShare: Math.random() * 15 + 2,
            bookValuePerShare: Math.random() * 50 + 10,
            dividendPerShare: Math.random() * 2,
            priceHigh: Math.random() * 200 + 50,
            priceLow: Math.random() * 150 + 30,
            autoFetched: true
        })),
        assumptions: {
            growthRateEPS: Math.random() * 15 + 5,
            growthRateCF: Math.random() * 12 + 4,
            growthRateBV: Math.random() * 10 + 3,
            growthRateDiv: Math.random() * 8 + 2,
            targetPE: Math.random() * 20 + 15,
            targetPCF: Math.random() * 15 + 10,
            targetPBV: Math.random() * 3 + 1,
            targetYield: Math.random() * 0.05 + 0.02,
            currentPrice: Math.random() * 200 + 50,
            excludeEPS: false,
            excludeCF: false,
            excludeBV: false,
            excludeDIV: false
        },
        company_info: {
            symbol: ticker.toUpperCase(),
            name: `Test Company ${index}`,
            sector: 'Technology',
            industry: 'Software',
            exchange: 'NASDAQ',
            currency: 'USD',
            country: 'US'
        },
        is_current: true,
        auto_fetched: true,
        notes: `Test snapshot ${index}`
    };
}

/**
 * Test d'écriture en batch via l'API
 */
async function testBatchWriteAPI(batchSize, totalTickers) {
    console.log(`\n🧪 Test batch write API: ${batchSize} tickers par batch, ${totalTickers} total\n`);

    const tickers = Array.from({ length: totalTickers }, (_, i) => `TEST${i + 1}`);
    const batches = [];
    
    for (let i = 0; i < tickers.length; i += batchSize) {
        batches.push(tickers.slice(i, i + batchSize));
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    const timings = [];

    const startTime = Date.now();

    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const batchStartTime = Date.now();

        // Créer les snapshots pour ce batch
        const snapshots = batch.map((ticker, idx) => 
            generateTestSnapshot(ticker, i * batchSize + idx)
        );

        // Envoyer chaque snapshot via l'API (séquentiel pour ce test)
        let batchSuccess = 0;
        let batchErrors = 0;

        for (const snapshot of snapshots) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/finance-snapshots`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(snapshot)
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
                }

                batchSuccess++;
            } catch (error) {
                batchErrors++;
                errors.push({
                    ticker: snapshot.ticker,
                    error: error.message
                });
            }
        }

        const batchTime = Date.now() - batchStartTime;
        timings.push(batchTime);
        successCount += batchSuccess;
        errorCount += batchErrors;

        console.log(`✅ Batch ${i + 1}/${batches.length}: ${batchSuccess}/${batch.length} snapshots en ${batchTime}ms`);

        // Délai entre batches (simuler le comportement réel)
        if (i < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    const totalTime = Date.now() - startTime;

    // Statistiques
    console.log(`\n📊 Résultats:`);
    console.log(`   - Succès: ${successCount}/${totalTickers}`);
    console.log(`   - Erreurs: ${errorCount}`);
    console.log(`   - Temps total: ${totalTime}ms (~${(totalTime / 1000).toFixed(1)}s)`);
    console.log(`   - Temps moyen par batch: ${(timings.reduce((a, b) => a + b, 0) / timings.length).toFixed(0)}ms`);
    console.log(`   - Snapshots/seconde: ${(successCount / (totalTime / 1000)).toFixed(1)}`);

    if (errors.length > 0) {
        console.log(`\n❌ Erreurs (premières 5):`);
        errors.slice(0, 5).forEach(e => {
            console.log(`   - ${e.ticker}: ${e.error}`);
        });
        if (errors.length > 5) {
            console.log(`   ... et ${errors.length - 5} autres erreurs`);
        }
    }

    // Vérifier les limites Supabase via l'API
    console.log(`\n🔍 Vérifications:`);
    
    // Test de lecture
    try {
        const testTicker = tickers[0];
        const response = await fetch(`${API_BASE_URL}/api/finance-snapshots?ticker=${testTicker}&limit=1`);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`   ✅ Lecture API OK (${data.count || 0} snapshots pour ${testTicker})`);
        } else {
            console.log(`   ⚠️  Erreur lecture: ${response.status}`);
        }
    } catch (error) {
        console.log(`   ⚠️  Erreur test lecture: ${error.message}`);
    }

    return {
        success: errorCount === 0,
        successCount,
        errorCount,
        totalTime,
        errors,
        timings
    };
}

/**
 * Test de nettoyage via l'API (optionnel - nécessite endpoint DELETE)
 */
async function cleanupTestData() {
    console.log('\n🧹 Nettoyage des données de test...');
    console.log('   (Note: Le nettoyage nécessiterait un endpoint DELETE ou accès direct à Supabase)');
    console.log('   Les snapshots TEST* peuvent être supprimés manuellement si nécessaire');
}

/**
 * Tests progressifs
 */
async function runTests() {
    console.log('🚀 Tests de charge Supabase via API pour batch synchronization\n');
    console.log(`📍 API URL: ${API_BASE_URL}\n`);

    const testScenarios = [
        { batchSize: 10, totalTickers: 20, name: 'Test léger' },
        { batchSize: 20, totalTickers: 50, name: 'Test moyen' },
        { batchSize: 20, totalTickers: 100, name: 'Test lourd' }
    ];

    const results = [];

    for (const scenario of testScenarios) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📋 ${scenario.name}: ${scenario.totalTickers} tickers, batch ${scenario.batchSize}`);
        console.log('='.repeat(60));

        const result = await testBatchWriteAPI(scenario.batchSize, scenario.totalTickers);
        results.push({ ...scenario, ...result });

        // Pause entre tests
        if (scenario !== testScenarios[testScenarios.length - 1]) {
            console.log('\n⏸️  Pause de 3 secondes avant le prochain test...');
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }

    // Résumé final
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 RÉSUMÉ FINAL');
    console.log('='.repeat(60));

    results.forEach(r => {
        const status = r.success ? '✅' : '❌';
        const successRate = ((r.successCount / r.totalTickers) * 100).toFixed(1);
        console.log(`${status} ${r.name}: ${r.successCount}/${r.totalTickers} (${successRate}%) en ${(r.totalTime / 1000).toFixed(1)}s`);
    });

    // Analyse des performances
    console.log(`\n⚡ Performance:`);
    const avgThroughput = results.reduce((sum, r) => sum + (r.successCount / (r.totalTime / 1000)), 0) / results.length;
    console.log(`   - Débit moyen: ${avgThroughput.toFixed(1)} snapshots/seconde`);

    // Nettoyage
    await cleanupTestData();

    console.log('\n✅ Tests terminés!');
    console.log('\n💡 Recommandations:');
    console.log('   - Si erreurs < 5%: Supabase peut gérer la charge');
    console.log('   - Si erreurs > 10%: Considérer augmenter les délais ou réduire batch size');
    console.log('   - Si timeouts fréquents: Vérifier les limites de connexions Supabase');
}

// Exécuter les tests
runTests().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
});

