/**
 * API Helper Functions for Dashboard
 * Contains all API-related fetch functions
 */

// Configuration API
const API_BASE_URL = (window.location && window.location.origin) ? window.location.origin : '';
const GITHUB_REPO = 'projetsjsl/GOB';
const GITHUB_BRANCH = 'main';

// Version simplifiée de l'API hybride qui fonctionne sans Supabase
const fetchHybridData = async (symbol, dataType) => {
  try {
    console.log(`🔄 Récupération ${dataType} pour ${symbol}`);
    
    // Utiliser les APIs fonctionnelles avec indicateurs de fallback
    let apiUrl = '';
    let fallbackSource = false;
    
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
      const formattedNews = (data.news || data || []).map(article => ({
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
    
  } catch (error) {
    console.error(`❌ Erreur ${dataType} pour ${symbol}:`, error);
    throw new Error(`Erreur API ${dataType} pour ${symbol}: ${error.message}`);
  }
};

// Fonction pour charger les données du ticker (sans auto-refresh)
const fetchTickerData = async (API_BASE_URL, setTickerData, addLog) => {
    try {
        // Vérifier d'abord les données préchargées depuis la page de login
        const preloadedDataStr = sessionStorage.getItem('preloaded-dashboard-data');
        if (preloadedDataStr) {
            try {
                const preloadedData = JSON.parse(preloadedDataStr);
                const dataAge = Date.now() - (preloadedData.timestamp || 0);
                const MAX_AGE = 5 * 60 * 1000; // 5 minutes

                if (preloadedData.tickerData && dataAge < MAX_AGE) {
                    console.log('⚡ Utilisation des données préchargées pour les tickers');
                    setTickerData(preloadedData.tickerData);
                    addLog(`✅ Ticker chargé depuis préchargement: ${preloadedData.tickerData.length} instruments`, 'success');
                    return;
                }
            } catch (e) {
                console.warn('⚠️ Erreur lecture données préchargées:', e);
            }
        }

        // Sinon, charger normalement depuis l'API
        const symbols = [
            // Indices US
            { symbol: '^GSPC', name: 'S&P 500', type: 'index' },
            { symbol: '^DJI', name: 'DOW', type: 'index' },
            { symbol: '^IXIC', name: 'NASDAQ', type: 'index' },
            { symbol: '^RUT', name: 'Russell 2000', type: 'index' },
            // Indices Canada
            { symbol: '^GSPTSE', name: 'TSX', type: 'index' },
            // Indices Europe
            { symbol: '^FCHI', name: 'CAC 40', type: 'index' },
            { symbol: '^GDAXI', name: 'DAX', type: 'index' },
            { symbol: '^FTSE', name: 'FTSE 100', type: 'index' },
            { symbol: '^IBEX', name: 'IBEX 35', type: 'index' },
            { symbol: '^FTSEMIB', name: 'FTSE MIB', type: 'index' },
            { symbol: '^AEX', name: 'AEX', type: 'index' },
            { symbol: '^SSMI', name: 'SMI', type: 'index' },
            // Devises
            { symbol: 'CADUSD=X', name: 'CAD/USD', type: 'forex' },
            { symbol: 'EURUSD=X', name: 'EUR/USD', type: 'forex' },
            { symbol: 'GBPUSD=X', name: 'GBP/USD', type: 'forex' },
            // Obligations (approximation)
            { symbol: '^TNX', name: 'US 10Y', type: 'bond' },
            { symbol: '^FVX', name: 'US 5Y', type: 'bond' }
        ];

        // OPTIMISATION: Chargement parallèle au lieu de séquentiel
        const symbolSymbols = symbols.map(s => s.symbol);
        const tickerPromises = symbolSymbols.map(async (symbol, index) => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/marketdata?endpoint=quote&symbol=${encodeURIComponent(symbol)}&source=auto`);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.c !== undefined) {
                        const item = symbols[index];
                        return {
                            symbol: item.symbol,
                            name: item.name,
                            type: item.type,
                            price: data.c || data.price || 0,
                            change: data.d || data.change || 0,
                            changePercent: data.dp || data.changePercent || 0
                        };
                    }
                }
            } catch (err) {
                console.error(`Erreur chargement ${symbol}:`, err);
            }
            return null;
        });

        // Attendre tous les appels en parallèle
        const tickerResults = (await Promise.all(tickerPromises)).filter(Boolean);
        setTickerData(tickerResults);
        addLog(`✅ Ticker chargé: ${tickerResults.length} instruments`, 'success');
    } catch (error) {
        console.error('Erreur fetchTickerData:', error);
        addLog(`❌ Erreur ticker: ${error.message}`, 'error');
    }
};

// Données Market Data (Finnhub + Alpha Vantage + Yahoo Finance)
const fetchStockData = async (ticker, API_BASE_URL) => {
    try {
        // Essayer d'abord la nouvelle API unifiée avec Yahoo Finance (gratuit)
        const response = await fetch(`${API_BASE_URL}/api/marketdata?endpoint=quote&symbol=${ticker}&source=auto`);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Erreur fetch stock data (marketdata):', error?.message || String(error));
        // Rester sur marketdata; l'API gère déjà ses fallbacks internes
        return null;
    }
};

// Fonction pour charger les dernières nouvelles Finviz pour tous les tickers
const fetchFinvizNews = async (tickers, API_BASE_URL, setFinvizNews) => {
    console.log('📰 Chargement des dernières nouvelles Finviz...');

    const newsPromises = tickers.map(async (ticker) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/finviz-news?ticker=${ticker}`);
            const data = await response.json();

            if (data.success && data.latestNews) {
                return { ticker, news: data.latestNews };
            }
            return { ticker, news: null };
        } catch (error) {
            console.error(`Error fetching Finviz news for ${ticker}:`, error);
            return { ticker, news: null };
        }
    });

    const results = await Promise.all(newsPromises);

    const newsMap = {};
    results.forEach(({ ticker, news }) => {
        newsMap[ticker] = news;
    });

    setFinvizNews(newsMap);
    console.log(`✅ Finviz news loaded for ${Object.keys(newsMap).length} tickers`);
};

// Export additional API functions as needed
const fetchNews = async (API_BASE_URL) => {
    // Implementation would go here
};

const fetchSeekingAlphaData = async (API_BASE_URL) => {
    // Implementation would go here
};

const fetchSeekingAlphaStockData = async (API_BASE_URL) => {
    // Implementation would go here
};

const fetchPeersComparisonData = async (ticker, API_BASE_URL) => {
    // Implementation would go here
};
