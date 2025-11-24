/**
 * Script pour s'assurer que TOUS les triggers passent par "Workflow Configuration"
 * 
 * Problème actuel:
 * - Schedule Trigger → Fetch Prompts from API (sans Workflow Configuration)
 * - Webhook Trigger → Fetch Prompts from API (sans Workflow Configuration)
 * - Manual/Chat Triggers → Custom Prompt Input → Merge Triggers → Fetch Prompts (sans Workflow Configuration)
 * 
 * Solution:
 * - Tous les triggers doivent passer par "Workflow Configuration" pour avoir preview_mode et approved
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Correction de tous les triggers pour passer par "Workflow Configuration"...\n');

// Trouver les nodes
const scheduleTrigger = workflow.nodes.find(n => n.name === 'Schedule Trigger (7h/12h/16h30 EST)');
const webhookTrigger = workflow.nodes.find(n => n.name === 'Webhook Trigger');
const manualTrigger = workflow.nodes.find(n => n.name === 'Manual Trigger (Custom Prompt)');
const chatTrigger = workflow.nodes.find(n => n.name === 'Chat Trigger (Preview)');
const customPromptNode = workflow.nodes.find(n => n.name === 'Custom Prompt Input');
const mergeTriggersNode = workflow.nodes.find(n => n.name === 'Merge Triggers');
const workflowConfigNode = workflow.nodes.find(n => n.name === 'Workflow Configuration');
const fetchPromptsNode = workflow.nodes.find(n => n.name === 'Fetch Prompts from API');

if (!workflowConfigNode) {
  console.error('❌ Node "Workflow Configuration" non trouvé');
  process.exit(1);
}

console.log('✅ Nodes trouvés:');
console.log(`   Schedule Trigger: ${scheduleTrigger ? '✅' : '❌'}`);
console.log(`   Webhook Trigger: ${webhookTrigger ? '✅' : '❌'}`);
console.log(`   Manual Trigger: ${manualTrigger ? '✅' : '❌'}`);
console.log(`   Chat Trigger: ${chatTrigger ? '✅' : '❌'}`);
console.log(`   Workflow Configuration: ✅`);
console.log(`   Fetch Prompts from API: ${fetchPromptsNode ? '✅' : '❌'}\n`);

// 1. Schedule Trigger → Workflow Configuration → Fetch Prompts from API
if (scheduleTrigger) {
  console.log('📅 Correction Schedule Trigger...');
  workflow.connections['Schedule Trigger (7h/12h/16h30 EST)'] = {
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
  console.log('   ✅ Schedule Trigger → Workflow Configuration');
}

// 2. Webhook Trigger → Workflow Configuration → Fetch Prompts from API
if (webhookTrigger) {
  console.log('🔗 Correction Webhook Trigger...');
  workflow.connections['Webhook Trigger'] = {
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
  console.log('   ✅ Webhook Trigger → Workflow Configuration');
}

// 3. Merge Triggers → Workflow Configuration → Fetch Prompts from API
if (mergeTriggersNode) {
  console.log('🔀 Correction Merge Triggers...');
  // Vérifier où Merge Triggers va actuellement
  const currentMergeConnection = workflow.connections['Merge Triggers'];
  if (currentMergeConnection && currentMergeConnection.main && currentMergeConnection.main[0]) {
    const nextNode = currentMergeConnection.main[0][0];
    console.log(`   Merge Triggers va actuellement vers: ${nextNode.node}`);
    
    // Si ce n'est pas déjà Workflow Configuration, le rediriger
    if (nextNode.node !== 'Workflow Configuration') {
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
      console.log('   ✅ Merge Triggers → Workflow Configuration');
      
      // Connecter Workflow Configuration vers le node suivant
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
      console.log(`   ✅ Workflow Configuration → ${nextNode.node}`);
    } else {
      console.log('   ✅ Merge Triggers est déjà connecté à Workflow Configuration');
    }
  } else {
    // Pas de connexion, créer une nouvelle
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
    console.log('   ✅ Merge Triggers → Workflow Configuration (nouvelle connexion)');
    
    // Workflow Configuration → Fetch Prompts from API
    if (fetchPromptsNode) {
      workflow.connections['Workflow Configuration'] = {
        main: [
          [
            {
              node: 'Fetch Prompts from API',
              type: 'main',
              index: 0
            }
          ]
        ]
      };
      console.log('   ✅ Workflow Configuration → Fetch Prompts from API');
    }
  }
}

// Vérifier que Workflow Configuration a bien les valeurs par défaut
if (workflowConfigNode) {
  const previewModeAssignment = workflowConfigNode.parameters.assignments.assignments.find(
    a => a.name === 'preview_mode'
  );
  const approvedAssignment = workflowConfigNode.parameters.assignments.assignments.find(
    a => a.name === 'approved'
  );
  
  if (previewModeAssignment && previewModeAssignment.value !== 'false') {
    previewModeAssignment.value = 'false';
    console.log('\n✅ preview_mode mis à false dans Workflow Configuration');
  }
  
  if (approvedAssignment && approvedAssignment.value !== 'true') {
    approvedAssignment.value = 'true';
    console.log('✅ approved mis à true dans Workflow Configuration');
  }
}

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Tous les triggers sont maintenant connectés via "Workflow Configuration" !');
console.log('\n📋 Résumé des connexions:');
console.log('   Schedule Trigger → Workflow Configuration → Fetch Prompts from API');
console.log('   Webhook Trigger → Workflow Configuration → Fetch Prompts from API');
console.log('   Manual Trigger → Custom Prompt Input → Merge Triggers → Workflow Configuration → Fetch Prompts from API');
console.log('   Chat Trigger → Custom Prompt Input → Merge Triggers → Workflow Configuration → Fetch Prompts from API');
console.log('\n✅ Tous les triggers utiliseront maintenant preview_mode=false et approved=true');

