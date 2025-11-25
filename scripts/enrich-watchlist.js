/**
 * Watchlist Enrichment Script
 * Adds major large-cap stocks from Canada, US, and International markets
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Large Cap Tickers by Region
const LARGE_CAPS = {
    canada: [
        // Banks
        'RY.TO', 'TD.TO', 'BNS.TO', 'BMO.TO', 'CM.TO', 'NA.TO',
        // Energy
        'CNQ.TO', 'SU.TO', 'ENB.TO', 'TRP.TO', 'IMO.TO', 'CVE.TO',
        // Telecom
        'BCE.TO', 'T.TO', 'QBR-B.TO',
        // Utilities
        'FTS.TO', 'EMA.TO', 'H.TO',
        // Industrials
        'CNR.TO', 'CP.TO', 'CCL-B.TO', 'WCN.TO',
        // Consumer
        'L.TO', 'MG.TO', 'ATD.TO', 'DOL.TO',
        // Real Estate
        'CAR-UN.TO', 'REI-UN.TO', 'AP-UN.TO',
        // Tech
        'SHOP.TO', 'CSU.TO',
        // Materials
        'ABX.TO', 'NTR.TO', 'FM.TO'
    ],
    us: [
        // Tech Giants (FAANG+)
        'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA',
        // Financials
        'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'BLK', 'SCHW',
        // Healthcare
        'JNJ', 'UNH', 'PFE', 'ABBV', 'TMO', 'MRK', 'LLY', 'ABT',
        // Consumer
        'WMT', 'PG', 'KO', 'PEP', 'COST', 'NKE', 'MCD', 'SBUX',
        // Industrials
        'BA', 'CAT', 'GE', 'HON', 'UPS', 'RTX', 'LMT', 'MMM',
        // Energy
        'XOM', 'CVX', 'COP', 'SLB', 'EOG',
        // Telecom
        'VZ', 'T', 'TMUS',
        // Other Blue Chips
        'BRK.B', 'V', 'MA', 'DIS', 'NFLX', 'INTC', 'AMD', 'CSCO'
    ],
    international: [
        // Europe
        'ASML', 'SAP', 'LVMH', 'NVO', 'NESN', 'ROG', 'MC.PA', 'OR.PA',
        // UK
        'SHEL', 'BP', 'HSBA', 'AZN', 'ULVR', 'GSK',
        // Asia
        'TSM', 'BABA', 'TCEHY', 'SONY', '9984.T', 'SMSN.IL',
        // Australia
        'BHP', 'RIO'
    ]
};

async function addTickersToWatchlist(tickers, region) {
    console.log(`\n📊 Adding ${tickers.length} ${region} tickers to watchlist...`);

    let added = 0;
    let skipped = 0;

    for (const ticker of tickers) {
        // Check if ticker already exists
        const { data: existing } = await supabase
            .from('ticker_watchlist')
            .select('ticker')
            .eq('ticker', ticker)
            .single();

        if (existing) {
            console.log(`⏭️  ${ticker} already exists`);
            skipped++;
            continue;
        }

        // Add ticker
        const { error } = await supabase
            .from('ticker_watchlist')
            .insert({
                ticker: ticker,
                is_favorite: true, // Mark as favorite (star)
                added_at: new Date().toISOString()
            });

        if (error) {
            console.error(`❌ Failed to add ${ticker}:`, error.message);
        } else {
            console.log(`✅ Added ${ticker}`);
            added++;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n${region.toUpperCase()} Summary: ✅ ${added} added, ⏭️  ${skipped} skipped`);
    return { added, skipped };
}

async function enrichWatchlist() {
    console.log('🚀 Starting watchlist enrichment...\n');

    const stats = {
        canada: await addTickersToWatchlist(LARGE_CAPS.canada, 'Canada'),
        us: await addTickersToWatchlist(LARGE_CAPS.us, 'US'),
        international: await addTickersToWatchlist(LARGE_CAPS.international, 'International')
    };

    console.log('\n\n📊 ENRICHMENT COMPLETE');
    console.log('═══════════════════════════════════════');
    console.log(`🇨🇦 Canada:        ✅ ${stats.canada.added} added, ⏭️  ${stats.canada.skipped} skipped`);
    console.log(`🇺🇸 US:            ✅ ${stats.us.added} added, ⏭️  ${stats.us.skipped} skipped`);
    console.log(`🌍 International: ✅ ${stats.international.added} added, ⏭️  ${stats.international.skipped} skipped`);
    console.log('═══════════════════════════════════════');

    const totalAdded = stats.canada.added + stats.us.added + stats.international.added;
    const totalSkipped = stats.canada.skipped + stats.us.skipped + stats.international.skipped;
    console.log(`📈 TOTAL:         ✅ ${totalAdded} added, ⏭️  ${totalSkipped} skipped`);
}

enrichWatchlist().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
