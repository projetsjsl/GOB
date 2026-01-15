"use client"

import { useMemo, memo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react"
import type { YieldDataPoint } from "@/lib/fred-api"
import { isValidYield, calculateDailyPerformance } from "@/lib/analytics"

interface KeyRatesSummaryProps {
  usData: YieldDataPoint[]
  caData?: YieldDataPoint[]
  usPolicyRate?: number
  caPolicyRate?: number
  previousDayUsData?: YieldDataPoint[]
  previousDayCanData?: YieldDataPoint[]
}

const KEY_MATURITIES = ["1M", "3M", "6M", "1Y", "2Y", "3Y", "5Y", "7Y", "10Y", "20Y", "30Y"]
const POLICY_RATES = {
  US: "Taux Cible Fed",
  CA: "Taux Directeur BOC",
}

const RateCard = memo(function RateCard({
  maturity,
  usYield,
  caYield,
  change,
}: {
  maturity: string
  usYield: number
  caYield: number | null
  change: number
}) {
  const getChangeIcon = () => {
    if (change > 0.5) return <TrendingUp className="h-3 w-3 text-emerald-500" />
    if (change < -0.5) return <TrendingDown className="h-3 w-3 text-red-500" />
    return <Minus className="h-3 w-3 text-gray-500" />
  }

  const spread = caYield !== null ? ((usYield - caYield) * 100).toFixed(0) : null

  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-all hover:shadow-md">
      <CardContent className="p-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">{maturity}</span>
          {getChangeIcon()}
        </div>
        <div className="space-y-0.5">
          {/* US */}
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold text-blue-400">{usYield.toFixed(2)}%</span>
            <span className="text-[9px] text-muted-foreground">{(usYield * 100).toFixed(0)} pb</span>
          </div>
          {/* CA */}
          {caYield !== null && (
            <div className="flex items-baseline justify-between pt-0.5 border-t border-border/30">
              <span className="text-xs font-semibold text-red-400">{caYield.toFixed(2)}%</span>
              <span className="text-[9px] text-muted-foreground">{(caYield * 100).toFixed(0)} pb</span>
            </div>
          )}
          {/* Spread US-CA */}
          {spread !== null && (
            <div className="text-[9px] text-center pt-0.5 border-t border-border/20">
              <span className={Number(spread) >= 0 ? "text-emerald-400" : "text-amber-400"}>
                Ecart: {Number(spread) >= 0 ? "+" : ""}
                {spread} pb
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
})

export const KeyRatesSummary = memo(function KeyRatesSummary({
  usData,
  caData,
  usPolicyRate,
  caPolicyRate = 2.25,
  previousDayUsData,
  previousDayCanData,
}: KeyRatesSummaryProps) {
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

  const lastUpdated = useMemo(() => {
    return new Date().toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }, [])

  // Calculate key spreads - only if data is valid
  const us2Y10YSpread = (() => {
    const y2 = getYield(usData, "2Y")
    const y10 = getYield(usData, "10Y")
    return isValidYield(y2) && isValidYield(y10) ? y10! - y2! : null
  })()

  const ca2Y10YSpread = (() => {
    const y2 = getYield(caData, "2Y")
    const y10 = getYield(caData, "10Y")
    return isValidYield(y2) && isValidYield(y10) ? y10! - y2! : null
  })()

  const usCA10YSpread = (() => {
    const usY10 = getYield(usData, "10Y")
    const caY10 = getYield(caData, "10Y")
    return isValidYield(usY10) && isValidYield(caY10) ? usY10! - caY10! : null
  })()

  return (
    <div className="space-y-4">
      {/* Policy Rates + Key Spreads Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* US Policy Rate */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-1 mb-1">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <span className="text-[10px] font-medium text-muted-foreground uppercase">Fed Rate</span>
            </div>
            <div className="text-xl font-bold text-blue-400">
              {isValidYield(usPolicyRate) ? `${usPolicyRate!.toFixed(2)}%` : "-"}
            </div>
            {isValidYield(usPolicyRate) && (
              <div className="text-[10px] text-muted-foreground mt-0.5">{(usPolicyRate! * 100).toFixed(0)} pb</div>
            )}
          </CardContent>
        </Card>

        {/* CA Policy Rate */}
        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-1 mb-1">
              <div className="h-2 w-2 rounded-full bg-red-500"></div>
              <span className="text-[10px] font-medium text-muted-foreground uppercase">BOC Rate</span>
            </div>
            <div className="text-xl font-bold text-red-400">{caPolicyRate.toFixed(2)}%</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{(caPolicyRate * 100).toFixed(0)} pb</div>
          </CardContent>
        </Card>

        {/* US 2Y-10Y Slope */}
        {us2Y10YSpread !== null && (
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/30">
            <CardContent className="p-3">
              <div className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Pente 2Y-10Y (US)</div>
              <div className={`text-xl font-bold ${us2Y10YSpread >= 0 ? "text-emerald-400" : "text-amber-400"}`}>
                {us2Y10YSpread >= 0 ? "+" : ""}
                {(us2Y10YSpread * 100).toFixed(0)} pb
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {us2Y10YSpread >= 0 ? "Normale" : "Inversee"}
              </div>
            </CardContent>
          </Card>
        )}

        {/* CA 2Y-10Y Slope */}
        {ca2Y10YSpread !== null && (
          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/30">
            <CardContent className="p-3">
              <div className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Pente 2Y-10Y (CA)</div>
              <div className={`text-xl font-bold ${ca2Y10YSpread >= 0 ? "text-emerald-400" : "text-amber-400"}`}>
                {ca2Y10YSpread >= 0 ? "+" : ""}
                {(ca2Y10YSpread * 100).toFixed(0)} pb
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {ca2Y10YSpread >= 0 ? "Normale" : "Inversee"}
              </div>
            </CardContent>
          </Card>
        )}

        {/* US-CA 10Y Spread */}
        {usCA10YSpread !== null && (
          <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border-cyan-500/30">
            <CardContent className="p-3">
              <div className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Ecart 10Y US-CA</div>
              <div className={`text-xl font-bold ${usCA10YSpread >= 0 ? "text-cyan-400" : "text-pink-400"}`}>
                {usCA10YSpread >= 0 ? "+" : ""}
                {(usCA10YSpread * 100).toFixed(0)} pb
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">US {usCA10YSpread >= 0 ? ">" : "<"} CA</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* All Maturities Grid - showing both countries and daily performance */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* US Maturities */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-blue-400 uppercase">Etats-Unis (FRED)</h3>
          <div className="grid grid-cols-5 gap-1.5">
            {KEY_MATURITIES.map((maturity) => {
              const usYield = getYield(usData, maturity)
              const change = usPerformance[maturity] || 0
              const getChangeIcon = () => {
                if (change > 0.5) return <TrendingUp className="h-3 w-3 text-emerald-500" />
                if (change < -0.5) return <TrendingDown className="h-3 w-3 text-red-500" />
                return <Minus className="h-3 w-3 text-gray-500" />
              }

              return (
                <Card key={`us-${maturity}`} className="bg-card border-border hover:border-primary/50">
                  <CardContent className="p-1.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-bold text-muted-foreground">{maturity}</span>
                      {getChangeIcon()}
                    </div>
                    <div className="text-sm font-bold text-blue-400">
                      {isValidYield(usYield) ? `${usYield!.toFixed(2)}%` : "-"}
                    </div>
                    {Object.keys(usPerformance).includes(maturity) && (
                      <div
                        className={`text-[8px] ${change > 0 ? "text-emerald-400" : change < 0 ? "text-red-400" : "text-gray-500"}`}
                      >
                        {change > 0 ? "+" : ""}
                        {change.toFixed(1)} pb
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* CA Maturities */}
        {caData && caData.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-red-400 uppercase">Canada (BOC)</h3>
            <div className="grid grid-cols-5 gap-1.5">
              {KEY_MATURITIES.map((maturity) => {
                const caYield = getYield(caData, maturity)
                const change = caPerformance[maturity] || 0
                const getChangeIcon = () => {
                  if (change > 0.5) return <TrendingUp className="h-3 w-3 text-emerald-500" />
                  if (change < -0.5) return <TrendingDown className="h-3 w-3 text-red-500" />
                  return <Minus className="h-3 w-3 text-gray-500" />
                }

                return (
                  <Card key={`ca-${maturity}`} className="bg-card border-border hover:border-primary/50">
                    <CardContent className="p-1.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-bold text-muted-foreground">{maturity}</span>
                        {getChangeIcon()}
                      </div>
                      <div className="text-sm font-bold text-red-400">
                        {isValidYield(caYield) ? `${caYield!.toFixed(2)}%` : "-"}
                      </div>
                      {Object.keys(caPerformance).includes(maturity) && (
                        <div
                          className={`text-[8px] ${change > 0 ? "text-emerald-400" : change < 0 ? "text-red-400" : "text-gray-500"}`}
                        >
                          {change > 0 ? "+" : ""}
                          {change.toFixed(1)} pb
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Legend & Info */}
      <div className="bg-muted/20 rounded-lg p-2.5 text-[10px] text-muted-foreground border border-border/20">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <span>Etats-Unis (FRED)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-red-500"></div>
              <span>Canada (BOC)</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <RefreshCw className="h-3 w-3" />
            <span>{lastUpdated}</span>
          </div>
        </div>
        <p className="text-[9px] mt-2 text-muted-foreground">
          Les donnees avec "-" indiquent une absence de donnees reelles. La performance du jour montre le changement en
          points de base depuis la veille.
        </p>
      </div>
    </div>
  )
})
