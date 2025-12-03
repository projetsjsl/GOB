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

// Chaînes à vérifier dans le build
// Note: Le code est minifié, donc on cherche des patterns plus généraux
const CHECK_STRINGS = [
  { pattern: 'EvaluationDetails', required: true, description: 'Composant EvaluationDetails' },
  { pattern: 'checkbox', required: true, description: 'Inputs checkbox' },
  { pattern: 'exclude', required: false, description: 'Fonctionnalité exclusion (peut être minifiée)' },
  { pattern: 'toggle', required: false, description: 'Fonction toggle (peut être minifiée)' },
  { pattern: 'Intervalles de Référence', required: true, description: 'Table HistoricalRangesTable' },
  { pattern: 'JPEGY', required: true, description: 'Métrique JPEGY' },
  { pattern: 'Ratios Actuels vs Historiques', required: true, description: 'Section Ratios Actuels' },
  { pattern: 'Zones de Prix', required: true, description: 'Section Zones de Prix Recommandées' }
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
  
  let allRequiredFound = true;
  let optionalFound = 0;
  
  for (const check of CHECK_STRINGS) {
    const found = content.includes(check.pattern);
    if (found) {
      console.log(`✅ "${check.pattern}" trouvé (${check.description})`);
      if (!check.required) optionalFound++;
    } else {
      if (check.required) {
        console.error(`❌ "${check.pattern}" NON TROUVÉ (${check.description})`);
        allRequiredFound = false;
      } else {
        console.log(`⚠️  "${check.pattern}" non trouvé (optionnel, peut être minifié)`);
      }
    }
  }

  // 4. Résumé
  console.log('\n' + '='.repeat(50));
  if (allRequiredFound) {
    console.log('✅ Toutes les vérifications requises sont passées');
    if (optionalFound > 0) {
      console.log(`ℹ️  ${optionalFound} vérification(s) optionnelle(s) réussie(s)`);
    }
    console.log('\n💡 Pour tester visuellement:');
    console.log('   1. cd public/3p1 && npm run preview');
    console.log('   2. Ouvrir http://localhost:4173');
    console.log('   3. Vérifier que les cases à cocher sont visibles');
    process.exit(0);
  } else {
    console.error('❌ Certaines vérifications requises ont échoué');
    console.log('\n💡 Solution:');
    console.log('   1. cd public/3p1');
    console.log('   2. npm run build');
    console.log('   3. node ../../scripts/verify-3p1-build.js');
    process.exit(1);
  }
}

verifyBuild().catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});

