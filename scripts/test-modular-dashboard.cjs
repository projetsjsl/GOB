#!/usr/bin/env node

/**
 * Script de test pour valider le dashboard modulaire
 * Vérifie que tous les modules sont chargés et que dashboard-main.js est complet
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');

console.log('🧪 Tests Dashboard Modulaire\n');
console.log('='.repeat(60));

// 1. Vérifier que dashboard-main.js existe et contient les éléments essentiels
console.log('\n📋 Test 1: Vérification dashboard-main.js');
const dashboardMainPath = path.join(PROJECT_ROOT, 'public/js/dashboard/dashboard-main.js');
if (!fs.existsSync(dashboardMainPath)) {
    console.error('❌ dashboard-main.js non trouvé!');
    process.exit(1);
}

const dashboardMainContent = fs.readFileSync(dashboardMainPath, 'utf-8');

const checks = [
    { name: 'BetaCombinedDashboard component', pattern: /const BetaCombinedDashboard =/ },
    { name: 'toggleTheme function', pattern: /const toggleTheme =/ },
    { name: 'handleTabChange function', pattern: /const handleTabChange =/ },
    { name: 'getTabIcon function', pattern: /const getTabIcon =/ },
    { name: 'withRipple function', pattern: /const withRipple =/ },
    { name: 'ensureAudioReady function', pattern: /const ensureAudioReady =/ },
    { name: 'tabs array configuration', pattern: /const tabs = \[/ },
    { name: 'parseSeekingAlphaRawText function', pattern: /const parseSeekingAlphaRawText =/ },
    { name: 'fetchSeekingAlphaData function', pattern: /const fetchSeekingAlphaData =/ },
    { name: 'fetchSeekingAlphaStockData function', pattern: /const fetchSeekingAlphaStockData =/ },
    { name: 'Header JSX (Bloomberg style)', pattern: /TERMINAL FINANCIER/ },
    { name: 'Sidebar desktop navigation', pattern: /Desktop Sidebar Navigation/ },
    { name: 'Mobile Bottom Navigation Bar', pattern: /Mobile Bottom Navigation Bar/ },
    { name: 'Intro overlays', pattern: /Intro Emma IA/ },
    { name: 'Loading screen', pattern: /showLoadingScreen/ },
    { name: 'TradingView Ticker Tape', pattern: /tradingview-widget-container/ },
    { name: 'window.BetaCombinedDashboard exposure', pattern: /window\.BetaCombinedDashboard = BetaCombinedDashboard/ },
    { name: 'getUserLoginId function', pattern: /const getUserLoginId =/ },
    { name: 'preloaded-dashboard-data support', pattern: /preloaded-dashboard-data/ },
];

let passed = 0;
let failed = 0;

checks.forEach(check => {
    if (check.pattern.test(dashboardMainContent)) {
        console.log(`  ✅ ${check.name}`);
        passed++;
    } else {
        console.log(`  ❌ ${check.name}`);
        failed++;
    }
});

console.log(`\n📊 Résultat: ${passed}/${checks.length} tests passés`);

// 2. Vérifier que beta-combined-dashboard-modular.html contient le rendu React
console.log('\n📋 Test 2: Vérification beta-combined-dashboard-modular.html');
const modularHtmlPath = path.join(PROJECT_ROOT, 'public/beta-combined-dashboard-modular.html');
if (!fs.existsSync(modularHtmlPath)) {
    console.error('❌ beta-combined-dashboard-modular.html non trouvé!');
    process.exit(1);
}

const modularHtmlContent = fs.readFileSync(modularHtmlPath, 'utf-8');

const htmlChecks = [
    { name: 'Root div element', pattern: /<div id="root"><\/div>/ },
    { name: 'dashboard-main.js script', pattern: /dashboard-main\.js/ },
    { name: 'ReactDOM.render script', pattern: /ReactDOM\.render/ },
    { name: 'BetaCombinedDashboard check', pattern: /window\.BetaCombinedDashboard/ },
    { name: 'All tab modules loaded', pattern: /FinanceProTab\.js|JLabUnifiedTab\.js/ },
];

let htmlPassed = 0;
let htmlFailed = 0;

htmlChecks.forEach(check => {
    if (check.pattern.test(modularHtmlContent)) {
        console.log(`  ✅ ${check.name}`);
        htmlPassed++;
    } else {
        console.log(`  ❌ ${check.name}`);
        htmlFailed++;
    }
});

console.log(`\n📊 Résultat: ${htmlPassed}/${htmlChecks.length} tests passés`);

// 3. Vérifier que tous les modules tab existent
console.log('\n📋 Test 3: Vérification modules Tab');
const tabsDir = path.join(PROJECT_ROOT, 'public/js/dashboard/components/tabs');
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

let modulesPassed = 0;
let modulesFailed = 0;

expectedModules.forEach(module => {
    const modulePath = path.join(tabsDir, module);
    if (fs.existsSync(modulePath)) {
        const moduleContent = fs.readFileSync(modulePath, 'utf-8');
        // Vérifier que le module expose window.*
        const moduleName = module.replace('.js', '');
        const windowPattern = new RegExp(`window\\.${moduleName}\\s*=`);
        if (windowPattern.test(moduleContent)) {
            console.log(`  ✅ ${module} (avec window.* exposure)`);
            modulesPassed++;
        } else {
            console.log(`  ⚠️  ${module} (sans window.* exposure)`);
            modulesFailed++;
        }
    } else {
        console.log(`  ❌ ${module} (fichier manquant)`);
        modulesFailed++;
    }
});

console.log(`\n📊 Résultat: ${modulesPassed}/${expectedModules.length} modules valides`);

// Résumé final
console.log('\n' + '='.repeat(60));
console.log('📊 RÉSUMÉ FINAL\n');

const totalPassed = passed + htmlPassed + modulesPassed;
const totalFailed = failed + htmlFailed + modulesFailed;
const totalChecks = checks.length + htmlChecks.length + expectedModules.length;

console.log(`✅ Tests passés: ${totalPassed}/${totalChecks}`);
console.log(`❌ Tests échoués: ${totalFailed}/${totalChecks}`);

if (totalFailed === 0) {
    console.log('\n🎉 Tous les tests sont passés! Le dashboard modulaire est prêt.');
    process.exit(0);
} else {
    console.log('\n⚠️  Certains tests ont échoué. Vérifiez les erreurs ci-dessus.');
    process.exit(1);
}

