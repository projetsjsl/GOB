/**
 * Script de test - Vérification table emma_system_config
 * Version CommonJS
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

console.log('🔍 Test Supabase - Table Admin Emma');
console.log('====================================\n');

// Vérifier les variables d'environnement
if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables manquantes:');
    if (!supabaseUrl) console.error('   - SUPABASE_URL');
    if (!supabaseKey) console.error('   - SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_KEY');
    console.error('\n💡 Ces variables doivent être dans Vercel.');
    console.error('   Pour tester localement, créez un fichier .env avec:');
    console.error('   SUPABASE_URL=...');
    console.error('   SUPABASE_KEY=...');
    process.exit(1);
}

console.log('✅ Variables d\'environnement trouvées');
console.log(`   - SUPABASE_URL: ${supabaseUrl.substring(0, 30)}...`);
console.log(`   - SUPABASE_KEY: ${supabaseKey.substring(0, 20)}...\n`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        console.log('📡 Test de connexion Supabase...');

        // Test simple avec une requête basique
        const { error } = await supabase
            .from('emma_system_config')
            .select('count')
            .limit(0);

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        console.log('✅ Connexion Supabase réussie\n');
        return true;
    } catch (error) {
        console.error('❌ Erreur de connexion:', error.message);
        return false;
    }
}

async function checkTableExists() {
    try {
        console.log('🔍 Vérification de la table emma_system_config...');

        const { data, error } = await supabase
            .from('emma_system_config')
            .select('*')
            .limit(1);

        if (error) {
            if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
                console.log('❌ Table emma_system_config n\'existe PAS\n');
                return false;
            }
            throw error;
        }

        console.log('✅ Table emma_system_config existe !');
        console.log(`   Entrées trouvées: ${data ? data.length : 0}\n`);
        return true;
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        return false;
    }
}

async function showInstructions() {
    try {
        console.log('🔨 La table doit être créée\n');

        const sqlScript = fs.readFileSync('./supabase-emma-admin-setup.sql', 'utf8');

        console.log('📋 INSTRUCTIONS:');
        console.log('═'.repeat(60));
        console.log('\n1️⃣  Aller sur Supabase SQL Editor:');
        console.log('   https://app.supabase.com/project/_/sql\n');
        console.log('2️⃣  Coller ce SQL et cliquer "Run":\n');
        console.log('─'.repeat(60));
        console.log(sqlScript);
        console.log('─'.repeat(60));
        console.log('\n3️⃣  Revenir ici et relancer: node test-supabase-admin-table.cjs\n');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

async function listConfig() {
    try {
        console.log('📋 Configuration actuelle:\n');

        const { data, error } = await supabase
            .from('emma_system_config')
            .select('section, key, type, updated_at')
            .order('section', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
            console.log('⚠️  Table vide (aucune configuration)\n');
            console.log('💡 L\'interface admin créera les configs par défaut\n');
            return;
        }

        const grouped = data.reduce((acc, item) => {
            if (!acc[item.section]) acc[item.section] = [];
            acc[item.section].push(item);
            return acc;
        }, {});

        Object.entries(grouped).forEach(([section, items]) => {
            console.log(`📁 ${section}: ${items.length} config(s)`);
            items.forEach(item => {
                console.log(`   └─ ${item.key} (${item.type})`);
            });
        });
        console.log('');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

async function checkAdminAPIKey() {
    console.log('🔑 Vérification ADMIN_API_KEY...\n');

    const adminKey = process.env.ADMIN_API_KEY;

    if (!adminKey) {
        console.log('⚠️  ADMIN_API_KEY non configuré localement');
        console.log('');
        console.log('💡 Pour configurer dans Vercel:');
        console.log('   1. Générer: openssl rand -hex 32');
        console.log('   2. Ajouter sur: https://vercel.com/projetsjsls-projects/gob/settings/environment-variables');
        console.log('   3. Nom: ADMIN_API_KEY');
        console.log('   4. Environnements: Production + Preview + Development\n');
        return false;
    }

    console.log(`✅ ADMIN_API_KEY trouvé: ${adminKey.substring(0, 20)}...\n`);
    return true;
}

// Exécution
(async () => {
    try {
        const connected = await testConnection();
        if (!connected) {
            process.exit(1);
        }

        const tableExists = await checkTableExists();

        if (!tableExists) {
            await showInstructions();
            process.exit(0);
        }

        await listConfig();
        await checkAdminAPIKey();

        console.log('✅ TOUT EST CONFIGURÉ !');
        console.log('═'.repeat(60));
        console.log('\n🎯 Interface Admin Emma:');
        console.log('   👉 https://gobapps.com/admin-jslai.html\n');
        console.log('🧪 Pour tester:');
        console.log('   👉 bash test-admin-emma.sh\n');

    } catch (error) {
        console.error('\n❌ Erreur:', error);
        process.exit(1);
    }
})();
