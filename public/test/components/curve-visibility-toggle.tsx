"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff } from "lucide-react"
import type { Country } from "@/lib/fred-api"

interface CurveVisibilityToggleProps {
  visibleCurves: Set<string>
  onToggleCurve: (curveId: string) => void
  availableCurves: Array<{
    id: string
    label: string
    color: string
    country: Country
  }>
}

export function CurveVisibilityToggle({ visibleCurves, onToggleCurve, availableCurves }: CurveVisibilityToggleProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-foreground">Courbes Visibles</CardTitle>
        <CardDescription className="text-muted-foreground">Sélectionnez les courbes à afficher</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {availableCurves.map((curve) => {
          const isVisible = visibleCurves.has(curve.id)
          return (
            <Button
              key={curve.id}
              variant={isVisible ? "default" : "outline"}
              size="sm"
              onClick={() => onToggleCurve(curve.id)}
              className="w-full justify-start gap-2 text-xs"
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: curve.color }} />
              <span className="flex-1 text-left">{curve.label}</span>
              {isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            </Button>
          )
        })}
      </CardContent>
    </Card>
  )
}
