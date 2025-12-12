/**
 * API Endpoint pour gérer les tickers dans Supabase (CRUD complet)
 * GET    /api/admin/tickers?source=team&is_active=true
 * POST   /api/admin/tickers (body: {ticker, company_name, sector, ...})
 * PUT    /api/admin/tickers/:id (body: {ticker, company_name, ...})
 * DELETE /api/admin/tickers/:id
 */

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  // Tolérance: certains environnements utilisent SUPABASE_KEY ou seulement l'ANON.
  // Pour cet endpoint "admin", on privilégie SERVICE_ROLE, puis fallback.
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ 
      success: false,
      error: 'Supabase configuration missing' 
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, supabase);
      case 'POST':
        return await handlePost(req, res, supabase);
      case 'PUT':
        return await handlePut(req, res, supabase);
      case 'DELETE':
        return await handleDelete(req, res, supabase);
      default:
        return res.status(405).json({ 
          success: false,
          error: 'Method not allowed' 
        });
    }
  } catch (error) {
    console.error('❌ Admin Tickers API Error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}

/**
 * GET - Récupérer les tickers avec filtres
 */
async function handleGet(req, res, supabase) {
  const { 
    source,           // 'team', 'watchlist', 'manual', 'both'
    is_active,        // 'true' ou 'false'
    limit = 1000,
    offset = 0,
    order_by = 'priority',
    order_direction = 'desc'
  } = req.query;

  // ✅ Compatibilité schéma: certaines DB ont `category`/`categories`, d'autres `source`.
  // On tente `category` d'abord, puis fallback sur `source` si colonne absente.
  const commonSelect =
    'id, ticker, company_name, sector, industry, country, exchange, currency, market_cap, priority, is_active, user_id, target_price, stop_loss, notes, security_rank, earnings_predictability, price_growth_persistence, price_stability, beta, valueline_updated_at, valueline_proj_low_return, valueline_proj_high_return, created_at, updated_at';

  const buildQueryUsingCategory = () => {
    let query = supabase
      .from('tickers')
      .select(`${commonSelect}, category, categories`, { count: 'exact' });

    if (source) {
      if (source === 'both') {
        query = query.or('category.eq.team,category.eq.both');
      } else {
        query = query.eq('category', source);
      }
    }

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    if (order_by) {
      query = query.order(order_by, { ascending: order_direction === 'asc' });
    }

    return query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
  };

  const buildQueryUsingSource = () => {
    let query = supabase
      .from('tickers')
      .select(`${commonSelect}, source`, { count: 'exact' });

    if (source) {
      if (source === 'both') {
        query = query.or('source.eq.team,source.eq.both');
      } else {
        query = query.eq('source', source);
      }
    }

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    if (order_by) {
      query = query.order(order_by, { ascending: order_direction === 'asc' });
    }

    return query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
  };

  let data = null;
  let count = 0;
  let error = null;

  // 1) Try `category` schema
  {
    const result = await buildQueryUsingCategory();
    data = result.data;
    count = result.count || 0;
    error = result.error;
  }

  // 2) Fallback to `source` schema if needed
  if (error && typeof error.message === 'string' && error.message.toLowerCase().includes('category')) {
    const result = await buildQueryUsingSource();
    data = result.data;
    count = result.count || 0;
    error = result.error;
  }

  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }

  // Normaliser: exposer toujours `source` pour les clients (ex: public/3p1) même si DB = category/cats
  const normalized = (data || []).map((row) => {
    const categories = Array.isArray(row.categories) ? row.categories : null;
    const derivedSource =
      row.source ||
      row.category ||
      (categories && categories.includes('team') && categories.includes('watchlist')
        ? 'both'
        : categories && categories.includes('watchlist')
          ? 'watchlist'
          : categories && categories.includes('team')
            ? 'team'
            : 'manual');
    return { ...row, source: derivedSource };
  });

  return res.status(200).json({
    success: true,
    tickers: normalized,
    count: count || 0,
    limit: parseInt(limit),
    offset: parseInt(offset),
    timestamp: new Date().toISOString()
  });
}

/**
 * POST - Créer un nouveau ticker
 */
async function handlePost(req, res, supabase) {
  const {
    ticker,
    company_name,
    sector,
    industry,
    country,
    exchange,
    currency = 'USD',
    market_cap,
    category = 'manual',
    categories = ['manual'],
    priority = 1,
    is_active = true,
    user_id,
    target_price,
    stop_loss,
    notes
  } = req.body;

  // Validation
  if (!ticker) {
    return res.status(400).json({ 
      success: false,
      error: 'Ticker is required' 
    });
  }

  // Validation format ticker
  const tickerUpper = ticker.toUpperCase().trim();
  if (!/^[A-Z]{1,5}(\.[A-Z]{1,3})?$/.test(tickerUpper)) {
    return res.status(400).json({ 
      success: false,
      error: 'Invalid ticker format (ex: AAPL, T.TO)' 
    });
  }

  // Vérifier si le ticker existe déjà
  const { data: existing, error: checkError } = await supabase
    .from('tickers')
    .select('id, ticker, source, category, categories')
    .eq('ticker', tickerUpper)
    .single();

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
    throw new Error(`Supabase error: ${checkError.message}`);
  }

  if (existing) {
    return res.status(409).json({ 
      success: false,
      error: `Ticker ${tickerUpper} already exists`,
      existing_ticker: existing
    });
  }

  // Créer le nouveau ticker
  const { data, error } = await supabase
    .from('tickers')
    .insert({
      ticker: tickerUpper,
      company_name: company_name || null,
      sector: sector || null,
      industry: industry || null,
      country: country || null,
      exchange: exchange || null,
      currency: currency,
      market_cap: market_cap || null,
      // Compatibilité: écrire `category`/`categories` (nouveau) et aussi `source` si la colonne existe
      category,
      categories,
      priority: parseInt(priority) || 1,
      is_active: is_active === true || is_active === 'true',
      user_id: user_id || null,
      target_price: target_price ? parseFloat(target_price) : null,
      stop_loss: stop_loss ? parseFloat(stop_loss) : null,
      notes: notes || null
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }

  return res.status(201).json({
    success: true,
    ticker: data,
    message: `Ticker ${tickerUpper} created successfully`
  });
}

/**
 * PUT - Mettre à jour un ticker existant
 */
async function handlePut(req, res, supabase) {
  const { id } = req.query; // ID du ticker à mettre à jour
  const updateData = req.body;

  if (!id) {
    return res.status(400).json({ 
      success: false,
      error: 'Ticker ID is required' 
    });
  }

  // Préparer les données de mise à jour (enlever les champs null/undefined)
  const cleanData = {};
  const allowedFields = [
    'ticker', 'company_name', 'sector', 'industry', 'country', 'exchange',
    'currency', 'market_cap', 'source', 'category', 'categories', 'priority', 'is_active', 'user_id',
    'target_price', 'stop_loss', 'notes', 'scraping_enabled'
  ];

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      if (field === 'ticker') {
        const tickerUpper = updateData[field].toUpperCase().trim();
        if (!/^[A-Z]{1,5}(\.[A-Z]{1,3})?$/.test(tickerUpper)) {
          return res.status(400).json({ 
            success: false,
            error: 'Invalid ticker format' 
          });
        }
        cleanData[field] = tickerUpper;
      } else if (field === 'priority') {
        cleanData[field] = parseInt(updateData[field]) || 1;
      } else if (field === 'is_active' || field === 'scraping_enabled') {
        cleanData[field] = updateData[field] === true || updateData[field] === 'true';
      } else if (field === 'target_price' || field === 'stop_loss') {
        cleanData[field] = updateData[field] ? parseFloat(updateData[field]) : null;
      } else {
        cleanData[field] = updateData[field] || null;
      }
    }
  }

  // Ajouter updated_at
  cleanData.updated_at = new Date().toISOString();

  // Mettre à jour
  const { data, error } = await supabase
    .from('tickers')
    .update(cleanData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }

  if (!data) {
    return res.status(404).json({ 
      success: false,
      error: 'Ticker not found' 
    });
  }

  return res.status(200).json({
    success: true,
    ticker: data,
    message: `Ticker updated successfully`
  });
}

/**
 * DELETE - Supprimer un ticker (ou le désactiver)
 */
async function handleDelete(req, res, supabase) {
  const { id, hard_delete = 'false' } = req.query;

  if (!id) {
    return res.status(400).json({ 
      success: false,
      error: 'Ticker ID is required' 
    });
  }

  // Vérifier si le ticker existe
  const { data: existing, error: checkError } = await supabase
    .from('tickers')
    .select('id, ticker, source')
    .eq('id', id)
    .single();

  if (checkError || !existing) {
    return res.status(404).json({ 
      success: false,
      error: 'Ticker not found' 
    });
  }

  // Si hard_delete = true, supprimer complètement
  if (hard_delete === 'true') {
    const { error } = await supabase
      .from('tickers')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    return res.status(200).json({
      success: true,
      message: `Ticker ${existing.ticker} deleted permanently`
    });
  }

  // Sinon, désactiver (soft delete)
  const { data, error } = await supabase
    .from('tickers')
    .update({ 
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }

  return res.status(200).json({
    success: true,
    ticker: data,
    message: `Ticker ${existing.ticker} deactivated successfully`
  });
}

