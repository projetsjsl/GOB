import XLSX from 'xlsx';
import fs from 'fs';

const wb2 = XLSX.readFile('public/3p1/confirmationtest.xlsx');
const ws2 = wb2.Sheets['Screen Results'];
const data2 = XLSX.utils.sheet_to_json(ws2, { defval: null, raw: false });

console.log('=== ANALYSE 1: RENDEMENTS PROJETÉS 3P1 vs VALUELINE ===\n');

// Simulation calculs 3p1
const fullAnalysis = data2.map(v => {
  const epsGrowth = parseFloat(v['Projected EPS Growth 3 To 5 Yr']) || 0;
  const cfGrowth = parseFloat(v['Cash Flow Proj 3 To 5 Year Growth Rate']) || 0;
  const bvGrowth = parseFloat(v['Book Value Proj 3 To 5 Year Growth Rate']) || 0;
  const divGrowth = parseFloat(v['Dividend Proj 3 To 5 Year Growth Rate']) || 0;
  const projectedEPS = parseFloat(v['Projected EPS 3 To 5 Yr']) || 0;
  const currentPE = parseFloat(v['Current P/E Ratio']) || 0;
  const currentPE1 = parseFloat(v['Current P/E Ratio_1']) || 0;
  const projYield = parseFloat(v['3 To 5 Year Proj Dividend Yield']) || 0;
  const highReturn = parseFloat(v['Proj High TTL Return']) || 0;
  const lowReturn = parseFloat(v['Proj Low TTL Return']) || 0;
  
  if (currentPE <= 0 || projectedEPS <= 0) return null;
  
  // Simulation calcul 3p1 (simplifié mais réaliste)
  const baseEPS = 1;
  const currentPrice = currentPE * baseEPS;
  const futureEPS = baseEPS * Math.pow(1 + epsGrowth / 100, 5);
  const targetPE = 20; // Par défaut 3p1 (mais on va tester avec 23 aussi)
  const targetPrice = futureEPS * targetPE;
  
  // Dividends accumulés
  let totalDividends = 0;
  const baseDiv = currentPrice * (projYield / 100);
  let currentD = baseDiv;
  for (let i = 0; i < 5; i++) {
    currentD = currentD * (1 + divGrowth / 100);
    totalDividends += currentD;
  }
  
  const totalReturn3p1 = ((targetPrice + totalDividends - currentPrice) / currentPrice) * 100;
  const inRange = totalReturn3p1 >= lowReturn && totalReturn3p1 <= highReturn;
  const positionInRange = inRange 
    ? ((totalReturn3p1 - lowReturn) / (highReturn - lowReturn)) * 100 
    : (totalReturn3p1 < lowReturn ? -10 : 110);
  
  return {
    ticker: v.Ticker,
    totalReturn3p1,
    highReturn,
    lowReturn,
    inRange,
    positionInRange,
    diffFromHigh: totalReturn3p1 - highReturn,
    diffFromLow: totalReturn3p1 - lowReturn,
    rangeSize: highReturn - lowReturn
  };
}).filter(x => x && x.totalReturn3p1 > -100 && x.totalReturn3p1 < 500);

const inRangeCount = fullAnalysis.filter(s => s.inRange).length;
const belowCount = fullAnalysis.filter(s => s.totalReturn3p1 < s.lowReturn).length;
const aboveCount = fullAnalysis.filter(s => s.totalReturn3p1 > s.highReturn).length;
const avgPosition = inRangeCount > 0 
  ? fullAnalysis.filter(s => s.inRange).reduce((sum, s) => sum + s.positionInRange, 0) / inRangeCount 
  : 0;
const avgDiffFromHigh = fullAnalysis.reduce((sum, s) => sum + Math.abs(s.diffFromHigh), 0) / fullAnalysis.length;
const avgDiffFromLow = fullAnalysis.reduce((sum, s) => sum + Math.abs(s.diffFromLow), 0) / fullAnalysis.length;

console.log(`Résultats sur ${fullAnalysis.length} titres:`);
console.log(`  ✅ Dans la fourchette [Low, High]: ${inRangeCount} (${(inRangeCount/fullAnalysis.length*100).toFixed(1)}%)`);
console.log(`  ⚠️ En dessous de Low: ${belowCount} (${(belowCount/fullAnalysis.length*100).toFixed(1)}%)`);
console.log(`  ⚠️ Au dessus de High: ${aboveCount} (${(aboveCount/fullAnalysis.length*100).toFixed(1)}%)`);
console.log(`\n  Position moyenne dans la fourchette (si dans range): ${avgPosition.toFixed(1)}%`);
console.log(`  Écart moyen avec High Return: ${avgDiffFromHigh.toFixed(1)} points`);
console.log(`  Écart moyen avec Low Return: ${avgDiffFromLow.toFixed(1)} points`);

const closeToHigh = fullAnalysis.filter(s => s.inRange && s.positionInRange > 80).length;
const closeToLow = fullAnalysis.filter(s => s.inRange && s.positionInRange < 20).length;
const inMiddle = fullAnalysis.filter(s => s.inRange && s.positionInRange >= 20 && s.positionInRange <= 80).length;

console.log(`\n  Distribution dans la fourchette:`);
console.log(`    Proche de High (>80%): ${closeToHigh} titres`);
console.log(`    Au milieu (20-80%): ${inMiddle} titres`);
console.log(`    Proche de Low (<20%): ${closeToLow} titres`);

console.log('\n=== ANALYSE 2: COMPARAISON P/E RATIOS ===\n');

const peComparison = data2.map(v => {
  const pe1 = parseFloat(v['Current P/E Ratio']) || 0;
  const pe2 = parseFloat(v['Current P/E Ratio_1']) || 0;
  const diff = pe1 - pe2;
  const diffPercent = pe2 > 0 ? (diff / pe2) * 100 : 0;
  return { ticker: v.Ticker, pe1, pe2, diff, diffPercent, absDiffPercent: Math.abs(diffPercent) };
}).filter(x => x.pe1 > 0 && x.pe2 > 0 && x.pe1 < 200 && x.pe2 < 200); // Filtrer les valeurs aberrantes

const avgDiff = peComparison.reduce((sum, x) => sum + x.diffPercent, 0) / peComparison.length;
const avgAbsDiff = peComparison.reduce((sum, x) => sum + x.absDiffPercent, 0) / peComparison.length;

console.log(`Statistiques P/E Ratio vs P/E Ratio_1 (${peComparison.length} titres valides):`);
console.log(`  Écart moyen: ${avgDiff.toFixed(2)}%`);
console.log(`  Écart absolu moyen: ${avgAbsDiff.toFixed(2)}%`);

// Analyser lequel est meilleur pour JPEGY
console.log('\n=== ANALYSE 3: JPEGY AVEC DIFFÉRENTS P/E ===\n');

const jpegyComparison = data2.slice(0, 50).map(v => {
  const epsGrowth = parseFloat(v['Projected EPS Growth 3 To 5 Yr']) || 0;
  const projYield = parseFloat(v['3 To 5 Year Proj Dividend Yield']) || 0;
  const currentPE = parseFloat(v['Current P/E Ratio']) || 0;
  const currentPE1 = parseFloat(v['Current P/E Ratio_1']) || 0;
  const growthPlusYield = epsGrowth + projYield;
  
  if (growthPlusYield <= 0 || currentPE <= 0 || currentPE1 <= 0 || currentPE > 200 || currentPE1 > 200) return null;
  
  const jpegy1 = currentPE / growthPlusYield;
  const jpegy2 = currentPE1 / growthPlusYield;
  const diff = jpegy1 - jpegy2;
  const diffPercent = jpegy2 > 0 ? (diff / jpegy2) * 100 : 0;
  
  // Déterminer lequel est "meilleur" (plus bas = meilleur pour JPEGY)
  const better = Math.abs(diffPercent) < 5 ? '≈' : (jpegy1 < jpegy2 ? 'P/E1' : 'P/E2');
  
  return { ticker: v.Ticker, epsGrowth, projYield, growthPlusYield, currentPE, currentPE1, jpegy1, jpegy2, diffPercent, better };
}).filter(x => x);

const pe1Better = jpegyComparison.filter(j => j.better === 'P/E1').length;
const pe2Better = jpegyComparison.filter(j => j.better === 'P/E2').length;
const similar = jpegyComparison.filter(j => j.better === '≈').length;

console.log(`Comparaison JPEGY (échantillon de ${jpegyComparison.length} titres):`);
console.log(`  P/E Ratio meilleur: ${pe1Better} titres`);
console.log(`  P/E Ratio_1 meilleur: ${pe2Better} titres`);
console.log(`  Similaires (écart < 5%): ${similar} titres`);
console.log(`\n  Recommandation: ${pe2Better > pe1Better ? 'P/E Ratio_1' : 'P/E Ratio'} semble meilleur pour JPEGY`);

console.log('\n=== ANALYSE 4: VALEURS PAR DÉFAUT ===\n');

const currentPEs = data2.map(v => parseFloat(v['Current P/E Ratio']) || 0).filter(p => p > 0 && p < 100);
const currentPE1s = data2.map(v => parseFloat(v['Current P/E Ratio_1']) || 0).filter(p => p > 0 && p < 100);

const avgPE = currentPEs.reduce((a, b) => a + b, 0) / currentPEs.length;
const avgPE1 = currentPE1s.reduce((a, b) => a + b, 0) / currentPE1s.length;
const medianPE = [...currentPEs].sort((a, b) => a - b)[Math.floor(currentPEs.length / 2)];
const medianPE1 = [...currentPE1s].sort((a, b) => a - b)[Math.floor(currentPE1s.length / 2)];

console.log('P/E Ratios ValueLine:');
console.log(`  P/E Ratio (moyenne): ${avgPE.toFixed(2)}`);
console.log(`  P/E Ratio (médiane): ${medianPE.toFixed(2)}`);
console.log(`  P/E Ratio_1 (moyenne): ${avgPE1.toFixed(2)}`);
console.log(`  P/E Ratio_1 (médiane): ${medianPE1.toFixed(2)}`);
console.log(`\n  Recommandation targetPE par défaut: ${medianPE1.toFixed(1)} (médiane P/E Ratio_1)`);
console.log(`  Valeur actuelle 3p1: 23.0`);
console.log(`  Écart: ${(medianPE1 - 23.0).toFixed(1)} points`);

// Exemples de comparaison
console.log('\n=== EXEMPLES DE COMPARAISON ===\n');
const examples = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'V', 'JNJ'];
examples.forEach(ticker => {
  const v = data2.find(r => r.Ticker === ticker);
  if (!v) return;
  
  const epsGrowth = parseFloat(v['Projected EPS Growth 3 To 5 Yr']) || 0;
  const projYield = parseFloat(v['3 To 5 Year Proj Dividend Yield']) || 0;
  const currentPE = parseFloat(v['Current P/E Ratio']) || 0;
  const currentPE1 = parseFloat(v['Current P/E Ratio_1']) || 0;
  const highReturn = parseFloat(v['Proj High TTL Return']) || 0;
  const lowReturn = parseFloat(v['Proj Low TTL Return']) || 0;
  
  const growthPlusYield = epsGrowth + projYield;
  const jpegy1 = growthPlusYield > 0 ? currentPE / growthPlusYield : 0;
  const jpegy2 = growthPlusYield > 0 ? currentPE1 / growthPlusYield : 0;
  
  console.log(`${ticker}:`);
  console.log(`  P/E Ratio: ${currentPE.toFixed(2)} → JPEGY: ${jpegy1.toFixed(2)}`);
  console.log(`  P/E Ratio_1: ${currentPE1.toFixed(2)} → JPEGY: ${jpegy2.toFixed(2)}`);
  console.log(`  ValueLine Return: [${lowReturn}% - ${highReturn}%]`);
  console.log('');
});

