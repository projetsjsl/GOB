/**
 * TEST RSI SCREENER
 * Script de test pour le nouveau skill RSI d'Emma
 *
 * Usage:
 * node test-rsi-screener.js
 */

import { screenByRSI } from './api/tools/rsi-screener.js';
import dotenv from 'dotenv';

dotenv.config();

// ========================================
// Test Configurations
// ========================================

const TEST_SCENARIOS = [
    {
        name: '🇺🇸 Test 1: US Market - Both (Survente + Surachat)',
        params: {
            type: 'both',
            markets: ['US'],
            limit: 10,
            market_cap: 'large'
        }
    },
    {
        name: '🇨🇦 Test 2: Canada Market - Survente uniquement',
        params: {
            type: 'oversold',
            markets: ['CA'],
            limit: 5,
            market_cap: 'large'
        }
    },
    {
        name: '🌍 Test 3: Multi-markets (US + CA + EU) - Surachat uniquement',
        params: {
            type: 'overbought',
            markets: ['US', 'CA', 'UK'],
            limit: 15,
            market_cap: 'large'
        }
    },
    {
        name: '📊 Test 4: US Mid-cap - Both',
        params: {
            type: 'both',
            markets: ['US'],
            limit: 10,
            market_cap: 'mid'
        }
    }
];

// ========================================
// Helper Functions
// ========================================

function printSeparator() {
    console.log('\n' + '='.repeat(80) + '\n');
}

function printResults(result) {
    if (!result.success) {
        console.error('❌ ERREUR:', result.error);
        return;
    }

    console.log(`✅ SUCCESS`);
    console.log(`\n📊 Statistiques:`);
    console.log(`   - Tickers analysés: ${result.total_analyzed}`);
    console.log(`   - Tickers avec données: ${result.total_with_data}`);
    console.log(`   - Marchés scannés: ${result.markets.join(', ')}`);

    // SURVENTE
    if (result.oversold && result.oversold.count > 0) {
        console.log(`\n🔴 SURVENTE EXTRÊME (${result.oversold.count} trouvés)`);
        console.log(`   Critères: ${result.oversold.criteria}`);
        console.log('\n   Top résultats:');

        result.oversold.stocks.slice(0, 5).forEach((stock, idx) => {
            console.log(`   ${idx + 1}. ${stock.symbol} - ${stock.name}`);
            console.log(`      Prix: $${stock.price?.toFixed(2) || 'N/A'}`);
            console.log(`      Market Cap: $${(stock.market_cap / 1e9).toFixed(2)}B`);
            console.log(`      RSI(14): ${stock.rsi14} | RSI(5): ${stock.rsi5}`);
            console.log(`      Signal: ${stock.signal}`);
            console.log(`      Marché: ${stock.market} (${stock.exchange})`);
            console.log('');
        });
    } else {
        console.log(`\n🔴 SURVENTE: Aucun résultat trouvé`);
    }

    // SURACHAT
    if (result.overbought && result.overbought.count > 0) {
        console.log(`\n🔵 SURACHAT EXTRÊME (${result.overbought.count} trouvés)`);
        console.log(`   Critères: ${result.overbought.criteria}`);
        console.log('\n   Top résultats:');

        result.overbought.stocks.slice(0, 5).forEach((stock, idx) => {
            console.log(`   ${idx + 1}. ${stock.symbol} - ${stock.name}`);
            console.log(`      Prix: $${stock.price?.toFixed(2) || 'N/A'}`);
            console.log(`      Market Cap: $${(stock.market_cap / 1e9).toFixed(2)}B`);
            console.log(`      RSI(14): ${stock.rsi14} | RSI(5): ${stock.rsi5}`);
            console.log(`      Signal: ${stock.signal}`);
            console.log(`      Marché: ${stock.market} (${stock.exchange})`);
            console.log('');
        });
    } else {
        console.log(`\n🔵 SURACHAT: Aucun résultat trouvé`);
    }
}

// ========================================
// Environment Check
// ========================================

function checkEnvironment() {
    console.log('🔧 Vérification de l\'environnement...\n');

    const required = ['FMP_API_KEY'];
    const optional = ['TWELVE_DATA_API_KEY'];

    let allGood = true;

    required.forEach(key => {
        if (process.env[key]) {
            console.log(`✅ ${key}: Configuré`);
        } else {
            console.log(`❌ ${key}: MANQUANT (requis)`);
            allGood = false;
        }
    });

    optional.forEach(key => {
        if (process.env[key]) {
            console.log(`✅ ${key}: Configuré`);
        } else {
            console.log(`⚠️  ${key}: Non configuré (optionnel, fallback FMP uniquement)`);
        }
    });

    console.log('');

    if (!allGood) {
        console.error('❌ Configuration incomplète. Vérifiez votre fichier .env');
        process.exit(1);
    }
}

// ========================================
// Main Test Runner
// ========================================

async function runTests() {
    console.log('╔════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                     TEST RSI SCREENER - EMMA IA SKILL                      ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

    checkEnvironment();

    printSeparator();

    // Run each test scenario
    for (let i = 0; i < TEST_SCENARIOS.length; i++) {
        const scenario = TEST_SCENARIOS[i];

        console.log(`${scenario.name}`);
        console.log(`Paramètres:`, JSON.stringify(scenario.params, null, 2));
        console.log('\n⏳ Exécution en cours...\n');

        const startTime = Date.now();

        try {
            const result = await screenByRSI(scenario.params);
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);

            console.log(`⏱️  Durée: ${duration}s`);
            printResults(result);

        } catch (error) {
            console.error('❌ ERREUR:', error.message);
            console.error(error.stack);
        }

        // Don't run next test if this is the last one
        if (i < TEST_SCENARIOS.length - 1) {
            console.log('\n⏸️  Pause 5 secondes avant le prochain test...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            printSeparator();
        }
    }

    printSeparator();
    console.log('✅ TOUS LES TESTS TERMINÉS\n');
}

// ========================================
// Run Tests
// ========================================

runTests().catch(error => {
    console.error('❌ ERREUR FATALE:', error);
    process.exit(1);
});
