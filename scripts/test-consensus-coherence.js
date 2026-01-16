/**
 * Test de coherence: Consensus Analystes vs CAGR Historique
 *
 * Ce script teste la nouvelle implementation du calcul de projection EPS
 * en comparant les resultats consensus vs CAGR pour tous les tickers.
 *
 * Usage: node scripts/test-consensus-coherence.js
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

// Stats globales
const stats = {
  total: 0,
  tested: 0,
  withConsensus: 0,
  withCAGROnly: 0,
  errors: 0,
  coherent: 0,
  divergent: 0,
  noData: 0,
  rateLimited: 0,
  negativeEPS: 0,
  results: []
};

// Fonctions de calcul (reproduites du frontend)
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

// Fonction principale de test pour un ticker
async function testTicker(ticker, delay = 200) {
  await new Promise(r => setTimeout(r, delay)); // Rate limiting

  try {
    // 1. Fetch analyst estimates from FMP
    const estimatesUrl = `https://financialmodelingprep.com/api/v3/analyst-estimates/${ticker}?limit=5&apikey=${FMP_KEY}`;
    const estimatesRes = await fetch(estimatesUrl);

    if (estimatesRes.status === 429) {
      stats.rateLimited++;
      return { ticker, status: 'rate_limited', error: '429 Too Many Requests' };
    }

    const estimates = estimatesRes.ok ? await estimatesRes.json() : [];

    // 2. Fetch historical data from FMP
    const metricsUrl = `https://financialmodelingprep.com/api/v3/key-metrics/${ticker}?period=annual&limit=10&apikey=${FMP_KEY}`;
    const metricsRes = await fetch(metricsUrl);

    if (metricsRes.status === 429) {
      stats.rateLimited++;
      return { ticker, status: 'rate_limited', error: '429 Too Many Requests' };
    }

    const metrics = metricsRes.ok ? await metricsRes.json() : [];

    // 3. Fetch current quote
    const quoteUrl = `https://financialmodelingprep.com/api/v3/quote/${ticker}?apikey=${FMP_KEY}`;
    const quoteRes = await fetch(quoteUrl);
    const quote = quoteRes.ok ? await quoteRes.json() : [];

    if (!metrics || metrics.length < 2) {
      stats.noData++;
      return { ticker, status: 'no_data', error: 'Insufficient historical data' };
    }

    // 4. Extract current EPS
    const currentPrice = quote[0]?.price || 0;
    const currentEPS = metrics[0]?.netIncomePerShare || 0;
    const currentPE = currentEPS > 0 ? currentPrice / currentEPS : 15;

    // 5. Calculate historical CAGR (5 years)
    const sortedMetrics = [...metrics].sort((a, b) => new Date(a.date) - new Date(b.date));
    const oldestEPS = sortedMetrics[0]?.netIncomePerShare || 0;
    const newestEPS = sortedMetrics[sortedMetrics.length - 1]?.netIncomePerShare || 0;
    const years = sortedMetrics.length - 1;

    const historicalCAGR = calculateCAGR(oldestEPS, newestEPS, years);
    const cagrProjectedEPS = projectFutureValue(currentEPS, historicalCAGR, 5);
    const cagrTargetPrice = cagrProjectedEPS * currentPE;

    // 6. Calculate consensus projection
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

    if (futureEstimates.length >= 1) {
      const farthest = futureEstimates[futureEstimates.length - 1];
      const estimateYear = parseInt(farthest.date.split('-')[0]);
      const yearsToEstimate = estimateYear - currentYear;

      if (yearsToEstimate >= 1) {
        method = 'consensus';
        stats.withConsensus++;

        // Check for negative EPS
        if (currentEPS <= 0 || farthest.estimatedEpsAvg <= 0) {
          stats.negativeEPS++;
        }

        let projectedEPS;
        if (currentEPS > 0 && farthest.estimatedEpsAvg > 0) {
          const impliedCAGR = calculateCAGR(currentEPS, farthest.estimatedEpsAvg, yearsToEstimate);
          projectedEPS = projectFutureValue(currentEPS, impliedCAGR, 5);
        } else {
          // Linear extrapolation for negative EPS
          const epsChange = farthest.estimatedEpsAvg - currentEPS;
          const yearlyChange = epsChange / yearsToEstimate;
          projectedEPS = farthest.estimatedEpsAvg + (yearlyChange * (5 - yearsToEstimate));
        }

        consensusResult = {
          estimatedEpsAvg: farthest.estimatedEpsAvg,
          estimatedEpsLow: farthest.estimatedEpsLow,
          estimatedEpsHigh: farthest.estimatedEpsHigh,
          analystCount: farthest.numberAnalystsEstimatedEps || 0,
          projectedEPS,
          targetPrice: projectedEPS * currentPE
        };
      }
    }

    if (method === 'cagr') {
      stats.withCAGROnly++;
    }

    // 7. Calculate coherence (divergence between methods)
    let divergencePercent = 0;
    let isCoherent = true;

    if (consensusResult && cagrTargetPrice > 0) {
      divergencePercent = ((consensusResult.targetPrice - cagrTargetPrice) / cagrTargetPrice) * 100;
      // Coherent if within 50% divergence
      isCoherent = Math.abs(divergencePercent) < 50;
    }

    if (isCoherent) {
      stats.coherent++;
    } else {
      stats.divergent++;
    }

    const result = {
      ticker,
      status: 'ok',
      method,
      currentPrice,
      currentEPS,
      currentPE: currentPE.toFixed(2),
      cagr: {
        rate: historicalCAGR.toFixed(2),
        projectedEPS: cagrProjectedEPS.toFixed(2),
        targetPrice: cagrTargetPrice.toFixed(2)
      },
      consensus: consensusResult ? {
        analystCount: consensusResult.analystCount,
        estimatedEPS: consensusResult.estimatedEpsAvg?.toFixed(2),
        projectedEPS: consensusResult.projectedEPS?.toFixed(2),
        targetPrice: consensusResult.targetPrice?.toFixed(2),
        corridor: `${consensusResult.estimatedEpsLow?.toFixed(2)} - ${consensusResult.estimatedEpsHigh?.toFixed(2)}`
      } : null,
      divergencePercent: divergencePercent.toFixed(1),
      isCoherent
    };

    stats.results.push(result);
    return result;

  } catch (error) {
    stats.errors++;
    return { ticker, status: 'error', error: error.message };
  }
}

// Fonction principale
async function main() {
  console.log('='.repeat(80));
  console.log('TEST DE COHERENCE: Consensus Analystes vs CAGR Historique');
  console.log('='.repeat(80));
  console.log('');

  // 1. Charger les tickers depuis Supabase
  console.log('Chargement des tickers depuis Supabase...');
  const { data: tickers, error } = await supabase
    .from('tickers')
    .select('ticker, company_name')
    .eq('is_active', true)
    .limit(200);

  if (error) {
    console.error('Erreur Supabase:', error.message);
    process.exit(1);
  }

  stats.total = tickers.length;
  console.log(`${stats.total} tickers charges\n`);

  // 2. Tester chaque ticker
  console.log('Demarrage des tests (delai 250ms entre chaque appel API)...\n');

  const batchSize = 10;
  for (let i = 0; i < tickers.length; i += batchSize) {
    const batch = tickers.slice(i, i + batchSize);

    for (const t of batch) {
      stats.tested++;
      const result = await testTicker(t.ticker, 250);

      // Progress indicator
      const pct = ((stats.tested / stats.total) * 100).toFixed(0);
      const icon = result.status === 'ok'
        ? (result.method === 'consensus' ? '📊' : '📈')
        : '❌';

      process.stdout.write(`\r[${pct}%] ${stats.tested}/${stats.total} - ${t.ticker.padEnd(6)} ${icon} `);

      if (result.status === 'rate_limited') {
        console.log('\n⚠️  Rate limited! Waiting 60s...');
        await new Promise(r => setTimeout(r, 60000));
      }
    }
  }

  console.log('\n');

  // 3. Afficher les resultats
  console.log('='.repeat(80));
  console.log('RESULTATS');
  console.log('='.repeat(80));
  console.log('');

  console.log('STATISTIQUES GLOBALES:');
  console.log(`  Total tickers:        ${stats.total}`);
  console.log(`  Testes:               ${stats.tested}`);
  console.log(`  Avec Consensus:       ${stats.withConsensus} (${((stats.withConsensus/stats.tested)*100).toFixed(1)}%)`);
  console.log(`  CAGR seulement:       ${stats.withCAGROnly} (${((stats.withCAGROnly/stats.tested)*100).toFixed(1)}%)`);
  console.log(`  EPS negatifs:         ${stats.negativeEPS}`);
  console.log(`  Pas de donnees:       ${stats.noData}`);
  console.log(`  Erreurs:              ${stats.errors}`);
  console.log(`  Rate limited:         ${stats.rateLimited}`);
  console.log('');

  console.log('COHERENCE:');
  const testedOk = stats.coherent + stats.divergent;
  console.log(`  Coherents (<50%):     ${stats.coherent} (${((stats.coherent/testedOk)*100).toFixed(1)}%)`);
  console.log(`  Divergents (>50%):    ${stats.divergent} (${((stats.divergent/testedOk)*100).toFixed(1)}%)`);
  console.log('');

  // 4. Top 10 plus grandes divergences
  const divergent = stats.results
    .filter(r => r.status === 'ok' && r.consensus)
    .sort((a, b) => Math.abs(parseFloat(b.divergencePercent)) - Math.abs(parseFloat(a.divergencePercent)))
    .slice(0, 10);

  if (divergent.length > 0) {
    console.log('TOP 10 DIVERGENCES (Consensus vs CAGR):');
    console.log('-'.repeat(80));
    console.log('Ticker  | Consensus Target | CAGR Target | Divergence | Analystes');
    console.log('-'.repeat(80));

    for (const r of divergent) {
      console.log(
        `${r.ticker.padEnd(7)} | ` +
        `$${r.consensus.targetPrice.padStart(14)} | ` +
        `$${r.cagr.targetPrice.padStart(10)} | ` +
        `${r.divergencePercent.padStart(9)}% | ` +
        `${r.consensus.analystCount}`
      );
    }
    console.log('');
  }

  // 5. Exemples coherents
  const coherent = stats.results
    .filter(r => r.status === 'ok' && r.consensus && r.isCoherent)
    .slice(0, 10);

  if (coherent.length > 0) {
    console.log('EXEMPLES COHERENTS:');
    console.log('-'.repeat(80));
    console.log('Ticker  | Consensus Target | CAGR Target | Divergence | Analystes');
    console.log('-'.repeat(80));

    for (const r of coherent) {
      console.log(
        `${r.ticker.padEnd(7)} | ` +
        `$${r.consensus.targetPrice.padStart(14)} | ` +
        `$${r.cagr.targetPrice.padStart(10)} | ` +
        `${r.divergencePercent.padStart(9)}% | ` +
        `${r.consensus.analystCount}`
      );
    }
    console.log('');
  }

  // 6. Tickers avec EPS negatif
  const negativeEPS = stats.results
    .filter(r => r.status === 'ok' && parseFloat(r.currentEPS) <= 0);

  if (negativeEPS.length > 0) {
    console.log('TICKERS AVEC EPS NEGATIF/ZERO:');
    console.log('-'.repeat(80));
    for (const r of negativeEPS.slice(0, 10)) {
      console.log(`  ${r.ticker}: EPS = ${r.currentEPS}, Method = ${r.method}`);
    }
    console.log('');
  }

  // 7. Sauvegarder les resultats
  const outputPath = './scripts/test-consensus-results.json';
  fs.writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    stats: {
      total: stats.total,
      tested: stats.tested,
      withConsensus: stats.withConsensus,
      withCAGROnly: stats.withCAGROnly,
      coherent: stats.coherent,
      divergent: stats.divergent,
      errors: stats.errors,
      negativeEPS: stats.negativeEPS
    },
    results: stats.results
  }, null, 2));

  console.log(`Resultats sauvegardes dans: ${outputPath}`);
  console.log('');
  console.log('='.repeat(80));
  console.log('TEST TERMINE');
  console.log('='.repeat(80));
}

main().catch(console.error);
