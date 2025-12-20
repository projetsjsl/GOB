#!/usr/bin/env node
/**
 * Test Script pour Modular Dashboard Beta (Version Simple)
 * 
 * Vérifie que tous les fichiers sont présents et que le code est correctement structuré
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

const tests = {
    passed: 0,
    failed: 0,
    errors: []
};

function log(message, type = 'info') {
    const prefix = {
        'info': 'ℹ️',
        'success': '✅',
        'error': '❌',
        'warning': '⚠️'
    }[type] || 'ℹ️';
    console.log(`${prefix} ${message}`);
}

function testFileExists(filePath, description) {
    const fullPath = path.join(workspaceRoot, filePath);
    if (fs.existsSync(fullPath)) {
        tests.passed++;
        log(`${description}: ${filePath}`, 'success');
        return true;
    } else {
        tests.failed++;
        tests.errors.push(`Fichier manquant: ${filePath}`);
        log(`${description}: ${filePath} - MANQUANT`, 'error');
        return false;
    }
}

function testFileContains(filePath, searchStrings, description) {
    const fullPath = path.join(workspaceRoot, filePath);
    if (!fs.existsSync(fullPath)) {
        tests.failed++;
        tests.errors.push(`Fichier non trouvé: ${filePath}`);
        log(`${description}: Fichier non trouvé`, 'error');
        return false;
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    let allFound = true;

    for (const searchString of searchStrings) {
        if (content.includes(searchString)) {
            log(`  ✓ Contient: "${searchString}"`, 'success');
        } else {
            log(`  ✗ Manque: "${searchString}"`, 'error');
            allFound = false;
        }
    }

    if (allFound) {
        tests.passed++;
        log(`${description}: Tous les éléments requis sont présents`, 'success');
    } else {
        tests.failed++;
        tests.errors.push(`Éléments manquants dans ${filePath}`);
        log(`${description}: Certains éléments manquent`, 'error');
    }

    return allFound;
}

async function testFullModularDashboard() {
    log('\n=== Test 1: FullModularDashboard.js ===', 'info');
    
    const filePath = 'public/js/dashboard/components/grid-layout/FullModularDashboard.js';
    
    testFileExists(filePath, 'Fichier FullModularDashboard.js');
    
    testFileContains(filePath, [
        'window.BetaCombinedDashboard',
        'window.BetaCombinedDashboardData',
        'getCompanyLogo',
        'loadTickersFromSupabase',
        'fetchNews',
        'refreshAllStocks',
        'setActiveTab',
        'useEffect',
        'useState',
        'FullModularDashboard'
    ], 'Structure FullModularDashboard');
}

async function testModularDashboardHTML() {
    log('\n=== Test 2: modular-dashboard-beta.html ===', 'info');
    
    const filePath = 'public/modular-dashboard-beta.html';
    
    testFileExists(filePath, 'Fichier modular-dashboard-beta.html');
    
    testFileContains(filePath, [
        'FullModularDashboard',
        'React',
        'ReactDOM',
        'Babel',
        'react-grid-layout',
        'JLabTab',
        'AskEmmaTab',
        'MarketsEconomyTabRGL',
        'TitresTabRGL'
    ], 'Structure HTML');
}

async function testComponents() {
    log('\n=== Test 3: Composants ===', 'info');
    
    const components = [
        { path: 'public/js/dashboard/components/tabs/JLabTab.js', name: 'JLabTab' },
        { path: 'public/js/dashboard/components/tabs/AskEmmaTab.js', name: 'AskEmmaTab' },
        { path: 'public/js/dashboard/components/tabs/MarketsEconomyTabRGL.js', name: 'MarketsEconomyTabRGL' },
        { path: 'public/js/dashboard/components/tabs/TitresTabRGL.js', name: 'TitresTabRGL' }
    ];

    for (const component of components) {
        const exists = testFileExists(component.path, `Composant ${component.name}`);
        if (exists) {
            testFileContains(component.path, [
                `window.${component.name}`,
                'React'
            ], `Exposition globale ${component.name}`);
        }
    }
}

async function testGlobalExports() {
    log('\n=== Test 4: Exports Globaux ===', 'info');
    
    const filePath = 'public/js/dashboard/components/grid-layout/FullModularDashboard.js';
    const fullPath = path.join(workspaceRoot, filePath);
    
    if (!fs.existsSync(fullPath)) {
        log('Fichier FullModularDashboard.js non trouvé', 'error');
        return;
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    
    // Vérifier les exports globaux
    const exports = [
        { name: 'window.FullModularDashboard', required: true },
        { name: 'window.BetaCombinedDashboard', required: true },
        { name: 'window.BetaCombinedDashboardData', required: true }
    ];

    for (const exp of exports) {
        if (content.includes(exp.name)) {
            tests.passed++;
            log(`  ✓ ${exp.name} est exposé`, 'success');
        } else {
            if (exp.required) {
                tests.failed++;
                tests.errors.push(`${exp.name} n'est pas exposé`);
                log(`  ✗ ${exp.name} n'est pas exposé`, 'error');
            } else {
                log(`  ⚠ ${exp.name} n'est pas exposé (optionnel)`, 'warning');
            }
        }
    }
}

async function testStateManagement() {
    log('\n=== Test 5: Gestion d\'État ===', 'info');
    
    const filePath = 'public/js/dashboard/components/grid-layout/FullModularDashboard.js';
    const fullPath = path.join(workspaceRoot, filePath);
    
    if (!fs.existsSync(fullPath)) {
        return;
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    
    const states = [
        'isDarkMode',
        'tickers',
        'stockData',
        'newsData',
        'loading',
        'lastUpdate'
    ];

    let allFound = true;
    for (const state of states) {
        if (content.includes(`useState`) && content.includes(state)) {
            log(`  ✓ État ${state} géré`, 'success');
        } else {
            log(`  ✗ État ${state} manquant`, 'error');
            allFound = false;
        }
    }

    if (allFound) {
        tests.passed++;
    } else {
        tests.failed++;
        tests.errors.push('Certains états manquent');
    }
}

async function testFunctions() {
    log('\n=== Test 6: Fonctions Utilitaires ===', 'info');
    
    const filePath = 'public/js/dashboard/components/grid-layout/FullModularDashboard.js';
    const fullPath = path.join(workspaceRoot, filePath);
    
    if (!fs.existsSync(fullPath)) {
        return;
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    
    const functions = [
        'getCompanyLogo',
        'loadTickersFromSupabase',
        'fetchNews',
        'refreshAllStocks',
        'fetchLatestNewsForTickers',
        'setActiveTab'
    ];

    let allFound = true;
    for (const func of functions) {
        if (content.includes(func)) {
            log(`  ✓ Fonction ${func} présente`, 'success');
        } else {
            log(`  ✗ Fonction ${func} manquante`, 'error');
            allFound = false;
        }
    }

    if (allFound) {
        tests.passed++;
    } else {
        tests.failed++;
        tests.errors.push('Certaines fonctions manquent');
    }
}

async function testDependencies() {
    log('\n=== Test 7: Dépendances ===', 'info');
    
    const filePath = 'public/modular-dashboard-beta.html';
    const fullPath = path.join(workspaceRoot, filePath);
    
    if (!fs.existsSync(fullPath)) {
        return;
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    
    const dependencies = [
        { name: 'React', search: 'react@18', required: true },
        { name: 'ReactDOM', search: 'react-dom@18', required: true },
        { name: 'Babel', search: '@babel/standalone', required: true },
        { name: 'React Grid Layout', search: 'react-grid-layout', required: true },
        { name: 'Recharts', search: 'recharts', required: false },
        { name: 'Chart.js', search: 'chart.js', required: false },
        { name: 'Supabase', search: '@supabase/supabase-js', required: false }
    ];

    for (const dep of dependencies) {
        if (content.includes(dep.search)) {
            tests.passed++;
            log(`  ✓ ${dep.name} chargé`, 'success');
        } else {
            if (dep.required) {
                tests.failed++;
                tests.errors.push(`${dep.name} n'est pas chargé`);
                log(`  ✗ ${dep.name} non chargé`, 'error');
            } else {
                log(`  ⚠ ${dep.name} non chargé (optionnel)`, 'warning');
            }
        }
    }
}

async function testComponentProps() {
    log('\n=== Test 8: Props des Composants ===', 'info');
    
    const filePath = 'public/js/dashboard/components/grid-layout/FullModularDashboard.js';
    const fullPath = path.join(workspaceRoot, filePath);
    
    if (!fs.existsSync(fullPath)) {
        return;
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    
    // Vérifier que AskEmmaTab reçoit les bonnes props
    if (content.includes('item.type === \'AI\'') && content.includes('prefillMessage')) {
        tests.passed++;
        log('  ✓ AskEmmaTab reçoit les props nécessaires', 'success');
    } else {
        tests.failed++;
        tests.errors.push('AskEmmaTab ne reçoit pas toutes les props');
        log('  ✗ AskEmmaTab manque des props', 'error');
    }

    // Vérifier que les autres composants reçoivent isDarkMode et isAdmin
    if (content.includes('isDarkMode={isDarkMode}') && content.includes('isAdmin={true}')) {
        tests.passed++;
        log('  ✓ Les composants reçoivent isDarkMode et isAdmin', 'success');
    } else {
        tests.failed++;
        tests.errors.push('Les composants ne reçoivent pas isDarkMode/isAdmin');
        log('  ✗ Props manquantes pour les composants', 'error');
    }
}

async function runAllTests() {
    log('🚀 Démarrage des tests pour Modular Dashboard Beta', 'info');
    log(`Workspace: ${workspaceRoot}\n`, 'info');

    await testFullModularDashboard();
    await testModularDashboardHTML();
    await testComponents();
    await testGlobalExports();
    await testStateManagement();
    await testFunctions();
    await testDependencies();
    await testComponentProps();

    // Résumé
    log('\n=== Résumé ===', 'info');
    log(`Tests réussis: ${tests.passed}`, 'success');
    log(`Tests échoués: ${tests.failed}`, tests.failed > 0 ? 'error' : 'success');
    
    if (tests.errors.length > 0) {
        log('\n=== Erreurs ===', 'error');
        tests.errors.forEach((error, index) => {
            log(`${index + 1}. ${error}`, 'error');
        });
    }
    
    const success = tests.failed === 0;
    if (success) {
        log('\n✅ Tous les tests sont passés !', 'success');
    } else {
        log('\n❌ Certains tests ont échoué', 'error');
    }
    
    process.exit(success ? 0 : 1);
}

runAllTests().catch(error => {
    log(`Erreur fatale: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
});
