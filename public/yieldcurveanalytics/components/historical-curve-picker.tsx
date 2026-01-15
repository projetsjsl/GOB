"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface HistoricalCurve {
  id: string
  date: string
  country: "US" | "CA"
  label?: string
  color: string
  data?: any
}

interface HistoricalCurvePickerProps {
  selectedCurves: HistoricalCurve[]
  onCurvesChange: (curves: HistoricalCurve[]) => void
  onLoadCurve: (date: string, country: string) => Promise<any>
  maxCurves?: number
}

// Couleurs predefinies pour les courbes historiques
const CURVE_COLORS = [
  "#f59e0b", // amber
  "#10b981", // emerald  
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
]

// Dates suggerees (evenements economiques importants)
const SUGGESTED_DATES = [
  { date: "2024-01-02", label: "Debut 2024" },
  { date: "2023-10-19", label: "Pic des taux 2023" },
  { date: "2023-03-08", label: "Crise bancaire SVB" },
  { date: "2022-12-14", label: "Derniere hausse FED 2022" },
  { date: "2022-03-16", label: "1ere hausse FED 2022" },
  { date: "2020-03-09", label: "COVID Crash" },
]

export function HistoricalCurvePicker({
  selectedCurves,
  onCurvesChange,
  onLoadCurve,
  maxCurves = 5
}: HistoricalCurvePickerProps) {
  const [newDate, setNewDate] = useState("")
  const [newCountry, setNewCountry] = useState<"US" | "CA">("US")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddCurve = async () => {
    if (!newDate) {
      setError("Veuillez selectionner une date")
      return
    }

    if (selectedCurves.length >= maxCurves) {
      setError(`Maximum ${maxCurves} courbes historiques`)
      return
    }

    // Verifier si cette courbe existe deja
    const exists = selectedCurves.some(c => c.date === newDate && c.country === newCountry)
    if (exists) {
      setError("Cette courbe est deja selectionnee")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await onLoadCurve(newDate, newCountry.toLowerCase())
      
      if (!data || !data.rates || data.rates.length === 0) {
        setError("Aucune donnee disponible pour cette date")
        setLoading(false)
        return
      }

      const colorIndex = selectedCurves.length % CURVE_COLORS.length
      const newCurve: HistoricalCurve = {
        id: `${newCountry}-${newDate}`,
        date: newDate,
        country: newCountry,
        label: `${newCountry} ${newDate}`,
        color: CURVE_COLORS[colorIndex],
        data
      }

      onCurvesChange([...selectedCurves, newCurve])
      setNewDate("")
    } catch (err) {
      setError("Erreur lors du chargement des donnees")
      console.error("Error loading historical curve:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveCurve = (id: string) => {
    onCurvesChange(selectedCurves.filter(c => c.id !== id))
  }

  const handleAddSuggested = async (date: string, label: string) => {
    setNewDate(date)
    // Trigger load after state update
    setTimeout(() => handleAddCurve(), 100)
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Courbes Historiques
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Comparez avec des donnees passees
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {selectedCurves.length}/{maxCurves}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected curves */}
        {selectedCurves.length > 0 && (
          <div className="space-y-2">
            <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">
              Courbes selectionnees
            </Label>
            <div className="flex flex-wrap gap-2">
              {selectedCurves.map(curve => (
                <div
                  key={curve.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ 
                    backgroundColor: `${curve.color}15`,
                    borderColor: `${curve.color}40`,
                    borderWidth: 1,
                    borderStyle: 'solid'
                  }}
                >
                  <span 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: curve.color }}
                  />
                  <span style={{ color: curve.color }}>
                    {curve.country} - {curve.date}
                  </span>
                  <button
                    onClick={() => handleRemoveCurve(curve.id)}
                    className="ml-1 text-zinc-500 hover:text-red-400 transition-colors"
                    title="Supprimer"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add new curve */}
        <div className="space-y-3 pt-3 border-t border-border">
          <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">
            Ajouter une courbe
          </Label>
          
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="h-9 text-sm"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="flex gap-1">
              <Button
                variant={newCountry === "US" ? "default" : "outline"}
                size="sm"
                className="h-9 px-3 text-xs"
                onClick={() => setNewCountry("US")}
              >
                 US
              </Button>
              <Button
                variant={newCountry === "CA" ? "default" : "outline"}
                size="sm"
                className="h-9 px-3 text-xs"
                onClick={() => setNewCountry("CA")}
              >
                 CA
              </Button>
            </div>
          </div>

          <Button
            onClick={handleAddCurve}
            disabled={loading || !newDate || selectedCurves.length >= maxCurves}
            className="w-full h-9 text-xs font-semibold"
            variant="secondary"
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2"></span>
                Chargement...
              </>
            ) : (
              <>
                <span className="mr-2"></span>
                Charger la Courbe Historique
              </>
            )}
          </Button>

          {error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}
        </div>

        {/* Suggested dates */}
        <div className="space-y-2 pt-3 border-t border-border">
          <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">
            Dates suggerees
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_DATES.map(({ date, label }) => (
              <button
                key={date}
                onClick={() => {
                  setNewDate(date)
                }}
                className="px-2 py-1 text-[10px] rounded-md bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors border border-zinc-700/50"
                title={`${label} (${date})`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Export for window
if (typeof window !== 'undefined') {
  (window as any).HistoricalCurvePicker = HistoricalCurvePicker
}
