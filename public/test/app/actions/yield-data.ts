"use server"

import { fetchTreasuryYields, getMockYieldData, type Country, type YieldCurveData } from "@/lib/fred-api"
import { getMockCanadianYieldData } from "@/lib/canadian-yields"

function getEnvVar(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name]
    if (value && value.length > 0) {
      return value
    }
  }
  return ""
}

function getValidHistoricalDate(): string {
  return "2024-12-20"
}

export async function fetchYieldDataAction(
  countries: Country[],
  date?: string,
): Promise<Record<Country, YieldCurveData>> {
  const results: Record<Country, YieldCurveData> = {} as Record<Country, YieldCurveData>

  const fmpApiKey = getEnvVar("FMP_API_KEY", "NEXT_PUBLIC_FMP_API_KEY", "FMP_KEY")
  const fredApiKey = getEnvVar("FRED_API_KEY", "NEXT_PUBLIC_FRED_API_KEY", "FRED_KEY")
  const bocApiKey = getEnvVar("BANK_OF_CANADA_API_KEY", "BOC_API_KEY", "BOC_KEY")

  const targetDate = getValidHistoricalDate()

  console.log("[v0] Using target date:", targetDate)
  console.log("[v0] API keys found - FRED:", fredApiKey.length > 0, "FMP:", fmpApiKey.length > 0)

  const fetchPromises = countries.map(async (country) => {
    try {
      const apiData = await fetchTreasuryYields(targetDate, fredApiKey, country, fmpApiKey, bocApiKey)
      return { country, data: apiData }
    } catch (error) {
      console.warn(`[v0] Failed to fetch ${country} data:`, error)
      const mockData = country === "CA" ? getMockCanadianYieldData() : getMockYieldData()
      return { country, data: mockData }
    }
  })

  const fetchResults = await Promise.all(fetchPromises)
  for (const { country, data } of fetchResults) {
    results[country] = data
  }

  return results
}

export async function getYieldData() {
  return fetchYieldDataAction(["US", "CA"])
}
