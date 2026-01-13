#!/usr/bin/env node
/**
 * Monitor Sprint 2 FMP Sync Progress
 * Checks database for newly synced snapshots
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkProgress() {
  try {
    // Get all tickers
    const { data: allTickers } = await supabase
      .from('tickers')
      .select('ticker')
      .eq('is_active', true);

    const totalTickers = allTickers?.length || 0;

    // Get synced snapshots (auto_fetched = true, created today)
    const today = new Date().toISOString().split('T')[0];
    const { data: syncedSnapshots } = await supabase
      .from('finance_pro_snapshots')
      .select('ticker, created_at, assumptions')
      .eq('is_current', true)
      .eq('auto_fetched', true)
      .gte('created_at', `${today}T00:00:00Z`)
      .order('created_at', { ascending: false });

    const syncedCount = syncedSnapshots?.length || 0;
    const percentComplete = ((syncedCount / totalTickers) * 100).toFixed(1);

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║          SPRINT 2 FMP SYNC PROGRESS MONITOR                ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log(`📊 Progress: ${syncedCount}/${totalTickers} tickers (${percentComplete}%)`);
    console.log(`⏱️  Time: ${new Date().toLocaleString()}\n`);

    if (syncedSnapshots && syncedSnapshots.length > 0) {
      console.log('📝 Most recent 10 synced tickers:');
      syncedSnapshots.slice(0, 10).forEach((s, i) => {
        const price = s.assumptions?.currentPrice || 0;
        const time = new Date(s.created_at).toLocaleTimeString();
        console.log(`   ${i + 1}. ${s.ticker.padEnd(8)} - $${price.toFixed(2).padStart(8)} at ${time}`);
      });
    }

    console.log('\n💡 To view full log: tail -f /tmp/claude/-Users-projetsjsl/tasks/bbe8978.output');
    console.log('🔄 Run this script again to check updated progress\n');

    // Estimate time remaining
    if (syncedCount > 0) {
      const firstSync = new Date(syncedSnapshots[syncedSnapshots.length - 1].created_at);
      const lastSync = new Date(syncedSnapshots[0].created_at);
      const elapsedMs = lastSync - firstSync;
      const avgTimePerTicker = elapsedMs / syncedCount;
      const remaining = totalTickers - syncedCount;
      const estimatedRemainingMs = avgTimePerTicker * remaining;
      const estimatedMinutes = Math.round(estimatedRemainingMs / 60000);

      console.log(`⏳ Estimated time remaining: ~${estimatedMinutes} minutes\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkProgress();
