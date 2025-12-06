/**
 * Service pour récupérer les données de marché depuis ticker_market_cache
 * Optimise l'egress Supabase en utilisant le cache au lieu d'appels FMP individuels
 */

export interface MarketData {
  ticker: string;
  currentPrice: number;
  changePercent: number;
  changeAmount: number;
  volume: number;
  marketCap: number;
  peRatio: number | null;
  pcfRatio: number | null;
  pbvRatio: number | null;
  dividendYield: number | null;
  updatedAt: string;
  isFresh: boolean;
}

export interface MarketDataBatchResponse {
  success: boolean;
  data: MarketData[];
  stats: {
    total: number;
    fresh: number;
    stale: number;
    missing: number;
  };
  missingTickers?: string[];
  staleTickers?: string[];
  warning?: string;
  timestamp: string;
}

/**
 * Récupère les données de marché pour plusieurs tickers en une seule requête
 * Utilise ticker_market_cache pour réduire l'egress
 * 
 * @param tickers - Liste des symboles (ex: ['AAPL', 'MSFT', 'GOOGL'])
 * @returns Données de marché depuis le cache
 */
export async function fetchMarketDataBatch(tickers: string[]): Promise<MarketDataBatchResponse> {
  if (tickers.length === 0) {
    return {
      success: true,
      data: [],
      stats: { total: 0, fresh: 0, stale: 0, missing: 0 },
      timestamp: new Date().toISOString()
    };
  }

  // Limiter à 100 tickers par requête
  if (tickers.length > 100) {
    throw new Error('Maximum 100 tickers per request. Please split into multiple requests.');
  }

  try {
    const tickersStr = tickers.join(',');
    const response = await fetch(`/api/market-data-batch?tickers=${encodeURIComponent(tickersStr)}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result;

  } catch (error: any) {
    console.error('❌ Erreur fetchMarketDataBatch:', error);
    return {
      success: false,
      data: [],
      stats: { total: tickers.length, fresh: 0, stale: 0, missing: tickers.length },
      missingTickers: tickers,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Récupère les données de marché pour un seul ticker
 * Utilise le cache en interne (appelle fetchMarketDataBatch avec 1 ticker)
 * 
 * @param ticker - Symbole unique (ex: 'AAPL')
 * @returns Données de marché ou null si non trouvé
 */
export async function fetchMarketData(ticker: string): Promise<MarketData | null> {
  const result = await fetchMarketDataBatch([ticker]);
  
  if (result.success && result.data.length > 0) {
    return result.data[0];
  }

  return null;
}

