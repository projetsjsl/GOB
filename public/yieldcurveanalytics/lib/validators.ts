/**
 * Validateurs pour les donnees de courbe de taux
 */

import type { YieldPoint, CurveData } from "./types"

/**
 * Valide qu'un point de rendement est correct
 */
export function isValidYieldPoint(point: any): point is YieldPoint {
  return (
    typeof point === "object" &&
    typeof point.maturity === "string" &&
    typeof point.yield === "number" &&
    typeof point.days === "number" &&
    point.yield >= 0 &&
    point.yield <= 20 && // Limites raisonnables
    point.days > 0
  )
}

/**
 * Valide une courbe de taux complete
 */
export function isValidCurveData(data: any): data is CurveData {
  return (
    typeof data === "object" &&
    (data.country === "US" || data.country === "CA") &&
    Array.isArray(data.points) &&
    data.points.length > 0 &&
    data.points.every(isValidYieldPoint) &&
    ["FRED", "BOC", "FMP", "MOCK"].includes(data.dataSource) &&
    typeof data.date === "string"
  )
}

/**
 * Valide la coherence des rendements (generalement croissants)
 */
export function validateCurveShape(points: YieldPoint[]): { valid: boolean; issues: string[] } {
  const issues: string[] = []

  if (points.length < 2) {
    issues.push("Moins de 2 points")
    return { valid: false, issues }
  }

  // Verifier que les points sont tries par maturite
  const sorted = [...points].sort((a, b) => a.days - b.days)
  if (JSON.stringify(points) !== JSON.stringify(sorted)) {
    issues.push("Points non tries par maturite")
  }

  // Verifier pour les inversions anormales
  let inversions = 0
  for (let i = 1; i < points.length; i++) {
    if (points[i].yield < points[i - 1].yield) {
      inversions++
    }
  }

  if (inversions > points.length / 2) {
    issues.push(`Trop d'inversions detectees (${inversions})`)
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}

/**
 * Valide une date ISO
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date.getTime())
}

/**
 * Valide un taux directeur
 */
export function isValidPolicyRate(rate: number): boolean {
  return typeof rate === "number" && rate >= -1 && rate <= 20 // Limites raisonnables
}
