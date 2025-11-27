#!/usr/bin/env node
/**
 * Script d'analyse de dashboard-main.js
 * Compare avec BetaCombinedDashboard de la version actuelle
 */

const fs = require('fs');
const path = require('path');

const DASHBOARD_MAIN = path.join(__dirname, '../public/js/dashboard/dashboard-main.js');
const DASHBOARD_FILE = path.join(__dirname, '../public/beta-combined-dashboard.html');

console.log('🔍 Analyse de dashboard-main.js\n');
console.log('='.repeat(60));

const mainContent = fs.readFileSync(DASHBOARD_MAIN, 'utf8');
const dashboardContent = fs.readFileSync(DASHBOARD_FILE, 'utf8');

// Extraire BetaCombinedDashboard de la version actuelle
const betaStart = dashboardContent.indexOf('const BetaCombinedDashboard = () => {');
if (betaStart === -1) {
    console.error('❌ BetaCombinedDashboard non trouvé dans version actuelle');
    process.exit(1);
}

// Trouver la fin (avant ReactDOM.render)
const renderStart = dashboardContent.indexOf('ReactDOM.render', betaStart);
const betaEnd = renderStart > -1 ? renderStart : dashboardContent.length;
const betaComponent = dashboardContent.substring(betaStart, betaEnd);

// Analyser dashboard-main.js actuel
console.log('\n📊 État actuel de dashboard-main.js\n');

const mainLines = mainContent.split('\n').length;
const mainSize = (fs.statSync(DASHBOARD_MAIN).size / 1024).toFixed(1);
const mainUseState = (mainContent.match(/useState\(/g) || []).length;
const mainUseEffect = (mainContent.match(/useEffect\(/g) || []).length;

console.log(`  Lignes: ${mainLines}`);
console.log(`  Taille: ${mainSize} KB`);
console.log(`  useState: ${mainUseState}`);
console.log(`  useEffect: ${mainUseEffect}`);

// Analyser BetaCombinedDashboard de la version actuelle
console.log('\n📊 BetaCombinedDashboard de la version actuelle\n');

const betaLines = betaComponent.split('\n').length;
const betaSize = (betaComponent.length / 1024).toFixed(1);
const betaUseState = (betaComponent.match(/useState\(/g) || []).length;
const betaUseEffect = (betaComponent.match(/useEffect\(/g) || []).length;

console.log(`  Lignes: ${betaLines}`);
console.log(`  Taille: ${betaSize} KB`);
console.log(`  useState: ${betaUseState}`);
console.log(`  useEffect: ${betaUseEffect}`);

// Calculer ce qui manque
console.log('\n📉 Ce qui manque dans dashboard-main.js\n');

const missingLines = betaLines - mainLines;
const missingSize = (parseFloat(betaSize) - parseFloat(mainSize)).toFixed(1);
const missingUseState = betaUseState - mainUseState;
const missingUseEffect = betaUseEffect - mainUseEffect;

console.log(`  Lignes manquantes: ~${missingLines} (${((missingLines / betaLines) * 100).toFixed(1)}%)`);
console.log(`  Taille manquante: ~${missingSize} KB`);
console.log(`  useState manquants: ~${missingUseState}`);
console.log(`  useEffect manquants: ~${missingUseEffect}`);

// Extraire les états de BetaCombinedDashboard
console.log('\n🔢 États dans BetaCombinedDashboard\n');

const useStatePattern = /const\s+\[([^\]]+)\]\s*=\s*useState\(/g;
const states = [];
let match;

while ((match = useStatePattern.exec(betaComponent)) !== null) {
    const stateName = match[1].split(',')[0].trim();
    states.push(stateName);
}

console.log(`  Total états: ${states.length}`);
console.log(`  Premiers états: ${states.slice(0, 10).join(', ')}...`);

// Extraire les fonctions
console.log('\n🛠️  Fonctions dans BetaCombinedDashboard\n');

const functionPattern = /(?:const|function)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g;
const functions = [];
let funcMatch;

while ((funcMatch = functionPattern.exec(betaComponent)) !== null) {
    const funcName = funcMatch[1];
    if (!['useState', 'useEffect', 'useRef', 'useMemo', 'useCallback'].includes(funcName)) {
        functions.push(funcName);
    }
}

console.log(`  Total fonctions: ${functions.length}`);
console.log(`  Premières fonctions: ${functions.slice(0, 10).join(', ')}...`);

// Estimer complexité
console.log('\n📈 Estimation de complexité\n');

let complexity = 'Simple';
if (missingLines > 20000 || missingUseState > 150 || missingUseEffect > 60) {
    complexity = 'Très complexe';
} else if (missingLines > 10000 || missingUseState > 100 || missingUseEffect > 40) {
    complexity = 'Complexe';
} else if (missingLines > 5000 || missingUseState > 50 || missingUseEffect > 20) {
    complexity = 'Moyen';
}

console.log(`  Complexité d'extraction: ${complexity}`);
console.log(`  Estimation temps: ${complexity === 'Très complexe' ? '40-60h' : 
                                   complexity === 'Complexe' ? '20-40h' : 
                                   complexity === 'Moyen' ? '10-20h' : '5-10h'}`);

// Sauvegarder analyse
const analysis = {
    current: {
        lines: mainLines,
        sizeKB: parseFloat(mainSize),
        useState: mainUseState,
        useEffect: mainUseEffect
    },
    target: {
        lines: betaLines,
        sizeKB: parseFloat(betaSize),
        useState: betaUseState,
        useEffect: betaUseEffect
    },
    missing: {
        lines: missingLines,
        sizeKB: parseFloat(missingSize),
        useState: missingUseState,
        useEffect: missingUseEffect,
        percentage: ((missingLines / betaLines) * 100).toFixed(1)
    },
    complexity,
    states: states.slice(0, 50), // Limiter pour JSON
    functions: functions.slice(0, 50)
};

const outputFile = path.join(__dirname, '../docs/ANALYSE_DASHBOARD_MAIN.json');
fs.writeFileSync(outputFile, JSON.stringify(analysis, null, 2));

console.log('\n' + '='.repeat(60));
console.log('\n✅ Analyse terminée');
console.log(`📄 Résultats sauvegardés dans: ${outputFile}\n`);

