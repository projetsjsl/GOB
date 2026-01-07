"use client"
import { Button } from "@/components/ui/button"
import { Calendar, Plus, X } from "lucide-react"
import { useState } from "react"

interface ChartControlsProps {
  onPeriodChange?: (period: string) => void
  onAddLine?: () => void
  onRemoveLine?: () => void
  hasAdditionalLines?: boolean
  showAddLine?: boolean
  defaultPeriod?: string
}

export function ChartControls({
  onPeriodChange,
  onAddLine,
  onRemoveLine,
  hasAdditionalLines = false,
  showAddLine = true,
  defaultPeriod = "1Y",
}: ChartControlsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriod)
  const periods = ["1J", "1W", "1M", "3M", "6M", "1Y", "2Y", "5Y", "ALL"]

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period)
    onPeriodChange?.(period)
  }

  return (
    <div className="flex flex-wrap gap-3 items-center mb-4">
      {/* Période */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-wrap">
          {periods.map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? "default" : "outline"}
              size="sm"
              className={`h-8 px-3 text-xs font-semibold transition-all ${
                selectedPeriod === period 
                  ? 'shadow-lg shadow-blue-500/25' 
                  : 'hover:border-zinc-500'
              }`}
              onClick={() => handlePeriodChange(period)}
              aria-pressed={selectedPeriod === period}
            >
              {period}
            </Button>
          ))}
        </div>
      </div>

      {/* Ajout de lignes */}
      {showAddLine && (
        <div className="flex gap-2 ml-auto">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-3 text-xs gap-1.5 font-medium hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-400 transition-all" 
            onClick={onAddLine}
          >
            <Plus className="w-3.5 h-3.5" />
            Ajouter courbe
          </Button>
          {hasAdditionalLines && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs gap-1.5 font-medium text-red-400 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-300 transition-all"
              onClick={onRemoveLine}
            >
              <X className="w-3.5 h-3.5" />
              Supprimer
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
