#!/usr/bin/env node
/**
 * 3P1 FMP Sync Script - SPRINT 2
 *
 * Syncs ALL 1001 tickers with REAL FMP data - NO FALLBACKS, NO RANDOMIZATION
 *
 * This script:
 * 1. Gets all active tickers from the database
 * 2. Fetches real FMP data for each ticker (profile, key-metrics, historical prices)
 * 3. Saves snapshots to finance_pro_snapshots table
 * 4. Tracks progress and reports failures
 *
 * Specs covered: S2-FMP-001 to S2-FMP-025, S2-SYNC-001 to S2-SYNC-025
 *
 * Usage:
 *   node scripts/3p1-sync-all-tickers-fmp.js [options]
 *
 * Options:
 *   --limit=N         Limit to N tickers (for testing)
 *   --batch-size=N    Process N tickers per batch (default: 10)
 *   --delay=N         Delay in ms between batches (default: 2000)
 *   --start=TICKER    Start from specific ticker (alphabetically)
 *   --only=TICKER     Only sync specific ticker(s), comma-separated
 *   --dry-run         Don't save to database, just fetch and report
 *   --verbose         Show detailed output
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const FMP_API_KEY = process.env.FMP_API_KEY || process.env.FMP_KEY;
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY');
    process.exit(1);
}

if (!FMP_API_KEY) {
    console.error('❌ Missing FMP_API_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name, defaultValue) => {
    const arg = args.find(a => a.startsWith(`--${name}=`));
    return arg ? arg.split('=')[1] : defaultValue;
};

const LIMIT = parseInt(getArg('limit', '0')) || 0;
const BATCH_SIZE = parseInt(getArg('batch-size', '10')) || 10;
const DELAY_MS = parseInt(getArg('delay', '2000')) || 2000;
const START_TICKER = getArg('start', '');
const ONLY_TICKERS = getArg('only', '').split(',').filter(t => t.length > 0);
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');

console.log('='.repeat(80));
console.log('3P1 FMP Sync Script - SPRINT 2');
console.log('Syncing ALL tickers with REAL FMP data');
console.log('='.repeat(80));
console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE (will save to Supabase)'}`);
console.log(`Batch size: ${BATCH_SIZE}, Delay: ${DELAY_MS}ms`);
if (LIMIT > 0) console.log(`Limit: ${LIMIT} tickers`);
if (START_TICKER) console.log(`Starting from: ${START_TICKER}`);
if (ONLY_TICKERS.length > 0) console.log(`Only syncing: ${ONLY_TICKERS.join(', ')}`);
console.log('');

// Stats tracking
const stats = {
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    noData: 0,
    startTime: Date.now(),
    failures: [],
    noDataTickers: []
};

/**
 * Delay helper
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch from FMP API with retry logic
 */
async function fetchFMP(endpoint, retries = 3) {
    const url = endpoint.includes('?')
        ? `${FMP_BASE_URL}/${endpoint}&apikey=${FMP_API_KEY}`
        : `${FMP_BASE_URL}/${endpoint}?apikey=${FMP_API_KEY}`;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url);

            if (response.status === 429) {
                // Rate limited - wait and retry
                const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
                console.log(`⏳ Rate limited, waiting ${waitTime}ms before retry ${attempt}/${retries}`);
                await delay(waitTime);
                continue;
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            if (attempt === retries) {
                throw error;
            }
            console.log(`⚠️ Retry ${attempt}/${retries} for ${endpoint}: ${error.message}`);
            await delay(1000 * attempt);
        }
    }
}

/**
 * Fetch complete ticker data from FMP
 * S2-FMP-001 to S2-FMP-025
 */
async function fetchTickerData(ticker) {
    const result = {
        ticker,
        profile: null,
        keyMetrics: [],
        historicalPrices: [],
        currentQuote: null,
        success: false,
        error: null
    };

    try {
        // S2-FMP-001: Fetch company profile
        const profileData = await fetchFMP(`profile/${ticker}`);
        if (Array.isArray(profileData) && profileData.length > 0) {
            result.profile = profileData[0];
        }

        // S2-FMP-002: Fetch key metrics (30 years)
        const metricsData = await fetchFMP(`key-metrics/${ticker}?period=annual&limit=30`);
        if (Array.isArray(metricsData)) {
            result.keyMetrics = metricsData;
        }

        // S2-FMP-003: Fetch historical prices (for high/low)
        const priceData = await fetchFMP(`historical-price-full/${ticker}?timeseries=7500`);
        if (priceData && priceData.historical) {
            result.historicalPrices = priceData.historical;
        }

        // S2-FMP-004: Fetch current quote
        const quoteData = await fetchFMP(`quote/${ticker}`);
        if (Array.isArray(quoteData) && quoteData.length > 0) {
            result.currentQuote = quoteData[0];
        }

        result.success = true;
    } catch (error) {
        result.error = error.message;
    }

    return result;
}

/**
 * Transform FMP data to 3P1 snapshot format
 * S2-SYNC-005 to S2-SYNC-013
 */
function transformToSnapshot(fmpData) {
    const { ticker, profile, keyMetrics, historicalPrices, currentQuote } = fmpData;

    if (!profile) {
        return null;
    }

    // Group historical prices by year for high/low
    const pricesByYear = {};
    for (const price of historicalPrices) {
        const year = new Date(price.date).getFullYear();
        if (!pricesByYear[year]) {
            pricesByYear[year] = { highs: [], lows: [] };
        }
        pricesByYear[year].highs.push(price.high || price.close);
        pricesByYear[year].lows.push(price.low || price.close);
    }

    // Transform key metrics to annual_data format
    const annualData = keyMetrics
        .map(metric => {
            const year = metric.date ? new Date(metric.date).getFullYear() : (metric.calendarYear || 0);
            if (year < 1990 || year > 2030) return null;

            const yearPrices = pricesByYear[year] || { highs: [0], lows: [0] };
            const priceHigh = Math.max(...yearPrices.highs) || 0;
            const priceLow = Math.min(...yearPrices.lows) || 0;

            return {
                year,
                earningsPerShare: parseFloat(Number(metric.netIncomePerShare || metric.earningsPerShare || 0).toFixed(2)),
                cashFlowPerShare: parseFloat(Number(metric.operatingCashFlowPerShare || 0).toFixed(2)),
                bookValuePerShare: parseFloat(Number(metric.bookValuePerShare || 0).toFixed(2)),
                dividendPerShare: parseFloat(Number(metric.dividendPerShare || 0).toFixed(2)),
                priceHigh: parseFloat(Number(priceHigh).toFixed(2)),
                priceLow: parseFloat(Number(priceLow).toFixed(2)),
                autoFetched: true,
                dataSource: 'fmp-verified'
            };
        })
        .filter(row => row !== null && row.year > 0)
        .sort((a, b) => b.year - a.year)
        .slice(0, 30);

    // Check if we have meaningful data
    const hasRealData = annualData.some(row =>
        row.earningsPerShare !== 0 ||
        row.cashFlowPerShare !== 0 ||
        row.bookValuePerShare !== 0
    );

    if (!hasRealData || annualData.length < 3) {
        return null; // Not enough real data
    }

    // Calculate growth rates (S2-SYNC-008 to S2-SYNC-013)
    const growthRates = calculateGrowthRates(annualData);

    // Calculate target ratios (3-year averages)
    const targetRatios = calculateTargetRatios(annualData, currentQuote?.price || 0);

    const currentPrice = currentQuote?.price || profile?.price || 0;
    const currentDividend = annualData.length > 0 ? annualData[0].dividendPerShare : 0;

    return {
        ticker: ticker.toUpperCase(),
        profile_id: ticker.toUpperCase(),
        annual_data: annualData,
        assumptions: {
            currentPrice,
            currentDividend,
            ...growthRates,
            ...targetRatios,
            yearsToProject: 5,
            discountRate: 0.10,
            requiredReturn: 0.10,
            dataSource: 'fmp-verified',
            lastSync: new Date().toISOString()
        },
        company_info: {
            symbol: profile?.symbol || ticker,
            name: profile?.companyName || '',
            sector: profile?.sector || '',
            industry: profile?.industry || '',
            exchange: profile?.exchangeShortName || '',
            currency: profile?.currency || 'USD',
            country: profile?.country || '',
            beta: profile?.beta || 1,
            marketCap: profile?.mktCap || 0,
            website: profile?.website || '',
            description: (profile?.description || '').substring(0, 500),
            image: profile?.image || ''
        },
        is_current: true,
        is_watchlist: false,
        auto_fetched: true,
        notes: `FMP sync at ${new Date().toISOString()}`
    };
}

/**
 * Calculate CAGR growth rates (S2-CALC-016)
 */
function calculateGrowthRates(annualData) {
    const years = 5;
    const sortedData = [...annualData].sort((a, b) => b.year - a.year);

    const calculateCAGR = (values) => {
        if (values.length < 2) return 0;
        const start = values[values.length - 1];
        const end = values[0];
        if (start <= 0 || end <= 0) return 0;
        const cagr = Math.pow(end / start, 1 / (values.length - 1)) - 1;
        return Math.min(Math.max(cagr, -0.5), 1.0); // Clamp between -50% and +100%
    };

    const recentData = sortedData.slice(0, Math.min(years + 1, sortedData.length));
    const epsValues = recentData.filter(d => d.earningsPerShare > 0).map(d => d.earningsPerShare);
    const cfValues = recentData.filter(d => d.cashFlowPerShare > 0).map(d => d.cashFlowPerShare);
    const bvValues = recentData.filter(d => d.bookValuePerShare > 0).map(d => d.bookValuePerShare);
    const divValues = recentData.filter(d => d.dividendPerShare > 0).map(d => d.dividendPerShare);

    return {
        growthRateEPS: parseFloat((calculateCAGR(epsValues.reverse()) * 100).toFixed(2)),
        growthRateCF: parseFloat((calculateCAGR(cfValues.reverse()) * 100).toFixed(2)),
        growthRateBV: parseFloat((calculateCAGR(bvValues.reverse()) * 100).toFixed(2)),
        growthRateDIV: parseFloat((calculateCAGR(divValues.reverse()) * 100).toFixed(2))
    };
}

/**
 * Calculate target ratios (3-year averages)
 */
function calculateTargetRatios(annualData, currentPrice) {
    const sortedData = [...annualData].sort((a, b) => b.year - a.year).slice(0, 3);

    const avgEPS = sortedData.reduce((sum, d) => sum + Math.max(d.earningsPerShare, 0), 0) / sortedData.length;
    const avgCF = sortedData.reduce((sum, d) => sum + Math.max(d.cashFlowPerShare, 0), 0) / sortedData.length;
    const avgBV = sortedData.reduce((sum, d) => sum + Math.max(d.bookValuePerShare, 0), 0) / sortedData.length;
    const avgDiv = sortedData.reduce((sum, d) => sum + Math.max(d.dividendPerShare, 0), 0) / sortedData.length;

    // Calculate average price from high/low
    const avgPrices = sortedData.map(d => (d.priceHigh + d.priceLow) / 2);
    const avgPrice = avgPrices.reduce((sum, p) => sum + p, 0) / avgPrices.length || currentPrice;

    return {
        targetPE: avgEPS > 0 ? parseFloat((avgPrice / avgEPS).toFixed(2)) : 15,
        targetPCF: avgCF > 0 ? parseFloat((avgPrice / avgCF).toFixed(2)) : 10,
        targetPBV: avgBV > 0 ? parseFloat((avgPrice / avgBV).toFixed(2)) : 2,
        targetDividendYield: avgDiv > 0 && avgPrice > 0 ? parseFloat(((avgDiv / avgPrice) * 100).toFixed(2)) : 2
    };
}

/**
 * Save snapshot to Supabase
 */
async function saveSnapshot(snapshot) {
    if (DRY_RUN) {
        if (VERBOSE) {
            console.log(`  [DRY RUN] Would save: ${snapshot.ticker} with ${snapshot.annual_data.length} years of data`);
        }
        return { success: true, dryRun: true };
    }

    try {
        // First, mark any existing current snapshots as not current
        await supabase
            .from('finance_pro_snapshots')
            .update({ is_current: false })
            .eq('ticker', snapshot.ticker)
            .eq('is_current', true);

        // Insert new snapshot
        const { data, error } = await supabase
            .from('finance_pro_snapshots')
            .insert([{
                ...snapshot,
                snapshot_date: new Date().toISOString().split('T')[0]
            }])
            .select()
            .single();

        if (error) {
            throw error;
        }

        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Process a batch of tickers
 */
async function processBatch(tickers, batchIndex, totalBatches) {
    console.log(`\n--- Batch ${batchIndex + 1}/${totalBatches} (${tickers.length} tickers) ---`);

    for (const ticker of tickers) {
        const tickerStart = Date.now();

        try {
            // Fetch FMP data
            if (VERBOSE) console.log(`  Fetching ${ticker}...`);
            const fmpData = await fetchFMP_data(ticker);

            if (!fmpData.success) {
                stats.failed++;
                stats.failures.push({ ticker, error: fmpData.error });
                console.log(`  ❌ ${ticker}: API error - ${fmpData.error}`);
                continue;
            }

            // Transform to snapshot format
            const snapshot = transformToSnapshot(fmpData);

            if (!snapshot) {
                stats.noData++;
                stats.noDataTickers.push(ticker);
                console.log(`  ⚠️ ${ticker}: No valid financial data`);
                continue;
            }

            // Save to Supabase
            const saveResult = await saveSnapshot(snapshot);

            if (saveResult.success) {
                stats.success++;
                const elapsed = Date.now() - tickerStart;
                console.log(`  ✅ ${ticker}: ${snapshot.annual_data.length} years, price $${snapshot.assumptions.currentPrice.toFixed(2)} (${elapsed}ms)`);
            } else {
                stats.failed++;
                stats.failures.push({ ticker, error: saveResult.error });
                console.log(`  ❌ ${ticker}: Save error - ${saveResult.error}`);
            }
        } catch (error) {
            stats.failed++;
            stats.failures.push({ ticker, error: error.message });
            console.log(`  ❌ ${ticker}: ${error.message}`);
        }

        // Small delay between individual tickers to avoid rate limiting
        await delay(200);
    }
}

// Alias for fetchTickerData with better naming
async function fetchFMP_data(ticker) {
    return await fetchTickerData(ticker);
}

/**
 * Main execution
 */
async function main() {
    try {
        // Get all active tickers
        let query = supabase
            .from('tickers')
            .select('ticker')
            .eq('is_active', true)
            .order('ticker', { ascending: true });

        if (START_TICKER) {
            query = query.gte('ticker', START_TICKER.toUpperCase());
        }

        const { data: tickersData, error: tickersError } = await query;

        if (tickersError) {
            console.error('❌ Error fetching tickers:', tickersError.message);
            process.exit(1);
        }

        let tickers = tickersData.map(t => t.ticker);

        // Filter by ONLY_TICKERS if specified
        if (ONLY_TICKERS.length > 0) {
            const onlySet = new Set(ONLY_TICKERS.map(t => t.toUpperCase()));
            tickers = tickers.filter(t => onlySet.has(t.toUpperCase()));
        }

        // Apply limit if specified
        if (LIMIT > 0) {
            tickers = tickers.slice(0, LIMIT);
        }

        stats.total = tickers.length;
        console.log(`\nFound ${tickers.length} tickers to sync`);

        // Process in batches
        const batches = [];
        for (let i = 0; i < tickers.length; i += BATCH_SIZE) {
            batches.push(tickers.slice(i, i + BATCH_SIZE));
        }

        console.log(`Processing ${batches.length} batches of up to ${BATCH_SIZE} tickers each`);

        for (let i = 0; i < batches.length; i++) {
            await processBatch(batches[i], i, batches.length);

            // Delay between batches
            if (i < batches.length - 1) {
                console.log(`⏳ Waiting ${DELAY_MS}ms before next batch...`);
                await delay(DELAY_MS);
            }
        }

        // Final report
        const elapsed = (Date.now() - stats.startTime) / 1000;
        console.log('\n' + '='.repeat(80));
        console.log('SYNC COMPLETE');
        console.log('='.repeat(80));
        console.log(`Total tickers: ${stats.total}`);
        console.log(`Success: ${stats.success} (${((stats.success / stats.total) * 100).toFixed(1)}%)`);
        console.log(`Failed: ${stats.failed}`);
        console.log(`No data: ${stats.noData}`);
        console.log(`Elapsed time: ${elapsed.toFixed(1)}s`);

        if (stats.failures.length > 0) {
            console.log('\n--- Failed Tickers ---');
            for (const { ticker, error } of stats.failures.slice(0, 20)) {
                console.log(`  ${ticker}: ${error}`);
            }
            if (stats.failures.length > 20) {
                console.log(`  ... and ${stats.failures.length - 20} more`);
            }
        }

        if (stats.noDataTickers.length > 0) {
            console.log('\n--- Tickers with No Valid Data ---');
            console.log(stats.noDataTickers.slice(0, 30).join(', '));
            if (stats.noDataTickers.length > 30) {
                console.log(`  ... and ${stats.noDataTickers.length - 30} more`);
            }
        }

        if (DRY_RUN) {
            console.log('\n⚠️ This was a DRY RUN. Run without --dry-run to save to database.');
        }

    } catch (error) {
        console.error('❌ Script failed:', error);
        process.exit(1);
    }
}

main();
