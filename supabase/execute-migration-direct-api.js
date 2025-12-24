#!/usr/bin/env node

/**
 * Exécute la migration 013 directement via l'API Supabase
 * Utilise les credentials depuis env-config.js ou variables d'environnement
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
    process.exit(1);
}

console.log('🔌 Connexion à Supabase...');
console.log(`   URL: ${SUPABASE_URL.substring(0, 40)}...\n`);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Lire le SQL
const sqlPath = path.join(__dirname, 'migrations', '013_add_task_dates.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

// Extraire le project ref
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

async function executeSQL() {
    console.log('📄 Migration 013: Ajouter colonnes start_date et end_date\n');
    
    // Vérifier si déjà appliquée
    try {
        const { data, error } = await supabase
            .from('task_templates')
            .select('id, start_date, end_date')
            .limit(1);
        
        if (!error) {
            console.log('✅ Migration 013 déjà appliquée!\n');
            return true;
        }
    } catch (err) {
        // Continuer
    }

    console.log('⏳ Exécution de la migration...\n');

    // Utiliser l'API Supabase Management pour exécuter le SQL
    // Note: Cela nécessite un token d'accès Supabase Management
    // Pour l'instant, on va utiliser une approche alternative
    
    // Méthode: Créer une fonction RPC temporaire via l'API REST
    // puis l'appeler pour exécuter le SQL
    
    try {
        // Essayer d'exécuter via l'endpoint SQL de Supabase
        // L'API Supabase Management nécessite un token spécial
        
        const managementUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
        
        const response = await fetch(managementUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'apikey': SUPABASE_KEY
            },
            body: JSON.stringify({ query: sql })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Migration exécutée avec succès!\n');
            
            // Vérifier
            const { data: verifyData, error: verifyError } = await supabase
                .from('task_templates')
                .select('id, start_date, end_date')
                .limit(1);
            
            if (!verifyError) {
                console.log('✅ Colonnes créées et vérifiées!\n');
                return true;
            }
        } else {
            const errorText = await response.text();
            console.log(`⚠️  API Management: ${response.status}`);
            console.log(`   ${errorText.substring(0, 200)}\n`);
        }
    } catch (err) {
        console.log(`⚠️  Erreur: ${err.message}\n`);
    }

    // Si l'exécution automatique échoue, afficher le SQL
    console.log('📋 SQL pour exécution manuelle:\n');
    console.log('='.repeat(70));
    console.log(sql);
    console.log('='.repeat(70));
    console.log('\n📝 Instructions:');
    console.log('   1. Allez sur: https://supabase.com/dashboard');
    if (projectRef) {
        console.log(`   2. Sélectionnez le projet: ${projectRef}`);
    }
    console.log('   3. Ouvrez "SQL Editor"');
    console.log('   4. Copiez-collez le SQL ci-dessus');
    console.log('   5. Cliquez sur "Run"\n');
    
    return false;
}

executeSQL()
    .then((success) => {
        process.exit(success ? 0 : 1);
    })
    .catch((error) => {
        console.error('❌ Erreur:', error);
        process.exit(1);
    });







