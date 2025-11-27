/**
 * Script de test en boucle pour valider le dashboard en production
 * Teste tous les onglets et corrige les erreurs jusqu'à ce que tout fonctionne
 */

const https = require('https');
const http = require('http');

// URL de production Vercel (à adapter selon votre déploiement)
const PROD_URL = process.env.VERCEL_URL || 'https://gob-jvizpuasg-projetsjsls-projects.vercel.app';
const DASHBOARD_PATH = '/beta-combined-dashboard.html';

// Liste des onglets à tester
const TABS = [
    { id: 'markets-economy', name: 'Marchés & Économie' },
    { id: 'intellistocks', name: 'JLab™' },
    { id: 'ask-emma', name: 'Emma IA™' },
    { id: 'plus', name: 'Plus' },
    { id: 'admin-jslai', name: 'Admin JSLAI' },
    { id: 'scrapping-sa', name: 'Seeking Alpha' },
    { id: 'seeking-alpha', name: 'Stocks News' },
    { id: 'email-briefings', name: 'Emma En Direct' },
    { id: 'economic-calendar', name: 'Calendrier Économique' },
    { id: 'dans-watchlist', name: "Dan's Watchlist" },
    { id: 'yield-curve', name: 'Courbe des Rendements' },
    { id: 'stocks-news', name: 'Titres & Nouvelles' }
];

console.log('🔄 Démarrage des tests en boucle...');
console.log(`📍 URL: ${PROD_URL}${DASHBOARD_PATH}\n`);

// Note: Ce script nécessite un navigateur automatisé (Puppeteer/Playwright)
// Pour l'instant, il vérifie juste que l'URL répond
console.log('⚠️  Ce script nécessite un navigateur automatisé pour tester les onglets.');
console.log('📝 Utilisez le script test-all-tabs-ui.js avec le navigateur MCP pour les tests complets.\n');

// Vérification simple de l'URL
const url = new URL(PROD_URL + DASHBOARD_PATH);
const client = url.protocol === 'https:' ? https : http;

const req = client.get(url.href, (res) => {
    console.log(`✅ Serveur répond: ${res.statusCode}`);
    if (res.statusCode === 200) {
        console.log('✅ Dashboard accessible en production');
    } else {
        console.error(`❌ Erreur HTTP: ${res.statusCode}`);
    }
});

req.on('error', (error) => {
    console.error(`❌ Erreur de connexion: ${error.message}`);
});

req.end();

console.log('\n📋 Pour tester tous les onglets, utilisez le navigateur MCP avec:');
console.log('   - Navigation vers l\'URL de production');
console.log('   - Clic sur chaque onglet');
console.log('   - Vérification des erreurs dans la console');
console.log('   - Correction des erreurs trouvées');
console.log('   - Répétition jusqu\'à ce qu\'il n\'y ait plus d\'erreurs\n');

