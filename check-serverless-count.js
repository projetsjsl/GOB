#!/usr/bin/env node

/**
 * Vérification du nombre de fonctions serverless
 * Pour respecter la limite du plan Hobby Vercel (12 max)
 */

import fs from 'fs';
import path from 'path';

function countServerlessFunctions() {
  console.log('🔍 Vérification du nombre de fonctions serverless\n');
  
  const apiDir = './api';
  let count = 0;
  const functions = [];
  
  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Scanner les sous-dossiers
        scanDirectory(fullPath);
      } else if (item.endsWith('.js')) {
        // Compter les fichiers .js comme fonctions serverless
        count++;
        functions.push(fullPath);
      }
    }
  }
  
  scanDirectory(apiDir);
  
  console.log('📊 Fonctions serverless trouvées:');
  functions.forEach((func, index) => {
    console.log(`   ${index + 1}. ${func}`);
  });
  
  console.log(`\n🎯 Total: ${count} fonctions serverless`);
  
  if (count <= 12) {
    console.log('✅ Compatible avec le plan Hobby Vercel (limite: 12)');
  } else {
    console.log('❌ DÉPASSEMENT: Limite plan Hobby dépassée (limite: 12)');
    console.log(`   Suppression nécessaire: ${count - 12} fonction(s)`);
  }
  
  console.log('\n📋 Fonctions conservées (Gemini non touché):');
  const geminiFunctions = functions.filter(f => f.includes('gemini'));
  geminiFunctions.forEach(func => {
    console.log(`   ✅ ${func}`);
  });
  
  return count;
}

// Exécuter la vérification
const count = countServerlessFunctions();

console.log('\n🚀 Status:');
if (count <= 12) {
  console.log('✅ Déploiement possible avec le plan Hobby');
} else {
  console.log('❌ Déploiement impossible - Limite dépassée');
}
