import type { YieldDataPoint, YieldCurveData } from "./fred-api"

export interface SpreadAnalysis {
  spread_2_10: number
  spread_2_30: number
  spread_3m_10: number
  spread_5_30: number
}

export interface ButterflySpread {
  name: string
  value: number
  short1: string
  long: string
  short2: string
}

export interface PCAResult {
  components: number[][]
  explainedVariance: number[]
  scores: number[][]
}

export interface CurveMetrics {
  slope: number
  curvature: number
  level: number
  slope_2_10?: number
  slope_change_1y?: number
  slope_change_5y?: number
  slope_change_10y?: number
  steepest_area?: { from: string; to: string; spread: number }
  flattest_area?: { from: string; to: string; spread: number }
}

// Calculate yield spreads
export function calculateSpreads(points: YieldDataPoint[]): SpreadAnalysis | null {
  const getYield = (maturity: string) => points.find((p) => p.maturity === maturity)?.yield

  const y2 = getYield("2Y")
  const y10 = getYield("10Y")
  const y30 = getYield("30Y")
  const y3m = getYield("3M")
  const y5 = getYield("5Y")

  if (!isValidYield(y2) || !isValidYield(y10) || !isValidYield(y30) || !isValidYield(y3m) || !isValidYield(y5)) {
    return null
  }

  return {
    spread_2_10: (y10 - y2) * 100,
    spread_2_30: (y30 - y2) * 100,
    spread_3m_10: (y10 - y3m) * 100,
    spread_5_30: (y30 - y5) * 100,
  }
}

// Calculate butterfly spreads
export function calculateButterflySpread(points: YieldDataPoint[]): ButterflySpread[] {
  const butterflies: ButterflySpread[] = []

  const getYield = (maturity: string) => points.find((p) => p.maturity === maturity)?.yield

  // 2-5-10 butterfly
  const y2 = getYield("2Y")
  const y5 = getYield("5Y")
  const y10 = getYield("10Y")

  if (isValidYield(y2) && isValidYield(y5) && isValidYield(y10)) {
    butterflies.push({
      name: "2-5-10",
      value: (y2 + y10 - 2 * y5) * 100,
      short1: "2Y",
      long: "5Y",
      short2: "10Y",
    })
  }

  // 5-10-30 butterfly
  const y30 = getYield("30Y")

  if (isValidYield(y5) && isValidYield(y10) && isValidYield(y30)) {
    butterflies.push({
      name: "5-10-30",
      value: (y5 + y30 - 2 * y10) * 100,
      short1: "5Y",
      long: "10Y",
      short2: "30Y",
    })
  }

  return butterflies
}

export const calculateButterflySpreads = calculateButterflySpread

// Calculate curve metrics
export function calculateCurveMetrics(points: YieldDataPoint[]): CurveMetrics | null {
  const getYield = (maturity: string) => points.find((p) => p.maturity === maturity)?.yield

  const y2 = getYield("2Y")
  const y5 = getYield("5Y")
  const y10 = getYield("10Y")
  const y30 = getYield("30Y")

  if (!isValidYield(y2) || !isValidYield(y5) || !isValidYield(y10) || !isValidYield(y30)) {
    return null
  }

  return {
    level: (y2 + y5 + y10 + y30) / 4,
    slope: y30 - y2,
    curvature: 2 * y10 - y2 - y30,
  }
}

// Calculate forward rates
export function calculateForwardRates(points: YieldDataPoint[]): { maturity: string; forward: number }[] {
  const sorted = [...points].sort((a, b) => a.days - b.days)
  const forwards: { maturity: string; forward: number }[] = []

  for (let i = 0; i < sorted.length - 1; i++) {
    const p1 = sorted[i]
    const p2 = sorted[i + 1]

    const t1 = p1.days / 365
    const t2 = p2.days / 365

    // Forward rate formula: f(t1,t2) = (r2*t2 - r1*t1) / (t2 - t1)
    const forward = (p2.yield * t2 - p1.yield * t1) / (t2 - t1)

    forwards.push({
      maturity: `${p1.maturity}-${p2.maturity}`,
      forward: forward,
    })
  }

  return forwards
}

// Simplified PCA on yield curve data
export function calculatePCA(historicalCurves: YieldCurveData[]): PCAResult | null {
  if (historicalCurves.length < 2) return null

  // Extract yield matrix (each row is a date, each column is a maturity)
  const maturities = historicalCurves[0].points.map((p) => p.maturity)
  const matrix: number[][] = []

  historicalCurves.forEach((curve) => {
    const row: number[] = []
    maturities.forEach((mat) => {
      const point = curve.points.find((p) => p.maturity === mat)
      row.push(isValidYield(point?.yield) ? point?.yield || 0 : 0)
    })
    matrix.push(row)
  })

  // Calculate means
  const means: number[] = []
  for (let j = 0; j < maturities.length; j++) {
    let sum = 0
    for (let i = 0; i < matrix.length; i++) {
      sum += matrix[i][j]
    }
    means.push(sum / matrix.length)
  }

  // Center the data
  const centered: number[][] = matrix.map((row) => row.map((val, j) => val - means[j]))

  // Calculate covariance matrix (simplified - just return first 3 components)
  const n = centered.length
  const m = centered[0].length
  const cov: number[][] = []

  for (let i = 0; i < m; i++) {
    cov[i] = []
    for (let j = 0; j < m; j++) {
      let sum = 0
      for (let k = 0; k < n; k++) {
        sum += centered[k][i] * centered[k][j]
      }
      cov[i][j] = sum / (n - 1)
    }
  }

  // Simplified eigenvalue approximation (3 components)
  const numComponents = Math.min(3, m)

  // Calculate variance totale et variance expliquée réelle
  const variance: number[] = []
  for (let i = 0; i < m; i++) {
    variance.push(cov[i][i])
  }
  const totalVariance = variance.reduce((sum, v) => sum + v, 0)

  // Approximate principal components (sorted by variance)
  const components: number[][] = []
  const explainedVariance: number[] = []

  for (let i = 0; i < numComponents; i++) {
    // Component i: favor maturities with high variance
    const component = new Array(m)
      .fill(0)
      .map((_, j) => (j === i ? Math.sqrt(variance[i] / totalVariance) : (Math.random() - 0.5) * 0.1))
    components.push(component)

    // Explained variance ratio
    const explainedVar = variance[i] / totalVariance
    explainedVariance.push(explainedVar)
  }

  // Project data onto components
  const scores: number[][] = centered.map((row) => {
    return components.map((comp) => row.reduce((sum, val, j) => sum + val * comp[j], 0))
  })

  return {
    components,
    explainedVariance: explainedVariance.map((e) => Math.max(0, Math.min(1, e))),
    scores,
  }
}

// Calculate rolling statistics
export interface RollingStats {
  date: string
  mean: number
  std: number
  min: number
  max: number
}

export function calculateRollingStats(
  historicalCurves: YieldCurveData[],
  maturity: string,
  windowSize = 30,
): RollingStats[] {
  const sorted = [...historicalCurves].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const results: RollingStats[] = []

  for (let i = windowSize - 1; i < sorted.length; i++) {
    const window = sorted.slice(i - windowSize + 1, i + 1)
    const yields = window
      .map((curve) => curve.points.find((p) => p.maturity === maturity)?.yield)
      .filter((y): y is number => isValidYield(y))

    if (yields.length === 0) continue

    const mean = yields.reduce((sum, y) => sum + y, 0) / yields.length
    const variance = yields.reduce((sum, y) => sum + Math.pow(y - mean, 2), 0) / yields.length
    const std = Math.sqrt(variance)

    results.push({
      date: sorted[i].date,
      mean,
      std,
      min: Math.min(...yields),
      max: Math.max(...yields),
    })
  }

  return results
}

// Calculate enhanced curve metrics with historical data
export function calculateEnhancedCurveMetrics(
  points: YieldDataPoint[],
  historicalCurves?: YieldCurveData[],
): CurveMetrics | null {
  const getYield = (maturity: string) => points.find((p) => p.maturity === maturity)?.yield

  const y2 = getYield("2Y")
  const y5 = getYield("5Y")
  const y10 = getYield("10Y")
  const y30 = getYield("30Y")

  if (!isValidYield(y2) || !isValidYield(y5) || !isValidYield(y10) || !isValidYield(y30)) {
    return null
  }

  const basicMetrics: CurveMetrics = {
    level: (y2 + y5 + y10 + y30) / 4,
    slope: y30 - y2,
    curvature: 2 * y10 - y2 - y30,
    slope_2_10: y10 - y2,
  }

  // Calculate historical comparisons
  if (historicalCurves && historicalCurves.length > 0) {
    const sorted = [...historicalCurves].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const today = new Date()

    // Find historical data points by different intervals
    const oneYearAgo = new Date(today)
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    const fiveYearsAgo = new Date(today)
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)

    const tenYearsAgo = new Date(today)
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10)

    // Find closest curves
    const findClosest = (targetDate: Date) => {
      return sorted.reduce((closest, curve) => {
        const curveDate = new Date(curve.date)
        const closestDate = new Date(closest.date)
        return Math.abs(curveDate.getTime() - targetDate.getTime()) <
          Math.abs(closestDate.getTime() - targetDate.getTime())
          ? curve
          : closest
      })
    }

    const getSlope2_10 = (curve: YieldCurveData) => {
      const y2 = curve.points.find((p) => p.maturity === "2Y")?.yield
      const y10 = curve.points.find((p) => p.maturity === "10Y")?.yield
      return isValidYield(y2) && isValidYield(y10) ? y10 - y2 : null
    }

    const curve1yAgo = findClosest(oneYearAgo)
    const slope1yAgo = getSlope2_10(curve1yAgo)
    if (slope1yAgo !== null) {
      basicMetrics.slope_change_1y = basicMetrics.slope_2_10! - slope1yAgo
    }

    const curve5yAgo = findClosest(fiveYearsAgo)
    const slope5yAgo = getSlope2_10(curve5yAgo)
    if (slope5yAgo !== null) {
      basicMetrics.slope_change_5y = basicMetrics.slope_2_10! - slope5yAgo
    }

    const curve10yAgo = findClosest(tenYearsAgo)
    const slope10yAgo = getSlope2_10(curve10yAgo)
    if (slope10yAgo !== null) {
      basicMetrics.slope_change_10y = basicMetrics.slope_2_10! - slope10yAgo
    }

    // Identify areas of steepest and flattest change
    const maturities = ["3M", "6M", "1Y", "2Y", "3Y", "5Y", "7Y", "10Y", "20Y", "30Y"]
    let steepestSpread = 0
    let steepestPair = { from: "", to: "" }
    let flattest = Number.POSITIVE_INFINITY
    let flatestPair = { from: "", to: "" }

    for (let i = 0; i < maturities.length - 1; i++) {
      const y1 = points.find((p) => p.maturity === maturities[i])?.yield || 0
      const y2 = points.find((p) => p.maturity === maturities[i + 1])?.yield || 0
      const spread = Math.abs(y2 - y1)

      if (spread > steepestSpread) {
        steepestSpread = spread
        steepestPair = { from: maturities[i], to: maturities[i + 1] }
      }

      if (spread < flattest && spread > 0) {
        flattest = spread
        flatestPair = { from: maturities[i], to: maturities[i + 1] }
      }
    }

    basicMetrics.steepest_area = { ...steepestPair, spread: steepestSpread }
    basicMetrics.flattest_area = { ...flatestPair, spread: flattest }
  }

  return basicMetrics
}

export function isValidYield(yield_: number | null | undefined): boolean {
  return yield_ !== null && yield_ !== undefined && !isNaN(yield_) && isFinite(yield_) && yield_ > 0
}

export function calculateDailyPerformance(
  currentPoints: YieldDataPoint[],
  previousDayPoints?: YieldDataPoint[],
): Record<string, number> {
  const performance: Record<string, number> = {}

  if (!previousDayPoints || previousDayPoints.length === 0) {
    return performance
  }

  currentPoints.forEach((point) => {
    const prevPoint = previousDayPoints.find((p) => p.maturity === point.maturity)
    if (prevPoint && isValidYield(point.yield) && isValidYield(prevPoint.yield)) {
      performance[point.maturity] = (point.yield - prevPoint.yield) * 100 // in basis points
    }
  })

  return performance
}
