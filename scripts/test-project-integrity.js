#!/usr/bin/env node

/**
 * Script de test d'intégrité du projet
 * - Vérifie les fichiers critiques
 * - Vérifie les imports et dépendances
 * - Vérifie la structure du projet
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.join(__dirname, '..');

let errors = [];
let warnings = [];
let success = [];

console.log('🧪 Test d\'intégrité du projet GOB\n');

// Test 1: Vérifier les fichiers critiques
console.log('📋 Test 1: Vérification fichiers critiques');
const criticalFiles = [
    'package.json',
    'tsconfig.json',
    'public/3p1/App.tsx',
    'public/bienvenue/index.html',
    'index.html'
];

criticalFiles.forEach(file => {
    const filePath = path.join(PROJECT_ROOT, file);
    if (fs.existsSync(filePath)) {
        success.push(`✅ ${file} trouvé`);
        console.log(`   ✅ ${file}`);
    } else {
        errors.push(`❌ ${file} manquant`);
        console.error(`   ❌ ${file} manquant`);
    }
});

// Test 2: Vérifier package.json
console.log('\n📋 Test 2: Vérification package.json');
try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf-8'));
    
    if (packageJson.name) {
        success.push('✅ package.json valide');
        console.log(`   ✅ Nom du projet: ${packageJson.name}`);
    }
    
    if (packageJson.scripts) {
        success.push('✅ Scripts npm présents');
        console.log('   ✅ Scripts npm présents');
    }
    
    if (packageJson.dependencies || packageJson.devDependencies) {
        const depsCount = Object.keys(packageJson.dependencies || {}).length;
        const devDepsCount = Object.keys(packageJson.devDependencies || {}).length;
        success.push(`✅ ${depsCount} dépendances, ${devDepsCount} devDependencies`);
        console.log(`   ✅ ${depsCount} dépendances, ${devDepsCount} devDependencies`);
    }
} catch (error) {
    errors.push('❌ Erreur lecture package.json');
    console.error('   ❌ Erreur lecture package.json');
}

// Test 3: Vérifier tsconfig.json
console.log('\n📋 Test 3: Vérification tsconfig.json');
try {
    const tsconfigPath = path.join(PROJECT_ROOT, 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
        const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
        if (tsconfig.compilerOptions) {
            success.push('✅ tsconfig.json valide');
            console.log('   ✅ tsconfig.json valide');
        }
    } else {
        warnings.push('⚠️  tsconfig.json non trouvé');
        console.warn('   ⚠️  tsconfig.json non trouvé');
    }
} catch (error) {
    warnings.push('⚠️  Erreur lecture tsconfig.json');
    console.warn('   ⚠️  Erreur lecture tsconfig.json');
}

// Test 4: Vérifier la structure des dossiers
console.log('\n📋 Test 4: Vérification structure des dossiers');
const criticalDirs = [
    'public',
    'public/3p1',
    'public/bienvenue',
    'scripts',
    'api'
];

criticalDirs.forEach(dir => {
    const dirPath = path.join(PROJECT_ROOT, dir);
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
        success.push(`✅ Dossier ${dir} existe`);
        console.log(`   ✅ ${dir}/`);
    } else {
        warnings.push(`⚠️  Dossier ${dir} manquant`);
        console.warn(`   ⚠️  ${dir}/ manquant`);
    }
});

// Test 5: Vérifier App.tsx
console.log('\n📋 Test 5: Vérification App.tsx');
const appTsxPath = path.join(PROJECT_ROOT, 'public/3p1/App.tsx');
if (fs.existsSync(appTsxPath)) {
    const content = fs.readFileSync(appTsxPath, 'utf-8');
    
    // Vérifier les imports React
    if (content.includes('import React')) {
        success.push('✅ App.tsx importe React');
        console.log('   ✅ Import React présent');
    }
    
    // Vérifier les exports
    if (content.includes('export') || content.includes('export default')) {
        success.push('✅ App.tsx a des exports');
        console.log('   ✅ Exports présents');
    }
    
    // Vérifier la taille du fichier (pas trop petit)
    if (content.length > 1000) {
        success.push(`✅ App.tsx a du contenu (${Math.round(content.length / 1000)}k)`);
        console.log(`   ✅ Taille: ${Math.round(content.length / 1000)}k`);
    }
} else {
    errors.push('❌ App.tsx non trouvé');
    console.error('   ❌ App.tsx non trouvé');
}

// Test 6: Vérifier bienvenue/index.html
console.log('\n📋 Test 6: Vérification bienvenue/index.html');
const bienvenuePath = path.join(PROJECT_ROOT, 'public/bienvenue/index.html');
if (fs.existsSync(bienvenuePath)) {
    const content = fs.readFileSync(bienvenuePath, 'utf-8');
    
    // Vérifier que les modifications 2026 sont présentes
    if (content.includes('2026-01-01')) {
        success.push('✅ bienvenue/index.html configuré pour 2026');
        console.log('   ✅ Dates 2026 configurées');
    }
    
    // Vérifier que le champ Délicat a été supprimé
    if (!content.includes('Délicat (J+)')) {
        success.push('✅ Champ Délicat supprimé');
        console.log('   ✅ Champ Délicat supprimé');
    } else {
        warnings.push('⚠️  Champ Délicat encore présent');
        console.warn('   ⚠️  Champ Délicat encore présent');
    }
} else {
    warnings.push('⚠️  bienvenue/index.html non trouvé');
    console.warn('   ⚠️  bienvenue/index.html non trouvé');
}

// Test 7: Vérifier les scripts de test
console.log('\n📋 Test 7: Vérification scripts de test');
const testScripts = [
    'scripts/test-bienvenue-2026.js',
    'scripts/test-app-tsx-complete.js',
    'scripts/test-project-integrity.js'
];

testScripts.forEach(script => {
    const scriptPath = path.join(PROJECT_ROOT, script);
    if (fs.existsSync(scriptPath)) {
        success.push(`✅ ${script} existe`);
        console.log(`   ✅ ${script}`);
    } else {
        warnings.push(`⚠️  ${script} manquant`);
        console.warn(`   ⚠️  ${script} manquant`);
    }
});

// Test 8: Vérifier les fichiers de configuration
console.log('\n📋 Test 8: Vérification fichiers de configuration');
const configFiles = [
    '.gitignore',
    'README.md'
];

configFiles.forEach(file => {
    const filePath = path.join(PROJECT_ROOT, file);
    if (fs.existsSync(filePath)) {
        success.push(`✅ ${file} présent`);
        console.log(`   ✅ ${file}`);
    } else {
        warnings.push(`⚠️  ${file} manquant`);
        console.warn(`   ⚠️  ${file} manquant`);
    }
});

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

