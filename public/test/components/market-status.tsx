"use client"

import { useEffect, useState } from "react"
import { RefreshCw, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MarketStatusProps {
  lastUpdate: string
  onRefresh?: () => void
}

export function MarketStatus({ lastUpdate, onRefresh }: MarketStatusProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setLastRefreshTime(new Date())
    onRefresh?.()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const formatDateTime = (date: Date) => {
    return date.toLocaleString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const etTime = new Date(currentTime.toLocaleString("en-US", { timeZone: "America/New_York" }))
  const hour = etTime.getHours()
  const minute = etTime.getMinutes()
  const day = etTime.getDay()
  const isWeekday = day >= 1 && day <= 5
  const isMarketHours = isWeekday && ((hour === 9 && minute >= 30) || (hour >= 10 && hour < 16))

  return (
    <div className="w-full">
      <div className="bg-gradient-to-r from-muted/50 to-muted/30 border border-border rounded-lg p-3 sm:p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-foreground">Dernière actualisation</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-foreground break-words">
              {formatDateTime(lastRefreshTime)}
            </p>
            <p className="text-xs text-muted-foreground">Données de marché: {lastUpdate}</p>
          </div>

          <div className="flex flex-col gap-2 sm:gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-border text-xs sm:text-sm whitespace-nowrap">
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${isMarketHours ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}
              />
              <span className="font-medium text-foreground">{isMarketHours ? "Marché Ouvert" : "Marché Fermé"}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-border text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span>{currentTime.toLocaleTimeString("fr-FR")}</span>
            </div>
          </div>

          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2 h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm w-full sm:w-auto"
            variant="default"
          >
            <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{isRefreshing ? "Actualisation..." : "Actualiser"}</span>
            <span className="sm:hidden">{isRefreshing ? "..." : "Actualiser"}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
