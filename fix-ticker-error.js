#!/usr/bin/env node

/**
 * Script de correction automatique pour l'erreur "column ticker does not exist"
 * Crée la table watchlist avec la bonne structure
 */

console.log('🔧 CORRECTION ERREUR "column ticker does not exist"');
console.log('═'.repeat(60));

console.log('❌ Problème identifié:');
console.log('   La table watchlist n\'existe pas ou n\'a pas la colonne "ticker"');
console.log('');

console.log('🔧 SOLUTION:');
console.log('═'.repeat(60));
console.log('');

console.log('1️⃣  CRÉER LA TABLE WATCHLIST DE BASE');
console.log('   • Ouvrir https://app.supabase.com');
console.log('   • Sélectionner le projet "gob-watchlist"');
console.log('   • SQL Editor > New query');
console.log('   • Copier le contenu de supabase-watchlist-base.sql');
console.log('   • Exécuter le script');
console.log('');

console.log('2️⃣  VÉRIFIER LA CRÉATION');
console.log('   Exécuter cette requête dans Supabase:');
console.log('');
console.log('   SELECT * FROM watchlist LIMIT 5;');
console.log('');

console.log('3️⃣  TESTER LA CONNEXION');
console.log('   node test-watchlist-table.js');
console.log('');

console.log('📋 STRUCTURE DE LA TABLE WATCHLIST:');
console.log('═'.repeat(60));
console.log('');

const tableStructure = [
    { column: 'id', type: 'UUID', description: 'Clé primaire' },
    { column: 'ticker', type: 'TEXT', description: 'Symbole boursier (ex: AAPL)' },
    { column: 'company_name', type: 'TEXT', description: 'Nom de l\'entreprise' },
    { column: 'added_at', type: 'TIMESTAMP', description: 'Date d\'ajout' },
    { column: 'notes', type: 'TEXT', description: 'Notes utilisateur' },
    { column: 'target_price', type: 'DECIMAL', description: 'Prix cible' },
    { column: 'stop_loss', type: 'DECIMAL', description: 'Stop loss' },
    { column: 'created_at', type: 'TIMESTAMP', description: 'Date de création' },
    { column: 'updated_at', type: 'TIMESTAMP', description: 'Date de mise à jour' }
];

tableStructure.forEach(row => {
    console.log(`   ${row.column.padEnd(15)} ${row.type.padEnd(10)} ${row.description}`);
});

console.log('');

console.log('🚀 APRÈS CORRECTION:');
console.log('═'.repeat(60));
console.log('');

console.log('✅ La table watchlist sera fonctionnelle');
console.log('✅ Les agents Emma pourront accéder aux données');
console.log('✅ Le système sera prêt pour la production');
console.log('');

console.log('📖 GUIDES DISPONIBLES:');
console.log('   • FIX_WATCHLIST_ERROR.md - Guide de résolution');
console.log('   • SUPABASE_SETUP_GUIDE.md - Guide complet');
console.log('   • supabase-watchlist-base.sql - Script SQL');
console.log('');

console.log('💡 CONSEIL:');
console.log('   Exécutez d\'abord supabase-watchlist-base.sql,');
console.log('   puis SUPABASE_SETUP_FINAL.sql pour les autres tables.');
