/**
 * API pour gérer les configurations de l'application
 * Remplace le hardcoding par des valeurs dynamiques depuis Supabase
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({
      success: false,
      error: 'Supabase configuration missing'
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
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
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
      console.error('Get config error:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch config' });
    }

    return res.status(200).json({
      success: true,
      count: data.length,
      data: data
    });
  } else {
    // Récupérer une configuration spécifique
    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('Get config error:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch config' });
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

  const configData = {
    config_key,
    config_category,
    config_value: typeof config_value === 'string' ? JSON.parse(config_value) : config_value,
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
    console.error('Set config error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save config',
      details: error.message
    });
  }

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
    console.error('Delete config error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete config',
      details: error.message
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Config disabled',
    data: data
  });
}
