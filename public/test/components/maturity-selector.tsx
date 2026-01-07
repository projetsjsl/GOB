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
            <CardTitle className="text-foreground">Maturités</CardTitle>
            <CardDescription className="text-muted-foreground">Sélectionnez les maturités à afficher</CardDescription>
          </div>
          <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
            {selectedMaturities.length}/{MATURITIES.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {MATURITIES.map((maturity) => (
            <Button
              key={maturity}
              variant={selectedMaturities.includes(maturity) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleMaturity(maturity)}
              className="text-xs font-medium transition-all"
            >
              {maturity}
            </Button>
          ))}
        </div>

        <div className="flex gap-2 pt-2 border-t border-border">
          <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs flex-1">
            Tout Sélectionner
          </Button>
          <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs flex-1">
            Effacer
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
