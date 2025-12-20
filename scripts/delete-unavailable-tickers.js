#!/usr/bin/env node
/**
 * Script pour supprimer les tickers non disponibles sur FMP de toutes les tables Supabase
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
);

const tickersToDelete = ['CCLB.TO', 'CTCA.TO', 'EMPA.TO', 'GIBA.TO', 'RCIB.TO'];

async function deleteUnavailableTickers() {
    console.log('🗑️  Suppression des 5 tickers non disponibles sur FMP...\n');

    for (const ticker of tickersToDelete) {
        console.log(`\n📍 ${ticker}:`);

        // 1. Supprimer de finance_pro_snapshots
        const { data: snapshots, error: snapshotError } = await supabase
            .from('finance_pro_snapshots')
            .delete()
            .eq('ticker', ticker)
            .select('id');

        if (snapshotError) {
            console.log(`   ❌ Erreur finance_pro_snapshots: ${snapshotError.message}`);
        } else {
            console.log(`   ✅ finance_pro_snapshots: ${snapshots ? snapshots.length : 0} supprimé(s)`);
        }

        // 2. Supprimer de watchlist
        const { data: watchlist, error: watchlistError } = await supabase
            .from('watchlist')
            .delete()
            .eq('symbol', ticker)
            .select('id');

        if (watchlistError) {
            console.log(`   ❌ Erreur watchlist: ${watchlistError.message}`);
        } else {
            console.log(`   ✅ watchlist: ${watchlist ? watchlist.length : 0} supprimé(s)`);
        }

        // 3. Supprimer de master_tickers si existe
        const { data: masterTickers, error: masterError } = await supabase
            .from('master_tickers')
            .delete()
            .eq('symbol', ticker)
            .select('id');

        if (masterError && !masterError.message.includes('does not exist')) {
            console.log(`   ❌ Erreur master_tickers: ${masterError.message}`);
        } else if (masterTickers) {
            console.log(`   ✅ master_tickers: ${masterTickers ? masterTickers.length : 0} supprimé(s)`);
        }
    }

    console.log('\n✅ Suppression terminée!');

    // Vérifier qu'ils sont bien supprimés
    console.log('\n📊 Vérification...');
    const { data: remaining, error } = await supabase
        .from('finance_pro_snapshots')
        .select('ticker')
        .in('ticker', tickersToDelete);

    if (remaining && remaining.length > 0) {
        console.log(`⚠️  Encore présents: ${remaining.map(r => r.ticker).join(', ')}`);
    } else {
        console.log('✅ Tous les tickers ont été supprimés de finance_pro_snapshots');
    }

    // Vérifier watchlist
    const { data: remainingWatchlist } = await supabase
        .from('watchlist')
        .select('symbol')
        .in('symbol', tickersToDelete);

    if (remainingWatchlist && remainingWatchlist.length > 0) {
        console.log(`⚠️  Encore dans watchlist: ${remainingWatchlist.map(r => r.symbol).join(', ')}`);
    } else {
        console.log('✅ Tous les tickers ont été supprimés de watchlist');
    }
}

deleteUnavailableTickers().catch(console.error);
