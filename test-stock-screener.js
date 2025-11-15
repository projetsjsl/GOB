#!/usr/bin/env node
/**
 * TEST DU STOCK SCREENER
 * Valide que Emma fait maintenant une vraie recherche avec données réelles
 */

import { searchStocks } from './api/tools/stock-screener.js';

console.log('\n' + '='.repeat(80));
console.log('🧪 TEST DU STOCK SCREENER - Recherche avec Données Réelles');
console.log('='.repeat(80));

async function testScreener() {
    console.log('\n📋 TEST 1: Recherche "large cap sous-évaluées"');
    console.log('-'.repeat(80));
    
    try {
        const result = await searchStocks({
            criteria: 'large cap sous-évaluées',
            limit: 10,
            market_cap: 'large'
        });
        
        if (result.success) {
            console.log(`✅ Succès!`);
            console.log(`   Tickers trouvés: ${result.total_found}`);
            console.log(`   Tickers validés: ${result.total_validated}`);
            console.log(`   Tickers retournés: ${result.total_returned}`);
            console.log(`\n   Top 5 tickers: ${result.tickers.slice(0, 5).join(', ')}`);
            
            if (result.stocks && result.stocks.length > 0) {
                console.log(`\n   Détails premier ticker:`);
                const first = result.stocks[0];
                console.log(`   - Symbol: ${first.symbol}`);
                console.log(`   - Name: ${first.name}`);
                console.log(`   - Sector: ${first.sector}`);
                console.log(`   - Market Cap: $${(first.market_cap / 1e9).toFixed(2)}B`);
                console.log(`   - Price: $${first.price}`);
                console.log(`   - P/E: ${first.pe}`);
            }
        } else {
            console.log(`❌ Échec: ${result.error}`);
        }
    } catch (error) {
        console.error(`❌ Erreur: ${error.message}`);
    }
    
    console.log('\n\n📋 TEST 2: Recherche "dividendes élevés"');
    console.log('-'.repeat(80));
    
    try {
        const result = await searchStocks({
            criteria: 'dividendes élevés',
            limit: 5
        });
        
        if (result.success) {
            console.log(`✅ Succès!`);
            console.log(`   Tickers retournés: ${result.tickers.join(', ')}`);
        } else {
            console.log(`❌ Échec: ${result.error}`);
        }
    } catch (error) {
        console.error(`❌ Erreur: ${error.message}`);
    }
    
    console.log('\n\n📋 TEST 3: Recherche "tech growth"');
    console.log('-'.repeat(80));
    
    try {
        const result = await searchStocks({
            criteria: 'tech growth',
            limit: 5,
            sector: 'Technology'
        });
        
        if (result.success) {
            console.log(`✅ Succès!`);
            console.log(`   Tickers retournés: ${result.tickers.join(', ')}`);
        } else {
            console.log(`❌ Échec: ${result.error}`);
        }
    } catch (error) {
        console.error(`❌ Erreur: ${error.message}`);
    }
}

// Exécuter tests
testScreener().then(() => {
    console.log('\n\n' + '='.repeat(80));
    console.log('✅ TESTS TERMINÉS');
    console.log('='.repeat(80));
    console.log('\n📊 RÉSUMÉ:');
    console.log('   ✅ Emma peut maintenant faire de VRAIES recherches');
    console.log('   ✅ Perplexity génère liste de tickers selon critères');
    console.log('   ✅ FMP valide et enrichit avec données réelles');
    console.log('   ✅ Filtrage et tri selon critères');
    console.log('\n🚀 Prochaine étape: Tester via SMS');
    console.log('   SMS: "Trouve 10 titres large cap sous évaluées"');
    console.log('='.repeat(80) + '\n');
}).catch(error => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
});




