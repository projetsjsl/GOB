"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Loader2, RefreshCw, AlertCircle } from "lucide-react"
import { getThemeColors, MATURITIES, VIEWS } from "@/lib/curve-watch-compat"
import type { YieldCurveData } from "@/lib/fred-api"
import { getMockYieldData } from "@/lib/fred-api"
import { getMockCanadianYieldData } from "@/lib/canadian-yields"
import { YieldStatsPanel } from "./yield-stats-panel"

const useDarkMode = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined" && typeof window.GOBThemes !== "undefined") {
      return window.GOBThemes.getCurrentTheme() === "dark"
    }
    if (typeof document !== "undefined") {
      return document.documentElement.getAttribute("data-theme") === "dark"
    }
    return true
  })

  useEffect(() => {
    const handleThemeChange = () => {
      if (typeof window !== "undefined" && typeof window.GOBThemes !== "undefined") {
        setIsDark(window.GOBThemes.getCurrentTheme() === "dark")
      } else if (typeof document !== "undefined") {
        setIsDark(document.documentElement.getAttribute("data-theme") === "dark")
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("themeChanged", handleThemeChange)
      return () => window.removeEventListener("themeChanged", handleThemeChange)
    }
  }, [])

  return isDark
}

interface CurveWatchProps {
  isDarkMode?: boolean
}

export const CurveWatchTab = ({ isDarkMode: isDarkModeProp }: CurveWatchProps) => {
  const isDarkDetected = useDarkMode()
  const isDark = isDarkModeProp !== undefined ? isDarkModeProp : isDarkDetected
  const colors = useMemo(() => getThemeColors(isDark), [isDark])

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentData, setCurrentData] = useState<{ us: YieldCurveData | null; ca: YieldCurveData | null }>({
    us: null,
    ca: null,
  })
  const [selectedPeriod, setSelectedPeriod] = useState("1m")
  const [activeView, setActiveView] = useState<"curves" | "spread" | "compare">("curves")
  const [showCanada, setShowCanada] = useState(true)
  const [showUS, setShowUS] = useState(true)

  useEffect(() => {
    const loadRecharts = async () => {
      if (typeof window !== "undefined" && typeof window.Recharts === "undefined") {
        const script = document.createElement("script")
        script.src = "https://unpkg.com/recharts@2.10.3/dist/Recharts.js"
        script.async = true
        document.head.appendChild(script)
      }
    }

    loadRecharts()
  }, [])

  const fetchData = useCallback(async () => {
    try {
      setError(null)

      // Charger données mock (en prod, utiliser API réelle)
      const usData = getMockYieldData()
      const caData = getMockCanadianYieldData()

      setCurrentData({ us: usData, ca: caData })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erreur inconnue"
      setError(errorMsg)
      console.error("Erreur lors du chargement des données:", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const chartData = useMemo(() => {
    if (!currentData.us || !currentData.ca) return []

    return MATURITIES.map((maturity, idx) => ({
      maturity,
      us: currentData.us?.points[idx]?.yield || 0,
      ca: currentData.ca?.points[idx]?.yield || 0,
    }))
  }, [currentData])

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center min-h-screen sm:min-h-[600px] ${isDark ? "bg-gray-900" : "bg-white"}`}
      >
        <div className="text-center px-4">
          <Loader2 className="animate-spin h-12 w-12 mx-auto mb-4 text-blue-500" />
          <p className={`${isDark ? "text-gray-400" : "text-gray-600"} text-sm sm:text-base`}>
            Chargement des courbes de taux...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className={`p-4 sm:p-6 rounded-lg mx-auto max-w-2xl ${isDark ? "bg-red-900/20 border-red-500" : "bg-red-50 border-red-200"} border`}
      >
        <div className="flex gap-3">
          <AlertCircle className={`size-5 flex-shrink-0 ${isDark ? "text-red-400" : "text-red-600"}`} />
          <div>
            <p className={`font-semibold ${isDark ? "text-red-400" : "text-red-600"}`}>Erreur: {error}</p>
            <button
              onClick={handleRefresh}
              className={`mt-3 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${isDark ? "bg-red-600 hover:bg-red-700" : "bg-red-500 hover:bg-red-600"} text-white text-sm`}
            >
              <RefreshCw className="size-4" />
              Réessayer
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-full flex flex-col w-full ${isDark ? "bg-gray-900" : "bg-white"}`}>
      {/* Header - Responsive padding */}
      <div className={`p-3 sm:p-4 md:p-5 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className={`text-xl sm:text-2xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
            Courbes de Taux
          </h2>

          {/* View toggle buttons - Wrap on mobile */}
          <div className="flex gap-2 flex-wrap">
            {VIEWS.map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-3 py-2 sm:py-1 rounded-lg text-xs sm:text-sm transition-colors ${
                  activeView === view
                    ? isDark
                      ? "bg-blue-600 text-white"
                      : "bg-blue-500 text-white"
                    : isDark
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {view === "curves" ? "Courbes" : view === "spread" ? "Spread" : "Comparaison"}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles + Refresh - Responsive grid */}
        <div className="grid grid-cols-2 sm:flex sm:gap-4 gap-3 mt-4 sm:items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showUS}
              onChange={(e) => setShowUS(e.target.checked)}
              className="w-4 h-4 rounded"
              aria-label="Afficher les États-Unis"
            />
            <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>🇺🇸 US</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showCanada}
              onChange={(e) => setShowCanada(e.target.checked)}
              className="w-4 h-4 rounded"
              aria-label="Afficher le Canada"
            />
            <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>🇨🇦 CA</span>
          </label>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`col-span-2 sm:col-auto px-3 py-2 rounded-lg text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
              refreshing
                ? isDark
                  ? "bg-gray-700/50 text-gray-400"
                  : "bg-gray-200/50 text-gray-400"
                : isDark
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
            aria-label="Rafraîchir les données"
          >
            <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Rafraîchir</span>
          </button>
        </div>
      </div>

      {/* Main content - Scrollable on mobile */}
      <div className="flex-1 p-3 sm:p-4 md:p-5 overflow-auto">
        {activeView === "curves" && (
          <div className="space-y-4">
            <div
              className={`rounded-lg p-3 sm:p-4 md:p-6 ${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"} border`}
            >
              <h3 className={`mb-4 font-semibold text-sm sm:text-base ${isDark ? "text-white" : "text-gray-900"}`}>
                Courbes de Taux Actuelles
              </h3>
              {chartData.length > 0 ? (
                <div
                  className={`grid gap-2 sm:gap-3 auto-rows-max`}
                  style={{
                    gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
                  }}
                >
                  {chartData.map((point) => (
                    <div
                      key={point.maturity}
                      className={`p-2 sm:p-3 rounded-lg ${isDark ? "bg-gray-700" : "bg-white"} border ${isDark ? "border-gray-600" : "border-gray-200"}`}
                    >
                      <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>{point.maturity}</p>
                      {showUS && (
                        <p className="text-blue-500 font-semibold text-sm sm:text-base">{point.us.toFixed(2)}%</p>
                      )}
                      {showCanada && (
                        <p className="text-red-500 font-semibold text-sm sm:text-base">{point.ca.toFixed(2)}%</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className={isDark ? "text-gray-400" : "text-gray-600"}>Aucune donnée disponible</p>
              )}
            </div>

            {/* Stats panels */}
            {currentData.us && <YieldStatsPanel data={currentData.us.points} country="US" color="#3b82f6" />}
            {currentData.ca && <YieldStatsPanel data={currentData.ca.points} country="CA" color="#ef4444" />}
          </div>
        )}

        {activeView === "spread" && (
          <div
            className={`rounded-lg p-3 sm:p-4 md:p-6 ${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"} border`}
          >
            <h3 className={`mb-4 font-semibold text-sm sm:text-base ${isDark ? "text-white" : "text-gray-900"}`}>
              Spread 10Y-2Y
            </h3>
            {chartData.length >= 7 ? (
              <div className="text-center space-y-6">
                <div>
                  <p className={`text-xs sm:text-sm ${isDark ? "text-gray-400" : "text-gray-600"} mb-2`}>Spread US</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-500">
                    {(chartData[8]?.us - chartData[4]?.us || 0).toFixed(3)}%
                  </p>
                </div>
                <div>
                  <p className={`text-xs sm:text-sm ${isDark ? "text-gray-400" : "text-gray-600"} mb-2`}>
                    Spread Canada
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-red-500">
                    {(chartData[8]?.ca - chartData[4]?.ca || 0).toFixed(3)}%
                  </p>
                </div>
              </div>
            ) : (
              <p className={isDark ? "text-gray-400" : "text-gray-600"}>Données insuffisantes</p>
            )}
          </div>
        )}

        {activeView === "compare" && (
          <div
            className={`rounded-lg p-3 sm:p-4 md:p-6 ${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"} border`}
          >
            <h3 className={`mb-4 font-semibold text-sm sm:text-base ${isDark ? "text-white" : "text-gray-900"}`}>
              Comparaison US vs Canada
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div
                className={`p-4 rounded-lg ${isDark ? "bg-blue-900/30 border-blue-500" : "bg-blue-50 border-blue-200"} border`}
              >
                <p className={`text-xs sm:text-sm font-semibold ${isDark ? "text-blue-300" : "text-blue-700"}`}>
                  États-Unis
                </p>
                <p className="text-xl sm:text-2xl font-bold text-blue-500 mt-2">
                  {currentData.us?.points[8]?.yield?.toFixed(2) || "N/A"}%
                </p>
              </div>
              <div
                className={`p-4 rounded-lg ${isDark ? "bg-red-900/30 border-red-500" : "bg-red-50 border-red-200"} border`}
              >
                <p className={`text-xs sm:text-sm font-semibold ${isDark ? "text-red-300" : "text-red-700"}`}>Canada</p>
                <p className="text-xl sm:text-2xl font-bold text-red-500 mt-2">
                  {currentData.ca?.points[8]?.yield?.toFixed(2) || "N/A"}%
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

if (typeof window !== "undefined") {
  window.CurveWatchTab = CurveWatchTab
}
