const API_BASE = typeof window !== "undefined" ? window.location.origin : "";
const REQUIRED_CONFIG_KEYS = [
  "cache_max_age_ms",
  "cache_storage_key",
  "profile_batch_size",
  "api_batch_size",
  "sync_batch_size",
  "delay_between_batches_ms",
  "max_sync_time_ms",
  "ticker_timeout_ms",
  "snapshots_limit",
  "tickers_limit",
  "default_ticker",
  "market_cap_small_min",
  "market_cap_small_max",
  "market_cap_mid_min",
  "market_cap_mid_max",
  "market_cap_large_min",
  "market_cap_large_max",
  "market_cap_mega_min",
  "recommendation_cache_max",
  "guardrail_growth_min",
  "guardrail_growth_max",
  "guardrail_pe_min",
  "guardrail_pe_max",
  "guardrail_pcf_min",
  "guardrail_pcf_max",
  "guardrail_pbv_min",
  "guardrail_pbv_max",
  "guardrail_yield_min",
  "guardrail_yield_max"
];
let configCache = null;
let configCacheTimestamp = 0;
let configCachePromise = null;
const CONFIG_CACHE_TTL_MS = 5 * 60 * 1e3;
async function loadAppConfig() {
  const now = Date.now();
  if (configCache && now - configCacheTimestamp < CONFIG_CACHE_TTL_MS) {
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
        throw new Error("Invalid config response format");
      }
      const config = {};
      result.data.forEach((item) => {
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
      const missingKeys = REQUIRED_CONFIG_KEYS.filter((key) => typeof config[key] === "undefined");
      if (missingKeys.length > 0) {
        throw new Error(`Missing config keys: ${missingKeys.join(", ")}`);
      }
      const finalConfig = config;
      configCache = finalConfig;
      configCacheTimestamp = now;
      console.log("✅ Configurations chargées depuis Supabase");
      return finalConfig;
    } catch (error) {
      console.error("❌ Erreur chargement configurations depuis Supabase:", error);
      throw error;
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
