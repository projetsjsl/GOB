/**
 * Service pour charger les configurations depuis Supabase
 * Remplace le hardcoding par des valeurs dynamiques depuis Supabase
 */

const API_BASE = typeof window !== 'undefined' ? window.location.origin : '';

export interface AppConfig {
  cache_max_age_ms: number;
  cache_storage_key: string;
  profile_batch_size: number;
  api_batch_size: number;
  sync_batch_size: number;
  delay_between_batches_ms: number;
  max_sync_time_ms: number;
  ticker_timeout_ms: number;
  snapshots_limit: number;
  tickers_limit: number;
  default_ticker: string;
  market_cap_small_min: number;
  market_cap_small_max: number;
  market_cap_mid_min: number;
  market_cap_mid_max: number;
  market_cap_large_min: number;
  market_cap_large_max: number;
  market_cap_mega_min: number;
  recommendation_cache_max: number;
  guardrail_growth_min: number;
  guardrail_growth_max: number;
  guardrail_pe_min: number;
  guardrail_pe_max: number;
  guardrail_pcf_min: number;
  guardrail_pcf_max: number;
  guardrail_pbv_min: number;
  guardrail_pbv_max: number;
  guardrail_yield_min: number;
  guardrail_yield_max: number;
}

// Cache pour éviter les appels répétés
let configCache: AppConfig | null = null;
let configCacheTimestamp: number = 0;
const CONFIG_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Charge toutes les configurations depuis Supabase
 */
export async function loadAppConfig(): Promise<AppConfig> {
  // Vérifier le cache
  const now = Date.now();
  if (configCache && (now - configCacheTimestamp) < CONFIG_CACHE_TTL_MS) {
    return configCache;
  }

  try {
    const response = await fetch(`${API_BASE}/api/app-config?all=true`);

    if (!response.ok) {
      console.warn('⚠️ Impossible de charger les configurations depuis Supabase, utilisation des valeurs par défaut');
      return getDefaultConfig();
    }

    const result = await response.json();

    if (!result.success || !result.data) {
      console.warn('⚠️ Format de réponse invalide, utilisation des valeurs par défaut');
      return getDefaultConfig();
    }

    // Convertir les configurations JSONB en objet typé
    const config: Partial<AppConfig> = {};
    
    result.data.forEach((item: any) => {
      if (item.config_key && item.config_value !== undefined) {
        const key = item.config_key as keyof AppConfig;
        // Convertir les valeurs JSONB en types appropriés
        if (typeof item.config_value === 'string') {
          // Si c'est une chaîne JSON, parser
          try {
            const parsed = JSON.parse(item.config_value);
            (config as any)[key] = typeof parsed === 'number' ? parsed : parsed;
          } catch {
            // Si ce n'est pas du JSON, utiliser directement
            (config as any)[key] = item.config_value;
          }
        } else {
          (config as any)[key] = item.config_value;
        }
      }
    });

    // Merger avec les valeurs par défaut pour s'assurer que toutes les clés sont présentes
    const finalConfig = { ...getDefaultConfig(), ...config } as AppConfig;

    // Mettre en cache
    configCache = finalConfig;
    configCacheTimestamp = now;

    console.log('✅ Configurations chargées depuis Supabase');
    return finalConfig;
  } catch (error: any) {
    console.warn('⚠️ Erreur chargement configurations depuis Supabase:', error);
    return getDefaultConfig();
  }
}

/**
 * Valeurs par défaut (fallback si Supabase n'est pas disponible)
 */
function getDefaultConfig(): AppConfig {
  return {
    cache_max_age_ms: 5 * 60 * 1000, // 5 minutes
    cache_storage_key: 'finance_pro_profiles',
    profile_batch_size: 5,
    api_batch_size: 20,
    sync_batch_size: 50,
    delay_between_batches_ms: 2000, // 2 secondes
    max_sync_time_ms: 30 * 60 * 1000, // 30 minutes
    ticker_timeout_ms: 60000, // 60 secondes
    snapshots_limit: 2000,
    tickers_limit: 1000,
    default_ticker: 'ACN',
    market_cap_small_min: 300000000, // 300M
    market_cap_small_max: 2000000000, // 2B
    market_cap_mid_min: 2000000000, // 2B
    market_cap_mid_max: 10000000000, // 10B
    market_cap_large_min: 10000000000, // 10B
    market_cap_large_max: 200000000000, // 200B
    market_cap_mega_min: 200000000000, // 200B+
    recommendation_cache_max: 1000,
    guardrail_growth_min: -50,
    guardrail_growth_max: 50,
    guardrail_pe_min: 1,
    guardrail_pe_max: 100,
    guardrail_pcf_min: 1,
    guardrail_pcf_max: 100,
    guardrail_pbv_min: 0.5,
    guardrail_pbv_max: 50,
    guardrail_yield_min: 0.1,
    guardrail_yield_max: 20
  };
}

/**
 * Invalide le cache des configurations
 */
export function invalidateAppConfigCache() {
  configCache = null;
  configCacheTimestamp = 0;
}

/**
 * Charge une configuration spécifique
 */
export async function getConfigValue<K extends keyof AppConfig>(key: K): Promise<AppConfig[K]> {
  const config = await loadAppConfig();
  return config[key];
}
