#!/usr/bin/env node
/**
 * Check snapshot sync status
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkStatus() {
    // Get total current snapshots
    const { data: currentSnaps, error: snapError } = await supabase
        .from('finance_pro_snapshots')
        .select('ticker, auto_fetched, assumptions')
        .eq('is_current', true);

    if (snapError) {
        console.error('Error:', snapError);
        return;
    }

    // Get total tickers
    const { data: allTickers, error: tickerError } = await supabase
        .from('tickers')
        .select('ticker')
        .eq('is_active', true);

    if (tickerError) {
        console.error('Error:', tickerError);
        return;
    }

    const totalTickers = allTickers.length;
    const totalSnapshots = currentSnaps.length;
    const fmpAutoFetched = currentSnaps.filter(s => s.auto_fetched === true).length;
    const withValidPrice = currentSnaps.filter(s => s.assumptions?.currentPrice > 0).length;
    const uniqueTickers = new Set(currentSnaps.map(s => s.ticker)).size;

    console.log('='.repeat(60));
    console.log('SNAPSHOT SYNC STATUS');
    console.log('='.repeat(60));
    console.log(`Total active tickers in database: ${totalTickers}`);
    console.log(`Current snapshots (is_current=true): ${totalSnapshots}`);
    console.log(`Unique tickers with snapshots: ${uniqueTickers}`);
    console.log(`FMP auto-fetched snapshots: ${fmpAutoFetched}`);
    console.log(`Snapshots with valid price > 0: ${withValidPrice}`);
    console.log(`\nCoverage: ${((uniqueTickers / totalTickers) * 100).toFixed(1)}%`);
    console.log(`Remaining to sync: ${totalTickers - uniqueTickers}`);
}

checkStatus();
