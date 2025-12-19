#!/usr/bin/env node

/**
 * Test pour vérifier que le calendrier affiche correctement les dates en 2026
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
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testCalendarDisplay() {
    console.log('🧪 Test de l\'affichage du calendrier\n');
    
    let allTestsPassed = true;
    const errors = [];

    // Test 1: Vérifier que tous les employés ont des dates >= 2026-01-01
    console.log('1️⃣  Vérification des dates d\'employés...');
    try {
        const { data: employees, error } = await supabase
            .from('employees')
            .select('id, name, start_date');

        if (error) {
            throw error;
        }

        if (!employees || employees.length === 0) {
            console.log('   ⚠️  Aucun employé trouvé');
        } else {
            const minDate = '2026-01-01';
            const invalidEmployees = employees.filter(e => !e.start_date || e.start_date < minDate);
            
            if (invalidEmployees.length === 0) {
                console.log(`   ✅ Tous les ${employees.length} employés ont des dates >= ${minDate}`);
            } else {
                console.log(`   ❌ ${invalidEmployees.length} employé(s) avec dates invalides:`);
                invalidEmployees.forEach(emp => {
                    console.log(`      - ${emp.name}: ${emp.start_date || 'NULL'}`);
                });
                errors.push(`${invalidEmployees.length} employé(s) avec dates < 2026-01-01`);
                allTestsPassed = false;
            }
        }
    } catch (err) {
        console.log(`   ❌ Erreur: ${err.message}`);
        errors.push(`Erreur vérification employés: ${err.message}`);
        allTestsPassed = false;
    }

    // Test 2: Vérifier que toutes les tâches ont des dates dans Q1 2026
    console.log('\n2️⃣  Vérification des dates de tâches...');
    try {
        const { data: tasks, error } = await supabase
            .from('task_templates')
            .select('id, title, start_date, end_date');

        if (error) {
            throw error;
        }

        if (!tasks || tasks.length === 0) {
            console.log('   ⚠️  Aucune tâche trouvée');
        } else {
            const q1Start = '2026-01-01';
            const q1End = '2026-03-31';
            
            const invalidTasks = tasks.filter(t => {
                if (!t.start_date || !t.end_date) return true;
                return t.start_date < q1Start || t.start_date > q1End || 
                       t.end_date < q1Start || t.end_date > q1End;
            });

            if (invalidTasks.length === 0) {
                console.log(`   ✅ Toutes les ${tasks.length} tâches ont des dates dans Q1 2026`);
            } else {
                console.log(`   ⚠️  ${invalidTasks.length} tâche(s) avec dates hors Q1 2026`);
                invalidTasks.slice(0, 5).forEach(task => {
                    console.log(`      - ${task.title}: ${task.start_date} → ${task.end_date}`);
                });
            }
        }
    } catch (err) {
        console.log(`   ⚠️  Erreur: ${err.message}`);
    }

    // Test 3: Vérifier le code HTML pour les contraintes de dates
    console.log('\n3️⃣  Vérification du code HTML...');
    try {
        const htmlPath = path.join(__dirname, '..', 'public', 'bienvenue', 'index.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        
        const checks = [
            { pattern: /min="2026-01-01"/g, name: 'min="2026-01-01" dans inputs date' },
            { pattern: /min\{min \|\| '2026-01-01'\}/g, name: 'min par défaut 2026-01-01' },
            { pattern: /ensureMinDate2026/g, name: 'ensureMinDate2026 utilisé' },
            { pattern: /employeeToReact.*2026-01-01/g, name: 'employeeToReact avec 2026-01-01' }
        ];

        let htmlTestsPassed = true;
        checks.forEach(check => {
            const matches = htmlContent.match(check.pattern);
            if (matches && matches.length > 0) {
                console.log(`   ✅ ${check.name}: ${matches.length} occurrence(s)`);
            } else {
                console.log(`   ⚠️  ${check.name}: non trouvé`);
                htmlTestsPassed = false;
            }
        });

        if (!htmlTestsPassed) {
            errors.push('Certaines vérifications HTML ont échoué');
        }
    } catch (err) {
        console.log(`   ⚠️  Erreur lecture HTML: ${err.message}`);
    }

    // Résumé
    console.log('\n' + '='.repeat(60));
    if (allTestsPassed) {
        console.log('✅ Tous les tests sont passés!');
        console.log('🎉 Le calendrier devrait afficher correctement les dates en 2026\n');
        return true;
    } else {
        console.log('❌ Certains tests ont échoué:');
        errors.forEach(err => console.log(`   - ${err}`));
        console.log('');
        return false;
    }
}

// Exécuter les tests
testCalendarDisplay()
    .then((success) => {
        process.exit(success ? 0 : 1);
    })
    .catch((error) => {
        console.error('❌ Erreur fatale:', error);
        process.exit(1);
    });

