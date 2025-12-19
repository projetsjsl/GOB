/**
 * Script pour analyser les 7 tickers ignorés lors de la synchronisation
 * et proposer une recommandation (garder/enlever)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables d\'environnement Supabase manquantes');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const IGNORED_TICKERS = [
    'CCLB.TO',
    'CTCA.TO',
    'EMPA.TO',
    'GIBA.TO',
    'MOGA',
    'RCIB.TO',
    'BFB'
];

async function analyzeTicker(ticker) {
    console.log(`\n📊 Analyse de ${ticker}:`);
    console.log('─'.repeat(50));
    
    // 1. Vérifier dans Supabase
    const { data: tickerData, error: tickerError } = await supabase
        .from('tickers')
        .select('*')
        .eq('symbol', ticker)
        .single();
    
    if (tickerError && tickerError.code !== 'PGRST116') {
        console.error(`  ❌ Erreur Supabase: ${tickerError.message}`);
        return null;
    }
    
    if (!tickerData) {
        console.log(`  ⚠️  Non trouvé dans Supabase`);
        return { ticker, inSupabase: false, recommendation: 'ENLEVER' };
    }
    
    console.log(`  ✅ Trouvé dans Supabase:`);
    console.log(`     - ID: ${tickerData.id}`);
    console.log(`     - Nom: ${tickerData.name || 'N/A'}`);
    console.log(`     - Actif: ${tickerData.is_active ? 'Oui' : 'Non'}`);
    console.log(`     - Watchlist: ${tickerData.is_watchlist ? 'Oui' : 'Non'}`);
    console.log(`     - Créé: ${tickerData.created_at || 'N/A'}`);
    
    // 2. Vérifier les données ValueLine
    const { data: valueLineData, error: vlError } = await supabase
        .from('tickers')
        .select('security_rank, earnings_predictability, beta, dividend_yield')
        .eq('symbol', ticker)
        .single();
    
    const hasValueLineData = valueLineData && (
        valueLineData.security_rank !== null ||
        valueLineData.earnings_predictability !== null ||
        valueLineData.beta !== null ||
        valueLineData.dividend_yield !== null
    );
    
    if (hasValueLineData) {
        console.log(`  ✅ Données ValueLine présentes:`);
        if (valueLineData.security_rank) console.log(`     - Security Rank: ${valueLineData.security_rank}`);
        if (valueLineData.earnings_predictability) console.log(`     - Earnings Predictability: ${valueLineData.earnings_predictability}`);
        if (valueLineData.beta) console.log(`     - Beta: ${valueLineData.beta}`);
        if (valueLineData.dividend_yield) console.log(`     - Dividend Yield: ${valueLineData.dividend_yield}`);
    } else {
        console.log(`  ⚠️  Aucune donnée ValueLine`);
    }
    
    // 3. Vérifier les snapshots
    const { count: snapshotCount, error: snapError } = await supabase
        .from('finance_snapshots')
        .select('*', { count: 'exact', head: true })
        .eq('ticker', ticker);
    
    if (!snapError && snapshotCount > 0) {
        console.log(`  ✅ ${snapshotCount} snapshot(s) trouvé(s)`);
    } else {
        console.log(`  ⚠️  Aucun snapshot`);
    }
    
    // 4. Vérifier dans watchlists
    const { data: watchlistData, error: watchError } = await supabase
        .from('watchlist_instruments')
        .select('watchlist_id')
        .eq('instrument_symbol', ticker);
    
    if (!watchError && watchlistData && watchlistData.length > 0) {
        console.log(`  ✅ Présent dans ${watchlistData.length} watchlist(s)`);
    } else {
        console.log(`  ⚠️  Non présent dans une watchlist`);
    }
    
    // 5. Recommandation
    let recommendation = 'GARDER';
    let reason = '';
    
    if (!tickerData.is_active) {
        recommendation = 'ENLEVER';
        reason = 'Ticker inactif';
    } else if (!hasValueLineData && snapshotCount === 0 && (!watchlistData || watchlistData.length === 0)) {
        recommendation = 'ENLEVER';
        reason = 'Aucune donnée utile (pas de ValueLine, pas de snapshot, pas dans watchlist)';
    } else if (hasValueLineData || snapshotCount > 0) {
        recommendation = 'GARDER';
        reason = 'Données ValueLine ou snapshots présents';
    } else if (watchlistData && watchlistData.length > 0) {
        recommendation = 'GARDER';
        reason = 'Présent dans une watchlist';
    }
    
    return {
        ticker,
        inSupabase: true,
        isActive: tickerData.is_active,
        hasValueLineData,
        snapshotCount: snapshotCount || 0,
        watchlistCount: watchlistData?.length || 0,
        recommendation,
        reason
    };
}

async function main() {
    console.log('🔍 Analyse des 7 tickers ignorés lors de la synchronisation\n');
    console.log('='.repeat(60));
    
    const results = [];
    
    for (const ticker of IGNORED_TICKERS) {
        const result = await analyzeTicker(ticker);
        if (result) {
            results.push(result);
        }
    }
    
    // Résumé
    console.log('\n\n📋 RÉSUMÉ ET RECOMMANDATIONS');
    console.log('='.repeat(60));
    
    const toRemove = results.filter(r => r.recommendation === 'ENLEVER');
    const toKeep = results.filter(r => r.recommendation === 'GARDER');
    
    console.log(`\n✅ À GARDER (${toKeep.length}):`);
    toKeep.forEach(r => {
        console.log(`   - ${r.ticker}: ${r.reason}`);
    });
    
    console.log(`\n❌ À ENLEVER (${toRemove.length}):`);
    toRemove.forEach(r => {
        console.log(`   - ${r.ticker}: ${r.reason}`);
    });
    
    // Générer script SQL pour enlever les tickers recommandés
    if (toRemove.length > 0) {
        console.log(`\n\n📝 Script SQL pour enlever les tickers recommandés:`);
        console.log('─'.repeat(60));
        console.log('-- Désactiver les tickers introuvables dans FMP');
        toRemove.forEach(r => {
            console.log(`UPDATE tickers SET is_active = false WHERE symbol = '${r.ticker}';`);
        });
    }
    
    console.log('\n✅ Analyse terminée');
}

main().catch(console.error);

