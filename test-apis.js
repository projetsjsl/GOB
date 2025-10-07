// Script de test pour les APIs améliorées
const API_BASE_URL = 'http://localhost:3000'; // Ajustez selon votre environnement

async function testAPI(endpoint, description) {
    console.log(`\n🧪 Test: ${description}`);
    console.log(`📍 Endpoint: ${endpoint}`);
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        const data = await response.json();
        
        if (response.ok) {
            console.log(`✅ Succès (${response.status})`);
            console.log(`📊 Données reçues:`, {
                type: typeof data,
                hasData: !!data.data || !!data.articles || !!data.apis,
                source: data.source || 'unknown',
                message: data.message || 'no message'
            });
            
            if (data.articles) {
                console.log(`📰 Articles: ${data.articles.length}`);
            }
            if (data.apis) {
                console.log(`🔌 APIs: ${Object.keys(data.apis).length}`);
            }
        } else {
            console.log(`❌ Erreur (${response.status})`);
            console.log(`📝 Détails:`, data);
        }
    } catch (error) {
        console.log(`💥 Exception:`, error.message);
    }
}

async function runTests() {
    console.log('🚀 Démarrage des tests des APIs améliorées\n');
    
    // Test API Status
    await testAPI('/api/status', 'Statut des APIs (sans test)');
    await testAPI('/api/status?test=true', 'Statut des APIs (avec test)');
    
    // Test API News
    await testAPI('/api/news?q=CVS OR MSFT&limit=5', 'API News multi-sources');
    
    // Test API Finnhub
    await testAPI('/api/finnhub?endpoint=quote&symbol=AAPL', 'API Finnhub - Quote');
    await testAPI('/api/finnhub?endpoint=profile&symbol=MSFT', 'API Finnhub - Profile');
    await testAPI('/api/finnhub?endpoint=news&symbol=CVS', 'API Finnhub - News');
    
    // Test API Fallback
    await testAPI('/api/fallback?type=stock&symbol=AAPL', 'API Fallback - Stock');
    await testAPI('/api/fallback?type=news&limit=3', 'API Fallback - News');
    await testAPI('/api/fallback?type=market', 'API Fallback - Market');
    await testAPI('/api/fallback?type=search&symbol=MSFT', 'API Fallback - Search');
    
    console.log('\n🎉 Tests terminés !');
    console.log('\n📋 Résumé des améliorations:');
    console.log('✅ API News: Multi-sources avec déduplication');
    console.log('✅ API Finnhub: 10+ endpoints avec données démo');
    console.log('✅ API Fallback: Données de secours robustes');
    console.log('✅ API Status: Vérification des APIs');
    console.log('✅ Gestion d\'erreurs: Fallbacks automatiques');
}

// Exécuter les tests si le script est appelé directement
if (typeof window === 'undefined') {
    runTests().catch(console.error);
}

module.exports = { testAPI, runTests };
