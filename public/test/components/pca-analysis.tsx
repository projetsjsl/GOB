"use client"

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const pcaData = [
  { component: "CP1 (Niveau)", variance: 85.2, description: "Deplacements paralleles" },
  { component: "CP2 (Pente)", variance: 12.3, description: "Pentification/Aplatissement" },
  { component: "CP3 (Courbure)", variance: 2.5, description: "Mouvements papillon" },
]

const BAR_COLORS = ["#10b981", "#3b82f6", "#f59e0b"]

export function PCAAnalysis() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Analyse en Composantes Principales</CardTitle>
        <CardDescription className="text-muted-foreground">
          Decomposition des mouvements de la courbe des taux
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={pcaData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="component"
              stroke="#9ca3af"
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              angle={-15}
              textAnchor="end"
              height={80}
            />
            <YAxis
              stroke="#9ca3af"
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              label={{ value: "Variance Expliquee (%)", angle: -90, position: "insideLeft", fill: "#d1d5db" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#f3f4f6",
              }}
              formatter={(value: number) => [`${value}%`, "Variance"]}
            />
            <Bar dataKey="variance" radius={[4, 4, 0, 0]}>
              {pcaData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="space-y-3">
          {pcaData.map((pc, idx) => (
            <div key={pc.component} className="p-3 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: BAR_COLORS[idx] }} />
                  <span className="text-sm font-semibold text-foreground">{pc.component}</span>
                </div>
                <span className="text-lg font-bold" style={{ color: BAR_COLORS[idx] }}>
                  {pc.variance}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{pc.description}</p>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground leading-relaxed">
            L'ACP identifie les principaux moteurs des mouvements de la courbe des taux. Les trois premiers composants
            expliquent generalement plus de 99% de la variance.
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">Source: Reserve Federale des Etats-Unis</p>
        </div>
      </CardContent>
    </Card>
  )
}
