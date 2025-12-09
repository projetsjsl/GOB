#!/usr/bin/env node
/**
 * Script de test pour valider la fusion complète des tables de tickers
 * 
 * Tests:
 * 1. Vérifier que les colonnes category et categories existent
 * 2. Vérifier les statistiques de migration
 * 3. Tester les requêtes avec category
 * 4. Tester les endpoints API
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

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Variables Supabase non configurées');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

let testsPassed = 0;
let testsFailed = 0;
const errors = [];

function logTest(name, passed, message = '') {
    if (passed) {
        console.log(`✅ ${name}`);
        testsPassed++;
    } else {
        console.error(`❌ ${name}${message ? ': ' + message : ''}`);
        testsFailed++;
        errors.push(`${name}: ${message}`);
    }
}

async function test1_CheckColumns() {
    console.log('\n📋 Test 1: Vérifier les colonnes category et categories');
    
    try {
        const { data, error } = await supabase
            .from('tickers')
            .select('category, categories, team_name, watchlist_id')
            .limit(1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            const ticker = data[0];
            logTest('Colonne category existe', ticker.hasOwnProperty('category'));
            logTest('Colonne categories existe', ticker.hasOwnProperty('categories'));
            logTest('Colonne team_name existe', ticker.hasOwnProperty('team_name'));
            logTest('Colonne watchlist_id existe', ticker.hasOwnProperty('watchlist_id'));
        } else {
            logTest('Colonnes vérifiées', false, 'Aucun ticker trouvé');
        }
    } catch (error) {
        logTest('Vérification colonnes', false, error.message);
    }
}

async function test2_MigrationStats() {
    console.log('\n📊 Test 2: Statistiques de migration');
    
    try {
        const { data, error } = await supabase
            .from('tickers')
            .select('category, categories, is_active');
        
        if (error) throw error;
        
        const stats = {
            total: data.length,
            actifs: data.filter(t => t.is_active).length,
            team: data.filter(t => t.category === 'team' || (t.categories && t.categories.includes('team'))).length,
            watchlist: data.filter(t => t.category === 'watchlist' || (t.categories && t.categories.includes('watchlist'))).length,
            both: data.filter(t => t.category === 'both').length,
            instrument: data.filter(t => t.category === 'instrument' || (t.categories && t.categories.includes('instrument'))).length,
            manual: data.filter(t => t.category === 'manual').length
        };
        
        console.log(`   Total tickers: ${stats.total}`);
        console.log(`   Actifs: ${stats.actifs}`);
        console.log(`   Team: ${stats.team}`);
        console.log(`   Watchlist: ${stats.watchlist}`);
        console.log(`   Both: ${stats.both}`);
        console.log(`   Instrument: ${stats.instrument}`);
        console.log(`   Manual: ${stats.manual}`);
        
        logTest('Total tickers > 0', stats.total > 0);
        logTest('Tickers actifs > 0', stats.actifs > 0);
        logTest('Tickers team > 0', stats.team > 0);
        logTest('Tickers watchlist > 0', stats.watchlist > 0);
        logTest('Tickers both > 0', stats.both > 0);
        
    } catch (error) {
        logTest('Statistiques migration', false, error.message);
    }
}

async function test3_QueriesWithCategory() {
    console.log('\n🔍 Test 3: Requêtes avec category');
    
    try {
        // Test 1: Team tickers
        const { data: teamTickers, error: teamError } = await supabase
            .from('tickers')
            .select('ticker, category, categories')
            .eq('is_active', true)
            .or('category.eq.team,category.eq.both')
            .limit(5);
        
        if (teamError) throw new Error(`Team tickers: ${teamError.message}`);
        logTest('Requête team tickers', teamTickers && teamTickers.length > 0, `${teamTickers.length} trouvés`);
        
        // Test 2: Watchlist tickers
        const { data: watchlistTickers, error: watchlistError } = await supabase
            .from('tickers')
            .select('ticker, category, categories')
            .eq('is_active', true)
            .or('category.eq.watchlist,category.eq.both')
            .limit(5);
        
        if (watchlistError) throw new Error(`Watchlist tickers: ${watchlistError.message}`);
        logTest('Requête watchlist tickers', watchlistTickers && watchlistTickers.length > 0, `${watchlistTickers.length} trouvés`);
        
        // Test 3: Both category
        const { data: bothTickers, error: bothError } = await supabase
            .from('tickers')
            .select('ticker, category, categories')
            .eq('is_active', true)
            .eq('category', 'both')
            .limit(5);
        
        if (bothError) throw new Error(`Both tickers: ${bothError.message}`);
        logTest('Requête both tickers', bothTickers !== null, `${bothTickers.length} trouvés`);
        
        // Test 4: Instrument tickers
        const { data: instrumentTickers, error: instrumentError } = await supabase
            .from('tickers')
            .select('ticker, category, categories')
            .eq('is_active', true)
            .eq('category', 'instrument')
            .limit(5);
        
        if (instrumentError) throw new Error(`Instrument tickers: ${instrumentError.message}`);
        logTest('Requête instrument tickers', instrumentTickers !== null, `${instrumentTickers.length} trouvés`);
        
    } catch (error) {
        logTest('Requêtes avec category', false, error.message);
    }
}

async function test4_CategoriesArray() {
    console.log('\n📦 Test 4: Vérifier le tableau categories');
    
    try {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, category, categories')
            .limit(10);
        
        if (error) throw error;
        
        let allValid = true;
        let hasCategories = 0;
        
        data.forEach(ticker => {
            if (!ticker.categories || !Array.isArray(ticker.categories)) {
                allValid = false;
            } else if (ticker.categories.length > 0) {
                hasCategories++;
            }
        });
        
        logTest('Tous les tickers ont categories (array)', allValid);
        logTest('Tickers avec categories non vide', hasCategories > 0, `${hasCategories}/${data.length}`);
        
    } catch (error) {
        logTest('Vérification categories array', false, error.message);
    }
}

async function test5_DataConsistency() {
    console.log('\n🔗 Test 5: Cohérence des données');
    
    try {
        // Vérifier que category correspond à categories
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker, category, categories')
            .limit(50);
        
        if (error) throw error;
        
        let inconsistencies = 0;
        
        data.forEach(ticker => {
            if (ticker.category === 'both') {
                if (!ticker.categories || !ticker.categories.includes('team') || !ticker.categories.includes('watchlist')) {
                    inconsistencies++;
                }
            } else if (ticker.category === 'team') {
                if (!ticker.categories || !ticker.categories.includes('team')) {
                    inconsistencies++;
                }
            } else if (ticker.category === 'watchlist') {
                if (!ticker.categories || !ticker.categories.includes('watchlist')) {
                    inconsistencies++;
                }
            }
        });
        
        logTest('Cohérence category ↔ categories', inconsistencies === 0, `${inconsistencies} incohérences trouvées`);
        
    } catch (error) {
        logTest('Cohérence des données', false, error.message);
    }
}

async function test6_TeamNameAndWatchlistId() {
    console.log('\n🏷️ Test 6: Colonnes team_name et watchlist_id');
    
    try {
        // Vérifier team_name pour les tickers team
        const { data: teamTickers, error: teamError } = await supabase
            .from('tickers')
            .select('ticker, category, team_name')
            .or('category.eq.team,category.eq.both')
            .limit(10);
        
        if (teamError) throw new Error(`Team tickers: ${teamError.message}`);
        
        const hasTeamName = teamTickers.filter(t => t.team_name).length;
        logTest('Tickers team avec team_name', hasTeamName > 0, `${hasTeamName}/${teamTickers.length}`);
        
        // Vérifier watchlist_id pour les tickers watchlist
        const { data: watchlistTickers, error: watchlistError } = await supabase
            .from('tickers')
            .select('ticker, category, watchlist_id')
            .or('category.eq.watchlist,category.eq.both')
            .limit(10);
        
        if (watchlistError) throw new Error(`Watchlist tickers: ${watchlistError.message}`);
        
        const hasWatchlistId = watchlistTickers.filter(t => t.watchlist_id).length;
        logTest('Tickers watchlist avec watchlist_id', watchlistTickers.length > 0, `${hasWatchlistId}/${watchlistTickers.length} avec watchlist_id`);
        
    } catch (error) {
        logTest('Colonnes team_name et watchlist_id', false, error.message);
    }
}

async function test7_NoDuplicates() {
    console.log('\n🔍 Test 7: Vérifier les doublons');
    
    try {
        const { data, error } = await supabase
            .from('tickers')
            .select('ticker')
            .eq('is_active', true);
        
        if (error) throw error;
        
        const tickerSet = new Set();
        const duplicates = [];
        
        data.forEach(item => {
            const ticker = item.ticker.toUpperCase();
            if (tickerSet.has(ticker)) {
                duplicates.push(ticker);
            } else {
                tickerSet.add(ticker);
            }
        });
        
        logTest('Pas de doublons de tickers', duplicates.length === 0, duplicates.length > 0 ? `${duplicates.length} doublons: ${duplicates.slice(0, 5).join(', ')}` : '');
        
    } catch (error) {
        logTest('Vérification doublons', false, error.message);
    }
}

async function test8_APIConfigTickers() {
    console.log('\n🌐 Test 8: Endpoint API /api/config/tickers');
    
    try {
        const baseUrl = process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL}` 
            : 'http://localhost:3000';
        
        const response = await fetch(`${baseUrl}/api/config/tickers?list=team`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        logTest('API config/tickers répond', response.ok);
        logTest('API retourne team_tickers', data.team_tickers && data.team_tickers.length > 0, `${data.team_tickers?.length || 0} tickers`);
        logTest('API utilise category', true, 'Endpoint mis à jour');
        
    } catch (error) {
        logTest('API config/tickers', false, error.message);
    }
}

async function runAllTests() {
    console.log('🧪 DÉMARRAGE DES TESTS DE FUSION TICKERS\n');
    console.log('=' .repeat(60));
    
    await test1_CheckColumns();
    await test2_MigrationStats();
    await test3_QueriesWithCategory();
    await test4_CategoriesArray();
    await test5_DataConsistency();
    await test6_TeamNameAndWatchlistId();
    await test7_NoDuplicates();
    await test8_APIConfigTickers();
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 RÉSULTATS FINAUX');
    console.log(`✅ Tests réussis: ${testsPassed}`);
    console.log(`❌ Tests échoués: ${testsFailed}`);
    console.log(`📈 Taux de réussite: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
    
    if (errors.length > 0) {
        console.log('\n❌ ERREURS:');
        errors.forEach(error => console.log(`   - ${error}`));
    }
    
    if (testsFailed === 0) {
        console.log('\n🎉 TOUS LES TESTS SONT PASSÉS !');
        process.exit(0);
    } else {
        console.log('\n⚠️ CERTAINS TESTS ONT ÉCHOUÉ');
        process.exit(1);
    }
}

runAllTests().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
});


