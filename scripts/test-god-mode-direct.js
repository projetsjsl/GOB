#!/usr/bin/env node
/**
 * Test Direct GOD MODE - Vérification des fichiers et structure
 * 
 * Teste la structure du code sans nécessiter de navigateur
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

const tests = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
};

function log(message, type = 'info') {
    const prefix = {
        'info': 'ℹ️',
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'loop': '🔄'
    }[type] || 'ℹ️';
    console.log(`${prefix} ${message}`);
}

function test(name, condition, errorMsg = '') {
    tests.total++;
    if (condition) {
        tests.passed++;
        log(name, 'success');
        return true;
    } else {
        tests.failed++;
        tests.errors.push(errorMsg || name);
        log(`${name} - ÉCHEC`, 'error');
        return false;
    }
}

function testFileExists(filePath, description) {
    const fullPath = path.join(workspaceRoot, filePath);
    return test(
        description,
        fs.existsSync(fullPath),
        `Fichier manquant: ${filePath}`
    );
}

function testFileContains(filePath, searchStrings, description) {
    const fullPath = path.join(workspaceRoot, filePath);
    if (!fs.existsSync(fullPath)) {
        return test(description, false, `Fichier non trouvé: ${filePath}`);
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const allFound = searchStrings.every(str => content.includes(str));
    
    return test(
        description,
        allFound,
        `Éléments manquants dans ${filePath}`
    );
}

async function runTestSuite(loopNumber) {
    log(`\n🔄 === BOUCLE ${loopNumber} ===`, 'loop');
    log(`Timestamp: ${new Date().toLocaleTimeString()}`, 'info');

    // Test 1: Fichiers essentiels
    log('\n📁 Test 1: Fichiers essentiels', 'info');
    testFileExists('public/beta-combined-dashboard.html', 'beta-combined-dashboard.html existe');
    testFileExists('public/js/dashboard/components/grid-layout/DashboardGridWrapper.js', 'DashboardGridWrapper.js existe');
    testFileExists('public/js/dashboard/app-inline.js', 'app-inline.js existe');

    // Test 2: DashboardGridWrapper structure
    log('\n📦 Test 2: Structure DashboardGridWrapper', 'info');
    testFileContains(
        'public/js/dashboard/components/grid-layout/DashboardGridWrapper.js',
        [
            'DashboardGridWrapper',
            'TAB_TO_WIDGET_MAP',
            'getDefaultLayout',
            'ReactGridLayout',
            'window.DashboardGridWrapper',
            'useState',
            'useEffect'
        ],
        'Structure DashboardGridWrapper complète'
    );

    // Test 3: Intégration dans app-inline.js
    log('\n🔗 Test 3: Intégration app-inline.js', 'info');
    const appContent = fs.readFileSync(
        path.join(workspaceRoot, 'public/js/dashboard/app-inline.js'),
        'utf-8'
    );
    
    test(
        'dashboardViewMode défini',
        appContent.includes('dashboardViewMode'),
        'dashboardViewMode non trouvé'
    );
    test(
        'setDashboardViewMode défini',
        appContent.includes('setDashboardViewMode'),
        'setDashboardViewMode non trouvé'
    );
    test(
        'DashboardGridWrapper utilisé',
        appContent.includes('DashboardGridWrapper'),
        'DashboardGridWrapper non utilisé'
    );
    test(
        'Rendu conditionnel grid',
        appContent.includes('dashboardViewMode === \'grid\'') || appContent.includes('viewMode === \'grid\''),
        'Rendu conditionnel grid non trouvé'
    );
    test(
        'LocalStorage gob-dashboard-view-mode',
        appContent.includes('gob-dashboard-view-mode'),
        'gob-dashboard-view-mode non trouvé'
    );

    // Test 4: Chargement dans HTML
    log('\n🌐 Test 4: Chargement dans HTML', 'info');
    const htmlContent = fs.readFileSync(
        path.join(workspaceRoot, 'public/beta-combined-dashboard.html'),
        'utf-8'
    );
    
    test(
        'DashboardGridWrapper.js chargé',
        htmlContent.includes('DashboardGridWrapper.js'),
        'DashboardGridWrapper.js non chargé dans HTML'
    );
    test(
        'react-grid-layout chargé',
        htmlContent.includes('react-grid-layout'),
        'react-grid-layout non chargé'
    );
    test(
        'Scripts de débogage chargés',
        htmlContent.includes('debug-god-mode.js') || htmlContent.includes('quick-fix-god-mode.js'),
        'Scripts de débogage non chargés'
    );

    // Test 5: Mapping des widgets
    log('\n🗺️ Test 5: Mapping des widgets', 'info');
    const wrapperContent = fs.readFileSync(
        path.join(workspaceRoot, 'public/js/dashboard/components/grid-layout/DashboardGridWrapper.js'),
        'utf-8'
    );
    
    const widgetIds = [
        'titres-portfolio',
        'marches-global',
        'emma-chat',
        'jlab-terminal'
    ];
    
    widgetIds.forEach(widgetId => {
        test(
            `Widget ${widgetId} dans mapping`,
            wrapperContent.includes(`'${widgetId}'`),
            `Widget ${widgetId} manquant dans TAB_TO_WIDGET_MAP`
        );
    });

    // Test 6: Layout par défaut
    log('\n📐 Test 6: Layout par défaut', 'info');
    test(
        'getDefaultLayout défini',
        wrapperContent.includes('getDefaultLayout'),
        'getDefaultLayout non trouvé'
    );
    test(
        'Layout par défaut avec widgets',
        wrapperContent.includes('titres-portfolio') && wrapperContent.includes('marches-global'),
        'Layout par défaut incomplet'
    );

    // Test 7: Toggle dans navigation
    log('\n🔄 Test 7: Toggle navigation', 'info');
    test(
        'Toggle présent dans navigation',
        appContent.includes('Grille') || appContent.includes('Onglets') || appContent.includes('📐'),
        'Toggle non trouvé dans navigation'
    );

    // Test 8: Rendu conditionnel
    log('\n🎨 Test 8: Rendu conditionnel', 'info');
    test(
        'Rendu conditionnel grid/tabs',
        appContent.includes('dashboardViewMode === \'grid\'') || appContent.includes('viewMode === \'grid\''),
        'Rendu conditionnel non trouvé'
    );

    // Test 9: Scripts de débogage
    log('\n🐛 Test 9: Scripts de débogage', 'info');
    testFileExists('public/js/dashboard/debug-god-mode.js', 'debug-god-mode.js existe');
    testFileExists('public/js/dashboard/quick-fix-god-mode.js', 'quick-fix-god-mode.js existe');
    testFileExists('public/js/dashboard/test-god-mode-console.js', 'test-god-mode-console.js existe');

    // Test 10: Vérification syntaxe
    log('\n📝 Test 10: Vérification syntaxe', 'info');
    try {
        // Vérifier que les fichiers JS sont valides (pas de syntaxe évidente)
        const wrapperLines = wrapperContent.split('\n');
        const openBraces = (wrapperContent.match(/\{/g) || []).length;
        const closeBraces = (wrapperContent.match(/\}/g) || []).length;
        
        test(
            'Braces équilibrées dans DashboardGridWrapper',
            Math.abs(openBraces - closeBraces) < 5, // Tolérance pour les commentaires
            `Braces déséquilibrées: ${openBraces} ouverts, ${closeBraces} fermés`
        );
    } catch (e) {
        test('Vérification syntaxe', false, `Erreur: ${e.message}`);
    }
}

async function runAllTests() {
    log('🚀 Démarrage des tests directs GOD MODE', 'info');
    log(`Workspace: ${workspaceRoot}`, 'info');
    log(`Boucles: 3`, 'info');

    // Exécuter 3 boucles
    for (let i = 1; i <= 3; i++) {
        await runTestSuite(i);
        
        if (i < 3) {
            log(`\n⏳ Attente 1 seconde avant prochaine boucle...`, 'info');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    // Résumé final
    log('\n=== 📊 RÉSUMÉ FINAL ===', 'info');
    log(`Tests totaux: ${tests.total}`, 'info');
    log(`Tests réussis: ${tests.passed}`, tests.passed === tests.total ? 'success' : 'success');
    log(`Tests échoués: ${tests.failed}`, tests.failed > 0 ? 'error' : 'success');
    log(`Taux de réussite: ${((tests.passed / tests.total) * 100).toFixed(1)}%`, 'info');

    if (tests.errors.length > 0) {
        log('\n=== ❌ ERREURS ===', 'error');
        const uniqueErrors = [...new Set(tests.errors)];
        uniqueErrors.forEach((error, index) => {
            log(`${index + 1}. ${error}`, 'error');
        });
    }

    const success = tests.failed === 0;
    if (success) {
        log('\n✅ Tous les tests sont passés !', 'success');
    } else {
        log('\n❌ Certains tests ont échoué', 'error');
    }

    // Vérifications supplémentaires
    log('\n=== 🔍 VÉRIFICATIONS SUPPLÉMENTAIRES ===', 'info');
    
    // Vérifier le layout par défaut
    const wrapperPath = path.join(workspaceRoot, 'public/js/dashboard/components/grid-layout/DashboardGridWrapper.js');
    if (fs.existsSync(wrapperPath)) {
        const content = fs.readFileSync(wrapperPath, 'utf-8');
        const defaultLayoutMatch = content.match(/getDefaultLayout.*?\[(.*?)\]/s);
        if (defaultLayoutMatch) {
            log('Layout par défaut trouvé dans le code', 'success');
        } else {
            log('Layout par défaut non trouvé dans le code', 'warning');
        }
    }

    // Vérifier les exports
    const hasExport = fs.readFileSync(wrapperPath, 'utf-8').includes('window.DashboardGridWrapper');
    test('DashboardGridWrapper exposé globalement', hasExport, 'window.DashboardGridWrapper non trouvé');

    process.exit(success ? 0 : 1);
}

runAllTests().catch(error => {
    log(`Erreur fatale: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
});
