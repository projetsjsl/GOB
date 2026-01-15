/**
 * Types complets pour CurveWatch avec documentation JSDoc
 */

/**
 * Represente un point de rendement sur la courbe
 */
export interface YieldPoint {
  /** Maturite (1M, 3M, 6M, etc.) */
  maturity: string
  /** Rendement en pourcentage */
  yield: number
  /** Nombre de jours jusqu'a maturite */
  days: number
  /** Date du point */
  date: string
  /** Timestamp de recuperation des donnees */
  fetchedAt: string
}

/**
 * Donnees completes de courbe de taux
 */
export interface CurveData {
  /** Pays (US ou CA) */
  country: "US" | "CA"
  /** Points de rendement */
  points: YieldPoint[]
  /** Source des donnees */
  dataSource: "FRED" | "BOC" | "FMP" | "MOCK"
  /** Date de mise a jour */
  date: string
  /** Taux directeur central (si applicable) */
  policyRate?: number
}

/**
 * Metriques avancees de courbe
 */
export interface CurveMetrics {
  /** Pente 2Y-10Y en points de base */
  slope2Y10Y: number
  /** Pente 5Y-30Y en points de base */
  slope5Y30Y: number
  /** Convexite (courbure) */
  convexity: number
  /** Volatilite implicite */
  volatility: number
  /** Rendement moyen */
  averageYield: number
  /** Ecart-type */
  stdDeviation: number
}

/**
 * Configuration des filtres de graphique
 */
export interface GraphFilters {
  /** Afficher les points observes */
  showObserved: boolean
  /** Afficher les points interpoles */
  showInterpolated: boolean
  /** Type d'echelle (lineaire ou log) */
  scaleType: "linear" | "log"
  /** Maturite minimale */
  minMaturity: string
  /** Maturite maximale */
  maxMaturity: string
  /** Opacite (0-1) */
  opacity: number
}

/**
 * Etat global de l'application
 */
export interface AppState {
  /** Pays selectionnes */
  selectedCountries: ("US" | "CA")[]
  /** Donnees actuelles */
  currentData: Record<"US" | "CA", CurveData | null>
  /** Donnees historiques */
  historicalData: Record<string, Record<"US" | "CA", CurveData | null>>
  /** Filtres de graphique */
  graphFilters: GraphFilters
  /** Etat de chargement */
  isLoading: boolean
  /** Message d'erreur eventuel */
  error: string | null
  /** Date de derniere mise a jour */
  lastUpdated: string | null
}

/**
 * Reponse API pour les taux
 */
export interface YieldApiResponse {
  data: {
    country: "US" | "CA"
    date: string
    points: YieldPoint[]
    policyRate?: number
  }
  status: "success" | "error"
  message?: string
  timestamp: string
}
