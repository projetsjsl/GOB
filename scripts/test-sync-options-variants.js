/**
 * Test des différentes variantes d'options de synchronisation
 * Simule les comportements avec différentes combinaisons d'options
 */

const API_BASE_URL = process.env.API_BASE_URL || 'https://gobapps.com';

// Ticker de test avec données existantes
const TEST_TICKER = 'AAPL';

// Scénarios de test
const TEST_SCENARIOS = [
    {
        name: '1. Sync complet (Supabase + FMP, données oranges conservées)',
        options: {
            saveBeforeSync: true,
            replaceOrangeData: false,
            syncAllTickers: false,
            syncData: true,
            syncAssumptions: true,
            syncInfo: true,
            forceReplace: false,
            syncOnlyNewYears: false,
            syncOnlyMissingMetrics: false,
            preserveExclusions: true,
            recalculateOutliers: true,
            updateCurrentPrice: true,
            syncValueLineMetrics: true
        },
        description: 'Synchronisation complète avec préservation des données manuelles (orange)'
    },
    {
        name: '2. Sync complet (données oranges remplacées par FMP)',
        options: {
            saveBeforeSync: true,
            replaceOrangeData: true, // ⚠️ Remplace les données oranges
            syncAllTickers: false,
            syncData: true,
            syncAssumptions: true,
            syncInfo: true,
            forceReplace: false,
            syncOnlyNewYears: false,
            syncOnlyMissingMetrics: false,
            preserveExclusions: false,
            recalculateOutliers: true,
            updateCurrentPrice: true,
            syncValueLineMetrics: true
        },
        description: 'Synchronisation complète avec remplacement des données manuelles'
    },
    {
        name: '3. Supabase seulement (pas de sync FMP)',
        options: {
            saveBeforeSync: false,
            replaceOrangeData: false,
            syncAllTickers: false,
            syncData: false, // ❌ Pas de sync données
            syncAssumptions: false, // ❌ Pas de sync assumptions
            syncInfo: false, // ❌ Pas de sync info
            forceReplace: false,
            syncOnlyNewYears: false,
            syncOnlyMissingMetrics: false,
            preserveExclusions: true,
            recalculateOutliers: false,
            updateCurrentPrice: false,
            syncValueLineMetrics: true // ✅ Seulement ValueLine depuis Supabase
        },
        description: 'Charge seulement depuis Supabase, pas de sync FMP'
    },
    {
        name: '4. Sync seulement nouvelles années',
        options: {
            saveBeforeSync: true,
            replaceOrangeData: false,
            syncAllTickers: false,
            syncData: true,
            syncAssumptions: true,
            syncInfo: true,
            forceReplace: false,
            syncOnlyNewYears: true, // ✅ Seulement nouvelles années
            syncOnlyMissingMetrics: false,
            preserveExclusions: true,
            recalculateOutliers: true,
            updateCurrentPrice: true,
            syncValueLineMetrics: true
        },
        description: 'Ajoute seulement les années manquantes, préserve l\'existant'
    },
    {
        name: '5. Sync seulement métriques manquantes',
        options: {
            saveBeforeSync: true,
            replaceOrangeData: false,
            syncAllTickers: false,
            syncData: true,
            syncAssumptions: true,
            syncInfo: true,
            forceReplace: false,
            syncOnlyNewYears: false,
            syncOnlyMissingMetrics: true, // ✅ Remplit seulement les champs vides
            preserveExclusions: true,
            recalculateOutliers: true,
            updateCurrentPrice: true,
            syncValueLineMetrics: true
        },
        description: 'Remplit seulement les métriques à 0/null, préserve le reste'
    },
    {
        name: '6. Force replace (remplace tout, même données manuelles)',
        options: {
            saveBeforeSync: true,
            replaceOrangeData: true,
            syncAllTickers: false,
            syncData: true,
            syncAssumptions: true,
            syncInfo: true,
            forceReplace: true, // ⚠️ Remplace tout
            syncOnlyNewYears: false,
            syncOnlyMissingMetrics: false,
            preserveExclusions: false,
            recalculateOutliers: true,
            updateCurrentPrice: true,
            syncValueLineMetrics: true
        },
        description: 'Remplace toutes les données, même celles marquées comme manuelles'
    },
    {
        name: '7. Sync minimal (données seulement, pas d\'assumptions)',
        options: {
            saveBeforeSync: false,
            replaceOrangeData: false,
            syncAllTickers: false,
            syncData: true, // ✅ Seulement données
            syncAssumptions: false, // ❌ Pas d'assumptions
            syncInfo: false, // ❌ Pas d'info
            forceReplace: false,
            syncOnlyNewYears: false,
            syncOnlyMissingMetrics: false,
            preserveExclusions: true,
            recalculateOutliers: false,
            updateCurrentPrice: false,
            syncValueLineMetrics: false
        },
        description: 'Synchronise seulement les données historiques, préserve assumptions et info'
    },
    {
        name: '8. Sync assumptions seulement (recalcul cases oranges)',
        options: {
            saveBeforeSync: false,
            replaceOrangeData: true, // ✅ Recalcule assumptions
            syncAllTickers: false,
            syncData: false, // ❌ Pas de données
            syncAssumptions: true, // ✅ Seulement assumptions
            syncInfo: false,
            forceReplace: false,
            syncOnlyNewYears: false,
            syncOnlyMissingMetrics: false,
            preserveExclusions: true,
            recalculateOutliers: true,
            updateCurrentPrice: true,
            syncValueLineMetrics: false
        },
        description: 'Recalcule seulement les assumptions (cases oranges) depuis les données existantes'
    }
];

/**
 * Simule une synchronisation avec des options spécifiques
 */
async function testSyncOptions(ticker, options, scenarioName) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🧪 ${scenarioName}`);
    console.log('='.repeat(70));
    console.log(`📋 Description: ${TEST_SCENARIOS.find(s => s.name === scenarioName)?.description || ''}\n`);

    // Afficher les options actives
    const activeOptions = Object.entries(options)
        .filter(([key, value]) => value === true)
        .map(([key]) => key);
    
    const inactiveOptions = Object.entries(options)
        .filter(([key, value]) => value === false)
        .map(([key]) => key);

    console.log('✅ Options activées:');
    activeOptions.forEach(opt => {
        console.log(`   - ${opt}`);
    });

    if (inactiveOptions.length > 0) {
        console.log('\n❌ Options désactivées:');
        inactiveOptions.slice(0, 5).forEach(opt => {
            console.log(`   - ${opt}`);
        });
        if (inactiveOptions.length > 5) {
            console.log(`   ... et ${inactiveOptions.length - 5} autres`);
        }
    }

    console.log('\n📡 Simulation de la synchronisation...\n');

    const startTime = Date.now();
    const steps = [];

    // Étape 1: Sauvegarde avant sync (si activée)
    if (options.saveBeforeSync) {
        steps.push('💾 Sauvegarde snapshot avant sync');
        await new Promise(resolve => setTimeout(resolve, 200)); // Simuler sauvegarde
    }

    // Étape 2: Récupération données FMP (si activée)
    if (options.syncData || options.syncAssumptions || options.syncInfo) {
        steps.push('📥 Récupération données FMP');
        try {
            const response = await fetch(`${API_BASE_URL}/api/fmp-company-data-batch-sync?symbols=${ticker}&limit=1`);
            if (response.ok) {
                const data = await response.json();
                if (data.results && data.results.length > 0 && data.results[0].success) {
                    steps.push(`   ✅ Données FMP récupérées (${data.results[0].data?.data?.length || 0} années)`);
                } else {
                    steps.push(`   ⚠️  Aucune donnée FMP disponible`);
                }
            } else {
                steps.push(`   ❌ Erreur FMP: ${response.status}`);
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            steps.push(`   ❌ Erreur: ${error.message}`);
        }
    } else {
        steps.push('⏭️  Pas de sync FMP (Supabase seulement)');
    }

    // Étape 3: Merge des données
    if (options.syncData) {
        if (options.forceReplace) {
            steps.push('🔄 Merge: Force replace (remplace tout)');
        } else if (options.syncOnlyNewYears) {
            steps.push('🔄 Merge: Seulement nouvelles années');
        } else if (options.syncOnlyMissingMetrics) {
            steps.push('🔄 Merge: Seulement métriques manquantes');
        } else {
            steps.push('🔄 Merge: Intelligent (préserve données manuelles)');
        }
    }

    // Étape 4: Recalcul assumptions
    if (options.syncAssumptions) {
        if (options.replaceOrangeData) {
            steps.push('🧮 Recalcul assumptions: Remplace données oranges');
        } else {
            steps.push('🧮 Recalcul assumptions: Préserve données oranges');
        }
        
        if (options.recalculateOutliers) {
            steps.push('   ✅ Détection outliers activée');
        }
        
        if (options.preserveExclusions) {
            steps.push('   ✅ Préservation exclusions activée');
        }
    }

    // Étape 5: Sync info
    if (options.syncInfo) {
        steps.push('ℹ️  Mise à jour info entreprise');
        if (options.syncValueLineMetrics) {
            steps.push('   ✅ Sync métriques ValueLine depuis Supabase');
        }
    }

    // Étape 6: Sauvegarde finale
    steps.push('💾 Sauvegarde snapshot final');
    await new Promise(resolve => setTimeout(resolve, 300));

    const totalTime = Date.now() - startTime;

    // Afficher les étapes
    steps.forEach(step => console.log(step));

    console.log(`\n⏱️  Temps total: ${totalTime}ms`);

    // Vérifier le résultat final
    try {
        const response = await fetch(`${API_BASE_URL}/api/finance-snapshots?ticker=${ticker}&limit=1`);
        if (response.ok) {
            const data = await response.json();
            if (data.snapshots && data.snapshots.length > 0) {
                const snapshot = data.snapshots[0];
                console.log(`\n📊 Résultat final:`);
                console.log(`   - Années de données: ${snapshot.annual_data?.length || 0}`);
                console.log(`   - Has assumptions: ${!!snapshot.assumptions}`);
                console.log(`   - Has info: ${!!snapshot.company_info}`);
                console.log(`   - Is current: ${snapshot.is_current}`);
                console.log(`   - Auto fetched: ${snapshot.auto_fetched}`);
            }
        }
    } catch (error) {
        console.log(`\n⚠️  Impossible de vérifier le résultat: ${error.message}`);
    }

    return {
        success: true,
        time: totalTime,
        steps: steps.length
    };
}

/**
 * Exécuter tous les tests
 */
async function runAllTests() {
    console.log('🚀 Tests des variantes d\'options de synchronisation\n');
    console.log(`📍 API URL: ${API_BASE_URL}`);
    console.log(`📋 Ticker de test: ${TEST_TICKER}\n`);

    const results = [];

    for (const scenario of TEST_SCENARIOS) {
        try {
            const result = await testSyncOptions(TEST_TICKER, scenario.options, scenario.name);
            results.push({
                ...scenario,
                ...result
            });

            // Pause entre tests
            if (scenario !== TEST_SCENARIOS[TEST_SCENARIOS.length - 1]) {
                console.log('\n⏸️  Pause de 2 secondes avant le prochain test...\n');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } catch (error) {
            console.error(`❌ Erreur dans ${scenario.name}:`, error.message);
            results.push({
                ...scenario,
                success: false,
                error: error.message
            });
        }
    }

    // Résumé final
    console.log(`\n${'='.repeat(70)}`);
    console.log('📊 RÉSUMÉ FINAL DES TESTS');
    console.log('='.repeat(70));

    results.forEach((r, index) => {
        const status = r.success ? '✅' : '❌';
        const time = r.time ? `${(r.time / 1000).toFixed(1)}s` : 'N/A';
        console.log(`\n${status} ${r.name}`);
        console.log(`   Temps: ${time} | Étapes: ${r.steps || 0}`);
        if (r.error) {
            console.log(`   Erreur: ${r.error}`);
        }
    });

    // Analyse comparative
    console.log(`\n${'='.repeat(70)}`);
    console.log('📈 ANALYSE COMPARATIVE');
    console.log('='.repeat(70));

    const successful = results.filter(r => r.success && r.time);
    if (successful.length > 0) {
        const avgTime = successful.reduce((sum, r) => sum + r.time, 0) / successful.length;
        const minTime = Math.min(...successful.map(r => r.time));
        const maxTime = Math.max(...successful.map(r => r.time));

        console.log(`\n⏱️  Performance:`);
        console.log(`   - Temps moyen: ${(avgTime / 1000).toFixed(1)}s`);
        console.log(`   - Temps min: ${(minTime / 1000).toFixed(1)}s`);
        console.log(`   - Temps max: ${(maxTime / 1000).toFixed(1)}s`);
    }

    console.log(`\n💡 Recommandations par scénario:`);
    console.log(`   1. Sync complet (données oranges conservées): Pour usage normal`);
    console.log(`   2. Sync complet (données oranges remplacées): Pour recalcul complet`);
    console.log(`   3. Supabase seulement: Pour charger sans sync FMP`);
    console.log(`   4. Sync nouvelles années: Pour ajouter années manquantes`);
    console.log(`   5. Sync métriques manquantes: Pour compléter données incomplètes`);
    console.log(`   6. Force replace: ⚠️  Attention, remplace tout`);
    console.log(`   7. Sync minimal: Pour mettre à jour données sans toucher assumptions`);
    console.log(`   8. Sync assumptions seulement: Pour recalculer cases oranges`);

    console.log('\n✅ Tests terminés!');
}

// Exécuter les tests
runAllTests().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
});

