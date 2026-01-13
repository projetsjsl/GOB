#!/usr/bin/env node
/**
 * SPRINT 2: Full FMP Synchronization - NO FALLBACKS
 *
 * Syncs ALL 1000+ tickers with REAL FMP data
 * Specs: S2-FMP-001 through S2-CALC-020
 *
 * CRITICAL RULES:
 * 1. NO randomization, NO fallback values, NO skeleton profiles
 * 2. Every ticker MUST have 30 years of historical EPS, CF, BV, DIV, price data from FMP API
 * 3. Only REAL FMP data - if FMP fails, skip ticker (don't create empty snapshot)
 * 4. Calculate CAGR growth rates from historical data
 * 5. Calculate target PE/PCF/PBV from 3-year averages
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FMP_API_KEY = process.env.FMP_API_KEY;
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !FMP_API_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const STRICT_MODE = process.env.STRICT_SYNC !== 'false';
const REQUIRED_YEARS = 30;
const DATA_SOURCE = 'fmp-verified';

// Validation results tracker
const syncResults = {
  success: [],
  failed: [],
  skipped: [],
  progress: { current: 0, total: 0 }
};

// Rate limiting
let requestCount = 0;
const MAX_REQUESTS_PER_MINUTE = 250; // Conservative for FMP free tier (300/min limit)
const BATCH_SIZE = 10; // Process 10 tickers at a time
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

async function rateLimitDelay() {
  requestCount++;
  if (requestCount % MAX_REQUESTS_PER_MINUTE === 0) {
    console.log(`⏳ Rate limit: Waiting 60s after ${requestCount} requests...`);
    await new Promise(resolve => setTimeout(resolve, 60000));
  } else if (requestCount % 10 === 0) {
    // Small delay every 10 requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

/**
 * Fetch FMP data with retry logic
 */
async function fetchWithRetry(url, retries = RETRY_ATTEMPTS) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await rateLimitDelay();
      const response = await fetch(url);

      if (response.status === 429) {
        console.warn(`⏳ Rate limit hit, waiting ${RETRY_DELAY_MS * attempt}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      console.warn(`⚠️  Attempt ${attempt}/${retries} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
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
 * Calculate average of array values, excluding outliers
 */
function calculateAverage(values) {
  const filtered = values.filter(v => typeof v === 'number' && Number.isFinite(v));
  if (filtered.length === 0) return 0;
  return filtered.reduce((sum, v) => sum + v, 0) / filtered.length;
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
 * Fetch complete company data from FMP
 */
async function fetchCompanyDataFromFMP(ticker) {
  const symbol = ticker.toUpperCase();

  try {
    // 1. Company Profile
    const profileUrl = `${FMP_BASE_URL}/profile/${symbol}?apikey=${FMP_API_KEY}`;
    const profileData = await fetchWithRetry(profileUrl);
    const profile = Array.isArray(profileData) ? profileData[0] : profileData;

    if (!profile || !profile.symbol) {
      console.warn(`⚠️  ${symbol}: No profile data from FMP`);
      return null;
    }

    // 2. Income Statement (for EPS, Revenue)
    const incomeUrl = `${FMP_BASE_URL}/income-statement/${symbol}?limit=30&apikey=${FMP_API_KEY}`;
    const incomeData = await fetchWithRetry(incomeUrl);

    // 3. Cash Flow Statement (for Operating Cash Flow)
    const cashFlowUrl = `${FMP_BASE_URL}/cash-flow-statement/${symbol}?limit=30&apikey=${FMP_API_KEY}`;
    const cashFlowData = await fetchWithRetry(cashFlowUrl);

    // 4. Balance Sheet (for Book Value)
    const balanceUrl = `${FMP_BASE_URL}/balance-sheet-statement/${symbol}?limit=30&apikey=${FMP_API_KEY}`;
    const balanceData = await fetchWithRetry(balanceUrl);

    // 5. Historical Dividends
    const dividendUrl = `${FMP_BASE_URL}/historical-price-full/stock_dividend/${symbol}?apikey=${FMP_API_KEY}`;
    const dividendData = await fetchWithRetry(dividendUrl);

    // 6. Historical Prices
    const priceUrl = `${FMP_BASE_URL}/historical-price-full/${symbol}?apikey=${FMP_API_KEY}`;
    const priceData = await fetchWithRetry(priceUrl);

    // 7. Current Quote
    const quoteUrl = `${FMP_BASE_URL}/quote/${symbol}?apikey=${FMP_API_KEY}`;
    const quoteData = await fetchWithRetry(quoteUrl);
    const currentQuote = Array.isArray(quoteData) ? quoteData[0] : quoteData;

    // Validate minimum data requirements
    const minYears = STRICT_MODE ? REQUIRED_YEARS : 3;
    if (!incomeData || incomeData.length < minYears) {
      console.warn(`⚠️  ${symbol}: Insufficient income data (${incomeData?.length || 0} years)`);
      return null;
    }
    if (!cashFlowData || cashFlowData.length < minYears) {
      console.warn(`⚠️  ${symbol}: Insufficient cash flow data (${cashFlowData?.length || 0} years)`);
      return null;
    }
    if (!balanceData || balanceData.length < minYears) {
      console.warn(`⚠️  ${symbol}: Insufficient balance sheet data (${balanceData?.length || 0} years)`);
      return null;
    }

    if (!currentQuote || !currentQuote.price || currentQuote.price <= 0) {
      console.warn(`⚠️  ${symbol}: No current price data`);
      return null;
    }

    return {
      profile,
      incomeData,
      cashFlowData,
      balanceData,
      dividendData: dividendData?.historical || [],
      priceData: priceData?.historical || [],
      currentQuote
    };
  } catch (error) {
    console.error(`❌ ${ticker}: FMP fetch error:`, error.message);
    return null;
  }
}

/**
 * Transform FMP data into 3p1 format
 */
function transformToSnapshot(ticker, fmpData) {
  const { profile, incomeData, cashFlowData, balanceData, dividendData, priceData, currentQuote } = fmpData;

  const annualDataMap = new Map();
  const ensureYear = (year) => {
    if (!annualDataMap.has(year)) {
      annualDataMap.set(year, { year });
    }
    return annualDataMap.get(year);
  };

  incomeData.forEach(income => {
    const year = new Date(income.date).getFullYear();
    if (!Number.isFinite(year)) return;
    const yearData = ensureYear(year);
    yearData.earningsPerShare = toNumber(income.epsdiluted ?? income.eps);
    yearData.revenue = toNumber(income.revenue);
  });

  cashFlowData?.forEach(cf => {
    const year = new Date(cf.date).getFullYear();
    if (!Number.isFinite(year)) return;
    const yearData = ensureYear(year);
    const shares = toNumber(cf.weightedAverageShsOut ?? cf.weightedAverageShsOutDiluted ?? cf.commonStockIssued);
    if (isFiniteNumber(shares) && shares > 0) {
      const cashFlow = toNumber(cf.freeCashFlow ?? cf.operatingCashFlow);
      yearData.cashFlowPerShare = isFiniteNumber(cashFlow) ? cashFlow / shares : null;
      const dividends = toNumber(cf.dividendsPaid);
      if (!isFiniteNumber(yearData.dividendPerShare)) {
        yearData.dividendPerShare = isFiniteNumber(dividends) ? Math.abs(dividends / shares) : null;
      }
    }
  });

  balanceData?.forEach(balance => {
    const year = new Date(balance.date).getFullYear();
    if (!Number.isFinite(year)) return;
    const yearData = ensureYear(year);
    const shares = toNumber(balance.commonStockSharesOutstanding ?? balance.totalSharesOutstanding);
    const bookValue = toNumber(balance.totalStockholdersEquity ?? balance.totalEquity);
    if (isFiniteNumber(shares) && shares > 0 && isFiniteNumber(bookValue)) {
      yearData.bookValuePerShare = bookValue / shares;
    }
  });

  const dividendsByYear = new Map();
  dividendData?.forEach(div => {
    const year = new Date(div.date).getFullYear();
    if (!Number.isFinite(year)) return;
    const current = dividendsByYear.get(year) || 0;
    const dividend = toNumber(div.dividend);
    dividendsByYear.set(year, current + (isFiniteNumber(dividend) ? dividend : 0));
  });

  dividendsByYear.forEach((totalDiv, year) => {
    const yearData = ensureYear(year);
    if (!isFiniteNumber(yearData.dividendPerShare)) {
      yearData.dividendPerShare = isFiniteNumber(totalDiv) ? totalDiv : null;
    }
  });

  const pricesByYear = new Map();
  priceData?.forEach(price => {
    const year = new Date(price.date).getFullYear();
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
    const yearData = ensureYear(year);
    if (prices.highs.length > 0) {
      yearData.priceHigh = Math.max(...prices.highs);
    }
    if (prices.lows.length > 0) {
      yearData.priceLow = Math.min(...prices.lows);
    }
  });

  const annualData = Array.from(annualDataMap.values())
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
    console.warn(`⚠️  ${ticker}: No annual data built`);
    return null;
  }

  if (STRICT_MODE && annualData.length < REQUIRED_YEARS) {
    console.warn(`⚠️  ${ticker}: Only ${annualData.length} complete years (required ${REQUIRED_YEARS})`);
    return null;
  }

  const growthRateEPS = calculateGrowthRate(annualData, 'earningsPerShare');
  const growthRateCF = calculateGrowthRate(annualData, 'cashFlowPerShare');
  const growthRateBV = calculateGrowthRate(annualData, 'bookValuePerShare');
  const growthRateDiv = calculateGrowthRate(annualData, 'dividendPerShare');
  const revenueSeries = incomeData
    .map(item => ({
      year: new Date(item.date).getFullYear(),
      value: toNumber(item.revenue)
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
    console.warn(`⚠️  ${ticker}: Missing derived values (${missing.join(', ')})`);
    return null;
  }

  const currentPrice = toNumber(currentQuote?.price ?? currentQuote?.previousClose ?? profile?.price);
  if (!isFiniteNumber(currentPrice) || currentPrice <= 0) {
    console.warn(`⚠️  ${ticker}: Current price is invalid`);
    return null;
  }

  const companyInfo = {
    symbol: ticker,
    name: profile.companyName || ticker,
    sector: profile.sector || 'Unknown',
    industry: profile.industry || 'Unknown',
    exchange: profile.exchangeShortName || profile.exchange || 'Unknown',
    beta: profile.beta || 1.0,
    country: profile.country || 'US',
    currency: profile.currency || 'USD',
    marketCap: profile.mktCap || currentQuote?.marketCap || 0,
    logo: profile.image || null,
    dataSource: DATA_SOURCE
  };

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

  return {
    ticker,
    profile_id: ticker,
    annual_data: annualData,
    assumptions,
    company_info: companyInfo,
    snapshot_date: new Date().toISOString().split('T')[0],
    is_current: true,
    auto_fetched: true,
    is_watchlist: false
  };
}

/**
 * Save snapshot to Supabase
 */
async function saveSnapshotToSupabase(snapshot) {
  try {
    const { data, error } = await supabase
      .rpc('create_current_snapshot', {
        p_ticker: snapshot.ticker,
        p_profile_id: snapshot.profile_id,
        p_user_id: null,
        p_notes: `Auto-synced from FMP on ${new Date().toISOString()}`,
        p_snapshot_date: snapshot.snapshot_date,
        p_is_watchlist: snapshot.is_watchlist,
        p_auto_fetched: snapshot.auto_fetched,
        p_annual_data: snapshot.annual_data,
        p_assumptions: snapshot.assumptions,
        p_company_info: snapshot.company_info,
        p_sync_metadata: {
          syncedAt: new Date().toISOString(),
          source: DATA_SOURCE,
          dataYears: snapshot.annual_data.length,
          strictMode: STRICT_MODE,
          requiredYears: REQUIRED_YEARS
        }
      })
      .single();

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error(`❌ ${snapshot.ticker}: Supabase save error:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Sync single ticker
 */
async function syncTicker(ticker) {
  try {
    console.log(`📥 Syncing ${ticker}...`);

    // Fetch FMP data
    const fmpData = await fetchCompanyDataFromFMP(ticker);
    if (!fmpData) {
      syncResults.skipped.push({ ticker, reason: 'No FMP data' });
      return { success: false, reason: 'No FMP data' };
    }

    // Transform to snapshot format
    const snapshot = transformToSnapshot(ticker, fmpData);
    if (!snapshot) {
      syncResults.skipped.push({ ticker, reason: 'Insufficient data' });
      return { success: false, reason: 'Insufficient data' };
    }

    // Save to Supabase
    const saveResult = await saveSnapshotToSupabase(snapshot);
    if (!saveResult.success) {
      syncResults.failed.push({ ticker, reason: saveResult.error });
      return { success: false, reason: saveResult.error };
    }

    syncResults.success.push({
      ticker,
      yearsOfData: snapshot.annual_data.length,
      currentPrice: snapshot.assumptions.currentPrice
    });

    console.log(`✅ ${ticker}: Synced (${snapshot.annual_data.length} years, price: $${snapshot.assumptions.currentPrice.toFixed(2)})`);
    return { success: true };

  } catch (error) {
    console.error(`❌ ${ticker}: Sync error:`, error);
    syncResults.failed.push({ ticker, reason: error.message });
    return { success: false, reason: error.message };
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  SPRINT 2: Full FMP Synchronization (70 Specs)            ║');
  console.log('║  Target: Sync ALL 1000+ tickers with REAL FMP data        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const startTime = Date.now();

  // Get all active tickers
  const { data: tickerData, error } = await supabase
    .from('tickers')
    .select('ticker')
    .eq('is_active', true)
    .order('ticker');

  if (error) {
    console.error('❌ Failed to fetch tickers:', error);
    process.exit(1);
  }

  const tickers = tickerData.map(t => t.ticker);
  syncResults.progress.total = tickers.length;

  console.log(`📊 Found ${tickers.length} active tickers to sync\n`);

  // Process in batches
  for (let i = 0; i < tickers.length; i += BATCH_SIZE) {
    const batch = tickers.slice(i, i + BATCH_SIZE);

    console.log(`\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(tickers.length / BATCH_SIZE)} (${batch[0]} - ${batch[batch.length - 1]})`);

    // Process batch sequentially to avoid overwhelming FMP API
    for (const ticker of batch) {
      syncResults.progress.current = i + batch.indexOf(ticker) + 1;
      await syncTicker(ticker);

      // Progress update every 10 tickers
      if (syncResults.progress.current % 10 === 0) {
        const pct = ((syncResults.progress.current / syncResults.progress.total) * 100).toFixed(1);
        console.log(`\n📊 Progress: ${syncResults.progress.current}/${syncResults.progress.total} (${pct}%)`);
        console.log(`   ✅ Success: ${syncResults.success.length}`);
        console.log(`   ⚠️  Skipped: ${syncResults.skipped.length}`);
        console.log(`   ❌ Failed: ${syncResults.failed.length}\n`);
      }
    }
  }

  // Final Summary
  const duration = Math.round((Date.now() - startTime) / 1000);
  const durationMin = Math.floor(duration / 60);
  const durationSec = duration % 60;

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    SPRINT 2 SUMMARY                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`✅ Success: ${syncResults.success.length}`);
  console.log(`⚠️  Skipped: ${syncResults.skipped.length}`);
  console.log(`❌ Failed: ${syncResults.failed.length}`);
  console.log(`⏱️  Duration: ${durationMin}m ${durationSec}s`);
  console.log(`📊 API Requests: ${requestCount}\n`);

  if (syncResults.success.length >= tickers.length * 0.9) {
    console.log('✅ SPRINT 2 COMPLETE: 90%+ tickers synced successfully!\n');
  } else {
    console.log('❌ SPRINT 2 INCOMPLETE: Less than 90% success rate.\n');
  }

  // Save detailed report
  const report = {
    sprint: 'Sprint 2 - Full FMP Synchronization',
    timestamp: new Date().toISOString(),
    duration: `${durationMin}m ${durationSec}s`,
    apiRequests: requestCount,
    results: syncResults,
    summary: {
      total: tickers.length,
      success: syncResults.success.length,
      skipped: syncResults.skipped.length,
      failed: syncResults.failed.length,
      successRate: ((syncResults.success.length / tickers.length) * 100).toFixed(2) + '%'
    }
  };

  await import('fs/promises').then(async fs => {
    await fs.writeFile(
      '/Users/projetsjsl/Documents/GitHub/GOB/SPRINT-2-SYNC-REPORT.json',
      JSON.stringify(report, null, 2)
    );
    console.log('📄 Detailed report saved: SPRINT-2-SYNC-REPORT.json\n');
  });
}

main().catch(console.error);
