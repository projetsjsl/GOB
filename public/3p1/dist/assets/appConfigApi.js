const API_BASE = typeof window !== "undefined" ? window.location.origin : "";
let configCache = null;
let configCacheTimestamp = 0;
const CONFIG_CACHE_TTL_MS = 5 * 60 * 1e3;
async function loadAppConfig() {
  const now = Date.now();
  if (configCache && now - configCacheTimestamp < CONFIG_CACHE_TTL_MS) {
    return configCache;
  }
  try {
    const response = await fetch(`${API_BASE}/api/app-config?all=true`);
    if (!response.ok) {
      console.warn("⚠️ Impossible de charger les configurations depuis Supabase, utilisation des valeurs par défaut");
      return getDefaultConfig();
    }
    const result = await response.json();
    if (!result.success || !result.data) {
      console.warn("⚠️ Format de réponse invalide, utilisation des valeurs par défaut");
      return getDefaultConfig();
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
    const finalConfig = { ...getDefaultConfig(), ...config };
    configCache = finalConfig;
    configCacheTimestamp = now;
    console.log("✅ Configurations chargées depuis Supabase");
    return finalConfig;
  } catch (error) {
    console.warn("⚠️ Erreur chargement configurations depuis Supabase:", error);
    return getDefaultConfig();
  }
}
function getDefaultConfig() {
  return {
    cache_max_age_ms: 5 * 60 * 1e3,
    // 5 minutes
    cache_storage_key: "finance_pro_profiles",
    profile_batch_size: 5,
    api_batch_size: 20,
    sync_batch_size: 50,
    delay_between_batches_ms: 2e3,
    // 2 secondes
    max_sync_time_ms: 30 * 60 * 1e3,
    // 30 minutes
    ticker_timeout_ms: 6e4,
    // 60 secondes
    snapshots_limit: 2e3,
    tickers_limit: 1e3,
    default_ticker: "ACN",
    market_cap_small_min: 3e8,
    // 300M
    market_cap_small_max: 2e9,
    // 2B
    market_cap_mid_min: 2e9,
    // 2B
    market_cap_mid_max: 1e10,
    // 10B
    market_cap_large_min: 1e10,
    // 10B
    market_cap_large_max: 2e11,
    // 200B
    market_cap_mega_min: 2e11,
    // 200B+
    recommendation_cache_max: 1e3,
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
async function getConfigValue(key) {
  const config = await loadAppConfig();
  return config[key];
}
export {
  getConfigValue,
  loadAppConfig
};
