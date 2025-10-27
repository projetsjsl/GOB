#!/usr/bin/env node

/**
 * Test complet de la configuration Supabase
 * Utilise les variables d'environnement ou des valeurs par défaut
 */

import { createClient } from '@supabase/supabase-js';
import pkg from 'pg';
const { Client } = pkg;

// Configuration Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gob-watchlist.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key-here';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key-here';
const SUPABASE_DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || '5mUaqujMflrgZyCo';

console.log('🧪 TEST COMPLET CONFIGURATION SUPABASE');
console.log('═'.repeat(60));
console.log(`📍 URL: ${SUPABASE_URL}`);
console.log(`🔑 Anon Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
console.log(`🔑 Service Key: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`);
console.log(`🔑 DB Password: ${SUPABASE_DB_PASSWORD}`);
console.log('');

async function testSupabaseAPI() {
    console.log('🔗 Test 1: API Supabase (clé anonyme)');
    console.log('─'.repeat(50));
    
    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Test de connexion basique
        const { data, error } = await supabase
            .from('watchlist')
            .select('*')
            .limit(1);
            
        if (error) {
            console.log('❌ Erreur API:', error.message);
            return false;
        }
        
        console.log('✅ Connexion API Supabase réussie');
        console.log('📊 Watchlist:', data?.length || 0, 'enregistrements');
        return true;
        
    } catch (err) {
        console.log('❌ Erreur:', err.message);
        return false;
    }
}

async function testSupabaseServiceRole() {
    console.log('\n🔗 Test 2: API Supabase (service role)');
    console.log('─'.repeat(50));
    
    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        // Test de connexion avec service role
        const { data, error } = await supabase
            .from('watchlist')
            .select('*')
            .limit(1);
            
        if (error) {
            console.log('❌ Erreur Service Role:', error.message);
            return false;
        }
        
        console.log('✅ Connexion Service Role réussie');
        console.log('📊 Watchlist:', data?.length || 0, 'enregistrements');
        return true;
        
    } catch (err) {
        console.log('❌ Erreur:', err.message);
        return false;
    }
}

async function testPostgresDirect() {
    console.log('\n🔗 Test 3: PostgreSQL direct');
    console.log('─'.repeat(50));
    
    // Essayer différentes configurations de connexion
    const configs = [
        {
            name: 'Configuration standard',
            host: 'db.gob-watchlist.supabase.co',
            port: 5432,
            database: 'postgres',
            user: 'postgres',
            password: SUPABASE_DB_PASSWORD,
            ssl: { rejectUnauthorized: false }
        },
        {
            name: 'Configuration alternative',
            host: 'gob-watchlist.supabase.co',
            port: 5432,
            database: 'postgres',
            user: 'postgres',
            password: SUPABASE_DB_PASSWORD,
            ssl: { rejectUnauthorized: false }
        }
    ];
    
    for (const config of configs) {
        console.log(`\n🧪 ${config.name}:`);
        console.log(`   Host: ${config.host}:${config.port}`);
        
        const client = new Client(config);
        
        try {
            await client.connect();
            console.log('   ✅ Connexion PostgreSQL réussie');
            
            // Tester les tables
            const result = await client.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name;
            `);
            
            console.log(`   📋 Tables trouvées (${result.rows.length}):`);
            result.rows.forEach(row => {
                console.log(`      - ${row.table_name}`);
            });
            
            // Tester la table watchlist
            try {
                const watchlistResult = await client.query('SELECT COUNT(*) FROM watchlist');
                console.log(`   📊 Watchlist: ${watchlistResult.rows[0].count} enregistrements`);
            } catch (err) {
                console.log('   ⚠️  Table watchlist non trouvée');
            }
            
            await client.end();
            return true;
            
        } catch (err) {
            console.log(`   ❌ Erreur: ${err.message}`);
            try {
                await client.end();
            } catch {}
        }
    }
    
    return false;
}

async function testSupabaseTables() {
    console.log('\n🔗 Test 4: Tables Supabase');
    console.log('─'.repeat(50));
    
    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        // Tester chaque table créée par le script SQL
        const tables = [
            'earnings_calendar',
            'pre_earnings_analysis', 
            'earnings_results',
            'significant_news',
            'watchlist'
        ];
        
        console.log('📋 Vérification des tables:');
        
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
        
        return true;
        
    } catch (err) {
        console.log('❌ Erreur test tables:', err.message);
        return false;
    }
}

async function main() {
    console.log('🎯 DÉMARRAGE DES TESTS SUPABASE');
    console.log('═'.repeat(60));
    
    const results = {
        apiAnon: await testSupabaseAPI(),
        apiService: await testSupabaseServiceRole(),
        postgres: await testPostgresDirect(),
        tables: await testSupabaseTables()
    };
    
    console.log('\n📊 RÉSULTATS FINAUX');
    console.log('═'.repeat(60));
    console.log('API Supabase (Anon):', results.apiAnon ? '✅' : '❌');
    console.log('API Supabase (Service):', results.apiService ? '✅' : '❌');
    console.log('PostgreSQL Direct:', results.postgres ? '✅' : '❌');
    console.log('Tables Supabase:', results.tables ? '✅' : '❌');
    
    const successCount = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n📈 Score: ${successCount}/${totalTests} tests réussis`);
    
    if (successCount === totalTests) {
        console.log('\n🎉 CONFIGURATION COMPLÈTE!');
        console.log('✅ Tous les tests sont passés');
        console.log('🚀 Le système Emma AI est prêt à fonctionner');
    } else if (successCount > 0) {
        console.log('\n⚠️  Configuration partielle');
        console.log('✅ Certains tests sont passés');
        console.log('🔧 Vérifiez les erreurs ci-dessus');
    } else {
        console.log('\n❌ Configuration échouée');
        console.log('🔧 Vérifiez les variables d\'environnement');
        console.log('📖 Consultez SUPABASE_SETUP_GUIDE.md');
    }
    
    console.log('\n💡 Prochaines étapes:');
    if (!results.apiAnon || !results.apiService) {
        console.log('   • Vérifiez les clés Supabase dans Vercel');
        console.log('   • Exécutez: vercel env ls');
    }
    if (!results.postgres) {
        console.log('   • Vérifiez les informations de connexion PostgreSQL');
        console.log('   • Consultez Settings > Database dans Supabase');
    }
    if (!results.tables) {
        console.log('   • Exécutez le script SQL dans Supabase');
        console.log('   • Copiez SUPABASE_SETUP_FINAL.sql');
    }
}

main().catch(console.error);
