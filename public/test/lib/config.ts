/**
 * Configuration centralisee pour CurveWatch
 */

// Determiner l'environnement
const isDevelopment = typeof process !== "undefined" && process.env.NODE_ENV === "development"
const isProduction = typeof process !== "undefined" && process.env.NODE_ENV === "production"

export const CONFIG = {
  // Application
  APP_NAME: "CurveWatch",
  APP_VERSION: "1.0.0",
  ENVIRONMENT: isDevelopment ? "development" : isProduction ? "production" : "unknown",

  // API Configuration
  API: {
    FRED_BASE_URL: "https://api.stlouisfed.org/fred",
    BOC_BASE_URL: "https://www.bankofcanada.ca/valet",
    TIMEOUT_MS: 5000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY_MS: 500,
  },

  // Cache Configuration
  CACHE: {
    TTL_MS: 60000, // 1 minute
    MAX_ENTRIES: 200,
  },

  // UI Configuration
  UI: {
    ANIMATION_DURATION_MS: 300,
    CHART_HEIGHT_PX: 400,
    MAX_HISTORICAL_DATES: 5,
    DEFAULT_SPAN: 3, // col-span
  },

  // Data Configuration
  DATA: {
    DEFAULT_SPREAD_BASIS_POINTS: 50,
    MIN_YIELD: 0,
    MAX_YIELD: 20,
    MATURITIES: ["1M", "3M", "6M", "1Y", "2Y", "3Y", "5Y", "7Y", "10Y", "20Y", "30Y"],
    HISTORICAL_COLORS: ["#06b6d4", "#84cc16", "#a855f7", "#ec4899", "#f97316"],
  },

  // Theme Configuration
  THEME: {
    DARK_BG: "#1a1a2e",
    LIGHT_BG: "#ffffff",
    US_COLOR: "#3b82f6",
    CA_COLOR: "#ef4444",
  },

  // Feature Flags
  FEATURES: {
    ENABLE_RECHARTS: true,
    ENABLE_CACHING: true,
    ENABLE_LOGGING: isDevelopment,
    ENABLE_PCA_ANALYSIS: true,
  },
}

/**
 * Obtenir une valeur de configuration avec fallback
 */
export function getConfig<T>(path: string, fallback: T): T {
  const parts = path.split(".")
  let current: any = CONFIG

  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part]
    } else {
      return fallback
    }
  }

  return current as T
}

export default CONFIG
