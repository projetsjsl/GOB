"use client"

import { Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from "recharts"
import { memo } from "react"
import type { YieldDataPoint } from "@/lib/fred-api"
import type { InterpolatedPoint } from "@/lib/interpolation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartControls } from "@/components/chart-controls"
import { useState } from "react"

interface CurveData {
  country: string
  observedPoints: YieldDataPoint[]
  interpolatedPoints: InterpolatedPoint[]
  color: string
  isCurrent?: boolean
  date?: string
}

interface GraphFilters {
  showObserved: boolean
  showInterpolated: boolean
  scaleType: "linear" | "log"
  minMaturity: string
  maxMaturity: string
  opacity: number
}

interface YieldCurveChartProps {
  curves: CurveData[]
  method?: string
  graphFilters?: GraphFilters
  onAddCurve?: () => void
  onRemoveCurve?: () => void
  hasAdditionalCurves?: boolean
}

const COUNTRY_COLORS: Record<string, { line: string; dot: string }> = {
  US: { line: "#3b82f6", dot: "#60a5fa" },
  CA: { line: "#ef4444", dot: "#f87171" },
}

const maturityToDays = (maturity: string): number => {
  const match = maturity.match(/(\d+)([YM])/)
  if (!match) return 0
  const value = Number.parseInt(match[1])
  const unit = match[2]
  return unit === "Y" ? value * 365 : unit === "M" ? value * 30 : 0
}

const ChartContent = memo(function ChartContent({
  chartData,
  curves,
  filters = {
    showObserved: true,
    showInterpolated: true,
    scaleType: "linear",
    minMaturity: "1M",
    maxMaturity: "30Y",
    opacity: 1,
  },
}: {
  chartData: any[]
  curves: CurveData[]
  filters?: GraphFilters
}) {
  const minDays = maturityToDays(filters.minMaturity)
  const maxDays = maturityToDays(filters.maxMaturity)

  const filteredData = chartData.filter((item) => {
    const days = item.days as number
    return days >= minDays && days <= maxDays
  })

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="years"
          type="number"
          domain={[minDays / 365, maxDays / 365]}
          tickCount={10}
          stroke="#9ca3af"
          tick={{ fill: "#9ca3af", fontSize: 12 }}
          label={{
            value: "Maturite (Annees)",
            position: "insideBottom",
            offset: -10,
            fill: "#d1d5db",
            fontSize: 14,
          }}
        />
        <YAxis
          domain={filters.scaleType === "log" ? ["dataMin / 2", "dataMax * 2"] : ["auto", "auto"]}
          scale={filters.scaleType}
          stroke="#9ca3af"
          tick={{ fill: "#9ca3af", fontSize: 12 }}
          label={{
            value: "Rendement (%)",
            angle: -90,
            position: "insideLeft",
            fill: "#d1d5db",
            fontSize: 14,
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "8px",
            color: "#f3f4f6",
          }}
          labelStyle={{ color: "#f3f4f6", fontWeight: "bold" }}
          formatter={(value: number, name: string) => {
            const label = name
              .replace(/_curve.*/, " (Courbe)")
              .replace(/_observed.*/, " (Officiel)")
              .replace(/_\d+/, "")
            return [`${value.toFixed(3)}%`, label]
          }}
          labelFormatter={(label) => `${label} Annees`}
        />
        <Legend
          wrapperStyle={{ paddingTop: 20 }}
          formatter={(value: string) => (
            <span style={{ color: "#d1d5db" }}>
              {value
                .replace(/_curve.*/, " - Courbe")
                .replace(/_observed.*/, " - Officiel")
                .replace(/_\d+/, "")}
            </span>
          )}
        />

        {curves.map(({ country, color, isCurrent, date }, idx) => {
          const suffix = !isCurrent && date ? `_${date.replace(/-/g, "")}` : ""
          const dotColor = color === "#3b82f6" ? "#60a5fa" : color === "#ef4444" ? "#f87171" : color
          const strokeDasharray = isCurrent ? undefined : "5 5"
          const opacity = isCurrent ? filters.opacity : filters.opacity * 0.7

          return [
            filters.showInterpolated && (
              <Line
                key={`${country}-curve${suffix}`}
                type="monotone"
                dataKey={`${country}_curve${suffix}`}
                stroke={color}
                strokeWidth={isCurrent ? 3 : 2}
                strokeDasharray={strokeDasharray}
                dot={false}
                name={`${country}_curve${suffix}`}
                connectNulls
                isAnimationActive={false}
                opacity={opacity}
              />
            ),
            filters.showObserved && (
              <Line
                key={`${country}-observed${suffix}`}
                type="monotone"
                dataKey={`${country}_observed${suffix}`}
                stroke="transparent"
                strokeWidth={0}
                dot={{
                  fill: dotColor,
                  stroke: "#ffffff",
                  strokeWidth: isCurrent ? 3 : 2,
                  r: isCurrent ? 8 : 5,
                }}
                activeDot={{
                  fill: dotColor,
                  stroke: "#ffffff",
                  strokeWidth: 3,
                  r: isCurrent ? 10 : 7,
                }}
                name={`${country}_observed${suffix}`}
                isAnimationActive={false}
                connectNulls={false}
                opacity={opacity}
              />
            ),
          ]
        })}
      </ComposedChart>
    </ResponsiveContainer>
  )
})

export const YieldCurveChart = memo(function YieldCurveChart({
  curves,
  graphFilters,
  onAddCurve,
  onRemoveCurve,
  hasAdditionalCurves = false,
}: YieldCurveChartProps) {
  const [period, setPeriod] = useState("ALL")

  if (!curves || curves.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Courbe des Taux Obligataires</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center text-muted-foreground">Aucune donnee disponible</div>
        </CardContent>
      </Card>
    )
  }

  const allPoints = new Map<number, Record<string, number | string>>()

  curves.forEach(({ country, interpolatedPoints, observedPoints, isCurrent, date }, curveIdx) => {
    const suffix = !isCurrent && date ? `_${date.replace(/-/g, "")}` : ""

    interpolatedPoints?.forEach((point) => {
      const key = point.days
      if (!allPoints.has(key)) {
        allPoints.set(key, {
          days: point.days,
          years: Number((point.days / 365).toFixed(2)),
        })
      }
      const entry = allPoints.get(key)!
      entry[`${country}_curve${suffix}`] = point.yield
    })

    observedPoints?.forEach((point) => {
      const key = point.days
      if (!allPoints.has(key)) {
        allPoints.set(key, {
          days: point.days,
          years: Number((point.days / 365).toFixed(2)),
        })
      }
      const entry = allPoints.get(key)!
      entry[`${country}_observed${suffix}`] = point.yield
      entry[`${country}_official${suffix}`] = true
    })
  })

  const chartData = Array.from(allPoints.values()).sort((a, b) => (a.days as number) - (b.days as number))

  const filteredChartData = chartData.filter((item) => {
    if (period === "ALL") return true

    const years = item.years as number
    const periodMap: Record<string, number> = {
      "1J": 1 / 365,
      "1W": 7 / 365,
      "1M": 1 / 12,
      "3M": 3 / 12,
      "6M": 6 / 12,
      "1Y": 1,
      "2Y": 2,
      "5Y": 5,
    }

    const maxYears = periodMap[period] || 100
    return years <= maxYears
  })

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Courbe des Taux Obligataires</CardTitle>
        <CardDescription className="text-muted-foreground">
          {curves.length === 1
            ? "Donnees officielles directes et courbe interpolee (Cubic Spline)"
            : `Comparaison ${curves.length} courbes - courbes historiques en pointilles`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartControls
          onPeriodChange={setPeriod}
          onAddLine={onAddCurve}
          onRemoveLine={onRemoveCurve}
          hasAdditionalLines={hasAdditionalCurves}
          showAddLine={true}
        />

        <ChartContent chartData={filteredChartData} curves={curves} filters={graphFilters} />

        <div className="mt-4 pt-4 border-t border-border space-y-2">
          <div className="flex items-start gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-gray-500 mt-0.5 flex-shrink-0"></div>
            <p className="text-muted-foreground">
              <span className="font-semibold">Points de marche:</span> Donnees officielles directes du Tresor
            </p>
          </div>
          <div className="flex items-start gap-2 text-xs">
            <div className="w-3 h-0.5 bg-gray-500 mt-1.5 flex-shrink-0" style={{ width: "12px" }}></div>
            <p className="text-muted-foreground">
              <span className="font-semibold">Courbe pleine:</span> Interpolation courante
            </p>
          </div>
          <div className="flex items-start gap-2 text-xs">
            <div
              className="w-3 h-0.5 bg-gray-500 mt-1.5 flex-shrink-0"
              style={{ width: "12px", strokeDasharray: "5 5" }}
            ></div>
            <p className="text-muted-foreground">
              <span className="font-semibold">Courbe pointillee:</span> Donnees historiques comparees
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Source: FRED (Federal Reserve Economic Data) et Banque du Canada
          </p>
        </div>
      </CardContent>
    </Card>
  )
})
