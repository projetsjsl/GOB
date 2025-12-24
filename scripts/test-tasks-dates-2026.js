#!/usr/bin/env node

/**
 * Script de test pour vérifier que toutes les dates de tâches sont en 2026
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BIENVENUE_FILE = path.join(__dirname, '../public/bienvenue/index.html');

let errors = [];
let warnings = [];
let success = [];

console.log('🧪 Test des dates de tâches pour 2026\n');

const content = fs.readFileSync(BIENVENUE_FILE, 'utf-8');

// Test 1: Vérifier que TaskManager.ensureMinDate2026 existe
console.log('📋 Test 1: Vérification fonction ensureMinDate2026');
if (content.includes('ensureMinDate2026')) {
    success.push('✅ Fonction ensureMinDate2026 présente');
    console.log('   ✅ Fonction ensureMinDate2026 trouvée');
} else {
    errors.push('❌ Fonction ensureMinDate2026 manquante');
    console.error('   ❌ Fonction ensureMinDate2026 manquante');
}

// Test 2: Vérifier que generateTasks utilise ensureMinDate2026
console.log('\n📋 Test 2: Vérification utilisation ensureMinDate2026 dans generateTasks');
if (content.includes('this.ensureMinDate2026(employee.startDate)') || 
    content.includes('TaskManager.ensureMinDate2026(employee.startDate)')) {
    success.push('✅ generateTasks utilise ensureMinDate2026');
    console.log('   ✅ generateTasks utilise ensureMinDate2026');
} else {
    errors.push('❌ generateTasks n\'utilise pas ensureMinDate2026');
    console.error('   ❌ generateTasks n\'utilise pas ensureMinDate2026');
}

// Test 3: Vérifier que tous les DatePicker utilisent ensureMinDate2026
console.log('\n📋 Test 3: Vérification DatePicker utilisent ensureMinDate2026');
const datePickerMatches = content.match(/DatePicker[\s\S]{0,500}?ensureMinDate2026/g) || [];
const datePickerCount = (content.match(/DatePicker/g) || []).length;
const ensureMinDateCount = (content.match(/ensureMinDate2026/g) || []).length;

if (ensureMinDateCount >= 8) {
    success.push(`✅ ${ensureMinDateCount} utilisation(s) de ensureMinDate2026 trouvée(s)`);
    console.log(`   ✅ ${ensureMinDateCount} utilisation(s) de ensureMinDate2026`);
} else {
    warnings.push(`⚠️  Seulement ${ensureMinDateCount} utilisation(s) de ensureMinDate2026 (attendu: au moins 8)`);
    console.warn(`   ⚠️  ${ensureMinDateCount} utilisation(s) trouvée(s)`);
}

// Test 4: Vérifier que getValidDate utilise ensureMinDate2026
console.log('\n📋 Test 4: Vérification getValidDate utilise ensureMinDate2026');
if (content.includes('getValidDate') && content.includes('TaskManager.ensureMinDate2026')) {
    success.push('✅ getValidDate utilise ensureMinDate2026');
    console.log('   ✅ getValidDate utilise ensureMinDate2026');
} else {
    warnings.push('⚠️  getValidDate pourrait ne pas utiliser ensureMinDate2026');
    console.warn('   ⚠️  Vérification getValidDate');
}

// Test 5: Vérifier que les min des DatePicker sont 2026-01-01
console.log('\n📋 Test 5: Vérification min="2026-01-01" dans DatePicker');
const min2026Count = (content.match(/min="2026-01-01"/g) || []).length;
if (min2026Count >= 3) {
    success.push(`✅ ${min2026Count} DatePicker avec min="2026-01-01"`);
    console.log(`   ✅ ${min2026Count} DatePicker avec min="2026-01-01"`);
} else {
    warnings.push(`⚠️  Seulement ${min2026Count} DatePicker avec min="2026-01-01"`);
    console.warn(`   ⚠️  ${min2026Count} DatePicker avec min="2026-01-01"`);
}

// Test 6: Vérifier qu'il n'y a pas de dates hardcodées avant 2026
console.log('\n📋 Test 6: Vérification absence de dates hardcodées avant 2026');
const oldDates = content.match(/new Date\(['"]202[0-5]/g) || [];
if (oldDates.length === 0) {
    success.push('✅ Aucune date hardcodée avant 2026');
    console.log('   ✅ Aucune date hardcodée avant 2026');
} else {
    errors.push(`❌ ${oldDates.length} date(s) hardcodée(s) avant 2026 trouvée(s)`);
    console.error(`   ❌ ${oldDates.length} date(s) avant 2026: ${oldDates.slice(0, 3).join(', ')}`);
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




