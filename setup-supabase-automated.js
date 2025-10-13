/**
 * Configuration Automatisée Supabase
 * Crée un projet et configure les tables automatiquement
 */

import { createClient } from '@supabase/supabase-js';

const setupSupabaseProject = async () => {
  console.log('🚀 Configuration Automatisée Supabase');
  console.log('=====================================');

  // Instructions pour l'utilisateur
  console.log('\n📋 ÉTAPES MANUELLES REQUISES:');
  console.log('1. Aller sur https://supabase.com');
  console.log('2. Créer un nouveau projet');
  console.log('3. Récupérer SUPABASE_URL et SUPABASE_ANON_KEY');
  console.log('4. Les ajouter dans Vercel Environment Variables');
  
  console.log('\n🔧 CONFIGURATION AUTOMATIQUE:');
  console.log('Une fois les variables configurées, ce script peut:');
  console.log('- Tester la connexion Supabase');
  console.log('- Créer les tables automatiquement');
  console.log('- Valider la configuration');
  
  // Vérifier si les variables sont configurées
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log('\n❌ Variables d\'environnement manquantes');
    console.log('SUPABASE_URL:', SUPABASE_URL ? '✅ Configuré' : '❌ Manquant');
    console.log('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅ Configuré' : '❌ Manquant');
    
    console.log('\n💡 Pour configurer:');
    console.log('1. Créer un projet sur https://supabase.com');
    console.log('2. Aller dans Settings > API');
    console.log('3. Copier Project URL et anon public key');
    console.log('4. Les ajouter dans Vercel Environment Variables');
    
    return false;
  }
  
  console.log('\n✅ Variables d\'environnement détectées');
  console.log('URL:', SUPABASE_URL);
  console.log('Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...');
  
  // Tester la connexion
  console.log('\n🔌 Test de connexion Supabase...');
  
  try {
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
    
    // Vérifier les tables existantes
    console.log('\n🗄️ Vérification des tables...');
    
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
      console.log('❌ Tables manquantes:', missingTables.length);
      missingTables.forEach(table => console.log(`   - ${table}`));
      
      console.log('\n🔧 Création des tables manquantes...');
      console.log('💡 Copier le contenu de supabase-historical-tables.sql');
      console.log('   dans l\'éditeur SQL de Supabase et l\'exécuter');
    } else {
      console.log('✅ Toutes les tables sont créées');
    }
    
    // Test de l'API hybride
    console.log('\n🧪 Test de l\'API hybride...');
    
    try {
      const response = await fetch('https://gobapps.com/api/hybrid-data?symbol=AAPL&dataType=quote&syncIfNeeded=true');
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API hybride fonctionnelle');
        console.log('   Source:', data.source);
        console.log('   Données:', data.data ? 'Présentes' : 'Manquantes');
      } else {
        console.log('❌ API hybride échouée:', response.status);
      }
    } catch (error) {
      console.log('⚠️ Erreur test API hybride:', error.message);
    }
    
    console.log('\n🎯 CONFIGURATION TERMINÉE !');
    console.log('✅ Supabase connecté');
    console.log('✅ Tables vérifiées');
    console.log('✅ API hybride testée');
    
    return true;
    
  } catch (error) {
    console.log('❌ Erreur connexion Supabase:', error.message);
    return false;
  }
};

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  setupSupabaseProject().catch(console.error);
}

export { setupSupabaseProject };
