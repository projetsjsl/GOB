/**
 * Diagnostic du Problème Supabase
 * Identifie pourquoi Supabase ne fonctionne pas
 */

const diagnoseSupabaseIssue = async () => {
  console.log('🔍 DIAGNOSTIC DU PROBLÈME SUPABASE');
  console.log('===================================');
  console.log('');

  // Test 1: API Supabase Watchlist
  console.log('🧪 TEST 1: API Supabase Watchlist');
  console.log('----------------------------------');
  
  try {
    const response = await fetch('https://gobapps.com/api/supabase-watchlist');
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API Supabase Watchlist fonctionnelle');
      console.log('   Données:', JSON.stringify(data).substring(0, 100) + '...');
    } else {
      console.log('❌ API Supabase Watchlist échouée:', response.status);
      console.log('   Erreur:', data.error || 'Inconnue');
      console.log('   Détails:', data.details || 'Aucun détail');
    }
  } catch (error) {
    console.log('❌ Erreur API Supabase Watchlist:', error.message);
  }
  console.log('');

  // Test 2: API Hybride
  console.log('🧪 TEST 2: API Hybride');
  console.log('----------------------');
  
  try {
    const response = await fetch('https://gobapps.com/api/hybrid-data?symbol=AAPL&dataType=quote&syncIfNeeded=true');
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API Hybride fonctionnelle');
      console.log(`   Source: ${data.source}`);
      console.log(`   Données: ${data.data ? 'Présentes' : 'Manquantes'}`);
      
      if (data.source === 'local') {
        console.log('🎉 Cache local Supabase fonctionnel !');
      } else {
        console.log('⚠️ Utilisation des APIs externes (Supabase non actif)');
      }
    } else {
      console.log('❌ API Hybride échouée:', response.status);
    }
  } catch (error) {
    console.log('❌ Erreur API Hybride:', error.message);
  }
  console.log('');

  // Test 3: Vérifier les logs Vercel (simulation)
  console.log('📋 DIAGNOSTIC PROBABLE');
  console.log('----------------------');
  
  console.log('🔍 Causes possibles du problème Supabase:');
  console.log('');
  console.log('1. ❌ Variables d\'environnement manquantes:');
  console.log('   - SUPABASE_URL non configuré dans Vercel');
  console.log('   - SUPABASE_ANON_KEY non configuré dans Vercel');
  console.log('');
  console.log('2. ❌ Projet Supabase non créé:');
  console.log('   - Projet gob-watchlist n\'existe pas');
  console.log('   - Projet créé mais inactif');
  console.log('');
  console.log('3. ❌ Tables non créées:');
  console.log('   - Script supabase-historical-tables.sql non exécuté');
  console.log('   - Tables créées mais avec erreurs');
  console.log('');
  console.log('4. ❌ Permissions insuffisantes:');
  console.log('   - Clé API incorrecte');
  console.log('   - Politiques RLS trop restrictives');
  console.log('');

  // Solutions
  console.log('🔧 SOLUTIONS RECOMMANDÉES');
  console.log('-------------------------');
  console.log('');
  console.log('📋 ÉTAPE 1: Vérifier les Variables d\'Environnement');
  console.log('1. Aller sur Vercel Dashboard');
  console.log('2. Projet GOB → Settings → Environment Variables');
  console.log('3. Vérifier que SUPABASE_URL et SUPABASE_ANON_KEY existent');
  console.log('4. Si manquantes, les ajouter');
  console.log('');
  console.log('📋 ÉTAPE 2: Vérifier le Projet Supabase');
  console.log('1. Aller sur https://supabase.com');
  console.log('2. Vérifier que le projet gob-watchlist existe');
  console.log('3. Vérifier qu\'il est actif');
  console.log('');
  console.log('📋 ÉTAPE 3: Créer les Tables');
  console.log('1. Dans Supabase Dashboard → SQL Editor');
  console.log('2. Copier le contenu de supabase-historical-tables.sql');
  console.log('3. Exécuter le script');
  console.log('');
  console.log('📋 ÉTAPE 4: Redéployer');
  console.log('1. Dans Vercel Dashboard → Deployments');
  console.log('2. Cliquer "Redeploy"');
  console.log('3. Attendre la fin du déploiement');
  console.log('');

  // Test final
  console.log('🧪 TEST FINAL RECOMMANDÉ');
  console.log('------------------------');
  console.log('Après avoir suivi les étapes ci-dessus, relancer:');
  console.log('node test-gob-watchlist-supabase.js');
  console.log('');
  console.log('🎯 RÉSULTAT ATTENDU:');
  console.log('✅ Variables d\'environnement configurées');
  console.log('✅ Connexion Supabase réussie');
  console.log('✅ Tables créées');
  console.log('✅ API hybride avec cache local');
  console.log('');
};

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  diagnoseSupabaseIssue().catch(console.error);
}

export { diagnoseSupabaseIssue };
