/**
 * Performance monitoring and optimization utilities
 */

export interface PerformanceMetrics {
  renderTime: number
  dataFetchTime: number
  totalTime: number
  timestamp: string
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private maxEntries = 100

  markStart(label: string): number {
    return performance.now()
  }

  markEnd(label: string, startTime: number): number {
    const duration = performance.now() - startTime
    console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`)
    return duration
  }

  recordMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric)
    if (this.metrics.length > this.maxEntries) {
      this.metrics = this.metrics.slice(-this.maxEntries)
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics]
  }

  getAverageTime(key: keyof PerformanceMetrics): number {
    if (this.metrics.length === 0) return 0
    const values = this.metrics.map((m) => m[key] as number).filter((v) => typeof v === "number")
    return values.reduce((a, b) => a + b, 0) / values.length
  }

  logSummary() {
    console.log("[Performance Summary]", {
      avgRenderTime: this.getAverageTime("renderTime").toFixed(2),
      avgDataFetchTime: this.getAverageTime("dataFetchTime").toFixed(2),
      avgTotalTime: this.getAverageTime("totalTime").toFixed(2),
      metricsCount: this.metrics.length,
    })
  }

  clearMetrics() {
    this.metrics = []
  }
}

export const performanceMonitor = new PerformanceMonitor()

/**
 * Debounce function for expensive operations
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null

  return ((...args: any[]) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      func(...args)
      timeout = null
    }, wait)
  }) as T
}

/**
 * Throttle function for high-frequency events
 */
export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
  let inThrottle = false

  return ((...args: any[]) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }) as T
}

/**
 * Memoize expensive calculations
 */
export function memoize<T extends (...args: any[]) => any>(func: T): T {
  const cache = new Map<string, any>()

  return ((...args: any[]) => {
    const key = JSON.stringify(args)
    if (cache.has(key)) {
      return cache.get(key)
    }
    const result = func(...args)
    cache.set(key, result)
    return result
  }) as T
}
