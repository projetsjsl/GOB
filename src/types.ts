// ====================================================================
// TYPES GLOBAUX DU DASHBOARD
// ====================================================================

// Données de stock
export interface StockData {
  symbol: string;
  price?: number;
  change?: number;
  changePercent?: number;
  volume?: number;
  marketCap?: number;
  pe?: number;
  eps?: number;
  high?: number;
  low?: number;
  open?: number;
  previousClose?: number;
  [key: string]: any;
}

// Article de news
export interface NewsArticle {
  title: string;
  text?: string;
  url: string;
  publishedDate: string;
  source: { name: string };
  symbol?: string;
  image?: string;
}

// Événement du calendrier économique
export interface EconomicEvent {
  date: string;
  time?: string;
  country?: string;
  event: string;
  impact?: 'high' | 'medium' | 'low';
  actual?: string | number;
  forecast?: string | number;
  previous?: string | number;
}

// Données Seeking Alpha
export interface SeekingAlphaData {
  symbol?: string;
  rating?: string;
  targetPrice?: number;
  articles?: any[];
  [key: string]: any;
}

// Contexte de news
export type NewsContext = 'general' | 'quebec' | 'french_canada' | 'crypto' | 'analysis';

// Tabs disponibles
export type TabName =
  | 'stocks-news'
  | 'admin-jslai'
  | 'plus'
  | 'watchlist'
  | 'scrapping-sa'
  | 'seeking-alpha'
  | 'email-briefings'
  | 'intellistocks'
  | 'economic-calendar'
  | 'investing-calendar'
  | 'yield-curve'
  | 'markets-economy'
  | 'ask-emma';

// Props des tabs
export interface TabProps {
  // États partagés du dashboard
  tickers?: string[];
  teamTickers?: string[];
  watchlistTickers?: string[];
  stockData?: Record<string, StockData>;
  newsData?: NewsArticle[];
  newsContext?: NewsContext;
  setNewsContext?: (context: NewsContext) => void;
  githubUser?: any;
  finvizNews?: Record<string, any>;
  tickerLatestNews?: Record<string, NewsArticle[]>;
  tickerMoveReasons?: Record<string, string>;
  seekingAlphaData?: Record<string, SeekingAlphaData>;
  seekingAlphaStockData?: Record<string, any>;
  economicCalendarData?: EconomicEvent[];
  apiStatus?: Record<string, any>;
  processLog?: any[];
  watchlistTickers?: string[];
  teamTickers?: string[];

  // Setters
  setTickers?: (tickers: string[]) => void;
  setTeamTickers?: (tickers: string[]) => void;
  setWatchlistTickers?: (tickers: string[]) => void;
  setStockData?: (data: Record<string, StockData>) => void;
  setNewsData?: (news: NewsArticle[]) => void;
  setTickerLatestNews?: (data: Record<string, NewsArticle[]>) => void;
  setTickerMoveReasons?: (data: Record<string, string>) => void;
  setEconomicCalendarData?: (events: EconomicEvent[]) => void;
  setSeekingAlphaData?: (data: Record<string, SeekingAlphaData>) => void;
  setSeekingAlphaStockData?: (data: Record<string, any>) => void;
  setSelectedStock?: (stock: string | null) => void;
  setActiveTab?: (tab: TabName) => void;
  setLoading?: (loading: boolean) => void;
  setLastUpdate?: (date: Date | null) => void;
  setProcessLog?: (logs: any[]) => void;
  setEmmaConnected?: (value: boolean) => void;
  setPrefillMessage?: (value: string) => void;
  setAutoSend?: (value: boolean) => void;
  setShowPromptEditor?: (value: boolean) => void;
  setShowTemperatureEditor?: (value: boolean) => void;
  setShowLengthEditor?: (value: boolean) => void;
  cacheSettings?: {
    maxAgeHours: number;
    refreshOnNavigation: boolean;
    refreshIntervalMinutes: number;
  };
  setCacheSettings?: (settings: {
    maxAgeHours: number;
    refreshOnNavigation: boolean;
    refreshIntervalMinutes: number;
  }) => void;
  cacheStatus?: Record<string, any>;
  setCacheStatus?: (status: Record<string, any>) => void;
  loadingCacheStatus?: boolean;
  setLoadingCacheStatus?: (value: boolean) => void;
  systemLogs?: any[];

  // État du système
  loading?: boolean;
  isDarkMode?: boolean;
  lastUpdate?: Date | null;
  initialLoadComplete?: boolean;
  selectedStock?: string | null;
  API_BASE_URL?: string;
  emmaConnected?: boolean;
  showPromptEditor?: boolean;
  showTemperatureEditor?: boolean;
  showLengthEditor?: boolean;
  prefillMessage?: string;
  autoSend?: boolean;

  // Fonctions utilitaires
  fetchStockData?: (ticker: string) => Promise<any>;
  fetchNews?: (context?: string, limit?: number) => Promise<NewsArticle[]>;
  fetchLatestNewsForTickers?: () => Promise<void>;
  loadTickersFromSupabase?: () => Promise<string[]>;
  refreshAllStocks?: () => Promise<void>;
  showMessage?: (message: string, type?: 'success' | 'error' | 'info') => void;
  getCompanyLogo?: (ticker: string) => string;
  emmaPopulateWatchlist?: () => Promise<void>;

  // Icon components (si disponibles)
  LucideIcon?: React.FC<{ name: string; className?: string }>;
  IconoirIcon?: React.FC<{ name: string; className?: string }>;

  // Autres props spécifiques
  [key: string]: any;
}

// Window extensions
declare global {
  interface Window {
    IconoirIcon?: React.FC<{ name: string; className?: string }>;
    LucideIcon?: React.FC<{ name: string; className?: string }>;
    ProfessionalModeSystem?: {
      isEnabled: () => boolean;
      toggle: () => boolean;
      emojiToIcon: Record<string, string>;
      renderIcon: (emoji: string, size?: number, className?: string) => string;
    };
    __GOB_DASHBOARD_MOUNTED?: boolean;
    BetaCombinedDashboard?: Record<string, any>;
    BetaCombinedDashboardData?: Record<string, any>;
    DASHBOARD_UTILS?: Record<string, any>;
    DASHBOARD_CONSTANTS?: Record<string, any>;
  }
}

export {};
