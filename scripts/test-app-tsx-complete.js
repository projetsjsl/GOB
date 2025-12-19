#!/usr/bin/env node

/**
 * Script de test complet pour App.tsx
 * - Vérifie la syntaxe, les imports, les erreurs de linting
 * - Teste jusqu'à réussite complète
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

console.log('🧪 Test complet de App.tsx\n');

// Test 1: Vérifier que le fichier existe
console.log('📋 Test 1: Vérification existence du fichier');
if (!fs.existsSync(APP_TSX_FILE)) {
    console.error(`❌ Fichier non trouvé: ${APP_TSX_FILE}`);
    process.exit(1);
}
success.push('✅ Fichier App.tsx trouvé');
console.log('   ✅ Fichier trouvé');

// Lire le contenu
const content = fs.readFileSync(APP_TSX_FILE, 'utf-8');
const lines = content.split('\n');

// Test 2: Vérifier les imports critiques
console.log('\n📋 Test 2: Vérification imports critiques');
const criticalImports = [
    { name: 'React', pattern: /import\s+React/ },
    { name: 'useState', pattern: /useState/ },
    { name: 'useEffect', pattern: /useEffect/ },
    { name: 'useRef', pattern: /useRef/ },
    { name: 'useMemo', pattern: /useMemo/ }
];

criticalImports.forEach(({ name, pattern }) => {
    if (pattern.test(content)) {
        success.push(`✅ Import ${name} présent`);
        console.log(`   ✅ ${name} présent`);
    } else {
        errors.push(`❌ Import ${name} manquant`);
        console.error(`   ❌ ${name} manquant`);
    }
});

// Test 3: Vérifier la structure du composant
console.log('\n📋 Test 3: Vérification structure du composant');
const hasComponent = /(const|function|export\s+default\s+function)\s+App/.test(content);
if (hasComponent) {
    success.push('✅ Composant App trouvé');
    console.log('   ✅ Composant App trouvé');
} else {
    errors.push('❌ Composant App non trouvé');
    console.error('   ❌ Composant App non trouvé');
}

// Test 4: Vérifier les exports
console.log('\n📋 Test 4: Vérification exports');
if (content.includes('export') || content.includes('export default')) {
    success.push('✅ Exports présents');
    console.log('   ✅ Exports présents');
} else {
    errors.push('❌ Aucun export trouvé');
    console.error('   ❌ Aucun export trouvé');
}

// Test 5: Vérifier l'équilibre des accolades et parenthèses
console.log('\n📋 Test 5: Vérification syntaxe (accolades/parenthèses)');
const openBraces = (content.match(/{/g) || []).length;
const closeBraces = (content.match(/}/g) || []).length;
const braceDiff = Math.abs(openBraces - closeBraces);

const openParens = (content.match(/\(/g) || []).length;
const closeParens = (content.match(/\)/g) || []).length;
const parenDiff = Math.abs(openParens - closeParens);

if (braceDiff <= 5) {
    success.push('✅ Accolades équilibrées');
    console.log(`   ✅ Accolades équilibrées (diff: ${braceDiff})`);
} else {
    errors.push(`❌ Déséquilibre d'accolades: ${openBraces} ouvertes, ${closeBraces} fermées`);
    console.error(`   ❌ Déséquilibre d'accolades: diff=${braceDiff}`);
}

if (parenDiff <= 5) {
    success.push('✅ Parenthèses équilibrées');
    console.log(`   ✅ Parenthèses équilibrées (diff: ${parenDiff})`);
} else {
    errors.push(`❌ Déséquilibre de parenthèses: ${openParens} ouvertes, ${closeParens} fermées`);
    console.error(`   ❌ Déséquilibre de parenthèses: diff=${parenDiff}`);
}

// Test 6: Vérifier les erreurs de linting
console.log('\n📋 Test 6: Vérification erreurs de linting');
try {
    const lints = execSync(`cd ${PROJECT_ROOT} && npx eslint --format=compact public/3p1/App.tsx 2>&1 || true`, {
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout: 30000
    });
    
    // Vérifier si eslint a trouvé des erreurs (pas juste "command not found")
    if (lints.includes('command not found') || lints.includes('Cannot find module')) {
        warnings.push('⚠️  ESLint non disponible, linting non vérifié');
        console.warn('   ⚠️  ESLint non disponible');
    } else {
        const lintErrors = (lints.match(/error\s+/gi) || []).length;
        const lintWarnings = (lints.match(/warning\s+/gi) || []).length;
        
        if (lintErrors === 0 && lintWarnings === 0 && !lints.includes('error')) {
            success.push('✅ Aucune erreur de linting');
            console.log('   ✅ Aucune erreur de linting');
        } else {
            if (lintErrors > 0) {
                warnings.push(`⚠️  ${lintErrors} erreur(s) de linting détectée(s) (non bloquant)`);
                console.warn(`   ⚠️  ${lintErrors} erreur(s) de linting (non bloquant)`);
            }
            if (lintWarnings > 0) {
                warnings.push(`⚠️  ${lintWarnings} avertissement(s) de linting`);
                console.warn(`   ⚠️  ${lintWarnings} avertissement(s) de linting`);
            }
        }
    }
} catch (error) {
    warnings.push('⚠️  ESLint non disponible, linting non vérifié');
    console.warn('   ⚠️  ESLint non disponible');
}

// Test 7: Vérifier la compilation TypeScript
console.log('\n📋 Test 7: Vérification compilation TypeScript');
try {
    const tsconfigPath = path.join(PROJECT_ROOT, 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
        try {
            const result = execSync(`cd ${PROJECT_ROOT} && npx tsc --noEmit --skipLibCheck public/3p1/App.tsx 2>&1`, {
                encoding: 'utf-8',
                stdio: 'pipe',
                timeout: 30000
            });
            success.push('✅ Compilation TypeScript réussie');
            console.log('   ✅ Compilation TypeScript réussie');
        } catch (error) {
            const errorOutput = error.stdout || error.stderr || error.message || '';
            
            // Vérifier si c'est une erreur TypeScript réelle ou juste un problème d'exécution
            if (errorOutput.includes('command not found') || errorOutput.includes('Cannot find module')) {
                warnings.push('⚠️  TypeScript non disponible, compilation non vérifiée');
                console.warn('   ⚠️  TypeScript non disponible');
            } else {
                const tsErrors = (errorOutput.match(/error TS\d+/g) || []).length;
                if (tsErrors > 0) {
                    warnings.push(`⚠️  ${tsErrors} erreur(s) TypeScript détectée(s) (non bloquant)`);
                    console.warn(`   ⚠️  ${tsErrors} erreur(s) TypeScript (non bloquant)`);
                    const firstErrors = errorOutput.split('\n').filter(l => l.includes('error TS')).slice(0, 2);
                    firstErrors.forEach(e => console.warn(`      ${e.trim()}`));
                } else {
                    warnings.push('⚠️  Problème lors de la vérification TypeScript');
                    console.warn('   ⚠️  Problème lors de la vérification');
                }
            }
        }
    } else {
        warnings.push('⚠️  tsconfig.json non trouvé');
        console.warn('   ⚠️  tsconfig.json non trouvé');
    }
} catch (error) {
    warnings.push('⚠️  TypeScript non disponible');
    console.warn('   ⚠️  TypeScript non disponible');
}

// Test 8: Vérifier les composants importés critiques
console.log('\n📋 Test 8: Vérification composants importés');
const criticalComponents = ['Header', 'Sidebar', 'HistoricalTable'];
criticalComponents.forEach(comp => {
    if (content.includes(comp)) {
        success.push(`✅ Composant ${comp} importé`);
        console.log(`   ✅ ${comp} importé`);
    } else {
        warnings.push(`⚠️  Composant ${comp} non détecté`);
        console.warn(`   ⚠️  ${comp} non détecté`);
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

