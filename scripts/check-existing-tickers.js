/**
 * Script pour vérifier quels tickers existent déjà dans Supabase
 * 
 * Usage: node scripts/check-existing-tickers.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Liste des tickers à vérifier
const TICKERS_TO_CHECK = [
    'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 'TSLA', 'NVDA', 'BRK.B', 'JPM', 'BAC',
    'WFC', 'C', 'GS', 'MS', 'V', 'MA', 'PYPL', 'AXP', 'JNJ', 'PFE', 'MRK', 'BMY',
    'LLY', 'ABBV', 'UNH', 'ELV', 'CVS', 'WBA', 'PG', 'KO', 'PEP', 'MDLZ', 'NSRGY',
    'DANOY', 'LRLCY', 'UL', 'WMT', 'COST', 'TGT', 'HD', 'LOW', 'BBY', 'NKE', 'ADDYY',
    'GPS', 'VFC', 'INTC', 'IFC', 'POW', 'BAM', 'CNR', 'CP', 'AC', 'WJA', 'BBD.B',
    'GIB.A', 'ATD.B', 'L', 'MRU', 'SAP', 'DOL', 'RIO', 'ABX', 'TECK.B', 'SU', 'CNQ',
    'IMO', 'ENB', 'TRP', 'PPL', 'AQN', 'H', 'FTS', 'EMA', 'CCA', 'AMD', 'QCOM', 'CSCO',
    'ORCL', 'CRM', 'ADBE', 'NOW', 'SNOW', 'SHOP', 'ZM', 'NFLX', 'DIS', 'CMCSA',
    'T', 'VZ', 'TMUS', 'RCI.B', 'BCE', 'MFC', 'SLF', 'GWO'
];

async function checkExistingTickers() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Variables d\'environnement Supabase manquantes');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 Vérification des tickers existants...\n');

    // Récupérer tous les tickers existants
    const { data: allTickers, error: fetchError } = await supabase
        .from('tickers')
        .select('ticker, source, is_active, company_name, country, exchange');

    if (fetchError) {
        console.error('❌ Erreur:', fetchError);
        process.exit(1);
    }

    const tickerMap = new Map();
    allTickers?.forEach(t => {
        tickerMap.set(t.ticker.toUpperCase(), t);
    });

    console.log(`📊 Total de tickers dans Supabase: ${tickerMap.size}\n`);

    // Vérifier chaque ticker de la liste
    const existing = [];
    const missing = [];
    const bySource = {
        team: [],
        watchlist: [],
        both: [],
        manual: []
    };

    for (const ticker of TICKERS_TO_CHECK) {
        const tickerUpper = ticker.toUpperCase();
        const existingTicker = tickerMap.get(tickerUpper);

        if (existingTicker) {
            existing.push({
                ticker: tickerUpper,
                source: existingTicker.source,
                is_active: existingTicker.is_active,
                company_name: existingTicker.company_name
            });
            bySource[existingTicker.source]?.push(tickerUpper);
        } else {
            missing.push(tickerUpper);
        }
    }

    console.log('='.repeat(60));
    console.log('📊 RÉSULTATS');
    console.log('='.repeat(60));
    console.log(`✅ Tickers existants: ${existing.length}`);
    console.log(`❌ Tickers manquants: ${missing.length}`);
    console.log(`📈 Total vérifié: ${TICKERS_TO_CHECK.length}\n`);

    console.log('📋 Répartition par source:');
    console.log(`   - Team: ${bySource.team.length}`);
    console.log(`   - Watchlist: ${bySource.watchlist.length}`);
    console.log(`   - Both: ${bySource.both.length}`);
    console.log(`   - Manual: ${bySource.manual.length}\n`);

    if (existing.length > 0) {
        console.log('✅ TICKERS EXISTANTS:');
        console.log('-'.repeat(60));
        existing.forEach(t => {
            const status = t.is_active ? '✓' : '✗';
            console.log(`  ${status} ${t.ticker.padEnd(8)} [${t.source.padEnd(10)}] ${t.company_name || ''}`);
        });
        console.log('');
    }

    if (missing.length > 0) {
        console.log('❌ TICKERS MANQUANTS:');
        console.log('-'.repeat(60));
        missing.forEach(t => console.log(`  - ${t}`));
        console.log('');
    }

    // Tickers qui sont dans 'team' et doivent être mis à 'both'
    const needUpdate = existing.filter(t => t.source === 'team');
    if (needUpdate.length > 0) {
        console.log('🔄 TICKERS À METTRE À JOUR (team → both):');
        console.log('-'.repeat(60));
        needUpdate.forEach(t => console.log(`  - ${t.ticker}`));
        console.log('');
    }

    return {
        existing,
        missing,
        needUpdate,
        bySource
    };
}

checkExistingTickers()
    .then(() => {
        console.log('✅ Vérification terminée');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Erreur:', error);
        process.exit(1);
    });




