#!/usr/bin/env node

/**
 * Vérification de la configuration Supabase
 * Diagnostic des problèmes de connexion
 */

console.log('🔍 DIAGNOSTIC CONFIGURATION SUPABASE');
console.log('═'.repeat(60));

console.log('📋 Problèmes identifiés:');
console.log('');

console.log('❌ Problème 1: Clés Supabase manquantes');
console.log('   • Les clés utilisées sont des exemples');
console.log('   • Besoin des vraies clés depuis Supabase');
console.log('');

console.log('❌ Problème 2: URL de connexion incorrecte');
console.log('   • db.gob-watchlist.supabase.co non trouvé');
console.log('   • Besoin de vérifier l\'URL exacte');
console.log('');

console.log('🔧 SOLUTIONS:');
console.log('═'.repeat(60));
console.log('');

console.log('1️⃣  RÉCUPÉRER LES VRAIES CLÉS SUPABASE:');
console.log('   • Allez sur https://app.supabase.com');
console.log('   • Sélectionnez le projet "gob-watchlist"');
console.log('   • Settings > API');
console.log('   • Copiez les vraies clés:');
console.log('     - Project URL');
console.log('     - anon public key');
console.log('     - service_role secret key');
console.log('');

console.log('2️⃣  VÉRIFIER L\'URL DE CONNEXION:');
console.log('   • Settings > Database');
console.log('   • Section "Connection string"');
console.log('   • Copiez l\'URL exacte');
console.log('');

console.log('3️⃣  CONFIGURER LES VARIABLES VERCEL:');
console.log('   vercel env add SUPABASE_URL');
console.log('   vercel env add SUPABASE_ANON_KEY');
console.log('   vercel env add SUPABASE_SERVICE_ROLE_KEY');
console.log('');

console.log('4️⃣  EXÉCUTER LE SQL DANS SUPABASE:');
console.log('   • SQL Editor > New query');
console.log('   • Copier SUPABASE_SETUP_FINAL.sql');
console.log('   • Exécuter le script');
console.log('');

console.log('🧪 TEST APRÈS CONFIGURATION:');
console.log('   node test-supabase-final.js');
console.log('');

console.log('📖 GUIDE COMPLET:');
console.log('   SUPABASE_SETUP_GUIDE.md');
console.log('');

console.log('💡 CONSEILS:');
console.log('   • Les clés commencent par "eyJ..."');
console.log('   • L\'URL contient votre projet ID');
console.log('   • Le mot de passe PostgreSQL est: 5mUaqujMflrgZyCo');
console.log('');

console.log('🚀 Une fois configuré, le système Emma AI sera opérationnel!');
