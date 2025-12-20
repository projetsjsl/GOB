#!/usr/bin/env node

/**
 * Execute Migration 013 en créant d'abord la fonction RPC exec_sql si nécessaire
 * Puis exécute la migration via cette fonction
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

if (!SUPABASE_URL || !SUPABASE_KEY) {
    // Essayer de lire depuis env-config.js
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
    process.exit(1);
}

console.log('🔌 Connexion à Supabase...');
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function createExecSqlFunction() {
    console.log('📋 Création de la fonction RPC exec_sql...\n');
    
    const rpcFunctionSQL = fs.readFileSync(
        path.join(__dirname, 'migrations', '014_create_exec_sql_function.sql'),
        'utf8'
    );

    // Pour créer la fonction, on doit utiliser l'API Management ou Supabase CLI
    // Ici, on va juste vérifier si elle existe
    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
        if (!error) {
            console.log('✅ Fonction exec_sql existe déjà\n');
            return true;
        }
    } catch (err) {
        // Fonction n'existe pas, doit être créée
    }

    console.log('⚠️  Fonction exec_sql n\'existe pas');
    console.log('📋 Veuillez créer la fonction RPC d\'abord:\n');
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

async function executeMigration013() {
    console.log('📄 Migration 013: Ajouter colonnes start_date et end_date\n');

    // Vérifier si les colonnes existent
    try {
        const { data, error } = await supabase
            .from('task_templates')
            .select('id, start_date, end_date')
            .limit(1);

        if (!error) {
            console.log('✅ Colonnes start_date et end_date existent déjà!');
            console.log('   Migration 013 déjà appliquée\n');
            return true;
        }
    } catch (err) {
        // Colonnes n'existent pas
    }

    // Lire le SQL de migration
    const sqlPath = path.join(__dirname, 'migrations', '013_add_task_dates.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('⏳ Exécution de la migration via RPC exec_sql...\n');

    // Essayer d'exécuter via RPC
    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql });
        
        if (error) {
            if (error.message.includes('function') || error.message.includes('does not exist')) {
                console.log('⚠️  Fonction exec_sql non disponible');
                return await createExecSqlFunction();
            }
            throw error;
        }

        if (data && data.success === false) {
            console.error('❌ Erreur SQL:', data.error);
            return false;
        }

        console.log('✅ Migration exécutée avec succès!\n');

        // Vérifier
        const { data: verifyData, error: verifyError } = await supabase
            .from('task_templates')
            .select('id, start_date, end_date')
            .limit(1);

        if (!verifyError) {
            console.log('✅ Colonnes créées et vérifiées!\n');
            return true;
        } else {
            console.log('⚠️  Vérification échouée:', verifyError.message);
            return false;
        }

    } catch (err) {
        console.error('❌ Erreur:', err.message);
        
        // Afficher le SQL pour exécution manuelle
        console.log('\n📋 SQL pour exécution manuelle:\n');
        console.log('='.repeat(70));
        console.log(sql);
        console.log('='.repeat(70));
        
        return false;
    }
}

// Exécuter
async function main() {
    // D'abord vérifier/créer la fonction RPC
    const rpcExists = await createExecSqlFunction();
    
    if (!rpcExists) {
        console.log('💡 Après avoir créé la fonction, relancez ce script');
        process.exit(1);
    }

    // Ensuite exécuter la migration
    const success = await executeMigration013();
    process.exit(success ? 0 : 1);
}

main();


