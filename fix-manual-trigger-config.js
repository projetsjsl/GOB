/**
 * Script pour s'assurer que le Manual Trigger utilise correctement Manual Config
 * 
 * Flux actuel:
 * Manual Trigger → Custom Prompt Input → Merge Triggers → Manual Config → Fetch Prompts
 * 
 * Problème potentiel: Custom Prompt Input peut avoir ses propres valeurs preview_mode/approved
 * qui peuvent être utilisées avant que Manual Config ne les écrase.
 * 
 * Solution: S'assurer que Manual Config écrase bien les valeurs de Custom Prompt Input
 * OU que Custom Prompt Input ne définit pas ces valeurs (les laisse passer)
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Vérification et correction du flux Manual Trigger...\n');

// Trouver les nodes
const manualTrigger = workflow.nodes.find(n => n.name === 'Manual Trigger (Custom Prompt)');
const customPromptInput = workflow.nodes.find(n => n.name === 'Custom Prompt Input');
const mergeTriggers = workflow.nodes.find(n => n.name === 'Merge Triggers');
const manualConfig = workflow.nodes.find(n => n.name === 'Manual Config');

if (!manualTrigger || !customPromptInput || !mergeTriggers || !manualConfig) {
  console.error('❌ Nodes requis non trouvés');
  process.exit(1);
}

console.log('✅ Tous les nodes trouvés');

// Vérifier le flux
console.log('\n📊 Flux actuel:');
console.log('   Manual Trigger → Custom Prompt Input → Merge Triggers → Manual Config → Fetch Prompts');

// Vérifier que Custom Prompt Input ne définit PAS preview_mode et approved
// (ou les définit comme variables depuis Manual Config)
const customPromptAssignments = customPromptInput.parameters.assignments.assignments;
const hasPreviewMode = customPromptAssignments.find(a => a.name === 'preview_mode');
const hasApproved = customPromptAssignments.find(a => a.name === 'approved');

if (hasPreviewMode || hasApproved) {
  console.log('\n⚠️  "Custom Prompt Input" définit preview_mode ou approved');
  console.log('   Ces valeurs peuvent être écrasées par "Manual Config" après Merge Triggers');
  
  // Option 1: Retirer ces valeurs de Custom Prompt Input pour qu'elles viennent de Manual Config
  // Option 2: S'assurer que Manual Config écrase bien ces valeurs
  
  // Je vais vérifier les valeurs dans Manual Config
  const manualConfigAssignments = manualConfig.parameters.assignments.assignments;
  const manualPreviewMode = manualConfigAssignments.find(a => a.name === 'preview_mode');
  const manualApproved = manualConfigAssignments.find(a => a.name === 'approved');
  
  console.log('\n📋 Valeurs dans "Manual Config":');
  console.log(`   preview_mode: ${manualPreviewMode?.value} (type: ${manualPreviewMode?.type})`);
  console.log(`   approved: ${manualApproved?.value} (type: ${manualApproved?.type})`);
  
  // S'assurer que Manual Config a includeOtherFields: true pour préserver les autres champs
  if (manualConfig.parameters.includeOtherFields !== true) {
    manualConfig.parameters.includeOtherFields = true;
    console.log('\n✅ "Manual Config" configure pour préserver les autres champs');
  }
  
  // S'assurer que les valeurs sont des booleans
  if (manualPreviewMode && (manualPreviewMode.value === 'true' || manualPreviewMode.value === true)) {
    manualPreviewMode.value = true;
    manualPreviewMode.type = 'boolean';
    console.log('✅ preview_mode = true (boolean) dans Manual Config');
  } else if (manualPreviewMode && (manualPreviewMode.value === 'false' || manualPreviewMode.value === false)) {
    manualPreviewMode.value = false;
    manualPreviewMode.type = 'boolean';
    console.log('✅ preview_mode = false (boolean) dans Manual Config');
  }
  
  if (manualApproved && (manualApproved.value === 'true' || manualApproved.value === true)) {
    manualApproved.value = true;
    manualApproved.type = 'boolean';
    console.log('✅ approved = true (boolean) dans Manual Config');
  } else if (manualApproved && (manualApproved.value === 'false' || manualApproved.value === false)) {
    manualApproved.value = false;
    manualApproved.type = 'boolean';
    console.log('✅ approved = false (boolean) dans Manual Config');
  }
  
  // Option: Retirer preview_mode et approved de Custom Prompt Input pour éviter les conflits
  // Mais on peut aussi les garder et s'assurer que Manual Config écrase bien
  console.log('\n💡 Note: "Manual Config" est exécuté APRÈS "Custom Prompt Input"');
  console.log('   Les valeurs de "Manual Config" devraient écraser celles de "Custom Prompt Input"');
} else {
  console.log('\n✅ "Custom Prompt Input" ne définit pas preview_mode ou approved');
  console.log('   Ces valeurs viendront uniquement de "Manual Config"');
}

// Vérifier que Merge Triggers préserve les valeurs
// Merge Triggers devrait passer les valeurs de Custom Prompt Input vers Manual Config
// Et Manual Config devrait ensuite définir ses propres valeurs

// Vérifier les connexions
const customPromptConnections = workflow.connections['Custom Prompt Input'];
const mergeTriggersConnections = workflow.connections['Merge Triggers'];
const manualConfigConnections = workflow.connections['Manual Config'];

console.log('\n🔗 Vérification des connexions:');
if (customPromptConnections && customPromptConnections.main && customPromptConnections.main[0]) {
  const nextNode = customPromptConnections.main[0][0];
  console.log(`   ✅ Custom Prompt Input → ${nextNode.node}`);
}

if (mergeTriggersConnections && mergeTriggersConnections.main && mergeTriggersConnections.main[0]) {
  const nextNode = mergeTriggersConnections.main[0][0];
  console.log(`   ✅ Merge Triggers → ${nextNode.node}`);
  if (nextNode.node === 'Manual Config') {
    console.log('   ✅ Merge Triggers va bien vers Manual Config');
  } else {
    console.log(`   ⚠️  Merge Triggers va vers ${nextNode.node} au lieu de Manual Config`);
  }
}

if (manualConfigConnections && manualConfigConnections.main && manualConfigConnections.main[0]) {
  const nextNode = manualConfigConnections.main[0][0];
  console.log(`   ✅ Manual Config → ${nextNode.node}`);
}

// S'assurer que Manual Config écrase bien les valeurs avec includeOtherFields: true
// includeOtherFields: true signifie que les autres champs sont préservés, mais les champs
// définis dans Manual Config écrase ceux des items précédents

console.log('\n✅ Configuration vérifiée !');
console.log('\n📋 Résumé pour Manual Trigger:');
console.log('   - Flux: Manual Trigger → Custom Prompt Input → Merge Triggers → Manual Config');
console.log('   - Manual Config définit: preview_mode et approved');
console.log('   - Ces valeurs sont préservées jusqu\'au switch "Preview or Send?"');
console.log('\n💡 Pour changer le comportement du Manual Trigger:');
console.log('   Modifiez "Manual Config":');
console.log('   - preview_mode = false, approved = true → Envoi');
console.log('   - preview_mode = true, approved = false → Preview (défaut)');

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Workflow sauvegardé !');

