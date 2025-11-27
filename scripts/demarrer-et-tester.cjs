#!/usr/bin/env node
/**
 * Script pour démarrer le serveur et effectuer les tests
 */

const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🚀 Démarrage et Tests du Dashboard Modulaire');
console.log('==============================================\n');

// 1. Vérifier les tests automatisés
console.log('📋 Étape 1: Tests automatisés...\n');
const testScript = spawn('node', ['scripts/test-dashboard-modular.cjs'], {
    cwd: __dirname + '/..',
    stdio: 'inherit'
});

testScript.on('close', (code) => {
    if (code !== 0) {
        console.error('\n❌ Les tests automatisés ont échoué.');
        process.exit(1);
    }
    
    console.log('\n✅ Tests automatisés réussis!\n');
    
    // 2. Vérifier les fichiers critiques
    console.log('📁 Étape 2: Vérification des fichiers...\n');
    
    const criticalFiles = [
        'public/beta-combined-dashboard.html',
        'public/js/dashboard/dashboard-main.js',
        'public/login.html',
        'public/js/auth-guard.js'
    ];
    
    let allFilesExist = true;
    criticalFiles.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            console.log(`  ✅ ${file} (${(stats.size / 1024).toFixed(1)}KB)`);
        } else {
            console.error(`  ❌ ${file} manquant`);
            allFilesExist = false;
        }
    });
    
    if (!allFilesExist) {
        console.error('\n❌ Des fichiers critiques sont manquants.');
        process.exit(1);
    }
    
    console.log('\n✅ Tous les fichiers critiques sont présents!\n');
    
    // 3. Instructions pour démarrer le serveur
    console.log('🌐 Étape 3: Instructions pour démarrer le serveur\n');
    console.log('Pour démarrer le serveur, exécutez dans un terminal séparé:');
    console.log('');
    console.log('  Option 1 (Vite):');
    console.log('    npm run dev');
    console.log('');
    console.log('  Option 2 (Node.js):');
    console.log('    node server.js');
    console.log('');
    console.log('Ensuite, ouvrez dans votre navigateur:');
    console.log('  http://localhost:3000/login.html');
    console.log('');
    console.log('Vérifications à faire dans le navigateur:');
    console.log('  1. Ouvrir la console (F12)');
    console.log('  2. Vérifier: "✅ Dashboard rendered successfully!"');
    console.log('  3. Tester la navigation entre les onglets');
    console.log('  4. Vérifier qu\'il n\'y a pas d\'erreurs JavaScript');
    console.log('');
    console.log('✅ Tous les tests automatisés sont passés!');
    console.log('✅ Le dashboard modulaire est prêt à être testé manuellement.\n');
});

