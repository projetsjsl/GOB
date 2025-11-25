/**
 * Bulk Ticker Loader for Finance Pro 3p1
 * 
 * This script:
 * 1. Fetches all tickers from Supabase (team_tickers + watchlist)
 * 2. Loads data for each ticker via FMP API
 * 3. Calculates auto-fill assumptions (growth rates, target ratios)
 * 4. Saves each ticker as a snapshot in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Supabase config
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper: Calculate CAGR
function calculateCAGR(startValue, endValue, years) {
    if (startValue <= 0 || endValue <= 0 || years <= 0) return 0;
    return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}

// Helper: Calculate Average
function calculateAverage(data) {
    if (data.length === 0) return 0;
    const sum = data.reduce((a, b) => a + b, 0);
    return sum / data.length;
}

// Fetch company data from API
async function fetchCompanyData(symbol) {
    try {
        const response = await fetch(`https://gobapps.com/api/fmp-company-data?symbol=${symbol}`);
        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`❌ Failed to fetch data for ${symbol}:`, error.message);
        return null;
    }
}

// Calculate auto-fill assumptions
function calculateAssumptions(data, currentPrice) {
    const validHistory = data.filter(d => d.priceHigh > 0 && d.priceLow > 0);

    // Find last year with valid EPS
    const lastValidData = [...data].reverse().find(d => d.earningsPerShare > 0) || data[data.length - 1];
    const lastData = data[data.length - 1];
    const firstData = data[0];
    const yearsDiff = lastValidData.year - firstData.year;

    // Calculate historical CAGRs
    const histGrowthEPS = calculateCAGR(firstData.earningsPerShare, lastValidData.earningsPerShare, yearsDiff);
    const histGrowthSales = calculateCAGR(firstData.cashFlowPerShare, lastValidData.cashFlowPerShare, yearsDiff);
    const histGrowthBV = calculateCAGR(firstData.bookValuePerShare, lastValidData.bookValuePerShare, yearsDiff);
    const histGrowthDiv = calculateCAGR(firstData.dividendPerShare, lastValidData.dividendPerShare, yearsDiff);

    // Calculate Average Ratios (filter out invalid values)
    const peRatios = validHistory
        .map(d => (d.priceHigh / d.earningsPerShare + d.priceLow / d.earningsPerShare) / 2)
        .filter(v => isFinite(v) && v > 0);
    const avgPE = peRatios.length > 0 ? calculateAverage(peRatios) : 15;

    const pcfRatios = validHistory
        .map(d => (d.priceHigh / d.cashFlowPerShare + d.priceLow / d.cashFlowPerShare) / 2)
        .filter(v => isFinite(v) && v > 0);
    const avgPCF = pcfRatios.length > 0 ? calculateAverage(pcfRatios) : 10;

    const yieldValues = validHistory
        .map(d => (d.dividendPerShare / d.priceHigh) * 100)
        .filter(v => isFinite(v) && v >= 0);
    const avgYield = yieldValues.length > 0 ? calculateAverage(yieldValues) : 2.0;

    return {
        currentPrice: currentPrice,
        currentDividend: lastData.dividendPerShare,
        baseYear: lastValidData.year,
        growthRateEPS: Math.min(Math.max(histGrowthEPS, 0), 20),
        growthRateSales: Math.min(Math.max(histGrowthSales, 0), 20),
        growthRateCF: Math.min(Math.max(histGrowthSales, 0), 20),
        growthRateBV: Math.min(Math.max(histGrowthBV, 0), 20),
        growthRateDiv: Math.min(Math.max(histGrowthDiv, 0), 20),
        targetPE: parseFloat(avgPE.toFixed(1)),
        targetPCF: parseFloat(avgPCF.toFixed(1)),
        targetYield: parseFloat(avgYield.toFixed(2)),
        requiredReturn: 10,
        dividendPayoutRatio: 50,
        targetPBV: 3
    };
}

// Save snapshot to Supabase
async function saveSnapshot(ticker, data, assumptions, info) {
    try {
        const { error } = await supabase
            .from('finance_snapshots')
            .insert({
                ticker: ticker,
                data: data,
                assumptions: assumptions,
                info: info,
                notes: `Auto-generated snapshot from bulk loader - ${new Date().toLocaleString()}`,
                is_current: true,
                auto_fetched: true
            });

        if (error) {
            console.error(`❌ Failed to save snapshot for ${ticker}:`, error.message);
            return false;
        }

        console.log(`✅ Saved snapshot for ${ticker}`);
        return true;
    } catch (error) {
        console.error(`❌ Error saving ${ticker}:`, error.message);
        return false;
    }
}

// Main function
async function bulkLoadTickers() {
    console.log('🚀 Starting bulk ticker loader...\n');

    // 1. Fetch team tickers
    console.log('📊 Fetching team tickers...');
    const { data: teamTickers, error: teamError } = await supabase
        .from('team_tickers')
        .select('ticker');

    if (teamError) {
        console.error('❌ Failed to fetch team tickers:', teamError.message);
        return;
    }

    // 2. Fetch watchlist tickers
    console.log('📊 Fetching watchlist tickers...');
    const { data: watchlistTickers, error: watchlistError } = await supabase
        .from('ticker_watchlist')
        .select('ticker');

    if (watchlistError) {
        console.error('❌ Failed to fetch watchlist tickers:', watchlistError.message);
        return;
    }

    // 3. Combine and deduplicate
    const allTickers = [
        ...new Set([
            ...(teamTickers || []).map(t => t.ticker),
            ...(watchlistTickers || []).map(t => t.ticker)
        ])
    ].filter(Boolean);

    console.log(`\n📋 Found ${allTickers.length} unique tickers to process\n`);

    // 4. Process each ticker
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < allTickers.length; i++) {
        const ticker = allTickers[i];
        console.log(`\n[${i + 1}/${allTickers.length}] Processing ${ticker}...`);

        // Fetch data
        const result = await fetchCompanyData(ticker);
        if (!result || !result.data || result.data.length === 0) {
            console.log(`⚠️ No data available for ${ticker}`);
            failCount++;
            continue;
        }

        // Calculate assumptions
        const assumptions = calculateAssumptions(result.data, result.currentPrice);

        // Save snapshot
        const saved = await saveSnapshot(ticker, result.data, assumptions, result.info);
        if (saved) {
            successCount++;
        } else {
            failCount++;
        }

        // Rate limiting: wait 500ms between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n\n📊 BULK LOAD COMPLETE');
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📈 Total: ${allTickers.length}`);
}

// Run
bulkLoadTickers().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
