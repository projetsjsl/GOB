#!/usr/bin/env node

/**
 * Test de connexion Supabase avec les identifiants fournis
 * Projet: gob-watchlist
 * Password: 5mUaqujMflrgZyCo
 */

import { createClient } from '@supabase/supabase-js';
import pkg from 'pg';
const { Client } = pkg;

// Configuration Supabase
const SUPABASE_URL = 'https://gob-watchlist.supabase.co'; // URL typique Supabase
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key-here';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key-here';

// Mot de passe PostgreSQL fourni
const POSTGRES_PASSWORD = '5mUaqujMflrgZyCo';

async function testSupabaseConnection() {
    console.log('🔗 TEST CONNEXION SUPABASE');
    console.log('═'.repeat(50));
    console.log(`📍 URL: ${SUPABASE_URL}`);
    console.log(`🔑 Password PostgreSQL: ${POSTGRES_PASSWORD}`);
    
    try {
        // Test avec clé anonyme
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        console.log('\n🧪 Test 1: Connexion avec clé anonyme...');
        const { data, error } = await supabase
            .from('watchlist')
            .select('*')
            .limit(1);
            
        if (error) {
            console.log('⚠️  Erreur avec clé anonyme:', error.message);
        } else {
            console.log('✅ Connexion anonyme réussie');
            console.log('📊 Données watchlist:', data?.length || 0, 'enregistrements');
        }
        
    } catch (err) {
        console.log('❌ Erreur de connexion:', err.message);
    }
    
    try {
        // Test avec service role key
        const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        console.log('\n🧪 Test 2: Connexion avec service role...');
        const { data, error } = await supabaseService
            .from('watchlist')
            .select('*')
            .limit(1);
            
        if (error) {
            console.log('⚠️  Erreur avec service role:', error.message);
        } else {
            console.log('✅ Connexion service role réussie');
            console.log('📊 Données watchlist:', data?.length || 0, 'enregistrements');
        }
        
    } catch (err) {
        console.log('❌ Erreur service role:', err.message);
    }
}

async function testDirectPostgresConnection() {
    console.log('\n🔌 TEST CONNEXION POSTGRESQL DIRECTE');
    console.log('═'.repeat(50));
    
    const client = new Client({
        host: 'db.gob-watchlist.supabase.co',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: POSTGRES_PASSWORD,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        await client.connect();
        console.log('✅ Connexion PostgreSQL directe réussie');
        
        // Tester les tables
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);
        
        console.log('📋 Tables disponibles:');
        result.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });
        
        // Tester la table watchlist
        const watchlistResult = await client.query('SELECT COUNT(*) FROM watchlist');
        console.log(`📊 Enregistrements watchlist: ${watchlistResult.rows[0].count}`);
        
    } catch (err) {
        console.log('❌ Erreur PostgreSQL:', err.message);
    } finally {
        await client.end();
    }
}

async function getSupabaseKeys() {
    console.log('\n🔑 RÉCUPÉRATION DES CLÉS SUPABASE');
    console.log('═'.repeat(50));
    
    console.log('📖 Pour récupérer vos clés Supabase:');
    console.log('1. Allez sur https://app.supabase.com');
    console.log('2. Sélectionnez le projet "gob-watchlist"');
    console.log('3. Allez dans Settings > API');
    console.log('4. Copiez:');
    console.log('   - Project URL: https://gob-watchlist.supabase.co');
    console.log('   - anon public key: eyJ...');
    console.log('   - service_role secret key: eyJ...');
    console.log('');
    console.log('💡 Configurez ces variables dans Vercel:');
    console.log('   vercel env add SUPABASE_URL');
    console.log('   vercel env add SUPABASE_ANON_KEY');
    console.log('   vercel env add SUPABASE_SERVICE_ROLE_KEY');
}

async function main() {
    console.log('🎯 CONFIGURATION SUPABASE GOB-WATCHLIST');
    console.log('═'.repeat(60));
    
    await testSupabaseConnection();
    await testDirectPostgresConnection();
    await getSupabaseKeys();
    
    console.log('\n📋 RÉSUMÉ');
    console.log('═'.repeat(50));
    console.log('✅ Mot de passe PostgreSQL: 5mUaqujMflrgZyCo');
    console.log('📍 URL projet: https://gob-watchlist.supabase.co');
    console.log('🔑 Prochaine étape: Récupérer les clés API dans Supabase');
}

// Exécution principale
main().catch(console.error);

export { testSupabaseConnection, testDirectPostgresConnection };
