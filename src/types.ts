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
  | 'markets-economy';

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
  tickerLatestNews?: Record<string, NewsArticle>;
  tickerMoveReasons?: Record<string, string>;
  seekingAlphaData?: Record<string, SeekingAlphaData>;
  seekingAlphaStockData?: Record<string, any>;
  economicCalendarData?: EconomicEvent[];

  // Setters
  setTickers?: (tickers: string[]) => void;
  setTeamTickers?: (tickers: string[]) => void;
  setWatchlistTickers?: (tickers: string[]) => void;
  setStockData?: (data: Record<string, StockData>) => void;
  setNewsData?: (news: NewsArticle[]) => void;
  setEconomicCalendarData?: (events: EconomicEvent[]) => void;

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
  }
}

export {};
