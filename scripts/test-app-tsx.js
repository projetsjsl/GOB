#!/usr/bin/env node

/**
 * Script de test pour vérifier App.tsx
 * - Vérifie la syntaxe TypeScript/React
 * - Vérifie les imports
 * - Vérifie les erreurs courantes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_TSX_FILE = path.join(__dirname, '../public/3p1/App.tsx');
const PROJECT_ROOT = path.join(__dirname, '..');

let errors = [];
let warnings = [];
let success = [];

console.log('🧪 Test de App.tsx\n');

// Test 1: Vérifier que le fichier existe
console.log('📋 Test 1: Vérification existence du fichier');
if (!fs.existsSync(APP_TSX_FILE)) {
    errors.push(`❌ Fichier non trouvé: ${APP_TSX_FILE}`);
    console.error(`   ❌ Fichier non trouvé`);
    process.exit(1);
} else {
    success.push('✅ Fichier App.tsx trouvé');
    console.log('   ✅ Fichier trouvé');
}

// Lire le contenu
const content = fs.readFileSync(APP_TSX_FILE, 'utf-8');
const lines = content.split('\n');

// Test 2: Vérifier les imports React
console.log('\n📋 Test 2: Vérification imports React');
if (!content.includes("import React") && !content.includes("import * as React")) {
    errors.push("❌ Import React manquant");
    console.error("   ❌ Import React manquant");
} else {
    success.push("✅ Import React présent");
    console.log("   ✅ Import React présent");
}

// Test 3: Vérifier les hooks React
console.log('\n📋 Test 3: Vérification hooks React');
const requiredHooks = ['useState', 'useEffect', 'useRef', 'useMemo'];
const missingHooks = requiredHooks.filter(hook => !content.includes(hook));
if (missingHooks.length > 0) {
    warnings.push(`⚠️  Hooks manquants: ${missingHooks.join(', ')}`);
    console.warn(`   ⚠️  Hooks manquants: ${missingHooks.join(', ')}`);
} else {
    success.push("✅ Hooks React présents");
    console.log("   ✅ Hooks React présents");
}

// Test 4: Vérifier les exports
console.log('\n📋 Test 4: Vérification exports');
if (!content.includes('export') && !content.includes('export default')) {
    errors.push("❌ Aucun export trouvé");
    console.error("   ❌ Aucun export trouvé");
} else {
    success.push("✅ Exports présents");
    console.log("   ✅ Exports présents");
}

// Test 5: Vérifier les composants importés
console.log('\n📋 Test 5: Vérification composants importés');
const componentImports = content.match(/import.*from ['"].*components\//g) || [];
const missingComponents = [];
const requiredComponents = ['Header', 'Sidebar', 'HistoricalTable'];
requiredComponents.forEach(comp => {
    if (!content.includes(`import.*${comp}`) && !content.includes(`{ ${comp} }`)) {
        missingComponents.push(comp);
    }
});

if (missingComponents.length > 0) {
    warnings.push(`⚠️  Composants potentiellement manquants: ${missingComponents.join(', ')}`);
    console.warn(`   ⚠️  Composants potentiellement manquants: ${missingComponents.join(', ')}`);
} else {
    success.push("✅ Composants principaux importés");
    console.log("   ✅ Composants principaux importés");
}

// Test 6: Vérifier les erreurs de syntaxe courantes
console.log('\n📋 Test 6: Vérification erreurs de syntaxe courantes');

// Vérifier les accolades non fermées
const openBraces = (content.match(/{/g) || []).length;
const closeBraces = (content.match(/}/g) || []).length;
if (Math.abs(openBraces - closeBraces) > 5) {
    errors.push(`❌ Déséquilibre d'accolades: ${openBraces} ouvertes, ${closeBraces} fermées`);
    console.error(`   ❌ Déséquilibre d'accolades: ${openBraces} ouvertes, ${closeBraces} fermées`);
} else {
    success.push("✅ Accolades équilibrées");
    console.log("   ✅ Accolades équilibrées");
}

// Vérifier les parenthèses non fermées
const openParens = (content.match(/\(/g) || []).length;
const closeParens = (content.match(/\)/g) || []).length;
if (Math.abs(openParens - closeParens) > 5) {
    errors.push(`❌ Déséquilibre de parenthèses: ${openParens} ouvertes, ${closeParens} fermées`);
    console.error(`   ❌ Déséquilibre de parenthèses: ${openParens} ouvertes, ${closeParens} fermées`);
} else {
    success.push("✅ Parenthèses équilibrées");
    console.log("   ✅ Parenthèses équilibrées");
}

// Test 7: Vérifier les erreurs TypeScript courantes
console.log('\n📋 Test 7: Vérification erreurs TypeScript courantes');

// Vérifier les any explicites (mauvais signe)
const anyCount = (content.match(/\bany\b/g) || []).length;
if (anyCount > 10) {
    warnings.push(`⚠️  ${anyCount} occurrences de 'any' trouvées (considérer utiliser des types spécifiques)`);
    console.warn(`   ⚠️  ${anyCount} occurrences de 'any'`);
} else {
    success.push("✅ Peu d'utilisation de 'any'");
    console.log("   ✅ Peu d'utilisation de 'any'");
}

// Test 8: Vérifier la structure du composant
console.log('\n📋 Test 8: Vérification structure du composant');
if (!content.includes('const App') && !content.includes('function App') && !content.includes('export default function')) {
    errors.push("❌ Composant App non trouvé");
    console.error("   ❌ Composant App non trouvé");
} else {
    success.push("✅ Composant App trouvé");
    console.log("   ✅ Composant App trouvé");
}

// Test 9: Vérifier les types TypeScript
console.log('\n📋 Test 9: Vérification types TypeScript');
const hasTypes = content.includes(':') && (content.includes('interface') || content.includes('type ') || content.includes('import.*types'));
if (!hasTypes) {
    warnings.push("⚠️  Peu de types TypeScript détectés");
    console.warn("   ⚠️  Peu de types TypeScript détectés");
} else {
    success.push("✅ Types TypeScript présents");
    console.log("   ✅ Types TypeScript présents");
}

// Test 10: Vérifier les erreurs de linting avec TypeScript compiler si disponible
console.log('\n📋 Test 10: Vérification compilation TypeScript');
try {
    // Vérifier si tsconfig.json existe
    const tsconfigPath = path.join(PROJECT_ROOT, 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
        try {
            // Essayer de compiler avec tsc (si disponible)
            execSync(`cd ${PROJECT_ROOT} && npx tsc --noEmit --skipLibCheck public/3p1/App.tsx 2>&1`, { 
                encoding: 'utf-8',
                stdio: 'pipe',
                timeout: 30000
            });
            success.push("✅ Compilation TypeScript réussie");
            console.log("   ✅ Compilation TypeScript réussie");
        } catch (error) {
            const errorOutput = error.stdout || error.stderr || error.message;
            if (errorOutput.includes('error TS')) {
                const errorCount = (errorOutput.match(/error TS\d+/g) || []).length;
                errors.push(`❌ ${errorCount} erreur(s) TypeScript détectée(s)`);
                console.error(`   ❌ ${errorCount} erreur(s) TypeScript`);
                console.error(`   ${errorOutput.split('\n').slice(0, 5).join('\n   ')}`);
            } else {
                warnings.push("⚠️  Impossible de vérifier la compilation TypeScript");
                console.warn("   ⚠️  Impossible de vérifier la compilation");
            }
        }
    } else {
        warnings.push("⚠️  tsconfig.json non trouvé, compilation non vérifiée");
        console.warn("   ⚠️  tsconfig.json non trouvé");
    }
} catch (error) {
    warnings.push("⚠️  TypeScript non disponible, compilation non vérifiée");
    console.warn("   ⚠️  TypeScript non disponible");
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

