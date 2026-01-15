/**
 * Service d'ingestion FMP Premier -> Supabase
 * 
 * Ce service synchronise les donnees FMP Premier vers Supabase :
 * - Instruments (liste des symboles)
 * - Donnees de marche (quotes, historiques)
 * - Fondamentaux (ratios, key metrics)
 * - Indicateurs techniques
 * 
 * Usage:
 * - Appele via cron (Vercel Cron ou Supabase Cron)
 * - Peut etre appele manuellement via POST /api/fmp-sync
 */

import { createClient } from '@supabase/supabase-js';

const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';
const FMP_API_KEY = process.env.FMP_API_KEY;

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL et SUPABASE_KEY doivent etre definis');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Log un job dans job_logs
 */
async function logJob(jobType, status, options = {}) {
  const {
    symbol,
    endpoint,
    recordsProcessed = 0,
    errorMessage,
    executionTimeMs,
    startedAt
  } = options;

  const logData = {
    job_type: jobType,
    status,
    symbol,
    endpoint,
    records_processed: recordsProcessed,
    error_message: errorMessage,
    execution_time_ms: executionTimeMs,
    started_at: startedAt || new Date().toISOString(),
    completed_at: new Date().toISOString()
  };

  await supabase.from('job_logs').insert(logData);
}

/**
 * Appel API FMP avec gestion d'erreurs
 */
async function callFMP(endpoint, params = {}) {
  if (!FMP_API_KEY) {
    throw new Error('FMP_API_KEY non configuree');
  }

  const url = new URL(`${FMP_BASE_URL}/${endpoint}`);
  url.searchParams.append('apikey', FMP_API_KEY);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`FMP API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Synchronise la liste des instruments (S&P 500, TSX, etc.)
 */
async function syncInstruments() {
  const startedAt = new Date();
  
  try {
    // Recuperer les symboles du S&P 500
    const sp500 = await callFMP('sp500_constituent');
    
    // Recuperer les symboles du TSX (si disponible)
    // Note: FMP peut avoir des endpoints differents pour TSX
    let tsx = [];
    try {
      tsx = await callFMP('tsx_constituent') || [];
    } catch (e) {
      console.warn('TSX constituent non disponible:', e.message);
    }

    const allSymbols = [...sp500, ...tsx];
    
    // Inserer/mettre a jour les instruments
    const instruments = allSymbols.map(item => ({
      symbol: item.symbol,
      name: item.name,
      exchange: item.exchange || null,
      country: item.country || (item.exchange?.includes('TSX') ? 'CA' : 'US'),
      currency: item.currency || 'USD',
      sector: item.sector || null,
      industry: item.industry || null,
      is_active: true
    }));

    // Upsert en batch
    const { error } = await supabase
      .from('instruments')
      .upsert(instruments, { onConflict: 'symbol' });

    if (error) throw error;

    const executionTime = Date.now() - startedAt.getTime();
    await logJob('fmp_sync', 'success', {
      endpoint: 'instruments',
      recordsProcessed: instruments.length,
      executionTimeMs: executionTime,
      startedAt: startedAt.toISOString()
    });

    return { success: true, count: instruments.length };
  } catch (error) {
    const executionTime = Date.now() - startedAt.getTime();
    await logJob('fmp_sync', 'error', {
      endpoint: 'instruments',
      errorMessage: error.message,
      executionTimeMs: executionTime,
      startedAt: startedAt.toISOString()
    });
    throw error;
  }
}

/**
 * Synchronise les quotes (prix actuels) pour un symbole
 */
async function syncQuote(symbol) {
  const startedAt = new Date();
  
  try {
    const [quote] = await callFMP('quote', { symbol });
    
    if (!quote) {
      throw new Error(`Pas de quote pour ${symbol}`);
    }

    // Mettre a jour l'instrument avec les dernieres donnees
    await supabase
      .from('instruments')
      .update({
        market_cap: quote.marketCap || null,
        updated_at: new Date().toISOString()
      })
      .eq('symbol', symbol);

    // Stocker dans le cache brut
    await supabase
      .from('fmp_raw_cache')
      .upsert({
        symbol,
        endpoint: 'quote',
        payload: quote,
        as_of: new Date().toISOString().split('T')[0],
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h
      }, { onConflict: 'symbol,endpoint,as_of' });

    // Extraire et stocker les metriques
    const metrics = [];
    const today = new Date().toISOString().split('T')[0];

    if (quote.price) {
      metrics.push({
        symbol,
        metric_code: 'PRICE',
        value: quote.price,
        as_of: today,
        period: 'DAILY'
      });
    }

    if (quote.changePercent) {
      metrics.push({
        symbol,
        metric_code: 'DAILY_CHANGE_PCT',
        value: quote.changePercent,
        as_of: today,
        period: 'DAILY'
      });
    }

    if (quote.marketCap) {
      metrics.push({
        symbol,
        metric_code: 'MARKET_CAP',
        value: quote.marketCap,
        as_of: today,
        period: 'DAILY'
      });
    }

    if (metrics.length > 0) {
      await supabase
        .from('metrics')
        .upsert(metrics, { onConflict: 'symbol,metric_code,as_of,period' });
    }

    const executionTime = Date.now() - startedAt.getTime();
    await logJob('fmp_sync', 'success', {
      symbol,
      endpoint: 'quote',
      recordsProcessed: 1,
      executionTimeMs: executionTime,
      startedAt: startedAt.toISOString()
    });

    return { success: true, symbol };
  } catch (error) {
    const executionTime = Date.now() - startedAt.getTime();
    await logJob('fmp_sync', 'error', {
      symbol,
      endpoint: 'quote',
      errorMessage: error.message,
      executionTimeMs: executionTime,
      startedAt: startedAt.getTime()
    });
    throw error;
  }
}

/**
 * Synchronise l'historique des prix (OHLC daily)
 */
async function syncPriceHistory(symbol, limit = 252) {
  const startedAt = new Date();
  
  try {
    const history = await callFMP('historical-price-full', { 
      symbol,
      timeseries: limit 
    });

    if (!history || !history.historical) {
      throw new Error(`Pas d'historique pour ${symbol}`);
    }

    // Transformer les donnees
    const priceData = history.historical.map(day => ({
      symbol,
      date: day.date,
      open: day.open,
      high: day.high,
      low: day.low,
      close: day.close,
      volume: day.volume,
      adjusted_close: day.adjClose || day.close
    }));

    // Upsert en batch
    const { error } = await supabase
      .from('price_history')
      .upsert(priceData, { onConflict: 'symbol,date' });

    if (error) throw error;

    // Stocker dans le cache brut
    await supabase
      .from('fmp_raw_cache')
      .upsert({
        symbol,
        endpoint: 'historical-price-full',
        payload: history,
        as_of: new Date().toISOString().split('T')[0],
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 jours
      }, { onConflict: 'symbol,endpoint,as_of' });

    const executionTime = Date.now() - startedAt.getTime();
    await logJob('fmp_sync', 'success', {
      symbol,
      endpoint: 'historical-price-full',
      recordsProcessed: priceData.length,
      executionTimeMs: executionTime,
      startedAt: startedAt.toISOString()
    });

    return { success: true, symbol, count: priceData.length };
  } catch (error) {
    const executionTime = Date.now() - startedAt.getTime();
    await logJob('fmp_sync', 'error', {
      symbol,
      endpoint: 'historical-price-full',
      errorMessage: error.message,
      executionTimeMs: executionTime,
      startedAt: startedAt.toISOString()
    });
    throw error;
  }
}

/**
 * Synchronise les ratios et key metrics (fondamentaux)
 */
async function syncFundamentals(symbol) {
  const startedAt = new Date();
  
  try {
    // Recuperer key metrics TTM
    const [keyMetrics] = await callFMP('key-metrics-ttm', { symbol });
    
    // Recuperer les ratios
    const [ratios] = await callFMP('ratios-ttm', { symbol });

    const today = new Date().toISOString().split('T')[0];
    const metrics = [];

    // Extraire les metriques de key-metrics-ttm
    if (keyMetrics) {
      const metricMappings = {
        roicTTM: 'ROIC_TTM',
        roeTTM: 'ROE_TTM',
        netProfitMarginTTM: 'NET_MARGIN_TTM',
        operatingMarginTTM: 'OPERATING_MARGIN_TTM',
        freeCashFlowPerShareTTM: 'FCF_PER_SHARE_TTM',
        priceToFreeCashFlowsRatioTTM: 'P_FCF_TTM',
        enterpriseValueOverEBITDA: 'EV_EBITDA_TTM',
        priceToBookRatio: 'P_B_TTM',
        priceToSalesRatioTTM: 'P_S_TTM',
        peRatioTTM: 'P_E_TTM'
      };

      Object.entries(metricMappings).forEach(([fmpKey, metricCode]) => {
        if (keyMetrics[fmpKey] !== undefined && keyMetrics[fmpKey] !== null) {
          metrics.push({
            symbol,
            metric_code: metricCode,
            value: keyMetrics[fmpKey],
            as_of: today,
            period: 'TTM'
          });
        }
      });
    }

    // Extraire les metriques de ratios-ttm
    if (ratios) {
      const ratioMappings = {
        currentRatio: 'CURRENT_RATIO_TTM',
        quickRatio: 'QUICK_RATIO_TTM',
        debtToEquity: 'DEBT_TO_EQUITY_TTM',
        returnOnAssets: 'ROA_TTM',
        returnOnEquity: 'ROE_TTM'
      };

      Object.entries(ratioMappings).forEach(([fmpKey, metricCode]) => {
        if (ratios[fmpKey] !== undefined && ratios[fmpKey] !== null) {
          // Eviter les doublons (ROE peut etre dans les deux)
          if (!metrics.find(m => m.metric_code === metricCode)) {
            metrics.push({
              symbol,
              metric_code: metricCode,
              value: ratios[fmpKey],
              as_of: today,
              period: 'TTM'
            });
          }
        }
      });
    }

    // Stocker dans le cache brut
    if (keyMetrics) {
      await supabase
        .from('fmp_raw_cache')
        .upsert({
          symbol,
          endpoint: 'key-metrics-ttm',
          payload: keyMetrics,
          as_of: today,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }, { onConflict: 'symbol,endpoint,as_of' });
    }

    if (ratios) {
      await supabase
        .from('fmp_raw_cache')
        .upsert({
          symbol,
          endpoint: 'ratios-ttm',
          payload: ratios,
          as_of: today,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }, { onConflict: 'symbol,endpoint,as_of' });
    }

    // Inserer les metriques
    if (metrics.length > 0) {
      await supabase
        .from('metrics')
        .upsert(metrics, { onConflict: 'symbol,metric_code,as_of,period' });
    }

    const executionTime = Date.now() - startedAt.getTime();
    await logJob('fmp_sync', 'success', {
      symbol,
      endpoint: 'fundamentals',
      recordsProcessed: metrics.length,
      executionTimeMs: executionTime,
      startedAt: startedAt.toISOString()
    });

    return { success: true, symbol, count: metrics.length };
  } catch (error) {
    const executionTime = Date.now() - startedAt.getTime();
    await logJob('fmp_sync', 'error', {
      symbol,
      endpoint: 'fundamentals',
      errorMessage: error.message,
      executionTimeMs: executionTime,
      startedAt: startedAt.toISOString()
    });
    throw error;
  }
}

/**
 * Synchronise les indices de marche
 */
async function syncMarketIndices() {
  const startedAt = new Date();
  
  try {
    const indices = [
      { symbol: '^GSPC', name: 'S&P 500', country: 'US' },
      { symbol: '^DJI', name: 'Dow Jones', country: 'US' },
      { symbol: '^IXIC', name: 'NASDAQ', country: 'US' },
      { symbol: '^GSPTSE', name: 'TSX', country: 'CA' }
    ];

    const today = new Date().toISOString().split('T')[0];
    const results = [];

    for (const index of indices) {
      try {
        const [quote] = await callFMP('quote', { symbol: index.symbol });
        
        if (quote) {
          await supabase
            .from('market_indices')
            .upsert({
              symbol: index.symbol,
              name: index.name,
              country: index.country,
              currency: 'USD',
              current_value: quote.price,
              daily_change: quote.change,
              daily_change_pct: quote.changePercent,
              ytd_change_pct: quote.yearHigh ? ((quote.price - quote.yearLow) / quote.yearLow) * 100 : null,
              as_of: today
            }, { onConflict: 'symbol,as_of' });

          results.push({ symbol: index.symbol, success: true });
        }
      } catch (e) {
        console.warn(`Erreur pour ${index.symbol}:`, e.message);
        results.push({ symbol: index.symbol, success: false, error: e.message });
      }
    }

    const executionTime = Date.now() - startedAt.getTime();
    await logJob('fmp_sync', 'success', {
      endpoint: 'market_indices',
      recordsProcessed: results.length,
      executionTimeMs: executionTime,
      startedAt: startedAt.toISOString()
    });

    return { success: true, results };
  } catch (error) {
    const executionTime = Date.now() - startedAt.getTime();
    await logJob('fmp_sync', 'error', {
      endpoint: 'market_indices',
      errorMessage: error.message,
      executionTimeMs: executionTime,
      startedAt: startedAt.toISOString()
    });
    throw error;
  }
}

/**
 * Handler principal pour l'API
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action, symbol, limit } = req.query || req.body || {};

    if (!action) {
      return res.status(400).json({ 
        error: 'action requis',
        availableActions: [
          'sync-instruments',
          'sync-quote',
          'sync-history',
          'sync-fundamentals',
          'sync-indices',
          'sync-all'
        ],
        example: 'POST /api/fmp-sync avec body: { "action": "sync-quote", "symbol": "AAPL" }'
      });
    }

    let result;

    switch (action) {
      case 'sync-instruments':
        result = await syncInstruments();
        break;

      case 'sync-quote':
        if (!symbol) {
          return res.status(400).json({ error: 'symbol requis' });
        }
        result = await syncQuote(symbol);
        break;

      case 'sync-history':
        if (!symbol) {
          return res.status(400).json({ error: 'symbol requis' });
        }
        result = await syncPriceHistory(symbol, limit ? parseInt(limit) : 252);
        break;

      case 'sync-fundamentals':
        if (!symbol) {
          return res.status(400).json({ error: 'symbol requis' });
        }
        result = await syncFundamentals(symbol);
        break;

      case 'sync-indices':
        result = await syncMarketIndices();
        break;

      case 'sync-all':
        // Synchronisation complete pour un symbole
        if (!symbol) {
          return res.status(400).json({ error: 'symbol requis pour sync-all' });
        }
        await syncQuote(symbol);
        await syncPriceHistory(symbol);
        await syncFundamentals(symbol);
        result = { success: true, symbol, message: 'Synchronisation complete terminee' };
        break;

      default:
        return res.status(400).json({ 
          error: 'action invalide',
          availableActions: [
            'sync-instruments',
            'sync-quote',
            'sync-history',
            'sync-fundamentals',
            'sync-indices',
            'sync-all'
          ]
        });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Erreur FMP sync:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

