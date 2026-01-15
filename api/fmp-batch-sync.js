/**
 * Job Batch pour synchroniser UNIQUEMENT LES PRIX FMP vers ticker_price_cache
 * 
 *  IMPORTANT : Ce job synchronise UNIQUEMENT les PRIX (pas les ratios/metriques)
 * Les donnees fondamentales (ratios, metriques) sont recuperees a la demande dans 3p1
 * 
 * Ce job :
 * 1. Recupere tous les tickers actifs depuis Supabase (1 requete)
 * 2. Appelle FMP quotes en batch (PRIX UNIQUEMENT - pas de ratios)
 * 3. Upsert massif dans ticker_price_cache (1 requete)
 * 
 * Frequence : UNIQUEMENT quand necessaire (beta-dashboard ouvert, 3p1 prix)
 * - Option 1 : Cron toutes les 5-15 min (si beta-dashboard toujours ouvert)
 * - Option 2 : Appel manuel depuis le frontend quand necessaire
 * 
 * Usage:
 * - Appel manuel : POST /api/fmp-batch-sync (recommande - a la demande)
 * - Cron optionnel : every 15 min (toutes les 15 min si necessaire)
 */

import { createClient } from '@supabase/supabase-js';

const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';
const FMP_API_KEY = process.env.FMP_API_KEY;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Lazy initialization of Supabase client
let supabase = null;
function getSupabaseClient() {
  if (!supabase && supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

/**
 * Recupere tous les tickers actifs depuis Supabase
 */
async function getAllActiveTickers() {
  const sb = getSupabaseClient();
  if (!sb) {
    throw new Error('Supabase n\'est pas initialise (variables d\'environnement manquantes)');
  }

  const { data, error } = await sb
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
 * Appelle FMP pour recuperer UNIQUEMENT les quotes (prix, volume, etc.)
 *  PAS de ratios/metriques - seulement les prix pour reduire l'egress
 * FMP accepte jusqu'a 100 symboles par requete
 */
async function fetchFMPQuotes(symbols) {
  // FMP limite a 100 symboles par requete
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
        console.error(` FMP Error pour batch ${batch[0]}-${batch[batch.length-1]}: ${response.status}`);
        continue;
      }

      const quotes = await response.json();
      
      if (Array.isArray(quotes)) {
        allQuotes.push(...quotes);
      } else if (quotes && quotes.symbol) {
        // Si un seul resultat, FMP retourne un objet au lieu d'un array
        allQuotes.push(quotes);
      }

      // Rate limiting : 300 req/min pour FMP free tier
      // On fait ~20 req/min max pour etre safe
      if (batches.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3s entre batches
      }
    } catch (error) {
      console.error(` Erreur fetch FMP batch:`, error);
      continue;
    }
  }

  return allQuotes;
}

/**
 *  SUPPRIME : fetchFMPRatios et combineQuoteAndRatios
 * On synchronise UNIQUEMENT les prix, pas les ratios/metriques
 * Les ratios sont recuperes a la demande dans 3p1 quand necessaire
 */

/**
 * Synchronise tous les tickers actifs depuis FMP vers ticker_market_cache
 */
async function syncAllTickers() {
  const startTime = Date.now();
  console.log(' Demarrage synchronisation batch FMP...');

  try {
    // 1. Recuperer tous les tickers actifs (1 requete Supabase)
    console.log(' Recuperation des tickers actifs...');
    const tickers = await getAllActiveTickers();
    console.log(` ${tickers.length} tickers actifs trouves`);

    if (tickers.length === 0) {
      return {
        success: true,
        message: 'Aucun ticker actif a synchroniser',
        tickersProcessed: 0
      };
    }

    // 2. Appeler FMP en batch (quelques requetes max)
    // 2. Appeler FMP UNIQUEMENT pour les quotes (prix) - PAS de ratios
    console.log(' Appel FMP pour quotes (PRIX UNIQUEMENT)...');
    const quotes = await fetchFMPQuotes(tickers);
    console.log(` ${quotes.length} quotes recuperees`);

    // 3. Formater les donnees (PRIX UNIQUEMENT - pas de ratios)
    const priceData = quotes.map(quote => {
      // Convert to integers for bigint columns and validate
      const volume = Number.isFinite(quote.volume) ? Math.round(quote.volume) : 0;
      const marketCap = Number.isFinite(quote.marketCap) ? Math.round(quote.marketCap) : 0;
      
      return {
        symbol: quote.symbol?.toUpperCase(),
        price: Number.isFinite(quote.price) ? quote.price : 0,
        change: Number.isFinite(quote.change) ? quote.change : 0,
        changePercent: Number.isFinite(quote.changesPercentage) ? quote.changesPercentage : 0,
        volume: Math.abs(volume) > Number.MAX_SAFE_INTEGER ? 0 : volume,
        marketCap: Math.abs(marketCap) > Number.MAX_SAFE_INTEGER ? 0 : marketCap
      };
    });

    // 4. Upsert en batch dans ticker_price_cache - PRIX UNIQUEMENT
    console.log(' Upsert dans ticker_price_cache (PRIX UNIQUEMENT) par lots...');
    
    const sb = getSupabaseClient();
    if (!sb) {
      throw new Error('Supabase n\'est pas initialise');
    }

    // Taille du lot pour l'upsert Supabase
    const UPSERT_BATCH_SIZE = 100;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < priceData.length; i += UPSERT_BATCH_SIZE) {
      const batch = priceData.slice(i, i + UPSERT_BATCH_SIZE);
      
      const { error } = await sb.rpc('upsert_ticker_price_cache_batch', {
        p_data: batch
      });

      if (error) {
        console.error(` Erreur upsert batch ${i}-${i + batch.length}:`, error.message);
        failCount += batch.length;
      } else {
        successCount += batch.length;
      }
    }

    if (failCount > 0 && successCount === 0) {
      throw new Error(`Tous les lots d'upsert ont echoue. Ex: ${failCount} echecs.`);
    }

    const executionTime = Date.now() - startTime;

    console.log(` Synchronisation PRIX terminee: ${priceData.length} tickers en ${executionTime}ms`);

    return {
      success: true,
      tickersProcessed: priceData.length,
      executionTimeMs: executionTime,
      dataType: 'prices_only', // Indique que seuls les prix ont ete synchronises
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error(' Erreur synchronisation batch:', error);
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
    if (!process.env.FMP_API_KEY) {
       return res.status(500).json({ success: false, error: 'FMP_API_KEY manquante' });
    }
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
       return res.status(500).json({ success: false, error: 'Configuration Supabase manquante' });
    }

    const result = await syncAllTickers();
    return res.status(result.success ? 200 : 500).json(result);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

