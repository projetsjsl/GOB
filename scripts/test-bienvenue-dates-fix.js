#!/usr/bin/env node

/**
 * Script de test pour vérifier la correction des dates et colonnes task_templates
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BIENVENUE_FILE = path.join(__dirname, '../public/bienvenue/index.html');
const MIGRATION_FILE = path.join(__dirname, '../supabase/migrations/013_add_task_dates.sql');

let errors = [];
let warnings = [];
let success = [];

console.log('🧪 Test correction dates et colonnes task_templates\n');

// Test 1: Vérifier que la migration existe
console.log('📋 Test 1: Vérification migration SQL');
if (fs.existsSync(MIGRATION_FILE)) {
    success.push('✅ Migration 013_add_task_dates.sql trouvée');
    console.log('   ✅ Migration trouvée');
    
    const migrationContent = fs.readFileSync(MIGRATION_FILE, 'utf-8');
    if (migrationContent.includes('start_date') && migrationContent.includes('end_date')) {
        success.push('✅ Migration contient start_date et end_date');
        console.log('   ✅ Migration contient les colonnes nécessaires');
    } else {
        errors.push('❌ Migration ne contient pas start_date/end_date');
        console.error('   ❌ Migration incomplète');
    }
} else {
    errors.push('❌ Migration 013_add_task_dates.sql non trouvée');
    console.error('   ❌ Migration non trouvée');
}

// Test 2: Vérifier que le code gère les colonnes manquantes
console.log('\n📋 Test 2: Vérification gestion erreurs colonnes manquantes');
const content = fs.readFileSync(BIENVENUE_FILE, 'utf-8');

if (content.includes('schema cache') || content.includes('column') && content.includes('not found')) {
    success.push('✅ Code gère les erreurs de colonnes manquantes');
    console.log('   ✅ Gestion d\'erreurs présente');
} else {
    warnings.push('⚠️  Gestion d\'erreurs colonnes manquantes pourrait être améliorée');
    console.warn('   ⚠️  Vérification gestion d\'erreurs');
}

// Test 3: Vérifier que startDate et endDate sont mappés correctement
console.log('\n📋 Test 3: Vérification mapping startDate/endDate');
if (content.includes("field === 'startDate' ? 'start_date'") && 
    content.includes("field === 'endDate' ? 'end_date'")) {
    success.push('✅ Mapping startDate/endDate correct');
    console.log('   ✅ Mapping correct');
} else {
    errors.push('❌ Mapping startDate/endDate manquant');
    console.error('   ❌ Mapping manquant');
}

// Test 4: Vérifier que ensureQ1_2026 est utilisé
console.log('\n📋 Test 4: Vérification ensureQ1_2026');
if (content.includes('ensureQ1_2026')) {
    success.push('✅ Fonction ensureQ1_2026 présente');
    console.log('   ✅ Fonction présente');
} else {
    errors.push('❌ Fonction ensureQ1_2026 manquante');
    console.error('   ❌ Fonction manquante');
}

// Test 5: Vérifier que les DatePicker ont min et max
console.log('\n📋 Test 5: Vérification limites DatePicker');
const min2026Count = (content.match(/min="2026-01-01"/g) || []).length;
const max2026Count = (content.match(/max="2026-03-31"/g) || []).length;

if (min2026Count >= 3 && max2026Count >= 3) {
    success.push(`✅ ${min2026Count} DatePicker avec min, ${max2026Count} avec max`);
    console.log(`   ✅ ${min2026Count} min, ${max2026Count} max`);
} else {
    warnings.push(`⚠️  Seulement ${min2026Count} min, ${max2026Count} max`);
    console.warn(`   ⚠️  ${min2026Count} min, ${max2026Count} max`);
}

// Résumé
console.log('\n' + '='.repeat(60));
console.log('📊 RÉSUMÉ DES TESTS');
console.log('='.repeat(60));

if (success.length > 0) {
    console.log(`\n✅ Succès (${success.length}):`);
    success.forEach(s => console.log(`   ${s}`));
}

if (warnings.length > 0) {
    console.log(`\n⚠️  Avertissements (${warnings.length}):`);
    warnings.forEach(w => console.log(`   ${w}`));
}

if (errors.length > 0) {
    console.log(`\n❌ Erreurs (${errors.length}):`);
    errors.forEach(e => console.log(`   ${e}`));
    console.log('\n❌ TESTS ÉCHOUÉS');
    process.exit(1);
} else {
    console.log('\n✅ TOUS LES TESTS SONT PASSÉS');
    process.exit(0);
}




