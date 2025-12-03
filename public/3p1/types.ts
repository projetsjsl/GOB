export interface AnnualData {
  year: number;
  priceHigh: number;
  priceLow: number;
  cashFlowPerShare: number;
  dividendPerShare: number;
  bookValuePerShare: number;
  earningsPerShare: number;
  isEstimate?: boolean;
  autoFetched?: boolean; // Track if data came from API (shows green background)
}

export interface CalculatedRatios {
  pcfHigh: number;
  pcfLow: number;
  yieldHigh: number; // Based on Low Price usually (highest yield)
  yieldLow: number;
  pbvHigh: number;
  pbvLow: number;
  peHigh: number;
  peLow: number;
}

export interface Assumptions {
  currentPrice: number;
  currentDividend: number;
  // Growth Rates
  growthRateEPS: number;
  growthRateSales: number;
  growthRateCF: number; // New
  growthRateBV: number; // New
  growthRateDiv: number; // New
  // Target Ratios
  targetPE: number;
  targetPCF: number; // New
  targetPBV: number; // New
  targetYield: number; // New
  // Other
  requiredReturn: number;
  dividendPayoutRatio: number;
  baseYear: number;
  // Metric exclusions for evaluation
  excludeEPS?: boolean;
  excludeCF?: boolean;
  excludeBV?: boolean;
  excludeDIV?: boolean;
}

export interface CompanyInfo {
  symbol: string;
  name: string;
  sector: string;
  securityRank: string;
  marketCap: string; // formatted string for display
  logo?: string; // URL du logo de l'entreprise
  country?: string; // Pays de l'entreprise
  exchange?: string; // Bourse (ex: NASDAQ, NYSE, TSX, etc.)
  currency?: string; // Devise (ex: USD, CAD, EUR, etc.)
  preferredSymbol?: string; // Symbole préféré (TSX pour Canada, ADR pour Europe/Asie)
}

export enum Recommendation {
  BUY = "ACHAT",
  HOLD = "CONSERVER",
  SELL = "VENTE"
}

export interface AnalysisProfile {
  id: string; // usually symbol
  lastModified: number;
  data: AnnualData[];
  assumptions: Assumptions;
  info: CompanyInfo;
  notes?: string;
  isWatchlist?: boolean; // New field to distinguish Watchlist vs Portfolio
}