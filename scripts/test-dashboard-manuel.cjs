#!/usr/bin/env node

/**
 * Script de test manuel guidé du dashboard modulaire
 * Guide l'utilisateur à travers tous les tests nécessaires
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const SERVER_URL = 'http://localhost:10000';
const DASHBOARD_URL = `${SERVER_URL}/beta-combined-dashboard.html`;

console.log('🧪 GUIDE DE TEST MANUEL DU DASHBOARD MODULAIRE');
console.log('==============================================\n');

// Test 1: Vérifier que le serveur est accessible
console.log('📡 Test 1: Vérification du serveur...');
const checkServer = () => {
    return new Promise((resolve, reject) => {
        const req = http.get(SERVER_URL, (res) => {
            if (res.statusCode === 200 || res.statusCode === 302 || res.statusCode === 301) {
                console.log(`  ✅ Serveur accessible sur ${SERVER_URL}`);
                resolve(true);
            } else {
                console.log(`  ⚠️  Serveur répond avec le code ${res.statusCode}`);
                resolve(false);
            }
        });
        
        req.on('error', (err) => {
            console.log(`  ❌ Serveur non accessible: ${err.message}`);
            console.log(`     Assurez-vous que le serveur est démarré avec: node server.js`);
            reject(err);
        });
        
        req.setTimeout(3000, () => {
            req.destroy();
            console.log(`  ❌ Timeout: Le serveur ne répond pas`);
            reject(new Error('Timeout'));
        });
    });
};

// Test 2: Vérifier que le dashboard est accessible
const checkDashboard = () => {
    return new Promise((resolve, reject) => {
        const req = http.get(DASHBOARD_URL, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    if (data.includes('MODULAR DASHBOARD VERSION LOADED')) {
                        console.log(`  ✅ Dashboard accessible et version modulaire détectée`);
                        resolve(true);
                    } else {
                        console.log(`  ⚠️  Dashboard accessible mais version modulaire non détectée`);
                        console.log(`     Le cache du navigateur peut être la cause`);
                        resolve(false);
                    }
                } else {
                    console.log(`  ❌ Dashboard non accessible (code ${res.statusCode})`);
                    resolve(false);
                }
            });
        });
        
        req.on('error', (err) => {
            console.log(`  ❌ Erreur lors de l'accès au dashboard: ${err.message}`);
            reject(err);
        });
        
        req.setTimeout(5000, () => {
            req.destroy();
            console.log(`  ❌ Timeout lors de l'accès au dashboard`);
            reject(new Error('Timeout'));
        });
    });
};

// Exécuter les tests
(async () => {
    try {
        await checkServer();
        console.log('');
        await checkDashboard();
        
        console.log('\n==============================================');
        console.log('📋 CHECKLIST DE TEST MANUEL');
        console.log('==============================================\n');
        
        console.log('1. 🔐 AUTHENTIFICATION');
        console.log('   □ Ouvrir http://localhost:10000/login.html');
        console.log('   □ Se connecter avec: gob / gob');
        console.log('   □ Vérifier la redirection vers le dashboard');
        console.log('   □ Vérifier que l\'URL est: /beta-combined-dashboard.html\n');
        
        console.log('2. 🎨 INTERFACE VISUELLE');
        console.log('   □ Vérifier que le header "TERMINAL FINANCIER Emma IABÊTA" est visible');
        console.log('   □ Vérifier que le TradingView Ticker Tape est chargé');
        console.log('   □ Vérifier que la sidebar de navigation est visible');
        console.log('   □ Vérifier que le contenu principal s\'affiche');
        console.log('   □ Vérifier que l\'avatar Emma est visible\n');
        
        console.log('3. 📑 NAVIGATION ENTRE ONGLETS');
        const tabs = [
            'Marchés & Économie',
            'JLab™',
            'Emma IA™',
            'Plus',
            'Admin JSLAI',
            'Seeking Alpha',
            'Stocks News',
            'Emma En Direct',
            'TESTS JS'
        ];
        
        tabs.forEach((tab, index) => {
            console.log(`   ${index + 1}. □ Cliquer sur "${tab}"`);
            console.log(`      □ Vérifier que l'onglet s'affiche correctement`);
            console.log(`      □ Vérifier qu'il n'y a pas d'erreurs dans la console`);
            console.log(`      □ Vérifier que le contenu est visible\n`);
        });
        
        console.log('4. 🔍 CONSOLE DU NAVIGATEUR');
        console.log('   □ Ouvrir la console (F12)');
        console.log('   □ Vérifier qu\'il n\'y a pas d\'erreurs rouges');
        console.log('   □ Vérifier les messages de debug:');
        console.log('      - "🔧 [DEBUG] MODULAR DASHBOARD VERSION LOADED"');
        console.log('      - "✅ [DEBUG] All scripts loaded"');
        console.log('      - "✅ Rendering BetaCombinedDashboard..."');
        console.log('      - "✅ Dashboard rendered successfully!"\n');
        
        console.log('5. ⚙️  FONCTIONNALITÉS PRINCIPALES');
        console.log('   □ Vérifier le chargement des tickers (devrait afficher 25 tickers)');
        console.log('   □ Vérifier le chargement des données de stocks');
        console.log('   □ Vérifier le chargement des actualités');
        console.log('   □ Tester le bouton "Actualiser" dans Stocks News');
        console.log('   □ Tester le changement de vue (Liste/Cartes/Tableau)');
        console.log('   □ Tester le mode dark/light (bouton ☀️)\n');
        
        console.log('6. 🎯 ONGLETS SPÉCIFIQUES');
        console.log('   □ JLab™ → Vérifier les sous-onglets (Portefeuille/Watchlist/3pour1)');
        console.log('   □ Emma IA™ → Vérifier que le chat fonctionne');
        console.log('   □ Markets & Economy → Vérifier les widgets TradingView');
        console.log('   □ Economic Calendar → Vérifier le calendrier');
        console.log('   □ Yield Curve → Vérifier le graphique');
        console.log('   □ Plus → Vérifier les paramètres et déconnexion\n');
        
        console.log('7. 🐛 VÉRIFICATION DES ERREURS');
        console.log('   □ Vérifier qu\'il n\'y a pas d\'erreurs "ReferenceError"');
        console.log('   □ Vérifier qu\'il n\'y a pas d\'erreurs "TypeError"');
        console.log('   □ Vérifier qu\'il n\'y a pas d\'erreurs "Cannot read property"');
        console.log('   □ Vérifier que les erreurs API (500, 503) sont normales (services non configurés)\n');
        
        console.log('==============================================');
        console.log('✅ Si tous les tests passent, le dashboard est fonctionnel !');
        console.log('==============================================\n');
        
    } catch (error) {
        console.log('\n❌ Erreur lors des tests:', error.message);
        console.log('\n💡 Assurez-vous que:');
        console.log('   1. Le serveur est démarré: node server.js');
        console.log('   2. Le serveur écoute sur le port 10000');
        console.log('   3. Les fichiers sont synchronisés dans dist/');
        process.exit(1);
    }
})();

