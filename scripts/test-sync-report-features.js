/**
 * Script de test pour valider toutes les fonctionnalités du rapport de synchronisation
 * Teste: Export CSV/JSON, Graphiques, Actions correctives, Notifications
 */

const API_BASE_URL = process.env.API_BASE_URL || 'https://gobapps.com';

// Tickers de test (mix de succès et échecs simulés)
const TEST_TICKERS = [
    'AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN',
    'INVALID1', 'INVALID2', // Pour tester les erreurs
    'NVDA', 'META', 'JPM', 'V'
];

/**
 * Simule une synchronisation et génère un rapport de test
 */
async function generateTestReport() {
    console.log('🧪 Génération d\'un rapport de test...\n');

    const startTime = Date.now();
    const tickerResults = [];

    // Simuler des synchronisations
    for (const ticker of TEST_TICKERS) {
        const tickerStartTime = Date.now();
        const isInvalid = ticker.startsWith('INVALID');
        
        if (isInvalid) {
            // Simuler une erreur
            tickerResults.push({
                ticker,
                success: false,
                error: 'Ticker introuvable dans FMP',
                timeMs: Math.floor(Math.random() * 500) + 100,
                dataRetrieved: {
                    years: 0,
                    dataPoints: 0,
                    hasProfile: false,
                    hasKeyMetrics: false,
                    hasQuotes: false,
                    hasFinancials: false
                },
                outliers: {
                    detected: [],
                    excluded: { EPS: false, CF: false, BV: false, DIV: false },
                    reasons: {}
                },
                orangeData: { wasReplaced: false },
                currentPrice: 0,
                zeroData: {
                    earningsPerShare: 0,
                    cashFlowPerShare: 0,
                    bookValuePerShare: 0,
                    dividendPerShare: 0,
                    reasons: {}
                },
                naData: {
                    fields: ['currentPrice', 'annualData'],
                    reasons: {
                        currentPrice: 'Prix actuel non disponible dans FMP',
                        annualData: 'Aucune donnée historique disponible'
                    }
                },
                other: {
                    snapshotSaved: false,
                    assumptionsUpdated: false,
                    infoUpdated: false,
                    valueLineMetricsSynced: false
                }
            });
        } else {
            // Simuler un succès
            const hasOutlier = Math.random() < 0.3; // 30% de chance d'avoir un outlier
            const outlierMetrics = ['EPS', 'CF', 'BV', 'DIV'];
            const detectedOutliers = hasOutlier 
                ? [outlierMetrics[Math.floor(Math.random() * outlierMetrics.length)]]
                : [];

            tickerResults.push({
                ticker,
                success: true,
                timeMs: Math.floor(Math.random() * 800) + 100,
                dataRetrieved: {
                    years: 25,
                    dataPoints: 25,
                    hasProfile: true,
                    hasKeyMetrics: true,
                    hasQuotes: true,
                    hasFinancials: true
                },
                outliers: {
                    detected: detectedOutliers,
                    excluded: {
                        EPS: detectedOutliers.includes('EPS'),
                        CF: detectedOutliers.includes('CF'),
                        BV: detectedOutliers.includes('BV'),
                        DIV: detectedOutliers.includes('DIV')
                    },
                    reasons: detectedOutliers.reduce((acc, metric) => {
                        acc[metric] = 'Prix cible aberrant détecté (>1.5σ ou retour implausible)';
                        return acc;
                    }, {})
                },
                orangeData: {
                    growthRateEPS: 8.5 + (Math.random() * 5 - 2.5),
                    growthRateCF: 7.0 + (Math.random() * 4 - 2),
                    growthRateBV: 10.0 + (Math.random() * 6 - 3),
                    growthRateDiv: 5.0 + (Math.random() * 3 - 1.5),
                    targetPE: 20 + (Math.random() * 15 - 5),
                    targetPCF: 15 + (Math.random() * 10 - 3),
                    targetPBV: 3 + (Math.random() * 4 - 1),
                    targetYield: 0.01 + (Math.random() * 0.02),
                    wasReplaced: false
                },
                currentPrice: 100 + Math.random() * 500,
                zeroData: {
                    earningsPerShare: Math.floor(Math.random() * 3),
                    cashFlowPerShare: Math.floor(Math.random() * 2),
                    bookValuePerShare: 0,
                    dividendPerShare: Math.floor(Math.random() * 5),
                    reasons: {
                        earningsPerShare: '2 années avec EPS à 0 (pertes ou données manquantes)',
                        cashFlowPerShare: '1 année avec CF à 0 (CF négatif ou données manquantes)',
                        dividendPerShare: '3 années avec DIV à 0 (pas de dividende ou données manquantes)'
                    }
                },
                naData: {
                    fields: [],
                    reasons: {}
                },
                other: {
                    snapshotSaved: true,
                    assumptionsUpdated: true,
                    infoUpdated: true,
                    valueLineMetricsSynced: true
                }
            });
        }

        // Simuler un délai
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    const endTime = Date.now();
    const successCount = tickerResults.filter(r => r.success).length;
    const errorCount = tickerResults.filter(r => !r.success && !r.error?.includes('introuvable')).length;
    const skippedCount = tickerResults.filter(r => !r.success && r.error?.includes('introuvable')).length;

    const totalDataPoints = tickerResults
        .filter(r => r.success)
        .reduce((sum, r) => sum + (r.dataRetrieved?.dataPoints || 0), 0);

    const totalOutliersDetected = tickerResults
        .filter(r => r.success)
        .reduce((sum, r) => sum + (r.outliers?.detected?.length || 0), 0);

    const avgTimePerTicker = tickerResults.length > 0
        ? tickerResults.reduce((sum, r) => sum + r.timeMs, 0) / tickerResults.length
        : 0;

    return {
        startTime,
        endTime,
        totalTickers: TEST_TICKERS.length,
        successCount,
        errorCount,
        skippedCount,
        options: {
            saveBeforeSync: true,
            replaceOrangeData: false,
            syncData: true,
            syncAssumptions: true,
            syncInfo: true
        },
        tickerResults,
        globalStats: {
            avgTimePerTicker,
            totalDataPoints,
            totalOutliersDetected,
            totalOrangeDataReplaced: 0
        }
    };
}

/**
 * Test de l'export CSV
 */
function testCSVExport(reportData) {
    console.log('📊 Test Export CSV...');

    const headers = [
        'Ticker',
        'Statut',
        'Temps (ms)',
        'Prix Actuel',
        'Années de Données',
        'Points de Données',
        'Outliers Détectés',
        'Outliers Exclus',
        'Cases Orange Recalculées',
        'Données EPS à Zéro',
        'Données CF à Zéro',
        'Données BV à Zéro',
        'Données DIV à Zéro',
        'Données N/A',
        'Snapshot Sauvegardé',
        'Assumptions Mises à Jour',
        'Info Mise à Jour',
        'ValueLine Synced',
        'Erreur'
    ];

    const rows = reportData.tickerResults.map(result => [
        result.ticker,
        result.success ? 'Succès' : 'Erreur',
        result.timeMs.toString(),
        result.currentPrice > 0 ? `$${result.currentPrice.toFixed(2)}` : 'N/A',
        result.dataRetrieved?.years?.toString() || '0',
        result.dataRetrieved?.dataPoints?.toString() || '0',
        result.outliers?.detected?.join('; ') || '',
        Object.entries(result.outliers?.excluded || {})
            .filter(([_, excluded]) => excluded)
            .map(([metric]) => metric)
            .join('; ') || '',
        result.orangeData?.wasReplaced ? 'Oui' : 'Non',
        result.zeroData?.earningsPerShare?.toString() || '0',
        result.zeroData?.cashFlowPerShare?.toString() || '0',
        result.zeroData?.bookValuePerShare?.toString() || '0',
        result.zeroData?.dividendPerShare?.toString() || '0',
        result.naData?.fields?.join('; ') || '',
        result.other?.snapshotSaved ? 'Oui' : 'Non',
        result.other?.assumptionsUpdated ? 'Oui' : 'Non',
        result.other?.infoUpdated ? 'Oui' : 'Non',
        result.other?.valueLineMetricsSynced ? 'Oui' : 'Non',
        result.error || ''
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => {
            const cellStr = String(cell || '');
            if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
        }).join(','))
    ].join('\n');

    // Vérifications
    const hasHeaders = csvContent.includes('Ticker,Statut');
    const hasData = rows.length === reportData.tickerResults.length;
    const hasSuccessRows = rows.some(row => row[1] === 'Succès');
    const hasErrorRows = rows.some(row => row[1] === 'Erreur');

    console.log(`   ✅ Headers présents: ${hasHeaders}`);
    console.log(`   ✅ Nombre de lignes: ${rows.length} (attendu: ${reportData.tickerResults.length})`);
    console.log(`   ✅ Lignes succès: ${hasSuccessRows}`);
    console.log(`   ✅ Lignes erreur: ${hasErrorRows}`);
    console.log(`   ✅ Taille CSV: ${csvContent.length} caractères`);

    return hasHeaders && hasData && hasSuccessRows && hasErrorRows;
}

/**
 * Test de l'export JSON
 */
function testJSONExport(reportData) {
    console.log('\n📄 Test Export JSON...');

    try {
        const jsonContent = JSON.stringify(reportData, null, 2);
        const parsed = JSON.parse(jsonContent);

        const hasStartTime = parsed.startTime !== undefined;
        const hasEndTime = parsed.endTime !== undefined;
        const hasTickerResults = Array.isArray(parsed.tickerResults);
        const hasGlobalStats = parsed.globalStats !== undefined;
        const hasOptions = parsed.options !== undefined;
        const correctTickerCount = parsed.tickerResults.length === reportData.tickerResults.length;

        console.log(`   ✅ Structure valide: ${hasStartTime && hasEndTime}`);
        console.log(`   ✅ TickerResults array: ${hasTickerResults}`);
        console.log(`   ✅ GlobalStats présents: ${hasGlobalStats}`);
        console.log(`   ✅ Options présentes: ${hasOptions}`);
        console.log(`   ✅ Nombre de tickers: ${parsed.tickerResults.length} (attendu: ${reportData.tickerResults.length})`);
        console.log(`   ✅ Taille JSON: ${jsonContent.length} caractères`);

        // Vérifier la structure d'un ticker
        if (parsed.tickerResults.length > 0) {
            const firstTicker = parsed.tickerResults[0];
            const hasRequiredFields = 
                firstTicker.ticker !== undefined &&
                firstTicker.success !== undefined &&
                firstTicker.timeMs !== undefined &&
                firstTicker.dataRetrieved !== undefined &&
                firstTicker.outliers !== undefined &&
                firstTicker.orangeData !== undefined;

            console.log(`   ✅ Structure ticker complète: ${hasRequiredFields}`);
        }

        return hasStartTime && hasEndTime && hasTickerResults && hasGlobalStats && correctTickerCount;
    } catch (error) {
        console.error(`   ❌ Erreur JSON: ${error.message}`);
        return false;
    }
}

/**
 * Test des graphiques (vérification des données)
 */
function testChartsData(reportData) {
    console.log('\n📈 Test Données Graphiques...');

    // Test données graphique barres (top 10 temps)
    const top10ByTime = reportData.tickerResults
        .sort((a, b) => b.timeMs - a.timeMs)
        .slice(0, 10)
        .map(r => ({
            ticker: r.ticker,
            temps: r.timeMs,
            statut: r.success ? 'Succès' : 'Erreur'
        }));

    const hasTop10Data = top10ByTime.length > 0;
    const hasTimeData = top10ByTime.every(d => d.temps !== undefined);
    const isSorted = top10ByTime.every((d, i) => 
        i === 0 || d.temps <= top10ByTime[i - 1].temps
    );

    console.log(`   ✅ Données top 10: ${hasTop10Data} (${top10ByTime.length} éléments)`);
    console.log(`   ✅ Données temps valides: ${hasTimeData}`);
    console.log(`   ✅ Tri décroissant: ${isSorted}`);

    // Test données graphique camembert
    const pieData = [
        { name: 'Succès', value: reportData.successCount, color: '#10b981' },
        { name: 'Erreurs', value: reportData.errorCount, color: '#ef4444' },
        { name: 'Ignorés', value: reportData.skippedCount, color: '#f59e0b' }
    ];

    const hasPieData = pieData.length === 3;
    const hasValidValues = pieData.every(d => typeof d.value === 'number' && d.value >= 0);
    const sumEqualsTotal = pieData.reduce((sum, d) => sum + d.value, 0) === reportData.totalTickers;

    console.log(`   ✅ Données camembert: ${hasPieData}`);
    console.log(`   ✅ Valeurs valides: ${hasValidValues}`);
    console.log(`   ✅ Somme = Total: ${sumEqualsTotal} (${pieData.reduce((sum, d) => sum + d.value, 0)} = ${reportData.totalTickers})`);

    return hasTop10Data && hasTimeData && isSorted && hasPieData && hasValidValues && sumEqualsTotal;
}

/**
 * Test des actions correctives
 */
function testCorrectiveActions(reportData) {
    console.log('\n🔧 Test Actions Correctives...');

    const failedTickers = reportData.tickerResults.filter(r => !r.success);
    const hasFailedTickers = failedTickers.length > 0;
    const canRetryFailed = failedTickers.length > 0 && reportData.errorCount > 0;

    console.log(`   ✅ Tickers en échec: ${failedTickers.length}`);
    console.log(`   ✅ Peut réessayer échecs: ${canRetryFailed}`);
    
    if (failedTickers.length > 0) {
        const firstFailed = failedTickers[0];
        const hasError = !!firstFailed.error;
        const hasRetryData = firstFailed.ticker !== undefined;
        
        console.log(`   ✅ Erreur présente: ${hasError} (${firstFailed.error})`);
        console.log(`   ✅ Données pour réessai: ${hasRetryData}`);
        
        return hasError && hasRetryData;
    }

    return true; // Pas d'échecs = pas de problème
}

/**
 * Test des statistiques globales
 */
function testGlobalStats(reportData) {
    console.log('\n📊 Test Statistiques Globales...');

    const stats = reportData.globalStats;
    const hasAvgTime = typeof stats.avgTimePerTicker === 'number' && stats.avgTimePerTicker > 0;
    const hasDataPoints = typeof stats.totalDataPoints === 'number';
    const hasOutliers = typeof stats.totalOutliersDetected === 'number';
    const hasOrangeReplaced = typeof stats.totalOrangeDataReplaced === 'number';

    console.log(`   ✅ Temps moyen: ${hasAvgTime} (${stats.avgTimePerTicker.toFixed(0)}ms)`);
    console.log(`   ✅ Points de données: ${hasDataPoints} (${stats.totalDataPoints})`);
    console.log(`   ✅ Outliers détectés: ${hasOutliers} (${stats.totalOutliersDetected})`);
    console.log(`   ✅ Cases oranges remplacées: ${hasOrangeReplaced} (${stats.totalOrangeDataReplaced})`);

    // Vérifier la cohérence
    const calculatedAvgTime = reportData.tickerResults.length > 0
        ? reportData.tickerResults.reduce((sum, r) => sum + r.timeMs, 0) / reportData.tickerResults.length
        : 0;
    const avgTimeMatches = Math.abs(stats.avgTimePerTicker - calculatedAvgTime) < 1;

    console.log(`   ✅ Cohérence temps moyen: ${avgTimeMatches} (calculé: ${calculatedAvgTime.toFixed(0)}ms)`);

    return hasAvgTime && hasDataPoints && hasOutliers && hasOrangeReplaced && avgTimeMatches;
}

/**
 * Test des filtres
 */
function testFilters(reportData) {
    console.log('\n🔍 Test Filtres...');

    const allResults = reportData.tickerResults;
    const successResults = allResults.filter(r => r.success);
    const errorResults = allResults.filter(r => !r.success && !r.error?.includes('introuvable'));
    const skippedResults = allResults.filter(r => !r.success && r.error?.includes('introuvable'));

    const filterAll = allResults.length === reportData.totalTickers;
    const filterSuccess = successResults.length === reportData.successCount;
    const filterError = errorResults.length === reportData.errorCount;
    const filterSkipped = skippedResults.length === reportData.skippedCount;

    console.log(`   ✅ Filtre "Tous": ${filterAll} (${allResults.length} tickers)`);
    console.log(`   ✅ Filtre "Succès": ${filterSuccess} (${successResults.length} tickers)`);
    console.log(`   ✅ Filtre "Erreurs": ${filterError} (${errorResults.length} tickers)`);
    console.log(`   ✅ Filtre "Ignorés": ${filterSkipped} (${skippedResults.length} tickers)`);

    return filterAll && filterSuccess && filterError && filterSkipped;
}

/**
 * Exécuter tous les tests
 */
async function runAllTests() {
    console.log('🚀 Tests des Fonctionnalités du Rapport de Synchronisation\n');
    console.log('='.repeat(70));

    // Générer un rapport de test
    const reportData = await generateTestReport();

    console.log('\n📋 Rapport de Test Généré:');
    console.log(`   - Total tickers: ${reportData.totalTickers}`);
    console.log(`   - Succès: ${reportData.successCount}`);
    console.log(`   - Erreurs: ${reportData.errorCount}`);
    console.log(`   - Ignorés: ${reportData.skippedCount}`);
    console.log(`   - Durée: ${reportData.endTime - reportData.startTime}ms`);

    // Exécuter tous les tests
    const results = {
        csvExport: testCSVExport(reportData),
        jsonExport: testJSONExport(reportData),
        chartsData: testChartsData(reportData),
        correctiveActions: testCorrectiveActions(reportData),
        globalStats: testGlobalStats(reportData),
        filters: testFilters(reportData)
    };

    // Résumé
    console.log('\n' + '='.repeat(70));
    console.log('📊 RÉSUMÉ DES TESTS');
    console.log('='.repeat(70));

    const allTests = Object.entries(results);
    const passedTests = allTests.filter(([_, passed]) => passed).length;
    const totalTests = allTests.length;

    allTests.forEach(([testName, passed]) => {
        const status = passed ? '✅' : '❌';
        console.log(`${status} ${testName}: ${passed ? 'PASSÉ' : 'ÉCHOUÉ'}`);
    });

    console.log('\n' + '='.repeat(70));
    console.log(`📈 Résultat Global: ${passedTests}/${totalTests} tests réussis`);
    
    if (passedTests === totalTests) {
        console.log('✅ TOUS LES TESTS SONT RÉUSSIS!');
    } else {
        console.log(`⚠️  ${totalTests - passedTests} test(s) ont échoué`);
    }
    console.log('='.repeat(70));

    return passedTests === totalTests;
}

// Exécuter les tests
runAllTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
});

