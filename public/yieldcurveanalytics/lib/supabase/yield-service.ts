import { getSupabaseClient } from "./client"
import type { YieldCurveData, YieldDataPoint, Country } from "@/lib/fred-api"

export interface StoredYieldObservation {
  id: string
  country: Country
  date: string
  maturity: string
  yield_value: number
  days: number
  created_at: string
  updated_at: string
}

export async function saveYieldData(data: YieldCurveData): Promise<void> {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      console.log("[v0] Supabase not configured, skipping save")
      return
    }

    const observations = data.points.map((point) => ({
      country: data.country,
      date: data.date,
      maturity: point.maturity,
      yield_value: point.yield,
      days: point.days,
    }))

    const { error } = await supabase.from("yield_observations").upsert(observations, {
      onConflict: "country,date,maturity",
    })

    if (error) {
      console.log("[v0] Supabase save skipped:", error.message)
      return
    }

    console.log("[v0] Successfully saved yield data to Supabase")
  } catch (err) {
    // Silently fail if Supabase is not set up
    console.log("[v0] Supabase not available, continuing without database storage")
  }
}

export async function loadYieldData(date: string, country: Country = "US"): Promise<YieldCurveData | null> {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return null
    }

    const { data, error } = await supabase
      .from("yield_observations")
      .select("*")
      .eq("country", country)
      .eq("date", date)
      .order("days", { ascending: true })

    if (error) {
      console.log("[v0] Supabase load skipped:", error.message)
      return null
    }

    if (!data || data.length === 0) {
      return null
    }

    const points: YieldDataPoint[] = data.map((obs: any) => ({
      date: obs.date,
      maturity: obs.maturity,
      yield: obs.yield_value,
      days: obs.days,
    }))

    return {
      date,
      country,
      points,
    }
  } catch (err) {
    // Silently fail if Supabase is not set up
    return null
  }
}

export async function loadHistoricalYieldData(
  startDate: string,
  endDate: string,
  country: Country = "US",
): Promise<Map<string, YieldCurveData>> {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return new Map()
    }

    const { data, error } = await supabase
      .from("yield_observations")
      .select("*")
      .eq("country", country)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true })
      .order("days", { ascending: true })

    if (error) {
      console.log("[v0] Supabase historical load skipped:", error.message)
      return new Map()
    }

    if (!data) {
      return new Map()
    }

    // Group by date
    const dateMap = new Map<string, YieldCurveData>()

    data.forEach((obs: any) => {
      if (!dateMap.has(obs.date)) {
        dateMap.set(obs.date, {
          date: obs.date,
          country,
          points: [],
        })
      }

      dateMap.get(obs.date)!.points.push({
        date: obs.date,
        maturity: obs.maturity,
        yield: obs.yield_value,
        days: obs.days,
      })
    })

    return dateMap
  } catch (err) {
    // Silently fail if Supabase is not set up
    return new Map()
  }
}
