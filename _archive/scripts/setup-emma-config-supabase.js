/**
 * Script de setup automatique pour Emma Config dans Supabase
 *
 * Ce script:
 * 1. Se connecte à Supabase avec les credentials
 * 2. Exécute le SQL pour ajouter les colonnes nécessaires
 * 3. Crée la vue et la fonction RPC
 * 4. Configure un prompt de test
 *
 * Usage: node setup-emma-config-supabase.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Variables d\'environnement manquantes:');
    console.error('   SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
    console.error('\n💡 Assurez-vous que ces variables sont définies dans .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log('🚀 Setup Emma Config dans Supabase');
console.log('='.repeat(60));

async function executeSQL(description, sql) {
    console.log(`\n📝 ${description}...`);
    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
        if (error) {
            // Certaines erreurs peuvent être ignorées (ex: colonne déjà existante)
            if (error.message.includes('already exists') || error.message.includes('duplicate')) {
                console.log(`   ⚠️  Déjà existant (ignoré): ${error.message.split('\n')[0]}`);
                return true;
            }
            throw error;
        }
        console.log(`   ✅ ${description} - OK`);
        return true;
    } catch (error) {
        console.error(`   ❌ Erreur: ${error.message}`);
        return false;
    }
}

async function setupEmmaConfig() {
    let successCount = 0;
    let totalSteps = 0;

    // ═══════════════════════════════════════════════════════════
    // Étape 1: Ajouter les colonnes
    // ═══════════════════════════════════════════════════════════
    console.log('\n🔧 Étape 1/4: Ajout des colonnes à emma_config');

    const columns = [
        { name: 'prompt_id', sql: 'ALTER TABLE emma_config ADD COLUMN IF NOT EXISTS prompt_id TEXT UNIQUE;' },
        { name: 'prompt_number', sql: 'ALTER TABLE emma_config ADD COLUMN IF NOT EXISTS prompt_number INTEGER;' },
        { name: 'email_recipients', sql: 'ALTER TABLE emma_config ADD COLUMN IF NOT EXISTS email_recipients JSONB DEFAULT \'[]\'::jsonb;' },
        { name: 'delivery_enabled', sql: 'ALTER TABLE emma_config ADD COLUMN IF NOT EXISTS delivery_enabled BOOLEAN DEFAULT false;' },
        { name: 'delivery_schedule', sql: 'ALTER TABLE emma_config ADD COLUMN IF NOT EXISTS delivery_schedule JSONB DEFAULT \'{}\'::jsonb;' }
    ];

    for (const col of columns) {
        totalSteps++;
        const success = await executeSQL(`Ajouter colonne ${col.name}`, col.sql);
        if (success) successCount++;
    }

    // ═══════════════════════════════════════════════════════════
    // Étape 2: Créer les index
    // ═══════════════════════════════════════════════════════════
    console.log('\n📊 Étape 2/4: Création des index');

    const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_emma_config_prompt_id ON emma_config(prompt_id);',
        'CREATE INDEX IF NOT EXISTS idx_emma_config_delivery_enabled ON emma_config(delivery_enabled) WHERE delivery_enabled = true;'
    ];

    for (const indexSQL of indexes) {
        totalSteps++;
        const success = await executeSQL('Créer index', indexSQL);
        if (success) successCount++;
    }

    // ═══════════════════════════════════════════════════════════
    // Étape 3: Mettre à jour les prompts existants
    // ═══════════════════════════════════════════════════════════
    console.log('\n🔄 Étape 3/4: Mise à jour des prompts existants');

    totalSteps++;
    const updateSuccess = await executeSQL(
        'Définir prompt_id = key pour les prompts existants',
        'UPDATE emma_config SET prompt_id = key WHERE prompt_id IS NULL;'
    );
    if (updateSuccess) successCount++;

    // ═══════════════════════════════════════════════════════════
    // Étape 4: Créer la vue et la fonction RPC
    // ═══════════════════════════════════════════════════════════
    console.log('\n🏗️  Étape 4/4: Création vue et fonction RPC');

    // Vue
    totalSteps++;
    const viewSQL = `
CREATE OR REPLACE VIEW prompt_delivery_configs AS
SELECT
    key,
    prompt_id,
    prompt_number,
    value as config,
    email_recipients,
    delivery_enabled,
    delivery_schedule,
    description,
    updated_at,
    updated_by
FROM emma_config
WHERE delivery_enabled = true
ORDER BY prompt_number;
    `;
    const viewSuccess = await executeSQL('Créer vue prompt_delivery_configs', viewSQL);
    if (viewSuccess) successCount++;

    // Fonction RPC
    totalSteps++;
    const functionSQL = `
CREATE OR REPLACE FUNCTION get_prompt_delivery_config(p_prompt_id TEXT)
RETURNS TABLE (
    key TEXT,
    prompt_id TEXT,
    prompt_number INTEGER,
    config JSONB,
    email_recipients JSONB,
    delivery_enabled BOOLEAN,
    delivery_schedule JSONB,
    description TEXT,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ec.key,
        ec.prompt_id,
        ec.prompt_number,
        ec.value as config,
        ec.email_recipients,
        ec.delivery_enabled,
        ec.delivery_schedule,
        ec.description,
        ec.updated_at
    FROM emma_config ec
    WHERE ec.prompt_id = p_prompt_id
    OR ec.key = p_prompt_id;
END;
$$ LANGUAGE plpgsql;
    `;
    const functionSuccess = await executeSQL('Créer fonction RPC get_prompt_delivery_config', functionSQL);
    if (functionSuccess) successCount++;

    // ═══════════════════════════════════════════════════════════
    // Résumé
    // ═══════════════════════════════════════════════════════════
    console.log('\n' + '='.repeat(60));
    console.log(`📈 Résumé: ${successCount}/${totalSteps} étapes complétées`);

    if (successCount === totalSteps) {
        console.log('✅ Setup terminé avec succès!');
        console.log('\n📌 Prochaines étapes:');
        console.log('   1. Tester l\'API: curl https://gobapps.com/api/prompt-delivery-config');
        console.log('   2. Ouvrir: https://gobapps.com/emma-config.html');
        console.log('   3. Configurer un prompt avec destinataires email');
        return true;
    } else {
        console.log(`⚠️  Setup partiel: ${totalSteps - successCount} étapes ont échoué`);
        console.log('\n💡 Note: Certaines erreurs peuvent être normales si déjà configuré');
        return false;
    }
}

// ═══════════════════════════════════════════════════════════
// Alternative: Exécution directe du SQL (si exec_sql n'existe pas)
// ═══════════════════════════════════════════════════════════
async function setupViaDirectSQL() {
    console.log('\n⚠️  La méthode RPC exec_sql n\'est pas disponible');
    console.log('📋 Veuillez exécuter manuellement le SQL suivant dans Supabase SQL Editor:\n');

    const sqlContent = fs.readFileSync('./supabase-prompt-delivery-config-FIXED.sql', 'utf-8');
    console.log('─'.repeat(60));
    console.log(sqlContent);
    console.log('─'.repeat(60));

    console.log('\n📌 Instructions:');
    console.log('   1. Copier le SQL ci-dessus');
    console.log('   2. Aller sur https://supabase.com → SQL Editor');
    console.log('   3. Coller et exécuter le SQL');
    console.log('   4. Vérifier que tout fonctionne avec: SELECT * FROM prompt_delivery_configs;');
}

// ═══════════════════════════════════════════════════════════
// Fonction principale
// ═══════════════════════════════════════════════════════════
async function main() {
    try {
        // Tester la connexion Supabase
        console.log('\n🔌 Test de connexion Supabase...');
        const { data, error } = await supabase.from('emma_config').select('key').limit(1);

        if (error) {
            console.error('❌ Erreur de connexion Supabase:', error.message);
            console.log('\n💡 Vérifiez vos credentials dans .env.local');
            process.exit(1);
        }

        console.log('✅ Connexion Supabase OK');

        // Exécuter le setup
        const success = await setupEmmaConfig();

        if (!success) {
            console.log('\n⚠️  Si les erreurs persistent, utilisez la méthode manuelle:');
            await setupViaDirectSQL();
        }

    } catch (error) {
        console.error('\n❌ Erreur fatale:', error);

        // Si c'est une erreur de méthode RPC, proposer la méthode manuelle
        if (error.message && error.message.includes('exec_sql')) {
            await setupViaDirectSQL();
        } else {
            console.error('\n💡 Stack trace:', error.stack);
        }

        process.exit(1);
    }
}

main();
