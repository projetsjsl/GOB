#!/usr/bin/env node
/**
 * Script de comparaison des composants
 * Compare chaque module avec la version actuelle
 */

const fs = require('fs');
const path = require('path');

const TABS_DIR = path.join(__dirname, '../public/js/dashboard/components/tabs');
const DASHBOARD_FILE = path.join(__dirname, '../public/beta-combined-dashboard.html');

console.log('🔍 Comparaison des composants\n');
console.log('='.repeat(60));

const dashboardContent = fs.readFileSync(DASHBOARD_FILE, 'utf8');

// Modules existants
const modules = fs.readdirSync(TABS_DIR)
    .filter(f => f.endsWith('.js'))
    .map(f => ({
        name: f.replace('.js', ''),
        path: path.join(TABS_DIR, f)
    }));

const comparison = [];

modules.forEach(({ name, path: modulePath }) => {
    const moduleContent = fs.readFileSync(modulePath, 'utf8');
    const moduleLines = moduleContent.split('\n').length;
    const moduleSize = (fs.statSync(modulePath).size / 1024).toFixed(1);
    
    // Chercher le composant dans la version actuelle
    // Utiliser le même pattern regex pour détecter le composant (support React.memo et espaces)
    const componentPattern = new RegExp(`const\\s+${name}\\s*=\\s*(?:React\\.memo\\()?`);
    const startMatch = dashboardContent.match(componentPattern);
    const hasInCurrent = startMatch !== null;
    
    // Extraire le composant de la version actuelle
    let currentLines = 0;
    let currentSize = 0;
    let startPos = -1;
    let endPos = dashboardContent.length;
    
    if (hasInCurrent && startMatch) {
        startPos = startMatch.index;
        // Chercher la fin (prochain composant ou fin de fonction)
        const nextComponent = dashboardContent.substring(startPos).match(/const\s+\w+Tab\s*=\s*(?:React\.memo\()?/);
        endPos = nextComponent ? startPos + nextComponent.index : dashboardContent.length;
        const componentCode = dashboardContent.substring(startPos, endPos);
        currentLines = componentCode.split('\n').length;
        currentSize = (componentCode.length / 1024).toFixed(1);
    }
    
    // Comparer les props
    const moduleProps = (moduleContent.match(/const\s+\w+\s*=\s*\(\s*\{[^}]*\}/) || [])[0] || '';
    const currentPropsPattern = new RegExp(`const\\s+${name}\\s*=\\s*(?:React\\.memo\\()?\\s*\\(\\s*\\{[^}]*\\}`);
    const currentProps = hasInCurrent ? 
        (dashboardContent.match(currentPropsPattern) || [])[0] || '' : '';
    
    // Compter useState dans chaque version
    const moduleUseState = (moduleContent.match(/useState\(/g) || []).length;
    let currentUseState = 0;
    if (hasInCurrent && startMatch && startPos >= 0) {
        // Utiliser la même détection que pour les lignes (déjà calculé componentCode)
        // Réutiliser componentCode calculé plus haut si disponible, sinon recalculer
        const componentCode = dashboardContent.substring(startPos, endPos);
        currentUseState = (componentCode.match(/useState\(/g) || []).length;
    }
    
    // Compter useEffect
    const moduleUseEffect = (moduleContent.match(/useEffect\(/g) || []).length;
    let currentUseEffect = 0;
    if (hasInCurrent && startMatch && startPos >= 0) {
        // Utiliser la même détection que pour les lignes (déjà calculé componentCode)
        const componentCode = dashboardContent.substring(startPos, endPos);
        currentUseEffect = (componentCode.match(/useEffect\(/g) || []).length;
    }
    
    comparison.push({
        name,
        module: {
            lines: moduleLines,
            sizeKB: moduleSize,
            useState: moduleUseState,
            useEffect: moduleUseEffect
        },
        current: {
            exists: hasInCurrent,
            lines: currentLines,
            sizeKB: currentSize,
            useState: currentUseState,
            useEffect: currentUseEffect
        },
        differences: {
            linesDiff: currentLines > 0 ? moduleLines - currentLines : null,
            sizeDiff: currentSize > 0 ? (parseFloat(moduleSize) - parseFloat(currentSize)).toFixed(1) : null,
            useStateDiff: currentUseState > 0 ? moduleUseState - currentUseState : null,
            useEffectDiff: currentUseEffect > 0 ? moduleUseEffect - currentUseEffect : null
        }
    });
    
    console.log(`\n📦 ${name}`);
    console.log(`  Module: ${moduleLines} lignes, ${moduleSize} KB`);
    if (hasInCurrent) {
        console.log(`  Actuel: ${currentLines} lignes, ${currentSize} KB`);
        if (currentLines > 0) {
            const diff = moduleLines - currentLines;
            console.log(`  Différence: ${diff > 0 ? '+' : ''}${diff} lignes`);
        }
        console.log(`  useState: Module ${moduleUseState}, Actuel ${currentUseState}`);
        console.log(`  useEffect: Module ${moduleUseEffect}, Actuel ${currentUseEffect}`);
    } else {
        console.log(`  ⚠️  Non trouvé dans version actuelle`);
    }
});

// Modules manquants
console.log('\n' + '='.repeat(60));
console.log('\n🚫 Modules manquants (à extraire)\n');

const missingModules = ['FinanceProTab', 'JLabUnifiedTab'];

missingModules.forEach(name => {
    const hasInCurrent = dashboardContent.includes(`const ${name} =`) || 
                        dashboardContent.includes(`function ${name}`);
    
    if (hasInCurrent) {
        console.log(`  ✅ ${name} - Présent dans version actuelle (à extraire)`);
        
        // Estimer complexité
        const startMatch = dashboardContent.match(new RegExp(`const\\s+${name}\\s*=\\s*`));
        if (startMatch) {
            const startPos = startMatch.index;
            const nextComponent = dashboardContent.substring(startPos).match(/const\s+\w+Tab\s*=\s*/);
            const endPos = nextComponent ? startPos + nextComponent.index : dashboardContent.length;
            const componentCode = dashboardContent.substring(startPos, endPos);
            const lines = componentCode.split('\n').length;
            const size = (componentCode.length / 1024).toFixed(1);
            const useState = (componentCode.match(/useState\(/g) || []).length;
            const useEffect = (componentCode.match(/useEffect\(/g) || []).length;
            
            console.log(`     Lignes: ~${lines}`);
            console.log(`     Taille: ~${size} KB`);
            console.log(`     useState: ${useState}`);
            console.log(`     useEffect: ${useEffect}`);
            
            let complexity = 'Simple';
            if (lines > 500 || useState > 10 || useEffect > 5) {
                complexity = 'Complexe';
            } else if (lines > 200 || useState > 5) {
                complexity = 'Moyen';
            }
            console.log(`     Complexité: ${complexity}`);
        }
    } else {
        console.log(`  ❌ ${name} - Non trouvé dans version actuelle`);
    }
});

// Sauvegarder comparaison
const outputFile = path.join(__dirname, '../docs/COMPARAISON_COMPOSANTS.json');
fs.writeFileSync(outputFile, JSON.stringify(comparison, null, 2));

console.log('\n' + '='.repeat(60));
console.log('\n✅ Comparaison terminée');
console.log(`📄 Résultats sauvegardés dans: ${outputFile}\n`);

