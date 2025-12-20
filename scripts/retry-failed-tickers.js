/**
 * Script de retry pour les tickers en erreur 429 (rate limit) et 404
 *
 * Usage: node scripts/retry-failed-tickers.js
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
    FMP_BASE_URL: 'https://financialmodelingprep.com/api/v3',
    DELAY_BETWEEN_REQUESTS: 5000, // 5 secondes entre chaque ticker pour éviter 429
    REQUEST_TIMEOUT: 45000,
};

// Tickers en erreur du dernier sync
const FAILED_TICKERS_429 = [
    'ARE', 'ARES', 'ARM', 'ARX.TO', 'CMI'
];

const FAILED_TICKERS_404 = [
    'ARMK', 'ARW', 'BFB', 'CCLB.TO'
];

const FAILED_TICKERS_TIMEOUT = [
    'BAM'
];

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

async function syncTickerWithRetry(ticker, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`\n🔄 [${ticker}] Tentative ${attempt}/${maxRetries}...`);

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
                console.log(`   ⚠️ Rate limit (429) - attente 30s avant retry...`);
                await sleep(30000);
                continue;
            }

            if (response.status === 404) {
                console.log(`   ❌ Ticker non trouvé (404)`);
                return { success: false, ticker, error: 'HTTP 404', skipRetry: true };
            }

            if (!response.ok) {
                console.log(`   ❌ HTTP ${response.status}`);
                continue;
            }

            const data = await response.json();

            if (data.error) {
                console.log(`   ❌ API Error: ${data.error}`);
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
                console.log(`   ⏱️ Timeout - attente 10s avant retry...`);
                await sleep(10000);
            } else {
                console.log(`   ❌ Erreur: ${error.message}`);
            }
        }
    }

    return { success: false, ticker, error: 'Max retries exceeded' };
}

async function main() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║  RETRY DES TICKERS EN ERREUR                                ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    console.log(`🌐 API Base URL: ${CONFIG.API_BASE_URL}`);
    console.log(`⏱️  Délai entre requêtes: ${CONFIG.DELAY_BETWEEN_REQUESTS / 1000}s\n`);

    // Liste complète des tickers à retry (excluant les 404 qui sont définitifs)
    const tickersToRetry = [...FAILED_TICKERS_429, ...FAILED_TICKERS_TIMEOUT];

    console.log(`📋 Tickers à réessayer (429/timeout): ${tickersToRetry.length}`);
    tickersToRetry.forEach((t, i) => console.log(`   ${i + 1}. ${t}`));

    console.log(`\n📋 Tickers ignorés (404 - non disponibles sur FMP): ${FAILED_TICKERS_404.length}`);
    FAILED_TICKERS_404.forEach((t, i) => console.log(`   ${i + 1}. ${t}`));

    console.log('\n⏳ Attente de 60 secondes avant de commencer (rate limit recovery)...');
    await sleep(60000);

    const results = {
        success: [],
        failed: []
    };

    for (let i = 0; i < tickersToRetry.length; i++) {
        const ticker = tickersToRetry[i];
        const result = await syncTickerWithRetry(ticker);

        if (result.success) {
            results.success.push(result);
        } else {
            results.failed.push(result);
        }

        // Délai entre chaque ticker
        if (i < tickersToRetry.length - 1) {
            console.log(`   ⏳ Attente ${CONFIG.DELAY_BETWEEN_REQUESTS / 1000}s avant le prochain ticker...`);
            await sleep(CONFIG.DELAY_BETWEEN_REQUESTS);
        }
    }

    // Résumé
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  RÉSUMÉ DU RETRY                                            ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    console.log(`✅ Succès: ${results.success.length}/${tickersToRetry.length}`);
    results.success.forEach(r => {
        console.log(`   - ${r.ticker}: ${r.yearsOfData} ans, $${r.currentPrice?.toFixed(2) || 'N/A'}`);
    });

    if (results.failed.length > 0) {
        console.log(`\n❌ Échecs: ${results.failed.length}/${tickersToRetry.length}`);
        results.failed.forEach(r => {
            console.log(`   - ${r.ticker}: ${r.error}`);
        });
    }

    console.log(`\n📋 Tickers 404 (à investiguer séparément): ${FAILED_TICKERS_404.length}`);
    FAILED_TICKERS_404.forEach(t => console.log(`   - ${t}`));

    console.log('\n✅ Script terminé!');
}

main().catch(error => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
});
