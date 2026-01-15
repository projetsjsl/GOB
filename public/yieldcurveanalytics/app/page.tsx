"use client"

import { useState, useEffect } from "react"
import { YieldCurveChart } from "@/components/yield-curve-chart"
import { SpreadAnalysisCard } from "@/components/spread-analysis"
import { HistoricalComparison } from "@/components/historical-comparison"
import { ExpandableCard } from "@/components/expandable-card"
import { ForwardRatesChart } from "@/components/forward-rates-chart"
import { CurveMetricsCard } from "@/components/curve-metrics"
import { CountrySpreadChart } from "@/components/country-spread-chart"
import { CountrySpreadHistory } from "@/components/country-spread-history"
import { SpreadHistoryChart } from "@/components/spread-history-chart"
import { ButterflySpreadsCard } from "@/components/butterfly-spreads"
import { GraphFilters } from "@/components/graph-filters"
import { EnhancedControlsPanel } from "@/components/enhanced-controls-panel"
import { MaturitySelector } from "@/components/maturity-selector"
import { KeyRatesSummary } from "@/components/key-rates-summary"
import { calculateForwardRates, calculateEnhancedCurveMetrics, calculateButterflySpreads } from "@/lib/analytics"
import { getYieldData } from "@/app/actions/yield-data"
import { CurveComparisonGrid } from "@/components/curve-comparison-grid"
import { Zap, TrendingUp, Activity, Settings2, Download, Calendar, Plus, X, Eye, EyeOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import type { InterpolationMethod } from "@/lib/interpolation"
import type { Country, YieldCurveData } from "@/lib/fred-api"
import { RateDecisionsHistory } from "@/components/rate-decisions-history"
import { SectionNavigation } from "@/components/section-navigation" // Import SectionNavigation

export default function Page() {
  const [data, setData] = useState<Record<Country, YieldCurveData> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCountries, setSelectedCountries] = useState<Country[]>(["US", "CA"])
  const [interpolationMethod, setInterpolationMethod] = useState<InterpolationMethod>("cubic-spline")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [selectedMaturities, setSelectedMaturities] = useState([
    "1M",
    "3M",
    "6M",
    "1Y",
    "2Y",
    "3Y",
    "5Y",
    "7Y",
    "10Y",
    "20Y",
    "30Y",
  ])
  const [comparisonDates, setComparisonDates] = useState<string[]>([])
  const [newComparisonDate, setNewComparisonDate] = useState("")
  const [graphFilters, setGraphFilters] = useState({
    showObserved: true,
    showInterpolated: true,
    scaleType: "linear" as const,
    minMaturity: "1M",
    maxMaturity: "30Y",
    opacity: 1,
  })
  const [historicalData, setHistoricalData] = useState<any[]>([
    {
      date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0],
      US: { points: [] },
      CA: { points: [] },
    },
    {
      date: new Date(new Date().setDate(new Date().getDate() - 60)).toISOString().split("T")[0],
      US: { points: [] },
      CA: { points: [] },
    },
  ])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const yieldData = await getYieldData()
        setData(yieldData)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch yield data")
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const usData = data?.["US"]?.points || []
  const caData = data?.["CA"]?.points || []
  const usPolicyRate = data?.["US"]?.policyRate
  const caPolicyRate = data?.["CA"]?.policyRate
  const lastUpdated = new Date().toLocaleString("fr-FR")

  // Filtrer les donnees par maturites selectionnees
  const filteredUsData = usData.filter((p: any) => selectedMaturities.includes(p.maturity))
  const filteredCaData = caData.filter((p: any) => selectedMaturities.includes(p.maturity))

  // Construire les courbes pour le graphique
  const curves = []
  if (selectedCountries.includes("US")) {
    curves.push({
      country: "US",
      observedPoints: filteredUsData,
      interpolatedPoints: filteredUsData.map((p: any) => ({ ...p, days: p.days })),
      color: "#3b82f6",
      isCurrent: true,
    })
  }
  if (selectedCountries.includes("CA")) {
    curves.push({
      country: "CA",
      observedPoints: filteredCaData,
      interpolatedPoints: filteredCaData.map((p: any) => ({ ...p, days: p.days })),
      color: "#ef4444",
      isCurrent: true,
    })
  }

  const butterflySpreads = calculateButterflySpreads(usData)

  // Calculer metriques pour UnifiedMetrics
  const usMetrics = {
    slope2Y10Y:
      (usData.find((p: any) => p.maturity === "10Y")?.yield || 0) -
      (usData.find((p: any) => p.maturity === "2Y")?.yield || 0),
    slope2Y30Y:
      (usData.find((p: any) => p.maturity === "30Y")?.yield || 0) -
      (usData.find((p: any) => p.maturity === "2Y")?.yield || 0),
    slope5Y10Y:
      (usData.find((p: any) => p.maturity === "10Y")?.yield || 0) -
      (usData.find((p: any) => p.maturity === "5Y")?.yield || 0),
    slope10Y30Y:
      (usData.find((p: any) => p.maturity === "30Y")?.yield || 0) -
      (usData.find((p: any) => p.maturity === "10Y")?.yield || 0),
  }

  const caMetrics = {
    slope2Y10Y:
      (caData.find((p: any) => p.maturity === "10Y")?.yield || 0) -
      (caData.find((p: any) => p.maturity === "2Y")?.yield || 0),
    slope2Y30Y:
      (caData.find((p: any) => p.maturity === "30Y")?.yield || 0) -
      (caData.find((p: any) => p.maturity === "2Y")?.yield || 0),
    slope5Y10Y:
      (caData.find((p: any) => p.maturity === "10Y")?.yield || 0) -
      (caData.find((p: any) => p.maturity === "5Y")?.yield || 0),
    slope10Y30Y:
      (caData.find((p: any) => p.maturity === "30Y")?.yield || 0) -
      (caData.find((p: any) => p.maturity === "10Y")?.yield || 0),
  }

  const handleExport = () => {
    const csvRows = ["Maturite,US (%),Canada (%),Spread (bp)"]
    const maturities = ["1M", "3M", "6M", "1Y", "2Y", "3Y", "5Y", "7Y", "10Y", "20Y", "30Y"]
    maturities.forEach((mat) => {
      const usPoint = usData.find((p: any) => p.maturity === mat)
      const caPoint = caData.find((p: any) => p.maturity === mat)
      const spread = usPoint && caPoint ? ((usPoint.yield - caPoint.yield) * 100).toFixed(1) : "N/A"
      csvRows.push(`${mat},${usPoint?.yield.toFixed(3) || "N/A"},${caPoint?.yield.toFixed(3) || "N/A"},${spread}`)
    })
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `curvewatch-export-${selectedDate}.csv`
    a.click()
  }

  const addComparisonDate = () => {
    if (newComparisonDate && !comparisonDates.includes(newComparisonDate) && comparisonDates.length < 5) {
      setComparisonDates([...comparisonDates, newComparisonDate])
      setNewComparisonDate("")
    }
  }

  const removeComparisonDate = (date: string) => {
    setComparisonDates(comparisonDates.filter((d) => d !== date))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen flex-col gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="text-muted-foreground">Chargement des donnees...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen flex-col gap-4">
        <p className="text-red-500">{error}</p>
        <Button variant="default" size="sm" onClick={() => setLoading(true)}>
          Reessayer
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50 shadow-sm">
        <div className="max-w-full mx-auto px-4 py-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
            {/* Country Selector */}
            <div className="flex gap-2 items-center">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Pays:</span>
              <div className="flex gap-1">
                {(["US", "CA"] as const).map((country) => (
                  <button
                    key={country}
                    onClick={() => {
                      if (selectedCountries.includes(country)) {
                        if (selectedCountries.length > 1) {
                          setSelectedCountries(selectedCountries.filter((c) => c !== country))
                        }
                      } else {
                        setSelectedCountries([...selectedCountries, country])
                      }
                    }}
                    className={`text-lg px-2 py-1 rounded transition-all ${
                      selectedCountries.includes(country)
                        ? "ring-2 ring-primary ring-offset-1 bg-primary/10"
                        : "opacity-50 hover:opacity-75"
                    }`}
                    title={country === "US" ? "Etats-Unis" : "Canada"}
                  >
                    {country === "US" ? "" : ""}
                  </button>
                ))}
              </div>
            </div>

            {/* Interpolation Method */}
            <div className="flex gap-2 items-center">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Interpolation:</span>
              <Select
                value={interpolationMethod}
                onValueChange={(v) => setInterpolationMethod(v as InterpolationMethod)}
              >
                <SelectTrigger className="h-8 text-xs w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Lineaire</SelectItem>
                  <SelectItem value="cubic-spline">Spline Cubique</SelectItem>
                  <SelectItem value="nelson-siegel">Nelson-Siegel</SelectItem>
                  <SelectItem value="monotone-cubic">Cubique Monotone</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Selection */}
            <div className="flex gap-2 items-center">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Date:</span>
              <div className="flex gap-1">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-8 text-xs w-32"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
                  className="h-8 w-8"
                >
                  <Calendar className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Graph Filters */}
            <div className="flex gap-2 items-center">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Affichage:</span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={graphFilters.showObserved ? "default" : "outline"}
                  onClick={() => setGraphFilters({ ...graphFilters, showObserved: !graphFilters.showObserved })}
                  className="h-8 text-xs px-2"
                  title="Points observes"
                >
                  {graphFilters.showObserved ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </Button>
                <Button
                  size="sm"
                  variant={graphFilters.showInterpolated ? "default" : "outline"}
                  onClick={() => setGraphFilters({ ...graphFilters, showInterpolated: !graphFilters.showInterpolated })}
                  className="h-8 text-xs px-2"
                  title="Interpolation"
                >
                  {graphFilters.showInterpolated ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </Button>
              </div>
            </div>

            {/* Refresh Button */}
            <div className="flex justify-end">
              <Button onClick={() => setLoading(true)} variant="secondary" size="sm" className="h-8 text-xs gap-1">
                <RefreshCw className="h-3 w-3" />
                Actualiser
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="min-h-screen space-y-6 p-3 sm:p-4 md:p-6">
        <SectionNavigation />

        {/* SECTION 1: KPI DASHBOARD */}
        <section id="section-overview" className="space-y-3 animate-slide-in-top scroll-mt-20">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center justify-center h-6 w-6 bg-blue-500/20 border border-blue-500/50 rounded-full text-xs font-semibold text-blue-400">
              1
            </span>
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Dashboard KPI</span>
          </div>
          <div className="section-header">
            <div className="h-8 w-1.5 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold">JLab CurveWatch</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Propulse par JSLAI - Metriques cles pour decisions rapides
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          <KeyRatesSummary usData={usData} caData={caData} usPolicyRate={usPolicyRate} caPolicyRate={caPolicyRate} />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Panneau de controle lateral */}
          <aside className="lg:col-span-1 space-y-4">
            <EnhancedControlsPanel
              method={interpolationMethod}
              onMethodChange={setInterpolationMethod}
              onRefresh={() => setLoading(true)}
              date={selectedDate}
              onDateChange={setSelectedDate}
              selectedCountries={selectedCountries}
              onCountriesChange={setSelectedCountries}
            />

            <MaturitySelector selectedMaturities={selectedMaturities} onMaturitiesChange={setSelectedMaturities} />

            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Dates de Comparaison
              </h3>
              <p className="text-xs text-muted-foreground">Ajoutez jusqu'a 5 dates pour comparer les courbes</p>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={newComparisonDate}
                  onChange={(e) => setNewComparisonDate(e.target.value)}
                  className="text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={addComparisonDate}
                  disabled={comparisonDates.length >= 5}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {comparisonDates.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {comparisonDates.map((date) => (
                    <span key={date} className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs">
                      {date}
                      <button onClick={() => removeComparisonDate(date)} className="hover:text-red-500">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* Contenu principal */}
          <div className="lg:col-span-3 space-y-6">
            {/* SECTION 2: COURBES DE TAUX OBLIGATAIRES - PRIORITE HAUTE */}
            <section className="space-y-3 scroll-mt-20">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center justify-center h-6 w-6 bg-indigo-500/20 border border-indigo-500/50 rounded-full text-xs font-semibold text-indigo-400">
                  2
                </span>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Courbes Obligataires</span>
              </div>
              <div className="section-header">
                <div className="h-8 w-1.5 bg-gradient-to-b from-indigo-500 to-blue-500 rounded-full"></div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold">Courbe des Taux Obligataires</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Comparaison 2 courbes - courbes historiques en pointilles
                  </p>
                </div>
              </div>
              <ExpandableCard title="" expandedSize="xlarge" className="lg:col-span-full">
                <HistoricalComparison
                  currentCurve={{
                    points: selectedCountries.includes("US")
                      ? usData.map((p: any) => ({
                          maturity: p.maturity,
                          yield: p.yield,
                          days: p.days,
                        }))
                      : caData.map((p: any) => ({
                          maturity: p.maturity,
                          yield: p.yield,
                          days: p.days,
                        })),
                  }}
                  historicalCurves={comparisonDates.map((date, idx) => ({
                    date,
                    observedPoints: (
                      historicalData.find((h: any) => h.date === date)?.[selectedCountries.includes("US") ? "US" : "CA"]
                        ?.points || []
                    ).map((p: any) => ({
                      maturity: p.maturity,
                      yield: p.yield,
                      days: p.days,
                    })),
                    color: ["#8b5cf6", "#f59e0b", "#ef4444", "#10b981", "#06b6d4"][idx % 5],
                  }))}
                />
              </ExpandableCard>
            </section>

            {/* SECTION 3: CURVE COMPARISON GRID - HORIZONTAL COMPACT */}
            <section className="space-y-3 scroll-mt-20">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center justify-center h-6 w-6 bg-green-500/20 border border-green-500/50 rounded-full text-xs font-semibold text-green-400">
                  3
                </span>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Grille Comparaison Maturites
                </span>
              </div>
              <CurveComparisonGrid
                usData={filteredUsData}
                caData={filteredCaData}
                previousDayUsData={undefined}
                previousDayCanData={undefined}
              />
            </section>

            {/* SECTION 4: MARKET STATUS & SPREADS */}
            <section id="section-comparison" className="space-y-3 border-t border-blue-500/10 pt-6 scroll-mt-20">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center justify-center h-6 w-6 bg-green-500/20 border border-green-500/50 rounded-full text-xs font-semibold text-green-400">
                  4
                </span>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Etat Marche & Spreads</span>
              </div>
              <div className="section-header">
                <div className="h-8 w-1.5 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                    <Activity className="h-6 w-6 text-green-400" />
                    Etat du Marche & Risques
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">Spreads US/CA et comparaisons detaillees</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ExpandableCard title="Ecarts US-CA par Maturite" expandedSize="large">
                  <CountrySpreadChart usData={filteredUsData} caData={filteredCaData} />
                </ExpandableCard>

                <ExpandableCard title="Analyse des Spreads US" expandedSize="large">
                  <SpreadAnalysisCard
                    spreads={{
                      spread_2_10:
                        ((usData.find((p: any) => p.maturity === "2Y")?.yield || 0) -
                          (usData.find((p: any) => p.maturity === "10Y")?.yield || 0)) *
                        100,
                      spread_2_30:
                        ((usData.find((p: any) => p.maturity === "2Y")?.yield || 0) -
                          (usData.find((p: any) => p.maturity === "30Y")?.yield || 0)) *
                        100,
                      spread_3m_10:
                        ((usData.find((p: any) => p.maturity === "3M")?.yield || 0) -
                          (usData.find((p: any) => p.maturity === "10Y")?.yield || 0)) *
                        100,
                      spread_5_30:
                        ((usData.find((p: any) => p.maturity === "5Y")?.yield || 0) -
                          (usData.find((p: any) => p.maturity === "30Y")?.yield || 0)) *
                        100,
                    }}
                  />
                </ExpandableCard>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ExpandableCard title="Historique Spreads US-CA (1 an)" expandedSize="xlarge">
                  <CountrySpreadHistory />
                </ExpandableCard>

                <ExpandableCard title="Historique Spreads de Pente" expandedSize="xlarge">
                  <SpreadHistoryChart />
                </ExpandableCard>
              </div>
            </section>

            {/* SECTION 5: COURBES DE TAUX */}
            <section id="section-analytics" className="space-y-3 border-t border-blue-500/10 pt-6 scroll-mt-20">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center justify-center h-6 w-6 bg-purple-500/20 border border-purple-500/50 rounded-full text-xs font-semibold text-purple-400">
                  5
                </span>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Courbes de Taux</span>
              </div>
              <div className="section-header">
                <div className="h-8 w-1.5 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-purple-400" />
                    Courbes de Taux
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">Analyse interactive avec controles avances</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Filtres graphique:</span>
                  </div>
                  <GraphFilters filters={graphFilters} onFiltersChange={setGraphFilters} />
                </div>

                <ExpandableCard title="Courbes de Rendement US & Canada" expandedSize="xlarge">
                  <YieldCurveChart curves={curves} graphFilters={graphFilters} />
                </ExpandableCard>
              </div>
            </section>

            {/* SECTION 6: ANALYTIQUE AVANCEE */}
            <section id="section-analytical" className="space-y-3 border-t border-indigo-500/10 pt-6 scroll-mt-20">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center justify-center h-6 w-6 bg-amber-500/20 border border-amber-500/50 rounded-full text-xs font-semibold text-amber-400">
                  6
                </span>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Analytique Avancee</span>
              </div>
              <div className="section-header">
                <div className="h-8 w-1.5 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full"></div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                    <Zap className="h-6 w-6 text-amber-400" />
                    Analytique Avancee
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">Metriques detaillees, PCA et butterfly spreads</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <ExpandableCard title="Taux Forwards" expandedSize="large">
                  <div className="glass-card rounded-lg p-4 border-emerald-500/20">
                    <ForwardRatesChart
                      forwards={selectedCountries
                        .map((country) => data?.[country] && calculateForwardRates(data[country].points))
                        .filter(Boolean)}
                      spotRate={usData.find((p: any) => p.maturity === "10Y")?.yield || 4.5}
                    />
                  </div>
                </ExpandableCard>

                {selectedCountries.includes("US") && data?.["US"] && (
                  <ExpandableCard title="Forwards - US" expandedSize="large">
                    <div className="fed-card-bg rounded-lg p-4">
                      <h4 className="text-xs font-semibold text-blue-300 mb-3 uppercase">Metriques Courbe US</h4>
                      <CurveMetricsCard metrics={calculateEnhancedCurveMetrics(usData, [])} />
                    </div>
                  </ExpandableCard>
                )}

                {selectedCountries.includes("CA") && data?.["CA"] && (
                  <ExpandableCard title="Forwards - CA" expandedSize="large">
                    <div className="canada-card-bg rounded-lg p-4">
                      <h4 className="text-xs font-semibold text-red-300 mb-3 uppercase">Metriques Courbe CA</h4>
                      <CurveMetricsCard metrics={calculateEnhancedCurveMetrics(caData, [])} />
                    </div>
                  </ExpandableCard>
                )}

                <ExpandableCard title="Butterfly Spreads Detailles" expandedSize="large">
                  <ButterflySpreadsCard spreads={butterflySpreads} />
                </ExpandableCard>

                {selectedCountries.includes("US") && (
                  <ExpandableCard title="Metriques Courbe - US" expandedSize="large">
                    <div className="fed-card-bg rounded-lg p-4">
                      <h4 className="text-xs font-semibold text-blue-300 mb-3 uppercase">Metriques Courbe US</h4>
                      <CurveMetricsCard metrics={calculateEnhancedCurveMetrics(usData, [])} />
                    </div>
                  </ExpandableCard>
                )}

                {selectedCountries.includes("CA") && (
                  <ExpandableCard title="Metriques Courbe - CA" expandedSize="large">
                    <div className="canada-card-bg rounded-lg p-4">
                      <h4 className="text-xs font-semibold text-red-300 mb-3 uppercase">Metriques Courbe CA</h4>
                      <CurveMetricsCard metrics={calculateEnhancedCurveMetrics(caData, [])} />
                    </div>
                  </ExpandableCard>
                )}

                <ExpandableCard
                  title="Comparaison Historique des Courbes"
                  expandedSize="xlarge"
                  className="lg:col-span-full"
                >
                  <HistoricalComparison
                    currentCurve={{
                      points: selectedCountries.includes("US")
                        ? usData.map((p: any) => ({
                            maturity: p.maturity,
                            yield: p.yield,
                            days: p.days,
                          }))
                        : caData.map((p: any) => ({
                            maturity: p.maturity,
                            yield: p.yield,
                            days: p.days,
                          })),
                    }}
                    historicalCurves={comparisonDates.map((date, idx) => ({
                      date,
                      observedPoints: (
                        historicalData.find((h: any) => h.date === date)?.[
                          selectedCountries.includes("US") ? "US" : "CA"
                        ]?.points || []
                      ).map((p: any) => ({
                        maturity: p.maturity,
                        yield: p.yield,
                        days: p.days,
                      })),
                      color: ["#8b5cf6", "#f59e0b", "#ef4444", "#10b981", "#06b6d4"][idx % 5],
                    }))}
                  />
                </ExpandableCard>
              </div>
            </section>

            {/* SECTION 7: CONTEXTE HISTORIQUE */}
            <section id="section-historical" className="space-y-3 border-t border-rose-500/10 pt-6 scroll-mt-20">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center justify-center h-6 w-6 bg-rose-500/20 border border-rose-500/50 rounded-full text-xs font-semibold text-rose-400">
                  7
                </span>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Historique Decisions</span>
              </div>
              <ExpandableCard title="Historique des Decisions de Taux - FED & BOC" expandedSize="xlarge">
                <RateDecisionsHistory />
              </ExpandableCard>

              {/* ... other historical content ... */}
            </section>
          </div>
        </section>
      </main>
    </div>
  )
}
