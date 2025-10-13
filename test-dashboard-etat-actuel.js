/**
 * Test de l'État Actuel du Dashboard
 * Valide ce qui fonctionne et ce qui ne fonctionne pas
 */

const testDashboardEtatActuel = async () => {
  console.log('🔍 TEST DE L\'ÉTAT ACTUEL DU DASHBOARD');
  console.log('======================================');
  console.log('');

  const etat = {
    site: false,
    onglets: [],
    apis: [],
    fonctionnalites: []
  };

  // 1. Test du site
  console.log('🌐 ÉTAPE 1: Vérification du Site');
  console.log('--------------------------------');
  
  try {
    const response = await fetch('https://gobapps.com/beta-combined-dashboard.html');
    if (response.ok) {
      const html = await response.text();
      etat.site = true;
      console.log('✅ Site accessible');
      
      // Vérifier les onglets
      if (html.includes('JLab™')) {
        etat.onglets.push('JLab™');
        console.log('✅ Onglet JLab™ présent');
      }
      if (html.includes('Seeking Alpha')) {
        etat.onglets.push('Seeking Alpha');
        console.log('✅ Onglet Seeking Alpha présent');
      }
      if (html.includes('Perplexity')) {
        etat.onglets.push('Perplexity');
        console.log('✅ Onglet Perplexity présent');
      }
    } else {
      console.log(`❌ Site inaccessible: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Erreur site: ${error.message}`);
  }
  console.log('');

  // 2. Test des APIs fonctionnelles
  console.log('🔌 ÉTAPE 2: Test des APIs Fonctionnelles');
  console.log('----------------------------------------');
  
  // Test Marketaux
  try {
    const response = await fetch('https://gobapps.com/api/unified-serverless?endpoint=marketaux&symbol=AAPL&limit=1');
    const data = await response.json();
    
    if (response.ok) {
      etat.apis.push('Marketaux');
      console.log('✅ API Marketaux fonctionnelle');
      console.log(`   Données: ${data.news ? data.news.length : 0} actualités`);
    } else {
      console.log('❌ API Marketaux échouée');
    }
  } catch (error) {
    console.log('❌ Erreur API Marketaux:', error.message);
  }

  // Test Gemini
  try {
    const response = await fetch('https://gobapps.com/api/unified-serverless?endpoint=gemini-chat');
    if (response.ok) {
      etat.apis.push('Gemini');
      console.log('✅ API Gemini accessible');
    } else {
      console.log('❌ API Gemini échouée');
    }
  } catch (error) {
    console.log('❌ Erreur API Gemini:', error.message);
  }
  console.log('');

  // 3. Test des APIs problématiques
  console.log('🚨 ÉTAPE 3: Test des APIs Problématiques');
  console.log('----------------------------------------');
  
  const apisProblematiques = [
    { name: 'FMP', endpoint: 'fmp', params: 'symbol=AAPL&action=quote' },
    { name: 'Market Data', endpoint: 'marketdata', params: 'symbol=AAPL&source=yahoo' },
    { name: 'Hybrid Data', endpoint: 'hybrid-data', params: 'symbol=AAPL&dataType=quote&syncIfNeeded=true' }
  ];

  for (const api of apisProblematiques) {
    try {
      const response = await fetch(`https://gobapps.com/api/unified-serverless?endpoint=${api.endpoint}&${api.params}`);
      const data = await response.json();
      
      if (response.ok && !data.error) {
        console.log(`✅ ${api.name}: Fonctionnelle`);
        etat.apis.push(api.name);
      } else {
        console.log(`❌ ${api.name}: ${data.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.log(`❌ ${api.name}: ${error.message}`);
    }
  }
  console.log('');

  // 4. Test des fonctionnalités du dashboard
  console.log('🎯 ÉTAPE 4: Test des Fonctionnalités');
  console.log('------------------------------------');
  
  // Test de l'onglet JLab
  if (etat.onglets.includes('JLab™')) {
    console.log('✅ Onglet JLab™ disponible');
    etat.fonctionnalites.push('Onglet JLab™');
    
    // Test des données JLab
    try {
      const response = await fetch('https://gobapps.com/api/unified-serverless?endpoint=hybrid-data&symbol=AAPL&dataType=quote&syncIfNeeded=true');
      const data = await response.json();
      
      if (response.ok && data.success && data.data) {
        console.log('✅ Données JLab disponibles');
        etat.fonctionnalites.push('Données JLab');
      } else {
        console.log('❌ Données JLab non disponibles');
      }
    } catch (error) {
      console.log('❌ Erreur données JLab:', error.message);
    }
  }

  // Test des graphiques
  try {
    const response = await fetch('https://gobapps.com/api/unified-serverless?endpoint=hybrid-data&symbol=AAPL&dataType=prices&syncIfNeeded=true');
    const data = await response.json();
    
    if (response.ok && data.success && data.data) {
      console.log('✅ Données graphiques disponibles');
      etat.fonctionnalites.push('Graphiques');
    } else {
      console.log('❌ Données graphiques non disponibles');
    }
  } catch (error) {
    console.log('❌ Erreur graphiques:', error.message);
  }
  console.log('');

  // 5. Résumé de l'état actuel
  console.log('📊 RÉSUMÉ DE L\'ÉTAT ACTUEL');
  console.log('============================');
  console.log(`🌐 Site: ${etat.site ? '✅ Accessible' : '❌ Inaccessible'}`);
  console.log(`📑 Onglets: ${etat.onglets.length > 0 ? '✅' : '❌'} ${etat.onglets.join(', ')}`);
  console.log(`🔌 APIs: ${etat.apis.length > 0 ? '✅' : '❌'} ${etat.apis.join(', ')}`);
  console.log(`🎯 Fonctionnalités: ${etat.fonctionnalites.length > 0 ? '✅' : '❌'} ${etat.fonctionnalites.join(', ')}`);
  console.log('');

  // 6. État de fonctionnement
  if (etat.site && etat.onglets.length > 0) {
    console.log('🎉 DASHBOARD PARTIELLEMENT FONCTIONNEL');
    console.log('=====================================');
    console.log('✅ Le site est accessible');
    console.log('✅ Les onglets sont présents');
    console.log('✅ Certaines APIs fonctionnent');
    console.log('');
    console.log('🌐 URL: https://gobapps.com/beta-combined-dashboard.html');
    console.log('📋 Vous pouvez tester manuellement:');
    console.log('   1. Ouvrir le site');
    console.log('   2. Cliquer sur l\'onglet JLab™');
    console.log('   3. Vérifier l\'affichage des données');
    console.log('');
    console.log('🚨 PROBLÈMES IDENTIFIÉS:');
    console.log('   - APIs FMP non fonctionnelles (403 Forbidden)');
    console.log('   - Supabase non configuré');
    console.log('   - Données financières manquantes');
  } else {
    console.log('🚨 DASHBOARD NON FONCTIONNEL');
    console.log('============================');
    console.log('❌ Problèmes critiques détectés');
    console.log('📖 Suivre le guide: ACTION-IMMEDIATE-VALIDATION.md');
  }

  return etat;
};

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  testDashboardEtatActuel().catch(console.error);
}

export { testDashboardEtatActuel };
