import { AnnualData, CalculatedRatios, Assumptions, Recommendation } from '../types';
import { FMPAnalystEstimate } from '../types/fmp';
import { sanitizeAssumptionsSync } from './validation';

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
  if (!data || data.length === 0) return 0;
  // Filter out invalid values before calculating
  const validData = data.filter(n => n != null && isFinite(n));
  if (validData.length === 0) return 0;
  const sum = validData.reduce((a, b) => a + b, 0);
  return isFinite(sum) ? sum / validData.length : 0;
};


export const projectFutureValue = (current: number, rate: number, years: number): number => {
  // Validate inputs - return 0 for invalid data
  if (current == null || rate == null || years == null) return 0;
  if (!isFinite(current) || !isFinite(rate) || !isFinite(years)) return 0;
  if (years <= 0) return current;
  
  const result = current * Math.pow(1 + rate / 100, years);
  return isFinite(result) ? result : 0;
};

export const calculateCAGR = (startValue: number, endValue: number, years: number): number => {
  // Validate inputs - return 0 for invalid data
  if (startValue == null || endValue == null || years == null) return 0;
  if (!isFinite(startValue) || !isFinite(endValue) || !isFinite(years)) return 0;
  if (startValue <= 0 || endValue <= 0 || years <= 0) return 0;

  const result = (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
  return isFinite(result) ? result : 0;
};

/**
 * S1-CALC-002 & S1-CALC-003: Calculate CAGR for multiple time periods (5, 10, 15 years)
 * Returns CAGR for all available periods from historical data
 *
 * @param data - Annual historical data sorted by year
 * @param metricKey - Key of the metric to calculate CAGR for
 * @returns Object with CAGR for different periods
 */
export const calculateMultiPeriodCAGR = (
  data: AnnualData[],
  metricKey: keyof AnnualData
): {
  cagr5y: number | null;
  cagr10y: number | null;
  cagr15y: number | null;
  cagrMax: number | null;
} => {
  if (!data || data.length < 2) {
    return { cagr5y: null, cagr10y: null, cagr15y: null, cagrMax: null };
  }

  // Sort data by year ascending
  const sorted = [...data].sort((a, b) => Number(a.year) - Number(b.year));
  const lastData = sorted[sorted.length - 1];
  const endValue = Number(lastData[metricKey]);

  // Helper to find the closest valid data point for a target year
  const findStartPoint = (yearsBack: number): { value: number; years: number } | null => {
    const targetYear = Number(lastData.year) - yearsBack;

    // Find the closest data point at or before the target year with valid value
    const candidates = sorted
      .filter(d => Number(d.year) <= targetYear && Number(d[metricKey]) > 0)
      .sort((a, b) => Number(b.year) - Number(a.year)); // Descending - get most recent

    if (candidates.length === 0) return null;

    const startData = candidates[0];
    const startValue = Number(startData[metricKey]);
    const actualYears = Number(lastData.year) - Number(startData.year);

    if (startValue <= 0 || endValue <= 0 || actualYears < 1) return null;

    return { value: startValue, years: actualYears };
  };

  // Calculate CAGR for each period
  const cagr5yData = findStartPoint(5);
  const cagr10yData = findStartPoint(10);
  const cagr15yData = findStartPoint(15);

  // Calculate max CAGR (from first valid data point to last)
  const firstValid = sorted.find(d => Number(d[metricKey]) > 0);
  let cagrMax: number | null = null;
  if (firstValid) {
    const startValue = Number(firstValid[metricKey]);
    const years = Number(lastData.year) - Number(firstValid.year);
    if (startValue > 0 && endValue > 0 && years >= 1) {
      cagrMax = calculateCAGR(startValue, endValue, years);
    }
  }

  return {
    cagr5y: cagr5yData ? calculateCAGR(cagr5yData.value, endValue, cagr5yData.years) : null,
    cagr10y: cagr10yData ? calculateCAGR(cagr10yData.value, endValue, cagr10yData.years) : null,
    cagr15y: cagr15yData ? calculateCAGR(cagr15yData.value, endValue, cagr15yData.years) : null,
    cagrMax
  };
};

/**
 * Calcule la croissance historique sur une periode donnee (par defaut 5 ans) pour une metrique
 * Utilise pour initialiser automatiquement les taux de croissance si absents
 * 
 * @param data - Donnees historiques annuelles
 * @param metricKey - Cle de la metrique a calculer ('earningsPerShare', 'cashFlowPerShare', etc.)
 * @param period - Periode en annees (par defaut 5 ans)
 * @returns Taux de croissance en pourcentage (CAGR)
 */
export const calculateHistoricalGrowth = (
  data: AnnualData[],
  metricKey: keyof AnnualData,
  period: number = 5
): number => {
  if (!data || data.length < 2) return 0;
  
  // Trier par annee
  const sorted = [...data].sort((a, b) => Number(a.year) - Number(b.year));
  const last = sorted[sorted.length - 1];
  const lastValue = Number(last[metricKey]);

  if (lastValue <= 0) return 0;

  const targetStartYear = Number(last.year) - period;
  
  // Chercher le point de depart valide le plus proche de N-period
  let startCandidate = sorted
    .filter(d => Number(d.year) <= targetStartYear && Number(d[metricKey]) > 0)
    .sort((a, b) => Number(b.year) - Number(a.year))[0];

  // Fallback: Si rien trouve, essayer n'importe quel point anterieur
  if (!startCandidate) {
    startCandidate = sorted
      .filter(d => Number(d.year) < Number(last.year) && Number(d[metricKey]) > 0)
      .sort((a, b) => Number(a.year) - Number(b.year))[0];
  }

  if (!startCandidate) return 0;

  const startValue = Number(startCandidate[metricKey]);
  const years = Number(last.year) - Number(startCandidate.year);

  if (years < 1) return 0;

  return calculateCAGR(startValue, lastValue, years);
};


export const formatCurrency = (val: number | undefined | null) => {
  //  CRITIQUE : Gerer undefined/null pour eviter d'afficher "0,00 $" pour des valeurs non chargees
  if (val === undefined || val === null || !isFinite(val) || val === 0) {
    return 'N/A';
  }
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val);
};

export const formatPercent = (val: number) => {
  //  Validation pour eviter NaN
  if (val == null || !isFinite(val) || isNaN(val)) {
    return 'N/A';
  }
  return new Intl.NumberFormat('fr-CA', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(val / 100);
};

/**
 * S1-CALC-004: Calculate Graham Number
 * Graham Number = (22.5 x EPS x Book Value Per Share)
 * Represents Ben Graham's intrinsic value estimate
 *
 * @param eps - Earnings Per Share
 * @param bookValue - Book Value Per Share
 * @returns Graham Number or 0 if calculation is invalid
 */
export const calculateGrahamNumber = (eps: number, bookValue: number): number => {
  if (eps <= 0 || bookValue <= 0 || !isFinite(eps) || !isFinite(bookValue)) return 0;
  const result = Math.sqrt(22.5 * eps * bookValue);
  return isFinite(result) ? result : 0;
};

/**
 * S1-CALC-005: Calculate Peter Lynch PEG Ratio
 * PEG = PE Ratio / EPS Growth Rate
 * A PEG < 1 suggests the stock is undervalued relative to its growth
 *
 * @param peRatio - Current P/E Ratio
 * @param growthRate - Expected EPS growth rate (%)
 * @returns PEG ratio or null if invalid
 */
export const calculatePEG = (peRatio: number, growthRate: number): number | null => {
  if (peRatio <= 0 || growthRate <= 0 || !isFinite(peRatio) || !isFinite(growthRate)) return null;
  const result = peRatio / growthRate;
  return isFinite(result) && result > 0 && result < 100 ? result : null;
};

/**
 * S1-CALC-006: Calculate Discounted Cash Flow (DCF) Valuation
 * Simple DCF model with terminal value
 *
 * @param currentCF - Current Free Cash Flow per share
 * @param growthRate - Expected growth rate (%)
 * @param discountRate - Required rate of return (%)
 * @param terminalGrowth - Terminal growth rate (%) - default 2.5%
 * @param projectionYears - Number of years to project - default 5
 * @returns Intrinsic value per share
 */
export const calculateDCF = (
  currentCF: number,
  growthRate: number,
  discountRate: number,
  terminalGrowth: number = 2.5,
  projectionYears: number = 5
): number => {
  if (currentCF <= 0 || discountRate <= 0 || growthRate < -50 || growthRate > 100) return 0;
  if (!isFinite(currentCF) || !isFinite(growthRate) || !isFinite(discountRate)) return 0;
  if (terminalGrowth >= discountRate) return 0; // Terminal growth must be less than discount rate

  let presentValue = 0;
  let cashFlow = currentCF;

  // Project cash flows and discount them
  for (let year = 1; year <= projectionYears; year++) {
    cashFlow = cashFlow * (1 + growthRate / 100);
    const discountFactor = Math.pow(1 + discountRate / 100, year);
    presentValue += cashFlow / discountFactor;
  }

  // Terminal value using Gordon Growth Model
  const terminalCF = cashFlow * (1 + terminalGrowth / 100);
  const terminalValue = terminalCF / (discountRate / 100 - terminalGrowth / 100);
  const discountedTerminalValue = terminalValue / Math.pow(1 + discountRate / 100, projectionYears);

  const intrinsicValue = presentValue + discountedTerminalValue;
  return isFinite(intrinsicValue) && intrinsicValue > 0 ? intrinsicValue : 0;
};

/**
 * S1-CALC-007: Calculate Dividend Discount Model (DDM) Valuation
 * Gordon Growth Model: Value = D1 / (r - g)
 * where D1 = next year's dividend, r = required return, g = growth rate
 *
 * @param currentDividend - Current dividend per share
 * @param growthRate - Expected dividend growth rate (%)
 * @param requiredReturn - Required rate of return (%)
 * @returns Intrinsic value per share
 */
export const calculateDDM = (
  currentDividend: number,
  growthRate: number,
  requiredReturn: number
): number => {
  if (currentDividend <= 0 || requiredReturn <= 0 || growthRate < 0) return 0;
  if (!isFinite(currentDividend) || !isFinite(growthRate) || !isFinite(requiredReturn)) return 0;
  if (growthRate >= requiredReturn) return 0; // Growth must be less than required return

  const nextDividend = currentDividend * (1 + growthRate / 100);
  const intrinsicValue = nextDividend / (requiredReturn / 100 - growthRate / 100);

  return isFinite(intrinsicValue) && intrinsicValue > 0 ? intrinsicValue : 0;
};

/**
 * S1-CALC-008: Calculate Margin of Safety
 * MOS = (Intrinsic Value - Current Price) / Intrinsic Value x 100
 *
 * @param intrinsicValue - Estimated intrinsic value
 * @param currentPrice - Current market price
 * @returns Margin of safety percentage
 */
export const calculateMarginOfSafety = (intrinsicValue: number, currentPrice: number): number => {
  if (intrinsicValue <= 0 || currentPrice < 0 || !isFinite(intrinsicValue) || !isFinite(currentPrice)) return 0;
  const mos = ((intrinsicValue - currentPrice) / intrinsicValue) * 100;
  return isFinite(mos) ? mos : 0;
};

/**
 * S1-CALC-010: Calculate Earnings Yield
 * Earnings Yield = EPS / Price = 1 / PE Ratio
 *
 * @param eps - Earnings Per Share
 * @param price - Current Price
 * @returns Earnings yield as percentage
 */
export const calculateEarningsYield = (eps: number, price: number): number => {
  if (eps <= 0 || price <= 0 || !isFinite(eps) || !isFinite(price)) return 0;
  const yield_ = (eps / price) * 100;
  return isFinite(yield_) ? yield_ : 0;
};

/**
 * S1-CALC-011: Calculate Free Cash Flow Yield
 * FCF Yield = Free Cash Flow per Share / Price
 *
 * @param fcfPerShare - Free Cash Flow per Share
 * @param price - Current Price
 * @returns FCF yield as percentage
 */
export const calculateFCFYield = (fcfPerShare: number, price: number): number => {
  if (fcfPerShare <= 0 || price <= 0 || !isFinite(fcfPerShare) || !isFinite(price)) return 0;
  const yield_ = (fcfPerShare / price) * 100;
  return isFinite(yield_) ? yield_ : 0;
};

/**
 * S1-CALC-012: Calculate ROIC (Return on Invested Capital)
 * ROIC = NOPAT / Invested Capital
 * Approximation: ROIC  Operating Income x (1 - Tax Rate) / (Total Assets - Current Liabilities)
 *
 * @param operatingIncome - Operating income
 * @param taxRate - Effective tax rate (%)
 * @param totalAssets - Total assets
 * @param currentLiabilities - Current liabilities
 * @returns ROIC as percentage
 */
export const calculateROIC = (
  operatingIncome: number,
  taxRate: number,
  totalAssets: number,
  currentLiabilities: number
): number => {
  if (operatingIncome <= 0 || totalAssets <= 0 || currentLiabilities < 0) return 0;
  if (!isFinite(operatingIncome) || !isFinite(taxRate) || !isFinite(totalAssets) || !isFinite(currentLiabilities)) return 0;

  const nopat = operatingIncome * (1 - taxRate / 100);
  const investedCapital = totalAssets - currentLiabilities;

  if (investedCapital <= 0) return 0;

  const roic = (nopat / investedCapital) * 100;
  return isFinite(roic) ? roic : 0;
};

/**
 * S1-CALC-013: ROE Decomposition (DuPont Analysis)
 * ROE = Net Profit Margin x Asset Turnover x Equity Multiplier
 * ROE = (Net Income / Revenue) x (Revenue / Assets) x (Assets / Equity)
 *
 * @param netIncome - Net income
 * @param revenue - Total revenue
 * @param totalAssets - Total assets
 * @param equity - Shareholders' equity
 * @returns DuPont analysis components
 */
export const calculateDuPontROE = (
  netIncome: number,
  revenue: number,
  totalAssets: number,
  equity: number
): {
  roe: number;
  netProfitMargin: number;
  assetTurnover: number;
  equityMultiplier: number;
} => {
  const result = {
    roe: 0,
    netProfitMargin: 0,
    assetTurnover: 0,
    equityMultiplier: 0
  };

  if (revenue <= 0 || totalAssets <= 0 || equity <= 0) return result;
  if (!isFinite(netIncome) || !isFinite(revenue) || !isFinite(totalAssets) || !isFinite(equity)) return result;

  result.netProfitMargin = (netIncome / revenue) * 100;
  result.assetTurnover = revenue / totalAssets;
  result.equityMultiplier = totalAssets / equity;
  result.roe = (netIncome / equity) * 100;

  return result;
};

/**
 * S1-CALC-014: Debt-to-Equity Ratio Trend Analysis
 * Calculates D/E ratio and analyzes trend over time
 *
 * @param data - Historical financial data with debt and equity info
 * @returns Current D/E and trend
 */
export const calculateDebtToEquityTrend = (
  data: { totalDebt: number; equity: number; year: number }[]
): {
  current: number;
  average: number;
  trend: 'improving' | 'stable' | 'deteriorating';
} => {
  if (!data || data.length === 0) {
    return { current: 0, average: 0, trend: 'stable' };
  }

  const validData = data.filter(d => d.equity > 0 && isFinite(d.totalDebt) && isFinite(d.equity));
  if (validData.length === 0) {
    return { current: 0, average: 0, trend: 'stable' };
  }

  const deRatios = validData.map(d => d.totalDebt / d.equity);
  const current = deRatios[deRatios.length - 1] || 0;
  const average = deRatios.reduce((sum, val) => sum + val, 0) / deRatios.length;

  // Determine trend: compare recent 3 years vs older data
  let trend: 'improving' | 'stable' | 'deteriorating' = 'stable';
  if (deRatios.length >= 3) {
    const recent = deRatios.slice(-3).reduce((sum, val) => sum + val, 0) / 3;
    const older = deRatios.slice(0, -3).reduce((sum, val) => sum + val, 0) / Math.max(1, deRatios.length - 3);
    if (recent < older * 0.9) trend = 'improving'; // 10% reduction
    else if (recent > older * 1.1) trend = 'deteriorating'; // 10% increase
  }

  return { current, average, trend };
};

/**
 * S1-CALC-015: Interest Coverage Ratio
 * Interest Coverage = EBIT / Interest Expense
 * Measures ability to pay interest on debt
 *
 * @param ebit - Earnings Before Interest and Taxes
 * @param interestExpense - Interest expense
 * @returns Interest coverage ratio
 */
export const calculateInterestCoverage = (ebit: number, interestExpense: number): number => {
  if (ebit <= 0 || interestExpense <= 0 || !isFinite(ebit) || !isFinite(interestExpense)) return 0;
  const coverage = ebit / interestExpense;
  return isFinite(coverage) ? coverage : 0;
};

/**
 * S1-CALC-016: Payout Ratio Trend Analysis
 * Payout Ratio = Dividends / Net Income
 * Analyzes sustainability of dividend payments
 *
 * @param data - Historical dividend and earnings data
 * @returns Current payout ratio and trend
 */
export const calculatePayoutRatioTrend = (
  data: AnnualData[]
): {
  current: number;
  average: number;
  sustainable: boolean;
} => {
  if (!data || data.length === 0) {
    return { current: 0, average: 0, sustainable: false };
  }

  const validData = data.filter(d => d.earningsPerShare > 0 && d.dividendPerShare >= 0);
  if (validData.length === 0) {
    return { current: 0, average: 0, sustainable: false };
  }

  const payoutRatios = validData.map(d => (d.dividendPerShare / d.earningsPerShare) * 100);
  const current = payoutRatios[payoutRatios.length - 1] || 0;
  const average = payoutRatios.reduce((sum, val) => sum + val, 0) / payoutRatios.length;

  // Sustainable if current payout is < 80% and average < 70%
  const sustainable = current < 80 && average < 70;

  return { current, average, sustainable };
};

/**
 * S1-CALC-017: Dividend Growth Rate
 * Calculates CAGR of dividends over specified period
 *
 * @param data - Historical dividend data
 * @param years - Number of years to look back (default 5)
 * @returns Dividend growth rate (CAGR)
 */
export const calculateDividendGrowthRate = (data: AnnualData[], years: number = 5): number => {
  return calculateHistoricalGrowth(data, 'dividendPerShare', years);
};

/**
 * S1-CALC-023: Earnings Quality Score
 * Composite score based on:
 * - Cash flow vs earnings ratio
 * - Accruals ratio
 * - Consistency of earnings
 *
 * @param data - Historical earnings and cash flow data
 * @returns Quality score 0-100 (higher is better)
 */
export const calculateEarningsQuality = (data: AnnualData[]): number => {
  if (!data || data.length < 3) return 0;

  const validData = data.filter(d => d.earningsPerShare > 0 && d.cashFlowPerShare > 0);
  if (validData.length < 3) return 0;

  // Factor 1: Cash Flow to Earnings ratio (max 40 points)
  const cfToEarnings = validData.map(d => d.cashFlowPerShare / d.earningsPerShare);
  const avgCFtoE = cfToEarnings.reduce((sum, val) => sum + val, 0) / cfToEarnings.length;
  const cfScore = Math.min(40, avgCFtoE * 40); // 1.0 ratio = 40 points

  // Factor 2: Earnings consistency (max 40 points)
  const epsValues = validData.map(d => d.earningsPerShare);
  const epsGrowthRates = [];
  for (let i = 1; i < epsValues.length; i++) {
    const growth = (epsValues[i] - epsValues[i - 1]) / epsValues[i - 1];
    epsGrowthRates.push(growth);
  }
  const avgGrowth = epsGrowthRates.reduce((sum, val) => sum + val, 0) / epsGrowthRates.length;
  const variance = epsGrowthRates.reduce((sum, val) => sum + Math.pow(val - avgGrowth, 2), 0) / epsGrowthRates.length;
  const stdDev = Math.sqrt(variance);
  const consistencyScore = Math.max(0, 40 - stdDev * 100); // Lower volatility = higher score

  // Factor 3: Positive earnings trend (max 20 points)
  const recentEPS = epsValues.slice(-3);
  const trendScore = recentEPS.every((val, i) => i === 0 || val >= recentEPS[i - 1]) ? 20 : 0;

  const totalScore = cfScore + consistencyScore + trendScore;
  return Math.min(100, Math.max(0, totalScore));
};

/**
 * S1-CALC-024: Cash Conversion Rate
 * Cash Conversion = Operating Cash Flow / Net Income
 * Measures how efficiently earnings are converted to cash
 *
 * @param operatingCashFlow - Operating cash flow
 * @param netIncome - Net income
 * @returns Cash conversion ratio
 */
export const calculateCashConversion = (operatingCashFlow: number, netIncome: number): number => {
  if (netIncome <= 0 || !isFinite(operatingCashFlow) || !isFinite(netIncome)) return 0;
  const conversion = (operatingCashFlow / netIncome) * 100;
  return isFinite(conversion) ? conversion : 0;
};

/**
 * Detecte si un ticker est probablement un fonds mutuel
 * Base sur des patterns communs de symboles de fonds mutuels
 * 
 * @param symbol - Le symbole du ticker a verifier
 * @param companyName - Le nom de la compagnie (optionnel, pour validation supplementaire)
 * @returns true si le ticker semble etre un fonds mutuel
 */
export const isMutualFund = (symbol: string, companyName?: string): boolean => {
  const symbolUpper = symbol.toUpperCase().trim();
  const nameUpper = (companyName || '').toUpperCase();
  
  // Liste exhaustive d'actions legitimes qui pourraient etre confondues
  const knownStocksWhitelist = [
    'CGNX', 'EQIX', 'GATX', 'HOLX', 'LRCX', 'NBIX', 'NFLX', 'OTEX', 'PAYX', 
    'IDXX', 'VRTX', 'TXN', 'XOM', 'XEL', 'XPO', 'XRAY', 'XYL', 'XEC', 'XENE',
    'AMZN', 'CMNX', 'CNX', 'DEX', 'FLEX', 'HEX', 'JXN', 'KEX', 'LEX', 'MEX',
    'NEX', 'PEX', 'QEX', 'REX', 'SEX', 'TEX', 'UEX', 'VEX', 'WEX', 'YEX', 'ZEX',
    'POW', 'TROW', 'T', 'AT', 'V', 'MA', 'BLK' // Ajout de POW, TROW et autres
  ];
  
  // Si c'est une action connue, ce n'est PAS un fonds mutuel
  if (knownStocksWhitelist.includes(symbolUpper)) {
    return false;
  }
  
  // Verifier le nom de la compagnie pour des indicateurs de fonds mutuel (METHODE PRINCIPALE)
  if (nameUpper.includes('MUTUAL FUND') || 
      nameUpper.includes('FUND TRUST') ||
      nameUpper.includes('INVESTMENT FUND') ||
      nameUpper.includes('INDEX FUND') ||
      /* nameUpper.includes('ETF') || */ // ETF sont OK, on les garde souvent
      (nameUpper.includes('FUND') && nameUpper.includes('SERIES')) ||
      nameUpper.includes('VANGUARD FUNDS') || // Plus specifique
      nameUpper.includes('FIDELITY FUNDS')
      /* Removed T. ROWE PRICE checks which was flagging the company itself */) {
    return true;
  }
  
  // Patterns specifiques connus de fonds mutuels (Vanguard, Fidelity, etc.)
  // VTSAX, VFIAX, VTSIX, etc. - fonds Vanguard avec pattern V + 3-4 lettres + X/IX
  // DOIT faire 5 lettres pour etre un mutual fund typique US
  const vanguardPattern = /^V[A-Z]{3}X$/; 
  if (vanguardPattern.test(symbolUpper) && symbolUpper.length === 5) {
    return true;
  }
  
  // Fonds Fidelity : FIDXX, FDRXX, etc.
  const fidelityPattern = /^F[D|I][A-Z]{2}X$/;
  if (fidelityPattern.test(symbolUpper) && symbolUpper.length === 5) {
    return true;
  }
  
  // Fonds avec suffixe XX (double X) - tres commun pour les fonds mutuels
  // MAIS attention aux actions comme MAXX, TJX, etc.
  // On exige 5 lettres minimum pour ce pattern
  if (symbolUpper.endsWith('XX') && symbolUpper.length >= 5) {
    return true;
  }
  
  // Ne PAS detecter comme fonds mutuel si :
  // - Le symbole contient un point (ex: XOM.MX = bourse mexicaine)
  // - Le symbole est trop court (< 4 caracteres)
  // - Le symbole est trop long (> 6 caracteres, sauf patterns specifiques)
  if (symbolUpper.includes('.') || symbolUpper.length < 5) { // Mutual funds are usually 5 chars
    return false;
  }
  
  // Par defaut, ne pas considerer comme fonds mutuel
  return false;
};

/**
 * Calculate projected EPS using analyst consensus (ValueLine-style methodology)
 * Priority: Analyst Consensus > Historical CAGR
 *
 * @param historicalData - Historical annual data
 * @param analystEstimates - FMP analyst estimates (future projections)
 * @param currentEPS - Current/latest EPS
 * @param yearsAhead - How many years to project (default: 5)
 * @returns Projection with corridor (low/mid/high) and method used
 */
export const calculateProjectedEPSWithConsensus = (
  historicalData: AnnualData[],
  analystEstimates: FMPAnalystEstimate[] | undefined,
  currentEPS: number,
  yearsAhead: number = 5
): {
  projectedEPS: number;
  projectedEPSLow: number;
  projectedEPSHigh: number;
  method: 'consensus' | 'cagr';
  confidence: number;
  analystCount: number;
} => {
  // Guard clause for invalid currentEPS
  if (!currentEPS || currentEPS <= 0 || !isFinite(currentEPS)) {
    return {
      projectedEPS: 0,
      projectedEPSLow: 0,
      projectedEPSHigh: 0,
      method: 'cagr',
      confidence: 0,
      analystCount: 0
    };
  }

  // Try analyst consensus first
  if (analystEstimates && Array.isArray(analystEstimates) && analystEstimates.length > 0) {
    const currentYear = new Date().getFullYear();

    // Filter for future estimates with valid EPS data
    // FIX: Accept negative EPS values (growth stocks, turnarounds)
    const futureEstimates = analystEstimates
      .filter(e => {
        if (!e || !e.date) return false;
        const estimateYear = parseInt(e.date.split('-')[0]);
        return estimateYear > currentYear &&
               e.estimatedEpsAvg !== null &&
               e.estimatedEpsAvg !== undefined &&
               isFinite(e.estimatedEpsAvg);
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    // Need at least 1 future estimate to calculate growth
    if (futureEstimates.length >= 1) {
      // Use the farthest available estimate (max 2-3 years out typically)
      const farthestEstimate = futureEstimates[futureEstimates.length - 1];
      const estimateYear = parseInt(farthestEstimate.date.split('-')[0]);
      const yearsToEstimate = estimateYear - currentYear;

      if (yearsToEstimate >= 1) {
        // Handle negative EPS scenarios
        // If current or estimated EPS is negative/zero, use direct projection instead of CAGR
        let projectedEPS: number;
        let impliedCAGR = 0;

        const canUseCAGR = currentEPS > 0 && farthestEstimate.estimatedEpsAvg > 0;

        if (canUseCAGR) {
          // Normal case: both positive, use CAGR
          impliedCAGR = calculateCAGR(
            currentEPS,
            farthestEstimate.estimatedEpsAvg,
            yearsToEstimate
          );
          projectedEPS = projectFutureValue(currentEPS, impliedCAGR, yearsAhead);
        } else {
          // Edge case: negative or zero EPS - use linear extrapolation from analyst estimate
          // Project from the analyst estimate forward using simple growth assumption
          const epsChange = farthestEstimate.estimatedEpsAvg - currentEPS;
          const yearlyChange = epsChange / yearsToEstimate;
          projectedEPS = farthestEstimate.estimatedEpsAvg + (yearlyChange * (yearsAhead - yearsToEstimate));
        }

        // Calculate corridor using analyst's low/high estimates
        let lowRatio = 0.85;  // Default -15%
        let highRatio = 1.15; // Default +15%

        // Only use ratio-based corridor for positive EPS (ratios don't work well for negative values)
        if (farthestEstimate.estimatedEpsLow !== null &&
            farthestEstimate.estimatedEpsLow !== undefined &&
            farthestEstimate.estimatedEpsHigh !== null &&
            farthestEstimate.estimatedEpsHigh !== undefined &&
            farthestEstimate.estimatedEpsAvg > 0) {
          lowRatio = farthestEstimate.estimatedEpsLow / farthestEstimate.estimatedEpsAvg;
          highRatio = farthestEstimate.estimatedEpsHigh / farthestEstimate.estimatedEpsAvg;

          // Sanity check: corridor should be reasonable (not too tight or wide)
          if (lowRatio < 0.5) lowRatio = 0.5;
          if (highRatio > 2.0) highRatio = 2.0;
          if (lowRatio > 0.99) lowRatio = 0.85;
          if (highRatio < 1.01) highRatio = 1.15;
        }
        // For negative EPS, use wider default corridor (more uncertainty)
        else if (farthestEstimate.estimatedEpsAvg <= 0) {
          lowRatio = 0.70;  // -30% for negative/turnaround stocks
          highRatio = 1.50; // +50% for negative/turnaround stocks
        }

        // Confidence based on number of analysts (normalize to 20 as "high confidence")
        const analystCount = farthestEstimate.numberAnalystsEstimatedEps || 0;
        const confidence = Math.min(analystCount / 20, 1);

        return {
          projectedEPS: isFinite(projectedEPS) ? projectedEPS : 0,
          projectedEPSLow: isFinite(projectedEPS * lowRatio) ? projectedEPS * lowRatio : 0,
          projectedEPSHigh: isFinite(projectedEPS * highRatio) ? projectedEPS * highRatio : 0,
          method: 'consensus',
          confidence,
          analystCount
        };
      }
    }
  }

  // Fallback: Historical CAGR (original method)
  const sorted = [...historicalData].sort((a, b) => Number(a.year) - Number(b.year));
  const lastData = sorted[sorted.length - 1];

  // Calculate 5-year CAGR from historical data
  let historicalCAGR = 0;
  if (sorted.length >= 2 && lastData) {
    const targetStartYear = Number(lastData.year) - 5;
    const startCandidate = sorted
      .filter(d => Number(d.year) <= targetStartYear && d.earningsPerShare > 0)
      .sort((a, b) => Number(b.year) - Number(a.year))[0];

    if (startCandidate && startCandidate.earningsPerShare > 0) {
      const years = Number(lastData.year) - Number(startCandidate.year);
      if (years >= 1) {
        historicalCAGR = calculateCAGR(
          startCandidate.earningsPerShare,
          currentEPS,
          years
        );
      }
    }
  }

  const projectedEPS = projectFutureValue(currentEPS, historicalCAGR, yearsAhead);

  return {
    projectedEPS: isFinite(projectedEPS) ? projectedEPS : 0,
    projectedEPSLow: isFinite(projectedEPS * 0.85) ? projectedEPS * 0.85 : 0,
    projectedEPSHigh: isFinite(projectedEPS * 1.15) ? projectedEPS * 1.15 : 0,
    method: 'cagr',
    confidence: 0.5,  // Medium confidence for historical extrapolation
    analystCount: 0
  };
};

// New Helper to centralize Recommendation Logic
// Enhanced to support analyst consensus (ValueLine-style) when available
// Returns BOTH projection methods so UI can display complete information
export const calculateRecommendation = (
  data: AnnualData[],
  assumptions: Assumptions,
  analystEstimates?: FMPAnalystEstimate[]  // Optional: FMP analyst estimates for consensus-based projection
): {
  recommendation: Recommendation;
  targetPrice: number;
  targetPriceLow: number;   // Low end of target corridor
  targetPriceHigh: number;  // High end of target corridor
  buyLimit: number;
  sellLimit: number;
  // Primary projection (consensus if available, else CAGR)
  projectionMethod: 'consensus' | 'cagr';
  analystConfidence: number;  // Confidence score (0-1)
  analystCount: number;
  // BOTH projections for complete display
  projections: {
    consensus: {
      projectedEPS: number;
      targetPrice: number;
      targetPriceLow: number;
      targetPriceHigh: number;
      available: boolean;
      analystCount: number;
      confidence: number;
      weight: number;  // Weight used in blend (0-1)
    };
    cagr: {
      projectedEPS: number;
      targetPrice: number;
      cagrPercent: number;  // The historical CAGR rate used
      weight: number;  // Weight used in blend (0-1)
    };
    // Primary blended projection (optimal algorithm based on 1000 ticker analysis)
    blended: {
      targetPrice: number;
      targetPriceLow: number;
      targetPriceHigh: number;
      method: 'weighted-blend' | 'cagr-only';
    };
  };
} => {

  const validHistory = data.filter(d => d.priceHigh > 0 && d.priceLow > 0);

  // Robust Base Year Data Selection
  const baseYearData = data.find(d => d.year === assumptions.baseYear) || data[data.length - 1];
  const baseEPS = baseYearData?.earningsPerShare || 0;

  // Calculate BOTH projections
  // 1. Consensus projection (may fallback to CAGR internally)
  const consensusProjection = calculateProjectedEPSWithConsensus(
    data,
    analystEstimates,
    baseEPS,
    5  // 5-year projection
  );

  // 2. Always calculate historical CAGR projection separately
  const sorted = [...data].sort((a, b) => Number(a.year) - Number(b.year));
  const lastData = sorted[sorted.length - 1];
  let historicalCAGR = 0;

  if (sorted.length >= 2 && lastData && baseEPS > 0) {
    const targetStartYear = Number(lastData.year) - 5;
    const startCandidate = sorted
      .filter(d => Number(d.year) <= targetStartYear && d.earningsPerShare > 0)
      .sort((a, b) => Number(b.year) - Number(a.year))[0];

    if (startCandidate && startCandidate.earningsPerShare > 0) {
      const years = Number(lastData.year) - Number(startCandidate.year);
      if (years >= 1) {
        historicalCAGR = calculateCAGR(
          startCandidate.earningsPerShare,
          baseEPS,
          years
        );
      }
    }
  }

  const cagrProjectedEPS = projectFutureValue(baseEPS, historicalCAGR, 5);
  const cagrTargetPrice = cagrProjectedEPS * assumptions.targetPE;

  // OPTIMAL ALGORITHM based on 1000 ticker analysis:
  // - CAGR 10-20% is most stable (57.5% coherent)
  // - CAGR 20%+ is also good (54.6% coherent)
  // - Low/Negative CAGR is unstable - blend methods
  // - Number of analysts is NOT a reliable predictor (contrary to intuition)

  // Calculate optimal weights based on historical CAGR stability
  let consensusWeight = 0.5;  // Default: equal weight
  let cagrWeight = 0.5;

  const absCAGR = Math.abs(historicalCAGR);

  if (consensusProjection.method === 'consensus') {
    // Weight based on CAGR stability (empirical findings from 1000 ticker test)
    if (absCAGR >= 10 && absCAGR <= 20) {
      // Most stable segment: blend both equally
      consensusWeight = 0.50;
      cagrWeight = 0.50;
    } else if (absCAGR > 20 && absCAGR <= 30) {
      // High growth but coherent: slightly favor CAGR (more consistent historical pattern)
      consensusWeight = 0.45;
      cagrWeight = 0.55;
    } else if (absCAGR >= 5 && absCAGR < 10) {
      // Moderate growth: equal weight
      consensusWeight = 0.50;
      cagrWeight = 0.50;
    } else if (absCAGR < 5) {
      // Low/stagnant growth: favor consensus (may capture turnaround)
      consensusWeight = 0.60;
      cagrWeight = 0.40;
    } else if (historicalCAGR < 0) {
      // Negative CAGR: highly unstable, favor analyst consensus
      consensusWeight = 0.65;
      cagrWeight = 0.35;
    } else {
      // Extreme growth (>30%): cap it, favor consensus for reversion to mean
      consensusWeight = 0.60;
      cagrWeight = 0.40;
    }
  } else {
    // No consensus available: use CAGR only
    consensusWeight = 0;
    cagrWeight = 1.0;
  }

  // Calculate blended projection
  const consensusTargetPrice = consensusProjection.projectedEPS * assumptions.targetPE;
  const blendedTargetPrice = (consensusTargetPrice * consensusWeight) + (cagrTargetPrice * cagrWeight);
  const blendedTargetPriceLow = (consensusProjection.projectedEPSLow * assumptions.targetPE * consensusWeight) +
                                 (cagrTargetPrice * 0.85 * cagrWeight);
  const blendedTargetPriceHigh = (consensusProjection.projectedEPSHigh * assumptions.targetPE * consensusWeight) +
                                  (cagrTargetPrice * 1.15 * cagrWeight);

  // Use blended as primary
  const targetPrice = blendedTargetPrice;
  const targetPriceLow = blendedTargetPriceLow;
  const targetPriceHigh = blendedTargetPriceHigh;

  const avgLowPrice = calculateAverage(validHistory.map(d => d.priceLow));
  // Fallback if no history
  const floorPrice = (avgLowPrice > 0 ? avgLowPrice : assumptions.currentPrice * 0.5) * 0.9;

  // Buy Limit calculation (approximate 33% of the spread)
  const spread = targetPrice - floorPrice;
  const buyLimit = floorPrice + (spread * 0.33);
  const sellLimit = targetPrice;

  let recommendation = Recommendation.HOLD;

  // Safety check to prevent showing Buy if target is 0
  if (targetPrice > 0) {
      if (assumptions.currentPrice < buyLimit) recommendation = Recommendation.BUY;
      else if (assumptions.currentPrice > sellLimit) recommendation = Recommendation.SELL;
  }

  // Build complete projections object
  const projections = {
    consensus: {
      projectedEPS: consensusProjection.method === 'consensus' ? consensusProjection.projectedEPS : 0,
      targetPrice: consensusProjection.method === 'consensus' ? consensusTargetPrice : 0,
      targetPriceLow: consensusProjection.method === 'consensus' ? consensusProjection.projectedEPSLow * assumptions.targetPE : 0,
      targetPriceHigh: consensusProjection.method === 'consensus' ? consensusProjection.projectedEPSHigh * assumptions.targetPE : 0,
      available: consensusProjection.method === 'consensus',
      analystCount: consensusProjection.analystCount,
      confidence: consensusProjection.confidence,
      weight: consensusWeight  // Poids utilise dans le blend
    },
    cagr: {
      projectedEPS: cagrProjectedEPS,
      targetPrice: cagrTargetPrice,
      cagrPercent: historicalCAGR,
      weight: cagrWeight  // Poids utilise dans le blend
    },
    // Primary blended projection (optimal algorithm)
    blended: {
      targetPrice: blendedTargetPrice,
      targetPriceLow: blendedTargetPriceLow,
      targetPriceHigh: blendedTargetPriceHigh,
      method: (consensusProjection.method === 'consensus' ? 'weighted-blend' : 'cagr-only') as 'weighted-blend' | 'cagr-only'
    }
  };

  return {
    recommendation,
    targetPrice,
    targetPriceLow,
    targetPriceHigh,
    buyLimit,
    sellLimit,
    projectionMethod: consensusProjection.method,
    analystConfidence: consensusProjection.confidence,
    analystCount: consensusProjection.analystCount,
    projections
  };
};

/**
 * Auto-fill assumptions basees sur les donnees historiques FMP
 * Cette fonction centralise la logique d'auto-fill pour garantir la coherence
 * Utilisee lors de la creation de nouveaux profils et lors de la synchronisation
 * 
 * @param data - Donnees historiques annuelles depuis FMP
 * @param currentPrice - Prix actuel de l'action
 * @param existingAssumptions - Assumptions existantes (pour preserver les valeurs non calculees)
 * @returns Nouvelles assumptions avec metriques auto-remplies
 */
export const autoFillAssumptionsFromFMPData = (
  data: AnnualData[],
  currentPrice: number,
  existingAssumptions?: Partial<Assumptions>,
  currentDividendFromAPI?: number //  NOUVEAU: Dividende actuel depuis l'API FMP
): Partial<Assumptions> => {
  // Guard clause for empty or invalid data
  if (!data || data.length === 0) {
    console.warn(' autoFillAssumptionsFromFMPData: Aucune donnee fournie pour les calculs');
    return existingAssumptions || {};
  }

  // Filtrer les donnees valides (avec prix High/Low > 0)
  const validHistory = data.filter(d => d.priceHigh > 0 && d.priceLow > 0);
  
  // Trouver la derniere annee avec EPS valide pour Base Year
  const lastValidData = [...data].reverse().find(d => d.earningsPerShare > 0) || data[data.length - 1];
  const lastData = data[data.length - 1];
  const firstData = data[0];
  const yearsDiff = Math.max(1, lastValidData.year - firstData.year); // Au moins 1 an
  
  // Helper pour calculer la moyenne (arithmetique) - demande par l'utilisateur "5 ans moyen"
  const calculateAverage = (values: number[]): number => {
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  };

  // Helper pour calculer le CAGR sur 5 ans (ou max disponible si < 5 ans)
  const calculate5YearGrowth = (paramData: AnnualData[], metricKey: keyof AnnualData): number => {
    if (paramData.length < 2) return 0;
    
    // Trier par annee et assurer typage numerique
    const sorted = [...paramData].sort((a, b) => Number(a.year) - Number(b.year));
    const last = sorted[sorted.length - 1]; // Annee N
    const lastValue = Number(last[metricKey]);

    if (lastValue <= 0) return 0; // Si la fin est negative, croissance indefinie

    const targetStartYear = Number(last.year) - 5;
    
    // Strategie plus robuste: Chercher le point de depart VALIDE (> 0) le plus proche de N-5 (en reculant)
    // On cherche d'abord exactement N-5, sinon N-6, etc.
    // On veut un point au moins 5 ans en arriere pour avoir une tendance long terme
    let startCandidate = sorted
        .filter(d => Number(d.year) <= targetStartYear && Number(d[metricKey]) > 0)
        .sort((a, b) => Number(b.year) - Number(a.year))[0]; // Prendre le plus recent parmi les anciens (le plus proche de N-5)

    // Fallback: Si rien trouve avant N-5, essayer de trouver n'importe quel point de depart positif valide anterieur a N
    if (!startCandidate) {
        startCandidate = sorted
            .filter(d => Number(d.year) < Number(last.year) && Number(d[metricKey]) > 0)
            .sort((a, b) => Number(a.year) - Number(b.year))[0]; // Prendre le plus ancien disponible positif
    }

    if (!startCandidate) return 0; // Aucun historique positif trouve

    const startValue = Number(startCandidate[metricKey]);
    const years = Number(last.year) - Number(startCandidate.year);

    if (years < 1) return 0;

    return calculateCAGR(startValue, lastValue, years);
  };

  // 1. Calculer Croissance 5 Ans (CAGR)
  const growthEPS = calculate5YearGrowth(data, 'earningsPerShare');
  const growthCF = calculate5YearGrowth(data, 'cashFlowPerShare');
  const growthBV = calculate5YearGrowth(data, 'bookValuePerShare');
  const growthDiv = calculate5YearGrowth(data, 'dividendPerShare');

  // 2. Calculer Ratios Moyens 5 Ans
  // Prendre les 5 dernieres annees de donnees VALIDES (avec prix)
  const last5YearsData = validHistory.slice(-5); // Les 5 derniers elements (supposant tri croissant)

  // P/E = Prix moyen / EPS moyen (Moyenne 5 ans)
  const peRatios = last5YearsData
    .map(d => {
      if (d.earningsPerShare <= 0) return null;
      return (d.priceHigh / d.earningsPerShare + d.priceLow / d.earningsPerShare) / 2;
    })
    .filter((v): v is number => v !== null && isFinite(v) && v > 0 && v < 200);
  const avgPE = peRatios.length > 0 ? calculateAverage(peRatios) : 15;
  
  // P/CF = Prix moyen / Cash Flow moyen (Moyenne 5 ans)
  const pcfRatios = last5YearsData
    .map(d => {
      if (d.cashFlowPerShare <= 0.1) return null;
      return (d.priceHigh / d.cashFlowPerShare + d.priceLow / d.cashFlowPerShare) / 2;
    })
    .filter((v): v is number => v !== null && isFinite(v) && v > 0 && v < 200);
  const avgPCF = pcfRatios.length > 0 ? calculateAverage(pcfRatios) : 10;
  
  // P/BV = Prix moyen / Book Value moyen (Moyenne 5 ans)
  const pbvRatios = last5YearsData
    .map(d => {
      if (d.bookValuePerShare <= 0) return null;
      return (d.priceHigh / d.bookValuePerShare + d.priceLow / d.bookValuePerShare) / 2;
    })
    .filter((v): v is number => v !== null && isFinite(v) && v > 0 && v < 50);
  const avgPBV = pbvRatios.length > 0 ? calculateAverage(pbvRatios) : 6;
  
  // Yield = Dividende / Prix (Moyenne 5 ans)
  const yieldValues = last5YearsData
    .map(d => {
      if (d.priceHigh <= 0) return null;
      return (d.dividendPerShare / d.priceHigh) * 100;
    })
    .filter((v): v is number => v !== null && isFinite(v) && v >= 0 && v < 100);
  const avgYield = yieldValues.length > 0 ? calculateAverage(yieldValues) : 2.0;
  
  // Helper pour arrondir proprement
  const round = (value: number, decimals: number = 2): number => {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  };

  //  HELPER : Preserver les valeurs existantes si elles sont deja definies (non-0 pour les taux)
  // Cela permet de preserver les valeurs manuelles (orange) entrees par l'utilisateur
  const preserveIfExists = (calculated: number, existing: number | undefined | null, isGrowthRate: boolean = false): number => {
    // Pour les taux de croissance, preserver si la valeur existante est non-null, non-undefined, et non-0
    // (0 signifie generalement "non defini" pour les taux de croissance)
    if (isGrowthRate && existing !== undefined && existing !== null && existing !== 0) {
      return existing; // Preserver la valeur manuelle (orange)
    }
    // Pour les autres valeurs, preserver si definie
    if (!isGrowthRate && existing !== undefined && existing !== null) {
      return existing; // Preserver la valeur manuelle
    }
    return calculated; // Utiliser la valeur calculee
  };

  //  AMELIORATION: Utiliser le dividende depuis l'API FMP si disponible (priorite 1)
  // Sinon, trouver le dividende le plus recent dans les donnees historiques
  let finalCurrentDividend = 0;
  
  // Priorite 1: Utiliser le dividende depuis l'API FMP (calcule depuis key metrics ou yield)
  if (currentDividendFromAPI !== undefined && currentDividendFromAPI > 0) {
    finalCurrentDividend = currentDividendFromAPI;
  } else {
    // Priorite 2: Trouver le dividende le plus recent (annee en cours ou derniere annee avec dividende > 0)
    const currentYear = new Date().getFullYear();
    
    // 1. Chercher le dividende de l'annee en cours d'abord
    const currentYearData = data.find(d => d.year === currentYear && d.dividendPerShare > 0);
    if (currentYearData) {
      finalCurrentDividend = currentYearData.dividendPerShare;
    } else {
      // 2. Chercher la derniere annee avec un dividende > 0 (en ordre decroissant)
      const sortedData = [...data].sort((a, b) => b.year - a.year);
      const lastYearWithDividend = sortedData.find(d => d.dividendPerShare > 0);
      if (lastYearWithDividend) {
        finalCurrentDividend = lastYearWithDividend.dividendPerShare;
      } else {
        // 3. Fallback: utiliser lastData.dividendPerShare meme si 0
        finalCurrentDividend = lastData.dividendPerShare || 0;
      }
    }
    
    // Priorite 3: Si le dividende est toujours 0 mais qu'on a un prix actuel, 
    // essayer de calculer a partir du yield moyen historique (si disponible)
    if (finalCurrentDividend === 0 && currentPrice > 0 && data.length > 0) {
      // Calculer le yield moyen historique pour les annees avec dividende
      const yearsWithDividend = data.filter(d => d.dividendPerShare > 0 && d.priceHigh > 0);
      if (yearsWithDividend.length > 0) {
        const avgYield = yearsWithDividend.reduce((sum, d) => {
          const yieldPercent = (d.dividendPerShare / d.priceHigh) * 100;
          return sum + yieldPercent;
        }, 0) / yearsWithDividend.length;
        
        // Si le yield moyen est raisonnable (0.1% a 20%), utiliser pour estimer le dividende actuel
        if (avgYield > 0.1 && avgYield < 20) {
          finalCurrentDividend = (avgYield / 100) * currentPrice;
          console.log(`i Dividende estime a partir du yield moyen historique (${avgYield.toFixed(2)}%): ${finalCurrentDividend.toFixed(4)}`);
        }
      }
    }
  }

  // Retourner les assumptions auto-remplies avec limites STRICTES
  // Ces limites sont cruciales pour eviter les prix cibles aberrants
  const rawAssumptions: Partial<Assumptions> = {
    currentPrice: round(currentPrice, 2), //  Toujours mettre a jour le prix actuel
    currentDividend: preserveIfExists(
      round(finalCurrentDividend, 4),
      existingAssumptions?.currentDividend,
      true //  FIX: Traiter comme un taux - ne pas preserver si existant est 0
    ),
    baseYear: preserveIfExists(
      lastValidData.year,
      existingAssumptions?.baseYear,
      false
    ),
    
    //  Taux de croissance: PRESERVER les valeurs existantes (orange) si definies
    growthRateEPS: preserveIfExists(
      round(Math.min(Math.max(growthEPS, -20), 20), 2),
      existingAssumptions?.growthRateEPS,
      true //  Flag pour indiquer que c'est un taux de croissance
    ),
    growthRateSales: preserveIfExists(
      round(Math.min(Math.max(growthCF, -20), 20), 2),
      existingAssumptions?.growthRateSales,
      true
    ),
    growthRateCF: preserveIfExists(
      round(Math.min(Math.max(growthCF, -20), 20), 2),
      existingAssumptions?.growthRateCF,
      true
    ),
    growthRateBV: preserveIfExists(
      round(Math.min(Math.max(growthBV, -20), 20), 2),
      existingAssumptions?.growthRateBV,
      true
    ),
    growthRateDiv: preserveIfExists(
      round(Math.min(Math.max(growthDiv, -20), 20), 2),
      existingAssumptions?.growthRateDiv,
      true
    ),
    
    //  Ratios cibles: PRESERVER les valeurs existantes (orange) si definies
    targetPE: preserveIfExists(
      round(Math.max(5, Math.min(avgPE, 50)), 1),
      existingAssumptions?.targetPE,
      false
    ),
    targetPCF: preserveIfExists(
      round(Math.max(3, Math.min(avgPCF, 50)), 1),
      existingAssumptions?.targetPCF,
      false
    ),
    targetPBV: preserveIfExists(
      round(Math.max(0.5, Math.min(avgPBV, 10)), 2),
      existingAssumptions?.targetPBV,
      false
    ),
    targetYield: preserveIfExists(
      round(Math.max(0, Math.min(avgYield, 15)), 2),
      existingAssumptions?.targetYield,
      false
    ),
    
    // Preserver les autres valeurs existantes si fournies
    requiredReturn: existingAssumptions?.requiredReturn,
    dividendPayoutRatio: existingAssumptions?.dividendPayoutRatio,
    excludeEPS: existingAssumptions?.excludeEPS,
    excludeCF: existingAssumptions?.excludeCF,
    excludeBV: existingAssumptions?.excludeBV,
    excludeDIV: existingAssumptions?.excludeDIV
  };

  //  SANITISER les assumptions avec les parametres personnalises avant de retourner
  // Cela garantit que meme si les calculs generent des valeurs aberrantes, elles seront corrigees
  const sanitized = sanitizeAssumptionsSync(rawAssumptions);
  
  // Retourner en Partial pour preserver la compatibilite
  return {
    ...sanitized,
    excludeEPS: rawAssumptions.excludeEPS,
    excludeCF: rawAssumptions.excludeCF,
    excludeBV: rawAssumptions.excludeBV,
    excludeDIV: rawAssumptions.excludeDIV
  };
};