#!/usr/bin/env node
/**
 * Script de validation des bonnes pratiques
 * Vérifie BP1-BP5 selon le plan
 */

const fs = require('fs');
const path = require('path');

const TABS_DIR = path.join(__dirname, '../public/js/dashboard/components/tabs');

// Lister tous les modules Tab
const modules = fs.readdirSync(TABS_DIR)
    .filter(f => f.endsWith('.js'))
    .map(f => ({
        name: f.replace('.js', ''),
        path: path.join(TABS_DIR, f)
    }));

console.log('🔍 Validation des bonnes pratiques\n');
console.log('='.repeat(60));

// BP1: Interface des props
console.log('\n📋 BP1: Interface des props\n');

const propsIssues = [];

modules.forEach(({ name, path: filePath }) => {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Vérifier présence de isDarkMode dans les props
    const hasIsDarkMode = content.includes('isDarkMode') || 
                         content.includes('const [isDarkMode') ||
                         content.includes('useState') && content.includes('dark');
    
    // Vérifier signature du composant
    const componentDef = content.match(/const\s+(\w+)\s*=\s*\([^)]*\)\s*=>/);
    const hasProps = componentDef && componentDef[0].includes('{');
    
    if (hasIsDarkMode) {
        console.log(`  ✅ ${name} - isDarkMode présent`);
    } else {
        propsIssues.push({ name, issue: 'isDarkMode manquant' });
        console.log(`  ⚠️  ${name} - isDarkMode non détecté`);
    }
});

// BP2: Gestion des dépendances
console.log('\n🔗 BP2: Gestion des dépendances\n');

const dependencyIssues = [];

modules.forEach(({ name, path: filePath }) => {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Vérifier dépendances vers autres modules tabs (à éviter)
    const otherTabs = modules.filter(m => m.name !== name).map(m => m.name);
    const hasTabDependency = otherTabs.some(tab => 
        content.includes(`window.${tab}`) || 
        content.includes(`<${tab}`) ||
        content.includes(`${tab}(`)
    );
    
    // Vérifier dépendances vers dashboard-main (à éviter)
    const hasMainDependency = content.includes('dashboard-main') || 
                             content.includes('BetaCombinedDashboard');
    
    if (hasTabDependency) {
        dependencyIssues.push({ name, issue: 'dépendance vers autre module Tab' });
        console.log(`  ⚠️  ${name} - Dépendance vers autre module Tab détectée`);
    } else if (hasMainDependency) {
        dependencyIssues.push({ name, issue: 'dépendance vers dashboard-main' });
        console.log(`  ⚠️  ${name} - Dépendance vers dashboard-main détectée`);
    } else {
        console.log(`  ✅ ${name} - Pas de dépendances circulaires`);
    }
});

// BP3: Isolation des états
console.log('\n🔒 BP3: Isolation des états\n');

const stateIssues = [];

modules.forEach(({ name, path: filePath }) => {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Compter les useState locaux
    const useStateMatches = content.match(/useState\(/g);
    const useStateCount = useStateMatches ? useStateMatches.length : 0;
    
    // Vérifier mutations directes de props (pattern props.xxx = ...)
    const hasDirectPropMutation = /props\.\w+\s*=/.test(content) ||
                                 /\{[^}]*\}\.\w+\s*=/.test(content);
    
    if (hasDirectPropMutation) {
        stateIssues.push({ name, issue: 'mutation directe de props détectée' });
        console.log(`  ⚠️  ${name} - Mutation directe de props`);
    } else {
        console.log(`  ✅ ${name} - ${useStateCount} useState local(aux), pas de mutation props`);
    }
});

// BP4: Gestion des effets
console.log('\n🔄 BP4: Gestion des effets (useEffect cleanup)\n');

const effectIssues = [];

modules.forEach(({ name, path: filePath }) => {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Compter les useEffect
    const useEffectMatches = content.match(/useEffect\(/g);
    const useEffectCount = useEffectMatches ? useEffectMatches.length : 0;
    
    // Vérifier présence de cleanup (return dans useEffect)
    const hasCleanup = /useEffect\([^)]*\)\s*=>\s*\{[^}]*return\s*\(/.test(content) ||
                      /useEffect\([^)]*\)\s*=>\s*\{[^}]*return\s*\(/.test(content.replace(/\n/g, ' '));
    
    // Vérifier cleanup explicite (return () => {})
    const hasExplicitCleanup = /return\s*\(\)\s*=>\s*\{/.test(content);
    
    if (useEffectCount > 0) {
        if (hasExplicitCleanup) {
            console.log(`  ✅ ${name} - ${useEffectCount} useEffect avec cleanup explicite`);
        } else if (hasCleanup) {
            console.log(`  ⚠️  ${name} - ${useEffectCount} useEffect, cleanup non explicite`);
            effectIssues.push({ name, issue: 'cleanup non explicite' });
        } else {
            console.log(`  ⚠️  ${name} - ${useEffectCount} useEffect sans cleanup détecté`);
            effectIssues.push({ name, issue: 'useEffect sans cleanup' });
        }
    } else {
        console.log(`  ✅ ${name} - Pas de useEffect`);
    }
});

// BP5: Performance (useMemo, useCallback)
console.log('\n⚡ BP5: Optimisations performance\n');

const perfIssues = [];

modules.forEach(({ name, path: filePath }) => {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Vérifier présence de useMemo
    const hasUseMemo = content.includes('useMemo');
    const hasUseCallback = content.includes('useCallback');
    
    // Compter les calculs potentiellement coûteux (map, filter, reduce)
    const expensiveOps = (content.match(/\.map\(/g) || []).length +
                        (content.match(/\.filter\(/g) || []).length +
                        (content.match(/\.reduce\(/g) || []).length;
    
    if (expensiveOps > 3 && !hasUseMemo) {
        perfIssues.push({ name, issue: `${expensiveOps} opérations coûteuses sans useMemo` });
        console.log(`  ⚠️  ${name} - ${expensiveOps} opérations coûteuses, pas de useMemo`);
    } else if (hasUseMemo || hasUseCallback) {
        console.log(`  ✅ ${name} - Optimisations présentes (useMemo/useCallback)`);
    } else {
        console.log(`  ℹ️  ${name} - Pas d'optimisations détectées (peut être OK)`);
    }
});

// Résumé
console.log('\n' + '='.repeat(60));
console.log('\n📊 Résumé des bonnes pratiques\n');

const totalIssues = propsIssues.length + dependencyIssues.length + 
                    stateIssues.length + effectIssues.length + perfIssues.length;

console.log(`  Problèmes BP1 (Props): ${propsIssues.length}`);
console.log(`  Problèmes BP2 (Dépendances): ${dependencyIssues.length}`);
console.log(`  Problèmes BP3 (États): ${stateIssues.length}`);
console.log(`  Problèmes BP4 (Effets): ${effectIssues.length}`);
console.log(`  Problèmes BP5 (Performance): ${perfIssues.length}`);
console.log(`  Total problèmes: ${totalIssues}`);

if (totalIssues > 0) {
    console.log('\n⚠️  Problèmes détectés:');
    [...propsIssues, ...dependencyIssues, ...stateIssues, ...effectIssues, ...perfIssues]
        .forEach(({ name, issue }) => {
            console.log(`    - ${name}: ${issue}`);
        });
}

console.log('\n' + '='.repeat(60));
if (totalIssues === 0) {
    console.log('\n✅ Toutes les bonnes pratiques sont respectées\n');
    process.exit(0);
} else {
    console.log('\n⚠️  Certaines bonnes pratiques nécessitent des améliorations\n');
    process.exit(1);
}

