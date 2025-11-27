/**
 * Script de test pour vérifier tous les onglets du dashboard
 * Teste chaque onglet et vérifie les erreurs dans la console
 */

const tabs = [
    { id: 'markets-economy', name: 'Marchés & Économie', ref: 'e34' },
    { id: 'intellistocks', name: 'JLab™', ref: 'e38' },
    { id: 'ask-emma', name: 'Emma IA™', ref: 'e45' },
    { id: 'plus', name: 'Plus', ref: 'e49' },
    { id: 'admin-jslai', name: 'Admin JSLAI', ref: 'e53' },
    { id: 'seeking-alpha', name: 'Seeking Alpha', ref: 'e57' },
    { id: 'stocks-news', name: 'Stocks News', ref: 'e61' },
    { id: 'emma-sms', name: 'Emma En Direct', ref: 'e65' },
    { id: 'tests-js', name: 'TESTS JS', ref: 'e69' },
    { id: 'economic-calendar', name: 'Calendrier Économique', ref: 'e73' },
    { id: 'dans-watchlist', name: "Dan's Watchlist", ref: 'e77' },
    { id: 'yield-curve', name: 'Courbe des Rendements', ref: 'e81' },
    { id: 'stocks-news', name: 'Titres & Nouvelles', ref: 'e85' }
];

console.log('🧪 Test de tous les onglets du dashboard');
console.log(`📋 ${tabs.length} onglets à tester\n`);

// Note: Ce script doit être exécuté dans le navigateur avec les outils de développement
// Il servira de référence pour les tests manuels

tabs.forEach((tab, index) => {
    console.log(`${index + 1}. ${tab.name} (${tab.id})`);
});

console.log('\n✅ Script de test créé. Utilisez les outils de développement du navigateur pour tester chaque onglet.');

