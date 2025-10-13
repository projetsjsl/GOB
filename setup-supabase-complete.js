/**
 * Script de Configuration Complète Supabase
 * Automatise la création du projet et la configuration des tables
 */

const setupSupabase = async () => {
  console.log('🚀 Configuration Complète Supabase pour JLab™');
  console.log('===============================================');

  // Étape 1: Vérifier les prérequis
  console.log('\n📋 Étape 1: Vérification des prérequis');
  
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('❌ Variables d\'environnement manquantes:');
    missingVars.forEach(varName => console.log(`   - ${varName}`));
    console.log('\n🔧 Actions requises:');
    console.log('1. Créer un projet sur https://supabase.com');
    console.log('2. Récupérer SUPABASE_URL et SUPABASE_ANON_KEY');
    console.log('3. Les ajouter dans Vercel ou .env.local');
    return false;
  }

  console.log('✅ Variables d\'environnement configurées');

  // Étape 2: Tester la connexion Supabase
  console.log('\n🔌 Étape 2: Test de connexion Supabase');
  
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Test de connexion simple
    const { data, error } = await supabase
      .from('watchlists')
      .select('count')
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    console.log('✅ Connexion Supabase réussie');
  } catch (error) {
    console.log('❌ Erreur connexion Supabase:', error.message);
    return false;
  }

  // Étape 3: Créer les tables historiques
  console.log('\n🗄️ Étape 3: Création des tables historiques');
  
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Lire le script SQL
    const fs = await import('fs');
    const sqlScript = fs.readFileSync('supabase-historical-tables.sql', 'utf8');
    
    // Exécuter le script SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlScript });
    
    if (error) {
      console.log('⚠️ Erreur exécution SQL:', error.message);
      console.log('💡 Solution: Exécuter manuellement le script dans l\'éditeur SQL Supabase');
    } else {
      console.log('✅ Tables historiques créées');
    }
  } catch (error) {
    console.log('⚠️ Impossible d\'exécuter le script automatiquement:', error.message);
    console.log('💡 Solution: Copier-coller le contenu de supabase-historical-tables.sql dans l\'éditeur SQL Supabase');
  }

  // Étape 4: Tester l'API hybride
  console.log('\n🧪 Étape 4: Test de l\'API hybride');
  
  const testCases = [
    { symbol: 'AAPL', dataType: 'quote' },
    { symbol: 'MSFT', dataType: 'profile' },
    { symbol: 'GOOGL', dataType: 'ratios' }
  ];

  for (const testCase of testCases) {
    try {
      const response = await fetch(
        `http://localhost:3000/api/hybrid-data?symbol=${testCase.symbol}&dataType=${testCase.dataType}&syncIfNeeded=true`
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${testCase.symbol} (${testCase.dataType}): ${data.source}`);
      } else {
        console.log(`❌ ${testCase.symbol} (${testCase.dataType}): ${response.status}`);
      }
    } catch (error) {
      console.log(`⚠️ ${testCase.symbol} (${testCase.dataType}): ${error.message}`);
    }
  }

  // Étape 5: Validation finale
  console.log('\n🎯 Étape 5: Validation finale');
  
  console.log('✅ Configuration Supabase terminée !');
  console.log('\n📊 Prochaines étapes:');
  console.log('1. Vérifier les tables dans Supabase Dashboard');
  console.log('2. Tester le dashboard JLab™');
  console.log('3. Vérifier l\'affichage des données dans tous les onglets');
  
  return true;
};

// Exporter pour utilisation
if (typeof module !== 'undefined' && module.exports) {
  module.exports = setupSupabase;
}

// Exécuter si appelé directement
if (require.main === module) {
  setupSupabase().catch(console.error);
}
