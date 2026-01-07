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

        {/* Affichage des données */}
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
              Points Observés
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

        {/* Type d'échelle */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Échelle</label>
          <Select
            value={filters.scaleType}
            onValueChange={(val) => onFiltersChange({ ...filters, scaleType: val as "linear" | "log" })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="linear">Linéaire</SelectItem>
              <SelectItem value="log">Logarithmique</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Plage de maturités */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Maturités</label>
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
            <span className="text-xs text-muted-foreground">à</span>
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

        {/* Opacité */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Opacité ({(filters.opacity * 100).toFixed(0)}%)
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
