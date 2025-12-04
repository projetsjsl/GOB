import { AnnualData, CalculatedRatios, Assumptions, Recommendation } from '../types';

export const safeDiv = (num: number, den: number): number => {
  if (den === 0 || isNaN(den)) return 0;
  return num / den;
};

export const calculateRowRatios = (row: AnnualData): CalculatedRatios => {
  return {
    pcfHigh: safeDiv(row.priceHigh, row.cashFlowPerShare),
    pcfLow: safeDiv(row.priceLow, row.cashFlowPerShare),
    yieldHigh: safeDiv(row.dividendPerShare, row.priceLow) * 100, // Yield is typically Div/Price. High Yield comes from Low Price.
    yieldLow: safeDiv(row.dividendPerShare, row.priceHigh) * 100,
    pbvHigh: safeDiv(row.priceHigh, row.bookValuePerShare),
    pbvLow: safeDiv(row.priceLow, row.bookValuePerShare),
    peHigh: safeDiv(row.priceHigh, row.earningsPerShare),
    peLow: safeDiv(row.priceLow, row.earningsPerShare),
  };
};

export const calculateAverage = (data: number[]): number => {
  if (data.length === 0) return 0;
  const sum = data.reduce((a, b) => a + b, 0);
  return sum / data.length;
};

export const projectFutureValue = (current: number, rate: number, years: number): number => {
  return current * Math.pow(1 + rate / 100, years);
};

export const calculateCAGR = (startValue: number, endValue: number, years: number): number => {
  if (startValue <= 0 || endValue <= 0 || years <= 0) return 0;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
};

export const formatCurrency = (val: number) => 
  new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val);

export const formatPercent = (val: number) => 
  new Intl.NumberFormat('fr-CA', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(val / 100);

// New Helper to centralize Recommendation Logic
export const calculateRecommendation = (
  data: AnnualData[], 
  assumptions: Assumptions
): { 
  recommendation: Recommendation, 
  targetPrice: number, 
  buyLimit: number, 
  sellLimit: number 
} => {
  
  const validHistory = data.filter(d => d.priceHigh > 0 && d.priceLow > 0);
  
  // Robust Base Year Data Selection
  const baseYearData = data.find(d => d.year === assumptions.baseYear) || data[data.length - 1];
  const baseEPS = baseYearData?.earningsPerShare || 0;
  
  // Projection
  const projectedEPS5Y = projectFutureValue(baseEPS, assumptions.growthRateEPS, 5);
  const targetPriceEPS = projectedEPS5Y * assumptions.targetPE;

  // Logic matching App.tsx
  const targetPrice = targetPriceEPS; 

  const avgLowPrice = calculateAverage(validHistory.map(d => d.priceLow));
  // Fallback if no history
  const floorPrice = (avgLowPrice > 0 ? avgLowPrice : assumptions.currentPrice * 0.5) * 0.9; 

  // Buy Limit calculation (approximate 40% of the spread)
  const spread = targetPrice - floorPrice;
  const buyLimit = floorPrice + (spread * 0.33); // Slightly adjusted to be conservative, or use 0.4
  const sellLimit = targetPrice; // Or TargetPrice * 0.9

  let recommendation = Recommendation.HOLD;
  
  // Safety check to prevent showing Buy if target is 0
  if (targetPrice > 0) {
      if (assumptions.currentPrice < buyLimit) recommendation = Recommendation.BUY;
      else if (assumptions.currentPrice > sellLimit) recommendation = Recommendation.SELL;
  }

  return { recommendation, targetPrice, buyLimit, sellLimit };
};

/**
 * Auto-fill assumptions basées sur les données historiques FMP
 * Cette fonction centralise la logique d'auto-fill pour garantir la cohérence
 * Utilisée lors de la création de nouveaux profils et lors de la synchronisation
 * 
 * @param data - Données historiques annuelles depuis FMP
 * @param currentPrice - Prix actuel de l'action
 * @param existingAssumptions - Assumptions existantes (pour préserver les valeurs non calculées)
 * @returns Nouvelles assumptions avec métriques auto-remplies
 */
export const autoFillAssumptionsFromFMPData = (
  data: AnnualData[],
  currentPrice: number,
  existingAssumptions?: Partial<Assumptions>
): Partial<Assumptions> => {
  // Filtrer les données valides (avec prix High/Low > 0)
  const validHistory = data.filter(d => d.priceHigh > 0 && d.priceLow > 0);
  
  // Trouver la dernière année avec EPS valide pour Base Year
  const lastValidData = [...data].reverse().find(d => d.earningsPerShare > 0) || data[data.length - 1];
  const lastData = data[data.length - 1];
  const firstData = data[0];
  const yearsDiff = Math.max(1, lastValidData.year - firstData.year); // Au moins 1 an
  
  // Calculer les CAGRs historiques (taux de croissance annuel composé)
  const histGrowthEPS = calculateCAGR(firstData.earningsPerShare, lastValidData.earningsPerShare, yearsDiff);
  const histGrowthSales = calculateCAGR(firstData.cashFlowPerShare, lastValidData.cashFlowPerShare, yearsDiff);
  const histGrowthBV = calculateCAGR(firstData.bookValuePerShare, lastValidData.bookValuePerShare, yearsDiff);
  const histGrowthDiv = calculateCAGR(firstData.dividendPerShare, lastValidData.dividendPerShare, yearsDiff);
  
  // Calculer les ratios moyens historiques (P/E, P/CF, P/BV, Yield)
  // P/E = Prix moyen / EPS moyen
  const peRatios = validHistory
    .map(d => {
      if (d.earningsPerShare <= 0) return null;
      return (d.priceHigh / d.earningsPerShare + d.priceLow / d.earningsPerShare) / 2;
    })
    .filter((v): v is number => v !== null && isFinite(v) && v > 0);
  const avgPE = peRatios.length > 0 ? calculateAverage(peRatios) : 15;
  
  // P/CF = Prix moyen / Cash Flow moyen
  const pcfRatios = validHistory
    .map(d => {
      if (d.cashFlowPerShare <= 0) return null;
      return (d.priceHigh / d.cashFlowPerShare + d.priceLow / d.cashFlowPerShare) / 2;
    })
    .filter((v): v is number => v !== null && isFinite(v) && v > 0);
  const avgPCF = pcfRatios.length > 0 ? calculateAverage(pcfRatios) : 10;
  
  // P/BV = Prix moyen / Book Value moyen
  const pbvRatios = validHistory
    .map(d => {
      if (d.bookValuePerShare <= 0) return null;
      return (d.priceHigh / d.bookValuePerShare + d.priceLow / d.bookValuePerShare) / 2;
    })
    .filter((v): v is number => v !== null && isFinite(v) && v > 0);
  const avgPBV = pbvRatios.length > 0 ? calculateAverage(pbvRatios) : 6;
  
  // Yield = Dividende / Prix (en pourcentage)
  const yieldValues = validHistory
    .map(d => {
      if (d.priceHigh <= 0) return null;
      return (d.dividendPerShare / d.priceHigh) * 100;
    })
    .filter((v): v is number => v !== null && isFinite(v) && v >= 0);
  const avgYield = yieldValues.length > 0 ? calculateAverage(yieldValues) : 2.0;
  
  // Retourner les assumptions auto-remplies avec limites de sécurité
  return {
    currentPrice,
    currentDividend: lastData.dividendPerShare || existingAssumptions?.currentDividend || 0,
    baseYear: lastValidData.year,
    // Limiter les taux de croissance à 0-20% (valeurs raisonnables)
    growthRateEPS: Math.min(Math.max(histGrowthEPS, 0), 20),
    growthRateSales: Math.min(Math.max(histGrowthSales, 0), 20),
    growthRateCF: Math.min(Math.max(histGrowthSales, 0), 20), // Utilise Sales pour CF (cohérent avec historique)
    growthRateBV: Math.min(Math.max(histGrowthBV, 0), 20),
    growthRateDiv: Math.min(Math.max(histGrowthDiv, 0), 20),
    // Limiter les ratios à des valeurs raisonnables
    targetPE: parseFloat(Math.max(1, Math.min(avgPE, 100)).toFixed(1)),
    targetPCF: parseFloat(Math.max(1, Math.min(avgPCF, 100)).toFixed(1)),
    targetPBV: parseFloat(Math.max(0.5, Math.min(avgPBV, 50)).toFixed(1)),
    targetYield: parseFloat(Math.max(0, Math.min(avgYield, 20)).toFixed(2)),
    // Préserver les autres valeurs existantes si fournies
    requiredReturn: existingAssumptions?.requiredReturn,
    dividendPayoutRatio: existingAssumptions?.dividendPayoutRatio,
    excludeEPS: existingAssumptions?.excludeEPS,
    excludeCF: existingAssumptions?.excludeCF,
    excludeBV: existingAssumptions?.excludeBV,
    excludeDIV: existingAssumptions?.excludeDIV
  };
};