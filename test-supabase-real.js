#!/usr/bin/env node

/**
 * Test Supabase avec vraies clés
 * À utiliser après configuration des variables Vercel
 */

import { createClient } from '@supabase/supabase-js';

// Charger les variables d'environnement depuis Vercel
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🧪 TEST SUPABASE AVEC VRAIES CLÉS');
console.log('═'.repeat(60));

// Vérifier que les variables sont définies
if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    console.log('❌ Variables d\'environnement manquantes:');
    console.log('   SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
    console.log('   SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅' : '❌');
    console.log('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
    console.log('');
    console.log('💡 Configurez d\'abord les variables Vercel:');
    console.log('   vercel env add SUPABASE_URL');
    console.log('   vercel env add SUPABASE_ANON_KEY');
    console.log('   vercel env add SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

console.log('✅ Variables d\'environnement trouvées');
console.log(`📍 URL: ${SUPABASE_URL}`);
console.log(`🔑 Anon Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
console.log(`🔑 Service Key: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`);
console.log('');

async function testConnection() {
    try {
        console.log('🔗 Test de connexion Supabase...');
        
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        // Test de connexion
        const { data, error } = await supabase
            .from('watchlist')
            .select('*')
            .limit(1);
            
        if (error) {
            console.log('❌ Erreur:', error.message);
            return false;
        }
        
        console.log('✅ Connexion Supabase réussie!');
        console.log('📊 Watchlist:', data?.length || 0, 'enregistrements');
        
        // Tester les nouvelles tables
        const tables = [
            'earnings_calendar',
            'pre_earnings_analysis',
            'earnings_results', 
            'significant_news'
        ];
        
        console.log('\n📋 Test des tables Emma AI:');
        
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
        console.log('❌ Erreur de connexion:', err.message);
        return false;
    }
}

async function main() {
    const success = await testConnection();
    
    console.log('\n📊 RÉSULTAT:');
    console.log('═'.repeat(60));
    
    if (success) {
        console.log('🎉 CONFIGURATION SUPABASE RÉUSSIE!');
        console.log('✅ Le système Emma AI est opérationnel');
        console.log('🚀 Vous pouvez maintenant utiliser les agents IA');
    } else {
        console.log('❌ Configuration Supabase échouée');
        console.log('🔧 Vérifiez les clés et l\'URL');
        console.log('📖 Consultez SUPABASE_SETUP_GUIDE.md');
    }
}

main().catch(console.error);
