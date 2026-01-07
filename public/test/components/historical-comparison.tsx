"use client"

import { useState } from "react"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"
import { ChartControls } from "@/components/chart-controls"
import type { YieldCurveData } from "@/lib/fred-api"

interface HistoricalComparisonProps {
  currentCurve?: YieldCurveData
  historicalCurves?: Array<{
    date: string
    observedPoints: Array<{ maturity: string; yield: number; days: number }>
    color: string
  }>
}

const HISTORICAL_COLORS = {
  Actuelle: "#10b981",
  "Il y a 1 mois": "#3b82f6",
  "Il y a 3 mois": "#8b5cf6",
  "Il y a 6 mois": "#f59e0b",
  "Il y a 1 an": "#ef4444",
}

export function HistoricalComparison({ currentCurve, historicalCurves = [] }: HistoricalComparisonProps) {
  const [selectedCurves, setSelectedCurves] = useState<Set<string>>(new Set(["Actuelle"]))
  const [isLoading, setIsLoading] = useState(false)
  const [period, setPeriod] = useState("ALL")
  const [additionalDates, setAdditionalDates] = useState<string[]>([])

  const handleAddCurve = () => {
    const newDate = new Date()
    newDate.setDate(newDate.getDate() - 30 * (additionalDates.length + 1))
    const dateStr = newDate.toISOString().split("T")[0]
    if (!additionalDates.includes(dateStr)) {
      setAdditionalDates([...additionalDates, dateStr])
    }
  }

  if (isLoading || !currentCurve || !currentCurve.points || currentCurve.points.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Comparaison Historique</CardTitle>
          <CardDescription className="text-muted-foreground">
            Comparez les courbes de taux a differentes periodes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {isLoading ? "Chargement des donnees..." : "Aucune donnee disponible"}
          </div>
        </CardContent>
      </Card>
    )
  }

  const toggleCurve = (label: string) => {
    const newSelected = new Set(selectedCurves)
    if (newSelected.has(label)) {
      if (newSelected.size > 1) {
        newSelected.delete(label)
      }
    } else {
      newSelected.add(label)
    }
    setSelectedCurves(newSelected)
  }

  const chartData: Record<string, number | string>[] = []
  const maturities = currentCurve.points.map((p) => p.maturity)

  const filteredMaturities = maturities.filter((maturity) => {
    if (period === "ALL") return true

    const match = maturity.match(/(\d+)([YM])/)
    if (!match) return false
    const value = Number.parseInt(match[1])
    const unit = match[2]
    const years = unit === "Y" ? value : unit === "M" ? value / 12 : 0

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

  filteredMaturities.forEach((maturity, idx) => {
    const actualIdx = maturities.indexOf(maturity)
    const dataPoint: Record<string, number | string> = {
      maturity,
      years: currentCurve.points[actualIdx].days / 365,
    }

    if (selectedCurves.has("Actuelle")) {
      dataPoint["Actuelle"] = currentCurve.points[actualIdx]?.yield
    }

    historicalCurves.forEach((curve, curveIdx) => {
      const label = curve.date || `Historique_${curveIdx}`
      if (selectedCurves.has(label)) {
        const point = curve.observedPoints.find((p) => p.maturity === maturity)
        if (point) {
          dataPoint[label] = point.yield
        }
      }
    })

    chartData.push(dataPoint)
  })

  const allCurves = [
    { label: "Actuelle", color: HISTORICAL_COLORS["Actuelle"] },
    ...historicalCurves.map((curve, idx) => ({
      label: curve.date || `Historique_${idx}`,
      color: curve.color,
      date: curve.date,
    })),
  ]

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Comparaison Historique</CardTitle>
        <CardDescription className="text-muted-foreground">
          Comparez les courbes de taux a differentes periodes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ChartControls onPeriodChange={setPeriod} onAddLine={handleAddCurve} showAddLine={true} />
        <div className="flex flex-wrap gap-2">
          {allCurves.map((curve) => (
            <Button
              key={curve.label}
              variant={selectedCurves.has(curve.label) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleCurve(curve.label)}
              className="text-xs"
              style={{
                backgroundColor: selectedCurves.has(curve.label) ? curve.color : undefined,
                borderColor: curve.color,
              }}
            >
              <Calendar className="h-3 w-3 mr-1" />
              {curve.label === "Actuelle" ? "Actuelle" : curve.date}
            </Button>
          ))}
        </div>

        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="maturity" stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 12 }} />
              <YAxis
                domain={["auto", "auto"]}
                stroke="#9ca3af"
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                label={{ value: "Rendement (%)", angle: -90, position: "insideLeft", fill: "#d1d5db" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#f3f4f6",
                }}
                labelStyle={{ color: "#f3f4f6", fontWeight: "bold" }}
                formatter={(value: number) => [`${value.toFixed(3)}%`]}
              />
              <Legend formatter={(value: string) => <span style={{ color: "#d1d5db" }}>{value}</span>} />
              {allCurves.map((curve) =>
                selectedCurves.has(curve.label) ? (
                  <Line
                    key={curve.label}
                    type="monotone"
                    dataKey={curve.label}
                    stroke={curve.color}
                    strokeWidth={curve.label === "Actuelle" ? 3 : 2}
                    dot={{ fill: curve.color, stroke: "#ffffff", strokeWidth: 2, r: 5 }}
                    activeDot={{ fill: curve.color, stroke: "#ffffff", strokeWidth: 2, r: 7 }}
                    isAnimationActive={false}
                  />
                ) : null,
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8 text-muted-foreground">Aucune donnee historique disponible</div>
        )}

        <p className="text-xs text-muted-foreground pt-4 border-t border-border">Source: FRED et Banque du Canada</p>
      </CardContent>
    </Card>
  )
}
