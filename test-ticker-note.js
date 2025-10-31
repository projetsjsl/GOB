/**
 * Test du mode TICKER_NOTE - Notes Professionnelles par Ticker
 *
 * Ce script teste la génération de notes professionnelles complètes
 * pour un ticker boursier spécifique via Emma Agent.
 */

const VERCEL_URL = process.env.VERCEL_URL || 'http://localhost:3000';

/**
 * Génère une note professionnelle pour un ticker
 */
async function testTickerNote(ticker) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 Test TICKER_NOTE pour: ${ticker}`);
    console.log('='.repeat(60));

    try {
        const startTime = Date.now();

        const response = await fetch(`${VERCEL_URL}/api/emma-agent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Génère une note professionnelle complète pour ${ticker} incluant les derniers résultats, fondamentaux, et actualités`,
                context: {
                    output_mode: 'ticker_note',  // Mode note professionnelle
                    ticker: ticker,
                    briefing_type: 'comprehensive',
                    importance_level: 8
                }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const executionTime = Date.now() - startTime;

        // Afficher les résultats
        console.log(`\n✅ Requête réussie (${executionTime}ms)`);
        console.log('\n📊 Métadonnées:');
        console.log(`  - Success: ${data.success}`);
        console.log(`  - Modèle utilisé: ${data.model}`);
        console.log(`  - Raison: ${data.model_reason}`);
        console.log(`  - Outils utilisés: ${data.tools_used?.join(', ') || 'N/A'}`);
        console.log(`  - Outils échoués: ${data.failed_tools?.join(', ') || 'Aucun'}`);
        console.log(`  - Confiance: ${(data.confidence * 100).toFixed(1)}%`);
        console.log(`  - Sources présentes: ${data.has_sources ? 'Oui' : 'Non'}`);
        console.log(`  - Types de sources: ${data.source_types || 0}`);
        console.log(`  - Temps d'exécution: ${data.execution_time_ms}ms`);
        console.log(`  - Fiable: ${data.is_reliable ? 'Oui' : 'Non'}`);

        // Afficher un extrait de la note
        console.log('\n📝 Extrait de la note professionnelle:');
        console.log('-'.repeat(60));
        const preview = data.response.substring(0, 500);
        console.log(preview + (data.response.length > 500 ? '...' : ''));
        console.log('-'.repeat(60));

        // Statistiques sur le contenu
        const contentStats = analyzeContent(data.response);
        console.log('\n📊 Statistiques du contenu:');
        console.log(`  - Longueur totale: ${contentStats.totalLength} caractères`);
        console.log(`  - Nombre de mots: ${contentStats.wordCount}`);
        console.log(`  - Cartes boursières: ${contentStats.stockcards}`);
        console.log(`  - Graphiques de ratios: ${contentStats.ratioCharts}`);
        console.log(`  - Graphiques techniques: ${contentStats.technicalCharts}`);
        console.log(`  - Tableaux: ${contentStats.tables}`);
        console.log(`  - Sources citées: ${contentStats.sources}`);

        // Validation de la qualité
        console.log('\n🔍 Validation de la qualité:');
        const quality = validateQuality(data, contentStats);
        console.log(`  - Note globale: ${quality.score}/100`);
        console.log(`  - Détails:`);
        quality.checks.forEach(check => {
            console.log(`    ${check.passed ? '✅' : '❌'} ${check.name}: ${check.message}`);
        });

        // Sauvegarder la note complète dans un fichier
        const fs = require('fs');
        const filename = `ticker-note-${ticker}-${Date.now()}.md`;
        fs.writeFileSync(filename, data.response);
        console.log(`\n💾 Note complète sauvegardée dans: ${filename}`);

        return data;

    } catch (error) {
        console.error(`\n❌ Erreur lors du test:`, error.message);
        console.error(error.stack);
        throw error;
    }
}

/**
 * Analyse le contenu de la note générée
 */
function analyzeContent(content) {
    return {
        totalLength: content.length,
        wordCount: content.split(/\s+/).length,
        stockcards: (content.match(/\[STOCKCARD:/g) || []).length,
        ratioCharts: (content.match(/\[RATIO_CHART:/g) || []).length,
        technicalCharts: (content.match(/\[CHART:(?:FINVIZ|TRADINGVIEW):/g) || []).length,
        tables: (content.match(/\[TABLE:/g) || []).length,
        sources: (content.match(/\[SOURCE:/g) || []).length
    };
}

/**
 * Valide la qualité de la note générée
 */
function validateQuality(data, contentStats) {
    const checks = [];
    let score = 0;

    // Check 1: Confiance élevée (20 points)
    const confidenceCheck = {
        name: 'Confiance élevée',
        passed: data.confidence >= 0.8,
        message: `${(data.confidence * 100).toFixed(1)}% (seuil: 80%)`
    };
    checks.push(confidenceCheck);
    if (confidenceCheck.passed) score += 20;

    // Check 2: Sources présentes (20 points)
    const sourcesCheck = {
        name: 'Sources citées',
        passed: data.has_sources && contentStats.sources >= 3,
        message: `${contentStats.sources} sources (minimum: 3)`
    };
    checks.push(sourcesCheck);
    if (sourcesCheck.passed) score += 20;

    // Check 3: Graphiques présents (20 points)
    const chartsCheck = {
        name: 'Graphiques inclus',
        passed: (contentStats.stockcards + contentStats.ratioCharts + contentStats.technicalCharts) >= 2,
        message: `${contentStats.stockcards + contentStats.ratioCharts + contentStats.technicalCharts} graphiques (minimum: 2)`
    };
    checks.push(chartsCheck);
    if (chartsCheck.passed) score += 20;

    // Check 4: Tableaux présents (15 points)
    const tablesCheck = {
        name: 'Tableaux inclus',
        passed: contentStats.tables >= 1,
        message: `${contentStats.tables} tableaux (minimum: 1)`
    };
    checks.push(tablesCheck);
    if (tablesCheck.passed) score += 15;

    // Check 5: Longueur appropriée (15 points)
    const lengthCheck = {
        name: 'Longueur appropriée',
        passed: contentStats.wordCount >= 500 && contentStats.wordCount <= 3000,
        message: `${contentStats.wordCount} mots (optimal: 500-3000)`
    };
    checks.push(lengthCheck);
    if (lengthCheck.passed) score += 15;

    // Check 6: Fiabilité (10 points)
    const reliabilityCheck = {
        name: 'Données fiables',
        passed: data.is_reliable,
        message: data.is_reliable ? 'Toutes les sources sont fiables' : 'Certaines sources non fiables'
    };
    checks.push(reliabilityCheck);
    if (reliabilityCheck.passed) score += 10;

    return { score, checks };
}

/**
 * Tests multiples avec différents tickers
 */
async function runMultipleTests() {
    const tickers = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA'];

    console.log('\n🚀 Lancement des tests TICKER_NOTE pour plusieurs tickers...\n');

    const results = [];

    for (const ticker of tickers) {
        try {
            const result = await testTickerNote(ticker);
            results.push({ ticker, success: true, result });
        } catch (error) {
            results.push({ ticker, success: false, error: error.message });
        }

        // Pause de 2 secondes entre chaque test pour ne pas surcharger l'API
        if (tickers.indexOf(ticker) < tickers.length - 1) {
            console.log('\n⏳ Pause de 2 secondes...\n');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    // Résumé final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ DES TESTS');
    console.log('='.repeat(60));

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`\n✅ Réussis: ${successCount}/${tickers.length}`);
    console.log(`❌ Échoués: ${failureCount}/${tickers.length}`);

    if (failureCount > 0) {
        console.log('\n❌ Tickers ayant échoué:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`  - ${r.ticker}: ${r.error}`);
        });
    }

    // Statistiques moyennes
    if (successCount > 0) {
        const successfulResults = results.filter(r => r.success);
        const avgConfidence = successfulResults.reduce((sum, r) => sum + r.result.confidence, 0) / successCount;
        const avgExecutionTime = successfulResults.reduce((sum, r) => sum + r.result.execution_time_ms, 0) / successCount;

        console.log('\n📈 Statistiques moyennes:');
        console.log(`  - Confiance: ${(avgConfidence * 100).toFixed(1)}%`);
        console.log(`  - Temps d'exécution: ${avgExecutionTime.toFixed(0)}ms`);
    }
}

// Exécution
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('Usage:');
        console.log('  node test-ticker-note.js <TICKER>   # Test un ticker spécifique');
        console.log('  node test-ticker-note.js --multiple # Test plusieurs tickers');
        process.exit(1);
    }

    if (args[0] === '--multiple') {
        runMultipleTests().catch(error => {
            console.error('Erreur fatale:', error);
            process.exit(1);
        });
    } else {
        const ticker = args[0].toUpperCase();
        testTickerNote(ticker).catch(error => {
            console.error('Erreur fatale:', error);
            process.exit(1);
        });
    }
}

module.exports = { testTickerNote, runMultipleTests };
