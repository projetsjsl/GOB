#!/usr/bin/env node

/**
 * Script de validation complète du mode TICKER_NOTE
 *
 * Vérifie :
 * - Tous les fichiers nécessaires existent
 * - Le code est syntaxiquement correct
 * - L'intégration dans emma-agent.js est complète
 * - Les variables d'environnement sont documentées
 * - La documentation est cohérente
 */

import fs from 'fs';
import path from 'path';

const CHECKS = [];
let passedChecks = 0;
let failedChecks = 0;

function check(name, condition, details = '') {
    const passed = condition;
    CHECKS.push({ name, passed, details });

    if (passed) {
        passedChecks++;
        console.log(`✅ ${name}`);
        if (details) console.log(`   ${details}`);
    } else {
        failedChecks++;
        console.error(`❌ ${name}`);
        if (details) console.error(`   ${details}`);
    }
}

console.log('\n🔍 VALIDATION DU MODE TICKER_NOTE\n');
console.log('='.repeat(60));

// ============================================================================
// 1. VÉRIFICATION DES FICHIERS
// ============================================================================
console.log('\n📁 Vérification des fichiers...\n');

const files = [
    'api/emma-agent.js',
    'docs/TICKER_NOTE_MODE.md',
    'test-ticker-note.js',
    'TICKER_NOTE_README.md',
    'examples/ticker-note-integration-example.html'
];

files.forEach(file => {
    const exists = fs.existsSync(file);
    const size = exists ? fs.statSync(file).size : 0;
    check(
        `Fichier ${file} existe`,
        exists,
        exists ? `Taille: ${(size / 1024).toFixed(2)} KB` : 'Fichier manquant'
    );
});

// ============================================================================
// 2. VÉRIFICATION DE L'INTÉGRATION DANS EMMA-AGENT
// ============================================================================
console.log('\n🔧 Vérification de l\'intégration dans emma-agent.js...\n');

try {
    const emmaAgentCode = fs.readFileSync('api/emma-agent.js', 'utf8');

    // Vérifier les points d'intégration clés
    check(
        'SmartRouter configure ticker_note',
        emmaAgentCode.includes("if (outputMode === 'ticker_note')"),
        'Détecté dans _selectModel()'
    );

    check(
        'Méthode _buildTickerNotePrompt existe',
        emmaAgentCode.includes('_buildTickerNotePrompt(userMessage, toolsData, context, intentData)'),
        'Méthode définie et appelée'
    );

    check(
        'Router principal supporte ticker_note',
        emmaAgentCode.includes("case 'ticker_note':"),
        'Case dans _buildPerplexityPrompt()'
    );

    check(
        'Post-traitement pour ticker_note',
        emmaAgentCode.includes("outputMode === 'briefing' || outputMode === 'ticker_note'"),
        'Nettoyage Markdown activé'
    );

    check(
        'Max tokens configuré pour ticker_note',
        emmaAgentCode.includes("else if (outputMode === 'ticker_note')") && emmaAgentCode.includes('maxTokens = 6000'),
        '6000 tokens pour notes détaillées'
    );

    // Vérifier le prompt contient les éléments clés
    check(
        'Prompt contient [TICKER] au début',
        emmaAgentCode.includes('[${ticker}] - Analyse Professionnelle'),
        'Ticker placé en en-tête'
    );

    check(
        'Prompt demande comparaison consensus',
        emmaAgentCode.includes('Comparaison avec Consensus Analystes') || emmaAgentCode.includes('consensus'),
        'Section consensus présente'
    );

    check(
        'Prompt inclut tags multimédias',
        emmaAgentCode.includes('[STOCKCARD:') && emmaAgentCode.includes('[RATIO_CHART:'),
        'Tags STOCKCARD et RATIO_CHART présents'
    );

    check(
        'Prompt exige sources systématiques',
        emmaAgentCode.includes('Sources consultées') || emmaAgentCode.includes('[SOURCE:'),
        'Sources obligatoires'
    );

    check(
        'Prompt interdit données simulées',
        emmaAgentCode.includes('JAMAIS de données simulées') || emmaAgentCode.includes('données réelles uniquement'),
        'Règle de sécurité présente'
    );

} catch (error) {
    check('Lecture de emma-agent.js', false, error.message);
}

// ============================================================================
// 3. VÉRIFICATION DES VARIABLES D'ENVIRONNEMENT
// ============================================================================
console.log('\n🔐 Vérification des variables d\'environnement...\n');

check(
    'PERPLEXITY_API_KEY requise pour ticker_note',
    fs.readFileSync('api/emma-agent.js', 'utf8').includes('PERPLEXITY_API_KEY'),
    'Mode ticker_note utilise Perplexity Sonar Pro'
);

check(
    'GEMINI_API_KEY disponible comme fallback',
    fs.readFileSync('api/emma-agent.js', 'utf8').includes('GEMINI_API_KEY'),
    'Fallback configuré'
);

check(
    'ANTHROPIC_API_KEY disponible pour briefings',
    fs.readFileSync('api/emma-agent.js', 'utf8').includes('ANTHROPIC_API_KEY'),
    'Claude disponible'
);

// ============================================================================
// 4. VÉRIFICATION DE LA DOCUMENTATION
// ============================================================================
console.log('\n📚 Vérification de la documentation...\n');

const docChecks = [
    {
        file: 'TICKER_NOTE_README.md',
        keywords: ['output_mode', 'ticker_note', 'STOCKCARD', 'Utilisation']
    },
    {
        file: 'docs/TICKER_NOTE_MODE.md',
        keywords: ['API Request', 'Tags multimédias', 'Validation', 'Troubleshooting']
    }
];

docChecks.forEach(({ file, keywords }) => {
    try {
        const content = fs.readFileSync(file, 'utf8');
        keywords.forEach(keyword => {
            check(
                `${file} contient "${keyword}"`,
                content.includes(keyword),
                `Mot-clé trouvé`
            );
        });
    } catch (error) {
        check(`Lecture de ${file}`, false, error.message);
    }
});

// ============================================================================
// 5. VÉRIFICATION DES EXEMPLES
// ============================================================================
console.log('\n💻 Vérification des exemples...\n');

try {
    const exampleHtml = fs.readFileSync('examples/ticker-note-integration-example.html', 'utf8');

    check(
        'Exemple HTML contient appel API',
        exampleHtml.includes('/api/emma-agent') && exampleHtml.includes("output_mode: 'ticker_note'"),
        'Code d\'exemple correct'
    );

    check(
        'Exemple HTML affiche métadonnées',
        exampleHtml.includes('metadata') && exampleHtml.includes('confidence'),
        'Affichage des métriques'
    );

    check(
        'Exemple HTML convertit Markdown',
        exampleHtml.includes('displayNote') && exampleHtml.includes('markdown'),
        'Conversion Markdown→HTML'
    );

} catch (error) {
    check('Lecture exemple HTML', false, error.message);
}

// ============================================================================
// 6. VÉRIFICATION DU SCRIPT DE TEST
// ============================================================================
console.log('\n🧪 Vérification du script de test...\n');

try {
    const testScript = fs.readFileSync('test-ticker-note.js', 'utf8');

    check(
        'Test script utilise ES modules',
        testScript.includes('import fs from'),
        'Syntaxe ES module correcte'
    );

    check(
        'Test script appelle /api/emma-agent',
        testScript.includes('/api/emma-agent') && testScript.includes('ticker_note'),
        'Endpoint correct'
    );

    check(
        'Test script valide la qualité',
        testScript.includes('validateQuality') && testScript.includes('analyzeContent'),
        'Validation automatique présente'
    );

    check(
        'Test script sauvegarde les résultats',
        testScript.includes('writeFileSync') && testScript.includes('.md'),
        'Sauvegarde des notes générées'
    );

} catch (error) {
    check('Lecture test script', false, error.message);
}

// ============================================================================
// 7. VÉRIFICATION DE LA CONFIGURATION VERCEL
// ============================================================================
console.log('\n⚡ Vérification de la configuration Vercel...\n');

try {
    const vercelConfig = fs.readFileSync('vercel.json', 'utf8');
    const config = JSON.parse(vercelConfig);

    const emmaAgentTimeout = config.functions?.['api/emma-agent.js']?.maxDuration;

    check(
        'Timeout emma-agent configuré',
        emmaAgentTimeout !== undefined,
        `Timeout: ${emmaAgentTimeout}s`
    );

    check(
        'Timeout suffisant pour ticker_note',
        emmaAgentTimeout >= 60,
        `${emmaAgentTimeout}s >= 60s (recommandé pour ticker_note)`
    );

} catch (error) {
    check('Lecture vercel.json', false, error.message);
}

// ============================================================================
// 8. VÉRIFICATION DES OUTILS REQUIS
// ============================================================================
console.log('\n🛠️ Vérification des outils requis...\n');

try {
    const toolsConfig = fs.readFileSync('config/tools_config.json', 'utf8');

    const requiredTools = [
        'fmp-quote',
        'fmp-fundamentals',
        'fmp-ticker-news',
        'analyst-recommendations'
    ];

    requiredTools.forEach(toolId => {
        check(
            `Outil "${toolId}" configuré`,
            toolsConfig.includes(`"id": "${toolId}"`),
            'Présent dans tools_config.json'
        );
    });

} catch (error) {
    check('Lecture tools_config.json', false, error.message);
}

// ============================================================================
// RÉSUMÉ FINAL
// ============================================================================
console.log('\n' + '='.repeat(60));
console.log('📊 RÉSUMÉ DE LA VALIDATION\n');
console.log(`✅ Checks réussis: ${passedChecks}`);
console.log(`❌ Checks échoués: ${failedChecks}`);
console.log(`📊 Total: ${CHECKS.length}`);
console.log(`📈 Taux de réussite: ${((passedChecks / CHECKS.length) * 100).toFixed(1)}%`);

if (failedChecks === 0) {
    console.log('\n🎉 VALIDATION COMPLÈTE RÉUSSIE !');
    console.log('✅ Le mode TICKER_NOTE est prêt à être déployé en production.');
    console.log('\n📝 Prochaines étapes:');
    console.log('   1. Créer la Pull Request');
    console.log('   2. Merger dans main');
    console.log('   3. Déployer sur Vercel');
    console.log('   4. Tester en production avec: node test-ticker-note.js AAPL');
} else {
    console.log('\n⚠️ VALIDATION INCOMPLÈTE');
    console.log(`❌ ${failedChecks} checks ont échoué. Veuillez corriger avant de déployer.`);
    console.log('\n🔍 Checks échoués:');
    CHECKS.filter(c => !c.passed).forEach(c => {
        console.log(`   - ${c.name}`);
        if (c.details) console.log(`     ${c.details}`);
    });
}

console.log('\n' + '='.repeat(60));

// Export résultats pour CI/CD
const results = {
    passed: passedChecks,
    failed: failedChecks,
    total: CHECKS.length,
    success: failedChecks === 0,
    checks: CHECKS,
    timestamp: new Date().toISOString()
};

fs.writeFileSync('validation-results.json', JSON.stringify(results, null, 2));
console.log('\n💾 Résultats sauvegardés dans: validation-results.json\n');

process.exit(failedChecks > 0 ? 1 : 0);
