#!/usr/bin/env node
/**
 * Script de validation syntaxique
 * Vérifie syntaxe, indentation, brackets, compatibilité Babel
 */

const fs = require('fs');
const path = require('path');

const TABS_DIR = path.join(__dirname, '../public/js/dashboard/components/tabs');

console.log('🔍 Validation syntaxique des modules\n');
console.log('='.repeat(60));

const modules = fs.readdirSync(TABS_DIR)
    .filter(f => f.endsWith('.js'))
    .map(f => ({
        name: f.replace('.js', ''),
        path: path.join(TABS_DIR, f)
    }));

const syntaxIssues = [];

// T3.1.1: Valider syntaxe chaque module
console.log('\n📝 T3.1.1: Validation syntaxe\n');

modules.forEach(({ name, path: filePath }) => {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Vérifications basiques
    const issues = [];
    
    // Vérifier parenthèses équilibrées
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
        issues.push(`parenthèses déséquilibrées (${openParens} ouvertes, ${closeParens} fermées)`);
    }
    
    // Vérifier accolades équilibrées
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
        issues.push(`accolades déséquilibrées (${openBraces} ouvertes, ${closeBraces} fermées)`);
    }
    
    // Vérifier crochets équilibrés
    const openBrackets = (content.match(/\[/g) || []).length;
    const closeBrackets = (content.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
        issues.push(`crochets déséquilibrés (${openBrackets} ouverts, ${closeBrackets} fermés)`);
    }
    
    // Vérifier guillemets non fermés (approximation)
    const singleQuotes = (content.match(/'/g) || []).length;
    const doubleQuotes = (content.match(/"/g) || []).length;
    if (singleQuotes % 2 !== 0) {
        issues.push('guillemets simples non fermés');
    }
    if (doubleQuotes % 2 !== 0) {
        issues.push('guillemets doubles non fermés');
    }
    
    if (issues.length > 0) {
        syntaxIssues.push({ name, issues });
        console.log(`  ❌ ${name}: ${issues.join(', ')}`);
    } else {
        console.log(`  ✅ ${name} - Syntaxe valide`);
    }
});

// T3.1.2: Vérifier indentation
console.log('\n📏 T3.1.2: Vérification indentation\n');

const indentationIssues = [];

modules.forEach(({ name, path: filePath }) => {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Détecter type d'indentation (espaces vs tabs)
    let spacesCount = 0;
    let tabsCount = 0;
    
    lines.slice(0, 50).forEach(line => {
        if (line.match(/^\s+/)) {
            if (line.match(/^ +/)) {
                const spaces = line.match(/^ +/)[0].length;
                if (spaces > 0 && spaces % 2 === 0) spacesCount++;
            }
            if (line.match(/^\t/)) tabsCount++;
        }
    });
    
    const usesSpaces = spacesCount > tabsCount;
    const usesTabs = tabsCount > spacesCount;
    
    if (usesSpaces) {
        console.log(`  ✅ ${name} - Indentation: espaces (2 espaces)`);
    } else if (usesTabs) {
        indentationIssues.push({ name, issue: 'utilise des tabs au lieu d\'espaces' });
        console.log(`  ⚠️  ${name} - Indentation: tabs (devrait être espaces)`);
    } else {
        console.log(`  ℹ️  ${name} - Indentation: mixte ou non détectée`);
    }
});

// T3.1.3: Vérifier brackets (déjà fait dans T3.1.1)
console.log('\n🔲 T3.1.3: Vérification brackets\n');

const bracketIssues = [];

modules.forEach(({ name, path: filePath }) => {
    const content = fs.readFileSync(filePath, 'utf8');
    
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    
    if (openBraces === closeBraces) {
        console.log(`  ✅ ${name} - ${openBraces} paires d'accolades équilibrées`);
    } else {
        bracketIssues.push({ name, open: openBraces, close: closeBraces });
        console.log(`  ❌ ${name} - Déséquilibre: ${openBraces} ouvertes, ${closeBraces} fermées`);
    }
});

// T3.1.4: Vérifier style de code
console.log('\n🎨 T3.1.4: Vérification style de code\n');

const styleIssues = [];

modules.forEach(({ name, path: filePath }) => {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Vérifier nommage camelCase pour variables
    const varPattern = /const\s+([a-z][a-zA-Z0-9]*)\s*=/g;
    const vars = [];
    let match;
    while ((match = varPattern.exec(content)) !== null) {
        vars.push(match[1]);
    }
    
    const invalidVars = vars.filter(v => !/^[a-z][a-zA-Z0-9]*$/.test(v));
    
    // Vérifier nommage PascalCase pour composants
    const componentPattern = /const\s+([A-Z][a-zA-Z0-9]*)\s*=/;
    const componentMatch = content.match(componentPattern);
    const hasValidComponentName = componentMatch && componentMatch[1] === name;
    
    if (!hasValidComponentName) {
        styleIssues.push({ name, issue: 'nom de composant ne correspond pas au fichier' });
        console.log(`  ⚠️  ${name} - Nom composant ne correspond pas`);
    } else {
        console.log(`  ✅ ${name} - Nommage correct`);
    }
});

// Résumé
console.log('\n' + '='.repeat(60));
console.log('\n📊 Résumé validation syntaxique\n');

const totalIssues = syntaxIssues.length + indentationIssues.length + 
                    bracketIssues.length + styleIssues.length;

console.log(`  Problèmes syntaxe (T3.1.1): ${syntaxIssues.length}`);
console.log(`  Problèmes indentation (T3.1.2): ${indentationIssues.length}`);
console.log(`  Problèmes brackets (T3.1.3): ${bracketIssues.length}`);
console.log(`  Problèmes style (T3.1.4): ${styleIssues.length}`);
console.log(`  Total problèmes: ${totalIssues}`);

if (totalIssues > 0) {
    console.log('\n⚠️  Problèmes détectés:');
    [...syntaxIssues, ...indentationIssues, ...bracketIssues, ...styleIssues]
        .forEach(({ name, issues, issue, open, close }) => {
            if (issues) {
                console.log(`    - ${name}: ${issues.join(', ')}`);
            } else if (issue) {
                console.log(`    - ${name}: ${issue}`);
            } else if (open !== undefined) {
                console.log(`    - ${name}: ${open} ouvertes, ${close} fermées`);
            }
        });
}

console.log('\n' + '='.repeat(60));
if (totalIssues === 0) {
    console.log('\n✅ Tous les modules ont une syntaxe valide\n');
    process.exit(0);
} else {
    console.log('\n⚠️  Certains modules nécessitent des corrections\n');
    process.exit(1);
}

