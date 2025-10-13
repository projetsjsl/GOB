/**
 * API Auto-Population des Tickers
 * Ajoute automatiquement les données d'un nouveau ticker
 */

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: 'Paramètre symbol requis' });
  }

  try {
    console.log(`🔄 Auto-population des données pour ${symbol}`);

    // Configuration Supabase
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Configuration Supabase manquante');
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Types de données à récupérer
    const dataTypes = [
      { type: 'quote', name: 'Cotations' },
      { type: 'profile', name: 'Profils' },
      { type: 'ratios', name: 'Ratios' },
      { type: 'news', name: 'Actualités' },
      { type: 'prices', name: 'Prix historiques' },
      { type: 'analyst', name: 'Recommandations' },
      { type: 'earnings', name: 'Résultats' }
    ];

    const results = {
      symbol,
      success: 0,
      failed: 0,
      dataTypes: []
    };

    // Récupérer et sauvegarder chaque type de données
    for (const dataType of dataTypes) {
      try {
        console.log(`  📊 Récupération ${dataType.name} pour ${symbol}`);
        
        // Récupérer les données depuis l'API hybride
        const response = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/hybrid-data?symbol=${symbol}&dataType=${dataType.type}&syncIfNeeded=true`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.data) {
            // Sauvegarder dans Supabase
            const tableMap = {
              'quote': 'stock_quotes',
              'profile': 'stock_profiles',
              'ratios': 'financial_ratios',
              'news': 'news_articles',
              'prices': 'daily_prices',
              'analyst': 'analyst_recommendations',
              'earnings': 'earnings_calendar'
            };

            const tableName = tableMap[dataType.type];
            
            if (tableName) {
              const { error } = await supabase
                .from(tableName)
                .upsert({
                  symbol: symbol,
                  data: data.data,
                  last_updated: new Date().toISOString()
                });

              if (error) {
                throw error;
              }
            }
            
            results.success++;
            results.dataTypes.push({
              type: dataType.type,
              name: dataType.name,
              status: 'success',
              source: data.source
            });
            
            console.log(`    ✅ ${dataType.name} sauvegardé`);
          } else {
            results.failed++;
            results.dataTypes.push({
              type: dataType.type,
              name: dataType.name,
              status: 'no_data',
              error: 'Aucune donnée disponible'
            });
            console.log(`    ⚠️ ${dataType.name} - Pas de données`);
          }
        } else {
          results.failed++;
          results.dataTypes.push({
            type: dataType.type,
            name: dataType.name,
            status: 'error',
            error: `HTTP ${response.status}`
          });
          console.log(`    ❌ ${dataType.name} - Erreur HTTP: ${response.status}`);
        }
      } catch (error) {
        results.failed++;
        results.dataTypes.push({
          type: dataType.type,
          name: dataType.name,
          status: 'error',
          error: error.message
        });
        console.log(`    ❌ ${dataType.name} - Erreur: ${error.message}`);
      }
    }

    // Ajouter le ticker à la watchlist par défaut
    try {
      const { error: watchlistError } = await supabase
        .from('watchlists')
        .upsert({
          user_id: 'default',
          tickers: [symbol],
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (watchlistError) {
        console.warn('⚠️ Erreur ajout à la watchlist:', watchlistError.message);
      } else {
        console.log(`✅ ${symbol} ajouté à la watchlist par défaut`);
      }
    } catch (error) {
      console.warn('⚠️ Erreur watchlist:', error.message);
    }

    console.log(`🎉 Auto-population terminée pour ${symbol}`);
    console.log(`✅ Succès: ${results.success}, ❌ Échecs: ${results.failed}`);

    return res.status(200).json({
      success: true,
      message: `Données auto-populées pour ${symbol}`,
      results: {
        symbol,
        success: results.success,
        failed: results.failed,
        total: results.success + results.failed,
        dataTypes: results.dataTypes,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error(`❌ Erreur auto-population ${symbol}:`, error);
    return res.status(500).json({
      error: `Erreur auto-population pour ${symbol}`,
      details: error.message
    });
  }
}
