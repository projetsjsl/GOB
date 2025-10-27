#!/usr/bin/env node

/**
 * Script de configuration automatique Supabase pour Vercel
 * Utilise le mot de passe PostgreSQL fourni: 5mUaqujMflrgZyCo
 */

import { execSync } from 'child_process';

const SUPABASE_PASSWORD = '5mUaqujMflrgZyCo';

console.log('🔧 CONFIGURATION SUPABASE POUR VERCEL');
console.log('═'.repeat(50));

console.log('📋 Instructions pour configurer Supabase:');
console.log('');
console.log('1️⃣  RÉCUPÉRER LES CLÉS SUPABASE:');
console.log('   • Allez sur https://app.supabase.com');
console.log('   • Sélectionnez le projet "gob-watchlist"');
console.log('   • Allez dans Settings > API');
console.log('   • Copiez les valeurs suivantes:');
console.log('');
console.log('2️⃣  CONFIGURER LES VARIABLES VERCEL:');
console.log('');

// Fonction pour ajouter une variable d'environnement Vercel
function addVercelEnv(key, description) {
    console.log(`   vercel env add ${key}`);
    console.log(`   # ${description}`);
    console.log('');
}

addVercelEnv('SUPABASE_URL', 'URL du projet Supabase (ex: https://gob-watchlist.supabase.co)');
addVercelEnv('SUPABASE_ANON_KEY', 'Clé publique anonyme Supabase');
addVercelEnv('SUPABASE_SERVICE_ROLE_KEY', 'Clé secrète service role Supabase');

console.log('3️⃣  VARIABLES SUPPLÉMENTAIRES RECOMMANDÉES:');
addVercelEnv('SUPABASE_DB_PASSWORD', `Mot de passe PostgreSQL: ${SUPABASE_PASSWORD}`);

console.log('4️⃣  TESTER LA CONFIGURATION:');
console.log('   node test-supabase-gob-watchlist.js');
console.log('');

console.log('5️⃣  EXÉCUTER LE SQL DANS SUPABASE:');
console.log('   • Ouvrir https://app.supabase.com');
console.log('   • SQL Editor > New query');
console.log('   • Copier le contenu de SUPABASE_SETUP_FINAL.sql');
console.log('   • Exécuter le script');
console.log('');

console.log('📊 STRUCTURE ATTENDUE:');
console.log('   ✅ earnings_calendar - Calendrier des résultats');
console.log('   ✅ pre_earnings_analysis - Analyses pré-résultats');
console.log('   ✅ earnings_results - Résultats et verdicts');
console.log('   ✅ significant_news - Nouvelles importantes');
console.log('   ✅ watchlist - Liste de surveillance');
console.log('');

console.log('🚀 PROCHAINES ÉTAPES:');
console.log('   1. Configurer les variables Vercel');
console.log('   2. Exécuter le SQL dans Supabase');
console.log('   3. Tester la connexion');
console.log('   4. Déployer les nouveaux agents Emma');
console.log('');

console.log('💡 CONSEILS:');
console.log('   • Gardez le mot de passe PostgreSQL sécurisé');
console.log('   • Testez toujours la connexion avant le déploiement');
console.log('   • Vérifiez les permissions RLS dans Supabase');
console.log('');

// Créer un fichier de configuration exemple
const configExample = `# Configuration Supabase pour GOB
SUPABASE_URL=https://gob-watchlist.supabase.co
SUPABASE_ANON_KEY=eyJ... (récupérer depuis Supabase)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (récupérer depuis Supabase)
SUPABASE_DB_PASSWORD=${SUPABASE_PASSWORD}

# Instructions:
# 1. Récupérer les clés depuis https://app.supabase.com
# 2. Configurer dans Vercel: vercel env add [KEY] [VALUE]
# 3. Tester: node test-supabase-gob-watchlist.js
`;

import fs from 'fs';
fs.writeFileSync('supabase-config-example.env', configExample);

console.log('📄 Fichier de configuration créé: supabase-config-example.env');
console.log('');

export { SUPABASE_PASSWORD };
