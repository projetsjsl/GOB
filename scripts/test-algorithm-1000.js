/**
 * Test de 1000 tickers pour analyse d'algorithme de projection EPS
 *
 * Objectif: Comprendre quand utiliser Consensus vs CAGR et comment combiner
 * les deux methodes pour un algorithme optimal.
 *
 * Usage: node scripts/test-algorithm-1000.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const FMP_KEY = process.env.FMP_API_KEY || process.env.FMP_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL et SUPABASE_KEY requis dans .env.local');
  process.exit(1);
}

if (!FMP_KEY) {
  console.error('FMP_API_KEY requis dans .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Stats detaillees
const stats = {
  total: 0,
  tested: 0,
  withConsensus: 0,
  withCAGROnly: 0,
  errors: 0,
  noData: 0,
  rateLimited: 0,
  negativeEPS: 0,
  positiveEPS: 0,

  // Analyse par nombre d'analystes
  analystBuckets: {
    '0-5': { count: 0, coherent: 0, divergent: 0, avgDivergence: 0 },
    '6-10': { count: 0, coherent: 0, divergent: 0, avgDivergence: 0 },
    '11-20': { count: 0, coherent: 0, divergent: 0, avgDivergence: 0 },
    '21+': { count: 0, coherent: 0, divergent: 0, avgDivergence: 0 }
  },

  // Analyse par CAGR historique
  cagrBuckets: {
    'negative': { count: 0, coherent: 0, divergent: 0, avgDivergence: 0 },
    '0-5%': { count: 0, coherent: 0, divergent: 0, avgDivergence: 0 },
    '5-10%': { count: 0, coherent: 0, divergent: 0, avgDivergence: 0 },
    '10-20%': { count: 0, coherent: 0, divergent: 0, avgDivergence: 0 },
    '20%+': { count: 0, coherent: 0, divergent: 0, avgDivergence: 0 }
  },

  // Analyse par market cap (approximation via P/E)
  marketCapBuckets: {
    'small': { count: 0, coherent: 0, divergent: 0, avgDivergence: 0 },   // PE < 15
    'mid': { count: 0, coherent: 0, divergent: 0, avgDivergence: 0 },     // PE 15-25
    'large': { count: 0, coherent: 0, divergent: 0, avgDivergence: 0 }    // PE > 25
  },

  // Pour calcul des moyennes
  divergences: [],
  results: []
};

// Fonctions de calcul
function calculateCAGR(startValue, endValue, years) {
  if (startValue <= 0 || endValue <= 0 || years <= 0) return 0;
  const result = (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
  return isFinite(result) ? result : 0;
}

function projectFutureValue(current, rate, years) {
  if (!isFinite(current) || !isFinite(rate) || years <= 0) return current;
  const result = current * Math.pow(1 + rate / 100, years);
  return isFinite(result) ? result : 0;
}

function getBucketAnalyst(count) {
  if (count <= 5) return '0-5';
  if (count <= 10) return '6-10';
  if (count <= 20) return '11-20';
  return '21+';
}

function getBucketCAGR(cagr) {
  if (cagr < 0) return 'negative';
  if (cagr < 5) return '0-5%';
  if (cagr < 10) return '5-10%';
  if (cagr < 20) return '10-20%';
  return '20%+';
}

function getBucketMarketCap(pe) {
  if (pe < 15) return 'small';
  if (pe <= 25) return 'mid';
  return 'large';
}

// Test un ticker
async function testTicker(ticker, delay = 150) {
  await new Promise(r => setTimeout(r, delay));

  try {
    // 1. Fetch analyst estimates
    const estimatesUrl = `https://financialmodelingprep.com/api/v3/analyst-estimates/${ticker}?limit=5&apikey=${FMP_KEY}`;
    const estimatesRes = await fetch(estimatesUrl);

    if (estimatesRes.status === 429) {
      stats.rateLimited++;
      return { ticker, status: 'rate_limited' };
    }

    const estimates = estimatesRes.ok ? await estimatesRes.json() : [];

    // 2. Fetch historical metrics
    await new Promise(r => setTimeout(r, 100));
    const metricsUrl = `https://financialmodelingprep.com/api/v3/key-metrics/${ticker}?period=annual&limit=10&apikey=${FMP_KEY}`;
    const metricsRes = await fetch(metricsUrl);

    if (metricsRes.status === 429) {
      stats.rateLimited++;
      return { ticker, status: 'rate_limited' };
    }

    const metrics = metricsRes.ok ? await metricsRes.json() : [];

    // 3. Fetch current quote
    await new Promise(r => setTimeout(r, 100));
    const quoteUrl = `https://financialmodelingprep.com/api/v3/quote/${ticker}?apikey=${FMP_KEY}`;
    const quoteRes = await fetch(quoteUrl);
    const quote = quoteRes.ok ? await quoteRes.json() : [];

    if (!metrics || metrics.length < 2) {
      stats.noData++;
      return { ticker, status: 'no_data' };
    }

    // 4. Extract data
    const currentPrice = quote[0]?.price || 0;
    const currentEPS = metrics[0]?.netIncomePerShare || 0;
    const currentPE = currentEPS > 0 ? currentPrice / currentEPS : 15;

    // 5. Calculate CAGR (historique)
    const sortedMetrics = [...metrics].sort((a, b) => new Date(a.date) - new Date(b.date));
    const oldestEPS = sortedMetrics[0]?.netIncomePerShare || 0;
    const newestEPS = sortedMetrics[sortedMetrics.length - 1]?.netIncomePerShare || 0;
    const years = sortedMetrics.length - 1;

    const historicalCAGR = calculateCAGR(oldestEPS, newestEPS, years);
    const cagrProjectedEPS = projectFutureValue(currentEPS, historicalCAGR, 5);
    const cagrTargetPrice = cagrProjectedEPS * currentPE;

    // 6. Calculate Consensus
    const currentYear = new Date().getFullYear();
    const futureEstimates = (estimates || [])
      .filter(e => {
        if (!e || !e.date) return false;
        const year = parseInt(e.date.split('-')[0]);
        return year > currentYear &&
               e.estimatedEpsAvg !== null &&
               e.estimatedEpsAvg !== undefined &&
               isFinite(e.estimatedEpsAvg);
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    let consensusResult = null;
    let method = 'cagr';
    let analystCount = 0;

    if (futureEstimates.length >= 1) {
      const farthest = futureEstimates[futureEstimates.length - 1];
      const estimateYear = parseInt(farthest.date.split('-')[0]);
      const yearsToEstimate = estimateYear - currentYear;
      analystCount = farthest.numberAnalystsEstimatedEps || 0;

      if (yearsToEstimate >= 1) {
        method = 'consensus';
        stats.withConsensus++;

        const canUseCAGR = currentEPS > 0 && farthest.estimatedEpsAvg > 0;
        let projectedEPS;
        let impliedCAGR = 0;

        if (canUseCAGR) {
          impliedCAGR = calculateCAGR(currentEPS, farthest.estimatedEpsAvg, yearsToEstimate);
          projectedEPS = projectFutureValue(currentEPS, impliedCAGR, 5);
        } else {
          // Linear extrapolation
          const epsChange = farthest.estimatedEpsAvg - currentEPS;
          const yearlyChange = epsChange / yearsToEstimate;
          projectedEPS = farthest.estimatedEpsAvg + (yearlyChange * (5 - yearsToEstimate));
        }

        consensusResult = {
          estimatedEpsAvg: farthest.estimatedEpsAvg,
          analystCount,
          impliedCAGR,
          projectedEPS,
          targetPrice: projectedEPS * currentPE
        };
      }
    }

    if (method === 'cagr') {
      stats.withCAGROnly++;
    }

    // 7. Calculate divergence
    let divergencePercent = 0;
    let isCoherent = true;

    if (consensusResult && cagrTargetPrice > 0 && consensusResult.targetPrice > 0) {
      divergencePercent = ((consensusResult.targetPrice - cagrTargetPrice) / cagrTargetPrice) * 100;
      isCoherent = Math.abs(divergencePercent) < 50;
    }

    // 8. Update buckets
    if (consensusResult) {
      // Bucket analystes
      const analystBucket = getBucketAnalyst(analystCount);
      stats.analystBuckets[analystBucket].count++;
      if (isCoherent) stats.analystBuckets[analystBucket].coherent++;
      else stats.analystBuckets[analystBucket].divergent++;

      // Bucket CAGR
      const cagrBucket = getBucketCAGR(historicalCAGR);
      stats.cagrBuckets[cagrBucket].count++;
      if (isCoherent) stats.cagrBuckets[cagrBucket].coherent++;
      else stats.cagrBuckets[cagrBucket].divergent++;

      // Bucket Market Cap (via PE)
      const mcBucket = getBucketMarketCap(currentPE);
      stats.marketCapBuckets[mcBucket].count++;
      if (isCoherent) stats.marketCapBuckets[mcBucket].coherent++;
      else stats.marketCapBuckets[mcBucket].divergent++;

      stats.divergences.push({
        ticker,
        divergence: divergencePercent,
        analystCount,
        cagr: historicalCAGR,
        pe: currentPE
      });
    }

    // Track EPS sign
    if (currentEPS > 0) stats.positiveEPS++;
    else stats.negativeEPS++;

    const result = {
      ticker,
      status: 'ok',
      method,
      currentPrice,
      currentEPS,
      currentPE: parseFloat(currentPE.toFixed(2)),
      historicalCAGR: parseFloat(historicalCAGR.toFixed(2)),
      analystCount,
      cagr: {
        projectedEPS: parseFloat(cagrProjectedEPS.toFixed(2)),
        targetPrice: parseFloat(cagrTargetPrice.toFixed(2))
      },
      consensus: consensusResult ? {
        impliedCAGR: parseFloat(consensusResult.impliedCAGR.toFixed(2)),
        projectedEPS: parseFloat(consensusResult.projectedEPS.toFixed(2)),
        targetPrice: parseFloat(consensusResult.targetPrice.toFixed(2))
      } : null,
      divergencePercent: parseFloat(divergencePercent.toFixed(1)),
      isCoherent
    };

    stats.results.push(result);
    return result;

  } catch (error) {
    stats.errors++;
    return { ticker, status: 'error', error: error.message };
  }
}

// Main
async function main() {
  console.log('='.repeat(80));
  console.log('ANALYSE ALGORITHMIQUE - 1000 TICKERS');
  console.log('Objectif: Determiner le meilleur algorithme de projection EPS');
  console.log('='.repeat(80));
  console.log('');

  // 1. Load tickers
  console.log('Chargement des tickers depuis Supabase...');
  const { data: tickers, error } = await supabase
    .from('tickers')
    .select('ticker, company_name')
    .eq('is_active', true)
    .limit(1000);

  if (error) {
    console.error('Erreur Supabase:', error.message);
    process.exit(1);
  }

  stats.total = tickers.length;
  console.log(`${stats.total} tickers charges\n`);

  // 2. Test each ticker
  console.log('Demarrage des tests (delai 150ms entre appels API)...\n');

  for (let i = 0; i < tickers.length; i++) {
    stats.tested++;
    const result = await testTicker(tickers[i].ticker, 150);

    const pct = ((stats.tested / stats.total) * 100).toFixed(0);
    const icon = result.status === 'ok'
      ? (result.method === 'consensus' ? '+' : '-')
      : 'x';

    if (stats.tested % 10 === 0 || stats.tested === stats.total) {
      process.stdout.write(`\r[${pct}%] ${stats.tested}/${stats.total} tickers `);
    }

    if (result.status === 'rate_limited') {
      console.log('\n Rate limited! Waiting 60s...');
      await new Promise(r => setTimeout(r, 60000));
      i--; // Retry
    }
  }

  console.log('\n\n');

  // 3. Analyze results
  console.log('='.repeat(80));
  console.log('RESULTATS ET ANALYSE');
  console.log('='.repeat(80));
  console.log('');

  console.log('STATISTIQUES GLOBALES:');
  console.log(`  Total tickers:        ${stats.total}`);
  console.log(`  Testes avec succes:   ${stats.tested - stats.errors - stats.noData}`);
  console.log(`  Avec Consensus:       ${stats.withConsensus} (${((stats.withConsensus/stats.tested)*100).toFixed(1)}%)`);
  console.log(`  CAGR seulement:       ${stats.withCAGROnly} (${((stats.withCAGROnly/stats.tested)*100).toFixed(1)}%)`);
  console.log(`  EPS positifs:         ${stats.positiveEPS}`);
  console.log(`  EPS negatifs/zero:    ${stats.negativeEPS}`);
  console.log(`  Pas de donnees:       ${stats.noData}`);
  console.log(`  Erreurs:              ${stats.errors}`);
  console.log('');

  // 4. Analysis by analyst count
  console.log('ANALYSE PAR NOMBRE D\'ANALYSTES:');
  console.log('-'.repeat(70));
  console.log('Bucket       | Count | Coherent | Divergent | % Coherent | Conclusion');
  console.log('-'.repeat(70));

  for (const [bucket, data] of Object.entries(stats.analystBuckets)) {
    if (data.count > 0) {
      const pctCoherent = ((data.coherent / data.count) * 100).toFixed(1);
      let conclusion = '';
      if (parseFloat(pctCoherent) >= 60) conclusion = 'FIABLE';
      else if (parseFloat(pctCoherent) >= 40) conclusion = 'MOYEN';
      else conclusion = 'PEU FIABLE';

      console.log(
        `${bucket.padEnd(12)} | ${String(data.count).padStart(5)} | ${String(data.coherent).padStart(8)} | ${String(data.divergent).padStart(9)} | ${pctCoherent.padStart(10)}% | ${conclusion}`
      );
    }
  }
  console.log('');

  // 5. Analysis by CAGR
  console.log('ANALYSE PAR CAGR HISTORIQUE:');
  console.log('-'.repeat(70));
  console.log('Bucket       | Count | Coherent | Divergent | % Coherent | Conclusion');
  console.log('-'.repeat(70));

  for (const [bucket, data] of Object.entries(stats.cagrBuckets)) {
    if (data.count > 0) {
      const pctCoherent = ((data.coherent / data.count) * 100).toFixed(1);
      let conclusion = '';
      if (parseFloat(pctCoherent) >= 60) conclusion = 'STABLE';
      else if (parseFloat(pctCoherent) >= 40) conclusion = 'VARIABLE';
      else conclusion = 'INSTABLE';

      console.log(
        `${bucket.padEnd(12)} | ${String(data.count).padStart(5)} | ${String(data.coherent).padStart(8)} | ${String(data.divergent).padStart(9)} | ${pctCoherent.padStart(10)}% | ${conclusion}`
      );
    }
  }
  console.log('');

  // 6. Analysis by Market Cap (PE proxy)
  console.log('ANALYSE PAR P/E RATIO (proxy market cap):');
  console.log('-'.repeat(70));
  console.log('Bucket       | Count | Coherent | Divergent | % Coherent | Conclusion');
  console.log('-'.repeat(70));

  for (const [bucket, data] of Object.entries(stats.marketCapBuckets)) {
    if (data.count > 0) {
      const pctCoherent = ((data.coherent / data.count) * 100).toFixed(1);
      let conclusion = '';
      if (parseFloat(pctCoherent) >= 60) conclusion = 'PREVISIBLE';
      else if (parseFloat(pctCoherent) >= 40) conclusion = 'MOYEN';
      else conclusion = 'IMPREVISIBLE';

      console.log(
        `${bucket.padEnd(12)} | ${String(data.count).padStart(5)} | ${String(data.coherent).padStart(8)} | ${String(data.divergent).padStart(9)} | ${pctCoherent.padStart(10)}% | ${conclusion}`
      );
    }
  }
  console.log('');

  // 7. Algorithm recommendations
  console.log('='.repeat(80));
  console.log('RECOMMANDATIONS ALGORITHMIQUES');
  console.log('='.repeat(80));
  console.log('');

  // Find optimal analyst threshold
  let bestAnalystThreshold = 0;
  let bestAnalystCoherence = 0;
  for (const [bucket, data] of Object.entries(stats.analystBuckets)) {
    if (data.count >= 10) {
      const coherence = data.coherent / data.count;
      if (coherence > bestAnalystCoherence) {
        bestAnalystCoherence = coherence;
        bestAnalystThreshold = bucket;
      }
    }
  }

  console.log('ALGORITHME PROPOSE:');
  console.log('');
  console.log('1. SI nombre_analystes >= 10 ET consensus_disponible:');
  console.log('   -> UTILISER CONSENSUS (poids 70%) + CAGR (poids 30%)');
  console.log('');
  console.log('2. SI nombre_analystes < 10 MAIS consensus_disponible:');
  console.log('   -> UTILISER CAGR (poids 60%) + CONSENSUS (poids 40%)');
  console.log('');
  console.log('3. SI pas de consensus:');
  console.log('   -> UTILISER CAGR seul');
  console.log('');
  console.log('4. SI EPS negatif:');
  console.log('   -> UTILISER extrapolation lineaire du consensus');
  console.log('   -> OU CAGR revenues si disponible');
  console.log('');

  console.log('FORMULE FINALE:');
  console.log('');
  console.log('  weightedEPS = ');
  console.log('    IF analysts >= 10:');
  console.log('      0.70 * consensusEPS + 0.30 * cagrEPS');
  console.log('    ELSE IF analysts > 0:');
  console.log('      0.40 * consensusEPS + 0.60 * cagrEPS');
  console.log('    ELSE:');
  console.log('      cagrEPS');
  console.log('');
  console.log('  targetPrice = weightedEPS * targetPE');
  console.log('');

  // 8. Save detailed results
  const outputPath = './scripts/algorithm-analysis-1000.json';
  fs.writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    stats: {
      total: stats.total,
      tested: stats.tested,
      withConsensus: stats.withConsensus,
      withCAGROnly: stats.withCAGROnly,
      positiveEPS: stats.positiveEPS,
      negativeEPS: stats.negativeEPS,
      errors: stats.errors
    },
    analystBuckets: stats.analystBuckets,
    cagrBuckets: stats.cagrBuckets,
    marketCapBuckets: stats.marketCapBuckets,
    divergences: stats.divergences.sort((a, b) => Math.abs(b.divergence) - Math.abs(a.divergence)),
    results: stats.results
  }, null, 2));

  console.log(`Resultats detailles sauvegardes dans: ${outputPath}`);
  console.log('');
  console.log('='.repeat(80));
  console.log('ANALYSE TERMINEE');
  console.log('='.repeat(80));
}

main().catch(console.error);
