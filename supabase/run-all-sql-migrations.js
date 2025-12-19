#!/usr/bin/env node

/**
 * Exécute toutes les migrations SQL en utilisant l'API Supabase
 * Crée d'abord la fonction RPC exec_sql si nécessaire, puis exécute les migrations
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lire les credentials
let SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
let SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

// Lire depuis env-config.js si disponible
if (!SUPABASE_URL || !SUPABASE_KEY) {
    try {
        const envConfigPath = path.join(__dirname, '..', 'public', 'js', 'env-config.js');
        if (fs.existsSync(envConfigPath)) {
            const envConfigContent = fs.readFileSync(envConfigPath, 'utf8');
            const urlMatch = envConfigContent.match(/SUPABASE_URL:\s*['"]([^'"]+)['"]/);
            const keyMatch = envConfigContent.match(/SUPABASE_ANON_KEY:\s*['"]([^'"]+)['"]/);
            
            if (urlMatch && !SUPABASE_URL) SUPABASE_URL = urlMatch[1];
            if (keyMatch && !SUPABASE_KEY) SUPABASE_KEY = keyMatch[1];
        }
    } catch (err) {
        // Ignorer
    }
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Credentials Supabase manquants');
    console.error('   Utilisez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY');
    console.error('   Ou exportez-les: export SUPABASE_URL=... && export SUPABASE_SERVICE_ROLE_KEY=...\n');
    process.exit(1);
}

console.log('🔌 Connexion à Supabase...');
console.log(`   URL: ${SUPABASE_URL.substring(0, 40)}...\n`);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Exécute du SQL via l'API Supabase en utilisant une fonction RPC
 */
async function executeSQL(sql) {
    // Essayer d'exécuter via RPC exec_sql
    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql });
        
        if (error) {
            if (error.message && (error.message.includes('function') || error.message.includes('does not exist'))) {
                return { success: false, needsRPC: true, error: 'Function exec_sql does not exist' };
            }
            return { success: false, error: error.message };
        }
        
        if (data && typeof data === 'object' && data.success === false) {
            return { success: false, error: data.error || 'SQL execution failed' };
        }
        
        return { success: true, data };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * Vérifie si les colonnes de la migration 013 existent
 */
async function checkMigration013() {
    try {
        const { data, error } = await supabase
            .from('task_templates')
            .select('id, start_date, end_date')
            .limit(1);
        
        return !error;
    } catch (err) {
        return false;
    }
}

/**
 * Exécute la migration 013
 */
async function runMigration013() {
    console.log('📄 Migration 013: Ajouter colonnes start_date et end_date\n');

    // Vérifier si déjà appliquée
    const alreadyApplied = await checkMigration013();
    if (alreadyApplied) {
        console.log('✅ Migration 013 déjà appliquée\n');
        return true;
    }

    // Lire le SQL
    const sqlPath = path.join(__dirname, 'migrations', '013_add_task_dates.sql');
    if (!fs.existsSync(sqlPath)) {
        console.error('❌ Fichier migration non trouvé:', sqlPath);
        return false;
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('📋 SQL chargé, exécution...\n');

    // Exécuter le SQL
    const result = await executeSQL(sql);

    if (result.needsRPC) {
        console.log('⚠️  Fonction RPC exec_sql non disponible');
        console.log('📋 Création de la fonction RPC nécessaire\n');
        
        // Afficher le SQL pour créer la fonction RPC
        const rpcFunctionSQL = `
CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    EXECUTE sql;
    RETURN jsonb_build_object('success', true, 'message', 'SQL executed successfully');
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'sqlstate', SQLSTATE
        );
END;
$$;

GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO service_role;
        `.trim();

        console.log('📋 SQL pour créer la fonction RPC:\n');
        console.log('='.repeat(70));
        console.log(rpcFunctionSQL);
        console.log('='.repeat(70));
        console.log('\n📝 Instructions:');
        console.log('   1. Allez sur: https://supabase.com/dashboard');
        console.log('   2. Ouvrez "SQL Editor"');
        console.log('   3. Exécutez le SQL ci-dessus pour créer la fonction exec_sql');
        console.log('   4. Relancez ce script\n');
        
        return false;
    }

    if (!result.success) {
        console.error('❌ Erreur d\'exécution:', result.error);
        console.log('\n📋 SQL pour exécution manuelle:\n');
        console.log('='.repeat(70));
        console.log(sql);
        console.log('='.repeat(70));
        console.log('\n📝 Instructions:');
        console.log('   1. Allez sur: https://supabase.com/dashboard');
        console.log('   2. Ouvrez "SQL Editor"');
        console.log('   3. Exécutez le SQL ci-dessus\n');
        return false;
    }

    console.log('✅ Migration exécutée avec succès!\n');

    // Vérifier
    const verified = await checkMigration013();
    if (verified) {
        console.log('✅ Colonnes créées et vérifiées!\n');
        return true;
    } else {
        console.log('⚠️  Migration exécutée mais vérification échouée\n');
        return false;
    }
}

// Exécuter
async function main() {
    console.log('🔄 Exécution des migrations SQL\n');
    console.log('='.repeat(60));
    
    const success = await runMigration013();
    
    console.log('='.repeat(60));
    
    if (success) {
        console.log('\n🎉 Toutes les migrations exécutées avec succès!\n');
        process.exit(0);
    } else {
        console.log('\n⚠️  Migration nécessite une exécution manuelle\n');
        process.exit(1);
    }
}

main();

