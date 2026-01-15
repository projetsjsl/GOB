"use client"

import { useMemo, memo } from "react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { YieldDataPoint } from "@/lib/fred-api"
import { isValidYield, calculateDailyPerformance } from "@/lib/analytics"

interface CurveComparisonGridProps {
  usData: YieldDataPoint[]
  caData?: YieldDataPoint[]
  previousDayUsData?: YieldDataPoint[]
  previousDayCanData?: YieldDataPoint[]
}

const KEY_MATURITIES = ["1M", "3M", "6M", "1Y", "2Y", "3Y", "5Y", "7Y", "10Y", "20Y", "30Y"]

const MaturityColumn = memo(function MaturityColumn({
  maturity,
  usYield,
  caYield,
  usChange,
  caChange,
}: {
  maturity: string
  usYield: number | null
  caYield: number | null
  usChange: number
  caChange: number
}) {
  const getChangeIcon = (change: number) => {
    if (change > 0.5) return <TrendingUp className="h-2.5 w-2.5" />
    if (change < -0.5) return <TrendingDown className="h-2.5 w-2.5" />
    return <Minus className="h-2.5 w-2.5" />
  }

  const spread = usYield !== null && caYield !== null ? (usYield - caYield) * 100 : null

  const getChangeDisplay = (change: number) => {
    const color = change > 0.5 ? "text-green-400" : change < -0.5 ? "text-red-400" : "text-gray-500"
    const sign = change > 0 ? "+" : ""
    return { color, sign, icon: getChangeIcon(change) }
  }

  const usChangeDisplay = getChangeDisplay(usChange)
  const caChangeDisplay = getChangeDisplay(caChange)

  return (
    <div className="flex flex-col gap-1 px-1.5 py-1 border-r border-border/40 last:border-r-0 min-w-[85px] text-[11px]">
      {/* Maturity Header */}
      <div className="text-[10px] font-bold text-muted-foreground text-center mb-0.5">{maturity}</div>

      {/* US Rate - LINE 1 with performance */}
      {isValidYield(usYield) ? (
        <div className="space-y-0.5">
          <div className="flex justify-between items-baseline gap-0.5">
            <span className="font-bold text-blue-400">{usYield!.toFixed(2)}%</span>
            <span className="text-[9px] text-gray-500">{(usYield! * 100).toFixed(0)} pb</span>
          </div>
          <div className={`flex items-center gap-0.5 ${usChangeDisplay.color} text-[9px] font-semibold`}>
            <span>
              {usChangeDisplay.sign}
              {usChange.toFixed(1)} pb
            </span>
            <span>{usChangeDisplay.icon}</span>
          </div>
        </div>
      ) : (
        <div className="text-[10px] text-gray-600">-</div>
      )}

      {/* CA Rate - LINE 2 with performance */}
      {caYield !== null ? (
        <div className="space-y-0.5">
          <div className="flex justify-between items-baseline gap-0.5">
            <span className="font-bold text-red-400">{caYield.toFixed(2)}%</span>
            <span className="text-[9px] text-gray-500">{(caYield * 100).toFixed(0)} pb</span>
          </div>
          <div className={`flex items-center gap-0.5 ${caChangeDisplay.color} text-[9px] font-semibold`}>
            <span>
              {caChangeDisplay.sign}
              {caChange.toFixed(1)} pb
            </span>
            <span>{caChangeDisplay.icon}</span>
          </div>
        </div>
      ) : (
        <div className="text-[10px] text-gray-600">-</div>
      )}

      {/* Spread US-CA - LINE 3 */}
      {spread !== null && (
        <div className="flex justify-center items-center gap-1 text-[9px] text-emerald-400 font-semibold">
          <span>
            Ecart: {spread >= 0 ? "+" : ""}
            {spread.toFixed(0)} pb
          </span>
          <span>{getChangeIcon(usChange - caChange)}</span>
        </div>
      )}
    </div>
  )
})

export const CurveComparisonGrid = memo(function CurveComparisonGrid({
  usData,
  caData,
  previousDayUsData,
  previousDayCanData,
}: CurveComparisonGridProps) {
  const getYield = useMemo(
    () => (data: YieldDataPoint[] | undefined, maturity: string) => {
      if (!data || !Array.isArray(data) || data.length === 0) return null
      const point = data.find((p) => p?.maturity === maturity)
      return isValidYield(point?.yield) ? point!.yield : null
    },
    [],
  )

  const usPerformance = useMemo(
    () => calculateDailyPerformance(usData || [], previousDayUsData),
    [usData, previousDayUsData],
  )

  const caPerformance = useMemo(
    () => calculateDailyPerformance(caData || [], previousDayCanData),
    [caData, previousDayCanData],
  )

  return (
    <div className="space-y-3">
      {/* Title */}
      <div>
        <h3 className="text-sm font-semibold">Courbes des Taux - Comparaison Complete</h3>
        <p className="text-xs text-muted-foreground">Taux et variations du jour par maturite</p>
      </div>

      {/* Horizontal Grid */}
      <div className="overflow-x-auto bg-card border border-border rounded-lg">
        <div className="flex min-w-full">
          {KEY_MATURITIES.map((maturity) => {
            const usYield = getYield(usData, maturity)
            const caYield = getYield(caData, maturity)
            const usChange = usPerformance[maturity] || 0
            const caChange = caPerformance[maturity] || 0

            return (
              <MaturityColumn
                key={maturity}
                maturity={maturity}
                usYield={usYield}
                caYield={caYield}
                usChange={usChange}
                caChange={caChange}
              />
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
          <span>Etats-Unis (FRED)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-red-500"></div>
          <span>Canada (BOC)</span>
        </div>
        <span>%: Pourcentage | pb: Points de base</span>
      </div>
    </div>
  )
})
