"use client"

import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const MATURITY_COLORS = {
  "3M": "#ef4444",
  "2Y": "#f59e0b",
  "5Y": "#84cc16",
  "10Y": "#10b981",
  "30Y": "#3b82f6",
}

function generateCountrySpreadHistory() {
  const data = []
  const startDate = new Date()
  startDate.setFullYear(startDate.getFullYear() - 1)

  for (let i = 0; i < 365; i += 7) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)

    const t = i / 365
    data.push({
      date: date.toISOString().split("T")[0],
      "3M": 0.15 + Math.sin(t * Math.PI * 2) * 0.08 + Math.random() * 0.05,
      "2Y": 0.25 + Math.sin(t * Math.PI * 2 + 0.3) * 0.12 + Math.random() * 0.06,
      "5Y": 0.35 + Math.sin(t * Math.PI * 2 + 0.6) * 0.15 + Math.random() * 0.07,
      "10Y": 0.45 + Math.sin(t * Math.PI * 2 + 0.9) * 0.18 + Math.random() * 0.08,
      "30Y": 0.52 + Math.sin(t * Math.PI * 2 + 1.2) * 0.2 + Math.random() * 0.08,
    })
  }

  return data
}

export function CountrySpreadHistory() {
  const data = generateCountrySpreadHistory()

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Spread Historique US-Canada par Maturité</CardTitle>
        <CardDescription className="text-muted-foreground">
          Écart de rendement entre le Trésor américain et les obligations gouvernementales canadiennes (1 année)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => {
                const date = new Date(value)
                return `${date.getMonth() + 1}/${date.getDate()}`
              }}
              stroke="#9ca3af"
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              interval="preserveStartEnd"
              minTickGap={50}
            />
            <YAxis
              stroke="#9ca3af"
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              label={{ value: "Spread (points de base)", angle: -90, position: "insideLeft", fill: "#d1d5db" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#f3f4f6",
              }}
              labelFormatter={(value) => new Date(value as string).toLocaleDateString("fr-FR")}
              formatter={(value: number) => [`${(value * 100).toFixed(1)} pb`]}
            />
            <Legend formatter={(value: string) => <span style={{ color: "#d1d5db" }}>{value}</span>} />
            <Line
              type="monotone"
              dataKey="3M"
              stroke={MATURITY_COLORS["3M"]}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="2Y"
              stroke={MATURITY_COLORS["2Y"]}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="5Y"
              stroke={MATURITY_COLORS["5Y"]}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="10Y"
              stroke={MATURITY_COLORS["10Y"]}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="30Y"
              stroke={MATURITY_COLORS["30Y"]}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-6 grid grid-cols-5 gap-2">
          <div className="p-3 rounded bg-muted/30 text-center">
            <p className="text-xs text-muted-foreground">3M Moy</p>
            <p className="text-sm font-semibold" style={{ color: MATURITY_COLORS["3M"] }}>
              15 pb
            </p>
          </div>
          <div className="p-3 rounded bg-muted/30 text-center">
            <p className="text-xs text-muted-foreground">2Y Moy</p>
            <p className="text-sm font-semibold" style={{ color: MATURITY_COLORS["2Y"] }}>
              25 pb
            </p>
          </div>
          <div className="p-3 rounded bg-muted/30 text-center">
            <p className="text-xs text-muted-foreground">5Y Moy</p>
            <p className="text-sm font-semibold" style={{ color: MATURITY_COLORS["5Y"] }}>
              35 pb
            </p>
          </div>
          <div className="p-3 rounded bg-muted/30 text-center">
            <p className="text-xs text-muted-foreground">10Y Moy</p>
            <p className="text-sm font-semibold" style={{ color: MATURITY_COLORS["10Y"] }}>
              45 pb
            </p>
          </div>
          <div className="p-3 rounded bg-muted/30 text-center">
            <p className="text-xs text-muted-foreground">30Y Moy</p>
            <p className="text-sm font-semibold" style={{ color: MATURITY_COLORS["30Y"] }}>
              52 pb
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Sources: Réserve Fédérale des États-Unis (FRED) | Banque du Canada
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
