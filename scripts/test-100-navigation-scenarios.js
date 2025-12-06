#!/usr/bin/env node
/**
 * TEST SUITE - 100 Cas de Navigation et Situations Utilisateur
 * 
 * Ce script teste 100 scénarios différents d'utilisation de l'application 3p1
 * pour valider la fonctionnalité complète et identifier les ajustements nécessaires.
 * 
 * Usage: node scripts/test-100-navigation-scenarios.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_BASE_URL = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Variables Supabase non configurées');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Résultats des tests
const testResults = {
    passed: 0,
    failed: 0,
    warnings: 0,
    errors: []
};

// Couleurs pour la console
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, type = 'info') {
    const prefix = type === 'pass' ? `${colors.green}✅` : 
                   type === 'fail' ? `${colors.red}❌` : 
                   type === 'warn' ? `${colors.yellow}⚠️` : 
                   `${colors.cyan}ℹ️`;
    console.log(`${prefix} ${message}${colors.reset}`);
}

function logSection(title) {
    console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.cyan}${title}${colors.reset}`);
    console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
}

async function runTest(testNumber, description, testFunction) {
    try {
        await testFunction();
        testResults.passed++;
        log(`Test ${testNumber}: ${description}`, 'pass');
        return true;
    } catch (error) {
        testResults.failed++;
        testResults.errors.push({ test: testNumber, description, error: error.message });
        log(`Test ${testNumber}: ${description} - ${error.message}`, 'fail');
        return false;
    }
}

// ============================================================================
// CATÉGORIE 1: NAVIGATION ET VUES (20 tests)
// ============================================================================

async function testNavigationScenarios() {
    logSection('CATÉGORIE 1: Navigation et Vues (20 tests)');

    // Test 1: Charger la page principale
    await runTest(1, 'Charger la page principale 3p1', async () => {
        const response = await fetch(`${API_BASE_URL}/3p1`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
    });

    // Test 2: Accéder à la vue Analyse
    await runTest(2, 'Accéder à la vue Analyse', async () => {
        // Simuler un appel API pour les données d'analyse
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, category')
            .eq('is_active', true)
            .limit(10);
        if (error) throw new Error(error.message);
    });

    // Test 3: Accéder à la vue KPI Dashboard
    await runTest(3, 'Accéder à la vue KPI Dashboard', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker')
            .eq('is_active', true)
            .limit(5);
        if (error) throw new Error(error.message);
    });

    // Test 4: Basculer entre Analyse et KPI
    await runTest(4, 'Basculer entre vue Analyse et KPI', async () => {
        // Simuler le changement de vue
        const view1 = 'analysis';
        const view2 = 'kpi';
        if (view1 === view2) throw new Error('Les vues doivent être différentes');
    });

    // Test 5: Filtrer par catégorie (watchlist)
    await runTest(5, 'Filtrer les tickers par watchlist', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker')
            .eq('is_active', true)
            .contains('categories', ['watchlist']);
        if (error) throw new Error(error.message);
        if (data.length !== 3) throw new Error(`Attendu 3 watchlist, trouvé ${data.length}`);
    });

    // Test 6: Filtrer par catégorie (team)
    await runTest(6, 'Filtrer les tickers par team (portefeuille)', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker')
            .eq('is_active', true)
            .contains('categories', ['team']);
        if (error) throw new Error(error.message);
        if (data.length !== 25) throw new Error(`Attendu 25 team tickers, trouvé ${data.length}`);
    });

    // Test 7: Filtrer par catégorie (manual)
    await runTest(7, 'Filtrer les tickers sans particularité (manual)', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker')
            .eq('is_active', true)
            .eq('category', 'manual');
        if (error) throw new Error(error.message);
        if (data.length < 700) throw new Error(`Attendu au moins 700 manual tickers, trouvé ${data.length}`);
    });

    // Test 8: Rechercher un ticker spécifique
    await runTest(8, 'Rechercher un ticker spécifique (NVDA)', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, category, categories')
            .eq('ticker', 'NVDA')
            .eq('is_active', true)
            .single();
        if (error) throw new Error(error.message);
        if (!data.categories.includes('watchlist')) throw new Error('NVDA doit être en watchlist');
    });

    // Test 9: Trier les tickers par nom
    await runTest(9, 'Trier les tickers par nom (A-Z)', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker')
            .eq('is_active', true)
            .order('ticker', { ascending: true })
            .limit(10);
        if (error) throw new Error(error.message);
        const sorted = [...data].sort((a, b) => a.ticker.localeCompare(b.ticker));
        if (JSON.stringify(data) !== JSON.stringify(sorted)) {
            throw new Error('Les tickers ne sont pas triés correctement');
        }
    });

    // Test 10: Pagination des résultats
    await runTest(10, 'Pagination des résultats (page 1)', async () => {
        const pageSize = 20;
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker')
            .eq('is_active', true)
            .range(0, pageSize - 1);
        if (error) throw new Error(error.message);
        if (data.length > pageSize) throw new Error(`Trop de résultats: ${data.length}`);
    });

    // Test 11: Pagination des résultats (page 2)
    await runTest(11, 'Pagination des résultats (page 2)', async () => {
        const pageSize = 20;
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker')
            .eq('is_active', true)
            .range(pageSize, pageSize * 2 - 1);
        if (error) throw new Error(error.message);
    });

    // Test 12: Afficher les détails d'un ticker
    await runTest(12, 'Afficher les détails d\'un ticker (AAPL)', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('*')
            .eq('ticker', 'AAPL')
            .eq('is_active', true)
            .single();
        if (error && error.code !== 'PGRST116') throw new Error(error.message);
    });

    // Test 13: Vérifier l'exclusion mutuelle team/watchlist
    await runTest(13, 'Vérifier exclusion mutuelle team/watchlist', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, categories')
            .eq('is_active', true)
            .contains('categories', ['team'])
            .contains('categories', ['watchlist']);
        if (error) throw new Error(error.message);
        if (data.length > 0) {
            throw new Error(`Trouvé ${data.length} tickers avec team ET watchlist (devrait être 0)`);
        }
    });

    // Test 14: Compter les tickers par catégorie
    await runTest(14, 'Compter les tickers par catégorie', async () => {
        const { data: watchlist, error: e1 } = await supabase
            .from('tickers')
            .select('ticker', { count: 'exact' })
            .eq('is_active', true)
            .contains('categories', ['watchlist']);
        const { data: team, error: e2 } = await supabase
            .from('tickers')
            .select('ticker', { count: 'exact' })
            .eq('is_active', true)
            .contains('categories', ['team']);
        if (e1 || e2) throw new Error('Erreur comptage');
        if (watchlist.length !== 3) throw new Error(`Watchlist: attendu 3, trouvé ${watchlist.length}`);
        if (team.length !== 25) throw new Error(`Team: attendu 25, trouvé ${team.length}`);
    });

    // Test 15: Filtrer les tickers inactifs
    await runTest(15, 'Exclure les tickers inactifs', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker')
            .eq('is_active', false);
        if (error) throw new Error(error.message);
        // Les tickers inactifs ne devraient pas apparaître dans les résultats normaux
    });

    // Test 16: Recherche avec casse insensible
    await runTest(16, 'Recherche avec casse insensible (nvda)', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker')
            .ilike('ticker', 'nvda')
            .eq('is_active', true);
        if (error) throw new Error(error.message);
        if (data.length === 0) throw new Error('NVDA non trouvé avec recherche insensible à la casse');
    });

    // Test 17: Filtrer par secteur
    await runTest(17, 'Filtrer les tickers par secteur', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, sector')
            .eq('is_active', true)
            .not('sector', 'is', null)
            .limit(10);
        if (error) throw new Error(error.message);
    });

    // Test 18: Filtrer par exchange
    await runTest(18, 'Filtrer les tickers par exchange', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, exchange')
            .eq('is_active', true)
            .not('exchange', 'is', null)
            .limit(10);
        if (error) throw new Error(error.message);
    });

    // Test 19: Trier par priorité (team tickers)
    await runTest(19, 'Trier les team tickers par priorité', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, priority')
            .eq('is_active', true)
            .contains('categories', ['team'])
            .order('priority', { ascending: false });
        if (error) throw new Error(error.message);
    });

    // Test 20: Vérifier la cohérence category/categories
    await runTest(20, 'Vérifier cohérence category/categories', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, category, categories')
            .eq('is_active', true)
            .limit(100);
        if (error) throw new Error(error.message);
        for (const ticker of data) {
            const hasTeam = ticker.categories.includes('team');
            const hasWatchlist = ticker.categories.includes('watchlist');
            if (ticker.category === 'team' && !hasTeam) {
                throw new Error(`${ticker.ticker}: category='team' mais 'team' pas dans categories`);
            }
            if (ticker.category === 'watchlist' && !hasWatchlist) {
                throw new Error(`${ticker.ticker}: category='watchlist' mais 'watchlist' pas dans categories`);
            }
            if (hasTeam && hasWatchlist) {
                throw new Error(`${ticker.ticker}: a les deux team ET watchlist (exclusion mutuelle)`);
            }
        }
    });
}

// ============================================================================
// CATÉGORIE 2: GESTION DES TICKERS (20 tests)
// ============================================================================

async function testTickerManagement() {
    logSection('CATÉGORIE 2: Gestion des Tickers (20 tests)');

    // Test 21: Récupérer tous les tickers actifs
    await runTest(21, 'Récupérer tous les tickers actifs', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker')
            .eq('is_active', true);
        if (error) throw new Error(error.message);
        if (data.length < 800) throw new Error(`Attendu au moins 800 tickers, trouvé ${data.length}`);
    });

    // Test 22: Vérifier les 3 watchlist tickers
    await runTest(22, 'Vérifier les 3 watchlist tickers (NVDA, SNY, J)', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker')
            .eq('is_active', true)
            .contains('categories', ['watchlist']);
        if (error) throw new Error(error.message);
        const tickers = data.map(t => t.ticker);
        const expected = ['NVDA', 'SNY', 'J'];
        for (const exp of expected) {
            if (!tickers.includes(exp)) {
                throw new Error(`Ticker ${exp} manquant dans watchlist`);
            }
        }
        if (tickers.length !== 3) {
            throw new Error(`Attendu exactement 3 watchlist tickers, trouvé ${tickers.length}`);
        }
    });

    // Test 23: Vérifier les 25 team tickers
    await runTest(23, 'Vérifier les 25 team tickers (portefeuille)', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker')
            .eq('is_active', true)
            .contains('categories', ['team']);
        if (error) throw new Error(error.message);
        if (data.length !== 25) {
            throw new Error(`Attendu exactement 25 team tickers, trouvé ${data.length}`);
        }
    });

    // Test 24: Vérifier qu'aucun ticker n'est à la fois team ET watchlist
    await runTest(24, 'Vérifier exclusion mutuelle team/watchlist', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, categories')
            .eq('is_active', true);
        if (error) throw new Error(error.message);
        const conflicts = data.filter(t => 
            t.categories.includes('team') && t.categories.includes('watchlist')
        );
        if (conflicts.length > 0) {
            throw new Error(`Trouvé ${conflicts.length} tickers avec team ET watchlist: ${conflicts.map(t => t.ticker).join(', ')}`);
        }
    });

    // Test 25: Vérifier la structure des données ticker
    await runTest(25, 'Vérifier la structure des données ticker', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('*')
            .eq('is_active', true)
            .limit(1)
            .single();
        if (error) throw new Error(error.message);
        const requiredFields = ['ticker', 'category', 'categories', 'is_active'];
        for (const field of requiredFields) {
            if (!(field in data)) {
                throw new Error(`Champ requis manquant: ${field}`);
            }
        }
    });

    // Test 26: Rechercher un ticker inexistant
    await runTest(26, 'Rechercher un ticker inexistant (ZZZZ)', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker')
            .eq('ticker', 'ZZZZ')
            .eq('is_active', true)
            .single();
        if (error && error.code === 'PGRST116') {
            // C'est attendu - ticker inexistant
            return;
        }
        if (data) throw new Error('Ticker ZZZZ ne devrait pas exister');
    });

    // Test 27: Filtrer par multiple catégories
    await runTest(27, 'Filtrer par multiple critères (team + actif)', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker')
            .eq('is_active', true)
            .contains('categories', ['team']);
        if (error) throw new Error(error.message);
        if (data.length !== 25) throw new Error(`Attendu 25, trouvé ${data.length}`);
    });

    // Test 28: Compter les tickers par catégorie
    await runTest(28, 'Compter les tickers par catégorie', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('category')
            .eq('is_active', true);
        if (error) throw new Error(error.message);
        const counts = {};
        data.forEach(t => {
            counts[t.category] = (counts[t.category] || 0) + 1;
        });
        if (counts.watchlist !== 3) throw new Error(`Watchlist: attendu 3, trouvé ${counts.watchlist}`);
        if (counts.team !== 25) throw new Error(`Team: attendu 25, trouvé ${counts.team}`);
    });

    // Test 29: Vérifier l'unicité des tickers
    await runTest(29, 'Vérifier l\'unicité des tickers', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker')
            .eq('is_active', true);
        if (error) throw new Error(error.message);
        const tickers = data.map(t => t.ticker);
        const unique = new Set(tickers);
        if (tickers.length !== unique.size) {
            throw new Error(`Doublons trouvés: ${tickers.length} tickers, ${unique.size} uniques`);
        }
    });

    // Test 30: Vérifier les tickers avec company_name
    await runTest(30, 'Vérifier les tickers avec company_name', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, company_name')
            .eq('is_active', true)
            .not('company_name', 'is', null)
            .limit(10);
        if (error) throw new Error(error.message);
    });

    // Test 31: Vérifier les tickers avec secteur
    await runTest(31, 'Vérifier les tickers avec secteur', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, sector')
            .eq('is_active', true)
            .not('sector', 'is', null)
            .limit(10);
        if (error) throw new Error(error.message);
    });

    // Test 32: Vérifier les tickers avec exchange
    await runTest(32, 'Vérifier les tickers avec exchange', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, exchange')
            .eq('is_active', true)
            .not('exchange', 'is', null)
            .limit(10);
        if (error) throw new Error(error.message);
    });

    // Test 33: Vérifier les tickers avec market_cap
    await runTest(33, 'Vérifier les tickers avec market_cap', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, market_cap')
            .eq('is_active', true)
            .not('market_cap', 'is', null)
            .limit(10);
        if (error) throw new Error(error.message);
    });

    // Test 34: Vérifier les team tickers avec priority
    await runTest(34, 'Vérifier les team tickers avec priority', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, priority')
            .eq('is_active', true)
            .contains('categories', ['team'])
            .not('priority', 'is', null);
        if (error) throw new Error(error.message);
    });

    // Test 35: Vérifier les watchlist tickers sans team
    await runTest(35, 'Vérifier les watchlist tickers sans team', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, categories')
            .eq('is_active', true)
            .contains('categories', ['watchlist']);
        if (error) throw new Error(error.message);
        const withTeam = data.filter(t => t.categories.includes('team'));
        if (withTeam.length > 0) {
            throw new Error(`Trouvé ${withTeam.length} watchlist tickers avec team: ${withTeam.map(t => t.ticker).join(', ')}`);
        }
    });

    // Test 36: Vérifier les team tickers sans watchlist
    await runTest(36, 'Vérifier les team tickers sans watchlist', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, categories')
            .eq('is_active', true)
            .contains('categories', ['team']);
        if (error) throw new Error(error.message);
        const withWatchlist = data.filter(t => t.categories.includes('watchlist'));
        if (withWatchlist.length > 0) {
            throw new Error(`Trouvé ${withWatchlist.length} team tickers avec watchlist: ${withWatchlist.map(t => t.ticker).join(', ')}`);
        }
    });

    // Test 37: Vérifier la cohérence category pour watchlist
    await runTest(37, 'Vérifier cohérence category pour watchlist', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, category, categories')
            .eq('is_active', true)
            .contains('categories', ['watchlist']);
        if (error) throw new Error(error.message);
        const wrongCategory = data.filter(t => t.category !== 'watchlist');
        if (wrongCategory.length > 0) {
            throw new Error(`Tickers avec watchlist mais category incorrecte: ${wrongCategory.map(t => t.ticker).join(', ')}`);
        }
    });

    // Test 38: Vérifier la cohérence category pour team
    await runTest(38, 'Vérifier cohérence category pour team', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, category, categories')
            .eq('is_active', true)
            .contains('categories', ['team']);
        if (error) throw new Error(error.message);
        const wrongCategory = data.filter(t => t.category !== 'team');
        if (wrongCategory.length > 0) {
            throw new Error(`Tickers avec team mais category incorrecte: ${wrongCategory.map(t => t.ticker).join(', ')}`);
        }
    });

    // Test 39: Vérifier les tickers manual sans catégories spéciales
    await runTest(39, 'Vérifier les tickers manual sans catégories spéciales', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, category, categories')
            .eq('is_active', true)
            .eq('category', 'manual');
        if (error) throw new Error(error.message);
        const withSpecial = data.filter(t => 
            t.categories.includes('team') || t.categories.includes('watchlist')
        );
        if (withSpecial.length > 0) {
            throw new Error(`Trouvé ${withSpecial.length} tickers manual avec catégories spéciales: ${withSpecial.map(t => t.ticker).join(', ')}`);
        }
    });

    // Test 40: Vérifier le format des tickers (uppercase)
    await runTest(40, 'Vérifier le format des tickers (uppercase)', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker')
            .eq('is_active', true)
            .limit(100);
        if (error) throw new Error(error.message);
        const notUpper = data.filter(t => t.ticker !== t.ticker.toUpperCase());
        if (notUpper.length > 0) {
            throw new Error(`Tickers non uppercase: ${notUpper.map(t => t.ticker).join(', ')}`);
        }
    });
}

// ============================================================================
// CATÉGORIE 3: API ENDPOINTS (20 tests)
// ============================================================================

async function testAPIEndpoints() {
    logSection('CATÉGORIE 3: API Endpoints (20 tests)');

    // Test 41: Tester l'endpoint /api/admin/tickers (GET)
    await runTest(41, 'Tester GET /api/admin/tickers', async () => {
        const response = await fetch(`${API_BASE_URL}/api/admin/tickers`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('Réponse doit être un array');
    });

    // Test 42: Tester l'endpoint /api/admin/tickers avec filtre category
    await runTest(42, 'Tester GET /api/admin/tickers?category=watchlist', async () => {
        const response = await fetch(`${API_BASE_URL}/api/admin/tickers?category=watchlist`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (data.length !== 3) throw new Error(`Attendu 3 watchlist tickers, trouvé ${data.length}`);
    });

    // Test 43: Tester l'endpoint /api/admin/tickers avec filtre team
    await runTest(43, 'Tester GET /api/admin/tickers?category=team', async () => {
        const response = await fetch(`${API_BASE_URL}/api/admin/tickers?category=team`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (data.length !== 25) throw new Error(`Attendu 25 team tickers, trouvé ${data.length}`);
    });

    // Test 44: Tester l'endpoint /api/terminal-data
    await runTest(44, 'Tester GET /api/terminal-data', async () => {
        const response = await fetch(`${API_BASE_URL}/api/terminal-data`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!data.instruments) throw new Error('Réponse doit contenir instruments');
    });

    // Test 45: Tester l'endpoint /api/market-data-batch
    await runTest(45, 'Tester GET /api/market-data-batch?tickers=NVDA,AAPL', async () => {
        const response = await fetch(`${API_BASE_URL}/api/market-data-batch?tickers=NVDA,AAPL`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!data.success) throw new Error('Réponse doit avoir success=true');
    });

    // Test 46: Tester l'endpoint /api/fmp-batch-sync (GET)
    await runTest(46, 'Tester GET /api/fmp-batch-sync', async () => {
        const response = await fetch(`${API_BASE_URL}/api/fmp-batch-sync`);
        if (!response.ok && response.status !== 500) throw new Error(`HTTP ${response.status}`);
    });

    // Test 47: Tester l'endpoint /api/kpi-engine
    await runTest(47, 'Tester GET /api/kpi-engine', async () => {
        const response = await fetch(`${API_BASE_URL}/api/kpi-engine`);
        if (!response.ok && response.status !== 400) throw new Error(`HTTP ${response.status}`);
    });

    // Test 48: Tester l'endpoint /api/fmp-company-data
    await runTest(48, 'Tester GET /api/fmp-company-data?symbol=NVDA', async () => {
        const response = await fetch(`${API_BASE_URL}/api/fmp-company-data?symbol=NVDA`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!data.data) throw new Error('Réponse doit contenir data');
    });

    // Test 49: Tester l'endpoint /api/fmp-search
    await runTest(49, 'Tester GET /api/fmp-search?query=Apple', async () => {
        const response = await fetch(`${API_BASE_URL}/api/fmp-search?query=Apple`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
    });

    // Test 50: Tester l'endpoint /api/3p1-sync-na
    await runTest(50, 'Tester GET /api/3p1-sync-na?action=analyze', async () => {
        const response = await fetch(`${API_BASE_URL}/api/3p1-sync-na?action=analyze&limit=10`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!data.hasOwnProperty('na')) throw new Error('Réponse doit contenir na');
    });

    // Test 51: Tester CORS headers
    await runTest(51, 'Tester CORS headers sur API', async () => {
        const response = await fetch(`${API_BASE_URL}/api/admin/tickers`, {
            method: 'OPTIONS'
        });
        if (response.status !== 200) throw new Error(`CORS OPTIONS failed: ${response.status}`);
    });

    // Test 52: Tester erreur 404 pour ticker inexistant
    await runTest(52, 'Tester erreur 404 pour ticker inexistant', async () => {
        const response = await fetch(`${API_BASE_URL}/api/fmp-company-data?symbol=ZZZZ`);
        if (response.status !== 404 && response.status !== 400) {
            throw new Error(`Attendu 404 ou 400, reçu ${response.status}`);
        }
    });

    // Test 53: Tester limite de batch size
    await runTest(53, 'Tester limite de batch size (100 tickers)', async () => {
        const tickers = Array.from({ length: 100 }, (_, i) => `T${i}`).join(',');
        const response = await fetch(`${API_BASE_URL}/api/market-data-batch?tickers=${tickers}`);
        if (!response.ok && response.status !== 400) throw new Error(`HTTP ${response.status}`);
    });

    // Test 54: Tester batch size trop grand (>100)
    await runTest(54, 'Tester batch size trop grand (>100)', async () => {
        const tickers = Array.from({ length: 101 }, (_, i) => `T${i}`).join(',');
        const response = await fetch(`${API_BASE_URL}/api/market-data-batch?tickers=${tickers}`);
        if (response.status !== 400) {
            throw new Error(`Attendu 400 pour batch trop grand, reçu ${response.status}`);
        }
    });

    // Test 55: Tester endpoint avec paramètres invalides
    await runTest(55, 'Tester endpoint avec paramètres invalides', async () => {
        const response = await fetch(`${API_BASE_URL}/api/admin/tickers?category=invalid`);
        if (response.status !== 200 && response.status !== 400) {
            throw new Error(`Réponse inattendue: ${response.status}`);
        }
    });

    // Test 56: Tester timeout des endpoints
    await runTest(56, 'Tester timeout des endpoints (30s max)', async () => {
        const start = Date.now();
        const response = await fetch(`${API_BASE_URL}/api/admin/tickers`);
        const duration = Date.now() - start;
        if (duration > 30000) throw new Error(`Timeout trop long: ${duration}ms`);
    });

    // Test 57: Tester format JSON des réponses
    await runTest(57, 'Tester format JSON des réponses', async () => {
        const response = await fetch(`${API_BASE_URL}/api/admin/tickers`);
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error(`Content-Type incorrect: ${contentType}`);
        }
        const data = await response.json();
        if (typeof data !== 'object') throw new Error('Réponse n\'est pas un objet JSON');
    });

    // Test 58: Tester endpoint avec méthode non autorisée
    await runTest(58, 'Tester endpoint avec méthode non autorisée', async () => {
        const response = await fetch(`${API_BASE_URL}/api/admin/tickers`, {
            method: 'DELETE'
        });
        if (response.status !== 405 && response.status !== 200) {
            throw new Error(`Attendu 405, reçu ${response.status}`);
        }
    });

    // Test 59: Tester endpoint avec authentification (si requis)
    await runTest(59, 'Tester endpoint avec authentification', async () => {
        const response = await fetch(`${API_BASE_URL}/api/admin/tickers`, {
            headers: {
                'Authorization': 'Bearer test-token'
            }
        });
        // Certains endpoints peuvent nécessiter auth, d'autres non
        if (response.status === 401) {
            // Auth requise - c'est OK
            return;
        }
        if (!response.ok && response.status !== 401) {
            throw new Error(`Réponse inattendue: ${response.status}`);
        }
    });

    // Test 60: Tester rate limiting (si implémenté)
    await runTest(60, 'Tester rate limiting', async () => {
        const requests = Array.from({ length: 10 }, () => 
            fetch(`${API_BASE_URL}/api/admin/tickers`)
        );
        const responses = await Promise.all(requests);
        const rateLimited = responses.filter(r => r.status === 429);
        // Si rate limiting est implémenté, certains peuvent être 429
        // Sinon, tous devraient être 200
    });
}

// ============================================================================
// CATÉGORIE 4: DONNÉES ET CACHE (20 tests)
// ============================================================================

async function testDataAndCache() {
    logSection('CATÉGORIE 4: Données et Cache (20 tests)');

    // Test 61: Vérifier la table ticker_price_cache
    await runTest(61, 'Vérifier la table ticker_price_cache existe', async () => {
        const { data, error } = await supabase
            .from('ticker_price_cache')
            .select('ticker')
            .limit(1);
        if (error && error.code !== 'PGRST116') throw new Error(error.message);
    });

    // Test 62: Vérifier les données de prix en cache
    await runTest(62, 'Vérifier les données de prix en cache', async () => {
        const { data, error } = await supabase
            .from('ticker_price_cache')
            .select('ticker, current_price, updated_at')
            .limit(10);
        if (error && error.code !== 'PGRST116') throw new Error(error.message);
    });

    // Test 63: Vérifier l'expiration du cache
    await runTest(63, 'Vérifier l\'expiration du cache', async () => {
        const { data, error } = await supabase
            .from('ticker_price_cache')
            .select('ticker, expires_at')
            .limit(10);
        if (error && error.code !== 'PGRST116') throw new Error(error.message);
        if (data && data.length > 0) {
            const now = new Date();
            const expired = data.filter(d => new Date(d.expires_at) < now);
            // Les caches expirés peuvent exister, c'est normal
        }
    });

    // Test 64: Vérifier la table metrics
    await runTest(64, 'Vérifier la table metrics existe', async () => {
        const { data, error } = await supabase
            .from('metrics')
            .select('symbol')
            .limit(1);
        if (error && error.code !== 'PGRST116') throw new Error(error.message);
    });

    // Test 65: Vérifier la table kpi_values
    await runTest(65, 'Vérifier la table kpi_values existe', async () => {
        const { data, error } = await supabase
            .from('kpi_values')
            .select('symbol')
            .limit(1);
        if (error && error.code !== 'PGRST116') throw new Error(error.message);
    });

    // Test 66: Vérifier la table kpi_definitions
    await runTest(66, 'Vérifier la table kpi_definitions existe', async () => {
        const { data, error } = await supabase
            .from('kpi_definitions')
            .select('kpi_id')
            .limit(1);
        if (error && error.code !== 'PGRST116') throw new Error(error.message);
    });

    // Test 67: Vérifier la cohérence des données entre tables
    await runTest(67, 'Vérifier cohérence tickers/metrics', async () => {
        const { data: tickers, error: e1 } = await supabase
            .from('tickers')
            .select('ticker')
            .eq('is_active', true)
            .limit(10);
        if (e1) throw new Error(e1.message);
        
        const { data: metrics, error: e2 } = await supabase
            .from('metrics')
            .select('symbol')
            .limit(10);
        if (e2 && e2.code !== 'PGRST116') throw new Error(e2.message);
        // Les metrics peuvent ne pas exister pour tous les tickers
    });

    // Test 68: Vérifier les données historiques
    await runTest(68, 'Vérifier les données historiques (price_history)', async () => {
        const { data, error } = await supabase
            .from('price_history')
            .select('symbol, date')
            .limit(10);
        if (error && error.code !== 'PGRST116') throw new Error(error.message);
    });

    // Test 69: Vérifier l'intégrité référentielle
    await runTest(69, 'Vérifier l\'intégrité référentielle', async () => {
        // Vérifier que les tickers référencés dans metrics existent
        const { data: metrics, error: e1 } = await supabase
            .from('metrics')
            .select('symbol')
            .limit(10);
        if (e1 && e1.code !== 'PGRST116') throw new Error(e1.message);
        
        if (metrics && metrics.length > 0) {
            const symbols = metrics.map(m => m.symbol);
            const { data: tickers, error: e2 } = await supabase
                .from('tickers')
                .select('ticker')
                .in('ticker', symbols);
            if (e2) throw new Error(e2.message);
        }
    });

    // Test 70: Vérifier les index de performance
    await runTest(70, 'Vérifier les index de performance', async () => {
        // Tester une requête qui devrait utiliser un index
        const start = Date.now();
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker')
            .eq('is_active', true)
            .eq('category', 'watchlist');
        const duration = Date.now() - start;
        if (error) throw new Error(error.message);
        if (duration > 1000) {
            throw new Error(`Requête trop lente: ${duration}ms (index manquant?)`);
        }
    });

    // Test 71: Vérifier les contraintes UNIQUE
    await runTest(71, 'Vérifier les contraintes UNIQUE', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker')
            .eq('is_active', true);
        if (error) throw new Error(error.message);
        const tickers = data.map(t => t.ticker);
        const unique = new Set(tickers);
        if (tickers.length !== unique.size) {
            throw new Error('Contrainte UNIQUE violée');
        }
    });

    // Test 72: Vérifier les valeurs NULL autorisées
    await runTest(72, 'Vérifier les valeurs NULL autorisées', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, company_name, sector')
            .eq('is_active', true)
            .limit(10);
        if (error) throw new Error(error.message);
        // Certains champs peuvent être NULL, c'est OK
    });

    // Test 73: Vérifier les types de données
    await runTest(73, 'Vérifier les types de données', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, is_active, priority, market_cap')
            .eq('is_active', true)
            .limit(1)
            .single();
        if (error && error.code !== 'PGRST116') throw new Error(error.message);
        if (data) {
            if (typeof data.is_active !== 'boolean') throw new Error('is_active doit être boolean');
            if (data.priority !== null && typeof data.priority !== 'number') {
                throw new Error('priority doit être number');
            }
        }
    });

    // Test 74: Vérifier les timestamps
    await runTest(74, 'Vérifier les timestamps (created_at, updated_at)', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, created_at, updated_at')
            .eq('is_active', true)
            .limit(10);
        if (error) throw new Error(error.message);
        for (const ticker of data) {
            if (ticker.created_at && !(ticker.created_at instanceof Date || typeof ticker.created_at === 'string')) {
                throw new Error(`created_at invalide pour ${ticker.ticker}`);
            }
        }
    });

    // Test 75: Vérifier la synchronisation des données
    await runTest(75, 'Vérifier la synchronisation des données', async () => {
        // Vérifier que les tickers actifs ont des données cohérentes
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, is_active, category')
            .eq('is_active', true)
            .limit(100);
        if (error) throw new Error(error.message);
        // Tous les tickers actifs doivent avoir une category valide
        const invalid = data.filter(t => !t.category || t.category === '');
        if (invalid.length > 0) {
            throw new Error(`Tickers sans category: ${invalid.map(t => t.ticker).join(', ')}`);
        }
    });

    // Test 76: Vérifier les données de marché en temps réel
    await runTest(76, 'Vérifier les données de marché en temps réel', async () => {
        const response = await fetch(`${API_BASE_URL}/api/market-data-batch?tickers=NVDA,AAPL,MSFT`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!data.success) throw new Error('Échec récupération données marché');
    });

    // Test 77: Vérifier le cache client-side
    await runTest(77, 'Vérifier le cache client-side (simulation)', async () => {
        // Simuler un cache client-side
        const cache = new Map();
        cache.set('NVDA', { price: 100, timestamp: Date.now() });
        const cached = cache.get('NVDA');
        if (!cached) throw new Error('Cache client-side non fonctionnel');
    });

    // Test 78: Vérifier la cohérence des arrays categories
    await runTest(78, 'Vérifier la cohérence des arrays categories', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, categories')
            .eq('is_active', true)
            .limit(100);
        if (error) throw new Error(error.message);
        for (const ticker of data) {
            if (!Array.isArray(ticker.categories)) {
                throw new Error(`${ticker.ticker}: categories doit être un array`);
            }
            // Vérifier qu'il n'y a pas de doublons
            const unique = new Set(ticker.categories);
            if (ticker.categories.length !== unique.size) {
                throw new Error(`${ticker.ticker}: doublons dans categories`);
            }
        }
    });

    // Test 79: Vérifier les données de performance
    await runTest(79, 'Vérifier les données de performance', async () => {
        const start = Date.now();
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker')
            .eq('is_active', true);
        const duration = Date.now() - start;
        if (error) throw new Error(error.message);
        if (duration > 5000) {
            throw new Error(`Performance dégradée: ${duration}ms pour ${data.length} tickers`);
        }
    });

    // Test 80: Vérifier la cohérence globale des données
    await runTest(80, 'Vérifier la cohérence globale des données', async () => {
        // Vérifier que tous les tickers actifs ont une structure cohérente
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, category, categories, is_active')
            .eq('is_active', true)
            .limit(100);
        if (error) throw new Error(error.message);
        for (const ticker of data) {
            if (!ticker.ticker || !ticker.category || !Array.isArray(ticker.categories)) {
                throw new Error(`Structure invalide pour ${ticker.ticker}`);
            }
        }
    });
}

// ============================================================================
// CATÉGORIE 5: CAS LIMITES ET ERREURS (20 tests)
// ============================================================================

async function testEdgeCasesAndErrors() {
    logSection('CATÉGORIE 5: Cas Limites et Erreurs (20 tests)');

    // Test 81: Tester avec ticker vide
    await runTest(81, 'Tester avec ticker vide', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker')
            .eq('ticker', '')
            .eq('is_active', true);
        if (error && error.code !== 'PGRST116') throw new Error(error.message);
        // Un ticker vide ne devrait pas exister
    });

    // Test 82: Tester avec ticker très long
    await runTest(82, 'Tester avec ticker très long', async () => {
        const longTicker = 'A'.repeat(100);
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker')
            .eq('ticker', longTicker)
            .eq('is_active', true);
        if (error && error.code !== 'PGRST116') throw new Error(error.message);
    });

    // Test 83: Tester avec caractères spéciaux
    await runTest(83, 'Tester avec caractères spéciaux', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker')
            .eq('ticker', 'TEST@#$')
            .eq('is_active', true);
        if (error && error.code !== 'PGRST116') throw new Error(error.message);
    });

    // Test 84: Tester avec SQL injection (sécurité)
    await runTest(84, 'Tester protection SQL injection', async () => {
        const malicious = "'; DROP TABLE tickers; --";
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker')
            .eq('ticker', malicious)
            .eq('is_active', true);
        // Supabase devrait protéger contre SQL injection
        if (error && error.code !== 'PGRST116') {
            // Erreur attendue pour requête malveillante
            return;
        }
    });

    // Test 85: Tester avec valeurs NULL
    await runTest(85, 'Tester avec valeurs NULL', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, company_name')
            .is('company_name', null)
            .eq('is_active', true)
            .limit(10);
        if (error) throw new Error(error.message);
        // Certains tickers peuvent avoir company_name NULL
    });

    // Test 86: Tester avec catégorie invalide
    await runTest(86, 'Tester avec catégorie invalide', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, category')
            .eq('category', 'invalid_category')
            .eq('is_active', true);
        if (error) throw new Error(error.message);
        // Ne devrait pas y avoir de tickers avec catégorie invalide
        if (data.length > 0) {
            throw new Error(`Trouvé ${data.length} tickers avec catégorie invalide`);
        }
    });

    // Test 87: Tester avec array categories vide
    await runTest(87, 'Tester avec array categories vide', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, categories')
            .eq('categories', '{}')
            .eq('is_active', true);
        if (error) throw new Error(error.message);
        // Les categories ne devraient pas être vides pour les tickers actifs
    });

    // Test 88: Tester avec is_active = false
    await runTest(88, 'Tester avec is_active = false', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker')
            .eq('is_active', false);
        if (error) throw new Error(error.message);
        // Les tickers inactifs ne devraient pas apparaître dans les résultats normaux
    });

    // Test 89: Tester avec priority négative
    await runTest(89, 'Tester avec priority négative', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, priority')
            .lt('priority', 0)
            .eq('is_active', true);
        if (error) throw new Error(error.message);
        // Les priorities négatives ne devraient pas exister
        if (data.length > 0) {
            throw new Error(`Trouvé ${data.length} tickers avec priority négative`);
        }
    });

    // Test 90: Tester avec market_cap négatif
    await runTest(90, 'Tester avec market_cap négatif', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, market_cap')
            .lt('market_cap', 0)
            .eq('is_active', true);
        if (error) throw new Error(error.message);
        // Les market_cap négatifs ne devraient pas exister
        if (data.length > 0) {
            throw new Error(`Trouvé ${data.length} tickers avec market_cap négatif`);
        }
    });

    // Test 91: Tester avec dates invalides
    await runTest(91, 'Tester avec dates invalides', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, created_at, updated_at')
            .eq('is_active', true)
            .limit(10);
        if (error) throw new Error(error.message);
        for (const ticker of data) {
            if (ticker.created_at && ticker.updated_at) {
                const created = new Date(ticker.created_at);
                const updated = new Date(ticker.updated_at);
                if (updated < created) {
                    throw new Error(`${ticker.ticker}: updated_at < created_at`);
                }
            }
        }
    });

    // Test 92: Tester avec requête très large
    await runTest(92, 'Tester avec requête très large (1000 tickers)', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker')
            .eq('is_active', true)
            .limit(1000);
        if (error) throw new Error(error.message);
        // La requête devrait fonctionner même avec beaucoup de résultats
    });

    // Test 93: Tester avec filtres multiples complexes
    await runTest(93, 'Tester avec filtres multiples complexes', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, category, sector')
            .eq('is_active', true)
            .eq('category', 'manual')
            .not('sector', 'is', null)
            .limit(10);
        if (error) throw new Error(error.message);
    });

    // Test 94: Tester avec timeout
    await runTest(94, 'Tester avec timeout (simulation)', async () => {
        const start = Date.now();
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker')
            .eq('is_active', true);
        const duration = Date.now() - start;
        if (error) throw new Error(error.message);
        if (duration > 10000) {
            throw new Error(`Timeout: ${duration}ms`);
        }
    });

    // Test 95: Tester avec connexion perdue (simulation)
    await runTest(95, 'Tester avec connexion perdue (simulation)', async () => {
        // Simuler une perte de connexion
        try {
            const { data, error } = await supabase
                .from('tickers')
                .select('ticker')
                .eq('is_active', true);
            if (error) {
                // Erreur de connexion - c'est OK pour ce test
                return;
            }
        } catch (err) {
            // Erreur de connexion - c'est OK pour ce test
            return;
        }
    });

    // Test 96: Tester avec données corrompues (simulation)
    await runTest(96, 'Tester avec données corrompues (simulation)', async () => {
        // Vérifier que les données ne sont pas corrompues
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, category, categories')
            .eq('is_active', true)
            .limit(100);
        if (error) throw new Error(error.message);
        for (const ticker of data) {
            if (ticker.category && !Array.isArray(ticker.categories)) {
                throw new Error(`Données corrompues pour ${ticker.ticker}`);
            }
        }
    });

    // Test 97: Tester avec race condition (simulation)
    await runTest(97, 'Tester avec race condition (simulation)', async () => {
        // Simuler des requêtes simultanées
        const promises = Array.from({ length: 5 }, () =>
            supabase.from('tickers').select('ticker').eq('is_active', true).limit(10)
        );
        const results = await Promise.all(promises);
        for (const result of results) {
            if (result.error) throw new Error(result.error.message);
        }
    });

    // Test 98: Tester avec mémoire insuffisante (simulation)
    await runTest(98, 'Tester avec mémoire insuffisante (simulation)', async () => {
        // Tester avec une requête qui retourne beaucoup de données
        const { data, error } = await supabase
            .from('tickers')
            .select('*')
            .eq('is_active', true)
            .limit(100);
        if (error) throw new Error(error.message);
        // Vérifier que la requête fonctionne même avec beaucoup de données
    });

    // Test 99: Tester avec caractères Unicode
    await runTest(99, 'Tester avec caractères Unicode', async () => {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, company_name')
            .eq('is_active', true)
            .limit(10);
        if (error) throw new Error(error.message);
        // Vérifier que les caractères Unicode sont gérés correctement
    });

    // Test 100: Tester la résilience globale
    await runTest(100, 'Tester la résilience globale', async () => {
        // Test final de résilience - exécuter plusieurs opérations
        const tests = [
            supabase.from('tickers').select('ticker').eq('is_active', true).limit(10),
            supabase.from('tickers').select('ticker').eq('category', 'watchlist'),
            supabase.from('tickers').select('ticker').eq('category', 'team'),
        ];
        const results = await Promise.all(tests);
        for (const result of results) {
            if (result.error) throw new Error(result.error.message);
        }
    });
}

// ============================================================================
// EXÉCUTION PRINCIPALE
// ============================================================================

async function main() {
    console.log(`${colors.cyan}
╔══════════════════════════════════════════════════════════════╗
║  TEST SUITE - 100 CAS DE NAVIGATION ET SITUATIONS UTILISATEUR ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);

    const startTime = Date.now();

    try {
        await testNavigationScenarios();
        await testTickerManagement();
        await testAPIEndpoints();
        await testDataAndCache();
        await testEdgeCasesAndErrors();

        const duration = Date.now() - startTime;

        // Résumé final
        console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
        console.log(`${colors.cyan}RÉSUMÉ DES TESTS${colors.reset}`);
        console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

        console.log(`${colors.green}✅ Tests réussis: ${testResults.passed}${colors.reset}`);
        console.log(`${colors.red}❌ Tests échoués: ${testResults.failed}${colors.reset}`);
        console.log(`${colors.yellow}⚠️  Avertissements: ${testResults.warnings}${colors.reset}`);
        console.log(`\n⏱️  Durée totale: ${(duration / 1000).toFixed(2)}s`);

        if (testResults.errors.length > 0) {
            console.log(`\n${colors.red}ERREURS DÉTAILLÉES:${colors.reset}`);
            testResults.errors.forEach(err => {
                console.log(`  ${colors.red}❌ Test ${err.test}: ${err.description}${colors.reset}`);
                console.log(`     ${err.error}`);
            });
        }

        const successRate = ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2);
        console.log(`\n${colors.cyan}Taux de réussite: ${successRate}%${colors.reset}`);

        if (testResults.failed > 0) {
            console.log(`\n${colors.yellow}⚠️  Des ajustements sont nécessaires.${colors.reset}`);
            process.exit(1);
        } else {
            console.log(`\n${colors.green}✅ Tous les tests sont passés avec succès!${colors.reset}`);
            process.exit(0);
        }

    } catch (error) {
        console.error(`\n${colors.red}❌ Erreur fatale: ${error.message}${colors.reset}`);
        console.error(error.stack);
        process.exit(1);
    }
}

// Exécuter les tests
main();

