"use client"

import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { ChartControls } from "@/components/chart-controls"
import { useState } from "react"

interface ForwardRatesChartProps {
  forwards: { maturity: string; forward: number }[]
  spotRate: number
}

export function ForwardRatesChart({ forwards, spotRate }: ForwardRatesChartProps) {
  const [period, setPeriod] = useState("ALL")
  const chartData = (forwards || [])
    .filter((f) => f && f.maturity && typeof f.maturity === "string")
    .map((f, i) => ({
      ...f,
      index: i,
      label: f.maturity.replace("->", "->\n") || "N/A",
    }))

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Courbe des Taux Forwards</CardTitle>
          <CardDescription className="text-muted-foreground">
            Rendements forwards implicites entre les maturites (calcules a partir des donnees officielles FRED)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center text-muted-foreground">Donnees de taux forwards indisponibles</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Courbe des Taux Forwards</CardTitle>
        <CardDescription className="text-muted-foreground">
          Rendements forwards implicites entre les maturites (calcules a partir des donnees officielles FRED)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartControls onPeriodChange={setPeriod} showAddLine={false} />

        <div className="mb-4 p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
          <div className="flex gap-2 text-sm text-blue-200">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Ce que vous voyez:</p>
              <p>
                Les taux forwards implicites entre chaque paire de maturites. Par exemple, "2Y->5Y" montre le taux
                d'interet attendu dans 2 ans pour une obligation a 3 ans.
              </p>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <defs>
              <linearGradient id="forwardGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="maturity"
              stroke="#9ca3af"
              tick={{ fill: "#9ca3af", fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis
              domain={["auto", "auto"]}
              stroke="#9ca3af"
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              label={{ value: "Taux Forward (%)", angle: -90, position: "insideLeft", fill: "#d1d5db" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#f3f4f6",
              }}
              formatter={(value: number) => [`${value.toFixed(3)}%`, "Taux Forward"]}
              labelFormatter={(label) => `Periode: ${label}`}
            />
            <ReferenceLine
              y={spotRate}
              stroke="#f59e0b"
              strokeDasharray="5 5"
              label={{ value: `Taux Spot Actuel: ${spotRate.toFixed(2)}%`, fill: "#f59e0b", fontSize: 11 }}
            />
            <Area
              type="monotone"
              dataKey="forward"
              stroke="#8b5cf6"
              strokeWidth={2}
              fill="url(#forwardGradient)"
              dot={{ fill: "#8b5cf6", stroke: "#ffffff", strokeWidth: 2, r: 4 }}
              activeDot={{ fill: "#8b5cf6", stroke: "#ffffff", strokeWidth: 2, r: 6 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-violet-500" />
              <span>Taux Forwards</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-amber-500" style={{ borderTop: "2px dashed #f59e0b" }} />
              <span>Taux Spot Actuel</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Source: FRED (Reserve Federale des Etats-Unis) / Banque du Canada
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
