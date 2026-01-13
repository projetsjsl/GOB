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

const REQUIRED_CONFIG_KEYS: Array<keyof AppConfig> = [
  'cache_max_age_ms',
  'cache_storage_key',
  'profile_batch_size',
  'api_batch_size',
  'sync_batch_size',
  'delay_between_batches_ms',
  'max_sync_time_ms',
  'ticker_timeout_ms',
  'snapshots_limit',
  'tickers_limit',
  'default_ticker',
  'market_cap_small_min',
  'market_cap_small_max',
  'market_cap_mid_min',
  'market_cap_mid_max',
  'market_cap_large_min',
  'market_cap_large_max',
  'market_cap_mega_min',
  'recommendation_cache_max',
  'guardrail_growth_min',
  'guardrail_growth_max',
  'guardrail_pe_min',
  'guardrail_pe_max',
  'guardrail_pcf_min',
  'guardrail_pcf_max',
  'guardrail_pbv_min',
  'guardrail_pbv_max',
  'guardrail_yield_min',
  'guardrail_yield_max'
];

// Cache pour éviter les appels répétés
let configCache: AppConfig | null = null;
let configCacheTimestamp: number = 0;
let configCachePromise: Promise<AppConfig> | null = null;
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

  if (configCachePromise) {
    return configCachePromise;
  }

  configCachePromise = (async () => {
    try {
      const response = await fetch(`${API_BASE}/api/app-config?all=true`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (!result.success || !Array.isArray(result.data)) {
        throw new Error('Invalid config response format');
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

      const missingKeys = REQUIRED_CONFIG_KEYS.filter((key) => typeof config[key] === 'undefined');
      if (missingKeys.length > 0) {
        throw new Error(`Missing config keys: ${missingKeys.join(', ')}`);
      }

      const finalConfig = config as AppConfig;

      // Mettre en cache
      configCache = finalConfig;
      configCacheTimestamp = now;

      console.log('✅ Configurations chargées depuis Supabase');
      return finalConfig;
    } catch (error: any) {
      console.error('❌ Erreur chargement configurations depuis Supabase:', error);
      throw error;
    } finally {
      configCachePromise = null;
    }
  })();

  return configCachePromise;
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
