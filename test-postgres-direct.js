#!/usr/bin/env node

/**
 * Test de connexion PostgreSQL directe avec Supabase
 * Mot de passe: 5mUaqujMflrgZyCo
 */

import pkg from 'pg';
const { Client } = pkg;

const POSTGRES_PASSWORD = '5mUaqujMflrgZyCo';

async function testPostgresConnection() {
    console.log('🔌 TEST CONNEXION POSTGRESQL SUPABASE');
    console.log('═'.repeat(50));
    console.log(`🔑 Mot de passe: ${POSTGRES_PASSWORD}`);
    
    // Essayer différentes URLs possibles
    const connectionConfigs = [
        {
            name: 'Configuration 1 (Standard)',
            host: 'db.gob-watchlist.supabase.co',
            port: 5432,
            database: 'postgres',
            user: 'postgres',
            password: POSTGRES_PASSWORD,
            ssl: { rejectUnauthorized: false }
        },
        {
            name: 'Configuration 2 (Alternative)',
            host: 'gob-watchlist.supabase.co',
            port: 5432,
            database: 'postgres',
            user: 'postgres',
            password: POSTGRES_PASSWORD,
            ssl: { rejectUnauthorized: false }
        },
        {
            name: 'Configuration 3 (Pooler)',
            host: 'aws-0-us-east-1.pooler.supabase.com',
            port: 6543,
            database: 'postgres',
            user: 'postgres.gob-watchlist',
            password: POSTGRES_PASSWORD,
            ssl: { rejectUnauthorized: false }
        }
    ];
    
    for (const config of connectionConfigs) {
        console.log(`\n🧪 ${config.name}:`);
        console.log(`   Host: ${config.host}:${config.port}`);
        console.log(`   Database: ${config.database}`);
        console.log(`   User: ${config.user}`);
        
        const client = new Client(config);
        
        try {
            await client.connect();
            console.log('   ✅ Connexion réussie!');
            
            // Tester les tables
            const tablesResult = await client.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name;
            `);
            
            console.log(`   📋 Tables trouvées (${tablesResult.rows.length}):`);
            tablesResult.rows.forEach(row => {
                console.log(`      - ${row.table_name}`);
            });
            
            // Tester la table watchlist si elle existe
            try {
                const watchlistResult = await client.query('SELECT COUNT(*) FROM watchlist');
                console.log(`   📊 Watchlist: ${watchlistResult.rows[0].count} enregistrements`);
            } catch (err) {
                console.log('   ⚠️  Table watchlist non trouvée');
            }
            
            await client.end();
            console.log('   🎉 Configuration fonctionnelle trouvée!');
            break;
            
        } catch (err) {
            console.log(`   ❌ Erreur: ${err.message}`);
            try {
                await client.end();
            } catch {}
        }
    }
}

async function getSupabaseProjectInfo() {
    console.log('\n📖 INFORMATIONS PROJET SUPABASE');
    console.log('═'.repeat(50));
    console.log('🔍 Pour trouver les bonnes informations de connexion:');
    console.log('');
    console.log('1. Allez sur https://app.supabase.com');
    console.log('2. Sélectionnez le projet "gob-watchlist"');
    console.log('3. Allez dans Settings > Database');
    console.log('4. Section "Connection string"');
    console.log('5. Copiez les informations:');
    console.log('   • Host');
    console.log('   • Port');
    console.log('   • Database name');
    console.log('   • Username');
    console.log('   • Password (déjà fourni: 5mUaqujMflrgZyCo)');
    console.log('');
    console.log('💡 URL de connexion typique:');
    console.log('   postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres');
    console.log('');
    console.log('🔗 Avec votre mot de passe:');
    console.log(`   postgresql://postgres:${POSTGRES_PASSWORD}@db.gob-watchlist.supabase.co:5432/postgres`);
}

async function main() {
    console.log('🎯 TEST CONNEXION SUPABASE GOB-WATCHLIST');
    console.log('═'.repeat(60));
    
    await testPostgresConnection();
    await getSupabaseProjectInfo();
    
    console.log('\n📋 RÉSUMÉ');
    console.log('═'.repeat(50));
    console.log('✅ Mot de passe PostgreSQL: 5mUaqujMflrgZyCo');
    console.log('📍 Projet: gob-watchlist');
    console.log('🔑 Prochaine étape: Trouver les bonnes informations de connexion');
    console.log('📖 Guide: Settings > Database dans Supabase');
}

main().catch(console.error);
