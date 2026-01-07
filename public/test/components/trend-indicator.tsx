"use client"

import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface TrendIndicatorProps {
  value: number
  change?: number
  decimals?: number
  showIcon?: boolean
  size?: "sm" | "md" | "lg"
}

export function TrendIndicator({ value, change, decimals = 2, showIcon = true, size = "md" }: TrendIndicatorProps) {
  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0
  const isNeutral = change === undefined || change === 0

  const sizeClasses = {
    sm: "text-xs h-4 w-4",
    md: "text-sm h-5 w-5",
    lg: "text-base h-6 w-6",
  }

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className={`${textSizeClasses[size]} font-semibold text-foreground`}>{value.toFixed(decimals)}%</span>
      {showIcon && change !== undefined && (
        <>
          {isPositive && <TrendingUp className={`${sizeClasses[size]} text-green-400 animate-pulse`} />}
          {isNegative && <TrendingDown className={`${sizeClasses[size]} text-red-400 animate-pulse`} />}
          {isNeutral && <Minus className={`${sizeClasses[size]} text-yellow-400`} />}
        </>
      )}
      {change !== undefined && (
        <span
          className={`text-xs font-medium ${
            isPositive ? "text-green-400" : isNegative ? "text-red-400" : "text-yellow-400"
          }`}
        >
          {isPositive ? "+" : ""}
          {change.toFixed(decimals)}
        </span>
      )}
    </div>
  )
}
