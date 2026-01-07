// Canadian Government Bond yield series from Bank of Canada VALET API
// Using group endpoint for benchmark bond yields

export type CanadianMaturity = "1M" | "3M" | "6M" | "1Y" | "2Y" | "3Y" | "5Y" | "7Y" | "10Y" | "20Y" | "30Y"

export interface CanadianYieldDataPoint {
  date: string
  maturity: string
  yield: number
  days: number
  fetchedAt?: string
}

export interface CanadianYieldCurveData {
  date: string
  country: "CA"
  points: CanadianYieldDataPoint[]
  dataSource?: "BOC" | "MOCK"
  policyRate?: number
  fetchedAt?: string
}

export const CANADIAN_MATURITY_DAYS: Record<string, number> = {
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
}

const BOC_SERIES_TO_MATURITY: Record<string, string> = {
  "BD.CDN.2YR.DQ.YLD": "2Y",
  "BD.CDN.3YR.DQ.YLD": "3Y",
  "BD.CDN.5YR.DQ.YLD": "5Y",
  "BD.CDN.7YR.DQ.YLD": "7Y",
  "BD.CDN.10YR.DQ.YLD": "10Y",
  "BD.CDN.LONG.DQ.YLD": "30Y",
}

function getValidBOCDate(): string {
  return "2024-12-20"
}

// Function to interpolate Canadian yields
function interpolateCanadianYield(
  points: CanadianYieldDataPoint[],
  targetMaturity: string,
  targetDays: number,
): CanadianYieldDataPoint | null {
  const date = points[0]?.date
  const fetchedAt = points[0]?.fetchedAt

  if (!date || !fetchedAt) return null

  // For 1Y: use average of 6M and 2Y, or fallback to nearby values
  if (targetMaturity === "1Y") {
    const m6m = points.find((p) => p.maturity === "6M")
    const m2y = points.find((p) => p.maturity === "2Y")
    const m3m = points.find((p) => p.maturity === "3M")

    if (m6m && m2y) {
      const interpolated = (m6m.yield + m2y.yield) / 2
      return {
        date,
        maturity: "1Y",
        yield: interpolated,
        days: targetDays,
        fetchedAt,
      }
    } else if (m2y && m3m) {
      // Fallback: use average of 3M and 2Y
      const interpolated = (m3m.yield + m2y.yield) / 2
      return {
        date,
        maturity: "1Y",
        yield: interpolated,
        days: targetDays,
        fetchedAt,
      }
    } else if (m2y) {
      // Final fallback: use 2Y directly
      return {
        date,
        maturity: "1Y",
        yield: m2y.yield * 0.98, // 2% lower than 2Y (typical curve shape)
        days: targetDays,
        fetchedAt,
      }
    }
  }

  // For 20Y: use average of 10Y and 30Y, or fallback
  if (targetMaturity === "20Y") {
    const m10y = points.find((p) => p.maturity === "10Y")
    const m30y = points.find((p) => p.maturity === "30Y")

    if (m10y && m30y) {
      const interpolated = (m10y.yield + m30y.yield) / 2
      return {
        date,
        maturity: "20Y",
        yield: interpolated,
        days: targetDays,
        fetchedAt,
      }
    } else if (m10y) {
      // Fallback: use 10Y with slight increase (typical curve shape)
      return {
        date,
        maturity: "20Y",
        yield: m10y.yield * 1.02,
        days: targetDays,
        fetchedAt,
      }
    }
  }

  return null
}

export function getMockCanadianYieldData(): CanadianYieldCurveData {
  const date = "2024-12-20"
  const fetchedAt = new Date().toISOString()

  return {
    date,
    country: "CA",
    points: [
      { date, maturity: "1M", yield: 4.45, days: 30, fetchedAt },
      { date, maturity: "3M", yield: 4.42, days: 91, fetchedAt },
      { date, maturity: "6M", yield: 4.38, days: 182, fetchedAt },
      { date, maturity: "1Y", yield: 4.25, days: 365, fetchedAt },
      { date, maturity: "2Y", yield: 3.85, days: 730, fetchedAt },
      { date, maturity: "3Y", yield: 3.72, days: 1095, fetchedAt },
      { date, maturity: "5Y", yield: 3.65, days: 1825, fetchedAt },
      { date, maturity: "7Y", yield: 3.7, days: 2555, fetchedAt },
      { date, maturity: "10Y", yield: 3.78, days: 3650, fetchedAt },
      // Added 20Y interpolated and 30Y
      { date, maturity: "20Y", yield: 3.87, days: 7300, fetchedAt },
      { date, maturity: "30Y", yield: 3.95, days: 10950, fetchedAt },
    ],
    dataSource: "MOCK",
    policyRate: 2.25,
    fetchedAt,
  }
}

export async function fetchCanadianYields(date?: string, apiKey?: string): Promise<CanadianYieldCurveData> {
  const targetDate = date || getValidBOCDate()
  const fetchedAt = new Date().toISOString()

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`[v0] Tentative ${attempt}/3 - Fetching Canadian yields from BOC for:`, targetDate)

      const url = `https://www.bankofcanada.ca/valet/observations/group/bond_yields_benchmark/json?start_date=${targetDate}&end_date=${targetDate}`

      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] BOC response received, parsing observations...")

      const points: CanadianYieldDataPoint[] = []

      if (data.observations && data.observations.length > 0) {
        const obs = data.observations[0]
        const obsDate = obs.d || targetDate

        console.log(
          "[v0] Available BOC series keys:",
          Object.keys(obs).filter((k) => k.includes("BD.CDN")),
        )

        for (const [seriesName, maturityLabel] of Object.entries(BOC_SERIES_TO_MATURITY)) {
          const seriesData = obs[seriesName]
          if (seriesData && seriesData.v !== undefined && seriesData.v !== null && seriesData.v !== "") {
            const yieldValue = Number.parseFloat(String(seriesData.v))
            if (!isNaN(yieldValue) && yieldValue >= 0) {
              console.log(`[v0] Fetched ${maturityLabel}: ${(yieldValue).toFixed(2)}%`)
              points.push({
                date: obsDate,
                maturity: maturityLabel,
                yield: yieldValue,
                days: CANADIAN_MATURITY_DAYS[maturityLabel] || 365,
                fetchedAt,
              })
            }
          }
        }
      }

      if (data.observations && data.observations.length > 0) {
        const obs = data.observations[0]
        const obsDate = obs.d || targetDate

        const shortTermSeries: Record<string, string> = {
          "BD.CDN.1MO.DQ.YLD": "1M",
          "BD.CDN.3MO.DQ.YLD": "3M",
          "BD.CDN.6MO.DQ.YLD": "6M",
        }

        for (const [seriesName, maturityLabel] of Object.entries(shortTermSeries)) {
          const seriesData = obs[seriesName]
          if (seriesData && seriesData.v !== undefined && seriesData.v !== null && seriesData.v !== "") {
            const yieldValue = Number.parseFloat(String(seriesData.v))
            if (!isNaN(yieldValue) && yieldValue >= 0) {
              console.log(`[v0] Fetched ${maturityLabel}: ${(yieldValue).toFixed(2)}%`)
              points.push({
                date: obsDate,
                maturity: maturityLabel,
                yield: yieldValue,
                days: CANADIAN_MATURITY_DAYS[maturityLabel] || 30,
                fetchedAt,
              })
            }
          }
        }
      }

      const sortedPoints = points.sort((a, b) => a.days - b.days)

      // Added 1Y and 20Y with guarantee of presence and multiple fallbacks
      const oneYInterpolated = interpolateCanadianYield(sortedPoints, "1Y", 365)
      if (oneYInterpolated && !sortedPoints.find((p) => p.maturity === "1Y")) {
        sortedPoints.push(oneYInterpolated)
        console.log(`[v0] Interpolated 1Y Canada: ${oneYInterpolated.yield.toFixed(2)}%`)
      }

      const twentyYInterpolated = interpolateCanadianYield(sortedPoints, "20Y", 7300)
      if (twentyYInterpolated && !sortedPoints.find((p) => p.maturity === "20Y")) {
        sortedPoints.push(twentyYInterpolated)
        console.log(`[v0] Interpolated 20Y Canada: ${twentyYInterpolated.yield.toFixed(2)}%`)
      }

      const finalPoints = sortedPoints.sort((a, b) => a.days - b.days)

      const policyRate = await fetchCanadianPolicyRate()

      if (finalPoints.length >= 6) {
        console.log(`[v0] Successfully fetched ${finalPoints.length} Canadian yield points from BOC`)
        console.log(`[v0] Canada data validated: ${finalPoints.length} points, policy rate: ${policyRate}`)
        return {
          date: targetDate,
          country: "CA",
          points: finalPoints,
          dataSource: "BOC",
          policyRate: policyRate || 2.25,
          fetchedAt,
        }
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.warn(`[v0] BOC fetch attempt ${attempt}/3 failed:`, lastError.message)

      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt))
      }
    }
  }

  console.warn("[v0] All BOC fetch attempts failed, using mock data:", lastError?.message)
  return getMockCanadianYieldData()
}

export async function fetchCanadianPolicyRate(): Promise<number | null> {
  try {
    // Use the series V39079 directly (target financing rate at one day)
    const url = `https://www.bankofcanada.ca/valet/observations/V39079/json?recent=1`

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })

    if (!response.ok) {
      console.log("[v0] BOC policy rate fetch failed, using default 2.25%")
      return 2.25
    }

    const data = await response.json()
    if (data.observations && data.observations.length > 0) {
      const obs = data.observations[0]
      const rateValue = obs.V39079?.v
      if (rateValue !== null && rateValue !== undefined && rateValue !== "") {
        const parsedRate = Number.parseFloat(String(rateValue))
        console.log("[v0] BOC policy rate fetched:", parsedRate)
        return parsedRate
      }
    }
    return 2.25
  } catch (err) {
    console.log("[v0] BOC policy rate error:", err)
    return 2.25
  }
}
