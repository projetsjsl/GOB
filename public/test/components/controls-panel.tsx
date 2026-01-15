"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar, RefreshCw, Info } from "lucide-react"
import type { Country } from "@/lib/fred-api"

interface ControlsPanelProps {
  onRefresh: () => void
  date?: string
  onDateChange?: (date: string) => void
  selectedCountries?: Country[]
  onCountriesChange?: (countries: Country[]) => void
}

export function ControlsPanel({
  onRefresh,
  date,
  onDateChange,
  selectedCountries = ["US"],
  onCountriesChange,
}: ControlsPanelProps) {
  const handleCountryToggle = (country: Country, checked: boolean) => {
    if (!onCountriesChange) return

    if (checked) {
      onCountriesChange([...selectedCountries, country])
    } else {
      onCountriesChange(selectedCountries.filter((c) => c !== country))
    }
  }

  return (
    <Card className="bg-background border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Controles</CardTitle>
        <CardDescription className="text-muted-foreground">Selectionnez les donnees et les pays</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {onCountriesChange && (
          <div className="space-y-2">
            <Label className="text-foreground">Pays</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="country-us"
                  checked={selectedCountries.includes("US")}
                  onCheckedChange={(checked) => handleCountryToggle("US", checked as boolean)}
                />
                <Label htmlFor="country-us" className="text-sm font-normal cursor-pointer">
                  Tresor des Etats-Unis
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="country-ca"
                  checked={selectedCountries.includes("CA")}
                  onCheckedChange={(checked) => handleCountryToggle("CA", checked as boolean)}
                />
                <Label htmlFor="country-ca" className="text-sm font-normal cursor-pointer">
                  Gouvernement Canadien
                </Label>
              </div>
            </div>
          </div>
        )}

        {onDateChange && (
          <div className="space-y-2">
            <Label htmlFor="date" className="text-foreground">
              Date
            </Label>
            <div className="flex gap-2">
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => onDateChange(e.target.value)}
                className="bg-background border-border"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => onDateChange(new Date().toISOString().split("T")[0])}
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <Button onClick={onRefresh} className="w-full" variant="secondary">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser les Donnees
        </Button>

        <div className="pt-4 border-t border-border bg-blue-950 bg-opacity-30 rounded-lg p-3 space-y-2">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-200">
              <p className="font-semibold mb-1">Donnees Officielles Directes</p>
              <p>Points de marche reels: 3M, 6M, 1Y, 2Y, 3Y, 5Y, 7Y, 10Y, 20Y, 30Y</p>
              <p>Courbe lisse: Interpolation Cubic Spline</p>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Source: {selectedCountries.includes("US") ? "FRED (Federal Reserve Economic Data)" : ""}
            {selectedCountries.includes("CA") && selectedCountries.includes("US") ? " et " : ""}
            {selectedCountries.includes("CA") ? "Banque du Canada" : ""}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
