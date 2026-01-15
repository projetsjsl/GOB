"use client"

import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, Zap } from "lucide-react"

interface GraphFiltersProps {
  filters: {
    showObserved: boolean
    showInterpolated: boolean
    scaleType: "linear" | "log"
    minMaturity: string
    maxMaturity: string
    opacity: number
  }
  onFiltersChange: (filters: any) => void
}

const MATURITIES = ["1M", "3M", "6M", "1Y", "2Y", "3Y", "5Y", "7Y", "10Y", "20Y", "30Y"]

export function GraphFilters({ filters, onFiltersChange }: GraphFiltersProps) {
  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="pt-4 space-y-3">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Filtres Graphique
        </CardTitle>

        {/* Affichage des donnees */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Affichage</label>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={filters.showObserved ? "default" : "outline"}
              onClick={() => onFiltersChange({ ...filters, showObserved: !filters.showObserved })}
              className="h-8 text-xs gap-1"
            >
              {filters.showObserved ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              Points Observes
            </Button>
            <Button
              size="sm"
              variant={filters.showInterpolated ? "default" : "outline"}
              onClick={() => onFiltersChange({ ...filters, showInterpolated: !filters.showInterpolated })}
              className="h-8 text-xs gap-1"
            >
              {filters.showInterpolated ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              Interpolation
            </Button>
          </div>
        </div>

        {/* Type d'echelle */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Echelle</label>
          <Select
            value={filters.scaleType}
            onValueChange={(val) => onFiltersChange({ ...filters, scaleType: val as "linear" | "log" })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="linear">Lineaire</SelectItem>
              <SelectItem value="log">Logarithmique</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Plage de maturites */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Maturites</label>
          <div className="flex gap-2">
            <Select
              value={filters.minMaturity}
              onValueChange={(val) => onFiltersChange({ ...filters, minMaturity: val })}
            >
              <SelectTrigger className="h-8 text-xs w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MATURITIES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">a</span>
            <Select
              value={filters.maxMaturity}
              onValueChange={(val) => onFiltersChange({ ...filters, maxMaturity: val })}
            >
              <SelectTrigger className="h-8 text-xs w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MATURITIES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Opacite */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Opacite ({(filters.opacity * 100).toFixed(0)}%)
          </label>
          <Slider
            value={[filters.opacity]}
            onValueChange={(val) => onFiltersChange({ ...filters, opacity: val[0] })}
            min={0.2}
            max={1}
            step={0.1}
            className="h-1"
          />
        </div>
      </CardContent>
    </Card>
  )
}
