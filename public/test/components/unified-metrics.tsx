"use client"
import { CurveMetricsCard } from "./curve-metrics"

interface MetricsData {
  slope2Y10Y: number
  slope2Y30Y: number
  slope5Y10Y: number
  slope10Y30Y: number
}

interface UnifiedMetricsProps {
  usMetrics?: MetricsData
  caMetrics?: MetricsData
  selectedCountries: string[]
  historicalData: Record<string, any>
}

export function UnifiedMetrics({ usMetrics, caMetrics, selectedCountries, historicalData }: UnifiedMetricsProps) {
  const countriesToShow = selectedCountries.length
  const colWidth = countriesToShow === 2 ? "md:col-span-6" : "md:col-span-12"

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="h-1 w-8 bg-gradient-to-r from-blue-500 to-red-500 rounded-full"></div>
        <h3 className="text-sm sm:text-base font-semibold text-foreground">
          {selectedCountries.length === 2
            ? " Metriques |  Metriques"
            : selectedCountries.includes("US")
              ? " Metriques Etats-Unis"
              : " Metriques Canada"}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
        {selectedCountries.includes("US") && usMetrics && (
          <div className={`md:col-span-6 lg:col-span-6 fed-card-bg rounded-lg border border-border/50`}>
            <div className="bg-card-content p-3 sm:p-4">
              <h4 className="text-xs font-semibold text-blue-400 mb-3 flex items-center gap-2">
                <span></span> Etats-Unis
              </h4>
              <CurveMetricsCard metrics={usMetrics} />
            </div>
          </div>
        )}

        {selectedCountries.includes("CA") && caMetrics && (
          <div className={`md:col-span-6 lg:col-span-6 canada-card-bg rounded-lg border border-border/50`}>
            <div className="bg-card-content p-3 sm:p-4">
              <h4 className="text-xs font-semibold text-red-400 mb-3 flex items-center gap-2">
                <span></span> Canada
              </h4>
              <CurveMetricsCard metrics={caMetrics} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
