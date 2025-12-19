/**
 * Script de test pour l'endpoint batch de synchronisation FMP
 * Teste /api/fmp-company-data-batch-sync avec plusieurs tickers
 */

const API_BASE_URL = process.env.API_BASE_URL || 'https://gobapps.com';

// Liste de tickers de test (mélange de US et Canadiens)
const TEST_TICKERS = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA',  // US majors
    'TD', 'BNS', 'BMO', 'RY', 'CNR',          // Canadiens
    'BMY', 'AXS', 'UNH', 'JPM', 'VZ'          // US autres
];

async function testBatchEndpoint() {
    console.log('🧪 Test de l\'endpoint batch de synchronisation FMP\n');
    console.log(`📍 URL de base: ${API_BASE_URL}`);
    console.log(`📋 Tickers à tester: ${TEST_TICKERS.length} (${TEST_TICKERS.join(', ')})\n`);

    try {
        const symbolString = TEST_TICKERS.join(',');
        const url = `${API_BASE_URL}/api/fmp-company-data-batch-sync?symbols=${encodeURIComponent(symbolString)}&limit=20`;
        
        console.log(`🔗 URL: ${url}\n`);
        console.log('⏳ Envoi de la requête...\n');

        const startTime = Date.now();
        const response = await fetch(url);
        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log(`📊 Statut HTTP: ${response.status} ${response.statusText}`);
        console.log(`⏱️  Durée: ${duration}ms\n`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erreur:', errorText);
            return;
        }

        const data = await response.json();

        console.log('✅ Réponse reçue:\n');
        console.log(`📈 Statistiques:`);
        console.log(`   - Total: ${data.stats?.total || 0}`);
        console.log(`   - Succès: ${data.stats?.success || 0}`);
        console.log(`   - Erreurs: ${data.stats?.errors || 0}\n`);

        if (data.results && Array.isArray(data.results)) {
            console.log('📋 Détails des résultats:\n');
            
            const successful = data.results.filter(r => r.success);
            const failed = data.results.filter(r => !r.success);

            if (successful.length > 0) {
                console.log(`✅ Tickers réussis (${successful.length}):`);
                successful.slice(0, 5).forEach(result => {
                    const info = result.data?.info;
                    const dataLength = result.data?.data?.length || 0;
                    const price = result.data?.currentPrice || 0;
                    console.log(`   - ${result.symbol}: ${info?.name || 'N/A'} | ${dataLength} années | Prix: $${price.toFixed(2)}`);
                });
                if (successful.length > 5) {
                    console.log(`   ... et ${successful.length - 5} autres`);
                }
                console.log('');
            }

            if (failed.length > 0) {
                console.log(`❌ Tickers échoués (${failed.length}):`);
                failed.forEach(result => {
                    console.log(`   - ${result.symbol}: ${result.error || 'Erreur inconnue'}`);
                });
                console.log('');
            }

            // Vérifier la structure des données
            if (successful.length > 0) {
                const firstSuccess = successful[0];
                console.log('🔍 Structure des données (premier ticker réussi):');
                console.log(`   - Symbol: ${firstSuccess.symbol}`);
                console.log(`   - Has data: ${firstSuccess.data?.data ? 'Oui' : 'Non'}`);
                console.log(`   - Data length: ${firstSuccess.data?.data?.length || 0}`);
                console.log(`   - Has info: ${firstSuccess.data?.info ? 'Oui' : 'Non'}`);
                console.log(`   - Info name: ${firstSuccess.data?.info?.name || 'N/A'}`);
                console.log(`   - Current price: ${firstSuccess.data?.currentPrice || 0}`);
                console.log('');
            }
        }

        // Test de performance
        console.log('⚡ Performance:');
        console.log(`   - Durée totale: ${duration}ms`);
        console.log(`   - Tickers par seconde: ${(TEST_TICKERS.length / (duration / 1000)).toFixed(2)}`);
        console.log(`   - Temps moyen par ticker: ${(duration / TEST_TICKERS.length).toFixed(2)}ms\n`);

        // Comparaison avec appels individuels (estimation)
        const estimatedIndividualTime = TEST_TICKERS.length * 500; // ~500ms par appel individuel
        const speedup = (estimatedIndividualTime / duration).toFixed(2);
        console.log('📊 Comparaison (estimation):');
        console.log(`   - Appels individuels estimés: ~${estimatedIndividualTime}ms`);
        console.log(`   - Accélération: ${speedup}x plus rapide\n`);

        console.log('✅ Test terminé avec succès!');

    } catch (error) {
        console.error('❌ Erreur lors du test:', error.message);
        console.error(error.stack);
    }
}

// Exécuter le test
testBatchEndpoint().catch(console.error);

export { testBatchEndpoint };

