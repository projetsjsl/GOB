#!/usr/bin/env node
/**
 * Script pour supprimer les configurations tailwind.config des fichiers HTML
 * Ces configurations ne fonctionnent plus après le remplacement du CDN par CSS compilé
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
      if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(file)) {
        findHTMLFiles(filePath, fileList);
      }
    } else if (file.endsWith('.html')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Supprimer les configurations tailwind.config
function removeTailwindConfig(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Pattern pour trouver les scripts avec tailwind.config
  // Match: <script>...tailwind.config = {...}...</script>
  const configPattern = /<script[^>]*>[\s\S]*?tailwind\.config\s*=[\s\S]*?<\/script>/gi;
  
  if (configPattern.test(content)) {
    // Extraire les keyframes et animations pour les convertir en CSS
    const keyframesMatch = content.match(/keyframes:\s*\{[\s\S]*?\}/);
    const animationsMatch = content.match(/animation:\s*\{[\s\S]*?\}/);
    
    // Supprimer le script tailwind.config
    content = content.replace(configPattern, '');
    modified = true;
    
    // Si des keyframes/animation étaient définis, les ajouter en CSS
    if (keyframesMatch || animationsMatch) {
      const styleTag = '<style>\n        /* Custom animations - migrées depuis tailwind.config */\n';
      let cssContent = '';
      
      if (keyframesMatch) {
        // Extraire les keyframes et les convertir en CSS
        const keyframes = keyframesMatch[0];
        // Simple extraction - peut être amélioré
        if (keyframes.includes('float')) {
          cssContent += '        @keyframes float {\n            0%, 100% { transform: translateY(0); }\n            50% { transform: translateY(-10px); }\n        }\n';
        }
      }
      
      if (animationsMatch) {
        if (animationsMatch[0].includes('float')) {
          cssContent += '        .animate-float { animation: float 6s ease-in-out infinite; }\n';
        }
        if (animationsMatch[0].includes('pulse-slow')) {
          cssContent += '        .animate-pulse-slow { animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }\n';
        }
      }
      
      if (cssContent) {
        // Insérer le style après le link tailwind.css
        const tailwindLinkPattern = /(<link[^>]*href=["'][^"']*tailwind\.css["'][^>]*>)/i;
        if (tailwindLinkPattern.test(content)) {
          content = content.replace(tailwindLinkPattern, `$1\n    ${styleTag}${cssContent}    </style>`);
        }
      }
    }
    
    console.log(`✅ Modifié: ${filePath}`);
  }
  
  return { content, modified };
}

// Main
async function main() {
  console.log('🔍 Recherche des fichiers HTML avec tailwind.config...\n');
  
  const htmlFiles = findHTMLFiles(projectRoot);
  let modifiedCount = 0;
  
  for (const file of htmlFiles) {
    const result = removeTailwindConfig(file);
    if (result.modified) {
      fs.writeFileSync(file, result.content, 'utf8');
      modifiedCount++;
    }
  }
  
  console.log(`\n📊 Résumé:`);
  console.log(`   Fichiers HTML trouvés: ${htmlFiles.length}`);
  console.log(`   Fichiers modifiés: ${modifiedCount}`);
  console.log(`\n✅ Toutes les configurations tailwind.config ont été supprimées.`);
}

main().catch(console.error);
