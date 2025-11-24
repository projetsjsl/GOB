/**
 * Script pour mettre à jour toutes les URLs dans le workflow n8n
 * Remplace toutes les occurrences de gob.vercel.app et gob-git-main par gob-projetsjsls-projects.vercel.app
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const workflowPath = join(__dirname, 'n8n-workflow-03lgcA4e9uRTtli1.json');
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔍 Recherche des URLs à corriger dans le workflow n8n...\n');

let replacements = 0;

// Parcourir tous les nodes
workflow.nodes.forEach(node => {
  // Vérifier les paramètres URL
  if (node.parameters && node.parameters.url) {
    const url = node.parameters.url;
    
    // Remplacer gob.vercel.app
    if (url.includes('gob.vercel.app')) {
      node.parameters.url = url.replace(/gob\.vercel\.app/g, 'gob-projetsjsls-projects.vercel.app');
      console.log(`✅ ${node.name}: gob.vercel.app → gob-projetsjsls-projects.vercel.app`);
      replacements++;
    }
    
    // Remplacer gob-git-main-projetsjsls-projects.vercel.app
    if (url.includes('gob-git-main-projetsjsls-projects.vercel.app')) {
      node.parameters.url = url.replace(/gob-git-main-projetsjsls-projects\.vercel\.app/g, 'gob-projetsjsls-projects.vercel.app');
      console.log(`✅ ${node.name}: gob-git-main → gob-projetsjsls-projects.vercel.app`);
      replacements++;
    }
  }
  
  // Vérifier le code JavaScript dans les Code nodes
  if (node.parameters && node.parameters.jsCode) {
    const code = node.parameters.jsCode;
    let newCode = code;
    
    if (code.includes('gob.vercel.app')) {
      newCode = newCode.replace(/gob\.vercel\.app/g, 'gob-projetsjsls-projects.vercel.app');
      console.log(`✅ ${node.name} (Code): gob.vercel.app → gob-projetsjsls-projects.vercel.app`);
      replacements++;
    }
    
    if (code.includes('gob-git-main-projetsjsls-projects.vercel.app')) {
      newCode = newCode.replace(/gob-git-main-projetsjsls-projects\.vercel\.app/g, 'gob-projetsjsls-projects.vercel.app');
      console.log(`✅ ${node.name} (Code): gob-git-main → gob-projetsjsls-projects.vercel.app`);
      replacements++;
    }
    
    if (newCode !== code) {
      node.parameters.jsCode = newCode;
    }
  }
});

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log(`\n✅ Workflow n8n mis à jour !`);
console.log(`   - ${replacements} remplacement${replacements > 1 ? 's' : ''} effectué${replacements > 1 ? 's' : ''}`);
console.log(`\n📝 Fichier sauvegardé: n8n-workflow-03lgcA4e9uRTtli1.json`);

