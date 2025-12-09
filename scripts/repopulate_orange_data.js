
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import companyDataHandler from '../api/fmp-company-data.js';

// Load environment variables from .env.local
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    // dotenv.config won't override existing env vars by default, which is what we want
    dotenv.config({ path: envPath });
    console.log('✅ Loaded .env.local');
} catch (e) {
    console.warn('⚠️ Could not load .env.local, using process.env');
}

// --- UTILS FROM calculations.ts (Ported to JS) ---

const calculateAverage = (data) => {
  if (!data || data.length === 0) return 0;
  const sum = data.reduce((a, b) => a + b, 0);
  return sum / data.length;
};

const calculateCAGR = (startValue, endValue, years) => {
  if (startValue <= 0 || endValue <= 0 || years <= 0) return 0;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
};

// Initial Assumptions Default
const INITIAL_ASSUMPTIONS = {
    currentPrice: 0,
    currentDividend: 0,
    growthRateEPS: 0,
    growthRateSales: 0,
    growthRateCF: 0,
    growthRateBV: 0,
    growthRateDiv: 0,
    targetPE: 0,
    targetPCF: 0,
    targetPBV: 0,
    targetYield: 0,
    requiredReturn: 10.0,
    dividendPayoutRatio: 0,
    baseYear: new Date().getFullYear()
};

/**
 * Replicates public/3p1/utils/calculations.ts autoFillAssumptionsFromFMPData
 */
const autoFillAssumptionsFromFMPData = (data, currentPrice, existingAssumptions = {}) => {
  if (!data || data.length === 0) {
    return existingAssumptions || {};
  }

  // Filter valid history
  const validHistory = data.filter(d => d.priceHigh > 0 && d.priceLow > 0);
  
  // Find last valid EPS year
  const lastValidData = [...data].reverse().find(d => d.earningsPerShare > 0) || data[data.length - 1];
  const lastData = data[data.length - 1];
  const firstData = data[0];
  const yearsDiff = Math.max(1, lastValidData.year - firstData.year);
  
  // CAGR Calculations
  const histGrowthEPS = calculateCAGR(firstData.earningsPerShare, lastValidData.earningsPerShare, yearsDiff);
  const histGrowthSales = calculateCAGR(firstData.cashFlowPerShare, lastValidData.cashFlowPerShare, yearsDiff); // Using CF per share as proxy for Sales/CF growth logic in original
  // note: original used cashFlowPerShare for histGrowthSales variable name, likely using CF as proxy or typo in original. kept consistent.
  const histGrowthBV = calculateCAGR(firstData.bookValuePerShare, lastValidData.bookValuePerShare, yearsDiff);
  const histGrowthDiv = calculateCAGR(firstData.dividendPerShare, lastValidData.dividendPerShare, yearsDiff);
  
  // Average Ratios
  const peRatios = validHistory
    .map(d => {
      if (d.earningsPerShare <= 0) return null;
      return (d.priceHigh / d.earningsPerShare + d.priceLow / d.earningsPerShare) / 2;
    })
    .filter(v => v !== null && isFinite(v) && v > 0);
  const avgPE = peRatios.length > 0 ? calculateAverage(peRatios) : 15;
  
  const pcfRatios = validHistory
    .map(d => {
      if (d.cashFlowPerShare <= 0) return null;
      return (d.priceHigh / d.cashFlowPerShare + d.priceLow / d.cashFlowPerShare) / 2;
    })
    .filter(v => v !== null && isFinite(v) && v > 0);
  const avgPCF = pcfRatios.length > 0 ? calculateAverage(pcfRatios) : 10;
  
  const pbvRatios = validHistory
    .map(d => {
      if (d.bookValuePerShare <= 0) return null;
      return (d.priceHigh / d.bookValuePerShare + d.priceLow / d.bookValuePerShare) / 2;
    })
    .filter(v => v !== null && isFinite(v) && v > 0);
  const avgPBV = pbvRatios.length > 0 ? calculateAverage(pbvRatios) : 6;
  
  const yieldValues = validHistory
    .map(d => {
      if (d.priceHigh <= 0) return null;
      return (d.dividendPerShare / d.priceHigh) * 100;
    })
    .filter(v => v !== null && isFinite(v) && v >= 0);
  const avgYield = yieldValues.length > 0 ? calculateAverage(yieldValues) : 2.0;
  
  return {
    currentPrice,
    currentDividend: lastData.dividendPerShare || existingAssumptions.currentDividend || 0,
    baseYear: lastValidData.year,
    
    // Growth Constraints (0-20%)
    growthRateEPS: Math.min(Math.max(histGrowthEPS, 0), 20),
    growthRateSales: Math.min(Math.max(histGrowthSales, 0), 20),
    growthRateCF: Math.min(Math.max(histGrowthSales, 0), 20), // replicating original logic
    growthRateBV: Math.min(Math.max(histGrowthBV, 0), 20),
    growthRateDiv: Math.min(Math.max(histGrowthDiv, 0), 20),
    
    // Ratio Constraints
    targetPE: parseFloat(Math.max(1, Math.min(avgPE, 100)).toFixed(1)),
    targetPCF: parseFloat(Math.max(1, Math.min(avgPCF, 100)).toFixed(1)),
    targetPBV: parseFloat(Math.max(0.5, Math.min(avgPBV, 50)).toFixed(1)),
    targetYield: parseFloat(Math.max(0, Math.min(avgYield, 20)).toFixed(2)),
    
    // Preserve existing
    requiredReturn: existingAssumptions.requiredReturn || 10.0,
    dividendPayoutRatio: existingAssumptions.dividendPayoutRatio,
    excludeEPS: existingAssumptions.excludeEPS,
    excludeCF: existingAssumptions.excludeCF,
    excludeBV: existingAssumptions.excludeBV,
    excludeDIV: existingAssumptions.excludeDIV
  };
};

// --- MAIN SCRIPT ---

async function main() {
    console.log('🚀 Starting Ticker Data Repopulation...');

    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error('❌ Missing Supabase configuration');
        process.exit(1);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // 1. Fetch all active tickers
    const { data: tickers, error: tickersError } = await supabase
        .from('tickers')
        .select('*')
        .eq('is_active', true);

    if (tickersError) {
        console.error('❌ Error fetching tickers:', tickersError);
        process.exit(1);
    }

    console.log(`📋 Found ${tickers.length} active tickers to process.`);

    let successCount = 0;
    let failCount = 0;

    for (const tickerObj of tickers) {
        const symbol = tickerObj.ticker;
        console.log(`\nProcessing ${symbol}...`);

        try {
            // Mock Req/Res for the API Handler
            const mockReq = { 
                method: 'GET', 
                query: { symbol }
            };
            
            let responseData = null;
            let statusCode = 200;
            
            const mockRes = {
                setHeader: () => {},
                status: (code) => { 
                    statusCode = code; 
                    return mockRes; 
                },
                json: (data) => { 
                    responseData = data; 
                    return mockRes; 
                },
                end: () => {}
            };

            // Call the handler
            await companyDataHandler(mockReq, mockRes);

            if (statusCode !== 200 || !responseData || !responseData.data) {
                console.warn(`⚠️ API Error for ${symbol}: Status ${statusCode}`);
                if (responseData && responseData.error) console.warn(`   Error: ${responseData.error}`);
                failCount++;
                continue;
            }

            const annualData = responseData.data;
            const currentPrice = responseData.currentPrice;
            const info = responseData.info;

            if (!annualData || annualData.length === 0) {
                console.warn(`⚠️ No historical data found for ${symbol}`);
                failCount++;
                continue;
            }

            // Calculate Assumptions (Orange Data)
            const newAssumptions = autoFillAssumptionsFromFMPData(
                annualData,
                currentPrice,
                INITIAL_ASSUMPTIONS
            );

            // Prepare Snapshot Data
            const snapshotData = {
                ticker: symbol,
                profile_id: symbol,
                annual_data: annualData,
                assumptions: newAssumptions, // These are the calculated "Orange Data"
                company_info: {
                    ...info,
                    financials: responseData.financials,
                    analysisData: responseData.analysisData
                },
                is_current: true,
                auto_fetched: true,
                snapshot_date: new Date().toISOString()
            };

            // Upsert into Supabase (Insert new, set is_current=true)
            
            // 1. Unmark old
            await supabase
                .from('finance_pro_snapshots')
                .update({ is_current: false })
                .eq('ticker', symbol);

            // 2. Insert new
            const { error: insertError } = await supabase
                .from('finance_pro_snapshots')
                .insert([snapshotData]);

            if (insertError) {
                console.error(`❌ DB Insert Error for ${symbol}:`, insertError.message);
                failCount++;
            } else {
                console.log(`✅ Updated ${symbol} with correct assumptions (Orange Data).`);
                console.log(`   Growth EPS: ${newAssumptions.growthRateEPS.toFixed(2)}%, Target PE: ${newAssumptions.targetPE}`);
                successCount++;
            }

        } catch (err) {
            console.error(`❌ Unexpected error processing ${symbol}:`, err.message);
            failCount++;
        }
        
        // Brief pause to be nice to APIs
        await new Promise(r => setTimeout(r, 200));
    }

    console.log('\n--- SUMMARY ---');
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log('Done.');
}

main().catch(console.error);
