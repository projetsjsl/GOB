/**
 * Script de nettoyage des anciens fichiers CSS
 * 
 * Identifie et supprime les fichiers CSS obsolètes après migration vers design system
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

// Fichiers CSS à conserver (nouveau design system)
const KEEP_FILES = [
  'public/css/tailwind.css', // CSS compilé Tailwind
  'src/styles/main.css',
  'src/styles/tokens.css',
  'src/styles/spacing.css',
  'src/styles/accessibility.css',
  'src/styles/components.css',
  'src/index.css', // Base styles pour Vite
  'src/tailwind-standalone.css', // Source Tailwind
];

// Fichiers CSS à migrer puis supprimer
const MIGRATE_AND_REMOVE = [
  'public/css/spacing-standardization.css', // Migré vers src/styles/spacing.css
  'public/css/wcag-accessibility-fixes.css', // Migré vers src/styles/accessibility.css
];

// Fichiers CSS à analyser (peuvent être conservés si utilisés)
const ANALYZE_FILES = [
  'public/css/themes.css', // Peut être conservé pour compatibilité
  'public/css/retirement-calculator-fix.css', // Spécifique à un composant
];

function checkFileUsage(filePath) {
  const relativePath = path.relative(PROJECT_ROOT, filePath);
  const fileName = path.basename(filePath);
  
  // Chercher les références dans les fichiers HTML/JS
  const searchDirs = ['public', 'src'];
  let found = false;
  
  for (const dir of searchDirs) {
    const dirPath = path.join(PROJECT_ROOT, dir);
    if (!fs.existsSync(dirPath)) continue;
    
    const files = getAllFiles(dirPath, ['.html', '.js', '.tsx', '.ts']);
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes(fileName) || content.includes(relativePath)) {
        found = true;
        console.log(`  ✓ Trouvé dans: ${path.relative(PROJECT_ROOT, file)}`);
      }
    }
  }
  
  return found;
}

function getAllFiles(dirPath, extensions = []) {
  let results = [];
  const list = fs.readdirSync(dirPath);
  
  for (const file of list) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        results = results.concat(getAllFiles(filePath, extensions));
      }
    } else {
      if (extensions.length === 0 || extensions.some(ext => file.endsWith(ext))) {
        results.push(filePath);
      }
    }
  }
  
  return results;
}

function main() {
  console.log('🧹 Nettoyage des anciens fichiers CSS...\n');
  
  let removedCount = 0;
  let keptCount = 0;
  
  // Traiter les fichiers à migrer puis supprimer
  for (const file of MIGRATE_AND_REMOVE) {
    const fullPath = path.join(PROJECT_ROOT, file);
    if (fs.existsSync(fullPath)) {
      console.log(`📦 ${file} - Migré, suppression...`);
      try {
        fs.unlinkSync(fullPath);
        removedCount++;
        console.log(`  ✅ Supprimé\n`);
      } catch (error) {
        console.error(`  ❌ Erreur: ${error.message}\n`);
      }
    }
  }
  
  // Analyser les fichiers à analyser
  for (const file of ANALYZE_FILES) {
    const fullPath = path.join(PROJECT_ROOT, file);
    if (fs.existsSync(fullPath)) {
      console.log(`🔍 ${file} - Analyse d'utilisation...`);
      const isUsed = checkFileUsage(fullPath);
      if (isUsed) {
        console.log(`  ⚠️  Toujours utilisé, conservé\n`);
        keptCount++;
      } else {
        console.log(`  ℹ️  Non utilisé, peut être supprimé (non supprimé automatiquement)\n`);
      }
    }
  }
  
  console.log(`\n📊 Résumé:`);
  console.log(`  ✅ Fichiers supprimés: ${removedCount}`);
  console.log(`  📦 Fichiers conservés: ${keptCount}`);
  console.log(`  📁 Fichiers à analyser manuellement: ${ANALYZE_FILES.length - keptCount}`);
}

main();
