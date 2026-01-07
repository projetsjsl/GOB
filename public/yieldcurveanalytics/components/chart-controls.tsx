"use client"
import { Button } from "@/components/ui/button"
import { Calendar, Plus, X } from "lucide-react"

interface ChartControlsProps {
  onPeriodChange?: (period: string) => void
  onAddLine?: () => void
  onRemoveLine?: () => void
  hasAdditionalLines?: boolean
  showAddLine?: boolean
}

export function ChartControls({
  onPeriodChange,
  onAddLine,
  onRemoveLine,
  hasAdditionalLines = false,
  showAddLine = true,
}: ChartControlsProps) {
  const periods = ["1J", "1W", "1M", "3M", "6M", "1Y", "2Y", "5Y", "ALL"]

  return (
    <div className="flex flex-wrap gap-2 items-center mb-4">
      {/* Période */}
      <div className="flex items-center gap-1">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <div className="flex gap-1 flex-wrap">
          {periods.map((period) => (
            <Button
              key={period}
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs bg-transparent"
              onClick={() => onPeriodChange?.(period)}
            >
              {period}
            </Button>
          ))}
        </div>
      </div>

      {/* Ajout de lignes */}
      {showAddLine && (
        <div className="flex gap-1 ml-auto">
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1 bg-transparent" onClick={onAddLine}>
            <Plus className="w-3 h-3" />
            Ajouter courbe
          </Button>
          {hasAdditionalLines && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs gap-1 text-red-400 hover:text-red-300 bg-transparent"
              onClick={onRemoveLine}
            >
              <X className="w-3 h-3" />
              Supprimer
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
