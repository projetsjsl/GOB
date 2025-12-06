/**
 * Cron Job Vercel pour synchroniser les données FMP vers ticker_market_cache
 * 
 * Ce cron s'exécute automatiquement toutes les 5 minutes
 * Configuration dans vercel.json
 * 
 * Note: Vercel Pro permet des crons toutes les minutes
 * Pour Hobby, utiliser "0 */15 * * * *" (toutes les 15 minutes)
 */

import { createClient } from '@supabase/supabase-js';

const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';
const FMP_API_KEY = process.env.FMP_API_KEY;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis');
}

if (!FMP_API_KEY) {
  throw new Error('FMP_API_KEY doit être définie');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getAllActiveTickers() {
  const { data, error } = await supabase
    .from('tickers')
    .select('ticker')
    .eq('is_active', true)
    .order('ticker', { ascending: true });

  if (error) {
    throw new Error(`Erreur Supabase: ${error.message}`);
  }

  return (data || []).map(t => t.ticker);
}

async function fetchFMPQuotes(symbols) {
  const batchSize = 100;
  const batches = [];
  
  for (let i = 0; i < symbols.length; i += batchSize) {
    batches.push(symbols.slice(i, i + batchSize));
  }

  const allQuotes = [];

  for (const batch of batches) {
    const symbolsStr = batch.join(',');
    const url = `${FMP_BASE_URL}/quote/${symbolsStr}?apikey=${FMP_API_KEY}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`❌ FMP Error: ${response.status}`);
        continue;
      }

      const quotes = await response.json();
      
      if (Array.isArray(quotes)) {
        allQuotes.push(...quotes);
      } else if (quotes && quotes.symbol) {
        allQuotes.push(quotes);
      }

      if (batches.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.error(`❌ Erreur fetch FMP:`, error);
      continue;
    }
  }

  return allQuotes;
}

async function fetchFMPRatios(symbols) {
  const batchSize = 100;
  const batches = [];
  
  for (let i = 0; i < symbols.length; i += batchSize) {
    batches.push(symbols.slice(i, i + batchSize));
  }

  const allRatios = [];

  for (const batch of batches) {
    const symbolsStr = batch.join(',');
    const url = `${FMP_BASE_URL}/ratios-ttm/${symbolsStr}?apikey=${FMP_API_KEY}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`❌ FMP Ratios Error: ${response.status}`);
        continue;
      }

      const ratios = await response.json();
      
      if (Array.isArray(ratios)) {
        allRatios.push(...ratios);
      } else if (ratios && ratios.symbol) {
        allRatios.push(ratios);
      }

      if (batches.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.error(`❌ Erreur fetch FMP ratios:`, error);
      continue;
    }
  }

  return allRatios;
}

function combineQuoteAndRatios(quotes, ratios) {
  const ratiosMap = new Map();
  ratios.forEach(r => {
    if (r.symbol) {
      ratiosMap.set(r.symbol.toUpperCase(), r);
    }
  });

  return quotes.map(quote => {
    const symbol = quote.symbol?.toUpperCase();
    const ratio = ratiosMap.get(symbol) || {};

    return {
      symbol: symbol,
      price: quote.price || 0,
      change: quote.change || 0,
      changePercent: quote.changesPercentage || 0,
      volume: quote.volume || 0,
      marketCap: quote.marketCap || 0,
      pe: ratio.peRatioTTM || null,
      pcf: ratio.priceToCashFlowRatioTTM || null,
      pbv: ratio.priceToBookRatioTTM || null,
      dividendYield: ratio.dividendYieldTTM || null,
      eps: quote.eps || null,
      revenue: null,
      netIncome: null
    };
  });
}

async function syncAllTickers() {
  const startTime = Date.now();
  console.log('🔄 [CRON] Démarrage synchronisation batch FMP...');

  try {
    const tickers = await getAllActiveTickers();
    console.log(`✅ ${tickers.length} tickers actifs trouvés`);

    if (tickers.length === 0) {
      return { success: true, message: 'Aucun ticker actif', tickersProcessed: 0 };
    }

    const quotes = await fetchFMPQuotes(tickers);
    console.log(`✅ ${quotes.length} quotes récupérées`);

    const ratios = await fetchFMPRatios(tickers);
    console.log(`✅ ${ratios.length} ratios récupérés`);

    const combinedData = combineQuoteAndRatios(quotes, ratios);
    console.log(`✅ ${combinedData.length} données combinées`);

    const { data, error } = await supabase.rpc('upsert_ticker_market_cache_batch', {
      p_data: combinedData
    });

    if (error) {
      throw new Error(`Erreur upsert: ${error.message}`);
    }

    const executionTime = Date.now() - startTime;
    console.log(`✅ [CRON] Synchronisation terminée: ${combinedData.length} tickers en ${executionTime}ms`);

    return {
      success: true,
      tickersProcessed: combinedData.length,
      executionTimeMs: executionTime,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ [CRON] Erreur synchronisation batch:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Vérifier que c'est bien un appel cron (Vercel ajoute un header)
  const authHeader = req.headers['authorization'];
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}` || 
                 req.headers['x-vercel-cron'] === '1';

  if (req.method === 'GET' || req.method === 'POST' || isCron) {
    const result = await syncAllTickers();
    return res.status(result.success ? 200 : 500).json(result);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

