import XLSX from 'xlsx';

const wb2 = XLSX.readFile('public/3p1/confirmationtest.xlsx');
const ws2 = wb2.Sheets['Screen Results'];
const data2 = XLSX.utils.sheet_to_json(ws2, { defval: null, raw: false });

console.log('=== ANALYSE RATIOS CIBLES P/CF ET P/BV ===\n');

// Méthode 1: Basée sur les ratios de croissance
console.log('MÉTHODE 1: Ratios basés sur relation P/E et croissances\n');

const growthRatios = data2.map(v => {
  const epsGrowth = parseFloat(v['Projected EPS Growth 3 To 5 Yr']) || 0;
  const cfGrowth = parseFloat(v['Cash Flow Proj 3 To 5 Year Growth Rate']) || 0;
  const bvGrowth = parseFloat(v['Book Value Proj 3 To 5 Year Growth Rate']) || 0;
  
  if (epsGrowth <= 0 || cfGrowth <= 0 || bvGrowth <= 0) return null;
  if (epsGrowth > 100 || cfGrowth > 100 || bvGrowth > 100) return null;
  
  const cfRatio = cfGrowth / epsGrowth; // Ratio CF/EPS growth
  const bvRatio = bvGrowth / epsGrowth; // Ratio BV/EPS growth
  
  return { cfRatio, bvRatio };
}).filter(x => x);

const avgCFRatio = growthRatios.reduce((sum, r) => sum + r.cfRatio, 0) / growthRatios.length;
const medianCFRatio = [...growthRatios.map(r => r.cfRatio)].sort((a, b) => a - b)[Math.floor(growthRatios.length / 2)];
const avgBVRatio = growthRatios.reduce((sum, r) => sum + r.bvRatio, 0) / growthRatios.length;
const medianBVRatio = [...growthRatios.map(r => r.bvRatio)].sort((a, b) => a - b)[Math.floor(growthRatios.length / 2)];

console.log(`Sur ${growthRatios.length} titres valides:`);
console.log(`\nRatio CF Growth / EPS Growth:`);
console.log(`  Moyenne: ${avgCFRatio.toFixed(3)}`);
console.log(`  Médiane: ${medianCFRatio.toFixed(3)}`);
console.log(`  Interprétation: CF croît ${medianCFRatio > 1 ? 'plus vite' : 'moins vite'} que EPS (en moyenne)`);

console.log(`\nRatio BV Growth / EPS Growth:`);
console.log(`  Moyenne: ${avgBVRatio.toFixed(3)}`);
console.log(`  Médiane: ${medianBVRatio.toFixed(3)}`);
console.log(`  Interprétation: BV croît ${medianBVRatio > 1 ? 'plus vite' : 'moins vite'} que EPS (en moyenne)`);

const targetPE = 20.4; // Médiane P/E Ratio_1
const recommendedPCF = targetPE / medianCFRatio;
const recommendedPBV = targetPE / medianBVRatio;

console.log(`\nRecommandations basées sur P/E = ${targetPE} (médiane P/E Ratio_1):`);
console.log(`  targetPCF = P/E / (CF Growth / EPS Growth)`);
console.log(`            = ${targetPE} / ${medianCFRatio.toFixed(3)}`);
console.log(`            = ${recommendedPCF.toFixed(2)}`);

console.log(`\n  targetPBV = P/E / (BV Growth / EPS Growth)`);
console.log(`            = ${targetPE} / ${medianBVRatio.toFixed(3)}`);
console.log(`            = ${recommendedPBV.toFixed(2)}`);

console.log(`\nComparaison avec valeurs 3p1 actuelles:`);
console.log(`  targetPCF: 18.0 (actuel) vs ${recommendedPCF.toFixed(2)} (recommandé) → Écart: ${(recommendedPCF - 18.0).toFixed(2)} points`);
console.log(`  targetPBV: 6.0 (actuel) vs ${recommendedPBV.toFixed(2)} (recommandé) → Écart: ${(recommendedPBV - 6.0).toFixed(2)} points`);

// Méthode 2: Estimation directe depuis P/E et croissances
console.log('\n\n=== MÉTHODE 2: Estimation directe depuis P/E ===\n');

const ratios = data2.map(v => {
  const pe = parseFloat(v['Current P/E Ratio_1']) || 0;
  const epsGrowth = parseFloat(v['Projected EPS Growth 3 To 5 Yr']) || 0;
  const cfGrowth = parseFloat(v['Cash Flow Proj 3 To 5 Year Growth Rate']) || 0;
  const bvGrowth = parseFloat(v['Book Value Proj 3 To 5 Year Growth Rate']) || 0;
  
  if (pe <= 0 || pe > 200) return null;
  if (epsGrowth <= 0 || cfGrowth <= 0 || bvGrowth <= 0) return null;
  if (epsGrowth > 100 || cfGrowth > 100 || bvGrowth > 100) return null;
  
  // Estimation: P/CF ≈ P/E * (EPS Growth / CF Growth)
  const estimatedPCF = pe * (epsGrowth / cfGrowth);
  // Estimation: P/BV ≈ P/E * (EPS Growth / BV Growth)
  const estimatedPBV = pe * (epsGrowth / bvGrowth);
  
  if (estimatedPCF <= 0 || estimatedPCF > 200) return null;
  if (estimatedPBV <= 0 || estimatedPBV > 200) return null;
  
  return { ticker: v.Ticker, pe, estimatedPCF, estimatedPBV };
}).filter(x => x);

const avgPCF = ratios.reduce((sum, r) => sum + r.estimatedPCF, 0) / ratios.length;
const medianPCF = [...ratios.map(r => r.estimatedPCF)].sort((a, b) => a - b)[Math.floor(ratios.length / 2)];
const q25PCF = [...ratios.map(r => r.estimatedPCF)].sort((a, b) => a - b)[Math.floor(ratios.length * 0.25)];
const q75PCF = [...ratios.map(r => r.estimatedPCF)].sort((a, b) => a - b)[Math.floor(ratios.length * 0.75)];

const avgPBV = ratios.reduce((sum, r) => sum + r.estimatedPBV, 0) / ratios.length;
const medianPBV = [...ratios.map(r => r.estimatedPBV)].sort((a, b) => a - b)[Math.floor(ratios.length / 2)];
const q25PBV = [...ratios.map(r => r.estimatedPBV)].sort((a, b) => a - b)[Math.floor(ratios.length * 0.25)];
const q75PBV = [...ratios.map(r => r.estimatedPBV)].sort((a, b) => a - b)[Math.floor(ratios.length * 0.75)];

console.log(`Statistiques sur ${ratios.length} titres:`);
console.log(`\nP/CF Estimé:`);
console.log(`  Moyenne: ${avgPCF.toFixed(2)}`);
console.log(`  Médiane: ${medianPCF.toFixed(2)}`);
console.log(`  Q25: ${q25PCF.toFixed(2)}`);
console.log(`  Q75: ${q75PCF.toFixed(2)}`);
console.log(`  Valeur 3p1 actuelle: 18.0`);
console.log(`  Écart avec médiane: ${(medianPCF - 18.0).toFixed(2)} points`);

console.log(`\nP/BV Estimé:`);
console.log(`  Moyenne: ${avgPBV.toFixed(2)}`);
console.log(`  Médiane: ${medianPBV.toFixed(2)}`);
console.log(`  Q25: ${q25PBV.toFixed(2)}`);
console.log(`  Q75: ${q75PBV.toFixed(2)}`);
console.log(`  Valeur 3p1 actuelle: 6.0`);
console.log(`  Écart avec médiane: ${(medianPBV - 6.0).toFixed(2)} points`);

// Comparaison avec valeurs sectorielles dans le code
console.log('\n\n=== COMPARAISON AVEC VALEURS SECTORIELLES 3P1 ===\n');

const sectorDefaults = {
  'Technology': { pcf: 20, pbv: 5.5 },
  'Financials': { pcf: 10, pbv: 1.5 },
  'Healthcare': { pcf: 23, pbv: 7 },
  'Consumer': { pcf: 16, pbv: 4 },
  'Energy': { pcf: 10, pbv: 2 },
  'Generic': { pcf: 14, pbv: 4 }
};

console.log('Valeurs sectorielles dans le code 3p1:');
Object.keys(sectorDefaults).forEach(sector => {
  console.log(`  ${sector}: P/CF=${sectorDefaults[sector].pcf}, P/BV=${sectorDefaults[sector].pbv}`);
});

console.log(`\nRecommandations globales:`);
console.log(`  targetPCF: ${recommendedPCF.toFixed(2)} (méthode 1) ou ${medianPCF.toFixed(2)} (méthode 2)`);
console.log(`  targetPBV: ${recommendedPBV.toFixed(2)} (méthode 1) ou ${medianPBV.toFixed(2)} (méthode 2)`);

// Exemples par ticker
console.log('\n\n=== EXEMPLES PAR TICKER ===\n');
const examples = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'V', 'JNJ'];
examples.forEach(ticker => {
  const v = data2.find(r => r.Ticker === ticker);
  if (!v) return;
  
  const pe = parseFloat(v['Current P/E Ratio_1']) || 0;
  const epsGrowth = parseFloat(v['Projected EPS Growth 3 To 5 Yr']) || 0;
  const cfGrowth = parseFloat(v['Cash Flow Proj 3 To 5 Year Growth Rate']) || 0;
  const bvGrowth = parseFloat(v['Book Value Proj 3 To 5 Year Growth Rate']) || 0;
  
  if (pe <= 0 || epsGrowth <= 0 || cfGrowth <= 0 || bvGrowth <= 0) return;
  
  const estimatedPCF = pe * (epsGrowth / cfGrowth);
  const estimatedPBV = pe * (epsGrowth / bvGrowth);
  
  console.log(`${ticker}:`);
  console.log(`  P/E Ratio_1: ${pe.toFixed(2)}`);
  console.log(`  Croissances: EPS=${epsGrowth}%, CF=${cfGrowth}%, BV=${bvGrowth}%`);
  console.log(`  P/CF estimé: ${estimatedPCF.toFixed(2)} (vs 18.0 actuel)`);
  console.log(`  P/BV estimé: ${estimatedPBV.toFixed(2)} (vs 6.0 actuel)`);
  console.log('');
});

