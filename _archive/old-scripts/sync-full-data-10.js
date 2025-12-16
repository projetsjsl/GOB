
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FMP_KEY = process.env.FMP_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !FMP_KEY) {
  console.error('Missing configuration: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or FMP_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const FMP_BASE = 'https://financialmodelingprep.com/api/v3';

// Helper functions (from calculations.ts)
const calculateAverage = (data) => {
  if (data.length === 0) return 0;
  const sum = data.reduce((a, b) => a + b, 0);
  return sum / data.length;
};

const calculateCAGR = (startValue, endValue, years) => {
  if (startValue <= 0 || endValue <= 0 || years <= 0) return 0;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
};

const autoFillAssumptionsFromFMPData = (data, currentPrice, existingAssumptions = {}) => {
  const validHistory = data.filter(d => d.priceHigh > 0 && d.priceLow > 0);
  
  const lastValidData = [...data].reverse().find(d => d.earningsPerShare > 0) || data[data.length - 1];
  const lastData = data[data.length - 1];
  const firstData = data[0];
  const yearsDiff = Math.max(1, lastValidData.year - firstData.year);
  
  const histGrowthEPS = calculateCAGR(firstData.earningsPerShare, lastValidData.earningsPerShare, yearsDiff);
  const histGrowthSales = calculateCAGR(firstData.cashFlowPerShare, lastValidData.cashFlowPerShare, yearsDiff);
  const histGrowthBV = calculateCAGR(firstData.bookValuePerShare, lastValidData.bookValuePerShare, yearsDiff);
  const histGrowthDiv = calculateCAGR(firstData.dividendPerShare, lastValidData.dividendPerShare, yearsDiff);
  
  const peRatios = validHistory.map(d => {
      if (d.earningsPerShare <= 0) return null;
      return (d.priceHigh / d.earningsPerShare + d.priceLow / d.earningsPerShare) / 2;
    }).filter(v => v !== null && isFinite(v) && v > 0);
  const avgPE = peRatios.length > 0 ? calculateAverage(peRatios) : 15;
  
  const pcfRatios = validHistory.map(d => {
      if (d.cashFlowPerShare <= 0) return null;
      return (d.priceHigh / d.cashFlowPerShare + d.priceLow / d.cashFlowPerShare) / 2;
    }).filter(v => v !== null && isFinite(v) && v > 0);
  const avgPCF = pcfRatios.length > 0 ? calculateAverage(pcfRatios) : 10;
  
  const pbvRatios = validHistory.map(d => {
      if (d.bookValuePerShare <= 0) return null;
      return (d.priceHigh / d.bookValuePerShare + d.priceLow / d.bookValuePerShare) / 2;
    }).filter(v => v !== null && isFinite(v) && v > 0);
  const avgPBV = pbvRatios.length > 0 ? calculateAverage(pbvRatios) : 6;
  
  const yieldValues = validHistory.map(d => {
      if (d.priceHigh <= 0) return null;
      return (d.dividendPerShare / d.priceHigh) * 100;
    }).filter(v => v !== null && isFinite(v) && v >= 0);
  const avgYield = yieldValues.length > 0 ? calculateAverage(yieldValues) : 2.0;
  
  return {
    currentPrice,
    currentDividend: lastData.dividendPerShare || existingAssumptions.currentDividend || 0,
    baseYear: lastValidData.year,
    growthRateEPS: Math.min(Math.max(histGrowthEPS, 0), 20),
    growthRateSales: Math.min(Math.max(histGrowthSales, 0), 20),
    growthRateCF: Math.min(Math.max(histGrowthSales, 0), 20),
    growthRateBV: Math.min(Math.max(histGrowthBV, 0), 20),
    growthRateDiv: Math.min(Math.max(histGrowthDiv, 0), 20),
    targetPE: parseFloat(Math.max(1, Math.min(avgPE, 100)).toFixed(1)),
    targetPCF: parseFloat(Math.max(1, Math.min(avgPCF, 100)).toFixed(1)),
    targetPBV: parseFloat(Math.max(0.5, Math.min(avgPBV, 50)).toFixed(1)),
    targetYield: parseFloat(Math.max(0, Math.min(avgYield, 20)).toFixed(2)),
    requiredReturn: 10.0,
    dividendPayoutRatio: 35.0
  };
};

async function syncTicker(tickerObj) {
  const symbol = tickerObj.ticker.toUpperCase();
  console.log(`🔄 Syncing ${symbol}...`);

  try {
    // 1. Fetch Profile
    const profileRes = await fetch(`${FMP_BASE}/profile/${symbol}?apikey=${FMP_KEY}`);
    const profileData = await profileRes.json();
    if (!profileData || !profileData[0]) {
       console.error(`❌ FMP Profile not found for ${symbol}`);
       return false;
    }
    const profile = profileData[0];

    // 2. Fetch Metrics
    const metricsRes = await fetch(`${FMP_BASE}/key-metrics/${symbol}?period=annual&limit=30&apikey=${FMP_KEY}`);
    const metricsData = await metricsRes.json();
    
    // 3. Fetch Dividends
    const dividendRes = await fetch(`${FMP_BASE}/historical-price-full/stock_dividend/${symbol}?apikey=${FMP_KEY}`);
    const dividendData = await dividendRes.json();
    const dividendsByFiscalYear = {};
    if (dividendData.historical) {
        dividendData.historical.forEach(div => {
            const date = new Date(div.date);
            const year = date.getMonth() >= 8 ? date.getFullYear() + 1 : date.getFullYear(); // Approx fiscal logic
            dividendsByFiscalYear[year] = (dividendsByFiscalYear[year] || 0) + (div.dividend || div.adjDividend || 0);
        });
    }

    // 4. Fetch Prices
    const priceRes = await fetch(`${FMP_BASE}/historical-price-full/${symbol}?serietype=line&timeseries=7300&apikey=${FMP_KEY}`);
    const priceData = await priceRes.json();
    const pricesByYear = {};
    if (priceData.historical) {
        priceData.historical.forEach(day => {
            const year = new Date(day.date).getFullYear();
            if (!pricesByYear[year]) pricesByYear[year] = { high: 0, low: 999999 };
            if (day.close > pricesByYear[year].high) pricesByYear[year].high = day.close;
            if (day.close < pricesByYear[year].low) pricesByYear[year].low = day.close;
        });
    }

    // 5. Transform to AnnualData
    // Filter duplicates first
    const uniqueMetrics = {};
    if (Array.isArray(metricsData)) {
      metricsData.forEach(m => {
        const year = new Date(m.date).getFullYear();
        if(!uniqueMetrics[year]) uniqueMetrics[year] = m;
      });
    }
    const finalMetrics = Object.values(uniqueMetrics);

    const annualData = finalMetrics.map(metric => {
        const year = new Date(metric.date).getFullYear();
        const priceStats = pricesByYear[year] || { high: 0, low: 0 };
        const high = priceStats.high > 0 ? priceStats.high : (metric.revenuePerShare * 20 || 0);
        const low = priceStats.low < 999999 && priceStats.low > 0 ? priceStats.low : (high * 0.5);
        const dps = dividendsByFiscalYear[year] || 0;

        return {
            year: year,
            priceHigh: parseFloat(high.toFixed(2)),
            priceLow: parseFloat(low.toFixed(2)),
            cashFlowPerShare: parseFloat((metric.operatingCashFlowPerShare || 0).toFixed(2)),
            dividendPerShare: parseFloat(dps.toFixed(2)),
            bookValuePerShare: parseFloat((metric.bookValuePerShare || 0).toFixed(2)),
            earningsPerShare: parseFloat((metric.netIncomePerShare || 0).toFixed(2)),
            isEstimate: false
        };
    }).sort((a,b) => a.year - b.year).slice(-15);

    // 6. Assumptions
    const currentPrice = profile.price || 0;
    const assumptions = autoFillAssumptionsFromFMPData(annualData, currentPrice);

    // 7. Company Info
    const beta = profile.beta || (finalMetrics[0] && finalMetrics[0].beta);
    const info = {
        symbol: symbol,
        name: profile.companyName,
        sector: profile.sector,
        securityRank: 'N/A',
        marketCap: profile.mktCap, // kept as number here, formatted in UI or transforming logic
        logo: profile.image,
        country: profile.country,
        exchange: profile.exchangeShortName,
        currency: profile.currency,
        beta: beta ? parseFloat(beta) : null
    };

    // 8. Save Snapshot
    const isWatchlist = tickerObj.source === 'watchlist' || tickerObj.source === 'both';
    
    // Unmark previous current snapshots
    await supabase.from('finance_pro_snapshots')
        .update({ is_current: false })
        .eq('ticker', symbol);

    const { error } = await supabase.from('finance_pro_snapshots').insert([{
        ticker: symbol,
        profile_id: `profile_${symbol}`,
        is_current: true,
        is_watchlist: isWatchlist,
        auto_fetched: true,
        annual_data: annualData,
        assumptions: assumptions,
        company_info: info,
        snapshot_date: new Date().toISOString()
    }]);

    if (error) {
        console.error(`❌ DB Insert Error for ${symbol}:`, error.message);
        return false;
    }
    
    console.log(`✅ Snapshot saved for ${symbol}`);
    return true;

  } catch (err) {
    console.error(`❌ Error syncing ${symbol}:`, err.message);
    return false;
  }
}

async function run() {
    console.log("🚀 Starting Full Sync for 10 tickers...");
    
    // Fetch valid tickers that match our test set
    // '950160.KQ', '9984.T', 'A', 'AA', 'AAPL', 'AAPL.MX', 'AAPL.NE', 'ABBNY', 'ABBV', 'ABBV.BA'
    // Actually, let's just fetch the first 10 active tickers again to be consistent with previous test
    const { data: tickers, error } = await supabase
        .from('tickers')
        .select('ticker, source')
        .eq('is_active', true)
        .order('ticker', { ascending: true })
        .limit(10);

    if (error) {
        console.error("Starting error:", error);
        return;
    }

    console.log(`Found ${tickers.length} tickers.`);

    for (const ticker of tickers) {
        await syncTicker(ticker);
    }
    
    console.log("🏁 Done.");
}

run();
