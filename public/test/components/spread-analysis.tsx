"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { SpreadAnalysis } from "@/lib/analytics"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface SpreadAnalysisProps {
  spreads: SpreadAnalysis
}

const SPREAD_COLORS = {
  positive: "#10b981",
  negative: "#ef4444",
  neutral: "#6b7280",
}

export function SpreadAnalysisCard({ spreads }: SpreadAnalysisProps) {
  const spreadItems = [
    { name: "Spread 2Y-10Y", value: spreads.spread_2_10, key: "spread_2_10" },
    { name: "Spread 2Y-30Y", value: spreads.spread_2_30, key: "spread_2_30" },
    { name: "Spread 3M-10Y", value: spreads.spread_3m_10, key: "spread_3m_10" },
    { name: "Spread 5Y-30Y", value: spreads.spread_5_30, key: "spread_5_30" },
  ]

  const getIcon = (value: number) => {
    if (value > 0.01) return <TrendingUp className="h-4 w-4" style={{ color: SPREAD_COLORS.positive }} />
    if (value < -0.01) return <TrendingDown className="h-4 w-4" style={{ color: SPREAD_COLORS.negative }} />
    return <Minus className="h-4 w-4" style={{ color: SPREAD_COLORS.neutral }} />
  }

  const getColor = (value: number) => {
    if (value > 0.005) return SPREAD_COLORS.positive
    if (value < -0.005) return SPREAD_COLORS.negative
    return SPREAD_COLORS.neutral
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Analyse des Ecarts</CardTitle>
        <CardDescription className="text-muted-foreground">
          Ecarts cles de la courbe des taux (points de base)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {spreadItems.map((item) => {
            const valueInBp = item.value * 10000
            const isValid = !isNaN(valueInBp) && isFinite(valueInBp) && Math.abs(valueInBp) < 5000

            return (
              <div key={item.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isValid ? (
                    getIcon(item.value)
                  ) : (
                    <Minus className="h-4 w-4" style={{ color: SPREAD_COLORS.neutral }} />
                  )}
                  <span className="text-sm font-medium text-foreground">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-lg font-semibold"
                    style={{ color: isValid ? getColor(item.value) : SPREAD_COLORS.neutral }}
                  >
                    {isValid ? (valueInBp > 0 ? "+" : "") + valueInBp.toFixed(1) : "-"}
                  </span>
                  <span className="text-xs text-muted-foreground">pb</span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
