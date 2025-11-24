/**
 * Script pour ajouter du logging de débogage et s'assurer que les valeurs
 * preview_mode et approved sont bien propagées jusqu'au switch
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Ajout de logging de débogage pour le switch...\n');

// Trouver le node "Parse API Response" qui vient avant "Preview or Send?"
const parseNode = workflow.nodes.find(n => n.name === 'Parse API Response');

if (parseNode) {
  console.log('✅ Node "Parse API Response" trouvé');
  
  // Ajouter du code pour préserver et logger les valeurs preview_mode et approved
  const currentCode = parseNode.parameters.jsCode || '';
  
  // Vérifier si le code préserve déjà preview_mode et approved
  if (!currentCode.includes('preview_mode') || !currentCode.includes('approved')) {
    console.log('⚠️  Le node "Parse API Response" ne préserve pas preview_mode et approved');
    console.log('   Ajout de la préservation de ces valeurs...');
    
    // Ajouter à la fin du code pour préserver les valeurs
    const newCode = currentCode + `
    
// ============================================
// PRÉSERVER preview_mode et approved depuis les nodes de configuration
// ============================================
const configNodes = ['Schedule Config', 'Webhook Config', 'Manual Config', 'Chat Config', 'Workflow Configuration'];
let previewMode = null;
let approved = null;

// Chercher dans les nodes précédents
for (const nodeName of configNodes) {
  try {
    const nodeData = $('${configNodes[0]}').item?.json || $('${configNodes[1]}').item?.json || $('${configNodes[2]}').item?.json || $('${configNodes[3]}').item?.json || $('${configNodes[4]}').item?.json;
    if (nodeData) {
      if (nodeData.preview_mode !== undefined) previewMode = nodeData.preview_mode;
      if (nodeData.approved !== undefined) approved = nodeData.approved;
      break;
    }
  } catch (e) {
    // Continuer si le node n'existe pas
  }
}

// Préserver les valeurs dans le résultat
return items.map(item => ({
  json: {
    ...item.json,
    preview_mode: previewMode !== null ? previewMode : item.json.preview_mode,
    approved: approved !== null ? approved : item.json.approved,
    _debug_preview_mode: previewMode,
    _debug_approved: approved,
    _debug_config_source: previewMode !== null ? 'from_config' : 'from_item'
  }
}));`;
    
    parseNode.parameters.jsCode = newCode;
    console.log('✅ Code de préservation ajouté');
  } else {
    console.log('✅ Le node préserve déjà preview_mode et approved');
  }
}

// Vérifier aussi que le switch utilise bien les bonnes valeurs
const switchNode = workflow.nodes.find(n => n.name === 'Preview or Send?');

if (switchNode) {
  console.log('\n🔀 Vérification du switch "Preview or Send?"...');
  
  // La logique actuelle devrait être correcte, mais on peut améliorer le logging
  const currentLogic = switchNode.parameters.rules.values[1].conditions.boolean[0].value1;
  
  console.log(`   Logique Send actuelle: ${currentLogic}`);
  
  // S'assurer que la logique est correcte
  if (!currentLogic.includes('preview_mode === false') || !currentLogic.includes('approved === true')) {
    console.log('⚠️  La logique du switch peut être améliorée');
  } else {
    console.log('✅ La logique du switch est correcte');
  }
}

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Workflow mis à jour avec logging de débogage !');
console.log('\n💡 Pour déboguer dans n8n:');
console.log('   1. Exécutez le workflow');
console.log('   2. Vérifiez les données dans "Parse API Response"');
console.log('   3. Cherchez _debug_preview_mode et _debug_approved');
console.log('   4. Vérifiez que les valeurs sont correctes avant le switch');

