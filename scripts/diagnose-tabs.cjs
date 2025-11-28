#!/usr/bin/env node
/**
 * Script de diagnostic pour vérifier pourquoi certains onglets ne s'affichent pas
 */

const fs = require('fs');
const path = require('path');

const DASHBOARD_MAIN = path.join(__dirname, '../public/js/dashboard/dashboard-main.js');
const TABS_DIR = path.join(__dirname, '../public/js/dashboard/components/tabs');

// Liste des onglets attendus
const EXPECTED_TABS = [
    { id: 'markets-economy', component: 'MarketsEconomyTab' },
    { id: 'intellistocks', component: 'JLabUnifiedTab' },
    { id: 'ask-emma', component: 'AskEmmaTab' },
    { id: 'plus', component: 'PlusTab' },
    { id: 'admin-jsla', component: 'AdminJSLaiTab' },
    { id: 'scrapping-sa', component: 'ScrappingSATab' },
    { id: 'seeking-alpha', component: 'SeekingAlphaTab' },
    { id: 'email-briefings', component: 'EmailBriefingsTab' },
    { id: 'investing-calendar', component: 'InvestingCalendarTab' }
];

console.log('🔍 Diagnostic des onglets du dashboard\n');

// 1. Vérifier que dashboard-main.js existe et contient le rendu conditionnel
console.log('1. Vérification de dashboard-main.js...');
if (!fs.existsSync(DASHBOARD_MAIN)) {
    console.error('❌ dashboard-main.js n\'existe pas !');
    process.exit(1);
}

const dashboardContent = fs.readFileSync(DASHBOARD_MAIN, 'utf8');

// Vérifier chaque onglet
const issues = [];
EXPECTED_TABS.forEach(tab => {
    const pattern = new RegExp(`activeTab === ['"]${tab.id}['"]\\s*&&\\s*window\\.${tab.component}`, 'g');
    const matches = dashboardContent.match(pattern);
    
    if (!matches || matches.length === 0) {
        issues.push({
            tab: tab.id,
            component: tab.component,
            issue: `Rendu conditionnel manquant pour ${tab.id}`
        });
        console.error(`❌ ${tab.id}: Rendu conditionnel manquant`);
    } else {
        console.log(`✅ ${tab.id}: Rendu conditionnel présent`);
    }
});

// 2. Vérifier que chaque composant existe et est exposé via window.*
console.log('\n2. Vérification des fichiers de composants...');
EXPECTED_TABS.forEach(tab => {
    const componentFile = path.join(TABS_DIR, `${tab.component}.js`);
    
    if (!fs.existsSync(componentFile)) {
        issues.push({
            tab: tab.id,
            component: tab.component,
            issue: `Fichier ${tab.component}.js n'existe pas`
        });
        console.error(`❌ ${tab.component}.js: Fichier manquant`);
    } else {
        const componentContent = fs.readFileSync(componentFile, 'utf8');
        const windowExposure = new RegExp(`window\\.${tab.component}\\s*=\\s*${tab.component}`, 'g');
        
        if (!componentContent.match(windowExposure)) {
            issues.push({
                tab: tab.id,
                component: tab.component,
                issue: `${tab.component} n'est pas exposé via window.*`
            });
            console.error(`❌ ${tab.component}: Non exposé via window.*`);
        } else {
            console.log(`✅ ${tab.component}: Fichier existe et est exposé`);
        }
    }
});

// 3. Vérifier que tous les composants sont dans la liste de chargement
console.log('\n3. Vérification de la liste de chargement dans beta-combined-dashboard.html...');
const HTML_FILE = path.join(__dirname, '../public/beta-combined-dashboard.html');
if (fs.existsSync(HTML_FILE)) {
    const htmlContent = fs.readFileSync(HTML_FILE, 'utf8');
    
    EXPECTED_TABS.forEach(tab => {
        const componentPath = `/js/dashboard/components/tabs/${tab.component}.js`;
        if (!htmlContent.includes(componentPath)) {
            issues.push({
                tab: tab.id,
                component: tab.component,
                issue: `${tab.component}.js n'est pas dans la liste de chargement`
            });
            console.error(`❌ ${tab.component}: Non présent dans la liste de chargement`);
        } else {
            console.log(`✅ ${tab.component}: Présent dans la liste de chargement`);
        }
    });
} else {
    console.error('❌ beta-combined-dashboard.html n\'existe pas !');
}

// 4. Résumé
console.log('\n📊 Résumé:');
if (issues.length === 0) {
    console.log('✅ Tous les onglets sont correctement configurés !');
} else {
    console.error(`❌ ${issues.length} problème(s) détecté(s):\n`);
    issues.forEach(issue => {
        console.error(`  - ${issue.tab} (${issue.component}): ${issue.issue}`);
    });
    process.exit(1);
}

