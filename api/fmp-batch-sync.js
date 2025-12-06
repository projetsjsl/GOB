/**
 * Job Batch pour synchroniser UNIQUEMENT LES PRIX FMP vers ticker_price_cache
 * 
 * ⚠️ IMPORTANT : Ce job synchronise UNIQUEMENT les PRIX (pas les ratios/métriques)
 * Les données fondamentales (ratios, métriques) sont récupérées à la demande dans 3p1
 * 
 * Ce job :
 * 1. Récupère tous les tickers actifs depuis Supabase (1 requête)
 * 2. Appelle FMP quotes en batch (PRIX UNIQUEMENT - pas de ratios)
 * 3. Upsert massif dans ticker_price_cache (1 requête)
 * 
 * Fréquence : UNIQUEMENT quand nécessaire (beta-dashboard ouvert, 3p1 prix)
 * - Option 1 : Cron toutes les 5-15 min (si beta-dashboard toujours ouvert)
 * - Option 2 : Appel manuel depuis le frontend quand nécessaire
 * 
 * Usage:
 * - Appel manuel : POST /api/fmp-batch-sync (recommandé - à la demande)
 * - Cron optionnel : */15 * * * * (toutes les 15 min si nécessaire)
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

/**
 * Récupère tous les tickers actifs depuis Supabase
 */
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

/**
 * Appelle FMP pour récupérer UNIQUEMENT les quotes (prix, volume, etc.)
 * ⚠️ PAS de ratios/métriques - seulement les prix pour réduire l'egress
 * FMP accepte jusqu'à 100 symboles par requête
 */
async function fetchFMPQuotes(symbols) {
  // FMP limite à 100 symboles par requête
  const batchSize = 100;
  const batches = [];
  
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    batches.push(batch);
  }

  const allQuotes = [];

  for (const batch of batches) {
    const symbolsStr = batch.join(',');
    const url = `${FMP_BASE_URL}/quote/${symbolsStr}?apikey=${FMP_API_KEY}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`❌ FMP Error pour batch ${batch[0]}-${batch[batch.length-1]}: ${response.status}`);
        continue;
      }

      const quotes = await response.json();
      
      if (Array.isArray(quotes)) {
        allQuotes.push(...quotes);
      } else if (quotes && quotes.symbol) {
        // Si un seul résultat, FMP retourne un objet au lieu d'un array
        allQuotes.push(quotes);
      }

      // Rate limiting : 300 req/min pour FMP free tier
      // On fait ~20 req/min max pour être safe
      if (batches.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3s entre batches
      }
    } catch (error) {
      console.error(`❌ Erreur fetch FMP batch:`, error);
      continue;
    }
  }

  return allQuotes;
}

/**
 * Récupère les ratios FMP (P/E, P/CF, P/BV, Yield)
 * FMP accepte jusqu'à 100 symboles par requête
 */
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

/**
 * Combine quotes et ratios en un format unifié pour le cache
 */
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
      revenue: null, // Pas dans quote, nécessiterait key-metrics
      netIncome: null // Pas dans quote, nécessiterait key-metrics
    };
  });
}

/**
 * Synchronise tous les tickers actifs depuis FMP vers ticker_market_cache
 */
async function syncAllTickers() {
  const startTime = Date.now();
  console.log('🔄 Démarrage synchronisation batch FMP...');

  try {
    // 1. Récupérer tous les tickers actifs (1 requête Supabase)
    console.log('📋 Récupération des tickers actifs...');
    const tickers = await getAllActiveTickers();
    console.log(`✅ ${tickers.length} tickers actifs trouvés`);

    if (tickers.length === 0) {
      return {
        success: true,
        message: 'Aucun ticker actif à synchroniser',
        tickersProcessed: 0
      };
    }

    // 2. Appeler FMP en batch (quelques requêtes max)
    console.log('📡 Appel FMP pour quotes...');
    const quotes = await fetchFMPQuotes(tickers);
    console.log(`✅ ${quotes.length} quotes récupérées`);

    console.log('📡 Appel FMP pour ratios...');
    const ratios = await fetchFMPRatios(tickers);
    console.log(`✅ ${ratios.length} ratios récupérés`);

    // 3. Combiner quotes et ratios
    const combinedData = combineQuoteAndRatios(quotes, ratios);
    console.log(`✅ ${combinedData.length} données combinées`);

    // 4. Upsert massif dans ticker_market_cache (1 requête)
    console.log('💾 Upsert dans ticker_market_cache...');
    const { data, error } = await supabase.rpc('upsert_ticker_market_cache_batch', {
      p_data: combinedData
    });

    if (error) {
      throw new Error(`Erreur upsert: ${error.message}`);
    }

    const executionTime = Date.now() - startTime;

    console.log(`✅ Synchronisation PRIX terminée: ${priceData.length} tickers en ${executionTime}ms`);

    return {
      success: true,
      tickersProcessed: priceData.length,
      executionTimeMs: executionTime,
      dataType: 'prices_only', // Indique que seuls les prix ont été synchronisés
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Erreur synchronisation batch:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET' || req.method === 'POST') {
    const result = await syncAllTickers();
    return res.status(result.success ? 200 : 500).json(result);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

