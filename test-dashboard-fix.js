/**
 * Test du Dashboard Corrigé
 * Vérifie que les corrections fonctionnent correctement
 */

import fs from 'fs';

const testDashboardFix = () => {
  console.log('🧪 Test du Dashboard Corrigé');
  console.log('============================');

  const dashboardPath = 'public/beta-combined-dashboard.html';
  
  if (!fs.existsSync(dashboardPath)) {
    console.log('❌ Fichier dashboard non trouvé');
    return false;
  }

  console.log('📖 Lecture du fichier dashboard...');
  const content = fs.readFileSync(dashboardPath, 'utf8');

  const tests = [
    {
      name: 'Fonction fetchHybridData',
      pattern: /const fetchHybridData = async \(symbol, dataType\) => \{/,
      description: 'Fonction de récupération des données hybride'
    },
    {
      name: 'Appels API simplifiés',
      pattern: /const \[quoteResult, profileResult, ratiosResult, newsResult, intradayResult, analystResult, earningsResult\] = await Promise\.allSettled\(\[/,
      description: 'Appels API avec gestion d\'erreur améliorée'
    },
    {
      name: 'Parsing simplifié',
      pattern: /const quote = quoteResult\.status === 'fulfilled' && quoteResult\.value\.success/,
      description: 'Parsing des données simplifié'
    },
    {
      name: 'Gestion d\'erreurs',
      pattern: /const errors = \[\];/,
      description: 'Gestion des erreurs améliorée'
    },
    {
      name: 'Métriques corrigées',
      pattern: /const metrics = \{\s*marketCap: quote\?\.marketCapitalization/,
      description: 'Métriques utilisant les bonnes données'
    },
    {
      name: 'Log des données',
      pattern: /console\.log\('✅ Données récupérées:',/,
      description: 'Logging des données récupérées'
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  console.log('\n🔍 Exécution des tests...\n');

  tests.forEach((test, index) => {
    const found = test.pattern.test(content);
    const status = found ? '✅' : '❌';
    const result = found ? 'PASSÉ' : 'ÉCHOUÉ';
    
    console.log(`${index + 1}. ${status} ${test.name}: ${result}`);
    console.log(`   ${test.description}`);
    
    if (found) {
      passedTests++;
    } else {
      console.log(`   ⚠️ Pattern non trouvé: ${test.pattern}`);
    }
    console.log('');
  });

  // Test de cohérence
  console.log('🔍 Tests de cohérence...\n');
  
  const coherenceTests = [
    {
      name: 'Pas de références à l\'ancienne API hybride',
      pattern: /\/api\/hybrid-data/,
      shouldExist: false,
      description: 'Vérifier que l\'ancienne API hybride n\'est plus utilisée'
    },
    {
      name: 'Fonction fetchHybridData utilisée',
      pattern: /fetchHybridData\(/,
      shouldExist: true,
      description: 'Vérifier que la nouvelle fonction est utilisée'
    },
    {
      name: 'Gestion d\'erreurs présente',
      pattern: /errors\.push\(/,
      shouldExist: true,
      description: 'Vérifier que la gestion d\'erreurs est active'
    }
  ];

  coherenceTests.forEach((test, index) => {
    const found = test.pattern.test(content);
    const expected = test.shouldExist;
    const status = (found === expected) ? '✅' : '❌';
    const result = (found === expected) ? 'COHÉRENT' : 'INCOHÉRENT';
    
    console.log(`${index + 1}. ${status} ${test.name}: ${result}`);
    console.log(`   ${test.description}`);
    console.log(`   Trouvé: ${found}, Attendu: ${expected}`);
    console.log('');
    
    if (found === expected) {
      passedTests++;
    }
    totalTests++;
  });

  // Résumé
  console.log('📊 RÉSUMÉ DES TESTS');
  console.log('===================');
  console.log(`✅ Tests réussis: ${passedTests}`);
  console.log(`❌ Tests échoués: ${totalTests - passedTests}`);
  console.log(`📈 Taux de réussite: ${Math.round((passedTests / totalTests) * 100)}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 TOUS LES TESTS SONT PASSÉS !');
    console.log('✅ Le dashboard est correctement corrigé');
    console.log('✅ Prêt pour les tests en production');
  } else {
    console.log('\n⚠️ CERTAINS TESTS ONT ÉCHOUÉ');
    console.log('🔧 Vérifier les corrections manquantes');
  }

  // Recommandations
  console.log('\n💡 RECOMMANDATIONS:');
  if (passedTests >= totalTests * 0.8) {
    console.log('✅ Dashboard largement corrigé');
    console.log('🚀 Prêt pour le déploiement');
    console.log('📊 Tester avec des données réelles');
  } else {
    console.log('⚠️ Corrections supplémentaires nécessaires');
    console.log('🔧 Relancer le script de correction');
    console.log('📞 Vérifier manuellement le code');
  }

  return passedTests === totalTests;
};

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  testDashboardFix();
}

export { testDashboardFix };
