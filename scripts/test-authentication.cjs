#!/usr/bin/env node
/**
 * Script de test de l'authentification
 * Vérifie que tous les points critiques d'authentification sont préservés
 */

const fs = require('fs');
const path = require('path');

const DASHBOARD_MODULAR = path.join(__dirname, '../public/beta-combined-dashboard-modular.html');
const DASHBOARD_ACTUAL = path.join(__dirname, '../public/beta-combined-dashboard.html');
const DASHBOARD_MAIN = path.join(__dirname, '../public/js/dashboard/dashboard-main.js');
const AUTH_GUARD = path.join(__dirname, '../public/js/auth-guard.js');

console.log('🔐 Test de vérification de l\'authentification\n');
console.log('='.repeat(60));

let allTestsPassed = true;

// Test 1: auth-guard.js chargé en premier
console.log('\n✅ Test 1: auth-guard.js chargé en premier\n');

const checkAuthGuard = (filePath, fileName) => {
    if (!fs.existsSync(filePath)) {
        console.log(`  ❌ ${fileName} - Fichier non trouvé`);
        return false;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const authGuardIndex = content.indexOf('auth-guard.js');
    const babelScripts = content.indexOf('text/babel');
    
    if (authGuardIndex === -1) {
        console.log(`  ❌ ${fileName} - auth-guard.js non trouvé`);
        return false;
    }
    
    if (babelScripts !== -1 && authGuardIndex > babelScripts) {
        console.log(`  ⚠️  ${fileName} - auth-guard.js chargé APRÈS les scripts Babel`);
        console.log(`     Position: ${authGuardIndex}, Babel scripts: ${babelScripts}`);
        return false;
    }
    
    console.log(`  ✅ ${fileName} - auth-guard.js présent et chargé avant Babel`);
    return true;
};

const test1a = checkAuthGuard(DASHBOARD_ACTUAL, 'Version actuelle');
const test1b = checkAuthGuard(DASHBOARD_MODULAR, 'Version modulaire');

if (!test1a || !test1b) {
    allTestsPassed = false;
}

// Test 2: getUserLoginId() présent
console.log('\n✅ Test 2: getUserLoginId() présent\n');

const checkGetUserLoginId = () => {
    // Vérifier dans version actuelle
    const actualContent = fs.readFileSync(DASHBOARD_ACTUAL, 'utf8');
    const hasInActual = actualContent.includes('getUserLoginId') && 
                       actualContent.includes('sessionStorage.getItem(\'gob-user\')');
    
    // Vérifier dans dashboard-main.js
    const mainContent = fs.readFileSync(DASHBOARD_MAIN, 'utf8');
    const hasInMain = mainContent.includes('getUserLoginId');
    
    // Vérifier dans utils.js
    const utilsPath = path.join(__dirname, '../public/js/dashboard/utils.js');
    const utilsContent = fs.readFileSync(utilsPath, 'utf8');
    const hasInUtils = utilsContent.includes('getUserLoginId');
    
    console.log(`  Version actuelle: ${hasInActual ? '✅' : '❌'} getUserLoginId présent`);
    console.log(`  dashboard-main.js: ${hasInMain ? '✅' : '⚠️ '} getUserLoginId ${hasInMain ? 'présent' : 'manquant (à extraire)'}`);
    console.log(`  utils.js: ${hasInUtils ? '✅' : '❌'} getUserLoginId ${hasInUtils ? 'présent' : 'manquant'}`);
    
    if (!hasInActual) {
        console.log('  ❌ CRITIQUE: getUserLoginId manquant dans version actuelle');
        return false;
    }
    
    if (!hasInMain && !hasInUtils) {
        console.log('  ⚠️  ATTENTION: getUserLoginId doit être extrait dans dashboard-main.js ou utils.js');
        return false;
    }
    
    return true;
};

const test2 = checkGetUserLoginId();
if (!test2) {
    allTestsPassed = false;
}

// Test 3: window.GOB_AUTH créé par auth-guard.js
console.log('\n✅ Test 3: window.GOB_AUTH créé par auth-guard.js\n');

const checkGOBAuth = () => {
    if (!fs.existsSync(AUTH_GUARD)) {
        console.log('  ❌ auth-guard.js non trouvé');
        return false;
    }
    
    const authContent = fs.readFileSync(AUTH_GUARD, 'utf8');
    const hasGOBAuth = authContent.includes('window.GOB_AUTH');
    
    if (hasGOBAuth) {
        console.log('  ✅ window.GOB_AUTH créé dans auth-guard.js');
        return true;
    } else {
        console.log('  ❌ window.GOB_AUTH non créé dans auth-guard.js');
        return false;
    }
};

const test3 = checkGOBAuth();
if (!test3) {
    allTestsPassed = false;
}

// Test 4: preloaded-dashboard-data utilisé
console.log('\n✅ Test 4: preloaded-dashboard-data utilisé\n');

const checkPreloadedData = () => {
    const actualContent = fs.readFileSync(DASHBOARD_ACTUAL, 'utf8');
    const preloadedMatches = actualContent.match(/preloaded-dashboard-data/g) || [];
    const count = preloadedMatches.length;
    
    console.log(`  Version actuelle: ${count} utilisations de preloaded-dashboard-data`);
    
    if (count === 0) {
        console.log('  ⚠️  Aucune utilisation détectée (peut être normal)');
        return true;
    }
    
    // Vérifier dans modules
    const tabsDir = path.join(__dirname, '../public/js/dashboard/components/tabs');
    const modules = fs.readdirSync(tabsDir).filter(f => f.endsWith('.js'));
    
    let modulesWithPreloaded = 0;
    modules.forEach(module => {
        const modulePath = path.join(tabsDir, module);
        const moduleContent = fs.readFileSync(modulePath, 'utf8');
        if (moduleContent.includes('preloaded-dashboard-data')) {
            modulesWithPreloaded++;
            console.log(`    ✅ ${module} utilise preloaded-dashboard-data`);
        }
    });
    
    if (modulesWithPreloaded < count) {
        console.log(`  ⚠️  ${count - modulesWithPreloaded} utilisation(s) manquante(s) dans modules`);
        return false;
    }
    
    return true;
};

const test4 = checkPreloadedData();
if (!test4) {
    allTestsPassed = false;
}

// Test 5: sessionStorage accessible
console.log('\n✅ Test 5: sessionStorage accessible\n');

const checkSessionStorage = () => {
    const actualContent = fs.readFileSync(DASHBOARD_ACTUAL, 'utf8');
    const hasSessionStorage = actualContent.includes('sessionStorage.getItem(\'gob-user\')') ||
                             actualContent.includes('sessionStorage.getItem("gob-user")');
    
    const mainContent = fs.readFileSync(DASHBOARD_MAIN, 'utf8');
    const hasInMain = mainContent.includes('sessionStorage');
    
    console.log(`  Version actuelle: ${hasSessionStorage ? '✅' : '❌'} sessionStorage utilisé`);
    console.log(`  dashboard-main.js: ${hasInMain ? '✅' : '⚠️ '} sessionStorage ${hasInMain ? 'utilisé' : 'non utilisé (peut être OK)'}`);
    
    return hasSessionStorage;
};

const test5 = checkSessionStorage();
if (!test5) {
    allTestsPassed = false;
}

// Résumé
console.log('\n' + '='.repeat(60));
console.log('\n📊 Résumé des tests d\'authentification\n');

const tests = [
    { name: 'auth-guard.js chargé en premier', passed: test1a && test1b },
    { name: 'getUserLoginId() présent', passed: test2 },
    { name: 'window.GOB_AUTH créé', passed: test3 },
    { name: 'preloaded-dashboard-data utilisé', passed: test4 },
    { name: 'sessionStorage accessible', passed: test5 }
];

tests.forEach(test => {
    console.log(`  ${test.passed ? '✅' : '❌'} ${test.name}`);
});

const passedCount = tests.filter(t => t.passed).length;
console.log(`\n  Résultat: ${passedCount}/${tests.length} tests passés`);

console.log('\n' + '='.repeat(60));
if (allTestsPassed) {
    console.log('\n✅ Tous les points critiques d\'authentification sont préservés\n');
    process.exit(0);
} else {
    console.log('\n⚠️  Certains points critiques nécessitent attention\n');
    console.log('📄 Voir docs/VERIFICATION_AUTHENTIFICATION.md pour détails\n');
    process.exit(1);
}

