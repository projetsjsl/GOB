/**
 * Test Complet du Dashboard
 * Valide le dashboard en direct avec toutes ses fonctionnalités
 */

const testDashboardComplet = async () => {
  console.log('🌐 TEST COMPLET DU DASHBOARD');
  console.log('============================');
  console.log('');

  const results = {
    site: { status: 'unknown', details: '' },
    jlab: { status: 'unknown', details: [] },
    charts: { status: 'unknown', details: [] },
    data: { status: 'unknown', details: [] }
  };

  // 1. Test du site principal
  console.log('🌐 ÉTAPE 1: Test du Site Principal');
  console.log('----------------------------------');
  
  try {
    const response = await fetch('https://gobapps.com/beta-combined-dashboard.html');
    if (response.ok) {
      const html = await response.text();
      
      // Vérifier que le contenu JLab est présent
      if (html.includes('JLab™')) {
        console.log('✅ Site accessible avec contenu JLab™');
        results.site = { status: 'ok', details: 'Site accessible avec JLab™' };
      } else {
        console.log('⚠️ Site accessible mais JLab™ non trouvé');
        results.site = { status: 'partial', details: 'Site accessible sans JLab™' };
      }
    } else {
      console.log(`❌ Site inaccessible: ${response.status}`);
      results.site = { status: 'error', details: `HTTP ${response.status}` };
    }
  } catch (error) {
    console.log(`❌ Erreur site: ${error.message}`);
    results.site = { status: 'error', details: error.message };
  }
  console.log('');

  // 2. Test des données JLab
  console.log('📊 ÉTAPE 2: Test des Données JLab™');
  console.log('----------------------------------');
  
  const jlabTests = [
    { name: 'AAPL Quote', symbol: 'AAPL', type: 'quote' },
    { name: 'MSFT Profile', symbol: 'MSFT', type: 'profile' },
    { name: 'GOOGL News', symbol: 'GOOGL', type: 'news' },
    { name: 'TSLA Ratios', symbol: 'TSLA', type: 'ratios' }
  ];

  for (const test of jlabTests) {
    try {
      console.log(`  🔄 Test ${test.name}...`);
      const response = await fetch(`https://gobapps.com/api/unified-serverless?endpoint=hybrid-data&symbol=${test.symbol}&dataType=${test.type}&syncIfNeeded=true`);
      const data = await response.json();
      
      if (response.ok && data.success && data.data) {
        console.log(`    ✅ ${test.name}: Données disponibles`);
        results.jlab.details.push(`${test.name}: Données disponibles`);
      } else {
        console.log(`    ❌ ${test.name}: ${data.error || 'Pas de données'}`);
        results.jlab.details.push(`${test.name}: ${data.error || 'Pas de données'}`);
      }
    } catch (error) {
      console.log(`    ❌ ${test.name}: ${error.message}`);
      results.jlab.details.push(`${test.name}: ${error.message}`);
    }
  }

  // Déterminer le statut JLab
  const jlabSuccessCount = results.jlab.details.filter(d => d.includes(': Données disponibles')).length;
  if (jlabSuccessCount === jlabTests.length) {
    results.jlab.status = 'ok';
  } else if (jlabSuccessCount > 0) {
    results.jlab.status = 'partial';
  } else {
    results.jlab.status = 'error';
  }
  console.log('');

  // 3. Test des graphiques
  console.log('📈 ÉTAPE 3: Test des Graphiques');
  console.log('------------------------------');
  
  const chartTests = [
    { name: 'AAPL 1D', symbol: 'AAPL', timeframe: '1D' },
    { name: 'MSFT 1W', symbol: 'MSFT', timeframe: '1W' },
    { name: 'GOOGL 1M', symbol: 'GOOGL', timeframe: '1M' }
  ];

  for (const test of chartTests) {
    try {
      console.log(`  🔄 Test ${test.name}...`);
      const response = await fetch(`https://gobapps.com/api/unified-serverless?endpoint=hybrid-data&symbol=${test.symbol}&dataType=prices&syncIfNeeded=true`);
      const data = await response.json();
      
      if (response.ok && data.success && data.data) {
        console.log(`    ✅ ${test.name}: Données graphique disponibles`);
        results.charts.details.push(`${test.name}: Données graphique disponibles`);
      } else {
        console.log(`    ❌ ${test.name}: ${data.error || 'Pas de données graphique'}`);
        results.charts.details.push(`${test.name}: ${data.error || 'Pas de données graphique'}`);
      }
    } catch (error) {
      console.log(`    ❌ ${test.name}: ${error.message}`);
      results.charts.details.push(`${test.name}: ${error.message}`);
    }
  }

  // Déterminer le statut des graphiques
  const chartSuccessCount = results.charts.details.filter(d => d.includes(': Données graphique disponibles')).length;
  if (chartSuccessCount === chartTests.length) {
    results.charts.status = 'ok';
  } else if (chartSuccessCount > 0) {
    results.charts.status = 'partial';
  } else {
    results.charts.status = 'error';
  }
  console.log('');

  // 4. Test des métriques
  console.log('📊 ÉTAPE 4: Test des Métriques');
  console.log('-----------------------------');
  
  const metricTests = [
    { name: 'Market Cap', symbol: 'AAPL', metric: 'marketCap' },
    { name: 'P/E Ratio', symbol: 'MSFT', metric: 'peRatio' },
    { name: 'Volume', symbol: 'GOOGL', metric: 'volume' }
  ];

  for (const test of metricTests) {
    try {
      console.log(`  🔄 Test ${test.name}...`);
      const response = await fetch(`https://gobapps.com/api/unified-serverless?endpoint=hybrid-data&symbol=${test.symbol}&dataType=quote&syncIfNeeded=true`);
      const data = await response.json();
      
      if (response.ok && data.success && data.data) {
        // Vérifier si la métrique est présente
        const hasMetric = data.data[test.metric] !== undefined;
        if (hasMetric) {
          console.log(`    ✅ ${test.name}: Métrique disponible`);
          results.data.details.push(`${test.name}: Métrique disponible`);
        } else {
          console.log(`    ⚠️ ${test.name}: Métrique manquante`);
          results.data.details.push(`${test.name}: Métrique manquante`);
        }
      } else {
        console.log(`    ❌ ${test.name}: ${data.error || 'Pas de données'}`);
        results.data.details.push(`${test.name}: ${data.error || 'Pas de données'}`);
      }
    } catch (error) {
      console.log(`    ❌ ${test.name}: ${error.message}`);
      results.data.details.push(`${test.name}: ${error.message}`);
    }
  }

  // Déterminer le statut des métriques
  const metricSuccessCount = results.data.details.filter(d => d.includes(': Métrique disponible')).length;
  if (metricSuccessCount === metricTests.length) {
    results.data.status = 'ok';
  } else if (metricSuccessCount > 0) {
    results.data.status = 'partial';
  } else {
    results.data.status = 'error';
  }
  console.log('');

  // 5. Résumé complet
  console.log('📋 RÉSUMÉ COMPLET DU DASHBOARD');
  console.log('==============================');
  console.log(`🌐 Site: ${results.site.status === 'ok' ? '✅' : results.site.status === 'partial' ? '⚠️' : '❌'} ${results.site.details}`);
  console.log(`📊 JLab™: ${results.jlab.status === 'ok' ? '✅' : results.jlab.status === 'partial' ? '⚠️' : '❌'} ${results.jlab.details.length} tests`);
  console.log(`📈 Graphiques: ${results.charts.status === 'ok' ? '✅' : results.charts.status === 'partial' ? '⚠️' : '❌'} ${results.charts.details.length} tests`);
  console.log(`📊 Métriques: ${results.data.status === 'ok' ? '✅' : results.data.status === 'partial' ? '⚠️' : '❌'} ${results.data.details.length} tests`);
  console.log('');

  // 6. Recommandations
  console.log('🎯 RECOMMANDATIONS');
  console.log('==================');
  
  if (results.site.status === 'ok') {
    console.log('✅ Site accessible - Dashboard prêt à être testé manuellement');
    console.log('🌐 URL: https://gobapps.com/beta-combined-dashboard.html');
  }
  
  if (results.jlab.status === 'error') {
    console.log('🚨 JLab™ non fonctionnel - Problème avec les APIs');
    console.log('   - Vérifier la clé API FMP');
    console.log('   - Configurer Supabase');
  }
  
  if (results.charts.status === 'error') {
    console.log('🚨 Graphiques non fonctionnels - Pas de données historiques');
    console.log('   - Vérifier l\'API FMP pour les données de prix');
    console.log('   - Configurer Supabase pour le cache local');
  }
  
  if (results.data.status === 'error') {
    console.log('🚨 Métriques manquantes - Données incomplètes');
    console.log('   - Vérifier les APIs de données financières');
    console.log('   - Configurer Supabase pour la validation des données');
  }

  console.log('');
  console.log('📖 GUIDES DISPONIBLES:');
  console.log('- ACTION-IMMEDIATE-VALIDATION.md');
  console.log('- CONFIGURATION-SUPABASE-IMMEDIATE.md');
  console.log('- CONFIGURATION_CLES_API.md');
  
  return results;
};

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  testDashboardComplet().catch(console.error);
}

export { testDashboardComplet };
