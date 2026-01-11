/**
 * Script pour supprimer les console.log en production
 * 
 * Remplace console.log par logger.debug dans les fichiers critiques
 * et supprime les console.log dans les fichiers de production
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Fichiers critiques à traiter en priorité
const CRITICAL_FILES = [
  'public/js/dashboard/app-inline.js',
  'public/beta-combined-dashboard.html',
  'src/components/BetaCombinedDashboard.tsx',
  'src/App.tsx',
];

// Patterns à remplacer
const REPLACEMENTS = [
  {
    // console.log simple
    pattern: /console\.log\(/g,
    replacement: 'logger.debug(',
    comment: '// Replaced console.log with logger.debug'
  },
  {
    // console.warn
    pattern: /console\.warn\(/g,
    replacement: 'logger.warn(',
    comment: '// Replaced console.warn with logger.warn'
  },
  {
    // console.error
    pattern: /console\.error\(/g,
    replacement: 'logger.error(',
    comment: '// Replaced console.error with logger.error'
  },
];

/**
 * Traite un fichier et remplace les console.log
 */
function processFile(filePath) {
  const fullPath = path.join(PROJECT_ROOT, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Fichier non trouvé: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  let hasLoggerImport = content.includes('logger') || content.includes('from') && content.includes('logger');

  // Appliquer les remplacements
  for (const { pattern, replacement, comment } of REPLACEMENTS) {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
      
      // Ajouter l'import logger si nécessaire (pour les fichiers JS/TS)
      if (!hasLoggerImport && (filePath.endsWith('.js') || filePath.endsWith('.ts') || filePath.endsWith('.tsx'))) {
        // Trouver la position pour ajouter l'import
        const importMatch = content.match(/^(import\s+.*?from\s+['"].*?['"];?\s*\n)/m);
        if (importMatch) {
          const importIndex = importMatch.index + importMatch[0].length;
          const loggerImport = filePath.startsWith('src/') 
            ? "import { logger } from '../lib/logger.js';\n"
            : "import { logger } from '../../lib/logger.js';\n";
          content = content.slice(0, importIndex) + loggerImport + content.slice(importIndex);
          hasLoggerImport = true;
        } else {
          // Ajouter au début du fichier
          content = `import { logger } from '../lib/logger.js';\n${content}`;
          hasLoggerImport = true;
        }
      }
    }
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Traité: ${filePath}`);
    return true;
  }

  return false;
}

/**
 * Fonction principale
 */
function main() {
  console.log('🔧 Suppression des console.log en production...\n');

  let processed = 0;
  let skipped = 0;

  // Traiter les fichiers critiques
  for (const file of CRITICAL_FILES) {
    if (processFile(file)) {
      processed++;
    } else {
      skipped++;
    }
  }

  console.log(`\n✅ Terminé: ${processed} fichiers modifiés, ${skipped} fichiers ignorés`);
}

main();
