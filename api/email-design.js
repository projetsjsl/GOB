/**
 * API Email Design Configuration - Persiste dans Supabase
 *
 * GET  -> Recupere la config actuelle
 * POST -> Met a jour la config
 *
 * Stockage: Supabase table `emma_config` (cle: 'email_design')
 * Persiste entre les deploiements Vercel 
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

const CONFIG_KEY = 'email_design';

// Config par defaut si rien en base
const DEFAULT_CONFIG = {
  branding: {
    avatar: { url: '', alt: 'Emma IA', size: 64 },
    logo: { url: '', alt: 'JSLai', width: 150 },
    companyName: 'GOB Apps',
    tagline: 'Intelligence Financiere Propulsee par Emma IA'
  },
  colors: {
    primary: '#6366f1',
    primaryDark: '#4f46e5',
    primaryLight: '#8b5cf6',
    textDark: '#1f2937',
    textMuted: '#6b7280'
  },
  header: {
    showAvatar: true,
    showDate: true,
    showEdition: true
  },
  footer: {
    showLogo: true,
    showDisclaimer: true,
    disclaimerText: 'Ce briefing est genere automatiquement par Emma IA a des fins informatives uniquement.',
    copyrightText: ' 2025 GOB Apps - Tous droits reserves'
  },
  sms: {
    maxSegments: 10,
    warningThreshold: 5,
    signature: '- Emma IA',
    keepSectionEmojis: true,
    showSegmentWarning: true
  }
};

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) {
    console.error('[Email Design API] Missing Supabase credentials');
    return null;
  }
  return createClient(supabaseUrl, supabaseKey);
}

async function loadConfig() {
  const supabase = getSupabase();
  if (!supabase) return DEFAULT_CONFIG;

  try {
    const { data, error } = await supabase
      .from('emma_config')
      .select('value, updated_at, updated_by')
      .eq('key', CONFIG_KEY)
      .single();

    if (error) {
      console.log('[Email Design API] No config in DB, using defaults');
      return DEFAULT_CONFIG;
    }

    return {
      ...data.value,
      _meta: {
        updatedAt: data.updated_at,
        updatedBy: data.updated_by,
        source: 'supabase'
      }
    };
  } catch (error) {
    console.error('[Email Design API] Error loading config:', error);
    return DEFAULT_CONFIG;
  }
}

async function saveConfig(config, updatedBy = 'emma-config') {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    // Remove meta fields before saving
    const { _meta, ...configToSave } = config;

    const { data, error } = await supabase
      .from('emma_config')
      .upsert({
        key: CONFIG_KEY,
        value: configToSave,
        description: 'Configuration design des emails et SMS',
        updated_by: updatedBy
      }, { onConflict: 'key' })
      .select()
      .single();

    if (error) {
      console.error('[Email Design API] Save error:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      config: {
        ...data.value,
        _meta: {
          updatedAt: data.updated_at,
          updatedBy: data.updated_by,
          source: 'supabase'
        }
      }
    };
  } catch (error) {
    console.error('[Email Design API] Save exception:', error);
    return { success: false, error: error.message };
  }
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET - Recuperer la config
  if (req.method === 'GET') {
    const config = await loadConfig();
    return res.status(200).json(config);
  }

  // POST - Mettre a jour la config
  if (req.method === 'POST') {
    try {
      const updates = req.body;

      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({ error: 'Invalid request body' });
      }

      const currentConfig = await loadConfig();

      // Deep merge updates with current config
      const mergedConfig = deepMerge(currentConfig, updates);

      const result = await saveConfig(mergedConfig, updates.updatedBy || 'emma-config');

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: 'Configuration sauvegardee dans Supabase ',
          config: result.config
        });
      } else {
        return res.status(500).json({ error: result.error });
      }
    } catch (error) {
      console.error('[Email Design API] Error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// Deep merge helper
function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (key === '_meta') continue; // Skip meta fields
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
