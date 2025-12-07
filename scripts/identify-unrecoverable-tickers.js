/**
 * Script pour identifier les tickers qui ne peuvent PAS être récupérés de FMP
 * même après tous les fallbacks et variantes de symboles
 * 
 * Ce script teste tous les tickers actifs et identifie ceux qui échouent définitivement
 * 
 * Usage: node scripts/identify-unrecoverable-tickers.js
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

/**
 * Teste si un ticker peut être récupéré depuis FMP
 */
async function testTickerRecovery(ticker) {
    const symbol = ticker.ticker.toUpperCase();
    
    try {
        // Appeler l'API fmp-company-data qui essaie tous les fallbacks
        const apiUrl = `${API_BASE_URL}/api/fmp-company-data?symbol=${encodeURIComponent(symbol)}`;
        const response = await fetch(apiUrl);

        // Si 404, le ticker n'existe pas dans FMP même après tous les fallbacks
        if (response.status === 404) {
            const errorData = await response.json().catch(() => ({}));
            return {
                ticker: symbol,
                companyName: ticker.company_name,
                sector: ticker.sector,
                source: ticker.source,
                recoverable: false,
                reason: '404 - Symbole introuvable dans FMP (tous fallbacks échoués)',
                triedSymbols: errorData.tried || [symbol],
                error: errorData.message || 'Not found'
            };
        }

        // Si autre erreur HTTP, c'est peut-être récupérable (rate limit, etc.)
        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            return {
                ticker: symbol,
                companyName: ticker.company_name,
                sector: ticker.sector,
                source: ticker.source,
                recoverable: 'unknown', // Peut-être récupérable (rate limit, etc.)
                reason: `HTTP ${response.status}`,
                error: errorText.substring(0, 200)
            };
        }

        // Si succès, vérifier que les données sont valides
        const data = await response.json();
        
        if (data.error) {
            return {
                ticker: symbol,
                companyName: ticker.company_name,
                sector: ticker.sector,
                source: ticker.source,
                recoverable: false,
                reason: 'Erreur API',
                error: data.error
            };
        }

        // Vérifier que les données sont complètes
        const hasValidData = data.data && Array.isArray(data.data) && data.data.length > 0;
        const hasValidPrice = data.currentPrice && data.currentPrice > 0;
        const hasValidInfo = data.info && data.info.name;

        if (!hasValidData || !hasValidPrice || !hasValidInfo) {
            return {
                ticker: symbol,
                companyName: ticker.company_name,
                sector: ticker.sector,
                source: ticker.source,
                recoverable: false,
                reason: 'Données incomplètes ou invalides',
                dataYears: data.data?.length || 0,
                currentPrice: data.currentPrice || 0,
                hasInfo: !!data.info
            };
        }

        // Ticker récupérable avec succès
        return {
            ticker: symbol,
            companyName: ticker.company_name,
            sector: ticker.sector,
            source: ticker.source,
            recoverable: true,
            dataYears: data.data.length,
            currentPrice: data.currentPrice,
            actualSymbol: data.info.actualSymbol || symbol
        };

    } catch (error) {
        return {
            ticker: symbol,
            companyName: ticker.company_name,
            sector: ticker.sector,
            source: ticker.source,
            recoverable: 'unknown',
            reason: 'Erreur réseau ou exception',
            error: error.message
        };
    }
}

/**
 * Fonction principale
 */
async function main() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║  IDENTIFICATION DES TICKERS NON RÉCUPÉRABLES DE FMP        ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    console.log(`🌐 API Base URL: ${API_BASE_URL}\n`);

    // 1. Charger tous les tickers actifs
    console.log('📥 Chargement des tickers actifs depuis Supabase...');
    const { data: tickers, error: tickersError } = await supabase
        .from('tickers')
        .select('ticker, company_name, sector, source')
        .eq('is_active', true)
        .order('ticker');

    if (tickersError) {
        console.error('❌ Erreur Supabase:', tickersError.message);
        process.exit(1);
    }

    if (!tickers || tickers.length === 0) {
        console.log('⚠️  Aucun ticker actif trouvé');
        process.exit(0);
    }

    console.log(`✅ ${tickers.length} ticker(s) actif(s) trouvé(s)\n`);

    // 2. Tester chaque ticker
    console.log('🔍 Test de récupération depuis FMP...\n');
    const results = [];
    const unrecoverable = [];
    const recoverable = [];
    const unknown = [];

    for (let i = 0; i < tickers.length; i++) {
        const ticker = tickers[i];
        const progress = `[${i + 1}/${tickers.length}]`;
        
        process.stdout.write(`   ${progress} Test ${ticker.ticker}... `);
        
        const result = await testTickerRecovery(ticker);
        results.push(result);

        if (result.recoverable === false) {
            unrecoverable.push(result);
            console.log('❌ NON RÉCUPÉRABLE');
        } else if (result.recoverable === true) {
            recoverable.push(result);
            console.log(`✅ OK (${result.dataYears} ans)`);
        } else {
            unknown.push(result);
            console.log('⚠️  INCONNU');
        }

        // Délai pour éviter le rate limiting
        if (i < tickers.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }

    // 3. Générer le rapport
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  RAPPORT FINAL                                              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    console.log(`📊 Statistiques:`);
    console.log(`   • Total testé: ${tickers.length}`);
    console.log(`   • ✅ Récupérable: ${recoverable.length} (${(recoverable.length / tickers.length * 100).toFixed(1)}%)`);
    console.log(`   • ❌ NON RÉCUPÉRABLE: ${unrecoverable.length} (${(unrecoverable.length / tickers.length * 100).toFixed(1)}%)`);
    console.log(`   • ⚠️  Statut inconnu: ${unknown.length} (${(unknown.length / tickers.length * 100).toFixed(1)}%)\n`);

    // 4. Liste des tickers NON RÉCUPÉRABLES
    if (unrecoverable.length > 0) {
        console.log(`\n❌ TICKERS NON RÉCUPÉRABLES DE FMP (${unrecoverable.length}):\n`);
        console.log('Ces tickers ne peuvent PAS être récupérés depuis FMP, même après tous les fallbacks.\n');
        
        // Grouper par raison
        const byReason = {};
        unrecoverable.forEach(t => {
            const reason = t.reason || 'Raison inconnue';
            if (!byReason[reason]) {
                byReason[reason] = [];
            }
            byReason[reason].push(t);
        });

        Object.entries(byReason).forEach(([reason, tickers]) => {
            console.log(`\n📌 ${reason} (${tickers.length} ticker(s)):`);
            tickers.forEach((t, idx) => {
                console.log(`   ${String(idx + 1).padStart(3, ' ')}. ${t.ticker.padEnd(12)} - ${t.companyName || 'N/A'}`);
                if (t.sector) {
                    console.log(`        Secteur: ${t.sector}`);
                }
                if (t.triedSymbols && t.triedSymbols.length > 1) {
                    console.log(`        Symboles essayés: ${t.triedSymbols.join(', ')}`);
                }
                if (t.error) {
                    console.log(`        Erreur: ${t.error.substring(0, 100)}`);
                }
            });
        });

        // Export CSV
        console.log(`\n📄 Export CSV (copier-coller dans Excel):\n`);
        console.log('Ticker,Company Name,Sector,Source,Reason,Error');
        unrecoverable.forEach(t => {
            const csv = [
                t.ticker,
                `"${t.companyName || ''}"`,
                t.sector || '',
                t.source || '',
                `"${t.reason || ''}"`,
                `"${(t.error || '').replace(/"/g, '""')}"`
            ].join(',');
            console.log(csv);
        });
    } else {
        console.log('\n✅ Tous les tickers sont récupérables depuis FMP!\n');
    }

    // 5. Liste des tickers avec statut inconnu
    if (unknown.length > 0) {
        console.log(`\n⚠️  TICKERS AVEC STATUT INCONNU (${unknown.length}):\n`);
        console.log('Ces tickers ont rencontré des erreurs qui pourraient être temporaires.\n');
        unknown.forEach((t, idx) => {
            console.log(`   ${String(idx + 1).padStart(3, ' ')}. ${t.ticker.padEnd(12)} - ${t.companyName || 'N/A'}`);
            console.log(`        Raison: ${t.reason || 'Inconnue'}`);
            if (t.error) {
                console.log(`        Erreur: ${t.error.substring(0, 150)}`);
            }
        });
    }

    console.log('\n✅ Analyse terminée!\n');
}

main().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
});

