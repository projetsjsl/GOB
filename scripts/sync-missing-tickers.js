/**
 * Script pour synchroniser les tickers manquants (sans snapshot is_current=true)
 *
 * Usage: node scripts/sync-missing-tickers.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const CONFIG = {
    API_BASE_URL: process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'https://gobapps.com',
    DELAY_BETWEEN_REQUESTS: 3000, // 3 secondes entre chaque ticker
    REQUEST_TIMEOUT: 45000,
    MAX_RETRIES: 2,
};

let supabase = null;

function getSupabaseClient() {
    if (!supabase) {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis');
        }

        supabase = createClient(supabaseUrl, supabaseKey);
    }
    return supabase;
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getMissingTickers() {
    const sb = getSupabaseClient();

    // Récupérer tous les tickers actifs
    const { data: allTickers } = await sb
        .from('tickers')
        .select('ticker')
        .eq('is_active', true)
        .order('ticker');

    // Récupérer tous les snapshots actuels
    const { data: snapshots } = await sb
        .from('finance_pro_snapshots')
        .select('ticker, annual_data')
        .eq('is_current', true);

    const snapshotMap = new Map();
    snapshots.forEach(s => {
        const years = Array.isArray(s.annual_data) ? s.annual_data.length : 0;
        snapshotMap.set(s.ticker, years);
    });

    const missing = [];
    for (const t of allTickers) {
        const years = snapshotMap.get(t.ticker);
        if (years === undefined || years === 0) {
            missing.push(t.ticker);
        }
    }

    return missing;
}

async function syncTicker(ticker, attempt = 1) {
    try {
        console.log(`\n🔄 [${ticker}] Tentative ${attempt}/${CONFIG.MAX_RETRIES}...`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);

        const response = await fetch(
            `${CONFIG.API_BASE_URL}/api/fmp-company-data?symbol=${ticker}`,
            {
                signal: controller.signal,
                headers: { 'Content-Type': 'application/json' }
            }
        );

        clearTimeout(timeoutId);

        if (response.status === 429) {
            if (attempt < CONFIG.MAX_RETRIES) {
                console.log(`   ⏳ Rate limit (429) - attente 60s avant retry...`);
                await sleep(60000);
                return syncTicker(ticker, attempt + 1);
            }
            return { success: false, ticker, error: 'HTTP 429 (rate limit)' };
        }

        if (response.status === 404) {
            return { success: false, ticker, error: 'HTTP 404 (non trouvé sur FMP)', skip: true };
        }

        if (!response.ok) {
            if (attempt < CONFIG.MAX_RETRIES) {
                console.log(`   ⏳ HTTP ${response.status} - retry dans 10s...`);
                await sleep(10000);
                return syncTicker(ticker, attempt + 1);
            }
            return { success: false, ticker, error: `HTTP ${response.status}` };
        }

        const data = await response.json();

        if (data.error) {
            return { success: false, ticker, error: data.error };
        }

        const yearsOfData = data.data ? data.data.length : 0;
        console.log(`   ✅ Succès: ${yearsOfData} ans de données, prix: $${data.currentPrice?.toFixed(2) || 'N/A'}`);

        return {
            success: true,
            ticker,
            yearsOfData,
            currentPrice: data.currentPrice
        };

    } catch (error) {
        if (error.name === 'AbortError') {
            if (attempt < CONFIG.MAX_RETRIES) {
                console.log(`   ⏱️ Timeout - retry dans 10s...`);
                await sleep(10000);
                return syncTicker(ticker, attempt + 1);
            }
            return { success: false, ticker, error: 'Timeout' };
        }
        return { success: false, ticker, error: error.message };
    }
}

async function main() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║  SYNCHRONISATION DES TICKERS MANQUANTS                      ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    console.log(`🌐 API Base URL: ${CONFIG.API_BASE_URL}`);
    console.log(`⏱️  Délai entre requêtes: ${CONFIG.DELAY_BETWEEN_REQUESTS / 1000}s\n`);

    // Récupérer les tickers manquants
    console.log('📋 Recherche des tickers manquants...');
    const missingTickers = await getMissingTickers();
    console.log(`   Trouvé: ${missingTickers.length} tickers sans données\n`);

    if (missingTickers.length === 0) {
        console.log('✅ Tous les tickers ont des données!');
        return;
    }

    // Afficher la liste
    console.log('📋 Tickers à synchroniser:');
    missingTickers.forEach((t, i) => {
        if (i < 20) console.log(`   ${(i + 1).toString().padStart(3)}. ${t}`);
    });
    if (missingTickers.length > 20) {
        console.log(`   ... et ${missingTickers.length - 20} autres`);
    }

    console.log('\n⏳ Début de la synchronisation...\n');

    const results = {
        success: [],
        failed: [],
        skipped: []
    };

    const startTime = Date.now();

    for (let i = 0; i < missingTickers.length; i++) {
        const ticker = missingTickers[i];
        const progress = `[${(i + 1).toString().padStart(3)}/${missingTickers.length}]`;

        process.stdout.write(`${progress} `);
        const result = await syncTicker(ticker);

        if (result.success) {
            results.success.push(result);
        } else if (result.skip) {
            results.skipped.push(result);
        } else {
            results.failed.push(result);
        }

        // Délai entre chaque ticker
        if (i < missingTickers.length - 1) {
            await sleep(CONFIG.DELAY_BETWEEN_REQUESTS);
        }

        // Afficher le progrès tous les 50 tickers
        if ((i + 1) % 50 === 0) {
            const elapsed = (Date.now() - startTime) / 1000;
            const rate = (i + 1) / elapsed;
            const remaining = (missingTickers.length - i - 1) / rate;
            console.log(`\n   📊 Progrès: ${i + 1}/${missingTickers.length} - ${results.success.length} succès, ${results.failed.length} échecs`);
            console.log(`   ⏱️  Temps restant estimé: ${Math.ceil(remaining / 60)} min\n`);
        }
    }

    // Résumé
    const totalTime = (Date.now() - startTime) / 1000;

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  RÉSUMÉ                                                      ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    console.log(`⏱️  Temps total: ${Math.floor(totalTime / 60)}m ${Math.floor(totalTime % 60)}s`);
    console.log(`✅ Succès: ${results.success.length}/${missingTickers.length}`);
    console.log(`❌ Échecs: ${results.failed.length}/${missingTickers.length}`);
    console.log(`⏭️  Ignorés (404): ${results.skipped.length}/${missingTickers.length}`);

    if (results.success.length > 0) {
        console.log('\n✅ Tickers synchronisés:');
        results.success.slice(0, 20).forEach(r => {
            console.log(`   - ${r.ticker}: ${r.yearsOfData} ans, $${r.currentPrice?.toFixed(2) || 'N/A'}`);
        });
        if (results.success.length > 20) {
            console.log(`   ... et ${results.success.length - 20} autres`);
        }
    }

    if (results.failed.length > 0) {
        console.log('\n❌ Tickers en échec:');
        results.failed.forEach(r => {
            console.log(`   - ${r.ticker}: ${r.error}`);
        });
    }

    if (results.skipped.length > 0) {
        console.log('\n⏭️ Tickers non disponibles sur FMP (404):');
        results.skipped.forEach(r => {
            console.log(`   - ${r.ticker}`);
        });
    }

    console.log('\n✅ Script terminé!');
}

main().catch(error => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
});
