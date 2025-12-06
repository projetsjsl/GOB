#!/usr/bin/env node
/**
 * Script pour supprimer les fonds mutuels de la library localStorage
 * 
 * Ce script détecte et supprime tous les profils de fonds mutuels
 * qui sont déjà dans la library (localStorage).
 * 
 * Usage: node scripts/remove-mutual-funds-from-library.js
 */

import { isMutualFund } from '../public/3p1/utils/calculations.ts';

const STORAGE_KEY = 'finance_pro_profiles';

function removeMutualFundsFromLibrary() {
  try {
    // Lire la library depuis localStorage (simulation - en réalité c'est côté client)
    const saved = localStorage.getItem(STORAGE_KEY);
    
    if (!saved) {
      console.log('ℹ️  Aucune library trouvée dans localStorage');
      return;
    }

    const library = JSON.parse(saved);
    const initialCount = Object.keys(library).length;
    const mutualFunds = [];
    const cleaned = {};

    // Parcourir tous les profils et filtrer les fonds mutuels
    for (const [symbol, profile] of Object.entries(library)) {
      const companyName = profile?.info?.name || '';
      
      if (isMutualFund(symbol, companyName)) {
        mutualFunds.push({
          symbol,
          name: companyName || symbol
        });
        console.log(`⚠️  Fonds mutuel détecté: ${symbol} - ${companyName}`);
      } else {
        cleaned[symbol] = profile;
      }
    }

    if (mutualFunds.length === 0) {
      console.log('✅ Aucun fonds mutuel trouvé dans la library');
      return;
    }

    console.log(`\n📊 Résumé:`);
    console.log(`   • Profils totaux: ${initialCount}`);
    console.log(`   • Fonds mutuels détectés: ${mutualFunds.length}`);
    console.log(`   • Profils restants: ${Object.keys(cleaned).length}`);

    console.log(`\n🗑️  Fonds mutuels à supprimer:`);
    mutualFunds.forEach(({ symbol, name }) => {
      console.log(`   • ${symbol} - ${name}`);
    });

    // Sauvegarder la library nettoyée
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      console.log(`\n✅ ${mutualFunds.length} fonds mutuels supprimés de la library`);
    } catch (e) {
      console.error('❌ Erreur lors de la sauvegarde:', e);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Note: Ce script doit être exécuté côté client (dans le navigateur)
// car localStorage n'est pas disponible dans Node.js
console.log('⚠️  Ce script doit être exécuté dans le navigateur');
console.log('💡 Pour supprimer les fonds mutuels, utilisez la console du navigateur:');
console.log('');
console.log('   const { isMutualFund } = require("./public/3p1/utils/calculations.ts");');
console.log('   const STORAGE_KEY = "finance_pro_profiles";');
console.log('   const library = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");');
console.log('   const cleaned = {};');
console.log('   for (const [symbol, profile] of Object.entries(library)) {');
console.log('     if (!isMutualFund(symbol, profile?.info?.name)) {');
console.log('       cleaned[symbol] = profile;');
console.log('     }');
console.log('   }');
console.log('   localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));');
console.log('');

