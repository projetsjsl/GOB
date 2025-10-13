/**
 * API Synchronisation des Données Historiques
 * Synchronise les données historiques (prix au jour le jour, heure par heure)
 */

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { symbol, timeframe = '1day', limit = 100 } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: 'Paramètre symbol requis' });
  }

  try {
    console.log(`🔄 Synchronisation données historiques pour ${symbol} (${timeframe})`);

    // Configuration Supabase
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Configuration Supabase manquante');
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Récupérer les données historiques depuis FMP
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/fmp?endpoint=historical-chart&symbol=${symbol}&timeframe=${timeframe}&limit=${limit}`);

    if (!response.ok) {
      throw new Error(`Erreur API FMP: ${response.status}`);
    }

    const historicalData = await response.json();

    if (!historicalData || !Array.isArray(historicalData)) {
      throw new Error('Données historiques invalides');
    }

    // Traiter et sauvegarder les données historiques
    const processedData = historicalData.map(item => ({
      date: item.date || item.timestamp,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
      timeframe: timeframe
    }));

    // Sauvegarder dans la table daily_prices
    const { error } = await supabase
      .from('daily_prices')
      .upsert({
        symbol: symbol,
        data: {
          timeframe: timeframe,
          limit: limit,
          data: processedData,
          last_sync: new Date().toISOString()
        },
        last_updated: new Date().toISOString()
      });

    if (error) {
      throw error;
    }

    console.log(`✅ ${processedData.length} points de données historiques sauvegardés pour ${symbol}`);

    // Si timeframe est intraday (1min, 5min, 15min, 30min, 1hour), sauvegarder aussi dans stock_quotes
    if (['1min', '5min', '15min', '30min', '1hour'].includes(timeframe)) {
      const latestData = processedData[processedData.length - 1];
      
      if (latestData) {
        const { error: quoteError } = await supabase
          .from('stock_quotes')
          .upsert({
            symbol: symbol,
            data: {
              price: latestData.close,
              open: latestData.open,
              high: latestData.high,
              low: latestData.low,
              volume: latestData.volume,
              timeframe: timeframe,
              timestamp: latestData.date
            },
            last_updated: new Date().toISOString()
          });

        if (quoteError) {
          console.warn('⚠️ Erreur sauvegarde quote:', quoteError.message);
        } else {
          console.log(`✅ Cotation intraday mise à jour pour ${symbol}`);
        }
      }
    }

    return res.status(200).json({
      success: true,
      symbol,
      timeframe,
      dataPoints: processedData.length,
      message: `Données historiques synchronisées pour ${symbol}`,
      data: {
        symbol,
        timeframe,
        limit,
        dataPoints: processedData.length,
        lastSync: new Date().toISOString(),
        sampleData: processedData.slice(0, 5) // Aperçu des 5 premiers points
      }
    });

  } catch (error) {
    console.error(`❌ Erreur synchronisation historique ${symbol}:`, error);
    return res.status(500).json({
      error: `Erreur synchronisation historique pour ${symbol}`,
      details: error.message
    });
  }
}
