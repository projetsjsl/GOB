#!/usr/bin/env node
/**
 * Batch cleanup of old snapshot versions
 * Deletes all is_current=false snapshots in batches to avoid timeout
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function batchDelete() {
    console.log('='.repeat(70));
    console.log('SPRINT 1: Batch deleting old snapshot versions');
    console.log('='.repeat(70));

    // Count before
    const { count: beforeCount } = await supabase
        .from('finance_pro_snapshots')
        .select('*', { count: 'exact', head: true });

    console.log('Total snapshots before cleanup:', beforeCount);

    let totalDeleted = 0;
    let batchNum = 0;

    while (true) {
        batchNum++;

        // Get 500 old snapshot IDs
        const { data: batch, error: fetchError } = await supabase
            .from('finance_pro_snapshots')
            .select('id')
            .eq('is_current', false)
            .limit(500);

        if (fetchError) {
            console.error('Error fetching:', fetchError.message);
            break;
        }

        if (!batch || batch.length === 0) {
            console.log('No more old versions to delete');
            break;
        }

        const ids = batch.map(r => r.id);

        // Delete this batch
        const { error: deleteError } = await supabase
            .from('finance_pro_snapshots')
            .delete()
            .in('id', ids);

        if (deleteError) {
            console.error(`Error deleting batch ${batchNum}:`, deleteError.message);
            break;
        }

        totalDeleted += ids.length;
        console.log(`Batch ${batchNum}: Deleted ${ids.length} snapshots (Total: ${totalDeleted})`);

        // Prevent rate limiting
        await new Promise(r => setTimeout(r, 500));
    }

    // Final count
    const { count: afterCount } = await supabase
        .from('finance_pro_snapshots')
        .select('*', { count: 'exact', head: true });

    // Get unique ticker count
    const { data: remaining } = await supabase
        .from('finance_pro_snapshots')
        .select('ticker');

    const uniqueTickers = new Set(remaining.map(r => r.ticker));

    console.log('\n' + '='.repeat(70));
    console.log('CLEANUP COMPLETE');
    console.log('='.repeat(70));
    console.log(`Total deleted: ${totalDeleted}`);
    console.log(`Remaining snapshots: ${afterCount}`);
    console.log(`Unique tickers: ${uniqueTickers.size}`);
}

batchDelete();
