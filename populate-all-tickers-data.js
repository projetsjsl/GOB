/**
 * Meubler les Données de Tous les Tickers
 * Récupère et stocke les données de tous les tickers actuels du site
 */

import { createClient } from '@supabase/supabase-js';

const populateAllTickersData = async () => {
  console.log('📊 MEUBLAGE DES DONNÉES DE TOUS LES TICKERS');
  console.log('===========================================');
  console.log('');

  // Configuration Supabase
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log('❌ Variables Supabase manquantes');
    console.log('Configurez SUPABASE_URL et SUPABASE_ANON_KEY');
    return false;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Liste des tickers actuels du site
  const currentTickers = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX',
    'ACN', 'ADBE', 'CRM', 'ORCL', 'INTC', 'AMD', 'PYPL', 'UBER',
    'SPOT', 'ZOOM', 'SHOP', 'SQ', 'ROKU', 'PINS', 'SNAP', 'TWTR'
  ];

  console.log(`📋 Tickers à traiter: ${currentTickers.length}`);
  console.log('Tickers:', currentTickers.join(', '));
  console.log('');

  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

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

  for (const ticker of currentTickers) {
    console.log(`\n📈 Traitement de ${ticker}`);
    console.log('─'.repeat(30));

    for (const dataType of dataTypes) {
      try {
        console.log(`  🔄 ${dataType.name}...`);
        
        // Récupérer les données depuis l'API hybride
        const response = await fetch(`https://gobapps.com/api/hybrid-data?symbol=${ticker}&dataType=${dataType.type}&syncIfNeeded=true`);
        
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
                  symbol: ticker,
                  data: data.data,
                  last_updated: new Date().toISOString()
                });

              if (error) {
                throw error;
              }
            }
            
            console.log(`    ✅ ${dataType.name} sauvegardé`);
            results.success++;
          } else {
            console.log(`    ⚠️ ${dataType.name} - Pas de données`);
            results.failed++;
            results.errors.push(`${ticker} - ${dataType.name}: Pas de données`);
          }
        } else {
          console.log(`    ❌ ${dataType.name} - Erreur HTTP: ${response.status}`);
          results.failed++;
          results.errors.push(`${ticker} - ${dataType.name}: HTTP ${response.status}`);
        }
      } catch (error) {
        console.log(`    ❌ ${dataType.name} - Erreur: ${error.message}`);
        results.failed++;
        results.errors.push(`${ticker} - ${dataType.name}: ${error.message}`);
      }
    }
  }

  // Résumé
  console.log('\n📊 RÉSUMÉ DU MEUBLAGE');
  console.log('=====================');
  console.log(`✅ Succès: ${results.success}`);
  console.log(`❌ Échecs: ${results.failed}`);
  console.log(`📈 Taux de réussite: ${Math.round((results.success / (results.success + results.failed)) * 100)}%`);

  if (results.errors.length > 0) {
    console.log('\n🚨 ERREURS DÉTECTÉES:');
    results.errors.forEach(error => console.log(`   - ${error}`));
  }

  // Vérifier les données en cache
  console.log('\n🔍 VÉRIFICATION DES DONNÉES EN CACHE');
  console.log('=====================================');
  
  try {
    const { data: quotes, error } = await supabase
      .from('stock_quotes')
      .select('symbol, last_updated')
      .order('last_updated', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (quotes && quotes.length > 0) {
      console.log(`✅ ${quotes.length} cotations en cache:`);
      quotes.forEach(quote => {
        console.log(`   - ${quote.symbol}: ${new Date(quote.last_updated).toLocaleString()}`);
      });
    } else {
      console.log('⚠️ Aucune donnée en cache trouvée');
    }
  } catch (error) {
    console.log('❌ Erreur vérification cache:', error.message);
  }

  console.log('\n🎉 MEUBLAGE TERMINÉ !');
  console.log('Les données sont maintenant disponibles en cache local.');
  
  return results;
};

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  populateAllTickersData().catch(console.error);
}

export { populateAllTickersData };
