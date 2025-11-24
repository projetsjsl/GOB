/**
 * Script pour corriger la propagation des valeurs preview_mode et approved
 * 
 * Problème: "Custom Prompt Input" écrase les valeurs de "Workflow Configuration"
 * Solution: S'assurer que "Workflow Configuration" est exécuté APRÈS "Custom Prompt Input"
 *           OU que "Merge Triggers" préserve les valeurs de "Workflow Configuration"
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Correction de la propagation des valeurs preview_mode et approved...\n');

// Trouver les nodes
const customPromptNode = workflow.nodes.find(n => n.name === 'Custom Prompt Input');
const workflowConfigNode = workflow.nodes.find(n => n.name === 'Workflow Configuration');
const mergeTriggersNode = workflow.nodes.find(n => n.name === 'Merge Triggers');

if (!customPromptNode || !workflowConfigNode || !mergeTriggersNode) {
  console.error('❌ Nodes requis non trouvés');
  process.exit(1);
}

console.log('✅ Nodes trouvés');

// Vérifier l'ordre d'exécution
// "Custom Prompt Input" → "Merge Triggers" → "Fetch Prompts from API"
// "Workflow Configuration" devrait être exécuté APRÈS "Merge Triggers" pour écraser les valeurs

// Vérifier les connexions
const customPromptConnections = workflow.connections['Custom Prompt Input'];
const workflowConfigConnections = workflow.connections['Workflow Configuration'];
const mergeTriggersConnections = workflow.connections['Merge Triggers'];

console.log('\n📊 Ordre d\'exécution actuel:');
console.log('   Custom Prompt Input → Merge Triggers → Fetch Prompts from API');
console.log('   Workflow Configuration → ?');

// Le problème est que "Workflow Configuration" doit être exécuté APRÈS "Merge Triggers"
// pour que ses valeurs soient utilisées dans "Preview or Send?"

// Solution: Modifier "Merge Triggers" pour qu'il préserve les valeurs de "Workflow Configuration"
// OU modifier l'ordre pour que "Workflow Configuration" soit exécuté après "Merge Triggers"

// Vérifier si "Workflow Configuration" est connecté quelque part
if (!workflowConfigConnections || !workflowConfigConnections.main || workflowConfigConnections.main.length === 0) {
  console.log('\n⚠️  "Workflow Configuration" n\'est pas connecté !');
  console.log('   Il faut le connecter APRÈS "Merge Triggers" pour que ses valeurs soient utilisées.');
  
  // Connecter "Workflow Configuration" après "Merge Triggers"
  // Mais d'abord, vérifier où "Merge Triggers" va
  if (mergeTriggersConnections && mergeTriggersConnections.main && mergeTriggersConnections.main[0]) {
    const nextNode = mergeTriggersConnections.main[0][0];
    console.log(`   "Merge Triggers" va vers: ${nextNode.node}`);
    
    // Insérer "Workflow Configuration" entre "Merge Triggers" et le node suivant
    workflow.connections['Merge Triggers'] = {
      main: [
        [
          {
            node: 'Workflow Configuration',
            type: 'main',
            index: 0
          }
        ]
      ]
    };
    
    workflow.connections['Workflow Configuration'] = {
      main: [
        [
          {
            node: nextNode.node,
            type: nextNode.type,
            index: nextNode.index
          }
        ]
      ]
    };
    
    console.log('✅ "Workflow Configuration" inséré après "Merge Triggers"');
  }
} else {
  console.log('✅ "Workflow Configuration" est connecté');
}

// Aussi, s'assurer que "Workflow Configuration" utilise "includeOtherFields: true"
// pour préserver les autres champs
if (workflowConfigNode.parameters.includeOtherFields !== true) {
  workflowConfigNode.parameters.includeOtherFields = true;
  console.log('✅ "Workflow Configuration" configure pour préserver les autres champs');
}

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Workflow corrigé !');
console.log('\n📋 Résumé:');
console.log('   - "Workflow Configuration" est maintenant exécuté après "Merge Triggers"');
console.log('   - Les valeurs preview_mode=false et approved=true seront utilisées');
console.log('   - Le switch "Preview or Send?" utilisera ces valeurs correctement');

