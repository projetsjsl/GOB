#!/usr/bin/env node
/**
 * SPRINT 2 SAMPLE: Sync Key Tickers with Real FMP Data
 * Tests the sync process with important tickers
 *
 * Usage: node scripts/sprint2-sync-sample-tickers.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const FMP_API_KEY = process.env.FMP_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

if (!FMP_API_KEY) {
  console.error('❌ Missing FMP_API_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const STRICT_MODE = process.env.STRICT_SYNC !== 'false';
const REQUIRED_YEARS = 30;
const DATA_SOURCE = 'fmp-verified';

// Key tickers to test
const KEY_TICKERS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META',
  'NVDA', 'TSLA', 'JPM', 'V', 'WMT',
  'JNJ', 'PG', 'MA', 'HD', 'CVX',
  'TD.TO', 'RY.TO', 'BCE.TO', 'ENB.TO', 'CNQ.TO'
];

// Progress tracking
const progress = {
  total: KEY_TICKERS.length,
  success: 0,
  failed: 0,
  errors: []
};

/**
 * Fetch data from FMP
 */
async function fetchFMP(url, label) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    if (!data || (Array.isArray(data) && data.length === 0)) {
      throw new Error(`No ${label} data returned`);
    }
    return Array.isArray(data) ? data : [data];
  } catch (error) {
    throw new Error(`${label} fetch failed: ${error.message}`);
  }
}

/**
 * Calculate CAGR
 */
function calculateCAGR(start, end, years) {
  if (!Number.isFinite(start) || !Number.isFinite(end) || years <= 0) return 0;
  if (start <= 0 || end <= 0) return 0;
  return (Math.pow(end / start, 1 / years) - 1) * 100;
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function getRecentWindow(annualData, count) {
  return [...annualData]
    .sort((a, b) => b.year - a.year)
    .slice(0, count)
    .reverse();
}

function calculateGrowthRate(annualData, key) {
  const window = getRecentWindow(annualData, 5);
  if (window.length < 2) return null;
  const start = window[0][key];
  const end = window[window.length - 1][key];
  if (!isFiniteNumber(start) || !isFiniteNumber(end) || start <= 0 || end <= 0) return null;
  return calculateCAGR(start, end, window.length - 1);
}

function calculateGrowthRateFromSeries(series) {
  const window = [...series]
    .filter(item => Number.isFinite(item.year) && isFiniteNumber(item.value))
    .sort((a, b) => b.year - a.year)
    .slice(0, 5)
    .reverse();
  if (window.length < 2) return null;
  const start = window[0].value;
  const end = window[window.length - 1].value;
  if (!isFiniteNumber(start) || !isFiniteNumber(end) || start <= 0 || end <= 0) return null;
  return calculateCAGR(start, end, window.length - 1);
}

function calculateTargetRatio(annualData, key) {
  const window = getRecentWindow(annualData, 3);
  const ratios = window
    .map(row => {
      if (!isFiniteNumber(row[key]) || row[key] <= 0) return null;
      if (!isFiniteNumber(row.priceHigh) || !isFiniteNumber(row.priceLow)) return null;
      const avgPrice = (row.priceHigh + row.priceLow) / 2;
      if (!isFiniteNumber(avgPrice) || avgPrice <= 0) return null;
      return avgPrice / row[key];
    })
    .filter(val => isFiniteNumber(val) && val > 0);
  return ratios.length > 0 ? ratios.reduce((sum, v) => sum + v, 0) / ratios.length : null;
}

function calculateTargetYield(annualData) {
  const window = getRecentWindow(annualData, 3);
  const yields = window
    .map(row => {
      if (!isFiniteNumber(row.dividendPerShare)) return null;
      if (!isFiniteNumber(row.priceHigh) || !isFiniteNumber(row.priceLow)) return null;
      const avgPrice = (row.priceHigh + row.priceLow) / 2;
      if (!isFiniteNumber(avgPrice) || avgPrice <= 0) return null;
      return (row.dividendPerShare / avgPrice) * 100;
    })
    .filter(val => isFiniteNumber(val) && val >= 0);
  return yields.length > 0 ? yields.reduce((sum, v) => sum + v, 0) / yields.length : null;
}

/**
 * Sync a single ticker
 */
async function syncTicker(ticker) {
  try {
    console.log(`\n📊 Syncing ${ticker}...`);

    // Fetch all data
    const [profileData, incomeData, cashFlowData, metricsData, pricesData] = await Promise.all([
      fetchFMP(`https://financialmodelingprep.com/api/v3/profile/${ticker}?apikey=${FMP_API_KEY}`, 'Profile'),
      fetchFMP(`https://financialmodelingprep.com/api/v3/income-statement/${ticker}?limit=30&apikey=${FMP_API_KEY}`, 'Income'),
      fetchFMP(`https://financialmodelingprep.com/api/v3/cash-flow-statement/${ticker}?limit=30&apikey=${FMP_API_KEY}`, 'CashFlow'),
      fetchFMP(`https://financialmodelingprep.com/api/v3/key-metrics/${ticker}?limit=30&apikey=${FMP_API_KEY}`, 'Metrics'),
      fetchFMP(`https://financialmodelingprep.com/api/v3/historical-price-full/${ticker}?apikey=${FMP_API_KEY}`, 'Prices')
    ]);

    const profile = profileData[0];
    const historicalPrices = pricesData[0]?.historical || [];

    // Build annual data
    const dataByYear = new Map();
    const ensureYear = (year) => {
      if (!dataByYear.has(year)) dataByYear.set(year, { year });
      return dataByYear.get(year);
    };

    metricsData.forEach(metric => {
      const year = parseInt(metric.date?.substring(0, 4), 10);
      if (!Number.isFinite(year)) return;
      const row = ensureYear(year);
      row.earningsPerShare = toNumber(metric.netIncomePerShare ?? metric.earningsPerShare);
      row.cashFlowPerShare = toNumber(metric.operatingCashFlowPerShare);
      row.bookValuePerShare = toNumber(metric.bookValuePerShare);
      row.dividendPerShare = toNumber(metric.dividendPerShare);
    });

    incomeData.forEach(stmt => {
      const year = parseInt(stmt.date?.substring(0, 4), 10);
      if (!Number.isFinite(year)) return;
      const row = ensureYear(year);
      if (!isFiniteNumber(row.earningsPerShare)) {
        row.earningsPerShare = toNumber(stmt.epsdiluted ?? stmt.eps);
      }
    });

    cashFlowData.forEach(cf => {
      const year = parseInt(cf.date?.substring(0, 4), 10);
      if (!Number.isFinite(year)) return;
      const row = ensureYear(year);
      const shares = toNumber(cf.weightedAverageShsOut ?? cf.weightedAverageShsOutDiluted ?? cf.sharesOutstanding);
      if (!isFiniteNumber(row.cashFlowPerShare) && isFiniteNumber(shares) && shares > 0) {
        const cashFlow = toNumber(cf.freeCashFlow ?? cf.operatingCashFlow);
        row.cashFlowPerShare = isFiniteNumber(cashFlow) ? cashFlow / shares : null;
      }
      if (!isFiniteNumber(row.dividendPerShare) && isFiniteNumber(shares) && shares > 0) {
        const dividends = toNumber(cf.dividendsPaid);
        row.dividendPerShare = isFiniteNumber(dividends) ? Math.abs(dividends / shares) : null;
      }
    });

    const pricesByYear = new Map();
    historicalPrices.forEach(price => {
      const year = parseInt(price.date?.substring(0, 4), 10);
      if (!Number.isFinite(year)) return;
      const high = toNumber(price.high ?? price.close);
      const low = toNumber(price.low ?? price.close);
      if (!pricesByYear.has(year)) pricesByYear.set(year, { highs: [], lows: [] });
      if (isFiniteNumber(high)) pricesByYear.get(year).highs.push(high);
      if (isFiniteNumber(low)) pricesByYear.get(year).lows.push(low);
    });

    pricesByYear.forEach((prices, year) => {
      const row = ensureYear(year);
      if (prices.highs.length > 0) row.priceHigh = Math.max(...prices.highs);
      if (prices.lows.length > 0) row.priceLow = Math.min(...prices.lows);
    });

    const annualData = Array.from(dataByYear.values())
      .filter(row => Number.isFinite(row.year))
      .filter(row =>
        isFiniteNumber(row.earningsPerShare) &&
        isFiniteNumber(row.cashFlowPerShare) &&
        isFiniteNumber(row.bookValuePerShare) &&
        isFiniteNumber(row.dividendPerShare) &&
        isFiniteNumber(row.priceHigh) &&
        isFiniteNumber(row.priceLow)
      )
      .sort((a, b) => b.year - a.year)
      .slice(0, REQUIRED_YEARS)
      .map(row => ({
        year: row.year,
        earningsPerShare: row.earningsPerShare,
        cashFlowPerShare: row.cashFlowPerShare,
        bookValuePerShare: row.bookValuePerShare,
        dividendPerShare: row.dividendPerShare,
        priceHigh: row.priceHigh,
        priceLow: row.priceLow,
        autoFetched: true,
        dataSource: DATA_SOURCE
      }));

    if (annualData.length === 0) {
      throw new Error('No annual data built');
    }

    if (STRICT_MODE && annualData.length < REQUIRED_YEARS) {
      throw new Error(`Only ${annualData.length} complete years (required ${REQUIRED_YEARS})`);
    }

    const currentPrice = profile.price || 0;
    if (currentPrice <= 0) {
      throw new Error('Invalid current price');
    }

    const growthRateEPS = calculateGrowthRate(annualData, 'earningsPerShare');
    const growthRateCF = calculateGrowthRate(annualData, 'cashFlowPerShare');
    const growthRateBV = calculateGrowthRate(annualData, 'bookValuePerShare');
    const growthRateDiv = calculateGrowthRate(annualData, 'dividendPerShare');
    const revenueSeries = incomeData
      .map(stmt => ({
        year: parseInt(stmt.date?.substring(0, 4), 10),
        value: toNumber(stmt.revenue)
      }))
      .filter(entry => Number.isFinite(entry.year) && isFiniteNumber(entry.value));
    const growthRateSales = calculateGrowthRateFromSeries(revenueSeries);

    const targetPE = calculateTargetRatio(annualData, 'earningsPerShare');
    const targetPCF = calculateTargetRatio(annualData, 'cashFlowPerShare');
    const targetPBV = calculateTargetRatio(annualData, 'bookValuePerShare');
    const targetYield = calculateTargetYield(annualData);

    const baseYear = annualData[0]?.year;
    const currentDividend = annualData[0]?.dividendPerShare ?? 0;
    const baseEPS = annualData[0]?.earningsPerShare ?? 0;
    const dividendPayoutRatio = baseEPS > 0 ? (currentDividend / baseEPS) * 100 : 0;

    const missing = [];
    if (growthRateEPS === null) missing.push('growthRateEPS');
    if (growthRateCF === null) missing.push('growthRateCF');
    if (growthRateBV === null) missing.push('growthRateBV');
    if (growthRateDiv === null) missing.push('growthRateDiv');
    if (growthRateSales === null) missing.push('growthRateSales');
    if (targetPE === null) missing.push('targetPE');
    if (targetPCF === null) missing.push('targetPCF');
    if (targetPBV === null) missing.push('targetPBV');
    if (targetYield === null) missing.push('targetYield');
    if (!Number.isFinite(baseYear)) missing.push('baseYear');

    if (STRICT_MODE && missing.length > 0) {
      throw new Error(`Missing derived values: ${missing.join(', ')}`);
    }

    const assumptions = {
      currentPrice,
      currentDividend,
      growthRateEPS: growthRateEPS !== null ? Math.max(-50, Math.min(100, growthRateEPS)) : 0,
      growthRateSales: growthRateSales !== null ? Math.max(-50, Math.min(100, growthRateSales)) : 0,
      growthRateCF: growthRateCF !== null ? Math.max(-50, Math.min(100, growthRateCF)) : 0,
      growthRateBV: growthRateBV !== null ? Math.max(-50, Math.min(100, growthRateBV)) : 0,
      growthRateDiv: growthRateDiv !== null ? Math.max(-50, Math.min(100, growthRateDiv)) : 0,
      targetPE: targetPE !== null ? Math.max(1, Math.min(100, targetPE)) : 0,
      targetPCF: targetPCF !== null ? Math.max(1, Math.min(100, targetPCF)) : 0,
      targetPBV: targetPBV !== null ? Math.max(0.1, Math.min(50, targetPBV)) : 0,
      targetYield: targetYield !== null ? Math.max(0, Math.min(20, targetYield)) : 0,
      requiredReturn: 10,
      dividendPayoutRatio,
      baseYear
    };

    const companyInfo = {
      symbol: profile.symbol,
      name: profile.companyName || profile.symbol,
      sector: profile.sector || 'Unknown',
      industry: profile.industry || 'Unknown',
      marketCap: profile.mktCap || 0,
      beta: profile.beta || 1.0,
      exchange: profile.exchangeShortName || 'NYSE',
      currency: profile.currency || 'USD',
      country: profile.country || 'US',
      dataSource: DATA_SOURCE
    };

    const { error } = await supabase
      .rpc('create_current_snapshot', {
        p_ticker: ticker,
        p_profile_id: ticker,
        p_user_id: null,
        p_notes: `Auto-synced from FMP on ${new Date().toISOString()}`,
        p_snapshot_date: new Date().toISOString().split('T')[0],
        p_is_watchlist: false,
        p_auto_fetched: true,
        p_annual_data: annualData,
        p_assumptions: assumptions,
        p_company_info: companyInfo,
        p_sync_metadata: {
          syncedAt: new Date().toISOString(),
          source: DATA_SOURCE,
          dataYears: annualData.length,
          strictMode: STRICT_MODE,
          requiredYears: REQUIRED_YEARS
        }
      })
      .single();

    if (error) throw error;

    progress.success++;
    console.log(`✅ ${ticker}: ${annualData.length} years, Price: $${currentPrice.toFixed(2)}, ${companyInfo.sector}`);

    return { success: true };
  } catch (error) {
    progress.failed++;
    progress.errors.push({ ticker, error: error.message });
    console.log(`❌ ${ticker}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * MAIN
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  SPRINT 2 SAMPLE: SYNC KEY TICKERS');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log(`🚀 Syncing ${KEY_TICKERS.length} key tickers...\n`);

  const startTime = Date.now();

  for (const ticker of KEY_TICKERS) {
    await syncTicker(ticker);
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  SYNC COMPLETE');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log(`Total: ${progress.total}`);
  console.log(`✅ Success: ${progress.success}`);
  console.log(`❌ Failed: ${progress.failed}`);
  console.log(`⏱️  Time: ${totalTime} min`);
  console.log(`📈 Success Rate: ${((progress.success/progress.total)*100).toFixed(1)}%`);

  if (progress.errors.length > 0) {
    console.log('\n❌ Failed Tickers:');
    progress.errors.forEach(({ ticker, error }) => {
      console.log(`   ${ticker}: ${error}`);
    });
  }

  console.log('\n✅ SPRINT 2 SAMPLE COMPLETE');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
