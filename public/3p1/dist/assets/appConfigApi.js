const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./index.js","./index.css"])))=>i.map(i=>d[i]);
import { _ as __vitePreload } from "./index.js";
const API_BASE = typeof window !== "undefined" ? window.location.origin : "";
let configCache = null;
let configCacheTimestamp = 0;
let configCachePromise = null;
const CONFIG_CACHE_TTL_MS = 5 * 60 * 1e3;
const DEFAULT_CONFIG = {
  cache_max_age_ms: 3e5,
  cache_storage_key: "finance-pro-cache-v2",
  profile_batch_size: 50,
  api_batch_size: 10,
  sync_batch_size: 25,
  delay_between_batches_ms: 500,
  max_sync_time_ms: 3e5,
  ticker_timeout_ms: 1e4,
  snapshots_limit: 1500,
  tickers_limit: 1500,
  default_ticker: "AAPL",
  market_cap_small_min: 0,
  market_cap_small_max: 2e9,
  market_cap_mid_min: 2e9,
  market_cap_mid_max: 1e10,
  market_cap_large_min: 1e10,
  market_cap_large_max: 2e11,
  market_cap_mega_min: 2e11,
  recommendation_cache_max: 1e3,
  // Moderate defaults (balanced sector baseline)
  // Note: KPIDashboard.tsx applies sector-specific guardrails
  guardrail_growth_min: -18,
  guardrail_growth_max: 15,
  // Moderate: between value (10%) and growth (18%)
  guardrail_pe_min: 8,
  guardrail_pe_max: 30,
  // Moderate: between value (20x) and growth (40x)
  guardrail_pcf_min: 5,
  guardrail_pcf_max: 22,
  // Moderate: between value (15x) and growth (30x)
  guardrail_pbv_min: 0.8,
  guardrail_pbv_max: 5,
  guardrail_yield_min: 0.5,
  guardrail_yield_max: 8
};
async function loadAppConfig() {
  const now = Date.now();
  if (configCache && now - configCacheTimestamp < CONFIG_CACHE_TTL_MS) {
    return configCache;
  }
  if (configCachePromise) {
    return configCachePromise;
  }
  const isLocalhost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  configCachePromise = (async () => {
    try {
      let configData = [];
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
        console.warn("⚠️ API app-config failed:", apiError);
        if (isLocalhost) {
          console.log("🔄 Localhost - Chargement direct config depuis Supabase...");
          const { getSupabaseClient } = await __vitePreload(async () => {
            const { getSupabaseClient: getSupabaseClient2 } = await import("./index.js").then((n) => n.B);
            return { getSupabaseClient: getSupabaseClient2 };
          }, true ? __vite__mapDeps([0,1]) : void 0, import.meta.url);
          const supabase = getSupabaseClient();
          if (supabase) {
            const { data, error } = await supabase.from("app_config").select("config_key, config_value");
            if (!error && data) {
              configData = data;
              console.log(`✅ ${configData.length} configs chargées directement depuis Supabase`);
            }
          }
        }
      }
      if (configData.length === 0) {
        console.warn("⚠️ Aucune config trouvée, utilisation des valeurs par défaut");
        configCache = DEFAULT_CONFIG;
        configCacheTimestamp = now;
        return DEFAULT_CONFIG;
      }
      const config = {};
      configData.forEach((item) => {
        if (item.config_key && item.config_value !== void 0) {
          const key = item.config_key;
          if (typeof item.config_value === "string") {
            try {
              const parsed = JSON.parse(item.config_value);
              config[key] = typeof parsed === "number" ? parsed : parsed;
            } catch {
              config[key] = item.config_value;
            }
          } else {
            config[key] = item.config_value;
          }
        }
      });
      const finalConfig = { ...DEFAULT_CONFIG, ...config };
      configCache = finalConfig;
      configCacheTimestamp = now;
      console.log("✅ Configurations chargées depuis Supabase");
      return finalConfig;
    } catch (error) {
      console.error("❌ Erreur chargement configurations depuis Supabase:", error);
      configCache = DEFAULT_CONFIG;
      configCacheTimestamp = now;
      return DEFAULT_CONFIG;
    } finally {
      configCachePromise = null;
    }
  })();
  return configCachePromise;
}
async function getConfigValue(key) {
  const config = await loadAppConfig();
  return config[key];
}
export {
  getConfigValue,
  loadAppConfig
};
