/**
 * FMP (Financial Modeling Prep) API Response Types
 * Strict types for all API responses - no fallbacks allowed
 */

/**
 * FMP Profile Response
 */
export interface FMPProfile {
  symbol: string;
  companyName: string;
  currency: string;
  exchange: string;
  exchangeShortName: string;
  industry: string;
  sector: string;
  country: string;
  mktCap: number;
  price: number;
  changes: number;
  changesPercentage: number;
  beta: number;
  volAvg: number;
  lastDiv: number;
  range: string;
  ipoDate: string;
  isEtf: boolean;
  isActivelyTrading: boolean;
  isFund: boolean;
  image: string;
  website: string;
  ceo: string;
  fullTimeEmployees: string;
  description: string;
}

/**
 * FMP Key Metrics Response (Annual)
 */
export interface FMPKeyMetrics {
  symbol: string;
  date: string;
  period: string;
  revenuePerShare: number;
  netIncomePerShare: number;
  operatingCashFlowPerShare: number;
  freeCashFlowPerShare: number;
  cashPerShare: number;
  bookValuePerShare: number;
  tangibleBookValuePerShare: number;
  shareholdersEquityPerShare: number;
  interestDebtPerShare: number;
  marketCap: number;
  enterpriseValue: number;
  peRatio: number;
  priceToSalesRatio: number;
  pocfratio: number;
  pfcfRatio: number;
  pbRatio: number;
  ptbRatio: number;
  evToSales: number;
  enterpriseValueOverEBITDA: number;
  evToOperatingCashFlow: number;
  evToFreeCashFlow: number;
  earningsYield: number;
  freeCashFlowYield: number;
  debtToEquity: number;
  debtToAssets: number;
  netDebtToEBITDA: number;
  currentRatio: number;
  interestCoverage: number;
  incomeQuality: number;
  dividendYield: number;
  payoutRatio: number;
  salesGeneralAndAdministrativeToRevenue: number;
  researchAndDdevelopementToRevenue: number;
  intangiblesToTotalAssets: number;
  capexToOperatingCashFlow: number;
  capexToRevenue: number;
  capexToDepreciation: number;
  stockBasedCompensationToRevenue: number;
  grahamNumber: number;
  roic: number;
  returnOnTangibleAssets: number;
  grahamNetNet: number;
  workingCapital: number;
  tangibleAssetValue: number;
  netCurrentAssetValue: number;
  investedCapital: number;
  averageReceivables: number;
  averagePayables: number;
  averageInventory: number;
  daysSalesOutstanding: number;
  daysPayablesOutstanding: number;
  daysOfInventoryOnHand: number;
  receivablesTurnover: number;
  payablesTurnover: number;
  inventoryTurnover: number;
  roe: number;
  capexPerShare: number;
}

/**
 * FMP Historical Price Response
 */
export interface FMPHistoricalPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose: number;
  volume: number;
  unadjustedVolume: number;
  change: number;
  changePercent: number;
  vwap: number;
  label: string;
  changeOverTime: number;
}

/**
 * FMP Income Statement Response
 */
export interface FMPIncomeStatement {
  date: string;
  symbol: string;
  reportedCurrency: string;
  fillingDate: string;
  acceptedDate: string;
  period: string;
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  grossProfitRatio: number;
  researchAndDevelopmentExpenses: number;
  generalAndAdministrativeExpenses: number;
  sellingAndMarketingExpenses: number;
  sellingGeneralAndAdministrativeExpenses: number;
  otherExpenses: number;
  operatingExpenses: number;
  costAndExpenses: number;
  interestIncome: number;
  interestExpense: number;
  depreciationAndAmortization: number;
  ebitda: number;
  ebitdaratio: number;
  operatingIncome: number;
  operatingIncomeRatio: number;
  totalOtherIncomeExpensesNet: number;
  incomeBeforeTax: number;
  incomeBeforeTaxRatio: number;
  incomeTaxExpense: number;
  netIncome: number;
  netIncomeRatio: number;
  eps: number;
  epsdiluted: number;
  weightedAverageShsOut: number;
  weightedAverageShsOutDil: number;
}

/**
 * FMP Cash Flow Statement Response
 */
export interface FMPCashFlowStatement {
  date: string;
  symbol: string;
  reportedCurrency: string;
  fillingDate: string;
  acceptedDate: string;
  period: string;
  netIncome: number;
  depreciationAndAmortization: number;
  operatingCashFlow: number;
  capitalExpenditure: number;
  freeCashFlow: number;
  dividendsPaid: number;
}

/**
 * Validated company data result from our API
 */
export interface ValidatedCompanyData {
  symbol: string;
  data: import('../types').AnnualData[];
  info: Partial<import('../types').CompanyInfo>;
  currentPrice: number;
  financials?: {
    income: FMPIncomeStatement[];
    cashflow: FMPCashFlowStatement[];
  };
  analysisData?: {
    estimates?: unknown[];
    insider?: unknown[];
    institutional?: unknown[];
  };
  source: 'fmp' | 'supabase';
  validatedAt: string;
}

/**
 * Type guard to check if response is valid FMP profile
 */
export const isValidFMPProfile = (data: unknown): data is FMPProfile => {
  if (!data || typeof data !== 'object') return false;
  const profile = data as Record<string, unknown>;
  
  return (
    typeof profile.symbol === 'string' &&
    profile.symbol.length > 0 &&
    typeof profile.companyName === 'string' &&
    profile.companyName.length > 0 &&
    typeof profile.mktCap === 'number' &&
    profile.mktCap > 0
  );
};

/**
 * Type guard to check if response is valid FMP key metrics
 */
export const isValidFMPKeyMetrics = (data: unknown): data is FMPKeyMetrics => {
  if (!data || typeof data !== 'object') return false;
  const metrics = data as Record<string, unknown>;
  
  return (
    typeof metrics.symbol === 'string' &&
    typeof metrics.date === 'string' &&
    typeof metrics.bookValuePerShare === 'number'
  );
};

/**
 * Type guard for historical price array
 */
export const isValidFMPHistoricalPrices = (data: unknown): data is FMPHistoricalPrice[] => {
  if (!Array.isArray(data)) return false;
  if (data.length === 0) return false;
  
  // Check first item
  const first = data[0];
  return (
    typeof first.date === 'string' &&
    typeof first.high === 'number' &&
    typeof first.low === 'number' &&
    first.high > 0 &&
    first.low > 0
  );
};
