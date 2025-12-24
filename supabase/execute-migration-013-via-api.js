#!/usr/bin/env node

/**
 * Execute Migration 013 via Supabase API
 * Utilise l'URL et la clé depuis env-config.js ou variables d'environnement
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lire les credentials depuis env-config.js
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
            
            if (urlMatch && !SUPABASE_URL) {
                SUPABASE_URL = urlMatch[1];
                console.log('📋 URL trouvée dans env-config.js');
            }
            if (keyMatch && !SUPABASE_KEY) {
                SUPABASE_KEY = keyMatch[1];
                console.log('📋 Clé trouvée dans env-config.js (ANON_KEY - peut nécessiter SERVICE_ROLE_KEY pour ALTER TABLE)');
            }
        }
    } catch (err) {
        console.error('⚠️  Erreur lecture env-config.js:', err.message);
    }
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('\n❌ Credentials Supabase manquants');
    console.error('   Options:');
    console.error('   1. Créer .env.local avec SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY');
    console.error('   2. Exporter: export SUPABASE_URL=... && export SUPABASE_SERVICE_ROLE_KEY=...');
    console.error('   3. Exécuter manuellement dans Supabase Dashboard\n');
    process.exit(1);
}

console.log('🔌 Connexion à Supabase...');
console.log(`   URL: ${SUPABASE_URL.substring(0, 40)}...\n`);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function executeSQLStatements() {
    console.log('📄 Migration 013: Ajouter colonnes start_date et end_date\n');

    // Lire le fichier SQL
    const sqlPath = path.join(__dirname, 'migrations', '013_add_task_dates.sql');
    if (!fs.existsSync(sqlPath)) {
        console.error('❌ Fichier migration non trouvé:', sqlPath);
        return false;
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('📋 SQL chargé\n');

    // Vérifier si les colonnes existent déjà
    console.log('🔍 Vérification des colonnes...');
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
        // Colonnes n'existent pas, continuer
    }

    // Extraire le project ref de l'URL
    const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    
    if (!projectRef) {
        console.error('❌ Impossible d\'extraire le project ref de l\'URL');
        return false;
    }

    console.log(`📍 Project: ${projectRef}\n`);

    // Essayer d'exécuter via l'API Management de Supabase
    console.log('⏳ Tentative d\'exécution via API Management...\n');

    // Diviser le SQL en commandes individuelles
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📋 ${statements.length} commande(s) SQL à exécuter\n`);

    let successCount = 0;
    const errors = [];

    for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ';';
        const statementType = statement.match(/^\s*(DO|ALTER|CREATE|UPDATE)/i)?.[1] || 'UNKNOWN';
        
        console.log(`⏳ [${i + 1}/${statements.length}] ${statementType}...`);

        try {
            // Méthode 1: Via RPC exec_sql si disponible
            const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', { sql: statement });
            
            if (!rpcError) {
                console.log(`   ✅ Exécuté via RPC`);
                successCount++;
                continue;
            }

            // Méthode 2: Via API Management REST
            const managementUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
            
            const response = await fetch(managementUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'apikey': SUPABASE_KEY
                },
                body: JSON.stringify({ query: statement })
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`   ✅ Exécuté via API Management`);
                successCount++;
                continue;
            } else {
                const errorText = await response.text();
                console.log(`   ⚠️  API Management: ${response.status} ${errorText.substring(0, 100)}`);
            }

            // Méthode 3: Pour ALTER TABLE ADD COLUMN, essayer via une approche alternative
            if (statement.includes('ADD COLUMN start_date')) {
                console.log('   💡 Colonne start_date nécessite exécution manuelle');
            } else if (statement.includes('ADD COLUMN end_date')) {
                console.log('   💡 Colonne end_date nécessite exécution manuelle');
            } else {
                console.log(`   ⚠️  Nécessite exécution manuelle`);
            }

            errors.push({ statement: i + 1, type: statementType });

        } catch (err) {
            console.log(`   ❌ Erreur: ${err.message}`);
            errors.push({ statement: i + 1, type: statementType, error: err.message });
        }
    }

    console.log(`\n📊 Résultat: ${successCount}/${statements.length} commandes exécutées`);

    // Vérifier le résultat final
    console.log('\n🔍 Vérification finale...');
    try {
        const { data: finalCheck, error: finalError } = await supabase
            .from('task_templates')
            .select('id, start_date, end_date')
            .limit(1);

        if (!finalError) {
            console.log('✅ Colonnes start_date et end_date existent maintenant!');
            console.log('🎉 Migration 013 complétée avec succès!\n');
            return true;
        } else {
            console.log('⚠️  Colonnes toujours manquantes');
            console.log(`   Erreur: ${finalError.message}\n`);
        }
    } catch (err) {
        console.log(`⚠️  Erreur vérification: ${err.message}\n`);
    }

    if (errors.length > 0) {
        console.log('⚠️  EXÉCUTION MANUELLE NÉCESSAIRE');
        console.log('📋 Veuillez exécuter le SQL suivant dans Supabase Dashboard:\n');
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
    }

    return successCount === statements.length;
}

// Exécuter
executeSQLStatements()
    .then((success) => {
        process.exit(success ? 0 : 1);
    })
    .catch((error) => {
        console.error('\n❌ Erreur fatale:', error);
        process.exit(1);
    });




