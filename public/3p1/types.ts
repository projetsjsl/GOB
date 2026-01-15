export interface AnnualData {
  year: number;
  priceHigh: number;
  priceLow: number;
  cashFlowPerShare: number;
  dividendPerShare: number;
  bookValuePerShare: number;
  earningsPerShare: number;
  isEstimate?: boolean;
  autoFetched?: boolean; // Track if data came from API (deprecated, use dataSource instead)
  dataSource?: 'fmp-verified' | 'fmp-adjusted' | 'manual' | 'calculated'; // Source de la donnee
  // 'fmp-verified' = Donnees FMP verifiees directement (VERT)
  // 'fmp-adjusted' = Donnees FMP mais ajustees/mergees (BLEU)
  // 'manual' = Donnees manuelles (ORANGE)
  // 'calculated' = Donnees calculees (GRIS)
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
  preferredSymbol?: string; // Symbole prefere (TSX pour Canada, ADR pour Europe/Asie)
  actualSymbol?: string; // Symbole reellement utilise par FMP
  logoSymbol?: string; // Symbole optimise pour les logos
  beta?: number; // Beta (volatilite relative au marche)
  roe?: number; // Return on Equity (ROE) - Source: FMP key-metrics
  roa?: number; // Return on Assets (ROA) - Source: FMP key-metrics
  // Metriques ValueLine (Source: ValueLine au 3 decembre 2025)
  earningsPredictability?: string; // Earnings Predictability
  priceGrowthPersistence?: string; // Price Growth Persistence (note numerique 5-100, mesure la croissance persistante du prix sur 10 ans)
  priceStability?: string; // Price Stability
  financials?: any; // Raw financial statements (Income, Balance, CashFlow)
  analysisData?: any; // Premium data (Estimates, Insider, etc.)
}

export enum Recommendation {
  BUY = "ACHAT",
  HOLD = "CONSERVER",
  SELL = "VENTE"
}

export interface ValueLineCorridor {
  lowReturn?: number; // Proj Low TTL Return
  highReturn?: number; // Proj High TTL Return
  lowPriceGain?: number; // Proj Price Low Gain (optionnel)
  highPriceGain?: number; // Proj Price High Gain (optionnel)
}

export interface ValueLineInitial {
  epsGrowth?: number; // Projected EPS Growth 3 To 5 Yr
  cfGrowth?: number; // Cash Flow Proj 3 To 5 Year Growth Rate
  bvGrowth?: number; // Book Value Proj 3 To 5 Year Growth Rate
  divGrowth?: number; // Dividend Proj 3 To 5 Year Growth Rate
  peRatio?: number; // Current P/E Ratio_1
  pcfRatio?: number; // P/CF Ratio (optionnel)
  pbvRatio?: number; // P/BV Ratio (optionnel)
  yield?: number; // 3 To 5 Year Proj Dividend Yield
}

export interface AnalysisProfile {
  id: string; // usually symbol
  lastModified: number;
  data: AnnualData[];
  assumptions: Assumptions;
  info: CompanyInfo;
  notes?: string;
  isWatchlist?: boolean | null; // true = Watchlist (), false = Portefeuille (), null = Normal (pas d'icone)
  // Corridor ValueLine (pour Phase 3 - Validation)
  valuelineCorridor?: ValueLineCorridor;
  // Metriques ValueLine initiales (pour Phase 1 - Initialisation)
  valuelineInitial?: ValueLineInitial;
  // Flag pour indiquer un profil "squelette" (donnees incompletes, chargement en cours)
  _isSkeleton?: boolean;
}