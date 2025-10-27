#!/usr/bin/env node

/**
 * Test de la table watchlist Supabase
 * Vérifie si la table existe avant de tester les autres fonctionnalités
 */

import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gob-watchlist.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key-here';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key-here';

console.log('🧪 TEST TABLE WATCHLIST SUPABASE');
console.log('═'.repeat(60));
console.log(`📍 URL: ${SUPABASE_URL}`);
console.log(`🔑 Anon Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
console.log(`🔑 Service Key: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`);
console.log('');

async function testWatchlistTable() {
    console.log('🔗 Test de la table watchlist...');
    
    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        // Test 1: Vérifier si la table existe
        console.log('\n📋 Test 1: Vérification existence table');
        try {
            const { data, error } = await supabase
                .from('watchlist')
                .select('*')
                .limit(1);
                
            if (error) {
                console.log('❌ Erreur:', error.message);
                
                if (error.message.includes('does not exist')) {
                    console.log('💡 La table watchlist n\'existe pas encore');
                    console.log('🔧 Solution: Exécutez supabase-watchlist-base.sql');
                    return false;
                }
                
                if (error.message.includes('column "ticker" does not exist')) {
                    console.log('💡 La table existe mais n\'a pas la colonne ticker');
                    console.log('🔧 Solution: Recréez la table avec le bon schéma');
                    return false;
                }
                
                return false;
            }
            
            console.log('✅ Table watchlist existe');
            console.log('📊 Enregistrements:', data?.length || 0);
            
        } catch (err) {
            console.log('❌ Erreur de connexion:', err.message);
            return false;
        }
        
        // Test 2: Vérifier la structure de la table
        console.log('\n📋 Test 2: Vérification structure');
        try {
            const { data, error } = await supabase
                .from('watchlist')
                .select('ticker, company_name, added_at')
                .limit(1);
                
            if (error) {
                console.log('❌ Erreur structure:', error.message);
                return false;
            }
            
            console.log('✅ Structure de table correcte');
            console.log('📊 Colonnes testées: ticker, company_name, added_at');
            
        } catch (err) {
            console.log('❌ Erreur structure:', err.message);
            return false;
        }
        
        // Test 3: Tester les opérations CRUD
        console.log('\n📋 Test 3: Opérations CRUD');
        try {
            // Test INSERT
            const { data: insertData, error: insertError } = await supabase
                .from('watchlist')
                .insert([
                    { ticker: 'TEST', company_name: 'Test Company', notes: 'Test entry' }
                ])
                .select();
                
            if (insertError) {
                console.log('❌ Erreur INSERT:', insertError.message);
                return false;
            }
            
            console.log('✅ INSERT réussi');
            
            // Test SELECT
            const { data: selectData, error: selectError } = await supabase
                .from('watchlist')
                .select('*')
                .eq('ticker', 'TEST');
                
            if (selectError) {
                console.log('❌ Erreur SELECT:', selectError.message);
                return false;
            }
            
            console.log('✅ SELECT réussi');
            console.log('📊 Données trouvées:', selectData?.length || 0);
            
            // Test DELETE (nettoyer)
            const { error: deleteError } = await supabase
                .from('watchlist')
                .delete()
                .eq('ticker', 'TEST');
                
            if (deleteError) {
                console.log('⚠️  Erreur DELETE:', deleteError.message);
            } else {
                console.log('✅ DELETE réussi (nettoyage)');
            }
            
        } catch (err) {
            console.log('❌ Erreur CRUD:', err.message);
            return false;
        }
        
        return true;
        
    } catch (err) {
        console.log('❌ Erreur générale:', err.message);
        return false;
    }
}

async function testOtherTables() {
    console.log('\n🔗 Test des autres tables Emma AI...');
    
    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        const tables = [
            'earnings_calendar',
            'pre_earnings_analysis',
            'earnings_results',
            'significant_news'
        ];
        
        for (const table of tables) {
            try {
                const { data, error } = await supabase
                    .from(table)
                    .select('*')
                    .limit(1);
                    
                if (error) {
                    console.log(`   ❌ ${table}: ${error.message}`);
                } else {
                    console.log(`   ✅ ${table}: OK`);
                }
            } catch (err) {
                console.log(`   ❌ ${table}: ${err.message}`);
            }
        }
        
    } catch (err) {
        console.log('❌ Erreur test autres tables:', err.message);
    }
}

async function main() {
    console.log('🎯 DÉMARRAGE TEST WATCHLIST');
    console.log('═'.repeat(60));
    
    const watchlistOk = await testWatchlistTable();
    await testOtherTables();
    
    console.log('\n📊 RÉSULTATS FINAUX');
    console.log('═'.repeat(60));
    console.log('Table watchlist:', watchlistOk ? '✅' : '❌');
    
    if (watchlistOk) {
        console.log('\n🎉 TABLE WATCHLIST FONCTIONNELLE!');
        console.log('✅ Vous pouvez maintenant utiliser les agents Emma');
        console.log('🚀 Le système est prêt pour la production');
    } else {
        console.log('\n⚠️  PROBLÈME AVEC LA TABLE WATCHLIST');
        console.log('🔧 Solutions:');
        console.log('   1. Exécutez supabase-watchlist-base.sql dans Supabase');
        console.log('   2. Vérifiez les permissions RLS');
        console.log('   3. Vérifiez les clés Supabase');
        console.log('');
        console.log('📖 Guide: SUPABASE_SETUP_GUIDE.md');
    }
}

main().catch(console.error);
