#!/usr/bin/env node
/**
 * Script de validation pour s'assurer que l'interface modulaire
 * est identique à l'interface monolithique
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validation de l\'équivalence de l\'interface');
console.log('================================================\n');

const errors = [];
const warnings = [];

// 1. Vérifier que tous les modules sont présents
console.log('📦 1. Vérification des modules...');
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
const missingModules = [];

expectedModules.forEach(module => {
    const modulePath = path.join(modulesPath, module);
    if (!fs.existsSync(modulePath)) {
        missingModules.push(module);
        errors.push(`❌ Module manquant: ${module}`);
    } else {
        console.log(`  ✅ ${module}`);
    }
});

if (missingModules.length === 0) {
    console.log('  ✅ Tous les modules sont présents\n');
} else {
    console.log(`  ❌ ${missingModules.length} module(s) manquant(s)\n`);
}

// 2. Vérifier la structure HTML de base
console.log('📄 2. Vérification de la structure HTML...');
const modularHtmlPath = path.join(__dirname, '../public/beta-combined-dashboard-modular.html');
const monolithicHtmlPath = path.join(__dirname, '../public/beta-combined-dashboard.html');

if (!fs.existsSync(modularHtmlPath)) {
    errors.push('❌ Fichier modulaire introuvable: beta-combined-dashboard-modular.html');
} else {
    console.log('  ✅ Fichier modulaire trouvé');
}

if (!fs.existsSync(monolithicHtmlPath)) {
    warnings.push('⚠️ Fichier monolithique introuvable: beta-combined-dashboard.html');
} else {
    console.log('  ✅ Fichier monolithique trouvé');
}

// Vérifier que les deux ont un élément root
if (fs.existsSync(modularHtmlPath)) {
    const modularContent = fs.readFileSync(modularHtmlPath, 'utf-8');
    if (modularContent.includes('<div id="root"></div>')) {
        console.log('  ✅ Élément root présent dans la version modulaire');
    } else {
        errors.push('❌ Élément <div id="root"></div> manquant dans la version modulaire');
    }

    if (modularContent.includes('ReactDOM.render')) {
        console.log('  ✅ ReactDOM.render présent dans la version modulaire');
    } else {
        errors.push('❌ ReactDOM.render manquant dans la version modulaire');
    }

    if (modularContent.includes('auth-guard.js')) {
        console.log('  ✅ auth-guard.js chargé dans la version modulaire');
    } else {
        errors.push('❌ auth-guard.js non chargé dans la version modulaire');
    }
}

console.log('');

// 3. Vérifier que dashboard-main.js existe et expose BetaCombinedDashboard
console.log('🔧 3. Vérification de dashboard-main.js...');
const dashboardMainPath = path.join(__dirname, '../public/js/dashboard/dashboard-main.js');
if (fs.existsSync(dashboardMainPath)) {
    const dashboardMainContent = fs.readFileSync(dashboardMainPath, 'utf-8');
    
    if (dashboardMainContent.includes('window.BetaCombinedDashboard')) {
        console.log('  ✅ BetaCombinedDashboard exposé globalement');
    } else {
        errors.push('❌ BetaCombinedDashboard non exposé globalement dans dashboard-main.js');
    }

    if (dashboardMainContent.includes('const BetaCombinedDashboard')) {
        console.log('  ✅ Composant BetaCombinedDashboard défini');
    } else {
        errors.push('❌ Composant BetaCombinedDashboard non défini dans dashboard-main.js');
    }
} else {
    errors.push('❌ dashboard-main.js introuvable');
}

console.log('');

// 4. Vérifier que tous les modules exposent leurs composants globalement
console.log('🌐 4. Vérification de l\'exposition globale des modules...');
expectedModules.forEach(module => {
    const modulePath = path.join(modulesPath, module);
    if (fs.existsSync(modulePath)) {
        const moduleContent = fs.readFileSync(modulePath, 'utf-8');
        const componentName = module.replace('.js', '');
        
        // Vérifier l'exposition window.*
        if (moduleContent.includes(`window.${componentName}`)) {
            console.log(`  ✅ ${componentName} exposé globalement`);
        } else {
            warnings.push(`⚠️ ${componentName} pourrait ne pas être exposé globalement`);
        }
    }
});

console.log('');

// 5. Vérifier la redirection après login
console.log('🔐 5. Vérification de l\'authentification...');
const loginHtmlPath = path.join(__dirname, '../public/login.html');
if (fs.existsSync(loginHtmlPath)) {
    const loginContent = fs.readFileSync(loginHtmlPath, 'utf-8');
    
    if (loginContent.includes('beta-combined-dashboard.html')) {
        console.log('  ✅ Redirection vers beta-combined-dashboard.html après login');
        console.log('  ℹ️  Note: Actuellement redirige vers la version monolithique');
        console.log('  ℹ️  Pour utiliser la version modulaire, changer vers beta-combined-dashboard-modular.html');
    } else {
        warnings.push('⚠️ Redirection après login non trouvée dans login.html');
    }
} else {
    warnings.push('⚠️ login.html introuvable');
}

console.log('');

// 6. Vérifier que auth-guard.js est présent
console.log('🛡️ 6. Vérification de auth-guard.js...');
const authGuardPath = path.join(__dirname, '../public/js/auth-guard.js');
const authGuardPath2 = path.join(__dirname, '../public/auth-guard.js');

if (fs.existsSync(authGuardPath) || fs.existsSync(authGuardPath2)) {
    console.log('  ✅ auth-guard.js trouvé');
} else {
    errors.push('❌ auth-guard.js introuvable');
}

console.log('');

// 7. Vérifier les dépendances (utils, api-helpers, etc.)
console.log('📚 7. Vérification des dépendances...');
const dependencies = [
    'utils.js',
    'api-helpers.js',
    'cache-manager.js',
    'components/common.js'
];

const dashboardPath = path.join(__dirname, '../public/js/dashboard');
dependencies.forEach(dep => {
    const depPath = path.join(dashboardPath, dep);
    if (fs.existsSync(depPath)) {
        console.log(`  ✅ ${dep} présent`);
    } else {
        errors.push(`❌ Dépendance manquante: ${dep}`);
    }
});

console.log('');

// Résumé
console.log('================================================');
console.log('📊 RÉSUMÉ');
console.log('================================================\n');

if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ Toutes les validations sont passées !');
    console.log('✅ L\'interface modulaire devrait être identique à l\'interface monolithique\n');
    process.exit(0);
} else {
    if (errors.length > 0) {
        console.log(`❌ ${errors.length} erreur(s) trouvée(s):\n`);
        errors.forEach(err => console.log(`  ${err}`));
        console.log('');
    }
    
    if (warnings.length > 0) {
        console.log(`⚠️  ${warnings.length} avertissement(s):\n`);
        warnings.forEach(warn => console.log(`  ${warn}`));
        console.log('');
    }
    
    if (errors.length > 0) {
        console.log('❌ Des corrections sont nécessaires avant de pouvoir utiliser la version modulaire.\n');
        process.exit(1);
    } else {
        console.log('⚠️  Des avertissements ont été détectés, mais l\'interface devrait fonctionner.\n');
        process.exit(0);
    }
}

