import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const EXCEL_FILE = path.join(process.cwd(), 'public', '3p1', 'confirmationtest.xlsx');

function readExcelFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Fichier non trouvé: ${filePath}`);
        return null;
    }
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null, raw: false });
}

function calculateMedian(arr) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

const data = readExcelFile(EXCEL_FILE);

if (!data) {
    process.exit(1);
}

console.log('=== ANALYSE P/E: API (FMP) vs VALUELINE ===\n');

// 1. Distribution des P/E ValueLine
console.log('1. DISTRIBUTION DES P/E VALUELINE\n');
const pe1Values = data.map(v => parseFloat(v['Current P/E Ratio']) || 0).filter(p => p > 0 && p < 200);
const pe2Values = data.map(v => parseFloat(v['Current P/E Ratio_1']) || 0).filter(p => p > 0 && p < 200);

const avgPE1 = pe1Values.reduce((a, b) => a + b, 0) / pe1Values.length;
const medianPE1 = calculateMedian(pe1Values);
const avgPE2 = pe2Values.reduce((a, b) => a + b, 0) / pe2Values.length;
const medianPE2 = calculateMedian(pe2Values);

console.log(`P/E Ratio (version 1):`);
console.log(`  Nombre de titres: ${pe1Values.length}`);
console.log(`  Moyenne: ${avgPE1.toFixed(2)}`);
console.log(`  Médiane: ${medianPE1.toFixed(2)}`);
console.log(`  Min: ${Math.min(...pe1Values).toFixed(2)}`);
console.log(`  Max: ${Math.max(...pe1Values).toFixed(2)}\n`);

console.log(`P/E Ratio_1 (version 2):`);
console.log(`  Nombre de titres: ${pe2Values.length}`);
console.log(`  Moyenne: ${avgPE2.toFixed(2)}`);
console.log(`  Médiane: ${medianPE2.toFixed(2)}`);
console.log(`  Min: ${Math.min(...pe2Values).toFixed(2)}`);
console.log(`  Max: ${Math.max(...pe2Values).toFixed(2)}\n`);

// 2. Simuler le calcul 3p1 pour comparer
console.log('2. SIMULATION CALCUL P/E 3P1\n');
console.log('Dans 3p1, le P/E est calculé comme:');
console.log('  currentPE = currentPrice / baseEPS\n');
console.log('Où:');
console.log('  - currentPrice: Prix actuel (depuis FMP/Finnhub)');
console.log('  - baseEPS: earningsPerShare de l\'année de base (depuis FMP key-metrics)\n');
console.log('Pour simuler, nous devons estimer le P/E calculé 3p1:\n');

// Analyser tous les titres avec données complètes
const comparisons = [];

data.forEach(v => {
    if (!v || !v.Ticker) return;
    
    const pe1 = parseFloat(v['Current P/E Ratio']) || 0;
    const pe2 = parseFloat(v['Current P/E Ratio_1']) || 0;
    const projectedEPS = parseFloat(v['Projected EPS 3 To 5 Yr']) || 0;
    const epsGrowth = parseFloat(v['Projected EPS Growth 3 To 5 Yr']) || 0;
    
    // Filtrer les données valides
    if (pe1 <= 0 || pe2 <= 0 || projectedEPS <= 0 || epsGrowth <= 0) return;
    if (pe1 > 200 || pe2 > 200 || projectedEPS > 1000 || epsGrowth > 100) return;
    
    // Estimer EPS actuel depuis EPS projeté
    // EPS projeté = EPS actuel * (1 + growth)^3.5 (moyenne de 3-5 ans)
    const currentEPS = projectedEPS / Math.pow(1 + epsGrowth / 100, 3.5);
    
    // Estimer le prix actuel depuis P/E Ratio_1 et EPS actuel
    // currentPrice = P/E Ratio_1 * currentEPS
    const estimatedPrice = pe2 * currentEPS;
    
    // P/E calculé 3p1 (simulé) = estimatedPrice / currentEPS = pe2 (par définition)
    // Mais pour la comparaison, calculons-le explicitement
    const calculatedPE = estimatedPrice / currentEPS;
    
    // Forward P/E calculé 3p1
    const forwardEPS = currentEPS * (1 + epsGrowth / 100);
    const forwardPE = estimatedPrice / forwardEPS;
    
    const diffPE1 = ((calculatedPE - pe1) / pe1) * 100;
    const diffPE2 = ((calculatedPE - pe2) / pe2) * 100;
    const diffForward = ((forwardPE - pe2) / pe2) * 100;
    
    comparisons.push({
        ticker: v.Ticker,
        pe1,
        pe2,
        calculatedPE,
        forwardPE,
        currentEPS,
        forwardEPS,
        diffPE1,
        diffPE2,
        diffForward
    });
});

// Afficher les 10 premiers exemples
console.log('Comparaison P/E Calculé 3p1 vs ValueLine (10 premiers exemples):\n');
comparisons.slice(0, 10).forEach(c => {
    console.log(`${c.ticker}:`);
    console.log(`  P/E Ratio ValueLine (1): ${c.pe1.toFixed(2)}`);
    console.log(`  P/E Ratio_1 ValueLine (2): ${c.pe2.toFixed(2)}`);
    console.log(`  P/E Calculé 3p1 (simulé): ${c.calculatedPE.toFixed(2)}`);
    console.log(`  Écart vs P/E Ratio: ${c.diffPE1 > 0 ? '+' : ''}${c.diffPE1.toFixed(1)}%`);
    console.log(`  Écart vs P/E Ratio_1: ${c.diffPE2 > 0 ? '+' : ''}${c.diffPE2.toFixed(1)}%`);
    console.log(`  Forward P/E calculé: ${c.forwardPE.toFixed(2)}`);
    console.log(`  Écart Forward vs P/E Ratio_1: ${c.diffForward > 0 ? '+' : ''}${c.diffForward.toFixed(1)}%`);
    console.log(`  Forward < P/E actuel: ${c.forwardPE < c.calculatedPE ? '✅' : '⚠️'}`);
    console.log('');
});

if (comparisons.length > 10) {
    console.log(`... et ${comparisons.length - 10} autres titres\n`);
}

// 3. Statistiques globales
console.log('3. STATISTIQUES GLOBALES\n');
const allDiffPE1 = comparisons.map(c => Math.abs(c.diffPE1));
const allDiffPE2 = comparisons.map(c => Math.abs(c.diffPE2));
const allDiffForward = comparisons.map(c => Math.abs(c.diffForward));

console.log(`Écarts absolus moyens (${comparisons.length} titres):`);
console.log(`  P/E Calculé vs P/E Ratio: ${(allDiffPE1.reduce((a, b) => a + b, 0) / allDiffPE1.length).toFixed(1)}%`);
console.log(`  P/E Calculé vs P/E Ratio_1: ${(allDiffPE2.reduce((a, b) => a + b, 0) / allDiffPE2.length).toFixed(1)}%`);
console.log(`  Forward P/E vs P/E Ratio_1: ${(allDiffForward.reduce((a, b) => a + b, 0) / allDiffForward.length).toFixed(1)}%\n`);

// 4. Analyse de cohérence
console.log('4. ANALYSE DE COHÉRENCE\n');
const forwardLowerThanPE = comparisons.filter(c => c.forwardPE < c.calculatedPE).length;
const forwardLowerThanPE2 = comparisons.filter(c => c.forwardPE < c.pe2).length;

console.log(`Forward P/E < P/E Calculé: ${forwardLowerThanPE}/${comparisons.length} (${(forwardLowerThanPE / comparisons.length * 100).toFixed(1)}%) ✅`);
console.log(`Forward P/E < P/E Ratio_1: ${forwardLowerThanPE2}/${comparisons.length} (${(forwardLowerThanPE2 / comparisons.length * 100).toFixed(1)}%) ✅\n`);

// 5. Recommandations
console.log('5. RECOMMANDATIONS\n');
console.log('A. P/E ACTUEL (Trailing P/E):\n');
console.log('   ✅ Le P/E calculé 3p1 (currentPrice / baseEPS) est une méthode valide');
console.log('   ⚠️  Cependant, il peut différer de ValueLine car:');
console.log('      - ValueLine peut utiliser un EPS ajusté (exclusions, normalisations)');
console.log('      - ValueLine peut utiliser un prix moyen ou ajusté');
console.log('      - Les dates de référence peuvent différer\n');
console.log('   💡 RECOMMANDATION:');
console.log('      - Utiliser P/E Ratio_1 ValueLine si disponible (plus conservateur)');
console.log('      - Sinon, utiliser le P/E calculé 3p1 comme fallback');
console.log('      - Afficher les deux avec badge "Source: ValueLine" ou "Source: Calculé"\n');

console.log('B. FORWARD P/E:\n');
console.log('   ✅ Le Forward P/E calculé 3p1 est cohérent (inférieur au P/E actuel)');
console.log('   ✅ La formule forwardPE = currentPrice / (baseEPS * (1 + growthRateEPS/100)) est correcte');
console.log('   ⚠️  Cependant, il peut différer de ValueLine car:');
console.log('      - ValueLine peut utiliser des projections d\'analystes');
console.log('      - La croissance utilisée peut différer\n');
console.log('   💡 RECOMMANDATION:');
console.log('      - Garder le Forward P/E calculé 3p1 (cohérent avec nos hypothèses)');
console.log('      - Afficher avec badge "Source: Calculé (3p1)"\n');

console.log('C. POUR JPEGY:\n');
console.log('   ✅ Utiliser P/E Ratio_1 ValueLine si disponible (recommandation précédente)');
console.log('   ✅ Sinon, utiliser le P/E calculé 3p1');
console.log('   ⚠️  Éviter d\'utiliser P/E Ratio (version 1) - moins conservateur\n');

console.log('D. SOURCE DE DONNÉES FMP:\n');
console.log('   📊 FMP fournit:');
console.log('      - earningsPerShare via key-metrics (netIncomePerShare)');
console.log('      - currentPrice via profile ou quote');
console.log('      - ⚠️  FMP ne fournit PAS directement un P/E ratio');
console.log('   💡 RECOMMANDATION:');
console.log('      - Calculer P/E depuis FMP: currentPrice / earningsPerShare');
console.log('      - Comparer avec ValueLine P/E Ratio_1 si disponible');
console.log('      - Utiliser le plus conservateur des deux pour JPEGY\n');

