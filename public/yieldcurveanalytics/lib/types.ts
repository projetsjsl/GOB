/**
 * Types complets pour CurveWatch avec documentation JSDoc
 */

/**
 * Représente un point de rendement sur la courbe
 */
export interface YieldPoint {
  /** Maturité (1M, 3M, 6M, etc.) */
  maturity: string
  /** Rendement en pourcentage */
  yield: number
  /** Nombre de jours jusqu'à maturité */
  days: number
  /** Date du point */
  date: string
  /** Timestamp de récupération des données */
  fetchedAt: string
}

/**
 * Données complètes de courbe de taux
 */
export interface CurveData {
  /** Pays (US ou CA) */
  country: "US" | "CA"
  /** Points de rendement */
  points: YieldPoint[]
  /** Source des données */
  dataSource: "FRED" | "BOC" | "FMP" | "MOCK"
  /** Date de mise à jour */
  date: string
  /** Taux directeur central (si applicable) */
  policyRate?: number
}

/**
 * Métriques avancées de courbe
 */
export interface CurveMetrics {
  /** Pente 2Y-10Y en points de base */
  slope2Y10Y: number
  /** Pente 5Y-30Y en points de base */
  slope5Y30Y: number
  /** Convexité (courbure) */
  convexity: number
  /** Volatilité implicite */
  volatility: number
  /** Rendement moyen */
  averageYield: number
  /** Écart-type */
  stdDeviation: number
}

/**
 * Configuration des filtres de graphique
 */
export interface GraphFilters {
  /** Afficher les points observés */
  showObserved: boolean
  /** Afficher les points interpolés */
  showInterpolated: boolean
  /** Type d'échelle (linéaire ou log) */
  scaleType: "linear" | "log"
  /** Maturité minimale */
  minMaturity: string
  /** Maturité maximale */
  maxMaturity: string
  /** Opacité (0-1) */
  opacity: number
}

/**
 * État global de l'application
 */
export interface AppState {
  /** Pays sélectionnés */
  selectedCountries: ("US" | "CA")[]
  /** Données actuelles */
  currentData: Record<"US" | "CA", CurveData | null>
  /** Données historiques */
  historicalData: Record<string, Record<"US" | "CA", CurveData | null>>
  /** Filtres de graphique */
  graphFilters: GraphFilters
  /** État de chargement */
  isLoading: boolean
  /** Message d'erreur éventuel */
  error: string | null
  /** Date de dernière mise à jour */
  lastUpdated: string | null
}

/**
 * Réponse API pour les taux
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
