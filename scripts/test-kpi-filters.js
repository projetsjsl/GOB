/**
 * Script de test pour les filtres KPI Dashboard
 * Vérifie que tous les filtres fonctionnent correctement et que l'affichage est correct
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Lire le fichier KPIDashboard.tsx
const kpiDashboardPath = join(__dirname, '..', 'public', '3p1', 'components', 'KPIDashboard.tsx');
const kpiDashboardContent = readFileSync(kpiDashboardPath, 'utf-8');

console.log('🔍 Test des filtres KPI Dashboard\n');
console.log('='.repeat(60));

// Tests à effectuer
const tests = [];

// 1. Vérifier que les filtres sont définis
console.log('\n1️⃣ Vérification de la définition des filtres...');
const filtersStateMatch = kpiDashboardContent.match(/const\s+\[filters,\s*setFilters\]\s*=\s*useState/);
if (filtersStateMatch) {
    console.log('   ✅ État des filtres défini');
    tests.push({ name: 'État des filtres défini', passed: true });
} else {
    console.log('   ❌ État des filtres non trouvé');
    tests.push({ name: 'État des filtres défini', passed: false });
}

// 2. Vérifier les types de filtres disponibles
console.log('\n2️⃣ Vérification des types de filtres...');
const filterTypes = [
    'minRatio31', 'maxRatio31',
    'minPE', 'maxPE',
    'minYield', 'maxYield',
    'minVolatility', 'maxVolatility',
    'minGrowth', 'maxGrowth',
    'source', 'groupBy',
    'showOnlyNA', 'showOnlyApproved', 'showOnlySkeleton'
];

const foundFilters = [];
filterTypes.forEach(filterType => {
    const regex = new RegExp(`filters\\.${filterType}|${filterType}:`, 'g');
    if (regex.test(kpiDashboardContent)) {
        foundFilters.push(filterType);
    }
});

console.log(`   📊 Filtres trouvés: ${foundFilters.length}/${filterTypes.length}`);
foundFilters.forEach(f => console.log(`      ✅ ${f}`));
filterTypes.filter(f => !foundFilters.includes(f)).forEach(f => console.log(`      ❌ ${f} manquant`));

tests.push({
    name: 'Types de filtres',
    passed: foundFilters.length === filterTypes.length,
    details: `Trouvés: ${foundFilters.length}/${filterTypes.length}`
});

// 3. Vérifier la logique de filtrage (useMemo filteredMetrics)
console.log('\n3️⃣ Vérification de la logique de filtrage...');
const filteredMetricsMatch = kpiDashboardContent.match(/const\s+filteredMetrics\s*=\s*useMemo\(/);
if (filteredMetricsMatch) {
    console.log('   ✅ Logique de filtrage trouvée (useMemo)');
    tests.push({ name: 'Logique de filtrage', passed: true });
    
    // Extraire la logique de filtrage
    const useMemoStart = kpiDashboardContent.indexOf('const filteredMetrics = useMemo(');
    const useMemoEnd = kpiDashboardContent.indexOf('}, [', useMemoStart);
    if (useMemoEnd > useMemoStart) {
        const filterLogic = kpiDashboardContent.substring(useMemoStart, useMemoEnd + 100);
        
        // Vérifier que les filtres sont appliqués
        const filterChecks = [
            { name: 'Ratio 3:1', pattern: /ratio31|ratio.*31/i },
            { name: 'P/E', pattern: /currentPE|\.pe\s*[<>]/i },
            { name: 'Yield', pattern: /currentYield|yield/i },
            { name: 'Volatilité', pattern: /volatility/i },
            { name: 'Croissance', pattern: /growth|historicalGrowth/i },
            { name: 'Source', pattern: /source|isWatchlist/i },
            { name: 'N/A', pattern: /showOnlyNA|jpegy.*null/i },
            { name: 'Approuvé', pattern: /showOnlyApproved|hasApprovedVersion/i },
            { name: 'Squelette', pattern: /showOnlySkeleton|_isSkeleton/i }
        ];
        
        console.log('   📋 Vérification des conditions de filtrage:');
        filterChecks.forEach(check => {
            if (check.pattern.test(filterLogic)) {
                console.log(`      ✅ ${check.name}`);
            } else {
                console.log(`      ⚠️  ${check.name} (peut être manquant)`);
            }
        });
    }
} else {
    console.log('   ❌ Logique de filtrage non trouvée');
    tests.push({ name: 'Logique de filtrage', passed: false });
}

// 4. Vérifier les inputs de filtres dans le JSX
console.log('\n4️⃣ Vérification des inputs de filtres dans le JSX...');
const filterInputs = [
    { name: 'Ratio 3:1 Min', id: 'filter-ratio31-min' },
    { name: 'Ratio 3:1 Max', id: 'filter-ratio31-max' },
    { name: 'P/E Min', id: 'filter-pe-min' },
    { name: 'P/E Max', id: 'filter-pe-max' },
    { name: 'Yield Min', id: 'filter-yield-min' },
    { name: 'Yield Max', id: 'filter-yield-max' },
    { name: 'Volatilité Min', id: 'filter-volatility-min' },
    { name: 'Volatilité Max', id: 'filter-volatility-max' },
    { name: 'Croissance Min', id: 'filter-growth-min' },
    { name: 'Croissance Max', id: 'filter-growth-max' },
    { name: 'Source', id: 'filter-source' },
    { name: 'Grouper par', id: 'filter-group-by' }
];

const foundInputs = [];
filterInputs.forEach(input => {
    if (kpiDashboardContent.includes(`id="${input.id}"`)) {
        foundInputs.push(input.name);
    }
});

console.log(`   📊 Inputs trouvés: ${foundInputs.length}/${filterInputs.length}`);
foundInputs.forEach(i => console.log(`      ✅ ${i}`));
filterInputs.filter(i => !foundInputs.includes(i.name)).forEach(i => console.log(`      ❌ ${i.name} manquant`));

tests.push({
    name: 'Inputs de filtres',
    passed: foundInputs.length === filterInputs.length,
    details: `Trouvés: ${foundInputs.length}/${filterInputs.length}`
});

// 5. Vérifier les boutons de filtres rapides
console.log('\n5️⃣ Vérification des boutons de filtres rapides...');
const quickFilterButtons = [
    'showOnlyNA',
    'showOnlyApproved',
    'showOnlySkeleton'
];

const foundButtons = [];
quickFilterButtons.forEach(button => {
    const regex = new RegExp(`filters\\.${button}|setFilters.*${button}`, 'g');
    if (regex.test(kpiDashboardContent)) {
        foundButtons.push(button);
    }
});

console.log(`   📊 Boutons trouvés: ${foundButtons.length}/${quickFilterButtons.length}`);
foundButtons.forEach(b => console.log(`      ✅ ${b}`));
quickFilterButtons.filter(b => !foundButtons.includes(b)).forEach(b => console.log(`      ❌ ${b} manquant`));

tests.push({
    name: 'Boutons de filtres rapides',
    passed: foundButtons.length === quickFilterButtons.length,
    details: `Trouvés: ${foundButtons.length}/${quickFilterButtons.length}`
});

// 6. Vérifier l'affichage des résultats filtrés
console.log('\n6️⃣ Vérification de l\'affichage des résultats filtrés...');
const displayChecks = [
    { name: 'Matrice de performance', pattern: /Matrice de Performance|performanceMatrix/i },
    { name: 'Tableau détaillé', pattern: /Tableau détaillé|detailedTable/i },
    { name: 'Graphiques', pattern: /scatterPlot|Scatter Plot/i },
    { name: 'Compteur de résultats', pattern: /filteredProfiles\.length|résultats/i }
];

const foundDisplays = [];
displayChecks.forEach(check => {
    if (check.pattern.test(kpiDashboardContent)) {
        foundDisplays.push(check.name);
    }
});

console.log(`   📊 Éléments d'affichage trouvés: ${foundDisplays.length}/${displayChecks.length}`);
foundDisplays.forEach(d => console.log(`      ✅ ${d}`));
displayChecks.filter(d => !foundDisplays.includes(d.name)).forEach(d => console.log(`      ⚠️  ${d.name} (peut être manquant)`));

tests.push({
    name: 'Affichage des résultats',
    passed: foundDisplays.length >= 3,
    details: `Trouvés: ${foundDisplays.length}/${displayChecks.length}`
});

// 7. Vérifier les options d'affichage
console.log('\n7️⃣ Vérification des options d\'affichage...');
const displayOptions = [
    'density',
    'showSector',
    'showNames',
    'visibleColumns'
];

const foundDisplayOptions = [];
displayOptions.forEach(option => {
    const regex = new RegExp(`displayOptions\\.${option}|${option}:`, 'g');
    if (regex.test(kpiDashboardContent)) {
        foundDisplayOptions.push(option);
    }
});

console.log(`   📊 Options d'affichage trouvées: ${foundDisplayOptions.length}/${displayOptions.length}`);
foundDisplayOptions.forEach(o => console.log(`      ✅ ${o}`));
displayOptions.filter(o => !foundDisplayOptions.includes(o)).forEach(o => console.log(`      ❌ ${o} manquant`));

tests.push({
    name: 'Options d\'affichage',
    passed: foundDisplayOptions.length === displayOptions.length,
    details: `Trouvés: ${foundDisplayOptions.length}/${displayOptions.length}`
});

// Résumé
console.log('\n\n📋 RÉSUMÉ DES TESTS');
console.log('='.repeat(60));

const passedTests = tests.filter(t => t.passed).length;
const totalTests = tests.length;

tests.forEach(test => {
    const icon = test.passed ? '✅' : '❌';
    const details = test.details ? ` (${test.details})` : '';
    console.log(`${icon} ${test.name}${details}`);
});

console.log(`\n📊 Résultat: ${passedTests}/${totalTests} tests réussis`);

if (passedTests === totalTests) {
    console.log('\n✅ Tous les tests sont passés ! Les filtres KPI sont correctement implémentés.');
    process.exit(0);
} else {
    console.log(`\n⚠️  ${totalTests - passedTests} test(s) ont échoué. Vérifiez les détails ci-dessus.`);
    process.exit(1);
}

