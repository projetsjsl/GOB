// Treasury yield series IDs from FRED
export const TREASURY_SERIES = {
  "1M": "DGS1MO",
  "3M": "DGS3MO",
  "6M": "DGS6MO",
  "1Y": "DGS1",
  "2Y": "DGS2",
  "3Y": "DGS3",
  "5Y": "DGS5",
  "7Y": "DGS7",
  "10Y": "DGS10",
  "20Y": "DGS20",
  "30Y": "DGS30",
} as const

export const POLICY_RATE_SERIES = {
  US: "DFF", // Effective Federal Funds Rate
  CA: "IRSTCB01CAM156N", // Bank of Canada policy rate
} as const

export const MATURITY_DAYS = {
  "1M": 30,
  "3M": 91,
  "6M": 182,
  "1Y": 365,
  "2Y": 730,
  "3Y": 1095,
  "5Y": 1825,
  "7Y": 2555,
  "10Y": 3650,
  "20Y": 7300,
  "30Y": 10950,
} as const

export type Maturity = keyof typeof TREASURY_SERIES
export type Country = "US" | "CA"

export interface YieldDataPoint {
  date: string
  maturity: Maturity
  yield: number
  days: number
  fetchedAt?: string
}

export interface YieldCurveData {
  date: string
  country: Country
  points: YieldDataPoint[]
  dataSource?: "FRED" | "FMP" | "MOCK"
  policyRate?: number // Include policy rate in response
  fetchedAt?: string
}

const FRED_API_BASE = "https://api.stlouisfed.org/fred"

import { fetchFMPTreasuryYields } from "./fmp-api"
import { fetchCanadianYields, getMockCanadianYieldData } from "./canadian-yields"

// Helper function to get valid historical date
function getValidFREDDate(): string {
  const now = new Date()
  const year = now.getFullYear()

  // If system date is in future (2026+), use known good date
  if (year > 2025) {
    return "2024-12-20"
  }

  // Go back 2 days to ensure data availability
  const target = new Date(now)
  target.setDate(now.getDate() - 2)

  // Skip weekends
  while (target.getDay() === 0 || target.getDay() === 6) {
    target.setDate(target.getDate() - 1)
  }

  return target.toISOString().split("T")[0]
}

async function fetchWithRetry(url: string, maxRetries = 3, initialDelayMs = 1000): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url)

      // 502 Bad Gateway - retry with backoff
      if (response.status === 502) {
        if (attempt < maxRetries) {
          const delayMs = initialDelayMs * Math.pow(2, attempt - 1)
          console.log(`[v0] 502 error, retry ${attempt}/${maxRetries} after ${delayMs}ms`)
          await new Promise((resolve) => setTimeout(resolve, delayMs))
          continue
        }
      }

      // Other errors or success
      return response
    } catch (error) {
      if (attempt < maxRetries) {
        const delayMs = initialDelayMs * Math.pow(2, attempt - 1)
        console.log(`[v0] Network error, retry ${attempt}/${maxRetries}: ${error}`)
        await new Promise((resolve) => setTimeout(resolve, delayMs))
        continue
      }
      throw error
    }
  }

  throw new Error(`Failed after ${maxRetries} retries`)
}

export async function fetchTreasuryYields(
  date?: string,
  apiKey = "",
  country: Country = "US",
  fmpApiKey?: string,
  bankOfCanadaApiKey?: string,
): Promise<YieldCurveData> {
  const targetDate = date || getValidFREDDate()
  const fetchedAt = new Date().toISOString()

  if (country === "CA") {
    try {
      const caData = await fetchCanadianYields(targetDate, bankOfCanadaApiKey)
      return { ...caData, fetchedAt } as YieldCurveData
    } catch (error) {
      console.warn("[v0] CA fetch failed:", error)
      return getMockCanadianYieldData() as YieldCurveData
    }
  }

  if (fmpApiKey && fmpApiKey.length > 5) {
    try {
      const fmpResponse = await fetchFMPTreasuryYields(targetDate, fmpApiKey)
      if (fmpResponse.data && fmpResponse.data.length > 0) {
        console.log("[v0] Successfully fetched from FMP")
        const points = fmpResponse.data
          .map((d: any) => ({
            date: targetDate,
            maturity: d.maturity as Maturity,
            yield: Number.parseFloat(d.yield),
            days: MATURITY_DAYS[d.maturity as Maturity] || 0,
            fetchedAt,
          }))
          .filter((p: any) => p.days > 0 && p.yield >= 0 && !isNaN(p.yield))

        if (points.length > 0) {
          return {
            date: targetDate,
            country: "US",
            points: points.sort((a: any, b: any) => a.days - b.days),
            dataSource: "FMP",
            fetchedAt,
          }
        }
      }
    } catch (error) {
      console.warn("[v0] FMP fetch failed, falling back to FRED:", error)
    }
  }

  if (!apiKey || apiKey.length < 5) {
    console.warn("[v0] FRED_API_KEY not configured (length:", apiKey.length, "), falling back to mock data")
    const mockData = getMockYieldData()
    return { ...mockData, fetchedAt }
  }

  try {
    const promises = Object.entries(TREASURY_SERIES).map(async ([maturity, seriesId]) => {
      const url = `${FRED_API_BASE}/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1&observation_start=${targetDate}&observation_end=${targetDate}`

      try {
        const response = await fetchWithRetry(url)

        if (!response.ok) {
          console.warn(`[v0] Failed to fetch ${maturity} from FRED: ${response.status}`)
          return null
        }

        const data = await response.json()
        if (!data.observations || data.observations.length === 0) {
          console.warn(`[v0] No observations for ${maturity}`)
          return null
        }

        const value = Number.parseFloat(data.observations[0].value)
        if (isNaN(value) || value < 0) {
          console.warn(`[v0] Invalid value for ${maturity}: ${data.observations[0].value}`)
          return null
        }

        console.log(`[v0] Fetched ${maturity}: ${value}%`)
        return {
          date: data.observations[0].date,
          maturity: maturity as Maturity,
          yield: value,
          days: MATURITY_DAYS[maturity as Maturity],
          fetchedAt,
        }
      } catch (error) {
        console.warn(`[v0] Error fetching ${maturity}: ${error}`)
        return null
      }
    })

    const results = await Promise.allSettled(promises)
    const validPoints = results
      .filter((r): r is PromiseFulfilledResult<YieldDataPoint | null> => r.status === "fulfilled")
      .map((r) => r.value)
      .filter((p): p is YieldDataPoint => p !== null)

    if (validPoints.length === 0) {
      console.warn("[v0] No valid yields from FRED, using mock data")
      const mockData = getMockYieldData()
      return { ...mockData, fetchedAt }
    }

    let policyRate: number | undefined
    try {
      const dffUrl = `${FRED_API_BASE}/series/observations?series_id=${POLICY_RATE_SERIES.US}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`
      const dffResponse = await fetchWithRetry(dffUrl)
      if (dffResponse.ok) {
        const dffData = await dffResponse.json()
        if (dffData.observations && dffData.observations.length > 0) {
          const dffValue = Number.parseFloat(dffData.observations[0].value)
          if (!isNaN(dffValue) && dffValue >= 0) {
            policyRate = dffValue
            console.log(`[v0] Fetched Fed Rate (DFF): ${policyRate}%`)
          }
        }
      }
    } catch (error) {
      console.warn("[v0] Failed to fetch Federal Funds Rate:", error)
    }

    console.log(`[v0] Successfully fetched ${validPoints.length} points from FRED`)
    return {
      date: validPoints[0].date,
      country: "US",
      points: validPoints.sort((a, b) => a.days - b.days),
      dataSource: "FRED",
      policyRate, // Include policy rate in response
      fetchedAt,
    }
  } catch (error) {
    console.error("[v0] Error fetching Treasury yields:", error)
    const mockData = getMockYieldData()
    return { ...mockData, fetchedAt }
  }
}

export async function fetchHistoricalYields(
  startDate: string,
  endDate: string,
  apiKey = "demo",
): Promise<Map<string, YieldCurveData>> {
  try {
    // Fetch each series for the date range
    const seriesPromises = Object.entries(TREASURY_SERIES).map(async ([maturity, seriesId]) => {
      const url = `${FRED_API_BASE}/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&observation_start=${startDate}&observation_end=${endDate}`

      const response = await fetch(url)
      if (!response.ok) {
        return { maturity, observations: [] }
      }

      const data = await response.json()
      return {
        maturity: maturity as Maturity,
        observations: data.observations || [],
      }
    })

    const allSeries = await Promise.all(seriesPromises)

    // Group by date
    const dateMap = new Map<string, Map<Maturity, number>>()

    allSeries.forEach(({ maturity, observations }) => {
      observations.forEach((obs: any) => {
        const value = Number.parseFloat(obs.value)
        if (!isNaN(value) && value > 0) {
          if (!dateMap.has(obs.date)) {
            dateMap.set(obs.date, new Map())
          }
          dateMap.get(obs.date)!.set(maturity, value)
        }
      })
    })

    // Convert to YieldCurveData
    const result = new Map<string, YieldCurveData>()

    dateMap.forEach((yields, date) => {
      const points: YieldDataPoint[] = []
      yields.forEach((yieldValue, maturity) => {
        points.push({
          date,
          maturity,
          yield: yieldValue,
          days: MATURITY_DAYS[maturity],
        })
      })

      if (points.length > 0) {
        result.set(date, {
          date,
          country: "US",
          points: points.sort((a, b) => a.days - b.days),
        })
      }
    })

    return result
  } catch (error) {
    console.error("Error fetching historical yields:", error)
    throw error
  }
}

// Mock data fallback for demo purposes
export function getMockYieldData(): YieldCurveData {
  const date = new Date().toISOString().split("T")[0]
  const fetchedAt = new Date().toISOString()

  return {
    date,
    country: "US",
    points: [
      { date, maturity: "1M", yield: 5.35, days: 30, fetchedAt },
      { date, maturity: "3M", yield: 5.38, days: 91, fetchedAt },
      { date, maturity: "6M", yield: 5.32, days: 182, fetchedAt },
      { date, maturity: "1Y", yield: 4.85, days: 365, fetchedAt },
      { date, maturity: "2Y", yield: 4.45, days: 730, fetchedAt },
      { date, maturity: "3Y", yield: 4.28, days: 1095, fetchedAt },
      { date, maturity: "5Y", yield: 4.32, days: 1825, fetchedAt },
      { date, maturity: "7Y", yield: 4.45, days: 2555, fetchedAt },
      { date, maturity: "10Y", yield: 4.55, days: 3650, fetchedAt },
      { date, maturity: "20Y", yield: 4.75, days: 7300, fetchedAt },
      { date, maturity: "30Y", yield: 4.72, days: 10950, fetchedAt },
    ],
    dataSource: "MOCK",
    fetchedAt,
  }
}
