#!/usr/bin/env node

/**
 * Execute toutes les migrations SQL dans supabase/migrations/
 * Utilise différentes méthodes pour exécuter le SQL
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.error('   Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

console.log('🔌 Connecting to Supabase...');
console.log(`   URL: ${SUPABASE_URL.substring(0, 30)}...\n`);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Exécute une requête SQL via l'API Supabase
 */
async function executeSQL(sql) {
    // Méthode 1: Via RPC exec_sql si disponible
    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql });
        if (!error) {
            return { success: true, method: 'rpc', data };
        }
    } catch (err) {
        // RPC non disponible
    }

    // Méthode 2: Via REST API directe
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            },
            body: JSON.stringify({ sql })
        });

        if (response.ok) {
            const data = await response.json();
            return { success: true, method: 'rest', data };
        }
    } catch (err) {
        // REST API non disponible
    }

    return { success: false, error: 'No SQL execution method available' };
}

/**
 * Vérifie si une colonne existe dans une table
 */
async function columnExists(tableName, columnName) {
    try {
        const { data, error } = await supabase
            .from(tableName)
            .select(columnName)
            .limit(1);
        
        if (error) {
            if (error.message && (error.message.includes('column') || error.message.includes('not found'))) {
                return false;
            }
            throw error;
        }
        return true;
    } catch (err) {
        return false;
    }
}

/**
 * Exécute la migration 013
 */
async function executeMigration013() {
    console.log('📄 Migration 013: Ajouter colonnes start_date et end_date à task_templates\n');

    const sqlPath = path.join(__dirname, 'migrations', '013_add_task_dates.sql');
    if (!fs.existsSync(sqlPath)) {
        console.error('❌ Fichier migration non trouvé:', sqlPath);
        return false;
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Vérifier si les colonnes existent déjà
    const startDateExists = await columnExists('task_templates', 'start_date');
    const endDateExists = await columnExists('task_templates', 'end_date');

    if (startDateExists && endDateExists) {
        console.log('✅ Colonnes start_date et end_date existent déjà');
        console.log('   Migration 013 déjà appliquée\n');
        return true;
    }

    console.log('⏳ Exécution de la migration...');

    // Essayer d'exécuter le SQL complet
    const result = await executeSQL(sql);

    if (result.success) {
        console.log('✅ Migration 013 exécutée avec succès via', result.method);
        
        // Vérifier que les colonnes existent maintenant
        const startDateNow = await columnExists('task_templates', 'start_date');
        const endDateNow = await columnExists('task_templates', 'end_date');
        
        if (startDateNow && endDateNow) {
            console.log('✅ Colonnes créées et vérifiées\n');
            return true;
        } else {
            console.log('⚠️  Colonnes créées mais vérification échouée\n');
            return false;
        }
    } else {
        // Si l'exécution automatique échoue, essayer d'exécuter les commandes une par une
        console.log('⚠️  Exécution automatique impossible');
        console.log('📋 Tentative d\'exécution manuelle des commandes...\n');

        // Extraire les commandes SQL individuelles
        const commands = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        let successCount = 0;
        for (let i = 0; i < commands.length; i++) {
            const cmd = commands[i] + ';';
            if (cmd.includes('DO $$') || cmd.includes('ALTER TABLE') || cmd.includes('CREATE INDEX') || cmd.includes('UPDATE')) {
                try {
                    const cmdResult = await executeSQL(cmd);
                    if (cmdResult.success) {
                        successCount++;
                        console.log(`   ✅ Commande ${i + 1}/${commands.length} exécutée`);
                    } else {
                        console.log(`   ⚠️  Commande ${i + 1}/${commands.length} nécessite exécution manuelle`);
                    }
                } catch (err) {
                    console.log(`   ⚠️  Commande ${i + 1}/${commands.length} échouée: ${err.message}`);
                }
            }
        }

        if (successCount > 0) {
            console.log(`\n✅ ${successCount}/${commands.length} commandes exécutées`);
        }

        // Vérifier à nouveau
        const startDateFinal = await columnExists('task_templates', 'start_date');
        const endDateFinal = await columnExists('task_templates', 'end_date');

        if (startDateFinal && endDateFinal) {
            console.log('✅ Colonnes créées avec succès\n');
            return true;
        } else {
            console.log('\n⚠️  EXÉCUTION MANUELLE NÉCESSAIRE');
            console.log('📋 Veuillez exécuter le SQL suivant dans Supabase Dashboard:');
            console.log('   1. Allez sur: https://supabase.com/dashboard');
            console.log('   2. Ouvrez SQL Editor');
            console.log('   3. Copiez-collez le contenu de: supabase/migrations/013_add_task_dates.sql');
            console.log('   4. Exécutez (Run)\n');
            return false;
        }
    }
}

/**
 * Liste et exécute toutes les migrations
 */
async function executeAllMigrations() {
    console.log('🔄 Exécution de toutes les migrations SQL\n');
    console.log('='.repeat(60));

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

    console.log(`📋 ${files.length} migration(s) trouvée(s)\n`);

    // Exécuter la migration 013 en priorité
    const migration013 = files.find(f => f.includes('013_add_task_dates'));
    if (migration013) {
        await executeMigration013();
    }

    // Pour les autres migrations, on peut les lister
    const otherMigrations = files.filter(f => !f.includes('013_add_task_dates'));
    if (otherMigrations.length > 0) {
        console.log('📋 Autres migrations disponibles:');
        otherMigrations.forEach(f => {
            console.log(`   - ${f}`);
        });
        console.log('\n💡 Pour exécuter les autres migrations, utilisez Supabase Dashboard\n');
    }

    console.log('='.repeat(60));
}

// Exécuter
executeAllMigrations()
    .then(() => {
        console.log('\n✅ Processus terminé');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Erreur:', error);
        process.exit(1);
    });







