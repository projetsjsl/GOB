#!/usr/bin/env node
/**
 * Script de validation de l'architecture modulaire
 * Vérifie que chaque onglet = 1 module avec pattern d'exposition correct
 */

const fs = require('fs');
const path = require('path');

const DASHBOARD_DIR = path.join(__dirname, '../public/js/dashboard');
const TABS_DIR = path.join(DASHBOARD_DIR, 'components/tabs');

// Modules attendus selon le plan
const EXPECTED_MODULES = [
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
    'SeekingAlphaTab.js'
];

// Modules manquants (ajoutés après 20 nov)
const MISSING_MODULES = [
    'FinanceProTab.js',
    'JLabUnifiedTab.js'
];

console.log('🔍 Validation de l\'architecture modulaire\n');
console.log('='.repeat(60));

// 1. Vérifier existence des fichiers
console.log('\n📁 1. Vérification des fichiers modules\n');

const existingModules = [];
const missingFiles = [];

EXPECTED_MODULES.forEach(module => {
    const filePath = path.join(TABS_DIR, module);
    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(1);
        existingModules.push({ name: module, size: sizeKB, path: filePath });
        console.log(`  ✅ ${module} (${sizeKB} KB)`);
    } else {
        missingFiles.push(module);
        console.log(`  ❌ ${module} - MANQUANT`);
    }
});

if (missingFiles.length > 0) {
    console.log(`\n⚠️  ${missingFiles.length} module(s) manquant(s): ${missingFiles.join(', ')}`);
}

// 2. Vérifier pattern d'exposition window.*
console.log('\n🔗 2. Vérification du pattern d\'exposition window.*\n');

const exposureIssues = [];

existingModules.forEach(({ name, path: filePath }) => {
    const content = fs.readFileSync(filePath, 'utf8');
    const componentName = name.replace('.js', '');
    
    // Vérifier présence de const ComponentName = 
    const hasComponentDef = content.includes(`const ${componentName} =`) || 
                           content.includes(`function ${componentName}`);
    
    // Vérifier exposition window.ComponentName
    const hasWindowExposure = content.includes(`window.${componentName} =`);
    
    if (hasComponentDef && hasWindowExposure) {
        console.log(`  ✅ ${componentName} - Pattern correct`);
    } else {
        const issues = [];
        if (!hasComponentDef) issues.push('définition manquante');
        if (!hasWindowExposure) issues.push('exposition window.* manquante');
        exposureIssues.push({ name: componentName, issues });
        console.log(`  ❌ ${componentName} - ${issues.join(', ')}`);
    }
});

// 3. Vérifier structure des fichiers de base
console.log('\n📦 3. Vérification des fichiers de base\n');

const baseFiles = [
    { name: 'utils.js', dir: DASHBOARD_DIR },
    { name: 'api-helpers.js', dir: DASHBOARD_DIR },
    { name: 'cache-manager.js', dir: DASHBOARD_DIR },
    { name: 'common.js', dir: path.join(DASHBOARD_DIR, 'components') },
    { name: 'dashboard-main.js', dir: DASHBOARD_DIR }
];

baseFiles.forEach(({ name, dir }) => {
    const filePath = path.join(dir, name);
    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(1);
        console.log(`  ✅ ${name} (${sizeKB} KB)`);
    } else {
        console.log(`  ❌ ${name} - MANQUANT`);
    }
});

// 4. Vérifier modules manquants (ajoutés après 20 nov)
console.log('\n🚫 4. Modules manquants (ajoutés après 20 nov)\n');

MISSING_MODULES.forEach(module => {
    const filePath = path.join(TABS_DIR, module);
    if (fs.existsSync(filePath)) {
        console.log(`  ⚠️  ${module} - EXISTE (doit être extrait de version actuelle)`);
    } else {
        console.log(`  ❌ ${module} - MANQUANT (à extraire)`);
    }
});

// 5. Résumé
console.log('\n' + '='.repeat(60));
console.log('\n📊 Résumé\n');

const totalModules = EXPECTED_MODULES.length;
const foundModules = existingModules.length;
const missingModules = MISSING_MODULES.length;

console.log(`  Modules attendus: ${totalModules}`);
console.log(`  Modules trouvés: ${foundModules}`);
console.log(`  Modules manquants (20 nov): ${totalModules - foundModules}`);
console.log(`  Modules à extraire (après 20 nov): ${missingModules}`);
console.log(`  Problèmes d'exposition: ${exposureIssues.length}`);

if (exposureIssues.length > 0) {
    console.log('\n⚠️  Problèmes détectés:');
    exposureIssues.forEach(({ name, issues }) => {
        console.log(`    - ${name}: ${issues.join(', ')}`);
    });
}

// 6. Validation finale
console.log('\n' + '='.repeat(60));
if (foundModules === totalModules && exposureIssues.length === 0) {
    console.log('\n✅ Architecture modulaire VALIDÉE');
    console.log('   Tous les modules sont présents et suivent le pattern correct.\n');
    process.exit(0);
} else {
    console.log('\n⚠️  Architecture modulaire avec PROBLÈMES');
    console.log('   Vérifiez les points ci-dessus.\n');
    process.exit(1);
}

