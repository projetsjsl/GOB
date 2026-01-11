/**
 * Script pour identifier les styles inline avec couleurs hardcodées
 * Aide à la migration vers classes Tailwind
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

// Patterns de couleurs hardcodées à remplacer
const COLOR_PATTERNS = [
  /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g, // Hex colors
  /rgb\([^)]+\)/g, // RGB colors
  /rgba\([^)]+\)/g, // RGBA colors
];

// Couleurs communes à mapper vers Tailwind
const COLOR_MAP = {
  '#10b981': 'text-gob-success bg-gob-success',
  '#ef4444': 'text-gob-danger bg-gob-danger',
  '#f59e0b': 'text-gob-warning bg-gob-warning',
  '#6366f1': 'text-gob-primary bg-gob-primary',
  '#3b82f6': 'text-gob-info bg-gob-info',
  '#ffffff': 'text-white bg-white',
  '#000000': 'text-black bg-black',
  '#111827': 'bg-gob-bg-secondary',
  '#1f2937': 'bg-gray-800',
  '#374151': 'border-gob-border',
  '#9ca3af': 'text-gob-text-secondary',
};

function findInlineStyles(dir) {
  const results = [];
  const files = getAllFiles(dir, ['.tsx', '.ts', '.jsx', '.js']);
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      if (line.includes('style={{') || line.includes('style=')) {
        // Trouver les couleurs dans cette ligne
        const colors = [];
        COLOR_PATTERNS.forEach(pattern => {
          const matches = line.match(pattern);
          if (matches) {
            colors.push(...matches);
          }
        });
        
        if (colors.length > 0) {
          results.push({
            file: path.relative(PROJECT_ROOT, file),
            line: index + 1,
            lineContent: line.trim(),
            colors: [...new Set(colors)],
          });
        }
      }
    });
  }
  
  return results;
}

function getAllFiles(dirPath, extensions = []) {
  let results = [];
  if (!fs.existsSync(dirPath)) return results;
  
  const list = fs.readdirSync(dirPath);
  
  for (const file of list) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== 'build') {
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
  console.log('🔍 Recherche des styles inline avec couleurs hardcodées...\n');
  
  const srcDir = path.join(PROJECT_ROOT, 'src');
  const publicDir = path.join(PROJECT_ROOT, 'public/js/dashboard');
  
  const srcResults = findInlineStyles(srcDir);
  const publicResults = findInlineStyles(publicDir);
  
  const allResults = [...srcResults, ...publicResults];
  
  console.log(`📊 Résultats: ${allResults.length} occurrences trouvées\n`);
  
  // Grouper par fichier
  const byFile = {};
  allResults.forEach(result => {
    if (!byFile[result.file]) {
      byFile[result.file] = [];
    }
    byFile[result.file].push(result);
  });
  
  // Afficher les résultats
  Object.entries(byFile).forEach(([file, occurrences]) => {
    console.log(`📄 ${file} (${occurrences.length} occurrences)`);
    occurrences.slice(0, 5).forEach(occ => {
      console.log(`  Ligne ${occ.line}: ${occ.colors.join(', ')}`);
      console.log(`    ${occ.lineContent.substring(0, 80)}...`);
    });
    if (occurrences.length > 5) {
      console.log(`  ... et ${occurrences.length - 5} autres`);
    }
    console.log('');
  });
  
  // Générer un rapport JSON
  const report = {
    total: allResults.length,
    byFile: Object.entries(byFile).map(([file, occs]) => ({
      file,
      count: occs.length,
      occurrences: occs.map(o => ({
        line: o.line,
        colors: o.colors,
      })),
    })),
    summary: {
      filesAffected: Object.keys(byFile).length,
      totalOccurrences: allResults.length,
      uniqueColors: [...new Set(allResults.flatMap(r => r.colors))],
    },
  };
  
  fs.writeFileSync(
    path.join(PROJECT_ROOT, 'docs/inline-styles-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log(`\n✅ Rapport sauvegardé: docs/inline-styles-report.json`);
}

main();
