"use client"

import type { YieldDataPoint } from "@/lib/fred-api"
import { TrendIndicator } from "./trend-indicator"

interface YieldStatsPanelProps {
  data: YieldDataPoint[]
  country: string
  color: string
}

export function YieldStatsPanel({ data, country, color }: YieldStatsPanelProps) {
  if (!data || data.length === 0) {
    return null
  }

  // Calculer les statistiques
  const rates = data.map((p) => p.yield)
  const min = Math.min(...rates)
  const max = Math.max(...rates)
  const avg = rates.reduce((a, b) => a + b, 0) / rates.length
  const curve = max - min // Différence 30Y - 1M approximativement

  const current = data[data.length - 1]?.yield || 0
  const previous = data[data.length - 2]?.yield || current
  const change = current - previous

  return (
    <div
      className={`rounded-lg p-4 border-l-4 border-b border-r border-t border-opacity-20 bg-gradient-to-br ${
        color === "#3b82f6"
          ? "from-blue-950/40 to-blue-900/20 border-l-blue-500 border-blue-500"
          : "from-red-950/40 to-red-900/20 border-l-red-500 border-red-500"
      }`}
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Courant</p>
          <TrendIndicator value={current} change={change} decimals={3} />
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Min</p>
          <p className="text-base font-semibold">{min.toFixed(3)}%</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Max</p>
          <p className="text-base font-semibold">{max.toFixed(3)}%</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Pente</p>
          <p className={`text-base font-semibold ${curve > 0 ? "text-green-400" : "text-red-400"}`}>
            {(curve * 100).toFixed(0)} pb
          </p>
        </div>
      </div>
    </div>
  )
}
