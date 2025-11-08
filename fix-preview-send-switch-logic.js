/**
 * Script pour corriger la logique du switch "Preview or Send?"
 * 
 * Problème: La condition actuelle permet d'aller vers "send" même si approved=false
 * Solution: La logique doit être:
 * - Preview: preview_mode === true OU approved === false
 * - Send: preview_mode === false ET approved === true
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Correction de la logique du switch "Preview or Send?"...\n');

// Trouver le node "Preview or Send?"
const switchNode = workflow.nodes.find(n => n.name === 'Preview or Send?');

if (!switchNode) {
  console.error('❌ Node "Preview or Send?" non trouvé');
  process.exit(1);
}

console.log('✅ Node "Preview or Send?" trouvé');

// Corriger la logique
// Preview: preview_mode === true OU approved === false
// Send: preview_mode === false ET approved === true

switchNode.parameters.rules.values = [
  {
    conditions: {
      boolean: [
        {
          // Preview si: preview_mode === true OU approved === false
          value1: "={{ $json.preview_mode === true || $json.approved !== true }}",
          value2: true
        }
      ]
    },
    renameOutput: true,
    outputKey: "preview"
  },
  {
    conditions: {
      boolean: [
        {
          // Send si: preview_mode === false ET approved === true
          value1: "={{ $json.preview_mode === false && $json.approved === true }}",
          value2: true
        }
      ]
    },
    renameOutput: true,
    outputKey: "send"
  }
];

console.log('✅ Logique corrigée:');
console.log('   Preview: preview_mode === true || approved !== true');
console.log('   Send: preview_mode === false && approved === true');

// Vérifier aussi que "Custom Prompt Input" n'écrase pas "Workflow Configuration"
const customPromptNode = workflow.nodes.find(n => n.name === 'Custom Prompt Input');
const workflowConfigNode = workflow.nodes.find(n => n.name === 'Workflow Configuration');

if (customPromptNode && workflowConfigNode) {
  console.log('\n⚠️  Vérification des valeurs par défaut...');
  
  // S'assurer que "Custom Prompt Input" utilise les valeurs de "Workflow Configuration"
  // En fait, "Custom Prompt Input" devrait être utilisé uniquement pour les triggers manuels
  // Les triggers automatiques devraient utiliser "Workflow Configuration"
  
  console.log('   "Custom Prompt Input" preview_mode:', customPromptNode.parameters.assignments.assignments.find(a => a.name === 'preview_mode')?.value);
  console.log('   "Custom Prompt Input" approved:', customPromptNode.parameters.assignments.assignments.find(a => a.name === 'approved')?.value);
  console.log('   "Workflow Configuration" preview_mode:', workflowConfigNode.parameters.assignments.assignments.find(a => a.name === 'preview_mode')?.value);
  console.log('   "Workflow Configuration" approved:', workflowConfigNode.parameters.assignments.assignments.find(a => a.name === 'approved')?.value);
  
  // Pour les triggers automatiques, on veut utiliser "Workflow Configuration"
  // Pour les triggers manuels, on peut utiliser "Custom Prompt Input"
  // Le problème est que les valeurs peuvent être écrasées selon l'ordre d'exécution
}

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Workflow corrigé et sauvegardé !');
console.log('\n📋 Prochaines étapes:');
console.log('   1. Réimporter le workflow dans n8n');
console.log('   2. Vérifier que "Workflow Configuration" a:');
console.log('      - preview_mode = false');
console.log('      - approved = true');
console.log('   3. Tester le workflow');

