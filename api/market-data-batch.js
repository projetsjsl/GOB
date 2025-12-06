/**
 * API Endpoint pour récupérer UNIQUEMENT LES PRIX depuis ticker_price_cache
 * 
 * GET /api/market-data-batch?tickers=AAPL,MSFT,GOOGL
 * 
 * ⚠️ IMPORTANT : Retourne UNIQUEMENT les prix (pas les ratios/métriques)
 * Les ratios sont récupérés à la demande dans 3p1 via /api/fmp-company-data
 * 
 * Optimisation : 1 requête pour N tickers au lieu de N requêtes individuelles
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Récupère UNIQUEMENT LES PRIX depuis ticker_price_cache
 */
async function getCachedPriceData(tickers) {
  const tickersUpper = tickers.map(t => t.toUpperCase());
  
  const { data, error } = await supabase
    .from('ticker_price_cache')
    .select('ticker, current_price, change_percent, change_amount, volume, market_cap, updated_at, expires_at')
    .in('ticker', tickersUpper);

  if (error) {
    throw new Error(`Erreur Supabase: ${error.message}`);
  }

  return data || [];
}

/**
 * Vérifie quelles données sont fraîches (non expirées)
 */
function filterFreshData(cachedData) {
  const now = new Date();
  return {
    fresh: cachedData.filter(d => new Date(d.expires_at) > now),
    stale: cachedData.filter(d => new Date(d.expires_at) <= now),
    missing: []
  };
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tickers } = req.query;

  if (!tickers) {
    return res.status(400).json({ 
      error: 'Parameter "tickers" required (comma-separated list)' 
    });
  }

  try {
    // Parser les tickers
    const tickerList = tickers.split(',').map(t => t.trim()).filter(t => t.length > 0);

    if (tickerList.length === 0) {
      return res.status(400).json({ error: 'No valid tickers provided' });
    }

    // Limiter à 100 tickers par requête (pour éviter les timeouts)
    if (tickerList.length > 100) {
      return res.status(400).json({ 
        error: 'Maximum 100 tickers per request. Please split into multiple requests.' 
      });
    }

    // Récupérer UNIQUEMENT LES PRIX depuis le cache
    const cachedData = await getCachedPriceData(tickerList);

    // Identifier les données fraîches, stale et manquantes
    const { fresh, stale } = filterFreshData(cachedData);
    const cachedTickers = new Set(cachedData.map(d => d.ticker));
    const missing = tickerList.filter(t => !cachedTickers.has(t.toUpperCase()));

    // Formater la réponse
    const result = {
      success: true,
      data: cachedData.map(d => ({
        ticker: d.ticker,
        currentPrice: d.current_price,
        changePercent: d.change_percent,
        changeAmount: d.change_amount,
        volume: d.volume,
        marketCap: d.market_cap,
        // ⚠️ PAS de ratios ici - récupérés à la demande dans 3p1
        updatedAt: d.updated_at,
        isFresh: new Date(d.expires_at) > new Date()
      })),
      stats: {
        total: tickerList.length,
        fresh: fresh.length,
        stale: stale.length,
        missing: missing.length
      },
      missingTickers: missing,
      staleTickers: stale.map(d => d.ticker),
      timestamp: new Date().toISOString()
    };

    // Si des données sont stale ou manquantes, suggérer de déclencher le batch sync
    if (stale.length > 0 || missing.length > 0) {
      result.warning = `${stale.length} stale, ${missing.length} missing. Consider triggering /api/fmp-batch-sync`;
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Erreur market-data-batch:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

