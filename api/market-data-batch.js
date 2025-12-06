/**
 * API Endpoint pour récupérer les données de marché depuis ticker_market_cache
 * 
 * GET /api/market-data-batch?tickers=AAPL,MSFT,GOOGL
 * 
 * Retourne les données depuis le cache (si fraîches) ou fetch FMP si expiré
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
 * Récupère les données depuis ticker_market_cache
 */
async function getCachedMarketData(tickers) {
  const tickersUpper = tickers.map(t => t.toUpperCase());
  
  const { data, error } = await supabase
    .from('ticker_market_cache')
    .select('ticker, current_price, change_percent, change_amount, volume, market_cap, pe_ratio, pcf_ratio, pbv_ratio, dividend_yield, updated_at, expires_at')
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

    // Récupérer depuis le cache
    const cachedData = await getCachedMarketData(tickerList);

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
        peRatio: d.pe_ratio,
        pcfRatio: d.pcf_ratio,
        pbvRatio: d.pbv_ratio,
        dividendYield: d.dividend_yield,
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

