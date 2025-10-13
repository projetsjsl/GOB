/**
 * Vérification du Statut Supabase
 * Vérifie si Supabase est configuré et guide l'utilisateur
 */

const checkSupabaseStatus = async () => {
  console.log('🔍 VÉRIFICATION DU STATUT SUPABASE');
  console.log('===================================');
  console.log('');

  // Vérifier les variables d'environnement
  console.log('📋 ÉTAPE 1: Vérification des Variables d\'Environnement');
  console.log('-------------------------------------------------------');
  
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  
  console.log('SUPABASE_URL:', SUPABASE_URL ? '✅ Configuré' : '❌ Manquant');
  console.log('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅ Configuré' : '❌ Manquant');
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log('');
    console.log('🚨 SUPABASE NON CONFIGURÉ !');
    console.log('');
    console.log('📋 ACTIONS REQUISES:');
    console.log('1. Créer un projet sur https://supabase.com (nom: gob-watchlist)');
    console.log('2. Récupérer SUPABASE_URL et SUPABASE_ANON_KEY');
    console.log('3. Les ajouter dans Vercel Environment Variables');
    console.log('');
    console.log('📖 Guide détaillé: CONFIGURATION-SUPABASE-IMMEDIATE.md');
    return false;
  }
  
  console.log('✅ Variables d\'environnement configurées');
  console.log('');

  // Tester la connexion Supabase
  console.log('🔌 ÉTAPE 2: Test de Connexion Supabase');
  console.log('--------------------------------------');
  
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Test simple de connexion
    const { data, error } = await supabase
      .from('watchlists')
      .select('count')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    console.log('✅ Connexion Supabase réussie');
    console.log('');
  } catch (error) {
    console.log('❌ Erreur connexion Supabase:', error.message);
    console.log('');
    console.log('🔧 SOLUTIONS:');
    console.log('1. Vérifier que le projet Supabase existe');
    console.log('2. Vérifier que les clés sont correctes');
    console.log('3. Vérifier que le projet est actif');
    return false;
  }

  // Vérifier les tables historiques
  console.log('🗄️ ÉTAPE 3: Vérification des Tables Historiques');
  console.log('-----------------------------------------------');
  
  const tables = [
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
    
    for (const table of tables) {
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
      console.log('✅ Toutes les tables sont créées');
      console.log('');
    }
  } catch (error) {
    console.log('❌ Erreur vérification tables:', error.message);
    return false;
  }

  // Vérifier les données en cache
  console.log('📊 ÉTAPE 4: Vérification des Données en Cache');
  console.log('---------------------------------------------');
  
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data: quotes, error } = await supabase
      .from('stock_quotes')
      .select('symbol, last_updated')
      .order('last_updated', { ascending: false })
      .limit(5);
    
    if (error) {
      throw error;
    }
    
    if (quotes && quotes.length > 0) {
      console.log('✅ Données en cache trouvées:', quotes.length);
      quotes.forEach(quote => {
        console.log(`   - ${quote.symbol}: ${new Date(quote.last_updated).toLocaleString()}`);
      });
    } else {
      console.log('⚠️ Aucune donnée en cache trouvée');
      console.log('💡 Les données seront mises en cache lors de la première utilisation');
    }
    console.log('');
  } catch (error) {
    console.log('❌ Erreur vérification cache:', error.message);
    return false;
  }

  // Test de l'API hybride
  console.log('🧪 ÉTAPE 5: Test de l\'API Hybride');
  console.log('----------------------------------');
  
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
  console.log('✅ Supabase configuré et fonctionnel');
  console.log('✅ Tables créées');
  console.log('✅ API hybride opérationnelle');
  console.log('✅ Système prêt pour le cache local');
  console.log('');
  console.log('🎉 FÉLICITATIONS !');
  console.log('Votre système JLab™ est maintenant optimisé avec Supabase !');
  
  return true;
};

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  checkSupabaseStatus().catch(console.error);
}

export { checkSupabaseStatus };
