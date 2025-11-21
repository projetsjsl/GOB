/**
 * Design Config Helper
 *
 * Charge la config design depuis Supabase pour les emails/SMS
 * À utiliser par email-templates.js et channel-adapter.js
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

// Cache pour éviter trop de requêtes DB
let cachedConfig = null;
let cacheTime = 0;
const CACHE_TTL = 60000; // 1 minute

const DEFAULT_CONFIG = {
  branding: {
    avatar: { url: '', alt: 'Emma IA', size: 64 },
    logo: { url: '', alt: 'JSLai', width: 150 },
    companyName: 'GOB Apps',
    tagline: 'Intelligence Financière Propulsée par Emma IA'
  },
  colors: {
    primary: '#6366f1',
    primaryDark: '#4f46e5',
    primaryLight: '#8b5cf6',
    textDark: '#1f2937',
    textMuted: '#6b7280',
    background: '#f8fafc'
  },
  header: {
    showAvatar: true,
    showDate: true,
    showEdition: true
  },
  footer: {
    showLogo: true,
    showDisclaimer: true,
    disclaimerText: 'Ce briefing est généré automatiquement par Emma IA à des fins informatives uniquement.',
    copyrightText: '© 2025 GOB Apps - Tous droits réservés'
  },
  sms: {
    maxSegments: 10,
    warningThreshold: 5,
    signature: '- Emma IA',
    keepSectionEmojis: true,
    showSegmentWarning: true
  }
};

/**
 * Charge la config design depuis Supabase (avec cache)
 */
export async function getDesignConfig() {
  // Check cache
  if (cachedConfig && (Date.now() - cacheTime < CACHE_TTL)) {
    return cachedConfig;
  }

  if (!supabaseUrl || !supabaseKey) {
    console.log('[Design Config] No Supabase credentials, using defaults');
    return DEFAULT_CONFIG;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('emma_config')
      .select('value')
      .eq('key', 'email_design')
      .single();

    if (error || !data) {
      console.log('[Design Config] No config in DB, using defaults');
      return DEFAULT_CONFIG;
    }

    // Merge with defaults to ensure all fields exist
    cachedConfig = deepMerge(DEFAULT_CONFIG, data.value);
    cacheTime = Date.now();

    return cachedConfig;
  } catch (error) {
    console.error('[Design Config] Error:', error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Récupère juste les couleurs (pour compatibilité avec theme-colors.js)
 */
export async function getColors() {
  const config = await getDesignConfig();
  return {
    primary: config.colors.primary,
    primaryDark: config.colors.primaryDark,
    primaryLight: config.colors.primaryLight,
    text: {
      dark: config.colors.textDark,
      medium: config.colors.textMuted,
      light: '#9ca3af'
    },
    background: {
      white: '#ffffff',
      light: config.colors.background || '#f8fafc'
    }
  };
}

/**
 * Récupère la config SMS
 */
export async function getSmsConfig() {
  const config = await getDesignConfig();
  return config.sms;
}

/**
 * Invalide le cache (après une modification)
 */
export function invalidateCache() {
  cachedConfig = null;
  cacheTime = 0;
}

// Deep merge helper
function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  return result;
}

export default { getDesignConfig, getColors, getSmsConfig, invalidateCache };
