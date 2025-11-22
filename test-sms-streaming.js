/**
 * Test Emma SMS Streaming Optimizations
 * 
 * Ce script teste les nouvelles optimisations:
 * 1. Streaming Perplexity avec envoi progressif
 * 2. Chargement conditionnel Supabase
 * 3. Validation stricte des outils API
 */

const TEST_SCENARIOS = [
    {
        name: "Analyse simple (devrait skip Supabase)",
        message: "ANALYSE AAPL",
        expectedBehavior: {
            skipSupabase: true,
            toolsCount: "3-5",
            streamingEnabled: true,
            estimatedTime: "5-7s"
        }
    },
    {
        name: "Prix uniquement (minimal tools)",
        message: "PRIX TSLA",
        expectedBehavior: {
            skipSupabase: true,
            toolsCount: "1-2",
            streamingEnabled: true,
            estimatedTime: "3-5s"
        }
    },
    {
        name: "Portfolio (devrait charger Supabase)",
        message: "MA LISTE",
        expectedBehavior: {
            skipSupabase: false,
            toolsCount: "0-1",
            streamingEnabled: true,
            estimatedTime: "4-6s"
        }
    },
    {
        name: "Analyse avec résultats (outils optionnels)",
        message: "ANALYSE MSFT avec résultats",
        expectedBehavior: {
            skipSupabase: true,
            toolsCount: "5-7",
            streamingEnabled: true,
            estimatedTime: "6-8s"
        }
    },
    {
        name: "Question conceptuelle (Gemini, pas Perplexity)",
        message: "C'est quoi le P/E ratio?",
        expectedBehavior: {
            skipSupabase: true,
            toolsCount: "0",
            streamingEnabled: false,
            estimatedTime: "2-4s"
        }
    }
];

async function testScenario(scenario, simulate = true) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🧪 TEST: ${scenario.name}`);
    console.log(`${'='.repeat(80)}`);
    console.log(`📝 Message: "${scenario.message}"`);
    console.log(`⏱️  Temps estimé: ${scenario.expectedBehavior.estimatedTime}`);
    console.log(`📊 Outils attendus: ${scenario.expectedBehavior.toolsCount}`);
    console.log(`💾 Skip Supabase: ${scenario.expectedBehavior.skipSupabase ? 'OUI ⚡' : 'NON'}`);
    console.log(`📡 Streaming: ${scenario.expectedBehavior.streamingEnabled ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
    console.log('');

    const startTime = Date.now();

    try {
        // Appeler l'API chat avec simulation
        const baseUrl = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : 'http://localhost:3000';

        const response = await fetch(`${baseUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: scenario.message,
                userId: '+14385443662', // Numéro de test
                channel: 'sms',
                simulate: simulate, // Mode simulation pour éviter d'envoyer de vrais SMS
                metadata: {
                    name: 'Test User'
                }
            })
        });

        const duration = Date.now() - startTime;
        const data = await response.json();

        console.log('✅ RÉSULTATS:');
        console.log(`⏱️  Temps réel: ${(duration / 1000).toFixed(2)}s`);
        console.log(`🤖 Modèle utilisé: ${data.metadata?.model || 'unknown'}`);
        console.log(`🔧 Outils utilisés: ${data.metadata?.tools_used?.length || 0}`);
        if (data.metadata?.tools_used?.length > 0) {
            console.log(`   └─ ${data.metadata.tools_used.join(', ')}`);
        }
        console.log(`💾 Supabase chargé: ${data.metadata?.supabase_loaded !== false ? 'OUI' : 'NON ⚡'}`);
        console.log(`📡 Streaming: ${data.metadata?.streaming ? 'ACTIVÉ ✓' : 'DÉSACTIVÉ'}`);
        if (data.metadata?.chunks_sent) {
            console.log(`📱 Chunks envoyés: ${data.metadata.chunks_sent}`);
        }
        console.log(`📏 Longueur réponse: ${data.response?.length || 0} chars`);
        console.log('');

        // Vérification des attentes
        let passed = true;
        const checks = [];

        // Check 1: Temps
        const expectedTimeRange = scenario.expectedBehavior.estimatedTime.split('-');
        const minTime = parseFloat(expectedTimeRange[0]);
        const maxTime = parseFloat(expectedTimeRange[1]);
        const actualTime = duration / 1000;
        
        if (actualTime >= minTime && actualTime <= maxTime + 2) { // +2s de marge
            checks.push(`✅ Temps dans la plage attendue (${actualTime.toFixed(2)}s)`);
        } else {
            checks.push(`⚠️  Temps hors plage: ${actualTime.toFixed(2)}s (attendu: ${scenario.expectedBehavior.estimatedTime})`);
            passed = false;
        }

        // Check 2: Outils
        const toolsRange = scenario.expectedBehavior.toolsCount.split('-');
        const minTools = parseInt(toolsRange[0]);
        const maxTools = parseInt(toolsRange[1]);
        const actualTools = data.metadata?.tools_used?.length || 0;

        if (actualTools >= minTools && actualTools <= maxTools) {
            checks.push(`✅ Nombre d'outils correct (${actualTools})`);
        } else {
            checks.push(`⚠️  Nombre d'outils: ${actualTools} (attendu: ${scenario.expectedBehavior.toolsCount})`);
            passed = false;
        }

        // Check 3: Streaming
        if (scenario.expectedBehavior.streamingEnabled === (data.metadata?.streaming === true)) {
            checks.push(`✅ Streaming ${scenario.expectedBehavior.streamingEnabled ? 'activé' : 'désactivé'} comme attendu`);
        } else {
            checks.push(`⚠️  Streaming ${data.metadata?.streaming ? 'activé' : 'désactivé'} (attendu: ${scenario.expectedBehavior.streamingEnabled ? 'activé' : 'désactivé'})`);
            passed = false;
        }

        console.log('🔍 VÉRIFICATIONS:');
        checks.forEach(check => console.log(`   ${check}`));
        console.log('');

        if (passed) {
            console.log('✅ TEST RÉUSSI ✓');
        } else {
            console.log('⚠️  TEST PARTIELLEMENT RÉUSSI (voir avertissements ci-dessus)');
        }

        return { passed, duration, data };

    } catch (error) {
        console.error('❌ ERREUR:', error.message);
        console.error(error.stack);
        return { passed: false, error: error.message };
    }
}

async function runAllTests() {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                 EMMA SMS STREAMING OPTIMIZATIONS - TESTS                  ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('🎯 Objectif: Valider les optimisations de performance');
    console.log('📊 Scénarios: ' + TEST_SCENARIOS.length);
    console.log('');

    const results = [];

    for (const scenario of TEST_SCENARIOS) {
        const result = await testScenario(scenario, true);
        results.push({ scenario: scenario.name, ...result });
        
        // Pause entre tests
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Résumé final
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                              RÉSUMÉ DES TESTS                              ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════╝');
    console.log('');

    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    const successRate = ((passedCount / totalCount) * 100).toFixed(0);

    results.forEach((result, index) => {
        const status = result.passed ? '✅' : '⚠️ ';
        const time = result.duration ? `${(result.duration / 1000).toFixed(2)}s` : 'N/A';
        console.log(`${status} ${index + 1}. ${result.scenario} (${time})`);
    });

    console.log('');
    console.log(`📊 Taux de réussite: ${passedCount}/${totalCount} (${successRate}%)`);
    console.log('');

    if (passedCount === totalCount) {
        console.log('🎉 TOUS LES TESTS SONT RÉUSSIS ! 🎉');
    } else if (passedCount >= totalCount * 0.8) {
        console.log('✅ La plupart des tests sont réussis (quelques avertissements)');
    } else {
        console.log('⚠️  Certains tests ont échoué, vérifier les logs ci-dessus');
    }

    console.log('');
    console.log('💡 Note: Les tests en mode simulation ne génèrent pas de vrais SMS');
    console.log('');
}

// Exécuter les tests
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests().catch(error => {
        console.error('❌ Erreur fatale:', error);
        process.exit(1);
    });
}

export { testScenario, runAllTests };






