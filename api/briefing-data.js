// ============================================================================
// API Endpoint: Briefing Data Collector
// Collecte unifiée des données marché pour les briefings
// ============================================================================

export default async function handler(req, res) {
  // Vérifier la méthode HTTP
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { type = 'morning' } = req.query;

    // Validation du type
    if (!['morning', 'noon', 'evening'].includes(type)) {
      return res.status(400).json({ error: 'Type invalide. Utilisez: morning, noon, evening' });
    }

    const data = {};

    // Collecter les données selon le type de briefing
    if (type === 'morning') {
      // Données pour briefing matinal
      data.asian_markets = await getAsianMarkets();
      data.futures = await getFutures();
    } else if (type === 'noon') {
      // Données pour briefing mi-journée
      data.us_markets = await getUSMarkets();
      data.top_movers = await getTopMovers();
    } else if (type === 'evening') {
      // Données pour briefing soir
      data.us_markets = await getUSMarkets();
      data.top_movers = await getTopMovers();
      data.sectors = await getSectorPerformance();
    }

    return res.status(200).json({
      success: true,
      type,
      data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur Briefing Data:', error);
    
    // Mode fallback avec données simulées
    const fallbackData = getFallbackData(req.query.type || 'morning');
    
    return res.status(200).json({
      success: true,
      type: req.query.type || 'morning',
      data: fallbackData,
      fallback: true,
      timestamp: new Date().toISOString()
    });
  }
}

// ============================================================================
// FONCTIONS DE COLLECTE DE DONNÉES
// ============================================================================

async function getAsianMarkets() {
  const symbols = ['^N225', '^HSI', '000001.SS', '^AXJO'];
  const data = [];
  
  for (const symbol of symbols) {
    try {
      const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
      );
      const json = await response.json();
      const result = json.chart.result[0];
      const meta = result.meta;
      
      data.push({
        symbol,
        name: meta.shortName,
        price: meta.regularMarketPrice,
        change: meta.regularMarketPrice - meta.previousClose,
        changePct: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100
      });
    } catch (error) {
      console.error(`Erreur ${symbol}:`, error);
    }
  }
  
  return data;
}

async function getFutures() {
  const symbols = ['ES=F', 'NQ=F', 'YM=F'];
  const data = [];
  
  for (const symbol of symbols) {
    try {
      const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
      );
      const json = await response.json();
      const result = json.chart.result[0];
      const meta = result.meta;
      
      data.push({
        symbol,
        name: meta.shortName,
        price: meta.regularMarketPrice,
        change: meta.regularMarketPrice - meta.previousClose,
        changePct: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100
      });
    } catch (error) {
      console.error(`Erreur ${symbol}:`, error);
    }
  }
  
  return data;
}

async function getUSMarkets() {
  const symbols = ['^GSPC', '^DJI', '^IXIC'];
  const data = [];
  
  for (const symbol of symbols) {
    try {
      const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
      );
      const json = await response.json();
      const result = json.chart.result[0];
      const meta = result.meta;
      
      data.push({
        symbol,
        name: meta.shortName,
        price: meta.regularMarketPrice,
        change: meta.regularMarketPrice - meta.previousClose,
        changePct: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100
      });
    } catch (error) {
      console.error(`Erreur ${symbol}:`, error);
    }
  }
  
  return data;
}

async function getTopMovers() {
  // Simulé - en production, utiliser API scanner
  return {
    gainers: [
      { symbol: 'NVDA', change: 5.2, volume: 50000000 },
      { symbol: 'TSLA', change: 4.8, volume: 45000000 },
      { symbol: 'AMD', change: 3.9, volume: 35000000 }
    ],
    losers: [
      { symbol: 'META', change: -3.1, volume: 40000000 },
      { symbol: 'GOOGL', change: -2.7, volume: 38000000 },
      { symbol: 'AMZN', change: -2.3, volume: 42000000 }
    ]
  };
}

async function getSectorPerformance() {
  // Simulé - en production, utiliser API secteurs
  return [
    { name: 'Technology', change: 2.1 },
    { name: 'Healthcare', change: 1.8 },
    { name: 'Financials', change: -0.5 },
    { name: 'Energy', change: -1.2 }
  ];
}

// ============================================================================
// DONNÉES FALLBACK
// ============================================================================

function getFallbackData(type) {
  if (type === 'morning') {
    return {
      asian_markets: [
        { symbol: '^N225', name: 'Nikkei 225', price: 32500.50, change: 125.30, changePct: 0.39 },
        { symbol: '^HSI', name: 'Hang Seng', price: 18500.25, change: -85.75, changePct: -0.46 },
        { symbol: '000001.SS', name: 'SSE Composite', price: 3150.80, change: 12.40, changePct: 0.40 },
        { symbol: '^AXJO', name: 'ASX 200', price: 7200.15, change: 45.20, changePct: 0.63 }
      ],
      futures: [
        { symbol: 'ES=F', name: 'S&P 500 E-mini', price: 4250.75, change: 8.25, changePct: 0.19 },
        { symbol: 'NQ=F', name: 'Nasdaq E-mini', price: 14850.50, change: 25.80, changePct: 0.17 },
        { symbol: 'YM=F', name: 'Dow E-mini', price: 34500.25, change: 45.75, changePct: 0.13 }
      ]
    };
  } else if (type === 'noon') {
    return {
      us_markets: [
        { symbol: '^GSPC', name: 'S&P 500', price: 4250.80, change: 12.45, changePct: 0.29 },
        { symbol: '^DJI', name: 'Dow Jones', price: 34520.15, change: 85.30, changePct: 0.25 },
        { symbol: '^IXIC', name: 'NASDAQ', price: 14875.60, change: 45.20, changePct: 0.30 }
      ],
      top_movers: {
        gainers: [
          { symbol: 'NVDA', change: 5.2, volume: 50000000 },
          { symbol: 'TSLA', change: 4.8, volume: 45000000 },
          { symbol: 'AMD', change: 3.9, volume: 35000000 }
        ],
        losers: [
          { symbol: 'META', change: -3.1, volume: 40000000 },
          { symbol: 'GOOGL', change: -2.7, volume: 38000000 },
          { symbol: 'AMZN', change: -2.3, volume: 42000000 }
        ]
      }
    };
  } else {
    return {
      us_markets: [
        { symbol: '^GSPC', name: 'S&P 500', price: 4255.20, change: 16.85, changePct: 0.40 },
        { symbol: '^DJI', name: 'Dow Jones', price: 34580.45, change: 145.60, changePct: 0.42 },
        { symbol: '^IXIC', name: 'NASDAQ', price: 14895.30, change: 65.90, changePct: 0.44 }
      ],
      top_movers: {
        gainers: [
          { symbol: 'NVDA', change: 6.8, volume: 75000000 },
          { symbol: 'TSLA', change: 5.2, volume: 65000000 },
          { symbol: 'AMD', change: 4.1, volume: 45000000 }
        ],
        losers: [
          { symbol: 'META', change: -2.8, volume: 35000000 },
          { symbol: 'GOOGL', change: -1.9, volume: 32000000 },
          { symbol: 'AMZN', change: -1.5, volume: 38000000 }
        ]
      },
      sectors: [
        { name: 'Technology', change: 2.8 },
        { name: 'Healthcare', change: 1.9 },
        { name: 'Financials', change: 0.8 },
        { name: 'Energy', change: -0.3 }
      ]
    };
  }
}
