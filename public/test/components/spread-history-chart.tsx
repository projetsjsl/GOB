"use client"

import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartControls } from "@/components/chart-controls"
import { useState } from "react"

const SPREAD_COLORS = {
  "2Y-10Y": "#10b981",
  "3M-10Y": "#3b82f6",
  "2Y-30Y": "#f59e0b",
}

function generateSpreadHistory() {
  const data = []
  const startDate = new Date()
  startDate.setFullYear(startDate.getFullYear() - 1)

  for (let i = 0; i < 365; i += 7) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)

    const t = i / 365
    data.push({
      date: date.toISOString().split("T")[0],
      "2Y-10Y": 0.3 + Math.sin(t * Math.PI * 2) * 0.4 + Math.random() * 0.1,
      "3M-10Y": 0.4 + Math.sin(t * Math.PI * 2 + 0.5) * 0.5 + Math.random() * 0.1,
      "2Y-30Y": 0.5 + Math.sin(t * Math.PI * 2 + 1) * 0.3 + Math.random() * 0.1,
    })
  }

  return data
}

export function SpreadHistoryChart() {
  const [period, setPeriod] = useState("ALL")
  const data = generateSpreadHistory()

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Historique des Ecarts (1 An)</CardTitle>
        <CardDescription className="text-muted-foreground">
          Evolution des principaux ecarts de rendement
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartControls onPeriodChange={setPeriod} showAddLine={false} />

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => {
                const date = new Date(value)
                return `${date.getDate()}/${date.getMonth() + 1}`
              }}
              stroke="#9ca3af"
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              interval="preserveStartEnd"
              minTickGap={50}
            />
            <YAxis
              stroke="#9ca3af"
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              label={{ value: "Ecart (%)", angle: -90, position: "insideLeft", fill: "#d1d5db" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#f3f4f6",
              }}
              labelFormatter={(value) => new Date(value as string).toLocaleDateString("fr-CA")}
              formatter={(value: number) => [`${value.toFixed(2)}%`]}
            />
            <Legend formatter={(value: string) => <span style={{ color: "#d1d5db" }}>{value}</span>} />
            <Line
              type="monotone"
              dataKey="2Y-10Y"
              stroke={SPREAD_COLORS["2Y-10Y"]}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="3M-10Y"
              stroke={SPREAD_COLORS["3M-10Y"]}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="2Y-30Y"
              stroke={SPREAD_COLORS["2Y-30Y"]}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="p-2 rounded bg-muted/30 text-center">
            <p className="text-xs text-muted-foreground">Moy. 2Y-10Y</p>
            <p className="text-sm font-semibold" style={{ color: SPREAD_COLORS["2Y-10Y"] }}>
              0.35%
            </p>
          </div>
          <div className="p-2 rounded bg-muted/30 text-center">
            <p className="text-xs text-muted-foreground">Moy. 3M-10Y</p>
            <p className="text-sm font-semibold" style={{ color: SPREAD_COLORS["3M-10Y"] }}>
              0.48%
            </p>
          </div>
          <div className="p-2 rounded bg-muted/30 text-center">
            <p className="text-xs text-muted-foreground">Moy. 2Y-30Y</p>
            <p className="text-sm font-semibold" style={{ color: SPREAD_COLORS["2Y-30Y"] }}>
              0.52%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
