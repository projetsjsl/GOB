/**
 * Script de test pour une synchronisation batch pilote
 * Teste le rapport de synchronisation avec un petit échantillon de tickers
 */

const API_BASE_URL = process.env.API_BASE_URL || 'https://gobapps.com';

// Tickers de test (mélange de tickers populaires et moins connus)
const TEST_TICKERS = [
    'AAPL',  // Apple - très populaire
    'MSFT',  // Microsoft - très populaire
    'GOOGL', // Google - très populaire
    'TSLA',  // Tesla - volatil
    'AMZN',  // Amazon - populaire
    'NVDA',  // NVIDIA - tech
    'META',  // Meta - tech
    'JPM',   // JPMorgan - finance
    'V',     // Visa - finance
    'JNJ',   // Johnson & Johnson - healthcare
    'WMT',   // Walmart - retail
    'PG',    // Procter & Gamble - consumer
    'MA',    // Mastercard - finance
    'UNH',   // UnitedHealth - healthcare
    'HD',    // Home Depot - retail
    'DIS',   // Disney - media
    'NFLX',  // Netflix - media
    'BAC',   // Bank of America - finance
    'XOM',   // Exxon Mobil - energy
    'CVX'    // Chevron - energy
];

// Options de synchronisation de test
const TEST_SYNC_OPTIONS = {
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
};

/**
 * Simule une synchronisation pour un ticker
 */
async function simulateTickerSync(ticker, options) {
    const startTime = Date.now();
    const result = {
        ticker,
        success: false,
        error: null,
        timeMs: 0,
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
        orangeData: {
            wasReplaced: options.replaceOrangeData || false
        },
        currentPrice: 0,
        zeroData: {
            earningsPerShare: 0,
            cashFlowPerShare: 0,
            bookValuePerShare: 0,
            dividendPerShare: 0,
            reasons: {}
        },
        naData: {
            fields: [],
            reasons: {}
        },
        other: {
            snapshotSaved: false,
            assumptionsUpdated: false,
            infoUpdated: false,
            valueLineMetricsSynced: false
        }
    };

    try {
        console.log(`\n🔄 Synchronisation ${ticker}...`);

        // 1. Récupérer les données FMP
        const response = await fetch(`${API_BASE_URL}/api/fmp-company-data-batch-sync?symbols=${ticker}&limit=1`);
        
        if (!response.ok) {
            if (response.status === 404) {
                result.error = 'Ticker introuvable dans FMP';
                result.timeMs = Date.now() - startTime;
                return result;
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const batchData = await response.json();
        
        if (!batchData.success || !batchData.results || batchData.results.length === 0) {
            result.error = 'Aucune donnée disponible';
            result.timeMs = Date.now() - startTime;
            return result;
        }

        const tickerData = batchData.results.find(r => r.symbol.toUpperCase() === ticker);
        
        if (!tickerData || !tickerData.success || !tickerData.data) {
            result.error = 'Données invalides';
            result.timeMs = Date.now() - startTime;
            return result;
        }

        const data = tickerData.data;

        // 2. Collecter les informations sur les données récupérées
        result.dataRetrieved = {
            years: data.data?.length || 0,
            dataPoints: data.data?.length || 0,
            hasProfile: !!data.info,
            hasKeyMetrics: !!(data.data && data.data.length > 0),
            hasQuotes: !!(data.currentPrice && data.currentPrice > 0),
            hasFinancials: !!(data.financials && data.financials.length > 0)
        };
        result.currentPrice = data.currentPrice || 0;

        // 3. Analyser les données pour détecter les outliers (simulation)
        // Dans un vrai scénario, on utiliserait detectOutlierMetrics
        const annualData = data.data || [];
        if (annualData.length > 0) {
            // Simuler la détection d'outliers (dans la vraie app, c'est fait par detectOutlierMetrics)
            const hasOutlier = Math.random() < 0.2; // 20% de chance d'avoir un outlier
            if (hasOutlier) {
                const metrics = ['EPS', 'CF', 'BV', 'DIV'];
                const outlierMetric = metrics[Math.floor(Math.random() * metrics.length)];
                result.outliers.detected = [outlierMetric];
                result.outliers.excluded[outlierMetric] = true;
                result.outliers.reasons[outlierMetric] = 'Prix cible aberrant détecté (>1.5σ ou retour implausible)';
            }
        }

        // 4. Simuler les cases oranges (assumptions)
        if (options.syncAssumptions && annualData.length > 0) {
            result.orangeData = {
                growthRateEPS: 8.5 + (Math.random() * 5 - 2.5), // Entre 6% et 11%
                growthRateCF: 7.0 + (Math.random() * 4 - 2),   // Entre 5% et 9%
                growthRateBV: 10.0 + (Math.random() * 6 - 3), // Entre 7% et 13%
                growthRateDiv: 5.0 + (Math.random() * 3 - 1.5), // Entre 3.5% et 6.5%
                targetPE: 20 + (Math.random() * 15 - 5),      // Entre 15x et 30x
                targetPCF: 15 + (Math.random() * 10 - 3),     // Entre 12x et 22x
                targetPBV: 3 + (Math.random() * 4 - 1),       // Entre 2x et 5x
                targetYield: 0.01 + (Math.random() * 0.02),   // Entre 1% et 3%
                wasReplaced: options.replaceOrangeData || false
            };
            result.other.assumptionsUpdated = true;
        }

        // 5. Analyser les données à zéro
        const zeroCounts = {
            earningsPerShare: annualData.filter(d => !d.earningsPerShare || d.earningsPerShare === 0).length,
            cashFlowPerShare: annualData.filter(d => !d.cashFlowPerShare || d.cashFlowPerShare === 0).length,
            bookValuePerShare: annualData.filter(d => !d.bookValuePerShare || d.bookValuePerShare === 0).length,
            dividendPerShare: annualData.filter(d => !d.dividendPerShare || d.dividendPerShare === 0).length
        };

        result.zeroData = {
            earningsPerShare: zeroCounts.earningsPerShare,
            cashFlowPerShare: zeroCounts.cashFlowPerShare,
            bookValuePerShare: zeroCounts.bookValuePerShare,
            dividendPerShare: zeroCounts.dividendPerShare,
            reasons: {
                earningsPerShare: zeroCounts.earningsPerShare > 0 
                    ? `${zeroCounts.earningsPerShare} années avec EPS à 0 (pertes ou données manquantes)` 
                    : '',
                cashFlowPerShare: zeroCounts.cashFlowPerShare > 0 
                    ? `${zeroCounts.cashFlowPerShare} années avec CF à 0 (CF négatif ou données manquantes)` 
                    : '',
                bookValuePerShare: zeroCounts.bookValuePerShare > 0 
                    ? `${zeroCounts.bookValuePerShare} années avec BV à 0 (BV négatif ou données manquantes)` 
                    : '',
                dividendPerShare: zeroCounts.dividendPerShare > 0 
                    ? `${zeroCounts.dividendPerShare} années avec DIV à 0 (pas de dividende ou données manquantes)` 
                    : ''
            }
        };

        // 6. Détecter les données N/A
        const naFields = [];
        const naReasons = {};

        if (!result.currentPrice || result.currentPrice === 0) {
            naFields.push('currentPrice');
            naReasons.currentPrice = 'Prix actuel non disponible dans FMP';
        }

        if (annualData.length === 0) {
            naFields.push('annualData');
            naReasons.annualData = 'Aucune donnée historique disponible';
        }

        result.naData = {
            fields: naFields,
            reasons: naReasons
        };

        // 7. Autres informations
        if (options.saveBeforeSync) {
            result.other.snapshotSaved = true;
        }
        if (options.syncInfo) {
            result.other.infoUpdated = true;
        }
        if (options.syncValueLineMetrics) {
            result.other.valueLineMetricsSynced = true;
        }

        result.success = true;
        result.timeMs = Date.now() - startTime;
        
        console.log(`✅ ${ticker}: Synchronisé avec succès (${result.timeMs}ms)`);
        console.log(`   - ${result.dataRetrieved.years} années de données`);
        console.log(`   - Prix: $${result.currentPrice.toFixed(2)}`);
        if (result.outliers.detected.length > 0) {
            console.log(`   - ⚠️  Outliers: ${result.outliers.detected.join(', ')}`);
        }

        return result;

    } catch (error) {
        result.success = false;
        result.error = error.message || String(error);
        result.timeMs = Date.now() - startTime;
        console.error(`❌ ${ticker}: ${result.error}`);
        return result;
    }
}

/**
 * Génère un rapport de synchronisation au format attendu par SyncReportDialog
 */
function generateSyncReport(tickerResults, startTime, endTime, options) {
    const successCount = tickerResults.filter(r => r.success).length;
    const errorCount = tickerResults.filter(r => !r.success && !r.error?.includes('introuvable')).length;
    const skippedCount = tickerResults.filter(r => !r.success && r.error?.includes('introuvable')).length;

    const totalDataPoints = tickerResults
        .filter(r => r.success)
        .reduce((sum, r) => sum + (r.dataRetrieved?.dataPoints || 0), 0);
    
    const totalOutliersDetected = tickerResults
        .filter(r => r.success)
        .reduce((sum, r) => sum + (r.outliers?.detected?.length || 0), 0);
    
    const totalOrangeDataReplaced = tickerResults
        .filter(r => r.success && r.orangeData?.wasReplaced)
        .length;
    
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
        options,
        tickerResults,
        globalStats: {
            avgTimePerTicker,
            totalDataPoints,
            totalOutliersDetected,
            totalOrangeDataReplaced
        }
    };
}

/**
 * Affiche un résumé du rapport
 */
function displayReportSummary(report) {
    console.log('\n' + '='.repeat(70));
    console.log('📊 RAPPORT DE SYNCHRONISATION BATCH PILOTE');
    console.log('='.repeat(70));
    
    const duration = report.endTime - report.startTime;
    const successRate = ((report.successCount / report.totalTickers) * 100).toFixed(1);

    console.log(`\n📈 Statistiques Globales:`);
    console.log(`   - Total tickers: ${report.totalTickers}`);
    console.log(`   - Succès: ${report.successCount} (${successRate}%)`);
    console.log(`   - Erreurs: ${report.errorCount}`);
    console.log(`   - Ignorés: ${report.skippedCount}`);
    console.log(`   - Durée totale: ${Math.floor(duration / 1000)}s (${Math.floor(duration / 60000)}m ${Math.floor((duration % 60000) / 1000)}s)`);
    console.log(`   - Temps moyen/ticker: ${report.globalStats.avgTimePerTicker.toFixed(0)}ms`);
    console.log(`   - Points de données: ${report.globalStats.totalDataPoints.toLocaleString()}`);
    console.log(`   - Outliers détectés: ${report.globalStats.totalOutliersDetected}`);
    console.log(`   - Cases oranges remplacées: ${report.globalStats.totalOrangeDataReplaced}`);

    console.log(`\n📋 Détails par Ticker:`);
    report.tickerResults.forEach(result => {
        const status = result.success ? '✅' : '❌';
        const time = `${result.timeMs}ms`;
        const years = result.dataRetrieved?.years || 0;
        const price = result.currentPrice > 0 ? `$${result.currentPrice.toFixed(2)}` : 'N/A';
        const outliers = result.outliers?.detected?.length > 0 
            ? ` ⚠️ ${result.outliers.detected.join(',')}` 
            : '';
        
        console.log(`   ${status} ${result.ticker.padEnd(6)} | ${time.padStart(8)} | ${years.toString().padStart(2)} années | ${price.padStart(10)}${outliers}`);
        
        if (!result.success && result.error) {
            console.log(`      └─ Erreur: ${result.error}`);
        }
    });

    console.log('\n' + '='.repeat(70));
    console.log('✅ Test terminé!');
    console.log('='.repeat(70));
}

/**
 * Exécute le test de synchronisation batch pilote
 */
async function runPilotTest() {
    console.log('🚀 Démarrage du test de synchronisation batch pilote\n');
    console.log(`📍 API URL: ${API_BASE_URL}`);
    console.log(`📋 Tickers de test: ${TEST_TICKERS.length} tickers`);
    console.log(`   ${TEST_TICKERS.join(', ')}\n`);

    const startTime = Date.now();
    const tickerResults = [];

    // Traiter les tickers par batch de 5 pour éviter de surcharger l'API
    const BATCH_SIZE = 5;
    const DELAY_BETWEEN_BATCHES = 2000; // 2 secondes

    for (let i = 0; i < TEST_TICKERS.length; i += BATCH_SIZE) {
        const batch = TEST_TICKERS.slice(i, i + BATCH_SIZE);
        console.log(`\n📦 Traitement du batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(TEST_TICKERS.length / BATCH_SIZE)}: ${batch.join(', ')}`);

        // Traiter le batch en parallèle
        const batchResults = await Promise.allSettled(
            batch.map(ticker => simulateTickerSync(ticker, TEST_SYNC_OPTIONS))
        );

        // Collecter les résultats
        batchResults.forEach((settled, index) => {
            if (settled.status === 'fulfilled') {
                tickerResults.push(settled.value);
            } else {
                const ticker = batch[index];
                tickerResults.push({
                    ticker,
                    success: false,
                    error: settled.reason?.message || 'Erreur inconnue',
                    timeMs: 0,
                    dataRetrieved: { years: 0, dataPoints: 0, hasProfile: false, hasKeyMetrics: false, hasQuotes: false, hasFinancials: false },
                    outliers: { detected: [], excluded: { EPS: false, CF: false, BV: false, DIV: false }, reasons: {} },
                    orangeData: { wasReplaced: false },
                    currentPrice: 0,
                    zeroData: { earningsPerShare: 0, cashFlowPerShare: 0, bookValuePerShare: 0, dividendPerShare: 0, reasons: {} },
                    naData: { fields: [], reasons: {} },
                    other: { snapshotSaved: false, assumptionsUpdated: false, infoUpdated: false, valueLineMetricsSynced: false }
                });
            }
        });

        // Attendre entre les batches (sauf pour le dernier)
        if (i + BATCH_SIZE < TEST_TICKERS.length) {
            console.log(`\n⏸️  Pause de ${DELAY_BETWEEN_BATCHES / 1000}s avant le prochain batch...`);
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
        }
    }

    const endTime = Date.now();
    const report = generateSyncReport(tickerResults, startTime, endTime, TEST_SYNC_OPTIONS);

    // Afficher le résumé
    displayReportSummary(report);

    // Sauvegarder le rapport dans un fichier JSON pour inspection
    try {
        const fs = await import('fs');
        const path = await import('path');
        const { fileURLToPath } = await import('url');
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const reportPath = path.join(__dirname, 'sync-batch-pilot-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n💾 Rapport sauvegardé dans: ${reportPath}`);
    } catch (error) {
        console.log(`\n⚠️  Impossible de sauvegarder le rapport: ${error.message}`);
    }

    return report;
}

// Exécuter le test
runPilotTest().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
});

