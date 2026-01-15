/**
 * Detection automatique des metriques avec prix cibles aberrants (outliers)
 * Decoche automatiquement les metriques dont le prix cible est trop different des autres
 */

import { AnnualData, Assumptions } from '../types';
import { projectFutureValue } from './calculations';

/**
 * Calcule les prix cibles pour chaque metrique
 */
function calculateTargetPrices(
  data: AnnualData[],
  assumptions: Assumptions
): {
  eps: number;
  cf: number;
  bv: number;
  div: number;
} {
  const baseYearData = data.find(d => d.year === assumptions.baseYear) || data[data.length - 1];
  const currentPrice = Math.max(assumptions.currentPrice || 0, 0.01);
  
  // Valeurs de base
  const baseValues = {
    eps: Math.max(baseYearData?.earningsPerShare || 0, 0),
    cf: Math.max(baseYearData?.cashFlowPerShare || 0, 0),
    bv: Math.max(baseYearData?.bookValuePerShare || 0, 0),
    div: Math.max(assumptions.currentDividend || 0, 0)
  };

  // Projections 5 ans avec validation
  const safeGrowthEPS = Math.max(-50, Math.min(assumptions.growthRateEPS || 0, 50));
  const safeGrowthCF = Math.max(-50, Math.min(assumptions.growthRateCF || 0, 50));
  const safeGrowthBV = Math.max(-50, Math.min(assumptions.growthRateBV || 0, 50));
  const safeGrowthDiv = Math.max(-50, Math.min(assumptions.growthRateDiv || 0, 50));

  const futureValues = {
    eps: baseValues.eps > 0 && isFinite(safeGrowthEPS) ? projectFutureValue(baseValues.eps, safeGrowthEPS, 5) : 0,
    cf: baseValues.cf > 0 && isFinite(safeGrowthCF) ? projectFutureValue(baseValues.cf, safeGrowthCF, 5) : 0,
    bv: baseValues.bv > 0 && isFinite(safeGrowthBV) ? projectFutureValue(baseValues.bv, safeGrowthBV, 5) : 0,
    div: baseValues.div > 0 && isFinite(safeGrowthDiv) ? projectFutureValue(baseValues.div, safeGrowthDiv, 5) : 0
  };

  // Ratios cibles avec validation
  const safeTargetPE = Math.max(1, Math.min(assumptions.targetPE || 0, 100));
  const safeTargetPCF = Math.max(1, Math.min(assumptions.targetPCF || 0, 100));
  const safeTargetPBV = Math.max(0.5, Math.min(assumptions.targetPBV || 0, 50));
  const safeTargetYield = Math.max(0.1, Math.min(assumptions.targetYield || 0, 20));

  // Calcul des prix cibles
  const targets = {
    eps: futureValues.eps > 0 && safeTargetPE > 0 ? futureValues.eps * safeTargetPE : 0,
    cf: futureValues.cf > 0 && safeTargetPCF > 0 ? futureValues.cf * safeTargetPCF : 0,
    bv: futureValues.bv > 0 && safeTargetPBV > 0 ? futureValues.bv * safeTargetPBV : 0,
    div: futureValues.div > 0 && safeTargetYield > 0 ? futureValues.div / (safeTargetYield / 100) : 0
  };

  // Validation : limites raisonnables (10% a 50x du prix actuel)
  const maxReasonableTarget = currentPrice * 50;
  const minReasonableTarget = currentPrice * 0.1;

  return {
    eps: targets.eps >= minReasonableTarget && targets.eps <= maxReasonableTarget && isFinite(targets.eps) ? targets.eps : 0,
    cf: targets.cf >= minReasonableTarget && targets.cf <= maxReasonableTarget && isFinite(targets.cf) ? targets.cf : 0,
    bv: targets.bv >= minReasonableTarget && targets.bv <= maxReasonableTarget && isFinite(targets.bv) ? targets.bv : 0,
    div: targets.div >= minReasonableTarget && targets.div <= maxReasonableTarget && isFinite(targets.div) ? targets.div : 0
  };
}

/**
 * Calcule la mediane d'un tableau de nombres
 */
function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Calcule l'ecart-type d'un tableau de nombres
 */
function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Detecte les metriques avec prix cibles aberrants et retourne les exclusions recommandees
 * 
 * Methode : Utilise l'ecart-type pour detecter les outliers
 * - Calcule la moyenne et l'ecart-type des prix cibles valides
 * - Une metrique est consideree comme outlier si son prix cible est a plus de 2 ecarts-types de la moyenne
 * 
 * @param data - Donnees historiques
 * @param assumptions - Assumptions actuelles
 * @returns Objet avec les exclusions recommandees (excludeEPS, excludeCF, excludeBV, excludeDIV)
 */
export function detectOutlierMetrics(
  data: AnnualData[],
  assumptions: Assumptions
): {
  excludeEPS: boolean;
  excludeCF: boolean;
  excludeBV: boolean;
  excludeDIV: boolean;
  detectedOutliers: string[];
} {
  // Calculer les prix cibles pour chaque metrique
  const targets = calculateTargetPrices(data, assumptions);

  // Filtrer les prix cibles valides (non-nuls et non exclus actuellement)
  const validTargets: Array<{ metric: string; price: number }> = [];
  
  if (targets.eps > 0 && !assumptions.excludeEPS) {
    validTargets.push({ metric: 'EPS', price: targets.eps });
  }
  if (targets.cf > 0 && !assumptions.excludeCF) {
    validTargets.push({ metric: 'CF', price: targets.cf });
  }
  if (targets.bv > 0 && !assumptions.excludeBV) {
    validTargets.push({ metric: 'BV', price: targets.bv });
  }
  if (targets.div > 0 && !assumptions.excludeDIV) {
    validTargets.push({ metric: 'DIV', price: targets.div });
  }

  // Si moins de 2 metriques valides, ne rien exclure automatiquement
  if (validTargets.length < 2) {
    return {
      excludeEPS: assumptions.excludeEPS || false,
      excludeCF: assumptions.excludeCF || false,
      excludeBV: assumptions.excludeBV || false,
      excludeDIV: assumptions.excludeDIV || false,
      detectedOutliers: []
    };
  }

  // Extraire les prix
  const prices = validTargets.map(t => t.price);

  // Calculer la mediane (plus robuste que la moyenne pour detecter les outliers)
  const median = calculateMedian(prices);
  
  // Calculer l'ecart-type
  const stdDev = calculateStandardDeviation(prices);

  // Si l'ecart-type est tres petit (tous les prix sont similaires), ne rien exclure
  if (stdDev < median * 0.1) {
    return {
      excludeEPS: assumptions.excludeEPS || false,
      excludeCF: assumptions.excludeCF || false,
      excludeBV: assumptions.excludeBV || false,
      excludeDIV: assumptions.excludeDIV || false,
      detectedOutliers: []
    };
  }

  // Detecter les outliers avec deux methodes combinees:
  // 1. Prix a plus de 1.5 ecarts-types de la mediane (statistique)
  // 2. Prix a plus de 50% d'ecart de la mediane (pourcentage)
  const stdDevThreshold = 1.5 * stdDev;
  const percentThreshold = median * 0.5; // 50% de la mediane
  const threshold = Math.min(stdDevThreshold, percentThreshold); // Utiliser le plus strict
  const detectedOutliers: string[] = [];

  // Verifier chaque metrique - exclure si au-dela du seuil OU si le retour est implausible
  // Critere utilisateur: Retour > 300% ou < -75% sur 5 ans est considere comme une erreur de donnees
  const currentPrice = Math.max(assumptions.currentPrice || 0, 0.01);
  const isImplausible = (targetPrice: number) => {
    if (currentPrice <= 0) return false;
    const returnPct = (targetPrice - currentPrice) / currentPrice;
    return returnPct > 3.0 || returnPct < -0.75;
  };

  const excludeEPS = assumptions.excludeEPS || (targets.eps > 0 && (Math.abs(targets.eps - median) > threshold || isImplausible(targets.eps)));
  const excludeCF = assumptions.excludeCF || (targets.cf > 0 && (Math.abs(targets.cf - median) > threshold || isImplausible(targets.cf)));
  const excludeBV = assumptions.excludeBV || (targets.bv > 0 && (Math.abs(targets.bv - median) > threshold || isImplausible(targets.bv)));
  const excludeDIV = assumptions.excludeDIV || (targets.div > 0 && (Math.abs(targets.div - median) > threshold || isImplausible(targets.div)));

  if (excludeEPS && !assumptions.excludeEPS) detectedOutliers.push('EPS');
  if (excludeCF && !assumptions.excludeCF) detectedOutliers.push('CF');
  if (excludeBV && !assumptions.excludeBV) detectedOutliers.push('BV');
  if (excludeDIV && !assumptions.excludeDIV) detectedOutliers.push('DIV');

  return {
    excludeEPS,
    excludeCF,
    excludeBV,
    excludeDIV,
    detectedOutliers
  };
}

