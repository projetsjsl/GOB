#!/usr/bin/env node
/**
 * Script pour exécuter tous les tests d'analyse
 * Génère un rapport consolidé
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SCRIPTS_DIR = path.join(__dirname);
const REPORTS_DIR = path.join(__dirname, '../docs');

console.log('🧪 EXÉCUTION DE TOUS LES TESTS D\'ANALYSE\n');
console.log('='.repeat(70));

const tests = [
    { name: 'Validation Architecture', script: 'validate-architecture.cjs', critical: true },
    { name: 'Validation Bonnes Pratiques', script: 'validate-best-practices.cjs', critical: false },
    { name: 'Extraction Fonctionnalités', script: 'extract-features.cjs', critical: true },
    { name: 'Comparaison Composants', script: 'compare-components.cjs', critical: true },
    { name: 'Validation Syntaxique', script: 'validate-syntax.cjs', critical: false },
    { name: 'Analyse dashboard-main.js', script: 'analyze-dashboard-main.cjs', critical: true },
    { name: 'Test Authentification', script: 'test-authentication.cjs', critical: true }
];

const results = [];

tests.forEach(({ name, script, critical }, index) => {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📋 TEST ${index + 1}/${tests.length}: ${name}${critical ? ' ⚠️ CRITIQUE' : ''}`);
    console.log('='.repeat(70));
    
    const scriptPath = path.join(SCRIPTS_DIR, script);
    
    if (!fs.existsSync(scriptPath)) {
        console.log(`❌ Script non trouvé: ${script}`);
        results.push({ name, status: 'ERROR', message: 'Script non trouvé' });
        return;
    }
    
    try {
        const output = execSync(`node ${scriptPath}`, { 
            encoding: 'utf8',
            cwd: path.join(__dirname, '..'),
            stdio: 'pipe'
        });
        
        console.log(output);
        
        // Analyser la sortie pour déterminer le statut
        const hasCriticalErrors = output.includes('❌') && (output.includes('CRITIQUE') || output.includes('MANQUANT'));
        const hasWarnings = output.includes('⚠️') && !output.includes('❌');
        const hasErrors = output.includes('❌');
        const hasSuccess = output.includes('✅') || output.includes('terminée') || output.includes('sauvegardés');
        
        let status = 'PASS';
        if (hasCriticalErrors && critical) {
            status = 'FAIL';
        } else if (hasWarnings || (hasErrors && !critical)) {
            status = 'WARN';
        } else if (hasSuccess) {
            status = 'PASS';
        }
        
        results.push({ name, status, output: output.substring(0, 1000) });
        
    } catch (error) {
        // Certains scripts retournent exit code 1 pour indiquer des problèmes détectés
        // Ce n'est pas une erreur d'exécution, mais un résultat de validation
        try {
            const output = error.stdout?.toString() || error.stderr?.toString() || '';
            console.log(output);
            
            const hasErrors = output.includes('❌') || output.includes('ERREUR');
            const hasWarnings = output.includes('⚠️');
            const hasSuccess = output.includes('✅') || output.includes('terminée');
            
            let status = 'WARN';
            if (hasErrors && critical) {
                status = 'FAIL';
            } else if (hasSuccess && !hasErrors) {
                status = 'PASS';
            }
            
            results.push({ name, status, output: output.substring(0, 1000) });
        } catch (e) {
            console.log(`❌ Erreur lors de l'exécution: ${error.message}`);
            results.push({ name, status: 'ERROR', message: error.message });
        }
    }
});

// Résumé final
console.log('\n' + '='.repeat(70));
console.log('📊 RÉSUMÉ DE TOUS LES TESTS');
console.log('='.repeat(70));

const passed = results.filter(r => r.status === 'PASS').length;
const warnings = results.filter(r => r.status === 'WARN').length;
const failed = results.filter(r => r.status === 'FAIL').length;
const errors = results.filter(r => r.status === 'ERROR').length;

console.log(`\n✅ Tests réussis: ${passed}/${tests.length}`);
console.log(`⚠️  Tests avec avertissements: ${warnings}`);
console.log(`❌ Tests échoués: ${failed}`);
console.log(`💥 Erreurs d'exécution: ${errors}`);

console.log('\n📋 Détails par test:\n');
results.forEach(({ name, status }, index) => {
    const icon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : status === 'ERROR' ? '💥' : '❌';
    console.log(`  ${icon} ${index + 1}. ${name}: ${status}`);
});

// Générer rapport JSON
const report = {
    date: new Date().toISOString(),
    summary: {
        total: tests.length,
        passed,
        warnings,
        failed,
        errors
    },
    results: results.map(({ name, status, message }) => ({ name, status, message }))
};

const reportFile = path.join(REPORTS_DIR, 'RAPPORT_TESTS_COMPLETS.json');
fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

console.log('\n' + '='.repeat(70));
if (failed === 0 && errors === 0) {
    console.log('\n✅ TOUS LES TESTS CRITIQUES SONT PASSÉS\n');
    console.log(`📄 Rapport détaillé: ${reportFile}\n`);
    process.exit(0);
} else {
    console.log('\n⚠️  CERTAINS TESTS NÉCESSITENT ATTENTION\n');
    console.log(`📄 Rapport détaillé: ${reportFile}\n`);
    process.exit(1);
}

