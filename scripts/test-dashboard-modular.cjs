#!/usr/bin/env node
/**
 * Script de test automatisé pour la version modulaire du dashboard
 * Vérifie que tous les composants sont chargés et fonctionnels
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Tests du Dashboard Modulaire');
console.log('================================\n');

const errors = [];
const warnings = [];
let passedTests = 0;
let totalTests = 0;

const runTest = (name, testFunction) => {
    totalTests++;
    try {
        testFunction();
        console.log(`  ✅ ${name}`);
        passedTests++;
    } catch (error) {
        console.error(`  ❌ ${name}: ${error.message}`);
        errors.push({ test: name, error: error.message });
    }
};

// Test 1: Vérifier que le fichier HTML modulaire existe
console.log('📄 Test 1: Vérification des fichiers...');
runTest('Fichier beta-combined-dashboard.html existe', () => {
    const htmlPath = path.join(__dirname, '../public/beta-combined-dashboard.html');
    if (!fs.existsSync(htmlPath)) {
        throw new Error('Fichier beta-combined-dashboard.html introuvable');
    }
});

runTest('Fichier beta-combined-dashboard.html.backup existe (sauvegarde)', () => {
    const backupPath = path.join(__dirname, '../public/beta-combined-dashboard.html.backup');
    if (!fs.existsSync(backupPath)) {
        warnings.push('Backup non trouvé - rollback impossible');
    }
});

console.log('');

// Test 2: Vérifier la structure HTML
console.log('📋 Test 2: Structure HTML...');
const htmlPath = path.join(__dirname, '../public/beta-combined-dashboard.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

runTest('Élément root présent', () => {
    if (!htmlContent.includes('<div id="root"></div>')) {
        throw new Error('Élément <div id="root"></div> manquant');
    }
});

runTest('ReactDOM.render présent', () => {
    if (!htmlContent.includes('ReactDOM.render')) {
        throw new Error('ReactDOM.render manquant');
    }
});

runTest('auth-guard.js chargé', () => {
    if (!htmlContent.includes('auth-guard.js')) {
        throw new Error('auth-guard.js non chargé');
    }
});

runTest('dashboard-main.js chargé', () => {
    if (!htmlContent.includes('dashboard-main.js')) {
        throw new Error('dashboard-main.js non chargé');
    }
});

console.log('');

// Test 3: Vérifier tous les modules
console.log('📦 Test 3: Modules Tab...');
const expectedModules = [
    'PlusTab.js',
    'YieldCurveTab.js',
    'MarketsEconomyTab.js',
    'EconomicCalendarTab.js',
    'InvestingCalendarTab.js',
    'EmmaSmsPanel.js',
    'AdminJSLaiTab.js',
    'AskEmmaTab.js',
    'DansWatchlistTab.js',
    'StocksNewsTab.js',
    'IntelliStocksTab.js',
    'EmailBriefingsTab.js',
    'ScrappingSATab.js',
    'SeekingAlphaTab.js',
    'FinanceProTab.js',
    'JLabUnifiedTab.js'
];

const modulesPath = path.join(__dirname, '../public/js/dashboard/components/tabs');
expectedModules.forEach(module => {
    runTest(`Module ${module} présent`, () => {
        const modulePath = path.join(modulesPath, module);
        if (!fs.existsSync(modulePath)) {
            throw new Error(`Module ${module} introuvable`);
        }
    });
    
    runTest(`Module ${module} chargé dans HTML`, () => {
        if (!htmlContent.includes(module)) {
            throw new Error(`Module ${module} non référencé dans HTML`);
        }
    });
});

console.log('');

// Test 4: Vérifier les dépendances
console.log('📚 Test 4: Dépendances...');
const dependencies = [
    { name: 'utils.js', path: '../public/js/dashboard/utils.js' },
    { name: 'api-helpers.js', path: '../public/js/dashboard/api-helpers.js' },
    { name: 'cache-manager.js', path: '../public/js/dashboard/cache-manager.js' },
    { name: 'common.js', path: '../public/js/dashboard/components/common.js' }
];

dependencies.forEach(dep => {
    runTest(`Dépendance ${dep.name} présente`, () => {
        const depPath = path.join(__dirname, dep.path);
        if (!fs.existsSync(depPath)) {
            throw new Error(`Dépendance ${dep.name} introuvable`);
        }
    });
    
    runTest(`Dépendance ${dep.name} chargée dans HTML`, () => {
        if (!htmlContent.includes(dep.name)) {
            throw new Error(`Dépendance ${dep.name} non référencée dans HTML`);
        }
    });
});

console.log('');

// Test 5: Vérifier dashboard-main.js
console.log('🔧 Test 5: dashboard-main.js...');
const dashboardMainPath = path.join(__dirname, '../public/js/dashboard/dashboard-main.js');
if (fs.existsSync(dashboardMainPath)) {
    const dashboardMainContent = fs.readFileSync(dashboardMainPath, 'utf-8');
    
    runTest('BetaCombinedDashboard défini', () => {
        if (!dashboardMainContent.includes('const BetaCombinedDashboard')) {
            throw new Error('Composant BetaCombinedDashboard non défini');
        }
    });
    
    runTest('BetaCombinedDashboard exposé globalement', () => {
        if (!dashboardMainContent.includes('window.BetaCombinedDashboard')) {
            throw new Error('BetaCombinedDashboard non exposé globalement');
        }
    });
    
    runTest('useState utilisé', () => {
        if (!dashboardMainContent.includes('useState')) {
            throw new Error('useState non utilisé (composant peut être incomplet)');
        }
    });
    
    runTest('useEffect utilisé', () => {
        if (!dashboardMainContent.includes('useEffect')) {
            warnings.push('useEffect non utilisé - vérifier que les effets sont présents');
        }
    });
} else {
    runTest('dashboard-main.js existe', () => {
        throw new Error('dashboard-main.js introuvable');
    });
}

console.log('');

// Test 6: Vérifier l'exposition globale des modules
console.log('🌐 Test 6: Exposition globale des modules...');
expectedModules.forEach(module => {
    const modulePath = path.join(modulesPath, module);
    if (fs.existsSync(modulePath)) {
        const moduleContent = fs.readFileSync(modulePath, 'utf-8');
        const componentName = module.replace('.js', '');
        
        runTest(`${componentName} exposé via window.*`, () => {
            if (!moduleContent.includes(`window.${componentName}`)) {
                throw new Error(`${componentName} non exposé globalement`);
            }
        });
    }
});

console.log('');

// Test 7: Vérifier l'authentification
console.log('🔐 Test 7: Authentification...');
const loginPath = path.join(__dirname, '../public/login.html');
if (fs.existsSync(loginPath)) {
    const loginContent = fs.readFileSync(loginPath, 'utf-8');
    
    runTest('Redirection vers beta-combined-dashboard.html après login', () => {
        if (!loginContent.includes('beta-combined-dashboard.html')) {
            throw new Error('Redirection vers dashboard non trouvée dans login.html');
        }
    });
} else {
    warnings.push('login.html introuvable');
}

const authGuardPath = path.join(__dirname, '../public/js/auth-guard.js');
const authGuardPath2 = path.join(__dirname, '../public/auth-guard.js');
runTest('auth-guard.js présent', () => {
    if (!fs.existsSync(authGuardPath) && !fs.existsSync(authGuardPath2)) {
        throw new Error('auth-guard.js introuvable');
    }
});

console.log('');

// Test 8: Vérifier la syntaxe des modules principaux
console.log('🔍 Test 8: Syntaxe des modules...');
const criticalModules = [
    'dashboard-main.js',
    'PlusTab.js',
    'IntelliStocksTab.js',
    'AskEmmaTab.js'
];

criticalModules.forEach(module => {
    let modulePath;
    if (module === 'dashboard-main.js') {
        modulePath = path.join(__dirname, '../public/js/dashboard', module);
    } else {
        modulePath = path.join(modulesPath, module);
    }
    
    if (fs.existsSync(modulePath)) {
        runTest(`Syntaxe ${module} valide`, () => {
            const moduleContent = fs.readFileSync(modulePath, 'utf-8');
            
            // Vérifications basiques de syntaxe
            const openBraces = (moduleContent.match(/{/g) || []).length;
            const closeBraces = (moduleContent.match(/}/g) || []).length;
            const openParens = (moduleContent.match(/\(/g) || []).length;
            const closeParens = (moduleContent.match(/\)/g) || []).length;
            
            if (openBraces !== closeBraces) {
                throw new Error(`Accolades non équilibrées: ${openBraces} ouvertures, ${closeBraces} fermetures`);
            }
            
            if (openParens !== closeParens) {
                throw new Error(`Parenthèses non équilibrées: ${openParens} ouvertures, ${closeParens} fermetures`);
            }
        });
    }
});

console.log('');

// Résumé
console.log('================================');
console.log('📊 RÉSUMÉ DES TESTS');
console.log('================================\n');

console.log(`✅ Tests passés: ${passedTests}/${totalTests}`);
console.log(`❌ Tests échoués: ${totalTests - passedTests}/${totalTests}`);

if (warnings.length > 0) {
    console.log(`\n⚠️  Avertissements: ${warnings.length}`);
    warnings.forEach(warn => console.log(`  ⚠️  ${warn}`));
}

if (errors.length > 0) {
    console.log(`\n❌ Erreurs: ${errors.length}`);
    errors.forEach(err => console.log(`  ❌ ${err.test}: ${err.error}`));
    console.log('\n❌ Des corrections sont nécessaires.');
    process.exit(1);
} else {
    console.log('\n✅ Tous les tests sont passés !');
    console.log('✅ Le dashboard modulaire est prêt à être utilisé.\n');
    console.log('📝 Prochaines étapes:');
    console.log('   1. Tester manuellement dans le navigateur');
    console.log('   2. Vérifier l\'authentification');
    console.log('   3. Tester tous les onglets');
    console.log('   4. Vérifier les fonctionnalités principales\n');
    process.exit(0);
}

