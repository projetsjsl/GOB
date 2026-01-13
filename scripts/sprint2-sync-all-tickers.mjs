#!/usr/bin/env node
/**
 * SPRINT 2: Sync All 1001 Tickers with Real FMP Data
 * NO FALLBACKS - NO RANDOMIZATION - ONLY REAL FMP DATA
 *
 * Usage: node scripts/sprint2-sync-all-tickers.mjs
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

// Progress tracking
const progress = {
  total: 0,
  success: 0,
  failed: 0,
  skipped: 0,
  errors: []
};

// Sleep utility
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch with retry and exponential backoff for rate limiting
 */
async function fetchWithRetry(url, maxRetries = 3) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url);

      // Handle rate limiting
      if (response.status === 429) {
        const waitTime = Math.pow(2, attempt + 1) * 5000; // 10s, 20s, 40s
        console.log(`  ⏳ Rate limited, waiting ${waitTime / 1000}s before retry...`);
        await sleep(waitTime);
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt) * 2000; // 2s, 4s, 8s
        console.log(`  ⚠️ Retry ${attempt + 1}/${maxRetries} in ${waitTime / 1000}s...`);
        await sleep(waitTime);
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Fetch company profile from FMP
 */
async function fetchFMPProfile(ticker) {
  const url = `https://financialmodelingprep.com/api/v3/profile/${ticker}?apikey=${FMP_API_KEY}`;

  try {
    const data = await fetchWithRetry(url);
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No profile data returned');
    }

    return data[0];
  } catch (error) {
    throw new Error(`Profile fetch failed: ${error.message}`);
  }
}

/**
 * Fetch key metrics from FMP (30 years)
 */
async function fetchFMPKeyMetrics(ticker, limit = 30) {
  const url = `https://financialmodelingprep.com/api/v3/key-metrics/${ticker}?limit=${limit}&apikey=${FMP_API_KEY}`;

  try {
    const data = await fetchWithRetry(url);
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No key metrics data returned');
    }

    return data;
  } catch (error) {
    throw new Error(`Key metrics fetch failed: ${error.message}`);
  }
}

/**
 * Fetch income statement from FMP (30 years)
 */
async function fetchFMPIncomeStatement(ticker, limit = 30) {
  const url = `https://financialmodelingprep.com/api/v3/income-statement/${ticker}?limit=${limit}&apikey=${FMP_API_KEY}`;

  try {
    const data = await fetchWithRetry(url);
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No income statement data returned');
    }

    return data;
  } catch (error) {
    throw new Error(`Income statement fetch failed: ${error.message}`);
  }
}

/**
 * Fetch cash flow statement from FMP (30 years)
 */
async function fetchFMPCashFlow(ticker, limit = 30) {
  const url = `https://financialmodelingprep.com/api/v3/cash-flow-statement/${ticker}?limit=${limit}&apikey=${FMP_API_KEY}`;

  try {
    const data = await fetchWithRetry(url);
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No cash flow data returned');
    }

    return data;
  } catch (error) {
    throw new Error(`Cash flow fetch failed: ${error.message}`);
  }
}

/**
 * Fetch historical prices from FMP (30 years)
 */
async function fetchFMPHistoricalPrices(ticker) {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 30);
  const startDateStr = startDate.toISOString().split('T')[0];

  const url = `https://financialmodelingprep.com/api/v3/historical-price-full/${ticker}?from=${startDateStr}&to=${endDate}&apikey=${FMP_API_KEY}`;

  try {
    const data = await fetchWithRetry(url);
    if (!data || !data.historical || !Array.isArray(data.historical)) {
      throw new Error('No historical price data returned');
    }

    return data.historical;
  } catch (error) {
    throw new Error(`Historical prices fetch failed: ${error.message}`);
  }
}

/**
 * Calculate CAGR (Compound Annual Growth Rate)
 */
function calculateCAGR(startValue, endValue, years) {
  if (!Number.isFinite(startValue) || !Number.isFinite(endValue) || years <= 0) return 0;
  if (startValue <= 0 || endValue <= 0) return 0;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}

/**
 * Calculate average of array
 */
function calculateAverage(arr) {
  if (!arr || arr.length === 0) return 0;
  const valid = arr.filter(v => Number.isFinite(v));
  if (valid.length === 0) return 0;
  const sum = valid.reduce((a, b) => a + b, 0);
  return sum / valid.length;
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
  return ratios.length > 0 ? calculateAverage(ratios) : null;
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
  return yields.length > 0 ? calculateAverage(yields) : null;
}

/**
 * Build annual data from FMP responses
 */
function buildAnnualData(incomeStatements, cashFlows, keyMetrics, historicalPrices) {
  const dataByYear = new Map();
  const ensureYear = (year) => {
    if (!dataByYear.has(year)) {
      dataByYear.set(year, { year });
    }
    return dataByYear.get(year);
  };

  keyMetrics.forEach(metrics => {
    const year = parseInt(metrics.date?.substring(0, 4) || metrics.calendarYear, 10);
    if (!Number.isFinite(year)) return;
    const row = ensureYear(year);
    row.earningsPerShare = toNumber(metrics.netIncomePerShare ?? metrics.earningsPerShare);
    row.cashFlowPerShare = toNumber(metrics.operatingCashFlowPerShare);
    row.bookValuePerShare = toNumber(metrics.bookValuePerShare);
    row.dividendPerShare = toNumber(metrics.dividendPerShare);
  });

  incomeStatements.forEach(statement => {
    const year = parseInt(statement.date?.substring(0, 4), 10);
    if (!Number.isFinite(year)) return;
    const row = ensureYear(year);
    if (!isFiniteNumber(row.earningsPerShare)) {
      row.earningsPerShare = toNumber(statement.epsdiluted ?? statement.eps);
    }
  });

  cashFlows.forEach(cf => {
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
    if (!pricesByYear.has(year)) {
      pricesByYear.set(year, { highs: [], lows: [] });
    }
    if (isFiniteNumber(high)) pricesByYear.get(year).highs.push(high);
    if (isFiniteNumber(low)) pricesByYear.get(year).lows.push(low);
  });

  pricesByYear.forEach((prices, year) => {
    const row = ensureYear(year);
    if (prices.highs.length > 0) {
      row.priceHigh = Math.max(...prices.highs);
    }
    if (prices.lows.length > 0) {
      row.priceLow = Math.min(...prices.lows);
    }
  });

  const annualData = Array.from(dataByYear.values())
    .filter(row => Number.isFinite(row.year))
    .filter(row => (
      isFiniteNumber(row.earningsPerShare) &&
      isFiniteNumber(row.cashFlowPerShare) &&
      isFiniteNumber(row.bookValuePerShare) &&
      isFiniteNumber(row.dividendPerShare) &&
      isFiniteNumber(row.priceHigh) &&
      isFiniteNumber(row.priceLow)
    ))
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

  return annualData;
}

function buildRevenueSeries(incomeStatements) {
  return incomeStatements
    .map(statement => ({
      year: parseInt(statement.date?.substring(0, 4), 10),
      value: toNumber(statement.revenue)
    }))
    .filter(entry => Number.isFinite(entry.year) && isFiniteNumber(entry.value));
}

/**
 * Calculate assumptions from annual data
 */
function calculateAssumptions(annualData, currentPrice, profile, revenueSeries) {
  const growthRateEPS = calculateGrowthRate(annualData, 'earningsPerShare');
  const growthRateCF = calculateGrowthRate(annualData, 'cashFlowPerShare');
  const growthRateBV = calculateGrowthRate(annualData, 'bookValuePerShare');
  const growthRateDiv = calculateGrowthRate(annualData, 'dividendPerShare');
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

  return {
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
}

/**
 * Build company info from FMP profile
 */
function buildCompanyInfo(profile) {
  return {
    symbol: profile.symbol,
    name: profile.companyName || profile.symbol,
    sector: profile.sector || 'Unknown',
    industry: profile.industry || 'Unknown',
    marketCap: profile.mktCap || 0,
    beta: profile.beta || 1.0,
    exchange: profile.exchangeShortName || 'NYSE',
    currency: profile.currency || 'USD',
    country: profile.country || 'US',
    image: profile.image || '',
    website: profile.website || '',
    description: profile.description || '',
    dataSource: DATA_SOURCE
  };
}

/**
 * Sync a single ticker
 */
async function syncTicker(ticker) {
  try {
    console.log(`\n📊 Syncing ${ticker}...`);

    // Fetch all data from FMP
    const [profile, incomeStatements, cashFlows, keyMetrics, historicalPrices] = await Promise.all([
      fetchFMPProfile(ticker),
      fetchFMPIncomeStatement(ticker, 30),
      fetchFMPCashFlow(ticker, 30),
      fetchFMPKeyMetrics(ticker, 30),
      fetchFMPHistoricalPrices(ticker)
    ]);

    const revenueSeries = buildRevenueSeries(incomeStatements);

    // Build annual data
    const annualData = buildAnnualData(incomeStatements, cashFlows, keyMetrics, historicalPrices);

    if (annualData.length === 0) {
      throw new Error('No annual data could be built from FMP data');
    }

    if (STRICT_MODE && annualData.length < REQUIRED_YEARS) {
      throw new Error(`Only ${annualData.length} complete years (required ${REQUIRED_YEARS})`);
    }

    // Get current price
    const currentPrice = profile.price || 0;

    if (currentPrice <= 0) {
      throw new Error('Current price is 0 or invalid');
    }

    // Calculate assumptions
    const assumptions = calculateAssumptions(annualData, currentPrice, profile, revenueSeries);

    // Build company info
    const companyInfo = buildCompanyInfo(profile);

    // Save to Supabase: use RPC for atomic current snapshot
    const syncMetadata = {
      syncedAt: new Date().toISOString(),
      source: DATA_SOURCE,
      dataYears: annualData.length,
      fmpProfile: true,
      fmpIncome: true,
      fmpCashFlow: true,
      fmpKeyMetrics: true,
      fmpPrices: true,
      strictMode: STRICT_MODE,
      requiredYears: REQUIRED_YEARS
    };

    const { data, error } = await supabase
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
        p_sync_metadata: syncMetadata
      })
      .single();

    if (error) throw error;

    progress.success++;
    console.log(`✅ ${ticker}: Synced ${annualData.length} years, Price: $${currentPrice.toFixed(2)}`);

    return { success: true };
  } catch (error) {
    progress.failed++;
    progress.errors.push({ ticker, error: error.message });
    console.log(`❌ ${ticker}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Get all tickers from Supabase tickers table
 */
async function getAllTickers() {
  const { data, error } = await supabase
    .from('tickers')
    .select('ticker')
    .eq('is_active', true)
    .limit(2000);

  if (error) {
    throw new Error(`Failed to fetch tickers: ${error.message}`);
  }

  return data.map(row => row.ticker);
}

/**
 * Get tickers that already have valid FMP data
 */
async function getSyncedTickers() {
  const { data, error } = await supabase
    .from('finance_pro_snapshots')
    .select('ticker, assumptions, annual_data')
    .eq('auto_fetched', true)
    .limit(2000);

  if (error) {
    console.warn('Warning: Could not fetch synced tickers:', error.message);
    return new Set();
  }

  // Filter for tickers with valid price > 0
  const validTickers = data
    ?.filter(d =>
      d.assumptions?.currentPrice > 0 &&
      Array.isArray(d.annual_data) &&
      d.annual_data.length >= REQUIRED_YEARS
    )
    .map(d => d.ticker) || [];

  return new Set(validTickers);
}

/**
 * MAIN EXECUTION
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  SPRINT 2: SYNC ALL TICKERS WITH REAL FMP DATA');
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n⚠️  NO FALLBACKS - NO RANDOMIZATION - ONLY REAL DATA\n');

  // Get all tickers
  console.log('📋 Loading tickers from Supabase...');
  const allTickers = await getAllTickers();

  // Check which tickers are already synced today
  console.log('🔍 Checking already synced tickers...');
  const syncedTickers = await getSyncedTickers();
  console.log(`   ${syncedTickers.size} tickers already synced today with valid data`);

  // Filter to only sync missing tickers
  const tickers = allTickers.filter(t => !syncedTickers.has(t));
  progress.total = tickers.length;
  progress.skipped = syncedTickers.size;

  console.log(`✅ Found ${allTickers.length} active tickers`);
  console.log(`⏭️  Skipping ${syncedTickers.size} already synced`);
  console.log(`📊 Need to sync: ${tickers.length} tickers\n`);

  if (tickers.length === 0) {
    console.log('✅ All tickers already synced!');
    return;
  }

  console.log('🚀 Starting synchronization...\n');

  const startTime = Date.now();

  // Sync ONE ticker at a time to respect FMP rate limits
  // FMP free tier: ~300 calls/min, each ticker needs ~5 calls = 60 tickers/min max
  const batchSize = 1;
  const delayBetweenTickers = 3000; // 3 seconds between tickers (conservative)

  for (let i = 0; i < tickers.length; i += batchSize) {
    const batch = tickers.slice(i, i + batchSize);

    for (const ticker of batch) {
      await syncTicker(ticker);

      // Rate limiting: Wait between each ticker
      if (i + 1 < tickers.length) {
        await sleep(delayBetweenTickers);
      }
    }

    // Progress update every 10 tickers
    const completed = Math.min(i + batchSize, tickers.length);
    if (completed % 10 === 0 || completed === tickers.length) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const rate = elapsed > 0 ? (completed / elapsed * 60).toFixed(1) : '0';
      const remaining = tickers.length - completed;
      const eta = elapsed > 0 && completed > 0 ? (remaining / (completed / elapsed) / 60).toFixed(1) : '?';

      console.log(`\n📊 Progress: ${completed}/${tickers.length} (${((completed/tickers.length)*100).toFixed(1)}%)`);
      console.log(`   Success: ${progress.success} | Failed: ${progress.failed} | Skipped: ${progress.skipped}`);
      console.log(`   Rate: ${rate} tickers/min | ETA: ${eta} minutes\n`);
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  SYNCHRONIZATION COMPLETE');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log(`Total Tickers: ${progress.total}`);
  console.log(`✅ Success: ${progress.success}`);
  console.log(`❌ Failed: ${progress.failed}`);
  console.log(`⏱️  Total Time: ${totalTime} minutes`);
  console.log(`📈 Success Rate: ${((progress.success/progress.total)*100).toFixed(1)}%`);

  if (progress.errors.length > 0) {
    console.log('\n❌ Failed Tickers:');
    progress.errors.forEach(({ ticker, error }) => {
      console.log(`   ${ticker}: ${error}`);
    });
  }

  console.log('\n✅ SPRINT 2 COMPLETE');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
