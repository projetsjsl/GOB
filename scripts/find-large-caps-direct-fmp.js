/**
 * Script alternatif pour trouver des large caps directement via FMP API
 * (Sans passer par nos endpoints, au cas où ils ne seraient pas encore déployés)
 * 
 * Date: 6 décembre 2025
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const FMP_KEY = process.env.FMP_API_KEY || process.env.FMP_KEY;
const FMP_BASE = 'https://financialmodelingprep.com/api/v3';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis');
    process.exit(1);
}

if (!FMP_KEY) {
    console.error('❌ FMP_API_KEY doit être défini');
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

async function findLargeCapsDirect(country = 'US', limit = 200) {
    try {
        console.log(`🔍 Recherche directe de large caps (${country}) via FMP API...`);
        
        const screenerUrl = `${FMP_BASE}/stock-screener?marketCapMoreThan=${LARGE_CAP_THRESHOLD}&country=${country}&isETF=false&isActivelyTrading=true&limit=${limit}&apikey=${FMP_KEY}`;
        
        const response = await fetch(screenerUrl);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 200)}`);
        }

        const data = await response.json();
        
        // Vérifier si c'est un objet d'erreur
        if (data && typeof data === 'object' && !Array.isArray(data)) {
            if (data['Error Message']) {
                throw new Error(data['Error Message']);
            }
        }

        if (!Array.isArray(data)) {
            throw new Error('Invalid response format');
        }

        return data;
    } catch (error) {
        console.error(`❌ Erreur lors de la recherche de large caps:`, error.message);
        return [];
    }
}

async function getCompanyDetailsDirect(symbol) {
    try {
        // Récupérer le profil
        const profileRes = await fetch(`${FMP_BASE}/profile/${symbol}?apikey=${FMP_KEY}`);
        if (!profileRes.ok) {
            return null;
        }
        const profileData = await profileRes.json();
        if (!Array.isArray(profileData) || profileData.length === 0) {
            return null;
        }
        const profile = profileData[0];

        // Exclure les ETF et fonds mutuels
        const name = (profile.companyName || '').toLowerCase();
        const isETF = profile.isETF === true || name.includes('etf') || name.includes('exchange traded fund');
        const isMutualFund = name.includes('mutual fund') || name.includes('index fund') || 
                            name.includes('vanguard') || name.includes('fidelity') || 
                            name.includes('blackrock') || name.includes('ishares');
        
        if (isETF || isMutualFund) {
            return { isETF: true, isMutualFund: true };
        }

        // Récupérer les key metrics (pour vérifier les données historiques)
        const metricsRes = await fetch(`${FMP_BASE}/key-metrics/${symbol}?period=annual&limit=5&apikey=${FMP_KEY}`);
        let metricsData = [];
        if (metricsRes.ok) {
            const data = await metricsRes.json();
            if (Array.isArray(data)) {
                metricsData = data;
            }
        }

        return {
            info: {
                symbol: profile.symbol,
                name: profile.companyName,
                sector: profile.sector,
                country: profile.country,
                exchange: profile.exchangeShortName || profile.exchange,
                currency: profile.currency || 'USD'
            },
            currentPrice: profile.price || 0,
            yearsOfData: metricsData.length
        };
    } catch (error) {
        console.warn(`⚠️  Erreur récupération détails pour ${symbol}:`, error.message);
        return null;
    }
}

async function addTickerToSupabase(ticker, companyData) {
    try {
        const info = companyData.info;
        const currentPrice = companyData.currentPrice || 0;
        const yearsOfData = companyData.yearsOfData || 0;

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
            industry: null,
            country: info.country || 'US',
            exchange: info.exchange || null,
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
    console.log('║  RECHERCHE ET AJOUT DE LARGE CAPS (DIRECT FMP API)        ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    // 1. Récupérer les tickers existants
    console.log('📖 Étape 1: Récupération des tickers existants depuis Supabase...');
    const existingTickers = await getExistingTickers();
    console.log(`✅ ${existingTickers.size} tickers existants trouvés\n`);

    // 2. Rechercher des large caps US (exclure ETF)
    console.log('📊 Étape 2: Recherche de large caps US (Market Cap > $10B, exclure ETF)...');
    const usLargeCapsRaw = await findLargeCapsDirect('US', 200);
    // Filtrer les ETF
    const usLargeCaps = usLargeCapsRaw.filter(stock => {
        const name = (stock.companyName || '').toLowerCase();
        return !stock.isETF && !name.includes('etf') && !name.includes('exchange traded fund') &&
               !name.includes('mutual fund') && !name.includes('index fund');
    });
    console.log(`✅ ${usLargeCaps.length} large caps US trouvés (${usLargeCapsRaw.length - usLargeCaps.length} ETF exclus)\n`);

    // 3. Rechercher des large caps canadiens (exclure ETF)
    console.log('📊 Étape 3: Recherche de large caps canadiens (Market Cap > $10B, exclure ETF)...');
    const caLargeCapsRaw = await findLargeCapsDirect('CA', 100);
    // Filtrer les ETF
    const caLargeCaps = caLargeCapsRaw.filter(stock => {
        const name = (stock.companyName || '').toLowerCase();
        return !stock.isETF && !name.includes('etf') && !name.includes('exchange traded fund') &&
               !name.includes('mutual fund') && !name.includes('index fund');
    });
    console.log(`✅ ${caLargeCaps.length} large caps canadiens trouvés (${caLargeCapsRaw.length - caLargeCaps.length} ETF exclus)\n`);

    // 4. Filtrer les tickers manquants et ne garder que les symboles principaux
    // Exclure les suffixes de bourses étrangères (.BA, .MX, .NE, .L, .KQ, etc.)
    const excludedSuffixes = ['.BA', '.MX', '.NE', '.L', '.KQ', '.T', '.HK', '.SS', '.SZ'];
    const allLargeCaps = [...usLargeCaps, ...caLargeCaps];
    const missingTickers = allLargeCaps.filter(stock => {
        const symbol = stock.symbol.toUpperCase();
        // Exclure si le symbole a un suffixe de bourse étrangère
        if (excludedSuffixes.some(suffix => symbol.endsWith(suffix))) {
            return false;
        }
        // Exclure si déjà dans Supabase
        if (existingTickers.has(symbol)) {
            return false;
        }
        // Pour les US: garder seulement les symboles sans suffixe de bourse
        // Pour les CA: garder seulement .TO ou sans suffixe
        const country = stock.country || 'US';
        if (country === 'US') {
            // US: pas de suffixe de bourse (sauf .A, .B pour classes)
            return !symbol.includes('.') || symbol.endsWith('.A') || symbol.endsWith('.B');
        } else if (country === 'CA') {
            // CA: .TO ou sans suffixe
            return symbol.endsWith('.TO') || !symbol.includes('.');
        }
        return true;
    });

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

    // 6. Limiter aux top 30 pour éviter trop de requêtes
    const topMissingTickers = missingTickers.slice(0, 30);
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
        const companyData = await getCompanyDetailsDirect(symbol);
        
        if (!companyData) {
            console.log(`   ⚠️  Impossible de récupérer les détails pour ${symbol}`);
            results.failed.push({ symbol, reason: 'No company data' });
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
        }

        // Vérifier que ce n'est pas un ETF ou fonds mutuel
        if (companyData.isETF || companyData.isMutualFund) {
            console.log(`   ⏭️  ${symbol} est un ETF/fonds mutuel, skip`);
            results.skipped.push({ symbol, reason: 'ETF or mutual fund' });
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
        }

        // Vérifier que les données sont valides
        if (companyData.yearsOfData === 0) {
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

