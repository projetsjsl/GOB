"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ButterflySpread } from "@/lib/analytics"
import { ArrowDownUp, Info } from "lucide-react"
import { useState } from "react"

interface ButterflySpreadsProps {
  spreads: ButterflySpread[]
}

const BUTTERFLY_COLORS = ["#8b5cf6", "#ec4899", "#06b6d4"]

const BUTTERFLY_EXPLANATIONS: Record<string, { description: string; formula: string; interpretation: string }> = {
  "2-5-10": {
    description:
      "Mesure la courbure entre les obligations a court et moyen terme. Cet ecart examine la forme du segment court de la courbe.",
    formula: "(Taux 2Y + Taux 10Y) - 2 x (Taux 5Y)",
    interpretation:
      "Positif = La maturite 5Y est bon marche (pente forte) | Negatif = La maturite 5Y est chere (pente faible)",
  },
  "5-10-30": {
    description:
      "Mesure la courbure entre les obligations a moyen et long terme. Cet ecart examine la forme du segment long de la courbe.",
    formula: "(Taux 5Y + Taux 30Y) - 2 x (Taux 10Y)",
    interpretation:
      "Positif = La maturite 10Y est bon marche (pente forte) | Negatif = La maturite 10Y est chere (pente faible)",
  },
}

export function ButterflySpreadsCard({ spreads }: ButterflySpreadsProps) {
  const [expandedSpread, setExpandedSpread] = useState<string | null>(null)

  const spreadsList = Array.isArray(spreads) ? spreads : []

  if (spreadsList.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Spreads Papillon</CardTitle>
          <CardDescription className="text-muted-foreground">
            Analyse de la courbure et opportunites de trading structurees
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/30 text-center text-muted-foreground text-sm">
            Donnees de spreads papillon indisponibles
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Spreads Papillon</CardTitle>
        <CardDescription className="text-muted-foreground">
          Analyse de la courbure et opportunites de trading structurees
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {spreadsList.map((spread, idx) => {
          const color = BUTTERFLY_COLORS[idx % BUTTERFLY_COLORS.length]
          const explanation = BUTTERFLY_EXPLANATIONS[spread.name as keyof typeof BUTTERFLY_EXPLANATIONS]
          const isExpanded = expandedSpread === spread.name

          return (
            <div key={spread.name} className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedSpread(isExpanded ? null : spread.name)}
                className="w-full p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ArrowDownUp className="h-4 w-4" style={{ color }} />
                    <span className="font-semibold text-foreground">Papillon {spread.name}</span>
                  </div>
                  <span className="text-lg font-bold" style={{ color: spread.value > 0 ? "#10b981" : "#ef4444" }}>
                    {spread.value > 0 ? "+" : ""}
                    {(spread.value * 100).toFixed(2)} pb
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    Court: {spread.short1} + {spread.short2}
                  </span>
                  <span>|</span>
                  <span>Long: {spread.long}</span>
                </div>
              </button>

              {isExpanded && explanation && (
                <div className="p-4 bg-background border-t border-border space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Info className="h-4 w-4" style={{ color }} />
                      Qu'est-ce qu'un Papillon {spread.name}?
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{explanation.description}</p>
                  </div>

                  <div className="bg-muted/30 p-3 rounded border border-border/50">
                    <p className="text-xs font-mono text-foreground mb-1">Formule:</p>
                    <p className="text-xs font-mono text-muted-foreground">{explanation.formula}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-foreground mb-2">Interpretation:</p>
                    <p className="text-xs text-muted-foreground">{explanation.interpretation}</p>
                  </div>

                  <div className="bg-muted/20 p-3 rounded border-l-2 border-l-blue-500">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold">Strategie:</span> Un papillon positif suggere que la maturite
                      intermediaire est attrayante pour les investisseurs cherchant du rendement relatif.
                    </p>
                  </div>

                  <div className="text-xs text-muted-foreground bg-amber-950/20 p-3 rounded border-l-2 border-l-amber-600">
                    <p>
                      <span className="font-semibold">Note:</span> Les spreads papillon sont utilises par les traders
                      pour les strategies de spread trading, qui capturent les opportunites de mispricing entre
                      differentes maturites.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border/50 space-y-2">
          <p className="text-xs font-semibold text-foreground flex items-center gap-2">
            <Info className="h-4 w-4" />
            Comprendre les Spreads Papillon
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Un spread papillon mesure la courbure d'une section specifique de la courbe. La position s'appelle
            "papillon" car elle implique etre court sur deux maturites (les "ailes") et long sur une maturite
            intermediaire (le "corps"). Ces strategies capturent les changements de convexite et la forme de la courbe.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed mt-2">
            <span className="font-semibold">Cas d'usage:</span> Detection de courbure, arbitrage de spread,
            positionnement tactique base sur les changements de forme de courbe anticipes.
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">Source: Reserve Federale des Etats-Unis | FRED API</p>
        </div>
      </CardContent>
    </Card>
  )
}
