// Exporte les fonctions et types pour utilisation dans Babel inline

export const COUNTRY_COLORS: Record<string, string> = {
  US: "#3b82f6",
  CA: "#ef4444",
}

export const HISTORICAL_COLORS = ["#06b6d4", "#84cc16", "#a855f7", "#ec4899", "#f97316"]

export const getThemeColors = (isDark: boolean) => ({
  background: isDark ? "#1a1a2e" : "#ffffff",
  cardBg: isDark ? "#16213e" : "#f8f9fa",
  text: isDark ? "#e0e0e0" : "#333333",
  textMuted: isDark ? "#888888" : "#666666",
  border: isDark ? "#2d3748" : "#e2e8f0",
  grid: isDark ? "#2d3748" : "#e2e8f0",
  usLine: "#3b82f6",
  canadaLine: "#ef4444",
  spreadPositive: "#22c55e",
  spreadNegative: "#ef4444",
  tooltip: isDark ? "#1e293b" : "#ffffff",
})

// Constantes definies AVANT les states
export const PERIODS = ["1w", "1m", "3m", "6m", "1y", "5y"]
export const MATURITIES = ["1M", "3M", "6M", "1Y", "2Y", "3Y", "5Y", "7Y", "10Y", "20Y", "30Y"]
export const VIEWS = ["curves", "spread", "compare"] as const

export const DEFAULT_SPREAD_THRESHOLD = 50 // basis points
export const ANIMATION_DURATION = 300 // ms
export const API_RETRY_ATTEMPTS = 3
export const API_TIMEOUT_MS = 5000

export class DataCache {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private ttl = 60000 // 1 minute en millisecondes

  set(key: string, data: any) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  get(key: string) {
    const entry = this.cache.get(key)
    if (!entry) return null

    const isExpired = Date.now() - entry.timestamp > this.ttl
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  clear() {
    this.cache.clear()
  }

  clearKey(key: string) {
    this.cache.delete(key)
  }
}

export const yieldDataCache = new DataCache()
