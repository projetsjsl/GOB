// ========================================
// TEST EMMA FUNCTION CALLING
// ========================================

// Test de la nouvelle API avec function calling
async function testEmmaFunctionCalling() {
  console.log('🧪 Test d\'Emma avec Function Calling');
  console.log('=====================================');

  const testCases = [
    {
      name: 'Prix d\'Apple',
      message: 'Quel est le prix actuel d\'Apple (AAPL) ?',
      expectedFunction: 'getStockPrice'
    },
    {
      name: 'Actualités récentes',
      message: 'Récupère les actualités récentes sur Tesla',
      expectedFunction: 'getNews'
    },
    {
      name: 'Profil d\'entreprise',
      message: 'Analyse le profil de Microsoft',
      expectedFunction: 'getCompanyProfile'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🔍 Test: ${testCase.name}`);
    console.log(`📝 Message: ${testCase.message}`);
    console.log(`🎯 Fonction attendue: ${testCase.expectedFunction}`);
    
    try {
      const response = await fetch('/api/gemini/chat-with-functions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: testCase.message }],
          temperature: 0.3,
          maxTokens: 4096
        })
      });

      if (!response.ok) {
        console.log(`❌ Erreur HTTP: ${response.status}`);
        continue;
      }

      const data = await response.json();
      
      console.log(`✅ Réponse reçue`);
      console.log(`📊 Fonctions exécutées: ${data.functionsExecuted?.join(', ') || 'Aucune'}`);
      console.log(`📝 Longueur de la réponse: ${data.response?.length || 0} caractères`);
      
      // Vérifier si la fonction attendue a été exécutée
      if (data.functionsExecuted?.includes(testCase.expectedFunction)) {
        console.log(`✅ Fonction ${testCase.expectedFunction} exécutée avec succès`);
      } else {
        console.log(`⚠️ Fonction ${testCase.expectedFunction} non exécutée`);
      }
      
      // Afficher un extrait de la réponse
      if (data.response) {
        const preview = data.response.substring(0, 200) + '...';
        console.log(`📄 Aperçu de la réponse: ${preview}`);
      }
      
    } catch (error) {
      console.log(`❌ Erreur: ${error.message}`);
    }
  }
}

// Test de l'API de statut
async function testApiStatus() {
  console.log('\n🔧 Test du statut des APIs');
  console.log('===========================');
  
  try {
    const response = await fetch('/api/status');
    const data = await response.json();
    
    console.log('📊 Statut des APIs:');
    Object.entries(data).forEach(([api, status]) => {
      const icon = status.available ? '✅' : '❌';
      console.log(`${icon} ${api}: ${status.available ? 'Disponible' : 'Indisponible'}`);
    });
    
  } catch (error) {
    console.log(`❌ Erreur lors du test du statut: ${error.message}`);
  }
}

// Exécuter les tests
if (typeof window !== 'undefined') {
  // Dans le navigateur
  window.testEmmaFunctionCalling = testEmmaFunctionCalling;
  window.testApiStatus = testApiStatus;
  console.log('🧪 Tests disponibles: testEmmaFunctionCalling() et testApiStatus()');
} else {
  // Dans Node.js
  testEmmaFunctionCalling().then(() => {
    return testApiStatus();
  }).catch(console.error);
}
