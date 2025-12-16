
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const tickers = ['950160.KQ', '9984.T', 'A', 'AA', 'AAPL', 'AAPL.MX', 'AAPL.NE', 'ABBNY', 'ABBV', 'ABBV.BA'];

async function cleanup() {
  console.log('🧹 Cleaning up old snapshots...');
 // First, get IDs of current snapshots to keep
 const { data: currentSnapshots, error } = await supabase
    .from('finance_pro_snapshots')
    .select('id, ticker')
    .in('ticker', tickers)
    .eq('is_current', true);
    
 if (error || !currentSnapshots) {
     console.error("Error fetching current:", error);
     return;
 }
 
 const keepIds = new Set(currentSnapshots.map(s => s.id));
 console.log(`Keeping ${keepIds.size} current snapshots.`);
 
 // Find duplicates (non-current)
 const { data: allSnapshots } = await supabase
    .from('finance_pro_snapshots')
    .select('id, ticker, is_current')
    .in('ticker', tickers);
    
 const toDelete = allSnapshots.filter(s => !keepIds.has(s.id));
 
 if (toDelete.length === 0) {
     console.log("No duplicates found.");
     return;
 }
 
 console.log(`Deleting ${toDelete.length} old snapshots...`);
 const idsToDelete = toDelete.map(s => s.id);
 
 const { error: delError } = await supabase
    .from('finance_pro_snapshots')
    .delete()
    .in('id', idsToDelete);
    
 if (delError) console.error("Delete error:", delError);
 else console.log("✅ Cleanup complete.");
}

cleanup();
