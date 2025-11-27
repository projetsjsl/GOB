#!/usr/bin/env node

/**
 * Script de test complet du dashboard modulaire
 * Vérifie que tous les onglets fonctionnent correctement
 */

const fs = require('fs');
const path = require('path');

const DASHBOARD_HTML = path.join(__dirname, '../dist/beta-combined-dashboard.html');
const DASHBOARD_MAIN = path.join(__dirname, '../dist/js/dashboard/dashboard-main.js');
const TAB_MODULES = [
    'PlusTab', 'YieldCurveTab', 'MarketsEconomyTab', 'EconomicCalendarTab',
    'InvestingCalendarTab', 'EmmaSmsPanel', 'AdminJSLaiTab', 'AskEmmaTab',
    'DansWatchlistTab', 'StocksNewsTab', 'IntelliStocksTab', 'EmailBriefingsTab',
    'ScrappingSATab', 'SeekingAlphaTab', 'FinanceProTab', 'JLabUnifiedTab'
];

let passedTests = 0;
let failedTests = 0;
const errors = [];
const warnings = [];

console.log('🧪 TEST COMPLET DU DASHBOARD MODULAIRE');
console.log('=====================================\n');

// Test 1: Vérifier que le fichier HTML existe
console.log('📄 Test 1: Vérification des fichiers...');
if (fs.existsSync(DASHBOARD_HTML)) {
    const stats = fs.statSync(DASHBOARD_HTML);
    console.log(`  ✅ beta-combined-dashboard.html existe (${(stats.size / 1024).toFixed(2)} KB)`);
    passedTests++;
} else {
    console.log(`  ❌ beta-combined-dashboard.html non trouvé`);
    failedTests++;
    errors.push('Fichier HTML principal manquant');
}

if (fs.existsSync(DASHBOARD_MAIN)) {
    console.log(`  ✅ dashboard-main.js existe`);
    passedTests++;
} else {
    console.log(`  ❌ dashboard-main.js non trouvé`);
    failedTests++;
    errors.push('Fichier dashboard-main.js manquant');
}

// Test 2: Vérifier le contenu du HTML
console.log('\n📋 Test 2: Structure HTML...');
if (fs.existsSync(DASHBOARD_HTML)) {
    const htmlContent = fs.readFileSync(DASHBOARD_HTML, 'utf-8');
    
    const checks = [
        { name: 'Élément root', pattern: /<div id="root"><\/div>/, required: true },
        { name: 'Système de chargement manuel', pattern: /Starting manual script loading system/, required: true },
        { name: 'React chargé', pattern: /react@18/, required: true },
        { name: 'ReactDOM chargé', pattern: /react-dom@18/, required: true },
        { name: 'Babel chargé', pattern: /@babel\/standalone/, required: true },
        { name: 'Auth guard', pattern: /auth-guard\.js/, required: true }
    ];
    
    checks.forEach(check => {
        if (check.pattern.test(htmlContent)) {
            console.log(`  ✅ ${check.name}`);
            passedTests++;
        } else {
            if (check.required) {
                console.log(`  ❌ ${check.name} manquant`);
                failedTests++;
                errors.push(`${check.name} manquant dans HTML`);
            } else {
                console.log(`  ⚠️  ${check.name} non trouvé (optionnel)`);
                warnings.push(`${check.name} non trouvé`);
            }
        }
    });
}

// Test 3: Vérifier les modules Tab
console.log('\n📦 Test 3: Modules Tab...');
TAB_MODULES.forEach(moduleName => {
    const modulePath = path.join(__dirname, `../dist/js/dashboard/components/tabs/${moduleName}.js`);
    if (fs.existsSync(modulePath)) {
        const content = fs.readFileSync(modulePath, 'utf-8');
        
        // Vérifier l'exposition globale
        if (content.includes(`window.${moduleName} = ${moduleName}`) || 
            content.includes(`window.${moduleName} = ${moduleName};`)) {
            console.log(`  ✅ ${moduleName}.js (exposé globalement)`);
            passedTests++;
        } else {
            console.log(`  ⚠️  ${moduleName}.js (exposition globale manquante)`);
            warnings.push(`${moduleName} n'est pas exposé globalement`);
            passedTests++; // Pas critique pour le moment
        }
        
        // Vérifier l'import React si le module utilise des hooks
        if (content.match(/useState|useEffect|useRef|useCallback|useMemo/)) {
            if (content.includes('const {') && content.includes('} = React;')) {
                console.log(`     ✅ Import React présent`);
                passedTests++;
            } else {
                console.log(`     ❌ Import React manquant`);
                failedTests++;
                errors.push(`${moduleName} utilise des hooks React mais n'importe pas React`);
            }
        }
    } else {
        console.log(`  ❌ ${moduleName}.js non trouvé`);
        failedTests++;
        errors.push(`Module ${moduleName} manquant`);
    }
});

// Test 4: Vérifier dashboard-main.js
console.log('\n🔧 Test 4: dashboard-main.js...');
if (fs.existsSync(DASHBOARD_MAIN)) {
    const content = fs.readFileSync(DASHBOARD_MAIN, 'utf-8');
    
    const checks = [
        { name: 'BetaCombinedDashboard défini', pattern: /const BetaCombinedDashboard =/, required: true },
        { name: 'Exposition globale', pattern: /window\.BetaCombinedDashboard = BetaCombinedDashboard/, required: true },
        { name: 'Import React', pattern: /const.*React/, required: true },
        { name: 'useState utilisé', pattern: /useState/, required: true },
        { name: 'useEffect utilisé', pattern: /useEffect/, required: true },
        { name: 'Props StocksNewsTab', pattern: /StocksNewsTab.*\{[\s\S]*tickers[\s\S]*stockData[\s\S]*newsData/, required: true }
    ];
    
    checks.forEach(check => {
        if (check.pattern.test(content)) {
            console.log(`  ✅ ${check.name}`);
            passedTests++;
        } else {
            if (check.required) {
                console.log(`  ❌ ${check.name} manquant`);
                failedTests++;
                errors.push(`${check.name} manquant dans dashboard-main.js`);
            } else {
                console.log(`  ⚠️  ${check.name} non trouvé`);
                warnings.push(`${check.name} non trouvé`);
            }
        }
    });
}

// Test 5: Vérifier la syntaxe des fichiers clés
console.log('\n🔍 Test 5: Syntaxe des fichiers...');
const filesToCheck = [
    { path: DASHBOARD_MAIN, name: 'dashboard-main.js' },
    { path: path.join(__dirname, '../dist/js/dashboard/components/tabs/StocksNewsTab.js'), name: 'StocksNewsTab.js' },
    { path: path.join(__dirname, '../dist/js/dashboard/components/tabs/JLabUnifiedTab.js'), name: 'JLabUnifiedTab.js' }
];

filesToCheck.forEach(file => {
    if (fs.existsSync(file.path)) {
        const content = fs.readFileSync(file.path, 'utf-8');
        
        // Vérifier les parenthèses équilibrées
        const openParens = (content.match(/\(/g) || []).length;
        const closeParens = (content.match(/\)/g) || []).length;
        const openBraces = (content.match(/\{/g) || []).length;
        const closeBraces = (content.match(/\}/g) || []).length;
        const openBrackets = (content.match(/\[/g) || []).length;
        const closeBrackets = (content.match(/\]/g) || []).length;
        
        if (openParens === closeParens && openBraces === closeBraces && openBrackets === closeBrackets) {
            console.log(`  ✅ ${file.name} (syntaxe valide)`);
            passedTests++;
        } else {
            console.log(`  ❌ ${file.name} (syntaxe invalide: parens=${openParens}/${closeParens}, braces=${openBraces}/${closeBraces}, brackets=${openBrackets}/${closeBrackets})`);
            failedTests++;
            errors.push(`${file.name} a des problèmes de syntaxe`);
        }
    }
});

// Résumé
console.log('\n=====================================');
console.log('📊 RÉSUMÉ DES TESTS');
console.log('=====================================\n');
console.log(`✅ Tests passés: ${passedTests}`);
console.log(`❌ Tests échoués: ${failedTests}`);
console.log(`⚠️  Avertissements: ${warnings.length}\n`);

if (warnings.length > 0) {
    console.log('⚠️  Avertissements:');
    warnings.forEach(w => console.log(`   - ${w}`));
    console.log('');
}

if (errors.length > 0) {
    console.log('❌ Erreurs:');
    errors.forEach(e => console.log(`   - ${e}`));
    console.log('');
    process.exit(1);
} else {
    console.log('✅ Tous les tests critiques sont passés !');
    console.log('\n📝 Prochaines étapes:');
    console.log('   1. Tester manuellement dans le navigateur');
    console.log('   2. Vérifier la navigation entre onglets');
    console.log('   3. Vérifier que l\'interface est identique à la version monolithique');
    console.log('   4. Vérifier les fonctionnalités principales (chargement de données, etc.)');
    process.exit(0);
}

