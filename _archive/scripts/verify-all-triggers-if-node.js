/**
 * Script pour vérifier que TOUS les triggers utilisent correctement le node IF
 * et que les valeurs preview_mode/approved sont bien propagées
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔍 Vérification que tous les triggers utilisent correctement le node IF...\n');

// Trouver le node IF
const ifNode = workflow.nodes.find(n => n.name === 'Should Send Email?' || n.name === 'Preview or Send?');

if (!ifNode) {
  console.error('❌ Node IF "Should Send Email?" non trouvé');
  process.exit(1);
}

console.log(`✅ Node IF trouvé: "${ifNode.name}"`);

// Vérifier tous les triggers et leurs nodes de configuration
const triggers = [
  {
    name: 'Schedule Trigger (7h/12h/16h30 EST)',
    configNode: 'Schedule Config',
    expectedPreviewMode: false,
    expectedApproved: true
  },
  {
    name: 'Webhook Trigger',
    configNode: 'Webhook Config',
    expectedPreviewMode: false,
    expectedApproved: true
  },
  {
    name: 'Manual Trigger (Custom Prompt)',
    configNode: 'Manual Config',
    expectedPreviewMode: true, // Par défaut preview
    expectedApproved: false
  },
  {
    name: 'Chat Trigger (Preview)',
    configNode: 'Chat Config',
    expectedPreviewMode: true,
    expectedApproved: false
  }
];

console.log('\n📋 Vérification de chaque trigger:\n');

let allOk = true;

triggers.forEach(trigger => {
  const triggerNode = workflow.nodes.find(n => n.name === trigger.name);
  const configNode = workflow.nodes.find(n => n.name === trigger.configNode);
  
  if (!triggerNode) {
    console.log(`❌ ${trigger.name}: Trigger non trouvé`);
    allOk = false;
    return;
  }
  
  if (!configNode) {
    console.log(`❌ ${trigger.name}: Node de configuration "${trigger.configNode}" non trouvé`);
    allOk = false;
    return;
  }
  
  // Vérifier les valeurs dans le node de configuration
  const previewModeAssignment = configNode.parameters.assignments.assignments.find(
    a => a.name === 'preview_mode'
  );
  const approvedAssignment = configNode.parameters.assignments.assignments.find(
    a => a.name === 'approved'
  );
  
  const previewMode = previewModeAssignment?.value;
  const approved = approvedAssignment?.value;
  
  // Convertir en boolean pour comparaison
  const previewModeBool = previewMode === true || previewMode === 'true';
  const approvedBool = approved === true || approved === 'true';
  
  const previewModeOk = previewModeBool === trigger.expectedPreviewMode;
  const approvedOk = approvedBool === trigger.expectedApproved;
  
  console.log(`📌 ${trigger.name}:`);
  console.log(`   Config Node: ${trigger.configNode}`);
  console.log(`   preview_mode: ${previewMode} (attendu: ${trigger.expectedPreviewMode}) ${previewModeOk ? '✅' : '❌'}`);
  console.log(`   approved: ${approved} (attendu: ${trigger.expectedApproved}) ${approvedOk ? '✅' : '❌'}`);
  
  if (!previewModeOk || !approvedOk) {
    allOk = false;
  }
  
  // Vérifier la connexion
  const triggerConnections = workflow.connections[trigger.name];
  if (triggerConnections && triggerConnections.main && triggerConnections.main[0]) {
    const nextNode = triggerConnections.main[0][0];
    console.log(`   Connexion: ${trigger.name} → ${nextNode.node} ${nextNode.node === trigger.configNode ? '✅' : '❌'}`);
    
    if (nextNode.node !== trigger.configNode) {
      allOk = false;
    }
  } else {
    console.log(`   ❌ Pas de connexion trouvée`);
    allOk = false;
  }
  
  console.log('');
});

// Vérifier que tous les chemins mènent au node IF
console.log('🔗 Vérification du flux vers le node IF:\n');

const parseNode = workflow.nodes.find(n => n.name === 'Parse API Response');
const debugNode = workflow.nodes.find(n => n.name === 'Debug Before Switch');

if (parseNode) {
  const parseConnections = workflow.connections['Parse API Response'];
  if (parseConnections && parseConnections.main && parseConnections.main[0]) {
    const nextNode = parseConnections.main[0][0];
    console.log(`✅ Parse API Response → ${nextNode.node}`);
    
    if (nextNode.node === 'Debug Before Switch' || nextNode.node === 'Should Send Email?') {
      console.log('   ✅ Le flux va bien vers le node IF');
    } else {
      console.log(`   ⚠️  Le flux va vers ${nextNode.node} au lieu du node IF`);
    }
  }
}

if (debugNode) {
  const debugConnections = workflow.connections['Debug Before Switch'];
  if (debugConnections && debugConnections.main && debugConnections.main[0]) {
    const nextNode = debugConnections.main[0][0];
    console.log(`✅ Debug Before Switch → ${nextNode.node}`);
    
    if (nextNode.node === 'Should Send Email?' || nextNode.node === 'Preview or Send?') {
      console.log('   ✅ Le debug node va bien vers le node IF');
    }
  }
}

// Vérifier la logique du node IF
if (ifNode.type === 'n8n-nodes-base.if') {
  console.log('\n✅ Le node est bien un node IF');
  const condition = ifNode.parameters.conditions?.boolean?.[0]?.value1;
  if (condition) {
    console.log(`   Condition: ${condition.substring(0, 100)}...`);
  }
} else if (ifNode.type === 'n8n-nodes-base.switch') {
  console.log('\n⚠️  Le node est encore un Switch, pas un IF');
  console.log('   Il faut le remplacer par un node IF');
  allOk = false;
}

// Résumé
console.log('\n' + '='.repeat(60));
if (allOk) {
  console.log('✅ Tous les triggers sont correctement configurés !');
} else {
  console.log('⚠️  Certains problèmes ont été détectés');
  console.log('   Vérifiez les messages ci-dessus');
}

console.log('\n📋 Résumé des configurations:');
triggers.forEach(trigger => {
  const configNode = workflow.nodes.find(n => n.name === trigger.configNode);
  if (configNode) {
    const previewMode = configNode.parameters.assignments.assignments.find(a => a.name === 'preview_mode')?.value;
    const approved = configNode.parameters.assignments.assignments.find(a => a.name === 'approved')?.value;
    const willSend = (previewMode === false || previewMode === 'false') && (approved === true || approved === 'true');
    console.log(`   ${trigger.name}: ${willSend ? '✅ Envoi' : '👁️ Preview'}`);
  }
});

// Sauvegarder (même si pas de changement, pour avoir un état propre)
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Vérification terminée !');

