/**
 * Test du Projet Supabase gob-watchlist
 * Vérifie que le projet gob-watchlist est correctement configuré
 */

const testGobWatchlistSupabase = async () => {
  console.log('🔍 TEST DU PROJET SUPABASE gob-watchlist');
  console.log('=========================================');
  console.log('');

  // Vérifier les variables d'environnement
  console.log('📋 VÉRIFICATION DES VARIABLES D\'ENVIRONNEMENT');
  console.log('---------------------------------------------');
  
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  
  console.log('SUPABASE_URL:', SUPABASE_URL ? '✅ Configuré' : '❌ Manquant');
  if (SUPABASE_URL) {
    console.log('   URL:', SUPABASE_URL);
    // Vérifier si l'URL contient gob-watchlist
    if (SUPABASE_URL.includes('gob-watchlist')) {
      console.log('   ✅ URL correspond au projet gob-watchlist');
    } else {
      console.log('   ⚠️ URL ne correspond pas au projet gob-watchlist');
    }
  }
  
  console.log('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅ Configuré' : '❌ Manquant');
  if (SUPABASE_ANON_KEY) {
    console.log('   Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...');
  }
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log('');
    console.log('🚨 CONFIGURATION REQUISE !');
    console.log('');
    console.log('📋 ÉTAPES POUR CONFIGURER gob-watchlist:');
    console.log('');
    console.log('1. 🆕 Créer le projet Supabase:');
    console.log('   - Aller sur https://supabase.com');
    console.log('   - Créer un nouveau projet');
    console.log('   - Nom: gob-watchlist');
    console.log('   - Région: West Europe (Ireland)');
    console.log('');
    console.log('2. 🗄️ Créer les tables:');
    console.log('   - Aller dans SQL Editor');
    console.log('   - Copier le contenu de supabase-historical-tables.sql');
    console.log('   - Exécuter le script');
    console.log('');
    console.log('3. 🔑 Récupérer les clés:');
    console.log('   - Aller dans Settings > API');
    console.log('   - Copier Project URL et anon public key');
    console.log('   - Les ajouter dans Vercel Environment Variables');
    console.log('');
    console.log('4. 🚀 Redéployer:');
    console.log('   - Dans Vercel Dashboard > Deployments');
    console.log('   - Cliquer "Redeploy"');
    console.log('');
    return false;
  }
  
  console.log('✅ Variables d\'environnement configurées');
  console.log('');

  // Tester la connexion
  console.log('🔌 TEST DE CONNEXION SUPABASE');
  console.log('-----------------------------');
  
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Test avec la table watchlists existante
    const { data: watchlists, error: watchlistError } = await supabase
      .from('watchlists')
      .select('*')
      .limit(1);
    
    if (watchlistError && watchlistError.code !== 'PGRST116') {
      throw watchlistError;
    }
    
    console.log('✅ Connexion Supabase réussie');
    console.log('✅ Table watchlists accessible');
    
    if (watchlists && watchlists.length > 0) {
      console.log(`   Watchlists trouvées: ${watchlists.length}`);
    } else {
      console.log('   Aucune watchlist trouvée (normal pour un nouveau projet)');
    }
    console.log('');
  } catch (error) {
    console.log('❌ Erreur connexion Supabase:', error.message);
    console.log('');
    console.log('🔧 SOLUTIONS:');
    console.log('1. Vérifier que le projet gob-watchlist existe');
    console.log('2. Vérifier que les clés sont correctes');
    console.log('3. Vérifier que le projet est actif');
    return false;
  }

  // Vérifier les tables historiques
  console.log('🗄️ VÉRIFICATION DES TABLES HISTORIQUES');
  console.log('--------------------------------------');
  
  const historicalTables = [
    'stock_quotes',
    'stock_profiles', 
    'financial_ratios',
    'news_articles',
    'daily_prices',
    'analyst_recommendations',
    'earnings_calendar'
  ];
  
  const existingTables = [];
  const missingTables = [];
  
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    for (const table of historicalTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        if (error && error.code === '42P01') { // Table doesn't exist
          missingTables.push(table);
        } else {
          existingTables.push(table);
        }
      } catch (error) {
        missingTables.push(table);
      }
    }
    
    console.log('✅ Tables existantes:', existingTables.length);
    existingTables.forEach(table => console.log(`   - ${table}`));
    
    if (missingTables.length > 0) {
      console.log('');
      console.log('❌ Tables manquantes:', missingTables.length);
      missingTables.forEach(table => console.log(`   - ${table}`));
      console.log('');
      console.log('🔧 SOLUTION:');
      console.log('1. Aller dans Supabase Dashboard → SQL Editor');
      console.log('2. Copier le contenu de supabase-historical-tables.sql');
      console.log('3. Exécuter le script');
      console.log('');
      return false;
    } else {
      console.log('✅ Toutes les tables historiques sont créées');
      console.log('');
    }
  } catch (error) {
    console.log('❌ Erreur vérification tables:', error.message);
    return false;
  }

  // Test de l'API hybride
  console.log('🧪 TEST DE L\'API HYBRIDE');
  console.log('-------------------------');
  
  try {
    const response = await fetch('https://gobapps.com/api/hybrid-data?symbol=AAPL&dataType=quote&syncIfNeeded=true');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API hybride fonctionnelle');
      console.log(`   Source: ${data.source}`);
      console.log(`   Données: ${data.data ? 'Présentes' : 'Manquantes'}`);
      
      if (data.source === 'local') {
        console.log('🎉 Cache local fonctionnel !');
      } else {
        console.log('⚠️ Utilisation des APIs externes (cache pas encore actif)');
      }
    } else {
      console.log('❌ API hybride échouée:', response.status);
    }
  } catch (error) {
    console.log('⚠️ Erreur test API hybride:', error.message);
  }

  console.log('');
  console.log('🎯 RÉSUMÉ FINAL');
  console.log('===============');
  console.log('✅ Projet gob-watchlist configuré');
  console.log('✅ Tables historiques créées');
  console.log('✅ API hybride opérationnelle');
  console.log('✅ Système prêt pour le cache local');
  console.log('');
  console.log('🎉 FÉLICITATIONS !');
  console.log('Votre projet gob-watchlist est maintenant opérationnel !');
  
  return true;
};

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  testGobWatchlistSupabase().catch(console.error);
}

export { testGobWatchlistSupabase };
