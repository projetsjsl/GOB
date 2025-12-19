#!/usr/bin/env node

/**
 * Script de test pour vérifier les modifications de bienvenue/index.html
 * - Vérifie que le champ "Délicat" a été supprimé
 * - Vérifie que toutes les dates par défaut sont 2026-01-01
 * - Vérifie que les calendriers acceptent 2026
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

console.log('🧪 Test des modifications bienvenue/index.html pour 2026\n');

// Lire le fichier
if (!fs.existsSync(BIENVENUE_FILE)) {
    console.error('❌ Fichier non trouvé:', BIENVENUE_FILE);
    process.exit(1);
}

const content = fs.readFileSync(BIENVENUE_FILE, 'utf-8');

// Test 1: Vérifier que "Délicat (J+)" n'existe plus
console.log('📋 Test 1: Vérification suppression champ "Délicat (J+)"');
const delicatMatches = content.match(/Délicat\s*\(J\+\)/gi);
if (delicatMatches && delicatMatches.length > 0) {
    errors.push(`❌ Le champ "Délicat (J+)" existe encore (${delicatMatches.length} occurrence(s))`);
    console.error(`   ❌ Trouvé ${delicatMatches.length} occurrence(s) du champ "Délicat (J+)"`);
} else {
    success.push('✅ Le champ "Délicat (J+)" a été supprimé');
    console.log('   ✅ Champ "Délicat (J+)" supprimé avec succès');
}

// Test 2: Vérifier que les dates par défaut sont 2026-01-01
console.log('\n📋 Test 2: Vérification dates par défaut 2026-01-01');

// Vérifier DataMapper.employeeToReact
if (!content.includes("startDate: db.start_date || '2026-01-01'")) {
    errors.push("❌ DataMapper.employeeToReact n'utilise pas 2026-01-01 par défaut");
    console.error("   ❌ DataMapper.employeeToReact manque la date par défaut");
} else {
    success.push("✅ DataMapper.employeeToReact utilise 2026-01-01");
    console.log("   ✅ DataMapper.employeeToReact configuré");
}

// Vérifier mapEmployee
if (!content.includes("startDate: e.start_date || '2026-01-01'")) {
    errors.push("❌ mapEmployee n'utilise pas 2026-01-01 par défaut");
    console.error("   ❌ mapEmployee manque la date par défaut");
} else {
    success.push("✅ mapEmployee utilise 2026-01-01");
    console.log("   ✅ mapEmployee configuré");
}

// Vérifier création nouvel employé
if (!content.includes("startDate: new Date('2026-01-01')")) {
    errors.push("❌ Création nouvel employé n'utilise pas 2026-01-01");
    console.error("   ❌ Date par défaut manquante pour nouveaux employés");
} else {
    success.push("✅ Nouveaux employés créés avec 2026-01-01");
    console.log("   ✅ Création employé configurée");
}

// Test 3: Vérifier les calendriers
console.log('\n📋 Test 3: Vérification configuration calendriers 2026');

// Vérifier DatePicker defaultValue
if (!content.includes("defaultValue={value || '2026-01-01'}")) {
    errors.push("❌ DatePicker n'a pas defaultValue 2026-01-01");
    console.error("   ❌ DatePicker defaultValue manquant");
} else {
    success.push("✅ DatePicker a defaultValue 2026-01-01");
    console.log("   ✅ DatePicker defaultValue configuré");
}

// Vérifier DatePicker min
if (!content.includes("min={min || '2026-01-01'}")) {
    errors.push("❌ DatePicker n'a pas min 2026-01-01 par défaut");
    console.error("   ❌ DatePicker min par défaut manquant");
} else {
    success.push("✅ DatePicker a min 2026-01-01 par défaut");
    console.log("   ✅ DatePicker min configuré");
}

// Vérifier input date employé
if (!content.includes('defaultValue="2026-01-01"') || !content.includes('min="2026-01-01"')) {
    errors.push("❌ Input date employé n'a pas defaultValue et min 2026-01-01");
    console.error("   ❌ Input date employé mal configuré");
} else {
    success.push("✅ Input date employé configuré pour 2026");
    console.log("   ✅ Input date employé configuré");
}

// Test 4: Vérifier qu'il n'y a pas de dates 2025 ou antérieures comme défaut
console.log('\n📋 Test 4: Vérification absence de dates 2025 ou antérieures');
const oldDates = content.match(/202[0-5]-01-01/g);
if (oldDates && oldDates.length > 0) {
    warnings.push(`⚠️  Trouvé ${oldDates.length} date(s) 2020-2025 (peut être normal)`);
    console.warn(`   ⚠️  ${oldDates.length} date(s) ancienne(s) trouvée(s)`);
} else {
    success.push("✅ Aucune date 2025 ou antérieure trouvée");
    console.log("   ✅ Pas de dates anciennes");
}

// Test 5: Compter les occurrences de 2026-01-01
console.log('\n📋 Test 5: Comptage occurrences 2026-01-01');
const count2026 = (content.match(/2026-01-01/g) || []).length;
if (count2026 < 10) {
    warnings.push(`⚠️  Seulement ${count2026} occurrence(s) de 2026-01-01 (attendu: au moins 10)`);
    console.warn(`   ⚠️  ${count2026} occurrence(s) trouvée(s)`);
} else {
    success.push(`✅ ${count2026} occurrence(s) de 2026-01-01 trouvée(s)`);
    console.log(`   ✅ ${count2026} occurrence(s) de 2026-01-01`);
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

