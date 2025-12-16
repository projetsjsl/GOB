/**
 * Color utility functions for 3p1 Finance Pro
 * Extracted from KPIDashboard.tsx for reusability
 */

/**
 * Get color for JPEGY score
 * Lower is better: green = undervalued, red = overvalued
 */
export const getJpegyColor = (jpegy: number | null): string | null => {
  if (jpegy === null || !isFinite(jpegy)) return null;
  if (jpegy <= 0.5) return '#86efac'; // Light green (very undervalued)
  if (jpegy <= 1.5) return '#16a34a'; // Dark green (undervalued)
  if (jpegy <= 1.75) return '#eab308'; // Yellow (fair value)
  if (jpegy <= 2.0) return '#f97316'; // Orange (overvalued)
  return '#dc2626'; // Red (very overvalued)
};

/**
 * Get color for Ratio 3:1 (upside/downside ratio)
 * Higher is better: green >= 3, yellow 1-3, red < 1
 */
export const getRatio31Color = (ratio: number | null): string | null => {
  if (ratio === null || !isFinite(ratio) || ratio < 0) return null;
  if (ratio >= 3) return '#16a34a'; // Dark green (favorable >= 3:1)
  if (ratio >= 1) return '#eab308'; // Yellow (acceptable 1:1 to 3:1)
  return '#dc2626'; // Red (unfavorable < 1:1)
};

/**
 * Get color for return percentage
 * Higher is better: green >= 15%, yellow 0-15%, red < 0%
 */
export const getReturnColor = (returnPercent: number | null | undefined): string => {
  if (returnPercent === null || returnPercent === undefined || !isFinite(returnPercent)) {
    return '#6b7280'; // Gray for invalid
  }
  if (returnPercent >= 50) return '#16a34a'; // Dark green (excellent)
  if (returnPercent >= 15) return '#22c55e'; // Green (good)
  if (returnPercent >= 0) return '#eab308'; // Yellow (neutral)
  if (returnPercent >= -15) return '#f97316'; // Orange (poor)
  return '#dc2626'; // Red (very poor)
};

/**
 * Get color for health/status scores
 * Used in AdminDashboard for data quality indicators
 */
export const getStatusColor = (score: number): string => {
  if (score >= 80) return 'text-green-400';
  if (score >= 50) return 'text-yellow-400';
  return 'text-red-400';
};

/**
 * Get background color class for recommendation
 */
export const getRecommendationBgColor = (recommendation: string | null): string => {
  switch (recommendation) {
    case 'ACHAT':
    case 'BUY':
      return 'bg-green-500/20 text-green-400';
    case 'VENTE':
    case 'SELL':
      return 'bg-red-500/20 text-red-400';
    case 'CONSERVER':
    case 'HOLD':
      return 'bg-yellow-500/20 text-yellow-400';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
};

/**
 * Get color for volatility percentage
 * Lower is generally better for stability
 */
export const getVolatilityColor = (volatility: number | null): string => {
  if (volatility === null || !isFinite(volatility)) return '#6b7280';
  if (volatility <= 15) return '#16a34a'; // Green (low volatility)
  if (volatility <= 25) return '#22c55e'; // Light green
  if (volatility <= 40) return '#eab308'; // Yellow (moderate)
  if (volatility <= 60) return '#f97316'; // Orange (high)
  return '#dc2626'; // Red (very high)
};

/**
 * Get color for PE ratio
 * Context-dependent, but generally lower is better
 */
export const getPEColor = (pe: number | null): string => {
  if (pe === null || !isFinite(pe) || pe <= 0) return '#6b7280';
  if (pe <= 10) return '#16a34a'; // Green (cheap)
  if (pe <= 15) return '#22c55e'; // Light green
  if (pe <= 20) return '#eab308'; // Yellow (fair)
  if (pe <= 30) return '#f97316'; // Orange (expensive)
  return '#dc2626'; // Red (very expensive)
};

/**
 * Get color for dividend yield
 * Higher is generally better
 */
export const getYieldColor = (yieldPercent: number | null): string => {
  if (yieldPercent === null || !isFinite(yieldPercent)) return '#6b7280';
  if (yieldPercent >= 4) return '#16a34a'; // Green (high yield)
  if (yieldPercent >= 2.5) return '#22c55e'; // Light green
  if (yieldPercent >= 1) return '#eab308'; // Yellow (moderate)
  if (yieldPercent > 0) return '#f97316'; // Orange (low)
  return '#6b7280'; // Gray (no dividend)
};
