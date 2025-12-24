#!/usr/bin/env node

/**
 * Execute Migration 013 directement via Supabase API
 * Utilise l'API Management de Supabase pour exécuter le SQL
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Essayer plusieurs sources pour les credentials
let SUPABASE_URL = process.env.SUPABASE_URL || 
                   process.env.NEXT_PUBLIC_SUPABASE_URL ||
                   process.env.VITE_SUPABASE_URL;

let SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                   process.env.SUPABASE_KEY ||
                   process.env.SUPABASE_ANON_KEY;

// Si pas dans env, essayer de lire depuis les fichiers de config
if (!SUPABASE_URL || !SUPABASE_KEY) {
    try {
        // Chercher dans les fichiers JS de config
        const configFiles = [
            'public/js/env-config.js',
            'lib/env-config.js',
            'src/config/supabase.js'
        ];
        
        for (const configFile of configFiles) {
            const configPath = path.join(__dirname, '..', configFile);
            if (fs.existsSync(configPath)) {
                const configContent = fs.readFileSync(configPath, 'utf8');
                const urlMatch = configContent.match(/SUPABASE_URL['"]?\s*[:=]\s*['"]([^'"]+)['"]/);
                const keyMatch = configContent.match(/SUPABASE_KEY['"]?\s*[:=]\s*['"]([^'"]+)['"]/);
                
                if (urlMatch && !SUPABASE_URL) SUPABASE_URL = urlMatch[1];
                if (keyMatch && !SUPABASE_KEY) SUPABASE_KEY = keyMatch[1];
            }
        }
    } catch (err) {
        // Ignorer les erreurs de lecture
    }
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase credentials');
    console.error('   Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    console.error('\n💡 Options:');
    console.error('   1. Créer .env.local avec SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY');
    console.error('   2. Exécuter manuellement dans Supabase Dashboard');
    console.error('   3. Utiliser Supabase CLI: supabase db push\n');
    process.exit(1);
}

console.log('🔌 Connexion à Supabase...');
console.log(`   URL: ${SUPABASE_URL.substring(0, 40)}...\n`);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function executeMigration013() {
    console.log('📄 Migration 013: Ajouter colonnes start_date et end_date\n');

    // Vérifier si les colonnes existent déjà
    console.log('🔍 Vérification des colonnes existantes...');
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

        if (error.message && (error.message.includes('column') || error.message.includes('not found'))) {
            console.log('⚠️  Colonnes manquantes, exécution de la migration...\n');
        } else {
            throw error;
        }
    } catch (err) {
        console.log('⚠️  Erreur lors de la vérification:', err.message);
        console.log('   Tentative d\'exécution de la migration...\n');
    }

    // Lire le fichier SQL
    const sqlPath = path.join(__dirname, 'migrations', '013_add_task_dates.sql');
    if (!fs.existsSync(sqlPath)) {
        console.error('❌ Fichier migration non trouvé:', sqlPath);
        return false;
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('📋 SQL chargé, exécution...\n');

    // Méthode 1: Essayer via RPC exec_sql si disponible
    try {
        console.log('⏳ Tentative via RPC exec_sql...');
        const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', { sql });
        
        if (!rpcError) {
            console.log('✅ Migration exécutée avec succès via RPC!\n');
            
            // Vérifier
            const { data: verifyData, error: verifyError } = await supabase
                .from('task_templates')
                .select('id, start_date, end_date')
                .limit(1);
            
            if (!verifyError) {
                console.log('✅ Colonnes créées et vérifiées!\n');
                return true;
            }
        } else if (!rpcError.message.includes('function') && !rpcError.message.includes('does not exist')) {
            throw rpcError;
        }
    } catch (err) {
        console.log('   ⚠️  RPC exec_sql non disponible');
    }

    // Méthode 2: Essayer via REST API Management
    try {
        console.log('⏳ Tentative via REST API...');
        const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
        
        if (projectRef) {
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
                console.log('✅ Migration exécutée via REST API!\n');
                
                // Vérifier
                const { data: verifyData, error: verifyError } = await supabase
                    .from('task_templates')
                    .select('id, start_date, end_date')
                    .limit(1);
                
                if (!verifyError) {
                    console.log('✅ Colonnes créées et vérifiées!\n');
                    return true;
                }
            }
        }
    } catch (err) {
        console.log('   ⚠️  REST API Management non disponible');
    }

    // Si toutes les méthodes automatiques échouent, afficher les instructions
    console.log('\n⚠️  EXÉCUTION AUTOMATIQUE IMPOSSIBLE');
    console.log('📋 Veuillez exécuter le SQL manuellement:\n');
    console.log('='.repeat(70));
    console.log(sql);
    console.log('='.repeat(70));
    console.log('\n📝 Instructions:');
    console.log('   1. Allez sur: https://supabase.com/dashboard');
    console.log('   2. Sélectionnez votre projet');
    console.log('   3. Ouvrez "SQL Editor"');
    console.log('   4. Créez une nouvelle query');
    console.log('   5. Copiez-collez le SQL ci-dessus');
    console.log('   6. Cliquez sur "Run"\n');
    
    return false;
}

// Exécuter
executeMigration013()
    .then((success) => {
        if (success) {
            console.log('🎉 Migration 013 complétée avec succès!');
        } else {
            console.log('💡 Migration nécessite une exécution manuelle');
        }
        process.exit(success ? 0 : 1);
    })
    .catch((error) => {
        console.error('\n❌ Erreur:', error);
        process.exit(1);
    });




