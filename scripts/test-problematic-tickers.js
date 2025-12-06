/**
 * Script de test pour les tickers problématiques avec FMP Premium
 * Teste la résolution automatique via FMP Search et fmp-company-data
 * 
 * Date: 6 décembre 2025
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const API_BASE_URL = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://gobapps.com'; // Fallback pour local development

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Tickers problématiques identifiés
const problematicTickers = [
    'BRK.B',
    'IFC',
    'GWO',
    'BBD.B',
    'GIB.A',
    'ATD.B',
    'MRU',
    'ABX',
    'TECK.B',
    'RCI.B',
    'EMA',
    'CCA',
    'POW'
];

async function testTicker(ticker) {
    console.log(`\n🔍 Test de ${ticker}...`);
    
    try {
        // 1. Test FMP Search
        console.log(`   📡 Test FMP Search...`);
        let searchSuccess = false;
        let searchResults = [];
        try {
            const searchRes = await fetch(`${API_BASE_URL}/api/fmp-search?query=${encodeURIComponent(ticker)}`);
            if (searchRes.ok) {
                const searchData = await searchRes.json();
                if (searchData && Array.isArray(searchData.results)) {
                    searchResults = searchData.results;
                    searchSuccess = searchResults.length > 0;
                    console.log(`   ✅ FMP Search: ${searchResults.length} résultat(s) trouvé(s)`);
                    if (searchResults.length > 0) {
                        console.log(`      → Meilleur match: ${searchResults[0].symbol} (${searchResults[0].name})`);
                    }
                } else {
                    console.log(`   ⚠️  FMP Search: Format de réponse inattendu`);
                }
            } else {
                console.log(`   ❌ FMP Search failed: ${searchRes.status}`);
            }
        } catch (error) {
            console.log(`   ⚠️  FMP Search error: ${error.message}`);
        }

        // 2. Test fmp-company-data
        console.log(`   📡 Test fmp-company-data...`);
        const companyRes = await fetch(`${API_BASE_URL}/api/fmp-company-data?symbol=${encodeURIComponent(ticker)}`);
        if (!companyRes.ok) {
            const errorText = await companyRes.text();
            console.log(`   ❌ fmp-company-data failed: ${companyRes.status} - ${errorText.substring(0, 100)}`);
            return { 
                ticker, 
                searchSuccess: searchSuccess,
                companySuccess: false, 
                companyError: `${companyRes.status}: ${errorText.substring(0, 100)}`
            };
        }
        const companyData = await companyRes.json();
        
        if (companyData.error) {
            console.log(`   ❌ fmp-company-data error: ${companyData.error}`);
            return { 
                ticker, 
                searchSuccess: searchSuccess,
                companySuccess: false, 
                companyError: companyData.error
            };
        }

        const yearsOfData = companyData.data ? companyData.data.length : 0;
        const currentPrice = companyData.currentPrice || 0;
        const companyName = companyData.info?.name || 'N/A';
        const actualSymbol = companyData.info?.actualSymbol || ticker;

        console.log(`   ✅ fmp-company-data: ${yearsOfData} années de données, prix: $${currentPrice.toFixed(2)}`);
        console.log(`      → Symbole utilisé: ${actualSymbol}`);
        console.log(`      → Nom: ${companyName}`);

        return {
            ticker,
            searchSuccess: searchSuccess,
            companySuccess: true,
            yearsOfData,
            currentPrice,
            companyName,
            actualSymbol,
            info: companyData.info
        };

    } catch (error) {
        console.error(`   ❌ Erreur lors du test de ${ticker}:`, error.message);
        return { 
            ticker, 
            searchSuccess: false,
            companySuccess: false, 
            error: error.message 
        };
    }
}

async function main() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║  TEST DES TICKERS PROBLÉMATIQUES - FMP PREMIUM            ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    console.log(`🌐 API Base URL: ${API_BASE_URL}\n`);

    const results = [];
    
    for (const ticker of problematicTickers) {
        const result = await testTicker(ticker);
        results.push(result);
        
        // Délai entre les requêtes pour éviter le rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Résumé
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  RÉSUMÉ DES TESTS                                          ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    const searchSuccessCount = results.filter(r => r.searchSuccess).length;
    const companySuccessCount = results.filter(r => r.companySuccess).length;
    const totalSuccessCount = results.filter(r => r.searchSuccess && r.companySuccess).length;

    console.log(`📊 Statistiques globales:`);
    console.log(`   • Tickers testés: ${problematicTickers.length}`);
    console.log(`   • ✅ FMP Search réussi: ${searchSuccessCount} (${(searchSuccessCount / problematicTickers.length * 100).toFixed(1)}%)`);
    console.log(`   • ✅ fmp-company-data réussi: ${companySuccessCount} (${(companySuccessCount / problematicTickers.length * 100).toFixed(1)}%)`);
    console.log(`   • ✅ Les deux réussis: ${totalSuccessCount} (${(totalSuccessCount / problematicTickers.length * 100).toFixed(1)}%)\n`);

    // Détails par ticker
    console.log(`📋 Détails par ticker:\n`);
    results.forEach((result, index) => {
        const status = result.companySuccess ? '✅' : '❌';
        console.log(`   ${String(index + 1).padStart(2, ' ')}. ${status} ${result.ticker.padEnd(10)} - ${result.companySuccess ? `${result.yearsOfData} ans, $${result.currentPrice.toFixed(2)}` : result.companyError || result.error || 'Échec'}`);
        if (result.actualSymbol && result.actualSymbol !== result.ticker) {
            console.log(`       → Symbole résolu: ${result.actualSymbol}`);
        }
    });

    // Tickers à ajouter à Supabase
    const tickersToAdd = results.filter(r => r.companySuccess && r.currentPrice > 0);
    if (tickersToAdd.length > 0) {
        console.log(`\n📝 Tickers prêts à être ajoutés à Supabase (${tickersToAdd.length}):`);
        tickersToAdd.forEach(t => {
            console.log(`   • ${t.ticker} - ${t.companyName} (${t.yearsOfData} ans, $${t.currentPrice.toFixed(2)})`);
        });
    }

    // Tickers en échec
    const failedTickers = results.filter(r => !r.companySuccess);
    if (failedTickers.length > 0) {
        console.log(`\n⚠️  Tickers en échec (${failedTickers.length}):`);
        failedTickers.forEach(t => {
            console.log(`   • ${t.ticker} - ${t.companyError || t.error || 'Raison inconnue'}`);
        });
    }

    console.log('\n✅ Tests terminés!\n');
}

main().catch(error => {
    console.error('❌ Erreur fatale lors des tests:', error);
    process.exit(1);
});

