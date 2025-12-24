#!/usr/bin/env node

/**
 * Exécute directement le SQL de migration 013 via l'API Supabase Management
 * Utilise l'API REST de Supabase pour exécuter le SQL
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lire les credentials
let SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
let SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Si pas dans env, essayer de lire depuis env-config.js
if (!SUPABASE_URL) {
    try {
        const envConfigPath = path.join(__dirname, '..', 'public', 'js', 'env-config.js');
        if (fs.existsSync(envConfigPath)) {
            const envConfigContent = fs.readFileSync(envConfigPath, 'utf8');
            const urlMatch = envConfigContent.match(/SUPABASE_URL:\s*['"]([^'"]+)['"]/);
            if (urlMatch) SUPABASE_URL = urlMatch[1];
        }
    } catch (err) {
        // Ignorer
    }
}

if (!SUPABASE_URL) {
    console.error('❌ SUPABASE_URL manquant');
    process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY manquant');
    console.error('   Cette clé est nécessaire pour exécuter du SQL');
    console.error('   Vous pouvez la trouver dans: https://supabase.com/dashboard → Settings → API');
    console.error('   Exportez-la: export SUPABASE_SERVICE_ROLE_KEY=...\n');
    process.exit(1);
}

// Extraire le project ref
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectRef) {
    console.error('❌ Impossible d\'extraire le project ref de l\'URL');
    process.exit(1);
}

console.log('🔌 Connexion à Supabase...');
console.log(`   Project: ${projectRef}`);
console.log(`   URL: ${SUPABASE_URL.substring(0, 40)}...\n`);

// Lire le SQL de migration
const sqlPath = path.join(__dirname, 'migrations', '013_add_task_dates.sql');
if (!fs.existsSync(sqlPath)) {
    console.error('❌ Fichier migration non trouvé:', sqlPath);
    process.exit(1);
}

const sql = fs.readFileSync(sqlPath, 'utf8');
console.log('📋 SQL chargé\n');

// Créer le client Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function executeViaManagementAPI() {
    console.log('⏳ Exécution via API Management Supabase...\n');

    // Utiliser l'API Management de Supabase
    // Note: Cette API nécessite un token d'accès Supabase Management, pas juste la SERVICE_ROLE_KEY
    // Pour l'instant, on va utiliser une approche alternative

    // Méthode alternative: Utiliser pg directement si disponible
    // Sinon, on va créer une fonction RPC temporaire via l'API REST

    try {
        // Essayer d'exécuter via une requête POST vers l'API Supabase
        // L'API Supabase Management nécessite un token spécial
        
        // Pour l'instant, on va utiliser l'approche de création d'une fonction RPC via SQL Editor
        // puis l'appeler via RPC
        
        console.log('⚠️  L\'API Supabase Management nécessite un token d\'accès spécial');
        console.log('📋 Exécution manuelle requise via Supabase Dashboard\n');
        
        console.log('='.repeat(70));
        console.log(sql);
        console.log('='.repeat(70));
        
        console.log('\n📝 Instructions:');
        console.log('   1. Allez sur: https://supabase.com/dashboard');
        console.log(`   2. Sélectionnez le projet: ${projectRef}`);
        console.log('   3. Ouvrez "SQL Editor"');
        console.log('   4. Créez une nouvelle query');
        console.log('   5. Copiez-collez le SQL ci-dessus');
        console.log('   6. Cliquez sur "Run"\n');
        
        return false;
        
    } catch (err) {
        console.error('❌ Erreur:', err.message);
        return false;
    }
}

async function verifyMigration() {
    console.log('🔍 Vérification de la migration...\n');
    
    try {
        const { data, error } = await supabase
            .from('task_templates')
            .select('id, start_date, end_date')
            .limit(1);

        if (!error) {
            console.log('✅ Colonnes start_date et end_date existent!');
            console.log('   Migration 013 appliquée avec succès\n');
            return true;
        } else {
            if (error.message && (error.message.includes('column') || error.message.includes('not found'))) {
                console.log('⚠️  Colonnes manquantes');
                console.log(`   Erreur: ${error.message}\n`);
            } else {
                console.log('⚠️  Erreur de vérification:', error.message);
            }
            return false;
        }
    } catch (err) {
        console.error('❌ Erreur de vérification:', err.message);
        return false;
    }
}

// Exécuter
async function main() {
    // D'abord vérifier si la migration est déjà appliquée
    const alreadyApplied = await verifyMigration();
    if (alreadyApplied) {
        console.log('🎉 Migration déjà appliquée!\n');
        process.exit(0);
    }

    // Essayer d'exécuter
    const success = await executeViaManagementAPI();
    
    if (!success) {
        // Après exécution manuelle, vérifier à nouveau
        console.log('💡 Après avoir exécuté le SQL manuellement, relancez ce script pour vérifier');
        process.exit(1);
    }
    
    // Vérifier le résultat
    const verified = await verifyMigration();
    process.exit(verified ? 0 : 1);
}

main();




