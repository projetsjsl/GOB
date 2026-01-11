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
    // Calculer le chemin relatif vers tailwind.css
    // Les fichiers peuvent être dans public/ ou dans des sous-dossiers
    let relativePath;
    if (filePath.includes('public/')) {
      // Fichier dans public/ ou sous-dossier
      const publicPath = filePath.substring(filePath.indexOf('public/'));
      const depth = (publicPath.match(/\//g) || []).length - 2; // -2 pour public/ et le fichier
      relativePath = depth > 0 ? '../'.repeat(depth) + 'css/tailwind.css' : 'css/tailwind.css';
    } else {
      // Fichier à la racine ou ailleurs
      relativePath = path.relative(path.dirname(filePath), path.join(projectRoot, 'public', 'css', 'tailwind.css'));
    }
    
    // Normaliser les séparateurs de chemin pour le web
    relativePath = relativePath.replace(/\\/g, '/');
    
    const cssLink = `<link rel="stylesheet" href="${relativePath}">`;
    
    content = content.replace(cdnPattern, cssLink);
    modified = true;
    
    // Note: Les configurations tailwind.config dans <script> sont conservées
    // car elles peuvent être nécessaires pour des customizations spécifiques
    
    console.log(`✅ Modifié: ${filePath} -> ${relativePath}`);
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
      // ✅ Appliquer les changements (mode production)
      fs.writeFileSync(file, result.content, 'utf8');
      modifiedCount++;
    }
  }
  
  console.log(`\n📊 Résumé:`);
  console.log(`   Fichiers HTML trouvés: ${htmlFiles.length}`);
  console.log(`   Fichiers modifiés: ${modifiedCount}`);
  console.log(`\n✅ Tous les CDN Tailwind ont été remplacés par des références locales.`);
}

main().catch(console.error);
