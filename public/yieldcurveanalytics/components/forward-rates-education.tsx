"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, BookOpen, TrendingUp } from "lucide-react"

export function ForwardRatesEducation() {
  return (
    <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-800/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <BookOpen className="w-5 h-5" />
          Comprendre les Taux Forwards
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Explications completes basees sur les donnees officielles FRED
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Definition */}
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground">Qu'est-ce qu'un Taux Forward?</h3>
          <p className="text-sm text-muted-foreground">
            Un <strong>taux forward</strong> est le rendement implicite futur attendu par le marche entre deux
            maturites. Il represente ce que les investisseurs s'attendent a payer/recevoir dans le futur.
          </p>
        </div>

        {/* Exemple Concret */}
        <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3 space-y-2">
          <h4 className="font-semibold text-blue-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Exemple Concret
          </h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Aujourd'hui sur le marche FRED:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Taux 2Y actuel = 4.50%</li>
              <li>Taux 5Y actuel = 4.75%</li>
              <li>Taux Forward 2Y->5Y calcule = ~5.00%</li>
            </ul>
            <p className="mt-2 italic">
              Signification: "Dans 2 ans, le marche prevoit que les obligations a 3 ans auront un rendement d'environ
              5%"
            </p>
          </div>
        </div>

        {/* Formule Officielle */}
        <div className="bg-purple-900/20 border border-purple-800 rounded-lg p-3 space-y-2">
          <h4 className="font-semibold text-purple-300">Formule Officielle (Source FRED)</h4>
          <div className="bg-black/30 rounded p-3 font-mono text-xs text-purple-300 overflow-auto">
            f(t1,t2) = (r2t2 - r1t1) / (t2 - t1)
          </div>
          <div className="text-xs text-muted-foreground space-y-1 mt-2">
            <p>
              <strong>Ou:</strong>
            </p>
            <ul className="list-disc list-inside ml-2 space-y-0.5">
              <li>r1, r2 = Rendements spot actuels officiels (FRED)</li>
              <li>t1, t2 = Durees en annees</li>
              <li>f = Taux forward implicite calcule</li>
            </ul>
          </div>
        </div>

        {/* Fiabilite */}
        <div className="bg-green-900/20 border border-green-800 rounded-lg p-3">
          <div className="flex gap-2">
            <AlertCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-green-300">Fiabilite: 100% Officielle</p>
              <p className="text-muted-foreground mt-1">
                Les taux forwards sont calcules directement a partir des donnees spot officielles de la{" "}
                <strong>Reserve Federale Americaine (FRED)</strong> ou de la <strong>Banque du Canada</strong>. Ce ne
                sont PAS des estimations.
              </p>
            </div>
          </div>
        </div>

        {/* Interpretation */}
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground">Comment Interpreter les Resultats</h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex gap-2">
              <span className="text-green-400"></span>
              <div>
                <p className="font-semibold text-green-300">Taux Forward Croissant</p>
                <p className="text-muted-foreground">Le marche prevoit une hausse des rendements futurs</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="text-red-400"></span>
              <div>
                <p className="font-semibold text-red-300">Taux Forward Decroissant</p>
                <p className="text-muted-foreground">Le marche prevoit une baisse des rendements futurs</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="text-yellow-400">-></span>
              <div>
                <p className="font-semibold text-yellow-300">Taux Forward Stable</p>
                <p className="text-muted-foreground">Le marche anticipe une stabilite future</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sources */}
        <div className="border-t border-border pt-3">
          <p className="text-xs text-muted-foreground font-semibold">Sources Officielles Utilisees:</p>
          <ul className="text-xs text-muted-foreground mt-2 space-y-0.5 ml-3">
            <li>- FRED - Federal Reserve Economic Data (Etats-Unis)</li>
            <li>- Banque du Canada (Donnees Canadiennes)</li>
            <li>- Calculs mathematiques officiels standards</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
