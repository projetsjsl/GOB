"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar, RefreshCw } from "lucide-react"
import type { InterpolationMethod } from "@/lib/interpolation"
import type { Country } from "@/lib/fred-api"

interface EnhancedControlsPanelProps {
  method: InterpolationMethod
  onMethodChange: (method: InterpolationMethod) => void
  onRefresh: () => void
  date?: string
  onDateChange?: (date: string) => void
  selectedCountries?: Country[]
  onCountriesChange?: (countries: Country[]) => void
}

export function EnhancedControlsPanel({
  method,
  onMethodChange,
  onRefresh,
  date,
  onDateChange,
  selectedCountries = ["US"],
  onCountriesChange,
}: EnhancedControlsPanelProps) {
  const handleCountryToggle = (country: Country, checked: boolean) => {
    if (!onCountriesChange) return
    if (checked) {
      if (!selectedCountries.includes(country)) {
        onCountriesChange([...selectedCountries, country])
      }
    } else {
      if (selectedCountries.length > 1) {
        onCountriesChange(selectedCountries.filter((c) => c !== country))
      }
    }
  }

  return (
    <Card className="bg-card border-border sticky top-4">
      <CardHeader>
        <CardTitle className="text-foreground">Controles</CardTitle>
        <CardDescription className="text-muted-foreground">Ajustez les parametres d'affichage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {onCountriesChange && (
          <div className="space-y-3 pb-4 border-b border-border">
            <Label className="text-foreground font-medium flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full" />
              Pays & Regions
            </Label>
            <div className="space-y-2">
              {["US", "CA"].map((country) => {
                const countryLabel = country === "US" ? "Tresor des Etats-Unis" : "Gouvernement Canadien"
                const countryColor = country === "US" ? "#3b82f6" : "#ef4444"
                return (
                  <div
                    key={country}
                    className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={`country-${country}`}
                      checked={selectedCountries.includes(country as Country)}
                      onCheckedChange={(checked) => handleCountryToggle(country as Country, checked as boolean)}
                    />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: countryColor }} />
                    <Label htmlFor={`country-${country}`} className="text-sm font-normal cursor-pointer flex-1">
                      {countryLabel}
                    </Label>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="space-y-3 pb-4 border-b border-border">
          <Label htmlFor="method" className="text-foreground font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full" />
            Interpolation
          </Label>
          <Select value={method} onValueChange={(value) => onMethodChange(value as InterpolationMethod)}>
            <SelectTrigger id="method" className="bg-background border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="linear">Lineaire</SelectItem>
              <SelectItem value="cubic-spline">Spline Cubique</SelectItem>
              <SelectItem value="nelson-siegel">Nelson-Siegel</SelectItem>
              <SelectItem value="monotone-cubic">Cubique Monotone</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {method === "linear" && "Interpolation lineaire simple entre les points"}
            {method === "cubic-spline" && "Interpolation par spline cubique lisse et naturelle"}
            {method === "nelson-siegel" && "Modele parametrique Nelson-Siegel pour courbes realistes"}
            {method === "monotone-cubic" && "Interpolation cubique monotone preservant la monotonie"}
          </p>
        </div>

        {onDateChange && (
          <div className="space-y-3 pb-4 border-b border-border">
            <Label htmlFor="date" className="text-foreground font-medium flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full" />
              Date des Donnees
            </Label>
            <div className="flex gap-2">
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => onDateChange(e.target.value)}
                className="bg-background border-border text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => onDateChange(new Date().toISOString().split("T")[0])}
                title="Aujourd'hui"
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Button onClick={onRefresh} className="w-full" variant="secondary">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser les Donnees
          </Button>
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Donnees provenant de {selectedCountries.includes("US") ? "FRED (Federal Reserve Economic Data)" : ""}
            {selectedCountries.includes("CA") && selectedCountries.includes("US") ? " et " : ""}
            {selectedCountries.includes("CA") ? "Banque du Canada" : ""}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
