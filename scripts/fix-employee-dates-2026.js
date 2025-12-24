#!/usr/bin/env node

/**
 * Script pour forcer toutes les dates d'employés à être >= 2026-01-01
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
    console.error('   Définissez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixEmployeeDates() {
    console.log('🔧 Correction des dates d\'employés pour 2026\n');
    
    try {
        // Récupérer tous les employés
        const { data: employees, error: fetchError } = await supabase
            .from('employees')
            .select('id, name, start_date');

        if (fetchError) {
            throw fetchError;
        }

        if (!employees || employees.length === 0) {
            console.log('⚠️  Aucun employé trouvé');
            return;
        }

        console.log(`📋 ${employees.length} employé(s) trouvé(s)\n`);

        const minDate = '2026-01-01';
        const updates = [];

        for (const emp of employees) {
            const currentDate = emp.start_date;
            
            if (!currentDate || currentDate < minDate) {
                console.log(`   🔄 ${emp.name}: ${currentDate || 'NULL'} → ${minDate}`);
                updates.push({
                    id: emp.id,
                    start_date: minDate
                });
            } else {
                console.log(`   ✅ ${emp.name}: ${currentDate} (déjà OK)`);
            }
        }

        if (updates.length === 0) {
            console.log('\n✅ Tous les employés ont déjà des dates >= 2026-01-01');
            return;
        }

        console.log(`\n💾 Mise à jour de ${updates.length} employé(s)...`);

        // Mettre à jour en batch
        for (const update of updates) {
            const { error } = await supabase
                .from('employees')
                .update({ start_date: update.start_date })
                .eq('id', update.id);

            if (error) {
                console.error(`   ❌ Erreur pour ${update.id}:`, error.message);
            } else {
                console.log(`   ✅ ${update.id} mis à jour`);
            }
        }

        console.log('\n🎉 Correction terminée!');
        
        // Vérification finale
        const { data: verifyEmployees } = await supabase
            .from('employees')
            .select('id, name, start_date');

        const invalidDates = verifyEmployees.filter(e => !e.start_date || e.start_date < minDate);
        
        if (invalidDates.length === 0) {
            console.log('✅ Vérification: Toutes les dates sont >= 2026-01-01');
        } else {
            console.log(`⚠️  ${invalidDates.length} employé(s) avec dates invalides restantes`);
        }

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

// Exécuter
fixEmployeeDates()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Erreur fatale:', error);
        process.exit(1);
    });






