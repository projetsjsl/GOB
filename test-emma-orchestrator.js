/**
 * Script de test pour Emma Orchestrator POC
 *
 * Usage: node test-emma-orchestrator.js
 */

import { EmmaOrchestrator } from './lib/emma-orchestrator.js';

// Couleurs pour console
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(color, ...args) {
    console.log(color, ...args, colors.reset);
}

async function runTests() {
    console.log('\n' + '='.repeat(80));
    log(colors.cyan, '🧪 EMMA ORCHESTRATOR - POC TEST SUITE');
    console.log('='.repeat(80) + '\n');

    const orchestrator = new EmmaOrchestrator();
    let testsRun = 0;
    let testsPassed = 0;
    let totalCost = 0;

    // Test 1: Politesse simple (réponse directe, 0 coût)
    console.log('\n📋 Test 1: Politesse simple (réponse directe)');
    console.log('-'.repeat(80));
    try {
        const result = await orchestrator.process('merci', { channel: 'web' });
        log(colors.green, '✅ Résultat:', result.response);
        log(colors.blue, '💰 Coût:', `$${result.cost?.total || 0}`);
        log(colors.blue, '🔧 Outils:', result.toolsUsed?.length || 0);

        testsRun++;
        if (result.success && result.cost?.total === 0) {
            testsPassed++;
            log(colors.green, '✓ PASS - Réponse directe sans LLM');
        } else {
            log(colors.red, '✗ FAIL - Devrait répondre sans LLM');
        }
    } catch (error) {
        log(colors.red, '❌ Erreur:', error.message);
        testsRun++;
    }

    // Test 2: Demande SKILLS
    console.log('\n📋 Test 2: Demande SKILLS');
    console.log('-'.repeat(80));
    try {
        const result = await orchestrator.process('skills', { channel: 'web' });
        log(colors.green, '✅ Résultat (tronqué):', result.response.substring(0, 200) + '...');
        log(colors.blue, '💰 Coût:', `$${result.cost?.total || 0}`);

        testsRun++;
        if (result.success && result.response.includes('MES CAPACITÉS AVANCÉES')) {
            testsPassed++;
            log(colors.green, '✓ PASS - Message SKILLS retourné');
        } else {
            log(colors.red, '✗ FAIL - Devrait retourner liste SKILLS');
        }
    } catch (error) {
        log(colors.red, '❌ Erreur:', error.message);
        testsRun++;
    }

    // Test 3: Salutation (via Perplexity)
    console.log('\n📋 Test 3: Salutation (via Perplexity)');
    console.log('-'.repeat(80));
    try {
        const result = await orchestrator.process('Bonjour Emma', { channel: 'web' });
        log(colors.green, '✅ Résultat:', result.response);
        log(colors.blue, '💰 Coût:', `$${result.cost?.total || 0}`);
        log(colors.blue, '⏱️ Latence:', `${result.latency || 0}ms`);
        log(colors.blue, '🤖 Modèle:', result.model || 'N/A');

        testsRun++;
        totalCost += result.cost?.total || 0;
        if (result.success && result.cost?.total > 0) {
            testsPassed++;
            log(colors.green, '✓ PASS - Réponse via Perplexity');
        } else {
            log(colors.red, '✗ FAIL - Devrait utiliser Perplexity');
        }
    } catch (error) {
        log(colors.red, '❌ Erreur:', error.message);
        testsRun++;
    }

    // Test 4: Analyse simple ticker (NOTE: Désactivé car nécessite env vars)
    console.log('\n📋 Test 4: Analyse simple ticker');
    console.log('-'.repeat(80));
    console.log('⚠️ Test désactivé - Nécessite FMP_API_KEY et PERPLEXITY_API_KEY');
    console.log('Pour activer: Définir les variables d\'environnement et décommenter le test');
    /*
    try {
        const result = await orchestrator.process('Prix de AAPL', { channel: 'web' });
        log(colors.green, '✅ Résultat:', result.response.substring(0, 300) + '...');
        log(colors.blue, '💰 Coût:', `$${result.cost?.total || 0}`);
        log(colors.blue, '🔧 Outils utilisés:', result.toolsUsed?.join(', '));
        log(colors.blue, '📚 Citations:', result.citations?.length || 0);

        testsRun++;
        totalCost += result.cost?.total || 0;
        if (result.success && result.toolsUsed?.length > 0) {
            testsPassed++;
            log(colors.green, '✓ PASS - Outils exécutés et réponse générée');
        } else {
            log(colors.red, '✗ FAIL - Devrait exécuter des outils');
        }
    } catch (error) {
        log(colors.red, '❌ Erreur:', error.message);
        testsRun++;
    }
    */

    // Résumé
    console.log('\n' + '='.repeat(80));
    log(colors.cyan, '📊 RÉSUMÉ DES TESTS');
    console.log('='.repeat(80));
    log(colors.blue, `Tests exécutés: ${testsRun}`);
    log(testsPassed === testsRun ? colors.green : colors.yellow, `Tests réussis: ${testsPassed}`);
    log(testsRun - testsPassed > 0 ? colors.red : colors.green, `Tests échoués: ${testsRun - testsPassed}`);
    log(colors.blue, `Coût total: $${totalCost.toFixed(4)}`);
    console.log('='.repeat(80) + '\n');

    if (testsPassed === testsRun) {
        log(colors.green, '🎉 TOUS LES TESTS SONT PASSÉS !');
    } else {
        log(colors.yellow, '⚠️ Certains tests ont échoué');
    }

    // Instructions suivantes
    console.log('\n' + '='.repeat(80));
    log(colors.cyan, '📝 PROCHAINES ÉTAPES');
    console.log('='.repeat(80));
    console.log(`
1. Définir les variables d'environnement:
   export PERPLEXITY_API_KEY="your_key_here"
   export FMP_API_KEY="your_key_here"

2. Tester avec une vraie analyse:
   node test-emma-orchestrator.js

3. Tester via l'endpoint API:
   curl -X POST http://localhost:3000/api/emma-orchestrator-test \\
     -H "Content-Type: application/json" \\
     -d '{"message": "Analyse AAPL", "channel": "web"}'

4. Si tests passent → A/B testing dans /api/chat.js

5. Comparer métriques:
   - Qualité des réponses
   - Coût par requête
   - Latence
   - Taux de couverture des métriques
`);
    console.log('='.repeat(80) + '\n');
}

// Exécuter tests
runTests().catch(error => {
    log(colors.red, '💥 Erreur fatale:', error.message);
    console.error(error.stack);
    process.exit(1);
});
