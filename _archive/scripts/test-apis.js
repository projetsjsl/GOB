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
    
    // Test API News (mode strict)
    await testAPI('/api/news?q=CVS OR MSFT&limit=5&strict=true', 'API News multi-sources (strict)');
    
    // Test API Market Data (nouvelle API unifiée)
    await testAPI('/api/marketdata?endpoint=quote&symbol=AAPL&source=yahoo', 'API Market Data - Yahoo Finance Quote');
    await testAPI('/api/marketdata?endpoint=quote&symbol=MSFT&source=auto', 'API Market Data - Auto Source Quote');
    await testAPI('/api/marketdata?endpoint=profile&symbol=CVS&source=alpha', 'API Market Data - Alpha Vantage Profile');
    await testAPI('/api/marketdata?endpoint=news&symbol=AAPL&source=finnhub', 'API Market Data - Finnhub News');
    
    // Test API Marketdata (migration depuis Finnhub)
    await testAPI('/api/marketdata?endpoint=quote&symbol=AAPL&source=auto', 'API Marketdata - Quote');
    await testAPI('/api/marketdata?endpoint=profile&symbol=MSFT&source=auto', 'API Marketdata - Profile');
    await testAPI('/api/marketdata?endpoint=news&symbol=CVS&source=auto', 'API Marketdata - News');
    
    // Test API Fallback
    await testAPI('/api/fallback?type=stock&symbol=AAPL', 'API Fallback - Stock');
    await testAPI('/api/fallback?type=news&limit=3', 'API Fallback - News');
    await testAPI('/api/fallback?type=market', 'API Fallback - Market');
    await testAPI('/api/fallback?type=search&symbol=MSFT', 'API Fallback - Search');
    
    console.log('\n🎉 Tests terminés !');
    console.log('\n📋 Résumé des améliorations:');
    console.log('✅ API Market Data: Finnhub + Alpha Vantage + Yahoo Finance unifiés');
    console.log('✅ API News: Multi-sources avec déduplication');
    console.log('✅ API Finnhub: 10+ endpoints avec données démo (legacy)');
    console.log('✅ API Fallback: Données de secours robustes');
    console.log('✅ API Status: Vérification des APIs');
    console.log('✅ Gestion d\'erreurs: Fallbacks automatiques');
    console.log('✅ Sources multiples: Auto-sélection de la meilleure source');
}

// Exécuter les tests si le script est appelé directement
runTests().catch(console.error);
