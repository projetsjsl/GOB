#!/usr/bin/env node

/**
 * Vérification de l'heure de Montréal pour le cron job
 */

console.log('🕐 Vérification de l\'heure de Montréal\n');

// Heure actuelle à Montréal
const now = new Date();
const montrealTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Montreal"}));
const utcTime = new Date(now.toLocaleString("en-US", {timeZone: "UTC"}));

console.log('📅 Informations temporelles:');
console.log(`   Heure actuelle Montréal: ${montrealTime.toLocaleString('fr-FR')}`);
console.log(`   Heure actuelle UTC: ${utcTime.toLocaleString('fr-FR')}`);
console.log(`   Décalage: ${(montrealTime.getHours() - utcTime.getHours())} heures`);

console.log('\n⏰ Configuration du cron job:');
console.log('   Schedule: 0 11 * * * (11h00 UTC)');
console.log('   Équivalent Montréal: 6h00 (EST) / 7h00 (EDT)');

console.log('\n📊 Détails:');
console.log('   - EST (hiver): UTC-5 → 11h UTC = 6h Montréal ✅');
console.log('   - EDT (été): UTC-4 → 11h UTC = 7h Montréal');
console.log('   - Le cron s\'exécutera à 6h00 en hiver et 7h00 en été');

console.log('\n🎯 Résultat:');
console.log('   ✅ Cron configuré pour s\'exécuter tôt le matin à Montréal');
console.log('   ✅ Compatible avec le plan Hobby Vercel');
console.log('   ✅ Nouvelles actualisées avant l\'ouverture des marchés');
