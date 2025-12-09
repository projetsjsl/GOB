
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch'; // Need this if node version < 18, but package.json says node 22.x, so global fetch should exist. But to be safe I'll use globalThis.fetch or just rely on Node 18+ fetch. 'node-fetch' isn't in dependencies, only 'axios'. I'll use global fetch.

dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback to .env if needed or overwrite? properties in .env.local usually override .env in Next.js, but here we just want to load variables.
// If both exist, we might need to handle it. 
// A better way is:
const result = dotenv.config({ path: '.env.local' });
if (result.error) {
  dotenv.config(); // try default .env
}


const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';
const FMP_API_KEY = process.env.FMP_API_KEY;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!FMP_API_KEY) {
  console.error('❌ FMP_API_KEY is missing in .env');
  process.exit(1);
}
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials are missing in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('✅ Configuration loaded');
console.log(`FMP Key length: ${FMP_API_KEY.length}`);
console.log(`Supabase URL: ${supabaseUrl}`);

/**
 * Récupère tous les tickers actifs depuis Supabase
 */
async function get10ActiveTickers() {
  console.log('Fetching 10 active tickers from Supabase...');
  const { data, error } = await supabase
    .from('tickers')
    .select('ticker')
    .eq('is_active', true)
    .limit(10)
    .order('ticker', { ascending: true });

  if (error) {
    throw new Error(`Erreur Supabase: ${error.message}`);
  }

  return (data || []).map(t => t.ticker);
}

/**
 * Appelle FMP pour récupérer UNIQUEMENT les quotes
 */
async function fetchFMPQuotes(symbols) {
  const symbolsStr = symbols.join(',');
  const url = `${FMP_BASE_URL}/quote/${symbolsStr}?apikey=${FMP_API_KEY}`;
  
  console.log(`Fetching quotes for: ${symbolsStr}`);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`❌ FMP Error: ${response.status}`);
      return [];
    }

    const quotes = await response.json();
    return Array.isArray(quotes) ? quotes : [quotes];
  } catch (error) {
    console.error(`❌ Erreur fetch FMP:`, error);
    return [];
  }
}

async function syncTickers() {
  const startTime = Date.now();
  console.log('🔄 Démarrage synchronisation TEST (10 tickers)...');

  try {
    // 1. Récupérer 10 tickers actifs
    const tickers = await get10ActiveTickers();
    console.log(`✅ ${tickers.length} tickers actifs trouvés: ${tickers.join(', ')}`);

    if (tickers.length === 0) {
      console.log('Aucun ticker à synchroniser.');
      return;
    }

    // 2. Appeler FMP
    console.log('📡 Appel FMP pour quotes...');
    const quotes = await fetchFMPQuotes(tickers);
    console.log(`✅ ${quotes.length} quotes récupérées`);

    // 3. Formater les données
    const priceData = quotes.map(quote => ({
      symbol: quote.symbol?.toUpperCase(),
      price: quote.price || 0,
      change: quote.change || 0,
      changePercent: quote.changesPercentage || 0,
      volume: quote.volume || 0,
      marketCap: quote.marketCap || 0,
      last_updated: new Date().toISOString() // Ensure we update timestamp if the RPC doesn't do it automatically
    }));

    // 4. Upsert en batch
    console.log('💾 Upsert dans ticker_price_cache...');
    
    // Note: The original script uses 'upsert_ticker_price_cache_batch' RPC.
    // We should check if we can use it or if we need to fall back to direct insert if RPC fails locally?
    // Let's try RPC first as it's what production uses.
    
    const { error } = await supabase.rpc('upsert_ticker_price_cache_batch', {
      p_data: priceData
    });

    if (error) {
      console.error(`❌ Erreur upsert RPC:`, error.message);
      // Fallback to table upsert if RPC doesn't exist or fails
      console.log('⚠️ Tentative d\'upsert direct dans la table ticker_price_cache...');
      const { error: directError } = await supabase
        .from('ticker_price_cache')
        .upsert(priceData, { onConflict: 'symbol' });
        
      if (directError) {
         console.error(`❌ Erreur upsert direct:`, directError.message);
      } else {
         console.log('✅ Upsert direct réussi');
      }
    } else {
      console.log('✅ Upsert RPC réussi');
    }

    const executionTime = Date.now() - startTime;
    console.log(`✅ TEST TERMINÉ: ${priceData.length} tickers synchronisés en ${executionTime}ms`);

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

syncTickers();
