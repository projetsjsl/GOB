export function SkeletonLoader() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-muted rounded w-1/3"></div>
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded"></div>
        <div className="h-4 bg-muted rounded w-5/6"></div>
      </div>
    </div>
  )
}

export function ChartSkeletonLoader() {
  return (
    <div className="w-full h-96 bg-muted rounded animate-pulse flex items-center justify-center">
      <div className="text-muted-foreground text-sm">Chargement du graphique...</div>
    </div>
  )
}

export function CardSkeletonLoader() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 bg-muted rounded w-20"></div>
      <div className="h-6 bg-muted rounded w-1/2"></div>
      <div className="h-3 bg-muted rounded w-1/3"></div>
    </div>
  )
}
