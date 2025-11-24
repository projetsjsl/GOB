/**
 * Script pour corriger toutes les URLs Vercel incorrectes
 * Remplace gob.vercel.app par gob-projetsjsls-projects.vercel.app
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OLD_URL = 'gob.vercel.app';
const NEW_URL = 'gob-projetsjsls-projects.vercel.app';

// Fichiers à corriger (exclure backups et node_modules)
const patterns = [
  'api/**/*.js',
  'lib/**/*.js',
  '*.js',
  '*.sh',
  '*.md',
  'n8n-workflow*.json',
  'src/**/*.tsx',
  'docs/**/*.md'
];

// Fichiers à exclure
const excludePatterns = [
  '**/node_modules/**',
  '**/backup_docs_20251106_111537/**',
  '**/.git/**',
  '**/dist/**'
];

console.log('🔍 Recherche des fichiers à corriger...\n');

let totalFiles = 0;
let totalReplacements = 0;

for (const pattern of patterns) {
  const files = await glob(pattern, {
    cwd: __dirname,
    ignore: excludePatterns,
    absolute: true
  });

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8');
      
      // Compter les occurrences
      const matches = content.match(new RegExp(OLD_URL.replace(/\./g, '\\.'), 'g'));
      if (!matches) continue;

      const count = matches.length;
      console.log(`📝 ${file.replace(__dirname + '/', '')} (${count} occurrence${count > 1 ? 's' : ''})`);

      // Remplacer
      const newContent = content.replace(
        new RegExp(OLD_URL.replace(/\./g, '\\.'), 'g'),
        NEW_URL
      );

      writeFileSync(file, newContent, 'utf-8');
      
      totalFiles++;
      totalReplacements += count;
    } catch (error) {
      console.error(`❌ Erreur sur ${file}:`, error.message);
    }
  }
}

console.log(`\n✅ Correction terminée !`);
console.log(`   - ${totalFiles} fichier${totalFiles > 1 ? 's' : ''} modifié${totalFiles > 1 ? 's' : ''}`);
console.log(`   - ${totalReplacements} remplacement${totalReplacements > 1 ? 's' : ''} effectué${totalReplacements > 1 ? 's' : ''}`);
console.log(`\n🔄 URL corrigée : ${OLD_URL} → ${NEW_URL}`);

