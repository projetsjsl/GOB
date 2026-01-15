"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface MaturitySelectorProps {
  selectedMaturities: string[]
  onMaturitiesChange: (maturities: string[]) => void
}

const MATURITIES = ["3M", "6M", "1Y", "2Y", "3Y", "5Y", "7Y", "10Y", "20Y", "30Y"]

export function MaturitySelector({ selectedMaturities, onMaturitiesChange }: MaturitySelectorProps) {
  const toggleMaturity = (maturity: string) => {
    if (selectedMaturities.includes(maturity)) {
      onMaturitiesChange(selectedMaturities.filter((m) => m !== maturity))
    } else {
      onMaturitiesChange([...selectedMaturities, maturity])
    }
  }

  const selectAll = () => onMaturitiesChange(MATURITIES)
  const clearAll = () => onMaturitiesChange([])

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground text-sm font-bold">Maturites</CardTitle>
            <CardDescription className="text-muted-foreground text-xs">Points de la courbe a afficher</CardDescription>
          </div>
          <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-full border border-blue-500/30">
            {selectedMaturities.length}/{MATURITIES.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {MATURITIES.map((maturity) => {
            const isSelected = selectedMaturities.includes(maturity)
            return (
              <Button
                key={maturity}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => toggleMaturity(maturity)}
                aria-pressed={isSelected}
                className={`h-8 px-3 text-xs font-semibold transition-all ${
                  isSelected 
                    ? 'shadow-md shadow-blue-500/20' 
                    : 'hover:border-zinc-500 hover:text-white'
                }`}
              >
                {maturity}
              </Button>
            )
          })}
        </div>

        <div className="flex gap-2 pt-3 border-t border-zinc-800">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={selectAll} 
            className="text-xs flex-1 font-medium hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors"
          >
            Tout Selectionner
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAll} 
            className="text-xs flex-1 font-medium hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            Effacer
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
