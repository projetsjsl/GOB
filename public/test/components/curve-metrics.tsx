"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { CurveMetrics } from "@/lib/analytics"
import { Activity, TrendingUp, Waves, TrendingDown, Minus, AlertCircle } from "lucide-react"

interface CurveMetricsProps {
  metrics?: CurveMetrics
  comparisonMode?: boolean
}

const METRIC_COLORS = {
  level: "#10b981",
  slope: "#3b82f6",
  curvature: "#f59e0b",
}

const safeToFixed = (value: number | undefined | null, decimals: number): string => {
  if (value === undefined || value === null || isNaN(value)) return "—"
  return value.toFixed(decimals)
}

const safeBps = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) return "—"
  return (value * 100).toFixed(1)
}

export function CurveMetricsCard({ metrics, comparisonMode = false }: CurveMetricsProps) {
  if (!metrics || typeof metrics.level !== "number") {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Métriques de la Courbe</CardTitle>
          <CardDescription className="text-muted-foreground">Chargement des données...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>Données en cours de chargement...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getSlopeIcon = () => {
    const slope = metrics.slope ?? 0
    if (slope > 0.005) return <TrendingUp className="h-5 w-5" style={{ color: METRIC_COLORS.slope }} />
    if (slope < -0.005) return <TrendingDown className="h-5 w-5" style={{ color: "#ef4444" }} />
    return <Minus className="h-5 w-5" style={{ color: METRIC_COLORS.slope }} />
  }

  const getSlopeText = () => {
    const slope = metrics.slope ?? 0
    if (slope > 0.005) return "Pente Raide (Normal)"
    if (slope < -0.005) return "Inversée"
    return "Plate"
  }

  const level = metrics.level ?? 0
  const slope = metrics.slope ?? 0
  const curvature = metrics.curvature ?? 0
  const slope_2_10 = metrics.slope_2_10 ?? slope

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Métriques de la Courbe</CardTitle>
        <CardDescription className="text-muted-foreground">
          Analyse du niveau, de la pente et de la courbure
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {/* Niveau */}
          <div className="flex items-start justify-between p-4 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md" style={{ backgroundColor: `${METRIC_COLORS.level}20` }}>
                <Activity className="h-5 w-5" style={{ color: METRIC_COLORS.level }} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Niveau</p>
                <p className="text-xs text-muted-foreground">Rendement moyen</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold" style={{ color: METRIC_COLORS.level }}>
                {safeToFixed(level, 2)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {safeBps(level)} bps / {safeToFixed(level, 4)}
              </p>
            </div>
          </div>

          {/* Pente */}
          <div className="flex items-start justify-between p-4 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md" style={{ backgroundColor: `${METRIC_COLORS.slope}20` }}>
                {getSlopeIcon()}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Pente</p>
                <p className="text-xs text-muted-foreground">{getSlopeText()}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold" style={{ color: slope < 0 ? "#ef4444" : METRIC_COLORS.slope }}>
                {slope > 0 ? "+" : ""}
                {safeBps(slope)} bp
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {slope > 0 ? "+" : ""}
                {safeToFixed(slope, 4)} / {safeToFixed(slope, 3)}%
              </p>
            </div>
          </div>

          {/* Pente 2Y-10Y */}
          <div className="flex items-start justify-between p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-blue-500/20">
                <TrendingUp className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Pente 2Y-10Y</p>
                <p className="text-xs text-muted-foreground">Indicateur clé du marché</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-400">{safeBps(slope_2_10)} bp</p>
              <p className="text-xs text-muted-foreground mt-1">
                {safeToFixed(slope_2_10, 4)} / {safeToFixed(slope_2_10 * 100, 3)}%
              </p>
              {comparisonMode && metrics.slope_change_1y !== undefined && (
                <div className="mt-2 space-y-1 text-xs">
                  <p className={`${(metrics.slope_change_1y ?? 0) > 0 ? "text-emerald-400" : "text-red-400"}`}>
                    vs 1 an: {(metrics.slope_change_1y ?? 0) > 0 ? "+" : ""}
                    {safeBps(metrics.slope_change_1y)} bp
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Zone de plus grand mouvement */}
          {metrics.steepest_area && (
            <div className="flex items-start justify-between p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-amber-500/20">
                  <TrendingUp className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Zone de Plus Grand Mouvement</p>
                  <p className="text-xs text-muted-foreground">
                    {metrics.steepest_area.from} → {metrics.steepest_area.to}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-amber-400">{safeBps(metrics.steepest_area.spread)} bp</p>
                <p className="text-xs text-muted-foreground mt-1">{safeToFixed(metrics.steepest_area.spread, 4)}</p>
              </div>
            </div>
          )}

          {/* Courbure */}
          <div className="flex items-start justify-between p-4 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md" style={{ backgroundColor: `${METRIC_COLORS.curvature}20` }}>
                <Waves className="h-5 w-5" style={{ color: METRIC_COLORS.curvature }} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Courbure</p>
                <p className="text-xs text-muted-foreground">2×10Y - 2Y - 30Y</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold" style={{ color: METRIC_COLORS.curvature }}>
                {curvature > 0 ? "+" : ""}
                {safeBps(curvature)} bp
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {curvature > 0 ? "+" : ""}
                {safeToFixed(curvature, 4)}
              </p>
            </div>
          </div>
        </div>

        {/* Légende */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">bp = points de base | 1% = 100 bp | Exemple: 50 bp = 0.50%</p>
        </div>
      </CardContent>
    </Card>
  )
}
