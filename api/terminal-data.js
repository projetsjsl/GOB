/**
 * API Endpoint pour Terminal Emma IA
 * 
 * Expose les données Supabase pour le frontend :
 * - Instruments avec métriques
 * - KPI values
 * - Watchlists
 * - Indices de marché
 * - Historique des prix
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL et SUPABASE_KEY doivent être définis');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Récupère les instruments avec leurs dernières métriques
 */
async function getInstruments(filters = {}) {
  const {
    sector,
    country,
    limit = 100,
    offset = 0,
    search
  } = filters;

  let query = supabase
    .from('instruments')
    .select('*')
    .eq('is_active', true)
    .order('symbol', { ascending: true })
    .range(offset, offset + limit - 1);

  if (sector) {
    query = query.eq('sector', sector);
  }

  if (country) {
    query = query.eq('country', country);
  }

  if (search) {
    query = query.or(`symbol.ilike.%${search}%,name.ilike.%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erreur récupération instruments: ${error.message}`);
  }

  // Récupérer les dernières métriques pour chaque instrument
  if (data && data.length > 0) {
    const symbols = data.map(i => i.symbol);
    
    // Récupérer les dernières métriques clés
    const { data: metrics } = await supabase
      .from('metrics')
      .select('symbol, metric_code, value, as_of')
      .in('symbol', symbols)
      .in('metric_code', ['PRICE', 'DAILY_CHANGE_PCT', 'MARKET_CAP'])
      .order('as_of', { ascending: false });

    // Grouper les métriques par symbole
    const metricsBySymbol = {};
    (metrics || []).forEach(m => {
      if (!metricsBySymbol[m.symbol]) {
        metricsBySymbol[m.symbol] = {};
      }
      metricsBySymbol[m.symbol][m.metric_code] = m.value;
    });

    // Fusionner avec les instruments
    data.forEach(instrument => {
      instrument.metrics = metricsBySymbol[instrument.symbol] || {};
    });
  }

  return {
    data: data || [],
    count: count || 0,
    limit,
    offset
  };
}

/**
 * Récupère les valeurs de KPI pour des symboles
 */
async function getKPIValues(kpiCode, symbols, asOf = null) {
  // Récupérer la définition du KPI
  const { data: kpi } = await supabase
    .from('kpi_definitions')
    .select('id')
    .eq('code', kpiCode)
    .eq('is_active', true)
    .single();

  if (!kpi) {
    throw new Error(`KPI ${kpiCode} non trouvé`);
  }

  let query = supabase
    .from('kpi_values')
    .select('symbol, value, as_of, inputs_snapshot')
    .eq('kpi_id', kpi.id)
    .in('symbol', symbols);

  if (asOf) {
    query = query.lte('as_of', asOf);
  }

  const { data, error } = await query.order('as_of', { ascending: false });

  if (error) {
    throw new Error(`Erreur récupération KPI values: ${error.message}`);
  }

  // Retourner la valeur la plus récente pour chaque symbole
  const latest = {};
  const seen = new Set();

  (data || []).forEach(item => {
    if (!seen.has(item.symbol)) {
      latest[item.symbol] = {
        value: item.value,
        as_of: item.as_of,
        inputs: item.inputs_snapshot
      };
      seen.add(item.symbol);
    }
  });

  return latest;
}

/**
 * Récupère les watchlists d'un utilisateur
 */
async function getWatchlists(userId) {
  const { data, error } = await supabase
    .from('watchlists')
    .select(`
      *,
      watchlist_instruments (
        symbol,
        position,
        instruments (
          symbol,
          name,
          sector,
          industry
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Erreur récupération watchlists: ${error.message}`);
  }

  return data || [];
}

/**
 * Récupère les indices de marché
 */
async function getMarketIndices() {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('market_indices')
    .select('*')
    .eq('as_of', today)
    .order('symbol', { ascending: true });

  if (error) {
    throw new Error(`Erreur récupération indices: ${error.message}`);
  }

  return data || [];
}

/**
 * Récupère l'historique des prix pour un symbole
 */
async function getPriceHistory(symbol, days = 252) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('price_history')
    .select('*')
    .eq('symbol', symbol)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: true });

  if (error) {
    throw new Error(`Erreur récupération historique: ${error.message}`);
  }

  return data || [];
}

/**
 * Récupère les métriques pour un symbole
 */
async function getSymbolMetrics(symbol, metricCodes = null) {
  let query = supabase
    .from('metrics')
    .select('*')
    .eq('symbol', symbol)
    .order('as_of', { ascending: false })
    .order('metric_code', { ascending: true });

  if (metricCodes && Array.isArray(metricCodes)) {
    query = query.in('metric_code', metricCodes);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erreur récupération métriques: ${error.message}`);
  }

  // Grouper par metric_code et retourner la valeur la plus récente
  const latest = {};
  const seen = new Set();

  (data || []).forEach(metric => {
    const key = `${metric.metric_code}_${metric.period || 'DEFAULT'}`;
    if (!seen.has(key)) {
      latest[metric.metric_code] = {
        value: metric.value,
        as_of: metric.as_of,
        period: metric.period,
        meta: metric.meta
      };
      seen.add(key);
    }
  });

  return latest;
}

/**
 * Récupère les secteurs disponibles
 */
async function getSectors() {
  const { data, error } = await supabase
    .from('instruments')
    .select('sector')
    .not('sector', 'is', null)
    .eq('is_active', true);

  if (error) {
    throw new Error(`Erreur récupération secteurs: ${error.message}`);
  }

  const sectors = [...new Set((data || []).map(i => i.sector))].sort();
  return sectors;
}

/**
 * Handler principal
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
    const { action, ...params } = req.query || req.body || {};

    if (!action) {
      return res.status(400).json({ 
        error: 'action requis',
        availableActions: [
          'instruments',
          'kpi-values',
          'watchlists',
          'market-indices',
          'price-history',
          'symbol-metrics',
          'sectors'
        ]
      });
    }

    let result;

    switch (action) {
      case 'instruments':
        result = await getInstruments(params);
        break;

      case 'kpi-values':
        if (!params.kpi_code || !params.symbols) {
          return res.status(400).json({ 
            error: 'kpi_code et symbols requis' 
          });
        }
        const symbols = Array.isArray(params.symbols) 
          ? params.symbols 
          : params.symbols.split(',');
        result = await getKPIValues(params.kpi_code, symbols, params.as_of);
        break;

      case 'watchlists':
        if (!params.user_id) {
          return res.status(400).json({ error: 'user_id requis' });
        }
        result = await getWatchlists(params.user_id);
        break;

      case 'market-indices':
        result = await getMarketIndices();
        break;

      case 'price-history':
        if (!params.symbol) {
          return res.status(400).json({ error: 'symbol requis' });
        }
        result = await getPriceHistory(params.symbol, params.days);
        break;

      case 'symbol-metrics':
        if (!params.symbol) {
          return res.status(400).json({ error: 'symbol requis' });
        }
        const metricCodes = params.metric_codes 
          ? (Array.isArray(params.metric_codes) 
              ? params.metric_codes 
              : params.metric_codes.split(','))
          : null;
        result = await getSymbolMetrics(params.symbol, metricCodes);
        break;

      case 'sectors':
        result = await getSectors();
        break;

      default:
        return res.status(400).json({ 
          error: 'action invalide',
          availableActions: [
            'instruments',
            'kpi-values',
            'watchlists',
            'market-indices',
            'price-history',
            'symbol-metrics',
            'sectors'
          ]
        });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Erreur terminal-data:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

