
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

async function verify() {
  console.log('🔍 Verifying 10 tickers in finance_pro_snapshots...');

  const { data: tickers, error: tErr } = await supabase
    .from('tickers')
    .select('ticker')
    .limit(10)
    .order('ticker');

  const tickerSymbols = tickers.map(t => t.ticker.toUpperCase());
  console.log('Target Tickers:', tickerSymbols.join(', '));

  const { data: snapshots, error } = await supabase
    .from('finance_pro_snapshots')
    .select('ticker, is_current, auto_fetched, annual_data, assumptions, created_at')
    .in('ticker', tickerSymbols)
    .eq('is_current', true);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`✅ Found ${snapshots.length} snapshots.`);
  
  snapshots.forEach(s => {
    const dataCount = Array.isArray(s.annual_data) ? s.annual_data.length : 0;
    const hasEPS = dataCount > 0 && s.annual_data[dataCount-1].earningsPerShare !== null;
    const assumptions = s.assumptions ? Object.keys(s.assumptions).length : 0;
    
    console.log(`- ${s.ticker}: ${dataCount} years data, EPS present: ${hasEPS}, Assumptions: ${assumptions}, Created: ${s.created_at}`);
    
    if (dataCount === 0 || !hasEPS) {
        console.warn(`  ⚠️  Data looks incomplete for ${s.ticker}`);
    }
  });
}

verify();
