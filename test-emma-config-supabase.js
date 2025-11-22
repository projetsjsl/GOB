/**
 * Script de diagnostic Emma Config Supabase
 *
 * Ce script vérifie l'état de la configuration Supabase
 * et indique ce qui manque ou doit être corrigé.
 *
 * Usage: node test-emma-config-supabase.js
 */

import { createClient } from '@supabase/supabase-js';

// Utiliser directement les variables d'environnement (déjà injectées par Vercel ou dotenvx)
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

console.log('🔍 Diagnostic Emma Config Supabase');
console.log('='.repeat(70));

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('\n❌ Variables d\'environnement manquantes:');
    console.error(`   SUPABASE_URL: ${SUPABASE_URL ? '✅' : '❌'}`);
    console.error(`   SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌'}`);
    console.error('\n💡 Configurez ces variables dans .env.local ou Vercel');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testConnection() {
    console.log('\n📡 Test 1/6: Connexion Supabase...');
    try {
        const { data, error } = await supabase.from('emma_config').select('key').limit(1);
        if (error) throw error;
        console.log('   ✅ Connexion OK');
        return true;
    } catch (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
        return false;
    }
}

async function testTableStructure() {
    console.log('\n🗃️  Test 2/6: Structure de la table emma_config...');

    const requiredColumns = [
        'key', 'value', 'description', 'updated_at',
        'prompt_id', 'prompt_number', 'email_recipients',
        'delivery_enabled', 'delivery_schedule'
    ];

    try {
        const { data, error } = await supabase
            .from('emma_config')
            .select('*')
            .limit(1);

        if (error) throw error;

        if (!data || data.length === 0) {
            console.log('   ⚠️  Table vide, impossible de vérifier la structure');
            console.log('   💡 Ajoutez au moins un enregistrement pour tester');
            return false;
        }

        const existingColumns = Object.keys(data[0]);
        const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

        if (missingColumns.length === 0) {
            console.log('   ✅ Toutes les colonnes nécessaires sont présentes');
            return true;
        } else {
            console.log(`   ❌ Colonnes manquantes: ${missingColumns.join(', ')}`);
            console.log('   💡 Exécutez le SQL: supabase-prompt-delivery-config-FIXED.sql');
            return false;
        }
    } catch (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
        return false;
    }
}

async function testRPCFunction() {
    console.log('\n🔧 Test 3/6: Fonction RPC get_prompt_delivery_config...');

    try {
        const { data, error } = await supabase
            .rpc('get_prompt_delivery_config', { p_prompt_id: 'test_non_existent' });

        if (error) {
            if (error.message.includes('does not exist') || error.message.includes('function')) {
                console.log('   ❌ Fonction RPC n\'existe pas');
                console.log('   💡 Exécutez le SQL: supabase-prompt-delivery-config-FIXED.sql');
                return false;
            }
            // Autres erreurs peuvent être OK (ex: aucun résultat)
        }

        console.log('   ✅ Fonction RPC existe et fonctionne');
        return true;
    } catch (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
        return false;
    }
}

async function testView() {
    console.log('\n👁️  Test 4/6: Vue prompt_delivery_configs...');

    try {
        const { data, error } = await supabase
            .from('prompt_delivery_configs')
            .select('*')
            .limit(5);

        if (error) {
            if (error.message.includes('does not exist')) {
                console.log('   ❌ Vue n\'existe pas');
                console.log('   💡 Exécutez le SQL: supabase-prompt-delivery-config-FIXED.sql');
                return false;
            }
            throw error;
        }

        console.log(`   ✅ Vue existe (${data.length} prompts actifs trouvés)`);
        if (data.length === 0) {
            console.log('   ℹ️  Aucun prompt avec delivery_enabled=true');
        }
        return true;
    } catch (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
        return false;
    }
}

async function testPromptsList() {
    console.log('\n📝 Test 5/6: Liste des prompts...');

    try {
        const { data, error } = await supabase
            .from('emma_config')
            .select('key, prompt_id, delivery_enabled, email_recipients')
            .limit(10);

        if (error) throw error;

        console.log(`   ✅ ${data.length} prompts trouvés dans emma_config`);

        const withDelivery = data.filter(p => p.delivery_enabled);
        console.log(`   ℹ️  ${withDelivery.length} prompts avec delivery_enabled=true`);

        if (withDelivery.length > 0) {
            console.log('   📌 Prompts actifs:');
            withDelivery.forEach(p => {
                const recipientCount = Array.isArray(p.email_recipients) ? p.email_recipients.length : 0;
                console.log(`      - ${p.key} (${recipientCount} destinataires)`);
            });
        }

        return true;
    } catch (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
        return false;
    }
}

async function testAPIEndpoint() {
    console.log('\n🌐 Test 6/6: API endpoint production...');

    try {
        const response = await fetch('https://gobapps.com/api/prompt-delivery-config');
        const data = await response.json();

        if (!response.ok) {
            console.log(`   ❌ API retourne erreur: ${data.error || response.status}`);
            return false;
        }

        console.log(`   ✅ API fonctionne (${data.count || 0} prompts actifs)`);
        return true;
    } catch (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
        return false;
    }
}

async function runDiagnostic() {
    const results = {
        connection: false,
        tableStructure: false,
        rpcFunction: false,
        view: false,
        promptsList: false,
        apiEndpoint: false
    };

    results.connection = await testConnection();
    if (!results.connection) {
        console.log('\n❌ Impossible de continuer sans connexion Supabase');
        return results;
    }

    results.tableStructure = await testTableStructure();
    results.rpcFunction = await testRPCFunction();
    results.view = await testView();
    results.promptsList = await testPromptsList();
    results.apiEndpoint = await testAPIEndpoint();

    return results;
}

async function main() {
    try {
        const results = await runDiagnostic();

        // Résumé
        console.log('\n' + '='.repeat(70));
        console.log('📊 RÉSUMÉ DU DIAGNOSTIC');
        console.log('='.repeat(70));

        const tests = [
            ['Connexion Supabase', results.connection],
            ['Structure de table', results.tableStructure],
            ['Fonction RPC', results.rpcFunction],
            ['Vue prompt_delivery_configs', results.view],
            ['Liste des prompts', results.promptsList],
            ['API endpoint', results.apiEndpoint]
        ];

        let passedCount = 0;
        tests.forEach(([name, passed]) => {
            const status = passed ? '✅' : '❌';
            console.log(`${status} ${name}`);
            if (passed) passedCount++;
        });

        console.log('─'.repeat(70));
        console.log(`Score: ${passedCount}/${tests.length} tests réussis`);

        // Recommandations
        if (passedCount === tests.length) {
            console.log('\n🎉 Tout fonctionne parfaitement!');
            console.log('   Vous pouvez utiliser https://gobapps.com/emma-config.html');
        } else if (!results.tableStructure || !results.rpcFunction || !results.view) {
            console.log('\n⚠️  Configuration Supabase incomplète');
            console.log('\n📋 ACTIONS REQUISES:');
            console.log('   1. Ouvrir https://supabase.com → SQL Editor');
            console.log('   2. Exécuter le fichier: supabase-prompt-delivery-config-FIXED.sql');
            console.log('   3. Relancer ce test: node test-emma-config-supabase.js');
        } else if (!results.apiEndpoint) {
            console.log('\n⚠️  Base de données OK mais API ne répond pas correctement');
            console.log('   💡 Vérifiez le déploiement Vercel');
        }

        console.log('\n');
        process.exit(passedCount === tests.length ? 0 : 1);

    } catch (error) {
        console.error('\n❌ Erreur fatale:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

main();
