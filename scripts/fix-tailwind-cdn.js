#!/usr/bin/env node
/**
 * Script pour remplacer le CDN Tailwind par une référence locale
 * 
 * Ce script remplace tous les <script src="https://cdn.tailwindcss.com"></script>
 * par une référence au CSS Tailwind compilé localement
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Trouver tous les fichiers HTML
function findHTMLFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Ignorer node_modules, .git, dist, etc.
      if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(file)) {
        findHTMLFiles(filePath, fileList);
      }
    } else if (file.endsWith('.html')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Remplacer le CDN Tailwind
function replaceTailwindCDN(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Pattern pour trouver le script CDN Tailwind
  const cdnPattern = /<script[^>]*src=["']https?:\/\/cdn\.tailwindcss\.com[^"']*["'][^>]*><\/script>/gi;
  
  if (cdnPattern.test(content)) {
    // Remplacer par une référence au CSS Tailwind compilé
    // Note: Le chemin dépend de la structure du projet
    const relativePath = path.relative(path.dirname(filePath), path.join(projectRoot, 'public', 'css', 'tailwind.css'));
    const cssLink = `<link rel="stylesheet" href="${relativePath}">`;
    
    content = content.replace(cdnPattern, cssLink);
    modified = true;
    
    // Si tailwind.config existe, le garder mais le convertir en CSS custom properties si nécessaire
    const configPattern = /<script[^>]*>[\s\S]*?tailwind\.config[\s\S]*?<\/script>/gi;
    // Pour l'instant, on garde la config mais on pourrait la convertir
    
    console.log(`✅ Modifié: ${filePath}`);
  }
  
  return { content, modified };
}

// Main
async function main() {
  console.log('🔍 Recherche des fichiers HTML avec CDN Tailwind...\n');
  
  const htmlFiles = findHTMLFiles(projectRoot);
  let modifiedCount = 0;
  
  for (const file of htmlFiles) {
    const result = replaceTailwindCDN(file);
    if (result.modified) {
      // ⚠️ Mode dry-run par défaut - décommenter pour appliquer
      // fs.writeFileSync(file, result.content, 'utf8');
      modifiedCount++;
    }
  }
  
  console.log(`\n📊 Résumé:`);
  console.log(`   Fichiers HTML trouvés: ${htmlFiles.length}`);
  console.log(`   Fichiers avec CDN Tailwind: ${modifiedCount}`);
  console.log(`\n⚠️  Mode dry-run activé. Décommentez fs.writeFileSync pour appliquer les changements.`);
}

main().catch(console.error);
