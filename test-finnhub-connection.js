// Script de test de connexion Finnhub
// Exécuter avec: node test-finnhub-connection.js

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

console.log('🔍 Test de connexion à l\'API Finnhub\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Vérifier si la clé API est configurée
if (!FINNHUB_API_KEY) {
    console.log('❌ ERREUR: Variable d\'environnement FINNHUB_API_KEY non configurée');
    console.log('\n📝 Pour configurer:');
    console.log('   1. Obtenez une clé API gratuite sur https://finnhub.io/');
    console.log('   2. Ajoutez la variable dans Vercel:');
    console.log('      Dashboard → Settings → Environment Variables');
    console.log('      Name: FINNHUB_API_KEY');
    console.log('      Value: votre_clé_api\n');
    process.exit(1);
}

console.log(`✅ Clé API configurée: ${FINNHUB_API_KEY.substring(0, 10)}...`);
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Fonction pour tester un symbole
async function testSymbol(symbol, description) {
    try {
        const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
        
        console.log(`📊 Test ${description} (${symbol})...`);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error) {
            console.log(`   ❌ ERREUR: ${data.error}`);
            return false;
        } else if (data.c && data.c > 0) {
            console.log(`   ✅ SUCCÈS`);
            console.log(`      Prix: $${data.c}`);
            console.log(`      Change: ${data.d > 0 ? '+' : ''}${data.d} (${data.dp > 0 ? '+' : ''}${data.dp}%)`);
            console.log(`      High: $${data.h} | Low: $${data.l}`);
            return true;
        } else {
            console.log(`   ⚠️ Réponse invalide:`, data);
            return false;
        }
    } catch (error) {
        console.log(`   ❌ Exception: ${error.message}`);
        return false;
    }
}

// Tester différents types de symboles
async function runTests() {
    console.log('🧪 Tests de différents symboles:\n');
    
    const tests = [
        // Actions régulières (devrait fonctionner)
        { symbol: 'AAPL', description: 'Apple Inc' },
        { symbol: 'MSFT', description: 'Microsoft Corp' },
        
        // Indices (peut ne pas fonctionner avec Finnhub gratuit)
        { symbol: '^GSPC', description: 'S&P 500 Index' },
        { symbol: '^IXIC', description: 'NASDAQ Composite' },
        { symbol: '^DJI', description: 'Dow Jones Industrial Average' },
        
        // Forex (peut nécessiter un plan payant)
        { symbol: 'OANDA:EUR_USD', description: 'EUR/USD Forex' },
        
        // Crypto (devrait fonctionner)
        { symbol: 'BINANCE:BTCUSDT', description: 'Bitcoin/USDT' }
    ];
    
    const results = [];
    
    for (const test of tests) {
        const success = await testSymbol(test.symbol, test.description);
        results.push({ ...test, success });
        console.log('');
        
        // Pause pour éviter les limites de taux
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📈 Résumé des tests:\n');
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    results.forEach(r => {
        const status = r.success ? '✅' : '❌';
        console.log(`   ${status} ${r.description} (${r.symbol})`);
    });
    
    console.log(`\n📊 ${successCount}/${totalCount} tests réussis`);
    
    if (successCount === 0) {
        console.log('\n❌ AUCUN test n\'a réussi!');
        console.log('   Possibles raisons:');
        console.log('   1. Clé API invalide ou expirée');
        console.log('   2. Limite de taux atteinte');
        console.log('   3. Plan gratuit avec accès limité aux symboles');
        console.log('\n💡 Recommandation:');
        console.log('   - Vérifiez votre clé API sur https://finnhub.io/dashboard');
        console.log('   - Consultez la documentation: https://finnhub.io/docs/api/quote');
    } else if (successCount < totalCount) {
        console.log('\n⚠️ Certains tests ont échoué');
        console.log('   Note: Le plan gratuit de Finnhub peut avoir des limitations');
        console.log('   sur les indices, forex et certains symboles spéciaux.');
        console.log('\n💡 Solutions:');
        console.log('   1. Utiliser des ETF au lieu d\'indices (SPY au lieu de ^GSPC)');
        console.log('   2. Utiliser Alpha Vantage pour les indices');
        console.log('   3. Passer à un plan payant Finnhub');
    } else {
        console.log('\n✅ TOUS les tests ont réussi!');
        console.log('   Finnhub est correctement configuré et fonctionnel.');
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Exécuter les tests
runTests().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
});

