#!/usr/bin/env node

/**
 * Test complet de la configuration Supabase
 */

import { createSupabaseClient, createPostgresClient } from './lib/supabase-config.js';

async function testSupabaseAPI() {
    console.log('🧪 Test API Supabase...');
    
    try {
        const supabase = createSupabaseClient();
        
        // Test de connexion
    const { data, error } = await supabase
            .from('watchlist')
            .select('*')
      .limit(1);

        if (error) {
            console.log('❌ Erreur API:', error.message);
    return false;
  }

        console.log('✅ API Supabase fonctionnelle');
        console.log('📊 Watchlist:', data?.length || 0, 'enregistrements');
        return true;
        
    } catch (err) {
        console.log('❌ Erreur:', err.message);
        return false;
    }
}

async function testPostgresDirect() {
    console.log('\n🧪 Test PostgreSQL direct...');
    
    try {
        const client = createPostgresClient();
        await client.connect();
        
        // Tester les tables
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);
        
        console.log('✅ PostgreSQL direct fonctionnel');
        console.log('📋 Tables:', result.rows.map(r => r.table_name).join(', '));
        
        await client.end();
        return true;
        
    } catch (err) {
        console.log('❌ Erreur PostgreSQL:', err.message);
        return false;
    }
}

async function main() {
    console.log('🎯 TEST COMPLET SUPABASE GOB');
    console.log('═'.repeat(50));
    
    const apiOk = await testSupabaseAPI();
    const pgOk = await testPostgresDirect();
    
    console.log('\n📊 RÉSULTATS:');
    console.log('═'.repeat(50));
    console.log('API Supabase:', apiOk ? '✅' : '❌');
    console.log('PostgreSQL:', pgOk ? '✅' : '❌');
    
    if (apiOk && pgOk) {
        console.log('\n🎉 CONFIGURATION COMPLÈTE!');
        console.log('Le système Emma AI est prêt à fonctionner.');
    } else {
        console.log('\n⚠️  Configuration incomplète.');
        console.log('Vérifiez les variables d\'environnement.');
    }
}

main().catch(console.error);
