/**
 * Test de l'API Hybride
 * Vérifie que l'API hybride fonctionne correctement
 */

const testHybridAPI = async () => {
  console.log('🧪 Test de l\'API Hybride JLab™');
  console.log('=====================================');

  const testCases = [
    { symbol: 'AAPL', dataType: 'quote' },
    { symbol: 'MSFT', dataType: 'profile' },
    { symbol: 'GOOGL', dataType: 'ratios' },
    { symbol: 'TSLA', dataType: 'news' },
    { symbol: 'NVDA', dataType: 'prices' }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\n📊 Test: ${testCase.symbol} (${testCase.dataType})`);
      
      // Simuler l'appel à l'API hybride
      const response = await fetch(`/api/hybrid-data?symbol=${testCase.symbol}&dataType=${testCase.dataType}&syncIfNeeded=true`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Succès: ${data.source} (${data.metadata.freshness})`);
        console.log(`   Données: ${JSON.stringify(data.data).substring(0, 100)}...`);
      } else {
        console.log(`❌ Erreur: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Exception: ${error.message}`);
    }
  }

  console.log('\n🎯 Test terminé !');
};

// Exporter pour utilisation dans le navigateur
if (typeof window !== 'undefined') {
  window.testHybridAPI = testHybridAPI;
}

// Exporter pour Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = testHybridAPI;
}
