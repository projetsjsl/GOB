#!/usr/bin/env node
/**
 * Script d'extraction des fonctionnalités
 * Extrait tous les composants, hooks, fonctions de la version actuelle
 */

const fs = require('fs');
const path = require('path');

const DASHBOARD_FILE = path.join(__dirname, '../public/beta-combined-dashboard.html');

console.log('🔍 Extraction des fonctionnalités de la version actuelle\n');
console.log('='.repeat(60));

if (!fs.existsSync(DASHBOARD_FILE)) {
    console.error(`❌ Fichier non trouvé: ${DASHBOARD_FILE}`);
    process.exit(1);
}

const content = fs.readFileSync(DASHBOARD_FILE, 'utf8');

// 1. Extraire tous les composants Tab
console.log('\n📋 1. Composants Tab\n');

const tabComponents = [];
const tabPattern = /const\s+(\w+Tab)\s*=\s*(?:React\.memo\()?\(/g;
let match;

while ((match = tabPattern.exec(content)) !== null) {
    const componentName = match[1];
    if (!tabComponents.includes(componentName)) {
        tabComponents.push(componentName);
    }
}

// Ajouter les composants connus qui pourraient avoir une syntaxe différente
const knownTabs = [
    'AdminJSLaiTab', 'AskEmmaTab', 'DansWatchlistTab', 'EconomicCalendarTab',
    'EmailBriefingsTab', 'EmmaSmsPanel', 'IntelliStocksTab', 'InvestingCalendarTab',
    'MarketsEconomyTab', 'PlusTab', 'ScrappingSATab', 'SeekingAlphaTab',
    'StocksNewsTab', 'YieldCurveTab', 'JLabUnifiedTab', 'FinanceProTab'
];

knownTabs.forEach(tab => {
    if (!tabComponents.includes(tab) && content.includes(tab)) {
        tabComponents.push(tab);
    }
});

tabComponents.sort().forEach(tab => {
    console.log(`  ✅ ${tab}`);
});

// 2. Compter les useState
console.log('\n🔢 2. useState hooks\n');

const useStatePattern = /const\s+\[[^\]]+\]\s*=\s*useState\(/g;
const useStateMatches = content.match(useStatePattern) || [];
const useStateCount = useStateMatches.length;

console.log(`  Total: ${useStateCount} déclarations`);

// Catégoriser par domaine (approximation)
const uiStates = (content.match(/useState\([^)]*(?:show|open|visible|active|selected|expanded)/gi) || []).length;
const dataStates = (content.match(/useState\([^)]*(?:data|ticker|stock|news|calendar)/gi) || []).length;
const cacheStates = (content.match(/useState\([^)]*(?:cache|settings)/gi) || []).length;
const emmaStates = (content.match(/useState\([^)]*(?:emma|message|chat|conversation)/gi) || []).length;
const adminStates = (content.match(/useState\([^)]*(?:admin|log|health|debug)/gi) || []).length;

console.log(`  UI: ~${uiStates}`);
console.log(`  Data: ~${dataStates}`);
console.log(`  Cache: ~${cacheStates}`);
console.log(`  Emma: ~${emmaStates}`);
console.log(`  Admin: ~${adminStates}`);

// 3. Compter les useEffect
console.log('\n🔄 3. useEffect hooks\n');

const useEffectPattern = /useEffect\(/g;
const useEffectMatches = content.match(useEffectPattern) || [];
const useEffectCount = useEffectMatches.length;

console.log(`  Total: ${useEffectCount} effets`);

// Identifier les effets critiques (API calls)
const apiEffectPattern = /useEffect\([^)]*=>\s*\{[^}]*fetch\(/g;
const apiEffects = (content.match(apiEffectPattern) || []).length;

console.log(`  Avec API calls: ~${apiEffects}`);

// 4. Extraire fonctions utilitaires
console.log('\n🛠️  4. Fonctions utilitaires\n');

const utilityFunctions = [];

// Fonctions API
const apiFunctions = [
    'fetchStockData', 'fetchNews', 'fetchLatestNewsForTickers',
    'loadTickersFromSupabase', 'refreshAllStocks', 'fetchEconomicCalendar',
    'fetchSeekingAlpha', 'fetchYieldCurve'
];

// Fonctions de transformation
const transformFunctions = [
    'formatNumber', 'cleanText', 'getNewsIcon', 'getSourceCredibility',
    'sortNewsByCredibility', 'isFrenchArticle', 'getCompanyLogo',
    'getGradeColor', 'parseSeekingAlphaRawText', 'getTabIcon'
];

// Fonctions de validation
const validationFunctions = [
    'validateTicker', 'isValidSymbol'
];

[...apiFunctions, ...transformFunctions, ...validationFunctions].forEach(func => {
    if (content.includes(func)) {
        utilityFunctions.push(func);
    }
});

console.log(`  Fonctions API: ${apiFunctions.filter(f => utilityFunctions.includes(f)).length}`);
console.log(`  Fonctions transformation: ${transformFunctions.filter(f => utilityFunctions.includes(f)).length}`);
console.log(`  Fonctions validation: ${validationFunctions.filter(f => utilityFunctions.includes(f)).length}`);

// 5. Intégrations externes
console.log('\n🌐 5. Intégrations externes\n');

const integrations = {
    'APIs': ['/api/fmp', '/api/marketdata', '/api/gemini/chat', '/api/emma-agent', 
             '/api/chat', '/api/finance-snapshots', '/api/supabase-watchlist'],
    'Services': ['Twilio', 'Resend', 'Facebook Messenger', 'Supabase'],
    'Widgets': ['TradingView', 'Chart.js', 'Recharts', 'Lightweight Charts'],
    'Bibliothèques': ['React', 'Babel', 'Tailwind']
};

Object.entries(integrations).forEach(([category, items]) => {
    const found = items.filter(item => 
        content.includes(item) || 
        content.toLowerCase().includes(item.toLowerCase())
    );
    console.log(`  ${category}: ${found.length}/${items.length}`);
    found.forEach(item => console.log(`    ✅ ${item}`));
    items.filter(item => !found.includes(item)).forEach(item => {
        console.log(`    ❌ ${item}`);
    });
});

// 6. Sauvegarder résultats
const results = {
    tabComponents: tabComponents.sort(),
    useStateCount,
    useStateByDomain: {
        ui: uiStates,
        data: dataStates,
        cache: cacheStates,
        emma: emmaStates,
        admin: adminStates
    },
    useEffectCount,
    apiEffectsCount: apiEffects,
    utilityFunctions: utilityFunctions.sort(),
    integrations
};

const outputFile = path.join(__dirname, '../docs/EXTRACTION_FONCTIONNALITES.json');
fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));

console.log('\n' + '='.repeat(60));
console.log('\n✅ Extraction terminée');
console.log(`📄 Résultats sauvegardés dans: ${outputFile}\n`);

