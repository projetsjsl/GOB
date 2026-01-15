"use client"
import type { Country } from "@/lib/fred-api"
import { Check } from "lucide-react"

const COUNTRY_FLAGS: Record<string, string> = {
  US: "",
  CA: "",
}

const COUNTRY_LABELS: Record<string, string> = {
  US: "Etats-Unis",
  CA: "Canada",
}

interface CountrySelectorProps {
  selectedCountries: Country[]
  onCountriesChange: (countries: Country[]) => void
}

export function CountrySelector({ selectedCountries, onCountriesChange }: CountrySelectorProps) {
  const toggleCountry = (country: Country) => {
    if (selectedCountries.includes(country)) {
      if (selectedCountries.length > 1) {
        onCountriesChange(selectedCountries.filter((c) => c !== country))
      }
    } else {
      onCountriesChange([...selectedCountries, country])
    }
  }

  return (
    <div className="flex flex-col gap-3 p-3 bg-card border border-border rounded-lg">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold uppercase text-muted-foreground">Selection Pays</span>
      </div>
      <div className="space-y-2">
        {(["US", "CA"] as Country[]).map((country) => {
          const isSelected = selectedCountries.includes(country)
          return (
            <label
              key={country}
              className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all hover:bg-muted/60"
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleCountry(country)}
                className="w-4 h-4 rounded"
              />
              <span className="text-2xl">{COUNTRY_FLAGS[country]}</span>
              <span className="text-sm font-medium flex-1">{COUNTRY_LABELS[country]}</span>
              {isSelected && <Check className="w-4 h-4 text-green-500" />}
            </label>
          )
        })}
      </div>
    </div>
  )
}
