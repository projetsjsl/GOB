"use client"

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { YieldDataPoint } from "@/lib/fred-api"
import { ChartControls } from "@/components/chart-controls"
import { useState } from "react"

interface CountrySpreadChartProps {
  usData: YieldDataPoint[]
  caData: YieldDataPoint[]
}

export function CountrySpreadChart({ usData, caData }: CountrySpreadChartProps) {
  const [period, setPeriod] = useState("ALL")

  // Calculate spread between US and CA yields at each maturity
  const spreadData = usData.map((usPoint) => {
    const caPoint = caData.find((p) => p.maturity === usPoint.maturity)
    const spread = caPoint ? usPoint.yield - caPoint.yield : 0

    return {
      maturity: usPoint.maturity,
      spread: spread,
      usYield: usPoint.yield,
      caYield: caPoint?.yield || 0,
    }
  })

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Ecart de Rendement Etats-Unis-Canada</CardTitle>
        <CardDescription className="text-muted-foreground">
          Difference entre les rendements des obligations du Tresor americain et des obligations d'Etat canadiennes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartControls onPeriodChange={setPeriod} showAddLine={false} />

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={spreadData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="maturity" stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 12 }} />
            <YAxis
              stroke="#9ca3af"
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              label={{ value: "Ecart (pb)", angle: -90, position: "insideLeft", fill: "#d1d5db" }}
              tickFormatter={(value) => `${(value * 100).toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#f3f4f6",
              }}
              formatter={(value: number, name: string) => {
                if (name === "spread") {
                  return [`${(value * 100).toFixed(1)} pb`, "Ecart US-CA"]
                }
                return [`${value.toFixed(2)}%`, name === "usYield" ? "Rendement US" : "Rendement CA"]
              }}
            />
            <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
            <Bar dataKey="spread" radius={[4, 4, 0, 0]}>
              {spreadData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.spread >= 0 ? "#10b981" : "#ef4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="p-2 rounded bg-muted/30 text-center">
            <p className="text-xs text-muted-foreground">Ecart Moyen</p>
            <p className="text-sm font-semibold text-foreground">
              {((spreadData.reduce((sum, d) => sum + d.spread, 0) / spreadData.length) * 100).toFixed(1)} pb
            </p>
          </div>
          <div className="p-2 rounded bg-muted/30 text-center">
            <p className="text-xs text-muted-foreground">Ecart 10Y</p>
            <p className="text-sm font-semibold text-foreground">
              {((spreadData.find((d) => d.maturity === "10Y")?.spread || 0) * 100).toFixed(1)} pb
            </p>
          </div>
          <div className="p-2 rounded bg-muted/30 text-center">
            <p className="text-xs text-muted-foreground">Ecart 30Y</p>
            <p className="text-sm font-semibold text-foreground">
              {((spreadData.find((d) => d.maturity === "30Y")?.spread || 0) * 100).toFixed(1)} pb
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">Source: Reserve Federale des Etats-Unis et Banque du Canada</p>
        </div>
      </CardContent>
    </Card>
  )
}
