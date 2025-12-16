
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials are missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySync() {
  console.log('🔍 Verifying 10 processed tickers in ticker_price_cache...');
  
  // The list we synced
  const tickersToCheck = ['950160.KQ', '9984.T', 'A', 'AA', 'AAPL', 'AAPL.MX', 'AAPL.NE', 'ABBNY', 'ABBV', 'ABBV.BA'];

  const { data, error } = await supabase
    .from('ticker_price_cache')
    .select('ticker, current_price, updated_at')
    .in('ticker', tickersToCheck);

  if (error) {
    console.error('❌ Database error:', error.message);
    return;
  }

  console.log(`✅ Found ${data.length} / ${tickersToCheck.length} records.`);
  console.table(data);

  if (data.length === tickersToCheck.length) {
    console.log('🎉 Verification SUCCESS: All tickers found in cache.');
  } else {
    console.log('⚠️ Verification PARTIAL: Some tickers missing.');
    const foundSyms = data.map(d => d.symbol);
    const missing = tickersToCheck.filter(t => !foundSyms.includes(t));
    console.log('Missing:', missing);
  }
}

verifySync();
