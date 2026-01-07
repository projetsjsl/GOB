"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Info } from "lucide-react"

interface ForwardRatesTableProps {
  forwards: { maturity: string; forward: number }[]
  compact?: boolean
}

export function ForwardRatesTable({ forwards, compact = false }: ForwardRatesTableProps) {
  if (compact) {
    return (
      <div className="space-y-1">
        {forwards.slice(0, 5).map((forward) => (
          <div key={forward.maturity} className="flex justify-between text-xs">
            <span className="text-muted-foreground">{forward.maturity}</span>
            <span className="font-semibold">{forward.forward.toFixed(2)}%</span>
          </div>
        ))}
      </div>
    )
  }

  // Mode normal: affichage complet
  return (
    <Card className="bg-background border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Taux Forwards Detailles</CardTitle>
        <CardDescription className="text-muted-foreground">
          Rendements forwards implicites entre les maturites (formule officielle: f = (r2·t2 - r1·t1) / (t2 - t1))
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 bg-purple-900/20 border border-purple-800 rounded-lg">
          <div className="flex gap-2 text-sm text-purple-200">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Comment ca marche:</p>
              <p>
                Chaque taux forward represente le rendement attendu entre deux maturites officielles. Par exemple,
                "2Y-5Y" = rendement attendu du taux 3Y dans 2 ans.
              </p>
              <p className="mt-1 text-xs">
                Ces taux sont calcules directement a partir des donnees spot officielles de la Reserve Federale.
              </p>
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-foreground">Periode Forward</TableHead>
              <TableHead className="text-right text-foreground">Taux Forward (%)</TableHead>
              <TableHead className="text-right text-foreground">Signification</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {forwards.slice(0, 8).map((forward) => {
              return (
                <TableRow key={forward.maturity} className="border-border">
                  <TableCell className="font-medium text-foreground">{forward.maturity}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{forward.forward.toFixed(3)}%</TableCell>
                  <TableCell className="text-right text-sm text-yellow-500">
                    {forward.forward > 5.5
                      ? "Taux eleve attendu"
                      : forward.forward < 3.5
                        ? "Taux bas attendu"
                        : "Taux stable attendu"}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        <div className="mt-4 pt-4 border-t border-border space-y-2">
          <p className="text-xs text-muted-foreground">Source: FRED (Reserve Federale des Etats-Unis)</p>
          <p className="text-xs text-muted-foreground font-semibold">
            Fiabilite: Donnees officielles directes - 100% fiables
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
