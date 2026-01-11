// ====================================================================
// API HYBRID DATA FETCHER
// ====================================================================
// Version simplifiée de l'API hybride qui fonctionne sans Supabase

export type DataType = 'quote' | 'profile' | 'ratios' | 'news' | 'prices' | 'analyst' | 'earnings';

export interface HybridDataResponse {
  success: boolean;
  symbol: string;
  dataType: string;
  data?: Record<string, unknown>;
  news?: Array<Record<string, unknown>>;
  source: string;
  fallback: boolean;
  metadata: {
    confidence: number;
    freshness: string;
    lastUpdated: string;
  };
}

export const fetchHybridData = async (symbol: string, dataType: DataType): Promise<HybridDataResponse> => {
  try {
    console.log(`🔄 Récupération ${dataType} pour ${symbol}`);

    // Utiliser les APIs fonctionnelles avec indicateurs de fallback
    let apiUrl = '';

    switch (dataType) {
      case 'quote':
        apiUrl = `/api/marketdata?endpoint=quote&symbol=${symbol}&source=auto`;
        break;
      case 'profile':
        // Utiliser l'API marketdata pour les données de base
        apiUrl = `/api/marketdata?endpoint=fundamentals&symbol=${symbol}&source=auto`;
        break;
      case 'ratios':
        // Utiliser l'API marketdata pour les ratios de base
        apiUrl = `/api/marketdata?endpoint=fundamentals&symbol=${symbol}&source=auto`;
        break;
      case 'news':
        // Utiliser FMP News API (GRATUIT) au lieu de Perplexity
        apiUrl = `/api/fmp?endpoint=news&symbols=${symbol}&limit=10`;
        break;
      case 'prices':
        // Utiliser l'API marketdata pour les données intraday (OHLCV 5min)
        apiUrl = `/api/marketdata?endpoint=intraday&symbol=${symbol}&interval=5min&outputsize=78`;
        break;
      case 'analyst':
        // Utiliser l'API marketdata pour les estimations d'analystes
        apiUrl = `/api/marketdata?endpoint=analyst&symbol=${symbol}&source=auto`;
        break;
      case 'earnings':
        // Utiliser l'API marketdata pour le calendrier des earnings
        apiUrl = `/api/marketdata?endpoint=earnings&symbol=${symbol}&source=auto`;
        break;
      default:
        throw new Error(`Type de données non supporté: ${dataType}`);
    }

    // Gérer les appels spéciaux - FMP News (GRATUIT)
    if (dataType === 'news') {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`API news échouée: ${response.status}`);
      }
      const data = await response.json();

      // Convertir le format FMP vers le format attendu
      const formattedNews = (data.news || data || []).map((article: any) => ({
        title: article.title,
        text: article.text || article.description || '',
        url: article.url || article.link || '#',
        publishedDate: article.publishedDate || article.publishedAt || new Date().toISOString(),
        source: { name: article.site || article.source || 'FMP' },
        symbol: article.symbol || symbol
      }));

      return {
        success: true,
        symbol,
        dataType,
        news: formattedNews,
        source: 'fmp',
        fallback: false,
        metadata: {
          confidence: 0.95,
          freshness: 'fresh',
          lastUpdated: new Date().toISOString()
        }
      };
    }

    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`API ${dataType} échouée: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ ${dataType} récupéré pour ${symbol}`);

    return {
      success: true,
      symbol,
      dataType,
      data: data,
      source: 'perplexity',
      fallback: false,
      metadata: {
        confidence: 0.9,
        freshness: 'fresh',
        lastUpdated: new Date().toISOString()
      }
    };

  } catch (error: unknown) {
    console.error(`❌ Erreur ${dataType} pour ${symbol}:`, error);

    // Propager l'erreur
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Erreur API ${dataType} pour ${symbol}: ${errorMessage}`);
  }
};
