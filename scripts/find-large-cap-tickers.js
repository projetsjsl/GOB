/**
 * Script pour trouver et ajouter des large caps manquants via FMP Stock Screener Premium
 * 
 * Date: 6 décembre 2025
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const API_BASE_URL = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://gobapps.com';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Définition Large Cap: Market Cap > 10 milliards USD
const LARGE_CAP_THRESHOLD = 10000000000; // 10B USD

async function getExistingTickers() {
    try {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker')
            .eq('is_active', true);

        if (error) {
            throw new Error(`Supabase error: ${error.message}`);
        }

        return new Set((data || []).map(t => t.ticker.toUpperCase()));
    } catch (error) {
        throw new Error(`Erreur récupération tickers depuis Supabase: ${error.message}`);
    }
}

async function findLargeCaps(country = 'US', limit = 200) {
    try {
        console.log(`🔍 Recherche de large caps (${country})...`);
        
        const screenerUrl = `${API_BASE_URL}/api/fmp-stock-screener?marketCapMoreThan=${LARGE_CAP_THRESHOLD}&country=${country}&isETF=false&isActivelyTrading=true&limit=${limit}`;
        
        const response = await fetch(screenerUrl);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 200)}`);
        }

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        return data.results || [];
    } catch (error) {
        console.error(`❌ Erreur lors de la recherche de large caps:`, error.message);
        return [];
    }
}

async function getCompanyDetails(symbol) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/fmp-company-data?symbol=${encodeURIComponent(symbol)}`);
        if (!response.ok) {
            return null;
        }
        const data = await response.json();
        if (data.error || !data.info) {
            return null;
        }
        return data;
    } catch (error) {
        console.warn(`⚠️  Erreur récupération détails pour ${symbol}:`, error.message);
        return null;
    }
}

async function addTickerToSupabase(ticker, companyData) {
    try {
        const info = companyData.info;
        const currentPrice = companyData.currentPrice || 0;
        const yearsOfData = companyData.data ? companyData.data.length : 0;

        // Vérifier si le ticker existe déjà
        const { data: existing } = await supabase
            .from('tickers')
            .select('ticker')
            .eq('ticker', ticker)
            .single();

        if (existing) {
            console.log(`   ⏭️  ${ticker} existe déjà, skip`);
            return { success: false, reason: 'exists' };
        }

        // Préparer les données pour Supabase
        const tickerData = {
            ticker: ticker,
            company_name: info.name || 'N/A',
            sector: info.sector || null,
            industry: null, // Pas dans info actuellement
            country: info.country || country || 'US',
            exchange: info.exchange || info.exchangeShortName || null,
            currency: info.currency || 'USD',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('tickers')
            .insert(tickerData);

        if (error) {
            throw new Error(`Supabase insert error: ${error.message}`);
        }

        console.log(`   ✅ ${ticker} ajouté: ${info.name} (${yearsOfData} ans, $${currentPrice.toFixed(2)})`);
        return { success: true, ticker, companyName: info.name, yearsOfData, currentPrice };
    } catch (error) {
        console.error(`   ❌ Erreur ajout ${ticker} à Supabase:`, error.message);
        return { success: false, reason: error.message };
    }
}

async function main() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║  RECHERCHE ET AJOUT DE LARGE CAPS MANQUANTS                ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    console.log(`🌐 API Base URL: ${API_BASE_URL}\n`);

    // 1. Récupérer les tickers existants
    console.log('📖 Étape 1: Récupération des tickers existants depuis Supabase...');
    const existingTickers = await getExistingTickers();
    console.log(`✅ ${existingTickers.size} tickers existants trouvés\n`);

    // 2. Rechercher des large caps US
    console.log('📊 Étape 2: Recherche de large caps US (Market Cap > $10B)...');
    const usLargeCaps = await findLargeCaps('US', 200);
    console.log(`✅ ${usLargeCaps.length} large caps US trouvés\n`);

    // 3. Rechercher des large caps canadiens
    console.log('📊 Étape 3: Recherche de large caps canadiens (Market Cap > $10B)...');
    const caLargeCaps = await findLargeCaps('CA', 100);
    console.log(`✅ ${caLargeCaps.length} large caps canadiens trouvés\n`);

    // 4. Filtrer les tickers manquants
    const allLargeCaps = [...usLargeCaps, ...caLargeCaps];
    const missingTickers = allLargeCaps.filter(stock => 
        !existingTickers.has(stock.symbol.toUpperCase())
    );

    console.log(`📋 Étape 4: Filtrage des tickers manquants...`);
    console.log(`   • Total large caps trouvés: ${allLargeCaps.length}`);
    console.log(`   • Déjà dans Supabase: ${allLargeCaps.length - missingTickers.length}`);
    console.log(`   • Manquants à ajouter: ${missingTickers.length}\n`);

    if (missingTickers.length === 0) {
        console.log('✅ Aucun large cap manquant à ajouter!\n');
        return;
    }

    // 5. Trier par market cap (plus grand d'abord)
    missingTickers.sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));

    // 6. Limiter aux top 50 pour éviter trop de requêtes
    const topMissingTickers = missingTickers.slice(0, 50);
    console.log(`📊 Étape 5: Traitement des top ${topMissingTickers.length} large caps manquants...\n`);

    // 7. Ajouter les tickers manquants
    const results = {
        added: [],
        failed: [],
        skipped: []
    };

    for (let i = 0; i < topMissingTickers.length; i++) {
        const stock = topMissingTickers[i];
        const symbol = stock.symbol;
        
        console.log(`[${i + 1}/${topMissingTickers.length}] Traitement de ${symbol}...`);
        
        // Récupérer les détails complets
        const companyData = await getCompanyDetails(symbol);
        
        if (!companyData) {
            console.log(`   ⚠️  Impossible de récupérer les détails pour ${symbol}`);
            results.failed.push({ symbol, reason: 'No company data' });
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
        }

        // Vérifier que les données sont valides
        if (!companyData.data || companyData.data.length === 0) {
            console.log(`   ⚠️  ${symbol} n'a pas de données historiques`);
            results.failed.push({ symbol, reason: 'No historical data' });
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
        }

        if (companyData.currentPrice <= 0) {
            console.log(`   ⚠️  ${symbol} a un prix invalide`);
            results.failed.push({ symbol, reason: 'Invalid price' });
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
        }

        // Ajouter à Supabase
        const addResult = await addTickerToSupabase(symbol, companyData);
        
        if (addResult.success) {
            results.added.push(addResult);
        } else if (addResult.reason === 'exists') {
            results.skipped.push({ symbol, reason: 'exists' });
        } else {
            results.failed.push({ symbol, reason: addResult.reason });
        }

        // Délai entre les requêtes
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 8. Résumé
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  RÉSUMÉ DE L\'AJOUT                                        ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    console.log(`📊 Statistiques:`);
    console.log(`   • Tickers traités: ${topMissingTickers.length}`);
    console.log(`   • ✅ Ajoutés avec succès: ${results.added.length}`);
    console.log(`   • ⏭️  Ignorés (existent déjà): ${results.skipped.length}`);
    console.log(`   • ❌ Échecs: ${results.failed.length}\n`);

    if (results.added.length > 0) {
        console.log(`✅ Tickers ajoutés (${results.added.length}):`);
        results.added.forEach(t => {
            console.log(`   • ${t.ticker} - ${t.companyName} (${t.yearsOfData} ans, $${t.currentPrice.toFixed(2)})`);
        });
        console.log('');
    }

    if (results.failed.length > 0) {
        console.log(`❌ Tickers en échec (${results.failed.length}):`);
        results.failed.forEach(t => {
            console.log(`   • ${t.symbol} - ${t.reason}`);
        });
        console.log('');
    }

    console.log('✅ Processus terminé!\n');
}

main().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
});















