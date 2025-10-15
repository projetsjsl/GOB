// ============================================================================
// SCRIPT DE TEST - CONNEXION SUPABASE
// ============================================================================
// Ce script teste la connexion Supabase avec les variables d'environnement
// ============================================================================

const { createClient } = require('@supabase/supabase-js');

async function testSupabaseConnection() {
  console.log('🔍 Test de connexion Supabase...');
  
  // Variables d'environnement (à configurer dans Vercel)
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('📋 Variables d\'environnement :');
  console.log(`- SUPABASE_URL: ${SUPABASE_URL ? '✅ Configurée' : '❌ Manquante'}`);
  console.log(`- SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY ? '✅ Configurée' : '❌ Manquante'}`);
  console.log(`- SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurée' : '❌ Manquante'}`);
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log('❌ Variables Supabase manquantes');
    console.log('🔧 Actions requises :');
    console.log('1. Aller dans Vercel → Settings → Environment Variables');
    console.log('2. Ajouter SUPABASE_URL=https://[project-id].supabase.co');
    console.log('3. Ajouter SUPABASE_ANON_KEY=[votre-anon-key]');
    console.log('4. Ajouter SUPABASE_SERVICE_ROLE_KEY=[votre-service-role-key]');
    console.log('5. Redéployer l\'application');
    return;
  }
  
  try {
    // Test avec anon key
    console.log('\n🔑 Test avec clé anon...');
    const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data: anonData, error: anonError } = await supabaseAnon
      .from('watchlists')
      .select('*')
      .limit(1);
    
    if (anonError) {
      console.log('❌ Erreur anon:', anonError.message);
    } else {
      console.log('✅ Connexion anon réussie');
      console.log('📊 Données:', anonData);
    }
    
    // Test avec service role key
    if (SUPABASE_SERVICE_ROLE_KEY) {
      console.log('\n🔑 Test avec clé service role...');
      const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      const { data: serviceData, error: serviceError } = await supabaseService
        .from('watchlists')
        .select('*')
        .limit(1);
      
      if (serviceError) {
        console.log('❌ Erreur service role:', serviceError.message);
      } else {
        console.log('✅ Connexion service role réussie');
        console.log('📊 Données:', serviceData);
      }
    }
    
    // Test des tables disponibles
    console.log('\n📋 Test des tables...');
    const tables = ['watchlists', 'briefings', 'market_news_cache', 'symbol_news_cache'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabaseAnon
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table}: ${data.length} entrée(s)`);
        }
      } catch (err) {
        console.log(`❌ Table ${table}: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.log('❌ Erreur de connexion:', error.message);
  }
}

// Exécuter le test
testSupabaseConnection().catch(console.error);
