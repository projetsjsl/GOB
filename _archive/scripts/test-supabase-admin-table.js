/**
 * Script de test - Vérification et création table emma_system_config
 * Teste la connexion Supabase et crée la table si nécessaire
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

console.log('🔍 Test Supabase - Table Admin Emma');
console.log('====================================\n');

// Vérifier les variables d'environnement
if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables manquantes:');
    if (!supabaseUrl) console.error('   - SUPABASE_URL');
    if (!supabaseKey) console.error('   - SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_KEY');
    console.error('\n💡 Vérifier dans Vercel: https://vercel.com/projetsjsls-projects/gob/settings/environment-variables');
    process.exit(1);
}

console.log('✅ Variables d\'environnement trouvées');
console.log(`   - SUPABASE_URL: ${supabaseUrl.substring(0, 30)}...`);
console.log(`   - SUPABASE_KEY: ${supabaseKey.substring(0, 20)}...\n`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        console.log('📡 Test de connexion Supabase...');

        // Test simple de connexion
        const { data, error } = await supabase
            .from('user_profiles')
            .select('count')
            .limit(1);

        if (error && error.code !== 'PGRST116') { // PGRST116 = table n'existe pas
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
        console.log(`   Nombre de configs: ${data ? data.length : 0}\n`);
        return true;
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        return false;
    }
}

async function createTable() {
    try {
        console.log('🔨 Création de la table emma_system_config...\n');

        // Lire le fichier SQL
        const sqlScript = fs.readFileSync('./supabase-emma-admin-setup.sql', 'utf8');

        console.log('📄 Fichier SQL lu avec succès');
        console.log('⚠️  Note: Supabase JS Client ne peut pas exécuter du SQL directement');
        console.log('');
        console.log('📋 INSTRUCTIONS MANUELLES:');
        console.log('===========================\n');
        console.log('1. Aller sur: https://app.supabase.com/project/_/sql\n');
        console.log('2. Coller ce SQL:\n');
        console.log('─'.repeat(60));
        console.log(sqlScript);
        console.log('─'.repeat(60));
        console.log('\n3. Cliquer sur "Run"\n');
        console.log('4. Revenir ici et exécuter à nouveau ce script pour vérifier\n');

        return false;
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        return false;
    }
}

async function testAPI() {
    try {
        console.log('🧪 Test de l\'API /api/admin/emma-config...\n');

        const adminKey = process.env.ADMIN_API_KEY;
        if (!adminKey) {
            console.log('⚠️  ADMIN_API_KEY non configuré');
            console.log('');
            console.log('Pour configurer:');
            console.log('1. Générer un token: openssl rand -hex 32');
            console.log('2. Aller sur: https://vercel.com/projetsjsls-projects/gob/settings/environment-variables');
            console.log('3. Ajouter ADMIN_API_KEY avec le token généré\n');
            return false;
        }

        console.log(`✅ ADMIN_API_KEY configuré: ${adminKey.substring(0, 20)}...\n`);

        // Test local de l'API (si disponible)
        const apiUrl = 'http://localhost:3000/api/admin/emma-config';

        try {
            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${adminKey}`
                }
            });

            console.log(`📡 Response: ${response.status} ${response.statusText}`);

            if (response.ok) {
                const data = await response.json();
                console.log('✅ API fonctionne !');
                console.log(`   Sections: ${data.sections ? data.sections.join(', ') : 'N/A'}`);
            } else {
                console.log('⚠️  API retourne une erreur (normal si la table n\'existe pas encore)');
            }
        } catch (fetchError) {
            console.log('⚠️  API non accessible localement (normal, tester sur Vercel)');
            console.log(`   Test URL production: https://gobapps.com/api/admin/emma-config`);
        }

        return true;
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        return false;
    }
}

async function listExistingConfig() {
    try {
        console.log('📋 Configuration existante dans la table...\n');

        const { data, error } = await supabase
            .from('emma_system_config')
            .select('section, key, type, updated_at')
            .order('section', { ascending: true })
            .order('key', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
            console.log('⚠️  Aucune configuration trouvée (table vide)\n');
            return;
        }

        console.log(`✅ ${data.length} configurations trouvées:\n`);

        // Grouper par section
        const grouped = data.reduce((acc, item) => {
            if (!acc[item.section]) acc[item.section] = [];
            acc[item.section].push(item);
            return acc;
        }, {});

        Object.entries(grouped).forEach(([section, items]) => {
            console.log(`📁 ${section}:`);
            items.forEach(item => {
                console.log(`   - ${item.key} (${item.type})`);
            });
            console.log('');
        });

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

// Exécution principale
(async () => {
    try {
        // Étape 1: Test connexion
        const connected = await testConnection();
        if (!connected) {
            process.exit(1);
        }

        // Étape 2: Vérifier table
        const tableExists = await checkTableExists();

        if (!tableExists) {
            // Étape 3: Instructions pour créer la table
            await createTable();
            process.exit(0);
        }

        // Étape 4: Lister config existante
        await listExistingConfig();

        // Étape 5: Test API
        await testAPI();

        console.log('\n✅ TOUT EST PRÊT !');
        console.log('═'.repeat(60));
        console.log('\n🎯 Prochaine étape:');
        console.log('   👉 Ouvrir: https://gobapps.com/admin-jslai.html\n');

    } catch (error) {
        console.error('\n❌ Erreur fatale:', error);
        process.exit(1);
    }
})();
