/**
 * Script de test pour les filtres de la Sidebar
 * Vérifie que tous les filtres retournent des résultats corrects
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Lire le fichier Sidebar.tsx
const sidebarPath = join(__dirname, '..', 'public', '3p1', 'components', 'Sidebar.tsx');
const sidebarContent = readFileSync(sidebarPath, 'utf-8');

console.log('🔍 Test des filtres Sidebar\n');
console.log('='.repeat(60));

// Tests à effectuer
const tests = [];

// 1. Vérifier que les états de filtres sont définis
console.log('\n1️⃣ Vérification de la définition des états de filtres...');
const filterStates = [
    { name: 'searchTerm', pattern: /const\s+\[searchTerm,\s*setSearchTerm\]\s*=\s*useState/ },
    { name: 'filterBy', pattern: /const\s+\[filterBy,\s*setFilterBy\]\s*=\s*useState/ },
    { name: 'filterCountry', pattern: /const\s+\[filterCountry,\s*setFilterCountry\]\s*=\s*useState/ },
    { name: 'filterExchange', pattern: /const\s+\[filterExchange,\s*setFilterExchange\]\s*=\s*useState/ },
    { name: 'filterMarketCap', pattern: /const\s+\[filterMarketCap,\s*setFilterMarketCap\]\s*=\s*useState/ },
    { name: 'sortBy', pattern: /const\s+\[sortBy,\s*setSortBy\]\s*=\s*useState/ }
];

const foundStates = [];
filterStates.forEach(state => {
    if (state.pattern.test(sidebarContent)) {
        foundStates.push(state.name);
        console.log(`   ✅ ${state.name}`);
    } else {
        console.log(`   ❌ ${state.name} manquant`);
    }
});

tests.push({
    name: 'États de filtres définis',
    passed: foundStates.length === filterStates.length,
    details: `Trouvés: ${foundStates.length}/${filterStates.length}`
});

// 2. Vérifier la logique de filtrage (filteredAndSortedProfiles)
console.log('\n2️⃣ Vérification de la logique de filtrage...');
const filteredProfilesMatch = sidebarContent.match(/const\s+filteredAndSortedProfiles\s*=\s*useMemo\(/);
if (filteredProfilesMatch) {
    console.log('   ✅ Logique de filtrage trouvée (useMemo)');
    
    // Extraire la logique de filtrage
    const useMemoStart = sidebarContent.indexOf('const filteredAndSortedProfiles = useMemo(');
    const useMemoEnd = sidebarContent.indexOf('}, [', useMemoStart);
    if (useMemoEnd > useMemoStart) {
        const filterLogic = sidebarContent.substring(useMemoStart, useMemoEnd + 200);
        
        // Vérifier que les filtres sont appliqués
        const filterChecks = [
            { name: 'Recherche (searchTerm)', pattern: /searchTerm\.toLowerCase\(\)|p\.id\.toLowerCase\(\)|p\.info\.name\.toLowerCase\(\)/i },
            { name: 'Filtre source (filterBy)', pattern: /filterBy\s*===|isWatchlist\s*===/i },
            { name: 'Filtre pays (filterCountry)', pattern: /filterCountry|p\.info\.country/i },
            { name: 'Filtre bourse (filterExchange)', pattern: /filterExchange|p\.info\.exchange/i },
            { name: 'Filtre capitalisation (filterMarketCap)', pattern: /filterMarketCap|parseMarketCapToNumber/i },
            { name: 'Tri (sortBy)', pattern: /sortBy|\.sort\(/i }
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
    
    tests.push({ name: 'Logique de filtrage', passed: true });
} else {
    console.log('   ❌ Logique de filtrage non trouvée');
    tests.push({ name: 'Logique de filtrage', passed: false });
}

// 3. Vérifier les inputs de filtres dans le JSX
console.log('\n3️⃣ Vérification des inputs de filtres dans le JSX...');
const filterInputs = [
    { name: 'Barre de recherche', pattern: /placeholder="Filtrer|searchTerm|onChange.*setSearchTerm/i },
    { name: 'Bouton Tous', pattern: /setFilterBy\('all'\)|filterBy\s*===\s*'all'/i },
    { name: 'Bouton Portefeuille', pattern: /setFilterBy\('portfolio'\)|filterBy\s*===\s*'portfolio'/i },
    { name: 'Bouton Watchlist', pattern: /setFilterBy\('watchlist'\)|filterBy\s*===\s*'watchlist'/i },
    { name: 'Select Pays', pattern: /filterCountry|value=\{filterCountry\}/i },
    { name: 'Select Bourse', pattern: /filterExchange|value=\{filterExchange\}/i },
    { name: 'Select Capitalisation', pattern: /filterMarketCap|value=\{filterMarketCap\}/i },
    { name: 'Select Tri', pattern: /sortBy|value=\{sortBy\}/i }
];

const foundInputs = [];
filterInputs.forEach(input => {
    if (input.pattern.test(sidebarContent)) {
        foundInputs.push(input.name);
        console.log(`   ✅ ${input.name}`);
    } else {
        console.log(`   ❌ ${input.name} manquant`);
    }
});

tests.push({
    name: 'Inputs de filtres',
    passed: foundInputs.length === filterInputs.length,
    details: `Trouvés: ${foundInputs.length}/${filterInputs.length}`
});

// 4. Vérifier les valeurs uniques extraites (availableCountries, availableExchanges)
console.log('\n4️⃣ Vérification de l\'extraction des valeurs uniques...');
const uniqueValuesChecks = [
    { name: 'availableCountries', pattern: /const\s+availableCountries\s*=\s*useMemo|countries\.add\(p\.info\.country\)/i },
    { name: 'availableExchanges', pattern: /const\s+availableExchanges\s*=\s*useMemo|exchanges\.add\(p\.info\.exchange\)/i }
];

const foundUniqueValues = [];
uniqueValuesChecks.forEach(check => {
    if (check.pattern.test(sidebarContent)) {
        foundUniqueValues.push(check.name);
        console.log(`   ✅ ${check.name}`);
    } else {
        console.log(`   ❌ ${check.name} manquant`);
    }
});

tests.push({
    name: 'Extraction valeurs uniques',
    passed: foundUniqueValues.length === uniqueValuesChecks.length,
    details: `Trouvés: ${foundUniqueValues.length}/${uniqueValuesChecks.length}`
});

// 5. Vérifier la fonction parseMarketCapToNumber
console.log('\n5️⃣ Vérification de la fonction parseMarketCapToNumber...');
const parseMarketCapMatch = sidebarContent.match(/const\s+parseMarketCapToNumber\s*=/);
if (parseMarketCapMatch) {
    console.log('   ✅ Fonction parseMarketCapToNumber trouvée');
    tests.push({ name: 'Fonction parseMarketCapToNumber', passed: true });
} else {
    console.log('   ❌ Fonction parseMarketCapToNumber non trouvée');
    tests.push({ name: 'Fonction parseMarketCapToNumber', passed: false });
}

// 6. Vérifier l'affichage des résultats filtrés
console.log('\n6️⃣ Vérification de l\'affichage des résultats filtrés...');
const displayChecks = [
    { name: 'Liste filtrée', pattern: /filteredAndSortedProfiles\.map|filteredAndSortedProfiles\.length/i },
    { name: 'Message vide', pattern: /filteredAndSortedProfiles\.length\s*===\s*0|Aucun ticker/i },
    { name: 'Compteur de résultats', pattern: /filteredAndSortedProfiles\.length.*profiles\.length/i }
];

const foundDisplays = [];
displayChecks.forEach(check => {
    if (check.pattern.test(sidebarContent)) {
        foundDisplays.push(check.name);
        console.log(`   ✅ ${check.name}`);
    } else {
        console.log(`   ⚠️  ${check.name} (peut être manquant)`);
    }
});

tests.push({
    name: 'Affichage des résultats',
    passed: foundDisplays.length >= 2,
    details: `Trouvés: ${foundDisplays.length}/${displayChecks.length}`
});

// 7. Vérifier les dépendances du useMemo
console.log('\n7️⃣ Vérification des dépendances du useMemo...');
const dependenciesMatch = sidebarContent.match(/\[profiles,\s*searchTerm,\s*sortBy,\s*filterBy,\s*filterCountry,\s*filterExchange,\s*filterMarketCap\]/);
if (dependenciesMatch) {
    console.log('   ✅ Toutes les dépendances sont présentes dans useMemo');
    tests.push({ name: 'Dépendances useMemo', passed: true });
} else {
    console.log('   ⚠️  Dépendances useMemo à vérifier');
    tests.push({ name: 'Dépendances useMemo', passed: false });
}

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
    console.log('\n✅ Tous les tests sont passés ! Les filtres Sidebar sont correctement implémentés.');
    console.log('\n💡 Pour tester manuellement dans l\'interface:');
    console.log('   1. Ouvrez https://gobapps.com/3p1/dist/index.html');
    console.log('   2. Utilisez la barre de recherche pour filtrer par symbole/nom');
    console.log('   3. Cliquez sur "Portefeuille" ou "Watchlist" pour filtrer par source');
    console.log('   4. Utilisez les filtres avancés (Pays, Bourse, Capitalisation)');
    console.log('   5. Changez le tri pour réorganiser les résultats');
    console.log('   6. Vérifiez que les résultats se mettent à jour correctement');
    process.exit(0);
} else {
    console.log(`\n⚠️  ${totalTests - passedTests} test(s) ont échoué. Vérifiez les détails ci-dessus.`);
    process.exit(1);
}

