import type { YieldDataPoint } from "./fred-api"

export type InterpolationMethod = "linear" | "cubic-spline" | "nelson-siegel" | "monotone-cubic"

export interface InterpolatedPoint {
  days: number
  yield: number
  maturity?: string
}

// Linear interpolation
export function linearInterpolation(points: YieldDataPoint[], targetDays: number[]): InterpolatedPoint[] {
  const sorted = [...points].sort((a, b) => a.days - b.days)

  return targetDays.map((days) => {
    // Find surrounding points
    let lower = sorted[0]
    let upper = sorted[sorted.length - 1]

    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].days <= days && sorted[i + 1].days >= days) {
        lower = sorted[i]
        upper = sorted[i + 1]
        break
      }
    }

    // Linear interpolation formula
    const t = (days - lower.days) / (upper.days - lower.days)
    const yieldValue = lower.yield + t * (upper.yield - lower.yield)

    return { days, yield: yieldValue }
  })
}

// Cubic spline interpolation (natural cubic spline)
export function cubicSplineInterpolation(points: YieldDataPoint[], targetDays: number[]): InterpolatedPoint[] {
  const sorted = [...points].sort((a, b) => a.days - b.days)
  const n = sorted.length

  if (n < 3) {
    return linearInterpolation(points, targetDays)
  }

  const x = sorted.map((p) => p.days)
  const y = sorted.map((p) => p.yield)

  // Build tridiagonal system for second derivatives
  const h: number[] = []
  const alpha: number[] = []

  for (let i = 0; i < n - 1; i++) {
    h[i] = x[i + 1] - x[i]
  }

  for (let i = 1; i < n - 1; i++) {
    alpha[i] = (3 / h[i]) * (y[i + 1] - y[i]) - (3 / h[i - 1]) * (y[i] - y[i - 1])
  }

  // Solve tridiagonal system
  const l: number[] = new Array(n).fill(1)
  const mu: number[] = new Array(n).fill(0)
  const z: number[] = new Array(n).fill(0)

  for (let i = 1; i < n - 1; i++) {
    l[i] = 2 * (x[i + 1] - x[i - 1]) - h[i - 1] * mu[i - 1]
    mu[i] = h[i] / l[i]
    z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i]
  }

  const c: number[] = new Array(n).fill(0)
  const b: number[] = new Array(n).fill(0)
  const d: number[] = new Array(n).fill(0)

  for (let j = n - 2; j >= 0; j--) {
    c[j] = z[j] - mu[j] * c[j + 1]
    b[j] = (y[j + 1] - y[j]) / h[j] - (h[j] * (c[j + 1] + 2 * c[j])) / 3
    d[j] = (c[j + 1] - c[j]) / (3 * h[j])
  }

  // Interpolate
  return targetDays.map((days) => {
    let i = 0
    for (let j = 0; j < n - 1; j++) {
      if (days >= x[j] && days <= x[j + 1]) {
        i = j
        break
      }
    }

    if (days < x[0]) i = 0
    if (days > x[n - 2]) i = n - 2

    const dx = days - x[i]
    const yieldValue = y[i] + b[i] * dx + c[i] * dx * dx + d[i] * dx * dx * dx

    return { days, yield: Math.max(0, yieldValue) }
  })
}

// Nelson-Siegel model
export function nelsonSiegelInterpolation(points: YieldDataPoint[], targetDays: number[]): InterpolatedPoint[] {
  // Estimate Nelson-Siegel parameters: y(t) = 0 + 1*exp(-t/) + 2*(t/)*exp(-t/)
  // Using simplified parameter estimation
  const sorted = [...points].sort((a, b) => a.days - b.days)

  // Rough parameter estimates
  const longYield = sorted[sorted.length - 1].yield
  const shortYield = sorted[0].yield
  const tau = 730 // 2-year characteristic maturity

  const beta0 = longYield
  const beta1 = shortYield - longYield
  const beta2 = (sorted[Math.floor(sorted.length / 2)]?.yield || 0) - (beta0 + beta1)

  return targetDays.map((days) => {
    const t = days / 365 // Convert to years
    const factor = Math.exp(-t / (tau / 365))
    const yieldValue = beta0 + beta1 * factor + beta2 * (t / (tau / 365)) * factor

    return { days, yield: Math.max(0, yieldValue) }
  })
}

// Monotone cubic interpolation (Fritsch-Carlson)
export function monotoneCubicInterpolation(points: YieldDataPoint[], targetDays: number[]): InterpolatedPoint[] {
  const sorted = [...points].sort((a, b) => a.days - b.days)
  const n = sorted.length

  if (n < 3) {
    return linearInterpolation(points, targetDays)
  }

  const x = sorted.map((p) => p.days)
  const y = sorted.map((p) => p.yield)

  // Calculate secants
  const delta: number[] = []
  for (let i = 0; i < n - 1; i++) {
    delta[i] = (y[i + 1] - y[i]) / (x[i + 1] - x[i])
  }

  // Calculate tangents
  const m: number[] = new Array(n)
  m[0] = delta[0]
  m[n - 1] = delta[n - 2]

  for (let i = 1; i < n - 1; i++) {
    if (delta[i - 1] * delta[i] <= 0) {
      m[i] = 0
    } else {
      m[i] = (delta[i - 1] + delta[i]) / 2
    }
  }

  // Interpolate using Hermite polynomials
  return targetDays.map((days) => {
    let i = 0
    for (let j = 0; j < n - 1; j++) {
      if (days >= x[j] && days <= x[j + 1]) {
        i = j
        break
      }
    }

    if (days < x[0]) i = 0
    if (days > x[n - 2]) i = n - 2

    const h = x[i + 1] - x[i]
    const t = (days - x[i]) / h

    const h00 = 2 * t * t * t - 3 * t * t + 1
    const h10 = t * t * t - 2 * t * t + t
    const h01 = -2 * t * t * t + 3 * t * t
    const h11 = t * t * t - t * t

    const yieldValue = h00 * y[i] + h10 * h * m[i] + h01 * y[i + 1] + h11 * h * m[i + 1]

    return { days, yield: Math.max(0, yieldValue) }
  })
}

// Main interpolation function
export function interpolateYieldCurve(
  points: YieldDataPoint[],
  method: InterpolationMethod,
  numPoints = 100,
): InterpolatedPoint[] {
  if (points.length === 0) return []

  const minDays = Math.min(...points.map((p) => p.days))
  const maxDays = Math.max(...points.map((p) => p.days))

  const targetDays: number[] = []
  for (let i = 0; i <= numPoints; i++) {
    targetDays.push(minDays + (maxDays - minDays) * (i / numPoints))
  }

  switch (method) {
    case "linear":
      return linearInterpolation(points, targetDays)
    case "cubic-spline":
      return cubicSplineInterpolation(points, targetDays)
    case "nelson-siegel":
      return nelsonSiegelInterpolation(points, targetDays)
    case "monotone-cubic":
      return monotoneCubicInterpolation(points, targetDays)
    default:
      return linearInterpolation(points, targetDays)
  }
}
