import type React from "react"
/* Nouveau composant pour définir les espacements standards des conteneurs */
export function ChartContainerCompact({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/50 bg-gradient-to-br from-card via-card to-card/95 p-2 sm:p-3">
      {children}
    </div>
  )
}
