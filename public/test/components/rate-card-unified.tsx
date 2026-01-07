"use client"

import { memo, useMemo } from "react"
import { FORMATTING } from "@/lib/formatting"

interface UnifiedRateCardProps {
  label: string
  value: number | null
  change?: number
  fetchedAt?: string
  country: "US" | "CA"
  loading?: boolean
}

export const UnifiedRateCard = memo(function UnifiedRateCard({
  label,
  value,
  change,
  fetchedAt,
  country,
  loading = false,
}: UnifiedRateCardProps) {
  const formats = useMemo(() => {
    if (!value) return null
    return FORMATTING.formatBasisPoints(value)
  }, [value])

  const changeInfo = useMemo(() => {
    if (change === undefined) return null
    return FORMATTING.formatChangeDirection(change)
  }, [change])

  const timeInfo = useMemo(() => {
    if (!fetchedAt) return null
    return FORMATTING.formatDateTime(new Date(fetchedAt))
  }, [fetchedAt])

  if (loading) {
    return (
      <div className="p-3 rounded-lg bg-slate-800/50 animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-12 mb-2" />
        <div className="h-6 bg-slate-700 rounded w-16" />
      </div>
    )
  }

  const bgColor = country === "US" ? "bg-blue-900/20" : "bg-red-900/20"
  const borderColor = country === "US" ? "border-blue-500" : "border-red-500"

  return (
    <div className={`p-3 rounded-lg border ${bgColor} ${borderColor} space-y-1`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase">{label}</span>
        {changeInfo && <span className={`text-xs font-bold ${changeInfo.color}`}>{changeInfo.icon}</span>}
      </div>
      {value !== null && formats && (
        <>
          <div className="text-lg font-bold text-white">{formats.percent}%</div>
          <div className="text-xs text-slate-500">
            {formats.bps} pb | {formats.decimal}
          </div>
        </>
      )}
      {timeInfo && <div className="text-xs text-slate-600">{timeInfo.time}</div>}
    </div>
  )
})
