/**
 * API pour gérer les configurations de l'application
 * Remplace le hardcoding par des valeurs dynamiques depuis Supabase
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  console.log('[app-config] Request received', {
    method: req.method,
    query: req.query,
    timestamp: new Date().toISOString()
  });

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('[app-config] Supabase configuration missing', {
      hasUrl: !!SUPABASE_URL,
      hasKey: !!SUPABASE_KEY,
      envKeys: Object.keys(process.env).filter((key) => key.includes('SUPABASE'))
    });
    return res.status(500).json({
      success: false,
      error: 'Supabase configuration missing',
      debug: process.env.NODE_ENV !== 'production' ? {
        hasUrl: !!SUPABASE_URL,
        hasKey: !!SUPABASE_KEY
      } : undefined
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    if (req.method === 'GET') {
      return await getConfig(req, res, supabase);
    } else if (req.method === 'POST' || req.method === 'PUT') {
      return await setConfig(req, res, supabase);
    } else if (req.method === 'DELETE') {
      return await deleteConfig(req, res, supabase);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('❌ App config API error:', error);
    console.error('[app-config] Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
    });
  }
}

/**
 * GET - Récupérer les configurations
 */
async function getConfig(req, res, supabase) {
  const { key, category, all } = req.query;

  let query = supabase
    .from('app_config')
    .select('*')
    .eq('is_active', true);

  if (key) {
    query = query.eq('config_key', key);
  }

  if (category) {
    query = query.eq('config_category', category);
  }

  if (all === 'true') {
    // Récupérer toutes les configurations actives
    const { data, error } = await query.order('config_category', { ascending: true });

    if (error) {
      console.error('[app-config] Get config error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch config',
        details: error.message,
        code: error.code
      });
    }

    console.log('[app-config] Loaded configs', { count: data.length });
    return res.status(200).json({
      success: true,
      count: data.length,
      data: data
    });
  } else {
    // Récupérer une configuration spécifique
    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('[app-config] Get config error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch config',
        details: error.message,
        code: error.code
      });
    }

    if (!data) {
      return res.status(404).json({ success: false, error: 'Config not found' });
    }

    return res.status(200).json({
      success: true,
      data: data
    });
  }
}

/**
 * POST/PUT - Créer ou mettre à jour une configuration
 */
async function setConfig(req, res, supabase) {
  const { config_key, config_category, config_value, description, is_active } = req.body;

  if (!config_key || !config_category || config_value === undefined) {
    return res.status(400).json({
      success: false,
      error: 'config_key, config_category, and config_value are required'
    });
  }

  let parsedConfigValue = config_value;
  if (typeof config_value === 'string') {
    try {
      parsedConfigValue = JSON.parse(config_value);
    } catch (parseError) {
      console.warn('[app-config] Failed to parse config_value JSON, using raw string', {
        config_key
      });
      parsedConfigValue = config_value;
    }
  }

  const configData = {
    config_key,
    config_category,
    config_value: parsedConfigValue,
    description: description || null,
    is_active: is_active !== undefined ? is_active : true,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('app_config')
    .upsert(configData, {
      onConflict: 'config_key',
      ignoreDuplicates: false
    })
    .select()
    .single();

  if (error) {
    console.error('[app-config] Set config error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save config',
      details: error.message,
      code: error.code
    });
  }

  console.log('[app-config] Config saved', { config_key });
  return res.status(200).json({
    success: true,
    data: data
  });
}

/**
 * DELETE - Supprimer une configuration (désactiver)
 */
async function deleteConfig(req, res, supabase) {
  const { key } = req.query;

  if (!key) {
    return res.status(400).json({
      success: false,
      error: 'key parameter is required'
    });
  }

  // Désactiver au lieu de supprimer
  const { data, error } = await supabase
    .from('app_config')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('config_key', key)
    .select()
    .single();

  if (error) {
    console.error('[app-config] Delete config error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete config',
      details: error.message,
      code: error.code
    });
  }

  console.log('[app-config] Config disabled', { key });
  return res.status(200).json({
    success: true,
    message: 'Config disabled',
    data: data
  });
}
