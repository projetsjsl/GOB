#!/usr/bin/env node
/**
 * Script de vérification du build 3p1
 * Vérifie que les modifications importantes sont présentes dans le build
 * 
 * Usage: node scripts/verify-3p1-build.js
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const DIST_FILE = join(process.cwd(), 'public/3p1/dist/assets/index.js');

// Chaînes à vérifier dans le build (exemples)
const CHECK_STRINGS = [
  'EvaluationDetails',
  'excludeEPS',
  'excludeCF',
  'excludeBV',
  'excludeDIV',
  'checkbox',
  'handleToggleExclusion'
];

async function verifyBuild() {
  console.log('🔍 Vérification du build 3p1...\n');

  // 1. Vérifier que le fichier existe
  if (!existsSync(DIST_FILE)) {
    console.error('❌ Fichier build non trouvé:', DIST_FILE);
    console.log('💡 Solution: Exécuter "cd public/3p1 && npm run build"');
    process.exit(1);
  }

  // 2. Vérifier le timestamp
  const stats = await import('fs/promises').then(m => m.stat(DIST_FILE));
  const ageMinutes = (Date.now() - stats.mtime.getTime()) / (1000 * 60);
  
  if (ageMinutes > 10) {
    console.warn(`⚠️  Build ancien (${ageMinutes.toFixed(1)} minutes)`);
    console.log('💡 Solution: Rebuild avec "cd public/3p1 && npm run build"');
  } else {
    console.log(`✅ Build récent (${ageMinutes.toFixed(1)} minutes)`);
  }

  // 3. Lire le fichier et vérifier les chaînes
  console.log('\n🔍 Vérification des chaînes dans le build...\n');
  const content = await readFile(DIST_FILE, 'utf-8');
  
  let allFound = true;
  for (const str of CHECK_STRINGS) {
    const found = content.includes(str);
    if (found) {
      console.log(`✅ "${str}" trouvé`);
    } else {
      console.error(`❌ "${str}" NON TROUVÉ`);
      allFound = false;
    }
  }

  // 4. Résumé
  console.log('\n' + '='.repeat(50));
  if (allFound) {
    console.log('✅ Toutes les vérifications sont passées');
    process.exit(0);
  } else {
    console.error('❌ Certaines vérifications ont échoué');
    console.log('💡 Solution: Rebuild avec "cd public/3p1 && npm run build"');
    process.exit(1);
  }
}

verifyBuild().catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});

