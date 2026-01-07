// Financial Modeling Prep API integration for US Treasury yields

export const FMP_API_BASE = "https://financialmodelingprep.com/api/v4"

export interface FMPTreasuryYield {
  date: string
  maturity: string
  yield: number
}

export interface FMPYieldResponse {
  data: FMPTreasuryYield[]
  source: "FMP" | "FRED_FALLBACK"
}

export async function fetchFMPTreasuryYields(date?: string, apiKey?: string): Promise<FMPYieldResponse> {
  if (!apiKey || apiKey === "demo") {
    console.log("[v0] FMP API key not provided, data will use FRED fallback")
    return { data: [], source: "FRED_FALLBACK" }
  }

  const targetDate = date || new Date().toISOString().split("T")[0]

  try {
    // FMP endpoint for US Treasury yields
    const url = `${FMP_API_BASE}/treasury?date=${targetDate}&apikey=${apiKey}`
    console.log("[v0] Fetching from FMP API for date:", targetDate)

    const response = await fetch(url)

    if (!response.ok) {
      console.warn(`[v0] FMP API error: ${response.status}`)
      return { data: [], source: "FRED_FALLBACK" }
    }

    const responseData = await response.json()
    console.log("[v0] FMP data fetched successfully")

    return {
      data: responseData || [],
      source: "FMP",
    }
  } catch (error) {
    console.error("[v0] Error fetching from FMP:", error)
    return { data: [], source: "FRED_FALLBACK" }
  }
}

export async function fetchFMPHistoricalYields(
  startDate: string,
  endDate: string,
  apiKey?: string,
): Promise<FMPYieldResponse> {
  if (!apiKey || apiKey === "demo") {
    return { data: [], source: "FRED_FALLBACK" }
  }

  try {
    const url = `${FMP_API_BASE}/historical-price-full/treasury?from=${startDate}&to=${endDate}&apikey=${apiKey}`
    console.log("[v0] Fetching historical FMP data from", startDate, "to", endDate)

    const response = await fetch(url)

    if (!response.ok) {
      console.warn(`[v0] FMP historical API error: ${response.status}`)
      return { data: [], source: "FRED_FALLBACK" }
    }

    const data = await response.json()
    return { data: data.historical || [], source: "FMP" }
  } catch (error) {
    console.error("[v0] Error fetching FMP historical data:", error)
    return { data: [], source: "FRED_FALLBACK" }
  }
}
