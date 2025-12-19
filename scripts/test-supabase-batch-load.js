/**
 * Test de charge Supabase pour batch synchronization
 * Simule la charge de synchronisation en masse pour vérifier si Supabase peut gérer
 */

import { createClient } from '@supabase/supabase-js';

// Les variables d'environnement doivent être définies dans l'environnement
// ou via .env.local à la racine du projet
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 
                     process.env.SUPABASE_URL || 
                     process.env.VITE_SUPABASE_URL;

const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                             process.env.SUPABASE_SERVICE_KEY ||
                             process.env.VITE_SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Variables d\'environnement Supabase manquantes');
    console.error('   Besoin de: SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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
        snapshot_date: now.toISOString(),
        notes: `Test snapshot ${index}`
    };
}

/**
 * Test d'écriture en batch dans Supabase
 */
async function testBatchWrite(batchSize, totalTickers) {
    console.log(`\n🧪 Test batch write: ${batchSize} tickers par batch, ${totalTickers} total\n`);

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

        try {
            // 1. Unmark old snapshots
            const tickerList = batch.map(t => t.toUpperCase());
            const { error: updateError } = await supabase
                .from('finance_pro_snapshots')
                .update({ is_current: false })
                .in('ticker', tickerList);

            if (updateError) {
                throw new Error(`Update error: ${updateError.message}`);
            }

            // 2. Insert new snapshots
            const snapshots = batch.map((ticker, idx) => 
                generateTestSnapshot(ticker, i * batchSize + idx)
            );

            const { error: insertError, data } = await supabase
                .from('finance_pro_snapshots')
                .insert(snapshots)
                .select();

            if (insertError) {
                throw new Error(`Insert error: ${insertError.message}`);
            }

            const batchTime = Date.now() - batchStartTime;
            timings.push(batchTime);
            successCount += batch.length;

            console.log(`✅ Batch ${i + 1}/${batches.length}: ${batch.length} snapshots en ${batchTime}ms`);

            // Délai entre batches (simuler le comportement réel)
            if (i < batches.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

        } catch (error) {
            const batchTime = Date.now() - batchStartTime;
            errorCount += batch.length;
            errors.push({
                batch: i + 1,
                tickers: batch,
                error: error.message,
                time: batchTime
            });
            console.error(`❌ Batch ${i + 1}/${batches.length} échoué: ${error.message}`);
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
        console.log(`\n❌ Erreurs:`);
        errors.slice(0, 5).forEach(e => {
            console.log(`   - Batch ${e.batch}: ${e.error}`);
        });
        if (errors.length > 5) {
            console.log(`   ... et ${errors.length - 5} autres erreurs`);
        }
    }

    // Vérifier les limites Supabase
    console.log(`\n🔍 Vérifications Supabase:`);
    
    // Test de connexion
    const { error: testError } = await supabase
        .from('finance_pro_snapshots')
        .select('ticker')
        .limit(1);
    
    if (testError) {
        console.log(`   ⚠️  Erreur de connexion: ${testError.message}`);
    } else {
        console.log(`   ✅ Connexion OK`);
    }

    // Vérifier le nombre de snapshots créés
    const { count, error: countError } = await supabase
        .from('finance_pro_snapshots')
        .select('*', { count: 'exact', head: true })
        .eq('is_current', true)
        .in('ticker', tickers.map(t => t.toUpperCase()));

    if (!countError) {
        console.log(`   ✅ Snapshots actuels vérifiés: ${count}`);
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
 * Test de nettoyage (supprimer les données de test)
 */
async function cleanupTestData() {
    console.log('\n🧹 Nettoyage des données de test...');
    
    const { error } = await supabase
        .from('finance_pro_snapshots')
        .delete()
        .like('ticker', 'TEST%');

    if (error) {
        console.error(`❌ Erreur nettoyage: ${error.message}`);
    } else {
        console.log('✅ Données de test supprimées');
    }
}

/**
 * Tests progressifs
 */
async function runTests() {
    console.log('🚀 Tests de charge Supabase pour batch synchronization\n');
    console.log(`📍 Supabase URL: ${SUPABASE_URL.substring(0, 30)}...\n`);

    const testScenarios = [
        { batchSize: 10, totalTickers: 50, name: 'Test léger' },
        { batchSize: 20, totalTickers: 100, name: 'Test moyen' },
        { batchSize: 20, totalTickers: 500, name: 'Test lourd' }
    ];

    const results = [];

    for (const scenario of testScenarios) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📋 ${scenario.name}: ${scenario.totalTickers} tickers, batch ${scenario.batchSize}`);
        console.log('='.repeat(60));

        const result = await testBatchWrite(scenario.batchSize, scenario.totalTickers);
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
        console.log(`${status} ${r.name}: ${r.successCount}/${r.totalTickers} succès en ${(r.totalTime / 1000).toFixed(1)}s`);
    });

    // Nettoyage
    await cleanupTestData();

    console.log('\n✅ Tests terminés!');
}

// Exécuter les tests
runTests().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
});

