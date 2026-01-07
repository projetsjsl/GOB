"use client"

import { useState, useEffect } from "react"
import { type YieldCurveData, type Country, getMockYieldData } from "@/lib/fred-api"
import { getMockCanadianYieldData } from "@/lib/canadian-yields"
import { loadYieldData, saveYieldData } from "@/lib/supabase/yield-service"
import { fetchYieldDataAction } from "@/app/actions/yield-data"

interface UseYieldDataOptions {
  country?: Country
  useSupabase?: boolean
  refreshTrigger?: number
}

export function useMultiCountryYieldData(countries: Country[], useSupabase = true, refreshTrigger?: number) {
  const [data, setData] = useState<Record<Country, YieldCurveData>>({} as Record<Country, YieldCurveData>)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadAllData() {
      setLoading(true)
      setError(null)

      try {
        const today = new Date()
        today.setDate(today.getDate() - 1)
        const targetDate = today.toISOString().split("T")[0]

        const results: Record<Country, YieldCurveData> = {} as Record<Country, YieldCurveData>

        if (useSupabase) {
          for (const country of countries) {
            try {
              const cachedData = await loadYieldData(targetDate, country)
              if (cachedData) {
                results[country] = cachedData
              }
            } catch (supabaseError) {
              // Continue to server action
            }
          }
        }

        const missingCountries = countries.filter((c) => !results[c])
        if (missingCountries.length > 0) {
          const serverData = await fetchYieldDataAction(missingCountries, targetDate)
          Object.assign(results, serverData)

          if (useSupabase) {
            for (const country of missingCountries) {
              try {
                if (results[country]) {
                  await saveYieldData(results[country])
                }
              } catch (saveError) {
                console.warn(`[v0] Could not save ${country} to Supabase:`, saveError)
              }
            }
          }
        }

        setData(results)
      } catch (err) {
        setError("Failed to load yield data.")
        // Fallback to mock data
        const mockResults: Record<Country, YieldCurveData> = {} as Record<Country, YieldCurveData>
        for (const country of countries) {
          mockResults[country] = country === "CA" ? getMockCanadianYieldData() : getMockYieldData()
        }
        setData(mockResults)
      } finally {
        setLoading(false)
      }
    }

    if (countries.length > 0) {
      loadAllData()
    } else {
      setData({} as Record<Country, YieldCurveData>)
      setLoading(false)
    }
  }, [countries.join(","), useSupabase, refreshTrigger])

  return { data, loading, error }
}

export function useYieldData(options: UseYieldDataOptions = {}) {
  const { country = "US", useSupabase = true, refreshTrigger } = options
  const [data, setData] = useState<YieldCurveData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError(null)

      try {
        const today = new Date()
        today.setDate(today.getDate() - 1)
        const targetDate = today.toISOString().split("T")[0]

        if (useSupabase) {
          try {
            const cachedData = await loadYieldData(targetDate, country)
            if (cachedData) {
              setData(cachedData)
              setLoading(false)
              return
            }
          } catch (supabaseError) {
            // Continue to server action
          }
        }

        const serverData = await fetchYieldDataAction([country], targetDate)
        const yieldData = serverData[country]

        if (yieldData) {
          setData(yieldData)

          if (useSupabase) {
            try {
              await saveYieldData(yieldData)
            } catch (saveError) {
              console.warn("[v0] Could not save to Supabase:", saveError)
            }
          }
        }
      } catch (err) {
        setError("Failed to load yield data. Using mock data.")
        // Fallback to mock data
        const mockData = country === "CA" ? getMockCanadianYieldData() : getMockYieldData()
        setData(mockData)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [country, useSupabase, refreshTrigger])

  return { data, loading, error }
}
