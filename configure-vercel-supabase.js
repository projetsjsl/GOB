#!/usr/bin/env node

/**
 * Configuration automatique des variables Supabase dans Vercel
 * Utilise les clés SUPABASE_SERVICE_KEY et SUPABASE_ANON_KEY
 */

import { execSync } from 'child_process';

console.log('🔧 CONFIGURATION VERCEL SUPABASE');
console.log('═'.repeat(50));

console.log('📋 Variables à configurer:');
console.log('');

console.log('1️⃣  SUPABASE_URL:');
console.log('   vercel env add SUPABASE_URL');
console.log('   Valeur: https://gob-watchlist.supabase.co');
console.log('');

console.log('2️⃣  SUPABASE_ANON_KEY:');
console.log('   vercel env add SUPABASE_ANON_KEY');
console.log('   Valeur: [Votre clé anon publique]');
console.log('');

console.log('3️⃣  SUPABASE_SERVICE_ROLE_KEY:');
console.log('   vercel env add SUPABASE_SERVICE_ROLE_KEY');
console.log('   Valeur: [Votre clé service role]');
console.log('');

console.log('4️⃣  SUPABASE_DB_PASSWORD:');
console.log('   vercel env add SUPABASE_DB_PASSWORD');
console.log('   Valeur: 5mUaqujMflrgZyCo');
console.log('');

console.log('💡 Instructions:');
console.log('   1. Exécutez chaque commande vercel env add');
console.log('   2. Collez la valeur correspondante');
console.log('   3. Confirmez avec Entrée');
console.log('');

console.log('🧪 Test après configuration:');
console.log('   node test-supabase-complete.js');
console.log('');

console.log('📖 Guide complet: SUPABASE_SETUP_GUIDE.md');
console.log('');

// Fonction pour configurer une variable
function configureVercelEnv(key, description, defaultValue = null) {
    console.log(`\\n🔧 Configuration de ${key}:`);
    console.log(`   Description: ${description}`);
    if (defaultValue) {
        console.log(`   Valeur par défaut: ${defaultValue}`);
    }
    console.log(`   Commande: vercel env add ${key}`);
    console.log('');
}

// Afficher les configurations
configureVercelEnv('SUPABASE_URL', 'URL du projet Supabase', 'https://gob-watchlist.supabase.co');
configureVercelEnv('SUPABASE_ANON_KEY', 'Clé publique anonyme Supabase');
configureVercelEnv('SUPABASE_SERVICE_ROLE_KEY', 'Clé secrète service role Supabase');
configureVercelEnv('SUPABASE_DB_PASSWORD', 'Mot de passe PostgreSQL', '5mUaqujMflrgZyCo');

console.log('✅ Configuration terminée!');
console.log('🚀 Prochaine étape: Exécuter le SQL dans Supabase');
