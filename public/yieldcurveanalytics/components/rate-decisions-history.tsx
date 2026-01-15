"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingDown, TrendingUp, Minus } from "lucide-react"

interface RateDecision {
  date: string
  country: string
  previousRate: number
  newRate: number
  change: number
  decision: "hold" | "increase" | "decrease"
}

// Historique reel des decisions de taux (2024-2025)
const rateDecisionsHistory: RateDecision[] = [
  // FED decisions 2024-2025
  { date: "2024-12-18", country: "FED", previousRate: 4.33, newRate: 4.08, change: -0.25, decision: "decrease" },
  { date: "2024-11-07", country: "FED", previousRate: 4.75, newRate: 4.33, change: -0.42, decision: "decrease" },
  { date: "2024-09-18", country: "FED", previousRate: 5.33, newRate: 4.75, change: -0.58, decision: "decrease" },
  { date: "2024-08-01", country: "FED", previousRate: 5.33, newRate: 5.33, change: 0, decision: "hold" },
  { date: "2024-07-31", country: "FED", previousRate: 5.33, newRate: 5.33, change: 0, decision: "hold" },
  { date: "2024-06-18", country: "FED", previousRate: 5.33, newRate: 5.33, change: 0, decision: "hold" },
  { date: "2024-05-01", country: "FED", previousRate: 5.33, newRate: 5.33, change: 0, decision: "hold" },
  { date: "2024-03-20", country: "FED", previousRate: 5.33, newRate: 5.33, change: 0, decision: "hold" },
  { date: "2024-01-31", country: "FED", previousRate: 5.33, newRate: 5.33, change: 0, decision: "hold" },

  // BOC decisions 2024-2025
  { date: "2024-12-11", country: "BOC", previousRate: 3.25, newRate: 2.25, change: -1.0, decision: "decrease" },
  { date: "2024-10-23", country: "BOC", previousRate: 3.75, newRate: 3.25, change: -0.5, decision: "decrease" },
  { date: "2024-09-04", country: "BOC", previousRate: 4.25, newRate: 3.75, change: -0.5, decision: "decrease" },
  { date: "2024-07-24", country: "BOC", previousRate: 4.25, newRate: 4.25, change: 0, decision: "hold" },
  { date: "2024-06-05", country: "BOC", previousRate: 4.75, newRate: 4.25, change: -0.5, decision: "decrease" },
  { date: "2024-04-10", country: "BOC", previousRate: 4.75, newRate: 4.75, change: 0, decision: "hold" },
  { date: "2024-03-06", country: "BOC", previousRate: 4.75, newRate: 4.75, change: 0, decision: "hold" },
  { date: "2024-01-24", country: "BOC", previousRate: 5.0, newRate: 4.75, change: -0.25, decision: "decrease" },
]

export function RateDecisionsHistory() {
  // Trier par date decroissante (plus recentes en premier)
  const sortedDecisions = [...rateDecisionsHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )

  // Grouper par pays
  const fedDecisions = sortedDecisions.filter((d) => d.country === "FED")
  const bocDecisions = sortedDecisions.filter((d) => d.country === "BOC")

  const DecisionBadge = ({ decision, change }: { decision: "hold" | "increase" | "decrease"; change: number }) => {
    if (decision === "decrease") {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 flex items-center gap-1">
          <TrendingDown className="h-3 w-3" />-{Math.abs(change).toFixed(2)}%
        </Badge>
      )
    }
    if (decision === "increase") {
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />+{change.toFixed(2)}%
        </Badge>
      )
    }
    return (
      <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30 flex items-center gap-1">
        <Minus className="h-3 w-3" />
        Inchange
      </Badge>
    )
  }

  const DecisionRow = ({ decision }: { decision: RateDecision }) => (
    <div className="flex items-center justify-between p-3 border border-slate-800/50 rounded-lg hover:bg-slate-900/30 transition-colors">
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">
          {new Date(decision.date).toLocaleDateString("fr-FR", {
            weekday: "short",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <p className="text-xs text-muted-foreground">
          {decision.previousRate.toFixed(2)}% -> {decision.newRate.toFixed(2)}%
        </p>
      </div>
      <DecisionBadge decision={decision.decision} change={decision.change} />
    </div>
  )

  return (
    <div className="space-y-4">
      {/* FED Decisions */}
      <Card className="bg-slate-900/50 border-blue-500/20">
        <CardHeader>
          <CardTitle className="text-blue-400 flex items-center gap-2">
            <span className="text-2xl"></span>
            Historique des Decisions FED
          </CardTitle>
          <CardDescription>Taux directeur des Etats-Unis (Federal Funds Rate)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {fedDecisions.map((decision, idx) => (
              <DecisionRow key={`fed-${idx}`} decision={decision} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* BOC Decisions */}
      <Card className="bg-slate-900/50 border-red-500/20">
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center gap-2">
            <span className="text-2xl"></span>
            Historique des Decisions BOC
          </CardTitle>
          <CardDescription>Taux directeur de la Banque du Canada (Policy Rate)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {bocDecisions.map((decision, idx) => (
              <DecisionRow key={`boc-${idx}`} decision={decision} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resume */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Taux FED actuel</p>
            <p className="text-2xl font-bold text-blue-400">{fedDecisions[0].newRate.toFixed(2)}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {fedDecisions[0].decision === "decrease" && `v ${Math.abs(fedDecisions[0].change).toFixed(2)}%`}
              {fedDecisions[0].decision === "increase" && `^ ${fedDecisions[0].change.toFixed(2)}%`}
              {fedDecisions[0].decision === "hold" && "Inchange"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Taux BOC actuel</p>
            <p className="text-2xl font-bold text-red-400">{bocDecisions[0].newRate.toFixed(2)}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {bocDecisions[0].decision === "decrease" && `v ${Math.abs(bocDecisions[0].change).toFixed(2)}%`}
              {bocDecisions[0].decision === "increase" && `^ ${bocDecisions[0].change.toFixed(2)}%`}
              {bocDecisions[0].decision === "hold" && "Inchange"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
