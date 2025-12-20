/**
 * MASTER SYNC & TEST SCRIPT - 3p1 Finance Pro
 *
 * Script de synchronisation complète et de test du système FMP/Supabase
 *
 * Ce script effectue:
 * 1. Vérification de la configuration (env vars, connexions)
 * 2. Test de connectivité Supabase
 * 3. Test de l'API FMP
 * 4. Synchronisation complète des tickers
 * 5. Vérification des données synchronisées
 * 6. Tests de validation
 * 7. Génération d'un rapport détaillé
 *
 * Usage: node scripts/master-sync-test-3p1.js [--full|--quick|--test-only]
 *
 * Options:
 *   --full       : Synchronisation complète de tous les tickers (défaut)
 *   --quick      : Synchronisation rapide (premiers 10 tickers)
 *   --test-only  : Tests uniquement, pas de synchronisation
 *   --prices     : Sync batch des prix uniquement
 *
 * Date: 19 décembre 2025
 * Author: Claude - Supabase FMP Master 3p1
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
    API_BASE_URL: process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'https://gobapps.com',
    FMP_BASE_URL: 'https://financialmodelingprep.com/api/v3',
    BATCH_SIZE: 2,                    // Tickers traités en parallèle (réduit pour éviter 429)
    DELAY_BETWEEN_BATCHES: 3000,      // Délai entre batches (ms) - augmenté
    DELAY_BETWEEN_REQUESTS: 500,      // Délai entre requêtes FMP (ms)
    MAX_RETRIES: 3,                   // Nombre de tentatives max
    REQUEST_TIMEOUT: 45000,           // Timeout par requête (ms) - augmenté
    RATE_LIMIT_RETRY_DELAY: 60000,    // Délai après rate limit (429) - 60s
};

// ═══════════════════════════════════════════════════════════════════════════
// LOGGING & UTILS
// ═══════════════════════════════════════════════════════════════════════════

const LOG_LEVELS = {
    INFO: '📋',
    SUCCESS: '✅',
    WARNING: '⚠️',
    ERROR: '❌',
    DEBUG: '🔍',
    SYNC: '🔄',
    TEST: '🧪',
    REPORT: '📊'
};

const logs = [];

function log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const icon = LOG_LEVELS[level] || '📋';
    const logEntry = { timestamp, level, message, data };
    logs.push(logEntry);

    if (data) {
        console.log(`${icon} [${timestamp.split('T')[1].split('.')[0]}] ${message}`, data);
    } else {
        console.log(`${icon} [${timestamp.split('T')[1].split('.')[0]}] ${message}`);
    }
}

function formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════════════════
// SUPABASE CLIENT
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// TESTS DE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

async function testConfiguration() {
    log('TEST', '═══ TEST DE CONFIGURATION ═══');
    const results = { passed: 0, failed: 0, warnings: 0, details: [] };

    // Test variables d'environnement
    const envVars = [
        { name: 'SUPABASE_URL', required: true },
        { name: 'SUPABASE_SERVICE_ROLE_KEY', required: true },
        { name: 'FMP_API_KEY', required: true },
        { name: 'VERCEL_URL', required: false },
        { name: 'FINNHUB_API_KEY', required: false }
    ];

    for (const envVar of envVars) {
        const value = process.env[envVar.name];
        if (value) {
            results.passed++;
            results.details.push({ test: envVar.name, status: 'passed', message: 'Définie' });
            log('SUCCESS', `${envVar.name}: Définie`);
        } else if (envVar.required) {
            results.failed++;
            results.details.push({ test: envVar.name, status: 'failed', message: 'MANQUANTE!' });
            log('ERROR', `${envVar.name}: MANQUANTE!`);
        } else {
            results.warnings++;
            results.details.push({ test: envVar.name, status: 'warning', message: 'Non définie (optionnelle)' });
            log('WARNING', `${envVar.name}: Non définie (optionnelle)`);
        }
    }

    return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS DE CONNECTIVITÉ
// ═══════════════════════════════════════════════════════════════════════════

async function testSupabaseConnection() {
    log('TEST', '═══ TEST CONNEXION SUPABASE ═══');
    const results = { passed: 0, failed: 0, details: [], tables: {} };

    try {
        const sb = getSupabaseClient();

        // Test 1: Lire les tickers
        const tickersStart = Date.now();
        const { data: tickers, error: tickersError, count } = await sb
            .from('tickers')
            .select('*', { count: 'exact' })
            .limit(5);

        if (tickersError) throw tickersError;

        results.passed++;
        results.tables.tickers = { count: count || tickers?.length || 0, sample: tickers?.slice(0, 2) };
        log('SUCCESS', `Table 'tickers': ${count || tickers?.length} enregistrements (${Date.now() - tickersStart}ms)`);

        // Test 2: Tickers actifs
        const { data: activeTickers, error: activeError } = await sb
            .from('tickers')
            .select('ticker, company_name, sector, country, is_active')
            .eq('is_active', true)
            .order('ticker', { ascending: true });

        if (activeError) throw activeError;

        results.passed++;
        results.tables.active_tickers = activeTickers?.length || 0;
        log('SUCCESS', `Tickers actifs: ${activeTickers?.length}`);

        // Test 3: Finance Pro Snapshots
        const { count: snapshotsCount, error: snapshotsError } = await sb
            .from('finance_pro_snapshots')
            .select('*', { count: 'exact', head: true });

        if (snapshotsError && !snapshotsError.message.includes('does not exist')) {
            log('WARNING', `Table 'finance_pro_snapshots': ${snapshotsError.message}`);
            results.tables.finance_pro_snapshots = { error: snapshotsError.message };
        } else {
            results.passed++;
            results.tables.finance_pro_snapshots = snapshotsCount || 0;
            log('SUCCESS', `Table 'finance_pro_snapshots': ${snapshotsCount || 0} enregistrements`);
        }

        // Test 4: Job Logs
        const { data: recentLogs, error: logsError } = await sb
            .from('job_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        if (logsError && !logsError.message.includes('does not exist')) {
            log('WARNING', `Table 'job_logs': ${logsError.message}`);
        } else {
            results.passed++;
            results.tables.job_logs = recentLogs?.length || 0;
            log('SUCCESS', `Table 'job_logs': ${recentLogs?.length || 0} entrées récentes`);
        }

        // Stocker la liste des tickers actifs pour la sync
        results.activeTickers = activeTickers || [];

    } catch (error) {
        results.failed++;
        results.details.push({ test: 'supabase_connection', status: 'failed', message: error.message });
        log('ERROR', `Connexion Supabase échouée: ${error.message}`);
    }

    return results;
}

async function testFMPConnection() {
    log('TEST', '═══ TEST CONNEXION FMP API ═══');
    const results = { passed: 0, failed: 0, details: [] };

    const FMP_KEY = process.env.FMP_API_KEY;
    if (!FMP_KEY) {
        results.failed++;
        log('ERROR', 'FMP_API_KEY non configurée');
        return results;
    }

    try {
        // Test 1: Quote simple (AAPL)
        const quoteStart = Date.now();
        const quoteRes = await fetch(`${CONFIG.FMP_BASE_URL}/quote/AAPL?apikey=${FMP_KEY}`);

        if (!quoteRes.ok) {
            if (quoteRes.status === 429) {
                log('WARNING', 'Rate limit FMP atteint - API fonctionnelle mais limitée');
                results.details.push({ test: 'quote', status: 'warning', message: 'Rate limited' });
            } else {
                throw new Error(`HTTP ${quoteRes.status}`);
            }
        } else {
            const quoteData = await quoteRes.json();
            if (Array.isArray(quoteData) && quoteData.length > 0) {
                results.passed++;
                log('SUCCESS', `Quote AAPL: $${quoteData[0].price} (${Date.now() - quoteStart}ms)`);
                results.details.push({
                    test: 'quote',
                    status: 'passed',
                    data: { symbol: 'AAPL', price: quoteData[0].price }
                });
            }
        }

        await sleep(500); // Petit délai entre tests

        // Test 2: Profile
        const profileStart = Date.now();
        const profileRes = await fetch(`${CONFIG.FMP_BASE_URL}/profile/MSFT?apikey=${FMP_KEY}`);

        if (profileRes.ok) {
            const profileData = await profileRes.json();
            if (Array.isArray(profileData) && profileData.length > 0) {
                results.passed++;
                log('SUCCESS', `Profile MSFT: ${profileData[0].companyName} (${Date.now() - profileStart}ms)`);
            }
        }

        await sleep(500);

        // Test 3: Key Metrics
        const metricsStart = Date.now();
        const metricsRes = await fetch(`${CONFIG.FMP_BASE_URL}/key-metrics/GOOGL?period=annual&limit=5&apikey=${FMP_KEY}`);

        if (metricsRes.ok) {
            const metricsData = await metricsRes.json();
            if (Array.isArray(metricsData) && metricsData.length > 0) {
                results.passed++;
                log('SUCCESS', `Key Metrics GOOGL: ${metricsData.length} années (${Date.now() - metricsStart}ms)`);
            }
        }

    } catch (error) {
        results.failed++;
        log('ERROR', `Test FMP échoué: ${error.message}`);
        results.details.push({ test: 'fmp_api', status: 'failed', message: error.message });
    }

    return results;
}

async function testAPIEndpoints() {
    log('TEST', '═══ TEST ENDPOINTS API ═══');
    const results = { passed: 0, failed: 0, details: [] };

    const endpoints = [
        { path: '/api/admin/tickers?limit=5', name: 'Admin Tickers' },
        { path: '/api/tickers-config', name: 'Tickers Config' },
        { path: '/api/fmp-company-data?symbol=AAPL', name: 'FMP Company Data' }
    ];

    for (const endpoint of endpoints) {
        try {
            const start = Date.now();
            const res = await fetch(`${CONFIG.API_BASE_URL}${endpoint.path}`);
            const duration = Date.now() - start;

            if (res.ok) {
                const data = await res.json();
                results.passed++;
                log('SUCCESS', `${endpoint.name}: OK (${duration}ms)`);
                results.details.push({
                    endpoint: endpoint.path,
                    status: 'passed',
                    duration,
                    dataPreview: typeof data === 'object' ? Object.keys(data).slice(0, 5) : 'N/A'
                });
            } else {
                results.failed++;
                log('ERROR', `${endpoint.name}: HTTP ${res.status} (${duration}ms)`);
                results.details.push({ endpoint: endpoint.path, status: 'failed', httpStatus: res.status });
            }
        } catch (error) {
            results.failed++;
            log('ERROR', `${endpoint.name}: ${error.message}`);
            results.details.push({ endpoint: endpoint.path, status: 'failed', error: error.message });
        }

        await sleep(300);
    }

    return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// SYNCHRONISATION
// ═══════════════════════════════════════════════════════════════════════════

async function syncSingleTicker(ticker, options = {}) {
    const { verbose = false, attempt = 1 } = options;
    const start = Date.now();
    const tickerSymbol = typeof ticker === 'string' ? ticker : ticker.ticker;

    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/api/fmp-company-data?symbol=${tickerSymbol}`, {
            signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT)
        });

        // Gestion du rate limit (429) avec retry automatique
        if (res.status === 429) {
            if (attempt < CONFIG.MAX_RETRIES) {
                log('WARNING', `Rate limit (429) pour ${tickerSymbol} - retry ${attempt + 1}/${CONFIG.MAX_RETRIES} dans 60s`);
                await sleep(CONFIG.RATE_LIMIT_RETRY_DELAY);
                return syncSingleTicker(ticker, { ...options, attempt: attempt + 1 });
            }
            return {
                success: false,
                ticker: tickerSymbol,
                error: 'HTTP 429 (rate limit - max retries atteint)',
                duration: Date.now() - start,
                rateLimited: true
            };
        }

        if (!res.ok) {
            // Retry pour erreurs temporaires (500, 502, 503, 504)
            if ([500, 502, 503, 504].includes(res.status) && attempt < CONFIG.MAX_RETRIES) {
                log('WARNING', `HTTP ${res.status} pour ${tickerSymbol} - retry ${attempt + 1}/${CONFIG.MAX_RETRIES} dans 10s`);
                await sleep(10000);
                return syncSingleTicker(ticker, { ...options, attempt: attempt + 1 });
            }
            return {
                success: false,
                ticker: tickerSymbol,
                error: `HTTP ${res.status}`,
                duration: Date.now() - start
            };
        }

        const data = await res.json();

        if (data.error) {
            return {
                success: false,
                ticker: tickerSymbol,
                error: data.error,
                duration: Date.now() - start
            };
        }

        // Mise à jour dans Supabase
        const sb = getSupabaseClient();
        const updateData = {
            updated_at: new Date().toISOString()
        };

        if (data.info?.name) updateData.company_name = data.info.name;
        if (data.info?.sector) updateData.sector = data.info.sector;
        if (data.info?.country) updateData.country = data.info.country;
        if (data.info?.exchange) updateData.exchange = data.info.exchange;
        if (data.info?.currency) updateData.currency = data.info.currency;
        if (data.info?.beta !== null && data.info?.beta !== undefined) updateData.beta = data.info.beta;

        await sb.from('tickers').update(updateData).eq('ticker', tickerSymbol);

        return {
            success: true,
            ticker: tickerSymbol,
            hasData: data.data && data.data.length > 0,
            yearsOfData: data.data?.length || 0,
            hasPrice: !!data.currentPrice,
            currentPrice: data.currentPrice,
            sector: data.info?.sector,
            duration: Date.now() - start
        };

    } catch (error) {
        // Retry pour timeout
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
            if (attempt < CONFIG.MAX_RETRIES) {
                log('WARNING', `Timeout pour ${tickerSymbol} - retry ${attempt + 1}/${CONFIG.MAX_RETRIES} dans 10s`);
                await sleep(10000);
                return syncSingleTicker(ticker, { ...options, attempt: attempt + 1 });
            }
        }
        return {
            success: false,
            ticker: tickerSymbol,
            error: error.message,
            duration: Date.now() - start
        };
    }
}

async function syncAllTickers(tickers, options = {}) {
    const { quickMode = false } = options;
    log('SYNC', '═══ SYNCHRONISATION DES TICKERS ═══');

    const tickersToSync = quickMode ? tickers.slice(0, 10) : tickers;
    log('INFO', `Tickers à synchroniser: ${tickersToSync.length}${quickMode ? ' (mode rapide)' : ''}`);

    const results = {
        total: tickersToSync.length,
        success: 0,
        errors: 0,
        withData: 0,
        withoutData: 0,
        totalDuration: 0,
        errorDetails: [],
        successDetails: []
    };

    const startTime = Date.now();

    // Traitement par batch
    for (let i = 0; i < tickersToSync.length; i += CONFIG.BATCH_SIZE) {
        const batch = tickersToSync.slice(i, i + CONFIG.BATCH_SIZE);

        if (i > 0) {
            await sleep(CONFIG.DELAY_BETWEEN_BATCHES);
        }

        // Traiter le batch en parallèle
        const batchResults = await Promise.all(
            batch.map(ticker => syncSingleTicker(ticker))
        );

        // Analyser les résultats
        for (const result of batchResults) {
            results.totalDuration += result.duration;

            if (result.success) {
                results.success++;
                if (result.hasData && result.yearsOfData >= 3) {
                    results.withData++;
                    results.successDetails.push(result);
                } else {
                    results.withoutData++;
                }

                const status = result.hasData ? '✅' : '⚠️';
                log('SUCCESS', `${status} ${result.ticker.padEnd(10)} - ${result.yearsOfData} ans, $${result.currentPrice?.toFixed(2) || 'N/A'}`);
            } else {
                results.errors++;
                results.errorDetails.push(result);
                log('ERROR', `${result.ticker.padEnd(10)} - ${result.error}`);
            }
        }

        // Progress update
        const progress = Math.min(i + CONFIG.BATCH_SIZE, tickersToSync.length);
        const pct = ((progress / tickersToSync.length) * 100).toFixed(1);
        log('INFO', `Progrès: ${progress}/${tickersToSync.length} (${pct}%)`);
    }

    results.wallTime = Date.now() - startTime;
    results.avgDuration = results.totalDuration / results.total;

    return results;
}

async function syncBatchPrices() {
    log('SYNC', '═══ SYNCHRONISATION BATCH DES PRIX ═══');

    try {
        const start = Date.now();
        const res = await fetch(`${CONFIG.API_BASE_URL}/api/fmp-batch-sync`, {
            method: 'POST'
        });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();

        log('SUCCESS', `Batch sync terminé: ${data.tickersProcessed} tickers en ${formatDuration(data.executionTimeMs || (Date.now() - start))}`);

        return {
            success: true,
            ...data
        };

    } catch (error) {
        log('ERROR', `Batch sync échoué: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION DES DONNÉES
// ═══════════════════════════════════════════════════════════════════════════

async function validateData() {
    log('TEST', '═══ VALIDATION DES DONNÉES ═══');
    const results = { passed: 0, failed: 0, warnings: 0, details: [] };

    const sb = getSupabaseClient();

    try {
        // 1. Vérifier les tickers avec données manquantes
        const { data: incompleteTickers } = await sb
            .from('tickers')
            .select('ticker, company_name, sector, country, exchange')
            .eq('is_active', true)
            .or('sector.is.null,country.is.null,exchange.is.null');

        if (incompleteTickers && incompleteTickers.length > 0) {
            results.warnings++;
            log('WARNING', `${incompleteTickers.length} tickers avec données incomplètes`);
            results.details.push({
                test: 'incomplete_tickers',
                count: incompleteTickers.length,
                samples: incompleteTickers.slice(0, 5).map(t => t.ticker)
            });
        } else {
            results.passed++;
            log('SUCCESS', 'Tous les tickers actifs ont des données complètes');
        }

        // 2. Vérifier les tickers récemment mis à jour
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: recentlyUpdated, count: recentCount } = await sb
            .from('tickers')
            .select('*', { count: 'exact' })
            .eq('is_active', true)
            .gt('updated_at', yesterday);

        if (recentCount && recentCount > 0) {
            results.passed++;
            log('SUCCESS', `${recentCount} tickers mis à jour dans les dernières 24h`);
        } else {
            results.warnings++;
            log('WARNING', 'Aucun ticker mis à jour dans les dernières 24h');
        }

        // 3. Vérifier les snapshots récents
        const { count: snapshotsCount } = await sb
            .from('finance_pro_snapshots')
            .select('*', { count: 'exact', head: true })
            .gt('created_at', yesterday);

        if (snapshotsCount && snapshotsCount > 0) {
            results.passed++;
            log('SUCCESS', `${snapshotsCount} snapshots créés dans les dernières 24h`);
        } else {
            log('INFO', 'Aucun nouveau snapshot dans les dernières 24h');
        }

        // 4. Statistiques globales
        const { data: stats } = await sb.rpc('get_ticker_stats').catch(() => ({ data: null }));

        if (stats) {
            results.details.push({ test: 'global_stats', data: stats });
        }

    } catch (error) {
        results.failed++;
        log('ERROR', `Validation échouée: ${error.message}`);
    }

    return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// RAPPORT FINAL
// ═══════════════════════════════════════════════════════════════════════════

function generateReport(testResults) {
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                    RAPPORT DE SYNCHRONISATION 3P1                            ║');
    console.log('║                       Supabase FMP Master                                    ║');
    console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
    console.log(`║  Date: ${new Date().toISOString().replace('T', ' ').split('.')[0].padEnd(68)}║`);
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

    // Configuration
    console.log('┌─────────────────────────────────────────────────────────────────────────────┐');
    console.log('│ 1. CONFIGURATION                                                            │');
    console.log('├─────────────────────────────────────────────────────────────────────────────┤');
    if (testResults.config) {
        console.log(`│   ✅ Tests réussis: ${testResults.config.passed}                                                       │`);
        console.log(`│   ❌ Tests échoués: ${testResults.config.failed}                                                       │`);
        console.log(`│   ⚠️  Avertissements: ${testResults.config.warnings}                                                    │`);
    }
    console.log('└─────────────────────────────────────────────────────────────────────────────┘\n');

    // Supabase
    console.log('┌─────────────────────────────────────────────────────────────────────────────┐');
    console.log('│ 2. CONNEXION SUPABASE                                                       │');
    console.log('├─────────────────────────────────────────────────────────────────────────────┤');
    if (testResults.supabase) {
        console.log(`│   ✅ Tests réussis: ${testResults.supabase.passed}                                                       │`);
        if (testResults.supabase.tables) {
            console.log(`│   📊 Tables:                                                                 │`);
            for (const [table, info] of Object.entries(testResults.supabase.tables)) {
                const count = typeof info === 'number' ? info : (info?.count || 'N/A');
                console.log(`│      - ${table}: ${count} enregistrements`.padEnd(76) + '│');
            }
        }
        if (testResults.supabase.activeTickers) {
            console.log(`│   📋 Tickers actifs: ${testResults.supabase.activeTickers.length}`.padEnd(76) + '│');
        }
    }
    console.log('└─────────────────────────────────────────────────────────────────────────────┘\n');

    // FMP API
    console.log('┌─────────────────────────────────────────────────────────────────────────────┐');
    console.log('│ 3. API FMP                                                                  │');
    console.log('├─────────────────────────────────────────────────────────────────────────────┤');
    if (testResults.fmp) {
        console.log(`│   ✅ Tests réussis: ${testResults.fmp.passed}                                                       │`);
        console.log(`│   ❌ Tests échoués: ${testResults.fmp.failed}                                                       │`);
    }
    console.log('└─────────────────────────────────────────────────────────────────────────────┘\n');

    // Synchronisation
    if (testResults.sync) {
        console.log('┌─────────────────────────────────────────────────────────────────────────────┐');
        console.log('│ 4. SYNCHRONISATION                                                         │');
        console.log('├─────────────────────────────────────────────────────────────────────────────┤');
        console.log(`│   📊 Total traité: ${testResults.sync.total}`.padEnd(76) + '│');
        console.log(`│   ✅ Succès: ${testResults.sync.success} (${((testResults.sync.success/testResults.sync.total)*100).toFixed(1)}%)`.padEnd(76) + '│');
        console.log(`│   ❌ Erreurs: ${testResults.sync.errors}`.padEnd(76) + '│');
        console.log(`│   📈 Avec données valides (≥3 ans): ${testResults.sync.withData}`.padEnd(76) + '│');
        console.log(`│   ⏱️  Durée totale: ${formatDuration(testResults.sync.wallTime)}`.padEnd(76) + '│');
        console.log(`│   ⚡ Durée moyenne/ticker: ${formatDuration(testResults.sync.avgDuration)}`.padEnd(76) + '│');

        if (testResults.sync.errorDetails && testResults.sync.errorDetails.length > 0) {
            console.log('│                                                                             │');
            console.log('│   ❌ Erreurs détaillées (max 10):                                           │');
            testResults.sync.errorDetails.slice(0, 10).forEach(err => {
                console.log(`│      ${err.ticker}: ${err.error.substring(0, 50)}`.padEnd(76) + '│');
            });
        }

        if (testResults.sync.successDetails && testResults.sync.successDetails.length > 0) {
            console.log('│                                                                             │');
            console.log('│   🏆 Top 10 tickers avec le plus de données:                               │');
            testResults.sync.successDetails
                .sort((a, b) => b.yearsOfData - a.yearsOfData)
                .slice(0, 10)
                .forEach(t => {
                    console.log(`│      ${t.ticker.padEnd(10)} - ${t.yearsOfData} ans, $${t.currentPrice?.toFixed(2) || 'N/A'}`.padEnd(76) + '│');
                });
        }
        console.log('└─────────────────────────────────────────────────────────────────────────────┘\n');
    }

    // Batch Sync Prices
    if (testResults.batchSync) {
        console.log('┌─────────────────────────────────────────────────────────────────────────────┐');
        console.log('│ 5. BATCH SYNC PRIX                                                         │');
        console.log('├─────────────────────────────────────────────────────────────────────────────┤');
        if (testResults.batchSync.success) {
            console.log(`│   ✅ Succès: ${testResults.batchSync.tickersProcessed} tickers synchronisés`.padEnd(76) + '│');
            console.log(`│   ⏱️  Durée: ${formatDuration(testResults.batchSync.executionTimeMs || 0)}`.padEnd(76) + '│');
        } else {
            console.log(`│   ❌ Échec: ${testResults.batchSync.error}`.padEnd(76) + '│');
        }
        console.log('└─────────────────────────────────────────────────────────────────────────────┘\n');
    }

    // Validation
    if (testResults.validation) {
        console.log('┌─────────────────────────────────────────────────────────────────────────────┐');
        console.log('│ 6. VALIDATION DES DONNÉES                                                  │');
        console.log('├─────────────────────────────────────────────────────────────────────────────┤');
        console.log(`│   ✅ Tests réussis: ${testResults.validation.passed}`.padEnd(76) + '│');
        console.log(`│   ⚠️  Avertissements: ${testResults.validation.warnings}`.padEnd(76) + '│');
        console.log(`│   ❌ Échecs: ${testResults.validation.failed}`.padEnd(76) + '│');
        console.log('└─────────────────────────────────────────────────────────────────────────────┘\n');
    }

    // Résumé final
    console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                              RÉSUMÉ FINAL                                    ║');
    console.log('╠══════════════════════════════════════════════════════════════════════════════╣');

    const totalTests = (testResults.config?.passed || 0) + (testResults.supabase?.passed || 0) +
                       (testResults.fmp?.passed || 0) + (testResults.validation?.passed || 0);
    const totalFailed = (testResults.config?.failed || 0) + (testResults.supabase?.failed || 0) +
                        (testResults.fmp?.failed || 0) + (testResults.validation?.failed || 0);

    const overallStatus = totalFailed === 0 ? '✅ SUCCÈS' : (totalFailed < 3 ? '⚠️ PARTIEL' : '❌ ÉCHEC');

    console.log(`║   Status global: ${overallStatus}`.padEnd(77) + '║');
    console.log(`║   Tests réussis: ${totalTests}`.padEnd(77) + '║');
    console.log(`║   Tests échoués: ${totalFailed}`.padEnd(77) + '║');

    if (testResults.sync) {
        const syncStatus = testResults.sync.success > testResults.sync.errors ? '✅' : '❌';
        console.log(`║   Synchronisation: ${syncStatus} ${testResults.sync.success}/${testResults.sync.total} tickers`.padEnd(77) + '║');
    }

    console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

    console.log('💡 Prochaines étapes recommandées:');
    console.log('   1. Vérifier les tickers en erreur dans le rapport ci-dessus');
    console.log('   2. Dans l\'application 3p1, rafraîchir les données pour voir les mises à jour');
    console.log('   3. Utiliser "Sync All" dans 3p1 pour synchroniser vers LocalStorage');
    console.log('   4. Surveiller les logs Vercel pour les cron jobs\n');

    return {
        status: overallStatus,
        totalTests,
        totalFailed,
        timestamp: new Date().toISOString()
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
    const args = process.argv.slice(2);
    const mode = args.find(a => a.startsWith('--'))?.replace('--', '') || 'full';

    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║           MASTER SYNC & TEST SCRIPT - 3P1 FINANCE PRO                        ║');
    console.log('║                    Supabase FMP Master                                       ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

    log('INFO', `Mode: ${mode.toUpperCase()}`);
    log('INFO', `API Base URL: ${CONFIG.API_BASE_URL}`);
    log('INFO', `Démarrage: ${new Date().toISOString()}\n`);

    const startTime = Date.now();
    const testResults = {};

    // 1. Test Configuration
    testResults.config = await testConfiguration();
    console.log('');

    if (testResults.config.failed > 0) {
        log('ERROR', 'Configuration invalide - Arrêt du script');
        process.exit(1);
    }

    // 2. Test Supabase
    testResults.supabase = await testSupabaseConnection();
    console.log('');

    // 3. Test FMP
    testResults.fmp = await testFMPConnection();
    console.log('');

    // 4. Test API Endpoints
    testResults.endpoints = await testAPIEndpoints();
    console.log('');

    // 5. Synchronisation (sauf mode test-only)
    if (mode !== 'test-only' && testResults.supabase.activeTickers) {
        if (mode === 'prices') {
            // Sync batch des prix uniquement
            testResults.batchSync = await syncBatchPrices();
        } else {
            // Sync complète des tickers
            testResults.sync = await syncAllTickers(
                testResults.supabase.activeTickers,
                { quickMode: mode === 'quick' }
            );
        }
        console.log('');
    }

    // 6. Validation
    testResults.validation = await validateData();
    console.log('');

    // 7. Rapport final
    const finalReport = generateReport(testResults);

    const totalDuration = Date.now() - startTime;
    log('INFO', `Durée totale d'exécution: ${formatDuration(totalDuration)}`);

    // Sauvegarder le rapport dans job_logs
    try {
        const sb = getSupabaseClient();
        await sb.from('job_logs').insert({
            job_type: 'master_sync_test',
            status: finalReport.status.includes('SUCCÈS') ? 'success' : 'partial',
            records_processed: testResults.sync?.success || 0,
            execution_time_ms: totalDuration,
            error_message: testResults.sync?.errorDetails?.length > 0
                ? `${testResults.sync.errorDetails.length} erreurs`
                : null,
            started_at: new Date(startTime).toISOString(),
            completed_at: new Date().toISOString()
        });
        log('SUCCESS', 'Rapport sauvegardé dans job_logs');
    } catch (e) {
        log('WARNING', `Impossible de sauvegarder le rapport: ${e.message}`);
    }

    console.log('\n✅ Script terminé!\n');
}

// Exécution
main().catch(error => {
    console.error('\n❌ Erreur fatale:', error);
    console.error(error.stack);
    process.exit(1);
});
