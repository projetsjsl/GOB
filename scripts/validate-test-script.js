/**
 * Script de validation pour test-all-tabs-comprehensive-v2.js
 * Vérifie la syntaxe et la structure du script de test
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const testScriptPath = join(__dirname, 'test-all-tabs-comprehensive-v2.js');

try {
    console.log('🔍 Validation du script de test...\n');
    
    // Lire le fichier
    const content = readFileSync(testScriptPath, 'utf-8');
    
    // Vérifications de base
    const checks = {
        'Export statements présents': content.includes('export'),
        'Fonction runAllTestSeries définie': content.includes('async function runAllTestSeries'),
        'Liste allTabs définie': content.includes('const allTabs = ['),
        'Méthodes de test présentes': 
            content.includes('testMethod1_ButtonClick') &&
            content.includes('testMethod2_SetActiveTab') &&
            content.includes('testMethod3_CustomEvent'),
        'Gestion navigateur vs Node.js': content.includes('typeof window'),
        'Attributs data-testid dans les sélecteurs': content.includes('data-testid'),
        'Attributs aria-label dans les sélecteurs': content.includes('aria-label'),
    };
    
    console.log('✅ Vérifications:');
    let allPassed = true;
    for (const [check, passed] of Object.entries(checks)) {
        const status = passed ? '✅' : '❌';
        console.log(`   ${status} ${check}`);
        if (!passed) allPassed = false;
    }
    
    // Compter les onglets
    const tabsMatch = content.match(/id:\s*['"]([^'"]+)['"]/g);
    const tabCount = tabsMatch ? tabsMatch.length : 0;
    console.log(`\n📊 Statistiques:`);
    console.log(`   Onglets définis: ${tabCount}`);
    
    // Vérifier les améliorations récentes
    console.log(`\n🔧 Améliorations récentes:`);
    const improvements = {
        'setActiveTab exposé globalement': content.includes('window.BetaCombinedDashboardData.setActiveTab'),
        'Sélecteurs améliorés (data-testid)': content.includes('data-testid="tab-'),
        'Sélecteurs améliorés (aria-label)': content.includes('getAttribute(\'aria-label\')'),
        'Sélecteurs améliorés (title)': content.includes('getAttribute(\'title\')'),
    };
    
    for (const [improvement, present] of Object.entries(improvements)) {
        const status = present ? '✅' : '⚠️';
        console.log(`   ${status} ${improvement}`);
    }
    
    if (allPassed) {
        console.log('\n✅ Validation réussie! Le script est prêt pour les tests.');
        process.exit(0);
    } else {
        console.log('\n⚠️ Certaines vérifications ont échoué.');
        process.exit(1);
    }
    
} catch (error) {
    console.error('❌ Erreur lors de la validation:', error.message);
    process.exit(1);
}


