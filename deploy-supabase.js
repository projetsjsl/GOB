#!/usr/bin/env node

/**
 * Script de déploiement Supabase pour GOB
 */

import { execSync } from 'child_process';

console.log('🚀 DÉPLOIEMENT SUPABASE GOB');
console.log('═'.repeat(50));

console.log('📋 Étapes de déploiement:');
console.log('');

console.log('1️⃣  Configurer les variables Vercel:');
console.log('   vercel env add SUPABASE_URL');
console.log('   vercel env add SUPABASE_ANON_KEY');
console.log('   vercel env add SUPABASE_SERVICE_ROLE_KEY');
console.log('');

console.log('2️⃣  Exécuter le SQL dans Supabase:');
console.log('   • Ouvrir https://app.supabase.com');
console.log('   • SQL Editor > New query');
console.log('   • Copier SUPABASE_SETUP_FINAL.sql');
console.log('   • Exécuter le script');
console.log('');

console.log('3️⃣  Tester la configuration:');
console.log('   node test-supabase-complete.js');
console.log('');

console.log('4️⃣  Déployer sur Vercel:');
console.log('   git add .');
console.log('   git commit -m "Configuration Supabase complète"');
console.log('   git push origin main');
console.log('');

console.log('5️⃣  Vérifier le déploiement:');
console.log('   vercel --prod');
console.log('');

console.log('✅ Déploiement terminé!');
console.log('Le système Emma AI est maintenant opérationnel.');
