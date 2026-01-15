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

// Cache pour eviter les appels repetes
let configCache: AppConfig | null = null;
let configCacheTimestamp: number = 0;
let configCachePromise: Promise<AppConfig> | null = null;
const CONFIG_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Valeurs par defaut en cas d'echec de chargement
const DEFAULT_CONFIG: AppConfig = {
  cache_max_age_ms: 300000,
  cache_storage_key: 'finance-pro-cache-v2',
  profile_batch_size: 50,
  api_batch_size: 10,
  sync_batch_size: 25,
  delay_between_batches_ms: 500,
  max_sync_time_ms: 300000,
  ticker_timeout_ms: 10000,
  snapshots_limit: 1500,
  tickers_limit: 1500,
  default_ticker: 'AAPL',
  market_cap_small_min: 0,
  market_cap_small_max: 2000000000,
  market_cap_mid_min: 2000000000,
  market_cap_mid_max: 10000000000,
  market_cap_large_min: 10000000000,
  market_cap_large_max: 200000000000,
  market_cap_mega_min: 200000000000,
  recommendation_cache_max: 1000,
  // Moderate defaults (balanced sector baseline)
  // Note: KPIDashboard.tsx applies sector-specific guardrails
  guardrail_growth_min: -18,
  guardrail_growth_max: 15,   // Moderate: between value (10%) and growth (18%)
  guardrail_pe_min: 8,
  guardrail_pe_max: 30,       // Moderate: between value (20x) and growth (40x)
  guardrail_pcf_min: 5,
  guardrail_pcf_max: 22,      // Moderate: between value (15x) and growth (30x)
  guardrail_pbv_min: 0.8,
  guardrail_pbv_max: 5,
  guardrail_yield_min: 0.5,
  guardrail_yield_max: 8
};

/**
 * Charge toutes les configurations depuis Supabase
 */
export async function loadAppConfig(): Promise<AppConfig> {
  // Verifier le cache
  const now = Date.now();
  if (configCache && (now - configCacheTimestamp) < CONFIG_CACHE_TTL_MS) {
    return configCache;
  }

  if (configCachePromise) {
    return configCachePromise;
  }

  const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  configCachePromise = (async () => {
    try {
      let configData: any[] = [];

      //  ESSAI 1: API route
      try {
        const response = await fetch(`${API_BASE}/api/app-config?all=true`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && Array.isArray(result.data)) {
            configData = result.data;
          }
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (apiError) {
        console.warn(' API app-config failed:', apiError);

        //  ESSAI 2: Localhost - chargement direct Supabase
        if (isLocalhost) {
          console.log(' Localhost - Chargement direct config depuis Supabase...');
          const { getSupabaseClient } = await import('./supabase');
          const supabase = getSupabaseClient();

          if (supabase) {
            const { data, error } = await supabase
              .from('app_config')
              .select('config_key, config_value');

            if (!error && data) {
              configData = data;
              console.log(` ${configData.length} configs chargees directement depuis Supabase`);
            }
          }
        }
      }

      // Si aucune donnee, utiliser les valeurs par defaut
      if (configData.length === 0) {
        console.warn(' Aucune config trouvee, utilisation des valeurs par defaut');
        configCache = DEFAULT_CONFIG;
        configCacheTimestamp = now;
        return DEFAULT_CONFIG;
      }

      // Convertir les configurations JSONB en objet type
      const config: Partial<AppConfig> = {};

      configData.forEach((item: any) => {
        if (item.config_key && item.config_value !== undefined) {
          const key = item.config_key as keyof AppConfig;
          // Convertir les valeurs JSONB en types appropries
          if (typeof item.config_value === 'string') {
            // Si c'est une chaine JSON, parser
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

      // Completer avec les valeurs par defaut si necessaire
      const finalConfig = { ...DEFAULT_CONFIG, ...config } as AppConfig;

      // Mettre en cache
      configCache = finalConfig;
      configCacheTimestamp = now;

      console.log(' Configurations chargees depuis Supabase');
      return finalConfig;
    } catch (error: any) {
      console.error(' Erreur chargement configurations depuis Supabase:', error);
      // Retourner les valeurs par defaut en cas d'erreur
      configCache = DEFAULT_CONFIG;
      configCacheTimestamp = now;
      return DEFAULT_CONFIG;
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
 * Charge une configuration specifique
 */
export async function getConfigValue<K extends keyof AppConfig>(key: K): Promise<AppConfig[K]> {
  const config = await loadAppConfig();
  return config[key];
}
