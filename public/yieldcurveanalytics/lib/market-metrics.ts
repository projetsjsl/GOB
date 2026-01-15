/**
 * Calcul des metriques de marche avancees
 */

import type { YieldDataPoint } from "./fred-api"

/**
 * Interface pour les metriques de marche
 */
export interface MarketMetrics {
  // Spreads
  spread2Y10Y: number // Points de base
  spread5Y30Y: number
  spread1Y5Y: number
  spread10Y30Y: number

  // Pentes et courbes
  slopeShort: number // 1Y-5Y
  slopeMedium: number // 5Y-10Y
  slopeLong: number // 10Y-30Y

  // Statistiques
  averageYield: number
  medianYield: number
  stdDeviation: number
  yieldRange: { min: number; max: number }

  // Volatilite
  dayOverDayChange: number
  percentageChange: number

  // Convexite
  convexity: number

  // Duration
  effectiveDuration: number
}

/**
 * Calculer tous les spreads
 */
export function calculateSpreads(points: YieldDataPoint[]): Partial<MarketMetrics> {
  const getYield = (maturity: string) => points.find((p) => p.maturity === maturity)?.yield || 0

  return {
    spread2Y10Y: (getYield("10Y") - getYield("2Y")) * 100,
    spread5Y30Y: (getYield("30Y") - getYield("5Y")) * 100,
    spread1Y5Y: (getYield("5Y") - getYield("1Y")) * 100,
    spread10Y30Y: (getYield("30Y") - getYield("10Y")) * 100,
  }
}

/**
 * Calculer les pentes (slopes)
 */
export function calculateSlopes(points: YieldDataPoint[]): Partial<MarketMetrics> {
  const getYield = (maturity: string) => points.find((p) => p.maturity === maturity)?.yield || 0

  return {
    slopeShort: getYield("5Y") - getYield("1Y"),
    slopeMedium: getYield("10Y") - getYield("5Y"),
    slopeLong: getYield("30Y") - getYield("10Y"),
  }
}

/**
 * Calculer les statistiques
 */
export function calculateStatistics(points: YieldDataPoint[]): Partial<MarketMetrics> {
  const yields = points.map((p) => p.yield)
  const sorted = [...yields].sort((a, b) => a - b)

  const average = yields.reduce((a, b) => a + b, 0) / yields.length
  const median =
    yields.length % 2 === 0
      ? (sorted[yields.length / 2 - 1] + sorted[yields.length / 2]) / 2
      : sorted[Math.floor(yields.length / 2)]

  const variance = yields.reduce((sum, y) => sum + Math.pow(y - average, 2), 0) / yields.length
  const stdDev = Math.sqrt(variance)

  return {
    averageYield: average,
    medianYield: median,
    stdDeviation: stdDev,
    yieldRange: {
      min: Math.min(...yields),
      max: Math.max(...yields),
    },
  }
}

/**
 * Calculer la convexite (curvature)
 */
export function calculateConvexity(points: YieldDataPoint[]): number {
  if (points.length < 3) return 0

  const sorted = [...points].sort((a, b) => a.days - b.days)
  let sumCurvature = 0
  let count = 0

  for (let i = 1; i < sorted.length - 1; i++) {
    const prev = sorted[i - 1]
    const current = sorted[i]
    const next = sorted[i + 1]

    const curvature = (next.yield + prev.yield) / 2 - current.yield
    sumCurvature += curvature
    count++
  }

  return count > 0 ? sumCurvature / count : 0
}

/**
 * Calculer la duree effective
 */
export function calculateEffectiveDuration(points: YieldDataPoint[]): number {
  if (points.length < 2) return 0

  // Simplified duration calculation
  const shortRate = points.find((p) => p.maturity === "1Y")?.yield || 0
  const longRate = points.find((p) => p.maturity === "10Y")?.yield || 0
  const avgRate = (shortRate + longRate) / 2

  return Math.abs(longRate - shortRate) / (avgRate > 0 ? avgRate : 1)
}

/**
 * Calculer toutes les metriques
 */
export function calculateAllMarketMetrics(
  currentPoints: YieldDataPoint[],
  previousPoints?: YieldDataPoint[],
): MarketMetrics {
  const spreads = calculateSpreads(currentPoints)
  const slopes = calculateSlopes(currentPoints)
  const statistics = calculateStatistics(currentPoints)
  const convexity = calculateConvexity(currentPoints)
  const duration = calculateEffectiveDuration(currentPoints)

  let dayOverDayChange = 0
  let percentageChange = 0

  if (previousPoints) {
    const currentAvg = statistics.averageYield || 0
    const previousAvg = calculateStatistics(previousPoints).averageYield || currentAvg
    dayOverDayChange = currentAvg - previousAvg
    percentageChange = previousAvg !== 0 ? (dayOverDayChange / previousAvg) * 100 : 0
  }

  return {
    ...spreads,
    ...slopes,
    ...statistics,
    convexity,
    effectiveDuration: duration,
    dayOverDayChange,
    percentageChange,
  } as MarketMetrics
}
