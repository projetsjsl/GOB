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